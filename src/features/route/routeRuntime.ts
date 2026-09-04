import type { QuizAttemptResult } from '../quiz/attempts'
import {
  decideStartNode,
  getMvpRouteCatalog,
  type DiagnosisAnswers,
  type QuizResult,
  type RouteGenerationInput,
  type RouteGenerationResult,
  type StartNodeDecision,
} from '../../domain/routeGeneration'
import { routeGenerator } from '../../domain/routeGenerator'

export interface RouteProgressState {
  completedNodeIds: string[]
  assumedNodeIds: string[]
  inProgressNodeId: string | null
}

export interface RouteRuntimeState {
  diagnosis: StartNodeDecision | null
  progress: RouteProgressState
  quizResults: QuizResult[]
  processedQuizAttemptIds: string[]
  result: RouteGenerationResult
}

export interface RouteDiagnosisSource {
  programming_experience?: string | null
  rule_confidence?: string | null
  knowledge_concept?: string | null
}

function generate(
  diagnosis: StartNodeDecision | null,
  progress: RouteProgressState,
  quizResults: QuizResult[],
): RouteGenerationResult {
  const input: RouteGenerationInput = {
    catalog: getMvpRouteCatalog(),
    diagnosis,
    progress,
    quizResults,
    errorHistory: [],
    reflections: [],
    maxRecommendations: 3,
  }

  return routeGenerator(input)
}

export function createInitialRouteRuntimeState(): RouteRuntimeState {
  const progress: RouteProgressState = {
    completedNodeIds: [],
    assumedNodeIds: [],
    inProgressNodeId: null,
  }

  return {
    diagnosis: null,
    progress,
    quizResults: [],
    processedQuizAttemptIds: [],
    result: generate(null, progress, []),
  }
}

export function pickRouteDiagnosisAnswers(
  source: RouteDiagnosisSource,
): DiagnosisAnswers {
  return {
    programming_experience: source.programming_experience,
    rule_confidence: source.rule_confidence,
    knowledge_concept: source.knowledge_concept,
  }
}

export function applyDiagnosis(
  state: RouteRuntimeState,
  answers: DiagnosisAnswers,
): RouteRuntimeState {
  const diagnosis = decideStartNode(answers)
  const progress = {
    ...state.progress,
    assumedNodeIds: [...diagnosis.assumedNodeIds],
  }

  return {
    ...state,
    diagnosis,
    progress,
    result: generate(diagnosis, progress, state.quizResults),
  }
}

export function startRouteNode(
  state: RouteRuntimeState,
  nodeId: string,
): RouteRuntimeState {
  return {
    ...state,
    progress: {
      ...state.progress,
      inProgressNodeId: nodeId,
    },
  }
}

export function completeRouteNode(
  state: RouteRuntimeState,
  nodeId: string,
): RouteRuntimeState {
  const alreadyCompleted = state.progress.completedNodeIds.includes(nodeId)
  const isReviewCompletion = alreadyCompleted
    && state.progress.inProgressNodeId === nodeId

  if (alreadyCompleted && !isReviewCompletion) return state

  const progress = {
    ...state.progress,
    completedNodeIds: alreadyCompleted
      ? state.progress.completedNodeIds
      : [...state.progress.completedNodeIds, nodeId],
    inProgressNodeId: null,
  }

  return {
    ...state,
    progress,
    result: generate(state.diagnosis, progress, state.quizResults),
  }
}

export function toRouteQuizResult(attempt: QuizAttemptResult): QuizResult {
  return {
    quizId: attempt.quizId,
    nodeId: attempt.nodeId,
    passed: attempt.passed,
    score: Math.round((attempt.score / attempt.maxScore) * 100),
    attempt: attempt.attemptNumber,
    takenAt: attempt.submittedAt,
  }
}

export function recordQuizAttempt(
  state: RouteRuntimeState,
  attempt: QuizAttemptResult,
): RouteRuntimeState {
  if (state.processedQuizAttemptIds.includes(attempt.attemptId)) return state

  const quizResult = toRouteQuizResult(attempt)
  const quizResults = [
    ...state.quizResults.filter(existing => !(
      existing.quizId === quizResult.quizId && existing.attempt === quizResult.attempt
    )),
    quizResult,
  ]

  return {
    ...state,
    quizResults,
    processedQuizAttemptIds: [...state.processedQuizAttemptIds, attempt.attemptId],
    result: generate(state.diagnosis, state.progress, quizResults),
  }
}
