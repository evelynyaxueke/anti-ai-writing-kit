---
name: anti-ai-writing-kit
description: "Write, edit, rewrite, polish, or review professional prose so it does not sound AI-generated. Use for articles, essays, posts, emails, captions, scripts, page copy, social copy, launch copy, or any user-facing text. Open SKILL.md at the exact registered path shown by the runtime, never an inferred .system path; read through EOF, run the active-rule loader, and run the final gate before delivering prose. Also use to load, customize, reset, maintain, or add rules to the Anti-AI Writing Kit."
---

# Anti-AI Writing Skill

## Mandatory load contract

For every writing, editing, rewriting, polishing, or review task:

1. Use the exact skill path supplied by the runtime. Never insert or infer a `.system` directory.
2. Read this mandatory load contract before drafting.
3. When a shell and Node.js are available, run `node <skill-dir>/scripts/print-active-rules.mjs`. It prints the complete `SKILL.md` and any customized rules in verified chunks. Retain the manifest SHA-256 and run every listed digest-bound command in order. Require the same digest in every chunk and the active-rules EOF marker as the final nonblank line of the final chunk. Do not draft before the last chunk.
4. Without Node.js, read this file in consecutive nonoverlapping ranges through its trailing skill EOF marker. Then check `skill-customized.md` manually. If it is nonempty, read a new-format file through `<!-- ANTI_AI_WRITING_CUSTOM_EOF -->`. For a legacy file, obtain its line count and read consecutive nonoverlapping ranges through physical EOF. Otherwise, the numbered rules below are active.
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
4. Use `--interactive-stdin` only when private temporary-file input is unavailable and the runtime provides a writable process session. Start the checker, wait for its session handle, send the complete candidate followed by the exported `CANDIDATE_INPUT_EOF_MARKER`, then close input. Plain `--stdin` accepts only framed bytes attached when the process starts and rejects an interactive terminal, so it cannot wait on an empty terminal. If the runtime provides neither a private temporary-file writer nor a writable process session, do not launch the checker; complete the semantic review and visible scan manually. Never embed the candidate in `printf`, `echo`, a shell command, an environment variable, a here-document, or a command-line argument.
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

## Anti-overfitting

This file describes patterns to avoid, not a voice to imitate.

- Do not make every sentence punchy.
- Do not avoid a useful word just because it appears on a banned list.
- If a word is genuinely right and nothing cleaner exists, use it.
- Write normally first. Then remove the parts that sound machine-made.
- Read it aloud. If it sounds careful rather than natural, simplify it.

## 1. Hard bans

These are the first-pass fail states. Keep this list short so the priority stays clear. Full lists and examples live in the later sections.

1. **No em dashes.** Delete every `—` in final writing.
2. **No first-priority AI vocabulary.** Avoid these unless literal, quoted, or discussed as examples: delve, tapestry, landscape, nuanced, seamless, robust, leverage, unlock, transformative.
3. **No stock AI openings or closings.** Cut lines like "In today's...", "Let's dive in", "It's worth noting...", and "I hope this helps."
4. **No not-X-but-Y framing.** Do not use rejection-then-reframe patterns for drama. Banned forms include: "not X, but Y"; "isn't X, but Y"; "not because X, but because Y"; "not about X, about Y"; "isn't about X. It means Y."; "isn't about X. It's about Y."; "X is not Y. It is Z."; "not X. Y."; "no X, just Y"; "less X, more Y"; "drop X, pick up Y"; "X is noise. Y is signal."; "X gets the credit. Y does the work."; "stop doing X. Start doing Y."; "you think it's X. It's Y."; "X is overrated. Do Y instead."; "it was never X. It was always Y."; "X is the symptom. Y is the cause." Factual correction is allowed: "The deadline is Friday, not Thursday." Additive forms such as "not just X, but Y" and "not only X, but also Y" are allowed when both parts remain true and useful. Preserve both parts when rewriting them.
5. **No fake authority.** Do not write "research shows," "experts agree," or "studies suggest" without a named source.
6. **No decorative structure.** Do not add headings, bullets, tables, or frameworks just to make the writing look organized.
7. **No default analogies.** Use an analogy only if it is shorter and clearer than literal explanation.
8. **No chatbot residue.** Remove assistant-style phrases such as "Of course," "Certainly," "Great question," and "Let me know if..."

## 2. Positive defaults

These rules define what to do instead of only what to remove.

