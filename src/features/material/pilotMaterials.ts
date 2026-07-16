import type { LearningMaterialDefinition } from './types'

const sharedMetadata = {
  reviewStatus: '研究者レビュー済み・予備試行前',
  statusNote:
    '本書は正本教材ではなく、本実験用教材として最終確定したものでもない。予備試行結果に応じて修正可能である。',
  sourceDocumentPath: 'docs/content/pilot-material-draft.md',
} as const

const html010Material = {
  ...sharedMetadata,
  nodeId: 'html-010',
  title: 'HTML基本骨格',
  sourceSection: '§3 html-010: HTML基本骨格',
  sections: [
    {
      sectionId: 'html-010-3-1',
      title: '3.1 最小のHTML文書',
      blocks: [
        {
          kind: 'paragraph',
          content:
            'Webページの元になるHTMLファイルには、共通の骨格がある。次のコードは、この単元で覚える最小のHTML文書である。',
        },
        {
          kind: 'code',
          language: 'html',
          content: `<!DOCTYPE html>
<html>
  <head>
    <title>ページのタイトル</title>
  </head>
  <body>
    <p>ここに表示したい内容を書きます。</p>
  </body>
</html>`,
        },
        {
          kind: 'paragraph',
          content: 'この骨格は次の順序と包含関係で構成される。',
        },
        {
          kind: 'list',
          ordered: true,
          items: [
            '最初の行に <!DOCTYPE html> を書く。',
            'その下に <html> 〜 </html> を書き、文書全体を包む。',
            '<html> の中に、<head> 〜 </head> と <body> 〜 </body> をこの順で書く。',
          ],
        },
      ],
    },
    {
      sectionId: 'html-010-3-2',
      title: '3.2 <!DOCTYPE html> の役割',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '<!DOCTYPE html> は「この文書はHTMLです」とブラウザに伝える宣言である。',
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            '文書のいちばん先頭に、1回だけ書く。',
            '<html> などの要素の外側（前）に書く。要素の中には書かない。',
            'これは要素（タグのペア）ではなく宣言なので、終了タグはない。',
          ],
        },
      ],
    },
    {
      sectionId: 'html-010-3-3',
      title: '3.3 html要素の役割',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '<html> 〜 </html> は文書全体を包む要素である。<!DOCTYPE html> を除いて、HTML文書のすべての内容は <html> の中に入る。<html> の直下には <head> と <body> の2つが入る。',
        },
      ],
    },
    {
      sectionId: 'html-010-3-4',
      title: '3.4 head要素の役割',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '<head> 〜 </head> には、ページ本文としては表示されない「ページに関する情報」を書く。',
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            'この単元では、ページのタイトルを表す <title> を書く場所として覚える。',
            '<title> に書いた文字は、ページの本文ではなく、ブラウザのタブなどに表示される。',
          ],
        },
      ],
    },
    {
      sectionId: 'html-010-3-5',
      title: '3.5 body要素の役割',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '<body> 〜 </body> には、ブラウザの画面に表示される内容を書く。段落 <p> などの表示したい要素はすべて <body> の中に書く。',
        },
      ],
    },
    {
      sectionId: 'html-010-3-6',
      title: '3.6 よくある間違い',
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            '<head> と <body> の順序を逆にする。正しくは <head> が先、<body> が後である。',
            '表示したい文章を <head> の中に書いてしまう。表示する内容は <body> に書く。',
            '<!DOCTYPE html> を <html> の中に書いてしまう。宣言は文書の先頭、<html> の外側に書く。',
          ],
        },
      ],
    },
  ],
} as const satisfies LearningMaterialDefinition

