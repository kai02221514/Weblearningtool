import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { Quiz } from '../components/Quiz'
import '../index.css'

const HARNESS_NODE_IDS = ['html-010', 'html-021', 'css-011', 'html-000'] as const

function Kai24QuizHarness() {
  const [nodeId, setNodeId] = useState<string>('html-010')
  const [lastEvent, setLastEvent] = useState('なし')

  return (
    <>
      <aside className="border-b bg-amber-50 p-4">
        <div className="mx-auto max-w-4xl space-y-2">
          <h1 className="font-semibold">KAI-24 Quiz UI 手動確認ハーネス</h1>
          <p className="text-sm">
            非プロダクションのローカル確認専用です。認証情報や回答を外部送信せず、状態はページ内メモリだけに保持します。
          </p>
          <label className="flex items-center gap-2 text-sm">
            対象ノード
            <select
              aria-label="対象ノード"
              className="rounded border bg-white px-2 py-1"
              value={nodeId}
              onChange={(event) => {
                setNodeId(event.target.value)
                setLastEvent('なし')
              }}
            >
              {HARNESS_NODE_IDS.map(candidate => (
                <option key={candidate} value={candidate}>{candidate}</option>
              ))}
            </select>
          </label>
          <p className="text-sm" aria-live="polite">最新コールバック: {lastEvent}</p>
        </div>
      </aside>
      <Quiz
        key={nodeId}
        nodeId={nodeId}
        nodeName={nodeId}
        onComplete={(score) => setLastEvent(`onComplete score=${score}`)}
        onDashboard={() => setLastEvent('onDashboard')}
        onReturnToLearning={() => setLastEvent('onReturnToLearning')}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Kai24QuizHarness />)
