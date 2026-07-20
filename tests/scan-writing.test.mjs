import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { countWords, runCli, scanText } from '../scripts/scan-writing.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

function byRule(result, ruleId) {
  return result.findings.filter((item) => item.rule_id === ruleId);
}

function sink() {
  let data = '';
  return {
    stream: { write(chunk) { data += String(chunk); } },
    read() { return data; }
  };
}

test('clean prose has no findings', () => {
  const result = scanText('The trial cut review time from 18 minutes to 11 minutes.');
  assert.deepEqual(result.summary, {
    blocking: 0,
    review: 0,
    advisory: 0,
    mechanical_pass: true,
    semantic_review_required: true
  });
});

test('scanner CLI executes through a symlink', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-symlink-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const link = path.join(directory, 'scanner-link.mjs');
  fs.symlinkSync(path.join(TEST_DIR, '..', 'scripts', 'scan-writing.mjs'), link);
  const result = spawnSync(process.execPath, [link, '--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '0.12.0');
});

test('lexical word count excludes standalone Markdown control markers', () => {
  const text = '# Exact Title\n\n## Section\n\nThree lexical words here.\n\n1. First item\n2) Second item\n- [x] Done\n- [ ] Pending';
  assert.equal(countWords(text), 13);
  assert.equal(scanText(text).source.words, 13);
});

test('em dashes have exact UTF-16 offsets and Unicode columns', () => {
  const text = '🙂 First—then second—done.';
  const result = scanText(text);
  const matches = byRule(result, 'AAW001');
  assert.equal(matches.length, 2);
  assert.equal(matches[0].location.start.offset, text.indexOf('—'));
  assert.equal(matches[0].location.start.column, 8);
  assert.equal(matches[1].location.start.offset, text.lastIndexOf('—'));
});

test('quoted blocking material is retained and downgraded for review', () => {
  const result = scanText('She wrote, “The review moved—again.”');
  const match = byRule(result, 'AAW001')[0];
  assert.equal(match.level, 'review');
  assert.equal(match.context, 'quoted');
});

test('prohibited vocabulary is case-insensitive', () => {
  const result = scanText('A Robust plan will LEVERAGE the queue.');
  assert.deepEqual(byRule(result, 'AAW020').map((item) => item.match), ['Robust', 'LEVERAGE']);
});

test('fenced and inline code are ignored by default', () => {
  const text = 'Use `robust—mode` in this example.\n```text\nMoreover, leverage—this.\n```';
  assert.equal(scanText(text).findings.length, 0);
  assert.ok(scanText(text, { includeCode: true }).findings.length > 0);
});

test('multi-backtick inline code is masked and unmatched runs remain prose', () => {
  const text = 'Before ``inside — with ` tick`` after —';
  const matches = byRule(scanText(text), 'AAW001');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].location.start.offset, text.lastIndexOf('—'));
  assert.equal(byRule(scanText('Before ``unmatched — after'), 'AAW001').length, 1);
});

test('multiline Markdown code spans are masked', () => {
  const text = 'Before `code\ninside —` after —';
  const matches = byRule(scanText(text), 'AAW001');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].location.start.offset, text.lastIndexOf('—'));
});

test('fence closers require the right character, length, and empty tail', () => {
  const text = '```\ninside —\n```` javascript?\nstill —\n~~\nstill inside —\n````   \noutside —';
  const matches = byRule(scanText(text), 'AAW001');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].location.start.offset, text.lastIndexOf('—'));
});

test('four-space-indented fence markers do not close a fence', () => {
  const text = '```\ninside\n    ```\nstill — inside\n```\noutside —';
  const matches = byRule(scanText(text), 'AAW001');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].location.start.offset, text.lastIndexOf('—'));
});

test('quotes inside ignored code do not change prose context', () => {
  const result = scanText('`"` — "later"');
  const match = byRule(result, 'AAW001')[0];
  assert.equal(match.level, 'blocking');
  assert.equal(match.context, 'prose');
});

test('quoted material spanning lines is classified as quoted', () => {
  const result = scanText('She wrote, “First line\nsecond — line.”');
  const match = byRule(result, 'AAW001')[0];
  assert.equal(match.level, 'review');
  assert.equal(match.context, 'quoted');
});

test('dead openings and generic closings block delivery', () => {
  const result = scanText('In today’s changing market, this matters.\n\nThe possibilities are endless.');
  assert.equal(byRule(result, 'AAW004').length, 1);
  assert.equal(byRule(result, 'AAW005').length, 1);
  assert.equal(result.summary.blocking, 2);
});

