const PATTERNS = [
  {
    id: 'intervals-merge',
    name: 'Intervals — Sort by Start & Merge',
    summary: 'Sort intervals by start; walk left to right, either extending the last merged interval or starting a new one.',
    whyItExists: 'Comparing every pair of intervals for overlap is O(n²). Once intervals are sorted by start, an interval can only overlap the ones *just before it*, so a single left-to-right pass that remembers the last merged interval is enough: O(n log n) for the sort plus O(n) for the pass.',
    whenToUse: [
      'Merge / union all overlapping ranges',
      'Insert a new range into a sorted, disjoint list',
      'Total covered length, gaps between ranges, covered/contained intervals',
      'Compress sorted numbers into consecutive runs ("summary ranges")',
    ],
    clues: ['"merge overlapping"', '"insert interval"', '"total time covered"', '"remove covered intervals"', '"consecutive ranges"', '"free time"'],
    whenNotToUse: [
      'You need the maximum number of intervals alive at the same moment → sweep line',
      'You must choose a subset of non-overlapping intervals → greedy by end time',
      'Intervals arrive one at a time and queries interleave → design with a sorted structure',
    ],
    template: `function merge(intervals) {
  const sorted = intervals.toSorted((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e); // overlap → extend
    else out.push([s, e]);                                   // gap → new interval
  }
  return out;
}`,
    variations: [
      { name: 'Insert into sorted list', description: 'Three phases: copy intervals ending before the new one, absorb all that overlap it, copy the rest. O(n), no sort needed.' },
      { name: 'Covered intervals', description: 'Sort by start ascending, end **descending** so a container comes before what it contains; track the max end seen.' },
      { name: 'Runs of numbers', description: 'Summary Ranges: each number is a point interval [x, x]; "touching" means next === prev + 1.' },
      { name: 'Total covered length', description: 'Merge, then sum (end − start) of the merged list (Teemo Attacking is the one-pass version).' },
    ],
    mistakes: [
      'Forgetting to sort (or sorting with the default lexicographic sort)',
      'Setting last.end = e instead of Math.max(last.end, e) — a short interval inside a long one would shrink it',
      'Using < instead of <= when touching intervals ([1,4],[4,5]) should merge',
      'Mutating the caller\'s arrays when the problem expects a fresh result',
    ],
    evolution: {
      easy: 'Two-interval overlap test, runs of consecutive numbers, total covered duration.',
      medium: 'Merge all, insert one, remove covered intervals.',
      hard: 'Maintain merged intervals under a stream of insertions (Data Stream as Disjoint Intervals).',
    },
  },
  {
    id: 'intervals-greedy-end',
    name: 'Intervals — Greedy by Earliest End',
    summary: 'Sort by end time; repeatedly keep the interval that finishes first and skip everything that clashes with it.',
    whyItExists: 'To keep the maximum number of non-overlapping intervals (or to stab all intervals with the fewest points) you must choose. An exchange argument shows that the interval ending earliest is always part of some optimal answer, so a single greedy pass after sorting by end is optimal — no search or DP needed.',
    whenToUse: [
      'Maximum number of non-overlapping intervals / activity selection',
      'Minimum removals to make the rest non-overlapping (= n − max kept)',
      'Minimum points (arrows) that hit every interval',
    ],
    clues: ['"minimum number of intervals to remove"', '"maximum number of meetings you can attend" (one room)', '"minimum arrows"', '"non-overlapping"'],
    whenNotToUse: [
      'Intervals have weights/profits → weighted interval scheduling needs DP + binary search',
      'You need to merge rather than choose → sort by start and merge',
      'Counting simultaneous overlaps → sweep line',
    ],
    template: `function maxNonOverlapping(intervals) {
  const sorted = intervals.toSorted((a, b) => a[1] - b[1]); // earliest end first
  let kept = 0;
  let lastEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (s >= lastEnd) {   // compatible with everything kept so far
      kept++;
      lastEnd = e;
    }                     // else: skip it (it ends later than lastEnd anyway)
  }
  return kept;
}`,
    variations: [
      { name: 'Minimum removals', description: 'answer = n − maxNonOverlapping (Non-overlapping Intervals).' },
      { name: 'Minimum arrows / points', description: 'Same pass, but touching endpoints count as overlapping (use s > lastEnd to need a new arrow).' },
      { name: 'Sort by start variant', description: 'Also possible: on overlap keep the one with the smaller end. Equivalent, but the end-sorted version is easier to prove.' },
    ],
    mistakes: [
      'Sorting by start and always keeping the earlier-starting interval (a long early interval blocks many short ones)',
      'Getting the touching rule wrong: [1,2],[2,3] do not overlap in "non-overlapping intervals" but share a point for balloons',
      'Using a[1] - b[1] with huge values in languages with overflow — fine in JS numbers, but know why',
    ],
    evolution: {
      easy: 'Can one person attend all meetings? (sort and check neighbours).',
      medium: 'Minimum removals, minimum arrows, maximum meetings in one room.',
      hard: 'Weighted versions (DP), or "at most k rooms" versions that combine greedy with a heap.',
    },
  },
  {
    id: 'intervals-two-pointer-intersection',
    name: 'Intervals — Two-Pointer Intersection',
    summary: 'Walk two sorted, disjoint interval lists at once; the overlap of the current pair is [max(starts), min(ends)]; advance whichever ends first.',
    whyItExists: 'Checking every pair from two lists is O(n·m). Because each list is sorted and disjoint, the interval that ends first cannot intersect anything later in the other list, so it can be discarded — every step discards one interval: O(n + m).',
    whenToUse: [
      'Intersection of two sorted interval lists (two people\'s free time, two schedules)',
      'Common free slots for two calendars',
      'Difference / union of two sorted interval lists',
    ],
    clues: ['"two lists of intervals"', '"each list is pairwise disjoint and sorted"', '"intersection"', '"common free time"'],
    whenNotToUse: [
      'Lists are not sorted/disjoint → merge each list first',
      'More than two lists → merge all of them or use a sweep line',
    ],
    template: `function intersect(A, B) {
  const out = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length) {
    const lo = Math.max(A[i][0], B[j][0]);
    const hi = Math.min(A[i][1], B[j][1]);
    if (lo <= hi) out.push([lo, hi]);   // they overlap
    if (A[i][1] < B[j][1]) i++;         // drop the one that ends first
    else j++;
  }
  return out;
}`,
    variations: [
      { name: 'Common free time', description: 'Complement each schedule into free slots, then intersect the free lists.' },
      { name: 'Meeting scheduler', description: 'Intersect two slot lists and return the first overlap of length ≥ duration.' },
    ],
    mistakes: [
      'Advancing both pointers after an intersection — the longer interval may still overlap the next one',
      'Using lo < hi for closed intervals: a single shared point [5,5] is a valid intersection',
    ],
    evolution: {
      easy: 'Do two single intervals overlap?',
      medium: 'Interval List Intersections.',
      hard: 'Employee Free Time across k schedules (heap or sweep).',
    },
  },
  {
    id: 'intervals-sweep-line',
    name: 'Intervals — Sweep Line (+1/−1 events)',
    summary: 'Turn every interval into a start event (+1) and an end event (−1), sort the events by time, and scan them while keeping a running count (or a max structure).',
    whyItExists: 'Questions like "how many intervals are active at the busiest moment?" are about points in time, not about pairs of intervals. The count only changes at interval endpoints, so it is enough to visit the 2n endpoints in order and update a counter — O(n log n) instead of checking every moment or every pair.',
    whenToUse: [
      'Maximum number of simultaneous intervals (meeting rooms, platforms, CPU load)',
      'Minimum resources so that nothing overlaps',
      'The shape of a union with heights (skyline) — sweep + max structure',
      'Answer many point queries offline (sort queries, sweep through intervals)',
    ],
    clues: ['"minimum number of rooms / platforms"', '"maximum overlap at any time"', '"how many are active at time t"', '"skyline / outline"', '"for each query point"'],
    whenNotToUse: [
      'You need the merged ranges themselves → merge pattern is simpler',
      'You need to select intervals → greedy by end',
      'Online updates with immediate answers → a balanced BST / segment tree (later topics)',
    ],
    template: `function maxOverlap(intervals) {
  const events = [];
  for (const [s, e] of intervals) {
    events.push([s, +1]);
    events.push([e, -1]);
  }
  // same time: process -1 before +1 so [1,5] and [5,8] do not count as overlapping
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0, best = 0;
  for (const [, delta] of events) {
    active += delta;
    best = Math.max(best, active);
  }
  return best;
}`,
    variations: [
      { name: 'Sorted starts + sorted ends', description: 'Two sorted arrays and two pointers; equivalent to events, often shorter (Meeting Rooms II).' },
      { name: 'Difference array', description: 'When times are small integers, add +1 at start and −1 at end+1 in an array and prefix-sum it.' },
      { name: 'Sweep + max structure', description: 'Keep the heights of active intervals in a MaxHeap with lazy deletion; output a point when the max changes (Skyline).' },
      { name: 'Offline queries', description: 'Sort queries; while sweeping, add intervals that have started and discard ones that have ended (Minimum Interval to Include Each Query).' },
    ],
    mistakes: [
      'Wrong tie-breaking at equal times (end before start for half-open intervals)',
      'Sorting events with the default sort — it compares arrays as strings',
      'Forgetting that ties among starts/ends matter for the skyline (taller starts first, shorter ends first)',
    ],
    evolution: {
      easy: 'Count active intervals at a single time t.',
      medium: 'Meeting Rooms II, car pooling, my calendar II.',
      hard: 'The Skyline Problem, minimum interval per query — sweep plus a heap.',
    },
  },
  {
    id: 'intervals-design',
    name: 'Intervals — Maintained Sorted Interval Set',
    summary: 'Keep intervals sorted and disjoint inside a data structure; each operation binary-searches the neighbours of a new interval and only touches those.',
    whyItExists: 'When intervals arrive one by one and every call needs an answer immediately, re-sorting or re-merging everything per call costs O(n log n) each time. Keeping the set always sorted and disjoint means a new interval can only interact with its immediate neighbours, which binary search finds in O(log n).',
    whenToUse: [
      'Booking systems: "can I add [s, e) without a conflict?"',
      'Streams of numbers or ranges where you must report the disjoint intervals at any moment',
      'Range add/remove (Range Module) style problems',
    ],
    clues: ['"implement a class"', '"book(start, end) returns true/false"', '"addNum / getIntervals"', '"calls are interleaved"'],
    whenNotToUse: [
      'All intervals are known up front → sort once and use merge / sweep',
      'You need counts of overlaps up to k (e.g. My Calendar III) → sweep over a sorted map of deltas',
    ],
    template: `// sorted, disjoint list of [start, end) — find the first interval that starts at or after x
function lowerBound(list, x) {
  let lo = 0, hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid][0] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}
function tryBook(list, s, e) {
  const i = lowerBound(list, s);
  if (i < list.length && list[i][0] < e) return false;   // next one starts too early
  if (i > 0 && list[i - 1][1] > s) return false;         // previous one ends too late
  list.splice(i, 0, [s, e]);                             // keep it sorted
  return true;
}`,
    variations: [
      { name: 'Conflict check (My Calendar I)', description: 'Only the predecessor and successor can conflict with a new booking.' },
      { name: 'Merge on insert (Disjoint Intervals)', description: 'A new point may extend the left neighbour, the right neighbour, or glue both together.' },
      { name: 'Balanced tree', description: 'In languages with a TreeMap, floor/ceiling lookups make every operation O(log n). JS has none built in; a sorted array + splice is O(n) per insert but fast in practice.' },
    ],
    mistakes: [
      'Checking only one neighbour',
      'Mixing closed and half-open conventions (My Calendar uses [start, end))',
      'Rebuilding the whole structure on every call',
    ],
    evolution: {
      easy: 'Store all bookings in a list and check each (O(n) per call).',
      medium: 'Sorted list + binary search for neighbours (My Calendar I).',
      hard: 'Merge on insert (Data Stream as Disjoint Intervals), Range Module, My Calendar III.',
    },
  },
];

