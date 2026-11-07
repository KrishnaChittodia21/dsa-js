// Range Sum Query - Mutable (design class): a Fenwick tree as a row of boxes. Box k (1-based) holds the total of a
// block of numbers that ends at number k − 1 and is lowbit(k) long; an update climbs k += lowbit(k) through every box
// whose block holds the changed number, and a prefix sum walks down k −= lowbit(k), adding one box per block.
import { functionAt, options, row } from './util.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const TREE = /tree|bit|fen|^ft$|^t$|sums?$|boxes/i;
const IDX = ['k', 'i', 'j', 'idx', 'x', 'p', 'pos', 'node'];
const low = (k) => k & -k;
const block = (k) => (low(k) === 1 ? `number ${k - 1}` : `numbers ${k - low(k)}..${k - 1}`);
const sumOf = (a, l, r) => a.slice(l, r + 1).reduce((s, x) => s + x, 0);

const nOf = (ctx) => (row(ctx.ops?.[0]?.args?.[0]) ? ctx.ops[0].args[0].length : null);
/** [name, row] of the Fenwick array: a field of this (or a local) of length n + 1 with a tree-like name */
function treeOf(vars, n) {
  const o = vars?.this?.$obj || {};
  const c = [...Object.entries(o), ...Object.entries(vars || {}).filter(([k]) => k !== 'this')].find(([k, v]) => TREE.test(k) && row(v) && v.length === n + 1 && v.every(isNum));
  return c || null;
}
/** the current numbers: a field of this of length n that is not the tree */
function numsOf(vars, n) {
  const o = vars?.this?.$obj || {};
  const c = Object.entries(o).find(([k, v]) => !TREE.test(k) && row(v) && v.length === n && v.every(isNum));
  return c ? c[1] : null;
}
/** the one box written between two snapshots of the tree, else -1 */
function written(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  const d = b.map((x, i) => (x === a[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 1 ? d[0] : -1;
}
const opName = (ctx) => ctx.ops?.[ctx.op]?.name || '';
const sign = (d) => (d >= 0 ? `+${d}` : `−${-d}`);

export default {
  id: 'range-sum-query-mutable',
  metaphor: 'Boxes that each hold a block total',
  caption: 'Box k holds the sum of a block of numbers ending at number k − 1, lowbit(k) numbers long (box 4 holds numbers 0..3). An update climbs through every box whose block holds the number; a sum walks down, one box per block.',
  narrate(ctx) {
    const n = nOf(ctx);
    if (!n) return null;
    const t = treeOf(ctx.vars, n);
    const nums = numsOf(ctx.vars, n);
    const fn = ctx.lines ? functionAt(ctx.lines, ctx.line) : '';
    // the operation answers
    if (ctx.ret && isNum(ctx.value) && fn === opName(ctx) && /sum/i.test(fn)) {
      const [l, r] = ctx.ops[ctx.op].args || [];
      if (nums && Number.isInteger(l) && Number.isInteger(r) && sumOf(nums, l, r) === ctx.value) {
        return l === 0 ? `sum of numbers 0..${r} is just the total of 0..${r}: ${ctx.value}` : `sum of numbers ${l}..${r} = (total of 0..${r}) − (total of 0..${l - 1}) = ${ctx.value}`;
      }
      return `sumRange gives ${ctx.value}`;
    }
    // a prefix walk answers
    if (ctx.ret && isNum(ctx.value) && nums) {
      const i = IDX.find((k) => Number.isInteger(ctx.vars[k]) && ctx.vars[k] >= -1 && ctx.vars[k] < n && sumOf(nums, 0, ctx.vars[k]) === ctx.value);
      if (i !== undefined) return ctx.vars[i] < 0 ? 'nothing before number 0: total 0' : `numbers 0..${ctx.vars[i]} add up to ${ctx.value}`;
      return null;
    }
    if (!t) return null;
    const before = treeOf(ctx.prev, n);
    const k = before && before[0] === t[0] ? written(before[1], t[1]) : -1;
    if (k > 0) {
      const d = t[1][k] - before[1][k];
      return `box ${k} holds ${block(k)}: ${sign(d)} → ${t[1][k]}`;
    }
    // a prefix walk takes one box
    const sName = ['s', 'sum', 'total', 'res', 'acc', 'ans'].find((x) => isNum(ctx.vars[x]) && isNum(ctx.prev[x]) && ctx.vars[x] !== ctx.prev[x]);
    if (sName) {
      const kName = IDX.find((x) => Number.isInteger(ctx.vars[x]) && ctx.vars[x] > 0 && ctx.vars[x] <= n && ctx.vars[sName] - ctx.prev[sName] === t[1][ctx.vars[x]]);
      if (kName) {
        const b = ctx.vars[kName];
        return `take box ${b} (${block(b)}) = ${t[1][b]}: running total ${ctx.vars[sName]}`;
      }
    }
    // update stores the new number
    const old = numsOf(ctx.prev, n);
    if (nums && old) {
      const d = nums.map((x, i) => (x === old[i] ? -1 : i)).filter((i) => i >= 0);
      if (d.length === 1) return `number ${d[0]} is now ${nums[d[0]]} (was ${old[d[0]]})`;
    }
    return null;
  },
  predict(ctx) {
    const n = nOf(ctx);
    if (!n || !ctx.next) return null;
    // the last step of an operation, right before a sumRange: what will it return?
    const nx = ctx.ops?.[ctx.op + 1];
    const ans = row(ctx.result) ? ctx.result[ctx.op + 1] : undefined;
    if (ctx.next.op === ctx.op + 1 && nx && /sum/i.test(nx.name) && isNum(ans) && row(nx.args) && nx.args.length === 2) {
      const [l, r] = nx.args;
      const nums = numsOf(ctx.vars, n) || numsOf(ctx.next.vars, n);
      const right = nums && sumOf(nums, l, r) === ans;
      const orig = ctx.input?.[0]?.[0] || ctx.ops[0].args[0];
      return options(
        nums ? `The numbers are now [${nums.join(', ')}]. What does sumRange(${l}, ${r}) return?` : `What does sumRange(${l}, ${r}) return?`,
        ans,
        [nums ? sumOf(nums, l + 1, r) : ans + 1, nums ? sumOf(nums, l, r - 1) : ans - 1, row(orig) ? sumOf(orig, l, r) : ans + 2, ans + 1].filter((x) => x !== ans),
        right ? `${nums.slice(l, r + 1).join(' + ')} = ${ans}; both ends are included.` : `This code returns ${ans} here.`,
      );
    }
    // an update climbing the tree: which box takes the change next?
    if (!/update/i.test(opName(ctx))) return null;
    const t = treeOf(ctx.vars, n);
    const before = treeOf(ctx.prev, n);
    const after = treeOf(ctx.next.vars, n);
    if (!t || !before || !after || before[0] !== t[0] || after[0] !== t[0]) return null;
    const k = written(before[1], t[1]);
    const k2 = written(t[1], after[1]);
    if (k < 1 || k2 !== k + low(k)) return null;
    return options(
      `Box ${k} (${block(k)}) just took the change. Which box must change next?`,
      k2,
      [k + 1, 2 * k + 1, k - low(k), n].filter((x) => x > 0 && x <= n && x !== k && x !== k2),
      `Climb by the lowest set bit: ${k} + ${low(k)} = ${k2}. Box ${k2} holds ${block(k2)}, which includes the changed number too.`,
    );
  },
  bugs: [
    {
      label: 'Adds val instead of the change',
      find: 'this.#add(index, val - this.nums[index]);',
      replace: 'this.#add(index, val);',
      explain: 'The boxes already hold the old number, so they must get val − old. Adding val stacks both: updating −1 to 5 gives 4.',
    },
    {
      label: 'New value never stored',
      find: 'this.nums[index] = val;',
      replace: '',
      explain: 'The next update of the same index computes its change from the stale number, so 0 → 4 → 1 leaves 5 in the boxes instead of 1.',
    },
  ],
};
