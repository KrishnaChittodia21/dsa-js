export default {
  id: 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree',
  title: 'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree',
  difficulty: 'Hard',
  order: 2,
  pattern: 'mst-edge-classification',
  tags: ['graph', 'minimum spanning tree', 'union find', 'sorting'],
  source: { platform: 'LeetCode', number: 1489, url: 'https://leetcode.com/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree/' },

  statement: `You are given a connected undirected weighted graph with \`n\` nodes (\`0\` … \`n - 1\`) and \`edges[i] = [a, b, w]\`. Edges are identified by their **index** \`i\`.

- An edge is **critical** if it belongs to **every** MST — removing it from the graph makes the MST weight larger (or makes a spanning tree impossible).
- An edge is **pseudo-critical** if it belongs to **some but not all** MSTs.

Return \`[critical, pseudoCritical]\`: two lists of edge indices, each in any order.`,
  examples: [
    { input: 'n = 5, edges = [[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]', output: '[[0,1],[2,3,4,5]]', explanation: 'Edges 0 and 1 are in every MST (weight 7). Edges 2,3 are interchangeable, as are 4,5. Edge 6 is in no MST.' },
    { input: 'n = 4, edges = [[0,1,1],[1,2,1],[2,3,1],[0,3,1]]', output: '[[],[0,1,2,3]]', explanation: 'Any 3 of the 4 equal edges form an MST.' },
  ],
  constraints: ['2 <= n <= 100', '1 <= edges.length <= min(200, n·(n−1)/2)', '1 <= w <= 1000', 'No parallel edges; the graph is connected'],

  think: `- Compute the MST weight \`best\` once. What happens to the MST weight if an edge is banned?
- If banning an edge does not change \`best\`, how can you check whether it can still appear in some MST?
- Why is "it is in my MST" NOT enough to call it critical?`,
  patternChallenge: {
    options: ['Bridges in a graph (Tarjan)', 'Kruskal re-run with each edge banned / forced', 'Dijkstra from every node', 'Topological sort'],
    answer: 1,
    explanation: 'Criticality is defined through MST weights, so compute them: ban edge i → heavier (or impossible) means critical; force edge i → still best means pseudo-critical. m ≤ 200 makes m Kruskal runs cheap. Bridges ignore weights (a non-bridge can still be critical); Dijkstra and topological sort answer unrelated questions.',
  },
  hints: [
    'Sort edges once, but keep each edge\'s original index: `edges.map((e, i) => [...e, i])`.',
    'Write `mst(skip, force)`: pre-union the forced edge (adding its weight), skip the banned one, return Infinity if not connected. Critical: `mst(i, -1) > best`. Otherwise pseudo-critical if `mst(-1, i) === best`.',
  ],
  approach: `**Brute force:** enumerate all spanning trees and check which edges appear in the minimum ones — exponential.

**Ban / force re-runs:**
1. Attach indices and sort by weight. \`best = mst(-1, -1)\`.
2. For each edge i:
   - \`mst(skip = i) > best\` (including Infinity when the graph falls apart) → **critical**: no MST can avoid it.
   - else if \`mst(force = i) === best\` → **pseudo-critical**: some MST contains it, and not all do (because a ban did not hurt).
   - else it belongs to no MST.

Why forcing works: pre-uniting edge i and then running Kruskal gives the cheapest spanning tree that contains i (the cut property still applies to every later choice). Each run is O(m α(n)); total O(m²) after one sort — ~40,000 operations here.`,

  functionName: 'findCriticalAndPseudoCriticalEdges',
  paramNames: ['n', 'edges'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} edges
 * @return {number[][]} [critical, pseudoCritical]
 */
function findCriticalAndPseudoCriticalEdges(n, edges) {
  
}
`,
  // [critical, pseudoCritical] — order inside each list doesn't matter, but the two lists must not be swapped.
  checker: `(out, args, expected) => {
    if (!Array.isArray(out) || out.length !== 2 || !out.every(Array.isArray)) return false;
    const norm = (xs) => [...xs].sort((a, b) => a - b).join(',');
    return norm(out[0]) === norm(expected[0]) && norm(out[1]) === norm(expected[1]);
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'Edges 0, 1 are in every MST; 2/3 and 4/5 are interchangeable; edge 6 is in none.', args: [5, [[0, 1, 1], [1, 2, 1], [2, 3, 2], [0, 3, 2], [0, 4, 3], [3, 4, 3], [1, 4, 6]]], expected: [[0, 1], [2, 3, 4, 5]] },
    { scenario: 'Example 2', hint: 'Any 3 of the 4 equal edges form an MST, so all are pseudo-critical.', args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]]], expected: [[], [0, 1, 2, 3]] },
    { scenario: 'Single edge', hint: 'Banning the only edge disconnects the graph — that makes it critical. Return Infinity from the ban run, not a partial sum.', args: [2, [[0, 1, 5]]], expected: [[0], []] },
    { scenario: 'Distinct weights', hint: 'With distinct weights the MST is unique: tree edges are critical, the rest belong to none.', args: [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]]], expected: [[0, 1], []] },
    { scenario: 'Equal triangle', hint: 'Any two of three equal edges: all pseudo-critical.', args: [3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]]], expected: [[], [0, 1, 2]] },
    { scenario: 'Bridge plus tie', hint: 'Edge 3 is a bridge (critical); the triangle edges are interchangeable.', args: [4, [[0, 1, 1], [1, 2, 1], [2, 0, 1], [2, 3, 4]]], expected: [[3], [0, 1, 2]] },
    { scenario: 'One MST is not enough', hint: 'Your Kruskal run picks one of edges 1 and 2 — classifying by membership in that single MST misfiles both.', args: [3, [[0, 1, 1], [1, 2, 2], [0, 2, 2]]], expected: [[0], [1, 2]] },
    { scenario: 'Critical before pseudo', hint: 'Forcing a critical edge also gives the best weight; test the ban (critical) first or it is filed as pseudo-critical.', args: [4, [[0, 1, 2], [1, 2, 2], [0, 2, 2], [2, 3, 1]]], expected: [[3], [0, 1, 2]] },
    { scenario: 'Mixed six-node graph', hint: 'Tree edges, tied cycles and a useless heavy edge all in one graph.', args: [6, [[0, 1, 1], [1, 2, 1], [0, 2, 2], [2, 3, 3], [3, 4, 2], [4, 5, 2], [3, 5, 2], [1, 5, 9]]], expected: [[0, 1, 3], [4, 5, 6]] },
    { scenario: 'Heavy edge in no MST', hint: 'An edge heavier than every edge on its cycle is in no MST — list it nowhere.', args: [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1000]]], expected: [[0, 1, 2], []] },
    { scenario: 'Indices after sorting', hint: 'Edges arrive unsorted; report ORIGINAL indices, not positions in your sorted copy.', args: [4, [[2, 3, 7], [0, 1, 1], [1, 2, 3], [0, 3, 9]]], expected: [[0, 1, 2], []] },
    { scenario: 'Large, many ties (m = 200)', hint: 'Weights 1..3 create lots of ties. One ban and one force run per edge is O(m²·α) — fine at m = 200.', argsGen: '() => { let x = 55; const r = () => (x = (x * 48271) % 2147483647); const n = 100, e = [], seen = new Set(); const add = (a, b) => { const k = Math.min(a, b) * 1000 + Math.max(a, b); if (a === b || seen.has(k)) return; seen.add(k); e.push([a, b, 1 + r() % 3]); }; for (let i = 1; i < n; i++) add(r() % i, i); while (e.length < 200) add(r() % n, r() % n); return [n, e]; }', expected: [[2, 10, 12, 13, 19, 20, 23, 27, 29, 30, 31, 33, 34, 37, 39, 40, 41, 42, 44, 45, 48, 50, 57, 58, 59, 60, 61, 65, 67, 75, 76, 79, 80, 83, 96, 97, 98, 100, 101, 103, 104, 105, 107, 114, 117, 118, 119, 123, 128, 132, 134, 135, 138, 141, 142, 143, 144, 145, 147, 153, 154, 155, 162, 163, 169, 173, 184, 186, 191, 193, 194, 195, 199], [1, 6, 9, 11, 14, 15, 18, 25, 28, 32, 36, 43, 49, 51, 52, 55, 56, 62, 64, 66, 74, 78, 86, 87, 89, 91, 99, 106, 108, 111, 115, 116, 121, 122, 126, 127, 130, 133, 137, 149, 161, 165, 167, 168, 172, 174, 175, 178, 180, 182, 183, 187, 188, 189, 190]], timeLimitMs: 1000 },
    { scenario: 'Large, distinct-ish (m = 200)', hint: 'Mostly distinct weights: nearly every tree edge is critical.', argsGen: '() => { let x = 66; const r = () => (x = (x * 48271) % 2147483647); const n = 100, e = [], seen = new Set(); const add = (a, b) => { const k = Math.min(a, b) * 1000 + Math.max(a, b); if (a === b || seen.has(k)) return; seen.add(k); e.push([a, b, 1 + r() % 1000]); }; for (let i = 1; i < n; i++) add(r() % i, i); while (e.length < 200) add(r() % n, r() % n); return [n, e]; }', expected: [[0, 1, 4, 5, 7, 8, 10, 13, 14, 15, 18, 20, 22, 23, 30, 31, 35, 36, 38, 43, 46, 47, 53, 54, 57, 58, 59, 61, 63, 64, 65, 66, 69, 73, 74, 76, 78, 79, 82, 83, 84, 85, 87, 88, 89, 90, 91, 96, 98, 100, 101, 102, 104, 115, 116, 117, 118, 120, 121, 122, 123, 124, 125, 127, 131, 132, 135, 137, 138, 140, 141, 143, 145, 146, 147, 148, 151, 153, 154, 155, 157, 158, 159, 164, 166, 167, 169, 174, 179, 181, 184, 185, 186, 188, 192, 193, 194, 196, 198], []], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findCriticalAndPseudoCriticalEdges(n, edges) {
  // keep original indices, then sort by weight once
  const sorted = edges.map((e, i) => [e[0], e[1], e[2], i]).sort((a, b) => a[2] - b[2]);

  // MST weight with edge 'skip' banned and edge 'force' pre-added (original indices)
  const mst = (skip, force) => {
    const uf = new UnionFind(n);
    let total = 0;
    if (force !== -1) {
      const [a, b, w] = edges[force];
      uf.union(a, b);
      total += w;
    }
    for (const [a, b, w, idx] of sorted) {
      if (idx === skip || idx === force) continue;
      if (uf.union(a, b)) total += w;
    }
    return uf.count === 1 ? total : Infinity;   // disconnected → impossible
  };

  const best = mst(-1, -1);
  const critical = [];
  const pseudo = [];
  for (let i = 0; i < edges.length; i++) {
    if (mst(i, -1) > best) critical.push(i);        // cannot live without it
    else if (mst(-1, i) === best) pseudo.push(i);   // can be in some MST
  }
  return [critical, pseudo];
}`,
  },
  dryRun: {
    columns: ['edge i', 'ban → weight', 'force → weight', 'class'],
    rows: [
      ['0 [0,1,1]', '8 (> 7)', '—', 'critical'],
      ['1 [1,2,1]', '8 (> 7)', '—', 'critical'],
      ['2 [2,3,2]', '7', '7', 'pseudo'],
      ['3 [0,3,2]', '7', '7', 'pseudo'],
      ['4 [0,4,3]', '7', '7', 'pseudo'],
      ['5 [3,4,3]', '7', '7', 'pseudo'],
      ['6 [1,4,6]', '7', '10', 'none'],
    ],
    note: 'best = 7 for example 1.',
  },
  complexity: { time: 'O(m² · α(n))', space: 'O(n + m)', explanation: 'One sort, then 2m + 1 Kruskal passes of O(m α(n)) each.' },
  alternative: {
    title: 'Equal-weight groups + bridges (Tarjan)',
    md: 'Process weight groups like the uniqueness check. Inside a group, contract current components to nodes; an edge that connects different components is pseudo-critical or critical, and it is critical exactly when it is a **bridge** in the multigraph formed by that group\'s usable edges. O(m log m + m) overall, but much more code.',
    complexity: 'O(m log m) time',
  },
  mistakes: [
    'Classifying by membership in one MST: with ties, your MST may contain a pseudo-critical edge and omit another.',
    'Forgetting that banning an edge can disconnect the graph — that makes it critical, so return Infinity, not a partial sum.',
    'Losing original indices by sorting in place and then reporting sorted positions.',
    'Testing pseudo-critical before critical: a critical edge also passes the "force" test, so it would be misfiled.',
  ],
};
