// Merge Intervals: bookings sorted by start, laid end to end. Each booking either reaches into the current block
// (the block stretches) or starts after it ends (a gap: a new block begins).
import { options, row } from './util.js';

const PAIRS = [
  ['start', 'end'],
  ['s', 'e'],
  ['st', 'en'],
  ['a', 'b'],
  ['lo', 'hi'],
  ['l', 'r'],
  ['left', 'right'],
];
const CUR = ['cur', 'curr', 'current', 'interval', 'iv', 'it', 'item', 'next', 'meeting'];
const OUT = ['out', 'result', 'res', 'ans', 'answer', 'merged', 'output', 'stack'];
const isPair = (v) => row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

function outOf(vars) {
  const k = OUT.find((n) => listOf(vars[n]));
  return k ? vars[k] : null;
}

/** the booking being looked at: a [start, end] pair of names, a pair variable, or list[i] */
function curOf(vars, params) {
  const pr = PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
  if (pr) return [vars[pr[0]], vars[pr[1]]];
  const c = CUR.find((n) => isPair(vars[n]));
  if (c) return vars[c];
  const list = listOf(vars.sorted) || listOf(vars[params[0]]);
  return list && Number.isInteger(vars.i) && isPair(list[vars.i]) ? list[vars.i] : null;
}

export default {
  id: 'merge-intervals',
  metaphor: 'Bookings laid end to end on a timeline',
  caption: 'Bookings are taken in order of start time. One that starts inside the current block stretches it; one that starts after the block ends leaves a gap and opens a new block.',
  narrate(ctx) {
    const [p] = ctx.params;
    // the sort: a sorted copy appears, or the input is sorted in place
    for (const k of Object.keys(ctx.vars)) {
      const now = listOf(ctx.vars[k]);
      if (!now || OUT.includes(k) || now.length < 2 || !now.every((x, i) => i === 0 || now[i - 1][0] <= x[0])) continue;
      const was = listOf(ctx.prev[k]);
      if ((k !== p && !was) || (was && was.some((x, i) => !same(x, now[i])))) return `sorted by start: ${now.map(show).join(' ')}: now every overlap is with the block just before`;
    }
    const out = outOf(ctx.vars);
    const before = outOf(ctx.prev);
    if (!out || !before) return null;
    const last = out[out.length - 1];
    if (out.length === before.length + 1) {
      const prevBlock = before[before.length - 1];
      if (!prevBlock) return `${show(last)} opens the first block`;
      return `${show(last)} starts at ${last[0]}, after the block ${show(prevBlock)} ends: a gap, so a new block begins`;
    }
    const was = before[before.length - 1];
    if (out.length === before.length && last && was && last[0] === was[0] && last[1] > was[1]) {
      const cur = curOf(ctx.vars, ctx.params);
      return `${cur ? `${show(cur)} starts at ${cur[0]}, inside the block: ` : ''}the block stretches from ${show(was)} to ${show(last)}`;
    }
    const cur = curOf(ctx.vars, ctx.params);
    const prevCur = curOf(ctx.prev, ctx.params);
    // a booking that sits wholly inside the block changes nothing; told once, on its last step
    const nextCur = ctx.next && curOf(ctx.next.vars, ctx.params);
    if (cur && same(cur, prevCur) && !same(cur, nextCur) && last && out.length === before.length && cur[0] >= last[0] && cur[1] <= last[1] && out.length > 0) {
      return `${show(cur)} lies inside the block ${show(last)}: swallowed, the block keeps its end ${last[1]}`;
    }
    return null;
  },
  // just before the answer changes: does the booking stretch the block or open a new one?
  predict(ctx) {
    if (!ctx.next) return null;
    const out = outOf(ctx.vars);
    const after = outOf(ctx.next.vars);
    const cur = curOf(ctx.vars, ctx.params);
    if (!out || !after || !out.length || !cur) return null;
    const last = out[out.length - 1];
    const nl = after[after.length - 1];
    let ans;
    if (after.length === out.length + 1 && same(nl, cur)) ans = 0;
    else if (after.length === out.length && nl[0] === last[0] && nl[1] > last[1]) ans = 1;
    else return null;
    return {
      question: `The current block is ${show(last)} and the next booking is ${show(cur)}. What happens?`,
      options: [`A gap: ${show(cur)} opens a new block`, `Stretch the block to end at ${Math.max(cur[1], last[1])}`, `Nothing: ${show(cur)} is already covered`],
      answer: ans,
      explain: ans === 0 ? `${cur[0]} > ${last[1]}: the booking starts after the block ends, and later bookings start even later, so the block is final.` : `${cur[0]} ≤ ${last[1]}: the booking starts inside the block (touching counts), so the block's end becomes max(${last[1]}, ${cur[1]}) = ${nl[1]}.`,
    };
  },
  bugs: [
    {
      label: 'Use < : touching bookings stay apart',
      find: 'start <= last[1]',
      replace: 'start < last[1]',
      explain: '[1,4] and [4,5] touch at 4 and must become [1,5], but with < the second one opens its own block.',
    },
    {
      label: 'Set the end instead of taking the max',
      find: 'Math.max(last[1], end)',
      replace: 'end',
      explain: 'A short booking inside a long block ([2,3] inside [1,10]) cuts the block back to end at 3, so the rest is lost.',
    },
  ],
};
