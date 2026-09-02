# 実装状態

- 最新確認日: 2026-07-16
- 対象: `kai02221514/Weblearningtool`
- GitHub取得時点（2026-07-02）の`main`: `1a8efb5aa28a9ef08042a9e275cc171dccf8b6a2`
- 最新確認時点の`main`: `7029c8d236b20d09c05fdc38ed7501cbb690d1d5`
- 実装状態の最新有効基準コミット: `7029c8d236b20d09c05fdc38ed7501cbb690d1d5`
- 最新検証対象: KAI-15教材接続作業ブランチ（Draft PRレビュー段階、`main`未反映）
- 追加確認日: 2026-07-05
- KAI-20作業開始時点の`main`: `233f9ac6152bc587643134f67bcfeea50be69d37`
- KAI-21作業開始時点の`main`: `461dea5e7eca532eb077f0998a4b680945ba74c8`
- KAI-24監査指摘追加確認日: 2026-07-13
- KAI-24対象PR: PR #17（2026-07-12T18:22:11Zにmainへマージ済み）
- KAI-24対象base commit: `ee375b4a78915a2e760aaaef5f3c951f0ed390b6`
- KAI-24監査開始時head commit: `dbdf6b67db7933062c82f8cf392303b106997eed`（修正後headと最新CIはPR #17を正とする）
- KAI-24再現可能UIハーネスcommit: `bea03f8`
- KAI-24確認状態: 自動検証とブラウザ手動確認を実施済み。正本文書との内容一致は自動構造確認と9問の手動原文照合を区別して記録する。
- KAI-24 merge commit / main確認SHA: `e947b3ddd62528b915bee11ca2bea89ac4c635b9`
- KAI-24 main CI: workflow `Check`、run `29203744740`、merge commit対象、`success`（2026-07-12T18:22:13Z〜18:22:44Z）
- KAI-24 main確認結果: Node v20.17.0 / npm 11.4.2で`npm ci`、対象限定5テスト、typecheck、lint、全104テスト、build、verify、`git diff --check`に成功。`npm ci`ではNode engine警告とRecharts 2系deprecated警告が発生したが、後続検証は成功した。
- KAI-14実装確認日: 2026-07-14
- KAI-14確認状態: 14エラーを初回MVP 8件とMVP外6件へ型付きデータで区分し、実行可能な参照整合性をVitestで検証する。
- KAI-25作業開始日: 2026-07-15
- KAI-25作業開始時点の`main`: `1b99f49fb8d8377cc951de363d58589ad21463cc`
- KAI-25対象PR: PR #22（merge commit `b134f8c6fe2612821fd2285899711806724fb27e`でmain反映済み）
- KAI-25 main CI: workflow `Check`、push run `29354376730`、job `check`、`success`
- KAI-25確認状態: Linear上Done。`html-010`、`html-021`、`css-011`のノード固有実践課題を型付き定義へ分離し、限定自動判定と表示確認を区別する実装はmain上で再検証済みである。OQ-007の自動判定範囲は確定していない。

[注意] `1a8efb5aa28a9ef08042a9e275cc171dccf8b6a2`および`0f09e5b9f7ba500eaa2a2a8e33252c03d59410d4`は2026-07-02監査時点の旧スナップショットである。以下は2026-07-03に最新`main`を再確認した結果を含む。

## 技術構成の区分

|区分|構成|状態|
|---|---|---|
|現在のフロントエンド|Vite 6 + React 18 + TypeScript/TSX|[確認済み事実]|
|現在の認証・データ関連|Supabaseを利用する認証処理コード・保存用エンドポイント|[部分実装／手動確認済み] 接続先はVite環境変数へ移行済み。サインイン成功とDashboard到達は確認済み。一連の保存成功は未確認|
|現在のAPI関連|Hono依存関係およびSupabase Functions配下のサーバーコードあり|[部分実装／手動確認済み] Edge FunctionはSupabase CLI標準配置へ移行済み。`make-server-f3d88633`のデプロイと`/health` HTTP 200を確認済み|
|履修計画書上の構想|Next.js + Deno/Hono + Supabase|[確認済み事実] 旧計画または将来構想|
|全面移行|Next.jsへの移行|[確定事項] 現行MVP対象外|

## コード存在確認済み

以下はコードまたは静的データの存在を確認した項目であり、すべての動作検証が完了したことを意味しない。

