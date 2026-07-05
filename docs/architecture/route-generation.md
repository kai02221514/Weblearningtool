# ルート生成仕様（Phase 3: OQ-004 / OQ-005）

> 状態: [承認済み仕様] 本文書はPhase 3「中核仕様確定支援」において研究者本人が承認した、診断規則およびルート生成規則の正本仕様である。
> DG-08（診断必須化・誘導タイミング・完了状態保存）はOQ-009へ移管し、本書では未確定事項として残す。
> 旧`docs/references/route-generation-spec-draft.md`はOQ-005検討用たたき台（D-012）であり、本文書は同たたき台の項目別採否判断を経て確定した後継仕様である。

- 作成日: 2026-07-03
- 作成者: Claude（研究補助・仕様整理担当）
- 仕様版: `route-spec/1.0`
- 対象Issue: Linear `KAI-9`（OQ-004）、`KAI-10`（OQ-005）
- 根拠文書: `docs/research/02-open-questions.md`（OQ-004/OQ-005/OQ-009）、`docs/research/03-mvp-scope.md`、`docs/research/04-learning-model.md`、`docs/research/09-decision-log.md`（D-001/D-002/D-012/D-014/D-015/D-016/D-017）、`docs/operations/ai-research-development-roadmap.md` Phase 3
- 作成時点の`main`: `e3c8378`（docs: record phase 2 closure commit）
- 承認者: 北代櫂
- 承認日: 2026-07-03

---

## 0. 本書の位置づけと状態ラベル

- [承認済み仕様] の項目は、D-016またはD-017として正式採用済みの仕様である。
- [保留] の項目は、OQ-009または後続Issueで扱う未確定事項である。
- [確認済み事実]・[コード存在確認済み] は、2026-07-03に現行コードから確認した実装事実であり、研究仕様の正解を意味しない。
- [確定事項] は既存正本文書で確定済みの前提であり、本書では変更しない。
- 本仕様の採用根拠は`09-decision-log.md`のD-016（診断規則）およびD-017（ルート生成規則）に記録する。

### 0.1 本書が前提とする確定事項

- [確定事項] MVPはHTML 7 + CSS 5の12ノード（D-001）。前提関係は`docs/research/03-mvp-scope.md`の表に従い、12ノード内で閉じる。
- [確定事項] 正規ノードID `^(html|css)-[0-9]{3}$`（D-002）。
- [確定事項] 初期診断の結果を開始ノードまたは初期ルートの決定に利用する（`01-confirmed-decisions.md`「学習モデル」）。
- [確定事項] 推薦候補はMVP集合内の未完了ノードを基本とし、前提関係を考慮する。前提未完了ノードを直接推薦せず、必要時は前提ノードを候補へ補完する（`04-learning-model.md`）。
- [確定事項] 各推薦は、入力事実、適用規則、推薦ノードの関係を追跡できなければならない（`04-learning-model.md`「説明可能性」）。
- [確定事項] AI/LLMをルート生成の必須実行基盤にしない。同一入力に対して同一出力（再現性）を優先する。

### 0.2 現行実装の確認結果（実装事実であり仕様ではない）

- [コード存在確認済み] `src/data/questionConfig.ts`: 診断9項目。各項目に`weight`（2, 3, 4, 0, 5, 5, 6, 4, 3）、各選択肢に`score`（0〜3）。
- [コード存在確認済み] `src/components/SignupSurvey.tsx` `calculateScore`: 合計点 = Σ(選択肢score × 項目weight)。`determineLevel`: 24点以上でadvanced、17点以上でintermediate、10点以上でbeginner、未満もbeginner。
- [コード存在確認済み] 同ファイル`conditionalQuestionIds`: `programming_experience`が`yes`でない場合、`skill_errors`、`rule_confidence`、`knowledge_concept`、`error_handling`、`learning_anxiety`の5項目は非表示となり加点されない。この場合の理論上の最大得点は23点（background 6 + learning_goal 9 + available_time 8）であり、経験なし回答者はadvancedに到達できない。これは設計判断の記録がない実装アーティファクトである。
- [コード存在確認済み] `src/App.tsx`: `recommendedStartNodeIds`は固定値`['html-010']`。診断結果（`level`、`levelScore`）はルート決定に接続されていない。初期`progress`にデモ値（`completedNodeIds: ['html-000']`等）が混入している。
- [コード存在確認済み] `src/components/Dashboard.tsx`: 前提未完了チェック（`checkPrerequisites`）は存在するが、順序付け・理由情報・版管理はない。
- [注意] 上記の点数・境界・固定値を研究仕様として追認しない（OQ-004注記、D-012と同旨）。

### 0.3 研究者承認結果

- 採用した診断規則: DG-01、DG-02、DG-03、DG-04、DG-05、DG-06、DG-07、DG-09、DG-10。
- 保留した診断規則: DG-08。診断必須化・誘導タイミング・完了状態保存がOQ-009へ依存するため、OQ-009へ移管する。
- 採用したルート生成規則: RT-01、RT-03、RT-04、RT-05、RT-06、RT-08、RT-09、RT-10、RT-11、RT-12。
- 修正採用したルート生成規則: RT-02（ルート生成結果の版情報として`specVersion`、`catalogVersion`、`dataVersion`を必須化し、`generatedAt`は保存・評価ログ記録層のメタ情報としてOQ-009へ接続）、RT-07（復習解除を原因単位で管理）。
- 本仕様は、学習効果や固定ルートに対する優位性を主張しない。開始候補2件、上位3件提示、6段階優先順位、エラーをテストより上位に置く判断は、文献上の事実ではなくMVP向けの研究者設計判断である。

---

## 1. 採否記録（KAI-9 / OQ-004: 診断規則・開始ノード規則）

