# Kit operations

Use this file for skill behavior that is not part of the writing rules. Keep the core writing rules in `SKILL.md`.

## File roles

1. `SKILL.md`: the core Anti-AI Writing Skill. This is the default rule document.
2. `skill-customized.md`: optional user-created version. If this file exists and has content, use it instead of the default rules in `SKILL.md`.
3. `README.md`: public user manual and GitHub intro.
4. `AGENTS.md`: maintainer guidance for agents editing this repo.

## Operating order

1. Follow the user's instructions and factual accuracy.
2. Customization is opt-in. Start guided customization only when the user explicitly asks to customize, personalize, tune, or make the skill fit their taste.
3. Do not create `skill-customized.md` during normal writing, editing, or skill-loading.
4. If `skill-customized.md` exists and is not empty, use it as the active writing rule document.
5. If no customized file exists, apply the default rules in `SKILL.md`.

If `skill-customized.md` conflicts with `SKILL.md` on writing rules, follow `skill-customized.md`. The customized file represents the user's chosen writing version.

For loading, customization, reset, rule additions, and other kit behavior, follow this file even when `skill-customized.md` exists.

Do not explain monthly update syncing, merge behavior, or update reminders during normal loading, customization, reset, or user-facing help. That process is not designed yet.

## Normal load behavior

Use this when the user invokes the skill without providing a writing task.

- If `skill-customized.md` exists and is not empty, say exactly: `Loaded. I'll use skill-customized.md for this session. Send the piece, topic, or brief.`
- If `skill-customized.md` does not exist or is empty, say exactly: `Loaded. No customized file found, so I'll use the original SKILL.md. Send the piece, topic, or brief.`
- Do not ask whether the user wants to customize.
- Do not mention guided customization unless the user asks how to customize or asks to start customization.

## Add a rule or preference

Use this when the user asks to add, remember, save, or update a writing rule, or when the user complains about a concrete AI-writing pattern and clearly wants the skill to remember it.

Examples:

- `Add this to my rules: never use "X".`
- `Remember this: I hate when AI does X.`
- `Put this in the default skill: avoid X because it sounds fake.`
- `Is this AI-sounding? If yes, add it to the skill.`

If the user only asks whether something sounds AI-generated and does not ask to save it, answer the question first. Then ask one short follow-up: `Do you want me to add this as a rule?`

### Choose the target file

- If the user says default, public, core skill, `SKILL.md`, or for everyone, edit `SKILL.md`.
- If the user says my rules, personal, customized, or `skill-customized.md`, edit `skill-customized.md`.
- If the target is unclear, ask one short question before editing: `Should I add this to your personal customized file or the default SKILL.md?`

If the target is `skill-customized.md` and the file does not exist, create it by copying the current writing rules from `SKILL.md`. Exclude YAML frontmatter.

### Search before adding

Before editing, search the target file for:

1. The exact phrase or example the user gave.
2. Close variants of the phrase.
3. The root problem behind the phrase.
4. The nearest existing category or subcategory.

If an existing rule already covers the issue, do not add a duplicate. If the user's note adds a sharper example or clearer wording, update the existing rule. If no change is needed, say where it is already covered.

### Place the rule

Add the rule where it belongs:

- Hard bans: only for high-priority patterns that should always fail the final answer.
- Positive defaults: rules that say what good writing should do.
- Word and phrase cleanup: vocabulary, filler phrases, fake depth, empty polish.
- Claims and evidence: fake authority, vague claims, unsupported certainty.
- Structure and formatting: headings, bullets, tables, lists, decorative organization.
- Rhythm and repetition: punchy lines, repeated sentence shapes, formulaic cadence.
- Final check: audit items the agent should scan before sending.

If no existing category fits, create the smallest useful new subcategory. Create a new top-level category only when no current section can hold the rule without confusion.

### Write the rule

Keep the addition short. Include:

1. The pattern to avoid.
2. Why it sounds machine-made or weak.
3. What to do instead.
4. A short example only if the rule would be unclear without one.

After editing, say exactly what changed and where it was added.

## Manual customization

Simple. Delete rules you do not want the agent to follow. Add rough notes where they belong. A few words are enough.

Do not spend much time editing carefully in the first pass. Ask the agent to clean up duplicates and rough notes later if needed.

For manual editing, edit `SKILL.md` directly if you want to change the default skill. Ask the agent to create `skill-customized.md` if you want a personal version that overrides the default without changing it.

