export default {
  id: 'evaluate-division',
  title: 'Evaluate Division',
  difficulty: 'Medium',
  order: 10,
  pattern: 'union-find-weighted',
  tags: ['union find', 'graph', 'hash map'],
  source: { platform: 'LeetCode', number: 399, url: 'https://leetcode.com/problems/evaluate-division/' },

  statement: `You are given equations \`equations[i] = [A, B]\` with values \`values[i]\` meaning \`A / B = values[i]\`. Variables are strings.

For each query \`[C, D]\`, return the value of \`C / D\`, or \`-1.0\` if it cannot be determined (a variable never appeared, or C and D are not linked by the equations).

The equations never contradict each other and no value is 0.`,
  examples: [
    {
      input: 'equations = [["a","b"],["b","c"]], values = [2,3], queries = [["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]]',
      output: '[6, 0.5, -1, 1, -1]',
      explanation: 'a/c = 2·3 = 6; b/a = 1/2; e is unknown; a/a = 1; x never appeared.',
    },
  ],
  constraints: ['1 <= equations.length <= 20', '1 <= queries.length <= 20', 'values[i] > 0', 'Variable names are 1–5 lowercase letters or digits'],

  think: `- If a/b = 2 and b/c = 3, how would you get a/c? What about c/a?
- If every variable in a group stored its value relative to one shared reference, what would a/c be?
- What must happen to those stored ratios when two groups merge?`,
  patternChallenge: {
    options: ['Dynamic Programming', 'Union Find — Weighted (Potential) DSU', 'Binary Search on the answer', 'Topological Sort'],
    answer: 1,
    explanation: 'Ratios compose along chains and every query is "same group? then compare". A weighted DSU stores value(x)/value(root), so a query is one division. BFS/DFS over a ratio graph also works; DP and binary search do not model the relation.',
  },
  hints: [
    'Store `weight[x] = x / parent[x]`. With path compression, after find(x) the weight is x / root.',
    'For a / b = k with roots ra, rb: set parent[ra] = rb and weight[ra] = k · weight[b] / weight[a]. A query c / d (same root) is weight[c] / weight[d].',
  ],
  approach: `**Graph + DFS/BFS (per query):** build edges a→b with weight k and b→a with 1/k; for each query search a path multiplying weights. O(Q · (V + E)).

**Weighted Union Find:**
- \`parent\` and \`weight\` Maps keyed by variable name (key mapping + weights).
- **find(x)**: recursively find the root of the parent, then \`weight[x] *= weight[oldParent]\` and point x at the root. Now \`weight[x] = x / root\`.
- **union(a, b, k)**: ra = find(a), rb = find(b); if different, \`parent[ra] = rb\`, \`weight[ra] = k * weight[b] / weight[a]\`. Derivation: ra / rb = (a / weight[a]) / (b / weight[b]) = k · weight[b] / weight[a].
- **query(c, d)**: unknown variable or different roots → −1; otherwise \`weight[c] / weight[d]\`.`,

  functionName: 'calcEquation',
  paramNames: ['equations', 'values', 'queries'],
  starterCode: `/**
 * @param {string[][]} equations
 * @param {number[]} values
 * @param {string[][]} queries
 * @return {number[]}
 */
function calcEquation(equations, values, queries) {
  
}
`,
  compare: 'float',
  tests: [
    { scenario: 'Example 1', hint: 'a/c composes along a→b→c; b/a is the inverse; unknown variables (even x/x) give -1.', args: [[['a', 'b'], ['b', 'c']], [2, 3], [['a', 'c'], ['b', 'a'], ['a', 'e'], ['a', 'a'], ['x', 'x']]], expected: [6, 0.5, -1, 1, -1] },
    { scenario: 'Two groups, multi-letter names', hint: 'Variables like "bc" are whole names, not letters; the groups {a,b,c} and {bc,cd} never mix.', args: [[['a', 'b'], ['b', 'c'], ['bc', 'cd']], [1.5, 2.5, 5], [['a', 'c'], ['c', 'b'], ['bc', 'cd'], ['cd', 'bc']]], expected: [3.75, 0.4, 5, 0.2] },
    { scenario: 'Single equation', hint: 'One equation answers a/b and b/a; anything involving an unseen variable is -1.', args: [[['a', 'b']], [0.5], [['a', 'b'], ['b', 'a'], ['a', 'c'], ['x', 'y']]], expected: [0.5, 2, -1, -1] },
    { scenario: 'Long chain', hint: 'Weights must multiply along the whole path; path compression must fold the parent\'s weight in before re-pointing.', args: [[['x1', 'x2'], ['x2', 'x3'], ['x3', 'x4'], ['x4', 'x5']], [3, 4, 5, 6], [['x1', 'x5'], ['x5', 'x2'], ['x2', 'x4']]], expected: [360, 0.008333333333333333, 20] },
    { scenario: 'Disconnected groups', hint: 'a and d are both known but in different groups, so a/d is -1, not 0 or 1.', args: [[['a', 'b'], ['c', 'd']], [2, 4], [['a', 'd'], ['c', 'd'], ['d', 'c']]], expected: [-1, 4, 0.25] },
    { scenario: 'Union of two existing groups', hint: 'The third equation joins two groups that already have roots — an inverted union formula gives the wrong ratio here.', args: [[['a', 'b'], ['c', 'd'], ['b', 'd']], [2, 3, 5], [['a', 'c'], ['c', 'a'], ['a', 'd']]], expected: [3.333333333333333, 0.30000000000000004, 10] },
    { scenario: 'Self equation', hint: 'a/a = 1 is given; a/b is still unknown because b never appeared.', args: [[['a', 'a']], [1], [['a', 'a'], ['a', 'b']]], expected: [1, -1] },
    { scenario: 'Unknown x / x', hint: 'Returning 1 for x/x when x never appeared is wrong — it must be -1.', args: [[['p', 'q']], [4], [['z', 'z'], ['p', 'p'], ['q', 'q']]], expected: [-1, 1, 1] },
    { scenario: 'Chain given right to left', hint: 'Equations arrive from the far end of the chain, so unions attach existing roots under new nodes; weights must be updated in the right direction.', args: [[['c', 'd'], ['b', 'c'], ['a', 'b']], [2, 3, 4], [['a', 'd'], ['d', 'a'], ['b', 'd']]], expected: [24, 0.041666666666666664, 6] },
    { scenario: 'Redundant consistent cycle', hint: 'a/b, b/c and a/c are all given (consistent); the third equation adds no new information and must not corrupt the weights.', args: [[['a', 'b'], ['b', 'c'], ['a', 'c']], [2, 4, 8], [['c', 'a'], ['b', 'a'], ['a', 'c']]], expected: [0.125, 0.5, 8] },
    { scenario: 'Duplicate equation', hint: 'The same equation twice: the second union finds both in the same group and must be ignored.', args: [[['m', 'n'], ['m', 'n']], [2.5, 2.5], [['n', 'm'], ['m', 'n']]], expected: [0.4, 2.5] },
    { scenario: 'Fractional values', hint: 'Values below 1 still compose by multiplication; answers are compared with a small tolerance.', args: [[['a1', 'b2'], ['b2', 'c3']], [0.25, 0.2], [['a1', 'c3'], ['c3', 'a1']]], expected: [0.05, 20] },
    { scenario: 'Max size (20 eqs, 20 queries)', hint: 'A 21-variable chain with alternating ratios; every query spans part of the chain in both directions.', argsGen: '() => { const eqs = [], vals = [], qs = []; for (let i = 0; i < 20; i++) { eqs.push([\'n\' + (i + 1), \'n\' + i]); vals.push(i % 2 ? 2 : 0.5); } for (let i = 0; i < 20; i++) qs.push([\'n\' + (20 - i), \'n\' + i]); return [eqs, vals, qs]; }', expected: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  ],

  solution: {
    code: `function calcEquation(equations, values, queries) {
  const parent = new Map();
  const weight = new Map();                    // weight[x] = x / parent[x]

  const add = (x) => {
    if (!parent.has(x)) { parent.set(x, x); weight.set(x, 1); }
  };
  const find = (x) => {
    const p = parent.get(x);
    if (p !== x) {
      const root = find(p);                    // compresses p; weight[p] = p / root
      weight.set(x, weight.get(x) * weight.get(p));
      parent.set(x, root);
    }
    return parent.get(x);
  };
  const union = (a, b, k) => {                 // a / b = k
    const ra = find(a), rb = find(b);
    if (ra === rb) return;
    parent.set(ra, rb);
    weight.set(ra, (k * weight.get(b)) / weight.get(a));
  };

  equations.forEach(([a, b], i) => { add(a); add(b); union(a, b, values[i]); });

  return queries.map(([c, d]) => {
    if (!parent.has(c) || !parent.has(d)) return -1;
    if (find(c) !== find(d)) return -1;
    return weight.get(c) / weight.get(d);
  });
}`,
    explanation: 'Recursion depth is at most the number of variables (≤ 40 here), so a recursive find is safe.',
  },
  dryRun: {
    columns: ['step', 'parent', 'weight', 'note'],
    rows: [
      ['union(a,b,2)', 'a→b', 'a: 2', 'a / b = 2'],
      ['union(b,c,3)', 'b→c', 'b: 3', 'b / c = 3'],
      ['find(a)', 'a→c', 'a: 2·3 = 6', 'compressed: a / c = 6'],
      ['query a/c', '', '6 / 1', '6'],
      ['query b/a', '', '3 / 6', '0.5'],
    ],
  },
  complexity: { time: 'O((E + Q) · α(V))', space: 'O(V)', explanation: 'Each equation is one union, each query two finds. V = distinct variables.' },
  alternative: {
    title: 'BFS over a weighted ratio graph',
    md: 'Add edges a→b (k) and b→a (1/k). For each query BFS from c multiplying edge weights until reaching d.',
    code: `function calcEquation(equations, values, queries) {
  const g = new Map();
  const addEdge = (u, v, w) => { if (!g.has(u)) g.set(u, []); g.get(u).push([v, w]); };
  equations.forEach(([a, b], i) => { addEdge(a, b, values[i]); addEdge(b, a, 1 / values[i]); });
  return queries.map(([c, d]) => {
    if (!g.has(c) || !g.has(d)) return -1;
    const seen = new Set([c]); const q = [[c, 1]];
    for (let h = 0; h < q.length; h++) {
      const [u, acc] = q[h];
      if (u === d) return acc;
      for (const [v, w] of g.get(u)) if (!seen.has(v)) { seen.add(v); q.push([v, acc * w]); }
    }
    return -1;
  });
}`,
    complexity: 'O(Q · (V + E)) time, O(V + E) space',
  },
  mistakes: ['Returning 1 for x/x when x never appeared (must be −1).', 'Updating parent before multiplying the old parent\'s weight.', 'Inverting the union formula.'],
};
