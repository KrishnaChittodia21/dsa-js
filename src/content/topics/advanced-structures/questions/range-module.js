// ---- large-test generators (deterministic; used by the timed tests below) ----
// The line [0, 10^9) is split into 10^5 blocks of width 10^4. Every add/remove covers whole blocks, so the generator keeps one
// boolean per block; a query [l, r) is true iff every block it touches is covered.
const bigRangeModule = () => {
  const W = 10000, M = 100000, covered = new Uint8Array(M);
  const ops = ['RangeModule'], args = [[]], expected = [null];
  let s = 77;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0);
  for (let k = 0; k < 9999; k++) {
    const a = 1 + (rnd() % (M - 200)), b = a + 1 + (rnd() % 100), t = k % 3;
    if (t === 0 || t === 1) {
      for (let j = a; j < b; j++) covered[j] = t === 0 ? 1 : 0;
      ops.push(t === 0 ? 'addRange' : 'removeRange'); args.push([a * W, b * W]); expected.push(null);
    } else {
      const l = a * W + (rnd() % W), r = (b - 1) * W + 1 + (rnd() % W);
      let ok = l < r;
      for (let j = a; j < b && ok; j++) if (!covered[j]) ok = false;
      if (l >= r) continue;
      ops.push('queryRange'); args.push([l, r]); expected.push(ok);
    }
  }
  return { ops, args, expected };
};
// ---- end generators ----

