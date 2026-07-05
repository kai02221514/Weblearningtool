# Git・GitHub運用規約

- 状態: 有効
- 対象: Codexを含む開発エージェント、研究者本人、その他の実装担当者
- 目的: デフォルトブランチへの直接作業を防ぎ、ブランチ名、コミット、Pull Request作成手順、検証証跡を統一する

## 1. 規約の目的

この規約は、次の問題を防ぐための運用ルールである。

- `main`、`master`、その他デフォルトブランチ上で直接作業・commit・pushする。
- ブランチ名が作業ごとに不統一になる。
- 複数目的の大規模変更を1コミットへまとめる。
- コミットメッセージの形式が不統一になる。
- Pull Request作成時にGitHub CLIの `gh pr create` を使わない。

このリポジトリでは、研究仕様、実装、検証証跡、PR履歴を追跡できることを重視する。文書だけではGitHub上の直接pushを技術的に完全禁止できないため、必要に応じてGitHub Rulesetsまたはブランチ保護も別途設定する。

## 2. 基本原則

- すべての変更は、デフォルトブランチから作成した作業ブランチ上で行う。
- `main`、`master`、その他デフォルトブランチ上で直接ファイルを変更、commit、pushしてはならない。
- 作業開始時に現在のブランチとワークツリーの状態を確認する。
- 作業と無関係な既存変更を、commit、削除、整形、修正に含めてはならない。
- 原則として、1つのブランチとPull Requestには1つの目的だけを持たせる。
- Pull Request作成には必ずGitHub CLIの `gh pr create` を使用する。
- 実行していない検証や失敗した検証を成功扱いしない。

## 3. 標準フロー

### 3.1 現状確認

作業開始時は最低限、次を実行する。

```bash
git status --short --branch
git remote -v
git branch --show-current
git remote show origin
git log --oneline --decorate -n 20
find .. -name AGENTS.md -o -name CONTRIBUTING.md -o -name README.md
```

必要に応じて、次も確認する。

- リポジトリのデフォルトブランチ
- 既存のブランチ命名傾向
- 既存のコミットメッセージ傾向
- `AGENTS.md`
- `CONTRIBUTING.md`
- `.github/pull_request_template.md`
- `.github/PULL_REQUEST_TEMPLATE/`
- `docs/` 以下の開発文書
- `package.json`、README等に記載された検証コマンド
- GitHub Actions等のCI設定
- GitHub CLIの利用可否と認証状態

未コミット変更が存在する場合は、その変更が今回の作業によるものではない限り変更せず、混入させない。安全に作業を分離できない場合は作業を中断し、状況を報告する。

### 3.2 デフォルトブランチの最新化

リモート状態を取得する。

```bash
git fetch origin --prune
```

デフォルトブランチへ移動して最新化する必要がある場合は、未コミット変更がなく、安全であることを確認してから実行する。デフォルトブランチを `main` と決め打ちせず、`git remote show origin` で確認する。

```bash
git switch <default-branch>
git pull --ff-only origin <default-branch>
```

### 3.3 作業ブランチ作成

変更前に、デフォルトブランチから作業ブランチを作成する。

```bash
git switch -c <type>/<short-description>
git status --short --branch
git branch --show-current
```

この時点以降、デフォルトブランチ上で作業していないことを確認する。

### 3.4 実装または文書更新

- Issueまたは依頼の目的、対象、対象外、受入条件、検証方法から外れない。
- 研究仕様の変更とアプリケーション実装を混在させない。ただし、Issueが明示的に両方を求める場合はPR本文で理由と範囲を説明する。
- `src/` 配下の変更は、Issueがアプリケーション挙動またはテストを明示している場合だけ行う。
- 既存文書を更新する場合は、重複文書を増やす前に既存構造へ統合できるか確認する。

### 3.5 コミット前確認

コミット前には最低限、次を確認する。

```bash
git status --short
git diff
git diff --staged
```

作業と無関係な変更が含まれていないこと、意図しない整形変更が混ざっていないことを確認する。

### 3.6 検証

commitおよびPull Request作成前に、リポジトリで定義された検証を可能な範囲で実行する。実行コマンドは `package.json`、README、既存CI、`AGENTS.md` から確認する。

