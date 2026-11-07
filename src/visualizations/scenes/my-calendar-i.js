// My Calendar I: a one-room booking diary. Each request [start, end) is checked against the bookings next to where it
// would go: it is booked only when it clashes with none of them (touching ends are fine, end is not included).
import { row } from './util.js';

const num = (v) => typeof v === 'number';
const isPair = (v) => !!row(v) && v.length === 2 && v.every(num);
const show = (p) => `[${p[0]}, ${p[1]})`;
const PAIRS = [['lo', 'hi'], ['left', 'right'], ['l', 'r'], ['low', 'high']];
const MID = ['mid', 'm'];

/** the diary: the first field of `this` that is a list of [start, end] pairs */
function diaryOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const v = Object.values(o).find((x) => Array.isArray(x) && x.every(isPair));
  return v || null;
}
/** the request being booked now: the arguments of the running book() call */
function requestOf(ctx) {
  const op = ctx.ops?.[ctx.op];
  return op && op.name === 'book' && isPair(op.args) ? op.args : null;
}
const clash = (a, b) => a[0] < b[1] && b[0] < a[1];
const byStart = (d) => [...d].sort((a, b) => a[0] - b[0]);
/** the bookings right before and right after where q would go */
function neighbours(d, q) {
  const s = byStart(d);
  return [s.filter((b) => b[0] < q[0]).pop(), s.find((b) => b[0] >= q[0])];
}
const opEnds = (ctx) => !ctx.next || ctx.next.op !== ctx.op;

export default {
  id: 'my-calendar-i',
  metaphor: 'A one-room booking diary',
  caption: 'Bookings are half-open: [10, 20) ends just before 20, so [20, 30) may follow it. A request only has to be checked against the booking just before it and the one just after it.',
  narrate(ctx) {
    const q = requestOf(ctx);
    const d = diaryOf(ctx.vars);
    if (!q || !d) return null;
    const before = diaryOf(ctx.prev);
    if (before && d.length === before.length + 1) {
      const rest = d.filter((b) => !(b[0] === q[0] && b[1] === q[1]));
      const [p, n] = neighbours(rest, q);
      const touch = [p && p[1] === q[0] ? show(p) : '', n && n[0] === q[1] ? show(n) : ''].filter(Boolean).join(' and ');
      return `${show(q)} clashes with nothing${touch ? ` (touching ${touch} is fine)` : ''}: booked, ${d.length} in the diary`;
    }
    if (opEnds(ctx) && /return\s+false|false\s*;/.test(ctx.src)) {
      const hit = d.find((b) => clash(b, q));
      return hit ? `${show(q)} overlaps ${show(hit)} from ${Math.max(q[0], hit[0])} to ${Math.min(q[1], hit[1])}: rejected, the diary is unchanged` : `${show(q)} is rejected: the diary is unchanged`;
    }
    const mName = MID.find((k) => Number.isInteger(ctx.vars[k]));
    const s = byStart(d);
    if (mName && ctx.vars[mName] !== ctx.prev[mName] && s[ctx.vars[mName]]) {
      const b = s[ctx.vars[mName]];
      return `where does ${show(q)} go? look at the middle booking ${show(b)}, which starts at ${b[0]}`;
    }
    const pr = PAIRS.find(([a, b]) => Number.isInteger(ctx.vars[a]) && Number.isInteger(ctx.vars[b]));
    if (pr && pr[0] in ctx.prev && ctx.vars[pr[0]] !== ctx.prev[pr[0]] && s.length) {
      return `bookings up to slot ${ctx.vars[pr[0]] - 1} start before ${q[0]}: ${show(q)} goes to their right`;
    }
    if (pr && pr[1] in ctx.prev && ctx.vars[pr[1]] !== ctx.prev[pr[1]] && s.length) {
      return `the booking in slot ${ctx.vars[pr[1]]} starts at or after ${q[0]}: ${show(q)} goes at or left of it`;
    }
    return null;
  },
  // right before the verdict: is the request booked?
  predict(ctx) {
    if (!ctx.next || ctx.next.op !== ctx.op) return null;
    const q = requestOf(ctx);
    const d = diaryOf(ctx.vars);
    const nd = diaryOf(ctx.next.vars);
    if (!q || !d || !nd || !d.length) return null;
    let booked;
    if (nd.length === d.length + 1) booked = true;
    else if (nd.length === d.length && ctx.next.ret && /false/.test(ctx.lines[ctx.next.line - 1] || '')) booked = false;
    else return null;
    const [p, n] = neighbours(d, q);
    const hit = d.find((b) => clash(b, q));
    return {
      question: `Request ${show(q)}. The diary holds ${byStart(d).map(show).join(' ')}. Is it booked?`,
      options: ['Booked', 'Rejected: it clashes'],
      answer: booked ? 0 : 1,
      explain: booked
        ? `${p ? `${show(p)} ends at ${p[1]} ≤ ${q[0]}` : 'Nothing comes before it'} and ${n ? `${show(n)} starts at ${n[0]} ≥ ${q[1]}` : 'nothing comes after it'}, so it fits.`
        : hit ? `It overlaps ${show(hit)}: both are in use between ${Math.max(q[0], hit[0])} and ${Math.min(q[1], hit[1])}.` : 'It overlaps an existing booking.',
    };
  },
  bugs: [
    {
      label: 'Touching counts as a clash (<= instead of <)',
      find: 'list[lo][0] < end',
      replace: 'list[lo][0] <= end',
      explain: 'A booking starting exactly when the request ends does not overlap it (end is not included), but <= rejects it, so [20,30) cannot go before [30,40).',
    },
    {
      label: 'Check only the booking after it',
      find: 'if (lo > 0 && list[lo - 1][1] > start) return false;',
      replace: '',
      explain: 'A request can also run into the booking just before it: [5,15) starts before [10,20) ends, but without this check it is booked.',
    },
  ],
};
