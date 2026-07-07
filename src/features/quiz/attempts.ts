import type {
  QuizGradingResult,
  QuizQuestionGradingResult,
  QuizSubmission,
  QuizSubmissionAnswer,
} from './grading'
import type { QuestionSetVersion, QuizDefinition, QuizId } from './types'

export const QUIZ_ATTEMPT_MODEL_VERSION = 'quiz-attempt/1.0'

export type QuizAttemptId = string

export interface QuizAttemptResult {
  attemptId: QuizAttemptId
  quizId: QuizId
  nodeId: QuizDefinition['nodeId']
  questionSetVersion: QuestionSetVersion
  attemptNumber: number
  answers: readonly QuizSubmissionAnswer[]
  score: number
  maxScore: number
  passScore: number
  passed: boolean
  startedAt: string
  submittedAt: string
  correctQuestionIds: readonly string[]
  incorrectQuestionIds: readonly string[]
  questionResults: readonly QuizQuestionGradingResult[]
  attemptModelVersion: typeof QUIZ_ATTEMPT_MODEL_VERSION
}

export interface QuizAttemptTarget {
  quizId: QuizId
  nodeId: QuizDefinition['nodeId']
}

export type QuizAttemptState = {
  quizId: QuizId
  nodeId: QuizDefinition['nodeId']
  canAttempt: boolean
  hasPassed: boolean
  nextAttemptNumber: number
  latestAttempt: QuizAttemptResult | null
  attempts: readonly QuizAttemptResult[]
}

export type QuizAttemptInputErrorCode =
  | 'attempt_after_passed'
  | 'grading_submission_mismatch'
  | 'invalid_attempt_timestamp'

export class QuizAttemptInputError extends Error {
  readonly code: QuizAttemptInputErrorCode
  readonly details: Readonly<Record<string, string>>

  constructor(
    code: QuizAttemptInputErrorCode,
    message: string,
    details: Readonly<Record<string, string>> = {},
  ) {
    super(message)
    this.name = 'QuizAttemptInputError'
    this.code = code
    this.details = details
  }
}

export interface AddQuizAttemptInput {
  attempts: readonly QuizAttemptResult[]
  submission: QuizSubmission
  gradingResult: QuizGradingResult
  attemptId: QuizAttemptId
  startedAt: string
  submittedAt: string
}

export interface AddQuizAttemptResult {
  attempt: QuizAttemptResult
  attempts: readonly QuizAttemptResult[]
}

export function getQuizAttemptState(
  attempts: readonly QuizAttemptResult[],
  target: QuizAttemptTarget,
): QuizAttemptState {
  const targetAttempts = [...attempts]
    .filter(attempt => isTargetAttempt(attempt, target))
    .sort((left, right) => left.attemptNumber - right.attemptNumber)
  const latestAttempt = targetAttempts.at(-1) ?? null
  const hasPassed = targetAttempts.some(attempt => attempt.passed)

  return {
    quizId: target.quizId,
    nodeId: target.nodeId,
    canAttempt: !hasPassed,
    hasPassed,
    nextAttemptNumber: targetAttempts.length + 1,
    latestAttempt,
    attempts: targetAttempts,
  }
}

export function canAttemptQuiz(
  attempts: readonly QuizAttemptResult[],
  target: QuizAttemptTarget,
): boolean {
  return getQuizAttemptState(attempts, target).canAttempt
}

export function addQuizAttempt({
  attempts,
  submission,
  gradingResult,
  attemptId,
  startedAt,
  submittedAt,
}: AddQuizAttemptInput): AddQuizAttemptResult {
  validateAttemptTimestamp(startedAt, submittedAt)
  validateGradingSubmissionMatch(submission, gradingResult)

  const target = {
    quizId: gradingResult.quizId,
    nodeId: gradingResult.nodeId,
  }
  const attemptState = getQuizAttemptState(attempts, target)

  if (!attemptState.canAttempt) {
    throw new QuizAttemptInputError(
      'attempt_after_passed',
      'A quiz attempt cannot be added after the target quiz has already been passed.',
      {
        quizId: target.quizId,
        nodeId: target.nodeId,
      },
    )
  }

  const attempt: QuizAttemptResult = {
    attemptId,
    quizId: gradingResult.quizId,
    nodeId: gradingResult.nodeId,
    questionSetVersion: gradingResult.questionSetVersion,
    attemptNumber: attemptState.nextAttemptNumber,
    answers: submission.answers,
    score: gradingResult.score,
    maxScore: gradingResult.maxScore,
    passScore: gradingResult.passScore,
    passed: gradingResult.passed,
    startedAt,
    submittedAt,
    correctQuestionIds: gradingResult.correctQuestionIds,
    incorrectQuestionIds: gradingResult.incorrectQuestionIds,
    questionResults: gradingResult.questionResults,
    attemptModelVersion: QUIZ_ATTEMPT_MODEL_VERSION,
  }

  return {
    attempt,
    attempts: [...attempts, attempt],
  }
}

function isTargetAttempt(
  attempt: QuizAttemptResult,
  target: QuizAttemptTarget,
): boolean {
  return attempt.quizId === target.quizId && attempt.nodeId === target.nodeId
}

function validateAttemptTimestamp(startedAt: string, submittedAt: string): void {
  if (startedAt === '' || submittedAt === '') {
    throw new QuizAttemptInputError(
      'invalid_attempt_timestamp',
      'Quiz attempt timestamps must be non-empty ISO-8601 strings.',
    )
  }
}

function validateGradingSubmissionMatch(
  submission: QuizSubmission,
  gradingResult: QuizGradingResult,
): void {
  if (submission.quizId !== gradingResult.quizId) {
    throw new QuizAttemptInputError(
      'grading_submission_mismatch',
      'Submitted quizId does not match the grading result quizId.',
      {
        submissionQuizId: submission.quizId,
        gradingQuizId: gradingResult.quizId,
      },
    )
  }
}