test('generic AI-change openings block delivery', () => {
  for (const text of [
    'As AI continues to evolve, businesses need new tools.',
    'As AI changes quickly, teams adjust.',
    'As artificial intelligence advances rapidly, work changes.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW004').length, 1, text);
  }
  assert.equal(byRule(scanText('As AI systems become cheaper, more teams can test them.'), 'AAW004').length, 0);
});

test('review candidates do not receive semantic verdicts', () => {
  const text = 'Research shows it is not a speed problem, but a review problem. Moreover, the answer is conditional.';
  const result = scanText(text);
  assert.equal(byRule(result, 'AAW010').length, 1);
  assert.equal(byRule(result, 'AAW012').length, 1);
  assert.equal(byRule(result, 'AAW011').length, 1);
  assert.equal(byRule(result, 'AAW015').length, 1);
  assert.equal(result.summary.blocking, 0);
  assert.equal(result.summary.semantic_review_required, true);
});

test('additive contrast formulas are flagged while both meanings can be preserved', () => {
  for (const text of [
    'The goal is not simply to work faster; it is to simplify operations.',
    'This means more than working faster. It changes the workflow.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW012').length, 1, text);
  }
});

test('packaged conditional verdict variants are flagged', () => {
  for (const text of [
    'The effect is conditional.',
    'The benefit remains conditional.',
    'The careful answer is that AI may help.',
    'A careful conclusion would name the conditions.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW015').length, 1, text);
  }
  assert.equal(byRule(scanText('The contract is conditional on board approval.'), 'AAW015').length, 0);
  assert.equal(byRule(scanText('The answer depends on task type and review cost.'), 'AAW015').length, 0);
});

test('generic outcome claims are flagged without catching statistical phrasing', () => {
  for (const text of [
    'The tools deliver meaningful results.',
    'The change produces better outcomes.',
    'The program drives real impact.',
    'The process generates tangible value.',
    'The team achieved major improvements.',
    'The team made substantial improvements.',
    'The change makes fundamental improvements.',
    'The program achieves meaningful change.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW028').length, 1, text);
  }
  assert.equal(byRule(scanText('The trial produced statistically significant results.'), 'AAW028').length, 0);
  assert.equal(byRule(scanText('The change cut review time from 18 to 11 minutes.'), 'AAW028').length, 0);
});

test('inflated level claims are flagged for review', () => {
  assert.equal(byRule(scanText('The tools reach new levels of productivity.'), 'AAW029').length, 1);
  assert.equal(byRule(scanText('The team completed 14 reviews.'), 'AAW029').length, 0);
});

test('generic saved-time claims are flagged for review', () => {
  const result = scanText('The tool frees up more time for judgment.');
  assert.equal(byRule(result, 'AAW016').length, 1);
});

test('generic tool qualifiers and technology-change clauses are review findings', () => {
  for (const text of ['advanced AI tools', 'the latest tools', 'current solutions']) {
    assert.equal(byRule(scanText(text), 'AAW030').length, 1, text);
  }
  for (const text of [
    'AI tools develop quickly.',
    'Artificial intelligence continues to evolve.',
    'Businesses adapt as the technology continues to change.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW031').length, 1, text);
  }
  assert.equal(byRule(scanText('The team installed version 4.2 on July 8.'), 'AAW030').length, 0);
});

test('generic possessive outcome claims are review findings', () => {
  assert.equal(byRule(scanText('The tools improve their results.'), 'AAW032').length, 1);
  assert.equal(byRule(scanText('The tools cut review time by 12 minutes.'), 'AAW032').length, 0);
});

test('unsupported likelihood comparisons and repeated reasoning signposts are review findings', () => {
  assert.equal(byRule(scanText('AI is most likely to help with bounded tasks.'), 'AAW033').length, 1);
  assert.equal(byRule(scanText('AI may help with bounded tasks.'), 'AAW033').length, 0);
  const repeated = scanText('Reasoning supports the mechanism. The same reasoning shows a cost. This reasoning does not prove a net gain.');
  assert.equal(byRule(repeated, 'AAW034').length, 1);
  assert.equal(byRule(scanText('Reasoning supports the mechanism. Evidence is still needed.'), 'AAW034').length, 0);
});

