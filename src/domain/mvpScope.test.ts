import { describe, expect, it } from 'vitest'

import {
  getMvpLearningNodes,
  isMvpNodeId,
  MVP_NODE_IDS,
} from './mvpScope'

const nodeIdPattern = /^(html|css)-[0-9]{3}$/

describe('MVP learning scope', () => {
  it('defines unique canonical MVP node IDs', () => {
    expect(new Set(MVP_NODE_IDS).size).toBe(MVP_NODE_IDS.length)
    expect(MVP_NODE_IDS.every(nodeId => nodeIdPattern.test(nodeId))).toBe(true)
  })

  it('resolves every MVP ID to a learning node in the declared order', () => {
    const nodes = getMvpLearningNodes()

    expect(nodes).toHaveLength(MVP_NODE_IDS.length)
    expect(nodes.map(node => node.id)).toEqual([...MVP_NODE_IDS])
  })

  it('keeps MVP prerequisites inside the MVP node set', () => {
    const mvpNodeIds = new Set<string>(MVP_NODE_IDS)

    for (const node of getMvpLearningNodes()) {
      expect(node.prerequisites.every(prerequisite => mvpNodeIds.has(prerequisite))).toBe(true)
    }
  })

  it('narrows known MVP node IDs and rejects non-MVP IDs', () => {
    expect(isMvpNodeId('html-010')).toBe(true)
    expect(isMvpNodeId('html-999')).toBe(false)
    expect(isMvpNodeId('html.navigation.links.a_href')).toBe(false)
  })
})
