---
name: anti-ai-writing-kit
description: "Write, edit, rewrite, polish, or review professional prose so it does not sound AI-generated. Use for articles, essays, posts, emails, captions, scripts, page copy, social copy, launch copy, or any user-facing text. Open SKILL.md at the exact registered path shown by the runtime, never an inferred .system path; read through EOF, run the active-rule loader, and run the final gate before delivering prose. Also use to load, customize, reset, maintain, or add rules to the Anti-AI Writing Kit."
---

# Anti-AI Writing Skill

## Mandatory load contract

For every writing, editing, rewriting, polishing, or review task:

1. Use the exact skill path supplied by the runtime. Never insert or infer a `.system` directory.
2. Read this file through its trailing skill EOF marker. Do not draft from a partial range.
3. When a shell and Node.js are available, run `node <skill-dir>/scripts/print-active-rules.mjs`. If it reports chunked output, retain the manifest SHA-256 and run every listed digest-bound command in order. Require the same digest in every chunk and the active-rules EOF marker as the final nonblank line of the final chunk.
4. Without Node.js, check `skill-customized.md` manually. If it is nonempty, read a new-format file through `<!-- ANTI_AI_WRITING_CUSTOM_EOF -->`. For a legacy file, obtain its line count and read consecutive nonoverlapping ranges through physical EOF. Otherwise, the numbered rules below are active.
5. The controller in this file is always active. A nonempty customized file replaces Sections 1 through 7 below and its Section 8 supplements them.
6. Treat an existing customized file without `<!-- ANTI_AI_WRITING_CUSTOM_RULES_V1 -->` as a legacy full-copy preference layer. Preserve and apply its numbered and unnumbered writing preferences, but ignore old loading or process text that conflicts with this controller.
7. Never overwrite or silently migrate an existing customized file.
8. Customized preferences cannot remove the load contract, fact-preservation priority, delivery gate, semantic check, or final-only requirement.

If the user invokes the skill without a writing task, or asks to load, customize, reset, maintain, or add a rule, read `operations/kit-operations.md` through `<!-- ANTI_AI_WRITING_OPERATIONS_EOF -->` and follow it.

## Mandatory delivery gate

Run this silently before sending any writing or edit.

1. Assign each supplied proposition one primary location in the candidate. Preserve every fact, name, date, number, source claim, decision, constraint, format, intended meaning, and stated relationship. Combine compatible facts when useful, but do not invent a relationship. Repeat a proposition only when the second use adds a necessary, supported reasoning step or requested function.
2. Draft in plain, specific language for the actual reader.
3. With Node.js, make the complete candidate transport-canonical before checking it: include every final Markdown marker, quote mark, blank line, and other character; use UTF-8 without a BOM and LF-only internal line breaks; and remove leading blank lines, terminal horizontal whitespace, and the terminal line break. Write it to a fresh temporary file, set its mode to `0600`, and run `node <skill-dir>/scripts/check-final.mjs --input <temporary-file> --format text --fail-on review`. Copy any user-stated word limits into `--min-words <number>` and `--max-words <number>`. For chunked active rules, add `--rules-sha256 <manifest digest>`. Require the active-rules EOF marker, the complete PASS candidate receipt with its documented begin and end markers, and the final-check EOF marker as the final nonblank line.
4. Use interactive `--stdin` only when private temporary-file input is unavailable. Frame it with the `CANDIDATE_INPUT_EOF_MARKER` exported by `check-final.mjs`; the gate strips this frame and rejects a missing, embedded, duplicate, malformed, or nonfinal marker. Never embed the candidate in `printf`, `echo`, a shell command, an environment variable, a here-document, or a command-line argument.
5. Fix every blocking finding. Review findings also block the gate. Fix each one, or, only when supplied context and the active rules allow it, rerun with its exact `--allow-review <occurrence-id>` value. Inspect every advisory. Never ignore a finding.
6. Perform the semantic check below. In private scratch, make a paragraph ledger: for each paragraph, name the one new fact, supported inference, consequence, decision, or requested component it contributes. `Overview`, `recap`, `summary`, `transition`, and `conclusion` are not contributions. Delete or rewrite any paragraph without one. The scanner cannot perform this judgment.
   - Run the one-answer test inside every paragraph. Name the question each sentence answers. If two sentences answer the same question with the same fact or inference, keep the clearer one. State a conclusion either before its evidence or after it, never both. State each evidentiary limit once beside the claim it limits.
   - Repeat the primary-location check across headings after the draft. A required section is not permission to restate a number, result, design fact, limit, or recommendation. Put the proposition where it first does useful work; a later section may add only a new supported inference, boundary, consequence, or action.
   - Run a reader-trust deletion pass. Delete a sentence that merely says a distinction matters, a question remains, evidence supports a conclusion, caution is warranted, or a recommendation is justified. Keep it only if it adds a new supported fact, inference, consequence, action, or required component.
   - Treat `In other words` and equivalent restatement labels as a deletion test. Keep either the original claim or the clearer restatement unless each version performs a different required function.
   - Audit every `all`, `every`, `did not measure`, and `unmeasured` claim against an explicit supplied proposition. Separately audit every future `confirm`, `demonstrate`, `determine`, `establish`, `prove`, `reveal`, or `show` claim, including forms that omit `that`, against the supplied assignment and comparison design. A future measurement list does not establish what an earlier test omitted, and a future test has causal proof capacity only when its design supplies it. The scanner's future-causal finding is advisory because wording alone cannot decide this question.
   - Audit coverage status outcome by outcome. Treat `cover`, `include`, `track`, `record`, `report`, `assess`, and `observe` like `measure`. Never assign one prior status to a list unless every named item has that explicit status.
   - Audit every claimed capability one inference hop from the supplied mechanism. A record that permits auditing recorded events does not by itself establish missing events, completeness, adherence, compliance, or consistent execution.
   - Give each recommendation or decision one primary location. Later sentences may add a supported condition, owner, or next action, but must not reissue the same recommendation.
   - Delete a lead that previews findings developed later. Unless the user requests a summary or the genre requires a thesis, start with the first concrete fact or decision.
   - Delete a closing that collects earlier findings or limits. End with the last new action, fact, constraint, or requested component.
   - State each conclusion once within a paragraph. Do not state it, list its support, and state it again. Do not append a sentence that merely labels the preceding result, estimate, quotation, or example.