const html021Material = {
  ...sharedMetadata,
  nodeId: 'html-021',
  title: '入れ子構造',
  sourceSection: '§4 html-021: 入れ子構造',
  sections: [
    {
      sectionId: 'html-021-prerequisite',
      title: '4. html-021: 入れ子構造',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '前提ノード html-020 で学んだこと（この単元で使う知識）: 要素は原則として開始タグ、内容、終了タグの3つで構成される。例: <p>こんにちは</p>。',
        },
      ],
    },
    {
      sectionId: 'html-021-4-1',
      title: '4.1 要素の中に要素を入れる（入れ子）',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '要素の内容には、文字だけでなく別の要素を入れることができる。これを入れ子（ネスト）と呼ぶ。',
        },
        {
          kind: 'code',
          language: 'html',
          content: '<p><strong>重要</strong>なお知らせです。</p>',
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            '外側の要素を親要素と呼ぶ。上の例では <p> が親要素である。',
            '内側の要素を子要素と呼ぶ。上の例では <strong> が <p> の子要素である。',
            '親要素とは、その要素を直接包んでいる1つ外側の要素を指す。上の例を <body> の中に書いた場合でも、<strong> の親要素は <p> であり、<body> は親のさらに外側（祖先）である。',
          ],
        },
      ],
    },
    {
      sectionId: 'html-021-4-2',
      title: '4.2 閉じる順序の規則',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '入れ子にした要素は、内側の要素から先に閉じる。後から開始したタグを先に閉じる、と覚えてもよい。',
        },
        {
          kind: 'code',
          language: 'html',
          content: `<!-- 正しい: strongを閉じてからpを閉じる -->
<p><strong>重要</strong>なお知らせです。</p>`,
        },
      ],
    },
    {
      sectionId: 'html-021-4-3',
      title: '4.3 交差した入れ子は誤り',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '閉じる順序を間違えると、タグが交差してしまう。次の例は誤りである。',
        },
        {
          kind: 'code',
          language: 'html',
          content: `<!-- 誤り: pの中で開始したstrongを、pを閉じた後に閉じている -->
<p><strong>重要</p></strong>`,
        },
        {
          kind: 'paragraph',
          content:
            'タグの対応関係が交差しているHTMLは、正しい入れ子構造ではない。ブラウザ上で一見表示されることがあっても、正しい文書構造として扱われない。',
        },
      ],
    },
    {
      sectionId: 'html-021-4-4',
      title: '4.4 インデントで構造を見やすくする',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '親子関係が深くなるときは、子要素を字下げ（インデント）して書くと、どの要素がどの要素の中にあるかが読みやすくなる。',
        },
        {
          kind: 'code',
          language: 'html',
          content: `<body>
  <p>
    <strong>重要</strong>なお知らせです。
  </p>
</body>`,
        },
      ],
    },
    {
      sectionId: 'html-021-4-5',
      title: '4.5 よくある間違い',
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            '外側の要素を先に閉じてしまい、タグが交差する。',
            '内側の要素の終了タグを書き忘れる（html-020の閉じタグの復習も参照）。',
            '親要素と、さらに外側の要素（祖先）を区別できない。',
          ],
        },
      ],
    },
  ],
} as const satisfies LearningMaterialDefinition

