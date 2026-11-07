// Find the Index of the First Occurrence in a String (KMP). The needle is read along the haystack like a word on a
// ticker tape; the cheat sheet (lps) is built first from the needle alone and says, for every matched start, how
// many of its last letters are also the needle's first letters. On a mismatch the reader jumps back to that count
// instead of rereading the tape. Every note is checked against the two strings, so a naive restart falls back to
// the generic note.
import { options, row } from './util.js';

const IDX = ['i', 'idx', 't', 'pos', 'r', 'right'];
const CNT = ['j', 'len', 'length', 'k', 'matched', 'match', 'q', 'prefixLen', 'prev', 'l', 'count', 'cnt', 'p'];
const q = (s) => `'${s}'`;
const isStr = (v) => typeof v === 'string';
const pl = (k) => `${k} letter${k === 1 ? '' : 's'}`;

/** the cheat sheet: a non-parameter integer row as long as the needle */
const tableOf = (ctx, vars, m) =>
  Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === m && v.every(Number.isInteger))?.[1];

/** what this step is doing: building the sheet from the needle, or scanning the haystack */
function setup(ctx, vars) {
  const [hName, nName] = ctx.params;
  const words = Object.values(vars).filter(isStr);
  const pat = isStr(vars[nName]) ? vars[nName] : words.length === 1 ? words[0] : null; // a helper gets the needle under its own name
  if (!pat) return null;
  const table = tableOf(ctx, vars, pat.length);
  if (!table) return null;
  const first = ctx.lines.findIndex((l) => new RegExp(`\\b${hName}\\s*(\\[|\\.charAt|\\.at\\b|\\.charCodeAt)`).test(l)) + 1;
  const scan = isStr(vars[hName]) && first > 0 && ctx.line >= first;
  const text = scan ? vars[hName] : pat;
  const iName = IDX.find((n) => Number.isInteger(vars[n]) && vars[n] >= 0 && vars[n] < text.length);
  const jName = CNT.find((n) => n !== iName && Number.isInteger(vars[n]) && vars[n] >= 0 && vars[n] <= pat.length);
  if (!iName || !jName) return null;
  return { scan, pat, text, table, iName, jName };
}

export default {
  id: 'find-the-index-of-the-first-occurrence-in-a-string',
  metaphor: 'Spotting a word on a ticker tape',
  caption: 'First the cheat sheet (lps) is filled from the needle alone: for each start of the needle, how many of its last letters repeat its first letters. Then the tape is read once, left to right: on a mismatch the sheet says how much of the match can be kept, so the tape never rewinds.',
  pointers: ['i', 'j'],
  compare: 'j',
  narrate(ctx) {
    const s = setup(ctx, ctx.vars);
    if (!s) return null;
    const { scan, pat, text, table, iName, jName } = s;
    const i = ctx.vars[iName];
    const j = ctx.vars[jName];
    const pj = jName in ctx.prev ? ctx.prev[jName] : 0;
    const c = text[i];
    const m = pat.length;
    if (!scan) {
      const before = tableOf(ctx, ctx.prev, m);
      const d = before ? table.findIndex((x, k) => x !== before[k]) : -1;
      if (d > 0) {
        const v = table[d];
        return v
          ? `sheet[${d}] = ${v}: ${q(pat.slice(0, d + 1))} ends with ${q(pat.slice(0, v))}, which is also how it starts`
          : `sheet[${d}] = 0: no ending of ${q(pat.slice(0, d + 1))} is also its start`;
      }
    }
    const where = scan ? `tape cell ${i}` : `needle letter ${i}`;
    if (j === pj + 1 && c === pat[j - 1]) {
      if (!scan) return `${q(c)} (${where}) repeats letter ${pj} of the start: the shared start grows to ${q(pat.slice(0, j))}`;
      return `${q(c)} (${where}) matches the needle's letter ${j}: ${j} of ${m} matched${j === m ? `, found: it starts at cell ${i - m + 1}` : ''}`;
    }
    if (j < pj && j === table[pj - 1] && c !== pat[pj]) {
      const head = `${q(c)} (${where}) cannot extend ${q(pat.slice(0, pj))}: `;
      return j
        ? `${head}the sheet says its last ${pl(j)} ${q(pat.slice(0, j))} also start${j === 1 ? 's' : ''} the needle, so keep ${j}`
        : `${head}no ending of it starts the needle, so start over at 0`;
    }
    return null;
  },
  // before a fall-back: how much of the match does the sheet let you keep?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = setup(ctx, ctx.vars);
    const n = setup(ctx, ctx.next.vars);
    if (!s || !n || n.scan !== s.scan || n.jName !== s.jName || n.iName !== s.iName) return null;
    const { pat, table, jName, scan } = s;
    const j = ctx.vars[jName];
    const nj = ctx.next.vars[jName];
    const c = n.text[ctx.next.vars[n.iName]];
    if (j < 2 || nj >= j || nj !== table[j - 1] || c === pat[j]) return null;
    const matched = pat.slice(0, j);
    return options(
      scan
        ? `${pl(j)} ${q(matched)} are matched, but the next tape letter is ${q(c)}, not ${q(pat[j])}. How many matched letters can be kept?`
        : `The shared start is ${q(matched)}, but the next needle letter ${q(c)} is not ${q(pat[j])}. Which shorter start is tried next (its length)?`,
      nj,
      [0, j - 1, j, 1].filter((x) => x !== nj),
      nj
        ? `${q(matched)} ends with ${q(pat.slice(0, nj))}, which is also the needle's start; the sheet stores that ${nj} at position ${j - 1}.`
        : `No ending of ${q(matched)} is also a start of the needle (the sheet says 0 at position ${j - 1}), so nothing can be kept.`,
    );
  },
  bugs: [
    {
      label: 'Fall back once (if) instead of repeatedly (while)',
      find: 'while (j > 0 && haystack[i] !== needle[j])',
      replace: 'if (j > 0 && haystack[i] !== needle[j])',
      explain: 'After one jump the letter may still not fit, but the reader stops jumping and keeps a stale partial match, so it can report a match that is not there (e.g. "aaa" in "aabaa").',
    },
    {
      label: 'Report where the match ends, minus one too many',
      find: 'return i - m + 1',
      replace: 'return i - m',
      explain: 'The match is noticed at its last letter i, so it starts at i − m + 1; i − m points one cell before the real start.',
    },
  ],
};
