# Web Learning Tool

プログラミング初学者向けの個別ルート提示学習モデルを検証する研究MVPです。元のFigmaプロジェクトは <https://www.figma.com/design/F16zQGxYolIMdeeIVAUpfz/Web-Learning-Tool> です。

## Research Source of Truth

研究仕様の正本は `docs/research/` 配下です。コードは現在の実装状態を示す確認材料であり、研究仕様の正解とはみなしません。

矛盾がある場合は、`docs/research/09-decision-log.md` の最新有効Decisionを優先し、D-019の対象別正本と参照原則に従って解釈します。D-019はD-010の正本原則を具体化する有効なDecisionです。

作業前に次を確認してください。

- `AGENTS.md`
- `docs/research/09-decision-log.md`
- `docs/operations/codex-workflow.md`
- `docs/operations/ai-research-development-roadmap.md`
- `docs/README.md`
- `docs/research/10-handover.md`

## Running the Code

```bash
npm i
npm run dev
```

## Verification

現在の検証入口は次の通りです。

```bash
npm run typecheck
npm run lint
npm run test
npm run verify
```

`verify` は `check` を実行します。`check` は `typecheck`、`lint`、`test`、`build` をまとめて実行します。

## Codex Workflow

Codexでの作業はIssue単位で行い、未確定の研究仕様を実装者判断で補完しないでください。詳細は `docs/operations/codex-workflow.md` を参照してください。

Git/GitHub運用では、デフォルトブランチへの直接作業を禁止し、ブランチ名、コミット形式、Pull Request作成手順を `docs/development/git-workflow.md` に従って統一してください。
