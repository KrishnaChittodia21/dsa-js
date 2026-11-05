// Find All Numbers Disappeared in an Array (sign marking). Pass 1: every number v stamps its own locker v − 1 with a
// minus sign. Pass 2: a locker still unstamped means its number never came. Reads sign flips on the input array and
// the answer array that grows, so any names work.
import { changedIdx, firstInt, options, row } from './util.js';

const V = ['v', 'val', 'value', 'num', 'x', 'cur'];
const I = ['i', 'idx', 'k', 'p'];

/** [name, array] of a flat array (not the input) that grew by exactly one item at the end */
function grown(vars, prev, skip) {
  for (const [k, v] of Object.entries(vars)) {
    const b = k !== skip && row(v) && row(prev[k]);
    if (b && v.length === b.length + 1 && b.every((x, i) => x === v[i])) return [k, v];
  }
  return null;
}
/** the input: the parameter, else the first flat number array (parameters are recorded first) */
function numsOf(vars, pName) {
  if (row(vars[pName])) return [pName, vars[pName]];
  return Object.entries(vars).find(([, v]) => row(v) && v.length && v.every(Number.isInteger)) || [];
}

export default {
  id: 'find-all-numbers-disappeared-in-an-array',
  metaphor: 'Every number has its own locker',
  caption: 'Number v owns locker v − 1. Pass 1 stamps the locker of every number that shows up with a minus sign; pass 2 walks the lockers, and one still without a stamp belongs to a number that never came.',
  compare: 'nums',
  narrate(ctx) {
    const [name, a] = numsOf(ctx.vars, ctx.params[0]);
    if (!a) return null;
    const b = row(ctx.prev[name]);
    const d = b ? changedIdx(a, b) : [];
    if (d.length === 1) {
      const k = d[0];
      if (a[k] < 0 && b[k] === -a[k]) return `${k + 1} shows up: stamp locker ${k} (its ${b[k]} becomes ${a[k]})`;
      if (a[k] > 0 && b[k] === -a[k]) return `locker ${k} flips back to ${a[k]}: the stamp for ${k + 1} is lost`;
    }
    const g = grown(ctx.vars, ctx.prev, name);
    if (g) {
      const m = g[1][g[1].length - 1];
      const found = `missing [${g[1].join(', ')}]`;
      return a[m - 1] > 0 ? `locker ${m - 1} was never stamped (still ${a[m - 1]}): ${m} never showed up · ${found}` : `${m} goes into the answer · ${found}`;
    }
    const [vName, v] = firstInt(ctx.vars, V);
    if (vName && v !== ctx.prev[vName] && v >= 1 && a[v - 1] < 0) return `${v} shows up again: locker ${v - 1} is already stamped (${a[v - 1]}), it stays stamped`;
    return null;
  },
  // pass 1, a number read from a stamped cell: which locker does it stamp? pass 2: which number is missing?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, a] = numsOf(ctx.vars, ctx.params[0]);
    const na = name && row(ctx.next.vars[name]);
    if (!a || !na || na.length !== a.length) return null;
    const g = grown(ctx.next.vars, ctx.vars, name);
    if (g) {
      const m = g[1][g[1].length - 1];
      const j = m - 1;
      if (!(a[j] > 0)) return null;
      return options(`Locker ${j} still holds ${a[j]}: nobody stamped it. Which number goes into the answer?`, m, [j, a[j], m + 1], `Locker ${j} belongs to number ${m}: numbers start at 1, indexes at 0.`);
    }
    const d = changedIdx(na, a);
    if (d.length !== 1 || !(a[d[0]] > 0) || na[d[0]] >= 0) return null;
    const k = d[0];
    const [, i] = firstInt(ctx.vars, I);
    if (!Number.isInteger(i) || !(a[i] < 0) || -a[i] !== k + 1) return null;
    if (a.filter((x) => x < 0).length * 2 < a.length) return null; // late in pass 1 only, so pass 2 gets asked too
    return options(`Cell ${i} holds ${a[i]}: someone stamped it earlier. Which locker does the number in it stamp?`, `locker ${k}`, [`locker ${k + 1}`, `none: ${a[i]} has no locker`, `locker ${i}`], `The minus is only a stamp; the number is still ${k + 1} (Math.abs), so it stamps locker ${k}.`);
  },
  bugs: [
    {
      label: 'Flip the sign instead of forcing it negative',
      find: 'nums[v - 1] = -Math.abs(nums[v - 1]);',
      replace: 'nums[v - 1] *= -1;',
      explain: 'A number that shows up twice flips its locker back to positive, so pass 2 reports it as missing (2 and 3 in [4,3,2,7,8,2,3,1]).',
    },
    {
      label: 'Push the locker index instead of the number',
      find: 'missing.push(j + 1)',
      replace: 'missing.push(j)',
      explain: 'Locker j belongs to number j + 1; pushing j reports every missing number one too small.',
    },
  ],
};
