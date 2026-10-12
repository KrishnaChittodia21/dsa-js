export default {
  id: 'brick-wall',
  title: 'Brick Wall',
  difficulty: 'Medium',
  order: 5,
  pattern: 'hash-frequency-map',
  tags: ['array', 'hash map', 'frequency'],
  source: { platform: 'LeetCode', number: 554, url: 'https://leetcode.com/problems/brick-wall/' },

  statement: `A wall is made of rows of bricks. \`wall[i]\` lists the widths of the bricks in row \`i\` from left to right; every row has the same total width.

Draw a **vertical line** from top to bottom. Wherever the line passes through the middle of a brick, it crosses that brick; passing exactly along an edge between two bricks does not count. The line may not be drawn along the two outer edges of the wall.

Return the **minimum number of bricks** the line must cross.`,
  examples: [
    { input: 'wall = [[1,2,2,1],[3,1,2],[1,3,2],[2,4],[3,1,2],[1,3,1,1]]', output: '2', explanation: 'At x = 4, four of the six rows have an edge, so only 2 bricks are crossed.' },
    { input: 'wall = [[1],[1],[1]]', output: '3', explanation: 'No inner edges exist; the line crosses every row.' },
  ],
  constraints: ['1 <= wall.length <= 10^4', '1 <= wall[i].length <= 10^4', '1 <= sum of all wall[i].length <= 2 * 10^4', 'Row widths are equal and at most 2^31 − 1'],

  think: `- Crossing the fewest bricks is the same as passing through the most... what?
- Where exactly are the edges of a row?
- Width can be huge (2³¹), so you cannot loop over every x. What can you loop over instead?`,
  patternChallenge: {
    options: ['Prefix positions + Frequency Map', 'Binary Search on x', 'Sliding Window', 'Dynamic Programming'],
    answer: 0,
    explanation: 'Count, for each x, how many rows have an edge there (running prefix sums of brick widths). The best x is the most frequent edge position. Width is too large to scan x directly.',
  },
  hints: ['The edges of a row are its running sums, excluding the final one (the right wall).', 'Answer = number of rows − (maximum edge count over all positions).'],
  approach: `**Brute force:** try every x from 1 to width − 1 and count crossed bricks → O(width · rows) — impossible for width ~2³¹.

**Optimized:** for each row, walk its bricks except the last, accumulating \`pos += width\`; do \`freq[pos]++\`. The line at the most common position avoids the most bricks. Answer = rows − maxFreq (maxFreq = 0 when no inner edges exist). O(total bricks) time.`,

  functionName: 'leastBricks',
  paramNames: ['wall'],
  starterCode: `/**
 * @param {number[][]} wall
 * @return {number}
 */
function leastBricks(wall) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the problem statement: the best line passes through 4 edges and crosses 2 bricks.', args: [[[1, 2, 2, 1], [3, 1, 2], [1, 3, 2], [2, 4], [3, 1, 2], [1, 3, 1, 1]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Every row is one brick: no inner edges, so the line crosses every row. Counting the right outer edge would wrongly give 0.', args: [[[1], [1], [1]]], expected: 3 },
    { scenario: 'Single brick', hint: 'Smallest wall: one row, one brick — the line must cross it.', args: [[[5]]], expected: 1 },
    { scenario: 'Single row, many bricks', hint: 'One row with inner edges: the line can pass between bricks and cross nothing.', args: [[[1, 2, 3]]], expected: 0 },
    { scenario: 'Identical rows', hint: 'All rows share the same edges, so the line crosses 0 bricks.', args: [[[2, 1, 3], [2, 1, 3], [2, 1, 3]]], expected: 0 },
    { scenario: 'Outer edge must not count', hint: 'Counting the right outer edge (present in every row) makes the answer 0; only inner edges are allowed.', args: [[[1, 1], [2], [1, 1]]], expected: 1 },
    { scenario: 'Answer is rows − maxEdges', hint: 'Returning maxEdges instead of rows − maxEdges gives 3 here instead of 1.', args: [[[1, 2, 3], [3, 3], [2, 4], [1, 5]]], expected: 2 },
    { scenario: 'Huge widths', hint: 'Widths can be 2³¹ − 1 — looping over every x from 1 to width is far too slow; only visit brick edges.', args: [[[2147483647], [2147483647]]], expected: 2 },
    { scenario: 'Huge bricks sharing an edge', hint: 'Edge positions near 2³¹ are fine as Map keys; both rows have an edge at 10^9.', args: [[[1000000000, 1000000000], [1000000000, 600000000, 400000000], [1, 1999999999]]], expected: 1 },
    { scenario: 'Different row lengths', hint: 'Rows have different numbers of bricks but the same total width.', args: [[[1, 2, 3], [3, 3], [2, 4], [6]]], expected: 2 },
    { scenario: 'Many single-brick rows', hint: '10⁴ rows of one brick each: no inner edges anywhere, so every row is crossed.', argsGen: '() => [Array.from({ length: 10000 }, () => [7])]', expected: 10000 },
    { scenario: 'Large wall (2·10^4 bricks)', hint: 'Scanning every x position up to the width (≈ 2³¹) is hopeless; a Map of edge positions is O(total bricks).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => { const a = ((i * 7919) % 1000) + 1; return [a, 2147483647 - a]; })]', expected: 9990, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function leastBricks(wall) {
  const edges = new Map();          // x position → rows with an edge there
  let maxEdges = 0;
  for (const row of wall) {
    let pos = 0;
    for (let i = 0; i < row.length - 1; i++) {   // skip the last brick (outer edge)
      pos += row[i];
      const c = (edges.get(pos) ?? 0) + 1;
      edges.set(pos, c);
      maxEdges = Math.max(maxEdges, c);
    }
  }
  return wall.length - maxEdges;
}`,
  },
  dryRun: {
    columns: ['row', 'inner edges', 'counts after'],
    rows: [['[1,2,2,1]', '1, 3, 5', '{1:1, 3:1, 5:1}'], ['[3,1,2]', '3, 4', '{…, 3:2, 4:1}'], ['[1,3,2]', '1, 4', '{1:2, 4:2, …}'], ['[2,4]', '2', '{…, 2:1}'], ['[3,1,2]', '3, 4', '{3:3, 4:3}'], ['[1,3,1,1]', '1, 4, 5', '{4:4, …} → max 4 → 6 − 4 = 2']],
  },
  complexity: { time: 'O(B)', space: 'O(B)', explanation: 'B = total number of bricks; each brick is processed once; at most B distinct positions.' },
  alternative: {
    title: 'Collect all positions, sort, count runs',
    md: 'Gather every inner edge position, sort, and find the longest run of equal values. O(B log B) time.',
    complexity: 'O(B log B) time, O(B) space',
  },
  mistakes: ['Counting the right outer edge (every row has it — the answer would wrongly become 0)', 'Looping over x from 1 to width (width can be 2³¹)', 'Returning maxEdges instead of rows − maxEdges'],
};
