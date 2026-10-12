export default {
  id: 'predict-the-winner',
  title: 'Predict the Winner',
  difficulty: 'Medium',
  order: 6,
  pattern: 'recursion-game-minimax',
  tags: ['recursion', 'game theory', 'minimax', 'memoization'],
  source: { platform: 'LeetCode', number: 486, url: 'https://leetcode.com/problems/predict-the-winner/' },

  statement: `Two players play with an integer array \`nums\`. Player 1 moves first, then they alternate. On each turn the player takes the number at **either end** of the remaining array and adds it to their score. The game ends when the array is empty.

Both players play optimally. Return \`true\` if player 1 can end with a score **greater than or equal to** player 2's score (a tie counts as a win for player 1).`,
  examples: [
    { input: 'nums = [1,5,2]', output: 'false', explanation: 'Whatever player 1 takes first, player 2 can take the 5. Player 1 ends with 3, player 2 with 5.' },
    { input: 'nums = [1,5,233,7]', output: 'true', explanation: 'Player 1 takes 1. Whatever player 2 takes (5 or 7), player 1 takes 233.' },
  ],
  constraints: ['1 <= nums.length <= 20', '0 <= nums[i] <= 10^7'],

  think: `- Why does "always take the bigger end" fail on [1, 5, 2]?
- After you take one number, the opponent faces a smaller array and plays optimally from *their* point of view. How can one function describe both players?
- What is the result when only one number is left?`,
  patternChallenge: {
    options: ['Greedy — take the larger end', 'Two Pointers from both ends', 'Game recursion: best score difference = max(pick − opponent\'s best difference)', 'Sorting'],
    answer: 2,
    explanation: '"Both players play optimally" is the minimax clue. Define diff(i, j) = best (mover − other) on nums[i..j]. Taking an end gives that number minus the opponent\'s best difference on the rest. Greedy fails because it ignores what the move exposes.',
  },
  hints: [
    '`diff(i, j) = max(nums[i] − diff(i + 1, j), nums[j] − diff(i, j − 1))`, with `diff(i, i) = nums[i]`.',
    'Player 1 wins iff `diff(0, n − 1) >= 0`. Plain recursion is 2^20 ≈ 10^6 calls; memoizing on (i, j) makes it O(n²).',
  ],
  approach: `**Why greedy fails:** \`[1, 5, 2]\` — taking 2 (the bigger end) exposes 5 to the opponent.

**Recursion on the score difference:** let \`diff(i, j)\` be the maximum of (current player's total − other player's total) obtainable from \`nums[i..j]\` when it is the current player's turn.
- Take \`nums[i]\`: the opponent then gets \`diff(i + 1, j)\` from their viewpoint, which is *against* me → \`nums[i] − diff(i + 1, j)\`.
- Take \`nums[j]\`: \`nums[j] − diff(i, j − 1)\`.
- \`diff(i, j)\` is the max of the two. Base case \`i === j\` → \`nums[i]\`.

Answer: \`diff(0, n − 1) >= 0\`.

**Memoization:** only n² distinct (i, j) pairs exist; caching them brings the time from O(2ⁿ) to O(n²). (This is interval DP — covered properly later.)`,

  functionName: 'predictTheWinner',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function predictTheWinner(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Whatever player 1 takes first, player 2 can grab the 5.', args: [[1,5,2]], expected: false },
    { scenario: 'Example 2', hint: 'Player 1 takes 1 so that player 2 can never reach 233.', args: [[1,5,233,7]], expected: true },
    { scenario: 'Single number', hint: 'Player 1 takes the only number and wins.', args: [[7]], expected: true },
    { scenario: 'Single zero', hint: '0 vs 0 is a tie, and ties count as a win for player 1.', args: [[0]], expected: true },
    { scenario: 'Two equal numbers', hint: 'A 1–1 tie: using `> 0` instead of `>= 0` returns false here.', args: [[1,1]], expected: true },
    { scenario: 'Two different numbers', hint: 'Player 1 simply takes the bigger end.', args: [[3,10]], expected: true },
    { scenario: 'Tie after optimal play', hint: 'Both end with 2. Ties go to player 1.', args: [[1,2,1]], expected: true },
    { scenario: 'Greedy opponent assumption', hint: 'Assuming player 2 plays greedily overestimates player 1 — both play optimally, so player 1 loses.', args: [[2,4,55,6,8]], expected: false },
    { scenario: 'Big number at the end', hint: 'Player 1 takes 99 immediately.', args: [[1,2,99]], expected: true },
    { scenario: 'Even length', hint: 'With an even count player 1 can always at least tie — but your recursion should find that by comparing both ends, not by a parity shortcut.', args: [[3,9,1,2]], expected: true },
    { scenario: 'All zeros', hint: 'Every score is 0 — a tie, so player 1 wins.', args: [[0,0,0,0,0]], expected: true },
    { scenario: 'Odd length, player 2 wins', hint: "Subtract the opponent's best difference; adding it instead flips the verdict.", args: [[0,0,7,6,5,6,1]], expected: false },
    { scenario: 'Maximum length (20)', hint: 'n = 20: plain recursion makes ~2^20 calls; memoizing (i, j) needs only n² states.', args: [[10,17,11,16,17,9,14,17,18,13,11,4,17,18,15,3,13,9,11,19]], expected: true },
    { scenario: 'Maximum values', hint: 'Values up to 10^7 with an odd length: check the differences, not just the parity.', args: [[10000000,1,9999999,2,10000000,3,1,10000000,5,9999998,0,7,10000000,4,8,9999999,6,2,1]], expected: true },
  ],

  solution: {
    code: `function predictTheWinner(nums) {
  const n = nums.length;
  const memo = new Map();            // "i,j" → best difference for the player to move

  function diff(i, j) {
    if (i === j) return nums[i];     // one number left: take it
    const key = i * n + j;
    if (memo.has(key)) return memo.get(key);
    const takeLeft = nums[i] - diff(i + 1, j);   // opponent's best counts against me
    const takeRight = nums[j] - diff(i, j - 1);
    const best = Math.max(takeLeft, takeRight);
    memo.set(key, best);
    return best;
  }

  return diff(0, n - 1) >= 0;        // ties go to player 1
}`,
    explanation: 'The key `i * n + j` is a cheap numeric encoding of the pair (i, j) — faster than building "i,j" strings.',
  },
  dryRun: {
    columns: ['state', 'take left', 'take right', 'diff'],
    rows: [
      ['[5] (i=j=1)', '—', '—', '5'],
      ['[2] (i=j=2)', '—', '—', '2'],
      ['[5,2]', '5 − 2 = 3', '2 − 5 = −3', '3'],
      ['[1,5]', '1 − 5 = −4', '5 − 1 = 4', '4'],
      ['[1,5,2]', '1 − 3 = −2', '2 − 4 = −2', '−2 → false'],
    ],
  },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'n² memoized states, each computed in O(1). Stack depth is at most n.' },
  alternative: {
    title: 'Plain recursion without memo',
    md: 'Drop the memo: two calls per state for depth n → O(2ⁿ) = about a million calls for n = 20. Accepted, but mention the memoized version in an interview.',
    code: `function predictTheWinner(nums) {
  const diff = (i, j) => i === j ? nums[i]
    : Math.max(nums[i] - diff(i + 1, j), nums[j] - diff(i, j - 1));
  return diff(0, nums.length - 1) >= 0;
}`,
    complexity: 'O(2ⁿ) time, O(n) space',
  },
  mistakes: [
    'Adding the opponent\'s result instead of subtracting it.',
    'Using `> 0` instead of `>= 0` — ties count as a win for player 1.',
    'Simulating a greedy opponent — both players are optimal.',
    'Tracking two separate scores through the recursion, which quickly becomes confusing and error-prone.',
  ],
};
