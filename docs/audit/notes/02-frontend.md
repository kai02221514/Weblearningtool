# フロントエンド調査ノート（02-frontend）

- 対象: kai02221514/Weblearningtool @ main (16d2f93)
- 調査日: 2026-07-02
- 調査方法: raw.githubusercontent.com から各ファイルを取得し精読（コード変更なし）
- 精読ファイル: src/main.tsx, src/App.tsx, src/components/{Onboarding, Tutorial, Dashboard, LearningModule, Quiz, PracticeChallenge, Completion, LearningReflectionForm, LearningReflections, SignupSurvey}.tsx
- 補助参照: src/domain/mvpScope.ts, src/data/questionConfig.ts, src/utils/auth.ts

---

## 1. 診断入力（オンボーディング）の内容と開始ノード決定への利用

**実態**
- 実際に使われる診断は `SignupSurvey.tsx`（App.tsx の `phase: 'survey'`）。質問は `src/data/questionConfig.ts` の9問（background, learning_goal, available_time, programming_experience, skill_errors, rule_confidence, knowledge_concept, error_handling, learning_anxiety）。選択肢ごとの score × weight を合算し、`determineLevel` で level を判定（`score >= 24` advanced / `>= 17` intermediate / それ以外 beginner）。
- `programming_experience === 'yes'` のときだけSRK関連5問（skill_errors 等）を表示する条件分岐あり（`conditionalQuestionIds`）。
- **診断結果は開始ノード決定に一切使われていない。** App.tsx の `handleSurveyComplete` は `userData` に level/levelScore を保存するだけで、`progress.recommendedStartNodeIds` は初期state のハードコード `['html-010']` のまま更新されない。

```tsx
// App.tsx handleSurveyComplete — progress には触れない
setUserData({ ...userData, age: ..., level: surveyData.level, levelScore: surveyData.levelScore })
setPhase('tutorial')
```
```tsx
// App.tsx 初期state（唯一の recommendedStartNodeIds の設定箇所）
recommendedStartNodeIds: ['html-010'],
inProgressNodeId: 'html-010',
```

- `Onboarding.tsx` は App.tsx から import されていない**デッドコード**。しかも `determineLevel` の閾値が SignupSurvey と不一致（7/5/>0 vs 24/17/10）。

**実装状態**: 部分実装（診断UI・スコア算出は実装済み。開始ノードへの反映は未実装）

**根拠**: SignupSurvey.tsx `calculateScore` / `determineLevel` / `handleSubmit`、App.tsx `handleSurveyComplete` と `useState<Progress>` 初期値、Onboarding.tsx（未import）

**問題**
- レベル判定が学習経路に接続されていない。誰が何点でも開始ノードは html-010。
- Onboarding.tsx が重複デッドコードで、閾値が食い違ったまま放置。
- SignupSurvey は `saveProfile` を import するが呼ばない（コメントで「For now, we'll just complete the survey」）。診断結果はサーバに保存されない。

---

## 2. 個別ルート生成ロジックの所在と内容

**実態**
- 「ルート生成関数」は存在しない。ルートに相当するものは3つ:
  1. `progress.recommendedStartNodeIds` — App.tsx 初期stateの固定値 `['html-010']`。生成ロジックなし。
  2. `src/domain/mvpScope.ts` の `MVP_NODE_IDS`（html-000〜css-060 の12件の固定配列）。全ユーザー共通の静的カタログ。整合性チェック（prerequisite がMVP外を指していないか）だけ行う。
  3. Dashboard.tsx `checkPrerequisites`（前提ノード完了チェック）と LearningModule.tsx `getNextNodes`（前提を満たす未完了ノードを最大3件返す）— これは決定的なフィルタであり、ユーザー特性（level/levelScore）は入力に含まれない。

```tsx
// LearningModule.tsx getNextNodes — 完了集合のみで決まる決定的フィルタ
const prerequisitesMet = node.prerequisites.every(prereq => completedNodeIds.includes(prereq))
```

