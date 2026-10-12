export default {
  signals: [
    '"k-th smallest in a sorted matrix" / "k smallest pairs from two sorted arrays"',
    '"minimum cost to connect ropes / sticks" → always combine the two smallest',
    '"process tasks in time order, always picking the best available one"',
    '"reorganise the string so no two neighbours are equal"',
    '"smallest range that includes one number from each list"',
    '"how far can you get with limited ladders / refuels"',
    'a value must be removed from the middle of a priority queue',
  ],
  tricks: [
    {
      title: 'A complete comparator heap in 15 lines',
      kind: 'javascript',
      md: "JavaScript has no built-in priority queue, so be ready to write one quickly. Store the tree in an array (parent of i is `(i − 1) >> 1`, children `2i + 1`, `2i + 2`) and take a `less(a, b)` function, so the same class works as a min-heap, max-heap or a heap of arrays/objects. push sifts the new last element up; pop moves the last element to the root and sifts it down.",
      code: `class Heap {
  constructor(less = (a, b) => a < b) { this.a = []; this.less = less; }
  size() { return this.a.length; } peek() { return this.a[0]; }
  push(x) {
    const a = this.a; a.push(x);
    for (let i = a.length - 1, p; i > 0 && this.less(a[i], a[(p = (i - 1) >> 1)]); i = p) [a[i], a[p]] = [a[p], a[i]];
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; for (let i = 0; ; ) { let m = i; const l = 2 * i + 1, r = l + 1;
      if (l < a.length && this.less(a[l], a[m])) m = l; if (r < a.length && this.less(a[r], a[m])) m = r;
      if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
    return top;
  }
}`,
    },
    {
      title: 'Lazy deletion: delete when it reaches the top',
      kind: 'template',
      md: "A heap cannot find an arbitrary element quickly, so do not try. Record “x should be removed” in a Map of pending counts, and whenever you look at the top, pop and discard entries that are pending. Each element is pushed and popped once, so the total cost stays O(n log n). Keep your own `live` counter, because `heap.size()` now includes dead entries. Used for sliding-window median and “change priority” (remove old + push new).",
      code: `const pending = new Map();
const markRemoved = (x) => pending.set(x, (pending.get(x) ?? 0) + 1);
function cleanTop(heap) {
  while (heap.size() && pending.get(heap.peek())) {
    const x = heap.pop();
    pending.set(x, pending.get(x) - 1);
  }
  return heap.peek();
}`,
    },
    {
      title: 'Push only the frontier for "k smallest from sorted sources"',
      kind: 'template',
      md: "For k-th smallest in a sorted matrix or k smallest pairs, do not push all n·m candidates. Start with the first element of each row; each time you pop (row, col), push only its successor (row, col + 1). The heap never holds more than one entry per row, so the cost is O(k log rows) — the same idea as merging k sorted lists.",
      code: `// uses the Heap class above
function kthSmallest(matrix, k) {
  const h = new Heap((a, b) => a[0] < b[0]);
  for (let r = 0; r < matrix.length; r++) h.push([matrix[r][0], r, 0]);
  for (let i = 1; i < k; i++) {
    const [, r, c] = h.pop();
    if (c + 1 < matrix[r].length) h.push([matrix[r][c + 1], r, c + 1]);
  }
  return h.peek()[0];
}`,
    },
    {
      title: 'Pack (priority, id) into one number',
      kind: 'optimization',
      md: "Heaps of small arrays `[dist, node]` allocate an object per push and compare through indexing. If priority and id are non-negative integers with `priority * N + id < 2^53`, store `priority * N + id` as a plain number: comparison is a single `<`, and you decode with `Math.floor(key / N)` and `key % N`. This often doubles Dijkstra speed in JS.",
      code: `const N = 1000; // number of node ids
const pack = (dist, node) => dist * N + node;
const unpack = (key) => [Math.floor(key / N), key % N];
console.log(unpack(pack(42, 7))); // → [42,7]`,
    },
    {
      title: 'Break ties with an insertion counter',
      kind: 'edge-cases',
      md: "A heap is not stable: items with equal priority can come out in any order, which breaks problems that say “if tied, the earlier one first” (task schedulers, order books, simulation). Attach an increasing sequence number when pushing and compare by `(priority, seq)`. Since all seq values differ, the order is fully determined and the comparator never needs to look at the payload.",
      code: `let seq = 0;
const makeItem = (priority, task) => ({ priority, seq: seq++, task });
const less = (a, b) => a.priority < b.priority || (a.priority === b.priority && a.seq < b.seq);
console.log(less(makeItem(1, 'x'), makeItem(1, 'y'))); // → true`,
    },
    {
      title: 'Heapify all at once when you know the items up front',
      kind: 'optimization',
      md: "Pushing n items one by one is O(n log n). If the items are all known, put them in the array and sift DOWN every non-leaf from the last parent `(n >> 1) − 1` back to 0. Most nodes are near the bottom and move only a step or two, so the total is O(n). Mention it when the interviewer asks how to build a heap faster.",
    },
    {
      title: 'Guard empty peeks — undefined compares silently',
      kind: 'javascript',
      md: "`peek()` on an empty heap returns `undefined`, and comparisons with undefined (`undefined < 5`, `undefined > 5`) are both false without any error. So code like `if (heap.peek() < x)` quietly takes the wrong branch. Always check `heap.size()` first, or return a sentinel such as Infinity from an empty min-heap.",
      code: `const empty = [];
console.log(empty[0] < 5, empty[0] > 5); // → false false`,
    },
    {
      title: 'Ask whether k can be close to n',
      kind: 'interview',
      md: "A size-k heap gives O(n log k), which only beats sorting (O(n log n)) when k is much smaller than n. If k ≈ n, say that sorting is just as good and simpler; if k is tiny and only the k-th value is needed, quickselect is O(n) on average. Naming the trade-off shows you understand why the heap was chosen, not just that it fits.",
    },
    {
      title: 'Combine "sort by time" with "heap by value"',
      kind: 'recognition',
      md: "Many scheduling problems have two orders: items become AVAILABLE in time order, and among available items you want the BEST by another key (profit, duration, deadline). Sort by availability, advance a pointer to push newly available items into the heap, then pop the best. Course Schedule III, IPO and single-threaded CPU all follow this exact shape.",
    },
  ],
  traps: [
    {
      looksLike: 'Sliding window maximum with a heap',
      actually: 'Monotonic deque',
      why: 'the deque gives O(n) with no lazy deletion; a heap needs stale-entry cleanup and costs O(n log n)',
    },
    {
      looksLike: 'Top k frequent with a heap',
      actually: 'Bucket sort by frequency',
      why: 'frequencies are integers in 1..n, so buckets give O(n) instead of O(n log k)',
    },
    {
      looksLike: 'Dijkstra with a heap when edge weights are only 0 or 1',
      actually: '0-1 BFS with a deque',
      why: 'push 0-weight edges to the front and 1-weight edges to the back for O(V + E)',
    },
    {
      looksLike: 'Keeping a sorted array for running median',
      actually: 'Two heaps',
      why: 'sorted insertion is O(n) per number; two heaps make each insert O(log n)',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Heap', url: 'https://www.techinterviewhandbook.org/algorithms/heap/' },
    { label: 'Python docs — heapq (priority queue implementation notes)', url: 'https://docs.python.org/3/library/heapq.html' },
    { label: 'Wikipedia — Binary heap', url: 'https://en.wikipedia.org/wiki/Binary_heap' },
  ],
};
