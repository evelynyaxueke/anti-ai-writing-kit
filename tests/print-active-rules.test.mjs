import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  ACTIVE_RULES_MARKER,
  CHUNK_BYTE_LIMIT,
  CUSTOM_EOF_MARKER,
  CUSTOM_FULL_FORMAT_MARKER,
  CUSTOM_FORMAT_MARKER,
  SKILL_MARKER,
  activeRulesSha256,
  buildActiveRules,
  buildCustomTemplate,
  runCli,
  splitActiveRules
} from '../scripts/print-active-rules.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const LIVE_SKILL_DIR = path.dirname(TEST_DIR);

const CONTROLLER = `---
name: test-skill
description: Test fixture.
---

# Controller

## Mandatory delivery gate

KEEP CURRENT CONTROLLER.

## Operating priorities

Keep the facts.

## 1. Hard bans

Default rule one.

## 2. Positive defaults

Default rule two.

## 3. Word cleanup

Default rule three.

## 4. Claims

Default rule four.

## 5. Structure

Default rule five.

## 6. Rhythm

Default rule six.

## 7. Final check

Default rule seven.

## Maintenance

KEEP MAINTENANCE ROUTING.

## 8. Additional preferences

Default section eight.

${SKILL_MARKER}
`;

function fixture(t, controller = CONTROLLER) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'active-rules-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'SKILL.md'), controller);
  return directory;
}

function capture() {
  let data = '';
  return {
    stream: { write(chunk) { data += String(chunk); } },
    read() { return data; }
  };
}

test('default output includes the complete controller and names active defaults', (t) => {
  const directory = fixture(t);
  const output = buildActiveRules(directory);
  assert.match(output, /<!-- ANTI_AI_SKILL_BEGIN -->/u);
  assert.match(output, /# Controller/u);
  assert.match(output, /<!-- ANTI_AI_SKILL_END -->/u);
  assert.match(output, /controller_sha256=[a-f0-9]{64}/u);
  assert.match(output, /default Sections 1 through 7/u);
  assert.match(output, /Default rule one\./u);
  assert.match(output, /Customized rules: none/u);
  assert.match(output, /NEXT REQUIRED ACTION BEFORE DELIVERY/u);
  assert.match(output, /private paragraph ledger/u);
  assert.match(output, /source-silence check/u);
  assert.match(output, /one-answer sentence test/u);
  assert.match(output, /reader-trust deletion pass/u);
  assert.match(output, /cross-section primary-location check/u);
  assert.match(output, /relationship-scope check/u);
  assert.match(output, /all\/every quantifier check/u);
  assert.match(output, /outcome-by-outcome coverage check/u);
  assert.match(output, /future-causal-proof check/u);
  assert.match(output, /all final Markdown/u);
  assert.match(output, /no terminal line break/u);
  assert.match(output, /UTF-8 without a BOM/u);
  assert.match(output, /no terminal horizontal whitespace/u);
  assert.match(output, /mode-0600 file or otherwise through framed stdin/u);
  assert.match(output, /complete PASS candidate receipt/u);
  assert.match(output, /exact checked candidate without later edits/u);
  assert.ok(output.endsWith(`${ACTIVE_RULES_MARKER}\n`));
});

test('empty custom file falls back to default rules', (t) => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), ' \n');
  assert.doesNotMatch(buildActiveRules(directory), /ANTI_AI_CUSTOM_RULES_BEGIN/u);
});

test('custom template is a complete standalone skill', (t) => {
  const directory = fixture(t);
  const custom = buildCustomTemplate(directory);
  assert.ok(custom.startsWith('---\n'));
  assert.match(custom, new RegExp(`^---\\n[\\s\\S]*?\\n---\\n${CUSTOM_FULL_FORMAT_MARKER}$`, 'mu'));
  assert.ok(custom.endsWith(`${SKILL_MARKER}\n`));
  for (let section = 1; section <= 8; section += 1) assert.match(custom, new RegExp(`^## ${section}\\.`, 'mu'));
  assert.match(custom, /KEEP CURRENT CONTROLLER/u);
  assert.match(custom, /KEEP MAINTENANCE ROUTING/u);
});

test('standalone custom is the only active skill source', (t) => {
  const directory = fixture(t);
  const custom = buildCustomTemplate(directory)
    .replace('Default rule one.', 'Personal rule one.')
    .replace('Default section eight.', 'Keep contractions.');
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), custom);
  const output = buildActiveRules(directory);
  assert.match(output, /active_source=skill-customized\.md/u);
  assert.match(output, /<!-- ANTI_AI_CUSTOM_SKILL_BEGIN -->/u);
  assert.doesNotMatch(output, /<!-- ANTI_AI_SKILL_BEGIN -->/u);
  assert.match(output, /custom_sha256=[a-f0-9]{64}/u);
  assert.match(output, /Personal rule one\./u);
  assert.match(output, /Keep contractions\./u);
  assert.doesNotMatch(output, /Default rule one\./u);
  assert.match(output, /Do not load default SKILL\.md rules in addition/u);
  assert.ok(output.endsWith(`${ACTIVE_RULES_MARKER}\n`));
});

