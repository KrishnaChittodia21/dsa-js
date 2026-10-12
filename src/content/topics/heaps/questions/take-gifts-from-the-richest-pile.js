export default {
  id: 'take-gifts-from-the-richest-pile',
  title: 'Take Gifts From the Richest Pile',
  difficulty: 'Easy',
  order: 4,
  pattern: 'heap-greedy-scheduling',
  tags: ['heap', 'simulation'],
  source: { platform: 'LeetCode', number: 2558, url: 'https://leetcode.com/problems/take-gifts-from-the-richest-pile/' },

  statement: `\`gifts[i]\` is the number of gifts in pile \`i\`. Every second, for \`k\` seconds:

1. choose the pile with the **most** gifts (any one if tied);
2. leave \`Math.floor(Math.sqrt(size))\` gifts in it and take the rest.

Return the total number of gifts **remaining** in all piles after \`k\` seconds.`,
  examples: [
    { input: 'gifts = [25,64,9,4,100], k = 4', output: '29', explanation: '100 → 10, 64 → 8, 25 → 5, 10 → 3. Piles: [5,8,9,4,3] → 29.' },
    { input: 'gifts = [1,1,1,1], k = 4', output: '4', explanation: 'floor(sqrt(1)) = 1, nothing changes.' },
  ],
  constraints: ['1 <= gifts.length <= 10^3', '1 <= gifts[i] <= 10^9', '1 <= k <= 10^3'],

  think: `- Each second changes exactly one pile. What structure hands you the maximum repeatedly while values change?
- Does it matter which pile you choose when two are tied?`,
  patternChallenge: {
    options: ['Heap — Greedy Simulation & Scheduling', 'Binary Search', 'Prefix Sum', 'Heap — K-way Merge'],
    answer: 0,
    explanation: 'Pop the maximum, modify it, push it back — k times. That is the pop-modify-push simulation. There is no sorted-source merging and no search over answers.',
  },
  hints: [
    'Max-heap of pile sizes.',
    'k times: pop the top, push Math.floor(Math.sqrt(top)). Finally sum the heap.',
  ],
  approach: `**Brute force:** scan for the max each second → O(k · n) — fine for these limits but does not scale.

**Heap:** max-heap of sizes; each second is pop + push = O(log n). Total O(n + k log n) with heapify, or O(n log n + k log n) pushing one by one.`,

  functionName: 'pickGifts',
  paramNames: ['gifts', 'k'],
  starterCode: `/**
 * @param {number[]} gifts
 * @param {number} k
 * @return {number}
 */
function pickGifts(gifts, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Basic case: always shrink the current richest pile; the answer is what REMAINS.', args: [[25, 64, 9, 4, 100], 4], expected: 29 },
    { scenario: 'Example 2', hint: 'All piles of 1: sqrt(1) = 1, so nothing changes.', args: [[1, 1, 1, 1], 4], expected: 4 },
    { scenario: 'Single pile, one second', hint: 'n = 1: floor(sqrt(100)) = 10 gifts remain.', args: [[100], 1], expected: 10 },
    { scenario: 'Single pile, many seconds', hint: 'The same pile shrinks repeatedly: 100 → 10 → 3 → 1.', args: [[100], 3], expected: 1 },
    { scenario: 'Floor, not round', hint: 'sqrt(8) ≈ 2.83 must become 2; Math.round gives 3.', args: [[8], 1], expected: 2 },
    { scenario: 'No fractional gifts', hint: 'Pushing Math.sqrt(x) without flooring leaves fractions in the sum.', args: [[2, 3], 5], expected: 2 },
    { scenario: 'Remaining, not taken', hint: 'Return the gifts left (13), not the gifts taken.', args: [[49, 36], 2], expected: 13 },
    { scenario: 'Maximum pile', hint: 'A pile of 10^9: floor(sqrt(10^9)) = 31622.', args: [[1000000000], 1], expected: 31622 },
    { scenario: 'Richest pile changes', hint: 'After shrinking 81 to 9, the 50 becomes the richest.', args: [[81, 50, 2], 3], expected: 12 },
    { scenario: 'k larger than needed', hint: 'Once every pile is 1, more seconds change nothing.', args: [[4, 9, 16], 20], expected: 3 },
    { scenario: 'Large input (n = k = 1000)', hint: '1000 piles near 10^9 and 1000 seconds: the sum is up to 10^12 — still exact in JS numbers.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => 1000000000 - i * 997), 1000]', expected: 31614406 },
  ],

  solution: {
    code: `function pickGifts(gifts, k) {
  const heap = new MaxHeap();
  for (const g of gifts) heap.push(g);
  for (let t = 0; t < k; t++) {
    const top = heap.pop();
    heap.push(Math.floor(Math.sqrt(top))); // leave floor(sqrt) gifts in the pile
  }
  let total = 0;
  for (const g of heap.toArray()) total += g;
  return total;
}`,
    explanation: 'Values up to 10⁹ fit easily in a JS number; the sum is at most 10¹² — still exact (< 2⁵³).',
  },
  dryRun: {
    columns: ['second', 'pop', 'push', 'piles'],
    rows: [['1', '100', '10', '[25,64,9,4,10]'], ['2', '64', '8', '[25,8,9,4,10]'], ['3', '25', '5', '[5,8,9,4,10]'], ['4', '10', '3', '[5,8,9,4,3] → 29']],
  },
  complexity: { time: 'O((n + k) log n)', space: 'O(n)', explanation: 'n pushes to build, then k pop/push pairs.' },
  alternative: {
    title: 'Linear scan per second',
    md: 'Find the max index with a loop each second and update in place: O(k · n) time, O(1) space. Acceptable for n, k ≤ 1000.',
    complexity: 'O(k · n) time, O(1) space',
  },
  mistakes: [
    'Returning the gifts taken instead of the gifts remaining.',
    'Using Math.round instead of Math.floor.',
    'Pushing Math.sqrt(top) without flooring, so fractional gifts accumulate in the sum.',
  ],
};
