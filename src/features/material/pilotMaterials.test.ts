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

function normalizeSourceText(value: string): string {
  return value
    .replaceAll('`', '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replaceAll('|', ' ')
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

  it('keeps every displayed block within the corresponding reviewed source section', () => {
    for (const material of getPilotLearningMaterials()) {
      const normalizedSourceSection = normalizeSourceText(getSourceSection(material.nodeId))

      for (const section of material.sections) {
        expect(normalizedSourceSection).toContain(normalizeSourceText(section.title))

        for (const block of section.blocks) {
          const displayedValues = block.kind === 'paragraph' || block.kind === 'code'
            ? [block.content]
            : block.kind === 'list'
              ? [...block.items]
              : [...block.headers, ...block.rows.flat()]

          for (const value of displayedValues) {
            expect(normalizedSourceSection).toContain(normalizeSourceText(value))
          }
        }
      }
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
