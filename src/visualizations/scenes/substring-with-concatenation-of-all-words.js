// Substring with Concatenation of All Words (word-sized sliding window, one lane per offset). s is cut into
// word-sized tiles; the words are a shopping list. The window collects tiles: an unknown tile empties it, a tile
// taken too often pushes tiles out on the left, and a window holding the whole list records where it starts.
// Reads the list / window counters by name (need… / seen…) and checks their shape; anything else falls back.
import { entriesOf, firstInt, options, row } from './util.js';

const NEED = /need|target|req|want|wordcount|^freq|^count|^cnt|dict|expected|^wc$/i;
const SEEN = /seen|window|^win|have|^cur|got|found|temp|tmp|^w?map2?$|^cnt2|^curr/i;
const LEFT = ['left', 'start', 'l', 'lo', 'begin', 'winStart'];
const AT = ['j', 'right', 'r', 'i', 'k', 'pos', 'end'];
const LANE = ['offset', 'off', 'o', 'lane', 'shift'];
const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'indices', 'starts'];

/** name → entries of the first counter whose name matches `re` (Map or object, integer counts) */
function counter(vars, re, not) {
  for (const [k, v] of Object.entries(vars)) {
    if (!re.test(k) || k === not) continue;
    const e = entriesOf(v);
    if (e && e.every(([, x]) => Number.isInteger(x))) return [k, new Map(e)];
  }
  return null;
}
const q = (w) => `'${w}'`;
const listText = (m) => [...m].filter(([, c]) => c > 0).map(([w, c]) => (c > 1 ? `${w} ×${c}` : w)).join(', ');

function basics(ctx, vars) {
  const [sName, wName] = ctx.params;
  const s = vars[sName];
  const words = row(vars[wName]);
  if (typeof s !== 'string' || !words?.length || typeof words[0] !== 'string') return null;
  const L = words[0].length;
  const need = counter(vars, NEED);
  const seen = counter(vars, SEEN, need?.[0]);
  const resName = RESULT.find((n) => row(vars[n]));
  return { s, words, L, m: words.length, need, seen, resName };
}

