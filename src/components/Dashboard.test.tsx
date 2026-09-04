import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { MVP_NODE_IDS } from '../domain/mvpScope'
import type { RouteGenerationResult } from '../domain/routeGeneration'
import {
  applyDiagnosis,
  completeRouteNode,
  createInitialRouteRuntimeState,
} from '../features/route/routeRuntime'
import { Dashboard } from './Dashboard'

function renderDashboard(routeResult: RouteGenerationResult, completedNodeIds: string[] = []) {
  return renderToStaticMarkup(
    <Dashboard
      onStartLearning={() => undefined}
      onViewCompletion={() => undefined}
      onViewReflections={() => undefined}
      onTakeSurvey={() => undefined}
      userData={{ name: 'テスト利用者' }}
      progress={{
        completedNodeIds,
        assumedNodeIds: [],
        inProgressNodeId: null,
        totalNodes: MVP_NODE_IDS.length,
        currentStreak: 0,
        totalHours: 0,
        quizScores: [],
        reflections: [],
      }}
      routeResult={routeResult}
    />,
  )
}

describe('Dashboard route rendering', () => {
  it('renders generated top-three names, Japanese reasons, evidence, status, and warnings', () => {
    const result = createInitialRouteRuntimeState().result
    const html = renderDashboard(result)

    expect(html).toContain('data-testid="route-status"')
    expect(html).toContain('診断・進捗入力がまだないため')
    expect(html).toContain('診断が未回答')
    expect(html.match(/data-testid="route-recommendation-(?!panel|list)[^"]+"/g))
      .toHaveLength(3)
    expect(html).toContain('オリエンテーション:HTMLとは何か')
    expect(html).toContain('HTML基本骨格(doctype / html / head / body)')
    expect(html).toContain('要素とタグ:開始/終了タグ、空要素')
    expect(html).toContain('診断の開始ノード規則に基づく候補です。')
    expect(html).toContain('DIAGNOSIS_START / evidence: diagnosis / DG-RULE-4')
  })

  it('renders active, completed, and error states from route results', () => {
    const active = applyDiagnosis(createInitialRouteRuntimeState(), {
      programming_experience: 'no',
    })
    const completed = MVP_NODE_IDS.reduce(
      (state, nodeId) => completeRouteNode(state, nodeId),
      active,
    )
    const error: RouteGenerationResult = {
      ...active.result,
      status: 'error',
      nextNodeId: null,
      route: [],
      presentedCount: 0,
      warnings: ['CATALOG_INVALID'],
    }

    expect(renderDashboard(active.result)).toContain('現在の入力に基づく推薦です。')
    expect(renderDashboard(completed.result, completed.progress.completedNodeIds))
      .toContain('MVP対象の学習ノードはすべて完了しています。')
    const errorHtml = renderDashboard(error)
    expect(errorHtml).toContain('推薦の生成中にエラーが発生しました。')
    expect(errorHtml).toContain('学習カタログを確認できないため')
  })
})
