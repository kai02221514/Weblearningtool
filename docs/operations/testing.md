# テスト実行メモ

## 対象

- 現行構成: Vite + React + TypeScript
- 今回の追加対象: 予備試行用3ノード9問の型付きクイズカタログ、KAI-22のUI非依存採点・許容解正規化純粋関数
- 検証範囲: クイズ件数、ID、版情報、問題形式、選択肢、正答参照、関連前提ノードID、D-020許容解、正規化、単一選択採点、クイズ全体採点、実装上の入力検証

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

## KAI-22検証結果

- 実行日: 2026-07-06
- 実行コマンド: `npm ci`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run check`、`npm run verify`、`git diff --check`
- 結果: すべて成功。`npm run test` は3ファイル67件成功。
- 注意: `npm ci` ではNode 20.10.0に対して一部依存がNode 22以上を要求する警告が出た。インストールと後続検証は成功した。

## 今回の検証対象外

- UI接続、再受験、保存処理は検証対象外とする。
- ブラウザでのQuiz UI動作確認は、今回UI接続を実装していないため対象外。
