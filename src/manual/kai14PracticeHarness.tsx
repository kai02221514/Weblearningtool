import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import { PracticeChallenge } from '../components/PracticeChallenge'
import '../index.css'

const HARNESS_CASES = {
  missingClosingTag: {
    errorId: 'E_HTML_MISSING_CLOSING_TAG',
    label: 'HTML閉じタグ不足',
    expectedNodeId: 'html-020',
    expectedNodeName: '要素とタグ',
    initialCode: `<!DOCTYPE html>
<html>
<head><title>閉じタグ確認</title></head>
<body>
  <h1>自己紹介</h1>
  <p>この段落には閉じタグがありません
</body>
</html>`,
  },
  invalidNesting: {
    errorId: 'E_HTML_INVALID_NESTING',
    label: 'HTML不正な入れ子',
    expectedNodeId: 'html-021',
    expectedNodeName: '入れ子構造',
    initialCode: `<!DOCTYPE html>
<html>
<head><title>入れ子確認</title></head>
<body>
  <h1>趣味</h1>
  <ul><p>読書</p></ul>
</body>
</html>`,
  },
  missingSemicolon: {
    errorId: 'E_CSS_SYNTAX_MISSING_SEMICOLON',
    label: 'CSSセミコロン不足',
    expectedNodeId: 'css-011',
    expectedNodeName: 'CSS基本構文',
    initialCode: `<!DOCTYPE html>
<html>
<head>
  <title>CSS構文確認</title>
  <style>
    body {
      color: red
    }
  </style>
</head>
<body><h1>自己紹介</h1></body>
</html>`,
  },
} as const

type HarnessCaseId = keyof typeof HARNESS_CASES

function Kai14PracticeHarness() {
  const [caseId, setCaseId] = useState<HarnessCaseId>('missingClosingTag')
  const [lastEvent, setLastEvent] = useState('なし')
  const selectedCase = HARNESS_CASES[caseId]

  return (
    <>
      <aside className="border-b bg-amber-50 p-4">
        <div className="mx-auto max-w-4xl space-y-2">
          <h1 className="font-semibold">KAI-14 PracticeChallenge 手動確認ハーネス</h1>
          <p className="text-sm">
            非プロダクションのローカル確認専用です。認証、Supabase、保存、研究データ送信は行いません。
          </p>
          <label className="flex items-center gap-2 text-sm">
            確認ケース
            <select
              aria-label="確認ケース"
              className="rounded border bg-white px-2 py-1"
              value={caseId}
              onChange={(event) => {
                setCaseId(event.target.value as HarnessCaseId)
                setLastEvent('なし')
              }}
            >
              {Object.entries(HARNESS_CASES).map(([candidateId, candidate]) => (
                <option key={candidateId} value={candidateId}>
                  {candidate.errorId}: {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm">
            期待する主推薦: <code>{selectedCase.expectedNodeId}</code> {selectedCase.expectedNodeName}
          </p>
          <p className="text-sm">
            「次にやるべき復習（優先）」の該当ノードをクリックし、下のコールバック表示を確認してください。
          </p>
          <p className="text-sm" aria-live="polite">最新コールバック: {lastEvent}</p>
        </div>
      </aside>
      <PracticeChallenge
        key={caseId}
        initialCode={selectedCase.initialCode}
        onComplete={() => setLastEvent('onComplete')}
        onDashboard={() => setLastEvent('onDashboard')}
        onStartLearning={(nodeId) => setLastEvent(`onStartLearning nodeId=${nodeId}`)}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Kai14PracticeHarness />)
