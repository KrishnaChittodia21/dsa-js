// Scene: Same Tree. Two people walk the two trees in lockstep, calling out what stands at each spot: both empty
// is fine, one empty or two different values ends the walk, otherwise both step down left, then right.
// Reads the two parameters (any names) in each recursive call; a loop over a queue of pairs falls back to generic notes.

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const spot = (v) => v === null || isTree(v);
const idOf = (v) => (isTree(v) ? v.$ids[0] : null);
const kid = (v, side) => (isTree(v) ? v.$ids[side] ?? null : null);
const name = (v) => (isTree(v) ? String(v.$tree[0]) : 'empty');

/** [p, q] of the call running now, when both parameters hold a node or null */
function pairOf(vars, params) {
  const [a, b] = params;
  return a in vars && b in vars && spot(vars[a]) && spot(vars[b]) ? [vars[a], vars[b]] : null;
}
const OPTS = ['Both spots are empty: they match', 'Only one spot is empty: not the same', 'The values differ: not the same', 'Values match: walk down to the children'];

export default {
  id: 'same-tree',
  metaphor: 'Two walkers pacing twin gardens',
  caption: 'One walker per tree, always on the same spot. At each spot they compare: empty with empty is fine, a missing node or a different value means the trees differ.',
  narrate(ctx) {
    const pq = pairOf(ctx.vars, ctx.params);
    if (!pq) return null;
    const [p, q] = pq;
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (p === null && q === null) return 'both spots are empty: that branch matches';
      if (p === null || q === null) return `one tree has ${name(p === null ? q : p)} here, the other has nothing: different shapes`;
      if (p.$tree[0] !== q.$tree[0]) return `${p.$tree[0]} vs ${q.$tree[0]}: different values, the trees are not the same`;
      const was = pairOf(ctx.prev, ctx.params);
      if (was && idOf(was[0]) === idOf(p) && idOf(was[1]) === idOf(q)) return ctx.value ? 'the walk is over and nothing differed: the trees are the same' : 'the walk stopped at a difference: the trees are not the same';
      return ctx.value ? `back at ${p.$tree[0]}: it and everything below it match in both trees` : `back at ${p.$tree[0]}: somewhere below it the trees differ`;
    }
    const was = pairOf(ctx.prev, ctx.params);
    if (!was || idOf(was[0]) !== idOf(p) || idOf(was[1]) !== idOf(q)) return `the walkers stand at ${name(p)} and ${name(q)}: compare them`;
    return null;
  },
  // at a fresh spot: what do the walkers decide?
  predict(ctx) {
    const nx = ctx.next;
    const pq = pairOf(ctx.vars, ctx.params);
    const npq = nx && pairOf(nx.vars, ctx.params);
    if (!pq || !npq || ctx.ret) return null;
    const [p, q] = pq;
    if (p === null && q === null) return null;
    const was = pairOf(ctx.prev, ctx.params);
    if (was && idOf(was[0]) === idOf(p) && idOf(was[1]) === idOf(q)) return null;
    let answer = null;
    const same = idOf(npq[0]) === idOf(p) && idOf(npq[1]) === idOf(q);
    if (same && nx.ret && nx.value === false) answer = p === null || q === null ? 1 : p.$tree[0] !== q.$tree[0] ? 2 : null;
    else if (!same && !nx.ret && isTree(p) && isTree(q) && idOf(npq[0]) === kid(p, 1) && idOf(npq[1]) === kid(q, 1)) answer = 3;
    else if (!same && nx.ret && isTree(p) && isTree(q) && npq[0] === null && npq[1] === null && kid(p, 1) === null && kid(q, 1) === null) answer = 3;
    if (answer === null || (answer === 3 && ctx.index > 0)) return null; // "walk down" once is enough
    return {
      question: `The walkers stand at ${name(p)} and ${name(q)}. What happens next?`,
      options: OPTS,
      answer,
      explain: [
        '',
        'A node on one side and nothing on the other: the shapes differ, so the answer is false at once.',
        `${name(p)} ≠ ${name(q)}: the trees cannot be the same, so this call returns false without looking further.`,
        `Both hold ${name(p)}, so this spot is fine, but the trees match only if both subtrees match too: compare the left children first.`,
      ][answer],
    };
  },
  bugs: [
    {
      label: 'Skip the value check',
      find: 'if (p.val !== q.val) return false;',
      replace: 'if (p.val !== p.val) return false;',
      explain: 'Only the shapes are compared, so two trees with the same shape but different values are called the same.',
    },
    {
      label: 'Either side matching is enough',
      find: 'isSameTree(p.left, q.left) && isSameTree(p.right, q.right)',
      replace: 'isSameTree(p.left, q.left) || isSameTree(p.right, q.right)',
      explain: 'With || one matching subtree is enough, so a difference on the other side is ignored.',
    },
  ],
};
