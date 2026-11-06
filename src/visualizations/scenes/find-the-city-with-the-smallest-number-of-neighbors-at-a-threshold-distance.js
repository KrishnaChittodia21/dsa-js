// Find the City With the Smallest Number of Neighbors at a Threshold Distance (Floyd–Warshall + count). A mileage
// chart between every pair of cities; each round allows one more stop-over city k, and a pair's distance drops when
// the detour through k is shorter. Then every city counts the others within the threshold; ties go to the larger label.
import { firstInt, options } from './util.js';

const K = ['k', 'via', 'mid', 'stop', 'through', 'kk'];
const I = ['i', 'city', 'src', 'from', 'u', 'node', 'c', 'x'];
const J = ['j', 'dst', 'to', 'v', 'other', 'y'];
const COUNT = ['count', 'cnt', 'reach', 'reachable', 'num', 'neighbors', 'neighbours', 'within'];
const CITY = ['bestCity', 'ans', 'res', 'result', 'answer', 'best', 'minCity', 'bestNode', 'resCity'];
const BEST = ['bestCount', 'minCount', 'minCnt', 'fewest', 'minReach', 'least', 'bestCnt', 'mn', 'minReachable', 'min', 'lowest'];
const km = (x) => (x === null || x === undefined || x === Infinity ? '∞' : x);

/** [name, table] of the n × n distance chart (never a parameter) */
function chartOf(ctx) {
  const n = ctx.input?.[0];
  return Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && Array.isArray(v) && v.length === n && v.every((r) => Array.isArray(r) && r.length === n)) || null;
}
/** the one cell that changed: [i, j, before, after] */
function changed(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null;
  const out = [];
  b.forEach((r, i) => r.forEach((x, j) => a[i]?.[j] !== x && out.push([i, j, a[i]?.[j], x])));
  return out.length === 1 ? out[0] : null;
}
/** the stop-over city k when cell (i, j) = chart[i][k] + chart[k][j] */
function via(vars, t, i, j, x) {
  const [, k] = firstInt(vars, K);
  return k !== undefined && Number.isInteger(t[i]?.[k]) && Number.isInteger(t[k]?.[j]) && t[i][k] + t[k][j] === x ? k : undefined;
}

export default {
  id: 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance',
  metaphor: 'A mileage chart between every pair of cities',
  caption: 'Row i, column j is the shortest known drive from city i to city j (∞ = no route yet). Each round allows one more stop-over city; at the end each city counts the others within the threshold.',
  narrate(ctx) {
    const thr = ctx.vars[ctx.params[2]];
    if (ctx.ret && Number.isInteger(ctx.value)) return `answer: city ${ctx.value}, the fewest cities within ${thr} (on a tie the larger label wins)`;
    const chart = chartOf(ctx);
    if (!chart) return null;
    const [cName, t] = chart;
    if (!ctx.prev[cName]) return 'the mileage chart: 0 from each city to itself, ∞ (no route known) everywhere else';
    const ch = changed(ctx.prev[cName], t);
    if (ch) {
      const [i, j, was, is] = ch;
      const k = via(ctx.vars, t, i, j, is);
      if (i === j) return null;
      if (k !== undefined) return `via city ${k}, ${i} → ${j} drops from ${km(was)} to ${is} (${t[i][k]} + ${t[k][j]})`;
      return `road ${i} – ${j}: ${is} km${was !== null && was !== undefined && was !== Infinity && was !== is ? ` (shorter than ${km(was)})` : ''}`;
    }
    const [kName, k] = firstInt(ctx.vars, K);
    if (kName && k !== ctx.prev[kName]) return `stop-over city ${k} is now allowed: every pair i → j may drive through ${k}`;
    // counting: a city within the threshold
    const cnt = COUNT.find((x) => Number.isInteger(ctx.vars[x]) && ctx.vars[x] === ctx.prev[x] + 1);
    const [, i] = firstInt(ctx.vars, I);
    const [, j] = firstInt(ctx.vars, J);
    if (cnt && i !== undefined && j !== undefined && Number.isInteger(t[i]?.[j])) return `city ${i} reaches city ${j} in ${t[i][j]} ≤ ${thr}: ${ctx.vars[cnt]} so far`;
    // the best city / count so far
    const city = CITY.find((x) => Number.isInteger(ctx.vars[x]) && Number.isInteger(ctx.prev[x]) && ctx.vars[x] !== ctx.prev[x]);
    const c = COUNT.find((x) => Number.isInteger(ctx.vars[x]));
    if (city && c) return `city ${ctx.vars[city]} reaches ${ctx.vars[c]} other ${ctx.vars[c] === 1 ? 'city' : 'cities'}: the best answer so far`;
    const best = BEST.find((x) => x in ctx.prev && ctx.vars[x] !== ctx.prev[x] && Number.isInteger(ctx.vars[x]));
    if (best && c && i !== undefined && !CITY.some((x) => ctx.vars[x] === i)) return `city ${i} reaches ${ctx.vars[c]} other ${ctx.vars[c] === 1 ? 'city' : 'cities'}; the best so far reached ${km(ctx.prev[best])}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const chart = chartOf(ctx);
    // a detour beats a known distance: what is i → j now?
    if (chart) {
      const [cName, t] = chart;
      const ch = changed(t, ctx.next.vars[cName]);
      if (ch) {
        const [i, j, was, is] = ch;
        const k = via(ctx.next.vars, t, i, j, is);
        if (k === undefined || i >= j || !Number.isInteger(was)) return null;
        const a = t[i][k];
        const b = t[k][j];
        return options(`Stop-over city ${k}: ${i} → ${k} is ${a}, ${k} → ${j} is ${b}, and ${i} → ${j} is ${was} on the chart. What is ${i} → ${j} after this check?`, is, [was, a, b, a + b + 1].filter((x) => x !== is), `Driving through ${k} costs ${a} + ${b} = ${is}, less than ${was}, so the chart keeps the shorter drive.`);
      }
    }
    // a tie on the count: which city wins?
    const city = CITY.find((x) => Number.isInteger(ctx.vars[x]) && Number.isInteger(ctx.next.vars[x]) && ctx.vars[x] !== ctx.next.vars[x]);
    const c = COUNT.find((x) => Number.isInteger(ctx.vars[x]));
    const best = BEST.find((x) => x in ctx.prev);
    const [, i] = firstInt(ctx.vars, I);
    if (!city || !c || !best || i === undefined || ctx.vars[city] < 0 || ctx.prev[best] !== ctx.vars[c] || ctx.vars[city] === i) return null;
    const right = ctx.next.vars[city];
    return options(`City ${i} reaches ${ctx.vars[c]} other cities, exactly as many as the best so far, city ${ctx.vars[city]}. Which city is the answer now?`, right, [ctx.vars[city], i], right === i ? `A tie goes to the larger label, so the comparison must be <= (not <): city ${i} takes over.` : `Your run keeps city ${right}.`);
  },
  bugs: [
    {
      label: 'Store each road one way only',
      find: 'd[b][a] = Math.min(d[b][a], w);',
      replace: '',
      explain: 'Roads work both ways, but only a → b is written, so cities with bigger labels look cut off and count too few neighbours.',
    },
    {
      label: 'Ties go to the smaller label',
      find: 'if (count <= bestCount)',
      replace: 'if (count < bestCount)',
      explain: 'With < a later city that reaches just as few others never takes over, so the smallest label wins a tie instead of the largest.',
    },
  ],
};
