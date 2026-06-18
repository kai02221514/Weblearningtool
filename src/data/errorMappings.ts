export default {
  "version": "1.0.0",
  "schema": {
    "error": {
      "id": "string",
      "label": "string",
      "srk": "skill|rule|knowledge",
      "description": "string",
      "examples": ["string"],
      "detectionHints": {
        "type": "lint|parser|runtime|heuristic|llm",
        "signals": ["string"]
      },
      "nodeRefs": [
        {
          "nodeId": "string",
          "priority": 1,
          "reason": "string"
        }
      ]
    }
  },
  "errors": [
    {
      "id": "E_HTML_MISSING_CLOSING_TAG",
      "label": "HTMLの閉じタグ不足・対応ミス",
      "srk": "skill",
      "description": "閉じタグの欠落や対応関係の崩れによりDOM構造が破綻する。",
      "examples": ["<p>...(</p>がない)", "<div><p>..</div></p>"],
      "detectionHints": {
        "type": "parser",
        "signals": ["HTMLパーサ警告", "DOMツリーの自動補完が発生", "構造崩れ"]
      },
      "nodeRefs": [
        { "nodeId": "html-020", "priority": 1, "reason": "ペアタグと閉じ方の基本" },
        { "nodeId": "html-021", "priority": 2, "reason": "入れ子と対応関係の理解" }
      ]
    },
    {
      "id": "E_HTML_INVALID_NESTING",
      "label": "HTMLの不正な入れ子(コンテンツモデル違反)",
      "srk": "rule",
      "description": "HTML要素の入れ子が仕様上不適切で、意図しない表示や補完が起きる。",
      "examples": ["<p><div>..</div></p>", "<ul><p>item</p></ul>"],
      "detectionHints": {
        "type": "lint",
        "signals": ["validatorのエラー", "ul直下にli以外", "pの中にブロック要素"]
      },
      "nodeRefs": [
        { "nodeId": "html-021", "priority": 1, "reason": "HTMLの入れ子規則" },
        { "nodeId": "html-040", "priority": 2, "reason": "リスト構造の規則" }
      ]
    },
    {
      "id": "E_HTML_MISSING_REQUIRED_ATTR",
      "label": "必須/推奨属性の不足(例: imgのalt)",
      "srk": "knowledge",
      "description": "アクセシビリティや意味づけの観点で必要な属性が欠落している。",
      "examples": ["<img src='a.png'>(altなし)", "<label>と<input>の紐付け不足"],
      "detectionHints": {
        "type": "lint",
        "signals": ["a11y lint警告", "画像にaltがない", "label for未設定"]
      },
      "nodeRefs": [
        { "nodeId": "html-022", "priority": 1, "reason": "属性の書式と必須属性の考え方" }
      ]
    },
    {
      "id": "E_HTML_HEADING_STRUCTURE",
      "label": "見出し構造の破綻(h1乱立・順序不自然)",
      "srk": "knowledge",
      "description": "文書構造の設計が不適切で、内容の理解やアクセシビリティが低下する。",
      "examples": ["h1が複数", "h2の前にh4", "見出しが段落代わり"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["見出しレベルの飛び", "h1の複数出現"]
      },
      "nodeRefs": [
        { "nodeId": "html-031", "priority": 1, "reason": "見出しの意味と階層" }
      ]
    },
    {
      "id": "E_HTML_LINK_HREF_INVALID",
      "label": "リンクのhrefが不正・意図と違う",
      "srk": "rule",
      "description": "hrefの指定やURL/パスの扱いが誤っており、遷移できない。",
      "examples": ["href='Google'", "相対/絶対パスの誤り", "拡張子/ディレクトリ誤り"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["クリックしても遷移しない", "URLとして解釈不能"]
      },
      "nodeRefs": [
        { "nodeId": "html.navigation.links.a_href", "priority": 1, "reason": "a要素とhrefの基本" },
        { "nodeId": "html.webBasics.urls.paths", "priority": 2, "reason": "URLとパスの概念" }
      ]
    },
    {
      "id": "E_CSS_SYNTAX_MISSING_SEMICOLON",
      "label": "CSSのセミコロン/コロン/波括弧の欠落",
      "srk": "skill",
      "description": "CSS宣言の区切りが欠落し、以降の宣言が無効になる。",
      "examples": ["color: red(;なし)", "body { color red; }", " } がない"],
      "detectionHints": {
        "type": "parser",
        "signals": ["CSSパーサエラー", "以降の宣言が反映されない"]
      },
      "nodeRefs": [
        { "nodeId": "css-011", "priority": 1, "reason": "宣言ブロックと区切りの書き方" }
      ]
    },
    {
      "id": "E_CSS_PROPERTY_UNKNOWN",
      "label": "CSSプロパティ名の誤り(存在しない/綴りミス)",
      "srk": "skill",
      "description": "プロパティが認識されずスタイルが適用されない。",
      "examples": ["backgroud-color", "font-color(誤)"],
      "detectionHints": {
        "type": "lint",
        "signals": ["unknown property", "宣言が無効"]
      },
      "nodeRefs": [
        { "nodeId": "css.basics.commonProperties", "priority": 1, "reason": "頻出プロパティの理解" },
        { "nodeId": "css.debug.devtools.styles", "priority": 2, "reason": "無効宣言の確認方法" }
      ]
    },
    {
      "id": "E_CSS_SELECTOR_NO_MATCH",
      "label": "セレクタが要素に一致しない",
      "srk": "rule",
      "description": "HTML側の構造やclass/id指定とCSSセレクタが噛み合っていない。",
      "examples": [".title h2 を指定したがHTMLに存在しない", "#main をCSSで指定したがHTMLにない"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["DevToolsでマッチ0", "スタイルが当たらない"]
      },
      "nodeRefs": [
        { "nodeId": "css-020", "priority": 1, "reason": "基本セレクタ" },
        { "nodeId": "html-022", "priority": 2, "reason": "class/idの付け方" }
      ]
    },
    {
      "id": "E_CSS_SPECIFICITY_OVERRIDE",
      "label": "詳細度・カスケードにより意図通り上書きできない",
      "srk": "knowledge",
      "description": "CSSの優先順位(詳細度/順序/important/継承)を誤解している。",
      "examples": ["より弱いセレクタで上書きしようとして失敗", "後勝ちの順序を理解していない"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["DevToolsで取り消し線", "別ルールに負けている"]
      },
      "nodeRefs": [
        { "nodeId": "css.cascade.specificity", "priority": 1, "reason": "詳細度の概念" },
        { "nodeId": "css.cascade.order_inheritance", "priority": 2, "reason": "順序と継承" },
        { "nodeId": "css.debug.devtools.styles", "priority": 3, "reason": "競合の確認" }
      ]
    },
    {
      "id": "E_LAYOUT_BOX_MODEL_MISUNDERSTANDING",
      "label": "ボックスモデル理解不足(サイズが合わない/はみ出す)",
      "srk": "knowledge",
      "description": "padding/border/marginとwidth/heightの関係を誤解している。",
      "examples": ["widthを指定したのに大きくなる", "余白で崩れる", "box-sizing未理解"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["意図せず横スクロール", "要素がはみ出す"]
      },
      "nodeRefs": [
        { "nodeId": "css-060", "priority": 1, "reason": "ボックスモデル基礎" }
      ]
    },
    {
      "id": "E_LAYOUT_FLEX_AXIS_CONFUSION",
      "label": "Flexの軸理解不足(justify/alignの混同)",
      "srk": "knowledge",
      "description": "主軸/交差軸の理解が曖昧で、配置が意図通りにならない。",
      "examples": ["justify-contentとalign-itemsを逆に使う", "flex-directionで軸が変わることを知らない"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["flex指定したが整列が直らない"]
      },
      "nodeRefs": [
        { "nodeId": "css.layout.flex.basics", "priority": 1, "reason": "flex基礎と軸" },
        { "nodeId": "css.layout.flex.alignment", "priority": 2, "reason": "整列プロパティ" }
      ]
    },
    {
      "id": "E_RUNTIME_RESOURCE_PATH",
      "label": "画像/フォント等のリソースパス誤り",
      "srk": "rule",
      "description": "ファイル参照のパス指定が誤り、読み込みに失敗している。",
      "examples": ["imgのsrcが誤り", "CSSのbackground-image URLが誤り", "フォント読み込み失敗"],
      "detectionHints": {
        "type": "runtime",
        "signals": ["ネットワーク404", "コンソールのリソースエラー"]
      },
      "nodeRefs": [
        { "nodeId": "css-010", "priority": 1, "reason": "CSSの読み込みと適用方法" },
        { "nodeId": "html-010", "priority": 2, "reason": "HTML文書内の読み込み位置" }
      ]
    },
    {
      "id": "E_DEBUG_TOOL_NOT_USED",
      "label": "開発者ツール未活用による原因特定の停滞",
      "srk": "knowledge",
      "description": "エラー原因を推定するための観察手段(DevTools)の使い方が確立していない。",
      "examples": ["どのCSSが当たっているか見ていない", "コンソールやネットワークを見ていない"],
      "detectionHints": {
        "type": "heuristic",
        "signals": ["試行錯誤が長い", "同じ修正を繰り返す"]
      },
      "nodeRefs": [
        { "nodeId": "css.debug.devtools.styles", "priority": 1, "reason": "Styles/Computedの見方" },
        { "nodeId": "css.debug.devtools.console_network", "priority": 2, "reason": "Console/Networkの見方" },
        { "nodeId": "html.debug.dom_inspector", "priority": 3, "reason": "DOM検査" }
      ]
    },
    {
      "id": "E_FORM_LABEL_ASSOCIATION",
      "label": "フォームのラベル/入力の紐付け不備",
      "srk": "knowledge",
      "description": "フォーム部品の意味とアクセシビリティ設計が不足している。",
      "examples": ["labelがない", "forとidが対応していない", "placeholderだけに依存"],
      "detectionHints": {
        "type": "lint",
        "signals": ["a11y警告", "フォームが読み上げに弱い"]
      },
      "nodeRefs": [
        { "nodeId": "html.forms.labels", "priority": 1, "reason": "labelとfor/id" },
        { "nodeId": "html.forms.inputs.basics", "priority": 2, "reason": "inputの基本" },
        { "nodeId": "html.accessibility.forms", "priority": 3, "reason": "フォームa11y" }
      ]
    }
  ]
}