test('create, customize, and reset lifecycle switches the active source cleanly', (t) => {
  const directory = fixture(t);
  const customPath = path.join(directory, 'skill-customized.md');

  assert.match(buildActiveRules(directory), /active_source=SKILL\.md/u);

  const custom = buildCustomTemplate(directory)
    .replace('Default section eight.', 'Never use the phrase silver bullet.');
  fs.writeFileSync(customPath, custom);
  const customized = buildActiveRules(directory);
  assert.match(customized, /active_source=skill-customized\.md/u);
  assert.match(customized, /Never use the phrase silver bullet\./u);
  assert.doesNotMatch(customized, /<!-- ANTI_AI_SKILL_BEGIN -->/u);

  fs.rmSync(customPath);
  const reset = buildActiveRules(directory);
  assert.match(reset, /active_source=SKILL\.md/u);
  assert.match(reset, /Default section eight\./u);
  assert.doesNotMatch(reset, /Never use the phrase silver bullet\./u);
});

test('incomplete standalone custom fails closed instead of falling back', (t) => {
  const directory = fixture(t);
  const customPath = path.join(directory, 'skill-customized.md');
  fs.writeFileSync(customPath, buildCustomTemplate(directory).replace(SKILL_MARKER, ''));
  assert.throws(() => buildActiveRules(directory), /standalone skill-customized\.md is incomplete/u);
});

test('older compact custom remains supported', (t) => {
  const directory = fixture(t);
  const custom = `${CUSTOM_FORMAT_MARKER}\n\n${Array.from({ length: 8 }, (_, index) => `## ${index + 1}. Rules\n\nPersonal ${index + 1}.`).join('\n\n')}\n\n${CUSTOM_EOF_MARKER}\n`;
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), custom);
  const output = buildActiveRules(directory);
  assert.match(output, /active_source=SKILL\.md/u);
  assert.match(output, /Compact customized Sections 1 through 7 replace the defaults/u);
  assert.match(output, /Personal 8\./u);
});

test('legacy custom keeps numbered and unnumbered preferences without old process authority', (t) => {
  const directory = fixture(t);
  const legacy = `# Old full copy

## Operating standard

Use contractions.

## Old process

The customized file replaces everything.

## 1. Personal rules

Keep the product name.
`;
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), legacy);
  const output = buildActiveRules(directory);
  assert.ok(output.indexOf('<!-- ANTI_AI_SKILL_BEGIN -->') < output.indexOf('Use contractions.'));
  assert.match(output, /numbered and unnumbered writing preferences/u);
  assert.match(output, /Ignore legacy loading or process text/u);
  assert.ok(output.indexOf('Required process reminder:') > output.indexOf('The customized file replaces everything.'));
  assert.match(output, /outcome-by-outcome coverage check/u);
  assert.match(output, /capability-promotion check/u);
  assert.match(output, /recommendation-once check/u);
  assert.match(output, /lexical tokens rather than standalone Markdown control markers/u);
  assert.match(output, /Default rule one\./u);
  assert.ok(output.endsWith(`${ACTIVE_RULES_MARKER}\n`));
});

test('format marker is recognized only as the first nonblank line', (t) => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), `# Legacy note\n\nQuoted marker: ${CUSTOM_FORMAT_MARKER}\n`);
  assert.match(buildActiveRules(directory), /Legacy customized writing preferences follow/u);
});

test('compact custom file fails closed without EOF or any numbered section', (t) => {
  const directory = fixture(t);
  const customPath = path.join(directory, 'skill-customized.md');
  fs.writeFileSync(customPath, `${CUSTOM_FORMAT_MARKER}\n## 1. Rules\n`);
  assert.throws(() => buildActiveRules(directory), /incomplete or missing/u);

  const incomplete = `${CUSTOM_FORMAT_MARKER}\n\n${Array.from({ length: 8 }, (_, index) => index === 3 ? '' : `## ${index + 1}. Rules\n\nPersonal ${index + 1}.`).join('\n\n')}\n\n${CUSTOM_EOF_MARKER}\n`;
  fs.writeFileSync(customPath, incomplete);
  assert.throws(() => buildActiveRules(directory), /exactly one Section 4/u);
});

