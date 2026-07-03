# Phase 2.5 引継ぎ: 研究者判断事項一覧(phase2.5-handover)

- 監査基準: `00-audit-scope.md` 参照(対象: `main` @ `16d2f93`、監査日 2026-07-02)
- 本書は ai-research-development-roadmap.md Phase 2.5「監査結果の採否・正本反映」への入力である。
- **推奨採否は監査担当の案にすぎない。最終的な採否(採用/条件付き採用/保留/却下)は研究者本人がPhase 2.5で決定する。監査担当は何も確定していない。**
- 反映先の詳細根拠は各成果物(context-consistency-audit / implementation-gap-analysis / risk-register / recommended-work-order)を参照。
- Phase 2.5の必須表(指摘ID/採否/理由/承認者/反映先/Linear Issue/コミット)は、本表を基に研究者本人が記入する。

> 現在状態: 以下の「判断一覧」は監査時点の入力資料である。研究者による最終判断は「研究者最終採否表」を正とする。

## Phase 2.5完了状態

- 状態: 完了
- 承認者: 北代櫂
- 完了日: 2026-07-03
- 最終採否表: 本文参照
- 次Phase: Phase 3 中核仕様確定支援
- 完了Decision: D-014（コミット: 後続追記）

## 研究者最終採否表

| 指摘ID | 採否 | 理由 | 承認者 | 反映先 | Linear Issue | コミット |
|---|---|---|---|---|---|---|
| P-01 | 採用 | Supabase実環境で`public.kv_store_f3d88633`のRLS有効、ポリシー0件、default denyを確認済み。今後の永続化時は所有者単位ポリシー設計が必要。 | 北代櫂 | `docs/audit/phase2.5-handover.md`、`docs/research/06-implementation-status.md` | 不要。確認済み事項として記録済み | `b082b2c8622d5ca54a35fdcd52d553e4db5157ae` |
| P-02 | 採用 | Dashboard上で固定ルート表示と個別ルート生成未実装表示を確認済み。個別ルート生成機能自体は未実装。 | 北代櫂 | `src/components/Dashboard.tsx`、`docs/research/06-implementation-status.md`、`docs/research/02-open-questions.md` | 後続仕様化はIssue A、Issue B | `b082b2c8622d5ca54a35fdcd52d553e4db5157ae`、`7d1ee464c6f3a30f7f14ea44f46b3cc3ca24024d` |
| P-03 | 採用 | `docs/research/`を正本とし、文書優先順位と旧文書の扱いを反映済み。 | 北代櫂 | `docs/research/09-decision-log.md`、`docs/research/10-handover.md`、旧`docs/`直下文書 | 不要。正本反映済み | `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` |
| P-04 | 採用 | 評価計画の正本を`docs/research/05-evaluation-plan.md`へ一本化し、旧評価計画は参考資料化済み。 | 北代櫂 | `docs/research/05-evaluation-plan.md`、`docs/evaluation-plan.md`、`docs/research/09-decision-log.md` | OQ-009関連はIssue D | `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` |
| P-05 | 採用 | 旧`docs/route-generation-spec.md`をOQ-005の未確定たたき台として明示済み。 | 北代櫂 | `docs/route-generation-spec.md`、`docs/research/09-decision-log.md` | Issue B | `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` |
| P-06 | 条件付き採用 | 監査文書11〜14の原本確認待ち。原本が存在する場合は追加し、存在しない場合は実行不能参照を削除する。 | 北代櫂 | 確認後に`docs/research/00-research-overview.md`等を更新 | 保留。原本確認後に必要なら作成 | 未着手 |
| P-07 | 保留 | OQ-010のNext.js構想の出典確認待ち。研究者または指導教員確認が必要。 | 北代櫂 | 確認後に`docs/research/02-open-questions.md` | 不要。判断待ち | 未着手 |
| P-08 | 採用 | 診断項目差分とアンケート未経由問題をOQ-004へ記録済み。現行質問セットの正式採否はPhase 3へ保留。 | 北代櫂 | `docs/research/02-open-questions.md`、`docs/audit/phase2.5-handover.md` | Issue A | `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` |
| P-09 | 保留 | インプット形式選択をMVP要件へ含めるかは未判断。指導教員確認候補として残す。 | 北代櫂 | 判断後に`docs/research/03-mvp-scope.md`またはDecision Log | 不要。判断待ち | 未着手 |
| P-10 | 採用 | Phase 3の中心作業としてOQ-004・OQ-005仕様化へ接続する。 | 北代櫂 | `docs/research/02-open-questions.md`、`docs/architecture/route-generation.md`、Decision Log | 未登録: `docs/operations/linear-issue-backlog.md` Issue A、Issue B | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-11 | 採用 | Phase 4のテスト・型検査・CI基盤Issueへ接続する。 | 北代櫂 | `docs/operations/testing.md`、`docs/research/06-implementation-status.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue E | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-12 | 採用 | `errorMappings`参照切れ修正Issueへ接続する。 | 北代櫂 | `docs/research/03-mvp-scope.md`、`docs/research/06-implementation-status.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue F | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-13 | 採用 | OQ-006仕様化およびノード別クイズ・教材整備Issueへ接続する。 | 北代櫂 | `docs/research/02-open-questions.md`、`docs/research/03-mvp-scope.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue C、Issue G | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-14 | 採用 | OQ-009、同意、永続化、研究データ管理Issueへ接続する。指導教員確認必須。 | 北代櫂 | `docs/research/02-open-questions.md`、`docs/research/05-evaluation-plan.md`、`docs/operations/research-data-management.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue D、Issue H | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-15 | 採用 | ダミー初期値・再現性・実装状態整理Issueへ接続する。 | 北代櫂 | `docs/research/06-implementation-status.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue I | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-16 | 条件付き採用 | 低優先度のデッドコード・表示不具合修正を条件付き採用とする。 | 北代櫂 | `docs/research/06-implementation-status.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue J | `1518542b02ec8c877ad56898b76c0a760804fd5b` |
| P-17 | 採用 | 実装状態ラベルの統一作業へ接続する。 | 北代櫂 | `docs/research/06-implementation-status.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue I | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-18 | 条件付き採用 | CI方針はP-11に包含し、マイルストン日付はLinearで管理する。 | 北代櫂 | `docs/research/10-handover.md`、`docs/operations/testing.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue E。日付管理はLinear登録後に設定 | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-19 | 却下 | MVP評価終了までR-xx体系を維持する。新分類体系への全面移行は現時点では行わない。 | 北代櫂 | `docs/research/09-decision-log.md` D-013、`docs/audit/requirements-traceability-matrix.md` | 不要 | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |
| P-20 | 採用 | MVP対象外事項を正本文書へ明文化する。 | 北代櫂 | `docs/research/03-mvp-scope.md`または`docs/research/09-decision-log.md` | 未登録: `docs/operations/linear-issue-backlog.md` Issue K | `1518542b02ec8c877ad56898b76c0a760804fd5b`、`cbdbee9fee5f282d0cdda8c590f5a01e3d19d5d2` |

