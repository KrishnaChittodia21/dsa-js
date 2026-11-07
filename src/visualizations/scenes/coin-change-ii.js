// Coin Change II: dp[a] = number of coin combinations that pay exactly a, using the coins seen so far. When a coin
// joins, every amount a gains the ways to pay a - coin (then lay this coin on top). Works with a rolling 1-D row
// (length amount + 1) or a full 2-D table (row k = first k coins, or row k = coin k); other shapes fall back.
import { changedIdx, options, row } from './util.js';

const DP = ['dp', 'ways', 'table', 'memo', 'count', 'cnt', 'f', 'combos'];
const COIN = ['coin', 'c', 'cn', 'val', 'value', 'w'];
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));
const s = (n) => (n === 1 ? '' : 's');

/** { k, a, v, old, grid } for the one cell that changed between two snapshots, else null */
function changedCell(vars, prev, amount, skip) {
  for (const name of DP) {
    if (skip.includes(name)) continue;
    const x = vars[name];
    const y = prev[name];
    if (isGrid(x) && isGrid(y) && x.length === y.length && x[0].length === amount + 1) {
      const hits = [];
      x.forEach((r, k) => changedIdx(r, y[k]).forEach((a) => hits.push({ k, a, v: r[a], old: y[k][a], grid: x })));
      if (hits.length === 1) return hits[0];
    } else if (row(x) && row(y) && x.length === amount + 1 && y.length === x.length) {
      const d = changedIdx(x, y);
      if (d.length === 1) return { a: d[0], v: x[d[0]], old: y[d[0]], dp: x };
    }
  }
  return null;
}

/** how the new value was made: { coin, base, add } with v = base + add, base = ways without this coin */
function explain(vars, coins, c) {
  if (!row(coins) || !Number.isInteger(c.v)) return null;
  const loop = COIN.map((k) => vars[k]).find((x) => Number.isInteger(x) && coins.includes(x));
  if (c.dp) {
    const cands = [loop, ...coins].filter((x) => Number.isInteger(x) && x > 0 && x <= c.a && c.v === c.old + c.dp[c.a - x]);
    return cands.length ? { coin: cands[0], base: c.old, add: c.dp[c.a - cands[0]] } : null;
  }
  const g = c.grid;
  const up = c.k > 0 ? g[c.k - 1][c.a] : 0;
  // row k is the first k coins (k + 1 rows) or coin k itself (one row per coin)
  const rowCoin = g.length === coins.length + 1 ? coins[c.k - 1] : g.length === coins.length ? coins[c.k] : loop;
  for (const coin of [rowCoin]) {
    if (!Number.isInteger(coin) || coin <= 0) continue;
    const left = c.a >= coin ? g[c.k][c.a - coin] : 0;
    if (c.v === up + left && Number.isInteger(up)) return { coin, base: up, add: left };
    if (c.old > 0 && c.v === c.old + left) return { coin, base: c.old, add: left };
    if (c.v === up) return { coin, base: up, add: 0 }; // a two-step learner: copy the row above first
  }
  return null;
}

export default {
  id: 'coin-change-ii',
  metaphor: 'Counting ways to fill a till',
  caption: 'Cell a counts the different coin mixes that pay exactly a. Coins join one at a time: a new coin adds, to each amount a, all the mixes for a − coin with this coin laid on top.',
  compare: 'dp',
  narrate(ctx) {
    const [amountName, coinsName] = ctx.params;
    const amount = ctx.vars[amountName];
    const coins = ctx.vars[coinsName];
    if (!Number.isInteger(amount)) return null;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `${ctx.value} different mix${ctx.value === 1 ? '' : 'es'} of coins pay exactly ${amount}`;
    const c = changedCell(ctx.vars, ctx.prev, amount, ctx.params);
    if (!c) {
      // an add that found nothing: no mix pays a - coin
      const dp = DP.filter((k) => !ctx.params.includes(k)).map((k) => row(ctx.vars[k])).find((r) => r && r.length === amount + 1);
      const a = ['a', 'amt', 'x', 'i', 'j', 'sum'].map((k) => ctx.vars[k]).find(Number.isInteger);
      const coin = COIN.map((k) => ctx.vars[k]).find((x) => Number.isInteger(x) && row(coins) && coins.includes(x));
      if (!dp || !/\+=/.test(ctx.src || '') || !Number.isInteger(a) || !coin || a < coin || a > amount || dp[a - coin] !== 0) return null;
      return `pay ${a}: there is no way to pay ${a - coin}, so coin ${coin} adds nothing (still ${dp[a]})`;
    }
    if (!Number.isInteger(c.v)) return null;
    if (c.a === 0 && c.v === 1 && c.grid) return `row ${c.k}: paying 0 still has exactly 1 way, take no coins`;
    if (c.a === 0 && c.v === 1) return 'paying 0 has exactly 1 way: take no coins. Every count is built on it';
    const e = explain(ctx.vars, coins, c);
    if (!e) return null;
    if (e.add === 0) return c.grid && c.v === e.base ? `pay ${c.a}, skipping coin ${e.coin} for now: ${c.v} way${s(c.v)}, copied from the row above` : null;
    return `pay ${c.a}: ${e.base} way${s(e.base)} without coin ${e.coin} + ${e.add} way${s(e.add)} to pay ${c.a - e.coin}, then add a ${e.coin} → ${c.v}`;
  },
  // when a count grows by a real number of mixes: how many ways now?
  predict(ctx) {
    if (!ctx.next) return null;
    const [amountName, coinsName] = ctx.params;
    const amount = ctx.vars[amountName];
    const coins = ctx.vars[coinsName];
    if (!Number.isInteger(amount)) return null;
    const c = changedCell(ctx.next.vars, ctx.vars, amount, ctx.params);
    if (!c || !Number.isInteger(c.v)) return null;
    const e = explain(ctx.next.vars, coins, c);
    if (!e || e.add === 0 || e.base === 0 || !(e.add > 1 || c.a === amount)) return null;
    return options(
      `Coin ${e.coin} is in play. In how many ways can you pay ${c.a} now?`,
      c.v,
      [e.base, e.add, c.v + 1].filter((w) => w !== c.v),
      `${e.base} way${s(e.base)} that skip coin ${e.coin}, plus ${e.add} way${s(e.add)} to pay ${c.a - e.coin} with a ${e.coin} laid on top: ${e.base} + ${e.add} = ${c.v}.`,
    );
  },
  bugs: [
    {
      label: 'Start paying 0 with 0 ways',
      find: 'dp[0] = 1;',
      replace: 'dp[0] = 0;',
      explain: 'Every count is built on "pay 0 by taking nothing". With that at 0, no coin ever has anything to sit on, so every answer is 0.',
    },
    {
      label: 'Walk the amounts backwards',
      find: 'for (let a = coin; a <= amount; a++)',
      replace: 'for (let a = amount; a >= coin; a--)',
      explain: 'Going down, dp[a - coin] has not seen this coin yet, so each coin can be used at most once: 5 with [1,2,5] gives 1 instead of 4.',
    },
  ],
};