**Be specific.** Use the number, name, date, price, constraint, real example, or concrete detail. Vague claims are usually replaceable with specific ones. If you cannot be specific, say less.

**Take a stance when the evidence supports it.** Hedging without naming the uncertainty is evasion, not caution.

**Name the stakes.** If a claim matters, say what changes: the cost, constraint, risk, time, decision, or person affected. If nothing changes, cut the sentence.

**Keep the real friction.** Do not make neutral, difficult, or unresolved material sound cheerful, balanced, or encouraging by default. Keep the cost, doubt, conflict, or limitation when it is true.

**Use the plain word.** The shorter, more common word is usually better. Use "use" over "utilize." Use "important" only when importance is proven. Use "show" over "demonstrate" when it carries the same meaning.

**Repeat the right term.** Pick the accurate word for a concept and use it every time. Consistent terms build clarity. Synonym rotation creates noise.

**Let structure follow thought.** Write the idea first. Then decide whether it needs a heading, list, or table. Structure by exception, not by default.

**Vary sentence rhythm.** Keep the same term when it is still the accurate term. Use sentence length, sentence shape, and paragraph length for variety. Use a fragment only when it sounds natural.

**Stop when the point is made.** Do not pad output to seem thorough.

**Honor requested length.** If the user asks for a format or approximate length, meet it with more concrete detail, examples, source checks, implications, or useful context. Do not meet length by adding filler, throat-clearing, repeated claims, or decorative structure.

## 3. Word and phrase cleanup

This section removes wording that performs intelligence, importance, or polish without adding meaning.

### 3.1 Vocabulary that performs depth

Words overused to the point of signaling AI authorship should be removed unless quoted or discussed as examples.

**Core offenders:** delve, tapestry, paradigm, nuanced (when used as self-description), landscape (when non-geographic), ecosystem (when metaphorical), robust, seamless, holistic, transformative, innovative, game-changer, cutting-edge, revolutionary, groundbreaking, pioneering, trailblazing.

**Action verbs emptied of meaning:** leverage (when it means use), utilize, harness (when it means use), empower, streamline, elevate, unleash, supercharge, unlock, revolutionize, reimagine, redefine, optimize, accelerate, synergize, democratize.

**Empty intensifiers:** crucial, pivotal, vital, essential, unprecedented, unparalleled, mission-critical, visionary, disruptive, state-of-the-art, dynamic, leading-edge, paradigm-shifting, mind-blowing, jaw-dropping.

**Praise words that have curdled:** commendable, meticulous, meticulously, insightful, vibrant, immersive, captivate, enduring, valuable (when used as a generic descriptor).

**Corporate descriptors that describe nothing:** scalable, adaptive, effortless, data-driven (when used as hype), proactive, transparent, intuitive, integrated, plug-and-play, turnkey, future-proof, proprietary, predictive.

**Structural fillers:** cornerstone, pillar, testament, backbone, interplay, synergy, realm, myriad (when many works).

Unspecified freshness and prestige labels often preserve the original hype under a milder adjective. Treat `advanced tools`, `latest AI tools`, and `current solutions` as empty unless the source supplies a version, date, or comparison that makes the label true. Generic change clauses such as `AI continues to evolve` and `the technology is developing quickly` have the same problem: they announce motion without naming a change that matters to the claim.

Bad: "As AI tools develop quickly, businesses need current tools to improve productivity."

Better: "Businesses can use AI tools to shorten specific tasks, but the gain depends on accuracy and review time."

### 3.2 Phrases that perform depth

Do not announce importance. Demonstrate it, state the consequence directly, or cut the setup.

Avoid:

- "It's worth noting that..."
- "It's important to understand that..."
- "Here's why that matters..."
- "Here's why it matters..."
- "That matters."
- "This matters because..."
- "It goes without saying..."
- "Needless to say..."
- "It cannot be overstated that..."
- "The reality is..."
- "It's no secret that..."
- "Make no mistake..."
- "The real reason is..."

These phrases often announce importance instead of saying the important thing. "What matters is..." is allowed only when it names the real priority plainly, not when it creates a reveal or a fake insight.

Do not announce insight. Deliver it.

Avoid:

- "At the end of the day..."
- "The bottom line is..." unless it introduces a real summary
- "The truth is..."
- "In essence..."
- "At its core..."
- "Fundamentally..." unless the claim is actually foundational
- "Ultimately..." as a false conclusion signal

