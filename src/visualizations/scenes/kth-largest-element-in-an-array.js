// Scene: Kth Largest Element in an Array. A podium with only k places: every number climbs on, and when one too
// many stand there the weakest is bumped off. After the last number the weakest on the podium (the min-heap's top)
// is the k-th largest. Reads the one non-parameter number heap / array the learner keeps (toolkit heap or plain).
import { itemsOf, options } from './util.js';

const nums = (a) => Array.isArray(a) && a.every((x) => typeof x === 'number');

/** { name, items } of the podium: a heap-like variable (heap / pq / minHeap…, or a toolkit heap object) of numbers */
function podium(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const isHeap = v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|podium|top/i.test(k);
    const items = isHeap ? itemsOf(v) : null;
    if (nums(items)) return { name: k, items };
  }
  return null;
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
const kOf = (ctx) => (Number.isInteger(ctx.vars[ctx.params[1]]) ? ctx.vars[ctx.params[1]] : undefined);
const spots = (p, k) => (k !== undefined && p.items.length > k ? `${p.items.length} numbers for ${k} places` : `${p.items.length}${k !== undefined ? ` of ${k}` : ''} places taken`);

export default {
  id: 'kth-largest-element-in-an-array',
  metaphor: 'A podium with only k places',
  caption: 'The heap is a podium for the k largest numbers seen so far, the weakest on top (index 0). Each number climbs on; at k + 1 the weakest is bumped off. At the end the top is the k-th largest.',
  narrate(ctx) {
    const k = kOf(ctx);
    const p = podium(ctx.vars, ctx.params);
    if (ctx.ret && typeof ctx.value === 'number') {
      return p ? `every number has had its turn: the weakest of the ${p.items.length} on the podium, ${ctx.value}, is the answer` : `the answer is ${ctx.value}`;
    }
    if (!p) return null;
    const q = podium(ctx.prev, ctx.params);
    if (!q || q.name !== p.name) return null;
    const added = minus(p.items, q.items);
    const gone = minus(q.items, p.items);
    if (added.length === 1 && !gone.length) return `${added[0]} climbs onto the podium (${spots(p, k)})`;
    if (gone.length === 1 && !added.length) return `one too many: the weakest, ${gone[0]}, is bumped off (${spots(p, k)})`;
    if (gone.length === 1 && added.length === 1) return `${added[0]} replaces the weakest, ${gone[0]}, on the podium`;
    return null;
  },
  // right after a number climbed on: who (if anyone) is bumped off?
  predict(ctx) {
    if (!ctx.next) return null;
    const k = kOf(ctx);
    const p = podium(ctx.vars, ctx.params);
    const q = podium(ctx.prev, ctx.params);
    const n = podium(ctx.next.vars, ctx.params);
    if (k === undefined || !p || !q || !n || p.name !== q.name || p.name !== n.name) return null;
    const added = minus(p.items, q.items);
    if (added.length !== 1 || minus(q.items, p.items).length || p.items.length < k) return null; // fewer than k: nobody, obviously
    const gone = minus(p.items, n.items);
    const more = minus(n.items, p.items);
    // nobody leaves only if the next step brings the next number (a push) rather than a pop
    if (gone.length > 1 || (gone.length === 0 && more.length !== 1) || (gone.length === 1 && more.length)) return null;
    const right = gone.length ? gone[0] : 'nobody';
    const wrong = ['nobody', ...[...p.items].sort((a, b) => a - b)].filter((x) => x !== right);
    return options(
      `${added[0]} climbed on: the podium holds [${p.items.join(', ')}] and has ${k} places. Who is bumped off?`,
      right,
      wrong.slice(0, 3),
      gone.length ? `${p.items.length} numbers for ${k} places: the smallest, ${gone[0]}, cannot be among the ${k} largest.` : `${p.items.length} numbers fit in ${k} places, so everyone stays.`,
    );
  },
  bugs: [
    {
      label: 'Max-heap: the strongest on top',
      find: 'new MinHeap()',
      replace: 'new MaxHeap()',
      explain: 'With the largest on top, each trim bumps off the best number, so the podium ends up holding small ones and the answer is wrong.',
    },
    {
      label: 'Trim at k: one place short',
      find: 'heap.size() > k',
      replace: 'heap.size() >= k',
      explain: 'The podium is trimmed as soon as it is full, so it keeps only k − 1 numbers and its top is the (k − 1)-th largest.',
    },
  ],
};
