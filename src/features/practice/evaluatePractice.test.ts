import { describe, expect, it } from 'vitest'

import { evaluatePracticeCode } from './evaluatePractice'
import { pilotPracticeChallenges } from './pilotPracticeChallenges'

describe('evaluatePracticeCode', () => {
  it('accepts an html-010 solution within the reviewed material range', () => {
    const result = evaluatePracticeCode('html-010', `<!DOCTYPE html>
<html>
  <head><title>自己紹介</title></head>
  <body><p>こんにちは</p></body>
</html>`)

    expect(result.automaticChecksPassed).toBe(true)
    expect(result.conditionResults.find(condition => condition.mode === 'display-only')?.passed).toBeNull()
  })

  it('rejects html-010 when head and body are reversed', () => {
    const result = evaluatePracticeCode('html-010', `<!DOCTYPE html>
<html><body><p>こんにちは</p></body><head><title>自己紹介</title></head></html>`)

    expect(result.automaticChecksPassed).toBe(false)
    expect(result.conditionResults.find(condition => condition.id === 'head-before-body')?.passed).toBe(false)
  })

  it('accepts the reviewed html-021 nesting and rejects crossed tags', () => {
    const accepted = evaluatePracticeCode(
      'html-021',
      '<p><strong>重要</strong>なお知らせです。</p>',
    )
    const rejected = evaluatePracticeCode(
      'html-021',
      '<p><strong>重要</p></strong>',
    )

    expect(accepted.automaticChecksPassed).toBe(true)
    expect(rejected.automaticChecksPassed).toBe(false)
  })

  it('accepts css-011 declarations in either order with whitespace differences', () => {
    const result = evaluatePracticeCode('css-011', `p {
      font-size: 20px;
      color: blue;
    }`)

    expect(result.automaticChecksPassed).toBe(true)
  })

  it('rejects the css-011 initial code until its delimiters are fixed', () => {
    const result = evaluatePracticeCode(
      'css-011',
      pilotPracticeChallenges['css-011'].initialCode,
    )

    expect(result.automaticChecksPassed).toBe(false)
    expect(result.conditionResults.find(condition => condition.id === 'blue-color')?.passed).toBe(false)
    expect(result.conditionResults.find(condition => condition.id === 'font-size')?.passed).toBe(false)
  })
})
