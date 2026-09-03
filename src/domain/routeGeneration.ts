import learningNodesData from '../data/learningNodes'
import { getMvpLearningNodes, type MvpNodeId } from './mvpScope'

export const ROUTE_SPEC_VERSION = 'route-spec/1.0' as const

export type ProgrammingExperience = 'yes' | 'no'
export type RuleConfidence = 'none' | 'low' | 'partial' | 'confident'
export type KnowledgeConcept =
  | 'visual_only'
  | 'unknown'
  | 'somewhat'
  | 'structure_style'

export interface DiagnosisAnswers {
  programming_experience?: string | null
  rule_confidence?: string | null
  knowledge_concept?: string | null
}

export type DiagnosisQuestionId =
  | 'programming_experience'
  | 'rule_confidence'
  | 'knowledge_concept'

export type StartNodeRuleId =
  | 'DG-RULE-1'
  | 'DG-RULE-2'
  | 'DG-RULE-3'
  | 'DG-RULE-4'

export type DiagnosisWarning =
  | 'DIAGNOSIS_INCOMPLETE'
  | 'DIAGNOSIS_MISSING'

export interface StartNodeDecision {
  startNodeId: 'html-000' | 'html-010'
  assumedNodeIds: MvpNodeId[]
  matchedRuleId: StartNodeRuleId
  usedAnswers: {
    questionId: DiagnosisQuestionId
    value: string
  }[]
  warnings: DiagnosisWarning[]
}

export interface RouteCatalog {
  catalogVersion: string
  nodes: {
    nodeId: string
    prerequisites: string[]
  }[]
}

export type MaxRecommendations =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12

export interface QuizResult {
  quizId: string
  nodeId: string
  passed: boolean
  score: number
  attempt: number
  takenAt: string
}

export interface ErrorHistoryEntry {
  errorId: string
  occurrenceCount: number
  lastOccurredAt: string
  resolved: boolean
}

export interface ReflectionEntry {
  nodeId: string
  struggledNodeIds: string[]
  submittedAt: string
}

export interface RouteGenerationInput {
  catalog: RouteCatalog
  diagnosis: StartNodeDecision | null
  progress: {
    completedNodeIds: string[]
    assumedNodeIds: string[]
    inProgressNodeId: string | null
  }
  quizResults: QuizResult[]
  errorHistory: ErrorHistoryEntry[]
  reflections: ReflectionEntry[]
  maxRecommendations: MaxRecommendations
}

export type RecommendationReasonCode =
  | 'IN_PROGRESS'
  | 'ERROR_REMEDIATION'
  | 'QUIZ_FAILED'
  | 'REFLECTION_FLAG'
  | 'NEXT_UNLOCKED'
  | 'DIAGNOSIS_START'
  | 'PREREQUISITE'
  | 'REVIEW'

export type RecommendationEvidenceKind =
  | 'diagnosis'
  | 'progress'
  | 'quiz'
  | 'error'
  | 'reflection'
  | 'catalog'

export interface RecommendationReason {
  reasonCode: RecommendationReasonCode
  evidence: {
    kind: RecommendationEvidenceKind
    refId: string
    detail?: string
  }
  prerequisiteFor?: MvpNodeId
}

export type RouteGenerationStatus =
  | 'active'
  | 'completed'
  | 'insufficient-input'
  | 'error'

export type RouteGenerationWarning =
  | DiagnosisWarning
  | `UNKNOWN_ID:${string}`
  | 'CATALOG_INVALID'
  | 'NON_MVP_OUTPUT'

export interface RouteGenerationResult {
  specVersion: typeof ROUTE_SPEC_VERSION
  catalogVersion: string
  dataVersion: string
  status: RouteGenerationStatus
  nextNodeId: MvpNodeId | null
  route: {
    nodeId: MvpNodeId
    order: number
    reasons: RecommendationReason[]
  }[]
  presentedCount: number
  warnings: RouteGenerationWarning[]
}

function isProgrammingExperience(value: unknown): value is ProgrammingExperience {
  return value === 'yes' || value === 'no'
}

function isRuleConfidence(value: unknown): value is RuleConfidence {
  return value === 'none' || value === 'low' || value === 'partial' || value === 'confident'
}

function isKnowledgeConcept(value: unknown): value is KnowledgeConcept {
  return value === 'visual_only' ||
    value === 'unknown' ||
    value === 'somewhat' ||
    value === 'structure_style'
}

function collectValidAnswers(diagnosis: DiagnosisAnswers): StartNodeDecision['usedAnswers'] {
  const usedAnswers: StartNodeDecision['usedAnswers'] = []

  if (isProgrammingExperience(diagnosis.programming_experience)) {
    usedAnswers.push({
      questionId: 'programming_experience',
      value: diagnosis.programming_experience,
    })
  }
  if (isRuleConfidence(diagnosis.rule_confidence)) {
    usedAnswers.push({
      questionId: 'rule_confidence',
      value: diagnosis.rule_confidence,
    })
  }
  if (isKnowledgeConcept(diagnosis.knowledge_concept)) {
    usedAnswers.push({
      questionId: 'knowledge_concept',
      value: diagnosis.knowledge_concept,
    })
  }

  return usedAnswers
}

export function decideStartNode(diagnosis: DiagnosisAnswers | null): StartNodeDecision {
  if (diagnosis === null) {
    return {
      startNodeId: 'html-000',
      assumedNodeIds: [],
      matchedRuleId: 'DG-RULE-4',
      usedAnswers: [],
      warnings: ['DIAGNOSIS_MISSING'],
    }
  }

  if (diagnosis.programming_experience === 'no') {
    return {
      startNodeId: 'html-000',
      assumedNodeIds: [],
      matchedRuleId: 'DG-RULE-1',
      usedAnswers: [
        {
          questionId: 'programming_experience',
          value: diagnosis.programming_experience,
        },
      ],
      warnings: [],
    }
  }

  const programmingExperience = diagnosis.programming_experience
  const ruleConfidence = diagnosis.rule_confidence
  const knowledgeConcept = diagnosis.knowledge_concept

  if (
    isProgrammingExperience(programmingExperience) &&
    isRuleConfidence(ruleConfidence) &&
    isKnowledgeConcept(knowledgeConcept)
  ) {
    const usedAnswers = collectValidAnswers(diagnosis)
    if (
      ruleConfidence === 'none' ||
      ruleConfidence === 'low' ||
      knowledgeConcept === 'visual_only' ||
      knowledgeConcept === 'unknown'
    ) {
      return {
        startNodeId: 'html-000',
        assumedNodeIds: [],
        matchedRuleId: 'DG-RULE-2',
        usedAnswers,
        warnings: [],
      }
    }

    return {
      startNodeId: 'html-010',
      assumedNodeIds: ['html-000'],
      matchedRuleId: 'DG-RULE-3',
      usedAnswers,
      warnings: [],
    }
  }

  return {
    startNodeId: 'html-000',
    assumedNodeIds: [],
    matchedRuleId: 'DG-RULE-4',
    usedAnswers: collectValidAnswers(diagnosis),
    warnings: ['DIAGNOSIS_INCOMPLETE'],
  }
}

export function getMvpRouteCatalog(): RouteCatalog {
  return {
    catalogVersion: learningNodesData.version,
    nodes: getMvpLearningNodes().map(node => ({
      nodeId: node.id,
      prerequisites: [...node.prerequisites],
    })),
  }
}
