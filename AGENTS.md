# AGENTS.md

Guidance for agents maintaining this skill folder.

## Repository contract

This is a portable writing skill for drafting, editing, rewriting, polishing, and reviewing prose without common AI-writing tells.

`SKILL.md` is the permanent runtime controller and compact default rule set. Keep it self-contained, keep the load and delivery gates near the top, and keep its EOF marker within a 240-line read.

There is no package installation or build step. The scripts use Node.js standard-library modules only.

## Key files

- `SKILL.md`: metadata, permanent controller, and compact operative rules. Frontmatter contains only `name` and `description`.
- `references/patterns-and-examples.md`: expanded explanations, phrase families, examples, and edge cases. Do not leave an operative fail condition only in this file.
- `scripts/print-active-rules.mjs`: deterministic controller validation, checksum receipt, and preference resolution.
- `scripts/check-final.mjs`: strict final rule reload, long-rule digest verification, framed-stdin enforcement, and a private candidate receipt with candidate and rules hashes. Its local receipt covers the supplied candidate only and does not prove equality with a later assistant message.
- `scripts/scan-writing.mjs`: deterministic mechanical and candidate checks. It must not claim semantic judgment or rewrite input.
- `tests/*.test.mjs`: printer and scanner regression tests.
- `operations/kit-operations.md`: loading without a task, customization, reset, rule additions, maintenance, and fixed replies.
- `README.md`: public user manual.
- `agents/openai.yaml`: Codex display metadata and default prompt.
- `skill-customized.md`: local user preferences. Never commit, overwrite, or silently migrate it.

## Ownership

Change the smallest applicable layer, then synchronize every layer affected by the behavior:

- Put compact runtime rules in `SKILL.md`.
- Put rationale, longer pattern lists, and examples in the reference.
- Add a scanner rule only when an exact or clearly labeled candidate check is safe.
- Add a regression test for every scanner or printer behavior change.
- Put customization, reset, and fixed replies in operations.
- Keep public behavior in README consistent with operations.

`SKILL.md` remains active when a customized file exists. A compact custom file replaces numbered Sections 1 through 7 and adds Section 8. A legacy full-copy custom file remains supported as a preference layer. Never let customized process text remove the current controller, fact preservation, delivery gate, semantic review, or final-only output.

## Rule editing

Before adding a rule, search the default rules, reference, scanner, and tests for the exact phrase, close variants, and the underlying pattern. Prefer revising one rule to adding a near-duplicate.

Keep rules short and actionable. State what to do instead. Keep examples only when they clarify an edge case. Check that cleanup does not make accurate prose stiff or vague.

Keep personal preferences in `skill-customized.md` unless the user explicitly requests a public default change.

Keep candidate binding honest. The runtime workflow should prefer a fresh mode-`0600` temporary file, use stdin framed with `__ANTI_AI_CANDIDATE_INPUT_EOF__` only as a fallback, verify the latest receipt's `candidate_sha256` against the exact candidate, and require a full rerun after any character change. Without runtime or harness comparison, documentation must not claim that the receipt proves final assistant-message equality.

Keep semantic enforcement concrete. The paragraph ledger, one-answer sentence test, and reader-trust deletion pass must reject preview leads, recap closings, claim-evidence-claim repetition, label-only sentences, reader coaching, repeated demonstrations of caution, duplicate restatements, and reissued recommendations. The source-silence and relationship-scope checks must reject unsupported group boundaries, whole-group claims, bundled coverage histories, schedule or future causal-proof capabilities, promoted audit or record capabilities, motives, and relationships transferred to a new process, group, period, or location. Audit all/every quantifiers and coverage status outcome by outcome against explicit supplied propositions. Keep capabilities one inference hop from the source. Candidate detectors may force or advise review of suspicious wording, but they must not claim to decide the underlying semantics.

## Verification

Before finishing a change:

1. Confirm the EOF markers in `SKILL.md`, operations, and the reference.
2. Confirm the complete `SKILL.md` fits within 240 lines.
3. Run `node --check` on all three scripts.
4. Run `node --test tests/*.test.mjs`.
5. Test active-rule resolution for no custom, whitespace-only custom, valid and malformed compact custom, reserved runtime markers, legacy custom, a long multiline legacy file, and a huge one-line legacy file. Confirm chunks are digest-bound, byte-bounded, and invoked through the absolute loader path.
6. Verify `--custom-template` includes all eight numbered sections and excludes controller and reference-routing text.
7. Run scanner fixtures for code masking, Unicode locations, list nesting and lazy continuation, CRLF, failure thresholds, and deterministic output.
8. Verify strict final-gate arguments, lexical word-bound enforcement that excludes standalone Markdown control markers, private finding output, digest changes, and long-rule checks.
9. Check README and operations for the same customization model and fixed responses.
10. Check that SKILL, operations, README, and this file describe the same candidate transport, latest-receipt lock, post-PASS rerun rule, and final-message equality limitation.
11. Check aggregate group-boundary, recap-label, reader-coaching, stacked-limit, relationship-scope, subgroup-to-whole, outcome-by-outcome coverage, future-causal-proof, capability-promotion, restatement-label, and recommendation-repetition fixtures, including negative cases that preserve ordinary uses.
12. Check that terminal line breaks fail for file and framed-stdin candidates and that delivery instructions prohibit post-gate Markdown or formatting changes.

## Publishing

Remove generated local files. Keep `LICENSE` at the repository root. Do not publish unless the user asks.
