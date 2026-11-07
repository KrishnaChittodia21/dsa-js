// Best Time to Buy and Sell Stock with Transaction Fee: a trader who ends each day either flat (cash) or holding one
// share. Each day: cash = max(cash, hold + p − fee) (sell, paying the broker), hold = max(hold, cash − p) (buy).
// Also accepts the fee charged on the buy instead. Balances are found by name (cash/free/sell…, hold/buy…);
// yesterday's values come from the previous step, today's, or a copy like `prevCash`. Else the generic note.
import { options } from './util.js';

const HOLD = /^(hold|buy|own|have|h|held|holding|b|long|bought)$/i;
const CASH = /^(cash|free|flat|sell|sold|notHold|noStock|s|c|empty|none|rest|money|profit)$/i;
const DAY = ['i', 'day', 'd', 'idx', 't', 'j'];
const PRICE = ['p', 'price', 'x', 'today', 'cur', 'curr', 'v', 'val'];
const fmt = (x) => (x === -Infinity ? '−∞' : x < 0 ? `−${-x}` : String(x));
const code = (s) => (s || '').replace(/\/\/.*$/, '');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function statesOf(vars, params) {
  const num = Object.keys(vars).filter((k) => !params.includes(k) && typeof vars[k] === 'number');
  const s = { hold: num.find((k) => HOLD.test(k)), cash: num.find((k) => CASH.test(k)) };
  return s.hold && s.cash ? s : null;
}

/** the names a line assigns (`[a, b] = …`, `const x = …`, `x = …`) */
function written(src) {
  const m = /^\s*(?:const|let|var)?\s*(\[[^\]]*\]|[A-Za-z_$][\w$]*)\s*=(?!=)/.exec(code(src));
  return m ? m[1].match(/[A-Za-z_$][\w$]*/g) || [] : [];
}

function today(vars, ctx) {
  const prices = ctx.input?.[0];
  if (!Array.isArray(prices)) return null;
  const d = DAY.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < prices.length);
  if (d !== undefined) return { p: prices[vars[d]], day: vars[d] };
  const pk = PRICE.find((k) => typeof vars[k] === 'number' && !ctx.params.includes(k));
  if (pk === undefined) return null;
  const p = vars[pk];
  return { p, day: prices.indexOf(p) === prices.lastIndexOf(p) ? prices.indexOf(p) : undefined };
}
const dayOf = (t) => (t.day === undefined ? `price ${t.p}` : `day ${t.day} (price ${t.p})`);

/** values a balance may be read from on this line: yesterday's, a copy (prevCash), or today's */
function pool(name, vars, prev) {
  const out = [];
  if (typeof prev[name] === 'number') out.push(prev[name]);
  for (const [k, v] of Object.entries(vars)) if (k !== name && typeof v === 'number' && k.toLowerCase().includes(name.toLowerCase())) out.push(v);
  out.push(vars[name]);
  return out;
}

/** the balances this line writes, checked against the rules: [{ state, old, cand, now, from, feeOn }] */
function updatesOf(vars, prev, src, ctx) {
  const s = statesOf(vars, ctx.params);
  const t = s && today(vars, ctx);
  const fee = ctx.input?.[1];
  if (!t || !Number.isFinite(fee) || !(s.hold in prev) || !(s.cash in prev)) return null;
  const w = written(src);
  // which trade pays the fee: the balance whose line names the fee parameter
  const feeRe = new RegExp(`\\b${ctx.params[1]}\\b`);
  const payer = (ctx.lines || []).filter((l) => feeRe.test(code(l).split(/=(?!=)/).slice(1).join('='))).flatMap(written);
  const sides = payer.includes(s.hold) && !payer.includes(s.cash) ? [false] : payer.includes(s.cash) && !payer.includes(s.hold) ? [true] : [true, false];
  const out = [];
  for (const state of ['cash', 'hold']) {
    const name = s[state];
    if (!w.includes(name)) continue;
    const now = vars[name];
    const old = prev[name];
    let hit = null;
    for (const feeOnSell of sides) {
      if (hit) break;
      for (const f of pool(state === 'cash' ? s.hold : s.cash, vars, prev)) {
        const cand = state === 'cash' ? f + t.p - (feeOnSell ? fee : 0) : f - t.p - (feeOnSell ? 0 : fee);
        if (now === Math.max(old, cand)) {
          hit = { old, cand, from: f, feeOn: feeOnSell ? 'sell' : 'buy' };
          break;
        }
      }
    }
    if (!hit) return null;
    out.push({ state, now, ...hit });
  }
  return out.length ? { t, fee, out } : null;
}

