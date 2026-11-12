// "Where did I go wrong" (shrink + first divergence) and "Measure my time and space" (size sweep + fit).
// Pure functions; the heavy ones (shrink, measure) run in the worker (worker.js `shrink` / `measure` messages).
import { checkPass, compile, deepClone, executeOne, exportNameOf } from './core.js';
import { instrument } from './instrument.js';
import { firstDivergence } from '../visualizations/runFrames.js';

// ---------------------------------------------------------------- shrink
/** remove part [start, start + len) of an array or string argument */
const without = (v, start, len) => (typeof v === 'string' ? v.slice(0, start) + v.slice(start + len) : [...v.slice(0, start), ...v.slice(start + len)]);
const shrinkable = (v) => (Array.isArray(v) || typeof v === 'string') && v.length > 1;

/**
 * Delta-debug a failing input: drop chunks of each array / string argument while your answer still differs from the
 * reference's. A candidate the reference throws on is not a valid input and is skipped.
 * @returns {{ runs, ms, log: [{ args, got, want }], args, note? }} log[last].args is the smallest failing input
 */
export function shrink({ code, refCode, question, args, maxRuns = 60, maxMs = 4000 }) {
  const name = exportNameOf(question);
  const user = compile(code, name, []);
  const ref = compile(refCode, name, []);
  if (user === undefined) throw new Error(`Could not find "${name}". Keep the provided signature name.`);
  const t0 = Date.now();
  let runs = 0;
  const verdict = (a) => {
    runs++;
    let want;
    try {
      want = executeOne(ref, question, { args: a });
    } catch {
      return null;
    }
    let got;
    try {
      got = executeOne(user, question, { args: a });
    } catch (e) {
      return { fails: true, got: `${e.name}: ${e.message}`, want };
    }
    return { fails: !checkPass(question, { args: a, expected: want }, got), got, want };
  };
  let cur = deepClone(args);
  const first = verdict(cur);
  const log = [];
  if (!first || !first.fails) return { runs, ms: Date.now() - t0, log, args: cur, note: 'Your answer matches the reference on this input.' };
  log.push({ args: deepClone(cur), got: first.got, want: first.want });
  const budget = () => runs < maxRuns && Date.now() - t0 < maxMs;
  for (let a = 0; a < cur.length; a++) {
    if (!shrinkable(cur[a])) continue;
    let chunk = Math.ceil(cur[a].length / 2);
    while (chunk >= 1 && budget()) {
      let changed = false;
      for (let start = 0; start < cur[a].length && budget(); start += chunk) {
        const smaller = without(cur[a], start, chunk);
        if (!smaller.length) continue;
        const cand = cur.map((x, i) => (i === a ? smaller : x));
        const v = verdict(cand);
        if (v?.fails) {
          cur = cand;
          changed = true;
          log.push({ args: deepClone(cur), got: v.got, want: v.want });
          start -= chunk; // try the same spot again on the smaller input
        }
      }
      if (!changed) chunk = Math.floor(chunk / 2);
    }
  }
  return { runs, ms: Date.now() - t0, log, args: cur };
}

// ---------------------------------------------------------------- first divergence over every shared variable
const key = (v) => JSON.stringify(v);
function distinct(steps, name) {
  const out = [];
  for (const s of steps) if (name in s.vars && key(s.vars[name]) !== key(out[out.length - 1])) out.push(s.vars[name]);
  return out;
}

/**
 * The earliest step of your run where a variable you share (by name) with the reference takes a value the reference
 * did not have at that point (the rule of runFrames.firstDivergence, over every shared name).
 * @returns {{ name, at, line, mine, want, ended }} or null when every shared variable follows the reference
 */
export function divergence(userSteps, refSteps) {
  const names = (steps) => new Set(steps.flatMap((s) => Object.keys(s.vars)));
  const theirs = names(refSteps);
  let best = null;
  for (const name of names(userSteps)) {
    if (!theirs.has(name) || name === 'this') continue;
    const at = firstDivergence(userSteps, refSteps, name);
    if (at < 0 || (best && at >= best.at)) continue;
    let pos = -1;
    let last;
    for (let i = 0; i <= at; i++) {
      const s = userSteps[i];
      if (!(name in s.vars) || key(s.vars[name]) === last) continue;
      last = key(s.vars[name]);
      pos++;
    }
    const want = distinct(refSteps, name)[Math.max(0, pos)];
    best = { name, at, line: userSteps[at].line, mine: userSteps[at].vars[name], want, ended: want === undefined };
  }
  return best;
}

// ---------------------------------------------------------------- inputs of size n from paramTypes
export const SIZES = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

/** seeded random integers in [0, m), so every measurement sees the same inputs */
export function rng(seed) {
  let s = seed >>> 0;
  return (m) => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s % m;
  };
}

