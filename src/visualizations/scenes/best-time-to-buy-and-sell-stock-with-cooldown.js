// Best Time to Buy and Sell Stock with Cooldown: a trader who is, at the end of each day, in one of three moods:
// holding a share, just sold (must sit out tomorrow), or resting (free to buy). Each day:
// hold = max(hold, rest − p), sold = hold + p, rest = max(rest, sold), all from yesterday's balances.
// Finds the three balances by name (hold/buy…, sold/sell/cool…, rest/free/cash…); yesterday's values come from the
// previous step or from a copy like `prevHold`. Anything else falls back to the generic note.
import { options } from './util.js';

const HOLD = /^(hold|buy|own|have|h|held|holding|b|long|bought)$/i;
const SOLD = /^(sold|sell|cool|cooldown|cooling|s|sale|selling|justSold)$/i;
const REST = /^(rest|free|cash|idle|none|flat|wait|r|notHold|noStock|empty|reset|resting)$/i;
const DAY = ['i', 'day', 'd', 'idx', 't', 'j'];
const PRICE = ['p', 'price', 'x', 'today', 'cur', 'curr', 'v', 'val'];
const fmt = (x) => (x === -Infinity ? '−∞' : x < 0 ? `−${-x}` : String(x));
const code = (s) => (s || '').replace(/\/\/.*$/, '');

