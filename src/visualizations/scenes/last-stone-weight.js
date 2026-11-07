// Scene: Last Stone Weight. A pile of stones with the heaviest on top: lift the two heaviest, smash them together,
// and put back what is left of the bigger one. Reads the pile as a number heap / array the learner keeps (a toolkit
// heap, a plain heap array, or the stones array itself when they re-sort it) and diffs it between steps.
import { itemsOf, options } from './util.js';

const nums = (a) => Array.isArray(a) && a.every((x) => typeof x === 'number');

/** { name, items } of the pile: a heap-like variable of numbers, else the stones parameter itself */
function pileOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const isHeap = v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|pile/i.test(k);
    const items = isHeap ? itemsOf(v) : null;
    if (nums(items)) return { name: k, items };
  }
  const p = params[0];
  return nums(vars?.[p]) ? { name: p, items: vars[p] } : null;
}
function minus(a, b) {
  const left = [...b];
  return a.filter((x) => {
    const i = left.indexOf(x);
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
/** what changed on the pile between two steps: { added, gone } or null */
function diff(before, after, params) {
  const p = pileOf(before, params);
  const q = pileOf(after, params);
  if (!p || !q || p.name !== q.name) return null;
  return { added: minus(q.items, p.items), gone: minus(p.items, q.items), pile: q.items };
}
/** the numbers the code holds in hand (non-parameter number variables) */
const held = (vars, params) => Object.entries(vars).filter(([k, v]) => !params.includes(k) && typeof v === 'number');
const left = (n) => `${n} stone${n === 1 ? '' : 's'} left on the pile`;

export default {
  id: 'last-stone-weight',
  metaphor: 'Smash the two heaviest stones',
  caption: 'The heap is the pile, heaviest stone on top. Each round lifts the two heaviest and smashes them: equal stones turn to dust, otherwise the difference goes back onto the pile.',
  narrate(ctx) {
    if (ctx.ret && typeof ctx.value === 'number') {
      return ctx.value === 0 ? 'no stone is left: every one was smashed to dust, so the answer is 0' : `one stone survives, weighing ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const d = diff(ctx.prev, ctx.vars, ctx.params);
    if (!d) return null;
    const { added, gone, pile } = d;
    if (gone.length === 1 && !added.length) return `lift the heaviest stone left, ${gone[0]} (${left(pile.length)})`;
    if (added.length === 1 && !gone.length) {
      const r = added[0];
      const hand = held(ctx.vars, ctx.params).map(([, v]) => v);
      const y = hand.find((a) => hand.some((b) => a - b === r && b > 0));
      if (y !== undefined) return `smash ${y} against ${y - r}: ${y} − ${y - r} = ${r} goes back onto the pile`;
      return `stone ${r} goes onto the pile (${pile.length} on it)`;
    }
    return null;
  },
  // just after the second stone of a round is lifted: what goes back?
  predict(ctx) {
    if (!ctx.next || !Object.keys(ctx.prev).length) return null;
    const d = diff(ctx.prev, ctx.vars, ctx.params);
    if (!d || d.gone.length !== 1 || d.added.length) return null;
    const x = d.gone[0];
    // the first stone of this round is still in hand, under another name, and is at least as heavy
    const hand = held(ctx.vars, ctx.params);
    const now = hand.find(([k, v]) => v === x && ctx.prev[k] !== v);
    const first = hand.find(([k, v]) => now && k !== now[0] && v >= x && ctx.prev[k] === v);
    if (!now || !first) return null;
    // the first stone was lifted by the line just above (else the other number in hand is from an older round)
    const above = ctx.lines.slice(0, ctx.line - 1).reverse().find((l) => l.trim()) || '';
    if (!new RegExp(`\\b${first[0]}\\s*=[^=]`).test(above)) return null;
    const y = first[1];
    const n = diff(ctx.vars, ctx.next.vars, ctx.params);
    if (!n) return null;
    // another lift right after means this was the round's first stone (the other number in hand is stale),
    // unless the two are equal and turned to dust
    if (n.gone.length && y !== x) return null;
    let right;
    if (n.added.length === 1 && !n.gone.length) right = n.added[0];
    else if (!n.added.length) right = 'nothing';
    else return null;
    return options(
      `Stones ${y} and ${x} smash together. What goes back onto the pile?`,
      right,
      ['nothing', y - x, y + x, y].filter((w) => String(w) !== String(right)),
      y === x ? `Both weigh ${x}, so both turn to dust and nothing goes back.` : `${y} is heavier: it loses ${x} and the ${y - x} that is left goes back onto the pile.`,
    );
  },
  bugs: [
    {
      label: 'Min-heap: smashes the lightest stones',
      find: 'new MaxHeap()',
      replace: 'new MinHeap()',
      explain: 'With the lightest stone on top, each round smashes the two smallest stones instead of the two heaviest, so a different stone survives.',
    },
    {
      label: 'Peek an empty pile',
      find: 'heap.isEmpty() ? 0 : heap.peek()',
      replace: 'heap.peek()',
      explain: 'When every stone turns to dust the pile is empty, and peeking it gives undefined instead of 0.',
    },
  ],
};
