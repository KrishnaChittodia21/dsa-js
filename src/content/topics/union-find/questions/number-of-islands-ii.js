export default {
  id: 'number-of-islands-ii',
  title: 'Number of Islands II',
  difficulty: 'Hard',
  order: 1,
  pattern: 'union-find-advanced',
  tags: ['union find', 'grid', 'online'],
  source: { platform: 'LeetCode', number: 305, url: 'https://leetcode.com/problems/number-of-islands-ii/', premium: true },

  statement: `You have an \`m × n\` grid that starts as all water. \`positions[i] = [r, c]\` turns cell \`(r, c)\` into land (in order). Land cells that touch horizontally or vertically form one island.

Return an array \`answer\` where \`answer[i]\` is the number of islands **after** the i-th operation. A position may be repeated — turning land into land changes nothing.`,
  examples: [
    { input: 'm = 3, n = 3, positions = [[0,0],[0,1],[1,2],[2,1]]', output: '[1,1,2,3]' },
    { input: 'm = 1, n = 1, positions = [[0,0]]', output: '[1]' },
  ],
  constraints: ['1 <= m, n, positions.length <= 10^4', '1 <= m * n <= 10^4', '0 <= r < m, 0 <= c < n'],

  think: `- Re-running a full flood fill after every addition costs O(m·n) per step. What is the minimum work a single new land cell can cause?
- A new land cell alone adds one island. What does each **distinct** neighbouring island it touches do to the count?`,
  patternChallenge: {
    options: ['Grid DFS after every step', 'Union Find — Multi-Instance & Online', 'Binary Search', 'Sliding Window'],
    answer: 1,
    explanation: 'Operations arrive one at a time and we need the count after each — online connectivity. DSU updates in near-O(1) per addition; re-running DFS each time is O(k · m · n).',
  },
  hints: [
    'Keep `isLand[]` and a running `islands` counter. New land: islands++, then try to union with each of its up to 4 land neighbours.',
    'Every union that returns true merged two separate islands → islands--. Skip positions that are already land.',
  ],
  approach: `**Brute force:** after every addition run number-of-islands (DFS) on the whole grid: O(k · m · n) — up to 10⁸ operations.

**Online DSU:**
- id = r * n + c; \`uf = new UnionFind(m * n)\`; \`land = new Uint8Array(m * n)\`.
- For each position: if already land, push the current count. Otherwise mark land, \`islands++\`, and for each of the 4 neighbours that is land, \`if (uf.union(id, nb)) islands--\`.
- Push \`islands\`.

We cannot use \`uf.count\` because water cells are also "groups" inside the DSU — track the island count ourselves.`,

  functionName: 'numIslands2',
  paramNames: ['m', 'n', 'positions'],
  starterCode: `/**
 * @param {number} m
 * @param {number} n
 * @param {number[][]} positions
 * @return {number[]}
 */
function numIslands2(m, n, positions) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The second cell joins the first island; the next two are separate islands.', args: [3, 3, [[0, 0], [0, 1], [1, 2], [2, 1]]], expected: [1, 1, 2, 3] },
    { scenario: 'Example 2', hint: 'The smallest grid: one cell, one island.', args: [1, 1, [[0, 0]]], expected: [1] },
    { scenario: 'Repeated position', hint: 'Adding land where land already exists must not create a new island.', args: [3, 3, [[0, 0], [0, 0], [1, 1]]], expected: [1, 1, 2] },
    { scenario: 'Centre merges four islands', hint: 'The centre cell touches four separate islands: count drops by 4 then +1 for itself. Decrement once per successful union.', args: [3, 3, [[0, 1], [1, 0], [1, 2], [2, 1], [1, 1]]], expected: [1, 2, 3, 4, 1] },
    { scenario: 'Single row filling gaps', hint: 'Filling a gap between two islands merges them into one.', args: [1, 5, [[0, 0], [0, 2], [0, 4], [0, 1], [0, 3]]], expected: [1, 2, 3, 2, 1] },
    { scenario: 'Two neighbours, same island', hint: '[1,0] touches [0,0] and [1,1], which are already one island — decrementing per neighbour undercounts.', args: [2, 2, [[0, 0], [1, 1], [0, 1], [1, 0]]], expected: [1, 2, 1, 1] },
    { scenario: 'Single column', hint: 'Vertical neighbours count too.', args: [3, 1, [[0, 0], [2, 0], [1, 0]]], expected: [1, 2, 1] },
    { scenario: 'Diagonals do not connect', hint: 'Only horizontal/vertical neighbours join; diagonal cells stay separate islands.', args: [2, 2, [[0, 0], [1, 1]]], expected: [1, 2] },
    { scenario: 'Wrap-around at row end', hint: 'Cell (0,2) and (1,0) are adjacent in a flattened index (r·n + c) but not on the grid — check column bounds.', args: [2, 3, [[0, 2], [1, 0]]], expected: [1, 2] },
    { scenario: 'Repeat after merging', hint: 'Re-adding a cell inside a merged island changes nothing.', args: [2, 2, [[0, 0], [0, 1], [0, 0], [1, 1], [0, 1]]], expected: [1, 1, 1, 1, 1] },
    { scenario: 'Fill whole grid', hint: 'Every cell becomes land: the count must end at 1. Using uf.count would also count water cells.', args: [2, 3, [[0, 0], [1, 2], [0, 2], [1, 0], [0, 1], [1, 1]]], expected: [1, 2, 2, 2, 1, 1] },
    { scenario: 'Max size checkerboard (10^4 ops)', hint: 'Half the cells become separate islands, then the other half merges them. A flood fill after every operation is O(k·m·n) — too slow here.', argsGen: '() => { const p = []; for (let par = 0; par < 2; par++) for (let r = 0; r < 100; r++) for (let c = 0; c < 100; c++) if ((r + c) % 2 === par) p.push([r, c]); return [100, 100, p]; }', expectedGen: "() => { const [m, n, pos] = (() => { const p = []; for (let par = 0; par < 2; par++) for (let r = 0; r < 100; r++) for (let c = 0; c < 100; c++) if ((r + c) % 2 === par) p.push([r, c]); return [100, 100, p]; })(); const p = new Int32Array(m * n).fill(-1); const find = (x) => { while (p[x] !== x) x = p[x] = p[p[x]]; return x; }; let cnt = 0; return pos.map(([r, c]) => { const id = r * n + c; if (p[id] === -1) { p[id] = id; cnt++; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= m || cc >= n || p[rr * n + cc] === -1) continue; const a = find(id), b = find(rr * n + cc); if (a !== b) { p[a] = b; cnt--; } } } return cnt; }); }", timeLimitMs: 500 },
  ],

  solution: {
    code: `function numIslands2(m, n, positions) {
  const uf = new UnionFind(m * n);
  const land = new Uint8Array(m * n);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const answer = [];
  let islands = 0;

  for (const [r, c] of positions) {
    const id = r * n + c;
    if (!land[id]) {
      land[id] = 1;
      islands++;                                  // a brand-new island of size 1
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
        const nb = nr * n + nc;
        if (land[nb] && uf.union(id, nb)) islands--; // merged two islands
      }
    }
    answer.push(islands);
  }
  return answer;
}`,
  },
  dryRun: {
    columns: ['add', 'land neighbours', 'successful unions', 'islands'],
    rows: [
      ['(0,1)', '—', '0', '1'],
      ['(1,0)', '—', '0', '2'],
      ['(1,2)', '—', '0', '3'],
      ['(2,1)', '—', '0', '4'],
      ['(1,1)', '4 (all different islands)', '4', '4 + 1 − 4 = 1'],
    ],
  },
  complexity: { time: 'O(m·n + k · α(m·n))', space: 'O(m·n)', explanation: 'Allocating the DSU is O(m·n); each of the k additions does at most 4 unions.' },
  alternative: {
    title: 'Sparse DSU with a Map',
    md: 'If the grid were huge (m·n up to 10¹⁰) but positions few, store parent in a Map keyed by id and only create entries for land cells. Same logic, O(k) memory.',
    complexity: 'O(k · α(k)) time, O(k) space',
  },
  mistakes: ['Counting a repeated position as a new island.', 'Decrementing once per land neighbour instead of once per successful union (two neighbours may already be the same island).', 'Using uf.count, which also counts water cells.'],
};
