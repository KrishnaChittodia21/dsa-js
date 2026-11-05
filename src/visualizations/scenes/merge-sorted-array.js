// Merge Sorted Array (merge from the back). Two sorted piles of cards; the free slots are at the back of nums1, so
// the bigger of the two last cards goes into the last free slot. Works with i/j/k, p1/p2/p and similar names.
import { changedIdx, row } from './util.js';

const I = ['i', 'p1', 'a', 'idx1', 'x', 'm1'];
const J = ['j', 'p2', 'b', 'idx2', 'y', 'n2'];
const K = ['k', 'p', 'w', 'write', 'pos', 'last', 'end', 'idx', 'tail'];

const intName = (vars, names) => names.find((k) => Number.isInteger(vars[k]));

export default {
  id: 'merge-sorted-array',
  metaphor: 'Two sorted piles, filled from the back',
  caption: 'The empty slots sit at the back of nums1. Compare the last unplaced card of each pile; the bigger one goes into the last free slot, so no unread card is ever covered.',
  pointers: [...I, ...J, ...K],
  narrate(ctx) {
    const [aName, , bName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const was = row(ctx.prev[aName]);
    const b = row(ctx.vars[bName]);
    if (!a || !was || !b || a.length !== was.length) return null;
    const iN = intName(ctx.prev, I);
    const jN = intName(ctx.prev, J);
    const jNow = jN && ctx.vars[jN];
    const done = jN && jNow === -1 && ctx.prev[jN] === 0 ? ` · ${bName} is used up: the rest of ${aName} is already in place` : '';
    const d = changedIdx(a, was);
    if (d.length !== 1) return null;
    const s = d[0];
    const v = a[s];
    const pi = iN ? ctx.prev[iN] : undefined;
    const pj = jN ? ctx.prev[jN] : undefined;
    const x = Number.isInteger(pi) && pi >= 0 ? was[pi] : undefined;
    const y = Number.isInteger(pj) && pj >= 0 ? b[pj] : undefined;
    if (x !== undefined && x === y && v === x) return `slot ${s} gets ${v}: both piles end in ${v}, a tie, so either card can go first${done}`;
    if (y !== undefined && v === y && (x === undefined || y > x)) {
      return `slot ${s} gets ${v} from ${bName}${x === undefined ? ` (${aName} has no cards left)` : ` (${y} > ${aName}'s ${x})`}${done}`;
    }
    if (x !== undefined && v === x) {
      return `slot ${s} gets ${v} from ${aName}${y === undefined ? '' : ` (${x} > ${bName}'s ${y})`}: it moves back to make room${done}`;
    }
    return `slot ${s} = ${v}: a card is put down${done}`;
  },
  // before a write: which of the two back cards goes into the next free slot?
  predict(ctx) {
    if (!ctx.next) return null;
    const [aName, , bName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const b = row(ctx.vars[bName]);
    const after = row(ctx.next.vars[aName]);
    const iN = intName(ctx.vars, I);
    const jN = intName(ctx.vars, J);
    if (!a || !b || !after || !iN || !jN || after.length !== a.length) return null;
    const d = changedIdx(after, a);
    const i = ctx.vars[iN];
    const j = ctx.vars[jN];
    if (d.length !== 1 || i < 0 || j < 0 || i >= a.length || j >= b.length) return null;
    const x = a[i];
    const y = b[j];
    const v = after[d[0]];
    if (x === y || (v !== x && v !== y)) return null;
    const opts = [`${x} (${aName}'s last card)`, `${y} (${bName}'s last card)`];
    const big = Math.max(x, y);
    return {
      question: `Slot ${d[0]} is the next free slot. ${aName}'s last unplaced card is ${x}, ${bName}'s is ${y}. Which one goes there?`,
      options: opts,
      answer: v === x ? 0 : 1,
      explain: v === big ? `Filling from the back, the bigger card belongs last: ${big} goes into slot ${d[0]}.` : `This code puts ${v} there.`,
    };
  },
  bugs: [
    {
      label: 'Stop when either pile runs out',
      find: 'while (j >= 0)',
      replace: 'while (i >= 0 && j >= 0)',
      explain: `When nums1's cards run out first, the cards left in nums2 are never copied, so nums1 keeps its old values (or 0 placeholders) at the front.`,
    },
    {
      label: 'Put the smaller card at the back',
      find: 'nums1[i] > nums2[j]',
      replace: 'nums1[i] < nums2[j]',
      explain: 'The last free slot must hold the biggest card. Taking the smaller one first fills nums1 in the wrong order.',
    },
  ],
};
