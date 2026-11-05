// Rotate Array (three reversals). Books on a shelf: flip the whole shelf, then flip the first k books and the rest
// back, and the last k books have moved to the front in their original order. Works with lo/hi, left/right, l/r,
// i/j, start/end pointers, a temp-variable swap (two steps) or a destructuring swap (one step).
import { changedIdx, row, swapped } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['s', 'e'],
  ['i', 'j'],
  ['a', 'b'],
];
const K = ['k', 'steps', 'shift', 'rot', 'times', 'd'];

const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
// the shelf: the parameter, else the first plain array in scope (a helper may call it arr)
function shelfOf(vars, name) {
  if (row(vars[name])) return [name, vars[name]];
  return Object.entries(vars).find(([, v]) => row(v) && v.length) || [];
}
const kOf = (ctx, n) => {
  const name = [ctx.params[1], ...K].find((x) => Number.isInteger(ctx.vars[x]));
  return name && ctx.vars[name] >= 0 && ctx.vars[name] < n ? ctx.vars[name] : null;
};
// a pair that starts a new flip (not just one step inward): [lo, hi] or null
function freshPair(now, was) {
  const p = pairOf(now);
  if (!p) return null;
  const [a, b] = p;
  const lo = now[a];
  const hi = now[b];
  const plo = was[a];
  const phi = was[b];
  if (!Number.isInteger(plo) || !Number.isInteger(phi)) return [lo, hi];
  const inward = lo >= plo && hi <= phi && lo - plo <= 1 && phi - hi <= 1;
  return inward ? null : [lo, hi];
}
// the flip blocks for this n and k, as [label, lo, hi]
function blocks(n, k) {
  const out = [
    ['the whole shelf', 0, n - 1],
    [`the first ${k} book${k > 1 ? 's' : ''}`, 0, k - 1],
    [`the last ${n - k} book${n - k > 1 ? 's' : ''}`, k, n - 1],
  ];
  if (n - k !== k) out.push([`the first ${n - k} book${n - k > 1 ? 's' : ''}`, 0, n - k - 1]);
  return out;
}

export default {
  id: 'rotate-array',
  metaphor: 'Books on a shelf, flipped in blocks',
  caption: 'Flip the whole shelf, then flip the first k books and the remaining books back: the last k books end up in front, each block in its original order.',
  pointers: PAIRS.flat(),
  range: PAIRS,
  narrate(ctx) {
    const [name, a] = shelfOf(ctx.vars, ctx.params[0]);
    if (!a) return null;
    const n = a.length;
    const kName = ctx.params[1];
    const k = ctx.vars[kName];
    if (Number.isInteger(k) && Number.isInteger(ctx.prev[kName]) && k !== ctx.prev[kName]) {
      return `k = ${ctx.prev[kName]} turns on a shelf of ${n}: every ${n} turns is a full circle, so only ${k} turn${k === 1 ? ' matters' : 's matter'}`;
    }
    const fresh = freshPair(ctx.vars, ctx.prev);
    if (fresh && fresh[0] < fresh[1]) {
      const kk = kOf(ctx, n);
      const b = kk !== null && kk > 0 ? blocks(n, kk).find(([, lo, hi]) => lo === fresh[0] && hi === fresh[1]) : null;
      const was = row(ctx.prev[name]);
      const sw = was && was.length === n ? swapped(a, was) : null;
      const first = sw ? `books ${was[sw[0]]} and ${was[sw[1]]} trade places first` : 'the outer pair trades places, then step inward';
      return `flip ${b ? b[0] : 'the books'} (slots ${fresh[0]}..${fresh[1]}): ${first}`;
    }
    const b = row(ctx.prev[name]);
    if (!b || b.length !== n) return null;
    const sw = swapped(a, b);
    if (sw) return `books ${b[sw[0]]} and ${b[sw[1]]} trade places (slots ${sw[0]} and ${sw[1]}) → [${a.join(', ')}]`;
    const d = changedIdx(a, b);
    const p = pairOf(ctx.vars);
    if (d.length !== 1 || !p) return null;
    const [lo, hi] = [ctx.vars[p[0]], ctx.vars[p[1]]];
    if (d[0] === lo) return `book ${a[lo]} from slot ${hi} is copied into slot ${lo} (the old ${b[lo]} is held aside)`;
    if (d[0] === hi) return `the held-aside ${a[hi]} goes into slot ${hi}: slots ${lo} and ${hi} have traded books → [${a.join(', ')}]`;
    return null;
  },
  // right before a new flip starts: which block of books is flipped?
  predict(ctx) {
    if (!ctx.next) return null;
    const [, a] = shelfOf(ctx.vars, ctx.params[0]);
    if (!a) return null;
    const n = a.length;
    const k = kOf(ctx, n);
    const fresh = freshPair(ctx.next.vars, ctx.vars);
    if (k === null || k < 1 || n < 3 || !fresh || fresh[0] >= fresh[1]) return null;
    const bs = blocks(n, k);
    const hit = bs.find(([, lo, hi]) => lo === fresh[0] && hi === fresh[1]);
    if (!hit) return null;
    const label = ([t, lo, hi]) => `${t} (slots ${lo}..${hi})`;
    const opts = bs.map(label);
    return {
      question: `Rotating right by k = ${k}; the shelf is [${a.join(', ')}]. Which block of books is flipped next?`,
      options: opts,
      answer: opts.indexOf(label(hit)),
      explain:
        hit[1] === 0 && hit[2] === n - 1
          ? 'First the whole shelf is flipped: the last k books land at the front, but each block is now backwards.'
          : hit[1] === 0 && hit[2] === k - 1
            ? `After the whole flip the first ${k} slots hold the books that belong in front, backwards; flipping them restores their order.`
            : hit[1] === k
              ? `Last, the remaining ${n - k} books are flipped back into their original order.`
              : `This code flips the first ${n - k} books: that is the cut for a left rotation.`,
    };
  },
  bugs: [
    {
      label: 'Forget k %= n',
      find: 'k %= n;',
      replace: '',
      explain: 'k can be bigger than the shelf (k = 4 on 3 books). Without k % n the flips reach past the last slot and fill the shelf with undefined.',
    },
    {
      label: 'Cut the shelf in the wrong place',
      find: 'reverse(0, k - 1);',
      replace: 'reverse(0, n - k - 1);',
      explain: 'After the whole flip, the k books that belong in front sit in slots 0..k-1. Flipping the first n − k instead scrambles both blocks.',
    },
  ],
};
