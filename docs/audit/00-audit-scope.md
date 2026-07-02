# 監査基準・対象・検証記録(00-audit-scope)

本書は docs/audit/ 配下の全監査成果物に共通する監査基準である。各成果物はこの基準の下で作成された。
運用手順書 `docs/operations/ai-research-development-roadmap.md`(文書版2.0)の Phase 2 成果物として位置づける。

## 1. 監査対象

| 項目 | 内容 |
|---|---|
| 対象リポジトリ | `kai02221514/Weblearningtool`(GitHub) |
| 監査対象ブランチ | `main` |
| 監査対象コミットSHA | `16d2f935ea730e0572ac3edbe57047b3204f4008`(16d2f93、2026-07-02T04:01Z) |
| 監査実施日 | 2026-07-02 |
| 監査担当 | Claude Fable 5(調査担当5名を並列実行、統合後に一次資料照合) |
| 取得方法 | GitHub API / raw.githubusercontent.com 経由の読み取りのみ(サンドボックスからの git clone はプロキシ制約で不可) |

SHAに関する注記:
- [確認済み事実] docs/research/00・06・09・10 が記載する「取得時点のmain: `1a8efb5`」「実装状態の基準コミット: `0f09e5b`」は本監査のHEADと異なる。1a8efb5→16d2f93 の差分はdocsの追加・改名のみで、**src/ は 0f09e5b(2026-06-18)以降変更されていない**(コミットAPI 3件のfiles一覧で確認)。したがって研究文書が記述する実装状態と本監査対象コードは同一版である。
- 古い監査スナップショット記載のSHA(1a8efb5)を最新mainと誤認しないこと。本監査の主張はすべて 16d2f93 のファイル内容に結び付けている。

## 2. 監査開始後のmain更新の扱い

- [確認済み事実] 監査開始後に `docs/operations/ai-research-development-roadmap.md`(文書版2.0)がmainに追加された(raw取得で全文確認。16d2f93のツリーには存在しなかった)。
- [確認不能] 当該追加コミットのSHA。GitHub commits/compare APIが監査終了時点で古い応答(HEAD=16d2f93)を返しており(キャッシュ不整合または反映遅延)、特定できなかった。
- 差分の扱い: **ロードマップ文書は監査対象に含めた**(本監査成果物の様式・Phase 2/2.5要件として反映済み)。それ以外のmain更新の有無は確認できていないため、Phase 2.5開始時に最新mainと16d2f93の差分確認を行うこと。
- [確認済み事実] 監査終了時点で src/App.tsx・src/components/Dashboard.tsx をmainから再取得し、調査時の内容と同一であることを確認した(src/ の実質更新なしと整合)。

## 3. 確認した研究文書

- docs/research/00-research-overview.md 〜 10-handover.md(11ファイル、全文)
- docs/mvp-scope.md、docs/evaluation-plan.md、docs/implementation-plan.md、docs/route-generation-spec.md、docs/research-status.md、README.md(全文)
- docs/operations/ai-research-development-roadmap.md(文書版2.0、監査中に追加。全文)
- ローカル研究資料: S2507_北代櫂_履修計画書.docx(pandoc抽出)、特別研究I最終発表PDF 2025-01-23(pdftotext抽出)

## 4. 確認したコード・テスト・設定ファイル

精読(全文):
- src/App.tsx、src/main.tsx
- src/components/: Auth, SignupSurvey, Onboarding, Tutorial, Dashboard, LearningModule, Quiz, PracticeChallenge, Completion, LearningReflectionForm, LearningReflections(11ファイル)
- src/data/: learningNodes.ts, errorMappings.ts, questionConfig.ts, questionConfig.json
- src/domain/mvpScope.ts
- src/utils/auth.ts, src/utils/supabase/info.tsx
- src/supabase/functions/server/index.tsx, kv_store.tsx
- package.json, vite.config.ts, .npmrc, .gitignore, index.html

