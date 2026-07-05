# テスト実行メモ

## 対象

- 現行構成: Vite + React + TypeScript
- 今回の追加対象: 予備試行用3ノード9問の型付きクイズカタログ
- 検証範囲: クイズ件数、ID、版情報、問題形式、選択肢、正答参照、関連前提ノードID

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

## 今回の検証対象外

- UI接続、採点、許容解正規化、再受験、保存処理は検証対象外とする。
- ブラウザでのQuiz UI動作確認は、今回UI接続を実装していないため対象外。
