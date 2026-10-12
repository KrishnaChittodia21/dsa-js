export default {
  id: 'union-find',
  summary: 'Keep items in disjoint groups, each represented by one "leader", so you can merge two groups and ask "are these two in the same group?" in near-constant time.',

  jsTools: [
    { api: 'Array.from({ length: n }, (_, i) => i)', use: 'Initial parent array: every node is its own leader', complexity: 'O(n)' },
    { api: 'Int32Array / new Array(n).fill(0)', use: 'Rank or size arrays', complexity: 'O(1) index access' },
    { api: 'Map', use: 'Map non-integer keys (emails, variable names, coordinates) to integer ids', complexity: 'get / set O(1) average' },
    { api: '`${r},${c}` or r * cols + c', use: 'Turn a grid cell into a single id', complexity: 'O(1)' },
    { api: 'UnionFind (toolkit)', use: 'Ready-made DSU with find / union / connected / sizeOf / count', complexity: 'near O(1) amortized per operation' },
  ],

  patterns: [
    {
      id: 'union-find-connectivity',
      name: 'Union Find — Dynamic Connectivity',
      summary: 'Start with every node alone; union the endpoints of each edge; the leaders tell you the groups, and a failed union reveals a cycle.',
      whyItExists: 'Many problems only ask "which things end up connected?", not "what path connects them?". DFS/BFS answers that but must rebuild or re-traverse when edges arrive one by one. Union Find absorbs each edge in near-O(1) and answers connectivity queries at any moment.',
      whenToUse: [
        'Count connected components / groups / provinces',
        'Detect the edge that closes a cycle in an undirected graph (union returns false)',
        'Edges or "same group" facts arrive one at a time (online)',
        'Equivalence relations: "a == b" facts, "can swap i and j", "are friends"',
      ],
      clues: ['"number of connected components"', '"redundant connection"', '"are x and y connected"', '"groups / provinces / friend circles"', '"equations a==b, a!=b"', '"any number of swaps between these pairs"'],
      whenNotToUse: [
        'You need an actual path or shortest distance → BFS / Dijkstra',
        'The graph is directed and direction matters for reachability → DFS / topological sort',
        'Edges are deleted over time (plain DSU cannot split groups) — unless you process in reverse',
      ],
      template: `const uf = new UnionFind(n);
for (const [a, b] of edges) {
  if (!uf.union(a, b)) {
    // a and b were already connected → this edge closes a cycle
  }
}
return uf.count; // number of groups`,
      variations: [
        { name: 'Cycle detection', description: '`union` returning false means both endpoints already share a leader.' },
        { name: 'Tree check', description: 'Exactly n − 1 edges and no failed union ⇔ the graph is a tree.' },
        { name: 'Group then process', description: 'Union all pairs, then bucket indices by leader (e.g. sort each bucket — Smallest String With Swaps).' },
        { name: 'Two-phase constraints', description: 'Union all "equal" facts first, then verify every "not equal" fact.' },
      ],
      mistakes: [
        'Comparing parent[a] === parent[b] instead of find(a) === find(b)',
        'Forgetting path compression / union by rank and getting O(n) chains',
        'Attaching a to b instead of root(a) to root(b)',
      ],
      evolution: {
        easy: 'Count groups from an edge list or adjacency matrix.',
        medium: 'Cycle / tree checks, equivalence constraints, grouping then post-processing each group.',
        hard: 'Several union-find instances at once, directed special cases, online updates on a grid.',
      },
    },
    {
      id: 'union-find-key-mapping',
      name: 'Union Find — Mapping Keys to Ids',
      summary: 'When the "nodes" are strings, coordinates or values, give each distinct key an integer id (Map) — or pick a clever encoding — then use a normal DSU.',
      whyItExists: 'The classic DSU works on 0..n−1. Real inputs are emails, variable names, rows and columns. A Map turns each key into an id the first time you see it, so the DSU logic stays unchanged.',
      whenToUse: [
        'Nodes are strings (emails, names, variables)',
        'Items are linked through a shared attribute (same row, same column, same email)',
        'Grid cells are nodes: id = r * cols + c',
      ],
      clues: ['"share a common email"', '"same row or same column"', '"variables a, b, c…"', '"accounts belong to the same person"'],
      whenNotToUse: ['The ids are already dense integers 0..n−1 — no Map needed'],
      template: `const id = new Map();
const getId = (key) => {
  if (!id.has(key)) id.set(key, id.size);
  return id.get(key);
};
// allocate the DSU after you know how many keys exist,
// or allocate for the maximum possible number of keys`,
      variations: [
        { name: 'Attribute as a node', description: 'Union an item with its attribute (stone with its row node and its column node). Items sharing an attribute join through it.' },
        { name: 'Offset trick', description: 'Rows get ids 0..R, columns get ids R+1..: a single id space for two kinds of node.' },
        { name: 'Owner of first occurrence', description: 'Map each email to the first account that used it; union later accounts with that owner.' },
      ],
      mistakes: [
        'Letting row 3 and column 3 collide in the same id space (use an offset)',
        'Allocating the DSU before you know how many ids you need',
      ],
      evolution: {
        easy: 'Strings as nodes.',
        medium: 'Link items through shared attributes (accounts merge, most stones removed).',
        hard: 'Combine key mapping with weights or with online grid updates.',
      },
    },
    {
      id: 'union-find-weighted',
      name: 'Union Find — Weighted (Potential) DSU',
      summary: 'Each node also stores a weight relative to its parent (e.g. value(node) / value(parent)); find multiplies the weights along the path so you can compare any two nodes in the same group.',
      whyItExists: 'Some relations carry a quantity: a / b = 2, x is 3 units above y. A plain DSU only knows "same group". Storing a ratio (or difference) to the parent lets the root act as a common reference point, so any a / b in the same group becomes weight(a) / weight(b).',
      whenToUse: ['Equations with ratios or differences between pairs', '"Is this new constraint consistent with the previous ones?"', 'Parity / relative-offset relations (x is the opposite of y)'],
      clues: ['"a / b = k"', '"evaluate the queries"', '"relative to"', '"is the set of equations contradictory"'],
      whenNotToUse: ['Only connectivity matters (use a plain DSU)', 'Relations are not transitive/composable'],
      template: `// weight[x] = value(x) / value(parent[x])
function find(x) {
  if (parent[x] !== x) {
    const p = parent[x];
    const root = find(p);
    weight[x] *= weight[p];   // now relative to the root
    parent[x] = root;
  }
  return parent[x];
}
// union(a, b, k) meaning a / b = k
function union(a, b, k) {
  const ra = find(a), rb = find(b);
  if (ra === rb) return;
  parent[ra] = rb;
  weight[ra] = k * weight[b] / weight[a];
}`,
      variations: [
        { name: 'Ratios (multiply)', description: 'Evaluate Division.' },
        { name: 'Differences (add)', description: 'weight = value(x) − value(parent). Used for "x is d more than y" constraints.' },
        { name: 'Parity (xor)', description: 'weight ∈ {0,1}: same side / opposite side (bipartite-style constraints).' },
      ],
      mistakes: [
        'Updating parent before multiplying the weight (you lose the old parent\'s weight)',
        'Getting the union formula backwards — derive it: value(ra)/value(rb) = k · w[b] / w[a]',
      ],
      evolution: {
        easy: '—',
        medium: 'Evaluate ratio queries (Evaluate Division).',
        hard: 'Detect contradictions among thousands of relative constraints online.',
      },
    },
    {
      id: 'union-find-advanced',
      name: 'Union Find — Multi-Instance & Online',
      summary: 'Harder DSU problems: several DSUs in parallel, directed special cases, or islands appearing one by one where you report the count after each step.',
      whyItExists: 'DSU is cheap enough to keep two copies (one per traveller) or to update after every single operation. The difficulty moves from the data structure to the modelling: which edges to take first, and which structure the input violates.',
      whenToUse: ['Report the number of groups after each addition (online)', 'Two agents share some edges but not others', 'Directed graph that should be a rooted tree'],
      clues: ['"after each operation, return the number of islands"', '"Alice and Bob can each traverse"', '"rooted tree with one extra directed edge"'],
      whenNotToUse: ['Operations remove connections (DSU cannot split)', 'You need the actual shape of each component'],
      template: `// Online: add one node at a time
const uf = new UnionFind(total);
const alive = new Array(total).fill(false);
let groups = 0;
for (const cell of additions) {
  if (alive[cell]) { out.push(groups); continue; }
  alive[cell] = true; groups++;
  for (const nb of neighbours(cell)) if (alive[nb] && uf.union(cell, nb)) groups--;
  out.push(groups);
}`,
      variations: [
        { name: 'Shared edges first', description: 'Greedily take edges usable by everyone first, then the private ones (Remove Max Edges).' },
        { name: 'Directed rooted tree', description: 'Either a node has two parents, or there is a cycle, or both (Redundant Connection II).' },
        { name: 'Online grid', description: 'Number of Islands II: +1 per new land, −1 per successful union.' },
      ],
      mistakes: ['Counting duplicate additions twice', 'Using uf.count when many slots are "not yet alive"'],
      evolution: {
        easy: '—',
        medium: 'Online counting on a grid.',
        hard: 'Two parallel DSUs with a greedy order; directed trees with two-parent vs cycle cases.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `**Union Find** is a tiny data structure that keeps track of **groups**. It supports exactly two questions:

- **find(x)** — "which group is \`x\` in?" (it returns the group's *leader*)
- **union(a, b)** — "merge the group of \`a\` with the group of \`b\`"

Two items are in the same group exactly when \`find(a) === find(b)\`.

\`\`\`text
start:        {0} {1} {2} {3} {4}
union(0, 1):  {0,1} {2} {3} {4}
union(3, 4):  {0,1} {2} {3,4}
union(1, 4):  {0,1,3,4} {2}
find(0) === find(3)?  yes → same group
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Disjoint sets** — groups that never overlap: every item is in exactly one group. That is why the structure is also called **DSU (Disjoint Set Union)**.
- **Representative / root / leader** — one chosen member that names the whole group.
- **parent[x]** — each item points to another item of its group; following parents always ends at the root (where \`parent[root] === root\`).
- **Component** — in a graph, a maximal set of nodes that are all reachable from one another. Each DSU group is a component.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of companies being acquired. Every employee knows their manager; managers know theirs; the top of the chain is the CEO. "Do Ana and Ben work for the same company?" → walk up both chains and compare CEOs. When company A buys company B, you do not re-badge every employee — B\'s CEO just starts reporting to A\'s CEO. One pointer change merges the whole group.',
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-1',
            question: 'After `union(0,1)`, `union(2,3)` and `union(1,3)`, how do we check whether 0 and 2 are in the same group?',
            options: [
              'Check whether parent[0] === parent[2]',
              'Check whether there is an edge 0–2 in the input',
              'Check whether find(0) === find(2)',
              'Check whether 0 < 2',
            ],
            answer: 2,
            explanation: 'Only the **roots** identify groups. `find` walks up the parent pointers to the root, so equal roots ⇔ same group. Here 0–1 and 2–3 were merged through 1–3, so the roots are equal.',
            misconceptions: {
              0: 'Direct parents can differ even inside one group: e.g. parent[0] = 1 but parent[2] = 3 while 1 and 3 share a root further up. Always compare roots.',
              1: 'Connectivity is transitive: 0 and 2 are connected through 1 and 3 even with no direct edge. That is exactly what DSU tracks for you.',
              3: 'Ids have no meaning for grouping; they are just labels.',
            },
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `You already know DFS/BFS can find connected components. So why a new structure?

1. **Edges arrive over time.** "After each new cable, how many networks are there?" With DFS you would re-traverse the whole graph after each edge: O(E · (V + E)). With DSU each edge costs ~O(1).
2. **Cycle detection in undirected graphs is one line.** If \`find(a) === find(b)\` *before* adding edge a–b, the edge closes a cycle.
3. **No adjacency list needed.** You process edges straight from the input — less memory, less code.
4. **Equivalence facts.** "a == b", "i can swap with j", "these accounts share an email": these are all *"same group"* statements, and DSU is the natural model.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand when DSU is **better** than DFS, and when DFS is still the right tool?',
            deeper: `DSU shines when you only need **"same group or not?"** and when edges are **added incrementally**. It gives no paths, no distances, no order, and it cannot **remove** an edge (groups can merge but never split).

DFS/BFS is better when you need the path itself, distances (BFS), direction (directed reachability, topological order), or when the graph is static and you would build an adjacency list anyway — then both are O(V + E) and either works.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Reach for Union Find when:

| Situation | Why DSU fits |
|---|---|
| Count groups / components / provinces | \`count\` drops by one on every successful union |
| "Which edge creates a cycle?" | \`union\` returns false for it |
| "Is this graph a tree?" | n − 1 edges and no failed union |
| "a == b" / "can swap i and j" / "share an email" | equivalence relation → groups |
| Online additions, report after each step | each step is near O(1) |
| Kruskal's MST (later topic) | "would this edge create a cycle?" for every edge |

Avoid it when direction matters, when you need shortest paths, or when connections are **removed**.`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-2',
            question: 'Which problem is the **worst** fit for Union Find?',
            options: [
              'Given friendships, count friend circles',
              'Given equations like a==b and b!=c, decide if they can all hold',
              'After each new road is built, report whether city 0 and city 9 are connected',
              'Find the shortest number of flights from city 0 to city 9',
            ],
            answer: 3,
            explanation: 'DSU tells you **whether** two nodes are connected, never **how far apart** they are. Shortest paths need BFS (unweighted) or Dijkstra (weighted).',
            misconceptions: {
              0: 'Friend circles are components — the textbook DSU problem.',
              1: 'Union all "==" facts, then check every "!=" pair has different roots. That is a classic two-phase DSU.',
              2: 'Incremental edges with connectivity queries is exactly where DSU beats re-running DFS every time.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['connected components / groups / provinces', 'redundant edge / cycle in undirected graph', '"are a and b connected" queries', 'equivalence: equal, same, can swap, share', 'edges added one at a time', 'merge accounts / sets'],
            conclusion: 'Think Union Find',
          },
          {
            type: 'text',
            md: `Ask yourself: **"Is the relation transitive and symmetric?"** If a~b and b~c imply a~c, and a~b implies b~a, then the relation splits items into groups — DSU territory.

Friendship-as-connection, equality, "can be swapped", "share an email", "same row or same column" are all transitive once you follow chains of them.`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-3',
            question: '"You may swap characters at index pairs `[0,3]`, `[1,2]`, `[0,2]` any number of times." Which positions can end up holding any character from which other positions?',
            options: [
              'Only the listed pairs can exchange characters',
              'All of 0, 1, 2, 3 form one group, so any character can reach any of these positions',
              'Positions {0,3} and {1,2} are separate groups',
              'None — swaps are not transitive',
            ],
            answer: 1,
            explanation: '0–3, 1–2 and 0–2 chain together: 3–0–2–1. Repeated swaps along a chain can move any character anywhere in that chain, so the group is {0,1,2,3}. Union the pairs, then sort the characters inside each group — that is Smallest String With Swaps.',
            misconceptions: {
              0: 'With unlimited swaps you can route a character through intermediate positions (like bubble sort does), so reachability is transitive.',
              2: 'The pair [0,2] links the two groups together.',
              3: 'Three swaps along a–b, b–c let you exchange a and c: swaps compose. That transitivity is the whole point.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Store each group as an upside-down **tree**: every node points to its parent, the root points to itself.

- **find(x)**: follow \`parent\` until you reach a node that points to itself.
- **union(a, b)**: find both roots; if they differ, make one root point at the other. **One pointer change merges two entire groups.**

\`\`\`text
parent = [0, 0, 2, 2, 3]      groups: {0,1}  {2,3,4}
             ↑     ↑  ↑
   1 → 0          3 → 2, 4 → 3 → 2

union(1, 4): find(1) = 0, find(4) = 2  → set parent[2] = 0
parent = [0, 0, 0, 2, 3]      groups: {0,1,2,3,4}
\`\`\``,
          },
          {
            type: 'visual',
            scenario: 'union-find',
            input: { n: 6, edges: [[0, 1], [2, 3], [1, 3], [4, 5], [0, 2]] },
            caption: 'Each union links two roots. The last edge 0–2 finds equal roots — it is redundant (it would close a cycle).',
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-4',
            question: 'To merge the group of `a` with the group of `b`, a beginner writes `parent[a] = b`. What goes wrong?',
            options: [
              'Nothing — it is equivalent to linking roots',
              'It is only slower, never wrong',
              'It is only wrong when a === b',
              'a\'s old parent chain is cut off: the rest of a\'s group no longer reaches the new root, so the groups are silently split',
            ],
            answer: 3,
            explanation: 'If a is not a root, overwriting parent[a] detaches a from its old tree while its former ancestors (and their other children) stay behind. Always link **root to root**: `parent[find(a)] = find(b)`.',
            misconceptions: {
              0: 'Try it: parent = [0,0] (1 → 0). `union(1, 2)` via parent[1] = 2 leaves node 0 alone, although 0 and 1 were together.',
              1: 'It produces wrong answers, not just slow ones — members of a\'s group lose their connection.',
              2: 'The bug appears whenever a is not a root, which is most of the time.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `Two naive versions help us see why the optimizations matter.

**Naive A — label array ("quick find").** Keep \`group[x]\`. \`find\` is O(1), but \`union\` must relabel every member of one group: O(n) per union, O(n²) for n unions.

**Naive B — parent pointers without balancing ("quick union").** Union just links roots, but nothing stops the tree from becoming a **chain**:

\`\`\`text
union(0,1), union(1,2), union(2,3) … each time attaching the old root under the new node
0 → 1 → 2 → 3 → 4 → … → n-1
find(0) walks n steps
\`\`\`

A chain of length n makes each find O(n), so m operations cost O(m · n).`,
          },
          {
            type: 'code',
            title: 'Naive quick-union — correct but can degrade to O(n) per find',
            code: `const parent = Array.from({ length: n }, (_, i) => i);
function find(x) {
  while (parent[x] !== x) x = parent[x];   // may walk a long chain
  return x;
}
function union(a, b) {
  const ra = find(a), rb = find(b);
  if (ra === rb) return false;
  parent[ra] = rb;                          // no balancing
  return true;
}`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-5',
            question: 'With the naive quick-union above, n = 100 000 nodes and the unions `union(0,1), union(1,2), …, union(n-2, n-1)`, then n calls of `find(0)`. Roughly how much work?',
            options: [
              '≈ n² / 2 steps: the tree is a chain, and each find(0) walks it',
              '≈ n steps total',
              '≈ n log n steps',
              'It crashes with a stack overflow',
            ],
            answer: 0,
            explanation: 'Each union attaches the root of 0\'s group under the next node, so the tree becomes the chain 0 → 1 → 2 → … → n−1. Every `find(0)` walks ~n steps; n of them is ~n² = 10¹⁰ — far too slow.',
            misconceptions: {
              1: 'That would be true with path compression, which flattens the chain after the first find. The naive version never flattens.',
              2: 'n log n needs balancing (union by rank). Without it, height can reach n.',
              3: 'This find is an iterative while loop, so no stack overflow — just very slow. (A *recursive* find on a 100 000-long chain could overflow, which is a real JS pitfall.)',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — path compression + union by rank',
        blocks: [
          {
            type: 'text',
            md: `Two small tricks fix the chains.

**1. Union by rank (or by size).** When linking two roots, put the **shorter** (or smaller) tree under the taller one. A tree's height only grows when two trees of *equal* rank meet, and then the result has at least double the nodes. So height ≤ log₂ n. That alone makes find O(log n).

**2. Path compression.** While walking up in \`find\`, re-point the visited nodes closer to the root. The next find on any of them is almost instant.

\`\`\`text
before find(4):   4 → 3 → 2 → 1 → 0
after (full compression):  4 → 0, 3 → 0, 2 → 0, 1 → 0
\`\`\`

The toolkit uses **path halving** (\`parent[x] = parent[parent[x]]\` while walking), a loop version with the same guarantee and no recursion.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Full path compression (recursive)',
              code: `function find(x) {
  if (parent[x] !== x) parent[x] = find(parent[x]);
  return parent[x];
}`,
            },
            right: {
              title: 'Path halving (iterative, no stack risk)',
              code: `function find(x) {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]]; // skip a level
    x = parent[x];
  }
  return x;
}`,
            },
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why "near O(1)"? The inverse Ackermann function',
            md: `With **both** tricks, any sequence of m operations on n items costs **O(m · α(n))**, where **α** is the *inverse Ackermann function*.

Intuition: the Ackermann function A grows unbelievably fast — A(4) is already a tower of exponents far bigger than the number of atoms in the universe. Its inverse α(n) is therefore unbelievably *slow*: α(n) ≤ 4 for every n you could ever store in memory.

Why so good? Union by rank keeps trees shallow (≤ log n). Path compression then attacks those shallow trees: every find that walks a long path shortens it for good, so the expensive walks "pay" for future cheap ones (an **amortized** argument, like the sliding window's left pointer). The deep analysis (Tarjan, 1975) shows the total extra work collapses to α(n) per operation. In interviews say: **"amortized O(α(n)), effectively constant."**`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-6',
            question: 'Why do we link the root of the **smaller-rank** tree under the root of the larger-rank one, and not the other way around?',
            options: [
              'Because the smaller tree has fewer nodes to relabel',
              'Because it is required for correctness',
              'Because it keeps the height from growing: the height increases only when two equal-rank trees merge, which bounds height by log n',
              'Because roots with larger ids must stay roots',
            ],
            answer: 2,
            explanation: 'Putting a short tree under a tall root does not change the tall tree\'s height. Height only grows by 1 when ranks are equal — and each such growth at least doubles the node count, so height ≤ log₂ n.',
            misconceptions: {
              0: 'Nothing is relabelled in quick-union — only one pointer changes. That argument belongs to the "label array" version.',
              1: 'Linking either way is correct; balancing is purely about speed.',
              3: 'Ids are arbitrary labels; rank (height bound) or size decides.',
            },
            deeper: 'Union by **size** (attach the smaller group under the larger) gives the same log n bound: a node\'s depth grows only when its group is attached under a group at least as big, so its group size doubles each time — at most log₂ n times. Size is handy because many problems also want the group size.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why path compression alone (without rank) is already fast in practice, and why we still add rank?',
            deeper: 'Path compression alone gives O(log n) amortized per operation — a single long find flattens the path it walked, so the same long path is never paid twice. But an adversarial order can keep creating new moderately-long paths. Rank/size prevents tall trees from forming in the first place. Together they reach O(α(n)). Both tricks are two lines each, so always use both.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Standalone DSU (write this from memory in interviews)',
            code: `class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = new Array(n).fill(1);
    this.count = n;
  }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;                 // already together (cycle!)
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;                        // smaller under larger
    this.size[ra] += this.size[rb];
    this.count--;
    return true;
  }
}`,
          },
          {
            type: 'steps',
            title: 'Using it',
            steps: [
              'Decide what the **nodes** are and give each an integer id (0..n−1, or via a Map).',
              'Decide which facts are **unions** (edges, equalities, shared attributes).',
              'Process the unions. Watch the return value: `false` = redundant / cycle.',
              'Answer with `count`, `find(a) === find(b)`, or by bucketing nodes by `find(x)`.',
            ],
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'text',
            md: 'The app\'s toolkit ships a `UnionFind` class you can use directly in solutions (`new UnionFind(n)`). Here is its full source — read it line by line; there is no magic.',
          },
          {
            type: 'code',
            title: 'Toolkit UnionFind (src/toolkit/UnionFind.js)',
            code: `export class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.componentSize = new Array(n).fill(1);
    this.count = n; // number of separate groups
  }
  find(x) {
    // Path compression (halving): point every node on the way closer to the root.
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false; // already in the same group
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra; // attach the shorter tree under the taller one
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    this.componentSize[ra] += this.componentSize[rb];
    this.count--;
    return true;
  }
  connected(a, b) { return this.find(a) === this.find(b); }
  sizeOf(x) { return this.componentSize[this.find(x)]; }
}`,
            caption: 'rank is an upper bound on height (path compression can make the real height smaller, and rank is never decreased — that is fine).',
          },
          {
            type: 'code',
            title: 'Example: number of connected components',
            code: `function countComponents(n, edges) {
  const uf = new UnionFind(n);
  for (const [a, b] of edges) uf.union(a, b);
  return uf.count;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Prefer the **iterative** find. A recursive find on a 10⁵-long chain (before compression kicks in) can hit "Maximum call stack size exceeded".
- \`Array.from({ length: n }, (_, i) => i)\` is the idiomatic identity array; \`[...Array(n).keys()]\` also works.
- For huge n, \`Int32Array\` for parent/rank saves memory and is fast.
- Destructuring swap \`[ra, rb] = [rb, ra]\` is fine here (called at most once per union).`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'Redundant edge: edges = [[1,2],[1,3],[2,3]] (nodes 1..3, DSU of size 4)',
            columns: ['edge', 'find(a)', 'find(b)', 'action', 'parent[1..3]'],
            rows: [
              ['[1,2]', '1', '2', 'different → link 2 under 1 (rank 1 becomes 1)', '[1, 1, 3]'],
              ['[1,3]', '1', '3', 'different → link 3 under 1', '[1, 1, 1]'],
              ['[2,3]', '1', '1', 'SAME root → union returns false → answer [2,3]', '[1, 1, 1]'],
            ],
            note: 'The first edge whose endpoints already share a root is the one that closes the cycle.',
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-7',
            question: 'A graph with n = 5 nodes has edges [[0,1],[1,2],[3,4],[2,0]]. What are `uf.count` and the number of failed unions at the end?',
            options: [
              'count = 1, failed = 0',
              'count = 2, failed = 1',
              'count = 3, failed = 1',
              'count = 2, failed = 0',
            ],
            answer: 1,
            explanation: 'Start count = 5. [0,1] → 4, [1,2] → 3, [3,4] → 2, [2,0] fails (0 and 2 already joined). Final groups {0,1,2} and {3,4}: count = 2, one failed union (the cycle-closing edge).',
            misconceptions: {
              0: '3 and 4 are never connected to 0..2, so there are two groups.',
              2: 'Every successful union removes exactly one group: 5 − 3 successes = 2.',
              3: 'Edge [2,0] connects nodes that are already in the same group — union returns false.',
            },
            deeper: 'Handy identity: **components = n − (successful unions)**. And for any undirected graph, **edges − successful unions = number of independent cycles**.',
          },
        ],
      },
      {
        id: 'intuition-key-mapping',
        title: 'Core intuition — non-integer keys and coordinates',
        blocks: [
          {
            type: 'text',
            md: `DSU wants integer ids. When the input gives you strings or coordinates, **invent the ids**:

\`\`\`js
const id = new Map();
const getId = (key) => {
  if (!id.has(key)) id.set(key, id.size);  // next free id
  return id.get(key);
};
\`\`\`

**Linking through an attribute.** In *Accounts Merge*, two accounts belong to the same person if they share *any* email. Instead of comparing every pair of accounts (O(n²)), remember the first account that owned each email; when a later account contains the same email, union it with that owner.

**Two kinds of node in one id space (the offset trick).** In *Most Stones Removed*, stones in the same row or the same column are linked. Make **rows** and **columns** themselves nodes: row r → id \`r\`, column c → id \`c + 10001\` (an offset bigger than any row). Each stone just unions its row with its column. Stones sharing a row or column automatically fall into one group.`,
          },
          {
            type: 'code',
            title: 'Row/column offset trick',
            code: `const OFFSET = 10001;                  // > max row index
const uf = new UnionFind(2 * OFFSET);
for (const [r, c] of stones) uf.union(r, c + OFFSET);
// groups that contain at least one stone = distinct roots among stones' rows`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-8',
            question: 'In the row/column trick, why can we not simply union `r` with `c` (no offset)?',
            options: [
              'Because UnionFind requires ids to be sorted',
              'Because row 3 and column 3 would become the same node, wrongly linking stones that only share the number 3 in different roles',
              'Because it would be slower',
              'We can — the offset is only cosmetic',
            ],
            answer: 1,
            explanation: 'A stone at (3, 7) and a stone at (5, 3) share no row or column, but without an offset both touch node "3" and get merged. The offset gives rows and columns separate id ranges.',
            misconceptions: {
              0: 'Ids can come in any order.',
              2: 'Speed is identical; the problem is correctness.',
              3: 'It changes the answer: (3,7) and (5,3) would be wrongly grouped.',
            },
          },
        ],
      },
      {
        id: 'intuition-weighted',
        title: 'Core intuition — weighted union find',
        blocks: [
          {
            type: 'text',
            md: `Sometimes each connection carries a **number**: \`a / b = 2\`, \`b / c = 3\`. Then "same group" is not enough — you want \`a / c\`.

Store alongside each parent pointer a **weight**: \`weight[x] = value(x) / value(parent[x])\`. Following pointers up to the root multiplies the weights, giving \`value(x) / value(root)\`. For two nodes with the same root:

\`\`\`text
a / c = (a / root) / (c / root)
\`\`\`

**find with compression** must fix the weight before re-pointing: first find the root of the parent (which makes the parent's weight relative to the root), then \`weight[x] *= weight[parent]\`, then \`parent[x] = root\`.

**union(a, b, k)** meaning \`a / b = k\`: let ra = find(a), rb = find(b) (now \`weight[a] = a/ra\`, \`weight[b] = b/rb\`). Attach ra under rb with

\`\`\`text
ra / rb = (a / weight[a]) / (b / weight[b]) = k · weight[b] / weight[a]
\`\`\``,
          },
          {
            type: 'code',
            title: 'Weighted DSU core',
            code: `const parent = new Map(), weight = new Map();
function add(x) { if (!parent.has(x)) { parent.set(x, x); weight.set(x, 1); } }
function find(x) {
  const p = parent.get(x);
  if (p !== x) {
    const root = find(p);                       // p now points at root
    weight.set(x, weight.get(x) * weight.get(p)); // x/p * p/root = x/root
    parent.set(x, root);
  }
  return parent.get(x);
}
function union(a, b, k) {                       // a / b = k
  const ra = find(a), rb = find(b);
  if (ra === rb) return;
  parent.set(ra, rb);
  weight.set(ra, (k * weight.get(b)) / weight.get(a));
}`,
          },
          {
            type: 'checkpoint',
            id: 'union-find-cp-9',
            question: 'Given a/b = 2 and b/c = 3, all three share a root. If weight[a] = 6 and weight[c] = 1 relative to that root, what is a / c and what is c / a?',
            options: [
              'a / c = 6, c / a = 1/6',
              'a / c = 5, c / a = −5',
              'a / c = 1/6, c / a = 6',
              'Cannot be answered without walking the original edges',
            ],
            answer: 0,
            explanation: 'a / c = weight[a] / weight[c] = 6 / 1 = 6 (and indeed 2 · 3 = 6). c / a is the reciprocal, 1/6. The shared root cancels out.',
            misconceptions: {
              1: 'Ratios compose by **multiplication**, not addition. (A difference-based weighted DSU would add — a different problem.)',
              2: 'You swapped the direction. weight[x] is value(x)/value(root), so a/c = weight[a]/weight[c].',
              3: 'That is exactly what the weights save you from — they already summarise the path to the root.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why, in weighted `find`, we must call `find(parent)` **before** multiplying the weights?',
            deeper: '`weight[x]` is relative to its current parent p. To make it relative to the root we need `weight[p]` relative to the root — which is only true after `find(p)` has compressed p. If you multiplied first, you would use p\'s old weight (relative to *its* old parent) and get a wrong ratio. Also: set `parent[x] = root` only after using the old parent\'s weight.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Comparing parents instead of roots** — \`parent[a] === parent[b]\` is not the group test; \`find(a) === find(b)\` is.
2. **Linking nodes instead of roots** — \`parent[a] = b\` detaches a from its group.
3. **No balancing and no compression** — silently O(n) per operation; TLE on large tests.
4. **Recursive find on long chains** — stack overflow in JS; use the iterative version.
5. **Off-by-one on 1-indexed input** — allocate \`n + 1\` slots when nodes are 1..n.
6. **Colliding id spaces** — rows and columns (or two kinds of key) need an offset or separate Maps.
7. **Expecting deletions** — DSU cannot un-merge. If edges are removed, try processing the operations **in reverse** (removals become additions).
8. **Using \`uf.count\` when not every slot is a real node** (e.g. a DSU sized 20 002 for rows+columns) — count only the ids you actually used.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(α(n)) amortized per find/union (≈ O(1))',
            space: 'O(n)',
            md: `| Version | find | union |
|---|---|---|
| Label array (quick find) | O(1) | O(n) |
| Naive parent pointers | O(n) worst | O(n) worst |
| Union by rank/size only | O(log n) | O(log n) |
| Path compression only | O(log n) amortized | O(log n) amortized |
| **Both** | **O(α(n)) amortized** | **O(α(n)) amortized** |

Processing E edges on V nodes: **O(V + E · α(V))**. Weighted DSU has the same bounds. Space: parent + rank/size arrays = O(n).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- Write the 20-line DSU class from memory; it is expected at medium level.
- Say **"path compression + union by rank gives amortized inverse-Ackermann, effectively constant"**.
- Mention the trade-off with DFS: DSU for incremental connectivity / cycle detection; DFS/BFS for paths and distances.
- State how you map inputs to ids (Map for strings, r * cols + c for grids, offsets for two node kinds).
- Useful identities: components = n − successful unions; a graph is a tree ⇔ edges = n − 1 and no union fails.
- If the problem deletes edges, suggest the **offline reverse** trick.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'new UnionFind(n)', use: 'Toolkit DSU: find, union (returns boolean), connected, sizeOf, count', complexity: 'O(α(n)) amortized' },
              { api: 'Array.from({ length: n }, (_, i) => i)', use: 'Identity parent array', complexity: 'O(n)' },
              { api: 'new Map()', use: 'String / tuple key → integer id', complexity: 'O(1) average' },
              { api: 'r * cols + c', use: 'Grid cell → id without string keys', complexity: 'O(1)' },
              { api: '[a, b] = [b, a]', use: 'Swap roots so the bigger one stays root', complexity: 'O(1)' },
              { api: 'Int32Array', use: 'Memory-light parent/size arrays for big n', complexity: 'O(1) access' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Count groups / components', 'Detect a cycle-closing edge in an undirected graph', 'Equivalence facts (==, can swap, share email)', 'Online additions with connectivity queries', 'Kruskal MST'],
    clues: ['connected components', 'redundant connection', 'provinces / friend circles', 'equations a==b', 'accounts merge', 'same row or column', 'after each addition'],
    template: `find(x): while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x;
union(a, b): ra = find(a), rb = find(b); if (ra === rb) return false;
             attach smaller under larger; count--; return true;`,
    complexity: 'O(α(n)) amortized per op with path compression + union by rank/size; O(n) space',
    mistakes: ['compare parents instead of roots', 'link nodes instead of roots', 'no rank/compression', 'recursive find stack overflow', 'id collisions between rows/cols', 'trying to delete edges'],
    jsTools: ['UnionFind (toolkit)', 'Array.from', 'Map', 'Int32Array'],
  },

  keyConcepts: [
    'Each group is a tree; its root is the representative. Same group ⇔ same root.',
    'union links root to root — one pointer merges two entire groups.',
    'union returning false means the two items were already connected (cycle / redundant fact).',
    'Union by rank/size bounds height by log n; path compression flattens paths; together O(α(n)) amortized.',
    'Map arbitrary keys (strings, coordinates) to integer ids; use offsets to keep different node kinds apart.',
    'Weighted DSU stores a ratio/difference to the parent so any two nodes in a group can be compared.',
    'DSU cannot split groups — for deletions, process operations in reverse.',
  ],

  interviewTips: [
    'Write the DSU class from memory with both optimizations.',
    'Explain why DSU instead of DFS: incremental edges and O(α(n)) connectivity checks.',
    'Mention components = n − successful unions.',
  ],
};
