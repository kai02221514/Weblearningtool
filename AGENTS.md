# AGENTS.md

This file defines the minimum operating rules for Codex and other coding agents in this repository. It is an entry point, not the research specification.

## Scope

These instructions apply to the whole repository.

## Required Reading

Before implementation work, read the current task or Linear issue and then use this source order:

1. `docs/research/09-decision-log.md`
2. `docs/research/01-confirmed-decisions.md`
3. `docs/research/02-open-questions.md`
4. Task-relevant files under `docs/research/`
5. `docs/operations/ai-research-development-roadmap.md`
6. `docs/research/10-handover.md`
7. `docs/operations/codex-workflow.md`

If documents conflict, follow the latest valid decision in `docs/research/09-decision-log.md`. Code is evidence of implementation state, not the source of research truth.

## Codex Rules

- Work in issue-sized changes. Do not start implementation unless the issue states purpose, scope, out-of-scope items, acceptance criteria, and verification method.
- Do not decide unresolved research questions. If an issue still requires a researcher decision, stop and report what must be decided.
- Do not treat mocks, fixed values, or existing UI behavior as confirmed research specification.
- Keep research specification changes separate from application implementation unless the issue explicitly requires both.
- Do not change files under `src/` unless the issue explicitly includes application behavior or tests in scope.
- Run only validation commands that exist in `package.json`. Do not report unrun checks as successful.
- Leave PR evidence: related issue, changed files, out-of-scope items, validation commands and results, unverified items, and rollback method.

## Git・GitHub運用規約

詳細手順は `docs/development/git-workflow.md` を正とする。この節は、Codexを含む開発エージェントが必ず守る最低限の強制規則である。

### 基本原則

- すべての変更は、デフォルトブランチから作成した作業ブランチ上で行う。
- `main`、`master`、その他デフォルトブランチ上で直接ファイルを変更、commit、pushしてはならない。
- 作業開始時に現在のブランチとワークツリーの状態を確認する。
- 作業と無関係な既存変更を、commit、削除、整形、修正に含めてはならない。
- 原則として、1つのブランチとPull Requestには1つの目的だけを持たせる。
- Pull Request作成には必ずGitHub CLIの `gh pr create` を使用する。

### 作業開始手順

作業開始時は最低限、以下を実行する。

```bash
git status --short --branch
git fetch origin --prune
git branch --show-current
```

デフォルトブランチを最新化した後、変更前に作業ブランチを作成する。

作業ブランチを作成できない場合や、デフォルトブランチ上で既に変更してしまった場合は、そのままcommitせず、安全に新規ブランチへ移せるか確認する。

### ブランチ命名規則

形式:

```text
<type>/<short-description>
```

`short-description` は英小文字のkebab-caseとし、変更目的が分かる短い名称にする。

使用可能な主な `type`:

- `feat/`: 新機能
- `fix/`: 不具合修正
- `docs/`: 文書のみの変更
- `refactor/`: 外部仕様を変えない内部改善
- `test/`: テストの追加・修正
- `chore/`: 設定、依存関係、保守作業
- `ci/`: CI/CD設定
- `research/`: 研究仕様、評価設計、研究用データ定義
- `experiment/`: 実験的実装や検証
- `hotfix/`: 緊急修正

例:

```text
feat/add-route-recommendation
fix/correct-learning-node-id
docs/update-evaluation-plan
refactor/extract-route-generator
test/add-route-generator-tests
chore/update-dependencies
research/define-mvp-learning-nodes
experiment/compare-route-scoring
```

禁止例:

```text
update
work
test
kai-branch
new-branch
fix_bug
feature/newFeature
```

LinearやGitHub Issueの識別子が明確な場合は、必要に応じて次の形式を使用できる。

```text
<type>/<issue-id>-<short-description>
```

例:

```text
feat/res-123-add-route-recommendation
```

### コミット規則

コミットメッセージはConventional Commitsを基礎とし、次の形式を使用する。

```text
<type>(<scope>): <日本語の変更要約>
```

- `type` と `scope` は原則として英小文字を使用する。
- 変更要約は日本語で記述する。
- 変更要約は、何を行ったかが分かる簡潔な表現にする。
- 文末に句点は付けない。
- 「修正」「対応」「更新」だけの曖昧な要約を避ける。
- 1コミットには、レビュー・取り消し可能な1つの論理的変更を含める。
- 動作しない中間状態をむやみにcommitしない。
- コミット前に差分を確認する。
- 作業と無関係な変更を同じcommitに含めない。

主な `type`:

- `feat`: 新機能
- `fix`: 不具合修正
- `docs`: 文書
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: 保守・設定
- `ci`: CI/CD
- `perf`: 性能改善
- `style`: 動作に影響しない書式変更
- `build`: ビルドシステム・依存関係
- `revert`: 変更の取り消し
- `research`: 研究仕様・評価設計・研究用定義

例:

```text
feat(route): 診断結果に基づく初期ルート生成を追加
fix(node): 学習ノードIDの参照不整合を修正
docs(research): MVP対象ノードの選定根拠を追記
refactor(route): 推薦ロジックを純粋関数として分離
test(route): 前提条件を考慮する推薦テストを追加
chore(deps): 開発依存パッケージを更新
research(evaluation): ルート納得感の評価項目を定義
```

不適切な例:

```text
update
いろいろ修正
fix
作業途中
最終修正
コードを変更
```

### コミットを分割する基準

次のいずれかに該当する場合は、原則としてコミットを分割する。

- 複数の独立した機能を変更している。
- 実装と大規模なリファクタリングが混在している。
- データ定義、ロジック、UI、テスト、文書を独立してレビューできる。
- 一部だけを安全にrevertできる。
- コミットの説明に「および」「さらに」が複数必要になる。
- 差分が大きく、1つの目的として説明しにくい。

ただし、コンパイル不能やテスト不能になる不自然な分割は避ける。各コミットは可能な限り独立して理解・検証できる状態にする。

## Related Operations

- Git/GitHub workflow: `docs/development/git-workflow.md`
- Codex workflow: `docs/operations/codex-workflow.md`
- AI research/development roadmap: `docs/operations/ai-research-development-roadmap.md`
- Current handover: `docs/research/10-handover.md`
