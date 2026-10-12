// Perfect BST of 8191 nodes; hasNext/next alternate through all values, then a final hasNext → false.
const bigIteratorOps = () => {
  const n = 8191, vals = [], q = [[0, n - 1]];
  for (let h = 0; h < q.length; h++) {
    const [lo, hi] = q[h], mid = (lo + hi) >> 1;
    vals.push(mid * 3 - 50000);
    if (lo < mid) q.push([lo, mid - 1]);
    if (mid < hi) q.push([mid + 1, hi]);
  }
  const ops = ['BSTIterator'], args = [[vals]], expected = [null];
  for (let i = 0; i < n; i++) { ops.push('hasNext', 'next'); args.push([], []); expected.push(true, i * 3 - 50000); }
  ops.push('hasNext'); args.push([]); expected.push(false);
  return { ops, args, expected };
};

export default {
  id: 'binary-search-tree-iterator',
  title: 'Binary Search Tree Iterator',
  difficulty: 'Medium',
  order: 5,
  pattern: 'bst-inorder-sorted',
  kind: 'design',
  tags: ['tree', 'binary search tree', 'design', 'stack', 'iterator'],
  source: { platform: 'LeetCode', number: 173, url: 'https://leetcode.com/problems/binary-search-tree-iterator/' },

  statement: `Implement a class \`BSTIterator\` that walks a binary search tree **in increasing order** (in-order):

- \`new BSTIterator(root)\` — receives the root node of a BST.
- \`next()\` — returns the next smallest value. It is only called when a next value exists.
- \`hasNext()\` — returns \`true\` if there is still a value to return.

**Goal:** \`next()\` and \`hasNext()\` in **amortized O(1)** time, using **O(h)** memory (h = tree height) — so you may not simply copy all values into an array.

`,
  examples: [
    {
      input: 'root = [7,3,15,null,null,9,20]; calls: next, next, hasNext, next, hasNext, next, hasNext, next, hasNext',
      output: '[null,3,7,true,9,true,15,true,20,false]',
    },
  ],
  constraints: ['1 <= number of nodes <= 10^5', 'At most 10^5 calls', 'next() is only called when hasNext() is true'],

  think: `- The iterative in-order traversal uses a stack. What if you **pause** it after every visited node?
- What must be on the stack right after the constructor so that the top is the minimum?
- One \`next()\` can push many nodes. Why is the **average** still O(1)?`,
  patternChallenge: {
    options: ['Queue with BFS', 'BST — In-order Traversal = Sorted Order (controlled with a stack)', 'Min-heap of all values', 'BST — Guided Descent from the root on every call'],
    answer: 1,
    explanation: 'Sorted order = in-order. Keeping the in-order stack between calls gives lazy, one-step-at-a-time traversal with O(h) memory. A heap of all values is O(n) memory; re-searching from the root on every call costs O(h) each; BFS is not sorted.',
  },
  hints: [
    'In the constructor push the root and all its left descendants. The top of the stack is the smallest value.',
    '`next()`: pop a node, then push its right child and all of that child\'s left descendants. `hasNext()`: the stack is non-empty.',
  ],
  approach: `**Simple (O(n) memory):** in the constructor, flatten the in-order into an array and keep an index. \`next\` and \`hasNext\` are O(1), but memory is O(n) — fails the follow-up.

**Optimized (controlled in-order):** keep the iterative in-order stack as the iterator state.
- \`pushLeft(node)\`: push \`node\`, \`node.left\`, \`node.left.left\`, …
- constructor: \`pushLeft(root)\`.
- \`next()\`: \`node = stack.pop()\`; \`pushLeft(node.right)\`; return \`node.val\`.

The stack always holds the not-yet-visited ancestors along one path → O(h) memory. Across all n calls every node is pushed once and popped once → O(n) total → **O(1) amortized** per call.`,

  className: 'BSTIterator',
  io: { ctorParams: ['tree'] },
  starterCode: `class BSTIterator {
  /**
   * @param {TreeNode} root
   */
  constructor(root) {
    
  }

  /** @return {number} */
  next() {
    
  }

  /** @return {boolean} */
  hasNext() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: values come out in sorted order and hasNext turns false at the end.', ops: ['BSTIterator', 'next', 'next', 'hasNext', 'next', 'hasNext', 'next', 'hasNext', 'next', 'hasNext'], args: [[[7, 3, 15, null, null, 9, 20]], [], [], [], [], [], [], [], [], []], expected: [null, 3, 7, true, 9, true, 15, true, 20, false] },
    { scenario: 'Single node', hint: 'One node: hasNext is true, then false after one next().', ops: ['BSTIterator', 'hasNext', 'next', 'hasNext'], args: [[[1]], [], [], []], expected: [null, true, 1, false] },
    { scenario: 'Left-skewed chain', hint: 'The constructor must push the whole left spine so the minimum is on top.', ops: ['BSTIterator', 'next', 'next', 'next', 'hasNext'], args: [[[3, 2, null, 1]], [], [], [], []], expected: [null, 1, 2, 3, false] },
    { scenario: 'Right-skewed chain', hint: 'After popping a node, push the left spine of its RIGHT child (here just the child).', ops: ['BSTIterator', 'next', 'next', 'next', 'hasNext'], args: [[[1, null, 2, null, 3]], [], [], [], []], expected: [null, 1, 2, 3, false] },
    { scenario: 'Right child has left spine', hint: 'After 5, the next value is 6 — the leftmost node of 5\'s right subtree. Forgetting to push that spine skips 6 and 7.', ops: ['BSTIterator', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'hasNext'], args: [[[5, 1, 10, null, null, 7, 12, 6, 8]], [], [], [], [], [], [], [], []], expected: [null, 1, 5, 6, 7, 8, 10, 12, false] },
    { scenario: 'hasNext called repeatedly', hint: 'hasNext() must not change state — calling it twice in a row is harmless.', ops: ['BSTIterator', 'hasNext', 'hasNext', 'next', 'hasNext', 'hasNext', 'next', 'hasNext', 'hasNext'], args: [[[2, 1]], [], [], [], [], [], [], [], []], expected: [null, true, true, 1, true, true, 2, false, false] },
    { scenario: 'Interleaved calls', hint: 'Mix next() and hasNext() calls on a deeper tree.', ops: ['BSTIterator', 'next', 'next', 'next', 'next', 'next', 'hasNext', 'next', 'next', 'next', 'next', 'hasNext'], args: [[[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13]], [], [], [], [], [], [], [], [], [], [], []], expected: [null, 1, 3, 4, 6, 7, true, 8, 10, 13, 14, false] },
    { scenario: 'Negative and zero values', hint: 'Values can be 0 or negative; don\'t use a falsy check on the returned value.', ops: ['BSTIterator', 'next', 'next', 'next', 'hasNext', 'next', 'next', 'hasNext'], args: [[[0, -5, 5, -10, -1]], [], [], [], [], [], [], []], expected: [null, -10, -5, -1, true, 0, 5, false] },
    { scenario: 'Stop before the end', hint: 'Not every value has to be consumed; hasNext stays true while values remain.', ops: ['BSTIterator', 'next', 'next', 'hasNext', 'next', 'hasNext'], args: [[[4, 2, 6, 1, 3, 5, 7]], [], [], [], [], []], expected: [null, 1, 2, true, 3, true] },
    { scenario: 'Root is the maximum', hint: 'Everything is in the left subtree; the root comes out last.', ops: ['BSTIterator', 'next', 'next', 'next', 'next', 'next', 'next', 'hasNext'], args: [[[10, 5, null, 2, 7, null, null, 6, 8]], [], [], [], [], [], [], []], expected: [null, 2, 5, 6, 7, 8, 10, false] },
    { scenario: 'Root is the minimum', hint: 'Nothing on the left: the root comes out first, then the right subtree in order.', ops: ['BSTIterator', 'next', 'next', 'next', 'next', 'next', 'hasNext'], args: [[[1, null, 9, 4, null, 2, 6]], [], [], [], [], [], []], expected: [null, 1, 2, 4, 6, 9, false] },
    { scenario: 'Full tree (n = 63)', hint: 'A perfect tree of 63 nodes walked completely: each node is pushed and popped exactly once (amortized O(1)).', ops: ['BSTIterator', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'hasNext'], args: [[[96, 48, 144, 24, 72, 120, 168, 12, 36, 60, 84, 108, 132, 156, 180, 6, 18, 30, 42, 54, 66, 78, 90, 102, 114, 126, 138, 150, 162, 174, 186, 3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123, 129, 135, 141, 147, 153, 159, 165, 171, 177, 183, 189]], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []], expected: [null, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 111, 114, 117, 120, 123, 126, 129, 132, 135, 138, 141, 144, 147, 150, 153, 156, 159, 162, 165, 168, 171, 174, 177, 180, 183, 186, 189, false] },
    { scenario: 'Large tree (n = 8191)', hint: 'Re-walking the tree (O(n)) on every next/hasNext is ~10^8 steps here. Keep a stack of the left spine so each call is O(1) amortized.', opsGen: String(bigIteratorOps), timeLimitMs: 400 },
  ],

  solution: {
    code: `class BSTIterator {
  constructor(root) {
    this.stack = [];      // unvisited ancestors along one path; top = next smallest
    this.pushLeft(root);
  }

  pushLeft(node) {
    while (node) {
      this.stack.push(node);
      node = node.left;
    }
  }

  next() {
    const node = this.stack.pop();
    this.pushLeft(node.right); // the successor is the leftmost node of the right subtree
    return node.val;
  }

  hasNext() {
    return this.stack.length > 0;
  }
}`,
  },
  dryRun: {
    columns: ['call', 'stack before (bottom→top)', 'popped', 'pushed', 'returns'],
    rows: [
      ['constructor', '[]', '—', '7, 3', 'null'],
      ['next', '[7, 3]', '3', '— (3 has no right)', '3'],
      ['next', '[7]', '7', '15, 9', '7'],
      ['hasNext', '[15, 9]', '—', '—', 'true'],
      ['next', '[15, 9]', '9', '—', '9'],
      ['next', '[15]', '15', '20', '15'],
      ['next', '[20]', '20', '—', '20'],
      ['hasNext', '[]', '—', '—', 'false'],
    ],
  },
  complexity: { time: 'O(1) amortized per call', space: 'O(h)', explanation: 'Each node is pushed and popped exactly once over the whole iteration (n pushes for n next() calls). The stack holds at most one root-to-leaf path.' },
  alternative: {
    title: 'Flatten in the constructor',
    code: `class BSTIterator {
  constructor(root) { this.vals = traversals.inorder(root); this.i = 0; }
  next() { return this.vals[this.i++]; }
  hasNext() { return this.i < this.vals.length; }
}`,
    md: 'Strict O(1) per call but O(n) memory and O(n) work up front even if only a few values are requested.',
    complexity: 'O(n) memory',
  },
  mistakes: [
    'Flattening everything in the constructor when the problem asks for O(h) memory.',
    'Forgetting to push the left spine of the popped node\'s RIGHT child (you would skip whole subtrees).',
    'Claiming next() is O(h) worst case and therefore "not O(1)" — it is O(1) amortized.',
  ],
};
