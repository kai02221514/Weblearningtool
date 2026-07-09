import { describe, expect, it } from 'vitest'

import {
  QUIZ_ATTEMPT_MODEL_VERSION,
  QuizAttemptInputError,
  addQuizAttempt,
  canAttemptQuiz,
  getQuizAttemptState,
  type AddQuizAttemptInput,
  type QuizAttemptResult,
} from './attempts'
import { css011Quiz } from './data/css-011'
import { html010Quiz } from './data/html-010'
import { html021Quiz } from './data/html-021'
import { gradeQuizSubmission, type QuizSubmission } from './grading'
import type { QuizDefinition, QuizQuestion } from './types'

const DEFAULT_STARTED_AT = '2026-07-07T00:00:00.000Z'
const DEFAULT_SUBMITTED_AT = '2026-07-07T00:01:00.000Z'

describe('quiz attempt control', () => {
  it('allows the first attempt when there is no attempt history', () => {
    expect(canAttemptQuiz([], html010Quiz)).toBe(true)
    expect(getQuizAttemptState([], html010Quiz)).toMatchObject({
      canAttempt: true,
      hasPassed: false,
      nextAttemptNumber: 1,
      latestAttempt: null,
    })
  })

  it('allows a second attempt after the first failed attempt', () => {
    const history = addAttempt([], html010Quiz, [true, false, false], 1).attempts

    expect(canAttemptQuiz(history, html010Quiz)).toBe(true)
    expect(getQuizAttemptState(history, html010Quiz).nextAttemptNumber).toBe(2)
  })

  it('allows another attempt after multiple failed attempts', () => {
    const first = addAttempt([], html010Quiz, [true, false, false], 1).attempts
    const second = addAttempt(first, html010Quiz, [false, true, false], 2).attempts

    expect(canAttemptQuiz(second, html010Quiz)).toBe(true)
    expect(getQuizAttemptState(second, html010Quiz).nextAttemptNumber).toBe(3)
  })

  it('blocks retries after any passed attempt', () => {
    const history = addAttempt([], html010Quiz, [true, true, false], 1).attempts

    expect(canAttemptQuiz(history, html010Quiz)).toBe(false)
    expect(getQuizAttemptState(history, html010Quiz)).toMatchObject({
      canAttempt: false,
      hasPassed: true,
      nextAttemptNumber: 2,
    })
  })

  it('blocks retries after failing first and passing later', () => {
    const first = addAttempt([], html010Quiz, [true, false, false], 1).attempts
    const second = addAttempt(first, html010Quiz, [true, true, false], 2).attempts

    expect(canAttemptQuiz(second, html010Quiz)).toBe(false)
    expect(getQuizAttemptState(second, html010Quiz).latestAttempt?.passed).toBe(true)
  })

  it('does not mix attempt history from another quizId', () => {
    const history = addAttempt([], html010Quiz, [true, true, false], 1).attempts

    expect(canAttemptQuiz(history, html021Quiz)).toBe(true)
    expect(getQuizAttemptState(history, html021Quiz).nextAttemptNumber).toBe(1)
  })

  it('does not mix attempt history from another nodeId', () => {
    const history = addAttempt([], html010Quiz, [true, true, false], 1).attempts

    expect(canAttemptQuiz(history, css011Quiz)).toBe(true)
    expect(getQuizAttemptState(history, css011Quiz).attempts).toHaveLength(0)
  })

  it('increments attemptNumber from 1 for the target quiz', () => {
    const first = addAttempt([], html010Quiz, [true, false, false], 1).attempts
    const unrelated = addAttempt(first, html021Quiz, [true, false, false], 1).attempts
    const second = addAttempt(unrelated, html010Quiz, [false, true, false], 2).attempts

    const html010Attempts = getQuizAttemptState(second, html010Quiz).attempts
    expect(html010Attempts.map(attempt => attempt.attemptNumber)).toEqual([1, 2])
  })

  it('rejects adding a new attempt after the target quiz has passed', () => {
    const history = addAttempt([], html010Quiz, [true, true, false], 1).attempts
    const nextSubmission = submissionFor(html010Quiz, [true, true, true])
    const nextResult = gradeQuizSubmission(html010Quiz, nextSubmission)

    expect(() =>
      addQuizAttempt({
        attempts: history,
        submission: nextSubmission,
        gradingResult: nextResult,
        attemptId: 'attempt-blocked',
        startedAt: '2026-07-07T00:00:00.000Z',
        submittedAt: '2026-07-07T00:01:00.000Z',
      })
    ).toThrow(QuizAttemptInputError)
  })

  it('rejects an empty startedAt timestamp', () => {
    expectQuizAttemptInputError(
      () => addQuizAttempt(validAttemptInput({ startedAt: '' })),
      'invalid_attempt_timestamp',
      {
        startedAt: '',
        submittedAt: DEFAULT_SUBMITTED_AT,
      },
    )
  })

  it('rejects an empty submittedAt timestamp', () => {
    expectQuizAttemptInputError(
      () => addQuizAttempt(validAttemptInput({ submittedAt: '' })),
      'invalid_attempt_timestamp',
      {
        startedAt: DEFAULT_STARTED_AT,
        submittedAt: '',
      },
    )
  })

  it('rejects an unparseable startedAt timestamp', () => {
    expectQuizAttemptInputError(
      () => addQuizAttempt(validAttemptInput({ startedAt: 'not-a-date' })),
      'invalid_attempt_timestamp',
      {
        startedAt: 'not-a-date',
        submittedAt: DEFAULT_SUBMITTED_AT,
      },
    )
  })

  it('rejects an unparseable submittedAt timestamp', () => {
    expectQuizAttemptInputError(
      () => addQuizAttempt(validAttemptInput({ submittedAt: 'not-a-date' })),
      'invalid_attempt_timestamp',
      {
        startedAt: DEFAULT_STARTED_AT,
        submittedAt: 'not-a-date',
      },
    )
  })

  it('rejects a submittedAt timestamp before startedAt', () => {
    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          validAttemptInput({
            startedAt: '2026-07-07T00:02:00.000Z',
            submittedAt: '2026-07-07T00:01:00.000Z',
          }),
        ),
      'invalid_attempt_timestamp',
      {
        startedAt: '2026-07-07T00:02:00.000Z',
        submittedAt: '2026-07-07T00:01:00.000Z',
      },
    )
  })

  it('allows equal startedAt and submittedAt timestamps', () => {
    const { attempt } = addQuizAttempt(
      validAttemptInput({
        startedAt: DEFAULT_STARTED_AT,
        submittedAt: DEFAULT_STARTED_AT,
      }),
    )

    expect(attempt.startedAt).toBe(DEFAULT_STARTED_AT)
    expect(attempt.submittedAt).toBe(DEFAULT_STARTED_AT)
  })

  it('adds an attempt with valid ISO timestamps', () => {
    const { attempt, attempts } = addQuizAttempt(validAttemptInput())

    expect(attempt.startedAt).toBe(DEFAULT_STARTED_AT)
    expect(attempt.submittedAt).toBe(DEFAULT_SUBMITTED_AT)
    expect(attempts).toHaveLength(1)
  })

  it('rejects a duplicate attemptId for the same quiz', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'duplicate-attempt-id',
      }),
    ).attempts

    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          attemptInputFor(html010Quiz, [false, true, false], {
            attempts: history,
            attemptId: 'duplicate-attempt-id',
          }),
        ),
      'duplicate_attempt_id',
      {
        attemptId: 'duplicate-attempt-id',
      },
    )
  })

  it('rejects a duplicate attemptId for another quizId', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'duplicate-attempt-id',
      }),
    ).attempts

    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          attemptInputFor(html021Quiz, [true, false, false], {
            attempts: history,
            attemptId: 'duplicate-attempt-id',
          }),
        ),
      'duplicate_attempt_id',
      {
        attemptId: 'duplicate-attempt-id',
      },
    )
  })

  it('rejects a duplicate attemptId for another nodeId', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'duplicate-attempt-id',
      }),
    ).attempts

    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          attemptInputFor(css011Quiz, [true, false, false], {
            attempts: history,
            attemptId: 'duplicate-attempt-id',
          }),
        ),
      'duplicate_attempt_id',
      {
        attemptId: 'duplicate-attempt-id',
      },
    )
  })

  it('allows another attempt when attemptId is different', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'first-attempt-id',
      }),
    ).attempts
    const { attempts } = addQuizAttempt(
      attemptInputFor(html010Quiz, [false, true, false], {
        attempts: history,
        attemptId: 'second-attempt-id',
      }),
    )

    expect(attempts.map(attempt => attempt.attemptId)).toEqual([
      'first-attempt-id',
      'second-attempt-id',
    ])
  })

  it('reports duplicate_attempt_id and the duplicate id in details', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'duplicate-attempt-id',
      }),
    ).attempts

    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          attemptInputFor(html021Quiz, [true, false, false], {
            attempts: history,
            attemptId: 'duplicate-attempt-id',
          }),
        ),
      'duplicate_attempt_id',
      {
        attemptId: 'duplicate-attempt-id',
      },
    )
  })

  it('does not mutate existing history when attemptId is duplicated', () => {
    const history = addQuizAttempt(
      attemptInputFor(html010Quiz, [true, false, false], {
        attemptId: 'duplicate-attempt-id',
      }),
    ).attempts
    const beforeDuplicate = [...history]

    expectQuizAttemptInputError(
      () =>
        addQuizAttempt(
          attemptInputFor(html021Quiz, [true, false, false], {
            attempts: history,
            attemptId: 'duplicate-attempt-id',
          }),
        ),
      'duplicate_attempt_id',
    )
    expect(history).toEqual(beforeDuplicate)
    expect(history).toHaveLength(1)
  })

  it('creates deterministic attempt results when inputs and dependencies are the same', () => {
    const submission = submissionFor(html010Quiz, [true, false, false])
    const gradingResult = gradeQuizSubmission(html010Quiz, submission)
    const input = {
      attempts: [] satisfies readonly QuizAttemptResult[],
      submission,
      gradingResult,
      attemptId: 'attempt-stable',
      startedAt: '2026-07-07T00:00:00.000Z',
      submittedAt: '2026-07-07T00:01:00.000Z',
    }

    expect(addQuizAttempt(input)).toEqual(addQuizAttempt(input))
  })

  it('stores grading-aligned attempt results for the three pilot quiz nodes', () => {
    for (const quiz of [html010Quiz, html021Quiz, css011Quiz]) {
      const { attempt } = addAttempt([], quiz, [true, true, false], 1)

      expect(attempt.quizId).toBe(quiz.quizId)
      expect(attempt.nodeId).toBe(quiz.nodeId)
      expect(attempt.questionSetVersion).toBe(quiz.questionSetVersion)
      expect(attempt.score).toBe(2)
      expect(attempt.passScore).toBe(2)
      expect(attempt.passed).toBe(true)
      expect(attempt.answers).toHaveLength(3)
      expect(attempt.questionResults).toHaveLength(3)
      expect(attempt.attemptModelVersion).toBe(QUIZ_ATTEMPT_MODEL_VERSION)
    }
  })
})

