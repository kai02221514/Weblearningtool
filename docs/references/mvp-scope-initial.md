# MVPスコープ

> [!WARNING]
> この文書は初期案・参考資料であり、現在の研究仕様の正本ではない。
> 現行のMVP仕様は `../research/03-mvp-scope.md`、有効な判断は `../research/09-decision-log.md` を参照する。

- 最終更新日: 2026-06-19
- 文書ステータス: 確定
- 対象: HTML/CSS個別学習ルート生成MVP

## MVPの目的

MVPでは教材範囲の網羅ではなく、診断、進捗、確認テスト、実践課題のエラー、振り返りを正規ノードIDへ統合し、学習者ごとのルートを提示する仕組みを検証する。

評価時間、教材作成量、エラー検出との接続性、前提関係の分かりやすさを優先し、対象を12ノードに限定する。現行の全63ノードは将来拡張用カタログとして保持し、MVP対象と同一視しない。

## 確定MVPノード

| 順序 | ID | 表示名 | 前提ノード | 確認テストID |
| ---: | --- | --- | --- | --- |
| 1 | `html-000` | HTMLとは何か | なし | `quiz-html-000` |
| 2 | `html-010` | HTML基本骨格 | `html-000` | `quiz-html-010` |
| 3 | `html-020` | 要素とタグ | `html-010` | `quiz-html-020` |
| 4 | `html-021` | 入れ子構造 | `html-020` | `quiz-html-021` |
| 5 | `html-022` | 属性 | `html-020` | `quiz-html-022` |
| 6 | `html-031` | 見出し階層 | `html-021` | `quiz-html-031` |
| 7 | `html-040` | リスト | `html-021` | `quiz-html-040` |
| 8 | `css-000` | CSSとは何か | `html-020` | `quiz-css-000` |
| 9 | `css-010` | CSSの適用方法 | `css-000`, `html-010` | `quiz-css-010` |
| 10 | `css-011` | CSS基本構文 | `css-010` | `quiz-css-011` |
| 11 | `css-020` | 基本セレクタ | `css-011`, `html-022` | `quiz-css-020` |
| 12 | `css-060` | ボックスモデル | `css-011` | `quiz-css-060` |

この前提関係はMVP 12ノード内で閉じており、参照切れと循環はない。

## 正規ノードID

正規の学習ノードIDは次の形式とする。

```text
^(html|css)-[0-9]{3}$
```

- `html_intro` のような英語slug形式は採用しない。
- `html-basics` のような画面用モジュールIDはノードIDとして扱わない。
- `html.syntax.tags.pairedTags` のようなドット形式は正規IDとして扱わない。
- 表示名と内部IDを分離し、文言変更でIDを変更しない。
- ノードIDは原則として変更、再利用しない。
- 画面グループが必要な場合は、ノードIDとは別に `moduleId` を定義する。

コード上のMVP集合は [`src/domain/mvpScope.ts`](../../src/domain/mvpScope.ts) の `MVP_NODE_IDS` を単一の定義元とする。画面やルート生成は全カタログを直接絞り込まず、`getMvpLearningNodes()` または `MVP_NODE_IDS` を参照する。

## 色指定ノード

初回MVPでは、色指定を独立した学習ノードとして扱わない。`color` や `background-color` の基本例は `css-011` CSS基本構文の教材内で軽く扱う。

独立した色指定ノードは、共通プロパティやデザイン基礎を拡張する後続フェーズの候補とする。MVPの進捗、テスト、ルート生成では独立ノードとして記録しない。

## MVPエラーマッピング

エラーIDは `E_<領域>_<内容>` の大文字スネークケースを正規形式とする。検出、履歴、推薦で同じIDを使用し、`error-missing-closing-tag` のような画面固有IDへ変換しない。

| 正規エラーID | 主な推薦ノード | 補助ノード |
| --- | --- | --- |
| `E_HTML_MISSING_CLOSING_TAG` | `html-020` | `html-021` |
| `E_HTML_INVALID_NESTING` | `html-021` | `html-040` |
| `E_HTML_MISSING_REQUIRED_ATTR` | `html-022` | なし |
| `E_HTML_HEADING_STRUCTURE` | `html-031` | なし |
| `E_CSS_SYNTAX_MISSING_SEMICOLON` | `css-011` | なし |
| `E_CSS_SELECTOR_NO_MATCH` | `css-020` | `html-022` |
| `E_LAYOUT_BOX_MODEL_MISUNDERSTANDING` | `css-060` | なし |
| `E_RUNTIME_RESOURCE_PATH` | `css-010` | `html-010` |

`nodeRefs.priority` は1を主推薦とし、2以降を補助推薦とする。すべての参照先は実在するMVPノードでなければならない。

### MVP外エラー候補

現行の[エラーマッピング定義](../../src/data/errorMappings.ts)にある次のエラーは削除せず、初回MVPの評価・推薦対象から外す。

- `E_HTML_LINK_HREF_INVALID`
- `E_CSS_PROPERTY_UNKNOWN`
- `E_CSS_SPECIFICITY_OVERRIDE`
- `E_LAYOUT_FLEX_AXIS_CONFUSION`
- `E_DEBUG_TOOL_NOT_USED`
- `E_FORM_LABEL_ASSOCIATION`

