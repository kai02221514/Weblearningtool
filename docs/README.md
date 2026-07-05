# docs ディレクトリ構成

このディレクトリは、研究仕様、技術仕様、運用手順、旧資料、監査証跡を役割ごとに分けて管理する。

## 現行文書

- `docs/research/`: 研究仕様、確定事項、未確定事項、評価計画、実装状態、Decision Log、引継ぎの正本。
- `docs/architecture/`: 技術仕様、設計契約、実装前に参照する承認済み仕様。
- `docs/operations/`: 開発、検証、AI利用、Linear、Supabaseなどの運用手順。
- `docs/content/`: 教材案、確認テスト試作など、研究仕様に接続するコンテンツ資料。
- `docs/development/`: Git/GitHubなど開発運用の詳細規約。

現在の研究判断は `docs/research/09-decision-log.md`、現在の引継ぎは `docs/research/10-handover.md` を参照する。未完了作業の管理はLinearを正とし、GitHub文書には研究仕様、運用ルール、証跡を残す。

## 参考資料とアーカイブ

- `docs/references/`: 旧案、初期案、検討資料を保存する場所。現行仕様の正本ではない。
- `docs/archive/`: 完了済み監査や過去時点の証跡を保存する場所。原則として更新しない。

`docs/references/` と `docs/archive/` の文書を現行仕様として使用してはならない。有用な内容を採用する場合は、研究者本人の判断を経て `docs/research/09-decision-log.md` に記録し、対応する正本文書へ反映する。

## 参照ルール

D-010により、研究仕様の正本は `docs/research/` 配下である。コードは実装状態の証拠であり、研究仕様の正本ではない。`docs/references/` と `docs/archive/` は現行仕様ではない。

研究情報源の詳細な権限設計は `docs/research/09-decision-log.md` のD-019案を参照する。D-019は研究者本人の承認前であり、現在は提案中である。

### 共通の基本原則案

文書間・情報源間で同一対象について矛盾がある場合、D-019案では次の順序を基本原則として扱う。

1. 研究者本人が現在明示した最新判断
2. 指導教員との最新の明示的合意・指示
3. 最新の有効な `docs/research/09-decision-log.md`
4. `docs/research/01-confirmed-decisions.md`
5. 履修計画書・学内提出済みの正式研究資料
6. `docs/research/02-open-questions.md`
7. `docs/research/03-mvp-scope.md`
8. その他の `docs/research/` 配下の研究文書
9. `docs/architecture/` 配下の承認済み技術仕様
10. `docs/operations/` 配下の運用文書
11. 現在のコード
12. `docs/references/` と `docs/archive/`

この順序は絶対順位ではない。次の対象別正本を優先して解釈する。

### 対象別の正本案

| 対象 | 主な正本 | 補足 |
|---|---|---|
| 研究目的・研究質問 | 指導教員との最新合意、履修計画書、Decision Log、`docs/research/00-research-overview.md` | AIやコードだけで変更しない |
| 研究方法・評価方針 | 指導教員との最新合意、履修計画書、`docs/research/05-evaluation-plan.md`、Decision Log | 学内提出内容との矛盾は要確認 |
| 現在有効な研究判断 | 最新の有効なDecision Log、`docs/research/01-confirmed-decisions.md` | Decision Logを変更履歴、confirmed-decisionsを集約ビューとして扱う |
| 未確定事項 | `docs/research/02-open-questions.md` | 実装担当者が独自に確定しない |
| MVP範囲 | `docs/research/03-mvp-scope.md`、関連Decision | コード上の実装範囲と区別する |
| 技術仕様 | 関連Decision、`docs/architecture/` | 承認済み仕様に限る |
| 実装状態 | 現在のコード、`docs/research/06-implementation-status.md` | コードは実装事実であり研究仕様の正本ではない |
| 作業状態・優先タスク | Linear、`docs/research/10-handover.md` | 未完了タスクはLinearを正とする |
| 開発・運用手順 | `docs/operations/`、`AGENTS.md` | 研究仕様を上書きしない |
| 過去の経緯・監査証跡 | `docs/references/`、`docs/archive/` | 現行仕様として使用しない |

### 会話・現在タスクの判断の反映

- 現在の会話、Linear Issue、作業指示で新しい研究判断が明示された場合、その判断は作業完了前にDecision Logまたは対応する正本文書へ反映する。
- 反映されていない会話上の判断を、後続作業の恒久的な正本として扱わない。
- 研究者本人または指導教員の承認が必要な判断は、承認状態を明記する。
- 承認前の内容は「提案中」「未確定」「要確認」として記録する。
- AIが研究者本人や指導教員を決定者として代筆・推定してはならない。
