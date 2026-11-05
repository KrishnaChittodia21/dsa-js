// Scene: Sort Characters By Frequency. Count every letter into a pile of tiles, then lay the piles out tallest
// first, each pile as one unbroken block. Reads a Map / object counter (entriesOf), a heap or array of
// [char, count] pairs (itemsOf; either order), and the output: a string or an array of string blocks.
import { entriesOf, itemsOf, options } from './util.js';

/** [char, count] of a pair in either order, else null */
function pair(e) {
  if (!Array.isArray(e) || e.length !== 2) return null;
  if (typeof e[0] === 'string' && typeof e[1] === 'number') return e;
  if (typeof e[1] === 'string' && typeof e[0] === 'number') return [e[1], e[0]];
  return null;
}
/** [name, pairs] of a non-parameter heap / list of [char, count] pairs */
function pairsVar(ctx, vars) {
  if (!vars) return null;
  for (const [k, v] of Object.entries(vars)) {
    if (ctx.params.includes(k)) continue;
    const it = itemsOf(v);
    if (!Array.isArray(it) || v === vars[ctx.params[0]]) continue;
    const ps = it.map(pair);
    if ((it.length === 0 && /heap|pq|queue/i.test(k)) || (ps.length && ps.every(Boolean))) return [k, ps];
  }
  return null;
}
/** [name, [[char, count]…]] of the counter */
function counter(ctx, vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (ctx.params.includes(k)) continue;
    const e = entriesOf(v);
    if (e && e.length && e.every(([c, n]) => typeof c === 'string' && c.length === 1 && Number.isInteger(n))) return [k, e];
  }
  return null;
}
/** the output built so far, as one string: a string variable or an array of string blocks */
function output(ctx, vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (ctx.params.includes(k) || /^(c|ch|char|key|k)$/.test(k)) continue;
    if (/res|out|ans|parts|sb|str|builder|result/i.test(k)) {
      if (typeof v === 'string') return [k, v];
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return [k, v.join('')];
    }
  }
  return null;
}
const keyOf = (p) => `${p[0]}\u0000${p[1]}`;
function minus(a, b) {
  const left = b.map(keyOf);
  return a.filter((x) => {
    const i = left.indexOf(keyOf(x));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}

export default {
  id: 'sort-characters-by-frequency',
  metaphor: 'Piles of letter tiles, tallest first',
  caption: 'First every letter is counted into its own pile of tiles. Then the heap hands out the tallest pile, which is laid down as one unbroken block, then the next tallest, and so on.',
  narrate(ctx) {
    if (ctx.ret && typeof ctx.value === 'string') return `the blocks, tallest first: "${ctx.value}"`;
    const c = counter(ctx, ctx.vars);
    const pc = counter(ctx, ctx.prev);
    if (c && (!pc || pc[0] === c[0])) {
      const before = new Map(pc ? pc[1] : []);
      const grown = c[1].filter(([ch, n]) => before.get(ch) !== n);
      if (grown.length === 1) {
        const [ch, n] = grown[0];
        return n === 1 ? `a new letter "${ch}": its pile starts with 1 tile` : `another "${ch}": its pile grows to ${n} tiles`;
      }
    }
    const h = pairsVar(ctx, ctx.vars);
    const ph = pairsVar(ctx, ctx.prev);
    if (h && ph && h[0] === ph[0]) {
      const added = minus(h[1], ph[1]);
      const gone = minus(ph[1], h[1]);
      if (added.length === 1 && !gone.length) return `the "${added[0][0]}" pile (${added[0][1]} tile${added[0][1] > 1 ? 's' : ''}) goes onto the heap`;
      if (gone.length === 1 && !added.length) return `the tallest pile left comes off the heap: "${gone[0][0]}" × ${gone[0][1]}`;
    }
    const o = output(ctx, ctx.vars);
    const po = output(ctx, ctx.prev);
    if (o && po && o[0] === po[0] && o[1].length > po[1].length && o[1].startsWith(po[1])) return `lay "${o[1].slice(po[1].length)}" down as one block: "${o[1]}" so far`;
    return null;
  },
  // a pile is about to come off the heap: which letter? (asked only when one pile is strictly the tallest)
  predict(ctx) {
    if (!ctx.next) return null;
    const h = pairsVar(ctx, ctx.vars);
    const nh = pairsVar(ctx, ctx.next.vars);
    if (!h || !nh || h[0] !== nh[0] || h[1].length < 2) return null;
    const gone = minus(h[1], nh[1]);
    if (gone.length !== 1 || minus(nh[1], h[1]).length) return null;
    const [ch, n] = gone[0];
    if (!h[1].every(([c, m]) => c === ch || m < n)) return null;
    const wrong = h[1].filter(([c]) => c !== ch).map(([c]) => `"${c}"`);
    return options(`Piles on the heap: ${h[1].map(([c, m]) => `${c}×${m}`).join(', ')}. Which letter comes off next?`, `"${ch}"`, wrong.slice(0, 3), `"${ch}" has the tallest pile (${n} tiles), and the max-heap always hands out the tallest first.`);
  },
  bugs: [
    {
      label: 'Min-heap: shortest piles first',
      find: 'new MaxHeap((e) => e[1])',
      replace: 'new MinHeap((e) => e[1])',
      explain: 'The heap hands out the rarest letter first, so the blocks come out shortest first: "tree" becomes "rtee".',
    },
    {
      label: 'Count letters ignoring case',
      find: 'for (const c of s)',
      replace: 'for (const c of s.toLowerCase())',
      explain: '"A" and "a" land on the same pile, so "Aabb" turns into "bbaa": an uppercase letter is lost.',
    },
  ],
};
