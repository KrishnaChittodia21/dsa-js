// Best Time to Buy and Sell Stock (running minimum). Walk the price chart day by day, remembering the cheapest
// day so far; each day asks "what if I sold today?". Works with min/low/buy-like and best/profit/max-like names.
import { options, row } from './util.js';

const MIN = /min|low|buy|cheap/i;
const BEST = /best|profit|max|ans|res/i;
const PRICE = ['price', 'p', 'x', 'today', 'cur', 'curr', 'current', 'val', 'v'];
const DAY = ['i', 'day', 'd', 'j', 'sell'];

const numVar = (vars, re, skip) => Object.keys(vars).find((k) => re.test(k) && k !== skip && typeof vars[k] === 'number');
function priceOf(vars, pName) {
  const a = row(vars[pName]);
  const day = DAY.find((k) => Number.isInteger(vars[k]) && a && vars[k] >= 0 && vars[k] < a.length);
  if (day) return { price: a[vars[day]], day: vars[day] };
  const k = PRICE.find((n) => typeof vars[n] === 'number');
  return k ? { price: vars[k] } : null;
}
const on = (d) => (d === undefined ? '' : `day ${d} `);

export default {
  id: 'best-time-to-buy-and-sell-stock',
  metaphor: 'Buy at the dip, sell later',
  caption: 'Walk the chart one day at a time. The cheapest price seen so far is the best day to have bought; each day asks "what if I sold today?" and keeps the best profit.',
  compare: 'best',
  narrate(ctx) {
    const pName = ctx.params[0];
    const minName = numVar(ctx.vars, MIN, pName);
    const bestName = numVar(ctx.vars, BEST, minName);
    const today = priceOf(ctx.vars, pName);
    if (bestName && bestName in ctx.prev && ctx.vars[bestName] !== ctx.prev[bestName]) {
      const b = ctx.vars[bestName];
      const buy = minName && Number.isFinite(ctx.vars[minName]) && today ? ` (bought at ${today.price - b})` : '';
      return `selling ${on(today?.day)}${today ? `at ${today.price}` : ''}${buy} earns ${b}: a new best, beating ${ctx.prev[bestName]}`;
    }
    const line = ctx.lines[ctx.line - 1] || '';
    const m = minName && ctx.vars[minName];
    if (bestName && today && Number.isFinite(m) && new RegExp(`\\b${bestName}\\s*=[^=]`).test(line) && ctx.vars[minName] === ctx.prev[minName]) {
      const gain = today.price - m;
      return `selling ${on(today.day)}at ${today.price} (bought at ${m}) would ${gain < 0 ? `lose ${-gain}` : `earn only ${gain}`}: the best stays ${ctx.vars[bestName]}`;
    }
    if (minName && minName in ctx.prev && ctx.vars[minName] !== ctx.prev[minName] && Number.isFinite(ctx.vars[minName])) {
      return `${ctx.vars[minName]}${today?.day === undefined ? '' : ` (day ${today.day})`} is the cheapest price so far: any later sale buys here`;
    }
    return null;
  },
  // before the profit check for a new day: what is the best profit after it?
  predict(ctx) {
    const pName = ctx.params[0];
    if (!ctx.next) return null;
    const minName = numVar(ctx.vars, MIN, pName);
    const bestName = numVar(ctx.vars, BEST, minName);
    if (!minName || !bestName || !Number.isFinite(ctx.vars[minName]) || ctx.next.vars[minName] !== ctx.vars[minName]) return null;
    const line = ctx.lines[ctx.next.line - 1] || '';
    if (!new RegExp(`\\b${bestName}\\s*=[^=]`).test(line)) return null;
    const today = priceOf(ctx.next.vars, pName);
    const after = ctx.next.vars[bestName];
    if (!today || typeof after !== 'number') return null;
    const b = ctx.vars[bestName];
    const m = ctx.vars[minName];
    const wrong = [b, today.price - m, today.price, b + 1].filter((x) => x !== after && x >= 0);
    return options(
      `Cheapest so far: ${m}. Best profit so far: ${b}. Today's price is ${today.price}. What is the best profit after today?`,
      after,
      wrong,
      after > b ? `Selling today earns ${today.price} − ${m} = ${after}, more than ${b}.` : `Selling today would earn only ${today.price - m}, which does not beat ${b}, so the best stays.`,
    );
  },
  bugs: [
    {
      label: 'Cheapest price starts at 0',
      find: 'let minSoFar = Infinity;',
      replace: 'let minSoFar = 0;',
      explain: 'No real day costs less than 0, so the "cheapest day" is a free day that never existed: every sale looks like pure profit.',
    },
    {
      label: 'Best profit starts at −Infinity',
      find: 'let best = 0;',
      replace: 'let best = -Infinity;',
      explain: 'When prices only fall, the least bad trade is a loss and it is returned (e.g. −1) instead of 0 for "don\'t trade".',
    },
  ],
};
