import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { gradeQuizSubmission, type QuizSubmission } from './grading'
import { css011Quiz } from './data/css-011'
import { html010Quiz } from './data/html-010'
import { html021Quiz } from './data/html-021'
import {
  buildQuizSubmission,
  createEmptyQuizAnswerState,
  gradeQuizUiAnswerState,
  isQuizReadyToSubmit,
  resolvePilotQuizByNodeId,
  setQuizQuestionAnswer,
  type QuizUiAnswerState,
} from './quizUiModel'
import type { QuizDefinition, QuizQuestion } from './types'

describe('quiz UI model', () => {
  it('resolves node-specific pilot quizzes for the three KAI-21 target nodes', () => {
    expect(resolvePilotQuizByNodeId('html-010')?.questions.map(question => question.questionId)).toEqual([
      'html-010-q1',
      'html-010-q2',
      'html-010-q3',
    ])
    expect(resolvePilotQuizByNodeId('html-021')?.questions.map(question => question.questionId)).toEqual([
      'html-021-q1',
      'html-021-q2',
      'html-021-q3',
    ])
    expect(resolvePilotQuizByNodeId('css-011')?.questions.map(question => question.questionId)).toEqual([
      'css-011-q1',
      'css-011-q2',
      'css-011-q3',
    ])
  })

  it('does not fall back to the old fixed quiz for unsupported nodes', () => {
    expect(resolvePilotQuizByNodeId('html-000')).toBeNull()
    expect(resolvePilotQuizByNodeId('unknown-node')).toBeNull()
  })

  it('keeps the old fixed question data out of Quiz.tsx', () => {
    const quizComponent = readFileSync('src/components/Quiz.tsx', 'utf8')

    expect(quizComponent).not.toContain('HTMLファイルの基本構造で、最初に書くべき宣言は何ですか？')
    expect(quizComponent).not.toContain('見出しを表すHTMLタグは < >です。（数字なしで回答）')
    expect(quizComponent).not.toContain('HTMLタグで、段落を表すのはどれですか？')
    expect(quizComponent).not.toContain('percentage >= 70')
  })

  it('builds QuizSubmission with single-choice choice IDs and code-completion strings', () => {
    let state = createEmptyQuizAnswerState(html010Quiz)
    state = setQuizQuestionAnswer(state, html010Quiz.questions[0], 'choice-1')
    state = setQuizQuestionAnswer(state, html010Quiz.questions[1], 'choice-2')
    state = setQuizQuestionAnswer(state, html010Quiz.questions[2], 'body')

    expect(buildQuizSubmission(html010Quiz, state)).toEqual({
      quizId: 'quiz-html-010',
      answers: [
        { questionId: 'html-010-q1', type: 'single-choice', choiceId: 'choice-1' },
        { questionId: 'html-010-q2', type: 'single-choice', choiceId: 'choice-2' },
        { questionId: 'html-010-q3', type: 'code-completion', answer: 'body' },
      ],
    })
  })

  it('delegates grading to the shared gradeQuizSubmission flow', () => {
    const state = answerQuiz(html010Quiz, [true, true, false])
    const calls: QuizSubmission[] = []

    const result = gradeQuizUiAnswerState(html010Quiz, state, (quiz, submission) => {
      calls.push(submission)
      return gradeQuizSubmission(quiz, submission)
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].quizId).toBe(html010Quiz.quizId)
    expect(calls[0].answers[0]).toEqual({
      questionId: 'html-010-q1',
      type: 'single-choice',
      choiceId: 'choice-1',
    })
    expect(result).toEqual(gradeQuizSubmission(html010Quiz, calls[0]))
  })

  it('uses QuizGradingResult as the result source for 2/3 pass and 1/3 fail', () => {
    const passingResult = gradeQuizUiAnswerState(html021Quiz, answerQuiz(html021Quiz, [true, true, false]))
    const failingResult = gradeQuizUiAnswerState(css011Quiz, answerQuiz(css011Quiz, [true, false, false]))

    expect(passingResult.score).toBe(2)
    expect(passingResult.maxScore).toBe(3)
    expect(passingResult.passScore).toBe(2)
    expect(passingResult.passed).toBe(true)
    expect(passingResult.questionResults.map(result => result.isCorrect)).toEqual([true, true, false])

    expect(failingResult.score).toBe(1)
    expect(failingResult.maxScore).toBe(3)
    expect(failingResult.passScore).toBe(2)
    expect(failingResult.passed).toBe(false)
    expect(failingResult.questionResults.map(result => result.isCorrect)).toEqual([true, false, false])
  })

  it('keeps unanswered state incomplete without manufacturing answers', () => {
    let state = createEmptyQuizAnswerState(html010Quiz)
    state = setQuizQuestionAnswer(state, html010Quiz.questions[0], 'choice-1')

    expect(isQuizReadyToSubmit(html010Quiz, state)).toBe(false)
    expect(buildQuizSubmission(html010Quiz, state).answers).toEqual([
      { questionId: 'html-010-q1', type: 'single-choice', choiceId: 'choice-1' },
    ])
  })

  it('keeps answer state scoped by quiz question IDs when the quiz changes', () => {
    let htmlState = createEmptyQuizAnswerState(html010Quiz)
    htmlState = setQuizQuestionAnswer(htmlState, html010Quiz.questions[0], 'choice-1')

    const cssState = createEmptyQuizAnswerState(css011Quiz)

    expect(buildQuizSubmission(html010Quiz, htmlState).answers).toHaveLength(1)
    expect(buildQuizSubmission(css011Quiz, cssState).answers).toHaveLength(0)
    expect(Object.keys(cssState)).toEqual(['css-011-q1', 'css-011-q2', 'css-011-q3'])
  })
})

function answerQuiz(
  quiz: QuizDefinition,
  correctnessByQuestion: readonly boolean[],
): QuizUiAnswerState {
  return quiz.questions.reduce<QuizUiAnswerState>((state, question, index) => {
    return setQuizQuestionAnswer(
      state,
      question,
      correctnessByQuestion[index]
        ? correctAnswerFor(question)
        : incorrectAnswerFor(question),
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
