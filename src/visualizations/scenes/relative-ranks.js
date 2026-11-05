// Scene: Relative Ranks. Athletes are called up best score first: each one leaves the heap as a [score, bib]
// pair, and the bib (the original index) says which line of the results board gets the place. Reads a heap of
// pairs (toolkit or plain) and the one results array that changes a cell at a time, whatever their names.
import { changedIdx, itemsOf, options } from './util.js';

const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger);

/** { name, items } of a heap of [score, index] pairs (or [index, score]: told apart by the scores) */
function queueOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const isHeap = v?.$obj ? Array.isArray(v.$obj.heap) : /heap|pq/i.test(k);
    const items = isHeap ? itemsOf(v) : null;
    if (Array.isArray(items) && items.every(isPair)) return { name: k, items };
  }
  return null;
}
/** [name, index] of the one array (not a parameter) that got exactly one cell written between a and b */
function written(a, b, params, n) {
  for (const [k, v] of Object.entries(b || {})) {
    if (params.includes(k) || !Array.isArray(v) || v.length !== n || !Array.isArray(a?.[k])) continue;
    const d = changedIdx(v, a[k]);
    if (d.length === 1) return [k, d[0]];
  }
  return [null, null];
}
const nth = (p) => `${p}${[11, 12, 13].includes(p % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][p % 10] || 'th'}`;
const show = (v) => (typeof v === 'string' ? `"${v}"` : String(v));
/** the place an athlete earned: 1 + how many scored more */
const placeOf = (score, i) => 1 + score.filter((s) => s > score[i]).length;

export default {
  id: 'relative-ranks',
  metaphor: 'Call athletes up, best score first',
  caption: 'Each athlete waits in the heap as [score, bib number], best score on top. They are called up one by one, and the bib says which line of the results board gets their place: medals for the top three, then "4", "5"…',
  narrate(ctx) {
    const sName = ctx.params[0];
    const score = ctx.vars[sName];
    if (!Array.isArray(score)) return null;
    if (ctx.ret) return Array.isArray(ctx.value) ? `everyone has been called: the board reads ${ctx.value.map(show).join(', ')}` : null;
    if (!Object.keys(ctx.prev).length) return null;
    const [name, i] = written(ctx.prev, ctx.vars, ctx.params, score.length);
    if (name) {
      const v = ctx.vars[name][i];
      return `athlete ${i} (score ${score[i]}) finished ${nth(placeOf(score, i))}: line ${i} of the board gets ${show(v)}`;
    }
    const q = queueOf(ctx.vars, ctx.params);
    const p = queueOf(ctx.prev, ctx.params);
    if (!q || !p || q.name !== p.name) return null;
    if (!p.items.length && q.items.length === score.length) return `all ${score.length} athletes line up as [score, bib] pairs; the best score waits on top`;
    const gone = p.items.filter((x) => !q.items.some((y) => String(y) === String(x)));
    if (gone.length === 1 && q.items.length === p.items.length - 1) {
      const [a, b] = gone[0];
      const [s, i] = score[b] === a ? [a, b] : [b, a];
      return `the best score left, ${s}, is called up: bib ${i}`;
    }
    if (q.items.length === p.items.length + 1) return `athlete ${q.items.length - 1} lines up (${q.items.length} waiting)`;
    return null;
  },
  // just before a result is written: which line, and what?
  predict(ctx) {
    const score = ctx.vars[ctx.params[0]];
    if (!ctx.next || !Array.isArray(score) || score.length < 2) return null;
    const [name, i] = written(ctx.vars, ctx.next.vars, ctx.params, score.length);
    if (!name || written(ctx.prev, ctx.vars, ctx.params, score.length)[0]) return null;
    const v = ctx.next.vars[name][i];
    const place = placeOf(score, i);
    // the athlete just called (if the code holds the bib) must be the one written: else the board is mixed up
    const bib = ['i', 'idx', 'index', 'j', 'pos', 'id'].find((k) => Number.isInteger(ctx.vars[k]));
    if (bib && ctx.vars[bib] !== i) return null;
    const filled = ctx.vars[name].filter((x) => x !== null && x !== undefined && x !== 0 && x !== '').length;
    // ask the first call-up and the first non-medal place; the rest repeat the pattern
    if (filled !== 0 && !(place === 4 && typeof v === 'string' && !/medal/i.test(v))) return null;
    const cell = (k, x) => `${name}[${k}] = ${show(x)}`;
    const right = cell(i, v);
    const slot = place - 1 !== i ? place - 1 : (i + 1) % score.length;
    const wrong = [cell(slot, v), place <= 3 ? cell(i, String(place)) : cell(i, place), place <= 3 ? cell(slot, String(place)) : cell(slot, place)];
    return options(
      `Athlete ${i} (score ${score[i]}) was just called up, in ${nth(place)} place. What is written?`,
      right,
      wrong,
      `The board is in input order, so the result goes to line ${i} (the athlete's own index), not line ${place - 1}${place > 3 ? `; places after bronze are strings like "${place}"` : ''}.`,
    );
  },
  bugs: [
    {
      label: 'Places as numbers, not strings',
      find: 'String(place)',
      replace: 'place',
      explain: 'Places from 4 on are written as numbers (4) instead of strings ("4"), so the answer does not match.',
    },
    {
      label: 'Writes in sorted order, not by bib',
      find: 'answer[i] =',
      replace: 'answer[place - 1] =',
      explain: 'Results are written line by line in the order athletes are called, so the board loses who scored what unless the scores were already sorted.',
    },
  ],
};
