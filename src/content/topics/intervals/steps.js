// Step lessons for Intervals (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every merge, keep/skip, intersection, event count and booking below comes from running the lesson's own code
// on the example input (the run* helpers mirror the lesson's templates line for line).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const stack = (values, label) => ({ kind: 'stack', values, label });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = ([s, e]) => `[${s},${e}]`;
const fmtList = (list) => `[${list.map(fmt).join(',')}]`;
const inf = (x) => (x === -Infinity ? '-∞' : x);
// an intervals panel: pairs plus one state per pair (function of index, or array)
const ivp = (pairs, label, min, max, st = () => '') =>
  ({ kind: 'intervals', label, min, max, items: pairs.map(([start, end], k) => ({ start, end, state: (typeof st === 'function' ? st(k) : st[k]) || '' })) });
const check = (ok, msg) => {
  if (!ok) throw new Error(`intervals steps: ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- merge (sort by start, extend last with Math.max) ----------
function mergeRun(list, strict = false) {
  const sorted = list.toSorted((a, b) => a[0] - b[0]);
  const out = [];
  const steps = sorted.map(([s, e], i) => {
    const last = out[out.length - 1];
    const prev = last ? [...last] : null;
    const hit = !!last && (strict ? s < last[1] : s <= last[1]);
    if (hit) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
    return { i, s, e, prev, hit, out: out.map((x) => [...x]) };
  });
  return { sorted, steps, out };
}
const sym = (strict) => (strict ? '<' : '≤');
const mergeNote = (st, strict = false) =>
  !st.prev
    ? `${fmt([st.s, st.e])} is first → output ${fmtList(st.out)}.`
    : st.hit
      ? `${st.s} ${sym(strict)} ${st.prev[1]} yes → end = max(${st.prev[1]},${st.e}) = ${st.out.at(-1)[1]}.`
      : `${st.s} ${sym(strict)} ${st.prev[1]} no → gap: ${fmt([st.s, st.e])} opens a new block.`;
const mergePanels = (sorted, st, min, max, label = 'sorted by start', done = false) => [
  ivp(sorted, label, min, max, (k) => (done || k < st.i ? 'visited' : k === st.i ? 'active' : '')),
  ivp(st.out, 'merged blocks', min, max, (k) => (!done && k === st.out.length - 1 ? 'active' : 'done')),
];
const mergeFrames = (run, min, max, say, strict = false, label) => run.steps.map((st) => ({ say: say(st), note: mergeNote(st, strict), panels: mergePanels(run.sorted, st, min, max, label) }));

// ---------- greedy by earliest end ----------
function greedyRun(list, touching = false) {
  const sorted = list.toSorted((a, b) => a[1] - b[1]);
  let lastEnd = -Infinity,
    count = 0;
  const keep = [];
  const steps = sorted.map(([s, e], i) => {
    const before = lastEnd;
    const fits = touching ? s > lastEnd : s >= lastEnd;
    if (fits) {
      count++;
      lastEnd = e;
    }
    keep.push(fits);
    return { i, s, e, before, fits, count, lastEnd, keep: [...keep] };
  });
  return { sorted, steps, count };
}
const gState = (st) => (k) => (k > st.i ? '' : k === st.i ? (st.fits ? 'active' : 'bad') : st.keep[k] ? 'done' : 'muted');
const greedyFrames = (run, min, max, opts = {}) => {
  const { say = () => 0, word = 'kept', op = '≥', label = 'sorted by end' } = opts;
  return run.steps.map((st) => ({
    say: say(st),
    note: `${fmt([st.s, st.e])}: ${st.before === -Infinity ? `lastEnd is -∞ → fits` : `${st.s} ${op} ${st.before}? ${st.fits ? 'yes' : 'no'}`} → ${st.fits ? `${word} ${st.count}, lastEnd = ${st.lastEnd}` : 'skip it'}.`,
    panels: [ivp(run.sorted, label, min, max, gState(st)), vars({ lastEnd: inf(st.lastEnd), [word]: st.count })],
  }));
};

// ---------- two-pointer intersection ----------
function intersectRun(A, B, both = false) {
  const out = [];
  const steps = [];
  let i = 0,
    j = 0;
  while (i < A.length && j < B.length) {
    const lo = Math.max(A[i][0], B[j][0]);
    const hi = Math.min(A[i][1], B[j][1]);
    if (lo <= hi) out.push([lo, hi]);
    const move = both ? 'both' : A[i][1] < B[j][1] ? 'i' : 'j';
    steps.push({ i, j, lo, hi, hit: lo <= hi, move, out: out.map((x) => [...x]) });
    if (move === 'i') i++;
    else if (move === 'j') j++;
    else {
      i++;
      j++;
    }
  }
  return { steps, out, end: { i, j } };
}
const xPanels = (A, B, i, j, out, min, max) => [
  ivp(A, 'A', min, max, (k) => (k < i ? 'muted' : k === i ? 'active' : '')),
  ivp(B, 'B', min, max, (k) => (k < j ? 'muted' : k === j ? 'active' : '')),
  ivp(out, 'out', min, max, () => 'done'),
];
const xNote = (A, B, st) =>
  `${fmt(A[st.i])} vs ${fmt(B[st.j])}: lo ${st.lo}, hi ${st.hi} → ${st.hit ? `record ${fmt([st.lo, st.hi])}` : 'no overlap'}. ` +
  (st.move === 'both' ? 'Move both.' : st.move === 'i' ? `A ends first → i++.` : `B ends first (or tie) → j++.`);
const xFrames = (A, B, run, min, max, say) => run.steps.map((st) => ({ say: say(st), note: xNote(A, B, st), panels: xPanels(A, B, st.i, st.j, st.out, min, max) }));

// ---------- sweep line: events [t, ±1], ends first at a tie ----------
function sweepRun(list) {
  const events = [];
  list.forEach(([s, e], id) => events.push([s, +1, id], [e, -1, id]));
  const pushed = events.map((x) => [...x]);
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let active = 0,
    best = 0;
  const steps = events.map(([t, d], k) => {
    active += d;
    best = Math.max(best, active);
    return { k, t, d, active, best };
  });
  return { pushed, events, steps, best };
}
const evLabel = ([t, d]) => `${t} ${d > 0 ? '+1' : '-1'}`;
// state of interval id after processing events[0..k]
const evState = (events, k) => (id) => {
  const seen = events.slice(0, k + 1).filter((e) => e[2] === id).length;
  return seen === 2 ? 'visited' : seen === 1 ? 'active' : '';
};
const sweepPanels = (list, run, k, min, max, label = 'intervals') => [
  ivp(list, label, min, max, k < 0 ? () => '' : evState(run.events, k)),
  arr(run.events.map(evLabel), { label: 'events (sorted)', ...(k >= 0 ? { pointers: [ptr(k, 'now')] } : {}), highlights: hl(run.events.length, (x) => (x === k ? 'active' : x < k ? 'visited' : '')) }),
  vars(k < 0 ? { active: 0, best: 0 } : { time: run.steps[k].t, active: run.steps[k].active, best: run.steps[k].best }),
];
const sweepFrames = (list, run, min, max, say) =>
  run.steps.map((st) => ({
    say: say(st),
    note: `t = ${st.t}: ${st.d > 0 ? 'a start, +1' : 'an end, -1'} → active ${st.active}, best ${st.best}.`,
    panels: sweepPanels(list, run, st.k, min, max),
  }));

// ---------- Meeting Rooms II: sorted starts & ends ----------
function roomsRun(list) {
  const starts = list.map((x) => x[0]).sort((a, b) => a - b);
  const ends = list.map((x) => x[1]).sort((a, b) => a - b);
  let rooms = 0,
    j = 0;
  const steps = starts.map((s, i) => {
    const jBefore = j;
    const reuse = s >= ends[j];
    if (reuse) j++;
    else rooms++;
    return { i, s, end: ends[jBefore], jBefore, j, reuse, rooms };
  });
  return { starts, ends, steps, rooms };
}
const roomPanels = (run, st) => [
  arr(run.starts, { label: 'starts', pointers: [ptr(st.i, 'i')], highlights: hl(run.starts.length, (k) => (k === st.i ? 'active' : k < st.i ? 'visited' : '')) }),
  arr(run.ends, { label: 'ends', pointers: [ptr(st.jBefore, 'j', 'b')], highlights: hl(run.ends.length, (k) => (k === st.jBefore ? (st.reuse ? 'done' : 'window') : k < st.jBefore ? 'muted' : '')) }),
  vars({ rooms: st.rooms, j: st.j }),
];
const roomNote = (st) => (st.reuse ? `${st.s} ≥ ${st.end} → reuse (j = ${st.j}). rooms = ${st.rooms}.` : `${st.s} < ${st.end} → new room. rooms = ${st.rooms}.`);
const roomFrames = (run, say) => run.steps.map((st) => ({ say: say(st), note: roomNote(st), panels: roomPanels(run, st) }));

// ---------- Insert Interval (three phases) ----------
function insertRun(list, nw) {
  const steps = [];
  const out = [];
  let [s, e] = nw;
  let i = 0;
  const n = list.length;
  const role = [];
  while (i < n && list[i][1] < s) {
    role[i] = 'copy';
    out.push(list[i]);
    steps.push({ phase: 1, i, s, e, out: out.map((x) => [...x]), role: [...role] });
    i++;
  }
  while (i < n && list[i][0] <= e) {
    role[i] = 'absorb';
    const eBefore = e;
    s = Math.min(s, list[i][0]);
    e = Math.max(e, list[i][1]);
    steps.push({ phase: 2, i, s, e, eBefore, out: out.map((x) => [...x]), role: [...role] });
    i++;
  }
  out.push([s, e]);
  steps.push({ phase: 'push', i, s, e, out: out.map((x) => [...x]), role: [...role] });
  while (i < n) {
    role[i] = 'copy';
    out.push(list[i]);
    steps.push({ phase: 3, i, s, e, out: out.map((x) => [...x]), role: [...role] });
    i++;
  }
  return { steps, out };
}
const insState = (st) => (k) => (st.role[k] === undefined ? '' : k === st.i && st.phase !== 'push' ? 'active' : st.role[k] === 'copy' ? 'done' : 'muted');
const insPanels = (list, st, min, max) => [
  ivp(list, 'sorted, disjoint list', min, max, insState(st)),
  ivp([[st.s, st.e]], 'new [s, e]', min, max, ['window']),
  ivp(st.out, 'out', min, max, () => 'done'),
];
const insNote = (list, st) => {
  const cur = list[st.i] && fmt(list[st.i]);
  if (st.phase === 1) return `Phase 1: ${cur} ends at ${list[st.i][1]} < s = ${st.s} → copy it.`;
  if (st.phase === 2) return `Phase 2: ${cur} starts at ${list[st.i][0]} ≤ e = ${st.eBefore} → absorb: [s, e] = ${fmt([st.s, st.e])}.`;
  if (st.phase === 'push') return `${cur ? `${cur} starts at ${list[st.i][0]} > e = ${st.e}` : 'Nothing left'} → push ${fmt([st.s, st.e])}.`;
  return `Phase 3: copy ${cur}.`;
};
const insFrames = (list, run, min, max, say) => run.steps.map((st) => ({ say: say(st), note: insNote(list, st), panels: insPanels(list, st, min, max) }));

// ---------- design: sorted bookings [start, end) ----------
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
  if (i < list.length && list[i][0] < e) return { i, ok: false, why: 'succ' };
  if (i > 0 && list[i - 1][1] > s) return { i, ok: false, why: 'pred' };
  list.splice(i, 0, [s, e]);
  return { i, ok: true };
}
const listCells = (list, i, extra = {}) =>
  arr([...list.map(fmt), '·'], { label: 'bookings (sorted)', pointers: [ptr(i, 'i')], highlights: hl(list.length + 1, (k) => extra[k] ?? (k === i ? 'active' : '')) });

// ================= section data =================

// what
const MEET = [[9, 10], [9.5, 12], [14, 15]];
const MEET_MIXED = [MEET[2], MEET[0], MEET[1]];

// why: every pair vs neighbours (half-open test from the lesson's code)
const WHY = [[1, 3], [8, 10], [5, 7], [2, 4]];
const clashes = (a, b) => a[0] < b[1] && b[0] < a[1];
const PAIRS = [];
for (let i = 0; i < WHY.length; i++) for (let j = i + 1; j < WHY.length; j++) PAIRS.push({ i, j, c: clashes(WHY[i], WHY[j]) });
const WHY_S = WHY.toSorted((x, y) => x[0] - y[0]);
const NEIGH = WHY_S.slice(1).map((x, k) => ({ k: k + 1, c: x[0] < WHY_S[k][1] }));
check(PAIRS.length === 6 && NEIGH.length === 3, 'why counts');
const SIX = [[1, 2], [3, 5], [4, 6], [7, 8], [9, 11], [10, 12]];
check((6 * 5) / 2 === 15, 'n(n-1)/2');

// when
const BOOK3 = [[1, 3], [2, 5], [7, 9]];
const BOOK3M = mergeRun(BOOK3).out;
const busy = BOOK3M.reduce((t, [s, e]) => t + e - s, 0);
check(busy === 6 && BOOK3M.length === 2, 'when busy time');

// recognize
const ATT = [1, 2, 5];
const POISON = ATT.map((t) => [t, t + 2]);
const NUMS = [0, 1, 2, 4, 5, 7];
const runsOf = (a) => {
  const out = [];
  for (const x of a) {
    const last = out[out.length - 1];
    if (last && x === last[1] + 1) last[1] = x;
    else out.push([x, x]);
  }
  return out;
};
const NUM_RUNS = runsOf(NUMS);
const runId = (a, runs) => a.map((x) => runs.findIndex(([s, e]) => x >= s && x <= e));
const NUMS2 = [3, 4, 5, 8, 9, 12];
const NUM2_RUNS = runsOf(NUMS2);
check(NUMS2.findIndex((x, k) => k > 0 && x !== NUMS2[k - 1] + 1) === 3, 'recognize cell');

// intuition
const INT = [[1, 4], [3, 6], [6, 8], [10, 12], [11, 13]];
const INT_R = mergeRun(INT);
const INT2 = [[1, 2], [2, 5], [6, 7], [7, 9], [12, 13]];
const INT2_R = mergeRun(INT2);
check(INT2_R.out.length === 3, 'intuition turn');

// brute force (the lesson's mergeBrute, instrumented)
function bruteRun(intervals) {
  const list = intervals.map(([s, e]) => [s, e]);
  const steps = [];
  let changed = true,
    round = 0,
    checks = 0;
  while (changed) {
    changed = false;
    round++;
    outer: for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]];
        checks++;
        const hit = a[0] <= b[1] && b[0] <= a[1];
        steps.push({ round, i, j, hit, checks, list: list.map((x) => [...x]) });
        if (hit) {
          list[i] = [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
          list.splice(j, 1);
          changed = true;
          steps.push({ round, merged: true, i, checks, list: list.map((x) => [...x]) });
          break outer;
        }
      }
    }
  }
  return { steps, out: list.sort((x, y) => x[0] - y[0]), checks };
}
const BR = [[5, 7], [1, 2], [6, 9], [2, 3]];
const BR_R = bruteRun(BR);
check(same(BR_R.out, mergeRun(BR).out), 'brute = merge');
const CHAIN = [[1, 3], [2, 5], [4, 7], [6, 9], [8, 10]];
const CHAIN_MERGES = bruteRun(CHAIN).steps.filter((s) => s.merged).length;
check(CHAIN_MERGES === 4, 'chain merges');

// optimized
const OP = [[6, 8], [1, 3], [2, 4], [9, 10]];
const OP_R = mergeRun(OP);
const INS = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]];
const INS_R = insertRun(INS, [4, 8]);
check(same(INS_R.out, [[1, 2], [3, 10], [12, 16]]), 'insert');
const INS2 = [[1, 3], [4, 6], [8, 10], [11, 12]];
const INS2_R = insertRun(INS2, [5, 9]);
check(INS2_R.out.length === 3, 'insert turn');

// template
const TP = [[3, 4], [1, 2], [2, 3]];
const TP_R = mergeRun(TP);
const TP_H = mergeRun(TP, true);
check(TP_R.out.length === 1 && TP_H.out.length === 3, 'template');

// implementation
const IMP = [[1, 3], [6, 9]];
const IMP_R = insertRun(IMP, [2, 5]);
const IMP2 = [[1, 2], [4, 6]];
const IMP2_R = insertRun(IMP2, [2, 3]);
check(same(IMP2_R.out, [[1, 3], [4, 6]]), 'implementation turn');

// dry run (the lesson's table)
const DR = [[1, 3], [8, 10], [2, 6], [15, 18], [9, 12]];
const DR_R = mergeRun(DR);
check(same(DR_R.out, [[1, 6], [8, 12], [15, 18]]), 'dry run output');
check(same(DR_R.steps.map((s) => s.hit), [false, true, false, true, false]), 'dry run overlaps');
const DR_LABELS = DR_R.sorted.map(fmt);

// intuition-greedy
const ES = [[1, 10], [2, 3], [4, 5]];
const startFirst = (list) => {
  let lastEnd = -Infinity;
  return list.toSorted((a, b) => a[0] - b[0]).map(([s, e]) => (s >= lastEnd ? ((lastEnd = e), true) : false));
};
const ES_START = startFirst(ES); // keeps [1,10] only
const SH = [[1, 5], [4, 7], [6, 10]];
const SH_SHORT = (() => {
  const kept = [];
  for (const x of SH.toSorted((a, b) => a[1] - a[0] - (b[1] - b[0]))) if (kept.every((k) => !clashes(k, x))) kept.push(x);
  return kept;
})();
check(ES_START.filter(Boolean).length === 1 && greedyRun(ES).count === 2, 'earliest start fails');
check(SH_SHORT.length === 1 && same(SH_SHORT[0], [4, 7]) && greedyRun(SH).count === 2, 'shortest fails');
const G4 = [[1, 3], [2, 4], [3, 5], [4, 6]];
const G4_R = greedyRun(G4);
check(G4_R.count === 2, 'greedy turn');

// optimized-greedy
const NO = [[1, 4], [2, 3], [3, 6], [5, 7], [6, 8]];
const NO_R = greedyRun(NO);
check(NO_R.count === 3, 'non-overlapping');
const BAL = [[1, 6], [2, 8], [7, 12], [10, 16]];
const BAL_R = greedyRun(BAL, true);
check(BAL_R.count === 2, 'arrows');
const DUP = [[1, 2], [1, 2], [1, 2]];
const DUP_R = greedyRun(DUP);
check(DUP.length - DUP_R.count === 2, 'dup removals');

// template-greedy
const TG = [[1, 3], [3, 5], [5, 7]];
const TG_F = greedyRun(TG, false);
const TG_T = greedyRun(TG, true);
check(TG_F.count === 3 && TG_T.count === 2, 'touching flag');

// implementation-greedy
const AR = [[3, 4], [1, 2], [4, 5], [2, 3]];
const AR_R = greedyRun(AR, true);
check(AR_R.count === 2, 'arrows impl');
const TOUCH2 = [[1, 5], [5, 8]];
check(greedyRun(TOUCH2, true).count === 1 && greedyRun(TOUCH2, false).count === 2, 'teammate bug');

// dry-run-greedy (the lesson's table)
const DG = [[1, 2], [2, 3], [3, 4], [1, 3]];
const DG_R = greedyRun(DG);
check(same(DG_R.sorted, [[1, 2], [2, 3], [1, 3], [3, 4]]) && same(DG_R.steps.map((s) => s.fits), [true, true, false, true]) && DG_R.count === 3, 'dry-run-greedy');
const DG_SWAP = greedyRun([[1, 2], [1, 3], [2, 3], [3, 4]]);
check(DG_SWAP.count === 3, 'tie swap');

// optimized-intersection
const XA = [[1, 3], [5, 9]];
const XB = [[2, 6], [8, 10]];
const X_R = intersectRun(XA, XB);
check(same(X_R.out, [[2, 3], [5, 6], [8, 9]]), 'intersection');
const PA = [[1, 4], [6, 8]];
const PB = [[4, 6], [7, 9]];
const P_R = intersectRun(PA, PB);
check(P_R.out.length === 3, 'point intersections');

// intuition-sweep (the lesson's example)
const SW = [[1, 4], [2, 5], [7, 9]];
const SW_R = sweepRun(SW);
check(same(SW_R.steps.map((s) => s.active), [1, 2, 1, 0, 1, 0]) && SW_R.best === 2, 'lesson sweep');
const SW2 = [[1, 6], [2, 4], [3, 5], [7, 8]];
const SW2_R = sweepRun(SW2);
check(SW2_R.best === 3, 'sweep turn');

// optimized-sweep
const MR = [[1, 4], [2, 6], [5, 8], [7, 9]];
const MR_R = roomsRun(MR);
check(MR_R.rooms === 2 && sweepRun(MR).best === 2, 'rooms');
const MR2 = [[1, 5], [2, 6], [3, 4], [6, 8]];
const MR2_R = roomsRun(MR2);
check(MR2_R.rooms === 3 && sweepRun(MR2).best === 3, 'rooms turn');

// template-sweep
const TS = [[2, 5], [1, 3], [4, 6]];
const TS_R = sweepRun(TS);
check(TS_R.best === 2, 'template sweep');
const TS2 = [[1, 3], [3, 5], [2, 4]];
const TS2_R = sweepRun(TS2);
const TS2_ORDER = TS2_R.events.map(evLabel);
check(new Set(TS2_ORDER).size === TS2_ORDER.length, 'distinct events');

// dry-run-sweep (the lesson's table)
const DS = [[0, 30], [5, 10], [15, 20]];
const DS_R = roomsRun(DS);
check(same(DS_R.starts, [0, 5, 15]) && same(DS_R.ends, [10, 20, 30]) && same(DS_R.steps.map((s) => s.rooms), [1, 2, 2]) && DS_R.steps[2].j === 1, 'dry-run-sweep');

// optimized-design
const CALLS = [[10, 20], [30, 40], [5, 12], [20, 30]];
const BOOKS = (() => {
  const list = [];
  return CALLS.map(([s, e]) => {
    const before = list.map((x) => [...x]);
    const r = tryBook(list, s, e);
    return { s, e, before, after: list.map((x) => [...x]), ...r };
  });
})();
check(same(BOOKS.map((b) => b.ok), [true, true, false, true]) && BOOKS[2].why === 'succ', 'bookings');
const CAL = [[2, 4], [6, 9], [12, 15], [18, 20]];
const CAL_I = lowerBound(CAL, 10);
const CAL_AFTER = CAL.map((x) => [...x]);
const CAL_OK = tryBook(CAL_AFTER, 10, 12);
check(CAL_I === 2 && CAL_OK.ok, 'design turn');

// mistakes
const MA = [[1, 4], [6, 9]];
const MB = [[2, 7]];
const M_BOTH = intersectRun(MA, MB, true);
const M_RIGHT = intersectRun(MA, MB);
check(M_BOTH.out.length === 1 && M_RIGHT.out.length === 2, 'both pointers');
const SEL = [[1, 9], [2, 3], [4, 5], [6, 7]];
check(startFirst(SEL).filter(Boolean).length === 1 && greedyRun(SEL).count === 3, 'start-sorted selection');

// interview tips: edge cases through the closed merge template
const EDGES = [
  { name: 'empty', list: [] },
  { name: 'single', list: [[2, 5]] },
  { name: 'all identical', list: [[2, 4], [2, 4], [2, 4]] },
  { name: 'one contains all', list: [[1, 9], [2, 3], [5, 6]] },
  { name: 'touching', list: [[1, 2], [2, 3]] },
  { name: 'negative', list: [[-3, -1], [-2, 0]] },
].map((c) => ({ ...c, out: mergeRun(c.list).out }));
const bounds = (list) => (list.length ? [Math.min(...list.map((x) => x[0])), Math.max(...list.map((x) => x[1]))] : [0, 1]);

export default {
  what: [
    {
      kind: 'watch',
      title: 'Intervals on a line',
      lines: ['An **interval** is a stretch with a **start** and an **end**: `[start, end]`.', 'Most problems start by **sorting** them by start.', 'Then neighbours in the array are neighbours on the line.'],
      frames: [
        { say: 0, note: 'Three meetings, each a [start, end] pair, given out of order.', panels: [ivp(MEET_MIXED, 'meetings', 9, 15), arr(MEET_MIXED.map(fmt), { label: 'array order' })] },
        { say: 1, note: 'Sort by start: 9, then 9.5, then 14.', panels: [ivp(MEET, 'meetings, sorted', 9, 15), arr(MEET.map(fmt), { label: 'array order', highlights: hl(3, () => 'done') })] },
        { say: 2, note: 'Now [9,10] and [9.5,12] sit side by side: the clash is between neighbours.', panels: [ivp(MEET, 'meetings, sorted', 9, 15, ['active', 'active', '']), arr(MEET.map(fmt), { label: 'array order', highlights: { 0: 'active', 1: 'active' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The one overlap test',
      lines: [
        'Two intervals overlap when **each starts before the other ends**.',
        'Half-open `[a, b)`: test with `<`. Touching does **not** overlap.',
        'Closed `[a, b]`: test with `<=`. Touching **does** overlap.',
        'The shared part is `[max(starts), min(ends)]`.',
      ],
      frames: [
        { say: 0, note: 'a = [2,6), b = [4,9): 2 < 9 and 4 < 6 → they overlap.', panels: [ivp([[2, 6], [4, 9]], 'a, b (half-open)', 1, 9, ['active', 'active']), vars({ 'a0 < b1': '2 < 9', 'b0 < a1': '4 < 6', overlap: 'yes' })] },
        { say: 3, note: 'Shared part: [max(2,4), min(6,9)] = [4,6].', panels: [ivp([[2, 6], [4, 9], [4, 6]], 'a, b, shared', 1, 9, ['visited', 'visited', 'done']), vars({ lo: 4, hi: 6 })] },
        { say: 1, note: '[1,3) and [3,5): is 3 < 3? No → no overlap, they only touch.', panels: [ivp([[1, 3], [3, 5]], 'half-open', 1, 9, ['active', 'muted']), vars({ test: '3 < 3', overlap: 'no' })] },
        { say: 2, note: '[1,3] and [3,5] closed: 1 ≤ 5 and 3 ≤ 3 → they share the point 3.', panels: [ivp([[1, 3], [3, 5]], 'closed', 1, 9, ['active', 'active']), vars({ test: '3 <= 3', overlap: 'yes' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the shared part',
      lines: ['Closed intervals `[4, 8]` and `[1, 4]`.', 'Shared part = `[max(starts), min(ends)]`.'],
      panels: [ivp([[4, 8], [1, 4]], 'closed', 1, 9, ['active', 'active'])],
      task: {
        type: 'choose',
        question: 'What do they share?',
        options: [
          { text: '[4, 4]: the single point 4', why: '' },
          { text: 'Nothing: they only touch', why: 'They are closed: both include 4, and touching counts as overlap.' },
          { text: '[1, 8]', why: 'That covers both of them (their union), not the part they share.' },
          { text: '[4, 8]', why: 'min(ends) is min(8, 4) = 4, not 8.' },
        ],
        answer: 0,
      },
      solved: 'max(4, 1) = 4 and min(8, 4) = 4: the shared part is the single point [4, 4].',
      then: [{ say: 1, note: 'lo = 4, hi = 4: one shared point.', panels: [ivp([[4, 8], [1, 4], [4, 4]], 'closed, with shared part', 1, 9, ['visited', 'visited', 'done']), vars({ lo: 4, hi: 4 })] }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Every pair vs neighbours',
      lines: ['Every pair: `n(n−1)/2` comparisons, **O(n²)**.', 'Sorted by start, a clash shows up between **neighbours**.', 'One sort plus one pass: **O(n log n)**.'],
      frames: [
        ...PAIRS.map((p, k) => ({
          say: 0,
          note: `Pair ${p.i},${p.j}: ${fmt(WHY[p.i])} and ${fmt(WHY[p.j])} → ${p.c ? 'clash' : 'no clash'}.`,
          panels: [ivp(WHY, 'input order', 1, 10, (x) => (x === p.i || x === p.j ? (p.c ? 'bad' : 'active') : '')), vars({ checks: k + 1, clash: PAIRS.slice(0, k + 1).some((q) => q.c) ? 'yes' : 'no' })],
        })),
        { say: 1, note: 'Sort by start first.', panels: [ivp(WHY_S, 'sorted by start', 1, 10), vars({ checks: 0 })] },
        ...NEIGH.map((q, k) => ({
          say: 1,
          note: `${fmt(WHY_S[q.k])} vs the one before, ${fmt(WHY_S[q.k - 1])}: ${WHY_S[q.k][0]} < ${WHY_S[q.k - 1][1]}? ${q.c ? 'yes → clash' : 'no'}.`,
          panels: [ivp(WHY_S, 'sorted by start', 1, 10, (x) => (x === q.k || x === q.k - 1 ? (q.c ? 'bad' : 'active') : '')), vars({ checks: k + 1 })],
        })),
        { say: 2, note: 'n = 4: 6 pair checks versus 3 neighbour checks after the sort.', panels: [table(['every pair', 'neighbours'], ['checks, n = 4'], [['6'], ['3']], [['bad'], ['done']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the pairs',
      lines: ['Now there are **6** intervals.'],
      panels: [ivp(SIX, '6 intervals', 1, 12), vars({ n: 6 })],
      task: { type: 'number', question: 'How many comparisons does the every-pair loop make?', options: [6, 12, 15, 36], answer: 15, hint: 'n(n−1)/2 with n = 6.' },
      solved: '6 · 5 / 2 = 15. After sorting, only 5 neighbour checks are needed.',
      then: [{ say: 0, note: '15 pair checks versus 5 neighbour checks.', panels: [table(['every pair', 'neighbours'], ['checks, n = 6'], [['15'], ['5']], [['bad'], ['done']])] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Pick the tool by the question',
      lines: [
        'Merge, union, total length, insert → **merge**, sort by start.',
        'Keep most, remove fewest, fewest points → **greedy**, sort by end.',
        'Overlap of two sorted lists → **two pointers**.',
        'How many at once, rooms, skyline, point queries → **sweep line**.',
        'Intervals arrive one by one → a **sorted interval set**.',
      ],
      frames: (() => {
        const rows = ['merge', 'greedy by end', 'two pointers', 'sweep line', 'design'];
        const key = ['start', 'end', '(already sorted)', 'event time', 'kept sorted'];
        return rows.map((_, f) => ({ say: f, note: `${rows[f]}: sort key is ${key[f]}.`, panels: [table(rows, ['sort by'], key.map((k, i) => [i <= f ? k : '?']), key.map((_, i) => [i === f ? 'active' : i < f ? 'done' : '']))] }));
      })(),
    },
    {
      kind: 'watch',
      title: 'Settle the endpoints first',
      lines: ['Meetings `[1,5]` and `[5,8]` can share a room: half-open.', 'Balloons `[1,5]` and `[5,8]`: one arrow at x = 5 bursts both: closed.', 'In code the only difference is `<` versus `<=`.'],
      frames: [
        { say: 0, note: 'Meetings: the first ends at 5, the second may start at 5.', panels: [ivp([[1, 5], [5, 8]], 'meetings (half-open)', 1, 8, ['active', 'active']), vars({ test: '5 < 5', overlap: 'no' })] },
        { say: 1, note: 'Balloons: both include x = 5, so they overlap.', panels: [ivp([[1, 5], [5, 8]], 'balloons (closed)', 1, 8, ['bad', 'bad']), vars({ test: '5 <= 5', overlap: 'yes' })] },
        { say: 2, note: 'Same numbers, different answer: decide before coding.', panels: [table(['half-open', 'closed'], ['test', 'overlap?'], [['<', 'no'], ['<=', 'yes']], [['', 'done'], ['', 'bad']])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: busy time',
      lines: ['Bookings for one room.', 'Question: what is the **total time** the room is booked?'],
      panels: [ivp(BOOK3, 'bookings', 1, 9)],
      task: {
        type: 'choose',
        question: 'Which technique fits?',
        options: [
          { text: 'Merge (sort by start)', why: '' },
          { text: 'Greedy by earliest end', why: 'Greedy keeps a subset; the time of dropped bookings would be lost.' },
          { text: 'Two-pointer intersection', why: 'That needs two separate sorted lists; here there is one.' },
          { text: 'Design: a sorted interval set', why: 'All bookings are known up front; nothing arrives one by one.' },
        ],
        answer: 0,
      },
      solved: `Total covered length is a merge question: the blocks are ${BOOK3M.map(fmt).join(' and ')}, so ${BOOK3M.map(([s, e]) => e - s).join(' + ')} = ${busy}.`,
      then: [{ say: 1, note: `[1,3] and [2,5] become [1,5]; busy time = ${busy}.`, panels: [ivp(BOOK3, 'bookings', 1, 9, () => 'visited'), ivp(BOOK3M, 'merged', 1, 9, () => 'done'), vars({ busy })] }],
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Hidden intervals',
      lines: ['Teemo Attacking: an attack at time `t` poisons `[t, t + duration)`.', 'Summary Ranges: each number `x` is a tiny interval `[x, x]`.', 'Consecutive numbers **touch**, so they join one range.'],
      frames: [
        { say: 0, note: 'Attacks at 1, 2, 5 with duration 2.', panels: [arr(ATT, { label: 'attack times' }), vars({ duration: 2 })] },
        { say: 0, note: 'They become [1,3), [2,4), [5,7): now an interval problem.', panels: [arr(ATT, { label: 'attack times', highlights: hl(3, () => 'visited') }), ivp(POISON, 'poisoned', 1, 7, () => 'active')] },
        { say: 1, note: 'Each number is a point interval.', panels: [arr(NUMS, { label: 'nums' }), ivp(NUMS.map((x) => [x, x]), 'points [x, x]', 0, 7, () => 'active')] },
        { say: 2, note: `Touching points join: ${NUM_RUNS.map(fmt).join(', ')}.`, panels: [arr(NUMS, { label: 'nums', highlights: hl(NUMS.length, (k) => (runId(NUMS, NUM_RUNS)[k] % 2 ? 'visited' : 'window')) }), ivp(NUM_RUNS, 'ranges', 0, 7, () => 'done')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where a range breaks',
      lines: ['Each number is a point `[x, x]`.', 'Consecutive numbers touch and share a range.'],
      panels: [arr(NUMS2, { label: 'nums (sorted)' })],
      task: {
        type: 'cell',
        question: 'Tap the first number that does **not** touch the one before it.',
        answer: 3,
        hints: { 0: '3 is the very first number; it opens the first range.', 1: '4 = 3 + 1: it touches 3.', 2: '5 = 4 + 1: still touching.', 4: '9 = 8 + 1 touches 8; the break came earlier.', 5: '12 does start a range, but not the first break.' },
      },
      solved: `5 → 8 skips 6 and 7, so 8 opens a new range: ${NUM2_RUNS.map(fmt).join(', ')}.`,
      then: [{ say: 1, note: `Ranges: ${NUM2_RUNS.map(fmt).join(', ')}.`, panels: [arr(NUMS2, { label: 'nums', highlights: hl(6, (k) => (runId(NUMS2, NUM2_RUNS)[k] % 2 ? 'visited' : 'window')) }), ivp(NUM2_RUNS, 'ranges', 3, 12, () => 'done')] }],
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Stretch or start a new block',
      lines: [
        'Walk the sorted intervals with one open block `[curStart, curEnd]`.',
        '`start <= curEnd`: it overlaps, so stretch: `curEnd = max(curEnd, end)`.',
        '`start > curEnd`: a gap. The block is final; open a new one.',
        'Behind the pointer: finished, disjoint blocks plus one open block.',
      ],
      frames: [
        ...mergeFrames(INT_R, 1, 13, (st) => (!st.prev ? 0 : st.hit ? 1 : 2)),
        { say: 3, note: `Done: ${INT_R.out.map(fmt).join(' and ')}, disjoint.`, panels: mergePanels(INT_R.sorted, INT_R.steps.at(-1), 1, 13, 'sorted by start', true) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the blocks',
      lines: ['Sorted by start. Touching counts: `start <= curEnd`.'],
      panels: [ivp(INT2, 'sorted by start', 1, 13)],
      task: { type: 'number', question: 'How many merged blocks come out?', options: [2, 3, 4, 5], answer: 3, hint: '2 touches 2 and 7 touches 7, but 5 → 6 and 9 → 12 are gaps.' },
      solved: `${INT2_R.out.map(fmt).join(', ')}: three blocks.`,
      then: mergeFrames(INT2_R, 1, 13, () => 0),
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Merge any pair, restart',
      lines: ['Find **any** overlapping pair and merge it.', 'Then **restart** the scan from the beginning.', 'Stop when a full scan finds no pair; then sort.', 'Up to n merges × O(n²) pair search: **O(n³)** worst case.'],
      frames: [
        ...BR_R.steps.map((st) =>
          st.merged
            ? { say: 1, note: `Merged into ${fmt(st.list[st.i])}; restart the scan.`, panels: [ivp(st.list, `round ${st.round}`, 1, 9, (k) => (k === st.i ? 'done' : '')), vars({ checks: st.checks, left: st.list.length })] }
            : {
                say: st.hit ? 0 : st.round === 3 ? 2 : 0,
                note: `Check ${fmt(st.list[st.i])} and ${fmt(st.list[st.j])}: ${st.hit ? 'overlap' : 'no overlap'}.`,
                panels: [ivp(st.list, `round ${st.round}`, 1, 9, (k) => (k === st.i || k === st.j ? (st.hit ? 'active' : 'visited') : '')), vars({ checks: st.checks, left: st.list.length })],
              },
        ),
        { say: 2, note: `A full scan found nothing. Sort → ${fmtList(BR_R.out)}.`, panels: [ivp(BR_R.out, 'result', 1, 9, () => 'done'), vars({ checks: BR_R.checks })] },
        { say: 3, note: 'Each search can scan O(n²) pairs, up to n times: O(n³).', panels: [vars({ merges: '≤ n', 'per search': 'O(n²)', total: 'O(n³)' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many merges?',
      lines: ['Each merge removes **one** interval.', 'These 5 intervals chain into one block.'],
      panels: [ivp(CHAIN, '5 intervals', 1, 10)],
      task: { type: 'number', question: 'How many merges until one interval is left?', options: [1, 4, 5, 10], answer: 4, hint: '5 intervals go in, 1 comes out.' },
      solved: 'Each merge removes one interval: 5 − 1 = 4 merges, each after a pair search.',
      then: [{ say: 0, note: 'After 4 merges: [1,10].', panels: [ivp([[1, 10]], 'result', 1, 10, ['done']), vars({ merges: CHAIN_MERGES })] }],
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Merge in O(n log n)',
      lines: [
        'Sort a copy by start: `toSorted((a, b) => a[0] - b[0])`.',
        'Start the output with the first interval.',
        '`s <= last[1]`: set `last[1] = Math.max(last[1], e)`.',
        'Otherwise push `[s, e]` as a new block.',
        'Return the output: sorted and disjoint.',
      ],
      frames: [
        { say: 0, note: 'Input, not sorted.', panels: [ivp(OP, 'input', 1, 10), arr(OP.map(fmt), { label: 'order' })] },
        { say: 0, note: 'Sorted copy by start.', panels: [ivp(OP_R.sorted, 'sorted copy', 1, 10), arr(OP_R.sorted.map(fmt), { label: 'order', highlights: hl(4, () => 'done') })] },
        ...mergeFrames(OP_R, 1, 10, (st) => (!st.prev ? 1 : st.hit ? 2 : 3)),
        { say: 4, note: `Return ${fmtList(OP_R.out)}.`, panels: mergePanels(OP_R.sorted, OP_R.steps.at(-1), 1, 10, 'sorted copy', true) },
      ],
    },
    {
      kind: 'watch',
      title: 'Insert Interval: three phases',
      lines: [
        'The list is already sorted and disjoint: no sort.',
        'Phase 1: copy every interval that **ends before** the new one starts.',
        'Phase 2: **absorb** each overlapping one: `[min(starts), max(ends)]`.',
        'Phase 3: copy the rest. **O(n)** total.',
      ],
      frames: [
        { say: 0, note: 'Insert [4,8] into a sorted, disjoint list.', panels: insPanels(INS, { role: [], s: 4, e: 8, out: [], i: -1 }, 1, 16) },
        ...insFrames(INS, INS_R, 1, 16, (st) => (st.phase === 1 ? 1 : st.phase === 3 ? 3 : 2)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: insert [5, 9]',
      lines: ['Insert `[5, 9]`.', 'Remember: `e` can grow while absorbing.'],
      panels: [ivp(INS2, 'sorted, disjoint list', 1, 12), ivp([[5, 9]], 'new', 1, 12, ['window'])],
      task: { type: 'number', question: 'How many intervals does the output have?', options: [2, 3, 4, 5], answer: 3, hint: 'Absorbing [8,10] pushes e to 10. Does [11,12] start at or before 10?' },
      solved: `${fmtList(INS2_R.out)}: [4,6] and [8,10] are absorbed, and 11 > 10 keeps [11,12] separate.`,
      then: insFrames(INS2, INS2_R, 1, 12, (st) => (st.phase === 'push' ? 1 : 0)),
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'The template, line by line',
      lines: ['Empty input → return `[]`.', 'The output starts with a **copy** of the first sorted interval.', 'From `i = 1`: `s <= last[1]` extends the block, else push.'],
      frames: [
        { say: 0, note: 'intervals.length === 0 → return [].', panels: [vars({ intervals: '[]', returns: '[]' })] },
        { say: 1, note: `Sorted: ${TP_R.sorted.map(fmt).join(' ')}. out = [[1,2]], a copy.`, panels: mergePanels(TP_R.sorted, TP_R.steps[0], 1, 4) },
        ...mergeFrames({ ...TP_R, steps: TP_R.steps.slice(1) }, 1, 4, () => 2),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: half-open',
      lines: ['Same input, but meetings are half-open.', 'The comment says: use `<` for half-open.'],
      panels: [ivp(TP_R.sorted, 'sorted by start', 1, 4)],
      task: { type: 'number', question: 'With `s < last[1]`, how many blocks come out?', options: [1, 2, 3], answer: 3, hint: '[1,2) ends where [2,3) starts: is 2 < 2?' },
      solved: 'Each pair only touches, and with `<` touching is not overlap: three blocks.',
      then: mergeFrames(TP_H, 1, 4, () => 1, true),
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'insert(), line by line',
      lines: ['`intervals[i][1] < s`: strictly before → copy.', '`intervals[i][0] <= e`: overlapping → grow `s` and `e`.', 'Push `[s, e]`, then copy the rest.'],
      frames: [
        { say: 0, note: 'Insert [2,5]: s = 2, e = 5, i = 0.', panels: insPanels(IMP, { role: [], s: 2, e: 5, out: [], i: -1 }, 1, 9) },
        ...insFrames(IMP, IMP_R, 1, 9, (st) => (st.phase === 1 ? 0 : st.phase === 2 ? 1 : 2)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: touching at the start',
      lines: ['Insert `[2, 3]` into `[[1,2],[4,6]]`.', 'Phase 1 copies while `intervals[i][1] < s`.'],
      panels: [ivp(IMP2, 'sorted, disjoint list', 1, 6), ivp([[2, 3]], 'new', 1, 6, ['window'])],
      task: {
        type: 'choose',
        question: 'What happens to [1, 2]?',
        options: [
          { text: 'Absorbed: 2 < 2 is false, and 1 <= 3', why: '' },
          { text: 'Copied in phase 1: it ends where the new one starts', why: 'Phase 1 needs 2 < 2, which is false. Closed intervals that touch overlap.' },
          { text: 'Dropped', why: 'insert never drops an interval: each one is copied or absorbed.' },
        ],
        answer: 0,
      },
      solved: `Phase 2 absorbs it: s = min(2, 1) = 1. Result ${fmtList(IMP2_R.out)}.`,
      then: insFrames(IMP2, IMP2_R, 1, 6, (st) => (st.phase === 2 ? 1 : 0)),
    },
    {
      kind: 'watch',
      title: 'Push copies',
      lines: ["If `out` holds the input's own pair, `last[1] = …` edits the input.", 'Push a copy `[s, e]` and the input stays untouched.'],
      frames: [
        { say: 0, note: 'out.push(input[0]): out[0] IS input[0].', panels: [ivp([[1, 3], [2, 5]], 'input', 1, 5), ivp([[1, 3]], 'out', 1, 5, ['active'])] },
        { say: 0, note: 'last[1] = 5 changes the input too: input[0] is now [1,5].', panels: [ivp([[1, 5], [2, 5]], 'input', 1, 5, ['bad', '']), ivp([[1, 5]], 'out', 1, 5, ['active'])] },
        { say: 1, note: 'With out.push([s, e]) only the copy grows.', panels: [ivp([[1, 3], [2, 5]], 'input', 1, 5, ['done', '']), ivp([[1, 5]], 'out', 1, 5, ['active'])] },
      ],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Sort, then the first rows',
      lines: ['Sort first: `[1,3] [2,6] [8,10] [9,12] [15,18]`.', 'Each interval: `s ≤ last end`? Extend, else push.'],
      frames: [
        { say: 0, note: 'merge([[1,3],[8,10],[2,6],[15,18],[9,12]]).', panels: [ivp(DR, 'input', 1, 18)] },
        { say: 0, note: `sorted: ${DR_LABELS.join(' ')}.`, panels: [ivp(DR_R.sorted, 'sorted by start', 1, 18)] },
        ...mergeFrames({ ...DR_R, steps: DR_R.steps.slice(0, 2) }, 1, 18, () => 1),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the next new block',
      lines: ['Output so far: `[[1,6]]`.', 'The last block ends at **6**.'],
      panels: [arr(DR_LABELS, { label: 'sorted', highlights: { 0: 'visited', 1: 'visited' } }), ivp([[1, 6]], 'merged blocks', 1, 18, ['active'])],
      task: {
        type: 'cell',
        question: 'Which interval opens the next new block?',
        answer: 2,
        hints: { 0: '[1,3] is already in [1,6].', 1: '[2,6] was merged: 2 ≤ 3.', 3: '[9,12] merges into the block that [8,10] opens.', 4: '[15,18] opens a block too, but later.' },
      },
      solved: '8 ≤ 6 is false, so [8,10] opens a block. [9,12] then stretches it to [8,12].',
      then: [
        ...mergeFrames({ ...DR_R, steps: DR_R.steps.slice(2) }, 1, 18, () => 1),
        { say: 1, note: 'One pass after the sort. Each interval is looked at exactly once.', panels: mergePanels(DR_R.sorted, DR_R.steps.at(-1), 1, 18, 'sorted by start', true) },
      ],
    },
  ],

  'intuition-greedy': [
    {
      kind: 'watch',
      title: 'Rules that fail, one that works',
      lines: ['Goal: keep the **most** intervals with no overlaps.', 'Earliest **start** first: a long early interval blocks the rest.', 'Shortest first fails too: `[1,5], [4,7], [6,10]`.', 'Earliest **end** first: keep it, drop what clashes, repeat.'],
      frames: [
        { say: 0, note: 'Three intervals. How many can we keep?', panels: [ivp(ES, 'intervals', 1, 10)] },
        { say: 1, note: 'Start-first keeps [1,10]; it blocks [2,3] and [4,5]. Kept: 1.', panels: [ivp(ES, 'earliest start', 1, 10, ES_START.map((k) => (k ? 'done' : 'bad'))), vars({ kept: 1 })] },
        { say: 3, note: 'End-first keeps [2,3], then [4,5]; [1,10] is dropped. Kept: 2.', panels: [ivp(ES, 'earliest end', 1, 10, ['muted', 'done', 'done']), vars({ kept: greedyRun(ES).count })] },
        { say: 2, note: 'Shortest-first keeps [4,7]; it blocks both others. Kept: 1.', panels: [ivp(SH, 'shortest first', 1, 10, ['bad', 'done', 'bad']), vars({ kept: SH_SHORT.length })] },
        { say: 3, note: 'End-first keeps [1,5], drops [4,7] (4 < 5), keeps [6,10]. Kept: 2.', panels: [ivp(SH, 'earliest end', 1, 10, ['done', 'muted', 'done']), vars({ kept: greedyRun(SH).count })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: run earliest end',
      lines: ['Keep the one that ends first, skip clashes, repeat.', 'Touching is fine: `s >= lastEnd` fits.'],
      panels: [ivp(G4, 'intervals', 1, 6)],
      task: { type: 'number', question: 'How many intervals does earliest-end keep?', options: [1, 2, 3, 4], answer: 2, hint: 'Keep [1,3]. Which next one starts at or after 3?' },
      solved: 'Keep [1,3], skip [2,4], keep [3,5], skip [4,6]: 2 kept.',
      then: greedyFrames(G4_R, 1, 6, { say: () => 0 }),
    },
    {
      kind: 'watch',
      title: 'The exchange argument',
      lines: ['`g` ends earliest of all. `f` ends first inside an optimal answer `OPT`.', '`end(g) <= end(f)`.', 'All others in `OPT` start at or after `end(f)`, so after `end(g)` too.', 'Swap `f` for `g`: still no overlaps, same size.'],
      frames: [
        { say: 0, note: 'OPT = {[1,5], [5,8]}; f = [1,5]. g = [2,4] ends earliest.', panels: [ivp([[1, 5], [2, 4], [5, 8]], 'f, g, rest of OPT', 1, 8, ['window', 'active', 'done']), vars({ 'end(g)': 4, 'end(f)': 5 })] },
        { say: 1, note: '4 <= 5: g ends no later than f.', panels: [ivp([[1, 5], [2, 4], [5, 8]], 'f, g, rest of OPT', 1, 8, ['window', 'active', 'done']), vars({ 'end(g)': 4, 'end(f)': 5 })] },
        { say: 2, note: '[5,8] starts at 5 ≥ end(f) = 5 ≥ end(g) = 4.', panels: [ivp([[1, 5], [2, 4], [5, 8]], 'f, g, rest of OPT', 1, 8, ['visited', 'active', 'done']), vars({ 'start(rest)': 5, 'end(g)': 4 })] },
        { say: 3, note: '{[2,4], [5,8]}: no overlap, still size 2. Some optimal answer contains g.', panels: [ivp([[1, 5], [2, 4], [5, 8]], 'after the swap', 1, 8, ['muted', 'done', 'done']), vars({ size: 2 })] },
      ],
    },
  ],

  'optimized-greedy': [
    {
      kind: 'watch',
      title: 'Minimum removals',
      lines: ['Sort by end: `(a, b) => a[1] - b[1]`.', 'Start with `lastEnd = -Infinity`, `kept = 0`.', '`s >= lastEnd`: it fits → `kept++`, `lastEnd = e`. Else skip it.', 'Answer = `n − kept`.'],
      frames: [
        { say: 0, note: `Sorted by end: ${NO_R.sorted.map(fmt).join(' ')}.`, panels: [ivp(NO_R.sorted, 'sorted by end', 1, 8), vars({ lastEnd: '-∞', kept: 0 })] },
        ...greedyFrames(NO_R, 1, 8, { say: () => 2 }),
        { say: 3, note: `kept = ${NO_R.count}, so removals = ${NO.length} − ${NO_R.count} = ${NO.length - NO_R.count}.`, panels: [ivp(NO_R.sorted, 'sorted by end', 1, 8, (k) => (NO_R.steps.at(-1).keep[k] ? 'done' : 'bad')), vars({ kept: NO_R.count, removals: NO.length - NO_R.count })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Minimum arrows',
      lines: ['Shoot at the **end** of the balloon that ends first.', 'Every balloon that starts at or before that x is burst too.', 'The first balloon with `start > arrowX` needs a new arrow.'],
      frames: BAL_R.steps.map((st) => ({
        say: st.fits ? (st.i === 0 ? 0 : 2) : 1,
        note: st.fits ? `${fmt([st.s, st.e])}: ${st.before === -Infinity ? 'no arrow yet' : `${st.s} > ${st.before}`} → arrow ${st.count} at x = ${st.e}.` : `${fmt([st.s, st.e])}: ${st.s} ≤ ${st.before} → already burst.`,
        panels: [ivp(BAL_R.sorted, 'balloons, by end', 1, 16, gState(st)), vars({ arrowX: st.lastEnd, arrows: st.count })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: all identical',
      lines: ['Three copies of `[1, 2]`.', 'Answer = `n − kept`.'],
      panels: [ivp(DUP, 'intervals', 1, 2)],
      task: { type: 'number', question: 'How many must be removed?', options: [0, 1, 2, 3], answer: 2, hint: 'After keeping one, is 1 >= lastEnd = 2?' },
      solved: 'One copy is kept; 1 >= 2 fails for the other two. Removals = 3 − 1 = 2.',
      then: greedyFrames(DUP_R, 1, 2, { say: () => 1 }),
    },
  ],

  'template-greedy': [
    {
      kind: 'watch',
      title: 'touchingOverlaps = false',
      lines: ['With `false`, an interval fits when `s >= lastEnd`.', 'Touching ends are fine: `count` is kept intervals.'],
      frames: greedyFrames(TG_F, 1, 7, { say: () => 0, word: 'count' }),
    },
    {
      kind: 'turn',
      title: 'Your turn: touchingOverlaps = true',
      lines: ['Same intervals, now `touchingOverlaps = true`.', 'An interval fits only when `s > lastEnd`.'],
      panels: [ivp(TG_T.sorted, 'sorted by end', 1, 7)],
      task: { type: 'number', question: 'What does greedyByEnd return now?', options: [1, 2, 3], answer: 2, hint: 'An arrow at 3 hits [1,3] and [3,5]. Is 5 > 3?' },
      solved: '[3,5] is hit by the arrow at 3 (3 > 3 is false); [5,7] needs a second one. count = 2.',
      then: greedyFrames(TG_T, 1, 7, { say: () => 1, word: 'count', op: '>' }),
    },
  ],

  'implementation-greedy': [
    {
      kind: 'watch',
      title: 'findMinArrowShots',
      lines: ['`points.sort((a, b) => a[1] - b[1])`: by end, in place.', '`s > arrowX`: the last arrow misses → shoot at `e`.', 'Otherwise the balloon is already burst.'],
      frames: [
        { say: 0, note: `Sorted by end: ${AR_R.sorted.map(fmt).join(' ')}.`, panels: [ivp(AR_R.sorted, 'balloons, by end', 1, 5), vars({ arrowX: '-∞', arrows: 0 })] },
        ...AR_R.steps.map((st) => ({
          say: st.fits ? 1 : 2,
          note: st.fits ? `${st.s} > ${inf(st.before)} → arrow ${st.count} at x = ${st.e}.` : `${st.s} > ${st.before} is false → burst by the arrow at ${st.before}.`,
          panels: [ivp(AR_R.sorted, 'balloons, by end', 1, 5, gState(st)), vars({ arrowX: st.lastEnd, arrows: st.count })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: "Your turn: a teammate's bug",
      lines: ['A teammate writes `if (s >= arrowX)`.', 'Balloons `[1,5]` and `[5,8]`.'],
      panels: [ivp(TOUCH2, 'balloons (closed)', 1, 8)],
      task: {
        type: 'choose',
        question: 'What does their code return, and is it right?',
        options: [
          { text: '2, which is wrong: one arrow at x = 5 bursts both', why: '' },
          { text: '1, which is right', why: '5 >= 5 is true, so their code shoots a second arrow.' },
          { text: '2, which is right: the balloons only touch', why: 'Balloons are closed: touching at x = 5 means one arrow hits both.' },
        ],
        answer: 0,
      },
      solved: 'Balloons are closed, so the test must be `s > arrowX`: 5 > 5 is false and one arrow is enough.',
      then: greedyFrames(greedyRun(TOUCH2, true), 1, 8, { say: () => 0, word: 'arrows', op: '>' }),
    },
  ],

  'dry-run-greedy': [
    {
      kind: 'watch',
      title: 'Sort by end, first rows',
      lines: ['Sort by end: `[1,2] [2,3] [1,3] [3,4]`.', 'Keep when `s ≥ lastEnd`; otherwise remove.'],
      frames: [
        { say: 0, note: 'eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]]).', panels: [ivp(DG, 'input', 1, 4)] },
        { say: 0, note: 'Sorted by end. [2,3] and [1,3] tie at 3.', panels: [ivp(DG_R.sorted, 'sorted by end', 1, 4), vars({ lastEnd: '-∞', kept: 0 })] },
        ...greedyFrames({ ...DG_R, steps: DG_R.steps.slice(0, 2) }, 1, 4, { say: () => 1 }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: [1, 3]',
      lines: ['`lastEnd = 3`, `kept = 2`.', 'Next: `[1, 3]`.'],
      panels: [ivp(DG_R.sorted, 'sorted by end', 1, 4, ['done', 'done', 'active', '']), vars({ lastEnd: 3, kept: 2 })],
      task: {
        type: 'choose',
        question: 'Keep [1, 3] or remove it?',
        options: [
          { text: 'Remove: 1 ≥ 3 is false', why: '' },
          { text: 'Keep: it ends at 3, same as lastEnd', why: 'The test looks at the start: 1 ≥ 3 is false.' },
          { text: 'Keep it and drop [2,3] instead', why: 'The greedy never revisits a kept interval; ties can go either way.' },
        ],
        answer: 0,
      },
      solved: '[1,3] is removed; [3,4] then fits (3 ≥ 3). kept = 3, removals = 4 − 3 = 1.',
      then: [
        ...greedyFrames({ ...DG_R, steps: DG_R.steps.slice(2) }, 1, 4, { say: () => 1 }),
        { say: 1, note: 'kept = 3, so removals = 4 − 3 = 1.', panels: [ivp(DG_R.sorted, 'sorted by end', 1, 4, ['done', 'done', 'bad', 'done']), vars({ kept: 3, removals: 1 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Ties go either way',
      lines: ['`[2,3]` and `[1,3]` both end at 3.', 'Swap their order: the count is still 3.'],
      frames: [
        ...greedyFrames(DG_SWAP, 1, 4, { say: () => 1, label: 'other tie order' }),
        { say: 1, note: `kept = ${DG_SWAP.count} again: removals = 1. No tie-break needed.`, panels: [ivp(DG_SWAP.sorted, 'other tie order', 1, 4, (k) => (DG_SWAP.steps.at(-1).keep[k] ? 'done' : 'bad')), vars({ kept: DG_SWAP.count })] },
      ],
    },
  ],

  'optimized-intersection': [
    {
      kind: 'watch',
      title: 'Two pointers over two lists',
      lines: ['Current pair: `lo = max(starts)`, `hi = min(ends)`.', '`lo <= hi`: they overlap → record `[lo, hi]`.', 'Advance the one that **ends first**: it cannot meet anything later.', 'One pointer moves per step: **O(n + m)**.'],
      frames: [
        { say: 0, note: 'i = 0, j = 0.', panels: xPanels(XA, XB, 0, 0, [], 1, 10) },
        ...xFrames(XA, XB, X_R, 1, 10, (st) => (st.hit ? 1 : 2)),
        { say: 3, note: `i = ${X_R.end.i}: A is used up. ${X_R.steps.length} steps for n + m = 4 intervals.`, panels: xPanels(XA, XB, X_R.end.i, X_R.end.j, X_R.out, 1, 10) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the overlaps',
      lines: ['Closed intervals: `lo <= hi` counts a single shared point.'],
      panels: xPanels(PA, PB, 0, 0, [], 1, 9),
      task: { type: 'number', question: 'How many intervals does the output have?', options: [1, 2, 3, 4], answer: 3, hint: '[1,4] and [4,6] share the point 4. Keep going.' },
      solved: `${fmtList(P_R.out)}: two single points and [7,8].`,
      then: xFrames(PA, PB, P_R, 1, 9, () => 0),
    },
  ],

  'intuition-sweep': [
    {
      kind: 'watch',
      title: 'A line sweeping the timeline',
      lines: ['A vertical line sweeps left to right.', 'At a start it **enters** an interval: `+1`.', 'At an end it **leaves** one: `−1`.', 'The biggest `active` is the answer: here **2**.'],
      frames: [
        { say: 0, note: '[1,4) [2,5) [7,9): 6 events.', panels: sweepPanels(SW, SW_R, -1, 1, 9) },
        ...sweepFrames(SW, SW_R, 1, 9, (st) => (st.d > 0 ? 1 : 2)),
        { say: 3, note: 'active went 1, 2, 1, 0, 1, 0 → max = 2.', panels: [arr(SW_R.steps.map((s) => s.active), { label: 'active after each event', highlights: hl(6, (k) => (SW_R.steps[k].active === 2 ? 'done' : '')) }), vars({ max: SW_R.best })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the busiest moment',
      lines: ['Half-open intervals.', 'Count +1 at each start, −1 at each end.'],
      panels: sweepPanels(SW2, SW2_R, -1, 1, 8),
      task: { type: 'number', question: 'What is the maximum of `active`?', options: [2, 3, 4], answer: 3, hint: 'Three starts come before the first end.' },
      solved: 'At t = 3 three intervals are open: [1,6), [2,4), [3,5).',
      then: sweepFrames(SW2, SW2_R, 1, 8, (st) => (st.d > 0 ? 1 : 0)),
    },
  ],

  'optimized-sweep': [
    {
      kind: 'watch',
      title: 'Meeting Rooms II without events',
      lines: ['Sort all starts, and separately all ends.', '`starts[i] >= ends[j]`: a meeting ended → reuse its room, `j++`.', 'Otherwise everyone is busy → open a room.', 'We only need **how many** ended, not which.'],
      frames: [
        { say: 0, note: `Meetings ${MR.map(fmt).join(' ')}.`, panels: [ivp(MR, 'meetings', 1, 9)] },
        { say: 0, note: `starts = [${MR_R.starts}], ends = [${MR_R.ends}].`, panels: [arr(MR_R.starts, { label: 'starts' }), arr(MR_R.ends, { label: 'ends' }), vars({ rooms: 0, j: 0 })] },
        ...roomFrames(MR_R, (st) => (st.reuse ? 1 : 2)),
        { say: 3, note: `rooms = ${MR_R.rooms}. Which meeting ended never mattered.`, panels: [ivp(MR, 'meetings', 1, 9, () => 'done'), vars({ rooms: MR_R.rooms })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Skyline: lazy deletion',
      lines: ['Skyline: the status is the active heights; the answer is their **max**.', "A heap can't remove any height cheaply.", 'So record "remove h" in a Map; pop h only when it reaches the top.'],
      frames: [
        { say: 0, note: 'Active heights 5, 3, 8 in a MaxHeap: max = 8.', panels: [stack([3, 5, 8], 'MaxHeap (top = max)'), vars({ pending: 'none', max: 8 })] },
        { say: 1, note: 'Height 3 ends. It is deep in the heap, not on top.', panels: [stack([3, 5, 8], 'MaxHeap (top = max)'), vars({ ends: 3, max: 8 })] },
        { say: 2, note: 'Record "remove 3" in the Map and leave it there.', panels: [stack([3, 5, 8], 'MaxHeap (top = max)'), vars({ 'pending 3': 1, max: 8 })] },
        { say: 2, note: 'Height 8 ends: record it. It is on top → pop it. max = 5.', panels: [stack([3, 5], 'MaxHeap (top = max)'), vars({ 'pending 3': 1, max: 5 })] },
        { say: 2, note: 'Height 5 ends: on top → pop. Now 3 is on top and pending → pop it too.', panels: [stack([], 'MaxHeap (top = max)'), vars({ pending: 'none', max: '—' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many rooms?',
      lines: ['Same method: sorted starts, sorted ends, pointer `j`.'],
      panels: [ivp(MR2, 'meetings', 1, 8), arr(MR2_R.starts, { label: 'starts' }), arr(MR2_R.ends, { label: 'ends' })],
      task: { type: 'number', question: 'How many rooms does minMeetingRooms return?', options: [2, 3, 4], answer: 3, hint: 'The first end is 4. How many starts come before it?' },
      solved: 'Starts 1, 2, 3 are all before the first end (4): three rooms. Start 6 reuses one.',
      then: roomFrames(MR2_R, () => 0),
    },
  ],

  'template-sweep': [
    {
      kind: 'watch',
      title: 'Events template',
      lines: ['Each interval pushes two events: `[s, +1]` and `[e, -1]`.', 'Sort by time, then by delta (`-1` first at a tie).', 'Scan: `active += delta`, `best = max(best, active)`.'],
      frames: [
        { say: 0, note: `Pushed in input order for ${TS.map(fmt).join(' ')}.`, panels: [ivp(TS, 'intervals', 1, 6), arr(TS_R.pushed.map(evLabel), { label: 'events (pushed)' })] },
        { say: 1, note: 'Sorted by time.', panels: sweepPanels(TS, TS_R, -1, 1, 6) },
        ...sweepFrames(TS, TS_R, 1, 6, () => 2),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: sort the events',
      lines: [`Intervals ${TS2.map(fmt).join(' ')}, half-open.`, 'Comparator: `a[0] - b[0] || a[1] - b[1]`.'],
      panels: [arr(TS2_R.pushed.map(evLabel), { label: 'events (pushed)' })],
      task: { type: 'order', question: 'Tap the events in sorted order.', items: TS2_ORDER, hint: 'Time first. At time 3, -1 sorts before +1.' },
      solved: `Sorted: ${TS2_ORDER.join(', ')}. Scanning gives best = ${TS2_R.best}.`,
      then: sweepFrames(TS2, TS2_R, 1, 5, () => 1),
    },
  ],

  'dry-run-sweep': [
    {
      kind: 'watch',
      title: 'minMeetingRooms, first rows',
      lines: ['`starts = [0,5,15]`, `ends = [10,20,30]`.', 'Compare `starts[i]` with `ends[j]`.'],
      frames: [
        { say: 0, note: 'minMeetingRooms([[0,30],[5,10],[15,20]]).', panels: [ivp(DS, 'meetings', 0, 30)] },
        { say: 0, note: 'starts = [0,5,15], ends = [10,20,30], rooms = 0.', panels: [arr(DS_R.starts, { label: 'starts' }), arr(DS_R.ends, { label: 'ends' }), vars({ rooms: 0, j: 0 })] },
        ...roomFrames({ ...DS_R, steps: DS_R.steps.slice(0, 2) }, () => 1),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: i = 2',
      lines: ['`starts[2] = 15`, `ends[j] = 10`.', 'rooms is **2** so far.'],
      panels: [arr(DS_R.starts, { label: 'starts', pointers: [ptr(2, 'i')], highlights: { 2: 'active' } }), arr(DS_R.ends, { label: 'ends', pointers: [ptr(0, 'j', 'b')], highlights: { 0: 'window' } }), vars({ rooms: 2, j: 0 })],
      task: { type: 'number', question: 'What is rooms after this step?', options: [1, 2, 3], answer: 2, hint: 'Is 15 ≥ 10? Then a room is reused.' },
      solved: '15 ≥ 10 → reuse (j = 1). rooms stays 2.',
      then: [
        ...roomFrames({ ...DS_R, steps: DS_R.steps.slice(2) }, () => 1),
        { say: 1, note: 'The meeting [5,10] ended before [15,20] started, so its room is reused.', panels: [ivp(DS, 'meetings', 0, 30, ['done', 'visited', 'done']), vars({ rooms: DS_R.rooms })] },
      ],
    },
  ],

  'optimized-design': [
    {
      kind: 'watch',
      title: 'book(), call by call',
      lines: ['Keep bookings sorted and disjoint, as `[start, end)`.', 'Binary-search `i`: the first booking starting at or after `s`.', 'Only `list[i]` (successor) and `list[i − 1]` (predecessor) can clash.', 'No clash → `splice` it in at `i` to stay sorted.'],
      frames: BOOKS.flatMap((b) => [
        {
          say: 1,
          note: `book(${b.s}, ${b.e}): i = ${b.i}${b.i < b.before.length ? `, successor ${fmt(b.before[b.i])}` : ', no successor'}.`,
          panels: [listCells(b.before, b.i), ivp([...b.before, [b.s, b.e]], 'bookings + request', 1, 40, (k) => (k === b.before.length ? 'window' : ''))],
        },
        b.ok
          ? {
              say: 3,
              note: `No clash${b.before.length ? ` (${b.i < b.before.length ? `${b.before[b.i][0]} ≥ ${b.e}` : 'no successor'}${b.i > 0 ? `, ${b.before[b.i - 1][1]} ≤ ${b.s}` : ''})` : ''} → insert at ${b.i}. true.`,
              panels: [listCells(b.after, b.i, { [b.i]: 'done' }), ivp(b.after, 'bookings', 1, 40, (k) => (k === b.i ? 'done' : ''))],
            }
          : {
              say: 2,
              note: `Successor starts at ${b.before[b.i][0]} < ${b.e} → clash. false.`,
              panels: [listCells(b.before, b.i, { [b.i]: 'bad' }), ivp([...b.before, [b.s, b.e]], 'bookings + request', 1, 40, (k) => (k === b.i ? 'bad' : k === b.before.length ? 'bad' : ''))],
            },
      ]),
    },
    {
      kind: 'turn',
      title: 'Your turn: find i',
      lines: ['Request: `book(10, 12)`.', '`i` = the first booking that starts at or after 10.'],
      panels: [arr([...CAL.map(fmt), '·'], { label: 'bookings (sorted)' }), ivp([...CAL, [10, 12]], 'bookings + request', 1, 20, (k) => (k === 4 ? 'window' : ''))],
      task: {
        type: 'cell',
        question: 'Which index does lowerBound return?',
        answer: 2,
        hints: { 0: '[2,4) starts at 2, before 10.', 1: '[6,9) starts at 6, before 10.', 3: '[18,20) starts after 10, but [12,15) comes first.', 4: 'The end slot is used only when every booking starts before s.' },
      },
      solved: 'i = 2: [12,15) is the successor and [6,9) the predecessor.',
      then: [
        { say: 1, note: 'Successor [12,15): 12 < 12? No. Predecessor [6,9): 9 > 10? No.', panels: [listCells(CAL, 2, { 1: 'visited', 2: 'visited' }), ivp([...CAL, [10, 12]], 'bookings + request', 1, 20, (k) => (k === 4 ? 'window' : k === 1 || k === 2 ? 'visited' : ''))] },
        { say: 1, note: 'No clash → splice at 2. book returns true.', panels: [listCells(CAL_AFTER, 2, { 2: 'done' }), ivp(CAL_AFTER, 'bookings', 1, 20, (k) => (k === 2 ? 'done' : ''))] },
      ],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Mistake 5: advancing both pointers',
      lines: ['After a match, moving **both** pointers loses overlaps.', 'The longer interval may still overlap the next one.'],
      frames: [
        ...M_BOTH.steps.map((st) => ({ say: 0, note: `Wrong: ${xNote(MA, MB, st)}`, panels: xPanels(MA, MB, st.i, st.j, st.out, 1, 9) })),
        { say: 0, note: `Wrong: j is past the end → stop with ${fmtList(M_BOTH.out)}.`, panels: xPanels(MA, MB, M_BOTH.end.i, M_BOTH.end.j, M_BOTH.out, 1, 9) },
        ...M_RIGHT.steps.map((st) => ({ say: 1, note: `Right: ${xNote(MA, MB, st)}`, panels: xPanels(MA, MB, st.i, st.j, st.out, 1, 9) })),
        { say: 1, note: `Right: ${fmtList(M_RIGHT.out)}. [2,7] still met [6,9].`, panels: xPanels(MA, MB, M_RIGHT.end.i, M_RIGHT.end.j, M_RIGHT.out, 1, 9) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the merge bug',
      lines: ['`merge([[1,4],[2,3]])` returns `[[1,3]]`.'],
      panels: [ivp([[1, 4], [2, 3]], 'input', 1, 4), ivp([[1, 3]], 'buggy output', 1, 4, ['bad'])],
      task: {
        type: 'choose',
        question: 'Which mistake is it?',
        options: [
          { text: '`last[1] = e` instead of `Math.max(last[1], e)`', why: '' },
          { text: 'Default `sort()` with no comparator', why: 'The input is already in order by start; the order is not what broke.' },
          { text: '`<` instead of `<=`', why: '2 < 4 and 2 <= 4 are both true; the pair merges either way.' },
          { text: 'Advancing both pointers', why: 'Merge walks one list; there is no pointer pair.' },
        ],
        answer: 0,
      },
      solved: 'The end became 3 instead of max(4, 3) = 4: the contained interval shrank the block.',
      then: [{ say: 0, note: 'With Math.max: [[1,4]].', panels: [ivp([[1, 4], [2, 3]], 'input', 1, 4), ivp(mergeRun([[1, 4], [2, 3]]).out, 'correct output', 1, 4, ['done'])] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the selection bug',
      lines: ['Keep the most non-overlapping intervals.', 'The code returns **1**.'],
      panels: [ivp(SEL, 'intervals', 1, 9, startFirst(SEL).map((k) => (k ? 'done' : 'bad')))],
      task: {
        type: 'choose',
        question: 'Which mistake is it?',
        options: [
          { text: 'Sorting by start for a selection problem', why: '' },
          { text: 'Wrong endpoint convention', why: 'No two intervals here only touch, so `<` vs `<=` changes nothing.' },
          { text: '`last[1] = e` instead of Math.max', why: 'That is a merge bug; this code chooses intervals.' },
          { text: 'Sweep ties', why: 'There are no events and no ties here.' },
        ],
        answer: 0,
      },
      solved: `By start, [1,9] is kept first and blocks the rest. By end: ${greedyRun(SEL).count} kept.`,
      then: greedyFrames(greedyRun(SEL), 1, 9, { say: () => 0 }),
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Edge cases, out loud',
      lines: ['Test the edge cases before you say "done".', 'Empty list, single interval, all identical.', 'One interval containing all others, touching ends, negatives.'],
      frames: EDGES.map((c, k) => {
        const [lo, hi] = bounds(c.list);
        return {
          say: k < 3 ? 1 : 2,
          note: `${c.name}: merge(${fmtList(c.list)}) → ${fmtList(c.out)}${c.name === 'touching' ? ' (closed: touching merges)' : ''}.`,
          panels: [ivp(c.list, `input: ${c.name}`, lo, hi), ivp(c.out, 'merged', lo, hi, () => 'done')],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: the first question',
      lines: ['You are asked to merge meetings.', 'One input has `[1,2]` and `[2,3]`.'],
      panels: [ivp([[1, 2], [2, 3]], 'two meetings', 1, 3)],
      task: {
        type: 'choose',
        question: 'What should you ask before coding?',
        options: [
          { text: 'Closed or half-open: do [1,2] and [2,3] overlap?', why: '' },
          { text: 'Should I use a MinHeap?', why: 'Merging needs a sort and one pass; the endpoint rule decides `<` vs `<=`.' },
          { text: 'Nothing: they clearly overlap', why: 'Closed they overlap, half-open they do not. Guessing is the top source of wrong answers.' },
        ],
        answer: 0,
      },
      solved: 'Closed → [1,3]. Half-open → two meetings. Asking shows care and prevents the commonest bug.',
      then: [
        { say: 1, note: 'Closed (`<=`): one block [1,3].', panels: [ivp(mergeRun([[1, 2], [2, 3]]).out, 'closed', 1, 3, ['done'])] },
        { say: 1, note: 'Half-open (`<`): two blocks.', panels: [ivp(mergeRun([[1, 2], [2, 3]], true).out, 'half-open', 1, 3, () => 'done')] },
      ],
    },
  ],
};
