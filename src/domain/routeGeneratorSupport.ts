import {
  getMvpErrorMapping,
  type MvpErrorMapping,
} from '../data/errorMappings'
import {
  isMvpNodeId,
  MVP_NODE_IDS,
  type MvpNodeId,
} from './mvpScope'
import type {
  ErrorHistoryEntry,
  QuizResult,
  RecommendationReason,
  RecommendationReasonCode,
  ReflectionEntry,
  RouteCatalog,
  RouteGenerationWarning,
} from './routeGeneration'

export type Priority = 1 | 2 | 3 | 4 | 5 | 6

export interface ValidCatalog {
  prerequisitesByNodeId: Map<MvpNodeId, MvpNodeId[]>
}

export interface CandidateSignal {
  priority: Priority
  reason: RecommendationReason
  timestamp: number
  repetition: number
  eligible: boolean
}

export interface Candidate {
  nodeId: MvpNodeId
  signals: CandidateSignal[]
  reasons: RecommendationReason[]
}

interface ValidErrorState {
  entry: ErrorHistoryEntry
  mapping: MvpErrorMapping
}

interface ValidReflectionState {
  nodeId: MvpNodeId
  struggledNodeIds: MvpNodeId[]
  submittedAt: string
}

const catalogOrder = new Map<string, number>(
  MVP_NODE_IDS.map((nodeId, index) => [nodeId, index])
)
const knownQuizIds = new Set(MVP_NODE_IDS.map(nodeId => `quiz-${nodeId}`))

const reasonOrder: Record<RecommendationReasonCode, number> = {
  IN_PROGRESS: 1,
  ERROR_REMEDIATION: 2,
  REVIEW: 3,
  QUIZ_FAILED: 4,
  REFLECTION_FLAG: 5,
  PREREQUISITE: 6,
  DIAGNOSIS_START: 7,
  NEXT_UNLOCKED: 8,
}

export function timestampValue(timestamp: string): number {
  const value = Date.parse(timestamp)
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value
}

function compareNumbersDescending(left: number, right: number): number {
  if (left === right) return 0
  return left > right ? -1 : 1
}

