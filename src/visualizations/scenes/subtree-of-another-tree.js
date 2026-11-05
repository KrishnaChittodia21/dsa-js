// Scene: Subtree of Another Tree. The small tree is a stencil: it is laid on every node of the big tree in turn,
// and at each node it is checked spot by spot (same value, same empty spots) all the way down.
// Node ids tell the trees apart: the big tree's nodes are built first, so its ids are 1…n (n = its node count).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const spot = (v) => v === null || isTree(v);
const idOf = (v) => (isTree(v) ? v.$ids[0] : null);
const kid = (v) => (isTree(v) ? v.$ids[1] ?? null : null);
const val = (v) => (isTree(v) ? String(v.$tree[0]) : 'empty');
const bigCount = (ctx) => (Array.isArray(ctx.input?.[0]) ? ctx.input[0].filter((x) => x !== null).length : null);

/**
 * { kind: 'search' | 'match', big, small, top } for the call running now, else null. The most local node variables
 * win: two non-parameter nodes (a, b) are a spot-by-spot check, one (cur) or none (root, subRoot) is the search.
 */
function frameOf(vars, ctx) {
  const n = bigCount(ctx);
  if (n === null || !vars) return null;
  const [P, S] = ctx.params;
  const inBig = (v) => v === null || (isTree(v) && v.$ids[0] <= n);
  const inSmall = (v) => v === null || (isTree(v) && v.$ids[0] > n);
  const local = Object.entries(vars).filter(([k, v]) => !k.endsWith('(whole)') && k !== 'this' && k !== P && k !== S && spot(v));
  const kind = local.length === 2 ? 'match' : 'search';
  let big;
  let small;
  if (local.length === 2) {
    const [[, v1], [, v2]] = local;
    [big, small] = (isTree(v1) && v1.$ids[0] <= n) || (isTree(v2) && v2.$ids[0] > n) ? [v1, v2] : [v2, v1];
  } else if (local.length === 1 && S in vars) [big, small] = [local[0][1], vars[S]];
  else if (!local.length && P in vars && S in vars) [big, small] = [vars[P], vars[S]];
  else return null;
  if (!inBig(big) || !inSmall(small) || (kind === 'search' && !isTree(small))) return null;
  return { kind, big, small, top: isTree(small) && small.$ids[0] === n + 1 };
}
const samePair = (a, b) => a && b && a.kind === b.kind && idOf(a.big) === idOf(b.big) && idOf(a.small) === idOf(b.small);
const OPTS = ['No fit: the values differ', 'No fit: one side runs out early', 'Values match: check the children next'];

export default {
  id: 'subtree-of-another-tree',
  metaphor: 'Lay the stencil on every node',
  caption: 'The small tree is a stencil. It is laid on each node of the big tree; it fits only if every value and every empty spot below lines up exactly. One fit anywhere is enough.',
  narrate(ctx) {
    const f = frameOf(ctx.vars, ctx);
    if (!f) return null;
    const { big, small } = f;
    const fresh = !samePair(f, frameOf(ctx.prev, ctx));
    if (f.kind === 'search') {
      if (ctx.ret && typeof ctx.value === 'boolean') {
        if (big === null) return 'fell off the big tree: nothing to lay the stencil on here';
        return ctx.value ? `the stencil fits at ${val(big)} or below it: the answer is true` : `no fit at ${val(big)} or anywhere below it`;
      }
      // after a check returns, prev is that check's last spot: only a different big-tree node is a real move
      const pf = frameOf(ctx.prev, ctx);
      return isTree(big) && (!pf || idOf(pf.big) !== idOf(big)) ? `move the stencil to node ${val(big)} of the big tree` : null;
    }
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (big === null && small === null) return 'both run out at the same spot: this branch fits';
      if (big === null || small === null) return `one side has ${val(big === null ? small : big)}, the other is empty: the stencil does not fit`;
      if (big.$tree[0] !== small.$tree[0]) return `${val(big)} vs the stencil's ${val(small)}: the stencil does not fit here`;
      return ctx.value ? `back at ${val(big)}: it and everything below it match the stencil` : `back at ${val(big)}: something below it does not match the stencil`;
    }
    if (!fresh) return null;
    return f.top ? `lay the stencil's top (${val(small)}) on node ${val(big)}` : small === null ? `under the stencil: ${val(big)} where the stencil has an empty spot` : `under the stencil: ${val(big)} against the stencil's ${val(small)}`;
  },
  // a fresh spot under the stencil: what is decided there?
  predict(ctx) {
    const nx = ctx.next;
    const f = frameOf(ctx.vars, ctx);
    const g = nx && frameOf(nx.vars, ctx);
    if (!f || !g || f.kind !== 'match' || ctx.ret || samePair(f, frameOf(ctx.prev, ctx))) return null;
    const { big, small } = f;
    if (big === null && small === null) return null;
    let answer = null;
    if (samePair(f, g) && nx.ret && nx.value === false) answer = big === null || small === null ? 1 : big.$tree[0] !== small.$tree[0] ? 0 : null;
    else if (f.top && g.kind === 'match' && isTree(big) && isTree(small) && idOf(g.big) === kid(big) && idOf(g.small) === kid(small) && !samePair(f, g)) answer = 2;
    if (answer === null) return null;
    return {
      question: `${small === null ? `An empty stencil spot lies on ${val(big)}` : big === null ? `The stencil's ${val(small)} lies on an empty spot` : `The stencil's ${val(small)} lies on ${val(big)}`}. What happens next?`,
      options: OPTS,
      answer,
      explain: [
        `${val(big)} ≠ ${val(small)}: the stencil cannot fit here, so this check fails at once and the search moves on.`,
        'A node on one side and nothing on the other: the shapes differ, so the stencil does not fit.',
        `Both are ${val(big)}, but a fit needs every node below to line up too: compare the left children next.`,
      ][answer],
    };
  },
  bugs: [
    {
      label: 'Only the top values must match',
      find: 'return a.val === b.val && isSame(a.left, b.left) && isSame(a.right, b.right);',
      replace: 'return a.val === b.val;',
      explain: 'A node with the right value counts as a fit even when its children differ, so a bigger subtree that merely starts like the stencil is accepted.',
    },
    {
      label: 'Search only the root',
      find: 'return isSame(root, subRoot) || isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);',
      replace: 'return isSame(root, subRoot);',
      explain: 'The stencil is laid on the root only; a fit deeper in the big tree is never found.',
    },
  ],
};