| 論点ID | 論点 | 承認結果 | 根拠 | 選択肢 | 推奨案 | 推奨理由 | 研究上の影響 | 実装上の影響 | 評価上の影響 | 判断者 |
|---|---|---|---|---|---|---|---|---|---|---|
| DG-01 | 診断項目セット | 採用。K群/S群/A群へ分類 | OQ-004、questionConfig.ts | A: 現行9項目維持 / B: 知識系5項目＋属性系を分離 / C: 再設計 | B | 開始ノード決定に使う項目と評価分析用項目を分離し、各項目の研究上の役割を明示できる | 診断の説明可能性が向上 | questionConfig構造は流用可 | 項目と評価観点の対応が明確化 | 研究者本人（指導教員確認推奨） |
| DG-02 | 属性項目（立場・目的・時間・不安）のルート利用 | 採用。S群・A群は開始判定に使用しない | questionConfig.ts | A: ルート決定に使用 / B: 収集するがルート決定に不使用（分析・記述統計用） | B | 立場や目的で開始位置を変える教育学的根拠を示せない。開始位置は知識・技能状態で決めるべき（先行知識が学習成果の主要予測因子: Dochy et al. 1999） | 診断根拠の妥当性向上 | スコア計算から除外 | 属性は参加者記述・群分け分析に使用 | 研究者本人 |
| DG-03 | スコア化・重み付けの要否 | 採用。K群3項目の決定表を使用 | SignupSurvey.tsx | A: 重み付き合算維持 / B: 少数項目の決定表（スコア化しない） / C: 項目応答理論等 | B | 12ノード・開始2候補の規模で重み付き合算は過剰。決定表は境界値の恣意性を排除し、判定過程をそのまま説明として提示できる | 重み妥当性の立証責任が消える | 純粋関数の単純な分岐 | 「なぜこの開始位置か」を評価協力者へ説明可能 | 研究者本人 |
| DG-04 | レベル境界（24/17/10） | 採用。現行境界値は開始判定に使用しない | SignupSurvey.tsx | A: 追認 / B: 不採用（決定表へ置換） | B | 境界の教育的根拠がなく、経験なし回答者がadvancedへ到達不能という実装アーティファクトがある | 根拠のない境界を仕様化しない | determineLevelは廃止または表示専用化 | レベルラベルを評価指標にしない | 研究者本人 |
| DG-05 | 開始ノード候補集合 | 採用。候補は`html-000`と`html-010` | App.tsx | A: {html-000}のみ（全員同一） / B: {html-000, html-010}の2候補 / C: 3候補以上（css系含む） | B | Aでは診断が開始ノードへ影響せず個別化の最小要件を欠く。Cは自己申告の過大評価（Kruger & Dunning 1999）で初学者を途中へ飛ばす危険。Bは診断差を表現しつつ最大1ノードのスキップに制限 | RQの個別化主張の最小根拠 | 決定表2〜4分岐 | 診断差による開始差を評価で観察可能 | 研究者本人（指導教員確認推奨） |
| DG-06 | スキップ扱いノードの状態 | 採用。`assumedNodeIds`を導入 | — | A: 完了扱い（completedへ追加） / B: 習得仮定（assumed）として分離し、反証で取り消す | B | 自己申告のみで修了扱いにしない方針（旧spec・04-learning-model）と一致。確認テスト・エラーで反証されたら復習へ戻せる | 習得状態の過大推定を防止 | `assumedNodeIds`を状態へ追加 | 完了と仮定を区別してログ化できる | 研究者本人 |
| DG-07 | 欠損・未回答時の開始ノード | 採用。欠損時は`html-000` | 06-implementation-status | A: 診断完了まで学習不可 / B: html-000から開始し警告を記録 | B | 最保守側の開始は学習者に不利益がなく、評価上も欠損を明示記録できる。Aは診断保存（OQ-009）未確定の現状では実装前提を満たさない | 欠損の扱いが決定的 | フォールバック1分岐 | 欠損有無をログで識別可能 | 研究者本人 |
| DG-08 | 診断必須化・誘導タイミング | 保留。OQ-009へ移管 | 06-implementation-status | A: 初回サインイン後に必須 / B: 任意（未回答はDG-07適用） | 保留（OQ-009と接続） | アンケート完了状態の保存先・復元がOQ-009未確定のため、本書では規則のみ定義し運用は保留 | — | 完了状態の永続化に依存 | 評価手順（同意→診断→提示）と整合が必要 | 研究者本人・指導教員 |
| DG-09 | 再回答と再計算 | 採用。再回答を許可 | OQ-004 | A: 再回答不可 / B: 再回答可。開始ノード規則を再適用するが、completedNodeIdsは変更しない | B | 再回答は誤回答の救済に必要。完了実績を消さないことで進捗の単調性を保つ | 診断変更の影響範囲が限定的 | 再計算トリガに追加 | 再回答イベントをログ化 | 研究者本人 |
| DG-10 | 診断結果の説明方法 | 採用。構造化記録から表示文を生成 | — | A: 自由文のみ / B: 適用規則ID＋使用回答の構造化記録＋表示文の機械生成 | B | 説明文と内部判定の乖離を構造的に防ぐ（説明の透明性: Tintarev & Masthoff 2007） | 説明可能性の中核 | `startNodeDecision`構造体 | 納得感評価の対象を明確化 | 研究者本人 |

## 2. 採否記録（KAI-10 / OQ-005: ルート生成規則・出力契約）

