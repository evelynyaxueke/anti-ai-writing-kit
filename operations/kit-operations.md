# Kit operations

Use this file for loading without a writing task, customization, reset, rule additions, and maintenance. Read through `<!-- ANTI_AI_WRITING_OPERATIONS_EOF -->` before acting.

## File roles

1. `SKILL.md` is the permanent controller and the single source of truth for default rules, explanations, phrase lists, and examples.
2. `skill-customized.md` is an optional local preference layer. It can replace default Sections 1 through 7 and supplement them with Section 8. It never replaces the controller.
3. `scripts/print-active-rules.mjs` validates and prints the complete skill in digest-bound chunks, then resolves active customized preferences.
4. `scripts/check-final.mjs` reloads ordinary active rules, verifies the manifest digest for long rules, enforces supplied word bounds, and emits private finding metadata plus candidate and rules hashes without candidate excerpts. Its receipt applies to the supplied candidate only; it does not compare that candidate with a later assistant message.
5. `scripts/scan-writing.mjs` performs deterministic mechanical checks. It does not judge meaning or truth.
6. `README.md` is the public manual. `AGENTS.md` is maintainer guidance.

## Invariants

- Follow the user's facts, constraints, and direct instructions first.
- Do not create a customized file during normal writing, editing, loading, or explanation.
- The controller, fact-preservation rule, delivery gate, semantic check, and final-only requirement always remain active.
- Prefer a fresh mode-`0600` temporary candidate file for the final gate. Use interactive stdin framed with `__ANTI_AI_CANDIDATE_INPUT_EOF__` only when private file input is unavailable. The candidate must already contain every final Markdown character and use UTF-8 without a BOM, LF-only internal line breaks, no leading blank line, no terminal horizontal whitespace, and no terminal line break.
- Treat the latest complete PASS receipt and exact checked candidate as a locked pair. Any post-PASS character change invalidates the pair and requires the semantic check and gate again.
- Without runtime or harness comparison, never claim that a local PASS receipt proves the final assistant message is byte-for-byte identical to the checked candidate.
- Complete the private paragraph ledger before the final gate. Delete preview leads, recap closings, claim-evidence-claim sandwiches, and labels that merely repackage a preceding result, quotation, or example. Repeat the primary-location check across headings; a required section does not justify restating a number, result, design fact, limit, or recommendation.
- Run the source-silence check. Do not infer a group boundary, whole-group fact, unmentioned measurement, schedule capability, future causal-proof capability, motive, or relationship from what the source omits. Audit every all/every quantifier and every claim about prior coverage status outcome by outcome against an explicit supplied proposition. Treat cover, include, track, record, report, assess, and observe like measure. Audit future confirm, demonstrate, determine, establish, prove, reveal, and show claims against the supplied design even when `that` is omitted or an adverb separates the subject and verb. Treat candidate scanner results as review prompts, not semantic verdicts.
- Keep each claimed capability one inference hop from the source. Auditable recorded events do not establish missing events, completeness, adherence, compliance, or consistency unless the source says so.
- Keep either an original claim or its `In other words` restatement unless both perform distinct required functions. Give each recommendation one primary location; later sentences may add conditions, owners, or actions without reissuing it.
- Treat a whitespace-only customized file as absent.
- Never overwrite, regenerate, or silently migrate an existing customized file.
- A file whose first nonblank line is `<!-- ANTI_AI_WRITING_CUSTOM_RULES_V1 -->` is a compact custom file. Every other nonempty file is a legacy full-copy custom file, even if it quotes that marker later.
- Apply numbered and unnumbered writing preferences from a legacy file, including an edited operating standard or anti-overfitting note, but ignore old load or process instructions that conflict with the current controller.
- Edit a legacy file in place. Preserve its deletions, rough notes, and structure as user choices.

## Resolve active rules

When Node.js is available, run `node scripts/print-active-rules.mjs` from the skill directory. If it prints a chunk manifest, record its SHA-256 and run every listed digest-bound `--chunk` command exactly as printed. Require the same digest in every chunk and the active-rules EOF marker as the final nonblank line of the last chunk. Pass that digest to `check-final.mjs` with `--rules-sha256`; the gate fails if the active rules changed after the manifest was printed.

Without Node.js:

