import { itemsOf } from './util.js';
// Scene: Kth Largest Element in a Stream. A podium with only k places: every new value climbs on, and when one
// too many stand there the weakest is bumped off. The weakest of the k strongest (the min-heap's top) is the
// answer. Reads `this`'s k-like field and its heap (toolkit MinHeap / PriorityQueue or a plain array).
const nums = (a) => a && a.every((x) => typeof x === 'number');

/** { name, items, k } from this's fields: the one number array (or heap) field, and k / cap / size / limit */
function podium(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const hs = Object.entries(o).filter(([, v]) => nums(itemsOf(v)));
  if (hs.length !== 1) return null;
  const kf = ['k', 'K', 'cap', 'capacity', 'limit', 'size', 'n'].find((f) => Number.isInteger(o[f]));
  return { name: hs[0][0], items: itemsOf(hs[0][1]), k: kf ? o[kf] : undefined };
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
const spots = (p) => (p.k !== undefined && p.items.length > p.k ? `${p.items.length} values for ${p.k} places` : `${p.items.length}${p.k !== undefined ? ` of ${p.k}` : ''} places taken`);
const nth = (k) => (k === undefined ? 'k-th' : `${k}${[11, 12, 13].includes(k % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][k % 10] || 'th'}`);

export default {
  id: 'kth-largest-element-in-a-stream',
  metaphor: 'A podium with only k places',
  caption: 'The heap is a podium holding the k largest values seen so far, with the weakest on top (index 0). A newcomer climbs on; if that makes k + 1, the weakest is bumped off, and the new top is the k-th largest.',
  narrate(ctx) {
    const p = podium(ctx.vars);
    if (!p) return null;
    if (ctx.ret && p.items.length) {
      const weakest = Math.min(...p.items);
      return p.k !== undefined && p.items.length < p.k ? `only ${p.items.length} of ${p.k} places taken so far; the weakest on the podium is ${weakest}` : `the weakest on the podium, ${weakest}, is the ${nth(p.k)} largest so far`;
    }
    const q = podium(ctx.prev);
    if (!q || q.name !== p.name) return null;
    const added = minus(p.items, q.items);
    const gone = minus(q.items, p.items);
    if (added.length === 1 && !gone.length) return `${added[0]} climbs onto the podium (${spots(p)})`;
    if (gone.length === 1 && !added.length) return `one too many: the weakest, ${gone[0]}, is bumped off (${spots(p)})`;
    if (gone.length === 1 && added.length === 1) return `${added[0]} replaces the weakest, ${gone[0]}, on the podium`;
    return null;
  },
  // in an add() call, right after a value climbed on: who (if anyone) is bumped off?
  predict(ctx) {
    if (!(ctx.op >= 1)) return null;
    const p = podium(ctx.vars);
    const q = podium(ctx.prev);
    const n = podium(ctx.next.vars);
    if (!p || !q || !n || p.name !== q.name || p.name !== n.name || p.k === undefined) return null;
    const added = minus(p.items, q.items);
    if (added.length !== 1 || minus(q.items, p.items).length) return null;
    const gone = minus(p.items, n.items);
    if (minus(n.items, p.items).length || gone.length > 1) return null;
    const right = gone.length ? String(gone[0]) : 'nobody';
    const opts = [...new Set([right, 'nobody', ...[...p.items].sort((a, b) => a - b).map(String)])].slice(0, 4);
    if (opts.length < 2) return null;
    return {
      question: `${added[0]} climbed on: the podium holds [${p.items.join(', ')}] and has ${p.k} places. Who is bumped off?`,
      options: opts,
      answer: opts.indexOf(right),
      explain: gone.length ? `${p.items.length} values for ${p.k} places: the smallest, ${gone[0]}, cannot be among the ${p.k} largest.` : `${p.items.length} values fit in ${p.k} places, so everyone stays.`,
    };
  },
  bugs: [
    {
      label: 'Trim at k: one place short',
      find: 'this.heap.size() > this.k',
      replace: 'this.heap.size() >= this.k',
      explain: 'The podium is trimmed as soon as it is full, so it only keeps k − 1 values and its top is the (k − 1)-th largest.',
    },
    {
      label: 'Max-heap: the strongest on top',
      find: 'new MinHeap()',
      replace: 'new MaxHeap()',
      explain: 'With the largest on top, each trim bumps off the best value and add() returns the maximum, not the k-th largest.',
    },
  ],
};
