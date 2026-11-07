// Shortest Palindrome: glue s, a wall and s backwards, build the KMP table of repeats; its last cell is the longest
// palindromic start of s. Works with lps / pi / next tables and i / j / len counters; falls back to the generic note.
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

const rev = (s) => [...s].reverse().join('');
/** the glued strip: s + separator + s backwards (any one-letter separator) */
const stripOf = (ctx, s) => Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && !ctx.params.includes(k) && v.length === 2 * s.length + 1 && v.startsWith(s) && v.endsWith(rev(s)));
/** the kept length: a fresh integer equal to the strip table's last cell */
function keptOf(ctx, s, strip) {
  const tab = strip && tableOf(ctx, strip[1].length);
  if (!tab || idxOf(ctx.vars)[0]) return null; // only once the table is complete
  const last = tab[1][tab[1].length - 1];
  const hit = Object.entries(ctx.vars).find(([k, v]) => v === last && k !== tab[0] && !(k in ctx.prev) && Number.isInteger(v) && v <= s.length);
  return hit ? hit[1] : null;
}

export default {
  id: 'shortest-palindrome',
  metaphor: 'A word facing its mirror image',
  caption: 'The strip is s, a wall, then s backwards. Its table of repeats ends with the longest start of s that also shows up, mirrored, at the far end: the part that is already a palindrome. Only the rest is copied, reversed, to the front.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    const strip = stripOf(ctx, s);
    if (strip && !(strip[0] in ctx.prev)) return `"${clip(strip[1], 30)}": s, a wall, then s in the mirror. The wall stops a repeat from running past s`;
    const back = Object.entries(ctx.vars).find(([k, v]) => typeof v === 'string' && v === rev(s) && !ctx.params.includes(k) && !(k in ctx.prev));
    if (back && s.length > 1) return `"${clip(back[1], 24)}": s read backwards, the mirror image`;
    if (ctx.ret && typeof ctx.result === 'string' && !ctx.next && ctx.result.endsWith(s)) {
      const add = ctx.result.slice(0, ctx.result.length - s.length);
      return add ? `copy the leftover "${clip(s.slice(s.length - add.length))}" reversed to the front: "${clip(ctx.result, 30)}"` : `"${clip(s)}" is already a palindrome: nothing to add`;
    }
    const k = keptOf(ctx, s, strip);
    if (k !== null) return k ? `the first ${k} letter${k > 1 ? 's' : ''} "${clip(s.slice(0, k))}" read${k > 1 ? "" : "s"} the same both ways: they can stay in the middle` : null;
    return strip ? kmpNote(ctx, strip[1], strip[0]) : null;
  },
  predict(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    const strip = stripOf(ctx, s);
    const k = keptOf(ctx, s, strip);
    // the answer is what the learner's run returned: how many letters it put in front of s
    if (k !== null && s.length > 0 && ctx.next?.ret && typeof ctx.result === 'string' && ctx.result.endsWith(s)) {
      const add = ctx.result.length - s.length;
      return options(
        `The first ${k} letter${k === 1 ? '' : 's'} of "${clip(s)}" already read${k === 1 ? 's' : ''} the same backwards. How many letters go in front?`,
        add,
        [s.length, k, s.length - k + 1, Math.max(0, s.length - k - 1)],
        `The palindromic start stays in the middle; the other ${add} letter${add === 1 ? '' : 's'} must be mirrored in front.`,
      );
    }
    return strip ? kmpPredict(ctx, strip[1], strip[0], strip[0]) : null;
  },
  bugs: [
    {
      label: 'No wall between s and its mirror',
      find: "s + '#' + rev",
      replace: 's + rev',
      explain: 'Without the wall a repeat can run past the end of s: for "aa" the strip "aaaa" reports 3 letters, more than s has.',
    },
    {
      label: 'Letters added at the end',
      find: 'rev.slice(0, s.length - k) + s',
      replace: 's + rev.slice(0, s.length - k)',
      explain: 'The mirrored leftover must go in front of s; at the end, "abcd" becomes "abcddcb", which is not a palindrome.',
    },
  ],
};
