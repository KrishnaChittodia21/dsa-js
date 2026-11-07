// Relative Sort Array (counting sort). A shopkeeper counts the stock, then fills the shelf in the order of the
// customer's list (arr2); whatever is not on the list goes at the end, smallest first.
// Works with a count array (any length), a Map or a plain-object counter, and an output array (out / res / ans …).
import { entriesOf, options, row } from './util.js';

const OUT = ['out', 'res', 'result', 'ans', 'answer', 'output', 'sorted', 'arr', 'list'];

const outOf = (vars) => OUT.find((k) => row(vars[k]));
const countIn = (vars) => Object.entries(vars).find(([k, v]) => /count|cnt|freq|tally|map|^c$|^m$/i.test(k) && v && typeof v === 'object');
/** how many copies of x are still in the counter, or undefined */
function left(c, x) {
  if (row(c)) return c[x];
  if (c && c.$array) return x < c.$array.length ? c.$array[x] : undefined;
  const e = entriesOf(c);
  const hit = e && e.find(([k]) => String(k) === String(x));
  return e ? (hit ? hit[1] : 0) : undefined;
}

export default {
  id: 'relative-sort-array',
  metaphor: 'Filling a shelf from a shopping list',
  caption: 'First every item in arr1 is counted. Then the shelf (the output) is filled in the order of the list arr2, all copies at once; items not on the list go last, smallest first.',
  narrate(ctx) {
    const [, a2] = ctx.params;
    const list = row(ctx.vars[a2]);
    const oName = outOf(ctx.vars);
    const out = oName && ctx.vars[oName];
    const before = oName && row(ctx.prev[oName]);
    if (list && out && before && out.length === before.length + 1) {
      const x = out[out.length - 1];
      const pos = list.indexOf(x);
      return pos >= 0
        ? `put ${x} on the shelf: it is item ${pos + 1} on the list (shelf: [${out.join(', ')}])`
        : `the list is done; leftover ${x} goes next, smallest first (shelf: [${out.join(', ')}])`;
    }
    const cnt = countIn(ctx.vars);
    if (!cnt) return null;
    const v = ctx.vars.v ?? ctx.vars.x ?? ctx.vars.num ?? ctx.vars.n;
    if (!Number.isInteger(v)) return null;
    const now = left(cnt[1], v);
    const was = cnt[0] in ctx.prev ? left(ctx.prev[cnt[0]], v) : undefined;
    if (!oName && Number.isInteger(now) && now === (was ?? 0) + 1) return `count one more ${v} in stock (${now} so far)`;
    if (oName && Number.isInteger(now) && Number.isInteger(was) && now === was - 1) return now ? `${now} more ${v}${now > 1 ? 's' : ''} left in stock` : `no ${v} left in stock`;
    return null;
  },
  // before the shelf gets a new kind of item: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const [a1, a2] = ctx.params;
    const list = row(ctx.vars[a2]);
    const all = row(ctx.vars[a1]);
    const oName = outOf(ctx.vars);
    const out = oName && ctx.vars[oName];
    const after = oName && row(ctx.next.vars[oName]);
    if (!list || !all || !out || !out.length || !after || after.length !== out.length + 1) return null;
    const x = after[after.length - 1];
    if (x === out[out.length - 1]) return null;
    const placed = (y) => out.filter((t) => t === y).length >= all.filter((t) => t === y).length;
    const wrong = [...new Set(all.filter((y) => y !== x && !placed(y)))].sort((p, q) => p - q).slice(0, 3);
    const onList = list.includes(x);
    // ask at the first two list changes and at the first leftover, not at every item
    const kinds = new Set(out).size;
    if (onList ? kinds > 2 : !out.every((t) => list.includes(t))) return null;
    return options(
      `The shelf is [${out.join(', ')}] and the list is [${list.join(', ')}]. Which item goes on the shelf next?`,
      x,
      wrong,
      onList ? `All copies of ${out[out.length - 1]} are placed; ${x} is the next item on the list that is still in stock.` : `Every item on the list is placed; leftovers go smallest first, and ${x} is the smallest still in stock.`,
    );
  },
  bugs: [
    {
      label: 'Only one copy of each listed item',
      find: 'while (count[v] > 0) { out.push(v); count[v]--; }',
      replace: 'if (count[v] > 0) { out.push(v); count[v]--; }',
      explain: 'Only one 2 is shelved in list order; the other two 2s are left in stock and land among the leftovers at the end.',
    },
    {
      label: 'Leftover scan stops at 999',
      find: 'v <= 1000',
      replace: 'v < 1000',
      explain: 'The value 1000 is allowed, but the leftover scan never reaches it, so every 1000 that is not on the list goes missing.',
    },
  ],
};
