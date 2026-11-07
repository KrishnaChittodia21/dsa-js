// Sort the People. A class photo: everyone lines up tallest first, and each name card must travel with its own
// person. Works with a sorted index list (idx / order) or a hand-written swap sort that moves names and heights
// together; other shapes (pairs, objects) fall back to the generic notes.
import { options, row, swapped } from './util.js';

const isPerm = (a, n) => !!row(a) && a.length === n && a.every((x) => Number.isInteger(x) && x >= 0 && x < n) && new Set(a).size === n;
const tallestFirst = (a, hs) => a.every((x, i) => i === 0 || hs[a[i - 1]] >= hs[x]);
/** [name, value] of the first array that holds a permutation of 0..n-1 (the line-up as person numbers) */
const orderOf = (vars, n, skip) => Object.entries(vars).find(([k, v]) => !skip.includes(k) && isPerm(v, n));

export default {
  id: 'sort-the-people',
  metaphor: 'Lining up for a class photo',
  caption: 'Each person is a position number that links a name to a height. Sorting those numbers by height, tallest first, keeps every name with its own height.',
  narrate(ctx) {
    const [nName, hName] = ctx.params;
    const names = row(ctx.vars[nName]);
    const hs = row(ctx.vars[hName]);
    if (!names || !hs || names.length !== hs.length) return null;
    const n = names.length;
    const who = (i) => `${names[i]} (${hs[i]})`;
    const ord = orderOf(ctx.vars, n, ctx.params);
    if (ord) {
      const [k, a] = ord;
      const before = row(ctx.prev[k]);
      if (!before) return `everyone gets a ticket with their place in the list: ${a.join(', ')}; the ticket links name and height`;
      if (a.some((x, i) => x !== before[i])) {
        const sw = swapped(a, before);
        if (sw && !tallestFirst(a, hs)) return `${who(a[sw[0]])} steps in front of ${who(a[sw[1]])}`;
        return `line-up by height, tallest first: ${a.map(who).join(', ')}`;
      }
      return null;
    }
    // a hand-written sort that swaps names and heights together
    const ph = row(ctx.prev[hName]);
    const pn = row(ctx.prev[nName]);
    const sh = ph && swapped(hs, ph);
    if (sh) {
      const [x, y] = sh;
      const sn = pn && swapped(names, pn);
      return sn && sn[0] === x && sn[1] === y ? `${who(x)} and ${who(y)} trade places, name cards and all` : `heights ${hs[x]} and ${hs[y]} trade places${pn ? ': the names must move with them' : ''}`;
    }
    const sn = pn && swapped(names, pn);
    if (sn && ph && hs.every((x, i) => x === ph[i])) return `the name cards follow: ${names[sn[0]]} and ${names[sn[1]]} trade places too`;
    return null;
  },
  // before the line-up is sorted: who stands at the front?
  predict(ctx) {
    if (!ctx.next) return null;
    const [nName, hName] = ctx.params;
    const names = row(ctx.vars[nName]);
    const hs = row(ctx.vars[hName]);
    if (!names || !hs || names.length !== hs.length || names.length < 3) return null;
    const n = names.length;
    const ord = orderOf(ctx.vars, n, ctx.params);
    if (!ord) return null;
    const after = row(ctx.next.vars[ord[0]]);
    if (!isPerm(after, n) || after.every((x, i) => x === ord[1][i])) return null;
    // only a re-order that finishes the line-up in one step (a built-in sort)
    if (!tallestFirst(after, hs)) return null;
    const front = after[0];
    const wrong = names.filter((_, i) => i !== front && names[i] !== names[front]);
    return options(`The line-up is ${names.map((x, i) => `${x} (${hs[i]})`).join(', ')}. After sorting tallest first, who stands at the front?`, names[front], wrong, `${names[front]} is the tallest at ${hs[front]}, so their ticket (${front}) moves to the front.`);
  },
  bugs: [
    {
      label: 'Compare heights as text',
      find: 'heights[j] - heights[i]',
      replace: 'String(heights[j]).localeCompare(String(heights[i]))',
      explain: 'As text, "9" comes after "100000" (it starts with a bigger digit), so x (height 9) stands in front of y (100000).',
    },
    {
      label: 'Shortest first',
      find: 'heights[j] - heights[i]',
      replace: 'heights[i] - heights[j]',
      explain: 'The subtraction is the wrong way round, so the line-up starts with the shortest person: [John, Emma, Mary] instead of [Mary, Emma, John].',
    },
  ],
};
