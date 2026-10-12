export default {
  id: 'capacity-to-ship-packages-within-d-days',
  title: 'Capacity To Ship Packages Within D Days',
  difficulty: 'Medium',
  order: 7,
  pattern: 'binary-search-on-answer',
  tags: ['array', 'binary search on answer', 'greedy'],
  source: { platform: 'LeetCode', number: 1011, url: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/' },

  statement: `Packages on a conveyor belt must be shipped **in the given order** within \`days\` days. \`weights[i]\` is the weight of package i. Each day the ship is loaded with a consecutive run of packages whose total weight must not exceed the ship's capacity.

Return the **smallest capacity** that ships everything within \`days\` days.`,
  examples: [
    { input: 'weights = [1,2,3,4,5,6,7,8,9,10], days = 5', output: '15', explanation: '[1..5] [6,7] [8] [9] [10]' },
    { input: 'weights = [3,2,2,4,1,4], days = 3', output: '6', explanation: '[3,2] [2,4] [1,4]' },
    { input: 'weights = [1,2,3,1,1], days = 4', output: '3', explanation: '[1] [2] [3] [1,1]' },
  ],
  constraints: ['1 <= days <= weights.length <= 5 · 10^4', '1 <= weights[i] <= 500'],

  think: `- Given a fixed capacity, how would you count the days needed? Is greedy safe?
- What is the smallest capacity that could possibly work? The largest one you ever need?
- Is "ships within \`days\`" monotonic in the capacity?`,
  patternChallenge: {
    options: ['Binary Search on the answer + greedy day count', 'Dynamic Programming over partitions', 'Sort weights and pair them', 'Sliding Window'],
    answer: 0,
    explanation: 'A bigger ship can carry any schedule a smaller ship can, so feasibility is monotonic in capacity. For a fixed capacity, greedy "load until the next package would overflow" gives the minimum days. DP works but is O(n² · days); sorting is forbidden by the fixed order.',
  },
  hints: [
    'Range: lo = max(weights) (the heaviest package must fit), hi = sum(weights) (one day).',
    'daysNeeded(cap): walk the weights, start a new day whenever the current load + w > cap. Feasible if daysNeeded ≤ days.',
  ],
  approach: `**Brute force:** try every capacity from max(weights) upward, simulating each — O(n · sum).

**Optimized:** binary search the capacity.
- \`lo = max(weights)\`, \`hi = sum(weights)\` — the answer is always inside.
- \`feasible(cap)\`: greedy — keep adding packages to today's load; when the next one would overflow, start a new day. Greedy is optimal because delaying a package to a later day can never reduce the number of days.
- Boundary search for the first feasible capacity: O(n log(sum)).`,

  functionName: 'shipWithinDays',
  paramNames: ['weights', 'days'],
  starterCode: `/**
 * @param {number[]} weights
 * @param {number} days
 * @return {number}
 */
function shipWithinDays(weights, days) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.', args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], expected: 15 },
    { scenario: 'Example 2', hint: 'Packages ship in the given order; find the smallest capacity that finishes in 3 days.', args: [[3, 2, 2, 4, 1, 4], 3], expected: 6 },
    { scenario: 'Example 3', hint: 'Even with many days the capacity can never be below the heaviest package (3 here).', args: [[1, 2, 3, 1, 1], 4], expected: 3 },
    { scenario: 'Single package', hint: 'One package, one day: the capacity is exactly its weight.', args: [[10], 1], expected: 10 },
    { scenario: 'One day only', hint: 'Everything ships on one day, so the answer is the total weight — your upper bound must reach sum(weights).', args: [[1, 2, 3, 4, 5], 1], expected: 15 },
    { scenario: 'One day per package', hint: 'days === n, so the answer is the heaviest package — your lower bound must be max(weights).', args: [[1, 2, 3, 4, 5], 5], expected: 5 },
    { scenario: 'Heavy packages at both ends', hint: 'The two 500s cannot share a day; the light middle packages ride with one of them.', args: [[500, 1, 1, 1, 500], 2], expected: 502 },
    { scenario: 'Capacity below heaviest package', hint: 'If lo starts at 1, a greedy that opens a new day with an overweight load claims capacity 2 works here. Start lo at max(weights).', args: [[1, 1, 10], 2], expected: 10 },
    { scenario: 'Order must be kept', hint: 'Sorting the weights changes the answer (14 instead of 12). Packages must ship in the given order.', args: [[10, 1, 1, 10, 1, 1], 2], expected: 12 },
    { scenario: 'All weights equal', hint: 'Seven 5s over 3 days: one day must carry three packages, so the answer is 15. Return the capacity, not the number of days.', args: [[5, 5, 5, 5, 5, 5, 5], 3], expected: 15 },
    { scenario: 'Exact fit at boundary', hint: 'At capacity 10 the load hits the limit exactly — use `load + w > cap` (not >=) to decide when to start a new day.', args: [[5, 5, 5, 5], 2], expected: 10 },
    { scenario: 'Large input (n = 5·10^4)', hint: 'Trying every capacity from max(weights) upward is far too slow here; binary search the capacity with a greedy day count.', argsGen: '() => { let s = 7; const w = Array.from({ length: 50000 }, () => { s = (s * 48271) % 2147483647; return (s % 500) + 1; }); return [w, 50]; }', expected: 251250, timeLimitMs: 1000 },
    { scenario: 'Large input, one day', hint: 'The answer is the full sum (~1.25·10^7). A linear capacity scan never gets there in time.', argsGen: '() => { let s = 7; const w = Array.from({ length: 50000 }, () => { s = (s * 48271) % 2147483647; return (s % 500) + 1; }); return [w, 1]; }', expected: 12554167, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function shipWithinDays(weights, days) {
  let lo = 0, hi = 0;
  for (const w of weights) {
    lo = Math.max(lo, w);   // must fit the heaviest package
    hi += w;                // one day for everything
  }

  const daysNeeded = (cap) => {
    let d = 1, load = 0;
    for (const w of weights) {
      if (load + w > cap) { d++; load = 0; }  // start a new day
      load += w;
    }
    return d;
  };

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (daysNeeded(mid) <= days) hi = mid;   // works → try smaller
    else lo = mid + 1;
  }
  return lo;
}`,
  },
  dryRun: {
    columns: ['lo', 'hi', 'mid', 'daysNeeded(mid)', 'decision'],
    rows: [
      ['4', '16', '10', '2', '≤ 3 → hi = 10'],
      ['4', '10', '7', '3', '≤ 3 → hi = 7'],
      ['4', '7', '5', '4', '> 3 → lo = 6'],
      ['6', '7', '6', '3', '≤ 3 → hi = 6'],
      ['6', '6', '—', '—', 'return 6'],
    ],
  },
  complexity: { time: 'O(n log S)', space: 'O(1)', explanation: 'S = sum(weights) − max(weights); each of the ~log S checks is one O(n) greedy pass.' },
  alternative: {
    title: 'DP over split points',
    md: 'dp[d][i] = min possible max-load shipping the first i packages in d days. Correct but O(days · n²) — far too slow for n = 5·10^4.',
    complexity: 'O(days · n²) time, O(days · n) space',
  },
  mistakes: [
    'Starting lo at 1: a capacity below the heaviest package makes the greedy start a "day" with an overweight load and undercount.',
    'Returning the number of days instead of the capacity.',
    'Sorting the weights — the order is fixed.',
  ],
};
