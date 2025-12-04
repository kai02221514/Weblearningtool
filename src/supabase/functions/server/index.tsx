import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f3d88633/health", (c) => {
  return c.json({ status: "ok" });
});

// サインアップエンドポイント
app.post("/make-server-f3d88633/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'すべてのフィールドが必要です' }, 400);
    }

    // Supabase Authでユーザー作成
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`サインアップエラー: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // ユーザー情報をKVストアに保存
    await kv.set(`user:${data.user.id}`, {
      email,
      name,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      userId: data.user.id,
      email: data.user.email,
      name
    });
  } catch (error) {
    console.log(`サインアップ処理エラー: ${error}`);
    return c.json({ error: 'サインアップに失敗しました' }, 500);
  }
});

// サインインエンドポイント
app.post("/make-server-f3d88633/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'メールアドレスとパスワードが必要です' }, 400);
    }

    // Supabase Authでサインイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`サインインエラー: ${error.message}`);
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401);
    }

    // ユーザー情報を取得
    const userData = await kv.get(`user:${data.user.id}`);

    return c.json({ 
      success: true, 
      accessToken: data.session.access_token,
      userId: data.user.id,
      email: data.user.email,
      name: userData?.name || 'ユーザー'
    });
  } catch (error) {
    console.log(`サインイン処理エラー: ${error}`);
    return c.json({ error: 'サインインに失敗しました' }, 500);
  }
});

// ユーザープロファイル保存エンドポイント
app.post("/make-server-f3d88633/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // アクセストークンを検証
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { age, occupation, pace, level, levelScore } = await c.req.json();

    // プロファイル情報を保存
    await kv.set(`profile:${user.id}`, {
      age,
      occupation,
      pace,
      level,
      levelScore,
      updatedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`プロファイル保存エラー: ${error}`);
    return c.json({ error: 'プロファイルの保存に失敗しました' }, 500);
  }
});

Deno.serve(app.fetch);