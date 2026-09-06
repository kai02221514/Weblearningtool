# テスト実行メモ

## 対象

- 現行構成: Vite + React + TypeScript
- 今回の追加対象: 予備試行用3ノード9問の型付きクイズカタログ、KAI-22のUI非依存採点・許容解正規化純粋関数、KAI-23のメモリ内再受験制御、KAI-24の予備試行前統合検証
- KAI-25追加対象: 予備試行対象3ノードの型付き実践課題、限定判定、表示確認の完了ゲート、既存エラーマッピング参照、未対応ノード表示
- 検証範囲: クイズ件数、ID、版情報、問題形式、選択肢、正答参照、関連前提ノードID、D-020許容解、正規化、単一選択採点、クイズ全体採点、UI回答状態からの提出変換、試行追加、再受験可否、実装上の入力検証、実践課題と教材・クイズ・MVPエラー境界の参照整合、限定自動判定と表示確認を組み合わせた完了条件

## 実行コマンド

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run check
```

## テスト基盤

- `vitest` を使用する。
- 理由: Vite構成と整合し、PR #5で `test` スクリプトと依存関係が導入済みであるため。
- PR #5で `typecheck`、`lint`、`test`、`build`、`check` スクリプトとGitHub Actionsの `npm run check` 実行を導入した。
- PR #6では、予備試行用3ノード9問の型付きデータと構造検証テストのみを追加・修正する。
- KAI-22では、`src/features/quiz/grading.test.ts`でD-020の許容解・不許容例、0/3〜3/3の合否境界、未回答・余剰questionId・重複questionId・別quiz questionId・不正quizIdを検証する。入力異常の扱いは研究仕様の新規判断ではなく、採点結果へ黙って混入させないための実装上の入力検証である。
- KAI-24では、`src/features/quiz/pilotQuizIntegration.test.ts`で対象3ノードについて、UI回答状態、`QuizSubmission`、採点、試行追加、再受験可否、合格後試行拒否、未対応ノードのフォールバックなしを横断検証する。

## KAI-22検証結果

- 実行日: 2026-07-06
- 実行コマンド: `npm ci`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check`
- 結果: すべて成功。`npm run test` は3ファイル67件成功。
- 注意: `npm ci` ではNode 20.10.0に対して一部依存がNode 22以上を要求する警告が出た。インストールと後続検証は成功した。

## KAI-24検証結果

- 実行日: 2026-07-09
- 実行済みコマンド: `npm ci`、`npm run test -- src/features/quiz/pilotQuizIntegration.test.ts`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check`
- 結果: すべて成功。`npm run test` は6ファイル104件成功。
- 注意: `npm ci`ではNode v20.17.0に対する`EBADENGINE`警告が出た。インストールと後続検証は成功したため、KAI-24起因の阻害要因ではない。
- 2026-07-09ブラウザ確認: 当時の一時ハーネスで対象3ノードの初回合格、不合格後再受験、回答初期化、試行番号増加、D-020代表境界値、合格後再受験導線なし、実践課題イベント、未対応ノード表示を確認した。この一時ハーネスは残していないが、監査指摘対応で同等目的の再利用可能ハーネスを追加した。
- PR #17 main反映: 2026-07-12T18:22:11Zにmerge commit `e947b3ddd62528b915bee11ca2bea89ac4c635b9`として`main`へ反映済みである。
- main再検証: 2026-07-13にmain `e947b3ddd62528b915bee11ca2bea89ac4c635b9`で`npm ci`、対象限定5件、全104件、typecheck、lint、build、verify、`git diff --check`に成功した。`npm ci`ではNode v20.17.0に対する`EBADENGINE`警告と`recharts@2.15.4`の非推奨警告が出たが、後続検証は成功した。ブラウザ確認結果はPR #17でmainへ反映された検証文書を参照する。
- 再現可能なUI確認: `npm run dev -- --host 127.0.0.1`を実行し、`http://127.0.0.1:3000/manual/kai-24/`を開く。`manual/kai-24/index.html`から非プロダクションentry `src/manual/kai24QuizHarness.tsx`だけを読み込み、通常の`src/main.tsx`からは参照しない。ノード選択で対象3ノードと`html-000`を切り替える。詳細な操作ケースと期待結果は`docs/research/kai-24-pilot-quiz-integration-verification.md`を参照する。
- GitHub Actions: merge commit `e947b3ddd62528b915bee11ca2bea89ac4c635b9`に対するworkflow `Check` / job `check`はrun `29203744740`（2026-07-12T18:22:13Z開始、同18:22:44Z完了）で成功した。URLは `https://github.com/kai02221514/Weblearningtool/actions/runs/29203744740`。

