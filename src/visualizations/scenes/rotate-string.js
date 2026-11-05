// Rotate String: write s twice, then find goal inside it with KMP (a table of repeats in goal, so the scan never
// steps back). Works with lps / pi / next tables and i / j / len counters; falls back to the generic note otherwise.
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

/** the doubled text: a string variable (not a parameter) twice as long as s */
const doubledOf = (ctx, n) => Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && v.length === 2 * n && n > 0 && !ctx.params.includes(k));

export default {
  id: 'rotate-string',
  metaphor: 'A ring of letters, cut open twice',
  caption: 's written twice holds every rotation of s as a window. goal slides along it; on a mismatch the table of repeats in goal says how much of the match still lines up, so no letter is read twice.',
  narrate(ctx) {
    const [sName, gName] = ctx.params;
    const s = ctx.vars[sName];
    const g = ctx.vars[gName];
    if (typeof s !== 'string' || typeof g !== 'string') return null;
    if (ctx.index === 0 && s.length !== g.length) return `"${clip(s)}" has ${s.length} letters, "${clip(g)}" has ${g.length}: turning a ring never changes its length`;
    const dbl = doubledOf(ctx, s.length);
    if (dbl && !(dbl[0] in ctx.prev)) return `"${clip(dbl[1], 24)}": s written twice. Every rotation of s is one ${s.length}-letter window of it`;
    if (ctx.ret && ctx.result === false && dbl && !ctx.next) return `"${clip(g)}" is no window of "${clip(dbl[1], 24)}": not a rotation`;
    const note = kmpNote(ctx, g, gName);
    const [cName, c] = countOf(ctx.vars, ctx.prev);
    const [iName, i] = idxOf(ctx.vars, cName);
    if (note && dbl && c === g.length && iName && !building(ctx, gName, tableOf(ctx, g.length)?.[0] || '')) {
      const shift = i - g.length + 1;
      return `${note} at window ${shift}: "${clip(s)}" turned left ${shift} time${shift === 1 ? '' : 's'}`;
    }
    return note;
  },
  predict(ctx) {
    const [sName, gName] = ctx.params;
    const s = ctx.vars[sName];
    const g = ctx.vars[gName];
    if (typeof s !== 'string' || typeof g !== 'string') return null;
    const dbl = doubledOf(ctx, s.length);
    // the whole question in one card, answered by what the learner's run returned
    if (dbl && !(dbl[0] in ctx.prev) && typeof ctx.result === 'boolean' && s.length === g.length) {
      return {
        question: `Is "${clip(g)}" one of the ${s.length}-letter windows of "${clip(dbl[1], 24)}"?`,
        options: ['yes: it is a rotation', 'no: it is not a rotation'],
        answer: ctx.result ? 0 : 1,
        explain: ctx.result ? `Cutting the ring of "${s}" at the right place gives "${g}"; that cut is a window of s twice.` : `None of the windows equals "${g}", and every rotation is one of them.`,
      };
    }
    return dbl ? kmpPredict(ctx, g, gName, dbl[0]) : null;
  },
  bugs: [
    {
      label: 'No length check',
      find: 'if (s.length !== goal.length) return false;',
      replace: '',
      explain: 'A shorter goal can sit inside s + s without being a rotation: "a" is inside "aaaa", but "a" is not a rotation of "aa".',
    },
    {
      label: 'Search s, not s + s',
      find: 'const text = s + s;',
      replace: 'const text = s;',
      explain: 'Only the zero-shift rotation is a window of s itself; "cdeab" needs the letters to wrap around the end.',
    },
  ],
};
