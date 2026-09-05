// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiagnosisAnswers, StoredDiagnosis } from '../supabase/functions/_shared/diagnosis'
import App from './App'
import { getDiagnosis, saveDiagnosis, signin } from './utils/auth'

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
  }
})

const mockedGetDiagnosis = vi.mocked(getDiagnosis)
const mockedSaveDiagnosis = vi.mocked(saveDiagnosis)
const mockedSignin = vi.mocked(signin)

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
  await user.click(screen.getByRole('button', { name: 'ログイン' }))
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
  await selectSurveyAnswer(user, '現在の立場', '大学生・高専生')
  await selectSurveyAnswer(user, '学習の目的', '趣味・個人制作')
  await selectSurveyAnswer(user, '学習に使える時間', '毎日30分未満')
  await selectSurveyAnswer(user, 'プログラミングを行ったことはありますか？', 'いいえ')
  await selectSurveyAnswer(user, 'HTML/CSSのルール理解', 'ほとんど分からない')
  await selectSurveyAnswer(user, 'HTML/CSSの概念理解', 'よく分からない')
}

function expectDashboardAbsent() {
  expect(screen.queryByText('現在のおすすめルート')).toBeNull()
}

function expectSurveyAnswersRetained() {
  const expectedAnswers = [
    ['現在の立場', 'student'],
    ['学習の目的', 'hobby'],
    ['学習に使える時間', 'less_30'],
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

describe('authenticated diagnosis flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedSignin.mockResolvedValue({
      success: true,
      accessToken: 'synthetic-access-token',
      userId: '11111111-1111-4111-8111-111111111111',
      email: 'synthetic@example.invalid',
      name: '合成利用者',
    })
  })

  afterEach(() => cleanup())

  it('keeps Dashboard hidden while loading and sends a missing diagnosis to Survey', async () => {
    const diagnosis = deferred<Awaited<ReturnType<typeof getDiagnosis>>>()
    mockedGetDiagnosis.mockReturnValue(diagnosis.promise)

    await signIn()

    expect(await screen.findByText('診断状態を確認しています...')).not.toBeNull()
    expectDashboardAbsent()

    diagnosis.resolve({ status: 'incomplete', reason: 'missing' })

    expect(await screen.findByText('ようこそ、合成利用者さん！')).not.toBeNull()
    expectDashboardAbsent()
  })

  it('sends an incompatible diagnosis to Survey without showing Dashboard', async () => {
    mockedGetDiagnosis.mockResolvedValue({ status: 'incomplete', reason: 'incompatible' })

    await signIn()

    expect(await screen.findByText('ようこそ、合成利用者さん！')).not.toBeNull()
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
    expectExperiencedRoute()
    expect(mockedGetDiagnosis).toHaveBeenCalledTimes(2)
    expect(mockedGetDiagnosis).toHaveBeenNthCalledWith(2, 'synthetic-access-token')
  })

  it('restores compatible saved answers into the existing route and Dashboard', async () => {
    mockedGetDiagnosis.mockResolvedValue({
      status: 'complete',
      diagnosis: storedDiagnosis(experiencedAnswers),
    })

    await signIn()

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
    expectExperiencedRoute()
  })

  it('retains answers after save failure and enters Dashboard only with saved response answers', async () => {
    mockedGetDiagnosis.mockResolvedValue({ status: 'incomplete', reason: 'missing' })
    mockedSaveDiagnosis
      .mockRejectedValueOnce(new Error('診断の保存に失敗しました'))
      .mockResolvedValueOnce(storedDiagnosis(experiencedAnswers))

    const user = await signIn()
    await screen.findByText('ようこそ、合成利用者さん！')
    await answerVisibleSurvey(user)
    await user.click(screen.getByRole('button', { name: '学習を始める' }))

    expect(await screen.findByText('診断の保存に失敗しました')).not.toBeNull()
    expectDashboardAbsent()
    expectSurveyAnswersRetained()

    await user.click(screen.getByRole('button', { name: '学習を始める' }))

    expect(await screen.findByText('現在のおすすめルート')).not.toBeNull()
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
})