## 今回の検証対象外

- Supabase保存、同意取得、評価ログ、研究データ利用、予備試行そのものはKAI-24の検証対象外とする。
- KAI-24では再現可能な非プロダクションハーネスでQuiz UI動作確認を実施し、保存済み履歴ではなくメモリ内状態として記録する。ハーネスは認証情報を持たず、研究データを外部送信しない。

## KAI-25検証結果

- 実行日: 2026-07-15
- 対象限定: `npm run test -- src/features/practice/pilotPracticeChallenges.test.ts src/features/practice/evaluatePractice.test.ts`で2ファイル10件成功。
- 全体: `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run verify`、`git diff --check`に成功。全体テストは9ファイル121件成功。
- 依存修復: 初回テストは`@rollup/rollup-darwin-x64`欠落で起動前に失敗したため、依存定義を追加せず`npm install`を実行した。Node 20.10.0に対する既存依存の`EBADENGINE`警告は出たが、後続検証は成功した。
- ブラウザ: `npm run dev -- --host 127.0.0.1`を実行し、`http://127.0.0.1:3000/manual/kai-25/`で対象3ノードの固有課題、初期コード、限定判定、完了導線、プレビューを確認した。`html-000`では未対応表示となり、汎用課題へフォールバックしない。コンソールwarning/errorは0件。
- 表示確認: `html-010`は本文「こんにちは」、`html-021`は`p > strong`の「重要」、`css-011`は段落の`rgb(0, 0, 255)`と`20px`を確認した。
- build境界: `manual/kai-25/index.html`は非プロダクションentry `src/manual/kai25PracticeHarness.tsx`だけを読み、通常の`src/main.tsx`から参照しない。`npm run build`の出力は通常entryの`index.html`とassetsだけであり、手動ハーネスは本番bundleへ混入していない。
- 対象外: 保存、同意、評価ログ、研究データ利用、routeGenerator、予備試行、12ノード展開、OQ-007の確定は検証・実装していない。

## KAI-25監査修正の検証結果

- 実行日: 2026-07-15
- 対象限定: `npm run test -- src/features/practice/evaluatePractice.test.ts src/features/practice/practiceCompletionGate.test.ts src/features/practice/pilotPracticeChallenges.test.ts`で3ファイル18件成功。
- 全体: `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run verify`、`git diff --check`を実行し成功。全体テストは10ファイル129件成功。
- 誤受理回帰: `html-010`のbody-in-head/head-in-body、`html-021`の交差タグと`p > span > strong`、`css-011`のstyle外CSS文字列を不合格として確認した。3ノードの代表解とCSSの宣言順序・空白差は合格する。
- 完了ゲート: 限定自動判定合格だけでは完了不可、既存の全`display-only`条件を学習者が明示確認した場合だけ完了可とする純粋関数を自動テストした。コード変更と初期状態へのリセットでは評価結果と表示確認状態を解除する。
- CSS上書き境界: 後続の`p { color: red; }`がある場合も限定自動判定は合格し得るが、表示確認前は完了不可である。CSSカスケード全体は自動解析しない。
- ブラウザ: `manual/kai-25/index.html`で3ノードの代表解、誤受理ケース、表示確認前後の完了ボタン、コード変更・リセットによる確認解除、未対応`html-000`を確認した。`css-011`代表解のcomputed styleは`rgb(0, 0, 255)` / `20px`、コンソールwarning/errorは0件だった。
- build境界: `npm run build`の出力は通常entryの`index.html`とassetsだけで、KAI-25手動ハーネスは本番bundleへ混入していない。
- CI証跡の記録規則: PR head SHA、base SHA、merge-base SHA、ActionsがcheckoutしたPR merge-ref SHAを別項目として記録する。PR merge-refを検証するActions runについて、head SHAを「Actions対象SHA」とだけ記載しない。
- 当時の未確認事項: 監査修正後コミットに対するGitHub Actions証跡とPRマージ後のmain上検証は、この時点では未実施だった。その後、PR段階run `29353631105`と下記のmain push run `29354376730`を分離して確認し、main反映後検証で解消した。

