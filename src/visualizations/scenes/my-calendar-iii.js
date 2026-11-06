// My Calendar III (design class): a timeline of +1 / −1 marks. Every booking puts +1 at its start and −1 at its end;
// walking the marks in time order, the running total is how many events are on at that moment, and its peak is the answer.
// Reads the marks from any field of `this` that maps time → change (a Map or a plain object).
import { entriesOf, options, row } from './util.js';

const ACTIVE = ['active', 'cur', 'curr', 'running', 'ongoing', 'count', 'cnt', 'sum', 'live'];
const BEST = ['best', 'max', 'maxK', 'res', 'ans', 'result', 'mx', 'k', 'peak', 'most'];
const TIME = ['t', 'time', 'key', 'k', 'x', 'p', 'point'];
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const show = (q) => `[${q[0]}, ${q[1]})`;
const sign = (d) => (d > 0 ? `+${d}` : `${d}`);

/** the booking being made now */
function requestOf(ctx) {
  const op = ctx.ops?.[ctx.op];
  return op && /book/i.test(op.name) && row(op.args) && op.args.length === 2 && op.args.every(isNum) ? op.args : null;
}
/** [[time, change], …] from the first field of this that maps numbers to numbers */
function marksOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  for (const v of Object.values(o)) {
    const e = entriesOf(v);
    if (e && e.every(([k, x]) => isNum(Number(k)) && isNum(x))) return e.map(([k, x]) => [Number(k), x]);
  }
  return null;
}
/** the true peak over the bookings so far (ops 1..op), and the first stretch where it happens */
function peakOf(ctx) {
  const evs = (ctx.ops || []).slice(1, ctx.op + 1).filter((o) => /book/i.test(o.name) && row(o.args) && o.args.length === 2).map((o) => o.args);
  const pts = [...new Set(evs.flat())].sort((a, b) => a - b);
  let best = 0;
  let at = null;
  pts.forEach((t, i) => {
    const on = evs.filter(([s, e]) => s <= t && t < e).length;
    if (on > best) (best = on), (at = [t, pts[i + 1]]);
  });
  return { best, at };
}
/** a field of this holding the sorted boundary times */
function timesOf(vars) {
  const o = vars?.this?.$obj;
  return o ? Object.values(o).find((v) => row(v) && v.length > 0 && v.every(isNum)) || null : null;
}
const firstNum = (vars, names) => names.find((k) => isNum(vars?.[k]) && k !== 'this');

export default {
  id: 'my-calendar-iii',
  metaphor: 'A timeline of +1 and −1 marks',
  caption: 'Each booking drops +1 where it starts and −1 where it ends (the end is not included). Walking the marks left to right, the running total is how many events are on right then; its peak is the answer.',
  narrate(ctx) {
    const q = requestOf(ctx);
    if (!q) return null;
    if (ctx.ret && isNum(ctx.value) && (!ctx.next || ctx.next.op !== ctx.op)) {
      return `book ${show(q)}: at the busiest moment so far, ${ctx.value} event${ctx.value === 1 ? ' is' : 's'} on at once`;
    }
    const now = marksOf(ctx.vars);
    const before = marksOf(ctx.prev);
    if (now && before) {
      const old = new Map(before);
      const ch = now.find(([t, x]) => old.get(t) !== x && !(x === 0 && !old.has(t)));
      if (ch) {
        const [t, x] = ch;
        const d = x - (old.get(t) ?? 0);
        if (t === q[0] && d > 0) return `book ${show(q)}: time ${t} gets ${sign(d)}, an event starts there (mark now ${sign(x)})`;
        if (t === q[1] && d < 0) return `time ${t} gets ${sign(d)}: the event is over at ${t}, the end is not included (mark now ${sign(x)})`;
      }
    }
    const aName = firstNum(ctx.vars, ACTIVE);
    const bName = firstNum(ctx.vars, BEST.filter((k) => k !== aName));
    const tName = firstNum(ctx.vars, TIME.filter((k) => k !== aName && k !== bName));
    if (aName && tName && isNum(ctx.prev[aName]) && ctx.vars[aName] !== ctx.prev[aName]) {
      const n = ctx.vars[aName];
      return `sweep reaches time ${ctx.vars[tName]}, mark ${sign(n - ctx.prev[aName])}: ${n} event${n === 1 ? '' : 's'} on from here`;
    }
    if (bName && aName && tName && isNum(ctx.prev[bName]) && ctx.vars[bName] > ctx.prev[bName]) {
      const b = ctx.vars[bName];
      return b === 1 ? `new peak: 1 event on at time ${ctx.vars[tName]}` : `new peak: ${b} events overlap at time ${ctx.vars[tName]}`;
    }
    // keeping the boundary times sorted: a binary search for where a new time goes, then the insert
    const times = timesOf(ctx.vars);
    const tNow = firstNum(ctx.vars, ['t', 'time', 'x', 'key']);
    if (times && tNow && Number.isInteger(ctx.vars.mid) && ctx.vars.mid !== ctx.prev.mid && isNum(times[ctx.vars.mid])) {
      return `where does time ${ctx.vars[tNow]} go among the sorted boundaries? compare with ${times[ctx.vars.mid]}`;
    }
    const tBefore = timesOf(ctx.prev);
    if (times && tBefore && times.length === tBefore.length + 1) {
      const added = times.find((x, i) => x !== tBefore[i]);
      return `time ${added} joins the sorted boundaries: ${times.join(', ')}`;
    }
    return null;
  },
  // when the sweep is about to start (its peak counter appears): what will book() return?
  predict(ctx) {
    const q = requestOf(ctx);
    const ans = row(ctx.result) ? ctx.result[ctx.op] : undefined;
    if (!q || ctx.op < 2 || !isNum(ans)) return null;
    const bName = BEST.find((k) => ctx.vars[k] === 0);
    if (!bName || bName in ctx.prev) return null;
    const prevAns = ctx.result[ctx.op - 1];
    const { best, at } = peakOf(ctx);
    const right = best === ans && at;
    return options(
      `Booking ${show(q)} is marked on the timeline. How many events overlap at the busiest moment now?`,
      ans,
      [isNum(prevAns) ? prevAns : ans + 1, ans + 1, Math.max(1, ans - 1), ans + 2].filter((x) => x !== ans),
      right
        ? `Walking the marks in time order, the running total peaks at ${best} on ${at[1] === undefined ? `time ${at[0]}` : show(at)}${isNum(prevAns) ? ` (before this booking the peak was ${prevAns})` : ''}.`
        : `This code's book() returns ${ans} here.`,
    );
  },
  bugs: [
    {
      label: 'End included: back-to-back events overlap',
      find: 'this.#addBoundary(endTime, -1);',
      replace: 'this.#addBoundary(endTime + 1, -1);',
      explain: 'Putting the −1 one step after the end treats [10, 20) as closed, so [20, 30) still sees the first event running at 20 and the answer becomes 2.',
    },
    {
      label: 'Marks kept in arrival order, not time order',
      find: 'this.times.splice(lo, 0, t);',
      replace: 'this.times.push(t);',
      explain: 'The sweep must meet the marks left to right. In arrival order a −1 can come before its own +1, so the running count dips and peaks at the wrong times.',
    },
  ],
};
