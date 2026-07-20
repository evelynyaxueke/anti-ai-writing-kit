import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  CANDIDATE_INPUT_EOF_MARKER,
  CANDIDATE_RECEIPT_BEGIN_MARKER,
  CANDIDATE_RECEIPT_END_MARKER,
  FINAL_CHECK_MARKER,
  frameStdinCandidate,
  runCli
} from '../scripts/check-final.mjs';
import {
  ACTIVE_RULES_MARKER,
  SKILL_MARKER,
  activeRulesSha256,
  buildActiveRules
} from '../scripts/print-active-rules.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

const CONTROLLER = `# Controller

## Mandatory delivery gate

Keep facts.

## 1. Hard bans

No em dash.

## 2. Defaults

Be clear.

## 3. Words

Use plain words.

## 4. Claims

Keep claims true.

## 5. Structure

Use useful structure.

## 6. Rhythm

Vary rhythm.

## 7. Final check

Review the candidate.

## Maintenance

Maintain the skill here.

## 8. Additional preferences

None.

${SKILL_MARKER}
`;

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'final-check-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'SKILL.md'), CONTROLLER);
  return directory;
}

function capture() {
  let data = '';
  return {
    stream: { write(chunk) { data += String(chunk); } },
    read() { return data; }
  };
}

test('clean candidate reloads active rules, scans, emits a private receipt, and ends with the final marker', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  const candidate = 'The review took eleven minutes.';
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const rulesDigest = activeRulesSha256(buildActiveRules(directory));
  const code = runCli(['--stdin', '--format', 'text', '--fail-on', 'review'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(candidateBytes),
    stdout: stdout.stream,
    stderr: stderr.stream
  });
  assert.equal(code, 0);
  const output = stdout.read();
  assert.match(output, new RegExp(`${ACTIVE_RULES_MARKER}\\n__ANTI_AI_FINAL_SCAN_BEGIN__`, 'u'));
  assert.match(output, /Anti-AI writing scan: PASS/u);
  assert.match(output, new RegExp(`candidate_sha256=${createHash('sha256').update(candidateBytes).digest('hex')}`, 'u'));
  assert.match(output, new RegExp(`candidate_bytes=${candidateBytes.length}`, 'u'));
  assert.match(output, /candidate_words=5/u);
  assert.match(output, /candidate_lines=1/u);
  assert.match(output, new RegExp(`rules_sha256=${rulesDigest}`, 'u'));
  assert.ok(output.endsWith(`${CANDIDATE_RECEIPT_END_MARKER}\n${FINAL_CHECK_MARKER}\n`));
  assert.equal(stderr.read(), '');
});

test('word limits and receipt ignore standalone Markdown control markers', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  const candidate = '# Exact Title\n\n## Section\n\nThree lexical words here.';
  assert.equal(runCli(['--stdin', '--min-words', '7', '--max-words', '7'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(candidate),
    stdout: stdout.stream,
    stderr: stderr.stream
  }), 0);
  assert.match(stdout.read(), /candidate_words=7/u);
  assert.equal(stderr.read(), '');
});

test('stdin framing rejects missing, embedded, duplicate, malformed, trailing, and empty input', (t) => {
  const directory = fixture(t);
  const cases = [
    ['missing marker', Buffer.from('Plain result.', 'utf8'), /must end with/u],
    ['embedded marker', frameStdinCandidate(`Plain ${CANDIDATE_INPUT_EOF_MARKER} result.`), /embedded or duplicate/u],
    ['duplicate marker', frameStdinCandidate(frameStdinCandidate('Plain result.')), /embedded or duplicate/u],
    ['malformed marker', Buffer.from(`Plain result.${CANDIDATE_INPUT_EOF_MARKER}\n`, 'utf8'), /malformed EOF marker/u],
    ['trailing bytes', Buffer.concat([frameStdinCandidate('Plain result.'), Buffer.from('tail', 'utf8')]), /trailing bytes/u],
    ['empty candidate', frameStdinCandidate(''), /Candidate input is empty/u],
    ['whitespace candidate', frameStdinCandidate(' \n\t'), /Candidate input is empty/u]
  ];

  for (const [name, stdinBuffer, errorPattern] of cases) {
    const stdout = capture();
    const stderr = capture();
    const code = runCli(['--stdin'], {
      skillDir: directory,
      stdinBuffer,
      stdout: stdout.stream,
      stderr: stderr.stream
    });
    assert.equal(code, 2, name);
    assert.equal(stdout.read(), '', name);
    assert.match(stderr.read(), errorPattern, name);
    assert.doesNotMatch(stdout.read(), new RegExp(CANDIDATE_RECEIPT_BEGIN_MARKER, 'u'), name);
    assert.doesNotMatch(stdout.read(), new RegExp(FINAL_CHECK_MARKER, 'u'), name);
  }
});

