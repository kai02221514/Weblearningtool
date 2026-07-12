# KAI-24 予備試行前クイズ統合検証

## メタ情報

- 対象Issue: Linear `KAI-24` 予備試行前のクイズ統合検証を実施する
- 検証日: 2026-07-09、最新main上の再検証: 2026-07-13
- 対象ブランチ: `test/kai-24-pilot-quiz-integration`
- baseとなったmain: `ee375b4a78915a2e760aaaef5f3c951f0ed390b6`
- 再現可能UIハーネスcommit: `bea03f8`
- 対象ノード: `html-010`, `html-021`, `css-011`
- 関連Decision: D-018, D-020
- 関連PR: #6, #9, #10, #11, #12, #13
- 検証種別: 研究仕様、型付きデータ、UIモデル、採点、許容解正規化、メモリ内再受験制御の統合確認

## 位置付け

KAI-24は、予備試行対象3ノード9問について、既存の研究仕様と実装が予備試行前の統合状態として破綻していないかを確認するゲートである。

本検証は、次の完了を意味しない。

- 予備試行の実施または完了
- 本実験用問題・教材の最終確定
- 12ノード全体への確認テスト展開
- Supabase保存、同意取得、評価ログ実装
- KAI-15全体の完了
- 研究モデル全体の完成

保存、同意、評価ログ、研究データ利用、DB制約、日時保存形式、routeGenerator接続はKAI-24の対象外であり、OQ-009/KAI-12などの確定前に補完しない。

## 受入条件マトリクス

