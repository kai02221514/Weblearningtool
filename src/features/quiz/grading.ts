import type {
  CodeCompletionAnswerNormalization,
  CodeCompletionQuestion,
  QuizDefinition,
  QuizId,
  QuizQuestion,
  QuizQuestionType,
  SingleChoiceQuestion,
} from './types'

export type SingleChoiceSubmissionAnswer = {
  questionId: string
  type: 'single-choice'
  choiceId: string
}

export type CodeCompletionSubmissionAnswer = {
  questionId: string
  type: 'code-completion'
  answer: string
}

export type QuizSubmissionAnswer =
  | SingleChoiceSubmissionAnswer
  | CodeCompletionSubmissionAnswer

export type QuizSubmission = {
  quizId: QuizId
  answers: readonly QuizSubmissionAnswer[]
}

export type QuizGradingInputErrorCode =
  | 'answer_type_mismatch'
  | 'duplicate_question_answer'
  | 'question_answer_mismatch'
  | 'quiz_id_mismatch'
  | 'unexpected_question_answer'

export class QuizGradingInputError extends Error {
  readonly code: QuizGradingInputErrorCode
  readonly details: Readonly<Record<string, string>>

  constructor(
    code: QuizGradingInputErrorCode,
    message: string,
    details: Readonly<Record<string, string>> = {},
  ) {
    super(message)
    this.name = 'QuizGradingInputError'
    this.code = code
    this.details = details
  }
}

export type NormalizeCodeCompletionAnswerInput = {
  answer: string
  normalization: CodeCompletionAnswerNormalization
}

type BaseQuestionGradingResult = {
  questionId: string
  questionType: QuizQuestionType
  wasAnswered: boolean
  isCorrect: boolean
}

export type SingleChoiceQuestionGradingResult = BaseQuestionGradingResult & {
  questionType: 'single-choice'
  submittedChoiceId: string | null
  correctChoiceId: string
  choiceExists: boolean
}

export type CodeCompletionQuestionGradingResult = BaseQuestionGradingResult & {
  questionType: 'code-completion'
  submittedAnswer: string | null
  normalizedAnswer: string | null
  normalizedAcceptedAnswers: readonly string[]
}

export type QuizQuestionGradingResult =
  | SingleChoiceQuestionGradingResult
  | CodeCompletionQuestionGradingResult

export type QuizGradingResult = {
  quizId: QuizId
  nodeId: QuizDefinition['nodeId']
  questionSetVersion: QuizDefinition['questionSetVersion']
  score: number
  maxScore: number
  passScore: number
  passed: boolean
  correctQuestionIds: readonly string[]
  incorrectQuestionIds: readonly string[]
  questionResults: readonly QuizQuestionGradingResult[]
}

export function normalizeCodeCompletionAnswer({
  answer,
  normalization,
}: NormalizeCodeCompletionAnswerInput): string {
  const trimmedAnswer = normalization.trimWhitespace ? answer.trim() : answer

  if (!normalization.caseInsensitive) {
    return trimmedAnswer
  }

  switch (normalization.scope) {
    case 'html-element-or-explicit-tag-name':
    case 'css-property-name':
      return trimmedAnswer.toLowerCase()
  }

  return assertNever(normalization.scope)
}

export function gradeQuizQuestion(
  question: QuizQuestion,
  submittedAnswer?: QuizSubmissionAnswer,
): QuizQuestionGradingResult {
  if (submittedAnswer !== undefined && submittedAnswer.questionId !== question.questionId) {
    throw new QuizGradingInputError(
      'question_answer_mismatch',
      'Submitted answer questionId does not match the question being graded.',
      {
        expectedQuestionId: question.questionId,
        submittedQuestionId: submittedAnswer.questionId,
      },
    )
  }

  if (submittedAnswer !== undefined && submittedAnswer.type !== question.type) {
    throw new QuizGradingInputError(
      'answer_type_mismatch',
      'Submitted answer type does not match the question type.',
      {
        questionId: question.questionId,
        questionType: question.type,
        submittedType: submittedAnswer.type,
      },
    )
  }

  switch (question.type) {
    case 'single-choice': {
      const singleChoiceAnswer = submittedAnswer === undefined
        ? undefined
        : submittedAnswer.type === 'single-choice'
          ? submittedAnswer
          : undefined

      return gradeSingleChoiceQuestion(question, singleChoiceAnswer)
    }
    case 'code-completion': {
      const codeCompletionAnswer = submittedAnswer === undefined
        ? undefined
        : submittedAnswer.type === 'code-completion'
          ? submittedAnswer
          : undefined

      return gradeCodeCompletionQuestion(question, codeCompletionAnswer)
    }
  }

  return assertNever(question)
}

