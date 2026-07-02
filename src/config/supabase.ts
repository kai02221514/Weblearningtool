const supabaseUrl = readEnvString(import.meta.env.VITE_SUPABASE_URL)
const supabasePublishableKey = readEnvString(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
const supabaseFunctionName =
  readEnvString(import.meta.env.VITE_SUPABASE_FUNCTION_NAME) || 'make-server-f3d88633'

function readEnvString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey
export const SUPABASE_FUNCTION_NAME = supabaseFunctionName
export const SUPABASE_FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/${SUPABASE_FUNCTION_NAME}`

export function validateSupabaseConfig(): void {
  const missingVariables = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ].filter((value): value is string => Boolean(value))

  if (missingVariables.length > 0) {
    throw new Error(
      `Supabase接続設定が不足しています: ${missingVariables.join(', ')}`,
    )
  }
}
