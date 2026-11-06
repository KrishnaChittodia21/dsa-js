// Shorts for Intervals (M9). Format: src/content/shortSchema.js. Facts come only from topics/intervals/topic.js.
// Every block, keep/skip, intersection, event count and booking below comes from running the pattern's template
// on the "e.g." input next to it (the run code mirrors the template line for line).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells) => ({ kind: 'table', rowLabels, colLabels, cells });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = ([s, e]) => `[${s},${e}]`;
// an intervals panel: pairs plus one state per pair (function of the index, or an array)
const iv = (pairs, label, min, max, st = () => '') =>
  ({ kind: 'intervals', label, min, max, items: pairs.map(([start, end], k) => ({ start, end, state: (typeof st === 'function' ? st(k) : st[k]) || '' })) });
const check = (ok, msg) => {
  if (!ok) throw new Error(`intervals shorts: ${msg}`);
};

// ---------- merge: sort by start, extend the last block ----------
const MG = [[4, 6], [1, 3], [2, 5], [8, 11], [9, 10]];
const MG_SORTED = MG.toSorted((a, b) => a[0] - b[0]);
const mergeFrames = [];
const mergeOut = [];
MG_SORTED.forEach(([s, e], i) => {
  const last = mergeOut[mergeOut.length - 1];
  const prev = last ? [...last] : null;
  const hit = !!last && s <= last[1];
  if (hit) last[1] = Math.max(last[1], e);
  else mergeOut.push([s, e]);
  const end = mergeOut.at(-1)[1];
  mergeFrames.push({
    say: hit ? 1 : 2,
    note: !prev
      ? `${fmt([s, e])} comes first → it opens the first block.`
      : hit
        ? `${s} ≤ ${prev[1]} → overlap: end = max(${prev[1]}, ${e}) = ${end}.${e < prev[1] ? ' Contained: nothing grows.' : ''}`
        : `${s} ≤ ${prev[1]}? no → gap: ${fmt(prev)} is final, ${fmt([s, e])} opens a new block.`,
    panels: [
      iv(MG_SORTED, 'sorted by start', 0, 12, (k) => (k < i ? 'visited' : k === i ? 'active' : '')),
      iv(mergeOut.map((x) => [...x]), 'merged blocks', 0, 12, (k) => (k === mergeOut.length - 1 ? 'active' : 'done')),
    ],
  });
});
check(JSON.stringify(mergeOut) === '[[1,6],[8,11]]', 'merge result');

// ---------- greedy: sort by end, keep if s >= lastEnd ----------
const GR = [[1, 7], [2, 4], [5, 6], [3, 8], [6, 9]];
function greedy(sorted) {
  let lastEnd = -Infinity,
    kept = 0;
  return sorted.map(([s, e]) => {
    const before = lastEnd;
    const fits = s >= lastEnd;
    if (fits) {
      kept++;
      lastEnd = e;
    }
    return { s, e, before, fits, kept, lastEnd };
  });
}
const GR_START = GR.toSorted((a, b) => a[0] - b[0]);
const byStart = greedy(GR_START);
const GR_END = GR.toSorted((a, b) => a[1] - b[1]);
const byEnd = greedy(GR_END);
const gState = (run, i) => (k) => (k > i ? '' : k === i ? (run[k].fits ? 'active' : 'bad') : run[k].fits ? 'done' : 'muted');
const greedyFrames = byEnd.map((st, i) => ({
  say: 1,
  note:
    `${fmt([st.s, st.e])}: ${st.before === -Infinity ? 'lastEnd is −∞' : `${st.s} ≥ ${st.before}? ${st.fits ? 'yes' : 'no'}`}` +
    ` → ${st.fits ? `keep (${st.kept}), lastEnd = ${st.lastEnd}` : 'skip it'}.` +
    (i === byEnd.length - 1 ? ` Kept ${st.kept}, remove ${GR.length - st.kept}.` : ''),
  panels: [iv(GR_END, 'sorted by end', 0, 10, gState(byEnd, i)), vars({ lastEnd: st.lastEnd === -Infinity ? '−∞' : st.lastEnd, kept: st.kept })],
}));
check(byStart.at(-1).kept === 1 && byEnd.at(-1).kept === 3, 'greedy counts');