## KAI-25 main反映後検証結果

- 実行日: 2026-07-15
- 対象PR: PR #22（`https://github.com/kai02221514/Weblearningtool/pull/22`、2026-07-14T17:34:59Zマージ）
- PR head SHA: `cd56ce91e54f450dc41de661f476d0c3f7e4b68f`
- merge commit SHA / 検証対象main SHA: `b134f8c6fe2612821fd2285899711806724fb27e`
- コミット境界: `origin/main`、ローカル作業開始SHA、作業ブランチ作成時SHAはすべて`b134f8c6fe2612821fd2285899711806724fb27e`で一致した。PR #22 merge commitは`origin/main`に含まれ、文書変更前の`origin/main...HEAD`差分は`0 0`だった。
- 検証環境: Node `v20.17.0`、npm `11.4.2`
- `npm ci`: 成功。396 packagesを導入した。`EBADENGINE`警告は6パッケージ（`@supabase/auth-js`、`@supabase/functions-js`、`@supabase/postgrest-js`、`@supabase/realtime-js`、`@supabase/storage-js`、`eslint-visitor-keys`）、deprecated警告は`recharts@2.15.4`の1件だった。audit警告の出力はなく、`package-lock.json`の変更もなかった。
- 対象限定テスト: `npm run test -- src/features/practice/evaluatePractice.test.ts src/features/practice/practiceCompletionGate.test.ts src/features/practice/pilotPracticeChallenges.test.ts`を実行し、3ファイル18件成功した。
- 全体検証: `npm run verify`が`npm run check`を介してtypecheck、lint、test、buildを実行し、すべて成功した。全体テストは10ファイル129件成功、buildは通常entryの`build/index.html`とassetsを生成した。
- `git diff --check`: 文書変更前のmain同一コミット上で成功した。
- ブラウザ手動確認: `npm run dev -- --host 127.0.0.1`で`http://127.0.0.1:3000/manual/kai-25/`を確認した。
  - `html-010`: 代表解が限定自動判定に合格し、表示確認前は完了不可、表示確認後のみ完了可能だった。body-in-headとhead-in-bodyは不合格だった。表示確認後のコード変更と初期状態復帰の双方で確認状態が解除された。
  - `html-021`: 直接の`p > strong`は合格し、`p > span > strong`と交差タグは不合格だった。表示確認前は完了不可だった。
  - `css-011`: 代表解が限定自動判定に合格し、computed styleは`rgb(0, 0, 255)` / `20px`だった。style要素外のCSS文字列は不合格だった。後続の`p { color: red; }`を含むケースは限定自動判定後も表示確認前は完了不可であり、最終表示が要件を満たすかは学習者の明示確認なしに完了扱いしない境界を確認した。
  - 未対応`html-000`: エディタ0件、完了ボタン0件で、未対応表示となり汎用課題へフォールバックしなかった。
  - ブラウザコンソールwarning/error: 0件。
- build境界: `manual/kai-25/index.html`は非プロダクションentryを使用し、`npm run build`の出力に`manual/kai-25/`ハーネスは混入しなかった。
- main push Actions: 対象SHA `b134f8c6fe2612821fd2285899711806724fb27e`、event `push`、workflow `Check`、run `29354376730`、job `check`、status `completed`、conclusion `success`、2026-07-14T17:35:02Z開始・17:35:32Z更新、`https://github.com/kai02221514/Weblearningtool/actions/runs/29354376730`。`Set up job`、`Checkout`、`Setup Node`、`Install dependencies`、`Run checks`、`Post Setup Node`、`Post Checkout`、`Complete job`の全stepがsuccessだった。annotationはActionsのNode.js 20非推奨warning 1件で、KAI-25起因の失敗ではない。
- PR段階runとの区別: run `29353631105`はPR #22のmerge-refを検証した`pull_request`段階の`Check/check`であり、上記main push run `29354376730`とは別証跡として扱う。
- 未確認事項: なし（このmain反映後検証の受入項目に限る）。
- 対象外: 保存、同意、評価ログ、研究データ利用、routeGenerator、予備試行、MVP 12ノード全体への展開、本実験用課題の最終化、OQ-007/OQ-009の研究判断。KAI-25の完了はKAI-15全体、個別ルートモデル、予備試行の完了を意味しない。

