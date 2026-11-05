// Sort Array By Parity (Lomuto-style partition). Passengers boarding a bus: even numbers take the front seats, one
// after another; odd numbers are pushed back. Works with a temp swap, a destructuring swap, or two ends (lo / hi).
import { changedIdx, row, swapped } from './util.js';

const READ = ['i', 'j', 'read', 'r', 'fast', 'idx', 'cur', 'k'];
const WRITE = ['store', 'write', 'w', 'slow', 'evenIdx', 'even', 'pos', 'next', 'left', 'lo', 'l', 'p'];
const HIGH = ['right', 'hi', 'high', 'end', 'odd', 'oddIdx'];

const kind = (x) => (x % 2 === 0 ? 'even' : 'odd');
const loopVars = (lines) => [...(lines || []).join('\n').matchAll(/for\s*\(\s*(?:let|var)\s+(\w+)/g)].map((m) => m[1]);
const readOf = (ctx) => loopVars(ctx.lines).find((k) => READ.includes(k) && Number.isInteger(ctx.vars[k]));
const writeOf = (ctx, r) => WRITE.find((k) => k !== r && Number.isInteger(ctx.vars[k]));

export default {
  id: 'sort-array-by-parity',
  metaphor: 'Even numbers take the front seats',
  caption: 'The array is a row of bus seats. Seats before the write pointer already hold even numbers; every even number found further back trades seats with the first odd one at the front.',
  pointers: [...new Set([...READ, ...WRITE, ...HIGH])],
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a || !b || a.length !== b.length) return null;
    const sw = swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      return `even ${a[x] % 2 === 0 ? a[x] : a[y]} and odd ${a[x] % 2 === 0 ? a[y] : a[x]} trade seats ${x} ↔ ${y} → [${a.join(', ')}]`;
    }
    const d = changedIdx(a, b);
    const nx = ctx.next && row(ctx.next.vars[name]);
    // temp swap, first half: narrate the whole trade from prev → next
    if (d.length === 1 && nx) {
      const tw = swapped(nx, b);
      if (tw) return `swap: even ${b[tw[1]]} moves up to seat ${tw[0]}, odd ${b[tw[0]]} goes back to seat ${tw[1]}`;
    }
    if (d.length === 1) return `seat ${d[0]} gets ${a[d[0]]} → [${a.join(', ')}]`;
    if (d.length) return null;
    const r = readOf(ctx);
    const w = writeOf(ctx, r);
    if (w && w in ctx.prev && ctx.vars[w] === ctx.prev[w] + 1) return `the front block of evens grows: seats 0..${ctx.vars[w] - 1} are even`;
    if (r && ctx.vars[r] !== ctx.prev[r] && ctx.vars[r] < a.length) return `look at seat ${ctx.vars[r]}: ${a[ctx.vars[r]]}`;
    return null;
  },
  // the read pointer has just reached a new seat: does that passenger move forward?
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const after = row(ctx.next.vars[name]);
    const r = readOf(ctx);
    if (!a || !after || !r || after.length !== a.length || ctx.vars[r] === ctx.prev[r]) return null;
    const i = ctx.vars[r];
    const w = writeOf(ctx, r);
    if (i >= a.length || !w || ctx.vars[w] === i) return null; // a swap with itself changes nothing on screen
    const nv = ctx.next.vars;
    let ans = null;
    const ws = ctx.vars[w];
    const d = changedIdx(after, a);
    if (nv[r] === i && d.includes(i) && (after[ws] === a[i] || after[i] === a[ws])) ans = 0;
    else if (!d.length && nv[r] === i + 1 && nv[w] === ws) ans = 1;
    if (ans === null) return null;
    return {
      question: `Seat ${i} holds ${a[i]}; ${ctx.vars[w] ? `the evens fill seats 0..${ctx.vars[w] - 1}` : 'no even has moved up yet'}. What happens to ${a[i]}?`,
      options: [`It moves up to seat ${ctx.vars[w]}`, 'It stays: the pointer moves on'],
      answer: ans,
      explain: ans === 0 ? `${a[i]} is even, so it trades places with the first seat after the even block.` : `${a[i]} is ${kind(a[i])}; it belongs at the back, so it is left where it is.`,
    };
  },
  bugs: [
    {
      label: 'Test for odd instead of even',
      find: 'nums[i] % 2 === 0',
      replace: 'nums[i] % 2 === 1',
      explain: 'The odd numbers are moved to the front instead, so [3,1,2,4] stays [3,1,2,4]: odds first, evens last.',
    },
    {
      label: 'Never grow the even block',
      find: 'store++;',
      replace: '',
      explain: 'Every even number is swapped into seat 0, pushing the previous even back out: [3,1,2,4] ends as [4,1,3,2].',
    },
  ],
};
