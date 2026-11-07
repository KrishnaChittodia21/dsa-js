// Shorts for Greedy (M9). Format: src/content/shortSchema.js. Facts come only from topics/greedy/topic.js.
// Every total, keep/skip, stop, reach and candy count below comes from running the pattern's template on the
// "e.g." input next to it (the run code mirrors the template line for line); the results are asserted at load.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = ([s, e]) => `[${s},${e}]`;
const iv = (pairs, label, min, max, st = () => '') =>
  ({ kind: 'intervals', label, min, max, items: pairs.map(([start, end], k) => ({ start, end, state: (typeof st === 'function' ? st(k) : st[k]) || '' })) });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`greedy shorts: ${msg}`);
};

// ---------- sort and pick: e.g. box types (count × value), capacity 5 ----------
const BOXES = [
  { count: 2, value: 1 },
  { count: 3, value: 4 },
  { count: 1, value: 3 },
  { count: 2, value: 2 },
];
const CAP = 5;
// the template's sweep; `sorted` = false runs it on the input order (the naive way)
function sortAndPick(items, capacity, sorted = true) {
  const list = sorted ? items.toSorted((a, b) => b.value - a.value) : [...items];
  let total = 0;
  const steps = [];
  for (const item of list) {
    if (capacity === 0) break;
    const take = Math.min(item.count, capacity);
    total += take * item.value;
    capacity -= take;
    steps.push({ item, take, total, capacity });
  }
  return { list, steps, total };
}
const SP_RAW = sortAndPick(BOXES, CAP, false);
const SP = sortAndPick(BOXES, CAP);
check(SP_RAW.total === 14 && SP.total === 17 && same(SP.steps.map((s) => s.take), [3, 1, 1]), 'truck totals');
const boxTable = (list, takes, cur) =>
  table(
    list.map((b) => `${b.count} × ${b.value}`),
    ['count', 'value', 'taken'],
    list.map((b, k) => [b.count, b.value, takes[k] ?? '·']),
    list.map((_, k) => [0, 1, 2].map(() => (k === cur ? 'active' : takes[k] !== undefined ? 'done' : ''))),
  );
const spFrames = SP.steps.map((st, k) => ({
  say: 1,
  note:
    `value ${st.item.value}: take min(${st.item.count}, ${st.capacity + st.take}) = ${st.take} → total ${st.total}, capacity ${st.capacity}.` +
    (st.capacity === 0 ? ' Full: break.' : ''),
  panels: [boxTable(SP.list, SP.steps.slice(0, k + 1).map((s) => s.take), k), vars({ total: st.total, capacity: st.capacity })],
}));
// the question: two-city scheduling, e.g. costs [a, b], n = 2 per city
const CITY = [[10, 15], [25, 90], [20, 5], [40, 200]];
function twoCity(costs, key) {
  const order = costs.map((_, i) => i).toSorted((i, j) => key(costs[i]) - key(costs[j]));
  const half = costs.length / 2;
  return order.reduce((sum, p, k) => sum + costs[p][k < half ? 0 : 1], 0);
}
const CITY_DIFF = twoCity(CITY, ([a, b]) => a - b);
const CITY_A = twoCity(CITY, ([a]) => a);
check(CITY_DIFF === 85 && CITY_A === 320, 'two-city totals');