このリポジトリの主な検証入口は次である。

```bash
npm run verify
```

`verify` は `check` を実行し、`check` は `typecheck`、`lint`、`test`、`build` をまとめて実行する。必要に応じて個別コマンドも実行できる。

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

検証を実行できなかった場合や失敗した場合は、隠さずPull Request本文に記載する。文書のみの変更でも、利用可能なMarkdown lint等が既存環境にあれば実行する。新しいlintツールを今回だけのために導入する必要はない。

### 3.7 コミット

論理的な単位ごとにcommitする。ファイル数だけを理由に機械的に分割せず、レビュー・revert・検証の単位として意味があるかで判断する。

```bash
git add <files>
git diff --staged
git commit -m "<type>(<scope>): <日本語の変更要約>"
```

### 3.8 push

作業ブランチだけをpushする。

```bash
git push -u origin "$(git branch --show-current)"
```

デフォルトブランチへのpushは禁止する。

### 3.9 Pull Request作成

Pull Request作成前に次を確認する。

```bash
git status --short
git log --oneline <default-branch>..HEAD
git diff --stat <default-branch>...HEAD
gh auth status
gh pr status
gh pr list --head "$(git branch --show-current)"
```

同一ブランチのPull Requestが既に存在する場合は、新しいPRを重複作成しない。

新規PRは必ず `gh pr create` で作成する。Web UI、独自API実装、別ツールによる作成は禁止する。

```bash
gh pr create \
  --base <default-branch> \
  --head "$(git branch --show-current)" \
  --title "<PRタイトル>" \
  --body-file <PR本文ファイル>
```

未完成またはレビュー前提の作業は、必要に応じて `--draft` を付ける。

```bash
gh pr create \
  --draft \
  --base <default-branch> \
  --head "$(git branch --show-current)" \
  --title "<PRタイトル>" \
  --body-file <PR本文ファイル>
```

## 4. ブランチ命名規則

形式:

```text
<type>/<short-description>
```

`short-description` は英小文字のkebab-caseとし、変更目的が分かる短い名称にする。

### 4.1 主なtype

| type | 用途 |
| ---- | ---- |
| `feat/` | 新機能 |
| `fix/` | 不具合修正 |
| `docs/` | 文書のみの変更 |
| `refactor/` | 外部仕様を変えない内部改善 |
| `test/` | テストの追加・修正 |
| `chore/` | 設定、依存関係、保守作業 |
| `ci/` | CI/CD設定 |
| `research/` | 研究仕様、評価設計、研究用データ定義 |
| `experiment/` | 実験的実装や検証 |
| `hotfix/` | 緊急修正 |

### 4.2 良い例

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

LinearやGitHub Issueの識別子が明確な場合は、必要に応じて次の形式を使用できる。

```text
<type>/<issue-id>-<short-description>
```

例:

```text
feat/res-123-add-route-recommendation
```

### 4.3 禁止例

```text
update
work
test
kai-branch
new-branch
fix_bug
feature/newFeature
```

## 5. コミット規則

コミットメッセージはConventional Commitsを基礎とし、次の形式を使用する。

```text
<type>(<scope>): <日本語の変更要約>
```

### 5.1 記述ルール

- `type` と `scope` は原則として英小文字を使用する。
- 変更要約は日本語で記述する。
- 変更要約は、何を行ったかが分かる簡潔な表現にする。
- 文末に句点は付けない。
- 「修正」「対応」「更新」だけの曖昧な要約を避ける。
- 1コミットには、レビュー・取り消し可能な1つの論理的変更を含める。
- 動作しない中間状態をむやみにcommitしない。
- コミット前に差分を確認する。
- 作業と無関係な変更を同じcommitに含めない。

### 5.2 主なtype

| type | 用途 |
| ---- | ---- |
| `feat` | 新機能 |
| `fix` | 不具合修正 |
| `docs` | 文書 |
| `refactor` | リファクタリング |
| `test` | テスト |
| `chore` | 保守・設定 |
| `ci` | CI/CD |
| `perf` | 性能改善 |
| `style` | 動作に影響しない書式変更 |
| `build` | ビルドシステム・依存関係 |
| `revert` | 変更の取り消し |
| `research` | 研究仕様・評価設計・研究用定義 |

