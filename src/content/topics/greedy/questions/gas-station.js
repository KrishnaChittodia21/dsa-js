export default {
  id: 'gas-station',
  title: 'Gas Station',
  difficulty: 'Medium',
  order: 3,
  pattern: 'greedy-reach-frontier',
  tags: ['array', 'greedy'],
  source: { platform: 'LeetCode', number: 134, url: 'https://leetcode.com/problems/gas-station/' },

  statement: `There are \`n\` gas stations on a **circular** road. Station \`i\` gives you \`gas[i]\` units of fuel, and driving from station \`i\` to station \`i + 1\` (wrapping around) costs \`cost[i]\` units. Your tank is unlimited and starts empty.

Return the index of the station where you can start and drive one full lap clockwise, or \`-1\` if it is impossible. If a solution exists it is **unique**.`,
  examples: [
    { input: 'gas = [1,2,3,4,5], cost = [3,4,5,1,2]', output: '3', explanation: 'Starting at 3: tank 4−1=3, +5−2=6, +1−3=4, +2−4=2, +3−5=0. Full lap.' },
    { input: 'gas = [2,3,4], cost = [3,4,3]', output: '-1', explanation: 'Total gas 9 < total cost 10.' },
  ],
  constraints: ['1 <= n <= 10^5', '0 <= gas[i], cost[i] <= 10^4'],

  think: `- When is the answer definitely -1, whatever the start?
- Starting at s you run out of fuel right after station i. What about starting at any station between s and i?
- How many times do you need to scan the stations?`,
  patternChallenge: {
    options: ['Prefix Sum + Hash Map', 'Greedy — Reach / Frontier Invariant', 'Two Pointers', 'Graph BFS'],
    answer: 1,
    explanation: 'A running balance with reset: one failure rules out a whole block of starts, giving an O(n) sweep. Brute force tries every start (O(n²)).',
  },
  hints: [
    'If sum(gas) < sum(cost), return -1. Otherwise a valid start exists.',
    'Track the tank from the current candidate start. If it goes negative at i, no start in [start, i] can work — set start = i + 1 and reset the tank.',
  ],
  approach: `**Brute force:** simulate a lap from every start — O(n²).

**Greedy:** let \`diff[i] = gas[i] − cost[i]\`.
1. If \`Σ diff < 0\` → -1.
2. Sweep with \`tank\`; when \`tank < 0\` at i, set \`start = i + 1\`, \`tank = 0\`.

**Why skipping is safe:** starting at \`start\`, the partial sum reached every k in (start, i] with tank ≥ 0. Starting at k instead drops that non-negative prefix, so the tank at i would be ≤ the value that already went negative. Every start in [start, i] fails.

**Why the final start works:** the sweep from \`start\` to n − 1 never went negative, and the stations before \`start\` sum to (total − suffix) ≥ −suffix, so the suffix surplus covers them.`,

  functionName: 'canCompleteCircuit',
  paramNames: ['gas', 'cost'],
  starterCode: `/**
 * @param {number[]} gas
 * @param {number[]} cost
 * @return {number}
 */
function canCompleteCircuit(gas, cost) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Start 3 is the only station from which the tank never goes negative.', args: [[1, 2, 3, 4, 5], [3, 4, 5, 1, 2]], expected: 3 },
    { scenario: 'Example 2', hint: 'Total gas 9 < total cost 10 — no start works. Without the global total check the sweep still returns a start.', args: [[2, 3, 4], [3, 4, 3]], expected: -1 },
    { scenario: 'Single station, enough gas', hint: 'With one station you just need gas[0] >= cost[0].', args: [[5], [4]], expected: 0 },
    { scenario: 'Single station, not enough', hint: 'One station whose cost exceeds its gas: return -1.', args: [[4], [5]], expected: -1 },
    { scenario: 'Station with zero gas', hint: 'Station 0 gives no fuel, so the tank goes negative at once; station 1 is the start.', args: [[0, 2], [1, 1]], expected: 1 },
    { scenario: 'Reset start to i + 1', hint: 'When the tank goes negative at i, station i itself is also a bad start. Setting start = i returns 1 here instead of 2.', args: [[5, 1, 1], [1, 6, 0]], expected: 2 },
    { scenario: 'Answer at index 0', hint: 'The very first station works — do not move start unless the tank actually goes negative.', args: [[3, 1, 1], [1, 2, 2]], expected: 0 },
    { scenario: 'Answer at last index', hint: 'Every earlier start fails; the surplus at the last station pays for the wrap-around.', args: [[1, 1, 1, 1, 6], [2, 2, 2, 2, 1]], expected: 4 },
    { scenario: 'Total surplus exactly zero', hint: 'Total gas equals total cost — a lap is still possible (tank ends at exactly 0). Use total >= 0, not > 0.', args: [[1, 2, 3], [2, 3, 1]], expected: 2 },
    { scenario: 'Sweep start but total negative', hint: 'The sweep ends with a candidate start, but the global sum is negative — you must return -1.', args: [[1, 2, 3, 4], [2, 3, 4, 3]], expected: -1 },
    { scenario: 'Maximum gas and cost', hint: 'Values up to 10^4; the surplus logic is the same at scale.', args: [[10000, 0, 0], [0, 5000, 5000]], expected: 0 },
    { scenario: 'Large input (n = 10^5)', hint: 'Simulating a lap from every start is O(n²) here — each of the first 50000 starts drives far before failing. One sweep with a running tank is O(n).', argsGen: '() => { const n = 100000, gas = new Array(n).fill(1), cost = new Array(n).fill(0); for (let i = 50000; i < 50000 + 5; i++) { gas[i] = 0; cost[i] = 10000; } gas[50000 + 5] = 0; cost[50000 + 5] = 1; return [gas, cost]; }', expected: 50006, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function canCompleteCircuit(gas, cost) {
  let total = 0;   // overall surplus: decides if ANY start works
  let tank = 0;    // surplus since the current candidate start
  let start = 0;
  for (let i = 0; i < gas.length; i++) {
    const diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) {        // every start in [start, i] fails
      start = i + 1;
      tank = 0;
    }
  }
  return total >= 0 ? start : -1;
}`,
  },
  dryRun: {
    columns: ['i', 'gas−cost', 'tank', 'start', 'total'],
    rows: [
      ['0', '−2', '−2 → reset', '1', '−2'],
      ['1', '−2', '−2 → reset', '2', '−4'],
      ['2', '−2', '−2 → reset', '3', '−6'],
      ['3', '+3', '3', '3', '−3'],
      ['4', '+3', '6', '3', '0'],
    ],
    note: 'total = 0 ≥ 0 → answer 3.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass, three counters.' },
  alternative: {
    title: 'Start after the minimum prefix sum',
    md: 'Compute prefix sums of diff. The valid start is the index right after the position where the prefix sum is smallest (if the total is ≥ 0). Same argument, phrased with prefix sums.',
    code: `function canCompleteCircuit(gas, cost) {
  let sum = 0, minSum = Infinity, minIdx = -1;
  for (let i = 0; i < gas.length; i++) {
    sum += gas[i] - cost[i];
    if (sum < minSum) { minSum = sum; minIdx = i; }
  }
  if (sum < 0) return -1;
  return (minIdx + 1) % gas.length;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Resetting start to i instead of i + 1.',
    'Forgetting the global total check — the sweep alone may return a start when no lap exists.',
    'Simulating from every start (O(n²) times out for n = 10^5).',
  ],
};
