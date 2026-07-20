# Anti-AI Writing Kit

A portable writing kit for drafting, editing, rewriting, polishing, and reviewing prose without common AI-writing tells.

[Click here for Simplified Chinese Version (简体中文版)](https://github.com/evelynyaxueke/anti-ai-writing-kit-zh)

This is a kit, not a single prompt:

- `SKILL.md` gives the agent its writing rules.
- `operations/kit-operations.md` handles customization, reset, and rule maintenance.
- `skill-customized.md` stores each user's local preferences.

## Test report

We tested Anti-AI Writing Kit, [Humanizer](https://github.com/blader/humanizer), [Stop Slop](https://github.com/hardikpandya/stop-slop), and a no-skill baseline on English direct-writing tasks. Each condition used the same prompt set, model settings, and evaluation method. All generations used `gpt-5.6-sol` with medium reasoning.

Lower AI-smell rates are better.

| Condition | Combined rate | Stage 1 rate | Stage 2 rate |
|---|---:|---:|---:|
| Anti-AI Writing Kit | 1.45% | 1.38% | 1.52% |
| Stop Slop | 2.11% | 1.89% | 2.37% |
| Humanizer | 2.21% | 2.47% | 1.90% |
| No skill | 4.24% | 4.73% | 3.61% |

The report tests whether our approach works and whether the skill loads completely. It does not establish a fixed ranking among peer skills. [Read the full report](reports/2026-07-19-anti-ai-writing-skills-comparison-report.md).

## Scope and limits

This kit helps AI write and edit without common AI-writing habits. It is not an AI detector, a personal-voice trainer, or a set of platform-specific templates.

The kit gives AI clear rules and checks, but no rule file can make every model follow every instruction perfectly.

## Rule overview

The complete runtime rules, explanations, phrase lists, and examples are in `SKILL.md`:

1. Hard bans
2. Positive defaults
3. Word and phrase cleanup
4. Claims and evidence
5. Structure and formatting
6. Rhythm and repetition
7. Final-check preferences
8. Additional user preferences, used only in a customized file

## Use with webpage AI

Download [SKILL.md](SKILL.md). You can edit the file before uploading it to your chat.

## Use with agentic AI

Use the whole folder with an agentic AI that can load skills and run files.

### Getting started

1. Customize it once. Type `customize` and the agent will create your local preference file.
2. Use it for drafting or editing. Send a topic, brief, draft, or finished piece.
3. Add personal rules when you find a new AI-writing habit. The agent will save each rule in `skill-customized.md`.

### Install

#### Codex

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

For a private repository, the machine must be signed in to an account with access.

After installing in the Codex app, open the command menu with `Cmd+K` or `Cmd+Shift+P`, then choose `Force Reload Skills`. If the skill does not appear, start a new Codex task or restart Codex. A turn that began before installation cannot see a newly installed skill.

#### Other agents

Use the agent's supported skill, plugin, or custom-instruction location and point it at the whole folder. `SKILL.md` alone is a manual fallback when relative scripts are unavailable.

### Model choice

Use a current model with dependable instruction following for long or evidence-sensitive work. Smaller models can still benefit from the kit, but they are more likely to miss cross-sentence contrast, rhythm problems, evidence gaps, or the semantic final pass.

### Customize

Type:

```text
customize
```

The agent creates `skill-customized.md` only when requested, then walks through the numbered writing sections. The printer's `--custom-template` option extracts Sections 1 through 8 without copying the controller or maintenance block. New files include format and EOF markers.

Existing customized files remain supported. A file without the new format marker is treated as a legacy full-copy preference layer. The agent edits it in place and does not overwrite or silently convert it.

Rough replies are enough during customization. You can add a fragment, give an example, remove a rule, or say the section is fine.

### Add a rule

Every rule added during normal use goes to `skill-customized.md`. If the file does not exist, the agent creates it first. `SKILL.md` stays unchanged.

In a new session, the safest instruction names both the skill and the action:

```text
Use Anti-AI Writing Kit. Add this to my rules: never use "X" as a punchline.
```

If the skill is already active in the session, the shorter version is enough:

```text
Add this to my rules: never use "X" as a punchline.
```

If you complain about an AI-writing habit while the skill is active, the agent should understand the context and ask whether you want to save it. A complaint is not saved without your confirmation. In a new session, name Anti-AI Writing Kit so the agent knows which rules you mean.

The agent first checks whether the rule already exists. New rules go in the smallest applicable section of the customized file.

### Reset

Type:

```text
reset
```

The agent deletes only `skill-customized.md`. The controller then uses the default numbered rules again.

## File layout

```text
anti-ai-writing-kit/
├── SKILL.md
├── README.md
├── reports/
├── scripts/
├── tests/
├── operations/
└── agents/
```

Generated local files:

- `skill-customized.md`, created only when a user requests personal customization
- `.DS_Store`, macOS folder metadata

Both are ignored by `.gitignore`.

## License

MIT License. Copyright (c) 2026 Evelyn Ke.
