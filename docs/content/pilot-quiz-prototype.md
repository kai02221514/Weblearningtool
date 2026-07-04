# 予備試行用確認テスト試作

## 0. メタ情報

- 対象Issue: Linear `KAI-15`（ノード別クイズ・教材を整備する）
- 対象仕様: `docs/architecture/quiz-assessment.md`（`quiz-assessment-proposal/0.2`。確認テスト規則は研究者採否および指導教員確認を経て初期仕様として承認済み。§2の状態注記参照）、`docs/architecture/route-generation.md`（`route-spec/1.0`）
- 対象ノード: `html-010`、`html-021`、`css-011`（quiz-assessment.md §30.1の予備試行対象案に一致）
- 問題数: 各ノード3問、合計9問
- 状態: [試作・未承認（研究者レビュー前）] 全9問が「要研究者確認」であり未承認である。教材草案も未承認。予備試行未実施。UI実装・問題データ化は未着手。
- questionSetVersion（初期候補）: `quiz-html-010/v0.1`、`quiz-html-021/v0.1`、`quiz-css-011/v0.1`
- 作成日: 2026-07-04
- 参照コミット（作業開始時点の`main`）: `9a46c2557046f70b279038650ba4ffd12454dd54`
- 教材根拠: `docs/content/pilot-material-draft.md`（教材本文草案。ノード別教材本文が存在しなかったため、Claudeが独自に作成した未承認の追加提案。下記[重要な前提]参照）

[重要な前提] 2026-07-04時点で対象3ノードのノード別教材本文はリポジトリに存在しなかった（詳細は`docs/content/pilot-material-draft.md` §1）。ノード別教材本文の不在は、本来は「教材不足」として停止・報告すべき条件であった。そのため、問題仕様の検討を進めるための仮教材案として、Claudeが教材本文草案を独自に作成し、追加提案として扱う。教材草案は正本ではなく、教材本文として未承認であり、本試作の全問題はこれを仮参照基準とする。研究者が教材内容を確認し採用を判断するまで、本試作の「教材範囲との整合」は草案基準の暫定的なものである。教材内容が修正された場合は、9問の教材整合を再確認しなければならない。

## 1. 作問目的

本試作は、KAI-15全体（12ノード36問）のうち、予備試行用3ノード9問の問題仕様を作成するものである。目的は次に限定する。

1. 予備試行（quiz-assessment.md §30.1: 3ノード・3〜5名程度案）で使用できる問題仕様を用意する。
2. 各問題について、参照資料、測定対象、形式選択理由、選択肢設計、誤概念対応、解説設計、復習先設計を研究資料として再現可能な形で記録する。
3. 問題数3問・2/3合格・2形式限定という研究者設計判断が、実際の作問で成立するかの確認材料を提供する。

本試作が行わないこと: 12ノード全体の問題作成、UI実装、Quizコンポーネント変更、採点処理実装、routeGenerator実装、Supabase接続、研究データ保存、予備試行の実施、KAI-15のDone化。

## 2. 確定済み制約

以下の確認テスト規則は、研究者採否（QA-01〜QA-18）および指導教員による全検討項目の確認を経て、初期仕様として承認済みである（`quiz-assessment-proposal/0.2`に基づく。KAI-11はDone）。本試作はこれに従う。

- 確認テストの目的は形成的評価、学習進行判定、復習判定、ルート生成入力、推薦理由の証拠、研究評価時の補助指標に限定する（§6）。
- 各ノード3問、各問題1点、部分点なし、`passed = score >= 2`（§10、§12、§13）。
- 問題形式は単一選択と短いコード補完の2種類に限定する（§11）。
- 不合格後のみ再受験可能、回数制限なし、再受験前に解説または復習導線を提示、全試行を区別して保持（§14、§15）。
- 不合格時の主推薦は対象ノード自身、補助推薦は誤答問題の`relatedPrerequisiteNodeIds`から生成、AIによる誤答原因推定は行わない（§16、§17）。
- 各問題は`questionId`、`nodeId`、`relatedPrerequisiteNodeIds`を持つ（§17）。
- 解説は正誤、回答、正答、短い解説、復習概念、復習導線を含む（§18）。
- `questionSetVersion = quiz-{nodeId}/v{major}.{minor}`で版管理する（§19）。

[注意] 3問・2/3合格・2形式限定・無制限再受験は、文献が直接決めた値ではなくMVPのための研究者設計判断である。初期仕様として承認済みだが「正式確定し変更しない」という意味ではなく、予備試行結果に基づいて見直し得る（QA-03/QA-05/QA-07）。見直しが行われた場合、本試作の9問は再設計が必要になる。

[状態同期の確認結果（2026-07-04）] Linear上のKAI-11はDoneであり、指導教員による確認テスト規則の全検討項目は承認済みである。一方、本作業時点で取得できたmain上の正本文書（`docs/architecture/quiz-assessment.md`の状態表記「研究者レビュー済み仕様案・指導教員確認前」、`docs/research/02-open-questions.md`のOQ-006「未解消」、`docs/research/09-decision-log.md`のD-018未追加、`docs/research/10-handover.md`）には、この承認完了がまだ反映されておらず、Linearの状態と不一致がある。本PRは問題仕様書と教材草案のみを最新状態へ合わせるものであり、正本文書側への承認状態の反映（D-018正式追加を含む）は本PRの対象外である。

## 3. 参照資料

### 3.1 プロジェクト資料

| 資料 | 確認範囲 | 使用目的 |
| --- | --- | --- |
| `docs/architecture/quiz-assessment.md`（quiz-assessment-proposal/0.2） | 全文 | 確認テスト規則、到達目標（§9）、問題形式、採点・合格、復習推薦、版管理、KAI-15境界（§23） |
| `docs/architecture/route-generation.md`（route-spec/1.0） | 全文 | `QUIZ_FAILED`と復習推薦の接続、`quizResults[].passed`入力契約 |
| `docs/research/01-confirmed-decisions.md` | 全文 | MVP境界、ID体系、正本優先順位、コードを仕様の正解としない原則 |
| `docs/research/02-open-questions.md` | 全文 | KAI-15移管範囲、予備試行対象3ノード（main上のOQ-006状態表記は指導教員承認を未反映。§2の状態同期注記参照） |
| `docs/research/03-mvp-scope.md` | 全文 | 12ノード表、前提関係、D-003（色指定はcss-011内） |
| `docs/research/04-learning-model.md` | 全文 | 単元進行（インプット→確認テスト→実践→振り返り）、確認テスト入力の位置付け |
| `docs/research/05-evaluation-plan.md` | 全文 | テスト得点・再受験回数は補助指標であること、主観評価項目 |
| `docs/research/06-implementation-status.md` | 全文 | ノード別テスト・教材の未実装状態 |
| `docs/research/09-decision-log.md` | 全文 | D-001〜D-017の確認（D-018はmain上未追加。承認状態の正本反映は本PRの対象外。§2の状態同期注記参照） |
| `docs/research/10-handover.md` | 全文 | KAI-15の次作業指定（3ノード問題試作）、禁止事項 |
| Linear `KAI-15` Issue本文 | 全文（コメントなし） | 受入条件、「現行Quizと教材はノード非依存のモック」の確認 |

### 3.2 教材・コード

| 資料 | 確認範囲 | 使用目的 |
| --- | --- | --- |
| `docs/content/pilot-material-draft.md` | 全文（本試作と同時作成の草案） | 全問題の教材範囲の参照基準 |
| `src/data/learningNodes.ts` | 対象3ノードと前提ノードの定義 | ノードid、title、summary、prerequisites |
| `src/components/Quiz.tsx` | 全文 | 現行実装事実の確認（固定3問、単一選択+短答、小文字化採点、70%表示）。研究仕様の正解としては扱わない |
| `src/components/LearningModule.tsx` | 教材コンテンツ部分 | ノード別教材が存在しない事実の確認 |
| `src/domain/mvpScope.ts` | MVP_NODE_IDS関連 | MVP 12ノード絞込の実装事実 |
| `src/data/errorMappings.ts` | 対象ノード関連 | エラーと復習ノード対応の実装事実（本試作では問題設計に直接使用しない） |

### 3.3 学術・教育資料

以下のうち#1〜#6は`docs/architecture/quiz-assessment.md` §27に記録済みの文献であり、確認範囲は同文書の記録を引き継ぐ（本作業で本文の再確認は行っていない）。#7は本作業（2026-07-04）でWeb検索により書誌情報を確認した。

