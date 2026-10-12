// ---- large-test generators (deterministic; used by the timed tests below) ----
// 1000 drops: even drops pile up at x = 1 (side 10^6, so the tower grows by 10^6 each time);
// odd drops land on the ground to the right, the first one touching the tower's edge only.
const bigSquaresArgs = () => [Array.from({ length: 1000 }, (_, i) => (i % 2 === 0 ? [1, 1000000] : [1000001 + ((i - 1) / 2) * 2000000, 1000000]))];
const bigSquaresExpected = () => Array.from({ length: 1000 }, (_, i) => (Math.floor(i / 2) + 1) * 1000000);
// ---- end generators ----

export default {
  id: 'falling-squares',
  title: 'Falling Squares',
  difficulty: 'Hard',
  order: 7,
  pattern: 'dynamic-interval-coverage',
  tags: ['array', 'segment tree', 'coordinate compression', 'ordered set'],
  source: { platform: 'LeetCode', number: 699, url: 'https://leetcode.com/problems/falling-squares/' },

  statement: `Squares are dropped one at a time onto the x-axis. \`positions[i] = [left, sideLength]\` means a square whose left edge is at x = \`left\` and whose side is \`sideLength\` falls straight down until it lands on the ground or on top of an earlier square. It sticks where it lands.

A square only lands on something that overlaps it with **positive width** — merely touching at an edge does not count.

After each drop, record the **height of the tallest stack** so far. Return these heights.`,
  examples: [
    { input: 'positions = [[1,2],[2,3],[6,1]]', output: '[2,5,5]', explanation: 'Square 1 covers [1,3) with top at 2. Square 2 covers [2,5), lands on it: top 2 + 3 = 5. Square 3 covers [6,7) on the ground: height 1. Tallest stays 5.' },
    { input: 'positions = [[100,100],[200,100]]', output: '[100,100]', explanation: 'The squares only touch at x = 200, so the second one falls to the ground.' },
  ],
  constraints: ['1 <= positions.length <= 1000 (the segment tree handles 10^5)', '1 <= left <= 10^8', '1 <= sideLength <= 10^6'],

  think: `- A square covering [l, l + s) lands at height = (max height currently on that interval). What are the two operations you need on the x-axis?
- x goes to 10^8 + 10^6. How many distinct edges actually appear?
- After a square lands, every point in its interval has the same new height. Is that ever lower than what was there?`,
  patternChallenge: {
    options: ['Segment tree over compressed coordinates (range max + range raise)', 'Monotonic Stack', 'Sort by left edge then greedy', 'Prefix Sum'],
    answer: 0,
    explanation: 'Each drop needs "max height on [l, r)" and "set heights on [l, r) to h" — range query + range update — on coordinates that must be compressed. Sorting would break the drop order, which matters.',
  },
  hints: [
    'Collect every left and right edge, sort + dedupe, and map them to indices. Cell k represents the gap [xs[k], xs[k+1]); a square covers cells idx(l) … idx(l + s) − 1.',
    'New height h = rangeMax + s is ≥ every height in the range, so the update is "raise to at least h" (chmax). A node tag meaning "every cell here is ≥ tag" works without pushing: query partial nodes as max(tag, children).',
  ],
  approach: `**Brute force (accepted for n ≤ 1000):** keep a list of placed squares [l, r, top]. For a new square, its base is the max top among placed squares that overlap it with positive width (\`a < r && l < b\`). O(n²).

**Optimized — compressed segment tree (O(n log n)):**
1. Coordinates: all \`l\` and \`l + s\`; sort unique → \`xs\`; \`idx\` Map. Cells are the gaps between consecutive coordinates, so half-open edges are handled exactly (touching squares share no cell).
2. Segment tree over cells with \`mx[node]\` (max inside) and \`tag[node]\` (every cell in the node is at least this).
3. For each square: \`base = queryMax(L, R)\`, \`h = base + s\`, \`raise(L, R, h)\`, \`best = max(best, h)\`.
   - raise: \`mx[node] = max(mx[node], h)\` on every visited node; on full cover also \`tag[node] = max(tag[node], h)\` and stop.
   - query: full cover → \`mx[node]\`; partial → \`max(tag[node], left child, right child)\`.

Because updates only ever raise values, tags never need to be pushed down — a neat simplification of lazy propagation.`,

  functionName: 'fallingSquares',
  paramNames: ['positions'],
  starterCode: `/**
 * @param {number[][]} positions
 * @return {number[]}
 */
function fallingSquares(positions) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The second square overlaps the first on [2,3) and lands on it: 2 + 3 = 5.', args: [[[1,2],[2,3],[6,1]]], expected: [2,5,5] },
    { scenario: 'Example 2', hint: 'Squares that only touch at x = 200 do not stack.', args: [[[100,100],[200,100]]], expected: [100,100] },
    { scenario: 'Single square', hint: 'One drop: the answer is its side length.', args: [[[1,5]]], expected: [5] },
    { scenario: 'Same spot stacking', hint: 'Each square lands exactly on the previous one.', args: [[[1,2],[1,2],[1,2]]], expected: [2,4,6] },
    { scenario: 'Edge-touching squares', hint: 'Touching at an edge is not overlap: use l < b && a < r (strict), or half-open cells.', args: [[[1,2],[3,2],[5,2],[2,1]]], expected: [2,2,2,3] },
    { scenario: 'Lands on the taller support', hint: 'The square spans two stacks; it rests on the higher one.', args: [[[1,2],[4,5],[2,3]]], expected: [2,5,8] },
    { scenario: 'Running tallest, not own height', hint: 'Report the tallest stack so far, which can be an earlier square.', args: [[[1,5],[10,1],[20,2]]], expected: [5,5,5] },
    { scenario: 'Wide square over narrow ones', hint: 'A wide square covers several earlier squares; take the max over its whole span.', args: [[[2,1],[4,1],[1,6]]], expected: [1,1,7] },
    { scenario: 'Right edges matter', hint: 'Compress right edges too: the narrow square at x = 9 lies inside the first square only if you know where it ends.', args: [[[1,10],[9,1],[11,3],[10,2]]], expected: [10,11,11,12] },
    { scenario: 'Maximum coordinates', hint: 'left up to 10^8 and side up to 10^6 — never build an array indexed by raw coordinates.', args: [[[100000000,1000000],[1,99999999],[50,2]]], expected: [1000000,99999999,100000001] },
    { scenario: 'Random (n = 40)', hint: 'Pseudo-random drops — compare with the O(n²) "check every placed square" method if this fails.', argsGen: '() => { let s = 41; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0); return [Array.from({ length: 40 }, () => [1 + (rnd() % 1000), 1 + (rnd() % 100)])]; }', expected: [80,80,88,88,88,88,88,88,120,120,124,124,164,182,182,182,182,182,182,182,270,270,270,360,360,360,360,360,390,390,390,390,390,390,450,450,450,450,526,526] },
    { scenario: 'Largest input, huge sides', hint: 'Painting unit cells costs up to 10^6 per square — 10^9 steps. Work with compressed edges (or the list of placed squares).', argsGen: String(bigSquaresArgs), expected: bigSquaresExpected(), timeLimitMs: 1000 },
  ],
  solution: {
    code: `function fallingSquares(positions) {
  // 1. coordinate compression of all edges
  const xs = [...new Set(positions.flatMap(([l, s]) => [l, l + s]))].sort((a, b) => a - b);
  const idx = new Map(xs.map((x, i) => [x, i]));
  const m = xs.length - 1;                 // number of cells [xs[k], xs[k+1])
  const mx = new Array(4 * m).fill(0);     // max height inside the node
  const tag = new Array(4 * m).fill(0);    // every cell of the node is at least this

  const query = (node, lo, hi, l, r) => {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return mx[node];
    const mid = (lo + hi) >> 1;
    return Math.max(tag[node], query(2 * node, lo, mid, l, r), query(2 * node + 1, mid + 1, hi, l, r));
  };
  const raise = (node, lo, hi, l, r, h) => {
    if (r < lo || hi < l) return;
    mx[node] = Math.max(mx[node], h);      // some cell inside now reaches h
    if (l <= lo && hi <= r) { tag[node] = Math.max(tag[node], h); return; }
    const mid = (lo + hi) >> 1;
    raise(2 * node, lo, mid, l, r, h);
    raise(2 * node + 1, mid + 1, hi, l, r, h);
  };

  const res = [];
  let best = 0;
  for (const [left, side] of positions) {
    const L = idx.get(left), R = idx.get(left + side) - 1;  // cells covered by the square
    const h = query(1, 0, m - 1, L, R) + side;
    raise(1, 0, m - 1, L, R, h);
    best = Math.max(best, h);
    res.push(best);
  }
  return res;
}`,
  },
  dryRun: {
    columns: ['square', 'cells (xs = [1,2,3,5,6,7])', 'base = max on cells', 'height', 'best'],
    rows: [
      ['[1,2] → [1,3)', '0..1', '0', '2', '2'],
      ['[2,3] → [2,5)', '1..2', '2 (cell 1 = [2,3) is under square 1)', '5', '5'],
      ['[6,1] → [6,7)', '4..4', '0', '1', '5'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'At most 2n coordinates; each drop does one range query and one range raise on a tree of O(n) nodes.' },
  alternative: {
    title: 'O(n²) list of placed squares',
    md: 'For each new square, scan every earlier square and take the max top among those that overlap with positive width. Simple, and fast enough for the official n ≤ 1000.',
    code: `function fallingSquares(positions) {
  const placed = [];            // [left, right, top]
  const res = [];
  let best = 0;
  for (const [l, s] of positions) {
    const r = l + s;
    let base = 0;
    for (const [a, b, top] of placed) if (a < r && l < b) base = Math.max(base, top);
    placed.push([l, r, base + s]);
    best = Math.max(best, base + s);
    res.push(best);
  }
  return res;
}`,
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Treating edge-touching squares as overlapping (use `a < r && l < b`, or half-open cells after compression).',
    'Compressing only left edges — right edges are needed to know where a square ends.',
    'Mapping a square to cells idx(l)..idx(l + s) inclusive — the last cell starts at l + s and is outside the square.',
    'Returning the height of each square instead of the running tallest stack.',
  ],
};
