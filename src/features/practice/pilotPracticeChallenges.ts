import type { PracticeChallengeDefinition, PilotPracticeNodeId } from './types'

const html010InitialCode = `<!DOCTYPE html>
<html>
  <head>
    <!-- title要素を追加してください -->
  </head>
  <body>
    <!-- p要素で自己紹介を書いてください -->
  </body>
</html>`

const html021InitialCode = `<!DOCTYPE html>
<html>
  <head>
    <title>お知らせ</title>
  </head>
  <body>
    <p><strong>重要</p></strong>
  </body>
</html>`

const css011InitialCode = `<!DOCTYPE html>
<html>
  <head>
    <title>色と文字サイズ</title>
    <style>
      p {
        color = blue
        font-size: 20px
      }
    </style>
  </head>
  <body>
    <p>CSSの基本構文を練習します。</p>
  </body>
</html>`

export const pilotPracticeChallenges = {
  'html-010': {
    practiceId: 'practice-profile-card',
    nodeId: 'html-010',
    title: '自己紹介ページの基本骨格を完成しよう',
    description: '用意された骨格へtitle要素と、body内のp要素による短い自己紹介を追加してください。',
    learningObjective: '<!DOCTYPE html>、html、head、bodyの役割と配置を使い、最小構成のHTML文書を完成できる。',
    initialCode: html010InitialCode,
    requirements: [
      '<!DOCTYPE html>を文書の先頭に置く',
      'html要素の中でheadをbodyより先に置く',
      'head要素の中にtitle要素を書く',
      'body要素の中にp要素で短い自己紹介を書く',
    ],
    completionConditions: [
      { id: 'doctype-first', label: '<!DOCTYPE html>が文書の先頭にある', mode: 'limited-automatic' },
      { id: 'head-before-body', label: 'html要素内でheadがbodyより先にある', mode: 'limited-automatic' },
      { id: 'title-in-head', label: 'head要素内に空でないtitle要素がある', mode: 'limited-automatic' },
      { id: 'paragraph-in-body', label: 'body要素内に空でないp要素がある', mode: 'limited-automatic' },
      { id: 'preview-content', label: 'プレビューで自己紹介文が本文として表示される', mode: 'display-only' },
    ],
    acceptedSolutionConditions: [
      '教材草案§3.1の順序と包含関係を満たす',
      'titleと自己紹介文の文字列は学習者が自由に決めてよい',
      'meta、charset、viewport、scriptは要求しない',
    ],
    expectedErrors: [
      {
        label: 'DOCTYPE、head、bodyの配置を誤る',
        mappingStatus: 'unsupported',
        srk: 'rule',
        reviewNodeIds: ['html-010'],
        detection: 'limited-automatic',
        note: '対応する既存MVPエラーIDはないため、新規IDを追加せず課題条件としてだけ通知する。',
      },
      {
        label: 'HTML要素の終了タグを書き忘れる',
        mappingStatus: 'mvp',
        errorId: 'E_HTML_MISSING_CLOSING_TAG',
        srk: 'skill',
        reviewNodeIds: ['html-020', 'html-021'],
        detection: 'limited-automatic',
        note: '既存の簡易検出範囲だけを使用する。',
      },
    ],
    hints: [
      'headにはページに関する情報、bodyには画面に表示する内容を書きます。',
      'title要素はhead要素の中に置きます。',
      '表示したい自己紹介文はp要素にしてbody要素の中へ置きます。',
    ],
    sourceReferences: {
      materialSections: ['§3.1', '§3.2', '§3.3', '§3.4', '§3.5'],
      quizQuestionIds: ['html-010-q1', 'html-010-q2', 'html-010-q3'],
    },
  },
  'html-021': {
    practiceId: 'practice-profile-card',
    nodeId: 'html-021',
    title: 'お知らせ文の入れ子を直そう',
    description: '交差しているp要素とstrong要素を、内側から閉じる正しい入れ子へ直してください。',
    learningObjective: '親子関係と閉じる順序を意識し、p要素の中へstrong要素を正しく入れ子にできる。',
    initialCode: html021InitialCode,
    requirements: [
      'p要素を親、strong要素を子にする',
      'strong要素をp要素より先に閉じる',
      '「重要」をstrong要素の内容として残す',
      'p要素とstrong要素の終了タグを両方書く',
    ],
    completionConditions: [
      { id: 'nested-strong', label: 'p要素の内側にstrong要素がある', mode: 'limited-automatic' },
      { id: 'closing-order', label: 'strongを閉じてからpを閉じる', mode: 'limited-automatic' },
      { id: 'important-text', label: 'strong要素の内容に「重要」がある', mode: 'limited-automatic' },
      { id: 'preview-nesting', label: 'プレビューで「重要」が強調され、お知らせ文が段落として表示される', mode: 'display-only' },
    ],
    acceptedSolutionConditions: [
      'p要素がstrong要素を直接包み、終了タグが交差しない',
      'インデントや改行の違いは許容する',
      '高精度HTML妥当性検証は行わず、対象構造だけを限定判定する',
    ],
    expectedErrors: [
      {
        label: 'pとstrongの終了タグが交差する',
        mappingStatus: 'mvp',
        errorId: 'E_HTML_INVALID_NESTING',
        srk: 'rule',
        reviewNodeIds: ['html-021', 'html-040'],
        detection: 'limited-automatic',
        note: '対象のp/strong構造だけを限定判定する。',
      },
      {
        label: 'strongまたはpの終了タグを書き忘れる',
        mappingStatus: 'mvp',
        errorId: 'E_HTML_MISSING_CLOSING_TAG',
        srk: 'skill',
        reviewNodeIds: ['html-020', 'html-021'],
        detection: 'limited-automatic',
        note: '既存の簡易検出範囲だけを使用する。',
      },
    ],
    hints: [
      '後から開始したstrong要素を先に閉じます。',
      '教材の正しい例は <p><strong>重要</strong>なお知らせです。</p> です。',
      'ブラウザで表示できても、タグが交差していれば正しい入れ子ではありません。',
    ],
    sourceReferences: {
      materialSections: ['§4.1', '§4.2', '§4.3', '§4.4'],
      quizQuestionIds: ['html-021-q1', 'html-021-q2', 'html-021-q3'],
    },
  },
  'css-011': {
    practiceId: 'practice-profile-card',
    nodeId: 'css-011',
    title: '段落の色と文字サイズを指定しよう',
    description: 'p要素の文字色を青、文字サイズを20pxにするよう、CSSの記号と宣言を直してください。',
    learningObjective: 'セレクタ、プロパティ、値、波括弧、コロン、セミコロンを使い、基本的なCSSルールセットを書ける。',
    initialCode: css011InitialCode,
    requirements: [
      'セレクタにpを使う',
      'colorプロパティの値をblueにする',
      'font-sizeプロパティの値を20pxにする',
      '各宣言をコロンとセミコロンで記述する',
    ],
    completionConditions: [
      { id: 'p-rule', label: 'pセレクタの波括弧内に宣言がある', mode: 'limited-automatic' },
      { id: 'blue-color', label: 'color: blue; がある', mode: 'limited-automatic' },
      { id: 'font-size', label: 'font-size: 20px; がある', mode: 'limited-automatic' },
      { id: 'preview-style', label: 'プレビューで段落が青色・20pxで表示される', mode: 'display-only' },
    ],
    acceptedSolutionConditions: [
      'pルール内にcolor: blue;とfont-size: 20px;がある',
      '2つの宣言の順序と空白・改行の違いは許容する',
      '教材外の色表現や追加プロパティは完了条件に含めない',
    ],
    expectedErrors: [
      {
        label: 'コロン、セミコロン、波括弧を誤る',
        mappingStatus: 'mvp',
        errorId: 'E_CSS_SYNTAX_MISSING_SEMICOLON',
        srk: 'skill',
        reviewNodeIds: ['css-011'],
        detection: 'limited-automatic',
        note: '対象2宣言の記号だけを限定判定する。',
      },
      {
        label: '教材にないプロパティ名を書く',
        mappingStatus: 'out-of-mvp',
        errorId: 'E_CSS_PROPERTY_UNKNOWN',
        srk: 'skill',
        reviewNodeIds: [],
        detection: 'unsupported',
        note: 'KAI-14の境界に従い初回MVPの復習推薦対象外とし、自動検出しない。',
      },
    ],
    hints: [
      'CSSは「セレクタ { プロパティ: 値; }」の形で書きます。',
      'プロパティと値の区切りは等号ではなくコロンです。',
      'この教材で扱う文字色はcolor、文字サイズはfont-sizeです。',
    ],
    sourceReferences: {
      materialSections: ['§5.1', '§5.2', '§5.3', '§5.4', '§5.5'],
      quizQuestionIds: ['css-011-q1', 'css-011-q2', 'css-011-q3'],
    },
  },
} as const satisfies Record<PilotPracticeNodeId, PracticeChallengeDefinition>

export function getPilotPracticeChallenge(
  nodeId: string,
): PracticeChallengeDefinition | undefined {
  switch (nodeId) {
    case 'html-010':
    case 'html-021':
    case 'css-011':
      return pilotPracticeChallenges[nodeId]
    default:
      return undefined
  }
}
