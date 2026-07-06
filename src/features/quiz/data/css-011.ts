import type { QuizDefinition } from '../types'

const SOURCE_DOCUMENT_PATH = 'docs/content/pilot-quiz-prototype.md'
const PASS_SCORE = 2
const MAX_SCORE = 3

const code = (...lines: string[]) => lines.join('\n')

export const css011Quiz = {
  quizId: 'quiz-css-011',
  nodeId: 'css-011',
  questionSetVersion: 'quiz-css-011/v0.2',
  passScore: PASS_SCORE,
  maxScore: MAX_SCORE,
  sourceDocumentPath: SOURCE_DOCUMENT_PATH,
  questions: [
    {
      questionId: 'css-011-q1',
      nodeId: 'css-011',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#css-011-q1',
      type: 'single-choice',
      difficulty: '基礎',
      prompt: code(
        '次のCSSで、「どのHTML要素に適用するか」を指定している部分はどれですか。',
        '',
        '```css',
        'p {',
        '  color: red;',
        '}',
        '```',
      ),
      choices: [
        { id: 'choice-1', label: 'p', presentation: 'code' },
        { id: 'choice-2', label: 'color', presentation: 'code' },
        { id: 'choice-3', label: 'red', presentation: 'code' },
        { id: 'choice-4', label: '{ }', presentation: 'code' },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: 'p',
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ'],
      },
      explanation: '正解は`p`です。この部分をセレクタと呼び、どのHTML要素にスタイルを適用するかを指定します（この例ではp要素、つまり段落）。`color`はプロパティで「何を変えるか」（文字の色）、`red`は値で「どう変えるか」（赤に）を指定します。`{ }`（波括弧）は、そのセレクタに適用する宣言のまとまりを囲む記号です。復習する場合は教材「CSSルールセットの基本形」（pilot-material-draft.md §5.1）の表を読み直してください。',
      mainReviewNodeId: 'css-011',
      relatedPrerequisiteNodeIds: [],
    },
    {
      questionId: 'css-011-q2',
      nodeId: 'css-011',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#css-011-q2',
      type: 'single-choice',
      difficulty: '標準',
      prompt: '段落（p要素）の文字色を赤にするCSSとして、書き方が正しいものはどれですか。',
      choices: [
        { id: 'choice-1', label: 'p { color: red; }', presentation: 'code' },
        { id: 'choice-2', label: 'p { color = red; }', presentation: 'code' },
        { id: 'choice-3', label: 'p ( color: red; )', presentation: 'code' },
        { id: 'choice-4', label: '{ p color: red; }', presentation: 'code' },
      ],
      correctChoiceId: 'choice-1',
      correctAnswer: 'p { color: red; }',
      acceptedAnswers: [],
      researchMetadata: {
        notes: ['選択肢ID一致のみ'],
      },
      explanation: '正解は選択肢1です。CSSは「セレクタ { プロパティ: 値; }」の形で書きます。選択肢2は、プロパティと値の区切りに等号（=）を使っていますが、CSSではコロン（:）を使います。選択肢3は、宣言のまとまりを丸括弧（ ( ) ）で囲んでいますが、CSSでは波括弧（ { } ）を使います。選択肢4は、セレクタpが波括弧の中に入っていますが、セレクタは波括弧の外（前）に書きます。復習する場合は教材「CSSルールセットの基本形」「記号の書き間違いに注意」（pilot-material-draft.md §5.1、§5.3）を読み直してください。',
      mainReviewNodeId: 'css-011',
      relatedPrerequisiteNodeIds: [],
    },
    {
      questionId: 'css-011-q3',
      nodeId: 'css-011',
      sourceReference: 'docs/content/pilot-quiz-prototype.md#css-011-q3',
      type: 'code-completion',
      difficulty: '標準',
      prompt: code(
        '段落（p要素）の文字の色を青にするCSSになるように、空欄に入るプロパティ名を答えてください（例: font-size）。',
        '',
        '```css',
        'p {',
        '  ____: blue;',
        '}',
        '```',
      ),
      choices: [],
      correctAnswer: 'color',
      acceptedAnswers: ['color'],
      answerNormalization: {
        trimWhitespace: true,
        caseInsensitive: true,
        scope: 'css-property-name',
        matchStrategy: 'exact-accepted-answer',
      },
      researchMetadata: {
        notes: [
          'D-020により、前後空白を除去し、CSSプロパティ名を大文字小文字を区別せず比較する。',
          '`color:`は、空欄直後にコロンが表示されているため不採用にする。',
          '正答の一意性: 教材草案§5.5はこの単元で使うプロパティをcolorとfont-sizeの2つに限定しており、「文字の色を変える」に対応するのはcolorのみで、教材範囲内で一意である。（CSS全体では文字色に影響する他の手段が存在し得るが、教材範囲外であり、採点は許容解集合との一致で行うため一意性は保たれる。）',
        ],
        acceptedAnswerDecision: {
          decisionId: 'D-020',
          decidedBy: '北代櫂',
          accepted: ['color'],
          rejected: ['color:', 'colour', 'font-color', 'text-color', 'blue'],
          rationale: [
            '問題文はプロパティ名を要求しており、空欄直後にコロンが既に表示されている。',
            '`color:`を空欄へ代入すると`color:: blue;`となり、提示コードとして不正になる。',
          ],
        },
        incorrectAnswerExamples: ['color:', 'colour', 'font-color', 'text-color', 'blue'],
      },
      explanation: '正解は`color`です。文字の色は`color`プロパティで指定します。「プロパティ: 値;」の形で、`color: blue;`と書くと文字が青になります。`font-color`や`text-color`というプロパティはCSSにはありません。値（blue）の側は「どう変えるか」、プロパティ（color）の側は「何を変えるか」を受け持つ、という役割の違いも確認してください。復習する場合は教材「色の指定」「この単元で使うプロパティ」（pilot-material-draft.md §5.4〜§5.5）を読み直してください。',
      mainReviewNodeId: 'css-011',
      relatedPrerequisiteNodeIds: [],
    },
  ],
} as const satisfies QuizDefinition
