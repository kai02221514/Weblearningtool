import { describe, expect, it } from 'vitest'
import type { QuizAttemptResult } from '../quiz/attempts'
import {
  applyDiagnosis,
  completeRouteNode,
  createInitialRouteRuntimeState,
  pickRouteDiagnosisAnswers,
  recordQuizAttempt,
  startRouteNode,
  toRouteQuizResult,
} from './routeRuntime'
import {
  formatRecommendationReason,
  formatRouteWarning,
  getPresentedRecommendations,
  getRouteStatusMessage,
} from './routePresentation'

function html010Attempt(
  attemptNumber: number,
  passed: boolean,
): QuizAttemptResult {
  return {
    attemptId: `quiz-html-010-attempt-${attemptNumber}`,
    quizId: 'quiz-html-010',
    nodeId: 'html-010',
    questionSetVersion: 'quiz-html-010/v1.0',
    attemptNumber,
    answers: [],
    score: passed ? 2 : 1,
    maxScore: 3,
    passScore: 2,
    passed,
    startedAt: `2026-09-03T10:${attemptNumber}0:00.000Z`,
    submittedAt: `2026-09-03T10:${attemptNumber}5:00.000Z`,
    correctQuestionIds: [],
    incorrectQuestionIds: [],
    questionResults: [],
    attemptModelVersion: 'quiz-attempt/1.0',
  }
}

describe('route runtime integration', () => {
  it('starts without demo progress and presents the generated top three from html-000', () => {
    const state = createInitialRouteRuntimeState()

    expect(state.progress).toEqual({
      completedNodeIds: [],
      assumedNodeIds: [],
      inProgressNodeId: null,
    })
    expect(state.processedQuizAttemptIds).toEqual([])
    expect('recommendedStartNodeIds' in state.progress).toBe(false)
    expect(state.result.status).toBe('insufficient-input')
    expect(state.result.route[0]?.nodeId).toBe('html-000')
    expect(state.result.presentedCount).toBe(3)
    expect(state.result.warnings).toContain('DIAGNOSIS_MISSING')
  })

  it.each([
    [{ programming_experience: 'no' }, 'DG-RULE-1'],
    [{
      programming_experience: 'yes',
      rule_confidence: 'low',
      knowledge_concept: 'visual_only',
    }, 'DG-RULE-2'],
  ])('applies %s as %s and starts at html-000', (answers, ruleId) => {
    const state = applyDiagnosis(createInitialRouteRuntimeState(), answers)

    expect(state.diagnosis?.matchedRuleId).toBe(ruleId)
    expect(state.diagnosis?.startNodeId).toBe('html-000')
    expect(state.progress.assumedNodeIds).toEqual([])
    expect(state.result.route[0]?.nodeId).toBe('html-000')
  })

  it('uses only K-group answers and replaces assumptions immediately on re-answer', () => {
    const surveyData = {
      programming_experience: 'yes',
      rule_confidence: 'partial',
      knowledge_concept: 'somewhat',
      levelScore: 999,
      level: 'advanced',
      occupation: 'engineer',
    }
    const rule3 = applyDiagnosis(
      createInitialRouteRuntimeState(),
      pickRouteDiagnosisAnswers(surveyData),
    )

    expect(rule3.diagnosis?.usedAnswers.map(answer => answer.questionId)).toEqual([
      'programming_experience',
      'rule_confidence',
      'knowledge_concept',
    ])
    expect(rule3.diagnosis?.matchedRuleId).toBe('DG-RULE-3')
    expect(rule3.diagnosis?.startNodeId).toBe('html-010')
    expect(rule3.progress.assumedNodeIds).toEqual(['html-000'])
    expect(rule3.result.route[0]?.nodeId).toBe('html-010')

    const reAnswered = applyDiagnosis(rule3, {
      programming_experience: 'no',
    })
    expect(reAnswered.diagnosis?.matchedRuleId).toBe('DG-RULE-1')
    expect(reAnswered.progress.assumedNodeIds).toEqual([])
    expect(reAnswered.result.route[0]?.nodeId).toBe('html-000')
  })

  it('only updates in-progress state on learning start and regenerates once on completion', () => {
    const initial = createInitialRouteRuntimeState()
    const started = startRouteNode(initial, 'html-000')

    expect(started.progress.inProgressNodeId).toBe('html-000')
    expect(started.result).toBe(initial.result)
    expect(getPresentedRecommendations(started.result)).toEqual(
      getPresentedRecommendations(initial.result),
    )

    const completed = completeRouteNode(started, 'html-000')
    expect(completed.progress.completedNodeIds).toEqual(['html-000'])
    expect(completed.progress.inProgressNodeId).toBeNull()
    expect(completed.result).not.toBe(initial.result)
    expect(completed.result.route.some(item => item.nodeId === 'html-000')).toBe(false)

    const duplicate = completeRouteNode(completed, 'html-000')
    expect(duplicate).toBe(completed)
    expect(duplicate.progress.completedNodeIds).toEqual(['html-000'])
  })

  it('maps a failed quiz, includes its prerequisite, and ignores the same attempt notification', () => {
    const attempt = html010Attempt(1, false)
    const quizResult = toRouteQuizResult(attempt)

    expect(quizResult).toEqual({
      quizId: 'quiz-html-010',
      nodeId: 'html-010',
      passed: false,
      score: 33,
      attempt: 1,
      takenAt: '2026-09-03T10:15:00.000Z',
    })

    const updated = recordQuizAttempt(createInitialRouteRuntimeState(), attempt)
    expect(updated.result.route.slice(0, 2).map(item => item.nodeId)).toEqual([
      'html-000',
      'html-010',
    ])
    expect(updated.result.route.find(item => item.nodeId === 'html-010')?.reasons)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({
          reasonCode: 'QUIZ_FAILED',
          evidence: expect.objectContaining({
            kind: 'quiz',
            refId: 'quiz-html-010',
          }),
        }),
      ]))

    const duplicate = recordQuizAttempt(updated, attempt)
    expect(duplicate).toBe(updated)
    expect(duplicate.quizResults).toHaveLength(1)
    expect(duplicate.processedQuizAttemptIds).toEqual([attempt.attemptId])
  })

  it('clears the failed-quiz recommendation when a later retry passes', () => {
    const failed = recordQuizAttempt(
      createInitialRouteRuntimeState(),
      html010Attempt(1, false),
    )
    const passed = recordQuizAttempt(failed, html010Attempt(2, true))

    expect(passed.quizResults).toHaveLength(2)
    expect(passed.result.route.flatMap(item => item.reasons))
      .not.toEqual(expect.arrayContaining([
        expect.objectContaining({ reasonCode: 'QUIZ_FAILED' }),
      ]))
  })
})