// ---------- interval scheduling: e.g. six talks, one room ----------
const TALKS = [[0, 6], [1, 3], [3, 5], [4, 7], [5, 9], [8, 10]];
function maxNonOverlapping(intervals, key = (x) => x[1]) {
  const sorted = intervals.toSorted((a, b) => key(a) - key(b));
  let count = 0,
    lastEnd = -Infinity;
  const steps = sorted.map(([start, end]) => {
    const before = lastEnd;
    const fits = start >= lastEnd;
    if (fits) {
      count++;
      lastEnd = end;
    }
    return { start, end, before, fits, count, lastEnd };
  });
  return { sorted, steps, count, kept: steps.filter((s) => s.fits).map((s) => [s.start, s.end]) };
}
const IS_START = maxNonOverlapping(TALKS, (x) => x[0]);
const IS = maxNonOverlapping(TALKS);
const OTHER = [[1, 3], [4, 7], [8, 10]]; // another valid schedule of the same size
check(IS_START.count === 2 && IS.count === 3 && same(IS.kept, [[1, 3], [3, 5], [5, 9]]), 'interval counts');
check(OTHER.every((x, k) => k === 0 || x[0] >= OTHER[k - 1][1]) && IS.kept.every((g, k) => g[1] <= OTHER[k][1]), 'greedy stays ahead');
const isState = (run, i) => (k) => (k > i ? '' : run.steps[k].fits ? (k === i ? 'active' : 'done') : k === i ? 'bad' : 'muted');
const isFrames = IS.steps.map((st, i) => ({
  say: 1,
  note:
    `${fmt([st.start, st.end])}: ${st.before === -Infinity ? 'lastEnd is −∞' : `${st.start} ≥ ${st.before}? ${st.fits ? 'yes' : 'no'}`}` +
    ` → ${st.fits ? `keep it, count ${st.count}, lastEnd = ${st.lastEnd}` : 'skip'}.`,
  panels: [iv(IS.sorted, 'sorted by end', 0, 11, isState(IS, i)), vars({ lastEnd: st.lastEnd === -Infinity ? '−∞' : st.lastEnd, count: st.count })],
}));

// ---------- heap with regret: e.g. target 60, start fuel 15, stations [position, fuel] ----------
const TARGET = 60;
const FUEL0 = 15;
const STATIONS = [[5, 10], [10, 25], [20, 5], [30, 20], [45, 15]];
// the template's minStops; the heap is kept as a plain array (pick the max, or the min for the wrong direction)
function minStops(target, fuel, stations, pickMax = true) {
  const passed = [];
  let stops = 0,
    i = 0;
  const steps = [];
  while (fuel < target) {
    const pushed = [];
    while (i < stations.length && stations[i][0] <= fuel) pushed.push(stations[i++][1]);
    passed.push(...pushed);
    if (!passed.length) return { stops: -1, steps };
    const heap = passed.toSorted((a, b) => b - a);
    const got = pickMax ? Math.max(...passed) : Math.min(...passed);
    passed.splice(passed.indexOf(got), 1);
    const before = fuel;
    fuel += got;
    stops++;
    steps.push({ pushed, heap, got, before, fuel, stops, i });
  }
  return { stops, steps };
}
const RF = minStops(TARGET, FUEL0, STATIONS);
const RF_MIN = minStops(TARGET, FUEL0, STATIONS, false);
check(RF.stops === 2 && same(RF.steps.map((s) => s.got), [25, 20]) && RF_MIN.stops === 4, 'refuel stops');
const stLabel = ([p, f]) => `${p}:${f}`;
const rfPanels = (i, heap, v, cur = -1) => [
  arr(STATIONS.map(stLabel), { label: 'station position:fuel', highlights: hl(STATIONS.length, (k) => (k < i ? 'visited' : '')) }),
  arr(heap.length ? heap : ['—'], { label: 'max-heap of passed fuel', highlights: cur >= 0 ? { [cur]: 'active' } : {} }),
  vars(v),
];
const rfFrames = RF.steps.flatMap((st) => [
  {
    say: 1,
    note: `fuel ${st.before} < ${TARGET}: drive to ${st.before}, passing stations with fuel ${st.pushed.join(', ')}. Push them, stop nowhere yet.`,
    panels: rfPanels(st.i, st.heap, { fuel: st.before, stops: st.stops - 1 }),
  },
  {
    say: 2,
    note: `Out of range: pop the biggest, ${st.got} → fuel ${st.fuel}, stops ${st.stops}.${st.fuel >= TARGET ? ` ${st.fuel} ≥ ${TARGET}: done.` : ''}`,
    panels: rfPanels(st.i, st.heap, { fuel: st.fuel, stops: st.stops }, 0),
  },
]);
// the question: course schedule III, e.g. courses [duration, lastDay]
const COURSES = [[3, 4], [6, 10], [2, 12], [4, 13]];
function courseRun(courses) {
  const taken = [];
  let time = 0;
  let dropped = null;
  for (const [d, last] of courses.toSorted((a, b) => a[1] - b[1])) {
    taken.push(d);
    time += d;
    if (time > last) {
      dropped = Math.max(...taken);
      taken.splice(taken.indexOf(dropped), 1);
      time -= dropped;
    }
  }
  return { taken, time, dropped };
}
const CR = courseRun(COURSES);
check(CR.dropped === 6 && CR.time === 9 && CR.taken.length === 3, 'course swap');