test('plain stdin rejects an interactive terminal before reading', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  assert.equal(runCli(['--stdin'], {
    skillDir: directory,
    stdinIsTTY: true,
    stdout: stdout.stream,
    stderr: stderr.stream
  }), 2);
  assert.equal(stdout.read(), '');
  assert.match(stderr.read(), /requires complete framed input to be attached/u);
});

test('final gate rejects terminal line breaks for stdin and file candidates', (t) => {
  const directory = fixture(t);
  for (const candidate of ['Plain result.\n', 'Plain result.\r', 'Plain result.\r\n']) {
    const stdinOut = capture();
    const stdinErr = capture();
    assert.equal(runCli(['--stdin'], {
      skillDir: directory,
      stdinBuffer: frameStdinCandidate(candidate),
      stdout: stdinOut.stream,
      stderr: stdinErr.stream
    }), 2, JSON.stringify(candidate));
    assert.equal(stdinOut.read(), '', JSON.stringify(candidate));
    assert.match(stdinErr.read(), /carriage return|line feed/u, JSON.stringify(candidate));

    const inputPath = path.join(directory, `terminal-${Buffer.from(candidate).toString('hex')}.txt`);
    fs.writeFileSync(inputPath, candidate);
    const fileOut = capture();
    const fileErr = capture();
    assert.equal(runCli(['--input', inputPath], {
      skillDir: directory,
      stdout: fileOut.stream,
      stderr: fileErr.stream
    }), 2, JSON.stringify(candidate));
    assert.equal(fileOut.read(), '', JSON.stringify(candidate));
    assert.match(fileErr.read(), /carriage return|line feed/u, JSON.stringify(candidate));
  }
});

test('final gate rejects other noncanonical transport bytes for stdin and files', (t) => {
  const directory = fixture(t);
  const cases = [
    ['UTF-8 BOM', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('Plain result.', 'utf8')]), /UTF-8 BOM/u],
    ['internal CR', Buffer.from('Plain\rresult.', 'utf8'), /contain no carriage returns/u],
    ['leading blank line', Buffer.from('\nPlain result.', 'utf8'), /leading blank line/u],
    ['spaced leading blank line', Buffer.from(' \t\nPlain result.', 'utf8'), /leading blank line/u],
    ['terminal space', Buffer.from('Plain result. ', 'utf8'), /horizontal whitespace/u],
    ['terminal tab', Buffer.from('Plain result.\t', 'utf8'), /horizontal whitespace/u]
  ];

  for (const [name, candidateBytes, errorPattern] of cases) {
    const stdinOut = capture();
    const stdinErr = capture();
    assert.equal(runCli(['--stdin'], {
      skillDir: directory,
      stdinBuffer: frameStdinCandidate(candidateBytes),
      stdout: stdinOut.stream,
      stderr: stdinErr.stream
    }), 2, name);
    assert.equal(stdinOut.read(), '', name);
    assert.match(stdinErr.read(), errorPattern, name);

    const inputPath = path.join(directory, `noncanonical-${createHash('sha256').update(candidateBytes).digest('hex')}.txt`);
    fs.writeFileSync(inputPath, candidateBytes);
    const fileOut = capture();
    const fileErr = capture();
    assert.equal(runCli(['--input', inputPath], {
      skillDir: directory,
      stdout: fileOut.stream,
      stderr: fileErr.stream
    }), 2, name);
    assert.equal(fileOut.read(), '', name);
    assert.match(fileErr.read(), errorPattern, name);
  }
});

test('candidate input requires valid UTF-8 for stdin and files', (t) => {
  const directory = fixture(t);
  const invalidBytes = Buffer.from([0xc3, 0x28]);

  const stdinOut = capture();
  const stdinErr = capture();
  assert.equal(runCli(['--stdin'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(invalidBytes),
    stdout: stdinOut.stream,
    stderr: stdinErr.stream
  }), 2);
  assert.equal(stdinOut.read(), '');
  assert.match(stdinErr.read(), /not valid UTF-8/u);

  const inputPath = path.join(directory, 'invalid.txt');
  fs.writeFileSync(inputPath, invalidBytes);
  const fileOut = capture();
  const fileErr = capture();
  assert.equal(runCli(['--input', inputPath], {
    skillDir: directory,
    stdout: fileOut.stream,
    stderr: fileErr.stream
  }), 2);
  assert.equal(fileOut.read(), '');
  assert.match(fileErr.read(), /not valid UTF-8/u);
});

