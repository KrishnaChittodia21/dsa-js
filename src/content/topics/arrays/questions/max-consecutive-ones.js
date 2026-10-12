export default {
  id: 'max-consecutive-ones',
  title: 'Max Consecutive Ones',
  difficulty: 'Easy',
  order: 1,
  pattern: 'array-traversal-running-state',
  tags: ['array', 'traversal'],
  source: { platform: 'LeetCode', number: 485, url: 'https://leetcode.com/problems/max-consecutive-ones/' },

  statement: `You are given an array \`nums\` that contains only \`0\`s and \`1\`s.

Return the length of the **longest run of consecutive 1s** in the array.`,
  examples: [
    { input: 'nums = [1,1,0,1,1,1]', output: '3', explanation: 'The last three elements form the longest run of 1s.' },
    { input: 'nums = [1,0,1,1,0,1]', output: '2' },
  ],
  constraints: ['1 <= nums.length <= 10^5', 'nums[i] is 0 or 1'],

  think: `- Standing at index i, what do you need to know about the elements to your left?
- What happens to the current run when you see a 0?`,
  patternChallenge: {
    options: ['Hash Map (Frequency Count)', 'Binary Search', 'Single Pass with Running State', 'Sort then scan'],
    answer: 2,
    explanation: '"Consecutive" + a trivial rule (the value is 1) means one pass with a streak counter is enough. Sorting would destroy adjacency; no lookups are needed.',
  },
  hints: ['Keep a counter `current` for the run that ends at the current index.', 'On a 1, increment it; on a 0, reset it to 0. Track the maximum after each step.'],
  approach: `**Brute force:** from every start index, count 1s until a 0 → O(n²) in the worst case (all ones).

**Optimized:** one pass. \`current\` = length of the run of 1s ending at i. It becomes \`current + 1\` on a 1 and \`0\` on a 0. Update \`best = max(best, current)\` every step, so the final run is recorded without a special case.`,

  functionName: 'findMaxConsecutiveOnes',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMaxConsecutiveOnes(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: the longest run (3) is the last one.', args: [[1, 1, 0, 1, 1, 1]], expected: 3 },
    { scenario: 'Example 2', hint: 'Two runs of length 2 and a run of length 1 — the answer is the longest run.', args: [[1, 0, 1, 1, 0, 1]], expected: 2 },
    { scenario: 'Single zero', hint: 'No 1s at all — the answer is 0.', args: [[0]], expected: 0 },
    { scenario: 'Single one', hint: 'If you only update best when a 0 appears, this one-element run is never recorded.', args: [[1]], expected: 1 },
    { scenario: 'All zeros', hint: 'There is no run of 1s; make sure best stays 0.', args: [[0, 0, 0, 0]], expected: 0 },
    { scenario: 'All ones', hint: 'The whole array is one run and no 0 ever appears — compare with best after every step (or after the loop).', args: [[1, 1, 1, 1, 1]], expected: 5 },
    { scenario: 'Longest run at the end', hint: 'Only updating best when a 0 appears misses the final run.', args: [[1, 0, 0, 1, 1, 0, 1, 1, 1, 1]], expected: 4 },
    { scenario: 'Longest run at the start', hint: 'The first run is the longest; later shorter runs must not overwrite best.', args: [[1, 1, 1, 0, 1, 0, 1, 1]], expected: 3 },
    { scenario: 'Alternating values', hint: 'Every run has length 1; resetting current to 1 instead of 0 on a zero would report 2.', args: [[1, 0, 1, 0, 1, 0]], expected: 1 },
    { scenario: 'Zeros between equal runs', hint: 'Consecutive zeros must reset the counter each time; ties keep the same best.', args: [[1, 1, 0, 0, 0, 1, 1]], expected: 2 },
    { scenario: 'Two elements', hint: 'A tiny array with the 1 in the last position.', args: [[0, 1]], expected: 1 },
    { scenario: 'Large single run (n = 10^5)', hint: 'Re-scanning a run from every starting index is O(n²); count runs in one pass.', argsGen: '() => [Array(100000).fill(1)]', expected: 100000, timeLimitMs: 1000 },
    { scenario: 'Large mixed input (n = 10^5)', hint: 'One pass with a running counter is O(n).', argsGen: '() => { let s = 11; return [Array.from({ length: 100000 }, (_, i) => (i > 15000 && i < 90000) || ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 4 !== 0) ? 1 : 0)]; }', expected: 75002, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findMaxConsecutiveOnes(nums) {
  let best = 0;
  let current = 0;              // length of the run of 1s ending here
  for (const x of nums) {
    current = x === 1 ? current + 1 : 0;
    best = Math.max(best, current); // recording every step handles the last run
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'current', 'best'],
    rows: [['0', '1', '1', '1'], ['1', '1', '2', '2'], ['2', '0', '0', '2'], ['3', '1', '1', '2'], ['4', '1', '2', '2'], ['5', '1', '3', '3']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two integer variables.' },
  alternative: {
    title: 'Split trick (short but allocates)',
    md: 'Join into a string and split on "0": the longest piece is the answer. Clever, but O(n) extra memory and slower constants.',
    code: `function findMaxConsecutiveOnes(nums) {
  return Math.max(...nums.join('').split('0').map((s) => s.length));
}`,
    complexity: 'O(n) time, O(n) space (and spreading 10^5 values into Math.max can hit argument limits)',
  },
  mistakes: ['Only updating `best` when a 0 appears — the final run is then missed', 'Resetting `current` to 1 instead of 0 on a zero'],
};
