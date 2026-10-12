export default {
  id: 'jump-game',
  title: 'Jump Game',
  difficulty: 'Medium',
  order: 1,
  pattern: 'greedy-reach-frontier',
  tags: ['array', 'greedy'],
  source: { platform: 'LeetCode', number: 55, url: 'https://leetcode.com/problems/jump-game/' },

  statement: `You start at index \`0\` of an array \`nums\`. From index \`i\` you may jump forward by **any** number of steps from \`1\` up to \`nums[i]\`.

Return \`true\` if you can reach the **last index**, otherwise \`false\`.`,
  examples: [
    { input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1 step to index 1, then 3 steps to the end.' },
    { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'Every path lands on index 3, whose value is 0.' },
  ],
  constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],

  think: `- If you can reach index 7, can you reach index 5? Why?
- What single number could summarise "everything I can reach so far"?
- When is it definitely impossible to continue?`,
  patternChallenge: {
    options: ['Backtracking', 'Greedy — Reach / Frontier Invariant', 'Binary Search', 'Sliding Window — Variable Size'],
    answer: 1,
    explanation: 'Reachable indices always form a prefix [0, reach], so one integer captures the state. Backtracking works but is exponential; DP is O(n²).',
  },
  hints: [
    'Keep `reach` = the farthest index reachable so far.',
    'At index i: if i > reach you are stuck; otherwise reach = max(reach, i + nums[i]).',
  ],
  approach: `**Brute force:** recursively try every jump length from every index — exponential. Memoising "can index i reach the end?" gives O(n²).

**Greedy:** the reachable set is a prefix: any jump landing past j could have been shortened to land on j. So track \`reach\`. Scan i = 0..n−1; if i > reach, i is unreachable and so is everything after → false. Else extend reach. If the loop ends (or reach ≥ n − 1), return true.`,

  functionName: 'canJump',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function canJump(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Jump 1 step to index 1, then 3 steps to the end.', args: [[2, 3, 1, 1, 4]], expected: true },
    { scenario: 'Example 2', hint: 'Every path lands on index 3, whose value is 0 — the end is unreachable.', args: [[3, 2, 1, 0, 4]], expected: false },
    { scenario: 'Single element', hint: 'You start on the last index — return true even though nums[0] is 0.', args: [[0]], expected: true },
    { scenario: 'Stuck at the start', hint: 'nums[0] = 0 with more cells: check i > reach BEFORE extending reach, or index 1 extends reach it can never use.', args: [[0, 1]], expected: false },
    { scenario: 'Two elements, one step', hint: 'A single jump of length 1 reaches the end.', args: [[1, 0]], expected: true },
    { scenario: 'Shorter jump needed', hint: 'Jumping exactly nums[0] = 2 lands on a 0; jumping 1 step to the 3 reaches the end. Any length up to nums[i] is allowed.', args: [[2, 3, 0, 1]], expected: true },
    { scenario: 'Trailing zeros reachable', hint: 'Zeros after the reach are fine as long as the last index is within reach.', args: [[2, 0, 0]], expected: true },
    { scenario: 'Zero wall in the middle', hint: 'Reach stops exactly at the 0 at index 2, so index 3 is a gap.', args: [[1, 1, 0, 1]], expected: false },
    { scenario: 'One big first jump', hint: 'nums[0] alone covers the whole array.', args: [[5, 0, 0, 0, 0, 0]], expected: true },
    { scenario: 'Jump over a zero', hint: 'The zero at index 2 is skipped by the jump from index 1.', args: [[1, 2, 0, 1]], expected: true },
    { scenario: 'Maximum jump value', hint: 'Values up to 10^5 overshoot the array — that still counts as reaching the end.', args: [[100000, 0]], expected: true },
    { scenario: 'Large reachable (n = 10^4)', hint: 'Long chain of 3-jumps over zeros; a single forward reach sweep handles it in O(n).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i % 3 === 0 ? 3 : 0))]', expected: true },
    { scenario: 'Large unreachable wall (n = 10^4)', hint: 'Everything reaches exactly the zero at index 5000 and no further. Recursion without memo explores exponentially many paths; the greedy notices the gap in O(n).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => (i < 5000 ? 5000 - i : i === 5000 ? 0 : 1))]', expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canJump(nums) {
  let reach = 0;                          // every index <= reach is reachable
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;          // gap: i cannot be reached
    reach = Math.max(reach, i + nums[i]);
    if (reach >= nums.length - 1) return true;
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'i > reach?', 'reach'],
    rows: [
      ['0', '3', 'no', '3'],
      ['1', '2', 'no', '3'],
      ['2', '1', 'no', '3'],
      ['3', '0', 'no', '3'],
      ['4', '4', 'yes → false', '—'],
    ],
    note: 'nums = [3,2,1,0,4].',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Single pass with one variable.' },
  alternative: {
    title: 'Backward greedy — move the goal',
    md: 'Walk from the end keeping `goal` = leftmost index known to reach the end. If `i + nums[i] >= goal`, set `goal = i`. Answer: `goal === 0`.',
    code: `function canJump(nums) {
  let goal = nums.length - 1;
  for (let i = nums.length - 2; i >= 0; i--) {
    if (i + nums[i] >= goal) goal = i;
  }
  return goal === 0;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Checking `i > reach` after updating reach (then an unreachable index could extend reach).',
    'Assuming you must jump exactly nums[i] steps — any length up to nums[i] is allowed.',
    'Returning false for a single-element array.',
  ],
};
