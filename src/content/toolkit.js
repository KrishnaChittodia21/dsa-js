// "DSA Toolkit" reference docs. Each entry documents one ready-made data structure from
// src/toolkit/ (the UI shows that file's source code next to these notes). Everything in
// src/toolkit/index.js is also available as a global inside the practice code editor.
//
// This file is reference material only: no checkpoints, no quizzes.

export const TOOLKIT = [
  // ---------------------------------------------------------------- Stack
  {
    id: 'stack',
    name: 'Stack',
    file: 'Stack.js',
    exports: ['Stack'],
    category: 'Stack / Queue',
    summary: 'A pile of items where you can only touch the top one: the last thing you put in is the first thing you take out (LIFO).',
    explanation: `Think of a stack of plates. You put a new plate **on top**, and when you need one you take it **from the top**. You never pull a plate out of the middle. That rule, *last in, first out*, formally **LIFO**, is the whole idea of a stack.

\`\`\`
push(1)  push(2)  push(3)   pop() -> 3   peek() -> 2
                  | 3 |  <- top
         | 2 |    | 2 |     | 2 |  <- top
| 1 |    | 1 |    | 1 |     | 1 |
\`\`\`

**How it works inside.** A JavaScript array already behaves like a stack if you only use its *end*: \`arr.push(x)\` adds at the end and \`arr.pop()\` removes from the end. The toolkit \`Stack\` class is just a thin wrapper around an array called \`items\`, so the operations have clear names (\`push\`, \`pop\`, \`peek\`, \`isEmpty\`, \`size\`).

**Why every operation is O(1).** The "top" of the stack is the last index of the array. Adding or removing at the last index never moves any other element: the engine writes one slot and changes the length. Reading the top is just \`items[items.length - 1]\`, a direct index lookup.

There is one subtlety with \`push\`. An array has some spare capacity reserved behind the scenes. When that runs out, the engine allocates a bigger block (roughly double) and copies everything over, which costs O(n) for that single push. But because the capacity doubles, those copies happen so rarely that the *average* cost per push over any long sequence stays constant. Formally that is **amortized O(1)**: the occasional expensive step, spread over all the cheap ones, costs O(1) each.

**Why the "top only" rule is useful.** Many problems have a *nested* or *most recent first* structure:

* Brackets: the most recently opened bracket must be the first one closed.
* Undo: the most recent action is undone first.
* Recursion: the call stack is literally a stack; you can replace recursion with your own \`Stack\` to avoid stack-overflow errors.
* **Monotonic stack**: keep the stack sorted (e.g. decreasing). When a new value arrives, pop everything it "beats". Each element is pushed once and popped at most once, so a whole pass is O(n) even though there is a \`while\` loop inside the \`for\` loop. This solves "next greater element", "daily temperatures", "largest rectangle in histogram" and friends.

**Plain array or the class?** In interview code most people use a plain array (\`const st = []\`, \`st.push\`, \`st.pop\`, \`st[st.length - 1]\`). The class is handy when you want readable names, or when you pass the stack around and do not want someone to accidentally call \`shift()\` on it.`,
    buildSteps: [
      'Create a class with one field: `this.items = []`. The **end** of this array will be the top of the stack.',
      '`push(value)`: call `this.items.push(value)`. Adding at the end never shifts other elements, so it is amortized O(1).',
      '`pop()`: `return this.items.pop()`. Array `pop()` already returns `undefined` when empty, so no special case is needed.',
      '`peek()`: return `this.items[this.items.length - 1]` — read the top without removing it.',
      '`isEmpty()` and `size()`: compare / return `this.items.length`.',
      'Test it: push 1, 2, 3; `peek()` should be 3; `pop()` should give 3 then 2; `size()` should be 1.',
    ],
    operations: [
      { name: 'push(value)', description: 'Put a value on top.', time: 'O(1) amortized' },
      { name: 'pop()', description: 'Remove and return the top value (`undefined` when empty).', time: 'O(1)' },
      { name: 'peek()', description: 'Return the top value without removing it (`undefined` when empty).', time: 'O(1)' },
      { name: 'isEmpty()', description: 'True when there are no items.', time: 'O(1)' },
      { name: 'size()', description: 'Number of items (a method, not a property).', time: 'O(1)' },
    ],
    space: 'O(n)',
    usage: `// Valid parentheses with the toolkit Stack
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const st = new Stack();
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') st.push(ch);
    else if (st.pop() !== pairs[ch]) return false; // pop() is undefined when empty
  }
  return st.isEmpty();
}
isValid('([]{})'); // true
isValid('(]');     // false

// Monotonic stack: next greater element to the right
function nextGreater(nums) {
  const res = new Array(nums.length).fill(-1);
  const st = new Stack(); // holds indices, values decreasing from bottom to top
  for (let i = 0; i < nums.length; i++) {
    while (!st.isEmpty() && nums[st.peek()] < nums[i]) res[st.pop()] = nums[i];
    st.push(i);
  }
  return res;
}
nextGreater([2, 1, 3, 2, 5]); // [3, 3, 5, 5, -1]`,
    whenToUse: [
      'Matching / nesting: brackets, tags, decoding `3[a2[c]]`.',
      'Something must be processed in reverse order of arrival (undo, backtracking paths).',
      '"Next greater / smaller element" or "how far until a bigger value" — use a monotonic stack.',
      'Turning a deep recursion (DFS) into an iterative loop.',
      'Evaluating expressions (Reverse Polish Notation, calculators).',
    ],
    pitfalls: [
      '`size` is a **method**: write `st.size()`, not `st.size` (that is the function itself, which is truthy).',
      '`pop()` and `peek()` return `undefined` on an empty stack instead of throwing — check `isEmpty()` when `undefined` could be confused with a real value.',
      'With a plain array, never use `shift()`/`unshift()` as stack operations: they work on the front and are O(n).',
      'In a monotonic stack, store **indices** rather than values when you need distances or positions in the answer.',
      'Decide carefully between `<` and `<=` when popping — it changes how equal values are handled (a common off-by-one in histogram problems).',
    ],
    usedIn: ['Balanced parentheses', 'Monotonic stack', 'Next greater element', 'Expression evaluation', 'Iterative DFS', 'Largest rectangle in histogram', 'Undo / history'],
    relatedTopics: ['stack', 'recursion', 'trees'],
    practiceQuestions: ['valid-parentheses', 'min-stack', 'daily-temperatures', 'evaluate-reverse-polish-notation', 'decode-string', 'largest-rectangle-in-histogram'],
  },

  // ---------------------------------------------------------------- Queue
  {
    id: 'queue',
    name: 'Queue',
    file: 'Queue.js',
    exports: ['Queue'],
    category: 'Stack / Queue',
    summary: 'A line of items where you add at the back and remove from the front: first in, first out (FIFO), with O(1) dequeue.',
    explanation: `A queue is a line at a ticket counter. New people join at the **back**; the person at the **front** is served first. First in, first out, formally **FIFO**.

\`\`\`
enqueue(a) enqueue(b) enqueue(c)       dequeue() -> a
front -> [ a, b, c ] <- back           front -> [ b, c ] <- back
\`\`\`

**The JavaScript trap.** The obvious code is \`arr.push(x)\` to enqueue and \`arr.shift()\` to dequeue. \`push\` is fine, but \`shift()\` removes index 0, and then *every remaining element has to move one slot to the left* so the array stays packed from index 0. That is **O(n)** per dequeue. A BFS over a graph with 10^5 nodes that uses \`shift()\` can quietly become O(n²) — around 10^10 steps in the worst case.

**How the toolkit Queue avoids it.** It never removes from the front. It keeps a plain array \`items\` plus an integer \`head\` that points at the current front:

\`\`\`
items: [ a, b, c, d, e ]
               ^ head = 2        front() -> c,  size() = 5 - 2 = 3
\`\`\`

* \`enqueue(x)\` → \`items.push(x)\`: amortized O(1).
* \`dequeue()\` → read \`items[head]\`, then \`head++\`. Nothing moves, so O(1).
* \`size()\` → \`items.length - head\`.

**What about the memory of dequeued items?** If we only ever move \`head\` forward, the array keeps growing. So the class *compacts* occasionally: when \`head > 1024\` **and** at least half the array is dead space, it replaces \`items\` with \`items.slice(head)\` and resets \`head\` to 0. That slice costs O(n), but it only happens after at least n/2 cheap dequeues, so spread over those dequeues it is still **amortized O(1)** per operation.

**Where queues show up.** Anything that must be handled *in arrival order*, and above all **Breadth-First Search**. BFS explores a graph level by level: everything at distance 1, then distance 2, and so on. A queue guarantees that property, because nodes discovered earlier (closer) are processed before nodes discovered later (farther). That is why BFS finds shortest paths in unweighted graphs and grids.

**A lighter option for BFS.** Often you do not even need a class. Use an array and a read index, the same trick without compaction:

\`\`\`js
const q = [start];
for (let head = 0; head < q.length; head++) { const u = q[head]; /* push neighbours */ }
\`\`\`

The toolkit's own \`Graph.bfs\` does exactly this. Use \`Queue\` when you want readable names or a long-running queue (a stream, a simulation) where memory should not keep growing.`,
    buildSteps: [
      'Store two fields: `this.items = [...items]` (a copy of any initial items) and `this.head = 0`, the index of the current front.',
      '`enqueue(value)`: `this.items.push(value)`. Add an alias `push` so the class can stand in for an array in BFS code.',
      '`size()`: `this.items.length - this.head`. `isEmpty()`: `size() === 0`.',
      '`dequeue()`: if empty return `undefined`; otherwise read `this.items[this.head]` and then increment `head`. No elements move.',
      'Add compaction inside `dequeue`: if `head > 1024` and `head * 2 >= items.length`, set `items = items.slice(head)` and `head = 0`. This keeps memory bounded while staying amortized O(1).',
      '`front()`: return `this.items[this.head]`. Add a `length` getter and a `shift` alias for convenience.',
      'Test: enqueue 1..5, dequeue twice (1, 2), `front()` is 3, `size()` is 3.',
    ],
    operations: [
      { name: 'enqueue(value) / push(value)', description: 'Add a value at the back.', time: 'O(1) amortized' },
      { name: 'dequeue() / shift()', description: 'Remove and return the front value (`undefined` when empty).', time: 'O(1) amortized' },
      { name: 'front()', description: 'Look at the front value without removing it.', time: 'O(1)' },
      { name: 'isEmpty()', description: 'True when nothing is waiting.', time: 'O(1)' },
      { name: 'size() / length', description: 'Number of waiting items; `size()` is a method, `length` is a getter.', time: 'O(1)' },
    ],
    space: 'O(n)',
    usage: `// Shortest path length in an unweighted grid (0 = open, 1 = wall) with BFS
function shortestPath(grid) {
  const rows = grid.length, cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  const q = new Queue([[0, 0]]);
  dist[0][0] = 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (!q.isEmpty()) {
    const [r, c] = q.dequeue();
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1; // mark when ENQUEUING, not when dequeuing
      q.enqueue([nr, nc]);
    }
  }
  return dist[rows - 1][cols - 1];
}
shortestPath([[0, 0, 0], [1, 1, 0], [0, 0, 0]]); // 4

const q = new Queue([1, 2, 3]);
q.enqueue(4);
q.dequeue(); // 1
q.front();   // 2
q.size();    // 3
q.length;    // 3`,
    whenToUse: [
      'Breadth-First Search on graphs, grids and trees (level-order traversal).',
      'Shortest path in an unweighted graph.',
      'Processing events or requests in arrival order (sliding time windows, "recent calls").',
      'Simulations where items take turns (round robin, ticket lines).',
      'Kahn\'s topological sort (queue of nodes with in-degree 0).',
    ],
    pitfalls: [
      'Using `array.shift()` as dequeue is O(n) per call — the classic hidden O(n²) in JavaScript BFS.',
      'In BFS, mark a node visited **when you enqueue it**, not when you dequeue it; otherwise the same node can be enqueued many times.',
      '`dequeue()` returns `undefined` when empty rather than throwing.',
      'The constructor copies its argument: `new Queue(arr)` does not alias `arr`.',
      'For level-by-level processing, record `const levelSize = q.size()` before the inner loop — the size changes as you enqueue children.',
    ],
    usedIn: ['BFS', 'Level-order traversal', 'Multi-source BFS', "Kahn's topological sort", 'Shortest path in unweighted graphs', 'Round-robin simulation'],
    relatedTopics: ['queue-deque', 'graphs', 'trees', 'topological-sort', 'shortest-path'],
    practiceQuestions: ['number-of-recent-calls', 'time-needed-to-buy-tickets', 'binary-tree-level-order-traversal', 'rotting-oranges', 'course-schedule', 'word-ladder'],
  },

  // ---------------------------------------------------------------- Deque
  {
    id: 'deque',
    name: 'Deque',
    file: 'Deque.js',
    exports: ['Deque'],
    category: 'Stack / Queue',
    summary: 'A double-ended queue: add and remove at both the front and the back in O(1), built on a circular buffer.',
    explanation: `A **deque** (say "deck", short for *double-ended queue*) is a line where you can join or leave at **either end**. It is a stack and a queue at the same time.

JavaScript arrays are fast at the back (\`push\`/\`pop\`) but slow at the front: \`unshift\` and \`shift\` move every element, O(n). A deque fixes the front.

**How it works inside: a circular buffer.** The toolkit \`Deque\` keeps a fixed-size array \`buf\`, an index \`head\` for the front element, and a \`count\`. The elements live in the slots \`head, head+1, …, head+count-1\`, **wrapping around** the end of the array with \`% buf.length\`:

\`\`\`
capacity 8, head = 6, count = 4          logical order: [ A, B, C, D ]
index:  0   1   2   3   4   5   6   7
buf:  [ C , D , _ , _ , _ , _ , A , B ]
                                ^ head (front)
back = (head + count - 1) % 8 = 1  -> D
\`\`\`

Picture the array bent into a ring. The front can move left or right around the ring without shifting anything.

* \`pushBack(x)\`: write at \`(head + count) % cap\`, then \`count++\`. O(1).
* \`pushFront(x)\`: move \`head\` one step left, \`(head - 1 + cap) % cap\` (the \`+ cap\` avoids JavaScript's negative \`%\`), write there, \`count++\`. O(1).
* \`popFront()\`: read \`buf[head]\`, clear the slot, move \`head\` one step right. O(1).
* \`popBack()\`: read the slot at \`(head + count - 1) % cap\`, clear it, \`count--\`. O(1).
* \`get(i)\`: the i-th element from the front is \`buf[(head + i) % cap]\`. O(1) random access, which a linked-list deque cannot do.

**Growing.** When \`count === capacity\`, the buffer doubles: a new array twice the size is filled with the elements *in logical order* starting at index 0, and \`head\` resets to 0. That copy is O(n), but it happens only after n pushes since the last one, so pushes are **amortized O(1)**, the same reasoning as a JavaScript array's \`push\`.

**Why deques matter in DSA: the monotonic deque.** For "maximum of every window of size k", keep a deque of *indices* whose values are **decreasing** from front to back:

1. Before adding index \`i\`, pop from the **back** while the back's value is ≤ \`nums[i]\` (those can never be a maximum again).
2. Push \`i\` at the back.
3. Pop from the **front** if that index has slid out of the window.
4. The front is the window maximum.

Every index is pushed once and popped at most once, so the whole scan is O(n) instead of O(n·k). The same idea powers "shortest subarray with sum at least K", "jump game VI" and DP optimizations.

**0-1 BFS.** In a graph whose edges weigh only 0 or 1, push a neighbour reached by a 0-edge to the **front** and by a 1-edge to the **back**. The deque stays sorted by distance, giving shortest paths in O(V + E) without a heap.`,
    buildSteps: [
      'Fields: `this.buf = new Array(capacity)` (default 16), `this.head = 0` (front index), `this.count = 0`.',
      'Write a private `#grow()` that makes an array twice as big and copies element `i` from `buf[(head + i) % buf.length]` into slot `i`, then sets `head = 0`.',
      '`pushBack(x)`: grow if full; write to `buf[(head + count) % buf.length]`; `count++`.',
      '`pushFront(x)`: grow if full; `head = (head - 1 + buf.length) % buf.length`; write to `buf[head]`; `count++`. The `+ buf.length` keeps the index non-negative.',
      '`popFront()`: return `undefined` if empty; read `buf[head]`, set the slot to `undefined` (so it can be garbage-collected), `head = (head + 1) % buf.length`, `count--`.',
      '`popBack()`: compute `idx = (head + count - 1) % buf.length`, read, clear, `count--`.',
      'Add `front()`, `back()`, `get(i)` (bounds-checked), `isEmpty()`, `size()`, `toArray()`.',
      'Test the wrap-around: with capacity 4, pushFront twice and pushBack three times (forcing a grow), then check `toArray()` is in the right order.',
    ],
    operations: [
      { name: 'pushBack(value)', description: 'Add at the back.', time: 'O(1) amortized' },
      { name: 'pushFront(value)', description: 'Add at the front.', time: 'O(1) amortized' },
      { name: 'popFront()', description: 'Remove and return the front (`undefined` when empty).', time: 'O(1)' },
      { name: 'popBack()', description: 'Remove and return the back (`undefined` when empty).', time: 'O(1)' },
      { name: 'front() / back()', description: 'Peek at either end.', time: 'O(1)' },
      { name: 'get(i)', description: 'The i-th element counting from the front (`undefined` if out of range).', time: 'O(1)' },
      { name: 'isEmpty() / size()', description: 'Emptiness check and element count (both methods).', time: 'O(1)' },
      { name: 'toArray()', description: 'Copy of the contents, front to back.', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// Sliding window maximum with a monotonic deque of indices
function maxSlidingWindow(nums, k) {
  const dq = new Deque();
  const out = [];
  for (let i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack(); // drop smaller values
    dq.pushBack(i);
    if (dq.front() <= i - k) dq.popFront();                            // left the window
    if (i >= k - 1) out.push(nums[dq.front()]);
  }
  return out;
}
maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3); // [3, 3, 5, 5, 6, 7]

const d = new Deque();
d.pushBack(2);
d.pushBack(3);
d.pushFront(1);
d.toArray();  // [1, 2, 3]
d.get(1);     // 2
d.popBack();  // 3
d.popFront(); // 1
d.size();     // 1`,
    whenToUse: [
      'You need fast insert/remove at **both** ends.',
      'Sliding window maximum/minimum (monotonic deque).',
      '0-1 BFS: shortest paths when edge weights are only 0 or 1.',
      'Palindrome checks or simulations that take from either end.',
      'A queue that also needs O(1) indexing (`get(i)`).',
    ],
    pitfalls: [
      'Method names are `pushBack`/`pushFront`/`popBack`/`popFront` — not `push`/`shift` like an array.',
      '`size()` is a method; the internal field is `count`.',
      'JavaScript `%` keeps the sign of the left side: `-1 % 8 === -1`. That is why `pushFront` adds `buf.length` before taking `%`.',
      'In a monotonic deque store **indices**, not values, so you can tell when the front has left the window.',
      'Using `arr.unshift()` / `arr.shift()` as a "deque" is O(n) per call.',
    ],
    usedIn: ['Monotonic queue', 'Sliding window maximum', '0-1 BFS', 'DP window optimization', 'Palindrome checking'],
    relatedTopics: ['queue-deque', 'sliding-window', 'shortest-path', 'dp-1d'],
    practiceQuestions: ['sliding-window-maximum', 'design-circular-deque', 'jump-game-vi', 'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit', 'shortest-subarray-with-sum-at-least-k', 'minimum-obstacle-removal-to-reach-corner'],
  },

  // ---------------------------------------------------------------- Min Heap
  {
    id: 'min-heap',
    name: 'Min Heap',
    file: 'Heap.js',
    exports: ['MinHeap', 'PriorityQueue'],
    category: 'Heap',
    summary: 'A binary heap that always keeps the smallest value on top: O(1) to look at the minimum, O(log n) to add or remove.',
    explanation: `Imagine a hospital waiting room where the *most urgent* patient is always called next, no matter when they arrived. You do not need the whole room sorted; you only need to know who is **next**. A **min heap** is a structure built for exactly that: it always knows its smallest element.

**The shape: a complete binary tree stored in an array.** A heap is a binary tree where every level is full except possibly the last, which fills left to right. Because there are no gaps, it fits perfectly in an array with no pointers at all:

\`\`\`
            1                 index:  0  1  2  3  4  5
          /   \\               array: [1, 3, 2, 7, 4, 5]
         3     2
        / \\   /               node i:   parent = (i - 1) >> 1
       7   4 5                          children = 2i + 1, 2i + 2
\`\`\`

**The rule (heap property).** Every parent is ≤ its children. That is *all* it promises. Siblings are in no particular order and the array is **not sorted** (\`[1, 3, 2, 7, 4, 5]\` above). But the rule forces the minimum to the root, index 0.

**Why the tree is short.** A complete binary tree with n nodes has height ⌊log₂ n⌋. A million elements means only about 20 levels. Every heap operation walks one root-to-leaf path, so it costs **O(log n)**.

**push(x): sift up.** Put \`x\` at the end of the array (the next free leaf, which keeps the shape complete). It might be smaller than its parent, breaking the rule, so swap it with its parent while it is smaller. It "bubbles up" at most one level per swap: at most log n swaps.

\`\`\`
push(0):  [1,3,2,7,4,5,0]  -> 0 < parent 2, swap -> [1,3,0,7,4,5,2]
                           -> 0 < parent 1, swap -> [0,3,1,7,4,5,2]   done
\`\`\`

**pop(): sift down.** The answer is \`heap[0]\`. To remove it without leaving a hole, move the **last** element into the root (shape stays complete), then repeatedly swap it with its **smaller** child while that child is smaller. Swapping with the smaller child is what keeps the rule true for the other child too. Again at most log n levels.

**peek()** just reads \`heap[0]\`: O(1).

**Why not just sort?** Sorting costs O(n log n) once, but if values keep arriving you would re-sort (or insert into a sorted array, which is O(n) per insert). A heap handles a *stream* of inserts and remove-mins at O(log n) each.

**The toolkit API.** \`Heap.js\` has one general class, \`PriorityQueue(compare)\`, and \`MinHeap\` is a subclass. By default \`new MinHeap()\` orders numbers. To order objects or tuples, pass a **key function** that returns a number: \`new MinHeap(x => x.dist)\` or \`new MinHeap(([d]) => d)\`. Internally it becomes the comparator \`(a, b) => key(a) - key(b)\`.

**The Top-K trick.** To find the k **largest** elements, keep a **min** heap of size k. Push each number; if the size goes past k, pop (throwing away the smallest). The heap always holds the k largest seen so far, and its top is the k-th largest. Cost: O(n log k) time and O(k) memory, better than sorting when k is small.

**Dijkstra.** The heap holds \`[distance, node]\` pairs and pops the closest unfinished node each time. There is no "decrease key" method, so the standard JavaScript trick is **lazy deletion**: push a new, better pair and, when an outdated pair is popped, skip it if its distance is larger than the best known one.`,
    buildSteps: [
      'Store the heap in an array `this.heap = []`. Write down the index formulas: `parent = (i - 1) >> 1`, `left = 2i + 1`, `right = 2i + 2`.',
      'Accept a comparator `compare(a, b)` where a negative result means `a` should come out first. For a min heap of numbers it is `(a, b) => a - b`.',
      '`peek()`: return `this.heap[0]`. `size()` / `isEmpty()`: use `heap.length`.',
      '`#siftUp(i)`: while `i > 0` and `compare(heap[i], heap[parent]) < 0`, swap them and move `i` to the parent.',
      '`push(x)`: `heap.push(x)` then `#siftUp(heap.length - 1)`.',
      '`#siftDown(i)`: find `best` among `i`, left and right (checking each child exists, `< n`); if `best === i` stop, else swap and continue from `best`.',
      '`pop()`: if empty return `undefined`. Save `heap[0]`, `const last = heap.pop()`; if anything remains, put `last` at index 0 and `#siftDown(0)`. Return the saved top. (Handling the single-element case this way avoids putting the element back.)',
      'Make `MinHeap` a subclass that takes a key function: `super((a, b) => key(a) - key(b))`.',
      'Test: push `[5, 1, 8, 3, 2]`, then pop five times — you should get `1, 2, 3, 5, 8`.',
    ],
    operations: [
      { name: 'new MinHeap(key?)', description: 'Empty heap. `key` maps an item to the number it is ordered by (default: the item itself).', time: 'O(1)' },
      { name: 'push(x)', description: 'Insert, then sift up.', time: 'O(log n)' },
      { name: 'pop()', description: 'Remove and return the smallest item (`undefined` when empty).', time: 'O(log n)' },
      { name: 'peek()', description: 'Smallest item without removing it.', time: 'O(1)' },
      { name: 'size() / isEmpty()', description: 'Element count / emptiness check (methods).', time: 'O(1)' },
      { name: 'toArray()', description: 'Copy of the internal array — heap order, **not** sorted.', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// k-th largest element: keep a MIN heap of the k largest seen so far
function findKthLargest(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop(); // discard the smallest
  }
  return heap.peek();
}
findKthLargest([3, 2, 1, 5, 6, 4], 2); // 5

// Dijkstra with [dist, node] pairs and lazy deletion
function dijkstra(n, edges, src) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const pq = new MinHeap(([d]) => d);   // order pairs by distance
  pq.push([0, src]);
  while (!pq.isEmpty()) {
    const [d, u] = pq.pop();
    if (d > dist[u]) continue;          // stale entry, skip it
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        pq.push([dist[v], v]);
      }
    }
  }
  return dist;
}
dijkstra(3, [[0, 1, 4], [0, 2, 1], [2, 1, 2]], 0); // [0, 3, 1]`,
    whenToUse: [
      'You repeatedly need the **smallest** item while items keep being added.',
      'Top-K largest / k-th largest (min heap of size k).',
      'Dijkstra and Prim: always expand the cheapest frontier item.',
      'Merging k sorted lists: the heap holds the current head of each list.',
      'Scheduling: meeting rooms (min heap of end times), task simulations.',
    ],
    pitfalls: [
      'The key function must return a **number** — it is used as `key(a) - key(b)`. For strings or tie-breaks use `new PriorityQueue(compare)` instead.',
      '`toArray()` and the internal `heap` are **not sorted**; only index 0 is guaranteed to be the minimum.',
      'There is no "decrease key" and no "remove arbitrary item": push a new entry and skip stale ones when popped (lazy deletion).',
      'Pushing n items one by one costs O(n log n); there is no heapify-from-array constructor.',
      'Heaps are not stable: items with equal keys come out in no guaranteed order. Add a tie-breaker (e.g. an insertion counter) if order matters.',
      'JavaScript has **no built-in priority queue**. Sorting an array after every insert is O(n log n) per insert — a very common slow solution.',
    ],
    usedIn: ['Top K problems', 'K-th largest element', 'Dijkstra', "Prim's MST", 'K-way merge', 'Meeting rooms / interval scheduling', 'Heap sort'],
    relatedTopics: ['heaps', 'shortest-path', 'mst', 'greedy', 'intervals'],
    practiceQuestions: ['kth-largest-element-in-an-array', 'kth-largest-element-in-a-stream', 'merge-k-sorted-lists', 'meeting-rooms-ii', 'network-delay-time', 'min-cost-to-connect-all-points'],
  },

  // ---------------------------------------------------------------- Max Heap
  {
    id: 'max-heap',
    name: 'Max Heap',
    file: 'Heap.js',
    exports: ['MaxHeap', 'PriorityQueue'],
    category: 'Heap',
    summary: 'The mirror image of a min heap: the largest value is always on top, O(1) peek and O(log n) push/pop.',
    explanation: `A max heap is a min heap turned upside down: **every parent is ≥ its children**, so the **largest** element sits at the root, index 0.

\`\`\`
            9                 array: [9, 7, 8, 3, 5, 2]
          /   \\
         7     8              parent >= children everywhere,
        / \\   /               but 7 and 8 (siblings) are in no particular order
       3   5 2
\`\`\`

Everything else is identical to the min heap: the same complete-tree-in-an-array layout (\`parent = (i - 1) >> 1\`, children \`2i + 1\` and \`2i + 2\`), the same sift-up after \`push\` and sift-down after \`pop\`, and the same reasons for the costs:

* The tree is complete, so its height is about log₂ n.
* \`push\` walks up one path at most: **O(log n)**.
* \`pop\` moves the last element to the root and walks down one path, always swapping with the **larger** child: **O(log n)**.
* \`peek\` reads index 0: **O(1)**.

**How the toolkit builds it.** \`MaxHeap\` is a subclass of \`PriorityQueue\` whose comparator is simply reversed:

\`\`\`js
super((a, b) => key(b) - key(a));   // bigger key => "comes out first"
\`\`\`

So there is only one sift-up and one sift-down in the whole file; the direction is decided entirely by the comparator. This is the same trick you would use in any language: a max heap is a min heap on negated keys. (In languages with only a min heap people literally push \`-x\`; in JavaScript we flip the comparator instead, which also works for objects.)

**When do you want the maximum?**

* **"Always take the biggest"** greedy simulations: smash the two heaviest stones, take gifts from the richest pile, pick the most frequent task next.
* **Top-K *smallest*** / **k closest points**: keep a **max** heap of size k. When it grows past k, pop the largest; what remains are the k smallest. The top is the worst of the good ones, which is exactly the one to evict. (Notice the flip: for k *largest* you use a *min* heap, for k *smallest* a *max* heap.)
* **Two heaps (running median)**: a max heap holds the smaller half of the numbers, a min heap the larger half. The two tops are the middle values.
* **IPO / capital problems**: among the projects you can currently afford, always pick the one with the biggest profit.

**Reading the key function.** \`new MaxHeap(p => p.profit)\` orders objects by profit, largest first. \`new MaxHeap(([x, y]) => x * x + y * y)\` orders points by squared distance from the origin, farthest first; there is no need for \`Math.sqrt\`, because squaring preserves order for non-negative numbers.`,
    buildSteps: [
      'Build the general `PriorityQueue(compare)` first (see the Min Heap build steps): array storage, `#siftUp`, `#siftDown`, `push`, `pop`, `peek`.',
      'Remember the convention: `compare(a, b) < 0` means `a` leaves the heap first.',
      'For a max heap, flip the comparison: `compare = (a, b) => b - a`.',
      'Wrap it in a subclass that accepts a key function: `class MaxHeap extends PriorityQueue { constructor(key = x => x) { super((a, b) => key(b) - key(a)); } }`.',
      'Test: push `[5, 1, 8, 3, 2]` and pop five times — you should get `8, 5, 3, 2, 1`.',
    ],
    operations: [
      { name: 'new MaxHeap(key?)', description: 'Empty heap ordered by `key(item)` (a number), largest first.', time: 'O(1)' },
      { name: 'push(x)', description: 'Insert, then sift up.', time: 'O(log n)' },
      { name: 'pop()', description: 'Remove and return the largest item (`undefined` when empty).', time: 'O(log n)' },
      { name: 'peek()', description: 'Largest item without removing it.', time: 'O(1)' },
      { name: 'size() / isEmpty()', description: 'Element count / emptiness check (methods).', time: 'O(1)' },
      { name: 'toArray()', description: 'Copy of the internal array (heap order, not sorted).', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// Last stone weight: always smash the two heaviest stones
function lastStoneWeight(stones) {
  const heap = new MaxHeap();
  for (const s of stones) heap.push(s);
  while (heap.size() > 1) {
    const a = heap.pop();
    const b = heap.pop();
    if (a !== b) heap.push(a - b);
  }
  return heap.isEmpty() ? 0 : heap.peek();
}
lastStoneWeight([2, 7, 4, 1, 8, 1]); // 1

// k closest points: MAX heap of size k keyed by squared distance
function kClosest(points, k) {
  const heap = new MaxHeap(([x, y]) => x * x + y * y);
  for (const p of points) {
    heap.push(p);
    if (heap.size() > k) heap.pop(); // evict the farthest
  }
  return heap.toArray();             // any order is fine here
}
kClosest([[1, 3], [-2, 2], [5, 8], [0, 1]], 2); // [[-2, 2], [0, 1]] (in some order)`,
    whenToUse: [
      'You repeatedly need the **largest** item while the collection changes.',
      'Greedy "take the biggest each time" simulations.',
      'Top-K **smallest** or k closest (max heap of size k, evict the top).',
      'The lower half in the two-heaps running median.',
      'Scheduling by highest priority / most frequent first.',
    ],
    pitfalls: [
      'Picking the wrong heap for Top-K: k **largest** → min heap of size k; k **smallest** → max heap of size k.',
      'The key must be numeric (it is subtracted). For strings use `new PriorityQueue((a, b) => b.localeCompare(a))`.',
      'Returning a boolean from a custom comparator (`(a, b) => a > b`) breaks ordering — always return negative / zero / positive.',
      'Very large numeric keys: `key(b) - key(a)` can lose precision beyond `Number.MAX_SAFE_INTEGER`; compare with `<`/`>` in a custom `PriorityQueue` comparator if keys can be that big.',
      '`toArray()` is not sorted; pop repeatedly if you need sorted output.',
    ],
    usedIn: ['Top K smallest', 'K closest points', 'Two heaps (running median)', 'Greedy scheduling', 'Task scheduler', 'Reorganize string'],
    relatedTopics: ['heaps', 'greedy'],
    practiceQuestions: ['last-stone-weight', 'take-gifts-from-the-richest-pile', 'k-closest-points-to-origin', 'reorganize-string', 'task-scheduler', 'ipo'],
  },

  // ---------------------------------------------------------------- Priority Queue
  {
    id: 'priority-queue',
    name: 'Priority Queue',
    file: 'Heap.js',
    exports: ['PriorityQueue', 'MinHeap', 'MaxHeap'],
    category: 'Heap',
    summary: 'A binary heap driven by your own comparator, so you can order tuples, objects, strings and tie-breaks any way you like.',
    explanation: `A **priority queue** is a *promise*: "whatever you put in, I will always hand you back the highest-priority item next." A **heap** is the usual *way* to keep that promise efficiently. In \`Heap.js\`, \`PriorityQueue\` is the real implementation, and \`MinHeap\`/\`MaxHeap\` are small subclasses that just supply a comparator.

**The comparator contract.** You pass \`compare(a, b)\`, the same kind of function you give to \`Array.prototype.sort\`:

* **negative** → \`a\` has higher priority (comes out first),
* **positive** → \`b\` comes out first,
* **0** → equal priority (either may come first).

\`\`\`js
new PriorityQueue((a, b) => a - b)          // smallest number first (the default)
new PriorityQueue((a, b) => b - a)          // largest number first
new PriorityQueue((a, b) => a[0] - b[0] || a[1] - b[1])   // by [0], ties by [1]
new PriorityQueue((a, b) => a.name.localeCompare(b.name)) // strings A→Z
\`\`\`

The \`||\` trick for tie-breaks works because \`0\` is falsy: if the first difference is 0, JavaScript evaluates the second.

**How it works inside.** The data lives in the array \`heap\`, arranged as a complete binary tree where each parent has priority at least as high as its children:

\`\`\`
index:    0     1     2     3
heap: [ [1,'b'], [3,'a'], [2,'c'], [5,'d'] ]      compare = by [0]

           [1,'b']
           /     \\
       [3,'a']  [2,'c']
         /
      [5,'d']
\`\`\`

* \`push(x)\`: append, then **sift up**: while \`compare(x, parent) < 0\`, swap upward. Height is ⌊log₂ n⌋, so **O(log n)** comparator calls.
* \`pop()\`: take index 0, move the last item to the root, then **sift down**: swap with whichever child wins \`compare\`, until neither child wins. **O(log n)**.
* \`peek()\`: index 0, **O(1)**.

Note that sift-up stops on \`compare(child, parent) >= 0\`, so equal items are never swapped past each other upward, but sift-down can reorder them. That means the heap is **not stable**: equal-priority items do not necessarily come out in insertion order. If order matters (e.g. "earliest submitted first among equals"), include a sequence number in the item and break ties with it.

**When to use the raw \`PriorityQueue\` instead of MinHeap/MaxHeap:**

* Multi-key ordering: \`[time, index]\` pairs, "most frequent, then alphabetical".
* Non-numeric priorities (strings).
* Priorities that could overflow safe subtraction (compare with \`<\`/\`>\` and return -1/1).

**Common patterns built on it.**

* **K-way merge**: push the head of each sorted list as \`[value, listIndex, position]\`; pop the smallest, push the next element from the same list. O(N log k) for N total elements.
* **Two heaps**: a max heap for the lower half and a min heap for the upper half give the running median in O(log n) per insert.
* **Event simulation**: order events by time, with a tie-break on type.
* **Best-first search / Dijkstra variants** such as "path with minimum effort", where the priority is the worst edge so far.`,
    buildSteps: [
      'Decide the contract: `compare(a, b) < 0` means `a` comes out first. Default it to `(a, b) => a - b`.',
      'Store items in `this.heap = []`; use `parent = (i - 1) >> 1`, `left = 2i + 1`, `right = left + 1`.',
      '`#siftUp(i)`: loop while `i > 0`; stop if `compare(heap[i], heap[parent]) >= 0`; otherwise swap with a destructuring swap and move up.',
      '`#siftDown(i)`: pick `best` among `i`, `left`, `right` using `compare(child, heap[best]) < 0` (check bounds first); stop when `best === i`.',
      '`push(value)`: append and sift up. `pop()`: save the root, pop the last element, put it at the root if the heap is not empty, sift down, return the saved root.',
      'Add `peek()`, `size()`, `isEmpty()`, and `toArray()` (a copy, so callers cannot corrupt the heap).',
      'Derive `MinHeap` and `MaxHeap` as subclasses that pass `key(a) - key(b)` and `key(b) - key(a)`.',
      'Test with tuples: push `[2,"b"], [1,"z"], [2,"a"]` using `(a, b) => a[0] - b[0] || a[1].localeCompare(b[1])` and expect `[1,"z"], [2,"a"], [2,"b"]`.',
    ],
    operations: [
      { name: 'new PriorityQueue(compare?)', description: 'Empty queue; `compare(a, b) < 0` means `a` comes out first. Default `(a, b) => a - b`.', time: 'O(1)' },
      { name: 'push(value)', description: 'Insert and sift up.', time: 'O(log n)' },
      { name: 'pop()', description: 'Remove and return the highest-priority item (`undefined` when empty).', time: 'O(log n)' },
      { name: 'peek()', description: 'Highest-priority item without removing it.', time: 'O(1)' },
      { name: 'size() / isEmpty()', description: 'Element count / emptiness check.', time: 'O(1)' },
      { name: 'toArray()', description: 'Copy of the internal heap array (not sorted).', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// Top k frequent words: most frequent first, ties alphabetical
function topKFrequentWords(words, k) {
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  const pq = new PriorityQueue((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const entry of freq) pq.push(entry);       // entry = [word, count]
  const out = [];
  while (out.length < k && !pq.isEmpty()) out.push(pq.pop()[0]);
  return out;
}
topKFrequentWords(['i', 'love', 'code', 'i', 'love', 'js'], 2); // ['i', 'love']

// K-way merge of sorted arrays: items are [value, listIndex, position]
function mergeSortedArrays(lists) {
  const pq = new PriorityQueue((a, b) => a[0] - b[0]);
  lists.forEach((list, i) => { if (list.length) pq.push([list[0], i, 0]); });
  const out = [];
  while (!pq.isEmpty()) {
    const [val, i, j] = pq.pop();
    out.push(val);
    if (j + 1 < lists[i].length) pq.push([lists[i][j + 1], i, j + 1]);
  }
  return out;
}
mergeSortedArrays([[1, 4, 7], [2, 5], [0, 9]]); // [0, 1, 2, 4, 5, 7, 9]`,
    whenToUse: [
      'The priority is more than one number: tuples, tie-breaks, strings.',
      'K-way merge of sorted lists/arrays/streams.',
      'Two-heaps running median.',
      'Event-driven simulations ordered by time.',
      'Best-first searches: Dijkstra variants, A*, minimum-effort paths.',
    ],
    pitfalls: [
      'The comparator must return a **number**, never a boolean: `(a, b) => a < b` silently breaks the heap.',
      'Heaps are **not stable** — add an insertion counter as a final tie-break if equal items must keep arrival order.',
      'Do not mutate an item\'s priority field after pushing it; the heap will not notice. Push a new entry instead (lazy deletion).',
      '`peek()`/`pop()` on an empty queue return `undefined`; destructuring that (`const [d, u] = pq.pop()`) throws a TypeError.',
      'Iterating a `Map` gives `[key, value]` arrays — convenient to push directly, as in the example.',
    ],
    usedIn: ['K-way merge', 'Two heaps (running median)', 'Top K with tie-breaks', 'Dijkstra', 'A* search', 'Event simulation', 'Huffman coding'],
    relatedTopics: ['heaps', 'shortest-path', 'greedy', 'sorting'],
    practiceQuestions: ['top-k-frequent-elements', 'find-median-from-data-stream', 'find-k-pairs-with-smallest-sums', 'smallest-range-covering-elements-from-k-lists', 'sliding-window-median', 'path-with-minimum-effort'],
  },

  // ---------------------------------------------------------------- Linked List
  {
    id: 'linked-list',
    name: 'Singly Linked List',
    file: 'LinkedList.js',
    exports: ['ListNode', 'LinkedList', 'arrayToList', 'listToArray'],
    category: 'Linked List',
    summary: 'A chain of nodes where each node points to the next one: O(1) insert at a known spot, O(n) to reach the k-th element.',
    explanation: `Picture a treasure hunt: each clue tells you where the **next** clue is. You cannot jump to clue number 7; you must follow clues 1 → 2 → … → 7. That is a **linked list**: a chain of **nodes**, each holding a value and a pointer (\`next\`) to the following node. The last node points to \`null\`.

\`\`\`
head
 |
 v
[1 | •]--->[2 | •]--->[3 | •]--->null
 val next
\`\`\`

**Array vs linked list.** An array keeps elements side by side in memory, so \`arr[k]\` is instant (O(1)) but inserting at the front shifts everything (O(n)). A linked list is the opposite trade:

| | array | linked list |
|---|---|---|
| read k-th element | O(1) | O(k): walk from \`head\` |
| insert/delete at front | O(n) | O(1) |
| insert/delete after a node you hold | O(n) | O(1): just rewire pointers |

**Why insert is O(1).** To insert \`x\` after node \`p\`, you do not move anything; you change two pointers: \`x.next = p.next; p.next = x\`. The cost does not depend on the list length. Finding \`p\` in the first place, though, is O(n) if you have to search for it.

**What the toolkit gives you.**

* \`ListNode(val, next)\`: the exact node shape LeetCode uses (\`val\`, \`next\`). Practice problems hand you a \`head\` made of these.
* \`arrayToList([1,2,3])\` builds a chain and returns its head; \`listToArray(head)\` turns it back into an array (it stops after 100,000 nodes so an accidental cycle cannot freeze the page). Great for testing.
* \`LinkedList\`: a small class with \`head\`, \`tail\` and \`length\`. Keeping a **tail pointer** makes \`append\` O(1) instead of walking to the end. It also has \`prepend\`, \`removeFirst\`, \`find\`, \`reverse\` and \`toArray\`.

**The dummy (sentinel) node trick.** \`arrayToList\` starts with \`const dummy = new ListNode()\` and builds after it, returning \`dummy.next\`. Because there is always a node *before* the real head, you never need a special case for "the list is empty" or "I'm changing the head". Use this in merge, remove-nth, partition and similar problems.

**In-place reversal** (\`reverse()\` in the class) is the most important linked-list move. Walk with three pointers:

\`\`\`
prev   cur    next
null   [1] -> [2] -> [3] -> null
step:  save next = cur.next; cur.next = prev; prev = cur; cur = next
end:   null <- [1] <- [2] <- [3]      prev is the new head
\`\`\`

Each node is visited once: O(n) time, O(1) extra space.

**Fast & slow pointers.** Move \`slow\` one step and \`fast\` two steps. When \`fast\` reaches the end, \`slow\` is in the middle. If there is a cycle, \`fast\` eventually laps \`slow\` and they meet (Floyd's algorithm). Both are O(n) time and O(1) space, which is why interviewers love them.

**Why removing the *last* node is O(n) here.** In a *singly* linked list, you need the node **before** the tail to cut it off, and the only way to find it is to walk from the head. That is why the class has \`removeFirst\` but no \`removeLast\`, and why caches use a **doubly** linked list instead.`,
    buildSteps: [
      'Define `ListNode` with `val` and `next` (default `null`).',
      'Write `arrayToList(arr)` with a dummy node: keep a `tail` pointer, attach a new node for each value, return `dummy.next`.',
      'Write `listToArray(head)`: walk `head = head.next`, pushing `val`s. Add a step limit to survive cycles.',
      'Create `LinkedList` with `head = tail = null` and `length = 0`.',
      '`append(val)`: if empty, `head = tail = node`; else `tail.next = node; tail = node`. O(1) thanks to the tail pointer.',
      '`prepend(val)`: `head = new ListNode(val, head)`; if `tail` was null, set it to `head` too.',
      '`removeFirst()`: save `head.val`, move `head = head.next`; if the list became empty also reset `tail = null`.',
      '`find(val)`: walk until `cur.val === val` or `cur` is null.',
      '`reverse()`: set `tail = head` first, then the three-pointer loop (`next = cur.next; cur.next = prev; prev = cur; cur = next`), finally `head = prev`.',
    ],
    operations: [
      { name: 'append(val)', description: 'Add at the end (uses the tail pointer). Returns the list for chaining.', time: 'O(1)' },
      { name: 'prepend(val)', description: 'Add at the front. Returns the list.', time: 'O(1)' },
      { name: 'removeFirst()', description: 'Remove the head and return its value (`undefined` when empty).', time: 'O(1)' },
      { name: 'find(val)', description: 'First node whose `val === val`, or `null`.', time: 'O(n)' },
      { name: 'reverse()', description: 'Reverse the list in place; returns the list.', time: 'O(n)' },
      { name: 'toArray()', description: 'Values as an array.', time: 'O(n)' },
      { name: 'arrayToList(arr) / listToArray(head)', description: 'Convert between arrays and raw `ListNode` chains.', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// Raw ListNode chains, the way LeetCode hands them to you
function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}
listToArray(reverseList(arrayToList([1, 2, 3, 4]))); // [4, 3, 2, 1]

// Middle node with fast & slow pointers
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}
middleNode(arrayToList([1, 2, 3, 4, 5])).val; // 3

// The LinkedList class
const list = new LinkedList([2, 3]);
list.prepend(1).append(4);
list.toArray();        // [1, 2, 3, 4]
list.removeFirst();    // 1
list.reverse().toArray(); // [4, 3, 2]
list.length;           // 3
list.find(3).val;      // 3`,
    whenToUse: [
      'The problem gives you a `head` node (most linked-list questions).',
      'Frequent insert/delete at the front, or next to a node you already hold.',
      'Building a chain whose final length you do not know, while never needing random access.',
      'As the building block of LRU caches (doubly linked), hash-table chaining and adjacency lists.',
    ],
    pitfalls: [
      '`length` is a **property** on `LinkedList` (not a method), unlike `size()` on Stack/Queue.',
      'Always save `cur.next` **before** you overwrite it, or you lose the rest of the list.',
      'Check `fast && fast.next` in fast/slow loops — reading `.next` of `null` throws a TypeError.',
      'Use a dummy node whenever the head itself might change (merging, removing the first node).',
      '`find` compares with `===`, so it will not find an object with the same content but a different identity.',
      'Comparing nodes (`a === b`) compares identity, which is what you want for intersection/cycle problems; comparing `a.val === b.val` is different.',
    ],
    usedIn: ['In-place reversal', 'Fast & slow pointers', "Floyd's cycle detection", 'Dummy head node', 'Merge two sorted lists', 'Hash table chaining'],
    relatedTopics: ['linked-list', 'two-pointers', 'recursion'],
    practiceQuestions: ['reverse-linked-list', 'merge-two-sorted-lists', 'linked-list-cycle', 'middle-of-the-linked-list', 'remove-nth-node-from-end-of-list', 'add-two-numbers'],
  },

  // ---------------------------------------------------------------- Doubly Linked List
  {
    id: 'doubly-linked-list',
    name: 'Doubly Linked List',
    file: 'DoublyLinkedList.js',
    exports: ['DLLNode', 'DoublyLinkedList'],
    category: 'Linked List',
    summary: 'A linked list where each node knows both neighbours, with sentinel head/tail nodes, so any node you hold can be removed or moved in O(1).',
    explanation: `A **doubly linked list** is a linked list where each node has two pointers: \`next\` **and** \`prev\`. Think of a train where every carriage is coupled to both the one in front and the one behind: you can unhook any carriage and re-couple its neighbours without walking the whole train.

\`\`\`
  sentinel                                           sentinel
 [ head ] <-> [k1: v1] <-> [k2: v2] <-> [k3: v3] <-> [ tail ]
   ^ never holds data                            never holds data ^
\`\`\`

**Why the extra pointer matters.** In a singly linked list, removing a node needs the node *before* it, which means walking from the head: O(n). With \`prev\`, the node itself knows its neighbour, so removal is just:

\`\`\`js
node.prev.next = node.next;
node.next.prev = node.prev;
\`\`\`

Two pointer changes, **O(1)**, no matter how long the list is, *as long as you already have a reference to the node*.

**Why the sentinels.** The toolkit list is created with two dummy nodes, \`head\` and \`tail\`, that are always there and never hold data. Every real node therefore always has a real \`prev\` and a real \`next\`. That removes all the "is this the first node? the last? the only one?" special cases. \`addFront\`, \`addBack\` and \`remove\` are each four or fewer straight-line pointer assignments with no \`if\` statements.

**Nodes, not values.** Notice that \`addFront(node)\` and \`remove(node)\` take **node objects** (\`DLLNode\`), not raw values. That is deliberate: the O(1) removal only works if you can hand the list the exact node. The usual pairing is a \`Map\` from key → node:

\`\`\`
Map:  'a' -> node(a)      'b' -> node(b)
List: head <-> node(b) <-> node(a) <-> tail
               most recent          least recent
\`\`\`

**LRU cache (the classic use).** "Least Recently Used" cache with capacity C:

* \`get(key)\`: look up the node in the Map (O(1)); \`moveToFront(node)\` (O(1)); return its value.
* \`put(key, val)\`: if it exists, update and move to front. Otherwise create a node, \`addFront\`, store it in the Map; if the size exceeds C, \`popBack()\` removes the least recently used node (the one just before the tail sentinel) and you delete its \`key\` from the Map. That is why \`DLLNode\` stores the **key** as well as the value.

Every step is O(1), which is the whole point of the problem: a Map alone cannot tell you which entry is oldest after reordering, and a plain array would need O(n) to move an item to the front.

**LFU cache** goes one step further: one doubly linked list **per frequency**, plus a Map from key → node and a Map from frequency → list. The same O(1) remove/add is what makes it work.

**Aside: JavaScript's Map is ordered.** For LRU you *can* cheat with a \`Map\` alone (delete and re-insert a key to move it to the "newest" end; \`map.keys().next().value\` is the oldest). It is worth knowing, but interviewers usually want to see the doubly linked list, and LFU still needs it.`,
    buildSteps: [
      'Define `DLLNode(key, val)` with `prev` and `next` set to `null`. Storing the key lets you delete it from a Map when the node is evicted.',
      'In the constructor create two sentinels, `head` and `tail`, and link them: `head.next = tail; tail.prev = head`. Set `length = 0`.',
      '`addFront(node)`: set `node.prev = head` and `node.next = head.next`, then `head.next.prev = node` and `head.next = node`. Order matters: read `head.next` before you overwrite it.',
      '`addBack(node)`: the mirror image using `tail.prev`.',
      '`remove(node)`: `node.prev.next = node.next; node.next.prev = node.prev;` then clear the node\'s own pointers and decrement `length`.',
      '`moveToFront(node)`: `remove(node)` then `addFront(node)`.',
      '`popBack()` / `popFront()`: return `null` if empty, otherwise `remove(tail.prev)` / `remove(head.next)`.',
      '`toArray()`: walk from `head.next` until you reach `tail`, collecting `val`s.',
    ],
    operations: [
      { name: 'addFront(node)', description: 'Insert a DLLNode right after the head sentinel; returns the node.', time: 'O(1)' },
      { name: 'addBack(node)', description: 'Insert a DLLNode right before the tail sentinel; returns the node.', time: 'O(1)' },
      { name: 'remove(node)', description: 'Unlink a node that is in the list; returns it.', time: 'O(1)' },
      { name: 'moveToFront(node)', description: 'Remove + addFront (mark as most recent).', time: 'O(1)' },
      { name: 'popBack() / popFront()', description: 'Remove and return the last / first real node, or `null` when empty.', time: 'O(1)' },
      { name: 'isEmpty()', description: 'True when only the sentinels remain.', time: 'O(1)' },
      { name: 'toArray()', description: 'The `val` of each node, front to back.', time: 'O(n)' },
    ],
    space: 'O(n)',
    usage: `// LRU cache: Map for O(1) lookup + DoublyLinkedList for O(1) recency order
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();              // key -> DLLNode
    this.list = new DoublyLinkedList(); // front = most recent
  }
  get(key) {
    const node = this.map.get(key);
    if (!node) return -1;
    this.list.moveToFront(node);
    return node.val;
  }
  put(key, val) {
    const node = this.map.get(key);
    if (node) {
      node.val = val;
      this.list.moveToFront(node);
      return;
    }
    this.map.set(key, this.list.addFront(new DLLNode(key, val)));
    if (this.list.length > this.capacity) {
      const lru = this.list.popBack();  // least recently used
      this.map.delete(lru.key);
    }
  }
}
const cache = new LRUCache(2);
cache.put(1, 'one');
cache.put(2, 'two');
cache.get(1);        // 'one'  (1 is now most recent)
cache.put(3, 'three'); // evicts key 2
cache.get(2);        // -1
cache.list.toArray(); // ['three', 'one']`,
    whenToUse: [
      'You must remove or move an arbitrary element in O(1) and you can keep a reference to it (usually via a Map).',
      'LRU / LFU caches and other recency-ordered structures.',
      'Browser-style back/forward history, playlists, text editors (cursor moves both ways).',
      'Building your own deque when you do not need random access.',
    ],
    pitfalls: [
      'Methods take **DLLNode objects**, not values: `list.addFront(new DLLNode(key, val))`, not `list.addFront(val)`.',
      '`popBack()`/`popFront()` return the **node** (or `null`), not the value — read `.key` / `.val` from it.',
      'Never call `remove(node)` on a node that is not currently in the list (e.g. removed twice): its `prev` is `null` and it throws.',
      '`length` is a property; the sentinels are not counted.',
      'In `addFront`, reading `head.next` after overwriting it is the classic pointer-order bug — follow the order in the source.',
      'Remember to delete the evicted key from your Map too, or the cache grows without bound.',
    ],
    usedIn: ['LRU cache', 'LFU cache', 'Map + linked list design', 'Deque implementation', 'Browser history'],
    relatedTopics: ['linked-list', 'hashing', 'queue-deque'],
    practiceQuestions: ['lru-cache', 'lfu-cache', 'design-circular-deque'],
  },

  // ---------------------------------------------------------------- Binary Tree
  {
    id: 'binary-tree',
    name: 'Binary Tree',
    file: 'BinaryTree.js',
    exports: ['TreeNode', 'arrayToTree', 'treeToArray', 'findNode', 'traversals'],
    category: 'Trees',
    summary: 'Nodes with at most two children (left and right), plus helpers to build trees from LeetCode arrays and walk them in pre/in/post/level order.',
    explanation: `A **binary tree** is a family tree where every person has **at most two children**, called \`left\` and \`right\`. The top node is the **root**; nodes with no children are **leaves**.

\`\`\`
level 0          1          <- root
               /   \\
level 1       2     3
               \\   / \\
level 2         4 5   6     <- 4, 5, 6 are leaves
\`\`\`

A few plain definitions you will see everywhere:

* **Depth** of a node: how many edges from the root to it. **Height** of the tree: the depth of the deepest leaf (here 2).
* **Subtree**: a node together with everything below it. Every subtree is itself a binary tree, which is why trees and **recursion** fit so well.
* **Balanced**: the heights of the left and right subtrees differ by at most 1 everywhere, which keeps the height about log₂ n. A tree can also degenerate into a straight line of height n − 1.

**TreeNode** is the exact LeetCode shape: \`{ val, left, right }\`, with \`null\` for a missing child.

**The LeetCode array format.** Problems describe trees as a *level-order* array with \`null\` for missing children: the tree above is \`[1, 2, 3, null, 4, 5, 6]\`. \`arrayToTree(arr)\` builds it using a queue: take the next parent from the queue, give it the next two array entries as children (skipping \`null\`s), enqueue the new children, repeat. Children of \`null\` are *not* listed, which is why the arrays stay short. \`treeToArray(root)\` does the reverse and trims trailing \`null\`s. Both are O(n).

**Traversals** (\`traversals\` object). Visiting every node once costs **O(n)** time; the difference is *when* you record a node:

\`\`\`
preorder  (node, left, right):  1 2 4 3 5 6    copy / serialize a tree
inorder   (left, node, right):  2 4 1 5 3 6    BST -> sorted order
postorder (left, right, node):  4 2 5 6 3 1    compute children first (height, delete)
levelOrder (BFS by level):      [[1], [2, 3], [4, 5, 6]]
\`\`\`

* The three DFS orders are written recursively. Extra space is the **call stack**, O(h) where h is the height: O(log n) for a balanced tree, O(n) for a line.
* \`levelOrder\` keeps the current level in an array and builds the next level from its children, so its extra space is O(w), the maximum width (up to about n/2 for the last level of a full tree).

**Why recursion is natural here.** Most tree answers can be phrased as "combine the answer for the left subtree with the answer for the right subtree". For example, height = 1 + max(height(left), height(right)), with height(null) = −1 (or 0 if you count nodes). Trust that the recursive call works on the smaller subtree (the *recursive leap of faith*); you only design the base case and the combine step.

**Two styles of tree recursion.**

* **Top-down**: pass information *down* as parameters (current depth, path sum so far, max value seen on the path, as in "count good nodes").
* **Bottom-up**: return information *up* from children (height, is-balanced, best path through a node, as in "diameter" and "maximum path sum").

\`findNode(root, val)\` finds the first node with a given value by DFS in O(n). It is handy when a problem passes nodes \`p\` and \`q\` (lowest common ancestor) and you are testing with values.`,
    buildSteps: [
      'Define `TreeNode(val = 0, left = null, right = null)`.',
      'Write `arrayToTree(arr)`: return `null` for an empty array or a `null` first value. Create the root and a queue `[root]`, with a read index `head` (avoid `shift()`).',
      'Loop: take `node = queue[head++]`; if `arr[i]` is not null, create `node.left` and enqueue it; `i++`; same for the right child; `i++`. Stop when the array or queue runs out.',
      'Write `treeToArray(root)`: BFS that pushes `null` for missing children, then pop trailing `null`s.',
      'Write the recursive traversals with an accumulator `out` parameter: preorder pushes before recursing, inorder between the two calls, postorder after both.',
      'Write `levelOrder`: keep `level = [root]`; while it is non-empty, push its values, build `next` from children, and set `level = next`.',
      'Test: `traversals.inorder(arrayToTree([1, null, 2, 3]))` should be `[1, 3, 2]`.',
    ],
    operations: [
      { name: 'new TreeNode(val, left?, right?)', description: 'Create a node.', time: 'O(1)' },
      { name: 'arrayToTree(arr)', description: 'Build a tree from LeetCode level-order format.', time: 'O(n)' },
      { name: 'treeToArray(root)', description: 'Inverse of arrayToTree (trailing nulls removed).', time: 'O(n)' },
      { name: 'findNode(root, val)', description: 'First node with that value (DFS), or `null`.', time: 'O(n)' },
      { name: 'traversals.preorder / inorder / postorder(root)', description: 'Values in DFS order (recursive, O(h) stack).', time: 'O(n)' },
      { name: 'traversals.levelOrder(root)', description: 'Array of levels, each an array of values.', time: 'O(n)' },
    ],
    space: 'O(n) for the tree; O(h) call stack for DFS traversals, O(w) for levelOrder',
    usage: `const root = arrayToTree([3, 9, 20, null, null, 15, 7]);
//      3
//     / \\
//    9   20
//       /  \\
//      15   7

traversals.preorder(root);   // [3, 9, 20, 15, 7]
traversals.inorder(root);    // [9, 3, 15, 20, 7]
traversals.postorder(root);  // [9, 15, 7, 20, 3]
traversals.levelOrder(root); // [[3], [9, 20], [15, 7]]

// Bottom-up recursion: maximum depth
function maxDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
maxDepth(root); // 3

// Invert the tree, then look at it as an array again
function invert(node) {
  if (!node) return null;
  [node.left, node.right] = [invert(node.right), invert(node.left)];
  return node;
}
treeToArray(invert(root)); // [3, 20, 9, 7, 15]
findNode(root, 20).left.val; // 7 (after the inversion)`,
    whenToUse: [
      'Any problem that hands you a `root` (`TreeNode`).',
      'Hierarchical data: file systems, org charts, expression trees, decision trees.',
      'Recursive "combine left and right answers" problems (height, diameter, path sums, LCA).',
      'Level-by-level questions (right side view, zigzag, averages per level) — use BFS / `levelOrder`.',
      'Testing your own tree code: build inputs with `arrayToTree`, compare outputs with `treeToArray`.',
    ],
    pitfalls: [
      'Recursive traversals on a very deep, skewed tree (~10^4+ levels) can hit "Maximum call stack size exceeded" — switch to an explicit stack.',
      'Forgetting the `null` base case (`if (!node) return …`) is the #1 tree bug.',
      '`arrayToTree` expects LeetCode format: children of `null` are **not** listed. `[1, null, 2, 3]` means 3 is the left child of 2.',
      'Values of 0 are falsy: write `if (node === null)` or `if (!node)` on the **node**, never `if (!node.val)`.',
      'A plain binary tree has no ordering — do not binary-search it; that only works for a BST.',
      'Passing a shared array down recursive calls (paths) needs backtracking: push before recursing, pop after, and copy (`[...path]`) when saving an answer.',
    ],
    usedIn: ['DFS (pre/in/post order)', 'BFS / level-order traversal', 'Top-down vs bottom-up recursion', 'Lowest common ancestor', 'Tree serialization', 'Path sum', 'Tree DP'],
    relatedTopics: ['trees', 'recursion', 'bst', 'queue-deque', 'dp-advanced'],
    practiceQuestions: ['maximum-depth-of-binary-tree', 'invert-binary-tree', 'binary-tree-level-order-traversal', 'diameter-of-binary-tree', 'lowest-common-ancestor-of-a-binary-tree', 'serialize-and-deserialize-binary-tree'],
  },

  // ---------------------------------------------------------------- BST
  {
    id: 'bst',
    name: 'Binary Search Tree',
    file: 'BST.js',
    exports: ['BST', 'TreeNode'],
    category: 'Trees',
    summary: 'A binary tree kept in order (left < node < right) so search, insert and delete follow one path: O(h), which is O(log n) when balanced.',
    explanation: `A **binary search tree (BST)** is a binary tree with one extra rule, the **BST invariant**: for every node, *everything* in its left subtree is smaller and *everything* in its right subtree is larger.

\`\`\`
            8
          /   \\
         3     10
        / \\      \\
       1   6      14
          / \\    /
         4   7  13
\`\`\`

**Why searching is fast.** Looking for 7: 7 < 8 → go left; 7 > 3 → go right; 7 > 6 → go right; found. At every node, one comparison throws away an entire subtree, just like binary search throws away half of a sorted array. You walk a single root-to-leaf path, so the cost is **O(h)**, where h is the height.

**The catch: h depends on insertion order.**

\`\`\`
insert 4, 2, 6, 1, 3, 5, 7        insert 1, 2, 3, 4, 5
          4                        1
        /   \\                       \\
       2     6                        2
      / \\   / \\                         \\
     1   3 5   7                          3  ...  (a linked list!)
     h = 2 = log2(7)                     h = n - 1
\`\`\`

The toolkit \`BST\` is a plain (unbalanced) BST: inserting already-sorted data makes every operation **O(n)**. Self-balancing trees (AVL, red-black) rotate nodes to keep h = O(log n). JavaScript has none built in, which matters when you need a sorted, changing set (see *Structures missing in JS* in the JavaScript reference).

**How each operation works.**

* \`insert(val)\`: walk down as in search until you fall off the tree, and attach the new node there. Duplicates are **ignored** (\`size\` does not change). O(h).
* \`has(val)\`: the search walk. O(h).
* \`min()\` / \`max()\`: keep going left / right until you cannot. O(h).
* \`delete(val)\`: find the node, then three cases:
  1. **No children**: just remove it.
  2. **One child**: replace the node with that child.
  3. **Two children**: copy in the value of its **in-order successor** (the smallest value in its right subtree, found by going right once then left as far as possible), then delete that successor from the right subtree. The successor has no left child, so that second delete is case 1 or 2.

  All of this is one or two downward paths: O(h).
* \`inorder()\`: left, node, right. Because of the invariant, an in-order walk of a BST visits values in **sorted order**. The toolkit version is iterative with an explicit stack, so it will not overflow on a degenerate tree. O(n).

**Useful facts that fall out of the invariant.**

* **Validate a BST** by checking each node against a *range* (low, high) inherited from its ancestors, not just against its parent. A node deep in the left subtree must be smaller than *every* ancestor it sits to the left of.
* **k-th smallest** = the k-th value of an in-order walk (stop early).
* **LCA in a BST**: walk from the root; if both targets are smaller go left, if both are larger go right, otherwise the current node is the answer. O(h).
* **Sorted array → balanced BST**: take the middle element as the root, recurse on both halves.

**Using the class vs raw nodes.** LeetCode BST problems hand you a \`TreeNode\` root, so you write the walks yourself. The \`BST\` class is for experimenting, or when you need a quick ordered set of numbers for small inputs. Its \`root\` is an ordinary \`TreeNode\`, so all the \`BinaryTree.js\` helpers (\`treeToArray\`, \`traversals\`) work on it.`,
    buildSteps: [
      'Reuse `TreeNode` from BinaryTree.js. The class keeps `root = null` and `size = 0`; the constructor inserts any initial values.',
      '`insert(val)`: if empty, the new node is the root. Otherwise walk: stop on an equal value (ignore duplicates); choose `side = val < cur.val ? "left" : "right"`; if `cur[side]` is empty attach there, else move down.',
      '`has(val)`: the same walk, returning true on equality and false when you fall off.',
      '`min()` / `max()`: follow `left` / `right` pointers to the end.',
      '`delete(val)`: write a recursive helper `removeFrom(node, target)` that returns the new subtree root. Recurse left/right by comparison; on a match handle the 0/1/2-children cases, using the in-order successor for two children.',
      'Keep `size` correct: decrement once per real deletion (the two-children case re-enters the helper to delete the successor, so compensate once).',
      '`inorder()`: iterative — push nodes while going left, pop, record, then go right.',
      'Test: insert `[5, 3, 8, 1, 4]`; `inorder()` is `[1, 3, 4, 5, 8]`; delete 3 (two children); `inorder()` is `[1, 4, 5, 8]`.',
    ],
    operations: [
      { name: 'new BST(values?)', description: 'Build by inserting each value in order.', time: 'O(n·h)' },
      { name: 'insert(val)', description: 'Add a value (duplicates ignored). Returns the tree for chaining.', time: 'O(h)' },
      { name: 'has(val)', description: 'True if the value is in the tree.', time: 'O(h)' },
      { name: 'min() / max()', description: 'Smallest / largest value, or `undefined` when empty.', time: 'O(h)' },
      { name: 'delete(val)', description: 'Remove a value if present (successor replacement for two children). Returns the tree.', time: 'O(h)' },
      { name: 'inorder()', description: 'All values in sorted order (iterative).', time: 'O(n)' },
      { name: 'size / root', description: 'Number of values (property) and the root TreeNode.', time: 'O(1)' },
    ],
    space: 'O(n); h = O(log n) if balanced, O(n) in the worst case',
    usage: `const bst = new BST([8, 3, 10, 1, 6, 14, 4, 7, 13]);
bst.has(6);      // true
bst.has(5);      // false
bst.min();       // 1
bst.max();       // 14
bst.inorder();   // [1, 3, 4, 6, 7, 8, 10, 13, 14]

bst.insert(5).insert(5); // duplicate ignored
bst.size;        // 10
bst.delete(3);   // two children -> replaced by successor 4
bst.inorder();   // [1, 4, 5, 6, 7, 8, 10, 13, 14]
treeToArray(bst.root); // works because root is a TreeNode

// Validate a BST with inherited bounds (works on any TreeNode root)
function isValidBST(node, low = -Infinity, high = Infinity) {
  if (!node) return true;
  if (node.val <= low || node.val >= high) return false;
  return isValidBST(node.left, low, node.val) && isValidBST(node.right, node.val, high);
}
isValidBST(bst.root);                    // true
isValidBST(arrayToTree([5, 1, 4, null, null, 3, 6])); // false (4 is in the right subtree of 5)`,
    whenToUse: [
      'The problem gives you a BST root — exploit the ordering to skip half the tree.',
      'You need sorted order from a tree (in-order traversal).',
      'Floor / ceiling / k-th smallest style questions on ordered data.',
      'Learning how ordered maps (TreeMap, std::set) work under the hood.',
    ],
    pitfalls: [
      'The toolkit BST is **not self-balancing**: inserting sorted input makes it a linked list with O(n) operations.',
      'Validating by comparing each node only with its direct children is wrong — use inherited (low, high) bounds.',
      'Duplicates are silently ignored by `insert`; if your problem allows duplicates, store counts instead.',
      '`size` is a property, not a method.',
      '`delete` is recursive, so a very deep degenerate tree can overflow the call stack.',
      'Comparisons use `<`, so mixing numbers and strings gives nonsense order ("10" < "9" as strings).',
    ],
    usedIn: ['BST search / insert / delete', 'In-order = sorted', 'Validate BST with bounds', 'K-th smallest', 'LCA in BST', 'BST iterator'],
    relatedTopics: ['bst', 'trees', 'binary-search'],
    practiceQuestions: ['search-in-a-binary-search-tree', 'insert-into-a-binary-search-tree', 'delete-node-in-a-bst', 'validate-binary-search-tree', 'kth-smallest-element-in-a-bst', 'binary-search-tree-iterator'],
  },

  // ---------------------------------------------------------------- Trie
  {
    id: 'trie',
    name: 'Trie (Prefix Tree)',
    file: 'Trie.js',
    exports: ['Trie'],
    category: 'Trees',
    summary: 'A tree of characters where each path from the root spells a prefix: insert and lookup cost O(length of the word), independent of how many words are stored.',
    explanation: `Think of the index tabs on a dictionary, but nested: first you pick the tab for the first letter, then inside it a tab for the second letter, and so on. A **trie** (from re*trie*val, usually said "try"), also called a **prefix tree**, stores words exactly like that.

Each node represents a **prefix**. Its children are keyed by the next character. A flag \`isEnd\` marks nodes where a complete word ends.

\`\`\`
insert: "car", "cat", "cart", "dog"

            (root)
           /      \\
         c          d
         |          |
         a          o
        / \\         |
      r*   t*       g*          * = isEnd (a word ends here)
      |
      t*
\`\`\`

"car" and "cart" share the path c → a → r; "car" is a word *and* a prefix of "cart".

**Inside the toolkit Trie.** Each \`TrieNode\` has:

* \`children\`: a **Map** from character to child node (works for any alphabet, including Unicode),
* \`isEnd\`: whether a word ends here,
* \`count\`: how many inserted words pass through this node, which gives prefix counts for free.

**Why the complexity is O(L), where L is the word length.** \`insert\`, \`search\`, \`startsWith\` and \`countPrefix\` each walk one character at a time down from the root, doing one Map lookup per character (average O(1)). The work depends on the length of the word you are asking about, **not** on how many words are stored. A hash set of words can also check a whole word in about O(L) (hashing reads every character), but it cannot answer "does any word **start with** 'ca'?" without scanning every word. That prefix question is what a trie is for.

* \`insert(word)\`: walk, creating missing children, incrementing \`count\` on each node you pass; set \`isEnd\` at the last node.
* \`search(word)\`: walk; true only if the path exists **and** the last node has \`isEnd\`. \`search("ca")\` is false above.
* \`startsWith(prefix)\`: walk; true if the path exists at all.
* \`countPrefix(prefix)\`: the \`count\` stored at the prefix's node.
* \`wordsWithPrefix(prefix, limit)\`: walk to the prefix node, then DFS below it, visiting children in sorted character order so results come out alphabetically. Its cost is proportional to the size of that subtree (plus sorting children), which is why autocomplete accepts a \`limit\`.

**Space.** In the worst case every character of every word gets its own node: O(total characters). Shared prefixes are stored once, which is a real saving for dictionaries.

**Patterns.**

* **Autocomplete / search suggestions**: walk to the prefix, list up to 3 words below it.
* **Word Search II**: put all target words in a trie, then DFS the grid; stop exploring the moment the current path is not a prefix in the trie. This pruning is what makes it fast.
* **Wildcard search** (\`.\` matches any letter): DFS that tries every child at a \`.\`.
* **Binary trie for XOR**: insert numbers bit by bit (children \`0\`/\`1\`) from the highest bit; to maximise \`x XOR y\`, greedily walk toward the opposite bit at each level. O(32) per query.`,
    buildSteps: [
      'Define a `TrieNode` with `children = new Map()`, `isEnd = false`, and `count = 0`.',
      'The `Trie` holds a `root` node. The constructor inserts any initial words.',
      '`insert(word)`: `node = root`; for each character, create the child if missing, move into it and `count++`; finally `node.isEnd = true`.',
      'Write a private `#walk(prefix)` that follows the characters and returns the final node, or `null` as soon as a child is missing.',
      '`search(word)`: `#walk(word)` is non-null **and** `isEnd`. `startsWith(prefix)`: `#walk(prefix)` is non-null. `countPrefix(prefix)`: that node\'s `count`, or 0.',
      '`wordsWithPrefix(prefix, limit)`: walk to the prefix, then DFS with the current path string, pushing a word whenever `isEnd` is true; visit children keys sorted; stop once `limit` words are collected.',
      'Test: insert "apple", "app", "apt"; `search("app")` true; `search("ap")` false; `startsWith("ap")` true; `countPrefix("ap")` is 3; `wordsWithPrefix("ap")` is `["app", "apple", "apt"]`.',
    ],
    operations: [
      { name: 'insert(word)', description: 'Add a word.', time: 'O(L)' },
      { name: 'search(word)', description: 'True if this exact word was inserted.', time: 'O(L)' },
      { name: 'startsWith(prefix)', description: 'True if any inserted word starts with the prefix.', time: 'O(L)' },
      { name: 'countPrefix(prefix)', description: 'How many inserted words start with the prefix.', time: 'O(L)' },
      { name: 'wordsWithPrefix(prefix, limit?)', description: 'Words under the prefix in alphabetical order, at most `limit`.', time: 'O(L + size of the subtree visited)' },
    ],
    space: 'O(total characters inserted)',
    usage: `const trie = new Trie(['car', 'cat', 'cart', 'dog']);
trie.search('car');        // true
trie.search('ca');         // false (a prefix, not a word)
trie.startsWith('ca');     // true
trie.countPrefix('ca');    // 3  (car, cat, cart)
trie.wordsWithPrefix('ca');    // ['car', 'cart', 'cat']
trie.wordsWithPrefix('ca', 2); // ['car', 'cart']

// Search suggestions: up to 3 words for every prefix typed so far
function suggestedProducts(products, searchWord) {
  const t = new Trie(products);
  const out = [];
  let prefix = '';
  for (const ch of searchWord) {
    prefix += ch;
    out.push(t.wordsWithPrefix(prefix, 3));
  }
  return out;
}
suggestedProducts(['mobile', 'mouse', 'moneypot', 'monitor', 'mousepad'], 'mou');
// [['mobile','moneypot','monitor'], ['mobile','moneypot','monitor'], ['mouse','mousepad']]`,
    whenToUse: [
      'Many prefix questions over a fixed set of words: autocomplete, "starts with", counting words by prefix.',
      'Searching a grid or text for many words at once (prune paths that are not prefixes).',
      'Replacing words by their shortest root / dictionary prefix.',
      'Wildcard matching over a dictionary.',
      'Maximum XOR pairs (binary trie over the bits of numbers).',
    ],
    pitfalls: [
      '`search` checks `isEnd`: a prefix of a stored word is **not** found unless it was inserted itself.',
      '`count` counts insertions — inserting the same word twice counts it twice in `countPrefix`.',
      '`countPrefix("")` returns the total number of inserted words, because every insert passes through (and counts at) the root.',
      'There is no `delete`; for problems that remove words, decrement `count` along the path yourself.',
      '`wordsWithPrefix` sorts child keys by UTF-16 code unit order, so uppercase letters come before lowercase.',
      'For hot loops over lowercase letters only, an array of 26 children (`charCodeAt(0) - 97`) is faster than a Map.',
    ],
    usedIn: ['Autocomplete', 'Prefix counting', 'Word Search II (grid + trie pruning)', 'Wildcard dictionary', 'Binary trie for XOR', 'Replace words'],
    relatedTopics: ['tries', 'trees', 'backtracking', 'bit-manipulation'],
    practiceQuestions: ['implement-trie-prefix-tree', 'counting-words-with-a-given-prefix', 'design-add-and-search-words-data-structure', 'search-suggestions-system', 'replace-words', 'word-search-ii'],
  },

  // ---------------------------------------------------------------- Graph
  {
    id: 'graph',
    name: 'Graph (Adjacency List)',
    file: 'Graph.js',
    exports: ['Graph', 'buildAdjList'],
    category: 'Graphs',
    summary: 'Nodes connected by edges, stored as an adjacency list (each node maps to its neighbours), with BFS/DFS built in and an edge-list builder.',
    explanation: `A **graph** is a set of things (**nodes**, also called *vertices*) and connections between them (**edges**). Cities and roads, people and friendships, courses and prerequisites, cells in a grid and their neighbours: all graphs.

* **Undirected**: the edge goes both ways (friendship). **Directed**: one way only (A follows B; A is a prerequisite of B).
* **Weighted**: each edge has a number (distance, cost, time). Unweighted edges all count as 1.
* **V** = number of nodes, **E** = number of edges. Graph complexities are written in terms of both.

**How to store a graph.** The two classic options:

\`\`\`
edges: 0-1, 0-2, 1-2, 2-3            0 --- 1
                                      \\   /
                                        2 --- 3
adjacency matrix (V x V)          adjacency list
    0 1 2 3                        0: [1, 2]
0 [ 0 1 1 0 ]                      1: [0, 2]
1 [ 1 0 1 0 ]                      2: [0, 1, 3]
2 [ 1 1 0 1 ]                      3: [2]
3 [ 0 0 1 0 ]
\`\`\`

A matrix answers "is there an edge u-v?" in O(1) but always uses **O(V²)** memory, and listing a node's neighbours costs O(V). An **adjacency list** uses **O(V + E)** memory and lists neighbours in O(degree). Most interview graphs are *sparse* (E much smaller than V²), so the adjacency list is the default.

**The toolkit gives you two shapes.**

1. \`buildAdjList(n, edges, directed)\`: nodes are \`0..n-1\`; returns a plain array of arrays like \`[[1, 2], [0, 2], …]\`. No weights, no class; the fastest thing to type in an interview.
2. \`Graph\` class: \`adj\` is a **Map** from node to an array of \`{ to, weight }\` objects. Node ids can be anything a Map accepts (numbers, strings). \`addEdge(u, v, w)\` adds both directions unless the graph is directed. \`Graph.fromEdges(n, edges, directed)\` builds from \`[[u, v]]\` or \`[[u, v, w]]\` lists and pre-creates nodes \`0..n-1\` (so isolated nodes exist).

**BFS and DFS: why both are O(V + E).** Each node is marked \`seen\` once, so it is processed once (the V part), and when it is processed we scan its neighbour list once (the E part: every edge is scanned once in a directed graph, twice in an undirected one). Nothing is ever repeated.

* \`bfs(start)\` uses an array plus a moving \`head\` index as a queue (no \`shift()\`), and marks nodes seen **when they are enqueued**. It visits nodes in order of distance from \`start\`, so the first time BFS reaches a node is along a shortest path (counting edges).
* \`dfs(start)\` recurses as deep as possible before backing up. It is the natural tool for "explore everything reachable", cycle detection, topological sort and connected components. It is recursive, so very long paths can overflow the call stack.

Both return the **visit order**. For real problems you usually copy their loop and add your own bookkeeping (distances, parents, colours).

**Grids are graphs too.** Cell \`(r, c)\` is a node; its neighbours are the 4 (or 8) adjacent cells. You never build an adjacency list: you generate neighbours on the fly with a \`dirs\` array. V = rows × cols and E ≈ 4V, so BFS/DFS on a grid is O(rows × cols).

**Which algorithm next?**

* Unweighted shortest path → BFS. 0/1 weights → 0-1 BFS with a Deque. Non-negative weights → Dijkstra with a MinHeap.
* Dependencies / ordering → topological sort (Kahn's BFS with in-degrees).
* "Are these connected?" with edges arriving over time → Union Find.`,
    buildSteps: [
      'Decide the representation: `this.adj = new Map()` mapping node → array of `{ to, weight }`. Store `this.directed`.',
      '`addNode(u)`: create an empty array if the node is new; return `this` for chaining.',
      '`addEdge(u, v, weight = 1)`: add both nodes, push `{ to: v, weight }` to `u`\'s list, and the reverse edge if undirected.',
      '`neighbors(u)`: `this.adj.get(u) || []` so unknown nodes do not crash. `nodes()`: `[...this.adj.keys()]`.',
      '`bfs(start)`: `seen = new Set([start])`, `queue = [start]`, loop with a `head` index; for each unseen neighbour, mark and enqueue.',
      '`dfs(start)`: a recursive `visit(u)` that marks, records, and visits unseen neighbours.',
      '`static fromEdges(n, edges, directed)`: create nodes `0..n-1`, then add each `[u, v, w = 1]`.',
      'Separately write `buildAdjList(n, edges, directed)` with `Array.from({ length: n }, () => [])` — note the arrow function, so each node gets its own array.',
    ],
    operations: [
      { name: 'new Graph(directed = false)', description: 'Empty graph.', time: 'O(1)' },
      { name: 'addNode(u)', description: 'Ensure a node exists (chainable).', time: 'O(1) average' },
      { name: 'addEdge(u, v, weight = 1)', description: 'Add an edge (both directions if undirected); chainable.', time: 'O(1) amortized' },
      { name: 'neighbors(u)', description: 'Array of `{ to, weight }` (empty for unknown nodes).', time: 'O(1)' },
      { name: 'nodes()', description: 'All node ids in insertion order.', time: 'O(V)' },
      { name: 'bfs(start) / dfs(start)', description: 'Visit order from `start`.', time: 'O(V + E)' },
      { name: 'Graph.fromEdges(n, edges, directed?)', description: 'Build from an edge list, nodes 0..n-1.', time: 'O(V + E)' },
      { name: 'buildAdjList(n, edges, directed?)', description: 'Plain `number[][]` adjacency list (no weights).', time: 'O(V + E)' },
    ],
    space: 'O(V + E)',
    usage: `// Plain adjacency list — the quickest interview shape
const adj = buildAdjList(4, [[0, 1], [0, 2], [1, 2], [2, 3]]);
adj; // [[1, 2], [0, 2], [0, 1, 3], [2]]

// Count connected components with iterative DFS
function countComponents(n, edges) {
  const adj = buildAdjList(n, edges);
  const seen = new Uint8Array(n);
  let components = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    components++;
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (!seen[v]) { seen[v] = 1; stack.push(v); }
    }
  }
  return components;
}
countComponents(5, [[0, 1], [1, 2], [3, 4]]); // 2

// The Graph class: string ids and weights
const g = new Graph(true); // directed
g.addEdge('A', 'B', 4).addEdge('A', 'C', 1).addEdge('C', 'B', 2);
g.neighbors('A'); // [{ to: 'B', weight: 4 }, { to: 'C', weight: 1 }]
g.nodes();        // ['A', 'B', 'C']
g.bfs('A');       // ['A', 'B', 'C']
g.dfs('A');       // ['A', 'B', 'C']

const g2 = Graph.fromEdges(4, [[0, 1], [1, 2]]);
g2.bfs(0);        // [0, 1, 2]
g2.neighbors(3);  // [] (isolated node)`,
    whenToUse: [
      'Anything described as connections: networks, maps, dependencies, social links.',
      'Input given as an edge list `[[u, v], …]` — build an adjacency list first.',
      'Reachability, connected components, cycle detection.',
      'Shortest paths (BFS for unweighted; feed `neighbors` weights into Dijkstra).',
      'Use `Graph` for string ids / weights; `buildAdjList` for `0..n-1` unweighted inputs.',
    ],
    pitfalls: [
      '`new Array(n).fill([])` gives every node the **same** array — use `Array.from({ length: n }, () => [])` (as `buildAdjList` does).',
      '`Graph.neighbors(u)` returns objects: destructure `for (const { to, weight } of g.neighbors(u))`. `buildAdjList` returns plain numbers.',
      'Forgetting the reverse edge in an undirected graph (both helpers add it unless `directed` is true).',
      'Recursive DFS (`g.dfs`) can overflow on long paths (~10^4+ deep); use an explicit stack for big graphs.',
      'Mark BFS nodes visited when **enqueued**, not when dequeued, or nodes get queued many times.',
      'Graphs can be disconnected: loop over every node as a possible start when counting components.',
      'Duplicate edges are not de-duplicated; that is harmless for BFS/DFS but can matter for degree counts.',
    ],
    usedIn: ['BFS', 'DFS', 'Connected components', 'Multi-source BFS', 'Cycle detection', 'Topological sort', 'Dijkstra', 'Bipartite check', 'Grid traversal'],
    relatedTopics: ['graphs', 'topological-sort', 'shortest-path', 'union-find', 'advanced-graphs'],
    practiceQuestions: ['find-if-path-exists-in-graph', 'number-of-islands', 'clone-graph', 'keys-and-rooms', 'course-schedule', 'network-delay-time'],
  },

  // ---------------------------------------------------------------- Union Find
  {
    id: 'union-find',
    name: 'Union Find (Disjoint Set Union)',
    file: 'UnionFind.js',
    exports: ['UnionFind'],
    category: 'Graphs',
    summary: 'Tracks which items belong to the same group: merge two groups or ask "same group?" in nearly O(1) using path compression and union by rank.',
    explanation: `Imagine a school where every student belongs to exactly one club, and clubs keep **merging**. You want to answer two questions fast: "merge the clubs of Alice and Bob" and "are Alice and Carol in the same club?". **Union Find**, also called **Disjoint Set Union (DSU)**, does exactly that.

**The idea: every group is a tree, and the root is its representative.** Each item stores a \`parent\`. Following parents upward eventually reaches a root (an item that is its own parent). Two items are in the same group exactly when they reach the same root.

\`\`\`
parent: [0, 0, 1, 3, 3]           0        3
                                  |        |
                                  1        4
                                  |
                                  2
find(2): 2 -> 1 -> 0 (root)     find(4): 4 -> 3 (root)    => different groups
union(2, 4): attach root 3 under root 0 (or 0 under 3)
\`\`\`

* \`find(x)\`: follow parents to the root.
* \`union(a, b)\`: find both roots; if they differ, make one root the parent of the other. Groups merge in one pointer change.
* \`connected(a, b)\`: \`find(a) === find(b)\`.

**Why it needs two optimisations.** Without care, the trees can become long chains, and \`find\` degrades to O(n).

1. **Union by rank.** \`rank\` is an upper bound on a tree's height. Always attach the **shorter** tree under the **taller** one; the height only grows (by 1) when two equal-rank trees merge. That alone keeps height at O(log n).
2. **Path compression.** While walking up in \`find\`, re-point nodes closer to the root so the next \`find\` is shorter. The toolkit uses the *path halving* form: \`parent[x] = parent[parent[x]]\` makes every node on the path skip one level each time, done in a simple loop without recursion.

\`\`\`
before find(4):  4 -> 3 -> 2 -> 1 -> 0 (root)
after  find(4):  4 -> 2 -> 0,  3 -> 2,  1 -> 0   (every other node skipped a level)
\`\`\`

Together they make each operation **O(α(n))** amortized, where α is the *inverse Ackermann function*. It grows so slowly that α(n) ≤ 4 for any n that could fit in the universe, so in practice it is **constant time**.

**Extras kept by the toolkit.**

* \`count\`: the number of separate groups. It starts at n and drops by 1 on every successful \`union\`. "Number of provinces / components" is just \`uf.count\` at the end.
* \`componentSize[root]\`, exposed as \`sizeOf(x)\`: how many items are in \`x\`'s group. Useful for "largest island" or "size of the biggest group".
* \`union\` returns **\`false\` if the two were already connected**. In an undirected graph that means the new edge closes a **cycle**, which is exactly "redundant connection" and the core check in **Kruskal's MST** (sort edges by weight; take an edge only if \`union\` returns true).

**Union Find vs BFS/DFS.** Both can count components. BFS/DFS needs the whole graph up front and costs O(V + E) *each time* you ask. Union Find shines when edges **arrive one by one** and you need answers in between ("number of islands II"), or when the question is only about connectivity, not paths.

**Non-numeric items.** The class works on indices \`0..n-1\`. For strings (emails, equations), first map each distinct string to an index with a \`Map\`.`,
    buildSteps: [
      'Create `parent = [0, 1, …, n-1]` (everyone is their own root), `rank = new Array(n).fill(0)`, `componentSize = new Array(n).fill(1)`, and `count = n`.',
      '`find(x)`: loop while `parent[x] !== x`; inside, do path halving `parent[x] = parent[parent[x]]` and step `x = parent[x]`. Return `x`.',
      '`union(a, b)`: `ra = find(a)`, `rb = find(b)`; if equal return `false`.',
      'Union by rank: if `rank[ra] < rank[rb]` swap them so `ra` is the taller root; set `parent[rb] = ra`; if the ranks were equal, `rank[ra]++`.',
      'Update the extras: `componentSize[ra] += componentSize[rb]`, `count--`, return `true`.',
      'Add `connected(a, b)` and `sizeOf(x)` (`componentSize[find(x)]`).',
      'Test: n = 5; union(0,1), union(1,2), union(3,4); `count` is 2; `connected(0,2)` true; `connected(2,3)` false; union(0,2) returns false (cycle).',
    ],
    operations: [
      { name: 'new UnionFind(n)', description: 'n singleton groups for items 0..n-1.', time: 'O(n)' },
      { name: 'find(x)', description: 'Representative (root) of x\'s group, compressing the path.', time: 'O(α(n)) amortized' },
      { name: 'union(a, b)', description: 'Merge the two groups; returns `false` if they were already the same group.', time: 'O(α(n)) amortized' },
      { name: 'connected(a, b)', description: 'True if a and b are in the same group.', time: 'O(α(n)) amortized' },
      { name: 'sizeOf(x)', description: 'Number of items in x\'s group.', time: 'O(α(n)) amortized' },
      { name: 'count', description: 'Number of groups (property).', time: 'O(1)' },
    ],
    space: 'O(n)',
    usage: `// Redundant connection: the first edge whose endpoints are already connected
function findRedundantConnection(edges) {
  const uf = new UnionFind(edges.length + 1); // nodes are 1..n
  for (const [u, v] of edges) {
    if (!uf.union(u, v)) return [u, v];        // union false => cycle
  }
  return [];
}
findRedundantConnection([[1, 2], [1, 3], [2, 3]]); // [2, 3]

// Kruskal's MST: cheapest edges first, skip ones that would form a cycle
function mstCost(n, edges) {           // edges: [u, v, w]
  const uf = new UnionFind(n);
  let cost = 0;
  for (const [u, v, w] of [...edges].sort((a, b) => a[2] - b[2])) {
    if (uf.union(u, v)) cost += w;
  }
  return uf.count === 1 ? cost : -1;   // -1 if the graph is disconnected
}
mstCost(4, [[0, 1, 1], [1, 2, 2], [0, 2, 5], [2, 3, 1]]); // 4

const uf = new UnionFind(6);
uf.union(0, 1);
uf.union(2, 3);
uf.union(1, 3);
uf.connected(0, 2); // true
uf.sizeOf(3);       // 4
uf.count;           // 3  ({0,1,2,3}, {4}, {5})`,
    whenToUse: [
      '"Are these two connected?" or "how many groups?" questions, especially when edges arrive over time.',
      'Detecting a cycle while adding undirected edges.',
      "Kruskal's minimum spanning tree.",
      'Grouping by equivalence: accounts sharing an email, equal-variable equations, similar strings.',
      'Grid problems where cells get switched on one at a time (online islands).',
    ],
    pitfalls: [
      'Items must be integers `0..n-1`. For 1-indexed input create `new UnionFind(n + 1)`; for strings map them to indices first.',
      'Compare **roots**, not parents: `uf.parent[a] === uf.parent[b]` is wrong; use `connected` / `find`.',
      '`componentSize` is only correct at a **root** — use `sizeOf(x)`, not `componentSize[x]`.',
      '`count` is a property, not a method.',
      'Union Find cannot **split** groups (no delete). If edges are removed, process the operations in reverse or use another approach.',
      'It works for undirected connectivity; for directed graphs (reachability, cycles in dependencies) use DFS / topological sort.',
    ],
    usedIn: ['Connected components', 'Cycle detection (undirected)', "Kruskal's MST", 'Accounts merge', 'Online connectivity', 'Equivalence grouping'],
    relatedTopics: ['union-find', 'graphs', 'mst'],
    practiceQuestions: ['number-of-provinces', 'redundant-connection', 'graph-valid-tree', 'accounts-merge', 'satisfiability-of-equality-equations', 'min-cost-to-connect-all-points'],
  },

  // ---------------------------------------------------------------- Segment Tree
  {
    id: 'segment-tree',
    name: 'Segment Tree',
    file: 'SegmentTree.js',
    exports: ['SegmentTree', 'LazySegmentTree'],
    category: 'Advanced',
    summary: 'A tree of precomputed range answers (sum, min, max, gcd…) that supports point updates and range queries in O(log n); the lazy version adds range updates.',
    explanation: `Suppose you have an array and two kinds of requests arriving in any order: "change \`arr[i]\`" and "what is the sum (or min, or max) of \`arr[l..r]\`?".

* Plain array: update O(1), query O(n).
* Prefix sums: query O(1), but one update forces rebuilding O(n) prefix values.

A **segment tree** balances the two: **both in O(log n)**.

**The idea: store answers for halves, quarters, eighths…** The root holds the answer for the whole array, its two children hold the left and right halves, their children the quarters, down to single elements at the leaves.

\`\`\`
arr = [5, 2, 6, 1]            sum tree
                           [0..3] = 14
                          /           \\
                  [0..1] = 7        [2..3] = 7
                   /     \\           /     \\
                 [0]=5  [1]=2     [2]=6   [3]=1
\`\`\`

**Why a query is O(log n).** Any range \`[l, r]\` can be covered by at most about 2 nodes per level (pieces that are fully inside the range), and there are log₂ n levels. Combining those O(log n) precomputed pieces gives the answer. \`sum(1..3)\` = \`[1]\` + \`[2..3]\` = 2 + 7 = 9.

**Why an update is O(log n).** Changing one element only affects the nodes on the path from that leaf to the root, one per level. Recompute each of them from its two children.

**The toolkit SegmentTree: iterative, 2n layout.** Instead of a pointer tree it uses one array of size \`2n\`: the leaves live at indices \`[n, 2n)\` and node \`i\`'s children are \`2i\` and \`2i + 1\` (so its parent is \`i >> 1\`). Building fills internal nodes from \`n - 1\` down to \`1\`, O(n) total.

* \`update(index, value)\` **sets** the leaf at \`index + n\`, then walks \`i >>= 1\` up to the root recomputing each parent.
* \`query(left, right)\` (inclusive) starts with two pointers at the leaf level and moves them up together. When the left pointer is a *right child* (odd index), its node is fully inside the range and cannot be merged with a sibling, so it is taken and the pointer steps right; symmetrically on the right side. Left and right partial results are kept separately (\`resLeft\`, \`resRight\`) and joined at the end, so even non-commutative combines (like matrix products) keep their order.

**Choosing \`combine\` and \`identity\`.** \`combine\` must be **associative** (grouping does not matter: (a∘b)∘c = a∘(b∘c)). \`identity\` is the value that changes nothing when combined:

| query | combine | identity |
|---|---|---|
| sum | \`(a, b) => a + b\` | \`0\` |
| min | \`Math.min\` | \`Infinity\` |
| max | \`Math.max\` | \`-Infinity\` |
| gcd | \`gcd\` | \`0\` |

**Range updates: LazySegmentTree.** "Add 5 to every element in \`[l, r]\`" would cost O(n log n) as separate point updates. **Lazy propagation** fixes that: when an update fully covers a node, update that node's total (\`delta × length\`) and leave a **lazy tag** saying "my children still owe +delta". The tag is only pushed down (\`#push\`) when a later operation needs to go *inside* that node. Each operation touches O(log n) nodes, so both \`rangeAdd\` and \`rangeSum\` are **O(log n)**. The toolkit's lazy tree is the classic recursive version with arrays of size \`4n\`, specialised for **range add + range sum**.

**Segment tree vs Fenwick vs sparse table.** Fenwick trees are shorter and faster for sums (anything invertible). Sparse tables give O(1) min/max but cannot change. Segment trees are the most flexible: any associative operation, point *or* range updates.`,
    buildSteps: [
      'Choose the layout: one array `tree` of size `2n`; leaves at `tree[n + i] = arr[i]`; node `i` has children `2i` and `2i + 1`.',
      'Build internal nodes bottom-up: for `i` from `n - 1` down to `1`, `tree[i] = combine(tree[2i], tree[2i + 1])`. That is O(n).',
      '`update(index, value)`: set `tree[index + n] = value`, then for `i >>= 1` while `i >= 1` recompute `tree[i]` from its children.',
      '`query(left, right)` (inclusive): `l = left + n`, `r = right + n + 1` (half-open). While `l < r`: if `l` is odd take `tree[l++]` into `resLeft`; if `r` is odd take `tree[--r]` into `resRight`; then halve both.',
      'Return `combine(resLeft, resRight)`, starting both from `identity`.',
      'For the lazy version, switch to the recursive layout (`sum` and `lazy` arrays of size `4n`, node 1 covers `[0, n-1]`, children `2node`, `2node + 1`).',
      'Write `#apply(node, lo, hi, delta)` (add `delta * length` to the sum, add `delta` to the tag) and `#push` (apply the tag to both children, clear it).',
      '`rangeAdd` / `rangeSum`: return if no overlap; handle full cover directly; otherwise push, recurse into both halves, and (for add) recompute the node\'s sum.',
    ],
    operations: [
      { name: 'new SegmentTree(arr, combine = sum, identity = 0)', description: 'Build from an array.', time: 'O(n)' },
      { name: 'update(index, value)', description: 'Set `arr[index] = value` (assignment, not add).', time: 'O(log n)' },
      { name: 'query(left, right)', description: 'combine of `arr[left..right]`, inclusive.', time: 'O(log n)' },
      { name: 'new LazySegmentTree(arr)', description: 'Build a range-add / range-sum tree.', time: 'O(n)' },
      { name: 'rangeAdd(l, r, delta)', description: 'Add `delta` to every element in `[l, r]`.', time: 'O(log n)' },
      { name: 'rangeSum(l, r)', description: 'Sum of `[l, r]`, inclusive.', time: 'O(log n)' },
    ],
    space: 'O(n) — 2n slots for SegmentTree, 8n (two 4n arrays) for LazySegmentTree',
    usage: `// Range sum with point updates (Range Sum Query - Mutable)
const st = new SegmentTree([5, 2, 6, 1]);
st.query(0, 3); // 14
st.query(1, 3); // 9
st.update(2, 10); // arr is now [5, 2, 10, 1]
st.query(1, 3); // 13

// Range minimum: pass combine and identity
const minTree = new SegmentTree([4, 7, 1, 8, 3], Math.min, Infinity);
minTree.query(0, 1); // 4
minTree.query(1, 4); // 1
minTree.update(2, 9);
minTree.query(1, 4); // 3

// Range max via Math.max
const maxTree = new SegmentTree([4, 7, 1, 8, 3], Math.max, -Infinity);
maxTree.query(0, 2); // 7

// Range add + range sum with lazy propagation
const lazy = new LazySegmentTree([1, 2, 3, 4, 5]);
lazy.rangeSum(0, 4);   // 15
lazy.rangeAdd(1, 3, 10); // [1, 12, 13, 14, 5]
lazy.rangeSum(0, 4);   // 45
lazy.rangeSum(2, 2);   // 13`,
    whenToUse: [
      'Range queries (sum/min/max/gcd) **mixed with updates** on the same array.',
      'Range updates plus range queries (LazySegmentTree for add + sum).',
      'Counting problems over values: a segment tree indexed by value (after coordinate compression) counts how many seen values fall in a range.',
      'Interval problems like booking counts or falling squares, over compressed coordinates.',
    ],
    pitfalls: [
      '`update` **assigns** the new value; for "add delta" call `st.update(i, st.query(i, i) + delta)` or keep your own copy of the array.',
      'Ranges are **inclusive** on both ends: `query(l, r)` includes `arr[r]`.',
      'The identity must match the combine: using `0` with `Math.min` returns 0 for any all-positive array.',
      '`LazySegmentTree` only supports range **add** and range **sum** — min/max with range updates need a different apply/push.',
      'The array size is fixed at construction; for huge coordinate ranges (10^9), compress coordinates first.',
      'Do not build it with an empty array and then query — there is nothing to query.',
    ],
    usedIn: ['Range sum query (mutable)', 'Range minimum / maximum query', 'Lazy propagation', 'Counting inversions / smaller elements', 'Coordinate compression', 'Interval booking'],
    relatedTopics: ['advanced-structures', 'prefix-sum', 'trees', 'intervals'],
    practiceQuestions: ['range-sum-query-mutable', 'classic-range-minimum-query', 'classic-range-add-range-sum', 'my-calendar-iii', 'falling-squares', 'count-of-range-sum'],
  },

  // ---------------------------------------------------------------- Fenwick Tree
  {
    id: 'fenwick-tree',
    name: 'Fenwick Tree (Binary Indexed Tree)',
    file: 'FenwickTree.js',
    exports: ['FenwickTree'],
    category: 'Advanced',
    summary: 'A compact array that answers prefix sums and applies point additions in O(log n) each, using the lowest set bit of indices.',
    explanation: `A **Fenwick tree**, or **Binary Indexed Tree (BIT)**, solves the same "prefix sums that can change" problem as a segment tree, with far less code and one plain array of size n + 1.

**The idea: each slot stores the sum of a block whose size is a power of two.** Internally the tree is **1-indexed**. Slot \`i\` stores the sum of the \`lowbit(i)\` elements ending at position \`i\`, where \`lowbit(i)\` is the value of the lowest set bit of \`i\`:

\`\`\`
i (binary)   lowbit   tree[i] covers
1  (0001)      1      a1
2  (0010)      2      a1..a2
3  (0011)      1      a3
4  (0100)      4      a1..a4
5  (0101)      1      a5
6  (0110)      2      a5..a6
7  (0111)      1      a7
8  (1000)      8      a1..a8
\`\`\`

**The lowbit trick.** In JavaScript (two's complement), \`i & -i\` isolates the lowest set bit: \`6 & -6 = 2\`, \`12 & -12 = 4\`.

**prefixSum: walk down by removing the low bit.** To sum \`a1..a7\`: take \`tree[7]\` (a7), then \`7 - 1 = 6\`, take \`tree[6]\` (a5..a6), then \`6 - 2 = 4\`, take \`tree[4]\` (a1..a4), then \`4 - 4 = 0\`, stop. The blocks tile \`1..7\` exactly with no overlap. Each step clears one set bit of \`i\`, and a number has at most log₂ n + 1 bits, so this is **O(log n)**.

**add: walk up by adding the low bit.** Changing \`a3\` must update every block that contains position 3: \`tree[3]\`, then \`3 + 1 = 4\` (\`tree[4]\` covers 1..4), then \`4 + 4 = 8\`, and so on while \`i <= n\`. Each step moves the lowest set bit **up** at least one position, so again at most O(log n) steps.

**rangeSum(l, r)** = \`prefixSum(r) - prefixSum(l - 1)\`, the same trick as ordinary prefix sums. That only works because subtraction *undoes* addition. So a Fenwick tree handles **sums, counts and XOR** (anything with an inverse), but **not** range **min/max**; use a segment tree or sparse table for those.

**The toolkit API is 0-based.** You call \`add(index, delta)\`, \`prefixSum(index)\` and \`rangeSum(left, right)\` with normal array indices; the class adds 1 internally. \`prefixSum(index)\` includes \`index\`. \`FenwickTree.from(arr)\` builds from an array by calling \`add\` for every element, which is O(n log n).

**Counting with a Fenwick tree (the most common interview use).** Index the tree by **value** instead of position. Walking through the numbers, \`ft.prefixSum(v - 1)\` tells you how many numbers smaller than \`v\` you have already seen; then \`ft.add(v, 1)\`. That counts inversions, "smaller numbers after self" (walk from the right) and "teams" in O(n log n). If values are large or negative, **coordinate-compress** first: sort the distinct values and replace each value by its rank.`,
    buildSteps: [
      'Allocate `tree = new Array(n + 1).fill(0)`. Index 0 is unused because the lowbit walk stops at 0.',
      '`add(index, delta)`: convert to 1-based `i = index + 1`; while `i <= n`: `tree[i] += delta; i += i & -i`.',
      '`prefixSum(index)`: `i = index + 1`, `s = 0`; while `i > 0`: `s += tree[i]; i -= i & -i`. Return `s`.',
      '`rangeSum(left, right)`: `prefixSum(right) - (left > 0 ? prefixSum(left - 1) : 0)`.',
      '`static from(arr)`: create a tree of `arr.length` and `add(i, arr[i])` for each element.',
      'Check the tiling by hand for n = 8: `prefixSum(6)` (0-based) should visit tree slots 7, 6, 4.',
      'Test: `from([1, 2, 3, 4])`; `rangeSum(1, 2)` is 5; `add(1, 10)`; `rangeSum(1, 2)` is 15.',
    ],
    operations: [
      { name: 'new FenwickTree(n)', description: 'All-zero tree over n positions (0..n-1).', time: 'O(n)' },
      { name: 'FenwickTree.from(arr)', description: 'Build from an array (n additions).', time: 'O(n log n)' },
      { name: 'add(index, delta)', description: '`arr[index] += delta` (0-based).', time: 'O(log n)' },
      { name: 'prefixSum(index)', description: 'Sum of `arr[0..index]`, inclusive.', time: 'O(log n)' },
      { name: 'rangeSum(left, right)', description: 'Sum of `arr[left..right]`, inclusive.', time: 'O(log n)' },
    ],
    space: 'O(n)',
    usage: `const ft = FenwickTree.from([5, 2, 6, 1]);
ft.prefixSum(2);   // 13  (5 + 2 + 6)
ft.rangeSum(1, 3); // 9   (2 + 6 + 1)
ft.add(2, 4);      // arr is now [5, 2, 10, 1]
ft.rangeSum(1, 3); // 13

// "Set" instead of "add": keep your own copy and add the difference
const arr = [5, 2, 10, 1];
function setValue(i, value) {
  ft.add(i, value - arr[i]);
  arr[i] = value;
}
setValue(0, 1);
ft.prefixSum(3);   // 14

// Count of smaller numbers after self, indexed by (compressed) value
function countSmaller(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const rank = new Map(sorted.map((v, i) => [v, i]));
  const bit = new FenwickTree(sorted.length);
  const out = new Array(nums.length);
  for (let i = nums.length - 1; i >= 0; i--) {
    const r = rank.get(nums[i]);
    out[i] = r > 0 ? bit.prefixSum(r - 1) : 0; // how many smaller values seen to the right
    bit.add(r, 1);
  }
  return out;
}
countSmaller([5, 2, 6, 1]); // [2, 1, 1, 0]`,
    whenToUse: [
      'Prefix / range **sums** with point updates, when you want less code than a segment tree.',
      'Counting "how many earlier (or later) elements are smaller/larger" — inversions, teams, smaller after self.',
      'Frequency tables over values that change as you scan.',
      'Range add + point query: store a difference array in the BIT (add at l, subtract at r + 1, read with prefixSum).',
    ],
    pitfalls: [
      'Only for **invertible** operations (sum, count, XOR). Range min/max does not work because you cannot "subtract" a min.',
      '`add` adds a **delta**; to set a value, add `newValue - oldValue` and keep the old values yourself.',
      'The API is 0-based and `prefixSum(i)` is **inclusive**. `prefixSum(-1)` safely returns 0.',
      'Indexing by value needs coordinate compression when values are large, negative, or sparse.',
      '`FenwickTree.from` is O(n log n), not O(n) — fine for interviews, but know the difference.',
      '`i & -i` relies on 32-bit integer semantics, so indices must stay below 2^31 (always true for array sizes).',
    ],
    usedIn: ['Prefix sums with updates', 'Inversion counting', 'Count smaller after self', 'Coordinate compression', 'Order statistics by value', 'Difference array + BIT'],
    relatedTopics: ['advanced-structures', 'prefix-sum', 'bit-manipulation', 'sorting'],
    practiceQuestions: ['range-sum-query-mutable', 'count-of-smaller-numbers-after-self', 'count-number-of-teams', 'queries-on-a-permutation-with-key', 'reverse-pairs', 'create-sorted-array-through-instructions'],
  },

  // ---------------------------------------------------------------- Sparse Table
  {
    id: 'sparse-table',
    name: 'Sparse Table',
    file: 'SparseTable.js',
    exports: ['SparseTable'],
    category: 'Advanced',
    summary: 'Precomputes min/max over every power-of-two-length block so range min/max queries on a fixed array take O(1).',
    explanation: `If the array **never changes** and you need to answer many "minimum (or maximum) of \`arr[l..r]\`" questions, a **sparse table** gives each answer in **O(1)** after an O(n log n) setup.

**The idea: precompute answers for every block whose length is a power of two.** Row \`k\` of the table stores the minimum of every block of length \`2^k\`:

\`\`\`
arr        = [4, 6, 1, 5, 7, 3]      index 0..5
k=0 (len 1): [4, 6, 1, 5, 7, 3]
k=1 (len 2): [4, 1, 1, 5, 3]         table[1][i] = min(arr[i], arr[i+1])
k=2 (len 4): [1, 1, 1]               table[2][i] = min(table[1][i], table[1][i+2])
\`\`\`

**Building is dynamic programming.** A block of length \`2^k\` starting at \`i\` is two blocks of length \`2^(k-1)\`: one starting at \`i\` and one at \`i + 2^(k-1)\`. So each row is built from the previous one in O(n):

\`\`\`js
table[k][i] = combine(table[k-1][i], table[k-1][i + (1 << (k-1))])
\`\`\`

There are ⌊log₂ n⌋ + 1 rows, so building costs **O(n log n)** time and memory.

**Why a query is O(1): two overlapping blocks.** For \`[l, r]\` with length \`len = r - l + 1\`, pick the largest \`k\` with \`2^k ≤ len\`. Then two blocks of length \`2^k\`, one starting at \`l\` and one ending at \`r\`, together cover the whole range. They may **overlap** in the middle:

\`\`\`
query(1, 5): len = 5, k = 2 (block length 4)
index:     0  1  2  3  4  5
               [ block at 1 ]            table[2][1] = min(6,1,5,7) = 1
                   [ block at 2 ]        table[2][2] = min(1,5,7,3) = 1
answer = min(1, 1) = 1
\`\`\`

Counting the middle elements twice is harmless for **min** and **max**, because \`min(x, x) = x\`. Operations with that property are called **idempotent** (min, max, gcd, bitwise AND/OR). Two table lookups plus one precomputed \`log\` lookup: **O(1)**.

**Why it does not work for sums.** Overlap double-counts: the sum of the two blocks above would include indices 2..4 twice. For sums use prefix sums (static) or a Fenwick / segment tree (changing).

**The toolkit version.** \`new SparseTable(arr, combine = Math.min)\` precomputes \`log[len]\` for every length (so queries never call \`Math.log2\`, avoiding floating-point surprises), stores row 0 as a copy of \`arr\`, then builds each next row. \`query(left, right)\` is inclusive.

**Trade-offs at a glance.**

| | build | query | update |
|---|---|---|---|
| Sparse table | O(n log n) | **O(1)** | not supported |
| Segment tree | O(n) | O(log n) | O(log n) |
| Monotonic deque | — | O(1) amortized, but only for a *sliding* window | — |

Sparse tables also appear inside bigger algorithms: LCA via Euler tour + RMQ, and binary lifting (a closely related "powers of two" table over ancestors).`,
    buildSteps: [
      'Precompute `log[i] = floor(log2(i))` for `i` from 1 to n with the recurrence `log[i] = log[i >> 1] + 1` (and `log[1] = 0`).',
      'Row 0 is a copy of the array: `table = [arr.slice()]`.',
      'For each `k` while `(1 << k) <= n`: build a row of length `n - (1 << k) + 1` where `row[i] = combine(prev[i], prev[i + (1 << (k - 1))])`.',
      '`query(left, right)`: `k = log[right - left + 1]`; return `combine(table[k][left], table[k][right - (1 << k) + 1])`.',
      'Accept `combine` as a parameter, defaulting to `Math.min`, but document that it must be idempotent.',
      'Test on `[4, 6, 1, 5, 7, 3]`: `query(0, 1)` is 4, `query(1, 5)` is 1, `query(3, 5)` is 3, `query(4, 4)` is 7.',
    ],
    operations: [
      { name: 'new SparseTable(arr, combine = Math.min)', description: 'Precompute all power-of-two blocks.', time: 'O(n log n)' },
      { name: 'query(left, right)', description: 'combine of `arr[left..right]`, inclusive (idempotent combine only).', time: 'O(1)' },
    ],
    space: 'O(n log n)',
    usage: `const arr = [4, 6, 1, 5, 7, 3];
const minTable = new SparseTable(arr);            // Math.min by default
minTable.query(0, 1); // 4
minTable.query(1, 5); // 1
minTable.query(3, 5); // 3
minTable.query(4, 4); // 7

const maxTable = new SparseTable(arr, Math.max);
maxTable.query(0, 3); // 6
maxTable.query(2, 5); // 7

// gcd is idempotent too
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const gcdTable = new SparseTable([12, 18, 24, 9], gcd);
gcdTable.query(0, 2); // 6
gcdTable.query(0, 3); // 3

// Longest subarray where max - min <= limit, using two tables + two pointers
function longestSubarray(nums, limit) {
  const mn = new SparseTable(nums, Math.min);
  const mx = new SparseTable(nums, Math.max);
  let best = 0;
  for (let l = 0, r = 0; r < nums.length; r++) {
    while (mx.query(l, r) - mn.query(l, r) > limit) l++;
    best = Math.max(best, r - l + 1);
  }
  return best;
}
longestSubarray([8, 2, 4, 7], 4); // 2`,
    whenToUse: [
      'The array is **static** and you face many range min/max/gcd queries.',
      'You need O(1) per query because there are a huge number of queries.',
      'Replacing a monotonic deque when the ranges are arbitrary rather than a sliding window.',
      'As a building block for LCA (Euler tour + RMQ) or as practice for binary lifting.',
    ],
    pitfalls: [
      'Only for **idempotent** operations (min, max, gcd, AND, OR). Using it for sums silently double-counts the overlap.',
      'No updates: if the array changes you must rebuild (O(n log n)); use a segment tree instead.',
      'Memory is O(n log n) — for n = 10^6 that is about 20 million entries.',
      'Ranges are inclusive: `query(l, r)` with `l > r` is invalid.',
      'Passing `Math.min` works because it takes two arguments here; do not pass `(...xs) => Math.min(...xs)` with arrays by mistake.',
    ],
    usedIn: ['Range minimum query (RMQ)', 'Range maximum query', 'Range GCD', 'LCA via Euler tour', 'Binary lifting', 'Two pointers + RMQ'],
    relatedTopics: ['advanced-structures', 'dp-1d', 'bit-manipulation', 'sliding-window'],
    practiceQuestions: ['classic-range-minimum-query', 'sliding-window-maximum', 'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit'],
  },
];
