// Coin Change: dp[x] = fewest coins that make amount x. Each write puts one coin on top of a smaller amount that is
// already solved. Works with a bottom-up dp row under a dp-like name; other shapes fall back to the generic note.
import { changedIdx, options, row } from './util.js';

const DP = ['dp', 'memo', 'table', 'minCoins', 'best', 'f'];
const COIN = ['c', 'coin', 'cn'];
const dpOf = (vars, amount) => DP.map((k) => row(vars[k])).find((r) => r && (!Number.isInteger(amount) || r.length === amount + 1));
const fmt = (v) => (Number.isFinite(v) ? String(v) : '∞');

/** the coin that explains dp[x] = v: the loop's coin when it fits, else any coin that does */
function coinFor(vars, coins, dp, x, v) {
  if (!row(coins)) return undefined;
  const fits = coins.filter((c) => Number.isInteger(c) && c <= x && dp[x - c] + 1 === v);
  const cur = COIN.map((k) => vars[k]).find((c) => fits.includes(c));
  return cur ?? fits[0];
}

export default {
  id: 'coin-change',
  metaphor: 'Making change with the fewest coins',
  caption: 'Cell x is the fewest coins that pay exactly x (∞ = no way yet). A cell improves when some coin, laid on top of an already-solved smaller amount, uses fewer coins.',
  compare: 'dp',
  narrate(ctx) {
    const [coinsName, amountName] = ctx.params;
    const amount = ctx.vars[amountName];
    const dp = dpOf(ctx.vars, amount);
    const before = dpOf(ctx.prev, amount);
    if (!dp) {
      // top-down: a memo Map gains one solved amount at a time
      const m = DP.map((k) => ctx.vars[k]?.$map).find(Array.isArray);
      const was = DP.map((k) => ctx.prev[k]?.$map).find(Array.isArray) || [];
      const [x, v] = m && m.length === was.length + 1 ? m[m.length - 1] : [];
      return Number.isInteger(x) && typeof v === 'number' ? `amount ${x} solved: ${Number.isFinite(v) ? `${v} coin${v === 1 ? '' : 's'} at best` : 'it cannot be paid'} (remembered)` : null;
    }
    if (!before) return dp.every((v) => v === Infinity || v === null) ? `every amount 0…${dp.length - 1} starts at ∞: no way to pay it yet` : null;
    const d = changedIdx(dp, before);
    if (d.length !== 1) return null;
    const x = d[0];
    const v = dp[x];
    if (x === 0 && v === 0) return 'amount 0 needs no coins at all: the one cell every answer is built on';
    const c = coinFor(ctx.vars, ctx.vars[coinsName], dp, x, v);
    if (c === undefined || !Number.isFinite(v)) return null;
    const was = Number.isFinite(before[x]) ? `, better than ${before[x]}` : '';
    return `pay ${x}: a ${c} coin on top of ${x - c} (${dp[x - c]} coin${dp[x - c] === 1 ? '' : 's'}) → ${v} coin${v === 1 ? '' : 's'}${was}`;
  },
  // only when an amount that already has a way is about to improve: how many coins does it really need?
  predict(ctx) {
    if (!ctx.next) return null;
    const [coinsName, amountName] = ctx.params;
    const amount = ctx.vars[amountName];
    const dp = dpOf(ctx.vars, amount);
    const after = dpOf(ctx.next.vars, amount);
    if (!dp || !after) return null;
    const d = changedIdx(after, dp);
    if (d.length !== 1) return null;
    const x = d[0];
    const v = after[x];
    if (!Number.isFinite(dp[x]) || !Number.isFinite(v) || v >= dp[x]) return null;
    const c = coinFor(ctx.next.vars, ctx.vars[coinsName], after, x, v);
    const why = c === undefined ? 'A different last coin reaches it with fewer coins.' : `A ${c} coin on top of amount ${x - c} (${after[x - c]} coin${after[x - c] === 1 ? '' : 's'}) makes ${x} with ${v}.`;
    return options(`Amount ${x} can be paid with ${fmt(dp[x])} coins so far. It is about to improve: to how many?`, v, [dp[x], v + 1, v + 2].filter((w) => w !== v), why);
  },
  bugs: [
    {
      label: 'Start every amount at 0 instead of ∞',
      find: 'fill(Infinity)',
      replace: 'fill(0)',
      explain: 'Every cell already says "0 coins", so no coin can ever improve it and the answer comes out as 0.',
    },
    {
      label: 'Return ∞ instead of -1',
      find: 'return dp[amount] === Infinity ? -1 : dp[amount];',
      replace: 'return dp[amount];',
      explain: 'When the amount cannot be paid, its cell stays ∞, and that is returned instead of -1.',
    },
  ],
};
