// Shorts for Two Pointers (M9). Format: src/content/shortSchema.js. Facts come only from topics/two-pointers/topic.js.
// Pointer positions are produced by running each algorithm on its example input below.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });

// ---------- opposite ends: sorted pair sum, target 11 ----------
const SORTED = [2, 3, 5, 8, 10, 13];
const PT = 11;
const pairFrames = [];
{
  let l = 0,
    r = SORTED.length - 1;
  while (l < r) {
    const s = SORTED[l] + SORTED[r];
    const found = s === PT;
    pairFrames.push({
      say: found ? 1 : s > PT ? 1 : 0,
      note: found
        ? `${SORTED[l]} + ${SORTED[r]} = ${PT}: found [${l}, ${r}] after ${pairFrames.length + 1} checks instead of 15.`
        : s > PT
          ? `${SORTED[l]} + ${SORTED[r]} = ${s} > ${PT}: ${SORTED[r]} overshoots even with the smallest partner → r--.`
          : `${SORTED[l]} + ${SORTED[r]} = ${s} < ${PT}: ${SORTED[l]} falls short even with the largest partner → l++.`,
      panels: [
        arr(SORTED, { label: `sorted, target ${PT}`, pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: hl(6, (k) => (k < l || k > r ? 'muted' : k === l || k === r ? (found ? 'done' : 'active') : '')) }),
        vars({ l, r, sum: s }),
      ],
    });
    if (found) break;
    s < PT ? l++ : r--;
  }
}

// ---------- read / write: remove every 0, keep the order ----------
const ZS = [0, 5, 0, 0, 7, 9];
const rwFrames = [];
const rwEnd = ZS.slice();
{
  let write = 0;
  for (let read = 0; read < rwEnd.length; read++) {
    const x = rwEnd[read];
    const keep = x !== 0;
    const w = write;
    if (keep) rwEnd[write++] = x;
    rwFrames.push({
      say: keep ? 1 : 0,
      note: keep ? `read = ${read}: ${x} is kept → nums[${w}] = ${x}, write moves to ${write}.` : `read = ${read}: a 0, dropped. write stays at ${write}.`,
      panels: [
        arr(rwEnd.slice(), {
          label: 'nums',
          pointers: [ptr(read, 'read'), ptr(Math.min(write, rwEnd.length - 1), 'write', 'b')],
          highlights: hl(6, (k) => (k === read && !keep ? 'muted' : k < write ? 'done' : k === read ? 'active' : '')),
        }),
        vars({ write }),
      ],
    });
  }
}

// ---------- merge in place from the back ----------
const N1 = [2, 5, 8, '·', '·'];
const N2 = [3, 9];
const mergeFrames = [];
{
  const a = N1.slice();
  let i = 2,
    j = 1,
    k = 4;
  while (j >= 0) {
    const fromA = i >= 0 && a[i] > N2[j];
    const [v, other] = fromA ? [a[i], N2[j]] : [N2[j], a[i]];
    const pk = k;
    a[k--] = v;
    fromA ? i-- : j--;
    mergeFrames.push({
      say: 1,
      note:
        j < 0
          ? `${v} > ${other}: write ${v} at k = ${pk}. nums2 is used up; ${a[0]} already sits at 0. Done.`
          : `${v} > ${other}: write ${v} at k = ${pk}, then ${fromA ? 'i' : 'j'}-- and k--.`,
      panels: [
        arr(a.slice(), {
          label: 'nums1',
          pointers: [...(i >= 0 ? [ptr(i, 'i')] : []), ...(j >= 0 ? [ptr(k, 'k', 'c')] : [])],
          highlights: hl(5, (x) => (x === pk ? 'active' : x > pk ? 'done' : '')),
        }),
        arr(N2, { label: 'nums2', ...(j >= 0 ? { pointers: [ptr(j, 'j', 'b')] } : {}), highlights: hl(2, (x) => (x > j ? 'visited' : '')) }),
      ],
    });
  }
}

// ---------- 3Sum with duplicates ----------
const KS = [-2, 0, 0, 2, 2];
const ksPanel = (i, l, r, st = {}) =>
  arr(KS, {
    label: 'sorted nums',
    pointers: [ptr(i, 'i', 'c'), ...(l !== null ? [ptr(l, 'l'), ptr(r, 'r', 'b')] : [])],
    highlights: hl(5, (k) => st[k] ?? (k === i ? 'window' : k === l || k === r ? 'active' : k < i ? 'muted' : '')),
  });

