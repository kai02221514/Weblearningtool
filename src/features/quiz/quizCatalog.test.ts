import { describe, expect, it } from 'vitest'

import { MVP_NODE_IDS } from '../../domain/mvpScope'
import {
  PILOT_QUIZ_CATALOG,
  PILOT_QUIZ_NODE_IDS,
  type PilotQuizNodeId,
} from './quizCatalog'

const expectedQuestionSetVersionByNodeId = {
  'html-010': 'quiz-html-010/v0.1',
  'html-021': 'quiz-html-021/v0.1',
  'css-011': 'quiz-css-011/v0.1',
} as const satisfies Record<PilotQuizNodeId, string>

describe('pilot quiz catalog', () => {
  it('defines exactly three pilot quiz definitions for the approved nodes', () => {
    expect(PILOT_QUIZ_CATALOG).toHaveLength(3)
    expect(PILOT_QUIZ_CATALOG.map(quiz => quiz.nodeId)).toEqual([...PILOT_QUIZ_NODE_IDS])
  })

  it('defines exactly three questions per node and nine questions overall', () => {
    const questions = PILOT_QUIZ_CATALOG.flatMap(quiz => quiz.questions)

    expect(questions).toHaveLength(9)

    for (const quiz of PILOT_QUIZ_CATALOG) {
      expect(quiz.questions).toHaveLength(3)
    }
  })

  it('keeps quiz-level metadata aligned with the approved pilot documents', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      expect(quiz.quizId).toBe(`quiz-${quiz.nodeId}`)
      expect(quiz.questionSetVersion).toBe(expectedQuestionSetVersionByNodeId[quiz.nodeId])
      expect(quiz.questionSetVersion).not.toBe('')
      expect(quiz.maxScore).toBe(3)
      expect(quiz.passScore).toBe(2)
    }
  })

  it('keeps question metadata aligned with its parent quiz', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      for (const question of quiz.questions) {
        expect(question.quizId).toBe(quiz.quizId)
        expect(question.nodeId).toBe(quiz.nodeId)
        expect(question.questionSetVersion).toBe(quiz.questionSetVersion)
        expect(question.passScore).toBe(quiz.passScore)
        expect(question.prompt.trim()).not.toBe('')
        expect(question.explanation.trim()).not.toBe('')
      }
    }
  })

  it('uses only approved question formats', () => {
    const allowedFormats = new Set(['single-choice', 'code-completion'])

    for (const quiz of PILOT_QUIZ_CATALOG) {
      for (const question of quiz.questions) {
        expect(allowedFormats.has(question.type)).toBe(true)
      }
    }
  })

  it('defines unique quiz and question IDs', () => {
    const quizIds = PILOT_QUIZ_CATALOG.map(quiz => quiz.quizId)
    const questionIds = PILOT_QUIZ_CATALOG.flatMap(quiz =>
      quiz.questions.map(question => question.questionId)
    )

    expect(new Set(quizIds).size).toBe(quizIds.length)
    expect(new Set(questionIds).size).toBe(questionIds.length)
  })

  it('references only existing MVP nodes and does not list the target node as a prerequisite', () => {
    const mvpNodeIds = new Set(MVP_NODE_IDS)

    for (const quiz of PILOT_QUIZ_CATALOG) {
      expect(mvpNodeIds.has(quiz.nodeId)).toBe(true)

      for (const question of quiz.questions) {
        expect(mvpNodeIds.has(question.nodeId)).toBe(true)
        expect(mvpNodeIds.has(question.mainReviewNodeId)).toBe(true)

        for (const prerequisiteNodeId of question.relatedPrerequisiteNodeIds) {
          expect(mvpNodeIds.has(prerequisiteNodeId)).toBe(true)
          expect(prerequisiteNodeId).not.toBe(question.nodeId)
        }
      }
    }
  })

  it('keeps single-choice answers internally consistent', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      for (const question of quiz.questions) {
        if (question.type !== 'single-choice') continue

        const choiceIds = question.choices.map(choice => choice.id)

        expect(choiceIds.length).toBeGreaterThan(0)
        expect(new Set(choiceIds).size).toBe(choiceIds.length)
        expect(choiceIds).toContain(question.correctChoiceId)
        expect(question.acceptedAnswers).toEqual([])
      }
    }
  })

  it('keeps code-completion answer fields non-empty without promoting unresolved candidates', () => {
    for (const quiz of PILOT_QUIZ_CATALOG) {
      for (const question of quiz.questions) {
        if (question.type !== 'code-completion') continue

        expect(question.choices).toEqual([])
        expect(
          question.correctAnswer.trim() !== '' ||
            question.acceptedAnswers.some(answer => answer.trim() !== '')
        ).toBe(true)
        expect(question.acceptedAnswers).toContain(question.correctAnswer)

        for (const candidate of question.unresolvedAcceptedAnswerCandidates) {
          expect(question.acceptedAnswers).not.toContain(candidate)
        }
      }
    }
  })
})
