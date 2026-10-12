export default {
  id: 'max-points-on-a-line',
  title: 'Max Points on a Line',
  difficulty: 'Hard',
  order: 1,
  pattern: 'hash-canonical-key',
  tags: ['geometry', 'hash map', 'gcd', 'canonical key'],
  source: { platform: 'LeetCode', number: 149, url: 'https://leetcode.com/problems/max-points-on-a-line/' },

  statement: `You are given an array \`points\` where \`points[i] = [x, y]\` is a point on the plane. All points are **distinct**.

Return the maximum number of points that lie on the **same straight line**.`,
  examples: [
    { input: 'points = [[1,1],[2,2],[3,3]]', output: '3' },
    { input: 'points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]', output: '4', explanation: '(1,4), (2,3), (3,2), (4,1) lie on the line x + y = 5.' },
  ],
  constraints: ['1 <= points.length <= 300', '-10^4 <= x, y <= 10^4', 'All points are unique'],

  think: `- Fix one point A. When are two other points on the same line through A?
- How can a slope be represented EXACTLY, without floating-point error, and with vertical lines included?
- Do different signs like (−1, −2) and (1, 2) describe the same direction?`,
  patternChallenge: {
    options: ['Sorting by x', 'Canonical Keys (normalised slope per anchor)', 'Sliding Window', 'Union-Find'],
    answer: 1,
    explanation: 'For each anchor point, every other point defines a direction. Points sharing a normalised direction (reduced dy/dx with a fixed sign) are on the same line through the anchor — group them with a Map.',
  },
  hints: ['For anchor i, compute dx, dy to every j > i; divide both by gcd(|dx|, |dy|).', 'Fix the sign so that dx > 0, or dx === 0 and dy > 0. Use the string `${dy}/${dx}` as the key; the answer for the anchor is 1 + the largest group.'],
  approach: `**Brute force:** every pair defines a line; count points on it → O(n³) (27·10⁶ for n = 300 — acceptable, but not elegant).

**Optimized:** for each anchor i, a Map from normalised direction → count of points j > i in that direction. Points with the same direction from i are collinear with i. Take \`1 + max count\` per anchor.

Normalisation: \`g = gcd(|dx|, |dy|)\`, divide both; then if \`dx < 0\` (or \`dx === 0 && dy < 0\`) negate both. This gives vertical lines the key "1/0" and horizontal lines "0/1". Integer keys avoid float issues such as 94911150/94911151 vs 94911151/94911152 comparing equal as doubles.`,

  functionName: 'maxPoints',
  paramNames: ['points'],
  starterCode: `/**
 * @param {number[][]} points
 * @return {number}
 */
function maxPoints(points) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Three points on y = x.', args: [[[1, 1], [2, 2], [3, 3]]], expected: 3 },
    { scenario: 'Example 2', hint: 'Four points on x + y = 5 — a negative slope.', args: [[[1, 1], [3, 2], [5, 3], [4, 1], [2, 3], [1, 4]]], expected: 4 },
    { scenario: 'Single point', hint: 'One point lies on a line by itself: 1. Remember to count the anchor.', args: [[[0, 0]]], expected: 1 },
    { scenario: 'Two points', hint: 'Any two points define a line: 2.', args: [[[1, 2], [-3, 7]]], expected: 2 },
    { scenario: 'Vertical line, both sides', hint: 'Anchor in the middle of a vertical line: dy/dx gives Infinity one way and -Infinity the other. Normalise the direction.', args: [[[0, 0], [0, 5], [0, -5], [1, 1]]], expected: 3 },
    { scenario: 'Horizontal line, both sides', hint: 'dy = 0 on both sides of the anchor: (0, 1) and (0, -1) must be the same key.', args: [[[0, 3], [5, 3], [-5, 3], [1, 1]]], expected: 3 },
    { scenario: 'Sign normalisation', hint: 'Directions (1, 2) and (-1, -2) are the same line. Without sign normalisation they become different keys.', args: [[[0, 0], [1, 2], [-1, -2], [5, 0]]], expected: 3 },
    { scenario: 'Reduce by gcd', hint: '(2, 4) and (1, 2) are the same slope — divide by the gcd before using it as a key.', args: [[[0, 0], [1, 2], [2, 4], [3, 6], [1, 0]]], expected: 4 },
    { scenario: 'No three collinear', hint: 'No three points share a line, so the answer is 2.', args: [[[0, 0], [1, 2], [2, 3], [5, 1]]], expected: 2 },
    { scenario: 'Close slopes differ', hint: 'Slopes 9999/10000 and 1 are close but different — exact integer keys keep them apart.', args: [[[0, 0], [10000, 9999], [10000, 10000], [-10000, -10000]]], expected: 3 },
    { scenario: 'Extreme coordinates', hint: 'Corners of the allowed square: the two diagonals each hold two corners plus the origin.', args: [[[-10000, -10000], [10000, 10000], [0, 0], [-10000, 10000], [10000, -10000]]], expected: 3 },
    { scenario: 'Largest n (300)', hint: 'The largest allowed input: 300 points, many on a few lines. O(n²) pairs with gcd keys is fast.', argsGen: '() => { const p = []; for (let i = 0; i < 120; i++) p.push([i, 2 * i - 50]); for (let i = 0; i < 100; i++) p.push([i * 3 + 1, -i]); let s = 97; while (p.length < 300) { s = (s * 48271) % 2147483647; const x = (s % 20001) - 10000; s = (s * 48271) % 2147483647; const y = (s % 20001) - 10000; if (!p.some((q) => q[0] === x && q[1] === y)) p.push([x, y]); } return [p]; }', expected: 120 },
  ],

  solution: {
    code: `function gcd(a, b) {
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function maxPoints(points) {
  const n = points.length;
  if (n <= 2) return n;
  let best = 1;
  for (let i = 0; i < n; i++) {
    const slopes = new Map();                 // normalised direction → count
    let localBest = 0;
    for (let j = i + 1; j < n; j++) {
      let dx = points[j][0] - points[i][0];
      let dy = points[j][1] - points[i][1];
      const g = gcd(Math.abs(dx), Math.abs(dy));
      dx /= g;
      dy /= g;
      if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; } // one sign per direction
      const key = dy + '/' + dx;
      const c = (slopes.get(key) ?? 0) + 1;
      slopes.set(key, c);
      localBest = Math.max(localBest, c);
    }
    best = Math.max(best, localBest + 1);     // + the anchor itself
  }
  return best;
}`,
  },
  dryRun: {
    columns: ['anchor', 'other', 'dx, dy → reduced', 'key', 'count'],
    rows: [
      ['(1,4)', '(2,3)', '1, −1 → 1, −1', '-1/1', '1'],
      ['(1,4)', '(3,2)', '2, −2 → 1, −1', '-1/1', '2'],
      ['(1,4)', '(4,1)', '3, −3 → 1, −1', '-1/1', '3 → 3 + 1 = 4 points'],
    ],
  },
  complexity: { time: 'O(n² log C)', space: 'O(n)', explanation: 'n²/2 pairs, each with a gcd on coordinates up to C = 2·10⁴; one map of ≤ n keys per anchor.' },
  alternative: {
    title: 'Cross-product check for every pair (O(n³))',
    md: 'For each pair (i, j) count every k with (xj − xi)(yk − yi) === (yj − yi)(xk − xi). Exact integer arithmetic, no hashing, O(n³) — fine for n = 300 but slower.',
    complexity: 'O(n³) time, O(1) space',
  },
  mistakes: ['Using floating-point slopes as keys', 'Not normalising the sign ((1,2) and (−1,−2) become different keys)', 'Special-casing vertical lines with Infinity but forgetting −Infinity', 'Forgetting to add 1 for the anchor point'],
};
