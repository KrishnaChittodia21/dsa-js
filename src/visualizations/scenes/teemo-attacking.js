// Teemo Attacking: a poison timer on a clock. Each hit starts a timer of `duration` seconds; a hit that lands while
// the timer still runs resets it, so between two hits only min(duration, gap) seconds count, and the last hit counts fully.
import { options } from './util.js';

const TOTAL = ['total', 'sum', 'res', 'result', 'ans', 'answer', 'poisoned', 'count', 'out', 'secs', 'seconds'];
const IDX = ['i', 'j', 'k', 'idx', 'index'];

const totalOf = (vars, params) => TOTAL.find((n) => !params.includes(n) && Number.isInteger(vars?.[n]));
const idxOf = (vars) => IDX.find((n) => Number.isInteger(vars?.[n]));

/** what the total just gained, read as one attack: { t, t2, gap } (t2 undefined for the last attack), or null */
function attackFor(ctx, vars, delta) {
  const [tsName, dName] = ctx.params;
  const ts = vars[tsName];
  const d = vars[dName];
  if (!Array.isArray(ts) || !Number.isInteger(d)) return null;
  const n = idxOf(vars);
  if (n === undefined) return delta === d && ts.length ? { t: ts[ts.length - 1] } : null;
  const i = vars[n];
  // the index may name the earlier hit (i, i+1) or the later one (i-1, i): the code's `[i - 1]` tells which
  const code = (ctx.lines || []).join('\n');
  const back = new RegExp(`\\[\\s*${n}\\s*-\\s*1\\s*\\]`).test(code);
  for (const a of back ? [i - 1, i] : [i, i - 1]) {
    if (a < 0 || a + 1 >= ts.length) continue;
    const gap = ts[a + 1] - ts[a];
    if (delta === Math.min(d, gap)) return { t: ts[a], t2: ts[a + 1], gap };
  }
  return null;
}

export default {
  id: 'teemo-attacking',
  metaphor: 'A poison timer that hits reset',
  caption: 'Each hit starts a poison timer of `duration` seconds. A new hit before the timer runs out resets it, so between two hits only the shorter of the gap and the duration counts; the last hit runs its full time.',
  narrate(ctx) {
    const [, dName] = ctx.params;
    const d = ctx.vars[dName];
    const name = totalOf(ctx.vars, ctx.params);
    if (!name) return null;
    const tot = ctx.vars[name];
    if (!ctx.next && Number.isInteger(ctx.result) && Number.isInteger(d) && ctx.result === tot + d) return `the last hit runs its full ${d}s: ${tot} + ${d} = ${ctx.result} seconds poisoned in all`;
    if (!(name in ctx.prev) || ctx.prev[name] === tot) return null;
    const delta = tot - ctx.prev[name];
    const a = attackFor(ctx, ctx.vars, delta);
    if (!a) return null;
    if (a.t2 === undefined) return `the last hit at ${a.t} has nothing after it: its full ${d}s count (total ${tot}s)`;
    if (a.gap < d) return `the hit at ${a.t} is cut short: the next hit at ${a.t2} resets the timer, so only ${a.gap}s count (total ${tot}s)`;
    return `the hit at ${a.t} wears off after its full ${d}s, before the next hit at ${a.t2} (total ${tot}s)`;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [, dName] = ctx.params;
    const d = ctx.vars[dName];
    const name = totalOf(ctx.vars, ctx.params);
    if (!name || !Number.isInteger(d)) return null;
    const tot = ctx.vars[name];
    // just before the return: the learner's own result is the answer
    if (ctx.next.ret && Number.isInteger(ctx.result) && ctx.result !== tot) {
      return options(`The gaps add up to ${tot}s and the poison lasts ${d}s. What does the function return?`, ctx.result, [tot, tot + d, d, tot + 2 * d].filter((x) => x !== ctx.result), ctx.result === tot + d ? `The last hit is never reset by a later one, so its full ${d}s are added: ${tot} + ${d}.` : `Their code returns ${ctx.result}.`);
    }
    const after = ctx.next.vars[name];
    if (!Number.isInteger(after) || after === tot) return null;
    const delta = after - tot;
    const a = attackFor(ctx, ctx.next.vars, delta);
    if (!a) return null;
    if (a.t2 === undefined) return options(`The last hit lands at ${a.t} and the poison lasts ${d}s. How many seconds does it add?`, delta, [0, d - 1, 2 * d].filter((x) => x >= 0), `Nothing comes after it to reset the timer, so it runs its full ${d}s.`);
    return options(
      `A hit at ${a.t}, the next hit at ${a.t2}, the poison lasts ${d}s. How many seconds does the hit at ${a.t} add?`,
      delta,
      [d, a.gap, Math.abs(d - a.gap), d + a.gap].filter((x) => x !== delta),
      a.gap < d ? `The next hit comes after ${a.gap}s and resets the timer, so only min(${d}, ${a.gap}) = ${a.gap}s count.` : `The poison wears off after ${d}s, before the next hit (${a.gap}s later): min(${d}, ${a.gap}) = ${d}.`,
    );
  },
  bugs: [
    {
      label: 'Add the full duration for every hit',
      find: 'Math.min(duration, timeSeries[i + 1] - timeSeries[i])',
      replace: 'duration',
      explain: 'Overlapping timers are counted twice: hits at 1 and 2 with duration 2 give 4 seconds instead of 3.',
    },
    {
      label: 'Forget the last hit',
      find: 'return total + duration;',
      replace: 'return total;',
      explain: 'The loop only counts each hit up to the next one, so the final hit\'s full duration is lost.',
    },
  ],
};
