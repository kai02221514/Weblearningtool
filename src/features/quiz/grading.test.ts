import { describe, expect, it } from 'vitest'

import { css011Quiz } from './data/css-011'
import { html010Quiz } from './data/html-010'
import { html021Quiz } from './data/html-021'
import {
  QuizGradingInputError,
  gradeQuizQuestion,
  gradeQuizSubmission,
  normalizeCodeCompletionAnswer,
  type QuizSubmissionAnswer,
} from './grading'
import type {
  CodeCompletionQuestion,
  QuizDefinition,
  QuizQuestion,
  SingleChoiceQuestion,
} from './types'

const html010Q3 = getCodeCompletionQuestion(html010Quiz, 'html-010-q3')
const html021Q3 = getCodeCompletionQuestion(html021Quiz, 'html-021-q3')
const css011Q3 = getCodeCompletionQuestion(css011Quiz, 'css-011-q3')
const html010Q1 = getSingleChoiceQuestion(html010Quiz, 'html-010-q1')

const html010CorrectAnswers = [
  singleChoiceAnswer('html-010-q1', 'choice-1'),
  singleChoiceAnswer('html-010-q2', 'choice-1'),
  codeCompletionAnswer('html-010-q3', 'body'),
] as const

const html010IncorrectAnswers = [
  singleChoiceAnswer('html-010-q1', 'choice-2'),
  singleChoiceAnswer('html-010-q2', 'choice-2'),
  codeCompletionAnswer('html-010-q3', 'head'),
] as const

describe('normalizeCodeCompletionAnswer', () => {
  it('trims surrounding whitespace and lowercases within the declared normalization scope', () => {
    expect(
      normalizeCodeCompletionAnswer({
        answer: 'body',
        normalization: html010Q3.answerNormalization,
      })
    ).toBe('body')
    expect(
      normalizeCodeCompletionAnswer({
        answer: ' BODY ',
        normalization: html010Q3.answerNormalization,
      })
    ).toBe('body')
    expect(
      normalizeCodeCompletionAnswer({
        answer: '<BODY>',
        normalization: html010Q3.answerNormalization,
      })
    ).toBe('<body>')
    expect(
      normalizeCodeCompletionAnswer({
        answer: '</STRONG>',
        normalization: html021Q3.answerNormalization,
      })
    ).toBe('</strong>')
    expect(
      normalizeCodeCompletionAnswer({
        answer: ' COLOR ',
        normalization: css011Q3.answerNormalization,
      })
    ).toBe('color')
  })

  it('does not remove internal whitespace or punctuation beyond the declared rules', () => {
    expect(
      normalizeCodeCompletionAnswer({
        answer: 'bo dy',
        normalization: html010Q3.answerNormalization,
      })
    ).toBe('bo dy')
    expect(
      normalizeCodeCompletionAnswer({
        answer: '</BODY>',
        normalization: html010Q3.answerNormalization,
      })
    ).toBe('</body>')
    expect(
      normalizeCodeCompletionAnswer({
        answer: 'color:',
        normalization: css011Q3.answerNormalization,
      })
    ).toBe('color:')
  })
})

describe('gradeQuizQuestion for D-020 code-completion answers', () => {
  it.each(['body', 'BODY', ' Body ', '<body>', '<BODY>', ' <Body> '])(
    'grades html-010-q3 answer %s as correct',
    answer => {
      expect(gradeCodeCompletionAnswer(html010Q3, answer).isCorrect).toBe(true)
    },
  )

  it.each(['</body>', '/body', 'head', 'title', 'html', 'p', ''])(
    'grades html-010-q3 answer %s as incorrect',
    answer => {
      expect(gradeCodeCompletionAnswer(html010Q3, answer).isCorrect).toBe(false)
    },
  )

  it.each(['strong', 'STRONG', ' Strong ', '</strong>', '</STRONG>', ' </Strong> '])(
    'grades html-021-q3 answer %s as correct',
    answer => {
      expect(gradeCodeCompletionAnswer(html021Q3, answer).isCorrect).toBe(true)
    },
  )

  it.each(['/strong', '<strong>', 'p', 'body', ''])(
    'grades html-021-q3 answer %s as incorrect',
    answer => {
      expect(gradeCodeCompletionAnswer(html021Q3, answer).isCorrect).toBe(false)
    },
  )

  it.each(['color', 'COLOR', ' Color ', ' color '])(
    'grades css-011-q3 answer %s as correct',
    answer => {
      expect(gradeCodeCompletionAnswer(css011Q3, answer).isCorrect).toBe(true)
    },
  )

  it.each(['color:', 'colour', 'font-color', 'text-color', 'blue', ''])(
    'grades css-011-q3 answer %s as incorrect',
    answer => {
      expect(gradeCodeCompletionAnswer(css011Q3, answer).isCorrect).toBe(false)
    },
  )
})