### 5.3 良い例

```text
feat(route): 診断結果に基づく初期ルート生成を追加
fix(node): 学習ノードIDの参照不整合を修正
docs(research): MVP対象ノードの選定根拠を追記
refactor(route): 推薦ロジックを純粋関数として分離
test(route): 前提条件を考慮する推薦テストを追加
chore(deps): 開発依存パッケージを更新
research(evaluation): ルート納得感の評価項目を定義
```

### 5.4 不適切な例

```text
update
いろいろ修正
fix
作業途中
最終修正
コードを変更
```

## 6. コミットを分割する基準

次のいずれかに該当する場合は、原則としてコミットを分割する。

- 複数の独立した機能を変更している。
- 実装と大規模なリファクタリングが混在している。
- データ定義、ロジック、UI、テスト、文書を独立してレビューできる。
- 一部だけを安全にrevertできる。
- コミットの説明に「および」「さらに」が複数必要になる。
- 差分が大きく、1つの目的として説明しにくい。

ただし、コンパイル不能やテスト不能になる不自然な分割は避ける。各コミットは可能な限り独立して理解・検証できる状態にする。

### 6.1 大規模作業での分割例

```text
research(node): MVP対象ノードの定義を追加
refactor(node): 学習ノードID体系を統一
feat(route): 初期ルート生成ロジックを追加
test(route): 診断別のルート生成テストを追加
docs(route): ルート生成仕様と判断根拠を追記
```

## 7. PR本文の推奨構成

PR本文には最低限、次を含める。

```markdown
## 目的・背景

## 変更内容

## 変更対象

## 対象外

## 検証方法と結果

## 研究上の影響

## リスク・注意点

## 関連Issue・Linear

## レビュー時の確認事項
```

研究仕様への影響がない場合は「なし」と明記する。検証に失敗した場合や未実行の検証がある場合は、失敗内容または未実行理由を記録する。

## 8. トラブル時の対応

### 8.1 デフォルトブランチ上で誤って変更した場合

- そのままcommitしない。
- まず `git status --short --branch` と `git diff` で変更内容を確認する。
- 変更が今回の作業だけで、未コミット状態のまま安全に分離できる場合は、新規ブランチを作成してからcommitする。

```bash
git switch -c <type>/<short-description>
git status --short --branch
```

- 他者または利用者の未コミット変更が混在している場合は、削除、上書き、stash、commitをせずに状況を報告する。
- `git checkout -f`、`git reset --hard`、`git clean -fd` など、作業内容を破壊し得るコマンドは使用しない。

### 8.2 未コミット変更が存在する場合

- 自分の変更かどうかを確認する。
- 今回の作業と無関係な変更はcommitに含めない。
- 安全に分離できない場合は作業を中断し、変更ファイル、現在ブランチ、必要な判断を報告する。
- 利用者が作った可能性がある変更を勝手に削除、整形、stash、commitしない。

### 8.3 GitHub CLI認証エラー時

`gh auth status` が失敗した場合は、成功したふりをせず、実行したコマンド、エラー内容、必要な対応を報告する。

確認コマンド:

```bash
gh auth status
```

代表的な利用者対応:

```bash
gh auth login -h github.com
```

既存アカウントの認証を解除してやり直す必要がある場合:

```bash
gh auth logout -h github.com -u <user>
gh auth login -h github.com
```

### 8.4 `gh pr create` が失敗した場合

- Web UIや別手段でPRを作成しない。
- `gh pr list --head "$(git branch --show-current)"` で既存PRの有無を確認する。
- 認証、権限、push未完了、base branch指定、リモート名の問題を切り分ける。
- 失敗したコマンドとエラー内容を報告し、利用者が再認証または権限調整を行えるようにする。

## 9. 完了報告

作業完了時は次を報告する。

- 作成したブランチ名
- 作成したコミット一覧
- 変更ファイル
- 実施した検証と結果
- push結果
- Pull RequestのURL
- 未完了事項または失敗事項
