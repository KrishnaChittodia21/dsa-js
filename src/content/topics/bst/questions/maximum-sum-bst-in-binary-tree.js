export default {
  id: 'maximum-sum-bst-in-binary-tree',
  title: 'Maximum Sum BST in Binary Tree',
  difficulty: 'Hard',
  order: 1,
  pattern: 'bst-bottom-up-info',
  tags: ['tree', 'binary search tree', 'dfs', 'post-order'],
  source: { platform: 'LeetCode', number: 1373, url: 'https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/' },

  statement: `You are given the \`root\` of an ordinary **binary tree** (not necessarily a BST). Among all subtrees that are valid BSTs, return the **largest sum of values** of such a subtree.

A subtree means a node together with **all** of its descendants. The empty tree counts as a BST with sum 0, so the answer is never negative.`,
  examples: [
    { input: 'root = [1,4,3,2,4,2,5,null,null,null,null,null,null,4,6]', output: '20', explanation: 'The subtree rooted at 3 (values 3, 2, 5, 4, 6) is a BST with sum 20.' },
    { input: 'root = [4,3,null,1,2]', output: '2', explanation: 'The single node 2 is the best BST.' },
    { input: 'root = [-4,-2,-5]', output: '0', explanation: 'Every BST has a negative sum, so the empty BST (0) wins.' },
  ],
  constraints: ['1 <= number of nodes <= 4 * 10^4', '-4 * 10^4 <= Node.val <= 4 * 10^4'],

  think: `- To know whether the subtree at \`node\` is a BST, what do you need to know about its left and right subtrees?
- Checking every subtree from scratch is O(n²). What can each child **return** so the parent decides in O(1)?
- What should an empty subtree report so that it never blocks its parent?`,
  patternChallenge: {
    options: ['BST — Pass Valid Range Down (top-down bounds)', 'Sliding Window', 'BST — Bottom-up Subtree Info', 'BST — In-order Traversal = Sorted Order'],
    answer: 2,
    explanation: 'We need facts about every subtree (is it a BST, its min, max and sum), and a parent\'s answer depends on its children\'s answers — a post-order, bottom-up DFS. Top-down bounds assume you know where the BST starts; in-order on a non-BST gives no sorted guarantee.',
  },
  hints: [
    'Post-order DFS returning `[isBST, min, max, sum]` for each subtree.',
    'The node is a BST root iff both children are BSTs and `left.max < node.val < right.min`. Empty subtree: `[true, +Infinity, -Infinity, 0]`. Update a global best with the sum whenever the check passes.',
  ],
  approach: `**Brute force:** for every node, run "validate BST" and "sum" on its subtree — O(n) each → O(n²) (4·10⁴ nodes on a chain is ~10⁹ steps).

**Optimized (bottom-up summaries, O(n)):** DFS returns for each subtree:
- \`isBST\`, \`min\` (smallest value), \`max\` (largest value), \`sum\`.

At a node, with summaries \`L\` and \`R\` of its children:
- if \`L.isBST && R.isBST && L.max < node.val && node.val < R.min\` → it is a BST: \`sum = L.sum + node.val + R.sum\`, \`min = min(L.min, node.val)\`, \`max = max(R.max, node.val)\`; update \`best\`.
- otherwise → return \`isBST = false\` (ancestors can never be BSTs either).

Empty subtree → \`(true, +∞, −∞, 0)\`, the neutral element. \`best\` starts at 0 (the empty BST).`,

  functionName: 'maxSumBST',
  paramNames: ['root'],
  starterCode: `/**
 * @param {TreeNode} root
 * @return {number}
 */
function maxSumBST(root) {
  
}
`,
  io: { params: ['tree'], returns: 'any' },
  tests: [
    { scenario: 'Example 1', hint: 'The best BST is the subtree rooted at 3 (sum 20), not the whole tree.', args: [[1, 4, 3, 2, 4, 2, 5, null, null, null, null, null, null, 4, 6]], expected: 20 },
    { scenario: 'Example 2', hint: 'Only the single leaf 2 forms the best BST.', args: [[4, 3, null, 1, 2]], expected: 2 },
    { scenario: 'Example 3', hint: 'All values negative: the empty BST (sum 0) wins. Initialising best to -Infinity returns a negative number.', args: [[-4, -2, -5]], expected: 0 },
    { scenario: 'Single positive node', hint: 'One node is a BST; its sum is its value.', args: [[1]], expected: 1 },
    { scenario: 'Single negative node', hint: 'The answer is 0 (empty BST), not -1.', args: [[-1]], expected: 0 },
    { scenario: 'Whole tree is a BST', hint: 'Every subtree is valid, so the whole tree gives the best sum.', args: [[8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13]], expected: 66 },
    { scenario: 'Best is a subtree, not whole', hint: 'The whole tree is a BST (sum 26) but its right subtree alone sums to 30 — compare every valid subtree.', args: [[1, -5, 10, null, null, 8, 12]], expected: 30 },
    { scenario: 'Subtree needs all descendants', hint: 'A "subtree" includes every descendant: 8\'s subtree contains 3, which breaks it, so you cannot just drop 3.', args: [[5, 4, 8, 3, null, 6, 3]], expected: 7 },
    { scenario: 'Child missing on left', hint: 'Node 3 has no left child, so its minimum is 3 itself. Using lMin alone (+∞) lets the root 5 accept a right subtree containing 3.', args: [[5, null, 3, null, 9]], expected: 12 },
    { scenario: 'Child missing on right', hint: 'Node 7 has no right child, so its maximum is 7 itself; using rMax alone (−∞) lets 6 accept a left subtree containing 7.', args: [[6, 7, null, 2]], expected: 9 },
    { scenario: 'Duplicate values', hint: 'Equal values break the strict BST ordering; only single nodes count here.', args: [[2, 2, 2]], expected: 2 },
    { scenario: 'Negative root, positive leaves', hint: '5 on the left of -10 breaks the order; the best is the leaf 20.', args: [[-10, 5, 20]], expected: 20 },
    { scenario: 'Mixed signs, deep subtree', hint: 'Negative values inside a valid BST reduce its sum; a smaller BST deeper down can be better.', args: [[4, 8, null, 6, 1, 9, null, -5, 4, null, null, null, -3, null, 10]], expected: 14 },
    { scenario: 'Deep tree (n = 4·10^4)', hint: 'A 5000-deep tree of 40000 nodes. Re-validating every subtree from scratch is O(n·h); return [isBST, min, max, sum] bottom-up in one O(n) pass.', argsGen: '() => { const H = 5000; const b = (d) => d === 0 ? null : new TreeNode(0, b(d - 1), b(d - 1)); const root = new TreeNode(0); let s = root; for (let i = 1; i < H; i++) { s.left = b(3); s.right = new TreeNode(0); s = s.right; } s.left = b(3); const st = []; let n = root, v = -20000; while (n || st.length) { while (n) { st.push(n); n = n.left; } n = st.pop(); n.val = v++; n = n.right; } return [treeToArray(root)]; }', expected: 199990000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxSumBST(root) {
  let best = 0; // the empty BST

  // returns [isBST, min, max, sum] for the subtree rooted at node
  const dfs = (node) => {
    if (!node) return [true, Infinity, -Infinity, 0];
    const [lBST, lMin, lMax, lSum] = dfs(node.left);
    const [rBST, rMin, rMax, rSum] = dfs(node.right);
    if (lBST && rBST && lMax < node.val && node.val < rMin) {
      const sum = lSum + node.val + rSum;
      best = Math.max(best, sum);
      return [true, Math.min(lMin, node.val), Math.max(rMax, node.val), sum];
    }
    return [false, 0, 0, 0]; // min/max/sum are irrelevant once isBST is false
  };

  dfs(root);
  return best;
}`,
    explanation: 'Recursion depth equals the tree height; for the given constraints this is fine in Node/browsers. An explicit post-order stack removes the recursion if needed.',
  },
  dryRun: {
    columns: ['node', 'left summary', 'right summary', 'BST?', 'sum', 'best'],
    rows: [
      ['4 (under 5)', 'empty', 'empty', 'yes', '4', '4'],
      ['6', 'empty', 'empty', 'yes', '6', '6'],
      ['5', '(4..4, 4)', '(6..6, 6)', '4 < 5 < 6 → yes', '15', '15'],
      ['2 (under 3)', 'empty', 'empty', 'yes', '2', '15'],
      ['3', '(2..2, 2)', '(4..6, 15)', '2 < 3 < 4 → yes', '20', '20'],
      ['4 (under 1)', '2', '4', 'no (4 is not < 4)', '—', '20'],
      ['1', 'not BST', '…', 'no', '—', '20'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node is processed once, combining two O(1) summaries. Recursion depth is the height.' },
  alternative: {
    title: 'Validate from every node (brute force)',
    md: 'For each node call validate(node, -∞, ∞) and, if valid, sum the subtree. Simple but O(n²) on skewed trees.',
    complexity: 'O(n²) time',
  },
  mistakes: [
    'Initialising best to -Infinity — the empty BST (sum 0) is allowed, so all-negative trees must return 0.',
    'Reversed sentinels for the empty subtree (it must be min = +∞, max = −∞).',
    'Computing min as `lMin` alone — when the left child is empty that is +∞; use min(lMin, node.val).',
    'Treating "subtree" as any connected part — it must include all descendants.',
  ],
};