describe('gradeQuizQuestion for single-choice answers', () => {
  it('grades the correct choice ID as correct', () => {
    expect(
      gradeQuizQuestion(html010Q1, singleChoiceAnswer('html-010-q1', 'choice-1')).isCorrect
    ).toBe(true)
  })

  it('grades an incorrect choice ID as incorrect', () => {
    expect(
      gradeQuizQuestion(html010Q1, singleChoiceAnswer('html-010-q1', 'choice-2')).isCorrect
    ).toBe(false)
  })

  it('does not grade matching choice label text as correct when the choice ID differs', () => {
    const result = gradeQuizQuestion(html010Q1, singleChoiceAnswer('html-010-q1', '<body>'))

    expect(result.isCorrect).toBe(false)
    if (result.questionType !== 'single-choice') {
      throw new Error('Expected a single-choice grading result.')
    }

    expect(result.choiceExists).toBe(false)
  })

  it('does not grade an unknown choice ID as correct', () => {
    const result = gradeQuizQuestion(html010Q1, singleChoiceAnswer('html-010-q1', 'choice-x'))

    expect(result.isCorrect).toBe(false)
    if (result.questionType !== 'single-choice') {
      throw new Error('Expected a single-choice grading result.')
    }

    expect(result.choiceExists).toBe(false)
  })
})

describe('gradeQuizSubmission', () => {
  it('returns a failed result for 0 of 3 correct answers', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: html010IncorrectAnswers,
    })

    expect(result.score).toBe(0)
    expect(result.maxScore).toBe(3)
    expect(result.passScore).toBe(2)
    expect(result.passed).toBe(false)
    expect(result.correctQuestionIds).toEqual([])
    expect(result.incorrectQuestionIds).toEqual([
      'html-010-q1',
      'html-010-q2',
      'html-010-q3',
    ])
  })

  it('returns a failed result for 1 of 3 correct answers', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: [
        html010CorrectAnswers[0],
        html010IncorrectAnswers[1],
        html010IncorrectAnswers[2],
      ],
    })

    expect(result.score).toBe(1)
    expect(result.passed).toBe(false)
    expect(result.correctQuestionIds).toEqual(['html-010-q1'])
    expect(result.incorrectQuestionIds).toEqual(['html-010-q2', 'html-010-q3'])
  })

  it('returns a passed result for 2 of 3 correct answers using passScore', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: [
        html010CorrectAnswers[0],
        html010CorrectAnswers[1],
        html010IncorrectAnswers[2],
      ],
    })

    expect(result.score).toBe(2)
    expect(result.quizId).toBe('quiz-html-010')
    expect(result.nodeId).toBe('html-010')
    expect(result.maxScore).toBe(html010Quiz.maxScore)
    expect(result.passScore).toBe(html010Quiz.passScore)
    expect(result.passed).toBe(true)
    expect(result.correctQuestionIds).toEqual(['html-010-q1', 'html-010-q2'])
    expect(result.incorrectQuestionIds).toEqual(['html-010-q3'])
    expect(result.questionSetVersion).toBe('quiz-html-010/v0.2')
    expect(result.questionResults).toHaveLength(3)
  })

  it('returns a passed result for 3 of 3 correct answers', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: html010CorrectAnswers,
    })

    expect(result.score).toBe(3)
    expect(result.passed).toBe(true)
    expect(result.correctQuestionIds).toEqual([
      'html-010-q1',
      'html-010-q2',
      'html-010-q3',
    ])
    expect(result.incorrectQuestionIds).toEqual([])
  })

  it('returns the same result for the same input', () => {
    const submission = {
      quizId: html010Quiz.quizId,
      answers: html010CorrectAnswers,
    }

    expect(gradeQuizSubmission(html010Quiz, submission)).toEqual(
      gradeQuizSubmission(html010Quiz, submission)
    )
  })
})