test('packaged evidence and conclusion signposts are review candidates', () => {
  for (const text of [
    'What the data show is a 12 percent increase.',
    'What the evidence establishes is a narrower result.',
    'What the figures prove is that the queue doubled.',
    'What the numbers show is a steady decline.',
    'What the record shows is a missed handoff.',
    'The evidence supports a cautious conclusion.',
    'The data point to a narrow finding.',
    'The record supports a straightforward answer.',
    'The trial supports a causal claim within its studied scope.',
    'The study supports a limited conclusion.',
    'The plan follows the clearest findings.',
    'The decision tracks the strongest evidence.',
    'The choice follows the key signals.'
  ]) {
    const matches = byRule(scanText(text), 'AAW036');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
    assert.equal(matches[0].confidence, 'candidate', text);
  }
});

test('packaged-signpost detector does not ban Wh-openers, adverbs, active voice, or ordinary evidence statements', () => {
  for (const text of [
    'What the editor changed was the title.',
    'The data show a 12 percent increase.',
    'The evidence supports adding a second reviewer.',
    'The plan follows the signed contract.',
    'The analyst clearly states the finding.',
    'The record shows that the payment arrived on July 8.',
    'The trial supports a causal claim about the measured outcome because teams were randomly assigned.',
    'The editor asked what the data show in the appendix.',
    'The plan follows the clearest route to the station.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW036').length, 0, text);
  }
});

test('aggregate count boundary words are review candidates', () => {
  for (const text of [
    'Another 176 respondents selected management.',
    'Another 176 said they used a workaround.',
    'An additional 24% of participants selected cost.',
    'An additional 24% selected cost.',
    'The other 1,240 customers chose annual billing.',
    'The remaining 12 teams reported a delay.'
  ]) {
    const matches = byRule(scanText(text), 'AAW037');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'Management was selected by 176 respondents.',
    'A separate follow-up recruited 24 additional participants.',
    'Another report counted 12 teams.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW037').length, 0, text);
  }
});

test('recap labels and packaged synthesis are review candidates', () => {
  for (const text of [
    'This estimate is the primary result.',
    'This finding supports a protected lane.',
    'That is a causal conclusion.',
    'Taken together, these findings show a reduction.',
    'Taken together, those features support attributing the reduction to Relay.',
    'Together, these conditions indicate a lower risk.',
    'Together, the records point to a delay.',
    'The comments identify one practical feature.',
    'These examples illustrate two common errors.'
  ]) {
    const matches = byRule(scanText(text), 'AAW038');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'The primary estimate was 4.6 percentage points.',
    'Random assignment supports attributing the measured change to the protocol.',
    'Together, the bolts hold the frame.',
    'This was a decision to keep the office open during repairs.',
    'The stated basis for the dismissal was falsified data.',
    'This approach keeps customer data on the device.',
    'The comments identify the author by name.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW038').length, 0, text);
  }
});

test('relationship-scope transfers are review candidates without banning supported direct claims', () => {
  for (const text of [
    'The protected lane remains subject to the recorded causes.',
    'The new process is affected by the same delays.',
    'A future trial will be exposed to the observed constraint.'
  ]) {
    const matches = byRule(scanText(text), 'AAW040');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'The existing queue remains subject to weekend delays.',
    'The protected lane sends these cases to an analyst.',
    'The source states that both routes share the same constraint.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW040').length, 0, text);
  }
});

test('reader-coaching signposts are review candidates', () => {
  for (const text of [
    'This distinction matters when reading the totals.',
    'That scope matters for the decision.',
    'The survey leaves another question open.'
  ]) {
    const matches = byRule(scanText(text), 'AAW041');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'The distinction changes which requests qualify.',
    'This distinction matters in contract law because it changes who bears the loss.',
    'The survey did not ask why staff used a workaround.',
    'The trial covered two depots.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW041').length, 0, text);
  }
});

