import {
  SUPABASE_FUNCTION_URL,
  SUPABASE_PUBLISHABLE_KEY,
  validateSupabaseConfig,
} from '../config/supabase'

export interface SignupData {
  email: string
  password: string
  name: string
}

export interface SigninData {
  email: string
  password: string
}

export interface ProfileData {
  age: string
  occupation: string
  pace: string
  level: string
  levelScore: number
}

interface SignupResponse {
  success: boolean
  userId: string
  email?: string
  name?: string
}

interface SigninResponse {
  success: boolean
  accessToken: string
  userId: string
  email?: string
  name: string
}

interface ApiPayload {
  error?: unknown
  [key: string]: unknown
}

async function parseResponse(response: Response): Promise<ApiPayload> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const payload: unknown = await response.json()
      return isApiPayload(payload)
        ? payload
        : { error: `Supabase Edge Function returned HTTP ${response.status}` }
    } catch {
      return { error: `Supabase Edge Function returned invalid JSON with HTTP ${response.status}` }
    }
  }

  const text = await response.text()
  const isHtml = contentType.includes('text/html') || text.trim().startsWith('<')

  return {
    error: isHtml || !text
      ? `Supabase Edge Function returned HTTP ${response.status}`
      : text,
  }
}

function isApiPayload(payload: unknown): payload is ApiPayload {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
}

function getErrorMessage(payload: ApiPayload, fallback: string): string {
  return typeof payload.error === 'string' && payload.error
    ? payload.error
    : fallback
}

async function requestEdgeFunction<T>(
  path: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  validateSupabaseConfig()

  let response: Response

  try {
    response = await fetch(`${SUPABASE_FUNCTION_URL}${path}`, init)
  } catch {
    throw new Error(
      'Supabaseへ接続できません。接続先URL、ネットワーク、Edge Functionのデプロイ状態を確認してください。',
    )
  }

  const result = await parseResponse(response)

  if (!response.ok) {
    throw new Error(`${getErrorMessage(result, fallbackError)} (HTTP ${response.status})`)
  }

  return result as T
}

export async function signup(data: SignupData) {
  return requestEdgeFunction<SignupResponse>('/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(data),
  }, 'サインアップに失敗しました')
}

export async function signin(data: SigninData) {
  return requestEdgeFunction<SigninResponse>('/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(data),
  }, 'サインインに失敗しました')
}

export async function saveProfile(data: ProfileData, accessToken: string) {
  return requestEdgeFunction<{ success: boolean }>('/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  }, 'プロファイルの保存に失敗しました')
}
