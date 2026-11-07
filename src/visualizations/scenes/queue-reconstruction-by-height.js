// Queue Reconstruction by Height: seat the tallest people first. Everyone already in line is at least as tall as the
// newcomer, so a person with k taller-or-equal people in front simply steps in at spot k; shorter people who come
// later are invisible to them.
import { options, row } from './util.js';

const isPair = (v) => !!row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

/** the index where `after` has one person more than `before` (everyone else in the same order), else -1 */
function insertedAt(after, before) {
  if (!after || !before || after.length !== before.length + 1) return -1;
  let j = 0;
  while (j < before.length && same(after[j], before[j])) j++;
  for (let t = j; t < before.length; t++) if (!same(after[t + 1], before[t])) return -1;
  return j;
}

/** non-parameter lists of people, by name */
const lists = (vars, params) => Object.entries(vars).filter(([k, v]) => !params.includes(k) && listOf(v));
const tallFirst = (l) => l.length > 1 && l.every((p, i) => i === 0 || l[i - 1][0] > p[0] || (l[i - 1][0] === p[0] && l[i - 1][1] <= p[1]));

/** [name, index, person] of the line that just gained one person between two snapshots */
function growth(vars, before, params) {
  for (const [k, v] of lists(vars, params)) {
    const j = insertedAt(v, listOf(before?.[k]));
    if (j >= 0) return [k, j, v[j]];
  }
  return null;
}

export default {
  id: 'queue-reconstruction-by-height',
  metaphor: 'Tallest people line up first',
  caption: 'People are seated tallest first. Everyone already standing is at least as tall, so a person who needs k such people in front steps in at spot k; shorter people added later do not change that count.',
  narrate(ctx) {
    const { params } = ctx;
    const g = growth(ctx.vars, ctx.prev, params);
    for (const [k, v] of g ? [] : lists(ctx.vars, params)) {
      const was = listOf(ctx.prev[k]);
      if (v.length === listOf(ctx.vars[params[0]])?.length && tallFirst(v) && (!was || v.some((p, i) => !same(p, was[i])))) return `lined up tallest first (ties: smaller k first): ${v.map(show).join(' ')}`;
    }
    if (!g) return null;
    const [, j, p] = g;
    const line = ctx.vars[g[0]];
    const behind = line.slice(j + 1);
    const taller = behind.length && behind.every((q) => q[0] > p[0]);
    return `${show(p)} steps in at spot ${j}: exactly ${p[1]} taller-or-equal in front${taller ? `; the ${behind.length === 1 ? 'one behind is' : `${behind.length} behind are`} taller, so their counts stay right` : ''}`;
  },
  // before someone steps into the line: at which spot?
  predict(ctx) {
    if (!ctx.next) return null;
    const g = growth(ctx.next.vars, ctx.vars, ctx.params);
    if (!g) return null;
    const [k, j, p] = g;
    const line = listOf(ctx.vars[k]);
    if (!line || !line.length) return null;
    // stepping in at the very back behind strictly taller people is no puzzle
    if (j === line.length && line.every((q) => q[0] > p[0])) return null;
    const spots = line.length + 1;
    const wrong = [0, spots - 1, Math.min(spots - 1, j + 1), Math.max(0, j - 1)].filter((x) => x !== j);
    return options(
      `${show(p)} (height ${p[0]}, k = ${p[1]}) joins the line ${line.map(show).join(' ')}. At which spot (0 = front)?`,
      j,
      wrong,
      `Everyone already in line is at least ${p[0]} tall, so spot ${j} puts exactly ${p[1]} of them in front.`,
    );
  },
  bugs: [
    {
      label: 'Break height ties by larger k first',
      find: 'a[1] - b[1]',
      replace: 'b[1] - a[1]',
      explain: 'Among equal heights, [5,2] is seated before [5,0]; then [5,0] steps in at the front and pushes [5,2] to spot 1 with only one equal person ahead.',
    },
    {
      label: 'Push to the back instead of inserting at k',
      find: 'queue.splice(person[1], 0, person)',
      replace: 'queue.push(person)',
      explain: 'Everyone joins at the end, so the line is just sorted by height and nobody\'s k is respected.',
    },
  ],
};
