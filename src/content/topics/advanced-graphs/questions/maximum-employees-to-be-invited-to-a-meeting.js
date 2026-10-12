export default {
  id: 'maximum-employees-to-be-invited-to-a-meeting',
  title: 'Maximum Employees to Be Invited to a Meeting',
  difficulty: 'Hard',
  order: 7,
  pattern: 'adv-graph-functional',
  tags: ['graph', 'functional graph', 'topological sort', 'cycles'],
  source: { platform: 'LeetCode', number: 2127, url: 'https://leetcode.com/problems/maximum-employees-to-be-invited-to-a-meeting/' },

  statement: `\`n\` employees (\`0 … n-1\`) are invited to a meeting at a **round table** that can seat any number of people. Employee \`i\` has exactly one favourite person \`favorite[i]\` (never themself), and will only attend if they can sit **next to** their favourite.

Return the **maximum number** of employees that can be invited.`,
  examples: [
    { input: 'favorite = [2,2,1,2]', output: '3', explanation: 'Seat 0, 1, 2 (or 3, 1, 2): 1 and 2 like each other; 0 sits next to 2. 0 and 3 cannot both sit next to 2 with 1 also there.' },
    { input: 'favorite = [1,2,0]', output: '3', explanation: 'A 3-cycle: everyone sits between their favourite and the person who likes them.' },
    { input: 'favorite = [3,0,1,4,1]', output: '4', explanation: 'Cycle 0→3→4→1→0; employee 2 cannot be seated.' },
  ],
  constraints: ['2 <= n <= 10^5', '0 <= favorite[i] < n', 'favorite[i] !== i'],

  think: `- Every node has exactly one outgoing arrow. What shape must each connected piece of this graph have?
- If a cycle has length ≥ 3, can anyone outside it join the table?
- What is special about a cycle of length 2 (two people who like each other)? Can several such groups share one table?`,
  patternChallenge: {
    options: ['Backtracking over seatings', 'Kosaraju SCC and take the largest SCC', 'Functional graph: peel trees with in-degree, then compare the largest cycle with the sum over 2-cycles of (2 + two longest chains)', 'Union Find, take the largest component'],
    answer: 2,
    explanation: 'One outgoing edge per node → functional graph = cycles with in-trees. A big cycle fills a table on its own; 2-cycles can carry chains and can all be combined. The largest SCC misses the chain + 2-cycle case; Union Find ignores direction; backtracking is exponential.',
  },
  hints: [
    'Run Kahn\'s algorithm on in-degrees to peel off all tree nodes, computing depth[v] = longest chain of tree nodes that ends at v. Remaining nodes are on cycles.',
    'Walk each remaining cycle. Length 2 (a ↔ b): add 2 + depth[a] + depth[b] to a running sum. Length ≥ 3: candidate = its length. Answer = max(best cycle, sum).',
  ],
  approach: `**Shape:** following favourites from any person eventually loops, so each component is one cycle with trees pointing into it.

**Case A — a cycle of length ≥ 3.** Seat the cycle in order; each person's favourite is beside them. Both neighbours of every seat are taken by cycle members, so nobody else fits. Candidate: cycle length.

**Case B — a mutual pair a ↔ b.** a and b already satisfy each other with *one* neighbour each, leaving the other side free. A chain x → y → a can line up on a's free side, and another chain on b's side. The group is a *line*: ends are free, so several such lines can be concatenated around one table. Candidate: Σ over all pairs of (2 + depth[a] + depth[b]).

**Algorithm (O(n)):**
1. \`indeg\` for every node; Kahn queue of in-degree-0 nodes; while peeling u → v: \`depth[v] = max(depth[v], depth[u] + 1)\`.
2. Nodes with \`indeg > 0\` left are on cycles; walk each cycle once, measuring length.
3. Answer = max(largest cycle with length ≥ 3, sum over 2-cycles).`,

  functionName: 'maximumInvitations',
  paramNames: ['favorite'],
  starterCode: `/**
 * @param {number[]} favorite
 * @return {number}
 */
function maximumInvitations(favorite) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '1 and 2 like each other (a 2-cycle); only one of the chains 0 → 2 / 3 → 2 fits next to 2.', args: [[2, 2, 1, 2]], expected: 3 },
    { scenario: 'Example 2', hint: 'A 3-cycle: everyone sits between their favourite and their admirer.', args: [[1, 2, 0]], expected: 3 },
    { scenario: 'Example 3', hint: 'The 4-cycle 0→3→4→1→0 fills the table; employee 2 cannot join a cycle of length ≥ 3.', args: [[3, 0, 1, 4, 1]], expected: 4 },
    { scenario: 'Smallest: one mutual pair', hint: 'Two people who like each other: both attend.', args: [[1, 0]], expected: 2 },
    { scenario: 'Two mutual pairs', hint: 'Every 2-cycle (plus its chains) can sit at the same table — sum them, do not take only the best one.', args: [[1, 0, 3, 2]], expected: 4 },
    { scenario: 'Single 5-cycle', hint: 'The whole group is one cycle.', args: [[1, 2, 3, 4, 0]], expected: 5 },
    { scenario: 'Pair with long chain', hint: '4 → 3 → 2 → 0 hangs off the pair {0,1}: the chain length counts edges correctly, giving 5.', args: [[1, 0, 0, 2, 3]], expected: 5 },
    { scenario: 'Big cycle vs pair with chains', hint: 'Compare the largest cycle (3) with the sum over 2-cycles plus chains (4).', args: [[1, 2, 0, 4, 3, 3, 5]], expected: 4 },
    { scenario: 'Chains into a 2-cycle on both sides', hint: 'Chains attach to both ends of a pair; take the longest chain at each end.', args: [[1, 0, 1, 2, 0, 4, 3, 6]], expected: 8 },
    { scenario: 'Chains cannot extend big cycles', hint: 'A 4-cycle with three admirers of node 4: the admirers cannot squeeze in, answer stays 4.', args: [[1, 2, 3, 0, 5, 4, 4, 4]], expected: 4 },
    { scenario: 'Many admirers, one pair', hint: 'Five people like node 0 but only one chain per side fits: 2 + 1 = 3.', args: [[1, 0, 0, 0, 0, 0, 0]], expected: 3 },
    { scenario: 'Many pairs (n = 10^5)', hint: '50 000 mutual pairs: all of them attend together. Summing pairs, not taking the best one, gives 10^5.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => i ^ 1)]', expected: 100000 },
    { scenario: 'Long chain into a pair (n = 10^5)', hint: 'A 99 998-long chain feeds a 2-cycle. the chain depth must be counted in edges, not nodes, giving 10^5.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i === 0 ? 1 : i - 1))]', expected: 100000 },
    { scenario: 'Star of admirers (n = 10^5)', hint: '99 998 people all like node 0, which is in a pair with 1: only one admirer fits, answer 3. The Kahn queue holds ~10^5 nodes at once — queue.shift() is O(n) per pop here; use a head index.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i === 0 ? 1 : 0))]', expected: 3, timeLimitMs: 300 },
    { scenario: 'Giant cycle vs pairs', hint: 'A 60 000-cycle beats 20 000 pairs (40 000 people): the answer is the larger option, not their sum.', argsGen: '() => [Array.from({ length: 100000 }, (_, i) => (i < 60000 ? (i + 1) % 60000 : i ^ 1))]', expected: 60000 },
  ],

  solution: {
    code: `function maximumInvitations(favorite) {
  const n = favorite.length;
  const indeg = new Array(n).fill(0);
  for (const f of favorite) indeg[f]++;

  // 1. Peel tree nodes (Kahn). depth[v] = longest chain of tree nodes ending at v.
  const depth = new Array(n).fill(0);
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head], v = favorite[u];
    depth[v] = Math.max(depth[v], depth[u] + 1);
    if (--indeg[v] === 0) queue.push(v);
  }

  // 2. Remaining nodes lie on cycles. Measure each cycle once.
  let bestCycle = 0, pairsTotal = 0;
  const done = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (indeg[i] === 0 || done[i]) continue;
    let len = 0, j = i;
    while (!done[j]) { done[j] = true; j = favorite[j]; len++; }
    if (len === 2) pairsTotal += 2 + depth[i] + depth[favorite[i]];
    else bestCycle = Math.max(bestCycle, len);
  }
  return Math.max(bestCycle, pairsTotal);
}`,
    explanation: 'The queue is an array with a moving `head` index — `shift()` would make Kahn O(n²).',
  },
  dryRun: {
    columns: ['step', 'favorite = [1,0,0,2,3]'],
    rows: [
      ['in-degrees', '0:2, 1:1, 2:1, 3:1, 4:0'],
      ['peel 4', 'depth[3] = 1; indeg[3] → 0, push 3'],
      ['peel 3', 'depth[2] = 2; push 2'],
      ['peel 2', 'depth[0] = 3; indeg[0] → 1 (still on cycle)'],
      ['cycles', '0 ↔ 1 (length 2): 2 + depth[0] + depth[1] = 2 + 3 + 0 = 5'],
      ['answer', 'max(0, 5) = 5'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each node is peeled at most once and each cycle node is walked once.' },
  alternative: {
    title: 'Reverse-graph DFS for chain lengths',
    md: 'Build the reverse adjacency (who likes me). For each 2-cycle (a, b), run a BFS/DFS from a in the reverse graph avoiding b to get the longest chain, and vice versa. Same O(n), a bit more code; recursion depth can reach 10^5 so prefer BFS.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Taking only the best single 2-cycle instead of summing all of them.',
    'Adding chains to cycles of length ≥ 3 (impossible — no free seats).',
    'Using `queue.shift()` for Kahn — O(n) per call.',
    'Computing depth as number of NODES in the chain including the cycle node (off by one).',
  ],
};