// ---------- two-pointer intersection ----------
const XA = [[0, 3], [5, 9], [11, 12]];
const XB = [[2, 6], [8, 10], [12, 14]];
const xOut = [];
const xFrames = [];
{
  let i = 0,
    j = 0;
  while (i < XA.length && j < XB.length) {
    const lo = Math.max(XA[i][0], XB[j][0]);
    const hi = Math.min(XA[i][1], XB[j][1]);
    const hit = lo <= hi;
    if (hit) xOut.push([lo, hi]);
    const moveA = XA[i][1] < XB[j][1];
    const [pi, pj] = [i, j];
    moveA ? i++ : j++;
    const done = i === XA.length || j === XB.length;
    xFrames.push({
      say: hit ? 0 : 1,
      note:
        `A[${pi}] ${fmt(XA[pi])}, B[${pj}] ${fmt(XB[pj])}: ` +
        (hit ? (lo === hi ? `lo = hi = ${lo} → record [${lo},${hi}]` : `lo ${lo}, hi ${hi} → record ${fmt([lo, hi])}`) : `lo ${lo} > hi ${hi}, no overlap`) +
        `. ${moveA ? 'A' : 'B'} ends first → ${moveA ? 'i' : 'j'}++.` +
        (done ? ` ${xFrames.length + 1} steps, not 9.` : ''),
      panels: [
        iv(XA, 'A', 0, 15, (k) => (k === pi ? (moveA ? 'bad' : 'active') : k < pi ? 'muted' : '')),
        iv(XB, 'B', 0, 15, (k) => (k === pj ? (moveA ? 'active' : 'bad') : k < pj ? 'muted' : '')),
        iv(xOut.map((x) => [...x]), 'intersections', 0, 15, (k) => (hit && k === xOut.length - 1 ? 'active' : 'done')),
      ],
    });
  }
}
check(JSON.stringify(xOut) === '[[2,3],[5,6],[8,9],[12,12]]', 'intersection result');

// ---------- sweep line: +1 / −1 events, half-open ----------
const SW = [[1, 5], [2, 4], [3, 8], [5, 7]];
const events = [];
SW.forEach(([s, e], k) => events.push([s, +1, k], [e, -1, k]));
events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // -1 before +1 at equal times
const evLabel = events.map(([t, d]) => `${t}: ${d > 0 ? '+1' : '−1'}`);
const swFrames = [];
{
  let active = 0,
    best = 0;
  const started = new Set(),
    ended = new Set();
  events.forEach(([t, d, k], n) => {
    active += d;
    best = Math.max(best, active);
    (d > 0 ? started : ended).add(k);
    const tie = n > 0 && events[n - 1][0] === t;
    swFrames.push({
      say: tie ? 1 : 2,
      note:
        `t = ${t}: ${fmt(SW[k])} ${d > 0 ? 'starts, +1' : 'ends, −1'} → active ${active}, best ${best}.` +
        (tie ? ' The −1 at this time came first.' : '') +
        (n === events.length - 1 ? ` Rooms needed: ${best}.` : ''),
      panels: [
        arr(evLabel, { label: 'events, sorted', pointers: [ptr(n, 't')], highlights: hl(events.length, (x) => (x < n ? 'visited' : x === n ? 'active' : '')) }),
        iv(SW, 'meetings [start, end)', 0, 9, (x) => (ended.has(x) ? 'muted' : started.has(x) ? 'active' : '')),
        vars({ active, best }),
      ],
    });
  });
  check(best === 3, 'sweep best');
}

