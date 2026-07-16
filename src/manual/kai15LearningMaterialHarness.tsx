import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { LearningModule } from '../components/LearningModule'
import { PracticeChallenge } from '../components/PracticeChallenge'
import { Quiz } from '../components/Quiz'
import { getMvpLearningNodes } from '../domain/mvpScope'
import '../index.css'

const HARNESS_NODE_IDS = ['html-010', 'html-021', 'css-011', 'html-000'] as const
type HarnessPhase = 'learning' | 'quiz' | 'practice'

const learningNodeNameById = new Map(
  getMvpLearningNodes().map(node => [node.id, node.title])
)

function Kai15LearningMaterialHarness() {
  const [nodeId, setNodeId] = useState<string>('html-010')
  const [phase, setPhase] = useState<HarnessPhase>('learning')
  const [lastEvent, setLastEvent] = useState('なし')
  const nodeName = learningNodeNameById.get(nodeId) ?? nodeId

  const resetNode = (nextNodeId: string) => {
    setNodeId(nextNodeId)
    setPhase('learning')
    setLastEvent('なし')
  }

  return (
    <>
      <aside className="border-b bg-amber-50 p-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <h1 className="font-semibold">KAI-15 LearningModule 手動確認ハーネス</h1>
          <p className="text-sm">
            非プロダクションのローカル確認専用です。認証、保存、研究データ送信は行いません。
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              対象ノード
              <select
                aria-label="対象ノード"
                className="rounded border bg-white px-2 py-1"
                value={nodeId}
                onChange={event => resetNode(event.target.value)}
              >
                {HARNESS_NODE_IDS.map(candidate => (
                  <option key={candidate} value={candidate}>{candidate}</option>
                ))}
              </select>
            </label>
            <span aria-live="polite">現在フェーズ: {phase}</span>
            <span aria-live="polite">最新コールバック: {lastEvent}</span>
          </div>
        </div>
      </aside>

      {phase === 'learning' && (
        <LearningModule
          key={`learning-${nodeId}`}
          currentNodeId={nodeId}
          currentNodeName={nodeName}
          onComplete={() => {
            setLastEvent(`onComplete nodeId=${nodeId}`)
            setPhase('quiz')
          }}
          onDashboard={() => setLastEvent('onDashboard')}
        />
      )}

      {phase === 'quiz' && (
        <Quiz
          key={`quiz-${nodeId}`}
          nodeId={nodeId}
          nodeName={nodeName}
          onComplete={score => {
            setLastEvent(`onComplete score=${score} nodeId=${nodeId}`)
            setPhase('practice')
          }}
          onDashboard={() => setLastEvent('onDashboard')}
          onReturnToLearning={() => setPhase('learning')}
        />
      )}

      {phase === 'practice' && (
        <PracticeChallenge
          key={`practice-${nodeId}`}
          nodeId={nodeId}
          onComplete={() => setLastEvent(`onComplete nodeId=${nodeId}`)}
          onDashboard={() => setLastEvent('onDashboard')}
          onStartLearning={reviewNodeId => resetNode(reviewNodeId)}
        />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Kai15LearningMaterialHarness />)
