// Find the Shortest Superstring: bitmask DP over word orders (travelling-salesman style). dp[mask][last] = the
// shortest string that holds the set of words in `mask` and ends with word `last`; adding word j after it costs
// j's length minus the letters j's start shares with last's end. Masks are narrated as sets of words.
import { cellAt, options } from './util.js';

const q = (x) => `'${x}'`;
const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const bits = (m, n) => Array.from({ length: n }, (_, k) => k).filter((k) => (m >> k) & 1);

/** letters at the end of a that the start of b can reuse (b is never inside a) */
function ov(a, b) {
  for (let k = Math.min(a.length, b.length) - 1; k > 0; k--) if (a.endsWith(b.slice(0, k))) return k;
  return 0;
}

const wordsOf = (ctx) => (Array.isArray(ctx.vars[ctx.params[0]]) ? ctx.vars[ctx.params[0]] : ctx.input?.[0]);
const setOf = (m, w) => `{${bits(m, w.length).map((k) => w[k]).join(', ')}}`;

/** the dp table: [name, getter(mask, last)] for a 2^n × n table that is not a parameter */
function dpOf(vars, params, w) {
  const N = 1 << w.length;
  for (const [k, g] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    const len = Array.isArray(g) ? g.length : g?.$length;
    const r0 = cellAt(g, 1);
    if (len !== N || !Array.isArray(r0) || r0.length !== w.length) continue;
    return [k, (m, j) => cellAt(g, m)?.[j]];
  }
  return null;
}

/** the one dp cell that changed: { m, j, v, old } */
function changedCell(vars, prev, params, w) {
  const d = dpOf(vars, params, w);
  const p = d && dpOf(prev, params, w);
  if (!d || !p || d[0] !== p[0]) return null;
  const hits = [];
  for (let m = 1; m < 1 << w.length && hits.length < 2; m++) {
    for (let j = 0; j < w.length; j++) if (d[1](m, j) !== p[1](m, j) && d[1](m, j) !== undefined) hits.push({ m, j, v: d[1](m, j), old: p[1](m, j) });
  }
  return hits.length === 1 ? { ...hits[0], get: p[1] } : null;
}

/** where a cell's value came from: the word L it follows, in set m without j */
function sourceOf(c, w) {
  const from = c.m ^ (1 << c.j);
  for (const L of bits(from, w.length)) {
    const base = c.get(from, L);
    if (fin(base) && fin(c.v) && base + w[c.j].length - ov(w[L], w[c.j]) === c.v) return { L, base, shared: ov(w[L], w[c.j]) };
    if (typeof base === 'string' && typeof c.v === 'string' && c.v === base + w[c.j].slice(ov(w[L], w[c.j]))) return { L, base: base.length, shared: ov(w[L], w[c.j]) };
  }
  return null;
}

const NOT_IDX = /^(n|N|len|size|full|FULL|all|ALL|total|count|cnt)$/;

/** a candidate length just computed: { c, M, L, J, base, shared } (c = dp[M][L] + len(J) − shared) */
function candOf(vars, prev, params, w, src) {
  const d = dpOf(vars, params, w);
  // a length (`dp + len − shared`) or a string (`dp + word.slice(shared)`)
  if (!d || !/\+/.test(src || '') || !/-|slice|substring|substr/.test(src || '')) return null;
  const ints = Object.entries(vars).filter(([k, v]) => Number.isInteger(v) && !params.includes(k) && !NOT_IDX.test(k));
  const fresh = Object.entries(vars).filter(([k, v]) => (Number.isInteger(v) || typeof v === 'string') && !params.includes(k) && (!(k in prev) || prev[k] !== v));
  // the cell the line reads (`dp[mask][last] + …`) names the set and the last word
  const read = new RegExp(`${d[0].replace(/\$/g, '\\$')}\\s*\\[\\s*([\\w$]+)\\s*\\]\\s*\\[\\s*([\\w$]+)\\s*\\]`).exec(src);
  for (const [ck, c] of fresh) {
    for (const [mk, M] of ints) {
      if (mk === ck || M <= 0 || M >= 1 << w.length || (read && read[1] !== mk)) continue;
      for (const [lk, L] of ints) {
        if (lk === ck || lk === mk || L < 0 || L >= w.length || !((M >> L) & 1) || (read && read[2] !== lk)) continue;
        const base = d[1](M, L);
        if (!fin(base) && !(typeof base === 'string' && base)) continue;
        for (const [jk, J] of ints) {
          if ([ck, mk, lk].includes(jk) || J < 0 || J >= w.length || (M >> J) & 1) continue;
          const shared = ov(w[L], w[J]);
          const made = fin(base) ? base + w[J].length - shared : base + w[J].slice(shared);
          const len = (x) => (typeof x === 'string' ? (x ? x.length : Infinity) : x);
          if (made === c) return { c: len(c), M, L, J, base: len(base), shared, old: len(d[1](M | (1 << J), J)) };
        }
      }
    }
  }
  return null;
}