export function gradeQuizSubmission(
  quiz: QuizDefinition,
  submission: QuizSubmission,
): QuizGradingResult {
  if (submission.quizId !== quiz.quizId) {
    throw new QuizGradingInputError(
      'quiz_id_mismatch',
      'Submitted quizId does not match the quiz being graded.',
      {
        expectedQuizId: quiz.quizId,
        submittedQuizId: submission.quizId,
      },
    )
  }

  const quizQuestionIds = new Set(quiz.questions.map(question => question.questionId))
  const answerByQuestionId = new Map<string, QuizSubmissionAnswer>()

  for (const answer of submission.answers) {
    if (answerByQuestionId.has(answer.questionId)) {
      throw new QuizGradingInputError(
        'duplicate_question_answer',
        'Submission contains more than one answer for the same questionId.',
        { questionId: answer.questionId },
      )
    }

    if (!quizQuestionIds.has(answer.questionId)) {
      throw new QuizGradingInputError(
        'unexpected_question_answer',
        'Submission contains an answer for a questionId that is not in the target quiz.',
        {
          quizId: quiz.quizId,
          questionId: answer.questionId,
        },
      )
    }

    answerByQuestionId.set(answer.questionId, answer)
  }

  const questionResults = quiz.questions.map(question =>
    gradeQuizQuestion(question, answerByQuestionId.get(question.questionId))
  )
  const correctQuestionIds = questionResults
    .filter(result => result.isCorrect)
    .map(result => result.questionId)
  const incorrectQuestionIds = questionResults
    .filter(result => !result.isCorrect)
    .map(result => result.questionId)
  const score = correctQuestionIds.length

  return {
    quizId: quiz.quizId,
    nodeId: quiz.nodeId,
    questionSetVersion: quiz.questionSetVersion,
    score,
    maxScore: quiz.maxScore,
    passScore: quiz.passScore,
    passed: score >= quiz.passScore,
    correctQuestionIds,
    incorrectQuestionIds,
    questionResults,
  }
}

function gradeSingleChoiceQuestion(
  question: SingleChoiceQuestion,
  submittedAnswer?: SingleChoiceSubmissionAnswer,
): SingleChoiceQuestionGradingResult {
  const submittedChoiceId = submittedAnswer?.choiceId ?? null
  const choiceExists = submittedChoiceId === null
    ? false
    : question.choices.some(choice => choice.id === submittedChoiceId)

  return {
    questionId: question.questionId,
    questionType: question.type,
    wasAnswered: submittedAnswer !== undefined,
    isCorrect: submittedChoiceId === question.correctChoiceId,
    submittedChoiceId,
    correctChoiceId: question.correctChoiceId,
    choiceExists,
  }
}

function gradeCodeCompletionQuestion(
  question: CodeCompletionQuestion,
  submittedAnswer?: CodeCompletionSubmissionAnswer,
): CodeCompletionQuestionGradingResult {
  const normalizedAcceptedAnswers = question.acceptedAnswers.map(answer =>
    normalizeCodeCompletionAnswer({
      answer,
      normalization: question.answerNormalization,
    })
  )
  const normalizedAnswer = submittedAnswer === undefined
    ? null
    : normalizeCodeCompletionAnswer({
      answer: submittedAnswer.answer,
      normalization: question.answerNormalization,
    })
  const acceptedAnswerSet = new Set(normalizedAcceptedAnswers)
  const isCorrect = normalizedAnswer !== null
    && normalizedAnswer !== ''
    && acceptedAnswerSet.has(normalizedAnswer)

  switch (question.answerNormalization.matchStrategy) {
    case 'exact-accepted-answer':
      return {
        questionId: question.questionId,
        questionType: question.type,
        wasAnswered: submittedAnswer !== undefined,
        isCorrect,
        submittedAnswer: submittedAnswer?.answer ?? null,
        normalizedAnswer,
        normalizedAcceptedAnswers,
      }
  }

  return assertNever(question.answerNormalization.matchStrategy)
}

function assertNever(value: never): never {
  throw new Error(`Unhandled quiz grading value: ${String(value)}`)
}
