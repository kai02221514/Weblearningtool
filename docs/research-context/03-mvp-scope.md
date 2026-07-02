# MVPスコープ

## 目的

[確定事項] 診断、進捗、確認テスト、実践課題エラー、振り返りを正規ノードIDへ統合し、説明可能な個別ルートを生成・更新できることを検証する。

## 12ノード

|順序|ID|表示名|前提|
|---:|---|---|---|
|1|`html-000`|HTMLとは何か|なし|
|2|`html-010`|HTML基本骨格|`html-000`|
|3|`html-020`|要素とタグ|`html-010`|
|4|`html-021`|入れ子構造|`html-020`|
|5|`html-022`|属性|`html-020`|
|6|`html-031`|見出し階層|`html-021`|
|7|`html-040`|リスト|`html-021`|
|8|`css-000`|CSSとは何か|`html-020`|
|9|`css-010`|CSSの適用方法|`css-000`, `html-010`|
|10|`css-011`|CSS基本構文|`css-010`|
|11|`css-020`|基本セレクタ|`css-011`, `html-022`|
|12|`css-060`|ボックスモデル|`css-011`|

## ID体系

- ノード: `^(html|css)-[0-9]{3}$`
- 確認テスト: `quiz-{nodeId}`
- 実践課題: `practice-profile-card`
- エラー: `E_<領域>_<内容>`

## MVPエラー

|エラーID|主推薦|補助|
|---|---|---|
|`E_HTML_MISSING_CLOSING_TAG`|`html-020`|`html-021`|
|`E_HTML_INVALID_NESTING`|`html-021`|`html-040`|
|`E_HTML_MISSING_REQUIRED_ATTR`|`html-022`|なし|
|`E_HTML_HEADING_STRUCTURE`|`html-031`|なし|
|`E_CSS_SYNTAX_MISSING_SEMICOLON`|`css-011`|なし|
|`E_CSS_SELECTOR_NO_MATCH`|`css-020`|`html-022`|
|`E_LAYOUT_BOX_MODEL_MISUNDERSTANDING`|`css-060`|なし|
|`E_RUNTIME_RESOURCE_PATH`|`css-010`|`html-010`|

## MVPに含む機能

- 初期診断と診断結果の保存
- 到達可能ノードの抽出
- 初期開始ノード・順序付きルート生成
- ノード単位の教材、確認テスト、実践課題、振り返り
- テスト・エラー・振り返りによる再推薦
- 推薦理由表示
- ルート履歴・学習履歴の保存
- 評価用アンケートとデータ出力

## 対象外

- 全63ノードの教材完成
- AIによる自由記述の高度解析
- 高機能IDE、厳密なHTML/CSS静的解析
- 商用運用向け管理画面
- 大規模比較実験
- Next.js等への全面移行
