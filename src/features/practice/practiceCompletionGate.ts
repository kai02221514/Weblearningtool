import type { PracticeEvaluationResult } from './types'

export function canCompletePractice(
  evaluation: PracticeEvaluationResult | null,
  confirmedDisplayConditionIds: readonly string[],
): boolean {
  if (!evaluation?.automaticChecksPassed) {
    return false
  }

  const confirmedIds = new Set(confirmedDisplayConditionIds)

  return evaluation.conditionResults
    .filter(condition => condition.mode === 'display-only')
    .every(condition => confirmedIds.has(condition.id))
}
