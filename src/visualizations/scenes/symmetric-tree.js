// Scene: Symmetric Tree. Folding the tree along its centre line: every node on the left must land on an equal node
// on the right. The run walks mirrored pairs of spots (outer pair, then inner pair). Works with the two-pointer
// recursion (a / b, l / r, t1 / t2…) and with a queue / stack of pairs, as long as exactly two node variables are in scope.

import { itemsOf } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const top = (v) => (isTree(v) ? v.$tree[0] : null);
const idOf = (v) => (isTree(v) ? v.$ids[0] : null);
/** [[nameA, a], [nameB, b]]: the two node variables (tree or empty) being compared, else null */
function pairOf(ctx, vars) {
  const ps = Object.entries(vars || {}).filter(([k, v]) => !/\(whole\)/.test(k) && k !== ctx.params[0] && (v === null || isTree(v)));
  return ps.length === 2 ? ps : null;
}
const spot = (v) => (v === null ? 'an empty spot' : `${top(v)}`);
/** the child of a snapshot's top node: 1 = left, 2 = right (null when that side is empty) */
const childId = (t, i) => (isTree(t) ? t.$ids[i] ?? null : null);

export default {
  id: 'symmetric-tree',
  metaphor: 'Fold the tree along its centre line',
  caption: 'Fold the tree down the middle: each node on the left must land on an equal node on the right. The run checks mirrored pairs, the outer pair (left.left with right.right) and the inner pair (left.right with right.left).',
  narrate(ctx) {
    const p = pairOf(ctx, ctx.vars);
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (!ctx.next) return ctx.value ? 'every pair landed on its twin: the tree is a mirror of itself' : 'a pair did not line up: the tree is not symmetric';
      if (!p) return null;
      const [[, a], [, b]] = p;
      if (a === null && b === null) return 'both mirrored spots are empty: they match (true)';
      if (a === null || b === null) return `${spot(a)} folds onto ${spot(b)}: one side is missing, the mirror breaks (false)`;
      if (top(a) !== top(b)) return `${top(a)} folds onto ${top(b)}: different values, the mirror breaks (false)`;
      return ctx.value ? `pair ${top(a)} | ${top(b)}: its outer and inner pairs both match (true)` : `pair ${top(a)} | ${top(b)}: something below it does not match (false)`;
    }
    // a queue / stack of pairs: one more pair lined up
    for (const [k, v] of Object.entries(ctx.vars)) {
      const it = itemsOf(v);
      const was = itemsOf(ctx.prev[k]);
      const last = it?.[it.length - 1];
      if (it && was && it.length === was.length + 1 && Array.isArray(last) && last.length === 2 && last.every((x) => x === null || isTree(x)))
        return `line up the pair ${top(last[0]) ?? 'empty'} | ${top(last[1]) ?? 'empty'} to fold later (${it.length} waiting)`;
    }
    if (!p) return null;
    const [[ka, a], [kb, b]] = p;
    const was = pairOf(ctx, ctx.prev);
    // a pair counts as new only when both sides moved (a queue pop of two items is recorded in two steps)
    if (was && (idOf(was[0][1]) === idOf(a) || idOf(was[1][1]) === idOf(b))) return null;
    if (a === null && b === null) return 'both mirrored spots are empty: a match, nothing more to fold here';
    return `fold ${ka} = ${spot(a)} onto its mirror spot ${kb} = ${spot(b)}`;
  },
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    const p = pairOf(ctx, ctx.vars);
    if (!p) return null;
    const [[ka, a], [kb, b]] = p;
    const was = pairOf(ctx, ctx.prev);
    if (was && (idOf(was[0][1]) === idOf(a) || idOf(was[1][1]) === idOf(b))) return null;
    // a pair that is decided right here: one side empty
    if ((a === null) !== (b === null)) {
      if (!nx.ret || typeof nx.value !== 'boolean') return null;
      return {
        question: `${ka} is ${spot(a)}, its mirror spot ${kb} is ${spot(b)}. What does this pair report?`,
        options: ['true: they match', 'false: the mirror breaks'],
        answer: nx.value ? 0 : 1,
        explain: 'A node must land on a node: when exactly one of the two spots is empty, the fold cannot line up.',
      };
    }
    if (!isTree(a) || !isTree(b) || top(a) !== top(b)) return null;
    // equal values: which pair is folded next?
    const q = pairOf(ctx, nx.vars);
    if (!q || q[0][0] !== ka || q[1][0] !== kb) return null;
    const na = q[0][1];
    const nb = q[1][1];
    if (!isTree(na) || !isTree(nb)) return null;
    const pick = [
      [childId(a, 1), childId(b, 2)],
      [childId(a, 2), childId(b, 1)],
      [childId(a, 1), childId(b, 1)],
    ].findIndex(([x, y]) => x !== null && x === idOf(na) && y === idOf(nb));
    if (pick < 0) return null;
    return {
      question: `${top(a)} and ${top(b)} match. Which pair is folded next?`,
      options: [`outer: ${ka}.left with ${kb}.right`, `inner: ${ka}.right with ${kb}.left`, `same side: ${ka}.left with ${kb}.left`],
      answer: pick,
      explain:
        pick === 2
          ? 'The code pairs the same sides. That checks "same tree", not a mirror: a fold sends left onto right.'
          : `In a mirror, ${ka}'s ${pick === 0 ? 'left' : 'right'} child lands on ${kb}'s ${pick === 0 ? 'right' : 'left'} child; this code checks the ${pick === 0 ? 'outer' : 'inner'} pair first.`,
    };
  },
  bugs: [
    {
      label: 'Pair the same sides, not mirrored ones',
      find: 'mirror(a.left, b.right)',
      replace: 'mirror(a.left, b.left)',
      explain: 'Folding sends a left child onto a right child. Comparing left with left checks whether the halves are the same, so a real mirror like [1,2,2,3,4,4,3] is rejected.',
    },
    {
      label: 'Forget to compare the values',
      find: 'if (a.val !== b.val) return false;',
      replace: '',
      explain: 'Only the shapes are compared: [1,2,3] has a node on each side, so it looks symmetric even though 2 does not land on an equal node.',
    },
  ],
};