/** names of the three balances: { hold, sold, rest } */
function statesOf(vars, params) {
  const num = Object.keys(vars).filter((k) => !params.includes(k) && typeof vars[k] === 'number');
  const pick = (re) => num.find((k) => re.test(k));
  const s = { hold: pick(HOLD), sold: pick(SOLD), rest: pick(REST) };
  // buy / sell / cool: with no resting-like name, the cooled-down one is the resting mood
  const sells = num.filter((k) => SOLD.test(k));
  if (!s.rest && sells.length === 2) [s.sold, s.rest] = /cool/i.test(sells[0]) ? [sells[1], sells[0]] : sells;
  return s.hold && s.sold && s.rest ? s : null;
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
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** yesterday's value of a balance: the previous step's, or a copy such as prevHold / oldRest */
function yesterday(name, vars, prev) {
  const out = [];
  if (typeof prev[name] === 'number') out.push(prev[name]);
  for (const [k, v] of Object.entries(vars)) if (k !== name && typeof v === 'number' && k.toLowerCase().includes(name.toLowerCase())) out.push(v);
  return out;
}

/** each balance this line writes, checked against the cooldown rules: [{ state, old, cand, now, from }] */
function updatesOf(vars, prev, src, ctx) {
  const s = statesOf(vars, ctx.params);
  const t = s && today(vars, ctx);
  if (!t || !(s.hold in prev)) return null;
  const w = written(src);
  const out = [];
  for (const state of ['hold', 'sold', 'rest']) {
    const name = s[state];
    if (!w.includes(name)) continue;
    const now = vars[name];
    const old = prev[name];
    let hit = null;
    if (state === 'hold') {
      for (const r of yesterday(s.rest, vars, prev)) if (now === Math.max(old, r - t.p)) (hit = { old, cand: r - t.p, from: r });
    } else if (state === 'sold') {
      for (const h of yesterday(s.hold, vars, prev)) if (now === h + t.p) (hit = { old, cand: h + t.p, from: h });
    } else {
      for (const x of yesterday(s.sold, vars, prev)) if (now === Math.max(old, x)) (hit = { old, cand: x, from: x });
    }
    if (!hit) return null;
    out.push({ state, now, ...hit });
  }
  return out.length ? { t, out } : null;
}

function phrase(u, short) {
  if (u.state === 'hold') {
    if (u.old === u.cand) return short ? `holding ${fmt(u.now)}` : `buy or keep the share: both ${fmt(u.now)}`;
    return u.now === u.cand ? `buy after resting → ${fmt(u.from)} − ${fmt(u.from - u.cand)} = ${fmt(u.cand)} beats holding (${fmt(u.old)})` : `keep the share (${fmt(u.old)}), buying gives only ${fmt(u.cand)}`;
  }
  if (u.state === 'sold') return u.now === -Infinity ? 'nothing to sell yet' : short ? `sold ${fmt(u.now)}` : `sell the share → ${fmt(u.from)} + ${fmt(u.now - u.from)} = ${fmt(u.now)}, then cool down`;
  if (u.old === u.cand || u.now === u.old) return short ? `resting ${fmt(u.now)}` : `keep resting (${fmt(u.old)}), yesterday's sale gave ${fmt(u.cand)}`;
  return short ? `resting ${fmt(u.now)} (cooled down)` : `yesterday's sale (${fmt(u.cand)}) has cooled down: resting ${fmt(u.old)} → ${fmt(u.now)}`;
}

export default {
  id: 'best-time-to-buy-and-sell-stock-with-cooldown',
  metaphor: 'A trader with three moods',
  caption: 'Every evening the trader is holding a share, has just sold (and must sit out tomorrow), or is resting. Each day every mood keeps its best balance, built only from yesterday’s moods: buying is only allowed from resting.',
  labels: { hold: 'holding', sold: 'just sold', rest: 'resting' },
  narrate(ctx) {
    if (ctx.ret && !ctx.next && typeof ctx.value === 'number') return `the trader ends empty-handed (just sold or resting): best profit ${ctx.value}`;
    const u = updatesOf(ctx.vars, ctx.prev, ctx.src, ctx);
    if (u) {
      const at = dayOf(u.t);
      if (u.out.length === 1) return `${at}: ${phrase(u.out[0], false)}`;
      // one statement moved all moods: tell the buy decision in full, the rest in short
      const [first, ...more] = [...u.out].sort((a, b) => (a.state === 'hold' ? -1 : b.state === 'hold' ? 1 : 0));
      return `${at}: ${phrase(first, false)} · ${more.map((x) => phrase(x, true)).join(' · ')}`;
    }
    const s = statesOf(ctx.vars, ctx.params);
    if (s && !statesOf(ctx.prev, ctx.params)) {
      const h = ctx.vars[s.hold];
      return h === -Infinity ? 'before day 0: holding is impossible (−∞), just sold and resting both 0' : `day 0: buying the first share leaves ${fmt(h)}; just sold ${fmt(ctx.vars[s.sold])}, resting ${fmt(ctx.vars[s.rest])}`;
    }
    return null;
  },
  // before a day: keep yesterday's share or buy today after a rest day?
  predict(ctx) {
    if (!ctx.next) return null;
    const u = updatesOf(ctx.next.vars, ctx.vars, ctx.lines?.[ctx.next.line - 1], ctx);
    const r = u?.out.find((x) => x.state === 'rest');
    const buys = u?.out.some((x) => x.state === 'hold' && x.now !== x.old);
    if (r && !buys && Number.isFinite(r.cand) && r.cand > r.old) {
      return options(
        `${cap(dayOf(u.t))}: resting has ${fmt(r.old)}, and yesterday's sale left ${fmt(r.cand)}. What is the resting balance after today?`,
        fmt(r.now),
        [fmt(r.old), fmt(r.cand), fmt(r.cand + u.t.p), fmt(r.old - u.t.p)],
        r.now === r.cand ? `The day after a sale is the cooldown day: the seller becomes a rester, so resting takes ${fmt(r.cand)}.` : `The code keeps ${fmt(r.now)} as resting.`,
      );
    }
    const h = u?.out.find((x) => x.state === 'hold');
    if (!h || !Number.isFinite(h.old) || !Number.isFinite(h.cand) || h.old === h.cand) return null;
    const at = dayOf(u.t);
    return options(
      `${cap(at)}: keep the share held since earlier (${fmt(h.old)}) or buy today from resting (${fmt(h.from)} − ${u.t.p})? What is the holding balance after today?`,
      fmt(h.now),
      [fmt(h.old), fmt(h.cand), fmt(h.from)],
      h.now === h.cand ? `Buying today leaves ${fmt(h.cand)}, more than ${fmt(h.old)}: a cheaper share.` : `Buying today would leave ${fmt(h.cand)}; the share already held (${fmt(h.old)}) is the better deal.`,
    );
  },
  bugs: [
    {
      label: 'Buy straight after selling',
      find: 'Math.max(hold, rest - p)',
      replace: 'Math.max(hold, Math.max(rest, sold) - p)',
      explain: 'Buying from the just-sold balance skips the cooldown day: sell at 4 and buy at 1 the next day, which is not allowed.',
    },
    {
      label: 'Holding starts at 0',
      find: 'let hold = -Infinity;',
      replace: 'let hold = 0;',
      explain: 'Holding with a balance of 0 is a free share: selling it on day 0 already counts its whole price as profit.',
    },
  ],
};