const EDGES = /edge|connection|prerequisite|times|flight|road|trust|relation|dislike|pairs|tickets/i;
const RANGES = /interval|meeting|range|booking|segment|point/i;
const VERTICES = /^(n|num\w*|count|vertices|nodes|courses)$/i;
const SUPPORTED = new Set(['int', 'long', 'double', 'int[]', 'double[]', 'string', 'char[]', 'string[]', 'int[][]', 'char[][]', 'TreeNode', 'ListNode']);
const letters = (len, rnd, abc = 26) => Array.from({ length: len }, () => String.fromCharCode(97 + rnd(abc))).join('');

/** can the size sweep build inputs for this question? (design classes and unusual types are left out) */
export function measurable(question) {
  return question.kind !== 'design' && !!question.solution?.code && Array.isArray(question.paramTypes) && question.paramTypes.length > 0 && question.paramTypes.every((t) => SUPPORTED.has(t));
}

/**
 * Arguments of size about n, from the question's paramTypes (and paramNames, to tell edge lists and intervals from
 * grids). An int is the size itself when nothing else carries the size, else a value in 1..n.
 * shortcut: one generic shape per type, so inputs ignore question rules (sorted, distinct…); a question can override
 * with growth.gen = "(n, rnd) => [args]" when its reference rejects the generic inputs.
 */
export function makeArgs(question, n, rnd) {
  if (question.growth?.gen) return compile(`const __gen = (${question.growth.gen});`, '__gen', [])(n, rnd);
  const types = question.paramTypes;
  const names = question.paramNames || [];
  const sized = types.some((t) => t !== 'int' && t !== 'long' && t !== 'double');
  const hasEdges = types.some((t, i) => t === 'int[][]' && EDGES.test(names[i] || ''));
  const side = Math.max(1, Math.round(Math.sqrt(n)));
  return types.map((t, i) => {
    const name = names[i] || '';
    switch (t) {
      case 'int':
      case 'long':
        if (hasEdges && VERTICES.test(name)) return n;
        return sized ? 1 + rnd(n) : n;
      case 'double':
        return sized ? 1 + rnd(n) + 0.5 : n;
      case 'int[]':
        return Array.from({ length: n }, () => 1 + rnd(n));
      case 'double[]':
        return Array.from({ length: n }, () => 1 + rnd(n) + 0.5);
      case 'string':
        return letters(n, rnd);
      case 'char[]':
        return letters(n, rnd).split('');
      case 'string[]':
        return Array.from({ length: n }, () => letters(1 + rnd(5), rnd, 5));
      case 'int[][]':
        if (EDGES.test(name)) {
          const weighted = /times|flight|road/i.test(name);
          return Array.from({ length: n }, () => {
            const u = rnd(n);
            const v = (u + 1 + rnd(n - 1 || 1)) % n;
            return weighted ? [u, v, 1 + rnd(100)] : [u, v];
          });
        }
        if (RANGES.test(name))
          return Array.from({ length: n }, () => {
            const a = rnd(n * 4);
            return [a, a + 1 + rnd(10)];
          });
        return Array.from({ length: side }, () => Array.from({ length: side }, () => rnd(2)));
      case 'char[][]':
        return Array.from({ length: side }, () => Array.from({ length: side }, () => (rnd(2) ? '1' : '0')));
      case 'TreeNode':
      case 'ListNode':
        return Array.from({ length: n }, (_, k) => k + 1); // level order / list order; the runner builds the nodes
      default:
        throw new Error(`no generator for ${t}`);
    }
  });
}

// ---------------------------------------------------------------- one counted run
const STOP = { stop: true };

/** extra slots held at one statement: your variables, each collection counted by its size, the input left out */
function slots(getters, input) {
  let total = 0;
  const seen = new Set();
  for (const [name, get] of getters) {
    if (name === 'this') continue;
    let v;
    try {
      v = get();
    } catch {
      continue; // not in scope yet
    }
    if (typeof v === 'function') continue;
    if (v === null || typeof v !== 'object') {
      total += 1;
      continue;
    }
    if (input.has(v) || seen.has(v)) continue;
    seen.add(v);
    if (Array.isArray(v) || ArrayBuffer.isView(v)) total += Math.max(1, v.length) + (Array.isArray(v[0]) ? v.reduce((s, r) => s + (Array.isArray(r) ? r.length : 0), 0) : 0);
    else if (v instanceof Map || v instanceof Set) total += Math.max(1, v.size);
    else total += Math.max(1, Object.keys(v).length);
  }
  return total;
}

