export default {
  id: 'clone-graph',
  title: 'Clone Graph',
  difficulty: 'Medium',
  order: 4,
  pattern: 'graph-dfs',
  tags: ['graph', 'dfs', 'bfs', 'hash map'],
  source: { platform: 'LeetCode', number: 133, url: 'https://leetcode.com/problems/clone-graph/' },

  statement: `You are given a reference to one node of a **connected, undirected** graph. Each node has an integer \`val\` (its label, \`1..n\`) and an array \`neighbors\` of node references:

\`\`\`js
class Node { constructor(val = 0, neighbors = []) { this.val = val; this.neighbors = neighbors; } }
\`\`\`

Return a **deep copy** of the graph: brand-new nodes with the same values and the same connections, where no new node is one of the original nodes. The \`Node\` class is provided for you (you may call \`new Node(val)\`).

**Test format:** each test gives the graph as an adjacency list — \`adjList[i]\` lists the neighbour values of the node with \`val = i + 1\`. The harness builds the nodes, passes you node 1 (or \`null\` for an empty graph), checks that your copy shares no node with the original, and turns your copy back into an adjacency list.`,
  examples: [
    { input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', explanation: 'A 4-cycle 1–2–3–4–1, copied.' },
    { input: 'adjList = [[]]', output: '[[]]', explanation: 'One node with no neighbours.' },
    { input: 'adjList = []', output: '[]', explanation: 'Empty graph: return null.' },
  ],
  constraints: ['0 <= n <= 100', '1 <= Node.val <= 100, all values unique', 'No repeated edges, no self-loops', 'The graph is connected'],

  think: `- If you create a copy every time you *see* a node, what happens with the cycle 1–2–1?
- You need a map from each original node to its copy. When should an entry be added: before or after visiting the neighbours?`,
  patternChallenge: {
    options: ['Recursion on a tree (copy left/right)', 'Graph DFS/BFS with a Map original → clone', 'Two Pointers', 'Topological Sort'],
    answer: 1,
    explanation: 'Unlike a tree, a graph has cycles and shared neighbours, so naive recursive copying loops forever or duplicates nodes. A Map from original to clone is both the visited set and the lookup for already-created copies.',
  },
  hints: [
    'Keep `const copies = new Map()` (original node → clone). If a node is already in the map, return its clone.',
    'Create the clone and put it in the map **before** recursing into neighbours, so a cycle that leads back finds it.',
  ],
  approach: `**Naive:** copy a node, then recursively copy each neighbour. On a cycle 1–2–1 this recurses forever, and a node reachable by two paths gets copied twice.

**Correct:** DFS with \`copies: Map<original, clone>\`.
1. \`clone(node)\`: if \`copies.has(node)\` return \`copies.get(node)\`.
2. Otherwise create \`copy = new Node(node.val)\`, **store it immediately**, then for each neighbour push \`clone(neighbour)\` into \`copy.neighbors\`.

Storing before recursing is what breaks cycles: when the DFS comes back around to \`node\`, it gets the (partly built) copy instead of starting over. BFS works the same way: create the clone when a node is first enqueued.`,

  functionName: 'cloneGraph',
  paramNames: ['adjList'],
  starterCode: `/**
 * // Provided:
 * // class Node { constructor(val = 0, neighbors = []) { this.val = val; this.neighbors = neighbors; } }
 *
 * @param {Node | null} node
 * @return {Node | null}
 */
function cloneGraph(node) {
  
}
`,
  harness: `(target, args, h) => {
  const adjList = args[0];
  class Node {
    constructor(val, neighbors) {
      this.val = val === undefined ? 0 : val;
      this.neighbors = neighbors === undefined ? [] : neighbors;
    }
  }
  const hadNode = Object.prototype.hasOwnProperty.call(globalThis, 'Node');
  const prevNode = globalThis.Node;
  globalThis.Node = Node;              // expose Node to the user's code
  try {
    if (adjList.length === 0) {
      const r = target(null);
      return r === null || r === undefined ? [] : 'expected null for an empty graph';
    }
    const nodes = adjList.map((_, i) => new Node(i + 1));
    adjList.forEach((nbrs, i) => { nodes[i].neighbors = nbrs.map((v) => nodes[v - 1]); });
    const originals = new Set(nodes);
    const clone = target(nodes[0]);
    if (!clone) return 'returned null for a non-empty graph';
    if (originals.has(clone)) return 'returned an original node instead of a copy';
    const byVal = new Map([[clone.val, clone]]);
    const queue = [clone];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      for (const v of u.neighbors) {
        if (originals.has(v)) return 'the copy shares node ' + v.val + ' with the original graph';
        const seen = byVal.get(v.val);
        if (seen === undefined) { byVal.set(v.val, v); queue.push(v); }
        else if (seen !== v) return 'node ' + v.val + ' was copied more than once';
      }
    }
    const out = [];
    for (let val = 1; val <= byVal.size; val++) {
      const u = byVal.get(val);
      if (!u) return 'the copy is missing node ' + val;
      out.push(u.neighbors.map((x) => x.val));
    }
    return out;
  } finally {
    if (hadNode) globalThis.Node = prevNode; else delete globalThis.Node;
  }
}`,
  tests: [
    { scenario: 'Example 1', hint: 'A 4-cycle: without a visited map you recurse forever around the cycle.', args: [[[2,4],[1,3],[2,4],[1,3]]], expected: [[2,4],[1,3],[2,4],[1,3]] },
    { scenario: 'Example 2', hint: 'A single node with no neighbours — return a new node, not the original.', args: [[[]]], expected: [[]] },
    { scenario: 'Example 3', hint: 'The empty graph: the input node is null, so return null.', args: [[]], expected: [] },
    { scenario: 'Two nodes', hint: 'The smallest cycle 1–2–1: the clone of 2 must point back to the clone of 1.', args: [[[2],[1]]], expected: [[2],[1]] },
    { scenario: 'Triangle', hint: 'Register each copy in the map BEFORE visiting its neighbours, or the triangle loops forever.', args: [[[2,3],[1,3],[1,2]]], expected: [[2,3],[1,3],[1,2]] },
    { scenario: 'Star centred at node 1', hint: 'Every leaf points back to the centre; the centre must be copied exactly once.', args: [[[2,3,4,5],[1],[1],[1],[1]]], expected: [[2,3,4,5],[1],[1],[1],[1]] },
    { scenario: 'Star centred at a leaf', hint: 'The start node is a leaf; you still have to reach the whole graph through it.', args: [[[3],[3],[1,2,4,5],[3],[3]]], expected: [[3],[3],[1,2,4,5],[3],[3]] },
    { scenario: 'Path graph', hint: 'A simple chain: every middle node has two neighbours to copy.', args: [[[2],[1,3],[2,4],[3,5],[4]]], expected: [[2],[1,3],[2,4],[3,5],[4]] },
    { scenario: 'Neighbour order preserved', hint: 'Copy neighbours in the same order as the original list — do not sort them.', args: [[[4,2,3],[3,1],[1,4,2],[3,1]]], expected: [[4,2,3],[3,1],[1,4,2],[3,1]] },
    { scenario: 'Complete graph K4', hint: 'Many paths reach the same node; a shallow copy or a missing map duplicates nodes.', args: [[[2,3,4],[1,3,4],[1,2,4],[1,2,3]]], expected: [[2,3,4],[1,3,4],[1,2,4],[1,2,3]] },
    { scenario: 'Shallow copy check', hint: 'Pushing the ORIGINAL neighbour into copy.neighbors shares nodes with the input graph — every neighbour must be a clone.', args: [[[2,3],[1],[1]]], expected: [[2,3],[1],[1]] },
    { scenario: 'Long cycle (n = 100)', hint: 'The maximum size: a 100-node ring. Each node must be cloned exactly once.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => [((i + 99) % 100) + 1, ((i + 1) % 100) + 1])]', expected: [[100,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,8],[7,9],[8,10],[9,11],[10,12],[11,13],[12,14],[13,15],[14,16],[15,17],[16,18],[17,19],[18,20],[19,21],[20,22],[21,23],[22,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[31,33],[32,34],[33,35],[34,36],[35,37],[36,38],[37,39],[38,40],[39,41],[40,42],[41,43],[42,44],[43,45],[44,46],[45,47],[46,48],[47,49],[48,50],[49,51],[50,52],[51,53],[52,54],[53,55],[54,56],[55,57],[56,58],[57,59],[58,60],[59,61],[60,62],[61,63],[62,64],[63,65],[64,66],[65,67],[66,68],[67,69],[68,70],[69,71],[70,72],[71,73],[72,74],[73,75],[74,76],[75,77],[76,78],[77,79],[78,80],[79,81],[80,82],[81,83],[82,84],[83,85],[84,86],[85,87],[86,88],[87,89],[88,90],[89,91],[90,92],[91,93],[92,94],[93,95],[94,96],[95,97],[96,98],[97,99],[98,100],[99,1]] },
    { scenario: 'Complete graph (n = 30)', hint: 'A dense graph with 435 edges: every neighbour reference must resolve to the single clone of that node.', argsGen: '() => [Array.from({ length: 30 }, (_, i) => Array.from({ length: 30 }, (_, j) => j + 1).filter((j) => j !== i + 1))]', expected: [[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,25,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,27,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,28,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,29,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30],[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]] },
  ],

  solution: {
    code: `function cloneGraph(node) {
  if (node === null) return null;
  const copies = new Map();              // original node → its clone

  const clone = (orig) => {
    if (copies.has(orig)) return copies.get(orig);
    const copy = new Node(orig.val);
    copies.set(orig, copy);              // store BEFORE visiting neighbours (breaks cycles)
    for (const nb of orig.neighbors) copy.neighbors.push(clone(nb));
    return copy;
  };

  return clone(node);
}`,
    explanation: 'The Map is keyed by node objects (reference identity), which is exactly what we want here.',
  },
  dryRun: { columns: ['call', 'in map?', 'action'], rows: [['clone(1)', 'no', 'create 1′, map 1→1′, visit [2,4]'], ['clone(2)', 'no', 'create 2′, visit [1,3]'], ['clone(1)', 'yes', 'return 1′ (cycle stopped)'], ['clone(3)', 'no', 'create 3′, visit [2,4]; 2 in map; clone(4)'], ['clone(4)', 'no', 'create 4′, neighbours 1′,3′ both in map']] },
  complexity: { time: 'O(V + E)', space: 'O(V)', explanation: 'Each node is cloned once and each adjacency entry is followed once. The map and the recursion stack are O(V).' },
  alternative: {
    title: 'BFS',
    md: 'Create the clone of the start node, enqueue the original. When popping `u`, for each neighbour `v`: if it has no clone yet, create it and enqueue `v`; then push `copies.get(v)` into `copies.get(u).neighbors`.',
    code: `function cloneGraph(node) {
  if (!node) return null;
  const copies = new Map([[node, new Node(node.val)]]);
  const q = [node];
  for (let h = 0; h < q.length; h++) {
    const u = q[h];
    for (const v of u.neighbors) {
      if (!copies.has(v)) { copies.set(v, new Node(v.val)); q.push(v); }
      copies.get(u).neighbors.push(copies.get(v));
    }
  }
  return copies.get(node);
}`,
    complexity: 'O(V + E) time, O(V) space',
  },
  mistakes: [
    'Adding the clone to the map after recursing into neighbours → infinite recursion on cycles.',
    'Pushing the ORIGINAL neighbour into copy.neighbors (shallow copy).',
    'Keying the map by `val` works only because values are unique; keying by node is the general solution.',
  ],
};
