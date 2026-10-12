export default {
  signals: [
    '"for every node, compute something about its subtree"',
    '"nodes at distance k from a target" → the tree must be walked upward too',
    '"count downward paths with sum k" (path may start below the root)',
    '"is subtree of / identical / symmetric" → recurse on two trees at once',
    '"maximum width" including the null gaps between nodes',
    'input given as a level-order array with nulls (LeetCode format)',
  ],
  tricks: [
    {
      title: 'Prefix sums along the root-to-node path',
      kind: 'template',
      md: "“Count downward paths that sum to k” is the array trick “subarray sum equals k” applied to the current root-to-node path. Keep a Map of prefix sums seen on the path; at each node, add how many earlier prefixes equal `sum − k`. Decrement the count when you return, because a sibling subtree must not see this branch’s prefixes. O(n) instead of O(n²).",
      code: `function pathSumCount(root, k) {
  const seen = new Map([[0, 1]]);
  const dfs = (node, sum) => {
    if (!node) return 0;
    sum += node.val;
    let count = seen.get(sum - k) ?? 0;
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
    count += dfs(node.left, sum) + dfs(node.right, sum);
    seen.set(sum, seen.get(sum) - 1); // undo before going back up
    return count;
  };
  return dfs(root, 0);
}`,
    },
    {
      title: 'BFS with level arrays instead of a queue',
      kind: 'javascript',
      md: "`queue.shift()` is O(n) in JavaScript. For level-order problems you can skip the queue entirely: keep the current level in an array, build the next level in a new array, then swap. Level boundaries come for free (no `size` snapshot), and per-level answers such as “rightmost value” or “level average” are just reads of the array.",
      code: `function rightSideView(root) {
  const res = [];
  let level = root ? [root] : [];
  while (level.length) {
    res.push(level[level.length - 1].val);
    const next = [];
    for (const n of level) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
  }
  return res;
}`,
    },
    {
      title: 'Add parent links to turn the tree into a graph',
      kind: 'recognition',
      md: "Trees only point downward. When a question needs to move UP as well (“all nodes at distance k from target”, “burn the tree from a node”), record each node’s parent in a Map with one DFS. Now every node has up to three neighbours (left, right, parent) and an ordinary BFS with a visited Set answers the question.",
      code: `function distanceK(root, target, k) {
  const parent = new Map();
  const link = (n, p) => { if (n) { parent.set(n, p); link(n.left, n); link(n.right, n); } };
  link(root, null);
  let level = [target];
  const seen = new Set([target]);
  while (k-- > 0) {
    const next = [];
    for (const n of level) for (const m of [n.left, n.right, parent.get(n)])
      if (m && !seen.has(m)) { seen.add(m); next.push(m); }
    level = next;
  }
  return level.map((n) => n.val);
}`,
    },
    {
      title: 'Use -1 as a "failed" signal to return two facts in one number',
      kind: 'optimization',
      md: "Checking “is the tree balanced” with a separate height() call per node is O(n²). Instead let one function return the height, or -1 if any subtree is already unbalanced. A real height is never negative, so -1 cannot be confused with a valid answer, and you stop early as soon as -1 appears. The same idea works with null or Infinity for other checks.",
      code: `const heightOrFail = (n) => {
  if (!n) return 0;
  const l = heightOrFail(n.left); if (l === -1) return -1;
  const r = heightOrFail(n.right); if (r === -1) return -1;
  return Math.abs(l - r) > 1 ? -1 : 1 + Math.max(l, r);
};
const isBalanced = (root) => heightOrFail(root) !== -1;`,
    },
    {
      title: 'Two-tree recursion: let a === b handle the null cases',
      kind: 'javascript',
      md: "For “same tree”, “symmetric tree” and “subtree of”, walk two nodes in parallel. If at least one of them is null, the pair matches only when BOTH are null — which is exactly `a === b`. That one expression replaces three separate if-statements and removes the most common bug (returning true when only one side is null).",
      code: `const isMirror = (a, b) =>
  !a || !b ? a === b : a.val === b.val && isMirror(a.left, b.right) && isMirror(a.right, b.left);
const isSymmetric = (root) => !root || isMirror(root.left, root.right);`,
    },
    {
      title: 'Iterative postorder = reversed (root, right, left)',
      kind: 'template',
      md: "The true iterative postorder needs a “last visited” pointer and is easy to get wrong under pressure. Shortcut: do a preorder that pushes LEFT before RIGHT (so it visits root, right, left), then reverse the output — the reverse of root-right-left is left-right-root. Same O(n) time, uses a stack, and no recursion depth problems on skewed trees.",
      code: `function postorder(root) {
  const out = [], st = root ? [root] : [];
  while (st.length) {
    const n = st.pop();
    out.push(n.val);
    if (n.left) st.push(n.left);
    if (n.right) st.push(n.right);
  }
  return out.reverse();
}`,
    },
    {
      title: 'Morris traversal for O(1) extra space',
      kind: 'optimization',
      md: "If an interviewer asks for inorder without recursion AND without a stack, use Morris traversal: before going left, make the rightmost node of the left subtree point back to the current node (a temporary “thread”). When you arrive at that thread again, you know the left side is finished — remove the thread, visit, go right. Each edge is walked at most a few times, so it is still O(n), and the tree is restored at the end.",
      code: `function morrisInorder(root) {
  const out = [];
  let cur = root;
  while (cur) {
    if (!cur.left) { out.push(cur.val); cur = cur.right; continue; }
    let pre = cur.left;
    while (pre.right && pre.right !== cur) pre = pre.right;
    if (!pre.right) { pre.right = cur; cur = cur.left; }               // make thread
    else { pre.right = null; out.push(cur.val); cur = cur.right; }     // remove thread
  }
  return out;
}`,
    },
    {
      title: 'Re-base position indices per level to stay below 2^53',
      kind: 'edge-cases',
      md: "For “maximum width” you number nodes like a heap (children 2i and 2i + 1). On a deep, skewed tree these numbers double every level and pass 2^53 after ~53 levels, so Number loses precision and widths come out wrong. Subtract the first index of each level before computing children — the differences inside a level are all that matter.",
      code: `function widthOfBinaryTree(root) {
  let best = 0, level = root ? [[root, 0]] : [];
  while (level.length) {
    const base = level[0][1];
    best = Math.max(best, level[level.length - 1][1] - base + 1);
    const next = [];
    for (const [n, i] of level) {
      const j = i - base; // re-based index keeps numbers small
      if (n.left) next.push([n.left, 2 * j]);
      if (n.right) next.push([n.right, 2 * j + 1]);
    }
    level = next;
  }
  return best;
}`,
    },
    {
      title: 'Negative values: start at -Infinity and clamp gains at 0',
      kind: 'edge-cases',
      md: "In “maximum path sum”, initialising the answer with 0 is wrong when every value is negative (the answer is the largest single node). Start the global answer at -Infinity. When a child’s best downward path is negative, it is better to not take it at all, so use `Math.max(0, gain)` for each child before combining.",
      code: `function maxPathSum(root) {
  let best = -Infinity;
  const gain = (n) => {
    if (!n) return 0;
    const l = Math.max(0, gain(n.left)), r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r); // path bending at n
    return n.val + Math.max(l, r);        // one side only, for the parent
  };
  gain(root);
  return best;
}`,
    },
    {
      title: 'Key Maps and Sets by node objects, not by values',
      kind: 'javascript',
      md: "Node values are often NOT unique (many trees contain several 1s). When you store visited nodes, parents, or memo results, use the node object itself as the Map/Set key — JavaScript compares objects by identity, so two different nodes with the same value stay separate. Keying by `node.val` silently merges them.",
    },
  ],
  traps: [
    {
      looksLike: 'DFS for minimum depth using min(left, right)',
      actually: 'BFS that stops at the first leaf (or DFS that ignores missing children)',
      why: 'a node with one child is not a leaf; min(0, …) from the null side gives a wrong depth',
    },
    {
      looksLike: 'Diameter = height(left) + height(right) at the root',
      actually: 'Best left + right over ALL nodes',
      why: 'the longest path may bend at a node deep inside one subtree and never touch the root',
    },
    {
      looksLike: 'Serialising a tree with inorder only',
      actually: 'Preorder (or level order) with null markers',
      why: 'different trees share the same inorder sequence; null markers make one traversal unambiguous',
    },
    {
      looksLike: 'Plain DFS for "nodes at distance k"',
      actually: 'Parent map + BFS',
      why: 'nodes above and beside the target are only reachable by moving upward',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Tree', url: 'https://www.techinterviewhandbook.org/algorithms/tree/' },
    { label: 'Wikipedia — Tree traversal (iterative & Morris)', url: 'https://en.wikipedia.org/wiki/Tree_traversal' },
  ],
};
