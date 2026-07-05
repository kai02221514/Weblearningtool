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

1. 最新の有効な `docs/research/09-decision-log.md`
2. `docs/research/01-confirmed-decisions.md`
3. `docs/research/02-open-questions.md`
4. `docs/research/` 配下の各研究文書
5. `docs/architecture/` 配下の承認済み技術仕様
6. `docs/operations/` 配下の運用文書
7. `docs/references/` 配下の旧資料
8. `docs/archive/` 配下の監査証跡

未確定事項をCodexや実装担当者が独自に確定してはならない。コードは実装状態の証拠であり、研究仕様の正本ではない。