Do not perform complexity without naming it.

Avoid:

- "It depends" without immediately saying what it depends on
- "Complex" or "multifaceted" without naming the specific parts
- "It raises important questions" without listing the questions

### 3.3 Bloated verbs and copula avoidance

Never replace `is` or `has` with a construction that means the same thing.

Do not use:

- serves as
- stands as
- represents a
- boasts
- features, when it means has
- plays a role in
- aims to
- seeks to
- acts as
- functions as
- marks a, when it adds ceremony instead of information
- holds the distinction of
- emerged as, when became or is would be clearer
- constitutes, when is would work

Use the verb that names the action directly:

- is
- does
- has
- shows
- makes
- costs
- takes
- needs
- causes
- breaks

### 3.4 Inflation of ordinary facts

Do not inflate ordinary facts to simulate significance.

- Never use "a key turning point," "a pivotal moment," or "a major shift." State the fact and let the reader judge its weight.
- Never say something has "stood the test of time" without naming the test.
- Never call something "revolutionary" when it is incremental.
- Never use "paves the way for," "opening the door to," or "setting the stage for." If the consequence matters, state it directly.
- Never use "broader implications" as a placeholder for implications you have not identified.
- Never describe benefits as "wide-ranging" or "far-reaching." List them instead.
- Never use shock as borrowed emotion: "I was shocked," "This blew my mind," or "I couldn't believe it" unless it reports a real reaction and the fact earns it.
- Never staple a participial phrase to a fact to simulate significance: "Highlighting its importance, X is..." Just say what X is.
- Never use gerund stacking to simulate energy: "Transforming industries, empowering teams, driving growth..." This is motion blur with no subject.

### 3.5 Metaphors and analogies

Default to no analogies. Most subjects do not need them.

Use an analogy only when:

1. The subject is genuinely abstract or unfamiliar.
2. The analogy is shorter and clearer than literal explanation.
3. The analogy will not mislead.

Use at most one analogy per piece. Never stack metaphors.

Avoid these analogy setups:

- Think of it as
- Imagine
- Picture
- It's like
- Works like
- A bridge between
- A lens for
- A roadmap for
- The engine of
- The DNA of
- The glue that holds

Avoid these metaphor families unless the subject is literally that thing:

- journey, for growth or progress
- battlefield, for work or competition
- machine, for people or organizations
- architecture, for ideas
- foundation, scaffolding, or pillar, for ideas
- ecosystem, for business
- engine or fuel, for motivation
- map, compass, or north star, for direction
- toolbox
- iceberg
- bridge
- flywheel
- plumbing
- gardening
- chess
- sports
- puzzle

Avoid these metaphor verbs for abstract work:

- sanded down
- stripped back
- stitched together
- woven
- layered
- carved out
- baked in
- distilled
- crystallized
- unpacked
- surfaced
- anchored
- cemented
- fueled
- sparked
- amplified
- channeled
- sculpted
- molded
- threaded through
- scaffolded
- grafted

Audit before sending: scan for `like`, `as if`, `imagine`, `picture`, `lens`, `bridge`, `roadmap`, `engine`, `foundation`, `fabric`, and `glue`. Delete unless the analogy passes the test above.

Bad: "The sales funnel is a leaky pipe."

Better: "Sixty percent of leads drop off between first contact and proposal."

Bad: "The brand is a north star."

Better: "The brand tells the team which customers to turn down."

## 4. Claims and evidence

This section controls fake authority, vague claims, hedging, missing proof, and assumptions about the reader.

### 4.1 False authority

Do not borrow authority without evidence.

- Never use passive voice as an authority signal. Passive voice is fine when it serves a real purpose, such as de-emphasizing the agent or following scientific convention. If it is there to sound formal, replace it.
- Never attribute your own opinion to "some people" or "many experts."
- Never call something "fascinating" or "intriguing" unprompted. Let it fascinate.
- Never call your own framing "a fresh perspective" or "a new lens."
- Never describe a finding as "striking." Let it strike.
- Never write "Experts agree" without naming the experts.
- Never write "Research shows" without identifying the research.
- Never write "Studies show" without naming or citing the study.
- Never write "Industry reports suggest" without naming the report.

### 4.2 Hedging, false balance, and vague qualifiers

Delete hedging phrases that add words without adding information.

Avoid:

- "It's important to note that..."
- "It should be pointed out that..."
- "Keep in mind that..."
- "It's worth mentioning that..."
- "Please note that..."
- "It's essential to consider..."
- "This requires careful consideration..." without doing the consideration
- "As you may know..."
- "I could be wrong, but..." before a verified claim

Do not use false balance to avoid taking a position.

- Never write "while it's true that X, it's also true that Y" to avoid taking a position.
- Never add "however" to a caveat that does not change the recommendation.
- Never give equal weight to unequal positions to appear fair.
- Never say "to be fair" before a counterargument you immediately dismiss.
- Never soften a correct answer with "of course, your mileage may vary."

Do not use vague qualifiers that hide the actual dependency.

- Never use "generally speaking" to soften a claim you could make precisely.
- Never add "in many cases" to a statement true in all relevant cases at hand.
- Never say "results may vary" without specifying what varies and under what conditions.
- Never say "there are many factors at play" without naming them.
- Never use "there is no one-size-fits-all solution" unless you provide the dimensions that vary.
- Never close a list with "and more." Include the items or do not mention them.

### 4.3 Missing facts and current information

Do not pre-disclaim a recommendation you are about to give anyway.

- Never add "this is not financial/medical/legal advice" unless there is an actual liability context.
- Never open an answer to a direct question by restating the question.

Never include:

- "As of my last update..."
- "Based on available information..."
- "I don't have real-time access to..."
- "Please verify this with current sources..."

If current facts matter, verify them. If something is genuinely uncertain, say specifically what is uncertain and why, not a generic disclaimer.

Do not fill source gaps with plausible fluff. Say what is known, say what is not known, or cut the sentence.

Before linking two facts, test the relationship. Sequence, proximity, a shared source, and aggregate counts do not by themselves establish overlap, cause, motive, or a decision-maker's reason. If the link is an inference, state it narrowly and name the missing evidence.

Bad: "Renewals rose after the onboarding guide launched, so the guide caused the increase."

Better: "Renewals rose after the guide launched. The available data do not isolate the cause."

Bad: "In a survey that allowed several selections, employees who chose workload also chose management."

Better: "Forty-eight employees selected workload and 31 selected management. The aggregate counts do not show how many selected both."

Do not let a transition word create the same unsupported boundary.

Bad: "Forty-eight employees selected workload. Another 31 selected management."

Better: "Forty-eight employees selected workload. Management was selected by 31 employees. The aggregate report does not show the overlap."

Source silence is not a negative fact. A source that names one retained subgroup does not prove that every other member remained. A list of unmeasured outcomes does not prove that every omitted outcome was also unmeasured. A duration estimate without a start date does not prove that a calendar deadline can be met.

Bad: "Three flagged cases remained in the analysis, so all 24 cases remained."

Better: "The three flagged cases remained in the analysis."

Bad: "Keeping the three flagged teams preserved results for all teams as assigned."

Better: "The three flagged teams remained in the analysis. The source does not state whether every other assigned team remained."

Do not infer an earlier measurement list from a later one.

Bad: "The next test adds fuel use and workload, two outcomes the first trial did not measure."

Better: "The first trial did not measure fuel use. The next test will measure fuel use and workload." Keep the workload sentence neutral unless the source explicitly says the first trial omitted it.

Check status outcome by outcome. `Cover`, `include`, `track`, `record`, `report`, `assess`, and `observe` have the same scope problem as `measure`.

Bad: "Those measures cover delays, fuel use, and workload that the prior trial did not cover."

Better: "The prior trial measured delays and explicitly did not measure fuel use. The next test will measure delays, fuel use, and workload." Do not assign workload a prior status when the source is silent.

Do not give a future test proof capacity that its supplied design does not establish.

Bad: "The next test will show whether the protocol reduces delays."

Better: "The next test will measure delays." Use causal language only when the future assignment and comparison design support it.

The scanner treats future-causal wording as advisory. It cannot distinguish a claim about what a study will establish from the same words displayed in a chart, quotation, or subordinate clause. Audit the full proposition against the supplied design, including sentences that omit `that` or place an adverb between the subject and causal verb.

Bad: "Engineering needs eight business days, so the June 15 launch is achievable."

Better: "Engineering estimates eight business days. The record does not supply the start date or every launch dependency."

Keep relationships inside their supplied scope. A cause, constraint, or dependency observed in one queue, group, period, or location does not automatically apply to a new one.

Bad: "The protected lane remains subject to the causes recorded in the existing queue."

Better: "The record does not establish which delays, if any, will affect the protected lane."

