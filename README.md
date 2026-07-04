# Anti-AI Writing Kit

A portable agentic writing system for writing, editing, rewriting, polishing, and reviewing prose without common AI-writing tells.

It works with Codex, Claude Code, and other agents that can load Markdown skills or custom instruction folders. Recommended use: customize it once, use it for writing and editing, then add new rules whenever a pattern starts bothering you.

The patterns are editing signals for cleanup; they cannot prove whether a person or model wrote a piece.

## How to use the kit

1. **Customize it.** Type `customize`; the agent walks through the rules with you and creates your local `skill-customized.md`.
2. **Use it for writing and editing.** Send a topic, brief, draft, or finished piece; the agent follows the active rules.
3. **Add to it anytime.** When you notice a new AI-writing habit, tell the agent what to add; it checks the current rules, chooses the right section, and avoids duplicates.

## Model recommendation

For best results, use a current model with reliable instruction following, especially for long writing tasks.

The kit can still improve smaller or older models, but they may miss subtle rules such as cross-sentence false contrast, rhythm cleanup, and the final audit. If an output still sounds AI-written, try a stronger model or a higher reasoning setting before judging the kit.

## Overview

Anti-AI Writing Kit treats clean AI-assisted writing as an ongoing system. The default rules give an agent a strong starting standard. Customization lets the user keep, remove, or add rules based on their own taste. Maintenance keeps the file useful as new AI-writing habits show up.

The runtime file is `SKILL.md`. If the user customizes the kit, the agent creates `skill-customized.md` and uses that local version from then on.

## Methodology

The rules are organized by failure type:

- empty AI vocabulary
- fake depth
- fake authority
- vague claims
- decorative structure
- formulaic openings and endings
- repeated sentence rhythm
- false contrast
- over-polished cleanup

This helps the agent catch pattern families beyond exact phrases. A phrase list can miss variations. A category gives the agent the cause behind the rule.

## What makes it different

- **Kit structure.** `SKILL.md` starts the system. The repo also supports guided customization, local overrides, rule additions, reset, and maintenance.
- **First-draft support.** The rules cover writing from a topic or brief and cleaning an existing draft.
- **Short hard-ban layer.** The most visible failures stay near the top so the agent treats them as first-pass fail states.
- **Rule taxonomy.** Rules are grouped by the reason they sound machine-made, which makes the file easier to scan and easier to update.
- **Positive defaults.** The agent gets rules for what good prose should do: use plain words, keep the meaning true, name the real claim, repeat the accurate term, and stop when the point is made.
- **Daily rule additions.** When you notice a new AI-writing habit, tell the agent. It should check whether the issue is already covered, place the rule in the right section, and avoid duplicates.
- **Final audit.** Before sending, the agent checks the full active rule document and scans for visible failures.

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

## Maintain

The kit gets better when you keep using it. When you notice a phrase, rhythm, or structure that sounds like AI, tell the agent to add it.

For cleanup, ask the agent to maintain `skill-customized.md`: remove duplicates, place rough notes in the right section, and make the rules easier for agents to follow.

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
