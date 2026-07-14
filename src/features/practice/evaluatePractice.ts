import type {
  PilotPracticeNodeId,
  PracticeConditionResult,
  PracticeEvaluationResult,
} from './types'
import { getPilotPracticeChallenge } from './pilotPracticeChallenges'

const compact = (code: string) => code.replace(/\s+/g, ' ').trim()

function evaluateHtml010(code: string): Record<string, boolean> {
  const normalized = compact(code)
  const htmlMatch = normalized.match(/<html(?:\s[^>]*)?>([\s\S]*)<\/html>/i)
  const htmlContent = htmlMatch?.[1] ?? ''
  const headMatch = htmlContent.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i)
  const bodyMatch = htmlContent.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body>/i)
  const headIndex = htmlContent.search(/<head(?:\s[^>]*)?>/i)
  const bodyIndex = htmlContent.search(/<body(?:\s[^>]*)?>/i)

  return {
    'doctype-first': /^<!doctype html>\s*<html(?:\s[^>]*)?>/i.test(normalized),
    'head-before-body': headIndex >= 0 && bodyIndex > headIndex,
    'title-in-head': /<title(?:\s[^>]*)?>\s*[^<\s][\s\S]*?<\/title>/i.test(headMatch?.[1] ?? ''),
    'paragraph-in-body': /<p(?:\s[^>]*)?>\s*[^<\s][\s\S]*?<\/p>/i.test(bodyMatch?.[1] ?? ''),
  }
}

function evaluateHtml021(code: string): Record<string, boolean> {
  const normalized = compact(code)
  const nestedMatch = normalized.match(/<p(?:\s[^>]*)?>[\s\S]*?<strong(?:\s[^>]*)?>([\s\S]*?)<\/strong>[\s\S]*?<\/p>/i)

  return {
    'nested-strong': nestedMatch !== null,
    'closing-order': nestedMatch !== null && !/<p(?:\s[^>]*)?>[\s\S]*?<strong(?:\s[^>]*)?>[\s\S]*?<\/p>[\s\S]*?<\/strong>/i.test(normalized),
    'important-text': nestedMatch?.[1].includes('重要') ?? false,
  }
}

function evaluateCss011(code: string): Record<string, boolean> {
  const normalized = compact(code)
  const ruleMatch = normalized.match(/(?:^|[}>])\s*p\s*\{([^}]*)\}/i)
  const declarations = ruleMatch?.[1] ?? ''

  return {
    'p-rule': ruleMatch !== null,
    'blue-color': /(?:^|;)\s*color\s*:\s*blue\s*;/i.test(`;${declarations}`),
    'font-size': /(?:^|;)\s*font-size\s*:\s*20px\s*;/i.test(`;${declarations}`),
  }
}

const evaluators: Record<PilotPracticeNodeId, (code: string) => Record<string, boolean>> = {
  'html-010': evaluateHtml010,
  'html-021': evaluateHtml021,
  'css-011': evaluateCss011,
}

export function evaluatePracticeCode(
  nodeId: PilotPracticeNodeId,
  code: string,
): PracticeEvaluationResult {
  const challenge = getPilotPracticeChallenge(nodeId)
  if (!challenge) {
    throw new Error(`Unsupported pilot practice node: ${nodeId}`)
  }

  const automaticResults = evaluators[nodeId](code)
  const conditionResults: PracticeConditionResult[] = challenge.completionConditions.map(condition => ({
    ...condition,
    passed: condition.mode === 'display-only'
      ? null
      : (automaticResults[condition.id] ?? false),
  }))

  return {
    conditionResults,
    automaticChecksPassed: conditionResults
      .filter(condition => condition.mode === 'limited-automatic')
      .every(condition => condition.passed === true),
    note: '自動判定は対象構造の限定チェックです。見た目と意味の妥当性はプレビューで確認してください。',
  }
}
