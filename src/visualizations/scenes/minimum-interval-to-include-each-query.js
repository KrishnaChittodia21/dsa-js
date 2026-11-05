// Minimum Interval to Include Each Query: campers stand on a number line, tents (intervals) cover stretches of it.
// Visiting campers left to right, every tent that has started joins a pile keyed by size; tents that ended before
// the camper are thrown off the top, and the smallest tent left is that camper's answer.
import { options, row } from './util.js';

const LR = [
  ['l', 'r'],
  ['left', 'right'],
  ['lo', 'hi'],
  ['start', 'end'],
  ['s', 'e'],
  ['a', 'b'],
];
const ANS = ['ans', 'answer', 'res', 'result', 'out', 'output'];
const isPair = (v) => row(v) && v.length === 2 && v.every(Number.isInteger);
const show = (p) => `[${p[0]}, ${p[1]}]`;

/** items of a heap-like variable: a MinHeap ($obj with an array field) or a plain array under a heap-like name */
function pileOf(vars) {
  for (const [k, v] of Object.entries(vars)) {
    if (!/heap|pq|pile|cand|active|^h$/i.test(k)) continue;
    if (Array.isArray(v)) return v;
    if (v && v.$obj) {
      const arr = Object.values(v.$obj).find(Array.isArray);
      if (arr) return arr;
    }
  }
  return null;
}

/** [name, answers] of the answer row (same length as the queries) */
function answersOf(vars, params) {
  const qs = vars[params[1]];
  const k = ANS.find((n) => row(vars[n]) && Array.isArray(qs) && vars[n].length === qs.length && n !== params[1]);
  return k ? vars[k] : null;
}

export default {
  id: 'minimum-interval-to-include-each-query',
  metaphor: 'The snuggest tent over each camper',
  caption: 'Campers (queries) are visited from left to right. Tents that have started go on a pile with the smallest on top; a top tent that ended before the camper is thrown away, and the top that is left is the answer.',
  narrate(ctx) {
    const [, qn] = ctx.params;
    const qs = row(ctx.vars[qn]);
    const ans = answersOf(ctx.vars, ctx.params);
    const was = answersOf(ctx.prev, ctx.params);
    if (qs && ans && was) {
      const k = ans.findIndex((x, i) => x !== was[i]);
      if (k >= 0) return ans[k] === -1 ? `no tent covers the camper at ${qs[k]}: answer −1` : `the camper at ${qs[k]} gets the smallest tent still standing over them: size ${ans[k]}`;
    }
    const pile = pileOf(ctx.vars);
    const before = pileOf(ctx.prev);
    if (!pile || !before) return null;
    if (pile.length === before.length + 1) {
      const pr = LR.find(([a, b]) => Number.isInteger(ctx.vars[a]) && Number.isInteger(ctx.vars[b]));
      const t = pr ? [ctx.vars[pr[0]], ctx.vars[pr[1]]] : ['t', 'iv', 'cur', 'interval', 'tent', 'it'].map((n) => ctx.vars[n]).find(isPair);
      return t ? `tent ${show(t)} has started by now: it joins the pile (size ${t[1] - t[0] + 1}, ${pile.length} on the pile)` : `a tent that has started joins the pile (${pile.length} on the pile)`;
    }
    if (pile.length === before.length - 1) return `the top tent ended before this camper: throw it away, it cannot cover anyone further right${pile.length ? ` (${pile.length} left)` : " (the pile is empty now)"}`;
    return null;
  },
  // before an answer is written: what does this camper get?
  predict(ctx) {
    if (!ctx.next) return null;
    const [ivn, qn] = ctx.params;
    const qs = row(ctx.vars[qn]);
    const ans = answersOf(ctx.vars, ctx.params);
    const after = answersOf(ctx.next.vars, ctx.params);
    const iv = Array.isArray(ctx.vars[ivn]) && ctx.vars[ivn].every(isPair) ? ctx.vars[ivn] : null;
    if (!qs || !ans || !after || !iv) return null;
    const d = after.map((x, i) => (x !== ans[i] ? i : -1)).filter((i) => i >= 0);
    if (d.length !== 1) return null;
    const k = d[0];
    const right = after[k];
    const q = qs[k];
    const sizes = [...new Set(iv.map(([l, r]) => r - l + 1))].filter((x) => x !== right).sort((a, b) => a - b);
    const covering = iv.filter(([l, r]) => l <= q && q <= r);
    const why = right === -1 ? `No tent has l ≤ ${q} ≤ r, so nothing is left on the pile.` : `Tents covering ${q}: ${covering.map(show).join(' ')}; the smallest has size r − l + 1 = ${right}.`;
    return options(`The camper at ${q} is next. What size is the smallest tent over them? (−1 if none)`, right, [-1, ...sizes].filter((x) => x !== right).slice(0, 3), why);
  },
  maxPredicts: 2,
  bugs: [
    {
      label: 'Size off by one (r − l)',
      find: 'heap.push([r - l + 1, r]);',
      replace: 'heap.push([r - l, r]);',
      explain: 'A tent [l, r] covers r − l + 1 spots, so [4,4] has size 1, not 0; every answer comes out one too small.',
    },
    {
      label: 'Pile keyed by right end, not size',
      find: 'new MinHeap((x) => x[0])',
      replace: 'new MinHeap((x) => x[1])',
      explain: 'The top is then the tent that ends first, not the smallest: for camper 5, [1,6] wins over the smaller [5,8].',
    },
  ],
};
