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

export interface PracticeExpectedError {
  label: string
  mappingStatus: PracticeErrorMappingStatus
  errorId?: string
  srk: SrkClassification
  reviewNodeIds: readonly MvpNodeId[]
  detection: PracticeCheckMode | 'unsupported'
  note: string
}

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
