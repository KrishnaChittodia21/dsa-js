// Step lessons for Greedy (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every coin, pick, reach, tank, boat, cut, heap pop, candy count and jump below comes from running the lesson's own
// rules on the example input (the run* helpers mirror the lesson's code line for line); check() throws on drift.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const heapP = (values, label) => ({ kind: 'queue', values, label });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = ([s, e]) => `[${s},${e}]`;
const inf = (x) => (x === -Infinity ? '-∞' : x);
const ivp = (pairs, label, min, max, st = () => '') =>
  ({ kind: 'intervals', label, min, max, items: pairs.map(([start, end], k) => ({ start, end, state: (typeof st === 'function' ? st(k) : st[k]) || '' })) });
const check = (ok, msg) => {
  if (!ok) throw new Error(`greedy steps: ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ---------- coins: biggest coin that still fits ----------
function coinRun(coins, amount) {
  const desc = coins.toSorted((a, b) => b - a);
  const picks = [];
  let rem = amount;
  while (rem > 0) {
    const c = desc.find((x) => x <= rem);
    picks.push({ c, before: rem, rem: rem - c });
    rem -= c;
  }
  return { desc, picks };
}
function minCoins(coins, amount) {
  const dp = [0, ...Array(amount).fill(Infinity)];
  for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  return dp[amount];
}
const coinPanels = (desc, rem, pick, picked, label = 'coins') => [
  arr(desc, { label, highlights: hl(desc.length, (k) => (desc[k] === pick ? 'active' : desc[k] > rem ? 'bad' : '')), ...(pick ? { pointers: [ptr(desc.indexOf(pick), 'take')] } : {}) }),
  arr(picked, { label: 'picked' }),
  vars({ left: rem, coins: picked.length }),
];
const coinFrames = (run, say, startPicked = []) =>
  run.picks.map((p, k) => {
    const picked = [...startPicked, ...run.picks.slice(0, k + 1).map((x) => x.c)];
    const skipped = run.desc.filter((x) => x > p.before);
    return {
      say: say(k),
      note: `${p.before} left${skipped.length ? `: ${skipped.join(', ')} too big` : ''} → take ${p.c}, ${p.rem} left.`,
      panels: coinPanels(run.desc, p.before, p.c, picked),
    };
  });

// ---------- assign cookies: sort both, least greedy child gets the smallest cookie that works ----------
function cookieRun(greed, cookies) {
  const g = greed.toSorted((a, b) => a - b);
  const c = cookies.toSorted((a, b) => a - b);
  let i = 0;
  const steps = [];
  for (let j = 0; j < c.length && i < g.length; j++) {
    const ok = c[j] >= g[i];
    steps.push({ i, j, ok });
    if (ok) i++;
  }
  return { g, c, steps, happy: i };
}

// ---------- intervals by earliest end (pattern template) ----------
function endRun(list) {
  const sorted = list.toSorted((a, b) => a[1] - b[1]);
  let lastEnd = -Infinity,
    count = 0;
  const keep = [];
  const steps = sorted.map(([s, e], i) => {
    const before = lastEnd;
    const fits = s >= lastEnd;
    if (fits) {
      count++;
      lastEnd = e;
    }
    keep.push(fits);
    return { i, s, e, before, fits, count, lastEnd, keep: [...keep] };
  });
  return { sorted, steps, count, kept: sorted.filter((_, k) => keep[k]) };
}
const startRun = (list) => {
  let lastEnd = -Infinity;
  const sorted = list.toSorted((a, b) => a[0] - b[0]);
  const keep = sorted.map(([s, e]) => (s >= lastEnd ? ((lastEnd = e), true) : false));
  return { sorted, keep, count: keep.filter(Boolean).length };
};
const gState = (st) => (k) => (k > st.i ? '' : k === st.i ? (st.fits ? 'active' : 'bad') : st.keep[k] ? 'done' : 'muted');

// ---------- jump game ----------
function bruteJump(nums) {
  const calls = [];
  const go = (i) => {
    calls.push(i);
    if (i >= nums.length - 1) return true;
    for (let step = 1; step <= nums[i]; step++) if (go(i + step)) return true;
    return false;
  };
  return { ok: go(0), calls };
}
function reachRun(nums) {
  let reach = 0;
  const steps = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return { steps, ok: false, gap: i, reach };
    const before = reach;
    reach = Math.max(reach, i + nums[i]);
    steps.push({ i, before, reach });
  }
  return { steps, ok: true, reach };
}
function jumpRun(nums, toLast = false) {
  let jumps = 0,
    curEnd = 0,
    farthest = 0;
  const steps = [];
  for (let i = 0; i < nums.length - (toLast ? 0 : 1); i++) {
    farthest = Math.max(farthest, i + nums[i]);
    const endBefore = curEnd;
    const hit = i === curEnd;
    if (hit) {
      jumps++;
      curEnd = farthest;
    }
    steps.push({ i, farthest, endBefore, hit, curEnd, jumps });
  }
  return { steps, jumps };
}
const jumpPanels = (nums, st, label = 'nums') => [
  arr(nums, {
    label,
    pointers: [ptr(st.i, 'i')],
    highlights: hl(nums.length, (k) => (k === st.i ? 'active' : k < st.i ? 'visited' : '')),
  }),
  vars({ farthest: st.farthest, curEnd: st.curEnd, jumps: st.jumps }),
];
const jumpNote = (nums, st) =>
  `i = ${st.i}: farthest = max(…, ${st.i} + ${nums[st.i]}) = ${st.farthest}. ` +
  (st.hit ? `i === curEnd (${st.endBefore}) → jump, jumps = ${st.jumps}, curEnd = ${st.curEnd}.` : `i < curEnd (${st.endBefore}) → keep scanning.`);
const jumpFrames = (nums, run, say) => run.steps.map((st) => ({ say: say(st), note: jumpNote(nums, st), panels: jumpPanels(nums, st) }));

// ---------- gas station: running tank, reset start on a negative ----------
function gasRun(gas, cost) {
  let tank = 0,
    start = 0,
    total = 0;
  const steps = gas.map((g, i) => {
    const d = g - cost[i];
    tank += d;
    total += d;
    const neg = tank < 0;
    const tankSeen = tank;
    if (neg) {
      start = i + 1;
      tank = 0;
    }
    return { i, d, tankSeen, neg, start, tank, total };
  });
  return { steps, start: total >= 0 ? start : -1, total };
}
const circuitOk = (gas, cost, s) => {
  let t = 0;
  for (let k = 0; k < gas.length; k++) {
    const i = (s + k) % gas.length;
    t += gas[i] - cost[i];
    if (t < 0) return false;
  }
  return true;
};
const gasPanels = (diffs, st, start) => [
  arr(diffs, { label: 'gas − cost', pointers: [ptr(st.i, 'i'), ...(start <= st.i ? [ptr(start, 'start', 'b')] : [])], highlights: hl(diffs.length, (k) => (k === st.i ? (st.neg ? 'bad' : 'active') : k < start ? 'muted' : k < st.i ? 'visited' : '')) }),
  vars({ start: st.start, tank: st.tank, total: st.total }),
];
const gasFrames = (diffs, run, say) => {
  let start = 0;
  return run.steps.map((st) => {
    const f = {
      say: say(st),
      note: `i = ${st.i}: tank ${st.d >= 0 ? '+' : ''}${st.d} → ${st.tankSeen}.` + (st.neg ? ` Negative → no start up to ${st.i} works; start = ${st.start}, tank = 0.` : ''),
      panels: gasPanels(diffs, st, start),
    };
    start = st.start;
    return f;
  });
};

// ---------- patching array: coverage [1, miss) ----------
function patchRun(nums, n) {
  let miss = 1,
    i = 0,
    added = 0;
  const steps = [];
  while (miss <= n) {
    const before = miss;
    if (i < nums.length && nums[i] <= miss) {
      miss += nums[i];
      steps.push({ use: nums[i], i, before, miss, added });
      i++;
    } else {
      added++;
      miss += miss;
      steps.push({ patch: before, i, before, miss, added });
    }
  }
  return { steps, added };
}

// ---------- boats: sort, pair lightest with heaviest ----------
function boatRun(people, limit) {
  const p = people.toSorted((a, b) => a - b);
  let l = 0,
    r = p.length - 1,
    boats = 0;
  const steps = [];
  while (l <= r) {
    const pair = l < r && p[l] + p[r] <= limit;
    boats++;
    steps.push({ l, r, pair, boats });
    if (pair) l++;
    r--;
  }
  return { p, steps, boats };
}
const boatFrames = (run, limit, say) => {
  const seat = [];
  return run.steps.map((st) => {
    seat[st.r] = 'done';
    if (st.pair) seat[st.l] = 'done';
    const alone = st.l === st.r ? `${run.p[st.r]} is the last one` : `${run.p[st.l]} + ${run.p[st.r]} = ${run.p[st.l] + run.p[st.r]} > ${limit}`;
    return {
      say: say(st),
      note: st.pair ? `${run.p[st.l]} + ${run.p[st.r]} = ${run.p[st.l] + run.p[st.r]} ≤ ${limit} → share a boat. boats = ${st.boats}.` : `${alone} → ${run.p[st.r]} goes alone. boats = ${st.boats}.`,
      panels: [
        arr(run.p, { label: `weights (limit ${limit})`, pointers: st.l === st.r ? [ptr(st.l, 'l=r')] : [ptr(st.l, 'l'), ptr(st.r, 'r', 'b')], highlights: hl(run.p.length, (k) => (k === st.l || k === st.r ? 'active' : seat[k] ? 'muted' : '')) }),
        vars({ boats: st.boats }),
      ],
    };
  });
};

// ---------- max units: the pattern's sortAndPick ----------
function unitsRun(items, capacity) {
  const sorted = items.toSorted((a, b) => b.value - a.value);
  let total = 0;
  const steps = [];
  for (const item of sorted) {
    if (capacity === 0) break;
    const take = Math.min(item.count, capacity);
    total += take * item.value;
    capacity -= take;
    steps.push({ item, take, total, capacity });
  }
  return { sorted, steps, total };
}

// ---------- queue reconstruction: height desc, k asc, insert at k ----------
const qKey = (p) => `${p[0]},${p[1]}`;
function queueRun(people) {
  const sorted = people.toSorted((a, b) => b[0] - a[0] || a[1] - b[1]);
  const out = [];
  const steps = sorted.map((p) => {
    out.splice(p[1], 0, p);
    return { p, at: p[1], out: out.map(qKey) };
  });
  return { sorted, steps, out };
}
const queueValid = (q) => q.every(([h, k], i) => q.slice(0, i).filter(([h2]) => h2 >= h).length === k);

// ---------- hand of straights ----------
function straightsRun(hand, size) {
  const count = new Map();
  for (const c of hand) count.set(c, (count.get(c) || 0) + 1);
  const groups = [];
  for (const c of hand.toSorted((a, b) => a - b)) {
    if (!count.get(c)) continue;
    const g = [];
    for (let v = c; v < c + size; v++) {
      if (!count.get(v)) return { ok: false, groups, stuck: { start: c, need: v } };
      count.set(v, count.get(v) - 1);
      g.push(v);
    }
    groups.push(g);
  }
  return { ok: true, groups };
}

// ---------- partition labels (the lesson's code) ----------
function partRun(s) {
  const last = new Map();
  for (let i = 0; i < s.length; i++) last.set(s[i], i);
  const sizes = [];
  let start = 0,
    end = 0;
  const steps = [];
  for (let i = 0; i < s.length; i++) {
    end = Math.max(end, last.get(s[i]));
    const cut = i === end;
    const st = { i, ch: s[i], last: last.get(s[i]), start, end, cut };
    if (cut) {
      sizes.push(end - start + 1);
      start = i + 1;
    }
    steps.push({ ...st, sizes: [...sizes] });
  }
  return { last, steps, sizes };
}
const letterSpans = (s) => [...new Set(s)].map((c) => [s.indexOf(c), s.lastIndexOf(c)]);
const partFrames = (s, run, say) =>
  run.steps.map((st) => ({
    say: say(st),
    note: `i = ${st.i} ('${st.ch}', last at ${st.last}): end = ${st.end}.` + (st.cut ? ` i === end → cut, part size ${st.end - st.start + 1}.` : ''),
    panels: [
      arr([...s], {
        label: 's',
        pointers: [ptr(st.i, 'i'), ...(st.end !== st.i ? [ptr(st.end, 'end', 'b')] : [])],
        range: [st.start, st.end],
        highlights: hl(s.length, (k) => (k < st.start ? 'done' : k === st.i ? (st.cut ? 'done' : 'active') : '')),
      }),
      vars({ start: st.start, end: st.end, sizes: st.sizes.length ? st.sizes.join(',') : '—' }),
    ],
  }));

// ---------- refuelling: max-heap of passed stations (the lesson's code) ----------
function refuelRun(target, startFuel, stations, pick = 'max') {
  const heap = [];
  let fuel = startFuel,
    stops = 0,
    i = 0;
  const steps = [];
  while (fuel < target) {
    const pushed = [];
    while (i < stations.length && stations[i][0] <= fuel) {
      heap.push(stations[i][1]);
      pushed.push(stations[i][1]);
      i++;
    }
    if (!heap.length) {
      steps.push({ stuck: true, fuel, stops, i, heap: [] });
      return { steps, stops: -1 };
    }
    const sortedHeap = heap.toSorted((a, b) => (pick === 'max' ? b - a : a - b));
    const got = sortedHeap[0];
    heap.splice(heap.indexOf(got), 1);
    const before = fuel;
    fuel += got;
    stops++;
    steps.push({ pushed, heapBefore: sortedHeap, got, before, fuel, stops, i });
  }
  return { steps, stops };
}
const stLabel = (s) => `${s[0]}:${s[1]}`;
const refuelPanels = (stations, i, heapVals, v, hName = 'max-heap (passed)') => [
  arr(stations.map(stLabel), { label: 'station pos:fuel', highlights: hl(stations.length, (k) => (k < i ? 'visited' : '')) }),
  heapP(heapVals, hName),
  vars(v),
];
function refuelFrames(target, startFuel, stations, run, say, pick = 'max') {
  const frames = [];
  let fuel = startFuel;
  const hName = pick === 'max' ? 'max-heap (passed)' : 'min-heap (passed)';
  for (const st of run.steps) {
    if (st.stuck) {
      frames.push({ say: say('stuck'), note: `fuel ${st.fuel} < ${target}, nothing passed → heap empty → return -1.`, panels: refuelPanels(stations, st.i, [], { fuel: st.fuel, stops: st.stops }, hName) });
      continue;
    }
    frames.push({
      say: say('push'),
      note: `fuel ${st.before} < ${target}. Stations at ≤ ${st.before} go in the heap${st.pushed.length ? `: ${st.pushed.join(', ')}` : ' (none new)'}.`,
      panels: refuelPanels(stations, st.i, st.heapBefore, { fuel: st.before, stops: st.stops - 1 }, hName),
    });
    frames.push({
      say: say('pop'),
      note: `Pop ${st.got}: we "stopped" there. fuel = ${st.before} + ${st.got} = ${st.fuel}, stops = ${st.stops}.`,
      panels: refuelPanels(stations, st.i, st.heapBefore.slice(1), { fuel: st.fuel, stops: st.stops }, hName),
    });
    fuel = st.fuel;
  }
  return { frames, fuel };
}

// ---------- course schedule III ----------
function courseRun(courses) {
  const sorted = courses.toSorted((a, b) => a[1] - b[1]);
  const heap = [];
  let time = 0;
  const steps = sorted.map(([d, last], k) => {
    heap.push(d);
    time += d;
    const over = time > last;
    const timeSeen = time;
    let dropped = null;
    if (over) {
      dropped = Math.max(...heap);
      heap.splice(heap.indexOf(dropped), 1);
      time -= dropped;
    }
    return { k, d, last, timeSeen, over, dropped, time, heap: heap.toSorted((a, b) => b - a) };
  });
  return { sorted, steps, count: heap.length };
}

// ---------- candy two passes (the pattern's twoPass) ----------
function candyRun(ratings, both = true) {
  const n = ratings.length;
  const give = new Array(n).fill(1);
  const left = [];
  for (let i = 1; i < n; i++) {
    const up = ratings[i] > ratings[i - 1];
    if (up) give[i] = give[i - 1] + 1;
    left.push({ i, up, give: [...give] });
  }
  const right = [];
  if (both)
    for (let i = n - 2; i >= 0; i--) {
      const up = ratings[i] > ratings[i + 1];
      if (up) give[i] = Math.max(give[i], give[i + 1] + 1);
      right.push({ i, up, give: [...give] });
    }
  return { left, right, give, total: sum(give) };
}
const candyOk = (r, g) => r.every((x, i) => (i === 0 || !(x > r[i - 1]) || g[i] > g[i - 1]) && (i === r.length - 1 || !(x > r[i + 1]) || g[i] > g[i + 1]));

// ---------- valid parenthesis string: [lo, hi] ----------
function parenRun(s) {
  let lo = 0,
    hi = 0;
  const steps = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') {
      lo++;
      hi++;
    } else if (c === ')') {
      lo--;
      hi--;
    } else {
      lo--;
      hi++;
    }
    if (hi < 0) {
      steps.push({ i, c, lo, hi, dead: true });
      return { steps, ok: false };
    }
    const raw = lo;
    lo = Math.max(lo, 0);
    steps.push({ i, c, raw, lo, hi });
  }
  return { steps, ok: lo === 0, lo };
}

// ================= section data =================

// what
const W60 = coinRun([25, 10, 5, 1], 60);
check(same(W60.picks.map((p) => p.c), [25, 25, 10]) && minCoins([25, 10, 5, 1], 60) === 3, 'what 60');
const W40 = coinRun([25, 10, 5, 1], 40);
check(same(W40.picks.map((p) => p.c), [25, 10, 5]) && W40.picks[1].before === 15, 'what 40');

// why
const Y6 = coinRun([1, 3, 4], 6);
check(same(Y6.picks.map((p) => p.c), [4, 1, 1]) && minCoins([1, 3, 4], 6) === 2, 'why 6');
const Y10 = coinRun([1, 3, 4], 10);
check(same(Y10.picks.map((p) => p.c), [4, 4, 1, 1]) && minCoins([1, 3, 4], 10) === 3 && 4 + 3 + 3 === 10, 'why 10');

// when
const CK = cookieRun([1, 2], [2, 3]);
check(CK.happy === 2 && CK.steps[0].ok && CK.c[0] === 2, 'cookie swap');
const CK2 = cookieRun([1, 2, 4], [1, 3, 2]);
check(CK2.happy === 2, 'cookie turn');

// intuition
const MEET = [[1, 4], [2, 3], [3, 6], [5, 7], [6, 9], [8, 10]];
const MEET_R = endRun(MEET);
const OTHER = [[1, 4], [5, 7], [8, 10]];
check(OTHER.every((x, k) => k === 0 || x[0] >= OTHER[k - 1][1]), 'other schedule valid');
check(same(MEET_R.kept, [[2, 3], [3, 6], [6, 9]]) && MEET_R.kept.every((g, k) => g[1] <= OTHER[k][1]), 'stays ahead');
const SEL = [[1, 9], [2, 3], [4, 5], [6, 7]];
const SEL_E = endRun(SEL);
const SEL_S = startRun(SEL);
check(SEL_E.count === 3 && SEL_S.count === 1, 'start vs end');

// brute force
const BF = [2, 2, 1, 0, 4];
const BF_R = bruteJump(BF);
check(!BF_R.ok && same(BF_R.calls, [0, 1, 2, 3, 3, 2, 3]), 'brute calls');
const BF2 = [3, 1, 1, 0, 5];
const BF2_R = bruteJump(BF2);
const BF2_AT3 = BF2_R.calls.filter((x) => x === 3).length;
check(!BF2_R.ok && BF2_AT3 === 3 && BF2_R.calls.length === 7, 'brute turn');
const callCounts = (nums, calls) => nums.map((_, k) => calls.filter((x) => x === k).length);

// optimized
const RJ = [3, 2, 1, 0, 4];
const RJ_R = reachRun(RJ);
check(!RJ_R.ok && RJ_R.gap === 4 && RJ_R.reach === 3, 'reach false');
const RJ2 = [1, 1, 0, 2, 1];
const RJ2_R = reachRun(RJ2);
check(!RJ2_R.ok && RJ2_R.gap === 3, 'reach turn');
const GAS = [1, 2, 3, 4, 5];
const COST = [3, 4, 5, 1, 2];
const G_D = GAS.map((g, i) => g - COST[i]);
const G_R = gasRun(GAS, COST);
check(G_R.start === 3 && circuitOk(GAS, COST, 3) && [0, 1, 2, 4].every((s) => !circuitOk(GAS, COST, s)), 'gas');
const GAS2 = [3, 4, 1, 5, 1];
const COST2 = [2, 2, 5, 2, 2];
const G2_D = GAS2.map((g, i) => g - COST2[i]);
const G2_R = gasRun(GAS2, COST2);
const G2_FIRST = G2_R.steps.findIndex((s) => s.neg);
check(G2_FIRST === 2 && G2_R.start === 3 && circuitOk(GAS2, COST2, 3) && G2_R.total === 1, 'gas turn');
const PA = [1, 5, 10];
const PA_R = patchRun(PA, 20);
check(PA_R.added === 2 && same(PA_R.steps.filter((s) => s.patch).map((s) => s.patch), [2, 4]) && PA_R.steps.at(-1).miss === 23, 'patching');

// optimized-sort
const BO = [1, 2, 2, 3, 4];
const BO_R = boatRun(BO, 5);
check(BO_R.boats === 3, 'boats');
const BO2 = [2, 4, 1, 3, 5, 3];
const BO2_R = boatRun(BO2, 6);
check(BO2_R.boats === 3 && BO2_R.steps.every((s) => s.pair), 'boats turn');
const BOX = [{ count: 1, value: 3 }, { count: 2, value: 2 }, { count: 3, value: 1 }];
const BOX_R = unitsRun([BOX[2], BOX[0], BOX[1]], 4);
check(BOX_R.total === 8 && same(BOX_R.steps.map((s) => s.take), [1, 2, 1]), 'units');
const QR = [[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]];
const QR_R = queueRun(QR);
check(queueValid(QR_R.out) && same(QR_R.out.map(qKey), ['5,0', '7,0', '5,2', '6,1', '4,4', '7,1']), 'queue');
const HS = [1, 2, 2, 3, 4, 5];
const HS_R = straightsRun(HS, 3);
check(!HS_R.ok && same(HS_R.groups, [[1, 2, 3]]) && HS_R.stuck.start === 2 && HS_R.stuck.need === 3, 'straights');

// optimized-interval
const PS = 'abacdcef';
const PS_R = partRun(PS);
check(same(PS_R.sizes, [3, 3, 1, 1]), 'partition');
const PS2 = 'abcbadee';
const PS2_R = partRun(PS2);
check(same(PS2_R.sizes, [5, 1, 2]) && PS2_R.steps.find((s) => s.cut).i === 4, 'partition turn');

// optimized-heap
const RF = [[10, 60], [20, 30], [30, 30], [60, 40]];
const RF_R = refuelRun(100, 10, RF);
check(RF_R.stops === 2 && same(RF_R.steps.map((s) => s.got), [60, 40]), 'refuel');
const RF2 = [[10, 10], [20, 20], [30, 5], [40, 30]];
const RF2_R = refuelRun(50, 20, RF2);
check(RF2_R.stops === 2 && same(RF2_R.steps.map((s) => s.got), [20, 30]), 'refuel turn');
const CS = [[5, 5], [4, 6], [2, 6]];
const CS_R = courseRun(CS);
check(CS_R.count === 2 && CS_R.steps[1].dropped === 5 && CS_R.steps[2].time === 6, 'course');

// optimized-local
const CA = [1, 0, 2];
const CA_R = candyRun(CA);
check(same(CA_R.give, [2, 1, 2]) && CA_R.total === 5 && candyOk(CA, CA_R.give), 'candy');
const CA2 = [1, 2, 3, 2, 1];
const CA2_R = candyRun(CA2);
const CA2_LEFT = CA2_R.left.at(-1).give;
check(same(CA2_LEFT, [1, 2, 3, 1, 1]) && same(CA2_R.give, [1, 2, 3, 2, 1]) && CA2_R.total === 9, 'candy turn');
const PR = '(*))';
const PR_R = parenRun(PR);
check(PR_R.ok, 'paren');
const PR2 = ')*(';
const PR2_R = parenRun(PR2);
check(!PR2_R.ok && PR2_R.steps.length === 1 && PR2_R.steps[0].dead, 'paren turn');

// template
const TJ = [2, 1, 1, 1, 1];
const TJ_R = jumpRun(TJ);
check(TJ_R.jumps === 3, 'template jump');
const TJ2 = [3, 1, 1, 1, 1];
const TJ2_R = jumpRun(TJ2);
check(TJ2_R.jumps === 2, 'template turn');

// implementation
const IM_R = refuelRun(100, 1, [[10, 100]]);
check(IM_R.stops === -1, 'refuel -1');
const LEX = [10, 9, 1];
const LEX_S = [...LEX].sort();
check(same(LEX_S, [1, 10, 9]) && same(LEX.toSorted((a, b) => a - b), [1, 9, 10]), 'lex sort');
const PEOPLE = [[5, 0], [7, 0], [5, 2], [6, 1], [7, 1]];
const PEOPLE_S = PEOPLE.toSorted((a, b) => b[0] - a[0] || a[1] - b[1]).map(qKey);
check(same(PEOPLE_S, ['7,0', '7,1', '6,1', '5,0', '5,2']), 'two-key');
const LEX2 = [5, 25, 100].sort();
check(same(LEX2, [100, 25, 5]), 'lex turn');

// dry run (the lesson's table)
const DR = [2, 3, 1, 1, 4];
const DR_R = jumpRun(DR);
check(
  same(
    DR_R.steps.map((s) => [s.i, DR[s.i], s.farthest, s.endBefore, s.hit, s.jumps]),
    [[0, 2, 2, 0, true, 1], [1, 3, 4, 2, false, 1], [2, 1, 4, 2, true, 2], [3, 1, 4, 4, false, 2]],
  ) && DR_R.jumps === 2,
  'dry run table',
);
const DR_BAD = jumpRun(DR, true);
check(DR_BAD.jumps === 3 && DR_BAD.steps[4].hit, 'dry run off-by-one');

// mistakes
const MH_MAX = refuelRun(110, 10, RF);
const MH_MIN = refuelRun(110, 10, RF, 'min');
check(MH_MAX.stops === 2 && MH_MIN.stops === 3, 'heap direction');
const MC = [3, 2, 1];
const MC_ONE = candyRun(MC, false);
const MC_TWO = candyRun(MC);
check(same(MC_ONE.give, [1, 1, 1]) && !candyOk(MC, MC_ONE.give) && same(MC_TWO.give, [3, 2, 1]) && MC_TWO.total === 6, 'one pass');
const MS = [[1, 100], [2, 3], [4, 5]];
const MS_S = startRun(MS);
const MS_E = endRun(MS);
check(MS_S.count === 1 && MS_E.count === 2, 'mistake meetings');

// interview tips
const IT = [[1, 9], [2, 3], [4, 5]];
check(startRun(IT).count === 1 && endRun(IT).count === 2, 'tips counter-example');

// ================= frames =================

const whatTurnThen = coinFrames({ desc: W40.desc, picks: W40.picks.slice(1) }, () => 1, [25]);

const yGreedy = coinFrames(Y6, (k) => (k === 0 ? 0 : 1));

const meetFrames = MEET_R.steps.map((st) => ({
  say: 1,
  note: `${fmt([st.s, st.e])}: ${st.before === -Infinity ? 'nothing kept yet → keep' : `${st.s} ≥ ${st.before}? ${st.fits ? 'yes → keep' : 'no → skip'}`}.`,
  panels: [ivp(MEET_R.sorted, 'sorted by end', 1, 10, gState(st)), vars({ lastEnd: inf(st.lastEnd), kept: st.count })],
}));

const bruteFrames = BF_R.calls.map((i, k) => {
  const counts = callCounts(BF, BF_R.calls.slice(0, k + 1));
  return {
    say: k === 0 ? 0 : 1,
    note: `Call ${k + 1}: canJump(i = ${i}).` + (BF[i] === 0 ? ' nums[3] = 0: no jump → false.' : '') + (counts[i] > 1 ? ` Index ${i} explored again (${counts[i]}×).` : ''),
    panels: [
      arr(BF, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(BF.length, (x) => (x === i ? (counts[i] > 1 ? 'bad' : 'active') : '')) }),
      arr(counts, { label: 'calls per index', highlights: hl(BF.length, (x) => (counts[x] > 1 ? 'bad' : counts[x] ? 'visited' : '')) }),
    ],
  };
});

const reachPanels = (nums, i, reach, state) => [
  arr(nums, { label: 'nums', pointers: [ptr(i, 'i')], range: [0, Math.min(reach, nums.length - 1)], highlights: hl(nums.length, (k) => (k === i ? state : '')) }),
  vars({ i, reach }),
];
const reachFrames = (nums, run, say) => [
  ...run.steps.map((st) => ({
    say: say(st),
    note: `i = ${st.i} ≤ reach ${st.before} → reach = max(${st.before}, ${st.i} + ${nums[st.i]}) = ${st.reach}.`,
    panels: reachPanels(nums, st.i, st.reach, 'active'),
  })),
  ...(run.ok
    ? []
    : [{ say: 1, note: `i = ${run.gap} > reach ${run.reach}: a gap. Return false.`, panels: reachPanels(nums, run.gap, run.reach, 'bad') }]),
];

const patchFrames = PA_R.steps.map((st) => ({
  say: st.patch ? 3 : 2,
  note: st.patch
    ? `Next number ${PA[st.i] ?? '—'} > miss ${st.before}: patch ${st.patch}. Coverage [1, ${st.miss}). Patches: ${st.added}.`
    : `${st.use} ≤ miss ${st.before}: use it. Coverage [1, ${st.miss}).`,
  panels: [
    arr(PA, { label: 'nums', ...(st.i < PA.length ? { pointers: [ptr(st.i, 'next')] } : {}), highlights: hl(PA.length, (k) => (k < st.i || (st.use !== undefined && k === st.i) ? 'done' : '')) }),
    vars({ miss: st.miss, patches: st.added }),
  ],
}));

const truckPanels = (k) =>
  table(
    BOX_R.sorted.map((b) => `${b.value} units`),
    ['boxes', 'take'],
    BOX_R.sorted.map((b, r) => [b.count, r <= k ? BOX_R.steps[r].take : '—']),
    BOX_R.sorted.map((_, r) => [r === k ? 'active' : '', r === k ? 'active' : r < k ? 'done' : '']),
  );

const queueFrames = QR_R.steps.map((st, k) => ({
  say: 1,
  note: `Insert ${qKey(st.p)} at index ${st.at}. Taller people are already placed.`,
  panels: [
    arr(QR_R.sorted.map(qKey), { label: 'sorted: h desc, k asc', highlights: hl(QR.length, (x) => (x === k ? 'active' : x < k ? 'done' : '')) }),
    arr(st.out, { label: 'queue', pointers: [ptr(st.at, 'k')], highlights: { [st.at]: 'active' } }),
  ],
}));

const refuelW = refuelFrames(100, 10, RF, RF_R, (w) => (w === 'push' ? 1 : 2));
const refuelT = refuelFrames(50, 20, RF2, RF2_R, (w) => (w === 'push' ? 0 : 1));
const courseFrames = CS_R.steps.map((st) => ({
  say: st.over ? 2 : 1,
  note: `Take [${st.d}, ${st.last}]: time = ${st.timeSeen}.` + (st.over ? ` ${st.timeSeen} > ${st.last} → drop longest (${st.dropped}), time = ${st.time}.` : ` ≤ ${st.last}, fine.`),
  panels: [
    arr(CS_R.sorted.map(([d, l]) => `${d}/${l}`), { label: 'duration/lastDay, by lastDay', pointers: [ptr(st.k, 'now')], highlights: hl(CS.length, (x) => (x === st.k ? (st.over ? 'bad' : 'active') : x < st.k ? 'visited' : '')) }),
    heapP(st.heap, 'max-heap (taken)'),
    vars({ time: st.time, taken: st.heap.length }),
  ],
}));

const candyFrames = (ratings, run, say) => [
  { say: say('init'), note: 'Everyone starts with 1 candy.', panels: [arr(ratings, { label: 'ratings' }), arr(new Array(ratings.length).fill(1), { label: 'candies' })] },
  ...run.left.map((st) => ({
    say: say('left'),
    note: `Left pass i = ${st.i}: ${ratings[st.i]} > ${ratings[st.i - 1]}? ${st.up ? `yes → ${st.give[st.i - 1]} + 1 = ${st.give[st.i]}` : 'no → stays'}.`,
    panels: [arr(ratings, { label: 'ratings', pointers: [ptr(st.i, 'i'), ptr(st.i - 1, 'left', 'b')] }), arr(st.give, { label: 'candies', highlights: { [st.i]: st.up ? 'done' : 'active' } })],
  })),
  ...run.right.map((st) => ({
    say: say('right'),
    note: `Right pass i = ${st.i}: ${ratings[st.i]} > ${ratings[st.i + 1]}? ${st.up ? `yes → max(…, ${st.give[st.i + 1]} + 1) = ${st.give[st.i]}` : 'no → stays'}.`,
    panels: [arr(ratings, { label: 'ratings', pointers: [ptr(st.i, 'i'), ptr(st.i + 1, 'right', 'b')] }), arr(st.give, { label: 'candies', highlights: { [st.i]: st.up ? 'done' : 'active' } })],
  })),
];

const parenFrames = PR_R.steps.map((st) => ({
  say: st.c === '*' ? 2 : st.raw < 0 ? 3 : 1,
  note: `'${st.c}': ` + (st.raw < 0 ? `lo would be ${st.raw} → clamp to 0, hi = ${st.hi}.` : `lo = ${st.lo}, hi = ${st.hi}.`),
  panels: [arr([...PR], { label: 's', pointers: [ptr(st.i, 'i')], highlights: hl(PR.length, (k) => (k === st.i ? 'active' : k < st.i ? 'visited' : '')) }), vars({ lo: st.lo, hi: st.hi })],
}));

const drRow = (st) => [st.i, DR[st.i], st.farthest, st.endBefore, st.hit ? 'jump' : '—', st.jumps];
const drTable = (upTo) =>
  table(
    DR_R.steps.slice(0, upTo + 1).map((s) => `i=${s.i}`),
    ['far', 'end', 'jumps'],
    DR_R.steps.slice(0, upTo + 1).map((s) => [s.farthest, s.endBefore, s.jumps]),
    DR_R.steps.slice(0, upTo + 1).map((s, r) => (r === upTo ? ['active', 'active', s.hit ? 'done' : 'active'] : ['', '', ''])),
  );
const drFrame = (k, sHit = 2, sNo = 1) => {
  const st = DR_R.steps[k];
  const row = drRow(st);
  return {
    say: st.hit ? sHit : sNo,
    note: `i = ${row[0]}, nums[i] = ${row[1]}: farthest = ${row[2]}. curEnd was ${row[3]}. ` + (st.hit ? `i === curEnd → jump, curEnd = ${st.curEnd}. jumps = ${row[5]}.` : `No jump. jumps = ${row[5]}.`),
    panels: [jumpPanels(DR, st)[0], drTable(k)],
  };
};

const mhFrames = (run, pick) => refuelFrames(110, 10, RF, run, (w) => (w === 'push' ? 0 : 1), pick).frames;

// ================= steps =================

export default {
  what: [
    {
      kind: 'watch',
      title: 'The greedy cashier',
      lines: [
        'Pay **60** cents with the fewest coins from {25, 10, 5, 1}.',
        'At every step, take the **biggest coin that still fits**.',
        'No looking ahead, no putting a coin back.',
        '25, 25, 10 → **3** coins. Here that **happens to be** optimal.',
      ],
      frames: [
        { say: 0, note: '60 cents to pay, nothing picked yet.', panels: coinPanels(W60.desc, 60, null, []) },
        ...coinFrames(W60, (k) => (k === 0 ? 1 : 2)),
        { say: 3, note: 'Done: 3 coins. Correct here, but only because this coin set is kind.', panels: [arr(W60.desc, { label: 'coins' }), arr(W60.picks.map((p) => p.c), { label: 'picked', highlights: hl(3, () => 'done') }), vars({ left: 0, coins: 3 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: next coin',
      lines: ['Now pay **40** cents the same way.', 'Greedy took 25 first. **15** cents are left.'],
      panels: [arr(W40.desc, { label: 'coins' }), arr([25], { label: 'picked' }), vars({ left: 15, coins: 1 })],
      task: {
        type: 'cell',
        question: 'Which coin does greedy grab next?',
        answer: 1,
        hints: { 0: '25 > 15: it does not fit.', 2: '5 fits, but 10 is bigger and still fits.', 3: '1 fits, but greedy takes the biggest coin that fits.' },
      },
      solved: '**10**: the biggest coin ≤ 15. Then 5 finishes it: 25, 10, 5.',
      then: whatTurnThen,
    },
    {
      kind: 'turn',
      title: 'Your turn: name the rule',
      lines: [
        '**Greedy choice**: the rule that picks the next piece.',
        '**Greedy-choice property**: some optimal solution contains that choice.',
        '**Exchange argument**: a proof that swaps the greedy choice in.',
      ],
      panels: [arr(W60.desc, { label: 'coins', highlights: { 0: 'active' }, pointers: [ptr(0, 'take')] }), vars({ left: 60 })],
      task: {
        type: 'choose',
        question: '"Take the biggest coin that still fits" is which formal term?',
        options: [
          { text: 'The greedy choice', why: '' },
          { text: 'An exchange argument', why: 'An exchange argument is a proof. This is the rule itself.' },
          { text: 'Optimal substructure', why: 'That is about what remains after a choice: a smaller copy of the same problem.' },
          { text: 'The greedy-choice property', why: 'That property says some optimal solution contains the choice. It is not the rule.' },
        ],
        answer: 0,
      },
      solved: 'It is the **greedy choice**: the rule for the next piece. Whether it is safe is a separate question.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'One path instead of all',
      lines: ['Brute force tries every candidate: 2ⁿ subsets, n! orderings.', 'A correct greedy rule follows **one path**: O(n) or O(n log n).'],
      frames: [
        {
          say: 0,
          note: 'Brute force vs greedy, from the lesson.',
          panels: [table(['meetings', 'reach end', 'refuel'], ['brute', 'greedy'], [['2ⁿ', 'n log n'], ['all jumps', 'n'], ['2ⁿ', 'n log n']], [['bad', 'done'], ['bad', 'done'], ['bad', 'done']])],
        },
        { say: 1, note: 'With 10 meetings: 2¹⁰ = 1024 subsets for brute force; greedy sweeps the 10 once after sorting.', panels: [vars({ n: 10, subsets: 2 ** 10, sweep: 10 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Confidently wrong',
      lines: ['Coins `[1, 3, 4]`, amount **6**. Greedy grabs the biggest coin that fits.', 'Taking 4 leaves 2, and 2 costs two 1-coins.', 'Greedy: 4 + 1 + 1 = **3** coins.', 'But 3 + 3 = **2** coins. This needs DP.'],
      frames: [
        ...yGreedy,
        { say: 2, note: 'Greedy finished with 3 coins.', panels: [arr(Y6.desc, { label: 'coins' }), arr([4, 1, 1], { label: 'greedy', highlights: hl(3, () => 'bad') }), vars({ left: 0, coins: 3 })] },
        { say: 3, note: 'Skipping 4 allows 3 + 3: only 2 coins.', panels: [arr([4, 1, 1], { label: 'greedy', highlights: hl(3, () => 'bad') }), arr([3, 3], { label: 'best', highlights: hl(2, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: amount 10',
      lines: ['Same coins `[1, 3, 4]`, now amount **10**.', 'Greedy keeps taking the biggest coin that fits.'],
      panels: [arr(Y10.desc, { label: 'coins' }), vars({ left: 10 })],
      task: { type: 'number', question: 'How many coins does greedy use for 10?', options: [2, 3, 4, 5], answer: Y10.picks.length, hint: '4 fits twice (8). What is left, and which coins fit it?' },
      solved: 'Greedy: 4 + 4 + 1 + 1 = **4** coins. But 4 + 3 + 3 = 10 uses only 3.',
      then: [
        ...coinFrames(Y10, () => 0),
        { say: 1, note: 'Greedy used 4 coins. 4 + 3 + 3 also makes 10 with 3: greedy lost again.', panels: [arr([4, 4, 1, 1], { label: 'greedy', highlights: hl(4, () => 'bad') }), arr([4, 3, 3], { label: 'better', highlights: hl(3, () => 'done') })] },
      ],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Exchange argument: assign cookies',
      lines: [
        'A child is happy if cookie ≥ greed. Sort both sides.',
        'Greedy: the **least greedy** child gets the **smallest cookie that satisfies** them.',
        'Suppose an optimal answer gives that child a bigger cookie B instead.',
        'Swap S and B: both children stay happy. Count unchanged.',
      ],
      frames: [
        { say: 0, note: 'Greed [1, 2], cookies [2, 3], both sorted.', panels: [arr(CK.g, { label: 'greed' }), arr(CK.c, { label: 'cookies' })] },
        { say: 1, note: 'Child with greed 1 gets cookie 2 (S): the smallest that works.', panels: [arr(CK.g, { label: 'greed', highlights: { 0: 'active' } }), arr(CK.c, { label: 'cookies', highlights: { 0: 'active' }, pointers: [ptr(0, 'S')] })] },
        {
          say: 2,
          note: 'Another optimal answer: child 1 gets B = 3, child 2 gets S = 2. 2 happy.',
          panels: [table(['greed 1', 'greed 2'], ['cookie', 'happy'], [[3, 'yes'], [2, 'yes']], [['window', 'done'], ['window', 'done']]), arr(CK.c, { label: 'cookies', pointers: [ptr(0, 'S'), ptr(1, 'B', 'b')] })],
        },
        {
          say: 3,
          note: 'Swap: child 1 gets S (2 ≥ 1), child 2 gets B (3 ≥ 2). Still 2 happy, and it holds the greedy choice.',
          panels: [table(['greed 1', 'greed 2'], ['cookie', 'happy'], [[2, 'yes'], [3, 'yes']], [['active', 'done'], ['active', 'done']]), arr(CK.c, { label: 'cookies', pointers: [ptr(0, 'S'), ptr(1, 'B', 'b')] })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: run the cookie greedy',
      lines: ['Greed `[1, 2, 4]`, cookies `[1, 3, 2]`.', 'Sort both; give each child the smallest cookie that works.'],
      panels: [arr(CK2.g, { label: 'greed (sorted)' }), arr(CK2.c, { label: 'cookies (sorted)' })],
      task: { type: 'number', question: 'How many children end up happy?', options: [1, 2, 3], answer: CK2.happy, hint: 'Cookie 1 → greed 1, cookie 2 → greed 2. Is cookie 3 enough for greed 4?' },
      solved: '**2** happy. Cookie 3 < 4, so the greediest child gets nothing.',
      then: CK2.steps.map((st) => ({
        say: 1,
        note: `Cookie ${CK2.c[st.j]} vs greed ${CK2.g[st.i]}: ${st.ok ? 'fits → happy' : 'too small → next cookie'}.`,
        panels: [
          arr(CK2.g, { label: 'greed', pointers: [ptr(st.i, 'child')], highlights: hl(3, (k) => (k < st.i || (k === st.i && st.ok) ? 'done' : '')) }),
          arr(CK2.c, { label: 'cookies', pointers: [ptr(st.j, 'cookie', 'b')], highlights: { [st.j]: st.ok ? 'done' : 'bad' } }),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: which proof?',
      lines: [
        '**Exchange**: swap the greedy choice into any optimal solution.',
        '**Stays ahead**: after every step, greedy is at least as good.',
        '**Invariant**: one fact summarises all past choices, and each step keeps it.',
      ],
      panels: [arr([2, 3, 1, 1, 4], { label: 'nums', range: [0, 4] }), vars({ reach: 4 })],
      task: {
        type: 'choose',
        question: '"Every index ≤ reach is reachable", kept true at every step. Which kind of argument is that?',
        options: [
          { text: 'An invariant', why: '' },
          { text: 'An exchange argument', why: 'Nothing is swapped into an optimal solution here.' },
          { text: 'Greedy stays ahead', why: 'Stays ahead compares greedy with another solution step by step. This is a single fact kept true.' },
          { text: 'A counter-example', why: 'A counter-example shows a greedy is wrong. This shows one is right.' },
        ],
        answer: 0,
      },
      solved: 'An **invariant**: one fact summarising all past choices, preserved by every step.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clues for and against',
      lines: ['These clues say: **think greedy**.', 'These say greedy is **not enough**: think DP.', 'Then hunt for a counter-example before committing.'],
      frames: [
        { say: 0, note: 'Greedy signs from the lesson.', panels: [arr(['max/min #', 'reorder', 'start/end', 'can reach'], { label: 'greedy signs', showIndices: false, highlights: hl(4, () => 'done') }), arr(['circular', 'deadlines', 'neighbours'], { label: 'more greedy signs', showIndices: false, highlights: hl(3, () => 'done') })] },
        { say: 1, note: 'Signs that greedy is not enough.', panels: [arr(['count ways', '0/1 wt+val', 'counter-ex', 'far future'], { label: 'not enough', showIndices: false, highlights: hl(4, () => 'bad') })] },
        { say: 2, note: 'Even with good signs, try a small counter-example first (like coins [1, 3, 4]).', panels: [arr([1, 3, 4], { label: 'coins' }), vars({ amount: 6, greedy: 3, best: 2 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the DP sign',
      lines: ['Greedy finds **one** answer.', 'It never counts all of them.'],
      panels: [arr(['circular', 'neighbours', 'count ways', 'start/end'], { label: 'phrases in a problem', showIndices: false })],
      task: {
        type: 'cell',
        question: 'Which phrase says greedy is NOT enough?',
        answer: 2,
        hints: { 0: 'A circular route with gains and costs is a greedy sign (gas station).', 1: 'Neighbour constraints are a greedy sign (candy).', 3: 'Intervals with start and end are a greedy sign.' },
      },
      solved: '"Count the number of ways" needs DP: greedy finds one answer, it never counts them.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Order, rule, proof',
      lines: [
        'Every greedy has **an order**, **a choice rule** and **a proof**.',
        'Order: meetings by **end**. Rule: keep one if it fits after the last kept.',
        '"Stays ahead": greedy\'s k-th meeting ends **no later** than any other schedule\'s k-th.',
        'So greedy never runs out of meetings first.',
      ],
      frames: [
        { say: 0, note: 'Six meetings. The order is the design: sort by end.', panels: [ivp(MEET, 'meetings', 1, 10)] },
        ...meetFrames,
        {
          say: 2,
          note: 'Compare with another valid schedule: [1,4], [5,7], [8,10]. Greedy ends 3, 6, 9; it ends 4, 7, 10.',
          panels: [
            ivp(MEET_R.kept, 'greedy g', 1, 10, () => 'done'),
            ivp(OTHER, 'other o', 1, 10, () => 'visited'),
            table(['k=1', 'k=2', 'k=3'], ['g end', 'o end'], MEET_R.kept.map((g, k) => [g[1], OTHER[k][1]]), [['done', ''], ['done', ''], ['done', '']]),
          ],
        },
        { say: 3, note: 'Each greedy end ≤ the other\'s end, so whatever fits next for o also fits for greedy.', panels: [ivp(MEET_R.kept, 'greedy g', 1, 10, () => 'done'), ivp(OTHER, 'other o', 1, 10, () => 'visited')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: sort by end',
      lines: ['Meetings `[1,9] [2,3] [4,5] [6,7]`.', 'Sort by **end**, keep each one that fits.'],
      panels: [ivp(SEL, 'meetings', 1, 9)],
      task: { type: 'number', question: 'How many meetings does sort-by-end keep?', options: [1, 2, 3, 4], answer: SEL_E.count, hint: '[2,3] ends first, then [4,5], then [6,7]. Where does [1,9] land?' },
      solved: '**3**: [2,3], [4,5], [6,7]. Sorting by start would grab [1,9] first and keep only 1.',
      then: [
        ...SEL_E.steps.map((st) => ({
          say: 1,
          note: `${fmt([st.s, st.e])}: ${st.before === -Infinity ? 'first → keep' : `${st.s} ≥ ${st.before}? ${st.fits ? 'yes → keep' : 'no → skip'}`}. kept = ${st.count}.`,
          panels: [ivp(SEL_E.sorted, 'sorted by end', 1, 9, gState(st))],
        })),
        { say: 0, note: 'Sorted by start instead: [1,9] blocks the rest → 1 meeting.', panels: [ivp(SEL_S.sorted, 'sorted by start', 1, 9, SEL_S.keep.map((k) => (k ? 'done' : 'bad')))] },
      ],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Brute force re-explores',
      lines: ['`canJump(nums, i)` tries every jump length from i, recursively.', 'The same index is explored again from different paths.', 'Memoising gives O(n²); greedy gives O(n).'],
      frames: [
        ...bruteFrames,
        { say: 2, note: `${BF_R.calls.length} calls for 5 indexes, and the answer is false. Index 3 alone was explored 3 times.`, panels: [arr(BF, { label: 'nums', highlights: { 3: 'bad' } }), arr(callCounts(BF, BF_R.calls), { label: 'calls per index', highlights: { 2: 'bad', 3: 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the repeats',
      lines: ['nums = `[3, 1, 1, 0, 5]`. From 0 you may jump 1, 2 or 3.', 'Every path dead-ends at index 3 (nums[3] = 0).'],
      panels: [arr(BF2, { label: 'nums', highlights: { 3: 'bad' } })],
      task: { type: 'number', question: 'How many times is canJump called with i = 3?', options: [1, 2, 3, 4], answer: BF2_AT3, hint: 'Paths 0→1→2→3, 0→2→3 and 0→3 all land there.' },
      solved: '**3** times, all doing the same work. Greedy visits each index once.',
      then: [{ say: 1, note: `Calls in order: ${BF2_R.calls.join(', ')}. Index 3 appears 3 times.`, panels: [arr(BF2, { label: 'nums' }), arr(callCounts(BF2, BF2_R.calls), { label: 'calls per index', highlights: { 3: 'bad' } })] }],
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Jump Game: one reach',
      lines: ['Keep `reach`: every index ≤ reach is reachable.', 'If `i > reach`, you are stuck in a gap → false.', 'Else `reach = max(reach, i + nums[i])`.'],
      frames: [{ say: 0, note: 'Start: reach = 0, only index 0 is reachable.', panels: reachPanels(RJ, 0, 0, '') }, ...reachFrames(RJ, RJ_R, () => 2)],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the gap',
      lines: ['nums = `[1, 1, 0, 2, 1]`.', 'Sweep i, growing reach. The first `i > reach` is the gap.'],
      panels: [arr(RJ2, { label: 'nums' })],
      task: {
        type: 'cell',
        question: 'At which index does the sweep hit a gap?',
        answer: RJ2_R.gap,
        hints: { 0: 'Index 0 is always reachable.', 1: 'reach is 1 after index 0.', 2: 'reach is 2 after index 1.', 4: 'The sweep stops earlier.' },
      },
      solved: 'Index **3**: reach got stuck at 2 because nums[2] = 0.',
      then: reachFrames(RJ2, RJ2_R, () => 1),
    },
    {
      kind: 'watch',
      title: 'Gas station: reset on empty',
      lines: ['Start at 0 with an empty tank: `tank += gas[i] − cost[i]`.', 'Tank negative at i → no start up to i works. Start = i + 1, tank = 0.', 'If total gas ≥ total cost, the final start works.'],
      frames: [
        { say: 0, note: `gas [${GAS}], cost [${COST}]. Track gas − cost.`, panels: [arr(GAS, { label: 'gas' }), arr(COST, { label: 'cost' }), arr(G_D, { label: 'gas − cost' })] },
        ...gasFrames(G_D, G_R, (st) => (st.neg ? 1 : 0)),
        { say: 2, note: `total = ${G_R.total} ≥ 0 → start ${G_R.start} works.`, panels: [arr(G_D, { label: 'gas − cost', pointers: [ptr(G_R.start, 'start', 'b')], highlights: hl(5, (k) => (k >= G_R.start ? 'done' : 'muted')) }), vars({ start: G_R.start, total: G_R.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it run dry?',
      lines: ['Start at station 0 with an empty tank.', 'Add each `gas − cost` to the tank.'],
      panels: [arr(G2_D, { label: 'gas − cost' }), arr(GAS2, { label: 'gas' }), arr(COST2, { label: 'cost' })],
      task: {
        type: 'cell',
        question: 'At which station does the tank first go negative?',
        panel: 0,
        answer: G2_FIRST,
        hints: { 0: 'Tank 1 after station 0.', 1: 'Tank 1 + 2 = 3.', 3: 'It already went negative earlier.', 4: 'It already went negative earlier.' },
      },
      solved: 'Station **2**: 3 − 4 = −1. Start jumps to 3; total 1 ≥ 0, so 3 is the answer.',
      then: [
        ...gasFrames(G2_D, G2_R, (st) => (st.neg ? 1 : 0)),
        { say: 1, note: `total = ${G2_R.total} ≥ 0 → start ${G2_R.start} completes the circuit.`, panels: [arr(G2_D, { label: 'gas − cost', pointers: [ptr(G2_R.start, 'start', 'b')], highlights: hl(5, (k) => (k >= G2_R.start ? 'done' : 'muted')) }), vars({ start: G2_R.start, total: G2_R.total })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Patching array: coverage',
      lines: ['Invariant: every sum in `[1, miss)` can be built.', 'Example: nums `[1, 5, 10]`, cover every value up to 20.', 'Next x ≤ miss → use it: coverage `[1, miss + x)`.', 'Else patch with `miss` itself: coverage doubles to `[1, 2·miss)`.'],
      frames: [
        { say: 0, note: 'miss = 1: nothing can be built yet.', panels: [arr(PA, { label: 'nums', pointers: [ptr(0, 'next')] }), vars({ miss: 1, patches: 0 })] },
        ...patchFrames,
        { say: 1, note: `miss = 23 > 20: every value up to 20 is covered with ${PA_R.added} patches (2 and 4).`, panels: [arr(PA, { label: 'nums', highlights: hl(3, () => 'done') }), vars({ miss: 23, patches: PA_R.added })] },
      ],
    },
  ],

  'optimized-sort': [
    {
      kind: 'watch',
      title: 'Boats: sort, then two pointers',
      lines: ['Sort the people; pair the **smallest options that work**.', 'At most two per boat, weight limit 5.', 'Lightest + heaviest fit → they share. Else the heaviest goes alone.'],
      frames: [{ say: 0, note: `Sorted weights [${BO_R.p}], limit 5.`, panels: [arr(BO_R.p, { label: 'weights (limit 5)', pointers: [ptr(0, 'l'), ptr(4, 'r', 'b')] }), vars({ boats: 0 })] }, ...boatFrames(BO_R, 5, () => 2)],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the boats',
      lines: ['Weights `[2, 4, 1, 3, 5, 3]`, limit **6**.', 'Sort; lightest + heaviest share if they fit.'],
      panels: [arr(BO2_R.p, { label: 'sorted (limit 6)', pointers: [ptr(0, 'l'), ptr(5, 'r', 'b')] })],
      task: { type: 'number', question: 'How many boats?', options: [2, 3, 4, 6], answer: BO2_R.boats, hint: '1 + 5, 2 + 4, 3 + 3: does each pair fit 6?' },
      solved: '**3** boats: 1+5, 2+4, 3+3, every pair exactly 6.',
      then: boatFrames(BO2_R, 6, () => 1),
    },
    {
      kind: 'watch',
      title: 'Max units on a truck',
      lines: ['Every slot on the truck is the same, so fill it with the **most valuable** box.', 'Sort box types by units per box, descending.', 'Take as many as fit, then move on.'],
      frames: [
        { say: 0, note: 'Truck holds 4 boxes. Types: 1 box of 3 units, 2 of 2, 3 of 1.', panels: [table(BOX.map((b) => `${b.value} units`), ['boxes', 'take'], BOX.map((b) => [b.count, '—'])), vars({ space: 4, total: 0 })] },
        ...BOX_R.steps.map((st, k) => ({
          say: k === 0 ? 1 : 2,
          note: `Take min(${st.item.count}, ${st.capacity + st.take}) = ${st.take} of the ${st.item.value}-unit boxes. total = ${st.total}.`,
          panels: [truckPanels(k), vars({ space: st.capacity, total: st.total })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: queue reconstruction order',
      lines: ['People `[h, k]`: k = people in front with height ≥ h.', 'Sort by height **descending**, ties by k **ascending**.', 'Then insert each person at index k.'],
      panels: [arr(QR.map(qKey), { label: 'people h,k' })],
      task: { type: 'order', question: 'Tap the people in the order they are inserted.', items: QR_R.sorted.map(qKey), hint: 'Tallest first: both 7s (k = 0 before k = 1), then 6, then the 5s, then 4.' },
      solved: 'Tallest first, so later (shorter) people never change a taller person\'s k.',
      then: [
        ...queueFrames,
        { say: 2, note: 'Final queue. Each person has exactly k people of height ≥ theirs in front.', panels: [arr(QR_R.out.map(qKey), { label: 'queue', highlights: hl(6, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: hand of straights',
      lines: ['Groups of 3 consecutive cards.', 'The **smallest remaining** card must **start** a group.', 'Hand `[1, 2, 2, 3, 4, 5]`: the first group is 1, 2, 3.'],
      panels: [arr(HS, { label: 'hand', highlights: { 0: 'done', 1: 'done', 3: 'done' } }), arr([2, 4, 5], { label: 'left after 1,2,3' })],
      task: {
        type: 'choose',
        question: 'Cards 2, 4, 5 are left. What happens next?',
        options: [
          { text: '2 must start a group, needs 3, none left → false', why: '' },
          { text: '4 starts a group 4, 5, 6', why: 'The smallest remaining card is 2, and it cannot sit in the middle of a group.' },
          { text: 'Go back and regroup 1, 2, 3 differently', why: 'The smallest card always starts a group, so there is no other choice to go back to.' },
          { text: '2, 4, 5 is a valid group', why: 'Groups need consecutive values: 2, 3, 4.' },
        ],
        answer: 0,
      },
      solved: 'The smallest card **must** start a group. 2 needs a 3, there is none → the hand fails.',
    },
  ],

  'optimized-interval': [
    {
      kind: 'watch',
      title: 'Partition labels: cut at end',
      lines: [
        'Each letter occupies `[first, last]`. A part must hold its whole interval.',
        'Sweep i, keeping `end = max(last of s[i])`.',
        'When `i === end`, nothing extends further → **cut**.',
      ],
      frames: [
        { say: 0, note: `"${PS}": each letter as [first, last].`, panels: [arr([...PS], { label: 's' }), ivp(letterSpans(PS), 'a b c d e f', 0, 7)] },
        ...partFrames(PS, PS_R, (st) => (st.cut ? 2 : 1)),
        { say: 2, note: `Parts: ${PS_R.sizes.join(', ')}. Cutting as early as possible leaves room for more parts.`, panels: [arr([...PS], { label: 's', highlights: hl(8, () => 'done') }), vars({ sizes: PS_R.sizes.join(',') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: first cut',
      lines: [`s = "${PS2}".`, 'Cut where `i === end` for the first time.'],
      panels: [arr([...PS2], { label: 's' }), ivp(letterSpans(PS2), 'a b c d e', 0, 7)],
      task: {
        type: 'cell',
        question: 'Where is the first cut?',
        answer: 4,
        hints: { 0: "'a' appears again at 4, so end is 4.", 1: 'end is already 4 from the first a.', 2: 'end is still 4.', 3: 'end is still 4.' },
      },
      solved: 'At index **4**: the first part is "abcba". Then "d", then "ee": sizes 5, 1, 2.',
      then: partFrames(PS2, PS2_R, (st) => (st.cut ? 1 : 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: cut early?',
      lines: [`In "${PS}", at i = 1 the end is still 2.`, 'A cut needs `i === end`.'],
      panels: partFrames(PS, PS_R, () => 0)[1].panels,
      task: {
        type: 'choose',
        question: 'Could we cut right after index 1?',
        options: [
          { text: "No: 'a' appears again at 2, so it would be in two parts", why: '' },
          { text: 'Yes: smaller parts mean more parts', why: "Only if every letter stays in one part. 'a' sits at 0 and at 2." },
          { text: "Yes: 'b' never appears again", why: "'b' is fine, but 'a' (last at 2) still holds end at 2." },
        ],
        answer: 0,
      },
      solved: "end = 2 because of 'a'. The part must run to 2 before it can be cut.",
    },
  ],

  'optimized-heap': [
    {
      kind: 'watch',
      title: 'Refuelling: stop in hindsight',
      lines: [
        'Drive as far as the fuel allows.',
        'Every station passed goes into a **max-heap**.',
        'Stuck? Pop the biggest: "retroactively" stop there.',
      ],
      frames: [
        { say: 0, note: 'target 100, start fuel 10. Stations as position:fuel.', panels: refuelPanels(RF, 0, [], { fuel: 10, stops: 0 }) },
        ...refuelW.frames,
        { say: 0, note: `fuel ${refuelW.fuel} ≥ 100: done with ${RF_R.stops} stops.`, panels: refuelPanels(RF, 4, [30, 30], { fuel: refuelW.fuel, stops: RF_R.stops }) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many stops?',
      lines: ['target **50**, start fuel **20**.', 'Stations pos:fuel `10:10, 20:20, 30:5, 40:30`.'],
      panels: refuelPanels(RF2, 0, [], { fuel: 20, stops: 0 }),
      task: { type: 'number', question: 'Minimum refuelling stops?', options: [1, 2, 3, -1], answer: RF2_R.stops, hint: 'With 20 fuel you pass 10:10 and 20:20. Pop the biggest, then see what else you pass.' },
      solved: '**2**: pop 20 (fuel 40), pass 30:5 and 40:30, pop 30 (fuel 70).',
      then: refuelT.frames,
    },
    {
      kind: 'watch',
      title: 'Course schedule III: drop the longest',
      lines: [
        'Courses `[duration, lastDay]`, sorted by lastDay.',
        'Take each one: push its duration, add it to `time`.',
        'If `time > lastDay`, drop the **longest** taken so far.',
      ],
      frames: [
        { say: 0, note: 'Courses [5,5], [4,6], [2,6], sorted by lastDay.', panels: [arr(CS_R.sorted.map(([d, l]) => `${d}/${l}`), { label: 'duration/lastDay, by lastDay' }), heapP([], 'max-heap (taken)'), vars({ time: 0, taken: 0 })] },
        ...courseFrames,
        { say: 2, note: 'Dropping 5 for 4 kept the count but freed time, so [2,6] still fit. 2 courses.', panels: [heapP(CS_R.steps.at(-1).heap, 'max-heap (taken)'), vars({ time: 6, taken: 2 })] },
      ],
    },
  ],

  'optimized-local': [
    {
      kind: 'watch',
      title: 'Candy: two passes',
      lines: ['Everyone gets at least 1.', 'Left→right: more than the **left** neighbour if rated higher.', 'Right→left: more than the **right** neighbour, using `max` so the first rule survives.'],
      frames: [
        ...candyFrames(CA, CA_R, (w) => (w === 'init' ? 0 : w === 'left' ? 1 : 2)),
        { say: 2, note: `Done: [${CA_R.give}], total ${CA_R.total}.`, panels: [arr(CA, { label: 'ratings' }), arr(CA_R.give, { label: 'candies', highlights: hl(3, () => 'done') }), vars({ total: CA_R.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who breaks the rule?',
      lines: ['Ratings `[1, 2, 3, 2, 1]`. The left pass gave `[1, 2, 3, 1, 1]`.', 'Now scan right→left.'],
      panels: [arr(CA2, { label: 'ratings' }), arr(CA2_LEFT, { label: 'candies after left pass' })],
      task: {
        type: 'cell',
        question: 'Scanning right→left, which child is fixed first?',
        panel: 1,
        answer: 3,
        hints: { 4: 'The right pass starts at n − 2; the last child has no right neighbour.', 2: 'Rating 3 > 2, but it already has 3 > 1. It is checked after index 3.', 1: '2 < 3: no right rule here.', 0: '1 < 2: no right rule here.' },
      },
      solved: 'Index **3**: rating 2 > 1 but both had 1 candy → max(1, 1 + 1) = 2. Final [1, 2, 3, 2, 1], total 9.',
      then: candyFrames(CA2, { left: [], right: CA2_R.right }, () => 1).slice(1),
    },
    {
      kind: 'watch',
      title: 'Wildcards: track [lo, hi]',
      lines: [
        '`*` can be `(`, `)` or empty. Track the range of open counts.',
        '`(` → lo++, hi++. `)` → lo--, hi--.',
        '`*` → lo-- and hi++.',
        'Clamp `lo = max(lo, 0)`. Valid iff `lo === 0` at the end.',
      ],
      frames: [
        { say: 0, note: `s = "${PR}". lo = hi = 0.`, panels: [arr([...PR], { label: 's' }), vars({ lo: 0, hi: 0 })] },
        ...parenFrames,
        { say: 3, note: 'End: lo = 0 → valid (the * was a "(").', panels: [arr([...PR], { label: 's', highlights: hl(4, () => 'done') }), vars({ lo: 0, hi: 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a bad start',
      lines: ['`hi` is the most open brackets possible.', 'If `hi < 0`, every interpretation over-closed → false.'],
      panels: [arr([...PR2], { label: 's', pointers: [ptr(0, 'i')] }), vars({ lo: 0, hi: 0 })],
      task: {
        type: 'choose',
        question: `s = "${PR2}". What happens at the first character?`,
        options: [
          { text: 'hi becomes −1 → return false', why: '' },
          { text: 'Clamp lo to 0 and keep going', why: 'Clamping only rescues lo. hi < 0 means even the best case failed.' },
          { text: 'The * later can fix it', why: 'A later * cannot reopen before a ) that already closed nothing.' },
          { text: 'lo and hi both stay 0', why: '`)` does lo-- and hi--.' },
        ],
        answer: 0,
      },
      solved: '`)` first: hi = −1 < 0 → **false** at once.',
    },
  ],

  template: [
    {
      kind: 'turn',
      title: 'Your turn: build the skeleton',
      lines: ['Generic greedy: choose the order, keep a small state, apply a local rule, read the answer.', 'Fill it in for max non-overlapping meetings.'],
      panels: [ivp(SEL, 'meetings', 1, 9)],
      task: {
        type: 'order',
        question: 'Put the skeleton lines in order.',
        items: ['sort by end', 'lastEnd = -∞', 'if start >= lastEnd', 'take: count++', 'return count'],
        hint: 'Order first, then state, then the local rule and take, then the answer.',
      },
      solved: 'Order → state → rule → take → answer. Every greedy fits this shape.',
    },
    {
      kind: 'watch',
      title: 'Jump Game II: BFS levels',
      lines: ['Scan the current level; track `farthest`.', 'At `i === curEnd` the level is done: `jumps++`, `curEnd = farthest`.', 'Never jump **from** the last index: loop to `n − 2`.'],
      frames: [
        { say: 0, note: `nums [${TJ}]. Level 0 is just index 0.`, panels: [arr(TJ, { label: 'nums', range: [0, 0] }), vars({ farthest: 0, curEnd: 0, jumps: 0 })] },
        ...jumpFrames(TJ, TJ_R, (st) => (st.hit ? 1 : 0)),
        { say: 2, note: `Loop stops at i = ${TJ.length - 2}. Answer ${TJ_R.jumps} jumps.`, panels: [arr(TJ, { label: 'nums', highlights: hl(5, () => 'done') }), vars({ jumps: TJ_R.jumps })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: fewest jumps',
      lines: ['nums = `[3, 1, 1, 1, 1]`.', 'Count a jump each time a level ends.'],
      panels: [arr(TJ2, { label: 'nums' })],
      task: { type: 'number', question: 'What does jump(nums) return?', options: [1, 2, 3, 4], answer: TJ2_R.jumps, hint: 'Level 1 is indices 1..3. From 3 you reach 4.' },
      solved: '**2**: 0 → 3 → 4. Level 1 = {1, 2, 3}, level 2 = {4}.',
      then: jumpFrames(TJ2, TJ2_R, (st) => (st.hit ? 1 : 0)),
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Refuel: the -1 exit',
      lines: ['`fuel` doubles as the farthest position: start at 0, 1 litre = 1 mile.', 'If the heap is empty while `fuel < target`, return **-1**.'],
      frames: [
        { say: 0, note: 'target 100, startFuel 1. The only station is at 10.', panels: refuelPanels([[10, 100]], 0, [], { fuel: 1, stops: 0 }) },
        { say: 1, note: '1 < 10: station at 10 is out of reach. Heap empty → -1.', panels: refuelPanels([[10, 100]], 0, [], { fuel: 1, return: -1 }) },
      ],
    },
    {
      kind: 'watch',
      title: 'Default sort compares strings',
      lines: ['`[10, 9, 1].sort()` gives `[1, 10, 9]`.', 'Always pass `(a, b) => a - b` for numbers.'],
      frames: [
        { say: 0, note: 'No comparator: "10" < "9" as strings.', panels: [arr(LEX, { label: 'input' }), arr(LEX_S, { label: '.sort()', highlights: hl(3, () => 'bad') })] },
        { say: 1, note: 'With a comparator: 1, 9, 10.', panels: [arr(LEX, { label: 'input' }), arr(LEX.toSorted((a, b) => a - b), { label: 'sort((a,b)=>a-b)', highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: two-key sort',
      lines: ['`(a, b) => b[0] - a[0] || a[1] - b[1]`', 'First key descending; `||` falls through to the second key on a tie.'],
      panels: [arr(PEOPLE.map(qKey), { label: 'people h,k' })],
      task: { type: 'order', question: 'Tap them in sorted order.', items: PEOPLE_S, hint: 'Height descending. Equal heights: k ascending.' },
      solved: '7,0 · 7,1 · 6,1 · 5,0 · 5,2: height down, then k up.',
    },
    {
      kind: 'turn',
      title: 'Your turn: no comparator',
      lines: ['Default `.sort()` compares as **strings**.'],
      panels: [arr([5, 25, 100], { label: 'input' })],
      task: {
        type: 'choose',
        question: '`[5, 25, 100].sort()` returns?',
        options: [
          { text: '[100, 25, 5]', why: '' },
          { text: '[5, 25, 100]', why: 'That needs (a, b) => a - b. As strings, "1" < "2" < "5".' },
          { text: '[100, 5, 25]', why: 'Compare first characters: "1", "2", "5". 25 comes before 5.' },
          { text: '[25, 5, 100]', why: '"100" starts with "1", which sorts first.' },
        ],
        answer: 0,
      },
      solved: '"100" < "25" < "5" as strings → `[100, 25, 5]`.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'jump([2, 3, 1, 1, 4]): level 0',
      lines: ['`farthest = max(farthest, i + nums[i])`.', 'If `i !== curEnd`, keep scanning.', 'If `i === curEnd`: jump, `curEnd = farthest`.'],
      frames: [drFrame(0), drFrame(1)],
    },
    {
      kind: 'turn',
      title: 'Your turn: next jump',
      lines: ['curEnd is 2, farthest is 4.', 'The next jump is counted when i reaches curEnd.'],
      panels: [jumpPanels(DR, DR_R.steps[1])[0], drTable(1)],
      task: {
        type: 'cell',
        question: 'At which i is the second jump counted?',
        answer: 2,
        hints: { 0: 'The first jump was at 0.', 1: 'i = 1 < curEnd = 2.', 3: 'curEnd is 2, so it happens earlier.', 4: 'The loop never reaches the last index.' },
      },
      solved: 'At i = **2** (= curEnd): jumps = 2, curEnd = 4.',
      then: [
        drFrame(2, 1, 0),
        drFrame(3, 1, 0),
        { say: 1, note: 'The loop stops before the last index. Level 0 = {0}, level 1 = {1, 2}, level 2 = {3, 4}. Answer 2.', panels: [arr(DR, { label: 'nums', highlights: { 0: 'visited', 1: 'active', 2: 'active', 3: 'done', 4: 'done' } }), drTable(3)] },
      ],
    },
    {
      kind: 'watch',
      title: 'Why stop before the last index',
      lines: ['A jump is counted when we **leave** a level.', 'Processing the last index could count a jump out of the destination.'],
      frames: [
        {
          say: 1,
          note: `If the loop also ran i = 4: farthest = 8, i === curEnd (4) → jumps = ${DR_BAD.jumps}. One too many.`,
          panels: [arr(DR, { label: 'nums', pointers: [ptr(4, 'i')], highlights: { 4: 'bad' } }), vars({ curEnd: 4, jumps: DR_BAD.jumps })],
        },
        { say: 0, note: 'Stopping at n − 2 only counts jumps needed to reach the end: 2.', panels: [arr(DR, { label: 'nums', highlights: hl(5, () => 'done') }), vars({ jumps: DR_R.jumps })] },
      ],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'No proof: sort by start',
      lines: ['Always test a small counter-example.', 'Meetings `[1,100] [2,3] [4,5]`: sorting by start keeps `[1,100]` and blocks the rest.', 'Sorting by end keeps `[2,3]` and `[4,5]`.'],
      frames: [
        { say: 1, note: 'By start: [1,100] kept, the others clash → 1 meeting.', panels: [arr(MS_S.sorted.map(fmt), { label: 'sorted by start', highlights: hl(3, (k) => (MS_S.keep[k] ? 'done' : 'bad')) }), vars({ kept: MS_S.count })] },
        { say: 2, note: 'By end: [2,3], [4,5] kept; [1,100] clashes → 2 meetings.', panels: [arr(MS_E.sorted.map(fmt), { label: 'sorted by end', highlights: hl(3, (k) => (MS_E.steps[k].fits ? 'done' : 'bad')) }), vars({ kept: MS_E.count })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Wrong heap direction',
      lines: ['Refuelling needs the **biggest** passed station.', 'A min-heap pops the smallest and wastes stops.'],
      frames: [
        { say: 0, note: `target 110. Max-heap: pop 60, then 40 → ${MH_MAX.stops} stops.`, panels: [arr(MH_MAX.steps.map((s) => s.got), { label: 'max-heap pops', highlights: hl(MH_MAX.stops, () => 'done') }), vars({ stops: MH_MAX.stops })] },
        ...mhFrames(MH_MIN, 'min').filter((_, k) => k % 2 === 1).map((f) => ({ ...f, say: 1 })),
        { say: 1, note: `Min-heap: pops 60, 30, 30 → ${MH_MIN.stops} stops. One more than needed.`, panels: [arr(MH_MIN.steps.map((s) => s.got), { label: 'min-heap pops', highlights: hl(MH_MIN.stops, () => 'bad') }), vars({ stops: MH_MIN.stops })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one pass is not enough',
      lines: ['Candy, ratings `[3, 2, 1]`.', 'A left→right pass alone gives `[1, 1, 1]`: child 0 is rated higher than child 1 but gets the same.'],
      panels: [arr(MC, { label: 'ratings' }), arr(MC_ONE.give, { label: 'one pass only', highlights: { 0: 'bad', 1: 'bad' } })],
      task: { type: 'number', question: 'With both passes, what is the minimum total?', options: [3, 5, 6, 9], answer: MC_TWO.total, hint: 'Right→left: child 1 beats child 2, child 0 beats child 1.' },
      solved: 'Both passes give `[3, 2, 1]`: total **6**.',
      then: candyFrames(MC, { left: [], right: MC_TWO.right }, () => 1).slice(1),
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: show the danger',
      lines: ['Say the rule in one sentence: "always keep the meeting that ends first".', 'Then offer a counter-example to the **naive** rule.'],
      panels: [ivp(IT, 'meetings', 1, 9)],
      task: {
        type: 'choose',
        question: 'Which naive rule does this input break?',
        options: [
          { text: 'Sort by start time', why: '' },
          { text: 'Sort by end time', why: 'Sort by end keeps [2,3] and [4,5]: that is the correct greedy.' },
          { text: 'Largest coin first', why: 'Right danger, wrong problem: that one is broken by coins [1, 3, 4].' },
        ],
        answer: 0,
      },
      solved: 'By start, [1,9] comes first and blocks both others: 1 meeting instead of 2.',
      then: [{ say: 1, note: 'Start-sorted keeps 1; end-sorted keeps 2.', panels: [ivp(IT, 'by start', 1, 9, startRun(IT).keep.map((k) => (k ? 'bad' : 'muted'))), ivp(endRun(IT).sorted, 'by end', 1, 9, endRun(IT).steps.map((s) => (s.fits ? 'done' : 'muted')))] }],
    },
    {
      kind: 'watch',
      title: 'Name the bottleneck',
      lines: ['Mention the sort cost.', 'O(n log n) is usually the bottleneck; the sweep is O(n).'],
      frames: [
        { say: 0, note: 'Sort first: O(n log n).', panels: [vars({ sort: 'n log n', sweep: '—' })] },
        { say: 1, note: 'One sweep: O(n). The total is the larger: O(n log n).', panels: [vars({ sort: 'n log n', sweep: 'n', total: 'n log n' })] },
      ],
    },
  ],
};
