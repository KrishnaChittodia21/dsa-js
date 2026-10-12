export default {
  id: 'minimum-number-of-days-to-disconnect-island',
  title: 'Minimum Number of Days to Disconnect Island',
  difficulty: 'Hard',
  order: 5,
  pattern: 'adv-graph-lowlink-bridges',
  tags: ['graph', 'grid', 'articulation points', 'dfs'],
  source: { platform: 'LeetCode', number: 1568, url: 'https://leetcode.com/problems/minimum-number-of-days-to-disconnect-island/' },

  statement: `You get an \`m x n\` binary grid: \`1\` is land, \`0\` is water. An **island** is a maximal group of land cells connected up/down/left/right.

The grid is **connected** if it has **exactly one** island; otherwise (zero islands or two or more) it is disconnected.

Each day you may turn one land cell into water. Return the minimum number of days needed to make the grid disconnected.`,
  examples: [
    { input: 'grid = [[0,1,1,0],[0,1,1,0],[0,0,0,0]]', output: '2', explanation: 'A 2×2 block: removing any single cell leaves a connected L-shape; two removals split it.' },
    { input: 'grid = [[1,1]]', output: '2', explanation: 'Remove both cells → zero islands, which counts as disconnected.' },
    { input: 'grid = [[1,0,1,0]]', output: '0', explanation: 'Already two islands.' },
  ],
  constraints: ['1 <= m, n <= 30', 'grid[i][j] is 0 or 1'],

  think: `- Can the answer ever be more than 2? Think about a corner cell of the island and its neighbours.
- When is the answer 0? When is it exactly 1?
- "Removing one cell disconnects the island" — what is that cell called in graph terms?`,
  patternChallenge: {
    options: ['Dijkstra from a corner', 'Articulation points on the grid graph (answer ∈ {0, 1, 2})', 'Dynamic programming over rows', 'Minimum spanning tree'],
    answer: 1,
    explanation: 'The answer is bounded by 2, so we only need to decide 0 (not exactly one island) and 1 (a single cell whose removal disconnects = an articulation point, or the island is one cell). That is a low-link DFS on land cells.',
  },
  hints: [
    'Prove the answer is at most 2: take the top-most, then left-most land cell. It has at most two land neighbours (right and down). Removing those two isolates it (or leaves nothing).',
    'Answer 0 if the island count is not 1. Answer 1 if there is only one land cell, or if some land cell is an articulation point. Otherwise 2.',
  ],
  approach: `**Upper bound 2.** The top-most/left-most land cell has no land above or to its left, so at most two land neighbours. Remove them and it is cut off (or the grid is empty/split) → 2 days always suffice.

**Brute force for the "1" case:** for each land cell, turn it to water, count islands, restore. O((mn)²) = 810,000 steps for a 30×30 grid — actually fine here and worth mentioning.

**Optimal:** treat land cells as graph nodes with edges between 4-neighbours.
1. Count land cells and islands. If islands ≠ 1 → 0.
2. If land === 1 → 1 (removing it leaves zero islands).
3. Run one low-link DFS from any land cell. If any articulation point exists → 1.
4. Otherwise → 2.

(Two land cells: no articulation point exists — removing one leaves one island — so the answer is 2, matching the example \`[[1,1]]\`.)`,

  functionName: 'minDays',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function minDays(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A 2×2 block has no cut cell: removing one leaves an L-shape, so it takes 2 days.', args: [[[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Removing both cells leaves zero islands, which counts as disconnected. A 2-cell island has no cut vertex.', args: [[[1, 1]]], expected: 2 },
    { scenario: 'Example 3', hint: 'Already two islands: 0 days.', args: [[[1, 0, 1, 0]]], expected: 0 },
    { scenario: 'Single land cell', hint: 'Removing it leaves zero islands — disconnected after 1 day.', args: [[[1]]], expected: 1 },
    { scenario: 'All water', hint: 'Zero islands is already disconnected: 0.', args: [[[0, 0]]], expected: 0 },
    { scenario: 'Three in a row', hint: 'The middle cell is a cut vertex: 1 day.', args: [[[1, 1, 1]]], expected: 1 },
    { scenario: 'Bridge cell in the middle', hint: 'One land cell joins two blocks; removing it splits the island.', args: [[[1, 1, 0, 1, 1], [1, 1, 1, 1, 1], [1, 1, 0, 1, 1], [1, 1, 0, 1, 1]]], expected: 1 },
    { scenario: 'Full 2×2', hint: 'No cut cell; never answer more than 2.', args: [[[1, 1], [1, 1]]], expected: 2 },
    { scenario: 'Ring', hint: 'A ring has no cut cell: every single removal leaves a path. Answer 2.', args: [[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], expected: 2 },
    { scenario: 'L-shape of three', hint: 'The corner cell is a cut vertex.', args: [[[1, 0], [1, 1]]], expected: 1 },
    { scenario: 'Root is the cut cell', hint: 'The first land cell in scan order is the cut vertex: the DFS root rule (≥ 2 children) must detect it.', args: [[[0, 1, 1], [1, 1, 0]]], expected: 1 },
    { scenario: 'Full 30×30 block', hint: 'A solid block never has a cut cell: 2 (isolating a corner takes two removals).', argsGen: '() => { const g = Array.from({ length: 30 }, () => new Array(30).fill(0)); for (const row of g) row.fill(1); return [g]; }', expected: 2 },
    { scenario: 'Snake path 30×30', hint: 'A long winding one-cell-wide path: every inner cell is a cut vertex, answer 1.', argsGen: '() => { const g = Array.from({ length: 30 }, () => new Array(30).fill(0)); for (let r = 0; r < 30; r += 2) { g[r].fill(1); if (r + 1 < 30) g[r + 1][(r / 2) % 2 ? 0 : 29] = 1; } return [g]; }', expected: 1 },
    { scenario: 'Checkerboard', hint: 'No two land cells touch: hundreds of islands, 0 days.', argsGen: '() => { const g = Array.from({ length: 30 }, () => new Array(30).fill(0)); for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) g[r][c] = (r + c) % 2; return [g]; }', expected: 0 },
  ],

  solution: {
    code: `function minDays(grid) {
  const m = grid.length, n = grid[0].length;
  const id = (r, c) => r * n + c;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const isLand = (r, c) => r >= 0 && r < m && c >= 0 && c < n && grid[r][c] === 1;

  // 1. Count land cells and islands
  let land = 0, islands = 0, first = -1;
  const seen = new Array(m * n).fill(false);
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (!isLand(r, c)) continue;
      land++;
      if (seen[id(r, c)]) continue;
      islands++;
      if (first === -1) first = id(r, c);
      const stack = [[r, c]];
      seen[id(r, c)] = true;
      while (stack.length) {
        const [x, y] = stack.pop();
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (isLand(nx, ny) && !seen[id(nx, ny)]) { seen[id(nx, ny)] = true; stack.push([nx, ny]); }
        }
      }
    }
  }
  if (islands !== 1) return 0;
  if (land === 1) return 1;

  // 2. Low-link DFS: does the island have an articulation point?
  const disc = new Array(m * n).fill(-1), low = new Array(m * n).fill(0);
  let time = 0, hasCut = false;
  function dfs(u, parent) {
    disc[u] = low[u] = time++;
    const r = Math.floor(u / n), c = u % n;
    let children = 0;
    for (const [dx, dy] of dirs) {
      const nr = r + dx, nc = c + dy;
      if (!isLand(nr, nc)) continue;
      const v = id(nr, nc);
      if (v === parent) continue;               // grids have no parallel edges
      if (disc[v] === -1) {
        children++;
        dfs(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (parent !== -1 && low[v] >= disc[u]) hasCut = true;
      } else {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
    if (parent === -1 && children >= 2) hasCut = true;
  }
  dfs(first, -1);
  return hasCut ? 1 : 2;
}`,
    explanation: 'A 30×30 grid gives at most 900 land cells, so recursion depth is safe here. Skipping the parent by cell id is fine because a grid never has two edges between the same pair of cells.',
  },
  dryRun: {
    columns: ['grid', 'islands', 'land', 'cut vertex?', 'answer'],
    rows: [
      ['[[1,0,1,0]]', '2', '2', '—', '0'],
      ['[[1]]', '1', '1', '—', '1'],
      ['[[1,1,1]]', '1', '3', 'middle cell', '1'],
      ['2×2 block', '1', '4', 'none (it is a 4-cycle)', '2'],
      ['ring of 8', '1', '8', 'none (cycle)', '2'],
    ],
  },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'One island count plus one low-link DFS, each visiting every land cell and its 4 neighbours.' },
  alternative: {
    title: 'Try removing every cell',
    md: 'For each land cell: set it to 0, count islands, restore. If any removal gives ≠ 1 island → 1. Otherwise 2. With m, n ≤ 30 this is ≈ 900 × 900 operations — acceptable, and a great first answer in an interview.',
    code: `function minDays(grid) {
  const m = grid.length, n = grid[0].length;
  const count = () => {
    const seen = grid.map((row) => row.map(() => false));
    let k = 0;
    const fill = (r, c) => {
      if (r < 0 || r >= m || c < 0 || c >= n || seen[r][c] || grid[r][c] !== 1) return;
      seen[r][c] = true;
      fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1);
    };
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (grid[r][c] === 1 && !seen[r][c]) { k++; fill(r, c); }
    return k;
  };
  if (count() !== 1) return 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] !== 1) continue;
    grid[r][c] = 0;
    const k = count();
    grid[r][c] = 1;
    if (k !== 1) return 1;
  }
  return 2;
}`,
    complexity: 'O((m·n)²) time, O(m·n) space',
  },
  mistakes: [
    'Forgetting that zero islands also counts as disconnected (single cell → 1, [[1,1]] → 2).',
    'Returning 3 or more — the answer is never above 2.',
    'Treating a 2-cell island as having a cut vertex.',
    'Applying the child test to the DFS root instead of the "≥ 2 children" rule.',
  ],
};
