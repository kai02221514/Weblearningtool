import { createRoot } from 'react-dom/client'

import App from '../App'
import '../index.css'
import type { DiagnosisAnswers } from '../../supabase/functions/_shared/diagnosis'

let savedDiagnosis: DiagnosisAnswers | null = null
let failNextDiagnosisSave = false

const jsonResponse = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

globalThis.fetch = async (input, init) => {
  const url = String(input)
  const method = init?.method ?? 'GET'

  if (url.endsWith('/signup') && method === 'POST') {
    return jsonResponse({
      success: true,
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'synthetic@example.invalid',
      displayName: '合成利用者',
    })
  }

  if (url.endsWith('/signin') && method === 'POST') {
    return jsonResponse({
      success: true,
      accessToken: 'synthetic-access-token',
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'synthetic@example.invalid',
      displayName: '合成利用者',
    })
  }

  if (url.endsWith('/diagnosis') && method === 'GET') {
    if (savedDiagnosis === null) return jsonResponse({ status: 'incomplete', reason: 'missing' })

    return jsonResponse({
      status: 'complete',
      diagnosis: {
        answers: savedDiagnosis,
        diagnosisVersion: 'diagnosis-k/v1',
        completedAt: '2026-09-06T00:00:00.000Z',
        updatedAt: '2026-09-06T00:00:00.000Z',
      },
    })
  }

  if (url.endsWith('/diagnosis') && method === 'PUT') {
    if (failNextDiagnosisSave) {
      failNextDiagnosisSave = false
      return jsonResponse({ error: '合成した保存失敗です。回答を保持して再試行してください。' }, 503)
    }

    const request = JSON.parse(String(init?.body ?? '{}')) as { answers?: DiagnosisAnswers }
    savedDiagnosis = request.answers ?? null

    return jsonResponse({
      success: true,
      status: 'complete',
      diagnosis: {
        answers: savedDiagnosis,
        diagnosisVersion: 'diagnosis-k/v1',
        completedAt: '2026-09-06T00:00:00.000Z',
        updatedAt: '2026-09-06T00:00:00.000Z',
      },
    })
  }

  return jsonResponse({ error: `Unexpected synthetic request: ${method} ${url}` }, 404)
}

function Harness() {
  return (
    <>
      <aside className="kai29-harness-controls fixed bottom-3 right-3 z-50 flex flex-wrap gap-2 rounded-lg border bg-white/95 p-2 text-xs shadow-lg">
        <span className="self-center font-medium">KAI-29 合成データ確認</span>
        <button
          type="button"
          className="rounded border px-2 py-1 focus-visible:ring-2"
          onClick={() => { failNextDiagnosisSave = true }}
        >
          次の診断保存を失敗させる
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 focus-visible:ring-2"
          onClick={() => { savedDiagnosis = null }}
        >
          保存済み診断を消去
        </button>
      </aside>
      <App />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
