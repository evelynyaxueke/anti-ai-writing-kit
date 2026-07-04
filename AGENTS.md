# AGENTS.md

Guidance for agents working in this skill folder.

## What this repo is

This is a portable agent skill for writing and editing prose without common AI-writing tells.

The main runtime file is `SKILL.md`. The operations file supports loading behavior, customization, reset, and everyday rule additions.

There is no build step.

## Key files

- `SKILL.md`: core writing rules and skill metadata. Keep frontmatter to `name` and `description`.
- `LICENSE`: MIT license for public reuse.
- `agents/openai.yaml`: Codex UI metadata. It controls the display name, short description, and default prompt shown in the app.
- `operations/kit-operations.md`: loading behavior, guided customization workflow, reset behavior, everyday rule additions, and fixed agent replies.
- `skill-customized.md`: generated local user version. Do not commit it.

## Maintenance contract

When changing behavior, update the smallest file that owns that behavior:

- Writing rules belong in `SKILL.md`.
- Loading, customization, reset, rule additions, and fixed replies belong in `operations/kit-operations.md`.
- User-facing explanation belongs in `README.md`.

Keep `README.md` and `operations/kit-operations.md` in sync for default use, customization, rule additions, and reset.

Do not create `skill-customized.md` during normal loading, writing, editing, or explanation. Create it only when the user asks to customize.

If the user says `reset` or clearly asks to delete the customized version, delete only `skill-customized.md`.

Do not explain monthly update syncing, merge behavior, or update reminders to users until that process is deliberately designed.

## Rule editing

Before adding a new rule, search the target file for an existing rule that already covers the issue.

Prefer revising one existing rule over adding a near-duplicate.

Keep examples short. Include what to do instead, not only what to avoid.

Check that a cleanup rule does not make normal writing stiff.

Keep personal preferences in `skill-customized.md` unless the user explicitly asks to make them default rules.

## Before publishing

Remove local generated files.

Keep `LICENSE` in the repo root.

If Claude Code plugin support is needed, add `.claude-plugin/plugin.json` and keep its metadata in sync with `README.md`.