test('stacked limitation sentences require review but separate paragraphs do not', () => {
  const stacked = 'The logs do not record a cause. They cannot identify why this request was delayed.';
  const matches = byRule(scanText(stacked), 'AAW042');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].level, 'advisory');
  assert.equal(matches[0].confidence, 'heuristic');

  const triple = 'The logs do not record a cause. They cannot identify why this request was delayed. The audit does not isolate the cause.';
  const tripleMatches = byRule(scanText(triple), 'AAW042');
  assert.equal(tripleMatches.length, 1);
  assert.equal(tripleMatches[0].level, 'review');

  const separate = 'The logs do not record a cause.\n\nThe survey cannot identify why staff used a workaround.';
  assert.equal(byRule(scanText(separate), 'AAW042').length, 0);
  const distinct = 'The first route is not available after six. The second route does not accept cash.';
  assert.equal(byRule(scanText(distinct), 'AAW042').length, 0);
  for (const text of [
    'The trial did not measure retention. The survey did not measure satisfaction.',
    'The policy does not cover contractors. The exception does not apply to interns.',
    'The launch date is unknown. The audit date was not recorded.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW042').some((item) => item.level === 'review'), false, text);
  }
  assert.equal(byRule(scanText('The logs record elapsed time. The audit names three separate causes.'), 'AAW042').length, 0);
});

test('decision-basis and recommendation recaps require local repetition context', () => {
  const decision = 'The decision record says the measured reduction justified continued use. This was a decision to keep Relay where it had been tested.';
  assert.equal(byRule(scanText(decision), 'AAW043').length, 1);
  const basis = 'The decision record says the measured reduction was the basis for continued use. The stated basis for that decision was the measured outcome.';
  assert.equal(byRule(scanText(basis), 'AAW043').length, 1);
  const recommendation = 'I recommend a limited transition. This approach moves eligible exceptions to the proposed route.';
  assert.equal(byRule(scanText(recommendation), 'AAW044').length, 1);

  assert.equal(byRule(scanText('This was a decision to keep the office open during repairs.'), 'AAW043').length, 0);
  assert.equal(byRule(scanText('The stated basis for the dismissal was falsified data.'), 'AAW043').length, 0);
  assert.equal(byRule(scanText('This approach keeps customer data on the device.'), 'AAW044').length, 0);
});

test('whole-group retention claims are review candidates without catching named subgroups', () => {
  for (const text of [
    'The analysis preserved the results for all teams as assigned.',
    'Every assigned desk remained in the analysis.',
    'All participants were retained in the analysis.',
    'Three flagged cases remained in the analysis, so all 24 cases remained.',
    'All 24 assigned teams remained in the analysis.',
    'All of the assigned teams remained in the analysis.',
    'Every one of the assigned teams remained in the analysis.',
    'All assigned members remained in the analysis.'
  ]) {
    const matches = byRule(scanText(text), 'AAW045');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'The three named teams remained in the analysis.',
    'The analysis preserved results for the four desks with incomplete fields.',
    'All 24 cases remained open.',
    'All members stayed for dinner.',
    'Three flagged cases remained in the building, so all 24 cases remained.',
    'Three flagged cases remained in the analysis, so all 24 cases remained available for review.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW045').length, 0, text);
  }
});

test('bundled prior-measurement claims are review candidates', () => {
  for (const text of [
    'The next study adds two outcomes the earlier trial did not measure.',
    'The extension includes three new metrics that the first test never measured.',
    'The plan added 4 measures the prior analysis did not measure.',
    'The next test adds fuel use and workload, two outcomes the first trial did not measure.',
    'The next test adds fuel use and workload, both unmeasured in the first trial.',
    'The next test adds two previously unmeasured outcomes.'
  ]) {
    const matches = byRule(scanText(text), 'AAW046');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'The next study will measure fuel use and workload.',
    'The earlier trial did not measure fuel use.',
    'The extension adds an optional note.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW046').length, 0, text);
  }
});