| ID | 検証項目 | 根拠文書・Decision | 自動テスト | 手動確認 | 結果 |
|---|---|---|---|---|---|
| K24-01 | 3ノードに各3問存在する | pilot-quiz-prototype / D-018 | `quizCatalog.test.ts`, `pilotQuizIntegration.test.ts` | 不要 | 自動確認済み |
| K24-02a | 件数、ID、版、形式、参照IDが構造契約と一致する | pilot-quiz-prototype / D-018 / D-020 | `quizCatalog.test.ts`, `pilotQuizIntegration.test.ts` | 不要 | 自動確認済み |
| K24-02b | 9問の問題文、選択肢、正答、解説、関連前提ノードが正本と一致する | pilot-quiz-prototype | 対象外 | 9問の原文照合 | 手動照合済み。下表に記録 |
| K24-02c | データ化時の研究者レビュー履歴と今回のデータ変更有無 | KAI-20 / PR #6 | 既存証跡参照 | PR #17差分確認 | KAI-20既存証跡を確認。PR #17はクイズデータ自体を変更していない |
| K24-03 | 各ノードで固有クイズが表示される | KAI-21 | `quizUiModel.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-04 | 2/3以上で合格、1/3以下で不合格 | D-018 | `grading.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-05 | D-020の許容解と不許容解が正しく採点される | D-020 | `grading.test.ts`, `pilotQuizIntegration.test.ts` | 代表確認 | 自動確認済み、ブラウザ確認済み |
| K24-06 | 不合格後のみ再受験できる | D-018 / KAI-23 | `attempts.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-07 | 合格後に再受験できない | D-018 / KAI-23 | `attempts.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-08 | 再受験時に回答状態が初期化される | KAI-23 | `quizUiModel.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-09 | 試行番号が増加し、試行結果が区別される | KAI-23 | `attempts.test.ts`, `pilotQuizIntegration.test.ts` | 必須 | 自動確認済み、ブラウザ確認済み |
| K24-10 | 実践課題への遷移が破綻しない | 現行フロー | 対象外 | 必須 | ブラウザ確認済み |
| K24-11 | 未対応ノードで固定クイズへフォールバックしない | KAI-21 | `quizUiModel.test.ts`, `pilotQuizIntegration.test.ts` | 代表確認 | 自動確認済み、ブラウザ確認済み |
| K24-12 | 未確定事項と対象外が文書上明記される | KAI-24 | 本文書 | 不要 | 記録済み |

## 自動検証で確認した内容

KAI-24で `src/features/quiz/pilotQuizIntegration.test.ts` を追加し、次を統合的に確認した。

- `html-010`, `html-021`, `css-011` の3ノードだけが対象クイズへ解決される。
- 未対応ノードは `null` になり、旧固定クイズへフォールバックしない。
- UI回答状態から `QuizSubmission` を作成し、`gradeQuizSubmission` へ委譲する。
- 3/3、2/3、1/3、0/3 の合否境界が全対象ノードでD-018どおりになる。
- D-020の代表的な許容解・不許容解がUI回答状態経由でも正しく採点される。
- 初回不合格後に新しい試行として再受験でき、回答状態を空に戻せる。
- 再受験後は `attemptNumber` が増加する。
- 合格後は同一 `quizId` / `nodeId` への追加試行が `attempt_after_passed` で拒否される。
- `quiz_id_mismatch`, `unexpected_question_answer`, `duplicate_question_answer`, `answer_type_mismatch`, `invalid_attempt_timestamp`, `duplicate_attempt_id` の既存入力検証契約を維持する。

自動テストが確認するのは、3ノード・各3問・合計9問、`quizId` / `questionId` / `nodeId`、`questionSetVersion`、問題形式、正答参照と関連ノードIDの構造整合、D-020境界、合否、UIモデルから採点・試行追加までの契約である。問題文、選択肢ラベル、正答本文、解説本文、関連前提ノードの正本文書との逐語比較は自動化していない。

## 9問の正本手動照合記録

2026-07-13に `docs/content/pilot-quiz-prototype.md` の各問題節と `src/features/quiz/data/` の型付きデータを項目単位で照合した。既存証跡はKAI-20 / PR #6のデータ化・研究者レビューであり、今回のPR #17ではクイズデータ3ファイルを変更していない。

表中の「一致」は、`prompt`、選択肢のID・表示内容・順序、正答、解説、`relatedPrerequisiteNodeIds`を人手で原文照合した結果であり、自動テスト結果を意味しない。

| questionId | questionSetVersion | prompt | choices | correct answer | explanation | related prerequisite node IDs |
|---|---|---|---|---|---|---|
| `html-010-q1` | `quiz-html-010/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | `html-000`・一致 |
| `html-010-q2` | `quiz-html-010/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | なし・一致 |
| `html-010-q3` | `quiz-html-010/v0.2` | 一致 | なし・一致 | 一致 | 一致 | `html-000`・一致 |
| `html-021-q1` | `quiz-html-021/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | なし・一致 |
| `html-021-q2` | `quiz-html-021/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | `html-020`・一致 |
| `html-021-q3` | `quiz-html-021/v0.2` | 一致 | なし・一致 | 一致 | 一致 | `html-020`・一致 |
| `css-011-q1` | `quiz-css-011/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | なし・一致 |
| `css-011-q2` | `quiz-css-011/v0.2` | 一致 | 4件・一致 | 一致 | 一致 | なし・一致 |
| `css-011-q3` | `quiz-css-011/v0.2` | 一致 | なし・一致 | 一致 | 一致 | なし・一致 |

## 自動検証結果

実行結果:

| コマンド | 結果 | 備考 |
|---|---|---|
| `git status --short --branch` | 成功 | 作業ブランチ `test/kai-24-pilot-quiz-integration` |
| `git branch --show-current` | 成功 | `test/kai-24-pilot-quiz-integration` |
| `git log --oneline --decorate -10` | 成功 | base mainは `ee375b4a78915a2e760aaaef5f3c951f0ed390b6` |
| `npm ci` | 成功 | Node v20.17.0に対する`EBADENGINE`警告あり。インストールは成功し、後続検証も成功したためKAI-24起因の阻害要因ではない |
| `npm run test -- src/features/quiz/pilotQuizIntegration.test.ts` | 成功 | 1 file / 5 tests |
| `npm run typecheck` | 成功 | `tsc --noEmit` |
| `npm run lint` | 成功 | `eslint .` |
| `npm run test` | 成功 | 6 files / 104 tests |
| `npm run build` | 成功 | Vite build成功 |
| `npm run check` | 成功 | typecheck / lint / test / build成功、6 files / 104 tests |
| `npm run verify` | 成功 | `npm run check`成功、6 files / 104 tests |
| `git diff --check` | 成功 | 空出力 |