| 論点ID | 論点 | 承認結果 | 根拠 | 選択肢 | 推奨案 | 推奨理由 | 研究上の影響 | 実装上の影響 | 評価上の影響 | 判断者 |
|---|---|---|---|---|---|---|---|---|---|---|
| RT-01 | 入力契約の範囲 | 採用 | D-012、旧spec | A: 旧spec全項目 / B: §5の6区分（診断・進捗・テスト・エラー・振り返り・カタログ）＋件数制約 | B | 旧specの`inProgressNodeId`等は採用しつつ、利用可能時間等の未実装制約は初版から除外し検証可能な最小契約とする | 入力＝評価ログ項目の基礎 | 型定義が小さい | 各入力が評価指標と対応 | 研究者本人 |
| RT-02 | 出力契約の必須項目 | 修正採用。版情報を必須化 | D-012、旧spec | A: 旧spec型を全採用 / B: §6の必須項目で再定義 | B | `status`・順序・理由は採用、`specVersion`・`catalogVersion`・`dataVersion`をルート生成結果で必須化する。`routeId`はOQ-009確定まで導入せず、`generatedAt`は純粋関数の戻り値ではなく保存・評価ログ記録層のメタ情報として扱う | 出力＝説明可能性・再現性の契約 | 純粋関数の戻り値と保存記録を分離 | ログ化すれば根拠と記録時刻を追跡可能 | 研究者本人 |
| RT-03 | 前提未完了の扱い | 採用 | Dashboard.tsx | A: 前提未完了ノードを警告付き推薦 / B: ルート不変条件（前提はルート内で必ず先行）で構造的に禁止 | B | 確定事項「前提未完了ノードを直接推薦しない」を不変条件として形式化。知識空間理論の前提整合な学習経路（Doignon & Falmagne 1985）と整合 | ルート妥当性の中核 | トポロジカル整列で保証 | 不変条件違反を自動テスト可能 | 研究者本人 |
| RT-04 | 完了済みノードの扱い | 採用 | 04-learning-model | A: 常に除外 / B: 新規推薦から除外、復習条件（RT-07）を満たす場合のみREVIEWで再登場 | B | 確定事項（完了除外）と暫定仕様（復習候補化）の両立 | 復習提示がRQ2の中核 | 除外＋条件付き再追加 | 復習理由がログに残る | 研究者本人 |
| RT-05 | 競合時の優先順位 | 採用。6段階優先順位を使用 | OQ-005 | A: 旧spec順（進行中>前提>エラー>テスト>振り返り>診断） / B: §7の6段階（進行中>エラー主推薦>テスト不合格>エラー補助推薦>振り返り>新規学習） | B | 客観的・直近の証拠を自己申告より優先。学習開始後は実測（エラー・テスト）が静的診断より新しい状態情報を持つ（知識追跡の逐次更新の考え方: Corbett & Anderson 1994）。前提補完は優先度でなく順序変換として扱う | 個別化の判断規則そのもの | 固定優先度の比較関数 | 優先順位自体が評価・考察対象 | 研究者本人（RQへの影響時は指導教員） |
| RT-06 | 同点処理 | 採用。全順序を使用 | OQ-005 | A: 任意（実装依存） / B: §8の全順序（証拠の新しさ→発生回数→カタログ定義順） | B | 全順序を定義しないと決定性が保証できない。最終タイブレークをカタログ定義順にすることで入力順非依存 | 再現性の保証 | 比較関数1つ | 同一入力再現テスト可能 | 研究者本人 |
| RT-07 | 復習ノード挿入規則 | 修正採用。原因単位で解除 | 04-learning-model | A: エラー発生の都度 / B: §9（未解消エラーの参照ノード＋不合格テスト対象。原因単位で解除。同一ルート内重複なし） | B | 解除条件を原因単位にしないと、別原因が残る復習候補を誤って消す危険がある | 復習提示の説明可能性 | 解消フラグ参照 | 復習発生・解消がログ化可能 | 研究者本人 |
| RT-08 | 再計算条件 | 採用。5イベント時のみ | OQ-005 | A: 画面表示ごと / B: §10の5イベント時のみ | B | イベント駆動に限定することで、同一状態で結果が揺れない。時間経過・画面遷移を契機にしない | ルート版とデータの対応が明確 | 呼び出し箇所が限定 | 再計算イベント自体が行動ログ | 研究者本人 |
| RT-09 | 推薦件数 | 採用。順序付き全ルートと上位3件提示 | OQ-005 | A: 1件のみ / B: 順序付き全ルート＋提示は上位3件（既定） / C: 全件提示 | B | 1件は比較・納得感の評価材料が乏しく、全件は焦点が拡散。3件は根拠説明を1画面で提示できる規模。件数は評価設計で変更可能なパラメータとする | 納得感評価の提示単位 | `maxRecommendations`引数 | 提示件数を評価条件として記録 | 研究者本人（評価設計と併せ指導教員確認可） |
| RT-10 | 推薦理由の必須項目 | 採用。`reasonCode`と`evidence`を必須化 | OQ-005注記 | A: 自由文 / B: §12（reasonCode＋evidence（種別・参照ID）必須、表示文は機械生成） | B | 集計可能な理由コードと根拠参照がないと、説明可能性・評価（理由の理解しやすさ）・再現性検証が成立しない | 説明可能性の実装契約 | 小さな構造体 | reasonCode別の集計が可能 | 研究者本人 |
| RT-11 | MVP集合限定・決定性の検証 | 採用 | mvpScope.ts | A: 実装者の注意に依存 / B: 出力前の全ID検証＋決定性を受入テスト化（Phase 4/5） | B | ロードマップPhase 5必須テストと直結。仕様に検証条件を明記して実装Issueへ渡す | 再現性の保証手段 | テスト項目が仕様から導出可能 | 評価前ゲート（EG-07）に対応 | 研究者本人 |
| RT-12 | 例外・欠損処理 | 採用 | OQ-005 | A: 実装依存 / B: §11（未知ID無視＋警告、カタログ異常は生成エラー、全完了はcompleted、入力欠損は入口ノード） | B | フォールバックを仕様化しないと欠損時挙動が実装依存になり再現性を欠く | 異常系の再現性 | 分岐が明確 | 警告がログへ残る | 研究者本人 |

---

## 3. 診断規則（KAI-9）

### 3.1 診断項目の分類 [承認済み仕様]

現行`questionConfig.ts`の9項目を、研究上の役割で3群に分類する。

| 群 | 項目ID | 研究上の役割 | 開始ノード決定への使用 |
|---|---|---|---|
| K群（知識・技能状態） | `programming_experience`、`rule_confidence`、`knowledge_concept` | 学習者の既有知識・理解状態の自己報告。開始ノード決定の入力 | 使用する |
| S群（学習行動・特性） | `skill_errors`、`error_handling`、`learning_anxiety` | エラー対応傾向・不安の把握。MVPでは提示文言や評価分析の材料 | 使用しない |
| A群（属性・文脈） | `background`、`learning_goal`、`available_time` | 参加者記述・群分け分析用 | 使用しない |

