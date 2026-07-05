# AGENTS.md

This file defines the minimum operating rules for Codex and other coding agents in this repository. It is an entry point, not the research specification.

## Scope

These instructions apply to the whole repository.

## Required Reading

Before implementation work, read the current task or Linear issue and then use this source order:

1. Current task, Linear issue, or current researcher instruction
2. `docs/research/09-decision-log.md`
3. `docs/research/01-confirmed-decisions.md`
4. `docs/research/02-open-questions.md`
5. `docs/research/03-mvp-scope.md`
6. Other task-relevant files under `docs/research/`
7. Task-relevant files under `docs/architecture/`
8. Task-relevant files under `docs/operations/`
9. Current code, as implementation-state evidence only
10. `docs/references/` and `docs/archive/`, as non-canonical history

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

詳細は `docs/development/git-workflow.md` を正とする。

- デフォルトブランチ上で変更、commit、pushしない。
- 作業前にワークツリーと現在ブランチを確認する。
- デフォルトブランチを最新化してから作業ブランチを作成する。
- ブランチ名は `<type>/<short-description>` とする。
- コミットは `<type>(<scope>): <日本語の変更要約>` とする。
- 大規模作業は論理的な単位でコミットを分割する。
- PR作成には必ず `gh pr create` を使用する。
- 同一ブランチの既存PRを確認し、重複PRを作成しない。
- 実行していない検証や失敗した検証を成功として報告しない。
- 作業と無関係な既存変更を含めない。

## Related Operations

- Git/GitHub workflow: `docs/development/git-workflow.md`
- Codex workflow: `docs/operations/codex-workflow.md`
- AI research/development roadmap: `docs/operations/ai-research-development-roadmap.md`
- Current handover: `docs/research/10-handover.md`
