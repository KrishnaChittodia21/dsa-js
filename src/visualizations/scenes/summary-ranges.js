// Summary Ranges: house numbers along a street, grouped into blocks with no gaps. A block grows while the next number
// is exactly one more; at a gap it is closed and written as "a->b" (or just "a" when it holds one house).
import { firstInt, options, row } from './util.js';

const IDX = ['i', 'j', 'k', 'idx', 'end', 'hi', 'r', 'right'];
const START = ['start', 's', 'begin', 'first', 'lo', 'from', 'runStart', 'startVal'];
const OUT = ['out', 'result', 'res', 'ans', 'answer', 'ranges', 'output', 'list'];
const strs = (v) => (Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null);
const outOf = (vars) => OUT.map((k) => strs(vars[k])).find(Boolean);
const idxOf = (vars, nums) => {
  const [n, i] = firstInt(vars, IDX);
  return n && i >= 0 && i < nums.length ? [n, i] : [undefined, undefined];
};
// the block's first number: a start-like variable that holds a value of nums
const startOf = (vars, nums) => START.find((k) => Number.isInteger(vars[k]) && nums.includes(vars[k]));
const label = (a, b) => (a === b ? String(a) : `${a}->${b}`);

export default {
  id: 'summary-ranges',
  metaphor: 'Blocks of consecutive house numbers',
  caption: 'Walk along the street: a block keeps growing while the next house number is exactly one more. At a gap the block is written down as "first->last", or as a lone number when it holds one house.',
  narrate(ctx) {
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const out = outOf(ctx.vars);
    const before = outOf(ctx.prev);
    if (out && before && out.length === before.length + 1) {
      const w = out[out.length - 1];
      const last = Number(w.split('->').pop());
      const k = nums.indexOf(last);
      const gap = k >= 0 && k + 1 < nums.length ? `the next house is ${nums[k + 1]}, not ${last + 1}` : 'the street ends';
      return w.includes('->') ? `${gap}: write the block "${w}"` : `${gap}: ${w} stands alone, written as "${w}" with no arrow`;
    }
    const sn = startOf(ctx.vars, nums);
    if (sn && ctx.vars[sn] !== ctx.prev[sn]) return `a new block starts at house ${ctx.vars[sn]}`;
    const [iName, i] = idxOf(ctx.vars, nums);
    if (iName && sn && ctx.prev[iName] === i - 1 && nums[i] === nums[i - 1] + 1 && ctx.vars[sn] <= nums[i - 1]) {
      return `${nums[i]} = ${nums[i - 1]} + 1, no gap: the block ${ctx.vars[sn]}…${nums[i]} grows`;
    }
    return null;
  },
  // inside a block: does it grow, or is it written down? Before a write: what is written?
  predict(ctx) {
    if (!ctx.next) return null;
    const nums = row(ctx.vars[ctx.params[0]]);
    if (!nums) return null;
    const out = outOf(ctx.vars);
    const nOut = outOf(ctx.next.vars);
    if (!out || !nOut || (outOf(ctx.prev) || out).length !== out.length) return null;
    if (nOut.length === out.length + 1) {
      const w = nOut[nOut.length - 1];
      const [a, b] = w.split('->').map(Number);
      if (!Number.isInteger(a)) return null;
      const z = b ?? a;
      const wrong = b === undefined ? [`${a}->${a}`, `${a}->${a + 1}`] : [String(a), label(a, z - 1), label(a, z + 1)];
      return options('The block is about to be written down. What string goes into the answer?', w, wrong.filter((x) => x !== w), b === undefined ? `${a} has no neighbour ${a + 1}, so it is written alone, without an arrow.` : `The block runs from ${a} to ${z} with no gap; the next house is not ${z + 1}.`);
    }
    const [iName, i] = idxOf(ctx.vars, nums);
    const sn = startOf(ctx.vars, nums);
    if (!iName || !sn || ctx.next.vars[sn] !== ctx.vars[sn] || ctx.vars[sn] >= nums[i] || i + 1 >= nums.length) return null;
    const grows = ctx.next.vars[iName] === i + 1 && nums[i + 1] === nums[i] + 1;
    const ends = START.concat(['end', 'e', 'last', 'stop']).some((k) => k !== sn && k !== iName && Number.isInteger(ctx.next.vars[k]) && ctx.next.vars[k] !== ctx.vars[k]);
    if (grows === ends) return null;
    return {
      question: `The block started at ${ctx.vars[sn]} and has reached ${nums[i]}. The next house is ${nums[i + 1]}. What happens?`,
      options: [`The block grows to ${nums[i + 1]}`, `The block closes at ${nums[i]}`],
      answer: grows ? 0 : 1,
      explain: grows ? `${nums[i + 1]} = ${nums[i]} + 1: no gap, so it joins the block.` : `${nums[i + 1]} is not ${nums[i]} + 1: there is a gap, so the block ends at ${nums[i]}.`,
    };
  },
  bugs: [
    {
      label: 'Always write "a->b", even for one house',
      find: "start === end ? String(start) : start + '->' + end",
      replace: "start + '->' + end",
      explain: 'A block of one house is written "7->7" instead of "7".',
    },
    {
      label: 'A lone house written as a number',
      find: 'String(start)',
      replace: 'start',
      explain: 'The answer must be strings; a single house goes in as the number 7, not the string "7".',
    },
  ],
};