## KAI-28 main反映後検証結果

- 実行日: 2026-09-06
- 対象PR: PR #34（`https://github.com/kai02221514/Weblearningtool/pull/34`、2026-09-05T16:36:45Zマージ）
- PR境界: 最終headは`bfa3e239df6a7b9c00135dde773a0b74f20ad31b`、PR段階Actions checkout merge-refは`dfa490f64b96a4e98e290a6271ec956dcc341913`、merge commit / main検証対象SHAは`38782ebb55b0e37f98592d110b26d2afce20dd1d`である
- PR段階Actions: `pull_request` workflow `Check` / run `33977438869`と`Supabase Diagnosis` / run `33977438906`はいずれも`success`だった。PR headとcheckout merge-refは別証跡として扱う
- main同期: `origin/main`とローカル`main`がmerge commit `38782ebb55b0e37f98592d110b26d2afce20dd1d`で一致し、PR最終headを祖先として含むことを確認した
- 検証環境: Node `v20.17.0`、npm `11.4.2`、Supabase CLI `2.65.5`
- `npm ci`: 成功。444 packagesを導入した。Supabase client libraries 5件と`eslint-visitor-keys`の`EBADENGINE`、`whatwg-encoding`と`recharts@2.15.4`のdeprecated警告が出たが、後続検証は成功した。Node.js 22移行と依存関係の包括更新は本作業の対象外である
- UI統合テスト: `npm run test -- src/App.test.tsx`で1 file / 5 testsが成功した。取得中のDashboard非表示、未診断・非互換時のSurvey誘導、取得再試行と互換record復元、保存失敗時の全回答保持・同一K群再送、保存成功応答をrouteGeneratorへ渡したDashboard表示を確認した
- 全体検証: `npm run verify`がtypecheck、lint、全19 files / 210 tests、build 1724 modules transformedを実行し、すべて成功した。`git diff --check`も成功した
- ローカルSupabase: main merge commitの隔離worktreeと別ポートの合成データ専用local projectを使用した。フル構成の初回`supabase db reset --local --no-seed`はmigration適用後、未使用Storageの再起動ヘルス確認で502となったため、この実行は失敗として記録する。診断APIに不要なサービスを除外して再実行した同コマンドは正常終了し、`supabase test db`は1 file / 24 tests、`supabase db lint --local --fail-on error`はschema error 0件、`npm run test:diagnosis-api`は合成利用者A/Bで成功し、最後に当該local projectを停止した
- main push Actions: merge commitを対象とする`push` workflow `Check` / job `check` / run `33978411853`（`https://github.com/kai02221514/Weblearningtool/actions/runs/33978411853`）は`success`だった
- main手動Supabase Actions: 同じmerge commitをmain refとして実行した`workflow_dispatch` workflow `Supabase Diagnosis` / job `diagnosis-integration` / run `33978478230`（`https://github.com/kai02221514/Weblearningtool/actions/runs/33978478230`）は`success`だった。フル構成でlocal start、DB reset、pgTAP、DB lint、合成利用者A/Bの診断API統合、常時stopを含む全stepが成功した
- Actions警告: 2つのmainジョブはいずれも`actions/checkout@v4`と`actions/setup-node@v4`に対するNode.js 20非推奨annotation 1件があった。機能検証は成功しており、Node.js 22移行とActions major更新は別Issue候補として本作業では変更していない
- 未確認事項: remote Supabaseへのmigration・Edge Function deploy・動作確認、browser reload時のsession自動復元、remote advisors、参加者データ・実在個人情報を用いた確認
- 対象外: 同意、保持期間、撤回、削除、研究者用取得・削除・export、診断以外の永続化、評価ログ、回答履歴、S群・A群・`level`・`levelScore`の保存、KAI-12/KAI-16の完了、新しい研究判断

