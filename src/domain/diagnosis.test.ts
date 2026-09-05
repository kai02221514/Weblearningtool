import { describe, expect, it } from 'vitest'
import {
  CURRENT_DIAGNOSIS_VERSION,
  isCompatibleDiagnosisVersion,
  validateDiagnosisAnswers,
  validateDiagnosisSaveRequest,
  validateStoredDiagnosis,
} from '../../supabase/functions/_shared/diagnosis'

const answers = {
  programming_experience: 'yes',
  rule_confidence: 'partial',
  knowledge_concept: 'somewhat',
}

describe('diagnosis contract', () => {
  it('accepts exactly the three valid K-group answers', () => {
    expect(validateDiagnosisAnswers(answers)).toEqual({ success: true, data: answers })
    expect(validateDiagnosisSaveRequest({ answers })).toEqual({ success: true, data: answers })
  })

  it.each([
    {},
    null,
    [],
    { ...answers, programming_experience: 'maybe' },
    { ...answers, rule_confidence: 'high' },
    { ...answers, knowledge_concept: 'expert' },
    { ...answers, programming_experience: null },
    { ...answers, rule_confidence: 1 },
    { ...answers, extra: 'not-persisted' },
  ])('rejects missing, unknown, null, coerced, array, and extra values: %j', candidate => {
    expect(validateDiagnosisAnswers(candidate)).toEqual({ success: false })
  })

  it.each([
    { answers, userId: 'other-user' },
    { answers, diagnosisVersion: CURRENT_DIAGNOSIS_VERSION },
    { answers, completedAt: '2026-09-05T00:00:00.000Z' },
    answers,
  ])('rejects extra or malformed save request fields: %j', request => {
    expect(validateDiagnosisSaveRequest(request)).toEqual({ success: false })
  })

  it('allows only the explicitly compatible current version', () => {
    expect(isCompatibleDiagnosisVersion(CURRENT_DIAGNOSIS_VERSION)).toBe(true)
    expect(isCompatibleDiagnosisVersion('diagnosis-k/v0')).toBe(false)
    expect(isCompatibleDiagnosisVersion('')).toBe(false)
  })

  it('accepts a complete compatible stored record and rejects invalid records', () => {
    const stored = {
      answers,
      diagnosisVersion: CURRENT_DIAGNOSIS_VERSION,
      completedAt: '2026-09-05T00:00:00.000Z',
      updatedAt: '2026-09-05T00:00:00.000Z',
    }

    expect(validateStoredDiagnosis(stored)).toEqual(stored)
    expect(validateStoredDiagnosis({ ...stored, diagnosisVersion: 'diagnosis-k/v0' })).toBeNull()
    expect(validateStoredDiagnosis({ ...stored, updatedAt: 'not-a-date' })).toBeNull()
    expect(validateStoredDiagnosis({ ...stored, updatedAt: '09/05/2026' })).toBeNull()
    expect(validateStoredDiagnosis({ ...stored, answers: { ...answers, rule_confidence: null } })).toBeNull()
  })
})
