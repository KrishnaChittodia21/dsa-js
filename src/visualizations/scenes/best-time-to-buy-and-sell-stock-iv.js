// Best Time to Buy and Sell Stock IV: a trader with k trade tickets. For each ticket j two balances are kept:
// holding the share of trade j (buy[j]) and flat after j finished trades (sell[j]). Each day every balance either
// stays or switches: buy[j] = max(buy[j], sell[j−1] − p), sell[j] = max(sell[j], buy[j] + p). Also narrates the
// k ≥ n/2 shortcut (pocket every rise). Rows under hold/buy-like and sell/cash-like names; else the generic note.
import { options, row, writtenCell } from './util.js';

const HOLD = /^(buy|hold|own|have|b|h|bought|holding|long)s?$/i;
const FLAT = /^(sell|cash|free|flat|s|c|sold|profit|done|selling|none)s?$/i;
const DAY = ['i', 'day', 'd', 'idx', 't'];
const PRICE = ['p', 'price', 'x', 'today', 'cur', 'curr', 'v', 'val'];
const fmt = (x) => (x === -Infinity ? '−∞' : x < 0 ? `−${-x}` : String(x));

/** the hold and flat rows (not parameters): numbers / −∞ only */
function rowsOf(vars, params) {
  const rows = Object.entries(vars).filter(([k, v]) => !params.includes(k) && row(v) && v.length > 0 && v.every((x) => typeof x === 'number'));
  const hold = rows.find(([k]) => HOLD.test(k));
  const flat = rows.find(([k]) => FLAT.test(k));
  return hold && flat && hold[1].length === flat[1].length ? { hold: hold[0], flat: flat[0] } : null;
}

/** today's price and, when known, its day number (`skip`: names used as a ticket index on this line) */
function today(vars, ctx, skip = []) {
  const prices = ctx.input?.[1];
  if (!Array.isArray(prices)) return null;
  const d = DAY.find((k) => !skip.includes(k) && Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < prices.length);
  if (d !== undefined) return { p: prices[vars[d]], day: vars[d] };
  const pk = PRICE.find((k) => !skip.includes(k) && typeof vars[k] === 'number' && !ctx.params.includes(k));
  if (pk === undefined) return null;
  const p = vars[pk];
  return { p, day: prices.indexOf(p) === prices.lastIndexOf(p) ? prices.indexOf(p) : undefined };
}
const dayOf = (t) => (t.day === undefined ? `price ${t.p}` : `day ${t.day} (price ${t.p})`);

/** the balance this line writes: which ticket, its old value, the switch candidate and the new value */
function writeOf(vars, prev, src, ctx) {
  const r = rowsOf(vars, ctx.params);
  if (!r) return null;
  const w = writtenCell(src, vars);
  if (!w || w.at.length !== 1 || (w.name !== r.hold && w.name !== r.flat)) return null;
  const j = w.at[0];
  const was = row(prev[w.name]);
  const t = today(vars, ctx, (/\[([^\]]*)\]/.exec(src || '')?.[1] || '').match(/[A-Za-z_$][\w$]*/g) || []);
  if (!was || !t || !Number.isInteger(j)) return null;
  const old = was[j];
  const now = vars[w.name][j];
  const isHold = w.name === r.hold;
  // the row the switch comes from: flat after j − 1 trades (buy) or the share of trade j (sell), before or after its own write
  const from = isHold ? (j === 0 ? [0] : [prev[r.flat]?.[j - 1], vars[r.flat][j - 1]]) : [prev[r.hold]?.[j], vars[r.hold][j]];
  const off = vars[r.hold].length === (Number.isInteger(ctx.input?.[0]) ? ctx.input[0] : -1) ? 1 : 0; // a row of k cells: ticket j + 1
  for (const f of from) {
    if (typeof f !== 'number' || typeof old !== 'number') continue;
    const cand = isHold ? f - t.p : f + t.p;
    if (now === Math.max(old, cand)) return { isHold, j: j + off, old, cand, now, f, t };
  }
  return null;
}

function note(w) {
  const at = dayOf(w.t);
  if (w.isHold) {
    const sw = `buy for trade ${w.j} → ${fmt(w.f)} − ${w.t.p} = ${fmt(w.cand)}`;
    if (w.old === w.cand) return `${at}: ${sw}, the same as the share already held`;
    return w.now === w.cand ? `${at}: ${sw} beats the share held (${fmt(w.old)})` : `${at}: keep trade ${w.j}'s share (${fmt(w.old)}), buying gives only ${fmt(w.cand)}`;
  }
  if (w.cand === -Infinity) return `${at}: no share for trade ${w.j} yet, stay flat (${fmt(w.old)})`;
  const sw = `sell trade ${w.j} → ${fmt(w.f)} + ${w.t.p} = ${fmt(w.cand)}`;
  if (w.old === w.cand) return `${at}: ${sw}, the same as staying flat`;
  return w.now === w.cand ? `${at}: ${sw} beats staying flat (${fmt(w.old)})` : `${at}: stay flat after ${w.j} trade${w.j === 1 ? '' : 's'} (${fmt(w.old)}), selling gives only ${fmt(w.cand)}`;
}

