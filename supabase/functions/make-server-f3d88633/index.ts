import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

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

function getServerConfig(options: { requireAnonKey?: boolean } = {}): ServerConfig {
  const supabaseUrl = readEnv("SUPABASE_URL")
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = readEnv("SUPABASE_ANON_KEY")
  const missingVariables = [
    !supabaseUrl && "SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
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

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/signup", async (c) => {
  try {
    const config = getServerConfig()
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

    const userData = await kv.get(`user:${data.user.id}`);

    return c.json({
      success: true,
      accessToken: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
      name: isUserRecord(userData) ? userData.name : "ユーザー",
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
