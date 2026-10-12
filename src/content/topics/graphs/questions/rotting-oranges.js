export default {
  id: 'rotting-oranges',
  title: 'Rotting Oranges',
  difficulty: 'Medium',
  order: 5,
  pattern: 'multi-source-bfs',
  tags: ['grid', 'bfs', 'multi-source bfs'],
  source: { platform: 'LeetCode', number: 994, url: 'https://leetcode.com/problems/rotting-oranges/' },

  statement: `A grid contains \`0\` (empty cell), \`1\` (fresh orange) and \`2\` (rotten orange). Every minute, each fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.

Return the minimum number of minutes until no fresh orange remains. If some fresh orange can never rot, return \`-1\`.`,
  examples: [
    { input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' },
    { input: 'grid = [[2,1,1],[0,1,1],[1,0,1]]', output: '-1', explanation: 'The bottom-left orange is walled off.' },
    { input: 'grid = [[0,2]]', output: '0', explanation: 'No fresh oranges at the start.' },
  ],
  constraints: ['1 <= m, n <= 10', 'grid[i][j] is 0, 1 or 2'],

  think: `- All rotten oranges spread **at the same time**. How do you simulate that without one BFS per rotten orange?
- How do you know which minute you are in?
- How will you detect oranges that never rot?`,
  patternChallenge: {
    options: ['DFS from each rotten orange', 'Multi-source BFS', 'Dynamic Programming', 'Greedy by row'],
    answer: 1,
    explanation: '"Every minute, spreads to neighbours" from many starting points simultaneously = multi-source BFS: seed the queue with all rotten oranges; each BFS layer is one minute. DFS does not follow time order, so it would compute wrong minutes.',
  },
  hints: [
    'Put every rotten orange in the queue at time 0 and count the fresh oranges.',
    'BFS: when a fresh neighbour rots, record time + 1 and decrement the fresh count. The answer is the last time assigned, or -1 if fresh > 0 at the end.',
  ],
  approach: `**Brute force:** simulate minute by minute — scan the whole grid each minute and rot the neighbours of rotten oranges. O((m·n)²) in the worst case.

**Multi-source BFS:** enqueue all rotten cells with time 0 and count \`fresh\`. Pop a cell; for each fresh neighbour: make it rotten, \`fresh--\`, enqueue with \`time + 1\`, and track \`minutes = time + 1\`. At the end return \`fresh === 0 ? minutes : -1\`. Each cell is enqueued at most once → O(m·n).`,

  functionName: 'orangesRotting',
  paramNames: ['grid'],
  starterCode: `/**
 * @param {number[][]} grid
 * @return {number}
 */
function orangesRotting(grid) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Rot spreads one layer per minute; the farthest orange rots at minute 4.', args: [[[2,1,1],[1,1,0],[0,1,1]]], expected: 4 },
    { scenario: 'Example 2', hint: 'The bottom-left orange is walled off by empty cells — return -1.', args: [[[2,1,1],[0,1,1],[1,0,1]]], expected: -1 },
    { scenario: 'Example 3', hint: 'No fresh oranges at the start: the answer is 0 minutes.', args: [[[0,2]]], expected: 0 },
    { scenario: 'Single empty cell', hint: 'Nothing fresh, nothing rotten: 0, not -1.', args: [[[0]]], expected: 0 },
    { scenario: 'Single fresh orange', hint: 'A fresh orange with no rotten source can never rot: -1.', args: [[[1]]], expected: -1 },
    { scenario: 'Single rotten orange', hint: 'Only a rotten orange: no time is needed.', args: [[[2]]], expected: 0 },
    { scenario: 'Two sources meet in the middle', hint: 'All rotten oranges start at minute 0 together; a BFS from each source separately would answer 3 instead of 2.', args: [[[2,1,1,1,2]]], expected: 2 },
    { scenario: 'Fresh but no rotten at all', hint: 'Several fresh oranges and no rotten one — the answer is -1.', args: [[[1,1],[1,0]]], expected: -1 },
    { scenario: 'Already-rotten neighbours', hint: 'Multiple rotten cells rot the row below in one minute.', args: [[[2,2],[1,1],[0,0],[2,0]]], expected: 1 },
    { scenario: 'Single source in a corner', hint: 'Do not count the final empty BFS layer — the last orange rots at minute 4.', args: [[[1,1,1],[1,1,1],[1,1,2]]], expected: 4 },
    { scenario: 'Diagonal does not spread', hint: 'Rot only spreads up/down/left/right; a diagonal fresh orange stays fresh.', args: [[[2,0],[0,1]]], expected: -1 },
    { scenario: 'Snake path (10×10)', hint: 'Rot must wind through a long corridor; the minute count equals the path length.', args: [[[2,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1]]], expected: 54 },
    { scenario: 'Full 10×10, one isolated', hint: 'Everything rots except one fresh orange in a sealed corner — return -1.', args: [[[2,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,1,0,1]]], expected: -1 },
  ],

  solution: {
    code: `function orangesRotting(grid) {
  const R = grid.length, C = grid[0].length;
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === 2) queue.push([r, c, 0]);   // every source at time 0
      else if (grid[r][c] === 1) fresh++;
    }
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  for (let head = 0; head < queue.length; head++) {
    const [r, c, t] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] !== 1) continue;
      grid[nr][nc] = 2;              // rot now = visited
      fresh--;
      minutes = t + 1;
      queue.push([nr, nc, t + 1]);
    }
  }
  return fresh === 0 ? minutes : -1;
}`,
    explanation: 'Because BFS pops cells in time order, the last assignment of `minutes` is the maximum time.',
  },
  dryRun: { columns: ['minute', 'newly rotten', 'fresh left'], rows: [['0', '(0,0) is the source', '6'], ['1', '(0,1), (1,0)', '4'], ['2', '(0,2), (1,1)', '2'], ['3', '(2,1)', '1'], ['4', '(2,2)', '0 → answer 4']] },
  complexity: { time: 'O(m·n)', space: 'O(m·n)', explanation: 'Each cell enters the queue at most once.' },
  alternative: { title: 'Level-by-level BFS', md: 'Process the queue one layer at a time and count layers; subtract one at the end (or only count layers that rotted something).', complexity: 'O(m·n) time and space' },
  mistakes: [
    'Running a separate BFS from each rotten orange.',
    'Returning -1 when there were no fresh oranges at all (the answer is 0).',
    'Counting BFS layers including the final empty layer → off by one.',
  ],
};
