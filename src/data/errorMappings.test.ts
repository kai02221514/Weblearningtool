import { describe, expect, it } from 'vitest'

import { MVP_NODE_IDS } from '../domain/mvpScope'
import errorMappingsData, { getMvpErrorMapping } from './errorMappings'

const expectedMvpErrorIds = [
  'E_HTML_MISSING_CLOSING_TAG',
  'E_HTML_INVALID_NESTING',
  'E_HTML_MISSING_REQUIRED_ATTR',
  'E_HTML_HEADING_STRUCTURE',
  'E_CSS_SYNTAX_MISSING_SEMICOLON',
  'E_CSS_SELECTOR_NO_MATCH',
  'E_LAYOUT_BOX_MODEL_MISUNDERSTANDING',
  'E_RUNTIME_RESOURCE_PATH',
]

const expectedOutOfMvpErrorIds = [
  'E_HTML_LINK_HREF_INVALID',
  'E_CSS_PROPERTY_UNKNOWN',
  'E_CSS_SPECIFICITY_OVERRIDE',
  'E_LAYOUT_FLEX_AXIS_CONFUSION',
  'E_DEBUG_TOOL_NOT_USED',
  'E_FORM_LABEL_ASSOCIATION',
]

const expectedMvpNodeRefs: Record<string, readonly string[]> = {
  E_HTML_MISSING_CLOSING_TAG: ['html-020', 'html-021'],
  E_HTML_INVALID_NESTING: ['html-021', 'html-040'],
  E_HTML_MISSING_REQUIRED_ATTR: ['html-022'],
  E_HTML_HEADING_STRUCTURE: ['html-031'],
  E_CSS_SYNTAX_MISSING_SEMICOLON: ['css-011'],
  E_CSS_SELECTOR_NO_MATCH: ['css-020', 'html-022'],
  E_LAYOUT_BOX_MODEL_MISUNDERSTANDING: ['css-060'],
  E_RUNTIME_RESOURCE_PATH: ['css-010', 'html-010'],
}

const sorted = (values: readonly string[]) => [...values].sort()

describe('error mapping integrity', () => {
  const mappings = errorMappingsData.errors
  const mvpMappings = mappings.filter(mapping => mapping.scope === 'mvp')
  const outOfMvpMappings = mappings.filter(mapping => mapping.scope === 'out-of-mvp')

  it('defines unique canonical error IDs', () => {
    const errorIds = mappings.map(mapping => mapping.id)

    expect(new Set(errorIds).size).toBe(errorIds.length)
    expect(errorIds.every(errorId => /^E_[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(errorId))).toBe(true)
  })

  it('defines the exact disjoint MVP and out-of-MVP error sets', () => {
    const mvpErrorIds = mvpMappings.map(mapping => mapping.id)
    const outOfMvpErrorIds = outOfMvpMappings.map(mapping => mapping.id)
    const overlap = mvpErrorIds.filter(errorId => outOfMvpErrorIds.includes(errorId))

    expect(sorted(mvpErrorIds)).toEqual(sorted(expectedMvpErrorIds))
    expect(sorted(outOfMvpErrorIds)).toEqual(sorted(expectedOutOfMvpErrorIds))
    expect(overlap).toEqual([])
    expect(sorted([...mvpErrorIds, ...outOfMvpErrorIds])).toEqual(
      sorted(mappings.map(mapping => mapping.id))
    )
  })

  it('keeps every MVP mapping connected only to canonical MVP nodes', () => {
    const mvpNodeIds = new Set<string>(MVP_NODE_IDS)

    for (const mapping of mvpMappings) {
      expect(mapping.nodeRefs.length).toBeGreaterThan(0)
      expect(mapping.nodeRefs.every(ref => mvpNodeIds.has(ref.nodeId))).toBe(true)
    }
  })

  it('keeps the canonical MVP node references in priority order', () => {
    for (const mapping of mvpMappings) {
      expect(mapping.nodeRefs.map(ref => ref.nodeId)).toEqual(
        expectedMvpNodeRefs[mapping.id]
      )
    }
  })

  it('keeps out-of-MVP mappings outside executable recommendation references', () => {
    for (const mapping of outOfMvpMappings) {
      expect(mapping.nodeRefs).toEqual([])
      expect(mapping.exclusionReason.trim().length).toBeGreaterThan(0)
    }
  })

  it('contains no dot-format ID in executable node references', () => {
    const executableNodeIds = mappings.flatMap(mapping =>
      mapping.nodeRefs.map(ref => ref.nodeId)
    )

    expect(executableNodeIds.some(nodeId => nodeId.includes('.'))).toBe(false)
  })

  it('returns only initial-MVP mappings from the runtime helper', () => {
    for (const errorId of expectedMvpErrorIds) {
      expect(getMvpErrorMapping(errorId)?.scope).toBe('mvp')
    }

    for (const errorId of expectedOutOfMvpErrorIds) {
      expect(getMvpErrorMapping(errorId)).toBeUndefined()
    }
  })
})
