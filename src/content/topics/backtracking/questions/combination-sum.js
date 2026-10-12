export default {
  id: 'combination-sum',
  title: 'Combination Sum',
  difficulty: 'Medium',
  order: 5,
  pattern: 'backtracking-combinations',
  tags: ['backtracking', 'array', 'pruning'],
  source: { platform: 'LeetCode', number: 39, url: 'https://leetcode.com/problems/combination-sum/' },

  statement: `You are given an array of **distinct** positive integers \`candidates\` and a positive integer \`target\`.

Return every **unique combination** of candidates whose sum is exactly \`target\`. **Each candidate may be used any number of times.** Two combinations are the same if they use every number the same number of times (order does not matter). Return them in any order.`,
  examples: [
    { input: 'candidates = [2,3,6,7], target = 7', output: '[[2,2,3],[7]]' },
    { input: 'candidates = [2,3,5], target = 8', output: '[[2,2,2,2],[2,3,3],[3,5]]' },
    { input: 'candidates = [2], target = 1', output: '[]' },
  ],
  constraints: ['1 <= candidates.length <= 30', '2 <= candidates[i] <= 40', 'All candidates are distinct', '1 <= target <= 40'],

  think: `- If you may reuse a number, what start index should the recursive call receive after picking candidates[i]?
- How do you stop [2,3,2] from appearing next to [2,2,3]?
- If candidates were sorted, what can you conclude when candidates[i] > remaining?`,
  patternChallenge: {
    options: ['Backtracking — Combinations (reuse allowed, recurse with i)', 'Sliding Window — Variable Size', 'Backtracking — Permutations', 'Two Pointers'],
    answer: 0,
    explanation: 'We must *list* all groups (not count them) and order does not matter → combinations. Reuse means recursing with `i` instead of `i + 1`. Sliding windows and two pointers find contiguous ranges or pairs, not arbitrary multisets.',
  },
  hints: [
    '`dfs(start, remaining)`: for `i ≥ start`, push `candidates[i]` and recurse with `(i, remaining − candidates[i])` — `i`, not `i + 1`, because reuse is allowed.',
    'Sort candidates first. Then as soon as `candidates[i] > remaining` you can `break` — every later candidate is even larger.',
  ],
  approach: `**Brute force:** try sequences in every order and de-duplicate sorted results — many orderings of the same multiset are explored.

**Backtracking:**
1. Sort candidates ascending.
2. \`dfs(start, remaining)\`: if \`remaining === 0\` record the path.
3. For \`i\` from \`start\`: if \`candidates[i] > remaining\` → \`break\`. Otherwise choose it, recurse with \`(i, remaining − candidates[i])\`, undo.

Never going back below \`i\` keeps each combination in non-decreasing order — one path per multiset.`,

  functionName: 'combinationSum',
  paramNames: ['candidates', 'target'],
  starterCode: `/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
function combinationSum(candidates, target) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: '2 may be reused: [2,2,3]. [3,2,2] is the same combination and must not appear again.', args: [[2,3,6,7],7], expected: [[7],[2,2,3]] },
    { scenario: 'Example 2', hint: 'Several answers reuse elements different numbers of times.', args: [[2,3,5],8], expected: [[3,5],[2,3,3],[2,2,2,2]] },
    { scenario: 'Example 3', hint: 'The target is smaller than every candidate — return [].', args: [[2],1], expected: [] },
    { scenario: 'Single candidate reused', hint: 'Recursing with i + 1 forbids reuse and misses [2,2,2,2].', args: [[2],8], expected: [[2,2,2,2]] },
    { scenario: 'Candidate equals target', hint: 'A one-element combination counts — record it when the remaining sum is exactly 0.', args: [[40],40], expected: [[40]] },
    { scenario: 'Target smaller than all', hint: 'Nothing fits — your pruning must not record an empty combination.', args: [[5,10],3], expected: [] },
    { scenario: 'Unsorted candidates', hint: 'If you `break` once a candidate is too big, sort first — otherwise smaller candidates later in the array are skipped.', args: [[8,7,4,3],11], expected: [[4,7],[3,8],[3,4,4]] },
    { scenario: 'No reorderings allowed', hint: 'Recursing from index 0 produces [2,3,7] and [3,2,7] etc. Restart from the current index.', args: [[7,3,2],18], expected: [[3,3,3,3,3,3],[2,3,3,3,7],[2,2,7,7],[2,2,2,3,3,3,3],[2,2,2,2,3,7],[2,2,2,2,2,2,3,3],[2,2,2,2,2,2,2,2,2]] },
    { scenario: 'Odd target, even candidates', hint: 'No combination of even numbers makes an odd sum — return [].', args: [[2,4,6],7], expected: [] },
    { scenario: 'Max target with small coins', hint: 'Target 40 with small candidates gives many deep combinations — push a copy of the path, not the live array.', args: [[3,5,7],40], expected: [[5,7,7,7,7,7],[5,5,5,5,5,5,5,5],[3,5,5,5,5,5,5,7],[3,3,5,5,5,5,7,7],[3,3,3,5,5,7,7,7],[3,3,3,3,7,7,7,7],[3,3,3,3,3,5,5,5,5,5],[3,3,3,3,3,3,5,5,5,7],[3,3,3,3,3,3,3,5,7,7],[3,3,3,3,3,3,3,3,3,3,5,5],[3,3,3,3,3,3,3,3,3,3,3,7]] },
    { scenario: 'Max candidates (30)', hint: '30 distinct candidates, target 40. Prune as soon as the remaining sum would go negative.', argsGen: '() => [Array.from({ length: 30 }, (_, i) => i + 11), 40]', expected: [[40],[20,20],[19,21],[18,22],[17,23],[16,24],[15,25],[14,26],[13,27],[13,13,14],[12,28],[12,14,14],[12,13,15],[12,12,16],[11,29],[11,14,15],[11,13,16],[11,12,17],[11,11,18]] },
  ],

  solution: {
    code: `function combinationSum(candidates, target) {
  candidates.sort((a, b) => a - b);          // enables the early break
  const result = [];
  const path = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > remaining) break;  // sorted → nothing later fits either
      path.push(candidates[i]);
      backtrack(i, remaining - candidates[i]); // i: the same number may be reused
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}`,
  },
  dryRun: {
    columns: ['path', 'remaining', 'action'],
    rows: [
      ['[]', '7', 'try 2'],
      ['[2]', '5', 'try 2'],
      ['[2,2]', '3', 'try 2 → [2,2,2] rem 1: 2 > 1 break'],
      ['[2,2]', '3', 'try 3 → rem 0 → record [2,2,3]'],
      ['[2,2]', '3', '6 > 3 break'],
      ['[2]', '5', 'try 3 → [2,3] rem 2: 3 > 2 break; 6 > 5 break'],
      ['[]', '7', 'try 3 → [3,3] rem 1 break; 6 → rem 1 break'],
      ['[]', '7', 'try 7 → record [7]'],
    ],
  },
  complexity: {
    time: 'O(N^(T/m + 1)) worst case',
    space: 'O(T/m) recursion depth',
    explanation: 'N = number of candidates, T = target, m = smallest candidate. The path is at most T/m long and each level has at most N branches. Pruning makes the real count far smaller.',
  },
  alternative: {
    title: 'Include / exclude with reuse',
    md: '`dfs(i, remaining)`: either take candidates[i] again (stay at i) or move on to i + 1. Same search space, binary branching.',
    complexity: 'Same worst case',
  },
  mistakes: [
    'Recursing with `i + 1` (forbids reuse) or `0` (produces reorderings).',
    'Using `break` without sorting first.',
    'Pushing `path` instead of `[...path]`.',
    'Continuing to recurse when `remaining < 0` instead of pruning before the call.',
  ],
};
