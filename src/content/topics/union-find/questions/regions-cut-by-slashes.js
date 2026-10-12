export default {
  id: 'regions-cut-by-slashes',
  title: 'Regions Cut By Slashes',
  difficulty: 'Medium',
  order: 9,
  pattern: 'union-find-connectivity',
  tags: ['union find', 'grid', 'graph'],
  source: { platform: 'LeetCode', number: 959, url: 'https://leetcode.com/problems/regions-cut-by-slashes/' },

  statement: `An \`n × n\` grid is drawn with unit squares. Each square contains \`'/'\`, \`'\\\\'\` (a backslash) or \`' '\` (blank). The slashes split the grid into regions.

Given the grid as an array of \`n\` strings, return the number of regions.

(In JavaScript source a backslash inside a string is written \`'\\\\'\`, so the row \`"\\\\/"\` has two characters: a backslash and a slash.)`,
  examples: [
    { input: 'grid = [" /","/ "]', output: '2' },
    { input: 'grid = [" /","  "]', output: '1' },
    { input: 'grid = ["/\\\\","\\\\/"]', output: '5', explanation: 'The four slashes draw a diamond: 4 corner regions + the inside.' },
  ],
  constraints: ['1 <= n <= 30', 'grid[i][j] is "/", "\\\\" or " "'],

  think: `- A slash cuts a square diagonally. If you split every square into 4 triangles (top, right, bottom, left), which triangles does each character keep together?
- Which triangles of neighbouring squares always touch?`,
  patternChallenge: {
    options: ['Union Find (Dynamic Connectivity)', 'Binary Search', 'Monotonic Stack', 'Dynamic Programming on grids'],
    answer: 0,
    explanation: 'Regions are connected components of small pieces. Splitting each cell into 4 triangles makes every relation a simple "these two pieces are connected" union. DP computes optimal values, not components.',
  },
  hints: [
    'Split cell (r, c) into triangles 0 = top, 1 = right, 2 = bottom, 3 = left; id = 4 * (r * n + c) + k.',
    'Inside a cell: " " joins all four; "/" joins top+left and right+bottom; "\\\\" joins top+right and bottom+left. Across cells: bottom of (r,c) touches top of (r+1,c); right of (r,c) touches left of (r,c+1). Answer = uf.count.',
  ],
  approach: `**Approach A — 4 triangles per cell (DSU):** 4n² pieces.
- Internal unions depend on the character (see hint 2).
- External unions never depend on characters: a cell's bottom triangle always touches the next row's top triangle; right touches the next column's left.
- The number of regions is the final \`count\`.

**Approach B — upscale ×3 + flood fill:** draw each cell as a 3×3 pixel block with the slash as 3 blocked pixels, then count islands of open pixels with DFS/BFS. Works, but uses 9n² cells and needs care with diagonal leaks (×2 is not enough).`,

  functionName: 'regionsBySlashes',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {string[]} grid
 * @return {number}
 */
function regionsBySlashes(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two "/" strokes form one long diagonal line, splitting the square in two.', args: [[' /', '/ ']], expected: 2 },
    { scenario: 'Example 2', hint: 'A single "/" that touches only one border does not enclose anything — still 1 region.', args: [[' /', '  ']], expected: 1 },
    { scenario: 'Example 3', hint: 'Four slashes draw a diamond: 4 corner regions plus the inside.', args: [['/\\', '\\/']], expected: 5 },
    { scenario: 'Single blank cell', hint: 'The smallest grid with no cuts is one region.', args: [[' ']], expected: 1 },
    { scenario: 'Single forward slash', hint: '"/" joins top with left and right with bottom: 2 regions.', args: [['/']], expected: 2 },
    { scenario: 'Single backslash', hint: '"\\\\" joins top with right and bottom with left — if you swapped the triangle pairs of "/" and "\\\\" the counts change in bigger grids.', args: [['\\']], expected: 2 },
    { scenario: 'Slashes of one kind', hint: 'Parallel "/" diagonals create bands; cross-cell unions must be applied for every cell, whatever its character.', args: [['//', '/ ']], expected: 3 },
    { scenario: 'Inverted diamond', hint: 'Backslash then slash on top, slash then backslash below: the strokes form an X through the centre, giving 4 regions — catches swapped "/" and "\\\\" handling.', args: [['\\/', '/\\']], expected: 4 },
    { scenario: 'All blank (n = 30)', hint: 'No slashes at all: every triangle connects, exactly 1 region.', argsGen: '() => [Array.from({ length: 30 }, () => \' \'.repeat(30))]', expected: 1 },
    { scenario: 'All backslashes (n = 3)', hint: 'Every cell is "\\\\": five parallel diagonal lines cut the square into 2n = 6 bands.', args: [['\\\\\\', '\\\\\\', '\\\\\\']], expected: 6 },
    { scenario: 'Diamond tiling', hint: 'Repeated diamonds enclose many small regions — every enclosed area must be counted.', args: [['/\\/\\', '\\/\\/', '/\\/\\', '\\/\\/']], expected: 13 },
    { scenario: 'Random max grid (n = 30)', hint: 'A dense random 30×30 grid of all three characters; checks both in-cell and cross-cell unions at scale.', argsGen: '() => { let s = 3; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => \' /\\\\\'[r() % 3]).join(\'\'))]; }', expected: 30 },
    { scenario: 'Random slashes only (n = 30)', hint: 'No blanks — every cell is cut, producing many small regions.', argsGen: '() => { let s = 9; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); return [Array.from({ length: 30 }, () => Array.from({ length: 30 }, () => \'/\\\\\'[r() % 2]).join(\'\'))]; }', expected: 61 },
  ],

  solution: {
    code: `function regionsBySlashes(grid) {
  const n = grid.length;
  const uf = new UnionFind(4 * n * n);
  const id = (r, c, k) => 4 * (r * n + c) + k;   // k: 0 top, 1 right, 2 bottom, 3 left

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const ch = grid[r][c];
      if (ch === ' ') {
        uf.union(id(r, c, 0), id(r, c, 1));
        uf.union(id(r, c, 1), id(r, c, 2));
        uf.union(id(r, c, 2), id(r, c, 3));
      } else if (ch === '/') {
        uf.union(id(r, c, 0), id(r, c, 3));      // top + left
        uf.union(id(r, c, 1), id(r, c, 2));      // right + bottom
      } else {
        uf.union(id(r, c, 0), id(r, c, 1));      // top + right
        uf.union(id(r, c, 2), id(r, c, 3));      // bottom + left
      }
      if (r + 1 < n) uf.union(id(r, c, 2), id(r + 1, c, 0)); // bottom ↔ next top
      if (c + 1 < n) uf.union(id(r, c, 1), id(r, c + 1, 3)); // right ↔ next left
    }
  }
  return uf.count;
}`,
  },
  dryRun: `\`grid = ["/"]\` (n = 1): 4 triangles, count = 4. "/" unions top+left (count 3) and right+bottom (count 2). No neighbours. Answer **2**.

\`grid = [" /", "/ "]\`: the two slashes form one long diagonal from bottom-left to top-right, splitting the square into 2 regions — the DSU ends with count 2.`,
  complexity: { time: 'O(n² · α(n²))', space: 'O(n²)', explanation: '4n² pieces, a constant number of unions per cell.' },
  alternative: {
    title: 'Upscale ×3 and count islands',
    md: 'Make a 3n × 3n pixel grid, mark the diagonal pixels of each slash as walls, and count connected open areas with BFS/DFS.',
    complexity: 'O(n²) time and space (with a 9× constant)',
  },
  mistakes: ['Mixing up which triangles "/" and "\\\\" connect.', 'Forgetting the cross-cell unions (they apply regardless of characters).', 'Reading a backslash as two characters when writing tests.'],
};
