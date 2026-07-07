import { isMvpNodeId, type MvpNodeId } from '../../domain/mvpScope'
import {
  gradeQuizSubmission,
  type QuizGradingResult,
  type QuizSubmission,
  type QuizSubmissionAnswer,
} from './grading'
import { getPilotQuizDefinitions } from './quizCatalog'
import type { QuizDefinition, QuizQuestion } from './types'

export type QuizUiAnswer =
  | {
      type: 'single-choice'
      choiceId: string
    }
  | {
      type: 'code-completion'
      answer: string
    }

export type QuizUiAnswerState = Readonly<Record<string, QuizUiAnswer | undefined>>

export type QuizSubmissionGrader = (
  quiz: QuizDefinition,
  submission: QuizSubmission,
) => QuizGradingResult

const pilotQuizByNodeId = new Map<MvpNodeId, QuizDefinition>(
  getPilotQuizDefinitions().map(quiz => [quiz.nodeId, quiz])
)

export function resolvePilotQuizByNodeId(nodeId: string): QuizDefinition | null {
  if (!isMvpNodeId(nodeId)) return null

  return pilotQuizByNodeId.get(nodeId) ?? null
}

export function createEmptyQuizAnswerState(quiz: QuizDefinition): QuizUiAnswerState {
  return Object.fromEntries(
    quiz.questions.map(question => [question.questionId, undefined])
  )
}

export function setQuizQuestionAnswer(
  state: QuizUiAnswerState,
  question: QuizQuestion,
  answer: string,
): QuizUiAnswerState {
  const nextAnswer: QuizUiAnswer = question.type === 'single-choice'
    ? { type: 'single-choice', choiceId: answer }
    : { type: 'code-completion', answer }

  return {
    ...state,
    [question.questionId]: nextAnswer,
  }
}

export function getQuizQuestionAnswer(
  state: QuizUiAnswerState,
  question: QuizQuestion,
): QuizUiAnswer | undefined {
  const answer = state[question.questionId]
  if (answer === undefined || answer.type !== question.type) return undefined

  return answer
}

export function isQuizQuestionAnswered(
  state: QuizUiAnswerState,
  question: QuizQuestion,
): boolean {
  const answer = getQuizQuestionAnswer(state, question)
  if (answer === undefined) return false

  switch (answer.type) {
    case 'single-choice':
      return answer.choiceId !== ''
    case 'code-completion':
      return answer.answer.trim() !== ''
  }
}

export function isQuizReadyToSubmit(
  quiz: QuizDefinition,
  state: QuizUiAnswerState,
): boolean {
  return quiz.questions.every(question => isQuizQuestionAnswered(state, question))
}

export function buildQuizSubmission(
  quiz: QuizDefinition,
  state: QuizUiAnswerState,
): QuizSubmission {
  const answers: QuizSubmissionAnswer[] = []

  for (const question of quiz.questions) {
    const answer = getQuizQuestionAnswer(state, question)
    if (answer === undefined) continue

    if (question.type === 'single-choice' && answer.type === 'single-choice') {
      answers.push({
        questionId: question.questionId,
        type: 'single-choice',
        choiceId: answer.choiceId,
      })
      continue
    }

    if (question.type === 'code-completion' && answer.type === 'code-completion') {
      answers.push({
        questionId: question.questionId,
        type: 'code-completion',
        answer: answer.answer,
      })
    }
  }

  return {
    quizId: quiz.quizId,
    answers,
  }
}

export function gradeQuizUiAnswerState(
  quiz: QuizDefinition,
  state: QuizUiAnswerState,
  grader: QuizSubmissionGrader = gradeQuizSubmission,
): QuizGradingResult {
  return grader(quiz, buildQuizSubmission(quiz, state))
}
