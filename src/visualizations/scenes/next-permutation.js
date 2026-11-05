// Next Permutation. Read the array as a number; the next permutation is the next bigger number made of the same
// digits. From the right, find the first digit that can grow (the pivot), swap in the smallest bigger digit from its
// right, then put the tail in its smallest (ascending) order. Works with a pivot under PIVOT names and a partner
// under PARTNER names; any swap or in-place reverse of the tail is narrated from the array itself.
import { changedIdx, row, swapped } from './util.js';

const PIVOT = ['i', 'k', 'pivot', 'p', 'piv'];
const PARTNER = ['j', 'm', 'succ', 'swapIdx', 'bigger', 'q'];
const intOf = (vars, names) => names.find((k) => Number.isInteger(vars[k]));
const isAsc = (a, from) => a.every((x, k) => k <= from || a[k - 1] <= x);

export default {
  id: 'next-permutation',
  metaphor: 'The next bigger number, same digits',
  caption: 'Read the array as a number. From the right, find the first digit smaller than its right neighbour (the pivot), swap in the smallest bigger digit from its right, then sort the tail ascending.',
  pointers: [...PIVOT, ...PARTNER, 'l', 'r', 'lo', 'hi', 'left', 'right'],
  narrate(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a) return null;
    const pName = intOf(ctx.vars, PIVOT);
    const p = pName && ctx.vars[pName];
    const qName = intOf(ctx.vars, PARTNER);
    const same = b && a.length === b.length && a.every((x, k) => x === b[k]);
    if (b && !same) {
      const sw = swapped(a, b);
      if (sw && pName && sw.includes(p)) {
        const other = sw[0] === p ? sw[1] : sw[0];
        return `swap the pivot ${b[p]} with ${b[other]}, the smallest bigger digit to its right: the number grows by the least possible`;
      }
      const d1 = changedIdx(a, b);
      const q = qName && ctx.vars[qName];
      if (d1.length === 1 && pName && qName && d1[0] === p) return `the pivot slot (index ${p}) takes ${a[p]}, the smallest bigger digit to its right`;
      if (d1.length === 1 && pName && qName && d1[0] === q) return `the old pivot ${a[q]} moves to index ${q}`;
      const tail = pName && p >= -1 ? p + 1 : null;
      const done = tail !== null && isAsc(a, tail) ? ' · the tail is now in its smallest order' : '';
      if (sw) return `reverse the tail: ${b[sw[0]]} ↔ ${b[sw[1]]}${done}`;
      if (changedIdx(a, b).length > 2 && done) return `the tail after the pivot is put in ascending order: its smallest arrangement`;
      return null;
    }
    if (!same || !pName) return null;
    const pivotPhase = !qName && !(PARTNER.find((k) => k in ctx.prev) && ctx.prev[PARTNER.find((k) => k in ctx.prev)] !== undefined);
    if (pivotPhase && !(pName in ctx.prev) && p === a.length - 2) return `start at the second-to-last digit (${a[p]}) and compare each digit with its right neighbour`;
    if (pivotPhase && ctx.prev[pName] === p + 1 && p + 2 < a.length) {
      const old = p + 1;
      if (p < 0) return `${a[old]} ≥ ${a[old + 1]}: every digit falls, the biggest order there is, so wrap around to the smallest`;
      return `${a[old]} ≥ ${a[old + 1]}: the digits from index ${old} on only fall, no room to grow there, step left`;
    }
    if (qName && !(qName in ctx.prev) && p >= 0 && p + 1 < a.length) {
      return `pivot found: ${a[p]} < ${a[p + 1]} at index ${p}. Now search from the right for the smallest digit bigger than ${a[p]}`;
    }
    if (qName && ctx.prev[qName] === ctx.vars[qName] + 1 && p >= 0) {
      const old = ctx.prev[qName];
      return `${a[old]} ≤ pivot ${a[p]}: too small to swap in, step left`;
    }
    return null;
  },
  // in the pivot scan: is this digit the pivot, or does the scan step left?
  predict(ctx) {
    const name = ctx.params[0];
    const a = row(ctx.vars[name]);
    const pName = intOf(ctx.vars, PIVOT);
    if (!a || !pName || !ctx.next || intOf(ctx.vars, PARTNER)) return null;
    const p = ctx.vars[pName];
    if (p < 0 || p + 1 >= a.length) return null;
    if (pName in ctx.prev && ctx.prev[pName] !== p + 1) return null; // only while the pivot scan is moving left
    const nx = ctx.next.vars;
    const after = row(nx[name]);
    const stepLeft = nx[pName] === p - 1 && after && after.every((x, k) => x === a[k]);
    const found = nx[pName] === p && (intOf(nx, PARTNER) !== undefined || (after && after.some((x, k) => x !== a[k])));
    if (!stepLeft && !found) return null;
    return {
      question: `The scan from the right is at index ${p}: ${a[p]}, with ${a[p + 1]} to its right. Is ${a[p]} the pivot?`,
      options: [`Yes: ${a[p]} can grow, it is the pivot`, 'No: step one digit left'],
      answer: found ? 0 : 1,
      explain: found ? `${a[p]} < ${a[p + 1]}: a bigger digit sits to its right, so raising ${a[p]} gives a bigger number.` : `${a[p]} ≥ ${a[p + 1]}: from here on the digits only fall, which is already their biggest order, so nothing here can grow.`,
    };
  },
  bugs: [
    {
      label: 'Pivot scan stops at equal digits',
      find: 'nums[i] >= nums[i + 1]',
      replace: 'nums[i] > nums[i + 1]',
      explain: 'An equal neighbour is taken as "can grow", so with repeated digits like [2, 2, 2] the pivot has no bigger digit to swap with and the array is garbled.',
    },
    {
      label: 'Swap with an equal digit',
      find: 'nums[j] <= nums[i]) j--',
      replace: 'nums[j] < nums[i]) j--',
      explain: 'The partner search stops at a digit equal to the pivot, so the "swap" changes nothing and [1, 5, 1] becomes [1, 1, 5], a smaller number.',
    },
  ],
};
