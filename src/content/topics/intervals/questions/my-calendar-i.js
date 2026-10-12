export default {
  id: 'my-calendar-i',
  title: 'My Calendar I',
  difficulty: 'Medium',
  order: 8,
  pattern: 'intervals-design',
  kind: 'design',
  tags: ['design', 'binary search', 'intervals'],
  source: { platform: 'LeetCode', number: 729, url: 'https://leetcode.com/problems/my-calendar-i/' },

  statement: `Build a calendar that never allows a **double booking** (two events sharing some moment).

An event is the half-open interval \`[start, end)\`. Implement the class \`MyCalendar\`:

- \`new MyCalendar()\` — creates an empty calendar.
- \`book(start, end)\` — if the event does not overlap any existing booking, add it and return \`true\`; otherwise leave the calendar unchanged and return \`false\`.`,
  examples: [
    { input: '["MyCalendar","book","book","book"]\n[[],[10,20],[15,25],[20,30]]', output: '[null,true,false,true]', explanation: '[15,25) overlaps [10,20). [20,30) only touches [10,20) at 20, which is allowed.' },
  ],
  constraints: ['0 <= start < end <= 10^9', 'At most 1000 calls to book'],

  think: `- What is the overlap test for two half-open intervals?
- If the stored bookings are kept sorted and disjoint, which of them can possibly overlap a new one?
- How do you find those neighbours quickly?`,
  patternChallenge: {
    options: ['Sweep line recomputed on every call', 'Sorted interval set with binary search for neighbours', 'Sort by start & merge all bookings', 'Greedy by earliest end'],
    answer: 1,
    explanation: 'Calls are interleaved and each needs an immediate answer, so keep a sorted, disjoint list and check only the predecessor and successor of the new interval. Recomputing a sweep or merge per call repeats O(n log n) work.',
  },
  hints: [
    'Linear version: loop over all bookings and reject if `start < e && s < end` for any booking `[s, e)`.',
    'Faster: binary-search the first booking with start `>= start`. Conflict iff that booking starts before `end`, or the previous booking ends after `start`.',
  ],
  approach: `**Simple:** store bookings in an array; for each \`book\`, test the new interval against every stored one with \`start < e && s < end\`. O(n) per call, O(n²) total — fine for 1000 calls.

**Better — sorted, disjoint array:**
1. Binary-search \`i\` = first booking whose start is \`>= start\` (lower bound).
2. **Successor** \`list[i]\` conflicts if \`list[i][0] < end\`.
3. **Predecessor** \`list[i − 1]\` conflicts if \`list[i − 1][1] > start\`.
4. No conflict → \`splice\` the new booking in at \`i\`.

Only neighbours can conflict: bookings before the predecessor end even earlier; bookings after the successor start even later. Lookup is O(log n); \`splice\` shifts elements, O(n) worst case (a balanced BST would give O(log n); JS has none built in).`,

  className: 'MyCalendar',
  starterCode: `class MyCalendar {
  constructor() {
    
  }

  /**
   * @param {number} start
   * @param {number} end
   * @return {boolean}
   */
  book(start, end) {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: '[15,25) overlaps [10,20); [20,30) only touches it at 20, which is allowed.', ops: ['MyCalendar', 'book', 'book', 'book'], args: [[], [10, 20], [15, 25], [20, 30]], expected: [null, true, false, true] },
    { scenario: 'Single booking', hint: 'An empty calendar accepts anything, even the whole range [0, 10^9).', ops: ['MyCalendar', 'book'], args: [[], [0, 1000000000]], expected: [null, true] },
    { scenario: 'Touching on both sides', hint: '[20,30) touches [10,20) at 20 and [30,40) at 30 — both are fine. Using `<=` rejects it.', ops: ['MyCalendar', 'book', 'book', 'book', 'book'], args: [[], [10, 20], [30, 40], [18, 25], [20, 30]], expected: [null, true, true, false, true] },
    { scenario: 'Overlap with predecessor', hint: '[5,15) overlaps the earlier event [10,20) from the left. Checking only the successor misses it.', ops: ['MyCalendar', 'book', 'book', 'book'], args: [[], [10, 20], [5, 10], [5, 15]], expected: [null, true, true, false] },
    { scenario: 'Overlap with successor', hint: '[25,35) starts inside nothing but runs into [30,40). Checking only the predecessor misses it.', ops: ['MyCalendar', 'book', 'book', 'book'], args: [[], [10, 20], [30, 40], [25, 35]], expected: [null, true, true, false] },
    { scenario: 'Contained and containing', hint: '[12,13) sits inside [10,20); [0,100) covers it completely — both overlap.', ops: ['MyCalendar', 'book', 'book', 'book'], args: [[], [10, 20], [12, 13], [0, 100]], expected: [null, true, false, false] },
    { scenario: 'Rejected booking not stored', hint: '[15,25) is rejected, so [20,30) is still free afterwards. Adding before checking (or on failure) blocks it.', ops: ['MyCalendar', 'book', 'book', 'book'], args: [[], [10, 20], [15, 25], [21, 30]], expected: [null, true, false, true] },
    { scenario: 'Identical booking twice', hint: 'The same interval again overlaps itself: false.', ops: ['MyCalendar', 'book', 'book'], args: [[], [3, 7], [3, 7]], expected: [null, true, false] },
    { scenario: 'Unit-length events', hint: 'Back-to-back events of length 1 in any order all fit.', ops: ['MyCalendar', 'book', 'book', 'book', 'book'], args: [[], [5, 6], [1, 2], [3, 4], [2, 3]], expected: [null, true, true, true, true] },
    { scenario: 'LeetCode-style sequence', hint: 'A mixed sequence where several bookings overlap different neighbours.', ops: ['MyCalendar', 'book', 'book', 'book', 'book', 'book', 'book'], args: [[], [47, 50], [33, 41], [39, 45], [33, 42], [25, 32], [26, 35]], expected: [null, true, true, false, false, true, false] },
    { scenario: 'Mixed sequence (40 books)', hint: 'A pseudo-random mix of short events in a small range: many touch, many overlap.', ops: ['MyCalendar', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book', 'book'], args: [[], [69, 71], [53, 64], [1, 5], [42, 53], [157, 162], [5, 12], [73, 85], [53, 58], [4, 13], [97, 105], [181, 188], [145, 157], [168, 178], [36, 44], [103, 105], [97, 103], [19, 21], [166, 169], [99, 106], [99, 104], [70, 73], [132, 133], [132, 133], [146, 149], [22, 31], [46, 56], [60, 62], [22, 31], [16, 19], [47, 52], [106, 108], [86, 98], [131, 133], [23, 33], [112, 122], [74, 79], [170, 173], [139, 149], [4, 7], [167, 176]], expected: [null, true, true, true, true, true, true, true, false, false, true, true, true, true, false, false, false, true, false, false, false, false, true, false, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false] },
    { scenario: 'Maximum calls (1000 books)', hint: '1000 bookings with wide coordinates — the largest allowed sequence.', opsGen: '() => { const ops = [\'MyCalendar\'], args = [[]], expected = [null]; const b = []; let s = 149; for (let i = 0; i < 1000; i++) { s = (s * 48271) % 2147483647; const st = s % 999000000; s = (s * 48271) % 2147483647; const en = st + 1 + (s % 1000000); let ok = true; for (const [x, y] of b) if (st < y && x < en) { ok = false; break; } if (ok) b.push([st, en]); ops.push(\'book\'); args.push([st, en]); expected.push(ok); } return { ops, args, expected }; }' },
  ],

  solution: {
    code: `class MyCalendar {
  constructor() {
    this.bookings = []; // sorted by start, pairwise disjoint, half-open [s, e)
  }

  book(start, end) {
    const list = this.bookings;
    // lower bound: first booking whose start >= start
    let lo = 0, hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] < start) lo = mid + 1;
      else hi = mid;
    }
    if (lo < list.length && list[lo][0] < end) return false;  // successor starts too early
    if (lo > 0 && list[lo - 1][1] > start) return false;      // predecessor ends too late
    list.splice(lo, 0, [start, end]);
    return true;
  }
}`,
  },
  dryRun: {
    columns: ['call', 'lower bound i', 'successor check', 'predecessor check', 'result / list'],
    rows: [
      ['book(10,20)', '0', '—', '—', 'true → [[10,20]]'],
      ['book(15,25)', '1', '—', '20 > 15 ✗', 'false'],
      ['book(20,30)', '1', '—', '20 > 20? no ✓', 'true → [[10,20],[20,30]]'],
    ],
  },
  complexity: { time: 'O(log n) search + O(n) insert per book', space: 'O(n)', explanation: 'Binary search finds the neighbours; `splice` may shift up to n elements. All bookings are stored.' },
  alternative: {
    title: 'Linear scan',
    md: 'Keep an unsorted array and test each existing booking with the half-open overlap test. O(n) per call — perfectly fine for 1000 calls and the easiest to get right.',
    code: `class MyCalendar {
  constructor() { this.bookings = []; }
  book(start, end) {
    for (const [s, e] of this.bookings) if (start < e && s < end) return false;
    this.bookings.push([start, end]);
    return true;
  }
}`,
    complexity: 'O(n) per call, O(n) space',
  },
  mistakes: [
    'Checking only the successor (or only the predecessor).',
    'Using `<=` — [10,20) and [20,30) do not overlap.',
    'Adding the booking before checking, or adding it even when the check fails.',
  ],
};
