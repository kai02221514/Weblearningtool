import { describe, expect, it } from 'vitest'

import errorMappingsData from '../../data/errorMappings'
import { MVP_NODE_IDS } from '../../domain/mvpScope'
import { getPilotQuizDefinitions } from '../quiz/quizCatalog'
import { getPilotPracticeChallenge, pilotPracticeChallenges } from './pilotPracticeChallenges'
import { PILOT_PRACTICE_NODE_IDS } from './types'

describe('pilot practice challenge catalog', () => {
  it('defines exactly one node-specific challenge for each pilot node', () => {
    expect(Object.keys(pilotPracticeChallenges)).toEqual(PILOT_PRACTICE_NODE_IDS)

    for (const nodeId of PILOT_PRACTICE_NODE_IDS) {
      const challenge = getPilotPracticeChallenge(nodeId)

      expect(challenge?.practiceId).toBe('practice-profile-card')
      expect(challenge?.nodeId).toBe(nodeId)
      expect(challenge?.learningObjective.trim()).not.toBe('')
      expect(challenge?.initialCode.trim()).not.toBe('')
      expect(challenge?.completionConditions.length).toBeGreaterThan(0)
      expect(challenge?.acceptedSolutionConditions.length).toBeGreaterThan(0)
      expect(challenge?.expectedErrors.length).toBeGreaterThan(0)
    }
  })

  it('does not return a generic challenge for unsupported nodes', () => {
    expect(getPilotPracticeChallenge('html-000')).toBeUndefined()
    expect(getPilotPracticeChallenge('css-060')).toBeUndefined()
    expect(getPilotPracticeChallenge('unknown')).toBeUndefined()
  })

  it('references the existing quiz questions for the same node', () => {
    const quizzes = getPilotQuizDefinitions()

    for (const nodeId of PILOT_PRACTICE_NODE_IDS) {
      const challenge = pilotPracticeChallenges[nodeId]
      const quiz = quizzes.find(candidate => candidate.nodeId === nodeId)

      expect(quiz).toBeDefined()
      expect(challenge.sourceReferences.quizQuestionIds).toEqual(
        quiz?.questions.map(question => question.questionId),
      )
    }
  })

  it('keeps expected errors aligned with the KAI-14 catalog boundary', () => {
    const mvpNodeIds = new Set<string>(MVP_NODE_IDS)

    for (const challenge of Object.values(pilotPracticeChallenges)) {
      for (const expectedError of challenge.expectedErrors) {
        const errorId = 'errorId' in expectedError ? expectedError.errorId : undefined
        expect(expectedError.reviewNodeIds.every(nodeId => mvpNodeIds.has(nodeId))).toBe(true)

        if (expectedError.mappingStatus === 'unsupported') {
          expect(errorId).toBeUndefined()
          expect(expectedError.reviewNodeIds.length).toBeGreaterThan(0)
          continue
        }

        const mapping = errorMappingsData.errors.find(
          candidate => candidate.id === errorId,
        )

        expect(mapping).toBeDefined()
        expect(mapping?.scope).toBe(expectedError.mappingStatus)
        expect(mapping?.srk).toBe(expectedError.srk)
        expect(mapping?.nodeRefs.map(ref => ref.nodeId)).toEqual(expectedError.reviewNodeIds)
      }
    }
  })

  it('marks every non-automatic condition as display-only', () => {
    for (const challenge of Object.values(pilotPracticeChallenges)) {
      expect(challenge.completionConditions.some(condition => condition.mode === 'display-only')).toBe(true)
      expect(challenge.completionConditions.every(condition => (
        condition.mode === 'limited-automatic' || condition.mode === 'display-only'
      ))).toBe(true)
    }
  })
})
