import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

function readEnv(name: string): string {
  return Deno.env.get(name)?.trim() ?? ""
}

function createServiceClient() {
  const supabaseUrl = readEnv("SUPABASE_URL")
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY")
  const missingVariables = [
    !supabaseUrl && "SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((value): value is string => Boolean(value))

  if (missingVariables.length > 0) {
    throw new Error(`Supabaseサーバー設定が不足しています: ${missingVariables.join(", ")}`)
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

export const set = async (key: string, value: unknown): Promise<void> => {
  const supabase = createServiceClient()
  const { error } = await supabase.from("kv_store_f3d88633").upsert({
    key,
    value,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const get = async (key: string): Promise<unknown> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from("kv_store_f3d88633").select("value").eq("key", key).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

export const del = async (key: string): Promise<void> => {
  const supabase = createServiceClient()
  const { error } = await supabase.from("kv_store_f3d88633").delete().eq("key", key);
  if (error) {
    throw new Error(error.message);
  }
};

export const mset = async (keys: string[], values: unknown[]): Promise<void> => {
  const supabase = createServiceClient()
  const { error } = await supabase.from("kv_store_f3d88633").upsert(keys.map((key, index) => ({
    key,
    value: values[index],
  })));
  if (error) {
    throw new Error(error.message);
  }
};

export const mget = async (keys: string[]): Promise<unknown[]> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from("kv_store_f3d88633").select("value").in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((item) => item.value) ?? [];
};

export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = createServiceClient()
  const { error } = await supabase.from("kv_store_f3d88633").delete().in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
};

export const getByPrefix = async (prefix: string): Promise<unknown[]> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from("kv_store_f3d88633").select("key, value").like("key", `${prefix}%`);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((item) => item.value) ?? [];
};
