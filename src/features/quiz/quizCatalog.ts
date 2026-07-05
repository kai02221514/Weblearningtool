import { css011Quiz } from './data/css-011'
import { html010Quiz } from './data/html-010'
import { html021Quiz } from './data/html-021'
import type { QuizDefinition } from './types'

export const PILOT_QUIZ_NODE_IDS = [
  'html-010',
  'html-021',
  'css-011',
] as const

export type PilotQuizNodeId = (typeof PILOT_QUIZ_NODE_IDS)[number]

export const PILOT_QUIZ_CATALOG: readonly QuizDefinition[] = [
  html010Quiz,
  html021Quiz,
  css011Quiz,
] as const

export function getPilotQuizDefinitions(): readonly QuizDefinition[] {
  return PILOT_QUIZ_CATALOG
}
