// Cheapest Flights Within K Stops (Bellman-Ford, k + 1 rounds). A fare board per city: each round lets every
// route use one more flight, reading only last round's board. Infinity is recorded as null (shown as ∞).
// Works with price / dist / cost / next / temp / tmp boards and u,v,w / from,to,cost / a,b,c flight names.
import { changedIdx, firstInt, options, row } from './util.js';

const BOARD = /price|dist|cost|fare|next|temp|tmp|copy|cur|new|best/i;
const ROUND = ['round', 'r', 'iter', 'step', 'stops', 'stop', 'i'];
const fare = (x) => (x === null || x === undefined || x === Infinity ? '∞' : x);

/** [name, index] of the one board cell that changed between two snapshots */
function written(vars, prev) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!BOARD.test(k) || !row(v) || !row(prev?.[k]) || v.length !== prev[k].length) continue;
    const d = changedIdx(v, prev[k]);
    if (d.length === 1) return [k, d[0]];
  }
  return [];
}
/** the flight being tried: [from, to, cost] from common names, or null */
function flight(vars) {
  const [, u] = firstInt(vars, ['u', 'from', 'a', 's', 'x']);
  const [, v] = firstInt(vars, ['v', 'to', 'b', 'd', 'y']);
  const [, w] = firstInt(vars, ['w', 'cost', 'price', 'c', 'p', 'wt', 'weight']);
  return u !== undefined && v !== undefined && w !== undefined ? [u, v, w] : null;
}

export default {
  id: 'cheapest-flights-within-k-stops',
  metaphor: 'A fare board updated each round',
  caption: 'Each cell is the cheapest known fare to a city. Every round allows one more flight and reads only last round’s fares, so after k + 1 rounds the board respects the stop limit.',
  narrate(ctx) {
    const [, , , dName, kName] = ctx.params;
    const [bName, at] = written(ctx.vars, ctx.prev);
    const f = flight(ctx.vars);
    if (bName && f && f[1] === at) {
      const [u, v, w] = f;
      return `fly ${u} → ${v} for ${w}: ${ctx.vars[bName][at] - w} + ${w} = ${ctx.vars[bName][at]} beats ${fare(ctx.prev[bName][at])}, so city ${v} now costs ${ctx.vars[bName][at]}`;
    }
    // a whole board replaced by the round's copy: "price = next"
    const swap = Object.keys(ctx.vars).find((k) => BOARD.test(k) && row(ctx.vars[k]) && row(ctx.prev[k]) && changedIdx(ctx.vars[k], ctx.prev[k]).length && Object.keys(ctx.vars).some((o) => o !== k && row(ctx.vars[o]) && JSON.stringify(ctx.vars[o]) === JSON.stringify(ctx.vars[k])));
    if (swap) return `round over: this round's fares become the board [${ctx.vars[swap].map(fare).join(', ')}]`;
    if (bName && ctx.vars[bName][at] === 0) return `start at city ${at}: it costs 0, every other city ∞ for now`;
    const [rName, r] = firstInt(ctx.vars, ROUND);
    if (rName && r !== ctx.prev[rName] && Object.keys(ctx.vars).some((k) => BOARD.test(k) && row(ctx.vars[k]))) {
      const k = ctx.vars[kName];
      return `round ${r + 1}${Number.isInteger(k) ? ` of ${k + 1}` : ''}: routes may now use up to ${r + 1} flight${r ? 's' : ''} (${r} stop${r === 1 ? '' : 's'})`;
    }
    if (/return/.test(ctx.src) && !ctx.next) {
      const board = Object.keys(ctx.vars).find((k) => BOARD.test(k) && row(ctx.vars[k]));
      const d = ctx.vars[dName];
      if (board && Number.isInteger(d)) {
        const x = ctx.vars[board][d];
        return x === null || x === undefined ? `city ${d} was never reached within the stop limit: -1` : `cheapest fare to city ${d} within the stop limit: ${x}`;
      }
    }
    return null;
  },
  // before a cheaper fare is written: what does the city cost now?
  predict(ctx) {
    if (!ctx.next) return null;
    const [bName, at] = written(ctx.next.vars, ctx.vars);
    const f = flight(ctx.next.vars);
    if (!bName || !f || f[1] !== at) return null;
    const [u, v, w] = f;
    const right = ctx.next.vars[bName][at];
    if (!Number.isInteger(right)) return null;
    const wrong = [fare(ctx.vars[bName][at]), w, right + w, right - w].filter((x) => x !== right && x !== 0);
    return options(`Next flight on the list: ${u} → ${v} for ${w}. City ${v} is on the board at ${fare(ctx.vars[bName][at])}. What does it cost after this flight?`, right, wrong, `Last round's fare to ${u} is ${right - w}; adding the ${w} flight gives ${right}, which is cheaper, so it is written.`);
  },
  bugs: [
    {
      label: 'k rounds instead of k + 1',
      find: 'round <= k',
      replace: 'round < k',
      explain: 'k counts stops, not flights: a route with k stops uses k + 1 flights, so one round short misses the last leg (with k = 0 nothing is reached).',
    },
    {
      label: 'Update the board in place',
      find: 'const next = price.slice();',
      replace: 'const next = price;',
      explain: 'A fare written this round is read again in the same round, so one round can chain several flights and break the stop limit.',
    },
  ],
};
