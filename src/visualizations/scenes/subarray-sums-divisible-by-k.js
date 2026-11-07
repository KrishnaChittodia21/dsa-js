// Subarray Sums Divisible by K (prefix remainders + tally). A clock with k hours: the hand moves forward by every
// number (backward for negatives). Two moments with the hand on the same hour enclose a stretch whose sum is a
// multiple of k. Works with a tally array or a Map / object, and any name for the hour.
import { entriesOf, firstInt, options, row } from './util.js';

const MOD = ['rem', 'r', 'mod', 'm', 'key', 'remainder', 'md'];
const SUM = ['prefix', 'pre', 'sum', 'cur', 'curr', 'running', 'p', 's', 'prefixSum'];
const norm = (v, k) => ((v % k) + k) % k;
const TOTAL = ['total', 'count', 'res', 'result', 'ans', 'answer', 'cnt'];
const ADD = ['x', 'num', 'n', 'v', 'val', 'value', 'a', 'el'];
const AT = ['i', 'j', 'idx'];

/** [name, Map hour → marks] of the tally: an int array of length k, or a Map / object counter */
function tallyOf(vars, k, skip) {
  for (const [name, v] of Object.entries(vars)) {
    if (skip.includes(name)) continue;
    const a = row(v);
    if (a && a.length === k && a.every(Number.isInteger)) return [name, new Map(a.map((n, h) => [h, n]))];
    const e = entriesOf(v);
    if (e && e.every(([h, n]) => Number.isInteger(Number(h)) && Number.isInteger(n))) return [name, new Map(e.map(([h, n]) => [Number(h), n]))];
  }
  return null;
}
const times = (n) => `${n} time${n === 1 ? '' : 's'}`;

export default {
  id: 'subarray-sums-divisible-by-k',
  metaphor: 'A clock hand landing on old hours',
  caption: 'The clock has k hours; each number moves the hand that far (negatives turn it back). The tally counts landings per hour: every earlier landing on the same hour starts a stretch divisible by k.',
  compare: 'total',
  narrate(ctx) {
    const [numsName, kName] = ctx.params;
    const k = ctx.vars[kName];
    if (!Number.isInteger(k) || k <= 0) return null;
    const [mName, m] = firstInt(ctx.vars, MOD);
    const [sName, s] = firstInt(ctx.vars, SUM);
    const h = mName ? m : sName ? norm(s, k) : undefined;
    const [tName, t] = firstInt(ctx.vars, TOTAL);
    const tally = tallyOf(ctx.vars, k, [numsName]);
    const was = tallyOf(ctx.prev, k, [numsName]);
    if (tName && Number.isInteger(ctx.prev[tName]) && t > ctx.prev[tName] && h !== undefined) {
      const n = t - ctx.prev[tName];
      return `hour ${h} was landed on ${times(n)} before: ${n} new stretch${n === 1 ? '' : 'es'} divisible by ${k} end${n === 1 ? 's' : ''} here (${tName} = ${t})`;
    }
    if (tName && h !== undefined && tally && t === ctx.prev[tName] && !tally[1].get(h) && new RegExp(`\\b${tName}\\s*(\\+=|\\+\\+)`).test(ctx.src || '')) {
      return `hour ${h} was never landed on before: no stretch divisible by ${k} ends here yet`;
    }
    const start = tally && tally[1].get(0) === 1 && (!was || (tally[0] === was[0] && !was[1].get(0))) && !mName && !sName;
    if (start) return 'the hand starts at hour 0 (nothing added yet), marked once';
    if (tally && was && tally[0] === was[0]) {
      const hour = [...tally[1].keys()].find((x) => tally[1].get(x) !== (was[1].get(x) || 0));
      if (hour !== undefined) return `mark hour ${hour}: the hand has landed there ${times(tally[1].get(hour))}`;
    }
    if (mName && m !== ctx.prev[mName]) {
      if (!(mName in ctx.prev) && m === 0 && !(sName && sName in ctx.prev)) return null; // just declared
      if (m < 0) return `${mName} = ${m}: JavaScript keeps the sign, but a ${k}-hour clock has no hour ${m} (add ${k})`;
      if (m >= k) return null;
      return Number.isInteger(ctx.prev[mName]) && ctx.prev[mName] >= 0 ? `the hand moves from hour ${ctx.prev[mName]} to hour ${m}` : `the hand lands on hour ${m}`;
    }
    if (mName && ADD.some((n) => n in ctx.vars && n in ctx.prev && ctx.vars[n] !== ctx.prev[n])) return `the hand goes a whole number of turns and stays on hour ${m}`;
    if (sName && !mName && Number.isInteger(ctx.prev[sName]) && s !== ctx.prev[sName]) return `the running sum is ${s}: on a ${k}-hour clock that is hour ${norm(s, k)}`;
    return null;
  },
  // before the hand moves across 12 o'clock (wraps forward or turns back past 0): where does it land?
  predict(ctx) {
    if (!ctx.next) return null;
    const [numsName, kName] = ctx.params;
    const k = ctx.vars[kName];
    const nums = row(ctx.vars[numsName]);
    if (!Number.isInteger(k) || k <= 1 || !nums) return null;
    const nx = ctx.next.vars;
    let h;
    let nh;
    let x;
    const [mName, m] = firstInt(ctx.vars, MOD);
    const [sName, s] = firstInt(ctx.vars, SUM);
    if (mName && m >= 0 && m < k && Number.isInteger(nx[mName])) {
      // the running remainder itself moves: the number added is the loop value in the next step, or nums[i]
      h = m;
      nh = nx[mName];
      const [xName, x0] = firstInt(nx, ADD);
      const [iName, i] = firstInt(nx, AT);
      x = xName && x0 !== ctx.vars[xName] ? x0 : iName && i !== ctx.vars[iName] ? nums[i] : undefined;
      if (!Number.isInteger(x) || norm(h + x, k) !== nh) return null;
    } else if (!mName && sName && Number.isInteger(nx[sName]) && nx[sName] !== s) {
      // a raw running sum: the hour is its remainder
      h = norm(s, k);
      x = nx[sName] - s;
      nh = norm(nx[sName], k);
    } else return null;
    if (h + x >= 0 && h + x < k) return null;
    const wrong = [h + x, (h + x) % k, h, (nh + 1) % k].filter((v) => v !== nh);
    return options(`The hand is on hour ${h} of ${k}; the next number is ${x}. Which hour does it land on?`, nh, wrong, `${h} + ${x} = ${h + x}, which on a ${k}-hour clock is hour ${nh}${h + x < 0 ? ` (add ${k} to a negative remainder)` : ''}.`);
  },
  bugs: [
    {
      label: 'Forget the start mark at hour 0',
      find: 'count[0] = 1;',
      replace: 'count[0] = 0;',
      explain: 'The empty start is not counted, so a stretch beginning at index 0 (like [-5] with k = 5) is never paired.',
    },
    {
      label: 'Keep JavaScript\'s negative remainder',
      find: '(((rem + x) % k) + k) % k',
      replace: '(rem + x) % k',
      explain: '-1 % 2 is -1 in JavaScript, not 1, so the hand lands on an hour that is not on the clock and the tally reads garbage.',
    },
  ],
};