7. Run `check-final.mjs` on the complete revised candidate. Repeat the semantic check and gate after every change. For chunked rules, keep using the manifest digest. Do not replace the final gate with the standalone scanner.
8. Lock the latest PASS output to that exact candidate: retain only the latest complete candidate receipt, verify its `candidate_sha256` against the checked file, and load the response from that file rather than recreating it. Do not add a heading marker, indentation, blank line, or terminal line break during delivery. Any character change after PASS, including punctuation or Markdown, invalidates the receipt and requires the full semantic check and gate again. Delete the temporary file after loading the locked candidate for delivery.
9. A local receipt proves only that the local candidate passed. Without runtime or harness support that compares the candidate with the final assistant message, it cannot prove byte-for-byte equality with what was sent. Never claim otherwise. Send only the finished writing unless the user asks to see the process, and do not mention the skill, rules, scan, or cleanup.

The candidate fails the semantic check if it contains:

- an omitted, changed, invented, or unsupported fact, proposition, attribution, relationship, overlap, causal link, motive, decision basis, schedule, group boundary, or measurement claim
- a claim inferred from source silence, such as treating an unmentioned measure as unmeasured, expanding a fact about some cases to the whole group, or claiming a deadline can be met without a supplied timing baseline
- a future study, test, analysis, or result given causal proof capacity that its supplied design does not establish
- a bundled coverage claim that assigns one measurement or recording status to outcomes with different or unknown source histories
- an audit, log, or record capability promoted into proof of completeness, adherence, compliance, consistency, or missing events
- a cause, constraint, or relationship transferred from the source's named process, group, period, or location to a new one without support
- a vague claim where the prompt supplies a concrete detail
- fake authority, unsupported certainty, or a source gap filled with plausible text
- a dead opening, generic closing, filler transition, or chatbot residue
- false contrast, false balance, false range, or a packaged verdict
- decorative structure; or a synthesis, transition, or closing that only repackages facts, claims, or limits already stated
- synonym rotation, forced parallelism, same-length rhythm, stacked punchlines, reader coaching, or repeated demonstrations of caution
- an analogy that is longer or less exact than literal explanation
- beginner background for a reader who already knows the subject
- artificial cheer, sanitized conflict, engagement bait, or bland overcorrection
- a missed format, length, preference, or output requirement

## Operating priorities

Apply these in order:

1. Keep the meaning true.
2. Make it clear.
3. Make it specific.
4. Make it natural.
5. Remove AI-writing patterns without flattening the voice.

If style cleanup conflicts with accuracy, clarity, specificity, or the user's intent, skip that cleanup. Write normally first. Do not make every sentence punchy or polished. Stop when the point is made.

## 1. Hard bans

