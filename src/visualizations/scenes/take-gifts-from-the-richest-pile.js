// Scene: Take Gifts From the Richest Pile. Every second the richest pile is raided: only floor(√pile) gifts are
// left in it. A max-heap keeps the richest pile on top. Reads the learner's heap (toolkit MaxHeap / PriorityQueue
// or an array named heap / pq), or the gifts array itself when they shrink piles in place.
import { itemsOf, options } from './util.js';

const nums = (a) => Array.isArray(a) && a.every((x) => typeof x === 'number');

/** [name, numbers] of the pile holder: a non-parameter heap-like variable, else the gifts parameter */
function piles(ctx, vars) {
  if (!vars) return null;
  const own = Object.keys(vars).find((k) => !ctx.params.includes(k) && /heap|pq|piles|queue/i.test(k) && nums(itemsOf(vars[k])));
  if (own) return [own, itemsOf(vars[own])];
  const g = ctx.params[0];
  return nums(vars[g]) ? [g, vars[g]] : null;
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
/** { gone, added } between two snapshots of the same holder, or null */
function diff(ctx, before, after) {
  const p = piles(ctx, before);
  const q = piles(ctx, after);
  if (!p || !q || p[0] !== q[0]) return null;
  return { name: q[0], items: q[1], was: p[1], gone: minus(p[1], q[1]), added: minus(q[1], p[1]) };
}
const sum = (a) => a.reduce((s, x) => s + x, 0);

export default {
  id: 'take-gifts-from-the-richest-pile',
  metaphor: 'Raid the richest pile, leave its root',
  caption: 'The heap is a stack of gift piles with the richest on top. Each second the top pile is raided and only floor(√pile) gifts go back; what is left in all piles at the end is the answer.',
  narrate(ctx) {
    if (ctx.ret && typeof ctx.value === 'number') return `${ctx.value} gifts are left across all piles after ${ctx.vars[ctx.params[1]]} raids`;
    if (!(ctx.params[0] in ctx.prev)) return null;
    const d = diff(ctx, ctx.prev, ctx.vars);
    if (!d) return null;
    const { gone, added, items } = d;
    if (gone.length === 1 && !added.length) return `the richest pile, ${gone[0]} gifts, is raided`;
    if (gone.length === 1 && added.length === 1) return `the pile of ${gone[0]} shrinks to floor(√${gone[0]}) = ${added[0]} (${sum(items)} gifts left in all)`;
    if (added.length === 1 && !gone.length) {
      const x = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && typeof v === 'number' && v > 1 && Math.floor(Math.sqrt(v)) === added[0] && !items.includes(v))?.[1];
      if (x !== undefined) return `only floor(√${x}) = ${added[0]} gifts are left in the raided pile; it goes back on the heap`;
    }
    if (added.length === 1 && !gone.length) return `a pile of ${added[0]} goes onto the heap (${items.length} pile${items.length > 1 ? 's' : ''}, richest on top: ${Math.max(...items)})`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next || !(ctx.params[0] in ctx.prev)) return null;
    const d = diff(ctx, ctx.vars, ctx.next.vars);
    if (!d) return null;
    const { gone, added, was } = d;
    // a pile is about to be raided: which one?
    if (gone.length === 1 && !added.length && was.length > 1) {
      const wrong = [Math.min(...was), was[was.length - 1], was[0]].filter((x) => x !== gone[0]);
      return options(`Piles: [${[...was].sort((a, b) => b - a).join(', ')}]. Which pile is raided now?`, gone[0], wrong, `The richest pile, ${gone[0]}, is always raided first; the max-heap keeps it on top.`);
    }
    // a raided pile is about to go back (or shrink in place): how many gifts are left in it?
    const prevD = diff(ctx, ctx.prev, ctx.vars);
    const inPlace = gone.length === 1 && added.length === 1;
    if ((added.length === 1 && !gone.length && prevD && prevD.gone.length === 1 && !prevD.added.length) || inPlace) {
      const x = inPlace ? gone[0] : prevD.gone[0];
      const r = Math.sqrt(x);
      const wrong = [Math.round(r), Math.ceil(r), x - Math.floor(r), Math.floor(x / 2)].filter((v) => v !== added[0]);
      return options(`The pile of ${x} is raided. How many gifts are left in it?`, added[0], wrong, `√${x} ≈ ${r.toFixed(2)}, and the floor of that, ${Math.floor(r)}, stays in the pile.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Round instead of floor',
      find: 'Math.floor(Math.sqrt(top))',
      replace: 'Math.round(Math.sqrt(top))',
      explain: 'A pile of 8 should keep floor(2.83) = 2 gifts, but rounding leaves 3, so too many gifts remain.',
    },
    {
      label: 'Min-heap: raid the poorest pile',
      find: 'new MaxHeap()',
      replace: 'new MinHeap()',
      explain: 'The smallest pile is on top, so the raids hit piles that barely shrink and the rich piles stay rich.',
    },
  ],
};