export default {
  id: 'substring-with-concatenation-of-all-words',
  metaphor: 'Word tiles against a shopping list',
  caption: 's is cut into tiles one word long, in L lanes (starting at 0, 1, … L−1). The window collects tiles: a tile not on the list empties it, a tile taken too often pushes tiles out on the left, and a full list records the start.',
  pointers: [...LEFT, ...AT],
  compare: 'result',
  narrate(ctx) {
    const b = basics(ctx, ctx.vars);
    if (!b) return null;
    const { s, L, m, need, seen, resName } = b;
    const res = resName && ctx.vars[resName];
    const pres = resName && row(ctx.prev[resName]);
    if (pres && res.length === pres.length + 1) {
      const st = res.at(-1);
      return `match! ${q(s.slice(st, st + m * L))} (cells ${st}..${st + m * L - 1}) uses every word on the list: record ${st}`;
    }
    // the shopping list being written
    if (need && need[0] in ctx.prev) {
      const was = new Map(entriesOf(ctx.prev[need[0]]) || []);
      const d = [...need[1]].find(([w, c]) => was.get(w) !== c);
      if (d) return `the list needs ${q(d[0])} ×${d[1]}`;
    }
    const [lane, o] = firstInt(ctx.vars, LANE);
    if (lane && o !== ctx.prev[lane] && o < L) return `lane ${o}: tiles start at cells ${[0, 1, 2].map((t) => o + t * L).join(', ')}… (every start ≡ ${o} mod ${L})`;
    if (seen && seen[0] in ctx.prev) {
      const was = new Map(entriesOf(ctx.prev[seen[0]]) || []);
      if (!seen[1].size && was.size) {
        if (/clear\(/.test(ctx.src || '')) return 'the window is emptied: no match can contain that tile';
        const [, st] = firstInt(ctx.vars, ['i', 'start', 'st', 'begin']);
        return `a fresh, empty window${Number.isInteger(st) ? ` starting at cell ${st}` : ''}`;
      }
      const d = [...seen[1]].find(([w, c]) => (was.get(w) ?? 0) !== c);
      if (d) {
        const [w, c] = d;
        const want = need?.[1].get(w) ?? 0;
        if (c > (was.get(w) ?? 0)) return `${q(w)} joins the window (${c} taken, the list wants ${want})${c > want ? ': one too many' : ''}`;
        return `${q(w)} leaves the window on the left (${c} left in it)`;
      }
    }
    const [lName, left] = firstInt(ctx.vars, LEFT);
    if (lName && lName in ctx.prev && left !== ctx.prev[lName] && Number.isInteger(ctx.prev[lName])) {
      if (seen && !seen[1].size) return `the window restarts at cell ${left}, after the tile that is not on the list`;
      return `the window now starts at cell ${left}${seen ? ` and holds ${listText(seen[1]) || 'nothing'}` : ''}`;
    }
    const [uName, used] = firstInt(ctx.vars, ['used', 'count', 'matched', 'words', 'taken', 'size']);
    if (uName && uName in ctx.prev && used !== ctx.prev[uName] && used === m && seen && need && [...seen[1]].every(([w, c]) => c <= (need[1].get(w) ?? 0))) return `the window holds ${m} of ${m} words`;
    const wName = ['w', 'word', 'cur', 'sub', 'piece', 'tile', 'chunk'].find((n) => typeof ctx.vars[n] === 'string');
    const w = wName && ctx.vars[wName];
    const [jName, j] = firstInt(ctx.vars, AT);
    if (w && w.length === L && jName && s.slice(j, j + L) === w && (w !== ctx.prev[wName] || j !== ctx.prev[jName])) {
      return `next tile: ${q(w)} (cells ${j}..${j + L - 1})${need && !need[1].has(w) ? ': not on the list' : ''}`;
    }
    return null;
  },
  // a tile not on the list: where does the window restart? the window holds the whole list: which start is recorded?
  predict(ctx) {
    if (!ctx.next) return null;
    const b = basics(ctx, ctx.vars);
    if (!b) return null;
    const { s, L, m, need, seen, resName } = b;
    const now = resName && row(ctx.vars[resName]);
    const after = resName && row(ctx.next.vars[resName]);
    const [lName, left] = firstInt(ctx.vars, LEFT);
    const [jName, j] = firstInt(ctx.vars, AT);
    if (!jName || !Number.isInteger(j)) return null;
    const w = s.slice(j, j + L);
    if (now && after && after.length === now.length + 1 && lName) {
      const st = after.at(-1);
      return options(
        `The window holds all ${m} words (${seen ? listText(seen[1]) : 'the whole list'}); the last tile ${q(w)} starts at cell ${j}. Which index is recorded?`,
        st,
        [left, j, j + L, left + L, j - L].filter((x) => x !== st && x >= 0),
        `The answer is where the window starts: cell ${st}, ${m} tiles of ${L} letters before the end of ${q(w)}.`,
      );
    }
    const nl = lName && ctx.next.vars[lName];
    if (!lName || !need || need[1].has(w) || !Number.isInteger(nl) || nl === left) return null;
    if (seen && seen[1].size) return null; // still half done: the window is not emptied yet
    return options(
      `${q(w)} (cells ${j}..${j + L - 1}) is not on the list and the window was emptied. At which cell does the window start again?`,
      nl,
      [j, j + 1, j + L, left + L, left].filter((x) => x !== nl && x >= 0),
      nl === j + L ? `No match can contain ${q(w)}, so the next window in this lane starts right after it: cell ${j} + ${L} = ${nl}.` : `No match can contain ${q(w)}; this code restarts the window at cell ${nl}.`,
    );
  },
  bugs: [
    {
      label: 'Only one lane: offset 0',
      find: 'offset < L',
      replace: 'offset < 1',
      explain: 'Only starts at 0, L, 2L… are tried, so a match starting at cell 1 (like "xfoobar") is never seen.',
    },
    {
      label: 'Unknown tile does not empty the window',
      find: 'seen.clear();',
      replace: '',
      explain: 'After a tile like "the", the old words stay counted while the start jumps past it, so the counts and the window disagree and the match "foobar" at 9 is missed.',
    },
  ],
};
