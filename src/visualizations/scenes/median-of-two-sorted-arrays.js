// Median of Two Sorted Arrays: cut both sorted lines so the left pieces together hold half of all the numbers.
// Taking i from the shorter line forces j = half - i from the other; the cut is right when both left ends are <=
// both right ends. A binary search on i finds it. Works with the reference names (A/B, i/j, Aleft…) and a few
// common spellings (l1/r1/l2/r2, leftA/rightA…); a merge-style solution falls back to the generic notes.
import { firstInt, row } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const QUADS = [
  ['Aleft', 'Aright', 'Bleft', 'Bright'],
  ['aLeft', 'aRight', 'bLeft', 'bRight'],
  ['leftA', 'rightA', 'leftB', 'rightB'],
  ['l1', 'r1', 'l2', 'r2'],
  ['L1', 'R1', 'L2', 'R2'],
  ['left1', 'right1', 'left2', 'right2'],
  ['maxLeftA', 'minRightA', 'maxLeftB', 'minRightB'],
  ['maxLeft1', 'minRight1', 'maxLeft2', 'minRight2'],
  ['maxLeftX', 'minRightX', 'maxLeftY', 'minRightY'],
  ['aL', 'aR', 'bL', 'bR'],
];
const CUT_A = ['i', 'cut1', 'cutA', 'partA', 'partX', 'px', 'p1', 'mid'];
const CUT_B = ['j', 'cut2', 'cutB', 'partB', 'partY', 'py', 'p2'];
const HALF = ['half', 'halfLen', 'leftSize', 'need', 'total'];
const LEFT_MAX = ['leftMax', 'maxLeft', 'lmax', 'leftMaxVal'];
const isNum = (x) => typeof x === 'number' && !Number.isNaN(x);
const fmt = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : x);
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const quadOf = (vars) => QUADS.find((q) => q.every((k) => isNum(vars[k])));
// all four edges just became known (block-scoped consts), or the last one was just re-read (lets outside the loop)
const fresh = (ctx, q) => quadOf(ctx.prev) !== q || ctx.vars[q[3]] !== ctx.prev[q[3]];

// the shorter and the longer line, by the learner's parameter names (after any swap)
function lines(ctx) {
  const [p1, p2] = ctx.params;
  const a = row(ctx.vars[p1]);
  const b = row(ctx.vars[p2]);
  if (!a || !b) return null;
  return a.length <= b.length ? { s: p1, sl: a, g: p2, gl: b } : { s: p2, sl: b, g: p1, gl: a };
}