Keep capabilities one inference hop from the source.

Bad: "Retail Analytics can audit every recorded scan, providing documented adherence and complete execution records."

Better: "Retail Analytics can audit every recorded scan. The record does not say that the audit identifies missing scans or establishes adherence."

### 4.4 Reader trust and repeated conclusions

Trust the reader by removing proof that the writer is being careful. A sentence that announces a distinction, open question, cautious conclusion, or justified recommendation often repeats work the surrounding facts already do.

Use the one-answer test. Privately name the question each sentence answers. If two sentences answer the same question with the same fact or inference, keep one. A paragraph may state a conclusion before its evidence or after it, but not both. State each evidentiary limit once beside the claim it limits.

Bad: "The logs do not record why a request was delayed. They cannot determine why a particular request took as long as it did."

Better: "The logs do not record why an individual request was delayed."

Bad: "This distinction matters when reading the totals."

Better: Delete the sentence and state the actual denominator or limit.

Bad: "I recommend a limited transition. This approach moves eligible cases to the proposed route while protecting the two exception types."

Better: Put the route and exception types in the recommendation once, then continue to new evidence or action.

Bad: "Operations should run the trial. Run it as specified."

Better: "Operations should run the trial with the stated controls." Continue with a new owner, condition, or action only when it adds information.

Bad: "The estimate was 4.2 points. In other words, the estimate was 4.2 points."

Better: "The estimate was 4.2 points." Keep two formulations only when a necessary technical statement and its reader-specific translation perform distinct functions.

### 4.5 Reader assumptions

Do not write to a generic beginner when the actual reader is clear.

- Never define a term the person demonstrably knows. If they used it correctly, do not explain it.
- Never provide industry background to someone who works in that industry.
- Never write to a general reader when the specific reader is clear from context.
- If asked a targeted question, give a targeted answer. Comprehensiveness is not a default virtue.
- Never add "for context" before information the person already has.
- Never re-explain a concept you explained in the same conversation unless specifically asked.

## 5. Structure and formatting

This section controls visible shape: headings, lists, tables, punctuation, transitions, and meta-commentary.

### 5.1 Section scaffolding

Do not use structure to replace thinking.

- Never use "Introduction," "Conclusion," or "Key Takeaways" as headers in a conversational response.
- Never use title case for every header. Sentence case is how people write.
- Never write "In summary," "In conclusion," or "To summarize" before the thing. Just write it.
- Never use "Challenges and Opportunities," "Future Prospects," or "Looking Ahead" as section names. They are placeholders for actual analysis.
- Never create subsections for a topic that required no sections.
- Avoid headers in short responses. Prose usually handles it. The threshold is whether the reader needs to navigate, not a word count.
- Never announce what you are about to do: "In this section I will cover..."
- Never answer more than was asked. If the question is specific, the answer is specific. Adding unrequested alternatives, caveats, and expansions is scope inflation, not thoroughness.
- Never open with a restatement of the question as context-setting.
- Never close a paragraph with a sentence that only restates the paragraph's opening claim.

### 5.2 Lists, bullets, and tables

Use formatting only when it helps the reader.

- Never bullet-point a thought that flows naturally as a sentence.
- Never use numbered lists for things with no actual sequence.
- Never use bold as decoration. Avoid random bold phrases, bold mini-headers, bolded hooks, or bold first words in every bullet unless the emphasis changes meaning.
- Never use emoji as bullets or attention markers in professional prose unless the user explicitly asks for that style.
- Never make a one-item bullet list.
- Never make all bullet points the same length. Real reasoning is uneven.
- Be suspicious of lists with exactly three items. Three is the AI default. If two or four is the truth, use those.
- Never use "Step 1, Step 2, Step 3" for advice that reads better as narrative.
- Never write a bold label plus a sentence when the thought works better as a normal paragraph.
- Never make a table when a sentence would convey the same information.

### 5.3 Punctuation

Apply these punctuation rules before sending:

- Never use em dashes.
- Never use hyphens for numerical ranges. Use an en dash: `1990–2000`, `pages 12–15`.
- Never use ellipses for dramatic pause or trailing effect in professional writing. Use ellipses only for omission from quoted source material.
- Rarely use exclamation marks in professional prose. Never stack them.
- Never use parenthetical asides in every paragraph.

### 5.4 Transitions

AI uses transition words to signal logical relationships that do not exist. This makes paragraphs look connected when they are not.