export default {
  id: 'range-module',
  title: 'Range Module',
  difficulty: 'Hard',
  order: 6,
  pattern: 'dynamic-interval-coverage',
  tags: ['design', 'intervals', 'binary search', 'ordered set', 'segment tree'],
  source: { platform: 'LeetCode', number: 715, url: 'https://leetcode.com/problems/range-module/' },

  statement: `Design \`RangeModule\`, which tracks a set of real numbers covered by half-open ranges \`[left, right)\`:

- \`addRange(left, right)\` — start tracking every number in \`[left, right)\` (overlaps with already-tracked numbers are fine);
- \`queryRange(left, right)\` — return \`true\` if **every** number in \`[left, right)\` is currently tracked, otherwise \`false\`;
- \`removeRange(left, right)\` — stop tracking every number in \`[left, right)\` that is currently tracked.`,
  examples: [
    { input: '["RangeModule","addRange","removeRange","queryRange","queryRange","queryRange"]\n[[],[10,20],[14,16],[10,14],[13,15],[16,17]]', output: '[null,null,null,true,false,true]', explanation: 'Tracked: [10,14) ∪ [16,20). [13,15) contains 14, which is not tracked.' },
  ],
  constraints: ['1 <= left < right <= 10^9', 'At most 10^4 calls in total'],

  think: `- What is the simplest representation of "a set of covered numbers" when it is a union of intervals?
- If you keep the intervals **disjoint and sorted**, how do you find the ones that a new range touches?
- For a query, which single stored interval could possibly cover all of [left, right)?`,
  patternChallenge: {
    options: ['Sorted list of disjoint intervals + binary search', 'Monotonic Stack', 'Union-Find over coordinates', 'Fenwick Tree over 10^9 positions'],
    answer: 0,
    explanation: 'Coordinates up to 10^9 rule out a plain array/BIT. A sorted list of disjoint intervals represents the tracked set exactly: add merges, remove cuts, query checks the one interval that starts at or before left. (A dynamic segment tree with range-assign also works, but is heavier.)',
  },
  hints: [
    'Invariant: `this.iv` is sorted by start, intervals are disjoint and non-touching (touching ones are merged).',
    'add: binary-search the first interval with end ≥ left; absorb every interval with start ≤ right into [min, max]; splice. remove: from the first interval with end > left, keep the parts left of `left` and right of `right`. query: take the last interval with start ≤ left and check its end ≥ right.',
  ],
  approach: `**Brute force:** a boolean per integer — impossible at 10^9. Storing every added/removed range and re-evaluating per query is O(calls) per query with messy logic.

**Sorted disjoint intervals:**
- \`firstIdx(pred)\` = binary search for the first interval satisfying a monotone predicate.
- **addRange(l, r):** \`i = first with end ≥ l\`. While \`iv[j].start ≤ r\`: \`l = min(l, start)\`, \`r = max(r, end)\`. Replace iv[i..j) by \`[l, r]\` with one \`splice\`. Using ≥ / ≤ merges touching intervals ([1,5) + [5,10) → [1,10)).
- **removeRange(l, r):** \`i = first with end > l\`. For each interval with \`start < r\`: keep \`[start, l)\` if start < l and \`[r, end)\` if end > r. Splice the pieces in.
- **queryRange(l, r):** \`k = (first with start > l) − 1\`; answer \`k ≥ 0 && iv[k].end ≥ r\`. Since touching intervals are merged, no other interval could help.

Each operation is O(log k) to locate plus O(k) worst case for \`splice\` (fast memmove in practice).`,

  kind: 'design',
  className: 'RangeModule',
  starterCode: `class RangeModule {
  constructor() {
    
  }

  /**
   * @param {number} left
   * @param {number} right
   * @return {void}
   */
  addRange(left, right) {
    
  }

  /**
   * @param {number} left
   * @param {number} right
   * @return {boolean}
   */
  queryRange(left, right) {
    
  }

  /**
   * @param {number} left
   * @param {number} right
   * @return {void}
   */
  removeRange(left, right) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The statement example: after removing [14,16) the tracked set is [10,14) ∪ [16,20).', ops: ["RangeModule","addRange","removeRange","queryRange","queryRange","queryRange"], args: [[],[10,20],[14,16],[10,14],[13,15],[16,17]], expected: [null,null,null,true,false,true] },
    { scenario: 'Query on empty module', hint: 'Nothing is tracked yet — false, without crashing on an empty list.', ops: ["RangeModule","queryRange","addRange","queryRange","queryRange"], args: [[],[1,2],[1,2],[1,2],[1,3]], expected: [null,false,null,true,false] },
    { scenario: 'Touching ranges merge', hint: 'Not merging touching intervals [1,5) and [5,10) makes the query [1,10) fail because it spans two stored pieces.', ops: ["RangeModule","addRange","addRange","queryRange","queryRange"], args: [[],[1,5],[5,10],[1,10],[0,2]], expected: [null,null,null,true,false] },
    { scenario: 'Remove everything', hint: 'Removing the exact tracked range leaves nothing.', ops: ["RangeModule","addRange","removeRange","queryRange","queryRange","addRange","queryRange"], args: [[],[1,10],[1,10],[1,2],[5,6],[3,4],[3,4]], expected: [null,null,null,false,false,null,true] },
    { scenario: 'Remove across two ranges', hint: 'A removal spanning several stored intervals keeps [start, left) and [right, end) of the outer ones.', ops: ["RangeModule","addRange","addRange","addRange","removeRange","queryRange","queryRange","queryRange"], args: [[],[10,20],[30,40],[15,35],[18,32],[10,18],[32,40],[17,33]], expected: [null,null,null,null,null,true,true,false] },
    { scenario: 'Half-open remove edges', hint: 'Using closed comparisons in remove drops the boundary points: after removing [500,600) both 499 and 600 stay tracked.', ops: ["RangeModule","addRange","removeRange","removeRange","queryRange","queryRange","queryRange","queryRange","queryRange"], args: [[],[1,1000000000],[500,600],[700,800],[1,500],[1,501],[600,700],[499,500],[800,801]], expected: [null,null,null,null,true,false,true,true,true] },
    { scenario: 'Overlap is not containment', hint: 'Checking only "some interval overlaps" is wrong: [3,8) overlaps [1,5) and [6,10) but 5 is not tracked.', ops: ["RangeModule","addRange","addRange","queryRange","queryRange","queryRange"], args: [[],[1,5],[6,10],[3,8],[6,10],[1,5]], expected: [null,null,null,false,true,true] },
    { scenario: 'Remove untracked range', hint: 'Removing numbers that are not tracked changes nothing.', ops: ["RangeModule","addRange","removeRange","removeRange","queryRange"], args: [[],[5,8],[1,3],[10,20],[5,8]], expected: [null,null,null,null,true] },
    { scenario: 'Remove splits in the middle', hint: 'One removal inside one interval leaves two pieces; neither may be lost.', ops: ["RangeModule","addRange","removeRange","queryRange","queryRange","queryRange","queryRange"], args: [[],[1,100],[40,60],[1,40],[60,100],[39,41],[59,61]], expected: [null,null,null,true,true,false,false] },
    { scenario: 'Re-add after remove', hint: 'Adding back a removed hole restores one continuous interval.', ops: ["RangeModule","addRange","removeRange","addRange","queryRange","removeRange","queryRange","queryRange"], args: [[],[1,100],[40,60],[40,60],[1,100],[1,2],[1,100],[2,100]], expected: [null,null,null,null,true,null,false,true] },
    { scenario: 'Many small adds merge', hint: 'Many adjacent unit ranges must merge into one piece.', ops: ["RangeModule","addRange","addRange","addRange","addRange","addRange","queryRange","queryRange"], args: [[],[1,2],[3,4],[2,3],[5,6],[4,5],[1,6],[0,6]], expected: [null,null,null,null,null,null,true,false] },
    { scenario: 'Random 60 calls (coords ≤ 53)', hint: 'Pseudo-random adds, removes and queries checked against a replay of every call.', ops: ["RangeModule","queryRange","addRange","addRange","addRange","addRange","removeRange","queryRange","removeRange","queryRange","removeRange","removeRange","removeRange","addRange","removeRange","addRange","queryRange","addRange","addRange","removeRange","removeRange","queryRange","addRange","removeRange","removeRange","addRange","queryRange","removeRange","addRange","removeRange","addRange","queryRange","removeRange","addRange","removeRange","queryRange","queryRange","removeRange","queryRange","queryRange","queryRange","addRange","removeRange","queryRange","addRange","removeRange","queryRange","removeRange","removeRange","addRange","queryRange","removeRange","addRange","addRange","removeRange","addRange","removeRange","addRange","queryRange","queryRange","queryRange"], args: [[],[39,41],[8,19],[5,9],[38,39],[35,41],[36,43],[33,45],[10,15],[31,37],[8,19],[21,33],[30,31],[27,37],[28,31],[1,13],[26,35],[31,37],[24,35],[13,21],[22,31],[35,37],[4,11],[33,37],[10,11],[15,25],[16,19],[21,33],[22,31],[35,37],[4,7],[33,41],[10,19],[39,45],[40,43],[13,25],[6,11],[19,25],[4,15],[9,21],[10,19],[23,25],[24,27],[37,49],[38,43],[19,21],[12,15],[17,29],[2,3],[39,45],[24,27],[37,49],[38,43],[3,13],[28,35],[17,25],[2,7],[31,33],[40,51],[37,49],[14,23]], expected: [null,false,null,null,null,null,null,false,null,false,null,null,null,null,null,null,false,null,null,null,null,true,null,null,null,null,true,null,null,null,null,false,null,null,null,false,false,null,false,false,false,null,null,false,null,null,false,null,null,null,false,null,null,null,null,null,null,null,false,false,false] },
    { scenario: 'Large (10^4 calls, coords to 10^9)', hint: 'Ranges are up to 10^6 numbers wide: tracking individual integers is hopeless. Keep sorted disjoint intervals (or a dynamic segment tree) and touch only the pieces each call overlaps.', opsGen: String(bigRangeModule), timeLimitMs: 200 },
  ],
  solution: {
    code: `class RangeModule {
  constructor() {
    this.iv = [];               // sorted, disjoint, non-touching [start, end) pairs
  }

  // first index whose interval satisfies pred (pred must be false...false,true...true)
  #firstIdx(pred) {
    let lo = 0, hi = this.iv.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (pred(this.iv[mid])) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  addRange(left, right) {
    const i = this.#firstIdx(([, end]) => end >= left);    // first interval touching/after left
    let j = i;
    while (j < this.iv.length && this.iv[j][0] <= right) { // overlaps or touches [left, right)
      left = Math.min(left, this.iv[j][0]);
      right = Math.max(right, this.iv[j][1]);
      j++;
    }
    this.iv.splice(i, j - i, [left, right]);
  }

  queryRange(left, right) {
    const k = this.#firstIdx(([start]) => start > left) - 1; // last interval starting at/before left
    return k >= 0 && this.iv[k][1] >= right;
  }

  removeRange(left, right) {
    const i = this.#firstIdx(([, end]) => end > left);     // first interval reaching past left
    let j = i;
    const pieces = [];
    while (j < this.iv.length && this.iv[j][0] < right) {
      const [start, end] = this.iv[j];
      if (start < left) pieces.push([start, left]);         // keep the part before the cut
      if (end > right) pieces.push([right, end]);           // keep the part after the cut
      j++;
    }
    this.iv.splice(i, j - i, ...pieces);
  }
}`,
  },
  dryRun: {
    columns: ['operation', 'intervals after', 'result'],
    rows: [
      ['addRange(10, 20)', '[[10,20]]', 'null'],
      ['removeRange(14, 16)', '[[10,14], [16,20]]', 'null'],
      ['queryRange(10, 14)', 'last start ≤ 10 is [10,14]; 14 ≥ 14', 'true'],
      ['queryRange(13, 15)', 'last start ≤ 13 is [10,14]; 14 < 15', 'false'],
      ['queryRange(16, 17)', 'last start ≤ 16 is [16,20]; 20 ≥ 17', 'true'],
    ],
  },
  complexity: { time: 'O(log k + m) per operation', space: 'O(k)', explanation: 'k = stored intervals, m = intervals merged/cut (plus splice shifting). Every interval is created once and removed at most once, so merging work is amortized.' },
  alternative: {
    title: 'Dynamic segment tree with range assign',
    md: 'Build nodes on demand over [1, 10^9). Each node stores `covered` (true / false / mixed). add = assign true on [l, r), remove = assign false, query = "is every leaf in [l, r) true?". Tags must be pushed before descending into mixed nodes. More code and memory (O(q log C) nodes), but each op is O(log C) regardless of how many intervals exist.',
    complexity: 'O(log C) per operation, O(q log C) space',
  },
  mistakes: [
    'Not merging touching intervals ([1,5) and [5,10)) — a query [1,10) then fails because it spans two stored pieces.',
    'Using closed-interval comparisons on half-open ranges in remove (the cut keeps [start, left) and [right, end)).',
    'Mutating the array while iterating with indices that shift — collect pieces, then do one `splice`.',
    'Answering a query by checking only "some interval overlaps" instead of "one interval contains all of it".',
  ],
};
