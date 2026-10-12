export default {
  id: 'combinations',
  title: 'Combinations',
  difficulty: 'Medium',
  order: 4,
  pattern: 'backtracking-combinations',
  tags: ['backtracking', 'combinations'],
  source: { platform: 'LeetCode', number: 77, url: 'https://leetcode.com/problems/combinations/' },

  statement: `Given two integers \`n\` and \`k\`, return **all combinations of \`k\` different numbers** chosen from \`1\` to \`n\`.

A combination is unordered: \`[1,2]\` and \`[2,1]\` are the same and must appear only once. Return the combinations in any order.`,
  examples: [
    { input: 'n = 4, k = 2', output: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]', explanation: 'C(4,2) = 6 combinations.' },
    { input: 'n = 1, k = 1', output: '[[1]]' },
  ],
  constraints: ['1 <= n <= 20', '1 <= k <= n'],

  think: `- How can you make sure each group of k numbers is produced in only one order?
- When the path has 1 number and needs 2 more, is it worth trying x = n?
- What is the stopping condition?`,
  patternChallenge: {
    options: ['Backtracking — Permutations', 'Dynamic Programming', 'Backtracking — Combinations with a start index', 'Binary Search'],
    answer: 2,
    explanation: 'Choosing k items where order does not matter → combinations. The start index keeps numbers increasing along the path so each group has exactly one path. Permutations would output each group k! times.',
  },
  hints: [
    'Recurse with `dfs(start)`: try every `x` from `start` to `n`, push it, recurse with `x + 1`, pop. Record when `path.length === k`.',
    'Prune: if you still need `need = k − path.length` numbers, `x` can be at most `n − need + 1`.',
  ],
  approach: `**Brute force:** generate all subsets of 1..n (2ⁿ) and keep those of size k — for n = 20, k = 2 that visits a million subsets to output 190.

**Backtracking with a start index:** only choose numbers larger than the last one. Stop when the path has k numbers.

**Pruning:** with \`need\` numbers still missing, starting at \`x > n − need + 1\` cannot finish — cut the loop there. This turns the search into visiting (almost) only nodes that lead to answers.`,

  functionName: 'combine',
  paramNames: ['n', 'k'],
  starterCode: `/**
 * @param {number} n
 * @param {number} k
 * @return {number[][]}
 */
function combine(n, k) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'All 6 pairs from 1..4; [2,1] is the same as [1,2] and must not appear.', args: [4,2], expected: [[1,2],[1,3],[2,3],[1,4],[2,4],[3,4]] },
    { scenario: 'Example 2', hint: 'Smallest input: one number, one pick.', args: [1,1], expected: [[1]] },
    { scenario: 'k equals n', hint: 'Only one combination: every number. A pruning bound that is off by one can skip it.', args: [3,3], expected: [[1,2,3]] },
    { scenario: 'k = 1', hint: 'Each number on its own — record when the path reaches length k.', args: [4,1], expected: [[1],[2],[3],[4]] },
    { scenario: 'Two numbers, pick one', hint: 'Both [1] and [2] — make sure the loop reaches n.', args: [2,1], expected: [[1],[2]] },
    { scenario: 'Last combination included', hint: '[3,4,5] uses the largest numbers. A loop bound like `n − need` (missing +1) skips it.', args: [5,3], expected: [[1,2,3],[1,2,4],[1,3,4],[2,3,4],[1,2,5],[1,3,5],[2,3,5],[1,4,5],[2,4,5],[3,4,5]] },
    { scenario: 'No repeated numbers', hint: 'Recursing with start + 1 instead of x + 1 creates [2,2]-style duplicates.', args: [5,4], expected: [[1,2,3,4],[1,2,3,5],[1,2,4,5],[1,3,4,5],[2,3,4,5]] },
    { scenario: 'k = n − 1', hint: 'Each combination leaves out exactly one number.', args: [6,5], expected: [[1,2,3,4,5],[1,2,3,4,6],[1,2,3,5,6],[1,2,4,5,6],[1,3,4,5,6],[2,3,4,5,6]] },
    { scenario: 'Max n, k = n', hint: 'n = 20, k = 20: a single combination of all numbers.', args: [20,20], expected: [[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]] },
    { scenario: 'Max n, k = 19', hint: '20 combinations, each skipping one number — the pruning bound matters at the end of the range.', args: [20,19], expected: [[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19,20],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20],[1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20],[1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20],[1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20],[1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20],[1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,20],[1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20],[1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,19,20],[1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20],[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20],[1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],[1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],[1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],[1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]] },
    { scenario: 'Max n, k = 1', hint: '20 single-number combinations.', args: [20,1], expected: [[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20]] },
  ],

  solution: {
    code: `function combine(n, k) {
  const result = [];
  const path = [];

  function backtrack(start) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    const need = k - path.length;
    // x can go no further than n - need + 1, otherwise too few numbers remain
    for (let x = start; x <= n - need + 1; x++) {
      path.push(x);
      backtrack(x + 1);
      path.pop();
    }
  }

  backtrack(1);
  return result;
}`,
  },
  dryRun: {
    columns: ['path', 'need', 'x range', 'action'],
    rows: [
      ['[]', '2', '1..3', 'try 1'],
      ['[1]', '1', '2..4', 'record [1,2], [1,3], [1,4]'],
      ['[]', '2', '1..3', 'try 2 → [2,3], [2,4]'],
      ['[]', '2', '1..3', 'try 3 → [3,4]; x = 4 never tried (pruned)'],
    ],
  },
  complexity: { time: 'O(k · C(n, k))', space: 'O(k) extra (plus output)', explanation: 'With the pruning bound every visited node lies on a path to an answer, so the work is proportional to the number of answers times the copy cost k.' },
  alternative: {
    title: 'Include / exclude on each number',
    md: '`dfs(x)`: either take x (if the path is not full) or skip it; stop when `path.length === k` or when not enough numbers remain. Same complexity, different tree shape.',
    complexity: 'O(k · C(n, k)) time',
  },
  mistakes: [
    'Recursing with `start + 1` instead of `x + 1` → duplicates like [2,2].',
    'Looping from 1 each time → [2,1] appears as well as [1,2].',
    'Off-by-one in the pruning bound (`n − need` would skip valid combinations like [3,4] for n = 4).',
  ],
};