Never use transitions that summarize what just happened before announcing what comes next:

- "Now that we've covered X, let's turn to Y."
- "With that in mind, we can now look at..."
- "Having established X, the next question is..."

These are two failures at once: padding the end of one section and announcing the start of the next.

Use a real logical connector when the relationship exists. Use nothing when it does not. Just start the next point.

### 5.5 Meta-commentary

Never announce the writing. Say the thing.

Avoid:

- "In this section..."
- "This article will cover..."
- "Let me walk you through..."
- "Here is a comprehensive overview..."

## 6. Rhythm and repetition

This section controls the cadence patterns that make writing feel machine-made: synonym rotation, same-length sentences, staged punchlines, and dead endings.

### 6.1 Synonym rotation

Use one consistent term for one concept.

Language models have a repetition penalty built in and often learned synonym rotation as a style signal. The result is constant paraphrase: restating the same idea with different words. This reads as padding and distrust of the reader.

Rule: Use one consistent term for one concept. If you need to say something again, say it in the same words. Repetition is a rhetorical tool. Synonym rotation is noise.

Instead: Pick the accurate word for each concept and use it every time. Vary sentence length and structure for rhythm. Leave vocabulary alone.

Never rotate synonyms for the same concept:

- Never replace "use" with "utilize," "employ," "leverage," and "harness" across the same piece.
- Never replace "help" with "empower," "enable," "support," "facilitate," and "aid" in alternation.
- Never replace "important" with "crucial," "vital," "essential," "key," and "critical" interchangeably.
- Never replace "show" with "demonstrate," "illustrate," "highlight," and "underscore" as synonyms.
- Never cycle through "organization," "company," "firm," "enterprise," and "business" when you mean one thing.
- Never vary synonyms for "said" in a single paragraph.
- Never swap a subject's name for a descriptor just to avoid repetition. Use the name or the pronoun.

Bad: "Min joined the team in January. The experienced strategist immediately restructured the process."

Better: "Min joined the team in January. She immediately restructured the process."

Use the deletion test on summaries and closings. If removing a passage loses no new fact, supported reasoning step, consequence, decision, or requested component, remove it. Put each limitation beside the claim it limits instead of adding a later paragraph that re-lists findings and unknowns.

Bad: After the body already reports adoption and retention, "What the results establish is clear: adoption rose, retention held, and the long-term effect remains unknown."

Better: Delete the recap. State the long-term uncertainty once beside the retention evidence.

Use a private paragraph ledger before delivery. Give each paragraph one new contribution in a short internal label. `Overview`, `summary`, `transition`, `recap`, and `conclusion` fail the test. Check the first and last paragraphs separately because models often use them to duplicate the body.

Avoid the claim-evidence-claim sandwich inside one paragraph.

Bad: "The trial supports the change. Teams were randomly assigned, and both groups used the same schedule. Those design choices support the conclusion that the change caused the result."

Better: "Random assignment and the shared schedule support attributing the measured result to the change during the trial."

Delete labels that arrive after the information they label.

Bad: "The estimate was 4.6 percentage points. This estimate is the primary result."

Better: "The primary estimate was 4.6 percentage points."

### 6.2 Openings, closings, and engagement bait

Do not use these dead openings and phrases:

- "In today's..."
- "In today's rapidly changing landscape..."
- "In the world of [X]..."
- "Now, you might be wondering..."
- "Can we talk about..."
- "Here's the thing..."
- "The thing is..."
- "Here's the problem..."
- "Here's the problem though..."
- "Here's what I find interesting..."
- "Here's what you need to know..."
- "Let me be clear..."
- "The uncomfortable truth is..."
- "The quiet win is..."
- "The real lesson is..."
- "As a [role], you know that..."
- "In order to"
- "Let's dive in"
- "Let's explore"
- "Let's unpack"
- "To put this in perspective"
- "What makes this particularly interesting is"
- "The implications here are"
- "In other words," when it only restates the preceding proposition
- "In this article, I will"
- "Despite its strengths, X faces challenges"
- "Challenges and future prospects"

Avoid vague majority hooks. Do not invent a generic crowd to make the writer sound perceptive.

Avoid:

- "Most people think..."
- "Most people miss..."
- "Most people don't realize..."
- "Everyone talks about..."
- "Everyone focuses on..."
- "Nobody is talking about..."
- "What nobody tells you..."

