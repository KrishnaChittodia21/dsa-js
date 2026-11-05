// Scene: Binary Tree Zigzag Level Order Traversal. A plough working a field row by row: the queue always walks a
// floor left to right, but every other floor is written down from the far end, like a plough turning at the edge.
// Works with seats filled by index (level[size - 1 - i]), push + reverse, or unshift / push.
import { row } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const NODE = ['node', 'n', 'cur', 'curr', 't', 'x', 'front'];
const SIZE = ['size', 'levelSize', 'len', 'count', 'cnt', 'width', 'sz', 'levelLen'];
const sizeOf = (vars) => SIZE.find((k) => Number.isInteger(vars[k]));
const nodeOf = (vars) => NODE.find((k) => isTree(vars[k]));
const lines = (vars) => Object.entries(vars).filter(([k, v]) => /queue|^q$|line|frontier|curr|next/i.test(k) && Array.isArray(v) && v.length && v.every(isTree));
/** [name, child] when a child was appended to a line (the rest kept), not when the line was swapped for the next one */
function joined(vars, prev) {
  for (const [k, v] of lines(vars)) {
    const old = prev[k];
    if (Array.isArray(old) && v.length === old.length + 1 && old.every((x, i) => isTree(x) && x.$ids[0] === v[i].$ids[0])) return [k, v[v.length - 1]];
  }
  return null;
}
/** [name, rows] of the finished floors: an array of rows that is not a parameter */
const floorsOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && Array.isArray(v) && v.length > 0 && v.every((r) => row(r)));
/** [name, row] of the floor being written (a row of numbers / empty seats under a level-like name) */
const levelOf = (vars) => Object.entries(vars).find(([k, v]) => /level|row|cur|vals|floor|tmp|temp|arr|list/i.test(k) && row(v));
const dirOf = (vars) => Object.entries(vars).find(([k, v]) => typeof v === 'boolean' && /left|right|dir|zig|flip|rev|order/i.test(k));
/** where one value went between two versions of the floor row: { seat, value, how } */
function placed(a, b) {
  if (!row(a) || !row(b)) return null;
  if (a.length === b.length) {
    const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
    return d.length === 1 && (b[d[0]] === null || b[d[0]] === undefined) ? { seat: d[0], value: a[d[0]], how: 'seat' } : null;
  }
  if (a.length !== b.length + 1) return null;
  if (!b.length) return { seat: 0, value: a[0], how: 'first' };
  if (a.slice(0, -1).every((x, i) => x === b[i])) return { seat: a.length - 1, value: a[a.length - 1], how: 'back' };
  if (a.slice(1).every((x, i) => x === b[i])) return { seat: 0, value: a[0], how: 'front' };
  return null;
}

export default {
  id: 'binary-tree-zigzag-level-order-traversal',
  metaphor: 'A plough turning at the end of each row',
  caption: 'The line (queue) always walks a floor left to right, so children keep their normal order. Only the writing turns: every other floor is filled from the far end, so it reads right to left.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) return `all ${ctx.value.length} floors written, turning at every edge: ${JSON.stringify(ctx.value)}`;
    const floors = floorsOf(ctx.vars, ctx.params);
    const before = floors && ctx.prev[floors[0]];
    if (floors && (Array.isArray(before) || before === undefined) && floors[1].length === (before?.length ?? 0) + 1 && floors[0] in ctx.prev) {
      const r = floors[1][floors[1].length - 1];
      return `floor ${floors[1].length} is done: [${r.join(', ')}]`;
    }
    const dir = dirOf(ctx.vars);
    if (dir && dir[0] in ctx.prev && ctx.prev[dir[0]] !== dir[1]) return `turn the plough: the next floor is written ${/left/i.test(dir[0]) === dir[1] ? 'left to right' : 'right to left'}`;
    const lv = levelOf(ctx.vars);
    const p = lv && placed(lv[1], ctx.prev[lv[0]]);
    if (p) {
      if (p.how === 'seat') return `${p.value} sits in seat ${p.seat} of ${lv[1].length}${p.seat === lv[1].length - 1 && lv[1].length > 1 && lv[1].slice(0, -1).every((x) => x === null) ? ': filled from the far end' : ''}`;
      if (p.how === 'first') return `${p.value} is the first one written on this floor`;
      return p.how === 'front' ? `${p.value} is written in front of the others: this floor reads right to left` : `${p.value} is written after the others`;
    }
    const j = joined(ctx.vars, ctx.prev);
    if (j) return `child ${j[1].$tree[0]} joins the line, in normal left-to-right order`;
    const s = sizeOf(ctx.vars);
    if (s && ctx.vars[s] !== ctx.prev[s] && /=/.test(ctx.src)) {
      const d = dirOf(ctx.vars);
      return `a new floor of ${ctx.vars[s]} ${ctx.vars[s] === 1 ? 'node' : 'nodes'}${d ? `, written ${/left/i.test(d[0]) === d[1] ? 'left to right' : 'right to left'}` : ''}`;
    }
    const k = nodeOf(ctx.vars);
    if (k && ctx.prev[k]?.$ids?.[0] !== ctx.vars[k].$ids[0]) return `node ${ctx.vars[k].$tree[0]} steps out of the line`;
    return null;
  },
  // a node's value is about to be written: which seat does it take?
  predict(ctx) {
    if (!ctx.next) return null;
    const lv = levelOf(ctx.vars);
    const after = lv && ctx.next.vars[lv[0]];
    const p = lv && placed(after, lv[1]);
    if (!p || p.how === 'first') return null;
    const v = p.value;
    if (p.how === 'seat') {
      const n = lv[1].length;
      if (n < 2) return null;
      const free = lv[1].map((x, i) => (x === null || x === undefined ? i : -1)).filter((i) => i >= 0);
      const opts = Array.from({ length: n }, (_, i) => `seat ${i}`).slice(0, 4);
      if (!opts.includes(`seat ${p.seat}`)) return null;
      return {
        question: `Node ${v} is next on a floor with ${n} seats [${lv[1].map((x) => x ?? '_').join(', ')}]. Which seat does it take?`,
        options: opts,
        answer: p.seat,
        explain: `The line hands nodes over left to right. ${free[0] === free[free.length - 1] ? 'Only one seat is still free' : p.seat === free[0] ? 'This floor reads left to right, so it takes the first free seat from the left' : 'This floor reads right to left, so seats fill from the far end'}: seat ${p.seat}.`,
      };
    }
    if (lv[1].length < 1) return null;
    return {
      question: `Node ${v} is next; the floor so far is [${lv[1].join(', ')}]. Where is ${v} written?`,
      options: ['At the back (after the others)', 'At the front (before the others)'],
      answer: p.how === 'front' ? 1 : 0,
      explain: p.how === 'front' ? 'This floor reads right to left, so each new node goes in front of the ones already written.' : 'The node is added after the ones already written (on a right-to-left floor the row is turned around at the end).',
    };
  },
  bugs: [
    {
      label: 'Never turn the plough',
      find: 'leftToRight = !leftToRight;',
      replace: '',
      explain: 'Without the flip every floor is written left to right, so the answer is a plain level order with no zigzag.',
    },
    {
      label: 'Turn after every node, not every floor',
      find: 'level[leftToRight ? i : size - 1 - i] = node.val;',
      replace: 'level[leftToRight ? i : size - 1 - i] = node.val; leftToRight = !leftToRight;',
      explain: 'The direction belongs to the whole floor. Flipping it per node sends neighbours to opposite ends, so seats are overwritten or left empty.',
    },
  ],
};
