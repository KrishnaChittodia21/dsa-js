export default {
  id: 'minimum-cost-for-tickets',
  title: 'Minimum Cost For Tickets',
  difficulty: 'Medium',
  order: 9,
  pattern: 'dp-1d-unbounded-choice',
  tags: ['array', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 983, url: 'https://leetcode.com/problems/minimum-cost-for-tickets/' },

  statement: `You will travel on the days listed in \`days\` (strictly increasing, each between 1 and 365). Train passes come in three kinds:

- a **1-day** pass for \`costs[0]\`,
- a **7-day** pass for \`costs[1]\`,
- a **30-day** pass for \`costs[2]\`.

A pass bought on day d covers d and the following days of its length (a 7-day pass bought on day 2 covers days 2..8). Return the **minimum total cost** to cover every travel day.`,
  examples: [
    { input: 'days = [1,4,6,7,8,20], costs = [2,7,15]', output: '11', explanation: '1-day on day 1 (2), 7-day on day 4 (7, covers 4..10), 1-day on day 20 (2).' },
    { input: 'days = [1,2,3,4,5,6,7,8,9,10,30,31], costs = [2,7,15]', output: '17', explanation: '30-day pass on day 1 (15) + 1-day on day 31 (2).' },
  ],
  constraints: ['1 <= days.length <= 365', '1 <= days[i] <= 365, strictly increasing', 'costs.length == 3', '1 <= costs[i] <= 1000'],

  think: `- Define dp[d] = cheapest way to cover all travel days up to day d. If d is not a travel day, what is dp[d]?
- If d is a travel day, the pass covering d was bought on some earlier day. What are the three possible "last purchases"?
- Why is greedy ("buy the pass with the best price per day") wrong?`,
  patternChallenge: {
    options: ['Greedy — cheapest price per day', 'Sliding Window — Fixed Size', 'Binary Search', '1D DP — Unbounded Choices'],
    answer: 3,
    explanation: 'dp over days with three "last move" options: dp[d] = min(dp[d−1] + c1, dp[d−7] + c7, dp[d−30] + c30). The best pass depends on how many travel days it would actually cover — a greedy price-per-day rule ignores that.',
  },
  hints: [
    'dp[d] = dp[d − 1] on non-travel days.',
    'On a travel day, dp[d] = min(dp[d−1] + costs[0], dp[max(0, d−7)] + costs[1], dp[max(0, d−30)] + costs[2]).',
  ],
  approach: `**Brute force:** at each travel day try all three passes recursively — O(3ⁿ).

**DP over calendar days:** \`dp[d]\` = min cost to cover all travel days ≤ d. On a travel day, the pass covering d is (thinking backwards) a 1-, 7- or 30-day pass ending at d, so the rest must cover days ≤ d − 1, d − 7 or d − 30. Negative days clamp to 0. Answer \`dp[lastDay]\`. 365 × 3 operations.`,

  functionName: 'mincostTickets',
  paramNames: ['days', 'costs'],
  starterCode: `/**
 * @param {number[]} days
 * @param {number[]} costs
 * @return {number}
 */
function mincostTickets(days, costs) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Day pass on day 1, a 7-day pass on day 4 (covers 4–10), day pass on day 20: 2 + 7 + 2.', args: [[1, 4, 6, 7, 8, 20], [2, 7, 15]], expected: 11 },
    { scenario: 'Example 2', hint: 'A 30-day pass covers days 1–30, then day passes for 30… no — day 31 only: 15 + 2.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30, 31], [2, 7, 15]], expected: 17 },
    { scenario: 'Single travel day', hint: 'One day of travel — the cheapest pass that covers it.', args: [[1], [2, 7, 15]], expected: 2 },
    { scenario: 'One full week', hint: 'Seven consecutive days: one 7-day pass (7) beats seven day passes (14). A pass bought on day 1 must not look up dp at a negative index — clamp d − 7 to 0.', args: [[1, 2, 3, 4, 5, 6, 7], [2, 7, 15]], expected: 7 },
    { scenario: 'Thirty consecutive days', hint: 'One 30-day pass covers everything.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], [2, 7, 15]], expected: 15 },
    { scenario: 'Two days far apart', hint: 'Only pay on travel days: the 363 days in between cost nothing.', args: [[1, 365], [2, 7, 15]], expected: 4 },
    { scenario: 'Week pass is the cheapest', hint: 'Costs can be in any order — here a 7-day pass (2) is cheaper than a day pass (7).', args: [[1, 2, 3], [7, 2, 15]], expected: 2 },
    { scenario: '30-day pass overpriced', hint: 'Do not assume the 30-day pass is the best value per day — here weeks plus day passes win.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], [2, 7, 100]], expected: 32 },
    { scenario: 'Day passes always cheapest', hint: 'When day passes are cheap enough, buy one per travel day.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 10, 40]], expected: 10 },
    { scenario: 'Late in the year', hint: 'A 30-day pass bought on day 340 covers to day 369 — past the end of the year is fine.', args: [[340, 345, 350, 355, 360, 365], [3, 10, 20]], expected: 18 },
    { scenario: 'Every day of the year', hint: 'Plain recursion tries three passes for every travel day — 3^n branches. Memoize per day (or index) for O(365).', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365], [2, 7, 15]], expected: 187, timeLimitMs: 1000 },
    { scenario: 'Every other day', hint: 'Gaps between travel days: non-travel days must carry the previous cost forward, not add to it.', args: [[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127, 129, 131, 133, 135, 137, 139, 141, 143, 145, 147, 149, 151, 153, 155, 157, 159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 179, 181, 183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 209, 211, 213, 215, 217, 219, 221, 223, 225, 227, 229, 231, 233, 235, 237, 239, 241, 243, 245, 247, 249, 251, 253, 255, 257, 259, 261, 263, 265, 267, 269, 271, 273, 275, 277, 279, 281, 283, 285, 287, 289, 291, 293, 295, 297, 299, 301, 303, 305, 307, 309, 311, 313, 315, 317, 319, 321, 323, 325, 327, 329, 331, 333, 335, 337, 339, 341, 343, 345, 347, 349, 351, 353, 355, 357, 359, 361, 363, 365], [3, 10, 25]], expected: 309, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function mincostTickets(days, costs) {
  const last = days[days.length - 1];
  const travel = new Set(days);
  const dp = new Array(last + 1).fill(0);      // dp[0] = 0: nothing to cover
  for (let d = 1; d <= last; d++) {
    if (!travel.has(d)) { dp[d] = dp[d - 1]; continue; }  // no travel → no new cost
    dp[d] = Math.min(
      dp[d - 1] + costs[0],                    // 1-day pass covering d
      dp[Math.max(0, d - 7)] + costs[1],       // 7-day pass covering d-6..d
      dp[Math.max(0, d - 30)] + costs[2],      // 30-day pass covering d-29..d
    );
  }
  return dp[last];
}`,
  },
  dryRun: {
    columns: ['d', 'travel?', '1-day', '7-day', '30-day', 'dp[d]'],
    rows: [
      ['1', 'yes', '0+2', '0+7', '0+15', '2'],
      ['4', 'yes', '2+2', '0+7', '0+15', '4'],
      ['6', 'yes', '4+2', '0+7', '0+15', '6'],
      ['7', 'yes', '6+2', '0+7', '0+15', '7'],
      ['8', 'yes', '7+2', 'dp[1]+7 = 9', '0+15', '9'],
      ['20', 'yes', '9+2', 'dp[13]+7 = 16', '0+15', '11'],
    ],
    note: 'Non-travel days copy the previous value.',
  },
  complexity: { time: 'O(D)', space: 'O(D)', explanation: 'D = last travel day ≤ 365; three options per day.' },
  alternative: {
    title: 'DP over travel days with pointers',
    md: 'dp[i] = min cost from travel day i onward; for each pass, jump to the first travel day not covered. Useful when the calendar is huge but travel days are few.',
    code: `function mincostTickets(days, costs) {
  const n = days.length;
  const dp = new Array(n + 1).fill(0);
  const lens = [1, 7, 30];
  for (let i = n - 1; i >= 0; i--) {
    dp[i] = Infinity;
    let j = i;
    for (let p = 0; p < 3; p++) {
      while (j < n && days[j] < days[i] + lens[p]) j++;
      dp[i] = Math.min(dp[i], costs[p] + dp[j]);
    }
  }
  return dp[0];
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: ['Paying on non-travel days.', 'Negative indices for d − 7 / d − 30 (clamp to 0).', 'Assuming the 30-day pass is always the cheapest per day — costs can be arbitrary.'],
};
