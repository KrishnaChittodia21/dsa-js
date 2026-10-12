export default {
  id: 'trees',
  summary: 'A binary tree is a set of nodes where each node points to at most two children. Almost every tree problem is solved by visiting nodes depth-first (recursion / stack) or level by level (queue), and deciding what information flows down and what flows back up.',

  jsTools: [
    { api: 'TreeNode (toolkit)', use: '`new TreeNode(val, left, right)` — same shape as LeetCode', complexity: 'O(1) to create' },
    { api: 'arrayToTree / treeToArray (toolkit)', use: 'Convert LeetCode level-order arrays like [3,9,20,null,null,15,7] to nodes and back', complexity: 'O(n)' },
    { api: 'Array as a stack (push / pop)', use: 'Iterative DFS traversals', complexity: 'O(1) amortized' },
    { api: 'Array + head index (queue)', use: 'BFS without the O(n) cost of shift()', complexity: 'O(1) per dequeue' },
    { api: 'Map', use: 'value → index in inorder (tree construction), column → nodes (vertical order)', complexity: 'O(1) average' },
    { api: 'Array.prototype.sort with comparator', use: 'Order (col, row, val) tuples for vertical traversal', complexity: 'O(n log n)' },
    { api: 'String split / join', use: 'Serialize a tree to a string and parse it back', complexity: 'O(n)' },
  ],

  patterns: [
    {
      id: 'tree-dfs-traversal',
      name: 'Tree DFS — Preorder / Inorder / Postorder',
      summary: 'Visit a node and recurse into its subtrees. The only difference between the three orders is WHEN you process the node: before (pre), between (in) or after (post) its children.',
      whyItExists: 'A tree is defined recursively (a node + a left tree + a right tree), so the most natural algorithm is recursive too. DFS reaches every node once in O(n) and uses O(h) memory for the call stack, where h is the height.',
      whenToUse: [
        'You must look at every node (sum, count, max, search, copy, mirror)',
        'The answer for a node depends on its subtrees (postorder) or on its ancestors (preorder)',
        'You need values in sorted order from a BST (inorder — next topic)',
      ],
      clues: ['"traverse"', '"visit every node"', '"invert / mirror"', '"same / identical tree"', '"symmetric"', '"preorder / inorder / postorder"'],
      whenNotToUse: [
        'The question is about levels or "closest to the root" → BFS',
        'The tree is extremely deep (a 100,000-node chain) and you are in JS → use the iterative version to avoid stack overflow',
      ],
      template: `function dfs(node) {
  if (node === null) return;   // base case: empty tree
  // preorder: process node here
  dfs(node.left);
  // inorder: process node here
  dfs(node.right);
  // postorder: process node here
}`,
      variations: [
        { name: 'Iterative preorder', description: 'Stack: pop, visit, push right then left (so left is processed first).' },
        { name: 'Iterative inorder', description: 'Walk left pushing nodes; pop, visit, then go to its right child.' },
        { name: 'Iterative postorder', description: 'Reverse of a "root, right, left" preorder — or one stack with a lastVisited pointer.' },
        { name: 'Two trees at once', description: 'Recurse on (a.left, b.left) and (a.right, b.right) — or mirrored pairs for symmetry.' },
      ],
      mistakes: [
        'Forgetting the `null` base case',
        'Pushing left before right in iterative preorder (right would be processed first)',
        'Returning early from inside the recursion and losing results from the other subtree',
      ],
      evolution: {
        easy: 'Traverse and collect / count / mirror (invert, same tree, symmetric).',
        medium: 'Traversal that carries state (paths, good nodes) or builds a structure (flatten, construct).',
        hard: 'Traversal-based encodings (serialize), Morris traversal with O(1) space.',
      },
    },
    {
      id: 'tree-level-order',
      name: 'Tree BFS — Level Order',
      summary: 'Process the tree level by level with a queue. Take a snapshot of the queue size to know where one level ends and the next begins.',
      whyItExists: 'DFS dives deep before it goes wide, so it does not naturally know "all nodes at depth d". A FIFO queue visits nodes in order of their distance from the root, which makes level-based questions straightforward.',
      whenToUse: ['Anything "per level": level lists, averages, max per level, zigzag', 'Right / left side view', 'Minimum depth or "nearest" node (BFS stops at the first hit)'],
      clues: ['"level by level"', '"level order"', '"each depth"', '"right side view"', '"zigzag"', '"minimum depth"', '"closest leaf"'],
      whenNotToUse: ['The answer combines information from subtrees (height, diameter) — recursion is simpler'],
      template: `function levelOrder(root) {
  const levels = [];
  if (!root) return levels;
  const queue = [root];
  let head = 0;                              // dequeue by moving head: O(1)
  while (head < queue.length) {
    const size = queue.length - head;        // nodes on the current level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}`,
      variations: [
        { name: 'Level arrays', description: 'Keep `current` and `next` arrays instead of one queue — no head pointer needed.' },
        { name: 'Right side view', description: 'Record the last node of every level.' },
        { name: 'Zigzag', description: 'Reverse every other level (or fill the level array from the back).' },
      ],
      mistakes: ['Using `queue.shift()` in a loop — O(n) each, O(n²) total', 'Reading `queue.length` inside the level loop while pushing children (the level never ends)'],
      evolution: {
        easy: 'Level lists, averages, max depth by counting levels.',
        medium: 'Right side view, zigzag, connect next pointers.',
        hard: 'Vertical order with (column, row) coordinates, width of a tree with index arithmetic.',
      },
    },
    {
      id: 'tree-top-down',
      name: 'Tree Recursion — Top-Down (pass information down)',
      summary: 'The parent tells each child something about the path above it (depth so far, max value on the path, remaining sum). Each node uses that to update a global answer and passes an updated value further down.',
      whyItExists: 'Some properties depend on the ancestors of a node, not its descendants: "is this node ≥ everything above it?", "what is the sum from the root to here?". Passing a parameter is the cheapest way to make that information available.',
      whenToUse: ['A node\'s answer depends on the path from the root', 'Root-to-leaf sums / paths', 'Counting nodes that satisfy a condition relative to their ancestors'],
      clues: ['"from the root to"', '"path from root"', '"no node on the path above is greater"', '"depth of each node"', '"root-to-leaf"'],
      whenNotToUse: ['The answer at a node depends on its subtrees (height, size, balance) → bottom-up'],
      template: `function countGood(root) {
  let count = 0;
  function dfs(node, maxSoFar) {           // info flows DOWN as a parameter
    if (!node) return;
    if (node.val >= maxSoFar) count++;
    const next = Math.max(maxSoFar, node.val);
    dfs(node.left, next);
    dfs(node.right, next);
  }
  dfs(root, -Infinity);
  return count;
}`,
      variations: [
        { name: 'Global accumulator', description: 'Update an outer variable (count, best) at each node or leaf.' },
        { name: 'Remaining budget', description: 'Pass `target − node.val` down; at a leaf check it is 0 (path sum).' },
      ],
      mistakes: ['Updating the parameter in place for objects (arrays) and forgetting to undo', 'Checking the leaf condition on null nodes instead of real leaves'],
      evolution: {
        easy: 'Max depth by passing depth down; root-to-leaf path sum.',
        medium: 'Good nodes, sum root-to-leaf numbers, path sum II (with a path).',
        hard: 'Combine with bottom-up returns in the same DFS.',
      },
    },
    {
      id: 'tree-bottom-up',
      name: 'Tree Recursion — Bottom-Up (return information up)',
      summary: 'Each call returns a summary of its subtree (height, size, sum, "is balanced", best one-sided path). The parent combines the two children\'s summaries in O(1) — often updating a global answer along the way.',
      whyItExists: 'Many properties are defined by the subtrees: height, diameter, balance, maximum path. Computing them separately for every node repeats work (O(n²)); returning them from one postorder pass computes everything in O(n).',
      whenToUse: ['Height / depth / size of subtrees', 'Diameter, balance, maximum path sum', 'Any "the answer passes through some node" problem'],
      clues: ['"height"', '"diameter"', '"balanced"', '"maximum path sum"', '"longest path between any two nodes"', '"subtree"'],
      whenNotToUse: ['The node needs information about its ancestors → top-down'],
      template: `function diameterOfBinaryTree(root) {
  let best = 0;
  function height(node) {                  // info flows UP as a return value
    if (!node) return 0;
    const L = height(node.left);
    const R = height(node.right);
    best = Math.max(best, L + R);          // longest path THROUGH node
    return 1 + Math.max(L, R);             // what the parent needs
  }
  height(root);
  return best;
}`,
      variations: [
        { name: 'Sentinel for failure', description: 'Return −1 to mean "not balanced" so the whole check is one pass.' },
        { name: 'Return vs record', description: 'Return what the *parent* can use (one-sided path); record what uses *both* sides (the path through this node).' },
        { name: 'Return a tuple', description: 'Return [withNode, withoutNode] or {size, sum} when the parent needs several values.' },
      ],
      mistakes: ['Returning the two-sided value to the parent (a path cannot fork)', 'Calling height() inside another recursion → O(n²)', 'Forgetting that negative subtree sums should be dropped (max(0, …)) in max path sum'],
      evolution: {
        easy: 'Max depth, balanced tree, diameter.',
        medium: 'Longest univalue path, house robber III (tuple returns).',
        hard: 'Binary tree maximum path sum, camera placement (state returns).',
      },
    },
    {
      id: 'tree-path-backtracking',
      name: 'Tree Paths with Backtracking',
      summary: 'Carry a path array down the tree: push the node on entry, record a copy at a valid leaf, pop on exit so the parent\'s path is restored.',
      whyItExists: 'To list every root-to-leaf path that satisfies a rule we need the actual nodes, not just a number. One shared array + push/pop is O(h) memory instead of copying the path at every node.',
      whenToUse: ['List all root-to-leaf paths (with a sum or other condition)', 'Print paths, binary tree paths as strings'],
      clues: ['"return all root-to-leaf paths"', '"paths where the sum equals"', '"list the nodes on the path"'],
      whenNotToUse: ['Only a yes/no or a count is needed → top-down without a path array'],
      template: `function pathSum(root, target) {
  const result = [], path = [];
  function dfs(node, remaining) {
    if (!node) return;
    path.push(node.val);                          // choose
    remaining -= node.val;
    if (!node.left && !node.right && remaining === 0) result.push([...path]);
    dfs(node.left, remaining);                    // explore
    dfs(node.right, remaining);
    path.pop();                                   // undo
  }
  dfs(root, target);
  return result;
}`,
      variations: [{ name: 'Paths as strings', description: 'Binary Tree Paths: join the path with "->" at the leaf.' }, { name: 'Any downward path', description: 'Path Sum III: prefix sums along the current path in a Map (with undo).' }],
      mistakes: ['Returning early at a leaf before popping', 'Recording at nodes that are not leaves', 'Pushing the live path array'],
      evolution: { easy: 'Binary tree paths, has path sum.', medium: 'Path sum II (list paths).', hard: 'Path sum III with prefix sums + undo.' },
    },
    {
      id: 'tree-lca',
      name: 'Lowest Common Ancestor',
      summary: 'Recurse into both subtrees; each call returns p or q if it found one (or the LCA if it found both). The first node where both sides return non-null is the lowest common ancestor.',
      whyItExists: 'Without parent pointers we cannot walk upward. Letting each subtree "report back" whether it contains p or q lets the answer emerge at exactly the lowest node that sees both.',
      whenToUse: ['Lowest common ancestor of two nodes', 'Distance between two nodes (depth(p) + depth(q) − 2·depth(lca))'],
      clues: ['"lowest common ancestor"', '"deepest node that has both as descendants"', '"distance between two nodes"'],
      whenNotToUse: ['The tree is a BST → walk down using the ordering (BST topic)', 'Many LCA queries on the same tree → binary lifting (advanced)'],
      template: `function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  if (left && right) return root;   // p and q are on different sides
  return left ?? right;             // pass up whichever side found something
}`,
      variations: [{ name: 'Parent pointers', description: 'Walk up from p storing ancestors in a Set, then walk up from q until you hit the Set.' }, { name: 'Nodes may be missing', description: 'Count how many of p, q were actually found before trusting the answer.' }],
      mistakes: ['Comparing values when duplicates are possible (compare node references)', 'Continuing the search below p when q is in p\'s subtree (unnecessary: p is already the answer)'],
      evolution: { easy: 'LCA in a BST.', medium: 'LCA in a binary tree.', hard: 'LCA of deepest leaves, LCA with missing nodes, many queries.' },
    },
    {
      id: 'tree-construction',
      name: 'Tree Construction from Traversals',
      summary: 'Preorder tells you the root; its position in inorder splits the remaining nodes into left and right subtrees. Recurse with index ranges and a value → index Map.',
      whyItExists: 'One traversal alone is ambiguous (many trees share a preorder). Preorder + inorder (with unique values) pins down the tree: preorder gives the root first, inorder tells how many nodes go left.',
      whenToUse: ['Build a tree from two traversals', 'Build a balanced BST from sorted data (next topic)'],
      clues: ['"construct binary tree from preorder and inorder"', '"from inorder and postorder"', '"values are unique"'],
      whenNotToUse: ['Values are not unique — the split point is ambiguous'],
      template: `function buildTree(preorder, inorder) {
  const idx = new Map(inorder.map((v, i) => [v, i]));
  let p = 0;                                  // next root in preorder
  function build(lo, hi) {                    // inorder range [lo, hi]
    if (lo > hi) return null;
    const val = preorder[p++];
    const mid = idx.get(val);
    const node = new TreeNode(val);
    node.left = build(lo, mid - 1);           // left first: preorder order
    node.right = build(mid + 1, hi);
    return node;
  }
  return build(0, inorder.length - 1);
}`,
      variations: [{ name: 'Inorder + postorder', description: 'Roots come from the END of postorder; build the right subtree first.' }, { name: 'Preorder of a BST', description: 'Bounds instead of inorder (BST topic).' }],
      mistakes: ['Using `indexOf` on inorder at every step (O(n²))', 'Slicing arrays at every call (O(n²) time and memory)', 'Building right before left while consuming preorder left-to-right'],
      evolution: { easy: 'Sorted array → balanced BST.', medium: 'Preorder + inorder, inorder + postorder.', hard: 'Serialize/deserialize, construct from preorder + postorder (ambiguous cases).' },
    },
    {
      id: 'tree-serialization',
      name: 'Tree Serialization & Coordinates',
      summary: 'Turn a tree into a flat encoding that keeps its exact shape — a traversal that also records null children — and parse it back with the same traversal. The same idea of attaching explicit positions (row, column) to nodes powers vertical order traversal.',
      whyItExists: 'Traversals lose shape information unless you write down where the children are missing. Writing a marker for every null makes a single preorder (or level order) unambiguous, so one pass can rebuild the tree.',
      whenToUse: ['Serialize / deserialize, save or send a tree', 'Compare subtree shapes (encode each subtree as a string)', 'Assign coordinates to nodes and group/sort by them (vertical order)'],
      clues: ['"serialize"', '"deserialize"', '"encode / decode"', '"find duplicate subtrees"', '"vertical order"', '"column"'],
      whenNotToUse: ['You only need values, not shape → a plain traversal'],
      template: `function serialize(root) {
  const out = [];
  (function dfs(node) {
    if (!node) { out.push('#'); return; }   // record the missing child!
    out.push(node.val);
    dfs(node.left);
    dfs(node.right);
  })(root);
  return out.join(',');
}
function deserialize(data) {
  const tokens = data.split(',');
  let i = 0;
  function build() {
    const t = tokens[i++];
    if (t === '#') return null;
    const node = new TreeNode(Number(t));
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}`,
      variations: [{ name: 'Level-order encoding', description: 'LeetCode format: BFS writing "null" for missing children, trailing nulls trimmed.' }, { name: 'Coordinates', description: 'Vertical order: DFS/BFS with (row, col), children at (row+1, col∓1); sort by (col, row, val).' }],
      mistakes: ['Omitting null markers — the shape cannot be recovered', 'Using `parseInt` on multi-character tokens without a separator', 'Keeping the tree in a variable instead of truly encoding it'],
      evolution: { easy: 'Encode a tree as a string (tree to string with parentheses).', medium: 'Find duplicate subtrees via serialization.', hard: 'Serialize/deserialize, vertical order traversal.' },
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
            md: `A **binary tree** is a collection of boxes (nodes) connected like a family tree, drawn upside down: one node at the top, and every node has **at most two children**, a *left* one and a *right* one.

\`\`\`text
        3            ← root (depth 0)
       / \\
      9   20         ← depth 1
         /  \\
        15   7       ← depth 2 (leaves)
\`\`\`

In JavaScript each node is a small object:

\`\`\`js
class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}
\`\`\`

The toolkit already provides \`TreeNode\`, plus \`arrayToTree([3,9,20,null,null,15,7])\` which builds the tree above from LeetCode's **level-order array** (read the tree row by row, left to right, writing \`null\` for a missing child).`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terminology',
            md: `- **Root** — the top node (no parent). **Leaf** — a node with no children.
- **Parent / child** — a node and the node directly below it. **Ancestor / descendant** — anywhere above / below on the same branch.
- **Subtree** — a node together with all its descendants. Every child is the root of its own subtree — that is why recursion fits trees so well.
- **Depth of a node** — number of edges from the **root down to it** (root has depth 0).
- **Height of a node** — number of edges on the longest path from it **down to a leaf** (a leaf has height 0). The height of the tree = height of the root.
- **Level** — all nodes with the same depth.
- LeetCode's "maximum depth" counts **nodes** on the longest root-to-leaf path (so a single node has max depth 1). Always check which convention a problem uses.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A company org chart: the CEO is the root, each manager has reports below them, and individual contributors are leaves. "Depth" is how many levels below the CEO someone sits; "height" of a manager is how many levels of reports sit under them.',
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-1',
            question: 'In the tree `[3,9,20,null,null,15,7]` drawn above, what are the **depth of node 20** and the **height of node 20** (counting edges)?',
            options: ['depth 1, height 1', 'depth 2, height 0', 'depth 1, height 2', 'depth 0, height 2'],
            answer: 0,
            explanation: 'Depth is measured from the root down: root → 20 is one edge. Height is measured from the node down to its deepest leaf: 20 → 15 is one edge.',
            misconceptions: {
              1: 'Depth 2 / height 0 describes the leaves 15 and 7, not 20.',
              2: 'Height 2 would need a path of two edges below 20; its children are already leaves.',
              3: 'Depth 0 belongs only to the root (3). Height 2 is the height of the root, not of 20.',
            },
            deeper: 'Memory trick: **depth** is like diving from the surface (root) **down** to you; **height** is how tall the building is **below/under** you down to the ground (leaves). Depth is naturally passed **down** a recursion; height is naturally **returned up** — that distinction becomes the "top-down vs bottom-up" idea later in this lesson.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Trees model anything **hierarchical**: file systems, the HTML DOM, org charts, JSON documents, decision processes, expression parsing (\`(1 + 2) * 3\` is a tree with \`*\` at the root).

They are also the foundation for faster data structures you will meet next: **binary search trees** (ordered data with O(log n) search when balanced), **heaps** (priority queues) and **tries** (prefix search).

The skills you learn here — recursing into subtrees, deciding what to pass down and what to return up, traversing level by level — apply to every one of those structures and later to graphs.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'The one idea to hold on to',
            md: 'A tree is **a node plus two smaller trees**. So a tree problem can almost always be phrased as: *"If I already had the answer for the left subtree and the right subtree, how would I get the answer for this node?"* That question drives most solutions in this topic.',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `You rarely *choose* a tree — the input is a tree. The real decision is **which traversal** and **which direction information flows**:

| Question type | Use |
|---|---|
| Visit / transform every node (invert, copy, sum) | DFS (any order) |
| Answer depends on subtrees (height, balance, diameter) | DFS **postorder**, bottom-up returns |
| Answer depends on ancestors (path sums, good nodes) | DFS **preorder**, top-down parameters |
| Anything "per level", side views, minimum depth | **BFS** with a queue |
| List root-to-leaf paths | DFS + path array with backtracking |
| Rebuild / encode shape | Traversal with index maps / null markers |`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-2',
            question: '"Return the value of the leftmost node on the **last** level of the tree." Which traversal fits most directly?',
            options: [
              'Inorder DFS — it visits the leftmost node first',
              'BFS level order — process level by level and remember the first node of each level',
              'Postorder DFS — process children before parents',
              'Preorder DFS — the root is always the answer',
            ],
            answer: 1,
            explanation: '"Last level" is a level question. BFS naturally hands you each level in turn; the first node of the final level is the answer. (DFS can do it too, but you must track depth and compare.)',
            misconceptions: {
              0: 'Inorder visits the leftmost node of the **whole tree** first, which may be on a shallow level — e.g. a root whose left child is a leaf while the deepest level is on the right.',
              2: 'Postorder changes the processing time of parents vs children but knows nothing about levels without extra bookkeeping.',
              3: 'The root is on the first level, not the last.',
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
            clues: ['input is a `root` TreeNode', '"height / depth / diameter / balanced"', '"level order / each level / right side view"', '"path from root to leaf"', '"lowest common ancestor"', '"construct from preorder and inorder"', '"serialize / deserialize"'],
            conclusion: 'Think tree DFS (what flows down? what flows up?) or tree BFS (levels)',
          },
          {
            type: 'text',
            md: `A fast mental checklist:

1. **Does each node need something from its ancestors?** → pass it down as a parameter (top-down).
2. **Does each node need something from its children?** → return it (bottom-up, postorder).
3. **Is the question about levels or distance from the root?** → BFS.
4. **Do I need the actual nodes on a path?** → path array + push/pop (backtracking).`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — the four traversal orders',
        blocks: [
          {
            type: 'text',
            md: `Every DFS visits nodes in the same *walk* — go left as far as possible, come back, go right. The three DFS orders only differ in **when you write the node down**:

- **Preorder** (node, left, right): write the node when you first arrive. → \`3, 9, 20, 15, 7\`
- **Inorder** (left, node, right): write it after finishing the left subtree. → \`9, 3, 15, 20, 7\`
- **Postorder** (left, right, node): write it when leaving for the last time. → \`9, 15, 7, 20, 3\`
- **Level order** (BFS): row by row. → \`3, 9, 20, 15, 7\`

Step through each one below on the same tree.`,
          },
          { type: 'visual', scenario: 'tree-traversal', input: { tree: [1, 2, 3, 4, 5, null, 6], order: 'preorder' }, caption: 'Preorder: a node is recorded the moment it is first reached (node → left → right).' },
          { type: 'visual', scenario: 'tree-traversal', input: { tree: [1, 2, 3, 4, 5, null, 6], order: 'inorder' }, caption: 'Inorder: a node is recorded after its whole left subtree (left → node → right). For a BST this is sorted order.' },
          { type: 'visual', scenario: 'tree-traversal', input: { tree: [1, 2, 3, 4, 5, null, 6], order: 'postorder' }, caption: 'Postorder: a node is recorded only after both subtrees are done (left → right → node) — the order bottom-up recursion computes answers.' },
          { type: 'visual', scenario: 'tree-traversal', input: { tree: [1, 2, 3, 4, 5, null, 6], order: 'level' }, caption: 'Level order (BFS): a queue releases nodes in order of depth.' },
          {
            type: 'checkpoint',
            id: 'trees-cp-3',
            question: 'Tree `[1,2,3,4,5,null,6]` (1 has children 2 and 3; 2 has 4 and 5; 3 has right child 6). What is its **postorder**?',
            options: ['1, 2, 4, 5, 3, 6', '4, 2, 5, 1, 3, 6', '1, 2, 3, 4, 5, 6', '4, 5, 2, 6, 3, 1'],
            answer: 3,
            explanation: 'Postorder = left subtree, right subtree, node. Left subtree of 1 is (4, 5, 2), right subtree is (6, 3), then 1. The root is always **last** in postorder.',
            misconceptions: {
              0: 'That is preorder — node before children. In preorder the root is first.',
              1: 'That is inorder — the root sits between its left and right subtrees.',
              2: 'That is level order (BFS), row by row.',
            },
            deeper: 'Quick checks: preorder starts with the root, postorder ends with the root, inorder has the root somewhere in the middle with the whole left subtree before it. These facts are exactly what tree construction from traversals relies on.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `Let us see the classic trap with **Diameter of a Binary Tree** — the number of edges on the longest path between *any* two nodes.

The longest path "bends" at some node: it goes down that node's left side and down its right side. If \`height(x)\` counts the **nodes** on the longest downward path from \`x\` (with \`height(null) = 0\`), then the number of **edges** on the longest path bending at \`node\` is exactly \`height(node.left) + height(node.right)\`.

The obvious code computes \`height\` separately for every node:`,
          },
          {
            type: 'code',
            title: 'Brute force — O(n²) on a skewed tree',
            code: `function height(node) {               // nodes on the longest downward path
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}
function diameterOfBinaryTree(root) {
  if (!root) return 0;
  const through = height(root.left) + height(root.right);   // O(size of subtree)
  return Math.max(through,
                  diameterOfBinaryTree(root.left),
                  diameterOfBinaryTree(root.right));
}`,
            caption: 'Each call to height walks the whole subtree again. For a chain of n nodes: n + (n−1) + … = O(n²).',
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-4',
            question: 'Why is the brute-force diameter O(n²) on a chain-shaped tree?',
            options: [
              'Because it uses recursion',
              'Because heights of the same subtrees are recomputed from scratch at every ancestor',
              'Because Math.max is O(n)',
              'It is O(n log n), not O(n²)',
            ],
            answer: 1,
            explanation: 'The node at depth d has its height computed by all d ancestors. Summed over a chain that is 1 + 2 + … + n = O(n²). The fix is to compute each height **once** and use it for both purposes — the bottom-up pattern.',
            misconceptions: {
              0: 'The O(n) solution is also recursive. What matters is how many times each node is visited.',
              2: 'Math.max of 2–3 numbers is O(1).',
              3: 'O(n log n) happens only on balanced trees (height log n). Complexity is judged on the worst case, a chain.',
            },
          },
        ],
      },
      {
        id: 'optimized-dfs',
        title: 'Optimized approach — DFS recursively and with an explicit stack',
        blocks: [
          {
            type: 'text',
            md: `Recursive DFS is 4 lines, but it uses the **call stack**: each pending call is a frame. JavaScript engines allow roughly 10,000 frames, so a degenerate tree (a 100,000-node chain) can throw \`RangeError: Maximum call stack size exceeded\`.

An **explicit stack** (an array) does the same job without that limit.`,
          },
          {
            type: 'code',
            title: 'Iterative preorder and inorder',
            code: `function preorder(root) {
  const out = [], stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop();
    out.push(node.val);
    if (node.right) stack.push(node.right);   // push right FIRST…
    if (node.left) stack.push(node.left);     // …so left is popped first
  }
  return out;
}

function inorder(root) {
  const out = [], stack = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.left; }  // go as far left as possible
    cur = stack.pop();
    out.push(cur.val);                               // visit
    cur = cur.right;                                 // then the right subtree
  }
  return out;
}

function postorder(root) {                // "node, right, left" reversed = "left, right, node"
  const out = [], stack = root ? [root] : [];
  while (stack.length) {
    const node = stack.pop();
    out.push(node.val);
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }
  return out.reverse();
}`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-5',
            question: 'In iterative preorder, why do we push the **right** child before the **left** child?',
            options: [
              'A stack is last-in-first-out, so the child pushed last (left) is processed first — matching node → left → right',
              'Right children are more important',
              'It does not matter; the output is the same',
              'To make it a BFS',
            ],
            answer: 0,
            explanation: 'LIFO reverses the push order. Pushing right then left means left comes out first, which is what preorder requires.',
            misconceptions: {
              1: 'Both children matter equally; this is purely about the order a stack releases them.',
              2: 'Swapping the pushes produces node → right → left, a different (mirrored) order.',
              3: 'BFS needs a FIFO queue. A stack always gives depth-first behaviour.',
            },
          },
        ],
      },
      {
        id: 'optimized-bfs',
        title: 'Optimized approach — BFS level order',
        blocks: [
          {
            type: 'text',
            md: `BFS uses a **queue** (first in, first out). Put the root in; repeatedly take the front node, process it and add its children at the back. Nodes therefore come out in order of depth.

To separate levels, read the queue size **before** processing a level: exactly that many nodes belong to the current level; everything pushed while processing them belongs to the next one.

**JavaScript warning:** \`array.shift()\` is O(n) because it re-indexes the whole array. Use a **head pointer** (\`queue[head++]\`), the toolkit's \`Queue\`, or build a fresh \`next\` array for every level.`,
          },
          {
            type: 'code',
            title: 'Level order with level arrays (no queue needed)',
            code: `function levelOrder(root) {
  const result = [];
  let level = root ? [root] : [];
  while (level.length) {
    result.push(level.map((n) => n.val));
    const next = [];
    for (const n of level) {
      if (n.left) next.push(n.left);
      if (n.right) next.push(n.right);
    }
    level = next;
  }
  return result;
}`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-6',
            question: 'You write `for (let i = 0; i < queue.length - head; i++)` as the level loop while pushing children into the same queue. What goes wrong?',
            options: [
              'Nothing — it is equivalent to snapshotting the size',
              'It only processes the first node',
              'The bound changes as children are pushed (and head moves), so a "level" absorbs nodes from the next level',
              'It throws an error',
            ],
            answer: 2,
            explanation: 'The loop condition is re-evaluated every iteration. Pushing children increases `queue.length`, so the loop keeps going into the next level. Store `const size = queue.length - head` **before** the loop.',
            misconceptions: {
              0: 'It is only equivalent if nothing is pushed during the loop, which is exactly what BFS does.',
              1: 'It usually processes too many nodes, not too few.',
              3: 'No error — just silently wrong level boundaries.',
            },
          },
        ],
      },
      {
        id: 'optimized-top-down-bottom-up',
        title: 'Optimized approach — top-down vs bottom-up recursion',
        blocks: [
          {
            type: 'text',
            md: `There are two ways information can travel in a tree recursion. Let us solve **the same problem — maximum depth — both ways**.

**Top-down:** the parent tells the child "you are at depth d". The child uses that to update a global answer (at leaves) and tells *its* children "you are at depth d + 1". Information flows **down through parameters**.

**Bottom-up:** the child tells the parent "my subtree is h tall". The parent combines: "then I am 1 + max(left, right) tall". Information flows **up through return values**.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Top-down (preorder, parameter)',
              code: `function maxDepth(root) {
  let best = 0;
  function dfs(node, depth) {
    if (!node) return;
    best = Math.max(best, depth); // use info from above
    dfs(node.left, depth + 1);    // pass it further down
    dfs(node.right, depth + 1);
  }
  dfs(root, 1);
  return best;
}`,
            },
            right: {
              title: 'Bottom-up (postorder, return value)',
              code: `function maxDepth(root) {
  if (!root) return 0;
  const L = maxDepth(root.left);   // ask the children
  const R = maxDepth(root.right);
  return 1 + Math.max(L, R);       // combine on the way up
}`,
            },
          },
          {
            type: 'text',
            md: `Both are O(n). The difference is **where the knowledge lives**:

| | Top-down | Bottom-up |
|---|---|---|
| Info flows | root → leaves (parameters) | leaves → root (return values) |
| Natural order | preorder (use it, then recurse) | postorder (recurse, then combine) |
| Typical state | depth so far, max on path, remaining sum | height, size, "is balanced", best path |
| Answer stored in | a global/outer variable, updated at nodes | the return value (sometimes plus a global) |
| Examples | Count Good Nodes, Path Sum | Diameter, Balanced Tree, Max Path Sum |

**How to choose:** ask "does this node need to know about what is **above** it or **below** it?"

**Count Good Nodes** (a node is good if no ancestor is larger) needs the maximum *above* it → top-down: \`dfs(node, maxSoFar)\`.

**Diameter** needs the heights *below* each node → bottom-up: return height, record \`L + R\` as a candidate on the way.`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-7',
            question: '"A tree is balanced if, for every node, the heights of its two subtrees differ by at most 1." Which design gives O(n)?',
            options: [
              'Top-down: pass the depth down and compare depths of leaves',
              'For every node, call a separate height() on both children and compare',
              'BFS: check that every level is full',
              'Bottom-up: return the subtree height, or −1 as soon as any subtree is unbalanced, so each node is visited once',
            ],
            answer: 3,
            explanation: 'Balance at a node depends on its children\'s heights → information from **below** → bottom-up. Returning −1 as a "failed" sentinel lets the whole check finish in a single postorder pass.',
            misconceptions: {
              0: 'The rule is about the two subtree **heights at every node**, which is information from below. Comparing leaf depths globally is a different (and wrong) test: [1,2,3,4,null,null,null,5] has leaves at depths 1 and 3 — yet the real reason it is unbalanced is node 2 (left height 2, right height 0), which a global leaf check cannot pinpoint in general.',
              1: 'This is the brute force: each height() call re-walks a subtree → O(n²) on a chain.',
              2: 'A balanced tree need not have full levels (e.g. [1,2,3,4] is balanced but its last level is not full).',
            },
            deeper: 'Pattern for "compute X for every node and check a rule": make the recursion **return X** and check the rule right after the two recursive calls. If the rule fails, return a sentinel (−1, null, Infinity) that every ancestor passes straight up.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why, in Diameter, we **record** `L + R` but **return** `1 + max(L, R)`?',
            deeper: `They answer two different questions.

- \`L + R\` = the longest path that **bends at this node** (goes down both sides). It is a candidate for the final answer, so we compare it with the global best.
- \`1 + max(L, R)\` = the longest path that **starts at this node and goes down one side**. That is the only thing the parent can use, because a path coming from the parent can continue into just **one** child — a path cannot fork.

This "record the two-sided value, return the one-sided value" split is the key to Binary Tree Maximum Path Sum as well.`,
          },
        ],
      },
      {
        id: 'optimized-paths-lca',
        title: 'Optimized approach — paths (backtracking) and LCA',
        blocks: [
          {
            type: 'text',
            md: `### Root-to-leaf paths
To *list* paths (Path Sum II), carry a shared \`path\` array: push the node when entering, record a **copy** at a leaf that meets the condition, and **pop** when leaving the node. This is exactly the Choose → Explore → Undo pattern from the Backtracking topic, with the tree's children as the choices.

### Lowest Common Ancestor (LCA)
The LCA of \`p\` and \`q\` is the **deepest** node that has both as descendants (a node counts as its own descendant).

\`\`\`js
function lca(root, p, q) {
  if (!root || root === p || root === q) return root;
  const left = lca(root.left, p, q);
  const right = lca(root.right, p, q);
  if (left && right) return root;
  return left ?? right;
}
\`\`\`

**Why does this work?** Read the return value as *"what did I find in this subtree?"*:
- \`null\` → neither p nor q is here.
- \`p\` (or \`q\`) → one of them is here (and maybe the other is below it).
- some node X → both were found below and X is their LCA; just pass it up.

At the LCA itself, p and q are in **different** subtrees (so \`left\` and \`right\` are both non-null) — or the LCA **is** p (or q) and the other is somewhere below it; the early \`return root\` handles that case because the answer is p itself. Every ancestor above the LCA sees a non-null value from only one side and passes it up unchanged, so the LCA reaches the top.`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-8',
            question: 'Tree `[3,5,1,6,2,0,8,null,null,7,4]`, p = 5, q = 4 (4 is inside 5\'s subtree). What does the recursion return at the root, and why?',
            options: [
              'Node 3, because it is the root',
              'Node 2, the parent of 4',
              'Node 5: the left call returns 5 immediately (root === p), the right call returns null, so 5 is passed up',
              'null, because 4 is never visited',
            ],
            answer: 2,
            explanation: 'When the recursion reaches 5 it returns 5 without looking deeper. The right subtree (1, 0, 8) contains neither, so it returns null. At 3: left = 5, right = null → return 5. Stopping at 5 is safe because if q were *not* below 5 the other side would have returned non-null and made 3 the answer.',
            misconceptions: {
              0: '3 is returned only when p and q are found on **different** sides of it.',
              1: '2 is an ancestor of 4 but not of 5. The LCA must be an ancestor of both.',
              3: 'It is true that 4 is never visited, but it does not need to be: finding p is enough when q lies beneath it (the problem guarantees both exist).',
            },
            deeper: 'This relies on the guarantee that both p and q exist in the tree. If one might be missing, you must search the whole tree and count how many of them you actually found before trusting the result.',
          },
        ],
      },
      {
        id: 'optimized-construction-serialization',
        title: 'Optimized approach — construction and serialization',
        blocks: [
          {
            type: 'text',
            md: `### Build from preorder + inorder
- \`preorder[0]\` is the root.
- Find the root in \`inorder\`: everything to its left is the left subtree, everything to its right the right subtree.
- Recurse. The next values of preorder are the left subtree's preorder, then the right subtree's.

\`\`\`text
preorder = [3, 9, 20, 15, 7]     inorder = [9, 3, 15, 20, 7]
root 3 → inorder splits into [9] | 3 | [15, 20, 7]
left subtree = 1 node (9); right subtree root = next preorder value 20, which splits [15] | 20 | [7]
\`\`\`

Two details make it O(n): a **Map from value to inorder index** (instead of \`indexOf\`, which is O(n)), and passing **index ranges** instead of slicing arrays.

### Serialization
A traversal of values alone is ambiguous: \`[1,2]\` in preorder could be 2 as left or as right child of 1. Writing a marker for **every null child** removes the ambiguity: \`"1,2,#,#,#"\` vs \`"1,#,2,#,#"\`. Deserialization reads tokens with the **same** traversal, consuming one token per call.

### Coordinates (vertical order)
Give the root (row 0, col 0); a left child is (row + 1, col − 1), a right child (row + 1, col + 1). Collect \`[col, row, val]\` for every node, sort by col, then row, then value, and group by column.`,
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-9',
            question: 'Why is the preorder `"1,2,3"` **without** null markers not enough to rebuild a tree?',
            options: [
              'Because values could be negative',
              'Because many different shapes share that preorder — e.g. 2 and 3 as left and right children of 1, or a chain 1 → 2 → 3',
              'Because preorder can only be read from right to left',
              'It is enough; preorder always determines the tree',
            ],
            answer: 1,
            explanation: 'Preorder tells the visiting order but not where subtrees end. `1(2,3)` and `1→2→3` (all left children) and `1→2` with 3 as 2\'s right child all give 1,2,3. Null markers (or a second traversal like inorder) pin down the shape.',
            misconceptions: {
              0: 'Signs are handled by parsing tokens; the problem is shape, not values.',
              2: 'Preorder is read left to right; the direction is not the issue.',
              3: 'Only with extra information (null markers, inorder, or BST ordering) is preorder enough.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'The tree recursion skeleton',
            code: `function solve(root) {
  let answer = /* initial global answer, if needed */ 0;

  // down: information from ancestors (top-down)
  // returns: information about this subtree (bottom-up)
  function dfs(node, down) {
    if (node === null) return /* value for the empty tree */ 0;

    // PREORDER spot: use / update 'down', maybe update answer
    const nextDown = /* derive from down and node.val */ down;

    const L = dfs(node.left, nextDown);
    const R = dfs(node.right, nextDown);

    // POSTORDER spot: combine L and R, maybe update answer
    answer = Math.max(answer, /* candidate using L and R */ L + R);
    return /* summary the PARENT needs */ 1 + Math.max(L, R);
  }

  dfs(root, /* initial down */ 0);
  return answer;
}`,
          },
          {
            type: 'text',
            md: `Before coding, fill in three blanks out loud:
1. **What is the empty tree's value?** (0 for height/sum, true for balanced/symmetric, null for LCA)
2. **What does the parent need from me?** (the return value)
3. **What do I need from my parent?** (the parameter)

For BFS, the template is the level-order loop with a size snapshot.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the base case for `null` is so important in tree recursion?',
            deeper: `Every leaf has two \`null\` children, so **more than half of all recursive calls are on null** (a tree with n nodes has n + 1 null child pointers). A correct base case makes those calls cheap and meaningful: height of an empty tree is 0, an empty tree is balanced, two empty trees are the same.

Choosing the base value carefully also removes special cases: with \`height(null) = 0\` you never need "if left exists…" checks. For **max path sum**, the base value 0 plus \`Math.max(0, child)\` quietly handles "don't extend into a negative subtree".`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Count good nodes (top-down) and balanced tree (bottom-up)',
            code: `function goodNodes(root) {
  function dfs(node, maxAbove) {
    if (!node) return 0;
    const good = node.val >= maxAbove ? 1 : 0;
    const m = Math.max(maxAbove, node.val);
    return good + dfs(node.left, m) + dfs(node.right, m);
  }
  return dfs(root, -Infinity);
}

function isBalanced(root) {
  function height(node) {               // -1 means "unbalanced below"
    if (!node) return 0;
    const L = height(node.left);
    if (L === -1) return -1;
    const R = height(node.right);
    if (R === -1 || Math.abs(L - R) > 1) return -1;
    return 1 + Math.max(L, R);
  }
  return height(root) !== -1;
}`,
            caption: 'goodNodes mixes both directions: the max flows down as a parameter, the count flows up as a return value.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Test with the toolkit: \`const root = arrayToTree([3,9,20,null,null,15,7]); treeToArray(invertTree(root));\`
- Compare nodes by **reference** (\`node === p\`) when the problem hands you node objects; values may repeat.
- \`left ?? right\` returns \`right\` only when \`left\` is \`null\`/\`undefined\` — handy in LCA.
- Deep recursion: V8's default stack fits roughly 10k frames. For "n ≤ 10⁵" on possibly skewed trees, prefer iterative traversals.
- \`queue.shift()\` is O(n); use a head index or level arrays.
- Nested functions (closures) keep shared state (\`answer\`, \`path\`, index maps) without globals.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'diameterOfBinaryTree([1,2,3,4,5]) — bottom-up, postorder',
            columns: ['node', 'L (height left)', 'R (height right)', 'candidate L + R', 'best', 'returns 1 + max(L, R)'],
            rows: [
              ['4', '0', '0', '0', '0', '1'],
              ['5', '0', '0', '0', '0', '1'],
              ['2', '1', '1', '2', '2', '2'],
              ['3', '0', '0', '0', '2', '1'],
              ['1', '2', '1', '3', '3', '3'],
            ],
            note: 'Each node is processed once, after its children (postorder). Longest path 4 → 2 → 1 → 3 has 3 edges.',
          },
          {
            type: 'checkpoint',
            id: 'trees-cp-10',
            question: 'Suppose node 2 returned its candidate `L + R` to the parent instead of `1 + max(L, R)`. On this tree both happen to be 2, so the answer stays 3. What happens on `[1,2,7,3,4,null,null,5,null,null,6]` (2 has children 3 and 4, which have children 5 and 6; 7 is 1\'s right child)? The true diameter is 4.',
            options: [
              'Still 4 — the two formulas are interchangeable',
              'An infinite recursion',
              '5 — node 2 would hand up 4, so node 1 computes 4 + 1, a "path" that passes through node 2 twice',
              '3 — the answer gets smaller',
            ],
            answer: 2,
            explanation: 'Node 2 sees L = 2 and R = 2. Returning L + R = 4 tells node 1 "there is a 4-node path hanging below me", but that path uses **both** of 2\'s branches. A path coming down from 1 can only continue into **one** of them. Node 1 then records 4 + 1 = 5 edges, which is impossible. The parent must receive a **one-sided** value.',
            misconceptions: {
              0: 'They only coincide when one side of the node is at most 1 deep. Always test a tree where an inner node has two deep sides **and** its parent has another branch.',
              1: 'The recursion terminates normally; it just computes a wrong number.',
              3: 'Returning a larger value can only make candidates larger, never smaller.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Missing or wrong null base case** (e.g. height(null) = 1).
2. **Height vs depth / edges vs nodes** confusion — check what the problem counts.
3. **Recomputing subtree information** inside another recursion (O(n²)) instead of returning it.
4. **Returning a two-sided value** to the parent (diameter, max path sum).
5. **Checking "leaf" wrongly** — a leaf has *both* children null; a node with one child is not a leaf (path sum!).
6. **\`shift()\` in BFS** and reading the queue length inside the level loop.
7. **Forgetting to pop** from the path array (path sum II), or pushing the live array.
8. **\`indexOf\` / \`slice\`** in tree construction → O(n²).
9. **Stack overflow** on skewed trees with deep recursion in JS — know the iterative versions.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why "path sum" must check that a node is a real leaf, and not just that the recursion reached null?',
            deeper: `Take root 1 with only a left child 2 and target 1. If the check were "remaining === 0 when we reach null", the empty **right** child of 1 would report success — but 1 alone is not a root-to-**leaf** path, because 1 has a child.

Checking \`!node.left && !node.right\` on a real node guarantees the path ends at a leaf. Null children should simply return "nothing found".`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n) for traversals and most tree recursions',
            space: 'O(h) for DFS (h = height), O(w) for BFS (w = max width)',
            md: `**Time:** each node is visited a constant number of times → O(n). Watch for hidden extra factors: sorting in vertical order (O(n log n)), copying paths at leaves (O(h) per path), \`indexOf\` in construction.

**Space:**
- DFS keeps one frame per level of the current path: **O(h)**. For a balanced tree h ≈ log₂ n; for a chain h = n.
- BFS keeps up to one full level in the queue: **O(w)**. The last level of a complete tree holds about n/2 nodes, so BFS can use O(n).

| Tree shape | h | DFS space | BFS space |
|---|---|---|---|
| Balanced | log n | O(log n) | O(n) |
| Chain | n | O(n) | O(1) |`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the recursion contract** before coding: "\`height(node)\` returns the number of nodes on the longest downward path; \`null\` returns 0."
- **Name the direction:** "the max value on the path flows down; the count flows up."
- **Draw a 5–7 node example**, including a node with one child and an unbalanced side.
- **State complexity in terms of n and h**, and mention the skewed-tree worst case.
- **Offer the iterative version** when the tree may be deep, or when asked about stack usage.
- **Edge cases:** empty tree, single node, all nodes on one side, negative values (max path sum), duplicates (LCA by reference).`,
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
              { api: 'new TreeNode(val, left, right)', use: 'Create nodes (toolkit)', complexity: 'O(1)' },
              { api: 'arrayToTree(arr) / treeToArray(root)', use: 'LeetCode level-order arrays ⇄ nodes (toolkit)', complexity: 'O(n)' },
              { api: 'findNode(root, val)', use: 'Get a node reference by value, e.g. for LCA tests (toolkit)', complexity: 'O(n)' },
              { api: 'traversals.preorder / inorder / postorder / levelOrder', use: 'Reference traversals for checking your own (toolkit)', complexity: 'O(n)' },
              { api: 'stack.push / stack.pop', use: 'Iterative DFS', complexity: 'O(1) amortized' },
              { api: 'queue[head++]', use: 'O(1) dequeue for BFS (avoid shift)', complexity: 'O(1)' },
              { api: 'new Map(inorder.map((v, i) => [v, i]))', use: 'Value → inorder index for construction', complexity: 'O(n) build, O(1) lookup' },
              { api: 'arr.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])', use: 'Multi-key sort for vertical order', complexity: 'O(n log n)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Input is a binary tree root', 'Per-node answers from subtrees (bottom-up)', 'Per-node answers from ancestors (top-down)', 'Per-level answers (BFS)', 'List root-to-leaf paths (backtracking)'],
    clues: ['height / depth / diameter / balanced', 'level order / right side view / zigzag', 'root-to-leaf path', 'lowest common ancestor', 'construct from traversals', 'serialize', 'vertical order'],
    template: `function dfs(node, down) {
  if (!node) return BASE;
  const L = dfs(node.left, next(down, node));
  const R = dfs(node.right, next(down, node));
  answer = best(answer, combine(L, R, node)); // two-sided candidate
  return up(L, R, node);                      // one-sided for the parent
}`,
    complexity: 'O(n) time; O(h) space for DFS, O(w) for BFS',
    mistakes: ['null base case', 'height vs depth, edges vs nodes', 'recomputing heights (O(n²))', 'returning two-sided values', 'leaf check', 'shift() in BFS', 'forgetting path.pop()', 'indexOf/slice in construction'],
    jsTools: ['TreeNode', 'arrayToTree', 'treeToArray', 'findNode', 'stack via push/pop', 'queue via head index', 'Map'],
  },

  keyConcepts: [
    'A tree is a node plus two smaller trees — solve it by combining the answers for the subtrees.',
    'Depth is measured from the root down; height from a node down to its deepest leaf.',
    'Preorder / inorder / postorder only differ in when the node is processed; BFS goes level by level with a queue.',
    'Top-down passes information from ancestors as parameters; bottom-up returns subtree summaries.',
    'Record two-sided candidates globally, return one-sided values to the parent (diameter, max path sum).',
    'LCA: each subtree reports what it found; the first node receiving reports from both sides is the answer.',
    'Preorder gives roots, inorder splits subtrees; null markers make a single traversal unambiguous.',
    'DFS uses O(h) space, BFS O(w); deep skewed trees can overflow the JS call stack.',
  ],

  interviewTips: [
    'State the recursion contract (what the function returns, what null returns).',
    'Say which information flows down and which flows up.',
    'Test on a skewed tree and on a node with one child.',
    'Mention the iterative alternative for deep trees.',
  ],
};