// ---------- design: sorted, disjoint bookings, tryBook ----------
function lowerBound(list, x) {
  let lo = 0,
    hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid][0] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function tryBook(list, s, e) {
  const i = lowerBound(list, s);
  if (i < list.length && list[i][0] < e) return { i, ok: false, bad: i };
  if (i > 0 && list[i - 1][1] > s) return { i, ok: false, bad: i - 1 };
  list.splice(i, 0, [s, e]);
  return { i, ok: true };
}
const CALLS = [[5, 9], [12, 15], [8, 11], [9, 12], [1, 5]];
const booked = [];
const bookFrames = CALLS.map(([s, e]) => {
  const r = tryBook(booked, s, e);
  const list = booked.map((x) => [...x]);
  const why = !r.ok
    ? r.bad < r.i
      ? `predecessor ${fmt(list[r.bad])} ends at ${list[r.bad][1]} > ${s} → false.`
      : `successor ${fmt(list[r.bad])} starts at ${list[r.bad][0]} < ${e} → false.`
    : list.length === 1
      ? 'the list is empty, no neighbours → true.'
      : `neighbours fit${list[r.i - 1]?.[1] === s || list[r.i + 1]?.[0] === e ? ' (touching is fine, half-open)' : ''} → splice at ${r.i}, true.`;
  return {
    say: r.ok ? 2 : 1,
    note: `book(${s}, ${e}): i = ${r.i}; ${why}`,
    panels: [
      iv(list, 'stored, sorted and disjoint', 0, 16, (k) =>
        r.ok ? (k === r.i ? 'active' : k === r.i - 1 || k === r.i + 1 ? 'window' : '') : k === r.bad ? 'bad' : k === r.i || k === r.i - 1 ? 'window' : ''),
      iv([[s, e]], 'request', 0, 16, [r.ok ? 'done' : 'bad']),
      vars({ i: r.i, result: r.ok ? 'true' : 'false' }),
    ],
  };
});
check(JSON.stringify(booked) === '[[1,5],[5,9],[9,12],[12,15]]', 'bookings');
const QLIST = [[2, 6], [10, 14], [20, 25]];
check(tryBook(QLIST.map((x) => [...x]), 14, 20).ok && lowerBound(QLIST, 14) === 2, 'design question');

