#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const SCANNER_VERSION = '0.12.0';
export const SCHEMA_VERSION = '1.0';
export const RULESET_VERSION = '2026-07-19.10';

const SEMANTIC_CHECKS = [
  'factual_accuracy',
  'claim_support',
  'available_specificity',
  'reader_fit',
  'useful_structure',
  'naturalness',
  'tone',
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
];

const VOCABULARY = [
  'delve', 'tapestry', 'paradigm', 'nuanced', 'landscape', 'ecosystem', 'robust',
  'seamless', 'holistic', 'transformative', 'innovative', 'game-changer',
  'cutting-edge', 'revolutionary', 'groundbreaking', 'pioneering', 'trailblazing',
  'leverage', 'utilize', 'harness', 'empower', 'streamline', 'elevate', 'unleash',
  'supercharge', 'unlock', 'revolutionize', 'reimagine', 'redefine', 'optimize',
  'accelerate', 'synergize', 'democratize', 'crucial', 'pivotal', 'vital', 'essential',
  'unprecedented', 'unparalleled', 'mission-critical', 'visionary', 'disruptive',
  'state-of-the-art', 'dynamic', 'leading-edge', 'paradigm-shifting', 'mind-blowing',
  'jaw-dropping', 'commendable',
  'meticulous', 'meticulously', 'insightful', 'vibrant', 'immersive', 'captivate',
  'enduring', 'valuable', 'scalable', 'adaptive', 'effortless', 'data-driven', 'proactive',
  'transparent', 'intuitive', 'integrated', 'plug-and-play', 'turnkey',
  'future-proof', 'proprietary', 'predictive', 'cornerstone', 'pillar', 'testament',
  'backbone', 'interplay', 'synergy', 'realm', 'myriad'
];

const HELP = `Usage:
  node scripts/scan-writing.mjs --input <file> [options]
  node scripts/scan-writing.mjs --stdin [options]

Options:
  --input <file>              Read the candidate from a file. Use - for stdin.
  --stdin                     Read the candidate from stdin.
  --format <text|json>        Output format. Default: text.
  --fail-on <blocking|review|never>
                              Exit 1 at the selected finding level. Default: blocking.
  --include-code              Scan fenced and inline code instead of ignoring it.
  --version                   Print scanner version.
  --help                      Print this help.
`;

class CliUsageError extends Error {}

function requiredValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new CliUsageError(`${flag} requires a value.`);
  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskIgnoredRegions(text, includeCode) {
  if (includeCode) return text;
  // RegExp match indexes and String#slice use UTF-16 offsets. Keep the mask in
  // UTF-16 code units too so an astral character before a finding cannot shift
  // its reported offset.
  const chars = text.split('');
  let fence = null;
  let offset = 0;
  for (const line of text.split(/(?<=\n)/u)) {
    const content = line.replace(/[\r\n]+$/u, '');
    let opensFence = false;
    let closesFence = false;
    if (!fence) {
      const opener = content.match(/^ {0,3}(`{3,}|~{3,})/u);
      if (opener) {
        fence = { character: opener[1][0], length: opener[1].length };
        opensFence = true;
      }
    } else {
      const closer = content.match(/^ {0,3}(`+|~+)[ \t]*$/u);
      if (closer && closer[1][0] === fence.character && closer[1].length >= fence.length) {
        closesFence = true;
      }
    }

    if (fence || opensFence || closesFence) {
      for (let index = 0; index < line.length; index += 1) {
        if (line[index] !== '\n' && line[index] !== '\r') chars[offset + index] = ' ';
      }
      if (closesFence) fence = null;
    }
    offset += line.length;
  }

  const withoutFences = chars.join('');
  for (let index = 0; index < withoutFences.length; index += 1) {
    if (withoutFences[index] !== '`') continue;
    let runLength = 1;
    while (withoutFences[index + runLength] === '`') runLength += 1;
    let cursor = index + runLength;
    let closingOffset = -1;
    while (cursor < withoutFences.length) {
      if (withoutFences[cursor] !== '`') {
        cursor += 1;
        continue;
      }
      let closingLength = 1;
      while (withoutFences[cursor + closingLength] === '`') closingLength += 1;
      if (closingLength === runLength) {
        closingOffset = cursor;
        break;
      }
      cursor += closingLength;
    }
    if (closingOffset >= 0) {
      const end = closingOffset + runLength;
      for (let maskOffset = index; maskOffset < end; maskOffset += 1) {
        if (chars[maskOffset] !== '\n' && chars[maskOffset] !== '\r') chars[maskOffset] = ' ';
      }
      index = end - 1;
    } else {
      index += runLength - 1;
    }
  }
  return chars.join('');
}

function lineBounds(text, offset) {
  const start = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const newline = text.indexOf('\n', offset);
  const end = newline === -1 ? text.length : newline;
  return { start, end, text: text.slice(start, end) };
}

function location(text, offset, length) {
  const before = text.slice(0, offset);
  const line = (before.match(/\n/gu) || []).length + 1;
  const lineStart = before.lastIndexOf('\n') + 1;
  const column = [...text.slice(lineStart, offset)].length + 1;
  const endBefore = text.slice(0, offset + length);
  const endLine = (endBefore.match(/\n/gu) || []).length + 1;
  const endLineStart = endBefore.lastIndexOf('\n') + 1;
  const endColumn = [...text.slice(endLineStart, offset + length)].length + 1;
  return {
    start: { line, column, offset },
    end: { line: endLine, column: endColumn, offset: offset + length }
  };
}