// ---------- Dutch flag on [1, 2, 0, 1, 2, 0] ----------
const DF = [1, 2, 0, 1, 2, 0];
const dutchFrames = [];
{
  const a = DF.slice();
  let low = 0,
    mid = 0,
    high = a.length - 1;
  while (mid <= high) {
    const v = a[mid];
    const m = mid,
      h = high;
    let note;
    if (v === 0) {
      [a[low], a[mid]] = [a[mid], a[low]];
      note = `mid sees 0: swap with low, then low++ and mid++. The 1 that came back is already classified.`;
      low++;
      mid++;
    } else if (v === 1) {
      note = `mid sees 1: it belongs between low and mid already → mid++.`;
      mid++;
    } else {
      [a[mid], a[high]] = [a[high], a[mid]];
      note =
        m === h
          ? `mid sees 2 at high: high-- → mid > high, nothing unknown is left. Sorted in one pass.`
          : `mid sees 2: swap with high (a ${a[m]} arrives), high--. mid stays: that ${a[m]} is still unknown.`;
      high--;
    }
    dutchFrames.push({
      say: v === 2 ? 1 : 0,
      note,
      panels: [
        arr(a.slice(), {
          label: 'nums',
          pointers: [ptr(Math.min(low, 5), 'low'), ptr(Math.min(mid, 5), 'mid', 'b'), ptr(Math.max(high, 0), 'high', 'c')],
          highlights: hl(6, (k) => (k < low ? 'done' : k < mid ? 'window' : k > high ? 'visited' : '')),
        }),
        vars({ unknown: mid <= high ? `[${mid}, ${high}]` : 'empty' }),
      ],
    });
  }
}

// ---------- Hoare partition: negatives first ----------
const NEG = [3, -1, 4, -5, -2, 6];
const hoareFrames = [];
const hoareEnd = NEG.slice();
{
  const a = hoareEnd;
  let l = 0,
    r = a.length - 1;
  while (l < r) {
    let note;
    const [pl, pr] = [l, r];
    let swapped = false;
    if (a[l] < 0) {
      note = `${a[l]} is negative: already on the left side → l++.`;
      l++;
    } else if (a[r] >= 0) {
      note = `${a[l]} is misplaced, but ${a[r]} is already on the right side → r--.`;
      r--;
    } else {
      note = `${a[l]} belongs right, ${a[r]} belongs left: one swap fixes both, then l++ and r--.`;
      [a[l], a[r]] = [a[r], a[l]];
      swapped = true;
      l++;
      r--;
    }
    hoareFrames.push({
      say: swapped ? 1 : 0,
      note: l >= r && swapped ? `${note.slice(0, -1)}; l passed r: done, 2 swaps.` : note,
      panels: [
        arr(a.slice(), {
          label: 'nums',
          pointers: [ptr(pl, 'l'), ptr(pr, 'r', 'b')],
          highlights: hl(6, (k) => (swapped && (k === pl || k === pr) ? 'active' : k < l ? 'done' : k > r ? 'visited' : '')),
        }),
      ],
    });
  }
}

