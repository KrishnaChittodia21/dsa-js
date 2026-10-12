export default {
  signals: [
    'input is (start, duration) — convert to (start, end) before anything else',
    '"minimum number of points / arrows / taps that hit every range"',
    '"common free time of all employees" → merge everyone, then read the gaps',
    '"remove the fewest intervals" → n minus the maximum you can keep',
    '"how many ranges contain point p" for many queries',
    'a stream of book(start, end) calls answered online',
    '"total length covered by the union"',
  ],
  tricks: [
    {
      title: 'Convert closed integer ranges to half-open first',
      kind: 'edge-cases',
      md: "Turn [s, e] (inclusive integers) into [s, e + 1). In half-open form the overlap test is always `a.start < b.end && b.start < a.end`, the length is `end − start`, and touching ranges like [1, 2) and [2, 3) do not overlap — no more guessing between `<` and `<=` in every comparison. Convert once on input, convert back on output if needed.",
      code: `const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1]; // half-open
const toHalfOpen = ([s, e]) => [s, e + 1];          // closed integers → half-open
console.log(overlaps(toHalfOpen([1, 2]), toHalfOpen([2, 3]))); // → true
console.log(overlaps([1, 2], [2, 3])); // → false`,
    },
    {
      title: 'Count rooms with two sorted arrays instead of event objects',
      kind: 'optimization',
      md: "For “minimum rooms / max simultaneous” you never need to know WHICH meeting ended, only that one did. Sort all starts and all ends separately and walk them with two pointers: when the next start is at or after the earliest unused end, a room frees up. This avoids building 2n event pairs and a tie-breaking comparator, and needs no heap.",
      code: `function minRooms(iv) {
  const s = iv.map((x) => x[0]).sort((a, b) => a - b);
  const e = iv.map((x) => x[1]).sort((a, b) => a - b);
  let rooms = 0, j = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] >= e[j]) j++; // a meeting has ended → reuse its room
    else rooms++;
  }
  return rooms;
}
console.log(minRooms([[0, 30], [5, 10], [15, 20]])); // → 2`,
    },
    {
      title: 'Let a Map of deltas resolve sweep ties for you',
      kind: 'template',
      md: "Instead of sorting `[time, ±1]` events with a careful tie rule, add +1 at each start and −1 at each end into a Map keyed by time, then walk the times in sorted order. Everything happening at the same moment is merged into one net change, so an interval ending at 5 and another starting at 5 cancel out (half-open semantics) automatically. With small coordinates, use a plain array as a difference array and skip the sort entirely.",
      code: `function maxOverlap(iv) {
  const delta = new Map();
  for (const [s, e] of iv) {
    delta.set(s, (delta.get(s) ?? 0) + 1);
    delta.set(e, (delta.get(e) ?? 0) - 1);
  }
  let cur = 0, best = 0;
  for (const t of [...delta.keys()].sort((a, b) => a - b)) best = Math.max(best, (cur += delta.get(t)));
  return best;
}
console.log(maxOverlap([[1, 5], [5, 8], [2, 6]])); // → 2`,
    },
    {
      title: 'Insert into sorted intervals in three phases — no re-sort',
      kind: 'template',
      md: "When the list is already sorted and disjoint, inserting one interval is O(n): copy everything that ends before the new start, absorb everything that starts before (or at) the new end by widening with min/max, then copy the rest. Re-sorting and re-merging works too but costs O(n log n) and hides the structure the interviewer wants to see.",
      code: `function insert(iv, [s, e]) {
  const out = [];
  let i = 0;
  while (i < iv.length && iv[i][1] < s) out.push(iv[i++]);   // fully left
  while (i < iv.length && iv[i][0] <= e) {                   // overlapping
    s = Math.min(s, iv[i][0]); e = Math.max(e, iv[i][1]); i++;
  }
  out.push([s, e]);
  while (i < iv.length) out.push(iv[i++]);                   // fully right
  return out;
}
console.log(insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])); // → [[1,2],[3,10],[12,16]]`,
    },
    {
      title: 'Three problems, one greedy: only the comparison changes',
      kind: 'recognition',
      md: "“Max non-overlapping”, “min removals to make non-overlapping” and “min arrows to burst balloons” are the same earliest-end greedy. Removals = n − kept. Arrows = kept when touching ranges SHARE a point (closed ranges), so use `start > lastEnd` instead of `>=`. Recognising this saves you from deriving three separate solutions.",
      code: `function maxKept(iv, touchingOk = true) {
  const sorted = iv.toSorted((a, b) => a[1] - b[1]);
  let count = 0, end = -Infinity;
  for (const [s, e] of sorted) {
    if (touchingOk ? s >= end : s > end) { count++; end = e; }
  }
  return count;
}
const iv = [[1, 2], [2, 3], [3, 4], [1, 3]];
console.log(iv.length - maxKept(iv)); // → 1 (min removals)
console.log(maxKept(iv, false)); // → 2 (min arrows)`,
    },
    {
      title: 'Answer "how many intervals cover p" with two binary searches',
      kind: 'template',
      md: "An interval [s, e] covers p exactly when s ≤ p and e ≥ p. Every interval with e < p also has s ≤ p, so the count is (#starts ≤ p) − (#ends < p). Sort starts and ends once, then each query is two binary searches: O((n + q) log n) instead of O(n · q).",
      code: `const countAtMost = (a, x) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= x) lo = m + 1; else hi = m; } return lo; };
const countLess = (a, x) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; } return lo; };
function coverCounts(iv, points) {
  const S = iv.map((x) => x[0]).sort((a, b) => a - b);
  const E = iv.map((x) => x[1]).sort((a, b) => a - b);
  return points.map((p) => countAtMost(S, p) - countLess(E, p));
}
console.log(coverCounts([[1, 4], [2, 3], [4, 7]], [2, 4, 5, 8])); // → [2,2,1,0]`,
    },
    {
      title: 'No TreeMap in JS: sorted array + binary search + splice',
      kind: 'javascript',
      md: "Online “book this range?” problems are solved with a TreeMap in Java. JavaScript has none, but a sorted array of disjoint intervals works: binary-search the insert position, check only the left and right neighbours, then `splice` it in. splice is O(n) but it is a fast memory move, so this comfortably handles ~10^4–10^5 bookings. Mention the balanced-BST alternative in interviews.",
      code: `class Calendar {
  constructor() { this.iv = []; } // sorted, disjoint, half-open [s, e)
  book(s, e) {
    let lo = 0, hi = this.iv.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.iv[m][0] < s) lo = m + 1; else hi = m; }
    if (lo > 0 && this.iv[lo - 1][1] > s) return false;            // left neighbour
    if (lo < this.iv.length && this.iv[lo][0] < e) return false;   // right neighbour
    this.iv.splice(lo, 0, [s, e]);
    return true;
  }
}
const cal = new Calendar();
console.log([cal.book(10, 20), cal.book(15, 25), cal.book(20, 30)]); // → [true,false,true]`,
    },
    {
      title: 'Free time is the gaps between merged blocks',
      kind: 'recognition',
      md: "“Common free time”, “uncovered ranges” and “missing ranges” are complements: merge all intervals first (sort by start, extend with Math.max), then every gap between consecutive merged blocks is free. Thinking in complements avoids writing a fresh, bug-prone algorithm for the free parts.",
      code: `function freeTime(iv) {
  const merged = [];
  for (const [s, e] of iv.toSorted((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  const gaps = [];
  for (let i = 1; i < merged.length; i++) gaps.push([merged[i - 1][1], merged[i][0]]);
  return gaps;
}
console.log(freeTime([[1, 3], [6, 7], [2, 4], [2, 5], [9, 12]])); // → [[5,6],[7,9]]`,
    },
    {
      title: 'Test with a contained interval and a duplicate',
      kind: 'interview',
      md: "Before saying “done”, run your code by hand on [[1, 10], [2, 3], [2, 3], [10, 11]]. It contains a fully nested interval (catches `last.end = e` instead of Math.max), an exact duplicate, and a touching pair (forces you to state your closed/half-open choice). One example covering all three is faster than three separate tests and shows the interviewer you know the classic failure points.",
    },
  ],
  traps: [
    {
      looksLike: 'Merge intervals (sort by start)',
      actually: 'Interval scheduling greedy (sort by end)',
      why: 'when the goal is the most ranges kept or the fewest removed, the earliest finishing range is the safe choice — start order can pick one long range that blocks many',
    },
    {
      looksLike: 'Merging to find the minimum number of rooms',
      actually: 'Maximum simultaneous count (sweep or two sorted arrays)',
      why: 'merging collapses [1,10], [2,3], [4,5] into one block and forgets that two meetings overlapped at once',
    },
    {
      looksLike: 'Two-pointer intersection of two interval lists',
      actually: 'Merge each list first, then two pointers',
      why: 'the two-pointer walk is only correct when each list is sorted AND internally disjoint',
    },
    {
      looksLike: 'Checking every pair of intervals for overlap (O(n²))',
      actually: 'Sort once, compare only neighbours / sweep',
      why: 'after sorting by start, an interval can only overlap the current merged block, so one pass suffices',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Interval', url: 'https://www.techinterviewhandbook.org/algorithms/interval/' },
    { label: 'MDN — Array.prototype.splice()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice' },
    { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
  ],
};