test('future causal-proof wording is advisory while ordinary result descriptions remain unflagged', () => {
  for (const text of [
    'The results will show whether Relay reduces late departures.',
    'The next trial can determine whether the protocol causes fewer errors.',
    'The analysis will establish whether the route improves approval time.',
    'The study will determine the effect of Relay on delays.',
    'The study will establish the impact of Pulse on missed windows.',
    'The study will determine the cause of the delays.',
    'The trial will establish a causal link between Relay and delays.',
    'The study will prove that Relay led to fewer delays.',
    'The study will show whether Relay led to fewer delays.',
    'The study will demonstrate Relay reduces delays.',
    'The trial will prove Relay caused the drop.',
    'The study will demonstrate that Relay drove the reduction.',
    'The findings will show whether Relay reduces delays.',
    'The data will show whether Relay reduces delays.'
  ]) {
    const matches = byRule(scanText(text), 'AAW047');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'advisory', text);
  }
  for (const text of [
    'The next test will measure late departures.',
    'The results will report the daytime late-departure rate.',
    'The randomized design supports a causal conclusion for the completed trial.',
    'The results will show improved grammar.',
    'The analysis will show increased costs in July.',
    'The results will show lower prices in July.',
    'The study will show managers how to reduce approval time.',
    'The study will show whether managers know how to reduce approval time.',
    'The study will determine whether costs increased in July.',
    'The study will determine whether costs increased substantially.',
    'The analysis will show whether costs increased 10 percent.',
    'The analysis will show the effect on a separate chart.',
    'The analysis will show sharply increased costs.',
    'The study will prove this improved workflow.',
    'The study will determine costs increased substantially.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW047').length, 0, text);
  }

  for (const text of [
    'The study will show whether managers read the guide that reduces approval time.',
    'The study will show a chart where Relay reduces delays.',
    'The study will show the sentence Relay reduces delays.'
  ]) {
    const matches = byRule(scanText(text), 'AAW047');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'advisory', text);
  }

  for (const text of [
    'The study will demonstrate Relay substantially reduces delays.',
    'The trial will prove the revised protocol directly caused the drop.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW047').length, 0, text);
  }
});

test('restatement labels, bundled prior coverage, and promoted audit capabilities require review', () => {
  const restatement = 'The estimate was 4.2 points. In other words, it was 4.2 points.';
  assert.equal(byRule(scanText(restatement), 'AAW048').length, 1);

  for (const coverage of [
    'Those measures will cover delays, fuel use, and workload that the overnight trial did not cover.',
    'These measures add daytime evidence on three outcomes that the overnight trial did not cover.'
  ]) {
    assert.equal(byRule(scanText(coverage), 'AAW049').length, 1, coverage);
  }

  for (const text of [
    'Operations will have scan-level adherence records.',
    'The decision can rely on documented adherence.',
    'Auditing the recorded scans will establish completion consistency.',
    'Auditing every recorded scan allows Operations to verify completion.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW050').length, 1, text);
  }

  for (const text of [
    'The first trial measured delays. The next trial will measure delays, fuel use, and workload.',
    'This measure will cover fuel use that the prior trial did not cover.',
    'Retail Analytics can audit every recorded ShelfCheck scan.',
    'The record explicitly states that adherence was documented.',
    'Auditing every recorded scan does not establish adherence or completeness.',
    'Auditing every recorded scan doesn’t establish adherence or completeness.',
    'Reviewing compliance requirements is part of onboarding.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW049').length, 0, text);
    assert.equal(byRule(scanText(text), 'AAW050').length, 0, text);
  }
});

test('a repeated recommendation in one paragraph requires review', () => {
  const repeated = 'Operations should approve the 60-store trial. Run it as specified.';
  const matches = byRule(scanText(repeated), 'AAW051');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].level, 'review');

  for (const text of [
    'Operations should approve the 60-store trial. Retail Analytics will audit every recorded scan.',
    'Run the trial. Record labor minutes as a secondary outcome.',
    'The record says operations should run the trial.',
    'Run the trial. Stop if complaint rates rise.',
    'Approve the trial. Keep control stores on the current process.',
    'Deploy the patch. Run the test suite.',
    'Operations should approve the trial. Retail Analytics should run the audit.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW051').length, 0, text);
  }

  const crossParagraph = 'Operations should run the 60-store trial.\n\nThe pilot does not support deployment.\n\nOperations should authorize the eight-week trial.';
  assert.equal(byRule(scanText(crossParagraph), 'AAW051').length, 1);
});

test('schedule capability claims are review candidates', () => {
  for (const text of [
    'We can meet the target.',
    'We can hit the deadline.',
    'Those changes can support a June 15 release.',
    'The estimates can enable the planned launch.'
  ]) {
    const matches = byRule(scanText(text), 'AAW039');
    assert.equal(matches.length, 1, text);
    assert.equal(matches[0].level, 'review', text);
  }
  for (const text of [
    'We can meet on Tuesday.',
    'The target date is June 15.',
    'Engineering estimates eight business days.',
    'Those changes support a lower fee.'
  ]) {
    assert.equal(byRule(scanText(text), 'AAW039').length, 0, text);
  }
});

