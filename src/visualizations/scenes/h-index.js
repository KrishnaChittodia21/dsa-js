// H-Index. Papers lined up most cited first, next to a staircase 1, 2, 3, …: h climbs one step while paper #h+1
// still reaches step h+1 (has at least h+1 citations). Works with any descending-sorted copy and an h-like counter.
import { firstInt, row } from './util.js';

const H = ['h', 'ans', 'res', 'result', 'best', 'hIndex', 'count', 'cnt'];
const desc = (a) => !!a && a.every((x, i) => i === 0 || a[i - 1] >= x);

/** the descending-sorted papers: a non-param row as long as the input (or the input itself once sorted) */
function papersOf(vars, cName) {
  const input = row(vars[cName]);
  if (!input) return null;
  const all = Object.entries(vars).filter(([k, v]) => row(v) && v.length === input.length && v.every(Number.isInteger) && desc(v));
  const found = all.find(([k]) => k !== cName) || all[0];
  return found || null;
}
const cites = (k) => `${k} citation${k === 1 ? '' : 's'}`;

export default {
  id: 'h-index',
  metaphor: 'Papers climbing a staircase',
  caption: 'Papers stand in line, most cited first. Paper #1 must reach step 1, paper #2 step 2, and so on; h is the last step that is still reached.',
  compare: 'h',
  narrate(ctx) {
    const cName = ctx.params[0];
    const p = papersOf(ctx.vars, cName);
    if (!p) return null;
    const [pName, c] = p;
    if (pName !== cName && !row(ctx.prev[pName])) return `papers lined up most cited first: [${c.join(', ')}]`;
    const [hName, h] = firstInt(ctx.vars, H);
    if (!hName) return null;
    if (h === ctx.prev[hName] + 1 && h >= 1 && h <= c.length) return `paper #${h} has ${cites(c[h - 1])} ≥ ${h}: ${h} paper${h === 1 ? '' : 's'} with at least ${h} each → h = ${h}`;
    if (/^\s*return\b/.test(ctx.src)) {
      if (h < c.length) return `paper #${h + 1} has only ${cites(c[h])} < ${h + 1}: the climb stops, h-index = ${h}`;
      return `all ${c.length} papers reached their step: h-index = ${h} (it can never be more than the number of papers)`;
    }
    return null;
  },
  // close calls only (citations within 1 of the step): does h climb one more step?
  predict(ctx) {
    if (!ctx.next) return null;
    const p = papersOf(ctx.vars, ctx.params[0]);
    const [hName, h] = firstInt(ctx.vars, H);
    if (!p || !hName) return null;
    const c = p[1];
    if (h >= c.length || c[h] > h + 2) return null;
    const nh = ctx.next.vars[hName];
    const up = nh === h + 1 ? true : ctx.next.ret && nh === h ? false : null;
    if (up === null) return null;
    return {
      question: `h = ${h}. Paper #${h + 1} has ${cites(c[h])}. Does h climb to ${h + 1}?`,
      options: [`Yes: h becomes ${h + 1}`, `No: h stays ${h}`],
      answer: up ? 0 : 1,
      explain: up ? `${c[h]} ≥ ${h + 1}, and every paper before it has even more, so ${h + 1} papers have at least ${h + 1} citations.` : `${c[h]} < ${h + 1}: only ${h} papers have ${h + 1} or more citations, and the rest are even lower.`,
    };
  },
  bugs: [
    {
      label: 'sort() without a comparator',
      find: '.sort((a, b) => b - a)',
      replace: '.sort().reverse()',
      explain: 'The default sort compares text, so 100 lands before 11 and 3 before 2: [2, 100, 11, 3] lines up as 3, 2, 11, 100 and h comes out 4 instead of 3.',
    },
    {
      label: 'Return the citations, not the count',
      find: 'return h;',
      replace: 'return h ? c[h - 1] : 0;',
      explain: 'The h-index counts papers. Returning paper #h\'s citations gives 100 for [100] instead of 1.',
    },
  ],
};
