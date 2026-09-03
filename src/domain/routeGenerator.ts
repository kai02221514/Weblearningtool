import errorMappingsData from '../data/errorMappings'
import {
  isMvpNodeId,
  MVP_NODE_IDS,
  type MvpNodeId,
} from './mvpScope'
import {
  ROUTE_SPEC_VERSION,
  type RecommendationReason,
  type RouteGenerationInput,
  type RouteGenerationResult,
  type RouteGenerationWarning,
} from './routeGeneration'
import {
  addUnknownWarning,
  candidatePriority,
  compareCandidates,
  compareReasons,
  currentErrorStates,
  currentQuizResults,
  currentReflection,
  errorReason,
  normalizeNodeIds,
  quizReason,
  reasonKey,
  timestampValue,
  validateCatalog,
  warningList,
  type Candidate,
  type CandidateSignal,
  type Priority,
} from './routeGeneratorSupport'

export const ROUTE_DATA_VERSION = errorMappingsData.version

function createErrorResult(
  input: RouteGenerationInput,
  warnings: ReadonlySet<RouteGenerationWarning>,
): RouteGenerationResult {
  return {
    specVersion: ROUTE_SPEC_VERSION,
    catalogVersion: input.catalog.catalogVersion,
    dataVersion: ROUTE_DATA_VERSION,
    status: 'error',
    nextNodeId: null,
    route: [],
    presentedCount: 0,
    warnings: warningList(warnings),
  }
}