test('semantic review list keeps existing checks and appends relationship and synthesis checks', () => {
  const checks = scanText('The trial recorded 14 completed reviews.').semantic_checks_not_performed;
  assert.deepEqual(checks.slice(0, 7), [
    'factual_accuracy',
    'claim_support',
    'available_specificity',
    'reader_fit',
    'useful_structure',
    'naturalness',
    'tone'
  ]);
  assert.deepEqual(checks.slice(7), [
    'unsupported_relationships',
    'paragraph_function',
    'redundant_synthesis',
    'source_silence',
    'aggregate_category_overlap',
    'claim_evidence_claim_repetition',
    'duplicate_sentence_function',
    'reader_coaching',
    'relationship_scope_transfer',
    'subgroup_to_whole_scope',
    'prior_measurement_status',
    'future_causal_proof_capability',
    'coverage_status_by_outcome',
    'capability_promotion',
    'recommendation_repetition'
  ]);
});

test('one-item list uses the correct source offset after earlier prose', () => {
  const text = 'Context first.\n\n- Only one item\n\nClosing sentence.';
  const result = scanText(text);
  const match = byRule(result, 'AAW006')[0];
  assert.equal(match.location.start.offset, text.indexOf('- Only one item'));
  assert.equal(match.location.start.line, 3);
  assert.equal(match.match, '- Only one item');
});

test('nested list sibling counts are evaluated by indentation', () => {
  const oneOuter = scanText('- outer\n  - inner one\n  - inner two');
  assert.deepEqual(byRule(oneOuter, 'AAW006').map((item) => item.match), ['- outer']);

  const oneNested = scanText('- outer one\n  - nested only\n- outer two');
  const nested = byRule(oneNested, 'AAW006');
  assert.equal(nested.length, 1);
  assert.equal(nested[0].match, '- nested only');
  assert.equal(nested[0].location.start.column, 3);
});

test('list continuation lines do not split sibling items', () => {
  const result = scanText('- first\n  continuation\n- second');
  assert.equal(byRule(result, 'AAW006').length, 0);
});

test('CommonMark lazy list continuation keeps sibling items together', () => {
  const result = scanText('- first\nContinuation at column zero.\n- second');
  assert.equal(byRule(result, 'AAW006').length, 0);
});

test('blank plus prose separates otherwise similar list markers', () => {
  const result = scanText('- first\n\nParagraph.\n- second');
  assert.equal(byRule(result, 'AAW006').length, 2);
});

test('CRLF list matches exclude the carriage return', () => {
  const match = byRule(scanText('Intro\r\n- Only\r\nEnd'), 'AAW006')[0];
  assert.equal(match.match, '- Only');
  assert.equal(match.location.end.column, 7);
});

test('multi-item and parenthesized numbered lists are classified correctly', () => {
  assert.equal(byRule(scanText('- One\n- Two'), 'AAW006').length, 0);
  assert.equal(byRule(scanText('1) Only'), 'AAW006').length, 1);
  assert.equal(byRule(scanText('• Only'), 'AAW006').length, 1);
});

test('stacked short sentences produce one advisory group', () => {
  const result = scanText('It failed. We stopped. Logs remained.');
  assert.equal(byRule(result, 'AAW035').length, 1);
  assert.equal(result.summary.advisory, 1);
});

test('Markdown list and heading lines do not trigger rhythm findings', () => {
  assert.equal(byRule(scanText('- one\n- two\n- three'), 'AAW035').length, 0);
  assert.equal(byRule(scanText('# One\n## Two\n### Three'), 'AAW035').length, 0);
});

test('AAW030 remains the generic tool qualifier while AAW035 owns stacked rhythm', () => {
  const result = scanText('Advanced AI tools changed. It failed. We stopped. Logs remained.');
  assert.equal(byRule(result, 'AAW030').length, 1);
  assert.equal(byRule(result, 'AAW035').length, 1);
  assert.equal(byRule(result, 'AAW030')[0].rule, 'vocabulary.generic_tool_qualifier');
  assert.equal(byRule(result, 'AAW035')[0].rule, 'rhythm.stacked_short_sentences');
});

test('boundary prefixes are not included in matches or locations', () => {
  const residue = byRule(scanText('Text.\nOf course!'), 'AAW003')[0];
  assert.deepEqual(residue.location.start, { line: 2, column: 1, offset: 6 });
  assert.equal(residue.match, 'Of course!');

  const transition = byRule(scanText('Text. Moreover, continue.'), 'AAW011')[0];
  assert.equal(transition.location.start.offset, 'Text. '.length);
  assert.equal(transition.match, 'Moreover');
});

