#!/usr/bin/env node
// Validates all content and executes every reference solution against its tests.
// Usage: npm run validate [-- --topic sliding-window] [-- --quiet]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { TOPIC_META, TOPIC_ORDER } from '../src/content/curriculum.js';
import { runTests } from '../src/runner/core.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const topicsDir = path.join(root, 'src/content/topics');
const args = process.argv.slice(2);
const onlyTopic = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
const quiet = args.includes('--quiet');

const BLOCK_TYPES = new Set(['text', 'callout', 'code', 'compare', 'steps', 'checkpoint', 'reflect', 'recognition', 'visual', 'dryrun', 'complexity', 'jsTools']);
const SCENARIOS = new Set(Object.keys((await import('../src/visualizations/scenarios/index.js')).SCENARIOS));
const DIFFS = new Set(['Easy', 'Medium', 'Hard']);
const CALLOUTS = new Set(['analogy', 'tip', 'warning', 'insight', 'definition']);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const checkpointIds = new Map();
const patternIds = new Map();
const questionOwner = new Map();
let totalQuestions = 0;
let totalTests = 0;
const summary = [];

for (const topicId of TOPIC_ORDER) {
  if (onlyTopic && topicId !== onlyTopic) continue;
  const meta = TOPIC_META[topicId];
  const dir = path.join(topicsDir, topicId);
  const topicFile = path.join(dir, 'topic.js');
  if (!meta) err(topicId, 'missing TOPIC_META entry');
  if (!fs.existsSync(topicFile)) {
    warn(topicId, 'topic.js not written yet');
    summary.push({ topicId, status: 'missing' });
    continue;
  }
  let topic;
  try {
    topic = (await import(pathToFileURL(topicFile).href)).default;
  } catch (e) {
    err(`${topicId}/topic.js`, `failed to import: ${e.message}`);
    continue;
  }
  if (topic.id !== topicId) err(`${topicId}/topic.js`, `id "${topic.id}" does not match folder`);
  for (const k of ['summary', 'patterns', 'lesson', 'cheatsheet', 'keyConcepts', 'jsTools']) if (!topic[k]) err(`${topicId}/topic.js`, `missing "${k}"`);

  const localPatterns = new Set();
  for (const p of topic.patterns || []) {
    if (!p.id || !p.name) err(`${topicId}/patterns`, 'pattern missing id/name');
    if (patternIds.has(p.id)) err(`${topicId}/patterns`, `pattern id "${p.id}" already used by ${patternIds.get(p.id)}`);
    patternIds.set(p.id, topicId);
    localPatterns.add(p.id);
    for (const k of ['summary', 'whenToUse', 'clues', 'whenNotToUse', 'template', 'mistakes']) if (!p[k]) warn(`${topicId}/pattern ${p.id}`, `missing "${k}"`);
  }

  let cps = 0;
  let reflects = 0;
  const sectionIds = new Set();
  for (const section of topic.lesson?.sections || []) {
    if (!section.id || !section.title) err(`${topicId}/lesson`, 'section missing id/title');
    if (sectionIds.has(section.id)) err(`${topicId}/lesson`, `duplicate section id ${section.id}`);
    sectionIds.add(section.id);
    for (const [bi, b] of (section.blocks || []).entries()) {
      const where = `${topicId}/lesson/${section.id}[${bi}]`;
      if (!BLOCK_TYPES.has(b.type)) {
        err(where, `unknown block type "${b.type}"`);
        continue;
      }
      if (b.type === 'checkpoint') {
        cps++;
        if (!b.id) err(where, 'checkpoint missing id');
        else if (checkpointIds.has(b.id)) err(where, `checkpoint id ${b.id} duplicated (also in ${checkpointIds.get(b.id)})`);
        checkpointIds.set(b.id, topicId);
        if (!Array.isArray(b.options) || b.options.length < 2) err(where, 'checkpoint needs options');
        if (typeof b.answer !== 'number' || b.answer < 0 || b.answer >= (b.options || []).length) err(where, 'checkpoint answer index out of range');
        if (!b.explanation) err(where, 'checkpoint missing explanation');
      }
      if (b.type === 'reflect') {
        reflects++;
        if (!b.prompt || !b.deeper) err(where, 'reflect needs prompt + deeper');
      }
      if (b.type === 'visual' && !SCENARIOS.has(b.scenario)) err(where, `unknown visual scenario "${b.scenario}"`);
      if (b.type === 'callout' && !CALLOUTS.has(b.variant)) err(where, `unknown callout variant "${b.variant}"`);
      if (b.type === 'text' && typeof b.md !== 'string') err(where, 'text block needs md');
      if (b.type === 'code' && typeof b.code !== 'string') err(where, 'code block needs code');
      if (b.type === 'dryrun' && (!Array.isArray(b.columns) || !Array.isArray(b.rows))) err(where, 'dryrun needs columns + rows');
    }
  }
  if (cps < 4) warn(topicId, `only ${cps} checkpoints (aim for 6+)`);

  // questions
  const qDir = path.join(dir, 'questions');
  const files = fs.existsSync(qDir) ? fs.readdirSync(qDir).filter((f) => f.endsWith('.js')) : [];
  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  let topicTests = 0;
  let failedQ = 0;
  for (const f of files) {
    const where = `${topicId}/questions/${f}`;
    let q;
    try {
      q = (await import(pathToFileURL(path.join(qDir, f)).href)).default;
    } catch (e) {
      err(where, `failed to import: ${e.message}`);
      failedQ++;
      continue;
    }
    totalQuestions++;
    if (q.id + '.js' !== f) err(where, `id "${q.id}" does not match file name`);
    if (questionOwner.has(q.id)) err(where, `question id also in ${questionOwner.get(q.id)}`);
    questionOwner.set(q.id, topicId);
    if (meta && !meta.plannedQuestions.includes(q.id)) warn(where, 'not listed in plannedQuestions');
    if (!DIFFS.has(q.difficulty)) err(where, `bad difficulty "${q.difficulty}"`);
    else counts[q.difficulty]++;
    if (!localPatterns.has(q.pattern)) err(where, `pattern "${q.pattern}" is not one of this topic's patterns (${[...localPatterns].join(', ')})`);
    for (const k of ['title', 'statement', 'source', 'think', 'patternChallenge', 'hints', 'approach', 'complexity', 'mistakes']) if (!q[k]) err(where, `missing "${k}"`);
    if (q.companies) err(where, 'questions must not define "companies" (use companies.js)');
    const pc = q.patternChallenge;
    if (pc && (typeof pc.answer !== 'number' || !pc.options || pc.answer >= pc.options.length)) err(where, 'patternChallenge answer out of range');

    if (q.kind === 'quiz') {
      if (!q.quiz || typeof q.quiz.answer !== 'number' || !q.quiz.options || q.quiz.answer >= q.quiz.options.length) err(where, 'quiz needs options + valid answer');
      continue;
    }
    for (const k of ['starterCode', 'solution', 'tests']) if (!q[k]) err(where, `missing "${k}"`);
    if (q.kind === 'design' ? !q.className : !q.functionName) err(where, 'missing functionName/className');
    const tests = q.tests || [];
    if (tests.length < 10) err(where, `only ${tests.length} tests (need 10–15)`);
    if (tests.length > 20) warn(where, `${tests.length} tests (aim for 10–15)`);
    const scen = new Set();
    tests.forEach((t, ti) => {
      if (!t.scenario || !t.hint) err(where, `test #${ti + 1} needs "scenario" and "hint"`);
      else if (scen.has(t.scenario)) err(where, `test #${ti + 1} duplicate scenario "${t.scenario}"`);
      scen.add(t.scenario);
      if (q.kind !== 'design' && !t.args && !t.argsGen) err(where, `test #${ti + 1} needs args or argsGen`);
      if (q.kind === 'design' && !t.opsGen && !(t.ops && t.args)) err(where, `test #${ti + 1} needs ops + args (or opsGen)`);
      if (t.expected === undefined && !t.expectedGen && !t.expectedAnyOf && !t.opsGen && !q.checker) err(where, `test #${ti + 1} has no expected value`);
    });
    if (!q.solution?.code) continue;

    // starter code must compile
    const starter = runTests(q.starterCode || '', q, [], {});
    if (starter.compileError) err(where, `starter code: ${starter.compileError}`);

    const res = runTests(q.solution.code, q, q.tests || []);
    topicTests += (q.tests || []).length;
    totalTests += (q.tests || []).length;
    if (res.compileError) {
      err(where, `solution: ${res.compileError}`);
      failedQ++;
      continue;
    }
    const bad = res.results.filter((r) => !r.passed);
    if (bad.length) {
      failedQ++;
      for (const r of bad.slice(0, 3)) {
        err(where, `test #${r.index + 1} failed: ${r.error || `got ${r.output}, expected ${JSON.stringify(q.tests[r.index].expected ?? q.tests[r.index].expectedAnyOf)}`}`);
      }
    }
    // The reference must finish well inside any per-test time limit, so a correct learner solution
    // of the same complexity passes comfortably in the browser.
    for (const r of res.results) {
      const lim = q.tests[r.index].timeLimitMs;
      if (lim && r.ms > lim / 3) warn(where, `test #${r.index + 1} reference took ${Math.round(r.ms)}ms — too close to its ${lim}ms limit`);
    }
    const slow = res.results.filter((r) => r.ms > 1500);
    if (slow.length) warn(where, `slow tests (${slow.map((r) => `#${r.index + 1}:${Math.round(r.ms)}ms`).join(', ')})`);
  }
  if (meta) {
    const missing = meta.plannedQuestions.filter((id) => !files.includes(`${id}.js`));
    if (missing.length) warn(topicId, `${missing.length} planned questions not written: ${missing.join(', ')}`);
  }
  summary.push({ topicId, status: 'ok', cps, reflects, ...counts, total: files.length, tests: topicTests, failedQ });
}

console.log('\nTopic                     CPs  Refl  E  M  H  Total  Tests  Failing');
for (const s of summary) {
  if (s.status === 'missing') {
    console.log(`${s.topicId.padEnd(25)} (not written)`);
    continue;
  }
  console.log(`${s.topicId.padEnd(25)} ${String(s.cps).padStart(3)} ${String(s.reflects).padStart(5)} ${String(s.Easy).padStart(2)} ${String(s.Medium).padStart(2)} ${String(s.Hard).padStart(2)} ${String(s.total).padStart(6)} ${String(s.tests).padStart(6)} ${String(s.failedQ).padStart(8)}`);
}
console.log(`\n${totalQuestions} questions, ${totalTests} tests executed.`);
if (!quiet && warnings.length) {
  console.log(`\n⚠ ${warnings.length} warnings`);
  for (const w of warnings) console.log('  ' + w);
}
if (errors.length) {
  console.log(`\n✖ ${errors.length} errors`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('\n✔ content valid');