describe('gradeQuizSubmission implementation input validation', () => {
  it('treats an unanswered quiz question as incorrect within a completed submission', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: [html010CorrectAnswers[0]],
    })

    expect(result.score).toBe(1)
    expect(result.passed).toBe(false)
    expect(result.incorrectQuestionIds).toEqual(['html-010-q2', 'html-010-q3'])
    expect(result.questionResults[1].wasAnswered).toBe(false)
    expect(result.questionResults[2].wasAnswered).toBe(false)
  })

  it('throws for a surplus unknown questionId as implementation input validation', () => {
    expect(() =>
      gradeQuizSubmission(html010Quiz, {
        quizId: html010Quiz.quizId,
        answers: [
          ...html010CorrectAnswers,
          singleChoiceAnswer('html-010-q999', 'choice-1'),
        ],
      })
    ).toThrowInputError('unexpected_question_answer')
  })

  it('throws for a questionId from another quiz as implementation input validation', () => {
    expect(() =>
      gradeQuizSubmission(html010Quiz, {
        quizId: html010Quiz.quizId,
        answers: [
          html010CorrectAnswers[0],
          html010CorrectAnswers[1],
          singleChoiceAnswer('html-021-q1', 'choice-1'),
        ],
      })
    ).toThrowInputError('unexpected_question_answer')
  })

  it('throws for duplicate questionId answers as implementation input validation', () => {
    expect(() =>
      gradeQuizSubmission(html010Quiz, {
        quizId: html010Quiz.quizId,
        answers: [
          html010CorrectAnswers[0],
          singleChoiceAnswer('html-010-q1', 'choice-2'),
          html010CorrectAnswers[1],
          html010CorrectAnswers[2],
        ],
      })
    ).toThrowInputError('duplicate_question_answer')
  })

  it('does not grade a blank code-completion answer as correct', () => {
    const result = gradeQuizSubmission(html010Quiz, {
      quizId: html010Quiz.quizId,
      answers: [
        html010CorrectAnswers[0],
        html010CorrectAnswers[1],
        codeCompletionAnswer('html-010-q3', '   '),
      ],
    })

    expect(result.score).toBe(2)
    expect(result.incorrectQuestionIds).toEqual(['html-010-q3'])
    expect(result.questionResults[2].isCorrect).toBe(false)
  })

  it('throws for an invalid quizId as implementation input validation', () => {
    expect(() =>
      gradeQuizSubmission(html010Quiz, {
        quizId: 'quiz-unknown' as typeof html010Quiz.quizId,
        answers: html010CorrectAnswers,
      })
    ).toThrowInputError('quiz_id_mismatch')
  })

  it('throws for an answer type mismatch as implementation input validation', () => {
    expect(() =>
      gradeQuizSubmission(html010Quiz, {
        quizId: html010Quiz.quizId,
        answers: [
          codeCompletionAnswer('html-010-q1', 'choice-1'),
          html010CorrectAnswers[1],
          html010CorrectAnswers[2],
        ],
      })
    ).toThrowInputError('answer_type_mismatch')
  })
})

function gradeCodeCompletionAnswer(question: CodeCompletionQuestion, answer: string) {
  return gradeQuizQuestion(question, codeCompletionAnswer(question.questionId, answer))
}

function singleChoiceAnswer(
  questionId: string,
  choiceId: string,
): QuizSubmissionAnswer {
  return {
    questionId,
    type: 'single-choice',
    choiceId,
  }
}

function codeCompletionAnswer(
  questionId: string,
  answer: string,
): QuizSubmissionAnswer {
  return {
    questionId,
    type: 'code-completion',
    answer,
  }
}

function getSingleChoiceQuestion(
  quiz: QuizDefinition,
  questionId: string,
): SingleChoiceQuestion {
  const question = getQuestion(quiz, questionId)

  if (question.type !== 'single-choice') {
    throw new Error(`${questionId} is not a single-choice question.`)
  }

  return question
}

function getCodeCompletionQuestion(
  quiz: QuizDefinition,
  questionId: string,
): CodeCompletionQuestion {
  const question = getQuestion(quiz, questionId)

  if (question.type !== 'code-completion') {
    throw new Error(`${questionId} is not a code-completion question.`)
  }

  return question
}

function getQuestion(
  quiz: QuizDefinition,
  questionId: string,
): QuizQuestion {
  const question = quiz.questions.find(candidate => candidate.questionId === questionId)

  if (question === undefined) {
    throw new Error(`${questionId} was not found in ${quiz.quizId}.`)
  }

  return question
}

expect.extend({
  toThrowInputError(received: () => unknown, expectedCode: string) {
    try {
      received()
    } catch (error) {
      const pass = error instanceof QuizGradingInputError && error.code === expectedCode

      return {
        pass,
        message: () =>
          `expected function to throw QuizGradingInputError with code ${expectedCode}`,
      }
    }

    return {
      pass: false,
      message: () =>
        `expected function to throw QuizGradingInputError with code ${expectedCode}`,
    }
  },
})

declare module 'vitest' {
  interface Assertion<T = any> {
    toThrowInputError(expectedCode: string): T
  }
}
