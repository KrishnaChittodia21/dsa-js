// Shorts for Sliding Window (M9). Format: src/content/shortSchema.js. Facts come only from topics/sliding-window/topic.js.
// Every window, sum and counter below is produced by running the pattern's template on the example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// window [lo, hi] shaded, with per-index overrides
const win = (n, lo, hi, extra = {}) => hl(n, (k) => extra[k] ?? (k >= lo && k <= hi ? 'window' : ''));
const lr = (left, right) => [ptr(left, 'left'), ptr(right, 'right', 'b')];

// ---------- fixed window: best sum of 3 in a row, with a negative in it ----------
const F = [3, -1, 4, 6, -2, 5];
const K = 3;
const fixedArr = (lo, hi, extra = {}, opts = {}) => arr(F, { label: 'nums, k = 3', range: [lo, hi], highlights: win(F.length, lo, hi, extra), ...opts });
const slideFrames = [];
{
  let sum = 0,
    best = -Infinity;
  for (let right = 0; right < F.length - 1; right++) {
    sum += F[right];
    if (right >= K) sum -= F[right - K];
    if (right >= K - 1) best = Math.max(best, sum);
    const lo = Math.max(0, right - K + 1);
    const note =
      right < K - 1
        ? `${F[right]} enters. Window not full yet (right < k − 1), so nothing is recorded. sum = ${sum}.`
        : right === K - 1
          ? `${F[right]} enters. The window is full: record best = ${best}.`
          : `${F[right]} enters, nums[right − k] = ${F[right - K]} leaves: sum = ${sum}, best = ${best}.`;
    slideFrames.push({
      say: right < K - 1 ? 0 : right === K - 1 ? 1 : 2,
      note,
      panels: [fixedArr(lo, right, { ...(right >= K ? { [right - K]: 'bad' } : {}), [right]: 'active' }, { pointers: [ptr(right, 'right', 'b')] }), vars({ windowSum: sum, best: best === -Infinity ? '−∞' : best })],
    });
  }
}

// ---------- variable window: longest run of 1s, flipping at most one 0 ----------
const V = [1, 0, 1, 1, 0, 0, 1];
const VK = 1;
const vArr = (left, right, extra = {}) => arr(V, { label: 'nums, flip ≤ 1 zero', pointers: lr(left, right), range: [left, right], highlights: win(V.length, left, right, extra) });
const growFrames = [];
let turnState;
{
  let left = 0,
    zeros = 0,
    best = 0;
  for (let right = 0; right < V.length; right++) {
    if (V[right] === 0) zeros++;
    if (right === 5) {
      turnState = { left, right, zeros, best };
      break;
    }
    if (zeros > VK)
      growFrames.push({ say: 1, note: `${V[right]} enters: zeros = ${zeros} > 1. The window broke the rule.`, panels: [vArr(left, right, { [right]: 'bad' }), vars({ zeros, best })] });
    while (zeros > VK) {
      if (V[left] === 0) zeros--;
      left++;
      growFrames.push({
        say: 1,
        note: zeros > VK ? `Remove ${V[left - 1]}: left = ${left}, zeros still ${zeros}. One removal was not enough.` : `Remove ${V[left - 1]}: left = ${left}, zeros = ${zeros}. Valid again.`,
        panels: [vArr(left, right, { [left - 1]: 'muted' }), vars({ zeros, best })],
      });
    }
    const before = best;
    best = Math.max(best, right - left + 1);
    if (right <= 3) growFrames.push({ say: 0, note: `${V[right]} enters: zeros = ${zeros}. Valid → length ${right - left + 1}, best = ${best}.`, panels: [vArr(left, right, { [right]: 'active' }), vars({ zeros, best })] });
    else growFrames.push({ say: 2, note: `Record after shrinking: length ${right - left + 1}, best ${before === best ? 'stays' : '='} ${best}.`, panels: [vArr(left, right, { [right]: 'active' }), vars({ zeros, best })] });
  }
}
// skip right = 2: it says the same as right = 3
const growShown = [growFrames[0], growFrames[1], ...growFrames.slice(3)];

