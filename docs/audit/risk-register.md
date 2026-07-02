# リスク登録簿(risk-register)

- 監査基準・対象SHA・確認不能事項: `00-audit-scope.md` 参照(対象: `main` @ `16d2f93`、監査日 2026-07-02)
- 深刻度は「この研究(前期: モデル具体化、後期: 小規模評価)のMVP完成と評価可能性」への影響で判定。一般的ベストプラクティス上の重要度ではない。
- Critical/High は ai-research-development-roadmap.md の様式(根拠・事実/推測区別・具体的失敗・判断者・Phase 3停止条件)で記載する。
- 反映先の候補は roadmap Phase 2.5 の選択肢に従う。**本書の推奨は監査担当の案であり、採否はPhase 2.5で研究者本人が決定する。**

## Critical

### RSK-01 評価データが1件も残らない

| 項目 | 内容 |
|---|---|
| 重大度 | Critical |
| 根拠 | [確認済み事実] App.tsx: Progress全体がuseStateのみ、fetch/localStorage使用ゼロ(全文照合済み)。server/index.tsx: エンドポイントは health/signup/signin/profile の4本のみで進捗・ログ受け口なし(notes/04 §3・5・7) |
| 事実/推測 | 上記は全て確認済み事実。推測なし |
| 影響 | 研究(後期の小規模評価)の評価可能性が不成立。RQ1〜3の全指標が取得不能 |
| 起こり得る具体的失敗 | 被験者がセッションを完了しても、リロード・ブラウザ終了で全記録消失。評価実験後に分析対象データが存在しないことが判明する |
| 推奨対応 | OQ-009決定 → 同意・仮名ID・イベントログの最小スキーマ設計 → 保存/復元実装(work-order W6) |
| 対応優先時期 | 設計判断はPhase 3、実装はPhase 6(roadmap)。評価実施前必須 |
| 判断要否 | 保存項目・保持期間・削除手順は研究者本人+指導教員(倫理事項) |
| Phase 3以降への停止条件か | Phase 3は進行可(仕様確定作業)。**Phase 7.5評価開始のNO-GO条件**(EG-05/06) |
| 推奨反映先 | `02-open-questions.md`(OQ-009の具体化)、`06-implementation-status.md`(未実装の明記)、Linear Issue(W6) |

### RSK-02 「個別最適化」の中核が虚偽表示のまま被験者に提示される

| 項目 | 内容 |
|---|---|
| 重大度 | Critical |
| 根拠 | [確認済み事実・検証済み] Dashboard.tsx に「あなたの推奨ルート（スコア算出）」「あなたのレベル（…）とスコア（…点）に基づいて、最適な学習経路を提案しています。」の文言。実体は `getRecommendedNodes()` = 固定配列 `recommendedStartNodeIds: ['html-010']`(App.tsx初期state)の単純フィルタで、level/levelScoreは文言に埋め込まれるだけで選定計算に不使用。加えて「学習履歴に保存されます」(LearningReflectionForm)、ダミー初期実績(App.tsx: streak 3・8時間・quizScores [85,92,78]・html-000完了) |
| 事実/推測 | 全て確認済み事実(一次資料照合済み) |
| 影響 | (a) このまま評価するとRQ1「納得感」は虚偽説明への反応を測ることになり研究として無効。(b) 被験者への虚偽説明は研究倫理上問題。(c) デモを見た関係者が「実装済み」と誤認 |
| 起こり得る具体的失敗 | 評価アンケートの「ルートの納得感」が、実際には存在しない個別化への納得を測ってしまい、結果が解釈不能になる。発表時に「スコア算出」を実装済みと説明してしまう |
| 推奨対応 | 短期=文言を実態に合わせて修正(W1-2、数行)。本質=routeGenerator実装(W5、OQ-004/005決定後) |
| 対応優先時期 | 文言修正は即時(Phase 2.5直後の最初のIssue)。本体はPhase 5 |
| 判断要否 | 文言修正は実装判断で可。routeGenerator仕様は研究者本人(Phase 3) |
| Phase 3以降への停止条件か | Phase 3進行は可。**未修正のまま評価に入ることはPhase 7.5のNO-GO条件**(EG-14相当) |
| 推奨反映先 | `06-implementation-status.md`(「モック」の明記)、Linear Issue(W1-2, W5)、`09-decision-log.md`(routeGenerator仕様確定時) |

