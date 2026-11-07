// Scene: Reorganize String. Lay letter tiles in a row so that no two equal tiles touch: always lay the letter with
// the most tiles left, and the letter just laid sits out one turn before it may go back into the heap. Heap items
// are [letter, tiles left] pairs (or [left, letter]); the row is the one growing array of letters / string.
import { entriesOf, itemsOf, options } from './util.js';

const isPair = (p) => Array.isArray(p) && p.length === 2 && p.some((x) => typeof x === 'string') && p.some((x) => typeof x === 'number');
const letterOf = (p) => p.find((x) => typeof x === 'string');
const leftOf = (p) => p.find((x) => typeof x === 'number');
const show = (p) => `${letterOf(p)} (${leftOf(p)} left)`;

/** { name, items } of a heap of [letter, count] pairs */
function heapOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const isHeap = v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq/i.test(k);
    const items = isHeap ? itemsOf(v) : null;
    if (Array.isArray(items) && items.every(isPair)) return { name: k, items };
  }
  return null;
}
/** the row of laid tiles as a string: a non-parameter array of single letters, or a string */
function rowOf(vars, params, name) {
  const v = vars?.[name];
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length === 1)) return v.join('');
  return null;
}
/** [name, row now, row before] of the row that grew by one letter */
function grown(before, after, params) {
  for (const k of Object.keys(after || {})) {
    if (params.includes(k)) continue;
    const a = rowOf(after, params, k);
    const b = rowOf(before, params, k);
    if (a !== null && b !== null && a.length === b.length + 1 && a.startsWith(b)) return [k, a, b];
  }
  return [null];
}
const key = (p) => letterOf(p);
const CHECK = /ceil|\/\s*2|>>\s*1|\+\s*1\)\s*\/\s*2/;

