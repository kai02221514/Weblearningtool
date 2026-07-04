import learningNodesData from '../data/learningNodes'

export const MVP_NODE_IDS = [
  'html-000',
  'html-010',
  'html-020',
  'html-021',
  'html-022',
  'html-031',
  'html-040',
  'css-000',
  'css-010',
  'css-011',
  'css-020',
  'css-060',
] as const

export type MvpNodeId = (typeof MVP_NODE_IDS)[number]

const allLearningNodes = [
  ...learningNodesData.html_nodes,
  ...learningNodesData.css_nodes,
] as LearningNode[]

export interface LearningNode {
  id: string
  title: string
  summary: string
  prerequisites: string[]
  type: string
  tags: string[]
  category?: string
  difficulty?: string
}

const learningNodeById = new Map(
  allLearningNodes.map(node => [node.id, node])
)
const mvpNodeIdSet = new Set<string>(MVP_NODE_IDS)

const mvpLearningNodes = MVP_NODE_IDS.map(nodeId => {
  const node = learningNodeById.get(nodeId)
  if (!node) {
    throw new Error(`MVP node is missing from the learning catalog: ${nodeId}`)
  }

  const outsidePrerequisite = node.prerequisites.find(
    prerequisiteId => !mvpNodeIdSet.has(prerequisiteId)
  )
  if (outsidePrerequisite) {
    throw new Error(
      `MVP node ${nodeId} references a non-MVP prerequisite: ${outsidePrerequisite}`
    )
  }

  return node
})

export function isMvpNodeId(nodeId: string): nodeId is MvpNodeId {
  return mvpNodeIdSet.has(nodeId)
}

export function getMvpLearningNodes(): readonly LearningNode[] {
  return mvpLearningNodes
}
