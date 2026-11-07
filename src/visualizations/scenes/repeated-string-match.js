// Repeated String Match: b is searched with KMP in a stamped a…a that is never built (letter i = a[i mod |a|]); at most
// ceil(|b|/|a|) + 1 copies are read. Works with lps / pi / next tables and i / j / len counters; else the generic note.
import { changedIdx, firstInt, options, row } from './util.js';

// --- KMP helpers (the same in every string-matching scene) ---
// The table: for each prefix of the pattern, how many of its last letters repeat its first letters.
const TABLE = /^(lps|pi|fail|failure|next|nxt|prefix|border|borders|table|lsp|f|kmp|lpsArr|lpsTable)$/i;
const IDX = ['i', 'idx', 'r', 'right', 'pos', 'ti', 'q'];
const CNT = ['len', 'j', 'k', 'length', 'matched', 'match', 'l', 'prefixLen', 'pj', 'cnt', 'm'];
const clip = (s, n = 14) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const isInts = (v) => !!row(v) && v.every(Number.isInteger);
const tableOf = (ctx, len) => Object.entries(ctx.vars).find(([k, v]) => TABLE.test(k) && !ctx.params.includes(k) && isInts(v) && (len === undefined || v.length === len));
/** [name, value] of the match counter: the counter-like integer that changes now (or next), else the first one */
function countOf(vars, other = {}) {
  const live = CNT.filter((k) => Number.isInteger(vars[k]));
  const k = live.find((n) => n in other && other[n] !== vars[n]) ?? live[0];
  return k === undefined ? [undefined, undefined] : [k, vars[k]];
}
const idxOf = (vars, cName) => firstInt(vars, IDX.filter((n) => n !== cName));
const uses = (src, name) => (src.match(new RegExp(`\\b${name}\\s*\\[`, 'g')) || []).length;

/** true when this step belongs to building the table (the pattern compared with itself, or a table cell written) */
function building(ctx, pName, tName) {
  return uses(ctx.src || '', pName) >= 2 || new RegExp(`\\b${tName}\\s*\\[[^\\]]*\\]\\s*=[^=]`).test(ctx.src || '');
}

/** the note for a KMP step on pattern P (named pName), or null */
function kmpNote(ctx, P, pName) {
  const tab = tableOf(ctx, P.length);
  if (!tab) return null;
  const [tName, T] = tab;
  const prevT = ctx.prev[tName];
  const d = isInts(prevT) ? changedIdx(T, prevT) : [];
  if (d.length === 1) {
    const k = d[0];
    const x = T[k];
    const word = P.slice(0, k + 1);
    if (x <= 0) return null;
    return `"${clip(word)}" ends with "${clip(P.slice(k + 1 - x, k + 1))}", the same ${x} letter${x > 1 ? 's' : ''} it starts with (table: ${x})`;
  }
  const [cName, c] = countOf(ctx.vars, ctx.prev);
  const [, at] = idxOf(ctx.vars, cName);
  if (at > 0 && T[at] === 0 && new RegExp(`\\b${tName}\\s*\\[[^\\]]*\\]\\s*=[^=]`).test(ctx.src || '')) {
    return `no ending of "${clip(P.slice(0, at + 1))}" repeats its start (table: 0)`;
  }
  if (!cName || !(cName in ctx.prev) || c === ctx.prev[cName] || c > P.length) return null;
  const pc = ctx.prev[cName];
  const build = building(ctx, pName, tName);
  if (c < pc) {
    if (!c) return `mismatch after "${clip(P.slice(0, pc))}": no ending of it repeats its start, so the match starts over`;
    return `mismatch after "${clip(P.slice(0, pc))}": keep its repeated start "${P.slice(0, c)}" (${c} letter${c === 1 ? '' : 's'}), no letter re-read`;
  }
  if (build || c !== pc + 1) return null;
  if (c === P.length) return `all ${c} letters of "${clip(P)}" lined up: found`;
  return `${c} of ${P.length} letters lined up: "${clip(P.slice(0, c))}"`;
}

/** before the next comparison: does the match grow, or how much survives a mismatch? textName: the string the
 *  pattern slides along (the pattern itself while building the table) */
function kmpPredict(ctx, P, pName, textName) {
  if (!ctx.next || ctx.ret || ctx.next.ret) return null;
  const tab = tableOf(ctx, P.length);
  if (!tab) return null;
  const [tName, T] = tab;
  const nv = ctx.next.vars;
  const [cName, c] = countOf(ctx.vars, nv);
  const [iName, i] = idxOf(ctx.vars, cName);
  if (!cName || !iName || c <= 0 || c >= P.length || !Number.isInteger(nv[cName])) return null;
  const build = building(ctx, pName, tName);
  // the letter compared next: a fresh one-letter variable, or text[i + 1] after the comparison line
  const ch = Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && v.length === 1 && v !== ctx.prev[k] && !ctx.params.includes(k) && k !== pName);
  const text = build ? P : ctx.vars[textName];
  let letter;
  if (ch && !build && nv[iName] === i) letter = ch[1];
  else if (nv[iName] === i + 1 && typeof text === 'string' && (build || (uses(ctx.src || '', pName) && uses(ctx.src || '', textName)))) letter = text[i + 1];
  if (typeof letter !== 'string' || !letter) return null;
  const nc = nv[cName];
  const what = build ? 'the start of the word' : 'the pattern';
  if (nc === c + 1 && letter === P[c] && c === 2) { // once per run of matches
    return options(
      `"${clip(P.slice(0, c))}" is lined up with ${what}. The next letter is '${letter}'. What happens to the match?`,
      `It grows to ${c + 1} letters`,
      ['It breaks: fall back to a shorter match'],
      `'${letter}' is letter ${c + 1} of "${clip(P)}", so "${clip(P.slice(0, c + 1))}" now lines up.`,
    );
  }
  if (nc < c && letter !== P[c] && T[c - 1] === nc) {
    return options(
      `The next letter '${letter}' does not continue "${clip(P.slice(0, c))}". How many lined-up letters survive, without re-reading?`,
      nc,
      [0, c - 1, c, 1].filter((x) => x !== nc),
      nc ? `"${P.slice(0, nc)}" both starts and ends "${clip(P.slice(0, c))}" (the table stored ${nc}), so those letters still line up.` : `No ending of "${clip(P.slice(0, c))}" is also its start, so the match starts over.`,
    );
  }
  return null;
}
// --- end of KMP helpers ---