// ---------- reach frontier: e.g. nums = [2, 3, 1, 1, 0, 0, 5] ----------
const JN = [2, 3, 1, 1, 0, 0, 5];
function canReachEnd(nums, updateFirst = false) {
  let reach = 0;
  const steps = [];
  for (let i = 0; i < nums.length; i++) {
    if (updateFirst) reach = Math.max(reach, i + nums[i]); // the listed mistake: update before the check
    if (i > reach) {
      steps.push({ i, reach, gap: true });
      return { ok: false, steps };
    }
    const before = reach;
    reach = Math.max(reach, i + nums[i]);
    steps.push({ i, before, reach });
  }
  return { ok: true, steps };
}
// the lesson's brute force, counting calls
function bruteCalls(nums) {
  let calls = 0;
  const go = (i) => {
    calls++;
    if (i >= nums.length - 1) return true;
    for (let step = 1; step <= nums[i]; step++) if (go(i + step)) return true;
    return false;
  };
  return { ok: go(0), calls };
}
const JR = canReachEnd(JN);
const JB = bruteCalls(JN);
check(!JR.ok && JR.steps.at(-1).i === 5 && JR.steps.at(-1).reach === 4 && !JB.ok && JB.calls === 11, 'jump reach');
const jPanels = (st) => [
  arr(JN, {
    label: 'nums',
    pointers: [ptr(st.i, 'i')],
    highlights: hl(JN.length, (k) => (k === st.i ? (st.gap ? 'bad' : 'active') : k <= st.reach ? 'window' : '')),
  }),
  vars({ i: st.i, reach: st.reach }),
];
const jFrames = JR.steps.map((st) => ({
  say: st.gap ? 1 : 2,
  note: st.gap
    ? `i = ${st.i} > reach ${st.reach}: a gap. Index ${st.i} is never reachable → return false.`
    : `i = ${st.i} ≤ ${st.before}: reach = max(${st.before}, ${st.i} + ${JN[st.i]}) = ${st.reach}.` +
      (st.reach > st.before && st.i > 0 ? ` Every index ≤ ${st.reach} is reachable now.` : ''),
  panels: jPanels(st),
}));
// the question: the "update first" mistake, e.g. nums = [1, 0, 2, 0]
const JQ = [1, 0, 2, 0];
check(!canReachEnd(JQ).ok && canReachEnd(JQ, true).ok, 'update-first bug says true');

