export default {
  id: 'binary-search',
  summary: 'When the data is sorted — or a yes/no question flips from "no" to "yes" exactly once — one comparison in the middle lets you throw away half of the remaining candidates, so n candidates need only about log₂ n checks.',

  jsTools: [
    { api: 'lo + ((hi - lo) >> 1)', use: 'Middle index without overflow; bit shift = fast floor division by 2 (only safe while values < 2^31)', complexity: 'O(1)' },
    { api: 'Math.floor((lo + hi) / 2)', use: 'Middle for large numeric ranges (answers up to 2^53); JS numbers do not overflow like int32', complexity: 'O(1)' },
    { api: 'Math.ceil(a / b)', use: 'Hours to eat a pile, days for a load: the typical "cost of a candidate answer"', complexity: 'O(1)' },
    { api: 'arr.findIndex / indexOf', use: 'Linear scan — O(n). Fine for a brute force, never the binary-search answer', complexity: 'O(n)' },
    { api: 'arr.sort((a, b) => a - b)', use: 'Sort first when the problem allows it (default sort is lexicographic!)', complexity: 'O(n log n)' },
    { api: 'Map<key, Array>', use: 'Per-key sorted timelines (Time Based Key-Value Store)', complexity: 'O(1) average lookup' },
  ],

  patterns: [
    {
      id: 'binary-search-exact',
      name: 'Binary Search — Exact Match (lo <= hi)',
      summary: 'Look at the middle; if it is the target you are done, otherwise discard the half that cannot contain it. Stop when the range is empty.',
      whyItExists: 'In a sorted array, comparing the target with nums[mid] tells you on which side the target must be: everything on the other side is too small (or too big). One comparison removes half the candidates, so the number of candidates goes n → n/2 → n/4 → … → 1 after about log₂ n steps.',
      whenToUse: [
        'Sorted array (or a structure that can be viewed as one, like a row-major sorted matrix) and you want the index of an exact value',
        'You only need "found / not found" (or the index when present)',
      ],
      clues: ['"sorted array"', '"return the index of target, or -1"', '"must run in O(log n)"', '"each row is sorted and the first of each row is bigger than the last of the previous"'],
      whenNotToUse: [
        'The data is unsorted and you would need to sort it just for one lookup (a linear scan is O(n) < O(n log n))',
        'You need the first/last position among duplicates → use the boundary template',
        'Linked lists: no O(1) access to the middle, so binary search loses its advantage',
      ],
      template: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;       // search space = [lo, hi] (closed)
  while (lo <= hi) {                       // not empty
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;  // mid and everything left of it is too small
    else hi = mid - 1;                     // mid and everything right of it is too big
  }
  return -1;
}`,
      variations: [
        { name: '2D matrix as 1D', description: 'Index i ↦ (Math.floor(i / cols), i % cols) lets one binary search cover a row-major sorted matrix.' },
        { name: 'Search on a numeric range', description: 'Valid Perfect Square: search x in [1, num] with the comparison x*x vs num.' },
      ],
      mistakes: [
        'Using lo < hi with hi = mid - 1: the last remaining candidate is never examined',
        'Writing lo = mid (instead of mid + 1) in the closed template → infinite loop when lo === mid',
        'Starting hi at nums.length in the closed template → nums[mid] can be undefined',
      ],
      evolution: {
        easy: 'Plain sorted-array lookup.',
        medium: 'Same search over a virtual array (2D matrix, numeric range, key timeline).',
        hard: 'Exact match is rarely the hard part — hard problems move to boundaries and binary search on the answer.',
      },
    },
    {
      id: 'binary-search-boundary',
      name: 'Binary Search — Boundaries (lower bound / upper bound)',
      summary: 'Find the FIRST index where a monotonic condition becomes true (e.g. nums[i] >= target). Uses the half-open template lo < hi with hi = mid.',
      whyItExists: 'Many questions are not "is x here?" but "where does x start / where would it go?". Over a sorted array the condition nums[i] >= target is false…false,true…true. Finding the first true is a clean, duplicate-proof binary search, and first/last occurrence, insert position, floor/ceiling and counting all reduce to it.',
      whenToUse: [
        'Insert position, first/last occurrence, count of a value in a sorted array',
        'Largest element ≤ x (floor) or smallest element ≥ x (ceiling)',
        '"Most recent entry at or before time t"',
      ],
      clues: ['"first position"', '"last position"', '"insert position"', '"where it would be inserted"', '"largest timestamp <= t"', '"count occurrences in sorted array"'],
      whenNotToUse: [
        'The condition is not monotonic along the array (true, false, true…) — binary search would give arbitrary answers',
      ],
      template: `// first index i in [0, n] with nums[i] >= target (n if none)
function lowerBound(nums, target) {
  let lo = 0, hi = nums.length;          // half-open [lo, hi): hi may be the answer "n"
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] >= target) hi = mid;   // mid might be the first true → keep it
    else lo = mid + 1;                   // mid is false → the answer is right of it
  }
  return lo;                             // lo === hi === first true
}
// upperBound: same with nums[mid] > target → first index greater than target`,
      variations: [
        { name: 'First occurrence', description: 'i = lowerBound(nums, t); found if i < n && nums[i] === t.' },
        { name: 'Last occurrence', description: 'upperBound(nums, t) − 1 (check it is t).' },
        { name: 'Count of t', description: 'upperBound(t) − lowerBound(t).' },
        { name: 'Floor (largest ≤ x)', description: 'upperBound(x) − 1.' },
      ],
      mistakes: [
        'Using hi = nums.length - 1 when the answer may be n (target larger than every element)',
        'Writing hi = mid - 1 in the lo < hi template: can skip the answer',
        'Returning -1 without checking nums[lo] === target for first-occurrence questions',
      ],
      evolution: {
        easy: 'Search Insert Position (plain lower bound).',
        medium: 'First and last position (lower + upper bound), timelines keyed by time.',
        hard: 'Boundaries over computed predicates (binary search on the answer) and counting with bounds.',
      },
    },
    {
      id: 'binary-search-rotated',
      name: 'Binary Search — Rotated Sorted Array',
      summary: 'A rotated sorted array is two sorted runs. At every mid, at least one half ([lo, mid] or [mid, hi]) is fully sorted — use it to decide which half can hold the target.',
      whyItExists: 'Rotation breaks the global order, but not completely: cutting at mid always leaves at least one side without the "drop" point, so that side is sorted and a range check on it is reliable. That is enough to discard half each step.',
      whenToUse: ['Search / minimum / rotation count in an array that was sorted and then rotated', 'Distinct values (duplicates degrade the worst case to O(n))'],
      clues: ['"rotated at an unknown pivot"', '"sorted in ascending order, then rotated"', '"find the minimum" in O(log n)'],
      whenNotToUse: ['Many duplicates: when nums[lo] === nums[mid] === nums[hi] you cannot tell which half is sorted and must shrink by one'],
      template: `function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {                         // left half sorted
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                             // right half sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
      variations: [
        { name: 'Find minimum', description: 'Compare nums[mid] with nums[hi]: if nums[mid] > nums[hi] the drop (minimum) is right of mid, else it is at mid or left.' },
        { name: 'With duplicates', description: 'If nums[mid] === nums[hi], do hi-- (worst case O(n)).' },
      ],
      mistakes: [
        'Using < instead of <= in nums[lo] <= nums[mid] (fails when lo === mid)',
        'Comparing with nums[lo] for the minimum problem — nums[hi] is the reliable reference',
        'Checking the range on the unsorted half',
      ],
      evolution: {
        easy: 'Find the minimum of a rotated array.',
        medium: 'Search a target in a rotated array.',
        hard: 'Rotated arrays with duplicates; rotation + another constraint.',
      },
    },
    {
      id: 'binary-search-on-answer',
      name: 'Binary Search on the Answer',
      summary: 'The answer is a number in a known range, and "can we succeed with value x?" is monotonic (once true, stays true). Binary search x; each check is a greedy/counting pass.',
      whyItExists: 'Optimisation problems ("minimum speed", "minimum largest sum") are hard to solve directly, but checking a proposed answer is often a simple O(n) greedy. If feasible(x) implies feasible(x + 1), the feasible values form a suffix of the range and we can find the first feasible one with a lower-bound search: O(n log R) total.',
      whenToUse: [
        '"Minimise the maximum" / "maximise the minimum"',
        'Minimum speed / capacity / time such that something finishes within a limit',
        'k-th smallest value when you can COUNT how many values are ≤ x quickly',
      ],
      clues: ['"minimum capacity so that … within D days"', '"minimum eating speed"', '"minimize the largest sum"', '"k-th smallest" with a huge implicit set', '"at least / at most" limits and a numeric answer'],
      whenNotToUse: [
        'feasible(x) is not monotonic',
        'You cannot check a candidate faster than brute-forcing the whole problem',
      ],
      template: `function minFeasible(lo, hi, feasible) {
  // invariant: the answer is in [lo, hi]; feasible(hi) is true
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);  // Math.floor: answers can exceed 2^31
    if (feasible(mid)) hi = mid;            // mid works → maybe something smaller works too
    else lo = mid + 1;                      // mid fails → everything below fails too
  }
  return lo;
}`,
      variations: [
        { name: 'Minimise (first true)', description: 'Predicate false…false,true…true → lower bound, hi = mid.' },
        { name: 'Maximise (last true)', description: 'Predicate true…true,false…false → use mid = lo + ceil((hi-lo)/2) and lo = mid, or search the first false and subtract one.' },
        { name: 'k-th smallest by counting', description: 'feasible(x) = count(values ≤ x) ≥ k. Counting is often a two-pointer or matrix walk.' },
        { name: 'Integer square root', description: 'Largest x with x*x ≤ n — a "last true" search.' },
      ],
      mistakes: [
        'Wrong range: lo must be a value that could be the answer (e.g. max(weights), not 0, for ship capacity)',
        'Predicate direction reversed (hi = mid when mid is infeasible)',
        'Using (lo + hi) >> 1 when lo + hi can exceed 2^31 − 1 — the shift works on int32 and returns garbage',
        'Last-true search with floor mid and lo = mid → infinite loop',
      ],
      evolution: {
        easy: 'Integer square root (predicate x*x <= n).',
        medium: 'Koko bananas, ship capacity: predicate = greedy simulation.',
        hard: 'Split array largest sum, k-th smallest pair distance: predicate = greedy/two-pointer counting over a sorted array.',
      },
    },
    {
      id: 'binary-search-peak',
      name: 'Binary Search — Peak / Slope',
      summary: 'Even on unsorted data, comparing nums[mid] with nums[mid + 1] tells you which direction is "uphill", and a peak must exist uphill.',
      whyItExists: 'If nums[mid] < nums[mid + 1], walking right keeps climbing until either it falls (a peak) or the array ends (the end is a peak because the outside is −∞). So a peak exists in [mid + 1, hi]; the left half can be discarded even though the array is not sorted.',
      whenToUse: ['Find any local maximum/minimum', 'Bitonic / mountain arrays', 'Any array where a local comparison proves an answer exists on one side'],
      clues: ['"find a peak element"', '"nums[-1] = nums[n] = -∞"', '"return any of the peaks"', '"mountain array"'],
      whenNotToUse: ['You need the GLOBAL maximum of an arbitrary array (requires O(n))', 'Equal neighbours (plateaus) break the uphill argument'],
      template: `function findPeak(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] < nums[mid + 1]) lo = mid + 1; // uphill to the right
    else hi = mid;                                // mid is a peak or downhill → peak at/left of mid
  }
  return lo;
}`,
      variations: [{ name: 'Peak index in a mountain array', description: 'Exactly one peak; the same template finds it.' }],
      mistakes: ['Using lo <= hi and reading nums[mid + 1] out of bounds', 'Expecting the global maximum'],
      evolution: { easy: 'Peak index in a mountain array.', medium: 'Find any peak (multiple peaks).', hard: 'Peak in a 2D grid (binary search on columns + column max).' },
    },
    {
      id: 'binary-search-partition',
      name: 'Binary Search — Partition of Two Sorted Arrays',
      summary: 'Binary search a cut position in the shorter array; the matching cut in the other array is forced. Fix the cut until every element on the left is ≤ every element on the right.',
      whyItExists: 'The median splits the merged array into two equal halves. We do not need to merge: choosing i elements from A forces half − i from B, and whether the cut is too far right or too far left is a monotonic test (A[i−1] > B[j] means "too far right"). So the cut can be binary searched in O(log min(m, n)).',
      whenToUse: ['Median or k-th element of two sorted arrays in logarithmic time'],
      clues: ['"two sorted arrays"', '"median"', '"O(log (m+n))"'],
      whenNotToUse: ['O(m + n) is acceptable — a two-pointer merge is much simpler'],
      template: `// cut A at i, B at j = half - i; valid when
