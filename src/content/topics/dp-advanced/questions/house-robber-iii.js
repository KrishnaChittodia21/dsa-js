export default {
  id: 'house-robber-iii',
  title: 'House Robber III',
  difficulty: 'Medium',
  order: 6,
  pattern: 'dp-adv-tree',
  tags: ['tree', 'dfs', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 337, url: 'https://leetcode.com/problems/house-robber-iii/' },

  statement: `Houses are arranged as a **binary tree**; each node's value is the money in that house. Robbing two houses that are **directly linked** (parent and child) triggers the alarm.

Return the maximum amount you can rob without triggering the alarm. The tree is given in level order (\`null\` = missing child).`,
  examples: [
    { input: 'root = [3,2,3,null,3,null,1]', output: '7', explanation: '3 + 3 + 1.' },
    { input: 'root = [3,4,5,1,3,null,1]', output: '9', explanation: '4 + 5.' },
  ],
  constraints: ['1 <= number of nodes <= 10^4', '0 <= Node.val <= 10^4'],

  think: `- If you rob a node, what must be true about its children? If you skip it?
- What does the parent need to know from each child's subtree to decide?
- Can one DFS return two numbers per node?`,
  patternChallenge: {
    options: ['Level-order BFS: rob alternate levels', 'Tree DP returning [rob, skip] per node', 'Greedy: rob the largest nodes first', 'Binary search on the answer'],
    answer: 1,
    explanation: 'Alternate levels fail (e.g. [2,1,3,null,4] → best is 3 + 4 across levels 1 and 2). Each subtree only interacts with its parent through its root, so returning [bestIfRobbed, bestIfSkipped] lets the parent decide in O(1).',
  },
  hints: [
    'dfs(node) returns [rob, skip]. For null return [0, 0].',
    'rob = node.val + left.skip + right.skip; skip = max(left) + max(right). Answer = max(dfs(root)).',
  ],
  approach: `**Brute force:** rob(node) = max(node.val + rob(grandchildren), rob(children)) → exponential without memo (each node recomputed from many ancestors).

**Tree DP:** post-order DFS returning a pair:
- \`rob  = val + left.skip + right.skip\` (children must be skipped)
- \`skip = max(left.rob, left.skip) + max(right.rob, right.skip)\` (children are free)

Each node is visited once → O(n). The tests pass the tree as a \`TreeNode\` root (built from the level-order array).`,

  functionName: 'rob',
  paramNames: ['root'],
  io: { params: ['tree'] },
  starterCode: `/**
 * Definition: TreeNode { val, left, right }
 * @param {TreeNode} root
 * @return {number}
 */
function rob(root) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "Rob the root and the two grandchildren: 3 + 3 + 1 = 7.", args: [[3,2,3,null,3,null,1]], expected: 7 },
    { scenario: "Example 2", hint: "Skip the root and rob its children: 4 + 5 = 9.", args: [[3,4,5,1,3,null,1]], expected: 9 },
    { scenario: "Single house", hint: "Just the root — rob it.", args: [[5]], expected: 5 },
    { scenario: "Single house worth zero", hint: "Values can be 0; the answer is 0, not undefined or −∞.", args: [[0]], expected: 0 },
    { scenario: "All zeros", hint: "Nothing is worth robbing.", args: [[0,0,0]], expected: 0 },
    { scenario: "Root and one child", hint: "Adjacent houses: take the larger of the two.", args: [[2,7]], expected: 7 },
    { scenario: "Alternate levels fail", hint: "Alternate levels give at most 6 (2 + 4); the best takes 4 and 3 from different levels. Track rob/skip per node, not per level.", args: [[2,1,3,null,4]], expected: 7 },
    { scenario: "Skip two levels in a row", hint: "In the chain 4-1-2-3 the best robs 4 and 3, skipping two houses in a row — a single \"best at this node\" number loses that option.", args: [[4,1,null,2,null,3]], expected: 7 },
    { scenario: "Deep leaf dominates", hint: "A huge value deep in the tree forces skipping its parent even though the parent level looks rich.", args: [[10,1,1,100,null,null,1]], expected: 111 },
    { scenario: "Duplicate values", hint: "Many nodes share the value 5. Memoizing by node.val (instead of by node) mixes up different subtrees.", args: [[5,5,5,5,1,1,5,5,null,null,null,null,null,1,5]], expected: 21 },
    { scenario: "Max values", hint: "Values up to 10^4; perfect tree of 7 — the root plus its four grandchildren win (5·10^4).", args: [[10000,10000,10000,10000,10000,10000,10000]], expected: 50000 },
    { scenario: "Long spine with leaves (n ≈ 6000)", hint: "A 3000-deep spine where every node also has a leaf. Recursing into grandchildren without memoization recomputes subtrees exponentially (Fibonacci-like); return a (rob, skip) pair per node for O(n).", argsGen: "() => { let s = 5; const r = () => (s = (s * 16807) % 2147483647) % 10001; const a = [r()]; for (let i = 0; i < 3000; i++) { a.push(r(), r()); if (i < 2999) a.push(null, null); } return [a]; }", expected: 18934981, timeLimitMs: 1000 },
    { scenario: "Large random tree (n = 10^4)", hint: "An irregular tree with ~10^4 nodes; O(n) post-order is required.", argsGen: "() => { let s = 3, cnt = 1; const a = [7]; while (cnt < 10000) { s = (s * 16807) % 2147483647; if (s % 4 === 0) a.push(null); else { a.push(s % 10001); cnt++; } } return [a]; }", expected: 32189891, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function rob(root) {
  // returns [best if this node is robbed, best if it is skipped]
  function dfs(node) {
    if (!node) return [0, 0];
    const [leftRob, leftSkip] = dfs(node.left);
    const [rightRob, rightSkip] = dfs(node.right);
    const robIt = node.val + leftSkip + rightSkip;
    const skipIt = Math.max(leftRob, leftSkip) + Math.max(rightRob, rightSkip);
    return [robIt, skipIt];
  }
  return Math.max(...dfs(root));
}`,
  },
  dryRun: {
    columns: ['node', 'children [rob, skip]', 'returns [rob, skip]'],
    rows: [['3 (leaf, left-right)', '—', '[3, 0]'], ['1 (leaf)', '—', '[1, 0]'], ['2', 'right [3,0]', '[2, 3]'], ['3 (right child)', 'right [1,0]', '[3, 1]'], ['root 3', '[2,3], [3,1]', '[3+3+1 = 7, 3+3 = 6]']],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'Each node processed once; recursion depth equals tree height h.' },
  alternative: {
    title: 'Memoized "rob or skip" with a Map keyed by node',
    md: 'best(node) = max(val + best(grandchildren), best(children)), memoized in a Map (object keys compare by identity). Same O(n), more calls.',
    code: `function rob(root) {
  const memo = new Map();
  function best(node) {
    if (!node) return 0;
    if (memo.has(node)) return memo.get(node);
    let take = node.val;
    if (node.left) take += best(node.left.left) + best(node.left.right);
    if (node.right) take += best(node.right.left) + best(node.right.right);
    const r = Math.max(take, best(node.left) + best(node.right));
    memo.set(node, r);
    return r;
  }
  return best(root);
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Robbing alternate levels.',
    'Returning only one number and losing the "skipped" information.',
    'Memoizing by node.val (different nodes can share values).',
  ],
};
