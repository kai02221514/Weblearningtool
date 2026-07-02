# 個別ルート提示学習モデル

## 構成

1. 診断
2. 学習者状態の初期化
3. 開始ノード・初期ルート生成
4. インプット
5. 確認テスト
6. 実践課題
7. エラー分類・復習提示
8. 振り返り
9. 状態更新・次ルート生成

## 入力

- 診断: 既有知識、経験、学習可能時間、学習ペース、不安等
- 進捗: 完了ノード、現在ノード
- 確認テスト: 得点、合否、誤答
- 実践課題: コード、達成要件、検出エラー
- 振り返り: 自信、難易度、つまずき、次回行動

## 状態

```text
LearnerState
- diagnosisResult
- completedNodeIds
- quizAttempts
- practiceAttempts
- errorHistory
- reflections
- currentRoute
- routeVersion
```

## ルート生成の必須規則

- [確定事項] MVP 12ノードだけを候補とする。
- [確定事項] 完了済みノードを通常の新規推薦から除外する。
- [確定事項] 前提未完了ノードを直接推薦しない。必要時は前提ノードを補完する。
- [暫定仕様] 不合格テストは対象ノードまたは関連前提を復習候補にする。
- [暫定仕様] エラーの主推薦を補助推薦より優先する。
- [暫定仕様] 振り返りで選択されたつまずきを関連ノードへ変換する。
- [未確定] 診断、テスト、エラー、振り返りが競合した場合の優先順位。

## 出力契約

```ts
interface RouteResult {
  routeId: string;
  routeVersion: string;
  generatedAt: string;
  recommendedNodeIds: string[];
  reasons: Array<{
    nodeId: string;
    source: 'diagnosis' | 'prerequisite' | 'quiz' | 'error' | 'reflection' | 'progress';
    reasonCode: string;
    evidenceRef?: string;
    priority: number;
  }>;
}
```

## 説明可能性

各推薦は、入力事実、適用規則、推薦ノードを追跡できなければならない。自然言語説明だけでなく、機械可読な `reasonCode` と `evidenceRef` を保存する。

## SRK分類

- Skill: タイピングミス、手順抜け等の操作・技能上の誤り
- Rule: 構文・記述規則の誤適用
- Knowledge: HTML/CSSの役割や概念理解の不足

[注意] SRK分類は診断名ではなく、MVP内で復習支援を整理するための分類枠組みである。
