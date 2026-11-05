// Longest Substring Without Repeating Characters (variable sliding window). Letters are beads threaded from the
// right; a bead colour may appear only once. Map version: the start jumps past the earlier copy (only if it is still
// on the thread). Set version: beads fall off the left until the copy is gone. Works with left/l/start/i + right/r/end/j.
import { options } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const BEST = ['best', 'max', 'maxLen', 'ans', 'res', 'result', 'longest', 'maxLength', 'longestLen'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
// char → last index Map, or the Set of chars on the thread
const mapOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$map) && v.$map.every((e) => typeof e[0] === 'string' && Number.isInteger(e[1])));
const setOf = (vars) => Object.entries(vars).find(([, v]) => v && Array.isArray(v.$set));
const asMap = (v) => new Map(v && Array.isArray(v.$map) ? v.$map : []);
const q = (c) => `'${c}'`;

export default {
  id: 'longest-substring-without-repeating-characters',
  metaphor: 'Beads on a thread, no repeated colour',
  caption: 'The bracket is the thread: each letter is a bead added on the right. A colour may appear once, so a repeat pushes the start of the thread past the earlier bead.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const s = ctx.vars[ctx.params[0]];
    const pair = pairOf(ctx.vars);
    if (typeof s !== 'string' || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const inR = r >= 0 && r < s.length;
    const m = mapOf(ctx.vars);
    const st = setOf(ctx.vars);
    const pl = ctx.prev[lName];
    // the start moved
    if (Number.isInteger(pl) && l !== pl && inR) {
      if (m && l > pl && asMap(ctx.prev[m[0]]).get(s[r]) === l - 1) return `${q(s[r])} is already on the thread at cell ${l - 1}: the start jumps past it to cell ${l} (thread ${q(s.slice(l, r + 1))})`;
      if (st && l === pl + 1) {
        const ps = ctx.prev[st[0]];
        if (ps && Array.isArray(ps.$set) && ps.$set.length === st[1].$set.length) return `the start moves to cell ${l} (thread ${q(s.slice(l, r))})`;
        return `${q(s[r])} repeats, so bead ${q(s[pl])} (cell ${pl}) falls off the left end${s.slice(l, r).includes(s[r]) ? `: ${q(s[r])} is still on the thread` : ''}`;
      }
      if (l < pl) return `the start moves back to cell ${l}: an old copy outside the thread pulled it backwards`;
    }
    if (m && inR) {
      const was = asMap(ctx.prev[m[0]]);
      const now = asMap(m[1]);
      if (now.get(s[r]) === r && was.get(s[r]) !== r) return was.has(s[r]) ? `remember: ${q(s[r])} was last seen at cell ${r} now (was ${was.get(s[r])})` : `remember: ${q(s[r])} first seen at cell ${r}`;
    }
    if (st && ctx.prev[st[0]] && Array.isArray(ctx.prev[st[0]].$set)) {
      const was = new Set(ctx.prev[st[0]].$set);
      const added = st[1].$set.find((c) => !was.has(c));
      if (added !== undefined) return `bead ${q(added)} joins the thread: ${st[1].$set.map(q).join(' ')}`;
      const gone = [...was].find((c) => !st[1].$set.includes(c));
      if (gone !== undefined) return inR ? `${q(s[r])} repeats, so bead ${q(gone)} falls off the left end${st[1].$set.includes(s[r]) ? `: ${q(s[r])} is still on the thread` : `: now ${q(s[r])} can join`}` : `bead ${q(gone)} falls off the left end`;
    }
    if (inR && r !== ctx.prev[rName]) return `next bead: ${q(s[r])} at cell ${r} (${r > l ? `the thread is cells ${l}..${r - 1}` : 'the thread is empty'})`;
    const bName = BEST.find((n) => Number.isInteger(ctx.vars[n]));
    if (bName && Number.isInteger(ctx.prev[bName]) && inR) {
      const len = r - l + 1;
      if (ctx.vars[bName] > ctx.prev[bName] && ctx.vars[bName] === len) return `new longest thread: ${q(s.slice(l, r + 1))}, ${len} bead${len === 1 ? '' : 's'}`;
      if (ctx.vars[bName] === ctx.prev[bName] && new RegExp(`\\b${bName}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '')) return `the thread ${q(s.slice(l, r + 1))} has ${len} bead${len === 1 ? '' : 's'}: the best stays ${ctx.vars[bName]}`;
    }
    return null;
  },
  // Map version: a repeated letter is about to be handled. Does the start jump, and where to?
  predict(ctx) {
    const s = ctx.vars[ctx.params[0]];
    const pair = pairOf(ctx.vars);
    const m = mapOf(ctx.vars);
    if (typeof s !== 'string' || !pair || !m || !ctx.next) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (r === ctx.prev[rName] || !(r >= 0 && r < s.length) || ctx.next.vars[rName] !== r) return null;
    const last = asMap(m[1]).get(s[r]);
    if (!Number.isInteger(last) || last >= r) return null;
    const nl = ctx.next.vars[lName];
    if (!Number.isInteger(nl)) return null;
    // the next step must settle it: either the start moves, or the map is updated without a move
    const settled = nl !== l || asMap(ctx.next.vars[m[0]]).get(s[r]) === r;
    if (!settled) return null;
    const jump = (x) => `The start jumps to cell ${x}`;
    const stay = `The start stays at cell ${l}`;
    const right = nl === l ? stay : jump(nl);
    const wrong = [stay, jump(last + 1), jump(r)].filter((o) => o !== right);
    return options(
      `The thread is cells ${l}..${r - 1} (${q(s.slice(l, r))}). The next bead ${q(s[r])} was last seen at cell ${last}. What happens to the start?`,
      right,
      wrong,
      last >= l ? `The earlier ${q(s[r])} at cell ${last} is on the thread, so the start must pass it: cell ${last + 1}.` : nl === l ? `The earlier ${q(s[r])} at cell ${last} already fell off (it is left of cell ${l}), so nothing repeats and the start stays.` : `This code moves the start to cell ${nl}.`,
    );
  },
  bugs: [
    {
      label: 'Trust an old copy outside the window',
      find: ' && lastSeen.get(ch) >= left',
      replace: '',
      explain: 'A copy that already fell off the thread still moves the start, and in "abba" it moves the start backwards, so "bba" is counted as length 3.',
    },
    {
      label: 'Length off by one: right - left',
      find: 'right - left + 1',
      replace: 'right - left',
      explain: 'Cells left..right hold right − left + 1 beads; forgetting the + 1 makes every answer one too short.',
    },
  ],
};
