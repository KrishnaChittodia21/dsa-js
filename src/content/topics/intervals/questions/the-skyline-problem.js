export default {
  id: 'the-skyline-problem',
  title: 'The Skyline Problem',
  difficulty: 'Hard',
  order: 3,
  pattern: 'intervals-sweep-line',
  tags: ['array', 'sweep line', 'heap', 'intervals'],
  source: { platform: 'LeetCode', number: 218, url: 'https://leetcode.com/problems/the-skyline-problem/' },

  statement: `A city is drawn as rectangles standing on the ground (height 0). Building \`i\` is \`[left_i, right_i, height_i]\`: it covers the x-range \`[left_i, right_i]\` up to \`height_i\`.

The **skyline** is the outline of the union of all rectangles seen from far away. Describe it as a list of **key points** \`[x, y]\` sorted by \`x\`: each key point is where the outline's height changes to \`y\`, and the last point always has \`y = 0\` (where the last building ends).

There must be **no two consecutive key points with the same height** — e.g. \`[[2,3],[4,5],[7,5],[11,5],[12,7]]\` is invalid; the \`[7,5]\` and \`[11,5]\` must be merged away.`,
  examples: [
    { input: 'buildings = [[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]', output: '[[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]]' },
    { input: 'buildings = [[0,2,3],[2,5,3]]', output: '[[0,3],[5,0]]', explanation: 'Two equal-height buildings touching at x = 2 form one flat roof.' },
  ],
  constraints: ['1 <= buildings.length <= 10^4', '0 <= left_i < right_i <= 2^31 - 1', '1 <= height_i <= 2^31 - 1', 'buildings is sorted by left_i'],

  think: `- The outline can only change at a building's left or right edge. How many such x positions are there?
- At a given x, the outline height is the **maximum** height among buildings covering x. Which structure keeps a changing collection and reports its max?
- When several edges share the same x, in which order must you process them so that you don't emit bogus key points?`,
  patternChallenge: {
    options: ['Merge intervals by x-range', 'Sweep line over edges + max structure', 'Greedy by earliest end', 'Two-pointer intersection'],
    answer: 1,
    explanation: 'The height changes only at edges, so sweep the 2n edge events in x order while maintaining the active heights in a MaxHeap. Merging would lose heights; the other patterns answer different questions.',
  },
  hints: [
    'Make events: `[left, -height]` for a start and `[right, height]` for an end. Sorting by `(x, value)` puts starts before ends at the same x, taller starts first and shorter ends first.',
    'Use a MaxHeap of active heights (seeded with 0) plus a Map of pending removals (lazy deletion). After each event, clean the top; if the max differs from the previous height, emit `[x, max]`.',
  ],
  approach: `**Brute force:** collect every edge x; for each x compute the max height of buildings with \`left <= x < right\`; emit a point when it changes — O(n²).

**Sweep line + MaxHeap with lazy deletion:**
1. Events: start \`[l, −h]\`, end \`[r, h]\`. Sort by x, then by the second value. This single rule gives the tie-breaks we need:
   - at the same x, **starts before ends** (negative first) — so touching equal buildings don't dip to 0;
   - among starts, **taller first** — only the tallest start produces a key point;
   - among ends, **shorter first** — only the final drop produces a key point.
2. Heap starts with \`0\` (the ground, never removed). \`removed\` = Map height → pending removals.
3. For each event: start → \`push(h)\`; end → \`removed[h]++\`. Then while the top is pending removal, pop it and decrement. \`cur = peek()\`. If \`cur !== prev\`, emit \`[x, cur]\` and set \`prev = cur\`.

**Why lazy deletion:** a binary heap can't remove an arbitrary element cheaply, but we only ever read the maximum. Stale entries buried below the top never affect it; we discard them when they surface. Each height is pushed and popped once → O(n log n). (Heaps are covered in the Heaps topic; the toolkit's \`MaxHeap\` is used here.)`,

  functionName: 'getSkyline',
  paramNames: ['buildings'],
  starterCode: `/**
 * @param {number[][]} buildings
 * @return {number[][]}
 */
function getSkyline(buildings) {
  // Toolkit: new MaxHeap() — push(x), peek(), pop(), size()
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The classic case: overlaps, a gap to the ground at 12 and a step down at 20.', args: [[[2, 9, 10], [3, 7, 15], [5, 12, 12], [15, 20, 10], [19, 24, 8]]], expected: [[2, 10], [3, 15], [7, 12], [12, 0], [15, 10], [20, 8], [24, 0]] },
    { scenario: 'Example 2', hint: 'Equal-height buildings touching at x = 2 form one flat roof — process starts before ends at the same x so the height does not dip to 0.', args: [[[0, 2, 3], [2, 5, 3]]], expected: [[0, 3], [5, 0]] },
    { scenario: 'Single building', hint: 'One building gives exactly two key points: its left edge and its drop to 0.', args: [[[1, 5, 4]]], expected: [[1, 4], [5, 0]] },
    { scenario: 'Same left, different heights', hint: 'At equal x, process taller starts first so only one key point [1,3] is emitted.', args: [[[1, 2, 1], [1, 2, 2], [1, 2, 3]]], expected: [[1, 3], [2, 0]] },
    { scenario: 'Step down at touch point', hint: 'A taller building ends exactly where a shorter one starts: emit [2,3], not [2,0] then [2,3].', args: [[[0, 2, 5], [2, 4, 3]]], expected: [[0, 5], [2, 3], [4, 0]] },
    { scenario: 'Step up at touch point', hint: 'A shorter building ends where a taller starts: one key point [2,3].', args: [[[0, 2, 1], [2, 4, 3]]], expected: [[0, 1], [2, 3], [4, 0]] },
    { scenario: 'Hidden buildings', hint: 'Buildings fully inside a taller one change nothing — only emit points when the max height changes.', args: [[[1, 10, 5], [2, 3, 2], [4, 6, 5]]], expected: [[1, 5], [10, 0]] },
    { scenario: 'Gap between buildings', hint: 'Between buildings the height returns to the ground (0) — keep 0 in the heap so peek() is never undefined.', args: [[[1, 3, 3], [5, 7, 3]]], expected: [[1, 3], [3, 0], [5, 3], [7, 0]] },
    { scenario: 'Same right, different heights', hint: 'At equal x, process shorter ends first so only the final drop to 0 is emitted.', args: [[[1, 5, 3], [2, 5, 6], [3, 5, 9]]], expected: [[1, 3], [2, 6], [3, 9], [5, 0]] },
    { scenario: 'Duplicate buildings', hint: 'Two identical buildings: lazy deletion must count removals per height, not just mark a height removed.', args: [[[1, 4, 7], [1, 4, 7], [2, 6, 5]]], expected: [[1, 7], [4, 5], [6, 0]] },
    { scenario: 'Maximum coordinates and height', hint: 'Values reach 2^31 − 1; JS numbers handle them exactly.', args: [[[0, 2147483647, 2147483647]]], expected: [[0, 2147483647], [2147483647, 0]] },
    { scenario: 'Staircase up then down', hint: 'Heights rise then fall across overlapping buildings; each change is one key point.', args: [[[1, 9, 1], [2, 8, 2], [3, 7, 3], [4, 6, 4]]], expected: [[1, 1], [2, 2], [3, 3], [4, 4], [6, 3], [7, 2], [8, 1], [9, 0]] },
    { scenario: 'Large nested input (n = 10^4)', hint: 'Recomputing the max for every x (or removing from an array) is O(n²). Use a max-heap with lazy deletion: O(n log n).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => [i, 20000 - i, i + 1])]', expected: Array.from({ length: 20000 }, (_, k) => (k < 10000 ? [k, k + 1] : [k + 1, 19999 - k])), timeLimitMs: 1000 },
  ],

  solution: {
    code: `function getSkyline(buildings) {
  const events = [];
  for (const [l, r, h] of buildings) {
    events.push([l, -h]); // start: negative height
    events.push([r, h]);  // end: positive height
  }
  // x ascending; ties: starts before ends, taller starts first, shorter ends first
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const heap = new MaxHeap();
  heap.push(0);                 // the ground is always "active"
  const removed = new Map();    // height -> number of pending removals (lazy deletion)
  const result = [];
  let prev = 0;

  for (const [x, v] of events) {
    if (v < 0) {
      heap.push(-v);
    } else {
      removed.set(v, (removed.get(v) ?? 0) + 1);
    }
    // discard stale maxima
    while ((removed.get(heap.peek()) ?? 0) > 0) {
      const top = heap.pop();
      removed.set(top, removed.get(top) - 1);
    }
    const cur = heap.peek();
    if (cur !== prev) {
      result.push([x, cur]);
      prev = cur;
    }
  }
  return result;
}`,
    explanation: 'Height 0 is never marked for removal, so the heap is never empty. The tie-break order guarantees at most one key point per x.',
  },
  dryRun: {
    columns: ['event [x, v]', 'action', 'active max', 'emit'],
    rows: [
      ['[2,-10]', 'push 10', '10', '[2,10]'],
      ['[3,-15]', 'push 15', '15', '[3,15]'],
      ['[5,-12]', 'push 12', '15', '—'],
      ['[7,15]', 'remove 15 → popped', '12', '[7,12]'],
      ['[9,10]', 'mark 10 (buried, stays lazily)', '12', '—'],
      ['[12,12]', 'remove 12 → pop 12, then stale 10', '0', '[12,0]'],
      ['[15,-10]', 'push 10', '10', '[15,10]'],
      ['[19,-8]', 'push 8', '10', '—'],
      ['[20,10]', 'remove 10', '8', '[20,8]'],
      ['[24,8]', 'remove 8', '0', '[24,0]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: '2n events sorted; each height is pushed once and popped at most once from the heap (O(log n) each). The Map and heap hold O(n) entries.' },
  alternative: {
    title: 'Divide and conquer (merge skylines)',
    md: 'Split the buildings in half, compute each half\'s skyline recursively, then merge the two skylines like merge sort: walk both point lists, tracking the current height of each, and emit `max(h1, h2)` whenever it changes. Also O(n log n) and needs no heap.',
    code: `function getSkyline(buildings) {
  const solve = (lo, hi) => {
    if (lo === hi) { const [l, r, h] = buildings[lo]; return [[l, h], [r, 0]]; }
    const mid = (lo + hi) >> 1;
    const A = solve(lo, mid), B = solve(mid + 1, hi);
    const out = [];
    let i = 0, j = 0, ha = 0, hb = 0;
    while (i < A.length || j < B.length) {
      let x;
      if (j >= B.length || (i < A.length && A[i][0] < B[j][0])) { x = A[i][0]; ha = A[i++][1]; }
      else if (i >= A.length || B[j][0] < A[i][0]) { x = B[j][0]; hb = B[j++][1]; }
      else { x = A[i][0]; ha = A[i++][1]; hb = B[j++][1]; }
      const h = Math.max(ha, hb);
      if (out.length === 0 || out[out.length - 1][1] !== h) out.push([x, h]);
    }
    return out;
  };
  return solve(0, buildings.length - 1);
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Wrong tie order at equal x — produces points like [2,0] then [2,3] or duplicate heights.',
    'Trying to remove a height from the middle of a heap directly (O(n) each) instead of lazy deletion.',
    'Forgetting the ground (0) in the heap — peek() returns undefined after the last building ends.',
    'Emitting a point for every event instead of only when the max height changes.',
  ],
};
