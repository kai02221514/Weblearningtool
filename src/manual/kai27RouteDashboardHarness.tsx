import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Dashboard } from '../components/Dashboard'
import { MVP_NODE_IDS } from '../domain/mvpScope'
import type { RouteGenerationResult } from '../domain/routeGeneration'
import type { QuizAttemptResult } from '../features/quiz/attempts'
import {
  applyDiagnosis,
  completeRouteNode,
  createInitialRouteRuntimeState,
  recordQuizAttempt,
  startRouteNode,
  type RouteRuntimeState,
} from '../features/route/routeRuntime'
import '../index.css'

function quizAttempt(attemptNumber: number, passed: boolean): QuizAttemptResult {
  return {
    attemptId: `kai-27-html-010-attempt-${attemptNumber}`,
    quizId: 'quiz-html-010',
    nodeId: 'html-010',
    questionSetVersion: 'quiz-html-010/v1.0',
    attemptNumber,
    answers: [],
    score: passed ? 2 : 1,
    maxScore: 3,
    passScore: 2,
    passed,
    startedAt: `2026-09-03T11:${attemptNumber}0:00.000Z`,
    submittedAt: `2026-09-03T11:${attemptNumber}5:00.000Z`,
    correctQuestionIds: [],
    incorrectQuestionIds: [],
    questionResults: [],
    attemptModelVersion: 'quiz-attempt/1.0',
  }
}

function completedState(state: RouteRuntimeState): RouteRuntimeState {
  return MVP_NODE_IDS.reduce(
    (current, nodeId) => completeRouteNode(current, nodeId),
    state,
  )
}

function errorResult(result: RouteGenerationResult): RouteGenerationResult {
  return {
    ...result,
    status: 'error',
    nextNodeId: null,
    route: [],
    presentedCount: 0,
    warnings: ['CATALOG_INVALID'],
  }
}

function Kai27RouteDashboardHarness() {
  const [routeState, setRouteState] = useState(createInitialRouteRuntimeState)
  const [resultOverride, setResultOverride] = useState<RouteGenerationResult | null>(null)
  const [lastAction, setLastAction] = useState('初期状態')

  const update = (label: string, reducer: (state: RouteRuntimeState) => RouteRuntimeState) => {
    setResultOverride(null)
    setRouteState(reducer)
    setLastAction(label)
  }

  const routeResult = resultOverride ?? routeState.result

  return (
    <>
      <aside className="border-b bg-amber-50 p-4" data-testid="kai-27-controls">
        <div className="mx-auto max-w-7xl space-y-3">
          <div>
            <h1 className="font-semibold">KAI-27 Dashboard手動確認ハーネス</h1>
            <p className="text-sm">
              非プロダクションのローカル確認専用です。認証・外部通信・保存は行わず、状態はページ内メモリだけに保持します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => {
              setRouteState(createInitialRouteRuntimeState())
              setResultOverride(null)
              setLastAction('初期状態')
            }}>初期状態</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'DG-RULE-1',
              state => applyDiagnosis(state, { programming_experience: 'no' }),
            )}>DG-RULE-1</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'DG-RULE-2',
              state => applyDiagnosis(state, {
                programming_experience: 'yes',
                rule_confidence: 'low',
                knowledge_concept: 'visual_only',
              }),
            )}>DG-RULE-2</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'DG-RULE-3',
              state => applyDiagnosis(state, {
                programming_experience: 'yes',
                rule_confidence: 'partial',
                knowledge_concept: 'somewhat',
              }),
            )}>DG-RULE-3／再回答</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'html-010開始',
              state => startRouteNode(state, 'html-010'),
            )}>html-010開始</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'html-010不合格',
              state => recordQuizAttempt(state, quizAttempt(1, false)),
            )}>html-010不合格</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              '同じ不合格通知を再送',
              state => recordQuizAttempt(state, quizAttempt(1, false)),
            )}>同じ不合格通知を再送</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'html-010合格再試行',
              state => recordQuizAttempt(state, quizAttempt(2, true)),
            )}>html-010合格再試行</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              'html-000完了',
              state => completeRouteNode(state, 'html-000'),
            )}>html-000完了</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => update(
              '全ノード完了',
              completedState,
            )}>completed表示</button>
            <button className="rounded border bg-white px-3 py-1 text-sm" onClick={() => {
              setResultOverride(errorResult(routeState.result))
              setLastAction('カタログエラー表示')
            }}>error表示</button>
          </div>
          <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-3" data-testid="kai-27-state">
            <div><dt className="inline font-semibold">操作: </dt><dd className="inline">{lastAction}</dd></div>
            <div><dt className="inline font-semibold">status: </dt><dd className="inline">{routeResult.status}</dd></div>
            <div><dt className="inline font-semibold">next: </dt><dd className="inline">{routeResult.nextNodeId ?? 'なし'}</dd></div>
            <div><dt className="inline font-semibold">rule: </dt><dd className="inline">{routeState.diagnosis?.matchedRuleId ?? 'なし'}</dd></div>
            <div><dt className="inline font-semibold">assumed: </dt><dd className="inline">{routeState.progress.assumedNodeIds.join(', ') || 'なし'}</dd></div>
            <div><dt className="inline font-semibold">inProgress: </dt><dd className="inline">{routeState.progress.inProgressNodeId ?? 'なし'}</dd></div>
            <div><dt className="inline font-semibold">completed: </dt><dd className="inline">{routeState.progress.completedNodeIds.join(', ') || 'なし'}</dd></div>
            <div><dt className="inline font-semibold">quiz results: </dt><dd className="inline">{routeState.quizResults.length}</dd></div>
            <div><dt className="inline font-semibold">attempt IDs: </dt><dd className="inline">{routeState.processedQuizAttemptIds.length}</dd></div>
          </dl>
        </div>
      </aside>
      <Dashboard
        onStartLearning={nodeId => update(
          `${nodeId}開始（Dashboard）`,
          state => startRouteNode(state, nodeId),
        )}
        onViewCompletion={() => setLastAction('成果を見る')}
        onViewReflections={() => setLastAction('学習の振り返り')}
        onTakeSurvey={() => setLastAction('診断に回答・再回答')}
        userData={{ name: 'KAI-27確認者' }}
        progress={{
          completedNodeIds: routeState.progress.completedNodeIds,
          assumedNodeIds: routeState.progress.assumedNodeIds,
          inProgressNodeId: routeState.progress.inProgressNodeId,
          totalNodes: MVP_NODE_IDS.length,
          currentStreak: 0,
          totalHours: 0,
          quizScores: [],
          reflections: [],
        }}
        routeResult={routeResult}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Kai27RouteDashboardHarness />)
