// Scene: Range Sum of BST. Picking fruit of the right size from a sorted tree: a node in [low, high] goes in the
// basket and both sides may hold more; a node below low means everything on its left is smaller still, so only
// its right side is worth a look (and the mirror for above high). Works with a stack / queue of nodes or with
// recursion that returns each subtree's sum.
import { itemsOf } from './util.js';

const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'x'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** [name, tree] of the node being looked at (a node variable, or the root parameter in recursion) */
function nodeOf(ctx, vars) {
  const name = [...NODE, ctx.params[0]].find((k) => isTree(vars?.[k]));
  return name ? [name, vars[name]] : null;
}
/** [name, items] of the pile of nodes still to look at */
function pileOf(ctx, vars) {
  for (const k of Object.keys(vars || {})) {
    if (ctx.params.includes(k)) continue;
    const items = itemsOf(vars[k]);
    if (items && (items.length ? items.every(isTree) : /stack|stk|st|queue|q|pile|todo/i.test(k))) return [k, items];
  }
  return null;
}
/** [name, value] of the running total */
function sumOf(ctx, vars) {
  const k = ['sum', 'total', 'ans', 'res', 'result', 'acc', 's', ...Object.keys(vars || {})].find((n) => !ctx.params.includes(n) && Number.isFinite(vars?.[n]) && /^(sum|total|ans|res|result|acc|s|out|answer)$/i.test(n));
  return k ? [k, vars[k]] : null;
}
/** the node that just came off the pile (a tree), or null */
function taken(ctx, vars, prev) {
  const p = pileOf(ctx, vars);
  const was = p && itemsOf(prev?.[p[0]]);
  const at = nodeOf(ctx, vars);
  if (!p || !was || p[1].length !== was.length - 1 || !at) return null;
  const ids = new Set(p[1].map((t) => t.$ids[0]));
  return was.some((t) => isTree(t) && t.$ids[0] === at[1].$ids[0]) && !ids.has(at[1].$ids[0]) ? at[1] : null;
}
const where = (v, lo, hi) => (v < lo ? 'small' : v > hi ? 'big' : 'in');

