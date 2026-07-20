# Anti-AI Writing Kit

A portable writing kit for drafting, editing, rewriting, polishing, and reviewing prose without common AI-writing tells.

This is a kit, not a single prompt:

- `SKILL.md` gives the agent its writing rules.
- `operations/kit-operations.md` handles customization, reset, and rule maintenance.
- `skill-customized.md` stores each user's local preferences.

## Getting started

1. Customize it once. Type `customize` and the agent will create your local preference file.
2. Use it for drafting or editing. Send a topic, brief, draft, or finished piece.
3. Add rules when you find a new AI-writing habit. The agent will place the rule in the right section.

## Test report

We tested Anti-AI Writing Kit, [Humanizer](https://github.com/blader/humanizer), [Stop Slop](https://github.com/hardikpandya/stop-slop), and a no-skill baseline on English direct-writing tasks. All generations used `gpt-5.6-sol` with medium reasoning.

| Condition | AI-smell rate |
|---|---:|
| Anti-AI Writing Kit | 1.18% |
| Stop Slop | 2.11% |
| Humanizer | 2.21% |
| No skill | 4.24% |

The report tests whether our approach works. It does not declare a ranking or position among peer skills. [Read the full report](reports/2026-07-19-anti-ai-writing-skills-comparison-report.md).

## Reliability checks

The controller requires a complete initial read, a checksum-backed active-preference receipt, a mechanical scan when Node.js is available, a private paragraph ledger, a one-answer sentence test, a reader-trust deletion pass, a source-silence and relationship-scope review, and another scan after every edit. These checks reject preview leads, recap closings, claim-evidence-claim repetition, reader coaching, repeated demonstrations of caution, paragraphs whose only function is summary or transition, and relationships extended beyond the source's named scope. The source audit checks all/every quantifiers, coverage status outcome by outcome, future causal-proof claims, capability promotion from records or audits, restatement labels, and repeated recommendations. A prior status cannot be assigned to a list unless every item has it, and auditable recorded events do not prove missing events, completeness, adherence, or compliance.

The gate prefers a fresh mode-`0600` temporary candidate file, with interactive stdin framed by `__ANTI_AI_CANDIDATE_INPUT_EOF__` only as a fallback. It requires UTF-8 without a BOM and LF-only internal line breaks, and rejects leading blank lines, terminal horizontal whitespace, and a terminal line break. The checked candidate must already contain every final Markdown character. After the latest PASS, the receipt and exact candidate are treated as a locked pair; any character change requires the semantic check and gate again.

Long customized files are emitted in line-and-byte-bounded, digest-bound numbered chunks, with the active EOF marker in the final chunk. Each manifest uses the absolute loader path, so its commands work outside the skill directory. The final gate checks the same digest before delivery. The scanner catches visible candidates, including aggregate group-boundary wording, recap labels, reader coaching, stacked limits, and selected wording that may transfer a relationship beyond its supplied scope, expand a subgroup to all assigned members, bundle unsupported prior-coverage claims, promote an audit capability, repeat a recommendation, or assign causal proof to future work. Candidate checks trigger review; they do not decide the underlying semantics. The scanner cannot judge factual accuracy, semantic repetition, or causal proof capacity by itself, so the private review is still required.

## Scope and limits

This kit helps an agent produce cleaner prose and review its own draft. It does not determine who wrote a piece, promise a detector result, teach a personal voice by itself, or supply platform-specific templates.

No rule file can force perfect instruction following in every model or every run. The compact controller and EOF checks reduce partial loading. They cannot repair a runtime that never opens the registered skill path. Agents with weaker instruction following may still miss a semantic rule even after the mechanical scan passes. A local PASS receipt applies to the candidate supplied to the script. Unless the runtime or a test runner compares that candidate with the emitted assistant message, the receipt cannot prove byte-for-byte equality with what was sent.

## Use with an agent

Install the whole folder. A folder-aware agent can resolve customized rules, run both scripts, guide customization, add rules, and reset the local preference file.

Invoke the skill, then send a topic, brief, draft, or finished piece:

```text
Use anti-ai-writing-kit to write, edit, or review this without AI smell.
```

With no customized file, the controller uses its default Sections 1 through 7. With a nonempty customized file, the controller stays active while the customized numbered rules replace those defaults. Section 8 adds personal preferences.

## Use with webpage AI

If a chat product cannot load a skill folder, upload or paste `SKILL.md`.

If you have personal rules, upload both `SKILL.md` and `skill-customized.md`. Do not upload the customized file alone because it does not contain the permanent controller.

Scripts may be unavailable in a plain chat. In that case, tell the model to read `SKILL.md` and a new-format custom file through their EOF markers. A legacy custom file has no marker, so the model must obtain its line count and read consecutive ranges through physical EOF. Then it must perform the manual delivery gate in `SKILL.md`.

## Rule overview

The complete runtime rules fit in one compact file:

1. Hard bans
2. Positive defaults
3. Word and phrase cleanup
4. Claims and evidence
5. Structure and formatting
6. Rhythm and repetition
7. Final-check preferences
8. Additional user preferences, used only in a customized file

The longer taxonomy, phrase families, explanations, and examples live in `references/patterns-and-examples.md`. A fail condition should remain in `SKILL.md`; the reference should never be the only place that defines one.

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

For a private repository, the machine must be signed in to an account with access.

After installing in the Codex app, open the command menu with `Cmd+K` or `Cmd+Shift+P`, then choose `Force Reload Skills`. If the skill does not appear, start a new Codex task or restart Codex. A turn that began before installation cannot see a newly installed skill.

### Other agents

Use the agent's supported skill, plugin, or custom-instruction location and point it at the whole folder. `SKILL.md` alone is a manual fallback when relative scripts and references are unavailable.

## Model choice

Use a current model with dependable instruction following for long or evidence-sensitive work. Smaller models can still benefit from the kit, but they are more likely to miss cross-sentence contrast, rhythm problems, evidence gaps, or the semantic final pass.

## Customize

Type:

```text
customize
```

The agent creates `skill-customized.md` only when requested, then walks through the numbered writing sections. The printer's `--custom-template` option extracts Sections 1 through 8 without copying the controller or reference-routing block. New files include format and EOF markers.

Existing customized files remain supported. A file without the new format marker is treated as a legacy full-copy preference layer. The agent edits it in place and does not overwrite or silently convert it.

Rough replies are enough during customization. You can add a fragment, give an example, remove a rule, or say the section is fine.

## Add a rule

Tell the agent what to remember and whether the change is personal or public.

```text
Add this to my rules: never use "X" as a punchline.
```

```text
Put this in the default skill: avoid X because it sounds fake.
```

The agent first searches for an existing rule, then revises the smallest applicable section. A public rule change may also require an example update, a scanner check, and a test.

## Reset

Type:

```text
reset
```

The agent deletes only `skill-customized.md`. The controller then uses the default numbered rules again.

## Local verification

From the skill folder:

```sh
node scripts/print-active-rules.mjs
node scripts/check-final.mjs --input draft.md --format text --fail-on review
node scripts/scan-writing.mjs --input draft.md --format text --fail-on blocking
node --test tests/*.test.mjs
```

Successful active-rule output ends with `__ANTI_AI_ACTIVE_RULES_EOF__`. The scanner returns exit code `1` when findings meet the selected failure level and `2` for input or usage errors. Review-level findings require judgment and may be legitimate quoted material or factual contrast.

When the user specifies a word range, pass it to the combined gate:

```sh
node scripts/check-final.mjs --input draft.md --min-words 130 --max-words 170
```

Word bounds count lexical tokens and ignore standalone Markdown markers such as `#`, `-`, and numbered-list markers. Heading text still counts.

For a long customized file, copy the SHA-256 from the manifest, run every listed chunk command without changing it, then use:

```sh
node scripts/check-final.mjs --input draft.md --format text --fail-on review --rules-sha256 <manifest-digest>
```

The combined gate intentionally supports only text output and the review threshold, with optional word bounds and a long-rule digest. A review finding blocks delivery unless the agent fixes it or reruns with that exact `--allow-review <occurrence-id>` after confirming the active rules allow it. The gate reports occurrence IDs and locations without printing matched candidate text. Use `scan-writing.mjs` directly when machine-readable JSON or full excerpts are needed for local debugging.

For agent delivery, use a fresh mode-`0600` temporary file with `--input` by default. If private file input is unavailable, append exactly `\n__ANTI_AI_CANDIDATE_INPUT_EOF__\n` for framed interactive stdin; the gate strips the frame and rejects malformed transfers. Retain only the latest complete receipt, verify its `candidate_sha256` against the checked file, and send the checked candidate without changing a character. Any edit invalidates the receipt and requires the semantic check and gate again. This procedure reduces mismatches, but only runtime-level comparison can prove equality with the final assistant message.

## File layout

```text
anti-ai-writing-kit/
├── SKILL.md
├── README.md
├── AGENTS.md
├── LICENSE
├── agents/
│   └── openai.yaml
├── operations/
│   └── kit-operations.md
├── references/
│   └── patterns-and-examples.md
├── reports/
│   └── 2026-07-19-anti-ai-writing-skills-comparison-report.md
├── scripts/
│   ├── print-active-rules.mjs
│   ├── check-final.mjs
│   └── scan-writing.mjs
└── tests/
    ├── check-final.test.mjs
    ├── print-active-rules.test.mjs
    └── scan-writing.test.mjs
```

Generated local files:

- `skill-customized.md`, created only when a user requests personal customization
- `.DS_Store`, macOS folder metadata

Both are ignored by `.gitignore`.

## License

MIT License. Copyright (c) 2026 Evelyn Ke.
