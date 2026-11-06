// Shorts for Array Techniques (M9). Format: src/content/shortSchema.js. Facts come only from topics/array-techniques/topic.js.
// Every cur/best, swap, sign mark, vote and pivot below is produced by running the pattern's template on its "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });

// ---------- Kadane on [3, −4, 2, −1, 5, −6] ----------
const K = [3, -4, 2, -1, 5, -6];
const kadFrames = [];
{
  let cur = K[0],
    best = K[0],
    start = 0;
  const panel = (i) => [
    arr(K, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(K.length, (k) => (k === i ? 'active' : k >= start && k < i ? 'window' : k < start ? 'muted' : '')) }),
    vars({ cur, best }),
  ];
  kadFrames.push({ say: 0, note: `i = 0: cur = best = nums[0] = ${K[0]}. The subarray must be non-empty, so never start at 0.`, panels: panel(0) });
  for (let i = 1; i < K.length; i++) {
    const old = cur;
    const ext = cur + K[i];
    const restart = K[i] > ext;
    if (restart) start = i;
    cur = Math.max(K[i], ext);
    const up = cur > best;
    best = Math.max(best, cur);
    kadFrames.push({
      say: up ? 1 : 0,
      note: restart
        ? `${K[i]} > ${old} + ${K[i]} = ${ext}: carrying ${old} only drags it down → restart. cur = ${cur}.`
        : `${old} + ${K[i]} = ${ext} beats ${K[i]} alone → extend. cur = ${cur}${up ? `, best rises to ${best}` : `, best stays ${best}`}.`,
      panels: panel(i),
    });
  }
}
const KN = [-4, -2, -5]; // the turn: all negative

// ---------- cyclic sort on [3, 1, 5, 1, 2] ----------
const CY = [3, 1, 5, 1, 2];
const cyFrames = [];
const cyEnd = CY.slice();
{
  const a = cyEnd;
  const done = (k) => a[k] === k + 1;
  const panel = (i, st) =>
    arr(a.slice(), { label: 'nums', pointers: [ptr(Math.min(i, a.length - 1), 'i')], highlights: hl(a.length, (k) => st[k] ?? (done(k) ? 'done' : '')) });
  let i = 0,
    swaps = 0,
    homeRun = [];
  const flushHome = () => {
    if (!homeRun.length) return;
    const last = homeRun.at(-1);
    cyFrames.push({
      say: 1,
      note: `${homeRun.map((k) => `nums[${k}] = ${k + 1}`).join(', ')}: already home → i++ to ${last + 1 < a.length ? last + 1 : 'the end'}.`,
      panels: [panel(last, {}), vars({ i: last + 1, swaps })],
    });
    homeRun = [];
  };
  while (i < a.length) {
    const v = a[i];
    const h = v - 1;
    if (v >= 1 && v <= a.length && a[h] !== v) {
      flushHome();
      const other = a[h];
      [a[i], a[h]] = [a[h], a[i]];
      swaps++;
      cyFrames.push({
        say: 0,
        note: `i = ${i}: ${v} belongs at index ${h}, which holds ${other}. Swap: ${v} is home for good; i stays, ${other} is next.`,
        panels: [panel(i, { [h]: 'active' }), vars({ i, swaps })],
      });
    } else if (h === i) {
      homeRun.push(i);
      i++;
    } else {
      flushHome();
      cyFrames.push({
        say: 1,
        note: `i = ${i}: ${v} belongs at index ${h}, but nums[${h}] is already ${v} → a duplicate. Leave it, i++.`,
        panels: [panel(i, { [i]: 'bad', [h]: 'done' }), vars({ i, swaps })],
      });
      i++;
    }
  }
  flushHome();
}
const cyWrong = cyEnd.findIndex((x, j) => x !== j + 1); // 3: holds 1, so 4 is missing