export default {
  id: 'reorganize-string',
  metaphor: 'Lay tiles, no twin side by side',
  caption: 'Each heap item is a letter and how many of its tiles are left, the most plentiful on top. Lay the top letter; the letter just laid sits out one turn, then goes back into the heap if it still has tiles.',
  narrate(ctx) {
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string') return null;
    if (ctx.ret && typeof ctx.value === 'string') {
      if (ctx.value) return `every tile is laid with no twins side by side: ${ctx.value}`;
      const [, cnt] = entriesOf(Object.values(ctx.vars).find((v) => entriesOf(v)) || null)?.reduce((m, e) => (e[1] > m[1] ? e : m), ['', -1]) || [];
      const room = Math.ceil(s.length / 2);
      return cnt > room ? `one letter has ${cnt} tiles, but a row of ${s.length} has room for only ${room} apart: impossible, return ""` : 'no letter can be laid without a twin next to it: return ""';
    }
    if (!Object.keys(ctx.prev).length) return null;
    // counting tiles
    for (const [k, v] of Object.entries(ctx.vars)) {
      const now = entriesOf(v);
      const before = entriesOf(ctx.prev[k]);
      if (!now || !before || ctx.params.includes(k)) continue;
      const ch = now.find(([c, n]) => !before.some(([d, m]) => d === c && m === n));
      if (ch && typeof ch[1] === 'number') return `count the tiles: ${ch[0]} × ${ch[1]}`;
    }
    const [rName, row, was] = grown(ctx.prev, ctx.vars, ctx.params);
    if (rName) return `lay ${row[row.length - 1]}: the row is now ${row}${was ? '' : ' (first tile)'}`;
    const h = heapOf(ctx.vars, ctx.params);
    const g = heapOf(ctx.prev, ctx.params);
    if (h && g && h.name === g.name) {
      const added = h.items.filter((p) => !g.items.some((q) => key(q) === key(p)));
      const gone = g.items.filter((p) => !h.items.some((q) => key(q) === key(p)));
      // back from sitting out: it is the letter laid just before the last one
      const back = (p) => Object.keys(ctx.vars).some((k) => !ctx.params.includes(k) && (rowOf(ctx.vars, ctx.params, k) || '').at(-2) === letterOf(p));
      if (gone.length === 1 && !added.length) return `the letter with the most tiles left is ${show(gone[0])}`;
      if (added.length === 1 && !gone.length) {
        return back(added[0]) ? `${letterOf(added[0])} has sat out a turn and goes back into the heap (${leftOf(added[0])} left)` : `${show(added[0])} goes into the heap`;
      }
    }
    for (const [k, v] of Object.entries(ctx.vars)) {
      const b = ctx.prev[k];
      if (ctx.params.includes(k) || !isPair(v)) continue;
      if (isPair(b) && letterOf(b) === letterOf(v) && leftOf(b) === leftOf(v) + 1) return `one ${letterOf(v)} tile is used: ${leftOf(v)} left`;
      if (/held|prev|wait|last|cool|block|hold/i.test(k) && (!isPair(b) || letterOf(b) !== letterOf(v))) return `${letterOf(v)} was just laid, ${leftOf(v) ? `so it sits out the next turn (${leftOf(v)} left)` : 'and has no tiles left'}`;
    }
    if (CHECK.test(ctx.src) && /max|\bfor\b|>/.test(ctx.src)) return `no letter has more tiles than the ${Math.ceil(s.length / 2)} that fit apart in a row of ${s.length}: it can be done`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const s = ctx.vars[ctx.params[0]];
    if (typeof s !== 'string') return null;
    // before the feasibility check: can it be done at all?
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    if (CHECK.test(nextSrc) && !CHECK.test(ctx.src) && !heapOf(ctx.vars, ctx.params)) {
      const counts = Object.values(ctx.vars).map(entriesOf).find((e) => e && e.length && e.every(([, n]) => typeof n === 'number'));
      if (!counts || counts.reduce((t, [, n]) => t + n, 0) !== s.length) return null;
      const [c, n] = counts.reduce((m, e) => (e[1] > m[1] ? e : m));
      const no = !!ctx.next.ret && ctx.next.value === '';
      const room = Math.ceil(s.length / 2);
      return {
        question: `The most common letter, ${c}, has ${n} tile${n === 1 ? "" : "s"} in a row of ${s.length}. Can the tiles be laid with no twins side by side?`,
        options: ['Yes', 'No'],
        answer: no ? 1 : 0,
        explain: `Tiles of one letter need a gap between them, so a row of ${s.length} fits at most ${room} of them (every other spot). ${n} ${n > room ? '>' : '≤'} ${room}.`,
      };
    }
    // just before a letter is taken from the heap: which one?
    const h = heapOf(ctx.vars, ctx.params);
    const n = heapOf(ctx.next.vars, ctx.params);
    if (!h || !n || h.name !== n.name || h.items.length < 2) return null;
    const gone = h.items.filter((p) => !n.items.some((q) => key(q) === key(p)));
    if (gone.length !== 1 || n.items.length !== h.items.length - 1) return null;
    const right = letterOf(gone[0]);
    // a tie in tiles left: which one the heap gives first is not something to guess
    if (h.items.some((p) => key(p) !== right && leftOf(p) === leftOf(gone[0]))) return null;
    const rName = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && rowOf(ctx.vars, ctx.params, k));
    const row = rName ? rowOf(ctx.vars, ctx.params, rName) : '';
    if (!row) return null; // the first pick is just "the most tiles"
    const last = row[row.length - 1];
    const wrong = [last, ...h.items.map(letterOf)].filter((c) => c !== right);
    return options(
      `The row so far is ${row}. The heap holds ${h.items.map(show).join(', ')}. Which letter is laid next?`,
      right,
      [...new Set(wrong)].slice(0, 3),
      `${right} has the most tiles left in the heap${last !== right ? `; ${last} was just laid and is sitting out this turn` : ''}.`,
    );
  },
  bugs: [
    {
      label: 'Floor instead of ceil: rejects odd rows',
      find: 'Math.ceil(s.length / 2)',
      replace: 'Math.floor(s.length / 2)',
      explain: 'A row of 3 fits 2 tiles of one letter (a?a), but floor(3 / 2) = 1 says it cannot, so "baa" is wrongly reported impossible.',
    },
    {
      label: 'No sitting out: the same letter twice',
      find: 'if (held && held[1] > 0) heap.push(held); // previous char may be used again now\n    held = cur;',
      replace: 'if (cur[1] > 0) heap.push(cur);',
      explain: 'The letter just laid goes straight back into the heap, still the most plentiful, so it is laid again right next to itself.',
    },
  ],
};