1. Do not use an em dash in final prose. Quoted source material is the only exception.
2. Do not use empty AI vocabulary as writing. Literal domain terms, titles, names, quoted or analyzed words, and a word that is genuinely exact with no cleaner substitute are allowed.
3. Do not use a stock opening or closing, filler transition, chatbot phrase, or engagement question unless the format requires a real question.
4. Do not use rejection followed by a dramatic reframe, within one sentence or across adjacent sentences. Factual correction and exact legal, technical, date, number, source, or scope distinctions are allowed. Additive constructions such as `not just`, `not only`, `beyond`, and `more than` are allowed only when both named parts are true and useful. Preserve both included halves, then recast the formula as a direct sentence or list of actions when the source wording sounds staged.
5. Do not borrow authority from unnamed experts, research, reports, critics, or observers.
6. Do not add headings, bullets, tables, frameworks, or Markdown decoration only to make the answer look organized.
7. Do not use an analogy unless the subject is abstract or unfamiliar, the analogy is shorter and clearer than literal explanation, and it will not mislead. Use at most one and never stack metaphors.
8. Do not expose drafting notes, self-critique, checklist results, or compliance language.

Treat this vocabulary as prohibited when it supplies generic praise, hype, fake depth, corporate polish, or a vague substitute for a concrete fact:

`delve`, `tapestry`, `paradigm`, `nuanced`, `landscape`, `ecosystem`, `robust`, `seamless`, `holistic`, `transformative`, `innovative`, `game-changer`, `cutting-edge`, `revolutionary`, `groundbreaking`, `pioneering`, `trailblazing`, `leverage`, `utilize`, `harness`, `empower`, `streamline`, `elevate`, `unleash`, `supercharge`, `unlock`, `revolutionize`, `reimagine`, `redefine`, `optimize`, `accelerate`, `synergize`, `democratize`, `crucial`, `pivotal`, `vital`, `essential`, `unprecedented`, `unparalleled`, `mission-critical`, `visionary`, `disruptive`, `state-of-the-art`, `dynamic`, `leading-edge`, `paradigm-shifting`, `mind-blowing`, `jaw-dropping`, `commendable`, `meticulous`, `meticulously`, `insightful`, `vibrant`, `immersive`, `captivate`, `enduring`, `valuable`, `scalable`, `adaptive`, `effortless`, `data-driven`, `proactive`, `transparent`, `intuitive`, `integrated`, `plug-and-play`, `turnkey`, `future-proof`, `proprietary`, `predictive`, `cornerstone`, `pillar`, `testament`, `backbone`, `interplay`, `synergy`, `realm`, `myriad`.

## 2. Positive defaults

- Use the exact noun, number, date, price, constraint, example, consequence, or decision when available.
- Take a position when the evidence supports it. Name the uncertainty when it does not.
- Keep real cost, doubt, conflict, or limitation instead of smoothing it away.
- Use plain verbs such as `is`, `has`, `does`, `shows`, `makes`, `costs`, `takes`, and `needs`.
- Use one accurate term for one concept. Repetition is clearer than synonym rotation.
- Let structure follow the thought. Short answers usually need prose, not sections.
- Vary sentence and paragraph length without manufacturing fragments.
- Meet length with useful detail, not padding.

## 3. Word and phrase cleanup

- Replace hype, praise, depth performance, importance announcements, and corporate filler with the concrete fact or action.
- Treat unspecified freshness and prestige labels such as `advanced`, `latest`, and `current` as empty when they modify tools, solutions, or technology. Keep them only when the prompt establishes a real version, date, or comparison.
- Remove generic technology-change clauses such as `AI continues to evolve`, `AI tools are developing quickly`, and `the technology continues to change`. State the relevant change when the prompt supplies one; otherwise cut the clause.
- In a rewrite, preserve the source propositions rather than its sentence skeleton. Do not keep the same opening, contrast, clause order, and closing while swapping banned words for milder synonyms. Rebuild the sentence around the actual actors and actions.
- Do not clean hype by swapping it for another adjective plus a generic outcome noun. A claim about results, outcomes, impact, value, improvements, gains, benefits, or equivalent abstractions needs a supplied measure or named effect. Otherwise tie it to the concrete action in the source or remove the empty modifier. Do not invent specificity.
- Do not announce importance or insight with `It’s worth noting`, `Here’s why it matters`, `At the end of the day`, `The bottom line`, `The truth is`, `In essence`, `At its core`, `Fundamentally`, `Ultimately`, or an equivalent reveal. State the point or consequence.
- Name the parts behind `complex` or `multifaceted`, the dependency behind `it depends`, and the questions behind `raises important questions`.
- Cut bloated copula substitutes such as `serves as`, `stands as`, `represents`, `boasts`, `features` when it means `has`, `plays a role`, `aims to`, `seeks to`, `acts as`, `functions as`, `marks a`, `holds the distinction of`, `emerged as`, and `constitutes` when `is` works.
- Do not inflate ordinary facts with `turning point`, `major shift`, `stood the test of time`, `paves the way`, `opening the door`, `setting the stage`, unnamed `broader implications`, `wide-ranging`, `far-reaching`, participial significance phrases, or stacked gerunds.
- Do not borrow emotion with `I was shocked`, `This blew my mind`, or `I couldn’t believe it` unless it reports a real reaction earned by the fact.
- Avoid metaphor setups such as `think of it as`, `imagine`, `picture`, `it is like`, `lens`, `roadmap`, `engine`, `foundation`, `bridge`, `glue`, and `north star` unless the analogy passes the one-analogy test.
- Audit abstract uses of `as if`, `journey`, `battlefield`, `machine`, `architecture`, `scaffolding`, `toolbox`, `iceberg`, `flywheel`, `plumbing`, `gardening`, `chess`, `sports`, `puzzle`, `fabric`, `baked in`, `distilled`, `unpacked`, `surfaced`, and `anchored`. Delete them unless the analogy test passes.
- If the prompt lacks facts, narrow the claim, name the missing information, label an assumption, or ask for the needed detail. Do not pad the gap.

