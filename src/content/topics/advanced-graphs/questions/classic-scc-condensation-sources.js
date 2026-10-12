export default {
  id: 'classic-scc-condensation-sources',
  title: 'Minimum Starting Nodes via SCC Condensation',
  difficulty: 'Medium',
  order: 3,
  pattern: 'adv-graph-scc-kosaraju',
  tags: ['graph', 'strongly connected components', 'condensation', 'DAG'],
  source: { platform: 'Classic', note: 'Standard condensation-DAG exercise: minimum set of vertices from which every vertex is reachable (cycles allowed).' },

  statement: `A directed graph has \`n\` nodes (\`0 … n-1\`) and edges \`[u, v]\` (an arrow u → v). The graph **may contain cycles**.

You want to pick as few **starting nodes** as possible so that every node in the graph is reachable from at least one starting node (a starting node reaches itself).

Return that **minimum number** of starting nodes.`,
  examples: [
    { input: 'n = 5, edges = [[0,1],[1,2],[2,0],[2,3],[3,4],[4,3]]', output: '1', explanation: 'Start at any of 0, 1, 2 — the cycle reaches 3 and 4.' },
    { input: 'n = 4, edges = [[0,1],[2,1],[3,1]]', output: '3', explanation: 'Nothing reaches 0, 2 or 3, so each must be a start.' },
  ],
  constraints: ['1 <= n <= 10^4', '0 <= edges.length <= 3 * 10^4', 'Self-loops and duplicate edges may appear'],

  think: `- In a DAG the answer is simply "the number of nodes with in-degree 0". Why does that break when there are cycles?
- If you shrink every strongly connected component to one super-node, what kind of graph do you get?
- Which super-nodes MUST contain a starting node?`,
  patternChallenge: {
    options: ['Count nodes with in-degree 0', 'SCC condensation, then count source components', 'Union Find — count connected components', 'BFS from node 0 and count unreached nodes'],
    answer: 1,
    explanation: 'With cycles, a cycle that nothing points into has every in-degree ≥ 1, yet it still needs a start — so plain in-degree counting fails. Condensing SCCs gives a DAG where "in-degree 0" is meaningful again. Union Find ignores direction; BFS from one node says nothing about the minimum.',
  },
  hints: [
    'Compute the SCC id of every node with Kosaraju.',
    'For each edge u → v with comp[u] !== comp[v], the component comp[v] has an incoming edge. The answer is the number of components with no incoming edge.',
  ],
  approach: `**Why in-degree alone fails:** \`0 → 1 → 0\` — both nodes have in-degree 1, yet you still need one start.

**Condensation:**
1. Run Kosaraju to get \`comp[u]\` and the number of components \`c\`.
2. Every cross-component edge u → v marks \`hasIncoming[comp[v]] = true\`.
3. Answer = number of components with \`hasIncoming === false\`.

**Proof of correctness.** *Necessary:* a source component has no incoming edge from outside, so only a start placed inside it can reach it. *Sufficient:* the condensation is a DAG; follow incoming edges backwards from any component and you must stop at a source (no cycles), so every component is reachable from some source; inside an SCC, one node reaches all others.`,

  functionName: 'minStartNodes',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number}
 */
