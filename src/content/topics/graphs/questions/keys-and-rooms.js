export default {
  id: 'keys-and-rooms',
  title: 'Keys and Rooms',
  difficulty: 'Medium',
  order: 3,
  pattern: 'graph-dfs',
  tags: ['graph', 'dfs', 'bfs'],
  source: { platform: 'LeetCode', number: 841, url: 'https://leetcode.com/problems/keys-and-rooms/' },

  statement: `There are \`n\` rooms labelled \`0..n-1\`. Every room except room \`0\` starts locked. Room \`i\` contains a set of keys \`rooms[i]\`; each key opens the room with that number.

You start in room 0 and may collect keys and enter any room you have a key for, in any order. Return \`true\` if you can enter **every** room.`,
  examples: [
    { input: 'rooms = [[1],[2],[3],[]]', output: 'true', explanation: '0 → key 1 → 1 → key 2 → 2 → key 3 → 3.' },
    { input: 'rooms = [[1,3],[3,0,1],[2],[0]]', output: 'false', explanation: 'The only key to room 2 is inside room 2.' },
  ],
  constraints: ['2 <= n <= 1000', 'sum of rooms[i].length <= 3000', 'All values in rooms[i] are unique'],

  think: `- If you draw an arrow from room i to every room whose key it holds, what kind of graph do you get?
- "Can I enter every room" means what, in graph language?`,
  patternChallenge: {
    options: ['Topological Sort', 'Directed graph DFS/BFS reachability from room 0', 'Greedy', 'Union-Find'],
    answer: 1,
    explanation: 'Keys are directed edges i → key. Every room is enterable iff every vertex is reachable from 0 — a single traversal. Union-Find ignores direction (holding a key to a room is not symmetric), so it would give wrong answers.',
  },
  hints: [
    '`rooms` is already an adjacency list of a **directed** graph.',
    'DFS/BFS from room 0, count the rooms visited, and compare with n.',
  ],
  approach: `The input is already an adjacency list: room \`i\` has edges to every room in \`rooms[i]\`. Run DFS from 0 with a visited array and count how many rooms you mark. The answer is \`count === n\`. O(n + total keys).`,

  functionName: 'canVisitAllRooms',
  paramNames: ['rooms'],
  starterCode: `/**
 * @param {number[][]} rooms
 * @return {boolean}
 */
function canVisitAllRooms(rooms) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A chain of keys 0 → 1 → 2 → 3 opens every room.', args: [[[1],[2],[3],[]]], expected: true },
    { scenario: 'Example 2', hint: 'The only key to room 2 is inside room 2, so it can never be opened.', args: [[[1,3],[3,0,1],[2],[0]]], expected: false },
    { scenario: 'Two rooms, key in room 0', hint: 'The smallest input: room 0 holds the key to room 1.', args: [[[1],[]]], expected: true },
    { scenario: 'Key points back only', hint: 'Keys are directed: room 1 holding key 0 does not let room 0 open room 1.', args: [[[],[0]]], expected: false },
    { scenario: 'Keys found out of order', hint: 'You may need to visit room 2 before room 1; any traversal order works.', args: [[[2],[],[1]]], expected: true },
    { scenario: 'All keys in room 0', hint: 'Room 0 already has every key.', args: [[[1,2,3],[],[],[]]], expected: true },
    { scenario: 'Two disconnected cycles', hint: 'Rooms 2 and 3 only unlock each other — they are unreachable from room 0.', args: [[[1],[0],[3],[2]]], expected: false },
    { scenario: 'Room holds its own key', hint: 'A room containing its own key (a self-loop) adds nothing new.', args: [[[1],[1],[2]]], expected: false },
    { scenario: 'Key back to room 0', hint: 'Room 0 must be marked visited at the start, or the key to room 0 makes you count it twice.', args: [[[1],[0,2],[0]]], expected: true },
    { scenario: 'Long detour', hint: 'Room 3 opens room 1, which opens room 2 — follow the whole chain.', args: [[[3],[2],[],[1]]], expected: true },
    { scenario: 'Undirected thinking fails', hint: 'Room 2 holds key 0, but nothing holds key 2; treating keys as undirected edges wrongly returns true.', args: [[[1],[],[0,1]]], expected: false },
    { scenario: 'Large chain (n = 1000)', hint: 'Room i holds the key to room i + 1: a 1000-step chain must be followed to the end.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => (i < 999 ? [i + 1] : []))]', expected: true },
    { scenario: 'Large, last room locked', hint: '3000 keys spread over 1000 rooms, but no key opens room 999.', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => [(i + 1) % 999, (i * 7 + 3) % 999, (i * 13 + 5) % 999].filter((v, j, a) => a.indexOf(v) === j))]', expected: false },
  ],

  solution: {
    code: `function canVisitAllRooms(rooms) {
  const n = rooms.length;
  const visited = new Uint8Array(n);
  visited[0] = 1;
  let count = 1;
  const stack = [0];
  while (stack.length) {
    const room = stack.pop();
    for (const key of rooms[room]) {
      if (!visited[key]) {
        visited[key] = 1;
        count++;
        stack.push(key);
      }
    }
  }
  return count === n;
}`,
  },
  dryRun: { columns: ['pop', 'keys found', 'new rooms', 'count'], rows: [['0', '[1,3]', '1, 3', '3'], ['3', '[0]', '—', '3'], ['1', '[3,0,1]', '—', '3'], ['—', 'stack empty', '3 !== 4', 'false']] },
  complexity: { time: 'O(n + k)', space: 'O(n)', explanation: 'k = total number of keys; each room is pushed once and each key examined once.' },
  alternative: { title: 'Recursive DFS', md: 'A recursive `dfs(room)` is shorter and safe for n ≤ 1000.', complexity: 'O(n + k) time, O(n) space' },
  mistakes: [
    'Treating the graph as undirected (a key to room 2 does not let room 2 open room 0).',
    'Forgetting to mark room 0 as visited at the start.',
  ],
};
