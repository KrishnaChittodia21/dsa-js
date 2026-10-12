export default {
  id: 'wiggle-sort-ii',
  title: 'Wiggle Sort II',
  difficulty: 'Hard',
  order: 3,
  pattern: 'sorting-quick-sort',
  tags: ['array', 'quickselect', 'partition', 'sorting'],
  source: { platform: 'LeetCode', number: 324, url: 'https://leetcode.com/problems/wiggle-sort-ii/' },

  statement: `Rearrange the integer array \`nums\` **in place** so that

\`nums[0] < nums[1] > nums[2] < nums[3] > nums[4] …\`

(strict inequalities, alternating). The input is guaranteed to admit such an arrangement. Any valid arrangement is accepted. Return nothing — modify \`nums\`. (Rated Medium on LeetCode; the O(n)-time, O(1)-space follow-up makes it a Hard.)`,
  examples: [
    { input: 'nums = [1,5,1,1,6,4]', output: '[1,6,1,5,1,4]', explanation: '[1,4,1,5,1,6] is also accepted.' },
    { input: 'nums = [1,3,2,2,3,1]', output: '[2,3,1,3,1,2]' },
  ],
  constraints: ['1 <= nums.length <= 5 * 10^4', '0 <= nums[i] <= 5000', 'A valid answer always exists'],

  think: `- Split the values into a "small half" and a "large half". Where should each half go?
- Why is \`[1, 2, 2, 3]\` → \`1 2 2 3\` interleaved "in order" wrong? What happens to copies of the median?
- Do you need the full sorted order, or just the median?`,
  patternChallenge: {
    options: ['Sort + interleave the halves in reverse (or quickselect median + 3-way partition)', 'Greedy adjacent swaps', 'Sliding Window', 'Two heaps'],
    answer: 0,
    explanation: 'Small values go to even indices and large values to odd indices; the danger is equal median copies becoming neighbours, which reverse interleaving (or placing medians at the far ends via 3-way partition over virtual indices) avoids. Adjacent-swap greedy works for the non-strict version (Wiggle Sort I), not for strict inequalities with duplicates.',
  },
  hints: [
    'Easy version: sort a copy. Fill odd indices 1, 3, 5, … with the largest values going downwards, and even indices 0, 2, 4, … with the small half going downwards.',
    'O(n) version: find the median with quickselect, then 3-way partition around it — but over the *virtual* index order 1, 3, 5, …, 0, 2, 4, … given by `(1 + 2i) % (n | 1)`, so "large" fills odd slots and "small" fills even slots from the end.',
  ],
  approach: `**Sort + reverse interleave (O(n log n)):**
Sort a copy \`s\`. Let the small half be \`s[0..m)\` with \`m = ceil(n/2)\`, the large half \`s[m..n)\`. Write the small half **from its end** into indices 0, 2, 4, … and the large half **from its end** into 1, 3, 5, …

Reversing keeps copies of the median as far apart as possible: the median copies end up at the *start* of the evens and the *end* of the odds (or vice versa), never next to each other. Interleaving in forward order fails on \`[4, 5, 5, 6]\` → \`4 5 5 6\`.

**Quickselect + 3-way partition (O(n) average, O(1) extra):**
1. Quickselect the median (the value at sorted index \`n >> 1\`).
2. Dutch-flag partition with "larger than median" → front, "smaller" → back, but accessing \`nums[idx(i)]\` with \`idx(i) = (1 + 2i) % (n | 1)\`. The virtual front is the odd positions 1, 3, 5, …, then the evens 0, 2, 4, … So larger values fill the odd slots, smaller values fill the even slots from the end, and median copies land in the leftover slots — never adjacent.`,

  functionName: 'wiggleSort',
  paramNames: ['nums'],
  io: { mutates: 0 },
  starterCode: `/**
 * @param {number[]} nums
 * @return {void} Do not return anything, modify nums in-place instead.
 */
function wiggleSort(nums) {
  
}
`,
  checker: `(out, args) => {
    const input = args[0];
    if (!Array.isArray(out) || out.length !== input.length) return false;
    const a = [...out].sort((x, y) => x - y);
    const b = [...input].sort((x, y) => x - y);
    if (a.some((v, i) => v !== b[i])) return false;
    for (let i = 1; i < out.length; i++) {
      if (i % 2 === 1 ? !(out[i - 1] < out[i]) : !(out[i - 1] > out[i])) return false;
    }
    return true;
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement — any valid wiggle arrangement is accepted.', args: [[1,5,1,1,6,4]], expected: [1,6,1,5,1,4] },
    { scenario: 'Example 2', hint: 'From the statement: duplicates on both sides of the median.', args: [[1,3,2,2,3,1]], expected: [2,3,1,3,1,2] },
    { scenario: 'Single element', hint: 'A single element is trivially wiggled.', args: [[1]], expected: [1] },
    { scenario: 'Two elements', hint: 'The smallest case: nums[0] < nums[1].', args: [[2,1]], expected: [1,2] },
    { scenario: 'Median duplicates (even n)', hint: 'Interleaving the halves in forward order puts the two 5s next to each other (4 5 5 6) — interleave from the ends of each half.', args: [[4,5,5,6]], expected: [5,6,4,5] },
    { scenario: 'Strict inequality needed', hint: 'The Wiggle Sort I greedy (swap adjacent pairs) only guarantees ≤ / ≥, which fails here with many equal values.', args: [[1,1,2,1,2,2,1]], expected: [1,2,1,2,1,2,1] },
    { scenario: 'Odd length', hint: 'With odd n the small half has one more element than the large half.', args: [[5,3,1,2,6,7,8,5,5]], expected: [5,8,5,7,3,6,2,5,1] },
    { scenario: 'Many medians, even n', hint: 'Getting the virtual index wrong for even n: it must be % (n | 1), not % n.', args: [[4,5,5,5,5,6,6,6]], expected: [5,6,5,6,5,6,4,5] },
    { scenario: 'Already sorted input', hint: 'An ascending array must be rearranged in place.', args: [[1,2,3,4,5,6]], expected: [3,6,2,5,1,4] },
    { scenario: 'Reverse sorted input', hint: 'A descending array must be rearranged in place too.', args: [[6,5,4,3,2,1,0]], expected: [3,6,2,5,1,4,0] },
    { scenario: 'Zeros and maximum values', hint: 'Values range over 0..5000.', args: [[0,5000,0,5000,2500]], expected: [2500,5000,0,5000,0] },
    { scenario: 'Modify in place', hint: 'Returning a new array instead of modifying nums in place: the grader checks nums itself.', args: [[3,3,2,2,1,1]], expected: [2,3,1,3,1,2] },
    { scenario: 'Large input (n = 5·10^4)', hint: 'Full size with many median duplicates. Both O(n log n) sort + interleave and O(n) quickselect handle it.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); const a = []; for (let i = 0; i < 12500; i++) a.push(0, 2); for (let i = 0; i < 25000; i++) a.push(1); for (let i = a.length - 1; i > 0; i--) { const j = r() % (i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return [a]; }', expected: Array.from({ length: 50000 }, (_, i) => (i < 25000 ? (i % 2 ? 2 : 1) : (i % 2 ? 1 : 0))) },
  ],

  solution: {
    code: `function wiggleSort(nums) {
  const n = nums.length;
  if (n < 2) return;

  const swap = (i, j) => { const t = nums[i]; nums[i] = nums[j]; nums[j] = t; };

  // 1. Quickselect: value at sorted index n >> 1 (3-way partition, random pivot)
  const k = n >> 1;
  let lo = 0, hi = n - 1, median;
  while (true) {
    const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
    let lt = lo, i = lo, gt = hi;
    while (i <= gt) {
      if (nums[i] < pivot) swap(lt++, i++);
      else if (nums[i] > pivot) swap(i, gt--);
      else i++;
    }
    if (k < lt) hi = lt - 1;
    else if (k > gt) lo = gt + 1;
    else { median = pivot; break; }
  }

  // 2. 3-way partition over virtual indices: odd slots first, then even slots
  const idx = (i) => (1 + 2 * i) % (n | 1);
  let left = 0, cur = 0, right = n - 1;
  while (cur <= right) {
    const v = nums[idx(cur)];
    if (v > median) swap(idx(left++), idx(cur++));      // large → odd slots
    else if (v < median) swap(idx(cur), idx(right--));  // small → even slots from the end
    else cur++;                                         // median stays in the gap
  }
}`,
    explanation: '`n | 1` is n rounded up to the next odd number, which makes i ↦ (1 + 2i) % (n|1) a bijection onto 0..n−1 visiting 1, 3, 5, … then 0, 2, 4, …',
  },
  dryRun: {
    columns: ['step', 'nums'],
    rows: [
      ['input', '[1,5,1,1,6,4]'],
      ['median (sorted index 3)', 'sorted would be [1,1,1,4,5,6] → median = 4'],
      ['virtual order of indices', '1, 3, 5, 0, 2, 4'],
      ['large (5, 6) → slots 1, 3; median 4 → slot 5; small (1,1,1) → slots 4, 2, 0', '[1,6,1,5,1,4] (one possible result)'],
    ],
  },
  complexity: { time: 'O(n) average', space: 'O(1)', explanation: 'Quickselect is O(n) expected; the virtual-index partition is one pass. Only a few variables are used.' },
  alternative: {
    title: 'Sort + reverse interleave',
    md: 'Much easier to write and to explain; O(n log n) time and O(n) space.',
    code: `function wiggleSort(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const n = nums.length;
  let j = Math.ceil(n / 2) - 1;          // end of the small half
  let k = n - 1;                          // end of the large half
  for (let i = 0; i < n; i++) nums[i] = i % 2 === 0 ? s[j--] : s[k--];
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Interleaving the halves in forward order — median duplicates become neighbours ([4,5,5,6] → 4 5 5 6).',
    'Using the Wiggle Sort I greedy (swap adjacent pairs) — it only guarantees ≤ / ≥, not strict inequalities.',
    'Returning a new array instead of modifying nums in place.',
    'Getting the virtual index wrong for even n: it must be `% (n | 1)`, not `% n`.',
  ],
};