export function routeGenerator(input: RouteGenerationInput): RouteGenerationResult {
  const warnings = new Set<RouteGenerationWarning>()
  const catalog = validateCatalog(input.catalog)
  if (!catalog) {
    warnings.add('CATALOG_INVALID')
    return createErrorResult(input, warnings)
  }

  if (input.diagnosis === null) {
    warnings.add('DIAGNOSIS_MISSING')
  } else {
    for (const warning of input.diagnosis.warnings) warnings.add(warning)
  }

  const completedNodeIds = normalizeNodeIds(
    input.progress.completedNodeIds,
    warnings,
  )
  const progressAssumedNodeIds = normalizeNodeIds(
    input.progress.assumedNodeIds,
    warnings,
  )
  const diagnosisAssumedNodeIds = normalizeNodeIds(
    input.diagnosis?.assumedNodeIds ?? [],
    warnings,
  )
  const assumedNodeIds = new Set<MvpNodeId>([
    ...progressAssumedNodeIds,
    ...diagnosisAssumedNodeIds,
  ])

  let inProgressNodeId: MvpNodeId | null = null
  if (input.progress.inProgressNodeId !== null) {
    if (isMvpNodeId(input.progress.inProgressNodeId)) {
      inProgressNodeId = input.progress.inProgressNodeId
    } else {
      addUnknownWarning(warnings, input.progress.inProgressNodeId)
    }
  }

  const quizzes = currentQuizResults(input.quizResults, warnings)
  const activeQuizFailures = quizzes.current.filter(result => !result.passed)
  const errors = currentErrorStates(input.errorHistory, warnings)
  const activeErrors = errors.current.filter(state => !state.entry.resolved)
  const reflection = currentReflection(input.reflections, warnings)

  const failedNodeIds = new Set<MvpNodeId>(
    activeQuizFailures
      .map(result => result.nodeId)
      .filter(isMvpNodeId)
  )
  const primaryErrorNodeIds = new Set<MvpNodeId>()
  for (const { mapping } of activeErrors) {
    for (const nodeRef of mapping.nodeRefs) {
      if (nodeRef.priority === 1) primaryErrorNodeIds.add(nodeRef.nodeId)
    }
  }

  const effectiveAssumedNodeIds = new Set<MvpNodeId>(assumedNodeIds)
  for (const nodeId of [...primaryErrorNodeIds, ...failedNodeIds]) {
    effectiveAssumedNodeIds.delete(nodeId)
  }

  const baseSatisfiedNodeIds = new Set<MvpNodeId>([
    ...completedNodeIds,
    ...assumedNodeIds,
  ])
  const prerequisiteSatisfiedNodeIds = new Set<MvpNodeId>([
    ...completedNodeIds,
    ...effectiveAssumedNodeIds,
  ])

  const signalsByNodeId = new Map<MvpNodeId, CandidateSignal[]>()
  const addSignal = (nodeId: MvpNodeId, signal: CandidateSignal): void => {
    const signals = signalsByNodeId.get(nodeId) ?? []
    signals.push(signal)
    signalsByNodeId.set(nodeId, signals)
  }

  if (inProgressNodeId && !completedNodeIds.has(inProgressNodeId)) {
    addSignal(inProgressNodeId, {
      priority: 1,
      reason: {
        reasonCode: 'IN_PROGRESS',
        evidence: { kind: 'progress', refId: inProgressNodeId },
      },
      timestamp: Number.NEGATIVE_INFINITY,
      repetition: 0,
      eligible: true,
    })
  }

  for (const { entry, mapping } of activeErrors) {
    for (const nodeRef of mapping.nodeRefs) {
      if (nodeRef.priority !== 1 && nodeRef.priority !== 2) continue
      const priority = nodeRef.priority === 1 ? 2 : 4
      addSignal(nodeRef.nodeId, {
        priority,
        reason: errorReason(entry, nodeRef.priority),
        timestamp: timestampValue(entry.lastOccurredAt),
        repetition: entry.occurrenceCount,
        eligible:
          nodeRef.priority === 1 || !baseSatisfiedNodeIds.has(nodeRef.nodeId),
      })
    }
  }

  for (const result of activeQuizFailures) {
    if (!isMvpNodeId(result.nodeId)) continue
    addSignal(result.nodeId, {
      priority: 3,
      reason: quizReason(result),
      timestamp: timestampValue(result.takenAt),
      repetition: result.attempt,
      eligible: true,
    })
  }

  if (reflection.current) {
    for (const nodeId of reflection.current.struggledNodeIds) {
      addSignal(nodeId, {
        priority: 5,
        reason: {
          reasonCode: 'REFLECTION_FLAG',
          evidence: {
            kind: 'reflection',
            refId: nodeId,
            detail: JSON.stringify({
              submittedAt: reflection.current.submittedAt,
            }),
          },
        },
        timestamp: timestampValue(reflection.current.submittedAt),
        repetition: 0,
        eligible: !baseSatisfiedNodeIds.has(nodeId),
      })
    }
  }

  const diagnosisStartNodeId = input.diagnosis?.startNodeId ?? 'html-000'
  const diagnosisRuleId = input.diagnosis?.matchedRuleId ?? 'DG-RULE-4'
  for (const nodeId of MVP_NODE_IDS) {
    if (baseSatisfiedNodeIds.has(nodeId) || signalsByNodeId.has(nodeId)) continue
    addSignal(nodeId, {
      priority: 6,
      reason: nodeId === diagnosisStartNodeId
        ? {
            reasonCode: 'DIAGNOSIS_START',
            evidence: { kind: 'diagnosis', refId: diagnosisRuleId },
          }
        : {
            reasonCode: 'NEXT_UNLOCKED',
            evidence: { kind: 'catalog', refId: nodeId },
          },
      timestamp: Number.NEGATIVE_INFINITY,
      repetition: 0,
      eligible: true,
    })
  }

  const candidates = new Map<MvpNodeId, Candidate>()
  for (const [nodeId, signals] of signalsByNodeId) {
    if (!signals.some(signal => signal.eligible)) continue

    const reasons = signals.map(signal => signal.reason)
    const hasReviewCause =
      primaryErrorNodeIds.has(nodeId) || failedNodeIds.has(nodeId)
    if (baseSatisfiedNodeIds.has(nodeId) && hasReviewCause) {
      reasons.push({
        reasonCode: 'REVIEW',
        evidence: {
          kind: 'progress',
          refId: nodeId,
          detail: JSON.stringify({
            state: completedNodeIds.has(nodeId) ? 'completed' : 'assumed',
          }),
        },
      })
    }

    candidates.set(nodeId, {
      nodeId,
      signals: [...signals],
      reasons: [...new Map(reasons.map(reason => [reasonKey(reason), reason])).values()]
        .sort(compareReasons),
    })
  }

  const originalPriorityCandidates = [...candidates.values()]
    .filter(candidate => candidatePriority(candidate) < 6)
    .sort(compareCandidates)

  const addPrerequisites = (
    nodeId: MvpNodeId,
    originalNodeId: MvpNodeId,
    inheritedPriority: Priority,
  ): void => {
    const prerequisites = catalog.prerequisitesByNodeId.get(nodeId) ?? []
    for (const prerequisiteId of prerequisites) {
      if (prerequisiteSatisfiedNodeIds.has(prerequisiteId)) continue

      const prerequisiteReason: RecommendationReason = {
        reasonCode: 'PREREQUISITE',
        evidence: { kind: 'catalog', refId: prerequisiteId },
        prerequisiteFor: originalNodeId,
      }
      let prerequisiteCandidate = candidates.get(prerequisiteId)
      if (!prerequisiteCandidate) {
        prerequisiteCandidate = {
          nodeId: prerequisiteId,
          signals: [],
          reasons: [],
        }
        candidates.set(prerequisiteId, prerequisiteCandidate)
      }
      if (!prerequisiteCandidate.reasons.some(
        reason => reasonKey(reason) === reasonKey(prerequisiteReason)
      )) {
        prerequisiteCandidate.reasons.push(prerequisiteReason)
        prerequisiteCandidate.reasons.sort(compareReasons)
        prerequisiteCandidate.signals.push({
          priority: inheritedPriority,
          reason: prerequisiteReason,
          timestamp: Number.NEGATIVE_INFINITY,
          repetition: 0,
          eligible: true,
        })
      }

      addPrerequisites(prerequisiteId, originalNodeId, inheritedPriority)
    }
  }

  for (const candidate of originalPriorityCandidates) {
    addPrerequisites(
      candidate.nodeId,
      candidate.nodeId,
      candidatePriority(candidate),
    )
  }

  const remainingNodeIds = new Set(candidates.keys())
  const emittedNodeIds = new Set<MvpNodeId>()
  const orderedCandidates: Candidate[] = []
  while (remainingNodeIds.size > 0) {
    const readyCandidates = [...remainingNodeIds]
      .filter(nodeId => {
        const prerequisites = catalog.prerequisitesByNodeId.get(nodeId) ?? []
        return prerequisites.every(prerequisiteId =>
          prerequisiteSatisfiedNodeIds.has(prerequisiteId) ||
          emittedNodeIds.has(prerequisiteId)
        )
      })
      .map(nodeId => candidates.get(nodeId))
      .filter((candidate): candidate is Candidate => candidate !== undefined)
      .sort(compareCandidates)

    const nextCandidate = readyCandidates[0]
    if (!nextCandidate) {
      warnings.add('CATALOG_INVALID')
      return createErrorResult(input, warnings)
    }

    orderedCandidates.push(nextCandidate)
    emittedNodeIds.add(nextCandidate.nodeId)
    remainingNodeIds.delete(nextCandidate.nodeId)
  }

  if (orderedCandidates.some(candidate => !isMvpNodeId(candidate.nodeId))) {
    warnings.add('NON_MVP_OUTPUT')
    return createErrorResult(input, warnings)
  }

  const route = orderedCandidates.map((candidate, index) => ({
    nodeId: candidate.nodeId,
    order: index + 1,
    reasons: candidate.reasons,
  }))
  const hasProgress =
    completedNodeIds.size > 0 ||
    assumedNodeIds.size > 0 ||
    inProgressNodeId !== null ||
    quizzes.validInputCount > 0 ||
    errors.validInputCount > 0 ||
    reflection.validInputCount > 0
  const allNodesCompleted = MVP_NODE_IDS.every(nodeId => completedNodeIds.has(nodeId))
  const status = route.length === 0 && allNodesCompleted
    ? 'completed'
    : input.diagnosis === null && !hasProgress
      ? 'insufficient-input'
      : 'active'

  return {
    specVersion: ROUTE_SPEC_VERSION,
    catalogVersion: input.catalog.catalogVersion,
    dataVersion: ROUTE_DATA_VERSION,
    status,
    nextNodeId: status === 'completed' ? null : route[0]?.nodeId ?? null,
    route,
    presentedCount: Math.min(input.maxRecommendations, route.length),
    warnings: warningList(warnings),
  }
}
