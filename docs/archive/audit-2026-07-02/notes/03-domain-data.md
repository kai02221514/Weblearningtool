# トレーサビリティ監査ノート 03: ドメインデータ担当

- 対象: kai02221514/Weblearningtool @ main (HEAD: 16d2f93 / API確認 sha: 16d2f935ea730e0572ac3edbe57047b3204f4008)
- 調査日: 2026-07-02
- 取得方法: raw.githubusercontent.com 経由の web_fetch(全ファイル全文取得、truncationなし)
- 機械検証: Node.js v22.22.3(検証スクリプトと全出力は本ノート末尾の付録に記録。作業ファイルは `audit-notes/tmp/` に保存)
- 照合基準: docs/research/01-confirmed-decisions.md の確定事項(依頼文に記載のもの)

---

## 項目1: learningNodes.ts のノードID一覧・ノード数・ID形式

### 検証結果
- **ノード数: 合計63ノード(html_nodes: 32、css_nodes: 31)**。仕様の「MVP 12ノード(HTML 7 + CSS 5)」よりはるかに多いカタログを保持している。MVPの絞り込みは `src/domain/mvpScope.ts` 側で行う設計(項目6参照)。
- **ID形式: 63件全件が正規表現 `^(html|css)-[0-9]{3}$` に適合(不適合0件)**。重複IDなし。

全ID一覧(機械検証出力より、63件):

HTML (32件) — すべて適合:
```
html-000, html-010, html-011, html-012, html-013, html-020, html-021, html-022,
html-023, html-030, html-031, html-032, html-033, html-034, html-040, html-041,
html-050, html-051, html-060, html-061, html-070, html-071, html-072, html-080,
html-081, html-082, html-083, html-084, html-090, html-091, html-100, html-110
```

CSS (31件) — すべて適合:
```
css-000, css-010, css-011, css-012, css-020, css-021, css-022, css-023, css-024,
css-030, css-031, css-040, css-041, css-050, css-051, css-052, css-060, css-061,
css-062, css-070, css-071, css-080, css-081, css-090, css-091, css-092, css-100,
css-101, css-110, css-111, css-120
```

### 根拠
- src/data/learningNodes.ts: `export default { "version": "1.0.0", "domain": "html-css-foundations", "html_nodes": [...], "css_nodes": [...] }`(データは実質JSONオブジェクトの.ts export)
- 機械検証出力: `IDs violating ^(html|css)-[0-9]{3}$: NONE (all conform)` / `Duplicate IDs: NONE`

### 問題
- ID形式自体は問題なし。ただし「MVPは12ノード」という仕様に対し、カタログには63ノードが存在する。仕様が「カタログは広く持ち、MVPで12に絞る」ことを許容しているかは 01-confirmed-decisions.md の原文確認が必要(本ノートでは依頼文記載の基準のみで判定)。少なくとも learningNodes.ts 単体では12ノードという制約は表現されていない。

---

## 項目2: 前提関係(prerequisites)の参照切れ・循環・12ノード外参照

### 検証結果
- **全63ノードのカタログ内: 参照切れ 0件、循環 0件**(DFSによる機械検証)。
- **MVP 12ノード(mvpScope.tsの `MVP_NODE_IDS`)内: 前提関係は12ノード内で完全に閉じている(逸脱0件)** — 仕様「前提関係は12ノード内で閉じる」に適合。
- MVP 12ノードの前提関係(機械検証出力):

```
html-000: []
html-010: [html-000]
html-020: [html-010]
html-021: [html-020]
html-022: [html-020]
html-031: [html-021]
html-040: [html-021]
css-000:  [html-020]
css-010:  [css-000, html-010]
css-011:  [css-010]
css-020:  [css-011, html-022]
css-060:  [css-011]
```

- MVP構成の内訳: HTML 7ノード + CSS 5ノード = 12ノード — 仕様に適合。

