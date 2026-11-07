// Sort Colors (Dutch national flag). Red (0), white (1) and blue (2) socks: reds go to the front pile, blues to the
// back pile, whites stay in the middle. Works with low/mid/high, lo/i/hi, l/m/r, zero/i/two and similar names.
import { row, swapped } from './util.js';

const MID = ['mid', 'm', 'cur', 'curr', 'current', 'i', 'j', 'idx'];
const LOW = ['low', 'lo', 'l', 'left', 'zero', 'zeros', 'red', 'p0', 'start', 'i'];
const HIGH = ['high', 'hi', 'h', 'r', 'right', 'two', 'twos', 'blue', 'p2', 'end', 'k', 'j'];
const COLOR = ['red (0)', 'white (1)', 'blue (2)'];

function ptrs(vars) {
  const m = MID.find((k) => Number.isInteger(vars[k]));
  const l = LOW.find((k) => k !== m && Number.isInteger(vars[k]));
  const h = HIGH.find((k) => k !== m && k !== l && Number.isInteger(vars[k]));
  return m && l && h ? [l, m, h] : null;
}
const swapLine = (line, arr, x, y) => line.includes(`${arr}[${x}]`) && line.includes(`${arr}[${y}]`);

export default {
  id: 'sort-colors',
  metaphor: 'Red, white and blue socks into three piles',
  caption: '0 is red, 1 white, 2 blue. Reds go to the front pile, blues to the back pile, whites stay in the middle; the cells between mid and high are still unchecked.',
  pointers: [...new Set([...LOW, ...MID, ...HIGH])],
  range: [['mid', 'high']],
  compare: 'mid',
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a || !b || a.length !== b.length) return null;
    const sw = swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      if (a[y] === 2) return `blue sock to the back pile (slot ${y}); the ${COLOR[a[x]] || a[x]} that came from slot ${y} is not checked yet`;
      if (a[x] === 0) return `red sock to the front pile (slot ${x}); the ${COLOR[a[y]] || a[y]} it replaces moves to slot ${y}`;
      return `slots ${x} and ${y} trade socks → [${a.join(', ')}]`;
    }
    const p = ptrs(ctx.vars);
    if (!p || !p.every((k) => k in ctx.prev)) return null;
    const [l, m, h] = p;
    const pm = ctx.prev[m];
    const still = p.every((k) => ctx.vars[k] === ctx.prev[k]) && a.every((x, i) => x === b[i]);
    // a swap of a sock with itself (low === mid) changes nothing on screen
    if (still && a[pm] === 0 && swapLine(ctx.src, name, l, m)) return `red sock at slot ${pm} is already at the edge of the front pile: it stays put`;
    const end = ctx.vars[m] > ctx.vars[h] ? ' · nothing unchecked is left: the socks are sorted' : '';
    if (ctx.vars[m] === pm + 1 && ctx.vars[l] === ctx.prev[l] && a[pm] === 1) return `white sock at slot ${pm} stays in the middle: ${m} moves on${end}`;
    if (ctx.vars[m] === pm + 1 && a[pm] === 0) return `the front pile has grown, ${m} moves on to slot ${ctx.vars[m]}${end}`;
    if (ctx.vars[h] === ctx.prev[h] - 1) return `the back pile has grown: ${h} = ${ctx.vars[h]}; ${m} stays to check the sock that arrived${end}`;
    return null;
  },
  // right after mid lands on a new sock (or the back pile grows): where does that sock go?
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const after = row(ctx.next.vars[name]);
    const p = ptrs(ctx.vars);
    if (!a || !after || !p || after.length !== a.length) return null;
    const [l, m, h] = p;
    const [lo, mid, hi] = p.map((k) => ctx.vars[k]);
    const fresh = !(m in ctx.prev) || ctx.prev[m] !== mid || ctx.prev[h] !== hi;
    if (!fresh || mid > hi || mid >= a.length || ![0, 1, 2].includes(a[mid])) return null;
    const nx = ctx.next.vars;
    const line = ctx.lines[ctx.next.line - 1] || '';
    const sw = swapped(after, a);
    const same = sw === null && after.every((x, i) => x === a[i]);
    let ans = null;
    if (sw ? sw[0] === lo && sw[1] === mid : same && swapLine(line, name, l, m)) ans = 0;
    else if (sw ? sw[0] === mid && sw[1] === hi : same && swapLine(line, name, m, h)) ans = 2;
    else if (same && nx[m] === mid + 1 && nx[l] === lo && nx[h] === hi) ans = 1;
    if (ans === null) return null;
    return {
      question: `${m} points at slot ${mid}: a ${COLOR[a[mid]]} sock. What happens to it?`,
      options: [`Swap it to the front pile (slot ${lo})`, `Leave it in the middle: ${m} moves on`, `Swap it to the back pile (slot ${hi})`],
      answer: ans,
      explain: ['Reds belong in front: it trades places with the first sock after the red pile.', 'Whites belong in the middle, which is exactly where it is.', `Blues belong at the back: it trades with slot ${hi}, and ${m} stays to check the sock that comes back.`][ans],
    };
  },
  bugs: [
    {
      label: 'while (mid < high): last sock never checked',
      find: 'mid <= high',
      replace: 'mid < high',
      explain: 'When mid and high meet, one unchecked sock is left; stopping there leaves a red or blue sock in the middle (e.g. [2, 0, 1] ends as [1, 0, 2]).',
    },
    {
      label: 'Move on after a swap with the back',
      find: 'high--;',
      replace: 'high--; mid++;',
      explain: 'The sock that comes back from slot high has not been checked. Skipping it can leave a red sock stuck among the whites.',
    },
  ],
};
