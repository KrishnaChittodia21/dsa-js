export default {
  id: 'nearest-exit-from-entrance-in-maze',
  title: 'Nearest Exit from Entrance in Maze',
  difficulty: 'Medium',
  order: 1,
  pattern: 'shortest-path-unweighted-bfs',
  tags: ['grid', 'bfs', 'shortest path'],
  source: { platform: 'LeetCode', number: 1926, url: 'https://leetcode.com/problems/nearest-exit-from-entrance-in-maze/' },

  statement: `You are given a maze as a grid of characters: \`'.'\` is an empty cell and \`'+'\` is a wall. You start at \`entrance = [row, col]\` (an empty cell). Each step moves one cell up, down, left or right into an empty cell.

An **exit** is an empty cell on the **border** of the maze. The entrance itself does **not** count as an exit. Return the number of steps on the shortest route to the nearest exit, or \`-1\` if no exit is reachable.`,
  examples: [
    { input: 'maze = [["+","+",".","+"],[".",".",".","+"],["+","+","+","."]], entrance = [1,2]', output: '1', explanation: 'Moving up from (1,2) reaches (0,2), a border cell.' },
    { input: 'maze = [["+","+","+"],[".",".","."],["+","+","+"]], entrance = [1,0]', output: '2', explanation: '(1,0) is on the border but is the entrance; (1,2) is two steps away.' },
    { input: 'maze = [[".","+"]], entrance = [0,0]', output: '-1' },
  ],
  constraints: ['1 <= rows, cols <= 100', "maze[i][j] is '.' or '+'", 'entrance is an empty cell'],

  think: `- Every step costs 1. Which traversal guarantees that the first exit found is the nearest?
- When should you mark a cell visited so it is not enqueued twice?
- How do you exclude the entrance from being an exit?`,
  patternChallenge: {
    options: ['DFS returning the first exit found', 'BFS from the entrance, level by level', 'Dijkstra with a heap', 'Union-Find'],
    answer: 1,
    explanation: 'All moves cost 1, so BFS reaches cells in increasing distance — the first exit it meets is the nearest. DFS finds *an* exit, not the nearest; Dijkstra works but a heap is unnecessary with equal weights; Union-Find gives connectivity, not distance.',
  },
  hints: [
    'Start a BFS at the entrance with distance 0. Mark cells visited when you enqueue them (you can overwrite them with "+" to save a visited array).',
    'When you are about to enqueue a neighbour that lies on the border, you have found the answer: current steps + 1.',
  ],
  approach: `**Brute force:** DFS every route and keep the shortest one reaching a border cell — exponential.

**Optimized (BFS):**
1. Queue = [entrance], mark it visited.
2. Process level by level; \`steps\` counts levels.
3. For each neighbour that is in bounds and empty: if it is on the border, return \`steps + 1\`; otherwise mark and enqueue.
4. Queue empty → \`-1\`.

Because the entrance is marked before the loop and only *neighbours* are tested for being exits, the entrance can never be returned.`,

  functionName: 'nearestExit',
  paramNames: ['maze', 'entrance'],
  starterCode: `/**
 * @param {character[][]} maze
 * @param {number[]} entrance
 * @return {number}
 */
function nearestExit(maze, entrance) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Moving up from (1,2) reaches the border cell (0,2).', args: [[['+', '+', '.', '+'], ['.', '.', '.', '+'], ['+', '+', '+', '.']], [1, 2]], expected: 1 },
    { scenario: 'Example 2', hint: 'The entrance is on the border but is not an exit; the real exit is 2 steps away.', args: [[['+', '+', '+'], ['.', '.', '.'], ['+', '+', '+']], [1, 0]], expected: 2 },
    { scenario: 'Example 3', hint: 'The only empty cell is the entrance — no exit at all.', args: [[['.', '+']], [0, 0]], expected: -1 },
    { scenario: 'Single cell maze', hint: 'A 1×1 maze: the entrance is the only cell and cannot be an exit.', args: [[['.']], [0, 0]], expected: -1 },
    { scenario: 'Adjacent exit in a row', hint: 'In a 1-row maze every cell is on the border; the neighbour is an exit.', args: [[['.', '.']], [0, 1]], expected: 1 },
    { scenario: 'Entrance on border, exit far', hint: 'Returning 0 because the entrance touches the border is the classic bug; the real exit is 4 steps away.', args: [[['+', '+', '+', '+'], ['.', '.', '.', '+'], ['+', '+', '.', '+'], ['+', '+', '.', '+']], [1, 0]], expected: 4 },
    { scenario: 'Corridor down to an exit', hint: 'A vertical corridor: the exit is at the top, two steps up.', args: [[['+', '.', '+'], ['+', '.', '+'], ['+', '.', '+'], ['+', '+', '+']], [2, 1]], expected: 2 },
    { scenario: 'Walled-in room', hint: 'The empty cells never touch the border — return -1.', args: [[['+', '+', '+', '+'], ['+', '.', '.', '+'], ['+', '.', '.', '+'], ['+', '+', '+', '+']], [1, 1]], expected: -1 },
    { scenario: 'DFS finds a far exit first', hint: 'Depth-first search may return a distant exit; only BFS guarantees the nearest one.', args: [[['+', '+', '+', '+', '+'], ['.', '.', '.', '+', '+'], ['+', '+', '.', '+', '+'], ['+', '+', '.', '.', '+'], ['+', '+', '+', '.', '+']], [1, 2]], expected: 2 },
    { scenario: 'Spiral inner room', hint: 'The entrance sits in the middle; the route winds around walls.', args: [[['.', '.', '.', '.', '.'], ['.', '+', '+', '+', '.'], ['.', '+', '.', '+', '.'], ['.', '+', '.', '.', '.'], ['.', '+', '+', '+', '.']], [2, 2]], expected: 3 },
    { scenario: 'Several exits at once', hint: 'Exits in several directions — return the smallest step count.', args: [[['+', '.', '+'], ['.', '.', '.'], ['+', '.', '+']], [1, 1]], expected: 1 },
    { scenario: 'Large snake maze (100×100)', hint: 'A long winding corridor: BFS visits each cell once, O(rows·cols). Mark cells when enqueuing so none is queued twice.', argsGen: '() => { const n = 100, m = Array.from({ length: n }, () => new Array(n).fill(\'+\')); for (let r = 1; r < n - 1; r += 2) { for (let c = 1; c < n - 1; c++) m[r][c] = \'.\'; if (r + 2 < n - 1) m[r + 1][(r >> 1) % 2 === 0 ? n - 2 : 1] = \'.\'; } m[0][1] = \'.\'; return [m, [97, 50]]; }', expected: 4802, timeLimitMs: 1000 },
    { scenario: 'Large open maze (100×100)', hint: 'Wide open grid with the entrance in the middle: plain BFS reaches the border in 49 levels.', argsGen: '() => [Array.from({ length: 100 }, () => new Array(100).fill(".")), [49, 49]]', expected: 49, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function nearestExit(maze, entrance) {
  const R = maze.length, C = maze[0].length;
  const [sr, sc] = entrance;
  maze[sr][sc] = '+';                       // mark visited
  let frontier = [[sr, sc]];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (let steps = 0; frontier.length; steps++) {
    const next = [];
    for (const [r, c] of frontier) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || maze[nr][nc] !== '.') continue;
        if (nr === 0 || nc === 0 || nr === R - 1 || nc === C - 1) return steps + 1;
        maze[nr][nc] = '+';                 // mark when enqueued
        next.push([nr, nc]);
      }
    }
    frontier = next;
  }
  return -1;
}`,
    explanation: 'Level arrays avoid `queue.shift()` (O(n)) and make `steps` equal to the BFS level. Overwriting cells with "+" doubles as the visited set (mention to the interviewer that it mutates the input; copy it if that matters).',
  },
  dryRun: {
    columns: ['level', 'frontier', 'neighbours checked', 'result'],
    rows: [
      ['0', '(1,0)', '(1,1) — not on border (row 1 of 3, col 1 of 3)', 'enqueue (1,1)'],
      ['1', '(1,1)', '(1,2) — border cell', 'return 2'],
    ],
  },
  complexity: { time: 'O(R·C)', space: 'O(R·C)', explanation: 'Each cell is enqueued at most once; the frontier holds at most O(R·C) cells.' },
  alternative: {
    title: 'Multi-source BFS from all exits',
    md: 'Put every border empty cell (except the entrance) into the first frontier and BFS until you reach the entrance. Same complexity — useful if you had many entrances to answer.',
    complexity: 'O(R·C) time and space',
  },
  mistakes: [
    'Counting the entrance as an exit when it is on the border.',
    'Marking visited when dequeuing, which enqueues cells many times.',
    'Using DFS and returning the first exit found (not necessarily the nearest).',
    'Using `queue.shift()` on large grids (O(n) per call).',
  ],
};
