export default {
  id: 'sorting',
  summary: 'Put items in order efficiently (merge sort, quick sort, counting/bucket/radix sort), control the order with comparators, and use "sort first" to turn hard problems into easy linear scans.',

  jsTools: [
    { api: 'arr.sort((a, b) => a - b)', use: 'Numeric ascending sort — ALWAYS pass a comparator for numbers', complexity: 'O(n log n), stable (TimSort in V8)' },
    { api: 'arr.toSorted(cmp)', use: 'Sorted copy without mutating the original (ES2023)', complexity: 'O(n log n) time, O(n) extra space' },
    { api: '[...arr].sort(cmp) / arr.slice().sort(cmp)', use: 'Sorted copy on older engines', complexity: 'O(n) copy + O(n log n)' },
    { api: 'a.localeCompare(b)', use: 'String comparator that returns a number', complexity: 'O(length)' },
    { api: 'new Array(k).fill(0)', use: 'Counting-sort buckets when values are small integers', complexity: 'O(k)' },
    { api: 'Int32Array / Float64Array + .sort()', use: 'Typed arrays sort NUMERICALLY by default', complexity: 'O(n log n)' },
  ],

  patterns: [
    {
      id: 'sorting-merge-sort',
      name: 'Merge Sort (Divide & Conquer)',
      summary: 'Split the array in half, sort each half recursively, then merge the two sorted halves in linear time.',
      whyItExists: 'Merging two sorted lists costs O(n) with two pointers. Splitting in half gives log n levels, each doing O(n) merging work → O(n log n) guaranteed, independent of the input order. The merge step also sees every "left element vs right element" relationship exactly once, which makes it the tool for counting inversions and similar pair counts.',
      whenToUse: [
        'You need a guaranteed O(n log n) sort (no bad worst case) or a stable sort',
        'Sorting linked lists (merge needs no random access)',
        'Counting pairs i < j with a relation between a[i] and a[j] (inversions, reverse pairs, count of smaller numbers after self)',
        'External sorting: data too big for memory is sorted in chunks then merged',
      ],
      clues: ['"implement a sort without built-ins in O(n log n)"', '"count pairs i < j where a[i] > a[j]"', '"number of inversions"', '"sort a linked list"', '"stable"'],
      whenNotToUse: [
        'Memory is very tight — array merge sort needs O(n) extra space',
        'Values are small integers in a known range — counting sort is O(n + k)',
        'You only need the k-th element, not the full order — quickselect is O(n) average',
      ],
      template: `function mergeSort(a) {
  if (a.length <= 1) return a;              // base case
  const mid = a.length >> 1;
  const left = mergeSort(a.slice(0, mid));
  const right = mergeSort(a.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    // <= keeps equal elements in original order → stable
    if (left[i] <= right[j]) out.push(left[i++]);
    else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}`,
      variations: [
        { name: 'Count inversions', description: 'When right[j] is taken before left[i], every remaining left element (left.length − i of them) is greater than right[j] → add that many inversions.' },
        { name: 'Bottom-up merge sort', description: 'Iteratively merge runs of width 1, 2, 4, … — no recursion, no stack-depth concerns.' },
        { name: 'Merge sort on a linked list', description: 'Find the middle with fast/slow pointers, split, sort, merge — O(1) extra space for the merge.' },
        { name: 'Merge k sorted lists', description: 'Pairwise merging (divide & conquer) or a heap (Heaps topic).' },
      ],
      mistakes: [
        'Using < instead of <= in the merge → loses stability',
        'Forgetting to copy the leftovers of one half after the main loop',
        'Allocating new arrays at every level with slice — fine for learning, but a single shared buffer is faster',
        'Counting inversions with `mid - i` style off-by-ones when using index ranges instead of arrays',
      ],
      evolution: {
        easy: 'Merge two sorted arrays.',
        medium: 'Implement merge sort; sort a linked list.',
        hard: 'Piggy-back counting on the merge: inversions, reverse pairs (a[i] > 2·a[j]), count of smaller numbers after self.',
      },
    },
    {
      id: 'sorting-quick-sort',
      name: 'Quick Sort, Partition & Quickselect',
      summary: 'Pick a pivot, partition the array into "less than pivot" and "greater than pivot" in place, then recurse on both sides (quicksort) or only on the side containing the answer (quickselect).',
      whyItExists: 'Partitioning is an O(n) in-place way to put one element in its final sorted position and split the rest. Recursing on both parts gives O(n log n) on average with O(log n) extra space; recursing on ONE part (quickselect) finds the k-th smallest in O(n) average. The partition step alone solves "move all X to the front" problems in one pass.',
      whenToUse: [
        'In-place sorting with little extra memory',
        'Finding the k-th smallest / median without fully sorting (quickselect)',
        'Rearranging by a predicate: evens before odds, negatives before positives (partition only)',
        'Three-way split around a value (Dutch national flag)',
      ],
      clues: ['"in place"', '"k-th largest / median"', '"move all even numbers to the front"', '"partition around x"', '"O(1) extra space"'],
      whenNotToUse: [
        'You need stability — quicksort is not stable',
        'Adversarial input with a naive pivot can hit O(n²) — randomise the pivot',
        'Many duplicates with 2-way partition degrade — use 3-way partition',
      ],
      template: `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  // random pivot defeats sorted / adversarial inputs
  const p = lo + Math.floor(Math.random() * (hi - lo + 1));
  [a[p], a[hi]] = [a[hi], a[p]];
  const pivot = a[hi];
  let store = lo;                      // a[lo..store-1] < pivot
  for (let i = lo; i < hi; i++) {
    if (a[i] < pivot) {
      [a[i], a[store]] = [a[store], a[i]];
      store++;
    }
  }
  [a[store], a[hi]] = [a[hi], a[store]]; // pivot lands in its final place
  quickSort(a, lo, store - 1);
  quickSort(a, store + 1, hi);
  return a;
}`,
      variations: [
        { name: 'Lomuto vs Hoare partition', description: 'Lomuto (above) is simpler; Hoare uses two pointers moving inward and does fewer swaps.' },
        { name: '3-way partition (Dutch flag)', description: 'Split into < pivot, = pivot, > pivot. Essential with many duplicates; equal elements are never recursed on again.' },
        { name: 'Quickselect', description: 'After partitioning, recurse only into the side that contains index k → O(n) average.' },
        { name: 'Predicate partition', description: 'Two pointers swap "bad" elements to the back: sort array by parity.' },
      ],
      mistakes: [
        'Always choosing the first/last element as pivot → O(n²) on already-sorted input',
        'Recursing on ranges that include the pivot → infinite recursion',
        'Using 2-way partition on arrays of all-equal values → O(n²)',
        'Assuming quicksort is stable',
      ],
      evolution: {
        easy: 'Partition by a predicate (evens first).',
        medium: 'Randomised quicksort; k-th largest via quickselect; sort colors (3-way).',
        hard: 'Median via quickselect + 3-way partition + virtual indexing (Wiggle Sort II).',
      },
    },
    {
      id: 'sorting-counting-bucket',
      name: 'Counting, Bucket & Radix Sort',
      summary: 'When keys are small integers (or can be spread into buckets), place items by their value instead of comparing them — beating the O(n log n) comparison lower bound.',
      whyItExists: 'Any comparison-based sort needs Ω(n log n) comparisons in the worst case (there are n! orderings and each comparison only halves the possibilities). Counting sort never compares: it counts how many times each value appears and writes them back in order, costing O(n + k) where k is the value range. Bucket sort and radix sort generalise this to larger ranges.',
      whenToUse: [
        'Values are integers in a small known range (ages, grades, heights ≤ 100, lowercase letters)',
        'You need a linear-time sort or a linear-time "rank" of values',
        'Pigeonhole arguments: n values in n−1 buckets means some gap spans a bucket (Maximum Gap)',
        'Values ≤ n naturally (h-index: citations above n can be capped at n)',
      ],
      clues: ['"0 <= nums[i] <= 1000"', '"in linear time"', '"lowercase letters only"', '"sort by frequency"', '"maximum difference between successive elements in sorted form, in O(n)"'],
      whenNotToUse: [
        'The value range k is huge compared to n (1e9) — the count array would not fit (use radix or comparison sort)',
        'Keys are not integers and cannot be bucketed meaningfully',
        'The comparator is custom and complex (e.g. concatenation order)',
      ],
      template: `function countingSort(nums, maxValue) {
  const count = new Array(maxValue + 1).fill(0);
  for (const x of nums) count[x]++;          // 1. count
  const out = [];
  for (let v = 0; v <= maxValue; v++) {      // 2. emit values in order
    for (let c = 0; c < count[v]; c++) out.push(v);
  }
  return out;
}`,
      variations: [
        { name: 'Stable counting sort (prefix sums)', description: 'Turn counts into starting positions with a prefix sum, then place records left to right — keeps equal keys in order; this is the building block of radix sort.' },
        { name: 'Radix sort (LSD)', description: 'Stable counting sort by the last digit, then the next digit, … d passes of O(n + base) → O(d·(n + base)).' },
        { name: 'Bucket sort', description: 'Spread values into n buckets by range, sort each small bucket, concatenate. O(n) average for uniformly spread data.' },
        { name: 'Offset for negatives', description: 'Shift by −min so the smallest value maps to index 0.' },
      ],
      mistakes: [
        'Forgetting negative values (index −3 on an array silently creates a property, not an element)',
        'Allocating count arrays of size max(nums) when max is 1e9',
        'Losing stability when records (not just numbers) are sorted by key — use the prefix-sum placement',
      ],
      evolution: {
        easy: 'Count frequencies of small values (height checker, relative sort).',
        medium: 'Bucket by value capped at n (h-index), sort characters by frequency.',
        hard: 'Pigeonhole buckets for Maximum Gap; radix sort on 32-bit integers.',
      },
    },
    {
      id: 'sorting-custom-comparator',
      name: 'Custom Comparators',
      summary: 'Define "a comes before b" with a function returning a negative number, zero or a positive number, and let the built-in sort do the rest.',
      whyItExists: 'Many problems are "sort, but by a strange rule": by another array\'s order, by height descending, by concatenation value, by multiple keys. Writing a correct comparator turns them into one line. The key requirement is that the rule is a consistent total order (transitive), otherwise the sort result is undefined.',
      whenToUse: [
        'Order by a key other than the natural value (length, frequency, a priority map)',
        'Multi-key ordering (by score desc, then name asc)',
        'Order defined by comparing pairs, not individual keys (largest number: compare a+b vs b+a)',
      ],
      clues: ['"sort by … then by …"', '"in the order given by"', '"arrange to form the largest number"', '"people sorted by height"', '"custom order"'],
      whenNotToUse: [
        'The relation is not transitive (rock-paper-scissors) — sorting is meaningless',
        'You only need min/max — a linear scan is O(n)',
        'Keys are tiny integers — counting sort is linear',
      ],
      template: `// negative → a first, positive → b first, 0 → keep relative order (stable)
items.sort((a, b) =>
  b.score - a.score ||              // primary: score descending
  a.name.localeCompare(b.name)      // tie-break: name ascending
);`,
      variations: [
        { name: 'Sort indices, not values', description: 'Sort [0..n-1] by a key array (e.g. heights) and map back — useful when two arrays must be sorted together.' },
        { name: 'Rank map', description: 'Build Map(value → position in the reference order) and compare ranks.' },
        { name: 'Pairwise comparator', description: 'Largest Number: a before b iff a + b > b + a as strings.' },
        { name: 'Decorate–sort–undecorate', description: 'Precompute expensive keys once: map to [key, item], sort by key, map back.' },
      ],
      mistakes: [
        'Returning a boolean (a > b) — true/false coerce to 1/0 and never report "less than", giving wrong orders',
        'Calling sort() with no comparator on numbers — it sorts as strings',
        'Using a - b on strings (NaN) instead of localeCompare / < >',
        'Computing expensive keys inside the comparator (called O(n log n) times)',
      ],
      evolution: {
        easy: 'Sort one array by another (sort the people).',
        medium: 'Sort by a rank map (custom sort string), multi-key sorts.',
        hard: 'Comparators whose correctness needs a proof (largest number transitivity).',
      },
    },
    {
      id: 'sorting-preprocess',
      name: 'Sort as Preprocessing',
      summary: 'Sort first so that the structure you need (neighbours are close, smallest comes first, positions are ordered) appears, then solve with a greedy scan, two pointers or counting.',
      whyItExists: 'Sorting costs O(n log n) once, and afterwards many questions become O(n): duplicates become adjacent, the best partner of an element is its neighbour, a greedy choice "smallest first" becomes safe, and events are processed in order. It is often the cheapest way from O(n²) to O(n log n).',
      whenToUse: [
        'Order of the input does not matter for the answer (you may reorder freely)',
        'A greedy decision depends on processing smallest/largest/closest first',
        'Pairs/groups should be matched in value order (doubled pairs, two-sum on sorted data)',
        'Things happen along a line (cars by position, intervals by start)',
      ],
      clues: ['"return the answer in any order"', '"pair up"', '"can the array be reordered so that"', '"closest"', '"position and speed"', '"at least h papers with h citations"'],
      whenNotToUse: [
        'The original order/indices matter and cannot be reconstructed (sort index pairs instead)',
        'A hash map already gives O(n)',
        'The input is a stream you cannot store',
      ],
      template: `function solve(items) {
  const sorted = [...items].sort((a, b) => a - b); // don't mutate the caller's array
  let answer = 0;
  for (let i = 0; i < sorted.length; i++) {
    // now neighbours / prefixes carry the structure we need
  }
  return answer;
}`,
      variations: [
        { name: 'Sort + greedy', description: 'Process from smallest (or by |x|) and commit to the forced choice (Array of Doubled Pairs).' },
        { name: 'Sort + scan from one end', description: 'Cars sorted by position, scanned from the target backwards (Car Fleet).' },
        { name: 'Sort + index threshold', description: 'After sorting descending, the answer is the largest i with a[i] ≥ i + 1 (H-Index).' },
        { name: 'Sort + two pointers', description: 'Pair sums, 3Sum — you met these in Two Pointers.' },
      ],
      mistakes: [
        'Mutating the input array when the caller still needs it (use toSorted or a copy)',
        'Sorting when a hash map would already be O(n)',
        'Sorting by the wrong key (e.g. by value when negatives require sorting by absolute value)',
      ],
      evolution: {
        easy: 'Sort then compare neighbours (duplicates, min difference).',
        medium: 'Sort then greedy (doubled pairs, car fleet, h-index).',
        hard: 'Sort + sweep with a data structure (intervals, skyline — next topic).',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `**Sorting** means putting items in order: numbers from small to large, words alphabetically, people by height.

You already call \`arr.sort()\` all the time. This topic is about **what happens inside** that call, **when a different sorting idea is faster**, and — most importantly for interviews — **how sorting first makes other problems easy**.

\`\`\`text
[5, 2, 9, 1, 5]   →   [1, 2, 5, 5, 9]
\`\`\``,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Comparison sort** — decides the order only by asking "is a before b?" (merge sort, quick sort, insertion sort, JavaScript's \`sort\`).
- **Non-comparison sort** — uses the *value itself* as an address (counting sort, bucket sort, radix sort).
- **Stable** — equal items keep their original relative order. Sort students by grade stably and students with the same grade stay in their original (e.g. alphabetical) order.
- **In place** — uses only O(1) (or O(log n)) extra memory besides the input.
- **Comparator** — a function \`(a, b) => number\`: negative means *a first*, positive means *b first*, zero means *tie*.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Sorting a hand of playing cards: many people pick one card at a time and slide it into place (insertion sort). A post office sorting letters by postcode drops each letter straight into its postcode pigeonhole without comparing letters to each other (counting / bucket sort). Two friends each sorting half the pile, then merging their piles by repeatedly taking the smaller top card, is merge sort.',
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-1',
            question: 'Records `[(Ann, B), (Bob, A), (Cid, B), (Dan, A)]` are sorted by grade. Which output proves the sort was **stable**?',
            options: [
              '[(Dan, A), (Bob, A), (Ann, B), (Cid, B)]',
              '[(Bob, A), (Dan, A), (Cid, B), (Ann, B)]',
              '[(Bob, A), (Dan, A), (Ann, B), (Cid, B)]',
              '[(Ann, B), (Cid, B), (Bob, A), (Dan, A)]',
            ],
            answer: 2,
            explanation: 'Among the A\'s, Bob came before Dan in the input; among the B\'s, Ann came before Cid. A stable sort preserves both of those relative orders: Bob, Dan, Ann, Cid.',
            misconceptions: {
              0: 'Dan and Bob are swapped compared with the input. The grades are in order, but equal keys changed order — that is an *unstable* result.',
              1: 'Cid and Ann swapped. A sort can be correct (grades ordered) and still unstable.',
              3: 'This is not even sorted by grade — B comes before A.',
            },
            deeper: 'Stability matters when you sort by several keys in passes: sort by name, then *stably* by grade, and people with the same grade stay alphabetical. Since ES2019, JavaScript requires `Array.prototype.sort` to be stable.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Two reasons.

**1. Sorted data is easy data.** Once sorted:
- duplicates sit next to each other,
- the closest value to \`x\` is a neighbour,
- binary search works,
- two pointers can walk from both ends,
- greedy "take the smallest first" choices become possible.

Many interview problems are "O(n²) by brute force, O(n log n) after sorting". Sorting is the **preprocessing step** that unlocks the pattern.

**2. Some problems ARE about the sort itself.** "Implement a sort in O(n log n)", "count inversions", "find the k-th largest without sorting", "sort in linear time". For those you need to know how merge sort, quick sort and counting sort actually work.`,
          },
          {
            type: 'compare',
            left: {
              title: 'Contains duplicate — brute force O(n²)',
              code: `for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    if (a[i] === a[j]) return true;
return false;`,
            },
            right: {
              title: 'Sort first — O(n log n)',
              code: `const s = [...a].sort((x, y) => x - y);
for (let i = 1; i < n; i++)
  if (s[i] === s[i - 1]) return true; // equal values are adjacent
return false;`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** sorting is allowed here, and when it would NOT be allowed?',
            deeper: `The question "is there a duplicate?" does not care about positions — reordering the array cannot change the answer. That is the test: **if the answer is invariant under reordering, you may sort**.

If the question asks about the *original* positions (e.g. "return the indices", "the next greater element to the right"), sorting destroys that information. You can still sort **pairs** \`[value, originalIndex]\` so the index travels with the value.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Situation | Tool |
|---|---|
| Need order in general code | \`arr.sort((a, b) => a - b)\` / \`toSorted\` — O(n log n), stable |
| Must implement a guaranteed O(n log n) / stable sort, or sort a linked list | **Merge sort** |
| In place, or only need the k-th element / median | **Quick sort / quickselect** |
| Integer keys in a small range (≤ ~10⁶) | **Counting sort** O(n + k) |
| Linear time needed on big integers / spread data | **Radix / bucket sort** |
| Unusual order ("by this other array", "largest concatenation") | **Custom comparator** |
| Answer does not depend on input order and becomes easy when ordered | **Sort as preprocessing** |`,
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-2',
            question: 'You must sort 10⁶ exam scores, each an integer from 0 to 100. Which is the best choice?',
            options: [
              'Quick sort with a random pivot — O(n log n) average',
              'Merge sort — guaranteed O(n log n)',
              'Insertion sort — the values are small',
              'Counting sort — 101 buckets, O(n + 101)',
            ],
            answer: 3,
            explanation: 'Only 101 different values exist. Count them in one pass and write them back: about 10⁶ + 101 steps, versus ~2·10⁷ comparisons for an O(n log n) sort.',
            misconceptions: {
              0: 'Correct but slower: it ignores the fact that the range is tiny, and with only 101 distinct values a 2-way partition wastes work on duplicates.',
              1: 'Also correct, but it cannot beat n log n because it compares. Counting sort does not compare at all.',
              2: 'Insertion sort\'s cost depends on n (O(n²) on unsorted input), not on how small the values are. 10¹² steps is far too slow.',
            },
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['"return in any order" / order does not matter', '"pair up" / "group" / "closest"', '"k-th largest" / "median"', '"count pairs i < j with a[i] > a[j]"', 'small value range in the constraints', '"sort by … then by …" / "custom order"', '"form the largest number"', '"in O(n) time" + integers'],
            conclusion: 'Think Sorting: preprocessing, merge-sort counting, quickselect, counting sort or a comparator',
          },
          {
            type: 'text',
            md: `A reading checklist:

1. **Does the answer change if I shuffle the input?** No → sorting first is allowed. Ask what becomes easy once sorted.
2. **Do the constraints bound the values?** \`0 <= nums[i] <= 1000\` is an invitation to counting sort.
3. **Is it a pair count over i < j?** Think of the merge step of merge sort.
4. **Is the order weird?** Write a comparator.
5. **Do I need only one position (k-th)?** Quickselect instead of a full sort.`,
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Every efficient sort uses one of two big ideas:

1. **Divide & conquer** (from the Recursion topic): split the problem, solve the parts, combine.
   - *Merge sort*: split **by position** (trivial), combine by **merging** (the real work).
   - *Quick sort*: split **by value** around a pivot (the real work), combine by doing **nothing** (the parts are already in place).
2. **Use the value as an address**: counting / bucket / radix sort skip comparisons entirely.

**Why can't comparison sorts beat n log n?** There are \`n!\` possible orderings of n items. Each comparison has two outcomes, so it can at best cut the remaining possibilities in half. To get from \`n!\` possibilities down to 1 you need at least \`log₂(n!)\` comparisons, and \`log₂(n!) ≈ n log₂ n − 1.44n\`. So Ω(n log n) is a hard floor — for comparison sorts. Counting sort escapes it because it never compares.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Where the log n comes from',
            md: 'Halving n repeatedly reaches 1 after log₂ n steps. If each "level" of halving costs O(n) in total, the whole algorithm is O(n log n). You will see this recursion-tree argument in merge sort, in quick sort\'s average case, and later in heaps and segment trees.',
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-3',
            question: 'Why is counting sort allowed to run in O(n + k) when comparison sorts need Ω(n log n)?',
            options: [
              'Because counting sort is a smarter comparison sort',
              'Because it uses each value as an array index instead of comparing items, so the n log n comparison lower bound does not apply',
              'Because it only works on sorted input',
              'It is not faster; O(n + k) is the same as O(n log n)',
            ],
            answer: 1,
            explanation: 'The lower bound counts **comparisons**. Counting sort learns order from the value itself (`count[value]++`), which gives much more than one bit of information per step. The price: it only works for small integer keys.',
            misconceptions: {
              0: 'Counting sort performs zero comparisons between elements. That is exactly why the bound does not apply.',
              2: 'It works on any order of input; it is only restricted in the *kind* of keys (small integers).',
              3: 'For k = 100 and n = 10⁶, n + k ≈ 10⁶ while n log n ≈ 2·10⁷. When k is small it really is faster.',
            },
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: `The simple sorts are O(n²). You should know them because interviewers ask about them and because **insertion sort is genuinely fast on tiny or nearly-sorted arrays** — which is why real engines (TimSort) use it on small runs.

- **Selection sort**: find the minimum of the unsorted part, swap it to the front. Always n²/2 comparisons. Not stable.
- **Insertion sort**: take the next item and slide it left past larger items. O(n²) worst, **O(n) on already-sorted input**, stable, in place.
- **Bubble sort**: swap adjacent out-of-order pairs repeatedly. O(n²); mostly of historical interest.`,
          },
          {
            type: 'code',
            title: 'Insertion sort — O(n²) worst, O(n + inversions) in general',
            code: `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const x = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > x) {  // strict > keeps it stable
      a[j + 1] = a[j];             // shift the bigger item right
      j--;
    }
    a[j + 1] = x;
  }
  return a;
}`,
            caption: 'Each shift fixes exactly one inversion (a pair i < j with a[i] > a[j]), so the running time is O(n + number of inversions).',
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-4',
            question: 'Insertion sort runs on `[1, 2, 3, 4, 5, 7, 6]`. Roughly how much work does it do?',
            options: [
              'About n steps — only one pair is out of order, so only one shift happens',
              'About n log n steps',
              'About n²/2 steps — it is O(n²)',
              'It cannot sort this array',
            ],
            answer: 0,
            explanation: 'Insertion sort costs O(n + I) where I is the number of inversions. Here I = 1 (7 before 6), so it does one pass plus one shift. This adaptivity is why TimSort uses insertion sort on short runs.',
            misconceptions: {
              2: 'O(n²) is the *worst* case (reverse-sorted input, n(n−1)/2 inversions). On nearly-sorted input the inner while loop almost never runs.',
              1: 'Insertion sort is not divide & conquer; its cost is driven by inversions, and here there is only one.',
              3: 'It sorts any array; the question is only how fast.',
            },
          },
        ],
      },
      {
        id: 'intuition-merge-sort',
        title: 'Core intuition — merge sort',
        blocks: [
          {
            type: 'text',
            md: `Merge sort rests on one easy fact: **merging two already-sorted lists is cheap.** Put a finger at the front of each list; repeatedly take the smaller of the two fingered items. Every step outputs one item, so merging lists of total length n takes n steps.

Now use recursion's *leap of faith*: "assume \`mergeSort\` correctly sorts any smaller array". Then:

1. Split the array into a left half and a right half.
2. Sort each half (leap of faith — recursive call).
3. Merge the two sorted halves.

Base case: an array of 0 or 1 elements is already sorted.`,
          },
          {
            type: 'visual',
            scenario: 'merge-sort',
            input: { nums: [38, 27, 43, 3, 9, 82, 10] },
            caption: 'Split down to single elements, then merge back up. Each level of merging touches every element once.',
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Two sorted piles',
            md: 'Two librarians each hand you a pile of books already sorted by title, face up. You only ever look at the two top books and take the one that comes first alphabetically. You never need to look deeper into either pile — that is why merging is linear.',
          },
        ],
      },
      {
        id: 'optimized-merge-sort',
        title: 'Optimized approach — merge sort',
        blocks: [
          {
            type: 'text',
            md: `**Why O(n log n), always?** Draw the recursion tree. The top level merges n items. The next level has two merges of n/2 items — still n in total. Each level halves the sizes and doubles the count, so **every level costs n**. There are **log₂ n levels** until sizes reach 1. Total: n · log₂ n. The input order never changes this, so best = average = worst = O(n log n).

**Space:** O(n) for the merge buffer, plus O(log n) recursion depth. (Recursion depth is only log₂(10⁶) ≈ 20, so no risk of stack overflow.)

**Stability:** when the two fingered items are equal, take the one from the **left** half first (\`<=\`). Left-half items came earlier in the input, so equal items keep their order.`,
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-5',
            question: 'In the merge step, `left[i] === right[j]`. Which should be taken first to keep merge sort **stable**?',
            options: [
              'right[j], because the right half is newer',
              'Either — equal values are indistinguishable',
              'left[i], because every element of the left half appeared before every element of the right half in the input',
              'Neither — skip both and handle duplicates at the end',
            ],
            answer: 2,
            explanation: 'The left half is exactly the earlier part of the input. Taking `left[i]` on ties (using `<=`) preserves the original relative order of equal keys.',
            misconceptions: {
              0: 'Taking the right one first moves a later item in front of an earlier equal item — that is precisely instability.',
              1: 'Equal *keys* are not equal *records*. When sorting objects by a key (people by age), the other fields make them distinguishable.',
              3: 'Skipping would lose elements; every element must be output exactly once.',
            },
          },
          {
            type: 'text',
            md: `### Counting inversions with the merge

An **inversion** is a pair of indices \`i < j\` with \`a[i] > a[j]\` — a pair that is "out of order". Brute force checks all pairs: O(n²).

Merge sort counts them for free. Every inversion is one of three kinds: both inside the left half, both inside the right half (counted by the recursive calls), or **one on each side**. During the merge, when we take \`right[j]\` *before* \`left[i]\`, it is because \`left[i] > right[j]\` — and since the left half is sorted, **all remaining left elements \`left[i..]\` are also greater than \`right[j]\`**. They all were before \`right[j]\` in the input. So we add \`left.length − i\` in one step.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the cross-half inversions can be counted in O(1) per step, instead of comparing right[j] with every left element?',
            deeper: `Because the left half is **already sorted** when we merge. If \`left[i] > right[j]\`, then \`left[i+1], left[i+2], …\` are all ≥ \`left[i]\`, so they are all > \`right[j]\` too. One comparison tells us about \`left.length − i\` pairs at once.

Also notice that sorting each half does not destroy the information we need: moving elements *within* the left half does not change which elements are on the left of the split, and all of them were before all right-half elements in the original array. So "left element > right element" is exactly "an inversion across the split".`,
          },
        ],
      },
      {
        id: 'template-merge-sort',
        title: 'Pattern / template — merge sort',
        blocks: [
          {
            type: 'code',
            title: 'Merge sort with a shared buffer (index ranges, no slicing)',
            code: `function mergeSort(a) {
  const buf = new Array(a.length);
  function sort(lo, hi) {            // sorts a[lo..hi) in place
    if (hi - lo <= 1) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid, hi);
    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) buf[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    for (let t = lo; t < hi; t++) a[t] = buf[t];
  }
  sort(0, a.length);
  return a;
}`,
            caption: 'Half-open ranges [lo, hi) avoid most off-by-one errors: the halves are [lo, mid) and [mid, hi).',
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-6',
            question: 'While merging for inversion counting, left = [3, 8, 9] (i = 1, pointing at 8) and right = [5, 10] (j = 0, pointing at 5). We take 5. How many inversions do we add?',
            options: [
              '1 — only the pair (8, 5)',
              '2 — pairs (8, 5) and (9, 5), i.e. left.length − i',
              '3 — every element of left',
              '0 — inversions are only counted when taking from the left',
            ],
            answer: 1,
            explanation: '3 was already output (3 < 5, not an inversion). The remaining left elements 8 and 9 are both > 5 and were before it in the input: left.length − i = 3 − 1 = 2.',
            misconceptions: {
              0: 'Since the left half is sorted, 9 ≥ 8 > 5 also forms an inversion. Counting only one misses pairs.',
              2: '3 < 5, so (3, 5) is in the correct order. Only the elements not yet output (from index i on) count.',
              3: 'Taking from the left means left[i] ≤ right[j] — no inversion with the current right element. The count happens when the RIGHT element wins.',
            },
          },
        ],
      },
      {
        id: 'implementation-merge-sort',
        title: 'JavaScript implementation — merge sort & inversions',
        blocks: [
          {
            type: 'code',
            title: 'Count inversions — O(n log n)',
            code: `function countInversions(nums) {
  const a = [...nums];               // don't destroy the caller's array
  const buf = new Array(a.length);
  function sort(lo, hi) {
    if (hi - lo <= 1) return 0;
    const mid = (lo + hi) >> 1;
    let count = sort(lo, mid) + sort(mid, hi);
    let i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
      if (a[i] <= a[j]) buf[k++] = a[i++];
      else {
        count += mid - i;            // a[i..mid) are all > a[j]
        buf[k++] = a[j++];
      }
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi) buf[k++] = a[j++];
    for (let t = lo; t < hi; t++) a[t] = buf[t];
    return count;
  }
  return sort(0, a.length);
}`,
            caption: 'Using <= means equal values are NOT counted — an inversion needs a[i] > a[j] strictly. The count can reach n(n−1)/2 ≈ 5·10⁹ for n = 10⁵, still a safe integer in JS (< 2⁵³).',
          },
        ],
      },
      {
        id: 'intuition-quick-sort',
        title: 'Core intuition — quick sort',
        blocks: [
          {
            type: 'text',
            md: `Quick sort does the hard work **before** recursing:

1. Pick a **pivot** value.
2. **Partition**: rearrange so everything smaller than the pivot is on its left and everything larger is on its right. The pivot is now in its **final** sorted position.
3. Recurse on the left part and on the right part. No merge needed.

\`\`\`text
[7, 2, 9, 4, 3]   pivot = 4
partition →  [2, 3] 4 [9, 7]
\`\`\``,
          },
          { type: 'visual', scenario: 'quick-sort', caption: "Lomuto partition: everything smaller than the pivot moves left of the boundary." },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Line up by height',
            md: 'A teacher picks one student and says "everyone shorter, stand to the left of Sam; everyone taller, to the right". Sam is now exactly where he would be in the final line-up. Repeat inside each group.',
          },
        ],
      },
      {
        id: 'optimized-quick-sort',
        title: 'Optimized approach — quick sort, pivots & quickselect',
        blocks: [
          {
            type: 'text',
            md: `**Average case O(n log n):** if the pivot splits the array roughly in half, we get the same log n levels × n work as merge sort. Even a 10/90 split still gives O(n log n) — the depth is log₁₀/₉ n, just a bigger constant.

**Worst case O(n²):** if the pivot is always the smallest (or largest) element, one side is empty and the other has n − 1 items. Depth becomes n and total work n + (n−1) + … = n²/2. With "always take the last element as pivot", this happens on **already-sorted input** — a very common input! It also blows the call stack for large n.

**Fixes:**
- **Random pivot** — no fixed input is bad; the expected cost is O(n log n) for every input.
- **Median-of-three** — median of first, middle, last; good in practice for sorted data.
- **3-way partition** (< pivot, = pivot, > pivot) — with many duplicates, a 2-way partition keeps recursing on piles of equal values; 3-way removes them in one go.
- Recurse on the **smaller** side first and loop on the larger to keep stack depth O(log n).

**Quickselect:** to find the k-th smallest, partition once and look where the pivot landed. If it is at index k, done. Otherwise recurse into **only one** side. Average work n + n/2 + n/4 + … = 2n → **O(n) average** (still O(n²) worst case).`,
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-7',
            question: 'A quicksort always picks the **last** element as the pivot. Which input makes it slowest?',
            options: [
              'A random shuffle',
              'An already-sorted array — every pivot is the maximum, so each partition only removes one element',
              'An array with all distinct values',
              'Short arrays under 10 elements',
            ],
            answer: 1,
            explanation: 'Sorted input + last-element pivot → the pivot is the maximum every time. Partitions have sizes n−1 and 0, giving n levels and ~n²/2 comparisons. A random pivot makes this astronomically unlikely.',
            misconceptions: {
              0: 'Random input is the *good* case: pivots are near the middle on average, giving O(n log n).',
              2: 'Distinct values are not a problem. The issue is how the pivot splits, not whether values repeat (duplicates hurt 2-way partitions, not distinct values).',
              3: 'Tiny arrays are fast whatever the pivot. Worst-case behaviour appears on large, structured inputs.',
            },
            deeper: 'This is why library implementers randomise or use introsort (switch to heapsort when recursion gets too deep). In your own code, `const p = lo + Math.floor(Math.random() * (hi - lo + 1))` is the one-line fix.',
          },
        ],
      },
      {
        id: 'template-quick-sort',
        title: 'Pattern / template — partition',
        blocks: [
          {
            type: 'code',
            title: 'Lomuto partition (the building block)',
            code: `// Rearranges a[lo..hi] around a random pivot; returns the pivot's final index.
function partition(a, lo, hi) {
  const r = lo + Math.floor(Math.random() * (hi - lo + 1));
  [a[r], a[hi]] = [a[hi], a[r]];
  const pivot = a[hi];
  let store = lo;                        // invariant: a[lo..store) < pivot
  for (let i = lo; i < hi; i++) {
    if (a[i] < pivot) {
      [a[i], a[store]] = [a[store], a[i]];
      store++;
    }
  }
  [a[store], a[hi]] = [a[hi], a[store]];
  return store;
}`,
          },
          {
            type: 'code',
            title: '3-way partition (Dutch national flag)',
            code: `// After this: a[lo..lt) < pivot, a[lt..gt] === pivot, a(gt..hi] > pivot
function partition3(a, lo, hi, pivot) {
  let lt = lo, i = lo, gt = hi;
  while (i <= gt) {
    if (a[i] < pivot) { [a[lt], a[i]] = [a[i], a[lt]]; lt++; i++; }
    else if (a[i] > pivot) { [a[i], a[gt]] = [a[gt], a[i]]; gt--; }  // don't i++: new a[i] is unseen
    else i++;
  }
  return [lt, gt];
}`,
          },
        ],
      },
      {
        id: 'implementation-quick-sort',
        title: 'JavaScript implementation — quickselect',
        blocks: [
          {
            type: 'code',
            title: 'k-th smallest (0-based) in O(n) average',
            code: `function quickselect(nums, k) {
  const a = [...nums];
  let lo = 0, hi = a.length - 1;
  while (true) {
    const r = lo + Math.floor(Math.random() * (hi - lo + 1));
    const [lt, gt] = partition3(a, lo, hi, a[r]);
    if (k < lt) hi = lt - 1;          // answer is in the "< pivot" part
    else if (k > gt) lo = gt + 1;     // answer is in the "> pivot" part
    else return a[k];                 // k falls inside the "= pivot" block
  }
}`,
            caption: 'Iterative, so no recursion depth issues; 3-way partitioning makes arrays full of duplicates fast.',
          },
        ],
      },
      {
        id: 'intuition-counting',
        title: 'Core intuition — counting, bucket & radix sort',
        blocks: [
          {
            type: 'text',
            md: `If every value is an integer between 0 and k, you do not need to compare anything. Make k + 1 boxes, drop each value in the box with its number, then walk the boxes from 0 to k.

\`\`\`text
nums  = [3, 1, 3, 0, 2]
count = [1, 1, 1, 2]        (index = value)
out   = [0, 1, 2, 3, 3]
\`\`\`

- **Counting sort**: O(n + k) time, O(k) space. Great when k is small (letters, ages, scores).
- **Bucket sort**: when values are spread over a big range, split the range into n equal-width **buckets**, drop values in, sort each (tiny) bucket, concatenate. O(n) on average for evenly spread data.
- **Radix sort**: sort by the last digit (a stable counting sort with 10 — or 256 — boxes), then by the next digit, and so on. Because each pass is **stable**, the order from earlier (less significant) digits survives as a tie-break. d digits → O(d · (n + base)).`,
          },
          { type: 'visual', scenario: 'counting-sort', caption: "Count, turn counts into positions, then place each value — no comparisons at all." },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Pigeonhole principle',
            md: 'If you put more items than boxes, some box holds two items. In reverse: if you have n values and n + 1 (or more) buckets, at least one bucket is **empty**. Maximum Gap uses this: with n values spread over n − 1 gaps, the largest gap is at least (max − min)/(n − 1), so it can never be inside a bucket of that width — it must be *between* buckets.',
          },
        ],
      },
      {
        id: 'optimized-counting',
        title: 'Optimized approach — counting & bucket sort',
        blocks: [
          {
            type: 'text',
            md: `**Stable counting sort for records.** Counting values is enough for plain numbers, but to sort *records* by a key (and keep stability — needed by radix sort) use positions:

1. \`count[key]++\` for every record.
2. Prefix sum: \`start[v]\` = number of records with key < v = where the first record with key v goes.
3. Scan records left to right; place each at \`start[key]++\`.

Left-to-right placement keeps equal keys in input order → stable.

**Capping trick.** Sometimes only values up to n matter. For H-Index, a paper with 5000 citations counts the same as one with n citations (h can never exceed n). Clamp values to n and a counting array of size n + 1 suffices, even though citations can be 1000.`,
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-8',
            question: 'Radix sort processes the ones digit, then the tens digit. Why must each digit pass be **stable**?',
            options: [
              'Stability makes each pass faster',
              'Stability is not needed; any sort per digit works',
              'Because counting sort cannot be unstable',
              'So that numbers with the same tens digit stay ordered by their ones digit from the previous pass',
            ],
            answer: 3,
            explanation: 'After the ones pass, 21 sits before 25. The tens pass sees both with tens digit 2 — a tie. A stable pass keeps 21 before 25, so the earlier work is preserved. An unstable pass could output 25, 21.',
            misconceptions: {
              0: 'Stability does not change the O(n + base) cost of a pass. It is about correctness.',
              2: 'Counting sort *can* be implemented unstably (e.g. placing from the right while scanning left to right). You must choose the stable placement.',
              1: 'Try [25, 21] with an unstable tens pass: both have tens digit 2 and may come out as [25, 21] — wrong.',
            },
          },
        ],
      },
      {
        id: 'template-counting',
        title: 'Pattern / template — counting sort',
        blocks: [
          {
            type: 'code',
            title: 'Stable counting sort by an integer key',
            code: `function countingSortBy(items, key, maxKey) {
  const count = new Array(maxKey + 2).fill(0);
  for (const it of items) count[key(it) + 1]++;          // shifted by 1 for the prefix sum
  for (let v = 1; v < count.length; v++) count[v] += count[v - 1]; // count[v] = # keys < v
  const out = new Array(items.length);
  for (const it of items) out[count[key(it)]++] = it;    // left-to-right → stable
  return out;
}`,
          },
        ],
      },
      {
        id: 'implementation-counting',
        title: 'JavaScript implementation — bucket sort (Maximum Gap idea)',
        blocks: [
          {
            type: 'code',
            title: 'Largest gap between neighbours in sorted order, in O(n)',
            code: `function maximumGap(nums) {
  const n = nums.length;
  if (n < 2) return 0;
  const lo = Math.min(...nums), hi = Math.max(...nums);  // fine up to ~1e5 items
  if (lo === hi) return 0;
  const width = Math.max(1, Math.floor((hi - lo) / (n - 1)));
  const count = Math.floor((hi - lo) / width) + 1;
  const bMin = new Array(count).fill(Infinity);
  const bMax = new Array(count).fill(-Infinity);
  for (const x of nums) {
    const b = Math.floor((x - lo) / width);
    bMin[b] = Math.min(bMin[b], x);
    bMax[b] = Math.max(bMax[b], x);
  }
  // the max gap is between buckets: next non-empty min − previous non-empty max
  let best = 0, prevMax = lo;
  for (let b = 0; b < count; b++) {
    if (bMin[b] === Infinity) continue;   // empty bucket
    best = Math.max(best, bMin[b] - prevMax);
    prevMax = bMax[b];
  }
  return best;
}`,
            caption: 'Math.min(...nums) spreads arguments onto the call stack; for arrays beyond ~10⁵ elements use a loop instead.',
          },
        ],
      },
      {
        id: 'intuition-comparator',
        title: 'Core intuition — JavaScript sort & comparators',
        blocks: [
          {
            type: 'text',
            md: `### The #1 JavaScript sorting trap

\`Array.prototype.sort()\` **with no comparator converts every element to a string** and compares UTF-16 code units:

\`\`\`js
[10, 9, 1].sort();            // [1, 10, 9]   ← "10" < "9" as strings
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]
\`\`\`

### The comparator contract
\`compare(a, b)\` must return a **number**:
- **negative** → a goes before b
- **positive** → b goes before a
- **0** → keep their current relative order (the sort is stable)

\`(a, b) => a - b\` is ascending, \`(a, b) => b - a\` is descending. For strings use \`a.localeCompare(b)\` or \`a < b ? -1 : a > b ? 1 : 0\`.

### Other facts to know
- V8 (Chrome, Node) uses **TimSort**: O(n log n) worst case, O(n) on already-sorted input, **stable**. Stability is guaranteed by the spec since **ES2019**.
- \`sort\` **mutates** the array in place and returns the same array. Use \`arr.toSorted(cmp)\` (ES2023) or \`[...arr].sort(cmp)\` for a copy.
- \`undefined\` elements always go to the end, without calling the comparator.
- Typed arrays (\`Int32Array\`, \`Float64Array\`) sort **numerically** by default.
- The comparator must be **consistent** (if a < b and b < c then a < c). Random or inconsistent comparators give engine-dependent garbage — never "shuffle" with \`sort(() => Math.random() - 0.5)\`.`,
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-9',
            question: 'What does `[5, 25, 100, 1].sort()` return?',
            options: [
              '[1, 5, 25, 100]',
              '[100, 25, 5, 1]',
              '[1, 100, 25, 5]',
              'It throws, because numbers need a comparator',
            ],
            answer: 2,
            explanation: 'Without a comparator, the values are compared as strings: "1" < "100" < "25" < "5" (character by character: "1" vs "2" vs "5"). Result: [1, 100, 25, 5].',
            misconceptions: {
              0: 'That is the numeric order — you only get it with `(a, b) => a - b`. The default comparison is on strings.',
              1: 'Default sort is ascending (by string), never descending.',
              3: 'It silently "works" with string comparison. No error — which is what makes the bug dangerous.',
            },
          },
        ],
      },
      {
        id: 'optimized-comparator',
        title: 'Optimized approach — writing correct comparators',
        blocks: [
          {
            type: 'compare',
            left: {
              title: 'Wrong: boolean comparator',
              code: `nums.sort((a, b) => a > b);
// true → 1, false → 0
// never returns negative, so the engine
// is never told "a before b" → wrong order
// on many inputs (TimSort relies on < 0)`,
            },
            right: {
              title: 'Right: numeric comparator',
              code: `nums.sort((a, b) => a - b);
// multi-key: score desc, then name asc
people.sort((a, b) =>
  b.score - a.score ||
  a.name.localeCompare(b.name));`,
            },
          },
          {
            type: 'text',
            md: `**Multi-key trick:** \`x || y\` returns \`y\` only when \`x\` is 0 (a tie), which is exactly "compare by the next key on ties".

**Rank maps:** "sort by the order given in \`order\`" → build \`rank = new Map(order.map((v, i) => [v, i]))\` and compare \`rank.get(a) - rank.get(b)\`. O(1) per comparison.

**Pairwise comparators — Largest Number.** To arrange numbers so their concatenation is biggest, put \`a\` before \`b\` when \`a + b > b + a\` (as strings). \`[3, 30]\`: "330" > "303", so 3 goes first. It is not "sort as strings descending": that gives "30" before "3" → "303", which is worse.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the Largest Number comparator (a+b vs b+a) is safe to hand to `sort`, even though it is not "compare by a single key"?',
            deeper: `A sort needs a **consistent total order**: in particular it must be transitive. For concatenation, think of each string s as the infinite repetition s s s …: "a before b iff ab > ba" turns out to be the same as comparing those infinite repetitions, i.e. comparing the fraction a/(10^len(a) − 1) with b/(10^len(b) − 1). Comparing numbers is transitive, so this order is transitive too.

Then an exchange argument shows it is optimal: in any arrangement, if two **adjacent** blocks are in the wrong order (ba where ab > ba), swapping them makes the whole string larger without affecting anything else. So the best arrangement has no such adjacent pair — which is exactly the sorted order.`,
          },
        ],
      },
      {
        id: 'template-comparator',
        title: 'Pattern / template — comparator recipes',
        blocks: [
          {
            type: 'code',
            title: 'Comparator cookbook',
            code: `nums.sort((a, b) => a - b);                       // numbers ascending
nums.sort((a, b) => b - a);                       // numbers descending
words.sort((a, b) => a.localeCompare(b));         // strings (locale-aware)
words.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); // strings by code unit (fast, exact)
words.sort((a, b) => a.length - b.length || a.localeCompare(b)); // length, then alpha

const rank = new Map(order.map((v, i) => [v, i]));
items.sort((a, b) => rank.get(a) - rank.get(b));  // custom order

const idx = names.map((_, i) => i);               // sort indices by a key array
idx.sort((i, j) => heights[j] - heights[i]);
const byHeight = idx.map((i) => names[i]);

const copy = nums.toSorted((a, b) => a - b);      // non-mutating (ES2023)`,
          },
        ],
      },
      {
        id: 'implementation-comparator',
        title: 'JavaScript implementation — Largest Number',
        blocks: [
          {
            type: 'code',
            title: 'Pairwise comparator',
            code: `function largestNumber(nums) {
  const s = nums.map(String);
  s.sort((a, b) => {
    const ab = a + b, ba = b + a;
    return ab > ba ? -1 : ab < ba ? 1 : 0;   // bigger concatenation first
  });
  if (s[0] === '0') return '0';              // all zeros → "0", not "000"
  return s.join('');
}`,
            caption: 'ab and ba have the same length, so plain string comparison equals numeric comparison — no BigInt needed.',
          },
        ],
      },
      {
        id: 'intuition-preprocess',
        title: 'Core intuition — sort as preprocessing',
        blocks: [
          {
            type: 'text',
            md: `Sorting is often not the goal but the **setup**. After sorting you can reason about "the smallest remaining item" or "the item right after me", and that reasoning is what makes greedy scans correct.

Example — **Array of Doubled Pairs**: can the array be split into pairs \`(x, 2x)\`? Sort by **absolute value**. The smallest-magnitude remaining value \`x\` can't be the "double" of anything left (its half would be even smaller in magnitude), so it **must** be paired with \`2x\`. The choice is forced → greedy is safe.

Example — **H-Index**: sort citations descending. Paper at position i (0-based) has at least \`i + 1\` papers with ≥ its citations. h is the largest \`i + 1\` with \`c[i] ≥ i + 1\`.`,
          },
        ],
      },
      {
        id: 'optimized-preprocess',
        title: 'Optimized approach — sort then scan',
        blocks: [
          {
            type: 'steps',
            title: 'Car Fleet (sort + scan from the destination)',
            steps: [
              'Pair each car\'s position with its speed and sort by position **descending** (closest to the target first).',
              'Compute each car\'s arrival time alone: `(target − position) / speed`.',
              'Scan: keep the arrival time of the fleet in front (`lead`). If a car\'s time is ≤ `lead`, it catches up and joins that fleet. Otherwise it starts a new fleet and becomes the new `lead`.',
              'The number of times a new fleet started is the answer.',
            ],
          },
          {
            type: 'checkpoint',
            id: 'sorting-cp-10',
            question: 'Array of Doubled Pairs: why sort by **absolute value** instead of plain ascending order?',
            options: [
              'Because Math.abs is faster than comparing negatives',
              'Because for negatives the double is smaller: −4 is the double of −2. Ascending order would visit −4 first and wrongly look for −8',
              'Because the answer must be sorted by absolute value',
              'Absolute value is not needed; ascending order works for negatives too',
            ],
            answer: 1,
            explanation: 'The greedy rule is "the element with the smallest magnitude must be the half of its pair". Magnitude, not value, is what doubling increases. Sorting by |x| makes the forced choice valid for negatives too.',
            misconceptions: {
              0: 'Speed is irrelevant — it is about which element is guaranteed to be the "half".',
              2: 'The output is just true/false.',
              3: 'With [−4, −2] ascending, −4 comes first, we look for −8, fail, and answer false although (−2, −4) is a valid pair.',
            },
          },
        ],
      },
      {
        id: 'template-preprocess',
        title: 'Pattern / template — sort then greedy',
        blocks: [
          {
            type: 'code',
            title: 'Sort + forced greedy with a count map',
            code: `function canPairDoubles(arr) {
  const count = new Map();
  for (const x of arr) count.set(x, (count.get(x) ?? 0) + 1);
  const keys = [...count.keys()].sort((a, b) => Math.abs(a) - Math.abs(b));
  for (const x of keys) {
    const c = count.get(x);
    if (c === 0) continue;                    // all used up as someone's double
    const need = count.get(2 * x) ?? 0;
    if (x === 0) { if (c % 2) return false; continue; } // zeros pair with zeros
    if (need < c) return false;
    count.set(2 * x, need - c);
  }
  return true;
}`,
          },
        ],
      },
      {
        id: 'implementation-preprocess',
        title: 'JavaScript implementation — Car Fleet',
        blocks: [
          {
            type: 'code',
            title: 'Sort by position, scan from the target',
            code: `function carFleet(target, position, speed) {
  const cars = position.map((p, i) => [p, (target - p) / speed[i]]); // [position, time]
  cars.sort((a, b) => b[0] - a[0]);   // closest to target first
  let fleets = 0, lead = 0;           // lead = arrival time of the fleet ahead
  for (const [, time] of cars) {
    if (time > lead) {                // cannot catch the fleet ahead → new fleet
      fleets++;
      lead = time;
    }                                 // else: catches up and moves at the fleet's pace
  }
  return fleets;
}`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'countInversions([2, 4, 1, 3, 5]) — the final merge',
            columns: ['left (sorted)', 'right (sorted)', 'compare', 'take', 'inversions added', 'total'],
            rows: [
              ['[2, 4]', '[1, 3, 5]', 'inner calls counted', '—', '0 + 0 (left [2,4] sorted; right [1,3,5] had 0)', '0'],
              ['[2, 4] i=0', '[1, 3, 5] j=0', '2 vs 1', '1 (right)', 'mid − i = 2 → (2,1), (4,1)', '2'],
              ['[2, 4] i=0', '[1, 3, 5] j=1', '2 vs 3', '2 (left)', '0', '2'],
              ['[2, 4] i=1', '[1, 3, 5] j=1', '4 vs 3', '3 (right)', '1 → (4,3)', '3'],
              ['[2, 4] i=1', '[1, 3, 5] j=2', '4 vs 5', '4 (left)', '0', '3'],
              ['[2, 4] i=2', '[1, 3, 5] j=2', 'left empty', '5', '0', '3'],
            ],
            note: 'Inversions of [2, 4, 1, 3, 5]: (2,1), (4,1), (4,3) → 3. Every one of them crosses the split between [2, 4] and [1, 3, 5].',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **\`nums.sort()\` on numbers** — sorts as strings: \`[10, 9, 1] → [1, 10, 9]\`. Always pass \`(a, b) => a - b\`.
2. **Boolean comparators** — \`(a, b) => a > b\` returns true/false, never a negative number. Results are wrong on many inputs.
3. **Forgetting that \`sort\` mutates** — the caller's array changes. Use \`toSorted\` or \`[...arr].sort()\` when the original is still needed (and sort *index pairs* when positions matter).
4. **\`a - b\` on huge or non-numeric values** — strings give NaN (inconsistent order); for BigInts return \`a < b ? -1 : a > b ? 1 : 0\`.
5. **Quicksort with a fixed first/last pivot** — O(n²) and stack overflow on sorted input. Randomise.
6. **Merge with \`<\` instead of \`<=\`** — silently loses stability; in inversion counting it counts equal pairs.
7. **Counting sort with negative values** — \`count[-3]++\` creates a string property "-3" on the array object instead of an element. Offset by \`-min\`.
8. **Heavy work inside the comparator** — it runs O(n log n) times. Precompute keys once.
9. **\`Math.max(...bigArray)\`** — spreads onto the call stack and throws a RangeError beyond ~10⁵ elements. Use a loop or \`reduce\`.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'text',
            md: `| Algorithm | Best | Average | Worst | Extra space | Stable? |
|---|---|---|---|---|---|
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes |
| Selection sort | O(n²) | O(n²) | O(n²) | O(1) | no |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
| Quick sort (random pivot) | O(n log n) | O(n log n) | O(n²) (unlikely) | O(log n) stack | no |
| Quickselect | O(n) | O(n) | O(n²) | O(1) iterative | — |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(k) | yes (prefix version) |
| Radix sort (d digits) | O(d(n + b)) | O(d(n + b)) | O(d(n + b)) | O(n + b) | yes |
| JS \`Array.prototype.sort\` (TimSort) | O(n) | O(n log n) | O(n log n) | O(n) | yes |`,
          },
          {
            type: 'complexity',
            time: 'O(n log n) comparison sorts; O(n + k) counting',
            space: 'O(n) merge sort / TimSort; O(log n) quick sort; O(k) counting',
            md: 'When sorting is only preprocessing, the whole solution is usually **O(n log n)** time dominated by the sort, plus O(n) for the scan afterwards. Remember that sorting objects with a comparator costs O(n log n) *comparator calls*, so each call should be O(1).',
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Ask "can I reorder the input?"** If yes, say "let me sort first — O(n log n) — and then…". Interviewers love hearing *why* the sorted order helps.
- **Know the trade-offs by heart:** merge sort = guaranteed n log n + stable + O(n) memory; quick sort = in place + fast in practice + bad worst case (fix: random pivot); counting = linear for small ranges.
- **Mention the JS default-sort trap** when you write \`sort\` — it shows language fluency.
- **For "implement a sort"**, write merge sort: it is short, has no bad case, and is easy to get right under pressure.
- **Prove comparators** in one sentence: "a before b iff ab > ba; swapping any adjacent wrongly-ordered pair increases the result, so sorted order is optimal."
- **Edge cases:** empty array, single element, all equal, already sorted, reverse sorted, negatives, zeros (Largest Number "00" → "0").`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'arr.sort((a, b) => a - b)', use: 'Numeric sort (default sort compares strings!)', complexity: 'O(n log n), stable, mutates' },
              { api: 'arr.toSorted(cmp)', use: 'Sorted copy (ES2023)', complexity: 'O(n log n) + O(n) space' },
              { api: '[...arr].sort(cmp)', use: 'Sorted copy on older runtimes', complexity: 'O(n log n) + O(n) space' },
              { api: 'a.localeCompare(b)', use: 'String comparator returning a number', complexity: 'O(min length)' },
              { api: 'cmp1 || cmp2', use: 'Tie-break with a second key', complexity: 'O(1)' },
              { api: 'new Map(order.map((v, i) => [v, i]))', use: 'Rank map for custom orders', complexity: 'O(n) build, O(1) lookup' },
              { api: 'new Array(k + 1).fill(0)', use: 'Counting-sort buckets', complexity: 'O(k)' },
              { api: 'new Int32Array(nums).sort()', use: 'Numeric sort by default on typed arrays', complexity: 'O(n log n)' },
              { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Swap in partition code', complexity: 'O(1) (allocates a tiny array; a temp variable is faster in hot loops)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Answer does not depend on input order → sort to expose structure', 'Guaranteed/stable O(n log n) or linked lists → merge sort', 'k-th element / in place → quickselect / quicksort', 'Small integer range → counting sort', 'Weird order → comparator'],
    clues: ['any order', 'pair up / group', 'k-th largest', 'count pairs i < j with a[i] > a[j]', '0 <= nums[i] <= 1000', 'sort by … then by …', 'largest number', 'O(n) time on integers'],
    template: `// numbers: ALWAYS pass a comparator
const sorted = nums.toSorted((a, b) => a - b);
// multi-key
items.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
// merge step with inversion count
if (a[i] <= a[j]) buf[k++] = a[i++]; else { inv += mid - i; buf[k++] = a[j++]; }`,
    complexity: 'Comparison sorts Ω(n log n); merge O(n log n)/O(n); quick O(n log n) avg, O(n²) worst; counting O(n + k)',
    mistakes: ['sort() without comparator on numbers', 'boolean comparator', 'forgetting sort mutates', 'fixed pivot on sorted input', '< instead of <= in merge', 'negative values in counting sort'],
    jsTools: ['sort', 'toSorted', 'localeCompare', 'Map (rank)', 'Array(k).fill(0)', 'Int32Array'],
  },

  keyConcepts: [
    'Comparison sorts need Ω(n log n) comparisons (log₂ n! ≈ n log n); counting/radix sort beat it by using values as addresses.',
    'Merge sort: split by position, merge in O(n); log n levels × n work, stable, O(n) extra memory. The merge step counts cross inversions in O(1) each.',
    'Quick sort: partition around a pivot (pivot lands in its final place); random pivot → O(n log n) expected; 3-way partition for duplicates; quickselect is O(n) average.',
    'Stability = equal keys keep their input order; JS sort is stable since ES2019 (TimSort).',
    'JS sort() without a comparator compares strings; comparators must return numbers; sort mutates — use toSorted.',
    'If the answer is invariant under reordering, sorting first often turns O(n²) into O(n log n) with a greedy or two-pointer scan.',
  ],

  interviewTips: [
    'Say "the order does not matter, so I will sort first" and explain what the sorted order gives you.',
    'Compare merge vs quick sort by worst case, stability and memory.',
    'Always write numeric comparators explicitly and mention the default string sort.',
  ],
};
