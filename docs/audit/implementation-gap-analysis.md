# 実装ギャップ分析(implementation-gap-analysis)

- 監査基準(対象SHA・確認範囲・確認不能事項・検証記録): `00-audit-scope.md` 参照
- 監査日: 2026-07-02
- 対象: kai02221514/Weblearningtool `main` @ `16d2f93`(src/ は 0f09e5b/2026-06-18 から変更なし)。コード変更なし、読み取りのみ。
- 指摘の採否はPhase 2.5で研究者本人が決定する(`phase2.5-handover.md`)。
- 実装状態の定義(research/01準拠): **実装済み**=正規データで動作し受入条件の検証が通った状態 / **部分実装**=コードは動くが仕様の一部のみ / **モック**=動くように見えるが実体が固定値・見せかけ / **未実装**=存在しない。
- 詳細根拠(コード引用付き)は付録 notes/02-frontend.md, 03-domain-data.md, 04-auth-persistence.md, 05-test-infra.md を参照。

## 0. 総括: 個別化チェーンはすべての結合点で切れている

研究の中核チェーン「診断 → ルート生成 → 学習 → 結果 → ルート更新」の現状:

```
診断(SignupSurvey)     : スコア算出・レベル判定は動作 ──┐ userDataに保存されるだけ
                                                        ✂ 切断
ルート生成              : 存在しない。recommendedStartNodeIds は App.tsx 初期値 ['html-010'] 固定
                                                        ✂ 切断
学習(教材/クイズ/課題)  : 全12ノードで同一のHTML基礎教材・同一の固定3問クイズ
                                                        ✂ 切断
結果 → ルート更新       : handleQuizComplete はスコア追記のみ。エラーは
                          PracticeChallenge 内で消滅(App の errorHistory は一度も書き込まれない)
                                                        ✂ 切断
永続化・評価ログ        : ゼロ。全状態が useState のみ、リロードで全消失
```

唯一実体があるのは **PracticeChallenge 内の SRK エラー検出 → errorMappings 経由の補習ノード提示(セッション内・単発)**。これが研究主張(RQ2)に対応する唯一の動作部位である。

## 1. 監査対象別ギャップ

### 1.1 診断入力と開始ノード決定

- 仕様: 初期診断の結果を開始ノードまたは初期ルートの決定に利用する[確定]。規則はOQ-004[未確定]。
- 実装: SignupSurvey.tsx が questionConfig.ts の9問で重み付きスコアを計算し `determineLevel`(閾値24/17/10)でレベル判定。**結果は userData に保存されるだけで、開始ノードには一切反映されない**。`recommendedStartNodeIds: ['html-010']` は初期stateのハードコードで、どのハンドラも書き換えない。
- 状態: **部分実装**(診断UI・スコア算出は動作、接続は未実装)
- 付随問題: Onboarding.tsx は App から import されないデッドコードで、閾値が SignupSurvey と不一致(7/5/>0 vs 24/17/10)。SignupSurvey は `saveProfile` を import するが呼ばない(回答はサーバ未送信)。

### 1.2 個別ルート生成

- 仕様: MVP12ノード内・完了除外・前提補完・根拠追跡可能[確定]、優先順位・出力契約はOQ-005[未確定]。
- 実装: **ルート生成関数は存在しない**。あるのは (a) 固定値 `['html-010']`、(b) mvpScope.ts の静的12ノード集合、(c) Dashboard/LearningModule の前提充足フィルタ(決定的だがユーザー特性を入力に取らない)。
- 状態: **モック**。Dashboard は「あなたの推奨ルート(スコア算出)」「レベルとスコアに基づいて最適な学習経路を提案しています」と表示するが算出ロジックが存在しない。**本監査で最も重い見せかけ表示**であり、評価実験でこのまま被験者に提示すると虚偽説明になる(倫理リスク、risk-register RSK-02)。

### 1.3 学習結果によるルート更新

