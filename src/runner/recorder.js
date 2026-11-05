// "Animate my run" (M4): runs a solution on ONE test with every statement recorded (see instrument.js), and
// returns the steps plus the usual verdict. A step is { line, vars: { name: snapshot } }; snapshots are plain,
// structured-cloneable data, so a worker can post them. Drawn by src/visualizations/runFrames.js.
import { checkPass, compile, executeOne, exportNameOf, format } from './core.js';
import { instrument } from './instrument.js';

// every run says which language produced it, so Java / C++ runs (M8) can feed the same frames
export const LANGUAGE = 'javascript';
export const MAX_STEPS = 2000;
const MAX_CALLS = 2_000_000; // statements run before the recorder stops the run (keeps what it has, unlike a timeout)
const MAX_ITEMS = 64; // array cells / map entries kept per snapshot
const MAX_DEPTH = 3;

// per-run identity of tree / list nodes, so a variable pointing at a node can be drawn on it (runFrames.js)
let nodeIds = null;
let nextId = 0;
const idOf = (n) => {
  if (!nodeIds) return undefined;
  if (!nodeIds.has(n)) nodeIds.set(n, ++nextId);
  return nodeIds.get(n);
};
const isNode = (v, ...keys) => v && typeof v === 'object' && 'val' in v && keys.some((k) => k in v);

/** a structured-cloneable copy, small enough to keep thousands of: arrays stay arrays, the rest are tagged */
export function snapshot(v, depth = 0) {
  if (v === null || v === undefined || typeof v === 'boolean') return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === 'bigint') return { $text: `${v}n` };
  if (typeof v === 'function' || typeof v === 'symbol') return undefined;
  if (depth >= MAX_DEPTH) return { $text: format(v).slice(0, 40) };
  const typed = ArrayBuffer.isView(v) && !(v instanceof DataView); // Uint8Array etc. read as plain rows
  if (Array.isArray(v) || typed) {
    const out = Array.from(v.slice(0, MAX_ITEMS), (x) => (typed ? (typeof x === 'bigint' ? { $text: `${x}n` } : x) : snapshot(x, depth + 1)));
    return v.length > MAX_ITEMS ? { $array: out, $length: v.length } : out;
  }
  if (v instanceof Map) return { $map: [...v].slice(0, MAX_ITEMS).map(([k, x]) => [snapshot(k, depth + 1), snapshot(x, depth + 1)]), $size: v.size };
  if (v instanceof Set) return { $set: [...v].slice(0, MAX_ITEMS).map((x) => snapshot(x, depth + 1)), $size: v.size };
  if (isNode(v, 'left', 'right')) return treeLevels(v);
  if (isNode(v, 'next')) return { $list: listValues(v) };
  const obj = {};
  for (const k of Object.keys(v).slice(0, 12)) {
    const s = snapshot(v[k], depth + 1);
    if (s !== undefined) obj[k] = s;
  }
  return { $obj: obj };
}

/** list values from the head, stopping at a cycle (cycleTo = the index it returns to) */
function listValues(head) {
  const seen = new Map();
  const values = [];
  const ids = [];
  for (let n = head; n && values.length < MAX_ITEMS; n = n.next) {
    if (seen.has(n)) return { values, ids, cycleTo: seen.get(n) };
    seen.set(n, values.length);
    values.push(snapshot(n.val, MAX_DEPTH - 1));
    ids.push(idOf(n));
  }
  return { values, ids };
}

/** { $tree: level-order values with nulls (like LeetCode), $ids: node ids in the same slots }, at most MAX_ITEMS slots */
function treeLevels(root) {
  const out = [];
  const ids = [];
  const q = [root];
  const seen = new Set();
  while (q.length && out.length < MAX_ITEMS) {
    const n = q.shift();
    if (!n || seen.has(n)) {
      out.push(null);
      ids.push(null);
      continue;
    }
    seen.add(n);
    out.push(snapshot(n.val, MAX_DEPTH - 1));
    ids.push(idOf(n) ?? null);
    q.push(n.left ?? null, n.right ?? null);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  ids.length = out.length;
  return { $tree: out, $ids: ids };
}

/**
 * Run `code` on one test with recording on.
 * @param opts.refCode a reference solution: fills in `expected` for a test the user typed in (it has none)
 * @returns {{ steps, stride, truncated, calls, ops, output, outputText, passed, error, compileError, logs }}
 *   stride: every stride-th statement was kept (it doubles each time the step list fills up)
 *   calls: statements run in total; ops: design-class operations [{ name, args }] (steps carry `op`, an index)
 */
export function recordRun(code, question, test, { maxSteps = MAX_STEPS, refCode } = {}) {
  const logs = [];
  let steps = [];
  let stride = 1;
  let calls = 0;
  const ops = [];
  let op;
  let skipped = null; // the last statement left out by sampling: recorded at the end so the final state shows
  const rec = (line, getters) => {
    if (++calls > MAX_CALLS) throw new Error(`Stopped after ${MAX_CALLS.toLocaleString('en')} steps: an infinite loop, or an input too big to animate`);
    if ((calls - 1) % stride) {
      skipped = [line, getters];
      return;
    }
    skipped = null;
    take(line, getters);
  };
  const take = (line, getters) => {
    const vars = {};
    for (const [name, get] of getters) {
      let v;
      try {
        v = get();
      } catch {
        continue; // not declared yet, or not in scope here
      }
      if (typeof v !== 'function') vars[name] = snapshot(v);
    }
    steps.push(op === undefined ? { line, vars } : { line, vars, op });
    if (steps.length >= maxSteps) {
      // keep every other step and record half as often from now on: the whole run stays evenly covered
      steps = steps.filter((_, i) => i % 2 === 0);
      stride *= 2;
    }
  };

  if (refCode && test.expected === undefined && !test.expectedGen && !test.expectedAnyOf) {
    try {
      test = { ...test, expected: executeOne(compile(refCode, exportNameOf(question), []), question, test) };
    } catch {
      /* no reference answer: the verdict falls back to "not the expected answer" */
    }
  }
  const base = () => ({ language: LANGUAGE, steps, stride, truncated: stride > 1, calls, ops, logs });

  let target;
  try {
    target = compile(instrument(code), exportNameOf(question), logs, { __rec: rec });
  } catch (err) {
    return { language: LANGUAGE, steps: [], stride, truncated: false, compileError: `${err.name}: ${err.message}`, logs };
  }
  if (target === undefined) return { language: LANGUAGE, steps: [], stride, truncated: false, compileError: `Could not find "${exportNameOf(question)}". Keep the provided signature name.`, logs };

  const finish = () => skipped && take(...skipped);
  const onOp = (i, name, args) => {
    op = i;
    ops.push({ name, args: snapshot(args) });
  };
  nodeIds = new WeakMap();
  nextId = 0;
  try {
    const output = executeOne(target, question, test, onOp);
    finish();
    return { ...base(), output: snapshot(output), outputText: format(output), passed: checkPass(question, test, output) };
  } catch (err) {
    finish();
    const msg = err instanceof RangeError && /call stack/i.test(err.message) ? 'RangeError: Maximum call stack size exceeded (infinite recursion?)' : `${err.name || 'Error'}: ${err.message}`;
    return { ...base(), passed: false, error: msg };
  } finally {
    nodeIds = null;
  }
}

// kept with the frame builder (pure, and the UI needs it without loading the parser); re-exported for callers here
export { firstDivergence } from '../visualizations/runFrames.js';
