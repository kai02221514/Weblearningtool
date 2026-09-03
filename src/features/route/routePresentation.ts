import type {
  RecommendationReason,
  RouteGenerationResult,
  RouteGenerationWarning,
} from '../../domain/routeGeneration'
import { getMvpLearningNodes, type LearningNode } from '../../domain/mvpScope'

export interface PresentedRecommendation {
  node: LearningNode
  order: number
  reasons: {
    reasonCode: RecommendationReason['reasonCode']
    message: string
    evidenceKind: RecommendationReason['evidence']['kind']
    evidenceRefId: string
  }[]
}

const reasonLabels: Record<RecommendationReason['reasonCode'], string> = {
  IN_PROGRESS: '学習中の単元を続ける候補です。',
  ERROR_REMEDIATION: '未解消のエラーに対応する復習候補です。',
  QUIZ_FAILED: '確認テストの不合格結果に基づく復習候補です。',
  REFLECTION_FLAG: '振り返りで難しさが記録された候補です。',
  NEXT_UNLOCKED: '前提関係を満たす次の学習候補です。',
  DIAGNOSIS_START: '診断の開始ノード規則に基づく候補です。',
  PREREQUISITE: '後続候補に必要な前提単元です。',
  REVIEW: '完了または習得仮定後に復習が必要になった候補です。',
}

const warningLabels: Record<'DIAGNOSIS_INCOMPLETE' | 'DIAGNOSIS_MISSING' | 'CATALOG_INVALID' | 'NON_MVP_OUTPUT', string> = {
  DIAGNOSIS_INCOMPLETE: '診断回答が不完全なため、HTMLの入口から案内しています。',
  DIAGNOSIS_MISSING: '診断が未回答のため、HTMLの入口から案内しています。',
  CATALOG_INVALID: '学習カタログを確認できないため、推薦を生成できませんでした。',
  NON_MVP_OUTPUT: 'MVP対象外の推薦が検出されたため、推薦を表示していません。',
}

export function formatRecommendationReason(reason: RecommendationReason): string {
  const prerequisite = reason.prerequisiteFor
    ? ` 対象: ${reason.prerequisiteFor}`
    : ''
  return `${reasonLabels[reason.reasonCode]}${prerequisite}`
}

export function formatRouteWarning(warning: RouteGenerationWarning): string {
  if (warning.startsWith('UNKNOWN_ID:')) {
    return `入力に含まれる不明なIDを除外しました: ${warning.slice('UNKNOWN_ID:'.length)}`
  }
  return warningLabels[warning]
}

export function getRouteStatusMessage(status: RouteGenerationResult['status']): string {
  switch (status) {
    case 'active':
      return '現在の入力に基づく推薦です。'
    case 'completed':
      return 'MVP対象の学習ノードはすべて完了しています。'
    case 'insufficient-input':
      return '診断・進捗入力がまだないため、安全側の入口から候補を生成しています。'
    case 'error':
      return '推薦の生成中にエラーが発生しました。'
  }
}

export function getPresentedRecommendations(
  result: RouteGenerationResult,
): PresentedRecommendation[] {
  const nodeById = new Map(getMvpLearningNodes().map(node => [node.id, node]))

  return result.route.slice(0, result.presentedCount).flatMap(item => {
    const node = nodeById.get(item.nodeId)
    if (!node) return []

    return [{
      node,
      order: item.order,
      reasons: item.reasons.map(reason => ({
        reasonCode: reason.reasonCode,
        message: formatRecommendationReason(reason),
        evidenceKind: reason.evidence.kind,
        evidenceRefId: reason.evidence.refId,
      })),
    }]
  })
}
