export default {
  id: 'heaps',
  summary: 'A heap is a complete binary tree stored in an array that always keeps the smallest (or largest) element at the top, giving O(1) peek and O(log n) insert / remove — the engine behind priority queues, Top-K, running medians, K-way merges and scheduling.',

  jsTools: [
    { api: 'MinHeap / MaxHeap (toolkit)', use: 'new MinHeap() or new MinHeap(x => x.dist) — push, pop, peek, size, isEmpty', complexity: 'push/pop O(log n), peek O(1)' },
    { api: 'PriorityQueue (toolkit)', use: 'new PriorityQueue((a, b) => a[0] - b[0] || a[1] - b[1]) — custom comparator with tie-breaks', complexity: 'push/pop O(log n)' },
    { api: 'Array.prototype.sort((a, b) => a - b)', use: 'Sometimes sorting once beats a heap (all data known up front, you need everything in order)', complexity: 'O(n log n)' },
    { api: 'Map', use: 'Frequency counts before pushing (value → count), lazy-deletion counters', complexity: 'O(1) average' },
    { api: '(i - 1) >> 1, 2 * i + 1, 2 * i + 2', use: 'Parent and children indices in the heap array', complexity: 'O(1)' },
    { api: 'Destructuring swap [a[i], a[j]] = [a[j], a[i]]', use: 'Swap during sift up / sift down', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'heap-top-k',
      name: 'Heap — Top K / Kth Element',
      summary: 'Keep a heap of size k holding the best k candidates seen so far. For the k LARGEST use a MIN-heap: its top is the weakest of the k and is the one to evict.',
      whyItExists: 'Sorting everything costs O(n log n) even if you only need k items. A size-k heap costs O(n log k) time and O(k) memory, and works on a stream where you never see all the data at once.',
      whenToUse: [
        '"k largest / smallest / most frequent / closest"',
        '"k-th largest" (the top of a size-k min-heap is exactly the k-th largest)',
        'A stream where the answer must be available after each new element',
      ],
      clues: ['"top k"', '"k most frequent"', '"k closest"', '"kth largest"', '"kth smallest"', '"stream"'],
      whenNotToUse: [
        'k is close to n and all data is known — just sort',
        'You need a one-off kth element of a static array and average O(n) is acceptable — quickselect',
        'Frequencies are bounded by n — bucket sort gives O(n)',
      ],
      template: `function topKLargest(nums, k) {
  const heap = new MinHeap();        // top = smallest of the current best k
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop(); // evict the weakest candidate
  }
  return heap.toArray();             // the k largest (unordered); heap.peek() = kth largest
}`,
      variations: [
        { name: 'Kth largest in a stream', description: 'Keep the size-k min-heap alive between add() calls; peek() is the answer.' },
        { name: 'Top K frequent', description: 'Count with a Map, then run top-k on (value, count) pairs keyed by count.' },
        { name: 'K closest', description: 'Max-heap by distance of size k: evict the farthest.' },
        { name: 'Quickselect alternative', description: 'Partition like quicksort but recurse into one side only: O(n) average, O(n²) worst.' },
      ],
      mistakes: [
        'Using a max-heap of all n elements and popping k times — O(n + k log n) and O(n) memory; fine, but not the size-k trick',
        'Choosing the wrong heap direction (max-heap for k largest evicts the BEST element)',
        'Forgetting to pop after exceeding k, so the heap grows to n',
      ],
      evolution: {
        easy: 'Kth largest in a stream, relative ranks by repeated extraction.',
        medium: 'Top K frequent, K closest points, kth largest in an array (heap vs quickselect).',
        hard: 'Top K over a sliding window or with updates (lazy deletion, indexed heaps).',
      },
    },
    {
      id: 'heap-two-heaps',
      name: 'Heap — Two Heaps (running median)',
      summary: 'A max-heap holds the smaller half, a min-heap holds the larger half. Keep their sizes equal (or the low half one bigger); the median sits on the tops.',
      whyItExists: 'The median needs "the middle" of a changing multiset. A sorted array makes insertion O(n). Splitting the data into two halves, each exposing the element nearest the middle, gives O(log n) insert and O(1) median.',
      whenToUse: [
        'Running median of a stream',
        'Median of every sliding window (with lazy deletion)',
        'Any problem that needs the boundary between "lower part" and "upper part" of a changing set',
      ],
      clues: ['"median"', '"middle value"', '"data stream"', '"sliding window median"', '"balance two groups"'],
      whenNotToUse: [
        'The data is static — sort once and index the middle',
        'You need arbitrary percentiles/ranks on updates — an order-statistics tree or Fenwick tree over values is better',
      ],
      template: `const low = new MaxHeap();   // smaller half, top = largest of the small ones
const high = new MinHeap();  // larger half, top = smallest of the large ones
function add(x) {
  low.push(x);
  high.push(low.pop());                       // move the biggest of low to high (keeps order)
  if (high.size() > low.size()) low.push(high.pop()); // rebalance: low may have one extra
}
function median() {
  return low.size() > high.size() ? low.peek() : (low.peek() + high.peek()) / 2;
}`,
      variations: [
        { name: 'Sliding window median', description: 'Heaps cannot delete arbitrary elements cheaply → mark outgoing values in a Map and discard them lazily when they reach a top.' },
        { name: 'IPO-style two heaps', description: 'One heap of "locked" items ordered by requirement, one of "available" items ordered by value; move items across as the requirement is met.' },
      ],
      mistakes: [
        'Pushing directly into one heap by comparing with a top, then forgetting to rebalance sizes',
        'Integer division habits from other languages — in JS (a + b) / 2 is already a float',
        'In lazy deletion, counting sizes including elements that are marked deleted',
      ],
      evolution: {
        easy: '—',
        medium: 'Balance two groups (e.g. IPO\'s locked/available heaps).',
        hard: 'Find median from data stream, sliding window median with lazy deletion.',
      },
    },
    {
      id: 'heap-k-way-merge',
      name: 'Heap — K-way Merge',
      summary: 'Put the head of each of k sorted sequences into a min-heap. Repeatedly pop the smallest, output it, and push the next element from the same sequence.',
      whyItExists: 'Merging k sorted lists pairwise-in-a-row costs O(k·N). The heap always knows which of the k current heads is smallest in O(log k), so N total elements cost O(N log k).',
      whenToUse: [
        'Merge k sorted lists / arrays / files',
        'k-th smallest in a sorted matrix or among pair sums (lazily generated sorted sequences)',
        'Smallest range that includes one element from each of k lists',
      ],
      clues: ['"k sorted lists"', '"merge"', '"sorted matrix"', '"k pairs with smallest sums"', '"one element from each list"'],
      whenNotToUse: [
        'Only two sequences — the two-pointer merge is simpler (O(n), no heap)',
        'Inputs are unsorted — sort or use a different pattern',
      ],
      template: `function kWayMerge(lists) {
  const heap = new PriorityQueue((a, b) => a.val - b.val);
  for (let i = 0; i < lists.length; i++) if (lists[i].length) heap.push({ val: lists[i][0], i, j: 0 });
  const out = [];
  while (!heap.isEmpty()) {
    const { val, i, j } = heap.pop();          // smallest current head
    out.push(val);
    if (j + 1 < lists[i].length) heap.push({ val: lists[i][j + 1], i, j: j + 1 }); // its successor
  }
  return out;
}`,
      variations: [
        { name: 'Linked lists', description: 'Push ListNodes keyed by node.val; after popping push node.next.' },
        { name: 'Implicit sequences', description: 'K pairs with smallest sums: row i is nums1[i] + nums2[0..], push (i, 0) for each i and advance j.' },
        { name: 'Smallest range', description: 'Track the current max of the heap contents; range = [heap top, max]. Stop when any list runs out.' },
      ],
      mistakes: [
        'Pushing every element of every list up front — correct but O(N log N) instead of O(N log k)',
        'Forgetting to remember WHICH list an element came from, so you cannot push its successor',
        'Pushing null heads (empty lists) into the heap',
      ],
      evolution: {
        easy: 'Merge two sorted lists (no heap needed).',
        medium: 'Find k pairs with smallest sums, kth smallest in a sorted matrix.',
        hard: 'Merge k sorted lists, smallest range covering elements from k lists.',
      },
    },
    {
      id: 'heap-greedy-scheduling',
      name: 'Heap — Greedy Simulation & Scheduling',
      summary: 'When each step of a process must act on the current largest/smallest item (and items change or get added), keep them in a heap and simulate.',
      whyItExists: 'Greedy rules like "always smash the two heaviest stones", "always run the most frequent task", "always take the most profitable affordable project" need the extreme element repeatedly while the set changes. Re-sorting every step is O(n log n) per step; a heap makes each step O(log n).',
      whenToUse: [
        'Repeatedly take the max/min, modify it, and put it back (last stone weight, take gifts)',
        'Arrange items so equal ones are not adjacent (reorganize string, task scheduler)',
        'Unlock items over time and pick the best unlocked one (IPO, meeting rooms, CPU scheduling)',
      ],
      clues: ['"each turn choose the largest"', '"repeat until"', '"no two adjacent are equal"', '"cooldown"', '"at most k projects"', '"maximize capital"'],
      whenNotToUse: [
        'The greedy choice does not depend on a changing extreme — sorting once is enough',
        'A closed-form counting argument exists and is simpler (task scheduler has one!)',
      ],
      template: `const heap = new MaxHeap();
for (const x of items) heap.push(x);
while (heap.size() > 1 /* or: steps remain */) {
  const a = heap.pop();          // current best
  const b = heap.pop();
  const rest = combine(a, b);    // apply the rule
  if (rest) heap.push(rest);     // put the modified item back
}`,
      variations: [
        { name: 'Pop, modify, push back', description: 'Last stone weight, take gifts from the richest pile.' },
        { name: 'Most frequent first + hold back', description: 'Reorganize string: pop the most frequent char, emit it, and keep it out of the heap for one step so it cannot repeat.' },
        { name: 'Sort + heap (unlock then choose)', description: 'IPO: sort projects by capital; as capital grows push newly affordable profits into a max-heap; pick the top.' },
      ],
      mistakes: [
        'Pushing the just-used item back immediately when it must wait (adjacent duplicates)',
        'Forgetting to push the modified item back',
        'Using sort() inside the loop — O(n log n) per step',
      ],
      evolution: {
        easy: 'Last stone weight, take gifts, relative ranks.',
        medium: 'Task scheduler, reorganize string, sort characters by frequency.',
        hard: 'IPO (two-phase sort + heap), scheduling with deadlines and lazy deletion.',
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
            md: `A **heap** is a data structure that answers one question instantly: *"what is the smallest (or largest) thing I currently have?"* — and still lets you add and remove things quickly.

Picture a hospital emergency room. Patients do not leave in arrival order; the most urgent one is treated next. New patients keep arriving. The waiting room is a **priority queue**, and a heap is the standard way to build one.

Shape-wise, a heap is a binary tree with two rules:

1. **Shape rule — complete tree:** every level is full except possibly the last, which fills from left to right. No gaps.
2. **Order rule — heap property:** in a **min-heap**, every parent is ≤ its children (so the root is the minimum). In a **max-heap**, every parent is ≥ its children.

\`\`\`text
          1                  index:  0  1  2  3  4  5  6
        /   \\                array: [1, 3, 2, 7, 4, 5, 8]
       3     2
      / \\   / \\
     7   4 5   8
\`\`\`

Notice what the order rule does **not** say: nothing about left vs right. 3 and 2 are siblings in either order. A heap is only *partially* ordered — just enough to find the top fast, and cheap to maintain.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Priority queue** — an abstract "bag" with operations *insert* and *remove the highest-priority item*. A heap is one implementation.
- **Complete binary tree** — all levels full except the last, which is filled left to right. Its height is ⌊log₂ n⌋.
- **Heap property** — parent ≤ children (min-heap) or parent ≥ children (max-heap). It holds at every node.
- **Sift up / sift down** (a.k.a. bubble up / heapify down) — the two repair moves that restore the heap property after a change.
- **Heapify** — turning an arbitrary array into a heap in place (O(n)).`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript has no built-in priority queue',
            md: 'Python has `heapq`, Java has `PriorityQueue`, C++ has `priority_queue`. JavaScript has **nothing**. In interviews you either write a small heap class (you will, in this lesson) or say "assume a MinHeap class" if the interviewer allows. In this app the toolkit provides `MinHeap`, `MaxHeap` and `PriorityQueue` as globals.',
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-1',
            question: 'Which of these arrays is a valid **min-heap** (index i has children 2i+1 and 2i+2)?',
            options: [
              '[1, 2, 3, 4, 5, 6] — but only because it is sorted; unsorted arrays can never be heaps',
              '[5, 3, 8, 1] — the root is in the middle of the values',
              '[1, 5, 2, 6, 7, 3] — every parent is ≤ its children',
              '[2, 1, 3] — the smallest value is somewhere near the top',
            ],
            answer: 2,
            explanation: 'Check each parent: index 0 (1) ≤ its children 5 and 2; index 1 (5) ≤ its children 6 and 7; index 2 (2) ≤ its child 3. All hold, so it is a min-heap even though it is not sorted.',
            misconceptions: {
              0: 'A sorted array IS a min-heap, but most heaps are not sorted. [1, 5, 2, 6, 7, 3] is an unsorted heap. The heap property is much weaker than sortedness.',
              1: '5 is the root but 3 and 1 are smaller — a min-heap\'s root must be the minimum.',
              3: '"Near the top" is not enough: the root (2) is larger than its child 1, so the heap property fails.',
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
            md: `Suppose values keep arriving and you repeatedly need the current minimum.

| structure | insert | get min | remove min |
|---|---|---|---|
| unsorted array | O(1) | O(n) scan | O(n) |
| sorted array | O(n) (shift to insert) | O(1) | O(1) from the end / O(n) from the front |
| balanced BST | O(log n) | O(log n) | O(log n) |
| **binary heap** | **O(log n)** | **O(1)** | **O(log n)** |

A heap gives BST-like speed with a **much simpler** structure: a plain array, no pointers, no balancing rotations — the complete-tree shape is balanced automatically.

With n operations that is O(n log n) instead of O(n²). For n = 10⁵ that is ~1.7 million steps instead of 10 billion.`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-2',
            question: 'Why is a heap usually preferred over a sorted array when values are **inserted and removed many times**?',
            options: [
              'Because inserting into a sorted array requires shifting elements (O(n)), while a heap insert only walks one root-to-leaf path (O(log n))',
              'Because a heap keeps all elements fully sorted for free',
              'Because a heap uses less memory than an array',
              'Because heaps support O(1) search for any value',
            ],
            answer: 0,
            explanation: 'The heap\'s partial order is cheap to maintain: one path of length ⌊log₂ n⌋. A sorted array must keep a total order, which costs O(n) shifting per insert.',
            misconceptions: {
              1: 'A heap is only partially ordered. Getting everything in order requires popping n times (that is heapsort, O(n log n)).',
              2: 'A heap IS an array — same memory. The win is time, not space.',
              3: 'Searching a heap for an arbitrary value is O(n): the order rule gives no hint whether to go left or right. That is a BST superpower, not a heap one.',
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use a heap when you **repeatedly** need the minimum or maximum of a collection that **changes**.

| pattern | what the heap holds | classic problems |
|---|---|---|
| **Top K / Kth** | the best k candidates (size-k heap) | kth largest, top k frequent, k closest |
| **Two heaps** | the lower half (max-heap) and upper half (min-heap) | median of a stream, sliding window median |
| **K-way merge** | the current head of each sorted sequence | merge k sorted lists, smallest range, k smallest pairs |
| **Greedy / scheduling** | the items still available, best first | last stone weight, task scheduler, reorganize string, IPO |

If you need the extreme only **once**, a linear scan (\`Math.min(...arr)\` for small arrays, or a loop) is O(n) and simpler. If you need **everything** in order and the data is static, just sort.`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-3',
            question: 'You get all 10⁶ numbers at once and must return them **all** in increasing order. Is a heap the best tool?',
            options: [
              'Yes — heaps are always faster than sorting',
              'Yes — only a heap can produce sorted output',
              'No — the heap would need O(n²) time',
              'No — `nums.sort((a, b) => a - b)` is also O(n log n), simpler, and highly optimised; heaps shine when data changes or you need only part of the order',
            ],
            answer: 3,
            explanation: 'Heapsort and built-in sort are both O(n log n). When you need the whole order of a static array, the built-in sort is the obvious choice. Heaps win for streams, partial orders (top k) and interleaved insert/remove.',
            misconceptions: {
              0: 'Building a heap and popping everything is heapsort — same O(n log n) as sorting, with worse constants in JS.',
              1: 'Any comparison sort produces sorted output.',
              2: 'Heapsort is O(n log n): heapify O(n) + n pops at O(log n).',
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
            clues: ['"k largest / smallest / most frequent / closest"', '"kth largest"', '"median" of a stream or window', '"merge k sorted"', '"each turn pick the largest / smallest"', '"schedule" with priorities or cooldowns', '"maximize profit with limited picks"'],
            conclusion: 'Think Heap / Priority Queue',
          },
          {
            type: 'text',
            md: `Ask:

1. **Do I need the min/max many times while the set changes?** → heap.
2. **Is k small compared to n?** → size-k heap: O(n log k).
3. **Do I need the middle, not an end?** → two heaps.
4. **Are there k sorted sources?** → k-way merge with a heap of heads.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — a tree hiding in an array',
        blocks: [
          {
            type: 'text',
            md: `Because a complete tree has no gaps, we can number its nodes level by level, left to right, and store them in an array. No pointers are needed — the positions **are** the links:

\`\`\`text
parent(i) = Math.floor((i - 1) / 2)   // (i - 1) >> 1
left(i)   = 2 * i + 1
right(i)  = 2 * i + 2
\`\`\`

Example: index 4 (value 4 in the heap above) has parent (4 − 1) >> 1 = 1 (value 3) and children 9 and 10 (outside the array → none).

Every change to a heap happens at **one end of a path**:

- **push(x):** put x at the end of the array (the next free leaf slot keeps the tree complete). It may be smaller than its parent → **sift up**: swap with the parent while it is smaller.
- **pop():** the answer is \`heap[0]\`. Move the **last** element to the root (keeps completeness) — now the root may be too big → **sift down**: swap with the **smaller** child while that child is smaller.

Both walks follow a single root-to-leaf path, and a complete tree of n nodes has height ⌊log₂ n⌋ — so both are **O(log n)**.`,
          },
          {
            type: 'visual',
            scenario: 'heap-operations',
            input: { nums: [5, 3, 8, 1, 9, 2] },
            caption: 'Insert 5, 3, 8, 1, 9, 2 into a min-heap (watch each value sift up), then extract the minimum repeatedly (watch the last element sift down).',
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-4',
            question: 'In sift down, why must you swap with the **smaller** of the two children (in a min-heap)?',
            options: [
              'It does not matter which child you pick',
              'Because the smaller child is always the left one',
              'Because the child you promote becomes the parent of the other child — only the smaller one is ≤ its sibling, so only it keeps the heap property',
              'Because it makes the tree more balanced',
            ],
            answer: 2,
            explanation: 'After the swap, the promoted child sits above its former sibling. If you promoted the larger child, it would be a parent larger than its new child — a violation you just created.',
            misconceptions: {
              0: 'Try it: parent 9 with children 2 and 5. Swap 9 with 5 → 5 is now parent of 2: broken. Swap with 2 → 2 is parent of 5 and 9: fine.',
              1: 'Siblings are unordered in a heap; either one can be smaller.',
              3: 'The shape (completeness) never changes during sift down; only values move.',
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
            md: 'Without a heap, "repeatedly give me the minimum" is typically done with a **linear scan** each time, or by **re-sorting** after every change. Take *Last Stone Weight* (smash the two heaviest stones until at most one is left):',
          },
          {
            type: 'compare',
            left: {
              title: 'Re-sort every round — O(n² log n)',
              code: `function lastStoneWeight(stones) {
  const s = [...stones];
  while (s.length > 1) {
    s.sort((a, b) => a - b);      // O(n log n) every round
    const y = s.pop(), x = s.pop();
    if (y !== x) s.push(y - x);
  }
  return s.length ? s[0] : 0;
}`,
            },
            right: {
              title: 'Max-heap — O(n log n)',
              code: `function lastStoneWeight(stones) {
  const heap = new MaxHeap();
  for (const w of stones) heap.push(w);
  while (heap.size() > 1) {
    const y = heap.pop(), x = heap.pop(); // O(log n)
    if (y !== x) heap.push(y - x);
  }
  return heap.isEmpty() ? 0 : heap.peek();
}`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see **what work** the sort-every-round version repeats, and why a heap avoids it?',
            deeper: `After one smash, only **one** value changed (or disappeared). The rest of the array was already sorted, yet \`sort\` re-examines everything. The heap only repairs the single path touched by the change: pop repairs one path, push repairs one path. The lesson: *if each step changes O(1) items, the data structure should pay O(log n), not O(n log n), per step.*`,
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — sift up, sift down, heapify',
        blocks: [
          {
            type: 'steps',
            title: 'push(x) — O(log n)',
            steps: [
              'Append x at the end: `heap.push(x)`. The tree is still complete.',
              'Let `i` be its index. While `i > 0` and `heap[i] < heap[parent(i)]`, swap them and set `i = parent(i)`.',
              'Stop when the parent is ≤ x or x reached the root. At most ⌊log₂ n⌋ swaps.',
            ],
          },
          {
            type: 'steps',
            title: 'pop() — O(log n)',
            steps: [
              'Save `top = heap[0]` (the minimum).',
              'Remove the last element and put it at index 0 (skip if the heap is now empty).',
              'Sift down: find the smaller child; if it is smaller than the current value, swap and continue from that child. Stop when both children are ≥ the value or there are no children.',
              'Return `top`.',
            ],
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why heapify (building a heap from n items) is O(n), not O(n log n)',
            md: `Pushing n items one by one costs O(n log n). But you can heapify an existing array **bottom-up**: call sift down on every non-leaf node from index \`⌊n/2⌋ − 1\` down to 0.

The trick is *who pays how much*: sift down from a node costs its **height**, not the tree height. Half the nodes are leaves (cost 0), a quarter are one level up (cost ≤ 1), an eighth cost ≤ 2, and so on:

\`\`\`text
total ≤ n/4·1 + n/8·2 + n/16·3 + …  =  n · Σ k/2^(k+1)  =  n · 1  →  O(n)
\`\`\`

Most nodes are near the bottom, and near the bottom sifting is cheap. (Sift *up* from every node would be the opposite — most nodes are deep, so that costs O(n log n).)`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-5',
            question: 'A min-heap has 1,000,000 elements. About how many swaps can a single `pop()` perform at most?',
            options: [
              'About 1,000,000',
              'About 20',
              'About 1,000',
              'Exactly 1',
            ],
            answer: 1,
            explanation: 'Sift down follows one path from the root to (at worst) a leaf. The height of a complete tree with 10⁶ nodes is ⌊log₂ 10⁶⌋ = 19, so at most ~20 swaps.',
            misconceptions: {
              0: 'That would be a linear scan. The heap never visits more than one node per level.',
              2: '1,000 ≈ √n. Heap operations are logarithmic, not square-root.',
              3: 'Moving the last element to the root usually makes it too big; it has to travel down several levels.',
            },
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation — build your own MinHeap',
        blocks: [
          {
            type: 'code',
            title: 'MinHeap with a key function (this is essentially the toolkit\'s implementation)',
            code: `class MinHeap {
  constructor(key = (x) => x) {   // key(x) is the priority; smaller comes out first
    this.a = [];
    this.key = key;
  }
  size() { return this.a.length; }
  isEmpty() { return this.a.length === 0; }
  peek() { return this.a[0]; }     // O(1)

  push(x) {                        // O(log n)
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;      // parent index
      if (this.key(a[i]) >= this.key(a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }

  pop() {                          // O(log n)
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;                 // fill the hole at the root with the last leaf
      let i = 0;
      while (true) {
        const l = 2 * i + 1, r = l + 1;
        let best = i;
        if (l < a.length && this.key(a[l]) < this.key(a[best])) best = l;
        if (r < a.length && this.key(a[r]) < this.key(a[best])) best = r;
        if (best === i) break;     // both children are >= → heap property restored
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return top;
  }
}`,
          },
          {
            type: 'text',
            md: `**Using the toolkit (available as globals in this app):**

\`\`\`js
const minH = new MinHeap();                    // numbers, smallest first
const maxH = new MaxHeap();                    // numbers, largest first
const byDist = new MinHeap((p) => p.dist);     // objects ordered by a key
const pq = new PriorityQueue((a, b) => a[0] - b[0] || a[1] - b[1]); // comparator with tie-break
// methods: push(x), pop(), peek(), size(), isEmpty(), toArray()
\`\`\`

A **max-heap** is just a min-heap with the comparison reversed (or with key \`x => -x\`). A **comparator** \`(a, b) => …\` that returns a negative number means "a comes out first", exactly like \`Array.prototype.sort\`.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`(i - 1) >> 1\` is floor division by 2 for non-negative ints — fast and clear. Avoid \`(i - 1) / 2\` without flooring.
- Store **tuples** as small arrays \`[priority, value]\` or objects \`{ val, i, j }\`; pass a comparator that reads the priority.
- Tie-breaks matter when a problem specifies them ("smaller index first") — chain comparisons: \`a[0] - b[0] || a[1] - b[1]\`.
- A heap's \`toArray()\` is in **heap order**, not sorted order.
- Never do \`arr.sort()\` without a comparator on numbers: it sorts as strings (\`[10, 9, 1] → [1, 10, 9]\`).`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-6',
            question: 'You need a heap where the item with the **largest** `score` comes out first, and ties go to the **smaller** `id`. Which comparator do you pass to `PriorityQueue`?',
            options: [
              '(a, b) => a.score - b.score || a.id - b.id',
              '(a, b) => b.score - a.score || b.id - a.id',
              '(a, b) => b.score - a.score || a.id - b.id',
              '(a, b) => a.id - b.id',
            ],
            answer: 2,
            explanation: 'Negative means "a first". `b.score - a.score` is negative when a has the larger score → larger scores first. On a tie (0), fall through to `a.id - b.id`, negative when a has the smaller id.',
            misconceptions: {
              0: 'That puts the SMALLEST score first — a min-heap by score.',
              1: 'Scores are right, but `b.id - a.id` sends the LARGER id first on ties.',
              3: 'That ignores the score completely.',
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
            title: 'The four heap skeletons',
            code: `// 1. Top K largest: min-heap of size k
const h = new MinHeap();
for (const x of nums) { h.push(x); if (h.size() > k) h.pop(); }
// h.peek() is the kth largest

// 2. Two heaps: low = max-heap, high = min-heap, low.size() >= high.size()
low.push(x); high.push(low.pop()); if (high.size() > low.size()) low.push(high.pop());

// 3. K-way merge: heap of (value, listIndex, elementIndex)
const pq = new PriorityQueue((a, b) => a[0] - b[0]);
lists.forEach((l, i) => l.length && pq.push([l[0], i, 0]));
while (!pq.isEmpty()) { const [v, i, j] = pq.pop(); out.push(v); if (j + 1 < lists[i].length) pq.push([lists[i][j + 1], i, j + 1]); }

// 4. Greedy simulation: pop best, modify, push back
while (heap.size() > 1) { const a = heap.pop(); /* ... */ heap.push(changed); }`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'Min-heap: push 5, 3, 8, 1 then pop()',
            columns: ['operation', 'array after append / move', 'swaps', 'heap'],
            rows: [
              ['push 5', '[5]', '—', '[5]'],
              ['push 3', '[5, 3]', '3 < 5 → swap (i 1 ↔ 0)', '[3, 5]'],
              ['push 8', '[3, 5, 8]', '8 ≥ 3 → stop', '[3, 5, 8]'],
              ['push 1', '[3, 5, 8, 1]', '1 < 5 → swap (3 ↔ 1); 1 < 3 → swap (1 ↔ 0)', '[1, 3, 8, 5]'],
              ['pop → 1', 'last (5) moves to root: [5, 3, 8]', 'smaller child 3 < 5 → swap', '[3, 5, 8]'],
            ],
            note: 'Every operation touched at most one root-to-leaf path.',
          },
        ],
      },
      {
        id: 'optimized-top-k',
        title: 'Optimized approach — Top K and Kth element',
        blocks: [
          {
            type: 'text',
            md: `**Goal:** the k largest of n numbers (or of a stream).

**Obvious idea:** sort descending and take k → O(n log n). Or put everything in a max-heap and pop k times → O(n + k log n) with heapify, O(n) memory.

**Size-k heap idea:** keep only the k best **so far**. When a new number arrives, it deserves a spot only if it beats the **weakest** of the current k. The weakest of k large numbers is the smallest one — so keep them in a **min-heap**, whose top is exactly that weakest member.

- push the new number; if size > k, pop (throw out the weakest);
- at the end the heap holds the k largest, and its top is the **k-th largest**.

Cost: n pushes/pops on a heap of size ≤ k → **O(n log k)** time, **O(k)** memory. Great when k ≪ n, and it works on streams.`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-7',
            question: 'To keep the **k largest** values of a stream, why do we use a **min**-heap of size k (not a max-heap)?',
            options: [
              'Because min-heaps are faster than max-heaps',
              'Because the element we must throw away when a better one arrives is the smallest of the k, and a min-heap puts exactly that one on top',
              'Because a max-heap cannot hold k elements',
              'Because the answer must be returned in increasing order',
            ],
            answer: 1,
            explanation: 'The heap is a "club" of the k best. The member at risk of being kicked out is the weakest (smallest). A min-heap exposes it at the top in O(1) and removes it in O(log k).',
            misconceptions: {
              0: 'They are the same structure with the comparison flipped; speed is identical.',
              2: 'Any heap can hold k elements. The issue is which element is on top: a max-heap exposes the best, but you never want to evict the best.',
              3: 'The heap\'s internal order is not sorted anyway; the choice is about eviction, not output order.',
            },
            deeper: 'Mirror rule: for the **k smallest** use a **max**-heap of size k (evict the largest). A mnemonic: *the heap type is the opposite of what you want to keep*, because the top is what you throw away.',
          },
          {
            type: 'text',
            md: `**Heap vs quickselect for "kth largest in an array".** Quickselect partitions around a pivot like quicksort but recurses into **only the side containing index n − k**. Expected work n + n/2 + n/4 + … = **O(n)** average; a bad pivot sequence gives O(n²) worst case (random pivots make that very unlikely). The heap is O(n log k) always and works on streams. In interviews: mention both, code the heap first (safer), offer quickselect as the optimisation.`,
          },
        ],
      },
      {
        id: 'optimized-two-heaps',
        title: 'Optimized approach — Two heaps (running median)',
        blocks: [
          {
            type: 'text',
            md: `Split the numbers into a **lower half** and an **upper half**:

- \`low\` — a **max**-heap: its top is the largest of the small numbers.
- \`high\` — a **min**-heap: its top is the smallest of the large numbers.

Invariants: (1) every value in \`low\` ≤ every value in \`high\`; (2) \`low.size()\` equals \`high.size()\` or is one larger.

Then the median is \`low.peek()\` (odd count) or the average of the two tops (even count) — O(1).

**Adding x** (O(log n)): push x into \`low\`, then move \`low\`'s top to \`high\` — this guarantees invariant (1), because the largest of the low side is what crosses over. If now \`high\` is bigger, move \`high\`'s top back to \`low\` — restoring invariant (2).`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-8',
            question: 'low (max-heap) = {1, 3}, high (min-heap) = {5, 8}. We add **4** using "push to low, move low\'s top to high, rebalance". Where does each number end up, and what is the median?',
            options: [
              'low = {1, 3, 4}, high = {5, 8}; median 4',
              'low = {1, 3}, high = {4, 5, 8}; median 4',
              'low = {1, 3, 4, 5}, high = {8}; median 3.5',
              'low = {3, 4}, high = {1, 5, 8}; median 3.5',
            ],
            answer: 0,
            explanation: 'Push 4 to low → {1,3,4}. Move low\'s top (4) to high → low {1,3}, high {4,5,8}. high is bigger → move its top (4) back → low {1,3,4}, high {5,8}. Odd count → median = low.peek() = 4.',
            misconceptions: {
              1: 'That is the state after the second step. The rebalance step moves 4 back because low must never be smaller than high.',
              2: '5 never moves to low — only tops cross between heaps, and the sizes would be unbalanced (4 vs 1).',
              3: '1 cannot be in the high half: every value in low must be ≤ every value in high.',
            },
          },
          {
            type: 'text',
            md: `**Sliding window median** adds removals. Heaps cannot delete an arbitrary element cheaply, so use **lazy deletion**: record the outgoing value in a \`Map\` of "pending deletions" and only actually discard it when it reaches the **top** of a heap (tops are the only elements we ever read). Keep separate "real size" counters that ignore pending deletions, and rebalance using those.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why lazy deletion is **correct** even though "deleted" values are still physically inside the heaps?',
            deeper: 'We only ever *read* the tops. Before reading a top, we pop it while it is marked as deleted. So a stale value can never be returned as an answer. Stale values buried deeper do no harm; they are either cleaned when they surface or remain unread. The cost: heaps may temporarily hold up to O(n) stale items, so each operation is O(log n) in the total number of pushed items instead of the window size k — still fast.',
          },
        ],
      },
      {
        id: 'optimized-k-way-merge',
        title: 'Optimized approach — K-way merge',
        blocks: [
          {
            type: 'text',
            md: `You have k sorted lists with N elements in total. The next output element is always the **smallest of the k current heads**. Keep exactly those heads in a min-heap:

1. push the first element of each list (with *which list* and *which position* it came from);
2. pop the smallest, append it to the output, push the **next** element of the same list;
3. repeat until the heap is empty.

The heap never holds more than k items → each step is O(log k) → **O(N log k)** total. Compare: merging list by list into a growing result is O(k·N); dumping everything and sorting is O(N log N).

The same idea works for **implicit** sorted sequences. *Find K pairs with smallest sums*: for each \`i\`, the sums \`nums1[i] + nums2[0], nums1[i] + nums2[1], …\` are sorted. Treat them as k lists and merge lazily, stopping after k pops. *Smallest range covering k lists*: the heap holds one element per list; the range is \`[heap min, current max]\`; advance the list that owns the minimum.`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-9',
            question: 'Merging k = 1000 sorted lists with N = 10⁶ total elements. Roughly how many basic steps does the heap-based merge take?',
            options: [
              'About N · k = 10⁹',
              'About N · log₂ N ≈ 2 · 10⁷',
              'About N · log₂ k ≈ 10⁷',
              'About N = 10⁶ exactly — heaps are O(1)',
            ],
            answer: 2,
            explanation: 'Each of the N elements is pushed and popped once in a heap of size ≤ k, costing O(log k) ≈ 10 each → ~10⁷.',
            misconceptions: {
              0: 'That is the naive "scan all k heads for each output element" approach, which is what the heap avoids.',
              1: 'That is sorting all elements from scratch; the heap is smaller (k, not N), so it is log k per operation.',
              3: 'push and pop are O(log size), not O(1). Only peek is O(1).',
            },
          },
        ],
      },
      {
        id: 'optimized-scheduling',
        title: 'Optimized approach — Heap + greedy (scheduling)',
        blocks: [
          {
            type: 'text',
            md: `Many greedy algorithms say *"at each step, act on the best available item"*. If the set of items changes between steps, a heap is the natural engine.

- **Reorganize string** (no two equal letters adjacent): always place the **most frequent remaining** letter — it is the one most at risk of being forced next to itself later. But you may not place the same letter twice in a row, so pop the top two, or pop one and **hold it out** of the heap for one step. It is impossible exactly when some letter appears more than ⌈n/2⌉ times.
- **Task scheduler** (same task needs \`n\` idle slots between runs): simulate rounds of \`n + 1\` slots, each round taking the most frequent remaining tasks — or use the counting formula \`max(len, (maxFreq − 1)(n + 1) + countOfMax)\`.
- **IPO** (start at most k projects, each needs capital and gives profit): **sort** projects by required capital. As your capital grows, push every newly affordable project's profit into a **max-heap**; take the top. Two structures, two roles: the sorted list *unlocks*, the heap *chooses*.`,
          },
          {
            type: 'reflect',
            prompt: 'Why is it safe (greedy) in IPO to always take the most profitable affordable project?',
            deeper: 'Profits only ever increase your capital, and a larger capital never makes a project unaffordable. Suppose an optimal plan picks some affordable project P now instead of the most profitable affordable Q. Swapping P for Q gives at least as much capital right now, so every project the plan could afford later is still affordable — the swapped plan is no worse. Repeating the argument shows greedy is optimal (an exchange argument, a technique you will see again in the Greedy topic).',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Wrong heap direction for Top-K.** k largest → **min**-heap of size k; k smallest → **max**-heap.
2. **Assuming the heap array is sorted.** Only \`heap[0]\` is special; \`toArray()\` is heap order.
3. **Searching or deleting arbitrary elements** — O(n). Use lazy deletion with a Map.
4. **Comparator sign errors.** Negative means "a first". Test it on two values before trusting it.
5. **Pushing everything when k is small** — O(n log n) instead of O(n log k).
6. **Forgetting to remember the source** in k-way merge (which list, which index).
7. **Default \`sort()\` on numbers** is lexicographic — always pass \`(a, b) => a - b\`.
8. **Heap of objects without a key** — \`new MinHeap()\` on objects compares \`NaN\`s; pass a key function or comparator.`,
          },
          {
            type: 'checkpoint',
            id: 'heaps-cp-10',
            question: 'A teammate writes `const h = new MinHeap(); h.push([3, "c"]); h.push([1, "a"]);` and is surprised that `h.peek()` is `[3, "c"]`. Why?',
            options: [
              'MinHeap only supports strings',
              'The default key is x => x; subtracting two arrays gives NaN, every comparison fails, and elements never move — pass a key like p => p[0]',
              'Heaps always return the first inserted element',
              'peek() returns the maximum by design',
            ],
            answer: 1,
            explanation: '`[1,"a"] - [3,"c"]` is `NaN`. `NaN >= anything` is false and `NaN < anything` is false, so sift up/down decide nothing. Use `new MinHeap((p) => p[0])` or a `PriorityQueue` with a comparator.',
            misconceptions: {
              0: 'It supports anything — as long as the key returns numbers.',
              2: 'That is a queue (FIFO), not a heap. Here it only looks FIFO because comparisons are broken.',
              3: 'peek() returns the top, which is the minimum for a MinHeap.',
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
            time: 'push / pop O(log n), peek O(1), heapify O(n)',
            space: 'O(n) for the heap (O(k) for size-k patterns)',
            md: `| pattern | time | space |
|---|---|---|
| Top K with size-k heap | O(n log k) | O(k) |
| Kth largest via quickselect | O(n) average, O(n²) worst | O(1) |
| Running median (two heaps) | O(log n) per add, O(1) per median | O(n) |
| Sliding window median (lazy) | O(n log n) | O(n) |
| K-way merge of N elements | O(N log k) | O(k) |
| Greedy simulation with m steps | O((n + m) log n) | O(n) |

**Why log n:** a complete binary tree with n nodes has height ⌊log₂ n⌋; sift up/down walk one path. **Why heapify is O(n):** most nodes are near the bottom where sifting down is cheap (the sum n·Σk/2^(k+1) converges).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Ask whether you may assume a heap class.** In JavaScript many interviewers allow "assume a MinHeap with push/pop/peek"; if not, write the ~30-line class above — practise until it takes 5 minutes.
- **Say why the heap direction is what it is** ("min-heap of size k because the top is the one I evict").
- **Give the sort baseline first**, then improve: O(n log n) → O(n log k).
- **Mention quickselect** for kth-element questions and bucket sort for frequency questions — both can beat the heap.
- **Tie-breaking rules** in the statement must be reflected in the comparator; say so explicitly.
- For two heaps, **state both invariants** (order across heaps, size difference ≤ 1) before coding.`,
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
              { api: 'new MinHeap(key?)', use: 'Smallest key on top; key defaults to x => x', complexity: 'push/pop O(log n), peek O(1)' },
              { api: 'new MaxHeap(key?)', use: 'Largest key on top', complexity: 'push/pop O(log n), peek O(1)' },
              { api: 'new PriorityQueue(cmp)', use: 'Any order, including tie-breaks: (a, b) => a[0] - b[0] || a[1] - b[1]', complexity: 'push/pop O(log n)' },
              { api: 'heap.size() / isEmpty() / toArray()', use: 'Size checks and a heap-ordered copy (not sorted!)', complexity: 'O(1) / O(1) / O(n)' },
              { api: 'new Map()', use: 'Frequency counts and lazy-deletion counters', complexity: 'O(1) average' },
              { api: 'arr.sort((a, b) => a - b)', use: 'When sorting once is simpler than a heap (IPO pre-sort)', complexity: 'O(n log n)' },
              { api: '(i - 1) >> 1', use: 'Parent index in your own heap implementation', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Repeated min/max of a changing set', 'Top K / Kth largest or smallest', 'Median of a stream or window', 'Merging k sorted sources', 'Greedy "take the best available" simulations'],
    clues: ['top k', 'kth largest', 'k most frequent', 'k closest', 'median', 'merge k sorted', 'each turn take the largest', 'cooldown / schedule', 'maximize capital'],
    template: `// Top K largest
const h = new MinHeap();
for (const x of nums) { h.push(x); if (h.size() > k) h.pop(); }
// Two heaps
low.push(x); high.push(low.pop()); if (high.size() > low.size()) low.push(high.pop());
// K-way merge
const pq = new PriorityQueue((a, b) => a[0] - b[0]);`,
    complexity: 'push/pop O(log n), peek O(1), heapify O(n); Top-K O(n log k); K-way merge O(N log k)',
    mistakes: ['wrong heap direction for top-k', 'treating heap array as sorted', 'deleting arbitrary elements (use lazy deletion)', 'comparator sign errors', 'MinHeap of arrays without a key'],
    jsTools: ['MinHeap', 'MaxHeap', 'PriorityQueue', 'Map', 'sort((a,b)=>a-b)'],
  },

  keyConcepts: [
    'A heap is a complete binary tree in an array: parent (i-1)>>1, children 2i+1 and 2i+2.',
    'Heap property is partial order: parent ≤ children (min-heap). Only the top is special.',
    'push sifts up, pop moves the last leaf to the root and sifts down — both O(log n) because height is log n.',
    'Heapify bottom-up is O(n): most nodes are near the leaves where sifting is cheap.',
    'Top K largest → min-heap of size k (evict the weakest); O(n log k).',
    'Two heaps (max-heap low half + min-heap high half) give the median in O(1).',
    'K-way merge keeps one head per list in the heap: O(N log k).',
    'JavaScript has no built-in PQ — write one or use the toolkit MinHeap/MaxHeap/PriorityQueue.',
  ],

  interviewTips: [
    'Ask if you may assume a heap class; otherwise write it quickly.',
    'Explain the heap direction choice in Top-K problems.',
    'Offer sorting as the baseline and quickselect/bucket sort as alternatives.',
  ],
};
