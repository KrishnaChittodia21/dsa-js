export default {
  id: 'maximum-units-on-a-truck',
  title: 'Maximum Units on a Truck',
  difficulty: 'Easy',
  order: 3,
  pattern: 'greedy-sort-and-pick',
  tags: ['array', 'greedy', 'sorting'],
  source: { platform: 'LeetCode', number: 1710, url: 'https://leetcode.com/problems/maximum-units-on-a-truck/' },

  statement: `You load boxes onto a truck. \`boxTypes[i] = [count, unitsPerBox]\` means there are \`count\` boxes of type \`i\`, each containing \`unitsPerBox\` units. The truck can carry at most \`truckSize\` **boxes** (any types).

Return the **maximum total number of units** you can load.`,
  examples: [
    { input: 'boxTypes = [[1,3],[2,2],[3,1]], truckSize = 4', output: '8', explanation: '1 box of 3 units + 2 boxes of 2 units + 1 box of 1 unit = 3 + 4 + 1.' },
    { input: 'boxTypes = [[5,10],[2,5],[4,7],[3,9]], truckSize = 10', output: '91', explanation: '5×10 + 3×9 + 2×7 = 50 + 27 + 14.' },
  ],
  constraints: ['1 <= boxTypes.length <= 1000', '1 <= count, unitsPerBox <= 1000', '1 <= truckSize <= 10^6'],

  think: `- Every box takes exactly one slot on the truck. So what makes one box better than another?
- Is this like 0/1 knapsack? What is different about the "weights" here?`,
  patternChallenge: {
    options: ['0/1 Knapsack DP', 'Greedy — Sort, then Pick', 'Binary Search', 'Heap — Top K'],
    answer: 1,
    explanation: 'All boxes have the same "weight" (one slot), so the knapsack DP collapses: fill each slot with the most valuable box available. Sort by units per box descending.',
  },
  hints: [
    'Sort box types by units per box, largest first.',
    'Take as many boxes of each type as still fit: `min(count, remaining)`.',
  ],
  approach: `**Why greedy works:** each slot is identical. If an optimal load uses a box with fewer units while a box with more units was left behind, swapping them increases (or keeps) the total. So the best load takes the highest-unit boxes first.

Sort by \`unitsPerBox\` descending and fill until the truck is full. (With a counting sort on units ≤ 1000 this is even O(n + 1000).)`,

  functionName: 'maximumUnits',
  paramNames: ['boxTypes', 'truckSize'],
  starterCode: `/**
 * @param {number[][]} boxTypes
 * @param {number} truckSize
 * @return {number}
 */
function maximumUnits(boxTypes, truckSize) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Take the 3-unit box, both 2-unit boxes, and one 1-unit box.', args: [[[1, 3], [2, 2], [3, 1]], 4], expected: 8 },
    { scenario: 'Example 2', hint: 'Fill with 10-unit, then 9-unit, then part of the 7-unit boxes.', args: [[[5, 10], [2, 5], [4, 7], [3, 9]], 10], expected: 91 },
    { scenario: 'Single box, big truck', hint: 'The truck has room to spare — you cannot load more boxes than exist.', args: [[[1, 1]], 5], expected: 1 },
    { scenario: 'Cap at truck size', hint: 'Only 3 of the 10 boxes fit. Forgetting Math.min(count, remaining) loads all 10.', args: [[[10, 1]], 3], expected: 3 },
    { scenario: 'Truck size 1', hint: 'Room for one box: take the single most valuable one.', args: [[[1, 1000], [1000, 1]], 1], expected: 1000 },
    { scenario: 'Sort by units, not count', hint: 'Sorting by box count loads the 5 one-unit boxes first; sort by units per box instead.', args: [[[5, 1], [2, 8]], 5], expected: 19 },
    { scenario: 'Input order is not sorted', hint: 'The best type appears last — sort before filling.', args: [[[3, 1], [2, 2], [1, 9]], 2], expected: 11 },
    { scenario: 'Partial take of last type', hint: 'The final type only partially fits; take exactly what is left.', args: [[[2, 5], [5, 3]], 4], expected: 16 },
    { scenario: 'Ties in units per box', hint: 'Equal unit values: either order gives the same total.', args: [[[3, 5], [3, 5]], 6], expected: 30 },
    { scenario: 'All boxes fit', hint: 'Total boxes are fewer than truckSize, so the answer is every unit.', args: [[[2, 3], [1, 4]], 100], expected: 10 },
    { scenario: 'Many mixed types', hint: 'Several types with repeated unit values.', args: [[[2, 1], [4, 4], [3, 1], [4, 1], [2, 4], [3, 4], [1, 3], [4, 3], [5, 3], [5, 3]], 13], expected: 48 },
    { scenario: 'Maximum counts and units', hint: 'Totals reach 10^6 boxes × 1000 units = 10^9 — still safe as a JS number.', argsGen: '() => [Array.from({ length: 1000 }, () => [1000, 1000]), 1000000]', expected: 1000000000 },
    { scenario: 'Large input (n = 1000)', hint: 'A knapsack DP over truckSize = 10^6 is far too slow; every box takes one slot, so sort by units and fill greedily.', argsGen: '() => { let x = 5; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 1000 }, () => [1 + r() % 1000, 1 + r() % 1000]), 300000]; }', expected: 208352493, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function maximumUnits(boxTypes, truckSize) {
  const types = [...boxTypes].sort((a, b) => b[1] - a[1]); // most units per box first
  let units = 0;
  for (const [count, perBox] of types) {
    if (truckSize === 0) break;
    const take = Math.min(count, truckSize);
    units += take * perBox;
    truckSize -= take;
  }
  return units;
}`,
  },
  dryRun: {
    columns: ['type (count, units)', 'take', 'units', 'truck left'],
    rows: [
      ['[5, 10]', '5', '50', '5'],
      ['[3, 9]', '3', '77', '2'],
      ['[4, 7]', '2', '91', '0'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Sorting a copy of the n box types; the sweep is O(n).' },
  alternative: {
    title: 'Counting sort on units (units ≤ 1000)',
    md: 'Bucket boxes by units per box and walk the buckets from 1000 down to 1.',
    code: `function maximumUnits(boxTypes, truckSize) {
  const bucket = new Array(1001).fill(0);
  for (const [count, perBox] of boxTypes) bucket[perBox] += count;
  let units = 0;
  for (let u = 1000; u >= 1 && truckSize > 0; u--) {
    const take = Math.min(bucket[u], truckSize);
    units += take * u;
    truckSize -= take;
  }
  return units;
}`,
    complexity: 'O(n + U) time, O(U) space (U = 1000)',
  },
  mistakes: [
    'Sorting by count instead of units per box.',
    'Treating it as 0/1 knapsack — unnecessary because every box has the same size.',
    'Forgetting to cap with `Math.min(count, remaining)`.',
  ],
};
