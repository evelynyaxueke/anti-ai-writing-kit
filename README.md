# Anti-AI Writing Skill

A portable agentic writing skill for writing, editing, rewriting, polishing, and reviewing prose so it sounds less machine-made.

It can be used with Codex, Claude Code, and other agents that can load Markdown skills or custom instruction folders. The runtime file is `SKILL.md`.

This is an editing standard, not an AI detector. Treat the patterns as cleanup signals, not proof of authorship.

## What it does

Use this skill for:

- articles
- essays
- posts
- emails
- captions
- scripts
- page copy
- launch copy
- public or professional writing

The skill gives agents a writing standard, a guided customization flow, and a reset path for returning to the default rules.

## Install

### Codex

Choose one location.

User-level install, available in every Codex project:

```sh
mkdir -p ~/.codex/skills
git clone https://github.com/evelynyaxueke/anti-ai-writing-kit.git ~/.codex/skills/anti-ai-writing-kit
```

Project-level install, available only inside one project:

```sh
mkdir -p .agents/skills
git clone https://github.com/evelynyaxueke/anti-ai-writing-kit.git .agents/skills/anti-ai-writing-kit
```

For a private repo, the machine must be signed in to a GitHub account that has access to this repository.

After installing in the Codex app, open the command menu with `Cmd+K` or `Cmd+Shift+P`, then choose `Force Reload Skills`.

If the skill still does not appear, start a new Codex session or restart Codex.

An agent turn that was already running before installation cannot retroactively see the new skill list.

### Other agents

For Claude Code or another agent, use the agent's supported skill, plugin, or custom-instructions location and point it at this folder or at `SKILL.md`.

The core rule file is plain Markdown, so agents can also use it directly when they do not support packaged skills.

## Basic use

Invoke the skill in your agent, then send a piece, topic, or brief.

```text
Use anti-ai-writing-kit to write, edit, or review this without AI smell.
```

If no customized file exists, the agent uses `SKILL.md`.

If `skill-customized.md` exists and has content, the agent uses that file as the active writing rule document.

## Customize

Type:

```text
customize
```

The agent will guide you through the writing rules section by section.

If `skill-customized.md` does not exist, the agent creates it by copying the current rules from `SKILL.md`.

If `skill-customized.md` already exists, the agent keeps editing that same file.

During customization, rough replies are enough. You can add a few words, ask to remove a rule, or say the section is fine.

## Add a rule

To add a new daily preference or AI-writing smell, say exactly what you want added.

Examples:

```text
Add this to my rules: never use "X" as a punchline.
```

```text
Remember this: I hate when AI writes "X".
```

```text
Put this in the default skill: avoid X because it sounds fake.
```

The agent should first check whether the rule is already covered. If it is new, the agent should find the right category, add it there, and tell you where it was added.

## Reset

Type:

```text
reset
```

The agent deletes `skill-customized.md`.

After reset, the skill uses the original `SKILL.md` again.

You can also reset manually by deleting `skill-customized.md` from the skill folder.

## File layout

```text
anti-ai-writing-kit/
├── SKILL.md
├── README.md
├── AGENTS.md
├── LICENSE
├── agents/
│   └── openai.yaml
└── operations/
    └── kit-operations.md
```

Generated local files:

- `skill-customized.md`: created only when a user customizes the skill.
- `.DS_Store`: macOS folder metadata.

These are ignored by `.gitignore`.

## License

MIT License. Copyright (c) 2026 Evelyn Ke.

## Publishing notes

Platform-specific adapters can be added later without changing the core `SKILL.md` rule document.