## KAI-32 Draft PR local検証

- 実行日: 2026-09-06
- 対象: Draft PR #42、branch `feat/kai-32-profiles-display-name`
- 環境: Node `v20.17.0`、npm `11.4.2`、Supabase CLI `2.65.5`、合成データ専用local Supabase
- 再現入口: `supabase db reset --local --no-seed`、`supabase test db`、`supabase db lint --local --fail-on error`、`npm run test:diagnosis-api`、`npm run test:profile-api`、`npm run verify`、`git diff --check`
- 結果: fresh reset成功、pgTAP 2 files / 71 tests成功、schema error 0件、診断API/profile API統合成功、typecheck・lint・全20 files / 227 tests・build 1726 modules成功、差分check成功
- profile API統合: 合成利用者A/Bで正常signup、trim、1/50文字、51文字、空白、改行、制御文字、日本語・Unicode、本人read/update、他人・anon拒否、DELETE・保護列拒否、profile欠損signin拒否、Auth削除CASCADE、trigger失敗時のAuth/profile不存在、同email再試行を確認した
- ブラウザ: 通常entryのアカウント作成画面で「表示名（ニックネーム可）」、`required`、`maxlength=50`、空白のみの明示エラーを確認した
- 失敗履歴: full local構成の初回resetはmigration適用後に未使用Storageのhealth check 502で失敗した。localだけStorageを無効化して成功し、一時設定は差分へ残していない。pgTAPの4引数matcherと、権限のないtrigger無効化を使ったAPIテスト初案も修正し、fresh resetから全検証を再実行した
- 当時の境界: remote Supabase、remote secret、実在個人情報、研究参加者データは不使用。初回local検証後のCI・監査・指摘対応は次節へ追記する。merge・main再検証は未実施で、legacy `profile:{id}`全面撤去はKAI-33へ残す

## KAI-32 Draft PR #42監査指摘対応

- 初回CIと監査: head `bb2d598057c96566fec0bfb3ffdf3ebb395a2962`の`Check` run `34030858409`と`Supabase Diagnosis` run `34030858406`は成功したが、2026-09-06監査でDBのASCII space限定`btrim`とJavaScript `trim()`の差、および`service_role`権限のdefault privileges依存が要修正となった
- 修正commit: `1aac38fd240a4842094fe8d6def0556123ae3db9`。ECMAScript WhiteSpaceとLineTerminatorのtrim集合をDB制約へ明示し、table/function権限を全roleからrevokeして必要なGRANTだけを再付与した
- 対象validator: `npm run test -- src/domain/profile.test.ts`は1 file / 18 tests成功。NBSP、U+3000、U+FEFF、内部Unicode空白、C1制御文字を追加確認した
- fresh local DB: `supabase db reset --local --no-seed`成功。`supabase test db`は2 files / 94 tests成功。`supabase db lint --local --fail-on error`はschema error 0件
- pgTAP境界: ASCII space、NBSP、U+3000、U+FEFFの未正規化UPDATE、NBSPの未正規化INSERT、51文字、改行、C0/C1を拒否し、1/50文字、内部空白、日本語・絵文字を許可した。`public`、`anon`、`authenticated`、`service_role`のtable/column権限と3 trigger関数のEXECUTE拒否をRLSとは別に確認した
- API統合: `npm run test:profile-api`成功。Edge APIはASCII space、NBSP、U+3000、U+FEFFをtrimして保存・返却し、本人Data API直接PATCHは同じ未正規化値を400で拒否、その後のsigninはDB正本の正規化済み表示名で成功した。`npm run test:diagnosis-api`も成功した
- 全体: `npm run verify`でtypecheck、lint、全20 files / 232 tests、build 1726 modulesに成功。`git diff --check`も成功した
- 修正commit CI: `Check` run `34032015077`と`Supabase Diagnosis` run `34032015105`はsuccess。後者はstart、fresh reset、pgTAP、DB lint、診断API、profile API、stopを含む全stepに成功した
- 境界: 合成データだけを使用し、remote Supabase、remote secret、実在個人情報、研究参加者データは不使用。legacy `profile:{id}`、Actions Node.js 20警告、表示名変更UIは対象外。Draft・未マージ、再監査待ちで、main再検証は未実施

