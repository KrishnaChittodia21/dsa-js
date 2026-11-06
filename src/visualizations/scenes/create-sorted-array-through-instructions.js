// Create Sorted Array through Instructions. Books go onto a sorted shelf one by one; slotting a book in costs the
// fewer of "books smaller than it" and "books larger than it" (you push the shorter side aside). A Fenwick tree /
// BIT indexed by value counts the books already on the shelf. Works with the toolkit FenwickTree, a hand-written
// BIT array, or a brute-force shelf (splice + counting).
import { cellAt, options, row } from './util.js';

const BIT = /^(bit|bits|ft|fen|fenwick|fw|tree|bitree)$/i;
const COST = ['cost', 'ans', 'res', 'result', 'total', 'sum', 'answer'];
const INDEX = ['i', 'idx', 'k', 'j', 'index'];
const LESS = /^(less|smaller|lt|lo|low|left|cntLess|lessCount|small|below)$/i;
const MORE = /^(greater|larger|bigger|gt|hi|high|right|cntGreater|greaterCount|more|above)$/i;

function bitOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !BIT.test(k)) continue;
    const o = v?.$obj;
    const t = o ? ['tree', 'bit', 't', 'arr', 'data'].map((f) => o[f]).find((x) => Array.isArray(x) || x?.$array) : v;
    if (Array.isArray(t) || t?.$array) return t;
  }
  return null;
}
const lenOf = (t) => (Array.isArray(t) ? t.length : t?.$length ?? 0);
function grown(a, b) {
  if (!a || !b || lenOf(a) !== lenOf(b) || lenOf(b) > 4096) return [];
  const out = [];
  for (let i = 1; i < lenOf(b); i++) if (cellAt(a, i) !== cellAt(b, i)) out.push(i);
  return out;
}
const low = (j) => j & -j;
const block = (j) => (low(j) === 1 ? `${j}` : `${j - low(j) + 1}–${j}`);

/** { i, x, shelf, less, more } for the book being placed now: index from a loop variable */
function placing(vars, a) {
  const k = INDEX.find((n) => Number.isInteger(vars?.[n]) && vars[n] >= 0 && vars[n] < a.length);
  if (k === undefined) return null;
  const i = vars[k];
  const x = a[i];
  const shelf = a.slice(0, i).sort((p, q) => p - q);
  return { i, x, shelf, less: shelf.filter((y) => y < x).length, more: shelf.filter((y) => y > x).length };
}
/** [name, value] of a count named like `re` that this step's line computes (not a `= 0` start, not a `++` tally) */
const fresh = (vars, prev, re, src) =>
  Object.entries(vars || {}).find(([k, v]) => re.test(k) && Number.isInteger(v) && new RegExp(`\\b${k}\\s*=(?!=)(?!\\s*\\d+\\s*[,;]?\\s*$)(?!\\s*\\d+\\s*,)`).test(src || ''));
const costOf = (vars, params) => COST.find((k) => !params.includes(k) && Number.isInteger(vars?.[k]));
const shelfText = (s) => (s.length > 12 ? `${s.length} books` : `[${s.join(', ')}]`);

export default {
  id: 'create-sorted-array-through-instructions',
  metaphor: 'Slotting books onto a sorted shelf',
  caption: 'Each new book costs the smaller of two counts: books on the shelf shorter than it, or taller than it. Equal books cost nothing. The BIT row counts books by height, so both counts are prefix sums.',
  narrate(ctx) {
    const a = row(ctx.input?.[0]);
    if (!a) return null;
    const p = placing(ctx.vars, a);
    const c = costOf(ctx.vars, ctx.params);
    if (p && c && Number.isInteger(ctx.prev[c]) && new RegExp(`\\b${c}\\s*(=|\\+=)`).test(ctx.src || '')) {
      const d = ctx.vars[c] - ctx.prev[c];
      if (d !== Math.min(p.less, p.more)) return null;
      return `book ${p.x}: ${p.less} shorter vs ${p.more} taller on the shelf → pay the smaller, ${d} (total ${ctx.vars[c]})`;
    }
    const t = bitOf(ctx.vars, ctx.params);
    const g = grown(bitOf(ctx.prev, ctx.params), t);
    if (t && g.length) {
      const who = p ? `book ${p.x} goes on the shelf` : 'a book goes on the shelf';
      return g.length === 1 ? `${who}: node ${g[0]} (slots ${block(g[0])}) grows to ${cellAt(t, g[0])}` : `${who}: BIT nodes ${g.join(', ')} grow (blocks ${g.map(block).join(', ')} hold its height)`;
    }
    if (!p) return null;
    const ls = fresh(ctx.vars, ctx.prev, LESS, ctx.src);
    if (ls && ls[1] === p.less) return `shelf ${shelfText(p.shelf)}: books shorter than ${p.x}? ${t ? `prefix up to ${p.x - 1} = ` : ''}${ls[1]}`;
    const mr = fresh(ctx.vars, ctx.prev, MORE, ctx.src);
    if (mr && mr[1] === p.more) return t ? `books taller than ${p.x}: ${p.i} on the shelf − ${p.i - p.more} at most ${p.x} = ${mr[1]}` : `books taller than ${p.x}: ${mr[1]}`;
    return null;
  },
  // before a count is read off the board: how many shelf books are shorter (or taller) than the new one?
  predict(ctx) {
    const a = row(ctx.input?.[0]);
    if (!a || !ctx.next) return null;
    const p = placing(ctx.next.vars, a);
    if (!p || p.shelf.length < 2) return null;
    const nsrc = (ctx.lines || [])[ctx.next.line - 1];
    // only "taller": the count where equal books are the classic trap (the shorter count is a plain prefix)
    const mr = fresh(ctx.next.vars, ctx.vars, MORE, nsrc);
    if (!mr || mr[1] !== p.more) return null;
    const eq = p.shelf.filter((y) => y === p.x).length;
    return options(
      `Shelf ${shelfText(p.shelf)}. Book ${p.x} is being placed: how many books on the shelf are taller than it?`,
      p.more,
      [p.shelf.length - p.less, p.shelf.length - p.more, p.more + 1, p.more - 1].filter((v) => v >= 0 && v !== p.more),
      `Taller means height above ${p.x}: ${p.shelf.filter((y) => y > p.x).join(', ') || 'none'}${eq ? ` (the ${eq} book${eq > 1 ? 's' : ''} of height ${p.x} count${eq > 1 ? '' : 's'} as neither)` : ''}. On the board: books so far − books of height ≤ ${p.x}.`,
    );
  },
  bugs: [
    {
      label: 'greater = i − less: equal books count as taller',
      find: 'const greater = i - bit.prefixSum(x);',
      replace: 'const greater = i - less;',
      explain: 'Books equal to x are neither shorter nor taller, but i − less counts them as taller, so some inserts cost too much: [1, 3, 3, 3, 2, 4, 2, 1, 2] gives more than 4.',
    },
    {
      label: 'Shorter books counted with prefixSum(x)',
      find: 'const less = bit.prefixSum(x - 1);',
      replace: 'const less = bit.prefixSum(x);',
      explain: 'prefixSum(x) includes books of height x, so equal books are counted as shorter and an insert next to its twins can cost more than it should.',
    },
  ],
};
