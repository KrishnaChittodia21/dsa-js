// "Animate my run" (M4): runs a solution on ONE test with every statement recorded (see instrument.js), and
// returns the steps plus the usual verdict. A step is { line, vars: { name: snapshot } }; snapshots are plain,
// structured-cloneable data, so a worker can post them. Drawn by src/visualizations/runFrames.js.
import { checkPass, compile, executeOne, exportNameOf, format, resolveArgs } from './core.js';
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
    if (v.length <= MAX_ITEMS) return out;
    // a long counting array (count[1001], seen[26]…): also keep its non-zero cells, wherever they are
    const sparse = [];
    for (let i = 0; i < v.length && sparse.length <= MAX_ITEMS; i++) if (v[i] && (typeof v[i] === 'number' || typeof v[i] === 'boolean')) sparse.push([i, v[i]]);
    return sparse.length <= MAX_ITEMS ? { $array: out, $length: v.length, $sparse: sparse } : { $array: out, $length: v.length };
  }
  if (v instanceof Map) return { $map: [...v].slice(0, MAX_ITEMS).map(([k, x]) => [snapshot(k, depth + 1), snapshot(x, depth + 1)]), $size: v.size };
  if (v instanceof Set) return { $set: [...v].slice(0, MAX_ITEMS).map((x) => snapshot(x, depth + 1)), $size: v.size };
  if (isNode(v, 'left', 'right')) return treeLevels(v);
  if (isTrieNode(v)) return trieNodes(v);
  if (isNode(v, 'next')) return { $list: listValues(v) };
  const obj = {};
  for (const k of Object.keys(v).slice(0, 12)) {
    const s = snapshot(v[k], depth + 1);
    if (s !== undefined) obj[k] = s;
  }
  return { $obj: obj };
}

// the field holding a trie node's children: a Map, a letter-keyed object, or a 26-slot array (next[c - 'a'])
const KID_FIELDS = ['children', 'next', 'kids', 'child', 'links'];
const kidsField = (v) => KID_FIELDS.find((f) => {
  const k = v[f];
  return k !== null && typeof k === 'object' && (k instanceof Map || (Array.isArray(k) ? k.length === 26 : true));
});
const childrenOf = (v) => {
  const k = v[kidsField(v)];
  if (k instanceof Map) return [...k];
  if (Array.isArray(k)) return k.map((c, i) => [String.fromCharCode(97 + i), c]).filter(([, c]) => c);
  return k ? Object.entries(k) : [];
};
/** a trie node: { children | next | kids…: Map | object | 26-slot array, … } (toolkit Trie, most hand-written tries) */
const isTrieNode = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Map) && !('val' in v) && kidsField(v) !== undefined;
// a counter kept on each node (prefix counts, map-sum totals): shown next to the letter
const numOf = (v) => ['count', 'cnt', 'sum', 'score', 'total', 'pass', 'prefix'].map((f) => v[f]).find((x) => typeof x === 'number');
// a word ends at this node: a true flag, a stored word string, or a word index >= 0 (palindrome pairs keeps -1 for "none")
const wordEnds = (v) =>
  !!(v.isEnd || v.end || v.isWord || v.isEndOfWord || v.terminal || v.word === true || (typeof v.word === 'string' && v.word)) ||
  [v.index, v.idx, v.wordIndex].some((x) => Number.isInteger(x) && x >= 0);
const MAX_TRIE = 48;

