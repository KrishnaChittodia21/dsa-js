// Scene: Lowest Common Ancestor of a Binary Tree. Scouts reporting up the family tree: every node asks its two sides
// "did you see p or q?". A node that is p or q reports itself; a node that hears a find from both sides is where the
// two meet (the answer); otherwise it passes up whatever one side found, or nothing.

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const idOf = (v) => (isTree(v) ? v.$ids[0] : null);
const show = (v) => (isTree(v) ? String(v.$tree[0]) : 'nothing');

/** names of the two side reports, from lines like `const left = lca(root.left, p, q)` */
function sidesOf(lines) {
  const out = {};
  for (const l of lines) {
    const m = l.match(/(?:const|let|var)?\s*(\w+)\s*=\s*\w+\(\s*\w+\.(left|right)\s*[,)]/);
    if (m && !out[m[2]]) out[m[2]] = m[1];
  }
  return out;
}
/** recursion on the tree: the first function calls itself */
const recursive = (lines) => {
  const name = lines.join('\n').match(/function\s+(\w+)/)?.[1];
  return !!name && lines.join('\n').split(`${name}(`).length > 2;
};

export default {
  id: 'lowest-common-ancestor-of-a-binary-tree',
  metaphor: 'Scouts reporting up the family tree',
  caption: 'Every node asks its two sides whether they saw p or q. A node that is p or q reports itself. A node that hears a find from both sides is where the two meet; otherwise it passes up what one side found, or nothing.',
  narrate(ctx) {
    const [rn, pn, qn] = ctx.params;
    const p = ctx.vars[pn];
    const q = ctx.vars[qn];
    if (!isTree(p) || !isTree(q)) return null;
    const pv = p.$tree[0];
    const qv = q.$tree[0];
    if (ctx.index === 0) return `looking for ${pv} and ${qv}: each node will ask both its sides what they found`;
    if (!recursive(ctx.lines)) return ctx.ret && !ctx.next && isTree(ctx.value) ? `${ctx.value.$tree[0]} is the lowest node above both ${pv} and ${qv}` : null;
    const root = ctx.vars[rn];
    const s = sidesOf(ctx.lines);
    const L = s.left && ctx.vars[s.left];
    const R = s.right && ctx.vars[s.right];
    if (ctx.ret) {
      const v = ctx.value;
      if (root === null) return 'an empty spot: nothing found here';
      if (!isTree(root)) return null;
      const at = root.$tree[0];
      const top = !ctx.next ? ` — the answer is ${show(v)}` : '';
      if (idOf(v) === idOf(root) && (idOf(root) === idOf(p) || idOf(root) === idOf(q)) && L === undefined && R === undefined)
        return `node ${at} is ${idOf(root) === idOf(p) ? pn : qn} itself: report it up, no need to look below${top}`;
      if (idOf(v) === idOf(root) && isTree(L) && isTree(R)) return `back at node ${at}: ${show(L)} came up the left, ${show(R)} the right: they meet here${top}`;
      if (v === null) return `back at node ${at}: neither side saw ${pn} or ${qn}, report nothing${top}`;
      if (isTree(v)) return `back at node ${at}: only one side found something, pass ${show(v)} up${top}`;
      return null;
    }
    for (const side of ['left', 'right']) {
      const k = s[side];
      if (k && k in ctx.vars && !(k in ctx.prev && idOf(ctx.prev[k]) === idOf(ctx.vars[k]) && ctx.prev[rn] && idOf(ctx.prev[rn]) === idOf(root)) && new RegExp(`\\b${k}\\s*=`).test(ctx.src) && isTree(root))
        return `node ${root.$tree[0]}'s ${side} side reports ${show(ctx.vars[k])}`;
    }
    if (isTree(root) && isTree(ctx.prev[rn]) && idOf(ctx.prev[rn]) !== idOf(root) && !ctx.ret) return `ask node ${root.$tree[0]}: is it ${pv} or ${qv}, or what do its sides hold?`;
    return null;
  },
  // both sides have reported: what does this node hand up?
  predict(ctx) {
    if (!ctx.next?.ret || !recursive(ctx.lines)) return null;
    const [rn] = ctx.params;
    const root = ctx.vars[rn];
    const s = sidesOf(ctx.lines);
    if (!isTree(root) || !s.left || !s.right || !(s.left in ctx.vars) || !(s.right in ctx.vars)) return null;
    if (idOf(ctx.next.vars[rn]) !== idOf(root)) return null;
    const L = ctx.vars[s.left];
    const R = ctx.vars[s.right];
    if (!isTree(L) && !isTree(R)) return null;
    const v = ctx.next.value;
    const at = root.$tree[0];
    const opts = [`Itself (${at})`, `The left report (${show(L)})`, `The right report (${show(R)})`, 'Nothing (null)'];
    let answer;
    if (idOf(v) === idOf(root)) answer = 0;
    else if (isTree(v) && idOf(v) === idOf(L)) answer = 1;
    else if (isTree(v) && idOf(v) === idOf(R)) answer = 2;
    else if (v === null) answer = 3;
    else return null;
    return {
      question: `Node ${at}: the left side reported ${show(L)}, the right side ${show(R)}. What does node ${at} hand up?`,
      options: opts,
      answer,
      explain:
        answer === 0
          ? `One was found on each side, so the two paths meet at ${at}: it is the lowest common ancestor and reports itself.`
          : answer === 3
            ? 'Nothing was found below, so nothing is reported.'
            : `Only one side found something. Both targets (or the one seen so far) are down there, so ${show(v)} is passed up unchanged.`,
    };
  },
  bugs: [
    {
      label: 'Claim the meeting point too early',
      find: 'if (left !== null && right !== null) return root;',
      replace: 'if (left !== null || right !== null) return root;',
      explain: 'A node that hears from only one side is not where p and q meet: when one of them is the ancestor of the other, every node above it wrongly claims to be the answer.',
    },
    {
      label: 'Never report a found node',
      find: 'if (root === null || root === p || root === q) return root;',
      replace: 'if (root === null) return null;',
      explain: 'Without stopping at p or q nothing is ever reported up, so every node hears "nothing" from both sides and the answer comes back null.',
    },
  ],
};