function compareCatalogOrder(left: MvpNodeId, right: MvpNodeId): number {
  return (catalogOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
    (catalogOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
}

export function warningList(
  warnings: ReadonlySet<RouteGenerationWarning>,
): RouteGenerationWarning[] {
  return [...warnings].sort((left, right) => left.localeCompare(right))
}

export function validateCatalog(catalog: RouteCatalog): ValidCatalog | null {
  if (
    catalog.catalogVersion.trim().length === 0 ||
    catalog.nodes.length !== MVP_NODE_IDS.length
  ) {
    return null
  }

  const prerequisitesByNodeId = new Map<MvpNodeId, MvpNodeId[]>()
  for (const node of catalog.nodes) {
    if (!isMvpNodeId(node.nodeId) || prerequisitesByNodeId.has(node.nodeId)) {
      return null
    }

    const prerequisites: MvpNodeId[] = []
    const prerequisiteIds = new Set<string>()
    for (const prerequisiteId of node.prerequisites) {
      if (!isMvpNodeId(prerequisiteId) || prerequisiteIds.has(prerequisiteId)) {
        return null
      }
      prerequisiteIds.add(prerequisiteId)
      prerequisites.push(prerequisiteId)
    }
    prerequisitesByNodeId.set(node.nodeId, prerequisites)
  }

  if (MVP_NODE_IDS.some(nodeId => !prerequisitesByNodeId.has(nodeId))) {
    return null
  }

  for (const prerequisites of prerequisitesByNodeId.values()) {
    if (prerequisites.some(nodeId => !prerequisitesByNodeId.has(nodeId))) {
      return null
    }
  }

  const visitState = new Map<MvpNodeId, 'visiting' | 'visited'>()
  const hasCycle = (nodeId: MvpNodeId): boolean => {
    const state = visitState.get(nodeId)
    if (state === 'visiting') return true
    if (state === 'visited') return false

    visitState.set(nodeId, 'visiting')
    const prerequisites = prerequisitesByNodeId.get(nodeId)
    if (!prerequisites || prerequisites.some(hasCycle)) return true
    visitState.set(nodeId, 'visited')
    return false
  }

  if (MVP_NODE_IDS.some(hasCycle)) return null

  return { prerequisitesByNodeId }
}

export function addUnknownWarning(
  warnings: Set<RouteGenerationWarning>,
  id: string,
): void {
  warnings.add(`UNKNOWN_ID:${id}`)
}

export function normalizeNodeIds(
  nodeIds: readonly string[],
  warnings: Set<RouteGenerationWarning>,
): Set<MvpNodeId> {
  const normalized = new Set<MvpNodeId>()
  for (const nodeId of nodeIds) {
    if (isMvpNodeId(nodeId)) {
      normalized.add(nodeId)
    } else {
      addUnknownWarning(warnings, nodeId)
    }
  }
  return normalized
}

function compareQuizResults(left: QuizResult, right: QuizResult): number {
  const timeComparison = compareNumbersDescending(
    timestampValue(left.takenAt),
    timestampValue(right.takenAt),
  )
  if (timeComparison !== 0) return timeComparison

  const attemptComparison = compareNumbersDescending(left.attempt, right.attempt)
  if (attemptComparison !== 0) return attemptComparison
  if (left.passed !== right.passed) return left.passed ? -1 : 1
  return compareNumbersDescending(left.score, right.score)
}

export function currentQuizResults(
  quizResults: readonly QuizResult[],
  warnings: Set<RouteGenerationWarning>,
): { current: QuizResult[]; validInputCount: number } {
  const grouped = new Map<string, QuizResult[]>()
  let validInputCount = 0

  for (const result of quizResults) {
    const validNodeId = isMvpNodeId(result.nodeId)
    const validQuizId = knownQuizIds.has(result.quizId)
    if (!validNodeId) addUnknownWarning(warnings, result.nodeId)
    if (!validQuizId) addUnknownWarning(warnings, result.quizId)
    if (!validNodeId || !validQuizId) continue
    if (result.quizId !== `quiz-${result.nodeId}`) {
      addUnknownWarning(warnings, result.quizId)
      continue
    }

    validInputCount += 1
    const existing = grouped.get(result.quizId) ?? []
    existing.push(result)
    grouped.set(result.quizId, existing)
  }

  const current = [...grouped.values()]
    .map(results => [...results].sort(compareQuizResults)[0])
    .filter((result): result is QuizResult => result !== undefined)
    .sort((left, right) => left.quizId.localeCompare(right.quizId))

  return { current, validInputCount }
}

function compareErrorEntries(
  left: ErrorHistoryEntry,
  right: ErrorHistoryEntry,
): number {
  const timeComparison = compareNumbersDescending(
    timestampValue(left.lastOccurredAt),
    timestampValue(right.lastOccurredAt),
  )
  if (timeComparison !== 0) return timeComparison

  const countComparison = compareNumbersDescending(
    left.occurrenceCount,
    right.occurrenceCount,
  )
  if (countComparison !== 0) return countComparison
  if (left.resolved !== right.resolved) return left.resolved ? 1 : -1
  return 0
}

export function currentErrorStates(
  errorHistory: readonly ErrorHistoryEntry[],
  warnings: Set<RouteGenerationWarning>,
): { current: ValidErrorState[]; validInputCount: number } {
  const grouped = new Map<string, ValidErrorState[]>()
  let validInputCount = 0

  for (const entry of errorHistory) {
    const mapping = getMvpErrorMapping(entry.errorId)
    if (!mapping) {
      addUnknownWarning(warnings, entry.errorId)
      continue
    }

    validInputCount += 1
    const existing = grouped.get(entry.errorId) ?? []
    existing.push({ entry, mapping })
    grouped.set(entry.errorId, existing)
  }

  const current = [...grouped.values()]
    .map(states =>
      [...states].sort((left, right) =>
        compareErrorEntries(left.entry, right.entry)
      )[0]
    )
    .filter((state): state is ValidErrorState => state !== undefined)
    .sort((left, right) => left.entry.errorId.localeCompare(right.entry.errorId))

  return { current, validInputCount }
}

function compareReflections(
  left: ValidReflectionState,
  right: ValidReflectionState,
): number {
  const timeComparison = compareNumbersDescending(
    timestampValue(left.submittedAt),
    timestampValue(right.submittedAt),
  )
  if (timeComparison !== 0) return timeComparison

  const nodeComparison = compareCatalogOrder(left.nodeId, right.nodeId)
  if (nodeComparison !== 0) return nodeComparison

  return left.struggledNodeIds.join(',').localeCompare(
    right.struggledNodeIds.join(',')
  )
}

export function currentReflection(
  reflections: readonly ReflectionEntry[],
  warnings: Set<RouteGenerationWarning>,
): { current: ValidReflectionState | null; validInputCount: number } {
  const validReflections: ValidReflectionState[] = []

  for (const reflection of reflections) {
    if (!isMvpNodeId(reflection.nodeId)) {
      addUnknownWarning(warnings, reflection.nodeId)
      for (const nodeId of reflection.struggledNodeIds) {
        if (!isMvpNodeId(nodeId)) addUnknownWarning(warnings, nodeId)
      }
      continue
    }

    const struggledNodeIds = [...normalizeNodeIds(
      reflection.struggledNodeIds,
      warnings,
    )].sort(compareCatalogOrder)
    validReflections.push({
      nodeId: reflection.nodeId,
      struggledNodeIds,
      submittedAt: reflection.submittedAt,
    })
  }

  return {
    current: [...validReflections].sort(compareReflections)[0] ?? null,
    validInputCount: validReflections.length,
  }
}

export function reasonKey(reason: RecommendationReason): string {
  return JSON.stringify([
    reason.reasonCode,
    reason.evidence.kind,
    reason.evidence.refId,
    reason.evidence.detail ?? '',
    reason.prerequisiteFor ?? '',
  ])
}

export function compareReasons(
  left: RecommendationReason,
  right: RecommendationReason,
): number {
  const codeComparison = reasonOrder[left.reasonCode] - reasonOrder[right.reasonCode]
  if (codeComparison !== 0) return codeComparison
  return reasonKey(left).localeCompare(reasonKey(right))
}

export function candidatePriority(candidate: Candidate): Priority {
  return Math.min(...candidate.signals.map(signal => signal.priority)) as Priority
}

function compareSignals(left: CandidateSignal, right: CandidateSignal): number {
  const timestampComparison = compareNumbersDescending(
    left.timestamp,
    right.timestamp,
  )
  if (timestampComparison !== 0) return timestampComparison

  const repetitionComparison = compareNumbersDescending(
    left.repetition,
    right.repetition,
  )
  if (repetitionComparison !== 0) return repetitionComparison
  return reasonKey(left.reason).localeCompare(reasonKey(right.reason))
}

function bestTieSignal(candidate: Candidate): CandidateSignal | null {
  const priority = candidatePriority(candidate)
  return [...candidate.signals]
    .filter(signal => signal.priority === priority)
    .sort(compareSignals)[0] ?? null
}

export function compareCandidates(left: Candidate, right: Candidate): number {
  const priorityComparison = candidatePriority(left) - candidatePriority(right)
  if (priorityComparison !== 0) return priorityComparison

  const leftSignal = bestTieSignal(left)
  const rightSignal = bestTieSignal(right)
  if (leftSignal && rightSignal) {
    const timestampComparison = compareNumbersDescending(
      leftSignal.timestamp,
      rightSignal.timestamp,
    )
    if (timestampComparison !== 0) return timestampComparison

    const repetitionComparison = compareNumbersDescending(
      leftSignal.repetition,
      rightSignal.repetition,
    )
    if (repetitionComparison !== 0) return repetitionComparison
  }

  return compareCatalogOrder(left.nodeId, right.nodeId)
}

export function errorReason(
  error: ErrorHistoryEntry,
  priority: number,
): RecommendationReason {
  return {
    reasonCode: 'ERROR_REMEDIATION',
    evidence: {
      kind: 'error',
      refId: error.errorId,
      detail: JSON.stringify({
        priority,
        occurrenceCount: error.occurrenceCount,
        lastOccurredAt: error.lastOccurredAt,
      }),
    },
  }
}

export function quizReason(result: QuizResult): RecommendationReason {
  return {
    reasonCode: 'QUIZ_FAILED',
    evidence: {
      kind: 'quiz',
      refId: result.quizId,
      detail: JSON.stringify({
        score: result.score,
        attempt: result.attempt,
        takenAt: result.takenAt,
      }),
    },
  }
}
