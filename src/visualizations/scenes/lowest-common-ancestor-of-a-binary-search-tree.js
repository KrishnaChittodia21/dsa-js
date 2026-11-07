// Scene: Lowest Common Ancestor of a BST. Two travellers walk down from the root on the same road; at every node
// the BST order says where each one must go. While both must turn the same way they walk together; the first
// node where their roads fork (or one of them has arrived) is the answer. Works with a loop walker
// (node / cur / root moved) or recursion on the root parameter (`root (whole)` holds the full tree).

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** the value of a p / q parameter: a node snapshot or a plain number */
const valOf = (v) => (isTree(v) ? v.$tree[0] : Number.isFinite(v) ? v : null);
/** [name, tree] of the walker: a tree variable other than p / q and the whole input */
function walkerOf(ctx, vars) {
  const [, pN, qN] = ctx.params;
  const names = ['node', 'cur', 'curr', 'current', 'n', 't', 'x', ctx.params[0], ...Object.keys(vars)];
  const k = names.find((n) => n !== pN && n !== qN && !/\(whole\)/.test(n) && isTree(vars?.[n]));
  return k ? [k, vars[k]] : null;
}
/** 'left' / 'right' when the walker stepped from `a` to its child in `b` */
function stepped(ctx, a, b) {
  const from = walkerOf(ctx, a);
  const to = walkerOf(ctx, b);
  if (!from || !to) return null;
  const id = to[1].$ids[0];
  if (from[1].$ids[1] === id) return ['left', from[1], to[1]];
  if (from[1].$ids[2] === id) return ['right', from[1], to[1]];
  return null;
}

export default {
  id: 'lowest-common-ancestor-of-a-binary-search-tree',
  metaphor: 'Two travellers until their roads fork',
  caption: 'p and q start together at the root. Smaller values live to the left, bigger to the right: while both must go the same way they keep walking together. Where their roads fork, or one of them has arrived, is the lowest common ancestor.',
  narrate(ctx) {
    const [, pN, qN] = ctx.params;
    const p = valOf(ctx.vars[pN]);
    const q = valOf(ctx.vars[qN]);
    if (p === null || q === null) return null;
    if (ctx.ret) {
      const v = valOf(ctx.value);
      if (v === null) return null;
      const at = walkerOf(ctx, ctx.vars);
      if (at && at[1].$tree[0] !== v) return `${v} was found further down: hand it back up through ${at[1].$tree[0]}`;
      if (v === p || v === q) return `${v} is one of the two travellers itself, and the other is below it: ${v} is the answer`;
      return `${Math.min(p, q)} < ${v} < ${Math.max(p, q)}: the roads fork here, so ${v} is the lowest common ancestor`;
    }
    const mv = stepped(ctx, ctx.prev, ctx.vars);
    if (mv) {
      const [side, from, to] = mv;
      const n = from.$tree[0];
      return side === 'left'
        ? `${p} and ${q} are both smaller than ${n}: both roads go left, walk on to ${to.$tree[0]}`
        : `${p} and ${q} are both bigger than ${n}: both roads go right, walk on to ${to.$tree[0]}`;
    }
    const at = walkerOf(ctx, ctx.vars);
    if (at && !walkerOf(ctx, ctx.prev)) return `start at the root ${at[1].$tree[0]}, looking for where ${p} and ${q} part ways`;
    return null;
  },
  // at a node: walk left, walk right, or stop here?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || ctx.ret) return null;
    const [, pN, qN] = ctx.params;
    const p = valOf(ctx.vars[pN]);
    const q = valOf(ctx.vars[qN]);
    const at = walkerOf(ctx, ctx.vars);
    if (p === null || q === null || !at) return null;
    const n = at[1].$tree[0];
    const mv = stepped(ctx, ctx.vars, nx.vars);
    let answer;
    if (mv) answer = mv[0] === 'left' ? 0 : 1;
    else if (nx.ret && valOf(nx.value) === n) answer = 2;
    else return null;
    const why = [
      `${p} and ${q} are both smaller than ${n}, so both live in its left subtree.`,
      `${p} and ${q} are both bigger than ${n}, so both live in its right subtree.`,
      p === n || q === n ? `${n} is one of the two nodes, and a node counts as its own ancestor.` : `${Math.min(p, q)} < ${n} < ${Math.max(p, q)}: one goes left, the other right, so ${n} is the last node on both roads.`,
    ];
    return {
      question: `Looking for ${p} and ${q}, standing at ${n}. What happens next?`,
      options: [`Both go left`, `Both go right`, `Stop: ${n} is the answer`],
      answer,
      explain: why[answer],
    };
  },
  bugs: [
    {
      label: 'Compare the node, not its value',
      find: 'p.val < node.val && q.val < node.val',
      replace: 'p < node.val && q < node.val',
      explain: 'p and q are nodes: `p < node.val` compares an object with a number, which is always false, so the walk never turns left.',
    },
    {
      label: 'A node is not its own ancestor',
      find: 'p.val < node.val && q.val < node.val',
      replace: 'p.val <= node.val && q.val <= node.val',
      explain: 'When p sits exactly on this node, it is already the answer; with <= the walk goes on past it and returns a node below.',
    },
  ],
};
