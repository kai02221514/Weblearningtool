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

## Related Operations

- Codex workflow: `docs/operations/codex-workflow.md`
- AI research/development roadmap: `docs/operations/ai-research-development-roadmap.md`
- Current handover: `docs/research/10-handover.md`
