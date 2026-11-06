// Minimum Cost For Tickets: dp[d] = cheapest way to cover every trip up to calendar day d. A day without a trip
// costs nothing new (dp[d − 1]); a trip day is covered by a 1-day ticket, a 7-day pass bought on day d − 6 or a
// 30-day pass bought on day d − 29. Works with a day-indexed dp row; other shapes fall back to the generic note.
import { changedIdx, entriesOf, options, row } from './util.js';

const DP = ['dp', 'memo', 'cost', 'best', 'minCost', 'table', 'f', 'total', 'cache'];
const NAMES = ['1-day ticket', '7-day pass', '30-day pass'];
const LEN = [1, 7, 30];
const dpOf = (vars, params) => DP.filter((k) => !params.includes(k)).map((k) => [k, row(vars[k])]).find(([, r]) => r && r.length > 1 && r.every((x) => typeof x === 'number'));

/** the three ways to cover trip day d, read from the cells before it: [[total, before, price, from]…] */
function ways(dp, costs, d) {
  if (!row(costs) || costs.length < 3) return null;
  const out = LEN.map((len, k) => {
    const from = Math.max(0, d - len);
    return [dp[from] + costs[k], dp[from], costs[k], Math.max(1, d - len + 1)];
  });
  return out.every(([t]) => Number.isFinite(t)) ? out : null;
}

/** the day dp writes next (one changed cell in `after`) with what it holds: { d, v, travel, w } */
function write(ctx, dp, after) {
  const ch = after ? changedIdx(after, dp) : [];
  if (ch.length !== 1 || ch[0] === 0) return null;
  const d = ch[0];
  const days = row(ctx.input?.[0]) || [];
  const w = ways(after, ctx.input?.[1], d);
  return { d, v: after[d], travel: days.includes(d), w };
}

export default {
  id: 'minimum-cost-for-tickets',
  metaphor: 'Buying rail passes for trip days',
  caption: 'Cell d is the cheapest way to cover every trip up to calendar day d. On a trip day, a ticket or pass ending that day is laid on top of the cell where its coverage begins.',
  compare: 'dp',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `every trip is covered for ${ctx.value} at the cheapest`;
    const d = dpOf(ctx.vars, ctx.params);
    if (!d) {
      const m = DP.filter((k) => !ctx.params.includes(k)).map((k) => entriesOf(ctx.vars[k])).find(Boolean);
      const was = DP.filter((k) => !ctx.params.includes(k)).map((k) => entriesOf(ctx.prev[k])).find(Boolean) || [];
      const [k, v] = (m && m.length === was.length + 1 && m.find(([key]) => !was.some(([w]) => w === key))) || [];
      return Number.isInteger(v) ? `sub-problem ${k} solved: ${v} at the cheapest (remembered)` : null;
    }
    const before = row(ctx.prev[d[0]]);
    if (!before) return `a cell for every calendar day 0…${d[1].length - 1}: the cheapest cover for all trips up to that day`;
    const x = write(ctx, before, d[1]);
    if (!x) return null;
    if (!x.travel) return x.v === d[1][x.d - 1] ? `day ${x.d}: no trip, nothing to buy: still ${x.v}` : null;
    if (!x.w) return null;
    const best = Math.min(...x.w.map(([t]) => t));
    if (best !== x.v) return null;
    const k = x.w.findIndex(([t]) => t === best);
    const [t, b, p, from] = x.w[k];
    const span = k === 0 ? '' : ` (days ${from}–${x.d})`;
    const rest = x.w.map(([o], j) => [o, `${LEN[j]}-day ${o}`]).filter((_, j) => j !== k);
    const beats = rest.filter(([o]) => o > t).map(([, l]) => l);
    const ties = rest.filter(([o]) => o === t).map(([, l]) => l);
    const others = [beats.length && `beats ${beats.join(', ')}`, ties.length && `ties with ${ties.join(', ')}`].filter(Boolean).join('; ');
    return `day ${x.d} trip: a ${NAMES[k]}${span}: ${b} + ${p} = ${t}, ${others}`;
  },
  // before a trip day's cell is written, when one ticket is the only cheapest: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const d = dpOf(ctx.vars, ctx.params);
    const after = d && row(ctx.next.vars[d[0]]);
    const x = d && write(ctx, d[1], after);
    if (!x || !x.travel || !x.w) return null;
    const winners = x.w.map(([t], k) => (t === x.v ? k : -1)).filter((k) => k >= 0);
    if (winners.length !== 1 || Math.min(...x.w.map(([t]) => t)) !== x.v) return null;
    const k = winners[0];
    // a 1-day ticket winning is the everyday case: ask about it only on the first trip day
    if (k === 0 && x.d !== row(ctx.input?.[0])?.[0]) return null;
    const why = x.w.map(([t, b, p], j) => `${NAMES[j]}: ${b} + ${p} = ${t}`).join('; ');
    return {
      question: `Day ${x.d} is a trip day. Which ticket ending today makes the cheapest cover?`,
      options: NAMES,
      answer: k,
      explain: `${why}. The ${NAMES[k]} wins with ${x.v}.`,
    };
  },
  bugs: [
    {
      label: 'Pay on days without a trip',
      find: 'if (!travel.has(d)) { dp[d] = dp[d - 1]; continue; }',
      replace: '',
      explain: 'Every calendar day now buys a ticket, even days you stay home, so the total grows far past what the trips need.',
    },
    {
      label: 'Look up a negative day for a pass',
      find: 'dp[Math.max(0, d - 7)]',
      replace: 'dp[d - 7]',
      explain: 'For the first week, d − 7 is a negative day: dp[−3] is undefined, the pass costs NaN, and the minimum turns into NaN.',
    },
  ],
};
