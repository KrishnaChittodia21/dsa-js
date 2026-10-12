export default {
  signals: [
    '"first missing positive" in O(n) time and O(1) space',
    '"find all numbers that appear twice" without extra memory',
    '"k-th permutation sequence" → factorial number system, not repeated next-permutation',
    '"maximum subarray sum with at most one deletion" → Kadane with two states',
    '"elements appearing more than ⌊n/3⌋ times" → two voting candidates',
    '"best time to buy and sell stock" → Kadane on day-to-day differences',
    '"return the subarray itself", not just its sum → track start/end in Kadane',
  ],
  tricks: [
    {
      title: 'Kadane with indices: remember where the restart happened',
      kind: 'template',
      md: 'When an interviewer wants the subarray, not just its sum, store a tentative `start` that moves to `i` whenever you restart (when `x` alone beats `cur + x`). On every new best, copy that tentative start and the current `i` as the answer bounds. Still one pass, O(1) space.',
      code: `function maxSubarray(a) {
  let cur = a[0], best = a[0], start = 0, bs = 0, be = 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] > cur + a[i]) { cur = a[i]; start = i; }
    else cur += a[i];
    if (cur > best) { best = cur; bs = start; be = i; }
  }
  return { best, sub: a.slice(bs, be + 1) };
}
console.log(maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // { best: 6, sub: [ 4, -1, 2, 1 ] }`,
    },
    {
      title: 'Stock profit is Kadane on differences',
      kind: 'recognition',
      md: 'Selling on day j after buying on day i earns `p[j] − p[i]`, which equals the sum of daily changes `p[k] − p[k−1]` between them. So the best single trade is the maximum subarray of the difference array (or 0 if every change is negative). Seeing this link lets you reuse Kadane for many "best gain over an interval" problems.',
      code: `function maxProfit(prices) {
  let cur = 0, best = 0;
  for (let i = 1; i < prices.length; i++) {
    cur = Math.max(0, cur + prices[i] - prices[i - 1]); // empty allowed → 0
    best = Math.max(best, cur);
  }
  return best;
}
console.log(maxProfit([7, 1, 5, 3, 6, 4]), maxProfit([7, 6, 4])); // 5 0`,
    },
    {
      title: 'Kadane with one deletion: carry two states',
      kind: 'template',
      md: 'Track `keep` = best sum ending at i with no deletion, and `del` = best sum ending at i with exactly one element deleted. `del` either deletes `a[i]` (take old `keep`) or extends an earlier deletion (`del + a[i]`). Compute the new `del` from the **old** `keep`. This "extra state per allowance" idea generalises to many Kadane variants.',
      code: `function maximumSum(a) {
  let keep = a[0], del = -Infinity, best = a[0];
  for (let i = 1; i < a.length; i++) {
    del = Math.max(keep, del + a[i]);     // uses old keep
    keep = Math.max(a[i], keep + a[i]);
    best = Math.max(best, keep, del);
  }
  return best;
}
console.log(maximumSum([1, -2, 0, 3]), maximumSum([-1, -1, -1])); // 4 -1`,
    },
    {
      title: 'First missing positive: cyclic sort that ignores out-of-range values',
      kind: 'recognition',
      md: 'The answer is always in 1..n + 1, so only values in 1..n matter. Swap each such value into slot `v − 1`; skip zeros, negatives, values above n and duplicates (when the home already holds v). Then the first slot `i` not holding `i + 1` gives the answer; if all match, it is n + 1.',
      code: `function firstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const j = nums[i] - 1;
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1;
  return n + 1;
}
console.log(firstMissingPositive([3, 4, -1, 1]), firstMissingPositive([1, 2, 0])); // 2 3`,
    },
    {
      title: 'Mark by adding n when you need counts, not just "seen"',
      kind: 'template',
      md: 'Negation stores one bit per slot. For values in 1..n you can store a **count**: add n to `nums[(v − 1) % n]` for every v. The original value stays recoverable as `((x − 1) % n) + 1`, and the number of hits on slot i is `Math.floor((nums[i] − 1) / n)`. Works even when you need "appears exactly twice / three times".',
      code: `function counts(nums) {
  const n = nums.length;
  for (const x of nums) nums[(x - 1) % n] += n; // (x - 1) % n recovers the original value - 1
  return nums.map((x) => Math.floor((x - 1) / n));
}
console.log(counts([4, 3, 2, 7, 8, 2, 3, 1])); // [ 1, 2, 2, 1, 0, 0, 1, 1 ]`,
    },
    {
      title: 'k-th permutation directly with factorials',
      kind: 'template',
      md: 'Calling next-permutation k times is O(k·n). Instead, each leading choice covers `(n − 1)!` permutations, so `Math.floor(k / (n − 1)!)` (with k zero-based) picks the first digit; repeat with the remainder. That is O(n²) with an array of remaining digits — tiny for n ≤ 9.',
      code: `function getPermutation(n, k) {
  const digits = Array.from({ length: n }, (_, i) => i + 1);
  const fact = [1];
  for (let i = 1; i < n; i++) fact[i] = fact[i - 1] * i;
  k--; // zero-based
  let out = '';
  for (let i = n - 1; i >= 0; i--) {
    const idx = Math.floor(k / fact[i]);
    out += digits.splice(idx, 1)[0];
    k %= fact[i];
  }
  return out;
}
console.log(getPermutation(3, 3), getPermutation(4, 9)); // 213 2314`,
    },
    {
      title: 'Majority by bit voting (32-bit ints)',
      kind: 'javascript',
      md: 'Another O(n)·32, O(1)-space majority method: for each bit, if more than half the numbers have it set, the majority has it set. In JS, bitwise operators work on 32-bit signed ints, so setting bit 31 yields a negative number — which is exactly right for negative inputs. Do not use it for values outside the 32-bit range.',
      code: `function majorityByBits(nums) {
  let res = 0;
  for (let b = 0; b < 32; b++) {
    let ones = 0;
    for (const x of nums) if ((x >> b) & 1) ones++;
    if (ones > nums.length / 2) res |= 1 << b;
  }
  return res;
}
console.log(majorityByBits([2, 2, 1, 1, 1, 2, 2]), majorityByBits([-5, -5, 3])); // 2 -5`,
    },
    {
      title: 'Restore the input after in-place marking',
      kind: 'interview',
      md: 'Index marking and cyclic sort mutate the caller\'s array. Ask whether that is allowed; if the interviewer hesitates, add a final pass that undoes the marks (`Math.abs`, or `((x − 1) % n) + 1` for the +n trick). It keeps O(1) space and shows you think about side effects.',
    },
    {
      title: 'Previous permutation is the mirror image',
      kind: 'recognition',
      md: 'Flip every comparison in next permutation: find the rightmost i with `a[i] > a[i + 1]`, swap it with the **largest value smaller than it** to its right (rightmost among equals for duplicates), then reverse the suffix. Useful for "largest permutation smaller than X with one swap" style questions.',
    },
  ],
  traps: [
    {
      looksLike: "Kadane for 'max sum of a subarray of exactly size k'",
      actually: 'Fixed sliding window',
      why: 'Kadane picks the best length freely; a fixed size just needs the running sum of k elements.',
    },
    {
      looksLike: 'Cyclic sort with home v − 1 for values 0..n',
      actually: 'Home v (or the sum / XOR formula for "missing number")',
      why: 'value 0 would map to index −1 and value n has no slot; shift the mapping or avoid sorting altogether.',
    },
    {
      looksLike: 'Boyer–Moore voting to find the most frequent element',
      actually: 'Frequency map (or bucket sort by count)',
      why: 'voting only guarantees a correct answer when one value has a strict majority; otherwise the survivor is arbitrary.',
    },
  ],
  sources: [
    { label: 'Wikipedia — Maximum subarray problem (Kadane)', url: 'https://en.wikipedia.org/wiki/Maximum_subarray_problem' },
    { label: 'Wikipedia — Boyer–Moore majority vote algorithm', url: 'https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_majority_vote_algorithm' },
    { label: 'Tech Interview Handbook — Array (index as hash key)', url: 'https://www.techinterviewhandbook.org/algorithms/array/' },
  ],
};