### 根拠
- 機械検証出力: `Dangling prerequisite refs: NONE` / `Cycles: NONE` / `MVP prerequisites escaping the 12-node set: NONE (closed)` / `MVP count: 12 | HTML: 7 | CSS: 5`
- src/domain/mvpScope.ts にはモジュールロード時に「カタログに存在しないMVPノード」「MVP外の前提参照」を throw する実行時ガードがあり(下記引用)、この不変条件はコードでも強制されている:
```ts
const outsidePrerequisite = node.prerequisites.find(
  prerequisiteId => !mvpNodeIdSet.has(prerequisiteId)
)
if (outsidePrerequisite) {
  throw new Error(
    `MVP node ${nodeId} references a non-MVP prerequisite: ${outsidePrerequisite}`
  )
}
```

### 問題
- なし(この項目は仕様適合)。なお63ノード全体でもグラフは健全(参照切れ・循環なし)。

---

## 項目3: ノードのデータ構造(フィールド一覧)と推奨理由の構造化への利用可能性

### 検証結果
全63ノードのフィールド構成は完全に同一で1種類のみ:

| フィールド | 型 | 内容 |
|---|---|---|
| id | string | ノードID |
| title | string | 日本語タイトル(実データ) |
| summary | string | 学習到達目標に近い一文(実データ) |
| prerequisites | string[] | 前提ノードID |
| type | "concept" \| "skill" | 2値のみ使用 |
| tags | string[] | トピックタグ |

推奨理由の構造化に**使える**情報: prerequisites(前提)、type(concept/skill)、tags、summary(目標文)。
推奨理由の構造化に**存在しない**情報: **難易度(difficulty)、カテゴリ(category)、推定学習時間、教材本文、学習目標の箇条書き、確認テストとの紐付け**。

### 根拠
- 機械検証出力: `Distinct field sets: [ 'id,prerequisites,summary,tags,title,type' ]` / `type values: [ 'concept', 'skill' ]`
- 例(learningNodes.ts): `{ "id": "css-060", "title": "ボックスモデル:margin / padding / border", "summary": "余白と枠線の役割を理解し、意図通りに調整できる。", "prerequisites": ["css-011"], "type": "concept", "tags": ["box-model"] }`

### 問題
- **UIがデータに存在しないフィールドを参照している**。src/components/PracticeChallenge.tsx の「次のおすすめ」パネルは `node.category` と `node.difficulty` を表示するが、両フィールドはデータに存在しない:
```tsx
<Badge variant="outline" className="text-xs h-4 py-0">
  {node.category}
</Badge>
<span className="text-xs text-muted-foreground">
  {node.difficulty === 'beginner' ? '初級' :
   node.difficulty === 'intermediate' ? '中級' : '上級'}
</span>
```
  `node.difficulty` は常に undefined のため三項演算子のフォールバックで**全ノードが「上級」と表示される**実害バグ。`node.category` は空表示。同ファイル「関連リソース」パネルの `selectedNode.category` も同様。
- 難易度フィールド不在のため、レベル判定(SignupSurveyの beginner/intermediate/advanced)と学習ノードを難易度で対応付ける根拠データがない。

---

## 項目4: errorMappings.ts のエラーID形式・SRK分類・ノード参照の整合

### 検証結果
- エラー定義数: **14件**。ファイル先頭に `schema` オブジェクトで自己記述(error: id / label / srk / description / examples / detectionHints / nodeRefs{nodeId, priority, reason})。
- **エラーID形式: 14件全件が `E_大文字スネークケース` に適合(不適合0件)** — 仕様適合。
- **SRK分類: 全14件に `srk` フィールドあり。値は skill(3) / rule(4) / knowledge(7) の3種のみ** — 仕様「Skill/Rule/Knowledgeの三層」に適合。
- **nodeRefs 全件照合: 全27参照のうち、learningNodes.ts の実IDと一致するのは12件のみ。15件(55.6%)が参照切れ** — 仕様「正規ノードIDは ^(html|css)-[0-9]{3}$。slugやドット形式は非正規」「参照切れを許容しない」に**不適合**。

エラー別判定(全14件):

