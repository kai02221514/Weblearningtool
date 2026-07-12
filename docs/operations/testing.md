# テスト実行メモ

## 対象

- 現行構成: Vite + React + TypeScript
- 今回の追加対象: 予備試行用3ノード9問の型付きクイズカタログ、KAI-22のUI非依存採点・許容解正規化純粋関数、KAI-23のメモリ内再受験制御、KAI-24の予備試行前統合検証
- 検証範囲: クイズ件数、ID、版情報、問題形式、選択肢、正答参照、関連前提ノードID、D-020許容解、正規化、単一選択採点、クイズ全体採点、UI回答状態からの提出変換、試行追加、再受験可否、実装上の入力検証

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
- 最新main再検証: 2026-07-13にmain `ee375b4a78915a2e760aaaef5f3c951f0ed390b6`へrebaseし、対象限定5件、全104件、typecheck、lint、build、verify、`git diff --check`に成功した。ブラウザでも対象3ノード、合否境界、再受験、D-020代表境界、未対応ノード、コンソールwarn/errorなしを再確認した。
- 再現可能なUI確認: `npm run dev -- --host 127.0.0.1`を実行し、`http://127.0.0.1:3000/manual/kai-24/`を開く。`manual/kai-24/index.html`から非プロダクションentry `src/manual/kai24QuizHarness.tsx`だけを読み込み、通常の`src/main.tsx`からは参照しない。ノード選択で対象3ノードと`html-000`を切り替える。詳細な操作ケースと期待結果は`docs/research/kai-24-pilot-quiz-integration-verification.md`を参照する。
- GitHub Actions: 初回PR head `dbdf6b67db7933062c82f8cf392303b106997eed`のworkflow `Check` / job `check`はrun `29202826108`で成功した。監査修正後headの最新結果はPR #17を正本とする。

## 今回の検証対象外

- Supabase保存、同意取得、評価ログ、研究データ利用、予備試行そのものはKAI-24の検証対象外とする。
- KAI-24では再現可能な非プロダクションハーネスでQuiz UI動作確認を実施し、保存済み履歴ではなくメモリ内状態として記録する。ハーネスは認証情報を持たず、研究データを外部送信しない。
