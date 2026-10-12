export default {
  id: 'best-time-to-buy-and-sell-stock-iv',
  title: 'Best Time to Buy and Sell Stock IV',
  difficulty: 'Hard',
  order: 2,
  pattern: 'dp-adv-state-machine',
  tags: ['array', 'dynamic programming', 'state machine'],
  source: { platform: 'LeetCode', number: 188, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iv/' },

  statement: `\`prices[i]\` is a stock's price on day \`i\`. You may complete **at most \`k\` transactions** (a transaction = one buy followed later by one sell), holding at most one share at a time.

Return the maximum profit.`,
  examples: [
    { input: 'k = 2, prices = [2,4,1]', output: '2' },
    { input: 'k = 2, prices = [3,2,6,5,0,3]', output: '7', explanation: 'Buy 2 sell 6 (+4), buy 0 sell 3 (+3).' },
  ],
  constraints: ['1 <= k <= 100', '1 <= prices.length <= 1000', '0 <= prices[i] <= 1000'],

  think: `- For k = 1 you track "min so far". What changes when you may do k transactions?
- What does the state need to remember besides "holding or not"?
- If k is huge compared with the number of days, does the limit matter at all?`,
  patternChallenge: {
    options: ['Greedy: take the k largest price rises', 'State-machine DP: buy[j] / sell[j] for j = 1..k', 'Sliding window of size k', 'Binary search on profit'],
    answer: 1,
    explanation: 'The k largest single-day rises can overlap or be better merged; greedy fails. Adding "number of transactions used" to the hold/cash states gives 2k states per day and O(n·k) time.',
  },
  hints: [
    'buy[j] = best balance while holding the share of the j-th transaction; sell[j] = best balance after completing j transactions.',
    'For each price p and j = 1..k: buy[j] = max(buy[j], sell[j−1] − p); sell[j] = max(sell[j], buy[j] + p). If k ≥ n/2 the limit never binds → sum all positive rises.',
  ],
  approach: `**Brute force:** decide buy/sell/wait each day with a transaction counter → O(3^n) without memo, O(n·k) with memo on (day, j, holding).

**Bottom-up state machine:**
- \`buy = [-∞, …]\`, \`sell = [0, …]\` (length k + 1).
- Each day, for j = 1..k: \`buy[j] = max(buy[j], sell[j−1] − p)\`, \`sell[j] = max(sell[j], buy[j] + p)\`.
- Answer \`sell[k]\` (unused transactions simply keep sell[j] equal to sell[j−1] or better).

**Shortcut:** a transaction takes at least 2 days, so with \`k ≥ n/2\` you can take every rise: \`Σ max(0, p[i] − p[i−1])\`.

Updating buy[j] then sell[j] on the same day is safe: it can only simulate "buy and sell on the same day", which adds 0 profit.`,

  functionName: 'maxProfit',
  paramNames: ['k', 'prices'],
  starterCode: `/**
 * @param {number} k
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(k, prices) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "Buy at 2, sell at 4 — one transaction is enough here.", args: [2,[2,4,1]], expected: 2 },
    { scenario: "Example 2", hint: "Two separate transactions (2→6 and 0→3) beat any single one.", args: [2,[3,2,6,5,0,3]], expected: 7 },
    { scenario: "Single day", hint: "With one price you can never complete a transaction — the answer is 0.", args: [2,[5]], expected: 0 },
    { scenario: "Two days rising", hint: "Smallest case with a profitable trade: buy day 0, sell day 1.", args: [1,[1,5]], expected: 4 },
    { scenario: "Strictly decreasing prices", hint: "No trade is profitable; never return a negative profit.", args: [4,[5,4,3,2,1]], expected: 0 },
    { scenario: "All prices equal", hint: "Flat prices give zero profit regardless of k.", args: [3,[7,7,7,7]], expected: 0 },
    { scenario: "k = 1 picks best single trade", hint: "With one transaction the answer is the largest later-minus-earlier difference (1→6).", args: [1,[7,1,5,3,6,4]], expected: 5 },
    { scenario: "k exceeds n/2 (unlimited)", hint: "When k ≥ n/2 the limit never binds — sum every rise. Allocating a huge k table is the usual mistake.", args: [100,[1,3,2,8,4,9]], expected: 13 },
    { scenario: "k limits the trades", hint: "There are more profitable rises than k allows; you must merge or drop the smallest ones.", args: [2,[1,2,4,2,5,7,2,4,9,0]], expected: 13 },
    { scenario: "Transaction counted once", hint: "A transaction is a buy+sell pair. Counting both the buy and the sell against k halves the trades you can make.", args: [2,[1,5,2,8]], expected: 10 },
    { scenario: "Free share bug", hint: "If buy starts at 0 instead of −∞ (or −price), you pretend to own a share for free and \"sell\" it at 10.", args: [1,[10,9,8,9]], expected: 1 },
    { scenario: "Zero prices", hint: "Prices may be 0; buying at 0 is legal and the profit is the full sell price.", args: [2,[0,0,1000,0,1000]], expected: 2000 },
    { scenario: "Large k and n (n = 1000)", hint: "O(n·k) = 10^5 steps is instant; an exponential recursion without memoization never finishes.", argsGen: "() => { let s = 2024; const p = []; for (let i = 0; i < 1000; i++) { s = (s * 16807) % 2147483647; p.push(s % 1001); } return [100, p]; }", expected: 85573, timeLimitMs: 1000 },
    { scenario: "Zigzag prices, k binds", hint: "499 profitable rises but only k = 50 trades — keep the k best; O(n·k) handles it.", argsGen: "() => [50, Array.from({ length: 1000 }, (_, i) => (i % 2 ? 1000 - (i % 7) : i % 5))]", expected: 50000, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxProfit(k, prices) {
  const n = prices.length;
  if (k >= n >> 1) {                          // limit can never bind
    let profit = 0;
    for (let i = 1; i < n; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
    return profit;
  }
  const buy = new Array(k + 1).fill(-Infinity); // holding share of transaction j
  const sell = new Array(k + 1).fill(0);        // finished j transactions
  for (const p of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - p);
      sell[j] = Math.max(sell[j], buy[j] + p);
    }
  }
  return sell[k];
}`,
  },
  dryRun: {
    columns: ['price', 'buy[1]', 'sell[1]', 'buy[2]', 'sell[2]'],
    rows: [['3', '-3', '0', '-3', '0'], ['2', '-2', '0', '-2', '0'], ['6', '-2', '4', '-2', '4'], ['5', '-2', '4', '-1', '4'], ['0', '0', '4', '4', '4'], ['3', '0', '4', '4', '7']],
  },
  complexity: { time: 'O(n · k)', space: 'O(k)', explanation: '2k states updated per day (or O(n) when the shortcut applies).' },
  alternative: {
    title: 'Memoized recursion (day, transactions left, holding)',
    md: 'Top-down version of the same state space.',
    code: `function maxProfit(k, prices) {
  const n = prices.length;
  const memo = new Map();
  function go(i, left, holding) {
    if (i === n || (left === 0 && !holding)) return 0;
    const key = (i * (k + 1) + left) * 2 + holding;
    if (memo.has(key)) return memo.get(key);
    let r = go(i + 1, left, holding);
    if (holding) r = Math.max(r, prices[i] + go(i + 1, left - 1, 0));
    else r = Math.max(r, -prices[i] + go(i + 1, left, 1));
    memo.set(key, r);
    return r;
  }
  return go(0, k, 0);
}`,
    complexity: 'O(n · k) time and space',
  },
  mistakes: [
    'Allocating an n × k table for huge k — use the k ≥ n/2 shortcut.',
    'Counting a transaction on buy AND on sell.',
    'Initialising buy with 0.',
  ],
};