これらの `nodeRefs` は旧ドット形式を含む。後続フェーズで対象ノードを確定するときに正規IDへ移行し、MVPルート生成では読み込まない。

## 確認テストID

確認テストIDは次の規則に統一する。

```text
quiz-{nodeId}
```

例: `quiz-html-000`, `quiz-html-010`, `quiz-css-011`

1つの確認テストは原則として1つの正規ノードIDに対応させる。複数ノードを評価する統合テストが必要な場合は別種の評価IDとして設計し、`quiz-{nodeId}` に複数ノードを割り当てない。

現行の `Quiz.tsx` は単一の固定問題配列で、テストID、問題ID、対応ノードIDを持っていない。別形式が実装されているのではなくID自体が未実装であるため、ルート生成実装Issueでデータ化する。

## 実践課題

MVPの中心実践課題IDは `practice-profile-card` とする。

対象ノードは次の10件とする。

- `html-010`
- `html-020`
- `html-021`
- `html-022`
- `html-031`
- `html-040`
- `css-010`
- `css-011`
- `css-020`
- `css-060`

`html-000` と `css-000` は概念導入ノードのため、実践課題の直接評価対象には含めない。

## 除外ノード

旧文書は「25ノード候補」と記載していたが、候補表にはHTML 15件、CSS 11件の計26件が掲載されていた。したがって、表に実在する26件から12件を採用し、次の14件を除外する。件数記載の不一致は旧文書の集計誤りとして扱う。

| 除外ノード | 除外理由 |
| --- | --- |
| `html-013` title / link / script | CSS適用の前提を `html-010` と教材内説明で代替する |
| `html-023` 相対・絶対パス | 初回評価では独立教材を作らず、リソースパスエラーを `css-010` と `html-010` に接続する |
| `html-050` リンク | プロフィールカード課題の必須範囲外 |
| `html-060` 画像とalt | 属性一般を `html-022` で扱い、画像固有教材は後続へ回す |
| `html-080` フォーム基礎 | プロフィールカード課題の必須範囲外 |
| `html-081` labelとfor | フォーム基礎と合わせて後続へ回す |
| `html-100` HTMLバリデーション | デバッグ統合教材は12ノードの仕組み検証後に追加する |
| `html-110` アクセシビリティ基礎 | 見出しと属性の基本のみMVPに残し、統合教材は後続へ回す |
| `css-030` カスケードと詳細度 | 初回MVPのエラー検出・実践要件から外す |
| `css-061` box-sizing | ボックスモデル教材内で補足し、独立評価しない |
| `css-062` display | Flexbox系ノードと合わせて後続へ回す |
| `css-090` Flexboxの軸 | レイアウト範囲をボックスモデルまでに限定する |
| `css-091` Flex配置 | Flexboxの軸と合わせて後続へ回す |
| `css-120` CSSデバッグ | エラー推薦の仕組み検証後に統合教材として追加する |

## 既存コードとの照合結果

| 確認項目 | 結果 |
| --- | --- |
| MVP 12ノードの存在 | `src/data/learningNodes.ts` に12件すべて存在する |
| MVP前提関係 | `html-040`, `css-000`, `css-010` に確定仕様との差分があり、2026-06-19に修正した |
| 前提参照の実在性 | MVP 12ノード内で実在IDだけを参照し、循環しない |
| MVPエラーマッピング | 旧ドット形式だった8件を正規MVPノードIDへ修正した |
| 初期推奨・学習画面 | `css-basics`, `html-semantics`, `html-basics` を正規ノードIDへ修正した |
| 進捗ID | `completedModules` と `completedNodeIds` の混在を `completedNodeIds` に統一した |
| 確認テスト | IDとノード対応が未実装。命名規則のみ確定し、データ化は次Issue |
| 実践課題 | `practice-profile-card` と対象10ノードをコード上の課題メタデータへ追加した |
| 実践課題のエラー検出 | 現行コードはMVP 8エラーのうち閉じタグ、入れ子、必須属性、見出し、CSS構文を検出する。セレクタ不一致、ボックスモデル、リソースパスの検出は未実装 |
| 全63ノードのMVP絞り込み | 全カタログは保持し、`MVP_NODE_IDS` と `getMvpLearningNodes()` を単一定義として追加した。Dashboard、LearningModule、PracticeChallenge、学習開始処理はMVP集合だけを参照する |
| MVP外エラー | 削除していない。旧ドット形式の `nodeRefs` は後続移行対象 |

## 次Issue案

### 件名

`route-generation-spec.mdをMVP 12ノード契約へ更新し、決定的なrouteGeneratorを実装する`

### 対象

- `routeGenerator` から既存の `MVP_NODE_IDS` と `getMvpLearningNodes()` を参照する。
- `quiz-{nodeId}` の確認テストデータと問題単位のノード対応を定義する。
- `practice-profile-card` の結果を正規エラーIDと対象ノードへ接続する。
- `route-generation-spec.md` の入力、優先順位、復習条件、同順位規則を確定する。
- `completedNodeIds`, `inProgressNodeId`, テスト誤答、MVPエラー、振り返りを入力とする純粋な `routeGenerator` を実装する。
- 前提補完、トポロジカル順、未知ID、循環、決定性を自動テストする。

### 対象外

- 教材UIの改善
- MVP外ノード・MVP外エラーのルート組み込み
- 永続化と研究評価画面
