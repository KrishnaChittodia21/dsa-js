// Product of Array Except Self. Two runners walk the row of seats: the first goes left → right and leaves at every
// seat the product of everyone before it; the second goes right → left and multiplies in everyone after it.
import { changedIdx, options } from './util.js';

const LEFT = ['left', 'prefix', 'pre', 'leftProduct', 'leftProd', 'prod', 'running', 'acc', 'p'];
const RIGHT = ['right', 'suffix', 'suf', 'post', 'rightProduct', 'rightProd', 'after', 's'];
const num = (x) => typeof x === 'number' && Number.isFinite(x);
const cells = (v) => (Array.isArray(v) && v.every((x) => x == null || typeof x === 'number') ? v : null);
const firstNum = (vars, names) => names.find((k) => num(vars[k]));
const show = (x) => (Object.is(x, -0) ? 0 : x);
const IDX = ['i', 'j', 'k', 'idx', 'index'];
// which runner wrote seat k between `was` and `now`: 'back' (right → left) or 'out' (left → right), from the loop index
function passOf(now, was, k, n, before) {
  const iName = IDX.find((x) => Number.isInteger(now[x]));
  const i = iName && now[iName];
  const j = iName && was[iName];
  if (Number.isInteger(i) && Number.isInteger(j) && i !== j) return i < j ? 'back' : 'out';
  if (k === n - 1 && num(before[k]) && n > 1) return firstNum(now, RIGHT) ? 'back' : null;
  return k === 0 ? 'out' : null;
}

// the input row (the parameter, else the first all-number row) and the answer row: same length, not the input
function rowsOf(vars, param) {
  const full = (v) => cells(v) && v.length && v.every(num);
  const numsName = full(vars[param]) ? param : Object.keys(vars).find((k) => full(vars[k]));
  if (!numsName) return [];
  const nums = vars[numsName];
  const out = Object.entries(vars).find(([k, v]) => k !== numsName && cells(v) && v.length === nums.length);
  return out ? [nums, ...out] : [nums];
}

export default {
  id: 'product-of-array-except-self',
  metaphor: 'Two runners carrying a product',
  caption: 'The first runner walks left → right and leaves at every seat the product of everyone before it. The second walks back right → left and multiplies in everyone after it, so each seat ends with everyone but itself.',
  compare: 'out',
  narrate(ctx) {
    const [nums, outName, out] = rowsOf(ctx.vars, ctx.params[0]);
    if (!nums) return null;
    const rName = firstNum(ctx.vars, RIGHT);
    const before = outName && cells(ctx.prev[outName]);
    const d = before && before.length === out.length ? changedIdx(out, before) : [];
    if (d.length === 1) {
      const k = d[0];
      const pass = passOf(ctx.vars, ctx.prev, k, nums.length, before);
      const by = rName && num(ctx.prev[rName]) ? ctx.prev[rName] : null;
      if (pass === 'back' && num(before[k]) && by !== null) return `seat ${k}: left product ${show(before[k])} × right product ${show(by)} = ${show(out[k])} · everyone except its own ${nums[k]}`;
      if (pass === 'out') return `seat ${k} gets ${show(out[k])}: the product of everything left of it${k === 0 ? ' (nothing yet, so 1)' : ` (${nums.slice(0, k).join(' × ')})`}`;
      return null;
    }
    for (const [names, side] of [
      [RIGHT, 'right'],
      [LEFT, 'left'],
    ]) {
      const n = firstNum(ctx.vars, names);
      if (!n || !num(ctx.prev[n]) || ctx.prev[n] === ctx.vars[n]) continue;
      // the factor, not the new total: the total is what the next prediction asks for
      const f = ctx.prev[n] !== 0 ? show(ctx.vars[n] / ctx.prev[n]) : null;
      return `the ${side} runner multiplies in the number of the seat it just passed${f !== null ? ` (× ${f})` : ''}`;
    }
    return null;
  },
  // before a seat is written: which number lands there? (once on the way out, then on the way back)
  predict(ctx) {
    if (!ctx.next) return null;
    const [nums, outName, out] = rowsOf(ctx.vars, ctx.params[0]);
    const after = outName && cells(ctx.next.vars[outName]);
    if (!out || !after || after.length !== out.length) return null;
    const d = changedIdx(after, out);
    if (d.length !== 1) return null;
    const k = d[0];
    const n = nums.length;
    const pass = passOf(ctx.next.vars, ctx.vars, k, n, out);
    if (!pass) return null;
    const back = pass === 'back' && num(out[k]);
    if (back ? k > n - 2 : k !== Math.min(2, n - 1)) return null;
    const right = show(after[k]);
    const all = nums.reduce((p, x) => p * x, 1);
    const wrong = [show(all), nums[k], show(right * nums[k]), back ? show(out[k]) : show(right === 0 ? 1 : 0)].filter((x) => x !== right);
    const q = back
      ? `The right runner reaches seat ${k} (its own number: ${nums[k]}), which holds the left product ${show(out[k])}. What does seat ${k} end with?`
      : `The left runner reaches seat ${k} (its own number: ${nums[k]}). Which number does it leave there?`;
    const why = back
      ? `${show(out[k])} (everything left of seat ${k}) × the product of everything right of it = ${right}; its own ${nums[k]} is never multiplied in.`
      : `Seat ${k} gets the product of the seats before it (${nums.slice(0, k).join(' × ') || 'none'}) = ${right}; its own ${nums[k]} joins the runner only after the seat is written.`;
    return options(q, right, wrong.slice(0, 3), why);
  },
  bugs: [
    {
      label: 'Multiply nums[i] in before writing the seat',
      find: 'out[i] = left;\n    left *= nums[i];',
      replace: 'left *= nums[i];\n    out[i] = left;',
      explain: 'The left runner picks up the seat\'s own number before leaving the product there, so every seat includes itself: [1,2,3,4] gives [24,24,24,24] instead of [24,12,8,6].',
    },
    {
      label: 'Right runner starts at 0',
      find: 'let right = 1;',
      replace: 'let right = 0;',
      explain: 'The product of nothing is 1, not 0. Starting the right runner at 0 wipes every seat to 0 on the way back.',
    },
  ],
};
