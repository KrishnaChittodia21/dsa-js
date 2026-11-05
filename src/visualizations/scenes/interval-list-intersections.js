// Interval List Intersections: two people's free slots, each list sorted. Compare the two current slots, write down
// the time they share, then the slot that ends first is used up and that person moves to their next slot.
import { options, row } from './util.js';

const PTRS = [
  ['i', 'j'],
  ['p', 'q'],
  ['a', 'b'],
  ['p1', 'p2'],
  ['i1', 'i2'],
  ['x', 'y'],
  ['l', 'r'],
];
const OUT = ['out', 'result', 'res', 'ans', 'answer', 'output', 'common', 'inter'];
const isPair = (v) => row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;

function outOf(vars) {
  const k = OUT.find((n) => listOf(vars[n]));
  return k ? vars[k] : null;
}

/** the two current slots and pointer names, or null */
function stateOf(vars, params) {
  const A = listOf(vars[params[0]]);
  const B = listOf(vars[params[1]]);
  const pr = PTRS.find(([x, y]) => Number.isInteger(vars[x]) && Number.isInteger(vars[y]));
  if (!A || !B || !pr) return null;
  return { A, B, iN: pr[0], jN: pr[1], i: vars[pr[0]], j: vars[pr[1]] };
}

export default {
  id: 'interval-list-intersections',
  metaphor: 'Two diaries, finding shared free time',
  caption: 'Each list is one person\'s free slots, in order. The time two current slots share is max(starts) to min(ends); then whichever slot ends first is used up, and only that person moves on.',
  narrate(ctx) {
    const [an, bn] = ctx.params;
    const now = stateOf(ctx.vars, ctx.params);
    const was = stateOf(ctx.prev, ctx.params);
    const out = outOf(ctx.vars);
    const before = outOf(ctx.prev);
    if (out && before && out.length === before.length + 1 && now && now.A[now.i] && now.B[now.j]) {
      const p = out[out.length - 1];
      return `${an} ${show(now.A[now.i])} and ${bn} ${show(now.B[now.j])} are both free from ${p[0]} to ${p[1]}: write down ${show(p)}${p[0] === p[1] ? ' (one moment counts)' : ''}`;
    }
    if (!now || !was || now.iN !== was.iN) return null;
    const a = now.A[was.i];
    const b = now.B[was.j];
    if (!a || !b) return null;
    const none = Math.max(a[0], b[0]) > Math.min(a[1], b[1]) ? 'no shared time; ' : '';
    if (now.i === was.i + 1 && now.j === was.j) return `${none}${an}'s ${show(a)} ends ${a[1] === b[1] ? 'at the same time' : `first (at ${a[1]})`}: it is used up, ${an} moves to the next slot`;
    if (now.j === was.j + 1 && now.i === was.i) return `${none}${bn}'s ${show(b)} ends ${a[1] === b[1] ? 'at the same time' : `first (at ${b[1]})`}: it is used up, ${bn} moves to the next slot`;
    return null;
  },
  // before a pointer moves: whose slot is used up?
  predict(ctx) {
    const [an, bn] = ctx.params;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = ctx.next && stateOf(ctx.next.vars, ctx.params);
    if (!now || !nx || now.iN !== nx.iN) return null;
    const a = now.A[now.i];
    const b = now.B[now.j];
    if (!a || !b) return null;
    const mi = nx.i !== now.i;
    const mj = nx.j !== now.j;
    // equal ends: either choice is right, so the question would not be fair
    if ((!mi && !mj) || (a[1] === b[1] && !(mi && mj))) return null;
    const right = mi && mj ? 'Both move on' : mi ? `${an} moves past ${show(a)}` : `${bn} moves past ${show(b)}`;
    const wrong = [`${an} moves past ${show(a)}`, `${bn} moves past ${show(b)}`, 'Both move on'];
    const why = a[1] === b[1] ? `Both end at ${a[1]}, so both are used up.` : `${a[1] < b[1] ? show(a) : show(b)} ends first (at ${Math.min(a[1], b[1])}): it cannot meet any later slot of the other list, while the longer one still can.`;
    return options(`Current slots: ${an} ${show(a)}, ${bn} ${show(b)}. Who moves on next?`, right, wrong, why);
  },
  bugs: [
    {
      label: 'Use lo < hi: one shared moment is dropped',
      find: 'lo <= hi',
      replace: 'lo < hi',
      explain: 'Closed slots that touch, like [0,2] and [2,4], share the moment [2,2]; with < it is never written down.',
    },
    {
      label: 'Move the slot that starts first',
      find: 'if (a1 < b1) i++;',
      replace: 'if (a0 < b0) i++;',
      explain: 'The slot that started first may still be the long one; moving it away skips the later slots it would have overlapped.',
    },
  ],
};