// ---------- local constraints: e.g. ratings = [1, 4, 3, 2, 5] ----------
const RT = [1, 4, 3, 2, 5];
function twoPass(ratings) {
  const n = ratings.length;
  const give = new Array(n).fill(1);
  const left = [];
  const right = [];
  for (let i = 1; i < n; i++) {
    const up = ratings[i] > ratings[i - 1];
    if (up) give[i] = give[i - 1] + 1;
    left.push({ i, up, give: [...give] });
  }
  for (let i = n - 2; i >= 0; i--) {
    const up = ratings[i] > ratings[i + 1];
    const before = give[i];
    if (up) give[i] = Math.max(give[i], give[i + 1] + 1);
    right.push({ i, up, before, give: [...give] });
  }
  return { left, right, give, total: give.reduce((a, b) => a + b, 0) };
}
const CD = twoPass(RT);
const LEFT_ONLY = CD.left.at(-1).give;
check(same(LEFT_ONLY, [1, 2, 1, 1, 2]) && same(CD.give, [1, 3, 2, 1, 2]) && CD.total === 9, 'candy two passes');
const cPanels = (give, i, j, label) => [
  arr(RT, { label: 'ratings', pointers: [ptr(i, 'i')], highlights: { [i]: 'active', [j]: 'visited' } }),
  arr(give, { label, highlights: { [i]: 'active' } }),
];
const leftFrames = CD.left.map((st) => ({
  say: 1,
  note: `i = ${st.i}: ${RT[st.i]} > ${RT[st.i - 1]}? ${st.up ? `yes → give[${st.i}] = ${st.give[st.i - 1]} + 1 = ${st.give[st.i]}` : 'no → stays 1'}.`,
  panels: cPanels(st.give, st.i, st.i - 1, 'give (left pass)'),
}));
const rightFrames = CD.right.map((st, k) => ({
  say: 1,
  note:
    `i = ${st.i}: ${RT[st.i]} > ${RT[st.i + 1]}? ` +
    (st.up ? `yes → max(${st.before}, ${st.give[st.i + 1]} + 1) = ${st.give[st.i]}.` : `no → keeps ${st.give[st.i]}.`) +
    (k === CD.right.length - 1 ? ` Total ${CD.total}.` : ''),
  panels: cPanels(st.give, st.i, st.i + 1, 'give (right pass)'),
}));
// the question: why max() in the right pass, e.g. ratings = [2, 3, 5, 1]
const RQ = [2, 3, 5, 1];
const CQ = twoPass(RQ);
check(same(CQ.left.at(-1).give, [1, 2, 3, 1]) && CQ.right.find((s) => s.i === 2).give[2] === 3, 'candy max keeps 3');

