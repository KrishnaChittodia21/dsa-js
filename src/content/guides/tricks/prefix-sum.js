export default {
  signals: [
    '"pivot / equilibrium index" (left sum equals right sum)',
    '"XOR of elements from l to r" / "subarrays with XOR k" → prefix XOR',
    '"how many vowels / odd numbers / 1s in range [l, r]" → prefix counts',
    '"every vowel appears an even number of times" → prefix parity bitmask',
    '"sum of all subarray sums" → per-element contribution',
    '"more X than Y" / "well-performing interval" → map to +1/−1',
    '"best value seen before i" (buy low, sell later) → running prefix min',
  ],
  tricks: [
    {
      title: 'Prefix counts answer "how many in [l, r]" for any predicate',
      kind: 'template',
      md: 'A prefix sum does not have to sum the raw values. Sum a 0/1 flag ("is this a vowel?", "is this odd?") and `cnt[r + 1] − cnt[l]` tells you how many matching items sit in any range in O(1). Build several flag arrays if you have several predicates.',
      code: `const isVowel = (ch) => 'aeiou'.includes(ch);
function vowelCounter(words) {
  const pre = [0];
  for (const w of words) pre.push(pre.at(-1) + (isVowel(w[0]) && isVowel(w.at(-1)) ? 1 : 0));
  return (l, r) => pre[r + 1] - pre[l];
}
const q = vowelCounter(['aba', 'bcb', 'ece', 'aa', 'e']);
console.log(q(0, 2), q(1, 4), q(1, 1)); // 2 3 0`,
    },
    {
      title: 'XOR is its own inverse — prefix XOR works like prefix sum',
      kind: 'template',
      md: 'Prefix sums need an operation you can undo. XOR undoes itself (`x ^ x = 0`), so `xor(l..r) = px[r + 1] ^ px[l]`. Counting subarrays with XOR equal to k is the same hash-map trick as sum = k: look up `cur ^ k` instead of `cur − k`.',
      code: `function countXorK(nums, k) {
  const seen = new Map([[0, 1]]);
  let cur = 0, count = 0;
  for (const x of nums) {
    cur ^= x;
    count += seen.get(cur ^ k) ?? 0;
    seen.set(cur, (seen.get(cur) ?? 0) + 1);
  }
  return count;
}
console.log(countXorK([4, 2, 2, 6, 4], 6)); // 4`,
    },
    {
      title: 'Pivot index without a prefix array',
      kind: 'optimization',
      md: 'You only need the total once. Walk left to right keeping `left`; the right side is `total − left − nums[i]`. Same O(n) time, O(1) space, and no off-by-one in a separate array.',
      code: `function pivotIndex(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i;
    left += nums[i];
  }
  return -1;
}
console.log(pivotIndex([1, 7, 3, 6, 5, 6]), pivotIndex([1, 2, 3])); // 3 -1`,
    },
    {
      title: 'Parity bitmask: "even counts" means equal prefix masks',
      kind: 'recognition',
      md: 'Keep one bit per tracked character and flip it on every occurrence. A substring has even counts of all of them exactly when the masks at its two ends are equal. Store the **first index** of each mask to get the longest such substring — the same "equal prefixes" idea as sum = 0, with XOR instead of +.',
      code: `function longestEvenVowels(s) {
  const bit = { a: 1, e: 2, i: 4, o: 8, u: 16 };
  const first = new Map([[0, -1]]);
  let mask = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    mask ^= bit[s[i]] ?? 0;
    if (first.has(mask)) best = Math.max(best, i - first.get(mask));
    else first.set(mask, i);
  }
  return best;
}
console.log(longestEvenVowels('eleetminicoworoep')); // 13`,
    },
    {
      title: 'Sum of all subarray sums by contribution',
      kind: 'recognition',
      md: 'Element `a[i]` appears in `(i + 1) × (n − i)` subarrays: (i + 1) choices of start, (n − i) choices of end. Multiply and add — O(n), no prefix array, no nested loops. The same counting powers "sum of subarray minimums" once you know each element\'s range.',
      code: `function sumOfSubarraySums(a) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += a[i] * (i + 1) * (a.length - i);
  return total;
}
console.log(sumOfSubarraySums([1, 2, 3])); // 20 = 1+2+3+3+5+6`,
    },
    {
      title: 'Running prefix minimum for "best earlier partner"',
      kind: 'recognition',
      md: 'A range-min cannot be subtracted out, but a **prefix** min from the start is perfectly valid. When the answer pairs index j with the best index i < j (buy before sell, max a[j] − a[i]), carry the minimum seen so far in one variable and compare as you go.',
      code: `function maxProfit(prices) {
  let minSoFar = Infinity, best = 0;
  for (const p of prices) {
    best = Math.max(best, p - minSoFar);
    minSoFar = Math.min(minSoFar, p);
  }
  return best;
}
console.log(maxProfit([7, 1, 5, 3, 6, 4])); // 5`,
    },
    {
      title: 'Know when sums stop being exact in JS',
      kind: 'javascript',
      md: 'Numbers are 64-bit floats: integers are exact only up to `Number.MAX_SAFE_INTEGER` (2^53 − 1 ≈ 9·10^15). 10^5 values of 10^9 sum to 10^14 — safe. Products, squared sums or "sum of all subarray sums" can overflow that; switch to `BigInt` or take the modulo after every step. Never use `Int32Array` for sums that can pass 2^31.',
      code: `const big = Number.MAX_SAFE_INTEGER;
console.log(big + 1 === big + 2);       // true — precision lost
console.log(BigInt(big) + 1n === BigInt(big) + 2n); // false
const MOD = 1_000_000_007;
let s = 0;
for (let i = 0; i < 5; i++) s = (s + 999_999_999) % MOD;
console.log(s); // 999999967`,
    },
    {
      title: 'Small key range? Use an array instead of a Map',
      kind: 'optimization',
      md: 'For "subarray sums divisible by k" the keys are remainders 0..k − 1, so a `new Int32Array(k)` replaces the hash map: no hashing, no `?? 0`. Likewise a parity mask of 5 vowels has only 32 values. Fall back to `Map` when the key range is large or unknown.',
      code: `function subarraysDivByK(nums, k) {
  const cnt = new Int32Array(k);
  cnt[0] = 1;
  let cur = 0, total = 0;
  for (const x of nums) {
    cur = (((cur + x) % k) + k) % k;
    total += cnt[cur]++;
  }
  return total;
}
console.log(subarraysDivByK([4, 5, 0, -2, -3, 1], 5)); // 7`,
    },
    {
      title: 'Mention the update limitation',
      kind: 'interview',
      md: 'Prefix sums assume a static array: one point update forces an O(n) rebuild. If the interviewer adds "and values can change", say so immediately and switch to a Fenwick tree (binary indexed tree) or segment tree for O(log n) update and query.',
    },
  ],
  traps: [
    {
      looksLike: 'Prefix array for range-minimum queries',
      actually: 'Sparse table or segment tree',
      why: 'min has no inverse — you cannot "subtract" the minimum of the left part to get the minimum of the middle.',
    },
    {
      looksLike: 'Prefix sum + hash map for "subarray sum ≥ k"',
      actually: 'Sliding window (positives) or monotonic deque (negatives)',
      why: 'a hash map finds exact matches only; an inequality needs order between prefix values.',
    },
    {
      looksLike: 'Prefix sums when the array keeps changing',
      actually: 'Fenwick tree / segment tree',
      why: 'each point update invalidates every later prefix, costing O(n) per update.',
    },
  ],
  sources: [
    { label: 'USACO Guide — Introduction to Prefix Sums', url: 'https://usaco.guide/silver/prefix-sums' },
    { label: 'Tech Interview Handbook — Array (precomputation)', url: 'https://www.techinterviewhandbook.org/algorithms/array/' },
    { label: 'MDN — Number.MAX_SAFE_INTEGER', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER' },
  ],
};