### RSK-03 個人情報漏洩の可能性(RLS未確認)

| 項目 | 内容 |
|---|---|
| 重大度 | Critical(疑い) |
| 根拠 | [確認済み事実] src/utils/supabase/info.tsx に projectId と anon key が公開リポジトリに平文ハードコード。kv_store_f3d88633 に email・name を平文JSONBで保存する実装(server/index.tsx)。リポジトリにRLSポリシー定義・SQLマイグレーションが存在しない。[推測・確認不能] RLSが実際に無効かどうかは実環境未確認(00-audit-scope §5) |
| 事実/推測 | ハードコードと保存実装は事実。「漏洩可能」はRLS無効を仮定した推測であり、**実測していない** |
| 影響 | RLS無効の場合、PostgREST経由で第三者が全ユーザーのemail・name・profileを読み書き可能。研究倫理・法令上の重大事故 |
| 起こり得る具体的失敗 | 公開リポジトリからprojectId+anon keyを得た第三者が `rest/v1/kv_store_f3d88633` を列挙し、被験者(または開発中の実アカウント)のPIIを取得する |
| 推奨対応 | Supabaseダッシュボードで即時確認(W1-1、コード変更不要)。無効なら有効化し、確認結果を記録 |
| 対応優先時期 | 即時(本日) |
| 判断要否 | 確認作業は研究者本人のみで可。漏洩が確認された場合は指導教員へ報告 |
| Phase 3以降への停止条件か | **確認完了までPhase 3以降の全作業に優先**。評価開始(Phase 7.5 EG-08)の前提 |
| 推奨反映先 | `08-constraints.md`(データ管理の確認済み状態)、`06-implementation-status.md`、Linear Issue(W1-1)。確認結果次第で `09-decision-log.md` |

### RSK-04 同意取得の仕組みが皆無

| 項目 | 内容 |
|---|---|
| 重大度 | Critical |
| 根拠 | [確認済み事実] Auth.tsx のフォームは name/email/password のみ。精読した全コンポーネントに同意説明・同意記録・撤回導線・削除機能が存在しない(notes/04 §8)。一方で questionConfig.ts は learning_anxiety(準センシティブ)を収集する設計 |
| 事実/推測 | 確認済み事実 |
| 影響 | research/01・08の確定倫理原則(説明と同意・任意参加・途中中止・匿名化)に実装が違反した状態。ヒト対象の評価実験を実施できない |
| 起こり得る具体的失敗 | 同意記録なしで評価を実施し、収集データが研究利用不能と判定される。撤回要求に応じられない |
| 推奨対応 | 評価前に同意フロー+同意記録の永続化を実装(W6-1)。保存期間・削除手順(OQ-009)決定が前提 |
| 対応優先時期 | Phase 6(評価実施前必須) |
| 判断要否 | 同意文面・データ管理は研究者本人+**指導教員確認必須**(roadmap EG-09) |
| Phase 3以降への停止条件か | Phase 3〜5は進行可。**Phase 7.5のNO-GO条件** |
| 推奨反映先 | `05-evaluation-plan.md`(同意手順)、`02-open-questions.md`(OQ-009)、`docs/operations/research-data-management.md`(新規、roadmap§6)、Linear Issue |

## High

### RSK-05 OQ-004/OQ-005の未決定が全実装をブロック

| 項目 | 内容 |
|---|---|
| 重大度 | High |
| 根拠 | [確認済み事実] 02-open-questions.md がOQ-004(診断→開始ノード規則)・OQ-005(ルート生成契約)を高優先未確定と明記。routeGenerator未実装(06-implementation-status.md)。履修計画書の前期目標に対し前期中盤で未決定(notes/01 S-2) |
| 事実/推測 | 未確定・未実装は事実。「前期目標に対する進捗リスク」は履修計画書の記述に基づく評価 |
| 影響 | W5(routeGenerator)・W6(ログ形式)・W8(テスト設計)が着手不能。実装ではなく意思決定がクリティカルパス |
| 起こり得る具体的失敗 | 決定を待つ間に実装者(Codex等)が旧route-generation-spec案を無審査で既定値として実装する(C-4。roadmap禁止事項「未確定事項を実装者が既定値で補完する」に該当) |
| 推奨対応 | Phase 3で旧spec案を項目別に採否判定するのが最短(W2-1/W2-2) |
| 対応優先時期 | Phase 2.5完了後、直ちにPhase 3 |
| 判断要否 | 研究者本人。RQとの関係が変わる場合は指導教員 |
| Phase 3以降への停止条件か | **これ自体がPhase 3の主題**。未解消のままPhase 4以降へ進むことはroadmap Phase 3承認ゲートで禁止 |
| 推奨反映先 | 決定後: `01-confirmed-decisions.md`、`02-open-questions.md`(クローズ)、`09-decision-log.md`、`docs/architecture/route-generation.md`(新規) |