export default [
  {
    id: 'greedy-sort-and-pick',
    title: 'Fill a truck by sorting once',
    steps: [
      {
        kind: 'watch',
        title: 'The order is the whole problem',
        lines: [
          'Box types: `count` boxes, each worth `value` units. Load at most `capacity` boxes for the most units.',
          'Taking boxes in the order they arrive can waste slots; trying every assignment is exponential.',
        ],
        frames: [
          { say: 0, note: `e.g. 4 box types (count × value) and capacity ${CAP}.`, panels: [boxTable(BOXES, [], -1), vars({ capacity: CAP })] },
          {
            say: 1,
            note: `In input order: 2 boxes of value 1, then 3 of value 4. Full, total ${SP_RAW.total}; the value-3 box never fits.`,
            panels: [boxTable(BOXES, SP_RAW.steps.map((s) => s.take), -1), vars({ total: SP_RAW.total, capacity: 0 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort by value, sweep once',
        lines: ['Sort by `value`, descending: the key that makes "take the best first" safe.', 'One sweep: `take = Math.min(count, capacity)`, add `take * value`, stop when capacity is 0.'],
        frames: [
          { say: 0, note: 'Sorted: value 4, 3, 2, 1. Every later decision is now one comparison.', panels: [boxTable(SP.list, [], 0), vars({ total: 0, capacity: CAP })] },
          ...spFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'Why it is safe, and the clue',
        lines: [
          'Exchange argument: every slot on the truck is identical, so swap any low-value box for an unused better one.',
          'Clues: **"maximum number of … satisfied"**, **"each box type has units"**, **"at most two people per boat"**, **"you may rearrange"**.',
        ],
        frames: [
          {
            say: 0,
            note: `A load with a value-1 box while a value-4 box is left: swap them, +3 units. So ${SP.total} cannot be beaten.`,
            panels: [boxTable(SP.list, SP.steps.map((s) => s.take), -1), vars({ greedy: SP.total, 'input order': SP_RAW.total })],
          },
          {
            say: 1,
            note: 'Sorting is O(n log n), the sweep O(n). Choosing what to sort by is the design.',
            panels: [
              table(
                ['max units on a truck', 'assign cookies / boats', 'two-city scheduling', 'queue reconstruction'],
                ['sort by'],
                [['value, descending'], ['both sides, two pointers'], ['costA − costB'], ['height desc, then k asc']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: pick the key',
        lines: ['Two-city scheduling: person i costs `a` to fly to A and `b` to B. Exactly 2 go to each city.', `e.g. costs = ${JSON.stringify(CITY)}.`],
        panels: [table(CITY.map((_, i) => `person ${i}`), ['a', 'b'], CITY)],
        task: {
          type: 'choose',
          question: 'What do you sort by, so the first 2 go to A?',
          options: [
            { text: `costA ascending`, why: `Persons 0 and 2 go to A, then 1 and 3 must pay ${CITY[1][1]} and ${CITY[3][1]} in B: total ${CITY_A}. A cheap a says nothing about b.` },
            { text: `a − b ascending: moving a person from B to A changes the total by a − b (total ${CITY_DIFF})` },
            { text: 'min(a, b) ascending', why: 'Everyone would lean to their cheaper city: three people prefer A here, which breaks "exactly 2 each".' },
            { text: 'a + b', why: 'The sum is the same whichever city a person goes to, so it cannot decide.' },
          ],
          answer: 1,
        },
        solved: 'Sort by the quantity your exchange argument talks about: here the saving a − b, not cost A alone.',
      },
    ],
  },

  {
    id: 'greedy-interval-scheduling',
    title: 'Why the talk that ends first is always safe',
    steps: [
      {
        kind: 'watch',
        title: 'One room, as many talks as possible',
        lines: ['Pick the most talks with none overlapping. Trying every subset is 2ⁿ.', 'Taking the earliest **start** first: one long early talk blocks the rest.'],
        frames: [
          { say: 0, note: `e.g. ${TALKS.length} talks: ${TALKS.map(fmt).join(', ')} → 2⁶ = 64 subsets.`, panels: [iv(TALKS, 'talks', 0, 11)] },
          {
            say: 1,
            note: `Start-first keeps [0,6]; only [8,10] fits after it. Kept: ${IS_START.count}.`,
            panels: [iv(IS_START.sorted, 'sorted by start', 0, 11, isState(IS_START, TALKS.length - 1)), vars({ count: IS_START.count })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort by end, keep what fits',
        lines: ['Sort by end: `(a, b) => a[1] - b[1]`, `lastEnd = -Infinity`.', '`start >= lastEnd` → compatible: `count++`, `lastEnd = end`. Otherwise skip.'],
        frames: [{ say: 0, note: 'Sorted by end: [1,3] finishes first, so it leaves the most room after it.', panels: [iv(IS.sorted, 'sorted by end', 0, 11)] }, ...isFrames],
      },
      {
        kind: 'watch',
        title: 'Greedy stays ahead',
        lines: [
          'Compare with any other valid schedule: greedy\'s k-th talk ends no later than its k-th talk.',
          'Clues: **"non-overlapping"**, **"minimum number of arrows"**, **"as many parts as possible"**, start/end pairs.',
        ],
        frames: [
          {
            say: 0,
            note: `Another schedule of ${OTHER.length}: ${OTHER.map(fmt).join(', ')}. Greedy's ends ${IS.kept.map((x) => x[1]).join(', ')} are never later.`,
            panels: [
              iv(IS.kept, 'greedy', 0, 11, () => 'done'),
              iv(OTHER, 'another schedule', 0, 11, () => 'window'),
              table(['k = 1', 'k = 2', 'k = 3'], ['greedy end', 'other end'], IS.kept.map((g, k) => [g[1], OTHER[k][1]])),
            ],
          },
          {
            say: 1,
            note: 'One sort, one sweep: O(n log n). Arrows use > instead of >=; weighted talks need DP.',
            panels: [table(['max kept', 'min removals', 'min arrows', 'partition labels'], ['how'], [['count'], ['n − count'], ['same sweep, > for touching'], ['cut when i === max last index']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the proof step',
        lines: [`Greedy kept ${IS.kept.slice(0, 2).map(fmt).join(', ')}. The other schedule kept ${OTHER.slice(0, 2).map(fmt).join(', ')}.`, 'Both are about to pick their 3rd talk.'],
        panels: [iv(IS.kept.slice(0, 2), 'greedy so far', 0, 11, () => 'done'), iv(OTHER.slice(0, 2), 'other so far', 0, 11, () => 'window')],
        task: {
          type: 'choose',
          question: "Why can greedy's 3rd talk never end later than the other schedule's 3rd?",
          options: [
            { text: "The other's 3rd starts after 7 ≥ 5, so it was still free for greedy, which takes the earliest end among free talks" },
            { text: 'Greedy always picks the shortest talk', why: 'Greedy picks by end, not length. The argument only uses that its ends stay ahead.' },
            { text: 'Greedy picks the talk that starts first', why: 'That is the start-first rule that failed above: an early start can still end very late.' },
            { text: 'Both schedules have 3 talks, so their ends match', why: 'Counts say nothing about ends; the claim end(gₖ) ≤ end(oₖ) is what makes greedy never run out first.' },
          ],
          answer: 0,
        },
        solved: 'An earlier end leaves at least as much room: greedy stays ahead at every k, so it never runs out of talks first.',
      },
    ],
  },

  {
    id: 'greedy-heap-regret',
    title: 'Decide which station you stopped at, later',
    steps: [
      {
        kind: 'watch',
        title: 'Stop here or not?',
        lines: ['Reach the target with the fewest refuelling stops. 1 unit of fuel = 1 mile.', 'Deciding yes/no at every station tries 2ⁿ subsets of stations.'],
        frames: [
          { say: 0, note: `e.g. target ${TARGET}, start fuel ${FUEL0}, stations (position:fuel) ${STATIONS.map(stLabel).join(', ')}.`, panels: [arr(STATIONS.map(stLabel), { label: 'station position:fuel' }), vars({ target: TARGET, fuel: FUEL0 })] },
          { say: 1, note: `${STATIONS.length} stations → 2⁵ = 32 possible sets of stops to try.`, panels: [arr(STATIONS.map(stLabel), { label: 'station position:fuel', highlights: hl(STATIONS.length, () => 'window') }), vars({ subsets: 2 ** STATIONS.length })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Remember what you passed',
        lines: [
          'Drive as far as the fuel allows; `fuel` is also the farthest position reachable.',
          'Every station passed goes into a **max-heap**: you *could* have stopped there.',
          'Stuck? `fuel += passed.pop()`: retroactively stop at the biggest one, `stops++`.',
        ],
        frames: rfFrames,
      },
      {
        kind: 'watch',
        title: 'Why the biggest, and the clue',
        lines: [
          'Wrong heap direction: popping the smallest wastes stops.',
          'Each stop adds the most range, so no other k stops reach further (stays ahead). Clues: **"refueling stops"**, **"deadline" + "duration"**, **"you can swap"**.',
        ],
        frames: [
          { say: 0, note: `Same input with a min-heap: ${RF_MIN.steps.map((s) => s.got).join(', ')} → ${RF_MIN.stops} stops instead of ${RF.stops}.`, panels: [vars({ 'max-heap stops': RF.stops, 'min-heap stops': RF_MIN.stops })] },
          {
            say: 1,
            note: 'Each station is pushed and popped at most once: O(n log n).',
            panels: [table(['refuelling stops', 'course schedule III'], ['heap holds', 'on trouble'], [['fuel of passed stations', 'pop the biggest'], ['durations taken', 'drop the longest']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a course overflows',
        lines: [
          `Course schedule III, e.g. courses [duration, lastDay] = ${JSON.stringify(COURSES)}, sorted by lastDay.`,
          'Taken so far: 3, 6, 2 (time 11). Next: duration 4, lastDay 13.',
        ],
        panels: [arr([3, 6, 2], { label: 'durations taken (max-heap)', highlights: { 1: 'active' } }), vars({ time: 11, next: 4, lastDay: 13 })],
        task: {
          type: 'choose',
          question: 'What does the algorithm do?',
          options: [
            { text: `Add it (time 15 > 13), then drop the longest course, 6 → time ${CR.time}, still 3 courses` },
            { text: 'Skip the new course', why: 'Also 3 courses, but time stays 11. Swapping keeps 3 courses with time 9, which can only help later.' },
            { text: 'Drop the shortest course, 2', why: 'That frees the least time. The heap is a max-heap because the longest course is the one to regret.' },
            { text: 'Take it anyway', why: 'Time 15 breaks the lastDay 13. Sorting by deadline lets you check it, it does not remove it.' },
          ],
          answer: 0,
        },
        solved: 'Keep past choices in a heap and take back the worst one when you get stuck: same count, less time used.',
      },
    ],
  },

  {
    id: 'greedy-reach-frontier',
    title: 'Can you reach the end? Track one number',
    steps: [
      {
        kind: 'watch',
        title: 'Every jump from every index',
        lines: ['`nums[i]` is the longest jump from index i. Can you reach the last index?', 'Brute force tries every jump length recursively and re-explores the same index again and again.'],
        frames: [
          { say: 0, note: `e.g. nums = [${JN.join(', ')}], last index ${JN.length - 1}.`, panels: [arr(JN, { label: 'nums' })] },
          { say: 1, note: `The lesson's brute force makes ${JB.calls} calls on these 7 cells, then answers false.`, panels: [arr(JN, { label: 'nums', highlights: hl(JN.length, () => 'window') }), vars({ calls: JB.calls })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Reachable indices are a prefix',
        lines: [
          'Invariant: every index ≤ `reach` is reachable (a longer jump can always be shortened).',
          'Check first: `if (i > reach) return false`.',
          'Then grow: `reach = Math.max(reach, i + nums[i])`.',
        ],
        frames: [{ say: 0, note: 'reach = 0: only index 0 so far. One pass, left to right.', panels: [arr(JN, { label: 'nums', highlights: { 0: 'window' } }), vars({ reach: 0 })] }, ...jFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"maximum jump length"**, **"can you reach the last index"**, **"minimum number of jumps"**, **"circular route"**, **"every number in [1, n] can be formed"**.'],
        frames: [
          {
            say: 0,
            note: 'reach only grows, so one pass decides: O(n) time, O(1) space.',
            panels: [table(['jump game', 'jump game II', 'gas station', 'patching array'], ['one number'], [['reach'], ['curEnd / farthest'], ['tank, reset start'], ['miss: [1, miss) is buildable']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: check, then grow',
        lines: [`e.g. nums = [${JQ.join(', ')}]. A teammate's loop updates \`reach\` **before** checking \`i > reach\`.`, 'At i = 2 the correct code has reach = 1.'],
        panels: [arr(JQ, { label: 'nums', pointers: [ptr(2, 'i')], highlights: { 0: 'window', 1: 'window', 2: 'bad' } }), vars({ i: 2, reach: 1 })],
        task: {
          type: 'choose',
          question: "What does the teammate's version return?",
          options: [
            { text: 'true: reach becomes max(1, 2 + 2) = 4 from index 2 itself, so the gap at 2 is never seen' },
            { text: 'false, the same as the correct code', why: 'The update runs first: reach is already 4 when 2 > reach is tested, so the check passes.' },
            { text: 'It crashes on index 3', why: 'Nothing is read out of range; it just finishes the loop and returns true.' },
            { text: 'It depends on nums[3]', why: 'nums[3] = 0 never matters: the wrong answer comes from using the unreachable index 2.' },
          ],
          answer: 0,
        },
        solved: 'Check `i > reach` before using `nums[i]`: an unreachable index must never extend the frontier.',
      },
    ],
  },

  {
    id: 'greedy-local-constraints',
    title: 'Neighbour rules from both sides: two passes',
    steps: [
      {
        kind: 'watch',
        title: 'Each child, two neighbours',
        lines: ['Everyone gets ≥ 1 candy; a higher rating than a neighbour means more candy than that neighbour. Minimise the total.'],
        frames: [
          { say: 0, note: `e.g. ratings = [${RT.join(', ')}]. Start with 1 each; then fix one side at a time.`, panels: [arr(RT, { label: 'ratings' }), arr(RT.map(() => 1), { label: 'give' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Left pass: beat the left neighbour',
        lines: ['`give = new Array(n).fill(1)`.', 'i = 1 → n − 1: if `ratings[i] > ratings[i - 1]`, `give[i] = give[i - 1] + 1`.'],
        frames: leftFrames,
      },
      {
        kind: 'watch',
        title: 'Right pass: beat the right one too',
        lines: [
          `One pass leaves [${LEFT_ONLY.join(', ')}]: rating 3 and rating 2 both have 1. The right rule is not met yet.`,
          'i = n − 2 → 0: if `ratings[i] > ratings[i + 1]`, `give[i] = Math.max(give[i], give[i + 1] + 1)`.',
        ],
        frames: [{ say: 0, note: 'After the left pass, child 2 (rating 3) ties child 3 (rating 2): broken.', panels: cPanels(LEFT_ONLY, 2, 3, 'give (left pass only)') }, ...rightFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"neighbours"**, **"adjacent"**, **"minimum candies"**, **"no two adjacent"**, **"* can be treated as"**, **"give correct change"**.'],
        frames: [
          {
            say: 0,
            note: `Each value is the smallest that meets both sides, so ${CD.total} is minimal. Two O(n) passes.`,
            panels: [table(['candy', 'valid parenthesis string', 'lemonade change'], ['how'], [['two passes + max'], ['track [lo, hi] open count'], ['simulate, largest bill first']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: why max?',
        lines: [`e.g. ratings = [${RQ.join(', ')}]. After the left pass give = [${CQ.left.at(-1).give.join(', ')}].`, 'Right pass, i = 2: 5 > 1.'],
        panels: [arr(RQ, { label: 'ratings', pointers: [ptr(2, 'i')], highlights: { 2: 'active', 3: 'visited' } }), arr(CQ.left.at(-1).give, { label: 'give', highlights: { 2: 'active' } })],
        task: {
          type: 'choose',
          question: 'What is give[2] after this step?',
          options: [
            { text: '3 = max(3, 1 + 1): the left pass already needs 3 here' },
            { text: '2 = give[3] + 1', why: 'That overwrites the left rule: child 2 (rating 5) would tie child 1 (rating 3), who has 2.' },
            { text: '1, it was fine already', why: 'Rating 5 > 1 means child 2 must get more than child 3, who has 1.' },
            { text: '4 = give[2] + 1', why: 'More than needed: the total must stay minimal, and 3 already beats both neighbours.' },
          ],
          answer: 0,
        },
        solved: 'Each pass satisfies one side; max() keeps the first pass\'s rule while adding the second.',
      },
    ],
  },
];
