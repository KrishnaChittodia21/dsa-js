// Scene: Validate Binary Search Tree. Every node lives inside a fence (low, high) set by ALL its ancestors: a left
// child's fence closes at its parent's value from above, a right child's from below. One node outside its fence
// makes the whole tree invalid. Works with a stack of [node, low, high] or recursion valid(node, low, high).

const LOW = ['low', 'lo', 'min', 'lower', 'minVal', 'minimum', 'left', 'l', 'floor'];
const HIGH = ['high', 'hi', 'max', 'upper', 'maxVal', 'maximum', 'right', 'r', 'ceil'];
const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'nd', 'root'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const isBound = (v) => v === null || typeof v === 'number';
const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
/** { name, node, low, high } of the node being checked with its fence, or null */
function fenceOf(vars) {
  const n = pick(vars, NODE, (v) => v === null || isTree(v));
  const lo = pick(vars, LOW, isBound);
  const hi = pick(vars, HIGH, isBound);
  if (!n || !lo || !hi) return null;
  return { name: n, node: vars[n], low: vars[lo], high: vars[hi] };
}
const fmtLo = (v) => (v === null || v === -Infinity ? '−∞' : String(v));
const fmtHi = (v) => (v === null || v === Infinity ? '∞' : String(v));
const fence = (f) => `(${fmtLo(f.low)}, ${fmtHi(f.high)})`;
/** the stack of [node, low, high] triples, if the learner keeps one */
function triples(vars) {
  for (const v of Object.values(vars || {})) {
    if (Array.isArray(v) && v.length > 0 && v.every((e) => Array.isArray(e) && e.length === 3 && (e[0] === null || isTree(e[0])))) return v;
  }
  return null;
}
const moved = (ctx, f) => ctx.prev[pick(ctx.prev, LOW, isBound)] !== f.low || ctx.prev[pick(ctx.prev, HIGH, isBound)] !== f.high || (ctx.prev[f.name]?.$ids?.[0] ?? null) !== (f.node?.$ids[0] ?? null);
const newFence = (ctx, f) => f && isTree(f.node) && moved(ctx, f);

export default {
  id: 'validate-binary-search-tree',
  metaphor: 'Fences narrowing on the way down',
  caption: 'Each node must sit strictly inside its fence (low, high). Going left closes the fence from above at the parent value, going right from below, so every ancestor keeps its say.',
  narrate(ctx) {
    const f = fenceOf(ctx.vars);
    if (ctx.ret && ctx.value === false && f && isTree(f.node)) {
      // recursion: a caller only passes its child's "invalid" up
      if (ctx.prev[f.name]?.$ids?.[0] !== f.node.$ids[0]) return `${f.node.$tree[0]} passes the "invalid" verdict from below up`;
      return `${f.node.$tree[0]} is outside its fence ${fence(f)}: the tree is not a valid BST`;
    }
    if (ctx.ret && ctx.value === true) {
      if (!f) return 'every node sat inside its fence: a valid BST';
      if (f.node === null) return 'an empty spot: nothing to check, report "fine"';
      if (isTree(f.node)) return `${f.node.$tree[0]} and everything below it sit inside their fences: report "fine"`;
    }
    if (ctx.ret && ctx.value === false && !f) return 'a node broke its fence: not a valid BST';
    // a child queued with its fence (stack version)
    const st = triples(ctx.vars);
    const was = triples(ctx.prev) || [];
    if (st && st.length > was.length && f && isTree(f.node)) {
      const [child, lo, hi] = st[st.length - 1];
      const p = f.node.$tree[0];
      const side = hi === p ? 'left' : lo === p ? 'right' : null;
      const who = child ? `${side ? `${side} child ` : ''}${child.$tree[0]}` : `empty ${side || ''} spot`.replace('  ', ' ');
      return `push ${who} with the fence (${fmtLo(lo)}, ${fmtHi(hi)})${side && child ? `: ${side === 'left' ? 'below' : 'above'} ${p}` : ''}`;
    }
    if (newFence(ctx, f)) return `check ${f.node.$tree[0]}: it must sit inside ${fence(f)}`;
    if (f && f.node === null && moved(ctx, f)) return 'an empty spot: nothing to check here';
    return null;
  },
  // a node with its fence on screen: inside or not?
  predict(ctx) {
    const f = fenceOf(ctx.vars);
    if (!ctx.next || ctx.ret || !newFence(ctx, f)) return null;
    if (fmtLo(f.low) === '−∞' && fmtHi(f.high) === '∞') return null; // the root always fits: not worth a question
    const nf = fenceOf(ctx.next.vars);
    const same = nf && isTree(nf.node) && nf.node.$ids[0] === f.node.$ids[0];
    let answer;
    if (same && ctx.next.ret && ctx.next.value === false) answer = 1;
    else if (!ctx.next.ret || (nf && !same)) answer = 0; // went on, or already down in a child's call
    else return null;
    const v = f.node.$tree[0];
    return {
      question: `Is ${v} inside its fence ${fence(f)}?`,
      options: ['Yes: keep going', 'No: the tree is invalid'],
      answer,
      explain: answer === 0 ? `${fmtLo(f.low)} < ${v} < ${fmtHi(f.high)}, so ${v} respects every ancestor above it.` : `${v} is not strictly between ${fmtLo(f.low)} and ${fmtHi(f.high)}: some ancestor's rule is broken (equal values count as broken too).`,
    };
  },
  bugs: [
    {
      label: 'Allow equal values',
      find: 'if (node.val <= low || node.val >= high) return false;',
      replace: 'if (node.val < low || node.val > high) return false;',
      explain: 'A child equal to its parent slips through the fence, so [1, 1] is called valid although duplicates are not allowed.',
    },
    {
      label: 'Forget the ancestors: only the parent counts',
      find: 'stack.push([node.left, low, node.val]);',
      replace: 'stack.push([node.left, -Infinity, node.val]);',
      explain: 'A left child forgets the lower fence its grandparents set: in [10,5,15,null,null,6,20] the 6 under 15 is let in although it is smaller than 10.',
    },
  ],
};