const css011Material = {
  ...sharedMetadata,
  nodeId: 'css-011',
  title: 'CSS基本構文',
  sourceSection: '§5 css-011: CSS基本構文',
  sections: [
    {
      sectionId: 'css-011-prerequisite',
      title: '5. css-011: CSS基本構文',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '前提ノード css-010 で学んだこと（この単元で使う知識）: CSSはHTMLに適用して見た目を変えるための言語であり、外部CSS・内部CSS・インラインの適用方法がある。この単元では、CSSそのものの書き方を学ぶ。',
        },
      ],
    },
    {
      sectionId: 'css-011-5-1',
      title: '5.1 CSSルールセットの基本形',
      blocks: [
        {
          kind: 'paragraph',
          content: 'CSSは次の形のまとまり（ルールセット）で書く。',
        },
        {
          kind: 'code',
          language: 'css',
          content: `p {
  color: red;
}`,
        },
        {
          kind: 'paragraph',
          content: '各部分の名前と役割は次のとおりである。',
        },
        {
          kind: 'table',
          headers: ['部分', '上の例', '役割'],
          rows: [
            ['セレクタ', 'p', 'どのHTML要素に適用するかを指定する'],
            ['波括弧 { }', '{ ... }', 'そのセレクタに適用する宣言のまとまりを囲む'],
            ['プロパティ', 'color', '何を変えるか（この例では文字の色）を指定する'],
            ['コロン :', ':', 'プロパティと値を区切る'],
            ['値', 'red', 'どう変えるか（この例では赤に）を指定する'],
            ['セミコロン ;', ';', '1つの宣言の終わりを示す'],
          ],
        },
        {
          kind: 'paragraph',
          content: '「プロパティ: 値;」のひとまとまりを宣言と呼ぶ。',
        },
      ],
    },
    {
      sectionId: 'css-011-5-2',
      title: '5.2 複数の宣言を書く',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '1つのルールセットの波括弧の中には、宣言を複数書ける。各宣言の終わりには必ずセミコロンを書く。',
        },
        {
          kind: 'code',
          language: 'css',
          content: `p {
  color: red;
  font-size: 20px;
}`,
        },
        {
          kind: 'paragraph',
          content:
            '[補足] 最後の宣言のセミコロンを省略できる場合もあるが、この教材では書き忘れを防ぐため、すべての宣言の終わりにセミコロンを付けると覚える。',
        },
      ],
    },
    {
      sectionId: 'css-011-5-3',
      title: '5.3 記号の書き間違いに注意',
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            'プロパティと値の区切りはコロン : である。等号 = は使わない。',
            '宣言のまとまりを囲むのは波括弧 { } である。丸括弧 ( ) や角括弧 [ ] は使わない。',
            'セミコロン ; を忘れると、その後の宣言が正しく適用されないことがある。',
          ],
        },
      ],
    },
    {
      sectionId: 'css-011-5-4',
      title: '5.4 色の指定（この単元で扱う最小範囲）',
      blocks: [
        {
          kind: 'paragraph',
          content:
            '文字の色は color プロパティで変える。この単元では、値として red、blue、green のような基本的な色名を使う。',
        },
        {
          kind: 'code',
          language: 'css',
          content: `p {
  color: blue;
}`,
        },
        {
          kind: 'paragraph',
          content: '（16進カラーコードなどの詳細な色指定はこの単元では扱わない。）',
        },
      ],
    },
    {
      sectionId: 'css-011-5-5',
      title: '5.5 この単元で使うプロパティ',
      blocks: [
        {
          kind: 'paragraph',
          content: 'この単元の説明と練習では、次の2つだけを使う。',
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            'color: 文字の色を変える',
            'font-size: 文字の大きさを変える（例: 20px）',
          ],
        },
      ],
    },
    {
      sectionId: 'css-011-5-6',
      title: '5.6 よくある間違い',
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            'コロンと等号の混同（color= red; は誤り）。',
            '波括弧と丸括弧の混同（p ( ... ) は誤り）。',
            'セミコロンの書き忘れ。',
            'セレクタを波括弧の中に書いてしまう。',
          ],
        },
      ],
    },
  ],
} as const satisfies LearningMaterialDefinition

export const PILOT_MATERIAL_CATALOG: readonly LearningMaterialDefinition[] = [
  html010Material,
  html021Material,
  css011Material,
]

const pilotMaterialByNodeId = new Map<string, LearningMaterialDefinition>(
  PILOT_MATERIAL_CATALOG.map(material => [material.nodeId, material])
)

export function getPilotLearningMaterials(): readonly LearningMaterialDefinition[] {
  return PILOT_MATERIAL_CATALOG
}

export function resolvePilotLearningMaterial(
  nodeId: string,
): LearningMaterialDefinition | null {
  return pilotMaterialByNodeId.get(nodeId) ?? null
}
