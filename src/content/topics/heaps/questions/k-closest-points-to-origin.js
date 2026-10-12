export default {
  id: 'k-closest-points-to-origin',
  title: 'K Closest Points to Origin',
  difficulty: 'Medium',
  order: 3,
  pattern: 'heap-top-k',
  tags: ['heap', 'geometry', 'quickselect'],
  source: { platform: 'LeetCode', number: 973, url: 'https://leetcode.com/problems/k-closest-points-to-origin/' },

  statement: `Given an array of points \`points[i] = [x, y]\` and an integer \`k\`, return the \`k\` points closest to the origin \`(0, 0)\` using Euclidean distance. Any order is accepted; the answer is unique.`,
  examples: [
    { input: 'points = [[1,3],[-2,2]], k = 1', output: '[[-2,2]]', explanation: 'Distances² are 10 and 8.' },
    { input: 'points = [[3,3],[5,-1],[-2,4]], k = 2', output: '[[3,3],[-2,4]]' },
  ],
  constraints: ['1 <= k <= points.length <= 10^4', '-10^4 <= x, y <= 10^4'],

  think: `- Do you need the actual square root to compare distances?
- You want the k *smallest* distances. Which heap direction, and what do you evict?`,
  patternChallenge: {
    options: ['Heap — Top K / Kth Element (max-heap of size k)', 'Heap — K-way Merge', 'Two Pointers', 'Binary Search'],
    answer: 0,
    explanation: 'k smallest distances → keep a size-k MAX-heap and evict the farthest. No sorted sources to merge; nothing to binary search.',
  },
  hints: [
    'Compare x² + y² — the square root is monotonic, so it does not change the order.',
    'Max-heap keyed by distance²; push each point, pop when size > k.',
  ],
  approach: `**Brute force:** sort points by x² + y² and take the first k → O(n log n).

**Heap (O(n log k)):** keep the k closest so far in a **max**-heap by distance², so the farthest of them is on top and gets evicted when a closer point arrives.

**Quickselect (O(n) average):** partition by distance around a random pivot until the first k positions hold the k closest.`,

  functionName: 'kClosest',
  paramNames: ['points', 'k'],
  starterCode: `/**
 * @param {number[][]} points
 * @param {number} k
 * @return {number[][]}
 */
function kClosest(points, k) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Compare squared distances: 10 vs 8, so [-2,2] is closer.', args: [[[1,3],[-2,2]],1], expected: [[-2,2]] },
    { scenario: 'Example 2', hint: 'Keep the k closest; [5,-1] (26) is farther than [3,3] (18) and [-2,4] (20).', args: [[[3,3],[5,-1],[-2,4]],2], expected: [[3,3],[-2,4]] },
    { scenario: 'Single point', hint: 'n = k = 1: return the only point.', args: [[[1,1]],1], expected: [[1,1]] },
    { scenario: 'k equals n', hint: 'Every point is returned — nothing should be evicted.', args: [[[0,1],[1,0],[2,2]],3], expected: [[0,1],[1,0],[2,2]] },
    { scenario: 'Origin is a point', hint: 'The point [0,0] has distance 0 and must be included.', args: [[[0,0],[5,5],[1,-1],[-3,0]],3], expected: [[0,0],[1,-1],[-3,0]] },
    { scenario: 'Negative coordinates', hint: 'Squares make signs irrelevant — [-1,-1] is as close as [1,1].', args: [[[-1,-1],[-5,-5],[4,-4],[-2,0]],2], expected: [[-1,-1],[-2,0]] },
    { scenario: 'Extreme coordinates', hint: 'Coordinates at ±10^4: squared distances reach 2·10^8, still exact in JS numbers.', args: [[[10000,10000],[-10000,-9999],[1,2]],1], expected: [[1,2]] },
    { scenario: 'Duplicate points', hint: 'Identical points are separate entries; both copies belong in the answer.', args: [[[2,2],[2,2],[9,9]],2], expected: [[2,2],[2,2]] },
    { scenario: 'Farthest point evicted', hint: 'A min-heap capped at size k evicts the CLOSEST point. Use a max-heap so the farthest kept point is on top.', args: [[[1,1],[10,10],[2,2],[8,8],[3,3]],2], expected: [[1,1],[2,2]] },
    { scenario: 'Nearly equal distances', hint: 'Distances 200000000 vs 200000002 differ by just 2 — compare exact squared integers, not rounded square roots.', args: [[[10000,10000],[9999,10001],[0,9000]],2], expected: [[0,9000],[10000,10000]] },
    { scenario: 'Closest at the end', hint: 'The closest point is last in the input; make sure the final point is considered.', args: [[[7,7],[6,6],[5,5],[0,1]],1], expected: [[0,1]] },
    { scenario: 'Large input (n = 10^4)', hint: 'Maximum size with k = 10: a size-k heap is O(n log k).', argsGen: '() => { let s = 11; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % 20001 - 10000; const p = []; for (let i = 0; i < 10000; i++) p.push([r(), r()]); return [p, 10]; }', expected: [[29,67],[130,55],[144,39],[128,164],[72,-201],[35,-232],[92,238],[-243,117],[-199,-234],[-127,-289]] },
  ],

  solution: {
    code: `function kClosest(points, k) {
  const dist = ([x, y]) => x * x + y * y;       // squared distance, no sqrt needed
  const heap = new MaxHeap(dist);               // farthest of the kept points on top
  for (const p of points) {
    heap.push(p);
    if (heap.size() > k) heap.pop();
  }
  return heap.toArray();
}`,
  },
  dryRun: {
    columns: ['point', 'dist²', 'heap after (k = 2)'],
    rows: [['[3,3]', '18', '{18}'], ['[5,-1]', '26', '{26, 18}'], ['[-2,4]', '20', '{20, 18} (26 evicted)']],
  },
  complexity: { time: 'O(n log k)', space: 'O(k)', explanation: 'Each point is pushed once into a heap of size ≤ k + 1.' },
  alternative: {
    title: 'Sort by distance',
    code: `function kClosest(points, k) {
  return [...points].sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2)).slice(0, k);
}`,
    md: 'Shortest code; O(n log n).',
    complexity: 'O(n log n) time',
  },
  mistakes: [
    'Using a min-heap of size k — it evicts the closest points.',
    'Computing Math.sqrt (slower, and floating-point noise can break ties).',
    'Mutating the input by sorting it in place when the caller still needs it.',
  ],
};
