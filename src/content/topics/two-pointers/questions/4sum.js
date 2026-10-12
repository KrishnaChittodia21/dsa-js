export default {
  id: '4sum',
  title: '4Sum',
  difficulty: 'Medium',
  order: 7,
  pattern: 'sort-two-pointers-ksum',
  tags: ['array', 'two pointers', 'sorting'],
  source: { platform: 'LeetCode', number: 18, url: 'https://leetcode.com/problems/4sum/' },

  statement: `Given an integer array \`nums\` and an integer \`target\`, return **all unique quadruplets** \`[nums[a], nums[b], nums[c], nums[d]]\` with four distinct indices whose sum equals \`target\`.

The order of the quadruplets (and of the values inside each) does not matter, but the same set of four values must not appear twice.`,
  examples: [
    { input: 'nums = [1,0,-1,0,-2,2], target = 0', output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]' },
    { input: 'nums = [2,2,2,2,2], target = 8', output: '[[2,2,2,2]]' },
  ],
  constraints: ['1 <= nums.length <= 200', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],

  think: `- 3Sum = one loop + a pair search. What is 4Sum?
- Where do you need duplicate skipping now — how many levels?
- Could the sum of four values be too large for a 32-bit integer? Is that a problem in JavaScript?`,
  patternChallenge: {
    options: ['Sort + Two Pointers (two outer loops)', 'Hash Map of pair sums only', 'Backtracking without pruning', 'Sliding Window'],
    answer: 0,
    explanation: 'Fix two values with loops and solve the remaining pair with two pointers → O(n³). A pair-sum hash map can reach O(n²) average but de-duplicating quadruplets and avoiding index reuse is intricate; backtracking is O(n⁴) without the sorted pruning.',
  },
  hints: [
    'Sort. Loop `i`, then `j > i`, then two pointers on `nums[j+1..]` for `target - nums[i] - nums[j]`.',
    'Skip duplicates at every level: `i` (vs `i-1`), `j` (vs `j-1`, but only when `j > i + 1`), and `l`/`r` after a hit.',
  ],
  approach: `**Brute force:** four loops, O(n⁴).

**Sort + two pointers (O(n³)):** this is kSum with k = 4:
- outer loop \`i\`, skip if \`nums[i] === nums[i − 1]\`;
- inner loop \`j\` from \`i + 1\`, skip if \`j > i + 1 && nums[j] === nums[j − 1]\`;
- pair search on \`[j + 1, n − 1]\`; on a hit, record and skip duplicate \`l\`/\`r\`.

**Pruning (optional):** if the smallest possible sum with the current \`i\` exceeds target, break; if the largest is below, continue.

**JavaScript note:** values up to 10^9 → sums up to 4·10^9, beyond 32-bit but far below \`Number.MAX_SAFE_INTEGER\` (≈ 9·10^15), so plain numbers are exact.`,

  functionName: 'fourSum',
  paramNames: ['nums', 'target'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[][]}
 */
function fourSum(nums, target) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: three quadruplets, and the two 0s must not create duplicates.', args: [[1, 0, -1, 0, -2, 2], 0], expected: [[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]] },
    { scenario: 'Example 2', hint: 'Five equal values give one quadruplet. Skipping j duplicates with `j > 0` instead of `j > i + 1` loses it.', args: [[2, 2, 2, 2, 2], 8], expected: [[2, 2, 2, 2]] },
    { scenario: 'Fewer than four numbers', hint: 'With only three numbers no quadruplet exists — return [] without reading past the end.', args: [[1, 2, 3], 6], expected: [] },
    { scenario: 'Single element', hint: 'The smallest allowed input: one number can never form a quadruplet.', args: [[5], 5], expected: [] },
    { scenario: 'Exactly four, no match', hint: 'One candidate quadruplet whose sum is not the target.', args: [[0, 0, 0, 0], 1], expected: [] },
    { scenario: 'Exactly four, match', hint: 'The whole array is the answer. Your loops must still visit i = 0, j = 1, l = 2, r = 3.', args: [[4, -1, 3, -6], 0], expected: [[-6, -1, 3, 4]] },
    { scenario: 'Overflow trap', hint: '4·10^9 wraps to -294967296 in 32-bit arithmetic, but JS numbers are exact here — the sum is not the target.', args: [[1000000000, 1000000000, 1000000000, 1000000000], -294967296], expected: [] },
    { scenario: 'Extreme values match', hint: 'Large magnitudes cancel out exactly: 10^9 + 10^9 - 10^9 - 10^9 = 0.', args: [[1000000000, -1000000000, 1000000000, -1000000000, 7], 0], expected: [[-1000000000, -1000000000, 1000000000, 1000000000]] },
    { scenario: 'Target adjusted for two fixed', hint: 'After fixing i and j, the pair must sum to target - nums[i] - nums[j]. Reusing 3Sum code with the plain target finds the wrong pairs.', args: [[-3, -1, 0, 2, 4, 5], 2], expected: [[-3, -1, 2, 4]] },
    { scenario: 'Duplicates at every level', hint: 'Repeated values at i, j, l and r: skip duplicates at all four positions.', args: [[-2, -1, -1, 1, 1, 2, 2], 0], expected: [[-2, -1, 1, 2], [-1, -1, 1, 1]] },
    { scenario: 'Negative target', hint: 'The target can be negative; the pointer logic is the same.', args: [[-5, -4, -3, -2, 1, 2], -10], expected: [[-5, -4, -3, 2], [-5, -4, -2, 1]] },
    { scenario: 'Unsorted input', hint: 'Sort a copy with a numeric comparator first — default sort compares as strings.', args: [[10, -20, 5, 3, -1, 30, -7], 15], expected: [] },
    { scenario: 'Largest n (200), no answer', hint: 'All values are even and the target is odd, so nothing matches. Biggest allowed input: sort + two pointers keeps this O(n³).', argsGen: '() => { let s = 5; const a = Array.from({ length: 200 }, () => { s = (s * 48271) % 2147483647; return (s % 1000000) * 2 + (-1000000); }); return [a, 1]; }', expected: [] },
    { scenario: 'Largest n, many matches', hint: 'Small values with many repeats: lots of quadruplets, and every duplicate must be skipped.', argsGen: '() => { let s = 9; const a = Array.from({ length: 200 }, () => { s = (s * 48271) % 2147483647; return (s % 7) * 1 + (-3); }); return [a, 9]; }', expected: [[0, 3, 3, 3], [1, 2, 3, 3], [2, 2, 2, 3]] },
  ],

  solution: {
    code: `function fourSum(nums, target) {
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length, result = [];
  for (let i = 0; i < n - 3; i++) {
    if (i > 0 && a[i] === a[i - 1]) continue;
    for (let j = i + 1; j < n - 2; j++) {
      if (j > i + 1 && a[j] === a[j - 1]) continue;
      const need = target - a[i] - a[j];
      let l = j + 1, r = n - 1;
      while (l < r) {
        const sum = a[l] + a[r];
        if (sum < need) l++;
        else if (sum > need) r--;
        else {
          result.push([a[i], a[j], a[l], a[r]]);
          l++;
          r--;
          while (l < r && a[l] === a[l - 1]) l++;
          while (l < r && a[r] === a[r + 1]) r--;
        }
      }
    }
  }
  return result;
}`,
    explanation: 'The `j > i + 1` guard matters: the first `j` after `i` may equal `a[i]` legitimately (e.g. [2,2,2,2]); only later repeats of the same `j` value are duplicates.',
  },
  dryRun: {
    columns: ['i, j', 'a[i], a[j]', 'need', 'pairs found'],
    rows: [
      ['0, 1', '-2, -1', '3', '(1, 2) → [-2,-1,1,2]'],
      ['0, 2', '-2, 0', '2', '(0, 2) → [-2,0,0,2]'],
      ['0, 3', '-2, 0', '—', 'duplicate j → skip'],
      ['1, 2', '-1, 0', '1', '(0, 1) → [-1,0,0,1]'],
    ],
    note: 'Sorted: [-2, -1, 0, 0, 1, 2], target 0.',
  },
  complexity: { time: 'O(n³)', space: 'O(n)', explanation: 'Two nested loops times a linear pair search; the sorted copy is O(n).' },
  alternative: {
    title: 'Recursive kSum',
    md: 'Write `kSum(start, k, target)`: if k === 2 run two pointers, otherwise loop i from start (skipping duplicates) and recurse with k − 1. Handles 3Sum, 4Sum, 5Sum… with one function.',
    code: `function fourSum(nums, target) {
  const a = [...nums].sort((x, y) => x - y);
  function kSum(start, k, t) {
    const res = [];
    if (k === 2) {
      let l = start, r = a.length - 1;
      while (l < r) {
        const s = a[l] + a[r];
        if (s < t || (l > start && a[l] === a[l - 1])) l++;
        else if (s > t) r--;
        else res.push([a[l++], a[r--]]);
      }
      return res;
    }
    for (let i = start; i < a.length - k + 1; i++) {
      if (i > start && a[i] === a[i - 1]) continue;
      for (const rest of kSum(i + 1, k - 1, t - a[i])) res.push([a[i], ...rest]);
    }
    return res;
  }
  return kSum(0, 4, target);
}`,
    complexity: 'O(n^(k−1)) time',
  },
  mistakes: [
    'Skipping `j` duplicates with `j > 0` instead of `j > i + 1` — loses [2,2,2,2].',
    'Worrying about overflow in JS — not an issue here, but mention it for Java/C++.',
    'Reusing 3Sum code without adjusting the target for two fixed values.',
  ],
};