- [承認済み仕様] S群・A群は開始ノード決定に使用しない。重み（weight）による加点も行わない。
- [保留] S群・A群の収集自体の要否・保存はOQ-009（KAI-12）および評価計画で確定する。年齢・職業の追加取得は個人情報最小化と併せて判断する（OQ-004からOQ-009へ移管）。
- [根拠の論理] 開始位置は既有知識の状態で決めるべきであり、先行知識は学習成果の主要な予測因子である（Dochy et al. 1999）。立場・目的・時間は学習継続の文脈情報ではあるが、「どのノードから始めるか」への因果的関係を示す根拠がなく、これらを加点に含めると診断の説明可能性が損なわれる。

### 3.2 スコア化の要否 [承認済み仕様]

- スコア化（重み付き合算）は行わない。K群3項目による決定表（§4）で開始ノードを決める。
- 理由: (1) 開始候補が2つ（§4）であれば、合算値と境界値という2段階の恣意性を挟む必要がない。(2) 現行の重み・境界（24/17/10）には設計根拠の記録がない。(3) 決定表は判定過程がそのまま説明文になる。
- 代替案: 重み付き合算を維持する場合、各重みと境界値の教育的根拠、および経験なし回答者がadvancedへ到達できない非対称性の扱いを研究者が別途定義する必要がある。

### 3.3 欠損回答の扱い [承認済み仕様]

- K群のいずれかが欠損（未回答・不正値）の場合、開始ノードは`html-000`とし、警告`DIAGNOSIS_INCOMPLETE`を記録する。
- 診断自体が存在しない場合（未回答ユーザー）も同様に`html-000`とし、警告`DIAGNOSIS_MISSING`を記録する。
- 決定性: 欠損時の出力も一意である。

## 4. 開始ノード決定規則（KAI-9）

### 4.1 決定表 [承認済み仕様]

開始ノード候補集合は `{html-000, html-010}` に限定する。

| 規則ID | 条件 | 開始ノード | 習得仮定（assumed） |
|---|---|---|---|
| DG-RULE-1 | `programming_experience` = `no` | `html-000` | なし |
| DG-RULE-2 | `programming_experience` = `yes` かつ（`rule_confidence` ∈ {`none`, `low`} または `knowledge_concept` ∈ {`visual_only`, `unknown`}） | `html-000` | なし |
| DG-RULE-3 | `programming_experience` = `yes` かつ `rule_confidence` ∈ {`confident`, `partial`} かつ `knowledge_concept` ∈ {`structure_style`, `somewhat`} | `html-010` | `html-000` |
| DG-RULE-4 | K群に欠損あり、または診断なし | `html-000` | なし（警告記録） |

- 規則は上から順に評価し、最初に一致した規則を適用する。同一入力に対して常に同一の結果を返す。
- [承認済み仕様] 初学者保護の制約: いかなる診断結果でも、開始ノードを`html-010`より先（`html-020`以降、css系）にしない。スキップは最大1ノード（`html-000`）に限定する。
- [根拠の論理] 診断は選択式の自己報告であり、能力の低い学習者ほど自己評価が過大になる傾向が知られている（Kruger & Dunning 1999）。深いスキップは初学者を前提不足の途中ノードへ飛ばす危険が高く、MVP 12ノードの規模ではスキップの利益も小さい。一方、開始ノードが診断に全く依存しないと「診断結果を開始ノード決定に利用する」という確定事項を満たさないため、最小の2候補とする。

### 4.2 習得仮定（assumedNodeIds）の扱い [承認済み仕様]

- DG-RULE-3で`html-000`は完了（completed）ではなく習得仮定（assumed）として記録する。
- 前提充足判定では `completedNodeIds ∪ assumedNodeIds` を充足とみなす。
- 反証条件: 該当ノードに対応する確認テストの不合格、または該当ノードを主推薦とするエラーの発生時、assumedから除去し、通常の復習規則（§9）に従って候補へ戻す。
- 理由: 自己申告のみでノードを修了扱いにしない（`04-learning-model.md`、旧spec「診断」節と同旨）。完了と仮定を区別することで、評価ログ上も過大な習得推定を防ぐ。

### 4.3 診断結果の説明 [承認済み仕様]

開始ノード決定は次の構造で記録し、表示文はこの構造から機械生成する。

```ts
interface StartNodeDecision {
  startNodeId: 'html-000' | 'html-010'
  assumedNodeIds: string[]
  matchedRuleId: 'DG-RULE-1' | 'DG-RULE-2' | 'DG-RULE-3' | 'DG-RULE-4'
  usedAnswers: { questionId: string; value: string }[]  // K群のみ
  warnings: ('DIAGNOSIS_INCOMPLETE' | 'DIAGNOSIS_MISSING')[]
}
```

### 4.4 再回答 [承認済み仕様]

- 診断の再回答を許可する。再回答時は決定表を再適用し、ルートを再計算する（§10）。
- `completedNodeIds`は再回答によって変更しない。`assumedNodeIds`は再計算する（新しい判定結果に置換する。ただし既に完了済みのノードには影響しない）。
- [保留] 診断の必須化・誘導タイミング・完了状態の保存はOQ-009（KAI-12）と接続して確定する。

## 5. ルート生成入力契約（KAI-10）

[承認済み仕様] ルート生成は、次の入力スナップショットを受け取る純粋関数とする。実行時にAI推論・乱数・現在時刻を判断に使用しない。

```ts
interface RouteGenerationInput {
  catalog: {
    catalogVersion: string
    nodes: { nodeId: string; prerequisites: string[] }[]  // MVP 12ノード
  }
  diagnosis: StartNodeDecision | null   // §4.3。未回答時はnull
  progress: {
    completedNodeIds: string[]
    assumedNodeIds: string[]
    inProgressNodeId: string | null
  }
  quizResults: {
    quizId: string          // quiz-{nodeId}
    nodeId: string
    passed: boolean         // 合否判定はOQ-006の閾値確定後に入力側で行う
    score: number           // 参考値（0-100）
    attempt: number
    takenAt: string         // ISO 8601
  }[]
  errorHistory: {
    errorId: string         // E_<領域>_<内容>
    occurrenceCount: number
    lastOccurredAt: string
    resolved: boolean
  }[]
  reflections: {
    nodeId: string
    struggledNodeIds: string[]  // 選択式のみ（OQ-008暫定仕様に整合）
    submittedAt: string
  }[]
  maxRecommendations: number    // 既定3、1〜12
}
```

