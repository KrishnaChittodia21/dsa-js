// Subarray Sum Equals K (prefix sum + count Map). An odometer: after each number the trip total is read; if it
// read exactly total − k earlier, the stretch since then adds up to k. The logbook (Map) counts every reading.
// Works with any name for the running total and the count, and a Map or a plain object as the logbook.
import { entriesOf, firstInt, options } from './util.js';

const TOTAL = ['cur', 'curr', 'sum', 'prefix', 'pre', 'prefixSum', 'running', 'total', 'acc', 's', 'ps'];
const COUNT = ['count', 'cnt', 'res', 'result', 'ans', 'answer', 'out', 'matches'];
const bookOf = (vars) => Object.entries(vars).find(([, v]) => entriesOf(v));
const asMap = (v) => new Map((entriesOf(v) || []).map(([key, n]) => [Number(key), n]));
const times = (n) => `${n} time${n === 1 ? '' : 's'}`;

export default {
  id: 'subarray-sum-equals-k',
  metaphor: 'Odometer readings in a trip logbook',
  caption: 'The running total is the odometer. The logbook counts how often each reading appeared; every earlier reading of total − k starts a stretch that adds up to exactly k.',
  compare: 'count',
  narrate(ctx) {
    const k = ctx.vars[ctx.params[1]];
    if (!Number.isInteger(k)) return null;
    const [tName, t] = firstInt(ctx.vars, TOTAL);
    const [cName, c] = firstInt(ctx.vars, COUNT);
    const book = bookOf(ctx.vars);
    if (book && tName && Number.isInteger(ctx.prev[tName]) && t !== ctx.prev[tName]) {
      return `add ${t - ctx.prev[tName]}: the odometer reads ${t}; a stretch of exactly ${k} needs an earlier reading of ${t - k}`;
    }
    if (cName && Number.isInteger(ctx.prev[cName]) && c > ctx.prev[cName] && tName) {
      const n = c - ctx.prev[cName];
      return `reading ${t - k} was logged ${times(n)} before: ${n} stretch${n === 1 ? '' : 'es'} ending here add${n === 1 ? 's' : ''} up to ${k} (${cName} = ${c})`;
    }
    // the lookup line ran and found nothing
    if (book && cName && tName && c === ctx.prev[cName] && t === ctx.prev[tName] && !asMap(book[1]).get(t - k) && new RegExp(`\\b${cName}\\s*(\\+=|\\+\\+)`).test(ctx.src || '')) {
      return `no earlier reading of ${t - k} in the logbook: no stretch ending here adds up to ${k}`;
    }
    if (book) {
      const now = asMap(book[1]);
      const was = asMap(ctx.prev[book[0]]);
      if (!(book[0] in ctx.prev)) return now.get(0) ? 'the logbook starts with reading 0 once: the empty start, so stretches from index 0 count' : null;
      const key = [...now.keys()].find((x) => now.get(x) !== was.get(x));
      if (key !== undefined) return `log reading ${key}: seen ${times(now.get(key))} so far`;
    }
    return null;
  },
  // right after the odometer moves: how many stretches summing to k end here?
  predict(ctx) {
    if (!ctx.next) return null;
    const k = ctx.vars[ctx.params[1]];
    const [tName, t] = firstInt(ctx.vars, TOTAL);
    const [cName, c] = firstInt(ctx.vars, COUNT);
    const book = bookOf(ctx.vars);
    if (!Number.isInteger(k) || !tName || !cName || !book || t === ctx.prev[tName] || !(tName in ctx.prev)) return null;
    const nx = ctx.next.vars;
    if (nx[tName] !== t) return null;
    const now = asMap(book[1]);
    const later = asMap(nx[book[0]]);
    const found = now.get(t - k) || 0;
    let ans;
    if (Number.isInteger(nx[cName]) && nx[cName] > c) ans = nx[cName] - c;
    else if (nx[cName] === c && !now.has(t - k) && !later.has(t - k) && [...later].some(([x, n]) => n !== now.get(x))) ans = 0;
    else return null;
    if (ans !== found) return null;
    return options(`The odometer reads ${t} and k = ${k}. How many stretches ending here add up to ${k}?`, ans, [ans + 1, Math.max(0, ans - 1), ans + 2, 1, 0], `Each earlier reading of ${t} − ${k} = ${t - k} starts one: the logbook has it ${times(found)}.`);
  },
  bugs: [
    {
      label: 'Forget the empty start in the logbook',
      find: 'new Map([[0, 1]])',
      replace: 'new Map()',
      explain: 'Reading 0 before the first number is never logged, so a stretch that starts at index 0 (like [5] with k = 5) is missed.',
    },
    {
      label: 'Count 1 per match instead of how many times',
      find: 'count += seen.get(cur - k) ?? 0;',
      replace: 'count += seen.has(cur - k) ? 1 : 0;',
      explain: 'A reading logged several times means several different starts; counting it once (like a Set would) undercounts, e.g. [0,0,0] with k = 0 gives 3, not 6.',
    },
  ],
};