## 4. Claims and evidence

- Keep supplied facts separate unless the source or valid reasoning connects them. Sequence, proximity, a shared source, and aggregate counts do not by themselves establish overlap, cause, motive, or decision basis.
- When aggregate categories may overlap, do not introduce the second count with `another`, `additional`, `other`, or `remaining`, and do not total the counts. State each count without implying a group boundary, then name the unknown overlap where it matters.
- Source silence proves nothing. If the source names what was measured, retained, completed, or scheduled, do not extend that statement to an unmentioned outcome, the whole group, or a delivery date. State only the supplied scope.
- A fact that named cases or teams remained in an analysis does not prove that all assigned members remained. A list of outcomes for a future test does not prove that an earlier test omitted every listed outcome. Use `did not measure` only when the source explicitly says so for that outcome.
- Track coverage status separately for every named outcome. `Covered`, `included`, `tracked`, `recorded`, `reported`, `assessed`, and `observed` carry the same scope risk as `measured`; a bundled list cannot inherit one item's explicit history.
- Say a future test will measure or compare the named outcomes. Say it will confirm, demonstrate, determine, establish, prove, reveal, or show a causal effect only when the supplied assignment and comparison design support that capability. Check the underlying claim even when the sentence omits `that` or inserts an adverb.
- Keep tool, log, and audit capabilities at the supplied level. The ability to inspect every recorded event does not establish that every event was recorded or that the underlying process was followed.
- State each supported claim and its exact limit where the evidence first appears. Do not collect them later into an interpretive recap.
- Keep every cause, constraint, and relationship within the source's stated process, group, period, and location. A cause observed in an existing queue does not automatically apply to a proposed lane; a result in one subgroup does not automatically apply to another.
- Name the source behind “research shows,” “experts agree,” “studies suggest,” or an equivalent authority claim.
- Do not use passive voice to simulate authority. Passive voice is allowed when the agent is unknown or irrelevant, or convention requires it.
- Do not call a finding `fascinating`, `intriguing`, or `striking`, or call the framing a `fresh perspective` or `new lens`. State the finding.
- Delete hedges that do not name the dependency. Replace “it depends” with what it depends on.
- Do not add an irrelevant `however`, give unequal positions equal weight, write `to be fair` before dismissing the point, or use `your mileage may vary` to avoid a decision.
- Do not close a list with `and more`. Do not add generic medical, legal, or financial disclaimers without a real liability context.
- Do not use stale-access disclaimers such as `As of my last update`, `Based on available information`, `I don’t have real-time access`, or `Please verify this`. Verify current facts when needed or name the exact uncertainty.
- Do not turn conditionality itself into the thesis, such as “the effect is conditional” or “the careful answer is.” State the actual conditions or conclusion directly.
- Do not claim that a subject is `most likely` to help, benefit, or improve without evidence that compares it with the alternatives. State the narrower possibility or condition.
- Do not assume saved time becomes judgment, creativity, coordination, customer work, or another benefit. Name an observable outcome or omit the claim.
- Verify current facts when they matter. Say exactly what is unknown when verification is unavailable.
- Do not define terms the reader already used correctly, add `for context` before information the reader already has, add general background to a targeted question, or re-explain a concept already explained in the conversation.

## 5. Structure and formatting