| エラーID | 形式 | srk | nodeRefs判定 |
|---|---|---|---|
| E_HTML_MISSING_CLOSING_TAG | 適合 | skill | 適合: html-020, html-021(全2件OK) |
| E_HTML_INVALID_NESTING | 適合 | rule | 適合: html-021, html-040(全2件OK) |
| E_HTML_MISSING_REQUIRED_ATTR | 適合 | knowledge | 適合: html-022(全1件OK) |
| E_HTML_HEADING_STRUCTURE | 適合 | knowledge | 適合: html-031(全1件OK) |
| E_HTML_LINK_HREF_INVALID | 適合 | rule | **全滅**: html.navigation.links.a_href, html.webBasics.urls.paths |
| E_CSS_SYNTAX_MISSING_SEMICOLON | 適合 | skill | 適合: css-011(全1件OK) |
| E_CSS_PROPERTY_UNKNOWN | 適合 | skill | **全滅**: css.basics.commonProperties, css.debug.devtools.styles |
| E_CSS_SELECTOR_NO_MATCH | 適合 | rule | 適合: css-020, html-022(全2件OK) |
| E_CSS_SPECIFICITY_OVERRIDE | 適合 | knowledge | **全滅**: css.cascade.specificity, css.cascade.order_inheritance, css.debug.devtools.styles |
| E_LAYOUT_BOX_MODEL_MISUNDERSTANDING | 適合 | knowledge | 適合: css-060(全1件OK) |
| E_LAYOUT_FLEX_AXIS_CONFUSION | 適合 | knowledge | **全滅**: css.layout.flex.basics, css.layout.flex.alignment |
| E_RUNTIME_RESOURCE_PATH | 適合 | rule | 適合: css-010, html-010(全2件OK) |
| E_DEBUG_TOOL_NOT_USED | 適合 | knowledge | **全滅**: css.debug.devtools.styles, css.debug.devtools.console_network, html.debug.dom_inspector |
| E_FORM_LABEL_ASSOCIATION | 適合 | knowledge | **全滅**: html.forms.labels, html.forms.inputs.basics, html.accessibility.forms |

参照切れ15件の全リスト(機械検証出力そのまま):
```
E_HTML_LINK_HREF_INVALID -> html.navigation.links.a_href
E_HTML_LINK_HREF_INVALID -> html.webBasics.urls.paths
E_CSS_PROPERTY_UNKNOWN -> css.basics.commonProperties
E_CSS_PROPERTY_UNKNOWN -> css.debug.devtools.styles
E_CSS_SPECIFICITY_OVERRIDE -> css.cascade.specificity
E_CSS_SPECIFICITY_OVERRIDE -> css.cascade.order_inheritance
E_CSS_SPECIFICITY_OVERRIDE -> css.debug.devtools.styles
E_LAYOUT_FLEX_AXIS_CONFUSION -> css.layout.flex.basics
E_LAYOUT_FLEX_AXIS_CONFUSION -> css.layout.flex.alignment
E_DEBUG_TOOL_NOT_USED -> css.debug.devtools.styles
E_DEBUG_TOOL_NOT_USED -> css.debug.devtools.console_network
E_DEBUG_TOOL_NOT_USED -> html.debug.dom_inspector
E_FORM_LABEL_ASSOCIATION -> html.forms.labels
E_FORM_LABEL_ASSOCIATION -> html.forms.inputs.basics
E_FORM_LABEL_ASSOCIATION -> html.accessibility.forms
```

有効な12参照はすべてMVP 12ノード内を指している(機械検証出力で全件 `(MVP)` 判定)。

### 根拠
- src/data/errorMappings.ts 該当箇所の引用(参照切れ例):
```json
{
  "id": "E_HTML_LINK_HREF_INVALID",
  ...
  "nodeRefs": [
    { "nodeId": "html.navigation.links.a_href", "priority": 1, "reason": "a要素とhrefの基本" },
    { "nodeId": "html.webBasics.urls.paths", "priority": 2, "reason": "URLとパスの概念" }
  ]
}
```
- 機械検証出力: `nodeRefs total: 27` / `nodeRefs BROKEN (not in learningNodes): 15` / `IDs violating E_UPPER_SNAKE: NONE` / `srk values used: [ 'skill', 'rule', 'knowledge' ]`

