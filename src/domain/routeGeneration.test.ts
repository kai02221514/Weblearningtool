import { describe, expect, it } from 'vitest'

import { MVP_NODE_IDS } from './mvpScope'
import {
  decideStartNode,
  getMvpRouteCatalog,
  ROUTE_SPEC_VERSION,
  type MaxRecommendations,
  type RouteGenerationInput,
} from './routeGeneration'

function requireMaxRecommendations(
  value: RouteGenerationInput['maxRecommendations'],
): MaxRecommendations {
  return value
}

describe('route-spec/1.0 start-node decision', () => {
  it('applies DG-RULE-1 before missing K-group answers', () => {
    expect(decideStartNode({ programming_experience: 'no' })).toEqual({
      startNodeId: 'html-000',
      assumedNodeIds: [],
      matchedRuleId: 'DG-RULE-1',
      usedAnswers: [
        { questionId: 'programming_experience', value: 'no' },
      ],
      warnings: [],
    })
  })

  it('applies DG-RULE-2 to low rule confidence or visual-only knowledge', () => {
    const lowConfidence = decideStartNode({
      programming_experience: 'yes',
      rule_confidence: 'low',
      knowledge_concept: 'structure_style',
    })
    const visualOnly = decideStartNode({
      programming_experience: 'yes',
      rule_confidence: 'confident',
      knowledge_concept: 'visual_only',
    })

    expect(lowConfidence.matchedRuleId).toBe('DG-RULE-2')
    expect(lowConfidence.startNodeId).toBe('html-000')
    expect(visualOnly.matchedRuleId).toBe('DG-RULE-2')
    expect(visualOnly.startNodeId).toBe('html-000')
  })

  it('applies DG-RULE-3 and assumes only html-000', () => {
    expect(decideStartNode({
      programming_experience: 'yes',
      rule_confidence: 'partial',
      knowledge_concept: 'structure_style',
    })).toEqual({
      startNodeId: 'html-010',
      assumedNodeIds: ['html-000'],
      matchedRuleId: 'DG-RULE-3',
      usedAnswers: [
        { questionId: 'programming_experience', value: 'yes' },
        { questionId: 'rule_confidence', value: 'partial' },
        { questionId: 'knowledge_concept', value: 'structure_style' },
      ],
      warnings: [],
    })
  })

  it('applies DG-RULE-4 with distinct missing and incomplete warnings', () => {
    expect(decideStartNode(null)).toEqual({
      startNodeId: 'html-000',
      assumedNodeIds: [],
      matchedRuleId: 'DG-RULE-4',
      usedAnswers: [],
      warnings: ['DIAGNOSIS_MISSING'],
    })

    expect(decideStartNode({
      programming_experience: 'yes',
      rule_confidence: 'unsupported',
      knowledge_concept: 'somewhat',
    })).toEqual({
      startNodeId: 'html-000',
      assumedNodeIds: [],
      matchedRuleId: 'DG-RULE-4',
      usedAnswers: [
        { questionId: 'programming_experience', value: 'yes' },
        { questionId: 'knowledge_concept', value: 'somewhat' },
      ],
      warnings: ['DIAGNOSIS_INCOMPLETE'],
    })
  })
})

describe('route-spec/1.0 catalog contract', () => {
  it('derives the versioned MVP route catalog without duplicating its node order', () => {
    const catalog = getMvpRouteCatalog()

    expect(ROUTE_SPEC_VERSION).toBe('route-spec/1.0')
    expect(catalog.catalogVersion).toBe('1.0.0')
    expect(catalog.nodes.map(node => node.nodeId)).toEqual([...MVP_NODE_IDS])
  })
})

describe('route-spec/1.0 input contract', () => {
  it('accepts only integer maxRecommendations from 1 through 12', () => {
    const minimum = requireMaxRecommendations(1)
    const maximum = requireMaxRecommendations(12)

    // @ts-expect-error maxRecommendations excludes zero.
    requireMaxRecommendations(0)
    // @ts-expect-error maxRecommendations excludes negative integers.
    requireMaxRecommendations(-1)
    // @ts-expect-error maxRecommendations excludes fractional values.
    requireMaxRecommendations(1.5)
    // @ts-expect-error maxRecommendations excludes values above 12.
    requireMaxRecommendations(13)

    expect([minimum, maximum]).toEqual([1, 12])
  })
})
