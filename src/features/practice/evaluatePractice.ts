import type {
  PilotPracticeNodeId,
  PracticeConditionResult,
  PracticeEvaluationResult,
} from './types'
import { getPilotPracticeChallenge } from './pilotPracticeChallenges'

interface MarkupNode {
  name: string
  children: MarkupNode[]
  text: string
}

const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

function parseLimitedMarkup(code: string): { root: MarkupNode; wellFormed: boolean } {
  const root: MarkupNode = { name: '#root', children: [], text: '' }
  const stack = [root]
  const tokenPattern = /<!--[\s\S]*?-->|<!doctype\s+html\s*>|<\/?([a-z][a-z0-9-]*)\b[^>]*>|([^<]+)/gi
  let wellFormed = true
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(code)) !== null) {
    const token = match[0]
    const text = match[2]

    if (text !== undefined) {
      stack[stack.length - 1].text += text
      continue
    }
    if (token.startsWith('<!--') || /^<!doctype/i.test(token)) {
      continue
    }

    const name = match[1]?.toLowerCase()
    if (!name) continue

    if (token.startsWith('</')) {
      if (stack.length === 1 || stack[stack.length - 1].name !== name) {
        wellFormed = false
        continue
      }
      stack.pop()
      continue
    }

    const node: MarkupNode = { name, children: [], text: '' }
    stack[stack.length - 1].children.push(node)
    if (!token.endsWith('/>') && !VOID_ELEMENTS.has(name)) {
      stack.push(node)
    }
  }

  return { root, wellFormed: wellFormed && stack.length === 1 }
}

function directChild(node: MarkupNode | undefined, name: string): MarkupNode | undefined {
  return node?.children.find(child => child.name === name)
}

function textContent(node: MarkupNode | undefined): string {
  if (!node) return ''
  return `${node.text}${node.children.map(textContent).join('')}`.trim()
}

function evaluateHtml010(code: string): Record<string, boolean> {
  const parsed = parseLimitedMarkup(code)
  const html = directChild(parsed.root, 'html')
  const head = directChild(html, 'head')
  const body = directChild(html, 'body')
  const headIndex = html?.children.indexOf(head!) ?? -1
  const bodyIndex = html?.children.indexOf(body!) ?? -1
  const validStructure = parsed.wellFormed
    && html !== undefined
    && head !== undefined
    && body !== undefined
    && headIndex >= 0
    && bodyIndex > headIndex

  return {
    'doctype-first': /^\s*<!doctype\s+html\s*>\s*<html\b/i.test(code),
    'head-before-body': validStructure,
    'title-in-head': validStructure && textContent(directChild(head, 'title')).length > 0,
    'paragraph-in-body': validStructure && textContent(directChild(body, 'p')).length > 0,
  }
}

function evaluateHtml021(code: string): Record<string, boolean> {
  const parsed = parseLimitedMarkup(code)
  const findNodes = (node: MarkupNode, name: string): MarkupNode[] => [
    ...(node.name === name ? [node] : []),
    ...node.children.flatMap(child => findNodes(child, name)),
  ]
  const paragraphs = findNodes(parsed.root, 'p')
  const directStrong = paragraphs
    .map(paragraph => directChild(paragraph, 'strong'))
    .find((node): node is MarkupNode => node !== undefined)
  const validNesting = parsed.wellFormed && directStrong !== undefined

  return {
    'nested-strong': validNesting,
    'closing-order': validNesting,
    'important-text': validNesting && textContent(directStrong).includes('重要'),
  }
}

function evaluateCss011(code: string): Record<string, boolean> {
  const styleContents = [...code.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1])
  const pRules = styleContents.flatMap(styleContent => (
    [...styleContent.matchAll(/(?:^|})\s*p\s*\{([^}]*)\}/gi)].map(match => match[1])
  ))
  const hasBlue = (declarations: string) => /(?:^|;)\s*color\s*:\s*blue\s*;/i.test(`;${declarations}`)
  const hasFontSize = (declarations: string) => /(?:^|;)\s*font-size\s*:\s*20px\s*;/i.test(`;${declarations}`)
  const acceptedRule = pRules.find(declarations => hasBlue(declarations) && hasFontSize(declarations))

  return {
    'p-rule': pRules.length > 0,
    'blue-color': acceptedRule !== undefined,
    'font-size': acceptedRule !== undefined,
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
