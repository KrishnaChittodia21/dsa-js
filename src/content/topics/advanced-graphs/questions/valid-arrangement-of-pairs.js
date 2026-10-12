export default {
  id: 'valid-arrangement-of-pairs',
  title: 'Valid Arrangement of Pairs',
  difficulty: 'Hard',
  order: 4,
  pattern: 'adv-graph-euler-hierholzer',
  tags: ['graph', 'eulerian path', 'hierholzer'],
  source: { platform: 'LeetCode', number: 2097, url: 'https://leetcode.com/problems/valid-arrangement-of-pairs/' },

  statement: `You are given a list of pairs \`pairs[i] = [start, end]\`. Reorder **all** of them so that for every consecutive pair, the \`end\` of one equals the \`start\` of the next:

\`arrangement[i][1] === arrangement[i + 1][0]\`

Return any such arrangement. The input guarantees one exists. Pairs may repeat and a pair may have \`start === end\`.`,
  examples: [
    { input: 'pairs = [[5,1],[4,5],[11,9],[9,4]]', output: '[[11,9],[9,4],[4,5],[5,1]]', explanation: '9 = 9, 4 = 4, 5 = 5.' },
    { input: 'pairs = [[1,3],[3,2],[2,1]]', output: '[[1,3],[3,2],[2,1]]', explanation: 'Any rotation of this cycle is also accepted.' },
    { input: 'pairs = [[1,2],[1,3],[2,1]]', output: '[[1,2],[2,1],[1,3]]' },
  ],
  constraints: ['1 <= pairs.length <= 10^5', '0 <= start, end <= 10^9', 'A valid arrangement exists'],

  think: `- If each pair is an arrow start → end, what does a valid arrangement correspond to?
- Where must the arrangement begin? Look at (out-degree − in-degree) of each number.
- With 10^5 pairs, what does recursion do in JavaScript?`,
  patternChallenge: {
    options: ['Sort by start, then greedily chain', 'Eulerian path with Hierholzer', 'Topological sort of the numbers', 'Two pointers on sorted pairs'],
    answer: 1,
    explanation: 'Each pair is a directed edge; using every pair once in a chain is an Eulerian path. Greedy chaining after sorting gets stuck in dead ends; numbers can repeat along the chain (cycles), so there is no topological order.',
  },
  hints: [
    'Compute balance = out − in for every number. The start is the number with balance +1; if none exists (circuit), any start works.',
    'Run the stack-based Hierholzer to get the node sequence, then convert consecutive nodes back into pairs.',
  ],
  approach: `**Model:** numbers are nodes, pairs are directed edges. A valid arrangement = an Eulerian path.

1. \`adj: Map<number, number[]>\` and \`balance: Map<number, number>\` (out − in).
2. Start node: the one with balance \`+1\`, otherwise \`pairs[0][0]\`.
3. Iterative Hierholzer → node list of length E + 1 (reversed post-order).
4. Output \`[path[i], path[i+1]]\` for each i.

Many answers are valid (e.g. rotations of a cycle), so the tests use a checker: same multiset of pairs, and every end matches the next start.`,

  functionName: 'validArrangement',
  paramNames: ['pairs'],
  starterCode: `/**
 * @param {number[][]} pairs
 * @return {number[][]}
 */
function validArrangement(pairs) {
  
}
`,
  checker: `(output, args) => {
  const pairs = args[0];
  if (!Array.isArray(output) || output.length !== pairs.length) return false;
  const count = new Map();
  for (const [a, b] of pairs) {
    const key = a + ',' + b;
    count.set(key, (count.get(key) || 0) + 1);
  }
  for (let i = 0; i < output.length; i++) {
    const p = output[i];
    if (!Array.isArray(p) || p.length !== 2) return false;
    const key = p[0] + ',' + p[1];
    if (!count.get(key)) return false;         // pair not in input (or used too often)
    count.set(key, count.get(key) - 1);
    if (i > 0 && output[i - 1][1] !== p[0]) return false;
  }
  return true;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Node 11 has out − in = 1, so the walk must start there.', args: [[[5, 1], [4, 5], [11, 9], [9, 4]]], expected: [[11, 9], [9, 4], [4, 5], [5, 1]] },
    { scenario: 'Example 2', hint: 'A pure cycle: every node is balanced, so any start works.', args: [[[1, 3], [3, 2], [2, 1]]], expected: [[1, 3], [3, 2], [2, 1]] },
    { scenario: 'Example 3', hint: 'Start at 1 (out − in = 1). Taking 1 → 3 first would strand [2,1]; Hierholzer splices the detour in.', args: [[[1, 2], [1, 3], [2, 1]]], expected: [[1, 2], [2, 1], [1, 3]] },
    { scenario: 'Single self-loop', hint: 'One pair whose start equals its end.', args: [[[7, 7]]], expected: [[7, 7]] },
    { scenario: 'Repeated pair', hint: '[0,1] appears twice and must be used twice.', args: [[[0, 1], [1, 0], [0, 1]]], expected: [[0, 1], [1, 0], [0, 1]] },
    { scenario: 'Cycle then exit', hint: 'Loop around 1 → 2 → 3 → 4 → 1 before leaving to 5.', args: [[[1, 2], [2, 3], [3, 4], [4, 1], [1, 5]]], expected: [[1, 2], [2, 3], [3, 4], [4, 1], [1, 5]] },
    { scenario: 'Hub with several loops', hint: 'Node 2 is visited three times; all loops must be spliced in before the final 2 → 5.', args: [[[2, 3], [3, 2], [2, 4], [4, 2], [2, 5]]], expected: [[2, 4], [4, 2], [2, 3], [3, 2], [2, 5]] },
    { scenario: 'Values up to 10^9', hint: 'Values are up to 10^9 — use a Map, not an array indexed by value.', args: [[[1000000000, 0], [0, 1000000000], [1000000000, 1000000000]]], expected: [[1000000000, 1000000000], [1000000000, 0], [0, 1000000000]] },
    { scenario: 'Start is not pairs[0][0]', hint: 'pairs[0] starts at 3, but node 1 has out − in = 1: starting at 3 strands edges.', args: [[[3, 4], [2, 3], [1, 2], [4, 1], [1, 5]]], expected: [[1, 2], [2, 3], [3, 4], [4, 1], [1, 5]] },
    { scenario: 'Self-loops along a path', hint: 'Self-loops at 1 and 2 sit in the middle of the walk.', args: [[[2, 2], [1, 2], [1, 1], [2, 3]]], expected: [[1, 1], [1, 2], [2, 2], [2, 3]] },
    { scenario: 'Two chained cycles', hint: 'Two cycles sharing node 0: return all six pairs as pairs, not the node path.', args: [[[0, 1], [1, 0], [0, 2], [2, 3], [3, 0], [0, 4]]], expected: [[0, 2], [2, 3], [3, 0], [0, 1], [1, 0], [0, 4]] },
    { scenario: 'Long reversed chain (10^5)', hint: 'A 10^5-pair chain given back to front: a recursive DFS would be 10^5 calls deep.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => [99999 - i, 100000 - i])]', expectedGen: '() => Array.from({ length: 100000 }, (_, i) => [i, i + 1])', timeLimitMs: 1000 },
    { scenario: 'Big cycle with huge labels', hint: 'A 10^5-pair cycle over labels near 10^9, shuffled: any rotation is accepted.', argsGen: '() => { const n = 100000; let s = 3; const r = () => (s = (s * 48271) % 2147483647); const lab = (i) => 1000000000 - 7 * (i % n); const p = Array.from({ length: n }, (_, i) => [lab(i), lab(i + 1)]); for (let i = n - 1; i > 0; i--) { const j = r() % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } return [p]; }', expectedGen: '() => { const n = 100000; const lab = (i) => 1000000000 - 7 * (i % n); return Array.from({ length: n }, (_, i) => [lab(i), lab(i + 1)]); }', timeLimitMs: 1000 },
  ],

  solution: {
    code: `function validArrangement(pairs) {
  const adj = new Map();
  const balance = new Map();                       // out-degree − in-degree
  for (const [u, v] of pairs) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(v);
    balance.set(u, (balance.get(u) ?? 0) + 1);
    balance.set(v, (balance.get(v) ?? 0) - 1);
  }

  let start = pairs[0][0];
  for (const [node, b] of balance) {
    if (b === 1) { start = node; break; }          // path must begin here
  }

  // Iterative Hierholzer (no recursion → safe for 10^5 pairs)
  const stack = [start];
  const path = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const out = adj.get(u);
    if (out && out.length) stack.push(out.pop());
    else path.push(stack.pop());
  }
  path.reverse();

  const result = [];
  for (let i = 0; i + 1 < path.length; i++) result.push([path[i], path[i + 1]]);
  return result;
}`,
  },
  dryRun: {
    columns: ['step', 'detail'],
    rows: [
      ['balance', '5: 0, 1: −1, 4: 0, 11: +1, 9: 0 → start = 11'],
      ['walk', '11 → 9 → 4 → 5 → 1 (1 has no out-edges → pop)'],
      ['pops', '1, 5, 4, 9, 11 → reversed path [11, 9, 4, 5, 1]'],
      ['pairs', '[11,9], [9,4], [4,5], [5,1]'],
    ],
  },
  complexity: { time: 'O(E)', space: 'O(E)', explanation: 'Every pair is pushed and popped once; Maps give O(1) average lookups for large number labels.' },
  alternative: {
    title: 'Recursive Hierholzer',
    md: '`dfs(u) { while (adj[u].length) dfs(adj[u].pop()); path.push(u); }` — shortest to write, but a chain of 10^5 pairs recurses 10^5 deep and crashes in JavaScript.',
    complexity: 'O(E) time, O(E) recursion depth',
  },
  mistakes: [
    'Starting at pairs[0][0] when some node has out − in = 1 — the walk strands edges.',
    'Using a plain array indexed by value — values go up to 10^9; use a Map.',
    'Recursion on long chains.',
    'Returning the node path instead of converting it back to pairs.',
  ],
};
