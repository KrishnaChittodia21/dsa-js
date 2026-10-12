export default {
  id: 'best-time-to-buy-and-sell-stock-with-cooldown',
  title: 'Best Time to Buy and Sell Stock with Cooldown',
  difficulty: 'Medium',
  order: 5,
  pattern: 'dp-adv-state-machine',
  tags: ['array', 'dynamic programming', 'state machine'],
  source: { platform: 'LeetCode', number: 309, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/' },

  statement: `\`prices[i]\` is a stock's price on day \`i\`. You may buy and sell as many times as you like, holding at most one share at a time, with one rule:

**After you sell, you cannot buy on the next day** (a one-day cooldown).

Return the maximum profit.`,
  examples: [
    { input: 'prices = [1,2,3,0,2]', output: '3', explanation: 'buy, sell, cooldown, buy, sell.' },
    { input: 'prices = [1]', output: '0' },
  ],
  constraints: ['1 <= prices.length <= 5000', '0 <= prices[i] <= 1000'],

  think: `- Draw the situations you can be in at the end of a day. Which of them are you NOT allowed to buy from?
- How many variables do you need per day?
- What is the initial value of "holding a share" before day 0?`,
  patternChallenge: {
    options: ['Greedy: sum every rise', 'State-machine DP with hold / sold / rest', 'Interval DP over days', 'Binary search on the answer'],
    answer: 1,
    explanation: 'The cooldown creates a dependency on yesterday\'s action. Three states (hold, sold today, rest) capture it exactly. The greedy ignores the cooldown; interval DP is overkill.',
  },
  hints: [
    'hold = max(hold, rest − p); sold = hold + p; rest = max(rest, sold) — all using YESTERDAY\'s values.',
    'Start with hold = −Infinity (impossible), sold = 0, rest = 0. Answer max(sold, rest).',
  ],
  approach: `**States at the end of day i:**
- **hold** — own a share (kept it, or bought today from *rest*).
- **sold** — sold today (from hold).
- **rest** — no share, did not sell today (from rest or from yesterday's *sold* — cooldown).

Transitions: \`hold' = max(hold, rest − p)\`, \`sold' = hold + p\`, \`rest' = max(rest, sold)\`. Update all three from the previous day's values simultaneously.`,

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
    { scenario: "Example 1", hint: "buy, sell, cooldown, buy, sell — the cooldown day sits between the two trades.", args: [[1,2,3,0,2]], expected: 3 },
    { scenario: "Example 2", hint: "A single day allows no trade — the answer is 0.", args: [[1]], expected: 0 },
    { scenario: "Two days rising", hint: "Buy on day 0, sell on day 1; no cooldown is needed after the last sale.", args: [[1,2]], expected: 1 },
    { scenario: "Two days falling", hint: "No profitable trade exists; do not return a negative number.", args: [[2,1]], expected: 0 },
    { scenario: "All prices equal", hint: "Flat prices mean zero profit.", args: [[4,4,4,4,4]], expected: 0 },
    { scenario: "Strictly increasing", hint: "One long trade (1→5) is best; splitting it would waste a day on cooldown.", args: [[1,2,3,4,5]], expected: 4 },
    { scenario: "Cooldown blocks rebuy", hint: "Selling at 4 and buying at 1 the next day is NOT allowed. Buying straight from \"sold\" ignores the cooldown and gets 3+5 = 8.", args: [[1,4,1,6]], expected: 5 },
    { scenario: "Simultaneous state update", hint: "Compute the new hold/sold/rest from yesterday's values only; updating one after another lets you sell and rebuy on the same day.", args: [[6,1,3,2,4,7]], expected: 6 },
    { scenario: "Free share bug", hint: "If hold starts at 0 you pretend to own a share for free and sell it at 5. The answer here is 0.", args: [[5,4,3]], expected: 0 },
    { scenario: "Zero prices", hint: "Prices may be 0; buying at 0 is legal.", args: [[0,0,1000,0,1000]], expected: 1000 },
    { scenario: "Skip a trade for cooldown", hint: "Sometimes it is better to skip a small trade so the cooldown does not block a bigger one.", args: [[1,2,3,0,2,5,1,7]], expected: 9 },
    { scenario: "Large input (n = 5000)", hint: "Plain recursion branching on buy/sell/wait is exponential. Three rolling states make it O(n).", argsGen: "() => { let s = 99; const p = []; for (let i = 0; i < 5000; i++) { s = (s * 16807) % 2147483647; p.push(s % 1001); } return [p]; }", expected: 653973, timeLimitMs: 1000 },
    { scenario: "Large zigzag (n = 5000)", hint: "Many tiny rises separated by single dips — the cooldown decides which to take. O(n) is required.", argsGen: "() => [Array.from({ length: 5000 }, (_, i) => (i % 3 === 2 ? 0 : (i % 3) * 500 + (i % 11)))]", expected: 833506, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxProfit(prices) {
  let hold = -Infinity;   // holding a share is impossible before day 0
  let sold = 0;           // sold today
  let rest = 0;           // not holding, not sold today
  for (const p of prices) {
    // right side uses only yesterday's values
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
  }
  return Math.max(sold, rest);
}`,
    explanation: 'Buying is only allowed from rest, never from sold — that is the cooldown.',
  },
  dryRun: {
    columns: ['day', 'price', 'hold', 'sold', 'rest'],
    rows: [['0', '1', '-1', '-∞', '0'], ['1', '2', '-1', '1', '0'], ['2', '3', '-1', '2', '1'], ['3', '0', '1', '-1', '2'], ['4', '2', '1', '3', '2']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Three variables updated once per day.' },
  alternative: {
    title: 'dp arrays with explicit i − 2',
    md: 'buy[i] = max(buy[i−1], sell[i−2] − p); sell[i] = max(sell[i−1], buy[i−1] + p). The i − 2 index encodes the cooldown directly.',
    code: `function maxProfit(prices) {
  const n = prices.length;
  const buy = new Array(n).fill(0), sell = new Array(n).fill(0);
  buy[0] = -prices[0];
  for (let i = 1; i < n; i++) {
    buy[i] = Math.max(buy[i - 1], (i >= 2 ? sell[i - 2] : 0) - prices[i]);
    sell[i] = Math.max(sell[i - 1], buy[i - 1] + prices[i]);
  }
  return sell[n - 1];
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Allowing buy from sold (ignores the cooldown).',
    'Updating hold/sold/rest one after another with already-updated values.',
    'Initialising hold = 0.',
  ],
};
