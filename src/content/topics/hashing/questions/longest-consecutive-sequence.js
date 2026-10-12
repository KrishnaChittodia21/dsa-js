export default {
  id: 'longest-consecutive-sequence',
  title: 'Longest Consecutive Sequence',
  difficulty: 'Medium',
  order: 2,
  pattern: 'hash-set-membership',
  tags: ['array', 'hash set'],
  source: { platform: 'LeetCode', number: 128, url: 'https://leetcode.com/problems/longest-consecutive-sequence/' },

  statement: `Given an **unsorted** array of integers \`nums\`, return the length of the longest sequence of consecutive integers (x, x+1, x+2, …) whose values all appear in \`nums\`. The elements do not need to be adjacent in the array.

Your algorithm must run in **O(n)** time.`,
  examples: [
    { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'The values 1, 2, 3, 4 are all present.' },
    { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9' },
  ],
  constraints: ['0 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],

  think: `- Sorting gives O(n log n). What do you need instead to check "is x + 1 present?" in O(1)?
- If you start counting from every value, how much work is repeated?
- How can you tell that x is the START of a sequence?`,
  patternChallenge: {
    options: ['Sort + scan', 'Hash Set — Seen Before?', 'Sliding Window', 'Union-Find'],
    answer: 1,
    explanation: 'The O(n) requirement rules out sorting. A Set gives O(1) "is x + 1 present?" checks. (Union-Find also works but is heavier; you will meet it later.)',
  },
  hints: ['Put every value in a Set.', 'Only start counting at x when x − 1 is NOT in the Set; then walk x+1, x+2, … while present.'],
  approach: `**Sort:** sort, then count runs (skipping duplicates) → O(n log n).

**Optimized:** \`const set = new Set(nums)\`. For each x in the set, if \`set.has(x − 1)\` it is not a start — skip. Otherwise walk upward while \`set.has(y + 1)\`. Each value is visited by exactly one walk (from its run's start), so the total is O(n) despite the inner loop — an amortized argument.

Iterate over the **set** (not nums) so duplicates like [0, 0, …] do not repeat walks.`,

  functionName: 'longestConsecutive',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function longestConsecutive(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: 1, 2, 3, 4 are present in scrambled order.', args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
    { scenario: 'Example 2', hint: 'Duplicates (two 0s) do not lengthen the run: 0..8 is length 9.', args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
    { scenario: 'Empty array', hint: 'No elements: the answer is 0, not 1.', args: [[]], expected: 0 },
    { scenario: 'Single element', hint: 'One value is a run of length 1.', args: [[7]], expected: 1 },
    { scenario: 'All duplicates', hint: 'The same value many times is still a run of length 1.', args: [[5, 5, 5, 5]], expected: 1 },
    { scenario: 'No two consecutive', hint: 'Every value is isolated: 1.', args: [[10, 20, 30]], expected: 1 },
    { scenario: 'Negative numbers', hint: 'Runs can cross zero: -2, -1, 0, 1.', args: [[1, -1, 0, -2, 5]], expected: 4 },
    { scenario: 'Two runs, second longer', hint: 'Track the maximum across runs, not just the first one found.', args: [[1, 2, 10, 11, 12, 13, 3]], expected: 4 },
    { scenario: 'Extreme values', hint: 'Values at ±10^9 are not consecutive with each other.', args: [[-1000000000, 1000000000, 999999999]], expected: 2 },
    { scenario: 'Reverse sorted', hint: 'Order does not matter: a descending input is one long run.', args: [[6, 5, 4, 3, 2, 1]], expected: 6 },
    { scenario: 'Large, 1..n shuffled (n = 10^5)', hint: 'Walking forward from every element is O(n²) on 1..n. Start a walk only where x - 1 is missing.', argsGen: '() => { const a = Array.from({ length: 100000 }, (_, i) => i + 1); let s = 89; for (let i = a.length - 1; i > 0; i--) { s = (s * 48271) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return [a]; }', expected: 100000, timeLimitMs: 1000 },
    { scenario: 'Large, duplicated run start', hint: '50 000 copies of 1, then 2..50 001. Iterating nums instead of the Set starts the long walk from 1 fifty thousand times.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i < 50000 ? 1 : i - 49998))]', expected: 50001, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue;        // not the start of a run
    let y = x;
    while (set.has(y + 1)) y++;          // walk the run
    best = Math.max(best, y - x + 1);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['x', 'x − 1 present?', 'walk', 'length', 'best'],
    rows: [['100', 'no', '100', '1', '1'], ['4', 'yes', 'skip', '—', '1'], ['200', 'no', '200', '1', '1'], ['1', 'no', '1→2→3→4', '4', '4'], ['3', 'yes', 'skip', '—', '4'], ['2', 'yes', 'skip', '—', '4']],
  },
  complexity: { time: 'O(n) average', space: 'O(n)', explanation: 'Building the set is O(n); each value is stepped over once in total by the walks.' },
  alternative: {
    title: 'Sort and count runs',
    md: 'Easy to explain; O(n log n).',
    code: `function longestConsecutive(nums) {
  if (nums.length === 0) return 0;
  const a = [...nums].sort((x, y) => x - y);
  let best = 1, run = 1;
  for (let i = 1; i < a.length; i++) {
    if (a[i] === a[i - 1]) continue;          // duplicate
    run = a[i] === a[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: ['Starting a walk from every element (O(n²) on 1..n)', 'Iterating nums instead of the set (repeated walks for duplicates)', 'Returning 1 for an empty array'],
};
