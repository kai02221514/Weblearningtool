import { describe, expect, it } from 'vitest'

import { MVP_NODE_IDS, type MvpNodeId } from './mvpScope'
import {
  decideStartNode,
  getMvpRouteCatalog,
  type RouteCatalog,
  type RouteGenerationInput,
} from './routeGeneration'
import { ROUTE_DATA_VERSION, routeGenerator } from './routeGenerator'

const beginnerDiagnosis = decideStartNode({ programming_experience: 'no' })
const experiencedDiagnosis = decideStartNode({
  programming_experience: 'yes',
  rule_confidence: 'partial',
  knowledge_concept: 'structure_style',
})

type InputOverrides = Partial<Omit<RouteGenerationInput, 'catalog' | 'progress'>> & {
  catalog?: RouteCatalog
  progress?: Partial<RouteGenerationInput['progress']>
}

function inputFor(overrides: InputOverrides = {}): RouteGenerationInput {
  return {
    catalog: overrides.catalog ?? getMvpRouteCatalog(),
    diagnosis: overrides.diagnosis === undefined
      ? beginnerDiagnosis
      : overrides.diagnosis,
    progress: {
      completedNodeIds: overrides.progress?.completedNodeIds ?? [],
      assumedNodeIds: overrides.progress?.assumedNodeIds ?? [],
      inProgressNodeId: overrides.progress?.inProgressNodeId ?? null,
    },
    quizResults: overrides.quizResults ?? [],
    errorHistory: overrides.errorHistory ?? [],
    reflections: overrides.reflections ?? [],
    maxRecommendations: overrides.maxRecommendations ?? 3,
  }
}

function emptyPrerequisiteCatalog(): RouteCatalog {
  const catalog = getMvpRouteCatalog()
  return {
    ...catalog,
    nodes: catalog.nodes.map(node => ({ ...node, prerequisites: [] })),
  }
}

function routeIndex(route: readonly { nodeId: MvpNodeId }[], nodeId: MvpNodeId): number {
  return route.findIndex(item => item.nodeId === nodeId)
}

describe('routeGenerator representative scenarios', () => {
  it('§13.1 returns the full catalog route from html-000 for a complete beginner', () => {
    const result = routeGenerator(inputFor())

    expect(result.status).toBe('active')
    expect(result.nextNodeId).toBe('html-000')
    expect(result.route.map(item => item.nodeId)).toEqual([...MVP_NODE_IDS])
    expect(result.route.slice(0, 3).map(item => ({
      nodeId: item.nodeId,
      reasonCode: item.reasons[0]?.reasonCode,
      evidenceKind: item.reasons[0]?.evidence.kind,
      evidenceRefId: item.reasons[0]?.evidence.refId,
    }))).toEqual([
      {
        nodeId: 'html-000',
        reasonCode: 'DIAGNOSIS_START',
        evidenceKind: 'diagnosis',
        evidenceRefId: 'DG-RULE-1',
      },
      {
        nodeId: 'html-010',
        reasonCode: 'NEXT_UNLOCKED',
        evidenceKind: 'catalog',
        evidenceRefId: 'html-010',
      },
      {
        nodeId: 'html-020',
        reasonCode: 'NEXT_UNLOCKED',
        evidenceKind: 'catalog',
        evidenceRefId: 'html-020',
      },
    ])
    expect(result.presentedCount).toBe(3)
  })

  it('§13.2 starts at html-010 and treats html-000 as assumed', () => {
    const result = routeGenerator(inputFor({ diagnosis: experiencedDiagnosis }))

    expect(result.route.map(item => item.nodeId)).toEqual(
      MVP_NODE_IDS.filter(nodeId => nodeId !== 'html-000')
    )
    expect(result.nextNodeId).toBe('html-010')
    expect(result.route.slice(0, 3).map(item => item.nodeId)).toEqual([
      'html-010',
      'html-020',
      'html-021',
    ])
    expect(result.route[0]?.reasons).toEqual([
      {
        reasonCode: 'DIAGNOSIS_START',
        evidence: { kind: 'diagnosis', refId: 'DG-RULE-3' },
      },
    ])
  })

  it('§13.3 orders remediation, failed quiz, auxiliary remediation, and all reasons', () => {
    const result = routeGenerator(inputFor({
      progress: {
        completedNodeIds: [
          'html-000',
          'html-010',
          'html-020',
          'html-021',
          'html-022',
        ],
      },
      quizResults: [{
        quizId: 'quiz-html-031',
        nodeId: 'html-031',
        passed: false,
        score: 60,
        attempt: 1,
        takenAt: '2026-01-02T00:00:00.000Z',
      }],
      errorHistory: [{
        errorId: 'E_HTML_INVALID_NESTING',
        occurrenceCount: 1,
        lastOccurredAt: '2026-01-03T00:00:00.000Z',
        resolved: false,
      }],
      reflections: [{
        nodeId: 'html-022',
        struggledNodeIds: ['html-021'],
        submittedAt: '2026-01-01T00:00:00.000Z',
      }],
    }))

    expect(result.route.slice(0, 4).map(item => item.nodeId)).toEqual([
      'html-021',
      'html-031',
      'html-040',
      'css-000',
    ])
    expect(result.route[0]?.reasons.map(reason => reason.reasonCode)).toEqual([
      'ERROR_REMEDIATION',
      'REVIEW',
      'REFLECTION_FLAG',
    ])
    expect(result.route[1]?.reasons.map(reason => reason.reasonCode)).toEqual([
      'QUIZ_FAILED',
    ])
    expect(result.route[2]?.reasons.map(reason => reason.reasonCode)).toEqual([
      'ERROR_REMEDIATION',
    ])
  })
})

