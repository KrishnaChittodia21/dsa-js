// Scene: Implement Stack using Queues. A single-file line where only the front may leave: to make the newest item
// leave first, every push lets the newcomer join at the back and then walks each older item from the front round
// to the back, so the newcomer ends at the front. Reads any queue fields of `this` (array, toolkit Queue / Deque).
import { row } from './util.js';

function lineOf(v) {
  if (row(v)) return v;
  const o = v?.$obj;
  if (!o) return null;
  if (row(o.items) && Number.isInteger(o.head)) return o.items.slice(o.head);
  if (row(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
// name → items of every queue field of `this`
function linesOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const out = {};
  for (const k of Object.keys(o)) if (lineOf(o[k])) out[k] = lineOf(o[k]);
  return Object.keys(out).length ? out : null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const show = (a) => (a.length ? a.join(', ') : 'empty');
const op = (ctx, i = ctx.op) => ctx.ops?.[i];

export default {
  id: 'implement-stack-using-queues',
  metaphor: 'A line that walks round behind the newcomer',
  caption: 'Only the front of the line may leave. After each push the older items walk one by one from the front to the back, so the newest item ends at the front and leaves first, like the top of a stack.',
  narrate(ctx) {
    const now = linesOf(ctx.vars);
    const was = linesOf(ctx.prev);
    if (!now) return null;
    const names = Object.keys(now);
    const o = op(ctx);
    const r = Array.isArray(ctx.result) ? ctx.result[ctx.op] : undefined;
    if (ctx.ret && o?.name === 'top' && Number.isFinite(r)) return `top: ${r} waits at the front of the line, so it is the newest item`;
    if (!was || !same(Object.keys(was), names)) return null;
    const changed = names.filter((k) => !same(now[k], was[k]));
    if (ctx.ret && o?.name === 'pop' && changed.length === 1) {
      const k = changed[0];
      if (now[k].length === was[k].length - 1 && same(now[k], was[k].slice(1))) return `pop: ${was[k][0]}, the newest item, leaves from the front of ${k} · left: ${show(now[k])}`;
    }
    // swapping the two queues through a temp: this.a = this.b; this.b = t;
    const swap = /^\s*this\.(\w+)\s*=\s*(?:this\.)?\w+\s*;/.exec(ctx.src || '');
    if (swap && changed.length === 1 && changed[0] === swap[1] && names.length === 2) {
      const k = swap[1];
      return `${k} takes over the other line (${show(now[k])}): the two queues swap roles`;
    }
    if (changed.length === 1) {
      const k = changed[0];
      const [a, b] = [now[k], was[k]];
      const x = ctx.vars.x ?? o?.args?.[0];
      // one item walked from the front to the back
      if (a.length === b.length && a.length > 1 && same(a, [...b.slice(1), b[0]])) {
        return a[0] === x || (o?.name === 'push' && a[0] === o.args?.[0])
          ? `${b[0]} walks round to the back: every older item now waits behind the newcomer ${a[0]} · ${show(a)}`
          : `${b[0]} walks from the front to the back of the line · ${show(a)}`;
      }
      if (a.length === b.length + 1 && same(a.slice(0, -1), b)) return `${a.at(-1)} joins the back of ${k} · ${show(a)}${a.length > 1 ? ` (${a.length - 1} older ${a.length === 2 ? 'item' : 'items'} must walk round)` : ''}`;
      if (a.length === b.length - 1 && same(a, b.slice(1))) return `${b[0]} leaves the front of ${k} · ${show(a)}`;
    }
    // two queues: one item moved from the front of one to the back of the other
    if (changed.length === 2) {
      const [k1, k2] = changed;
      for (const [from, to] of [[k1, k2], [k2, k1]]) {
        if (same(now[from], was[from].slice(1)) && same(now[to], [...was[to], was[from][0]])) return `${was[from][0]} moves from the front of ${from} to the back of ${to}`;
      }
      for (const [from, to] of [[k1, k2], [k2, k1]]) {
        if (same(now[from], was[to]) && same(now[to], was[from])) return `the queues swap names: ${from} now holds ${show(now[from])}`;
      }
    }
    return null;
  },
  // right before a pop / top starts: which value comes out?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || nx.op === ctx.op || !Array.isArray(ctx.result)) return null;
    const o = op(ctx, nx.op);
    if (!o || (o.name !== 'pop' && o.name !== 'top')) return null;
    const lines = linesOf(ctx.vars);
    if (!lines) return null;
    const vals = Object.values(lines).flat();
    if (vals.length < 2) return null;
    const r = ctx.result[nx.op];
    if (!Number.isFinite(r)) return null;
    const opts = [...new Set([r, ...vals])].slice(0, 4).sort((a, b) => a - b);
    if (opts.length < 2) return null;
    const one = Object.keys(lines).length === 1 ? lines[Object.keys(lines)[0]] : null;
    return {
      question: `${o.name}() is next. The line holds ${Object.entries(lines).map(([k, v]) => `${k}: ${show(v)}`).join(' · ')} (front first). Which value comes out?`,
      options: opts.map(String),
      answer: opts.indexOf(r),
      explain: one && one[0] === r
        ? `Every push walked the older items round behind the newcomer, so the front, ${r}, is the newest item: the top of the stack.`
        : `The top of the stack is the newest item still there: ${r}.`,
    };
  },
  bugs: [
    {
      label: 'Rotate size times instead of size - 1',
      find: 'for (let i = 1; i < this.q.size(); i++)',
      replace: 'for (let i = 0; i < this.q.size(); i++)',
      explain: 'Walking every item round, the newcomer included, puts the line back as it was: the newest item is at the back again, so pop returns the oldest.',
    },
  ],
};