// A[i-1] <= B[j] && B[j-1] <= A[i]   (use -Infinity / Infinity outside the arrays)`,
      variations: [{ name: 'k-th of two sorted arrays', description: 'Same idea with half replaced by k.' }],
      mistakes: ['Binary searching the longer array (j can become negative)', 'Forgetting ±Infinity sentinels at the edges', 'Mixing up odd/even total length'],
      evolution: { easy: '—', medium: 'k-th smallest of two sorted arrays by discarding k/2 each step.', hard: 'Median of two sorted arrays via partition.' },
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
            md: `**Binary search** is the "guess the number" strategy. I am thinking of a number between 1 and 100; after each guess I say *higher* or *lower*. If you always guess the middle of what is left, you need at most **7** guesses — because each answer throws away half of the numbers that were still possible.

\`\`\`text
1 ─────────────── 100   guess 50 → "higher"
          51 ──── 100   guess 75 → "lower"
          51 ─ 74       guess 62 → ...
\`\`\`

In code, the "numbers still possible" are a range of indices \`[lo, hi]\`. We look at the middle index \`mid\`, compare, and move either \`lo\` or \`hi\` past \`mid\`.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Search space** — the set of candidates that could still be the answer, usually an index range \`[lo, hi]\` or a range of numbers.
- **Monotonic** — only ever goes one way. A *monotonic predicate* is a yes/no question whose answers look like \`no no no yes yes yes\` (never flipping back).
- **Invariant** — a statement that is true before and after every loop iteration, e.g. *"if the target exists, it is inside [lo, hi]"*.
- **Lower bound** — the first index whose value is **≥** x. **Upper bound** — the first index whose value is **>** x.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Looking up a word in a paper dictionary: you open near the middle, see "M", and know your word "cat" is in the left half — you never read the right half. You can only do this because the dictionary is **sorted**.',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-1',
            question: 'Binary search needs roughly how many comparisons to search a sorted array of **1,000,000** elements?',
            options: ['About 1,000', 'About 500,000', 'About 1,000,000', 'About 20'],
            answer: 3,
            explanation: 'Each comparison halves the candidates: 2^20 ≈ 1,048,576, so 20 halvings take a million candidates down to one. That is log₂(n).',
            misconceptions: {
              0: '1,000 is √n. That would be a "jump search" style algorithm, not halving.',
              1: 'n/2 is the *average* cost of a linear scan. Binary search throws away half per step, not one element per step.',
              2: 'That is the worst case of a linear scan, which looks at every element.',
            },
            deeper: 'Count how many times you can halve n before reaching 1: n → n/2 → n/4 → … → 1 takes k steps where n / 2^k = 1, i.e. k = log₂ n. Doubling the input adds just ONE more step.',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `A linear scan checks elements one by one: O(n). Binary search is O(log n). For n = 10^9 that is a billion steps versus **30**.

