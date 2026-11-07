// Remove K Digits (greedy monotonic stack). Digits are written down left to right; a smaller digit knocks out
// bigger digits just before it while removals are left. Works with a stack of digit characters (or numbers)
// under any name and any name for the current digit.
import { options, row } from './util.js';

const isDigit = (x) => (typeof x === 'string' && /^[0-9]$/.test(x)) || (Number.isInteger(x) && x >= 0 && x <= 9);
// the written-down digits: a row of digits, preferring stack-like names; never the input
function stackOf(vars, numName) {
  const all = Object.entries(vars).filter(([k, v]) => k !== numName && row(v) && v.every(isDigit));
  return all.find(([k]) => /stack|^st$|^stk$|res|kept|out|ans/i.test(k)) || all[0] || null;
}
// the digit being placed: a one-digit string (or 0–9 number named like a digit), not the input or k
function digitOf(vars, params) {
  const e = Object.entries(vars).find(([k, v]) => !params.includes(k) && typeof v === 'string' && /^[0-9]$/.test(v));
  return e || Object.entries(vars).find(([k, v]) => !params.includes(k) && /^(d|c|ch|digit|dig)$/.test(k) && isDigit(v)) || null;
}
const show = (a) => (a.length ? a.join('') : 'nothing');

export default {
  id: 'remove-k-digits',
  metaphor: 'Smaller digits knock out bigger ones',
  caption: 'Digits are written down left to right. While removals are left, a new digit knocks out the bigger digits just before it, because a smaller digit earlier makes a smaller number. Leftover removals come off the end.',
  narrate(ctx) {
    const [numName, kName] = ctx.params;
    const st = stackOf(ctx.vars, numName);
    const was = st && row(ctx.prev[st[0]]);
    const k = ctx.vars[kName];
    if (Number.isInteger(k) && k === ctx.prev[kName] - 1) return `${k} removal${k === 1 ? '' : 's'} left`;
    if (st && was) {
      const now = st[1];
      const d = digitOf(ctx.vars, ctx.params);
      if (now.length === was.length - 1 && d) return `"${was.at(-1)}" is bigger than the "${d[1]}" after it: knock it out · kept: ${show(now)}`;
      if (now.length < was.length && !d) {
        const cut = was.slice(now.length).join('');
        return `removals left over: cut "${cut}" off the end (the digits there only go up) · kept: ${show(now)}`;
      }
      if (now.length === was.length + 1 && d && String(now.at(-1)) === String(d[1])) {
        const before = was.at(-1);
        const why = before === undefined ? 'nothing kept before it' : Number.isInteger(k) && k === 0 ? 'no removals left' : `"${before}" before it is not bigger`;
        return `write down "${d[1]}" (${why}) · kept: ${show(now)}`;
      }
    }
    // the answer string appears: leading zeros stripped
    const res = /join|slice|substr|replace/.test(ctx.src) && Object.entries(ctx.vars).find(([n, v]) => !(n in ctx.prev) && typeof v === 'string' && /^[0-9]*$/.test(v) && n !== numName);
    if (res && st) return st[1].length ? `strip leading zeros from ${show(st[1])}: the answer is "${res[1]}"` : 'every digit was removed: the answer is "0"';
    return null;
  },
  // right before the next digit is compared with the last one kept: knocked out, or written down?
  predict(ctx) {
    const [numName, kName] = ctx.params;
    const nx = ctx.next;
    const st = stackOf(ctx.vars, numName);
    if (!nx || !st || !st[1].length) return null;
    const was = row(ctx.prev[st[0]]);
    // half done: the pop happened but k has not gone down yet
    if (was && st[1].length === was.length - 1 && ctx.vars[kName] === ctx.prev[kName]) return null;
    const after = row(nx.vars[st[0]]);
    const d = digitOf(nx.vars, ctx.params);
    const k = ctx.vars[kName];
    if (!after || !d || !Number.isInteger(k)) return null;
    const top = st[1].at(-1);
    const popped = after.length === st[1].length - 1;
    const pushed = after.length === st[1].length + 1 && String(after.at(-1)) === String(d[1]);
    if (!popped && !pushed) return null;
    const out = `"${top}" is knocked out`;
    const keep = `"${d[1]}" is written down after "${top}"`;
    return options(
      `Digit "${d[1]}" meets the last kept digit "${top}" (kept: ${show(st[1])}, ${k} removal${k === 1 ? '' : 's'} left). What happens?`,
      popped ? out : keep,
      [popped ? keep : out],
      popped ? `"${top}" > "${d[1]}" and a removal is left: putting the smaller digit earlier makes the number smaller.` : k === 0 ? 'No removals are left, so every digit from now on is kept.' : `"${top}" is not bigger than "${d[1]}", so removing it would not make the number smaller.`,
    );
  },
  bugs: [
    {
      label: 'Forget the leftover removals',
      find: 'while (k > 0) { st.pop(); k--; }',
      replace: '',
      explain: 'When the digits only go up, nothing is knocked out during the scan: "12345" with k = 2 stays "12345" instead of "123".',
    },
    {
      label: 'Do not strip leading zeros',
      find: "st[i] === '0'",
      replace: 'false',
      explain: 'Knocking out the leading 1 of "10200" leaves "0200"; without stripping the zeros the answer is not "200".',
    },
  ],
};
