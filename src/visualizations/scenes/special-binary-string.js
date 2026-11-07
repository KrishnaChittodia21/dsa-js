// Scene: Special Binary String. Read 1 as a step up and 0 as a step down: the string is a row of mountains.
// Each return to ground closes one mountain "1" + inside + "0"; the inside is made as large as possible first (a
// call of its own), then the mountains are sorted biggest first. Works with any names for the height counter,
// the block list and the inside, found by what the code does with them.
import { options, row } from './util.js';

const q = (t) => `"${t}"`;
/** the height counter: an int changed on this line by ±1 */
function heightStep(ctx) {
  const m = /\b([A-Za-z_$][\w$]*)\s*(?:\+=|-=|\+\+|--|=\s*\1\s*[+-])/.exec(ctx.src || '');
  const k = m && m[1];
  const v = k && ctx.vars[k];
  return Number.isInteger(v) && Number.isInteger(ctx.prev[k]) && Math.abs(v - ctx.prev[k]) === 1 ? [k, v, ctx.prev[k]] : null;
}
/** [name, list] of the mountain list: a string array that is not the parameter */
const blocksOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && row(v) && v.every((x) => typeof x === 'string'));
const desc = (a) => [...a].sort((x, y) => (x < y ? 1 : x > y ? -1 : 0));
const asc = (a) => [...a].sort();
const same = (a, b) => a.length === b.length && desc(a).join() === desc(b).join();

export default {
  id: 'special-binary-string',
  metaphor: 'A row of mountains, biggest first',
  caption: 'A 1 climbs one step, a 0 comes down one. Each return to ground closes a mountain: its inside is made as large as possible first, then the mountains are lined up biggest first.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    if (ctx.ret && typeof ctx.value === 'string') {
      if (!ctx.next) return `the largest arrangement: ${q(ctx.value)}`;
      if (s === '') return 'an empty inside stays empty';
      return ctx.value === s ? `${q(s)} is already as large as it gets: hand it back up` : `${q(s)} becomes ${q(ctx.value)}: hand it back up`;
    }
    const h = heightStep(ctx);
    if (h) {
      const [, v, was] = h;
      const i = (/\[\s*([A-Za-z_$][\w$]*)\s*\]/.exec(ctx.src || '') || [])[1];
      const at = Number.isInteger(ctx.vars[i]) ? ` (position ${ctx.vars[i]})` : '';
      if (v === 0) return `a 0${at} brings us back to ground: one mountain is closed`;
      return v > was ? `a 1${at}: climb to height ${v}` : `a 0${at}: down to height ${v}`;
    }
    // the inside of a mountain was cut out
    const cut = /\b([A-Za-z_$][\w$]*)\s*=\s*[^;]*\.(?:slice|substring|substr)\(/.exec(ctx.src || '');
    if (cut && typeof ctx.vars[cut[1]] === 'string') {
      const t = ctx.vars[cut[1]];
      return t ? `inside the mountain: ${q(t)}: make it as large as possible first (a call of its own)` : 'this mountain is just "10": its inside is empty';
    }
    const b = blocksOf(ctx.vars, ctx.params);
    if (b && /\.push\(/.test(ctx.src || '') && b[1].length) return `mountain ${q(b[1][b[1].length - 1])} joins the row: ${b[1].join(' · ')}`;
    const bw = b && row(ctx.prev[b[0]]);
    if (b && bw && /sort/.test(ctx.src || '') && b[1].length > 1 && same(b[1], bw)) {
      const now = b[1];
      return now.join() === bw.join() ? `already biggest first: ${now.join(' · ')}` : `line the mountains up biggest first: ${now.join(' · ')}`;
    }
    if (ctx.index === 0 || (sName in ctx.prev && s !== ctx.prev[sName] && (!b || !b[1].length))) return s ? `${ctx.index ? 'new call' : 'start'}: make ${q(s)} as large as possible` : 'new call on an empty inside';
    return null;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const b = blocksOf(ctx.vars, ctx.params);
    const nb = b && row(nx.vars[b[0]]);
    if (!b || !nb) return null;
    const cur = b[1];
    // the sort: which order do the mountains end up in?
    if (nb.length === cur.length && cur.length > 1 && same(nb, cur) && /sort/.test(ctx.lines[nx.line - 1] || '')) {
      return options('The mountains are about to be sorted. Which order do they end up in?', nb.join(' · '), [cur.join(' · '), asc(cur).join(' · '), desc(cur).join(' · ')], 'Mountains next to each other may swap places, so put the biggest (in string order) first; that makes the whole string largest.');
    }
    // the inside came back: what mountain joins the row?
    if (ctx.ret && typeof ctx.value === 'string' && ctx.value && /\.push\(/.test(ctx.lines[nx.line - 1] || '') && nb.length) {
      const added = nb[nb.length - 1];
      return options(
        `The inside came back as ${q(ctx.value)}. Which mountain joins the row?`,
        added,
        [ctx.value, `0${ctx.value}1`, `${ctx.value}10`],
        `Wrap the improved inside in its own climb and descent: "1" + ${q(ctx.value)} + "0" = ${q(added)}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Sort the mountains smallest first',
      find: 'blocks.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));',
      replace: 'blocks.sort();',
      explain: 'The default sort is ascending, so the smallest mountain comes first and the string gets smaller, not larger: "101100" stays "101100" instead of "110010".',
    },
    {
      label: 'Keep each inside as it is',
      find: "'1' + makeLargestSpecial(inner) + '0'",
      replace: "'1' + inner + '0'",
      explain: 'Only the top-level mountains get sorted; the mountains inside each one keep their order, so "11011000" stays as it is instead of becoming "11100100".',
    },
  ],
};
