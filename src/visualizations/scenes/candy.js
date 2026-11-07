// Candy: children in a line, each holding a rating card. A child rated higher than a neighbour must hold more candy
// than that neighbour. Works with one candy array (two sweeps) or separate left / right arrays.
import { changedIdx, options, row } from './util.js';

const n = (k) => `${k} cand${k === 1 ? 'y' : 'ies'}`;
const TOTAL = ['total', 'sum', 'ans', 'res', 'result', 'count'];

/** [name, candies] arrays as long as ratings (not ratings itself) that changed between prev and vars, or the first one */
function candiesOf(vars, prev, rName) {
  const r = row(vars[rName]);
  if (!r) return null;
  const all = Object.entries(vars).filter(([k, v]) => k !== rName && row(v) && v.length === r.length && v.every(Number.isInteger));
  return all.find(([k, v]) => changedIdx(v, row(prev[k]) || []).length) || all[0] || null;
}

/** why child k holds v candies: the neighbour whose count it tops */
function because(r, c, k, v) {
  if (k > 0 && r[k] > r[k - 1] && v === c[k - 1] + 1) return `outranks the left neighbour (rating ${r[k - 1]}, ${n(c[k - 1])}) → ${v}`;
  if (k < r.length - 1 && r[k] > r[k + 1] && v === c[k + 1] + 1) return `outranks the right neighbour (rating ${r[k + 1]}, ${n(c[k + 1])}) → ${v}`;
  return null;
}

export default {
  id: 'candy',
  metaphor: 'Handing out candy along a line',
  caption: 'Each cell is a child with their candy count; the rating card is above. Pass 1 walks right so each child tops a lower-rated left neighbour; pass 2 walks back so they also top a lower-rated right neighbour without losing what pass 1 gave.',
  narrate(ctx) {
    const rName = ctx.params[0];
    const r = row(ctx.vars[rName]);
    const found = candiesOf(ctx.vars, ctx.prev, rName);
    if (!r || !found) return null;
    const [name, c] = found;
    const before = row(ctx.prev[name]);
    if (!before) return c.every((x) => x === 1) ? `every child starts with 1 candy (${r.length} children)` : null;
    const d = changedIdx(c, before);
    if (d.length === 1) {
      const k = d[0];
      const why = because(r, c, k, c[k]);
      return why ? `child ${k} (rating ${r[k]}) ${why}` : null;
    }
    const tName = TOTAL.find((t) => Number.isInteger(ctx.vars[t]) && ctx.prev[t] !== ctx.vars[t]);
    return tName && ctx.vars[tName] > 0 ? `${n(ctx.vars[tName])} handed out so far` : null;
  },
  // before a child's candy count changes: how many will they hold?
  predict(ctx) {
    if (!ctx.next) return null;
    const rName = ctx.params[0];
    const r = row(ctx.vars[rName]);
    const found = candiesOf(ctx.next.vars, ctx.vars, rName);
    if (!r || !found) return null;
    const [name, after] = found;
    const c = row(ctx.vars[name]);
    if (!c) return null;
    const d = changedIdx(after, c);
    if (d.length !== 1) return null;
    const k = d[0];
    const v = after[k];
    const why = because(r, after, k, v);
    return options(`Child ${k} (rating ${r[k]}) holds ${n(c[k])} now. How many after this step?`, v, [c[k], v + 1, v - 1].filter((w) => w >= 1 && w !== v), why ? `Child ${k} ${why}.` : `A higher rating than a neighbour means one more candy than that neighbour.`);
  },
  bugs: [
    {
      label: 'Only one pass (left to right)',
      find: 'if (ratings[i] > ratings[i + 1])',
      replace: 'if (false)',
      explain: 'Nobody checks the right neighbour, so a child rated higher than the next one (like a falling run) can hold the same or less.',
    },
    {
      label: 'Pass 2 overwrites instead of taking the max',
      find: 'give[i] = Math.max(give[i], give[i + 1] + 1)',
      replace: 'give[i] = give[i + 1] + 1',
      explain: 'A peak child earned a big count from the left in pass 1; overwriting it with right-neighbour + 1 can drop it below the left neighbour.',
    },
  ],
};
