export default {
  id: 'queue-deque',
  summary: 'A queue serves items in arrival order (first in, first out); a deque lets you add and remove at both ends. Kept in sorted order, a monotonic deque gives the maximum or minimum of every sliding window — and speeds up "best of the last k" DP — in O(n).',

  jsTools: [
    { api: 'Queue (toolkit)', use: 'enqueue / dequeue / front / size with a head pointer — all O(1)', complexity: 'O(1) amortized' },
    { api: 'Deque (toolkit)', use: 'pushBack / pushFront / popBack / popFront / front / back on a circular buffer', complexity: 'O(1) amortized' },
    { api: 'arr.push + head index', use: 'Hand-rolled queue: read arr[head++] instead of arr.shift()', complexity: 'O(1)' },
    { api: 'arr.shift()', use: 'AVOID in hot loops: removes index 0 and moves every other element', complexity: 'O(n)' },
    { api: '(i + 1) % capacity', use: 'Wrap an index around a fixed-size circular buffer', complexity: 'O(1)' },
    { api: 'new Array(n).fill(0)', use: 'Fixed storage for circular buffers and DP arrays', complexity: 'O(n)' },
  ],

  patterns: [
    {
      id: 'queue-simulation',
      name: 'Queue — FIFO Simulation',
      summary: 'Model a process where items are served in arrival order: take from the front, maybe put it back at the end, repeat.',
      whyItExists: 'Many real processes are "first come, first served" (lines, rounds, requests in a time window). A queue expresses that directly and each step is O(1), so a simulation of m steps costs O(m).',
      whenToUse: [
        'Items take turns in rounds (round-robin, ticket lines, senate voting)',
        'Keep only recent events (requests in the last 3000 ms)',
        'Stream processing where the oldest element expires first',
        'Level-by-level exploration (BFS, covered in Trees and Graphs)',
      ],
      clues: ['"in order of arrival"', '"take turns"', '"goes to the back of the line"', '"in the last t milliseconds"', '"rounds"', '"first unique so far"'],
      whenNotToUse: [
        'Always serving the smallest/largest element rather than the oldest → priority queue (heap)',
        'The most recent item must be handled first → stack',
        'A closed-form count exists (e.g. ticket times can be computed without simulating)',
      ],
      template: `function simulate(items) {
  const q = new Queue(items);          // toolkit Queue: O(1) dequeue
  while (!q.isEmpty()) {
    const x = q.dequeue();             // serve the oldest
    // ... process x ...
    // if (needsAnotherTurn(x)) q.enqueue(x);  // back of the line
  }
}`,
      variations: [
        { name: 'Time-window queue', description: 'Push each timestamp; pop from the front while it is older than now − window. The size is the count in the window.' },
        { name: 'Round-robin with re-queue', description: 'Dequeue, act, enqueue again if still active (senate, tickets).' },
        { name: 'Reverse simulation', description: 'Run the process backwards with a deque to construct an input that produces a desired output (reveal cards).' },
      ],
      mistakes: [
        'Using arr.shift() in a loop — O(n) per call, O(n²) overall',
        'Simulating second-by-second when a formula or event-based step is possible',
      ],
      evolution: {
        easy: 'Recent calls counter, ticket line, first unique character.',
        medium: 'Dota2 senate (two queues), reveal cards (reverse simulation with a deque).',
        hard: 'Multi-source BFS and time-based simulations (later topics).',
      },
    },
    {
      id: 'circular-buffer',
      name: 'Circular Buffer (Ring Buffer) Design',
      summary: 'A fixed-size array plus a head index and a count. Indices wrap around with modulo, so the queue never shifts elements and never grows.',
      whyItExists: 'A plain array used as a queue either shifts (O(n)) or leaks memory at the front. A ring buffer reuses the freed front slots: the logical queue "wraps around" the physical array, giving O(1) operations in O(capacity) memory.',
      whenToUse: [
        'Bounded queues/deques (buffers, rate limiters, the last k items)',
        'Design problems: circular queue / circular deque',
        'Implementing a deque with O(1) push/pop at both ends',
      ],
      clues: ['"design your implementation of the circular queue"', '"fixed size k"', '"isFull"', '"ring buffer"', '"insertFront / insertLast"'],
      whenNotToUse: [
        'Unbounded size is needed → grow the buffer (toolkit Deque doubles capacity) or use a head-pointer queue',
      ],
      template: `class RingQueue {
  constructor(k) { this.buf = new Array(k); this.head = 0; this.count = 0; }
  push(x) {
    if (this.count === this.buf.length) return false;              // full
    this.buf[(this.head + this.count) % this.buf.length] = x;       // tail slot
    this.count++; return true;
  }
  pop() {
    if (this.count === 0) return false;                             // empty
    this.head = (this.head + 1) % this.buf.length;
    this.count--; return true;
  }
  front() { return this.count ? this.buf[this.head] : -1; }
  rear()  { return this.count ? this.buf[(this.head + this.count - 1) % this.buf.length] : -1; }
}`,
      variations: [
        { name: 'Front insertion', description: 'head = (head − 1 + k) % k, then write buf[head] (add k before % because JS % keeps the sign of the left operand).' },
        { name: 'head + tail pointers', description: 'Store tail instead of count; then you need count or one empty slot to tell full from empty.' },
      ],
      mistakes: [
        'Negative modulo: (0 − 1) % k is −1 in JavaScript — write (i − 1 + k) % k',
        'Not distinguishing full from empty when head === tail (keep a count)',
      ],
      evolution: {
        easy: 'Moving average from a data stream (fixed window).',
        medium: 'Design circular queue / circular deque.',
        hard: 'Growable deques, lock-free ring buffers (systems design).',
      },
    },
    {
      id: 'monotonic-deque-window',
      name: 'Monotonic Deque — Sliding Window Max / Min',
      summary: 'Keep a deque of indices whose values are decreasing (for max) or increasing (for min). The front is the window\'s extreme; pop the back when a better value arrives and pop the front when it leaves the window.',
      whyItExists: 'Recomputing the max of each window is O(k) per window. A newer, bigger value makes every older, smaller value useless forever (it leaves the window first and is never larger). Discarding those keeps the deque sorted, so the maximum is always at the front, and each index enters and leaves once: O(n) total.',
      whenToUse: [
        'Maximum or minimum of every window of size k',
        'Variable windows whose validity depends on max − min (keep two deques)',
        'Any "best among the last k positions" query while scanning left to right',
      ],
      clues: ['"sliding window maximum"', '"max − min ≤ limit"', '"maximum of each window of size k"', '"within k steps"', 'window + max/min'],
      whenNotToUse: [
        'Queries over arbitrary (non-sliding) ranges → sparse table / segment tree',
        'You need the k-th largest or the median of the window → heaps / ordered sets',
      ],
      template: `function windowMax(nums, k) {
  const dq = new Deque();              // indices; nums[...] decreasing front → back
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack(); // dominated
    dq.pushBack(i);
    if (dq.front() <= i - k) dq.popFront();                          // left the window
    if (i >= k - 1) res.push(nums[dq.front()]);                       // front = max
  }
  return res;
}`,
      variations: [
        { name: 'Window minimum', description: 'Flip the comparison: pop back while nums[back] >= nums[i].' },
        { name: 'Two deques (max and min)', description: 'Variable window valid while max − min ≤ limit; shrink left and pop fronts whose index < left.' },
      ],
      mistakes: [
        'Storing values instead of indices — you cannot tell when the front has left the window',
        'Checking expiry with the wrong bound (front <= i − k is the one that left)',
        'Using arr.shift() for popFront — O(n) per call',
      ],
      evolution: {
        easy: '—',
        medium: 'Longest subarray with max − min ≤ limit (two deques + variable window).',
        hard: 'Sliding window maximum; deque-optimised DP.',
      },
    },
    {
      id: 'monotonic-deque-prefix-sum',
      name: 'Monotonic Deque over Prefix Sums',
      summary: 'For "shortest subarray with sum ≥ k" with negative numbers, scan prefix sums P and keep a deque of indices with increasing P. Pop the front while it forms a valid subarray; pop the back when a smaller prefix arrives.',
      whyItExists: 'With negatives a sliding window breaks (shrinking can raise the sum). Subarray sums are differences P[j] − P[i]. For a fixed end j we want the latest start i with P[i] ≤ P[j] − k. A start whose prefix is larger than a later prefix is never useful (the later one is both smaller and closer), so the candidates form an increasing deque; each index enters and leaves once.',
      whenToUse: [
        'Shortest subarray with sum ≥ k when numbers can be negative',
        'Circular variants: prefix sums over the doubled array with a length cap',
      ],
      clues: ['"shortest subarray"', '"sum at least k"', '"can be negative"', 'prefix sums + window length'],
      whenNotToUse: [
        'All numbers are non-negative → a plain variable sliding window is simpler',
        'Sum exactly k (count or longest) → prefix sums + hash map',
      ],
      template: `function shortestSubarray(nums, k) {
  const P = [0];
  for (const x of nums) P.push(P[P.length - 1] + x);
  const dq = new Deque();                // indices with increasing P
  let best = Infinity;
  for (let j = 0; j < P.length; j++) {
    while (!dq.isEmpty() && P[j] - P[dq.front()] >= k) best = Math.min(best, j - dq.popFront());
    while (!dq.isEmpty() && P[dq.back()] >= P[j]) dq.popBack();
    dq.pushBack(j);
  }
  return best === Infinity ? -1 : best;
}`,
      variations: [
        { name: 'Circular length-capped', description: 'Maximum circular subarray: prefix sums over 2n elements, deque front expires when j − front > n.' },
      ],
      mistakes: [
        'Using a plain sliding window with negatives',
        'Not popping the front after it is used — a later j would only give a longer subarray with that start',
        'Forgetting P[0] = 0 (subarrays that start at index 0)',
      ],
      evolution: {
        easy: '—',
        medium: 'Minimum size subarray sum (positive numbers, sliding window).',
        hard: 'Shortest subarray with sum at least K (negatives).',
      },
    },
    {
      id: 'monotonic-deque-dp',
      name: 'Monotonic Deque — Optimising "best of the last k" DP',
      summary: 'When dp[i] = value[i] + max(dp[i−k..i−1]), the inner max is a sliding window maximum over the dp array itself — keep a decreasing deque of dp indices and the whole DP runs in O(n).',
      whyItExists: 'The recurrence is a sliding-window maximum problem in disguise: each dp[i] needs the best of the previous k dp values. Doing that with a loop is O(n·k); a monotonic deque answers it in O(1) amortized.',
      whenToUse: [
        '"Jump at most k steps", maximise/minimise the collected score',
        '"Subsequence where consecutive chosen indices are at most k apart"',
        'Any 1-D DP whose transition is max/min over a sliding range of previous states',
      ],
      clues: ['"at most k steps forward"', '"j − i <= k"', '"maximum score to reach the last index"', 'n and k both up to 10^5'],
      whenNotToUse: [
        'The transition range is not a sliding window (arbitrary earlier states) → segment tree or different DP',
        'The transition needs more than max/min (e.g. sums with extra terms) → other optimisations',
      ],
      template: `// best[i] = "best score to reach i" = nums[i] + max(best[i-k .. i-1])
function bestScore(nums, k) {
  const best = new Array(nums.length);
  const dq = new Deque();                         // indices, best[...] decreasing
  for (let i = 0; i < nums.length; i++) {
    if (!dq.isEmpty() && dq.front() < i - k) dq.popFront();    // out of reach
    best[i] = nums[i] + (dq.isEmpty() ? 0 : best[dq.front()]);
    while (!dq.isEmpty() && best[dq.back()] <= best[i]) dq.popBack();
    dq.pushBack(i);
  }
  return best[nums.length - 1];
}`,
      variations: [
        { name: 'Optional previous state', description: 'Constrained subsequence sum: best[i] = nums[i] + max(0, window max) — you may start fresh.' },
        { name: 'Minimisation', description: 'Increasing deque for "minimum cost within k steps".' },
      ],
      mistakes: [
        'Expiring the front after computing best[i] instead of before',
        'Forgetting that the start index may be forced (jump game) or optional (subsequence)',
        'Nested loop over the last k states — O(n·k) times out',
      ],
      evolution: {
        easy: '—',
        medium: 'Jump Game VI.',
        hard: 'Constrained Subsequence Sum; DP with two-dimensional windows.',
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
            md: `A **queue** is a line: items join at the **back** and leave from the **front**. The first item that went in is the first one to come out — **FIFO**, *First In, First Out*.

\`\`\`text
enqueue 1, 2, 3        front → [1, 2, 3] ← back
dequeue → 1                    [2, 3]
enqueue 4                      [2, 3, 4]
\`\`\`

A **deque** (say "deck", short for *double-ended queue*) allows adding and removing at **both** ends: \`pushFront\`, \`pushBack\`, \`popFront\`, \`popBack\`. A deque can act as a stack, a queue, or — as you will see — something smarter.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogies',
            md: '- **Queue:** the line at a coffee shop. New customers join at the back; the barista serves the front.\n- **Deque:** a train platform with doors at both ends — passengers can board or leave from either end, but never from the middle.',
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms',
            md: `- **FIFO** — first in, first out (queue). Compare **LIFO** (stack).
- **Front / head** — where items leave. **Back / tail / rear** — where items join.
- **Enqueue / dequeue** — add at the back / remove from the front.
- **Circular buffer (ring buffer)** — a fixed-size array whose indices wrap around with \`% capacity\`.
- **Monotonic deque** — a deque whose values are kept sorted from front to back, by popping from the back before each push.`,
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-1',
            question: 'Starting empty, you enqueue 5, 8, 2, dequeue once, enqueue 9, then dequeue twice. What do the dequeues return, in order?',
            options: [
              '5, then 8, 2',
              '2, then 9, 8',
              '5, then 2, 9',
              '9, then 2, 8',
            ],
            answer: 0,
            explanation: 'Queue after enqueues: [5, 8, 2]. Dequeue → 5, leaving [8, 2]. Enqueue 9 → [8, 2, 9]. Two dequeues → 8, then 2.',
            misconceptions: {
              1: 'That is stack order (last in, first out). A queue always removes the OLDEST item.',
              2: 'After removing 5, the oldest remaining item is 8, not 2 — items leave in exactly the order they arrived.',
              3: '9 arrived last, so it leaves last. This answer mixes stack and queue behaviour.',
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
            md: `Queues model **fairness and time**: requests served in arrival order, events that expire oldest-first, rounds of a game, and — later in the course — **breadth-first search (BFS)**, which explores a tree or graph level by level by always processing the node discovered earliest.

Deques add one superpower: because you can drop items from the **back** as well as the front, you can keep a deque **sorted** while a window slides. That gives:
- the **maximum/minimum of every window** in O(n) instead of O(n·k);
- **shortest subarray with sum ≥ k** even with negative numbers;
- **"best of the last k"** dynamic programming in O(n).`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript trap: Array.prototype.shift() is O(n)',
            md: `\`arr.shift()\` removes index 0 and then **re-indexes every remaining element** (index 1 becomes 0, 2 becomes 1, …). For a queue of 10^5 items processed in a loop that is ~5·10^9 moves — seconds instead of milliseconds. (Engines have some small-array tricks, but you cannot rely on them.)

Fixes:
- keep a **head index**: read \`arr[head++]\` instead of shifting (the toolkit \`Queue\` does this and compacts occasionally);
- use a **circular buffer** (the toolkit \`Deque\`), which is O(1) at both ends.`,
          },
          {
            type: 'compare',
            left: {
              title: 'shift() — O(n) per dequeue',
              code: `const q = [start];
while (q.length) {
  const x = q.shift();     // moves every element
  for (const y of next(x)) q.push(y);
}`,
            },
            right: {
              title: 'head pointer — O(1) per dequeue',
              code: `const q = [start];
let head = 0;
while (head < q.length) {
  const x = q[head++];     // just move the index
  for (const y of next(x)) q.push(y);
}`,
            },
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-2',
            question: 'Why is `q[head++]` O(1) while `q.shift()` is O(n)?',
            options: [
              'Because head++ uses less memory',
              'Because shift() must move every remaining element one slot to the left, while head++ only changes a counter and leaves the elements where they are',
              'Because shift() sorts the array',
              'They are both O(1) in modern engines, so it does not matter',
            ],
            answer: 1,
            explanation: 'An array is a contiguous block indexed from 0. Removing the first element means every other element must get a new index. With a head pointer, we simply remember where the logical front is — nothing moves.',
            misconceptions: {
              0: 'The head-pointer version actually keeps dead elements in memory (until compaction). Its advantage is time, not memory.',
              2: 'shift() does not sort; it re-indexes.',
              3: 'Some engines optimise small arrays, but in general and for large arrays shift() is linear. Interviewers expect you to know this.',
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
            md: `| Situation | Tool |
|---|---|
| Serve in arrival order, rounds, "back of the line" | **queue** simulation |
| Keep only events inside a time window | **queue** (pop expired from the front) |
| Bounded buffer, design problems with isFull/isEmpty | **circular buffer** |
| Max/min of every window | **monotonic deque** |
| max − min of a window must stay ≤ limit | **two monotonic deques** + variable window |
| Shortest subarray with sum ≥ k, negatives allowed | **monotonic deque over prefix sums** |
| dp[i] = value + best of the previous k states | **monotonic deque DP** |
| Level-by-level exploration of trees/graphs | **queue** (BFS — Trees and Graphs topics) |`,
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-3',
            question: 'Which task needs a **priority queue (heap)** rather than a plain FIFO queue?',
            options: [
              'Count requests in the last 3000 ms',
              'Always process the task with the earliest deadline, regardless of when it was added',
              'Simulate people buying tickets in a line',
              'Visit the nodes of a tree level by level',
            ],
            answer: 1,
            explanation: 'A FIFO queue orders by arrival time. "Earliest deadline regardless of arrival" is ordering by a key — that is a priority queue (heaps topic).',
            misconceptions: {
              0: 'Requests arrive in time order, so the oldest one also expires first — FIFO fits perfectly.',
              2: 'A ticket line is the definition of FIFO.',
              3: 'Level order is BFS, which uses a plain FIFO queue.',
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
            clues: ['"in the order they arrive"', '"moves to the end of the line"', '"in the last t ms"', '"circular queue / deque"', '"maximum of each window"', '"max − min ≤ limit"', '"shortest subarray, sum ≥ k" with negatives', '"at most k steps"'],
            conclusion: 'Think Queue / Deque (monotonic deque for window extremes)',
          },
          {
            type: 'text',
            md: `The monotonic deque is recognised by **two ingredients at once**:
1. a **window** (fixed size k, a variable window, or "within k steps"), and
2. a need for the window's **maximum or minimum** (or of dp values over the window).

A window alone → sliding window. Max/min alone over the whole prefix → a running variable. Both together → deque.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition — queues and circular buffers',
        blocks: [
          {
            type: 'text',
            md: `A **circular buffer** stores a queue in a fixed array of size \`cap\`, remembering \`head\` (index of the front) and \`count\` (number of items).

- The back slot is \`(head + count) % cap\`.
- Enqueue writes there and does \`count++\`.
- Dequeue does \`head = (head + 1) % cap\` and \`count--\`.

When the back reaches the end of the array it simply **wraps around** to index 0, reusing slots freed by dequeues. Nothing ever shifts.

\`\`\`text
cap = 4, after enqueue a b c d, dequeue ×2, enqueue e f:
index:  0   1   2   3
        e   f   c   d        head = 2, count = 4
        ↑back wrapped  ↑front
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Negative modulo in JavaScript',
            md: '`%` in JavaScript keeps the sign of the left operand: `(0 - 1) % 4 === -1`, not 3. When moving an index backwards (pushFront, rear), write `(i - 1 + cap) % cap`.',
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-4',
            question: 'A circular queue has capacity 5, `head = 3` and `count = 4`. At which array index is the **rear** (last) element?',
            options: [
              '7',
              '6',
              '2',
              '1',
            ],
            answer: 2,
            explanation: 'The rear is at (head + count − 1) % cap = (3 + 4 − 1) % 5 = 6 % 5 = 1. The elements occupy indices 3, 4, 0, 1.',
            misconceptions: {
              0: '7 is head + count, which is past the end of the array. You must wrap with % 5, and the rear is at head + count − 1.',
              1: 'head + count − 1 = 6 — but the array only has indices 0..4. Apply % 5.',
              3: '(3 + 4) % 5 = 2 is the NEXT free slot (where the next enqueue would write), not the current rear.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach — sliding window maximum',
        blocks: [
          {
            type: 'text',
            md: 'The flagship deque problem: for `nums = [1, 3, -1, -3, 5, 3, 6, 7]` and `k = 3`, return the maximum of every window of size 3: `[3, 3, 5, 5, 6, 7]`. A running sum can be updated in O(1) when the window slides — a running **max** cannot: when the current maximum leaves, what is the new maximum?',
          },
          {
            type: 'code',
            title: 'Brute force — O(n·k)',
            code: `function maxSlidingWindow(nums, k) {
  const res = [];
  for (let i = 0; i + k <= nums.length; i++) {
    let m = -Infinity;
    for (let j = i; j < i + k; j++) m = Math.max(m, nums[j]);
    res.push(m);
  }
  return res;
}`,
            caption: 'n = 10^5 and k = 5·10^4 means ~2.5·10^9 comparisons.',
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-5',
            question: 'The window is `[1, 3, -1]` and next it becomes `[3, -1, -3]`, then `[-1, -3, 5]`. When 5 enters, which older elements can **never again** be a window maximum?',
            options: [
              'Only -3',
              'None — each may still be the maximum of some later window',
              'Only the elements that already left the window',
              'Both -1 and -3: they are older AND smaller than 5, so every future window containing them also contains 5',
            ],
            answer: 3,
            explanation: 'Any future window that still contains -1 or -3 also contains 5 (it arrived later, so it leaves later), and 5 is bigger. They are dominated forever. That is exactly what the monotonic deque throws away.',
            misconceptions: {
              0: '-1 is also older and smaller than 5, so it is dominated too.',
              1: 'An older, smaller element can never beat a newer, larger one in any window that holds both — and the newer one is in every such window.',
              2: 'Elements that left are gone anyway; the key insight is about elements still INSIDE the window.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — the monotonic deque',
        blocks: [
          {
            type: 'text',
            md: `Keep a deque of **indices** of elements that could still be a maximum. Their values are **decreasing** from front to back. For each new index \`i\`:

1. **Pop the back** while \`nums[back] <= nums[i]\` — those are dominated by the newcomer.
2. **Push** \`i\` to the back.
3. **Pop the front** if it is outside the window (\`front <= i − k\`).
4. Once the first window is complete (\`i >= k − 1\`), the **front** is the maximum.

Why the front? The deque is decreasing, so the front holds the largest value among all candidates still inside the window.`,
          },
          {
            type: 'visual',
            scenario: 'monotonic-deque',
            input: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
            caption: 'Smaller values are evicted from the back when a bigger one arrives; the front expires when it leaves the window.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why O(n)?',
            md: 'Each index is pushed once and popped at most once (from the back **or** the front). Over the whole run there are at most n pushes and n pops, so the total work is O(n) even though there is a `while` loop. Compare the monotonic stack: the deque is the same idea, plus the ability to expire elements from the other end.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why we store **indices** rather than values in the deque?',
            deeper: 'To expire the front we need to know **where** it came from: "is its index ≤ i − k?". A value alone cannot tell you that (and duplicates would be ambiguous). With indices we can compare positions and still read the value as `nums[index]`.',
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-6',
            question: 'In the max-deque, we pop the back while `nums[back] <= nums[i]`. What would go wrong if we used `<` (keeping equal values)?',
            options: [
              'The answers would become wrong',
              'Nothing breaks — equal values are kept, the deque becomes non-increasing, and answers stay correct; `<=` just keeps the deque smaller',
              'The algorithm becomes O(n²)',
              'The front would expire too early',
            ],
            answer: 1,
            explanation: 'With `<`, an older equal value stays in front of the newer one. When it expires the newer copy is still there, so the maximum is correct either way. `<=` removes the redundant older copy. Both are O(n). (For other problems — e.g. "leftmost index of the maximum" — the choice matters, so decide deliberately.)',
            misconceptions: {
              0: 'Equal values have the same value; whichever copy is at the front reports the same maximum.',
              2: 'Each index is still pushed and popped at most once, so it stays O(n).',
              3: 'Expiry is decided by index, not by value, so it is unaffected.',
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
            title: 'Monotonic deque — window maximum (flip comparisons for minimum)',
            code: `const dq = new Deque();              // indices, values decreasing
for (let i = 0; i < n; i++) {
  while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack(); // 1. dominated
  dq.pushBack(i);                                                   // 2. candidate
  if (dq.front() <= i - k) dq.popFront();                           // 3. expired
  if (i >= k - 1) res.push(nums[dq.front()]);                        // 4. answer
}`,
          },
          {
            type: 'code',
            title: 'Variable window with two deques (max − min ≤ limit)',
            code: `let left = 0, best = 0;
for (let right = 0; right < n; right++) {
  while (!maxD.isEmpty() && nums[maxD.back()] < nums[right]) maxD.popBack();
  maxD.pushBack(right);
  while (!minD.isEmpty() && nums[minD.back()] > nums[right]) minD.popBack();
  minD.pushBack(right);
  while (nums[maxD.front()] - nums[minD.front()] > limit) {
    left++;
    if (maxD.front() < left) maxD.popFront();
    if (minD.front() < left) minD.popFront();
  }
  best = Math.max(best, right - left + 1);
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
            title: 'Sliding window maximum with the toolkit Deque',
            code: `function maxSlidingWindow(nums, k) {
  const dq = new Deque();
  const res = [];
  for (let i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && nums[dq.back()] <= nums[i]) dq.popBack();
    dq.pushBack(i);
    if (dq.front() <= i - k) dq.popFront();
    if (i >= k - 1) res.push(nums[dq.front()]);
  }
  return res;
}`,
          },
          {
            type: 'code',
            title: 'Without the toolkit: array + head index as a deque',
            code: `// popFront = head++, popBack = arr.pop(), front = arr[head], back = arr[arr.length - 1]
const dq = [];
let head = 0;
for (let i = 0; i < nums.length; i++) {
  while (dq.length > head && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
  dq.push(i);
  if (dq[head] <= i - k) head++;
  if (i >= k - 1) res.push(nums[dq[head]]);
}`,
            caption: 'Works because a monotonic deque never needs pushFront: items only enter at the back.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- The toolkit \`Queue\` has \`enqueue / dequeue / front / isEmpty / size\`; \`Deque\` has \`pushBack / pushFront / popBack / popFront / front / back / get(i) / size\`. Both are O(1) amortized.
- \`arr.pop()\` is O(1) (back of a deque); \`arr.shift()\` / \`arr.unshift()\` are O(n) (front).
- Check \`isEmpty()\` before \`front()\`/\`back()\` — they return \`undefined\` on an empty deque, and \`nums[undefined]\` is \`undefined\`, which silently makes comparisons false.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)',
            columns: ['i', 'nums[i]', 'pop back', 'expire front', 'deque (values)', 'output'],
            rows: [
              ['0', '1', '—', '—', '[1]', ''],
              ['1', '3', '1', '—', '[3]', ''],
              ['2', '-1', '—', '—', '[3, -1]', '3'],
              ['3', '-3', '—', '—', '[3, -1, -3]', '3'],
              ['4', '5', '-3, -1, 3', '—', '[5]', '5'],
              ['5', '3', '—', '—', '[5, 3]', '5'],
              ['6', '6', '3, 5', '—', '[6]', '6'],
              ['7', '7', '6', '—', '[7]', '7'],
            ],
            note: 'Here the front never needed expiring because bigger values kept evicting from the back. Try [9, 1, 1, 1] with k = 2: 9 expires at i = 2.',
          },
        ],
      },

      // ---------- prefix sums + deque ----------
      {
        id: 'optimized-prefix-deque',
        title: 'Optimized approach — shortest subarray with sum ≥ k (negatives)',
        blocks: [
          {
            type: 'text',
            md: `With only non-negative numbers, "shortest subarray with sum ≥ k" is a variable sliding window. **Negative numbers break it**: shrinking the window can *increase* the sum, so the window cannot decide safely when to shrink.

Switch to **prefix sums**: \`P[0] = 0\`, \`P[j] = nums[0] + … + nums[j−1]\`, and \`sum(i..j−1) = P[j] − P[i]\`. For each end \`j\` we want the **largest** \`i < j\` with \`P[i] ≤ P[j] − k\`.

Two observations make a deque of candidate starts work:
1. **Back rule:** if \`P[j] ≤ P[i]\` for an earlier \`i\`, then \`i\` is useless as a start from now on — \`j\` is a later start (shorter subarray) with a smaller prefix (larger sum). Pop \`i\` from the back. So the deque holds **increasing** prefix values.
2. **Front rule:** if \`P[j] − P[front] ≥ k\`, record \`j − front\` and pop the front. Any later end \`j' > j\` would give a longer subarray with that same start, so the front has done its job.`,
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-7',
            question: 'Prefix sums so far: indices 0..3 with `P = [0, 2, 1, 5]`. Before pushing index 2 (P = 1), which index is removed from the back and why?',
            options: [
              'Index 1 (P = 2): index 2 is a later start with a smaller prefix, so any subarray starting after index 1 is shorter and has a larger sum',
              'Index 0 (P = 0): it is the oldest',
              'Nothing: the deque keeps all indices',
              'Index 3: it has the largest prefix',
            ],
            answer: 0,
            explanation: 'Starting at index 2 instead of 1 gives, for every future end, a SHORTER subarray (later start) with a LARGER sum (P[end] − 1 > P[end] − 2). Index 1 can never be the best start again, so it is popped. The deque stays increasing: [0, 2].',
            misconceptions: {
              1: 'Age alone is not a reason to pop. Index 0 has P = 0 < 1, so it might still be a useful start.',
              2: 'Keeping dominated starts would make the deque non-monotonic and break the front rule.',
              3: 'Index 3 is not processed yet at this moment — we are about to push index 2.',
            },
          },
        ],
      },

      // ---------- deque DP ----------
      {
        id: 'optimized-deque-dp',
        title: 'Optimized approach — deque-optimised DP ("best score to reach i")',
        blocks: [
          {
            type: 'text',
            md: `**Jump Game VI:** you start at index 0, and from index \`j\` you may jump to any index \`j+1 … j+k\`. Your score is the sum of \`nums\` at every index you land on. Maximise the score at the last index.

Think in plain words first: let \`best[i]\` = **"the best score with which I can stand on index i"**. To stand on i, the previous stop was one of the last k indices, and we should come from whichever of those had the best score:

\`\`\`text
best[0] = nums[0]
best[i] = nums[i] + max(best[i−k], …, best[i−1])
\`\`\`

This way of writing an answer in terms of answers for smaller indices is called **dynamic programming** (a full topic later). Here we only need one observation: the inner \`max\` is a **sliding window maximum over the best[] array**. Computing it with a loop is O(n·k); with a monotonic deque of indices (values of \`best\` decreasing) it is O(1) amortized — O(n) overall.`,
          },
          {
            type: 'dryrun',
            title: 'Jump Game VI: nums = [1, -1, -2, 4, -7, 3], k = 2',
            columns: ['i', 'nums[i]', 'window (best values)', 'best[i]', 'deque after (best values)'],
            rows: [
              ['0', '1', '—', '1', '[1]'],
              ['1', '-1', '[1]', '0', '[1, 0]'],
              ['2', '-2', '[1, 0] → max 1', '-1', '[1, 0, -1]'],
              ['3', '4', 'index 0 expires → [0, -1] → max 0', '4', '[4]'],
              ['4', '-7', '[-1, 4] → max 4', '-3', '[4, -3]'],
              ['5', '3', '[4, -3]', '7', '[7]'],
            ],
            note: 'Answer best[5] = 7: path 0 → 1 → 3 → 5 collects 1 − 1 + 4 + 3.',
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-8',
            question: '**Constrained Subsequence Sum** uses `best[i] = nums[i] + max(0, max(best[i−k..i−1]))`. Why the extra `max(0, …)` compared to Jump Game VI?',
            options: [
              'Because the subsequence may START at i: if every recent best is negative, it is better not to extend any of them',
              'To avoid negative indices',
              'Because the deque cannot hold negative values',
              'It is a typo; both recurrences are the same',
            ],
            answer: 0,
            explanation: 'In Jump Game VI you MUST start at index 0, so you must come from a previous index. A subsequence can start anywhere, so "take nothing before i" (value 0) is always an option. This is Kadane\'s "extend or restart" again, with a window of k.',
            misconceptions: {
              1: 'Indices are handled by expiring the deque front; the 0 is about the score.',
              2: 'The deque stores indices; the best values they point to can be negative.',
              3: 'The problems differ in whether the starting point is forced. That changes the recurrence.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see the common shape behind sliding window maximum, shortest subarray ≥ k, and jump game VI?',
            deeper: 'All three scan left to right and ask, at each index, for the **best candidate among a range of earlier indices**. A candidate that is both older and worse than a newer one is dominated forever, so it is removed from the back; candidates that fall out of range are removed from the front. Whatever the array is (nums, prefix sums, dp values), the deque logic is the same.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **\`shift()\` in a loop** — O(n) each; use a head index, the toolkit \`Queue\`, or \`Deque\`.
2. **Negative modulo** in circular buffers — \`(i - 1) % cap\` can be −1; add \`cap\` first.
3. **Full vs empty** confusion when \`head === tail\` — keep a \`count\`.
4. **Values instead of indices** in a monotonic deque — expiry becomes impossible.
5. **Wrong expiry bound** — the index that leaves a size-k window at step i is \`i − k\` (\`front <= i - k\`).
6. **Reading the answer before the first window is full** (\`i < k − 1\`).
7. **Sliding window with negatives** for sum ≥ k — use prefix sums + deque.
8. **DP with an O(k) inner loop** when k can be large — use the deque.
9. **Calling front()/back() on an empty deque** — returns \`undefined\` and comparisons silently fail.`,
          },
          {
            type: 'checkpoint',
            id: 'queue-deque-cp-9',
            question: 'You implement BFS-like processing with `while (q.length) { const x = q.shift(); … }` on 10^5 items and it is slow. What is the best fix?',
            options: [
              'Use unshift() to add items instead of push()',
              'Sort the queue first',
              'Keep a head index (or use the toolkit Queue) so each dequeue is O(1) instead of O(n)',
              'Convert the queue to a Set',
            ],
            answer: 2,
            explanation: 'shift() re-indexes the whole array, making the loop O(n²). A head pointer turns each dequeue into an index increment.',
            misconceptions: {
              0: 'unshift() is also O(n) — and it changes the order, turning the queue into something else.',
              1: 'Sorting changes the order of service and costs O(n log n) — it does not fix the dequeue cost.',
              3: 'A Set has no "remove the oldest" operation in O(1) that preserves duplicates, and it changes semantics.',
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
            time: 'O(1) per queue/deque operation; O(n) for monotonic-deque scans',
            space: 'O(n) (or O(k) for a size-k window)',
            md: `- **Queue (head pointer / toolkit):** enqueue and dequeue O(1) amortized.
- **Circular buffer:** O(1) worst case per operation, O(capacity) memory.
- **Monotonic deque:** each index pushed once, popped at most once → O(n) total; the deque holds at most k indices for a size-k window.
- **Shortest subarray ≥ k:** O(n) time, O(n) for prefix sums.
- **Deque DP:** O(n) time instead of O(n·k); O(n) for the dp array.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- In JavaScript interviews, **say out loud** that \`shift()\` is O(n) and how you avoid it — it is a common follow-up.
- For the monotonic deque, state the invariant: *"the deque holds indices inside the window whose values are decreasing; the front is the max."*
- Justify O(n): *"each index enters and leaves the deque once."*
- For DP problems, first write the O(n·k) recurrence, then point out that the inner max is a sliding window maximum.
- For circular buffers, mention how you distinguish full from empty (a count).`,
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
              { api: 'new Queue()', use: 'Toolkit FIFO queue: enqueue, dequeue, front, isEmpty, size', complexity: 'O(1) amortized' },
              { api: 'new Deque()', use: 'Toolkit deque: pushBack, pushFront, popBack, popFront, front, back', complexity: 'O(1) amortized' },
              { api: 'arr[head++]', use: 'Dequeue from a plain array without shifting', complexity: 'O(1)' },
              { api: 'arr.pop()', use: 'Pop the back of an array-based deque', complexity: 'O(1)' },
              { api: 'arr.shift() / unshift()', use: 'Avoid for queues: re-indexes the array', complexity: 'O(n)' },
              { api: '(i + 1) % cap, (i - 1 + cap) % cap', use: 'Advance / retreat in a ring buffer', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Serve in arrival order / rounds / time windows', 'Fixed-capacity buffers (circular queue/deque)', 'Max/min of each sliding window', 'Shortest subarray with sum ≥ k and negatives', 'dp[i] = value + best of previous k'],
    clues: ['back of the line', 'last t ms', 'circular queue', 'window maximum', 'max − min ≤ limit', 'sum at least k with negatives', 'at most k steps'],
    template: `for (let i = 0; i < n; i++) {
  while (!dq.isEmpty() && val(dq.back()) <= val(i)) dq.popBack();
  dq.pushBack(i);
  if (dq.front() <= i - k) dq.popFront();
  if (i >= k - 1) use(val(dq.front()));
}`,
    complexity: 'O(1) per operation; O(n) for a monotonic-deque scan',
    mistakes: ['shift() is O(n)', 'negative modulo', 'full vs empty', 'store indices', 'expiry bound i − k', 'window with negatives'],
    jsTools: ['Queue (toolkit)', 'Deque (toolkit)', 'head index', 'pop', '% capacity'],
  },

  keyConcepts: [
    'Queue = FIFO; deque = add/remove at both ends.',
    'Array.shift() is O(n); use a head pointer, the toolkit Queue, or a circular buffer.',
    'Circular buffer: head + count, indices wrap with % capacity (watch negative modulo).',
    'Monotonic deque: pop dominated elements from the back, expired ones from the front; the front is the window extreme; O(n) total.',
    'Shortest subarray with sum ≥ k and negatives: increasing deque of prefix-sum indices.',
    'DP with "best of the last k states" becomes O(n) with a deque over the dp array.',
    'Queues also drive BFS, covered in the Trees and Graphs topics.',
  ],

  interviewTips: [
    'Mention shift() is O(n) and how you avoid it.',
    'State the monotonic deque invariant and the "enters and leaves once" argument.',
    'Write the slow DP recurrence first, then optimise the inner max with a deque.',
  ],
};