- 仕様: 進捗・テスト・エラー・振り返りをルート判断の入力源とする[確定]、変換規則は暫定〜未確定。
- 実装: **未実装**。`handleQuizComplete(score)` は quizScores 追記のみ。`handlePracticeComplete()` は引数なしで完了フラグ・totalHours+2(固定加算)・streak+1 のみ。PracticeChallenge の `onComplete: () => void` はエラー情報を親に渡せないシグネチャ。

### 1.4 エラー履歴と補習ノード

- 仕様: E_形式ID、SRK三層、エラー→関連ノード→復習提示[確定]。履歴保存(回数・時刻・解消状態)は implementation-plan Phase 3。
- 実装: **部分実装**。analyzeCode(正規表現、UIコンポーネント内約150行)が5種のエラーID(E_HTML_MISSING_CLOSING_TAG / E_CSS_SYNTAX_MISSING_SEMICOLON / E_HTML_INVALID_NESTING / E_HTML_HEADING_STRUCTURE / E_HTML_MISSING_REQUIRED_ATTR)を検出し、errorMappings の nodeRefs から復習ノードを提示・遷移できる。仕様8エラー中3種(E_CSS_SELECTOR_NO_MATCH / E_LAYOUT_BOX_MODEL_MISUNDERSTANDING / E_RUNTIME_RESOURCE_PATH)は検出未実装。
- 重大な脆さ: エラーIDの再特定が**表示メッセージ文字列の `includes('閉じられていません')` 判定**で行われており、文言変更で個別化が壊れる。
- 履歴: App.tsx の `errorHistory` / `detectedErrors` は**型定義と初期値`[]`のみで一度も書き込まれない未接続スキーマ**。

### 1.5 ドメインデータの整合性(機械検証済み)

適合(検証スクリプトは notes/03 付録):
- learningNodes.ts 全63ノードのID形式 100% 適合、重複なし。前提グラフは参照切れ0・循環0。
- MVP12ノード(HTML7+CSS5)は mvpScope.ts で定義され、前提が12ノード内で完全に閉じる。モジュールロード時ガード(throw)でコード強制もされている。
- エラーID形式 14/14 適合、全件にSRK分類あり。practice-profile-card 実在、targetNodeIds 10件は全てMVPノードで型強制(`satisfies readonly MvpNodeId[]`)。

不適合:
- **errorMappings.ts の nodeRefs 27件中15件(6エラー分)が非正規ドット形式ID(例: `css.cascade.specificity`)で全件参照切れ**。旧ID体系の移行取り残し。PracticeChallenge は `isMvpNodeId` フィルタで黙って捨てるため、該当エラーでは復習提示が空になる(フェイルサイレント)。現状の検出5種は有効参照を持つため実害は潜在的だが、検出範囲を広げた瞬間に顕在化する。
- **quiz-{nodeId} 体系が未実装**。確認テストは Quiz.tsx ハードコードの無名3問(ノード非依存・ID なし)。docs/mvp-scope.md の quiz ID 一覧に対応するデータが存在しない。誤答とノードを紐付けるトレースが不可能。
- **ノード別教材が存在しない**。learningNodes.ts は id/title/summary/prerequisites/type/tags のみで教材本文フィールドなし。LearningModule.tsx は `currentNodeId` を受け取るが教材切替に使わず、css ノードを開いてもHTML入門が表示される(12ノード中実質1ノード分の教材)。
- questionConfig の二重管理: .json は不正JSON(パース不能)かつ未参照のデッドファイル。実体は .ts のみ。
- **Dashboard と PracticeChallenge の両方**が存在しないフィールド `node.category`(空表示)・`node.difficulty`(常にundefined→フォールバックで**「上級」相当と誤表示**)を参照[最終照合でDashboard.tsx側も確認済み]。難易度フィールド自体がデータにないため、レベル判定とノードを難易度で対応付ける根拠データがない。
- 色指定の独立ノード css-041 がカタログに残存(MVP外のため実害は小、仕様の字義に反する)。

### 1.6 推奨理由(説明可能性)