1. Read `SKILL.md` through `<!-- ANTI_AI_WRITING_SKILL_EOF -->`.
2. If `skill-customized.md` is nonempty, read a compact file through `<!-- ANTI_AI_WRITING_CUSTOM_EOF -->`. For a legacy file, obtain its physical line count and read consecutive nonoverlapping ranges through physical EOF, including every unnumbered preference after the last numbered section. Do not rely on one possibly truncated read.
3. Use customized Sections 1 through 7 instead of the default numbered sections. Apply customized Section 8 in addition.
4. Keep the `SKILL.md` controller active.

## Final candidate transport and receipt

1. Put the complete candidate, including every final Markdown character, in a fresh temporary file with mode `0600`. Encode it as UTF-8 without a BOM, use LF-only internal line breaks, and remove leading blank lines, terminal horizontal whitespace, and the terminal line break. Then use `check-final.mjs --input <temporary-file>`; the gate rejects a noncanonical candidate.
2. If private file input is unavailable, use `--stdin` only when the runtime can attach the complete candidate followed by exactly `\n__ANTI_AI_CANDIDATE_INPUT_EOF__\n` before the process starts. The checker rejects interactive terminal input immediately. If the runtime provides neither a private temporary-file writer nor preattached framed stdin, do not launch the checker; complete the semantic review and visible scan manually.
3. After the semantic check and latest PASS, retain only the complete receipt bounded by `__ANTI_AI_CANDIDATE_RECEIPT_BEGIN__` and `__ANTI_AI_CANDIDATE_RECEIPT_EOF__`. Verify its `candidate_sha256` against the checked file and retain its byte, lexical-word, line, and rules-digest fields. Standalone Markdown control markers do not count as words; visible heading text does.
4. Load the final response from the checked candidate. Do not recompose it from memory or add Markdown during delivery. Any later character change requires the full semantic check and gate again.
5. Delete the temporary file after loading the locked candidate for delivery.
6. This is a procedural lock, not proof of final-message equality. Only a runtime or test harness that compares the checked candidate with the emitted assistant message can establish that equality.

## Normal load behavior

Use this when the user invokes the skill without a writing task.

- With a nonempty customized file, say exactly: `Loaded. I'll use the SKILL.md controller with your customized rules for this session. Send the piece, topic, or brief.`
- Without one, say exactly: `Loaded. No customized file found, so I'll use the SKILL.md controller with its default rules. Send the piece, topic, or brief.`
- Do not ask whether the user wants customization.
- Do not mention customization unless the user asks about it.

## Create a compact customized file

Create one only when the user asks to customize or explicitly asks to save a personal rule and no custom file exists.

1. With Node.js, run `node scripts/print-active-rules.mjs --custom-template` and use that complete output as the new file. Without Node.js, follow Steps 2 through 5 manually.
2. Start with `<!-- ANTI_AI_WRITING_CUSTOM_RULES_V1 -->`, then copy Sections 1 through 7 and Section 8 from `SKILL.md`. Skip the `Maintenance` block between Sections 7 and 8. Do not copy frontmatter, the load contract, delivery gate, operating priorities, or the `SKILL.md` EOF marker.
3. End with `<!-- ANTI_AI_WRITING_CUSTOM_EOF -->`.
4. Keep the customized rule text complete enough to stand on its own.
5. Before saving, verify that all eight numbered section headings and the custom EOF marker are present. A user may empty a section, but its heading remains so truncation cannot silently remove the rest of the rules.

## Add a rule or preference

Use this when the user asks to add, remember, save, or update a writing rule. If the user only asks whether wording sounds AI-generated, answer first, then ask: `Do you want me to add this as a rule?`

### Choose the target

- `default`, `public`, `core`, `SKILL.md`, or `for everyone` means the default skill.
- `my rules`, `personal`, `customized`, or `skill-customized.md` means the customized file.
- If unclear, ask: `Should I add this to your personal customized file or the default SKILL.md?`
- If the personal target is missing, create the compact customized file first.

### Search and place

Before editing, search for the exact phrase, close variants, the root pattern, and the nearest existing rule. Revise an existing rule when it already covers the issue. Do not add a duplicate.

Place new behavior in the smallest fitting section:

- Hard bans for first-pass fail states
- Positive defaults for what good writing should do
- Word and phrase cleanup for vocabulary, filler, fake depth, and empty polish
- Claims and evidence for authority, specificity, certainty, and sourcing
- Structure and formatting for visible organization
- Rhythm and repetition for cadence, formulas, and repeated shapes
- Final-check preferences for audit items
- Additional user preferences for personal examples, dislikes, or style notes