export default {
  id: 'median-of-two-sorted-arrays',
  metaphor: 'Cut two sorted lines in half',
  caption: 'Both arrays are sorted lines of numbers. Cut each one so the left pieces hold half of all the numbers together; the cut is right when every left number is ≤ every right number. The search moves the cut in the shorter line.',
  range: PAIRS,
  pointers: [],
  compare: 'i',
  narrate(ctx) {
    const L = lines(ctx);
    if (!L) return null;
    const total = L.sl.length + L.gl.length;
    const pl = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
    if (!Object.keys(ctx.prev).length) return `${L.s} is the shorter line (${pl(L.sl.length, 'number')}): the search moves its cut, ${L.g}'s cut follows`;
    const q = quadOf(ctx.vars);
    if (q && fresh(ctx, q)) {
      const [al, ar, bl, br] = q.map((k) => ctx.vars[k]);
      // no verdict: the prediction right after asks whether the cut is right
      return `the cut's edges: ${L.s} … ${fmt(al)} | ${fmt(ar)} …, ${L.g} … ${fmt(bl)} | ${fmt(br)} …`;
    }
    const [jName, j] = firstInt(ctx.vars, CUT_B);
    const [iName, i] = firstInt(ctx.vars, CUT_A);
    if (jName && iName && j !== ctx.prev[jName]) return `take ${i} from ${L.s} and ${j} from ${L.g}: ${pl(i + j, 'number')} on the left`;
    const [hName, half] = firstInt(ctx.vars, HALF);
    if (hName && !(hName in ctx.prev)) return `${pl(total, 'number')} in all: the left half holds ${half} of them${total % 2 ? ' (the extra one when odd)' : ''}`;
    const qr = quadOf(ctx.vars);
    if (qr && /return/.test(ctx.src)) {
      const [al, ar, bl, br] = qr.map((k) => ctx.vars[k]);
      const lm = Math.max(al, bl);
      const rm = Math.min(ar, br);
      if (al <= br && bl <= ar) return total % 2 ? `odd total ${total}: the median is the biggest left number, ${fmt(lm)}` : `even total ${total}: the median is (${fmt(lm)} + ${fmt(rm)}) / 2 = ${(lm + rm) / 2}`;
    }
    const lmv = LEFT_MAX.map((k) => ctx.vars[k]).find(isNum);
    if (lmv !== undefined && LEFT_MAX.some((k) => isNum(ctx.vars[k]) && !(k in ctx.prev))) return `the cut is right: the biggest number on the left is ${fmt(lmv)}`;
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    if (!(loName in ctx.prev)) return `the cut in ${L.s} can take 0…${L.sl.length} of its numbers`;
    const qp = quadOf(ctx.prev);
    if (!qp) return null;
    const [al, ar, bl, br] = qp.map((k) => ctx.prev[k]);
    if (lo > ctx.prev[loName]) return `${fmt(bl)} > ${fmt(ar)}: too few from ${L.s}, take more (${lo}…${hi} left)`;
    if (hi < ctx.prev[hiName]) return `${fmt(al)} > ${fmt(br)}: too many from ${L.s}, take fewer (${lo}…${hi} left)`;
    return null;
  },
  // once all four edges of a cut are known: is it right, or which way does it move?
  predict(ctx) {
    const L = lines(ctx);
    const q = quadOf(ctx.vars);
    const pair = pairOf(ctx.vars);
    if (!L || !q || !pair || !ctx.next || !fresh(ctx, q)) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const added = Object.keys(nx).some((k) => !(k in ctx.vars));
    const moved = nx[loName] > ctx.vars[loName] ? 'few' : nx[hiName] < ctx.vars[hiName] ? 'many' : added || ctx.next.ret ? 'ok' : null;
    if (!moved) return null;
    const [al, ar, bl, br] = q.map((k) => ctx.vars[k]);
    const explain = {
      ok: `${fmt(al)} ≤ ${fmt(br)} and ${fmt(bl)} ≤ ${fmt(ar)}: every left number is ≤ every right number, so this cut splits the merged list in half.`,
      many: `${fmt(al)} on ${L.s}'s left is bigger than ${fmt(br)} on ${L.g}'s right: ${L.s} gave too many, so the cut moves left.`,
      few: `${fmt(bl)} on ${L.g}'s left is bigger than ${fmt(ar)} on ${L.s}'s right: ${L.s} gave too few, so the cut moves right.`,
    }[moved];
    return {
      question: `${L.s} … ${fmt(al)} | ${fmt(ar)} …   ${L.g} … ${fmt(bl)} | ${fmt(br)} …   Is this cut right?`,
      options: ['Yes: every left number ≤ every right number', `No: too many from ${L.s} (${hiName} moves down)`, `No: too few from ${L.s} (${loName} moves up)`],
      answer: { ok: 0, many: 1, few: 2 }[moved],
      explain,
    };
  },
  bugs: [
    {
      label: 'Floor the even average',
      find: 'return (leftMax + Math.min(Aright, Bright)) / 2;',
      replace: 'return Math.floor((leftMax + Math.min(Aright, Bright)) / 2);',
      explain: 'With an even total the median is the average of the two middle numbers: (2 + 3) / 2 is 2.5, but flooring it gives 2.',
    },
    {
      label: 'half = (m + n) / 2 for odd totals',
      find: 'const half = (m + n + 1) >> 1;',
      replace: 'const half = (m + n) >> 1;',
      explain: 'With an odd total the left half must hold the extra (middle) number. Without the + 1 the middle number lands on the right, but the code still returns the biggest left number.',
    },
  ],
};
