# Web Learning Tool

プログラミング初学者向けの個別ルート提示学習モデルを検証する研究MVPです。元のFigmaプロジェクトは <https://www.figma.com/design/F16zQGxYolIMdeeIVAUpfz/Web-Learning-Tool> です。

## Research Source of Truth

研究仕様の正本は `docs/research/` 配下です。コードは現在の実装状態を示す確認材料であり、研究仕様の正解とはみなしません。

作業前に次を確認してください。

- `AGENTS.md`
- `docs/operations/codex-workflow.md`
- `docs/operations/ai-research-development-roadmap.md`
- `docs/research/10-handover.md`

## Running the Code

```bash
npm i
npm run dev
```

## Verification

現在の検証入口は次の通りです。

```bash
npm run build
npm run verify
```

`verify` は現時点で `build` を実行します。専用の `test`、`typecheck`、`lint` script はまだ定義されていません。

## Codex Workflow

Codexでの作業はIssue単位で行い、未確定の研究仕様を実装者判断で補完しないでください。詳細は `docs/operations/codex-workflow.md` を参照してください。
