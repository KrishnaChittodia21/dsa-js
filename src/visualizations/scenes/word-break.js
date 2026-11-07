// Word Break: dp[i] = the first i letters can be cut into dictionary words. A cut point i lights up when some
// earlier lit cut point j is followed by a dictionary word s[j..i). Works with a bottom-up boolean row (dp-like
// name, length s.length + 1) or a top-down memo Map of start index → can the rest split.
import { changedIdx, options, row } from './util.js';

const DP = ['dp', 'memo', 'can', 'ok', 'f', 'reach', 'canBreak', 'seg', 'good', 'valid'];
const J = ['j', 'k', 'start', 'st', 'from', 'p'];
const I = ['i', 'end', 'e', 'to', 'r'];
const CHECK = /\.has\(|\.includes\(|\.indexOf\(/;

const dpOf = (vars, n) => DP.map((k) => row(vars[k])).find((r) => r && r.length === n + 1 && r.every((x) => typeof x === 'boolean'));
const wordsOf = (vars, name) => (row(vars[name]) ? vars[name] : null);
const q = (x) => `'${x}'`;
const intOf = (vars, names) => names.map((k) => vars[k]).find(Number.isInteger);

/** the start j that explains dp[x] becoming true: the loop's j when it fits, else the only one that does */
function startFor(vars, s, words, dp, x) {
  const fits = (j) => Number.isInteger(j) && j >= 0 && j < x && dp[j] === true && words.includes(s.slice(j, x));
  const j = intOf(vars, J);
  if (fits(j)) return j;
  const all = [...Array(x).keys()].filter(fits);
  return all.length ? all[all.length - 1] : undefined;
}

export default {
  id: 'word-break',
  metaphor: 'Cutting a ribbon of letters into words',
  caption: 'Cell i says whether the first i letters can be cut into dictionary words. Cell 0 (nothing yet) is always lit; cell i lights when a lit cell j is followed by a word s[j..i).',
  compare: 'dp',
  narrate(ctx) {
    const [sName, dName] = ctx.params;
    const s = ctx.vars[sName];
    const words = wordsOf(ctx.vars, dName);
    if (typeof s !== 'string') return null;
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') return ctx.value ? `${q(s)} cuts into dictionary words with nothing left over: true` : `no chain of words covers all of ${q(s)}: false`;
    const dp = dpOf(ctx.vars, s.length);
    if (!dp) {
      // top-down: a memo Map gains one solved start position at a time
      const m = DP.map((k) => ctx.vars[k]?.$map).find(Array.isArray);
      const was = DP.map((k) => ctx.prev[k]?.$map).find(Array.isArray) || [];
      const [k, v] = m && m.length === was.length + 1 ? m[m.length - 1] : [];
      if (!Number.isInteger(k) || typeof v !== 'boolean' || k > s.length) return null;
      return `from letter ${k} on, ${q(s.slice(k))} ${v ? 'cuts into words ✔' : 'cannot be cut into words ✗'} (remembered)`;
    }
    const before = dpOf(ctx.prev, s.length);
    if (!before) return dp.every((x) => x === false) ? `${dp.length} cut points 0…${s.length}, none reachable yet` : null;
    const d = changedIdx(dp, before);
    if (d.length === 1 && dp[d[0]] === true) {
      const x = d[0];
      if (x === 0) return 'cut point 0 (no letters yet) is always reachable: every first word starts here';
      if (!words) return null;
      const j = startFor(ctx.vars, s, words, dp, x);
      if (j === undefined) return null;
      const w = s.slice(j, x);
      return j === 0 ? `${q(w)} is a word by itself: the first ${x} letters can be cut ✔` : `${q(s.slice(0, j))} can be cut, and ${q(w)} is a word → ${q(s.slice(0, x))} can be cut ✔`;
    }
    // a failed try: the check line ran, nothing lit
    if (d.length || !CHECK.test(ctx.src || '') || !words) return null;
    const i = intOf(ctx.vars, I);
    const j = intOf(ctx.vars, J);
    if (!Number.isInteger(i) || !Number.isInteger(j) || j < 0 || j >= i || i > s.length) return null;
    const w = s.slice(j, i);
    if (dp[j] && words.includes(w)) return null;
    if (!dp[j]) return `try ${q(w)} as the last word of ${q(s.slice(0, i))}: but ${q(s.slice(0, j))} cannot be cut, no`;
    return `try ${q(w)} as the last word of ${q(s.slice(0, i))}: ${q(w)} is not in the dictionary, no`;
  },
  // when the next try has a real dictionary word as its last piece: does the cut work?
  predict(ctx) {
    if (!ctx.next) return null;
    const [sName, dName] = ctx.params;
    const s = ctx.vars[sName];
    const words = wordsOf(ctx.vars, dName);
    if (typeof s !== 'string' || !words) return null;
    const dp = dpOf(ctx.vars, s.length);
    const after = dpOf(ctx.next.vars, s.length);
    if (!dp || !after) return null;
    const i = intOf(ctx.next.vars, I);
    const j = intOf(ctx.next.vars, J);
    if (!Number.isInteger(i) || !Number.isInteger(j) || j < 1 || j >= i || i > s.length || dp[i]) return null;
    const w = s.slice(j, i);
    if (!words.includes(w)) return null;
    const d = changedIdx(after, dp);
    let yes;
    if (d.length === 1 && d[0] === i && after[i] === true) yes = true;
    else if (!d.length && CHECK.test(ctx.lines[ctx.next.line - 1] || '')) yes = false;
    else return null;
    if (yes !== dp[j]) return null; // the run does not follow "lit j + word"; do not guess
    const why = yes ? `${q(s.slice(0, j))} can already be cut (cell ${j} is lit), so adding the word ${q(w)} reaches cell ${i}.` : `${q(w)} is a word, but ${q(s.slice(0, j))} cannot be cut (cell ${j} is dark), so there is nothing to attach it to.`;
    return options(`${q(w)} is in the dictionary. Can ${q(s.slice(0, i))} be cut with ${q(w)} as its last word?`, yes ? 'yes' : 'no', [yes ? 'no' : 'yes'], why);
  },
  bugs: [
    {
      label: 'Forget that the empty start is reachable',
      find: 'dp[0] = true;',
      replace: '',
      explain: 'Cell 0 stays dark, so no first word ever has a lit cut point to start from, and every answer is false.',
    },
    {
      label: 'Stop one letter short',
      find: 'i <= s.length; i++',
      replace: 'i < s.length; i++',
      explain: 'The loop never fills the last cell, the one for the whole string, so it stays false even when the words fit.',
    },
  ],
};