export default {
  id: 'find-the-shortest-superstring',
  metaphor: 'Chaining words that share their edges',
  caption: 'A cell is the shortest string holding a set of words and ending with one of them. Adding the next word costs its length minus the letters its start shares with the last word’s end; the best full set is the answer.',
  narrate(ctx) {
    const w = wordsOf(ctx);
    if (!Array.isArray(w) || !w.length || w.length > 12) return null;
    if (ctx.ret && !ctx.next && typeof ctx.value === 'string') return `the shortest string holding every word: ${q(ctx.value)} (${ctx.value.length} letters)`;
    // overlap table: a small n × n table of shared letters
    for (const [k, g] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(k) || !Array.isArray(g) || g.length !== w.length || !Array.isArray(g[0]) || g[0].length !== w.length || !Array.isArray(ctx.prev[k])) continue;
      for (let i = 0; i < w.length; i++) {
        for (let j = 0; j < w.length; j++) {
          const v = g[i]?.[j];
          if (v !== ctx.prev[k][i]?.[j] && Number.isInteger(v) && v > 0 && v === ov(w[i], w[j])) return `${q(w[j])} after ${q(w[i])}: they share ${q(w[j].slice(0, v))}, so ${v} letter${v === 1 ? ' is' : 's are'} saved`;
        }
      }
    }
    const c = changedCell(ctx.vars, ctx.prev, ctx.params, w);
    if (c) {
      const len = typeof c.v === 'string' ? c.v.length : c.v;
      if (!fin(len)) return null;
      const set = setOf(c.m, w);
      if (bits(c.m, w.length).length === 1) return `${q(w[c.j])} alone: ${len} letters`;
      const s = sourceOf(c, w);
      const was = fin(c.old) ? `, beats ${c.old}` : typeof c.old === 'string' && c.old ? `, beats ${c.old.length}` : '';
      if (s) return `${set} ending with ${q(w[c.j])}: ${len} letters, ${q(w[c.j])} after ${q(w[s.L])} (${s.shared} shared)${was}`;
      return `${set} ending with ${q(w[c.j])}: ${len} letters${was}`;
    }
    const k = candOf(ctx.vars, ctx.prev, ctx.params, w, ctx.src);
    if (k) return `${setOf(k.M, w)} ending ${q(w[k.L])} (${k.base}) + ${q(w[k.J])}: ${k.base} + ${w[k.J].length} − ${k.shared} shared = ${k.c}`;
    // rebuilding the answer: the order is collected from the last word back
    for (const [n, o] of Object.entries(ctx.vars)) {
      const b = ctx.prev[n];
      if (ctx.params.includes(n) || !Array.isArray(o) || !Array.isArray(b) || o.length !== b.length + 1 || !o.every((x) => Number.isInteger(x) && x >= 0 && x < w.length)) continue;
      return `walk back along the best choices: ${o.slice().reverse().map((x) => q(w[x])).join(' → ')} ends the string`;
    }
    for (const [n, s] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(n) || typeof s !== 'string' || typeof ctx.prev[n] !== 'string' || s === ctx.prev[n]) continue;
      if (s.startsWith(ctx.prev[n])) return `glue on ${q(s.slice(ctx.prev[n].length))}: ${q(s)} (${s.length} letters)`;
      if (s.endsWith(ctx.prev[n])) return `glue on ${q(s.slice(0, s.length - ctx.prev[n].length))} in front: ${q(s)} (${s.length} letters)`;
    }
    return null;
  },
  predict(ctx) {
    const w = wordsOf(ctx);
    if (!ctx.next || !Array.isArray(w) || w.length > 12) return null;
    // a candidate is on screen: does it beat the best known for its set?
    const k = candOf(ctx.vars, ctx.prev, ctx.params, w, ctx.src);
    if (k && fin(k.old) && k.c !== k.old) {
      const c = changedCell(ctx.next.vars, ctx.vars, ctx.params, w);
      const hit = c && c.m === (k.M | (1 << k.J)) && c.j === k.J;
      const set = setOf(k.M | (1 << k.J), w);
      return {
        question: `The best so far for ${set} ending with ${q(w[k.J])} is ${k.old} letters. Does this way (${k.c}) replace it?`,
        options: ['Yes: it is shorter', 'No: keep the old one'],
        answer: hit ? 0 : 1,
        explain: hit ? `${k.c} < ${k.old}, so this order is the new best for that set and last word.` : `${k.c} is not shorter than ${k.old}, so the cell keeps its value.`,
      };
    }
    // the next step computes a candidate that reuses letters
    const n = candOf(ctx.next.vars, ctx.vars, ctx.params, w, ctx.lines?.[ctx.next.line - 1]);
    if (n && n.shared > 1 && !candOf(ctx.vars, ctx.prev, ctx.params, w, ctx.src)) {
      return options(
        `${setOf(n.M, w)} ending with ${q(w[n.L])} takes ${n.base} letters. How long is it with ${q(w[n.J])} added?`,
        n.c,
        [n.base + w[n.J].length, n.c - 1, n.c + 1].filter((x) => x !== n.c),
        `${q(w[n.J])} starts with ${q(w[n.J].slice(0, n.shared))}, which ${q(w[n.L])} already ends with: ${n.base} + ${w[n.J].length} − ${n.shared}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Search overlaps from the shortest up',
      find: 'for (let k = Math.min(a.length, b.length) - 1; k > 0; k--)',
      replace: 'for (let k = 1; k < Math.min(a.length, b.length); k++)',
      explain: 'The first match is then the smallest shared piece, not the largest: "aaa" before "aab" saves 1 letter instead of 2.',
    },
    {
      label: 'Mask test without brackets',
      find: 'if ((mask & (1 << j)) !== 0) continue;',
      replace: 'if (mask & (1 << j) !== 0) continue;',
      explain: '!== binds tighter than &, so this tests mask & true (bit 0) instead of word j: words get added twice or never.',
    },
  ],
};