/** { $trie: { nodes: [{ id, ch, end }], edges: [[from, to]] (indexes into nodes), more } }: breadth first, any depth */
function trieNodes(root) {
  const nodes = [{ id: idOf(root) ?? null, ch: '', end: wordEnds(root), num: numOf(root) }];
  const edges = [];
  const q = [[root, 0]];
  const seen = new Set([root]);
  let more = false;
  for (let h = 0; h < q.length; h++) {
    const [n, at] = q[h];
    for (const [ch, c] of childrenOf(n)) {
      if (!c || typeof c !== 'object' || seen.has(c)) continue;
      if (nodes.length >= MAX_TRIE) {
        more = true;
        break;
      }
      seen.add(c);
      nodes.push({ id: idOf(c) ?? null, ch: String(ch), end: wordEnds(c), num: numOf(c) });
      edges.push([at, nodes.length - 1]);
      q.push([c, nodes.length - 1]);
    }
  }
  return { $trie: { nodes, edges, more } };
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

/** the parameter names of a compiled function, as the learner wrote them (`function f(arr, goal)` → ['arr', 'goal']) */
export function paramNamesOf(fn) {
  if (typeof fn !== 'function' || /^class\b/.test(Function.prototype.toString.call(fn))) return [];
  const src = Function.prototype.toString.call(fn);
  const bare = /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/.exec(src); // x => …
  if (bare) return [bare[1]];
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = src.indexOf('(') + 1; i > 0 && i < src.length; i++) {
    const c = src[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c) && depth-- === 0) {
      out.push(cur);
      break;
    } else if (c === ',' && depth === 0) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  return out.map((s) => /^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(s)?.[1]).filter(Boolean);
}

/** true when node `b` can be reached from node `a` along left / right / next (checks at most 256 nodes) */
function reaches(a, b) {
  const todo = [a];
  const seen = new Set();
  while (todo.length && seen.size < 256) {
    const n = todo.pop();
    if (!n || typeof n !== 'object' || seen.has(n)) continue;
    if (n === b) return true;
    seen.add(n);
    todo.push(n.left, n.right, n.next);
  }
  return false;
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
  // kind 1 (after an `if` statement): kept only when something changed since the last kept step;
  // kind 2 (just before a `return`): the step is marked ret: true, so a scene can tell "returns here" apart
  const rec = (line, getters, quiet, value) => {
    if (++calls > MAX_CALLS) throw new Error(`Stopped after ${MAX_CALLS.toLocaleString('en')} steps: an infinite loop, or an input too big to animate`);
    if ((calls - 1) % stride) {
      skipped = [line, getters, quiet, value];
      return;
    }
    skipped = null;
    take(line, getters, quiet, value);
  };
  // tree / list nodes seen on the first step (the parameters): inside a recursive call they are out of scope, so the
  // whole structure is added as "<name> (whole)" and the call's own node shows as a tag on it (runFrames.js)
  const roots = new Map();
  const take = (line, getters, quiet, value) => {
    const vars = {};
    const seen = new Set();
    const nodeVars = [];
    for (const [name, get] of getters) {
      let v;
      try {
        v = get();
      } catch {
        continue; // not declared yet, or not in scope here
      }
      if (typeof v !== 'function') vars[name] = snapshot(v);
      if (v && typeof v === 'object') seen.add(v);
      if (name !== 'this' && (isNode(v, 'left', 'right') || isNode(v, 'next'))) nodeVars.push([name, v]);
    }
    for (const [name, v] of nodeVars) {
      const held = roots.get(name);
      if (!held || (held !== v && reaches(v, held))) roots.set(name, v); // keep the biggest structure under this name
    }
    for (const [name, node] of roots) if (!seen.has(node)) vars[`${name} (whole)`] = snapshot(node);
    if (quiet === 1 && steps.length && JSON.stringify(steps[steps.length - 1].vars) === JSON.stringify(vars)) return;
    const step = op === undefined ? { line, vars } : { line, vars, op };
    if (quiet === 2) {
      step.ret = true;
      if (value !== undefined) step.value = snapshot(value);
    }
    steps.push(step);
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
  let params = [];
  // the arguments as given (a learner's first statement may already change a parameter)
  let input;
  try {
    input = question.kind === 'design' ? undefined : snapshot(resolveArgs(test));
  } catch {
    input = undefined;
  }
  const base = () => ({ language: LANGUAGE, steps, stride, truncated: stride > 1, calls, ops, logs, params, input });

  let target;
  try {
    target = compile(instrument(code), exportNameOf(question), logs, { __rec: rec, __rv: (line, getters, value) => (rec(line, getters, 2, value), value) });
  } catch (err) {
    return { language: LANGUAGE, steps: [], stride, truncated: false, compileError: `${err.name}: ${err.message}`, logs };
  }
  if (target === undefined) return { language: LANGUAGE, steps: [], stride, truncated: false, compileError: `Could not find "${exportNameOf(question)}". Keep the provided signature name.`, logs };

  params = paramNamesOf(target);
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