- Dashboard の推奨ルート見出しは「あなたの推奨ルート（スコア算出）」「あなたのレベル（…）とスコア（…点）に基づいて、最適な学習経路を提案しています」と表示するが、**実際は固定値の表示であり、level/levelScore は表示文言に埋め込まれるだけで選定計算に使われない。**

**実装状態**: モック（見出し文言のみ個別化を主張。実体はハードコードの固定ルート＋前提条件フィルタ）

**根拠**: App.tsx 初期state、mvpScope.ts `MVP_NODE_IDS`、Dashboard.tsx `getRecommendedNodes`（`recommendedStartNodeIds.includes(node.id)` の単純フィルタ）

**問題**: 「スコア算出」と明示的にUIで主張しているのに算出ロジックが存在しない。監査上もっとも重い「見せかけ」箇所。

---

## 3. 学習結果（クイズ・実践課題）によるルート更新

**実態**
- **なし。** `handleQuizComplete(score)` は `quizScores` に点数を追記するだけ。`handlePracticeComplete()` は引数なしで、完了ノード追加・totalHours+2・streak+1 のみ。`recommendedStartNodeIds` はどのハンドラでも書き換えられない。
- Quiz 側は70%未満で「復習する」ボタン（`onReturnToLearning` → 同じ learning フェーズへ戻る）を出すだけで、ノード選定には影響しない。
- PracticeChallenge 内のエラーベース推奨（後述）は**コンポーネント内で完結**し、`onComplete` にエラー情報を渡さないため App の progress（errorHistory / detectedErrors）に反映されない。

```tsx
// App.tsx — practice 完了時、エラー情報は受け取らない
const handlePracticeComplete = () => {
  setProgress(prev => ({ ...prev, completedNodeIds: ..., totalHours: prev.totalHours + 2, currentStreak: prev.currentStreak + 1 }))
```

**実装状態**: 未実装（スコア記録のみ実装。ルートへのフィードバックループなし）

**根拠**: App.tsx `handleQuizComplete` / `handlePracticeComplete`、PracticeChallenge.tsx `onComplete: () => void` のシグネチャ

---

## 4. エラー履歴の記録と補習ノード提示（SRK）

**実態**
- PracticeChallenge.tsx `analyzeCode(currentCode)` が正規表現ベースでコードを解析し、Skill / Rule / Knowledge の3分類でエラーを検出（各最大3件表示）:
  - Skill: 閉じタグ欠落（→ `E_HTML_MISSING_CLOSING_TAG`）、CSSセミコロン抜け（→ `E_CSS_SYNTAX_MISSING_SEMICOLON`）、引用符不一致（エラーID対応なし）
  - Rule: `<ul>` 直下の非`<li>`（→ `E_HTML_INVALID_NESTING`）、DOCTYPE/html/head/body 欠落（エラーID対応なし）
  - Knowledge: h1複数・見出し階層（→ `E_HTML_HEADING_STRUCTURE`）、img alt欠落（→ `E_HTML_MISSING_REQUIRED_ATTR`）
- 検出時に `src/data/errorMappings` の `nodeRefs` から関連ノードIDを取得し、「この単元を復習する」ボタンで `onStartLearning(nodeId)` により該当学習ノードへ遷移できる。**補習ノード提示（その場限り）は動作する実装。**
- `getRecommendationsFromErrors()` は SRK優先度（knowledge > rule > skill）でソートし、`nodeRefs` の priority===1 を「次にやるべき復習」、priority>1 を「関連単元」として表示。`isMvpNodeId` でMVP範囲にフィルタ。
- ただし **エラーIDの再特定が「表示メッセージ文字列の includes 判定」で行われる**脆い実装:

```tsx
if (skillErrors.some(e => e.message.includes('閉じられていません'))) {
  detectedErrorIds.push('E_HTML_MISSING_CLOSING_TAG')
}
```

- **履歴の記録は未実装。** App.tsx の Progress に `errorHistory: ErrorHistoryItem[]`（errorId/count/lastOccurred）と `detectedErrors: string[]` が定義されているが、初期値 `[]` のまま**一度も書き込まれず、どこからも読まれない。** PracticeChallenge から App へエラーを渡す経路もない。
- なお `runCode()`（合否判定）は analyzeCode とは別系統の簡易チェック（h1/h2/ul/CSS有無）で、4項目以上で完了扱い。SRK分析結果は合否に影響しない。

