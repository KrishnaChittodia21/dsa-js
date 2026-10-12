export default {
  id: 'lowest-common-ancestor-of-a-binary-tree',
  title: 'Lowest Common Ancestor of a Binary Tree',
  difficulty: 'Medium',
  order: 6,
  pattern: 'tree-lca',
  tags: ['tree', 'dfs', 'recursion'],
  source: { platform: 'LeetCode', number: 236, url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/' },

  statement: `Given the \`root\` of a binary tree and two **nodes** \`p\` and \`q\` that are both in the tree, return their **lowest common ancestor** (LCA): the deepest node that has both \`p\` and \`q\` as descendants. A node counts as a descendant of itself.

All node values are unique. Your function receives and returns node objects (the tests look nodes up by value and compare the value of the node you return).`,
  examples: [
    { input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1', output: '3' },
    { input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4', output: '5', explanation: '5 is an ancestor of 4, and a node is its own descendant.' },
    { input: 'root = [1,2], p = 1, q = 2', output: '1' },
  ],
  constraints: ['The number of nodes is in the range [2, 10^5]', 'All Node.val are unique', 'p !== q, and both exist in the tree'],

  think: `- Without parent pointers you cannot walk upwards. What could each subtree **report back** to its parent?
- At the LCA, where are p and q relative to it?
- If the recursion reaches p, does it need to search below p?`,
  patternChallenge: {
    options: ['Tree BFS — Level Order', 'Lowest Common Ancestor — subtrees report what they found', 'Binary Search on values', 'Tree Construction'],
    answer: 1,
    explanation: 'Each call returns p, q, the LCA, or null. The first node that receives non-null from **both** sides is the split point. Binary search on values only works for a BST (next topic) — this is a general binary tree.',
  },
  hints: [
    'Base case: if root is null, p or q, return root.',
    'Recurse left and right. If both results are non-null, root is the LCA. Otherwise return whichever side is non-null.',
  ],
  approach: `**Brute force:** find the root-to-p path and the root-to-q path (two DFS searches), then walk both paths from the root while they agree; the last common node is the LCA. O(n) time, O(n) extra space.

**One-pass recursion:** \`lca(node)\` returns:
- \`null\` if neither p nor q is in node's subtree,
- p or q if exactly one was found (or if node itself is p or q),
- the LCA if both were found below.

If \`left\` and \`right\` are both non-null, p and q are on different sides → this node is the LCA. Otherwise pass up the non-null side. Why is stopping at p safe? If q is below p, p **is** the answer; if q is elsewhere, some higher node will receive p from one side and q from the other.`,

  functionName: 'lowestCommonAncestor',
  paramNames: ['root', 'p', 'q'],
  starterCode: `/**
 * @param {TreeNode} root
 * @param {TreeNode} p
 * @param {TreeNode} q
 * @return {TreeNode}
 */
function lowestCommonAncestor(root, p, q) {
  
}
`,
  // Tests are [levelOrderArray, pValue, qValue]; the harness builds the tree,
  // finds the p and q nodes, and reports the value of the node you return.
  harness: `(lowestCommonAncestor, args, h) => {
    const root = h.arrayToTree(args[0]);
    const p = h.findNode(root, args[1]);
    const q = h.findNode(root, args[2]);
    const res = lowestCommonAncestor(root, p, q);
    return res ? res.val : null;
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'p and q are in different subtrees of the root, so the root is the LCA.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], expected: 3 },
    { scenario: 'Example 2', hint: 'p is an ancestor of q — a node counts as its own descendant, so p is the answer.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], expected: 5 },
    { scenario: 'Example 3', hint: 'Smallest tree: the root is p and q is its child.',
      args: [[1, 2], 1, 2], expected: 1 },
    { scenario: 'Both deep in one subtree', hint: 'p and q are siblings deep on the left; the LCA is their parent, not the root.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 4], expected: 2 },
    { scenario: 'Split below the root', hint: 'p and q split at node 5. Return the first node where they appear on different sides.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 6, 4], expected: 5 },
    { scenario: 'Leaves on opposite sides', hint: 'The deepest left leaf and a right leaf — they only meet at the root.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 8], expected: 3 },
    { scenario: 'q is the ancestor of p', hint: 'Mistake check: the ancestor case must work in both argument orders.',
      args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 4, 5], expected: 5 },
    { scenario: 'Child given before root', hint: 'Two nodes with p as the child and q as the root — the root is still the answer.',
      args: [[1, 2], 2, 1], expected: 1 },
    { scenario: 'Chain: ancestor in a line', hint: 'In a chain, the higher of the two nodes is the LCA; stop as soon as you reach p or q.',
      args: [[1, 2, null, 3, null, 4, null, 5], 5, 3], expected: 3 },
    { scenario: 'Negative values', hint: 'Values can be negative; compare node references (or values), never truthiness.',
      args: [[-1, 0, 3, -2, 4, null, null, 8], 8, 4], expected: 0 },
    { scenario: 'LCA has value 0', hint: 'The answer node holds 0. A check like `if (left && right)` on values instead of nodes would treat 0 as "not found".',
      args: [[0, 1, 2, 3, 4, 5, 6], 3, 6], expected: 0 },
    { scenario: 'Large balanced tree (n = 10^5)', hint: 'A complete tree with 100 000 nodes. One post-order pass is O(n).',
      argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i), 99999, 99990]', expected: 1561 },
    { scenario: 'Deep chain (5000 nodes)', hint: 'A 5000-node left chain with p at the bottom and q in the middle — q is the ancestor.',
      argsGen: '() => { const a = []; for (let i = 0; i < 5000; i++) { a.push(i); if (i > 0) a.push(null); } return [a, 4999, 2500]; }', expected: 2500 },
  ],

  solution: {
    code: `function lowestCommonAncestor(root, p, q) {
  if (root === null || root === p || root === q) return root;  // found one (or nothing)
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left !== null && right !== null) return root;  // p and q split here
  return left !== null ? left : right;               // pass up what was found
}`,
  },
  dryRun: {
    columns: ['node', 'left returns', 'right returns', 'node returns'],
    rows: [
      ['6', 'null', 'null', 'null'],
      ['7', '—', '—', '7 (is p)'],
      ['4', '—', '—', '4 (is q)'],
      ['2', '7', '4', '2 ← both sides found'],
      ['5', 'null (from 6)', '2', '2'],
      ['1', 'null', 'null', 'null'],
      ['3', '2', 'null', '2 = answer'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node is visited at most once; recursion depth is the height.' },
  alternative: {
    title: 'Parent pointers + ancestor Set',
    md: 'BFS/DFS once to record `parent` of every node in a Map. Walk up from p adding each ancestor to a Set; then walk up from q until you meet a node in the Set. Iterative — no deep recursion.',
    code: `function lowestCommonAncestor(root, p, q) {
  const parent = new Map([[root, null]]);
  const stack = [root];
  while (!parent.has(p) || !parent.has(q)) {
    const node = stack.pop();
    if (node.left) { parent.set(node.left, node); stack.push(node.left); }
    if (node.right) { parent.set(node.right, node); stack.push(node.right); }
  }
  const ancestors = new Set();
  for (let x = p; x; x = parent.get(x)) ancestors.add(x);
  let y = q;
  while (!ancestors.has(y)) y = parent.get(y);
  return y;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Comparing values instead of node references (fine here because values are unique, but a bad habit).',
    'Returning `true/false` instead of nodes — you then need extra bookkeeping to know which node is the answer.',
    'Forgetting the case where p is an ancestor of q.',
    'Deep recursion on a 10⁵-node chain in JavaScript — mention the iterative alternative.',
  ],
};