### 問題
- **[重大] 14エラー中6エラーは nodeRefs が全件参照切れ**(非正規のドット形式ID。旧ID体系の残骸とみられる)。仕様「エラーと関連ノードを結び、原因説明と復習単元提示へ接続する」が、この6エラーでは機能しない。
- 実行時の影響: PracticeChallenge.tsx は `nodeRefs.filter(ref => isMvpNodeId(ref.nodeId))` で復習推奨を組み立てるため、ドット形式参照は**例外にならず黙って捨てられる**(フェイルサイレント)。該当エラーが検出されても復習単元が提示されない。ただし現状の検出ロジックが発火させるのは E_HTML_MISSING_CLOSING_TAG / E_CSS_SYNTAX_MISSING_SEMICOLON / E_HTML_INVALID_NESTING / E_HTML_HEADING_STRUCTURE / E_HTML_MISSING_REQUIRED_ATTR の5種のみで、いずれも有効参照を持つため、壊れた6エラーは現UIから到達不能(=死にデータ)。
- 補足: PracticeChallenge.tsx には `if (Array.isArray(errorMappingsData))` という旧データ形状(配列)への防御コードが残っており、データ形状が過去に変更された痕跡。ドット形式IDはその移行の取り残しと整合する。

---

## 項目5: questionConfig.json と questionConfig.ts の差分・利用実態・quiz-{nodeId} 照合

### 検証結果
**(a) 二重管理と差分**
- 両ファイルの内容は**実質同一**(質問9問: background, learning_goal, available_time, programming_experience, skill_errors, rule_confidence, knowledge_concept, error_handling, learning_anxiety。各weight/options/scoreも一致)。
- 差分はラッパーのみ: .ts は `export const questionConfig = [...]`、.json は裸の配列リテラル。
- **questionConfig.json は JSON として不正**(キーが引用符なし、末尾カンマ、末尾に `;`)。JavaScriptの配列リテラルをそのまま .json 拡張子で保存したもので、`JSON.parse` 不可能。標準的なJSONローダ/バンドラのJSON importでは読めない。
- **利用されているのは .ts 側**。src/components/SignupSurvey.tsx:
```ts
import { questionConfig as questionConfigData } from '../data/questionConfig'
```
(拡張子なしimportはTS解決規則で .ts が優先。.json は仮に解決されてもパース不能)。リポジトリ全ファイルツリー(GitHub API, truncated:false)を確認した範囲で questionConfig.json を参照するコードは存在しない → **`.json` はデッドファイル**。

**(b) quiz-{nodeId} 形式・nodeId実在性**
- questionConfig は確認テスト(クイズ)ではなく**サインアップ時の学習者プロファイル診断アンケート**。IDは `background` 等でノードとは無関係(これ自体は用途が違うので形式違反とは言えない)。
- 一方、**仕様の「確認テストID quiz-{nodeId}」に相当するデータはリポジトリのどこにも存在しない**。確認テストの実体は src/components/Quiz.tsx にハードコードされた無名の3問配列 `quizQuestions` で、ID属性なし、nodeId紐付けなし。画面タイトルも「確認テスト: HTMLの基礎」固定で、**どのノードを学習しても同じ3問が出る**。

### 根拠
- questionConfig.json 冒頭(不正JSONの証拠): `[ { weight: 2, id: "background", ... ` および末尾 `];`
- Quiz.tsx: `const quizQuestions = [ { type: 'multiple', question: 'HTMLファイルの基本構造で、最初に書くべき宣言は何ですか？', ... } ]`(3要素、id/quizId/nodeIdフィールドなし)
- App.tsx: `<Quiz onComplete={...} />` に nodeId は渡されていない(props は onComplete/onDashboard/onReturnToLearning のみ)。

