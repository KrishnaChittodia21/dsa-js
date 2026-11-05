// Distinct Echo Substrings (rolling hash, or plain slices). For every half-length L, a window of 2L letters slides
// along the text; when its two halves are the same piece, the window is an echo and goes in a bag that keeps one
// copy of each. Reads the half-length from L / len / half / k, the start from i / start / j, and any Set (not the
// parameters) as the bag; the fingerprint helper's own steps fall back to the generic notes.
import { firstInt, options } from './util.js';

const LEN = ['L', 'len', 'half', 'halfLen', 'k', 'h', 'size', 'w'];
const START = ['i', 'start', 'st', 'j', 'idx', 'pos', 'p'];
const TOTAL = ['total', 'count', 'ans', 'res', 'result', 'cnt'];
const FINAL = /^\s*return\s+\w+(\.size)?\s*;?\s*(\/\/.*)?$/;
const q = (s) => `"${s}"`;
const bagOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && v && Array.isArray(v.$set));
const sizeOf = (b) => (b ? b[1].$size ?? b[1].$set.length : undefined);
// the window being judged: start i, half-length L, its halves
function windowOf(ctx, vars) {
  const text = vars[ctx.params[0]];
  if (typeof text !== 'string') return null;
  const free = Object.fromEntries(Object.entries(vars).filter(([k]) => !ctx.params.includes(k)));
  const [lName, L] = firstInt(free, LEN);
  const [iName, i] = firstInt(free, START);
  if (!lName || !iName || lName === iName || L < 1 || i < 0 || i + 2 * L > text.length) return null;
  const a = text.slice(i, i + L);
  const b = text.slice(i + L, i + 2 * L);
  // what the text says about this length up to here: distinct echoes before i, and whether this one is a repeat
  const earlier = new Set();
  for (let j = 0; j < i; j++) if (text.slice(j, j + L) === text.slice(j + L, j + 2 * L)) earlier.add(text.slice(j, j + 2 * L));
  return { text, L, i, lName, iName, a, b, equal: a === b, earlier, repeat: earlier.has(a + b) };
}
// the line that compares the halves (and adds to the bag)
const isDecision = (ctx, line) => /\.add\(|\bif\b/.test(ctx.lines[line - 1] || '');
// how big the bag was before this window: the previous snapshot, or what the text says (per-length bag)
function bagBefore(ctx, w, name) {
  const p = bagOf(ctx.prev, ctx.params);
  if (p && p[0] === name) return sizeOf(p);
  return w.earlier.size;
}
// every occurrence, repeats included: the classic wrong answer
function occurrences(text) {
  let n = 0;
  for (let L = 1; 2 * L <= text.length; L++) for (let i = 0; i + 2 * L <= text.length; i++) if (text.slice(i, i + L) === text.slice(i + L, i + 2 * L)) n++;
  return n;
}

export default {
  id: 'distinct-echo-substrings',
  metaphor: 'Listening for words said twice',
  caption: 'For each half-length L, a window of 2L letters slides along the text. When both halves are the same piece, the window is an echo and goes in the bag; the bag keeps one copy, so an echo heard twice counts once.',
  narrate(ctx) {
    const text = ctx.vars[ctx.params[0]];
    if (typeof text !== 'string') return null;
    if (ctx.ret && typeof ctx.result === 'number' && FINAL.test(ctx.src || '')) return `${ctx.result} different echo${ctx.result === 1 ? '' : 'es'} in ${q(text)}`;
    const bag = bagOf(ctx.vars, ctx.params);
    const w = windowOf(ctx, ctx.vars);
    if (w && bag && isDecision(ctx, ctx.line)) {
      const shown = `${q(w.a + '|' + w.b)} at ${w.i}`;
      if (!w.equal) return `${shown}: the halves differ, not an echo`;
      const grew = sizeOf(bag) === bagBefore(ctx, w, bag[0]) + 1;
      return grew ? `${shown}: the halves match, a new echo (${sizeOf(bag)} in the bag)` : `${shown}: an echo, but already in the bag, so it is not counted again`;
    }
    const free = Object.fromEntries(Object.entries(ctx.vars).filter(([k]) => !ctx.params.includes(k)));
    // rolling-hash set-up: a prefix fingerprint is stored
    const hName = ['h1', 'h', 'hash', 'pre', 'prefix'].find((k) => Array.isArray(free[k]) && Array.isArray(ctx.prev[k]) && free[k].some((x, j) => x !== ctx.prev[k][j]));
    if (hName && Number.isInteger(free.i) && !bag) return `fingerprint of the first ${free.i + 1} letter${free.i ? 's' : ''} ${q(text.slice(0, free.i + 1))} stored: any piece can now be compared in one step`;
    const [lName, L] = firstInt(free, LEN);
    if (bag && lName && L !== ctx.prev[lName]) return `now listening for echoes of ${2 * L} letters: a piece of ${L} followed by the same piece`;
    const [tName, t] = firstInt(free, TOTAL);
    if (tName && tName in ctx.prev && t !== ctx.prev[tName] && bag && lName) return `length ${2 * L} done: ${sizeOf(bag)} different echo${sizeOf(bag) === 1 ? '' : 'es'}, ${tName} = ${t}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const text = ctx.vars[ctx.params[0]];
    if (typeof text !== 'string') return null;
    // the final count (the answer is what this run returns)
    if (ctx.next.ret && typeof ctx.result === 'number' && FINAL.test(ctx.lines[ctx.next.line - 1] || '')) {
      const occ = occurrences(text);
      return options(`Every window has been heard. How many different echoes does the function return?`, ctx.result, [occ, ctx.result + 1, ctx.result - 1].filter((x) => x >= 0), `The bag holds ${ctx.result} different echo${ctx.result === 1 ? '' : 'es'}${occ !== ctx.result ? `; counting every occurrence would give ${occ}` : ''}.`);
    }
    // a window with matching halves is about to be judged: the first echo of this length, or a repeat
    if (!isDecision(ctx, ctx.next.line) || (isDecision(ctx, ctx.line) && windowOf(ctx, ctx.vars)?.i === windowOf(ctx, ctx.next.vars)?.i)) return null;
    const w = windowOf(ctx, ctx.next.vars);
    const nb = bagOf(ctx.next.vars, ctx.params);
    if (!w || !nb || !w.equal || (w.earlier.size && !w.repeat)) return null;
    const cur = bagOf(ctx.vars, ctx.params);
    const before = cur && cur[0] === nb[0] ? sizeOf(cur) : w.earlier.size;
    const grew = sizeOf(nb) - before;
    if (grew !== 0 && grew !== 1) return null;
    const isNew = `A new echo: it goes in the bag`;
    const again = `Already in the bag: not counted again`;
    const differ = `The halves differ: not an echo`;
    return options(`The window ${q(w.a + w.b)} starts at ${w.i} (halves ${q(w.a)} and ${q(w.b)}). What happens?`, grew ? isNew : again, grew ? [again, differ] : [isNew, differ], grew ? `Both halves are ${q(w.a)}, and no earlier window of this length was ${q(w.a + w.b)}.` : `${q(w.a + w.b)} was already heard earlier at this length; the bag keeps one copy, so the answer counts it once.`);
  },
  bugs: [
    {
      label: 'Count every occurrence',
      find: 'seen.add(get(i, i + 2 * L));',
      replace: 'total++;',
      explain: 'An echo heard at several places is counted each time: "abcabcabc" has "abcabc" twice, so the answer is 4, not 3.',
    },
    {
      label: 'Second half starts one letter late',
      find: 'get(i + L, i + 2 * L)',
      replace: 'get(i + L + 1, i + 2 * L + 1)',
      explain: 'The two halves are no longer side by side, so "aa" is compared with a piece past its end and its echo is missed.',
    },
  ],
};