// ---------- index marking on [2, 4, 1, 2] ----------
const IM = [2, 4, 1, 2];
const imFrames = [];
const imEnd = IM.slice();
const imDup = [];
{
  const a = imEnd;
  for (let i = 0; i < a.length; i++) {
    const raw = a[i];
    const v = Math.abs(raw);
    const dup = a[v - 1] < 0;
    if (dup) imDup.push(v);
    else a[v - 1] = -a[v - 1];
    const read = raw < 0 ? `nums[${i}] reads ${raw}, so v = |${raw}| = ${v}` : `v = ${v}`;
    imFrames.push({
      say: dup ? 1 : 0,
      note: dup
        ? `i = ${i}: ${read}. nums[${v - 1}] is already negative → ${v} was seen before: duplicate.`
        : `i = ${i}: ${read}. nums[${v - 1}] is positive → negate it: "${v} seen".`,
      panels: [
        arr(a.slice(), {
          label: 'nums',
          pointers: [ptr(i, 'i'), ptr(v - 1, 'v − 1', 'b')],
          highlights: hl(a.length, (k) => (k === v - 1 ? (dup ? 'bad' : 'active') : a[k] < 0 ? 'visited' : '')),
        }),
        vars({ v, duplicates: imDup.length ? `[${imDup.join(', ')}]` : '[]' }),
      ],
    });
  }
}
const imMissing = imEnd.map((x, j) => (x > 0 ? j + 1 : null)).filter(Boolean); // [3]
const IT = [4, 3, 1, 3]; // the turn: marks after i = 0 and i = 1
const itState = IT.slice();
for (let i = 0; i < 2; i++) {
  const v = Math.abs(itState[i]);
  if (itState[v - 1] > 0) itState[v - 1] = -itState[v - 1];
} // [4, 3, -1, -3]

// ---------- Boyer–Moore on [4, 4, 9, 9, 4] ----------
const BM = [4, 4, 9, 9, 4];
const vote = (nums) => {
  let candidate = null,
    count = 0;
  const trace = [];
  for (const x of nums) {
    const adopt = count === 0;
    if (adopt) candidate = x;
    count += x === candidate ? 1 : -1;
    trace.push({ x, adopt, candidate, count });
  }
  return { candidate, count, trace };
};
const bmRun = vote(BM);
const bmFrames = bmRun.trace.map((s, i) => ({
  say: s.adopt ? 0 : 1,
  note: s.adopt
    ? `${s.x}: count is 0 → adopt ${s.x} as the candidate, count = ${s.count}.`
    : s.x === s.candidate
      ? `${s.x} = candidate → a supporter, count = ${s.count}.`
      : `${s.x} ≠ ${s.candidate} → cancels one ${s.candidate} vote, count = ${s.count}.${s.count === 0 ? ' Two pairs gone.' : ''}`,
  panels: [arr(BM, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(BM.length, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }), vars({ candidate: s.candidate, count: s.count })],
}));
const bmFreq = BM.filter((x) => x === bmRun.candidate).length; // 3
const BT = [3, 8, 8, 3, 5]; // the turn: no majority
const btRun = vote(BT);
const btFreq = BT.filter((x) => x === btRun.candidate).length;

