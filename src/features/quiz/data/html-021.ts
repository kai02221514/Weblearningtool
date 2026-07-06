import type { QuizDefinition } from '../types'

const SOURCE_DOCUMENT_PATH = 'docs/content/pilot-quiz-prototype.md'
const PASS_SCORE = 2
const MAX_SCORE = 3

const code = (...lines: string[]) => lines.join('\n')

export const html021Quiz = {
  quizId: 'quiz-html-021',
  nodeId: 'html-021',
  questionSetVersion: 'quiz-html-021/v0.2',
  passScore: PASS_SCORE,
  maxScore: MAX_SCORE,
  sourceDocumentPath: SOURCE_DOCUMENT_PATH,
  questions: [
    {
      questionId: 'html-021-q1',
      nodeId: 'html-021',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-021-q1',
      type: 'single-choice',
      difficulty: '基礎',
      prompt: code(
        '次のHTMLで、`<strong>`要素の親要素（その要素を直接包んでいる、1つ外側の要素）はどれですか。',
        '',
        '```html',
        '<html>',
        '  <body>',
        '    <p><strong>重要</strong>なお知らせです。</p>',
        '  </body>',
        '</html>',
        '```',
      ),
      choices: [
        { id: 'choice-1', label: '<p>', presentation: 'text' },
        { id: 'choice-2', label: '<body>', presentation: 'text' },
        { id: 'choice-3', label: '<strong>', presentation: 'text' },
        { id: 'choice-4', label: '<html>', presentation: 'text' },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: '<p>',
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ'],
      },
      explanation: '正解は`<p>`です。親要素とは、その要素を直接包んでいる1つ外側の要素のことです。`<strong>`を直接包んでいるのは`<p>`です。`<body>`と`<html>`も`<strong>`を包んでいますが、`<p>`よりさらに外側にあるため、`<strong>`から見ると親のさらに外側（祖先）であり、直接の親ではありません。`<strong>`自身は親にはなれません。復習する場合は教材「要素の中に要素を入れる（入れ子）」（pilot-material-draft.md §4.1）を読み直してください。',
      mainReviewNodeId: 'html-021',
      relatedPrerequisiteNodeIds: [],
    },
    {
      questionId: 'html-021-q2',
      nodeId: 'html-021',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-021-q2',
      type: 'single-choice',
      difficulty: '標準',
      prompt: '正しい入れ子構造になっているものはどれですか。',
      choices: [
        { id: 'choice-1', label: '<p><strong>こんにちは</strong></p>', presentation: 'code' },
        { id: 'choice-2', label: '<p><strong>こんにちは</p></strong>', presentation: 'code' },
        { id: 'choice-3', label: '<strong><p>こんにちは</strong></p>', presentation: 'code' },
        { id: 'choice-4', label: '<p><strong>こんにちは</p>', presentation: 'code' },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: '<p><strong>こんにちは</strong></p>',
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ'],
      },
      explanation: '正解は選択肢1です。入れ子にした要素は、内側（後から開始した）要素から先に閉じます。選択肢1は`<strong>`を閉じてから`<p>`を閉じており、正しい入れ子です。選択肢2と3は、外側の要素を先に閉じているため、タグの対応関係が交差しており誤りです。選択肢4は`<strong>`の終了タグがなく、要素が閉じられていません。復習する場合は教材「閉じる順序の規則」「交差した入れ子は誤り」（pilot-material-draft.md §4.2〜§4.3）を読み直してください。終了タグの書き方自体が不安な場合は、前の単元「要素とタグ」も見直してください。',
      mainReviewNodeId: 'html-021',
      relatedPrerequisiteNodeIds: ['html-020'],
    },
    {
      questionId: 'html-021-q3',
      nodeId: 'html-021',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-021-q3',
      type: 'code-completion',
      difficulty: '標準',
      prompt: code(
        '次のHTMLが正しい入れ子構造になるように、空欄に入る終了タグの要素名を答えてください（例: body）。',
        '',
        '```html',
        '<p><strong>重要</____>なお知らせです。</p>',
        '```',
      ),
      choices: [],
      correctAnswer: 'strong',
      acceptedAnswers: ['strong', '</strong>'],
      answerNormalization: {
        trimWhitespace: true,
        caseInsensitive: true,
        scope: 'html-element-or-explicit-tag-name',
        matchStrategy: 'exact-accepted-answer',
      },
      researchMetadata: {
        notes: [
          'D-020により、前後空白を除去し、HTML要素名または明示的に許容したタグ回答の要素名部分を大文字小文字を区別せず比較する。',
          '`</strong>`は明示的な許容解として採用し、`/strong`は山括弧が欠けた不完全な回答として不採用にする。',
          '正答の一意性: 空欄の位置で開いていて閉じられていない要素はstrongのみ（pは末尾で閉じられている）であり、正しい入れ子を成立させる回答はstrongに限られ、一意である。',
        ],
        acceptedAnswerDecision: {
          decisionId: 'D-020',
          decidedBy: '北代櫂',
          accepted: ['strong', '</strong>'],
          rejected: ['/strong', '<strong>', 'p', 'body'],
          rationale: [
            '終了タグ全体の回答は正答意図が明確な表記揺れとして許容する。',
            '`/strong`は要素名としても完全な終了タグとしても中途半端であり、推測的な記号補正を避けるため不正答とする。',
          ],
        },
        incorrectAnswerExamples: ['/strong', '<strong>', 'p', 'body'],
      },
      explanation: '正解は`strong`です。空欄の位置では、`<p>`と`<strong>`の2つが開いていますが、内側（後から開始した）の`<strong>`を先に閉じる必要があります。`p`と答えた場合、`<strong>`が閉じられないまま`<p>`を閉じることになり、タグが交差した誤った入れ子になります。`<p>`はコードの末尾の`</p>`で閉じられています。復習する場合は教材「閉じる順序の規則」「交差した入れ子は誤り」（pilot-material-draft.md §4.2〜§4.3）を読み直してください。',
      mainReviewNodeId: 'html-021',
      relatedPrerequisiteNodeIds: ['html-020'],
    },
  ],
} as const satisfies QuizDefinition