### 問題
- **[重大] 仕様の quiz-{nodeId} 体系が未実装**。クイズはノード非依存の固定3問で、12ノード分の確認テストデータが存在しない。
- **[中] questionConfig の二重管理**。.json は不正JSONかつ未参照のデッドファイルで、更新時に .ts と乖離するリスクだけが残る。削除または正規JSON化+単一ソース化が必要。

---

## 項目6: src/domain/mvpScope.ts の内容と利用箇所

### 検証結果
定義しているもの:
1. `MVP_NODE_IDS`: 12ノードIDの as const タプル(html-000/010/020/021/022/031/040 + css-000/010/011/020/060)= HTML 7 + CSS 5 — 仕様適合。
2. `MvpNodeId` 型、`LearningNode` 型(learningNodesの要素型から導出)。
3. モジュールロード時ガード: (a) MVPノードがカタログに無ければ throw、(b) MVP前提がMVP外を指せば throw(引用は項目2)。
4. `isMvpNodeId(nodeId)`: 型ガード。
5. `getMvpLearningNodes()`: MVP 12ノードの LearningNode 配列を返す。

利用箇所(全ツリー確認に基づく):
- **src/App.tsx**: `getMvpLearningNodes, MVP_NODE_IDS` — 学習ノード一覧と totalNodes に使用。
- **src/components/PracticeChallenge.tsx**: `getMvpLearningNodes, isMvpNodeId, MvpNodeId` — 課題の targetNodeIds 型検査、エラー→復習推奨のMVPフィルタ。
- **src/components/LearningModule.tsx**: `getMvpLearningNodes` — 次ノード推薦(前提充足チェック)。

### 根拠
- src/domain/mvpScope.ts 全文(1.3KB)精読、各コンポーネントの import 文引用(上記)。

### 問題
- 設計自体は仕様(12ノード・閉じた前提)をコードレベルで強制しており良好。ただし Dashboard.tsx / Completion.tsx は未精読のため、MVP外ノードの表示有無は本ノートの範囲外(担当外項目として申し送り)。

---

## 項目7: 色指定の扱い

### 検証結果
- **不適合の疑い**: learningNodes.ts に色指定の**独立ノード `css-041`** が存在する:
```json
{ "id": "css-041", "title": "色指定:color / background-color(hex/rgb/hsl)",
  "summary": "文字色と背景色を指定できる。", "prerequisites": ["css-011"],
  "type": "skill", "tags": ["color"] }
```
  仕様は「色指定は独立ノードにせず css-011 の教材内で扱う」。css-041 はMVP 12ノードには含まれない(mvpScope.tsで除外)ため**MVP範囲では独立ノードとして現れない**が、カタログ上は独立ノードとして残存しており、仕様の字義(「独立ノードにしない」)には反する。
- **css-011 の教材内で色を扱う」の実装は確認できない**: css-011 のデータは title/summary のみで教材本文フィールド自体が存在せず(項目3)、LearningModule.tsx の教材はHTML基礎の固定コンテンツのみ(項目8)。css-011 用の色指定教材はリポジトリ内に存在しない。
- 参考: 実践課題(PracticeChallenge)のヒントには「CSSのcolorプロパティで文字色を変更できます」「background-colorプロパティで背景色を設定できます」があり、課題要件「CSSで文字色や背景色をカスタマイズ」で色は実践課題側では扱われている。

### 問題
- css-041 の残存はMVPスコープ外とはいえ二重定義リスク(将来カタログを広げた際に「css-011教材内」との整合が崩れる)。css-011 側の教材に色を含める実装は未着手。

---

## 項目8: educational content の実在性(教材本文・クイズ問題・課題)

### 検証結果

