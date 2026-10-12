export default {
  id: 'subsets-ii',
  title: 'Subsets II',
  difficulty: 'Medium',
  order: 2,
  pattern: 'backtracking-subsets',
  tags: ['backtracking', 'array', 'sorting', 'duplicates'],
  source: { platform: 'LeetCode', number: 90, url: 'https://leetcode.com/problems/subsets-ii/' },

  statement: `Given an integer array \`nums\` that **may contain duplicates**, return all possible subsets.

The answer must not contain two equal subsets (two subsets are equal if they contain the same values with the same multiplicities). Return them in any order.`,
  examples: [
    { input: 'nums = [1,2,2]', output: '[[],[1],[1,2],[1,2,2],[2],[2,2]]', explanation: '[1,2] appears once even though there are two different 2s to pick from.' },
    { input: 'nums = [0]', output: '[[],[0]]' },
  ],
  constraints: ['1 <= nums.length <= 10', '-10 <= nums[i] <= 10'],

  think: `- Run the plain Subsets algorithm on [1,2,2]. Which subset shows up twice, and at which point of the tree is the second copy created?
- If equal values sat next to each other, what simple comparison would detect "I already tried this value here"?
- Must we forbid picking the second 2 altogether, or only in a particular situation?`,
  patternChallenge: {
    options: ['Hash Set of stringified subsets', 'Backtracking — Subsets with sort + skip duplicates', 'Sliding Window', 'Backtracking — Permutations with used[]'],
    answer: 1,
    explanation: 'It is still the subsets tree; the only new issue is duplicate values. Sorting groups them and `i > start && nums[i] === nums[i-1]` skips repeated siblings. A Set of strings also works but generates the duplicates first and then throws them away.',
  },
  hints: [
    'Sort `nums` first so equal values are adjacent.',
    'In the loop `for (i = start; …)`, skip `i` when `i > start && nums[i] === nums[i - 1]`: that value was already tried as an alternative at this same depth.',
  ],
  approach: `**Brute force:** generate all 2ⁿ subsets of the sorted array and de-duplicate with a Set of \`subset.join(',')\` keys. Correct but wasteful.

**Sort + skip:** the duplicate subsets come from **siblings** — at the same depth, choosing the first 2 or the second 2 leads to identical subtrees. After sorting, a sibling equal to its left neighbour is skipped. The first element of each level (\`i === start\`) is never skipped, which is what still allows \`[2,2]\` and \`[1,2,2]\`.`,

  functionName: 'subsetsWithDup',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function subsetsWithDup(nums) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: '[1,2] must appear once even though there are two different 2s.', args: [[1,2,2]], expected: [[],[1],[2],[1,2],[2,2],[1,2,2]] },
    { scenario: 'Example 2', hint: 'Smallest input: the empty subset and the element itself.', args: [[0]], expected: [[],[0]] },
    { scenario: 'All duplicates', hint: 'Three equal values give only 4 subsets: [], [2], [2,2], [2,2,2].', args: [[2,2,2]], expected: [[],[2],[2,2],[2,2,2]] },
    { scenario: 'Single negative', hint: 'One element at the minimum value.', args: [[-10]], expected: [[],[-10]] },
    { scenario: 'No duplicates present', hint: 'With distinct values this is plain subsets — your skip rule must not drop anything.', args: [[1,2,3]], expected: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]] },
    { scenario: 'Duplicates not adjacent', hint: 'Forgetting to sort leaves equal values apart, so duplicate subsets slip through.', args: [[4,4,1,4]], expected: [[],[4],[4,4],[1],[1,4],[1,4,4],[4,4,4],[1,4,4,4]] },
    { scenario: 'Two duplicated pairs', hint: 'Skipping with i > 0 instead of i > start loses [1,1] and [3,3].', args: [[3,1,3,1]], expected: [[],[3],[1],[1,3],[3,3],[1,3,3],[1,1],[1,1,3],[1,1,3,3]] },
    { scenario: 'Negative duplicates', hint: 'Sort numerically — the default sort compares as strings.', args: [[-1,0,-1]], expected: [[],[-1],[0],[-1,0],[-1,-1],[-1,-1,0]] },
    { scenario: 'Negatives and tens', hint: 'Mixed signs and two-digit values; equal values must still end up adjacent.', args: [[10,-10,10,-10,0]], expected: [[],[10],[-10],[-10,10],[10,10],[-10,10,10],[-10,-10],[-10,-10,10],[-10,-10,10,10],[0],[0,10],[-10,0],[-10,0,10],[0,10,10],[-10,0,10,10],[-10,-10,0],[-10,-10,0,10],[-10,-10,0,10,10]] },
    { scenario: 'Max length, two values', hint: 'Five 1s and five 2s: only 6 × 6 = 36 distinct subsets.', args: [[2,1,2,1,2,1,2,1,2,1]], expected: [[],[2],[1],[1,2],[2,2],[1,2,2],[1,1],[1,1,2],[1,1,2,2],[2,2,2],[1,2,2,2],[1,1,2,2,2],[1,1,1],[1,1,1,2],[1,1,1,2,2],[1,1,1,2,2,2],[2,2,2,2],[1,2,2,2,2],[1,1,2,2,2,2],[1,1,1,2,2,2,2],[1,1,1,1],[1,1,1,1,2],[1,1,1,1,2,2],[1,1,1,1,2,2,2],[1,1,1,1,2,2,2,2],[2,2,2,2,2],[1,2,2,2,2,2],[1,1,2,2,2,2,2],[1,1,1,2,2,2,2,2],[1,1,1,1,2,2,2,2,2],[1,1,1,1,1],[1,1,1,1,1,2],[1,1,1,1,1,2,2],[1,1,1,1,1,2,2,2],[1,1,1,1,1,2,2,2,2],[1,1,1,1,1,2,2,2,2,2]] },
    { scenario: 'Max length, all equal', hint: 'Ten identical values give just 11 subsets.', args: [[7,7,7,7,7,7,7,7,7,7]], expected: [[],[7],[7,7],[7,7,7],[7,7,7,7],[7,7,7,7,7],[7,7,7,7,7,7],[7,7,7,7,7,7,7],[7,7,7,7,7,7,7,7],[7,7,7,7,7,7,7,7,7],[7,7,7,7,7,7,7,7,7,7]] },
  ],

  solution: {
    code: `function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);            // group duplicates (numeric sort!)
  const result = [];
  const path = [];

  function backtrack(start) {
    result.push([...path]);
    for (let i = start; i < nums.length; i++) {
      // same value already tried as a sibling at this depth → identical subtree
      if (i > start && nums[i] === nums[i - 1]) continue;
      path.push(nums[i]);
      backtrack(i + 1);
      path.pop();
    }
  }

  backtrack(0);
  return result;
}`,
  },
  dryRun: {
    columns: ['call', 'path recorded', 'loop i', 'decision'],
    rows: [
      ['bt(0)', '[]', '0 (1)', 'take'],
      ['bt(1)', '[1]', '1 (2)', 'take (i === start)'],
      ['bt(2)', '[1,2]', '2 (2)', 'take (i === start) → [1,2,2]'],
      ['bt(1)', '[1]', '2 (2)', 'skip: i > start and equals nums[1]'],
      ['bt(0)', '[]', '1 (2)', 'take → [2], then [2,2]'],
      ['bt(0)', '[]', '2 (2)', 'skip: equals nums[1]'],
    ],
  },
  complexity: { time: 'O(n · 2ⁿ)', space: 'O(n) extra (plus output)', explanation: 'Sorting is O(n log n); in the worst case (all distinct) there are 2ⁿ subsets copied in O(n) each.' },
  alternative: {
    title: 'Count-based choice',
    md: 'Count each distinct value, then for each distinct value choose how many copies to include (0..count). That is a subsets tree over distinct values with a multi-way choice per level.',
    complexity: 'O(n · #unique subsets) time',
  },
  mistakes: [
    'Skipping with `i > 0` instead of `i > start` — loses [2,2] and [1,2,2].',
    'Forgetting to sort (duplicates are then not adjacent).',
    'Using `nums.sort()` without a comparator — negative numbers sort as strings.',
    'De-duplicating with a Set of strings after generating everything (works, but misses the point).',
  ],
};
