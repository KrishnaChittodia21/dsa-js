export default {
  id: 'dungeon-game',
  title: 'Dungeon Game',
  difficulty: 'Hard',
  order: 2,
  pattern: 'dp-2d-grid',
  tags: ['array', 'dynamic programming', 'matrix'],
  source: { platform: 'LeetCode', number: 174, url: 'https://leetcode.com/problems/dungeon-game/' },

  statement: `A knight starts in the top-left room of an \`m × n\` dungeon and must reach the princess in the bottom-right room, moving only **right or down**.

Each room holds an integer: negative = a demon that takes that much health, positive = a potion that restores health, 0 = empty. Both the first and the last room count. If the knight's health ever drops to **0 or below**, he dies.

Return the **minimum initial health** that lets the knight reach the princess.`,
  examples: [
    { input: 'dungeon = [[-2,-3,3],[-5,-10,1],[10,30,-5]]', output: '7', explanation: 'Right → right → down → down: 7 −2 −3 +3 +1 −5 = 1 at the end, never ≤ 0 on the way.' },
    { input: 'dungeon = [[0]]', output: '1' },
  ],
  constraints: ['1 <= m, n <= 200', '-1000 <= dungeon[r][c] <= 1000'],

  think: `- Try a forward DP: "best health when arriving at (r, c)". Why is one number per cell not enough?
- Ask the question backwards: "what health must I have when I ENTER (r, c)?"
- A huge potion later cannot save you from dying earlier. How does that show up in the formula?`,
  patternChallenge: {
    options: ['Forward grid DP (max health so far)', 'Dijkstra from the start', 'Backward grid DP with a max(1, …) clamp', 'Binary search on the answer + BFS'],
    answer: 2,
    explanation: 'The requirement depends on what lies ahead, so fill from the princess back to the start. Forward DP must track two competing quantities (current health and minimum seen). Binary search + a feasibility DP also works but is O(mn log C) — the backward DP is direct.',
  },
  hints: [
    'need[r][c] = minimum health when entering (r, c) to survive to the end. At the goal: max(1, 1 − dungeon[m−1][n−1]).',
    'need[r][c] = max(1, min(need[r+1][c], need[r][c+1]) − dungeon[r][c]). Fill from the bottom-right, with Infinity outside the grid.',
  ],
  approach: `**Why forward fails:** at each cell you would like to maximise the health you arrive with *and* maximise the lowest health you ever had. A path can be better in one and worse in the other, so no single value per cell is correct.

**Backward DP:** let \`need[r][c]\` = minimum health on entering (r, c). After the room you need \`next = min(need below, need right)\`; the room changes health by \`d\`, so you must enter with \`next − d\`, but never less than 1 (you must be alive in the room even if a potion is huge):

\`\`\`text
need[r][c] = max(1, min(need[r+1][c], need[r][c+1]) − dungeon[r][c])
\`\`\`

Fill bottom-to-top, right-to-left (dependencies point down/right). Use one row with a sentinel column of Infinity, and seed the goal with "need 1 after the room".`,

  functionName: 'calculateMinimumHP',
  paramNames: ['dungeon'],
  starterCode: `/**
 * @param {number[][]} dungeon
 * @return {number}
 */
function calculateMinimumHP(dungeon) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: right, right, down, down needs 7 health.', args: [[[-2, -3, 3], [-5, -10, 1], [10, 30, -5]]], expected: 7 },
    { scenario: 'Example 2', hint: 'An empty room still needs 1 health — the knight must be alive.', args: [[[0]]], expected: 1 },
    { scenario: 'All potions', hint: 'Even a single potion room needs 1, not 0 or negative. Forgetting max(1, …) returns a value below 1.', args: [[[100]]], expected: 1 },
    { scenario: 'Single demon room', hint: 'Losing 5 health from the start requires 6.', args: [[[-5]]], expected: 6 },
    { scenario: 'Minimum cell value', hint: 'A −1000 room alone needs 1001 health.', args: [[[-1000]]], expected: 1001 },
    { scenario: 'Demon in the princess room', hint: 'The final cell itself can hurt: you need enough to survive it on arrival.', args: [[[0, 0], [0, -10]]], expected: 11 },
    { scenario: 'Potion after a demon', hint: 'A later potion cannot save you from an earlier demon — clamp to at least 1 at every cell, going backwards.', args: [[[-3, 5]]], expected: 4 },
    { scenario: 'Max-health path is wrong', hint: 'The path that ends with the most health is not the one that needs the least start health. A forward "max remaining health" DP fails here.', args: [[[1, -3, 3], [0, -2, 0], [-3, -3, -3]]], expected: 3 },
    { scenario: 'Single column', hint: 'Only one path: down through every room.', args: [[[2], [1], [-4]]], expected: 2 },
    { scenario: 'Single row', hint: 'Only one path: right through every room; the low point decides.', args: [[[-1, 5, -10, 2]]], expected: 7 },
    { scenario: 'Potions then a demon', hint: 'The early potions are spent by the last room — only the running minimum along the path matters.', args: [[[0, 0, 0], [1, 1, -1]]], expected: 1 },
    { scenario: 'All rooms −1000 (200×200)', hint: 'Every path visits 399 rooms: you need 399·1000 + 1 health.', argsGen: '() => [Array.from({ length: 200 }, () => new Array(200).fill(-1000))]', expected: 399001 },
    { scenario: 'Large input (200×200)', hint: 'Exploring every path is exponential (C(398,199) paths); fill the table backwards in O(m·n).', argsGen: '() => { let x = 5; const r = () => (x = x * 48271 % 2147483647); return [Array.from({ length: 200 }, () => Array.from({ length: 200 }, () => r() % 2001 - 1000))]; }', expected: 68, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function calculateMinimumHP(dungeon) {
  const m = dungeon.length, n = dungeon[0].length;
  const need = new Array(n + 1).fill(Infinity);   // need[c] for the row below; need[n] = sentinel
  need[n - 1] = 1;                                // "below the goal": leave with at least 1
  for (let r = m - 1; r >= 0; r--) {
    for (let c = n - 1; c >= 0; c--) {
      const next = Math.min(need[c] /* below */, need[c + 1] /* right */);
      need[c] = Math.max(1, next - dungeon[r][c]);
    }
    need[n] = Infinity;                           // keep the sentinel
  }
  return need[0];
}`,
    explanation: 'Before the first row is processed, need[n − 1] = 1 acts as the imaginary cell below the goal, so the goal gets max(1, 1 − d).',
  },
  dryRun: {
    columns: ['row r', 'need after row (c = 0..2)'],
    rows: [
      ['2: [10, 30, -5]', '[1, 1, 6]  (goal: 1 + 5 = 6; 30 and 10 clamp to 1)'],
      ['1: [-5, -10, 1]', '[6, 11, 5]  (c=2: 6 − 1; c=1: min(1, 5) + 10; c=0: min(1, 11) + 5)'],
      ['0: [-2, -3, 3]', '[7, 5, 2]  (c=2: 5 − 3; c=1: min(11, 2) + 3; c=0: min(6, 5) + 2)'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(n)', explanation: 'Each room once; one row plus a sentinel.' },
  alternative: {
    title: 'Binary search on the initial health',
    md: 'For a candidate h, a forward DP computes the maximum health on arrival at each cell while staying > 0 (dead cells = −Infinity). Feasibility is monotonic in h, so binary search h over [1, 1 + (m + n − 1) · 1000]. Correct but O(m·n·log H) and more code — the backward DP is the intended solution.',
    complexity: 'O(m·n·log H)',
  },
  mistakes: [
    'Filling forwards.',
    'Forgetting the max(1, …) clamp — potions would allow "negative health needed".',
    'Forgetting that the princess room itself can contain a demon.',
    'Returning 0 when the dungeon is all potions — the knight still needs 1 health.',
  ],
};
