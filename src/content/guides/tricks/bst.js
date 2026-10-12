export default {
  signals: [
    '"closest value to target" / "floor and ceiling" in a BST',
    '"two numbers in the BST that sum to k"',
    '"k-th smallest" asked many times while the tree changes',
    '"serialize a BST as compactly as possible"',
    '"two nodes were swapped by mistake"',
    'you need a sorted set with insert/delete/neighbour queries (TreeMap / TreeSet)',
  ],
  tricks: [
    {
      title: 'Floor and ceiling in one descent',
      kind: 'template',
      md: "Walk down exactly as in search. Every time you move RIGHT, the current node is smaller than x, so it is the best floor seen so far; every time you move LEFT, it is the best ceiling so far. The last candidates recorded are the answers. Same O(h) loop answers “closest value” (compare both) and “inorder successor” (ceiling of x + ε).",
      code: `function floorCeil(root, x) {
  let floor = null, ceil = null, n = root;
  while (n) {
    if (n.val === x) return [x, x];
    if (n.val < x) { floor = n.val; n = n.right; }
    else { ceil = n.val; n = n.left; }
  }
  return [floor, ceil];
}`,
    },
    {
      title: 'Inorder successor without parent pointers',
      kind: 'template',
      md: "Start at the root and look for p. Whenever you go LEFT, the node you leave is larger than p and is a candidate successor (the last left turn is the closest one). When you go right, nothing changes. This avoids the two-case textbook rule (min of right subtree vs climbing parents) and needs no parent links.",
      code: `function successor(root, p) {
  let succ = null;
  while (root) {
    if (p.val < root.val) { succ = root; root = root.left; }
    else root = root.right;
  }
  return succ;
}`,
    },
    {
      title: 'Preorder alone rebuilds a BST',
      kind: 'template',
      md: "For a general binary tree you need two traversals (or null markers). For a BST, preorder is enough because the values themselves tell you where each subtree ends: build recursively with an upper bound, and stop a subtree as soon as the next value exceeds its bound. One shared index, O(n) total — and the serialised form is just the list of values.",
      code: `function bstFromPreorder(pre) {
  let i = 0;
  const build = (hi) => {
    if (i === pre.length || pre[i] > hi) return null;
    const node = { val: pre[i++], left: null, right: null };
    node.left = build(node.val);  // left values are below this node
    node.right = build(hi);       // right values stay below the parent bound
    return node;
  };
  return build(Infinity);
}`,
    },
    {
      title: 'Two-sum in a BST with two inorder iterators',
      kind: 'optimization',
      md: "Instead of dumping the tree into an array (O(n) space), run two stack-based iterators: one yields values in increasing order (go left), the other in decreasing order (go right). That gives the classic sorted two-pointer scan with only O(h) memory. Stop when the two iterators reach the same node.",
      code: `function findTarget(root, k) {
  const L = [], R = [];
  const pushL = (n) => { while (n) { L.push(n); n = n.left; } };
  const pushR = (n) => { while (n) { R.push(n); n = n.right; } };
  pushL(root); pushR(root);
  while (L.length && R.length) {
    const a = L[L.length - 1], b = R[R.length - 1];
    if (a === b) return false; // pointers met
    const s = a.val + b.val;
    if (s === k) return true;
    if (s < k) pushL(L.pop().right); else pushR(R.pop().left);
  }
  return false;
}`,
    },
    {
      title: 'Store subtree sizes for O(h) k-th smallest and rank',
      kind: 'optimization',
      md: "If k-th smallest is asked repeatedly while nodes are inserted, an inorder walk each time is O(n). Keep `size` (number of nodes in the subtree) in every node and update it on insert/delete. Then at each node compare k with the size of the left subtree to decide which way to go: O(h) per query. This is called an order-statistic tree.",
      code: `const size = (n) => (n ? n.size : 0);
function kth(n, k) { // 1-based
  while (n) {
    const leftSize = size(n.left);
    if (k === leftSize + 1) return n.val;
    if (k <= leftSize) n = n.left;
    else { k -= leftSize + 1; n = n.right; }
  }
  return null;
}`,
    },
    {
      title: 'Recover swapped nodes: first dip’s left, last dip’s right',
      kind: 'edge-cases',
      md: "Inorder of the broken BST is a sorted list with two values swapped. If the swapped nodes are far apart you see TWO dips (a[i−1] > a[i]); if they are neighbours you see only ONE. Take the left element of the first dip and the right element of the LAST dip — keep overwriting `second` and the adjacent case works without a special branch.",
      code: `function findSwapped(inorderVals) {
  let first = -1, second = -1;
  for (let i = 1; i < inorderVals.length; i++) {
    if (inorderVals[i - 1] > inorderVals[i]) {
      if (first === -1) first = i - 1;
      second = i; // keep updating
    }
  }
  return [inorderVals[first], inorderVals[second]];
}
console.log(findSwapped([1, 6, 3, 4, 5, 2])); // → [6,2]
console.log(findSwapped([1, 3, 2, 4])); // → [3,2]`,
    },
    {
      title: 'No TreeMap in JavaScript — say what you would use',
      kind: 'javascript',
      md: "Java has TreeMap and C++ has std::set; JavaScript has neither, and Map keeps INSERTION order, not sorted order. In an interview, say: “I need a balanced BST (floor/ceiling in O(log n)); in JS I will use a sorted array with binary search, which makes inserts O(n) but is fast in practice”. If only min/max is needed, a heap is enough.",
    },
    {
      title: 'Ask how duplicates are stored',
      kind: 'interview',
      md: "Definitions differ: some BSTs put equal keys on the left (≤), some on the right, some store a `count` field and keep keys unique. This changes validation (`<` vs `<=`), deletion and k-th queries. Ask early; if you choose, the count field is the cleanest because the strict invariant and all O(h) descents stay unchanged.",
    },
    {
      title: 'Prune range queries by the BST property',
      kind: 'optimization',
      md: "For “sum / count / list values in [lo, hi]”, do not visit everything. If node.val < lo, the whole left subtree is also < lo — skip it and go right only; if node.val > hi, go left only. You touch O(h + output) nodes instead of O(n).",
      code: `function rangeSum(n, lo, hi) {
  if (!n) return 0;
  if (n.val < lo) return rangeSum(n.right, lo, hi);
  if (n.val > hi) return rangeSum(n.left, lo, hi);
  return n.val + rangeSum(n.left, lo, hi) + rangeSum(n.right, lo, hi);
}`,
    },
  ],
  traps: [
    {
      looksLike: 'Any BST question → inorder into an array, then solve',
      actually: 'O(h) guided descent or a lazy iterator',
      why: 'it works but costs O(n) time and space; interviewers usually expect you to use the ordering to skip subtrees',
    },
    {
      looksLike: 'Generic binary-tree LCA (search both subtrees)',
      actually: 'BST split point by value comparison',
      why: 'the LCA is the first node whose value lies between p and q — one path down, O(h) and O(1) space',
    },
    {
      looksLike: 'Repeated "k-th smallest" with an inorder walk each time',
      actually: 'Size-augmented (order-statistic) tree',
      why: 'subtree sizes let each query pick a direction in O(h) instead of O(k)',
    },
  ],
  sources: [
    { label: 'Wikipedia — Binary search tree', url: 'https://en.wikipedia.org/wiki/Binary_search_tree' },
    { label: 'Tech Interview Handbook — Tree (BST section)', url: 'https://www.techinterviewhandbook.org/algorithms/tree/' },
  ],
};
