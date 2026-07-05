# Phase 2 独立再監査記録

- 監査日時: 2026-07-03 10:18:10 JST
- 監査対象ブランチ: `main`
- 監査対象コミットSHA: `11d398419e10da5ce3c2077f0fe77eca55d06d5d`
- 元監査対象コミットSHA: `16d2f935ea730e0572ac3edbe57047b3204f4008`
- 監査者: Codex
- 目的: `docs/operations/ai-research-development-roadmap.md` Phase 2完了条件のうち、Critical/High指摘の独立再確認と証跡化を行う。

## 監査対象文書

- `docs/operations/ai-research-development-roadmap.md`
- `docs/audit/00-audit-scope.md`
- `docs/audit/context-consistency-audit.md`
- `docs/audit/implementation-gap-analysis.md`
- `docs/audit/requirements-traceability-matrix.md`
- `docs/audit/risk-register.md`
- `docs/audit/recommended-work-order.md`
- `docs/audit/phase2.5-handover.md`
- `docs/operations/linear-issue-backlog.md`
- `docs/research/01-confirmed-decisions.md`
- `docs/research/02-open-questions.md`
- `docs/research/03-mvp-scope.md`
- `docs/research/05-evaluation-plan.md`
- `docs/research/06-implementation-status.md`
- `docs/research/09-decision-log.md`
- `docs/research/10-handover.md`

## 確認した関連コード

- `src/App.tsx`
- `src/components/Dashboard.tsx`
- `src/components/Quiz.tsx`
- `src/components/LearningModule.tsx`
- `src/data/errorMappings.ts`
- `src/domain/mvpScope.ts`
- `package.json`

## 元監査SHAから現行mainへの差分影響

`16d2f935ea730e0572ac3edbe57047b3204f4008..11d398419e10da5ce3c2077f0fe77eca55d06d5d`では、Phase 2監査成果物の追加、Phase 2.5採否判断、研究正本文書の更新、Dashboard固定ルート表示の是正、Supabase接続・Edge Function配置の整理が行われている。

一方、現行コード確認では、`routeGenerator`、診断結果と開始ノード規則の接続、ノード別`quiz-{nodeId}`、ノード別教材、同意UI、永続化、評価ログ、自動テスト・型検査・CI基盤は未実装または未確認のままである。したがって、コード状態を研究仕様の確定状態とはみなさない。

## 再確認したCritical/High指摘一覧

| 指摘ID | 元の重大度 | 再監査後の重大度 | 根拠ファイル・コード | 研究上の影響 | 現在の対応状態 | 原監査との一致・不一致 | 追加対応の要否 |
|---|---|---|---|---|---|---|---|
| C-1 / P-03 | Critical | 解消済み | `docs/research/09-decision-log.md` D-010、`docs/research/10-handover.md`、旧`docs/`直下文書のステータス注記 | 研究仕様の正本を誤ると後続実装が旧案を採用する | `docs/research/`を正本とする判断が記録済み | 原監査の指摘と一致。Phase 2.5で解消済み | 不要 |
| C-2 / P-04 | High | 解消済み。ただしOQ-009は未確定 | `docs/research/05-evaluation-plan.md`、`docs/research/09-decision-log.md` D-011、`docs/research/02-open-questions.md` OQ-009 | 評価計画や保存データ案を過大に確定扱いするリスク | 評価計画正本化済み。保存データ案はOQ-009検討材料 | 原監査の指摘と一致。正本整理は完了、データ管理判断は未確定として維持 | OQ-009は`KAI-12`で扱う |
| C-4 / P-05 | High | 解消済み。ただしOQ-005は未確定 | `docs/route-generation-spec.md`、`docs/research/09-decision-log.md` D-012、`docs/research/02-open-questions.md` OQ-005 | 未確定の優先順位・出力契約が実装仕様として滑り込むリスク | 旧specはOQ-005の未確定たたき台として明記済み | 原監査の指摘と一致。確定仕様化は未実施で正しい | OQ-005は`KAI-10`で扱う |
| S-2 / RSK-05 / P-10 | High | High相当の未確定事項として継続 | `docs/research/02-open-questions.md` OQ-004/OQ-005、`src/App.tsx`の固定`recommendedStartNodeIds`、`docs/research/10-handover.md` | OQ-004/OQ-005が未決定のままだと中核実装へ進めない | Phase 3の最初の仕様確定対象として整理済み | 原監査の指摘と一致。未確定のまま扱われている点は妥当 | `KAI-9`、`KAI-10`で扱う |
| RSK-01 / P-14 | Critical | Critical相当の評価開始前NO-GOとして継続 | `src/App.tsx`は進捗をReact stateで保持、`docs/research/06-implementation-status.md`、`docs/research/02-open-questions.md` OQ-009 | 評価データが残らず、RQ1〜3の分析が不能になる | OQ-009仕様化と実装Issueへ分離済み。未実装を成功扱いしていない | 原監査の指摘と一致 | 仕様は`KAI-12`、実装は`KAI-16`で扱う |
| RSK-02 / P-02/P-10 | Critical | 表示リスクは解消済み。中核機能未実装はHigh相当で継続 | `src/components/Dashboard.tsx`は「開発中の固定ルート」「個別ルート生成は未実装」と表示、`src/App.tsx`は固定`html-010` | 虚偽説明で納得感評価が汚染されるリスク | Dashboard文言は是正済み。routeGeneratorは未実装 | 原監査の虚偽表示指摘は解消方向で一致。中核未実装は継続 | OQ-004/OQ-005後に`KAI-9`、`KAI-10`から実装Issueへ接続 |
| RSK-03 / P-01 | Critical疑い | 文書上は確認済み。外部環境の直接再測定は本再監査では確認不能 | `docs/audit/phase2.5-handover.md` P-01、`docs/research/06-implementation-status.md`、`docs/research/01-confirmed-decisions.md` | RLS無効なら個人情報漏洩リスク | Phase 2.5ではRLS有効・ポリシー0件・default deny確認済みとして記録済み | 原監査の「疑い」は文書上解消。現行リポジトリだけでは外部環境を再測定できない | 将来の永続化実装時に`KAI-12`、`KAI-16`で所有者単位ポリシーを扱う |
| RSK-04 / P-14 | Critical | Critical相当の評価開始前NO-GOとして継続 | `docs/research/05-evaluation-plan.md`、`docs/research/02-open-questions.md` OQ-009、現行コードに同意UIなし | 同意記録なしでは評価データを研究利用できない | 同意・データ管理は未確定/未実装として分離済み | 原監査の指摘と一致 | 仕様は`KAI-12`、実装は`KAI-16`で扱う。指導教員確認必須 |
| RSK-06 / P-11 | High | High相当の品質基盤不足として継続 | `package.json`は`dev`/`build`のみ、`tsconfig`・テスト・CIファイルなし | 仕様準拠、決定性、参照整合性を機械検証できない | Phase 4の作業としてIssue化 | 原監査の指摘と一致 | `KAI-13`で扱う |
| RSK-07 / P-12 | High | High相当の参照整合問題として継続 | `src/data/errorMappings.ts`にドット形式の非正規参照が残存 | MVP外エラー検出拡張時に復習提示が空になる | 未修正。Phase 4作業としてIssue化 | 原監査の指摘と一致 | `KAI-14`で扱う |
| RSK-08 / P-13 | High | High相当の教材・確認テスト未整備として継続 | `src/components/Quiz.tsx`は固定3問、`src/components/LearningModule.tsx`は全ノード共通HTML教材 | ノード別学習・誤答追跡が成立しない | OQ-006仕様化と教材実装Issueへ分離済み | 原監査の指摘と一致 | 仕様は`KAI-11`、実装は`KAI-15`で扱う |