| # | 文献 | 著者・年 | DOI/URL | 確認範囲 | 本試作での使用 | 限界 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Assessment and Classroom Learning | Black & Wiliam, 1998 | https://doi.org/10.1080/0969595980050102 | 書誌情報確認（quiz-assessment.md §27引き継ぎ） | 確認テストを形成的評価と位置付け、誤答を次の学習行動（復習推薦）へつなげる設計の背景 | 個々の問題の妥当性や3問構成を直接支持しない |
| 2 | Learning for Mastery | Bloom, 1968 | https://eric.ed.gov/?id=ED053419 | 書誌情報・要旨確認（同上） | 合格基準を設けて再挑戦を許可する設計（不合格後再受験）の背景 | 2/3という閾値を直接正当化しない |
| 3 | Test-Enhanced Learning | Roediger & Karpicke, 2006 | https://doi.org/10.1111/j.1467-9280.2006.01693.x | 書誌情報・要旨確認（同上） | 学習直後の確認テスト（検索練習）自体の教育的意義の背景 | 本試作の問題で長期保持効果を測定したことにはならない |
| 4 | The Power of Feedback | Hattie & Timperley, 2007 | https://doi.org/10.3102/003465430298487 | 書誌情報・要旨確認（同上） | 解説を正誤提示だけにせず、誤概念の修正と次の行動（復習先）を含める設計 | 解説の効果は内容と提示方法に依存する |
| 5 | Cognitive Load During Problem Solving | Sweller, 1988 | https://doi.org/10.1207/s15516709cog1202_4 | 書誌情報・要旨確認（同上） | 問題文を短くし、1問1概念、未学習知識を要求しない設計の背景 | 個々の問題の認知負荷を測定したものではない |
| 6 | Standards for Educational and Psychological Testing | AERA, APA, NCME, 2014 | https://www.testingstandards.net/uploads/7/6/6/4/76643089/standards_2014edition.pdf | 目次・関連章の存在確認（同上） | 測定主張の限定、版管理、到達目標との対応（alignment・content validity）の注意 | 本試作は正式な心理測定尺度の構成ではない |
| 7 | A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment | Haladyna, Downing & Rodriguez, 2002 | https://doi.org/10.1207/S15324818AME1503_5 | 書誌情報・要旨のみ確認（2026-07-04 Web検索） | 単一選択問題の選択肢設計の一般原則（もっともらしい誤答の使用、選択肢の長さ・粒度の統一、否定形・ひっかけの回避）の背景 | 選択肢数4や個々の誤答選択肢の妥当性を直接保証しない。要旨レベルの確認であり、個別ガイドラインの引用には本文確認が必要 |

## 4. 根拠の扱い

本試作では、各問題の根拠を次の4種類に区別して記録する。

- 文献上の一般原則: 形成的評価として設計する、解説は誤概念修正を含める、誤答選択肢はもっともらしい誤概念を表す、問題は到達目標と対応させる、初学者の認知負荷を抑える。これらは§3.3の文献が支える一般方針であり、個々の問題内容を決めるものではない。各問題のsourceReferences.academicも、この一般原則（§5の共通作問原則）の背景を示す参照であり、個々の問題文・選択肢・難易度・問題構成を文献が直接決定したことを意味しない。
- プロジェクト資料上の要件: 3問構成、2形式、1点×3、2/3合格、`relatedPrerequisiteNodeIds`、版管理、解説必須項目。これらは指導教員確認を経て初期仕様として承認済みの確認テスト規則（quiz-assessment-proposal/0.2）に従う。
- 実装上の制約: 採点の機械化が必要（自動実行採点なし）、予備試行で短時間（3ノードで計15〜30分程度を想定）に回答できる必要、アンケートと対応付けるため問題ID・版が必要、現行UIは単一選択（ラジオボタン）と1行テキスト入力を持つ。
- 研究者設計判断: 各問題の具体的内容、概念の問題への割り当て、選択肢の文言、難易度分類、許容解の範囲、補助前提ノードの設定・非設定。これらは文献にもプロジェクト資料にも直接の根拠がなく、本試作での設計判断である。すべて研究者レビューの対象である。

## 5. 作問原則

本試作で適用した原則（指示および§3.3の一般原則に基づく）:

1. 各問題は対象ノードの到達目標（quiz-assessment.md §9）の観察可能な行動に対応させる。
2. 問題で要求する知識は、教材草案（pilot-material-draft.md）の該当節に明示された内容に限定する。
3. 単一選択は4択、誤答選択肢はそれぞれ特定の誤概念を表す。不自然なダミーを置かない。
4. 選択肢の長さ・粒度・表現をそろえ、正答だけが目立たないようにする。
5. コード補完は補完箇所を原則1か所、回答は記号を含まない1語とし、機械採点を単純にする。
6. 問題文は短く、二重否定・否定形設問・ひっかけ・未学習知識・ブラウザ差を避ける。
7. 解説は、正答理由、誤答の問題点、概念の短い再説明、復習先（教材草案の節）を含める。
8. 各ノードの構成は単一選択2問+コード補完1問、難易度は基礎1問+標準2問を第一候補とする。
9. 3問で到達目標の主要素を分散カバーし、同一知識の3問重複を避ける。

表記の規約: 仕様記述では「正答」を、学習者に表示する解説文の中では「正解」を用いる。9問と教材草案の状態は「未承認（研究者レビュー前）」で統一する。

## 6. html-010

### 6.1 到達目標

- 正本（quiz-assessment.md §9）: `<!DOCTYPE html>`, `html`, `head`, `body`の役割と配置を判別できる。
- ノード定義（learningNodes.ts）: HTML基本骨格(doctype / html / head / body)。最小構成のHTML文書を自力で作れる。
- 前提ノード: `html-000`（HTMLとは何か）。補助復習候補（§9）: `html-000`。

### 6.2 教材範囲

`docs/content/pilot-material-draft.md` §3（html-010: HTML基本骨格）。扱う内容: 最小HTML文書の骨格と順序（§3.1）、DOCTYPE宣言の位置付け（§3.2）、html要素（§3.3）、head要素とtitle（§3.4）、body要素（§3.5）、よくある間違い（§3.6）。扱わない内容: meta属性詳細、charset、SEO、script読み込み位置、ブラウザ互換性、標準/互換モード。

### 6.3 3問のカバレッジ

| 問題ID | 到達目標 | 問題形式 | 主に測る内容 | 他問題との重複 | 重要度 |
| --- | --- | --- | --- | --- | --- |
| html-010-q1 | head/bodyの役割判別 | 単一選択 | 表示内容を書く要素（body）と他要素の役割区別 | q3とhead/bodyの役割理解を部分共有（形式・方向が異なる） | 高 |
| html-010-q2 | 4構成要素の配置判別 | 単一選択 | DOCTYPE・html・head・bodyの配置関係と順序 | q1と役割理解を前提として共有するが、測定対象は配置 | 高 |
| html-010-q3 | head要素の役割・産出 | コード補完 | 骨格に欠けている要素名（head）の産出 | q1の役割理解を産出形式で再確認 | 中 |

確認: 役割（q1）、配置（q2）、産出（q3）で到達目標の2要素（役割・配置）を分散カバーする。DOCTYPEはq2でのみ扱うため、q2を落とすとDOCTYPE理解の証拠が残らない（リスクは§10で記載）。2/3合格の場合でも、役割または配置のいずれかの理解証拠は最低1問分残る。

### html-010-q1

- questionId: `html-010-q1`
- nodeId: `html-010`
- quizId: `quiz-html-010`
- questionSetVersion: `quiz-html-010/v0.1`
- type: 単一選択（4択）
- difficulty: 基礎
  - 根拠: 必要な知識は「bodyに表示内容を書く」の1つ。選択肢は役割が明確に異なる4要素であり識別難度は低い。問題文は1文で認知負荷が小さい。
- targetObjective: 最小HTML文書におけるbody要素とhead要素等の役割の判別（quiz-assessment.md §9「役割と配置を判別できる」の役割側）
- observableBehavior: 画面に表示される内容を書く要素として`<body>`を4択から選択できる。
- prompt:

  ブラウザの画面に表示される内容（本文）を書く場所となる要素はどれですか。

- choices:
  1. `<body>`
  2. `<head>`
  3. `<html>`
  4. `<title>`
- correctAnswer: 選択肢1 `<body>`
- acceptedAnswers: 選択肢ID一致のみ（単一選択のため許容解なし）
- explanation:

  正解は`<body>`です。`<body>`〜`</body>`の中に書いた内容がブラウザの画面に表示されます。`<head>`はページに関する情報（タイトルなど）を書く場所で、本文としては表示されません。`<html>`は文書全体を包む要素で、直接内容を書く場所ではありません。`<title>`に書いた文字は本文ではなくブラウザのタブなどに表示されます。復習する場合は教材「head要素の役割」「body要素の役割」（pilot-material-draft.md §3.4〜§3.5）を読み直してください。

- misconceptionByChoice:
  - 選択肢2 `<head>`: 「headはページの上部＝本文の始まり」という語感による誤概念。head/bodyの役割区別ができていない。初学者が選ぶ可能性: 高。
  - 選択肢3 `<html>`: 「HTML文書の内容はすべてhtmlに書く」という理解で、全体を包む要素と表示内容を書く場所の区別ができていない。可能性: 中。
  - 選択肢4 `<title>`: titleの文字がページ本文に表示されるという誤概念。可能性: 中。