export default [
  {
    id: 'intervals-merge',
    title: 'Merge overlapping ranges in one pass',
    steps: [
      {
        kind: 'watch',
        title: 'Any pair might overlap',
        lines: ['Merge every set of overlapping ranges into one.', 'Unsorted: test pairs, merge one, scan again. Up to **O(n³)** in the worst case.'],
        frames: [
          { say: 0, note: 'e.g. intervals = [[4,6],[1,3],[2,5],[8,11],[9,10]].', panels: [iv(MG, 'input', 0, 12)] },
          { say: 1, note: '5 intervals → 10 pairs to test, and after every merge the scan starts over.', panels: [iv(MG, 'input', 0, 12, () => 'window'), vars({ pairs: 10 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort by start, grow one open block',
        lines: [
          'Sort a copy by start: `toSorted((a, b) => a[0] - b[0])`.',
          'Next `[s, e]` with `s <= last[1]` overlaps: `last[1] = Math.max(last[1], e)`.',
          'Otherwise there is a gap: push `[s, e]` as a new block.',
        ],
        frames: [
          { say: 0, note: 'Sorted by start, neighbours in the array are neighbours on the line.', panels: [iv(MG_SORTED, 'sorted by start', 0, 12)] },
          ...mergeFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"merge overlapping"**, **"insert interval"**, **"total time covered"**, **"remove covered intervals"**, **"consecutive ranges"**, **"free time"**.'],
        frames: [
          {
            say: 0,
            note: 'One sort plus one pass: O(n log n). Need how many overlap at once? That is a sweep line instead.',
            panels: [
              table(
                ['merge all', 'insert into a sorted list', 'total covered length'],
                ['how'],
                [['sort by start, extend with Math.max'], ['three phases, O(n), no sort'], ['merge, then sum end − start']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: is the block final?',
        lines: ['The open block is `[1, 6]`; the next sorted interval is `[8, 11]`.'],
        panels: [iv(MG_SORTED, 'sorted by start', 0, 12, (k) => (k < 3 ? 'visited' : k === 3 ? 'active' : '')), iv([[1, 6]], 'merged blocks', 0, 12, ['active'])],
        task: {
          type: 'choose',
          question: 'Why can `[1, 6]` be emitted as final now?',
          options: [
            { text: 'Every later interval starts at 8 or later, so none can reach back to 6' },
            { text: '`[1, 6]` is longer than `[8, 11]`', why: 'Length plays no role. What makes a block final is a gap followed only by later starts.' },
            { text: 'Sorting by start also sorted the ends', why: 'Ends are not sorted: [8,11] comes before [9,10]. That is why the end uses Math.max.' },
            { text: 'It is not final: a later interval may still overlap it', why: 'It would have to start at 6 or earlier, but sorted order puts every later start at 8 or more.' },
          ],
          answer: 0,
        },
        solved: 'Sorted by start, a gap closes the block for good: one pass, never look back.',
      },
    ],
  },

  {
    id: 'intervals-greedy-end',
    title: 'Keep the most meetings: earliest end wins',
    steps: [
      {
        kind: 'watch',
        title: 'Earliest start is a trap',
        lines: ['Keep as many intervals as possible with none overlapping (remove the fewest).', 'Keeping the earliest **start** first: a long early interval blocks many short ones.'],
        frames: [
          { say: 0, note: 'e.g. intervals = [[1,7],[2,4],[5,6],[3,8],[6,9]], all in one room.', panels: [iv(GR, 'input', 0, 10)] },
          {
            say: 1,
            note: `Start-first keeps [1,7]; every other one starts before 7 and clashes. Kept: ${byStart.at(-1).kept}.`,
            panels: [iv(GR_START, 'sorted by start', 0, 10, gState(byStart, GR.length - 1)), vars({ kept: byStart.at(-1).kept })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Keep whatever ends first',
        lines: ['Sort by end: `(a, b) => a[1] - b[1]`, and start with `lastEnd = -Infinity`.', '`s >= lastEnd` → it fits: `kept++`, `lastEnd = e`. Otherwise skip it.'],
        frames: [{ say: 0, note: 'Sorted by end: [2,4] finishes first, so it leaves the most room after it.', panels: [iv(GR_END, 'sorted by end', 0, 10)] }, ...greedyFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"minimum number of intervals to remove"**, **"maximum number of meetings you can attend"** (one room), **"minimum arrows"**, **"non-overlapping"**.'],
        frames: [
          {
            say: 0,
            note: 'Safe by an exchange argument: swap the earliest end into any best answer and it stays valid.',
            panels: [table(['max kept', 'min removals', 'min arrows'], ['answer'], [['kept'], ['n − kept'], ['same pass, new arrow when s > lastEnd']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: one arrow, two balloons?',
        lines: ['Balloons are **closed** ranges, sorted by end. The first arrow was shot at x = 3.'],
        panels: [iv([[1, 3], [3, 5], [6, 8]], 'balloons, sorted by end', 0, 9, ['done', 'active', '']), vars({ arrowX: 3, arrows: 1 })],
        task: {
          type: 'choose',
          question: 'The next balloon is `[3, 5]`. Does it need a new arrow?',
          options: [
            { text: 'Yes: 3 ≥ 3, the same test as non-overlapping intervals', why: 'Balloons are closed: an arrow at x = 3 bursts [3,5] too. The test for a new arrow is s > arrowX.' },
            { text: 'No: 3 > 3 is false, the arrow at x = 3 already bursts it' },
            { text: 'Yes: every balloon needs its own arrow', why: 'One arrow bursts every balloon it crosses; shooting at the end of the first balloon hits the most.' },
            { text: 'Re-sort by start to decide', why: 'The end-sorted pass already decides; only the start of [3,5] versus arrowX matters.' },
          ],
          answer: 1,
        },
        solved: 'Same pass, different touching rule: s >= lastEnd to keep a meeting, s > arrowX to need a new arrow.',
      },
    ],
  },

  {
    id: 'intervals-two-pointer-intersection',
    title: 'Intersect two schedules in one walk',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair from two lists',
        lines: ['Two lists, each sorted and pairwise disjoint: find every overlap between them.', 'Checking every pair is **O(n·m)**.'],
        frames: [
          { say: 0, note: 'e.g. A = [[0,3],[5,9],[11,12]], B = [[2,6],[8,10],[12,14]].', panels: [iv(XA, 'A', 0, 15), iv(XB, 'B', 0, 15)] },
          { say: 1, note: '3 × 3 = 9 pairs, though most of them are far apart on the line.', panels: [iv(XA, 'A', 0, 15, () => 'window'), iv(XB, 'B', 0, 15, () => 'window'), vars({ pairs: 9 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Overlap, then drop the earlier end',
        lines: ['Overlap of the current pair = `[max(starts), min(ends)]`, real when `lo <= hi`.', 'Advance the one that **ends first**: nothing later in the other list can reach it.'],
        frames: xFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"two lists of intervals"**, **"each list is pairwise disjoint and sorted"**, **"intersection"**, **"common free time"**.'],
        frames: [
          {
            say: 0,
            note: 'Each step drops one interval: O(n + m). Lists not sorted or disjoint → merge each list first.',
            panels: [
              table(
                ['intersection', 'common free time', 'meeting scheduler'],
                ['how'],
                [['two pointers, advance the earlier end'], ['complement each schedule, then intersect'], ['first overlap of length ≥ duration']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: which pointer?',
        lines: ['`A[i] = [4, 10]`, `B[j] = [3, 7]`. Their overlap `[4, 7]` was just recorded.'],
        panels: [iv([[4, 10]], 'A[i]', 0, 12, ['active']), iv([[3, 7]], 'B[j]', 0, 12, ['active']), iv([[4, 7]], 'recorded', 0, 12, ['done'])],
        task: {
          type: 'choose',
          question: 'What moves next?',
          options: [
            { text: '`i++`', why: '[4,10] still reaches past 7, so the next interval in B may overlap it too.' },
            { text: '`j++`: B[j] ends at 7, and everything later in A starts after 10' },
            { text: 'Both pointers', why: 'Advancing both loses overlaps between the longer interval and the next one in the other list.' },
            { text: 'Neither: keep looking at this pair', why: 'Something must advance each step, or the loop never ends.' },
          ],
          answer: 1,
        },
        solved: 'Drop whichever interval ends first: it can never meet anything later, so the walk is O(n + m).',
      },
    ],
  },

  {
    id: 'intervals-sweep-line',
    title: 'Count rooms by sweeping the endpoints',
    steps: [
      {
        kind: 'watch',
        title: 'Pairs miss the busiest moment',
        lines: ['Meetings `[start, end)`: how many rooms so that nothing overlaps?', 'Merging or pair checks say which meetings clash, not how many run **at once**.'],
        frames: [
          { say: 0, note: 'e.g. meetings = [[1,5],[2,4],[3,8],[5,7]].', panels: [iv(SW, 'meetings [start, end)', 0, 9)] },
          { say: 1, note: 'Merged they are one block [1,8]: that hides how many run at the same moment.', panels: [iv([[1, 8]], 'merged', 0, 9, ['window'])] },
        ],
      },
      {
        kind: 'watch',
        title: 'Visit only the 2n endpoints',
        lines: [
          'Each start is an event `+1`, each end `−1`. Sort the events by time.',
          'Equal times: `−1` before `+1`, so [1,5) frees its room at 5 before [5,7) takes it.',
          '`active += delta`, `best = Math.max(best, active)`.',
        ],
        frames: [
          { say: 0, note: '4 meetings → 8 events. The count can only change at these times.', panels: [arr(evLabel, { label: 'events, sorted' }), iv(SW, 'meetings [start, end)', 0, 9)] },
          ...swFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"minimum number of rooms / platforms"**, **"maximum overlap at any time"**, **"how many are active at time t"**, **"skyline / outline"**, **"for each query point"**.'],
        frames: [
          {
            say: 0,
            note: 'One sort of 2n events: O(n log n). Skyline swaps the counter for a max structure of heights.',
            panels: [
              table(
                ['rooms / max overlap', 'skyline', 'small integer times'],
                ['status kept'],
                [['a running count'], ['active heights in a MaxHeap'], ['difference array + prefix sum']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: closed intervals',
        lines: ['Now the intervals are **closed**: `[1, 5]` and `[5, 7]` both contain the point 5.'],
        panels: [iv([[1, 5], [5, 7]], 'closed intervals', 0, 8), arr(['1: +1', '5: ?', '5: ?', '7: −1'], { label: 'events', highlights: { 1: 'active', 2: 'active' } })],
        task: {
          type: 'choose',
          question: 'At time 5 there is a `−1` and a `+1`. Which goes first?',
          options: [
            { text: '`−1` first, as for meetings', why: 'That reports 1, but at x = 5 both closed intervals are active: closed means starts first.' },
            { text: '`+1` first: active reaches 2 at time 5' },
            { text: 'Either order', why: 'The running max depends on it: one order shows 2, the other only 1.' },
            { text: 'Let the default `sort()` decide', why: 'Default sort compares arrays as strings. Always write the tie-break into the comparator.' },
          ],
          answer: 1,
        },
        solved: 'Half-open → ends first; closed → starts first. The tie-break lives in the comparator.',
      },
    ],
  },

  {
    id: 'intervals-design',
    title: 'Answer each booking at once with a sorted set',
    steps: [
      {
        kind: 'watch',
        title: 'Calls arrive one by one',
        lines: ['Bookings `[start, end)` arrive one at a time; each `book` call must answer immediately.', 'Checking every stored booking is O(n) per call; re-sorting each time is O(n log n).'],
        frames: [
          { say: 0, note: 'e.g. book(5,9), book(12,15), book(8,11), book(9,12), book(1,5), in that order.', panels: [iv(CALLS, 'requests, in arrival order', 0, 16)] },
          {
            say: 1,
            note: 'Naive: the last call book(1,5) is compared with all 3 stored bookings, one by one.',
            panels: [iv([[5, 9], [9, 12], [12, 15]], 'stored', 0, 16, () => 'window'), iv([[1, 5]], 'request', 0, 16, ['active']), vars({ checks: 3 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Only two neighbours can clash',
        lines: [
          'Keep the list **sorted and disjoint**. `lowerBound` finds `i`, the first booking starting at or after `s`.',
          'Successor `list[i]` must not start before `e`; predecessor `list[i − 1]` must not end after `s`.',
          'Both fine → `splice(i, 0, [s, e])` keeps the list sorted.',
        ],
        frames: bookFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"implement a class"**, **"book(start, end) returns true/false"**, **"addNum / getIntervals"**, **"calls are interleaved"**.'],
        frames: [
          {
            say: 0,
            note: 'Lookup O(log n); splice shifts, O(n) worst case. All intervals known up front → sort once instead.',
            panels: [
              table(
                ['My Calendar I', 'Disjoint Intervals', 'with a TreeMap'],
                ['per call'],
                [['check predecessor and successor'], ['extend left, right, or glue both'], ['floor / ceiling, O(log n)']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a tight fit',
        lines: ['Stored (half-open): `[[2,6), [10,14), [20,25)]`. A request `book(14, 20)` arrives.'],
        panels: [iv(QLIST, 'stored, sorted and disjoint', 0, 26, ['', 'window', 'window']), iv([[14, 20]], 'request', 0, 26, ['active'])],
        task: {
          type: 'choose',
          question: 'What does `book(14, 20)` do?',
          options: [
            { text: 'false: the predecessor [10,14) touches it at 14', why: 'Half-open: [10,14) ends just before 14. The test 14 > 14 is false, so no conflict.' },
            { text: 'false: the successor [20,25) starts at 20', why: 'The successor clashes only if it starts before e: 20 < 20 is false.' },
            { text: 'true: i = 2, both neighbours fit, splice at index 2' },
            { text: 'true: push it at the end, then re-sort the list', why: 'Rebuilding on every call is the waste this pattern avoids; splice at i keeps it sorted.' },
          ],
          answer: 2,
        },
        solved: 'Binary-search the spot, check just the two neighbours, splice in: no re-sorting per call.',
      },
    ],
  },
];
