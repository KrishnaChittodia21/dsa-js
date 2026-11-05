// Set Mismatch (cyclic sort). Numbered guests and numbered seats: guest v sits in seat v (index v − 1). Each guest
// is walked to their own seat; a second guest with the same number finds the seat taken and stays where it is.
// Afterwards the seat holding the wrong guest names both answers: that guest is the duplicate, the seat's own
// number is missing. Works with any cursor name in CURSOR and scan name in SCAN; counting / Set solutions fall back.
import { changedIdx, row, swapped } from './util.js';

const CURSOR = ['i', 'pos', 'idx', 'cur', 'p'];
const SCAN = ['j', 'k', 'x', 'q'];
const intIn = (vars, names, prevVars) => names.find((k) => Number.isInteger(vars[k]) && (!prevVars || Number.isInteger(prevVars[k])));
const seat = (k) => `seat ${k + 1}`;

export default {
  id: 'set-mismatch',
  metaphor: 'Numbered guests, one seat double-booked',
  caption: 'Guest v belongs in seat v (index v − 1). Each swap walks one guest home; the duplicate finds its seat already taken and stays put. The seat holding the wrong guest names the duplicate and the missing number.',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a) return null;
    const sw = b && swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      const home = a[x] === x + 1 ? x : a[y] === y + 1 ? y : null;
      if (home === null) return null;
      const other = home === x ? y : x;
      if (a[other] === other + 1) return `guests ${a[x]} and ${a[y]} trade seats: both are now home`;
      return `guest ${a[home]} walks to ${seat(home)}; guest ${a[other]} comes back to ${seat(other)} to be seated next`;
    }
    const d = changedIdx(a, b);
    if (d.length === 1) return a[d[0]] === d[0] + 1 ? `guest ${a[d[0]]} sits down in ${seat(d[0])}` : `guest ${a[d[0]]} moves to ${seat(d[0])}, to be seated next`;
    const cName = intIn(ctx.vars, CURSOR, ctx.prev);
    if (cName && ctx.vars[cName] === ctx.prev[cName] + 1 && b && a.every((v, k) => v === b[k])) {
      const k = ctx.prev[cName];
      const v = a[k];
      if (v === k + 1) return `${seat(k)} already holds guest ${v}: move on`;
      if (a[v - 1] === v) return `guest ${v} finds ${seat(v - 1)} already taken by another ${v}: a duplicate, leave it in ${seat(k)}`;
      return null;
    }
    const sName = intIn(ctx.vars, SCAN);
    if (sName && ctx.vars[sName] !== ctx.prev[sName]) {
      const j = ctx.vars[sName];
      if (j < 0 || j >= a.length) return null;
      return a[j] === j + 1 ? `walk the seats: ${seat(j)} holds guest ${j + 1} ✓` : `${seat(j)} holds guest ${a[j]}, not ${j + 1}: ${a[j]} came twice and ${j + 1} never came`;
    }
    return null;
  },
  // before a seat is settled (guest not home yet): swap them home, or leave them and move on?
  predict(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const cName = intIn(ctx.vars, CURSOR);
    if (!a || !cName || !ctx.next) return null;
    const i = ctx.vars[cName];
    const after = row(ctx.next.vars[name]);
    if (i < 0 || i >= a.length || a[i] === i + 1 || !after || !Number.isInteger(a[i])) return null;
    const sw = swapped(after, a);
    const moved = sw && sw.includes(i) ? 'swap' : ctx.next.vars[cName] === i + 1 && after.every((v, k) => v === a[k]) ? 'move' : null;
    if (!moved) return null;
    const v = a[i];
    return {
      question: `${seat(i)} holds guest ${v}; ${seat(v - 1)} holds guest ${a[v - 1]}. What happens?`,
      options: [`Walk guest ${v} to ${seat(v - 1)} (swap)`, `Leave guest ${v} here and move on`],
      answer: moved === 'swap' ? 0 : 1,
      explain: moved === 'swap' ? `${seat(v - 1)} holds someone else (${a[v - 1]}), so guest ${v} takes it and ${a[v - 1]} comes back to be seated.` : `${seat(v - 1)} already has a guest ${v}: this one is the duplicate. Swapping equal guests would loop forever, so it stays.`,
    };
  },
  bugs: [
    {
      label: 'Answer in the wrong order',
      find: 'return [nums[j], j + 1]',
      replace: 'return [j + 1, nums[j]]',
      explain: 'The question asks for [duplicate, missing]; returning [missing, duplicate] fails every test, e.g. [1, 2, 2, 4] gives [3, 2].',
    },
  ],
};
