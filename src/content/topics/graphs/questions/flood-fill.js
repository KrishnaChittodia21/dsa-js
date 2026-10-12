export default {
  id: 'flood-fill',
  title: 'Flood Fill',
  difficulty: 'Easy',
  order: 2,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'dfs', 'bfs'],
  source: { platform: 'LeetCode', number: 733, url: 'https://leetcode.com/problems/flood-fill/' },

  statement: `An image is a grid \`image\` of integers (pixel colours). Starting from pixel \`(sr, sc)\`, perform a **flood fill** with colour \`color\`:

- the starting pixel, and every pixel connected to it **4-directionally** (up, down, left, right) through pixels of the **same original colour**, is repainted with \`color\`.

Return the modified image. This is the "paint bucket" tool in drawing programs.`,
  examples: [
    { input: 'image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2', output: '[[2,2,2],[2,2,0],[2,0,1]]', explanation: 'The bottom-right 1 is not connected (only diagonally) so it stays 1.' },
    { input: 'image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, color = 0', output: '[[0,0,0],[0,0,0]]', explanation: 'The new colour equals the old one: nothing changes.' },
  ],
  constraints: ['1 <= m, n <= 50', '0 <= image[i][j], color < 2^16', '0 <= sr < m, 0 <= sc < n'],

  think: `- What are the vertices and edges here?
- How do you know a pixel has already been painted, without a separate visited array?
- What goes wrong if \`color\` equals the original colour?`,
  patternChallenge: {
    options: ['Sliding Window', 'Grid DFS/BFS (implicit graph)', 'Dynamic Programming on the grid', 'Binary Search'],
    answer: 1,
    explanation: '"Connected 4-directionally through the same colour" is a connected-component-in-a-grid question. A DFS/BFS from the start pixel reaches exactly that component. DP does not apply: there is no optimal substructure, just reachability.',
  },
  hints: [
    'Remember the original colour `old = image[sr][sc]`. DFS to neighbours that are in bounds and still have colour `old`.',
    'Repainting a pixel marks it visited (it no longer has colour `old`). But if `old === color`, that trick fails — return early.',
  ],
  approach: `**Model:** pixels are vertices; two 4-adjacent pixels with the original colour are connected.

**Algorithm:** \`old = image[sr][sc]\`. If \`old === color\`, return the image unchanged (otherwise DFS would loop forever, because painted pixels still look unvisited). Otherwise DFS: out of bounds or colour ≠ old → return; paint it; recurse into the four neighbours. The repaint *is* the visited mark.`,

  functionName: 'floodFill',
  paramNames: ['image', 'sr', 'sc', 'color'],
  starterCode: `/**
 * @param {number[][]} image
 * @param {number} sr
 * @param {number} sc
 * @param {number} color
 * @return {number[][]}
 */
function floodFill(image, sr, sc, color) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The bottom-right 1 touches the region only diagonally, so it must stay 1.', args: [[[1,1,1],[1,1,0],[1,0,1]],1,1,2], expected: [[2,2,2],[2,2,0],[2,0,1]] },
    { scenario: 'Example 2', hint: 'The new colour equals the old one: without an early return a recursive fill loops forever.', args: [[[0,0,0],[0,0,0]],0,0,0], expected: [[0,0,0],[0,0,0]] },
    { scenario: 'Single pixel', hint: 'A 1×1 image: only the start pixel changes.', args: [[[5]],0,0,7], expected: [[7]] },
    { scenario: 'Same colour, partial region', hint: 'Recolouring with the colour the region already has must change nothing (and must terminate).', args: [[[0,0,0],[0,1,1]],1,1,1], expected: [[0,0,0],[0,1,1]] },
    { scenario: 'Isolated start pixel', hint: 'All 4 neighbours differ, so only the start pixel is painted — diagonals do not count.', args: [[[1,2,1],[2,1,2],[1,2,1]],1,1,3], expected: [[1,2,1],[2,3,2],[1,2,1]] },
    { scenario: 'Start at a corner', hint: 'Starting at (0,0): check bounds before reading image[r][c] for negative indices.', args: [[[0,0,1],[1,0,1],[1,0,0]],0,0,9], expected: [[9,9,1],[1,9,1],[1,9,9]] },
    { scenario: 'Start at the last cell', hint: 'Starting at the bottom-right corner — moves past the last row/column must be rejected.', args: [[[2,2,3],[3,2,2],[3,3,2]],2,2,5], expected: [[5,5,3],[3,5,5],[3,3,5]] },
    { scenario: 'Single row', hint: 'A 1-row image: the whole row is one region.', args: [[[3,3,3,3]],0,2,4], expected: [[4,4,4,4]] },
    { scenario: 'Single column with a gap', hint: 'A different colour in the middle of a column blocks the fill.', args: [[[1],[1],[2],[1]],0,0,8], expected: [[8],[8],[2],[1]] },
    { scenario: 'New colour already nearby', hint: 'Neighbouring pixels already have the new colour; they belong to a different region and must not spread further.', args: [[[1,1,2],[1,2,2],[2,1,1]],0,0,2], expected: [[2,2,2],[2,2,2],[2,1,1]] },
    { scenario: 'Spiral region', hint: 'A winding region that turns in all four directions; the fill must follow every turn.', args: [[[1,1,1,1],[0,0,0,1],[1,1,0,1],[1,0,0,1],[1,1,1,1]],0,0,7], expected: [[7,7,7,7],[0,0,0,7],[7,7,0,7],[7,0,0,7],[7,7,7,7]] },
    { scenario: 'Large colours (2^16 − 1)', hint: 'Colours go up to 65535; treat them as plain numbers.', args: [[[65535,65535],[0,65535]],0,1,0], expected: [[0,0],[0,0]] },
    { scenario: 'Full 50×50 image', hint: 'The maximum size, every pixel the same colour — all 2,500 pixels change.', argsGen: '() => [Array.from({ length: 50 }, () => new Array(50).fill(4)), 25, 25, 9]', expected: [[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]] },
  ],

  solution: {
    code: `function floodFill(image, sr, sc, color) {
  const old = image[sr][sc];
  if (old === color) return image;          // nothing to do (and avoids infinite recursion)
  const R = image.length, C = image[0].length;
  const fill = (r, c) => {
    if (r < 0 || r >= R || c < 0 || c >= C || image[r][c] !== old) return;
    image[r][c] = color;                    // paint = mark visited
    fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1);
  };
  fill(sr, sc);
  return image;
}`,
  },
  dryRun: { columns: ['call', 'pixel colour', 'action'], rows: [['fill(1,1)', '1', 'paint 2, recurse'], ['fill(2,1)', '0', 'stop (not old)'], ['fill(0,1)', '1', 'paint 2, recurse'], ['fill(0,0), fill(0,2), fill(1,0)…', '1', 'paint 2'], ['fill(2,2) is never called from a 1-neighbour', '—', 'stays 1']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each pixel is painted at most once and checks 4 neighbours. The recursion stack can be as deep as the number of pixels in the region.' },
  alternative: {
    title: 'BFS with a queue',
    md: 'Same idea with a queue of cells; paint when enqueuing. Avoids recursion depth issues on huge images.',
    code: `function floodFill(image, sr, sc, color) {
  const old = image[sr][sc];
  if (old === color) return image;
  const R = image.length, C = image[0].length;
  const q = [[sr, sc]];
  image[sr][sc] = color;
  for (let h = 0; h < q.length; h++) {
    const [r, c] = q[h];
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && image[nr][nc] === old) {
        image[nr][nc] = color;
        q.push([nr, nc]);
      }
    }
  }
  return image;
}`,
    complexity: 'O(m·n) time and space',
  },
  mistakes: [
    'Missing the `old === color` early return → infinite recursion.',
    'Reading image[r][c] before checking bounds.',
    'Filling diagonally connected pixels (only 4 directions count).',
  ],
};
