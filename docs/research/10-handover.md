# AI引継ぎ手順

## リポジトリ情報

- Repository: `kai02221514/Weblearningtool`
- Default branch: `main`
- GitHub取得時点（2026-07-02）の`main`: `1a8efb5aa28a9ef08042a9e275cc171dccf8b6a2`
- 最新確認時点（2026-07-03）の`main`: `42c298ca2f1ed084121de0decb3df18be590a9eb`
- 実装状態の基準コミット: `42c298ca2f1ed084121de0decb3df18be590a9eb`
- 参照日: 2026-07-03

[注意] `1a8efb5...`と`0f09e5...`は2026-07-02監査時点の旧スナップショットである。`42c298c...`は2026-07-03に再確認した最新`main`である。新規担当者は作業開始時にさらに最新`main`との差分を確認する。

## 現在地

- 状態: Phase 2およびPhase 2.5正式完了
- 次Phase: Phase 3 中核仕様確定支援
- Phase 2独立再監査: 完了。記録は`docs/audit/phase2-independent-review.md`。
- Linear移管: 完了。保存先はLinear `Kai02221514` / `WebLearningTool`。
- Phase 3の性質: 実装開始ではなく仕様確定作業である。
- Phase 3の優先順位:
  1. `KAI-9` OQ-004 診断規則・開始ノード規則
  2. `KAI-10` OQ-005 ルート生成規則・出力契約
  3. `KAI-11` OQ-006 確認テスト規則
  4. `KAI-12` OQ-009 研究データ管理仕様
- Phase 3の成果物候補: `docs/architecture/route-generation.md`、`docs/research/01-confirmed-decisions.md`更新、`docs/research/02-open-questions.md`更新、`docs/research/09-decision-log.md`更新、Linear Issue更新。
- Phase 3進行状況（2026-07-03）: KAI-9/KAI-10の仕様案を`docs/architecture/route-generation.md`（版0.1、状態: 提案）として作成済み。OQ-004/OQ-005は未解消のままであり、研究者の採否判断待ち。Decision Log追記案は同文書§17に下書きとして保持している。
- 未完了事項: OQ-004/OQ-005/OQ-006/OQ-009の仕様判断、`routeGenerator`、ノード別確認テスト・教材、同意・永続化・評価ログ、テスト・型検査・CI基盤、P-06/P-07/P-09の保留判断。
- 指導教員確認が必要なIssue: `KAI-12`、`KAI-16`は必須。`KAI-9`、`KAI-11`、`KAI-15`は評価設計への影響により推奨。`KAI-10`は研究質問や評価主張に影響する場合に確認する。

[禁止] OQ-004、OQ-005、OQ-006、OQ-009の未確定事項を、Codexまたは他AIが実装上の既定値で補完してはならない。

## 文書優先順位

AI、Codex、研究者は、研究仕様を参照する際に次の順序を優先する。

1. 最新の有効な`docs/research/09-decision-log.md`
2. `docs/research/01-confirmed-decisions.md`
3. `docs/research/02-open-questions.md`
4. `docs/research/`配下の各研究文書
5. `docs/operations/`配下の承認済み運用文書
6. 旧`docs/`直下文書（参考資料・履歴資料・検討案）
7. コード（実装事実の確認材料）

旧`docs/`直下文書と`docs/research/`配下が矛盾する場合は、`docs/research/`配下と最新の有効なDecisionを優先する。コードは現在動いている事実を示すが、研究仕様の正解とはみなさない。

## 最初に読む順序

1. `09-decision-log.md`
2. `01-confirmed-decisions.md`
3. `02-open-questions.md`
4. `00-research-overview.md`
5. `docs/operations/ai-research-development-roadmap.md`
6. 作業内容に応じて `03`〜`08`
7. 実装開始時はLinear Issueと対象仕様文書

## 起動確認

[未確認] 本パッケージだけではロックファイルと採用パッケージマネージャを確定しない。最新リポジトリでロックファイルを確認し、そのパッケージマネージャを使用する。

`package.json`のスクリプトをnpmで実行する場合の例:

```bash
npm install
npm run dev
npm run build
```

pnpm、Yarn、Bun等のロックファイルがある場合は、対応するコマンドへ読み替える。

[確認済み事実] `package.json`には開発・ビルド用スクリプトがある一方、専用の自動テストスクリプトは本監査時点で確認できていない。

[確認済み事実] 2026-07-03時点で、Supabase Edge Function `make-server-f3d88633`のデプロイ、`/health` HTTP 200、サインイン成功、Dashboard到達、固定ルート遷移は手動確認済みである。

[未確認] デモアカウント、外部サービスの秘密情報、リロード後の認証セッション復元、プロフィール保存成功は本パッケージだけでは確定できない。秘密情報を文書へ直接記載せず、必要な設定名と取得手順だけをREADMEまたは安全な運用文書へ追記する。

## 主要ファイル

- `src/domain/mvpScope.ts`: MVP 12ノードの単一定義
- `src/data/learningNodes.ts`: 全学習ノード
- `src/data/errorMappings.ts`: SRK分類とノード対応
- `src/App.tsx`: 画面遷移と状態管理
- `src/components/Dashboard.tsx`: 推薦表示
- `src/components/Quiz.tsx`: 固定確認問題
- `src/components/PracticeChallenge.tsx`: 実践課題・簡易エラー検出
- `docs/research/03-mvp-scope.md`: 現在有効なMVP仕様
- `docs/research/06-implementation-status.md`: 実装状態
- `docs/mvp-scope.md`、`docs/research-status.md`: 参考資料・旧文書

## 作業開始前チェック