function minStartNodes(n, edges) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Start anywhere on the cycle 0–1–2; it reaches 3 and 4.', args: [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3]]], expected: 1 },
    { scenario: 'Example 2', hint: 'Nothing reaches 0, 2 or 3, so each must be a start.', args: [4, [[0, 1], [2, 1], [3, 1]]], expected: 3 },
    { scenario: 'No edges', hint: 'Every isolated node must be its own start.', args: [4, []], expected: 4 },
    { scenario: 'Single node', hint: 'One node needs one start.', args: [1, []], expected: 1 },
    { scenario: 'Pure cycle', hint: 'No node has in-degree 0, yet one start is needed — counting in-degree-0 nodes returns 0.', args: [3, [[0, 1], [1, 2], [2, 0]]], expected: 1 },
    { scenario: 'Source cycle and isolated pair', hint: 'Cycle {0,1} feeds {2,3}; the separate edge 4 → 5 needs its own start.', args: [6, [[0, 1], [1, 0], [2, 3], [3, 2], [1, 2], [4, 5]]], expected: 2 },
    { scenario: 'Source cycle downstream of nothing', hint: 'Node 2 has in-degree 0 and the cycle {3,4} is also a source component.', args: [5, [[1, 0], [2, 0], [3, 4], [4, 3], [4, 1]]], expected: 2 },
    { scenario: 'Self-loops do not count as incoming', hint: 'A self-loop is an edge INSIDE a component — only edges with comp[u] !== comp[v] make a component non-source.', args: [4, [[0, 0], [1, 1], [0, 1], [2, 3], [3, 2], [3, 0]]], expected: 1 },
    { scenario: 'Duplicate edges', hint: 'Repeated edges change nothing: 0 reaches everything.', args: [3, [[0, 1], [0, 1], [1, 2], [1, 2]]], expected: 1 },
    { scenario: 'Two source cycles into a sink', hint: 'Two separate cycles both point into node 4: two starts.', args: [5, [[0, 1], [1, 0], [2, 3], [3, 2], [1, 4], [3, 4]]], expected: 2 },
    { scenario: 'Big cycle (n = 10^4)', hint: 'One 10 000-node cycle: answer 1. A recursive DFS this deep may overflow the stack.', argsGen: '() => [10000, Array.from({ length: 10000 }, (_, i) => [i, (i + 1) % 10000])]', expected: 1 },
    { scenario: 'Large sparse graph', hint: '10^4 nodes, 3·10^4 mostly forward edges with short back edges: many small SCCs. Reachability searches from every node are O(V·(V+E)).', argsGen: '() => { const n = 10000; let s = 12; const r = () => (s = (s * 48271) % 2147483647); const e = []; while (e.length < 30000) { const a = r() % n; if (r() % 20 === 0) { const b = a + 1 + (r() % 3); if (b < n) e.push([b, a]); } else { const b = a + 1 + (r() % 50); if (b < n) e.push([a, b]); } } return [n, e]; }', expected: 511, timeLimitMs: 500 },
  ],

  solution: {
    code: `function minStartNodes(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { g[u].push(v); rg[v].push(u); }

  // Kosaraju pass 1: finishing order (iterative)
  const seen = new Array(n).fill(false), order = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const stack = [[s, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1], u = top[0];
      if (top[1] < g[u].length) {
        const v = g[u][top[1]++];
        if (!seen[v]) { seen[v] = true; stack.push([v, 0]); }
      } else { order.push(u); stack.pop(); }
    }
  }

  // Kosaraju pass 2: component ids on the transpose
  const comp = new Array(n).fill(-1);
  let c = 0;
  for (let i = n - 1; i >= 0; i--) {
    const s = order[i];
    if (comp[s] !== -1) continue;
    comp[s] = c;
    const stack = [s];
    while (stack.length) {
      const u = stack.pop();
      for (const v of rg[u]) if (comp[v] === -1) { comp[v] = c; stack.push(v); }
    }
    c++;
  }

  // Condensation: which components have an incoming edge from another component?
  const hasIncoming = new Array(c).fill(false);
  for (const [u, v] of edges) {
    if (comp[u] !== comp[v]) hasIncoming[comp[v]] = true;
  }
  let sources = 0;
  for (let k = 0; k < c; k++) if (!hasIncoming[k]) sources++;
  return sources;
}`,
  },
  dryRun: {
    columns: ['step', 'result'],
    rows: [
      ['SCCs of example 1', '{0,1,2} = A, {3,4} = B'],
      ['cross edges', '2 → 3 gives A → B, so B has incoming'],
      ['sources', 'A only'],
      ['answer', '1'],
    ],
  },
  complexity: { time: 'O(V + E)', space: 'O(V + E)', explanation: 'Kosaraju is linear; one more pass over the edges builds the condensation in-degrees.' },
  alternative: {
    title: 'Tarjan SCC + same counting',
    md: "Any SCC algorithm works — Tarjan gives comp ids in one DFS. The counting step is identical. Bonus fact: the minimum number of edges to ADD to make the whole graph strongly connected is max(#sources, #sinks) of the condensation (or 0 if it is already one SCC).",
    complexity: 'O(V + E)',
  },
  mistakes: [
    'Counting nodes with in-degree 0 — misses source cycles.',
    'Counting a component as having incoming because of an edge INSIDE it (check comp[u] !== comp[v]).',
    'Forgetting isolated nodes — each is its own source component.',
  ],
};
