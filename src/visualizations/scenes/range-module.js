// Range Module (design class): strips of tape on a ruler. The tracked set is kept as sorted, separate [start, end)
// strips; adding tape merges every strip it overlaps or touches, removing cuts a gap and keeps the stubs on both sides,
// and a query asks whether one single strip covers the whole range.
import { options, row } from './util.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isPair = (v) => !!row(v) && v.length === 2 && v.every(isNum);
const show = (p) => `[${p[0]}, ${p[1]})`;
const showAll = (l) => (l.length ? l.map(show).join(' ') : 'nothing');

/** the strips: the first field of this that is a list of [start, end] pairs */
function stripsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const v = Object.values(o).find((x) => Array.isArray(x) && x.every(isPair));
  return v || null;
}
function opOf(ctx) {
  const op = ctx.ops?.[ctx.op];
  if (!op || !isPair(op.args)) return null;
  const kind = /add/i.test(op.name) ? 'add' : /remove/i.test(op.name) ? 'remove' : /query/i.test(op.name) ? 'query' : null;
  return kind && { kind, q: op.args };
}
const byStart = (l) => [...l].sort((a, b) => a[0] - b[0]);
/** what the strips should become, plus a wrong variant to offer as an option */
function addTo(list, q, touch = true) {
  const out = [];
  for (const [a, b] of byStart([...list, q])) {
    const last = out[out.length - 1];
    if (last && (touch ? a <= last[1] : a < last[1])) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}
function removeFrom(list, [l, r]) {
  const out = [];
  for (const [a, b] of list) {
    if (b <= l || a >= r) out.push([a, b]);
    else {
      if (a < l) out.push([a, l]);
      if (b > r) out.push([r, b]);
    }
  }
  return byStart(out);
}
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);

