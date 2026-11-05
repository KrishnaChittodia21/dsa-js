// Scene: Trim a Binary Search Tree. A gardener prunes every branch whose value is outside [low, high]. A node below
// low goes with its whole left side (all smaller still), but its right side may hold keepers; a node above high
// goes with its right side. Kept nodes get their two branches re-attached after trimming. Recursion on the root
// parameter (or a node-like helper parameter).

const NODE = ['node', 'n', 'cur', 'curr', 't'];
const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
/** name of the call's current node: the root parameter, or a helper's node-like parameter */
const nodeName = (ctx) => [ctx.params[0], ...NODE].find((k) => k in (ctx.vars || {}) && (ctx.vars[k] === null || isTree(ctx.vars[k])));
const bounds = (ctx) => {
  const lo = ctx.vars[ctx.params[1]];
  const hi = ctx.vars[ctx.params[2]];
  return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
};
const sideOf = (t, id) => (id === undefined || id === null ? null : t.$ids[1] === id ? 'left' : t.$ids[2] === id ? 'right' : null);
const vals = (t) => (isTree(t) ? t.$tree.filter((x) => x !== null).join(', ') : 'nothing');

export default {
  id: 'trim-a-binary-search-tree',
  metaphor: 'A gardener pruning out-of-range branches',
  caption: 'Only values inside [low, high] may stay. A node below low is cut with its whole left side, one above high with its whole right side; the other side can still hold keepers, so the walk continues there.',
  narrate(ctx) {
    const k = nodeName(ctx);
    const b = bounds(ctx);
    if (!k || !b) return null;
    const [lo, hi] = b;
    const cur = ctx.vars[k];
    const was = ctx.prev[k];
    if (ctx.ret) {
      if (cur === null && ctx.value === null) return 'an empty spot: nothing to keep here';
      if (!isTree(cur)) return null;
      const v = cur.$tree[0];
      if (isTree(ctx.value) && ctx.value.$ids[0] === cur.$ids[0]) return `${v} stays, with its trimmed branches: hand [${vals(ctx.value)}] back up`;
      if (v < lo || v > hi) return `${v} is cut: hand up what survived on its ${v < lo ? 'right' : 'left'} side instead (${vals(ctx.value)})`;
      return null;
    }
    // re-attaching a trimmed branch after the child's call came back
    const m = ctx.src.match(/\.(left|right)\s*=/);
    if (m && isTree(cur)) {
      const i = m[1] === 'left' ? 1 : 2;
      const child = cur.$ids[i] ? cur.$tree[i] : null;
      return `re-attach ${cur.$tree[0]}'s trimmed ${m[1]} branch: ${child === null ? 'nothing survived there' : `it now starts at ${child}`}`;
    }
    // the walk reached a new node
    if (isTree(cur) && (!isTree(was) || was.$ids[0] !== cur.$ids[0])) {
      const side = isTree(was) && sideOf(was, cur.$ids[0]);
      const p = side ? was.$tree[0] : null;
      if (side && p < lo) return `${p} < ${lo}: cut ${p} and its left side, look for keepers on its right, at ${cur.$tree[0]}`;
      if (side && p > hi) return `${p} > ${hi}: cut ${p} and its right side, look for keepers on its left, at ${cur.$tree[0]}`;
      if (side) return `${p} is in range: keep it and trim its ${side} branch, starting at ${cur.$tree[0]}`;
      if (!isTree(was)) return `the gardener reaches ${cur.$tree[0]} (keep range [${lo}, ${hi}])`;
    }
    return null;
  },
  // at a node outside the range: where do the keepers hide?
  predict(ctx) {
    if (!ctx.next || ctx.ret) return null;
    const k = nodeName(ctx);
    const b = bounds(ctx);
    if (!k || !b) return null;
    const cur = ctx.vars[k];
    if (!isTree(cur) || (isTree(ctx.prev[k]) && ctx.prev[k].$ids[0] === cur.$ids[0])) return null;
    const v = cur.$tree[0];
    const [lo, hi] = b;
    if (v >= lo && v <= hi) return null;
    const nx = ctx.next.vars[k];
    let answer;
    const side = isTree(nx) && sideOf(cur, nx.$ids[0]);
    if (side) answer = side === 'left' ? 0 : 1;
    else if (ctx.next.ret && ctx.next.value === null && isTree(nx) && nx.$ids[0] === cur.$ids[0]) answer = 2;
    // a leaf: the call went into one of its two empty branches, both look the same, so name the one the rule picks
    else if (nx === null && cur.$tree.length === 1) answer = v < lo ? 1 : 0;
    else return null;
    return {
      question: `${v} is outside [${lo}, ${hi}], so it is cut. Where does the gardener look for keepers?`,
      options: ['In its left branch', 'In its right branch', 'Nowhere: return null'],
      answer,
      explain:
        (cur.$tree.length === 1 ? `(${v} is a leaf, so that branch is empty and nothing survives.) ` : '') +
        (v < lo
          ? `${v} < ${lo}: everything on its left is even smaller and goes too, but its right side holds bigger values that may be in range.`
          : `${v} > ${hi}: everything on its right is even bigger and goes too, but its left side holds smaller values that may be in range.`),
    };
  },
  bugs: [
    {
      label: 'Drop the whole subtree of a too-small node',
      find: 'if (root.val < low) return trimBST(root.right, low, high);',
      replace: 'if (root.val < low) return null;',
      explain: 'A node below low is cut, but its right side holds bigger values that may be in range: in [3,0,4,null,2,null,null,1] the 2 and 1 under 0 are lost.',
    },
    {
      label: 'Trim the branches but never re-attach them',
      find: 'root.left = trimBST(root.left, low, high);',
      replace: 'trimBST(root.left, low, high);',
      explain: 'The trimmed left branch is computed and thrown away, so the out-of-range nodes stay hanging on the left: [1,0,2] keeps the 0.',
    },
  ],
};