1. `main`の最新コミットを確認する。
2. `docs/research/03-mvp-scope.md`とコードの`MVP_NODE_IDS`を比較する。
3. 依存関係を導入し、`npm run build`が成功することを確認する。
4. 自動テスト用スクリプトの有無を`package.json`で確認し、存在しない場合はIssueの検証方法を手動確認だけにせず、必要最小限のテスト基盤を変更対象へ含める。
5. 最新判断と矛盾していないか確認する。
6. 確定事項、暫定仕様、未確定を混同していないか確認する。
7. コード状態を研究仕様として誤認していないか確認する。
8. 研究目的に寄与しない大規模変更ではないか確認する。
9. 受入条件と検証方法を定義する。
10. 未確定事項を実装上の既定値で補完しない。

## Claude / ChatGPTに任せる作業

- 資料横断の矛盾検出
- 研究質問・評価案の比較
- 仕様書・decision-logの更新案
- 実装タスクの目的、対象、対象外、受入条件への分解
- 結果の主張範囲とリスクの検査

## Codexに任せる作業

[確定事項] Codexは確定済み仕様に基づく実装を担当する。

- 型定義、純粋関数、テスト
- ID参照整合性検証
- 確定済み契約に基づく`routeGenerator`
- 確定済み形式に基づく理由表示
- 決定済み保存方法に基づく永続化
- 決定済み評価計画に必要なログ・出力

Codexは診断重み、ルート生成優先順位、理由情報の必須項目、評価条件、研究質問を独自に確定してはいけない。

## 次の推奨Issue

Linear `WebLearningTool`プロジェクトへIssue A〜Kを登録済みである。旧Issue案と実Issue IDの対応は`docs/operations/linear-issue-backlog.md`を参照する。

Phase 3では、以下の仕様確定Issueを優先する。最初に着手するIssueは`KAI-9`と`KAI-10`である。

- `KAI-9`: OQ-004 診断規則と開始ノード規則を確定する。
- `KAI-10`: OQ-005 ルート生成規則と出力契約を確定する。
- `KAI-11`: OQ-006 確認テスト規則を確定する。
- `KAI-12`: OQ-009 研究データ管理仕様を確定する。

### `KAI-9` / `KAI-10`: ルート生成判断規則の確定

- 状態: [未確定事項の解消]
- 目的:
  - 診断から開始ノードを決定する規則を確定する。
  - 診断、前提、テスト、エラー、振り返りが競合した場合の優先順位と同点処理を確定する。
  - 出力へ含める理由情報の最低限の契約を確定する。
- 実装: 行わない。
- 完了条件:
  - OQ-004とOQ-005が解消されている。
  - 入力、出力、優先順位、同点処理、理由情報の必須項目が文書化されている。
  - 判断内容が`09-decision-log.md`へ記録されている。

### 後続実装Issue: 確定済み契約に基づくrouteGenerator実装

- 前提: `KAI-9`と`KAI-10`完了
- 目的: 確定仕様をMVP 12ノード限定の純粋関数として実装する。
- 変更対象: domain型、`routeGenerator`、テスト、仕様文書
- 対象外: UI全面改修、全63ノード対応、AI解析
- 受入条件:
  - 入力が同じなら出力が同じ。
  - 前提未完了ノードを直接推薦しない。
  - 全出力IDがMVP集合に属する。
  - 確定済み契約に基づく理由情報を返す。
  - 循環・参照切れ・同点処理のテストが通る。
- 検証: 単体テストと代表シナリオ

### `KAI-11` / `KAI-15`: 確認テストのノード対応

- 目的: `quiz-{nodeId}` と問題・結果を正規ノードへ接続する。
- 前提: 問題数、合格閾値、再受験規則が確定していること。
- 受入条件: 得点、合否、誤答、対象ノードを取得できる。

### `KAI-12` / `KAI-16`: 評価に必要な最小履歴の取得

- 目的: 診断、進捗、テスト、エラー、振り返り、提示ルートのうち評価に必要な項目を分析可能な形式で取得する。
- 前提: 保存項目、保存先、保持期間、匿名研究IDの扱いが確定していること。
- 注意: Supabase永続化、JSON出力、外部フォーム等の実装方法は目的に応じて選択する。

## 判断が発生した場合

1. `02-open-questions.md` を更新する。
2. `01-confirmed-decisions.md` に現在有効な判断を反映する。
3. `09-decision-log.md` に理由・根拠・影響・再検討条件を追記する。
4. 実装影響があれば `06-implementation-status.md` と対象仕様を更新する。
5. 根拠となるGitHubコミット、文書更新日、該当節を記録する。

## 禁止事項

- チャットだけで重要判断を完結させる。
- 固定値が動くことを研究仕様の妥当性とみなす。
- 比較実験なしで固定ルートより有効と断定する。
- 小規模主観評価から長期学習効果を断定する。
- 研究目的に寄与しない技術移行や機能追加を優先する。
- 未確定の`reasonCode`、`routeVersion`、診断重み、合格閾値をCodexが独自に確定する。

## 引継ぎ資料だけで開始できる作業範囲

- [確認済み事実] 新規担当者は、本パッケージだけで研究目的、MVP境界、確定事項、未確定事項、次に仕様化すべき論点を把握し、仕様検討としての文書レビューとIssue 1Aを開始できる。コード変更を伴う作業開始には、最新リポジトリの取得と実装状態の再確認が必要である。
- [制約] 実際のアプリ起動、Supabase接続、評価データ取得を伴う作業は、リポジトリ取得、依存関係導入、外部環境への権限確認が必要であり、本パッケージ単独では完結しない。
- [確定事項] 環境情報が不足していることを理由に未確定の研究仕様を実装者が補完してはならない。
