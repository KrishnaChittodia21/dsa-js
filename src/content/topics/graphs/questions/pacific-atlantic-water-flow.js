export default {
  id: 'pacific-atlantic-water-flow',
  title: 'Pacific Atlantic Water Flow',
  difficulty: 'Medium',
  order: 10,
  pattern: 'grid-graph-traversal',
  tags: ['grid', 'dfs', 'bfs', 'reverse thinking'],
  source: { platform: 'LeetCode', number: 417, url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/' },

  statement: `An \`m x n\` island has a height at every cell, \`heights[r][c]\`. The **Pacific** ocean touches the top and left edges; the **Atlantic** touches the bottom and right edges.

Rain water flows from a cell to a 4-adjacent cell whose height is **less than or equal** to the current one. Water on an edge cell can flow into the ocean it touches.

Return every coordinate \`[r, c]\` from which water can reach **both** oceans (any order).`,
  examples: [
    { input: 'heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', output: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]' },
    { input: 'heights = [[1]]', output: '[[0,0]]' },
  ],
  constraints: ['1 <= m, n <= 200', '0 <= heights[r][c] <= 10^5'],

  think: `- Checking every cell with its own DFS costs O((m·n)²). Can you start from the oceans instead?
- If water flows downhill from A to B, which way do you walk when you start from B?`,
  patternChallenge: {
    options: ['Dynamic Programming by height', 'Two reverse traversals from the ocean borders', 'Dijkstra from every cell', 'Monotonic Stack per row'],
    answer: 1,
    explanation: 'Reverse the flow: start at the Pacific border and move to neighbours that are **higher or equal** — that marks every cell that can drain into the Pacific. Do the same for the Atlantic; the answer is the intersection. DP by height fails because flow can wind in any direction on plateaus.',
  },
  hints: [
    'Reverse the direction: from an ocean edge cell, you can "climb" to a neighbour whose height is >= the current height.',
    'Run the climb from all Pacific edge cells (mark `pac`), then from all Atlantic edge cells (mark `atl`). Return the cells marked in both.',
  ],
  approach: `**Brute force:** for each cell, DFS downhill and see if both oceans are reached: O((m·n)²).

**Reverse multi-start traversal:** a cell can drain to the Pacific iff it is reachable from a Pacific border cell by **climbing** (moving to heights ≥ current). Seed BFS/DFS with the whole top row and left column → \`pac\`. Seed with the bottom row and right column → \`atl\`. Collect cells in both. Two O(m·n) traversals.`,

  functionName: 'pacificAtlantic',
  paramNames: ['heights'],
  compare: 'unordered',
  starterCode: `/**
 * @param {number[][]} heights
 * @return {number[][]}
 */
function pacificAtlantic(heights) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The classic 5×5 map — climb uphill from each ocean\'s border and intersect the two reachable sets.', args: [[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]], expected: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]] },
    { scenario: 'Example 2', hint: 'A single cell touches both oceans.', args: [[[1]]], expected: [[0,0]] },
    { scenario: 'Flat 2×2 plateau', hint: 'Equal heights let water flow: climbing must use >=, not >.', args: [[[1,1],[1,1]]], expected: [[0,0],[0,1],[1,0],[1,1]] },
    { scenario: 'Single row', hint: 'In a 1-row grid every cell touches the top (Pacific) and bottom (Atlantic) edge.', args: [[[3,2,1]]], expected: [[0,0],[0,1],[0,2]] },
    { scenario: 'Single column', hint: 'In a 1-column grid every cell touches the left and right edges.', args: [[[5],[1],[7]]], expected: [[0,0],[1,0],[2,0]] },
    { scenario: 'Spiral climb', hint: 'Heights rise in a spiral; the centre peak drains both ways.', args: [[[1,2,3],[8,9,4],[7,6,5]]], expected: [[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
    { scenario: 'Corners touch both oceans', hint: 'The top-right and bottom-left corners border both oceans even if they are the lowest cells.', args: [[[2,1],[1,2]]], expected: [[0,0],[0,1],[1,0],[1,1]] },
    { scenario: 'Central pit', hint: 'The low centre cannot drain anywhere; every border cell can.', args: [[[5,5,5],[5,1,5],[5,5,5]]], expected: [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]] },
    { scenario: 'Strict vs non-strict climb', hint: 'A flat ridge of 3s connects the Pacific side to the Atlantic side; using > instead of >= loses it.', args: [[[3,3,3,3],[1,1,1,3],[1,1,1,3]]], expected: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,2],[2,3]] },
    { scenario: 'Zero heights', hint: 'Heights can be 0; a grid of zeros drains everywhere.', args: [[[0,0,0],[0,0,0]]], expected: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]] },
    { scenario: 'Max heights in a valley', hint: 'Heights up to 10^5; a deep valley column blocks flow from the left cells to the Atlantic.', args: [[[100000,0,100000],[100000,0,100000],[100000,0,100000]]], expected: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
    { scenario: 'Large diagonal slope (200×200)', hint: 'Starting a downhill search from every cell is O((m·n)²) — climb from the borders instead (two BFS passes).', argsGen: '() => [Array.from({ length: 200 }, (_, r) => Array.from({ length: 200 }, (_, c) => r + c))]', expected: [[0,199],[1,199],[2,199],[3,199],[4,199],[5,199],[6,199],[7,199],[8,199],[9,199],[10,199],[11,199],[12,199],[13,199],[14,199],[15,199],[16,199],[17,199],[18,199],[19,199],[20,199],[21,199],[22,199],[23,199],[24,199],[25,199],[26,199],[27,199],[28,199],[29,199],[30,199],[31,199],[32,199],[33,199],[34,199],[35,199],[36,199],[37,199],[38,199],[39,199],[40,199],[41,199],[42,199],[43,199],[44,199],[45,199],[46,199],[47,199],[48,199],[49,199],[50,199],[51,199],[52,199],[53,199],[54,199],[55,199],[56,199],[57,199],[58,199],[59,199],[60,199],[61,199],[62,199],[63,199],[64,199],[65,199],[66,199],[67,199],[68,199],[69,199],[70,199],[71,199],[72,199],[73,199],[74,199],[75,199],[76,199],[77,199],[78,199],[79,199],[80,199],[81,199],[82,199],[83,199],[84,199],[85,199],[86,199],[87,199],[88,199],[89,199],[90,199],[91,199],[92,199],[93,199],[94,199],[95,199],[96,199],[97,199],[98,199],[99,199],[100,199],[101,199],[102,199],[103,199],[104,199],[105,199],[106,199],[107,199],[108,199],[109,199],[110,199],[111,199],[112,199],[113,199],[114,199],[115,199],[116,199],[117,199],[118,199],[119,199],[120,199],[121,199],[122,199],[123,199],[124,199],[125,199],[126,199],[127,199],[128,199],[129,199],[130,199],[131,199],[132,199],[133,199],[134,199],[135,199],[136,199],[137,199],[138,199],[139,199],[140,199],[141,199],[142,199],[143,199],[144,199],[145,199],[146,199],[147,199],[148,199],[149,199],[150,199],[151,199],[152,199],[153,199],[154,199],[155,199],[156,199],[157,199],[158,199],[159,199],[160,199],[161,199],[162,199],[163,199],[164,199],[165,199],[166,199],[167,199],[168,199],[169,199],[170,199],[171,199],[172,199],[173,199],[174,199],[175,199],[176,199],[177,199],[178,199],[179,199],[180,199],[181,199],[182,199],[183,199],[184,199],[185,199],[186,199],[187,199],[188,199],[189,199],[190,199],[191,199],[192,199],[193,199],[194,199],[195,199],[196,199],[197,199],[198,199],[199,0],[199,1],[199,2],[199,3],[199,4],[199,5],[199,6],[199,7],[199,8],[199,9],[199,10],[199,11],[199,12],[199,13],[199,14],[199,15],[199,16],[199,17],[199,18],[199,19],[199,20],[199,21],[199,22],[199,23],[199,24],[199,25],[199,26],[199,27],[199,28],[199,29],[199,30],[199,31],[199,32],[199,33],[199,34],[199,35],[199,36],[199,37],[199,38],[199,39],[199,40],[199,41],[199,42],[199,43],[199,44],[199,45],[199,46],[199,47],[199,48],[199,49],[199,50],[199,51],[199,52],[199,53],[199,54],[199,55],[199,56],[199,57],[199,58],[199,59],[199,60],[199,61],[199,62],[199,63],[199,64],[199,65],[199,66],[199,67],[199,68],[199,69],[199,70],[199,71],[199,72],[199,73],[199,74],[199,75],[199,76],[199,77],[199,78],[199,79],[199,80],[199,81],[199,82],[199,83],[199,84],[199,85],[199,86],[199,87],[199,88],[199,89],[199,90],[199,91],[199,92],[199,93],[199,94],[199,95],[199,96],[199,97],[199,98],[199,99],[199,100],[199,101],[199,102],[199,103],[199,104],[199,105],[199,106],[199,107],[199,108],[199,109],[199,110],[199,111],[199,112],[199,113],[199,114],[199,115],[199,116],[199,117],[199,118],[199,119],[199,120],[199,121],[199,122],[199,123],[199,124],[199,125],[199,126],[199,127],[199,128],[199,129],[199,130],[199,131],[199,132],[199,133],[199,134],[199,135],[199,136],[199,137],[199,138],[199,139],[199,140],[199,141],[199,142],[199,143],[199,144],[199,145],[199,146],[199,147],[199,148],[199,149],[199,150],[199,151],[199,152],[199,153],[199,154],[199,155],[199,156],[199,157],[199,158],[199,159],[199,160],[199,161],[199,162],[199,163],[199,164],[199,165],[199,166],[199,167],[199,168],[199,169],[199,170],[199,171],[199,172],[199,173],[199,174],[199,175],[199,176],[199,177],[199,178],[199,179],[199,180],[199,181],[199,182],[199,183],[199,184],[199,185],[199,186],[199,187],[199,188],[199,189],[199,190],[199,191],[199,192],[199,193],[199,194],[199,195],[199,196],[199,197],[199,198],[199,199]], timeLimitMs: 1000 },
    { scenario: 'Large bumpy terrain (200×200)', hint: 'Pseudo-random heights: each cell must be visited at most twice (once per ocean).', argsGen: '() => { let s = 7; const nx = () => (s = (s * 1103515245 + 12345) % 2147483648) % 5; return [Array.from({ length: 200 }, (_, r) => Array.from({ length: 200 }, (_, c) => r + c + nx()))]; }', expected: [[0,199],[1,198],[1,199],[2,199],[3,198],[4,198],[4,199],[5,198],[5,199],[6,197],[6,198],[6,199],[7,198],[7,199],[8,198],[8,199],[9,198],[9,199],[10,199],[11,199],[12,199],[13,198],[13,199],[14,198],[14,199],[15,198],[15,199],[16,198],[16,199],[18,198],[19,198],[20,198],[20,199],[21,197],[21,198],[21,199],[22,198],[22,199],[23,198],[23,199],[24,198],[24,199],[25,198],[25,199],[26,198],[28,197],[28,198],[29,197],[29,198],[30,198],[31,198],[32,198],[33,198],[33,199],[34,198],[34,199],[35,198],[35,199],[36,198],[36,199],[38,198],[38,199],[40,197],[41,197],[42,198],[43,198],[43,199],[44,198],[44,199],[45,198],[45,199],[46,197],[46,198],[46,199],[47,198],[47,199],[48,198],[48,199],[99,196],[99,197],[99,198],[100,197],[100,198],[100,199],[101,196],[101,197],[102,198],[103,198],[103,199],[104,198],[104,199],[105,199],[106,199],[107,199],[108,198],[109,198],[110,198],[110,199],[111,198],[111,199],[112,199],[113,199],[114,199],[115,199],[116,199],[195,57],[195,58],[196,2],[196,3],[196,8],[196,9],[196,10],[196,15],[196,56],[196,57],[196,96],[196,97],[196,98],[197,1],[197,2],[197,3],[197,4],[197,5],[197,7],[197,8],[197,9],[197,10],[197,11],[197,14],[197,15],[197,16],[197,17],[197,18],[197,21],[197,25],[197,42],[197,50],[197,51],[197,53],[197,54],[197,55],[197,56],[197,57],[197,58],[197,60],[197,82],[197,96],[197,97],[197,99],[197,100],[197,115],[198,0],[198,1],[198,3],[198,5],[198,6],[198,7],[198,8],[198,9],[198,10],[198,11],[198,12],[198,15],[198,16],[198,18],[198,19],[198,23],[198,24],[198,25],[198,31],[198,32],[198,48],[198,49],[198,50],[198,51],[198,52],[198,53],[198,54],[198,55],[198,56],[198,57],[198,58],[198,59],[198,60],[198,61],[198,62],[198,63],[198,95],[198,96],[198,97],[198,98],[198,99],[198,100],[198,101],[198,107],[198,108],[198,109],[198,110],[198,111],[198,112],[198,113],[198,115],[198,116],[198,118],[198,119],[199,0],[199,1],[199,2],[199,3],[199,4],[199,5],[199,6],[199,7],[199,8],[199,9],[199,10],[199,11],[199,12],[199,13],[199,15],[199,16],[199,17],[199,18],[199,19],[199,20],[199,25],[199,26],[199,27],[199,28],[199,29],[199,30],[199,31],[199,32],[199,33],[199,34],[199,35],[199,44],[199,45],[199,46],[199,47],[199,48],[199,49],[199,50],[199,51],[199,52],[199,53],[199,54],[199,55],[199,56],[199,57],[199,58],[199,59],[199,60],[199,61],[199,62],[199,63],[199,64],[199,65],[199,96],[199,97],[199,98],[199,99],[199,100],[199,101],[199,102],[199,103],[199,104],[199,105],[199,106],[199,107],[199,108],[199,109],[199,110],[199,111],[199,114],[199,115],[199,116],[199,117],[199,118],[199,119],[199,120],[199,121]], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function pacificAtlantic(heights) {
  const R = heights.length, C = heights[0].length;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // BFS that CLIMBS from the given border cells; returns a visited grid
  const climb = (starts) => {
    const seen = new Uint8Array(R * C);
    const queue = [];
    for (const [r, c] of starts) {
      if (!seen[r * C + c]) { seen[r * C + c] = 1; queue.push([r, c]); }
    }
    for (let head = 0; head < queue.length; head++) {
      const [r, c] = queue[head];
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        if (seen[nr * C + nc] || heights[nr][nc] < heights[r][c]) continue;
        seen[nr * C + nc] = 1;
        queue.push([nr, nc]);
      }
    }
    return seen;
  };

  const pacStarts = [], atlStarts = [];
  for (let r = 0; r < R; r++) { pacStarts.push([r, 0]); atlStarts.push([r, C - 1]); }
  for (let c = 0; c < C; c++) { pacStarts.push([0, c]); atlStarts.push([R - 1, c]); }
  const pac = climb(pacStarts), atl = climb(atlStarts);

  const result = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (pac[r * C + c] && atl[r * C + c]) result.push([r, c]);
  return result;
}`,
    explanation: 'Climbing uses `>=`: water flows to equal heights too, so plateaus are connected both ways.',
  },
  dryRun: { columns: ['cell', 'height', 'pac?', 'atl?'], rows: [['(0,4)', '5', 'yes (top row)', 'yes (right column)'], ['(2,2)', '5', 'climbed from (0,2)=2 → (1,2)=3 → (2,2)', 'climbed from (2,4)=1 → (1,4)… → (2,2)'], ['(4,1)', '1', 'no — every Pacific path would have to climb down', 'yes (bottom row)']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Two BFS traversals, each visiting every cell at most once.' },
  alternative: { title: 'Recursive DFS from the borders', md: 'Same reverse idea with recursion: `dfs(r, c, seen)` visits neighbours with height ≥ current. Fine for 200×200 in most engines, but BFS removes the stack-depth risk.', complexity: 'O(m·n) time and space' },
  mistakes: [
    'Using the forward (downhill) direction from every cell → O((m·n)²).',
    'Using `>` instead of `>=` when climbing (equal heights let water flow).',
    'Forgetting that corner cells touch both oceans.',
  ],
};
