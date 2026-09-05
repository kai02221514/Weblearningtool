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
