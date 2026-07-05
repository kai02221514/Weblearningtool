import type { QuizDefinition } from '../types'

const SOURCE_DOCUMENT_PATH = 'docs/content/pilot-quiz-prototype.md'
const PASS_SCORE = 2
const MAX_SCORE = 3

const code = (...lines: string[]) => lines.join('\n')

export const html010Quiz = {
  quizId: 'quiz-html-010',
  nodeId: 'html-010',
  questionSetVersion: 'quiz-html-010/v0.1',
  passScore: PASS_SCORE,
  maxScore: MAX_SCORE,
  sourceDocumentPath: SOURCE_DOCUMENT_PATH,
  questions: [
    {
      questionId: 'html-010-q1',
      nodeId: 'html-010',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-010-q1',
      type: 'single-choice',
      difficulty: '基礎',
      prompt: 'ブラウザの画面に表示される内容（本文）を書く場所となる要素はどれですか。',
      choices: [
        { id: 'choice-1', label: '<body>', presentation: 'text' },
        { id: 'choice-2', label: '<head>', presentation: 'text' },
        { id: 'choice-3', label: '<html>', presentation: 'text' },
        { id: 'choice-4', label: '<title>', presentation: 'text' },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: '<body>',
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ（単一選択のため許容解なし）'],
      },
      explanation: '正解は`<body>`です。`<body>`〜`</body>`の中に書いた内容がブラウザの画面に表示されます。`<head>`はページに関する情報（タイトルなど）を書く場所で、本文としては表示されません。`<html>`は文書全体を包む要素で、直接内容を書く場所ではありません。`<title>`に書いた文字は本文ではなくブラウザのタブなどに表示されます。復習する場合は教材「head要素の役割」「body要素の役割」（pilot-material-draft.md §3.4〜§3.5）を読み直してください。',
      mainReviewNodeId: 'html-010',
      relatedPrerequisiteNodeIds: ['html-000'],
    },
    {
      questionId: 'html-010-q2',
      nodeId: 'html-010',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-010-q2',
      type: 'single-choice',
      difficulty: '標準',
      prompt: '最小のHTML文書として、宣言と要素の配置が正しいものはどれですか。',
      choices: [
        {
          id: 'choice-1',
          label: code(
            '<!DOCTYPE html>',
            '<html>',
            '  <head></head>',
            '  <body></body>',
            '</html>',
          ),
          presentation: 'code',
        },
        {
          id: 'choice-2',
          label: code(
            '<!DOCTYPE html>',
            '<html>',
            '  <body></body>',
            '  <head></head>',
            '</html>',
          ),
          presentation: 'code',
        },
        {
          id: 'choice-3',
          label: code(
            '<html>',
            '  <!DOCTYPE html>',
            '  <head></head>',
            '  <body></body>',
            '</html>',
          ),
          presentation: 'code',
        },
        {
          id: 'choice-4',
          label: code(
            '<!DOCTYPE html>',
            '<html>',
            '  <head></head>',
            '</html>',
            '<body></body>',
          ),
          presentation: 'code',
        },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: code(
        '<!DOCTYPE html>',
        '<html>',
        '  <head></head>',
        '  <body></body>',
        '</html>',
      ),
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ'],
      },
      explanation: '正解は選択肢1です。HTML文書は、先頭に`<!DOCTYPE html>`を書き、その下の`<html>`〜`</html>`が文書全体を包み、`<html>`の中に`<head>`、`<body>`の順で書きます。選択肢2は`<head>`と`<body>`の順序が逆です。選択肢3は`<!DOCTYPE html>`が`<html>`の中にありますが、DOCTYPEは要素ではなく宣言なので、文書のいちばん先頭（`<html>`の外側）に書きます。選択肢4は`<body>`が`<html>`の外にありますが、文書のすべての要素は`<html>`の中に入れます。復習する場合は教材「最小のHTML文書」「<!DOCTYPE html>の役割」（pilot-material-draft.md §3.1〜§3.3）を読み直してください。',
      mainReviewNodeId: 'html-010',
      relatedPrerequisiteNodeIds: [],
    },
    {
      questionId: 'html-010-q3',
      nodeId: 'html-010',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#html-010-q3',
      type: 'code-completion',
      difficulty: '基礎〜標準',
      prompt: code(
        '画面に表示する内容を書く要素になるように、空欄へ入る要素名を答えてください（例: head）。',
        '',
        '```html',
        '<!DOCTYPE html>',
        '<html>',
        '  <head>',
        '    <title>自己紹介</title>',
        '  </head>',
        '  <____>',
        '    <p>こんにちは</p>',
        '  </body>',
        '</html>',
        '```',
      ),
      choices: [],
      correctAnswer: 'body',
      acceptedAnswers: ['body'],
      researchMetadata: {
        notes: [
          '正規化（案・§12参照）: 前後空白除去、小文字化して比較（`BODY`、`Body`も正答扱い）。',
          '許容解に含めるか要確定: `<body>`（山括弧付き回答）。問題文の「要素名を答えてください（例: head）」で括弧なしを誘導するが、括弧付き回答を不正解にすると採点漏れの恐れがある。KAI-15で確定が必要。',
          '正答の一意性: 教材草案§3.1および§3.5の骨格において、画面に表示される内容を書く要素はbodyのみである。コード中の終了タグ`</body>`がヒントになるため難易度は下がるが、空欄は1か所で、短いコード補完として正答は一意である。',
        ],
        unresolvedAcceptedAnswerCandidates: ['<body>'],
        incorrectAnswerExamples: ['head', 'title', 'html', 'p'],
      },
      explanation: '正解は`body`です。`<body>`〜`</body>`の中に書いた内容が、ブラウザの画面に表示されます。このコードでは`<p>こんにちは</p>`を本文として表示したいので、空欄には開始タグの要素名`body`が入ります。`<head>`には`<title>`などのページに関する情報を書きますが、本文として表示したい内容を書く場所ではありません。復習する場合は教材「最小のHTML文書」「head要素の役割」「body要素の役割」（pilot-material-draft.md §3.1、§3.4〜§3.5）を読み直してください。',
      mainReviewNodeId: 'html-010',
      relatedPrerequisiteNodeIds: ['html-000'],
    },
  ],
} as const satisfies QuizDefinition
