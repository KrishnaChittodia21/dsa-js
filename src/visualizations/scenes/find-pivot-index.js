// Find Pivot Index (running left sum + total). The array is a plank; each index is tried as the pivot of a seesaw.
// The left side weighs the running sum, the right side weighs the rest minus the pivot itself. Works with
// left/leftSum/l, right/rightSum/r, total/sum and any loop index name.
import { firstInt, options, row } from './util.js';

const TOTAL = ['total', 'sum', 'totalSum', 'all', 'whole', 's'];
const LEFT = ['left', 'leftSum', 'lsum', 'sumLeft', 'leftTotal', 'ls', 'l', 'prefix', 'pre'];
const RIGHT = ['right', 'rightSum', 'rsum', 'sumRight', 'rightTotal', 'rs', 'r'];
const AT = ['i', 'idx', 'j', 'k', 'index', 'p'];

function basics(ctx, vars) {
  const nums = row(vars[ctx.params[0]]);
  if (!nums) return null;
  const [tName, total] = firstInt(vars, TOTAL);
  const [lName, left] = firstInt(vars, LEFT);
  const [rName, right] = firstInt(vars, RIGHT);
  const [iName, i] = firstInt(vars, AT);
  const ok = Number.isInteger(i) && i >= 0 && i < nums.length;
  return { nums, tName, total, lName, left, rName, right, iName, i: ok ? i : undefined };
}

export default {
  id: 'find-pivot-index',
  metaphor: 'A seesaw balanced on one plank',
  caption: 'Each index is tried as the pivot of a seesaw. The left side weighs everything before it, the right side everything after it; the pivot itself sits on neither side.',
  compare: 'left',
  narrate(ctx) {
    const b = basics(ctx, ctx.vars);
    if (!b) return null;
    const { nums, tName, total, lName, left, rName, right, i } = b;
    const name = ctx.params[0];
    // weighing the whole plank first
    if (tName && tName in ctx.prev && total !== ctx.prev[tName] && i === undefined && !lName) {
      const done = ctx.next?.vars[tName] === total;
      return done ? `the whole plank weighs ${total} (every number added up)` : `weighing the plank: ${total} so far`;
    }
    if (i === undefined || !lName) return null;
    const isNew = rName && (right !== ctx.prev[rName] || i !== ctx.prev[b.iName]);
    if (isNew) {
      const parts = Number.isInteger(total) ? ` = ${total} − ${left} − ${nums[i]}` : '';
      return `pivot at index ${i} (${name}[${i}] = ${nums[i]}): left side weighs ${left}, right side${parts} = ${right}${left === right ? ': balanced!' : ''}`;
    }
    if (left !== ctx.prev[lName] && lName in ctx.prev) return `not balanced: the old pivot ${nums[i]} joins the left side, which now weighs ${left}`;
    if (rName && left === right && left === ctx.prev[lName] && right === ctx.prev[rName]) return `left ${left} = right ${right}: index ${i} is the pivot (the leftmost one, since we walk from the left)`;
    return null;
  },
  // before the right side is weighed (first index and the pivot): what does it weigh? after the first miss: the new left side
  predict(ctx) {
    if (!ctx.next) return null;
    const b = basics(ctx, ctx.vars);
    const n = basics(ctx, ctx.next.vars);
    if (!b || !n || n.i === undefined || !n.lName || !n.rName) return null;
    const name = ctx.params[0];
    const { nums } = n;
    const i = n.i;
    const freshRight = n.right !== ctx.vars[n.rName] || n.i !== ctx.vars[n.iName];
    if (freshRight && n.left === ctx.vars[n.lName] && Number.isInteger(n.total) && (i === 0 || n.left === n.right)) {
      const r = n.right;
      return options(
        `Pivot at index ${i} (${name}[${i}] = ${nums[i]}). The left side weighs ${n.left}, the whole plank ${n.total}. What does the right side weigh?`,
        r,
        [n.total - n.left, n.total - n.left - 2 * nums[i], n.total, r + 1].filter((x) => x !== r),
        `${n.total} − ${n.left} (left side) − ${nums[i]} (the pivot, on neither side) = ${r}.`,
      );
    }
    // the pivot at index 0 failed: the left side grows by nums[0]
    if (b.i === 0 && i === 0 && b.lName && n.left !== b.left && b.rName && b.left !== b.right) {
      return options(
        `Index 0 did not balance (left ${b.left}, right ${b.right}). The pivot moves to index 1: what does the left side weigh now?`,
        n.left,
        [b.left, b.left - nums[0], b.right, n.left + 1].filter((x) => x !== n.left),
        `The old pivot ${nums[0]} joins the left side: ${b.left} + ${nums[0]} = ${n.left}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Pivot added to the left side before comparing',
      find: 'if (left === right) return i;\n    left += nums[i];',
      replace: 'left += nums[i];\n    if (left === right) return i;',
      explain: 'The left side already holds the pivot when the two sides are compared, so a true pivot (index 3 in [1,7,3,6,5,6]) never balances.',
    },
    {
      label: 'Right side keeps the pivot',
      find: 'total - left - nums[i]',
      replace: 'total - left',
      explain: 'The pivot is counted on the right side, so the right side is too heavy by nums[i] and the real pivot is missed.',
    },
  ],
};
