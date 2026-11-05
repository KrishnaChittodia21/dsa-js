// String Matching in an Array: every word is searched (KMP) inside each longer word; words found are kept.
// Works with lps / pi / next tables and i / j / len counters, helpers or inline loops; else the generic note.
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

const PAT = /^(p|pat|pattern|w|word|needle|small|sub|short|target)$/i;
/** [patternName, P, textName, text] for the word being searched and the longer word it slides along */
function pairOf(ctx) {
  const strs = Object.entries(ctx.vars).filter(([k, v]) => typeof v === 'string' && !ctx.params.includes(k) && v.length > 0);
  const tab = Object.entries(ctx.vars).find(([k, v]) => TABLE.test(k) && isInts(v));
  if (!tab) return [];
  const pats = strs.filter(([, v]) => v.length === tab[1].length);
  const [pName, P] = pats.find(([k]) => PAT.test(k)) || pats[0] || [];
  if (!pName) return [];
  const [tName, text] = strs.find(([k, v]) => k !== pName && v.length > P.length) || [];
  return [pName, P, tName, text];
}
const listOf = (ctx) => Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.every((x) => typeof x === 'string') && row(ctx.prev[k]));

export default {
  id: 'string-matching-in-an-array',
  metaphor: 'Hunting short words inside long ones',
  caption: 'Each word takes a turn as the pattern and slides along every longer word. On a mismatch its table of repeats says how much of the match still lines up, so no letter of the long word is read twice.',
  narrate(ctx) {
    const [wName] = ctx.params;
    const words = ctx.vars[wName];
    if (!row(words)) return null;
    if (ctx.ret && !ctx.next && row(ctx.result)) {
      return ctx.result.length ? `${ctx.result.length} word${ctx.result.length > 1 ? 's sit' : ' sits'} inside a longer one: ${clip(ctx.result.join(', '), 40)}` : 'no word sits inside another one';
    }
    const list = listOf(ctx);
    if (list && list[1].length === ctx.prev[list[0]].length + 1) return `"${clip(list[1][list[1].length - 1])}" sits inside a longer word: keep it (${list[1].length} found)`;
    const [pName, P, tName, text] = pairOf(ctx);
    if (!pName) return null;
    const tab = tableOf(ctx, P.length);
    if (tab && /fill\s*\(|Array\s*\(|=\s*\[/.test(ctx.src || '') && !tName) {
      const longer = words.filter((x) => typeof x === 'string' && x.length > P.length).length;
      return `next pattern "${clip(P)}": ${longer ? `${longer} longer word${longer > 1 ? 's' : ''} could hold it. First, its table of repeats` : 'no word is longer, so nothing can hold it'}`;
    }
    if (tName && text !== ctx.prev[tName] && ctx.prev[pName] !== undefined) return `slide "${clip(P)}" along "${clip(text, 20)}"`;
    if (tName && !(tName in ctx.prev)) return `slide "${clip(P)}" along "${clip(text, 20)}"`;
    return kmpNote(ctx, P, pName);
  },
  predict(ctx) {
    const [pName, P, tName] = pairOf(ctx);
    return pName ? kmpPredict(ctx, P, pName, tName) : null;
  },
  bugs: [
    {
      label: 'A word compared with itself',
      find: 'v.length > w.length && ',
      replace: '',
      explain: 'Every word contains itself, so every word is reported: the check must look only at other (longer) words.',
    },
  ],
};