## KAI-32 main反映後検証結果

- 実行日: 2026-09-06
- 対象PR: PR #42。最終head `525d969866e12892cfdec2997b7833c1edf20e45`、base `7906f32778251b13cff0a6a6c6560209ec55cb37`、PR段階merge-ref `153eb01b0ca83ff4e585fe9ace19fc9e3db17830`、2026-09-06T12:42:45Zマージ、merge commit / main検証対象SHA `9b73e4010da4dc7d6e8c5305696a08fb9a015ff8`
- PR段階Actions: `Check` run [34032277250](https://github.com/kai02221514/Weblearningtool/actions/runs/34032277250)と`Supabase Diagnosis` run [34032277253](https://github.com/kai02221514/Weblearningtool/actions/runs/34032277253)は、どちらもmerge-ref `153eb01b0ca83ff4e585fe9ace19fc9e3db17830`をcheckoutして全step成功した
- main同期: `origin/main`がPR最終headを祖先として含み、clean worktreeをmerge commit `9b73e4010da4dc7d6e8c5305696a08fb9a015ff8`へ固定した
- 検証環境: Node `v20.10.0`、npm `10.2.3`、Supabase CLI `2.65.5`
- 依存導入: `npm ci`は384 packagesを導入して成功した。Supabase client libraries 5件と`eslint-visitor-keys`の既存`EBADENGINE`、`whatwg-encoding`と`recharts@2.15.4`のdeprecated警告が出たが、lockfileや依存定義は変更せず後続検証は成功した
- 全体検証: `npm run verify`でtypecheck、lint、全20 files / 232 tests、build 1726 modules transformedに成功した。`git diff --check`も成功した
- local Supabase失敗履歴: 最初の`supabase start`は既存の別projectが既定DBポート54322を使用中のため失敗した。既存projectは停止せず、検証専用projectを別ポートへ分離した。その後の最初の`supabase db reset --local --no-seed`はmigration適用後、未使用Storageの再起動health check 502で失敗した。いずれも成功扱いしない
- local Supabase成功結果: 検証専用projectだけStorageを一時無効化して再起動し、fresh `supabase db reset --local --no-seed`に成功した。`supabase test db`は2 files / 94 tests、`supabase db lint --local --fail-on error`はschema error 0件、`npm run test:diagnosis-api`と`npm run test:profile-api`は合成利用者A/Bで成功した。最後にproject ID `weblearningtool-kai32-main-9b73e40`のlocal projectだけを停止した。一時ポート・Storage設定は成果物へ含めていない
- main push Actions: `push` workflow `Check` / run [34033921358](https://github.com/kai02221514/Weblearningtool/actions/runs/34033921358)は、対象・checkoutともmerge commit `9b73e4010da4dc7d6e8c5305696a08fb9a015ff8`で、全step成功した
- main手動Supabase Actions: 同じSHAの`main` refで手動起動した`workflow_dispatch` workflow `Supabase Diagnosis` / run [34034224612](https://github.com/kai02221514/Weblearningtool/actions/runs/34034224612)は、対象・checkoutとも同merge commitで、start、fresh reset、pgTAP、DB lint、診断/profile API、stopを含む全stepに成功した
- Actions警告: mainの両runには`actions/checkout@v4`と`actions/setup-node@v4`のNode.js 20非推奨annotationがある。機能検証は成功しており、Actions major更新は別Issue候補として本作業では変更していない
- remote境界: remote Supabaseへの接続、migration適用、Function deploy、設定変更、remote secretの使用はない。実在個人情報・研究参加者データを使用していない
- KAI-33へ残す範囲: legacy `profile:{id}` API・frontend helper・型・利用箇所の全面撤去、KV table・不要GRANT・重複indexの撤去候補、D-022診断migrationとprofiles migrationを含むlocal/remote差分、適用順、rollback、KAI-34向け検証計画
- KAI-33開始ゲート: 本完了証跡文書PRの監査・merge、merge後main Check、Linear KAI-32への両merge commit・main検証・CI・対象外・remote未変更を含む完了コメント、Linear Done、remote未変更をすべて確認し、その時点の`origin/main`を開始基準SHAとする