**実装状態**: 部分実装（その場のSRK検出＋補習ノード提示は実装済み。エラー履歴の永続化・蓄積・後続利用は未実装＝スキーマだけ存在）

**根拠**: PracticeChallenge.tsx `analyzeCode` / `getRecommendationsFromErrors` / `runCode`、App.tsx `ErrorHistoryItem` / Progress初期値

---

## 5. 推奨理由の提示

**実態**
- Dashboard: 「あなたのレベル（{userData?.level}）とスコア（{userData?.levelScore}点）に基づいて…提案しています」— 変数を埋め込んだ**固定テンプレート文**。実際の選定は固定値なので理由として虚偽（項目2参照）。
- PracticeChallenge: エラーベース推奨は errorMappings の構造化データ（`srk`, `label`, `nodeRefs.priority`）から生成されており、「検出されたエラー」一覧＋SRKバッジ＋対応ノードという形で**根拠の構造化提示に近い**。ただし「なぜこのノードか」の説明文自体は生成されない（エラーラベルとノードの並置のみ）。
- LearningReflectionForm `generateRecommendations`: つまずき概念文字列の `includes('HTMLタグ')` 等のキーワード一致で**固定文言**を push する仕組み。構造化データ由来ではない。

**実装状態**: 部分実装（PracticeChallenge のみ構造化データ由来。Dashboard は固定文言で実態と乖離、Reflection は固定文言）

**根拠**: Dashboard.tsx 推奨ルートセクションのJSX、PracticeChallenge.tsx `recommendations` / `recommendNodeIds`、LearningReflectionForm.tsx `generateRecommendations`

---

## 6. 振り返り機能の入出力と保存先

**実態**
- 入力（LearningReflectionForm）: つまずいた概念チェックボックス（`allConcepts` 7項目のハードコード配列、ノード非依存）、自由記述 Textarea。
- 出力: `ReflectionData { nodeId, nodeName, date, struggledConcepts, reflection, quickTestResult, recommendations }` を `onComplete` で App へ渡す。**`quickTestResult: true` はコメント付きの仮値（常にtrue）**。理解度テストは存在しない。

```tsx
quickTestResult: true, // この時点では仮の値
```

- 保存先: App.tsx の `progress.reflections`（**Reactのメモリ内stateのみ**）。localStorage・サーバ保存なし。UIは「この振り返りデータは学習履歴に保存され、いつでも確認できます」と表示するがリロードで消える。
- 閲覧（LearningReflections）: 履歴一覧、つまずき概念の頻度集計（上位3）、「理解度テスト正答率」等の統計を表示。ただし quickTestResult が常にtrueなので正答率は常に100%。

**実装状態**: 部分実装（入力→state保存→閲覧のループは動くが、永続化なし・quickTestResultはダミー・概念リストは全ノード共通のハードコード）

**根拠**: LearningReflectionForm.tsx `handleSubmit` / `allConcepts`、App.tsx `handleReflectionComplete`、LearningReflections.tsx 統計ブロック

---

## 7. 評価用ログ（学習イベント記録）

**実態**
- **イベントログ基盤は存在しない。** 学習開始・スライド閲覧・解答・エラー検出・完了などのイベントは記録されない。localStorage 使用箇所ゼロ、analytics送信ゼロ。
- 唯一の記録は App.tsx の `progress` state（quizScores 追記、completedNodeIds 追記、totalHours+2/回、streak+1/回）と reflections。すべてメモリ内。
- サーバ通信は `src/utils/auth.ts` の signup / signin / saveProfile（Supabase Edge Function `make-server-f3d88633`）のみで、**saveProfile はどこからも呼ばれていない**（SignupSurvey が import するだけ）。学習データのサーバ送信は皆無。

**実装状態**: 未実装