### RSK-06 仕様準拠を機械的に検証する手段がない

| 項目 | 内容 |
|---|---|
| 重大度 | High |
| 根拠 | [確認済み事実] テストファイル0件・tsconfig.jsonなし・typescript本体が依存に不在・ESLint/CI設定なし・main直コミット運用(trees API全93エントリ、package.json、branches/commits APIで確認。notes/05) |
| 事実/推測 | 確認済み事実 |
| 影響 | 決定性要求(R-30)を検証する手段が存在しない。routeGenerator実装後も正しさ・再現性を示せない。本監査の主張も今後のコミットで無効化されても検出されない |
| 起こり得る具体的失敗 | 型エラーを含むコードがmainに直行し、評価直前に動作しないことが判明。仕様変更のリグレッションに気づかず評価データの条件が汚染される |
| 推奨対応 | W3(typescript+tsconfig+vitest+最小CI+lockファイル) |
| 対応優先時期 | Phase 4(roadmapの位置づけ通り)。W5実装開始の前提 |
| 判断要否 | 実装判断で可(方針の短文文書化のみ研究者確認) |
| Phase 3以降への停止条件か | Phase 3(仕様確定)は進行可。**Phase 5(実装)開始の停止条件** |
| 推奨反映先 | `docs/operations/testing.md`(新規、roadmap§3)、`06-implementation-status.md`、Linear Issue(W3) |

### RSK-07 errorMappingsの参照切れ15件(6エラーでRQ2機能が無効)

| 項目 | 内容 |
|---|---|
| 重大度 | High |
| 根拠 | [確認済み事実・機械検証済み] nodeRefs全27件中15件が非正規ドット形式ID(例: `css.cascade.specificity`)でlearningNodes.tsに不存在。6エラー(E_HTML_LINK_HREF_INVALID等、いずれもMVP外)は参照が全滅。PracticeChallenge.tsx は `isMvpNodeId` フィルタで黙って捨てる(検証スクリプト: notes/verification-scripts/) |
| 事実/推測 | 確認済み事実。「旧ID体系の移行取り残し」は状況証拠(旧配列形状への防御コード残存)に基づく推測 |
| 影響 | D-002(正規ID)・「参照切れを許容しない」(01-confirmed-decisions)への違反状態。検出範囲を広げた瞬間にRQ2の「エラー→復習提示」が無音で壊れる |
| 起こり得る具体的失敗 | MVP外エラーの検出を追加した際、被験者にエラーは表示されるが復習単元が提示されず、RQ2の評価データが欠損する |
| 推奨対応 | 15件を正規IDへ修正するか「MVP外・未移行」を明示するデータ修正+参照整合の自動テスト(W4-1、W3-2とセット) |
| 対応優先時期 | Phase 4(小さく検証可能な1PR) |
| 判断要否 | MVP外6エラーの扱い(修正/明示的除外)は研究者本人の軽い判断 |
| Phase 3以降への停止条件か | 停止条件ではないが、Phase 5でエラー由来推薦を実装する前に解消必須 |
| 推奨反映先 | `03-mvp-scope.md`(MVP外エラーの状態注記)、`06-implementation-status.md`、Linear Issue(W4-1) |

### RSK-08 確認テスト・教材がノード非依存(モック)

