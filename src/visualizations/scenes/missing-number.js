// Missing Number (cyclic sort). Numbered guests and numbered seats: value v sits in seat v. Each guest is walked to
// its own seat; value n has no seat and just stays where it lands. Afterwards the one seat that does not hold its
// own number is the missing one (or n, when every seat is right). Works with any cursor name in CURSOR and any
// scan name in SCAN; a sum / XOR solution falls back to the generic notes.
import { changedIdx, row, swapped } from './util.js';

const CURSOR = ['i', 'pos', 'idx', 'cur', 'p'];
const SCAN = ['j', 'k', 'x', 'q'];
const intIn = (vars, names, prevVars) => names.find((k) => Number.isInteger(vars[k]) && (!prevVars || Number.isInteger(prevVars[k])));

/** why slot k is left alone: 'home' | 'nohome' | null (n = number of seats) */
function why(a, k) {
  const v = a[k];
  if (v === k) return 'home';
  if (v >= a.length) return 'nohome';
  return null;
}

export default {
  id: 'missing-number',
  metaphor: 'Numbered guests finding their seats',
  caption: 'Seat k is for the guest numbered k. Each swap walks one guest to their own seat; guest n has no seat and stays put. At the end the seat holding the wrong guest is the missing number.',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a) return null;
    const sw = b && swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      const home = a[x] === x ? x : a[y] === y ? y : null;
      if (home === null) return null;
      const other = home === x ? y : x;
      if (a[other] === other) return `guests ${a[x]} and ${a[y]} trade seats: both are now home`;
      return `guest ${a[home]} walks to seat ${home}; guest ${a[other]} comes back to seat ${other} to be seated next`;
    }
    const d = changedIdx(a, b);
    if (d.length === 1) return a[d[0]] === d[0] ? `guest ${d[0]} sits down in seat ${d[0]}` : `guest ${a[d[0]]} moves to seat ${d[0]}, to be seated next`;
    const cName = intIn(ctx.vars, CURSOR, ctx.prev);
    if (cName && ctx.vars[cName] === ctx.prev[cName] + 1 && b && a.every((v, k) => v === b[k])) {
      const k = ctx.prev[cName];
      const w = why(a, k);
      if (w === 'home') return `seat ${k} already holds guest ${k}: move on to seat ${k + 1}`;
      if (w === 'nohome') return `guest ${a[k]} has no seat (seats are 0…${a.length - 1}): leave it in seat ${k}, move on`;
      return null;
    }
    const sName = intIn(ctx.vars, SCAN);
    if (sName && ctx.vars[sName] !== ctx.prev[sName]) {
      const j = ctx.vars[sName];
      if (j < 0 || j >= a.length) return null;
      return a[j] === j ? `walk the seats: seat ${j} holds guest ${j} ✓` : `seat ${j} holds guest ${a[j]}, not ${j}: guest ${j} never came, ${j} is missing`;
    }
    return null;
  },
  // before a seat is settled: swap the guest home, or leave them and move on?
  predict(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const cName = intIn(ctx.vars, CURSOR);
    if (!a || !cName || !ctx.next) return null;
    const i = ctx.vars[cName];
    const after = row(ctx.next.vars[name]);
    if (i < 0 || i >= a.length || a[i] === i || !after) return null; // already home: nothing to decide
    const sw = swapped(after, a);
    const moved = sw && sw.includes(i) ? 'swap' : ctx.next.vars[cName] === i + 1 && after.every((v, k) => v === a[k]) ? 'move' : null;
    if (!moved) return null;
    const v = a[i];
    const swapOpt = `Walk guest ${v} to seat ${v} (swap)`;
    const moveOpt = `Leave guest ${v} here and move on`;
    return {
      question: `Seat ${i} holds guest ${v}. What happens?`,
      options: [swapOpt, moveOpt],
      answer: moved === 'swap' ? 0 : 1,
      explain: moved === 'swap' ? `Seat ${v} exists and does not hold guest ${v} yet, so guest ${v} is walked there.` : v >= a.length ? `There are only seats 0…${a.length - 1}, so guest ${v} has nowhere to go: it stays, and the seat it blocks is the missing one.` : `Seat ${v} already holds a guest ${v}, so there is nothing to swap.`,
    };
  },
  bugs: [
    {
      label: 'Forget that n itself can be missing',
      find: 'return n;',
      replace: 'return -1;',
      explain: 'When guests 0…n−1 are all present every seat is right, so the scan finds nothing; the missing number is n, e.g. [0, 1] → 2.',
    },
  ],
};
