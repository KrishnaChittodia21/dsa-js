// Valid Anagram (one counter, s adds and t cancels). 26 bins of letter tiles: every letter of s drops a tile in its
// bin, every letter of t takes one out. Anagrams leave every bin empty. Reads a 26-count array or a Map / plain
// object of letter counts (any name, not the parameters); two separate counters fall back to the generic notes.
import { entriesOf, options, row } from './util.js';

const q = (c) => `'${c}'`;
function binsOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    const r = row(v);
    if (r && r.length === 26 && r.every(Number.isInteger)) return [k, r.map((c, i) => [String.fromCharCode(97 + i), c])];
    const es = entriesOf(v);
    if (es && es.every(([key, c]) => typeof key === 'string' && key.length === 1 && Number.isInteger(c))) return [k, es];
  }
  return null;
}
const countIn = (es, c) => es.find(([k]) => k === c)?.[1] ?? 0;
function changedBin(a, b) {
  if (!a || !b || a[0] !== b[0]) return null;
  const keys = new Set([...a[1], ...b[1]].map(([k]) => k));
  const d = [...keys].filter((k) => countIn(a[1], k) !== countIn(b[1], k));
  return d.length === 1 ? [d[0], countIn(a[1], d[0]), countIn(b[1], d[0])] : null;
}
const nonzero = (es) => es.filter(([, c]) => c !== 0).map(([k, c]) => `${k}: ${c > 0 ? '+' : ''}${c}`);

export default {
  id: 'valid-anagram',
  metaphor: 'Letter tiles in, letter tiles out',
  caption: 'Each bin holds tiles of one letter. A letter of s drops a tile in (+1), a letter of t takes one out (−1). A negative bin means t has used a letter s has not shown yet. Anagrams leave every bin at 0.',
  narrate(ctx) {
    const [sName, tName] = ctx.params;
    const s = ctx.vars[sName];
    const t = ctx.vars[tName];
    if (typeof s !== 'string' || typeof t !== 'string') return null;
    const b = binsOf(ctx.vars, ctx.params);
    if (!b) {
      if (ctx.next?.ret && ctx.result === false && s.length !== t.length) return `${sName} has ${s.length} letters, ${tName} has ${t.length}: they cannot be anagrams`;
      return null;
    }
    if (ctx.ret && typeof ctx.result === 'boolean') {
      // an early exit inside the loop: the letter just read has no tile left
      const ch1 = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && typeof v === 'string' && v.length === 1)?.[1];
      if (/^\s*if\b/.test(ctx.src || '') && !ctx.result && ch1 && countIn(b[1], ch1) <= 0) return `${tName} needs one ${q(ch1)} tile but bin ${ch1} is empty: not an anagram`;
      const nz = nonzero(b[1]);
      if (!nz.length && ctx.result) return 'every bin is back to 0: same letters, same counts, an anagram';
      if (nz.length && !ctx.result) return `bins not back to 0 (${nz.join(', ')}): the letters differ, not an anagram`;
      return null;
    }
    const ch = changedBin(binsOf(ctx.prev, ctx.params), b);
    if (!ch) return null;
    const [c, was, now] = ch;
    if (now === was + 1) return `${sName} drops one ${q(c)} tile in: bin ${c} = ${now}`;
    if (now === was - 1 && now < 0) return `${tName} takes one ${q(c)} tile that ${sName} has not supplied yet: bin ${c} = ${now}`;
    if (now === was - 1) return `${tName} takes one ${q(c)} tile out: bin ${c} = ${now}${now === 0 ? ' (balanced)' : ''}`;
    return null;
  },
  predict(ctx) {
    const b = binsOf(ctx.vars, ctx.params);
    if (!b || !ctx.next) return null;
    // the final check: is every bin back to 0? (the answer is what this run returns)
    if (ctx.next.ret && typeof ctx.result === 'boolean' && /^\s*return\b/.test(ctx.lines[ctx.next.line - 1] || '') && !changedBin(b, binsOf(ctx.next.vars, ctx.params))) {
      const [sName, tName] = ctx.params;
      if (typeof ctx.vars[sName] !== 'string' || ctx.vars[sName].length !== ctx.vars[tName]?.length) return null;
      const nz = nonzero(b[1]);
      if (!nz.length !== ctx.result) return null;
      return options(`All letters are in. Look at the bins: is ${tName} an anagram of ${sName}?`, ctx.result ? 'Yes: true' : 'No: false', [ctx.result ? 'No: false' : 'Yes: true'], ctx.result ? 'Every bin is back to 0: each letter appeared as often in both strings.' : `Some bins are not 0 (${nz.join(', ')}): those letters appear a different number of times.`);
    }
    // a tile is taken out and the bin goes below 0
    const ch = changedBin(b, binsOf(ctx.next.vars, ctx.params));
    if (!ch || ch[2] !== ch[1] - 1 || ch[2] >= 0) return null;
    const [c, was, now] = ch;
    return options(`The next letter takes one ${q(c)} tile out. Bin ${c} holds ${was}. What does it become?`, now, [was, was + 1, now - 1], `Taking a tile out subtracts 1: ${was} − 1 = ${now}. Below 0 means this string has used more ${q(c)}s than the other so far.`);
  },
  bugs: [
    {
      label: 'Loop stops one letter early',
      find: 'i < s.length',
      replace: 'i < s.length - 1',
      explain: 'The last letters are never put in the bins, so "a" vs "b" leaves every bin at 0 and says true.',
    },
    {
      label: 'Letters of t add too',
      find: 'count[t.charCodeAt(i) - 97]--;',
      replace: 'count[t.charCodeAt(i) - 97]++;',
      explain: 'Nothing ever cancels, so the bins can only be 0 for empty strings: "anagram" vs "nagaram" says false.',
    },
  ],
};
