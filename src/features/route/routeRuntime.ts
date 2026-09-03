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
  result: RouteGenerationResult
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
    result: generate(null, progress, []),
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
  const progress = {
    ...state.progress,
    completedNodeIds: state.progress.completedNodeIds.includes(nodeId)
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
    result: generate(state.diagnosis, state.progress, quizResults),
  }
}