## 判断一覧

| # | 指摘ID | 推奨採否 | 推奨理由 | 正本への推奨反映先 | Linear化 | 研究者本人の判断が必要な内容 | 指導教員 | Phase 3前必須 | Phase 4以降まで保留可 |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | RSK-03(RLS未確認) | 採用・確認完了 | `public.kv_store_f3d88633`でRLS有効を確認。ポリシーは0件でdefault deny状態。現時点のPII漏洩リスクは確認されなかった。今後の永続化実装時にはユーザー単位のSELECT/INSERT/UPDATEポリシーを設計する。 | `08-constraints.md`・`06-implementation-status.md` | 要(W1-1) | Supabase実環境でRLS有効を確認済み。今後の永続化時にポリシー設計が必要 | 不要 | 完了 | 不可 |
| P-02 | RSK-02短期(虚偽文言修正) | 採用 | 対応状態: 表示是正・手動確認完了。Dashboard上で「開発中の固定ルート」が表示され、「診断結果に基づく個別ルート生成は未実装」と表示されることを確認済み。固定ルートの開始ノードへ遷移できることも確認済み。個別ルート生成機能自体は未実装。 | `src/components/Dashboard.tsx`、`docs/research/06-implementation-status.md`、`docs/research/02-open-questions.md`、`docs/audit/phase2.5-handover.md`。Dashboard表示修正コミット: `b082b2c8622d5ca54a35fdcd52d553e4db5157ae`。認証修正補足: `bb98a4cc0f2f2c2acfed0334a136a76406ba910a`。Edge Function標準化補足: `2c3f38e14c81e3deabd383a4620af1982ccb0ea4`。health修正・最新main: `42c298ca2f1ed084121de0decb3df18be590a9eb`。P-02文書反映コミット: `7d1ee464c6f3a30f7f14ea44f46b3cc3ca24024d` | 要(W1-2) | 個別ルート生成仕様はOQ-004/OQ-005で未決定。アンケート完了状態も未実装 | 不要 | 完了(表示是正・手動確認) | 不可 |
| P-03 | C-1(文書二系統の正の宣言) | 採用 | 承認者: 北代櫂。対応状態: 正本宣言反映完了、文書優先順位反映完了、旧文書への状態注記反映完了。 | `docs/research/09-decision-log.md`、`docs/research/10-handover.md`、`docs/mvp-scope.md`、`docs/research-status.md`、`docs/implementation-plan.md`、`docs/evaluation-plan.md`、`docs/route-generation-spec.md`。コミット: `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` | 任意(W1-3) | 承認済み: 北代櫂。研究仕様の正本は`docs/research/`配下とし、旧`docs/`直下文書は参考資料・履歴資料・検討案として扱う | 不要 | 完了(正本宣言・文書優先順位) | 不可 |
| P-04 | C-2(評価計画の一本化) | 採用 | 承認者: 北代櫂。対応状態: 評価計画の正本一本化完了、旧評価計画を参考資料化、保存データ案はOQ-009へ引継ぎ。 | `docs/research/05-evaluation-plan.md`、`docs/evaluation-plan.md`、`docs/research/09-decision-log.md`、`docs/audit/phase2.5-handover.md`。コミット: `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` | 不要 | 承認済み: 北代櫂。旧「保存すべきデータ」節はOQ-009検討材料としてのみ扱う | 評価計画自体の確認時に併せて | 完了(評価計画一本化) | 不可 |
| P-05 | C-4(旧route-generation-specの位置づけ) | 採用 | 承認者: 北代櫂。対応状態: 旧`route-generation-spec`をOQ-005のたたき台として明示し、確定仕様ではないことを明記。 | `docs/route-generation-spec.md`、`docs/research/09-decision-log.md`、`docs/audit/phase2.5-handover.md`。コミット: `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` | 不要 | 承認済み: 北代櫂。優先順位、同点処理、出力契約、理由情報、再計算条件はPhase 3で判断する | 不要 | 完了(旧spec参考資料化) | 不可 |
| P-06 | C-6/G-9(監査文書11〜14の参照切れ) | 条件付き採用 | 実行不能な参照の解消。該当文書が手元にあるなら追加、なければ参照削除 | `00-research-overview.md` 修正案 | 不要 | 11〜14の原本が存在するか | 不要 | 不急 | 可 |
| P-07 | C-7(OQ-010の根拠不明) | 保留 | 履修計画書docx本文にNext.js構想の記述なし。別版か口頭合意かの確認は本人のみ可能 | 確認後 `02-open-questions.md`(OQ-010)更新 | 不要 | 出典の特定または記述の削除 | 出典が指導教員合意なら確認 | 不急 | 可 |
| P-08 | S-4(診断項目の暗黙変更) | 採用 | 承認者: 北代櫂。対応状態: OQ-004へ診断項目差分を記録。現行質問セットの正式採否自体はPhase 3へ保留。 | `docs/research/02-open-questions.md`、`docs/audit/phase2.5-handover.md`。コミット: `741910e0fb9bdd3c9b0c5dd06f8613f5a578bdac` | 不要 | 承認済み: 北代櫂。項目セット、重み、境界、開始ノード規則はOQ-004で未確定のまま扱う | 推奨(診断設計) | 完了(差分記録。採否判断はPhase 3で継続) | 不可 |
| P-09 | S-5/G-5(インプット形式選択の要件消失) | 保留 | 発表・計画書の設計要素(自己決定理論)がdocsから消失。実装はタブUIを保持しており採否どちらも低コスト | 採用なら `03-mvp-scope.md`・`04-learning-model.md`、却下なら `09-decision-log.md` に縮小記録 | 不要 | MVP要件に含めるか | 推奨(計画書記載事項のため) | 不急 | 可 |
| P-10 | RSK-05(OQ-004/OQ-005) | 採用 | 全実装のクリティカルパス。Phase 3の主題そのもの | `01-confirmed-decisions.md`、`02-open-questions.md`、`09-decision-log.md`、`architecture/route-generation.md`(新規) | 要(Phase 3成果のIssue化) | 診断規則・優先順位・同点処理・出力契約・再計算条件(G-4含む) | RQとの関係変更時 | **これがPhase 3** | 不可 |
| P-11 | RSK-06(テスト・型検査・CI基盤) | 採用 | 決定性検証の前提。roadmap Phase 4の中核 | `docs/operations/testing.md`(新規)、`06-implementation-status.md` | 要(W3) | strict化の程度、CI必須化のタイミング | 不要 | 不要(Phase 4着手で可) | 一部可(CIはW5前まで) |
| P-12 | RSK-07(errorMappings参照切れ15件) | 採用 | 確定仕様(D-002・参照整合)への明確な違反状態。機械検証済み | `03-mvp-scope.md`(MVP外エラー注記)、`06-implementation-status.md` | 要(W4-1) | MVP外6エラーを修正するか明示的除外とするか | 不要 | 不要 | 不可(Phase 5前) |
| P-13 | RSK-08(quiz-{nodeId}・ノード別教材) | 採用 | ID体系は確定済み[01]なのにデータ不在。教材範囲は工数に直結 | `02-open-questions.md`(OQ-006)、`03-mvp-scope.md`(教材範囲) | 要(W8) | 問題数・合格閾値・再受験規則(OQ-006)、教材整備範囲(全12か評価経路のみか) | 推奨(評価に影響) | OQ-006はPhase 3で | 実装は可(Phase 7.5前まで) |
| P-14 | RSK-01/RSK-04/RSK-12(永続化・同意・セッション) | 採用 | 評価可能性の必須前提3点セット。OQ-009決定が先行条件 | `02-open-questions.md`(OQ-009具体化)、`05-evaluation-plan.md`、`docs/operations/research-data-management.md`(新規) | 要(W6) | 保存項目・仮名ID・保持期間・削除手順(OQ-009)。旧evaluation-plan「保存すべきデータ」の採用範囲(G-2) | **必須(倫理・データ管理)** | OQ-009はPhase 3で扱うことを推奨 | 実装はPhase 6(評価前必須) |
| P-15 | RSK-09〜11(Medium: 文書状態・再現性・ダミー初期値) | 採用 | いずれも小粒で検証可能な修正(W1-3/W3/W4-2) | `06-implementation-status.md` ほか各項参照 | 要(W3, W4) | ダミー初期値排除後の「仕様上の初期状態」の定義 | 不要 | 不要 | 一部可 |
| P-16 | RSK-13〜16(Low: デッドコード・表示バグ等) | 条件付き採用 | 削除・修正のみの低リスク作業。まとめて1〜2PR | `06-implementation-status.md` | 任意(W4-3/W4-4に同梱) | なし | 不要 | 不要 | 可 |
| P-17 | C-5(「実装済み」ラベルの2水準) | 採用 | research/01の定義へ統一しないと実装状態の報告が信頼できない | `docs/research-status.md`(または廃止)、`06-implementation-status.md` | 不要 | research-status.mdを更新するか廃止するか | 不要 | 推奨 | 可 |
| P-18 | G-1/G-6(CI方針・マイルストン日付の欠落) | 条件付き採用 | G-1はP-11に包含可。G-6は進捗管理上有用だが研究文書の必須要素ではない | G-6採用なら `10-handover.md` または Linear | G-6はLinear推奨 | OQ解消・評価実施の目標日 | 推奨(スケジュール) | 不急 | 可 |
| P-19 | 要件ID体系の正式化(R-xx→roadmapのRQ/LM/MVP/ERR/EVAL/DATA/OPS-xxx) | 保留 | roadmap§Phase 2の採番候補と本監査のR-xxが並存。移行は機械的だが全文書に波及 | 採用時: `requirements-traceability-matrix.md` 全面更新+各文書の参照 | 不要 | 移行するか、R-xxを維持するか | 不要 | Phase 3前に決定推奨(仕様文書がIDを参照し始めるため) | 可(ただし遅いほど高コスト) |
| P-20 | 対象外候補の確定(risk-register末尾: 依存削減・Next.js・Completion機能等) | 採用 | 「やらないこと」の明文化はMVP範囲防衛に有効 | `03-mvp-scope.md`(対象外節)または `09-decision-log.md` | 不要 | 対象外リストの承認 | 不要 | 推奨 | 可 |

## 集計と依存関係

- **即時(Phase 2.5と並行して今日実施可能)**: P-01(RLS確認)、P-02(文言修正)。
- **Phase 3開始前に必須**: P-03, P-04, P-05(文書の正の確定 — Phase 3が参照する基盤)、P-08(OQ-004の一部)。P-19もこのタイミングでの決定を推奨。
- **Phase 3の主題**: P-10(OQ-004/005)。P-13(OQ-006)・P-14(OQ-009)もPhase 3で併せて扱うことを推奨。
- **Phase 4以降で可**: P-06, P-07, P-09, P-11(実装)、P-12, P-15, P-16, P-17, P-18, P-20。
- **指導教員確認が必要(roadmap§2.2)**: P-14(同意・データ管理)は必須。P-08, P-09, P-13, P-18は推奨。
- ChatGPT再監査(roadmap§12の手順1)は本書の判断より前に実施し、指摘の追加・修正があれば本表を更新すること。

## 本監査が確定しなかったこと(再掲)

監査担当は、上記いずれの指摘についても採否を確定していない。OQ-001〜010の内容についても案を示したのみで、いかなる未確定事項も確定していない。正本文書・コード・テスト・Issue・PRは一切変更していない(00-audit-scope §8)。
