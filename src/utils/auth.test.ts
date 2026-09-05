import { describe, expect, it } from 'vitest'
import { buildDiagnosisSavePayload } from './auth'

describe('diagnosis API payload', () => {
  it('contains only the three K-group answers', () => {
    const source = {
      programming_experience: 'yes' as const,
      rule_confidence: 'partial' as const,
      knowledge_concept: 'somewhat' as const,
      level: 'advanced',
      levelScore: 999,
      background: 'synthetic',
    }

    expect(buildDiagnosisSavePayload(source)).toEqual({
      answers: {
        programming_experience: 'yes',
        rule_confidence: 'partial',
        knowledge_concept: 'somewhat',
      },
    })
  })
})
