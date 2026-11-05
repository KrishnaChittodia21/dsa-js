// Can Place Flowers: a row of pots where flowers need elbow room. Walk left to right and plant in the first empty
// pot whose neighbours are empty too (the ends count as empty); planting early never blocks a better choice.
import { changedIdx, row } from './util.js';

const IDX = ['i', 'j', 'k', 'idx', 'pos', 'p'];
const COUNT = ['planted', 'count', 'cnt', 'placed', 'c', 'flowers', 'added', 'total'];
const is01 = (v) => !!row(v) && v.every((x) => x === 0 || x === 1);

/** [name, row] of the bed being planted: a 0/1 copy, else the parameter itself */
function bedOf(vars, params) {
  const [p] = params;
  const copy = Object.keys(vars || {}).find((k) => k !== p && is01(vars[k]) && is01(vars[p]) && vars[k].length >= vars[p].length);
  if (copy) return [copy, vars[copy]];
  return is01(vars?.[p]) ? [p, vars[p]] : [null, null];
}
const idxOf = (vars) => IDX.find((n) => Number.isInteger(vars?.[n]));
const side = (bed, j) => (j < 0 || j >= bed.length ? 'the edge' : bed[j] ? 'a flower' : 'empty');

export default {
  id: 'can-place-flowers',
  metaphor: 'Pots in a row needing elbow room',
  caption: 'Each cell is a pot: 1 holds a flower, 0 is empty. A flower may go in an empty pot only when both neighbours are empty (outside the row counts as empty). Plant greedily from the left.',
  narrate(ctx) {
    const [, nName] = ctx.params;
    const [bn, bed] = bedOf(ctx.vars, ctx.params);
    if (!bn) return null;
    if (!ctx.next && typeof ctx.result === 'boolean') return ctx.result ? 'enough flowers fit: true' : 'not enough pots with elbow room: false';
    const was = row(ctx.prev[bn]);
    const d = changedIdx(bed, was);
    if (d.length === 1 && bed[d[0]] === 1) {
      const k = d[0];
      return `pot ${k} is empty and so are its neighbours (${side(bed, k - 1)}, ${side(bed, k + 1)}): plant a flower`;
    }
    const n = ctx.vars[nName];
    if (nName in ctx.prev && Number.isInteger(n) && n === ctx.prev[nName] - 1) return `one flower planted: ${n} still to plant`;
    const cn = COUNT.find((k) => k !== nName && Number.isInteger(ctx.vars[k]) && ctx.vars[k] === ctx.prev[k] + 1);
    if (cn) return `${ctx.vars[cn]} planted so far, ${Number.isInteger(n) ? n : '?'} wanted`;
    const ix = idxOf(ctx.vars);
    if (ix && ctx.vars[ix] !== ctx.prev[ix] && bed[ctx.vars[ix]] !== undefined) {
      const i = ctx.vars[ix];
      return bed[i] ? `pot ${i} already holds a flower` : `pot ${i} is empty; left: ${side(bed, i - 1)}, right: ${side(bed, i + 1)}`;
    }
    return null;
  },
  // right before the walk leaves a pot (or plants in it): plant here?
  predict(ctx) {
    if (!ctx.next) return null;
    const [bn, bed] = bedOf(ctx.vars, ctx.params);
    const ix = idxOf(ctx.vars);
    if (!bn || !ix) return null;
    const i = ctx.vars[ix];
    if (bed[i] !== 0) return null;
    const after = row(ctx.next.vars[bn]);
    let ans;
    if (after && after[i] === 1) ans = 0;
    else if (after && after[i] === 0 && (ctx.next.ret || (Number.isInteger(ctx.next.vars[ix]) && ctx.next.vars[ix] !== i))) ans = 1;
    else return null;
    const ok = (i === 0 || bed[i - 1] === 0) && (i === bed.length - 1 || bed[i + 1] === 0);
    return {
      question: `Pot ${i} is empty; left: ${side(bed, i - 1)}, right: ${side(bed, i + 1)}. Plant a flower here?`,
      options: ['Yes, plant it', 'No, move on'],
      answer: ans,
      explain: ans === 0 ? (ok ? 'Both neighbours are empty (or the edge), and planting as early as possible never costs a flower later.' : 'Their code plants here although a neighbour holds a flower.') : ok ? 'Their code moves on: enough flowers are already planted, so the walk stops.' : 'A neighbour already holds a flower, so this pot has no elbow room.',
    };
  },
  bugs: [
    {
      label: 'Forget to put the flower in the bed',
      find: 'bed[i] = 1;',
      replace: '',
      explain: 'The next pot still sees an empty left neighbour, so [0,0,0] counts 3 flowers side by side instead of 2.',
    },
    {
      label: 'The left edge is not treated as empty',
      find: 'i === 0 || bed[i - 1] === 0',
      replace: 'i > 0 && bed[i - 1] === 0',
      explain: 'Pot 0 has no left neighbour, which should count as empty; now it can never be planted, so [0] with n = 1 says false.',
    },
  ],
};
