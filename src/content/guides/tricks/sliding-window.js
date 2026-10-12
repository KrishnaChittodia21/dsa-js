export default {
  signals: [
    '"at most k flips / replacements / deletions" in a contiguous stretch',
    '"longest repeating character replacement" → window length − maxFreq ≤ k',
    '"permutation / anagram of p inside s" → fixed window of length |p|',
    '"fruit into baskets" (at most 2 kinds) → at most K distinct',
    '"count the subarrays where …" with a monotonic rule → add right − left + 1',
    '"remove from the left or right end to reach x" → longest middle window',
    '"number of subarrays with product < k" (positive values)',
  ],
  tricks: [
    {
      title: 'Ask the monotonicity question first',
      kind: 'recognition',
      md: 'A variable window works only if **shrinking a valid window keeps it valid** (for "longest") or **growing a valid window keeps it valid** (for "shortest"). Check it on the problem in one sentence before coding. "Sum ≤ k with positive numbers" passes; "sum = k with negatives" fails, so use prefix sums instead.',
    },
    {
      title: 'Counting windows: add right − left + 1',
      kind: 'template',
      md: 'Once the window `[left, right]` is valid, every subarray that ends at `right` and starts anywhere in `[left, right]` is also valid (they are shrunk versions of it). So each step contributes `right − left + 1` subarrays. This counts "subarrays with product < k", "at most K distinct", etc. in O(n).',
      code: `function numSubarrayProductLessThanK(nums, k) {
  if (k <= 1) return 0;
  let left = 0, prod = 1, count = 0;
  for (let right = 0; right < nums.length; right++) {
    prod *= nums[right];
    while (prod >= k) prod /= nums[left++];
    count += right - left + 1;
  }
  return count;
}
console.log(numSubarrayProductLessThanK([10, 5, 2, 6], 100)); // 8`,
    },
    {
      title: 'Record "shortest" inside the shrink loop, "longest" after it',
      kind: 'template',
      md: 'For the **shortest** valid window, shrink *while the window is valid* and record the length inside that loop — each shrink step is a valid candidate. For the **longest** valid window, shrink *while invalid* and record after the loop, once validity is restored. Mixing the two phases is the most common wrong-answer bug.',
      code: `function minSubArrayLen(target, nums) {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1); // valid → record, then shrink
      sum -= nums[left++];
    }
  }
  return best === Infinity ? 0 : best;
}
console.log(minSubArrayLen(7, [2, 3, 1, 2, 4, 3])); // 2`,
    },
    {
      title: 'Anagram windows: track one "matches" counter, not two maps',
      kind: 'optimization',
      md: 'Comparing two 26-entry count arrays at every step costs 26 per step. Instead keep `need[c]` = how many more of `c` the window still needs, plus a single `missing` total. A character entering decrements `need`; leaving increments it. The window is an anagram exactly when `missing === 0`. Typed arrays indexed by `charCodeAt` beat a Map here.',
      code: `function findAnagrams(s, p) {
  const need = new Int32Array(26), out = [];
  for (const ch of p) need[ch.charCodeAt(0) - 97]++;
  let missing = p.length;
  for (let r = 0; r < s.length; r++) {
    if (need[s.charCodeAt(r) - 97]-- > 0) missing--;
    const l = r - p.length; // index leaving the window
    if (l >= 0 && ++need[s.charCodeAt(l) - 97] > 0) missing++;
    if (missing === 0) out.push(l + 1);
  }
  return out;
}
console.log(findAnagrams('cbaebabacd', 'abc')); // [ 0, 6 ]`,
    },
    {
      title: 'Let the window slide instead of shrink (non-shrinking window)',
      kind: 'optimization',
      md: 'When you only need the **maximum length**, the window never has to get smaller: if it becomes invalid, move `left` by one together with `right`, keeping the size. In "longest repeating character replacement" this means `maxFreq` may stay stale (never decreased) — a stale value can only keep the window from growing, never give a wrong larger answer.',
      code: `function characterReplacement(s, k) {
  const cnt = new Int32Array(26);
  let left = 0, maxFreq = 0;
  for (let right = 0; right < s.length; right++) {
    maxFreq = Math.max(maxFreq, ++cnt[s.charCodeAt(right) - 65]);
    if (right - left + 1 - maxFreq > k) cnt[s.charCodeAt(left++) - 65]--;
  }
  return s.length - left; // final window size is the best size
}
console.log(characterReplacement('AABABBA', 1)); // 4`,
    },
    {
      title: 'Removing from both ends = keeping a middle window',
      kind: 'recognition',
      md: '"Remove elements from the left or right end so the removed sum is exactly x, using the fewest operations" looks like a two-ended search. Flip it: what remains is one contiguous middle subarray with sum `total − x`, and you want it as **long** as possible. With positive values that is a plain variable window.',
      code: `function minOperations(nums, x) {
  const goal = nums.reduce((a, b) => a + b, 0) - x;
  if (goal < 0) return -1;
  let left = 0, sum = 0, longest = -1;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum > goal) sum -= nums[left++];
    if (sum === goal) longest = Math.max(longest, right - left + 1);
  }
  return longest === -1 ? -1 : nums.length - longest;
}
console.log(minOperations([3, 2, 20, 1, 1, 3], 10)); // 5`,
    },
    {
      title: 'Jump left with a last-seen index — but never backwards',
      kind: 'edge-cases',
      md: 'For "longest substring without repeating characters" you can store each character\'s last index and jump `left = last + 1` instead of shrinking one step at a time. Always take `Math.max(left, last + 1)`: an old occurrence that is already outside the window would otherwise move `left` backwards ("abba" breaks without it).',
      code: `function lengthOfLongestSubstring(s) {
  const last = new Map();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    if (last.has(s[right])) left = Math.max(left, last.get(s[right]) + 1);
    last.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(lengthOfLongestSubstring('abba'), lengthOfLongestSubstring('pwwkew')); // 2 3`,
    },
    {
      title: 'Guard fixed windows against k > n and k ≤ 0',
      kind: 'edge-cases',
      md: 'A fixed-size window over an array shorter than k has no valid window at all; returning the partial sum is wrong. Decide up front what "no window" means (0, −Infinity, empty list) and return it before the loop. Also check the very first full window (right = k − 1) is recorded, not skipped.',
    },
    {
      title: 'State the template in three questions',
      kind: 'interview',
      md: 'Before coding, say out loud: (1) what enters the window and how the state updates, (2) when the window must shrink, (3) where the answer is recorded. Interviewers hear a plan, and you catch "if vs while" and "record before valid" bugs before writing them.',
    },
  ],
  traps: [
    {
      looksLike: 'Sliding window for "longest increasing subsequence"',
      actually: 'DP or patience sorting',
      why: 'a subsequence may skip elements, so there is no contiguous window to slide.',
    },
    {
      looksLike: 'Variable window for "shortest subarray with sum ≥ k" when negatives exist',
      actually: 'Monotonic deque over prefix sums',
      why: 'a negative value can make a longer window smaller, so shrinking from the left is not safe.',
    },
    {
      looksLike: 'Window keeping a single max variable for "max − min ≤ limit"',
      actually: 'Two monotonic deques (max and min)',
      why: 'when the current max leaves the window you need the next max instantly; one variable cannot provide it.',
    },
  ],
  sources: [
    { label: 'labuladong — Sliding window algorithm code template', url: 'https://labuladong.online/algo/en/essential-technique/sliding-window-framework/' },
    { label: 'USACO Guide — Two Pointers (why each pointer moves ≤ n times)', url: 'https://usaco.guide/silver/two-pointers' },
  ],
};
