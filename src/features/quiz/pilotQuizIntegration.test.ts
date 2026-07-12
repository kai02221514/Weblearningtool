import { describe, expect, it } from 'vitest'

import {
  QUIZ_ATTEMPT_MODEL_VERSION,
  QuizAttemptInputError,
  addQuizAttempt,
  getQuizAttemptState,
  type QuizAttemptResult,
} from './attempts'
import {
  QuizGradingInputError,
  gradeQuizSubmission,
  type QuizSubmission,
} from './grading'
import { PILOT_QUIZ_CATALOG, PILOT_QUIZ_NODE_IDS } from './quizCatalog'
import {
  buildQuizSubmission,
  createEmptyQuizAnswerState,
  gradeQuizUiAnswerState,
  resolvePilotQuizByNodeId,
  setQuizQuestionAnswer,
  type QuizUiAnswerState,
} from './quizUiModel'
import type { QuizDefinition, QuizQuestion } from './types'

const D020_BOUNDARY_ANSWERS = {
  'html-010-q3': {
    accepted: ['body', '<BODY>', ' Body '],
    rejected: ['</body>', '/body', 'head'],
  },
  'html-021-q3': {
    accepted: ['strong', '</STRONG>', ' Strong '],
    rejected: ['/strong', '<strong>', 'body'],
  },
  'css-011-q3': {
    accepted: ['color', ' COLOR ', 'Color'],
    rejected: ['color:', 'colour', 'font-color'],
  },
} as const