- 認証、初期アンケート、チュートリアル、ダッシュボード、教材、確認テスト、実践課題、振り返り、修了画面のコンポーネント
- HTML 32件、CSS 31件の静的学習ノード候補
- MVP 12ノードの単一定義 `MVP_NODE_IDS` と絞込処理
- 正規MVP前提関係
- SRK区分と初回MVP適用範囲を含むエラーマッピングデータ
- MVP 8エラーの正規ノード参照と、MVP外6エラーの実行可能参照からの明示的除外
- エラーID集合、MVP区分、MVPノード参照、MVP外除外理由、ランタイム取得境界の参照整合性テスト
- 初期アンケートのスコアリングとレベル判定
- 予備試行用3ノードのノード別確認テスト表示と採点接続
- 予備試行用3ノード9問の型付きクイズカタログ（`src/features/quiz/`）
- 予備試行用クイズカタログの構造検証テスト
- 予備試行用3ノード9問を対象にしたUI非依存の採点・許容解正規化純粋関数
- 予備試行用3ノード（`html-010`、`html-021`、`css-011`）のQuiz UI接続
- 予備試行用3ノードの研究者レビュー済み・予備試行前教材案を保持する型付き教材カタログとresolver（`src/features/material/`）
- `LearningModule`の対象3ノード別教材表示、および未対応ノードで別教材へフォールバックせず完了導線を出さない表示
- 予備試行用3ノードのノード固有実践課題、初期コード、学習目標、完了条件、許容条件、想定エラー対応（`src/features/practice/`）
- 対象3ノードの実践課題UI接続と、未対応ノードで汎用課題へフォールバックしない表示
- 実践課題カタログ、確認テスト参照、MVPエラーマッピング、限定判定の自動テスト
- 簡易文字列・正規表現ベースの一部エラー検出
- `practice-profile-card` のメタデータ
- 振り返り入力と簡易推薦文
- Supabaseを利用するサインアップ・サインイン処理のコード
- Supabase Edge Function `make-server-f3d88633` の標準配置（`supabase/functions/make-server-f3d88633`）

## 部分実装

