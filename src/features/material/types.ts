import type { MvpNodeId } from '../../domain/mvpScope'

export const PILOT_MATERIAL_NODE_IDS = [
  'html-010',
  'html-021',
  'css-011',
] as const satisfies readonly MvpNodeId[]

export type PilotMaterialNodeId = (typeof PILOT_MATERIAL_NODE_IDS)[number]

export type LearningMaterialBlock =
  | {
      kind: 'paragraph'
      content: string
    }
  | {
      kind: 'code'
      language: 'html' | 'css'
      content: string
    }
  | {
      kind: 'list'
      ordered: boolean
      items: readonly string[]
    }
  | {
      kind: 'table'
      headers: readonly string[]
      rows: readonly (readonly string[])[]
    }

export interface LearningMaterialSection {
  sectionId: string
  title: string
  blocks: readonly LearningMaterialBlock[]
}

export interface LearningMaterialDefinition {
  nodeId: PilotMaterialNodeId
  title: string
  reviewStatus: '研究者レビュー済み・予備試行前'
  statusNote: string
  sourceDocumentPath: 'docs/content/pilot-material-draft.md'
  sourceSection: string
  sections: readonly LearningMaterialSection[]
}
