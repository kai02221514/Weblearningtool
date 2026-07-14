import { describe, expect, it } from 'vitest'

import { evaluatePracticeCode } from './evaluatePractice'
import { canCompletePractice } from './practiceCompletionGate'

const acceptedCss = `<!DOCTYPE html>
<html>
  <head>
    <title>色と文字サイズ</title>
    <style>
      p {
        color: blue;
        font-size: 20px;
      }
    </style>
  </head>
  <body><p>CSSの基本構文を練習します。</p></body>
</html>`

describe('practice completion gate', () => {
  it('requires explicit confirmation for every display-only condition', () => {
    const evaluation = evaluatePracticeCode('css-011', acceptedCss)

    expect(evaluation.automaticChecksPassed).toBe(true)
    expect(canCompletePractice(evaluation, [])).toBe(false)
    expect(canCompletePractice(evaluation, ['preview-style'])).toBe(true)
  })

  it('does not allow display confirmation to bypass a failed automatic check', () => {
    const evaluation = evaluatePracticeCode('css-011', '<style>p { color: blue; }</style>')

    expect(canCompletePractice(evaluation, ['preview-style'])).toBe(false)
  })

  it('keeps a later CSS override behind the display-only confirmation gate', () => {
    const evaluation = evaluatePracticeCode('css-011', acceptedCss.replace(
      '</style>',
      'p { color: red; }\n    </style>',
    ))

    expect(evaluation.automaticChecksPassed).toBe(true)
    expect(canCompletePractice(evaluation, [])).toBe(false)
  })
})
