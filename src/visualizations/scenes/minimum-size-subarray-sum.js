// Minimum Size Subarray Sum (variable sliding window, all numbers positive). A train of coin wagons: hook wagons on
// at the front until the load reaches the target, then unhook from the back while it still does. Works with
// left/l/start/i + right/r/end/j, a running sum under a few common names and best / ans / minLen.
import { options, row } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const SUM = ['sum', 'total', 'cur', 'curr', 'current', 'window', 'windowSum', 'acc', 's'];
const BEST = ['best', 'ans', 'res', 'result', 'minLen', 'minLength', 'shortest', 'min', 'answer'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const sumOf = (vars) => SUM.find((n) => Number.isInteger(vars[n]));
const bestOf = (vars) => BEST.find((n) => typeof vars[n] === 'number');
const show = (v) => (v === Infinity ? 'none yet' : v);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
// right end of the train: r itself, or r - 1 when the code measures r - l (r already moved past the last wagon)
const lastOf = (ctx, l, r, lName, rName) => (new RegExp(`\\b${rName}\\s*-\\s*${lName}\\b(?!\\s*\\+\\s*1)`).test((ctx.lines || []).join('\n')) ? r - 1 : r);
const isReturn = (ctx) => /^\s*(if\s*\(.*\)\s*)?return\b/.test(ctx.lines[ctx.next.line - 1] || '');

export default {
  id: 'minimum-size-subarray-sum',
  metaphor: 'A train of coin wagons',
  caption: 'The bracket is the train. New wagons hook on at the right until the load reaches the target; then wagons come off the left while the load still reaches it, and each such train is measured.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const [tName, nName] = ctx.params;
    const t = ctx.vars[tName];
    const nums = row(ctx.vars[nName]);
    const sName = sumOf(ctx.vars);
    const pair = pairOf(ctx.vars);
    if (!nums || !sName || !pair) return null;
    const [lName, rName] = pair;
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    const sum = ctx.vars[sName];
    const was = ctx.prev[sName];
    const bName = bestOf(ctx.vars);
    if (Number.isInteger(was) && sum > was) return `hook on wagon ${r} (${plural(nums[r], 'coin')}): the train ${l}..${r} carries ${sum}, target ${t}`;
    if (Number.isInteger(was) && sum < was) return `unhook wagon ${l - (l !== ctx.prev[lName] ? 1 : 0)} (${plural(was - sum, 'coin')}) from the left: ${sum} coins left, target ${t}`;
    if (bName && sum >= t && ctx.prev[bName] !== undefined && new RegExp(`\\b${bName}\\s*=`).test(ctx.lines[ctx.line - 1] || '')) {
      const e = lastOf(ctx, l, r, lName, rName);
      const len = e - l + 1;
      const b = ctx.vars[bName];
      return b < ctx.prev[bName] ? `${sum} ≥ ${t}: the train ${l}..${e} is long enough, ${plural(len, 'wagon')} · new shortest: ${b}` : `${sum} ≥ ${t}: the train ${l}..${e} works, but ${plural(len, 'wagon')} is not shorter than ${show(b)}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [tName] = ctx.params;
    const t = ctx.vars[tName];
    const sName = sumOf(ctx.vars);
    const pair = pairOf(ctx.vars);
    if (!sName || !pair || !Number.isInteger(t)) return null;
    const [lName, rName] = pair;
    const nx = ctx.next.vars;
    const sum = ctx.vars[sName];
    const was = ctx.prev[sName];
    const l = ctx.vars[lName];
    const r = ctx.vars[rName];
    // right after a wagon came off (sum and left both updated): does the shorter train still carry enough?
    const dropped = (Number.isInteger(was) && sum < was) || (Number.isInteger(ctx.prev[lName]) && l === ctx.prev[lName] + 1);
    if (!dropped || nx[sName] === undefined || nx[lName] !== l || nx[sName] < sum) return null;
    const bName = bestOf(ctx.vars);
    const grows = nx[rName] !== r || nx[sName] > sum || isReturn(ctx);
    const measured = !grows && !!bName && new RegExp(`\\b${bName}\\s*=`).test(ctx.lines[ctx.next.line - 1] || '');
    if (grows === measured) return null;
    if (grows !== sum < t) return null; // the run must agree with the rule, or we are misreading the names
    const yes = 'Still enough: measure this shorter train';
    const no = 'Too light now: hook on the next wagon';
    return {
      question: `The train ${l}..${lastOf(ctx, l, r, lName, rName)} now carries ${sum} coins (target ${t}). What happens next?`,
      options: [yes, no],
      answer: measured ? 0 : 1,
      explain: measured ? `${sum} ≥ ${t}, so this shorter train still works: record its length and try dropping another wagon.` : `${sum} < ${t}, so dropping more wagons cannot help: grow the train on the right instead.`,
    };
  },
  bugs: [
    {
      label: 'if instead of while: unhook only one wagon',
      find: 'while (sum >= target)',
      replace: 'if (sum >= target)',
      explain: 'Only one wagon comes off per new wagon, so a train that could lose several wagons at once is never measured at its shortest.',
    },
    {
      label: 'Return Infinity when no train is heavy enough',
      find: 'return best === Infinity ? 0 : best;',
      replace: 'return best;',
      explain: 'When even the whole array falls short, best is never set and Infinity comes back instead of 0.',
    },
  ],
};