export default {
  id: 'range-module',
  metaphor: 'Strips of tape on a ruler',
  caption: 'The tracked numbers are kept as separate strips of tape [start, end), sorted left to right. Adding tape merges every strip it overlaps or touches; removing cuts a gap and keeps the stubs; a query needs one strip covering all of it.',
  narrate(ctx) {
    const op = opOf(ctx);
    const now = stripsOf(ctx.vars);
    if (!op || !now) return null;
    const { kind, q } = op;
    if (kind === 'query' && ctx.ret && typeof ctx.value === 'boolean') {
      const cover = now.find(([a, b]) => a <= q[0] && q[0] < b);
      if (ctx.value) return cover ? `${show(cover)} covers all of ${show(q)}: tracked` : `${show(q)} is tracked`;
      if (!cover) return `no strip covers ${q[0]}, the start of ${show(q)}: not tracked`;
      return cover[1] < q[1] ? `${show(cover)} covers ${q[0]} but stops at ${cover[1]}, before ${q[1]}: not tracked` : `${show(q)} is not fully tracked`;
    }
    const before = stripsOf(ctx.prev);
    if (before && !same(before, now)) {
      if (kind === 'add') {
        const merged = before.length + 1 - now.length;
        return `tape ${show(q)} laid down${merged > 0 ? `, merged with ${merged} strip${merged === 1 ? '' : 's'} it overlaps or touches` : ''}: ${showAll(now)}`;
      }
      if (kind === 'remove') return `cut ${show(q)} out of the tape: ${showAll(now)}`;
    }
    // remove: stubs that survive on either side of the cut
    const pk = Object.keys(ctx.vars).find((k) => k !== 'this' && Array.isArray(ctx.vars[k]) && ctx.vars[k].length && ctx.vars[k].every(isPair) && Array.isArray(ctx.prev[k]) && ctx.vars[k].length === ctx.prev[k].length + 1);
    if (kind === 'remove' && pk) {
      const p = ctx.vars[pk][ctx.vars[pk].length - 1];
      if (p[1] === q[0]) return `the stub ${show(p)} left of the cut survives`;
      if (p[0] === q[1]) return `the stub ${show(p)} right of the cut survives`;
    }
    // add: the new strip swallows a neighbour and grows
    if (kind === 'add') {
      const s = ['left', 'l', 'start', 's', 'lo', 'from'].find((k) => isNum(ctx.vars[k]) && isNum(ctx.prev[k]));
      const e = ['right', 'r', 'end', 'e', 'hi', 'to'].find((k) => isNum(ctx.vars[k]) && isNum(ctx.prev[k]));
      const holds = (v) => v[s] <= q[0] && v[e] >= q[1];
      if (s && e && (ctx.vars[s] !== ctx.prev[s] || ctx.vars[e] !== ctx.prev[e]) && holds(ctx.vars) && holds(ctx.prev)) {
        const hit = ['j', 'i', 'k', 'idx'].map((k) => ctx.vars[k]).find((x) => Number.isInteger(x) && now[x] && now[x][0] <= ctx.vars[e] && ctx.vars[s] <= now[x][1]);
        return `it ${hit === undefined ? 'overlaps or touches a strip' : `meets ${show(now[hit])}`}, so the new tape grows to ${show([ctx.vars[s], ctx.vars[e]])}`;
      }
    }
    return null;
  },
  predict(ctx) {
    const op = opOf(ctx);
    const now = stripsOf(ctx.vars);
    if (!op || !now || !ctx.next || ctx.next.op !== ctx.op) return null;
    const { kind, q } = op;
    // right before a query answers
    if (kind === 'query' && ctx.next.ret && typeof ctx.next.value === 'boolean' && !ctx.ret) {
      const cover = now.find(([a, b]) => a <= q[0] && q[0] < b);
      return {
        question: `Tracked: ${showAll(now)}. Is all of ${show(q)} tracked?`,
        options: ['Yes', 'No'],
        answer: ctx.next.value ? 0 : 1,
        explain: ctx.next.value
          ? cover ? `${show(cover)} alone covers ${q[0]} up to ${q[1]}.` : 'This code answers yes.'
          : !cover ? `No strip covers ${q[0]}.` : cover[1] < q[1] ? `The strip holding ${q[0]} is ${show(cover)}; it ends at ${cover[1]}, so ${cover[1]} is not tracked.` : 'This code answers no.',
      };
    }
    // right before the strips change in one go: what do they become?
    const next = stripsOf(ctx.next.vars);
    if (!next || same(next, now) || (kind !== 'add' && kind !== 'remove')) return null;
    const want = kind === 'add' ? addTo(now, q) : removeFrom(now, q);
    if (!same(want, next) || !now.length) return null;
    const wrong =
      kind === 'add'
        ? [addTo(now, q, false), byStart([...now, q]), now]
        : [now.filter(([a, b]) => b <= q[0] || a >= q[1]), byStart([...now.filter(([a, b]) => b <= q[0] || a >= q[1]), ...now.filter(([a, b]) => a < q[0] && b > q[0]).map(([a]) => [a, q[0]])]), now];
    return options(
      `Strips: ${showAll(now)}. After ${kind === 'add' ? 'adding' : 'removing'} ${show(q)}, what is tracked?`,
      showAll(want),
      wrong.map(showAll).filter((x) => x !== showAll(want)),
      kind === 'add'
        ? `Every strip that overlaps or touches ${show(q)} melts into one: touching ends (like 5 and 5) join, because [1, 5) ∪ [5, 10) has no gap.`
        : `Each strip the cut crosses keeps its stubs outside ${show(q)}: the part before ${q[0]} and the part from ${q[1]} on.`,
    );
  },
  bugs: [
    {
      label: 'Touching strips are not merged',
      find: 'while (j < this.iv.length && this.iv[j][0] <= right)',
      replace: 'while (j < this.iv.length && this.iv[j][0] < right)',
      explain: '[1, 5) and [5, 10) stay two strips, so the query [1, 10) finds no single strip covering it and answers false.',
    },
    {
      label: 'Query checks overlap, not cover',
      find: 'return k >= 0 && this.iv[k][1] >= right;',
      replace: 'return k >= 0 && this.iv[k][1] > left;',
      explain: 'A strip that merely reaches past left is not enough: [13, 15) touches [10, 14) but 14 is not tracked, so the answer must be false.',
    },
  ],
};