describe('KAI-24 pilot quiz integration', () => {
  it('resolves only the three pilot node quizzes and does not fall back for unsupported nodes', () => {
    expect(PILOT_QUIZ_CATALOG.map(quiz => quiz.nodeId)).toEqual([...PILOT_QUIZ_NODE_IDS])

    for (const quiz of PILOT_QUIZ_CATALOG) {
      expect(resolvePilotQuizByNodeId(quiz.nodeId)).toBe(quiz)
      expect(quiz.quizId).toBe(`quiz-${quiz.nodeId}`)
      expect(quiz.questions).toHaveLength(3)
      expect(quiz.maxScore).toBe(3)
      expect(quiz.passScore).toBe(2)
    }

    expect(resolvePilotQuizByNodeId('html-000')).toBeNull()
    expect(resolvePilotQuizByNodeId('html-020')).toBeNull()
    expect(resolvePilotQuizByNodeId('unknown-node')).toBeNull()
  })

  it('passes at 2/3 and 3/3, fails at 1/3 and 0/3 for every pilot quiz through the UI submission flow', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      expect(gradeFromUiState(quiz, [true, true, true])).toMatchObject({
        score: 3,
        maxScore: 3,
        passScore: 2,
        passed: true,
      })
      expect(gradeFromUiState(quiz, [true, true, false])).toMatchObject({
        score: 2,
        maxScore: 3,
        passScore: 2,
        passed: true,
      })
      expect(gradeFromUiState(quiz, [true, false, false])).toMatchObject({
        score: 1,
        maxScore: 3,
        passScore: 2,
        passed: false,
      })
      expect(gradeFromUiState(quiz, [false, false, false])).toMatchObject({
        score: 0,
        maxScore: 3,
        passScore: 2,
        passed: false,
      })
    }
  })

  it('keeps D-020 accepted and rejected code-completion answers intact through UI state grading', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      const codeQuestion = quiz.questions.find(question => question.type === 'code-completion')

      if (codeQuestion === undefined) {
        throw new Error(`${quiz.quizId} does not have a code-completion question.`)
      }

      const boundary = D020_BOUNDARY_ANSWERS[codeQuestion.questionId]

      for (const acceptedAnswer of boundary.accepted) {
        const result = gradeFromUiState(quiz, [true, true, true], {
          [codeQuestion.questionId]: acceptedAnswer,
        })

        expect(result.passed).toBe(true)
        expect(result.correctQuestionIds).toContain(codeQuestion.questionId)
      }

      for (const rejectedAnswer of boundary.rejected) {
        const result = gradeFromUiState(quiz, [true, true, true], {
          [codeQuestion.questionId]: rejectedAnswer,
        })

        expect(result.score).toBe(2)
        expect(result.passed).toBe(true)
        expect(result.incorrectQuestionIds).toContain(codeQuestion.questionId)
      }
    }
  })

  it('records failed attempts, resets answer state for retry, increments attempt number, and blocks attempts after pass', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      const firstSubmission = submissionFromUiState(quiz, [true, false, false])
      const firstResult = gradeQuizSubmission(quiz, firstSubmission)
      const first = addQuizAttempt({
        attempts: [],
        submission: firstSubmission,
        gradingResult: firstResult,
        attemptId: `${quiz.quizId}-attempt-1`,
        startedAt: '2026-07-09T00:00:00.000Z',
        submittedAt: '2026-07-09T00:01:00.000Z',
      })

      expect(first.attempt).toMatchObject({
        quizId: quiz.quizId,
        nodeId: quiz.nodeId,
        questionSetVersion: quiz.questionSetVersion,
        attemptNumber: 1,
        score: 1,
        passed: false,
        attemptModelVersion: QUIZ_ATTEMPT_MODEL_VERSION,
      })
      expect(getQuizAttemptState(first.attempts, quiz)).toMatchObject({
        canAttempt: true,
        hasPassed: false,
        nextAttemptNumber: 2,
      })

      const retryState = createEmptyQuizAnswerState(quiz)
      expect(buildQuizSubmission(quiz, retryState).answers).toEqual([])

      const secondSubmission = submissionFromUiState(quiz, [true, true, false])
      const secondResult = gradeQuizSubmission(quiz, secondSubmission)
      const second = addQuizAttempt({
        attempts: first.attempts,
        submission: secondSubmission,
        gradingResult: secondResult,
        attemptId: `${quiz.quizId}-attempt-2`,
        startedAt: '2026-07-09T00:02:00.000Z',
        submittedAt: '2026-07-09T00:03:00.000Z',
      })

      expect(second.attempt).toMatchObject({
        attemptNumber: 2,
        score: 2,
        passed: true,
      })
      expect(getQuizAttemptState(second.attempts, quiz)).toMatchObject({
        canAttempt: false,
        hasPassed: true,
        nextAttemptNumber: 3,
      })

      expect(() =>
        addQuizAttempt({
          attempts: second.attempts,
          submission: secondSubmission,
          gradingResult: secondResult,
          attemptId: `${quiz.quizId}-attempt-3`,
          startedAt: '2026-07-09T00:04:00.000Z',
          submittedAt: '2026-07-09T00:05:00.000Z',
        })
      ).toThrowAttemptInputError('attempt_after_passed')
    }
  })

  it('preserves existing implementation input validation contracts in the integration path', () => {
    const quiz = PILOT_QUIZ_CATALOG[0]
    const validSubmission = submissionFromUiState(quiz, [true, true, true])
    const validResult = gradeQuizSubmission(quiz, validSubmission)

    expect(() =>
      gradeQuizSubmission(quiz, {
        quizId: 'quiz-html-021' as typeof quiz.quizId,
        answers: validSubmission.answers,
      })
    ).toThrowGradingInputError('quiz_id_mismatch')

    expect(() =>
      gradeQuizSubmission(quiz, {
        quizId: quiz.quizId,
        answers: [
          ...validSubmission.answers,
          {
            questionId: 'html-021-q1',
            type: 'single-choice',
            choiceId: 'choice-1',
          },
        ],
      })
    ).toThrowGradingInputError('unexpected_question_answer')

    expect(() =>
      gradeQuizSubmission(quiz, {
        quizId: quiz.quizId,
        answers: [
          validSubmission.answers[0],
          validSubmission.answers[0],
          validSubmission.answers[1],
        ],
      })
    ).toThrowGradingInputError('duplicate_question_answer')

    expect(() =>
      gradeQuizSubmission(quiz, {
        quizId: quiz.quizId,
        answers: [
          {
            questionId: quiz.questions[0].questionId,
            type: 'code-completion',
            answer: 'choice-1',
          },
          validSubmission.answers[1],
          validSubmission.answers[2],
        ],
      })
    ).toThrowGradingInputError('answer_type_mismatch')

    expect(() =>
      addQuizAttempt({
        attempts: [],
        submission: validSubmission,
        gradingResult: validResult,
        attemptId: 'invalid-timestamp',
        startedAt: '2026-07-09T00:02:00.000Z',
        submittedAt: '2026-07-09T00:01:00.000Z',
      })
    ).toThrowAttemptInputError('invalid_attempt_timestamp')

    const first = addQuizAttempt({
      attempts: [],
      submission: validSubmission,
      gradingResult: validResult,
      attemptId: 'duplicate-id',
      startedAt: '2026-07-09T00:00:00.000Z',
      submittedAt: '2026-07-09T00:01:00.000Z',
    })

    expect(() =>
      addQuizAttempt({
        attempts: first.attempts,
        submission: validSubmission,
        gradingResult: validResult,
        attemptId: 'duplicate-id',
        startedAt: '2026-07-09T00:02:00.000Z',
        submittedAt: '2026-07-09T00:03:00.000Z',
      })
    ).toThrowAttemptInputError('duplicate_attempt_id')
  })
})