- [承認済み仕様] 合格閾値はルート生成の外（OQ-006 / KAI-11）で確定し、本契約は`passed`を入力として受け取る。これによりOQ-005とOQ-006の依存を一方向に保つ。
- [承認済み仕様] エラーからノードへの対応は`errorMappings`の`nodeRefs`（主推薦=priority 1、補助=priority 2）を使用する。MVP 8エラー以外の参照（非正規ID）は使用しない（KAI-14の修正対象）。
- [承認済み仕様] 振り返りの`struggledNodeIds`は正規ノードIDで受け取る。現行UIの固定7概念（ノードID非対応）は本契約を満たさないため、実装時に選択肢のノードID化が必要（実装Issue側の作業）。
- 旧spec項目の採否: `inProgressNodeId`・完了ノード・テスト・エラー・振り返り・カタログ版は採用。「利用可能時間・対象領域」等のセッション制約は初版では不採用（検証可能な最小契約を優先。将来の追加はDecisionを要する）。

## 6. ルート生成出力契約（KAI-10）

```ts
interface RouteGenerationResult {
  specVersion: string        // 本仕様の版（例: "route-spec/1.0"）
  catalogVersion: string
  dataVersion: string        // ルート生成結果に影響する参照データ版
  status: 'active' | 'completed' | 'insufficient-input' | 'error'
  nextNodeId: string | null  // ルート先頭。completedまたはerror時はnull
  route: {
    nodeId: string           // 必ずMVP集合内
    order: number            // 1始まりの連番
    reasons: RecommendationReason[]  // §12。1件以上必須
  }[]
  presentedCount: number     // 提示件数（min(maxRecommendations, route.length)）
  warnings: string[]
}

interface StoredRouteGeneration {
  generatedAt: string        // 保存・評価ログ記録層が付与する生成記録時刻
  result: RouteGenerationResult
}
```

- `RouteGenerationResult`の必須項目: `specVersion`、`catalogVersion`、`dataVersion`、`status`、`nextNodeId`、`route`（各要素の`nodeId`・`order`・`reasons`）、`presentedCount`、`warnings`。
- `dataVersion`は、ルート生成結果に影響する参照データ（例: ノードカタログ、前提関係、`errorMappings`、理由コード定義）の版を表す。空文字・nullは許可しない。
- 初版でも明示的な版文字列を使用する。既存データファイルの`version: "1.0.0"`を参照する場合、最小例は`dataVersion: "1.0.0"`とする。
- `generatedAt`は`RouteGenerationResult`には含めない。純粋なルート生成関数は現在時刻を読まず、同一入力に対して同一の`RouteGenerationResult`を返す。
- `generatedAt`は保存・評価ログ記録層が`StoredRouteGeneration`として付与するメタ情報である。保存要否、保存先、保持期間、`StoredRouteGeneration`の実装形式はOQ-009（KAI-12）で確定する。
- `routeId`（個別ルートの識別子）は永続化（OQ-009）確定まで導入しない。
- 不変条件:
  1. `route`内の全`nodeId`はMVP 12ノード集合に属する。違反時は`status: 'error'`とし、部分結果を返さない。
  2. `route`内の各ノードの前提は、`completedNodeIds ∪ assumedNodeIds`または同ルート内でより小さい`order`のノードに含まれる（前提未完了ノードの直接推薦の構造的禁止）。
  3. 同一`nodeId`は`route`内に高々1回。
  4. 同一入力に対して同一の`RouteGenerationResult`。
- 決定性の定義: 入力スナップショットが等しければ、`RouteGenerationResult`の全フィールドがフィールド単位で等しい。

## 7. 優先順位（競合時）

[承認済み仕様] 候補ノードの優先レベルを次の固定順とする（小さいほど優先）。

| レベル | 候補源 | reasonCode | 根拠の性質 |
|---|---|---|---|
| P1 | 進行中ノード（`inProgressNodeId`が未完了） | `IN_PROGRESS` | 学習継続性 |
| P2 | 未解消エラーの主推薦ノード（priority 1） | `ERROR_REMEDIATION` | 客観・直近・直接 |
| P3 | 不合格確認テストの対象ノード | `QUIZ_FAILED` | 客観・直接 |
| P4 | 未解消エラーの補助推薦ノード（priority 2） | `ERROR_REMEDIATION` | 客観・間接 |
| P5 | 振り返りで選択されたつまずきノード | `REFLECTION_FLAG` | 自己申告 |
| P6 | 前提充足済みの未完了ノード（新規学習） | `NEXT_UNLOCKED`（初回診断由来の先頭は`DIAGNOSIS_START`） | 静的順序 |

- 前提補完（`PREREQUISITE`）は優先レベルではなく、候補確定後の順序変換として扱う: 候補の未完了前提を再帰的にルートへ追加し、トポロジカル順で候補より前へ置く。補完ノードは元候補の優先レベルを継承し、`prerequisiteFor`で元候補を参照する。
- 同一ノードが複数レベルに該当する場合、最高（最小）レベルに配置し、`reasons`には該当する全理由を保持する。
- 診断は開始ノード決定（§4）にのみ寄与し、学習開始後の競合には参加しない。
- [根拠の論理] 学習開始後は、成果物から検出されたエラーとテスト結果が、初回診断より新しく客観的な学習者状態の証拠である。逐次的な実測で学習者状態の推定を更新する考え方は知識追跡（Corbett & Anderson 1994）で確立している。自己申告（振り返り）は有用だが精度の限界（Kruger & Dunning 1999）があるため客観証拠に劣後させる。旧specの案（前提をレベルとして扱う）は、前提補完を順序変換に再整理した点のみ変更し、他の相対順（進行中>エラー>テスト>振り返り>診断）は踏襲した。
- 旧spec採否: 進行中最優先=採用。エラー>テスト=採用（ただし主/補助を分離）。振り返り>診断=採用。前提=優先レベルから除外し順序変換へ（変更）。

## 8. 同点処理

[承認済み仕様] 同一優先レベル内の順序は、次の全順序で決定する。

1. 証拠の新しさ: 該当理由の証拠タイムスタンプ（`lastOccurredAt` / `takenAt` / `submittedAt`）の新しい順。
2. 反復回数: エラーは`occurrenceCount`、テストは`attempt`の多い順。
3. カタログ定義順: `MVP_NODE_IDS`配列（= `03-mvp-scope.md`の12ノード表の順序）の昇順。

