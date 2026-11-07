// Range Sum Query - Immutable (design class). Mile markers along a road: marker k reads the total of the first k
// numbers, so the sum of any stretch is one reading minus another. The prefix array is found among this's fields
// (or a local array that becomes one), with or without the leading 0.
import { options, row } from './util.js';

const NAME = /pre|sum|cum|acc|run|^p$|^ps$|^s$/i;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** the numbers the constructor was given */
function numsOf(ctx) {
  const a = ctx.ops?.[0]?.args?.[0];
  return row(a) && a.every(isNum) ? a : null;
}
/** [label, array] of the prefix array: a field of this, else a local being built (any length up to n + 1) */
function prefixOf(vars, n) {
  const o = vars?.this?.$obj || {};
  const cands = [...Object.entries(o).map(([k, v]) => [`this.${k}`, v]), ...Object.entries(vars || {}).filter(([k]) => k !== 'this')]
    .filter(([k, v]) => NAME.test(k.replace('this.', '')) && row(v) && v.every(isNum) && v.length <= n + 1);
  cands.sort((x, y) => y[1].length - x[1].length);
  return cands[0] || null;
}
/** true = marker 0 is the empty total 0, false = marker k already includes number k, null = cannot tell yet */
function leadingZero(a, nums) {
  if (a.length === nums.length + 1) return true;
  if (!a.length || nums[0] === 0) return a.length === nums.length && a.length > 1 ? false : null;
  return a[0] === 0 ? true : a[0] === nums[0] ? false : null;
}
/** the one marker index written between two snapshots of the same array (a push or an overwrite), else -1 */
function written(before, after) {
  if (after.length === before.length + 1 && before.every((x, i) => x === after[i])) return after.length - 1;
  if (after.length !== before.length) return -1;
  const d = after.map((x, i) => (x === before[i] ? -1 : i)).filter((i) => i >= 0);
  return d.length === 1 ? d[0] : -1;
}
const isQuery = (ctx) => ctx.op > 0 && /sum/i.test(ctx.ops?.[ctx.op]?.name || '');

export default {
  id: 'range-sum-query-immutable',
  metaphor: 'Mile markers: subtract two readings',
  maxPredicts: 2,
  caption: 'Marker k shows the total of the first k numbers (marker 0 = 0, before the road starts). The sum of any stretch is the marker after it minus the marker at its start: two reads, no loop.',
  narrate(ctx) {
    const nums = numsOf(ctx);
    if (!nums) return null;
    const n = nums.length;
    const p = prefixOf(ctx.vars, n);
    if (!p) return null;
    const [name, a] = p;
    if (isQuery(ctx)) {
      const zero = leadingZero(a, nums);
      const [l, r] = ctx.ops[ctx.op].args || [];
      if (!Number.isInteger(l) || !Number.isInteger(r) || l < 0 || r >= n || l > r) return null;
      if (zero) return `sum of numbers ${l}..${r} = marker ${r + 1} (${a[r + 1]}) − marker ${l} (${a[l]}) = ${a[r + 1] - a[l]}`;
      if (zero !== false) return null;
      return l === 0 ? `sum of numbers 0..${r} is just reading ${r} = ${a[r]}` : `sum of numbers ${l}..${r} = reading ${r} (${a[r]}) − reading ${l - 1} (${a[l - 1]}) = ${a[r] - a[l - 1]}`;
    }
    const before = prefixOf(ctx.prev, n);
    if (!before || before[0] !== name) return a.length && a.every((x) => x === 0) ? `${a.length} blank markers${a.length === n + 1 ? ': marker 0 stays 0, the total before any number' : ''}` : null;
    const k = written(before[1], a);
    if (k < 0) return null;
    if (k === 0) return a[0] === 0 ? 'marker 0 = 0: the total before any number' : a[0] === nums[0] ? `marker 0 = number 0 alone: ${a[0]}` : null;
    const j = leadingZero(a, nums) ? k - 1 : k; // the number this marker adds
    if (j >= n || a[k] !== a[k - 1] + nums[j]) return null;
    return `marker ${k} = marker ${k - 1} (${a[k - 1]}) + number ${j} (${nums[j]}) = ${a[k]}`;
  },
  // before a marker is written (not the first one): what does it read?
  predict(ctx) {
    if (!ctx.next || isQuery(ctx)) return null;
    const nums = numsOf(ctx);
    if (!nums) return null;
    const p = prefixOf(ctx.vars, nums.length);
    const q = prefixOf(ctx.next.vars, nums.length);
    if (!p || !q || p[0] !== q[0]) return null;
    const [, a] = p;
    const b = q[1];
    const k = written(a, b);
    const zero = leadingZero(b, nums);
    if (k < 2 || zero === null) return null;
    const j = zero ? k - 1 : k;
    if (j >= nums.length || b[k] !== a[k - 1] + nums[j]) return null;
    // a running total that just changed already shows the answer (sum += x; then push(sum))
    if (Object.entries(ctx.vars).some(([key, v]) => v === b[k] && ctx.prev[key] !== v && !/^(i|j|k|idx|index)$/.test(key))) return null;
    return options(
      `Marker ${k - 1} reads ${a[k - 1]} and the next number is ${nums[j]}. What does marker ${k} read?`,
      b[k],
      [a[k - 1], nums[j], a[k - 1] - nums[j], b[k] + (nums[j + 1] ?? 1)].filter((x) => x !== b[k]),
      `Each marker is the one before it plus the next number: ${a[k - 1]} + ${nums[j]} = ${b[k]}.`,
    );
  },
  bugs: [
    {
      label: 'prefix[right] − prefix[left]: last number dropped',
      find: 'this.prefix[right + 1] - this.prefix[left]',
      replace: 'this.prefix[right] - this.prefix[left]',
      explain: 'With the leading 0, marker right only covers numbers up to right − 1, so nums[right] is left out: sumRange(2, 2) gives 0.',
    },
    {
      label: 'Build stops one number early',
      find: 'i < nums.length;',
      replace: 'i < nums.length - 1;',
      explain: 'The last marker is never written and stays 0, so every stretch that ends at the last number comes out wrong.',
    },
  ],
};
