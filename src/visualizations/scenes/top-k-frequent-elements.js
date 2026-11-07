// Scene: Top K Frequent Elements. A tally of votes, then a podium with only k seats: every value climbs on with its
// vote count, and when the podium is too crowded the value with the fewest votes (the min-heap's top) steps off.
// Works with a Map or a plain-object counter, and a toolkit MinHeap / PriorityQueue or a plain array of pairs.
import { entriesOf, itemsOf, options } from './util.js';

const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
/** [name, entries] of the counter (a Map or an object), never a parameter */
const counterOf = (ctx, vars) => {
  const hit = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && entriesOf(v)?.every(([, n]) => Number.isInteger(n)));
  return hit ? [hit[0], entriesOf(hit[1])] : null;
};
/** [name, items] of the podium: a heap-like collection of [value, count] pairs */
const podiumOf = (ctx, vars) => {
  for (const [k, v] of Object.entries(vars)) {
    if (ctx.params.includes(k) || v?.$map) continue;
    const it = itemsOf(v);
    if (it && (v.$obj || /heap|pq|podium|top|bucket|q$/i.test(k)) && it.every(isPair)) return [k, it];
  }
  return null;
};
/** which slot of a pair holds the count (0 or 1): from the counter when only one way fits, else from the comparator */
function countSlot(items, counts, lines) {
  const get = (x) => counts?.find(([key]) => String(key) === String(x))?.[1];
  const fits = (c) => items.length > 0 && items.every((p) => get(p[1 - c]) === p[c]);
  if (fits(1) !== fits(0)) return fits(1) ? 1 : 0;
  if (!fits(1)) return null;
  // the heap's key / the sort's comparator names the count slot: MinHeap((e) => e[1]), sort((a, b) => a[0] - b[0])
  const m = (lines || []).join('\n').match(/(?:Heap|PriorityQueue|sort)\(\s*\(?\s*\w+\s*(?:,\s*\w+\s*)?\)?\s*=>\s*-?\s*\w+\[([01])\]/);
  return m ? Number(m[1]) : null;
}
/** { value, count } of a pair, given which slot holds the count */
const vc = (p, slot) => (slot === 0 || slot === 1 ? { value: p[1 - slot], count: p[slot] } : null);
/** the pairs in `a` that are not in `b` (multiset difference) */
function minus(a, b) {
  const left = b.map(String);
  return a.filter((p) => {
    const i = left.indexOf(String(p));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
const times = (c) => (c === 1 ? 'once' : `${c} times`);

export default {
  id: 'top-k-frequent-elements',
  metaphor: 'A vote tally, then a k-seat podium',
  caption: 'First every value collects its votes (how often it appears). Then values climb onto a podium with only k seats; when it is too crowded, the one with the fewest votes steps off, so the k most frequent remain.',
  narrate(ctx) {
    const kName = ctx.params[1];
    const k = ctx.vars[kName];
    const c = counterOf(ctx, ctx.vars);
    const pod = podiumOf(ctx, ctx.vars);
    if (ctx.ret && Array.isArray(ctx.value) && pod) return `the podium's values are the answer: [${ctx.value.join(', ')}], the ${ctx.value.length} most frequent`;
    const before = pod && podiumOf(ctx, ctx.prev);
    if (pod && before && before[0] === pod[0]) {
      const counts = c?.[1];
      if (pod[1].length === before[1].length + 1) {
        const [p] = minus(pod[1], before[1]);
        const e = p && vc(p, countSlot([...pod[1], ...before[1]], counts, ctx.lines));
        if (e) return `${e.value} (${times(e.count)}) climbs onto the podium: ${pod[1].length} on it, ${Number.isInteger(k) ? `${k} seat${k === 1 ? '' : 's'}` : 'k seats'}`;
      }
      if (pod[1].length === before[1].length - 1) {
        const [p] = minus(before[1], pod[1]);
        const e = p && vc(p, countSlot([...pod[1], ...before[1]], counts, ctx.lines));
        if (e) return `too crowded: ${e.value}, with the fewest votes (${times(e.count)}), steps off the podium`;
      }
    }
    const was = counterOf(ctx, ctx.prev);
    if (c && was && was[0] === c[0]) {
      const changed = c[1].filter(([key, n]) => was[1].find(([k2]) => String(k2) === String(key))?.[1] !== n);
      if (changed.length === 1) {
        const [key, n] = changed[0];
        return n === 1 ? `${key} gets its first vote` : `${key} again: ${n} votes now`;
      }
    }
    return null;
  },
  // the podium is one over: who steps off?
  predict(ctx) {
    if (!ctx.next) return null;
    const pod = podiumOf(ctx, ctx.vars);
    const after = podiumOf(ctx, ctx.next.vars);
    const k = ctx.vars[ctx.params[1]];
    if (!pod || !after || after[0] !== pod[0] || after[1].length !== pod[1].length - 1 || pod[1].length < 2) return null;
    const counts = counterOf(ctx, ctx.vars)?.[1];
    const [gone] = minus(pod[1], after[1]);
    const slot = countSlot(pod[1], counts, ctx.lines);
    const e = gone && vc(gone, slot);
    const all = pod[1].map((p) => vc(p, slot));
    // a tie for fewest votes: which one the heap drops is not a fair question
    if (!e || all.some((x) => !x) || all.filter((x) => x.count === e.count).length > 1) return null;
    const wrong = all.filter((x) => x.value !== e.value).map((x) => x.value);
    return options(
      `The podium holds ${all.map((x) => `${x.value} (${times(x.count)})`).join(', ')} but has ${Number.isInteger(k) ? `${k} seat${k === 1 ? '' : 's'}` : 'k seats'}. Who steps off?`,
      e.value,
      wrong.slice(0, 3),
      `The min-heap keeps the fewest votes on top, so ${e.value} (${times(e.count)}) is the one removed: it cannot be in the top k.`,
    );
  },
  bugs: [
    {
      label: 'Heap keyed the wrong way',
      find: 'new MinHeap((e) => e[1])',
      replace: 'new MinHeap((e) => -e[1])',
      explain: 'With the most frequent value on top, every pop removes the favourite, so the podium ends up holding the least frequent values.',
    },
    {
      label: 'Return the counts, not the values',
      find: 'map((e) => e[0])',
      replace: 'map((e) => e[1])',
      explain: 'Each podium entry is [value, count]; taking e[1] reports how many votes the winners had (like [3, 2]) instead of which values won.',
    },
  ],
};