- P6（新規学習）は証拠タイムスタンプを持たないため、カタログ定義順のみで並べる。
- 手順3は全ノードで一意なため、全順序が保証され、入力配列の並び順に依存しない。
- 旧spec採否: 「エラーの新しさ・反復回数、テスト試行回数、ノードIDの順」を実質採用。最終キーをノードID辞書順からカタログ定義順へ変更（学習順序として自然であり、辞書順では`css-*`が`html-*`より先に並ぶため）。

## 9. 復習ノード挿入規則

[承認済み仕様]

1. 復習（`REVIEW`）は、完了済みまたは習得仮定ノードが再びルートへ入る場合の付加reasonCodeとする。
2. 挿入条件: (a) 未解消（`resolved: false`）エラーの参照ノードが完了済みまたはassumed、(b) 不合格テストの対象ノードが完了済みまたはassumed、のいずれか。
3. 復習原因は原因単位で管理する。
4. エラー由来の復習理由は、対応するエラーが解消された場合にのみ無効化する。
5. テスト由来の復習理由は、対応するテストに合格した場合にのみ無効化する。
6. 振り返り由来の理由は、ルート再計算時の最新振り返り状態に従う。
7. 対象ノードに有効な復習原因が1件以上残る限り、復習候補として維持する。すべての復習原因が無効化された場合のみ、復習候補から除外する。
8. 解消済みエラーの再発は、新しい未解消エラーとして再び挿入条件を満たす。
9. ループ防止: 同一ノードは1ルート内に高々1回（§6不変条件3）。複数理由は`reasons`へ併合する。復習の優先レベルは挿入原因（P2〜P5）に従い、復習だけで独立レベルを作らない。
- [注意] 同一エラーが解消されない限り同じ復習推薦が継続する。これは無限ループではなく仕様上の停滞であり、推薦は強制遷移ではない（学習者は他の到達可能ノードを選べる）ことをUI契約で保証する。評価時は停滞の発生自体を観察対象とする。

例: `html-021`に未解消エラー`E_HTML_INVALID_NESTING`と不合格テスト`quiz-html-021`が同時に存在する場合、エラー解消後もテストが未合格であれば`html-021`は復習候補として残る。テスト合格後に両原因が無効化された時点でのみ、復習候補から除外する。

## 10. 再計算条件

[承認済み仕様] ルートは次のイベントの直後にのみ再計算する。

1. 診断の確定または再回答（§4.4）
2. ノード完了（実践課題完了によるcompleted追加）
3. 確認テスト結果の確定
4. 実践課題エラーの検出または解消
5. 振り返りの確定

- 画面遷移・時間経過・再表示は再計算の契機としない（同一状態での結果の揺れを防ぐ）。
- 再計算は常に最新の入力スナップショット全体から全量計算する（差分更新をしない。単純さと決定性を優先）。
- 各再計算の入力スナップショットと出力を評価ログへ記録できる形式にする（保存の要否・保持期間はOQ-009で確定）。

## 11. 例外・欠損時処理

[承認済み仕様]

| 状況 | 処理 | status | 警告 |
|---|---|---|---|
| 未知のnodeId / errorId / quizIdが入力に含まれる | 該当入力のみ無視し、推薦には使用しない | 継続 | `UNKNOWN_ID:<id>` |
| カタログに循環・参照切れ・MVP外前提がある | 生成を中止し、部分結果を返さない | `error` | `CATALOG_INVALID` |
| 出力候補にMVP外IDが混入（内部バグ） | 生成を中止 | `error` | `NON_MVP_OUTPUT` |
| 診断なし・進捗なし（初回未診断） | `html-000`から前提順の全ルートを返す | `insufficient-input` | `DIAGNOSIS_MISSING` |
| 診断なし・進捗あり | 通常生成（開始規則はDG-RULE-4相当） | `active` | `DIAGNOSIS_MISSING` |
| 全ノード完了かつ復習条件なし | 空ルート | `completed` | なし |
| 振り返りの`struggledNodeIds`が空 | 振り返り由来の候補なしとして継続 | 継続 | なし |

## 12. 推薦理由データ構造

[承認済み仕様] 各推薦ノードは1件以上の理由を必須とする。

```ts
interface RecommendationReason {
  reasonCode:
    | 'IN_PROGRESS' | 'ERROR_REMEDIATION' | 'QUIZ_FAILED'
    | 'REFLECTION_FLAG' | 'NEXT_UNLOCKED' | 'DIAGNOSIS_START'
    | 'PREREQUISITE' | 'REVIEW'
  evidence: {
    kind: 'diagnosis' | 'progress' | 'quiz' | 'error' | 'reflection' | 'catalog'
    refId: string        // 例: 'E_HTML_INVALID_NESTING', 'quiz-html-031', 'DG-RULE-3'
    detail?: string      // 機械可読の補足（例: score, attempt）
  }
  prerequisiteFor?: string  // PREREQUISITE時のみ: 補完元の候補ノードID
}
```

- 必須項目: `reasonCode`、`evidence.kind`、`evidence.refId`。
- 表示文（自然言語説明）は`reasonCode`と`evidence`から機械生成し、生成規則と独立した自由文を保存しない。これにより説明文と内部判定の乖離を構造的に防ぐ（説明の透明性・信頼の観点: Tintarev & Masthoff 2007）。
- 旧spec採否: `reasonCodes: string[]`＋`sourceSignals: string[]`の分離案に代えて、理由と根拠参照を1オブジェクトに統合（理由と根拠の対応が失われないようにするため）。コード集合は旧specの7種から`DIAGNOSTIC_GAP`を除き（診断は開始のみに寄与）、`QUIZ_FAILED`/`REFLECTION_FLAG`/`NEXT_UNLOCKED`/`DIAGNOSIS_START`へ名称を具体化した8種。後続で名称または種類を変更する場合はDecisionを追加する。

## 13. 具体例

以下は§4〜§12を機械的に適用した結果である（maxRecommendations = 3）。

### 13.1 例1: 完全初学者

