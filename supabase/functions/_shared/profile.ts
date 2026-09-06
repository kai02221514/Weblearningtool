export const DISPLAY_NAME_MAX_LENGTH = 50 as const

export interface Profile {
  displayName: string
  createdAt: string
  updatedAt: string
}

export type DisplayNameValidationResult =
  | { success: true; displayName: string }
  | { success: false; reason: 'type' | 'empty' | 'too-long' | 'control-character' }

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f-\u009f]/u

function codePointLength(value: string): number {
  return Array.from(value).length
}

export function validateDisplayName(value: unknown): DisplayNameValidationResult {
  if (typeof value !== 'string') {
    return { success: false, reason: 'type' }
  }

  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    return { success: false, reason: 'control-character' }
  }

  const displayName = value.trim()
  if (displayName.length === 0) {
    return { success: false, reason: 'empty' }
  }

  if (codePointLength(displayName) > DISPLAY_NAME_MAX_LENGTH) {
    return { success: false, reason: 'too-long' }
  }

  return { success: true, displayName }
}

export function validateDisplayNameRequest(
  value: unknown,
): DisplayNameValidationResult {
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
    || Object.keys(value).length !== 1
    || !('displayName' in value)
  ) {
    return { success: false, reason: 'type' }
  }

  return validateDisplayName(value.displayName)
}

export function validateStoredProfile(value: unknown): Profile | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const displayName = validateDisplayName(record.displayName)
  if (
    !displayName.success
    || displayName.displayName !== record.displayName
    || typeof record.createdAt !== 'string'
    || typeof record.updatedAt !== 'string'
    || !Number.isFinite(Date.parse(record.createdAt))
    || !Number.isFinite(Date.parse(record.updatedAt))
  ) {
    return null
  }

  return {
    displayName: displayName.displayName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}
