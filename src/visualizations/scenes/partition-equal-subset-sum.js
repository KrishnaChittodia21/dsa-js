// Partition Equal Subset Sum: fill one bag to exactly half the total. A row of reachable sums (0/1 or true/false,
// or a Set of sums) grows one number at a time: sum s becomes reachable when s − x already was. Walking s
// downwards keeps each number to one use. Works with a 1-D row, a 2-D table (numbers × sums) or a Set.
import { changedIdx, firstInt, options, row } from './util.js';

const NUM = ['x', 'num', 'n', 'val', 'v', 'item', 'w', 'a', 'cur', 'el', 'k'];
const IDX = ['i', 'j', 'idx'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
// set-up lines and hand-overs (sums = nextSums) are not new sums
const SETUP = /new Array|new Uint8Array|new Int8Array|\.fill\(|Array\.from|\.slice\(|\[\.\.\.|new Set\(|^\s*[\w$]+\s*=\s*[\w$]+\s*;/;
const on = (v) => v === true || v === 1;

/** the number being placed now: a loop variable holding one of nums, else nums[i] */
function numberNow(vars, nums) {
  if (!row(nums)) return undefined;
  const [, x] = firstInt(vars, NUM);
  if (Number.isInteger(x) && nums.includes(x)) return x;
  const [, i] = firstInt(vars, IDX);
  return Number.isInteger(i) ? nums[i] ?? nums[i - 1] : undefined;
}

/** a sum that just became reachable: { s, reach } with reach = what is reachable now (for the narration) */
function newSum(vars, prev, params) {
  for (const k of Object.keys(vars)) {
    if (params.includes(k)) continue;
    const a = vars[k];
    const b = prev[k];
    if (a?.$set && b?.$set) {
      const was = new Set(b.$set);
      const added = a.$set.filter((s) => !was.has(s));
      if (added.length === 1 && Number.isInteger(added[0])) return { s: added[0], has: (s) => a.$set.includes(s), before: (s) => was.has(s) };
      continue;
    }
    if (isGrid(a) && isGrid(b) && a.length === b.length) {
      const hits = [];
      a.forEach((r, i) => changedIdx(r, b[i]).forEach((j) => hits.push([i, j])));
      if (hits.length !== 1) continue;
      const [i, j] = hits[0];
      if (!on(a[i][j]) || i === 0) return null;
      // row i = after the first i numbers: s − x comes from the row above
      return { s: j, row: i, has: (s) => on(a[i][s]), before: (s) => on(a[i - 1]?.[s]) };
    }
    if (row(a) && row(b) && a.length === b.length && a.length > 1) {
      const d = changedIdx(a, b);
      if (d.length !== 1 || !on(a[d[0]])) continue;
      return { s: d[0], has: (s) => on(a[s]), before: (s) => on(b[s]) };
    }
  }
  return null;
}

/** total and half, found by value (the learner's names vary) */
function totals(vars, nums) {
  const total = row(nums) ? nums.reduce((p, q) => p + q, 0) : NaN;
  const vals = Object.values(vars);
  return { total, hasTotal: vals.includes(total), half: total / 2 };
}

export default {
  id: 'partition-equal-subset-sum',
  metaphor: 'Filling one bag to exactly half',
  caption: 'Lit cells are the bag weights you can make from the numbers placed so far. A number x lights sum s when s − x was already lit. Reach half the total and the rest is the other equal half.',
  compare: 'dp',
  narrate(ctx) {
    const nums = ctx.input?.[0];
    if (!row(nums)) return null;
    const { total, hasTotal, half } = totals(ctx.vars, nums);
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (total % 2 && hasTotal && !ctx.value) return `the total ${total} is odd: two equal halves are impossible → false`;
      return ctx.value ? `one bag reaches ${half}: the rest is the other ${half} → true` : `no bag weight of exactly ${half} can be made → false`;
    }
    if (SETUP.test(ctx.src)) return null;
    const hit = newSum(ctx.vars, ctx.prev, ctx.params);
    if (!hit) return null;
    if (hit.s === 0) return 'an empty bag weighs 0: the one sum reachable before any number';
    const x = numberNow(ctx.vars, nums);
    const goal = hit.s === half ? ` — that is half of ${total}!` : '';
    if (Number.isInteger(x) && hit.s - x >= 0 && hit.before(hit.s - x)) return `${hit.s} is reachable: ${hit.s - x} was, + this ${x}${goal}`;
    return `${hit.s} is now reachable${goal}`;
  },
  // while number x is being placed: does sum s light up now?
  predict(ctx) {
    if (!ctx.next || SETUP.test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const nums = ctx.input?.[0];
    const nv = ctx.next.vars;
    const x = numberNow(nv, nums);
    const [sName, s] = firstInt(nv, ['s', 'j', 'sum', 't', 'cap', 'c']);
    // the step that arrives at a new sum is the one that decides it
    if (!Number.isInteger(x) || !sName || s === ctx.vars[sName]) return null;
    // the row (or Set) of sums in both steps
    let now;
    let later;
    for (const k of Object.keys(nv)) {
      if (ctx.params.includes(k)) continue;
      if (row(nv[k]) && row(ctx.vars[k]) && nv[k].length === ctx.vars[k].length && nv[k].length > s) [now, later] = [ctx.vars[k], nv[k]];
    }
    if (!now || s - x < 1 || on(now[s])) return null;
    const lit = on(later[s]);
    const reachable = now.filter(on).length;
    // a "no" only once a few sums are reachable, and only for the top sum (the first one tried for this number)
    if (!lit && (reachable < 2 || s !== now.length - 1)) return null;
    if (changedIdx(later, now).some((k) => k !== s)) return null;
    return {
      question: `Placing ${x}: does a bag of exactly ${s} become possible now?`,
      options: ['Yes', 'No'],
      answer: lit ? 0 : 1,
      explain: lit ? `${s} − ${x} = ${s - x} was already reachable, so adding this ${x} makes ${s}.` : `${s} − ${x} = ${s - x} is not reachable (yet), so ${x} cannot top it up to ${s}.`,
    };
  },
  bugs: [
    {
      label: 'Walk the sums upwards',
      find: 'for (let s = target; s >= x; s--)',
      replace: 'for (let s = x; s <= target; s++)',
      explain: 'Going up, a sum lit by x is reused for x again in the same round, so one number is counted twice or more ([2] would fill 4).',
    },
    {
      label: 'Forget that the empty bag weighs 0',
      find: 'dp[0] = 1;',
      replace: '',
      explain: 'Every sum is built as "a smaller reachable sum + x"; without 0 lit at the start, nothing ever lights up and the answer is always false.',
    },
  ],
};
