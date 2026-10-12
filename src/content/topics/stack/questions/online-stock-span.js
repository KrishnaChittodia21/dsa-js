// 10^4 mostly rising prices with noise (spans reach thousands); expected spans by walking back from each day.
const bigSpanOps = () => {
  let s = 19; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const ops = ['StockSpanner'], args = [[]], expected = [null], ps = [];
  for (let i = 0; i < 10000; i++) {
    const p = 1 + Math.floor(i * 9.9) + rnd(50);
    ps.push(p);
    let j = i;
    while (j > 0 && ps[j - 1] <= p) j--;
    ops.push('next'); args.push([p]); expected.push(i - j + 1);
  }
  return { ops, args, expected };
};

export default {
  id: 'online-stock-span',
  title: 'Online Stock Span',
  difficulty: 'Medium',
  order: 5,
  pattern: 'monotonic-stack-next-greater',
  kind: 'design',
  tags: ['stack', 'monotonic stack', 'design', 'data stream'],
  source: { platform: 'LeetCode', number: 901, url: 'https://leetcode.com/problems/online-stock-span/' },

  statement: `Prices of a stock arrive one day at a time. For each new price, report its **span**: the number of consecutive days, ending today and going backwards, on which the price was **less than or equal to** today's price (today counts).

Implement \`StockSpanner\` with \`next(price)\` returning today's span.`,
  examples: [
    { input: '["StockSpanner","next","next","next","next","next","next","next"]\n[[],[100],[80],[60],[70],[60],[75],[85]]', output: '[null,1,1,1,2,1,4,6]', explanation: 'For 75: the run 75, 60, 70, 60 is ≤ 75 → span 4 (80 stops it).' },
  ],
  constraints: ['1 <= price <= 10^5', 'At most 10^4 calls to next'],

  think: `- The span ends at the **previous greater** price. Which structure finds "previous greater" quickly?
- Once today's price is at least as big as an earlier price, will that earlier price ever block a future span?
- Instead of forgetting popped days, can you fold their spans into today's?`,
  patternChallenge: {
    options: ['Queue of all prices', 'Monotonic stack of (price, span) pairs', 'Binary search over prices', 'Prefix sums'],
    answer: 1,
    explanation: 'The span stops at the previous strictly greater price — a previous-greater query on a stream. A decreasing stack keeps only prices that can still block; popped prices are absorbed into today\'s span.',
  },
  hints: [
    'Keep a stack of [price, span] with prices strictly decreasing from bottom to top.',
    'For a new price, span = 1; while top price <= price, add its span and pop. Push [price, span].',
  ],
  approach: `**Brute force:** store all prices and walk backwards each day → O(n) per call, O(n²) total.

**Monotonic stack (amortized O(1)):** a price p that is ≤ today's price is "covered" by today: any future day that reaches back to p must first pass today (which is ≥ p). So pop p and add its span to today's. The stack stays strictly decreasing; each day is pushed and popped once.`,

  className: 'StockSpanner',
  starterCode: `class StockSpanner {
  constructor() {
    
  }

  /**
   * @param {number} price
   * @return {number}
   */
  next(price) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'For 75 the run 75, 60, 70, 60 is ≤ 75 → span 4; 80 stops it.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [100], [80], [60], [70], [60], [75], [85]], expected: [null, 1, 1, 1, 2, 1, 4, 6] },
    { scenario: 'Single price', hint: 'Today always counts, so the first span is 1.', ops: ['StockSpanner', 'next'], args: [[], [5]], expected: [null, 1] },
    { scenario: 'Increasing prices', hint: 'Each day covers every previous day — the popped spans must be added, not just counted.', ops: ['StockSpanner', 'next', 'next', 'next', 'next'], args: [[], [1], [2], [3], [4]], expected: [null, 1, 2, 3, 4] },
    { scenario: 'Decreasing prices', hint: 'Every price is lower than yesterday — each span is 1.', ops: ['StockSpanner', 'next', 'next', 'next', 'next'], args: [[], [4], [3], [2], [1]], expected: [null, 1, 1, 1, 1] },
    { scenario: 'Equal prices', hint: 'Equal prices belong to the span (≤, not <).', ops: ['StockSpanner', 'next', 'next', 'next'], args: [[], [7], [7], [7]], expected: [null, 1, 2, 3] },
    { scenario: 'Drop at the end', hint: 'A lower price after a long rising run has span 1.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [31], [41], [48], [59], [79], [30]], expected: [null, 1, 2, 3, 4, 5, 1] },
    { scenario: 'Popped spans accumulate', hint: '90 absorbs 80 (which already covered 3 days) — adding 1 per pop instead of the popped span gives too little.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [50], [60], [70], [80], [40], [90]], expected: [null, 1, 2, 3, 4, 1, 6] },
    { scenario: 'Price bounds', hint: 'Prices 1 and 10^5.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next'], args: [[], [1], [100000], [1], [1], [100000]], expected: [null, 1, 2, 1, 2, 5] },
    { scenario: 'Valley and recovery', hint: 'Prices dip and recover; each new high covers the whole valley.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [10], [4], [5], [90], [120], [80], [60], [80], [120]], expected: [null, 1, 1, 2, 4, 5, 1, 1, 3, 9] },
    { scenario: 'Equal after a dip', hint: 'An equal earlier price is included and its span counts too.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [5], [3], [5], [5], [2], [5]], expected: [null, 1, 1, 3, 4, 1, 6] },
    { scenario: 'Long random sequence', hint: 'Many calls with small prices and lots of ties.', ops: ['StockSpanner', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next', 'next'], args: [[], [1], [5], [1], [1], [5], [3], [9], [9], [1], [5], [1], [1], [1], [9], [1], [1], [7], [1], [7], [9], [9], [3], [9], [3], [1], [7], [1], [3], [3], [5], [7], [9], [3], [5], [9], [5], [7], [9], [3], [5], [9], [5], [5], [5], [1], [5], [1], [5], [9], [3], [7], [9], [9], [3], [9], [1], [9], [3], [7], [5]], expected: [null, 1, 2, 1, 2, 5, 1, 7, 8, 1, 2, 1, 2, 3, 14, 1, 2, 3, 1, 5, 20, 21, 1, 23, 1, 1, 3, 1, 2, 3, 4, 8, 32, 1, 2, 35, 1, 2, 38, 1, 2, 41, 1, 2, 3, 1, 5, 1, 7, 49, 1, 2, 52, 53, 1, 55, 1, 57, 1, 2, 1] },
    { scenario: 'Max calls (10^4 prices)', hint: 'The largest allowed run with mostly rising prices, so spans grow to thousands of days. Popped spans must be added to the current one.', opsGen: String(bigSpanOps) },
  ],
  solution: {
    code: `class StockSpanner {
  constructor() {
    this.st = [];                 // [price, span]; prices strictly decreasing
  }
  next(price) {
    let span = 1;
    while (this.st.length && this.st[this.st.length - 1][0] <= price) {
      span += this.st.pop()[1];   // today covers that day's whole span
    }
    this.st.push([price, span]);
    return span;
  }
}`,
  },
  dryRun: {
    columns: ['price', 'pops (price:span)', 'span', 'stack'],
    rows: [
      ['100', '—', '1', '[100:1]'],
      ['80', '—', '1', '[100:1, 80:1]'],
      ['60', '—', '1', '[…, 80:1, 60:1]'],
      ['70', '60:1', '2', '[100:1, 80:1, 70:2]'],
      ['60', '—', '1', '[…, 70:2, 60:1]'],
      ['75', '60:1, 70:2', '4', '[100:1, 80:1, 75:4]'],
      ['85', '75:4, 80:1', '6', '[100:1, 85:6]'],
    ],
  },
  complexity: { time: 'Amortized O(1) per call', space: 'O(n)', explanation: 'Each day is pushed once and popped at most once.' },
  alternative: {
    title: 'Store indices and look up the previous greater',
    md: 'Keep all prices in an array and a stack of indices; span = today − (index on top after popping ≤ prices), or today + 1 if the stack is empty. Same complexity.',
    complexity: 'Amortized O(1), O(n) space',
  },
  mistakes: [
    'Using < instead of <= — equal prices belong to the span.',
    'Popping without adding the popped span (loses the days it covered).',
  ],
};
