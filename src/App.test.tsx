// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiagnosisAnswers, StoredDiagnosis } from '../supabase/functions/_shared/diagnosis'
import App from './App'
import { getDiagnosis, saveDiagnosis, signin, signup } from './utils/auth'

vi.mock('./components/ui/select', async () => {
  const React = await import('react')

  function SelectTrigger() {
    return null
  }

  function SelectContent() {
    return null
  }

  function SelectItem() {
    return null
  }

  function SelectValue() {
    return null
  }

  function Select({ children, value, onValueChange }: any) {
    const directChildren = React.Children.toArray(children)
    const trigger = directChildren.find(
      child => React.isValidElement(child) && child.type === SelectTrigger,
    ) as React.ReactElement<any> | undefined
    const content = directChildren.find(
      child => React.isValidElement(child) && child.type === SelectContent,
    ) as React.ReactElement<any> | undefined
    const items = React.Children.toArray(content?.props.children).filter(
      item => React.isValidElement(item) && item.type === SelectItem,
    ) as React.ReactElement<any>[]

    return (
      <select
        id={trigger?.props.id}
        value={value}
        onChange={event => onValueChange(event.target.value)}
      >
        <option value="">選択してください</option>
        {items.map(item => (
          <option key={item.props.value} value={item.props.value}>
            {item.props.children}
          </option>
        ))}
      </select>
    )
  }

  return { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
})

vi.mock('./utils/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('./utils/auth')>()
  return {
    ...actual,
    getDiagnosis: vi.fn(),
    saveDiagnosis: vi.fn(),
    signin: vi.fn(),
    signup: vi.fn(),
  }
})

const mockedGetDiagnosis = vi.mocked(getDiagnosis)
const mockedSaveDiagnosis = vi.mocked(saveDiagnosis)
const mockedSignin = vi.mocked(signin)
const mockedSignup = vi.mocked(signup)

const beginnerAnswers: DiagnosisAnswers = {
  programming_experience: 'no',
  rule_confidence: 'none',
  knowledge_concept: 'unknown',
}

const experiencedAnswers: DiagnosisAnswers = {
  programming_experience: 'yes',
  rule_confidence: 'confident',
  knowledge_concept: 'structure_style',
}

function storedDiagnosis(answers: DiagnosisAnswers): StoredDiagnosis {
  return {
    answers,
    diagnosisVersion: 'diagnosis-k/v1',
    completedAt: '2026-09-06T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z',
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function signIn() {
  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByLabelText('メールアドレス'), 'synthetic@example.invalid')
  await user.type(screen.getByLabelText('パスワード'), 'synthetic-password')
  await user.click(screen.getByRole('button', { name: 'ログインする' }))
  return user
}

async function selectSurveyAnswer(
  user: ReturnType<typeof userEvent.setup>,
  question: string,
  answer: string,
) {
  const trigger = screen.getByRole('combobox', { name: question })
  await user.selectOptions(trigger, within(trigger).getByRole('option', { name: answer }))
  expect((trigger as HTMLSelectElement).selectedOptions[0]?.textContent).toBe(answer)
}

async function answerVisibleSurvey(user: ReturnType<typeof userEvent.setup>) {
  await selectSurveyAnswer(user, 'プログラミングを行ったことはありますか？', 'いいえ')
  await selectSurveyAnswer(user, 'HTML/CSSのルール理解', 'ほとんど分からない')
  await selectSurveyAnswer(user, 'HTML/CSSの概念理解', 'よく分からない')
}

function expectDashboardAbsent() {
  expect(screen.queryByText('現在のおすすめルート')).toBeNull()
}

function expectSurveyAnswersRetained() {
  const expectedAnswers = [
    ['プログラミングを行ったことはありますか？', 'no'],
    ['HTML/CSSのルール理解', 'none'],
    ['HTML/CSSの概念理解', 'unknown'],
  ] as const

  for (const [question, value] of expectedAnswers) {
    expect((screen.getByRole('combobox', { name: question }) as HTMLSelectElement).value)
      .toBe(value)
  }
}

function expectExperiencedRoute() {
  const recommendation = screen.getByTestId('route-recommendation-html-010')
  expect(within(recommendation).getByText('HTML基本骨格(doctype / html / head / body)')).not.toBeNull()
  expect(recommendation.textContent).toContain('DG-RULE-3')
}

async function completeHtml010CycleToConfirmation(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole('button', { name: 'この単元を始める' }))

  expect(screen.getByRole('navigation', { name: '単元の学習段階' }).textContent)
    .toContain('教材')
  await user.click(screen.getByRole('button', { name: '教材を開始する' }))
  await user.click(screen.getByRole('tab', { name: 'テキスト形式' }))
  await user.click(screen.getByRole('button', { name: '教材を完了して確認テストへ' }))

  await user.click(screen.getByLabelText(/<body>/))
  await user.click(screen.getByRole('button', { name: '次の問題' }))
  await user.click(screen.getByRole('radio', {
    name: /^1\. <!DOCTYPE html>/,
  }))
  await user.click(screen.getByRole('button', { name: '次の問題' }))
  await user.type(screen.getByPlaceholderText('回答を入力'), 'body')
  await user.click(screen.getByRole('button', { name: '結果を見る' }))

  expect(await screen.findByText('合格おめでとうございます！')).not.toBeNull()
  await user.click(screen.getByRole('button', { name: '合格済み：実践課題へ進む' }))

  const practiceCode = `<!DOCTYPE html>\n<html>\n  <head><title>自己紹介</title></head>\n  <body><p>こんにちは</p></body>\n</html>`
  fireEvent.change(screen.getByPlaceholderText('HTMLコードをここに入力...'), {
    target: { value: practiceCode },
  })
  await user.click(screen.getByRole('button', { name: '条件を確認' }))
  await user.click(screen.getByRole('checkbox', { name: /プレビューを目視確認/ }))
  await user.click(screen.getByRole('button', { name: '実践課題を完了して振り返りへ' }))

  expect(screen.getByRole('navigation', { name: '単元の学習段階' }).textContent)
    .toContain('振り返り')
  await user.click(screen.getByRole('checkbox', { name: 'HTMLドキュメントの基本構造' }))
  await user.type(screen.getByPlaceholderText(/HTMLタグの使い分けがまだ曖昧/), '合成した振り返り')
  await user.click(screen.getByRole('button', { name: '振り返りを確定して単元を完了する' }))
}