export default [
  {
    id: 'fixed-window',
    title: 'Every window of size k for one add and one subtract',
    steps: [
      {
        kind: 'watch',
        title: 'The same middle, added again',
        lines: ['Best sum of **3 neighbouring numbers**.', 'Recomputing each window from zero costs O(k) per window: **O(n·k)** in total.'],
        frames: [
          { say: 0, note: 'e.g. nums = [3, −1, 4, 6, −2, 5], k = 3. Four windows of size 3.', panels: [arr(F, { label: 'nums, k = 3' })] },
          { say: 1, note: 'Windows [−1, 4, 6] and [4, 6, −2] share 4 and 6. Recomputing adds them both again.', panels: [fixedArr(1, 3, { 2: 'visited', 3: 'visited' }), fixedArr(2, 4, { 2: 'visited', 3: 'visited' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'In on the right, out on the left',
        lines: ['`windowSum += nums[right]`: one element enters.', 'Once `right >= k − 1` the window is full: record it.', 'From `right >= k` on, `nums[right − k]` leaves, so the size stays k.'],
        frames: slideFrames,
      },
      {
        kind: 'watch',
        title: 'Hear the fixed size',
        lines: ['Clues: **"subarray of size k"**, **"k consecutive elements"**, **"every window of length k"**.', 'Also **"anagram / permutation of p inside s"**: the window length is p.length.'],
        frames: [
          { say: 0, note: 'The length is given up front. Only the aggregate (sum, count, max…) of each window is asked.', panels: [vars({ 'window length': 'k, fixed', 'left moves': 'with right' })] },
          { say: 1, note: 'For anagrams the window state is a frequency map instead of a sum. Same slide.', panels: [vars({ 'window length': 'p.length', state: 'counts of the window' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: who leaves?',
        lines: ['`right` has moved to 5: the value **5** just entered.', 'The window must shrink back to **3** elements.'],
        panels: [fixedArr(2, 5, { 5: 'active' }, { pointers: [ptr(5, 'right', 'b')] }), vars({ right: 5, k: 3 })],
        task: {
          type: 'choose',
          question: 'Which element is subtracted now?',
          options: [
            { text: 'nums[right − k + 1] = nums[3] = 6', why: 'Index 3 stays inside the new window [3, 5]; this is the off-by-one the template warns about.' },
            { text: 'nums[right − k] = nums[2] = 4' },
            { text: 'nums[right − k − 1] = nums[1] = −1', why: '−1 already left one step earlier, when right was 4.' },
            { text: 'Nothing: windowSum just grows', why: 'Then the window would hold 4 elements, not k = 3.' },
          ],
          answer: 1,
        },
        solved: 'The element leaving is always **nums[right − k]**: one add and one subtract per step, O(n) overall.',
      },
    ],
  },

  {
    id: 'variable-window',
    title: 'Longest stretch that follows a rule: grow right, repair left',
    steps: [
      {
        kind: 'watch',
        title: 'Every start, every end',
        lines: ['Max consecutive 1s if you may **flip at most one 0**.', 'Checking every (start, end) pair is **O(n²)**.'],
        frames: [
          { say: 0, note: 'e.g. nums = [1, 0, 1, 1, 0, 0, 1], at most 1 zero may be flipped.', panels: [arr(V, { label: 'nums, flip ≤ 1 zero' })] },
          { say: 1, note: 'Each start re-scans to the right. Yet the rule is monotonic: more zeros never repair a window.', panels: [arr(V, { label: 'start = 1, try every end', pointers: [ptr(1, 'start')], range: [1, 6], highlights: win(V.length, 1, 6, { 1: 'active' }) }), vars({ pairs: 'O(n²)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Expand, shrink, record',
        lines: ['**Expand**: right always steps forward and adds `nums[right]`.', '**Shrink**: **while** zeros > 1, remove `nums[left]` and step left forward.', '**Record** only after shrinking: then [left, right] is valid.'],
        frames: growShown,
      },
      {
        kind: 'watch',
        title: 'Hear the rule',
        lines: ['Clues: **"longest substring"**, **"shortest subarray"**, **"at most K distinct"**, **"replace at most k"**, **"sum ≥ target"** with positive numbers.', 'With negative numbers and a sum rule, shrinking may **increase** the sum: not a window.'],
        frames: [
          { say: 0, note: 'Contiguous + longest/shortest + a rule tracked by a counter or a map → variable window.', panels: [vars({ rule: 'zeros ≤ 1', state: 'zeros counter', 'left moves': 'only to repair' })] },
          { say: 1, note: '[2, −1, 2]: removing −1 makes the sum go up, so "shrink while valid" is no longer safe.', panels: [arr([2, -1, 2], { label: 'negatives break it', highlights: { 1: 'bad' } })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: how far does left go?',
        lines: ['Right steps to 5 and another **0** enters.', 'The window [2, 5] now holds **2 zeros**: invalid.'],
        panels: [vArr(turnState.left, turnState.right, { [turnState.right]: 'bad' }), vars({ zeros: turnState.zeros, best: turnState.best })],
        task: {
          type: 'choose',
          question: 'After the shrink loop, where is left?',
          options: [
            { text: 'left = 3', why: 'That is one removal (an if): it drops a 1, and [3, 5] still holds 2 zeros.' },
            { text: 'left = 4', why: '[4, 5] is still 0, 0: two zeros. Keep shrinking.' },
            { text: 'left = 5' },
            { text: 'left = 0', why: 'Neither finger moves backwards; that is what keeps the run O(n).' },
          ],
          answer: 2,
        },
        solved: 'Shrink with **while**, not if: left passes 1, 1 and the 0 at index 4, so each index leaves at most once.',
      },
    ],
  },
];