## Reset customization

Use this when the user says `reset`, `reset customization`, `start over from default`, `delete customized version`, or clearly asks to remove their customized version.

- If the request is exactly `reset` or clearly asks to delete the customized version, delete `skill-customized.md` without asking another question.
- Delete only `skill-customized.md`. Do not change `SKILL.md`, `operations/`, or any other file.
- If `skill-customized.md` exists, delete it and say exactly: `Reset done. I deleted skill-customized.md. The skill will use the original SKILL.md unless you customize again.`
- If `skill-customized.md` does not exist, say exactly: `No customized file found. The skill is already using the original SKILL.md.`
- If the user says something vague like "start over" and it is not clear whether they mean reset customization, ask one short confirmation before deleting.

## Guided customization workflow

Use this workflow when the user asks to customize, personalize, tune, or make the skill fit their taste.

1. Check whether `skill-customized.md` exists.
2. If it does not exist, create it by copying the current writing rules from `SKILL.md`. Exclude YAML frontmatter.
3. Send the fixed customization opening message below. Do not ask the user to customize anything in this first message.
4. Wait for the user to confirm before starting the first section. Treat "yes," "start," "go," "sure," or another positive reply as confirmation.
5. Work through every numbered customization section in `SKILL.md`, starting with `## 1. Hard bans` and ending with `## 7. Final check`.
6. Do not treat `## Operating standard` or `## Anti-overfitting` as customization sections or subcategories unless the user specifically asks to change setup behavior.
7. If a numbered section has subcategories, first send the fixed category overview message. Use the parent section title, the parent section intro text before the first subcategory, and the subcategory titles as the overview. Do not ask for edits in the overview message.
8. Wait for the user to confirm before starting the first subcategory. Treat "yes," "start," "go," "sure," or another positive reply as confirmation.
9. Customize subcategorized sections subcategory by subcategory. Label each editable subcategory with its full subcategory number, such as `Section 3.1: Vocabulary that performs depth`. Do not label a subcategory with only its parent number, such as `Section 3`.
10. If a numbered section has no subcategories, show the full section content at once.
11. For every editable section or subcategory, show the full content in the chat before asking for feedback. Put the rule text between divider lines. Do not summarize instead of showing the content.
12. Ask only the fixed question for that section or subcategory.
13. Accept rough replies. The user can answer with fragments, examples, dislikes, short notes, or a simple "no." Treat "no," "nothing," "looks good," "this is fine," and similar replies as no change for that section.
14. If the user requests no change, move directly to the next section or subcategory without saying that the section is unchanged.
15. If the user requests a change, update the matching section in `skill-customized.md` immediately, then briefly confirm what changed before moving on. Do not save requested changes for a later batch.
16. After all numbered customization sections are covered, send the fixed final preference prompt.
17. Put the user's final preference notes in a section named `Additional user preferences` in `skill-customized.md`.
18. At the end, send the fixed closing message below.

Use the fixed messages exactly. Do not paraphrase them.

## Fixed customization opening message

```text
I'll help you customize this writing kit section by section.

It usually takes 15 to 25 minutes. There are 8 customization steps:

1. Hard bans
2. Positive defaults
3. Word and phrase cleanup
4. Claims and evidence
5. Structure and formatting
6. Rhythm and repetition
7. Final check
8. Anything else you want to add

If a step has subcategories, I'll show a short overview first. Then I'll go through those subcategories one at a time and show the full rule text in the chat before asking what you want to change.

Shall we start?
```

## Fixed category overview message

Use this before presenting the first subcategory in any numbered section that has subcategories.

```text
Section [number]: [section title]

[paste the parent section intro text from SKILL.md]

Subsections:

- [number.subnumber]: [subcategory title]
- [number.subnumber]: [subcategory title]
- [number.subnumber]: [subcategory title]

Shall we go through these now?
```

## Fixed section or subcategory prompt format

```text
Section [number or number.subnumber]: [section or subcategory title]

Current rule text:

---

[paste the full content of this section or subcategory]

---

Do you have anything to add, remove, or change here?
```

## Fixed final preference prompt

```text
Final step: Anything else you want to add.

Do you have any preference, style description, example, reference, or pet peeve you want this kit to remember?
```

## Fixed closing message

```text
Done. I updated skill-customized.md with your choices.

The customized file will be used from now on. When you want, I can run maintenance on it to remove duplicates and make the rules easier for agents to follow.
```