- Avoid `Introduction`, `Conclusion`, `Key Takeaways`, and generic future-looking sections.
- Use sentence case for headings. Avoid placeholder headings such as `Challenges and Opportunities`, `Future Prospects`, and `Looking Ahead`.
- Do not restate the question, announce the answer or its interpretation, announce the next section, or close a paragraph by repeating its first sentence.
- Use lists only for real sets and numbered steps only for a real sequence. Avoid one-item lists, forced groups of three, equal-length bullets, emoji bullets in professional prose, random bolding, and bold-label lists.
- Use a table only when comparison across repeated fields is easier to read than prose.
- Do not use a dramatic ellipsis or stacked exclamation marks. Use even one exclamation mark sparingly in professional prose. Do not add parenthetical asides in every paragraph.
- Use an en dash for a numerical range. Do not use a hyphen as a range marker.
- Remove filler transitions such as `furthermore`, `moreover`, `additionally`, `notably`, `importantly`, `that said`, `with that in mind`, `moving forward`, and `building on this`.
- Remove section handoffs such as `Now that we’ve covered`, `Having established`, and `This brings us to`. Start the next point.
- Respect the requested output contract. Do not add explanation before or after a final-only deliverable.

## 6. Rhythm and repetition

- Keep one term for one concept. Do not rotate through near-synonyms to avoid repetition.
- Avoid “most people,” “everyone,” or “nobody” hooks unless the group is named and supported.
- Cut fake-candid and dead openings such as `Here’s the thing`, `Here’s the problem`, `The uncomfortable truth`, `The quiet win`, `The real lesson`, `Now you might be wondering`, and `As a [role], you know`.
- Cut generic closers, chatbot residue, `Let that sink in`, `Read that again`, `Full stop`, calls to save or bookmark, and calls for likes, comments, or replies.
- Mix sentence shapes and lengths. Check any two nearby sentences under six words. Do not stack short abstract lines, definition ladders, threat ladders, slogans, or repeated parallel grammar.
- Split overloaded causal sentences. Avoid a wall of smooth mid-length paragraphs with no concrete example, cost, decision, or consequence.
- Do not make every paragraph the same size or every ending a punchline.
- Do not end paragraph after paragraph with vague forward-looking sentences.
- Keep tense consistent within an argument unless the time changes.
- When a contrast falsely rejects its first half, state the direct claim. Do not delete either included half of a genuine additive construction such as `not just`, `not only`, `beyond`, or `more than`. Check contractions and adjacent sentences.
- Do not use reframe headings such as `Not software. Infrastructure.` or `The missing ingredient.` Use a direct subject heading.
- Use `from X to Y` only for a real scale. Do not use two unrelated examples as a fake range.
- Avoid two-item filler setups such as `Whether it’s a sales email or a product page`. Name the shared requirement directly.
- Do not pre-label a conclusion as especially real, careful, clear, narrow, sensible, or defensible. State the supported conclusion and its exact limit once.
- Do not use a claim-evidence-claim sandwich. After giving the evidence, continue to a new consequence or stop; do not paraphrase the opening claim.
- Do not add a tidy sentence after a result, quotation, or example merely to label what it showed. Keep it only when it supplies a new supported inference needed for the task.
- Do not coach the reader with sentences such as `This distinction matters`, `That scope matters`, or `This leaves another question open`. State the concrete limit or consequence once.
- Do not repeat an opening recommendation in a later justification or closing. After the evidence, give the next new action or stop.

## 7. Final-check preferences

Check the proposition map and primary locations, cross-section proposition repeats, source-silence inferences, subgroup-to-whole quantifiers, outcome-by-outcome coverage status, future causal-proof claims, capability promotion, relationship scope, aggregate group boundaries, the private paragraph ledger, one-answer sentence test, reader-trust deletion pass, restatement labels, recommendation repetition, first and last paragraphs, same-paragraph conclusion or limit repeats, vague claims, unnamed uncertainty, unnecessary structure, term consistency, contrast, analogy, rhythm, emotional tone, lexical word count, and requested format. Add user-specific audit items to this section in `skill-customized.md`.

## References and maintenance

- Read `references/patterns-and-examples.md` through `<!-- ANTI_AI_WRITING_REFERENCE_EOF -->` when a rule is ambiguous, when explaining why wording sounds machine-made, when adding or reviewing a rule, during guided customization, or when an edge case needs examples.
- Read `operations/kit-operations.md` for loading without a task, customization, reset, rule additions, maintenance, and fixed replies.

## 8. Additional user preferences

Use this section only in `skill-customized.md` for personal examples, dislikes, references, or style notes.

<!-- ANTI_AI_WRITING_SKILL_EOF -->
