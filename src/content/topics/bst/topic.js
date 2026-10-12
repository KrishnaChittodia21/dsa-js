export default {
  id: 'bst',
  summary: 'A binary tree where every node is greater than everything in its left subtree and smaller than everything in its right subtree — so you can search it like a sorted array, and an in-order walk reads it back in sorted order.',

  jsTools: [
    { api: 'TreeNode (toolkit)', use: 'The node shape { val, left, right } used by every tree problem', complexity: 'O(1) to create' },
    { api: 'BST (toolkit)', use: 'Reference insert / has / delete / min / max / inorder implementation', complexity: 'O(h) per operation' },
    { api: 'traversals.inorder (toolkit)', use: 'Quick sorted dump of a BST while debugging', complexity: 'O(n)' },
    { api: 'Array as a stack (push / pop)', use: 'Iterative in-order traversal and the BST iterator', complexity: 'O(1) amortized' },
    { api: '-Infinity / Infinity', use: 'Initial open bounds when passing (low, high) ranges down the tree', complexity: 'O(1)' },
    { api: 'Recursion with default parameters', use: 'function valid(node, lo = -Infinity, hi = Infinity)', complexity: 'O(h) call stack' },
  ],

  patterns: [
    {
      id: 'bst-guided-descent',
      name: 'BST — Guided Descent (search / insert / delete / LCA)',
      summary: 'At each node compare the target with node.val and go to exactly ONE side. You never need to look at the other subtree.',
      whyItExists: 'The ordering invariant tells you which half of the remaining tree can contain the answer — exactly like binary search on a sorted array. That turns an O(n) scan into an O(h) walk, where h is the height (O(log n) when the tree is balanced).',
      whenToUse: [
        'Find / insert / delete a value in a BST',
        'Find the floor, ceiling, closest value, successor or predecessor of a value',
        'Lowest common ancestor in a BST: the first node where p and q split to different sides',
      ],
      clues: ['"binary search tree"', '"search for value"', '"insert into BST"', '"delete node"', '"closest value"', '"inorder successor"', '"lowest common ancestor of a BST"'],
      whenNotToUse: [
        'The tree is a plain binary tree (no ordering) — you must visit both subtrees',
        'You need every node that satisfies a condition not tied to ordering (e.g. "count nodes with even value")',
      ],
      template: `function search(root, target) {
  let node = root;
  while (node) {
    if (target === node.val) return node;
    node = target < node.val ? node.left : node.right; // discard one whole side
  }
  return null;
}`,
      variations: [
        { name: 'Insert', description: 'Descend until you fall off the tree; attach the new node where you fell off. It always becomes a leaf.' },
        { name: 'Delete (3 cases)', description: 'Leaf → remove. One child → splice the child up. Two children → copy the in-order successor (min of right subtree) into the node, then delete the successor from the right subtree.' },
        { name: 'LCA in a BST', description: 'If both values are smaller go left, both larger go right; otherwise the current node is the split point = LCA.' },
        { name: 'Floor / ceiling', description: 'Remember the best candidate every time you move in the direction that keeps it valid.' },
      ],
      mistakes: [
        'Searching both subtrees "just in case" — that throws away the O(h) advantage',
        'In recursive insert/delete, forgetting to assign the returned subtree back (node.left = insert(node.left, val))',
        'Deleting a two-children node by just removing it — its two subtrees need a new parent that keeps the ordering',
      ],
      evolution: {
        easy: 'Search for a value; walk to min/max.',
        medium: 'Insert, delete with the successor trick, LCA using ordering, closest value.',
        hard: 'Order-statistics trees (augment nodes with subtree sizes), balanced trees (AVL / red-black) — you will rarely code them in interviews but should know why they exist.',
      },
    },
    {
      id: 'bst-inorder-sorted',
      name: 'BST — In-order Traversal = Sorted Order',
      summary: 'Left, node, right on a BST visits values in increasing order. Any "sorted order" question becomes a single in-order walk that remembers the previous value.',
      whyItExists: 'In-order visits everything in the left subtree (all smaller), then the node, then the right subtree (all larger). By induction on the subtrees, the output is sorted. So problems that would be easy on a sorted array (kth smallest, closest adjacent pair, find two misplaced elements) are easy on a BST.',
      whenToUse: [
        'k-th smallest / largest value',
        'Minimum difference between any two values (it is always between in-order neighbours)',
        'Recover a BST where two values were swapped (find the two "descents" in in-order)',
        'Design an iterator that returns values in sorted order (controlled in-order with a stack)',
      ],
      clues: ['"kth smallest"', '"minimum absolute difference"', '"two nodes were swapped by mistake"', '"iterator"', '"next smallest"', '"in sorted order"'],
      whenNotToUse: [
        'The tree is not a BST — in-order of a plain binary tree has no special meaning',
        'You need a value by *key* only once — guided descent is O(h), a full in-order is O(n)',
      ],
      template: `function inorderWithPrev(root) {
  let prev = null;          // previously visited node (in sorted order)
  const stack = [];
  let node = root;
  while (node || stack.length) {
    while (node) { stack.push(node); node = node.left; } // go as left as possible
    node = stack.pop();                                     // visit
    if (prev) { /* compare prev.val with node.val */ }
    prev = node;
    node = node.right;                                      // then the right subtree
  }
}`,
      variations: [
        { name: 'Early stop (kth smallest)', description: 'Count visits and stop at the k-th — O(h + k), no need to walk the whole tree.' },
        { name: 'Adjacent comparisons', description: 'Keep prev; the answer (min diff, validity, swapped pair) depends only on neighbouring values.' },
        { name: 'Controlled / lazy in-order (iterator)', description: 'Keep the stack between calls; next() pops one node and pushes the left spine of its right child. Amortized O(1), O(h) memory.' },
        { name: 'Reverse in-order', description: 'Right, node, left gives decreasing order — k-th largest, greater-sum tree.' },
      ],
      mistakes: [
        'Collecting the whole in-order array when an early stop or a single prev variable would do',
        'Using a closure variable prev with recursion but resetting it inside the recursive call',
        'In the iterator, pre-computing the whole traversal in the constructor (O(n) memory — the follow-up asks for O(h))',
      ],
      evolution: {
        easy: 'Minimum absolute difference, two-sum in a BST (in-order → two pointers).',
        medium: 'Kth smallest with early stop, BST iterator, validate via in-order.',
        hard: 'Recover a swapped BST in O(1) extra space (Morris traversal), merge two BSTs.',
      },
    },
    {
      id: 'bst-range-bounds',
      name: 'BST — Pass Valid Range Down (low, high)',
      summary: 'Every node in a BST lives inside an allowed open interval inherited from its ancestors. Pass (low, high) down the recursion: going left tightens high, going right tightens low.',
      whyItExists: 'The BST property is about whole subtrees, not just parent/child pairs. Checking only children misses violations like a grandchild on the wrong side of its grandparent. Carrying the interval turns that global rule into a local O(1) check at each node. The same bounds let you prune whole subtrees that fall outside a query range.',
      whenToUse: [
        'Validate a BST',
        'Sum / count / list values in a range [low, high] while skipping irrelevant subtrees',
        'Trim a BST so all values lie in [low, high]',
      ],
      clues: ['"is a valid BST"', '"values between low and high"', '"trim"', '"range sum"'],
      whenNotToUse: [
        'You only need one value — guided descent is simpler',
        'Plain binary tree with no ordering: there are no bounds to exploit (you must visit everything)',
      ],
      template: `function valid(node, low = -Infinity, high = Infinity) {
  if (!node) return true;
  if (node.val <= low || node.val >= high) return false;   // outside the inherited range
  return valid(node.left, low, node.val) &&                 // left: everything < node.val
         valid(node.right, node.val, high);                 // right: everything > node.val
}`,
      variations: [
        { name: 'Range pruning', description: 'If node.val < low, the whole left subtree is also < low → only recurse right (and vice versa).' },
        { name: 'Trim', description: 'If node.val < low, return trim(node.right); if > high, return trim(node.left); otherwise trim both children and keep the node.' },
      ],
      mistakes: [
        'Comparing a node only with its direct children (the classic wrong validate)',
        'Using 0 or a sentinel number as the initial bound instead of ±Infinity / null',
        'Using <= vs < inconsistently when duplicates are not allowed',
      ],
      evolution: {
        easy: 'Range sum of BST with pruning.',
        medium: 'Validate BST, trim BST.',
        hard: 'Largest BST subtree / maximum-sum BST — bounds flow UP instead of down (bottom-up).',
      },
    },
    {
      id: 'bst-build-balanced',
      name: 'BST — Build Balanced from Sorted Data',
      summary: 'Pick the middle element as the root, recursively build the left half into the left subtree and the right half into the right subtree.',
      whyItExists: 'A BST is only fast if it is shallow. Inserting sorted data one by one makes a linked list (height n). Choosing the middle as the root splits the remaining elements in half at every level, so the height is ⌈log₂(n+1)⌉ — the best possible.',
      whenToUse: [
        'Convert a sorted array / sorted list into a height-balanced BST',
        'Rebalance an existing BST (in-order → sorted array → rebuild)',
      ],
      clues: ['"height-balanced"', '"sorted array to BST"', '"balance a BST"'],
      whenNotToUse: [
        'Values arrive one at a time and must be queryable in between — you need a self-balancing tree (AVL / red-black) instead of rebuilding',
      ],
      template: `function build(nums, lo = 0, hi = nums.length - 1) {
  if (lo > hi) return null;
  const mid = (lo + hi) >> 1;
  return new TreeNode(nums[mid], build(nums, lo, mid - 1), build(nums, mid + 1, hi));
}`,
      variations: [
        { name: 'Sorted linked list', description: 'Either find the middle with fast/slow pointers each time (O(n log n)), or build in in-order order while advancing a list pointer (O(n)).' },
        { name: 'Balance a BST', description: 'In-order dump (sorted) → rebuild with the middle rule.' },
      ],
      mistakes: [
        'Slicing the array at each level (nums.slice) — correct but O(n log n) time and extra memory; pass indices instead',
        'Thinking there is a single correct output — left-middle and right-middle both give valid balanced trees',
      ],
      evolution: {
        easy: 'Sorted array → balanced BST.',
        medium: 'Sorted linked list → balanced BST, balance an existing BST.',
        hard: 'Count how many distinct BSTs can be built (Catalan numbers, a DP topic).',
      },
    },
    {
      id: 'bst-bottom-up-info',
      name: 'BST — Bottom-up Subtree Info',
      summary: 'Each subtree reports (isBST, min, max, sum/size) to its parent. A node is the root of a BST iff both children are BSTs and left.max < node.val < right.min.',
      whyItExists: 'Checking "is this subtree a BST?" separately at every node costs O(n) each → O(n²). Returning a small summary from each child lets the parent decide in O(1), so the whole tree is processed in one post-order pass: O(n).',
      whenToUse: [
        'Largest / maximum-sum BST inside an arbitrary binary tree',
        'Any question about "subtrees that are valid BSTs"',
      ],
      clues: ['"largest BST subtree"', '"maximum sum of any subtree that is also a BST"', '"sub-tree which is a BST"'],
      whenNotToUse: [
        'The whole tree is already a BST — use the simpler top-down patterns',
      ],
      template: `function dfs(node) {
  // returns [isBST, min, max, sum]
  if (!node) return [true, Infinity, -Infinity, 0];  // empty tree is a BST with "impossible" min/max
  const [lb, lmin, lmax, lsum] = dfs(node.left);
  const [rb, rmin, rmax, rsum] = dfs(node.right);
  if (lb && rb && lmax < node.val && node.val < rmin) {
    const sum = lsum + node.val + rsum;
    // update global answer with sum
    return [true, Math.min(lmin, node.val), Math.max(rmax, node.val), sum];
  }
  return [false, -Infinity, Infinity, 0];            // poison: no ancestor can be a BST
}`,
      variations: [
        { name: 'Largest BST by size', description: 'Return size instead of sum.' },
        { name: 'Count BST subtrees', description: 'Increment a counter whenever the check passes.' },
      ],
      mistakes: [
        'Empty-subtree sentinel reversed: an empty subtree must have min = +Infinity and max = -Infinity so any parent value passes',
        'Forgetting min(lmin, node.val) — when the left child is empty, lmin is Infinity',
        'Initialising the best sum to -Infinity when the problem says the empty BST (sum 0) counts',
      ],
      evolution: {
        easy: '—',
        medium: 'Largest BST subtree (by size).',
        hard: 'Maximum-sum BST in a binary tree with negative values.',
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
            md: `A **binary search tree (BST)** is a binary tree that keeps its values *organised*: smaller things go left, bigger things go right — **at every node, for the whole subtree**.

\`\`\`text
          8
        /   \\
       3     10
      / \\      \\
     1   6      14
        / \\    /
       4   7  13
\`\`\`

Everything in the left subtree of 8 (\`1, 3, 4, 6, 7\`) is smaller than 8. Everything in its right subtree (\`10, 13, 14\`) is larger. And the same is true again at 3, at 10, at 6… all the way down.

That one rule gives a BST two superpowers:

1. **Search like binary search.** Looking for 7? At 8 go left, at 3 go right, at 6 go right — found, after looking at 4 nodes instead of 9.
2. **Sorted order for free.** Visit *left subtree, node, right subtree* (in-order) and you read \`1 3 4 6 7 8 10 13 14\` — sorted.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **BST invariant** — for every node \`x\`: every value in \`x.left\`'s subtree is \`< x.val\`, and every value in \`x.right\`'s subtree is \`> x.val\`. (LeetCode BSTs usually have no duplicates; if they do, the problem says which side they go.)
- **Subtree** — a node together with *all* of its descendants.
- **Height (h)** — the number of edges on the longest root-to-leaf path. Almost every BST operation costs **O(h)**.
- **Balanced** — height is O(log n). **Degenerate / skewed** — height is O(n) (the tree is basically a linked list).
- **In-order successor** — the next larger value; in a BST it is the leftmost node of the right subtree (if the right subtree exists).`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of a "guess the number" game where every answer is "higher" or "lower". Each node is a guess; the answer tells you which half of the remaining candidates to keep. A BST is simply that game frozen into a data structure.',
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-1',
            question: 'Is this a valid BST?\n\n```text\n      5\n     / \\\n    3   8\n       / \\\n      4   9\n```',
            options: [
              'Yes — every node is bigger than its left child and smaller than its right child',
              'Yes — in-order is 3 5 4 8 9 which is roughly sorted',
              'No — 4 is in the RIGHT subtree of 5, so it must be greater than 5',
              'No — a BST must be perfectly balanced',
            ],
            answer: 2,
            explanation: '4 < 8 so it is fine as 8\'s left child, but it sits in the **right subtree of 5**, where every value must be > 5. The invariant is about whole subtrees, not just parent/child pairs.',
            misconceptions: {
              0: 'This is the #1 BST mistake. Checking only parent/child pairs misses grandparent constraints. Every ancestor you passed through adds a bound.',
              1: '"Roughly sorted" is not sorted. In-order must be **strictly increasing**; here 5 → 4 goes down, which proves the tree is invalid.',
              3: 'Balance affects speed, not validity. A BST can be a long chain and still be a valid BST.',
            },
            deeper: 'When you walk from the root to a node, each step left gives you an **upper** bound ("smaller than this ancestor") and each step right gives you a **lower** bound. 4 was reached by *right of 5, left of 8*, so it must be in the open interval (5, 8). It is not.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Compare the ways of storing a set of numbers that changes over time:

| structure | search | insert | delete | sorted walk |
|---|---|---|---|---|
| unsorted array | O(n) | O(1) | O(n) | O(n log n) (sort first) |
| sorted array | O(log n) | O(n) (shift) | O(n) (shift) | O(n) |
| hash set | O(1) avg | O(1) avg | O(1) avg | O(n log n) — no order |
| **balanced BST** | **O(log n)** | **O(log n)** | **O(log n)** | **O(n)** |

A BST is the structure that is **fast at everything at once** — including ordered questions a hash set cannot answer: *"smallest value ≥ 42"*, *"k-th smallest"*, *"all values between 10 and 20"*.`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Only if it stays balanced',
            md: `Insert \`1, 2, 3, 4, 5\` in that order and each new value goes to the right of the previous one:

\`\`\`text
1
 \\
  2
   \\
    3
     \\
      4
\`\`\`

Height is n − 1, so search is O(n) — no better than a list. Real libraries use **self-balancing** BSTs (AVL, red-black trees) that rotate nodes to keep h = O(log n). You do not need to code those in interviews, but always say **"O(h), which is O(log n) if balanced and O(n) in the worst case"**.`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-2',
            question: 'You insert the values 10, 20, 30, …, 1000 (100 values, increasing) into an empty plain BST. How many comparisons does searching for 1000 take?',
            options: [
              'About 7 (log₂ 100)',
              'About 100 — each value became the right child of the previous one, so the tree is a chain',
              'Exactly 1 — the last inserted value is at the root',
              'About 50 — on average you search half the tree',
            ],
            answer: 1,
            explanation: 'Sorted insertions produce a degenerate tree of height n − 1. Searching for the largest value walks the entire chain: O(n).',
            misconceptions: {
              0: 'log₂ n only holds for a balanced tree. Nothing in a plain BST keeps it balanced; the shape depends on insertion order.',
              2: 'Plain BST insertion never changes the root. The first value inserted (10) stays at the root forever.',
              3: '1000 is at the very bottom of the chain, so it is the worst case, not the average.',
            },
            deeper: 'This is exactly why "Convert Sorted Array to BST" picks the **middle** element as the root: it prevents the chain and guarantees height ⌈log₂(n+1)⌉.',
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `In interviews you are usually **given** a BST and asked to exploit it. The question to ask yourself is: *"Which of the BST's two superpowers does this problem need?"*

| you need… | superpower | pattern |
|---|---|---|
| find / insert / delete one value, closest value, LCA | ordering tells you which side | **guided descent** — O(h) |
| k-th smallest, min difference, swapped nodes, iterator | in-order is sorted | **in-order walk with prev** — O(n) or O(h + k) |
| validate, range sum, trim | each node has an allowed interval | **pass (low, high) down** |
| build from sorted data | middle element = root | **build balanced** |
| find BST-shaped subtrees in a plain tree | children report summaries | **bottom-up info** |

In JavaScript there is no built-in sorted set / tree map. When a problem needs a dynamic ordered set, you either use a sorted array with binary search (fine for small n), a heap (if you only need min/max — next topic), or you write a BST.`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-3',
            question: 'You need the **smallest value strictly greater than x** in a balanced BST with n nodes. What is the best approach?',
            options: [
              'In-order traverse everything into an array, then binary search — O(n)',
              'Walk down from the root: when node.val > x remember it and go left, otherwise go right — O(log n)',
              'Hash all values in a Set and test x+1, x+2, … — O(1)',
              'BFS level by level until you find a larger value — O(n)',
            ],
            answer: 1,
            explanation: 'This is a *ceiling / successor* search. Every node larger than x is a candidate; going left looks for a smaller candidate, going right skips values that are too small. One root-to-leaf path: O(h) = O(log n).',
            misconceptions: {
              0: 'Correct but wasteful — you visit all n nodes when a single path is enough.',
              2: 'Values are not consecutive integers; the next one could be x + 1,000,000. This is not O(1) at all.',
              3: 'BFS ignores the ordering; the first larger value you meet is not necessarily the smallest larger one.',
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
            clues: ['"binary search tree" in the statement', 'kth smallest / largest', 'in sorted order / iterator', 'validate / is valid BST', 'values in range [low, high]', 'closest value / successor', 'two nodes swapped'],
            conclusion: 'Use the BST invariant: guided descent, in-order = sorted, or range bounds',
          },
          {
            type: 'text',
            md: `A quick checklist:

1. **Is the tree a BST?** If the statement just says "binary tree", none of these tricks apply (unless you are asked to *find* BSTs inside it — bottom-up info).
2. **Does the answer depend on one value/path?** → guided descent, O(h).
3. **Does the answer depend on sorted order or neighbours in sorted order?** → in-order walk.
4. **Is it about validity or a range of values?** → pass (low, high) down.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Two ideas carry the whole topic.

**1. Every node owns an interval.** The root owns \`(-∞, +∞)\`. Its left child owns \`(-∞, root)\`, its right child \`(root, +∞)\`. Each step down splits the parent's interval at the parent's value. A value can only ever live in *one* place — the node whose interval contains it — which is why searching follows a single path.

**2. In-order reads intervals left to right.** In-order visits the left subtree (the lower part of the interval), then the node (the split point), then the right subtree (the upper part). Laying the intervals out on a number line, that is simply left-to-right order — sorted.`,
          },
          {
            type: 'visual',
            scenario: 'tree-traversal',
            input: { tree: [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13], order: 'inorder' },
            caption: 'In-order on a BST: watch the output come out sorted — 1 3 4 6 7 8 10 13 14.',
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-4',
            question: 'Why does in-order traversal of a BST produce a sorted sequence?',
            options: [
              'Because the tree is balanced',
              'Because in-order visits nodes level by level from left to right',
              'Because JavaScript sorts arrays automatically',
              'Because it outputs all of the left subtree (all smaller) before the node, and all of the right subtree (all larger) after it — and this holds recursively in every subtree',
            ],
            answer: 3,
            explanation: 'Proof by induction: assume in-order is sorted for the smaller subtrees. Output = sorted(left) + [node] + sorted(right), and every left value < node < every right value, so the concatenation is sorted.',
            misconceptions: {
              0: 'A skewed chain is a valid BST and in-order is still sorted. Balance only affects speed.',
              1: 'That is level-order (BFS). Level-order of the tree above is 8 3 10 1 6 14… — not sorted.',
              2: 'Nothing is sorted by the language. The order comes purely from the BST invariant.',
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
            md: 'The "brute force" for a BST problem is usually **treating it like a plain binary tree**: visit every node, ignore the ordering. It is correct (a BST *is* a binary tree), it is just slower than necessary. Example: find whether a value exists.',
          },
          {
            type: 'compare',
            left: {
              title: 'Ignore the ordering — O(n)',
              code: `function contains(node, target) {
  if (!node) return false;
  if (node.val === target) return true;
  // search BOTH sides
  return contains(node.left, target) || contains(node.right, target);
}`,
            },
            right: {
              title: 'Use the ordering — O(h)',
              code: `function contains(node, target) {
  while (node) {
    if (node.val === target) return true;
    // only ONE side can contain target
    node = target < node.val ? node.left : node.right;
  }
  return false;
}`,
            },
          },
          {
            type: 'text',
            md: 'Another very common brute force is **"dump the in-order into an array, then solve it on the array"**. It is often a perfectly good first answer (O(n) time and O(n) space) — e.g. kth smallest = \`arr[k-1]\`. The optimised versions then remove the array (keep only `prev`) or stop early.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** the right-hand version can skip an entire subtree without missing the target?',
            deeper: `If \`target < node.val\`, the invariant says **every** value in the right subtree is \`> node.val > target\`. So none of them can equal the target — skipping them loses nothing. This is the same argument as binary search on an array: if \`target < arr[mid]\`, everything at indices ≥ mid is too big.

The skipped part is on average half of what remains (in a balanced tree), so the work is the number of "halvings" — O(log n).`,
          },
        ],
      },
      {
        id: 'optimized-descent',
        title: 'Optimized approach — guided descent (search, insert, delete, LCA)',
        blocks: [
          {
            type: 'steps',
            title: 'Insert val',
            steps: [
              'If the tree is empty, the new node is the root.',
              'Otherwise walk down: go left if `val < node.val`, right otherwise.',
              'When the side you want to go to is `null`, attach the new node there. New nodes are always leaves — no existing node moves.',
            ],
          },
          { type: 'visual', scenario: 'bst-operations', caption: "One comparison per level decides left or right — O(h)." },
          {
            type: 'steps',
            title: 'Delete key — find it, then handle one of 3 cases',
            steps: [
              '**Leaf** (no children): just remove it — return `null` to the parent.',
              '**One child**: splice it out — return that child to the parent. The child\'s subtree already lies inside the deleted node\'s interval, so the ordering still holds.',
              '**Two children**: find the **in-order successor** (leftmost node of the right subtree — the smallest value larger than key). Copy its value into the node, then delete the successor from the right subtree. The successor has no left child, so that second delete is case 1 or 2.',
            ],
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why the successor is the perfect replacement',
            md: `The replacement for a deleted value must be **bigger than everything left** and **smaller than everything right**. The successor is the smallest value in the right subtree: it is bigger than everything in the left subtree (it came from the right side), and smaller than everything else remaining on the right (it was the minimum there). The in-order **predecessor** (max of the left subtree) works equally well.`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-5',
            question: 'You delete **8** (the root) from the tree in "What is it?". 8 has two children; its right subtree is 10 → (right) 14 → (left) 13. Which value is the **in-order successor** that replaces 8?',
            options: [
              '13 — it is the deepest-left node in the right subtree',
              '14 — the largest value in the right subtree',
              '10 — start at the right child and go left as far as possible; 10 has no left child, so it is the answer',
              '7 — the largest value in the left subtree',
            ],
            answer: 2,
            explanation: 'Successor = leftmost node of the right subtree. Start at 8.right = 10 and keep taking `.left`. 10.left is null, so you stop immediately: the successor is **10**. Check: 10 is the smallest value bigger than 8 (in-order: … 7 8 **10** 13 14).',
            misconceptions: {
              0: '13 is a left child, but you only follow `.left` pointers starting from 10 — you never go right to 14 first. 13 > 10, so it is not the next value after 8.',
              1: 'The maximum of the right subtree is the wrong end. Putting 14 at the root would leave 10 and 13 — both smaller than 14 — in its right subtree.',
              3: '7 is the in-order **predecessor**. It is an equally valid replacement, but it is not the successor the question asks for.',
            },
          },
          {
            type: 'text',
            md: `**LCA in a BST.** For two values p and q, walk from the root. If both are smaller than the node, the LCA is on the left; if both are larger, it is on the right. The first node where they **split** (one on each side, or one of them *is* the node) is the lowest common ancestor. That is O(h) — much simpler than the general binary-tree LCA, which must search both subtrees.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'text',
            md: 'Recursive structural changes (insert/delete/trim) follow one shape: **the function returns the new root of the subtree it was given**, and the caller re-attaches it. That removes all "who is my parent?" bookkeeping.',
          },
          {
            type: 'code',
            title: 'Structural recursion — "return the new subtree root"',
            code: `function modify(node, key) {
  if (!node) return /* the subtree that should exist here (null or a new node) */ null;
  if (key < node.val) node.left = modify(node.left, key);       // re-attach result
  else if (key > node.val) node.right = modify(node.right, key);
  else {
    // handle the node itself; return whatever should replace it
  }
  return node;
}`,
          },
          {
            type: 'code',
            title: 'In-order with a stack (the base of kth-smallest, iterator, recover)',
            code: `const stack = [];
let node = root;
while (node || stack.length) {
  while (node) { stack.push(node); node = node.left; } // push the left spine
  node = stack.pop();                                    // smallest unvisited
  visit(node);
  node = node.right;                                     // continue in its right subtree
}`,
          },
          {
            type: 'code',
            title: 'Bounds passed down',
            code: `function walk(node, low = -Infinity, high = Infinity) {
  if (!node) return;
  // node.val is guaranteed to be in (low, high) in a valid BST
  walk(node.left, low, node.val);
  walk(node.right, node.val, high);
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Search, insert and delete — O(h) each',
            code: `function searchBST(root, val) {
  let node = root;
  while (node && node.val !== val) node = val < node.val ? node.left : node.right;
  return node; // the node or null
}

function insertIntoBST(root, val) {
  if (!root) return new TreeNode(val);
  if (val < root.val) root.left = insertIntoBST(root.left, val);
  else root.right = insertIntoBST(root.right, val);
  return root;
}

function deleteNode(root, key) {
  if (!root) return null;                      // key not found
  if (key < root.val) root.left = deleteNode(root.left, key);
  else if (key > root.val) root.right = deleteNode(root.right, key);
  else {
    if (!root.left) return root.right;         // case 1 & 2: 0 or 1 child
    if (!root.right) return root.left;
    let succ = root.right;                     // case 3: two children
    while (succ.left) succ = succ.left;        // leftmost of right subtree
    root.val = succ.val;                       // copy successor up
    root.right = deleteNode(root.right, succ.val); // delete the duplicate below
  }
  return root;
}`,
            caption: 'TreeNode is a toolkit global. The toolkit BST class implements the same logic as methods: new BST([5,3,8]).insert(4).delete(3).inorder().',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Recursion depth equals tree height. On a degenerate tree with 10⁵ nodes, recursive code can hit **"Maximum call stack size exceeded"**. The iterative versions (while loop / explicit stack) are safe.
- \`-Infinity\` and \`Infinity\` are perfect open bounds: every number compares correctly against them, including \`-2³¹\` and \`2³¹ − 1\` edge values that break "use Number.MIN_SAFE_INTEGER" hacks in other languages.
- Use \`===\` for comparisons against \`null\` children, or just rely on truthiness (\`if (!node)\`) — a TreeNode is always truthy even when its value is 0.`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-6',
            question: 'In the recursive `insertIntoBST`, what goes wrong if you write `insertIntoBST(root.left, val)` **without** assigning the result to `root.left`?',
            options: [
              'Nothing — JavaScript passes objects by reference, so the new node is attached',
              'The new node is created but never linked to its parent when root.left was null, so it is lost',
              'It causes infinite recursion',
              'It inserts the value twice',
            ],
            answer: 1,
            explanation: 'When `root.left` is `null`, the recursive call receives `null` and returns a brand-new node. If nobody stores that return value, the node is garbage — the tree never changes.',
            misconceptions: {
              0: 'The *reference* passed is `null`. You cannot mutate `null`; the only way to attach the new node is for the caller to assign the returned value.',
              2: 'The recursion still stops at `null` — it just throws the result away.',
              3: 'The value is not inserted at all, not twice.',
            },
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'deleteNode([5,3,6,2,4,null,7], 3)',
            columns: ['call', 'node', 'comparison', 'action', 'returns'],
            rows: [
              ['1', '5', '3 < 5', 'recurse left: root.left = deleteNode(3, 3)', '5 (after re-attach)'],
              ['2', '3', 'found', 'two children (2 and 4) → successor = leftmost of right subtree = 4', '—'],
              ['2', '3→4', 'copy', 'node.val = 4; node.right = deleteNode(4, 4)', '—'],
              ['3', '4', 'found', 'no left child → return node.right (null)', 'null'],
              ['2', '4', '—', 'node.right = null', 'node 4 (children: 2)'],
              ['1', '5', '—', 'root.left = node 4', 'root 5'],
            ],
            note: 'Result: [5,4,6,2,null,null,7]. Using the predecessor (2) would give [5,2,6,null,4,null,7] — also valid. That is why tests for delete use a checker, not an exact tree.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why deleting the successor from the right subtree **cannot** trigger case 3 again (so the recursion is short)?',
            deeper: 'The successor is the *leftmost* node of the right subtree, which means it has **no left child** — otherwise we would have kept going left. A node with no left child is case 1 (leaf) or case 2 (only a right child). So the second delete is a simple splice, and the whole delete is still one root-to-leaf path: O(h).',
          },
        ],
      },
      {
        id: 'optimized-inorder',
        title: 'Optimized approach — in-order = sorted (kth smallest, min difference, iterator, recover)',
        blocks: [
          {
            type: 'text',
            md: `Once you believe "in-order is sorted", many problems collapse into array problems:

- **Kth smallest** → the k-th visited node. Use the stack version and **stop** after k pops: O(h + k).
- **Minimum absolute difference** → in a sorted list the closest pair is always adjacent, so compare each node with the previous one.
- **Recover BST (two values swapped)** → a sorted sequence with two elements swapped has one or two "drops" (\`prev > cur\`). The first bad value is \`prev\` at the first drop, the second is \`cur\` at the last drop. Swap them back.
- **Validate** → in-order must be strictly increasing (an alternative to bounds).`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-7',
            question: 'The in-order of a broken BST is `1 6 3 4 5 2 7` (two values were swapped). Which two values must be swapped back?',
            options: [
              '6 and 3 — the first drop',
              '5 and 2 — the second drop',
              '3 and 2 — the two smaller values in the drops',
              '6 and 2 — the larger value of the first drop and the smaller value of the last drop',
            ],
            answer: 3,
            explanation: 'Drops: 6 > 3 and 5 > 2. The swapped-in large value shows up as `prev` of the first drop (6); the swapped-in small value shows up as `cur` of the last drop (2). Swapping 6 and 2 gives 1 2 3 4 5 6 7.',
            misconceptions: {
              0: 'Only correct when the swapped values are adjacent in sorted order (then there is just one drop). Here there are two drops.',
              1: '5 is in the right place; it only *looks* wrong because 2 was moved next to it.',
              2: '3 is in the correct position. The misplaced values are the "too big early" one and the "too small late" one.',
            },
            deeper: 'Picture the sorted array and swap two elements x < y at positions i < j. Now position i holds y (too big → drop after it) and position j holds x (too small → drop before it). If i and j are neighbours the two drops merge into one. So: **first = prev of first drop, second = cur of last drop** covers both cases.',
          },
          {
            type: 'text',
            md: `**BST iterator (design).** \`next()\` must return the next smallest value, \`hasNext()\` whether one exists, in **amortized O(1)** time and **O(h)** memory. Instead of running the in-order loop to completion, run it **one pop at a time**:

- Constructor: push the left spine of the root.
- \`next()\`: pop the top (smallest unvisited), then push the left spine of its right child, return the popped value.
- \`hasNext()\`: \`stack.length > 0\`.

A single \`next()\` may push many nodes, but every node is pushed once and popped once over the whole iteration → n pushes for n calls → O(1) amortized. The stack holds at most one root-to-leaf path → O(h).`,
          },
          {
            type: 'code',
            title: 'BSTIterator — controlled in-order',
            code: `class BSTIterator {
  constructor(root) {
    this.stack = [];
    this.pushLeft(root);
  }
  pushLeft(node) {
    while (node) { this.stack.push(node); node = node.left; }
  }
  next() {
    const node = this.stack.pop();   // smallest unvisited value
    this.pushLeft(node.right);       // prepare its successor
    return node.val;
  }
  hasNext() {
    return this.stack.length > 0;
  }
}`,
          },
        ],
      },
      {
        id: 'optimized-bounds',
        title: 'Optimized approach — pass (low, high) down (validate, range sum, trim)',
        blocks: [
          {
            type: 'text',
            md: `Validating by "left child < node < right child" is **wrong** (checkpoint 1). The fix is to carry the interval each node must live in:

- start with \`(-∞, +∞)\` at the root;
- going **left** keeps \`low\`, sets \`high = node.val\`;
- going **right** sets \`low = node.val\`, keeps \`high\`.

Each node now does an O(1) check against two numbers, and the whole tree is validated in O(n).

The same bounds let you **prune**. For range sum in [L, R]: if \`node.val < L\`, the node and its entire left subtree are too small — only the right subtree can help. If \`node.val > R\`, only the left subtree can help. **Trim** is the structural version: return \`trim(node.right)\` in place of a too-small node.`,
          },
          {
            type: 'code',
            title: 'Trim a BST to [low, high]',
            code: `function trimBST(node, low, high) {
  if (!node) return null;
  if (node.val < low) return trimBST(node.right, low, high);  // node + its left side are gone
  if (node.val > high) return trimBST(node.left, low, high);  // node + its right side are gone
  node.left = trimBST(node.left, low, high);
  node.right = trimBST(node.right, low, high);
  return node;
}`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-8',
            question: 'In `valid(node, low, high)`, what bounds should be passed to the **right** child?',
            options: [
              '(low, node.val)',
              '(node.val, high)',
              '(node.val, Infinity)',
              '(-Infinity, high)',
            ],
            answer: 1,
            explanation: 'The right child must be greater than node.val (new lower bound) and still below every ancestor bound the node already had (keep high).',
            misconceptions: {
              0: 'Those are the bounds for the LEFT child: everything there must be below node.val.',
              2: 'Resetting high to Infinity forgets ancestor constraints — this re-creates the "only check the parent" bug.',
              3: 'Dropping the lower bound entirely means a right-subtree value smaller than node.val would be accepted.',
            },
          },
        ],
      },
      {
        id: 'optimized-build',
        title: 'Optimized approach — build a balanced BST from sorted data',
        blocks: [
          {
            type: 'text',
            md: `Given a sorted array, the best root is the **middle** element: half the values go left, half go right. Recurse on each half with index bounds \`[lo, hi]\` (no slicing). Every level halves the range, so the height is ⌈log₂(n + 1)⌉ and every node is created once: O(n) time, O(log n) recursion depth.

When the range has even length there are two middles. Both are fine — there are many valid balanced BSTs for the same input, which is why that problem's tests use a checker that verifies "height-balanced" and "in-order equals the input".`,
          },
          {
            type: 'code',
            title: 'sortedArrayToBST',
            code: `function sortedArrayToBST(nums) {
  const build = (lo, hi) => {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;   // left-middle; (lo + hi + 1) >> 1 is right-middle
    const node = new TreeNode(nums[mid]);
    node.left = build(lo, mid - 1);
    node.right = build(mid + 1, hi);
    return node;
  };
  return build(0, nums.length - 1);
}`,
          },
        ],
      },
      {
        id: 'optimized-bottom-up',
        title: 'Optimized approach — bottom-up subtree info (find BSTs inside a binary tree)',
        blocks: [
          {
            type: 'text',
            md: `Sometimes the input is an ordinary binary tree and you must find the subtrees that *are* BSTs (e.g. the one with the largest sum). Top-down bounds do not work here because you do not know which node is the "root" of the BST.

Flip the direction: a **post-order** DFS where every call returns a summary of its subtree:

\`\`\`text
{ isBST, min, max, sum }
\`\`\`

A node roots a BST exactly when both children are BSTs **and** \`left.max < node.val < right.min\`. An empty child returns \`min = +∞, max = −∞\`, so the comparison automatically passes. A non-BST child returns a "poison" summary so every ancestor fails too. One pass, O(n).`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-9',
            question: 'For an **empty** subtree, why do we return `min = +Infinity` and `max = -Infinity` (and not 0 and 0)?',
            options: [
              'So that the parent check `left.max < node.val < right.min` always passes for a missing child, whatever node.val is',
              'Because JavaScript cannot compare null',
              'It does not matter which values are used',
              'To mark the empty subtree as invalid',
            ],
            answer: 0,
            explanation: '`-Infinity < node.val` and `node.val < +Infinity` are true for every number, so an empty side never blocks its parent. Using 0 would wrongly reject a parent with a negative value (left.max = 0 < -5 is false).',
            misconceptions: {
              1: 'We never compare null here — we return numbers precisely so the comparison is well-defined.',
              2: 'It matters a lot with negative values: 0 as a sentinel would reject valid BSTs like a single node -5.',
              3: 'An empty tree IS a valid BST. The "reversed" infinities make it the neutral element of the check, not an invalid one.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see why this is O(n) while "for each node, run validate on its subtree" is O(n²)?',
            deeper: 'Running validate from every node re-walks each subtree once per ancestor: a node at depth d is visited d + 1 times; on a chain that sums to 1 + 2 + … + n = O(n²). The bottom-up version visits each node once and combines two O(1) summaries — the children already did the work, and the parent reuses it instead of recomputing.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Validating with parent/child only.** You must pass bounds down (or check that in-order is strictly increasing).
2. **Wrong sentinels.** Using \`0\`, \`-1\` or \`Number.MIN_VALUE\` (which is the smallest *positive* double, ~5e-324!) as a lower bound. Use \`-Infinity\`, or \`null\` meaning "no bound".
3. **Forgetting to re-attach** the subtree returned by a recursive insert/delete/trim.
4. **Deleting a two-child node incorrectly** — you need the successor/predecessor trick.
5. **Claiming O(log n)** without saying "if balanced". Plain BST operations are O(h), and h can be n.
6. **Materialising the whole in-order** when an early stop (kth smallest) or a single \`prev\` (min diff, recover) suffices.
7. **Deep recursion in JS** on skewed trees — prefer iterative walks for search/insert when n is large.`,
          },
          {
            type: 'checkpoint',
            id: 'bst-cp-10',
            question: 'A teammate validates a BST with `valid(node, Number.MIN_VALUE, Number.MAX_VALUE)`. The tree is a single node with value `-3`. What happens?',
            options: [
              'Returns true — -3 is between the minimum and maximum numbers',
              'Throws, because MIN_VALUE is not a number',
              'Returns false — Number.MIN_VALUE is about 5e-324, a tiny POSITIVE number, so -3 is "below the lower bound"',
              'Returns true, because single nodes are never checked',
            ],
            answer: 2,
            explanation: '`Number.MIN_VALUE` is the smallest positive double, not the most negative number. Use `-Infinity` (or `null` = no bound).',
            misconceptions: {
              0: 'The name is misleading. The most negative finite number is `-Number.MAX_VALUE`; `Number.MIN_VALUE` is > 0.',
              1: 'It is a valid number (5e-324); the check just gives the wrong answer silently.',
              3: 'The root is checked like any other node: -3 <= 5e-324 → rejected.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(h) per search/insert/delete; O(n) for full traversals',
            space: 'O(h) recursion / stack',
            md: `| operation | balanced (h = log n) | degenerate (h = n) |
|---|---|---|
| search / insert / delete / LCA / floor / ceiling | O(log n) | O(n) |
| kth smallest (early stop) | O(log n + k) | O(n) |
| full in-order, validate, min diff, recover, bottom-up | O(n) | O(n) |
| iterator next() | O(1) amortized, O(h) memory | O(1) amortized, O(n) memory |
| build from sorted array | O(n) | — |

**Why O(h):** guided descent follows one root-to-leaf path and does O(1) work per node. **Why O(log n) when balanced:** each step discards the other subtree, roughly half of what is left.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the invariant** before coding: "every node is greater than its entire left subtree and less than its entire right subtree".
- **Always qualify complexity:** "O(h) — O(log n) if balanced, O(n) if skewed."
- **Ask about duplicates** and which side they go to; ask whether values can be at the int extremes (use ±Infinity bounds).
- **Mention iterative vs recursive**: recursion is clearer, iteration avoids stack overflow on skewed trees.
- For delete/insert, tell the interviewer that **several shapes are valid** and which one you produce (successor vs predecessor).
- Follow-ups you should be ready for: *"kth smallest when the tree is modified often?"* → augment each node with its subtree size, then descend in O(h). *"O(1) space in-order?"* → Morris traversal (temporarily threads right pointers).`,
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
              { api: 'new TreeNode(val, left, right)', use: 'Build nodes (toolkit global, LeetCode shape)', complexity: 'O(1)' },
              { api: 'new BST(values)', use: 'Toolkit reference BST: insert, has, delete, min, max, inorder', complexity: 'O(h) per op' },
              { api: 'traversals.inorder(root)', use: 'Sorted dump for debugging a BST', complexity: 'O(n)' },
              { api: 'arrayToTree / treeToArray', use: 'Convert LeetCode level-order arrays ⇄ trees when testing locally', complexity: 'O(n)' },
              { api: 'stack.push / stack.pop', use: 'Iterative in-order, BST iterator', complexity: 'O(1) amortized' },
              { api: '-Infinity / Infinity', use: 'Open bounds for validate and bottom-up sentinels', complexity: 'O(1)' },
              { api: '(lo + hi) >> 1', use: 'Middle index when building a balanced BST', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['The tree is a BST and you need search/insert/delete/closest', 'Anything about sorted order: kth, min diff, iterator, swapped nodes', 'Validity or value ranges: validate, range sum, trim', 'Building a shallow tree from sorted data'],
    clues: ['binary search tree', 'kth smallest', 'inorder successor', 'valid BST', 'range [low, high]', 'height-balanced', 'swapped by mistake', 'iterator next smallest'],
    template: `// guided descent
while (node && node.val !== x) node = x < node.val ? node.left : node.right;
// bounds
const valid = (n, lo = -Infinity, hi = Infinity) =>
  !n || (lo < n.val && n.val < hi && valid(n.left, lo, n.val) && valid(n.right, n.val, hi));
// in-order with stack
while (cur || st.length) { while (cur) { st.push(cur); cur = cur.left; } cur = st.pop(); visit(cur); cur = cur.right; }`,
    complexity: 'O(h) per point operation (log n balanced, n skewed); O(n) for traversals; O(h) extra space',
    mistakes: ['checking only children when validating', 'Number.MIN_VALUE as a lower bound', 'not re-attaching returned subtrees', 'two-child delete without successor', 'saying O(log n) without "if balanced"'],
    jsTools: ['TreeNode', 'BST', 'traversals.inorder', 'Array stack', '±Infinity'],
  },

  keyConcepts: [
    'BST invariant: left subtree < node < right subtree, for EVERY node and its WHOLE subtrees.',
    'Guided descent discards one subtree per step: O(h), which is O(log n) only when balanced.',
    'In-order traversal of a BST is sorted — kth smallest, min difference, recover, iterator all use it.',
    'Every node lives in an interval (low, high) inherited from its ancestors — pass it down to validate or prune.',
    'Delete with two children: replace with the in-order successor (leftmost of right subtree), then delete that.',
    'Build balanced from sorted data by choosing the middle as root: height ⌈log₂(n+1)⌉.',
    'Bottom-up summaries (isBST, min, max, sum) find BST subtrees inside a plain tree in O(n).',
  ],

  interviewTips: [
    'State the invariant and the O(h) caveat out loud.',
    'Ask about duplicates and integer extremes; use ±Infinity bounds.',
    'Offer the in-order-array solution first, then optimise to O(h) space / early stop.',
  ],
};