test('Unicode candidate receipt hashes exact UTF-8 bytes and records words and lines', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  const candidate = 'Café staff counted 12 entries.\n三人 rested inside.';
  const candidateBytes = Buffer.from(candidate, 'utf8');
  assert.equal(runCli(['--stdin'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(candidateBytes),
    stdout: stdout.stream,
    stderr: stderr.stream
  }), 0);
  const output = stdout.read();
  assert.match(output, new RegExp(`candidate_sha256=${createHash('sha256').update(candidateBytes).digest('hex')}`, 'u'));
  assert.match(output, new RegExp(`candidate_bytes=${candidateBytes.length}`, 'u'));
  assert.match(output, /candidate_words=8/u);
  assert.match(output, /candidate_lines=2/u);
  assert.doesNotMatch(output, /Café|三人/u);
  assert.ok(output.endsWith(`${CANDIDATE_RECEIPT_END_MARKER}\n${FINAL_CHECK_MARKER}\n`));
  assert.equal(stderr.read(), '');
});

test('file input is EOF-bound and receives the same private receipt', (t) => {
  const directory = fixture(t);
  const candidate = 'The file contains the complete candidate.';
  const candidateBytes = Buffer.from(candidate, 'utf8');
  const inputPath = path.join(directory, 'candidate.txt');
  fs.writeFileSync(inputPath, candidateBytes);
  const stdout = capture();
  const stderr = capture();
  assert.equal(runCli(['--input', inputPath], {
    skillDir: directory,
    stdout: stdout.stream,
    stderr: stderr.stream
  }), 0);
  const output = stdout.read();
  assert.match(output, new RegExp(`candidate_sha256=${createHash('sha256').update(candidateBytes).digest('hex')}`, 'u'));
  assert.match(output, new RegExp(`candidate_bytes=${candidateBytes.length}`, 'u'));
  assert.doesNotMatch(output, new RegExp(path.basename(inputPath), 'u'));
  assert.ok(output.endsWith(`${CANDIDATE_RECEIPT_END_MARKER}\n${FINAL_CHECK_MARKER}\n`));
  assert.equal(stderr.read(), '');
});

test('blocking finding prevents the final marker', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  const code = runCli(['--stdin', '--format', 'text', '--fail-on', 'review'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate('Move—now.'),
    stdout: stdout.stream,
    stderr: stderr.stream
  });
  assert.equal(code, 1);
  assert.match(stdout.read(), /ANTI_AI_FINAL_CHECK_BLOCKED/u);
  assert.doesNotMatch(stdout.read(), new RegExp(CANDIDATE_RECEIPT_BEGIN_MARKER, 'u'));
  assert.doesNotMatch(stdout.read(), new RegExp(CANDIDATE_RECEIPT_END_MARKER, 'u'));
  assert.doesNotMatch(stdout.read(), new RegExp(FINAL_CHECK_MARKER, 'u'));
});

test('user word limits are enforced inside the final gate', (t) => {
  const directory = fixture(t);
  const passingOut = capture();
  assert.equal(runCli(['--stdin', '--min-words', '3', '--max-words', '4'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate('One two three.'),
    stdout: passingOut.stream,
    stderr: capture().stream
  }), 0);
  assert.ok(passingOut.read().endsWith(`${FINAL_CHECK_MARKER}\n`));

  const blockedOut = capture();
  assert.equal(runCli(['--stdin', '--max-words', '2'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate('One two three.'),
    stdout: blockedOut.stream,
    stderr: capture().stream
  }), 1);
  assert.match(blockedOut.read(), /format\.word_count Word count 3 exceeds the required maximum 2/u);
  assert.doesNotMatch(blockedOut.read(), new RegExp(CANDIDATE_RECEIPT_BEGIN_MARKER, 'u'));
  assert.doesNotMatch(blockedOut.read(), new RegExp(FINAL_CHECK_MARKER, 'u'));
});

test('strict gate rejects bypass modes before reading stdin', (t) => {
  const directory = fixture(t);
  for (const args of [
    ['--help'],
    ['--version'],
    ['--stdin', '--fail-on', 'never'],
    ['--stdin', '--fail-on', 'blocking'],
    ['--stdin', '--format', 'json']
  ]) {
    const stdout = capture();
    const stderr = capture();
    let read = false;
    const io = {
      skillDir: directory,
      get stdinText() {
        read = true;
        throw new Error('stdin must not be read');
      },
      stdout: stdout.stream,
      stderr: stderr.stream
    };
    assert.equal(runCli(args, io), 2);
    assert.equal(read, false);
    assert.equal(stdout.read(), '');
    assert.doesNotMatch(stdout.read(), new RegExp(FINAL_CHECK_MARKER, 'u'));
  }
});