const fresh = (ctx, k) => !(k in ctx.prev);
/** a non-parameter integer that just appeared with this value, on a line doing that arithmetic */
const freshInt = (ctx, value, op) => op.test(ctx.src || '') && Object.entries(ctx.vars).find(([k, v]) => v === value && fresh(ctx, k) && !ctx.params.includes(k))?.[0];
/** a built copy of a repeated whole times (brute-force solutions) */
const builtOf = (ctx, a) => Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && !ctx.params.includes(k) && a.length > 0 && v.length > a.length && v === a.repeat(v.length / a.length) && v !== ctx.prev[k]);

export default {
  id: 'repeated-string-match',
  metaphor: 'Copies of a stamp, end to end',
  caption: 'The text is a stamped again and again; letter i is a[i mod |a|], so it never has to be built. b slides along it with a table of its own repeats; the answer is the copy where b first ends.',
  narrate(ctx) {
    const [aName, bName] = ctx.params;
    const a = ctx.vars[aName];
    const b = ctx.vars[bName];
    if (typeof a !== 'string' || typeof b !== 'string' || !a.length) return null;
    const n = a.length;
    const q = Math.ceil(b.length / n);
    if (freshInt(ctx, q, /ceil|\//)) return `b has ${b.length} letters, a has ${n}: at least ${q} cop${q === 1 ? 'y is' : 'ies are'} needed just for length`;
    if (freshInt(ctx, (q + 1) * n, /\*/)) return `read at most ${(q + 1) * n} letters (${q + 1} copies): a match starting inside copy 1 ends by then`;
    if (ctx.ret && !ctx.next && ctx.result === -1) return `b never lined up in ${q + 1} copies; more copies only repeat the same windows → -1`;
    const built = builtOf(ctx, a);
    if (built) return `${built[1].length / n} copies stamped: "${clip(built[1], 30)}"`;
    const note = kmpNote(ctx, b, bName);
    if (note) return note;
    const [cName] = countOf(ctx.vars, ctx.prev);
    const [iName, i] = idxOf(ctx.vars, cName);
    const ch = Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && v.length === 1 && !ctx.params.includes(k));
    if (iName && ch && i > 0 && i % n === 0 && i !== ctx.prev[iName]) return `letter ${i} is '${ch[1]}', the start of copy ${i / n + 1}: read as a[${i} mod ${n}], never built`;
    return null;
  },
  predict(ctx) {
    const [aName, bName] = ctx.params;
    const a = ctx.vars[aName];
    const b = ctx.vars[bName];
    if (typeof a !== 'string' || typeof b !== 'string' || !a.length) return null;
    const [cName, c] = countOf(ctx.vars, ctx.prev);
    const [iName, i] = idxOf(ctx.vars, cName);
    // b fully lined up and the run returns next: how many copies did it need? (the learner's own return value)
    if (c === b.length && iName && ctx.next?.ret && Number.isInteger(ctx.result) && ctx.result > 0) {
      const r = ctx.result;
      return options(
        `All of "${clip(b)}" lines up, ending at letter ${i} of the stamped text (each copy is ${a.length} letter${a.length === 1 ? '' : 's'}). How many copies?`,
        r,
        [r - 1, r + 1, Math.ceil(b.length / a.length)].filter((x) => x > 0),
        `Letters 0 to ${i} are ${i + 1} letters, and ${r} cop${r === 1 ? 'y' : 'ies'} of ${a.length} letters is the fewest that reach them.`,
      );
    }
    return kmpPredict(ctx, b, bName, null);
  },
  bugs: [
    {
      label: 'Only q copies checked',
      find: 'const limit = (q + 1) * n;',
      replace: 'const limit = q * n;',
      explain: 'b may start in the middle of copy 1 and spill into one more copy: "cdabcdab" needs 3 copies of "abcd", not 2.',
    },
    {
      label: 'Copies counted from i, not i + 1',
      find: 'Math.ceil((i + 1) / n)',
      replace: 'Math.ceil(i / n)',
      explain: 'Letter i is the (i + 1)-th letter; counting only i letters comes up one copy short when b ends on a copy\'s first letter ("a", "aa" gives 1).',
    },
  ],
};