describe('routeGenerator priority and deterministic ordering', () => {
  it('returns every field identically across repeated execution', () => {
    const input = inputFor({
      errorHistory: [{
        errorId: 'E_HTML_INVALID_NESTING',
        occurrenceCount: 2,
        lastOccurredAt: '2026-01-03T00:00:00.000Z',
        resolved: false,
      }],
    })

    expect(routeGenerator(input)).toEqual(routeGenerator(input))
  })

  it('does not depend on input array or catalog array order', () => {
    const catalog = getMvpRouteCatalog()
    const progress = {
      completedNodeIds: ['html-000', 'html-010', 'html-020'],
      assumedNodeIds: [] as string[],
      inProgressNodeId: null,
    }
    const quizResults = [
      {
        quizId: 'quiz-html-031',
        nodeId: 'html-031',
        passed: false,
        score: 40,
        attempt: 1,
        takenAt: '2026-02-01T00:00:00.000Z',
      },
      {
        quizId: 'quiz-html-040',
        nodeId: 'html-040',
        passed: false,
        score: 50,
        attempt: 2,
        takenAt: '2026-02-02T00:00:00.000Z',
      },
    ]
    const errorHistory = [
      {
        errorId: 'E_HTML_HEADING_STRUCTURE',
        occurrenceCount: 1,
        lastOccurredAt: '2026-02-03T00:00:00.000Z',
        resolved: false,
      },
      {
        errorId: 'E_HTML_MISSING_REQUIRED_ATTR',
        occurrenceCount: 2,
        lastOccurredAt: '2026-02-04T00:00:00.000Z',
        resolved: false,
      },
    ]
    const reflections = [
      {
        nodeId: 'html-020',
        struggledNodeIds: ['html-040', 'html-031'],
        submittedAt: '2026-02-05T00:00:00.000Z',
      },
      {
        nodeId: 'html-010',
        struggledNodeIds: ['html-020'],
        submittedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const forward = inputFor({
      catalog,
      progress,
      quizResults,
      errorHistory,
      reflections,
    })
    const reversed = inputFor({
      catalog: {
        ...catalog,
        nodes: [...catalog.nodes].reverse().map(node => ({
          ...node,
          prerequisites: [...node.prerequisites].reverse(),
        })),
      },
      progress: {
        ...progress,
        completedNodeIds: [...progress.completedNodeIds].reverse(),
      },
      quizResults: [...quizResults].reverse(),
      errorHistory: [...errorHistory].reverse(),
      reflections: [...reflections].reverse(),
    })

    expect(routeGenerator(reversed)).toEqual(routeGenerator(forward))
  })

  it('applies P1 through P6 in their fixed relative order', () => {
    const result = routeGenerator(inputFor({
      catalog: emptyPrerequisiteCatalog(),
      progress: { inProgressNodeId: 'css-060' },
      quizResults: [{
        quizId: 'quiz-css-011',
        nodeId: 'css-011',
        passed: false,
        score: 50,
        attempt: 1,
        takenAt: '2026-01-02T00:00:00.000Z',
      }],
      errorHistory: [{
        errorId: 'E_HTML_INVALID_NESTING',
        occurrenceCount: 1,
        lastOccurredAt: '2026-01-03T00:00:00.000Z',
        resolved: false,
      }],
      reflections: [{
        nodeId: 'html-020',
        struggledNodeIds: ['html-022'],
        submittedAt: '2026-01-01T00:00:00.000Z',
      }],
    }))

    expect(result.route.slice(0, 6).map(item => item.nodeId)).toEqual([
      'css-060',
      'html-021',
      'css-011',
      'html-040',
      'html-022',
      'html-000',
    ])
  })

  it('breaks same-priority ties by recency, repetition, then MVP catalog order', () => {
    const result = routeGenerator(inputFor({
      catalog: emptyPrerequisiteCatalog(),
      errorHistory: [
        {
          errorId: 'E_HTML_HEADING_STRUCTURE',
          occurrenceCount: 1,
          lastOccurredAt: '2026-02-03T00:00:00.000Z',
          resolved: false,
        },
        {
          errorId: 'E_CSS_SYNTAX_MISSING_SEMICOLON',
          occurrenceCount: 4,
          lastOccurredAt: '2026-02-02T00:00:00.000Z',
          resolved: false,
        },
        {
          errorId: 'E_HTML_MISSING_REQUIRED_ATTR',
          occurrenceCount: 2,
          lastOccurredAt: '2026-02-02T00:00:00.000Z',
          resolved: false,
        },
        {
          errorId: 'E_LAYOUT_BOX_MODEL_MISUNDERSTANDING',
          occurrenceCount: 2,
          lastOccurredAt: '2026-02-02T00:00:00.000Z',
          resolved: false,
        },
      ],
    }))

    expect(result.route.slice(0, 4).map(item => item.nodeId)).toEqual([
      'html-031',
      'css-011',
      'html-022',
      'css-060',
    ])
  })
})

describe('routeGenerator prerequisites, review, and invariants', () => {
  it('recursively inserts unmet prerequisites before a candidate with prerequisiteFor', () => {
    const result = routeGenerator(inputFor({
      errorHistory: [{
        errorId: 'E_CSS_SELECTOR_NO_MATCH',
        occurrenceCount: 1,
        lastOccurredAt: '2026-03-01T00:00:00.000Z',
        resolved: false,
      }],
    }))
    const targetIndex = routeIndex(result.route, 'css-020')
    const expectedPrerequisites: MvpNodeId[] = [
      'html-000',
      'html-010',
      'html-020',
      'html-022',
      'css-000',
      'css-010',
      'css-011',
    ]

    expect(targetIndex).toBeGreaterThan(-1)
    for (const nodeId of expectedPrerequisites) {
      const prerequisiteIndex = routeIndex(result.route, nodeId)
      expect(prerequisiteIndex).toBeGreaterThanOrEqual(0)
      expect(prerequisiteIndex).toBeLessThan(targetIndex)
      expect(result.route[prerequisiteIndex]?.reasons).toContainEqual({
        reasonCode: 'PREREQUISITE',
        evidence: { kind: 'catalog', refId: nodeId },
        prerequisiteFor: 'css-020',
      })
    }
  })

  it('deduplicates a node while retaining error, quiz, reflection, and review reasons', () => {
    const result = routeGenerator(inputFor({
      progress: { completedNodeIds: ['html-021'] },
      quizResults: [{
        quizId: 'quiz-html-021',
        nodeId: 'html-021',
        passed: false,
        score: 50,
        attempt: 2,
        takenAt: '2026-03-02T00:00:00.000Z',
      }],
      errorHistory: [{
        errorId: 'E_HTML_INVALID_NESTING',
        occurrenceCount: 2,
        lastOccurredAt: '2026-03-03T00:00:00.000Z',
        resolved: false,
      }],
      reflections: [{
        nodeId: 'html-021',
        struggledNodeIds: ['html-021'],
        submittedAt: '2026-03-01T00:00:00.000Z',
      }],
    }))
    const entries = result.route.filter(item => item.nodeId === 'html-021')

    expect(entries).toHaveLength(1)
    expect(entries[0]?.reasons.map(reason => reason.reasonCode)).toEqual([
      'ERROR_REMEDIATION',
      'REVIEW',
      'QUIZ_FAILED',
      'REFLECTION_FLAG',
    ])
  })

  it('refutes an assumed node without mutating the diagnosis input', () => {
    const diagnosisBefore = structuredClone(experiencedDiagnosis)
    const input = inputFor({
      diagnosis: experiencedDiagnosis,
      quizResults: [{
        quizId: 'quiz-html-000',
        nodeId: 'html-000',
        passed: false,
        score: 0,
        attempt: 1,
        takenAt: '2026-03-01T00:00:00.000Z',
      }],
    })
    const result = routeGenerator(input)
    const html000 = result.route.find(item => item.nodeId === 'html-000')

    expect(html000?.reasons.map(reason => reason.reasonCode)).toEqual([
      'REVIEW',
      'QUIZ_FAILED',
    ])
    expect(experiencedDiagnosis).toEqual(diagnosisBefore)
  })

  it('keeps review until each active cause is resolved independently', () => {
    const progress = { completedNodeIds: ['html-021'] }
    const failedQuiz = {
      quizId: 'quiz-html-021',
      nodeId: 'html-021',
      passed: false,
      score: 50,
      attempt: 1,
      takenAt: '2026-03-01T00:00:00.000Z',
    }
    const activeError = {
      errorId: 'E_HTML_INVALID_NESTING',
      occurrenceCount: 1,
      lastOccurredAt: '2026-03-02T00:00:00.000Z',
      resolved: false,
    }
    const bothActive = routeGenerator(inputFor({
      progress,
      quizResults: [failedQuiz],
      errorHistory: [activeError],
    }))
    const quizStillActive = routeGenerator(inputFor({
      progress,
      quizResults: [failedQuiz],
      errorHistory: [{ ...activeError, resolved: true }],
    }))
    const bothResolved = routeGenerator(inputFor({
      progress,
      quizResults: [{ ...failedQuiz, passed: true }],
      errorHistory: [{ ...activeError, resolved: true }],
    }))

    expect(bothActive.route.some(item => item.nodeId === 'html-021')).toBe(true)
    expect(quizStillActive.route.find(item => item.nodeId === 'html-021')?.reasons
      .map(reason => reason.reasonCode)).toEqual(['REVIEW', 'QUIZ_FAILED'])
    expect(bothResolved.route.some(item => item.nodeId === 'html-021')).toBe(false)
  })

  it('includes every unmet prerequisite before its dependent route item', () => {
    const input = inputFor({
      progress: {
        completedNodeIds: [],
        assumedNodeIds: [],
      },
      errorHistory: [{
        errorId: 'E_LAYOUT_BOX_MODEL_MISUNDERSTANDING',
        occurrenceCount: 1,
        lastOccurredAt: '2026-03-01T00:00:00.000Z',
        resolved: false,
      }],
    })
    const result = routeGenerator(input)
    const routeNodeIds = result.route.map(item => item.nodeId)
    const knownNodeIds = new Set<string>(MVP_NODE_IDS)
    const catalog = new Map(input.catalog.nodes.map(node => [node.nodeId, node]))

    expect(routeNodeIds.every(nodeId => knownNodeIds.has(nodeId))).toBe(true)
    expect(new Set(routeNodeIds).size).toBe(routeNodeIds.length)
    expect(result.route.map(item => item.order)).toEqual(
      result.route.map((_, index) => index + 1)
    )
    for (const item of result.route) {
      const dependentIndex = routeNodeIds.findIndex(
        nodeId => nodeId === item.nodeId
      )
      const prerequisites = catalog.get(item.nodeId)?.prerequisites ?? []
      for (const prerequisiteId of prerequisites) {
        const prerequisiteIndex = routeNodeIds.findIndex(
          nodeId => nodeId === prerequisiteId
        )
        expect(prerequisiteIndex).toBeGreaterThanOrEqual(0)
        expect(prerequisiteIndex).toBeLessThan(dependentIndex)
      }
    }
  })
})

describe('routeGenerator missing input and error handling', () => {
  it('ignores unknown IDs and returns deterministic UNKNOWN_ID warnings', () => {
    const result = routeGenerator(inputFor({
      progress: {
        completedNodeIds: ['html-999'],
        inProgressNodeId: 'css-999',
      },
      quizResults: [{
        quizId: 'quiz-html-999',
        nodeId: 'html-998',
        passed: false,
        score: 0,
        attempt: 1,
        takenAt: '2026-04-01T00:00:00.000Z',
      }],
      errorHistory: [{
        errorId: 'E_UNKNOWN',
        occurrenceCount: 1,
        lastOccurredAt: '2026-04-01T00:00:00.000Z',
        resolved: false,
      }],
      reflections: [{
        nodeId: 'html-997',
        struggledNodeIds: ['html-996'],
        submittedAt: '2026-04-01T00:00:00.000Z',
      }],
    }))
    const expectedWarnings = [
      'UNKNOWN_ID:html-999',
      'UNKNOWN_ID:css-999',
      'UNKNOWN_ID:quiz-html-999',
      'UNKNOWN_ID:html-998',
      'UNKNOWN_ID:E_UNKNOWN',
      'UNKNOWN_ID:html-997',
      'UNKNOWN_ID:html-996',
    ].sort((left, right) => left.localeCompare(right))

    expect(result.status).toBe('active')
    expect(result.route.map(item => item.nodeId)).toEqual([...MVP_NODE_IDS])
    expect(result.warnings).toEqual(expectedWarnings)
  })

  it.each([
    ['cycle', (catalog: RouteCatalog) => ({
      ...catalog,
      nodes: catalog.nodes.map(node => node.nodeId === 'html-000'
        ? { ...node, prerequisites: ['css-060'] }
        : node),
    })],
    ['broken reference', (catalog: RouteCatalog) => ({
      ...catalog,
      nodes: catalog.nodes.filter(node => node.nodeId !== 'css-060'),
    })],
    ['non-MVP prerequisite', (catalog: RouteCatalog) => ({
      ...catalog,
      nodes: catalog.nodes.map(node => node.nodeId === 'html-010'
        ? { ...node, prerequisites: ['future-001'] }
        : node),
    })],
  ])('returns no partial route for a catalog %s', (_label, mutateCatalog) => {
    const result = routeGenerator(inputFor({
      catalog: mutateCatalog(getMvpRouteCatalog()),
    }))

    expect(result.status).toBe('error')
    expect(result.nextNodeId).toBeNull()
    expect(result.route).toEqual([])
    expect(result.presentedCount).toBe(0)
    expect(result.warnings).toEqual(['CATALOG_INVALID'])
  })

  it('returns insufficient-input and the full html-000 route without diagnosis or progress', () => {
    const result = routeGenerator(inputFor({ diagnosis: null }))

    expect(result.status).toBe('insufficient-input')
    expect(result.nextNodeId).toBe('html-000')
    expect(result.route.map(item => item.nodeId)).toEqual([...MVP_NODE_IDS])
    expect(result.warnings).toEqual(['DIAGNOSIS_MISSING'])
  })

  it('generates normally with a warning when diagnosis is missing but progress exists', () => {
    const result = routeGenerator(inputFor({
      diagnosis: null,
      progress: { completedNodeIds: ['html-000'] },
    }))

    expect(result.status).toBe('active')
    expect(result.nextNodeId).toBe('html-010')
    expect(result.warnings).toEqual(['DIAGNOSIS_MISSING'])
  })

  it('returns completed with an empty route when all nodes are complete without review causes', () => {
    const result = routeGenerator(inputFor({
      progress: { completedNodeIds: [...MVP_NODE_IDS] },
    }))

    expect(result.status).toBe('completed')
    expect(result.nextNodeId).toBeNull()
    expect(result.route).toEqual([])
    expect(result.presentedCount).toBe(0)
  })
})

describe('routeGenerator output contract', () => {
  it('keeps the full route while limiting presentedCount', () => {
    const result = routeGenerator(inputFor({ maxRecommendations: 2 }))

    expect(result.route).toHaveLength(MVP_NODE_IDS.length)
    expect(result.presentedCount).toBe(2)
  })

  it.each([
    [1, 1],
    [12, 12],
  ] as const)(
    'applies the maxRecommendations boundary %i without truncating the route',
    (maxRecommendations, expectedPresentedCount) => {
      const result = routeGenerator(inputFor({ maxRecommendations }))

      expect(result.route).toHaveLength(MVP_NODE_IDS.length)
      expect(result.presentedCount).toBe(expectedPresentedCount)
    },
  )

  it('returns deterministic specification, catalog, and reference-data versions', () => {
    const result = routeGenerator(inputFor())

    expect(result.specVersion).toBe('route-spec/1.0')
    expect(result.catalogVersion).toBe('1.0.0')
    expect(result.dataVersion).toBe('1.1.0')
    expect(result.dataVersion).toBe(ROUTE_DATA_VERSION)
    expect(result).not.toHaveProperty('generatedAt')
    expect(result).not.toHaveProperty('routeId')
  })

  it('gives every route item at least one structured, traceable reason', () => {
    const result = routeGenerator(inputFor({
      errorHistory: [{
        errorId: 'E_HTML_INVALID_NESTING',
        occurrenceCount: 1,
        lastOccurredAt: '2026-05-01T00:00:00.000Z',
        resolved: false,
      }],
    }))

    for (const item of result.route) {
      expect(item.reasons.length).toBeGreaterThan(0)
      for (const reason of item.reasons) {
        expect(reason.reasonCode.length).toBeGreaterThan(0)
        expect(reason.evidence.kind.length).toBeGreaterThan(0)
        expect(reason.evidence.refId.length).toBeGreaterThan(0)
      }
    }
  })
})
