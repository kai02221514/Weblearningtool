import { describe, expect, it } from 'vitest'
import type { QuizAttemptResult } from '../quiz/attempts'
import {
  applyDiagnosis,
  completeRouteNode,
  createInitialRouteRuntimeState,
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

function failedHtml010Attempt(): QuizAttemptResult {
  return {
    attemptId: 'quiz-html-010-attempt-1',
    quizId: 'quiz-html-010',
    nodeId: 'html-010',
    questionSetVersion: 'quiz-html-010/v1.0',
    attemptNumber: 1,
    answers: [],
    score: 1,
    maxScore: 3,
    passScore: 2,
    passed: false,
    startedAt: '2026-09-03T10:00:00.000Z',
    submittedAt: '2026-09-03T10:05:00.000Z',
    correctQuestionIds: [],
    incorrectQuestionIds: [],
    questionResults: [],
    attemptModelVersion: 'quiz-attempt/1.0',
  }
}

describe('route runtime integration', () => {
  it('starts without demo progress and falls back to html-000 with a warning', () => {
    const state = createInitialRouteRuntimeState()

    expect(state.progress).toEqual({
      completedNodeIds: [],
      assumedNodeIds: [],
      inProgressNodeId: null,
    })
    expect('recommendedStartNodeIds' in state.progress).toBe(false)
    expect(state.result.status).toBe('insufficient-input')
    expect(state.result.route[0]?.nodeId).toBe('html-000')
    expect(state.result.warnings).toContain('DIAGNOSIS_MISSING')
  })

  it('uses only K-group answers and retains the DG-RULE-3 assumption', () => {
    const state = applyDiagnosis(createInitialRouteRuntimeState(), {
      programming_experience: 'yes',
      rule_confidence: 'partial',
      knowledge_concept: 'somewhat',
    })

    expect(state.diagnosis?.matchedRuleId).toBe('DG-RULE-3')
    expect(state.diagnosis?.startNodeId).toBe('html-010')
    expect(state.progress.assumedNodeIds).toEqual(['html-000'])
    expect(state.result.route[0]?.nodeId).toBe('html-010')
  })

  it('does not regenerate for learning start or dashboard display, but does after completion', () => {
    const initial = createInitialRouteRuntimeState()
    const started = startRouteNode(initial, 'html-000')

    expect(started.result).toBe(initial.result)

    const completed = completeRouteNode(started, 'html-000')
    expect(completed.progress.completedNodeIds).toEqual(['html-000'])
    expect(completed.progress.inProgressNodeId).toBeNull()
    expect(completed.result).not.toBe(initial.result)
    expect(completed.result.route.some(item => item.nodeId === 'html-000')).toBe(false)
  })

  it('converts a finalized quiz attempt and regenerates a failed review with prerequisites', () => {
    const attempt = failedHtml010Attempt()
    const quizResult = toRouteQuizResult(attempt)

    expect(quizResult).toEqual({
      quizId: 'quiz-html-010',
      nodeId: 'html-010',
      passed: false,
      score: 33,
      attempt: 1,
      takenAt: '2026-09-03T10:05:00.000Z',
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

  it('formats reasons, evidence, warnings, and every result status deterministically', () => {
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
})