| 項目 | 内容 |
|---|---|
| 重大度 | High |
| 根拠 | [確認済み事実] Quiz.tsx は無名固定3問(id/nodeIdなし、Appからnodeid非伝達)。LearningModule.tsx の learningContent は currentNodeId 非参照の固定HTML基礎教材。learningNodes.ts に教材本文フィールドなし(notes/02 §11、notes/03 §5・8) |
| 事実/推測 | 確認済み事実 |
| 影響 | quiz-{nodeId}[確定]が未実装。誤答・学習行動をノードへ紐付けるトレースが構造的に不可能。RQ1の「ルートの納得感」も全ノード同一教材では成立しない |
| 起こり得る具体的失敗 | 被験者がcss-060を学習してもHTML入門が表示され、評価が「ツールの完成度不足」への反応に汚染される。教材12ノード分の作成工数を見誤り後期評価が遅延する |
| 推奨対応 | OQ-006決定+教材整備範囲の研究者判断(全12ノードか評価経路のみか)→データ駆動化(W8) |
| 対応優先時期 | 範囲判断はPhase 3、実装はPhase 5-6と並行 |
| 判断要否 | 研究者本人(教材範囲は評価計画に影響するため指導教員に共有推奨) |
| Phase 3以降への停止条件か | 停止条件ではない。**Phase 7.5(EG-02 MVP凍結)までに解消必須** |
| 推奨反映先 | `02-open-questions.md`(OQ-006)、`03-mvp-scope.md`(教材整備範囲)、Linear Issue(W8) |

## Medium

### RSK-09 文書二系統の正が未宣言(C-1)・評価計画の乖離(C-2)
- [確認済み事実] 詳細は context-consistency-audit.md C-1/C-2。
- 影響: 引き継ぎ先(ChatGPT/Codex)が旧evaluation-planや旧specを正として実装する誤りを誘発。
- 対応: 各文書へのステータス明記+decision-log追記(W1-3、30分程度)。
- 反映先: `09-decision-log.md`、旧5文書の冒頭注記、`10-handover.md`。

### RSK-10 ビルド再現性が個人環境依存
- [確認済み事実] package-lock.jsonを.gitignoreで除外、`"*"`指定依存3件(clsx/hono/tailwind-merge)、npm命名規則違反の`"name": "Web Learning Tool"`、vite.configの版付きエイリアス約40件とpackage.jsonの二重管理。
- 影響: 「いつ・どの版で動いたか」を追跡できず、評価時のアプリ版固定(catalogVersion/routeVersion管理)の前提が崩れる。npm installが失敗する環境がある。
- 対応: name修正・lockファイルコミット・版固定(W3に同梱)。反映先: Linear Issue(W3)。

### RSK-11 モック初期値による実データ汚染
- [確認済み事実] App.tsx初期progressにダミー実績(§RSK-02)。永続化を後付けするとダミーと実データが区別不能。
- 対応: W4-2でダミー初期値を空にし、仕様上の初期状態を定義。反映先: `06-implementation-status.md`、Linear Issue(W4-2)。

### RSK-12 セッション・トークン設計の欠陥
- [確認済み事実] accessTokenはstate保持のみでリロードで消失。signup直後はトークン未取得のまま学習フローへ進み、認可付きAPI(/profile)を呼べない(SignupSurveyのコメントで先送りを明言)。
- 影響: 永続化を実装しても保存経路が機能しない。被験者の途中離脱時にデータ全損。
- 対応: W6-2(永続化と同時に修正)。反映先: `06-implementation-status.md`、Linear Issue(W6-2)。

## Low(記録のみ・研究目的への影響は小)

- RSK-13 Onboarding.tsxデッドコード(SignupSurveyと閾値不一致のdetermineLevel重複: 7/5/>0 vs 24/17/10)— 削除のみ(W4-3)。
- RSK-14 questionConfig.json(不正JSON・未参照のデッドファイル)— 削除のみ(W4-3)。
- RSK-15 存在しないフィールド参照: **Dashboard.tsx と PracticeChallenge.tsx の両方**が node.category(空表示)/node.difficulty(常にundefined→「上級」側へフォールバック)を参照 [検証済み。Dashboard側は最終照合で追加確認] — 表示削除(W4-4)。
- RSK-16 css-041残存(MVP外)、Tutorial.tsxの文字化け(「作りま���ょう」)、Completionの未接続ボタン群 — 低優先。

## 対象外候補(研究目的に寄与しない改善。実施しないことを推奨)

- 依存関係の全面削減(Radix 27+shadcn 46ファイル): 動作に実害なし。評価後で十分。
- Next.js等への技術移行: OQ-010でMVP対象外と確定済み。
- Completionの修了証・SNSシェア・ポートフォリオ機能の実装: 評価項目でない。
- URLルーティング・状態管理ライブラリ導入: 現行のphase遷移で評価可能。
- デザイン・アクセシビリティの網羅的改善: 評価に必要な範囲(虚偽文言修正等)のみ対応。
- リポジトリ全体のLint一括修正: roadmap Phase 4の原則(変更対象中心)に従い対象外。
