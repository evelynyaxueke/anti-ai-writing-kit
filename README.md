# Anti-AI Writing Kit

A portable agentic writing system for writing, editing, rewriting, polishing, and reviewing prose without common AI-writing tells.

This repo is a skill set, not a single prompt:

- `SKILL.md` gives agents a strong writing standard.
- `operations/kit-operations.md` adds customization, reset, and rule maintenance.
- `skill-customized.md` lets each user keep a local version.

Together, they give AI a stronger, more effective, more systematic way to produce cleaner prose by avoiding common bad patterns.

## Scope and boundaries

This kit improves AI writing by giving the model explicit patterns to avoid and a process for checking its own output. It is for cleaner writing, writing review, and editing. It is not for proving who wrote a piece.

It does not serve these goals:

- passing AI detectors, including academic and non-academic detectors
- teaching AI to write in your personal style
- supplying platform-specific templates, formats, or genre voices

The core rules are meant to work across formats. I plan to publish a separate skill for teaching AI to write in your personal style, and that skill can be used together with this kit. Platform-specific writing can also be handled by separate skills layered on top of this kit.

Even when this kit works better than some peer skills, it cannot promise 100 percent removal of AI smell in every run. AI-writing smell is not a stable checklist, and current models still have uneven instruction following, context retention limits, and inconsistent self-review. A model may follow a rule in one paragraph and miss the same pattern later, especially in long outputs or multi-step agent workflows.

## Using it with an agent

The recommended path is to use this kit with an agent that can load a skill folder, Markdown skill, or custom instruction folder.

With an agent, the kit can do more than apply rules once. It can guide customization, create `skill-customized.md`, add new rules in the right section, reset customization, and maintain the rule file over time.

## Using it with webpage AI

For ChatGPT, Claude, Gemini, or another web AI without skill-folder support, upload `SKILL.md` or paste its contents into the chat.

Tell the model to use `SKILL.md` as the active writing standard for that session. If you also have `skill-customized.md`, upload that file instead.

## Getting started

1. **Step 1: Customize it once.** Type `customize`; the agent walks through the rules with you and creates your local `skill-customized.md`.
2. **Step 2: Use it for writing and editing.** Send a topic, brief, draft, or finished piece; the agent follows the active rules.
3. **Step 3: Add to it anytime.** When you notice a new AI-writing habit, tell the agent what to add; it checks the current rules, chooses the right section, and avoids duplicates.

## Model recommendation

For best results, use a current model with reliable instruction following, especially for long writing tasks.

The kit can still improve smaller or older models, but they may miss subtle rules such as cross-sentence false contrast, rhythm cleanup, and the final audit. If an output still sounds AI-written, rerun it with a stronger model or a higher reasoning setting.

## What makes it different

- **Kit structure.** `SKILL.md` starts the system. The repo also supports guided customization, local overrides, rule additions, reset, and maintenance.
- **First-draft support.** The rules cover writing from a topic or brief and cleaning an existing draft.
- **Short hard-ban layer.** The most visible failures stay near the top so the agent treats them as first-pass fail states.
- **Rule taxonomy.** Rules are grouped by the reason they sound machine-made, which makes the file easier to scan and easier to update.
- **Positive defaults.** The agent gets rules for what good prose should do: use plain words, keep the meaning true, name the real claim, repeat the accurate term, and stop when the point is made.
- **Daily rule additions.** When you notice a new AI-writing habit, tell the agent. It should check whether the issue is already covered, place the rule in the right section, and avoid duplicates.
- **Final audit.** Before sending, the agent checks the full active rule document and scans for visible failures.

Rule overview:

- empty AI vocabulary
- fake depth
- fake authority
- vague claims
- decorative structure
- formulaic openings and endings
- repeated sentence rhythm
- false contrast
- over-polished cleanup

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