- 推奨ノード表示: Dashboardは `recommendedStartNodeIds` の固定値（現状 `html-010`）を表示する。正規IDと前提判定は使うが、診断結果に基づく統合ルート生成結果ではない。
- ルート生成: 到達可能候補の抽出相当はあるが、順序、優先順位、理由情報、版管理がない。
- エラー検出: 8エラー中、閉じタグ、入れ子、必須属性、見出し、CSS構文の一部を検出。セレクタ不一致、ボックスモデル、リソースパスは未実装。
- エラーマッピング: MVP 8エラーは正規MVPノードだけを実行可能な`nodeRefs`として保持する。MVP外6エラーは将来候補として定義を保持するが、`nodeRefs`を空配列とし、初回MVP対象外理由を必須化した。ランタイムのMVP推薦取得関数はMVP外エラーを返さない。これは新規エラー検出や`routeGenerator`の実装を意味しない。
- 進捗: `completedNodeIds` に統一したが、デモ初期値・メモリ保持である。
- 診断: レベル判定はあるが、開始ノード規則へ接続されていない。
- プロファイル保存: 保存用エンドポイントは存在するが、サインアップ後の初期アンケートフローから実保存されることを確認できていない。
- Supabase接続: 旧Project Reference IDがフロントエンド設定に残っていたため、現在の接続先は `VITE_SUPABASE_URL` と `VITE_SUPABASE_PUBLISHABLE_KEY` で指定する構成へ変更した。Publishable keyは `apikey` ヘッダーで送信し、ユーザーJWTのみ `Authorization: Bearer` で送信する。Supabaseプロジェクトへの接続先修正は完了し、サインインの実環境成功を確認済みである。
- Edge Function: 旧 `src/supabase/functions/server` 配置から `supabase/functions/make-server-f3d88633` へ移行した。内部Honoルートは `/health`、`/signup`、`/signin`、`/profile` とし、Function名の二重化を避ける。対象プロジェクトへデプロイ済みで、認証APIへ到達できる状態を確認済みである。
- サインアップ後セッション: `admin.createUser` はセッションを返さないため、サインアップ成功後は未認証のままアンケートへ進めず、ログイン画面へ戻してログインを促す。
- 予備試行用確認テストデータ: `html-010`、`html-021`、`css-011` の3ノード9問を `src/features/quiz/` 配下の型付きデータへ変換し、ID、版、形式、出典参照、参照整合性の構造検証テストを追加した。
- KAI-22採点・正規化: `src/features/quiz/grading.ts` に、短いコード補完回答の正規化、単一問題の採点、クイズ全体の採点、提出入力の実装上の検証を行う純粋関数を追加した。実行時のコード補完判定は各問題の`acceptedAnswers`と`answerNormalization`を使用し、`researchMetadata.acceptedAnswerDecision`は説明・追跡情報として扱う。
- KAI-21 Quiz UI接続: `src/components/Quiz.tsx` は `progress.currentNodeId` から渡されたノードIDを使い、`src/features/quiz/` の型付きクイズカタログを表示する。回答はquestionId単位で保持し、単一選択はchoice ID、短いコード補完は文字列として `QuizSubmission` へ変換したうえで、KAI-22の `gradeQuizSubmission` へ採点を委譲する。未対応ノードは固定問題へフォールバックせず、未対応状態を表示する。
- KAI-24統合検証: `src/features/quiz/pilotQuizIntegration.test.ts` に、対象3ノードについてUI回答状態、提出変換、採点、D-020境界値、試行追加、再受験可否、合格後試行拒否を横断する統合テストを追加した。これは検証証跡であり、問題内容、許容解、合格基準、再受験規則、保存仕様は変更していない。
- KAI-25実践課題: `src/features/practice/`に対象3ノード固有の課題定義とUI非依存の限定判定関数を追加した。課題は研究者レビュー済みの`docs/content/pilot-material-draft.md`と対象9問の概念・用語の範囲内に限定する。見た目・意味の妥当性は表示確認とし、AI評価や高精度HTML/CSS解析は行わない。想定エラーはKAI-14の既存MVP 8件・MVP外6件の境界を再利用し、対応IDがないDOCTYPE等の配置誤りは新規IDを作らず`unsupported`として保持する。
- KAI-15教材接続: `docs/content/pilot-material-draft.md`の対象3ノード教材案を`src/features/material/`の型付きデータへ分離し、`currentNodeId`から`LearningModule`へ接続した。教材、確認テスト、実践課題は同じ正規MVPノードIDを使用する。未対応ノードは固定HTML教材や別ノード教材へフォールバックせず、学習完了コールバックを実行できない。`App`ではノードIDを`LearningModule`のkeyに使い、ノード切替時にフェーズ、タブ、スライド位置を初期化する。原稿参照元、原稿節、レビュー状態、状態注記は型付き教材データに追跡情報として保持するが、通常の学習画面には表示しない。これはDraft PRレビュー段階の実装状態であり、`main`反映、教材の指導教員承認、本実験用教材の最終確定、予備試行実施を意味しない。

## 2026-07-03手動確認

### 認証状態

- [確認済み事実] Supabaseプロジェクトへの接続先修正が完了した。
- [確認済み事実] Edge Functionがデプロイされ、`/health`と認証APIへ到達できる状態になった。
- [確認済み事実] サインインが実環境で成功した。
- [確認済み事実] 認証後にDashboardへ到達できた。
- [未確認] 認証状態のリロード後復元は確認していない。現行コード上もReact state中心であり、完成済みとは扱わない。
- [未確認] プロフィール保存は、実際の保存成功を確認していない。`saveProfile`と`/profile`は存在するが、初期アンケート完了フローからの確実な接続は確認できていない。

### Dashboard手動確認

- [確認済み事実] Dashboard上で「開発中の固定ルート」が表示された。
- [確認済み事実] 「診断結果に基づく個別ルート生成は未実装」と表示された。
- [確認済み事実] 固定ルートの開始ノードへ遷移できた。
- [確認済み事実] `recommendedStartNodeIds`は固定値であり、現状は`html-010`を使用している。
- [確認済み事実] P-02は表示是正の手動確認まで完了した。
- [注意] 個別ルート生成機能が完成したわけではない。

### アンケート未経由問題

#### 確認済み事実

- サインイン成功後は、初期アンケート完了状態を確認せずDashboardへ直接遷移する。
- 診断回答が未保存または未確認でも固定ルートを開始できる。
- 現在のDashboard推薦は固定値であり、診断結果には依存していない。

#### 未実装