// ---------- container + trapping water ----------
const CH = [3, 1, 4, 6, 2, 5];
const contFrames = [];
{
  let l = 0,
    r = CH.length - 1,
    best = 0;
  while (l < r) {
    const h = Math.min(CH[l], CH[r]);
    const area = h * (r - l);
    best = Math.max(best, area);
    const moveL = CH[l] < CH[r];
    contFrames.push({
      say: 1,
      note: `min(${CH[l]}, ${CH[r]}) × ${r - l} = ${area}, best ${best}. ${moveL ? `${CH[l]} is shorter → l++.` : `${CH[r]} is shorter → r--.`}`,
      panels: [
        arr(CH, { label: 'height', pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: hl(6, (k) => (k < l || k > r ? 'muted' : k === (moveL ? l : r) ? 'active' : k === l || k === r ? 'window' : '')) }),
        vars({ area, best }),
      ],
    });
    moveL ? l++ : r--;
  }
}
const TR = [2, 0, 1, 3];
const trapFrames = [];
{
  let l = 0,
    r = TR.length - 1,
    lm = 0,
    rm = 0,
    water = 0;
  while (l < r) {
    lm = Math.max(lm, TR[l]);
    rm = Math.max(rm, TR[r]);
    const left = lm < rm;
    const add = left ? lm - TR[l] : rm - TR[r];
    water += add;
    const at = left ? l : r;
    trapFrames.push({
      say: 1,
      note: left
        ? `leftMax ${lm} < rightMax ${rm}: the level at bar ${at} is exactly ${lm}. Add ${lm} − ${TR[at]} = ${add}, l++.`
        : `rightMax ${rm} ≤ leftMax ${lm}: the level at bar ${at} is exactly ${rm}. Add ${rm} − ${TR[at]} = ${add}, r--.`,
      panels: [
        arr(TR, { label: 'height', pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')], highlights: hl(4, (k) => (k === at ? 'active' : k < l ? 'done' : '')) }),
        vars({ leftMax: lm, rightMax: rm, water }),
      ],
    });
    left ? l++ : r--;
  }
}

export default [
  {
    id: 'two-pointers-opposite',
    title: 'Find a pair in a sorted array with one sweep',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair is a lot of pairs',
        lines: ['Sorted array, find two numbers that add up to a target.', 'Two nested loops try every pair: about n² / 2 of them, **O(n²)**.'],
        frames: [
          { say: 0, note: `e.g. sorted nums = [2, 3, 5, 8, 10, 13], target ${PT}.`, panels: [arr(SORTED, { label: 'sorted' })] },
          { say: 1, note: '2 is tried with 3, 5, 8, 10, 13; then 3 with the rest… 15 pairs for 6 numbers.', panels: [arr(SORTED, { label: 'sorted', pointers: [ptr(0, 'i')], highlights: hl(6, (k) => (k === 0 ? 'active' : 'window')) }), vars({ pairs: 15 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Compare the two ends',
        lines: ['Sum too small → `left++`: the left value is too small for **every** remaining right.', 'Sum too big → `right--`: the right value is too big for **every** remaining left.'],
        frames: pairFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"sorted array"**, **"pair that sums to target"**, **"palindrome"**, **"two people per boat"**, **"O(1) extra space"**.'],
        frames: [
          {
            say: 0,
            note: 'Palindrome, same shape: s[0] = s[4], both ends are verified, so both pointers move inward.',
            panels: [arr(['l', 'e', 'v', 'e', 'l'], { label: 'e.g. s = "level"', pointers: [ptr(1, 'l'), ptr(3, 'r', 'b')], highlights: { 0: 'done', 4: 'done' } })],
          },
          {
            say: 0,
            note: 'Each step moves one pointer and never back: O(n). Unsorted with original indices → a hash map instead.',
            panels: [table(['"pair sums to target"', '"palindrome"', '"two people per boat"'], ['which end goes'], [['the one proven useless'], ['both, after a match'], ['the heaviest, alone or paired']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: too small',
        lines: ['Sorted `[1, 4, 6, 9, 12]`, target 18. `left` is at 1, `right` at 12: the sum is 13.'],
        panels: [arr([1, 4, 6, 9, 12], { label: 'sorted, target 18', pointers: [ptr(0, 'l'), ptr(4, 'r', 'b')], highlights: { 0: 'active', 4: 'active' } }), vars({ sum: 13 })],
        task: {
          type: 'choose',
          question: '13 < 18. Which pointer moves?',
          options: [
            { text: '`left++`: 1 + any remaining value ≤ 13, so 1 is useless' },
            { text: '`right--`', why: 'That only makes the sum smaller; 12 is still needed (6 + 12 = 18).' },
            { text: 'Both pointers', why: 'Only 1 is proven useless. Dropping 12 too would skip the answer 6 + 12.' },
            { text: 'Restart from the middle', why: 'Pointers never go back or jump; one proven-useless end per step is the whole idea.' },
          ],
          answer: 0,
        },
        solved: 'Move only the end the comparison proves useless: too small → left++, too big → right--.',
      },
    ],
  },

  {
    id: 'two-pointers-read-write',
    title: 'Delete in place without splice',
    steps: [
      {
        kind: 'watch',
        title: 'splice shifts the whole tail',
        lines: ['Remove every 0 **in place** and keep the order of the rest.', '`splice` shifts every later element left: O(n) per deletion, **O(n²)** for many.'],
        frames: [
          { say: 0, note: 'e.g. nums = [0, 5, 0, 0, 7, 9].', panels: [arr(ZS, { label: 'nums', highlights: { 0: 'bad', 2: 'bad', 3: 'bad' } })] },
          { say: 1, note: 'splice(0, 1): 5, 0, 0, 7, 9 all shift one slot left. Two more deletions shift the tail again.', panels: [arr([5, 0, 0, 7, 9], { label: 'after one splice', highlights: hl(5, () => 'window') }), vars({ moves: 5 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Read everything, write only what you keep',
        lines: ['`read` visits every element once.', 'A kept value is copied to `nums[write]`, then `write++`. nums[0 .. write − 1] is the answer so far.'],
        frames: rwFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"in place"**, **"O(1) extra memory"**, **"return the new length k"**, **"keep the relative order"**, **"move all X to the end"**.'],
        frames: [
          {
            say: 0,
            note: 'Move Zeroes: swap nums[read] with nums[write] instead of copying, and the zeros drift to the back.',
            panels: [arr([5, 7, 9, 0, 0, 0], { label: 'move zeroes (swap version)', highlights: hl(6, (k) => (k < 3 ? 'done' : 'muted')) }), vars({ time: 'O(n)', extra: 'O(1)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: what do you return?',
        lines: ['The copy version has finished: `write = 3`.'],
        panels: [arr(rwEnd, { label: 'nums at the end', highlights: hl(6, (k) => (k < 3 ? 'done' : 'muted')) }), vars({ write: 3 })],
        task: {
          type: 'choose',
          question: 'The problem says "return the new length k". What do you return?',
          options: [
            { text: '`write - 1`, the last written index', why: 'write already counts the kept values; write − 1 drops one.' },
            { text: '`write`: nums[0 .. 2] = 5, 7, 9 is the answer' },
            { text: '`nums.length`', why: 'The tail 0, 7, 9 is leftover data, not part of the answer.' },
            { text: 'A new array `[5, 7, 9]`', why: 'In-place problems mutate the input and return k; a new array is O(n) extra space.' },
          ],
          answer: 1,
        },
        solved: '`write` is the new length: everything before it is the answer, whatever sits after it.',
      },
    ],
  },

  {
    id: 'two-pointers-merge',
    title: 'Merge two sorted arrays from the back',
    steps: [
      {
        kind: 'watch',
        title: 'Re-sorting ignores what you know',
        lines: ['nums1 has room at the back for nums2; merge them **in place**.', 'Concatenate and re-sort: **O((m+n) log(m+n))**.', 'Merging from the front overwrites values not yet read.'],
        frames: [
          { say: 0, note: 'e.g. nums1 = [2, 5, 8, ·, ·] with m = 3, nums2 = [3, 9] with n = 2.', panels: [arr(N1, { label: 'nums1' }), arr(N2, { label: 'nums2' })] },
          { say: 1, note: 'Both inputs are already sorted: the next output is always one of the two fronts. A full sort wastes that.', panels: [arr([2, 5, 8, 3, 9], { label: 'concatenated, then sort?', highlights: hl(5, () => 'window') })] },
          { say: 2, note: 'From the front: 2 stays, then 3 lands on index 1 and destroys 5 before it was read.', panels: [arr([2, 3, 8, '·', '·'], { label: 'nums1', highlights: { 0: 'done', 1: 'bad' } }), arr(N2, { label: 'nums2', pointers: [ptr(0, 'j', 'b')] })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Write the largest into the free slot',
        lines: ['`i` and `j` point at the largest unread values; `k = m + n − 1` is the last free slot.', 'Write the larger one at `k`, move that pointer and `k` left. k ≥ i always, so nothing unread is lost.'],
        frames: mergeFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"two sorted arrays"**, **"merge"**, **"in place into nums1 which has enough space"**, **"sorted in non-decreasing order"** + an operation that breaks order at one end.'],
        frames: [
          {
            say: 0,
            note: 'One pass, O(m + n). More than two inputs → a heap (k-way merge) instead.',
            panels: [table(['two sorted inputs', 'free space at the back', 'order broken at the ends'], ['read from'], [['the two fronts'], ['the two backs, write from k'], ['both ends, fill the output from the back']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: squares of a sorted array',
        lines: ['Sorted `[-6, -2, 1, 4]`: return the squares, also sorted.', 'Fill the output from the back, one pointer at each end.'],
        panels: [arr([-6, -2, 1, 4], { label: 'nums', pointers: [ptr(0, 'l'), ptr(3, 'r', 'b')] }), arr(['·', '·', '·', '·'], { label: 'out', pointers: [ptr(3, 'k', 'c')] })],
        task: {
          type: 'choose',
          question: 'What is written at out[3] first?',
          options: [
            { text: '16, from the right end', why: 'Squaring turns −6 into 36, which is larger than 16.' },
            { text: '36, from the left end; then l++' },
            { text: '1, the square closest to zero', why: 'Values near zero give the smallest squares; they are written last.' },
            { text: 'Nothing yet: square everything and sort first', why: 'That works but is O(n log n); the two ends give the next largest square in O(1).' },
          ],
          answer: 1,
        },
        solved: 'The largest remaining square sits at one of the two ends: compare them and fill from the back, O(n).',
      },
    ],
  },

  {
    id: 'sort-two-pointers-ksum',
    title: '3Sum: fix one number, sweep a pair',
    steps: [
      {
        kind: 'watch',
        title: 'Triple loops and repeated answers',
        lines: ['Find all **unique** triplets with sum 0.', 'Three nested loops: **O(n³)**, and the same triplet comes out many times.'],
        frames: [
          { say: 0, note: 'e.g. nums = [0, 2, -2, 2, 0].', panels: [arr([0, 2, -2, 2, 0], { label: 'nums' })] },
          { say: 1, note: '10 index triplets to try. [-2, 0, 2] matches 4 of them: 2 zeros × 2 twos.', panels: [arr([0, 2, -2, 2, 0], { label: 'nums', highlights: { 0: 'window', 1: 'window', 2: 'active', 3: 'window', 4: 'window' } }), vars({ triplets: 10, '[-2,0,2] found': '4 times' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Sort, fix i, pair-sum the rest',
        lines: ['Sort with `(a, b) => a - b`: equal values become neighbours.', 'Fix `nums[i]`, then opposite-end pointers find pairs summing to `−nums[i]`: O(n) per i, **O(n²)** total.', 'Skip a value equal to the previous one: it would find the same triplets again.'],
        frames: [
          { say: 0, note: 'Sorted: [-2, 0, 0, 2, 2]. The two 0s and the two 2s now sit side by side.', panels: [ksPanel(0, null, null, { 1: 'window', 2: 'window', 3: 'window', 4: 'window', 0: '' })] },
          { say: 1, note: 'i = 0 (−2): −2 + 0 + 2 = 0 → record [-2, 0, 2]. Then l++ and r--.', panels: [ksPanel(0, 1, 4, { 1: 'done', 4: 'done' }), vars({ sum: 0, found: '[-2, 0, 2]' })] },
          { say: 2, note: 'nums[l] = 0 equals the previous 0 → skip it. l meets r: no second copy of [-2, 0, 2].', panels: [ksPanel(0, 3, 3, { 2: 'muted' }), vars({ found: '[-2, 0, 2]' })] },
          { say: 1, note: 'i = 1 (0): 0 + 0 + 2 = 2 > 0 → r--, again too big → r--. The pointers meet.', panels: [ksPanel(1, 2, 4), vars({ sum: 2 })] },
          { say: 2, note: 'i = 2: nums[2] = nums[1] = 0, the same first value → skip. Answer: [[-2, 0, 2]].', panels: [ksPanel(2, null, null, { 2: 'muted', 0: 'muted', 1: 'muted' }), vars({ result: '[[-2, 0, 2]]' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"triplets"**, **"a + b + c = 0"**, **"unique quadruplets"**, **"no duplicate triplets"**, **"closest to target"**.'],
        frames: [
          {
            say: 0,
            note: 'Need original indices? Sorting scrambles them → hashing. Only one pair in an unsorted array → a hash map.',
            panels: [table(['brute force', 'sort + i + pair sweep'], ['3Sum time'], [['O(n³)'], ['O(n²)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: 4Sum',
        lines: ['4Sum: all unique quadruplets with a given sum.', 'Same recipe: sort, fix numbers with loops, finish with a pair sweep.'],
        panels: [arr([-2, -1, 0, 0, 1, 2], { label: 'e.g. sorted nums', pointers: [ptr(0, 'i', 'c'), ptr(1, 'j', 'c'), ptr(2, 'l'), ptr(5, 'r', 'b')] })],
        task: {
          type: 'choose',
          question: 'What does 4Sum cost this way?',
          options: [
            { text: 'O(n²), like 3Sum', why: 'Each extra fixed number adds one more outer loop.' },
            { text: 'O(n³): two fixed numbers, then an O(n) pair sweep' },
            { text: 'O(n⁴)', why: 'That is brute force. The last two numbers cost O(n) together, not O(n²).' },
            { text: 'O(n log n), the cost of the sort', why: 'The sort is only a first step; the loops dominate it.' },
          ],
          answer: 1,
        },
        solved: 'kSum fixes k − 2 numbers and sweeps the last pair: O(n^(k−1)).',
      },
    ],
  },

  {
    id: 'dutch-national-flag',
    title: 'Sort 0s, 1s and 2s in a single pass',
    steps: [
      {
        kind: 'watch',
        title: 'A general sort is overkill',
        lines: ['Only three values: 0, 1 and 2. Group them in place.', 'A general sort is **O(n log n)**; counting takes **two passes**.'],
        frames: [{ say: 1, note: 'e.g. nums = [1, 2, 0, 1, 2, 0]. We want one pass and O(1) extra space.', panels: [arr(DF, { label: 'nums' })] }],
      },
      {
        kind: 'watch',
        title: 'Shrink the unknown region',
        lines: [
          '`[0, low)` 0s · `[low, mid)` 1s · `[mid, high]` unknown · `(high, end]` 2s. Look at `nums[mid]`: 0 → swap with low; 1 → mid++.',
          '2 → swap with high and `high--`, but **do not** move `mid`.',
        ],
        frames: dutchFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"0s, 1s and 2s"**, **"sort colors"**, **"one pass"**, **"constant space"**, **"three-way partition"**.'],
        frames: [
          {
            say: 0,
            note: 'Every step shrinks the unknown region by one: n steps. More than three groups → counting sort.',
            panels: [arr([0, 0, 1, 1, 2, 2], { label: 'done', highlights: { 0: 'done', 1: 'done', 2: 'window', 3: 'window', 4: 'visited', 5: 'visited' } }), vars({ passes: 1, extra: 'O(1)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a 2 at mid',
        lines: ['`nums[mid]` is 2 and `nums[high]` is 0.'],
        panels: [arr([0, 1, 2, 1, 0, 2], { label: 'nums', pointers: [ptr(1, 'low'), ptr(2, 'mid', 'b'), ptr(4, 'high', 'c')], highlights: { 0: 'done', 1: 'window', 5: 'visited' } })],
        task: {
          type: 'choose',
          question: 'What happens in this step?',
          options: [
            { text: 'Swap mid and high, `high--`, and `mid++`', why: 'The 0 that arrives at mid was never examined; skipping it leaves a 0 among the 1s.' },
            { text: 'Swap mid and high, `high--`; mid stays' },
            { text: 'Just `mid++`', why: 'A 2 belongs in the region after high, not among the 1s.' },
            { text: 'Swap mid with low', why: 'That is the move for a 0; a 2 goes to the back.' },
          ],
          answer: 1,
        },
        solved: 'After a swap with high, the value at mid is unknown: classify it next step before moving mid.',
      },
    ],
  },

  {
    id: 'two-pointers-partition',
    title: 'Negatives first, no sort needed',
    steps: [
      {
        kind: 'watch',
        title: 'Two groups, not a full order',
        lines: ['Put every negative number before every non-negative one, **in place**.', 'Sorting would work but is O(n log n); we only need "these left, those right".'],
        frames: [
          { say: 0, note: 'e.g. nums = [3, -1, 4, -5, -2, 6].', panels: [arr(NEG, { label: 'nums', highlights: { 1: 'window', 3: 'window', 4: 'window' } })] },
          {
            say: 1,
            note: 'Lomuto: a scanner swaps each negative to a boundary pointer. 3 swaps, one per negative.',
            panels: [arr([-1, -5, -2, 3, 4, 6], { label: 'after Lomuto', pointers: [ptr(3, 'boundary', 'c')], highlights: { 0: 'done', 1: 'done', 2: 'done' } }), vars({ swaps: 3 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Hoare: one swap fixes two',
        lines: ['`l` skips values already on the left side, `r` skips values already on the right side.', 'When both are misplaced, one swap fixes **both**.'],
        frames: hoareFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"move all X to the front"**, **"in place, order does not matter"**, **"k-th largest"**, **"partition around a pivot"**.'],
        frames: [
          {
            say: 0,
            note: 'One O(n) pass, O(1) space. Quickselect partitions, then recurses only into the side holding k.',
            panels: [arr(hoareEnd, { label: 'after Hoare', highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'visited', 4: 'visited', 5: 'visited' } }), vars({ swaps: 2 })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: keep the order',
        lines: ['The input listed the negatives as −1, −5, −2. Hoare left them as −2, −1, −5.', 'Now the problem adds: **keep the relative order**.'],
        panels: [arr(NEG, { label: 'input', highlights: { 1: 'window', 3: 'window', 4: 'window' } }), arr(hoareEnd, { label: 'after Hoare', highlights: { 0: 'bad', 1: 'bad', 2: 'bad' } })],
        task: {
          type: 'choose',
          question: 'Which technique fits now?',
          options: [
            { text: 'Hoare, as before', why: 'Partitioning is not stable: you just saw −2 jump ahead of −1.' },
            { text: 'Lomuto instead', why: 'Neither scheme is stable; Lomuto swaps can reorder elements too.' },
            { text: 'Read/write compaction' },
            { text: 'Dutch National Flag', why: 'That is for three groups, and it is not stable either.' },
          ],
          answer: 2,
        },
        solved: 'Partitioning trades order for speed; when order must be kept, use read/write compaction (stable).',
      },
    ],
  },

  {
    id: 'two-pointers-bottleneck',
    title: 'Most water: always move the shorter wall',
    steps: [
      {
        kind: 'watch',
        title: 'Every pair of walls',
        lines: ['Pick two lines; the container holds `min(h[l], h[r]) × (r − l)`. Find the most water.', 'Trying every pair is **O(n²)**.'],
        frames: [
          { say: 0, note: 'e.g. height = [3, 1, 4, 6, 2, 5]. The shorter of the two walls sets the water level.', panels: [arr(CH, { label: 'height' })] },
          { say: 1, note: '6 lines → 15 pairs. The value is limited by a minimum, which hints at a smarter order.', panels: [arr(CH, { label: 'height', highlights: hl(6, () => 'window') }), vars({ pairs: 15 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Start widest, drop the shorter wall',
        lines: [
          'Start with the widest pair.',
          'Keep the shorter wall and every other partner is **narrower** and no taller: it can never beat this area. Drop it.',
        ],
        frames: contFrames,
      },
      {
        kind: 'watch',
        title: 'Same move, trapping water',
        lines: ['Water above bar i = `min(maxLeft, maxRight) − h[i]`.', 'The side with the smaller running max has its level **fully known**: settle it and move in.'],
        frames: trapFrames,
      },
      {
        kind: 'turn',
        title: 'Your turn: which side is settled?',
        lines: ['Clues: **"height"**, **"container"**, **"trap water"**, **"min(...) × width"**.', 'Trapping water: both running maxima are already updated for this step.'],
        panels: [arr([4, 0, 5, 2, 1, 3], { label: 'height', pointers: [ptr(0, 'l'), ptr(4, 'r', 'b')], highlights: { 5: 'done' } }), vars({ leftMax: 4, rightMax: 3, water: 0 })],
        task: {
          type: 'choose',
          question: 'What happens in this step?',
          options: [
            { text: 'Settle l: add 4 − 4 = 0, then l++', why: 'leftMax 4 is not the smaller side; the level at l is not yet known from these maxima.' },
            { text: 'Settle r: add 3 − 1 = 2, then r--' },
            { text: 'Compare h[l] = 4 with h[r] = 1 directly', why: 'Trapping compares the running maxima, not the raw bars.' },
            { text: 'Wait until the middle bars are seen', why: 'Middle bars can only raise maxLeft at r, which is already above 3. The level is exactly 3.' },
          ],
          answer: 1,
        },
        solved: 'The smaller side is the bottleneck, and the bottleneck is fully known: settle it and move that pointer.',
      },
    ],
  },
];
