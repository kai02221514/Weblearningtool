import type { MvpNodeId } from '../../domain/mvpScope'

export type QuizQuestionType = 'single-choice' | 'code-completion'
export type QuizId = `quiz-${MvpNodeId}`
export type QuestionSetVersion = `${QuizId}/v${number}.${number}`
export type CodeCompletionCaseNormalizationScope =
  | 'html-element-or-explicit-tag-name'
  | 'css-property-name'

export interface CodeCompletionAnswerNormalization {
  trimWhitespace: true
  caseInsensitive: true
  scope: CodeCompletionCaseNormalizationScope
  matchStrategy: 'exact-accepted-answer'
}

export interface QuizChoice {
  id: string
  label: string
  presentation: 'text' | 'code'
}

interface BaseQuizQuestion {
  questionId: string
  nodeId: MvpNodeId
  sourceReference: string
  type: QuizQuestionType
  difficulty: string
  prompt: string
  correctAnswer: string
  explanation: string
  mainReviewNodeId: MvpNodeId
  relatedPrerequisiteNodeIds: readonly MvpNodeId[]
  researchMetadata: QuizQuestionResearchMetadata
}

export interface QuizQuestionResearchMetadata {
  notes: readonly string[]
  acceptedAnswerDecision?: {
    decisionId: string
    decidedBy: string
    accepted: readonly string[]
    rejected: readonly string[]
    rationale: readonly string[]
  }
  incorrectAnswerExamples?: readonly string[]
}

export interface SingleChoiceQuestion extends BaseQuizQuestion {
  type: 'single-choice'
  choices: readonly QuizChoice[]
  correctChoiceId: string
  acceptedAnswers: readonly []
}

export interface CodeCompletionQuestion extends BaseQuizQuestion {
  type: 'code-completion'
  choices: readonly []
  acceptedAnswers: readonly string[]
  answerNormalization: CodeCompletionAnswerNormalization
}

export type QuizQuestion = SingleChoiceQuestion | CodeCompletionQuestion

export interface QuizDefinition {
  quizId: QuizId
  nodeId: MvpNodeId
  questionSetVersion: QuestionSetVersion
  passScore: number
  maxScore: number
  sourceDocumentPath: string
  questions: readonly QuizQuestion[]
}
