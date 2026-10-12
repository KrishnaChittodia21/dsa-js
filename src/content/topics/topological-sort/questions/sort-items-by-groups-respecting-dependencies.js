export default {
  id: 'sort-items-by-groups-respecting-dependencies',
  title: 'Sort Items by Groups Respecting Dependencies',
  difficulty: 'Hard',
  order: 5,
  pattern: 'topo-kahn-indegree',
  tags: ['graph', 'topological sort', 'two-level'],
  source: { platform: 'LeetCode', number: 1203, url: 'https://leetcode.com/problems/sort-items-by-groups-respecting-dependencies/' },

  statement: `There are \`n\` items \`0..n-1\` and \`m\` groups \`0..m-1\`. \`group[i]\` is the group of item \`i\`, or \`-1\` if it belongs to no group. \`beforeItems[i]\` lists the items that must appear **before** item \`i\` in the result.

Return an ordering of all items such that:
1. Items of the **same group** are next to each other (contiguous).
2. Every \`beforeItems\` rule is respected.

Return any valid ordering, or \`[]\` if none exists. Ungrouped items (\`-1\`) have no contiguity requirement.

*Your answer is checked by verifying both rules, so any valid ordering is accepted.*`,
  examples: [
    { input: 'n = 8, m = 2, group = [-1,-1,1,0,0,1,0,-1], beforeItems = [[],[6],[5],[6],[3,6],[],[],[]]', output: '[6,3,4,1,5,2,0,7]' },
    { input: 'n = 8, m = 2, group = [-1,-1,1,0,0,1,0,-1], beforeItems = [[],[6],[5],[6],[3],[],[4],[]]', output: '[]', explanation: '6 must precede 3, 3 must precede 4, and 4 must precede 6 — a cycle inside group 0.' },
  ],
  constraints: ['1 <= m <= n <= 3 · 10^4', 'group.length == beforeItems.length == n', '-1 <= group[i] <= m − 1', 'beforeItems[i] has distinct items, none equal to i'],

  think: `- If groups must be contiguous, you can think of each group as one "super item". What order must the groups respect?
- Which dependencies create edges between groups, and which stay inside a group?
- How can you treat ungrouped items uniformly?`,
  patternChallenge: {
    options: ['One topological sort of the items', 'Two-level topological sort (groups, then items)', 'Union-Find on groups', 'Sort items by group id'],
    answer: 1,
    explanation: 'A single item-level topo sort respects dependencies but can interleave groups. Contiguity means groups themselves must be ordered: sort groups by the cross-group dependencies, sort items by all dependencies, then output items group by group in group order. Sorting by group id ignores dependencies entirely.',
  },
  hints: [
    'Give every ungrouped item its own brand-new group id (m, m+1, …). Now every item has a group and each group must be contiguous.',
    'Topologically sort items using all beforeItems edges, and groups using the edges whose endpoints lie in different groups. Then bucket items (in item order) by group and concatenate buckets in group order.',
  ],
  approach: `**Step 0 — normalise:** each item with \`group = -1\` gets a fresh group id, so every group (even of size 1) must be contiguous — which is trivially true for singletons.

**Step 1 — two graphs:**
- **Item graph:** \`b → i\` for every \`b\` in \`beforeItems[i]\`.
- **Group graph:** \`group[b] → group[i]\` whenever the two groups differ.

**Step 2 — two Kahn runs.** If either has a cycle, return \`[]\`.

**Step 3 — combine.** Walk the item order and append each item to the bucket of its group (so buckets keep a valid internal order). Output the buckets in group order.

**Why it is valid:** an edge inside a group is respected by the item order within the bucket; an edge across groups is respected because the group order puts the earlier group's whole bucket first. Contiguity holds by construction. O(n + m + E).`,

  functionName: 'sortItems',
  paramNames: ['n', 'm', 'group', 'beforeItems'],
  starterCode: `/**
 * @param {number} n
 * @param {number} m
 * @param {number[]} group
 * @param {number[][]} beforeItems
 * @return {number[]}
 */
function sortItems(n, m, group, beforeItems) {
  
}
`,
  checker: `(output, args, expected, h) => {
  const [n, m, group, before] = args;
  if (!Array.isArray(output)) return false;
  if (expected.length === 0) return output.length === 0;
  if (output.length !== n) return false;
  const pos = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const x = output[i];
    if (!Number.isInteger(x) || x < 0 || x >= n || pos[x] !== -1) return false;
    pos[x] = i;
  }
  for (let i = 0; i < n; i++) for (const b of before[i]) if (pos[b] > pos[i]) return false;
  const lo = new Map(), hi = new Map(), cnt = new Map();
  for (let i = 0; i < n; i++) {
    const g = group[i];
    if (g === -1) continue;
    lo.set(g, Math.min(lo.has(g) ? lo.get(g) : Infinity, pos[i]));
    hi.set(g, Math.max(hi.has(g) ? hi.get(g) : -Infinity, pos[i]));
    cnt.set(g, (cnt.get(g) || 0) + 1);
  }
  for (const [g, c] of cnt) if (hi.get(g) - lo.get(g) + 1 !== c) return false;
  return true;
}`,
  tests: [
    { scenario: 'Example 1', hint: 'Group 0 = {3,4,6} and group 1 = {2,5} must each be contiguous while all dependencies hold.', args: [8, 2, [-1, -1, 1, 0, 0, 1, 0, -1], [[], [6], [5], [6], [3, 6], [], [], []]], expected: [0, 5, 2, 6, 3, 4, 7, 1] },
    { scenario: 'Example 2', hint: '6 → 3 → 4 → 6 is a cycle inside group 0: return [].', args: [8, 2, [-1, -1, 1, 0, 0, 1, 0, -1], [[], [6], [5], [6], [3], [], [4], []]], expected: [] },
    { scenario: 'Single ungrouped item', hint: 'One item with group -1. Do not index arrays with -1 — give ungrouped items their own fresh group ids.', args: [1, 1, [-1], [[]]], expected: [0] },
    { scenario: 'All ungrouped, no rules', hint: 'Any permutation works; every item must appear once.', args: [3, 1, [-1, -1, -1], [[], [], []]], expected: [0, 1, 2] },
    { scenario: 'Ungrouped item first', hint: 'Item 1 needs ungrouped item 2 before it; group 0 = {0,1} stays contiguous after 2.', args: [3, 1, [0, 0, -1], [[], [2], []]], expected: [2, 0, 1] },
    { scenario: 'Groups depend on each other', hint: 'Group 1 needs group 0 (via 0 → 1) and group 0 needs group 1 (via 1 → 2): a cycle at group level, so [].', args: [4, 2, [0, 1, 0, 1], [[], [0], [1], []]], expected: [] },
    { scenario: 'Group cycle via ungrouped item', hint: 'The cycle passes through an ungrouped item: group 1 → item 4 → group 0 → group 1.', args: [5, 2, [1, 1, 0, 0, -1], [[2], [], [4], [], [1]]], expected: [] },
    { scenario: 'Chain across groups', hint: 'A straight chain through three groups and an ungrouped item.', args: [5, 3, [0, 0, 1, 2, -1], [[], [0], [1], [2], [3]]], expected: [0, 1, 2, 3, 4] },
    { scenario: 'Interleaving trap', hint: 'An item-level topo sort could output 0, 2, 1, 3, splitting group 0 — groups must be ordered as blocks.', args: [4, 2, [0, 1, 0, 1], [[], [], [0], [1]]], expected: [0, 2, 1, 3] },
    { scenario: 'Dependency inside a group', hint: 'Rules within one group must not add a self-edge in the group graph (that would look like a cycle).', args: [3, 1, [0, 0, 0], [[1], [2], []]], expected: [2, 1, 0] },
    { scenario: 'Empty group', hint: 'Group 1 has no items at all; it must not break anything.', args: [3, 3, [0, 2, 0], [[], [0], []]], expected: [0, 2, 1] },
    { scenario: 'Large valid (n = 5000)', hint: '5000 items in 50 groups with random backward dependencies; every rule and every group block must hold.', argsGen: '() => { const n = 5000, m = 50; let s = 23; const r = () => (s = (s * 48271) % 2147483647); const group = Array.from({ length: n }, (_, i) => (i % 5 === 0 ? -1 : Math.floor(i / (n / m)))); const before = Array.from({ length: n }, () => []); for (let i = 1; i < n; i++) { const k = r() % 3; for (let t = 0; t < k; t++) { const b = r() % i; if (group[i] !== -1 && group[b] !== -1 && !before[i].includes(b)) before[i].push(b); } }  return [n, m, group, before]; }', expectedGen: "() => { const [n, , group] = (() => { const n = 5000, m = 50; let s = 23; const r = () => (s = (s * 48271) % 2147483647); const group = Array.from({ length: n }, (_, i) => (i % 5 === 0 ? -1 : Math.floor(i / (n / m)))); const before = Array.from({ length: n }, () => []); for (let i = 1; i < n; i++) { const k = r() % 3; for (let t = 0; t < k; t++) { const b = r() % i; if (group[i] !== -1 && group[b] !== -1 && !before[i].includes(b)) before[i].push(b); } }  return [n, m, group, before]; })(); const free = [], grouped = []; for (let i = 0; i < n; i++) (group[i] === -1 ? free : grouped).push(i); return [...free, ...grouped]; }" },
    { scenario: 'Max size, group-level cycle', hint: '3·10^4 items: the item graph is acyclic, but one rule makes group 0 wait for the last group, which itself (through a chain of rules) waits for group 0 — so the answer is [].', argsGen: '() => { const n = 30000, m = 100; let s = 23; const r = () => (s = (s * 48271) % 2147483647); const group = Array.from({ length: n }, (_, i) => (i % 5 === 0 ? -1 : Math.floor(i / (n / m)))); const before = Array.from({ length: n }, () => []); for (let i = 1; i < n; i++) { const k = r() % 3; for (let t = 0; t < k; t++) { const b = r() % i; if (group[i] !== -1 && group[b] !== -1 && !before[i].includes(b)) before[i].push(b); } } before[1] = [n - 1]; return [n, m, group, before]; }', expected: [] },
  ],

  solution: {
    code: `function sortItems(n, m, group, beforeItems) {
  // 0. every ungrouped item gets its own new group
  const g = group.slice();
  let groupCount = m;
  for (let i = 0; i < n; i++) if (g[i] === -1) g[i] = groupCount++;

  // generic Kahn over vertices 0..size-1
  const topo = (size, adj, indeg) => {
    const order = [];
    for (let v = 0; v < size; v++) if (indeg[v] === 0) order.push(v);
    for (let head = 0; head < order.length; head++) {
      for (const w of adj[order[head]]) if (--indeg[w] === 0) order.push(w);
    }
    return order.length === size ? order : null;
  };

  // 1. build item graph and group graph
  const itemAdj = Array.from({ length: n }, () => []);
  const itemIn = new Array(n).fill(0);
  const groupAdj = Array.from({ length: groupCount }, () => []);
  const groupIn = new Array(groupCount).fill(0);
  for (let i = 0; i < n; i++) {
    for (const b of beforeItems[i]) {
      itemAdj[b].push(i); itemIn[i]++;
      if (g[b] !== g[i]) { groupAdj[g[b]].push(g[i]); groupIn[g[i]]++; }
    }
  }

  // 2. two topological sorts
  const itemOrder = topo(n, itemAdj, itemIn);
  const groupOrder = topo(groupCount, groupAdj, groupIn);
  if (!itemOrder || !groupOrder) return [];

  // 3. bucket items by group (keeps item order), then concatenate buckets in group order
  const buckets = Array.from({ length: groupCount }, () => []);
  for (const item of itemOrder) buckets[g[item]].push(item);
  const result = [];
  for (const grp of groupOrder) for (const item of buckets[grp]) result.push(item);
  return result;
}`,
    explanation: 'Duplicate group edges (several items linking the same two groups) are fine: each copy adds one to in-degree and is decremented once.',
  },
  dryRun: { columns: ['step', 'result (example 1)'], rows: [['normalise', 'ungrouped items 0, 1, 7 get new groups 2, 3, 4 → g = [2,3,1,0,0,1,0,4]'], ['item topo', '[0, 5, 6, 7, 2, 1, 3, 4]'], ['group edges', '6→1 gives 0→3, 6→3 / 3→4 / 6→4 stay inside group 0, 5→2 stays inside group 1'], ['group topo', '[0, 1, 2, 4, 3]'], ['buckets', 'g0: [6,3,4], g1: [5,2], g2: [0], g3: [1], g4: [7]'], ['concatenate', '[6, 3, 4, 5, 2, 0, 7, 1] — valid (different from the example, also accepted)']] },
  complexity: { time: 'O(n + m + E)', space: 'O(n + m + E)', explanation: 'E = total number of beforeItems entries; two linear Kahn runs and one bucket pass.' },
  alternative: {
    title: 'Nested topo per group',
    md: 'Sort groups first; then, for each group, topologically sort only its items using intra-group edges. Equivalent, slightly more bookkeeping.',
    complexity: 'O(n + m + E) time and space',
  },
  mistakes: [
    'Doing a single item-level topo sort — dependencies are respected but groups get interleaved.',
    'Leaving ungrouped items at -1 and indexing arrays with it.',
    'Adding self-edges to the group graph for dependencies inside the same group (creates a false cycle).',
  ],
};
