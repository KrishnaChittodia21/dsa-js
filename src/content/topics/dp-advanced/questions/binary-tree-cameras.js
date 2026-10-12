export default {
  id: 'binary-tree-cameras',
  title: 'Binary Tree Cameras',
  difficulty: 'Hard',
  order: 5,
  pattern: 'dp-adv-tree',
  tags: ['tree', 'dfs', 'dynamic programming', 'greedy'],
  source: { platform: 'LeetCode', number: 968, url: 'https://leetcode.com/problems/binary-tree-cameras/' },

  statement: `You place cameras on nodes of a binary tree. A camera **monitors its own node, its parent and its immediate children**.

Return the minimum number of cameras needed so that every node is monitored. The tree is given in level order (all values are 0; \`null\` = missing child).`,
  examples: [
    { input: 'root = [0,0,null,0,0]', output: '1', explanation: 'One camera on the root\'s left child covers everything.' },
    { input: 'root = [0,0,null,0,null,0,null,null,0]', output: '2' },
  ],
  constraints: ['1 <= number of nodes <= 1000'],

  think: `- Should a leaf ever hold a camera? Compare with putting it on the leaf's parent.
- Process the tree bottom-up. What does a node need to tell its parent?
- What happens at the root if nobody has covered it?`,
  patternChallenge: {
    options: ['BFS level by level, camera on every other level', 'Tree DP with 3 states per node (not covered / covered / camera)', 'Bitmask DP over all nodes', 'Union Find'],
    answer: 1,
    explanation: 'Alternating levels is wasteful and sometimes wrong. A post-order DFS returning one of three states lets each parent decide greedily; it is optimal because a camera placed on a parent covers a superset of what it would cover on the child. Bitmask over 1000 nodes is impossible.',
  },
  hints: [
    'States: 0 = not covered (needs the parent), 1 = covered without a camera, 2 = has a camera. A null child returns 1.',
    'If any child is 0 → place a camera (return 2). Else if any child is 2 → return 1. Else return 0. After the DFS, if the root returned 0, add a camera.',
  ],
  approach: `**Brute force:** try every subset of nodes as camera positions → O(2^n · n).

**Tree DP / greedy post-order:**
- Leaves should not hold cameras: a camera on the parent covers the leaf, the parent, the sibling and the grandparent — a superset.
- So we delay cameras as long as possible: a node returns "not covered" (0) and lets its parent take care of it.
- A node with an uncovered child **must** get a camera (only it or the child could cover the child, and the child already declined).
- A node with a camera child is covered (1).
- Root left uncovered → one extra camera.

A full DP alternative keeps three costs per node (camera here / covered by a child / covered by the parent) and takes minima — useful when cameras have different costs.`,

  functionName: 'minCameraCover',
  paramNames: ['root'],
  io: { params: ['tree'] },
  starterCode: `/**
 * Definition: TreeNode { val, left, right }
 * @param {TreeNode} root
 * @return {number}
 */
function minCameraCover(root) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "One camera on the root's left child watches all four nodes.", args: [[0,0,null,0,0]], expected: 1 },
    { scenario: "Example 2", hint: "A chain of 5 needs two cameras, placed on parents of leaves.", args: [[0,0,null,0,null,0,null,null,0]], expected: 2 },
    { scenario: "Single node", hint: "The lone root has no parent to cover it — the final root check must add a camera.", args: [[0]], expected: 1 },
    { scenario: "Two nodes", hint: "One camera on either node covers both.", args: [[0,0]], expected: 1 },
    { scenario: "Root with two leaves", hint: "If null children count as \"not covered\", you force cameras onto both leaves (2). Treat null as covered: one camera at the root.", args: [[0,0,0]], expected: 1 },
    { scenario: "Root left uncovered", hint: "In a chain of 4 the DFS returns \"not covered\" at the root. Forgetting the final root check gives 1 instead of 2.", args: [[0,0,null,0,null,0]], expected: 2 },
    { scenario: "Perfect tree of 7", hint: "Cameras on the leaves would need 4; cameras on the leaves' parents need only 2.", args: [[0,0,0,0,0,0,0]], expected: 2 },
    { scenario: "Perfect tree of 15", hint: "Greedy from the bottom: parents of leaves get cameras, then the root is left uncovered and needs its own camera (5 total).", args: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]], expected: 5 },
    { scenario: "Zigzag spine with leaves", hint: "An irregular shape — the three-state post-order DFS must handle one-child nodes on either side.", args: [[0,0,0,null,0,null,null,0,0,null,null,null,0]], expected: 3 },
    { scenario: "Right-leaning chain", hint: "Only right children here; the logic must be symmetric.", args: [[0,null,0,null,0,null,0,null,0,null,0,null,0]], expected: 3 },
    { scenario: "Long chain (n = 1000)", hint: "A chain needs ⌈n/3⌉ cameras. Recursion depth 1000 is fine; exponential camera/no-camera branching is not.", argsGen: "() => { const a = [0]; for (let i = 1; i < 1000; i++) a.push(0, null); return [a]; }", expected: 334, timeLimitMs: 1000 },
    { scenario: "Large random tree (n ≤ 1000)", hint: "Trying every camera subset is exponential. One post-order pass returning a state per node is O(n).", argsGen: "() => { let s = 7, cnt = 1; const a = [0]; while (cnt < 1000) { s = (s * 16807) % 2147483647; if (s % 3 === 0) a.push(null); else { a.push(0); cnt++; } } return [a]; }", expected: 339, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minCameraCover(root) {
  const NOT_COVERED = 0, COVERED = 1, CAMERA = 2;
  let cameras = 0;

  function dfs(node) {
    if (!node) return COVERED;                     // null needs nothing
    const left = dfs(node.left);
    const right = dfs(node.right);
    if (left === NOT_COVERED || right === NOT_COVERED) {
      cameras++;                                   // a child depends on me
      return CAMERA;
    }
    if (left === CAMERA || right === CAMERA) return COVERED;
    return NOT_COVERED;                            // let my parent cover me
  }

  if (dfs(root) === NOT_COVERED) cameras++;        // nobody above the root
  return cameras;
}`,
  },
  dryRun: {
    columns: ['node (example 1)', 'children states', 'returns', 'cameras'],
    rows: [['leaf 3', 'null, null → 1, 1', '0 (not covered)', '0'], ['leaf 4', '1, 1', '0', '0'], ['node 1', '0, 0', '2 (camera)', '1'], ['root', '2, null(1)', '1 (covered)', '1']],
  },
  complexity: { time: 'O(n)', space: 'O(h)', explanation: 'One post-order pass; recursion depth = tree height.' },
  alternative: {
    title: 'Full 3-cost DP',
    md: 'For each node return [a, b, c]: a = min cameras if this node HAS a camera; b = min if it has none but is covered by a child; c = min if it has none and is not yet covered (parent must cover). Combine children with minima. Answer min(a, b) at the root.',
    code: `function minCameraCover(root) {
  function dfs(node) {
    if (!node) return [Infinity, 0, 0];
    const [la, lb, lc] = dfs(node.left);
    const [ra, rb, rc] = dfs(node.right);
    const a = 1 + Math.min(la, lb, lc) + Math.min(ra, rb, rc);          // camera here
    const b = Math.min(la + Math.min(ra, rb), ra + Math.min(la, lb));   // a child has a camera
    const c = lb + rb;                                                  // children covered, me not
    return [a, b, c];
  }
  const [a, b] = dfs(root);
  return Math.min(a, b);
}`,
    complexity: 'O(n) time, O(h) space',
  },
  mistakes: [
    'Treating null children as "not covered" — forces cameras on every leaf.',
    'Forgetting the final root check.',
    'Putting cameras on leaves greedily.',
  ],
};