Keep a rule short: name the pattern, explain the failure, say what to do instead, and add an example only when needed.

For a default change, update every applicable layer:

- `SKILL.md` for the default rule, explanation, phrase list, and examples
- `scripts/scan-writing.mjs` only when a safe exact or candidate check is possible
- `scripts/check-final.mjs` when final-gate behavior changes
- tests for changed script behavior

After editing, report what changed and where.

## Manual customization

The user can delete unwanted numbered rules or add rough notes. A few words are enough. Never edit the controller through customization.

- To change public defaults, edit `SKILL.md` and any applicable supporting layer.
- To change personal preferences, edit `skill-customized.md`.
- Keep an existing legacy custom file as-is and edit it in place.

## Reset customization

Use this when the user says `reset`, `reset customization`, `start over from default`, `delete customized version`, or clearly requests removal.

- If the request is clear, delete only `skill-customized.md` without another question.
- Do not change `SKILL.md`, scripts, operations, or any other file.
- If deleted, say exactly: `Reset done. I deleted skill-customized.md. The skill will use the SKILL.md controller with its default rules unless you customize again.`
- If no file exists, say exactly: `No customized file found. The skill is already using the SKILL.md controller with its default rules.`
- If `start over` is ambiguous, confirm before deleting.

## Guided customization workflow

1. Check for a nonempty customized file.
2. If none exists, create the compact customized file. If one exists, edit that same file and do not convert it.
3. Send the fixed opening below and wait for confirmation.
4. Work through numbered Sections 1 through 7 in the active customized file, then Section 8.
5. Show the full current content of each editable section before asking for changes. Do not summarize it.
6. If a legacy section has subcategories, show its category overview, then work through each subcategory.
7. Accept fragments, examples, dislikes, short notes, or `no`. Treat `no`, `nothing`, `looks good`, and similar replies as no change.
8. Apply requested changes immediately to the matching section, briefly confirm, then continue.
9. Use the relevant material in `SKILL.md` when the user needs a rationale, example, or edge case.
10. After Section 7, send the fixed final preference prompt and put the reply in Section 8.
11. Verify the complete customized file and its EOF behavior. Then send the fixed closing.

## Fixed customization opening

```text
I'll help you customize this writing kit section by section.

It usually takes 15 to 25 minutes. There are 8 customization steps:

1. Hard bans
2. Positive defaults
3. Word and phrase cleanup
4. Claims and evidence
5. Structure and formatting
6. Rhythm and repetition
7. Final-check preferences
8. Anything else you want to add

I'll show the full current rule text before asking what you want to change.

Shall we start?
```

## Fixed section prompt

```text
Section [number]: [section title]

Current rule text:

---

[paste the full content of this section]

---

Do you have anything to add, remove, or change here?
```

For a legacy subsection, use its full number and title in the same prompt.

## Fixed final preference prompt

```text
Final step: Anything else you want to add.

Do you have any preference, style description, example, reference, or pet peeve you want this kit to remember?
```

## Fixed closing

```text
Done. I updated skill-customized.md with your choices.

The SKILL.md controller and your customized writing rules will be used from now on.
```

## Maintenance checks

Before finishing a kit change:

1. Confirm all required EOF markers.
2. Test active-rule resolution with no custom, whitespace-only custom, compact custom, malformed order or duplicate sections, reserved runtime markers, short legacy custom, and chunked legacy custom fixtures.
3. Run `node --check` on all three scripts.
4. Run the Node test suite.
5. Test digest changes, strict final-gate arguments, private finding output, and long-rule verification.
6. Keep README behavior synchronized.
7. Confirm the controller, operations, README, and maintainer guidance describe the same candidate-lock procedure and do not overstate what a local receipt proves.
8. Test aggregate group-boundary, recap-label, reader-coaching, stacked-limit, relationship-scope, subgroup-to-whole, outcome-by-outcome coverage, future-causal-proof, capability-promotion, restatement-label, and recommendation-repetition candidates, plus source-silence, one-answer, reader-trust, and paragraph-ledger instructions.
9. Test that file and framed-stdin candidates with a terminal carriage return or line feed fail closed, and that the checked candidate already contains every final Markdown character.

<!-- ANTI_AI_WRITING_OPERATIONS_EOF -->
