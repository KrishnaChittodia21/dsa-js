// Two Sum II (sorted, opposite ends). Two people walk in from both ends of a sorted shelf: a total that is too small
// drops the smallest item, a total that is too big drops the largest. Works with l/r, left/right, i/j, lo/hi.
import { options, row } from './util.js';

const PAIRS = [
  ['l', 'r'],
  ['left', 'right'],
  ['i', 'j'],
  ['lo', 'hi'],
  ['start', 'end'],
];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const SUM = ['sum', 's', 'total', 'cur', 'curr'];
const isReturn = (ctx) => /\breturn\b/.test(ctx.lines[ctx.next.line - 1] || '');

export default {
  id: 'two-sum-ii-input-array-is-sorted',
  metaphor: 'Squeeze a sorted shelf from both ends',
  caption: 'The numbers are sorted, so the left end is the smallest and the right end the largest still in play. Too small a total drops the left one, too big drops the right one; the bracket only shrinks.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  narrate(ctx) {
    const [aName, tName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const t = ctx.vars[tName];
    const pair = pairOf(ctx.vars);
    if (!a || !pair || !Number.isInteger(t)) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const pl = ctx.prev[lName];
    const pr = ctx.prev[rName];
    // no verdict when the total appears: the prediction asked next is "what happens?"
    const sName = SUM.find((k) => Number.isInteger(ctx.vars[k]) && k !== lName && k !== rName);
    if (sName && (ctx.vars[sName] !== ctx.prev[sName] || l !== pl || r !== pr) && ctx.vars[sName] === a[l] + a[r]) {
      return `${a[l]} + ${a[r]} = ${a[l] + a[r]}, the target is ${t}`;
    }
    if (Number.isInteger(pl) && l === pl + 1 && r === pr && a[pl] !== undefined) {
      return `${a[pl]} + ${a[r]} = ${a[pl] + a[r]} < ${t}: ${a[pl]} is too small even with the largest partner, so it is dropped`;
    }
    if (Number.isInteger(pr) && r === pr - 1 && l === pl && a[pr] !== undefined) {
      return `${a[l]} + ${a[pr]} = ${a[l] + a[pr]} > ${t}: ${a[pr]} is too big even with the smallest partner, so it is dropped`;
    }
    return null;
  },
  // before a move: drop the left, drop the right, or found?
  predict(ctx) {
    const [aName, tName] = ctx.params;
    const a = row(ctx.vars[aName]);
    const t = ctx.vars[tName];
    const pair = pairOf(ctx.vars);
    if (!a || !pair || !ctx.next || !Number.isInteger(t)) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    if (!(l >= 0 && l < r && r < a.length)) return null;
    const nl = ctx.next.vars[lName];
    const nr = ctx.next.vars[rName];
    const sum = a[l] + a[r];
    const what = nl === l + 1 && nr === r && sum < t ? 'left' : nr === r - 1 && nl === l && sum > t ? 'right' : nl === l && nr === r && sum === t && isReturn(ctx) ? 'found' : null;
    // ask at each pointer's first move and at the find, not at every repeat of the same move
    if (!what || (what === 'left' && l > 0) || (what === 'right' && r < a.length - 1)) return null;
    const opts = [`Drop ${a[l]} (${lName} moves right)`, `Drop ${a[r]} (${rName} moves left)`, `Found: return [${l + 1}, ${r + 1}]`];
    const pick = { left: 0, right: 1, found: 2 }[what];
    return options(
      `${aName}[${l}] = ${a[l]} and ${aName}[${r}] = ${a[r]}, target ${t}. What happens next?`,
      opts[pick],
      opts.filter((_, k) => k !== pick),
      what === 'found' ? `${a[l]} + ${a[r]} = ${t}: the pair is found, returned 1-based.` : what === 'left' ? `${sum} < ${t}: a bigger total needs a bigger left number.` : `${sum} > ${t}: a smaller total needs a smaller right number.`,
    );
  },
  bugs: [
    {
      label: 'Return 0-based indices',
      find: 'return [l + 1, r + 1]',
      replace: 'return [l, r]',
      explain: 'The shelf is numbered from 1 in this problem, so [0, 1] is reported where [1, 2] is expected.',
    },
    {
      label: 'Move the wrong end when the total is too small',
      find: 'if (sum < target) l++;',
      replace: 'if (sum > target) l++;',
      explain: 'A too-big total drops the small left number and makes it even bigger; the right pair is walked past and never found.',
    },
  ],
};
