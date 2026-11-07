// Binary-search pattern scenes: boundaries (lower/upper bound), rotated sorted array,
// binary search on the answer (Koko bananas) and peak finding. Each generate(input) returns frames.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const toInts = (xs, max = 8) => (Array.isArray(xs) ? xs : []).slice(0, max).map((x) => Math.trunc(Number(x) || 0));
const toInt = (x) => Math.trunc(Number(x) || 0);
const show = (a) => `[${a.join(', ')}]`;
// Highlights: everything outside [lo, hi] is discarded (muted).
const outside = (n, lo, hi) => {
  const h = {};
  for (let i = 0; i < n; i++) if (i < lo || i > hi) h[i] = 'muted';
  return h;
};
const lhm = (lo, mid, hi) => [
  { index: lo, label: 'lo', color: 'a' },
  ...(mid === undefined ? [] : [{ index: mid, label: 'mid', color: 'c' }]),
  { index: hi, label: 'hi', color: 'b' },
];

// ───────────────────────── 1. Boundaries: first and last position ─────────────────────────
export const bsFirstLast = {
  problem: { name: 'Find First and Last Position of Element', statement: 'In a sorted array, return the first and last index of the target, or [-1, -1].', example: 'nums = [5, 7, 7, 8, 8, 10], target = 8 → [3, 4]', exampleOutput: [3, 4], questionId: 'find-first-and-last-position-of-element-in-sorted-array' },
  title: 'Binary search boundaries: first and last position',
  description: 'Two lower-bound searches with lo < hi and hi = mid: first index with nums[i] >= target, then first index with nums[i] > target. The extra "end" cell is index n. Up to 7 numbers, sorted for you.',
  defaultInput: { nums: [5, 7, 7, 8, 8, 10], target: 8 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'sorted nums' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  testInputs: [
    { nums: [], target: 3 },
    { nums: [4], target: 4 },
    { nums: [1, 3, 5], target: 4 },
    { nums: [2, 2, 2, 2], target: 2 },
    { nums: [1, 2, 3, 9], target: 1 },
    { nums: [1, 2, 3, 9], target: 9 },
    { nums: [1, 2, 3], target: 7 },
  ],
  generate({ nums, target }) {
    const a = toInts(nums, 7).sort((x, y) => x - y);
    const t = toInt(target);
    const n = a.length;
    const cells = [...a, 'end'];
    const frames = [];
    let asked = 0;
    const view = (lo, hi, mid, hl = {}) => arr(cells, { label: 'nums (+ end = n)', range: [lo, hi], highlights: { ...outside(n + 1, lo, hi), ...hl }, pointers: lhm(lo, mid, hi) });
    frames.push({
      note: `Find the first and last index of ${t} in ${show(a)}. "nums[i] >= ${t}" reads false…false, true…true along a sorted array, so we binary search for the FIRST true. The answer may be n (nothing is >= ${t}), so hi starts at n — the "end" cell.`,
      panels: [view(0, n), vars({ target: t, n })],
    });
    const bound = (strict) => {
      const sym = strict ? '>' : '>=';
      const test = (x) => (strict ? x > t : x >= t);
      let lo = 0;
      let hi = n;
      frames.push({
        note: strict
          ? `Search 2 (upper bound): first i with nums[i] > ${t}. The last ${t} sits just before it. Again lo = 0, hi = n: the answer is always inside [lo, hi].`
          : `Search 1 (lower bound): first i with nums[i] >= ${t}. Half-open template: lo = 0, hi = n, loop while lo < hi.`,
        panels: [view(lo, hi), vars({ condition: `nums[i] ${sym} ${t}`, lo, hi })],
      });
      while (lo < hi) {
        const mid = lo + ((hi - lo) >> 1);
        const ok = test(a[mid]);
        const right = ok ? 'hi = mid' : 'lo = mid + 1';
        let predict;
        if (asked < 4 && (frames.length % 2 === 0 || asked === 0)) {
          predict = pick(`lo = ${lo}, hi = ${hi}, mid = ${mid}, nums[mid] = ${a[mid]}. Is nums[mid] ${sym} ${t}, and what is the update?`, right, ['hi = mid', 'lo = mid + 1', 'hi = mid − 1'], asked + 1);
          if (predict) asked++;
        }
        frames.push({
          note: ok
            ? `nums[${mid}] = ${a[mid]} ${sym} ${t} is TRUE. mid might be the first true, so keep it: hi = mid (not mid − 1, which could skip the answer).`
            : `nums[${mid}] = ${a[mid]} ${sym} ${t} is FALSE. mid and everything left of it are false, so the answer is right of mid: lo = mid + 1.`,
          panels: [view(lo, hi, mid, { [mid]: ok ? 'done' : 'bad' }), vars({ lo, mid, hi, [`nums[mid] ${sym} ${t}`]: ok })],
          predict,
        });
        if (ok) hi = mid;
        else lo = mid + 1;
      }
      frames.push({
        note: `lo === hi === ${lo}: the first index with nums[i] ${sym} ${t} is ${lo}${lo === n ? ' = n, meaning no element passes' : ''}.`,
        panels: [view(lo, hi, undefined, { [lo]: lo < n ? 'done' : 'muted' }), vars({ [strict ? 'upperBound' : 'lowerBound']: lo })],
      });
      return lo;
    };
    const lb = bound(false);
    if (lb === n || a[lb] !== t) {
      frames.push({
        note: `lowerBound = ${lb}, but ${lb === n ? 'that is n' : `nums[${lb}] = ${a[lb]} ≠ ${t}`}, so ${t} is not in the array: answer [-1, -1]. (${lb} is where it would be inserted.) Each search is O(log n).`,
        panels: [arr(cells, { label: 'nums (+ end = n)', highlights: { [n]: 'muted' }, pointers: [{ index: lb, label: 'insert', color: 'a' }] }), vars({ first: -1, last: -1 })],
        result: [-1, -1],
      });
      return frames;
    }
    const ub = bound(true);
    const hl = { [n]: 'muted' };
    for (let i = lb; i < ub; i++) hl[i] = 'done';
    frames.push({
      note: `first = lowerBound = ${lb}, last = upperBound − 1 = ${ub - 1}. Answer [${lb}, ${ub - 1}] (count = ${ub - lb}). Two O(log n) searches, O(1) space — duplicates never slow it down.`,
      panels: [arr(cells, { label: 'nums (+ end = n)', highlights: hl, pointers: [{ index: lb, label: 'first', color: 'a' }, { index: ub - 1, label: 'last', color: 'b' }] }), vars({ first: lb, last: ub - 1 })],
      result: [lb, ub - 1],
    });
    return frames;
  },
};

// ───────────────────────── 2. Rotated sorted array ─────────────────────────
export const bsRotated = {
  problem: { name: 'Search in Rotated Sorted Array', statement: 'A sorted array was rotated at some pivot. Find the target’s index in O(log n), or -1.', example: 'nums = [6, 7, 8, 1, 2, 3, 4, 5], target = 8 → 2', exampleOutput: 2, questionId: 'search-in-rotated-sorted-array' },
  title: 'Search in a rotated sorted array',
  description: 'At every mid one half is sorted; check whether the target lies in that sorted half, and discard the other. Up to 8 numbers; duplicates are removed and the input is rebuilt as a rotation of its sorted values starting at its first number.',
  defaultInput: { nums: [6, 7, 8, 1, 2, 3, 4, 5], target: 8 },
  fields: [
    { key: 'nums', type: 'numbers', label: 'rotated nums' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  testInputs: [
    { nums: [], target: 1 },
    { nums: [3], target: 3 },
    { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
    { nums: [1, 2, 3, 4, 5], target: 5 },
    { nums: [5, 1, 2, 3, 4], target: 5 },
    { nums: [3, 3, 1, 2, 2], target: 2 },
  ],
  generate({ nums, target }) {
    const raw = [...new Set(toInts(nums, 8))];
    const s = [...raw].sort((x, y) => x - y);
    const k = raw.length ? s.indexOf(raw[0]) : 0;
    const a = [...s.slice(k), ...s.slice(0, k)];
    const t = toInt(target);
    const n = a.length;
    const frames = [];
    const view = (lo, hi, mid, hl = {}) => arr(a, { label: 'nums', range: n ? [lo, hi] : undefined, highlights: { ...outside(n, lo, hi), ...hl }, pointers: n ? lhm(lo, mid, hi) : [] });
    const drop = a.findIndex((x, i) => i > 0 && x < a[i - 1]);
    frames.push({
      note: `Find ${t} in ${show(a)}. It was sorted, then rotated, so it is two sorted runs${drop > 0 ? ` with the drop between index ${drop - 1} and ${drop}` : ' (here: no rotation at all)'}. The whole array is not sorted, but any cut at mid leaves at least one sorted half.`,
      panels: [arr(a, { label: 'nums', highlights: drop > 0 ? { [drop - 1]: 'active', [drop]: 'active' } : {} }), vars({ target: t })],
    });
    let lo = 0;
    let hi = n - 1;
    let asked = 0;
    let step = 0;
    if (n) {
      frames.push({
        note: `Closed range: lo = 0, hi = ${n - 1}, loop while lo <= hi. Each step: check mid, find the sorted half, then ask "can the target be in it?".`,
        panels: [view(lo, hi), vars({ lo, hi, target: t })],
      });
    }
    while (lo <= hi) {
      step++;
      const mid = lo + ((hi - lo) >> 1);
      if (a[mid] === t) {
        frames.push({
          note: `nums[${mid}] = ${a[mid]} equals the target. Return ${mid}.`,
          panels: [view(lo, hi, mid, { [mid]: 'done' }), vars({ lo, mid, hi })],
          predict: step > 1 && asked < 4 ? pick(`lo = ${lo}, hi = ${hi}, mid = ${mid}, nums[mid] = ${a[mid]}. What happens?`, 'Return mid — found', ['Left half sorted → check range', 'Right half sorted → check range'], asked++) : undefined,
        });
        break;
      }
      const left = a[lo] <= a[mid];
      const sorted = {};
      for (let i = left ? lo : mid; i <= (left ? mid : hi); i++) sorted[i] = 'visited';
      const sideOpts = [`Left [${lo}..${mid}]`, `Right [${mid}..${hi}]`];
      const flip = step % 2 === 0; // vary the answer position
      frames.push({
        note: left
          ? `mid = ${mid}. nums[lo] = ${a[lo]} <= nums[mid] = ${a[mid]}, so no drop lies in [${lo}..${mid}]: the LEFT half is sorted. (Use <=: when lo === mid the left half is one cell and still sorted.)`
          : `mid = ${mid}. nums[lo] = ${a[lo]} > nums[mid] = ${a[mid]}, so the drop is in the left half: the RIGHT half [${mid}..${hi}] is sorted.`,
        panels: [view(lo, hi, mid, { ...sorted, [mid]: 'active' }), vars({ lo, mid, hi, 'sorted half': left ? 'left' : 'right' })],
        predict: step > 1 && asked < 4 ? ask(`lo = ${lo}, mid = ${mid}, hi = ${hi}; nums[lo] = ${a[lo]}, nums[mid] = ${a[mid]}, nums[hi] = ${a[hi]}. Which half is sorted?`, flip ? [...sideOpts].reverse() : sideOpts, left !== flip ? 0 : 1) : undefined,
      });
      if (step > 1 && asked < 4) asked++;
      const inside = left ? a[lo] <= t && t < a[mid] : a[mid] < t && t <= a[hi];
      const goLeft = left ? inside : !inside;
      const moveOpts = ['hi = mid − 1 (keep the left)', 'lo = mid + 1 (keep the right)'];
      const rangeTxt = left ? `[${a[lo]}, ${a[mid]})` : `(${a[mid]}, ${a[hi]}]`;
      frames.push({
        note: `The sorted half covers values ${rangeTxt}. ${t} is ${inside ? 'inside' : 'NOT inside'} it, so ${inside ? 'the target can only be in the sorted half' : 'the target can only be in the other half'}: ${goLeft ? 'hi = mid − 1' : 'lo = mid + 1'}.`,
        panels: [view(lo, hi, mid, { ...sorted, [mid]: 'bad' }), vars({ lo, mid, hi, [`${t} in ${rangeTxt}`]: inside })],
        predict: asked < 4 && (step === 1 || step % 2 === 0) ? ask(`The ${left ? 'left' : 'right'} sorted half covers values ${rangeTxt}; target = ${t}. Which update?`, moveOpts, goLeft ? 0 : 1) : undefined,
      });
      if (asked < 4 && (step === 1 || step % 2 === 0)) asked++;
      if (goLeft) hi = mid - 1;
      else lo = mid + 1;
    }
    const found = n > 0 && lo <= hi;
    const idx = found ? a.indexOf(t) : -1;
    frames.push({
      note: found
        ? `Answer: index ${idx}. Each step discarded half the range using only the sorted half → O(log n) time, O(1) space.`
        : `lo > hi: the range is empty, so ${t} is not present. Answer -1. Still O(log n): each step discarded half.`,
      panels: [arr(a, { label: 'nums', highlights: found ? { [idx]: 'done' } : {}, pointers: found ? [{ index: idx, label: 'answer', color: 'c' }] : [] }), vars({ answer: idx })],
      result: idx,
    });
    return frames;
  },
};

// ───────────────────────── 3. Binary search on the answer (Koko) ─────────────────────────
export const bsOnAnswerKoko = {
  problem: { name: 'Koko Eating Bananas', statement: 'Find the slowest eating speed k (bananas per hour, one pile per hour at most) that finishes all piles within h hours.', example: 'piles = [3, 6, 7, 11], h = 8 → 4', exampleOutput: 4, questionId: 'koko-eating-bananas' },
  title: 'Binary search on the answer: Koko eating bananas',
  description: 'Search the eating speed k in [1, max(piles)]; feasible(k) = total of ceil(pile / k) hours ≤ h. Up to 6 piles of 1–99 bananas; h is clamped to [number of piles, 99] so the max speed always works.',
  defaultInput: { piles: [3, 6, 7, 11], h: 8 },
  fields: [
    { key: 'piles', type: 'numbers', label: 'piles' },
    { key: 'h', type: 'number', label: 'hours h' },
  ],
  testInputs: [
    { piles: [], h: 3 },
    { piles: [5], h: 1 },
    { piles: [5], h: 9 },
    { piles: [30, 11, 23, 4, 20], h: 5 },
    { piles: [30, 11, 23, 4, 20], h: 6 },
    { piles: [4, 4, 4], h: 2 },
  ],
  generate({ piles, h }) {
    const p = toInts(piles, 6).map((x) => Math.min(99, Math.max(1, x)));
    const H = Math.min(99, Math.max(p.length, toInt(h)));
    const max = p.length ? Math.max(...p) : 1;
    const frames = [];
    const hoursAt = (k) => p.map((x) => Math.ceil(x / k));
    const range = (lo, hi, mid, midState = 'visited') => ({
      kind: 'intervals',
      label: 'answer range [lo, hi] (speed k)',
      min: 1,
      max: Math.max(2, max),
      items: [{ start: lo, end: hi, state: 'active' }, ...(mid === undefined ? [] : [{ start: mid, end: mid, state: midState }])],
    });
    const pilesPanel = arr(p, { label: 'piles' });
    frames.push({
      note: `Koko has ${p.length} pile(s) ${show(p)} and ${H} hours. Each hour she eats up to k bananas from ONE pile. Finding the smallest k directly is hard, but checking a given k is easy: hours = sum of ceil(pile / k). Faster never hurts, so feasible(k) is false…false, true…true.`,
      panels: [pilesPanel, range(1, max), vars({ h: H, lo: 1, hi: max })],
    });
    let lo = 1;
    let hi = max;
    frames.push({
      note: `The answer is in [1, ${max}]: k = ${max} = max(piles) finishes every pile in 1 hour (${p.length} ≤ ${H} hours), so feasible(hi) is true. Below 1 is meaningless.`,
      panels: [pilesPanel, range(lo, hi), vars({ h: H, lo, hi })],
    });
    let asked = 0;
    let step = 0;
    while (lo < hi) {
      step++;
      const mid = Math.floor((lo + hi) / 2);
      const hrs = hoursAt(mid);
      const total = hrs.reduce((x, y) => x + y, 0);
      const ok = total <= H;
      const hpanel = arr(hrs, { label: `hours per pile at k = ${mid}`, highlights: Object.fromEntries(hrs.map((_, i) => [i, ok ? 'done' : 'bad'])) });
      frames.push({
        note: `Try mid = floor((${lo} + ${hi}) / 2) = ${mid}. Hours: ${hrs.join(' + ')} = ${total}, limit ${H} → ${ok ? 'feasible' : 'too slow'}.`,
        panels: [pilesPanel, hpanel, range(lo, hi, mid, ok ? 'done' : 'bad'), vars({ h: H, lo, mid, hi, 'total hours': total })],
        predict: step % 2 === 1 && asked < 3 ? pick(`Speed k = ${mid} on ${show(p)}: how many hours in total (sum of ceil(pile / ${mid}))?`, total, [total + 1, Math.max(1, total - 1), Math.ceil(p.reduce((x, y) => x + y, 0) / mid), total + 2], asked++) : undefined,
      });
      const right = ok ? 'hi = mid' : 'lo = mid + 1';
      if (ok) hi = mid;
      else lo = mid + 1;
      frames.push({
        note: ok
          ? `${mid} works, so every speed above it works too — but something smaller might also work. Keep mid: hi = ${mid}.`
          : `${mid} is too slow, so every speed below it is too slow as well. Discard them: lo = ${mid + 1}.`,
        panels: [pilesPanel, range(lo, hi), vars({ h: H, lo, hi })],
        predict: step % 2 === 0 && asked < 4 ? pick(`k = ${mid} needs ${total} hours and the limit is ${H}. Which update?`, right, ['hi = mid', 'lo = mid + 1', 'hi = mid − 1'], asked++) : undefined,
      });
    }
    const hrs = hoursAt(lo);
    frames.push({
      note: `lo === hi = ${lo}: the minimum speed is ${lo} (${hrs.reduce((x, y) => x + y, 0)} hours ≤ ${H}). ${step} feasibility checks of O(n) each instead of trying every speed → O(n log max).`,
      panels: [pilesPanel, arr(hrs, { label: `hours per pile at k = ${lo}`, highlights: Object.fromEntries(hrs.map((_, i) => [i, 'done'])) }), range(lo, lo), vars({ answer: lo })],
      result: lo,
    });
    return frames;
  },
};

// ───────────────────────── 4. Peak element ─────────────────────────
export const bsPeak = {
  problem: { name: 'Find Peak Element', statement: 'Return the index of any element larger than its neighbours, in O(log n).', example: '[1, 2, 1, 3, 5, 6, 4] → 5 (value 6; index 1 is also a peak)', exampleOutput: 5, questionId: 'find-peak-element' },
  title: 'Binary search for a peak element',
  description: 'Compare nums[mid] with nums[mid + 1] and keep the uphill side; the outside is −∞, so a peak always exists there. Up to 8 numbers (equal neighbours give an index not lower than its neighbours).',
  defaultInput: { nums: [1, 2, 1, 3, 5, 6, 4] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [1, 2, 3, 4] }, { nums: [9, 5, 3, 1] }, { nums: [2, 2, 2] }, { nums: [1, 3, 2, 4, 1, 5, 6, 0, 9] }],
  generate({ nums }) {
    const a = toInts(nums, 8);
    const n = a.length;
    const frames = [];
    const view = (lo, hi, mid, hl = {}) => arr(a, { label: 'nums', range: [lo, hi], highlights: { ...outside(n, lo, hi), ...hl }, pointers: lhm(lo, mid, hi) });
    if (!n) {
      frames.push({ note: 'Find a peak: an element bigger than its neighbours (outside the array counts as −∞).', panels: [arr(a, { label: 'nums' })] });
      frames.push({ note: 'The array is empty, so there is no peak to return.', panels: [arr(a, { label: 'nums' }), vars({ answer: 'none' })], result: -1 });
      return frames;
    }
    frames.push({
      note: `Find any peak in ${show(a)} (nums[-1] = nums[n] = −∞). The array is not sorted, but one comparison of nums[mid] with nums[mid + 1] shows which way is uphill — and walking uphill must end at a peak.`,
      panels: [view(0, n - 1), vars({ lo: 0, hi: n - 1 })],
    });
    let lo = 0;
    let hi = n - 1;
    let step = 0;
    while (lo < hi) {
      step++;
      const mid = lo + ((hi - lo) >> 1);
      const up = a[mid] < a[mid + 1];
      const right = up ? 'lo = mid + 1' : 'hi = mid';
      frames.push({
        note: up
          ? `nums[${mid}] = ${a[mid]} < nums[${mid + 1}] = ${a[mid + 1]}: uphill to the right. Keep climbing right and you either meet a drop (a peak) or the end (also a peak, because outside is −∞).`
          : `nums[${mid}] = ${a[mid]} >= nums[${mid + 1}] = ${a[mid + 1]}: mid is a peak or we are going downhill, so a peak is at mid or to its left.`,
        panels: [view(lo, hi, mid, { [mid]: 'active', [mid + 1]: 'visited' }), vars({ lo, mid, hi, 'nums[mid]': a[mid], 'nums[mid+1]': a[mid + 1] })],
        predict: step <= 4 ? pick(`lo = ${lo}, hi = ${hi}, mid = ${mid}: nums[mid] = ${a[mid]}, nums[mid + 1] = ${a[mid + 1]}. Which update?`, right, ['lo = mid + 1', 'hi = mid', 'hi = mid − 1'], step) : undefined,
      });
      if (up) lo = mid + 1;
      else hi = mid;
      frames.push({
        note: up ? `lo = mid + 1 = ${lo}: the left part is discarded even though it may hold peaks too — we only need one.` : `hi = mid = ${hi}: mid stays in the range because it may be the peak itself.`,
        panels: [view(lo, hi), vars({ lo, hi })],
      });
    }
    frames.push({
      note: `lo === hi = ${lo}: nums[${lo}] = ${a[lo]} is a peak (${lo > 0 ? a[lo - 1] : '−∞'} ≤ ${a[lo]} ≥ ${lo < n - 1 ? a[lo + 1] : '−∞'}). Note lo < hi keeps mid + 1 inside the array. O(log n) time, O(1) space.`,
      panels: [arr(a, { label: 'nums', highlights: { [lo]: 'done' }, pointers: [{ index: lo, label: 'peak', color: 'c' }] }), vars({ answer: lo })],
      result: lo,
    });
    return frames;
  },
};
