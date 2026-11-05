// Gold scene: Sort an Array. Works for whatever sort the user writes: swaps (bubble, selection, quick) read as two
// cards trading places, single writes (insertion, merge) as a card put down in a slot.
import { changedIdx, options, row, sorted, swapped } from './util.js';

const arrOf = (ctx) => ctx.params[0] || 'nums';

export default {
  id: 'sort-an-array',
  metaphor: 'Cards on a table, sorted by height',
  caption: 'Each bar is a card. Two cards that light up together just traded places; in bubble sort the tallest unsorted card drifts to the right end on every pass.',
  bars: true,
  narrate(ctx) {
    const name = arrOf(ctx);
    const a = row(ctx.vars[name]);
    const b = row(ctx.prev[name]);
    if (!a || !b) return null;
    const sw = swapped(a, b);
    if (sw) {
      const [x, y] = sw;
      const order = a[x] <= a[y] ? 'now in order' : 'still out of order';
      return `swap ${name}[${x}] ↔ ${name}[${y}]: ${b[x]} and ${b[y]} trade places (${order})${sorted(a) ? ` · ${name} is sorted` : ''}`;
    }
    const d = changedIdx(a, b);
    if (d.length === 1) return `${name}[${d[0]}] = ${a[d[0]]}: a card is put down in slot ${d[0]}${sorted(a) ? ` · ${name} is sorted` : ''}`;
    return null;
  },
  // before a swap: which pair trades places next? before a single write: which card lands in that slot?
  predict(ctx) {
    const name = arrOf(ctx);
    const a = row(ctx.vars[name]);
    const after = ctx.next && row(ctx.next.vars[name]);
    if (!a || !after) return null;
    const d = changedIdx(after, a);
    if (d.length === 1 && changedIdx(a, row(ctx.prev[name])).length !== 1) {
      const k = d[0];
      const wrong = [...new Set(a.filter((x) => x !== after[k]))].slice(0, 3);
      return options(`Slot ${k} of ${name} is about to be overwritten (it holds ${a[k]}). Which card lands there?`, after[k], wrong, `The next smallest card for slot ${k} is ${after[k]}.`);
    }
    const sw = swapped(after, a);
    if (!sw || swapped(a, row(ctx.prev[name]))) return null;
    const [x, y] = sw;
    const pair = (i, j) => `${name}[${i}] ↔ ${name}[${j}]`;
    const wrong = [
      [x - 1, x],
      [y, y + 1],
      [x + 1, y + 1],
    ].filter(([i, j]) => i >= 0 && j < a.length && i < j && !(i === x && j === y));
    return options(`Which pair of cards trades places next? (${name} = [${a.join(', ')}])`, pair(x, y), wrong.map(([i, j]) => pair(i, j)), `${a[x]} at index ${x} and ${a[y]} at index ${y} are out of order, so they swap.`);
  },
  bugs: [
    {
      label: 'Inner loop stops one pair early',
      find: 'n - 1 - i',
      replace: 'n - 2 - i',
      explain: 'The last pair of every pass is never compared, so a card next to the sorted end can stay out of place.',
    },
    {
      label: 'Merge takes the bigger card first',
      find: 'nums[i] <= nums[j]',
      replace: 'nums[i] >= nums[j]',
      explain: 'The merge step picks the larger of the two front cards, so every merged run comes out in the wrong order.',
    },
  ],
};