- mainReviewNodeId: `html-010`
- relatedPrerequisiteNodeIds: `["html-000"]`
  - 理由: 「HTMLのどこが画面表示になるか」の誤りは、HTMLと表示の関係というhtml-000の内容（HTMLの役割）の不足に関係し得る。quiz-assessment.md §9のhtml-010補助復習候補（html-000）とも一致する。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（html-010行）"
      usedFor: 到達目標
    - path: docs/architecture/quiz-assessment.md
      section: "11. 問題形式 / 24. QA-04"
      usedFor: 単一選択形式の採用
  material:
    - path: docs/content/pilot-material-draft.md
      section: "3.4 head要素の役割 / 3.5 body要素の役割 / 3.6 よくある間違い"
      usedFor: 問題内容・正答・誤答選択肢（「表示したい文章をheadに書く」誤りを§3.6に明示）
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: もっともらしい誤答・選択肢粒度の統一という一般原則の背景（§5の共通作問原則3・4）。個々の選択肢内容は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
    - title: Assessment and Classroom Learning
      author: Black & Wiliam
      year: 1998
      doiOrUrl: https://doi.org/10.1080/0969595980050102
      verificationLevel: 書誌情報のみ確認（quiz-assessment.md §27引き継ぎ）
      usedFor: 誤答を復習導線へつなげる形成的評価としての位置付け
      limitation: 問題内容を直接決めるものではない
  ```

- educationalRationale: 到達目標の「役割の判別」を最小の認知負荷で確認する導入問題。head/body混同は教材草案§3.6が「よくある間違い」と明示する中心的誤概念であり、これを最初に検出することで、不合格時の復習推薦（html-010本体）の根拠になる。
- designDecision: 4択の構成要素（body/head/html/title）はすべて教材§3の登場要素から選び、教材外要素を使わない。titleを含めたのは「タブ表示と本文表示の区別」という教材§3.4の内容を選択肢側で活用するため。これらは研究者設計判断である。
- ambiguityCheck: 「画面に表示される内容（本文）」という表現で、タブ表示（title）を排除する意図を明示した。正答は一意。複数解釈の余地は低いが、「表示」という語がタブ表示を含むと読まれないか予備試行で確認する。
- outOfScopeCheck: 全選択肢・全知識が教材草案§3の範囲内。meta、charset等は不使用。
- pilotReviewPoints: 選択肢2（head）の選択率が突出して高い場合、教材§3.4の説明不足を疑う。正答率が極端に高い（全員正解）場合は基礎問題として妥当と判断する（形成的評価では低難度自体は問題でない）。

### html-010-q2

- questionId: `html-010-q2`
- nodeId: `html-010`
- quizId: `quiz-html-010`
- questionSetVersion: `quiz-html-010/v0.1`
- type: 単一選択（4択・コード提示）
- difficulty: 標準
  - 根拠: DOCTYPE・html・head・bodyの4要素の配置関係を同時に照合する必要があり、必要知識数がq1より多い。選択肢間の差分（順序・包含関係）の識別に構造理解が必要。コードは各4〜5行で読解負荷は抑えた。
- targetObjective: 最小HTML文書における宣言と要素の配置関係の判別（quiz-assessment.md §9「役割と配置を判別できる」の配置側）
- observableBehavior: 4つの骨格コードから、DOCTYPEが先頭・htmlが全体を包む・head→bodyの順という正しい配置のものを選択できる。
- prompt:

  最小のHTML文書として、宣言と要素の配置が正しいものはどれですか。

- choices:

  1.
  ```html
  <!DOCTYPE html>
  <html>
    <head></head>
    <body></body>
  </html>
  ```
  2.
  ```html
  <!DOCTYPE html>
  <html>
    <body></body>
    <head></head>
  </html>
  ```
  3.
  ```html
  <html>
    <!DOCTYPE html>
    <head></head>
    <body></body>
  </html>
  ```
  4.
  ```html
  <!DOCTYPE html>
  <html>
    <head></head>
  </html>
  <body></body>
  ```

- correctAnswer: 選択肢1
- acceptedAnswers: 選択肢ID一致のみ
- explanation:

  正解は選択肢1です。HTML文書は、先頭に`<!DOCTYPE html>`を書き、その下の`<html>`〜`</html>`が文書全体を包み、`<html>`の中に`<head>`、`<body>`の順で書きます。選択肢2は`<head>`と`<body>`の順序が逆です。選択肢3は`<!DOCTYPE html>`が`<html>`の中にありますが、DOCTYPEは要素ではなく宣言なので、文書のいちばん先頭（`<html>`の外側）に書きます。選択肢4は`<body>`が`<html>`の外にありますが、文書のすべての要素は`<html>`の中に入れます。復習する場合は教材「最小のHTML文書」「<!DOCTYPE html>の役割」（pilot-material-draft.md §3.1〜§3.3）を読み直してください。

- misconceptionByChoice:
  - 選択肢2: head/bodyの順序に意味がないという誤概念、または順序の未定着。可能性: 高。
  - 選択肢3: DOCTYPEを通常の要素と同様に「htmlの中に書くもの」と誤解。宣言と要素の区別ができていない。可能性: 中。
  - 選択肢4: htmlが文書全体を包むことの未理解。「htmlはheadとセット、bodyは別」という断片的理解。可能性: 低〜中。
- mainReviewNodeId: `html-010`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: 配置関係はhtml-010固有の内容であり、前提ノードhtml-000（HTMLの役割）の不足と結びつける根拠が弱い。quiz-assessment.md §17「根拠が弱い前提ノードは設定しない」に従い空とする（研究者設計判断）。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（html-010行）"
      usedFor: 到達目標（配置の判別）
  material:
    - path: docs/content/pilot-material-draft.md
      section: "3.1 最小のHTML文書 / 3.2 <!DOCTYPE html>の役割 / 3.3 html要素の役割 / 3.6 よくある間違い"
      usedFor: 正答の配置規則と誤答3種（順序逆・DOCTYPE内包・body外出し）。§3.6に順序とDOCTYPE位置の誤りを明示
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: 選択肢の形式・分量をそろえるという一般原則の背景（§5の共通作問原則4）。個々の選択肢内容は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
    - title: Cognitive Load During Problem Solving
      author: Sweller
      year: 1988
      doiOrUrl: https://doi.org/10.1207/s15516709cog1202_4
      verificationLevel: 書誌情報・要旨確認（quiz-assessment.md §27引き継ぎ）
      usedFor: 不要な情報を増やさないという一般的配慮の背景。コードの具体的な長さや表記（空要素表記等）を定めるものではなく、その選択は研究者設計判断
      limitation: 本問の認知負荷を実測したものではない
  ```

- educationalRationale: 到達目標の「配置」を直接確認する中心問題。誤答がそれぞれ異なる構造的誤概念（順序・宣言の性質・包含関係）に対応するため、誤答分析により復習ポイントを特定しやすい。
- designDecision: head/body内を空（`<head></head>`）にして差分を配置のみに限定した。title等を入れると読解量が増え、配置以外の要因で誤答し得るため。誤答3種の選定（順序逆・DOCTYPE内包・body外出し）は教材§3.6と作問者の判断による。
- ambiguityCheck: 正答は一意。選択肢2〜4はいずれも教材草案の規則に明確に違反する。なお、HTML仕様上は`<head></head>`の省略等が許容される場合があるが、教材草案は「この順序と包含関係で書く」と規定しており、教材基準で正誤は一意である。この点（実仕様と教材規範の差）は解説では触れず、教材の規範に従う。
- outOfScopeCheck: 使用要素はDOCTYPE・html・head・bodyのみで教材§3の範囲内。ブラウザのエラー回復（誤ったHTMLの実際の表示挙動）は問わない。
- pilotReviewPoints: 4つのコードの読み比べにかかる所要時間。選択肢3（DOCTYPE内包）の選択率。コード表示のUI上の読みやすさ（予備試行時のUIモック確認事項）。

### html-010-q3

- questionId: `html-010-q3`
- nodeId: `html-010`
- quizId: `quiz-html-010`
- questionSetVersion: `quiz-html-010/v0.1`
- type: 短いコード補完
- difficulty: 標準
  - 根拠: 選択肢の手がかりなしに要素名を想起・産出する必要があり、再認（q1）より要求水準が高い。ただし回答は1語で操作負担は小さい。
- targetObjective: 最小HTML文書の骨格に欠けている「ページに関する情報を書くための要素」（head）を特定し、その要素名を産出できる（quiz-assessment.md §9「役割と配置を判別できる」の役割の産出的確認）
- observableBehavior: 骨格コードに追加すべき要素の名前として「head」を入力できる。
- prompt:

  次のHTMLに、`<title>`などの「ページに関する情報」を書くための要素を`<body>`の前に追加します。追加する要素の要素名を答えてください（例: body）。

  ```html
  <!DOCTYPE html>
  <html>
    <body>
      <p>こんにちは</p>
    </body>
  </html>
  ```

- choices: なし（コード補完）
- correctAnswer: `head`（正規化前の想定正答）
- acceptedAnswers:
  - 正答: `head`
  - 正規化（案・§12参照）: 前後空白除去、小文字化して比較（`HEAD`、`Head`も正答扱い）。
  - 許容解に含めるか要確定: `<head>`（山括弧付き回答）。問題文の「要素名を答えてください（例: body）」で括弧なしを誘導するが、括弧付き回答を不正解にすると採点漏れの恐れがある。KAI-15で確定が必要。
  - 不正解とする回答例: `header`（header要素は未学習だが、混同回答として記録価値がある）、`title`（問題文で`<title>`などを「書く内容」の例として明示しているため不正解とする）、`body`、`html`。
  - 正答の一意性: 教材草案§3.1の骨格において、`<body>`の前に置く「ページに関する情報を書くための要素」はheadのみである。問題文に`<title>`などを例示することでtitle回答を排除し、一意性を確保している。
- explanation:

  正解は`head`です。`<title>`のような「ページに関する情報」は`<head>`〜`</head>`の中に書きます。このHTMLには`<head>`がないため、`<body>`の前に`<head>`を追加し、その中に`<title>`などを書きます。`<head>`の中身は本文としては表示されず、`<title>`の文字はブラウザのタブなどに表示されます。画面に表示したい内容（`<p>こんにちは</p>`など）は`<body>`に書きます。`body`や`html`と答えた場合は、それぞれの要素の役割を混同しています。復習する場合は教材「最小のHTML文書」「head要素の役割」（pilot-material-draft.md §3.1、§3.4）を読み直してください。