export default {
  id: 'intervals',
  summary: 'Treat ranges as [start, end] pairs: sort them, then merge them, choose among them greedily, intersect them with two pointers, or sweep across their endpoints.',

  jsTools: [
    { api: 'arr.sort((a, b) => a[0] - b[0])', use: 'Sort intervals by start (default sort would compare them as strings!)', complexity: 'O(n log n), mutates' },
    { api: 'arr.toSorted(cmp)', use: 'Sorted copy that leaves the input untouched (ES2023)', complexity: 'O(n log n) time, O(n) space' },
    { api: 'a[0] - b[0] || b[1] - a[1]', use: 'Tie-break: start ascending, then end descending', complexity: 'O(1) per comparison' },
    { api: 'const [s, e] = interval', use: 'Destructure an interval for readable code', complexity: 'O(1)' },
    { api: 'arr.splice(i, 0, x)', use: 'Insert into a sorted array at the binary-searched index', complexity: 'O(n) (shifts elements)' },
    { api: 'MinHeap / MaxHeap (toolkit)', use: 'Active intervals keyed by end, size or height (Heaps topic explains them)', complexity: 'push / pop O(log n)' },
  ],

  patterns: PATTERNS,

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `An **interval** is a stretch of something continuous — time, positions on a line, numbers — described by where it **starts** and where it **ends**. In code we store it as a pair: \`[start, end]\`.

\`\`\`text
meetings = [[9, 10], [9.5, 12], [14, 15]]

 9    10   11   12   13   14   15
 |----|                              [9, 10]
   |-----------|                     [9.5, 12]
                          |----|     [14, 15]
\`\`\`

Interval problems ask things like: *Which meetings clash? What is the total busy time? How many rooms do we need? Which ranges can I keep without clashes?* Almost all of them start with the same move: **sort the intervals**, so that neighbours in the array are neighbours on the line.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Closed interval** \`[a, b]\` — includes both ends. \`[1, 3]\` and \`[3, 5]\` share the point 3, so they **overlap**.
- **Half-open interval** \`[a, b)\` — includes \`a\` but not \`b\`. A meeting from 9 to 10 is usually half-open: another meeting may start at 10. \`[1, 3)\` and \`[3, 5)\` do **not** overlap.
- **Overlap** — the two intervals share at least one point.
- **Disjoint** — no two intervals in a set overlap.
- **Contained / covered** — \`[c, d]\` is inside \`[a, b]\` when \`a <= c\` and \`d <= b\`.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Think of bookings on a single meeting-room calendar. Each booking is a coloured bar on a timeline. Merging = shading the busy parts; greedy selection = fitting as many bookings as possible into one room; sweep line = walking along the timeline counting how many bars you are standing on.',
          },
          {
            type: 'text',
            md: `### The one overlap test you must know

Two intervals \`a\` and \`b\` overlap **exactly when each one starts before the other one ends**:

\`\`\`js
// half-open [start, end): touching does NOT count
const overlaps = a[0] < b[1] && b[0] < a[1];
// closed [start, end]: touching DOES count
const overlapsClosed = a[0] <= b[1] && b[0] <= a[1];
\`\`\`

Why? It is easier to describe when they **don't** overlap: either \`a\` ends before \`b\` starts (\`a.end <= b.start\`) or \`b\` ends before \`a\` starts (\`b.end <= a.start\`). Negate that "or" (De Morgan) and you get the "and" above. The shared part, if any, is always \`[max(starts), min(ends)]\`.`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-1',
            question: 'Using half-open intervals `[start, end)`, which pair **overlaps**?',
            options: [
              '[1, 3) and [3, 6)',
              '[5, 8) and [1, 5)',
              '[2, 10) and [4, 5)',
              '[0, 1) and [2, 3)',
            ],
            answer: 2,
            explanation: '`2 < 5` and `4 < 10` — each starts before the other ends. In fact [4, 5) lies completely inside [2, 10). Containment is a special case of overlap.',
            misconceptions: {
              0: 'With half-open intervals, [1, 3) stops *just before* 3, so it only touches [3, 6). The test `3 < 3` is false. (With closed intervals this pair would overlap.)',
              1: 'Order in the pair does not matter: [1, 5) ends exactly where [5, 8) starts, so they only touch. `5 < 5` is false.',
              3: 'There is a gap between 1 and 2 — the first ends before the second starts.',
            },
            deeper: 'A common mistake is testing only `a.start <= b.start <= a.end`. That misses the case where **b starts before a** and reaches into it. The symmetric test `a.start < b.end && b.start < a.end` covers every arrangement, including containment in either direction.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Without structure, interval questions turn into "compare every pair": with \`n\` intervals that is \`n(n−1)/2\` comparisons — **O(n²)**. For 10⁵ meetings that is 5·10⁹ checks, far too slow.

Sorting (which you learned in the Sorting topic) changes the picture. After sorting by start:

- an interval can only overlap intervals that are **close to it** in the array;
- as soon as you meet an interval that starts after the current merged block ends, **nothing later** can touch that block either.

So one pass after one sort is enough: **O(n log n)** total. Every technique in this topic is a way of exploiting sorted order.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Every pair — O(n²)',
              code: `let clash = false;
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    if (a[i][0] < a[j][1] && a[j][0] < a[i][1]) clash = true;`,
            },
            right: {
              title: 'Sort, then neighbours only — O(n log n)',
              code: `const s = a.toSorted((x, y) => x[0] - y[0]);
let clash = false;
for (let i = 1; i < n; i++)
  if (s[i][0] < s[i - 1][1]) clash = true; // only the previous one matters`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you see **why** checking only adjacent pairs is enough to detect any clash once intervals are sorted by start?',
            deeper: `Suppose intervals \`i < j\` clash but are not adjacent, with \`k\` somewhere between them. Sorted by start means \`start[i] <= start[k] <= start[j]\`. Since \`i\` and \`j\` clash, \`start[j] < end[i]\`, so \`start[k] <= start[j] < end[i]\` — interval \`k\` starts before \`i\` ends, so \`k\` clashes with \`i\` too. Repeat the argument and you find a clashing **adjacent** pair. Sorted order "squeezes" any clash down to neighbours.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `The input is a list of ranges (pairs, start/end times, [left, right] segments) — or something you can turn into ranges (a number \`x\` with duration \`d\` becomes \`[x, x + d]\`). Then pick the tool by the **question** being asked:

| Question | Technique | Sort by |
|---|---|---|
| Merge / union / total covered length / insert | **Merge** | start |
| Keep the most non-overlapping, remove the fewest, fewest points to hit all | **Greedy by earliest end** | end |
| Overlap of two sorted lists | **Two pointers** | (already sorted) |
| How many at the same time? Rooms needed? Outline / skyline? Point queries? | **Sweep line** | event time |
| Intervals arrive one by one, answer each call | **Sorted interval set (design)** | kept sorted |`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'Always settle the endpoint convention first',
            md: 'Before writing code, decide whether touching intervals overlap. Meetings `[1,5]` and `[5,8]` can share a room (half-open), but balloons `[1,5]` and `[5,8]` can be burst by one arrow at x = 5 (closed). The only difference in code is `<` versus `<=` — and it is the number-one source of wrong answers.',
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-2',
            question: '"Given lecture times, find the minimum number of classrooms needed so no two lectures in the same room overlap." Which technique fits best?',
            options: [
              'Merge intervals, then count the merged blocks',
              'Greedy by earliest end, then count the kept intervals',
              'Sweep line: the answer is the maximum number of lectures running at the same moment',
              'Two-pointer intersection of the lecture list with itself',
            ],
            answer: 2,
            explanation: 'At the busiest instant, every running lecture needs its own room, so you need at least that many; and that many is always enough (a free room exists whenever a new lecture starts). "Max simultaneous" is exactly what a sweep line computes.',
            misconceptions: {
              0: 'Merging hides *how many* intervals overlap. [1,10], [2,3], [4,5] merge into one block, yet you need 2 rooms.',
              1: 'Greedy by end finds how many lectures fit into **one** room, not how many rooms you need for all of them.',
              3: 'Two-pointer intersection works on two different disjoint lists; a list intersected with itself just gives itself back.',
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
            clues: ['input is pairs [start, end]', 'meetings / bookings / events / balloons / buildings', '"overlapping"', '"merge"', '"minimum rooms"', '"remove the minimum number so the rest don\'t overlap"', '"covered"', '"free time"'],
            conclusion: 'Think Intervals: sort first, then merge / greedy / two pointers / sweep line',
          },
          {
            type: 'text',
            md: `Hidden intervals are common too:

- **Teemo Attacking** — each attack at time \`t\` poisons \`[t, t + duration)\`.
- **Summary Ranges** — each number is a tiny interval \`[x, x]\`; consecutive numbers "touch".
- **Car pooling / flights** — each trip is \`[from, to)\` carrying some weight; a sweep adds and removes it.
- **Skyline** — each building is an interval with a height.`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-3',
            question: '"Given balloons as horizontal ranges [xStart, xEnd], find the minimum number of vertical arrows that burst all of them." Which idea is intended?',
            options: [
              'Merge overlapping balloons and return the number of merged blocks',
              'Sort by end; shoot an arrow at the end of the first unburst balloon, skip all balloons it hits, repeat',
              'Sweep line: the answer is the maximum number of balloons stacked at one x',
              'Binary search on the number of arrows',
            ],
            answer: 1,
            explanation: 'This is a "choose points greedily" problem. Shooting as far right as possible while still hitting the balloon that ends first hits the most future balloons — the greedy-by-end pattern.',
            misconceptions: {
              0: 'Merged blocks can be chains: [1,2], [2,3], [3,4] merge into one block, but one arrow cannot hit [1,2] and [3,4] together. You would answer 1 instead of 2.',
              2: 'Balloons stacked at the same x can all be burst by **one** arrow, so maximum stacking is the easy case, not the answer. [1,2], [3,4], [5,6] never stack (max 1) yet need 3 arrows — "rooms" logic answers the opposite question.',
              3: 'Binary search needs a fast feasibility check for "k arrows", and that check would itself be the greedy. Just run the greedy.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Sort by start and walk left to right with a "current block" \`[curStart, curEnd]\`:

- The next interval starts **inside or at the edge** of the block (\`start <= curEnd\`) → it overlaps; stretch the block: \`curEnd = max(curEnd, end)\`.
- It starts **after** the block ends → there is a gap. The block is final (nothing later can start earlier, because we are sorted). Emit it and start a new block.

The invariant: *everything to the left of the current interval has already been merged into disjoint, finished blocks, plus one open block that may still grow.*`,
          },
          {
            type: 'visual',
            scenario: 'interval-merge',
            input: { intervals: [[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]] },
            caption: 'Sorted by start: each interval either stretches the current block or starts a new one.',
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-4',
            question: 'The current merged block is `[1, 10]` and the next (sorted) interval is `[2, 5]`. What should the block become?',
            options: [
              '[1, 5] — take the new end',
              '[2, 10] — take the new start',
              '[1, 10] — the new interval is contained, nothing changes',
              'Two blocks: [1, 10] and [2, 5]',
            ],
            answer: 2,
            explanation: '`2 <= 10`, so they overlap, and the new end is `max(10, 5) = 10`. A contained interval changes nothing — that is exactly why we use `Math.max` and not plain assignment.',
            misconceptions: {
              0: 'Replacing the end with `5` would *shrink* the block and lose [5, 10]. Always `curEnd = Math.max(curEnd, end)`.',
              1: 'The start of a block never changes after it opens: sorted order guarantees later intervals start at or after it.',
              3: 'They overlap, so they must be merged; the output must be disjoint.',
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
            md: 'For **Merge Intervals** a natural first idea: keep merging any overlapping pair until no pair overlaps. It is correct, but each round scans all pairs, and there can be up to n rounds.',
          },
          {
            type: 'code',
            title: 'Repeated pairwise merging — O(n³) worst case',
            code: `function mergeBrute(intervals) {
  const list = intervals.map(([s, e]) => [s, e]);
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]];
        if (a[0] <= b[1] && b[0] <= a[1]) {           // closed overlap test
          list[i] = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
          list.splice(j, 1);
          changed = true;
          break outer;                                // restart the scan
        }
      }
    }
  }
  return list.sort((x, y) => x[0] - y[0]);
}`,
            caption: 'Each merge removes one interval (≤ n merges), and finding a pair costs O(n²).',
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-5',
            question: 'Why does sorting by start make the pairwise search unnecessary?',
            options: [
              'Sorting removes duplicate intervals',
              'After sorting, if the next interval starts after the current block ends, no later interval can reach back into that block',
              'Sorting makes every interval overlap its neighbour',
              'Sorting by start also sorts by end, so the ends are in order',
            ],
            answer: 1,
            explanation: 'Later intervals start even later (sorted), so they start after the block ends too. The block is final — we never have to look back. That turns the search into one linear pass.',
            misconceptions: {
              0: 'Sorting does not remove anything; duplicates are merged by the normal overlap rule.',
              2: 'Sorted intervals can still have gaps — that is exactly when a new block starts.',
              3: 'Ends are **not** sorted: [1, 10] comes before [2, 3]. That is why we need `Math.max` for the end.',
            },
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — sort & merge',
        blocks: [
          {
            type: 'steps',
            title: 'Merge Intervals in O(n log n)',
            steps: [
              'Sort a copy of the intervals by start: `toSorted((a, b) => a[0] - b[0])`.',
              'Start the output with the first interval.',
              'For each next interval `[s, e]`: if `s <= last[1]`, set `last[1] = Math.max(last[1], e)`.',
              'Otherwise push `[s, e]` as a new block.',
              'Return the output — it is sorted and disjoint.',
            ],
          },
          {
            type: 'text',
            md: `**Insert Interval** is the same idea with a twist: the list is already sorted and disjoint, so no sort is needed. Walk in three phases:

1. copy every interval that **ends before** the new one starts;
2. **absorb** every interval that overlaps: \`new = [min(starts), max(ends)]\`;
3. copy the rest.

That is O(n) — you cannot do better because the output itself may be O(n) long.`,
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template — merge',
        blocks: [
          {
            type: 'code',
            title: 'Merge template',
            code: `function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  const sorted = intervals.toSorted((a, b) => a[0] - b[0]);
  const out = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = out[out.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e); // use < for half-open
    else out.push([s, e]);
  }
  return out;
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation — merge & insert',
        blocks: [
          {
            type: 'code',
            title: 'Insert Interval — three phases, O(n)',
            code: `function insert(intervals, newInterval) {
  const out = [];
  let [s, e] = newInterval;
  let i = 0;
  const n = intervals.length;
  while (i < n && intervals[i][1] < s) out.push(intervals[i++]);   // 1. strictly before
  while (i < n && intervals[i][0] <= e) {                          // 2. overlapping
    s = Math.min(s, intervals[i][0]);
    e = Math.max(e, intervals[i][1]);
    i++;
  }
  out.push([s, e]);
  while (i < n) out.push(intervals[i++]);                          // 3. strictly after
  return out;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- **Never** call \`intervals.sort()\` with no comparator: arrays are converted to strings, so \`[[10, 12], [9, 11]]\` sorts as \`"10,12" < "9,11"\` → wrong order.
- \`toSorted\` (ES2023) returns a copy; \`sort\` mutates the caller's array. Both are stable.
- Push **copies** (\`[s, e]\`) into the output if you later mutate \`last[1]\`, otherwise you silently edit the input intervals.
- Tie-breakers chain with \`||\`: \`(a, b) => a[0] - b[0] || b[1] - a[1]\` (a zero difference falls through to the next key).`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run — merge',
        blocks: [
          {
            type: 'dryrun',
            title: 'merge([[1,3],[8,10],[2,6],[15,18],[9,12]])',
            columns: ['step', 'interval', 'last block', 'overlap?', 'output'],
            rows: [
              ['sort', '—', '—', '—', 'sorted: [1,3] [2,6] [8,10] [9,12] [15,18]'],
              ['1', '[1,3]', '—', 'first', '[[1,3]]'],
              ['2', '[2,6]', '[1,3]', '2 ≤ 3 yes → end = max(3,6)', '[[1,6]]'],
              ['3', '[8,10]', '[1,6]', '8 ≤ 6 no → new block', '[[1,6],[8,10]]'],
              ['4', '[9,12]', '[8,10]', '9 ≤ 10 yes → end = 12', '[[1,6],[8,12]]'],
              ['5', '[15,18]', '[8,12]', '15 ≤ 12 no → new block', '[[1,6],[8,12],[15,18]]'],
            ],
            note: 'One pass after the sort. Each interval is looked at exactly once.',
          },
        ],
      },
      {
        id: 'intuition-greedy',
        title: 'Core intuition — greedy by earliest end',
        blocks: [
          {
            type: 'text',
            md: `New question: *keep as many intervals as possible so that none overlap* (equivalently, remove as few as possible). Now we must **choose**.

Tempting rules that fail:

| Rule | Counter-example |
|---|---|
| Earliest **start** first | \`[1,100], [2,3], [4,5]\` → picks [1,100] and blocks the other two |
| **Shortest** first | \`[1,5], [4,7], [6,10]\` → picks [4,7] and blocks both others; best is [1,5] + [6,10] |
| Fewest conflicts first | there are (more complicated) counter-examples too |

The rule that works: **always keep the interval that ends earliest**, then discard everything that overlaps it, and repeat.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why "earliest end" is safe — the exchange argument',
            md: `Let \`g\` be the interval with the earliest end. Take **any** optimal answer \`OPT\`, and let \`f\` be the interval in \`OPT\` that ends first.

- \`end(g) <= end(f)\` because \`g\` ends earliest of all.
- Every other interval in \`OPT\` starts at or after \`end(f)\` (they don't overlap \`f\`, and \`f\` ends first), hence also at or after \`end(g)\`.
- So swapping \`f\` for \`g\` gives a set that is still non-overlapping and **the same size**.

So some optimal answer contains \`g\`. Remove \`g\` and everything overlapping it; what is left is the same problem, smaller. By induction the greedy is optimal. Ending early "leaves the most room" for the future — and the exchange argument turns that slogan into a proof.`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-6',
            question: 'In the exchange argument, why can we replace `f` (first-ending interval of an optimal answer) by `g` (earliest-ending interval overall) without creating an overlap?',
            options: [
              'Because g and f are always the same interval',
              'Because g is the shortest interval',
              'Because every other chosen interval starts at or after end(f), and end(g) <= end(f), so they also start at or after end(g)',
              'Because g starts before f',
            ],
            answer: 2,
            explanation: 'The other intervals in OPT only "see" the end of whatever interval comes first. Since g ends no later than f, anything that fit after f also fits after g.',
            misconceptions: {
              0: 'They can differ — e.g. OPT might use [0,5] while g = [3,4]. The argument shows swapping is harmless, not that they are equal.',
              1: 'Length is irrelevant; the shortest-first rule is actually wrong. Only the **end** matters for what comes after.',
              3: 'g may start after f (g can sit inside f). Starts do not matter for the future — only ends do.',
            },
            deeper: 'Exchange arguments are the standard way to prove greedy algorithms: take an optimal solution, show you can swap one of its choices for the greedy choice without making it worse. You will use this again in the Greedy topic.',
          },
        ],
      },
      {
        id: 'optimized-greedy',
        title: 'Optimized approach — greedy by earliest end',
        blocks: [
          {
            type: 'steps',
            title: 'Non-overlapping Intervals (minimum removals)',
            steps: [
              'Sort by end: `(a, b) => a[1] - b[1]`.',
              'Keep `lastEnd = -Infinity` and `kept = 0`.',
              'For each `[s, e]`: if `s >= lastEnd` it fits → `kept++`, `lastEnd = e`. Otherwise skip it (it ends at or after lastEnd, so skipping it is never worse).',
              'Answer = `n − kept`.',
            ],
          },
          {
            type: 'text',
            md: `**Minimum arrows** is the same pass viewed differently. Shoot the first arrow at the end of the balloon that ends first — the furthest right you can shoot while still hitting it. Every balloon that **starts at or before** that point also gets burst (it hasn't ended yet, since it ends later). The first balloon with \`start > arrowX\` needs a new arrow. The number of arrows equals the number of intervals the greedy "keeps".`,
          },
        ],
      },
      {
        id: 'template-greedy',
        title: 'Pattern / template — greedy by end',
        blocks: [
          {
            type: 'code',
            title: 'Earliest-end greedy',
            code: `function greedyByEnd(intervals, touchingOverlaps = false) {
  const sorted = intervals.toSorted((a, b) => a[1] - b[1]);
  let count = 0;
  let lastEnd = -Infinity;
  for (const [s, e] of sorted) {
    const fits = touchingOverlaps ? s > lastEnd : s >= lastEnd;
    if (fits) {
      count++;          // keep this interval / shoot a new arrow at e
      lastEnd = e;
    }
  }
  return count;          // kept intervals, or arrows needed
}`,
          },
        ],
      },
      {
        id: 'implementation-greedy',
        title: 'JavaScript implementation — greedy by end',
        blocks: [
          {
            type: 'code',
            title: 'Minimum arrows to burst balloons',
            code: `function findMinArrowShots(points) {
  points.sort((a, b) => a[1] - b[1]);  // JS numbers: no overflow for ±2^31 values
  let arrows = 0;
  let arrowX = -Infinity;
  for (const [s, e] of points) {
    if (s > arrowX) {      // this balloon is not hit by the last arrow
      arrows++;
      arrowX = e;          // shoot as far right as possible
    }
  }
  return arrows;
}`,
            caption: 'Balloons are closed intervals: an arrow at x = 5 bursts [1,5] and [5,8], hence `s > arrowX`.',
          },
        ],
      },
      {
        id: 'dry-run-greedy',
        title: 'Dry run — greedy by end',
        blocks: [
          {
            type: 'dryrun',
            title: 'eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]])',
            columns: ['interval (sorted by end)', 'lastEnd', 'fits? (s ≥ lastEnd)', 'kept'],
            rows: [
              ['[1,2]', '-∞', 'yes', '1 (lastEnd = 2)'],
              ['[2,3]', '2', '2 ≥ 2 yes', '2 (lastEnd = 3)'],
              ['[1,3]', '3', '1 ≥ 3 no → remove', '2'],
              ['[3,4]', '3', '3 ≥ 3 yes', '3 (lastEnd = 4)'],
            ],
            note: 'kept = 3, so removals = 4 − 3 = 1. Ties in end ([2,3] and [1,3]) can go in either order — the proof never needed a tie-break.',
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why **sorting by start** and keeping the earlier interval can fail, while sorting by **end** cannot?',
            deeper: 'The start of an interval tells you nothing about how much of the future it blocks — [1,100] starts first but blocks everything. The end tells you *exactly* where the future becomes free. Greedy picks the choice that constrains the rest of the problem the least; for interval selection that is the earliest end. (A start-sorted version also works if, on every overlap, you keep the one with the smaller end — which is the same rule in disguise.)',
          },
        ],
      },
      {
        id: 'optimized-intersection',
        title: 'Optimized approach — two-pointer intersection',
        blocks: [
          {
            type: 'text',
            md: `Two lists \`A\` and \`B\`, each sorted and disjoint. For the current pair \`A[i]\`, \`B[j]\`:

- their intersection is \`[max(starts), min(ends)]\`, which is real when \`lo <= hi\` (closed intervals);
- the one that **ends first** cannot overlap anything later in the other list: those later intervals start after the current one of that list ends, which is already beyond the earlier end. So advance **that** pointer.

Each step advances one pointer → at most \`n + m\` steps: **O(n + m)**. This is the same "discard what can't matter any more" idea you saw in Two Pointers.`,
          },
          {
            type: 'code',
            title: 'Interval List Intersections',
            code: `function intervalIntersection(A, B) {
  const out = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length) {
    const lo = Math.max(A[i][0], B[j][0]);
    const hi = Math.min(A[i][1], B[j][1]);
    if (lo <= hi) out.push([lo, hi]);
    if (A[i][1] < B[j][1]) i++; else j++;
  }
  return out;
}`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-7',
            question: '`A[i] = [0, 10]`, `B[j] = [2, 4]`. After recording `[2, 4]`, which pointer moves?',
            options: [
              'i — A[i] started first',
              'Both — the pair has been used',
              'Neither — look for more overlaps first',
              'j — B[j] ends first, and A[i] may still overlap B[j + 1]',
            ],
            answer: 3,
            explanation: '[0, 10] still has room after 4; the next interval in B (say [5, 7]) may still intersect it. [2, 4] is finished: everything left in A starts after 10 > 4.',
            misconceptions: {
              0: 'The start is irrelevant; what matters is which interval is exhausted. Moving i would miss [5, 7] ∩ [0, 10].',
              1: 'Moving both loses overlaps between the longer interval and the next one in the other list.',
              2: 'We must advance something each step or the loop never terminates. The rule "advance the earlier end" guarantees progress.',
            },
          },
        ],
      },
      {
        id: 'intuition-sweep',
        title: 'Core intuition — sweep line',
        blocks: [
          {
            type: 'text',
            md: `Imagine a vertical line sweeping left to right across the timeline. As it moves, it **enters** intervals at their starts and **leaves** them at their ends. The number of intervals under the line only changes at those moments, which we call **events**:

\`\`\`text
[1,4) [2,5) [7,9)

time:   1   2   4   5   7   9
event: +1  +1  -1  -1  +1  -1
active: 1   2   1   0   1   0     → max = 2
\`\`\`

So: create \`2n\` events, sort them by time, scan while keeping \`active\`. The maximum of \`active\` is the answer to "rooms needed", "max overlap", "peak load".`,
          },
          { type: 'visual', scenario: 'sweep-line', caption: "Starts are +1, ends are −1; the running sum is the number of overlapping intervals." },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Sweep line',
            md: 'A **sweep line** algorithm processes geometric or time-based objects in sorted order of their coordinates, maintaining a small "status" (a count, a heap of active heights, …) that describes the slice currently under the line.',
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-8',
            question: 'Meetings are half-open: `[1, 5)` and `[5, 8)`. Both events happen at time 5 (an end and a start). How should ties be ordered to get "1 room"?',
            options: [
              'Process the end (−1) before the start (+1)',
              'Process the start (+1) before the end (−1)',
              'Order does not matter',
              'Ignore both events because they cancel out',
            ],
            answer: 0,
            explanation: 'The first meeting frees the room at 5, then the second takes it: active goes 1 → 0 → 1, max 1. With `[time, delta]` pairs, sorting by `a[0] - b[0] || a[1] - b[1]` puts −1 before +1 at equal times.',
            misconceptions: {
              1: 'Start-first makes active go 1 → 2 → 1 and reports 2 rooms — correct only for **closed** intervals where touching counts as overlap.',
              2: 'The running maximum depends on the order: one order briefly shows 2 active intervals.',
              3: 'Their deltas do cancel here, but you still have to apply them — and in general several events of different kinds share a time. Summing all deltas at a time *before* updating the max is equivalent to "ends first", not to ignoring them.',
            },
            deeper: 'Rule of thumb: **half-open → ends first; closed → starts first.** Write the tie-break explicitly into the comparator and mention it out loud in an interview.',
          },
        ],
      },
      {
        id: 'optimized-sweep',
        title: 'Optimized approach — sweep line',
        blocks: [
          {
            type: 'text',
            md: `**Meeting Rooms II without events.** Sort all starts and, separately, all ends. Walk the starts; the pointer \`j\` over ends tells you how many meetings have finished:

- if \`starts[i] >= ends[j]\`, some meeting finished → reuse its room (\`j++\`);
- otherwise open a new room.

Why may we pair starts and ends from *different* meetings? We never care *which* meeting ended — only *how many* have ended by time \`starts[i]\`. Sorted ends answer that question. (A MinHeap of end times also works — you will study heaps in the Heaps topic.)`,
          },
          {
            type: 'code',
            title: 'Meeting Rooms II — sorted starts & ends',
            code: `function minMeetingRooms(intervals) {
  const starts = intervals.map((x) => x[0]).sort((a, b) => a - b);
  const ends = intervals.map((x) => x[1]).sort((a, b) => a - b);
  let rooms = 0, j = 0;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] >= ends[j]) j++;  // a meeting ended → its room is reused
    else rooms++;                   // everyone is busy → open a room
  }
  return rooms;
}`,
          },
          {
            type: 'text',
            md: `**Sweep + a max structure (Skyline).** When events carry a *value* (building height) instead of +1/−1, the status is "the multiset of active heights" and the answer at each moment is its maximum. Use the toolkit \`MaxHeap\` for the active heights. Removing an arbitrary height from a heap is slow, so use **lazy deletion**: record "height h should be removed" in a Map, and only pop it when it reaches the top. The Heaps topic covers heaps in depth; here you only need \`push\`, \`peek\`, \`pop\`.

**Offline queries (Minimum Interval to Include Each Query).** Sort the queries too, and sweep them in increasing order. Intervals whose start has been passed are pushed into a MinHeap keyed by length; intervals whose end is behind the current query are popped lazily. Each interval enters and leaves once → O((n + q) log n).`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the answer to "minimum rooms" is **exactly** the maximum number of simultaneous meetings — not just at least that?',
            deeper: '"At least": at the busiest moment k meetings run at once, each needs its own room. "At most": process meetings by start time; when a meeting starts, fewer than k *other* meetings are running (otherwise k+1 would be simultaneous), so among k rooms one is free. Both bounds match, so the answer is exactly k. A lower bound that some strategy achieves is the classic shape of an optimality proof.',
          },
        ],
      },
      {
        id: 'template-sweep',
        title: 'Pattern / template — sweep line',
        blocks: [
          {
            type: 'code',
            title: 'Events template',
            code: `function sweep(intervals) {
  const events = [];
  for (const [s, e] of intervals) events.push([s, +1], [e, -1]);
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // half-open: -1 before +1
  let active = 0, best = 0;
  for (const [time, delta] of events) {
    active += delta;
    best = Math.max(best, active);   // or: record something whenever the status changes
  }
  return best;
}`,
          },
        ],
      },
      {
        id: 'dry-run-sweep',
        title: 'Dry run — sweep line',
        blocks: [
          {
            type: 'dryrun',
            title: 'minMeetingRooms([[0,30],[5,10],[15,20]])',
            columns: ['i', 'starts[i]', 'ends[j]', 'action', 'rooms'],
            rows: [
              ['—', 'starts = [0,5,15]', 'ends = [10,20,30]', '—', '0'],
              ['0', '0', '10', '0 < 10 → new room', '1'],
              ['1', '5', '10', '5 < 10 → new room', '2'],
              ['2', '15', '10', '15 ≥ 10 → reuse (j = 1)', '2'],
            ],
            note: 'The meeting [5,10] ended before [15,20] started, so its room is reused — we never needed to know which meeting it was.',
          },
        ],
      },
      {
        id: 'optimized-design',
        title: 'Optimized approach — keeping a sorted interval set',
        blocks: [
          {
            type: 'text',
            md: `Some problems give intervals **one at a time** and demand an answer after each call — e.g. \`book(start, end)\` must say immediately whether it conflicts. Re-sorting each time is wasteful. Instead keep the stored intervals **sorted and disjoint** at all times:

- binary-search (from the Binary Search topic) the first interval starting at or after the new start;
- only that interval (**successor**) and the one before it (**predecessor**) can overlap the new one — everything else is further away;
- insert at that index to keep the array sorted.

Lookup is O(log n); inserting into the middle of an array is O(n) in the worst case because it shifts elements. Languages with a balanced BST / TreeMap get O(log n) per insert; in JavaScript a sorted array is the practical choice (you will build trees later).`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-9',
            question: 'Bookings (half-open) are stored sorted and disjoint: `[[10,20),[30,40)]`. A request `[18, 25)` arrives. The first stored booking starting at or after 18 is `[30,40)`. What decides the answer?',
            options: [
              'Only [30,40): it does not overlap, so the booking succeeds',
              'The predecessor [10,20): it ends at 20 > 18, so the request conflicts',
              'Every stored booking must be checked',
              'Only whether 25 < 30',
            ],
            answer: 1,
            explanation: 'Two neighbours must be checked: the successor must start at or after 25 (30 ≥ 25 ✓) and the predecessor must end at or before 18 (20 > 18 ✗). The predecessor conflicts, so `book` returns false.',
            misconceptions: {
              0: 'An interval that starts **earlier** can still reach into the new one. Checking only the successor is the classic bug.',
              2: 'Because the set is sorted and disjoint, only the two neighbours can overlap — anything before the predecessor ends even earlier, anything after the successor starts even later.',
              3: 'That is only the successor check. The predecessor check is the one that fails here.',
            },
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Default \`sort()\`** on intervals — sorts by string, so \`[10, 1]\` comes before \`[9, 1]\`. Always pass a comparator.
2. **Wrong endpoint convention** — \`<\` vs \`<=\`. Decide whether touching intervals overlap before coding.
3. **\`last[1] = e\` instead of \`Math.max(last[1], e)\`** — a contained interval shrinks the block.
4. **Sorting by start for a selection problem** — use earliest end.
5. **Advancing both pointers** in intersections.
6. **Sweep ties** — equal times need an explicit order (ends first for half-open).
7. **Mutating input by accident** — pushing the input's own arrays and then editing them.
8. **Removing an arbitrary element from a heap** — heaps can't do that cheaply; use lazy deletion.`,
          },
          {
            type: 'checkpoint',
            id: 'intervals-cp-10',
            question: 'What does `[[10, 20], [9, 12], [100, 101]].sort()` return in JavaScript?',
            options: [
              '[[9,12],[10,20],[100,101]]',
              '[[10,20],[100,101],[9,12]]',
              '[[100,101],[10,20],[9,12]]',
              'It throws because arrays cannot be compared',
            ],
            answer: 1,
            explanation: 'Without a comparator, `sort` converts each element to a string: "10,20", "9,12", "100,101", and compares them character by character. "1" < "9", and "10,20" < "100,101" because "," (code 44) < "0" (code 48). Result: "10,20", "100,101", "9,12".',
            misconceptions: {
              0: 'That is the numeric order you want — you only get it with `(a, b) => a[0] - b[0]`.',
              2: 'String comparison is not "longest first"; at the first differing character, "," sorts before "0".',
              3: 'JavaScript never throws here; it silently converts to strings, which is why the bug is so sneaky.',
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
            time: 'O(n log n)',
            space: 'O(n)',
            md: `**Time:** sorting dominates (O(n log n)); merge, greedy and sweep passes are O(n) after it. Two-pointer intersection on already-sorted lists is O(n + m). Sweep + heap is O(n log n) because each push/pop is O(log n).

**Space:** the output (merged list) or the event list is O(n); \`toSorted\` copies (O(n)); in-place \`sort\` in V8 (TimSort) still uses O(n) temporary memory. Design structures store every interval: O(n).`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Ask about endpoints first:** "Are the intervals closed or half-open? Do [1,2] and [2,3] overlap?" It shows care and prevents the most common bug.
- **Say what you sort by and why:** start for merging, end for selecting, events for counting.
- **For greedy, give the exchange argument** in two sentences — interviewers love hearing *why* earliest end works.
- **Mention input mutation:** "I'll sort a copy with toSorted so I don't change the caller's array."
- **Edge cases:** empty list, single interval, all identical, one interval containing all others, touching endpoints, negative coordinates.`,
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
              { api: 'arr.sort((a, b) => a[0] - b[0])', use: 'Sort intervals by start, in place', complexity: 'O(n log n)' },
              { api: 'arr.toSorted(cmp)', use: 'Sorted copy (does not mutate the input)', complexity: 'O(n log n), O(n) extra' },
              { api: '(a, b) => a[0] - b[0] || a[1] - b[1]', use: 'Multi-key comparator (ties broken by the second key)', complexity: 'O(1)' },
              { api: 'Math.max / Math.min', use: 'Grow a merged block; intersection bounds', complexity: 'O(1)' },
              { api: 'arr.splice(i, 0, item)', use: 'Insert into a sorted array (design problems)', complexity: 'O(n)' },
              { api: 'new MaxHeap() / new MinHeap(key)', use: 'Active heights (skyline) or active intervals by size (toolkit; see Heaps)', complexity: 'O(log n) push/pop' },
              { api: 'new Map()', use: 'Lazy-deletion counts: height → how many removals are pending', complexity: 'O(1) average' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Input is ranges [start, end]', 'Merge / insert / total coverage', 'Keep max non-overlapping / min removals / min arrows', 'Max simultaneous / rooms needed', 'Intersect two sorted lists', 'Online booking / streams of ranges'],
    clues: ['overlapping', 'merge', 'meetings / rooms', 'non-overlapping', 'arrows / balloons', 'intersection', 'skyline', 'calendar / book'],
    template: `// overlap (half-open): a[0] < b[1] && b[0] < a[1]
// merge: sort by start, extend last with Math.max
// select: sort by end, keep if start >= lastEnd
// count: events [t,+1],[t,-1], sort by (t, delta), running sum
// two lists: lo = max(starts), hi = min(ends); advance the earlier end`,
    complexity: 'O(n log n) time (sorting), O(n) space',
    mistakes: ['default sort() compares strings', '< vs <= for touching endpoints', 'last[1] = e instead of Math.max', 'start-sorted greedy for selection', 'tie order of sweep events', 'advancing both pointers'],
    jsTools: ['sort / toSorted with comparator', 'Math.max / Math.min', 'splice', 'MinHeap / MaxHeap (toolkit)', 'Map'],
  },

  keyConcepts: [
    'Two intervals overlap iff each starts before the other ends; their overlap is [max(starts), min(ends)].',
    'Decide closed vs half-open first — it is the difference between < and <=.',
    'Sort by start to merge: an interval can only merge with the current block.',
    'Sort by end to select: keeping the earliest-ending interval is safe by an exchange argument.',
    'Sweep line: only endpoints change the state; sort 2n events and keep a running count or a max structure.',
    'Two sorted disjoint lists intersect in O(n + m) by advancing whichever interval ends first.',
    'Online problems keep a sorted, disjoint set and only examine the two neighbours of a new interval.',
  ],

  interviewTips: [
    'Clarify whether touching intervals overlap.',
    'Name the sort key and justify it (start → merge, end → select, events → count).',
    'Prove the earliest-end greedy with the exchange argument.',
    'Sort a copy (toSorted) unless mutating the input is allowed.',
  ],
};