- 仕様: 入力事実・適用規則・推薦ノードの関係を追跡可能に[確定]。機械可読な理由情報[暫定]。
- 実装: **部分実装**。PracticeChallenge のエラーベース推奨のみ構造化データ(srk / nodeRefs.priority / reason)由来。Dashboard の「理由」は実態と乖離した固定テンプレート文(1.2参照)。LearningReflectionForm の推奨はキーワード一致の固定文言。reasonCode / routeVersion / dataVersion に相当する構造は存在しない。

### 1.7 振り返り

- 仕様: 理解状態・つまずき・行動計画[確定]。選択式のみルート反映[暫定、OQ-008]。正規ノードID付き保存(旧spec案)。
- 実装: **部分実装**。入力→state保存→閲覧のループは動作するが、(a) つまずき選択肢は全ノード共通のハードコード7項目(ノードID非対応の概念名文字列)、(b) `quickTestResult: true` 固定(コメント「仮の値」)のため閲覧画面の「理解度テスト正答率」は常に100%、(c) 保存はメモリ内のみでUI文言「学習履歴に保存され、いつでも確認できます」は事実に反する、(d) ルート生成への反映なし。

### 1.8 評価用ログ

- 仕様: research/05 補助指標[暫定]、旧evaluation-plan「保存すべきデータ」(詳細案)、OQ-009未確定。
- 実装: **未実装**。イベントログ基盤ゼロ。localStorage 使用ゼロ、学習データのサーバ送信ゼロ。totalHours は「完了1回=+2時間」の固定加算で実測なし。サーバ側も `logger(console.log)` のみ。**現状では評価実験を実施してもデータが1件も残らない**。

### 1.9 認証・進捗保存・Supabase

- 実装: signup/signin は実際に Supabase Auth に到達する**部分実装**(Edge Function `make-server-f3d88633` の4エンドポイント: health/signup/signin/profile)。
- 未接続・未実装:
  - セッション維持なし(accessToken は state のみ、リロードで即ログアウト。ログアウト機能もなし)。
  - サインアップ直後はトークン未取得のまま学習フローに入るため、認可付きAPIを呼べない。
  - `POST /profile` はサーバ実装済み・トークン検証付きだが**フロントから一度も呼ばれない(未接続)**。saveProfile の ProfileData 型(age/occupation/pace/level/levelScore)と questionConfig ベースの回答項目にスキーマ不整合もある。
  - 進捗・クイズ・エラー履歴・振り返り・イベントログ・同意・GET系・削除のAPIは**フロント/サーバ双方に存在しない**。
- セキュリティ・倫理:
  - `src/utils/supabase/info.tsx` に projectId と anon key が公開リポジトリに平文ハードコード。anon key 自体は公開前提だが、**`kv_store_f3d88633` テーブルの RLS 有効化がコードから確認できない**(SQL/マイグレーションなし)。無効なら PostgREST 経由で全ユーザーの email・name・profile が第三者に読み書き可能。**ダッシュボードでの即時確認が必要(本監査の範囲では未検証)**。
  - 同意取得UIが皆無。氏名・メール・年齢・職業・learning_anxiety(準センシティブ)を収集する設計に対し、研究同意・撤回導線・削除機能がない。
  - signup は `admin.createUser` + `email_confirm: true`、レート制限なし、CORS `origin: "*"`。PII を Auth と KV に二重保存。
  - service role key は環境変数経由で分離されており、クライアント露出はない(この点は適切)。

### 1.10 テスト・型検査・Lint・CI

