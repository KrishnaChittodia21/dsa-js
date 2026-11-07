// Repeated Substring Pattern: the KMP table's last cell is the longest end of s that repeats its start; n minus it is
// the smallest tile. Works with lps / pi / next tables and i / j / len counters; falls back to the generic note.
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

/** the run's border (last table cell) and smallest period, once the table is complete: fresh integers by value */
function borderPeriod(ctx, s) {
  const tab = tableOf(ctx, s.length);
  if (!tab || !s.length || idxOf(ctx.vars)[0]) return {};
  const b = tab[1][s.length - 1];
  const ints = Object.entries(ctx.vars).filter(([k, v]) => Number.isInteger(v) && k !== tab[0] && !ctx.params.includes(k))
    .sort(([a], [c]) => (a in ctx.prev) - (c in ctx.prev)); // fresh names first: a loop counter may hold the same value
  const bName = ints.find(([k, v]) => v === b && !/period|unit|block|tile|size|^p$/i.test(k))?.[0];
  const pName = ints.find(([k, v]) => v === s.length - b && k !== bName)?.[0];
  return { b, bName, pName };
}

export default {
  id: 'repeated-substring-pattern',
  metaphor: 'One tile stamped along a strip',
  caption: 'The table says, for each start of s, how many of its last letters repeat its first letters. If s ends with a long repeat of its own start, shifting s by the rest lines it up with itself: that shift is the tile.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    const { b, bName, pName } = borderPeriod(ctx, s);
    if (pName && !(pName in ctx.prev)) {
      const p = s.length - b;
      return `shift s by ${p} and it lines up with itself: the smallest tile is "${clip(s.slice(0, p))}" (${p} of ${s.length} letters)`;
    }
    if (bName && !(bName in ctx.prev)) {
      return b ? `the whole word ends with "${clip(s.slice(s.length - b))}", the same ${b} letter${b > 1 ? "s" : ""} it starts with` : `no ending of "${clip(s)}" repeats its start`;
    }
    if (ctx.ret && !ctx.next && typeof ctx.result === 'boolean') {
      return ctx.result ? `"${clip(s)}" is ${s.length / (s.length - b) || 'several'} copies of "${clip(s.slice(0, s.length - b))}"` : `no smaller tile fills "${clip(s)}" exactly two or more times`;
    }
    return kmpNote(ctx, s, sName);
  },
  predict(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    const { b, pName } = borderPeriod(ctx, s);
    // the decision is the final return: ask with what the learner's run returned
    if (pName && ctx.next?.ret && typeof ctx.result === 'boolean') {
      const p = s.length - b;
      return {
        question: `The smallest tile of "${clip(s)}" is ${p} letter${p === 1 ? "" : "s"} long. Is s two or more copies of one piece?`,
        options: ['yes', 'no'],
        answer: ctx.result ? 0 : 1,
        explain: ctx.result ? `${p} divides ${s.length} and is shorter than s, so "${clip(s.slice(0, p))}" stamped ${s.length / p} times gives s.` : p === s.length ? 'The tile is the whole word: one copy is not "two or more".' : `${p} does not divide ${s.length}, so the tiles cannot fill s exactly.`,
      };
    }
    return kmpPredict(ctx, s, sName, sName);
  },
  bugs: [
    {
      label: 'One copy counted as a repetition',
      find: 'border > 0 && ',
      replace: '',
      explain: 'With no repeat at all the tile is the whole word, and every length divides itself: "a" or "abc" come out true although one copy is not "two or more".',
    },
    {
      label: 'Mismatch resets the repeat to 0',
      find: 'len = lps[len - 1]',
      replace: 'len = 0',
      explain: 'On a mismatch a shorter repeat may still fit; starting over from 0 misses it, so the table and the tile size come out wrong.',
    },
  ],
};
