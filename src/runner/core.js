// Environment-agnostic test runner. Used by the browser Web Worker AND by
// scripts/validate-content.mjs (which runs every reference solution in Node).
import * as toolkit from '../toolkit/index.js';

const TOOLKIT_NAMES = Object.keys(toolkit);

export const deepClone = (v) => (v === undefined ? v : structuredClone(v));

// ---------- formatting ----------
export function format(value, depth = 0) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    return String(value);
  }
  if (typeof value === 'string') return value.length > 300 ? `${JSON.stringify(value.slice(0, 120))}… (${value.length} chars)` : JSON.stringify(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (depth > 6) return '…';
  if (Array.isArray(value)) {
    if (value.length > 60) return `[${value.slice(0, 20).map((v) => format(v, depth + 1)).join(',')},… (${value.length} items)]`;
    return `[${value.map((v) => format(v, depth + 1)).join(',')}]`;
  }
  if (value instanceof Map) return `Map(${[...value].map(([k, v]) => `${format(k, depth + 1)} => ${format(v, depth + 1)}`).join(', ')})`;
  if (value instanceof Set) return `Set(${[...value].map((v) => format(v, depth + 1)).join(', ')})`;
  if (value instanceof toolkit.ListNode) return `List${format(toolkit.listToArray(value), depth + 1)}`;
  if (value instanceof toolkit.TreeNode) return `Tree${format(toolkit.treeToArray(value), depth + 1)}`;
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${k}: ${format(v, depth + 1)}`);
    return `{${entries.join(', ')}}`;
  }
  return String(value);
}

// ---------- comparison ----------
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b);
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

const sortKey = (v) => JSON.stringify(v);
const sortedCopy = (arr) => [...arr].sort((x, y) => (sortKey(x) < sortKey(y) ? -1 : sortKey(x) > sortKey(y) ? 1 : 0));

function floatEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b));
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => floatEqual(x, b[i]));
  return deepEqual(a, b);
}

export function compareResult(mode, got, expected) {
  switch (mode) {
    case 'unordered':
      return Array.isArray(got) && Array.isArray(expected) && deepEqual(sortedCopy(got), sortedCopy(expected));
    case 'nested-unordered': {
      const norm = (arr) => sortedCopy(arr.map((x) => (Array.isArray(x) ? sortedCopy(x) : x)));
      return Array.isArray(got) && Array.isArray(expected) && deepEqual(norm(got), norm(expected));
    }
    case 'float':
      return floatEqual(got, expected);
    default:
      return deepEqual(got, expected);
  }
}

// ---------- IO conversion ----------
function convertIn(type, value) {
  if (type === 'list') return toolkit.arrayToList(value);
  if (type === 'tree') return toolkit.arrayToTree(value);
  if (type === 'list[]') return value.map((v) => toolkit.arrayToList(v));
  return value;
}

function convertOut(type, value) {
  if (type === 'list') return toolkit.listToArray(value);
  if (type === 'tree') return toolkit.treeToArray(value);
  if (type === 'list[]') return value.map((v) => toolkit.listToArray(v));
  return value;
}

// ---------- compilation ----------
export function exportNameOf(question) {
  return question.kind === 'design' ? question.className : question.functionName;
}

export function compile(code, exportName, logSink) {
  const consoleProxy = {
    log: (...a) => logSink.push(a.map((x) => (typeof x === 'string' ? x : format(x))).join(' ')),
  };
  consoleProxy.info = consoleProxy.warn = consoleProxy.error = consoleProxy.debug = consoleProxy.log;
  consoleProxy.table = consoleProxy.log;
  // User code runs in an inner function scope so it may declare its own `class ListNode`,
  // `class Trie`, `class MinHeap`… — those shadow the injected toolkit globals instead of clashing.
  const body = `"use strict";\nreturn (() => {\n${code}\n;return (typeof ${exportName} !== 'undefined') ? ${exportName} : undefined;\n})();`;
  // eslint-disable-next-line no-new-func
  const factory = new Function('console', ...TOOLKIT_NAMES, body);
  return factory(consoleProxy, ...TOOLKIT_NAMES.map((k) => toolkit[k]));
}

function compileHelper(src) {
  // eslint-disable-next-line no-new-func
  return new Function(...TOOLKIT_NAMES, `"use strict"; return (${src});`)(...TOOLKIT_NAMES.map((k) => toolkit[k]));
}

const helpers = { ...toolkit, deepClone, format };

// Large tests can generate their arguments in code instead of storing huge arrays:
// test.argsGen = "() => [Array.from({ length: 1e5 }, (_, i) => i), 7]"
const genCache = new Map();
// Generated pieces are cached per source string, so a test is generated once per run.
function generated(src) {
  if (!genCache.has(src)) genCache.set(src, compileHelper(src)());
  return genCache.get(src);
}

// Design tests may generate long operation sequences: test.opsGen = "() => ({ ops, args, expected })".
export function resolveDesign(test) {
  if (!test.opsGen) return { ops: test.ops, args: test.args };
  const g = generated(test.opsGen);
  return { ops: g.ops, args: g.args };
}

// Large expected values can be generated too: test.expectedGen = "() => …" (or come from opsGen).
export function resolveExpected(test) {
  if (test.expectedGen) return generated(test.expectedGen);
  if (test.opsGen && test.expected === undefined) return generated(test.opsGen).expected;
  return test.expected;
}

export function resolveArgs(test) {
  if (!test.argsGen) return test.args;
  if (!genCache.has(test.argsGen)) genCache.set(test.argsGen, compileHelper(test.argsGen)());
  return genCache.get(test.argsGen);
}

// ---------- executing a single test ----------
function executeOne(target, question, test) {
  const args = deepClone(resolveArgs(test));
  const io = question.io || {};

  if (question.harness) {
    const harness = compileHelper(question.harness);
    return harness(target, args, helpers);
  }

  if (question.kind === 'design') {
    const { ops, args: opArgs } = resolveDesign(test);
    const out = [];
    let instance = null;
    for (let i = 0; i < ops.length; i++) {
      const a = deepClone(opArgs[i] || []);
      if (i === 0) {
        instance = new target(...a.map((v, j) => convertIn((io.ctorParams || [])[j], v)));
        out.push(null);
      } else {
        if (typeof instance[ops[i]] !== 'function') throw new Error(`Method "${ops[i]}" is not defined on ${question.className}`);
        const r = instance[ops[i]](...a);
        out.push(r === undefined ? null : convertOut((io.methodReturns || {})[ops[i]], r));
      }
    }
    return out;
  }

  const params = io.params || [];
  const realArgs = args.map((v, i) => convertIn(params[i], v));
  const ret = target(...realArgs);
  if (typeof io.mutates === 'number') return convertOut(params[io.mutates], realArgs[io.mutates]);
  return convertOut(io.returns, ret);
}

function checkPass(question, test, output) {
  if (question.checker) {
    const checker = compileHelper(question.checker);
    return !!checker(output, deepClone(resolveArgs(test)), resolveExpected(test), helpers);
  }
  if (test.expectedAnyOf) return test.expectedAnyOf.some((e) => compareResult(question.compare, output, e));
  return compareResult(question.compare, output, resolveExpected(test));
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Time limits are tuned on a reference machine. A slower device (or a busy browser tab) gets
// proportionally more time so a correct solution is never failed for the machine's speed.
const BENCH_BASELINE_MS = 35; // this benchmark's median in Node on the reference machine
let cachedScale = null;
function bench() {
  const a = [];
  for (let i = 0; i < 200000; i++) a.push((i * 7919) % 100003);
  a.sort((x, y) => x - y);
  const m = new Map();
  for (let i = 0; i < 100000; i++) m.set(i, i * 2);
  let s = 0;
  for (let i = 0; i < 100000; i++) s += m.get(i);
  return s + a[5];
}
export function timeScale() {
  if (cachedScale === null) {
    bench(); // warm-up (JIT)
    const t0 = now();
    bench();
    cachedScale = Math.min(5, Math.max(1, (now() - t0) / BENCH_BASELINE_MS));
  }
  return cachedScale;
}
const MIN_LIMIT_MS = 100;
export const effectiveLimit = (limitMs) => Math.max(MIN_LIMIT_MS, limitMs * timeScale());

/**
 * Run `code` against `tests`.
 * @param {string} code user or reference source code
 * @param {object} question runnable question fields (kind, functionName/className, io, compare, harness, checker)
 * @param {Array} tests [{ args, expected } | { ops, args, expected }]
 * @param {object} [opts] { compareWith: false } — when false, only produce output (custom input mode)
 */
export function runTests(code, question, tests, opts = {}) {
  const logs = [];
  let target;
  try {
    target = compile(code, exportNameOf(question), logs);
  } catch (err) {
    return { compileError: `${err.name}: ${err.message}`, results: [], logs };
  }
  if (target === undefined) {
    const kind = question.kind === 'design' ? 'class' : 'function';
    return { compileError: `Could not find ${kind} "${exportNameOf(question)}". Keep the provided signature name.`, results: [], logs };
  }

  const results = tests.map((test, index) => {
    opts.onStart?.(index);
    const testLogs = [];
    // Generate big inputs/expected values BEFORE the timer starts (results are cached).
    try {
      if (test.argsGen) resolveArgs(test);
      if (test.opsGen) resolveDesign(test);
      if (test.expectedGen) resolveExpected(test);
    } catch {
      /* reported when the test actually runs */
    }
    const start = logs.length;
    const t0 = now();
    try {
      const output = executeOne(target, question, test);
      const ms = now() - t0;
      testLogs.push(...logs.slice(start));
      let passed = opts.compareWith === false ? null : checkPass(question, test, output);
      let error;
      const limit = test.timeLimitMs && effectiveLimit(test.timeLimitMs);
      if (passed && limit && ms > limit) {
        passed = false;
        error = `Too slow: took ${Math.round(ms)} ms (limit ${Math.round(limit)} ms). The answer is right, but this input is large — your approach is probably a complexity class too slow.`;
      }
      const result = { index, passed, error, output: format(output), rawOutput: passed === null ? safeRaw(output) : undefined, ms, logs: testLogs };
      opts.onResult?.(result);
      return result;
    } catch (err) {
      testLogs.push(...logs.slice(start));
      const msg = err instanceof RangeError && /call stack/i.test(err.message) ? 'RangeError: Maximum call stack size exceeded (infinite recursion?)' : `${err.name || 'Error'}: ${err.message}`;
      const result = { index, passed: false, error: msg, ms: now() - t0, logs: testLogs };
      opts.onResult?.(result);
      return result;
    }
  });
  return { results, logs };
}

function safeRaw(v) {
  try {
    return deepClone(v);
  } catch {
    return undefined;
  }
}

export function describeTest(question, test) {
  if (question.kind === 'design') {
    const { ops, args } = resolveDesign(test);
    return `${format(ops)}\n${format(args)}`;
  }
  const names = question.paramNames || [];
  const args = resolveArgs(test);
  return args.map((a, i) => (names[i] ? `${names[i]} = ${format(a)}` : format(a))).join(', ');
}
