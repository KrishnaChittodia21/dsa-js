export default {
  id: 'making-a-large-island',
  title: 'Making A Large Island',
  difficulty: 'Hard',
  order: 3,
  pattern: 'grid-component-labeling',
  tags: ['grid', 'dfs', 'connected components', 'hash set'],
  source: { platform: 'LeetCode', number: 827, url: 'https://leetcode.com/problems/making-a-large-island/' },

  statement: `You are given an \`n x n\` binary grid (\`1\` = land, \`0\` = water). You may change **at most one** \`0\` into a \`1\`.

Return the size of the largest island (4-directionally connected land) that can exist after this operation.`,
  examples: [
    { input: 'grid = [[1,0],[0,1]]', output: '3', explanation: 'Flip either 0 to connect the two single cells.' },
    { input: 'grid = [[1,1],[1,0]]', output: '4' },
    { input: 'grid = [[1,1],[1,1]]', output: '4', explanation: 'No 0 to flip; the whole grid is already one island.' },
  ],
  constraints: ['1 <= n <= 500', 'grid[i][j] is 0 or 1'],

  think: `- Flipping each 0 and recounting islands costs O(n²) per flip. What information about the islands could you precompute once?
- A 0 cell may touch the same island from two sides. How do you avoid counting it twice?`,
  patternChallenge: {
    options: ['Try every flip and run DFS each time', 'Dynamic Programming on rows', 'Label islands with ids + sizes, then check each 0', 'Binary Search on the answer'],
    answer: 2,
    explanation: 'Flipping a 0 merges the (distinct) islands around it plus the cell itself. Precomputing each island’s id and size makes every candidate O(1). Re-running DFS per flip is O(n⁴) = 6·10¹⁰ for n = 500.',
  },
  hints: [
    'First pass: give each island an id starting at 2 (so ids never clash with 0/1) by writing the id into its cells; store size[id].',
    'Second pass: for each 0 cell, collect the distinct ids of its 4 neighbours in a Set; candidate = 1 + sum of their sizes. Remember the no-zero case.',
  ],
  approach: `**Brute force:** for every 0, flip it, run a traversal to measure the island, flip it back: O(n⁴).

**Component labeling:**
1. Scan the grid. For each unlabelled land cell, traverse its island, write \`id\` (2, 3, …) into every cell, and store \`size[id]\`. Track the largest existing island as a baseline.
2. For each 0 cell, gather the ids of its up to 4 neighbours in a **Set** (the same island may touch from two sides), and compute \`1 + Σ size[id]\`.
3. Answer = max of baseline and all candidates. If the grid is all land, the baseline \`n²\` is the answer.

The traversal uses an explicit stack: a 500×500 all-land grid would be 250,000 recursion frames deep.`,

  functionName: 'largestIsland',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function largestIsland(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Flipping either 0 joins the two single cells into an island of 3.', args: [[[1,0],[0,1]]], expected: 3 },
    { scenario: 'Example 2', hint: 'Flipping the only 0 completes a 2×2 island.', args: [[[1,1],[1,0]]], expected: 4 },
    { scenario: 'Example 3', hint: 'No 0 to flip: the answer is the whole grid, not 0. Keep the largest existing island as a baseline.', args: [[[1,1],[1,1]]], expected: 4 },
    { scenario: 'Single water cell', hint: 'n = 1 with water: flipping it creates an island of 1.', args: [[[0]]], expected: 1 },
    { scenario: 'Single land cell', hint: 'n = 1 with land and nothing to flip — the answer is 1.', args: [[[1]]], expected: 1 },
    { scenario: 'All water', hint: 'Any flip gives an island of size 1.', args: [[[0,0],[0,0]]], expected: 1 },
    { scenario: 'Flip joins two islands', hint: 'One flip bridges a 2-cell island and a 4-cell island: 2 + 4 + 1 = 7.', args: [[[1,1,0],[0,0,1],[1,1,1]]], expected: 7 },
    { scenario: 'Same island on two sides', hint: 'The ring touches the centre 0 from four sides; adding its size four times gives 33 instead of 9. Deduplicate island ids.', args: [[[1,1,1],[1,0,1],[1,1,1]]], expected: 9 },
    { scenario: 'Diagonal islands only', hint: 'Islands touching the flipped cell only diagonally do not join it.', args: [[[1,0,1],[0,0,0],[1,0,1]]], expected: 3 },
    { scenario: 'Four islands meet', hint: 'The centre 0 touches four different single-cell islands: 1 + 4 = 5.', args: [[[0,1,0],[1,0,1],[0,1,0]]], expected: 5 },
    { scenario: 'Island id vs land marker', hint: 'If the first island gets id 1 it is indistinguishable from unlabelled land and merges with the next one. Start ids at 2.', args: [[[1,0,0,1],[0,0,0,1],[1,1,0,0],[0,0,0,1]]], expected: 4 },
    { scenario: 'Full land 500×500', hint: 'The maximum size with no 0: recursive DFS overflows the stack — use an explicit stack/queue.', argsGen: '() => [Array.from({ length: 500 }, () => new Array(500).fill(1))]', expected: 250000 },
    { scenario: 'Large grid with water walls', hint: 'n = 500 with ~23,000 zeros: flipping each 0 and re-measuring is O(n⁴). Label islands once, then check each 0\'s distinct neighbours.', argsGen: '() => [Array.from({ length: 500 }, (_, r) => Array.from({ length: 500 }, (_, c) => ((r * 7 + c * 3) % 11 === 0 ? 0 : 1)))]', expected: 227274, timeLimitMs: 1500 },
  ],

  solution: {
    code: `function largestIsland(grid) {
  const n = grid.length;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const size = [0, 0];                 // size[id]; ids start at 2
  let best = 0;

  // 1. label every island with an id and remember its size
  let id = 2;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 1) continue;
      let count = 0;
      const stack = [[r, c]];
      grid[r][c] = id;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        count++;
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 1) {
            grid[nr][nc] = id;
            stack.push([nr, nc]);
          }
        }
      }
      size[id++] = count;
      best = Math.max(best, count);    // baseline: no flip needed
    }
  }

  // 2. try flipping each 0: join the DISTINCT neighbouring islands
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] !== 0) continue;
      const ids = new Set();
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] > 1) ids.add(grid[nr][nc]);
      }
      let total = 1;
      for (const k of ids) total += size[k];
      best = Math.max(best, total);
    }
  }
  return best;
}`,
    explanation: 'Ids start at 2 so a labelled cell (≥ 2) is distinguishable from water (0) and unlabelled land (1).',
  },
  dryRun: { columns: ['step', 'detail', 'best'], rows: [['label', '[[1,1,0],[0,0,1],[1,1,1]] → island 2 = {(0,0),(0,1)} size 2; island 3 = {(1,2),(2,0),(2,1),(2,2)} size 4', '4'], ['flip (0,2)', 'neighbours: 2 (left), 3 (below) → 1 + 2 + 4 = 7', '7'], ['flip (1,1)', 'neighbours: 2 (up), 3 (right, down) → Set {2,3} → 7', '7'], ['flip (1,0)', 'neighbours: 2, 3 → 7', '7']] },
  complexity: { time: 'O(n²)', space: 'O(n²)', explanation: 'Labeling visits each cell once; each 0 checks 4 neighbours. The stack and size array are O(n²) in the worst case.' },
  alternative: { title: 'Union-Find', md: 'Union adjacent land cells, keep component sizes at the roots, then for each 0 sum the sizes of distinct neighbouring roots. Same idea, different bookkeeping.', complexity: 'O(n² · α) time, O(n²) space' },
  mistakes: [
    'Adding the same island twice when it touches the 0 from two sides.',
    'Returning 0 (or forgetting the baseline) when the grid has no 0.',
    'Using id 1 for the first island — it is indistinguishable from unlabelled land.',
    'Recursive DFS on a 500×500 land grid → stack overflow.',
  ],
};