2026-07-13に最新mainへrebase後、対象限定テスト、`typecheck`、`lint`、全テスト、`build`、`verify`、`git diff --check`を再実行し、すべて成功した。全テストは6ファイル104件、対象限定テストは1ファイル5件である。`npm ci`と`npm run check`の個別実行は2026-07-09の記録であり、2026-07-13は`npm run verify`経由で`check`を実行した。

## ブラウザ手動確認結果

再現手順:

```bash
npm run dev -- --host 127.0.0.1
```

確認URL:

- `http://127.0.0.1:3000/manual/kai-24/`

`manual/kai-24/index.html`からのみ`src/manual/kai24QuizHarness.tsx`を読み込み、既存の`Quiz`コンポーネントを描画する。通常の`src/main.tsx`および本番画面からハーネスをimportしない。対象ノード選択で`html-010`、`html-021`、`css-011`、未対応例`html-000`を切り替えられる。ハーネスは認証情報を持たず、回答・試行状態をページ内メモリだけに保持し、研究データを外部送信しない。

確認結果:

| 対象 | シナリオ | 結果 |
|---|---|---|
| `html-010` | 初回2/3合格、`/body`を`html-010-q3`へ入力 | `quiz-html-010/v0.2`、試行1、`/body`不許容、2/3合格、合格後再受験導線なし |
| `html-010` | 初回3/3合格、`<BODY>`を`html-010-q3`へ入力 | `quiz-html-010/v0.2`、試行1、3/3合格、`<BODY>`許容、合格後再受験導線なし、実践課題イベント確認 |
| `html-021` | 初回1/3不合格、`/strong`を`html-021-q3`へ入力 | 試行1、1/3不合格、`/strong`不許容、再受験導線表示 |
| `html-021` | 再受験、回答初期化、`</STRONG>`を`html-021-q3`へ入力 | 試行2、3/3合格、`</STRONG>`許容、合格後再受験導線なし、実践課題イベント確認 |
| `css-011` | 初回2/3合格、`color:`を`css-011-q3`へ入力 | `color:`不許容、2/3合格、合格後再受験導線なし、実践課題ボタン表示 |
| `css-011` | 初回3/3合格、`COLOR`を`css-011-q3`へ入力 | `COLOR`許容、試行1、3/3合格、合格後再受験導線なし、実践課題イベント確認 |
| `html-000` | 未対応ノード確認 | 「このノードの確認テストは未対応です」を表示し、接続済み確認テストとして `html-010, html-021, css-011` を表示。旧固定問題へフォールバックしない |

ブラウザコンソール:

- warn/errorログなし。

2026-07-13にコミット対象の再利用可能ハーネスで再確認した。`html-010`は`/body`を不正答とした2/3合格と`<BODY>`を含む3/3合格、`html-021`は`/strong`を含む1/3不合格後に回答が初期化され、試行2で`</STRONG>`を含む3/3合格、`css-011`は`COLOR`を含む3/3合格と`color:`を不正答とした2/3合格を確認した。各合格後に再受験導線は表示されず、`html-000`は未対応表示となり、ブラウザコンソールのwarn/errorログは0件だった。

## 発見した不具合と修正

- 現時点でKAI-24受入条件を満たすための実装不具合は未検出。
- 追加した変更は、KAI-24の検証不足を補う統合テスト、再現可能な非プロダクション手動確認ハーネス、検証記録に限定する。

## 未検証事項

未検証または対象外の事項は次のとおり。

- Supabase保存、同意取得、評価ログ、研究データ利用はKAI-24対象外であり未検証。
- リロード後の試行履歴保持は実装対象外であり、メモリ内状態としてのみ扱う。
- 予備試行そのものは未実施。

## GitHub Actions

初回PR head `dbdf6b67db7933062c82f8cf392303b106997eed`のGitHub Actions workflow `Check` / job `check`はrun `29202826108`で成功済みである。監査修正後headの最新run ID、URL、対象commit、conclusion、実行日時は、自己参照によるcommit SHA不一致を避けるためPR #17のChecks、PR本文、Linearコメントを最終証跡とする。

## Decision Log更新判定

本作業はD-018およびD-020に基づく統合検証であり、新しい研究判断を追加していない。現時点ではDecision Log更新は不要である。