test('private gate output omits candidate matches and excerpts', (t) => {
  const directory = fixture(t);
  const stdout = capture();
  const stderr = capture();
  const candidate = 'This is not SECRET_ALPHA_731, but the supplied result.';
  const code = runCli(['--stdin'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(candidate),
    stdout: stdout.stream,
    stderr: stderr.stream
  });
  assert.equal(code, 1);
  assert.match(stdout.read(), /contrast\.false_candidate/u);
  assert.doesNotMatch(stdout.read(), /SECRET_ALPHA_731/u);
  assert.doesNotMatch(stdout.read(), /"(?:match|excerpt)"/u);
  assert.doesNotMatch(stdout.read(), new RegExp(FINAL_CHECK_MARKER, 'u'));
  const occurrence = stdout.read().match(/AAW012@\d+/u)[0];
  assert.equal(stderr.read(), '');

  const allowedOut = capture();
  assert.equal(runCli(['--stdin', '--allow-review', occurrence], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate(candidate),
    stdout: allowedOut.stream,
    stderr: capture().stream
  }), 0);
  assert.match(allowedOut.read(), new RegExp(`ALLOWED_REVIEW\\] ${occurrence}`, 'u'));
  assert.doesNotMatch(allowedOut.read(), /SECRET_ALPHA_731/u);
  assert.match(allowedOut.read(), new RegExp(CANDIDATE_RECEIPT_BEGIN_MARKER, 'u'));
  assert.ok(allowedOut.read().endsWith(`${FINAL_CHECK_MARKER}\n`));
});

test('chunked active rules require and verify the manifest digest', (t) => {
  const directory = fixture(t);
  fs.writeFileSync(path.join(directory, 'skill-customized.md'), Array.from({ length: 500 }, (_, index) => `Legacy line ${index}.`).join('\n'));
  const digest = activeRulesSha256(buildActiveRules(directory));
  const stdout = capture();
  const stderr = capture();
  const code = runCli(['--stdin'], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate('Plain result.'),
    stdout: stdout.stream,
    stderr: stderr.stream
  });
  assert.equal(code, 2);
  assert.equal(stdout.read(), '');
  assert.match(stderr.read(), /require numbered chunks/u);

  const verifiedOut = capture();
  const verifiedErr = capture();
  assert.equal(runCli(['--stdin', '--rules-sha256', digest], {
    skillDir: directory,
    stdinBuffer: frameStdinCandidate('Plain result.'),
    stdout: verifiedOut.stream,
    stderr: verifiedErr.stream
  }), 0);
  assert.match(verifiedOut.read(), /^__ANTI_AI_ACTIVE_RULES_VERIFIED__\n/mu);
  assert.match(verifiedOut.read(), new RegExp(`sha256=${digest}\\n${ACTIVE_RULES_MARKER}`, 'u'));
  assert.doesNotMatch(verifiedOut.read(), /Legacy line 499/u);
  assert.ok(verifiedOut.read().endsWith(`${FINAL_CHECK_MARKER}\n`));
  assert.equal(verifiedErr.read(), '');

  fs.appendFileSync(path.join(directory, 'skill-customized.md'), '\nChanged.\n');
  const changedOut = capture();
  const changedErr = capture();
  let read = false;
  assert.equal(runCli(['--stdin', '--rules-sha256', digest], {
    skillDir: directory,
    get stdinText() {
      read = true;
      return frameStdinCandidate('Plain result.');
    },
    stdout: changedOut.stream,
    stderr: changedErr.stream
  }), 2);
  assert.equal(read, false);
  assert.equal(changedOut.read(), '');
  assert.match(changedErr.read(), /do not match/u);
});

test('final gate CLI executes through a symlink', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-symlink-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const link = path.join(directory, 'gate-link.mjs');
  fs.symlinkSync(path.join(TEST_DIR, '..', 'scripts', 'check-final.mjs'), link);
  const rulesDigest = activeRulesSha256(buildActiveRules(path.join(TEST_DIR, '..')));
  const result = spawnSync(
    process.execPath,
    [link, '--stdin', '--format', 'text', '--fail-on', 'review', '--rules-sha256', rulesDigest],
    { input: frameStdinCandidate('The trial cut review time from 18 minutes to 11 minutes.'), encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(CANDIDATE_RECEIPT_BEGIN_MARKER, 'u'));
  assert.ok(result.stdout.endsWith(`${FINAL_CHECK_MARKER}\n`));
});
