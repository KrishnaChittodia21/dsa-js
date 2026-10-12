export default {
  id: 'two-city-scheduling',
  title: 'Two City Scheduling',
  difficulty: 'Medium',
  order: 6,
  pattern: 'greedy-sort-and-pick',
  tags: ['array', 'greedy', 'sorting'],
  source: { platform: 'LeetCode', number: 1029, url: 'https://leetcode.com/problems/two-city-scheduling/' },

  statement: `A company will interview \`2n\` people. \`costs[i] = [aCost, bCost]\` is the price of flying person \`i\` to city A or to city B.

Exactly \`n\` people must fly to **each** city. Return the **minimum total cost**.`,
  examples: [
    { input: 'costs = [[10,20],[30,200],[400,50],[30,20]]', output: '110', explanation: 'Persons 0 and 1 → A (10 + 30), persons 2 and 3 → B (50 + 20).' },
    { input: 'costs = [[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]]', output: '1859' },
  ],
  constraints: ['2 * n == costs.length', '2 <= costs.length <= 100', '1 <= aCost, bCost <= 1000'],

  think: `- Imagine everyone is booked to B first. How much does it cost (or save) to switch one person to A?
- Which n people should you switch?
- Why does sorting by aCost alone fail?`,
  patternChallenge: {
    options: ['Dynamic Programming (people × count in A)', 'Greedy — Sort, then Pick', 'Heap — Top K', 'Binary Search on Answer'],
    answer: 1,
    explanation: 'A DP over (person, #sent to A) works in O(n²), but sorting by the cost difference gives an O(n log n) greedy with a clean exchange argument. (A heap could also pick the n smallest differences, but it is the same greedy.)',
  },
  hints: [
    'Switching person i from B to A changes the total by aCost − bCost.',
    'Sort by aCost − bCost ascending; send the first n to A and the rest to B.',
  ],
  approach: `**DP:** \`dp[i][j]\` = min cost for the first i people with j of them in A → O(n²).

**Greedy:** start with everyone in B (cost Σ b). Moving person i to A adds \`a_i − b_i\`. We must move exactly n people, so move the n with the smallest (most negative) differences. Equivalently: sort by \`a − b\`, first half to A, second half to B.

**Exchange argument:** if person x (small difference) goes to B and person y (larger difference) goes to A, swapping them changes the cost by (a_x − b_x) − (a_y − b_y) ≤ 0.`,

  functionName: 'twoCitySchedCost',
  paramNames: ['costs'],
  starterCode: `/**
 * @param {number[][]} costs
 * @return {number}
 */
function twoCitySchedCost(costs) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Send the two people with the biggest A-savings to A, the rest to B.', args: [[[10, 20], [30, 200], [400, 50], [30, 20]]], expected: 110 },
    { scenario: 'Example 2', hint: 'Sort by aCost − bCost; the first half flies to A.', args: [[[259, 770], [448, 54], [926, 667], [184, 139], [840, 118], [577, 469]]], expected: 1859 },
    { scenario: 'Example 3', hint: 'Eight people, four to each city.', args: [[[515, 563], [451, 713], [537, 709], [343, 819], [855, 779], [457, 60], [650, 359], [631, 42]]], expected: 3086 },
    { scenario: 'Two people', hint: 'The smallest input: one person per city — try both assignments mentally.', args: [[[1, 2], [3, 4]]], expected: 5 },
    { scenario: 'All costs equal', hint: 'Every assignment costs the same.', args: [[[5, 5], [5, 5]]], expected: 10 },
    { scenario: 'Everyone prefers A', hint: 'Each person is cheaper in A, but exactly half must go to B. Letting everyone pick the cheaper city breaks the "n each" rule.', args: [[[1, 100], [2, 100], [3, 100], [4, 101]]], expected: 204 },
    { scenario: 'Sort by aCost fails', hint: 'Sorting by aCost alone sends the cheap-A but cheaper-B people to A; sort by the difference aCost − bCost.', args: [[[10, 1], [20, 100], [30, 200], [5, 1]]], expected: 52 },
    { scenario: 'Sort by bCost fails', hint: 'Looking at one city\'s price alone ignores how much the other city saves.', args: [[[1, 5], [100, 6], [2, 50], [200, 7]]], expected: 16 },
    { scenario: 'Three prefer A strongly', hint: 'Three people favour A but only two can go; the one with the smallest saving (1 vs 10) is moved to B.', args: [[[1, 10], [1, 11], [1, 12], [50, 1]]], expected: 13 },
    { scenario: 'Equal differences', hint: 'Ties in aCost − bCost can be broken either way; the total is the same.', args: [[[3, 1], [5, 3], [1, 3], [2, 4]]], expected: 7 },
    { scenario: 'Perfectly split preferences', hint: 'Half prefer A and half prefer B — everybody gets their cheaper city.', args: [[[1, 100], [1, 100], [100, 1], [100, 1]]], expected: 4 },
    { scenario: 'Extreme costs', hint: 'Costs at the 1 and 1000 bounds.', args: [[[1000, 1], [1000, 1], [1, 1000], [1000, 1000]]], expected: 1003 },
    { scenario: 'Maximum size (100 people)', hint: 'The largest allowed input: sort by difference once, O(n log n).', argsGen: '() => { let x = 41; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 100 }, () => [1 + r() % 1000, 1 + r() % 1000])]; }', expected: 32973 },
  ],

  solution: {
    code: `function twoCitySchedCost(costs) {
  // Most "A-favoured" people (A much cheaper than B) first.
  const sorted = [...costs].sort((x, y) => (x[0] - x[1]) - (y[0] - y[1]));
  const n = sorted.length / 2;
  let total = 0;
  for (let i = 0; i < sorted.length; i++) {
    total += i < n ? sorted[i][0] : sorted[i][1];
  }
  return total;
}`,
  },
  dryRun: {
    columns: ['person', 'a − b', 'sorted position', 'city', 'cost'],
    rows: [
      ['[30, 200]', '−170', '0', 'A', '30'],
      ['[10, 20]', '−10', '1', 'A', '10'],
      ['[30, 20]', '10', '2', 'B', '20'],
      ['[400, 50]', '350', '3', 'B', '50'],
    ],
    note: 'Total = 110.',
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting a copy of the 2n people.' },
  alternative: {
    title: 'DP over (people, number sent to A)',
    md: '`dp[j]` = min cost so far with j people in A; process people one at a time, iterating j downwards so each person is used once.',
    code: `function twoCitySchedCost(costs) {
  const n = costs.length / 2;
  let dp = new Array(n + 1).fill(Infinity);
  dp[0] = 0;
  costs.forEach(([a, b], i) => {
    const next = new Array(n + 1).fill(Infinity);
    for (let j = 0; j <= Math.min(i, n); j++) {
      if (dp[j] === Infinity) continue;
      if (i - j < n) next[j] = Math.min(next[j], dp[j] + b);   // send to B
      if (j < n) next[j + 1] = Math.min(next[j + 1], dp[j] + a); // send to A
    }
    dp = next;
  });
  return dp[n];
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Sorting by aCost only — ignores how expensive B would be for that person.',
    'Letting each person pick their cheaper city and forgetting the "exactly n each" rule.',
    'Mutating the input array when sorting (use a copy if the caller may reuse it).',
  ],
};