export default {
  id: 'range-sum-of-bst',
  metaphor: 'Picking only the right-sized fruit',
  caption: 'Values in [low, high] go into the sum. The tree is sorted, so a node below low has only smaller nodes on its left: that whole side is skipped. Above high, the right side is skipped. The pile holds the branches still to check.',
  narrate(ctx) {
    const [, loN, hiN] = ctx.params;
    const lo = ctx.vars[loN];
    const hi = ctx.vars[hiN];
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
    const at = nodeOf(ctx, ctx.vars);
    if (ctx.ret && Number.isFinite(ctx.value)) {
      if (!ctx.next) return `every branch that could hold a value in [${lo}, ${hi}] is checked: the sum is ${ctx.value}`;
      // recursion: each call hands back its subtree's sum
      if (ctx.vars[ctx.params[0]] === null) return 'an empty branch adds 0';
      if (!at) return null;
      const v = at[1].$tree[0];
      const w = where(v, lo, hi);
      if (w === 'small') return `${v} < ${lo}: too small, and so is its left side; only its right side counts: ${ctx.value}`;
      if (w === 'big') return `${v} > ${hi}: too big, and so is its right side; only its left side counts: ${ctx.value}`;
      return `${v} is in [${lo}, ${hi}]: ${v} plus both sides gives ${ctx.value}`;
    }
    const s = sumOf(ctx, ctx.vars);
    if (s && at && Number.isFinite(ctx.prev[s[0]]) && s[1] > ctx.prev[s[0]]) return `${lo} ≤ ${at[1].$tree[0]} ≤ ${hi}: it goes in the basket, the sum is now ${s[1]}`;
    const p = pileOf(ctx, ctx.vars);
    const was = p && itemsOf(ctx.prev[p[0]]);
    if (p && was && at && p[1].length === was.length + 1) {
      const add = p[1].find((t) => !was.some((w) => isTree(w) && w.$ids[0] === t.$ids[0]));
      if (add && add.$ids[0] === at[1].$ids[0]) return `start with the whole tree: the pile holds the root ${add.$tree[0]}`;
      const side = add && (at[1].$ids[1] === add.$ids[0] ? 'left' : at[1].$ids[2] === add.$ids[0] ? 'right' : null);
      if (side) {
        const v = at[1].$tree[0];
        const w = where(v, lo, hi);
        const why = w === 'small' ? `${v} < ${lo}, so only bigger values (its right side) can be in range` : w === 'big' ? `${v} > ${hi}, so only smaller values (its left side) can be in range` : `${v} is in range, so its ${side} side may hold more`;
        return `${why}: put ${add.$tree[0]} on the pile`;
      }
    }
    const b0 = nodeOf(ctx, ctx.prev);
    if (at && b0 && b0[0] === at[0] && !pileOf(ctx, ctx.vars)) {
      const side = b0[1].$ids[1] === at[1].$ids[0] ? 'left' : b0[1].$ids[2] === at[1].$ids[0] ? 'right' : null;
      if (side) return `down to ${at[1].$tree[0]}, on the ${side} side of ${b0[1].$tree[0]}`;
    }
    const t = taken(ctx, ctx.vars, ctx.prev);
    if (t) {
      // the node before was taken and left without counting or adding anything: it was out of range, nothing useful below
      const b = nodeOf(ctx, ctx.prev);
      const w = b && b[1].$ids[0] !== t.$ids[0] && !b[1].$ids.slice(1, 3).includes(t.$ids[0]) ? where(b[1].$tree[0], lo, hi) : 'in';
      const skip = w === 'small' ? `${b[1].$tree[0]} < ${lo} with no right side: dropped. ` : w === 'big' ? `${b[1].$tree[0]} > ${hi} with no left side: dropped. ` : '';
      return `${skip}Take ${t.$tree[0]} off the pile: is it between ${lo} and ${hi}?`;
    }
    return null;
  },
  // a node just came off the pile: in range, too small, or too big?
  predict(ctx) {
    const nx = ctx.next;
    const t = taken(ctx, ctx.vars, ctx.prev);
    if (!nx || !t) return null;
    const [, loN, hiN] = ctx.params;
    const lo = ctx.vars[loN];
    const hi = ctx.vars[hiN];
    const v = t.$tree[0];
    const s = sumOf(ctx, ctx.vars);
    const p = pileOf(ctx, ctx.vars);
    let answer = null;
    if (s && Number.isFinite(nx.vars[s[0]]) && nx.vars[s[0]] > s[1]) answer = 0;
    else if (p && nodeOf(ctx, nx.vars)?.[1].$ids[0] === t.$ids[0]) {
      const after = itemsOf(nx.vars[p[0]]);
      const add = after && after.length === p[1].length + 1 ? after[after.length - 1] : null;
      // a child pushed without counting the node: which side shows which way it failed
      if (add && add.$ids[0] === t.$ids[2]) answer = 1;
      else if (add && add.$ids[0] === t.$ids[1]) answer = 2;
    }
    if (answer === null) return null;
    const why = [
      `${lo} ≤ ${v} ≤ ${hi}: it counts, and both of its sides may hold more values in range.`,
      `${v} < ${lo}: it is too small, and everything on its left is smaller still. Only its right side can help.`,
      `${v} > ${hi}: it is too big, and everything on its right is bigger still. Only its left side can help.`,
    ];
    return {
      question: `${v} came off the pile; the range is [${lo}, ${hi}]. What happens to it?`,
      options: ['Add it, then check both sides', 'Too small: check only its right side', 'Too big: check only its left side'],
      answer,
      explain: why[answer],
    };
  },
  bugs: [
    {
      label: 'Range treated as exclusive',
      find: 'node.val < low',
      replace: 'node.val <= low',
      explain: 'A value equal to low is inside the range, but <= throws it out as too small, so the sum misses it.',
    },
    {
      label: 'Too small: stop, without its right side',
      find: 'if (node.right) stack.push(node.right);',
      replace: '// skip it',
      explain: 'A node below low is too small, but its right side holds bigger values that may be in range. Dropping it loses them.',
    },
  ],
};