- 入力: 診断 `programming_experience = no`（→DG-RULE-1）。進捗・テスト・エラー・振り返りすべて空。
- 判定過程: 開始ノード`html-000`、assumedなし。候補はP6（新規学習）のみ。前提充足済み未完了は`html-000`のみ。以降トポロジカル順に前提が解けるため、ルートは12ノード表の順となる。
- 出力ルート（先頭3件提示）:
  1. `html-000` — reasons: [DIAGNOSIS_START / diagnosis / DG-RULE-1]
  2. `html-010` — reasons: [NEXT_UNLOCKED / catalog / html-010]
  3. `html-020` — reasons: [NEXT_UNLOCKED / catalog / html-020]
- status: `active`。説明例（機械生成）:「プログラミング経験なしと回答したため、最初の単元から始めます」。

### 13.2 例2: 一部経験者

- 入力: 診断 `programming_experience = yes`、`rule_confidence = partial`、`knowledge_concept = structure_style`（→DG-RULE-3）。進捗等は空。
- 判定過程: 開始ノード`html-010`、assumed = [`html-000`]。前提判定でhtml-000は充足扱い。候補P6の先頭は`html-010`。
- 出力ルート（先頭3件提示）:
  1. `html-010` — reasons: [DIAGNOSIS_START / diagnosis / DG-RULE-3]
  2. `html-020` — reasons: [NEXT_UNLOCKED / catalog / html-020]
  3. `html-021` — reasons: [NEXT_UNLOCKED / catalog / html-021]
- status: `active`。`html-000`はルートに含まれない（assumed）。以後`html-000`関連のテスト不合格・エラーが発生した場合、assumedを取り消し復習規則を適用する。

### 13.3 例3: 学習途中で特定エラーが発生した学習者

- 入力:
  - 進捗: completed = [`html-000`, `html-010`, `html-020`, `html-021`, `html-022`]、inProgress = null
  - テスト: `quiz-html-031`（nodeId `html-031`）、passed = false、score 60、attempt 1、takenAt = T2
  - エラー: `E_HTML_INVALID_NESTING`、occurrenceCount 1、lastOccurredAt = T3、resolved = false（nodeRefs: 主 `html-021`、補助 `html-040`）
  - 振り返り: struggledNodeIds = [`html-021`]、submittedAt = T1（T1 < T2 < T3）
- 判定過程:
  - P2: エラー主推薦`html-021`は完了済み → REVIEW条件(a)を満たし候補化（ERROR_REMEDIATION + REVIEW）。
  - P3: `html-031`（不合格テスト対象、前提`html-021`完了済みのため直接推薦可）。
  - P4: エラー補助推薦`html-040`（未完了、前提`html-021`完了済み）。
  - P5: 振り返り`html-021`は既にP2で候補化済み → reasonsへREFLECTION_FLAGを併合。
  - P6: 前提充足済み未完了 = `html-031`、`html-040`、`css-000`。前2者は既候補のため`css-000`のみ追加。
- 出力ルート（先頭3件提示）:
  1. `html-021` — reasons: [ERROR_REMEDIATION / error / E_HTML_INVALID_NESTING], [REVIEW / progress / html-021], [REFLECTION_FLAG / reflection / html-021]
  2. `html-031` — reasons: [QUIZ_FAILED / quiz / quiz-html-031 (score 60, attempt 1)]
  3. `html-040` — reasons: [ERROR_REMEDIATION / error / E_HTML_INVALID_NESTING（補助）]
  - 4位以降: `css-000`（NEXT_UNLOCKED）
- status: `active`。説明例:「実践課題で『HTMLの不正な入れ子』が未解消のため、完了済みの『入れ子構造』の復習を最優先で提案します（振り返りでも同単元を選択しています）」。
- 決定性確認: 同一入力で優先レベル・タイムスタンプ・カタログ順がすべて固定のため、出力は常に上記と一致する。

## 14. 反証・リスク検査結果

| 検査項目 | 結果 | 根拠・補足 |
|---|---|---|
| 循環参照が生じないか | 問題なし | 12ノード前提表（03-mvp-scope）は非循環であることを目視確認。仕様上、カタログ循環検出時は生成エラー（§11）とし推測ルートを返さない |
| 前提未完了ノードを推薦しないか | 問題なし | §6不変条件2で構造的に禁止。assumedを充足に含める点は研究者判断事項（DG-06） |
| 同じ入力で結果が変動しないか | 問題なし | 乱数・現在時刻を判断に不使用。§8で全順序を定義。`generatedAt`は純粋な`RouteGenerationResult`から分離し、保存・評価ログ記録層のメタ情報とする |
| 特定の診断項目だけが過度に支配しないか | 条件付きで問題なし | 診断は開始ノード2択にのみ影響し、学習開始後は関与しない。ただし`programming_experience`=noが単独で開始を決める（最保守側に倒すための意図的な非対称） |
| 初学者を途中ノードへ飛ばす危険がないか | 問題なし | 開始候補は{html-000, html-010}に限定。スキップ最大1ノード、かつassumedとして反証可能 |
| 復習推薦が無限ループしないか | 問題なし（停滞は残る） | 原因単位で無効化し、全原因が無効化された場合のみ解除する（§9）。未解消原因が続く場合は同一推薦が継続するが、推薦は強制でなく他ノード選択可。停滞は評価観察対象として記録 |
| 説明文と内部判定が一致するか | 問題なし | 表示文をreasonCode＋evidenceから機械生成し、独立した自由文を保存しない（§12） |
| 評価時に個別化の根拠を記録できるか | 問題なし（保存はOQ-009依存） | 入力スナップショット＋出力（reasons含む）の対で追跡可能。永続化の要否・期間はOQ-009 |
| 研究質問に対して過剰な主張になっていないか | 問題なし | 本仕様は「説明可能・決定的なルート提示の実行可能性」のみを支え、学習効果・固定ルート優位は主張しない（08-constraints、D-011と整合） |
| 実装可能な複雑さに収まっているか | 問題なし | 決定表＋固定優先度＋トポロジカル整列＋全順序タイブレークのみ。外部サービス・AI推論・乱数に依存しない純粋関数として実装可能 |

## 15. 文献根拠

