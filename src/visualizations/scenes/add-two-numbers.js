// Scene: Add Two Numbers. Column addition on paper, written right to left: the lists hold the digits ones-first,
// so each round adds one column (digit + digit + carry), writes one digit and carries the rest.
import { firstInt } from './util.js';

const SUM = ['sum', 's', 'total', 'val', 'v', 'digitSum'];
const CARRY = ['carry', 'c', 'cy'];
const list = (v) => (v && v.$list && Array.isArray(v.$list.values) ? v.$list.values : null);
const headOf = (v) => (v === null ? 0 : list(v)?.[0]);
// the answer list being built: the non-parameter list that grew, longest first
function grown(vars, before, params) {
  let best = null;
  for (const [k, v] of Object.entries(vars)) {
    const a = list(v);
    const b = list(before?.[k]);
    if (params.includes(k) || !a || !b || a.length !== b.length + 1) continue;
    if (!best || a.length > best.length) best = a;
  }
  return best;
}

export default {
  id: 'add-two-numbers',
  metaphor: 'Column addition, one digit at a time',
  caption: 'Both lists start at the ones digit, so walking them together is adding the columns of a sum on paper from right to left. Each column writes one digit and carries 1 when it reaches 10.',
  compare: 'carry',
  narrate(ctx) {
    const [aName, bName] = ctx.params;
    const out = grown(ctx.vars, ctx.prev, ctx.params);
    const [, sum] = firstInt(ctx.vars, SUM);
    if (out) {
      const d = out[out.length - 1];
      return sum !== undefined && sum % 10 === d
        ? `column total ${sum}: write ${d}${sum >= 10 ? ', carry 1 to the next column' : ', nothing to carry'}`
        : `write down ${d}`;
    }
    const [sName] = firstInt(ctx.vars, SUM);
    const [, carry] = firstInt(ctx.prev, CARRY);
    // the line that sets the column total, unless it also moves along the lists (then the heads are already gone)
    if (sName && new RegExp(`\\b${sName}\\s*[+]?=`).test(ctx.src) && !/\.next\b/.test(ctx.src)) {
      const a = headOf(ctx.vars[aName]);
      const b = headOf(ctx.vars[bName]);
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
      const c = Number.isInteger(carry) ? carry : 0;
      if (a + b + c !== sum) return null;
      const out = !ctx.vars[aName] && !ctx.vars[bName] ? ' (both numbers ran out: only the carry is left)' : '';
      return `next column: ${a} + ${b} + carry ${c} = ${sum}${out}`;
    }
    return null;
  },
  // just before a digit of a carrying column is written: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const out = grown(ctx.next.vars, ctx.vars, ctx.params);
    const [, sum] = firstInt(ctx.vars, SUM);
    if (!out || sum === undefined || sum < 10) return null; // only the columns that carry are worth asking
    const d = out[out.length - 1];
    if (sum % 10 !== d) return null;
    const card = [sum, Math.floor(sum / 10), (d + 1) % 10, (d + 9) % 10];
    const opts = [...new Set([d, ...card.filter((x) => x !== d)])].slice(0, 4).sort((a, b) => a - b);
    return {
      question: `This column adds up to ${sum}. Which digit goes into the answer list?`,
      options: opts.map(String),
      answer: opts.indexOf(d),
      explain: `Only the ones digit, ${sum} % 10 = ${d}, is written here; the 1 from the tens is carried to the next column.`,
    };
  },
  bugs: [
    {
      label: 'Forget the last carry',
      find: 'while (l1 || l2 || carry)',
      replace: 'while (l1 || l2)',
      explain: 'When the last column reaches 10 (5 + 5), the loop stops before writing the carried 1, so the answer is one digit short.',
    },
    {
      label: 'Stop when the shorter number ends',
      find: 'while (l1 || l2 || carry)',
      replace: 'while (l1 && l2)',
      explain: 'The longer number still has digits (plus maybe a carry), but the loop ends with the shorter one, so its top digits are lost.',
    },
  ],
};
