// Meeting Rooms: one person's diary. Sorted by start time, a clash can only happen between neighbours: does each
// meeting start before the one just before it has finished?
import { row } from './util.js';

const IDX = ['i', 'k', 'j', 'idx'];
const isPair = (v) => row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;

/** the sorted diary: a sorted copy, else the parameter (maybe sorted in place) */
function diaryOf(vars, params) {
  const k = Object.keys(vars).find((n) => n !== params[0] && listOf(vars[n]) && vars[n].length > 1);
  return listOf(vars[k]) || listOf(vars[params[0]]);
}

/** [earlier, later] meetings being compared now: list[i-1] vs list[i] (or list[i] vs list[i+1]) */
function pairAt(vars, ctx) {
  const list = diaryOf(vars, ctx.params);
  const n = IDX.find((x) => Number.isInteger(vars[x]));
  if (!list || !n) return null;
  const code = ctx.lines.join('\n');
  const i = vars[n];
  const lo = new RegExp(`\\[\\s*${n}\\s*-\\s*1\\s*\\]`).test(code) ? i - 1 : new RegExp(`\\[\\s*${n}\\s*\\+\\s*1\\s*\\]`).test(code) ? i : null;
  return lo !== null && list[lo] && list[lo + 1] ? [list[lo], list[lo + 1]] : null;
}

export default {
  id: 'meeting-rooms',
  metaphor: 'One diary, one meeting at a time',
  caption: 'The meetings are laid out by start time. Only neighbours can clash: if a meeting starts before the one just before it has ended, she cannot be in both.',
  narrate(ctx) {
    const [p] = ctx.params;
    const list = diaryOf(ctx.vars, ctx.params);
    const was = diaryOf(ctx.prev, ctx.params);
    const copied = Object.keys(ctx.vars).some((k) => k !== p && listOf(ctx.vars[k]) && !(k in ctx.prev));
    const moved = was && list && was.some((x, i) => x[0] !== list[i][0] || x[1] !== list[i][1]);
    if (list && list.length > 1 && (copied || moved)) return `the diary sorted by start time: ${list.map(show).join(' ')}`;
    const pr = pairAt(ctx.vars, ctx);
    if (!pr || JSON.stringify(pr) === JSON.stringify(pairAt(ctx.prev, ctx))) return null;
    const [a, b] = pr;
    if (b[0] < a[1]) return `${show(b)} starts at ${b[0]}, before ${show(a)} ends at ${a[1]}: a clash, she cannot attend both`;
    if (b[0] === a[1]) return `${show(b)} starts at ${b[0]}, exactly when ${show(a)} ends: back to back is fine`;
    return `${show(b)} starts at ${b[0]}, after ${show(a)} ended at ${a[1]}: no clash, on to the next one`;
  },
  // before each neighbour check: clash or not?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const pr = pairAt(nx.vars, ctx);
    if (!pr || JSON.stringify(pr) === JSON.stringify(pairAt(ctx.vars, ctx))) return null;
    const stops = nx.ret && /return\s+false/.test(ctx.lines[nx.line - 1] || '');
    if (nx.ret && !stops) return null;
    const [a, b] = pr;
    return {
      question: `Next check: ${show(a)}, then ${show(b)}. Can she go from one to the other?`,
      options: ['Yes: no clash, keep checking', 'No: they clash, the answer is false'],
      answer: stops ? 1 : 0,
      explain: stops ? `${b[0]} < ${a[1]}: the second meeting starts before the first one ends.` : `${b[0]} ≥ ${a[1]}: the first meeting is over by the time the second one starts (back to back is fine).`,
    };
  },
  bugs: [
    {
      label: 'Use <= : back-to-back counts as a clash',
      find: 'sorted[i][0] < sorted[i - 1][1]',
      replace: 'sorted[i][0] <= sorted[i - 1][1]',
      explain: '[1,5] then [5,8] is fine (one ends as the other starts), but with <= it is reported as a clash.',
    },
    {
      label: 'Sort without a comparator',
      find: '.sort((a, b) => a[0] - b[0])',
      replace: '.sort()',
      explain: 'The default sort compares text, so [100,200] lands before [20,99] and a false clash shows up between the wrong neighbours.',
    },
  ],
};