test('long legacy custom produces digest-bound ordered chunks', (t) => {
  const directory = fixture(t);
  const legacy = Array.from({ length: 520 }, (_, index) => `Legacy preference line ${index + 1}.`).join('\n');
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), legacy);

  const stdout = capture();
  const stderr = capture();
  assert.equal(runCli([], { skillDir: directory, stdout: stdout.stream, stderr: stderr.stream }), 0);
  const manifest = stdout.read();
  assert.match(manifest, /^__ANTI_AI_ACTIVE_RULES_CHUNKED__/u);
  const chunkCount = Number(manifest.match(/^chunks=(\d+)$/mu)[1]);
  const digest = manifest.match(/^sha256=([a-f0-9]{64})$/mu)[1];
  assert.equal(digest, activeRulesSha256(buildActiveRules(directory)));
  assert.ok(chunkCount > 1);
  assert.match(manifest, /^bytes=\d+$/mu);
  assert.match(manifest, /^max_chunk_bytes=\d+$/mu);
  assert.doesNotMatch(manifest, /node scripts\/print-active-rules\.mjs/u);
  assert.match(manifest, /node '\/.*\/print-active-rules\.mjs' --chunk 1/u);
  assert.equal(stderr.read(), '');

  for (let chunk = 1; chunk <= chunkCount; chunk += 1) {
    const part = capture();
    assert.equal(runCli(['--chunk', String(chunk), '--sha256', digest], {
      skillDir: directory, stdout: part.stream, stderr: capture().stream
    }), 0);
    assert.match(part.read(), new RegExp(`^__ANTI_AI_ACTIVE_RULES_CHUNK_${chunk}_OF_${chunkCount}_BEGIN__\\nsha256=${digest}`, 'u'));
    if (chunk === chunkCount) assert.ok(part.read().endsWith(`${ACTIVE_RULES_MARKER}\n`));
  }

  const missingDigestOut = capture();
  const missingDigestErr = capture();
  assert.equal(runCli(['--chunk', '1'], {
    skillDir: directory, stdout: missingDigestOut.stream, stderr: missingDigestErr.stream
  }), 2);
  assert.equal(missingDigestOut.read(), '');
  assert.match(missingDigestErr.read(), /--chunk <number> --sha256 <digest>/u);

  fs.appendFileSync(path.join(directory, 'skill-customized.md'), '\nChanged preference.\n');
  const changedOut = capture();
  const changedErr = capture();
  assert.equal(runCli(['--chunk', '1', '--sha256', digest], {
    skillDir: directory, stdout: changedOut.stream, stderr: changedErr.stream
  }), 2);
  assert.equal(changedOut.read(), '');
  assert.match(changedErr.read(), /Active rules changed/u);
});

test('one huge legacy line is split by UTF-8 byte size without data loss', (t) => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), `Keep this exact preference: ${'界'.repeat(110_000)}`);
  const output = buildActiveRules(directory);
  const chunks = splitActiveRules(output);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.join(''), output);
  assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk, 'utf8') <= CHUNK_BYTE_LIMIT));

  const stdout = capture();
  const scriptPath = '/private/tmp/Skill Folder/scripts/print-active-rules.mjs';
  assert.equal(runCli([], { skillDir: directory, scriptPath, stdout: stdout.stream, stderr: capture().stream }), 0);
  assert.match(stdout.read(), /node '\/private\/tmp\/Skill Folder\/scripts\/print-active-rules\.mjs' --chunk 1/u);
});

test('controller sections and maintenance must be unique and ordered', (t) => {
  const missing = CONTROLLER.replace('## 4. Claims\n\nDefault rule four.\n\n', '');
  assert.throws(() => buildActiveRules(fixture(t, missing)), /exactly one Section 4/u);

  const duplicate = CONTROLLER.replace(
    '## 5. Structure',
    '## 4. Duplicate claims\n\nDuplicate.\n\n## 5. Structure'
  );
  assert.throws(() => buildActiveRules(fixture(t, duplicate)), /exactly one Section 4/u);

  const orderedBlock = '## 4. Claims\n\nDefault rule four.\n\n## 5. Structure\n\nDefault rule five.';
  const reversedBlock = '## 5. Structure\n\nDefault rule five.\n\n## 4. Claims\n\nDefault rule four.';
  assert.throws(() => buildActiveRules(fixture(t, CONTROLLER.replace(orderedBlock, reversedBlock))), /must be in order/u);

  const duplicateMaintenance = CONTROLLER.replace(
    '## 8. Additional preferences',
    '## Maintenance\n\nDuplicate.\n\n## 8. Additional preferences'
  );
  assert.throws(() => buildActiveRules(fixture(t, duplicateMaintenance)), /exactly one Maintenance/u);
});

