# Phase 2.5 引継ぎ: 研究者判断事項一覧(phase2.5-handover)

- 監査基準: `00-audit-scope.md` 参照(対象: `main` @ `16d2f93`、監査日 2026-07-02)
- 本書は ai-research-development-roadmap.md Phase 2.5「監査結果の採否・正本反映」への入力である。
- **推奨採否は監査担当の案にすぎない。最終的な採否(採用/条件付き採用/保留/却下)は研究者本人がPhase 2.5で決定する。監査担当は何も確定していない。**
- 反映先の詳細根拠は各成果物(context-consistency-audit / implementation-gap-analysis / risk-register / recommended-work-order)を参照。
- Phase 2.5の必須表(指摘ID/採否/理由/承認者/反映先/Linear Issue/コミット)は、本表を基に研究者本人が記入する。

## 判断一覧

| # | 指摘ID | 推奨採否 | 推奨理由 | 正本への推奨反映先 | Linear化 | 研究者本人の判断が必要な内容 | 指導教員 | Phase 3前必須 | Phase 4以降まで保留可 |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | RSK-03(RLS未確認) | 採用・確認完了 | `public.kv_store_f3d88633`でRLS有効を確認。ポリシーは0件でdefault deny状態。現時点のPII漏洩リスクは確認されなかった。今後の永続化実装時にはユーザー単位のSELECT/INSERT/UPDATEポリシーを設計する。 | `08-constraints.md`・`06-implementation-status.md` | 要(W1-1) | Supabase実環境でRLS有効を確認済み。今後の永続化時にポリシー設計が必要 | 不要 | 完了 | 不可 |
| P-02 | RSK-02短期(虚偽文言修正) | 採用 | 対応状態: 表示是正・手動確認完了。Dashboard上で「開発中の固定ルート」が表示され、「診断結果に基づく個別ルート生成は未実装」と表示されることを確認済み。固定ルートの開始ノードへ遷移できることも確認済み。個別ルート生成機能自体は未実装。 | `src/components/Dashboard.tsx`、`docs/research/06-implementation-status.md`、`docs/research/02-open-questions.md`、`docs/audit/phase2.5-handover.md`。Dashboard表示修正コミット: `b082b2c8622d5ca54a35fdcd52d553e4db5157ae`。認証修正補足: `bb98a4cc0f2f2c2acfed0334a136a76406ba910a`。Edge Function標準化補足: `2c3f38e14c81e3deabd383a4620af1982ccb0ea4`。health修正・最新main: `42c298ca2f1ed084121de0decb3df18be590a9eb` | 要(W1-2) | 個別ルート生成仕様はOQ-004/OQ-005で未決定。アンケート完了状態も未実装 | 不要 | 完了(表示是正・手動確認) | 不可 |
| P-03 | C-1(文書二系統の正の宣言) | 採用 | 引き継ぎAIの誤実装を防ぐ最小コストの対策 | `09-decision-log.md` 追記、旧5文書冒頭に状態注記、`10-handover.md` 修正 | 任意(W1-3) | research系を正とする案の承認 | 不要 | 必須(Phase 3の参照基盤) | 不可 |
| P-04 | C-2(評価計画の一本化) | 採用 | research/05・08[確定]と旧evaluation-planの主張水準が両立しない | `05-evaluation-plan.md` を正と宣言、旧文書に参考注記、`09-decision-log.md` | 不要 | 旧「保存すべきデータ」節をOQ-009検討材料として引き継ぐ案の承認 | 評価計画自体の確認時に併せて | 必須 | 不可 |
| P-05 | C-4(旧route-generation-specの位置づけ) | 採用 | OQ-005決定時の「案の無審査滑り込み」防止(roadmap禁止事項に対応) | 旧spec冒頭に「OQ-005のたたき台」注記、`09-decision-log.md` | 不要 | 注記文面の承認 | 不要 | 必須(Phase 3の入力) | 不可 |
| P-06 | C-6/G-9(監査文書11〜14の参照切れ) | 条件付き採用 | 実行不能な参照の解消。該当文書が手元にあるなら追加、なければ参照削除 | `00-research-overview.md` 修正案 | 不要 | 11〜14の原本が存在するか | 不要 | 不急 | 可 |
| P-07 | C-7(OQ-010の根拠不明) | 保留 | 履修計画書docx本文にNext.js構想の記述なし。別版か口頭合意かの確認は本人のみ可能 | 確認後 `02-open-questions.md`(OQ-010)更新 | 不要 | 出典の特定または記述の削除 | 出典が指導教員合意なら確認 | 不急 | 可 |
| P-08 | S-4(診断項目の暗黙変更) | 採用 | 年齢層・職業の除外/学習ペース・不安の追加が無記録。OQ-004決定に直結 | `02-open-questions.md`(OQ-004に注記)、決定時 `09-decision-log.md` | 不要 | 項目セットの採否(OQ-004の一部) | 推奨(診断設計) | 必須(OQ-004と同時) | 不可 |
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