- misconceptionByChoice: （選択式でないため、想定誤答と対応する誤概念）
  - `body`: head/bodyの役割混同（q1と同じ誤概念の産出形式での再出現）。ただしbodyは既にコード中に存在するため選ばれにくい。
  - `title`: 「ページに関する情報＝title」という表層理解で、情報を「書くための場所」であるheadと区別できていない。
  - `html`: すべてをhtmlに直接書くという誤概念。
- mainReviewNodeId: `html-010`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: 想定誤答はいずれもhtml-010内部の役割混同であり、html-000（HTMLの役割）の不足と結びつける根拠が弱いため空とする（研究者設計判断）。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "11. 問題形式（短いコード補完・正規化候補）"
      usedFor: 形式と正規化方針
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（html-010行）"
      usedFor: 到達目標
  material:
    - path: docs/content/pilot-material-draft.md
      section: "3.1 最小のHTML文書 / 3.4 head要素の役割"
      usedFor: 骨格コードと正答。§3.1のコード例からheadを除いた骨格を題材とし、§3.4のhead定義（ページに関する情報を書く場所）を問題文の文言に使用
  academic:
    - title: Test-Enhanced Learning
      author: Roediger & Karpicke
      year: 2006
      doiOrUrl: https://doi.org/10.1111/j.1467-9280.2006.01693.x
      verificationLevel: 書誌情報・要旨確認（quiz-assessment.md §27引き継ぎ）
      usedFor: 想起・産出型の確認を含めること自体の一般的背景。単一選択2問＋産出1問という具体的構成の直接根拠ではない（構成は§5の共通作問原則と研究者設計判断による）
      limitation: 本問の学習効果を実証するものではない
  ```

- educationalRationale: 単一選択2問が再認に偏るため、到達目標の「最小構成のHTML文書を自力で作れる」（ノード定義summary）に近づける産出問題を1問置く。q1と同じ役割理解を、手がかりなしで確認する。
- designDecision: 監査指摘（開始・終了タグ2箇所空欄で1回答を求める旧形式は「補完箇所は原則1か所」の方針とUI実装の単純性に合わない）を受け、骨格に欠けている要素の名前を1回答で問う形式へ変更した。空欄マーカーを使わないため、UIは通常の1行テキスト入力のみで実装できる。問題文に`<title>`などと例示したのは、正答をhead一意にするための限定調整である（title回答の排除）。回答を記号なしの1語に限定したのは採点の機械化と採点漏れ防止のため。例示に`body`を使ったのは、回答形式（括弧なし）を示しつつ、コード中に既に存在するため答えのヒントにならないため。
- ambiguityCheck: 正答は一意（上記）。「`<title>`などの『ページに関する情報』を書くための要素」は教材§3.4のhead定義に対応する文言であり、解釈のぶれは小さい。title・body回答の発生有無は予備試行で確認する。
- outOfScopeCheck: 教材§3.1のコード例からheadを除いた骨格を使用。未学習要素なし。
- pilotReviewPoints: 無回答率（産出問題は選択式より無回答が出やすい）。`title`回答・`<head>`形式（括弧付き）回答の発生率（問題文文言と許容解仕様の確定材料）。大文字回答の発生率。所要時間。

## 7. html-021

### 7.1 到達目標

- 正本（quiz-assessment.md §9）: 親子関係と正しい閉じ順を判別できる。
- ノード定義（learningNodes.ts）: 入れ子構造(DOMツリーの基礎)。親子・兄弟関係を意識してマークアップできる。
- 前提ノード: `html-020`（要素とタグ）。補助復習候補（§9）: `html-020`。

### 7.2 教材範囲

`docs/content/pilot-material-draft.md` §4（html-021: 入れ子構造）。扱う内容: 入れ子と親要素・子要素（§4.1）、閉じる順序（§4.2）、交差した入れ子の誤り（§4.3）、インデント（§4.4）、よくある間違い（§4.5）。扱わない内容: DOM API、JavaScriptによるDOM操作、パーサーのエラー回復、要素固有の入れ子制約（コンテンツモデル）、兄弟関係の詳細。使用要素はp、strong、body（教材§4の登場要素）およびhtml（前提ノードhtml-010の教材草案§3で学習済み）に限定する。

### 7.3 3問のカバレッジ

| 問題ID | 到達目標 | 問題形式 | 主に測る内容 | 他問題との重複 | 重要度 |
| --- | --- | --- | --- | --- | --- |
| html-021-q1 | 親子関係の判別 | 単一選択 | 「直接の親要素」の特定（祖先との区別を含む） | q2・q3とは測定対象が異なる（構造の読み取り） | 高 |
| html-021-q2 | 正しい入れ子と交差の区別 | 単一選択 | 交差したタグの識別 | q3と閉じ順の理解を共有（再認と産出で形式が異なる） | 高 |
| html-021-q3 | 正しい閉じ順 | コード補完 | 閉じるべき要素の産出（内側から閉じる） | q2の閉じ順理解を産出形式で確認 | 中 |

確認: 到達目標の2要素（親子関係・閉じ順）を、q1（親子）とq2+q3（閉じ順）で分担する。q2とq3は同じ概念を再認と産出で二重に確認するため、閉じ順の理解は1問落としても検出できる。親子関係はq1のみに依存する（リスクは§10で記載）。

### html-021-q1

- questionId: `html-021-q1`
- nodeId: `html-021`
- quizId: `quiz-html-021`
- questionSetVersion: `quiz-html-021/v0.1`
- type: 単一選択（4択・コード提示）
- difficulty: 基礎
  - 根拠: 短い入れ子コード1つで、必要知識は「親要素＝直接包む1つ外側の要素」の定義1つ。ただし選択肢2（body）・選択肢4（html）という祖先2階層との識別に定義の正確な理解が必要なため、識別難度は完全な初歩よりわずかに高い。総合して基礎とする。
- targetObjective: 入れ子構造における親子関係の判別（quiz-assessment.md §9「親子関係…を判別できる」）
- observableBehavior: 提示コード中の`<strong>`について、直接の親要素`<p>`を、祖先（body・html）・自要素と区別して選択できる。
- prompt:

  次のHTMLで、`<strong>`要素の親要素（その要素を直接包んでいる、1つ外側の要素）はどれですか。

  ```html
  <html>
    <body>
      <p><strong>重要</strong>なお知らせです。</p>
    </body>
  </html>
  ```

- choices:
  1. `<p>`
  2. `<body>`
  3. `<strong>`
  4. `<html>`
- correctAnswer: 選択肢1 `<p>`
- acceptedAnswers: 選択肢ID一致のみ
- explanation:

  正解は`<p>`です。親要素とは、その要素を直接包んでいる1つ外側の要素のことです。`<strong>`を直接包んでいるのは`<p>`です。`<body>`と`<html>`も`<strong>`を包んでいますが、`<p>`よりさらに外側にあるため、`<strong>`から見ると親のさらに外側（祖先）であり、直接の親ではありません。`<strong>`自身は親にはなれません。復習する場合は教材「要素の中に要素を入れる（入れ子）」（pilot-material-draft.md §4.1）を読み直してください。

- misconceptionByChoice:
  - 選択肢2 `<body>`: 直接の親と祖先の区別ができていない（「包んでいる要素なら何でも親」という誤概念）。可能性: 高。本問の中心的識別対象。
  - 選択肢3 `<strong>`: 親子概念そのものが未成立（問われている関係を自要素へ帰属）。可能性: 低。
  - 選択肢4 `<html>`: 「一番外側の要素が親」という、さらに外側の祖先も親とみなす誤解。可能性: 低〜中。
- mainReviewNodeId: `html-021`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: 親子関係の誤りはhtml-021の中心概念の不足であり、html-020（開始・終了タグ）の不足と結びつける根拠が弱いため空とする（研究者設計判断）。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（html-021行）"
      usedFor: 到達目標
    - path: docs/research/03-mvp-scope.md
      section: "12ノード（html-021行、前提html-020）"
      usedFor: 前提関係の確認
  material:
    - path: docs/content/pilot-material-draft.md
      section: "4.1 要素の中に要素を入れる（入れ子）/ 4.5 よくある間違い"
      usedFor: 親要素の定義（直接包む1つ外側）、祖先との区別の説明、コード例
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: もっともらしい誤答を用い、選択肢の粒度をそろえるという一般原則の背景（§5の共通作問原則3・4）。親vs祖先という具体的な誤答設定は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
  ```

- educationalRationale: 親子関係は復習推薦（誤答→前提ノード）や後続ノード（html-031、html-040、css-021）の基盤となる概念であり、定義の正確な理解（直接性）を確認する。祖先を2階層（body・html）用意することで、誤概念「包んでいる要素なら何でも親」を選択肢2・4で検出できる。
- designDecision: 問題文に親要素の定義（「直接包んでいる、1つ外側の要素」）を再掲した。用語の記憶ではなく構造の読み取りを測るためであり、定義自体を問う問題にしない判断。監査指摘を受け、旧選択肢4（「重要」というテキスト）を`<html>`へ変更し、選択肢4つすべてを提示コード中の要素へ統一した。これに伴いコード例へ`<html>`を追加した。DOCTYPEと`<head>`は読解負荷を抑えるため省略した抜粋であり、完全な文書例として提示するものではない。
- ambiguityCheck: 正答は一意。選択肢はすべて要素で粒度が統一されており、表記差による推測の手がかりはない。定義を問題文に含めたため解釈のぶれは小さい。
- outOfScopeCheck: 使用要素はhtml・body・p・strong。html・bodyは前提ノードhtml-010（教材草案§3）で学習済み、p・strongは教材§4の登場要素。DOCTYPE・headの省略は抜粋提示のためで、配置知識は問わない。「祖先」という用語は解説内でのみ使用し、正答の判断には不要。DOM APIやツリー用語（ノード、ルート等）は不使用。
- pilotReviewPoints: 選択肢2（body）と選択肢4（html）の選択率（直接の親と祖先の区別の定着度。祖先の深さによる誤答傾向の差）。問題文中の定義再掲で十分に意味が伝わるか（分かりやすさ評価）。