function validAttemptInput(
  overrides: Partial<AddQuizAttemptInput> = {},
): AddQuizAttemptInput {
  return attemptInputFor(html010Quiz, [true, false, false], overrides)
}

function attemptInputFor(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
  overrides: Partial<AddQuizAttemptInput> = {},
): AddQuizAttemptInput {
  const submission = submissionFor(quiz, correctnessByQuestion)
  const gradingResult = gradeQuizSubmission(quiz, submission)

  return {
    attempts: [],
    submission,
    gradingResult,
    attemptId: 'attempt-valid',
    startedAt: DEFAULT_STARTED_AT,
    submittedAt: DEFAULT_SUBMITTED_AT,
    ...overrides,
  }
}

function addAttempt(
  attempts: readonly QuizAttemptResult[],
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
  attemptNumberForId: number,
) {
  const submission = submissionFor(quiz, correctnessByQuestion)
  const gradingResult = gradeQuizSubmission(quiz, submission)

  return addQuizAttempt({
    attempts,
    submission,
    gradingResult,
    attemptId: `${quiz.quizId}-attempt-${attemptNumberForId}`,
    startedAt: `2026-07-07T00:0${attemptNumberForId}:00.000Z`,
    submittedAt: `2026-07-07T00:0${attemptNumberForId}:30.000Z`,
  })
}

function expectQuizAttemptInputError(
  action: () => unknown,
  code: QuizAttemptInputError['code'],
  details?: Readonly<Record<string, string>>,
): void {
  let caughtError: unknown

  try {
    action()
  } catch (error) {
    caughtError = error
  }

  if (!(caughtError instanceof QuizAttemptInputError)) {
    expect(caughtError).toBeInstanceOf(QuizAttemptInputError)
    return
  }

  expect(caughtError.code).toBe(code)

  if (details !== undefined) {
    expect(caughtError.details).toMatchObject(details)
  }
}

function submissionFor(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
): QuizSubmission {
  return {
    quizId: quiz.quizId,
    answers: quiz.questions.map((question, index) => {
      const answer = correctnessByQuestion[index]
        ? correctAnswerFor(question)
        : incorrectAnswerFor(question)

      if (question.type === 'single-choice') {
        return {
          questionId: question.questionId,
          type: 'single-choice',
          choiceId: answer,
        }
      }

      return {
        questionId: question.questionId,
        type: 'code-completion',
        answer,
      }
    }),
  }
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