describe('route presentation', () => {
  it('keeps routeGenerator order and limits the Dashboard view to presentedCount', () => {
    const result = createInitialRouteRuntimeState().result
    const presented = getPresentedRecommendations(result)

    expect(presented.map(item => item.node.id)).toEqual(
      result.route.slice(0, result.presentedCount).map(item => item.nodeId),
    )
    expect(presented).toHaveLength(3)
    expect(presented[0]?.reasons[0]).toEqual(expect.objectContaining({
      reasonCode: expect.any(String),
      evidenceKind: expect.any(String),
      evidenceRefId: expect.any(String),
    }))
  })

  it('formats reasons, warnings, and every result status deterministically', () => {
    const message = formatRecommendationReason({
      reasonCode: 'QUIZ_FAILED',
      evidence: { kind: 'quiz', refId: 'quiz-html-010' },
    })

    expect(message).toBe('確認テストの不合格結果に基づく復習候補です。')
    expect(formatRouteWarning('DIAGNOSIS_MISSING')).toContain('診断が未回答')
    expect(['active', 'completed', 'insufficient-input', 'error'].map(getRouteStatusMessage))
      .toEqual([
        '現在の入力に基づく推薦です。',
        'MVP対象の学習ノードはすべて完了しています。',
        '診断・進捗入力がまだないため、安全側の入口から候補を生成しています。',
        '推薦の生成中にエラーが発生しました。',
      ])
  })

  it.each([
    'UNKNOWN_ID:node-outside-mvp',
    'UNKNOWN_ID:quiz-outside-mvp',
    'UNKNOWN_ID:error-outside-mvp',
  ] as const)('uses neutral wording for %s', warning => {
    const message = formatRouteWarning(warning)
    expect(message).toContain('不明なID')
    expect(message).not.toContain('ノードID')
  })
})