export default {
  id: 'best-time-to-buy-and-sell-stock-iv',
  metaphor: 'A trader with k trade tickets',
  caption: 'Each ticket j keeps two balances: holding its share, and flat after j finished trades. Every day each one either stays or switches (buy from the flat balance of ticket j − 1, or sell the held share).',
  labels: { buy: 'holding (trade j)', sell: 'flat after j trades' },
  narrate(ctx) {
    if (ctx.ret && !ctx.next && typeof ctx.value === 'number') return `the best balance with at most ${ctx.input?.[0] ?? 'k'} trades: ${ctx.value}`;
    const w = writeOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (w) return note(w);
    const r = rowsOf(ctx.vars, ctx.params);
    if (r && !rowsOf(ctx.prev, ctx.params)) return `one holding and one flat balance per trade ticket: holding starts at −∞ (no share yet), flat at 0`;
    // the k ≥ n/2 shortcut: with tickets to spare, every rise is pocketed
    const prices = ctx.input?.[1];
    const d = DAY.find((k) => Number.isInteger(ctx.vars[k]) && ctx.vars[k] > 0);
    if (Array.isArray(prices) && d && ctx.vars[d] < prices.length && /\+=/.test(ctx.src)) {
      const i = ctx.vars[d];
      const rise = prices[i] - prices[i - 1];
      const tot = Object.entries(ctx.vars).find(([k, v]) => typeof v === 'number' && k !== d && !ctx.params.includes(k) && ctx.prev[k] === v - Math.max(0, rise));
      if (tot && rise > 0) return `day ${i}: price rises ${prices[i - 1]} → ${prices[i]}, tickets to spare, so pocket +${rise} (total ${tot[1]})`;
      if (tot) return `day ${i}: price ${rise === 0 ? 'stays at' : `falls ${prices[i - 1]} →`} ${prices[i]}: nothing to pocket`;
    }
    return null;
  },
  // before a balance is updated: stay as it is, or switch?
  predict(ctx) {
    if (!ctx.next) return null;
    const w = writeOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    if (!w || !Number.isFinite(w.old) || !Number.isFinite(w.cand) || w.old === w.cand) return null;
    const at = dayOf(w.t);
    if (w.isHold) {
      if (w.j !== 1) return null; // one buy question per day, so the sells get asked too
      return options(
        `${at[0].toUpperCase()}${at.slice(1)}, ticket ${w.j}: keep the share held (${fmt(w.old)}) or buy now from the balance after ${w.j - 1} trade${w.j === 2 ? '' : 's'} (${fmt(w.f)} − ${w.t.p})? What is the holding balance after today?`,
        fmt(w.now),
        [fmt(w.old), fmt(w.cand), fmt(w.f)],
        w.now === w.cand ? `Buying today leaves ${fmt(w.cand)}, more than ${fmt(w.old)}: a cheaper share.` : `Buying today would leave only ${fmt(w.cand)}; the share already held (${fmt(w.old)}) was bought cheaper.`,
      );
    }
    return options(
      `${at[0].toUpperCase()}${at.slice(1)}, ticket ${w.j}: stay flat (${fmt(w.old)}) or sell the held share (${fmt(w.f)} + ${w.t.p})? What is the flat balance after today?`,
      fmt(w.now),
      [fmt(w.old), fmt(w.cand), fmt(w.f)],
      w.now === w.cand ? `Selling today gives ${fmt(w.cand)}, more than ${fmt(w.old)}.` : `Selling today gives only ${fmt(w.cand)}; staying flat keeps ${fmt(w.old)}.`,
    );
  },
  bugs: [
    {
      label: 'Holding starts at 0',
      find: 'new Array(k + 1).fill(-Infinity)',
      replace: 'new Array(k + 1).fill(0)',
      explain: 'A balance of 0 while holding means a free share: selling it on any day counts its whole price as profit.',
    },
    {
      label: 'Buy from the same ticket',
      find: 'sell[j - 1] - p',
      replace: 'sell[j] - p',
      explain: 'Buying from the balance after j trades (not j − 1) never uses up a ticket, so the trader can trade more than k times.',
    },
  ],
};
