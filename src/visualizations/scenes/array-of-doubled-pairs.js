// Array of Doubled Pairs (count Map, keys by |x|). Dancers pair up: every dancer needs a partner exactly twice their
// number. Walking from the smallest |x| up, the smallest unmatched dancer has only one choice: 2x. Works with a Map
// or an object as the counter and any loop names; the keys are found as a row of the counter's keys.
import { entriesOf, options, row } from './util.js';

const AT = ['x', 'key', 'k', 'v', 'val', 'num', 'n', 'a'];
const counterOf = (vars, skip) => Object.entries(vars).find(([name, v]) => name !== skip && entriesOf(v) && entriesOf(v).every(([, n]) => Number.isInteger(n)));
const asMap = (v) => new Map((entriesOf(v) || []).map(([key, n]) => [Number(key), n]));
const copies = (n) => `${n} cop${n === 1 ? 'y' : 'ies'}`;
/** the value being matched now: an integer loop name whose count is in the counter */
const atOf = (vars, m) => AT.find((n) => Number.isInteger(vars[n]) && m.has(vars[n]));

export default {
  id: 'array-of-doubled-pairs',
  metaphor: 'Dancers pairing with their double',
  caption: 'The counter says how many dancers carry each number still waiting. From the smallest size up, each waiting x must take a 2x partner; if too few 2x are left, the dance fails.',
  narrate(ctx) {
    const arrName = ctx.params[0];
    const cnt = counterOf(ctx.vars, arrName);
    if (!cnt) return null;
    const m = asMap(cnt[1]);
    const was = cnt[0] in ctx.prev ? asMap(ctx.prev[cnt[0]]) : null;
    const xName = atOf(ctx.vars, m);
    const x = xName ? ctx.vars[xName] : undefined;
    // sorted keys appear
    const keys = Object.entries(ctx.vars).find(([name, v]) => name !== arrName && !(name in ctx.prev) && row(v) && v.length === m.size && v.every((y) => m.has(y)));
    if (keys) {
      const byAbs = keys[1].every((y, i) => i === 0 || Math.abs(keys[1][i - 1]) <= Math.abs(y));
      return byAbs ? `line the numbers up by size, ignoring the sign: ${keys[1].join(', ')}` : `line the numbers up: ${keys[1].join(', ')} (not by size ignoring the sign, so a negative may meet its double first)`;
    }
    if (was) {
      const changed = [...m.keys()].filter((y) => m.get(y) !== was.get(y));
      if (changed.length === 1) {
        const y = changed[0];
        const before = was.get(y) || 0;
        if (m.get(y) > before && m.get(y) === before + 1 && (!xName || x === y)) return `count a dancer with ${y}: ${copies(m.get(y))} so far`;
        if (m.get(y) < before && Number.isInteger(x) && y === 2 * x && x !== 0) return `${copies(before - m.get(y))} of ${x} paired off with ${copies(before - m.get(y))} of ${y}: ${copies(m.get(y))} of ${y} still free`;
        if (m.get(y) < before) return `${copies(before - m.get(y))} of ${y} used up in pairs: ${copies(m.get(y))} left`;
      }
    }
    if (xName && x !== ctx.prev[xName]) {
      const c = m.get(x);
      if (c === 0) return `${x}: every copy was already taken as someone's double, skip it`;
      if (x === 0) return `${copies(c)} of 0 waiting: 0 is its own double, so they pair among themselves (needs an even count)`;
      return `${copies(c)} of ${x} waiting; each needs a ${2 * x} (${copies(m.get(2 * x) || 0)} of ${2 * x} left)`;
    }
    return null;
  },
  // a non-zero x with waiting copies is up: does it pair, or is the answer false?
  predict(ctx) {
    if (!ctx.next) return null;
    const cnt = counterOf(ctx.vars, ctx.params[0]);
    if (!cnt) return null;
    const m = asMap(cnt[1]);
    const xName = atOf(ctx.vars, m);
    if (!xName) return null;
    const x = ctx.vars[xName];
    const c = m.get(x);
    const d = m.get(2 * x) || 0;
    if (x === 0 || !(c > 0)) return null;
    // ask once per x: not while the same x is already pairing up
    if (ctx.prev[xName] === x && cnt[0] in ctx.prev && asMap(ctx.prev[cnt[0]]).get(2 * x) !== m.get(2 * x)) return null;
    const after = asMap(ctx.next.vars[cnt[0]]);
    const fails = !!ctx.next.ret && /false/.test(ctx.lines[ctx.next.line - 1] || '');
    const pairs = (after.get(2 * x) || 0) < d;
    if (fails === pairs || fails !== d < c) return null;
    const opts = [`Pair them: ${x} takes partners from the ${2 * x}s`, `Return false: not enough ${2 * x}s left`];
    return {
      question: `${x} is next in line (${copies(c)} waiting); ${copies(d)} of ${2 * x} left. What happens?`,
      options: opts,
      answer: fails ? 1 : 0,
      explain: fails ? `${x} can only pair with ${2 * x} (it is the smallest left, so nobody smaller can take it as a double); ${d} < ${c}, so some ${x} stays alone.` : `${d} ≥ ${c}: every ${x} takes a ${2 * x}, and those ${2 * x}s are no longer free.`,
    };
  },
  bugs: [
    {
      label: 'Sort ascending instead of by |x|',
      find: 'Math.abs(a) - Math.abs(b)',
      replace: 'a - b',
      explain: 'For negatives the double is the smaller number: −8 comes first and looks for −16, though −8 is really the partner of −4.',
    },
    {
      label: 'Never use up the doubles',
      find: 'count.set(2 * x, doubles - c);',
      replace: '',
      explain: 'A 2x that already danced with x stays in the counter, so it later looks for its own double (4x) as if it were still waiting, and a valid line-up is rejected.',
    },
  ],
};