function isQuoted(text, offset) {
  const bounds = lineBounds(text, offset);
  if (/^\s*>/u.test(bounds.text)) return true;
  const before = text.slice(0, offset);
  const after = text.slice(offset);
  const straightBefore = (before.match(/"/gu) || []).length;
  if (straightBefore % 2 === 1 && /"/u.test(after)) return true;
  const curlyOpen = before.lastIndexOf('“');
  const curlyClose = before.lastIndexOf('”');
  return curlyOpen > curlyClose && /”/u.test(after);
}

function finding(text, rule, level, message, suggestion, offset, match, contextText = text) {
  const quoted = isQuoted(contextText, offset);
  const effectiveLevel = quoted && level === 'blocking' ? 'review' : level;
  return {
    occurrence_id: `${rule.id}@${offset}`,
    rule_id: rule.id,
    rule: rule.name,
    level: effectiveLevel,
    confidence: rule.confidence || 'exact',
    message,
    location: location(text, offset, match.length),
    context: quoted ? 'quoted' : 'prose',
    match,
    excerpt: lineBounds(text, offset).text.trim(),
    suggestion
  };
}

function addRegexFindings(target, text, masked, spec) {
  const regex = new RegExp(spec.pattern.source, spec.pattern.flags.includes('g') ? spec.pattern.flags : `${spec.pattern.flags}g`);
  for (const match of masked.matchAll(regex)) {
    const value = spec.capture ? match[spec.capture] : match[0];
    if (!value?.trim()) continue;
    const relativeOffset = spec.capture ? match[0].indexOf(value) : 0;
    const offset = match.index + relativeOffset;
    target.push(finding(text, spec, spec.level, spec.message, spec.suggestion, offset, text.slice(offset, offset + value.length), masked));
  }
}

export function countWords(text) {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/u).filter((token) => (
    /[\p{L}\p{N}]/u.test(token)
    && !/^\d+[.)]$/u.test(token)
    && !/^\[[ xX-]\]$/u.test(token)
  )).length;
}

const FUTURE_CAUSAL_HEAD = /\b(?:the\s+)?(?:(?:new|next|future|planned|proposed)\s+)?(?:analys(?:is|es)|data|evaluations?|experiments?|extensions?|findings?|investigations?|pilots?|results?|stud(?:y|ies)|tests?|trials?)\s+(?:can|should|will)\s+(?:confirm|demonstrate|determine|establish|prove|reveal|show)\b/giu;
const STRONG_CAUSAL_TAILS = [
  /\bcauses?\s+of\b/iu,
  /\bcausal\s+(?:effect|impact|link|relationship)\b/iu,
  /\b(?:effect|impact)\s+of\b[^.!?\n]{1,80}\bon\b/iu,
  /\b(?:attributable\s+to|caused\s+by|responsible\s+for)\b/iu
];
const CAUSAL_CLAUSE_LINK = /\b(?:led\s+to|resulted\s+in|drove)\b/iu;
const NON_OBJECT_START = /^(?:after|again|at|before|between|by|during|eight|eleven|five|four|from|further|half|in|less|many|more|nine|on|one|overall|over|seven|several|six|substantially|ten|three|to|twelve|twice|two)\b/iu;
const FINITE_CAUSAL_PREDICATE = /\b(?:affects|affected|causes|caused|improves|improved|increases|increased|lowers|lowered|raises|raised|reduces|reduced)\s+(?:a\s+|an\s+|the\s+|its\s+|our\s+|their\s+)?([^\s.!?,;:]+)/giu;
const MODAL_CAUSAL_PREDICATE = /\b(?:can|could|may|might|should|will|would)\s+(?:affect|cause|improve|increase|lower|raise|reduce)\s+(?:a\s+|an\s+|the\s+|its\s+|our\s+|their\s+)?([^\s.!?,;:]+)/giu;
const PASSIVE_CAUSAL_PREDICATE = /\b(?:is|are|was|were)\s+(?:directly\s+)?(?:affected|caused|improved|increased|lowered|raised|reduced)\s+by\b/iu;
const BARE_SUBJECT_STOP = /^(?:a|an|eight|eleven|five|four|half|his|its|many|more|much|my|nine|one|our|seven|several|six|ten|that|the|their|these|this|three|twelve|two|very|your|\d[\d,.]*)$/iu;

function hasDirectObjectCandidate(clause, pattern) {
  for (const match of clause.matchAll(pattern)) {
    const token = match[1];
    if (!token || /^\d/u.test(token) || /ly$/iu.test(token) || NON_OBJECT_START.test(token)) continue;
    return true;
  }
  return false;
}

function hasFutureCausalTail(tail) {
  if (STRONG_CAUSAL_TAILS.some((pattern) => pattern.test(tail))) return true;
  const connector = tail.match(/\b(?:whether|if|that)\b/iu);
  if (connector) {
    const clause = tail.slice(connector.index + connector[0].length);
    if (CAUSAL_CLAUSE_LINK.test(clause)
      || PASSIVE_CAUSAL_PREDICATE.test(clause)
      || hasDirectObjectCandidate(clause, FINITE_CAUSAL_PREDICATE)
      || hasDirectObjectCandidate(clause, MODAL_CAUSAL_PREDICATE)) return true;
  }
  for (const match of tail.matchAll(FINITE_CAUSAL_PREDICATE)) {
    const prefix = tail.slice(0, match.index).trim();
    const subjectTokens = prefix.match(/[\p{L}\p{N}'’_-]+/gu) || [];
    const subject = subjectTokens.at(-1) || '';
    const object = match[1] || '';
    if (subjectTokens.length === 0 || subjectTokens.length > 12) continue;
    if (/ly$/iu.test(subject) || /['’]s$/iu.test(subject) || BARE_SUBJECT_STOP.test(subject)) continue;
    if (/^\d/u.test(object) || /ly$/iu.test(object) || NON_OBJECT_START.test(object)) continue;
    return true;
  }
  return false;
}

function sentenceRecords(text, masked) {
  const records = [];
  const regex = /[^.!?\n]+[.!?]+|[^.!?\n]+$/gu;
  for (const match of masked.matchAll(regex)) {
    const visible = match[0].trim();
    if (!visible) continue;
    if (/^(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+|[•◦▪▫‣⁃]\s+)/u.test(visible)) continue;
    const leading = match[0].length - match[0].trimStart().length;
    const offset = match.index + leading;
    const raw = text.slice(offset, offset + visible.length);
    records.push({
      offset,
      endOffset: offset + visible.length,
      text: raw,
      words: visible.replace(/[.!?]+$/u, '').trim().split(/\s+/u).filter(Boolean)
    });
  }
  return records;
}

const LIMITATION_TOPICS = [
  ['cause_or_reason', /\b(?:attribut\w*|caus\w*|came\s+from|contribution|effect|isolate|reason|why)\b/iu],
  ['decision_basis', /\b(?:basis|considered|decision|evidence\s+(?:used|relied)|relied|weighed)\b/iu],
  ['group_overlap', /\b(?:both|cross-tab\w*|link\w*|match\w*|overlap|same\s+(?:people|respondents|users))\b/iu],
  ['measurement', /\b(?:measure\w*|metric|outcome|record\w*|result)\b/iu],
  ['policy_or_exception', /\b(?:exception|policy|reimburse\w*|rule)\b/iu],
  ['schedule', /\b(?:achiev\w*|deadline|date|feasible|launch|release|schedul\w*|sequence|start\s+date|target|timing)\b/iu],
  ['scope_or_generalization', /\b(?:all|every|higher\s+volume|longer\s+period|other\s+(?:assigned|cases|groups|teams)|outside|whole)\b/iu]
];

function limitationTopics(sentence) {
  return LIMITATION_TOPICS.filter(([, pattern]) => pattern.test(sentence)).map(([name]) => name);
}

export function scanText(text, options = {}) {
  const includeCode = Boolean(options.includeCode);
  const sourceKind = options.sourceKind || 'text';
  const sourceLabel = options.sourceLabel || sourceKind;
  const masked = maskIgnoredRegions(text, includeCode);
  const findings = [];

  if (!text.trim()) {
    findings.push(finding(text, { id: 'AAW000', name: 'input.empty' }, 'blocking', 'The candidate is empty.', 'Provide the complete candidate.', 0, '', masked));
  }

  const specs = [
    {
      id: 'AAW001', name: 'punctuation.em_dash', level: 'blocking', pattern: /—/gu,
      message: 'Em dash found.', suggestion: 'Choose punctuation that matches the sentence.'
    },
    {
      id: 'AAW002', name: 'punctuation.stacked_exclamation', level: 'blocking', pattern: /!{2,}/gu,
      message: 'Stacked exclamation marks found.', suggestion: 'Use one mark or rewrite the sentence.'
    },
    {
      id: 'AAW003', name: 'chatbot.residue', level: 'blocking',
      pattern: /(?:^|\n)[ \t]*((?:Of course!|Certainly!|Absolutely\.?|Great question!|You['’]re absolutely right!|That['’]s a sharp point\.?|You['’]re right to push back\.?|I hope this helps\.?|Happy to help\.?))[ \t]*(?=\r?\n|$)/gimu,
      capture: 1,
      message: 'Standalone chatbot residue found.', suggestion: 'Delete it from the finished prose.'
    },
    {
      id: 'AAW010', name: 'authority.unnamed', level: 'review',
      pattern: /\b(?:research shows|studies (?:show|suggest)|experts agree|industry reports suggest|observers have (?:said|noted|cited))\b/giu,
      message: 'Unnamed authority phrase found.', suggestion: 'Name the source or state the claim directly.'
    },
    {
      id: 'AAW011', name: 'transition.filler', level: 'review',
      pattern: /(?:^|[.!?]\s+|\n)[ \t]*((?:Furthermore|Moreover|Additionally|Notably|Importantly|That said|That being said|With that in mind|Moving forward|Building on this|Taking this further|On top of that))\b/gimu,
      capture: 1,
      message: 'Filler transition found.', suggestion: 'Use a precise connector or start the point directly.'
    },
    {
      id: 'AAW012', name: 'contrast.false_candidate', level: 'review', confidence: 'candidate',
      pattern: /\b(?:not|isn['’]t|aren['’]t|wasn['’]t|weren['’]t|doesn['’]t|didn['’]t|can['’]t|won['’]t)\b[^.!?\n]{0,100}\b(?:but|instead|rather)\b[^.!?\n]{1,120}|\b(?:isn['’]t|is not|wasn['’]t|was not)\s+about\b[^.!?]{0,100}[.!?]\s*(?:It|This|The\s+\w+)\s+(?:is|was)\b|\b(?:the\s+)?(?:goal|point|value|benefit)\s+is\s+not\s+(?:just|simply|only)\b[^.!?\n]{1,100}[.;]\s*(?:it|this)\s+(?:is|means|helps|allows|gives)\b|\b(?:This|That)\s+(?:means|is)\s+more\s+than\b[^.!?\n]+/giu,
      message: 'Possible rejection-and-reframe pattern found.', suggestion: 'Keep only the direct claim unless this corrects a specific fact.'
    },
    {
      id: 'AAW013', name: 'analogy.setup', level: 'review', confidence: 'candidate',
      pattern: /\b(?:think of it as|imagine|picture|it['’]s like|it is like|a roadmap for|a lens for|the engine of|a bridge between|the glue that)\b/giu,
      message: 'Analogy setup found.', suggestion: 'Keep it only if it is shorter and clearer than literal explanation.'
    },
    {
      id: 'AAW014', name: 'punctuation.ellipsis', level: 'review', pattern: /\.{3}|…/gu,
      message: 'Ellipsis found.', suggestion: 'Keep only for a real omission from quoted source material.'
    },
    {
      id: 'AAW015', name: 'formula.packaged_verdict', level: 'review', confidence: 'candidate',
      pattern: /\b(?:the\s+)?(?:gain|effect|benefit|answer|conclusion|lesson|takeaway)\s+(?:is|remains)\s+(?:conditional|clear|simple|straightforward)|\b(?:the\s+)?(?:sensible|defensible|cautious|careful|fairest)\s+(?:answer|conclusion)\b/giu,
      message: 'Packaged verdict phrase found.', suggestion: 'State the actual conditions or conclusion directly.'
    },
    {
      id: 'AAW016', name: 'claim.generic_saved_time', level: 'review', confidence: 'candidate',
      pattern: /\b(?:free|frees|freeing|leave|leaves|leaving)\s+(?:up\s+)?(?:people\s+)?(?:more\s+)?time\s+for\s+(?:judgment|creativity|coordination|customer work|higher-value work)|\bfree\s+people\s+to\s+focus\s+on\b/giu,
      message: 'Generic saved-time reallocation claim found.', suggestion: 'Name an observable outcome or omit the assumed reallocation.'
    },
    {
      id: 'AAW018', name: 'disclaimer.stale_access', level: 'review',
      pattern: /\b(?:As of my last update|Based on available information|I (?:do not|don['’]t) have real-time access|Please verify this (?:with|against) current sources)\b/giu,
      message: 'Stale-access disclaimer found.', suggestion: 'Verify the current fact or name the exact unknown.'
    },
    {
      id: 'AAW019', name: 'disclaimer.generic_liability', level: 'review', confidence: 'candidate',
      pattern: /\bthis is not (?:financial|medical|legal) advice\b/giu,
      message: 'Generic liability disclaimer found.', suggestion: 'Keep only when the actual context requires it.'
    },
    {
      id: 'AAW021', name: 'phrase.importance_or_insight', level: 'review', confidence: 'candidate',
      pattern: /\b(?:It['’]s worth noting|It is worth noting|Here['’]s why (?:that )?matters|At the end of the day|The bottom line is|The truth is|In essence|At its core|It goes without saying|Needless to say|Make no mistake)\b/giu,
      message: 'Importance or insight announcement found.', suggestion: 'State the fact, consequence, or conclusion directly.'
    },
    {
      id: 'AAW022', name: 'emotion.borrowed_reaction', level: 'review', confidence: 'candidate',
      pattern: /\b(?:I was shocked|This blew my mind|I couldn['’]t believe it)\b/giu,
      message: 'Borrowed-reaction phrase found.', suggestion: 'Keep only when it reports a real reaction earned by the fact.'
    },
    {
      id: 'AAW023', name: 'list.and_more', level: 'review', confidence: 'candidate',
      pattern: /(?:,|;)\s*and more\b/giu,
      message: 'Open-ended list ending found.', suggestion: 'Name the items or end the list with the last named item.'
    },
    {
      id: 'AAW024', name: 'range.hyphen_numeric', level: 'review', confidence: 'candidate',
      pattern: /\b(?:pages?|pp\.?)\s+\d+\s*-\s*\d+\b|\b\d+\s*-\s*\d+\s+(?:pages?|years?|months?|days?|hours?|minutes?|percent|%)\b/giu,
      message: 'A hyphen may be standing in for an en dash in a numerical range.', suggestion: 'Use an en dash when the numbers are endpoints of a real range.'
    },
    {
      id: 'AAW025', name: 'formula.two_item_filler', level: 'review', confidence: 'candidate',
      pattern: /\bWhether it['’]s\b[^,.!?\n]{1,80}\bor\b[^,.!?\n]{1,80}[,.]/giu,
      message: 'Two-item filler setup found.', suggestion: 'Name the shared requirement directly.'
    },
    {
      id: 'AAW026', name: 'heading.placeholder_or_reframe', level: 'review', confidence: 'candidate',
      pattern: /(?:^|\n)[ \t]*(?:#{1,6}[ \t]+)?((?:Challenges and Opportunities|Future Prospects|Looking Ahead|Not [^\n.!?]{1,60}\.\s*[^\n.!?]{1,60}\.|The missing ingredient\.?))[ \t]*(?=\r?\n|$)/gimu,
      capture: 1,
      message: 'Placeholder or reframe heading found.', suggestion: 'Use a direct subject heading only when navigation helps.'
    },
    {
      id: 'AAW027', name: 'format.emoji_bullet', level: 'review', confidence: 'candidate',
      pattern: /(?:^|\n)[ \t]*(\p{Extended_Pictographic}(?:\uFE0F)?)(?=[ \t]+)/gmu,
      capture: 1,
      message: 'Emoji bullet candidate found.', suggestion: 'Use ordinary prose or a standard list unless the requested style calls for emoji.'
    },
    {
      id: 'AAW028', name: 'claim.generic_outcome', level: 'review', confidence: 'candidate',
      pattern: /\b(?:deliver(?:s|ed|ing)?|produc(?:e|es|ed|ing)|drive|drives|drove|driven|driving|creat(?:e|es|ed|ing)|generat(?:e|es|ed|ing)|yield(?:s|ed|ing)?|achiev(?:e|es|ed|ing)|mak(?:e|es|ing)|made|lead(?:s|ing)?\s+to|led\s+to)\s+(?:meaningful|significant|major|better|stronger|real|tangible|measurable|lasting|substantial|fundamental|improved|positive)\s+(?:results|outcomes|impact|value|improvements|gains|benefits|change|transformation)\b/giu,
      message: 'Generic outcome claim found.',
      suggestion: 'Name the supplied outcome or remove the empty modifier; do not invent a detail.'
    },
    {
      id: 'AAW029', name: 'claim.generic_level', level: 'review', confidence: 'candidate',
      pattern: /\b(?:reach|reaches|reached|reaching|achieve|achieves|achieved|achieving)\s+(?:a\s+)?(?:new|higher|greater|next)\s+levels?\s+of\s+(?:productivity|performance|impact|value|success|efficiency)\b/giu,
      message: 'Generic level claim found.', suggestion: 'State the supplied change directly or remove the inflated level phrase.'
    },
    {
      id: 'AAW030', name: 'vocabulary.generic_tool_qualifier', level: 'review', confidence: 'candidate',
      pattern: /\b(?:advanced|latest|current)\s+(?:AI\s+)?(?:tools?|solutions?|technology|software)\b/giu,
      message: 'Unspecified freshness or prestige label found.', suggestion: 'Name the supplied version, date, or comparison, or remove the qualifier.'
    },
    {
      id: 'AAW031', name: 'phrase.generic_ai_change', level: 'review', confidence: 'candidate',
      pattern: /\b(?:(?:AI|artificial intelligence)(?:\s+tools?)?|the technology)\s+(?:continues?\s+to\s+)?(?:evolv(?:e|es|ing)|develop(?:s|ing)?|advanc(?:e|es|ing)|chang(?:e|es|ing))(?:\s+(?:quickly|rapidly|at a rapid pace))?\b/giu,
      message: 'Generic technology-change phrase found.', suggestion: 'Name the relevant supplied change or remove the clause.'
    },
    {
      id: 'AAW032', name: 'claim.generic_possessive_outcome', level: 'review', confidence: 'candidate',
      pattern: /\bimprov(?:e|es|ed|ing)\s+(?:their|our|your|its)\s+(?:results|outcomes|impact|value|performance)\b/giu,
      message: 'Generic possessive outcome claim found.', suggestion: 'Name the supplied result or remove the abstract outcome.'
    },
    {
      id: 'AAW033', name: 'claim.unsupported_comparative', level: 'review', confidence: 'candidate',
      pattern: /\b(?:AI|artificial intelligence|AI tools?)\s+(?:is|are)\s+most\s+likely\s+to\s+(?:help|benefit|improve)\b/giu,
      message: 'Unsupported comparative likelihood candidate found.', suggestion: 'Use a narrower possibility or name the evidence comparing alternatives.'
    },
    {
      id: 'AAW036', name: 'signpost.packaged_evidence_conclusion', level: 'review', confidence: 'candidate',
      pattern: /(?:^|[.!?]\s+|\n)[ \t]*((?:What\s+the\s+(?:data|evidence|figures|numbers|record)\s+(?:show|shows|establish|establishes|prove|proves)|The\s+(?:evidence|data|record)\s+(?:support(?:s)?|point(?:s)?\s+to)\s+a\s+(?:restrained|cautious|careful|clear|simple|narrow|straightforward)\s+(?:conclusion|answer|finding)|The\s+(?:trial|test|study|evidence|data|record)\s+supports\s+a\s+(?:causal|supported|limited|narrow)\s+(?:claim|conclusion|finding)(?=(?:\s+(?:within|for)\s+(?:its|the)\s+(?:measured|studied|tested)\s+scope)?[.!?])|The\s+(?:plan|decision|choice)\s+(?:tracks|follows)\s+the\s+(?:clearest|strongest|main|key)\s+(?:findings|evidence|signals)))\b/gimu,
      capture: 1,
      message: 'Packaged evidence or conclusion signpost found.',
      suggestion: 'State the supported finding or decision directly, and verify any relationship the signpost implies.'
    },
    {
      id: 'AAW037', name: 'claim.aggregate_group_boundary', level: 'review', confidence: 'candidate',
      pattern: /\b((?:another|an\s+additional|the\s+other|the\s+remaining)\s+\d[\d,]*(?:\.\d+)?%?(?:(?:\s+of)?\s+(?:accounts?|customers?|employees?|participants?|people|respondents?|staff(?:\s+members?)?|students?|teams?|users?)|\s+(?:chose|preferred|reported|said|selected|used)))\b/giu,
      capture: 1,
      message: 'Count transition may imply that aggregate categories are disjoint.',
      suggestion: 'Use this grouping only when the source proves the categories are disjoint; otherwise state the second count without boundary language and name unknown overlap when relevant.'
    },
    {
      id: 'AAW038', name: 'synthesis.recap_label', level: 'review', confidence: 'candidate',
      pattern: /\b((?:(?:this|that)\s+(?:estimate|finding|result|figure|comparison|statement)\s+(?:is|shows|confirms|establishes|supports)\b|(?:this|that)\s+is\s+(?:a|the)\s+(?:causal|supported|primary|main|key)\s+(?:claim|conclusion|finding|result)\b|(?:taken\s+together|together),\s+(?:they|(?:these|those)(?:\s+(?:conditions|controls|data|design\s+(?:choices|features)|facts|features|figures|findings|records|results|sources))?|the\s+(?:conditions|controls|data|design\s+(?:choices|features)|facts|features|figures|findings|records|results|sources))\s+(?:show|indicate|suggest|establish|support|point\s+to)\b|(?:the|these|those)\s+(?:comments|examples)\s+(?:identify|show|illustrate)\s+(?:a|one|two|three)\b))\b/giu,
      capture: 1,
      message: 'Recap label or packaged synthesis candidate found.',
      suggestion: 'Delete it if it only labels or repackages the preceding evidence; otherwise keep only the new supported inference.'
    },
    {
      id: 'AAW039', name: 'claim.schedule_capability', level: 'review', confidence: 'candidate',
      pattern: /\b((?:we\s+can\s+(?:meet|hit|make)\s+(?:the\s+)?(?:deadline|target|launch|release|date)|(?:these|those|the)\s+(?:changes|durations|estimates|steps|timelines?)\s+can\s+(?:enable|meet|support)[^\n.!?]{0,40}\b(?:deadline|target|launch|release|date)))\b/giu,
      capture: 1,
      message: 'Schedule-capability claim requires a supplied timing baseline and dependencies.',
      suggestion: 'Keep the claim only when the source establishes the start date, duration, sequence, and required dependencies; otherwise state the supplied estimate and deadline separately.'
    },
    {
      id: 'AAW040', name: 'claim.relationship_scope_transfer', level: 'review', confidence: 'candidate',
      pattern: /\b((?:the\s+)?(?:new|next|protected|proposed|revised|future)\s+(?:lane|process|program|route|system|test|trial|workflow)\s+(?:also\s+)?(?:remains|is|will\s+be)\s+(?:affected\s+by|exposed\s+to|subject\s+to)\s+(?:the\s+)?(?:same|recorded|observed|existing|identified)\b)/giu,
      capture: 1,
      message: 'A cause or constraint may have been transferred to a new scope.',
      suggestion: 'Verify that the source applies this cause or constraint to the named new process, group, period, or location; otherwise remove the transfer.'
    },
    {
      id: 'AAW041', name: 'signpost.reader_coaching', level: 'review', confidence: 'candidate',
      pattern: /\b((?:(?:this|that)\s+(?:distinction|scope|difference|limit|limitation)\s+matters(?:\s+(?:when\s+(?:assessing|comparing|interpreting|reading|reviewing)\b|for\s+(?:the|this)\s+(?:analysis|assessment|decision|interpretation)\b)|(?=[.!?]))|the\s+(?:survey|study|trial|test|record|report|evidence|data)\s+leaves\s+(?:another|a|the)\s+question\s+open\b))\b/giu,
      capture: 1,
      message: 'Reader-coaching signpost found.',
      suggestion: 'Delete the signpost and state the concrete limit or consequence once.'
    },
    {
      id: 'AAW043', name: 'repetition.decision_basis_recap', level: 'review', confidence: 'candidate',
      pattern: /(?:\b(?:decision|choice)\s+record\b[^.!?]{0,260}\b(?:bas(?:e|ed|is)|justif(?:y|ied))\b[^.!?]*[.!?]\s+)((?:(?:this|that)\s+was\s+a\s+(?:decision|choice)\s+to|the\s+stated\s+basis\s+for\s+(?:that|the))[^.!?]*)/gimu,
      capture: 1,
      message: 'Decision basis may be repeated after the source sentence already states it.',
      suggestion: 'Keep the decision, basis, and scope once. Delete the recap unless it adds a new supported consequence.'
    },
    {
      id: 'AAW044', name: 'repetition.recommendation_recap', level: 'review', confidence: 'candidate',
      pattern: /(?:^|\n[ \t]*\n)(?=[^\n]{0,500}\b(?:I\s+recommend|recommend(?:s|ed|ing|ation)?|we\s+should|should)\b)[^\n.!?]*[.!?]\s+((?:this|that)\s+approach\s+(?:keeps|moves|places|protects|retains|routes|uses)\b[^.!?]*)/gimu,
      capture: 1,
      message: 'Recommendation may be restated in the next sentence.',
      suggestion: 'Put the route, exception, or action in the recommendation once, then continue to new evidence or action.'
    },
    {
      id: 'AAW045', name: 'claim.subgroup_to_whole_scope', level: 'review', confidence: 'candidate',
      pattern: /\b((?:preserv(?:e|es|ed|ing)|retain(?:s|ed|ing)?|keep(?:s|ing)?)\s+(?:the\s+)?(?:analysis|outcomes?|rates?|results?)\s+for\s+(?:(?:all(?:\s+\d[\d,]*)?(?:\s+(?:of\s+)?the)?|every(?:\s+one\s+of\s+the)?)\s+(?:assigned\s+)?(?:accounts?|cases?|desks?|employees?|groups?|members?|observations?|participants?|people|persons?|records?|respondents?|staff(?:\s+members?)?|stores?|teams?|users?|workers?))(?:\s+as\s+assigned)?|(?:(?:all(?:\s+\d[\d,]*)?(?:\s+(?:of\s+)?the)?|every(?:\s+one\s+of\s+the)?)\s+(?:assigned\s+)?(?:accounts?|cases?|desks?|employees?|groups?|members?|observations?|participants?|people|persons?|records?|respondents?|staff(?:\s+members?)?|stores?|teams?|users?|workers?))\s+(?:remained|stayed|were\s+(?:kept|retained))\s+in\s+(?:the\s+)?analysis|(?:(?:\d[\d,]*|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:flagged|named)|the\s+(?:flagged|named))\s+(?:accounts?|cases?|desks?|employees?|groups?|members?|observations?|participants?|people|persons?|records?|respondents?|staff(?:\s+members?)?|stores?|teams?|users?|workers?)\s+(?:remained|stayed|were\s+(?:kept|retained))\s+in\s+(?:the\s+)?analysis[^.!?\n]{0,80}\b(?:so|therefore|thus|which\s+(?:means|shows)(?:\s+that)?)\s+(?:(?:all(?:\s+\d[\d,]*)?(?:\s+(?:of\s+)?the)?|every(?:\s+one\s+of\s+the)?)\s+(?:assigned\s+)?(?:accounts?|cases?|desks?|employees?|groups?|members?|observations?|participants?|people|persons?|records?|respondents?|staff(?:\s+members?)?|stores?|teams?|users?|workers?))\s+(?:remained|stayed|were\s+(?:kept|retained))(?=\s*(?:[.!?]|$)))\b/giu,
      capture: 1,
      message: 'Whole-group retention or analysis claim requires explicit whole-group support.',
      suggestion: 'Keep the all/every claim only when the source names the whole group; a retained subgroup does not establish retention of everyone assigned.'
    },
    {
      id: 'AAW046', name: 'claim.prior_measurement_status', level: 'review', confidence: 'candidate',
      pattern: /\b((?:add(?:s|ed|ing)?|include(?:s|d|ing)?)[^\n.!?]{0,120}\b(?:(?:two|three|four|several|multiple|\d+)\s+(?:(?:new\s+)?(?:measures?|metrics?|outcomes?)\s+(?:that\s+)?(?:the\s+)?(?:(?:earlier|first|overnight|previous|prior)\s+)?(?:analysis|record|study|test|trial)\s+(?:did\s+not|didn['’]t|never)\s+measur(?:e|ed)|(?:previously\s+)?unmeasured\s+(?:measures?|metrics?|outcomes?))|both\s+(?:previously\s+)?unmeasured(?:\s+(?:in|by)\s+(?:the\s+)?(?:(?:earlier|first|overnight|previous|prior)\s+)?(?:analysis|record|study|test|trial))?))\b/giu,
      capture: 1,
      message: 'Bundled prior-measurement claim may extend beyond the outcomes explicitly named by the source.',
      suggestion: 'Verify prior measurement status outcome by outcome. A future measurement list does not prove that every listed outcome was previously unmeasured.'
    },
    {
      id: 'AAW048', name: 'signpost.restatement_label', level: 'review', confidence: 'candidate',
      pattern: /(?:^|[.!?]\s+|\n)[ \t]*(In\s+other\s+words)\b/gimu,
      capture: 1,
      message: 'Restatement label found.',
      suggestion: 'Keep the clearer formulation and delete the duplicate. Allow review only when a necessary technical statement and a reader-specific translation both have distinct functions.'
    },
    {
      id: 'AAW049', name: 'claim.bundled_prior_coverage', level: 'review', confidence: 'candidate',
      pattern: /\b((?:(?:these|those|the)\s+)?(?:measures|metrics|outcomes)\s+(?=[^.!?\n]{0,180}\b(?:(?:two|three|four|several|multiple|\d+)\s+(?:measures?|metrics?|outcomes?)|[^.!?\n]{0,100},[^.!?\n]{0,100}\b(?:and|or)\b))(?:(?:(?:can|will|would)\s+)?(?:assess(?:es)?|cover(?:s)?|include(?:s)?|measure(?:s)?|observe(?:s)?|record(?:s)?|report(?:s)?|track(?:s)?)|add(?:s|ed|ing)?\s+[^.!?\n]{0,80}\b(?:coverage|evidence|information|results?)\s+(?:about|for|on))[^.!?\n]{0,180}\b(?:that|which)\s+(?:the\s+)?(?:(?:earlier|first|overnight|previous|prior)\s+)?(?:analysis|pilot|record|study|test|trial)\s+(?:did\s+not|didn['’]t|never)\s+(?:assess|cover|include|measure|observe|record|report|track))\b/giu,
      capture: 1,
      message: 'A bundled claim may assign one prior coverage status to outcomes with different source histories.',
      suggestion: 'Check each named outcome separately against the source. State a prior omission only for an outcome whose omission is explicit.'
    },
    {
      id: 'AAW050', name: 'claim.capability_promotion', level: 'review', confidence: 'candidate',
      pattern: /\b((?:(?:scan-level|system-level|recorded)\s+)?adherence\s+(?:data|records?)|documented\s+(?:adherence|compliance|completion)|(?:audit(?:ing)?|inspect(?:ing|ion)?|review(?:ing)?)\b(?![^.!?\n]{0,120}\b(?:(?:does|do|did|can|could|will|would)\s+not|cannot|(?:can|could|did|does|do|will|would)n['’]t|won['’]t)\b)[^.!?\n]{0,120}\b(?:(?:allow(?:s|ed|ing)?\b[^.!?\n]{0,30}\b(?:check|verify)|check(?:s|ed|ing)?|confirm(?:s|ed|ing)?|ensure(?:s|d|ing)?|establish(?:es|ed|ing)?|provid(?:e|es|ed|ing)|prov(?:e|es|ed|ing)|show(?:s|ed|ing)?|verif(?:y|ies|ied|ying))\b[^.!?\n]{0,80}\b(?:adherence|compliance|complet(?:e(?:d|ness)?|ion)|consisten(?:cy|t|tly)|missing\s+(?:events?|records?|scans?))))\b/giu,
      capture: 1,
      message: 'A record or audit capability may have been promoted into proof of adherence, completeness, or missing events.',
      suggestion: 'Keep the source capability at one hop. Auditable recorded events do not by themselves establish unrecorded events, completeness, or compliance.'
    }
  ];

  for (const spec of specs) addRegexFindings(findings, text, masked, spec);

  for (const head of masked.matchAll(FUTURE_CAUSAL_HEAD)) {
    const tailStart = head.index + head[0].length;
    const boundary = masked.slice(tailStart).search(/[.!?\n]/u);
    const sentenceEnd = boundary >= 0 ? tailStart + boundary + 1 : masked.length;
    const tail = masked.slice(tailStart, sentenceEnd);
    if (!hasFutureCausalTail(tail)) continue;
    findings.push(finding(
      text,
      { id: 'AAW047', name: 'claim.future_causal_proof_capability', confidence: 'candidate' },
      'advisory',
      'Future test or result may be given causal proof capacity.',
      'Inspect the complete claim against the supplied assignment and comparison design. This wording heuristic is not a semantic verdict.',
      head.index,
      text.slice(head.index, sentenceEnd),
      masked
    ));
  }

  const reasoningMatches = [...masked.matchAll(/\breasoning\b/giu)];
  if (reasoningMatches.length >= 3) {
    const match = reasoningMatches[2];
    findings.push(finding(
      text,
      { id: 'AAW034', name: 'transition.repeated_reasoning', confidence: 'candidate' },
      'review',
      'Repeated epistemic signposting found.',
      'State the evidence distinction in the claims instead of repeating the transition.',
      match.index,
      text.slice(match.index, match.index + match[0].length),
      masked
    ));
  }

  const vocabPattern = new RegExp(`\\b(?:${VOCABULARY.map(escapeRegex).join('|')})\\b`, 'giu');
  addRegexFindings(findings, text, masked, {
    id: 'AAW020', name: 'vocabulary.prohibited_candidate', level: 'review', confidence: 'candidate',
    pattern: vocabPattern,
    message: 'Prohibited-vocabulary candidate found.',
    suggestion: 'Replace it with the concrete fact or action unless it is quoted or analyzed.'
  });

  const firstProse = masked.search(/\S/u);
  if (firstProse >= 0) {
    const opening = masked.slice(firstProse).match(/^(?:In today['’]s\b[^.!?\n]*|In the world of\b[^.!?\n]*|As (?:AI|artificial intelligence) (?:continues to )?(?:evolv(?:e|es|ed|ing)|develop(?:s|ed|ing)?|advanc(?:e|es|ed|ing)|chang(?:e|es|ed|ing))(?: quickly| rapidly)?\b[^.!?\n]*|Let['’]s (?:dive in|explore|unpack)\b[^.!?\n]*|Here['’]s (?:the thing|what you need to know|the problem)\b[^.!?\n]*)/iu);
    if (opening) {
      findings.push(finding(text, { id: 'AAW004', name: 'opening.dead' }, 'blocking', 'Dead opening found.', 'Start with the concrete claim, scene, fact, or request.', firstProse, text.slice(firstProse, firstProse + opening[0].length), masked));
    }
  }

  const trimmedEnd = masked.trimEnd();
  const closingMatch = trimmedEnd.match(/(?:I hope this helps\.?|I hope that answers your question\.?|Happy to help\.?|The possibilities are endless\.?|This is just the beginning\.?)$/iu);
  if (closingMatch) {
    const offset = trimmedEnd.length - closingMatch[0].length;
    findings.push(finding(text, { id: 'AAW005', name: 'closing.generic' }, 'blocking', 'Generic closing found.', 'End with the final useful point.', offset, text.slice(offset, offset + closingMatch[0].length), masked));
  }

  const engagement = trimmedEnd.match(/(?:What do you think\?|What['’]s your take\?|Anyone else seeing this\?|Have you tried this\?|Curious what you think\.?)$/iu);
  if (engagement) {
    const offset = trimmedEnd.length - engagement[0].length;
    findings.push(finding(text, { id: 'AAW017', name: 'ending.engagement_bait', confidence: 'candidate' }, 'review', 'Engagement-bait ending found.', 'Keep only when the user needs replies or survey answers.', offset, text.slice(offset, offset + engagement[0].length), masked));
  }

  const rawLines = masked.split('\n');
  const lines = rawLines.map((line) => line.endsWith('\r') ? line.slice(0, -1) : line);
  const lineOffsets = [];
  let nextLineOffset = 0;
  for (const line of rawLines) {
    lineOffsets.push(nextLineOffset);
    nextLineOffset += line.length + 1;
  }
  const listItemPattern = /^([ \t]*)([-*+]|\d+[.)]|[•◦▪▫‣⁃])[ \t]+/u;
  const listRecords = lines.map((line, index) => {
    const match = line.match(listItemPattern);
    if (!match) return null;
    return {
      index,
      indent: match[1].replace(/\t/gu, '    ').length,
      markerOffset: lineOffsets[index] + match[1].length
    };
  });
  const contentIndent = lines.map((line) => {
    const whitespace = line.match(/^[ \t]*/u)[0];
    return whitespace.replace(/\t/gu, '    ').length;
  });
  const records = listRecords.filter(Boolean);
  const startsNewBlock = (line) => /^[ \t]*(?:#{1,6}(?:[ \t]+|$)|>|`{3,}|~{3,}|(?:[-*_][ \t]*){3,}|<(?!!--))/u.test(line);
  const sameList = (left, right) => {
    let blankSeen = false;
    for (let index = left.index + 1; index < right.index; index += 1) {
      if (!lines[index].trim()) {
        blankSeen = true;
        continue;
      }
      const candidate = listRecords[index];
      if (candidate) {
        if (candidate.indent < left.indent) return false;
        blankSeen = false;
        continue;
      }
      if (contentIndent[index] > left.indent) {
        blankSeen = false;
        continue;
      }
      if (blankSeen || startsNewBlock(lines[index])) return false;
      // Ordinary unindented prose without a preceding blank is a lazy continuation.
    }
    return true;
  };
  for (let position = 0; position < records.length; position += 1) {
    const record = records[position];
    let previous = null;
    for (let index = position - 1; index >= 0; index -= 1) {
      if (records[index].indent === record.indent) {
        previous = records[index];
        break;
      }
    }
    let next = null;
    for (let index = position + 1; index < records.length; index += 1) {
      if (records[index].indent === record.indent) {
        next = records[index];
        break;
      }
    }
    const hasSibling = Boolean(
      (previous && sameList(previous, record))
      || (next && sameList(record, next))
    );
    if (!hasSibling) {
      const lineEnd = lineOffsets[record.index] + lines[record.index].length;
      const match = text.slice(record.markerOffset, lineEnd);
      findings.push(finding(text, { id: 'AAW006', name: 'structure.one_item_list' }, 'blocking', 'One-item list found.', 'Write the point as a sentence.', record.markerOffset, match, masked));
    }
  }

  const sentences = sentenceRecords(text, masked);
  for (let index = 0; index <= sentences.length - 3; index += 1) {
    const group = sentences.slice(index, index + 3);
    if (group.every((sentence) => sentence.words.length > 0 && sentence.words.length <= 5)) {
      const match = text.slice(group[0].offset, group[2].endOffset);
      findings.push(finding(text, { id: 'AAW035', name: 'rhythm.stacked_short_sentences', confidence: 'heuristic' }, 'advisory', 'Three nearby short sentences may create staged rhythm.', 'Combine or develop them if the cadence replaces explanation.', group[0].offset, match, masked));
      break;
    }
  }

  const paragraphPattern = /(?:^|\n[ \t]*\n)([^\n](?:[\s\S]*?[^\n])?)(?=\n[ \t]*\n|$)/gu;
  const limitCue = /\b(?:cannot|can['’]t|does\s+not|do\s+not|did\s+not|is\s+not|are\s+not|was\s+not|were\s+not|no\s+(?:basis|evidence|reason|record)|unknown|unresolved|not\s+(?:attribute|compare|determine|establish|estimate|identify|isolate|measure|provide|record|say|show|state|support))\b/iu;
  for (const paragraphMatch of masked.matchAll(paragraphPattern)) {
    const paragraph = paragraphMatch[1];
    if (/^[ \t]*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|>)/u.test(paragraph)) continue;
    const paragraphSentences = sentenceRecords(paragraph, paragraph);
    const limited = paragraphSentences.filter((sentence) => limitCue.test(sentence.text));
    if (limited.length < 2) continue;
    const seenTopics = new Set();
    let repeated = null;
    for (const sentence of limited) {
      const topics = limitationTopics(sentence.text);
      if (topics.some((topic) => seenTopics.has(topic))) {
        repeated = sentence;
        break;
      }
      for (const topic of topics) seenTopics.add(topic);
    }
    const level = limited.length >= 3 ? 'review' : 'advisory';
    const second = limited.length >= 3 ? limited[2] : repeated;
    if (!second) continue;
    const paragraphOffset = paragraphMatch.index + paragraphMatch[0].indexOf(paragraph);
    const offset = paragraphOffset + second.offset;
    const match = text.slice(offset, offset + second.text.length);
    findings.push(finding(
      text,
      { id: 'AAW042', name: 'repetition.stacked_limit_sentences', confidence: 'heuristic' },
      level,
      level === 'review'
        ? 'Three or more limitation sentences appear in one paragraph.'
        : 'Two limitation sentences in one paragraph may repeat the same type of limit.',
      'Apply the one-answer test. Combine or delete repeated limits; allow review only when each sentence limits a different supported claim.',
      offset,
      match,
      masked
    ));
  }

  const recommendationCue = /^(?:(?:I|we|operations|the\s+(?:company|team))\s+(?:recommend|should)\b|(?:approve|authorize|choose|deploy|keep|proceed|reject|run|stop)\b)/iu;
  const anaphoricReissue = /^(?:approve|authorize|proceed(?:\s+with)?|run)\s+(?:it|this|that)\b/iu;
  const goAheadCue = /\b(?:approve|authorize|proceed|recommend|run)\b/iu;
  const targetPattern = /\b(?:deployment|implementation|pilot|plan|proposal|rollout|study|test|transition|trial)\b/giu;
  const decisions = sentences.filter((sentence) => recommendationCue.test(sentence.text.trim()));
  let repeatedDecision = null;
  for (let index = 1; index < decisions.length && !repeatedDecision; index += 1) {
    const current = decisions[index];
    const currentText = current.text.trim();
    if (anaphoricReissue.test(currentText)) {
      repeatedDecision = current;
      break;
    }
    if (!goAheadCue.test(currentText)) continue;
    const currentTargets = new Set(Array.from(currentText.matchAll(targetPattern), (match) => match[0].toLowerCase()));
    if (currentTargets.size === 0) continue;
    for (let priorIndex = 0; priorIndex < index; priorIndex += 1) {
      const priorText = decisions[priorIndex].text.trim();
      if (!goAheadCue.test(priorText)) continue;
      const priorTargets = new Set(Array.from(priorText.matchAll(targetPattern), (match) => match[0].toLowerCase()));
      if (Array.from(currentTargets).some((target) => priorTargets.has(target))) {
        repeatedDecision = current;
        break;
      }
    }
  }
  if (repeatedDecision) {
    findings.push(finding(
      text,
      { id: 'AAW051', name: 'repetition.recommendation_reissued', confidence: 'heuristic' },
      'review',
      'A recommendation or decision may be reissued after it was already stated.',
      'State the recommendation once. Use later sentences only for distinct conditions, owners, or actions.',
      repeatedDecision.offset,
      text.slice(repeatedDecision.offset, repeatedDecision.endOffset),
      masked
    ));
  }

  const seen = new Set();
  const deduped = findings.filter((item) => {
    const key = `${item.rule_id}:${item.location.start.offset}:${item.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => left.location.start.offset - right.location.start.offset || (left.rule_id < right.rule_id ? -1 : left.rule_id > right.rule_id ? 1 : 0));

  const summary = {
    blocking: deduped.filter((item) => item.level === 'blocking').length,
    review: deduped.filter((item) => item.level === 'review').length,
    advisory: deduped.filter((item) => item.level === 'advisory').length
  };
  summary.mechanical_pass = summary.blocking === 0;
  summary.semantic_review_required = true;

  return {
    schema_version: SCHEMA_VERSION,
    scanner: {
      name: 'anti-ai-writing-scan',
      version: SCANNER_VERSION,
      ruleset_version: RULESET_VERSION,
      unicode_version: process.versions.unicode
    },
    location_units: {
      offset: 'utf16_code_unit_zero_based',
      line: 'one_based',
      column: 'unicode_code_point_one_based'
    },
    source: {
      kind: sourceKind,
      label: sourceLabel,
      sha256: crypto.createHash('sha256').update(text).digest('hex'),
      bytes: Buffer.byteLength(text),
      words: countWords(text)
    },
    policy: {
      ignored_regions: includeCode ? [] : ['fenced_code', 'inline_code']
    },
    summary,
    findings: deduped,
    semantic_checks_not_performed: SEMANTIC_CHECKS
  };
}

function parseArgs(argv) {
  const options = { format: 'text', failOn: 'blocking', includeCode: false, input: null, stdin: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') options.help = true;
    else if (arg === '--version') options.version = true;
    else if (arg === '--stdin') options.stdin = true;
    else if (arg === '--include-code') options.includeCode = true;
    else if (arg === '--input') {
      options.input = requiredValue(argv, index, arg);
      index += 1;
    } else if (arg === '--format') {
      options.format = requiredValue(argv, index, arg);
      index += 1;
    } else if (arg === '--fail-on') {
      options.failOn = requiredValue(argv, index, arg);
      index += 1;
    } else throw new CliUsageError(`Unknown argument: ${arg}`);
  }
  if (!['text', 'json'].includes(options.format)) throw new CliUsageError('Format must be text or json.');
  if (!['blocking', 'review', 'never'].includes(options.failOn)) throw new CliUsageError('Fail level must be blocking, review, or never.');
  if (options.input && options.stdin) throw new CliUsageError('Choose --input or --stdin, not both.');
  if (!options.help && !options.version && !options.input && !options.stdin) throw new CliUsageError('Missing --input or --stdin.');
  if (options.input === '-') options.stdin = true;
  return options;
}

function textOutput(result) {
  const state = result.summary.blocking ? 'BLOCK' : result.summary.review || result.summary.advisory ? 'REVIEW' : 'PASS';
  const lines = [
    `Anti-AI writing scan: ${state}`,
    `blocking=${result.summary.blocking} review=${result.summary.review} advisory=${result.summary.advisory}`
  ];
  for (const item of result.findings) {
    lines.push(`[${item.level.toUpperCase()}] ${item.rule} ${item.location.start.line}:${item.location.start.column} ${JSON.stringify(item.match)} ${item.message}`);
  }
  lines.push(`Semantic review still required: ${result.semantic_checks_not_performed.join(', ')}.`);
  return `${lines.join('\n')}\n`;
}

export function runCli(argv, io = {}) {
  const stdout = io.stdout || { write(chunk) { fs.writeSync(1, String(chunk)); } };
  const stderr = io.stderr || { write(chunk) { fs.writeSync(2, String(chunk)); } };
  try {
    const options = parseArgs(argv);
    if (options.help) {
      stdout.write(HELP);
      return 0;
    }
    if (options.version) {
      stdout.write(`${SCANNER_VERSION}\n`);
      return 0;
    }
    const sourceKind = options.stdin ? 'stdin' : 'file';
    const sourceLabel = options.stdin ? 'stdin' : path.basename(options.input);
    const input = options.stdin
      ? (io.stdinText ?? fs.readFileSync(0, 'utf8'))
      : fs.readFileSync(options.input, 'utf8');
    const result = scanText(input, { includeCode: options.includeCode, sourceKind, sourceLabel });
    result.policy.fail_on = options.failOn;
    stdout.write(options.format === 'json' ? `${JSON.stringify(result, null, 2)}\n` : textOutput(result));
    if (options.failOn === 'never') return 0;
    if (options.failOn === 'review' && (result.summary.blocking || result.summary.review)) return 1;
    if (options.failOn === 'blocking' && result.summary.blocking) return 1;
    return 0;
  } catch (error) {
    stderr.write(`scan-writing: ${error.message}\n`);
    const inputErrors = new Set(['ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR']);
    return error instanceof CliUsageError || inputErrors.has(error.code) ? 2 : 3;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(fs.realpathSync(process.argv[1])).href : '';
if (import.meta.url === invokedPath) process.exitCode = runCli(process.argv.slice(2));
