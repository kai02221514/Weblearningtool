import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { getMvpLearningNodes, MVP_NODE_IDS } from '../../domain/mvpScope'
import { PILOT_PRACTICE_NODE_IDS } from '../practice/types'
import { PILOT_QUIZ_NODE_IDS } from '../quiz/quizCatalog'
import {
  getPilotLearningMaterials,
  resolvePilotLearningMaterial,
} from './pilotMaterials'
import { PILOT_MATERIAL_NODE_IDS } from './types'

const expectedSectionTitlesByNodeId = {
  'html-010': [
    '3.1 最小のHTML文書',
    '3.2 <!DOCTYPE html> の役割',
    '3.3 html要素の役割',
    '3.4 head要素の役割',
    '3.5 body要素の役割',
    '3.6 よくある間違い',
  ],
  'html-021': [
    '4. html-021: 入れ子構造',
    '4.1 要素の中に要素を入れる（入れ子）',
    '4.2 閉じる順序の規則',
    '4.3 交差した入れ子は誤り',
    '4.4 インデントで構造を見やすくする',
    '4.5 よくある間違い',
  ],
  'css-011': [
    '5. css-011: CSS基本構文',
    '5.1 CSSルールセットの基本形',
    '5.2 複数の宣言を書く',
    '5.3 記号の書き間違いに注意',
    '5.4 色の指定（この単元で扱う最小範囲）',
    '5.5 この単元で使うプロパティ',
    '5.6 よくある間違い',
  ],
} as const

const sourceSectionHeadingByNodeId = {
  'html-010': '## 3. html-010: HTML基本骨格',
  'html-021': '## 4. html-021: 入れ子構造',
  'css-011': '## 5. css-011: CSS基本構文',
} as const

const sourceDocument = readFileSync(
  new URL('../../../docs/content/pilot-material-draft.md', import.meta.url),
  'utf8',
)

function normalizeDisplayText(value: string): string {
  return value
    .replaceAll('`', '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSourceSection(nodeId: (typeof PILOT_MATERIAL_NODE_IDS)[number]): string {
  const startHeading = sourceSectionHeadingByNodeId[nodeId]
  const start = sourceDocument.indexOf(startHeading)
  if (start < 0) throw new Error(`Missing source heading: ${startHeading}`)

  const nextSection = sourceDocument.indexOf('\n## ', start + startHeading.length)
  return sourceDocument.slice(start, nextSection < 0 ? undefined : nextSection)
}

function getSourceDisplayTokens(
  nodeId: (typeof PILOT_MATERIAL_NODE_IDS)[number],
): string[] {
  const tokens: string[] = []
  let paragraphLines: string[] = []
  let codeLines: string[] | null = null

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    tokens.push(normalizeDisplayText(paragraphLines.join(' ')))
    paragraphLines = []
  }

  for (const line of getSourceSection(nodeId).split('\n')) {
    if (line.startsWith('```')) {
      flushParagraph()
      if (codeLines === null) {
        codeLines = []
      } else {
        tokens.push(normalizeDisplayText(codeLines.join('\n')))
        codeLines = null
      }
      continue
    }

    if (codeLines !== null) {
      codeLines.push(line)
      continue
    }

    const heading = line.match(/^#{2,3}\s+(.+)$/)
    if (heading) {
      flushParagraph()
      tokens.push(normalizeDisplayText(heading[1]))
      continue
    }

    const listItem = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/)
    if (listItem) {
      flushParagraph()
      tokens.push(normalizeDisplayText(listItem[1]))
      continue
    }

    if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) {
      flushParagraph()
      continue
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph()
      tokens.push(
        ...line
          .slice(1, -1)
          .split('|')
          .map(cell => normalizeDisplayText(cell)),
      )
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      continue
    }

    paragraphLines.push(line)
  }

  flushParagraph()

  const material = resolvePilotLearningMaterial(nodeId)
  if (!material) throw new Error(`Missing pilot material: ${nodeId}`)

  return tokens[0] === normalizeDisplayText(material.sections[0].title)
    ? tokens
    : tokens.slice(1)
}

function getMaterialDisplayTokens(
  nodeId: (typeof PILOT_MATERIAL_NODE_IDS)[number],
): string[] {
  const material = resolvePilotLearningMaterial(nodeId)
  if (!material) throw new Error(`Missing pilot material: ${nodeId}`)

  return material.sections.flatMap(section => [
    normalizeDisplayText(section.title),
    ...section.blocks.flatMap(block => {
      if (block.kind === 'paragraph' || block.kind === 'code') {
        return [normalizeDisplayText(block.content)]
      }
      if (block.kind === 'list') return block.items.map(normalizeDisplayText)
      return [...block.headers, ...block.rows.flat()].map(normalizeDisplayText)
    }),
  ])
}

function removeFirstTokenSequence(tokens: string[], deleted: string[]): string[] {
  const start = tokens.findIndex((_, index) => (
    deleted.every((token, offset) => tokens[index + offset] === token)
  ))
  if (start < 0) throw new Error(`Missing deletion fixture: ${deleted.join(' / ')}`)
  return [...tokens.slice(0, start), ...tokens.slice(start + deleted.length)]
}