function phrase(u, t, fee) {
  const f = (side) => (u.feeOn === side && fee ? ` − ${fee}` : '');
  if (u.state === 'cash') {
    const sw = `sell → ${fmt(u.from)} + ${t.p}${f('sell')} = ${fmt(u.cand)}`;
    if (u.old === u.cand) return `${sw}, the same as staying flat`;
    return u.now === u.cand ? `${sw} beats staying flat (${fmt(u.old)})` : `stay flat (${fmt(u.old)}), ${sw}${f('sell') ? ' after the fee' : ''} is less`;
  }
  const sw = `buy → ${fmt(u.from)} − ${t.p}${f('buy')} = ${fmt(u.cand)}`;
  if (u.old === u.cand) return `${sw}, the same as the share held`;
  return u.now === u.cand ? `${sw} beats the share held (${fmt(u.old)})` : `keep the share (${fmt(u.old)}), ${sw} is less`;
}

export default {
  id: 'best-time-to-buy-and-sell-stock-with-transaction-fee',
  metaphor: 'A trader who pays the broker per trade',
  caption: 'Each evening the trader is flat (cash) or holding one share. A day can only switch one way: sell (paying the fee) or buy. Small rises do not cover the fee, so the trader keeps holding through them.',
  labels: { cash: 'flat', hold: 'holding' },
  narrate(ctx) {
    if (ctx.ret && !ctx.next && typeof ctx.value === 'number') return `the trader ends flat: best profit after fees ${ctx.value}`;
    const u = updatesOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (u) return `${dayOf(u.t)}: ${u.out.map((x) => phrase(x, u.t, u.fee)).join(' · ')}`;
    const s = statesOf(ctx.vars, ctx.params);
    if (s && !statesOf(ctx.prev, ctx.params) && Number.isFinite(ctx.vars[s.hold])) return `day 0: flat with ${fmt(ctx.vars[s.cash])}, or buy the first share and hold ${fmt(ctx.vars[s.hold])}`;
    return null;
  },
  // before a balance is updated: switch (sell / buy) or stay?
  predict(ctx) {
    if (!ctx.next) return null;
    const u = updatesOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    if (!u || u.out.length !== 1) return null;
    const x = u.out[0];
    if (!Number.isFinite(x.old) || !Number.isFinite(x.cand) || x.old === x.cand) return null;
    const at = cap(dayOf(u.t));
    const fee = u.fee && x.feeOn === (x.state === 'cash' ? 'sell' : 'buy') ? ` − fee ${u.fee}` : '';
    if (x.state === 'cash') {
      return options(
        `${at}: stay flat (${fmt(x.old)}) or sell the held share (${fmt(x.from)} + ${u.t.p}${fee})? What is the flat balance after today?`,
        fmt(x.now),
        [fmt(x.old), fmt(x.cand), fmt(x.from + u.t.p)],
        x.now === x.cand ? `Selling gives ${fmt(x.cand)} even after the fee, more than ${fmt(x.old)}.` : `After the fee, selling gives only ${fmt(x.cand)}: staying flat keeps ${fmt(x.old)}.`,
      );
    }
    if (x.now === x.old) return null; // holding on through a dip is asked rarely: the sells tell the fee story
    return options(
      `${at}: keep the share held (${fmt(x.old)}) or buy now from flat (${fmt(x.from)} − ${u.t.p}${fee})? What is the holding balance after today?`,
      fmt(x.now),
      [fmt(x.old), fmt(x.cand), fmt(x.from)],
      x.now === x.cand ? `Buying today leaves ${fmt(x.cand)}, more than ${fmt(x.old)}.` : `Buying today would leave ${fmt(x.cand)}; the share held (${fmt(x.old)}) is the better deal.`,
    );
  },
  bugs: [
    {
      label: 'Fee on both buy and sell',
      find: 'hold = Math.max(hold, prevCash - p);',
      replace: 'hold = Math.max(hold, prevCash - p - fee);',
      explain: 'Each trade pays the fee once. Charging it on the buy as well doubles the cost of every trade, so good trades are skipped.',
    },
    {
      label: 'Holding starts at 0',
      find: 'let hold = -prices[0];',
      replace: 'let hold = 0;',
      explain: 'Holding with a balance of 0 is a free share: selling it on any later day counts its whole price as profit.',
    },
  ],
};
