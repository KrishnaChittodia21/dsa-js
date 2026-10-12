export default {
  id: 'best-time-to-buy-and-sell-stock',
  title: 'Best Time to Buy and Sell Stock',
  difficulty: 'Easy',
  order: 3,
  pattern: 'array-traversal-running-state',
  tags: ['array', 'running minimum'],
  source: { platform: 'LeetCode', number: 121, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },

  statement: `\`prices[i]\` is the price of a stock on day \`i\`.

You may buy **one** share on some day and sell it on a **later** day. Return the maximum profit you can make. If no profit is possible, return \`0\`.`,
  examples: [
    { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 1 (price 1), sell on day 4 (price 6).' },
    { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'Prices only fall — do not trade.' },
  ],
  constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],

  think: `- If you decide to sell today, which earlier day should you have bought on?
- Can that "best earlier day" be maintained as you scan?`,
  patternChallenge: {
    options: ['Sort the prices', 'Single Pass with Running State (running minimum)', 'Sliding Window of fixed size', 'Binary Search'],
    answer: 1,
    explanation: 'The pair must satisfy buy < sell, and for each sell day only the minimum earlier price matters — a running minimum. Sorting loses the time order.',
  },
  hints: ['Try every day as the sell day.', 'The best buy day for sell day j is the minimum of prices[0..j−1]; keep it in a variable.'],
  approach: `**Brute force:** all pairs i < j, profit prices[j] − prices[i] → O(n²) — 5·10^9 pairs for n = 10^5.

**Optimized:** scan once with \`minSoFar\`. For each price: profit if sold today = price − minSoFar; update best; then update minSoFar. Starting \`best\` at 0 handles "no profit".`,

  functionName: 'maxProfit',
  paramNames: ['prices'],
  starterCode: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: buy at 1, sell at 6.', args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
    { scenario: 'Example 2', hint: 'Prices only fall, so no trade is profitable — the answer is 0, not a negative number.', args: [[7, 6, 4, 3, 1]], expected: 0 },
    { scenario: 'Single day', hint: 'With one price you cannot buy and sell on different days; return 0.', args: [[5]], expected: 0 },
    { scenario: 'Two days rising', hint: 'The smallest profitable case — make sure the loop compares the second day with the first.', args: [[1, 2]], expected: 1 },
    { scenario: 'Two days falling', hint: 'Returning a negative profit is a common mistake — if no trade gains money, return 0.', args: [[2, 1]], expected: 0 },
    { scenario: 'Maximum before minimum', hint: 'Returning max − min of the whole array is wrong: here the max (4) comes before the min (1), so you cannot sell at 4 after buying at 1.', args: [[2, 4, 1]], expected: 2 },
    { scenario: 'Sorting breaks day order', hint: 'Sorting the prices destroys the time order — the sorted spread is 9 − 1 = 8, but you can only buy before you sell.', args: [[4, 9, 1, 3]], expected: 5 },
    { scenario: 'Later low gives best profit', hint: 'The cheapest day appears after an earlier peak; keep updating the running minimum as you scan.', args: [[7, 2, 9, 1, 9]], expected: 8 },
    { scenario: 'All prices equal', hint: 'Flat prices give zero profit; make sure you do not report a profit from equal values.', args: [[3, 3, 3, 3]], expected: 0 },
    { scenario: 'Zero and maximum price', hint: 'Prices may be 0; initialise your minimum to Infinity (or the first price), not to 0.', args: [[0, 10000]], expected: 10000 },
    { scenario: 'Several peaks and valleys', hint: 'Only one transaction is allowed — do not add up the profits of several rises.', args: [[2, 1, 2, 1, 0, 1, 2]], expected: 2 },
    { scenario: 'Large falling input (n = 10^5)', hint: 'Checking every buy/sell pair is O(n²) — too slow. Track the minimum so far in one pass.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => Math.floor((100000 - i) / 10))]', expected: 0, timeLimitMs: 1000 },
    { scenario: 'Large random input (n = 10^5)', hint: 'One pass with a running minimum is O(n); a double loop over pairs times out here.', argsGen: '() => { let s = 7; return [Array.from({ length: 100000 }, () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 10001)]; }', expected: 10000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxProfit(prices) {
  let minSoFar = Infinity;  // cheapest price on any earlier day
  let best = 0;             // 0 = "don't trade"
  for (const price of prices) {
    best = Math.max(best, price - minSoFar); // sell today
    minSoFar = Math.min(minSoFar, price);    // today can be a future buy day
  }
  return best;
}`,
    explanation: 'Using the old minimum before updating it guarantees buy day < sell day. (Doing it in the other order gives profit 0 for today, which is harmless but less clear.)',
  },
  dryRun: {
    columns: ['day', 'price', 'price − minSoFar', 'best', 'minSoFar after'],
    rows: [['0', '7', '−∞', '0', '7'], ['1', '1', '−6', '0', '1'], ['2', '5', '4', '4', '1'], ['3', '3', '2', '4', '1'], ['4', '6', '5', '5', '1'], ['5', '4', '3', '5', '1']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass, two variables.' },
  alternative: {
    title: 'Max subarray of daily differences (Kadane)',
    md: 'Profit from i to j = sum of daily changes prices[k] − prices[k−1] for k in (i, j]. So the answer is the maximum subarray sum of the difference array (floored at 0) — Kadane\'s algorithm, which you will meet in a later topic.',
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: ['Returning max − min of the whole array (the max may come before the min)', 'Returning a negative profit instead of 0', 'Sorting the prices'],
};
