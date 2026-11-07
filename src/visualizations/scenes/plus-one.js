// Plus One. The digits are the wheels of a car odometer: adding one turns the rightmost wheel, a 9 rolls over to 0
// and nudges the wheel on its left, and when every wheel rolls over a new 1 wheel appears in front.
import { changedIdx, row } from './util.js';

// the digits array: the parameter, or the first plain array of digits a learner renamed it to
const digitsOf = (vars, name) => {
  if (row(vars[name])) return [name, vars[name]];
  return Object.entries(vars).find(([, v]) => row(v) && v.length && v.every((x) => Number.isInteger(x) && x >= 0 && x <= 10)) || [];
};

export default {
  id: 'plus-one',
  metaphor: 'A car odometer ticking up one',
  caption: 'Each cell is a wheel of the odometer. Adding one turns the rightmost wheel; a 9 rolls over to 0 and carries 1 to its left, and the carry stops at the first wheel below 9.',
  compare: 'digits',
  narrate(ctx) {
    const [name, a] = digitsOf(ctx.vars, ctx.params[0]);
    const b = name && row(ctx.prev[name]);
    if (!a || !b) return null;
    if (a.length === b.length + 1 && a[0] === 1 && a.slice(1).every((x) => x === 0)) {
      return `every wheel rolled over to 0: a new wheel showing 1 appears in front → ${a.join('')}`;
    }
    const d = changedIdx(a, b);
    if (d.length !== 1) return null;
    const k = d[0];
    if (b[k] === 9 && a[k] === 0) return `wheel ${k} shows 9: it rolls over to 0 and carries 1 to the wheel on its left`;
    if (a[k] === b[k] + 1 && a[k] <= 9) return `wheel ${k}: ${b[k]} → ${a[k]}: the carry is absorbed, no wheel to its left moves → ${a.join('')}`;
    return null;
  },
  // before a wheel turns: does it roll over or absorb the carry? before a new wheel appears: what happens?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, a] = digitsOf(ctx.vars, ctx.params[0]);
    const after = name && row(ctx.next.vars[name]);
    if (!a || !after) return null;
    if (after.length === a.length + 1 && a.every((x) => x === 0)) {
      return {
        question: `Every wheel now shows 0 ([${a.join(', ')}]) and a carry of 1 is still left over. What happens?`,
        options: ['A new wheel showing 1 is added in front', 'Nothing: the answer is all zeros', 'A 1 is added at the end'],
        answer: 0,
        explain: `All the wheels rolled over, like 99 + 1 = 100: the carry needs a new leftmost wheel, so the number grows by one digit.`,
      };
    }
    const d = changedIdx(after, a);
    if (d.length !== 1) return null;
    const k = d[0];
    const roll = a[k] === 9 && after[k] === 0;
    const absorb = a[k] < 9 && after[k] === a[k] + 1;
    if (!absorb && !(roll && k === a.length - 1)) return null; // one roll-over question (the first), then the absorbing wheel
    return {
      question: `The carry reaches wheel ${k}, which shows ${a[k]}. What does the wheel do?`,
      options: ['Goes up by one, and the carry stops here', 'Rolls over to 0 and carries 1 to the left'],
      answer: roll ? 1 : 0,
      explain: roll ? '9 + 1 = 10 does not fit on one wheel: it shows 0 and the 1 moves on to the next wheel left.' : `${a[k]} + 1 = ${a[k] + 1} still fits on the wheel, so nothing is carried and every wheel to the left stays put.`,
    };
  },
  bugs: [
    {
      label: 'Forget the all-9s case',
      find: 'digits.unshift(1);',
      replace: '',
      explain: 'When every wheel rolls over (99 + 1), nobody adds the new 1 in front, so the answer comes out as [0, 0] instead of [1, 0, 0].',
    },
    {
      label: 'Treat 9 like any other digit',
      find: 'digits[i] < 9',
      replace: 'digits[i] <= 9',
      explain: 'A 9 is simply bumped to 10 instead of rolling over to 0 and carrying, so [9, 9] becomes [9, 10].',
    },
  ],
};
