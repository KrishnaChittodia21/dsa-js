// Defuse the Bomb (circular sliding window). Seats around a round table: each seat writes down the sum of its k
// neighbours ahead (or |k| behind when k < 0). The window slides one seat: one value leaves, one enters, and indices
// past the end wrap around with % n. Works with a running sum under a sum-like name, any result array name.
import { firstInt, options, row } from './util.js';

const SUM = /^(sum|total|win|window|windowSum|cur|curr|s)$/i;
const sumOf = (vars) => Object.entries(vars).find(([k, v]) => SUM.test(k) && Number.isInteger(v)) || [];
const AT = ['i', 'idx', 'seat', 'pos'];
// the answer array: same length as code, not code itself
const resultOf = (vars, cName) => {
  const c = row(vars[cName]);
  return c ? Object.entries(vars).find(([k, v]) => k !== cName && row(v) && v.length === c.length) || null : null;
};

export default {
  id: 'defuse-the-bomb',
  metaphor: 'Seats around a round table',
  caption: 'The code is a ring of seats. Each seat writes down the sum of the next k seats (the previous |k| when k is negative). The window slides one seat at a time: one value leaves, one enters, and past the last seat it wraps to seat 0.',
  narrate(ctx) {
    const [cName, kName] = ctx.params;
    const code = row(ctx.vars[cName]);
    const k = ctx.vars[kName];
    if (!code || !Number.isInteger(k)) return null;
    const n = code.length;
    const res = resultOf(ctx.vars, cName);
    const before = res && row(ctx.prev[res[0]]);
    if (res && before && before.length === n) {
      const d = res[1].map((x, j) => (x === before[j] ? -1 : j)).filter((j) => j >= 0);
      if (d.length === 1) {
        const j = d[0];
        return `seat ${j} writes down ${res[1][j]}: the sum of the ${Math.abs(k)} seat${Math.abs(k) > 1 ? 's' : ''} ${k > 0 ? 'after' : 'before'} it`;
      }
    }
    const [sName, sum] = sumOf(ctx.vars);
    const was = sName && ctx.prev[sName];
    if (!sName || !Number.isInteger(was) || sum === was) return null;
    const delta = sum - was;
    const [, i] = firstInt(ctx.vars, AT);
    if (sum === 0) return i === undefined ? null : `seat ${i} starts a fresh sum`;
    const start = ctx.vars.start;
    const end = ctx.vars.end;
    if (delta < 0) {
      const at = Number.isInteger(start) && code[((start % n) + n) % n] === -delta ? ` (seat ${((start % n) + n) % n})` : '';
      return `${-delta}${at} leaves the window · window sum ${sum}`;
    }
    const at = Number.isInteger(end) && code[((end % n) + n) % n] === delta ? ` (seat ${((end % n) + n) % n}${end >= n ? `, wrapped from ${end}` : ''})` : '';
    const first = res && row(res[1])?.every((x) => x === 0) ? 'joins the first window' : 'enters the window';
    return `${delta}${at} ${first} · window sum ${sum}`;
  },
  // before a value enters the window: which one? Asked when the entering index runs past the end (the wrap)
  predict(ctx) {
    const [cName] = ctx.params;
    const code = row(ctx.vars[cName]);
    const [sName, sum] = sumOf(ctx.vars);
    if (!code || !sName || !ctx.next) return null;
    const n = code.length;
    const after = ctx.next.vars[sName];
    const end = ctx.vars.end;
    if (!Number.isInteger(after) || after <= sum) return null;
    const delta = after - sum;
    if (!code.includes(delta)) return null;
    if (Number.isInteger(end)) {
      // ask only on the wrap: end has just moved past the last seat
      if (end < n || ctx.prev.end === end) return null;
      const seat = end % n;
      if (code[seat] !== delta) return null;
      const wrong = [...new Set(code.filter((x) => x !== delta))].slice(0, 3);
      return options(`The window's front moves to position ${end}, past the last seat (n = ${n}). Which value enters the window?`, delta, wrong, `${end} % ${n} = ${seat}: the window wraps around to seat ${seat}, which holds ${delta}.`);
    }
    return null; // shortcut: no window ends (e.g. a fresh sum per seat), so no wrap moment to ask about
  },
  bugs: [
    {
      label: 'Negative k: start at k instead of n + k',
      find: 'let start = k > 0 ? 1 : n + k;',
      replace: 'let start = k > 0 ? 1 : k;',
      explain: 'In JavaScript (-2) % 4 is -2, not 2, so code[-2] is undefined and the window sum becomes NaN for k < 0.',
    },
    {
      label: 'Window includes the seat itself',
      find: 'let start = k > 0 ? 1 : n + k;',
      replace: 'let start = k > 0 ? 0 : n + k;',
      explain: 'For k > 0 the window starts at the seat itself, so every seat adds its own value once too many: [5, 7, 1, 4] with k = 3 gives 17 instead of 12.',
    },
  ],
};
