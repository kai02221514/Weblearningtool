import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";
import {
  CURRENT_DIAGNOSIS_VERSION,
  validateDiagnosisSaveRequest,
  validateStoredDiagnosis,
  type StoredDiagnosis,
} from "../_shared/diagnosis.ts";

const app = new Hono();
const FUNCTION_NAME = "make-server-f3d88633"

interface ServerConfig {
  supabaseUrl: string
  serviceRoleKey: string
  anonKey: string
}

class ServerConfigError extends Error {
  variables: string[]

  constructor(variables: string[]) {
    super(`Supabaseサーバー設定が不足しています: ${variables.join(", ")}`)
    this.variables = variables
  }
}

function readEnv(name: string): string {
  return Deno.env.get(name)?.trim() ?? ""
}

function getServerConfig(
  options: { requireAnonKey?: boolean; requireServiceRole?: boolean } = {},
): ServerConfig {
  const supabaseUrl = readEnv("SUPABASE_URL")
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = readEnv("SUPABASE_ANON_KEY")
  const missingVariables = [
    !supabaseUrl && "SUPABASE_URL",
    options.requireServiceRole && !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    options.requireAnonKey && !anonKey && "SUPABASE_ANON_KEY",
  ].filter((value): value is string => Boolean(value))

  if (missingVariables.length > 0) {
    throw new ServerConfigError(missingVariables)
  }

  return { supabaseUrl, serviceRoleKey, anonKey }
}

function createAdminClient(config: ServerConfig) {
  return createClient(config.supabaseUrl, config.serviceRoleKey)
}

function createPublicClient(config: ServerConfig & { anonKey: string }) {
  return createClient(config.supabaseUrl, config.anonKey)
}

function createUserClient(config: ServerConfig & { anonKey: string }, accessToken: string) {
  return createClient(config.supabaseUrl, config.anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function serverConfigErrorResponse(c: { json: (body: { error: string }, status: 500) => Response }, error: unknown) {
  if (error instanceof ServerConfigError) {
    return c.json({ error: error.message }, 500)
  }

  return null
}

function isUserRecord(value: unknown): value is { name: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  )
}

function getUserNameFromMetadata(value: unknown): string | null {
  if (
    typeof value !== "object"
    || value === null
    || !("name" in value)
    || typeof value.name !== "string"
  ) {
    return null
  }

  const name = value.name.trim()
  return name || null
}

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}

function toStoredDiagnosis(row: Record<string, unknown>): StoredDiagnosis | null {
  return validateStoredDiagnosis({
    answers: {
      programming_experience: row.programming_experience,
      rule_confidence: row.rule_confidence,
      knowledge_concept: row.knowledge_concept,
    },
    diagnosisVersion: row.diagnosis_version,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  })
}

