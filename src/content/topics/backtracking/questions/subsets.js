export default {
  id: 'subsets',
  title: 'Subsets',
  difficulty: 'Medium',
  order: 1,
  pattern: 'backtracking-subsets',
  tags: ['backtracking', 'array', 'subsets'],
  source: { platform: 'LeetCode', number: 78, url: 'https://leetcode.com/problems/subsets/' },

  statement: `Given an array \`nums\` of **distinct** integers, return **all possible subsets** (the power set).

The result must not contain the same subset twice. You may return the subsets, and the elements inside each subset, in any order.`,
  examples: [
    { input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' },
    { input: 'nums = [0]', output: '[[],[0]]' },
  ],
  constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10', 'All values are distinct'],

  think: `- For each element there are exactly two options. How many subsets does that give?
- Where in the recursion is "a subset" complete — only at the leaves, or at every node?
- How do you avoid producing both [1,2] and [2,1]?`,
  patternChallenge: {
    options: ['Backtracking — Permutations', 'Dynamic Programming', 'Backtracking — Subsets (include / exclude)', 'Greedy'],
    answer: 2,
    explanation: '"All possible subsets" is the definition of the include/exclude tree. Permutations would treat [1,2] and [2,1] as different; DP and greedy compute one value, not a list of all subsets.',
  },
  hints: [
    'Keep one `path` array. At every call, record a copy of `path` — every node of the tree is a subset.',
    'Loop `i` from `start` to the end: push `nums[i]`, recurse with `i + 1`, pop. The start index prevents reorderings.',
  ],
  approach: `**Iterative idea (cascading):** start with \`[[]]\`; for each number, add a copy of every existing subset with that number appended. Easy, but it does not generalise to constraints.

**Backtracking:** \`dfs(start)\` first records \`[...path]\`, then for each \`i ≥ start\` chooses \`nums[i]\`, explores \`dfs(i + 1)\`, and undoes with \`pop()\`. Because indices along a path strictly increase, every subset appears exactly once.`,

  functionName: 'subsets',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function subsets(nums) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'All 8 subsets including [] and the full set.', args: [[1,2,3]], expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]] },
    { scenario: 'Example 2', hint: 'Smallest input: [] and [0].', args: [[0]], expected: [[],[0]] },
    { scenario: 'Single negative', hint: 'One element at the minimum value.', args: [[-10]], expected: [[],[-10]] },
    { scenario: 'Two elements', hint: 'Four subsets. If you push the live path, every entry ends up empty.', args: [[5,-3]], expected: [[],[5],[-3],[5,-3]] },
    { scenario: 'Includes zero', hint: 'Zero is an ordinary element, not "missing".', args: [[4,1,0]], expected: [[],[4],[1],[4,1],[0],[4,0],[1,0],[4,1,0]] },
    { scenario: 'Extreme values', hint: 'Both ends of the range together.', args: [[-10,10]], expected: [[],[-10],[10],[-10,10]] },
    { scenario: 'Four elements', hint: '16 subsets. Forgetting path.pop() leaves leftovers in later subsets.', args: [[-1,10,3,7]], expected: [[],[-1],[10],[-1,10],[3],[-1,3],[10,3],[-1,10,3],[7],[-1,7],[10,7],[-1,10,7],[3,7],[-1,3,7],[10,3,7],[-1,10,3,7]] },
    { scenario: 'Record every node', hint: 'Smaller subsets count too — recording only at the leaves of the loop version misses them.', args: [[9,8]], expected: [[],[9],[8],[9,8]] },
    { scenario: 'Five elements', hint: '32 subsets. Recursing with start + 1 instead of i + 1 creates duplicates.', args: [[1,2,3,4,5]], expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3],[4],[1,4],[2,4],[1,2,4],[3,4],[1,3,4],[2,3,4],[1,2,3,4],[5],[1,5],[2,5],[1,2,5],[3,5],[1,3,5],[2,3,5],[1,2,3,5],[4,5],[1,4,5],[2,4,5],[1,2,4,5],[3,4,5],[1,3,4,5],[2,3,4,5],[1,2,3,4,5]] },
    { scenario: 'Eight elements', hint: '2^8 = 256 subsets, each exactly once.', args: [[-4,-3,-2,-1,1,2,3,4]], expected: [[],[-4],[-3],[-4,-3],[-2],[-4,-2],[-3,-2],[-4,-3,-2],[-1],[-4,-1],[-3,-1],[-4,-3,-1],[-2,-1],[-4,-2,-1],[-3,-2,-1],[-4,-3,-2,-1],[1],[-4,1],[-3,1],[-4,-3,1],[-2,1],[-4,-2,1],[-3,-2,1],[-4,-3,-2,1],[-1,1],[-4,-1,1],[-3,-1,1],[-4,-3,-1,1],[-2,-1,1],[-4,-2,-1,1],[-3,-2,-1,1],[-4,-3,-2,-1,1],[2],[-4,2],[-3,2],[-4,-3,2],[-2,2],[-4,-2,2],[-3,-2,2],[-4,-3,-2,2],[-1,2],[-4,-1,2],[-3,-1,2],[-4,-3,-1,2],[-2,-1,2],[-4,-2,-1,2],[-3,-2,-1,2],[-4,-3,-2,-1,2],[1,2],[-4,1,2],[-3,1,2],[-4,-3,1,2],[-2,1,2],[-4,-2,1,2],[-3,-2,1,2],[-4,-3,-2,1,2],[-1,1,2],[-4,-1,1,2],[-3,-1,1,2],[-4,-3,-1,1,2],[-2,-1,1,2],[-4,-2,-1,1,2],[-3,-2,-1,1,2],[-4,-3,-2,-1,1,2],[3],[-4,3],[-3,3],[-4,-3,3],[-2,3],[-4,-2,3],[-3,-2,3],[-4,-3,-2,3],[-1,3],[-4,-1,3],[-3,-1,3],[-4,-3,-1,3],[-2,-1,3],[-4,-2,-1,3],[-3,-2,-1,3],[-4,-3,-2,-1,3],[1,3],[-4,1,3],[-3,1,3],[-4,-3,1,3],[-2,1,3],[-4,-2,1,3],[-3,-2,1,3],[-4,-3,-2,1,3],[-1,1,3],[-4,-1,1,3],[-3,-1,1,3],[-4,-3,-1,1,3],[-2,-1,1,3],[-4,-2,-1,1,3],[-3,-2,-1,1,3],[-4,-3,-2,-1,1,3],[2,3],[-4,2,3],[-3,2,3],[-4,-3,2,3],[-2,2,3],[-4,-2,2,3],[-3,-2,2,3],[-4,-3,-2,2,3],[-1,2,3],[-4,-1,2,3],[-3,-1,2,3],[-4,-3,-1,2,3],[-2,-1,2,3],[-4,-2,-1,2,3],[-3,-2,-1,2,3],[-4,-3,-2,-1,2,3],[1,2,3],[-4,1,2,3],[-3,1,2,3],[-4,-3,1,2,3],[-2,1,2,3],[-4,-2,1,2,3],[-3,-2,1,2,3],[-4,-3,-2,1,2,3],[-1,1,2,3],[-4,-1,1,2,3],[-3,-1,1,2,3],[-4,-3,-1,1,2,3],[-2,-1,1,2,3],[-4,-2,-1,1,2,3],[-3,-2,-1,1,2,3],[-4,-3,-2,-1,1,2,3],[4],[-4,4],[-3,4],[-4,-3,4],[-2,4],[-4,-2,4],[-3,-2,4],[-4,-3,-2,4],[-1,4],[-4,-1,4],[-3,-1,4],[-4,-3,-1,4],[-2,-1,4],[-4,-2,-1,4],[-3,-2,-1,4],[-4,-3,-2,-1,4],[1,4],[-4,1,4],[-3,1,4],[-4,-3,1,4],[-2,1,4],[-4,-2,1,4],[-3,-2,1,4],[-4,-3,-2,1,4],[-1,1,4],[-4,-1,1,4],[-3,-1,1,4],[-4,-3,-1,1,4],[-2,-1,1,4],[-4,-2,-1,1,4],[-3,-2,-1,1,4],[-4,-3,-2,-1,1,4],[2,4],[-4,2,4],[-3,2,4],[-4,-3,2,4],[-2,2,4],[-4,-2,2,4],[-3,-2,2,4],[-4,-3,-2,2,4],[-1,2,4],[-4,-1,2,4],[-3,-1,2,4],[-4,-3,-1,2,4],[-2,-1,2,4],[-4,-2,-1,2,4],[-3,-2,-1,2,4],[-4,-3,-2,-1,2,4],[1,2,4],[-4,1,2,4],[-3,1,2,4],[-4,-3,1,2,4],[-2,1,2,4],[-4,-2,1,2,4],[-3,-2,1,2,4],[-4,-3,-2,1,2,4],[-1,1,2,4],[-4,-1,1,2,4],[-3,-1,1,2,4],[-4,-3,-1,1,2,4],[-2,-1,1,2,4],[-4,-2,-1,1,2,4],[-3,-2,-1,1,2,4],[-4,-3,-2,-1,1,2,4],[3,4],[-4,3,4],[-3,3,4],[-4,-3,3,4],[-2,3,4],[-4,-2,3,4],[-3,-2,3,4],[-4,-3,-2,3,4],[-1,3,4],[-4,-1,3,4],[-3,-1,3,4],[-4,-3,-1,3,4],[-2,-1,3,4],[-4,-2,-1,3,4],[-3,-2,-1,3,4],[-4,-3,-2,-1,3,4],[1,3,4],[-4,1,3,4],[-3,1,3,4],[-4,-3,1,3,4],[-2,1,3,4],[-4,-2,1,3,4],[-3,-2,1,3,4],[-4,-3,-2,1,3,4],[-1,1,3,4],[-4,-1,1,3,4],[-3,-1,1,3,4],[-4,-3,-1,1,3,4],[-2,-1,1,3,4],[-4,-2,-1,1,3,4],[-3,-2,-1,1,3,4],[-4,-3,-2,-1,1,3,4],[2,3,4],[-4,2,3,4],[-3,2,3,4],[-4,-3,2,3,4],[-2,2,3,4],[-4,-2,2,3,4],[-3,-2,2,3,4],[-4,-3,-2,2,3,4],[-1,2,3,4],[-4,-1,2,3,4],[-3,-1,2,3,4],[-4,-3,-1,2,3,4],[-2,-1,2,3,4],[-4,-2,-1,2,3,4],[-3,-2,-1,2,3,4],[-4,-3,-2,-1,2,3,4],[1,2,3,4],[-4,1,2,3,4],[-3,1,2,3,4],[-4,-3,1,2,3,4],[-2,1,2,3,4],[-4,-2,1,2,3,4],[-3,-2,1,2,3,4],[-4,-3,-2,1,2,3,4],[-1,1,2,3,4],[-4,-1,1,2,3,4],[-3,-1,1,2,3,4],[-4,-3,-1,1,2,3,4],[-2,-1,1,2,3,4],[-4,-2,-1,1,2,3,4],[-3,-2,-1,1,2,3,4],[-4,-3,-2,-1,1,2,3,4]] },
  ],

  solution: {
    code: `function subsets(nums) {
  const result = [];
  const path = [];

  function backtrack(start) {
    result.push([...path]);                 // every node is a subset — store a COPY
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                   // choose
      backtrack(i + 1);                     // explore only later elements
      path.pop();                           // undo
    }
  }

  backtrack(0);
  return result;
}`,
  },
  dryRun: {
    columns: ['call', 'path when recorded', 'next choices'],
    rows: [
      ['bt(0)', '[]', '1, 2, 3'],
      ['bt(1)', '[1]', '2, 3'],
      ['bt(2)', '[1,2]', '3'],
      ['bt(3)', '[1,2,3]', 'none → return, pop'],
      ['bt(3)', '[1,3]', 'none'],
      ['bt(2)', '[2]', '3'],
      ['bt(3)', '[2,3]', 'none'],
      ['bt(3)', '[3]', 'none'],
    ],
  },
  complexity: { time: 'O(n · 2ⁿ)', space: 'O(n) extra (plus output)', explanation: '2ⁿ subsets, each copied in O(n). Recursion depth and path length are at most n.' },
  alternative: {
    title: 'Bitmask enumeration',
    md: 'Each subset corresponds to a number `mask` from 0 to 2ⁿ − 1: bit `j` set ⇔ `nums[j]` is in the subset.',
    code: `function subsets(nums) {
  const n = nums.length, out = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const s = [];
    for (let j = 0; j < n; j++) if (mask & (1 << j)) s.push(nums[j]);
    out.push(s);
  }
  return out;
}`,
    complexity: 'O(n · 2ⁿ) time, O(1) extra space',
  },
  mistakes: [
    '`result.push(path)` — stores the live array; every entry ends up empty.',
    'Forgetting `path.pop()` — subsets start accumulating leftovers.',
    'Recursing with `start + 1` instead of `i + 1`.',
    'Only recording at the leaves in the loop version (misses all smaller subsets).',
  ],
};