- 実装: **すべて欠落**(全93ファイルをAPIで確認、truncated:false)。
  - テストファイル0件。テストフレームワーク依存なし。scripts は `dev` / `build` の2つのみ。
  - **tsconfig.json がなく、typescript パッケージ自体が devDependencies にない**。vite(SWC/esbuild)は型を削除するだけで検査しないため、「TypeScriptだが型検査は一度も実行できない」状態。
  - ESLint/Prettier 設定なし。`.github/` 自体が存在せずCIゼロ。
  - main 直コミット運用(全コミット親1つ・PR痕跡なし・ブランチ保護なし)。プロジェクト原則「mainへ直接変更しない」と運用が不一致。
  - 再現性: `.gitignore` が `/package-lock.json` を除外、`clsx`/`hono`/`tailwind-merge` が `"*"` 指定、`"name": "Web Learning Tool"` は npm 命名規則違反で `npm install` が失敗する環境がある。**ビルド再現性が個人環境依存**。

### 1.11 UIとドメインロジックの結合

- 分離済み(良): src/domain/mvpScope.ts(純モジュール・即テスト可能)、src/data/ のカタログ3種。
- UI埋没(悪): analyzeCode(PracticeChallenge内約150行)、determineLevel(SignupSurvey内、未export。Onboardingに閾値不一致の重複)、checkPrerequisites(Dashboard内)と getNextNodes(LearningModule内)の類似重複、ノード状態分類(DashboardのJSX内即時実行関数)、クイズ問題・教材本文・課題定義・振り返り推奨(各コンポーネント内定数)。
- 評価: 切り出しの障害は構造ではなく未着手であること。determineLevel と前提チェックは引数化すれば数行で domain へ移せる。ルート生成は切り出しではなく新規実装が必要。

## 2. モック・見せかけ一覧(実装済みと区別すべきもの)

| # | 箇所 | 実態 |
|---|---|---|
| M-1 | Dashboard「あなたの推奨ルート(スコア算出)」 | 算出ロジックなし。固定 `['html-010']`(最重要) |
| M-2 | App.tsx 初期progress | streak 3・8時間・quizScores [85,92,78]・html-000完了済みのダミー実績が新規ユーザーに表示される |
| M-3 | Progress.errorHistory / detectedErrors | 書き込み・読み出しゼロの未接続スキーマ |
| M-4 | SignupSurvey の saveProfile | import のみ・未呼出(コメントで先送りを明言) |
| M-5 | Onboarding.tsx | 未参照デッドコード、閾値不一致 |
| M-6 | LearningModule 教材 | 全ノード同一のHTML基礎固定コンテンツ |
| M-7 | Quiz | 固定3問・ノード非依存・IDなし |
| M-8 | PracticeChallenge ヘッダ | 「Lesson 3/10」「30%」「学習者」ハードコード |
| M-9 | quickTestResult: true | 仮値固定 → 振り返り統計の正答率常に100% |
| M-10 | Dashboard「今週の目標」 | ハードコード |
| M-11 | Completion | 修了証DL/SNSシェア/上級コース等のボタン未接続、ポートフォリオはダミー |
| M-12 | totalHours | 完了1回=+2時間の固定加算 |
| M-13 | UI文言 | 「学習履歴に保存されます」「今後の復習提案に活用されます」が事実に反する |
| M-14 | questionConfig.json | 不正JSONの未参照デッドファイル |
| M-15 | LearningModule getNextNodes | 計算されるが描画JSXが空で表示されない |

## 3. 研究上の未確定事項と実装問題の分離

- **研究者が決めないと進めない(実装問題ではない)**: OQ-004(診断→開始ノード規則)、OQ-005(ルート生成契約。旧spec案の採否含む)、OQ-002/003(比較実験・対象者)、OQ-006(テスト設計)、OQ-008(振り返り反映範囲)、OQ-009(保存項目・保持期間)、評価計画の正の宣言(C-2)、教材のノード別整備の範囲。
- **決定済み仕様に対する純粋な実装問題(いま直せる)**: errorMappings の参照切れ15件、questionConfig.json 削除、Onboarding デッドコード削除、モック初期値の分離、Dashboard の虚偽文言修正、node.category/difficulty 参照バグ、テスト・型検査基盤の導入、diagnosis→userData→開始ノードの配線(規則はOQ-004待ちでも、接続点の準備は可能)、進捗の最小永続化。