function getMaterialText(nodeId: (typeof PILOT_MATERIAL_NODE_IDS)[number]): string {
  const material = resolvePilotLearningMaterial(nodeId)
  if (!material) throw new Error(`Missing pilot material: ${nodeId}`)

  return material.sections
    .flatMap(section => [
      section.title,
      ...section.blocks.flatMap(block => {
        if (block.kind === 'paragraph' || block.kind === 'code') return [block.content]
        if (block.kind === 'list') return [...block.items]
        return [...block.headers, ...block.rows.flat()]
      }),
    ])
    .join('\n')
}

describe('pilot learning material catalog', () => {
  it('uses the same canonical pilot node ids as quiz and practice', () => {
    expect(PILOT_MATERIAL_NODE_IDS).toEqual(['html-010', 'html-021', 'css-011'])
    expect(PILOT_MATERIAL_NODE_IDS).toEqual(PILOT_QUIZ_NODE_IDS)
    expect(PILOT_MATERIAL_NODE_IDS).toEqual(PILOT_PRACTICE_NODE_IDS)

    const mvpNodeIds = new Set(MVP_NODE_IDS)
    const catalogNodeIds = new Set(getMvpLearningNodes().map(node => node.id))
    for (const nodeId of PILOT_MATERIAL_NODE_IDS) {
      expect(mvpNodeIds.has(nodeId)).toBe(true)
      expect(catalogNodeIds.has(nodeId)).toBe(true)
    }
  })

  it('keeps source references and section order aligned with the reviewed draft', () => {
    const materials = getPilotLearningMaterials()

    expect(materials.map(material => material.nodeId)).toEqual([...PILOT_MATERIAL_NODE_IDS])
    for (const material of materials) {
      expect(material.reviewStatus).toBe('研究者レビュー済み・予備試行前')
      expect(material.sourceDocumentPath).toBe('docs/content/pilot-material-draft.md')
      expect(material.sourceSection).toContain(material.nodeId)
      expect(material.sections.map(section => section.title)).toEqual(
        expectedSectionTitlesByNodeId[material.nodeId],
      )
      expect(new Set(material.sections.map(section => section.sectionId)).size).toBe(
        material.sections.length,
      )
      expect(material.sections.every(section => section.blocks.length > 0)).toBe(true)
    }
  })

  it('matches every displayed value to the corresponding reviewed source section in order', () => {
    for (const material of getPilotLearningMaterials()) {
      expect(getMaterialDisplayTokens(material.nodeId)).toEqual(
        getSourceDisplayTokens(material.nodeId),
      )
    }
  })

  it('detects deleted paragraphs, list items, code blocks, and table rows', () => {
    const deletionCases = [
      {
        nodeId: 'html-010' as const,
        deleted: [
          'Webページの元になるHTMLファイルには、共通の骨格がある。次のコードは、この単元で覚える最小のHTML文書である。',
        ],
      },
      {
        nodeId: 'html-010' as const,
        deleted: ['最初の行に <!DOCTYPE html> を書く。'],
      },
      {
        nodeId: 'html-021' as const,
        deleted: ['<p><strong>重要</strong>なお知らせです。</p>'],
      },
      {
        nodeId: 'css-011' as const,
        deleted: ['セレクタ', 'p', 'どのHTML要素に適用するかを指定する'],
      },
    ]

    for (const { nodeId, deleted } of deletionCases) {
      const sourceTokens = getSourceDisplayTokens(nodeId)
      const materialTokens = getMaterialDisplayTokens(nodeId)
      expect(removeFirstTokenSequence(materialTokens, deleted.map(normalizeDisplayText))).not.toEqual(
        sourceTokens,
      )
    }
  })

  it('preserves reviewed node-specific examples without mixing materials', () => {
    const html010 = getMaterialText('html-010')
    const html021 = getMaterialText('html-021')
    const css011 = getMaterialText('css-011')

    expect(html010).toContain('<!DOCTYPE html>')
    expect(html010).toContain('<title>ページのタイトル</title>')
    expect(html010).not.toContain('<p><strong>重要</strong>なお知らせです。</p>')
    expect(html010).not.toContain('font-size: 20px;')

    expect(html021).toContain('<p><strong>重要</strong>なお知らせです。</p>')
    expect(html021).toContain('<p><strong>重要</p></strong>')
    expect(html021).not.toContain('<title>ページのタイトル</title>')
    expect(html021).not.toContain('font-size: 20px;')

    expect(css011).toContain('「プロパティ: 値;」のひとまとまりを宣言と呼ぶ。')
    expect(css011).toContain('font-size: 20px;')
    expect(css011).not.toContain('<title>ページのタイトル</title>')
    expect(css011).not.toContain('<p><strong>重要</strong>なお知らせです。</p>')
  })

  it('returns no fallback material for unsupported nodes', () => {
    expect(resolvePilotLearningMaterial('html-000')).toBeNull()
    expect(resolvePilotLearningMaterial('html-020')).toBeNull()
    expect(resolvePilotLearningMaterial('unknown-node')).toBeNull()
  })
})