function gradeFromUiState(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
  answerOverrides: Readonly<Record<string, string>> = {},
) {
  return gradeQuizUiAnswerState(
    quiz,
    answerStateFor(quiz, correctnessByQuestion, answerOverrides),
  )
}

function submissionFromUiState(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
): QuizSubmission {
  return buildQuizSubmission(quiz, answerStateFor(quiz, correctnessByQuestion))
}

function answerStateFor(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
  answerOverrides: Readonly<Record<string, string>> = {},
): QuizUiAnswerState {
  return quiz.questions.reduce<QuizUiAnswerState>((state, question, index) => {
    return setQuizQuestionAnswer(
      state,
      question,
      answerOverrides[question.questionId]
        ?? (correctnessByQuestion[index] ? correctAnswerFor(question) : incorrectAnswerFor(question)),
    )
  }, createEmptyQuizAnswerState(quiz))
}

function correctAnswerFor(question: QuizQuestion): string {
  switch (question.type) {
    case 'single-choice':
      return question.correctChoiceId
    case 'code-completion':
      return question.correctAnswer
  }
}

function incorrectAnswerFor(question: QuizQuestion): string {
  switch (question.type) {
    case 'single-choice':
      return question.choices.find(choice => choice.id !== question.correctChoiceId)?.id ?? ''
    case 'code-completion':
      return '__incorrect__'
  }
}

expect.extend({
  toThrowGradingInputError(received: () => unknown, expectedCode: string) {
    return toThrowInputError(received, QuizGradingInputError, expectedCode)
  },
  toThrowAttemptInputError(received: () => unknown, expectedCode: string) {
    return toThrowInputError(received, QuizAttemptInputError, expectedCode)
  },
})

function toThrowInputError<TError extends { code: string }>(
  received: () => unknown,
  errorClass: new (...args: never[]) => TError,
  expectedCode: string,
) {
  try {
    received()
  } catch (error) {
    const pass = error instanceof errorClass && error.code === expectedCode

    return {
      pass,
      message: () => `expected function to throw ${errorClass.name} with code ${expectedCode}`,
    }
  }

  return {
    pass: false,
    message: () => `expected function to throw ${errorClass.name} with code ${expectedCode}`,
  }
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toThrowGradingInputError(expectedCode: string): T
    toThrowAttemptInputError(expectedCode: string): T
  }
}