### html-021-q2

- questionId: `html-021-q2`
- nodeId: `html-021`
- quizId: `quiz-html-021`
- questionSetVersion: `quiz-html-021/v0.1`
- type: 単一選択（4択・コード提示）
- difficulty: 標準
  - 根拠: 4つのコードそれぞれでタグの対応関係を追跡する必要があり、必要な照合回数が多い。交差の識別は記憶ではなく構造理解を要する。1行の短いコードで読解負荷は抑えた。
- targetObjective: 正しい入れ子と交差したタグの区別（quiz-assessment.md §9「正しい閉じ順を判別できる」）
- observableBehavior: 4つの1行コードから、タグが交差せず終了タグも揃っている正しい入れ子のものを選択できる。
- prompt:

  正しい入れ子構造になっているものはどれですか。

- choices:
  1. `<p><strong>こんにちは</strong></p>`
  2. `<p><strong>こんにちは</p></strong>`
  3. `<strong><p>こんにちは</strong></p>`
  4. `<p><strong>こんにちは</p>`
- correctAnswer: 選択肢1
- acceptedAnswers: 選択肢ID一致のみ
- explanation:

  正解は選択肢1です。入れ子にした要素は、内側（後から開始した）要素から先に閉じます。選択肢1は`<strong>`を閉じてから`<p>`を閉じており、正しい入れ子です。選択肢2と3は、外側の要素を先に閉じているため、タグの対応関係が交差しており誤りです。選択肢4は`<strong>`の終了タグがなく、要素が閉じられていません。復習する場合は教材「閉じる順序の規則」「交差した入れ子は誤り」（pilot-material-draft.md §4.2〜§4.3）を読み直してください。終了タグの書き方自体が不安な場合は、前の単元「要素とタグ」も見直してください。

- misconceptionByChoice:
  - 選択肢2: 開始した順に閉じる（先に開始したpを先に閉じる）という誤概念。交差の典型形。可能性: 高。
  - 選択肢3: 選択肢2と同じ交差誤概念の別配置（strongが外側）。開始順と閉じ順の関係が未整理。可能性: 中。
  - 選択肢4: 終了タグの書き忘れ・省略可能という誤概念（前提ノードhtml-020の内容の不足）。可能性: 中。
- mainReviewNodeId: `html-021`
- relatedPrerequisiteNodeIds: `["html-020"]`
  - 理由: 選択肢4の誤概念（終了タグの欠落を正しいとみなす）は、html-020（開始タグ・終了タグ）の理解不足に直接対応する。quiz-assessment.md §9のhtml-021補助復習候補（html-020）とも一致する。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（html-021行）/ 17. 誤答と復習ノードの対応"
      usedFor: 到達目標と補助前提ノードの設定
  material:
    - path: docs/content/pilot-material-draft.md
      section: "4.2 閉じる順序の規則 / 4.3 交差した入れ子は誤り"
      usedFor: 正答の規則と交差誤答2種。§4.3のコード例（<p><strong>重要</p></strong>）を変形して使用
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: 選択肢の形式・分量をそろえるという一般原則の背景（§5の共通作問原則4）。個々の選択肢内容は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
  ```

- educationalRationale: 交差した入れ子はMVPエラー`E_HTML_INVALID_NESTING`（主推薦html-021）として実践課題でも扱われる中心的誤りであり（docs/research/03-mvp-scope.md MVPエラー表）、確認テスト段階での検出は実践課題前の形成的評価として意義がある。
- designDecision: 選択肢4（終了タグ欠落）を入れたのは、閉じ順以前の「閉じること」自体の不足を検出し、補助復習候補html-020への推薦根拠を作るため。同じ交差でも2と3で内外を入れ替え、表面的なパターン記憶（「</p></strong>の並びは誤り」等）では選べないようにした。
- ambiguityCheck: 正答は一意。選択肢2〜4は教材草案の規則に明確に違反する。ブラウザが誤ったHTMLでも表示し得る点は教材§4.3が「正しい文書構造として扱われない」と規定済みで、「正しい入れ子構造」という設問文は教材基準で一意に解釈できる。
- outOfScopeCheck: 使用要素はp・strongのみ。パーサーのエラー回復挙動（実際にどう表示されるか）は問わない。
- pilotReviewPoints: 選択肢2と3の選択率の差（交差誤概念の方向性）。選択肢4を選んだ学習者が復習推薦（html-020）を納得できるか（復習提案の納得感評価と対応付ける）。

### html-021-q3

- questionId: `html-021-q3`
- nodeId: `html-021`
- quizId: `quiz-html-021`
- questionSetVersion: `quiz-html-021/v0.1`
- type: 短いコード補完
- difficulty: 標準
  - 根拠: 空欄位置で「どの要素を閉じるべきか」を構造から判断する必要があり、再認ではなく適用を要する。回答は1語で操作負担は小さい。
- targetObjective: 正しい閉じ順の適用（内側の要素から先に閉じる）（quiz-assessment.md §9「正しい閉じ順を判別できる」の産出的確認）
- observableBehavior: 入れ子コードの終了タグ空欄に、内側要素の名前（strong）を入力できる。
- prompt:

  次のHTMLが正しい入れ子構造になるように、空欄に入る終了タグの要素名を答えてください（例: body）。

  ```html
  <p><strong>重要</____>なお知らせです。</p>
  ```

- choices: なし（コード補完）
- correctAnswer: `strong`（正規化前の想定正答）
- acceptedAnswers:
  - 正答: `strong`
  - 正規化（案・§12参照）: 前後空白除去、小文字化して比較。
  - 許容解に含めるか要確定: `</strong>`（終了タグ全体での回答）、`/strong`。問題文で「要素名」（例: body）を指示するが、タグ形式での回答を不正解にすると採点漏れの恐れがある。KAI-15で確定が必要。
  - 不正解とする回答例: `p`（交差誤概念の産出形。記録価値が高い）。
  - 正答の一意性: 空欄の位置で開いていて閉じられていない要素はstrongのみ（pは末尾で閉じられている）であり、正しい入れ子を成立させる回答はstrongに限られ、一意である。
- explanation:

  正解は`strong`です。空欄の位置では、`<p>`と`<strong>`の2つが開いていますが、内側（後から開始した）の`<strong>`を先に閉じる必要があります。`p`と答えた場合、`<strong>`が閉じられないまま`<p>`を閉じることになり、タグが交差した誤った入れ子になります。`<p>`はコードの末尾の`</p>`で閉じられています。復習する場合は教材「閉じる順序の規則」「交差した入れ子は誤り」（pilot-material-draft.md §4.2〜§4.3）を読み直してください。

- misconceptionByChoice: （想定誤答と対応する誤概念）
  - `p`: 先に開始した要素を先に閉じるという交差誤概念（q2選択肢2と同一の誤概念の産出形）。
  - `strong`以外の要素名（`body`等）: コード中の構造を読み取れていない。
- mainReviewNodeId: `html-021`
- relatedPrerequisiteNodeIds: `["html-020"]`
  - 理由: 終了タグの概念・書式そのものが不確かな場合（無回答や要素名以外の回答）は、html-020の内容の不足に対応するため。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "11. 問題形式（短いコード補完・正規化候補）/ 9. ノード別到達目標（html-021行）"
      usedFor: 形式・正規化方針・到達目標
  material:
    - path: docs/content/pilot-material-draft.md
      section: "4.2 閉じる順序の規則"
      usedFor: 正答規則とコード題材（§4.1のコード例を変形）
  academic:
    - title: Test-Enhanced Learning
      author: Roediger & Karpicke
      year: 2006
      doiOrUrl: https://doi.org/10.1111/j.1467-9280.2006.01693.x
      verificationLevel: 書誌情報・要旨確認（quiz-assessment.md §27引き継ぎ）
      usedFor: 想起・産出型の確認を含めること自体の一般的背景。再認（q2）と産出（本問）の組み合わせという具体的構成は研究者設計判断
      limitation: 本問の学習効果を実証するものではない
  ```

- educationalRationale: q2（再認）と対になる産出問題。誤答`p`が交差誤概念の直接証拠になるため、予備試行の「同じ誤答の再発」観察（q2で選択肢2を選び、q3でpと答えるか）に使える。
- designDecision: 空欄を終了タグの要素名部分（`</____>`）に限定し、回答を記号なし1語にした（採点の機械化と、html-010-q3・css-011-q3との回答形式統一のため）。例示は`body`とし、想定誤答`p`を例に使わないようにした。
- ambiguityCheck: 正答は一意（上記）。空欄の後にテキスト「なお知らせです。」が続くため、「そこで一旦strongだけを閉じる」ことが構造上必然であり、複数解は成立しない。
- outOfScopeCheck: 使用要素はp・strongのみ。教材§4.1のコード例とほぼ同一。
- pilotReviewPoints: 誤答`p`の発生率とq2選択肢2との相関。タグ形式回答（`</strong>`）の発生率（許容解仕様の確定材料）。無回答率。