/** run `code` once with every statement counted; space = peak extra slots */
export function countRun(code, question, args, cap = 3_000_000) {
  let calls = 0;
  let peak = 0;
  const hits = {};
  const input = new Set();
  const rec = (line, getters) => {
    if (++calls > cap) throw STOP;
    hits[line] = (hits[line] || 0) + 1;
    const s = slots(getters, input);
    if (s > peak) peak = s;
  };
  const target = compile(instrument(code), exportNameOf(question), [], { __rec: rec, __rv: (line, getters, value) => (rec(line, getters), value) });
  if (typeof target !== 'function') throw new Error(`Could not find "${exportNameOf(question)}"`);
  // the runner converts the arguments (arrays → ListNode / TreeNode…); note what arrives, so the input is not counted
  const seeInput = (...got) => {
    for (const a of got)
      if (a && typeof a === 'object') {
        input.add(a);
        if (Array.isArray(a)) for (const x of a) if (x && typeof x === 'object') input.add(x);
      }
    return target(...got);
  };
  try {
    executeOne(seeInput, question, { args });
  } catch (e) {
    if (e === STOP) return { capped: true, calls, space: peak, hits };
    throw e;
  }
  return { calls, space: peak, hits };
}

/**
 * The size sweep: count steps and peak extra memory on generated inputs of growing size. Stops at the step cap or
 * the time budget. `role` names whose code this is, for the message when a run throws.
 * @returns {{ points: [{ n, calls, space, hot: [[line, share]] }], stoppedAt?, reason?, error? }}
 */
export function measure({ code, question, sizes = SIZES, cap = 3_000_000, maxMs = 6000, role = 'your code' }) {
  const t0 = Date.now();
  const points = [];
  for (const n of sizes) {
    let args;
    try {
      args = makeArgs(question, n, rng(n * 7919 + 17));
    } catch (e) {
      return { points, error: `Could not build inputs for this question: ${e.message}` };
    }
    let r;
    try {
      r = countRun(code, question, args, cap);
    } catch (e) {
      if (points.length) return { points, stoppedAt: n, reason: `${role} threw at n = ${n.toLocaleString('en')} (${e.message})` };
      return { points, error: `${role} threw on the generated input (${e.name || 'Error'}: ${e.message})` };
    }
    if (r.capped) return { points, stoppedAt: n, reason: `more than ${cap.toLocaleString('en')} steps at n = ${n.toLocaleString('en')}` };
    const total = Object.values(r.hits).reduce((s, x) => s + x, 0) || 1;
    const hot = Object.entries(r.hits)
      .map(([line, c]) => [Number(line), c / total])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    points.push({ n, calls: r.calls, space: r.space, hot });
    if (Date.now() - t0 > maxMs) return { points, stoppedAt: n, reason: 'the time budget ran out' };
  }
  return { points };
}

// ---------------------------------------------------------------- fit a growth class
const L2 = (n) => Math.log2(Math.max(2, n));
export const CLASSES = [
  ['1', () => 1],
  ['log n', (n) => L2(n)],
  ['n', (n) => n],
  ['n log n', (n) => n * L2(n)],
  ['n²', (n) => n * n],
  ['n³', (n) => n ** 3],
];
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** least squares y = a·f(n) + b for every class; the simplest class within 25% of the best error wins */
export function fitClass(points, field) {
  const pts = points.filter((p) => p[field] > 0);
  if (pts.length < 3) return null;
  const ys = pts.map((p) => p[field]);
  const scored = [];
  for (const [name, f] of CLASSES) {
    const xs = pts.map((p) => f(p.n));
    const mx = mean(xs);
    const my = mean(ys);
    let sxx = 0;
    let sxy = 0;
    xs.forEach((x, i) => {
      sxx += (x - mx) ** 2;
      sxy += (x - mx) * (ys[i] - my);
    });
    let a = sxx ? sxy / sxx : 0;
    let b = my - a * mx;
    if (name === '1') [a, b] = [0, my];
    else if (a <= 0) continue;
    scored.push({ name, err: mean(xs.map((x, i) => ((a * x + b - ys[i]) / ys[i]) ** 2)) });
  }
  const min = Math.min(...scored.map((s) => s.err));
  const pick = scored.find((s) => s.err <= min * 1.25 + 1e-9);
  // the log–log slope over the larger half of the sizes: the power of n
  const top = pts.slice(Math.floor(pts.length / 2));
  const lx = top.map((p) => Math.log(p.n));
  const ly = top.map((p) => Math.log(p[field]));
  const mx = mean(lx);
  const my = mean(ly);
  const den = lx.reduce((s, x) => s + (x - mx) ** 2, 0);
  const slope = den ? lx.reduce((s, x, i) => s + (x - mx) * (ly[i] - my), 0) / den : 0;
  return { name: pick.name, slope: Math.round(slope * 100) / 100 };
}