| コンテンツ | 実在性判定 | 詳細 |
|---|---|---|
| ノード教材本文 | **実データなし(データ層に不在)** | learningNodes.ts は title/summary のみ。教材本文フィールドなし。 |
| 教材表示 | **単一ハードコード(実質placeholder)** | LearningModule.tsx の `learningContent` はHTML入門の1セット(スライド3枚+テキスト3節+コツ)を固定表示。`currentNodeId` を受け取るが**教材内容の切り替えに一切使用していない**。css-060 を学習してもHTML入門が表示される。導入画像はUnsplashの汎用画像。内容自体は日本語の実文(ダミー文字列ではない)だが、12ノード分の教材としては1/12しか存在しない。 |
| クイズ問題 | **実データ3問のみ・ノード非依存** | Quiz.tsx にハードコード(DOCTYPE選択、h1穴埋め、p選択)。quiz-{nodeId} 体系なし(項目5)。 |
| 実践課題 | **実データあり(1課題)** | PracticeChallenge.tsx に `challenge.id = 'practice-profile-card'` — **仕様の中心実践課題IDと一致**。要件5項目・ヒント4件・初期コード・SRK三層のクライアントサイド静的解析(閉じタグ/セミコロン/ul入れ子/h1重複/見出し階層/alt欠落)・エラー→復習単元提示まで実装。targetNodeIds は10件で全てMVPノード(`satisfies readonly MvpNodeId[]` で型強制)。 |
| 診断アンケート | 実データあり | questionConfig.ts の9問(重み付きスコア→レベル判定に実際に使用)。 |

### 根拠
- LearningModule.tsx: `const learningContent = { introduction: {...}, slides: [...], textContent: {...} }`(モジュールスコープ定数、currentNodeId 非参照)。props の `currentNodeName` はヘッダー表示のみに使用。
- PracticeChallenge.tsx: `const challenge = { id: 'practice-profile-card', title: '自己紹介ページを作成しよう', ..., targetNodeIds: ['html-010','html-020','html-021','html-022','html-031','html-040','css-010','css-011','css-020','css-060'] as const satisfies readonly MvpNodeId[] }`
- Quiz.tsx: 固定 `quizQuestions`(項目5で引用)。

### 問題
- **[重大] 12ノード個別の教材・確認テストが存在しない**。データ層(learningNodes.ts)に教材本文を持たせるスキーマも、ノードID→教材/クイズを引くデータファイルも無い。「個別最適化学習」の中核となるノード別コンテンツが1ノード相当分しかなく、学習フロー(教材→quiz→practice)はどのノードでも同一内容になる。
- 実践課題は仕様(ID・SRK三層・エラー→復習接続)に最も忠実な部分。ただし課題進捗ヘッダーの「Lesson 3 / 10」「30%」はハードコードのダミー。

---

## 付録: 機械検証の記録

### 使用環境・ファイル
- Node.js v22.22.3(セッションのLinuxワークスペース)
- 入力: web_fetch で取得した learningNodes.ts / errorMappings.ts のデータ部を JSON 化して保存
  - `audit-notes/tmp/learningNodes.json`(全63ノード、全フィールド)
  - `audit-notes/tmp/errorMappings.json`(全14エラーの id/srk/nodeRefs。検証に必要なフィールドのみ転記、nodeId/priority は原文と完全一致)
- スクリプト: `audit-notes/tmp/verify.js`

### 検証スクリプト(verify.js 要点)
```js
const idRe = /^(html|css)-[0-9]{3}$/;                 // 項目1: ID形式(全件判定)
// 項目2: dangling refs = prerequisites のうち idSet に無いもの
// 項目2: 循環 = DFS(state: unvisited/in-stack/done)で in-stack 再訪を検出
// 項目2b: MVP_NODE_IDS(mvpScope.tsから転記)に対し閉包判定
// 項目3: Object.keys の distinct set
const errRe = /^E_[A-Z0-9]+(_[A-Z0-9]+)+$/;           // 項目4: エラーID形式
// 項目4: nodeRefs 全27件を learningNodes の idSet と照合、MVP内/外も判定
```
(全文は audit-notes/tmp/verify.js に保存)