構成確認のみ(精読対象外): src/components/ui/(shadcn 46ファイル)、src/components/figma/、src/index.css、src/styles/globals.css、src/Attributions.md、src/guidelines/Guidelines.md

テスト: **存在しない**(git trees API全93エントリ、truncated:false で `*.test.*` / `*.spec.*` / `__tests__` / tsconfig / .eslintrc / .github の不在を確認)。

機械検証: learningNodes.ts / errorMappings.ts のID形式・前提グラフ・参照整合を Node.js スクリプトで全件検証(スクリプトと全出力: notes/verification-scripts/)。

## 5. 確認できなかった環境・外部サービス・運用状態(いずれも[確認不能])

- Supabase実環境: `kv_store_f3d88633` のRLS設定、Edge Functionのデプロイ状態、実際の接続・認証成功可否(RSK-03は「疑い」であり実測ではない)
- 実行時挙動: `npm install` / `npm run build` / `npm run dev` は未実行(サンドボックスのネットワーク制約。パッケージ名のnpm規則違反によりinstall自体が失敗する可能性が高い点は静的に指摘)
- Linear の Issue 状態(アクセス手段なし)
- 過去のAI会話履歴、指導教員との口頭合意内容(OQ-010の「Next.js構想」の出典を含む)
- 履修計画書の別版の存在有無
- 監査終了時点の最新main HEAD SHA(§2)

## 6. 検証記録(独立性レベル)

- 調査: 5領域(研究文書/フロントエンド/ドメインデータ/認証・永続化/テスト基盤)を**独立した並列担当**が一次資料から調査(notes/01〜05に引用付きで保存)。
- 検証: 別文脈の検証担当エージェントを起動したがセッション上限で中断。代替として統合担当が監査文書確定後に一次資料を再取得し、Critical/High の根拠を直接照合した:
  - App.tsx: 固定 `recommendedStartNodeIds: ['html-010']`、ダミー初期値(html-000完了・streak 3・8時間・quizScores [85,92,78])、handleSurveyComplete が progress を更新しないこと、errorHistory/detectedErrors が一度も書き込まれないこと、fetch/localStorage 不使用、Quiz へ nodeId 非伝達 — **全件一致**
  - Dashboard.tsx: 「あなたの推奨ルート(スコア算出)」「レベル(…)とスコア(…点)に基づいて、最適な学習経路を提案しています」の文言、getRecommendedNodes が固定配列の単純フィルタであること、「今週の目標」ハードコード — **全件一致**
  - errorMappings/learningNodes: 機械検証(スクリプト・出力保存済み)
  - tsconfig/.github/テスト不在: trees APIで直接確認
- 未再照合の主張(Quiz.tsx・package.json・server/index.tsx等の詳細): notes/02〜05に逐語引用が保存されており、引用と結論の対応は統合時に確認済み。ロードマップ§12の手順どおり **ChatGPTによる再監査(独立性Level 3)を実施すること**を推奨する。本監査の完了条件「別セッションまたは別モデルでCritical/Highを再確認」は、この再監査をもって充足とする。

## 7. 指摘ID体系

本監査の採番: R-xx(要件)、RSK-xx(リスク)、C-x(文書矛盾)、S-x(研究資料との齟齬)、G-x(仕様欠落)、M-x(モック)、W-x(作業)。
ロードマップ§Phase 2の要件ID候補(RQ-xxx/LM-xxx/MVP-xxx/ERR-xxx/EVAL-xxx/DATA-xxx/OPS-xxx)への移行はPhase 2.5の判断事項とした(phase2.5-handover.md P-19)。

## 8. 変更禁止の遵守

本監査では、研究仕様・GitHub正本文書・コード・テスト・GitHub Issues/PR・Linearを一切変更していない。docs/audit/ 配下の成果物はローカル作成物であり、**正本への反映はPhase 2.5での採否判断後に研究者本人が行う**。修正が必要な事項はすべて修正案・追記案・Issue案として提示している。
