// Online Stock Span (design class, monotonic stack). Each new price climbs over every earlier day that was not
// higher and swallows the days they had already swallowed. Reads a stack of [price, span] pairs from `this`,
// whatever the field is called.
import { options } from './util.js';

const isPair = (x) => Array.isArray(x) && x.length === 2 && x.every(Number.isFinite);
// the [price, span] stack among the fields of `this`
function stackOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const all = Object.entries(o).filter(([, v]) => Array.isArray(v) && v.every(isPair));
  return all.find(([k]) => /st|stack|stk/i.test(k)) || all[0] || null;
}
const show = (st) => (st.length ? st.map(([p, s]) => `${p}:${s}`).join(', ') : 'empty');
const priceOf = (ctx, op) => {
  const a = ctx.ops?.[op];
  return a && a.name !== 'StockSpanner' && Number.isFinite(a.args?.[0]) ? a.args[0] : undefined;
};

export default {
  id: 'online-stock-span',
  metaphor: 'Climb over lower days, swallow them',
  caption: 'The stack keeps earlier days as price:span, prices falling towards the top. A new price swallows every top day that is not higher, together with the days that day had already swallowed.',
  narrate(ctx) {
    const price = priceOf(ctx, ctx.op);
    const st = stackOf(ctx.vars);
    const was = stackOf(ctx.prev);
    if (price === undefined || !st) return null;
    if (!was || was[0] !== st[0]) return null;
    const now = st[1];
    const before = was[1];
    if (now.length === before.length - 1 && isPair(before.at(-1))) {
      const [p, s] = before.at(-1);
      return `${price} ≥ ${p}: swallow it with the ${s} day${s > 1 ? 's' : ''} it spanned`;
    }
    if (now.length === before.length + 1 && now.at(-1)[0] === price) {
      const span = now.at(-1)[1];
      const stop = now.at(-2);
      return `${price} stops ${stop ? `at ${stop[0]} (higher)` : 'at the start (no higher day)'}: span ${span} · stack: ${show(now)}`;
    }
    return null;
  },
  // right before a new day's price arrives: what will its span be?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || nx.op === ctx.op || !Array.isArray(ctx.result)) return null;
    const price = priceOf(ctx, nx.op);
    const st = stackOf(ctx.vars);
    const r = ctx.result[nx.op];
    if (price === undefined || !st || st[1].length < 3 || !Number.isInteger(r)) return null;
    const under = st[1].slice().reverse();
    const k = under.findIndex(([p]) => p > price);
    const popped = k === -1 ? under : under.slice(0, k);
    const right = 1 + popped.reduce((t, [, s]) => t + s, 0);
    return options(
      `Day ${nx.op}: price ${price} arrives. Stack (price:span, top last): ${show(st[1])}. What is its span?`,
      r,
      [1, 1 + popped.length, right + 1, right - 1].filter((x) => x >= 1 && x !== r),
      r === right
        ? popped.length
          ? `${price} swallows ${popped.map(([p, s]) => `${p}:${s}`).join(' and ')}: 1 (today) + ${popped.map(([, s]) => s).join(' + ')} = ${r}.`
          : `The top price ${st[1].at(-1)[0]} is higher than ${price}, so it blocks at once: only today counts.`
        : `This run's next(${price}) returned ${r}; swallowing the top days would give ${right}.`,
    );
  },
  bugs: [
    {
      label: 'Pop on < only: equal prices stop the span',
      find: 'this.st[this.st.length - 1][0] <= price',
      replace: 'this.st[this.st.length - 1][0] < price',
      explain: 'A day with the same price belongs to the span, but < stops there: 7, 7, 7 gives spans 1, 1, 1 instead of 1, 2, 3.',
    },
    {
      label: 'Count one day per pop instead of its span',
      find: 'span += this.st.pop()[1];',
      replace: 'this.st.pop(); span += 1;',
      explain: 'A popped day had already swallowed earlier days; adding 1 forgets them, so 90 after 50, 60, 70, 80, 40 gets 3 instead of 6.',
    },
  ],
};
