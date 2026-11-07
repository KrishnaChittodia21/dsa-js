// Sliding Window Maximum (monotonic deque). A line of contenders for "tallest in the window": a newcomer sends
// every contender not taller than it home (it outlasts them), the front is the window's max and leaves once it
// slides out. Works with a toolkit Deque or a plain array (dq/deque/q/window…), holding indexes or values.
import { firstInt, row } from './util.js';

const isInt = Number.isInteger;
const AT = ['i', 'r', 'right', 'j', 'end', 'idx', 'hi'];
const RES = ['res', 'result', 'ans', 'out', 'output', 'answer', 'maxes'];

/** the items of a deque / queue snapshot, front first: a plain array, a toolkit Queue (items/head) or Deque (ring) */
function listOf(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.items)) return isInt(o.head) ? o.items.slice(o.head) : o.items;
  if (row(o.buf) && isInt(o.head) && isInt(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** how a deque changed: push (at the back), back / front (one popped), or null */
function change(before, after, src) {
  if (!before || !after) return null;
  if (after.length === before.length + 1 && same(after.slice(0, -1), before)) return { kind: 'push', x: after[after.length - 1] };
  if (after.length !== before.length - 1) return null;
  const back = same(after, before.slice(0, -1));
  const front = same(after, before.slice(1));
  if (back && front) return /popFront|shift|dequeue|pollFirst/.test(src || '') ? { kind: 'front', x: before[0] } : /popBack|\.pop\(/.test(src || '') ? { kind: 'back', x: before[0] } : null;
  return back ? { kind: 'back', x: before[before.length - 1] } : front ? { kind: 'front', x: before[0] } : null;
}

function stateOf(ctx, vars) {
  if (!vars) return null;
  const arrName = ctx.params[0];
  const a = row(vars[arrName]);
  const dq = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && /dq|deque|^q$|queue|win|cand|line/i.test(k) && listOf(v));
  if (!a || !dq) return null;
  const idx = new RegExp(`\\b${arrName}\\s*\\[\\s*${dq[0]}\\s*[.[]`).test(ctx.lines.join('\n'));
  const [iName, i] = firstInt(vars, AT.filter((n) => !ctx.params.includes(n)));
  return { a, idx, dqName: dq[0], list: listOf(dq[1]), iName, i, val: (x) => (idx ? a[x] : x), desc: (x) => (idx ? `${a[x]} (index ${x})` : `${x}`) };
}

export default {
  id: 'sliding-window-maximum',
  metaphor: 'A line of contenders for tallest',
  caption: 'The deque is a line of contenders, biggest at the front. A newcomer sends home everyone not bigger than it (they leave before it does and can never win); the front is the max and leaves once it slides out of the window.',
  pointers: ['i', 'r', 'right'],
  compare: 'res',
  narrate(ctx) {
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    if (!s) return null;
    const { a, i, val, desc, list } = s;
    const line = () => (list.length ? list.map(val).join(' ≥ ') : 'empty');
    const c = p && p.dqName === s.dqName ? change(p.list, list, ctx.src) : null;
    if (c?.kind === 'back') return isInt(i) && i < a.length ? `${desc(c.x)} is not bigger than the newcomer ${a[i]}: it can never be the max again, so it goes home` : `${desc(c.x)} leaves the back of the line`;
    if (c?.kind === 'front') return `${desc(c.x)} slid out of the window: ${list.length ? `${val(list[0])} is at the front now` : 'the line is empty'}`;
    if (c?.kind === 'push') return `${desc(c.x)} joins the back of the line (contenders: ${line()})`;
    const resName = RES.find((n) => row(ctx.vars[n]) && row(ctx.prev[n]) && ctx.vars[n].length === ctx.prev[n].length + 1);
    if (resName && isInt(i) && isInt(ctx.vars[ctx.params[1]])) {
      const k = ctx.vars[ctx.params[1]];
      const out = ctx.vars[resName][ctx.vars[resName].length - 1];
      return `window ${Math.max(0, i - k + 1)}..${i} is full: its max is ${out}, the contender at the front`;
    }
    return null;
  },
  // the next number arrives: does the contender at the back go home, or does the newcomer queue behind it?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = stateOf(ctx, ctx.vars);
    const n = stateOf(ctx, ctx.next.vars);
    if (!s || !n || n.dqName !== s.dqName || !s.list.length || !isInt(n.i) || n.iName !== s.iName || n.i >= s.a.length) return null;
    const p = stateOf(ctx, ctx.prev);
    if (p && p.dqName === s.dqName && change(p.list, s.list, ctx.src)?.kind === 'back') return null; // mid-way through popping
    const c = change(s.list, n.list, ctx.lines[ctx.next.line - 1]);
    if (!c || c.kind === 'front') return null;
    const v = s.a[n.i];
    const backVal = s.val(s.list[s.list.length - 1]);
    if (c.kind === 'push' && c.x !== (s.idx ? n.i : v)) return null;
    const goes = `${backVal} goes home`;
    const stays = `${v} queues behind ${backVal}`;
    const opts = [goes, stays];
    return {
      question: `${v} arrives (index ${n.i}). The contender at the back of the line is ${backVal}. What happens?`,
      options: opts,
      answer: c.kind === 'back' ? 0 : 1,
      explain: c.kind === 'back' ? `${backVal} ≤ ${v}, and ${v} stays in the window longer, so ${backVal} can never be the max again.` : `${backVal} > ${v}: ${backVal} is still the bigger one, but ${v} may become the max after ${backVal} slides out, so it waits.`,
    };
  },
  bugs: [
    {
      label: 'Expire one step late: front < i - k',
      find: 'dq.front() <= i - k',
      replace: 'dq.front() < i - k',
      explain: 'The index that leaves at step i is i − k; keeping it one more step makes the window k + 1 wide, so an old max is reported once too often.',
    },
    {
      label: 'if instead of while at the back',
      find: 'while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack();',
      replace: 'if (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack();',
      explain: 'A big newcomer sends home only one smaller contender; others stay in front of it, so the line is no longer biggest-first and the front is not the max.',
    },
  ],
};