**根拠**: App.tsx（localStorage/fetch なし）、utils/auth.ts、SignupSurvey.tsx の未使用 import と `handleSubmit` 内コメント

**問題**: 研究の評価（トレーサビリティ検証）に必要なログが一切残らない。totalHours は実測でなく「完了1回=2時間」の固定加算。

---

## 8. UIとドメインロジックの結合度

**実態**
- 分離されているもの（良い側）:
  - `src/domain/mvpScope.ts`: MVPノード集合の定義・整合性チェック・`isMvpNodeId`
  - `src/data/learningNodes`, `src/data/errorMappings`, `src/data/questionConfig`: カタログ/マッピング/質問定義
- コンポーネント内に埋め込まれているもの（悪い側、具体例）:
  - コード解析・SRK分類: PracticeChallenge.tsx `analyzeCode`（約150行の正規表現ロジックがUIコンポーネント内）
  - エラー→推奨ノード解決: PracticeChallenge.tsx `getRecommendationsFromErrors`（メッセージ文字列マッチで実装）
  - レベル判定: SignupSurvey.tsx `determineLevel` と Onboarding.tsx `determineLevel` に**重複実装かつ閾値不一致**（24/17/10 vs 7/5/>0）
  - 前提条件チェック: Dashboard.tsx `checkPrerequisites` と LearningModule.tsx `getNextNodes` に類似ロジックが重複
  - 課題定義・合否判定: PracticeChallenge.tsx 内の `challenge` 定数と `runCode`
  - 振り返り推奨生成: LearningReflectionForm.tsx `generateRecommendations`
  - クイズ問題: Quiz.tsx 内の `quizQuestions` 定数（データ層に出ていない）
  - 学習コンテンツ: LearningModule.tsx 内の `learningContent` 定数（同上）

**実装状態**: 部分実装（データカタログは分離済み、判定・推奨・採点ロジックはほぼ全てUI内）

---

## 9. ノードID・クイズID・課題IDの使用実態

**実態（コード中に現れる具体的ID文字列）**
- 学習ノードID: `html-000`, `html-010`, `html-020`, `html-021`, `html-022`, `html-031`, `html-040`, `css-000`, `css-010`, `css-011`, `css-020`, `css-060`（mvpScope.ts `MVP_NODE_IDS`。**プレフィックス+3桁数字**形式。ドット形式・slug形式ではない）
- エラーID: `E_HTML_MISSING_CLOSING_TAG`, `E_CSS_SYNTAX_MISSING_SEMICOLON`, `E_HTML_INVALID_NESTING`, `E_HTML_HEADING_STRUCTURE`, `E_HTML_MISSING_REQUIRED_ATTR`（PracticeChallenge.tsx。**E_ プレフィックスの大文字スネークケース**）
- 課題ID: `practice-profile-card`（PracticeChallenge.tsx `challenge.id`。**kebab-case slug**。1件のみ、参照もされない飾りに近い）
- クイズID: **存在しない。** Quiz.tsx の `quizQuestions` は無名の配列リテラルで、問題にも回答記録にもIDがない。
- 診断質問ID: `background`, `learning_goal`, `available_time`, `programming_experience`, `skill_errors`, `rule_confidence`, `knowledge_concept`, `error_handling`, `learning_anxiety`（questionConfig.ts。snake_case）
- App.tsx 初期stateにも `'html-000'`, `'html-010'` が直書き。

**実装状態**: 実装済み（ノード/エラーID体系は一貫）だがクイズIDは未実装

**問題**: クイズ・課題が固定1セットでノードIDと紐付いた出題テーブルがなく、「どのノードのどの問題を間違えたか」をトレースできない。

---

## 10. 状態管理と画面遷移、進捗の保持