## 8. css-011

### 8.1 到達目標

- 正本（quiz-assessment.md §9）: セレクタ、プロパティ、値、波括弧、セミコロンの役割を判別できる。
- ノード定義（learningNodes.ts）: CSS基本構文(セレクタ / プロパティ / 値)。基本形と; {} の意味を理解して書ける。
- 前提ノード: `css-010`（CSSの適用方法）。補助復習候補（§9）: `css-010`。
- 補足: D-003により色指定はcss-011の教材内で扱う（教材草案§5.4〜§5.5）。

### 8.2 教材範囲

`docs/content/pilot-material-draft.md` §5（css-011: CSS基本構文）。扱う内容: ルールセットの基本形と各部の役割（§5.1）、複数宣言とセミコロン（§5.2）、記号の書き間違い（§5.3）、色名指定（§5.4）、使用プロパティはcolorとfont-sizeのみ（§5.5）。扱わない内容: 詳細度、継承、カスケード、擬似クラス、ベンダープレフィックス、16進カラーコード、§5.5以外のプロパティ。

### 8.3 3問のカバレッジ

| 問題ID | 到達目標 | 問題形式 | 主に測る内容 | 他問題との重複 | 重要度 |
| --- | --- | --- | --- | --- | --- |
| css-011-q1 | 構成部位の役割判別 | 単一選択 | セレクタ（＝適用対象の指定）とプロパティ・値・波括弧の区別 | q3とプロパティの役割理解を部分共有 | 高 |
| css-011-q2 | 記号を含む正しい構文の判別 | 単一選択 | コロン・波括弧・ルールセット構造の正誤識別 | q1と部位の役割理解を前提として共有するが、測定対象は記号・構造 | 高 |
| css-011-q3 | 代表プロパティ名の語彙産出（補助） | コード補完 | 目的（文字色変更）に対応するプロパティ名colorの語彙産出（CSS構文理解全体の測定ではない） | q1の役割理解を産出形式で部分確認 | 中 |

確認: 到達目標の5要素（セレクタ・プロパティ・値・波括弧・セミコロン）のうち、セレクタはq1、波括弧・コロンはq2、プロパティはq1（再認）とq3（産出）でカバーする。セミコロンはq2の正答コード内に登場するが、単独の測定問題はない（3問制約下の取捨。リスクは§10で記載）。

### css-011-q1

- questionId: `css-011-q1`
- nodeId: `css-011`
- quizId: `quiz-css-011`
- questionSetVersion: `quiz-css-011/v0.1`
- type: 単一選択（4択・コード提示）
- difficulty: 基礎
  - 根拠: 必要知識は「セレクタ＝適用対象の指定」の1つで、3行の最小コードから該当部分を選ぶだけであり、識別難度・認知負荷とも低い。
- targetObjective: CSSルールセットの構成部位（特にセレクタ）の役割判別（quiz-assessment.md §9「セレクタ、プロパティ、値、波括弧、セミコロンの役割を判別できる」）
- observableBehavior: 提示ルールセット中で「どのHTML要素に適用するか」を指定している部分としてセレクタ（p）を選択できる。
- prompt:

  次のCSSで、「どのHTML要素に適用するか」を指定している部分はどれですか。

  ```css
  p {
    color: red;
  }
  ```

- choices:
  1. `p`
  2. `color`
  3. `red`
  4. `{ }`
- correctAnswer: 選択肢1 `p`
- acceptedAnswers: 選択肢ID一致のみ
- explanation:

  正解は`p`です。この部分をセレクタと呼び、どのHTML要素にスタイルを適用するかを指定します（この例ではp要素、つまり段落）。`color`はプロパティで「何を変えるか」（文字の色）、`red`は値で「どう変えるか」（赤に）を指定します。`{ }`（波括弧）は、そのセレクタに適用する宣言のまとまりを囲む記号です。復習する場合は教材「CSSルールセットの基本形」（pilot-material-draft.md §5.1）の表を読み直してください。

- misconceptionByChoice:
  - 選択肢2 `color`: プロパティ（何を変えるか）と適用対象の混同。「colorがpの見た目を決めるのだから対象を指定している」という理解の混線。可能性: 中。
  - 選択肢3 `red`: 値と適用対象の混同。役割区別が未成立。可能性: 低。
  - 選択肢4 `{ }`: 「波括弧の中がすべて」という漠然とした理解で、部位ごとの役割分担が未成立。可能性: 低〜中。
- mainReviewNodeId: `css-011`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: 構文部位の役割混同はcss-011の中心概念の不足であり、css-010（適用方法: 外部・内部・インライン）の不足と結びつける根拠が弱いため空とする（研究者設計判断）。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（css-011行）"
      usedFor: 到達目標
    - path: docs/research/03-mvp-scope.md
      section: "CSS色指定（D-003）"
      usedFor: colorプロパティを教材・問題で扱う根拠
  material:
    - path: docs/content/pilot-material-draft.md
      section: "5.1 CSSルールセットの基本形"
      usedFor: コード例と各部位の役割定義（§5.1の表と同一のコードを使用）
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: 選択肢粒度の統一という一般原則の背景（§5の共通作問原則4）。同一コード内の構成部位でそろえる構成は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
  ```

- educationalRationale: セレクタの役割理解は次ノードcss-020（基本セレクタ）の前提であり、ここでの誤答は後続学習のつまずきを予告する。部位名の暗記ではなく機能（「どの要素に適用するか」）で問い、用語と機能の対応を確認する。
- designDecision: 選択肢はすべて提示コード内の実際の部位とし、コード外の用語（「セレクタ」「プロパティ」等の用語自体）を選ばせる形式にしなかった。用語の暗記でなく機能の理解を測るため。教材§5.1の表と同一コードを使うことで教材整合を最大化した。
- ambiguityCheck: 正答は一意。「どのHTML要素に適用するか」は教材§5.1のセレクタの役割定義と同一文言であり、解釈のぶれは小さい。
- outOfScopeCheck: 使用プロパティはcolorのみ（教材§5.5の範囲内）。セレクタは要素セレクタpのみで、class/idセレクタ（css-020の内容）は不使用。
- pilotReviewPoints: 選択肢2（color）の選択率（プロパティと適用対象の混同の頻度）。教材§5.1の表を読んだ直後の正答率として妥当か。

### css-011-q2

- questionId: `css-011-q2`
- nodeId: `css-011`
- quizId: `quiz-css-011`
- questionSetVersion: `quiz-css-011/v0.1`
- type: 単一選択（4択・コード提示）
- difficulty: 標準
  - 根拠: 4つのコードで記号（コロン・括弧種）と構造（セレクタ位置）を照合する必要があり、必要知識数が複数（コロン、波括弧、ルールセット構造）。差分が1文字レベルのため注意深い読み取りが必要。
- targetObjective: コロン・波括弧・ルールセット構造の役割判別（quiz-assessment.md §9の波括弧・（コロンを含む）構文役割）
- observableBehavior: 4つの1行CSSから、記号と構造が正しいものを選択できる。
- prompt:

  段落（p要素）の文字色を赤にするCSSとして、書き方が正しいものはどれですか。

- choices:
  1. `p { color: red; }`
  2. `p { color = red; }`
  3. `p ( color: red; )`
  4. `{ p color: red; }`
- correctAnswer: 選択肢1
- acceptedAnswers: 選択肢ID一致のみ
- explanation:

  正解は選択肢1です。CSSは「セレクタ { プロパティ: 値; }」の形で書きます。選択肢2は、プロパティと値の区切りに等号（=）を使っていますが、CSSではコロン（:）を使います。選択肢3は、宣言のまとまりを丸括弧（ ( ) ）で囲んでいますが、CSSでは波括弧（ { } ）を使います。選択肢4は、セレクタpが波括弧の中に入っていますが、セレクタは波括弧の外（前）に書きます。復習する場合は教材「CSSルールセットの基本形」「記号の書き間違いに注意」（pilot-material-draft.md §5.1、§5.3）を読み直してください。

- misconceptionByChoice:
  - 選択肢2 `=`: 「設定は＝で書く」という他の記法（プログラミング言語の代入、HTML属性のname="value"等）との混同。可能性: 高。HTML属性の書式（html-022）を先に見た学習者にも生じやすい。
  - 選択肢3 `( )`: 括弧の種類の未定着（丸括弧・波括弧の混同）。可能性: 中。
  - 選択肢4 セレクタ内包: ルールセットの構造（セレクタが外、宣言が中）の誤解。可能性: 低〜中。
- mainReviewNodeId: `css-011`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: 記号・構造の誤りはcss-011固有の内容であり、css-010の不足と結びつける根拠が弱いため空とする（研究者設計判断）。なお選択肢2の誤概念はhtml-022（属性）との混同にも関係し得るが、html-022はcss-011の前提ノードではないため（03-mvp-scope.md）、補助推薦には設定しない。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "9. ノード別到達目標（css-011行）"
      usedFor: 到達目標
    - path: docs/research/03-mvp-scope.md
      section: "MVPエラー（E_CSS_SYNTAX_MISSING_SEMICOLON 主推薦css-011）"
      usedFor: CSS構文エラーがcss-011の復習対象であることの確認
  material:
    - path: docs/content/pilot-material-draft.md
      section: "5.1 CSSルールセットの基本形 / 5.3 記号の書き間違いに注意 / 5.6 よくある間違い"
      usedFor: 正答の構文と誤答3種（等号・丸括弧・セレクタ内包）。いずれも§5.3・§5.6に明示
  academic:
    - title: A Review of Multiple-Choice Item-Writing Guidelines for Classroom Assessment
      author: Haladyna, Downing & Rodriguez
      year: 2002
      doiOrUrl: https://doi.org/10.1207/S15324818AME1503_5
      verificationLevel: 書誌情報・要旨のみ確認
      usedFor: 選択肢の形式・分量をそろえるという一般原則の背景（§5の共通作問原則4）。個々の選択肢内容は研究者設計判断
      limitation: この問題の正答や選択肢数を直接決めるものではない
  ```

