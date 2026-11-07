// Number of Recent Calls (design class, a queue of ping times). A line of pings that fades: each new ping joins the
// back, pings older than t − 3000 fall off the front, and the answer is how many are still in line. Reads any field
// of `this` that holds a list (toolkit Queue, a plain array used with shift, a Deque).
import { row } from './util.js';

const isInt = Number.isInteger;

/** the items of a queue snapshot, front first: a plain array, a toolkit Queue (items/head) or Deque (ring) */
function listOf(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.items)) return isInt(o.head) ? o.items.slice(o.head) : o.items;
  if (row(o.buf) && isInt(o.head) && isInt(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** the ping times still in line and the current ping t */
function stateOf(ctx, vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const name = Object.keys(o).find((k) => listOf(o[k]));
  if (!name) return null;
  const op = ctx.ops?.[ctx.op];
  const t = op && op.name === 'ping' && isInt(op.args?.[0]) ? op.args[0] : undefined;
  return { name, list: listOf(o[name]), t };
}

export default {
  id: 'number-of-recent-calls',
  metaphor: 'A line of pings that fades',
  caption: 'The queue holds ping times, oldest at the front. A new ping joins the back; pings older than t − 3000 fall off the front; whatever is left is the answer.',
  narrate(ctx) {
    const s = stateOf(ctx, ctx.vars);
    if (!s) return null;
    const { list, t } = s;
    if (ctx.ret && isInt(t)) {
      const r = Array.isArray(ctx.result) && isInt(ctx.result[ctx.op]) ? ctx.result[ctx.op] : list.length;
      return `${list.length} ${list.length === 1 ? 'ping is' : 'pings are'} left in line (range [${t - 3000}, ${t}]): ping(${t}) returns ${r}`;
    }
    const p = stateOf(ctx, ctx.prev);
    if (!p || p.name !== s.name) return null;
    if (list.length === p.list.length + 1 && same(list.slice(0, -1), p.list) && isInt(t)) return `ping at ${t} joins the back: only pings in [${t - 3000}, ${t}] count`;
    if (list.length === p.list.length - 1 && same(list, p.list.slice(1)) && isInt(t)) return `the ping at ${p.list[0]} is older than ${t - 3000}: it falls off the front`;
    return null;
  },
  // a ping just joined: does the oldest one fall off?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    const n = stateOf(ctx, ctx.next.vars);
    if (!s || !n || !isInt(s.t) || n.name !== s.name || s.list.length < 2 || ctx.next.op !== ctx.op) return null;
    const joined = p && p.name === s.name && s.list.length === p.list.length + 1 && same(s.list.slice(0, -1), p.list);
    if (!joined) return null;
    const drops = n.list.length === s.list.length - 1 && same(n.list, s.list.slice(1));
    if (!drops && !ctx.next.ret) return null;
    const front = s.list[0];
    const opts = [`Yes: ${front} falls off`, `No: ${front} still counts`];
    return {
      question: `Ping at ${s.t}: only pings in [${s.t - 3000}, ${s.t}] count. Does the oldest ping (${front}) fall off the front?`,
      options: opts,
      answer: drops ? 0 : 1,
      explain: drops ? `${front} < ${s.t - 3000}, so it is outside the last 3000 ms.` : `${front} ≥ ${s.t - 3000}: it is inside the range (the range includes t − 3000), and later pings are newer still.`,
    };
  },
  bugs: [
    {
      label: 'Expire with <=: drops a ping exactly 3000 ms old',
      find: 'this.q.front() < t - 3000',
      replace: 'this.q.front() <= t - 3000',
      explain: 'The range [t − 3000, t] includes its start, so a ping at exactly t − 3000 still counts; <= throws it away and the count is one short.',
    },
  ],
};
