export default {
  id: 'best-time-to-buy-and-sell-stock-with-transaction-fee',
  title: 'Best Time to Buy and Sell Stock with Transaction Fee',
  difficulty: 'Medium',
  order: 4,
  pattern: 'dp-adv-state-machine',
  tags: ['array', 'dynamic programming', 'state machine'],
  source: { platform: 'LeetCode', number: 714, url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/' },

  statement: `\`prices[i]\` is a stock's price on day \`i\`, and every completed transaction (a buy followed by a sell) costs a fixed \`fee\`.

You may complete as many transactions as you like, but you can hold **at most one share** at a time (sell before buying again). Return the maximum profit.`,
  examples: [
    { input: 'prices = [1,3,2,8,4,9], fee = 2', output: '8', explanation: 'Buy 1 sell 8 (+7−2), buy 4 sell 9 (+5−2) → 8.' },
    { input: 'prices = [1,3,7,5,10,3], fee = 3', output: '6' },
  ],
  constraints: ['1 <= prices.length <= 5 * 10^4', '1 <= prices[i] < 5 * 10^4', '0 <= fee < 5 * 10^4'],

  think: `- Without the fee, "add every upward step" is optimal. Why does the fee break that greedy?
- At the end of a day, what two situations can you be in?
- How does each situation on day i follow from day i − 1?`,
  patternChallenge: {
    options: ['Greedy: sum every positive price difference', 'State-machine DP with states cash / hold', 'Kadane on price differences', 'Monotonic stack of prices'],
    answer: 1,
    explanation: 'The fee makes many small trades worse than one long trade, so the simple greedy overpays. Two states (holding a share or not) with one transition per action solves it in O(n). Kadane finds one best interval, not several.',
  },
  hints: [
    'cash = best profit while holding nothing; hold = best profit while holding one share.',
    'cash = max(cash, hold + price − fee); hold = max(hold, cash − price). Start with cash = 0, hold = −prices[0].',
  ],
  approach: `**Brute force:** on each day choose buy/sell/wait recursively → O(2^n).

**State machine:**
- \`cash[i] = max(cash[i−1], hold[i−1] + p − fee)\` — rest, or sell today.
- \`hold[i] = max(hold[i−1], cash[i−1] − p)\` — keep holding, or buy today.

Only yesterday matters, so two variables suffice. (Using the freshly updated \`cash\` when computing \`hold\` means "sell and rebuy the same day", which only loses a fee, so it never changes the maximum.)`,

  functionName: 'maxProfit',
  paramNames: ['prices', 'fee'],
  starterCode: `/**
 * @param {number[]} prices
 * @param {number} fee
 * @return {number}
 */
function maxProfit(prices, fee) {
  
}
`,
  tests: [
    { scenario: "Example 1", hint: "Two trades (1→8, 4→9) each pay the fee once: (8−1−2)+(9−4−2) = 8.", args: [[1,3,2,8,4,9],2], expected: 8 },
    { scenario: "Example 2", hint: "One long trade 1→10 beats two shorter trades once the fee is counted.", args: [[1,3,7,5,10,3],3], expected: 6 },
    { scenario: "Single day", hint: "No trade is possible with one price.", args: [[1],0], expected: 0 },
    { scenario: "Two days rising, zero fee", hint: "With fee 0 this is the plain buy-low-sell-high case.", args: [[1,5],0], expected: 4 },
    { scenario: "Fee equals the gain", hint: "A rise of exactly the fee earns nothing — answer 0, not negative.", args: [[1,5],4], expected: 0 },
    { scenario: "Fee exceeds every gain", hint: "No trade covers the fee; return 0.", args: [[1,3,2,4,3,5],10], expected: 0 },
    { scenario: "Strictly decreasing", hint: "No profitable trade exists.", args: [[5,4,3,2,1],1], expected: 0 },
    { scenario: "Sum-of-rises greedy fails", hint: "Taking every small rise pays the fee each time. Hold through the dips instead: one trade 1→10 nets 7.", args: [[1,3,2,4,3,6,5,10],2], expected: 7 },
    { scenario: "Fee charged once per trade", hint: "Charging the fee on both the buy and the sell makes the 1→9 trade look worth 4 instead of 6.", args: [[1,9],2], expected: 6 },
    { scenario: "Free share bug", hint: "If hold starts at 0 you \"sell\" a share you never paid for. Here prices only fall, so the answer is 0.", args: [[49999,30000,20000],1], expected: 0 },
    { scenario: "Mixed trades", hint: "Some dips are worth a new trade, others are not — the hold/cash DP decides each one.", args: [[1,4,6,2,8,3,10,14],3], expected: 13 },
    { scenario: "Large input (n = 5·10^4)", hint: "Trying every buy/sell pair is O(n²) — too slow. Deep recursion may also overflow the stack; use two rolling variables.", argsGen: "() => { let s = 7; const p = []; for (let i = 0; i < 50000; i++) { s = (s * 16807) % 2147483647; p.push(1 + (s % 49999)); } return [p, 500]; }", expected: 409764921, timeLimitMs: 1000 },
    { scenario: "Large rising run, zero fee", hint: "n = 5·10^4 steadily rising prices: one O(n) pass handles it; recursion of depth 5·10^4 overflows.", argsGen: "() => [Array.from({ length: 50000 }, (_, i) => i + 1), 0]", expected: 49999, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maxProfit(prices, fee) {
  let cash = 0;               // best profit with no share in hand
  let hold = -prices[0];      // best profit while holding one share
  for (let i = 1; i < prices.length; i++) {
    const p = prices[i];
    const prevCash = cash;
    cash = Math.max(cash, hold + p - fee);   // sell today (pay the fee)
    hold = Math.max(hold, prevCash - p);     // buy today
  }
  return cash;
}`,
  },
  dryRun: {
    columns: ['day', 'price', 'cash', 'hold'],
    rows: [['0', '1', '0', '-1'], ['1', '3', '0', '-1'], ['2', '2', '0', '-1'], ['3', '8', '5', '-1'], ['4', '4', '5', '1'], ['5', '9', '8', '1']],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Constant work per day, two variables.' },
  alternative: {
    title: 'Memoized recursion (day, holding)',
    md: 'The same state machine written top-down — handy for deriving the transitions.',
    code: `function maxProfit(prices, fee) {
  const n = prices.length;
  const memo = Array.from({ length: n }, () => [undefined, undefined]);
  function best(i, holding) {
    if (i === n) return 0;
    if (memo[i][holding] !== undefined) return memo[i][holding];
    let r = best(i + 1, holding);                                  // wait
    if (holding) r = Math.max(r, prices[i] - fee + best(i + 1, 0)); // sell
    else r = Math.max(r, -prices[i] + best(i + 1, 1));              // buy
    return (memo[i][holding] = r);
  }
  return best(0, 0);
}`,
    complexity: 'O(n) time, O(n) space (recursion depth n — fine for small n)',
  },
  mistakes: [
    'Using the no-fee greedy (sum of rises) — pays the fee on every tiny rise.',
    'Charging the fee on both buy and sell.',
    'Initialising hold = 0 (a free share).',
  ],
};