// ---------- next permutation on [2, 4, 3, 1] ----------
const NP = [2, 4, 3, 1];
const npFrames = [];
const npEnd = NP.slice();
{
  const a = npEnd;
  const n = a.length;
  let i = n - 2;
  while (i >= 0 && a[i] >= a[i + 1]) {
    npFrames.push({
      say: 0,
      note: `i = ${i}: ${a[i]} ≥ ${a[i + 1]}, still descending from the right → i--.`,
      panels: [arr(a.slice(), { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(n, (k) => (k === i || k === i + 1 ? 'active' : k > i + 1 ? 'window' : '')) })],
    });
    i--;
  }
  npFrames.push({
    say: 0,
    note: `i = ${i}: ${a[i]} < ${a[i + 1]} → pivot. The suffix ${a.slice(i + 1).join(', ')} is already its largest order.`,
    panels: [arr(a.slice(), { label: 'nums', pointers: [ptr(i, 'pivot', 'c')], highlights: hl(n, (k) => (k === i ? 'active' : k > i ? 'window' : '')) })],
  });
  let j = n - 1;
  while (a[j] <= a[i]) j--;
  npFrames.push({
    say: 1,
    note: `From the right, the first value > ${a[i]} is ${a[j]} at j = ${j}: the smallest larger value. Swap them.`,
    panels: [arr(a.slice(), { label: 'nums', pointers: [ptr(i, 'pivot', 'c'), ptr(j, 'j', 'b')], highlights: { [i]: 'active', [j]: 'active' } })],
  });
  [a[i], a[j]] = [a[j], a[i]];
  const before = a.slice(i + 1).join(', ');
  for (let l = i + 1, r = n - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
  npFrames.push({
    say: 2,
    note: `Swapped: the suffix ${before} is still descending. Reverse it → [${a.join(', ')}], the next one.`,
    panels: [arr(a.slice(), { label: 'nums', highlights: hl(n, (k) => (k === i ? 'done' : k > i ? 'window' : '')) })],
  });
}

export default [
  {
    id: 'kadane-max-subarray',
    title: 'Best subarray sum in one pass: extend or restart',
    steps: [
      {
        kind: 'watch',
        title: 'Every subarray is a lot of subarrays',
        lines: ['Largest sum of a **contiguous, non-empty** subarray. Numbers can be negative.', 'Try every start, extend the end, keep a running sum: **O(n²)**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${K.join(', ')}].`, panels: [arr(K, { label: 'nums' })] },
          {
            say: 1,
            note: 'start = 0 runs to the end, then start = 1 does it again… 6 numbers, 21 subarrays.',
            panels: [arr(K, { label: 'nums', pointers: [ptr(0, 'start')], highlights: hl(6, (k) => (k === 0 ? 'active' : 'window')) }), vars({ subarrays: 21 })],
          },
          {
            say: 1,
            note: 'A sliding window has no rule here: removing a negative can raise the sum, removing a positive lowers it.',
            panels: [arr(K, { label: 'window?', highlights: { 0: 'window', 1: 'bad', 2: 'window' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Best sum ending here',
        lines: ['`cur` = best sum of a subarray **ending exactly at i** = `max(nums[i], cur + nums[i])`.', '`best` = the largest `cur` seen anywhere. `cur` may drop; `best` only goes up.'],
        frames: kadFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: [
          'Clues: **"contiguous subarray with the largest sum"**, **"maximum product subarray"**, **"circular array" + "maximum sum"**, **"at least one element"**.',
          'Negative numbers are the tell: they are what breaks the sliding window.',
        ],
        frames: [
          {
            say: 0,
            note: 'Product: a negative flips max and min, so keep both. Circular: max(Kadane, total − min subarray).',
            panels: [table(['"largest sum"', '"maximum product"', '"circular array"'], ['keep'], [['cur, best'], ['curMax and curMin'], ['max and min Kadane, total']])],
          },
          {
            say: 1,
            note: 'Neighbours that look alike but are not Kadane.',
            panels: [table(['fixed length k', 'sum equals a target', 'not contiguous'], ['use'], [['fixed sliding window'], ['prefix sums + hash map'], ['greedy or DP']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: all negative',
        lines: [`e.g. nums = [${KN.join(', ')}]: every number is negative.`, 'The answer is a non-empty subarray.'],
        panels: [arr(KN, { label: 'nums', highlights: { 0: 'bad', 1: 'bad', 2: 'bad' } })],
        task: {
          type: 'choose',
          question: 'Which starting value for `best` (and `cur`) gives the right answer here?',
          options: [
            { text: '`0`', why: 'No sum ever beats 0, so 0 comes back: that is the empty subarray, which is not allowed.' },
            { text: '`nums[0]`: the run returns −2, the largest element' },
            { text: 'Either one, they always agree', why: 'They agree only when some subarray sum is positive. Here 0 would win and be wrong.' },
          ],
          answer: 1,
        },
        solved: 'Start `cur` and `best` at `nums[0]` (or `-Infinity`), and restart at `nums[i]`, never at 0.',
      },
    ],
  },

  {
    id: 'cyclic-sort',
    title: 'Send every value to its home index',
    steps: [
      {
        kind: 'watch',
        title: 'Find the gap without extra memory',
        lines: ['n numbers, values in `1..n`: one is missing, one is duplicated.', 'A Set costs **O(n) extra space**; a sort costs **O(n log n)**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${CY.join(', ')}], n = 5.`, panels: [arr(CY, { label: 'nums' })] },
          { say: 1, note: 'But the value itself says where it belongs: value v lives at index v − 1.', panels: [arr([1, 2, 3, 4, 5], { label: 'home of each value', highlights: hl(5, () => 'window') }), vars({ Set: 'O(n) space', sort: 'O(n log n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Swap each value home',
        lines: ['Home of `nums[i]` is `nums[i] − 1`. If the home does not already hold that value, **swap**, and keep i: a new value just arrived.', 'Otherwise (already home, duplicate, or out of range) `i++`.'],
        frames: cyFrames,
      },
      {
        kind: 'watch',
        title: 'Read the answer off the indexes',
        lines: ['Scan once: index j with `nums[j] !== j + 1` → **j + 1 is missing**, the value there is the **duplicate**.', 'Clues: **"integers in the range [1, n]"**, **"find the missing / duplicate number"**, **"O(1) extra space"**, **"first missing positive"**.'],
        frames: [
          {
            say: 0,
            note: `nums[${cyWrong}] holds ${cyEnd[cyWrong]}, not ${cyWrong + 1}: ${cyWrong + 1} is missing, ${cyEnd[cyWrong]} is the duplicate.`,
            panels: [arr(cyEnd, { label: 'nums at the end', highlights: hl(5, (k) => (k === cyWrong ? 'bad' : 'done')) }), vars({ missing: cyWrong + 1, duplicate: cyEnd[cyWrong] })],
          },
          {
            say: 1,
            note: 'Each swap fixes one slot for good: at most n swaps + n increments, O(n). Arbitrary values → a hash set.',
            panels: [table(['values in 1..n', 'values up to 10^9', 'input must not change'], ['use'], [['cyclic sort'], ['hash set or sort'], ['XOR / sum math or Floyd']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a copy is already home',
        lines: ['e.g. nums = `[3, 1, 3, 2]`, i = 0.', '3 belongs at index 2, and nums[2] is already 3.'],
        panels: [arr([3, 1, 3, 2], { label: 'nums', pointers: [ptr(0, 'i'), ptr(2, 'home', 'b')], highlights: { 0: 'active', 2: 'done' } })],
        task: {
          type: 'choose',
          question: 'What does the loop do now?',
          options: [
            { text: 'Swap nums[0] with nums[2]', why: 'Both are 3: the swap changes nothing. A check like `nums[i] !== i + 1` would keep swapping forever.' },
            { text: '`i++`: this 3 is a duplicate, leave it where it is' },
            { text: 'Swap nums[0] with nums[3]', why: 'The home of value 3 is index 3 − 1 = 2, not 3.' },
            { text: 'Stop: the input is invalid', why: 'Duplicates are expected; the slot left holding the extra 3 later reveals the missing 4.' },
          ],
          answer: 1,
        },
        solved: 'Check the home (`nums[home] !== nums[i]`), not `i + 1`: a copy already at home means a duplicate, so move on.',
      },
    ],
  },

  {
    id: 'index-marking-negation',
    title: 'Use the sign bit as a "seen" flag',
    steps: [
      {
        kind: 'watch',
        title: 'A seen array costs O(n)',
        lines: ['Values in `1..n`: which appear twice, and which never appear?', 'A boolean `seen` array of size n answers it, but costs **O(n) extra space**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${IM.join(', ')}], n = 4.`, panels: [arr(IM, { label: 'nums' })] },
          {
            say: 1,
            note: 'seen[v − 1] = true for every v: 2 is set twice, value 3 is never set.',
            panels: [arr(IM, { label: 'nums' }), arr(['T', 'T', 'F', 'T'], { label: 'seen (extra n cells)', highlights: { 1: 'bad', 2: 'muted' } })],
          },
          {
            say: 1,
            note: 'Every value is positive, so the sign bit of each cell is unused. Store "seen" there instead.',
            panels: [arr(IM, { label: 'nums: sign bits free', highlights: hl(4, () => 'window') })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Negative means "seen"',
        lines: ['Read `v = Math.abs(nums[i])`, then look at `nums[v − 1]`: positive → negate it, "v seen".', 'Already negative → v was seen before: **duplicate**.'],
        frames: imFrames,
      },
      {
        kind: 'watch',
        title: 'Read the signs',
        lines: ['After the pass, index j still **positive** → value j + 1 never appeared.', 'Clues: **"1 ≤ nums[i] ≤ n"**, **"appear twice"**, **"disappeared numbers"**, **"without extra space and in O(n) runtime"**.'],
        frames: [
          {
            say: 0,
            note: `Only index ${imMissing[0] - 1} is positive → ${imMissing.join(', ')} never appeared. Duplicates: ${imDup.join(', ')}.`,
            panels: [arr(imEnd, { label: 'nums at the end', highlights: hl(4, (k) => (imEnd[k] > 0 ? 'bad' : 'visited')) }), vars({ missing: `[${imMissing.join(', ')}]`, duplicates: `[${imDup.join(', ')}]` })],
          },
          {
            say: 1,
            note: 'A sign holds one bit. Zeros or negatives in the input, or counts above 2, need something else.',
            panels: [table(['values can be 0 or negative', 'counts larger than 2'], ['instead'], [['remap first, or cyclic sort'], ['add n instead of negating']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a cell that is already marked',
        lines: [`e.g. nums = [${IT.join(', ')}]. After i = 0 and i = 1 it is [${itState.join(', ')}].`, `Now i = 2, and nums[2] reads ${itState[2]}.`],
        panels: [arr(itState, { label: 'nums', pointers: [ptr(2, 'i')], highlights: { 2: 'active', 3: 'visited' } })],
        task: {
          type: 'choose',
          question: 'Which cell holds the "seen" mark for the value at i = 2?',
          options: [
            { text: `nums[0]: v = |${itState[2]}| = 1, so look at index 0` },
            { text: `nums[${itState[2] - 1}]`, why: 'The minus is a mark that value 3 left here. Using it gives a negative index: undefined.' },
            { text: 'nums[1], the index before i', why: 'The mark goes at v − 1, where v is the value, not the position.' },
            { text: 'None: a negative cell is skipped', why: 'The sign belongs to value 3; this cell still holds value 1, which needs its own mark.' },
          ],
          answer: 0,
        },
        solved: 'The sign speaks for another value; the magnitude is this cell\'s value. Always read `Math.abs(nums[i])`.',
      },
    ],
  },

  {
    id: 'boyer-moore-voting',
    title: 'Find the majority with one candidate and a counter',
    steps: [
      {
        kind: 'watch',
        title: 'A Map of counts costs O(n) space',
        lines: ['Find the value that appears **more than ⌊n/2⌋ times**.', 'Counting with a Map works, but keeps one entry per distinct value: **O(n) space**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${BM.join(', ')}], n = 5: ${bmRun.candidate} appears ${bmFreq} times, more than 2.`, panels: [arr(BM, { label: 'nums' })] },
          { say: 1, note: 'The Map grows with the number of distinct values. Voting needs only two variables.', panels: [table(['4', '9'], ['count'], [['3'], ['2']], 'Map'), vars({ voting: 'candidate, count' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Vote for or against',
        lines: ['`count === 0` → the current value becomes the **candidate**.', 'Same as candidate → `count++`; different → `count--`: two different values cancel.'],
        frames: bmFrames,
      },
      {
        kind: 'watch',
        title: 'Why the majority survives',
        lines: [
          'A value with k > n/2 votes needs k other votes to cancel it all, but there are only n − k < k.',
          'Clues: **"majority element"**, **"appears more than ⌊n / 2⌋ times"**, **"more than ⌊n / 3⌋ times"**, **"O(1) space"**.',
        ],
        frames: [
          {
            say: 0,
            note: `The survivor is ${bmRun.candidate}, with count ${bmRun.count}. It appears ${bmFreq} times: the final count is not the frequency.`,
            panels: [arr(BM, { label: 'nums', highlights: { 0: 'muted', 1: 'muted', 2: 'muted', 3: 'muted', 4: 'done' } }), vars({ candidate: bmRun.candidate, count: bmRun.count, frequency: bmFreq })],
          },
          {
            say: 1,
            note: 'More than n/3 → two candidates; a third value decrements both. Always verify those.',
            panels: [table(['> n/2', '> n/3', '> n/k'], ['candidates'], [['1'], ['2'], ['k − 1']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: no guarantee',
        lines: [`e.g. nums = [${BT.join(', ')}]. The problem says "return the majority element, or −1 if there is none".`, `The vote ends with candidate ${btRun.candidate}, count ${btRun.count}.`],
        panels: [arr(BT, { label: 'nums', highlights: { [BT.length - 1]: 'active' } }), vars({ candidate: btRun.candidate, count: btRun.count })],
        task: {
          type: 'choose',
          question: 'What do you return?',
          options: [
            { text: `${btRun.candidate}: voting always finds the majority`, why: 'Only when a majority exists. Without one, the survivor is just whoever came last.' },
            { text: `Count ${btRun.candidate} in a second pass: ${btFreq} time, not more than 2 → return −1` },
            { text: '8, the value that was adopted first', why: 'Voting dropped 8 when the 3 cancelled it. The vote alone cannot name the most frequent value.' },
            { text: `−1 because count is only ${btRun.count}`, why: `The count says nothing about frequency: in [${BM.join(', ')}] the real majority also ended with count 1.` },
          ],
          answer: 1,
        },
        solved: 'Voting finds the only possible majority; when none is guaranteed, verify it with one counting pass.',
      },
    ],
  },

  {
    id: 'next-permutation',
    title: 'The next arrangement: pivot, swap, reverse',
    steps: [
      {
        kind: 'watch',
        title: 'Listing every arrangement is O(n!)',
        lines: ['Rearrange the array into the **next lexicographically greater** permutation, in place.', 'Generating all permutations to find the next one is **O(n!)**.'],
        frames: [
          { say: 0, note: `e.g. nums = [${NP.join(', ')}]. Read it like the number ${NP.join('')}: we want the smallest bigger one.`, panels: [arr(NP, { label: 'nums' })] },
          { say: 1, note: '4 values → 24 arrangements to list and sort, just to take one step.', panels: [arr(NP, { label: 'nums', highlights: hl(4, () => 'window') }), vars({ arrangements: 24 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Change it as far right as possible',
        lines: ['**Pivot**: scan from the right while `nums[i] >= nums[i + 1]`; the first smaller value is the pivot.', '**Swap** the pivot with the smallest larger value on its right (scan from the right).', '**Reverse** the suffix after the pivot: descending becomes ascending, the smallest order.'],
        frames: npFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"next lexicographically greater permutation"**, **"rearrange in place"**, **"next greater element with the same digits"**, **"if not possible, sort ascending"**.', 'No pivot: the whole array is descending, the last permutation. Reverse it all.'],
        frames: [
          {
            say: 1,
            note: 'e.g. [4, 3, 2, 1]: the scan runs off the left end. Reverse everything → [1, 2, 3, 4], the first one.',
            panels: [arr([4, 3, 2, 1], { label: 'no pivot', highlights: hl(4, () => 'window') }), arr([1, 2, 3, 4], { label: 'reversed', highlights: hl(4, () => 'done') })],
          },
          {
            say: 0,
            note: 'Scan, search and reverse each touch at most n elements: O(n), O(1) space. ALL permutations → backtracking.',
            panels: [table(['generate all', 'pivot, swap, reverse'], ['time'], [['O(n!)'], ['O(n)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: an equal pair',
        lines: ['e.g. nums = `[2, 5, 5, 1]`. Scan for the pivot from the right.'],
        panels: [arr([2, 5, 5, 1], { label: 'nums', pointers: [ptr(2, 'i')] })],
        task: {
          type: 'choose',
          question: 'Where is the pivot?',
          options: [
            { text: 'Index 0 (the 2): 1 ≤ 5 ≤ 5 is a non-increasing suffix, and 2 < 5' },
            { text: 'Index 1 (the first 5)', why: '5 ≥ 5 keeps scanning. Stopping on an equal pair is the `>` instead of `>=` bug.' },
            { text: 'Index 2 (the second 5)', why: '5 ≥ 1, so it is part of the descending suffix: it cannot grow by rearranging the right side.' },
            { text: 'No pivot: reverse everything', why: '2 < 5, so the array is not fully descending. It has a next permutation: [5, 1, 2, 5].' },
          ],
          answer: 0,
        },
        solved: 'Scan with `>=` so equal values stay in the suffix; the pivot is the rightmost value smaller than its right neighbour.',
      },
    ],
  },
];
