export default {
  signals: [
    '"squares of a sorted array" / sorted input with negatives → biggest values sit at the ends',
    '"is subsequence" → one pointer per sequence, advance on match',
    '"count pairs with sum < target" → add a whole block of pairs at once',
    '"boats" / "pair heaviest with lightest" under a limit',
    '"minimum difference between elements of two arrays" → sort both, advance the smaller',
    '"backspace string compare" in O(1) space → walk both strings from the end',
    '"reverse only the vowels/letters" → pointers that skip non-targets',
  ],
  tricks: [
    {
      title: 'Count a whole block of pairs in one step',
      kind: 'template',
      md: 'In a sorted array, if `a[l] + a[r] < target` then `a[l]` also works with every index between l and r (those values are ≤ a[r]). So add `r − l` pairs at once and move `l`. This turns "count pairs with sum < target" (and the triangle-count problem) into O(n) after sorting instead of O(n²).',
      code: `function countPairsLess(nums, target) {
  const a = [...nums].sort((x, y) => x - y);
  let l = 0, r = a.length - 1, count = 0;
  while (l < r) {
    if (a[l] + a[r] < target) { count += r - l; l++; }
    else r--;
  }
  return count;
}
console.log(countPairsLess([-1, 1, 2, 3, 1], 2)); // 3`,
    },
    {
      title: 'Fill the result from the back when extremes live at both ends',
      kind: 'recognition',
      md: 'For a sorted array with negatives, the largest square is at the left or right end — never in the middle. Compare the two ends, write the larger square into the **last free slot** of the output, and move that pointer inward. Same idea as merging sorted arrays from the back.',
      code: `function sortedSquares(a) {
  const out = new Array(a.length);
  let l = 0, r = a.length - 1;
  for (let w = a.length - 1; w >= 0; w--) {
    if (Math.abs(a[l]) > Math.abs(a[r])) out[w] = a[l] * a[l++];
    else out[w] = a[r] * a[r--];
  }
  return out;
}
console.log(sortedSquares([-4, -1, 0, 3, 10])); // [ 0, 1, 9, 16, 100 ]`,
    },
    {
      title: 'Subsequence check: greedy pointer on the shorter string',
      kind: 'template',
      md: 'Walk the long string once and advance the pointer into the short string only when characters match. Matching as early as possible is always safe because it leaves the most room for the rest. O(n + m), no extra space; for many queries against one long string, precompute positions and binary search instead.',
      code: `function isSubsequence(s, t) {
  let i = 0;
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}
console.log(isSubsequence('ace', 'abcde'), isSubsequence('aec', 'abcde')); // true false`,
    },
    {
      title: 'Greedy pairing: heaviest with lightest',
      kind: 'recognition',
      md: 'When items must be paired under a limit (boats, teams, pairs with sum ≤ cap), sort, then try to pair the heaviest remaining item with the lightest. If even the lightest does not fit, the heaviest goes alone — no other partner could help it. Each step settles at least one item, so it is O(n log n) for the sort plus O(n).',
      code: `function numBoats(people, limit) {
  const a = [...people].sort((x, y) => x - y);
  let l = 0, r = a.length - 1, boats = 0;
  while (l <= r) {
    if (a[l] + a[r] <= limit) l++; // lightest rides along
    r--;                           // heaviest always leaves
    boats++;
  }
  return boats;
}
console.log(numBoats([3, 2, 2, 1], 3)); // 3`,
    },
    {
      title: 'Two sorted arrays: always advance the smaller side',
      kind: 'template',
      md: 'To find the closest pair across two arrays (or their intersection), sort both and keep one pointer in each. Moving the pointer at the smaller value is the only move that can bring the values closer; moving the larger one can only widen the gap. O(n log n + m log m).',
      code: `function minDiff(a, b) {
  a = [...a].sort((x, y) => x - y);
  b = [...b].sort((x, y) => x - y);
  let i = 0, j = 0, best = Infinity;
  while (i < a.length && j < b.length) {
    best = Math.min(best, Math.abs(a[i] - b[j]));
    if (a[i] < b[j]) i++; else j++;
  }
  return best;
}
console.log(minDiff([1, 3, 15, 11, 2], [23, 127, 235, 19, 8])); // 3`,
    },
    {
      title: 'Need original indices? Sort an index array',
      kind: 'javascript',
      md: 'Sorting the values destroys their positions. Sort an array of indices with a comparator that looks up the values: `idx.sort((i, j) => a[i] - a[j])`. Then run two pointers over `idx` and report `idx[l]`, `idx[r]`. Remember `sort()` without a comparator compares as strings.',
      code: `const a = [3, 2, 4];
const target = 6;
const idx = a.map((_, i) => i).sort((i, j) => a[i] - a[j]);
let l = 0, r = idx.length - 1;
while (l < r) {
  const s = a[idx[l]] + a[idx[r]];
  if (s === target) break;
  s < target ? l++ : r--;
}
console.log([idx[l], idx[r]].sort((x, y) => x - y)); // [ 1, 2 ]`,
    },
    {
      title: 'Skip non-targets with inner while loops guarded by l < r',
      kind: 'edge-cases',
      md: 'For "valid palindrome ignoring punctuation" or "reverse only vowels", each pointer skips characters that do not count. Guard every inner skip with `l < r`, otherwise a string of only punctuation runs a pointer past the other (or off the array). Compare with a lower-cased character, not the raw one.',
      code: `const isAlnum = (ch) => /[a-z0-9]/i.test(ch);
function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !isAlnum(s[l])) l++;
    while (l < r && !isAlnum(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}
console.log(isPalindrome('A man, a plan, a canal: Panama'), isPalindrome('.,')); // true true`,
    },
    {
      title: 'Walk from the end when later characters cancel earlier ones',
      kind: 'recognition',
      md: 'In "backspace string compare", a `#` deletes what came *before* it, so scanning forward needs a stack. Scanning **backwards** you already know how many characters to skip: keep a skip counter per string and compare the next surviving characters. O(n) time, O(1) space.',
    },
    {
      title: 'Prune k-Sum loops with min/max bounds',
      kind: 'optimization',
      md: 'In sorted 3Sum/4Sum, if the smallest possible sum using `a[i]` (a[i] plus the next k − 1 values) already exceeds the target, `break` — later i only get bigger. If the largest possible sum (a[i] plus the last k − 1 values) is still below target, `continue`. Same Big-O, but it often removes most of the work on real inputs.',
    },
  ],
  traps: [
    {
      looksLike: 'Two pointers for Two Sum on an unsorted array',
      actually: 'Hash map of complements',
      why: 'sorting costs O(n log n) and loses the original indices; a single pass with a Map is O(n).',
    },
    {
      looksLike: 'Opposite-end pointers for "longest palindromic substring"',
      actually: 'Expand around each center',
      why: 'the palindrome can be anywhere; you do not know its ends, only that it grows symmetrically from a center (2n − 1 centers).',
    },
    {
      looksLike: 'Two pointers for "count subarrays with sum = k"',
      actually: 'Prefix sum + hash map',
      why: 'with negative numbers, moving a pointer does not change the sum in a predictable direction.',
    },
  ],
  sources: [
    { label: 'USACO Guide — Two Pointers', url: 'https://usaco.guide/silver/two-pointers' },
    { label: 'Tech Interview Handbook — Array cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/array/' },
    { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
  ],
};
