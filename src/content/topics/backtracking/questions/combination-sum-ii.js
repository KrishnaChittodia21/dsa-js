export default {
  id: 'combination-sum-ii',
  title: 'Combination Sum II',
  difficulty: 'Medium',
  order: 6,
  pattern: 'backtracking-combinations',
  tags: ['backtracking', 'array', 'sorting', 'duplicates'],
  source: { platform: 'LeetCode', number: 40, url: 'https://leetcode.com/problems/combination-sum-ii/' },

  statement: `Given an array \`candidates\` (which **may contain duplicate values**) and a \`target\`, return all **unique** combinations whose sum is \`target\`.

**Each element may be used at most once** (by index). The result must not contain two equal combinations. Return them in any order.`,
  examples: [
    { input: 'candidates = [10,1,2,7,6,1,5], target = 8', output: '[[1,1,6],[1,2,5],[1,7],[2,6]]' },
    { input: 'candidates = [2,5,2,1,2], target = 5', output: '[[1,2,2],[5]]' },
  ],
  constraints: ['1 <= candidates.length <= 100', '1 <= candidates[i] <= 50', '1 <= target <= 30'],

  think: `- Compared with Combination Sum I, which two rules changed? Which line of code does each rule change?
- With sorted [1,1,2,5,6,7,10], why would choosing "the first 1" or "the second 1" as the first element lead to duplicate answers?
- But [1,1,6] is valid — so when *is* it OK to take the second 1?`,
  patternChallenge: {
    options: ['Backtracking — Combinations with sort + skip duplicates (recurse with i + 1)', 'Backtracking — Permutations with used[]', 'Greedy', 'Hash Map (complement lookup)'],
    answer: 0,
    explanation: 'Still combinations (order irrelevant) — but each index at most once (`i + 1`) and duplicate values in the input (sort + `i > start` skip). Complement lookup finds pairs, not groups of any size.',
  },
  hints: [
    'Sort. Recurse with `i + 1` because each element can be used once.',
    'Skip `i` if `i > start && candidates[i] === candidates[i - 1]` — a duplicate sibling. Also `break` when `candidates[i] > remaining`.',
  ],
  approach: `**Brute force:** enumerate all 2ⁿ subsets and keep unique ones with the right sum. n = 100 makes that impossible.

**Backtracking:**
1. Sort ascending.
2. \`dfs(start, remaining)\`: record when \`remaining === 0\`.
3. For \`i ≥ start\`: skip duplicate siblings (\`i > start && c[i] === c[i-1]\`), \`break\` when \`c[i] > remaining\`, otherwise choose, recurse with \`(i + 1, remaining − c[i])\`, undo.

Because target ≤ 30 and candidates ≥ 1, the path is short and the \`break\` prunes aggressively, so n = 100 is fine.`,

  functionName: 'combinationSum2',
  paramNames: ['candidates', 'target'],
  starterCode: `/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
function combinationSum2(candidates, target) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Two 1s exist, so [1,1,6] is valid, but [1,7] must appear only once even though either 1 could be used.', args: [[10,1,2,7,6,1,5],8], expected: [[2,6],[1,7],[1,2,5],[1,1,6]] },
    { scenario: 'Example 2', hint: 'Three 2s: [1,2,2] must appear exactly once. Skip a duplicate value at the same depth.', args: [[2,5,2,1,2],5], expected: [[5],[1,2,2]] },
    { scenario: 'All duplicates', hint: 'Four identical 1s give one answer [1,1]. Without skipping equal siblings you output it six times.', args: [[1,1,1,1],2], expected: [[1,1]] },
    { scenario: 'Single candidate, no answer', hint: 'The only candidate is bigger than the target — return [].', args: [[3],2], expected: [] },
    { scenario: 'Single candidate equals target', hint: 'The smallest valid input: one candidate that is exactly the target.', args: [[30],30], expected: [[30]] },
    { scenario: 'Element cannot be reused', hint: '[2,2] is not allowed with only one 2. Recursing with i instead of i + 1 reuses the same element.', args: [[2],4], expected: [] },
    { scenario: 'Duplicate inside one combination', hint: 'Skipping duplicates with `i > 0` instead of `i > start` loses combinations that use both copies like [1,1,…].', args: [[1,1,2],4], expected: [[1,1,2]] },
    { scenario: 'Unsorted input', hint: 'Equal values are only adjacent after sorting — forgetting to sort lets duplicates slip through.', args: [[4,1,3,1,2,4],5], expected: [[2,3],[1,4],[1,1,3]] },
    { scenario: 'No combination reaches target', hint: 'Every candidate overshoots — return an empty list, not [[]].', args: [[7,8,9],5], expected: [] },
    { scenario: 'Use every element', hint: 'The only answer uses all elements. Make sure you record a combination when the remaining sum hits 0 at the very end.', args: [[1,2,3,4,5],15], expected: [[1,2,3,4,5]] },
    { scenario: 'Many duplicates', hint: 'Several repeated values: answers like [1,1,4] and [2,2,2] must each appear once.', args: [[4,4,2,1,4,2,2,1,3],6], expected: [[2,4],[2,2,2],[1,2,3],[1,1,4],[1,1,2,2]] },
    { scenario: 'Max length, many repeats (n = 100)', hint: '100 candidates but only two distinct values. Without sorting + skipping duplicates (or with a Set to de-dupe afterwards) the search explodes.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => [2, 3][i % 2]), 30]', expected: [[3,3,3,3,3,3,3,3,3,3],[2,2,2,3,3,3,3,3,3,3,3],[2,2,2,2,2,2,3,3,3,3,3,3],[2,2,2,2,2,2,2,2,2,3,3,3,3],[2,2,2,2,2,2,2,2,2,2,2,2,3,3],[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]], timeLimitMs: 1000 },
    { scenario: '100 identical ones', hint: 'Only one answer: thirty 1s. Exploring every way to pick 30 of 100 equal ones never finishes — skip equal siblings.', argsGen: '() => [Array(100).fill(1), 30]', expected: [[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const result = [];
  const path = [];

  function backtrack(start, remaining) {
    if (remaining === 0) {
      result.push([...path]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      if (i > start && candidates[i] === candidates[i - 1]) continue; // duplicate sibling
      if (candidates[i] > remaining) break;                            // sorted → stop
      path.push(candidates[i]);
      backtrack(i + 1, remaining - candidates[i]);                     // each index once
      path.pop();
    }
  }

  backtrack(0, target);
  return result;
}`,
  },
  dryRun: {
    columns: ['sorted', 'path', 'remaining', 'action'],
    rows: [
      ['[1,1,2,5,6,7,10]', '[]', '8', 'take c[0]=1'],
      ['', '[1]', '7', 'take c[1]=1 (i === start, allowed)'],
      ['', '[1,1]', '6', '2 → rem 4 → 5 > 4 break… ; 6 → record [1,1,6]'],
      ['', '[1]', '7', '2 → [1,2] rem 5 → 5 → record [1,2,5]; … 7 → record [1,7]'],
      ['', '[]', '8', 'i=1 is 1 again and i > start → skip'],
      ['', '[]', '8', '2 → [2,6] recorded; 5 → rem 3 break; …'],
    ],
  },
  complexity: { time: 'O(2ⁿ) worst case (heavily pruned)', space: 'O(n)', explanation: 'In the worst case every subset is explored; sorting + break + the small target keep the practical search tiny.' },
  alternative: {
    title: 'Group by value',
    md: 'Count each distinct value; at each distinct value choose 0..count copies (bounded by remaining). No duplicate check needed because each value is decided once.',
    complexity: 'Same worst case, fewer duplicate checks',
  },
  mistakes: [
    'Recursing with `i` (reuses the same element).',
    'Skipping with `i > 0` — loses [1,1,6].',
    'Placing the duplicate check after the push.',
    'Forgetting to sort.',
  ],
};