describe('authenticated diagnosis flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedSignin.mockResolvedValue({
      success: true,
      accessToken: 'synthetic-access-token',
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'synthetic@example.invalid',
      displayName: '合成利用者',
    })
  })

  afterEach(() => cleanup())

  it('keeps the email after account creation and clearly returns to login', async () => {
    const creation = deferred<Awaited<ReturnType<typeof signup>>>()
    mockedSignup.mockReturnValue(creation.promise)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '新規アカウントを作成する' }))
    await user.type(screen.getByLabelText('表示名（ニックネーム可）'), '  合成利用者  ')
    await user.type(screen.getByLabelText('メールアドレス'), 'synthetic@example.invalid')
    await user.type(screen.getByLabelText('パスワード'), 'synthetic-password')
    await user.click(screen.getByRole('button', { name: 'アカウントを作成する' }))

    expect((screen.getByRole('button', {
      name: 'アカウントを作成しています...',
    }) as HTMLButtonElement).disabled).toBe(true)
    creation.resolve({
      success: true,
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'synthetic@example.invalid',
      displayName: '合成利用者',
    })

    expect(await screen.findByRole('heading', { name: 'ログイン' })).not.toBeNull()
    expect(screen.getByText('アカウントを作成しました。ログインしてください。')).not.toBeNull()
    expect((screen.getByLabelText('メールアドレス') as HTMLInputElement).value)
      .toBe('synthetic@example.invalid')
    expect((screen.getByLabelText('パスワード') as HTMLInputElement).value).toBe('')
    expect(mockedSignup).toHaveBeenCalledWith({
      email: 'synthetic@example.invalid',
      password: 'synthetic-password',
      displayName: '合成利用者',
    })
  })

  it('rejects a whitespace-only display name before signup', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '新規アカウントを作成する' }))
    await user.type(screen.getByLabelText('表示名（ニックネーム可）'), '   ')
    await user.type(screen.getByLabelText('メールアドレス'), 'synthetic@example.invalid')
    await user.type(screen.getByLabelText('パスワード'), 'synthetic-password')
    await user.click(screen.getByRole('button', { name: 'アカウントを作成する' }))

    expect((await screen.findByRole('alert')).textContent)
      .toContain('表示名は改行・制御文字を含まない1〜50文字')
    expect(mockedSignup).not.toHaveBeenCalled()
  })

  it('keeps Dashboard hidden while loading and sends a missing diagnosis to Survey', async () => {
    const diagnosis = deferred<Awaited<ReturnType<typeof getDiagnosis>>>()
    mockedGetDiagnosis.mockReturnValue(diagnosis.promise)

    await signIn()

    expect(await screen.findByText('保存済み診断を確認しています...')).not.toBeNull()
    expectDashboardAbsent()

    diagnosis.resolve({ status: 'incomplete', reason: 'missing' })

    expect(await screen.findByRole('heading', { name: '初回診断（必須）' })).not.toBeNull()
    expectDashboardAbsent()
  })

  it('sends an incompatible diagnosis to Survey without showing Dashboard', async () => {
    mockedGetDiagnosis.mockResolvedValue({ status: 'incomplete', reason: 'incompatible' })

    await signIn()

    expect(await screen.findByRole('heading', { name: '初回診断（必須）' })).not.toBeNull()
    expectDashboardAbsent()
  })

  it('shows a retryable retrieval error and restores a compatible diagnosis on retry', async () => {
    mockedGetDiagnosis
      .mockRejectedValueOnce(new Error('診断状態を取得できませんでした'))
      .mockResolvedValueOnce({ status: 'complete', diagnosis: storedDiagnosis(experiencedAnswers) })

    const user = await signIn()

    expect(await screen.findByText('診断状態を取得できませんでした')).not.toBeNull()
    expectDashboardAbsent()

    await user.click(screen.getByRole('button', { name: 'もう一度確認する' }))

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
    expect(screen.getByTestId('dashboard-notice').textContent)
      .toContain('保存済み診断を読み込み、その回答から推薦ルートを再生成しました')
    expectExperiencedRoute()
    expect(mockedGetDiagnosis).toHaveBeenCalledTimes(2)
    expect(mockedGetDiagnosis).toHaveBeenNthCalledWith(2, 'synthetic-access-token')
  })

  it('clears populated learning state on return and restores only diagnosis after login', async () => {
    mockedGetDiagnosis.mockResolvedValue({
      status: 'complete',
      diagnosis: storedDiagnosis(experiencedAnswers),
    })

    const user = await signIn()

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
    expectExperiencedRoute()

    await completeHtml010CycleToConfirmation(user)
    expect(await screen.findByRole('heading', { name: /HTML基本骨格.*を完了しました/ })).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Dashboardで更新後の推薦を見る' }))

    const populatedProgress = screen.getByTestId('dashboard-session-progress')
    expect(populatedProgress.getAttribute('data-completed-count')).toBe('1')
    expect(populatedProgress.getAttribute('data-quiz-count')).toBe('1')
    expect(populatedProgress.getAttribute('data-reflection-count')).toBe('1')
    expect(populatedProgress.getAttribute('data-in-progress-node-id')).toBe('')
    expect(screen.getByTestId('dashboard-notice').textContent)
      .toContain('このセッションで単元を完了し、現在の進捗から推薦ルートを更新しました')
    expect(screen.queryByTestId('route-recommendation-html-010')).toBeNull()

    const nextRecommendation = screen.getByTestId('route-recommendation-html-020')
    await user.click(within(nextRecommendation).getByRole('button', { name: 'この単元を始める' }))
    await user.click(screen.getByRole('button', { name: 'ダッシュボード' }))
    expect(screen.getByTestId('dashboard-session-progress').getAttribute('data-in-progress-node-id'))
      .toBe('html-020')

    await user.click(screen.getByRole('button', { name: 'ログイン画面へ戻る' }))
    expect(await screen.findByRole('heading', { name: 'ログイン' })).not.toBeNull()
    await user.type(screen.getByLabelText('メールアドレス'), 'synthetic@example.invalid')
    await user.type(screen.getByLabelText('パスワード'), 'synthetic-password')
    await user.click(screen.getByRole('button', { name: 'ログインする' }))

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
    expect(screen.queryByRole('heading', { name: '初回診断（必須）' })).toBeNull()
    expectExperiencedRoute()

    const restoredProgress = screen.getByTestId('dashboard-session-progress')
    expect(restoredProgress.getAttribute('data-completed-count')).toBe('0')
    expect(restoredProgress.getAttribute('data-quiz-count')).toBe('0')
    expect(restoredProgress.getAttribute('data-reflection-count')).toBe('0')
    expect(restoredProgress.getAttribute('data-in-progress-node-id')).toBe('')
    expect(screen.getByTestId('dashboard-notice').textContent)
      .toContain('保存済み診断を読み込み、その回答から推薦ルートを再生成しました')
    expect(screen.getByTestId('dashboard-notice').textContent).not.toContain('単元を完了')
    expect(mockedGetDiagnosis).toHaveBeenCalledTimes(2)

    const restoredRecommendation = screen.getByTestId('route-recommendation-html-010')
    await user.click(within(restoredRecommendation).getByRole('button', {
      name: 'この単元を始める',
    }))
    await user.click(screen.getByRole('button', { name: '教材を開始する' }))
    await user.click(screen.getByRole('tab', { name: 'テキスト形式' }))
    await user.click(screen.getByRole('button', { name: '教材を完了して確認テストへ' }))

    expect(screen.queryByText('合格おめでとうございます！')).toBeNull()
    expect(screen.queryByRole('button', { name: '合格済み：実践課題へ進む' })).toBeNull()
    expect(screen.getByRole('heading', { name: '問題 1' })).not.toBeNull()
    expect(screen.getByText('問題 1 / 3')).not.toBeNull()
    expect(screen.getByText('試行 1 / 進捗: 33%')).not.toBeNull()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    expect(screen.getAllByRole('radio').every(radio => !(radio as HTMLInputElement).checked))
      .toBe(true)

    await user.click(screen.getByLabelText(/<body>/))
    await user.click(screen.getByRole('button', { name: '次の問題' }))
    await user.click(screen.getByRole('radio', { name: /^1\. <!DOCTYPE html>/ }))
    await user.click(screen.getByRole('button', { name: '次の問題' }))
    await user.type(screen.getByPlaceholderText('回答を入力'), 'body')
    await user.click(screen.getByRole('button', { name: '結果を見る' }))

    expect(await screen.findByText('合格おめでとうございます！')).not.toBeNull()
    expect(screen.getByText('quiz-html-010 / quiz-html-010/v0.2 / 試行1')).not.toBeNull()
  })

  it('retains answers after save failure and enters Dashboard only with saved response answers', async () => {
    mockedGetDiagnosis.mockResolvedValue({ status: 'incomplete', reason: 'missing' })
    mockedSaveDiagnosis
      .mockRejectedValueOnce(new Error('診断の保存に失敗しました'))
      .mockResolvedValueOnce(storedDiagnosis(experiencedAnswers))

    const user = await signIn()
    await screen.findByRole('heading', { name: '初回診断（必須）' })
    await answerVisibleSurvey(user)
    await user.click(screen.getByRole('button', { name: '診断を保存して推薦を見る' }))

    expect(await screen.findByText('診断の保存に失敗しました')).not.toBeNull()
    expectDashboardAbsent()
    expectSurveyAnswersRetained()

    await user.click(screen.getByRole('button', { name: '診断を保存して推薦を見る' }))

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
    expect(screen.getByTestId('dashboard-notice').textContent)
      .toContain('診断を保存し、回答から推薦ルートを作成しました')
    expectExperiencedRoute()
    expect(mockedSaveDiagnosis).toHaveBeenCalledTimes(2)
    expect(mockedSaveDiagnosis).toHaveBeenNthCalledWith(
      1,
      beginnerAnswers,
      'synthetic-access-token',
    )
    expect(mockedSaveDiagnosis).toHaveBeenNthCalledWith(
      2,
      beginnerAnswers,
      'synthetic-access-token',
    )
  })

  it('completes the html-010 four-stage learning cycle and confirms the unit before Dashboard', async () => {
    mockedGetDiagnosis.mockResolvedValue({
      status: 'complete',
      diagnosis: storedDiagnosis(experiencedAnswers),
    })

    const user = await signIn()
    await screen.findByText('現在のおすすめルート')
    await completeHtml010CycleToConfirmation(user)
    expect(await screen.findByRole('heading', { name: /HTML基本骨格.*を完了しました/ })).not.toBeNull()
    expect(screen.getByText(/再ログイン後には復元されません/)).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Dashboardで更新後の推薦を見る' }))

    expect(await screen.findByTestId('dashboard-notice')).not.toBeNull()
    expect(screen.getByTestId('dashboard-notice').textContent)
      .toContain('このセッションで単元を完了し、現在の進捗から推薦ルートを更新しました')
  })
})
