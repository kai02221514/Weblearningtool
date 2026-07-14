import type { MvpNodeId } from '../../domain/mvpScope'
import type { SrkClassification } from '../../data/errorMappings'

export const PILOT_PRACTICE_NODE_IDS = [
  'html-010',
  'html-021',
  'css-011',
] as const satisfies readonly MvpNodeId[]

export type PilotPracticeNodeId = (typeof PILOT_PRACTICE_NODE_IDS)[number]
export type PracticeCheckMode = 'limited-automatic' | 'display-only'
export type PracticeErrorMappingStatus = 'mvp' | 'out-of-mvp' | 'unsupported'

export interface PracticeCompletionCondition {
  id: string
  label: string
  mode: PracticeCheckMode
}

interface PracticeExpectedErrorBase {
  label: string
  srk: SrkClassification
  detection: PracticeCheckMode | 'unsupported'
  note: string
}

export type PracticeExpectedError = PracticeExpectedErrorBase & (
  | {
    mappingStatus: 'mvp'
    errorId: string
    reviewNodeIds: readonly MvpNodeId[]
  }
  | {
    mappingStatus: 'out-of-mvp'
    errorId: string
    reviewNodeIds: readonly []
  }
  | {
    mappingStatus: 'unsupported'
    errorId?: never
    reviewNodeIds: readonly MvpNodeId[]
  }
)

export interface PracticeChallengeDefinition {
  practiceId: 'practice-profile-card'
  nodeId: PilotPracticeNodeId
  title: string
  description: string
  learningObjective: string
  initialCode: string
  requirements: readonly string[]
  completionConditions: readonly PracticeCompletionCondition[]
  acceptedSolutionConditions: readonly string[]
  expectedErrors: readonly PracticeExpectedError[]
  hints: readonly string[]
  sourceReferences: {
    materialSections: readonly string[]
    quizQuestionIds: readonly string[]
  }
}

export interface PracticeConditionResult extends PracticeCompletionCondition {
  passed: boolean | null
}

export interface PracticeEvaluationResult {
  conditionResults: readonly PracticeConditionResult[]
  automaticChecksPassed: boolean
  note: string
}