- 初期アンケート完了状態の保存。
- アンケート完了状態の復元。
- 未回答ユーザーをアンケートへ誘導する制御。
- 診断未回答時の開始ルート規則。
- 診断回答とユーザープロファイル保存の確実な接続。
- 診断結果とルート生成の接続。

#### 影響

- OQ-004の開始ノード規則を実装する前提が不足している。
- 将来の個別ルート生成では、診断未回答ユーザーの扱いを定義する必要がある。
- 現行動作を研究仕様として確定してはならない。

## 未実装

- MVP 12ノード全体の固有教材UI接続（KAI-15のDraft PRでは予備試行対象3ノードだけを扱う）
- MVP 12ノード全体のノード対応済み確認テストデータ `quiz-{nodeId}`（予備試行用3ノード9問の型付きデータ化のみ追加済み）
- MVP 12ノード全体の再受験処理・試行履歴管理（KAI-23で予備試行用3ノードのメモリ内制御のみ追加済み）
- MVP 12ノード全体の実践課題（KAI-25は予備試行対象3ノードだけを扱う）
- 診断・進捗・テスト・エラー・振り返りを統合する `routeGenerator`
- 推薦理由の構造化形式、根拠参照、ルート版・データ版
- 学習進捗、テスト、実践、エラー、振り返り、ルート履歴の永続化・復元
- サインアップ後の自動セッション作成
- 初期アンケート完了時の `saveProfile` 接続
- ページ更新時の認証セッション復元
- 評価用事前・事後アンケートまたは外部フォームとの運用接続
- 評価に必要なログ取得・分析可能形式での出力
- 比較条件を含む評価フロー
- `routeGenerator`、永続化、評価ログまで含むID参照、前提循環、決定性、順序の自動テスト

## モック・研究上の注意

- 画面が存在しても、正規データと研究仕様へ接続されていない場合は「実装済み」とみなさない。
- デモ進捗・固定推薦はモックまたは仮実装である。
- 型付きクイズカタログ、UI非依存の採点・正規化関数、KAI-21のQuiz UI接続、KAI-23のメモリ内再受験制御が存在しても、永続的な受験履歴保存、同意、評価ログ、予備試行はまだ完了していない。
- P-02対応としてDashboard上の固定推薦表示を明示し、診断結果から算出済みと誤認させる文言を修正した。これは表示是正のみであり、個別ルート生成機能の実装ではない。
- 簡易エラー検出を汎用HTML/CSS解析器として説明しない。
- KAI-25の課題完了は、対象構造の限定自動判定合格に加えて、既存の全`display-only`条件を学習者がプレビューで目視し明示確認した場合にだけ可能とする。表示確認を自動判定済みと扱わず、本実験用課題の最終確定やOQ-007の解消を意味しない。

## 検証状態