If the claim is true, name the actual mistake, audience, behavior, or incentive directly.

Do not use these dead closers:

- "I hope this helps."
- "I hope that answers your question."
- "Happy to help."
- "Feel free to ask if you have more questions."
- "This is just the beginning."
- "The possibilities are endless."

Do not use these sentence or paragraph openers as filler transitions:

- Furthermore
- Moreover
- Additionally
- Notably
- Importantly
- That said
- That being said
- With that in mind
- Of course, as a transition
- It is also worth mentioning
- On top of that
- Moving forward
- This brings us to
- Building on this
- Taking this further

Do not use these engagement-bait lines:

- "Let that sink in."
- "Sit with that."
- "Read that again."
- "Full stop."
- "End of story."
- "This changes everything."
- "Bookmark this."
- "Save this for later."

Do not end with an engagement question unless the user explicitly needs replies, comments, or survey answers.

Avoid:

- "What do you think?"
- "What's your take?"
- "Anyone else seeing this?"
- "Have you tried this?"
- "Curious what you think."
- "What's your quiet win?"

Do not include chatbot artifacts in final prose:

- "Of course!"
- "Certainly!"
- "Absolutely." as standalone reassurance
- "Great question!"
- "You're absolutely right!"
- "That's a sharp point."
- "You're right to push back."
- "Let me answer honestly..."
- "Would you like me to..."
- "Want me to..."
- "Let me know if..."
- "As an AI language model..."
- "I'd be happy to..."

### 6.3 Sentence and paragraph rhythm

The goal is not to make the writing messy. The goal is to avoid the even, polished, mid-length cadence that makes AI writing feel machine-made.

Use uneven but purposeful rhythm:

- Mix short and longer sentences.
- Use a fragment only when it sounds natural.
- Let some paragraphs be one sentence and others be two or three if the idea needs it.
- Do not make every paragraph the same size.
- Do not make every sentence land like a quote.
- Use a short sentence to clarify or land a point, not to manufacture drama.
- Avoid stacked staccato lines that create fake suspense.
- Split overloaded causal sentences instead of packing every reason, warning, and consequence into one line.
- Never write every sentence at the same length.
- Never end every paragraph with a vague forward-looking sentence.
- Never shift tense within a single argument without a reason. Pick past or present and stay in it.
- Avoid frictionless wall-of-text flow: paragraph after paragraph of smooth mid-length explanation that never lands on a concrete example, cost, decision, or consequence.

Avoid fake punchline rhythm.

A short sentence is useful when it carries a specific point. It becomes AI-sounding when several nearby sentences are:

- very short, often 2 to 6 words
- full-stop heavy
- abstract rather than specific
- detached from enough context to stand alone
- shaped like slogans or quote lines
- stacked in the same grammar pattern

If two or more nearby sentences are under six words, check whether they should be combined, made more specific, or rewritten with a clearer causal link.

Bad: "Trust breaks. Momentum stalls. Work slows."

Better: "The review process slows because each manager rewrites the draft before approving it."

Bad: "Alignment matters. Speed follows. Teams win."

Better: "Teams move faster when they agree on who can approve the work and what counts as done."

Bad: "Ideas get sharper. Meetings get shorter. Work gets cleaner."

Better: "The ideas get sharper because the team argues over the draft before the meeting, not during it."

### 6.4 False contrast, false ranges, and formula patterns

Do not use contrast for drama.

The basic banned forms:

- Not X. Y.
- No X. Just Y.
- Less X. More Y.
- Drop X. Pick up Y.
- X is noise. Y is signal.
- X gets the credit. Y does the work.
- Stop doing X. Start doing Y.
- You think it's X. It's Y.
- X is overrated. Do Y instead.
- It was never X. It was always Y.
- X is the symptom. Y is the cause.
- "It's not X, it's Y."
- "It isn't X, it's Y."
- "It isn't X, but Y."
- "It isn't X, but it does Y."
- "It isn't X, but it doesn't Y."
- "It's not because X, but because Y."
- "It's not about X, it's about Y."
- "This isn't about X. It's about Y."
- "It isn't about X. It means Y."
- "It isn't about X. It's about Y."
- "X is not about Y. It is about Z."
- "Not X, instead Y."
- "Not X anymore. Y now."

The ban applies across sentence breaks. Read consecutive sentences together before deciding each is clean.

Contractions count as `not`. Treat `isn't`, `aren't`, `wasn't`, `weren't`, `doesn't`, `didn't`, `can't`, and `won't` as rejection markers when they set up a contrast or reframe.