いずれも2026-07-03にWeb検索で書誌情報（タイトル・著者・掲載誌・DOI等）を確認した。**本文全文の精読は行っておらず、要旨・公知の主要主張に基づく参照である。** 主張の詳細な裏付けが必要になった場合は本文確認を行うこと。

| # | 文献 | 確認できた識別情報 | 本仕様での使用箇所と論理 | 限界 |
|---|---|---|---|---|
| 1 | Rasmussen, J. (1983). Skills, rules, and knowledge; signals, signs, and symbols, and other distinctions in human performance models. *IEEE Transactions on Systems, Man, and Cybernetics*, SMC-13(3), 257–266. | DOI: 10.1109/TSMC.1983.6313160 | 既存確定事項であるSRK三層分類（エラー分類）の原典。本仕様ではエラー→ノード対応（P2/P4）の分類枠組みの背景 | SRKは産業システムの人間性能モデルであり、プログラミング初学者教育への適用妥当性は本研究の評価対象（03-mvp-scope注記と同旨） |
| 2 | Corbett, A. T., & Anderson, J. R. (1994). Knowledge tracing: Modeling the acquisition of procedural knowledge. *User Modeling and User-Adapted Interaction*, 4(4), 253–278. | Springer掲載確認（link.springer.com/article/10.1007/BF01099821） | §7: 学習開始後は逐次の実測（テスト・エラー）で学習者状態の推定を更新し、静的な初回診断より優先するという設計の背景 | 本仕様は確率的knowledge tracingを実装しない。「実測による更新の優先」という定性的発想のみ借用 |
| 3 | Doignon, J.-P., & Falmagne, J.-C. (1985). Spaces for the assessment of knowledge. *International Journal of Man-Machine Studies*, 23, 175–196. | 書誌情報を複数の学術データベース経由で確認。DOIは今回の検索では未確認 | §6不変条件2・RT-03: 習得状態を前提関係で閉じた集合として扱い、前提整合な経路のみ提示する設計の理論的背景（知識空間理論） | 本仕様は知識空間の形式的構造（束構造等）を実装しない。前提閉包の発想のみ借用 |
| 4 | Kruger, J., & Dunning, D. (1999). Unskilled and unaware of it: How difficulties in recognizing one's own incompetence lead to inflated self-assessments. *Journal of Personality and Social Psychology*, 77(6), 1121–1134. | 書誌情報を確認。DOIは今回の検索結果に明記なし | §4・DG-05: 自己報告に基づく深いスキップを避け、開始候補を2つに限定し習得仮定を反証可能にする設計の根拠 | 原研究は大学生の一般的課題での自己評価であり、プログラミング初学者の診断回答への直接的一般化には限界がある |
| 5 | Dochy, F., Segers, M., & Buehl, M. M. (1999). The relation between assessment practices and outcomes of studies: The case of research on prior knowledge. *Review of Educational Research*, 69(2), 145–186. | タイトル・著者・掲載誌を確認（検索スニペットベース）。DOI未確認 | DG-02: 開始位置の決定は属性（立場・目的）でなく既有知識の状態に基づくべきという判断の背景（先行知識と学習成果の関連） | 検索スニペットでの確認にとどまる。本文・DOIの確認は未実施であり、引用時は再確認が必要 |
| 6 | Tintarev, N., & Masthoff, J. (2007). A survey of explanations in recommender systems. *IEEE 23rd International Conference on Data Engineering Workshop (ICDEW'07)*, 801–810. | DOI: 10.1109/ICDEW.2007.4401070 | §12・DG-10: 推薦理由を判断過程から構造化して生成し、説明と内部判定の一致（透明性）を保証する設計の背景 | 商用推薦システム向けの説明分類であり、教育推薦の納得感への転用は本研究の評価で確認する |
| 7 | Nabizadeh, A. H., Leal, J. P., Rafsanjani, H. N., & Shah, R. R. (2020). Learning path personalization and recommendation methods: A survey of the state-of-the-art. *Expert Systems with Applications*, 159, 113596. | DOI: 10.1016/j.eswa.2020.113596 | 全体: 学習パス個別化の主要入力（知識状態・進捗・成績）と前提制約に基づくパス生成が確立した設計類型であることの確認 | サーベイであり個別手法の優劣は本仕様の根拠にしない |

## 16. 残存判断事項

以下は本書では確定せず、OQ-009または後続確認へ残す。

1. DG-08: 診断必須化・誘導タイミング・診断完了状態の保存はOQ-009（KAI-12）へ移管する。
2. OQ-009依存事項: S群・A群の収集要否、年齢・職業の追加取得、入力スナップショットと`RouteGenerationResult`の永続保存、`generatedAt`の付与・保存形式、保持期間、削除手順、同意UI、評価ログ保存、`routeId`導入要否。
3. 指導教員確認推奨事項: 診断項目が対象者条件や評価計画に与える影響、開始2候補・上位3件提示・6段階優先順位を研究上どの範囲まで主張に使うか。
4. 本仕様とOQ-001（研究質問の正式文言）の整合性は、研究質問確定時に再確認する。

## 17. Decision Log反映状況

- D-016として、OQ-004の診断規則・開始ノード規則を正式反映済みである。
- D-017として、OQ-005のルート生成規則・出力契約を正式反映済みである。
- 版番号を`route-spec/1.0`へ変更した理由は、Phase 3仕様案が研究者本人により承認され、D-016/D-017として正本文書へ反映されたためである。

## 18. 変更履歴

| 版 | 日付 | 変更内容 | 状態 |
|---|---|---|---|
| 0.1 | 2026-07-03 | Phase 3仕様案の初版作成（KAI-9/KAI-10対応） | 旧提案版 |
| 1.0 | 2026-07-03 | 研究者承認に基づきDG-01〜DG-07/DG-09/DG-10、RT-01〜RT-12を正式仕様化。RT-02とRT-07を修正反映し、DG-08をOQ-009へ移管 | 承認済み仕様 |
| 1.0補足 | 2026-07-03 | RT-02の`generatedAt`責務を補足。純粋な`RouteGenerationResult`から分離し、保存・評価ログ記録層のメタ情報としてOQ-009へ接続 | 承認済み仕様の補足 |
