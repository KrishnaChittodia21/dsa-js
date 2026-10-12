export default {
  signals: [
    '"number of requests in the last 3000 ms" → queue, drop expired from the front',
    '"rounds" / "players take turns and the winner goes to the back" → queue simulation',
    '"reveal cards in increasing order" → simulate the process on a queue of positions',
    '"jump game VI" / "constrained subsequence sum" → deque over dp values',
    '"first negative number in every window of size k" → queue of indices',
    '"edge weights are only 0 or 1" → 0-1 BFS with a deque',
    '"design a hit counter / moving average from a data stream"',
  ],
  tricks: [
    {
      title: 'Head-pointer queue that also frees memory',
      kind: 'javascript',
      md: 'A `head` index makes dequeue O(1), but the dead prefix keeps growing. When `head` passes half of the array, slice off the consumed part once: each element is copied at most a constant number of times, so dequeue stays amortized O(1) and memory stays proportional to the live items.',
      code: `class Queue {
  #a = []; #head = 0;
  push(x) { this.#a.push(x); }
  shift() {
    if (this.#head >= this.#a.length) return undefined;
    const x = this.#a[this.#head++];
    if (this.#head * 2 >= this.#a.length) { this.#a = this.#a.slice(this.#head); this.#head = 0; }
    return x;
  }
  get size() { return this.#a.length - this.#head; }
}
const q = new Queue();
[1, 2, 3].forEach((x) => q.push(x));
console.log(q.shift(), q.shift(), q.size); // 1 2 1`,
    },
    {
      title: 'Process BFS level by level with a size snapshot',
      kind: 'template',
      md: 'When the answer depends on the level (minutes, steps, depth), read `size = queue.length − head` **before** the inner loop and process exactly that many items. Anything pushed during the loop belongs to the next level. One counter increment per outer loop = one level.',
      code: `const graph = { A: ['B', 'C'], B: ['D'], C: ['D'], D: [] };
function levels(start) {
  const q = [start], seen = new Set([start]), out = [];
  let head = 0; // seen.add happens before push → each node enqueued once
  while (head < q.length) {
    const size = q.length - head, level = [];
    for (let i = 0; i < size; i++) {
      const u = q[head++]; level.push(u);
      for (const v of graph[u]) if (!seen.has(v)) { seen.add(v); q.push(v); }
    }
    out.push(level);
  }
  return out;
}
console.log(levels('A')); // [ [ 'A' ], [ 'B', 'C' ], [ 'D' ] ]`,
    },
    {
      title: 'Mark visited when you enqueue, not when you dequeue',
      kind: 'edge-cases',
      md: 'If you only mark a node when you pop it, the same node can be pushed many times by different neighbours before it is processed — the queue can grow to O(E) and distances may be recorded twice. Marking at push time guarantees each node enters the queue exactly once.',
    },
    {
      title: 'Turn-based rounds: re-enqueue with index + n',
      kind: 'template',
      md: 'In "Dota2 Senate" style games, keep one queue of indices per team. Compare the two fronts: the smaller index acts first, bans the other, and goes back to its queue as `index + n` (it will act again in the next round, after everyone still waiting in this one). The team whose queue empties loses.',
      code: `function predictPartyVictory(senate) {
  const n = senate.length, r = [], d = [];
  [...senate].forEach((c, i) => (c === 'R' ? r : d).push(i));
  let ri = 0, di = 0;
  while (ri < r.length && di < d.length) {
    if (r[ri] < d[di]) r.push(r[ri] + n);
    else d.push(d[di] + n);
    ri++; di++;
  }
  return ri < r.length ? 'Radiant' : 'Dire';
}
console.log(predictPartyVictory('RD'), predictPartyVictory('RDD')); // Radiant Dire`,
    },
    {
      title: 'Simulate the process on positions, then fill values',
      kind: 'recognition',
      md: 'For "order the deck so the reveal process shows cards in increasing order", you do not search for the deck. Run the reveal process on a queue of **positions** 0..n − 1 to learn which position is revealed 1st, 2nd, 3rd…, then drop the sorted values into those positions.',
      code: `function deckRevealedIncreasing(deck) {
  const sorted = [...deck].sort((a, b) => a - b);
  const pos = deck.map((_, i) => i), res = new Array(deck.length);
  let head = 0;
  for (const card of sorted) {
    res[pos[head++]] = card;                   // reveal top
    if (head < pos.length) pos.push(pos[head++]); // move next to bottom
  }
  return res;
}
console.log(deckRevealedIncreasing([17, 13, 11, 2, 3, 5, 7])); // [ 2, 13, 3, 11, 5, 17, 7 ]`,
    },
    {
      title: 'Array as a monotonic deque: pop() for the back, head++ for the front',
      kind: 'javascript',
      md: 'A sliding-window deque only ever adds at the back, removes at the back, and removes at the front. A plain array covers all three cheaply: `push`, `pop`, and a `head` index for the front. No deque class needed for this pattern (you do need a real deque when you must add at the front, as in 0-1 BFS).',
      code: `function maxSlidingWindow(nums, k) {
  const dq = [], out = [];
  let head = 0;
  for (let i = 0; i < nums.length; i++) {
    while (dq.length > head && nums[dq.at(-1)] <= nums[i]) dq.pop();
    dq.push(i);
    if (dq[head] <= i - k) head++;
    if (i >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); // [ 3, 3, 5, 5, 6, 7 ]`,
    },
    {
      title: '0-1 BFS: weight-0 edges go to the front',
      kind: 'recognition',
      md: 'When every edge costs 0 or 1 (e.g. "free moves along the arrow, cost 1 to change direction"), use a deque: push the neighbour to the **front** for a 0-edge and to the **back** for a 1-edge, relaxing only when the distance improves. The deque stays sorted by distance, giving Dijkstra results in O(V + E) without a heap.',
    },
    {
      title: 'Min/max queue from two stacks',
      kind: 'template',
      md: 'If you need a FIFO queue that also answers "current minimum" (and items are not removed in a sliding pattern you can index), build it from two min-stacks: push to `in`, pop from `out`, and move everything from `in` to `out` only when `out` is empty. The queue minimum is the smaller of the two stack minimums. Every element moves once → amortized O(1).',
    },
    {
      title: 'Explain why the deque scan is O(n)',
      kind: 'interview',
      md: 'Interviewers often push back on a `while` inside a `for`. Answer with counting: each index is pushed once and popped at most once (from either end), so total deque operations are ≤ 2n regardless of the input order.',
    },
  ],
  traps: [
    {
      looksLike: 'Queue for "k-th largest element in a stream"',
      actually: 'Min-heap of size k',
      why: 'arrival order is irrelevant; you need the k largest values so far, which a heap maintains in O(log k).',
    },
    {
      looksLike: 'Plain BFS for shortest path with weights 0 and 1',
      actually: '0-1 BFS with a deque (or Dijkstra)',
      why: 'plain BFS counts edges, not cost; a 0-weight edge must not increase the distance.',
    },
    {
      looksLike: 'Plain queue for the minimum of every window',
      actually: 'Monotonic deque',
      why: 'a FIFO keeps every element; you must drop dominated values from the back to read the min from the front in O(1).',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Queue cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/queue/' },
    { label: 'CP-Algorithms — 0-1 BFS', url: 'https://cp-algorithms.com/graph/01_bfs.html' },
    { label: 'CP-Algorithms — Minimum stack / minimum queue', url: 'https://cp-algorithms.com/data_structures/stack_queue_modification.html' },
  ],
};
