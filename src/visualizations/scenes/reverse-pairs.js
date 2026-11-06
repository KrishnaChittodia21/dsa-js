// Reverse Pairs: count pairs i < j with nums[i] > 2 × nums[j]. Two pictures: merge-sort counting (two sorted halves;
// once a left value is more than double a right value, every left value after it is too) and the reference's left-to-
// right scan (for each number, how many earlier numbers are more than double it, counted with a Fenwick tree).
import { firstInt, options, row } from './util.js';

const COUNT = ['count', 'pairs', 'total', 'res', 'ans', 'result', 'cnt', 'c'];
const WORK = ['a', 'arr', 'work', 'copy', 'w', 'tmp', 'temp', 'sorted'];
const LEFT = ['left', 'L', 'leftArr', 'l'];
const RIGHT = ['right', 'R', 'rightArr', 'r'];
const isInt = Number.isInteger;
const show = (l) => `[${l.join(', ')}]`;
const par = (x) => (x < 0 ? `(${x})` : `${x}`);

/** the two sorted halves and the pointers into them (relative), or null */
function halves(vars, params) {
  const L = LEFT.map((k) => row(vars[k])).find(Boolean);
  const R = RIGHT.map((k) => row(vars[k])).find(Boolean);
  if (L && R && isInt(vars.i) && isInt(vars.j)) return { L, R, i: vars.i, j: vars.j };
  const mid = vars.mid ?? vars.m;
  const lo = [vars.lo, vars.low, vars.start, vars.l, vars.left].find(isInt);
  const hi = [vars.hi, vars.high, vars.end, vars.r, vars.right].find(isInt);
  const a = [...WORK, params[0]].map((k) => row(vars[k])).find(Boolean);
  if (!a || ![mid, lo, hi].every(isInt) || !isInt(vars.i) || !isInt(vars.j) || !(lo < mid && mid < hi)) return null;
  return { L: a.slice(lo, mid), R: a.slice(mid, hi), i: vars.i - lo, j: vars.j - mid };
}

/** what a count step added, explained: { text, question, explain } or null. `src` is the count line. */
function explain(vars, d, src, params) {
  const h = halves(vars, params);
  if (h) {
    const { L, R, i, j } = h;
    // style B: for right value R[j], the left values from i on are all > 2 × R[j]
    const b = () => {
      const r = R[j];
      if (r === undefined || d !== L.length - i || (d > 0 && !(L[i] > 2 * r))) return null;
      const w = L.slice(i);
      return {
        text: d ? `${L[i]} > 2 × ${par(r)}: it and everything after it in the left half pair with ${r} (+${d})` : `no left value is more than 2 × ${r} = ${2 * r}: +0`,
        question: `Left half ${show(L)} (sorted), right value ${r}. How many pairs with ${r} are added?`,
        size: L.length + R.length,
        why: d ? `Left values > 2 × ${par(r)} = ${2 * r}: ${show(w)}. The half is sorted, so once one is big enough, all after it are too.` : `No left value is more than ${2 * r}.`,
      };
    };
    // style A: left value L[i] beats the first j right values
    const a = () => {
      const x = L[i];
      if (x === undefined || d !== j || !R.slice(0, j).every((v) => x > 2 * v)) return null;
      const beat = R.slice(0, j);
      return {
        text: d ? `${x} > 2 × each of ${show(beat)}: it pairs with ${d === 1 ? 'that right value' : `those ${d} right values`} (+${d})` : `${x} is not more than double any right value: +0`,
        question: `Left value ${x}, right half ${show(R)} (sorted). With how many right values does ${x} make a pair?`,
        size: L.length + R.length,
        why: d ? `Right values r with ${x} > 2r: ${show(beat)}. Bigger left values only beat more, so j never moves back.` : `${x} is not more than 2 × ${R[0]}.`,
      };
    };
    const order = /-\s*i\b/.test(src) ? [b, a] : /\bj\s*-/.test(src) ? [a, b] : [b, a];
    return order[0]() || order[1]();
  }
  // the scan: earlier numbers more than double nums[j]
  const nums = row(vars[params[0]]);
  const j = ['j', 'i', 'k', 'idx'].find((k) => isInt(vars[k]) && nums && vars[k] < nums.length);
  if (!nums || !j) return null;
  const x = nums[vars[j]];
  const earlier = nums.slice(0, vars[j]);
  const big = earlier.filter((v) => v > 2 * x);
  if (big.length !== d) return null;
  if (!earlier.length) return { text: `nothing comes before ${x}: +0`, size: 0 };
  return {
    size: earlier.length + 1,
    text: `${x}: ${d} of the earlier numbers ${show(earlier)} ${d === 1 ? 'is' : 'are'} > 2 × ${par(x)} = ${2 * x} (+${d})`,
    question: `Number ${x}; earlier numbers ${show(earlier)}. How many of them are more than 2 × ${par(x)}?`,
    why: d ? `${show(big)} are > ${2 * x}. The tree counts the earlier numbers ≤ ${2 * x}; the rest are the pairs.` : `None is more than ${2 * x}.`,
  };
}
const countName = (vars, params) => firstInt(Object.fromEntries(Object.entries(vars).filter(([k]) => !params.includes(k))), COUNT)[0];
const isCountLine = (src, c) => !!c && new RegExp(`\\b${c}\\s*(\\+=|=\\s*${c}\\s*\\+)`).test(src || '');

export default {
  id: 'reverse-pairs',
  metaphor: 'Who is more than double whom',
  caption: 'A pair is an earlier number more than twice a later one. In two sorted halves, once a left value is more than double a right value, every left value after it is too, so whole runs are counted at once.',
  range: [['lo', 'hi']],
  pointers: ['i', 'j', 'mid'],
  narrate(ctx) {
    const c = countName(ctx.vars, ctx.params);
    if (!c || !isCountLine(ctx.src, c) || !isInt(ctx.prev[c])) return null;
    const d = ctx.vars[c] - ctx.prev[c];
    const e = explain(ctx.vars, d, ctx.src, ctx.params);
    return e ? `${e.text}, ${ctx.vars[c]} so far` : null;
  },
  // right before a count step: how many pairs does it add?
  predict(ctx) {
    if (!ctx.next) return null;
    const c = countName(ctx.vars, ctx.params);
    const src = ctx.lines?.[ctx.next.line - 1];
    const n = ctx.next.vars;
    if (!c || !isInt(n[c]) || !isCountLine(src, c)) return null;
    const d = n[c] - ctx.vars[c];
    const e = explain(n, d, src, ctx.params);
    if (!e || !e.question || e.size < 3 || d < 0) return null;
    return options(e.question, d, [0, 1, 2, 3, d + 1].filter((x) => x !== d), e.why);
  },
  bugs: [
    {
      label: '>= instead of > (exactly double counts)',
      find: 'if (sorted[mid] <= t) lo = mid + 1;',
      replace: 'if (sorted[mid] < t) lo = mid + 1;',
      explain: 'Earlier numbers equal to 2 × nums[j] now count as pairs, but 2 > 2 × 1 is false: [2, 1, 4, 2, 8, 4] must give 0.',
    },
    {
      label: 'Compares with nums[j], not 2 × nums[j]',
      find: 'const k = upperBound(2 * nums[j]);',
      replace: 'const k = upperBound(nums[j]);',
      explain: 'That counts every inversion (earlier and bigger), not only the ones more than double: [5, 4, 3, 2, 1] gives 10 instead of 4.',
    },
  ],
};