- educationalRationale: CSS構文の記号誤りはMVPエラー`E_CSS_SYNTAX_MISSING_SEMICOLON`（主推薦css-011）として実践課題でも扱われる領域であり、実践前の形成的評価として構文の正誤識別を確認する。
- designDecision: セミコロン欠落（`p { color: red }`）を誤答選択肢にしなかったのは、CSS仕様上、最後の宣言のセミコロンは省略可能で技術的に有効なCSSとなり、複数正答が成立してしまうため（教材草案§5.2の補足でも「省略できる場合もある」と記載）。セミコロンの理解はq2の正答コード内での提示と解説に留め、単独問題化は12ノード展開時の検討事項とする。
- ambiguityCheck: 正答は一意。選択肢2〜4はいずれもCSSとして無効であり、教材基準でも技術基準でも誤り。上記のとおりセミコロン省略形を意図的に排除して一意性を確保した。
- outOfScopeCheck: 使用プロパティはcolor、値は色名redのみ（教材§5.4〜§5.5の範囲内）。詳細度・継承等は不使用。
- pilotReviewPoints: 選択肢2（等号）の選択率（他記法との混同の頻度）。1文字レベルの差分をUI上で識別できるか（コード表示の可読性）。

### css-011-q3

- questionId: `css-011-q3`
- nodeId: `css-011`
- quizId: `quiz-css-011`
- questionSetVersion: `quiz-css-011/v0.1`
- type: 短いコード補完
- difficulty: 標準
  - 根拠: 目的（文字色を青に）からプロパティ名を想起・産出する必要があり、再認より要求水準が高い。回答は1語で操作負担は小さい。
- targetObjective: 教材で扱う代表的なプロパティ名colorを、目的（文字色の変更）に応じて産出できるかを補助的に確認する（ノード定義summary「書ける」への部分的対応）。本問はCSS構文理解全体を測定するものではない。
- observableBehavior: 文字色を変える宣言の空欄に、プロパティ名「color」を入力できる。
- prompt:

  段落（p要素）の文字の色を青にするCSSになるように、空欄に入るプロパティ名を答えてください（例: font-size）。

  ```css
  p {
    ____: blue;
  }
  ```

- choices: なし（コード補完）
- correctAnswer: `color`（正規化前の想定正答）
- acceptedAnswers:
  - 正答: `color`
  - 正規化（案・§12参照）: 前後空白除去、小文字化して比較（CSSのプロパティ名は大文字小文字を区別しないため`COLOR`等も正答扱い）。
  - 許容解に含めるか要確定: `color:`（コロン付き回答）。空欄の直後にコロンが提示されているため原則不要だが、含めて回答する学習者の発生が予想される。KAI-15で確定が必要。
  - 不正解とする回答例: `colour`（綴り誤り。綴りの正確さも「書ける」の一部として不正解とする案。要研究者確認）、`font-color`、`text-color`（存在しないプロパティ名の推測。誤概念として記録価値がある）。
  - 正答の一意性: 教材草案§5.5はこの単元で使うプロパティをcolorとfont-sizeの2つに限定しており、「文字の色を変える」に対応するのはcolorのみで、教材範囲内で一意である。（CSS全体では文字色に影響する他の手段が存在し得るが、教材範囲外であり、採点は許容解集合との一致で行うため一意性は保たれる。）
- explanation:

  正解は`color`です。文字の色は`color`プロパティで指定します。「プロパティ: 値;」の形で、`color: blue;`と書くと文字が青になります。`font-color`や`text-color`というプロパティはCSSにはありません。値（blue）の側は「どう変えるか」、プロパティ（color）の側は「何を変えるか」を受け持つ、という役割の違いも確認してください。復習する場合は教材「色の指定」「この単元で使うプロパティ」（pilot-material-draft.md §5.4〜§5.5）を読み直してください。

- misconceptionByChoice: （想定誤答と対応する誤概念）
  - `font-color`・`text-color`: 「英語として自然な名前」からの推測で、プロパティ名は決められた語彙であることの未定着。
  - `blue`系の回答（値の再記入）: プロパティと値の役割区別の未成立（q1選択肢3と同一の誤概念の産出形）。
- mainReviewNodeId: `css-011`
- relatedPrerequisiteNodeIds: `[]`
  - 理由: プロパティ語彙・役割の誤りはcss-011の内容であり、css-010の不足と結びつける根拠が弱いため空とする（研究者設計判断）。
- sourceReferences:

  ```yaml
  project:
    - path: docs/architecture/quiz-assessment.md
      section: "11. 問題形式（短いコード補完・正規化候補）/ 9. ノード別到達目標（css-011行）"
      usedFor: 形式・正規化方針・到達目標
    - path: docs/research/03-mvp-scope.md
      section: "CSS色指定（D-003）"
      usedFor: 色指定をcss-011の問題で扱う根拠
  material:
    - path: docs/content/pilot-material-draft.md
      section: "5.4 色の指定 / 5.5 この単元で使うプロパティ"
      usedFor: 正答（color）、値（blue）、正答一意性の根拠（プロパティ2つへの限定）
  academic:
    - title: Test-Enhanced Learning
      author: Roediger & Karpicke
      year: 2006
      doiOrUrl: https://doi.org/10.1111/j.1467-9280.2006.01693.x
      verificationLevel: 書誌情報・要旨確認（quiz-assessment.md §27引き継ぎ）
      usedFor: 想起・産出型の確認を含めること自体の一般的背景。再認2問＋産出1問という具体的構成の直接根拠ではない（構成は§5の共通作問原則と研究者設計判断による）
      limitation: 本問の学習効果を実証するものではない
  ```

- educationalRationale: 本問はプロパティ名（color）の語彙記憶を含む補助問題であり、CSS構文理解全体を単独で測定するものではない。colorを知っていることと構文理解全体は同義ではないため、構成部位の役割（q1）・記号と構造（q2）と組み合わせて、形成的評価の補助問題として解釈する。プロパティ名が決められた語彙であること（推測で作れないこと）の確認は、実践課題でのCSS記述に直結する。
- designDecision: 空欄をプロパティ位置にした（値位置で`blue`を書かせる案と比較し、色名の語彙よりも「何を変えるか＝プロパティ」の理解の方が到達目標に近いと判断）。例示に`font-size`を使ったのは、教材§5.5記載の実在プロパティで回答形式を示しつつ、「文字の色」という設問に対する正答にならないため。綴り誤り（colour）を不正解とする扱いは要研究者確認。
- ambiguityCheck: 正答は許容解集合との一致で一意。「文字の色」という表現で背景色等との混同を避けた。
- outOfScopeCheck: プロパティ・値とも教材§5.4〜§5.5の範囲内。16進カラーコードは不使用。
- pilotReviewPoints: `font-color`等の推測回答の発生率。綴り誤りの発生率（許容解仕様の確定材料）。無回答率。

## 9. 9問全体のカバレッジ表

| 問題ID | ノード | 到達目標 | 形式 | 難易度 | 主に測る内容 | 他問題との重複 | 重要度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| html-010-q1 | html-010 | 役割判別 | 単一選択 | 基礎 | bodyと他要素の役割区別 | q3と役割理解を部分共有 | 高 |
| html-010-q2 | html-010 | 配置判別 | 単一選択 | 標準 | 4構成要素の配置関係 | なし（配置は本問のみ） | 高 |
| html-010-q3 | html-010 | 役割の産出 | コード補完 | 標準 | 骨格に欠けるheadの産出 | q1と役割理解を共有 | 中 |
| html-021-q1 | html-021 | 親子関係 | 単一選択 | 基礎 | 直接の親の特定 | なし（親子は本問のみ） | 高 |
| html-021-q2 | html-021 | 交差の識別 | 単一選択 | 標準 | 正しい入れ子と交差の区別 | q3と閉じ順理解を共有 | 高 |
| html-021-q3 | html-021 | 閉じ順の適用 | コード補完 | 標準 | 閉じるべき要素の産出 | q2と閉じ順理解を共有 | 中 |
| css-011-q1 | css-011 | 部位の役割 | 単一選択 | 基礎 | セレクタの機能の特定 | q3と部位役割を部分共有 | 高 |
| css-011-q2 | css-011 | 記号・構造 | 単一選択 | 標準 | コロン・波括弧・構造の正誤 | なし（記号は本問のみ） | 高 |
| css-011-q3 | css-011 | プロパティ名の語彙産出（補助） | コード補完 | 標準 | colorの語彙産出（構文理解全体の測定ではない） | q1と部位役割を部分共有 | 中 |

全体確認:

