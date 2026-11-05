// Scene: Merge k Sorted Lists. k sorted piles of cards, face up: only the front card of each pile can be taken.
// The heap holds those fronts (list nodes, smallest on top); take the smallest, link it to the end of the merged
// line, and that pile's next card becomes its new front. Reads a heap of list nodes ({ $list } items) and a
// dummy-like merged list; anything else falls back to the generic notes.
import { itemsOf, options } from './util.js';

const isList = (v) => !!(v && v.$list && Array.isArray(v.$list.values));
const DUMMY = ['dummy', 'sentinel', 'fake', 'pre', 'preHead', 'prehead', 'head', 'res', 'result', 'ans', 'root', 'start', 'merged'];

/** { name, items } of the fronts: a heap of list nodes (toolkit heap, or a heap / pq named array) */
function frontsOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const isHeap = v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq|fronts/i.test(k);
    const items = isHeap ? itemsOf(v) : null;
    if (Array.isArray(items) && items.every(isList)) return { name: k, items };
  }
  return null;
}
const idOf = (l) => l.$list.ids?.[0];
const valOf = (l) => l.$list.values[0];
/** list items in `a` whose front node is not in `b` */
const minus = (a, b) => a.filter((x) => !b.some((y) => idOf(y) === idOf(x)));
const diff = (before, after, params) => {
  const p = frontsOf(before, params);
  const q = frontsOf(after, params);
  if (!p || !q || p.name !== q.name) return null;
  return { added: minus(q.items, p.items), gone: minus(p.items, q.items), fronts: q.items };
};
const showVals = (vals) => (vals.length > 10 ? `${vals.slice(0, 10).join(' → ')} → …` : vals.join(' → '));

export default {
  id: 'merge-k-sorted-lists',
  metaphor: 'Take the smallest front card',
  caption: 'Each list is a sorted pile of cards; the heap holds the front card of every pile, smallest on top. Take the top card, link it to the end of the merged line, and that pile shows its next card.',
  narrate(ctx) {
    if (ctx.ret) {
      if (isList(ctx.value)) return `every pile is empty: the merged line is ${showVals(ctx.value.$list.values)}`;
      return ctx.value === null ? 'nothing to merge: the answer is an empty list' : null;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const d = diff(ctx.prev, ctx.vars, ctx.params);
    if (d) {
      const { added, gone, fronts } = d;
      const shown = `fronts now: ${fronts.map(valOf).join(', ') || 'none'}`;
      if (gone.length === 1 && !added.length) return `take the smallest front card, ${valOf(gone[0])} (${shown})`;
      if (added.length === 1 && !gone.length) {
        // nothing merged yet (no dummy-led line longer than the dummy): this is the set-up, one pile at a time
        const fresh = !DUMMY.some((k) => k !== 'head' && isList(ctx.vars[k]) && ctx.vars[k].$list.values.length > 1);
        return fresh ? `a pile starting with ${valOf(added[0])} puts its front card in (${shown})` : `that pile's next card, ${valOf(added[0])}, becomes its new front (${shown})`;
      }
    }
    // a link: the dummy-led merged line grew by one node
    const name = DUMMY.find((k) => isList(ctx.vars[k]) && isList(ctx.prev[k]));
    if (!name) return null;
    const now = ctx.vars[name].$list;
    const before = ctx.prev[name].$list;
    const at = now.ids.findIndex((id, i) => id !== before.ids[i]);
    if (at < 1) return null;
    const merged = now.values.slice(1, at + 1); // index 0 is the dummy
    return `${now.values[at]} is linked to the end of the merged line: ${showVals(merged)}`;
  },
  // before a front card is taken: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const f = frontsOf(ctx.vars, ctx.params);
    const n = diff(ctx.vars, ctx.next.vars, ctx.params);
    if (!f || !n || n.gone.length !== 1 || n.added.length || f.items.length < 2) return null;
    const right = valOf(n.gone[0]);
    const wrong = [...new Set(f.items.map(valOf))].filter((v) => v !== right);
    return options(
      `The front cards are ${f.items.map(valOf).join(', ')}. Which card is taken next?`,
      right,
      wrong.slice(0, 3),
      `${right} is the smallest front card, and every card behind a front is at least as big as its front, so ${right} is the smallest card left anywhere.`,
    );
  },
  bugs: [
    {
      label: 'Max-heap order: takes the biggest front',
      find: 'new MinHeap((node) => node.val)',
      replace: 'new MaxHeap((node) => node.val)',
      explain: 'With the biggest front on top, cards are taken out of order, so the merged line is not sorted.',
    },
    {
      label: 'Forgets the pile\'s next card',
      find: 'if (node.next) heap.push(node.next);',
      replace: '',
      explain: 'After a front card is taken its pile never shows its next card, so only the first card of each list is merged.',
    },
  ],
};
