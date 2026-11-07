// Scene: Convert Sorted Array to BST. Lifting a sorted row of beads by its middle: the middle bead becomes the node,
// the beads to its left hang down on the left, those to its right on the right, and each half is lifted the same
// way. Works with index bounds (lo / hi, left / right, l / r, start / end) or with slices of the array.
import { options, row } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
  ['s', 'e'],
];
const MID = ['mid', 'm', 'middle', 'idx', 'i'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const midOf = (vars) => MID.find((k) => Number.isInteger(vars[k]));
const count = (t) => t.$ids.filter((x) => x !== null && x !== undefined).length;
/** [lo, hi, values] of the piece this call works on: index bounds over the array, or the (sliced) array itself */
function pieceOf(ctx, vars) {
  const a = row(vars[ctx.params[0]]);
  if (!a) return null;
  const p = pairOf(vars);
  if (!p) return [0, a.length - 1, a, a];
  const lo = vars[p[0]];
  const hi = vars[p[1]];
  return [lo, hi, a.slice(Math.max(0, lo), hi + 1), a];
}
const list = (vals) => (vals.length > 6 ? `[${vals.slice(0, 3).join(', ')} … ${vals[vals.length - 1]}]` : `[${vals.join(', ')}]`);
/** a new call started: other bounds than the step before, and no middle picked yet */
// the first step counts only when it is not the line declaring an inner helper
const fresh = (ctx) => !midOf(ctx.vars) && !samePiece(ctx.vars, ctx.prev, ctx.params[0]) && (Object.keys(ctx.prev).length > 0 || !/=>|function/.test(ctx.src));
/** the same call's piece in both steps: same bounds, same (possibly sliced) array */
function samePiece(a, b, arr) {
  const x = row(a[arr]);
  const y = row(b[arr]);
  if (!x || !y || x.length !== y.length || x.some((v, i) => v !== y[i])) return false;
  const p = pairOf(a);
  return !p || (a[p[0]] === b[p[0]] && a[p[1]] === b[p[1]]);
}

export default {
  id: 'convert-sorted-array-to-binary-search-tree',
  metaphor: 'Lift a row of beads by its middle',
  caption: 'Pick up the sorted row by its middle bead: it becomes the node, the smaller beads hang on its left, the bigger ones on its right. Each side is lifted by its own middle, so both sides stay the same height (within 1).',
  range: PAIRS,
  pointers: [...PAIRS.flat(), ...MID],
  narrate(ctx) {
    if (ctx.ret && !ctx.next && isTree(ctx.value)) return `the whole row hangs from ${ctx.value.$tree[0]}: ${count(ctx.value)} beads in one tree`;
    const pc = pieceOf(ctx, ctx.vars);
    if (ctx.ret && ctx.value === null) {
      if (pc && pc[2].length === 0 && pairOf(ctx.vars)) return `${pc[0]} > ${pc[1]}: no beads left on this side, it stays empty`;
      return 'no beads left on this side: it stays empty';
    }
    if (ctx.ret && isTree(ctx.value)) {
      const t = ctx.value;
      const L = t.$tree[1];
      const R = t.$tree[2];
      const n = count(t);
      if (n === 1) return `${t.$tree[0]} is a single bead: a leaf, nothing hangs below it`;
      const sides = [L !== null && L !== undefined ? `${L} on its left` : 'nothing on its left', R !== null && R !== undefined ? `${R} on its right` : 'nothing on its right'];
      return `${t.$tree[0]} is tied with ${sides.join(' and ')} (${n} beads hang from it)`;
    }
    if (!pc) return null;
    const [lo, hi, vals, a] = pc;
    const mk = midOf(ctx.vars);
    if (mk && ctx.vars[mk] !== ctx.prev[mk] && samePiece(ctx.vars, ctx.prev, ctx.params[0])) {
      const m = ctx.vars[mk];
      if (m < 0 || m >= a.length) return null;
      const left = m - lo;
      const right = hi - m;
      return `lift by the middle: ${a[m]} (index ${m}); ${left} bead${left === 1 ? ' hangs' : 's hang'} left, ${right} on the right`;
    }
    if (fresh(ctx) && vals.length) return pairOf(ctx.vars) ? `a new piece: indexes ${lo}..${hi} = ${list(vals)}` : `a new piece: ${list(vals)}`;
    // a node made, or one of its sides hung under it
    const hung = ctx.src.match(/\.(left|right)\s*=/);
    for (const [k, t] of Object.entries(ctx.vars)) {
      if (/\(whole\)/.test(k) || !isTree(t)) continue;
      if (count(t) === 1 && /new\s+TreeNode/.test(ctx.src) && !hung) return `tie bead ${t.$tree[0]} as a new node`;
      if (hung && new RegExp(`\\b${k}\\.${hung[1]}\\s*=`).test(ctx.src)) {
        const c = t.$tree[hung[1] === 'left' ? 1 : 2];
        return c === null || c === undefined ? `nothing hangs on ${t.$tree[0]}'s ${hung[1]}` : `hang the ${hung[1]} side under ${t.$tree[0]}: it starts at ${c}`;
      }
    }
    return null;
  },
  // a piece of 2+ beads has arrived: which bead becomes its node?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !fresh(ctx)) return null;
    const pc = pieceOf(ctx, ctx.vars);
    const mk = midOf(nx.vars);
    if (!pc || !mk || pc[2].length < 2) return null;
    const [lo, hi, , a] = pc;
    const m = nx.vars[mk];
    if (!samePiece(ctx.vars, nx.vars, ctx.params[0]) || m < 0 || m >= a.length) return null;
    const even = (hi - lo + 1) % 2 === 0;
    return options(
      `Which bead of ${list(a.slice(lo, hi + 1))} becomes this piece's node?`,
      a[m],
      [a[lo], a[hi], a[Math.min(hi, m + 1)], a[Math.max(lo, m - 1)]],
      `The middle bead (index ${m}) keeps both sides equally long${even ? ': with an even count either middle works, this code takes the ' + (m === (lo + hi) >> 1 ? 'left' : 'right') + ' one' : ''}.`,
    );
  },
  bugs: [
    {
      label: 'Root at the first bead, not the middle',
      find: 'const mid = (lo + hi) >> 1;',
      replace: 'const mid = lo;',
      explain: 'Every node takes the smallest bead of its piece, so nothing ever hangs on the left: the tree becomes a chain leaning right, not balanced.',
    },
    {
      label: 'Stop one bead too early',
      find: 'if (lo > hi) return null;',
      replace: 'if (lo >= hi) return null;',
      explain: 'A piece of exactly one bead (lo === hi) is treated as empty, so every leaf is dropped and values go missing from the tree.',
    },
  ],
};