- コード状態の最新対象コミット: `b134f8c6fe2612821fd2285899711806724fb27e`
- 最新検証済み`main`: `b134f8c6fe2612821fd2285899711806724fb27e`
- `npm run build`: [確認済み] 2026-07-02、Supabase接続復旧後に成功（Vite CJS deprecation warningあり）
- Supabase Edge Function deploy: [確認済み] `make-server-f3d88633`が対象プロジェクトでACTIVEとして確認済み
- Health endpoint: [確認済み] `https://znfwkrhquegvlcmugkoe.supabase.co/functions/v1/make-server-f3d88633/health` がHTTP 200を返すことを確認済み
- OPTIONS: [確認済み] `make-server-f3d88633`へのOPTIONSがHTTP 204を返すことを確認済み
- サインアップ・サインイン: [部分確認済み] サインイン成功を実環境で確認済み。サインアップ成功は今回の手動確認対象としては明記しない
- Dashboardの手動確認: [確認済み] 認証後にDashboardへ到達し、固定ルート表示と個別ルート生成未実装表示を確認済み
- 固定ルート遷移: [確認済み] 固定ルートの開始ノードへ遷移できることを確認済み
- アンケート未経由: [確認済み] サインイン成功後、初期アンケート完了状態を確認せずDashboardへ直接遷移することを確認済み
- 自動テスト: [部分確認済み] PR #5で `typecheck`、`lint`、`test`、`build`、`check` スクリプトとGitHub Actionsによる `npm run check` を導入済み。PR #6ではMVPノード定義と予備試行用クイズカタログの構造検証テストのみを追加・修正した。
- KAI-22自動検証: [確認済み] 2026-07-06に `npm ci`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check` を実行し成功した。`npm run test`では3ファイル67件が成功した。`npm ci`ではNode 20.10.0に対して一部依存がNode 22以上を要求する警告が出たが、インストール自体は成功した。
- KAI-21自動検証: [確認済み] 2026-07-06に `npm ci`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check` を実行し成功した。`npm run test`では4ファイル75件が成功した。`npm ci`ではNode 20.17.0に対して一部依存がNode 22以上等を要求する`EBADENGINE`警告が出たが、インストール自体は成功した。
- KAI-23自動検証: [確認済み] PR #12を2026-07-09に`main`へマージした後、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`を実行し成功した。`npm run test`では5ファイル99件が成功した。メモリ内の試行結果モデル、再受験可否、合格後の試行追加拒否、不正日時・時刻逆転・`attemptId`重複拒否、対象3ノードと採点関数の整合を単体テストで確認した。永続化、同意、評価ログ、KAI-24の統合検証は未実施である。
- KAI-24統合検証: [確認済み] 2026-07-09に `npm ci`、`npm run test -- src/features/quiz/pilotQuizIntegration.test.ts`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check` を実行し成功した。`npm run test`では6ファイル104件が成功した。対象3ノードについて、UI回答状態から提出、採点、試行追加、再受験制御までを横断して確認した。ブラウザ手動確認では、初回合格、不合格後再受験、回答初期化、試行番号増加、D-020代表境界値、合格後再受験導線なし、実践課題イベント、未対応ノード表示を確認した。初回PR head `dbdf6b67db7933062c82f8cf392303b106997eed`のGitHub Actions `check`はrun `29202826108`で成功した。
- KAI-24最新main再検証: [確認済み] 2026-07-13にmain `ee375b4a78915a2e760aaaef5f3c951f0ed390b6`へrebase後、対象限定テスト、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run verify`、`git diff --check`を実行し成功した。ブラウザでは対象3ノードの固有問題、3/3・2/3合格、1/3不合格、不合格後の回答初期化と試行2、D-020代表境界、合格後再受験導線なし、未対応ノード表示、コンソールwarn/errorなしを再確認した。
- KAI-24 main反映後検証: [確認済み] PR #17をmerge commit方式でmainへ反映し、merge commit `e947b3ddd62528b915bee11ca2bea89ac4c635b9`上でローカル検証とGitHub Actions run `29203744740`が成功した。再現可能な非プロダクションUIハーネス`manual/kai-24/index.html`もmainに存在する。KAI-24の技術的統合検証は完了したが、保存、同意、評価ログ、研究データ利用、予備試行は未実施である。
- KAI-25ローカル検証: [確認済み] 対象限定10テスト、`npm run typecheck`、`npm run lint`、全9ファイル121テスト、`npm run build`、`npm run verify`、`git diff --check`に成功した。`npm install`ではNode 20.10.0に対する既存依存の`EBADENGINE`警告が出たが、依存修復と後続検証は成功した。
- KAI-25ブラウザ確認: [確認済み] 非プロダクションハーネス`manual/kai-25/index.html`で、対象3ノードの固有タイトル・初期コード・修正後完了導線を確認した。プレビューで`html-010`の本文、`html-021`の`p > strong`、`css-011`の青色・20pxを確認した。`html-000`はエディタを表示せず未対応状態を表示し、汎用課題へフォールバックしない。コンソールwarning/errorは0件だった。
- KAI-25本番build境界: [確認済み] 手動ハーネスは通常の`src/main.tsx`から参照せず、`npm run build`の出力は通常entryの`index.html`とそのassetsだけであり、`manual/kai-25/`は本番bundleへ混入していない。
- KAI-25監査修正: [確認済み] 2026-07-15に、限定自動判定と表示確認を組み合わせる完了ゲート、コード変更・初期状態復帰時の確認解除、`html-010`のhead/body直下兄弟構造、`html-021`の直接の`p > strong`構造、`css-011`のstyle要素内p規則へ限定した判定を確認した。対象限定3ファイル18件、全10ファイル129件、typecheck、lint、build、verify、`git diff --check`に成功した。ブラウザでは代表解、誤受理ケース、表示確認前後、状態解除、CSS上書き境界、未対応ノード、console warning/errorなしを確認した。PR段階のGitHub Actions証跡は次項に記録し、main push runとは分離する。
- KAI-25 PR段階検証: [確認済み] PR head `cd56ce91e54f450dc41de661f476d0c3f7e4b68f`に対するrun `29353631105`はPR merge-refを検証した`pull_request`段階の`Check/check`で`success`だった。main push runとは分離して扱う。
- KAI-25 main反映後検証: [確認済み] PR #22をmerge commit `b134f8c6fe2612821fd2285899711806724fb27e`としてmainへ反映後、同一SHAで`npm ci`、対象限定3ファイル18件、`npm run verify`（typecheck、lint、全10ファイル129件、build）、`git diff --check`に成功した。ブラウザでは3ノードの代表解、表示確認前後、誤受理境界、コード変更・初期状態復帰時の解除、CSS上書き境界、未対応`html-000`、console warning/error 0件、通常buildへのハーネス非混入を確認した。main pushのworkflow `Check` / job `check`はrun `29354376730`で`success`だった。KAI-25はLinear上Doneだが、保存、同意、評価ログ、研究データ利用、予備試行、KAI-15全体は未完了である。
- KAI-15教材接続ローカル検証: [確認済み] 2026-07-16の監査修正後に、教材単体1ファイル6件、教材・クイズ・実践課題の対象限定9ファイル124件、`npm run typecheck`、`npm run lint`、全11ファイル135件、`npm run build`、`npm run verify`を実行し成功した。原稿と実装の表示対象内容を順序込みで照合し、段落、list item、code block、table rowの欠落が不一致になることもテストで確認した。非プロダクションハーネス`manual/kai-15/index.html`では、対象3ノードの固有教材と相互非混在、通常学習画面でのレビュー状態・状態注記・原稿パス・原稿節の非表示、未対応`html-000`の開始・完了導線なしと完了コールバック未実行、ノード切替後の導入フェーズ・スライド先頭・既定タブへの初期化、`html-010`の固有確認テストと固有実践課題への遷移を確認した。console warning/errorは0件で、通常buildには手動ハーネスが混入していない。
- KAI-15監査修正前PR段階検証: [確認済み] PR head `6ce5dda42a2a6c49c6ce48e84bc0cb61876f15ec`に対し、ActionsがcheckoutしたPR merge-refは`b920b2558c0f0f8c517ee464eb0be27086535b87`だった。`pull_request`のworkflow `Check` / job `check` / run `29476756109`は`success`であり、PR head SHAとcheckout対象のmerge-ref SHAは別の証跡として扱う。
- KAI-15監査修正後PR段階検証方針: 監査修正後の最新PR head SHA、Actions checkout PR merge-ref SHA、workflow、job、run ID、conclusion、annotationは、commitによる自己参照ループを避けるためPR #24本文とLinear KAI-15コメントを監査証跡とする。`main`反映後の最終SHAとmain push runは、main反映後の同期作業で本書へ固定する。現時点はDraft PR段階かつ`main`未反映であり、教材の指導教員承認、本実験用教材の最終確定、予備試行実施を意味しない。
- セッション復元: [未確認] リロード後の認証状態復元は確認していない
- プロフィール保存: [未確認] 実際の保存成功は確認していない

[注意] 本書で「コード存在確認済み」とした項目は、コードまたは定義の存在確認に基づく。動作・受入条件の検証完了後にのみ「実装済み」へ変更する。

## 次の最小作業単位

1. OQ-004、OQ-005、OQ-006は初期仕様として解消済みである。
2. 研究判断ゲートとしてKAI-12 / OQ-009を解消し、研究データ管理、同意、保存、削除、アクセス権限、評価ログを確定する。
3. KAI-13はLinear上Backlogであり、独立実装候補として扱う場合もCI必須化タイミングを確認した範囲だけ進める。
4. KAI-14はDoneでPR #20がmainへ反映済みである。KAI-25はDoneでPR #22がmainへ反映済み・main再検証済みである。ただしKAI-15全体、MVP 12ノード全体、個別ルートモデルは完了していない。
5. 予備試行は関連準備と研究者判断を確認した後に実施する。

[注意] Phase 3は仕様確定作業であり、未確定の診断重み、ルート生成優先順位、確認テスト閾値、保存項目を実装上の既定値で補完してはならない。