But the real power is broader than sorted arrays. Binary search works on **any search space where one check tells you which side the answer is on**. That includes:

| Search space | The check that halves it |
|---|---|
| sorted array | \`nums[mid]\` vs \`target\` |
| rotated sorted array | "which half is sorted, and is the target inside it?" |
| unsorted array (peak) | "is \`nums[mid+1]\` bigger?" → a peak exists on the right |
| range of possible answers | "can we finish with speed \`mid\`?" |`,
          },
          {
            type: 'compare',
            left: { title: 'Linear scan — O(n)', code: `for (let i = 0; i < nums.length; i++) {
  if (nums[i] === target) return i;
}
return -1;` },
            right: { title: 'Binary search — O(log n)', code: `let lo = 0, hi = nums.length - 1;
while (lo <= hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (nums[mid] === target) return mid;
  if (nums[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}
return -1;` },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **why** one comparison is allowed to discard half of the array — why we are sure the target is not in the discarded part?',
            deeper: `Suppose \`nums[mid] < target\`. Because the array is sorted, every index \`i ≤ mid\` has \`nums[i] ≤ nums[mid] < target\`. So **none** of them can equal the target — we have *proved* the left half (including mid) is useless, without looking at it. That proof is the whole trick.

Sortedness is just one way to get such a proof. More generally we need a **monotonic predicate**: a yes/no question \`P(i)\` that is \`false\` for a prefix and \`true\` for the rest. If \`P(mid)\` is false, every index before it is false too; if it is true, every index after it is true too. One evaluation at \`mid\` therefore settles half the indices.`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Use binary search when you can phrase the problem as **"find the boundary where a monotonic yes/no question flips"**:

1. **Sorted input** + find a value / position / count → classic search or lower/upper bound.
2. **Almost sorted** (rotated) → at each mid one half is sorted.
3. **Local slope** (peak finding) → compare mid with its neighbour.
4. **Numeric answer** whose feasibility is monotonic → *binary search on the answer*.
5. The problem **demands O(log n)** — a loud hint.

It does **not** help when the data is unsorted and you only search once (sorting costs O(n log n), more than a scan), or on a linked list (reaching the middle costs O(n)).`,
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-2',
            question: 'Which of these can be solved with binary search?',
            options: [
              'Find a value in an unsorted array, searched only once',
              'Find the minimum eating speed k so that all banana piles are eaten within h hours',
              'Find the middle node of a singly linked list',
              'Count how many times each word appears in a text',
            ],
            answer: 1,
            explanation: 'If speed k finishes in time, any speed > k also does — feasibility is monotonic in k. So we binary search k in [1, max pile], checking each candidate in O(n).',
            misconceptions: {
              0: 'Without order, nums[mid] tells you nothing about the other elements. And sorting first (O(n log n)) is slower than a single O(n) scan.',
              2: 'A linked list has no O(1) access to position mid. Use fast & slow pointers (Linked List topic).',
              3: 'Counting is a hash-map job; there is no yes/no question with a boundary here.',
            },
            deeper: 'The banana problem has no sorted array at all. The "sorted" thing is the answer range 1, 2, 3, … and the predicate "can finish" which looks like `no no no yes yes yes`. This is **binary search on the answer**.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['sorted array / matrix', 'O(log n) required', 'first / last position', 'insert position', 'rotated sorted array', 'minimum X such that…', 'maximize the minimum / minimize the maximum', 'k-th smallest in a huge implicit set', 'peak element'],
            conclusion: 'Think Binary Search — find the monotonic yes/no question and its boundary',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-3',
            question: '"Split the array into k non-empty contiguous parts so that the **largest** part sum is as **small** as possible." What is the monotonic predicate?',
            options: [
              '"Is nums[mid] greater than k?"',
              '"Is the array sorted?"',
              '"Is the sum of the first mid elements equal to k?"',
              '"Can we split into at most k parts where every part sum is ≤ x?" — if yes for x, then yes for every bigger x',
            ],
            answer: 3,
            explanation: 'Allowing a bigger limit x never makes the split harder, so feasible(x) is `false…false,true…true`. Binary search x between max(nums) and sum(nums); check greedily.',
            misconceptions: {
              0: 'The array is not sorted and k is a count of parts — comparing values with k means nothing.',
              1: 'Sortedness of the input is irrelevant. The monotonic thing is the answer range.',
              2: 'This mixes a prefix sum with k and is not monotonic in a useful way.',
            },
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Think of the search space as a strip of candidates, and keep **one invariant** true the whole time:

> *If the answer exists, it is inside \`[lo, hi]\`.*

Each iteration:
1. Pick \`mid\` inside the range.
2. Ask the question at \`mid\`.
3. Move \`lo\` or \`hi\` so the invariant still holds **and the range strictly shrinks**.

When the range is empty (or has one element, depending on the template) you are done. Every binary-search bug is a violation of one of those two rules: either the answer fell out of the range, or the range stopped shrinking (infinite loop).`,
          },
          {
            type: 'visual',
            scenario: 'binary-search',
            input: { nums: [1, 3, 5, 7, 9, 11, 13, 15, 17], target: 13 },
            caption: 'Each step discards the half that cannot contain 13.',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-4',
            question: '`nums = [1, 3, 5, 7, 9]`, target `7`, `lo = 0`, `hi = 4`, so `mid = 2` and `nums[mid] = 5`. What is the new range?',
            options: ['lo = 2, hi = 4', 'lo = 0, hi = 1', 'lo = 3, hi = 4', 'lo = 0, hi = 2'],
            answer: 2,
            explanation: '5 < 7, so index 2 and everything left of it are too small. The target, if present, is in [3, 4]: set lo = mid + 1 = 3.',
            misconceptions: {
              0: 'Keeping mid (lo = mid) re-examines a value we already know is wrong — and when lo === mid it makes the loop run forever.',
              1: 'That discards the right half, but 7 is bigger than 5, so it lives on the right.',
              3: 'That moves hi, keeping the half of values that are too small.',
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
            md: 'Problem: **find the index of `target` in a sorted array**, or `-1`. The brute force ignores the order and scans everything.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n) time, O(1) space',
            code: `function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
    if (nums[i] > target) return -1; // tiny optimisation using order — still O(n)
  }
  return -1;
}`,
            caption: 'The early exit uses sortedness a little, but the worst case (target near the end) still reads every element.',
          },
        ],
      },
      {
        id: 'optimized',
        title: 'Optimized approach — exact match',
        blocks: [
          {
            type: 'steps',
            title: 'Closed-interval binary search [lo, hi]',
            steps: [
              '`lo = 0`, `hi = n − 1`. The search space is every index from lo to hi **inclusive**.',
              'While `lo <= hi` (the range is non-empty): `mid = lo + ((hi − lo) >> 1)`.',
              'If `nums[mid] === target`, return mid.',
              'If `nums[mid] < target`, mid and everything left are too small → `lo = mid + 1`.',
              'Otherwise mid and everything right are too big → `hi = mid − 1`.',
              'The loop ends when `lo = hi + 1` (empty range): the target is not present → return −1.',
            ],
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why lo <= hi and mid ± 1 go together',
            md: 'With a **closed** range `[lo, hi]`, a one-element range has `lo === hi` and still needs checking — so the condition is `lo <= hi`. Since `mid` itself was checked, we exclude it: `mid + 1` / `mid − 1`. Excluding mid is also what guarantees progress: the range loses at least one element per step, so the loop always terminates.',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-5',
            question: 'Someone writes `while (lo < hi)` but keeps `lo = mid + 1` / `hi = mid − 1` and returns −1 after the loop. Searching `[5]` for `5` returns…',
            options: ['0 — correct', '−1, because the loop never runs when lo === hi, so the single candidate is never compared', 'An infinite loop', 'A TypeError'],
            answer: 1,
            explanation: 'lo = hi = 0, so `lo < hi` is false immediately. The only candidate is never checked. The closed template needs `<=`.',
            misconceptions: {
              0: 'The loop body never executes, so nothing can return 0.',
              2: 'The loop does not execute at all, so it cannot loop forever.',
              3: 'No invalid access happens — the bug is silent, which is what makes it dangerous.',
            },
            deeper: 'Pick the template first, then the details follow: **closed [lo, hi]** ⇒ `lo <= hi`, `hi = n − 1`, `mid ± 1`. **Half-open [lo, hi)** ⇒ `lo < hi`, `hi = n`, `hi = mid`. Mixing parts of the two is the #1 binary search bug.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template — picking lo <= hi or lo < hi',
        blocks: [
          {
            type: 'compare',
            left: {
              title: 'Template A — closed [lo, hi], lo <= hi',
              md: 'Use for **exact match**: you can stop as soon as you see the target, and every checked mid is excluded.',
              code: `let lo = 0, hi = n - 1;
while (lo <= hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (good(mid)) return mid;
  if (tooSmall(mid)) lo = mid + 1;
  else hi = mid - 1;
}
return -1;`,
            },
            right: {
              title: 'Template B — boundary, lo < hi',
              md: 'Use for **first index where P is true** (lower bound, minimum feasible answer, peak). mid may be the answer, so it is kept with `hi = mid`.',
              code: `let lo = 0, hi = n; // n = "none is true"
while (lo < hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (P(mid)) hi = mid;  // keep mid
  else lo = mid + 1;     // discard mid
}
return lo; // first true (lo === hi)`,
            },
          },
          {
            type: 'text',
            md: `**Avoiding infinite loops in Template B.** With floor division, \`mid\` can equal \`lo\` but never \`hi\` (when \`lo < hi\`). So \`hi = mid\` always shrinks the range, and \`lo = mid + 1\` always shrinks it. Safe.

If you instead need the **last** index where P is true and write \`lo = mid\`, then when \`hi = lo + 1\` floor gives \`mid = lo\` and \`lo = mid\` changes nothing → **infinite loop**. Fix: round up, \`mid = lo + ((hi − lo + 1) >> 1)\`, or (simpler) find the first *false* and subtract one.

**Computing mid in JavaScript.**
- \`(lo + hi) / 2\` gives a fraction in JS — always floor it.
- \`lo + ((hi - lo) >> 1)\` is the classic, fast form for **array indices**.
- \`>>\` converts to a **32-bit signed integer** first: \`(2 ** 31) >> 1\` is \`-1073741824\`! When searching a numeric range that can exceed 2³¹ − 1 (answers like 10^9 + 10^9, or 10^14), use \`Math.floor((lo + hi) / 2)\`. JS numbers are doubles, exact up to 2⁵³, so \`lo + hi\` itself does not overflow like in Java/C++.`,
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-6',
            question: 'You search the **last** index with `nums[i] <= x` using `while (lo < hi) { mid = lo + ((hi - lo) >> 1); if (nums[mid] <= x) lo = mid; else hi = mid - 1; }`. With `lo = 3, hi = 4` and `nums[3] <= x`, what happens?',
            options: [
              'lo becomes 4 and the loop ends',
              'hi becomes 3 and the loop ends',
              'mid = 3, lo = mid = 3 — nothing changes, infinite loop',
              'It returns 3 immediately',
            ],
            answer: 2,
            explanation: 'Floor makes mid = lo when the range has two elements. `lo = mid` then does not move. Round mid up (`lo + ((hi - lo + 1) >> 1)`) whenever the "keep" branch is `lo = mid`.',
            misconceptions: {
              0: 'lo is set to mid, which is 3, not 4. Floor division never picks the upper element of a pair.',
              1: 'The else branch is not taken because nums[3] <= x.',
              3: 'There is no return inside the loop — the boundary template only returns after the loop.',
            },
            deeper: 'Rule: **the branch that keeps mid must be the side floor/ceil does NOT land on.** Floor lands on lo → keep mid with `hi = mid`. Ceil lands on hi → keep mid with `lo = mid`.',
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Exact match, lower bound and upper bound',
            code: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// first index with nums[i] >= target (nums.length if none)
function lowerBound(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// first index with nums[i] > target
function upperBound(nums, target) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] > target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- JS has **no built-in binary search** on arrays. \`indexOf\`, \`includes\`, \`findIndex\` are all O(n) scans.
- If you sort first, pass a comparator: \`nums.sort((a, b) => a - b)\`. The default sort compares **strings** (\`[10, 9, 1].sort()\` → \`[1, 10, 9]\`).
- \`nums[mid]\` past the end is \`undefined\`, and \`undefined < 5\` is \`false\` — no error, just silently wrong answers. Keep indices in range.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'search([-1, 0, 3, 5, 9, 12], 9)',
            columns: ['lo', 'hi', 'mid', 'nums[mid]', 'decision'],
            rows: [
              ['0', '5', '2', '3', '3 < 9 → lo = 3'],
              ['3', '5', '4', '9', 'found → return 4'],
            ],
            note: '6 elements, 2 comparisons. For target 2 the ranges would be [0,5] → [0,1] → [1,1] → [2,1] (empty) → −1.',
          },
          {
            type: 'dryrun',
            title: 'lowerBound([1, 2, 2, 2, 5], 2)',
            columns: ['lo', 'hi', 'mid', 'nums[mid] >= 2?', 'decision'],
            rows: [
              ['0', '5', '2', 'yes (2)', 'hi = 2 (mid may be first)'],
              ['0', '2', '1', 'yes (2)', 'hi = 1'],
              ['0', '1', '0', 'no (1)', 'lo = 1'],
              ['1', '1', '—', '—', 'lo === hi → return 1'],
            ],
            note: 'Even though mid = 2 already hit a 2, the search continued left to find the FIRST 2. upperBound(…, 2) returns 4, so the count of 2s is 4 − 1 = 3.',
          },
        ],
      },
      {
        id: 'intuition-bounds',
        title: 'Core intuition — first / last occurrence',
        blocks: [
          {
            type: 'text',
            md: `With duplicates, "found it" is not enough: \`[5, 7, 7, 8, 8, 10]\`, target 8 — the exact-match search may land on either 8. To get the **first** 8, turn the question into a predicate:

\`\`\`text
index:        0   1   2   3   4   5
nums:         5   7   7   8   8   10
nums[i] >= 8: F   F   F   T   T   T      ← first T = lower bound = 3
nums[i] >  8: F   F   F   F   F   T      ← first T = upper bound = 5
\`\`\`

- first occurrence = \`lowerBound(8)\` = 3 (check \`nums[3] === 8\`)
- last occurrence = \`upperBound(8) − 1\` = 4
- count = \`upperBound − lowerBound\` = 2
- insert position of 8 = \`lowerBound(8)\``,
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-7',
            question: 'In the lower-bound template, when `nums[mid] >= target`, why do we write `hi = mid` instead of `hi = mid − 1`?',
            options: [
              'Because mid itself might be the first index that satisfies the condition, so it must stay in the range',
              'Because mid − 1 might be negative',
              'Only for speed',
              'It makes no difference',
            ],
            answer: 0,
            explanation: 'The invariant is "the first true is in [lo, hi]". mid is true, so the first true is mid or something before it — [lo, mid]. Writing mid − 1 could throw the answer away.',
            misconceptions: {
              1: 'mid − 1 = −1 is possible but that is a symptom; the real problem is losing a valid candidate.',
              2: 'hi = mid is not faster — if anything the range shrinks a little slower. It is about correctness.',
              3: 'On [1, 2, 3] with target 2, `hi = mid − 1` discards index 1 in the first step and returns the wrong position.',
            },
          },
        ],
      },
      {
        id: 'optimized-rotated',
        title: 'Optimized approach — rotated sorted arrays',
        blocks: [
          {
            type: 'text',
            md: `A **rotated** sorted array is a sorted array cut once and swapped: \`[0,1,2,4,5,6,7]\` → \`[4,5,6,7,0,1,2]\`. It is two sorted runs with one "drop" (7 → 0).

**Key fact:** pick any \`mid\`. The drop is either in \`[lo, mid]\` or in \`[mid, hi]\` — not both. The half **without** the drop is sorted, and you can tell which one by comparing endpoints:

- \`nums[lo] <= nums[mid]\` → left half \`[lo, mid]\` is sorted.
- otherwise → right half \`[mid, hi]\` is sorted.

On the sorted half a simple range check \`nums[lo] <= target < nums[mid]\` is reliable. If the target is inside, go there; otherwise go to the other half. Either way, half is discarded.`,
          },
          {
            type: 'code',
            title: 'Find the minimum of a rotated array (distinct values)',
            code: `function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] > nums[hi]) lo = mid + 1; // drop is right of mid
    else hi = mid;                          // mid..hi sorted → min at mid or left
  }
  return nums[lo];
}`,
            caption: 'Predicate: "nums[i] <= nums[last]" is F…F,T…T and the first T is the minimum.',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-8',
            question: '`nums = [4, 5, 6, 7, 0, 1, 2]`, target `0`, lo = 0, hi = 6, mid = 3 (`7`). What do we do?',
            options: [
              'Left half [4,5,6,7] is sorted and 0 is not in [4, 7) → search the right half: lo = 4',
              'Right half is sorted → search it',
              '7 > 0 so go left: hi = 2',
              'Rotation makes binary search impossible — scan linearly',
            ],
            answer: 0,
            explanation: 'nums[0] = 4 <= nums[3] = 7, so [lo, mid] is sorted. 0 is not within [4, 7), so it cannot be on the left. Set lo = mid + 1.',
            misconceptions: {
              1: '[7, 0, 1, 2] contains the drop 7 → 0, so it is not sorted. Compare nums[lo] with nums[mid] to decide which half is sorted.',
              2: 'That is the plain sorted-array rule. In a rotated array small values can be on the RIGHT of big ones.',
              3: 'One half is always sorted, and that is enough information to discard half each step: still O(log n).',
            },
          },
        ],
      },
      {
        id: 'intuition-answer',
        title: 'Core intuition — binary search on the answer',
        blocks: [
          {
            type: 'text',
            md: `Sometimes nothing is sorted — but the **answer** lives in a range of numbers, and you can **check** a candidate.

*Koko eats bananas.* Piles \`[3, 6, 7, 11]\`, \`h = 8\` hours. At speed \`k\` she needs \`Σ ceil(pile / k)\` hours. Find the minimum \`k\` with hours ≤ h.

\`\`\`text
k:          1   2   3   4   5   6  ...  11
hours:     27  15  10   8   8   6  ...   4
hours<=8:   F   F   F   T   T   T  ...   T     ← first T = 4
\`\`\`

Faster eating never takes *more* hours, so the predicate is monotonic, and the minimal \`k\` is a lower-bound search over \`k ∈ [1, max(piles)]\`. Each check costs O(n), so the total is **O(n log max)** instead of O(n · max).`,
          },
          {
            type: 'steps',
            title: 'Recipe',
            steps: [
              '**Name the answer** (speed, capacity, largest sum, distance…).',
              '**Bound it**: `lo` = smallest value that could possibly work, `hi` = a value that surely works.',
              '**Write feasible(x)** — usually a greedy pass or a count.',
              '**Prove monotonicity** in one sentence ("a bigger ship can carry anything a smaller one can").',
              'Run the boundary template: `if (feasible(mid)) hi = mid; else lo = mid + 1;`',
            ],
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-9',
            question: 'Capacity To Ship Packages: weights `[1..10]`, ship them in order within D days. What is the right **lower** limit `lo` for the capacity?',
            options: ['0', '1', 'max(weights) — the heaviest package must fit on the ship', 'sum(weights) / D, rounded down'],
            answer: 2,
            explanation: 'A capacity below the heaviest package can never work (that package cannot be loaded). Starting at max(weights) keeps the invariant "the answer is in [lo, hi]" and makes the greedy check simpler. hi = sum(weights) (everything in one day).',
            misconceptions: {
              0: 'Capacity 0 loads nothing. The search would still work if feasible() handled it, but feasible() must then detect "package heavier than capacity" or it loops forever / miscounts.',
              1: 'Same problem as 0: capacities below the heaviest package are impossible and a naïve greedy check will give wrong day counts.',
              3: 'That is a valid lower bound on its own, but it can be below max(weights); the safe lower limit is max(max(weights), ceil(sum / D)).',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why "minimize the largest part sum" and "can we do it with limit x?" are two faces of the same question?',
            deeper: `The optimisation question asks for the *smallest* x such that a split with all part sums ≤ x exists. The decision question asks, for a fixed x, *does* such a split exist? If you can answer the decision question, the optimum is exactly the boundary where the answer flips from "no" to "yes".

The decision version is easier because a fixed limit makes greedy safe: fill the current part as much as possible before starting a new one. Packing more into an earlier part can never force *more* parts later, so greedy gives the minimum number of parts for that limit.`,
          },
        ],
      },
      {
        id: 'implementation-answer',
        title: 'JavaScript implementation — answer search & counting',
        blocks: [
          {
            type: 'code',
            title: 'Koko Eating Bananas',
            code: `function minEatingSpeed(piles, h) {
  const hoursAt = (k) => {
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / k);
    return hours;
  };
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hoursAt(mid) <= h) hi = mid; // fast enough → try slower
    else lo = mid + 1;               // too slow → must be faster
  }
  return lo;
}`,
            caption: '`Math.max(...piles)` spreads the array into arguments — fine for 10^4 elements, but for 10^5+ use a loop or `reduce` to avoid a call-stack limit.',
          },
          {
            type: 'text',
            md: `**K-th smallest by counting.** When the candidates form a huge implicit set (all n² pair distances, all products in a multiplication table…), don't list them. Binary search the *value* \`x\` and ask: *how many candidates are ≤ x?* That count is monotonic in \`x\`, and the k-th smallest is the first \`x\` with \`count(x) >= k\`.

For pair distances on a **sorted** array the count is a two-pointer sweep: for each \`right\`, advance \`left\` while \`nums[right] − nums[left] > x\`; then \`right − left\` pairs end at \`right\`. \`left\` never moves back, so counting is O(n) (the same amortized argument as sliding windows).`,
          },
          {
            type: 'dryrun',
            title: 'Koko: piles = [3, 6, 7, 11], h = 8',
            columns: ['lo', 'hi', 'mid', 'hours at mid', 'decision'],
            rows: [
              ['1', '11', '6', '1+1+2+2 = 6', '≤ 8 → hi = 6'],
              ['1', '6', '3', '1+2+3+4 = 10', '> 8 → lo = 4'],
              ['4', '6', '5', '1+2+2+3 = 8', '≤ 8 → hi = 5'],
              ['4', '5', '4', '1+2+2+3 = 8', '≤ 8 → hi = 4'],
              ['4', '4', '—', '—', 'return 4'],
            ],
          },
        ],
      },
      {
        id: 'optimized-peak-partition',
        title: 'Optimized approach — peaks and partitions',
        blocks: [
          {
            type: 'text',
            md: `**Peak finding (unsorted!).** A peak is an element bigger than its neighbours, with \`nums[-1] = nums[n] = −∞\`. If \`nums[mid] < nums[mid + 1]\` we are on an uphill slope: keep walking right and either the values fall somewhere (that is a peak) or we hit the end (the last element is a peak, since the outside is −∞). So **a peak is guaranteed in \`[mid + 1, hi]\`** — discard the left. Otherwise \`nums[mid] > nums[mid + 1]\` and by the same argument a peak exists in \`[lo, mid]\`.

Binary search does not need sorted data; it needs *a guarantee about which side holds an answer*.

**Median of two sorted arrays (partition idea).** Cut A after \`i\` elements and B after \`j\` elements with \`i + j = half\` (half of the total, rounded up). The cut is correct when every left element ≤ every right element — since each array is sorted, it is enough to check the four elements next to the cuts:

\`\`\`text
A:  … Aleft=A[i-1] | Aright=A[i] …
B:  … Bleft=B[j-1] | Bright=B[j] …
valid  ⇔  Aleft <= Bright  &&  Bleft <= Aright
\`\`\`

If \`Aleft > Bright\`, i is too big → move it left. If \`Bleft > Aright\`, i is too small → move right. That is monotonic in i, so binary search i over the **shorter** array: O(log min(m, n)). Median = max of the lefts (odd total) or the average of max(lefts) and min(rights) (even total).`,
          },
          {
            type: 'visual',
            scenario: 'median-partition',
            caption: 'i is binary searched over the shorter array and j = half − i follows. Watch which neighbour pair breaks the rule: a too-big left neighbour in A moves i left, a too-big one in B moves i right. −∞ / +∞ stand in past the ends.',
          },
          {
            type: 'checkpoint',
            id: 'binary-search-cp-10',
            question: '`nums = [1, 2, 1, 3, 5, 6, 4]`, `mid = 3` (`nums[3] = 3`, `nums[4] = 5`). Why is it safe to discard indices 0..3 even though index 1 (value 2) is a peak?',
            options: [
              'It is not safe — we might lose the only peak',
              'Because the array is sorted',
              'Because the right side is always bigger',
              'We only need ANY peak, and 3 < 5 guarantees one exists on the right, so the search space can be the right side',
            ],
            answer: 3,
            explanation: 'The invariant is "a peak exists in [lo, hi]", not "every peak is in [lo, hi]". Discarding a peak is fine as long as at least one remains.',
            misconceptions: {
              0: 'The problem accepts any peak. Walking uphill from index 4 must end in a peak (6 at index 5).',
              1: 'The array is clearly not sorted (2, 1 goes down). The halving comes from the slope, not sortedness.',
              2: 'Not in general — only the uphill comparison at mid tells us that the right side contains a peak.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the median search runs on the **shorter** array?',
            deeper: 'With i chosen in A, j = half − i. If A is the longer array, i can be so large that j becomes negative (or larger than B.length), which is not a real cut. Choosing i in [0, m] of the shorter array always keeps j within [0, n] because half ≥ m. It also makes the complexity O(log min(m, n)).',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Mixing templates** — \`lo < hi\` with \`hi = mid − 1\`, or \`lo <= hi\` with \`hi = mid\` (infinite loop when lo = hi = mid).
2. **\`lo = mid\` with floor mid** → infinite loop on two-element ranges. Round up or restructure.
3. **Wrong initial \`hi\`** — \`n − 1\` when "none" (n) is a legal answer, e.g. insert position after the last element.
4. **\`>>\` on big numbers** — values ≥ 2³¹ wrap to negatives. Use \`Math.floor\` for answer ranges.
5. **\`(lo + hi) / 2\` without floor** — JS gives 2.5, and \`nums[2.5]\` is \`undefined\`.
6. **Non-monotonic predicate** — binary search returns *something*, silently wrong. State the monotonicity out loud.
7. **Answer range too small** — ship capacity starting below the heaviest package, sqrt range ending below the root.
8. **Overflow in checks** — \`mid * mid\` for sqrt is fine in JS up to ~9·10^15, but in other languages overflows; comparing \`mid <= x / mid\` avoids it.
9. **Default \`sort()\`** before searching numbers — lexicographic order breaks sortedness.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(log n) search; O(n · log R) for binary search on the answer',
            space: 'O(1) iterative',
            md: `**Why log n:** each iteration keeps at most half of the range (plus or minus one), so after k iterations at most n / 2^k candidates remain; the loop stops once that is below 1 → k ≈ log₂ n.

**On the answer:** log₂ R iterations over a range of size R (e.g. R = 10^9 → 30), each running an O(n) feasibility check.

**Space:** iterative versions keep only lo, hi, mid. A recursive version uses O(log n) call-stack frames — no benefit in JS, so prefer the loop.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Say the invariant** before coding: "the answer is always in [lo, hi]" or "lo is the first index that could be true".
- **Say which template** you use and why: exact match → closed; boundary → half-open.
- **For answer search**, say the three things: the range, the predicate, and why it is monotonic.
- **Test the tiny cases** aloud: 1 element, 2 elements (infinite-loop check), target smaller than all, larger than all.
- If the interviewer says "O(log n)" or "sorted" — they are practically naming the pattern.`,
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
              { api: 'lo + ((hi - lo) >> 1)', use: 'Middle index (array indices < 2^31)', complexity: 'O(1)' },
              { api: 'Math.floor((lo + hi) / 2)', use: 'Middle of big numeric ranges', complexity: 'O(1)' },
              { api: 'Math.ceil(p / k)', use: 'Hours/days needed per item at a given rate', complexity: 'O(1)' },
              { api: 'nums.sort((a, b) => a - b)', use: 'Numeric sort before searching / counting pairs', complexity: 'O(n log n)' },
              { api: 'Math.max(...arr)', use: 'Upper bound of the answer range (use a loop for very large arrays)', complexity: 'O(n)' },
              { api: '-Infinity / Infinity', use: 'Sentinels outside arrays (peak, median partition)', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Sorted array / matrix lookups', 'First/last position, insert position, counts', 'Rotated sorted arrays', 'Min/max answer with a monotonic feasibility check', 'Peak finding', 'Median / k-th of two sorted arrays'],
    clues: ['sorted', 'O(log n)', 'first / last position', 'insert position', 'rotated', 'minimum speed / capacity', 'minimize the maximum', 'k-th smallest', 'peak'],
    template: `// first index where P is true (n if none)
let lo = 0, hi = n;
while (lo < hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (P(mid)) hi = mid;
  else lo = mid + 1;
}
return lo;`,
    complexity: 'O(log n) per search, O(n log R) for answer search, O(1) space',
    mistakes: ['mixing closed and half-open templates', 'lo = mid with floor mid (infinite loop)', 'hi = n − 1 when n is a valid answer', '>> on values ≥ 2^31', 'non-monotonic predicate'],
    jsTools: ['>> 1', 'Math.floor', 'Math.ceil', 'sort((a,b)=>a-b)', 'Infinity sentinels'],
  },

  keyConcepts: [
    'One comparison can discard half the candidates only because of order or a monotonic predicate — that is the proof behind O(log n).',
    'Keep an invariant: "the answer is in [lo, hi]" — and make the range strictly shrink every step.',
    'Closed [lo, hi] with lo <= hi and mid ± 1 for exact matches; half-open with lo < hi and hi = mid for boundaries.',
    'Lower bound (first ≥ x) and upper bound (first > x) answer first/last occurrence, insert position and counts.',
    'In a rotated sorted array one half is always sorted; range-check the sorted half.',
    'Binary search on the answer: range + monotonic feasible(x) + greedy/counting check.',
    'Peak finding works on unsorted data: go uphill, a peak must exist there.',
  ],

  interviewTips: [
    'State the invariant and the template before writing code.',
    'For answer search, name the range, the predicate and the monotonicity argument.',
    'Walk through a 2-element range to prove there is no infinite loop.',
  ],
};
