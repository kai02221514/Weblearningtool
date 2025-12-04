import { projectId, publicAnonKey } from './supabase/info'

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f3d88633`

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

export async function signup(data: SignupData) {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'サインアップに失敗しました')
  }

  return result
}

export async function signin(data: SigninData) {
  const response = await fetch(`${API_URL}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'サインインに失敗しました')
  }

  return result
}

export async function saveProfile(data: ProfileData, accessToken: string) {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'プロファイルの保存に失敗しました')
  }

  return result
}
