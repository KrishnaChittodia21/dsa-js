export default {
  id: 'find-the-highest-altitude',
  title: 'Find the Highest Altitude',
  difficulty: 'Easy',
  order: 2,
  pattern: 'prefix-sum-1d',
  tags: ['array', 'prefix sum'],
  source: { platform: 'LeetCode', number: 1732, url: 'https://leetcode.com/problems/find-the-highest-altitude/' },

  statement: `A biker starts a road trip at altitude \`0\`. The road has \`n + 1\` points. You are given \`gain\`, where \`gain[i]\` is the **net change** in altitude between point \`i\` and point \`i + 1\`.

Return the **highest altitude** reached at any point (including the start).`,
  examples: [
    { input: 'gain = [-5,1,5,0,-7]', output: '1', explanation: 'Altitudes: 0, -5, -4, 1, 1, -6. The highest is 1.' },
    { input: 'gain = [-4,-3,-2,-1,4,3,2]', output: '0', explanation: 'Altitudes: 0, -4, -7, -9, -10, -6, -3, -1. The start is highest.' },
  ],
  constraints: ['1 <= gain.length <= 100', '-100 <= gain[i] <= 100'],

  think: `- If you know the altitude at point \`i\`, how do you get point \`i + 1\`?
- The altitudes are the prefix sums of \`gain\` — including the empty prefix. Why does that matter for the answer?
- Do you need to store all altitudes?`,
  patternChallenge: {
    options: ['Kadane\'s algorithm', 'Binary Search', 'Prefix Sum (running maximum)', 'Sliding Window'],
    answer: 2,
    explanation: 'Altitude at point i is the sum of the first i gains — a prefix sum, where the empty prefix (0) is the starting altitude. Track the max as you go. Kadane finds the best *subarray* sum, but here every path starts at point 0.',
  },
  hints: [
    'Keep `altitude = 0` and `best = 0` (the start counts).',
    'Add each gain to `altitude` and update `best`.',
  ],
  approach: `The altitude at point \`i\` is \`gain[0] + … + gain[i − 1]\`, the prefix sum of gain, with the **empty prefix 0** as the starting point. Walk once, keep the running altitude and its maximum. Initialising \`best = 0\` accounts for the start — without it, an all-negative trip would report a negative "highest" altitude.`,

  functionName: 'largestAltitude',
  paramNames: ['gain'],
  starterCode: `/**
 * @param {number[]} gain
 * @return {number}
 */
function largestAltitude(gain) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Altitudes 0, -5, -4, 1, 1, -6 — the highest is 1.', args: [[-5, 1, 5, 0, -7]], expected: 1 },
    { scenario: 'Example 2', hint: 'The starting altitude 0 is the highest point.', args: [[-4, -3, -2, -1, 4, 3, 2]], expected: 0 },
    { scenario: 'Single positive gain', hint: 'Smallest input: one climb to 5.', args: [[5]], expected: 5 },
    { scenario: 'Single negative gain', hint: 'The start (0) beats the only later altitude. Starting best at gain[0] or -Infinity returns -1.', args: [[-1]], expected: 0 },
    { scenario: 'All gains positive', hint: 'The final altitude is the highest.', args: [[1, 2, 3]], expected: 6 },
    { scenario: 'Peak in the middle', hint: 'Returning the final altitude instead of the maximum gives 7 instead of 8.', args: [[3, -5, 10, -1]], expected: 8 },
    { scenario: 'All zeros', hint: 'Flat ride — every altitude is 0.', args: [[0, 0]], expected: 0 },
    { scenario: 'All negative', hint: 'Always descending; the start is the answer.', args: [[-100, -100, -100]], expected: 0 },
    { scenario: 'Max climb', hint: '100 gains of +100 reach 10000.', args: [[100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]], expected: 10000 },
    { scenario: 'Peak at the first step', hint: 'The highest point is right after the first gain.', args: [[100, -1, -1, -1]], expected: 100 },
    { scenario: 'Back to zero', hint: 'Climbs and returns; ties with 0 do not matter.', args: [[2, -2, 1, -1]], expected: 2 },
    { scenario: 'Max length random gains', hint: 'Largest allowed input (n = 100) with mixed gains.', argsGen: '() => { let s = 17; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 100 }, () => (r() % 201) - 100)]; }', expected: 584 },
  ],

  solution: {
    code: `function largestAltitude(gain) {
  let altitude = 0, best = 0; // the starting point (altitude 0) counts
  for (const g of gain) {
    altitude += g;
    best = Math.max(best, altitude);
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['gain', 'altitude', 'best'],
    rows: [
      ['start', '0', '0'],
      ['-5', '-5', '0'],
      ['1', '-4', '0'],
      ['5', '1', '1'],
      ['0', '1', '1'],
      ['-7', '-6', '1'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two variables.' },
  alternative: {
    title: 'Build the altitude array',
    md: 'Build all `n + 1` altitudes (prefix array with leading 0) and return `Math.max(...alts)`. O(n) space; spreading a huge array into `Math.max` can also overflow the call stack for very large n.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Starting `best` at `-Infinity` or `gain[0]` and forgetting the starting altitude 0.',
    'Returning the final altitude instead of the maximum.',
  ],
};
