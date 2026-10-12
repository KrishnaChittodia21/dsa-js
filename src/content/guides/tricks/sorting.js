export default {
  signals: [
    '"minimum difference between any two elements" → sort, then only adjacent pairs matter',
    '"relative order of equal elements must be kept" → you need a stable sort',
    '"sort by frequency" / "sort by custom rank" → Map of counts + comparator',
    'you need the ORIGINAL positions after ordering → sort an index array',
    'numbers given as strings longer than 15 digits',
    '"arrange the elements to form the largest / smallest …"',
    'values are tiny (letters, 0–100) while n is huge → count, do not compare',
  ],
  tricks: [
    {
      title: 'Sort indices, not values, when positions matter',
      kind: 'template',
      md: "Sorting the values destroys where they came from. Build `[0, 1, …, n−1]` and sort it with a comparator that looks the values up. You get the sorted order AND the original index of every element, without allocating `[value, index]` pairs. Typical uses: two-sum returning indices, ranking, “how many smaller elements to the right”.",
      code: `const nums = [30, 10, 20];
const idx = nums.map((_, i) => i).sort((a, b) => nums[a] - nums[b]);
console.log(idx); // → [1,2,0]
const rank = new Array(nums.length);
idx.forEach((orig, r) => (rank[orig] = r + 1));
console.log(rank); // → [3,1,2]`,
    },
    {
      title: 'Use a stable sort for multi-key ordering in passes',
      kind: 'javascript',
      md: "Since ES2019 `Array.prototype.sort` is guaranteed stable (V8 uses TimSort). So you can sort by the SECONDARY key first and then by the PRIMARY key: ties on the primary key keep the order from the first pass. This is handy when keys come from different places or when a single comparator would get messy.",
      code: `const people = [{ n: 'b', a: 30 }, { n: 'c', a: 25 }, { n: 'a', a: 25 }];
people.sort((x, y) => (x.n < y.n ? -1 : x.n > y.n ? 1 : 0)); // secondary: name
people.sort((x, y) => x.a - y.a);                           // primary: age
console.log(people.map((p) => p.n).join('')); // → acb`,
    },
    {
      title: 'Precompute expensive keys (decorate – sort – undecorate)',
      kind: 'optimization',
      md: "The comparator runs about n·log₂n times, so anything costly inside it (toLowerCase, counting, regex, Map lookups that build strings) is repeated many times per element. Compute each key once, sort the `[key, item]` pairs, then strip the keys. For plain ASCII comparison prefer `<` / `>` over `localeCompare`, which is slower and depends on the locale.",
      code: `const words = ['banana', 'Apple', 'cherry'];
const sorted = words
  .map((w) => [w.toLowerCase(), w])
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  .map(([, w]) => w);
console.log(sorted); // → ["Apple","banana","cherry"]`,
    },
    {
      title: 'BigInt and huge numeric strings need their own comparator',
      kind: 'javascript',
      md: "`(a, b) => a - b` on BigInts returns a BigInt, and sort throws “Cannot convert a BigInt value to a number”. Return -1/0/1 explicitly instead. Numbers stored as strings (longer than 15–16 digits, too big for Number) compare correctly by length first, then lexicographically — as long as there are no leading zeros or signs.",
      code: `const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
console.log([3n, 1n, 10n].sort(cmp).join(' ')); // → 1 3 10
const big = ['100', '9', '25', '1000000000000000000001'];
big.sort((a, b) => a.length - b.length || cmp(a, b));
console.log(big.join(' ')); // → 9 25 100 1000000000000000000001`,
    },
    {
      title: 'After sorting, the interesting pair is usually adjacent',
      kind: 'recognition',
      md: "In sorted order, the closest value to `a[i]` is `a[i−1]` or `a[i+1]`; equal values sit next to each other; and anagrams share the same sorted letters. So “minimum gap”, “contains duplicate”, “group anagrams” and “closest pair” all become one linear scan after an O(n log n) sort — no nested loop needed.",
      code: `function minGap(nums) {
  const s = nums.toSorted((a, b) => a - b);
  let best = Infinity;
  for (let i = 1; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);
  return best;
}
console.log(minGap([40, 1, 17, 22, 5])); // → 4`,
    },
    {
      title: 'Never shuffle with sort(() => Math.random() - 0.5)',
      kind: 'edge-cases',
      md: "A random comparator is inconsistent (it can say a < b and b < a), which the spec treats as implementation-defined: the result is biased and differs between engines. To randomise input for quickselect/quicksort or tests, use Fisher–Yates: walk from the end and swap each position with a uniformly random earlier-or-equal position. It is O(n) and every permutation is equally likely.",
      code: `function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
console.log(shuffle([1, 2, 3, 4, 5]).toSorted((a, b) => a - b)); // → [1,2,3,4,5]`,
    },
    {
      title: 'Bucket by count when the count is bounded by n',
      kind: 'optimization',
      md: "Frequencies are integers between 1 and n, so “sort by frequency” or “top k frequent” can use an array of n + 1 buckets instead of a comparison sort: O(n) instead of O(n log n). The same idea works for any key with a small integer range (ages, scores, string lengths).",
      code: `function topKFrequent(nums, k) {
  const freq = new Map();
  for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [x, f] of freq) buckets[f].push(x);
  const out = [];
  for (let f = nums.length; f > 0 && out.length < k; f--) out.push(...buckets[f]);
  return out.slice(0, k);
}
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // → [1,2]`,
    },
    {
      title: 'Sorting is not O(1) extra space in JavaScript',
      kind: 'interview',
      md: "TimSort (V8) needs up to O(n) temporary memory for merging, so “I sort in place, so space is O(1)” is not accurate in JS. Say “O(n log n) time, O(n) auxiliary space for the built-in sort” — or O(log n) if you write your own in-place quicksort. Also ask whether you may mutate the input; if not, `toSorted()` costs an extra O(n) copy.",
    },
    {
      title: 'Check the comparator on a 3-element example with ties',
      kind: 'edge-cases',
      md: "Before trusting a custom comparator, sort a tiny array that contains equal keys and reversed input by hand. Check the three rules: it returns a number (not a boolean), compare(a, a) is 0, and swapping arguments flips the sign. A comparator that returns `a > b` (true/false) is the most common silent bug — it never returns a negative number, so V8 can leave the array unchanged.",
      code: `const bad = [3, 1, 2].sort((a, b) => a > b);      // boolean → unreliable
const good = [3, 1, 2].sort((a, b) => a - b);
console.log(good); // → [1,2,3]`,
    },
  ],
  traps: [
    {
      looksLike: 'Sort the array so you can find a pair with a given sum',
      actually: 'Hash map (when the answer needs original indices)',
      why: 'sorting moves elements, so indices are lost unless you sort an index array; a Map gives O(n) anyway',
    },
    {
      looksLike: 'Sort to find the longest run of consecutive values',
      actually: 'Set + start-of-run check',
      why: 'the problem asks for O(n); only start a count at x when x − 1 is not in the Set',
    },
    {
      looksLike: 'Sort everything to answer "k-th largest"',
      actually: 'Quickselect or a size-k heap',
      why: 'only one position matters; full sorting does unnecessary work',
    },
    {
      looksLike: 'Comparison sort for "sort the colours 0/1/2"',
      actually: 'Counting or Dutch national flag partition',
      why: 'three possible values means one pass with three pointers, O(n) and O(1) space',
    },
  ],
  sources: [
    { label: 'MDN — Array.prototype.sort()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort' },
    { label: 'V8 blog — Getting things sorted in V8', url: 'https://v8.dev/blog/array-sort' },
    { label: 'Tech Interview Handbook — Sorting and searching', url: 'https://www.techinterviewhandbook.org/algorithms/sorting-searching/' },
  ],
};