## 新規に発見した指摘

現行`main`の再確認で、原監査のCritical/Highを上回る新規Critical/High指摘は発見しなかった。

ただし、再監査時点では`docs/operations/linear-issue-backlog.md`由来のIssue案がLinearへ未移管であり、`phase2.5-handover.md`やトレーサビリティ行列に暫定Issue名が残っていた。この未完了事項は本作業でLinear `WebLearningTool`プロジェクトの実Issue `KAI-9`〜`KAI-19`へ移管し、関連文書へ反映する。

## 確認不能事項

- Supabase実環境のRLS状態は、現行Gitリポジトリだけでは直接再測定できない。本再監査ではPhase 2.5文書上の確認証跡を確認したが、外部環境そのものの再実測は実施していない。
- 指導教員との口頭合意、履修計画書の別版、過去AI会話にのみ存在する判断は確認していない。
- Linearのプロジェクト外に同一趣旨のIssueが存在する可能性は、今回の重複防止要件である`WebLearningTool`プロジェクト内検索の対象外とした。

## Phase 2完了条件への適合判定

| 完了条件 | 判定 | 根拠 |
|---|---|---|
| 各指摘に根拠ファイル、重大度、影響、修正案がある | 適合 | `context-consistency-audit.md`、`implementation-gap-analysis.md`、`risk-register.md`、本再監査表 |
| 実装済み、部分実装、モック、未実装が区別される | 適合 | `implementation-gap-analysis.md`、`docs/research/06-implementation-status.md` |
| 研究目的から評価指標までの主要経路が追跡できる | 適合 | `requirements-traceability-matrix.md` |
| 確認不能事項が明記される | 適合 | `00-audit-scope.md`、本書「確認不能事項」 |
| 別セッションまたは別モデルでCritical/Highを再確認する | 適合 | 本書で現行`main`の文書・コード・Linear移管前状態を再確認 |

## 最終結論

Phase 2の監査成果物は、現行`main`において内容面を含めて再確認済みである。原監査のCritical/High指摘は、Phase 2.5で解消済みの文書・表示リスクと、Phase 3以降の未確定/未実装事項に正しく分離されている。

未確定事項は未確定のまま維持されており、OQ-004/OQ-005/OQ-006/OQ-009を実装上の既定値で補完した形跡は確認しなかった。したがって、Phase 2は完了、Phase 2.5はLinear実Issue反映後に正式完了と判定できる。
