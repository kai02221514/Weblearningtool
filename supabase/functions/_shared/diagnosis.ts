export const CURRENT_DIAGNOSIS_VERSION = 'diagnosis-k/v1' as const
export const COMPATIBLE_DIAGNOSIS_VERSIONS = [CURRENT_DIAGNOSIS_VERSION] as const

export const PROGRAMMING_EXPERIENCE_VALUES = ['yes', 'no'] as const
export const RULE_CONFIDENCE_VALUES = ['none', 'low', 'partial', 'confident'] as const
export const KNOWLEDGE_CONCEPT_VALUES = ['visual_only', 'unknown', 'somewhat', 'structure_style'] as const

export type ProgrammingExperience = typeof PROGRAMMING_EXPERIENCE_VALUES[number]
export type RuleConfidence = typeof RULE_CONFIDENCE_VALUES[number]
export type KnowledgeConcept = typeof KNOWLEDGE_CONCEPT_VALUES[number]

export interface DiagnosisAnswers {
  programming_experience: ProgrammingExperience
  rule_confidence: RuleConfidence
  knowledge_concept: KnowledgeConcept
}

export interface StoredDiagnosis {
  answers: DiagnosisAnswers
  diagnosisVersion: string
  completedAt: string
  updatedAt: string
}

export type DiagnosisReadResult =
  | { status: 'complete'; diagnosis: StoredDiagnosis }
  | { status: 'incomplete'; reason: 'missing' | 'incompatible' }

export type DiagnosisAnswersValidation =
  | { success: true; data: DiagnosisAnswers }
  | { success: false }

const ANSWER_KEYS = [
  'programming_experience',
  'rule_confidence',
  'knowledge_concept',
] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, expectedKeys: readonly string[]): boolean {
  const keys = Object.keys(value)
  return keys.length === expectedKeys.length && keys.every(key => expectedKeys.includes(key))
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/.test(value)
    && Number.isFinite(Date.parse(value))
}

export function validateDiagnosisAnswers(value: unknown): DiagnosisAnswersValidation {
  if (!isPlainObject(value) || !hasExactKeys(value, ANSWER_KEYS)) {
    return { success: false }
  }

  if (
    !isOneOf(value.programming_experience, PROGRAMMING_EXPERIENCE_VALUES)
    || !isOneOf(value.rule_confidence, RULE_CONFIDENCE_VALUES)
    || !isOneOf(value.knowledge_concept, KNOWLEDGE_CONCEPT_VALUES)
  ) {
    return { success: false }
  }

  return {
    success: true,
    data: {
      programming_experience: value.programming_experience,
      rule_confidence: value.rule_confidence,
      knowledge_concept: value.knowledge_concept,
    },
  }
}

export function validateDiagnosisSaveRequest(value: unknown): DiagnosisAnswersValidation {
  if (!isPlainObject(value) || !hasExactKeys(value, ['answers'])) {
    return { success: false }
  }

  return validateDiagnosisAnswers(value.answers)
}

export function isCompatibleDiagnosisVersion(value: unknown): value is string {
  return typeof value === 'string'
    && COMPATIBLE_DIAGNOSIS_VERSIONS.includes(value as typeof CURRENT_DIAGNOSIS_VERSION)
}

export function validateStoredDiagnosis(value: unknown): StoredDiagnosis | null {
  if (!isPlainObject(value)) return null

  const answers = validateDiagnosisAnswers(value.answers)
  if (
    !answers.success
    || !isCompatibleDiagnosisVersion(value.diagnosisVersion)
    || !isIsoDate(value.completedAt)
    || !isIsoDate(value.updatedAt)
  ) {
    return null
  }

  return {
    answers: answers.data,
    diagnosisVersion: value.diagnosisVersion,
    completedAt: value.completedAt,
    updatedAt: value.updatedAt,
  }
}