test('compact custom sections must be unique and ordered', (t) => {
  const directory = fixture(t);
  const customPath = path.join(directory, 'skill-customized.md');
  const custom = buildCustomTemplate(directory);
  const orderedBlock = '## 4. Claims\n\nDefault rule four.\n\n## 5. Structure\n\nDefault rule five.';
  const reversedBlock = '## 5. Structure\n\nDefault rule five.\n\n## 4. Claims\n\nDefault rule four.';
  fs.writeFileSync(customPath, custom.replace(orderedBlock, reversedBlock));
  assert.throws(() => buildActiveRules(directory), /must be in order/u);

  fs.writeFileSync(customPath, custom.replace('## 5. Structure', '## 4. Duplicate\n\nDuplicate.\n\n## 5. Structure'));
  assert.throws(() => buildActiveRules(directory), /exactly one Section 4/u);
});

test('reserved runtime markers are rejected in compact and legacy custom files', (t) => {
  const directory = fixture(t);
  const customPath = path.join(directory, 'skill-customized.md');
  fs.writeFileSync(customPath, 'Legacy preference.\n__ANTI_AI_FINAL_CHECK_EOF__\n');
  assert.throws(() => buildActiveRules(directory), /reserved runtime marker/u);

  const compact = buildCustomTemplate(directory).replace(
    'Default section eight.',
    'Default section eight.\n\n__ANTI_AI_ACTIVE_RULES_EOF__'
  );
  fs.writeFileSync(customPath, compact);
  assert.throws(() => buildActiveRules(directory), /reserved runtime marker/u);
});

test('CLI success prints the final marker for ordinary active rules', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  assert.equal(runCli([], { skillDir: directory, stdout: stdout.stream, stderr: stderr.stream }), 0);
  assert.ok(stdout.read().endsWith(`${ACTIVE_RULES_MARKER}\n`));
  assert.equal(stderr.read(), '');
});

test('missing controller EOF marker fails closed in API and CLI', (t) => {
  const directory = fixture(t, '# Truncated controller\n');
  assert.throws(() => buildActiveRules(directory), /incomplete or missing/u);
  const stdout = capture();
  const stderr = capture();
  assert.equal(runCli([], { skillDir: directory, stdout: stdout.stream, stderr: stderr.stream }), 2);
  assert.equal(stdout.read(), '');
  assert.match(stderr.read(), /^print-active-rules: SKILL\.md is incomplete/u);
});

test('live repository markers and one-file rule layout are intact', () => {
  const skill = fs.readFileSync(path.join(LIVE_SKILL_DIR, 'SKILL.md'), 'utf8');
  const operations = fs.readFileSync(path.join(LIVE_SKILL_DIR, 'operations', 'kit-operations.md'), 'utf8');
  const readme = fs.readFileSync(path.join(LIVE_SKILL_DIR, 'README.md'), 'utf8');
  assert.ok(skill.trimEnd().endsWith(SKILL_MARKER));
  assert.equal(skill.split(SKILL_MARKER).length - 1, 1);
  assert.doesNotMatch(skill, /__ANTI_AI_[A-Z0-9_]+__/u);
  assert.match(skill, /^## Anti-overfitting$/mu);
  assert.match(skill, /^### 7\.2 Final audit$/mu);
  assert.match(skill, /checker rejects interactive terminal input immediately/u);
  assert.equal(fs.existsSync(path.join(LIVE_SKILL_DIR, 'references', 'patterns-and-examples.md')), false);
  assert.ok(operations.trimEnd().endsWith('<!-- ANTI_AI_WRITING_OPERATIONS_EOF -->'));
  assert.match(operations, /Every rule added during normal use goes to `skill-customized\.md`/u);
  assert.match(operations, /Do not save a complaint without confirmation/u);
  assert.doesNotMatch(operations, /Should I add this to your personal customized file or the default SKILL\.md/u);
  assert.match(readme, /Every rule added during normal use goes to `skill-customized\.md`/u);
  assert.match(readme, /Use Anti-AI Writing Kit\. Add this to my rules/u);
  assert.match(readme, /A complaint is not saved without your confirmation/u);
  assert.doesNotMatch(readme, /Put this in the default skill/u);
  assert.match(skill, /when a user complains about an AI-writing habit during an active writing session/u);
});

test('printer CLI executes through a symlink', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'printer-symlink-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const link = path.join(directory, 'printer-link.mjs');
  fs.symlinkSync(path.join(LIVE_SKILL_DIR, 'scripts', 'print-active-rules.mjs'), link);
  const result = spawnSync(process.execPath, [link], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^__ANTI_AI_ACTIVE_RULES_CHUNKED__/u);
  assert.match(result.stdout, /sha256=[a-f0-9]{64}/u);
  assert.match(result.stdout, /--chunk 1 --sha256 [a-f0-9]{64}/u);
});
