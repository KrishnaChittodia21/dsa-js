export default {
  id: 'can-place-flowers',
  title: 'Can Place Flowers',
  difficulty: 'Easy',
  order: 4,
  pattern: 'greedy-local-constraints',
  tags: ['array', 'greedy'],
  source: { platform: 'LeetCode', number: 605, url: 'https://leetcode.com/problems/can-place-flowers/' },

  statement: `A flowerbed is an array of \`0\` (empty plot) and \`1\` (planted plot). Flowers may **not** be planted in adjacent plots. The input never already contains two adjacent \`1\`s.

Given \`flowerbed\` and an integer \`n\`, return \`true\` if you can plant \`n\` new flowers without breaking the rule.`,
  examples: [
    { input: 'flowerbed = [1,0,0,0,1], n = 1', output: 'true', explanation: 'Plant at index 2.' },
    { input: 'flowerbed = [1,0,0,0,1], n = 2', output: 'false' },
  ],
  constraints: ['1 <= flowerbed.length <= 2 * 10^4', 'flowerbed[i] is 0 or 1', 'no two adjacent flowers in the input', '0 <= n <= flowerbed.length'],

  think: `- Scanning left to right, if a plot and both its neighbours are empty, should you plant there right away or wait?
- Can planting earlier ever block a better option later?
- How do you treat the two ends of the array?`,
  patternChallenge: {
    options: ['Dynamic Programming', 'Two Pointers', 'Greedy — Local Rules & Two Passes', 'Sliding Window — Fixed Size'],
    answer: 2,
    explanation: 'Each decision only depends on the neighbours. Planting at the leftmost possible spot is always safe: it only blocks the next plot, which any alternative would also have to leave empty or trade one-for-one.',
  },
  hints: [
    'Treat the positions just outside the array as empty.',
    'Plant whenever `bed[i-1]`, `bed[i]` and `bed[i+1]` are all empty; mark it planted so the next check sees it.',
  ],
  approach: `**Brute force:** try every subset of empty plots (exponential).

**Greedy:** scan left to right; plant at i if i and both neighbours are empty (out-of-range counts as empty). Count plantings and stop early once you reach n.

**Why leftmost is safe (exchange):** take any optimal planting. Its leftmost new flower is at some j ≥ i (the first plantable spot). Move it to i: plot i has empty neighbours in the original bed, and every other new flower sits at j + 2 or later, which is ≥ i + 2, so nothing becomes adjacent. The count is unchanged, so planting at i is part of some optimal solution.`,

  functionName: 'canPlaceFlowers',
  paramNames: ['flowerbed', 'n'],
  starterCode: `/**
 * @param {number[]} flowerbed
 * @param {number} n
 * @return {boolean}
 */
function canPlaceFlowers(flowerbed, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Only index 2 has two empty neighbours.', args: [[1, 0, 0, 0, 1], 1], expected: true },
    { scenario: 'Example 2', hint: 'After planting at index 2 there is no room for a second flower.', args: [[1, 0, 0, 0, 1], 2], expected: false },
    { scenario: 'Single empty plot', hint: 'With one plot, both "neighbours" are outside the array and count as empty.', args: [[0], 1], expected: true },
    { scenario: 'Single planted plot', hint: 'The only plot is taken, so one more flower cannot fit.', args: [[1], 1], expected: false },
    { scenario: 'Zero flowers requested', hint: 'n = 0 is always achievable, even when the bed is full.', args: [[1, 0, 1], 0], expected: true },
    { scenario: 'Plant at the left edge', hint: 'Index −1 counts as empty: index 0 is plantable when index 1 is empty. Mishandling the ends misses it.', args: [[0, 0, 1, 0, 1], 1], expected: true },
    { scenario: 'Plant at the right edge', hint: 'Index length counts as empty: the last plot is plantable when the one before it is empty.', args: [[1, 0, 1, 0, 0], 1], expected: true },
    { scenario: 'Must mark planted plots', hint: 'If you do not write a 1 after planting, index 1 still sees an empty left neighbour and you count all 3 plots of [0,0,0] and wrongly return true.', args: [[0, 0, 0], 3], expected: false },
    { scenario: 'All empty, exact capacity', hint: 'Five empty plots hold flowers at 0, 2, 4 — exactly 3.', args: [[0, 0, 0, 0, 0], 3], expected: true },
    { scenario: 'All empty, one too many', hint: 'Five empty plots cannot hold 4 non-adjacent flowers.', args: [[0, 0, 0, 0, 0], 4], expected: false },
    { scenario: 'Alternating, no room', hint: 'Every empty plot sits between two flowers, so nothing can be planted.', args: [[1, 0, 1, 0, 1, 0, 1], 1], expected: false },
    { scenario: 'Gaps on both ends', hint: 'Both ends have a two-plot gap that holds one flower each.', args: [[0, 0, 1, 0, 0], 2], expected: true },
    { scenario: 'Even-length empty bed', hint: 'Four empty plots hold only 2 flowers (0 and 2, or 0 and 3).', args: [[0, 0, 0, 0], 3], expected: false },
    { scenario: 'Large bed (n = 2·10^4)', hint: 'An all-empty bed of 20000 plots holds exactly 10000 flowers; one linear pass is enough.', argsGen: '() => [new Array(20000).fill(0), 10000]', expected: true },
    { scenario: 'Large bed, one too many', hint: 'The same bed cannot fit 10001 flowers — make sure your count is exact, not off by one.', argsGen: '() => [new Array(20000).fill(0), 10001]', expected: false },
  ],

  solution: {
    code: `function canPlaceFlowers(flowerbed, n) {
  const bed = [...flowerbed];   // do not mutate the caller's array
  let planted = 0;
  for (let i = 0; i < bed.length && planted < n; i++) {
    const leftEmpty = i === 0 || bed[i - 1] === 0;
    const rightEmpty = i === bed.length - 1 || bed[i + 1] === 0;
    if (bed[i] === 0 && leftEmpty && rightEmpty) {
      bed[i] = 1;               // plant as early as possible
      planted++;
    }
  }
  return planted >= n;
}`,
  },
  dryRun: {
    columns: ['i', 'left', 'bed[i]', 'right', 'plant?', 'planted'],
    rows: [
      ['0', 'edge', '0', '0', 'yes', '1'],
      ['1', '1', '0', '1', 'no', '1'],
      ['2', '0', '1', '0', 'no', '1'],
      ['3', '1', '0', '0', 'no', '1'],
      ['4', '0', '0', 'edge', 'yes', '2'],
    ],
    note: 'flowerbed = [0,0,1,0,0], n = 2 → true.',
  },
  complexity: { time: 'O(n)', space: 'O(n) for the copy (O(1) if mutation is allowed)', explanation: 'One pass.' },
  alternative: {
    title: 'Count runs of zeros',
    md: 'A run of z empty plots between two flowers can hold `floor((z - 1) / 2)` flowers; runs touching an edge behave as if padded with one extra zero. Pad the array with a 0 on both sides and sum `floor((z - 1) / 2)` over runs.',
    code: `function canPlaceFlowers(flowerbed, n) {
  const bed = [0, ...flowerbed, 0];
  let run = 0, total = 0;
  for (const x of bed) {
    if (x === 0) run++;
    else { total += Math.floor((run - 1) / 2); run = 0; }
  }
  total += Math.floor((run - 1) / 2);
  return total >= n;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Not updating the array after planting — the next position would still see an empty left neighbour.',
    'Mishandling the ends (index −1 and index length are treated as empty).',
    'Forgetting that n = 0 is always true.',
  ],
};