async function authenticateDiagnosisRequest(c: { req: { header: (name: string) => string | undefined } }) {
  const accessToken = getBearerToken(c.req.header("Authorization"))
  if (!accessToken) return null

  const config = getServerConfig({ requireAnonKey: true })
  const publicClient = createPublicClient(config)
  const { data: { user }, error } = await publicClient.auth.getUser(accessToken)

  if (error || !user) return null

  return {
    user,
    userClient: createUserClient(config, accessToken),
  }
}

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
    allowMethods: ["POST", "PUT", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/signup", async (c) => {
  try {
    const config = getServerConfig({ requireServiceRole: true })
    const adminClient = createAdminClient(config)
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "すべてのフィールドが必要です" }, 400);
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) {
      console.log(`サインアップエラー: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "ユーザー作成結果を確認できません" }, 500);
    }

    await kv.set(`user:${data.user.id}`, {
      email,
      name,
      createdAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
      name,
    });
  } catch (error) {
    const configResponse = serverConfigErrorResponse(c, error)
    if (configResponse) return configResponse

    console.log(`サインアップ処理エラー: ${error}`);
    return c.json({ error: "サインアップに失敗しました" }, 500);
  }
});

app.post("/signin", async (c) => {
  try {
    const config = getServerConfig({ requireAnonKey: true })
    const publicClient = createPublicClient(config)
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "メールアドレスとパスワードが必要です" }, 400);
    }

    const { data, error } = await publicClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.log(`サインインエラー: ${error?.message ?? "session not returned"}`);
      return c.json({ error: "メールアドレスまたはパスワードが正しくありません" }, 401);
    }

    let userData: unknown = null
    try {
      userData = await kv.get(`user:${data.user.id}`)
    } catch (error) {
      console.log(`ユーザー表示名取得エラー: ${error instanceof Error ? error.name : "unknown"}`)
    }

    const name = isUserRecord(userData)
      ? userData.name
      : getUserNameFromMetadata(data.user.user_metadata) ?? "ユーザー"

    return c.json({
      success: true,
      accessToken: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
      name,
    });
  } catch (error) {
    const configResponse = serverConfigErrorResponse(c, error)
    if (configResponse) return configResponse

    console.log(`サインイン処理エラー: ${error}`);
    return c.json({ error: "サインインに失敗しました" }, 500);
  }
});

app.post("/profile", async (c) => {
  try {
    const config = getServerConfig({ requireAnonKey: true })
    const publicClient = createPublicClient(config)
    const accessToken = c.req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: { user }, error } = await publicClient.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { age, occupation, pace, level, levelScore } = await c.req.json();

    await kv.set(`profile:${user.id}`, {
      age,
      occupation,
      pace,
      level,
      levelScore,
      updatedAt: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    const configResponse = serverConfigErrorResponse(c, error)
    if (configResponse) return configResponse

    console.log(`プロファイル保存エラー: ${error}`);
    return c.json({ error: "プロファイルの保存に失敗しました" }, 500);
  }
});

app.get("/diagnosis", async (c) => {
  try {
    if (Object.keys(c.req.query()).length > 0) {
      return c.json({ error: "診断取得要求の形式が正しくありません" }, 400)
    }

    const authenticated = await authenticateDiagnosisRequest(c)
    if (!authenticated) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const { data, error } = await authenticated.userClient
      .from("user_diagnoses")
      .select("programming_experience, rule_confidence, knowledge_concept, diagnosis_version, completed_at, updated_at")
      .eq("user_id", authenticated.user.id)
      .maybeSingle()

    if (error) {
      console.log(`診断取得DBエラー: ${error.code ?? "unknown"}`)
      return c.json({ error: "診断状態の取得に失敗しました" }, 500)
    }

    if (!data) {
      return c.json({ status: "incomplete", reason: "missing" })
    }

    const diagnosis = toStoredDiagnosis(data)
    if (!diagnosis) {
      return c.json({ status: "incomplete", reason: "incompatible" })
    }

    return c.json({ status: "complete", diagnosis })
  } catch (error) {
    console.log(`診断取得処理エラー: ${error instanceof Error ? error.name : "unknown"}`)
    return c.json({ error: "診断状態の取得に失敗しました" }, 500)
  }
});

app.put("/diagnosis", async (c) => {
  try {
    const authenticated = await authenticateDiagnosisRequest(c)
    if (!authenticated) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "診断回答の形式が正しくありません" }, 400)
    }

    const validation = validateDiagnosisSaveRequest(body)
    if (!validation.success) {
      return c.json({ error: "診断回答の形式が正しくありません" }, 400)
    }

    const { data, error } = await authenticated.userClient
      .from("user_diagnoses")
      .upsert({
        user_id: authenticated.user.id,
        programming_experience: validation.data.programming_experience,
        rule_confidence: validation.data.rule_confidence,
        knowledge_concept: validation.data.knowledge_concept,
        diagnosis_version: CURRENT_DIAGNOSIS_VERSION,
      }, { onConflict: "user_id" })
      .select("programming_experience, rule_confidence, knowledge_concept, diagnosis_version, completed_at, updated_at")
      .single()

    if (error) {
      console.log(`診断保存DBエラー: ${error.code ?? "unknown"}`)
      return c.json({ error: "診断の保存に失敗しました" }, 500)
    }

    const diagnosis = toStoredDiagnosis(data)
    if (!diagnosis) {
      console.log("診断保存応答エラー: stored row did not satisfy the diagnosis contract")
      return c.json({ error: "診断の保存に失敗しました" }, 500)
    }

    return c.json({ success: true, status: "complete", diagnosis })
  } catch (error) {
    console.log(`診断保存処理エラー: ${error instanceof Error ? error.name : "unknown"}`)
    return c.json({ error: "診断の保存に失敗しました" }, 500)
  }
});

function normalizeFunctionRequest(request: Request): Request {
  const url = new URL(request.url)
  const prefixes = [
    `/functions/v1/${FUNCTION_NAME}`,
    `/${FUNCTION_NAME}`,
  ]

  for (const prefix of prefixes) {
    if (url.pathname === prefix) {
      url.pathname = "/"
      break
    }

    if (url.pathname.startsWith(`${prefix}/`)) {
      url.pathname = url.pathname.slice(prefix.length)
      break
    }
  }

  if (url.toString() === request.url) return request

  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? null : request.body,
    redirect: request.redirect,
  })
}

Deno.serve((request) => app.fetch(normalizeFunctionRequest(request)));
