// Two City Scheduling (sort by a − b, first half to A). Everyone lines up by how much cheaper city A is for them;
// the first n fly to A, the rest to B. Works with a sorted copy (any name) or costs sorted in place, any total name.
import { firstInt } from './util.js';

const TOTAL = ['total', 'sum', 'cost', 'res', 'ans', 'result', 'answer', 'minCost', 'min'];
const IDX = ['i', 'j', 'k', 'idx', 'p'];
const pairs = (v) => Array.isArray(v) && v.length > 0 && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
const byDiff = (v) => v.every((p, i) => i === 0 || v[i - 1][0] - v[i - 1][1] <= p[0] - p[1]);
// the queue of people sorted by a − b: a copy (any name) or the input itself once sorted
function lineOf(vars, cName) {
  const c = vars[cName];
  if (!pairs(c)) return null;
  const copy = Object.entries(vars).find(([k, v]) => k !== cName && pairs(v) && v.length === c.length && byDiff(v));
  if (copy) return copy;
  return byDiff(c) ? [cName, c] : null;
}
const totalOf = (vars, params) => TOTAL.find((k) => !params.includes(k) && Number.isFinite(vars[k]));
const fmt = (p) => `[${p[0]}, ${p[1]}]`;
const saves = (p) => (p[0] < p[1] ? `A is ${p[1] - p[0]} cheaper` : p[0] > p[1] ? `B is ${p[0] - p[1]} cheaper` : 'same price');

export default {
  id: 'two-city-scheduling',
  metaphor: 'A queue by how much A saves',
  caption: 'Each person is [price to A, price to B]. They line up by a − b, so whoever saves most by flying to A is first; the first half of the queue flies to A, the second half to B.',
  compare: 'total',
  narrate(ctx) {
    const [cName] = ctx.params;
    const line = lineOf(ctx.vars, cName);
    if (!line) return null;
    const l = line[1];
    const n = l.length / 2;
    const had = lineOf(ctx.prev, cName);
    if (!had) {
      return `everyone lines up by a − b (A's price minus B's): ${l.map((p) => p[0] - p[1]).join(', ')} · the first ${n} fly to A`;
    }
    const t = totalOf(ctx.vars, ctx.params);
    const [, i] = firstInt(ctx.vars, IDX);
    if (!t || !Number.isFinite(ctx.prev[t]) || ctx.vars[t] === ctx.prev[t]) return null;
    const delta = ctx.vars[t] - ctx.prev[t];
    const p = l[i];
    if (!p) return null;
    const half = i < n ? `among the first ${n}` : `in the second half`;
    if (delta === p[0] && p[0] === p[1]) return `person ${fmt(p)} pays ${delta} in either city · total ${ctx.vars[t]}`;
    if (delta === p[0]) return `person ${fmt(p)} is #${i + 1} in line, ${half}: flies to A for ${p[0]} (${saves(p)}) · total ${ctx.vars[t]}`;
    if (delta === p[1]) return `person ${fmt(p)} is #${i + 1} in line, ${half}: flies to B for ${p[1]} (${saves(p)}) · total ${ctx.vars[t]}`;
    return null;
  },
  // before a person is booked: which city? (asked at the A/B boundary and whenever someone must take the pricier city)
  predict(ctx) {
    const [cName] = ctx.params;
    if (!ctx.next) return null;
    const line = lineOf(ctx.vars, cName);
    const t = totalOf(ctx.vars, ctx.params);
    if (!line || !t || !Number.isFinite(ctx.next.vars[t])) return null;
    const l = line[1];
    const n = l.length / 2;
    const [iName, i] = firstInt(ctx.next.vars, IDX);
    if (!iName || i === ctx.vars[iName]) return null; // the person must arrive in the next step
    const p = l[i];
    const delta = ctx.next.vars[t] - ctx.vars[t];
    if (!p || p[0] === p[1]) return null;
    const city = delta === p[0] ? 'A' : delta === p[1] ? 'B' : null;
    if (!city) return null;
    const pricier = (city === 'A') === p[0] > p[1];
    if (!pricier && i !== n - 1 && i !== n) return null;
    const optA = `A (pays ${p[0]})`;
    const optB = `B (pays ${p[1]})`;
    return {
      question: `Next: person ${fmt(p)}, #${i + 1} of ${l.length} in the queue (a − b = ${p[0] - p[1]}). Which city?`,
      options: [optA, optB],
      answer: city === 'A' ? 0 : 1,
      explain: `${i < n ? `The first ${n} in the queue` : `Only the first ${n} fly to A; everyone after them`} ${i < n ? 'fly to A' : 'flies to B'}${pricier ? `, even though ${city === 'A' ? 'B' : 'A'} is cheaper for this person: each city needs exactly ${n}` : ''}.`,
    };
  },
  bugs: [
    {
      label: 'Sort by the A price only',
      find: '(x[0] - x[1]) - (y[0] - y[1])',
      replace: 'x[0] - y[0]',
      explain: 'Someone with a cheap A ticket but an even cheaper B ticket gets sent to A: [[10,1],[20,100],[30,200],[5,1]] costs more than 52.',
    },
    {
      label: 'Everyone takes their cheaper city',
      find: 'i < n ? sorted[i][0] : sorted[i][1]',
      replace: 'Math.min(sorted[i][0], sorted[i][1])',
      explain: 'Ignoring "exactly n per city": when everyone prefers A, nobody flies to B and the total is too low to be legal.',
    },
  ],
};
