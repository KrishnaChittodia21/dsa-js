// Max Consecutive Ones (running streak). A row of coin flips, 1 = heads: count the current streak of heads and
// remember the longest. Works with current/count/streak-like and best/max-like names.
import { options, row } from './util.js';

const CUR = /^(cur|curr|current|count|cnt|c|streak|run|len|length|ones|k|temp|tmp)$/i;
const BEST = /best|max|ans|res|longest|top/i;
const X = ['x', 'n', 'num', 'v', 'val', 'bit', 'b'];
const IDX = ['i', 'j', 'idx', 'k'];

const intVar = (vars, re, skip) => Object.keys(vars).find((k) => re.test(k) && k !== skip && Number.isInteger(vars[k]));
function flipOf(vars, aName) {
  const a = row(vars[aName]);
  const i = IDX.find((k) => a && Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < a.length);
  if (i) return a[vars[i]];
  const x = X.find((k) => vars[k] === 0 || vars[k] === 1);
  return x === undefined ? undefined : vars[x];
}

export default {
  id: 'max-consecutive-ones',
  metaphor: 'Longest streak of heads',
  caption: 'Each cell is a coin flip: 1 is heads, 0 is tails. The counter is the streak of heads ending here; tails resets it, and the record keeps the longest streak seen.',
  compare: 'current',
  narrate(ctx) {
    const aName = ctx.params[0];
    const curName = intVar(ctx.vars, CUR, aName);
    const bestName = intVar(ctx.vars, BEST, curName);
    if (bestName && bestName in ctx.prev && ctx.vars[bestName] > ctx.prev[bestName]) {
      return `new record: a streak of ${ctx.vars[bestName]} heads (the old record was ${ctx.prev[bestName]})`;
    }
    if (!curName || !(curName in ctx.prev)) return null;
    const c = ctx.vars[curName];
    const was = ctx.prev[curName];
    if (c === was + 1) return `heads again: the streak grows to ${c}`;
    if (c === 0 && was > 0) return `tails: the streak of ${was} is broken, start counting from 0`;
    return null;
  },
  // before the streak counter is updated: what is it after this flip?
  predict(ctx) {
    const aName = ctx.params[0];
    if (!ctx.next) return null;
    const curName = intVar(ctx.vars, CUR, aName);
    if (!curName || !Number.isInteger(ctx.next.vars[curName]) || ctx.vars[curName] === 0) return null;
    const line = ctx.lines[ctx.next.line - 1] || '';
    if (!new RegExp(`\\b${curName}\\s*(=[^=]|\\+\\+|\\+=)|\\+\\+\\s*${curName}\\b`).test(line)) return null;
    const flip = flipOf(ctx.next.vars, aName);
    if (flip !== 0 && flip !== 1) return null;
    const c = ctx.vars[curName];
    const after = ctx.next.vars[curName];
    return options(
      `The streak is ${c} and the next flip is ${flip === 1 ? 'heads (1)' : 'tails (0)'}. What is the streak after it?`,
      after,
      [c + 1, 0, 1, c].filter((x) => x !== after),
      flip === 1 ? `Heads extends the streak: ${c} + 1 = ${after}.` : `Tails breaks the streak, so the counter goes back to ${after}.`,
    );
  },
  bugs: [
    {
      label: 'Tails resets the streak to 1',
      find: 'current + 1 : 0',
      replace: 'current + 1 : 1',
      explain: 'A tails flip is not part of any streak, but the counter restarts at 1, so [1, 0, 1, 0] reports a streak of 2.',
    },
    {
      label: 'Record only checked on tails',
      find: 'current = x === 1 ? current + 1 : 0;\n    best = Math.max(best, current);',
      replace: 'if (x === 1) current++;\n    else { best = Math.max(best, current); current = 0; }',
      explain: 'The record is only updated when a streak ends with tails, so a streak that runs to the last flip is never counted.',
    },
  ],
};