**実態**
- 状態管理は App.tsx の `useState` 2つ（`userData`, `progress`）＋ `phase` のみ。Redux/Context/router なし。URLは変化しない（switch文による画面切替）。
- フロー: `auth` →（signup時）`survey` → `tutorial` → `dashboard` →（ノード選択）`learning` → `quiz`（70%以上で）→ `practice` → `reflection` → `dashboard`。派生遷移: dashboard → `completion` / `reflections`、practice内エラー推奨 → `learning`（onStartLearning）。signin時は survey/tutorial をスキップして直接 dashboard。
- **進捗はリロードで全消失**（永続化なし）。リロード後は `phase: 'auth'` に戻る。
- 初期 progress に**ダミー実績が混入**: `completedNodeIds: ['html-000']`, `currentStreak: 3`, `totalHours: 8`, `quizScores: [85, 92, 78]` — 新規ユーザーでも「3日連続・8時間・テスト3回」と表示される。

**実装状態**: 部分実装（遷移は実装済み、永続化は未実装、初期値はモック）

**根拠**: App.tsx `useState<Progress>` 初期値、switch(phase) レンダリング、Quiz.tsx `isPassed`（70%閾値）

---

## 11. モック・ダミー・未接続箇所の一覧

1. **Dashboard「あなたの推奨ルート（スコア算出）」** — 算出ロジックなし。固定 `['html-010']` の表示（最重要の見せかけ）。
2. **App.tsx 初期progress** — streak 3 / 8時間 / quizScores [85,92,78] / html-000完了済み、全てダミー。
3. **Progress.errorHistory / detectedErrors** — 型定義と初期値のみ。書き込み・読み出しゼロの未接続フィールド。
4. **SignupSurvey の saveProfile** — import されるが呼ばれない。診断結果はサーバ未保存。
5. **Onboarding.tsx** — App から未参照のデッドコード。SignupSurvey と閾値不一致の determineLevel を持つ。
6. **LearningModule の学習コンテンツ** — `learningContent` がHTML基礎の固定内容。**どのノードを選んでも同じ教材**（currentNodeName のヘッダ表示だけ変わる）。css-* ノードを開いてもHTML教材が出る。
7. **Quiz** — 3問固定（HTML基礎）。ノード非依存。タイトルも「確認テスト: HTMLの基礎」固定。
8. **PracticeChallenge のヘッダ進捗** — 「Lesson 3 / 10」「30%」がハードコード。ユーザー名も「学習者」固定。
9. **PracticeChallenge の課題** — `practice-profile-card` 1件固定。ノードごとの課題出し分けなし。
10. **LearningReflectionForm.quickTestResult** — 常に `true`（コメント「この時点では仮の値」）。LearningReflections の「理解度テスト正答率」は常に100%になる。
11. **LearningReflectionForm.allConcepts** — HTML基礎向け固定7項目。ノード非依存。
12. **Dashboard「今週の目標」** — 「CSSの基礎完了 65%」「1日30分学習 達成」がハードコード。
13. **Completion** — 修了証（PDFダウンロード/SNSシェアボタンに onClick なし）、ポートフォリオ3件ハードコード（2件は「制作予定」）、「上級コースを見る」等のボタンも未接続。
14. **totalHours の加算** — 実測でなく完了1回につき +2 固定。
15. **LearningModule の getNextNodes** — 計算されるが、描画側のJSXブロックが空（`{currentPhase === "input" && nextNodes.length > 0 && (<div ...>空</div>)}`）で表示されない未接続コード。
16. **UI文言の虚偽**: 「この振り返りデータは学習履歴に保存され、いつでも確認できます」（実際はリロードで消える）、「この内容は今後の復習提案と学習計画に活用されます」（活用ロジックなし）。
17. **Tutorial.tsx に文字化け** — 「作りま���ょう」（UTF-8破損、動作には無関係）。

---

## 総評（トレーサビリティ観点）

- 個別最適化を構成するはずのチェーン「診断 → ルート生成 → 学習 → 結果 → ルート更新」は**どの結合点も切れている**。診断はuserDataで止まり、ルートは固定、クイズ結果は配列追記のみ、エラーはコンポーネント内で消滅する。
- 唯一実体があるのは PracticeChallenge 内の SRK エラー検出 → errorMappings 経由の補習ノード提示（セッション内・単発）。これが研究主張に対応する唯一の動作部位。
- 評価に必要なログ・永続化は一切なく、現状のフロントエンドでは学習行動のトレースは不可能。
