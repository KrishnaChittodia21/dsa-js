// Insert Interval: a new booking dropped into a sorted calendar. Bookings that end before it are copied, bookings it
// touches are swallowed (the block stretches), and the rest are copied after it.
import { options, row } from './util.js';

const PAIRS = [
  ['s', 'e'],
  ['start', 'end'],
  ['newStart', 'newEnd'],
  ['ns', 'ne'],
  ['lo', 'hi'],
  ['left', 'right'],
];
const OUT = ['out', 'result', 'res', 'ans', 'answer', 'merged', 'output'];
const isPair = (v) => row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const outOf = (vars) => OUT.map((k) => listOf(vars[k])).find(Boolean);
const show = (p) => `[${p[0]}, ${p[1]}]`;

/** the block being inserted: [s, e] under a common pair of names, else the (maybe mutated) new interval */
function blockOf(vars, params) {
  const pr = PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
  if (pr) return [vars[pr[0]], vars[pr[1]]];
  return isPair(vars[params[1]]) ? vars[params[1]] : null;
}

export default {
  id: 'insert-interval',
  metaphor: 'A new booking in a sorted calendar',
  caption: 'Bookings that end before the new one starts are copied as they are; every booking it touches is swallowed and the new block stretches to cover it; whatever starts after the block is copied last.',
  narrate(ctx) {
    const out = outOf(ctx.vars);
    const before = outOf(ctx.prev);
    const blk = blockOf(ctx.vars, ctx.params);
    if (out && before && out.length === before.length + 1 && blk) {
      const p = out[out.length - 1];
      if (p[1] < blk[0]) return `${show(p)} ends before the new booking starts at ${blk[0]}: copy it as it is`;
      if (p[0] > blk[1]) return `${show(p)} starts after the block ends at ${blk[1]}: copy it as it is`;
      if (p[0] === blk[0] && p[1] === blk[1]) return `the block ${show(p)} goes in, covering everything it touched`;
      return null;
    }
    const old = blockOf(ctx.prev, ctx.params);
    // a stretch keeps the old block inside the new one; anything else is a fresh block
    if (!blk || !old || (blk[0] === old[0] && blk[1] === old[1]) || blk[0] > old[0] || blk[1] < old[1]) return null;
    const list = listOf(ctx.vars[ctx.params[0]]);
    const i = ctx.vars.i;
    const hit = list && Number.isInteger(i) && list[i] ? ` to swallow ${show(list[i])}` : '';
    return `the block stretches ${blk[0] < old[0] ? 'left' : 'right'} to ${show(blk)}${hit}`;
  },
  // before something goes into the answer: which booking?
  predict(ctx) {
    if (!ctx.next) return null;
    const out = outOf(ctx.vars);
    const after = outOf(ctx.next.vars);
    if (!out || !after || after.length !== out.length + 1) return null;
    const right = show(after[after.length - 1]);
    const list = listOf(ctx.vars[ctx.params[0]]) || [];
    const blk = blockOf(ctx.vars, ctx.params);
    const done = new Set(out.map(show));
    const wrong = [...(blk ? [blk] : []), ...list].map(show).filter((x) => x !== right && !done.has(x));
    const p = after[after.length - 1];
    const why = blk && p[0] === blk[0] && p[1] === blk[1] ? `The next booking starts after ${blk[1]} (or none is left), so the stretched block ${right} is finished.` : blk && p[1] < blk[0] ? `${right} ends before ${blk[0]}, so it cannot touch the new booking.` : `${right} starts after the block ends, so it is copied as it is.`;
    return options(`The answer so far: ${out.length ? out.map(show).join(' ') : 'empty'}. What goes in next?`, right, wrong.slice(0, 3), why);
  },
  bugs: [
    {
      label: 'Phase 1 uses <=: a touching booking is not merged',
      find: 'intervals[i][1] < s',
      replace: 'intervals[i][1] <= s',
      explain: 'A booking that ends exactly where the new one starts touches it and must merge, but it is copied on its own instead.',
    },
    {
      label: 'Forget phase 3: the later bookings vanish',
      find: 'while (i < n) out.push(intervals[i++]);',
      replace: '',
      explain: 'After the block goes in, the bookings that start after it are never copied, so the end of the calendar is lost.',
    },
  ],
};
