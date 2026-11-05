// Longest Repeating Character Replacement (sliding window). A row of coloured tiles and k paint cans: keep the most
// common colour and repaint the rest. When the row needs more than k repaints, one tile leaves from the left (the
// window never shrinks below its best size). Works with a 26-slot count array or a char → count Map, any
// maxFreq-like name, and left/l/start/i + right/r/end/j.
import { options, row } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const MAXF = ['maxFreq', 'maxCount', 'maxF', 'maxFrequency', 'mostFreq', 'maxCnt', 'maxc', 'mf', 'most', 'majority', 'highest', 'top', 'topCount', 'maxRepeat'];
const BEST = ['best', 'max', 'maxLen', 'ans', 'res', 'result', 'longest', 'maxLength'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));

/** letter → count, from a 26-slot array (A = 0) or a Map with letter keys */
function countsOf(vars) {
  for (const [name, v] of Object.entries(vars)) {
    const a = row(v);
    if (a && a.length === 26 && a.every(Number.isInteger)) return [name, new Map(a.map((c, i) => [String.fromCharCode(65 + i), c]).filter(([, c]) => c))];
    if (v && Array.isArray(v.$map) && v.$map.every((e) => typeof e[0] === 'string' && e[0].length === 1 && Number.isInteger(e[1]))) return [name, new Map(v.$map.filter(([, c]) => c))];
  }
  return null;
}
const total = (m) => [...m.values()].reduce((x, y) => x + y, 0);
const show = (m) => [...m].map(([k, c]) => `${k}×${c}`).join(' ') || 'none';
const isAssign = (ctx, name) => new RegExp(`\\b${name}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '');

export default {
  id: 'longest-repeating-character-replacement',
  metaphor: 'A row of tiles, k paint cans',
  caption: 'The bracket is a row of tiles. Keep the most common colour and repaint the rest; with only k cans, a row that needs more than k repaints gives up a tile on the left.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const [sName, kName] = ctx.params;
    const s = ctx.vars[sName];
    const k = ctx.vars[kName];
    const pair = pairOf(ctx.vars);
    const cs = countsOf(ctx.vars);
    if (typeof s !== 'string' || !Number.isInteger(k) || !pair || !cs) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const now = cs[1];
    const prevCs = countsOf(ctx.prev);
    const was = prevCs && prevCs[0] === cs[0] ? prevCs[1] : null;
    const len = Math.max(0, r - l + 1);
    if (was) {
      const up = [...now].find(([ch, c]) => c === (was.get(ch) ?? 0) + 1);
      if (up && total(now) === total(was) + 1) return `tile '${up[0]}' (cell ${r}) joins the row: ${show(now)}`;
      const down = [...was].find(([ch, c]) => (now.get(ch) ?? 0) === c - 1);
      if (down && total(now) === total(was) - 1) return `too many repaints: tile '${down[0]}' leaves from the left end · ${show(now)}`;
    }
    if (Number.isInteger(ctx.prev[lName]) && l === ctx.prev[lName] + 1) return `the row now starts at cell ${l}: cells ${l}..${r}, still ${len} long`;
    const mName = intName(ctx.vars, MAXF);
    if (mName && Number.isInteger(ctx.prev[mName]) && isAssign(ctx, mName)) {
      const m = ctx.vars[mName];
      return m > ctx.prev[mName] ? `the most common colour now has ${m} tile${m === 1 ? '' : 's'} (row ${l}..${r}, ${len} long)` : `the most common colour still counts ${m} (row ${l}..${r}, ${len} long)`;
    }
    const bName = intName(ctx.vars, BEST);
    if (bName && Number.isInteger(ctx.prev[bName]) && isAssign(ctx, bName)) {
      const keep = mName ? ctx.vars[mName] : Math.max(0, ...now.values());
      if (ctx.vars[bName] > ctx.prev[bName]) return `new best row: cells ${l}..${r}, ${len} tile${len === 1 ? '' : 's'} (repaint ${Math.max(0, len - keep)} of ${k} allowed)`;
      return `the row ${l}..${r} is ${len} long: the best stays ${ctx.vars[bName]}`;
    }
    return null;
  },
  // the row is counted and the top colour known: does it need to give up a tile?
  predict(ctx) {
    const [sName, kName] = ctx.params;
    const k = ctx.vars[kName];
    const pair = pairOf(ctx.vars);
    const cs = countsOf(ctx.vars);
    const mName = intName(ctx.vars, MAXF);
    if (!ctx.next || !Number.isInteger(k) || typeof ctx.vars[sName] !== 'string' || !pair || !cs || !mName || !isAssign(ctx, mName)) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const len = r - l + 1;
    if (total(cs[1]) !== len) return null;
    const ncs = countsOf(ctx.next.vars);
    if (!ncs || ncs[0] !== cs[0] || ctx.next.vars[rName] !== r) return null;
    const drop = ctx.next.vars[lName] !== l || total(ncs[1]) === len - 1;
    const keep = ctx.next.vars[lName] === l && total(ncs[1]) === len;
    if (!drop && !keep) return null;
    const m = ctx.vars[mName];
    if (len - m <= 0) return null; // nothing to repaint: not a real decision
    const yes = 'Yes: a tile leaves from the left';
    const no = 'No: the row keeps all its tiles';
    return options(
      `The row ${l}..${r} has ${len} tiles; the most common colour has ${m}. You own ${k} paint can${k === 1 ? '' : 's'}. Does the row give up a tile?`,
      drop ? yes : no,
      [drop ? no : yes],
      `${len} − ${m} = ${len - m} tile${len - m === 1 ? '' : 's'} must be repainted, ${drop ? `more than the ${k} cans` : `and ${k} can${k === 1 ? '' : 's'} cover that`}.`,
    );
  },
  maxPredicts: 3,
  bugs: [
    {
      label: 'Shrink one repaint too early: >= k',
      find: 'right - left + 1 - maxFreq > k',
      replace: 'right - left + 1 - maxFreq >= k',
      explain: 'Using all k cans is allowed, but this drops a tile as soon as k repaints are needed, so every answer is one tile short.',
    },
    {
      label: "Lowercase offset: charCodeAt - 97",
      find: "s.charCodeAt(right) - 65",
      replace: "s.charCodeAt(right) - 97",
      explain: "The letters are uppercase ('A' = 65), so subtracting 97 gives negative slots: no real colour is ever counted and the row is never judged correctly.",
    },
  ],
};