### 出力(全文)
```
=== 1. Node ID inventory & format ===
html_nodes: 32 css_nodes: 31 total: 63
IDs violating ^(html|css)-[0-9]{3}$: NONE (all conform)
Duplicate IDs: NONE

=== 2. Prerequisites: dangling refs & cycles (full catalog) ===
Dangling prerequisite refs: NONE
Cycles: NONE

=== 2b. MVP scope closure (12 nodes from mvpScope.ts) ===
MVP count: 12 | HTML: 7 | CSS: 5
MVP IDs missing from catalog: NONE
MVP prerequisites escaping the 12-node set: NONE (closed)

=== 3. Node field structure ===
Distinct field sets: [ 'id,prerequisites,summary,tags,title,type' ]
type values: [ 'concept', 'skill' ]

=== 4. errorMappings verification ===
Error count: 14
IDs violating E_UPPER_SNAKE: NONE
srk values used: [ 'skill', 'rule', 'knowledge' ]
nodeRefs total: 27
nodeRefs BROKEN (not in learningNodes): 15
  E_HTML_LINK_HREF_INVALID -> html.navigation.links.a_href
  E_HTML_LINK_HREF_INVALID -> html.webBasics.urls.paths
  E_CSS_PROPERTY_UNKNOWN -> css.basics.commonProperties
  E_CSS_PROPERTY_UNKNOWN -> css.debug.devtools.styles
  E_CSS_SPECIFICITY_OVERRIDE -> css.cascade.specificity
  E_CSS_SPECIFICITY_OVERRIDE -> css.cascade.order_inheritance
  E_CSS_SPECIFICITY_OVERRIDE -> css.debug.devtools.styles
  E_LAYOUT_FLEX_AXIS_CONFUSION -> css.layout.flex.basics
  E_LAYOUT_FLEX_AXIS_CONFUSION -> css.layout.flex.alignment
  E_DEBUG_TOOL_NOT_USED -> css.debug.devtools.styles
  E_DEBUG_TOOL_NOT_USED -> css.debug.devtools.console_network
  E_DEBUG_TOOL_NOT_USED -> html.debug.dom_inspector
  E_FORM_LABEL_ASSOCIATION -> html.forms.labels
  E_FORM_LABEL_ASSOCIATION -> html.forms.inputs.basics
  E_FORM_LABEL_ASSOCIATION -> html.accessibility.forms
nodeRefs VALID: 12 (すべてMVP 12ノード内: html-010/020/021/022/031/040, css-010/011/020/060)
```

### 追加で精読したファイル(利用実態の裏取り)
- src/App.tsx(mvpScope利用、フェーズ遷移、quizにnodeId非伝達)
- src/components/SignupSurvey.tsx(questionConfig.ts をimport)
- src/components/Quiz.tsx(固定3問、quiz-{nodeId}なし)
- src/components/PracticeChallenge.tsx(practice-profile-card、SRK三層、errorMappings/mvpScope利用、category/difficulty参照バグ)
- src/components/LearningModule.tsx(固定教材、currentNodeId非依存)
- GitHub API git/trees(recursive, truncated:false)で全ファイル一覧を確認

## 発見事項サマリ(優先度順)

1. **[重大] errorMappings.ts: 27参照中15件(6エラー分)が非正規ドット形式IDで全件参照切れ** — 該当6エラーは復習単元提示が機能しない(現UIでは黙って空になる)。
2. **[重大] quiz-{nodeId} 体系が未実装** — 確認テストはQuiz.tsxハードコードの固定3問、ノード非依存。データとしてのクイズは存在しない。
3. **[重大] ノード別教材が存在しない** — learningNodes.tsに教材本文フィールドなし。LearningModuleは全ノードで同一のHTML入門コンテンツを表示。
4. **[中] questionConfig の二重管理** — .json は不正JSONかつ未参照のデッドファイル。実体は .ts のみ。
5. **[中] UIが存在しないフィールドを参照** — PracticeChallenge.tsx が node.category / node.difficulty を表示(difficultyは常に「上級」と誤表示)。
6. **[軽] 色指定の独立ノード css-041 がカタログに残存**(MVP外だが仕様の字義に反する)。css-011教材内での色の扱いは教材自体が無いため未実現。
7. **[適合] ノードID形式(63/63)、前提グラフ健全性(参照切れ0・循環0)、MVP 12ノード=HTML7+CSS5の閉包、エラーID形式(14/14)、SRK三層、practice-profile-card の存在と実装は仕様に適合。**