test('location units are declared and astral characters keep correct coordinates', () => {
  const result = scanText('🙂—');
  assert.deepEqual(result.location_units, {
    offset: 'utf16_code_unit_zero_based',
    line: 'one_based',
    column: 'unicode_code_point_one_based'
  });
  const match = byRule(result, 'AAW001')[0];
  assert.equal(match.location.start.offset, 2);
  assert.equal(match.location.start.column, 2);
});

test('empty input is a blocking finding', () => {
  const result = scanText(' \n ');
  assert.equal(byRule(result, 'AAW000').length, 1);
  assert.equal(result.summary.mechanical_pass, false);
});

test('CLI exit thresholds and deterministic JSON are stable', () => {
  const stdoutA = sink();
  const stderrA = sink();
  const codeA = runCli(['--stdin', '--format', 'json', '--fail-on', 'blocking'], {
    stdinText: 'Moreover, state the result.', stdout: stdoutA.stream, stderr: stderrA.stream
  });
  const stdoutB = sink();
  const stderrB = sink();
  const codeB = runCli(['--stdin', '--format', 'json', '--fail-on', 'blocking'], {
    stdinText: 'Moreover, state the result.', stdout: stdoutB.stream, stderr: stderrB.stream
  });
  assert.equal(codeA, 0);
  assert.equal(codeB, 0);
  assert.equal(stdoutA.read(), stdoutB.read());
  assert.equal(stderrA.read(), '');
  assert.equal(runCli(['--stdin', '--fail-on', 'review'], {
    stdinText: 'Moreover, state the result.', stdout: sink().stream, stderr: sink().stream
  }), 1);
  assert.equal(runCli(['--stdin', '--fail-on', 'never'], {
    stdinText: 'Move—now.', stdout: sink().stream, stderr: sink().stream
  }), 0);
});

test('file scans do not modify the source', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'anti-ai-scan-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const inputPath = path.join(directory, 'draft.md');
  const original = 'Move—now.';
  fs.writeFileSync(inputPath, original);
  const stdout = sink();
  const stderr = sink();
  assert.equal(runCli(['--input', inputPath, '--format', 'json'], {
    stdout: stdout.stream, stderr: stderr.stream
  }), 1);
  assert.equal(fs.readFileSync(inputPath, 'utf8'), original);
  assert.equal(JSON.parse(stdout.read()).source.label, 'draft.md');
});

test('invalid CLI input returns exit 2 without a stack trace', () => {
  const stdout = sink();
  const stderr = sink();
  assert.equal(runCli([], { stdout: stdout.stream, stderr: stderr.stream }), 2);
  assert.equal(stdout.read(), '');
  assert.match(stderr.read(), /^scan-writing: Missing --input or --stdin\./u);
});

test('missing option values return exit 2 with a precise diagnostic', () => {
  const stdout = sink();
  const stderr = sink();
  assert.equal(runCli(['--input', '--stdin'], { stdout: stdout.stream, stderr: stderr.stream }), 2);
  assert.equal(stdout.read(), '');
  assert.match(stderr.read(), /^scan-writing: --input requires a value\./u);
});

test('unexpected output failures return exit 3', () => {
  const stderr = sink();
  const code = runCli(['--stdin'], {
    stdinText: 'Plain result.',
    stdout: { write() { throw new Error('write failed'); } },
    stderr: stderr.stream
  });
  assert.equal(code, 3);
  assert.match(stderr.read(), /^scan-writing: write failed/u);
});

test('advisory-only results do not fail the review threshold', () => {
  assert.equal(runCli(['--stdin', '--fail-on', 'review'], {
    stdinText: 'It stopped. We paused. Logs remained.', stdout: sink().stream, stderr: sink().stream
  }), 0);
});

test('new exact candidate families are reported for review', () => {
  const text = 'As of my last update, this is not legal advice. At the end of the day, whether it’s email or a page, add tools, reports, and more.';
  const result = scanText(text);
  for (const ruleId of ['AAW018', 'AAW019', 'AAW021', 'AAW023', 'AAW025']) {
    assert.equal(byRule(result, ruleId).length, 1, ruleId);
  }
});

test('emoji bullet detection covers general pictographic markers', () => {
  for (const text of ['🎯 Goal', '➡️ Next', '📝 Note', '👉 Item']) {
    assert.equal(byRule(scanText(text), 'AAW027').length, 1, text);
  }
});