Bad: "Everyone talks about the writing. The thinking is the real problem."

Better: "The thinking is the problem."

Bad: "The interface looks clean. Users can't find what they need."

Better: "Users can't find what they need."

When you spot false contrast, delete the genuinely rejected half and state the positive claim directly. When the source uses `not just`, `not only`, `beyond`, or `more than` to include both parts, remove the formula only if needed and preserve both meanings.

Allowed contrast:

- correcting a specific factual error
- distinguishing a date, number, legal claim, technical claim, scope claim, or source claim

Allowed: "The deadline is Friday, not Thursday."

Allowed: "This is a contractor agreement, not an employment contract."

Do not use reframe headings:

- Not software. Infrastructure.
- Past output, toward outcomes.
- The missing ingredient.
- What teams actually miss.

Use direct headings:

- The infrastructure
- Output metrics
- What's missing

Avoid false ranges.

Do not use "from X to Y" as a vague spectrum when X and Y are only two loosely related examples.

Bad: "AI is changing everything from hiring to healthcare."

Better: "AI is changing hiring workflows and insurance claim review."

Real ranges are allowed when the endpoints belong to the same scale.

Allowed: "Revenue grew from $2M to $8M."

Avoid two-item filler setups.

Bad: "Whether it's a sales email or a product page, clarity matters."

Better: "Sales emails and product pages both need a clear next step."

## 7. Final check

Run this silently before sending any final writing or edit.

### 7.1 Final pass questions

1. Does the first sentence earn its place? If not, cut it.
2. Are there vague claims that could be made specific?
3. Are there hedges that do not name what is uncertain?
4. Does the private paragraph ledger give every paragraph a new fact, supported inference, consequence, decision, or requested component rather than `overview`, `recap`, `summary`, `transition`, or `conclusion`?
5. Does the lead preview the body, the closing collect earlier points, or a paragraph state its conclusion twice?
6. Does any sentence invent overlap, cause, motive, decision basis, schedule, group boundary, whole-group claim, or unmentioned measurement?
7. Is there structure that replaced thinking, such as headers, bullets, or transitions performing organization that is not there?
8. Are there synonyms rotating for the same concept?
9. Is there negative parallelism in one sentence or across two?
10. Are there analogies that did not earn their place?
11. Is each supported conclusion and its exact limit stated once?
12. Does the ending add anything, or just repeat?
13. Does the answer sound artificially cheerful or sanitized compared with the facts?
14. Does the answer end with a question or call to action only to invite engagement?

### 7.2 Final audit

Before sending any writing or edit, run two checks.

1. **Full rule check:** Follow the mandatory delivery gate in `SKILL.md`. When Node.js is available, rerun `scripts/print-active-rules.mjs` and require its final marker. The `SKILL.md` controller remains active even when customized numbered rules exist.
2. **Fast visible scan:** Then scan the full answer for the common visible failures below.

The answer fails if it contains:

- an em dash
- a banned empty AI word used as writing, not as a quote or example
- a dead opening or generic closing
- filler transitions
- false contrast for drama
- vague claims where a concrete detail is available
- fake authority
- unsupported certainty
- unnecessary beginner background
- structure that exists only to look organized
- heavy Markdown decoration, random bolding, emoji bullets, or one-item lists
- synonym rotation
- same-length sentence rhythm
- stacked punchline sentences
- engagement bait
- artificial cheer or sanitized positivity
- an ending question that exists only to invite replies
- compliance language about the cleanup process
- blandness caused by overcorrecting the style rules

If the answer fails:

1. Fix every violation.
2. Scan the full answer again.
3. Repeat until the answer passes.
4. Send only the finished answer unless the user asks to see the process.

## Maintenance

Read `operations/kit-operations.md` for loading without a task, customization, reset, rule additions, maintenance, and fixed replies.

## 8. Additional user preferences

Use this section only in `skill-customized.md`.

During guided customization, put the user's final free-form notes here. These can be fragments, examples, references, dislikes, or style descriptions.

When maintaining the customized file:

1. Preserve the user's intent.
2. Turn rough notes into clear rules only when the meaning is obvious.
3. Keep examples if they clarify the preference.
4. If a note conflicts with the core rules, keep the note and mark the conflict for review instead of silently deleting it.

<!-- ANTI_AI_WRITING_SKILL_EOF -->