- 同一知識の3問重複はない。各ノードとも「概念1問＋概念2問目（別要素）または再認・産出ペア」の構成である。
- 形式は全ノードで単一選択2問＋コード補完1問、難易度は基礎1問＋標準2問で、quiz-assessment.mdの第一候補構成に一致する。「やや難しい」は使用しない。
- コード補完3問の回答はすべて記号なしの1語（head / strong / color）で、正規化規則を共通化できる。
- コード補完が文字暗記にならないかの確認: html-010-q3は骨格に欠けている要素を役割から特定する必要があり、html-021-q3は構造から閉じ順を判断する必要がある。css-011-q3はプロパティ語彙の想起要素が最も強く、暗記寄りの補助問題である（測定対象を語彙産出に限定して§10の監査で明記）。

## 10. 問題品質監査

自己監査結果（作問者による。研究者の独立監査を要する）:

| 問題ID | 到達目標対応 | 教材範囲内 | 正答一意 | 初学者向け | 誤答根拠あり | 解説十分 | 復習先妥当 | 要修正 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| html-010-q1 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| html-010-q2 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| html-010-q3 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認（監査指摘の1回答形式へ変更済み） |
| html-021-q1 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認（選択肢を要素へ統一済み） |
| html-021-q2 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| html-021-q3 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| css-011-q1 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| css-011-q2 | ○ | ○（草案基準） | ○ | ○ | ○ | ○ | ○ | 要研究者確認 |
| css-011-q3 | ○（語彙産出に限定） | ○（草案基準） | ○（許容解集合基準） | ○ | ○ | ○ | ○ | 要研究者確認（綴り誤りの扱い。語彙記憶を含む補助問題） |

[重要] 「教材範囲内○」はすべて未承認の教材草案（pilot-material-draft.md）基準である。教材草案が承認・修正されるまで、全9問を「要研究者確認」とし、完成扱いにしない。

追加確認項目:

- 正答が問題文から推測できないか: 各問題の例示語（body、font-size等）が正答と重複しないことを確認した。html-010-q3は正答となる要素をコード中に含めない形式であり、転記では答えられない。
- 正答だけ表現が異ならないか・選択肢の長さの偏り: 全単一選択で選択肢を同形式（タグ表記、1行コード、部位表記）にそろえた。html-021-q1は監査指摘を受けて選択肢をすべて要素へ統一し、粒度差を解消した。
- 複数正答の可能性: css-011-q2でセミコロン省略形を意図的に排除した（designDecision参照）。他の問題も教材基準で一意であることを個別に確認した。
- HTML/CSSとしての技術的正確性: 各正答コードはHTML/CSSとして有効である。html-010-q2のacceptedAnswers外の論点（head省略等の実仕様上の許容）はambiguityCheckに記録し、教材の規範に従うと明記した。
- 教材にない前提の要求: 使用要素・プロパティを教材草案の登場範囲（html/head/body/title/p/strong、color/font-size、色名red/blue）に限定した。
- 誤答が意味不明な文字列でないか: 全誤答選択肢・想定誤答に対応する誤概念を明記した。
- 解説が誤概念修正につながるか: 全解説が「正答理由＋各誤答の問題点＋復習先の節」を含む。
- 2/3合格との整合: 各ノードで中心概念を2問以上に分散させた（html-010: 役割をq1・q3、html-021: 閉じ順をq2・q3、css-011: 部位役割をq1・q3）。ただし次のリスクが残る。

2/3合格に関するリスク報告（問題変更ではなく報告として記録する）:

1. html-010: DOCTYPEと配置の理解はq2のみに依存する。q2だけを落として合格した学習者は、配置理解が未確認のまま進む可能性がある。
2. html-021: 親子関係の理解はq1のみに依存する。q1だけを落として合格した場合、親子概念が未確認のままcss-021等の後続へ進む。
3. css-011: セミコロンの役割を単独で測る問題がなく、3問合格でもセミコロン理解の直接証拠は得られない（実践課題の`E_CSS_SYNTAX_MISSING_SEMICOLON`検出が補完的役割を担う）。
4. 単一選択4択2問の偶然正解確率は無視できない（2問とも偶然正解する確率は1/16。コード補完を含め3問中2問を偶然で満たす確率はそれより低いが0ではない）。3問構成では排除できず、quiz-assessment.md §26の既知リスク（予備試行で確認）に含まれる。

## 11. 予備試行で確認する事項

quiz-assessment.md §30.1の取得項目案に対応させ、3段階で確認する。

### 11.1 問題ごと

- 正答率、選択肢別回答率（単一選択）、誤答内容の分布（コード補完）、無回答率、所要時間
- 各問題のpilotReviewPoints（各問題の項参照）。特に、コード補完3問での形式外回答（`<head>`、`</strong>`、`color:`等）の発生率は許容解仕様（§12）の確定材料とする
- 問題文の分かりやすさ・難易度の主観評価（5件法案。質問文は評価計画側で確定）
- 同一誤概念ペア（html-021-q2選択肢2とq3誤答`p`）の共起

### 11.2 ノードごと

- 合格率（2/3基準）、再受験回数、再受験時の同じ誤答の再発
- 3問合計の所要時間（1ノード5分以内に収まるかを目安とする。この目安は文献基準ではなく予備試行運用上の暫定判断である）
- 不合格時の復習提案（主推薦＝対象ノード、補助推薦＝html-021-q2/q3のhtml-020、html-010-q1のhtml-000）の納得感
- 解説の分かりやすさ、解説を読んでから再受験するフローの負担

### 11.3 全体

- 9問合計の所要時間、UI操作負担（コード表示の読みやすさ、1行入力欄の使いやすさ）
- コード補完の採点漏れ（正答意図が明らかな回答が不正解になった件数）と許容解不足の洗い出し
- 2/3合格の甘さ・厳しさの所感（自由記述）
- 難易度分布（基礎1＋標準2）の体感との一致

修正判断の目安（いずれも文献上の確立基準ではなく、予備試行用の暫定判断である。3〜5名規模では統計的判断はできず、個別の回答理由の聞き取りを優先する）:

- 全員が誤答した問題、特定の誤答選択肢に全員が集中した問題は、問題文・選択肢・教材のいずれかの欠陥を疑い、内容を見直す。
- 正答意図が明らかな回答が採点漏れになった場合は、許容解集合または正規化規則を修正する。
- 無回答が続出したコード補完は、設問文の指示（回答形式の例示）を見直す。

## 12. 未確定事項

以下はKAI-15の後続作業または研究者・指導教員の確定が必要な事項である。本試作では確定しない。

1. 短いコード補完の正規化規則（quiz-assessment.md §11はKAI-15または実装Issueで確定と規定）。本試作の提案は次のとおり:
   - 前後空白: 除去する
   - 大文字・小文字: 小文字化して比較する（HTMLタグ名・CSSプロパティ名は大文字小文字を区別しないため）
   - 改行: 1行入力UIとし、回答に改行を含めない
   - 連続空白: 正答が1語のため、内部に空白を含む回答は不正解とする
   - 引用符: 正答に引用符を含まないため規則不要
   - セミコロン: 回答に含めない設計としたが、`color:`・`color;`等の記号付き回答の扱いは未確定
   - 山括弧・スラッシュ付き回答（`<head>`、`</strong>`）を許容解に含めるか: 未確定
   - 代替構文: なし（全問とも正答は一意の1語）
2. 教材本文草案（pilot-material-draft.md）の研究者レビューと承認。承認前に問題の教材整合を確定できない。
3. （監査対応済み）html-010-q3の旧形式（空欄2箇所・同一語1解答）は、監査指摘を受けて骨格に欠けている要素名を問う1回答形式へ変更し、形式上の未確定は解消した。記号付き回答（`<head>`等）の許容解の扱いは1.のとおり未確定のまま残る。
4. css-011-q3で綴り誤り（colour等）を不正解とする扱い。
5. （監査対応済み）html-021-q1の選択肢は、監査指摘を受けてすべて要素（`<p>`・`<body>`・`<strong>`・`<html>`）へ統一し、粒度差を解消した。
6. questionSetVersion `v0.1`の運用（予備試行後の修正でv0.2へ上げる等の版運用規則）。
7. 問題データのファイル形式・配置（TypeScript/JSON、`src/data/`配下等）。本試作は仕様書のみであり、データ化はUI実装と併せてKAI-15の後続作業とする。
8. 予備試行の実施人数・手順（QA-18。指導教員確認後に確定）。
9. 確認テスト規則（3問・2/3合格・2形式・無制限再受験等）は、研究者採否と指導教員確認を経て初期仕様として承認済みであり、KAI-11はDoneである。ただしQA-03/QA-05/QA-07は予備試行結果に基づいて見直し得るため、見直しが行われた場合は本試作の9問の再設計が必要になる。また、承認状態のmain上の正本文書への反映（quiz-assessment.mdの状態表記更新、OQ-006の状態更新、D-018の正式追加）は本PRの対象外として残っている（§2の状態同期注記参照）。

## 13. 研究者レビュー欄

（研究者本人が記入する。本試作の採否・修正指示・教材草案の承認可否を記録する。）

| 対象 | 判断（採用/修正/差し戻し） | 指示・理由 | 日付 |
| --- | --- | --- | --- |
| 教材草案 pilot-material-draft.md | | | |
| html-010-q1 | | | |
| html-010-q2 | | | |
| html-010-q3 | | | |
| html-021-q1 | | | |
| html-021-q2 | | | |
| html-021-q3 | | | |
| css-011-q1 | | | |
| css-011-q2 | | | |
| css-011-q3 | | | |
| 正規化規則案（§12-1） | | | |
