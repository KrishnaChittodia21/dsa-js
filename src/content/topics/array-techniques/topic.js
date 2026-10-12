export default {
  id: 'array-techniques',
  summary: 'A toolbox of clever single-pass array tricks: Kadane\'s "extend or restart" for best subarrays, cyclic sort and index marking for arrays holding 1..n, Boyer–Moore voting for majority elements, and the next-permutation algorithm.',

  jsTools: [
    { api: 'Math.max / Math.min', use: 'Kadane\'s "extend or restart" decision and tracking the best answer', complexity: 'O(1)' },
    { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Swap for cyclic sort and next permutation (destructuring swap)', complexity: 'O(1), slightly slower than a temp variable in hot loops' },
    { api: 'Math.abs(x)', use: 'Read the original value after index-marking has negated it', complexity: 'O(1)' },
    { api: '-Infinity', use: 'Safe starting value for "best sum" when every number can be negative', complexity: 'O(1)' },
    { api: 'arr.reverse() / manual two-pointer reverse', use: 'Reverse the suffix in next permutation (manual version reverses a sub-range in place)', complexity: 'O(n)' },
    { api: 'x ^ y (XOR)', use: 'Missing number: a ^ a = 0 cancels pairs', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'kadane-max-subarray',
      name: "Kadane's Algorithm — Best Subarray Ending Here",
      summary: 'Scan once; at each index decide whether to EXTEND the best subarray ending at the previous index or RESTART at the current element.',
      whyItExists: 'There are O(n²) subarrays. But the best subarray ending at index i is either nums[i] alone or nums[i] glued onto the best subarray ending at i − 1 — any other choice is dominated. So one number of state per index is enough, and the whole answer is the max over all "ending here" values: O(n) time, O(1) space.',
      whenToUse: [
        'Maximum (or minimum) sum of a contiguous, non-empty subarray',
        'Maximum product subarray (track both max and min ending here)',
        'Circular arrays: best wrapping subarray = total − minimum subarray',
        'Any "best contiguous segment" where the best segment ending at i depends only on the best ending at i − 1',
      ],
      clues: ['"contiguous subarray with the largest sum"', '"maximum product subarray"', '"circular array" + "maximum sum"', 'numbers can be negative (a sliding window would break)', '"at least one element"'],
      whenNotToUse: [
        'The subarray must have a fixed length k → fixed sliding window',
        'The subarray sum must equal / be at most a target → prefix sums (+ hash map or sorted set)',
        'Elements need not be contiguous (subsequence) → greedy or dynamic programming',
      ],
      template: `function maxSubArray(nums) {
  let cur = nums[0];   // best sum of a subarray that ENDS at the current index
  let best = nums[0];  // best sum seen anywhere
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]); // restart or extend
    best = Math.max(best, cur);
  }
  return best;
}`,
      variations: [
        { name: 'Minimum subarray', description: 'Same code with Math.min — used by the circular variant.' },
        { name: 'Circular maximum', description: 'Answer = max(normal Kadane, total − min subarray), except when every number is negative (then total − min would be the empty subarray).' },
        { name: 'Maximum product', description: 'A negative number flips the biggest product into the smallest, so keep both curMax and curMin ending here.' },
        { name: 'Return the indices', description: 'Remember the index where you last restarted; when best improves, record [start, i].' },
        { name: '2D (max sum rectangle)', description: 'Fix a pair of rows, collapse the columns into one array of sums, run 1D Kadane (or a sorted-prefix search when there is an upper bound k).' },
      ],
      mistakes: [
        'Starting best at 0 — an all-negative array must return its largest (negative) element',
        'Resetting cur to 0 instead of to nums[i] (this silently allows an empty subarray)',
        'Circular variant: forgetting the all-negative case where total − min = 0 is the empty subarray',
        'Product variant: updating curMax before computing curMin from the OLD curMax',
      ],
      evolution: {
        easy: 'Plain maximum subarray sum.',
        medium: 'Product version (track min and max), circular version (total − min), return the subarray indices.',
        hard: '2D maximum sum rectangle, or a bounded version ("no larger than k") that needs prefix sums + binary search instead of Kadane.',
      },
    },
    {
      id: 'cyclic-sort',
      name: 'Cyclic Sort (values 1..n → index value − 1)',
      summary: 'When an array of length n holds values in 1..n (or 0..n), every value has a "home" index. Swap each value into its home; afterwards any index whose value is wrong reveals a missing or duplicate number.',
      whyItExists: 'A general sort costs O(n log n) and a hash set costs O(n) extra memory. When values are in 1..n, the value itself tells you exactly where it belongs, so you can place everything with at most n − 1 useful swaps and O(1) extra space.',
      whenToUse: [
        'Values are in the range 1..n (or 0..n, or you can ignore out-of-range values)',
        'Find missing numbers, duplicate numbers, or the first missing positive',
        'O(1) extra space is required and modifying the input is allowed',
      ],
      clues: ['"integers in the range [1, n]"', '"each integer appears once or twice"', '"find the missing / duplicate number"', '"O(1) extra space"', '"first missing positive"', '"without using extra space"'],
      whenNotToUse: [
        'Values are arbitrary (e.g. up to 10^9) with no link to indices → hash set or sort',
        'The input must not be modified (then use XOR/sum math or Floyd cycle detection)',
      ],
      template: `function cyclicSort(nums) {
  let i = 0;
  while (i < nums.length) {
    const home = nums[i] - 1;               // where nums[i] belongs
    if (nums[i] >= 1 && nums[i] <= nums.length && nums[home] !== nums[i]) {
      [nums[i], nums[home]] = [nums[home], nums[i]]; // send it home
    } else {
      i++;                                  // already home, duplicate, or out of range
    }
  }
  // now: nums[i] === i + 1 wherever the value i + 1 exists
}`,
      variations: [
        { name: 'Missing numbers', description: 'After placing, every index i with nums[i] !== i + 1 means i + 1 is missing.' },
        { name: 'Duplicates', description: 'The value sitting at a wrong index is a duplicate.' },
        { name: 'First missing positive', description: 'Ignore values ≤ 0 or > n; the first index with nums[i] !== i + 1 gives the answer.' },
        { name: '0..n instead of 1..n', description: 'Home of value v is index v; value n has no home and is skipped.' },
      ],
      mistakes: [
        'Checking nums[i] !== i + 1 instead of nums[home] !== nums[i] — with duplicates this swaps forever',
        'Incrementing i after a swap: the new value at i also needs to be sent home',
        'Forgetting to skip out-of-range values (≤ 0 or > n)',
      ],
      evolution: {
        easy: 'Missing number / all disappeared numbers.',
        medium: 'Find all duplicates, set mismatch (one duplicate + one missing).',
        hard: 'First missing positive with garbage values mixed in.',
      },
    },
    {
      id: 'index-marking-negation',
      name: 'Index Marking with Negation',
      summary: 'Use the SIGN of nums[v − 1] as a one-bit "I have seen v" flag. The array doubles as its own hash set.',
      whyItExists: 'With values in 1..n, a boolean "seen" array of size n would solve the problem, but costs O(n) space. Every value is positive, so the sign bit of each cell is unused — we can store the boolean there and still recover the original value with Math.abs.',
      whenToUse: [
        'Values in 1..n, you need "seen once / seen twice / never seen" information',
        'O(1) extra space, input may be modified (restore signs afterwards if needed)',
      ],
      clues: ['"1 ≤ nums[i] ≤ n"', '"appear twice"', '"disappeared numbers"', '"without extra space and in O(n) runtime"'],
      whenNotToUse: [
        'Values can be 0 or negative (a sign cannot mark 0; first remap or use cyclic sort)',
        'You need counts larger than 2 (a sign stores only one bit)',
      ],
      template: `function markSeen(nums) {
  for (let i = 0; i < nums.length; i++) {
    const v = Math.abs(nums[i]);     // original value, even if this cell was already marked
    if (nums[v - 1] > 0) nums[v - 1] = -nums[v - 1]; // mark "v seen"
    // else: v was seen before → v is a duplicate
  }
  // index j still positive → value j + 1 never appeared
}`,
      variations: [
        { name: 'Find duplicates', description: 'If nums[v − 1] is already negative when you arrive, v is a duplicate.' },
        { name: 'Find missing', description: 'After the pass, indices whose value is still positive are missing values.' },
        { name: 'Add n instead of negating', description: 'nums[v − 1] += n; later nums[j] > 2n means "seen twice" — stores a count instead of one bit.' },
      ],
      mistakes: [
        'Reading nums[i] instead of Math.abs(nums[i]) after it may have been negated',
        'Negating unconditionally (double negation flips the mark back)',
      ],
      evolution: {
        easy: 'Disappeared numbers.',
        medium: 'All duplicates, set mismatch.',
        hard: 'First missing positive (first clean the array so every value is in 1..n+1, then mark).',
      },
    },
    {
      id: 'boyer-moore-voting',
      name: 'Boyer–Moore Majority Voting',
      summary: 'Keep a candidate and a counter. Same value → +1, different value → −1, counter 0 → adopt a new candidate. A value occurring more than n/2 times always survives.',
      whyItExists: 'Counting with a Map is O(n) space. Voting finds the majority in O(1) space by pairing each majority vote against a different vote: pairs of different values cancel, and a strict majority cannot be fully cancelled.',
      whenToUse: [
        'Element appearing more than ⌊n/2⌋ times (guaranteed or to be verified)',
        'Generalisation: elements appearing more than ⌊n/k⌋ times — keep k − 1 candidates (k = 3 → 2 candidates)',
        'Streaming data where you cannot store counts',
      ],
      clues: ['"appears more than ⌊n / 2⌋ times"', '"more than ⌊n / 3⌋ times"', '"majority element"', '"O(1) space"'],
      whenNotToUse: [
        'You need the most FREQUENT element when no strict majority is guaranteed (use a Map)',
        'You need exact counts of all elements',
      ],
      template: `function majority(nums) {
  let candidate = null, count = 0;
  for (const x of nums) {
    if (count === 0) candidate = x;     // adopt a new candidate
    count += x === candidate ? 1 : -1;  // vote for or against
  }
  return candidate; // verify with a second pass if a majority is not guaranteed
}`,
      variations: [
        { name: 'n/3 (two candidates)', description: 'At most two values can exceed n/3. Keep two candidates; a third value decrements BOTH counters. Always verify with a second counting pass.' },
        { name: 'n/k (k − 1 candidates)', description: 'Misra–Gries summary: k − 1 counters; any value over n/k survives.' },
      ],
      mistakes: [
        'Skipping the verification pass when a majority is not guaranteed',
        'n/3 version: checking "count === 0" BEFORE checking "x equals a candidate" (can put the same value in both slots)',
        'Thinking the final count equals the frequency — it does not',
      ],
      evolution: {
        easy: 'Majority element (> n/2, guaranteed).',
        medium: 'Majority element II (> n/3, not guaranteed, verify).',
        hard: 'Range majority queries (needs extra structures such as segment trees of voting states).',
      },
    },
    {
      id: 'next-permutation',
      name: 'Next Permutation (pivot, swap, reverse)',
      summary: 'Find the rightmost index i with nums[i] < nums[i+1] (the pivot), swap it with the smallest larger value to its right, then reverse the suffix after i.',
      whyItExists: 'Generating all permutations to find the next one is O(n!). Reasoning about which suffix is already at its "largest" order gives the next arrangement in O(n) with O(1) space.',
      whenToUse: [
        'Next / previous lexicographic arrangement of an array or digits',
        '"Next greater number with the same digits"',
        'Iterating permutations in order without recursion (handles duplicates naturally)',
      ],
      clues: ['"next lexicographically greater permutation"', '"rearrange in place"', '"next greater element with the same digits"', '"if not possible, sort ascending"'],
      whenNotToUse: [
        'You need ALL permutations → backtracking',
        'You need the k-th permutation directly → factorial number system',
      ],
      template: `function nextPermutation(nums) {
  let i = nums.length - 2;
  while (i >= 0 && nums[i] >= nums[i + 1]) i--;       // 1. pivot
  if (i >= 0) {
    let j = nums.length - 1;
    while (nums[j] <= nums[i]) j--;                    // 2. smallest larger on the right
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  for (let l = i + 1, r = nums.length - 1; l < r; l++, r--) {
    [nums[l], nums[r]] = [nums[r], nums[l]];           // 3. reverse suffix
  }
}`,
      variations: [
        { name: 'Previous permutation', description: 'Mirror every comparison: pivot where nums[i] > nums[i+1], swap with the largest smaller value.' },
        { name: 'Next greater number with same digits', description: 'Run on the digit array, then check the 32-bit limit.' },
      ],
      mistakes: [
        'Using > instead of >= when scanning for the pivot (breaks on duplicates)',
        'Sorting the suffix instead of reversing it (correct but O(n log n); the suffix is already descending)',
        'Forgetting the "no pivot" case: the whole array is descending → reverse everything',
      ],
      evolution: {
        easy: 'Recognise a descending suffix.',
        medium: 'Next permutation in place.',
        hard: 'k-th permutation, next greater number with same digits under overflow limits.',
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
            md: `This topic is a **toolbox**, not a single pattern. Each tool solves a family of array problems in **one or two passes** and usually **O(1) extra memory**, by exploiting a special property of the input:

| Tool | Special property it exploits | Classic problem |
|---|---|---|
| **Kadane's algorithm** | the best subarray ending at *i* only depends on the best one ending at *i − 1* | Maximum subarray sum |
| **Cyclic sort** | values are in \`1..n\`, so each value has a "home" index | Missing / duplicate numbers |
| **Index marking** | values are positive, so the sign bit is free to use as a flag | Find all duplicates |
| **Boyer–Moore voting** | a strict majority cannot be cancelled out by everyone else | Majority element |
| **Next permutation** | a descending suffix is already the "largest" arrangement | Next permutation |

They look unrelated, but they share one lesson: **before reaching for a hash map or a sort, ask what the constraints give you for free.**`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Terms used in this topic',
            md: `- **Subarray** — a contiguous, non-empty slice \`nums[l..r]\`. (A *subsequence* may skip elements; a subarray may not.)
- **In place** — the algorithm rearranges the input array itself and uses only O(1) extra variables.
- **Majority element** — a value that appears **more than** ⌊n/2⌋ times (strictly more than half).
- **Lexicographic order** — dictionary order: compare the first position where two sequences differ. \`[1,3,2]\` < \`[2,1,3]\` because 1 < 2.
- **Permutation** — a rearrangement of the same elements.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A good mechanic does not use the same wrench for every bolt. These tools are specialised wrenches: each one only fits a certain "bolt shape" (a constraint like "values are 1..n" or "more than half"), but when it fits, it is dramatically faster and lighter than the general-purpose tool.',
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-1',
            question: 'An array of length n contains every integer from 1 to n exactly once, except one number is missing and another is duplicated. Which property makes cyclic sort possible here?',
            options: [
              'The array is already sorted',
              'The array contains negative numbers',
              'Every value v can be linked to exactly one index (v − 1), so the value tells you where it belongs',
              'The array length is a power of two',
            ],
            answer: 2,
            explanation: 'Because values live in 1..n and there are n slots, value v has a natural home: index v − 1. Cyclic sort sends each value home; a slot that ends up with the wrong value exposes the missing and the duplicated numbers.',
            misconceptions: {
              0: 'Cyclic sort does not need sorted input — it *produces* the sorted placement. If it were already sorted you could just scan.',
              1: 'Negatives actually break the idea: a negative value has no home index. (First Missing Positive simply ignores them.)',
              3: 'The length has nothing to do with it. Only the link "value ↔ index" matters.',
            },
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `The general-purpose solutions are always available, but they cost more:

| Problem | General solution | Specialised tool |
|---|---|---|
| Max subarray sum | try every subarray: O(n²) | Kadane: O(n), O(1) space |
| Missing / duplicate in 1..n | Set: O(n) space, or sort: O(n log n) | cyclic sort / marking: O(n), O(1) space |
| Majority element | Map of counts: O(n) space | voting: O(n), O(1) space |
| Next permutation | generate all: O(n!) | pivot-swap-reverse: O(n) |

Interviewers love these problems precisely because the obvious solution works, and the follow-up is *"can you do it in O(1) extra space?"* or *"can you do it in one pass?"*.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why "O(1) extra space" pushes us toward tricks that **modify the input**?',
            deeper: `To answer "which numbers are missing?" you must remember, for each value, whether you have seen it — that is n bits of information. If you cannot allocate a new array, the only place big enough to store n facts is the **input array itself**. Cyclic sort stores the fact "v is present" as *"v sits at index v − 1"*; index marking stores it as *"nums[v − 1] is negative"*. Both reuse memory you already have. (The output array does not count as extra space by convention.)`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `Match the **constraint** to the tool:

- **"Contiguous subarray" + "largest sum/product"** and numbers may be **negative** → Kadane. (With only positive numbers the answer is simply the whole array; with a fixed length it is a sliding window.)
- **"Values in the range [1, n]"** (or 0..n) + missing / duplicate → cyclic sort or index marking.
- **"Appears more than ⌊n/2⌋ (or ⌊n/3⌋) times"** → Boyer–Moore voting.
- **"Next lexicographically greater arrangement"** → next permutation.`,
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-2',
            question: '"Find the contiguous subarray of length exactly k with the largest sum." Which tool fits best?',
            options: [
              "Kadane's algorithm",
              'Fixed-size sliding window',
              'Boyer–Moore voting',
              'Cyclic sort',
            ],
            answer: 1,
            explanation: 'The length is fixed, so every candidate is one window of size k. Slide it: add the entering element, subtract the leaving one. Kadane is for subarrays of *any* length.',
            misconceptions: {
              0: 'Kadane decides freely where each subarray starts, so it would happily return a subarray of the wrong length. Fixed length = sliding window.',
              2: 'Voting is about frequencies of values, not sums of ranges.',
              3: 'Cyclic sort needs values in 1..n and answers missing/duplicate questions, not sums.',
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
            clues: ['"maximum subarray" / "largest sum contiguous"', '"maximum product subarray"', '"circular array"', '"integers in the range [1, n]"', '"O(1) extra space"', '"more than ⌊n/2⌋ times"', '"next permutation"'],
            conclusion: "Think Kadane / cyclic sort / voting / next permutation",
          },
          {
            type: 'text',
            md: `Quick decision list while reading a problem:

1. Is the answer a **contiguous segment** with a best sum/product, and can numbers be negative? → **Kadane**.
2. Do the **values fit the indices** (1..n with n cells)? → **cyclic sort** (to place values) or **negation marks** (to flag "seen").
3. Is there a **"more than a fraction"** frequency guarantee? → **voting**.
4. Is it about the **next arrangement** in dictionary order? → **pivot, swap, reverse**.`,
          },
        ],
      },

      // ---------------- Kadane ----------------
      {
        id: 'brute-force',
        title: 'Brute-force approach — maximum subarray',
        blocks: [
          {
            type: 'text',
            md: 'Problem: given `nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`, find the largest sum of a non-empty contiguous subarray (answer `6`, from `[4, -1, 2, 1]`). The simplest correct idea: try every start, extend the end, keep a running sum.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n²) time, O(1) space',
            code: `function maxSubArray(nums) {
  let best = -Infinity;
  for (let start = 0; start < nums.length; start++) {
    let sum = 0;
    for (let end = start; end < nums.length; end++) {
      sum += nums[end];               // sum of nums[start..end]
      best = Math.max(best, sum);
    }
  }
  return best;
}`,
            caption: 'Already better than the naive O(n³) (re-summing each subarray), but still quadratic.',
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-3',
            question: 'Why can\'t we use a variable sliding window ("grow right, shrink left while the sum is bad") for maximum subarray?',
            options: [
              'Because the window would be too large',
              'Because we need the subarray indices',
              'Because sliding windows only work on strings',
              'Because with negative numbers there is no monotonic rule: removing an element can increase OR decrease the sum',
            ],
            answer: 3,
            explanation: 'A variable window needs a rule like "if this window is bad, every bigger window with the same left edge is bad too". Negative numbers break that: adding a big positive later can rescue a window. Kadane replaces the window with a different invariant.',
            misconceptions: {
              0: 'Windows can be any size; size is not the problem. Monotonicity is.',
              1: 'Windows naturally give indices. That is not why they fail here.',
              2: 'Sliding windows work on any sequence, including numeric arrays.',
            },
          },
        ],
      },
      {
        id: 'intuition-kadane',
        title: "Core intuition — Kadane's \"extend or restart\"",
        blocks: [
          {
            type: 'text',
            md: `Change the question. Instead of "what is the best subarray?", ask for **every index i**: *"what is the best subarray that **ends exactly at i**?"* Call it \`cur(i)\`.

A subarray ending at i is either:
- **just \`nums[i]\`** (we *restart* here), or
- **some subarray ending at i − 1, plus \`nums[i]\`** (we *extend*).

Among all subarrays ending at i − 1, the best one to extend is obviously the one with the biggest sum — that is \`cur(i − 1)\`. So:

\`\`\`text
cur(i) = max( nums[i],  cur(i − 1) + nums[i] )
answer = max over all i of cur(i)
\`\`\`

In plain words: **if the running sum so far is negative, it can only drag nums[i] down — drop it and restart.** Otherwise keep it.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Analogy — a travelling salesperson\'s mood',
            md: 'You walk down a street collecting (+) or losing (−) money at each shop. If the total you are carrying has become negative, it is a debt — you would rather "start fresh" at the next shop than carry the debt with you. As long as your running total is positive, it helps, so you keep it.',
          },
          {
            type: 'visual',
            scenario: 'kadane',
            input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
            caption: 'Watch cur restart whenever carrying the previous sum would hurt, and best record the peak.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why is it correct? (proof sketch)',
            md: `Every non-empty subarray ends at *some* index i, so the true answer equals max over i of "best subarray ending at i". It remains to show the recurrence computes that correctly.

Take the optimal subarray ending at i, \`nums[l..i]\`. If l = i, its sum is \`nums[i]\`. If l < i, then \`nums[l..i−1]\` is a subarray ending at i − 1, so its sum is **at most** \`cur(i − 1)\` — replacing it with the best one ending at i − 1 can only help. Hence \`cur(i) = max(nums[i], cur(i−1) + nums[i])\`. This "the optimal answer contains an optimal smaller answer" argument is called **optimal substructure** — you will see it again in Dynamic Programming, and Kadane is secretly the simplest DP there is.`,
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-4',
            question: 'At some index, `cur` (best sum ending at the previous index) is `-3` and `nums[i] = 5`. What is the new `cur`, and why?',
            options: [
              '2 — always extend, because subarrays must be contiguous',
              '5 — carrying a negative prefix only lowers the sum, so we restart at nums[i]',
              '-3 — the previous value is kept when nums[i] is positive',
              '0 — a negative running sum resets to zero',
            ],
            answer: 1,
            explanation: '`max(5, -3 + 5) = max(5, 2) = 5`. The prefix with sum −3 is a liability, so the best subarray ending here starts fresh at 5.',
            misconceptions: {
              0: 'Contiguity only says the subarray has no gaps; it does not force us to include earlier elements. Starting at i is still contiguous.',
              2: '`cur` is by definition a subarray that ends AT i, so it must include nums[i]. −3 ends at i − 1.',
              3: 'Resetting to 0 corresponds to an *empty* subarray. Some textbook versions do this, but then an all-negative array returns 0 — wrong when the subarray must be non-empty. Reset to nums[i] instead.',
            },
            deeper: 'Re-read the definition: `cur` is "best sum of a subarray **ending exactly here**". It is not "best so far" — that is `best`. Keeping those two variables distinct is the whole trick.',
          },
        ],
      },
      {
        id: 'optimized-kadane-variants',
        title: 'Optimized approach — circular and product variants',
        blocks: [
          {
            type: 'text',
            md: `**Circular array** (the end wraps around to the start). A best subarray either
1. does **not wrap** → ordinary Kadane, or
2. **wraps** → it is "everything except a middle piece". To maximise what is kept, remove the **minimum-sum** subarray: \`total − minSubarray\`.

\`\`\`text
answer = max( maxKadane,  total − minKadane )
\`\`\`

**Edge case:** if every number is negative, the minimum subarray is the *whole* array and \`total − min = 0\` — the empty subarray, which is not allowed. In that case return \`maxKadane\` (the largest single element).`,
          },
          {
            type: 'text',
            md: `**Maximum product subarray.** Multiplying by a negative number flips signs: the *smallest* (most negative) product ending at i − 1 can become the *largest* product ending at i. So track both:

\`\`\`text
candidates = [ nums[i],  curMax * nums[i],  curMin * nums[i] ]
curMax = max(candidates)
curMin = min(candidates)
\`\`\`

Zero is handled automatically: both become 0 and the next element restarts.`,
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-5',
            question: '`nums = [2, -3, -4]`. Why does the product version need `curMin` as well as `curMax`?',
            options: [
              'It doesn\'t — curMax alone gives 24',
              'Because zeros must be tracked separately',
              'Because after [2, -3] the smallest product ending there is -6, and multiplying -6 by -4 gives 24 — the answer comes from the previous MINIMUM',
              'Because the answer can be negative',
            ],
            answer: 2,
            explanation: 'After index 1: curMax = -3 (restart), curMin = -6. At index 2: -6 × -4 = 24 becomes the new maximum. Without curMin we would only see max(-4, -3 × -4 = 12) = 12 and miss 24.',
            misconceptions: {
              0: 'Try it: curMax alone goes 2 → -3 → 12 and returns 12. The 24 comes from the most negative product.',
              1: 'Zeros are handled naturally (products become 0 and the next number restarts). The reason is sign flips.',
              3: 'Negative answers are handled by curMax too. The need for curMin is that a negative times a negative becomes the largest.',
            },
          },
        ],
      },
      {
        id: 'implementation-kadane',
        title: "JavaScript implementation — Kadane's family",
        blocks: [
          {
            type: 'code',
            title: 'Maximum subarray (with indices)',
            code: `function maxSubArrayWithRange(nums) {
  let cur = nums[0], best = nums[0];
  let start = 0, bestL = 0, bestR = 0;
  for (let i = 1; i < nums.length; i++) {
    if (cur + nums[i] < nums[i]) {   // carrying cur hurts → restart
      cur = nums[i];
      start = i;
    } else {
      cur += nums[i];                // extend
    }
    if (cur > best) { best = cur; bestL = start; bestR = i; }
  }
  return { best, range: [bestL, bestR] };
}`,
          },
          {
            type: 'code',
            title: 'Circular maximum — one pass computing max and min together',
            code: `function maxSubarraySumCircular(nums) {
  let total = 0;
  let curMax = 0, bestMax = -Infinity;
  let curMin = 0, bestMin = Infinity;
  for (const x of nums) {
    total += x;
    curMax = Math.max(x, curMax + x); bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(x, curMin + x); bestMin = Math.min(bestMin, curMin);
  }
  return bestMax < 0 ? bestMax : Math.max(bestMax, total - bestMin);
}`,
            caption: 'Starting cur at 0 is fine here because the first max(x, 0 + x) equals x anyway.',
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- Initialise with \`nums[0]\` or \`-Infinity\`, never \`0\`, when the subarray must be non-empty.
- In the product version compute both candidates from the **old** values: \`const a = curMax * x, b = curMin * x;\` then assign. Writing \`curMax = …\` first and then using it for \`curMin\` is a classic bug.
- \`-0\` can appear in products (\`-3 * 0\`). \`Object.is(-0, 0)\` is false but \`-0 === 0\` is true, so ordinary comparisons are fine.`,
          },
        ],
      },
      {
        id: 'dry-run-kadane',
        title: 'Dry run — Kadane',
        blocks: [
          {
            type: 'dryrun',
            title: 'maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])',
            columns: ['i', 'nums[i]', 'cur + nums[i]', 'decision', 'cur', 'best'],
            rows: [
              ['0', '-2', '—', 'start', '-2', '-2'],
              ['1', '1', '-1', 'restart (1 > -1)', '1', '1'],
              ['2', '-3', '-2', 'extend', '-2', '1'],
              ['3', '4', '2', 'restart (4 > 2)', '4', '4'],
              ['4', '-1', '3', 'extend', '3', '4'],
              ['5', '2', '5', 'extend', '5', '5'],
              ['6', '1', '6', 'extend', '6', '6'],
              ['7', '-5', '1', 'extend', '1', '6'],
              ['8', '4', '5', 'extend', '5', '6'],
            ],
            note: 'The restart at i = 3 marks the start of the winning subarray [4, -1, 2, 1].',
          },
          {
            type: 'reflect',
            prompt: 'At i = 7, cur drops from 6 to 1. Do you understand why we still **extend** instead of restarting, and why best is not harmed?',
            deeper: '`cur + nums[i] = 6 + (-5) = 1` is still bigger than restarting at `-5`, so extending is the better "ending here" choice. The drop does not matter for the answer because `best` already stored 6 — `cur` is allowed to go down; `best` only goes up. We would restart only once `cur` itself became negative before adding the next element.',
          },
        ],
      },

      // ---------------- Cyclic sort + marking ----------------
      {
        id: 'intuition-cyclic',
        title: 'Core intuition — cyclic sort',
        blocks: [
          {
            type: 'text',
            md: `If an array of length n holds values from 1..n, the "sorted" array is predictable: **value v belongs at index v − 1**. So we do not need a comparison sort — we can **send every value directly home**:

1. Look at \`nums[i]\`. Its home is \`h = nums[i] − 1\`.
2. If \`nums[h]\` is not already \`nums[i]\`, **swap** them. Now \`nums[h]\` is correct forever. Do **not** advance i — a new value just arrived at i and needs to go home too.
3. Otherwise (it is home, or its home is already occupied by a copy of it — a duplicate, or it is out of range), advance i.

After the pass, scan once: any index j with \`nums[j] !== j + 1\` tells you that value \`j + 1\` is **missing**, and the value sitting there is a **duplicate** (or garbage).`,
          },
          { type: 'visual', scenario: 'cyclic-sort', caption: "Each swap puts one value in its final slot, so there are at most n swaps." },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Analogy — hotel rooms',
            md: 'Guests hold keys numbered 1..n but are standing in random rooms. You go room by room: if the guest in room i has key 5, you walk them to room 5 and swap them with whoever is there. That displaced guest is now in room i, so you deal with them next. Each swap puts one guest in their final room, so there can be at most n − 1 swaps in total.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why is it O(n) even though i sometimes does not move?',
            md: `Count two kinds of steps over the whole run:
- **Increments of i**: at most n.
- **Swaps**: every swap puts one value into its home index, where it stays forever (a correctly placed value is never swapped again, because the check \`nums[h] !== nums[i]\` fails for it). There are only n homes, so there are **at most n swaps in total**.

Total ≤ 2n steps → **O(n)**. This is the same amortized argument as the sliding window: bound the total, not the per-iteration cost.`,
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-6',
            question: 'The swap condition is `nums[nums[i] - 1] !== nums[i]`. Why not the simpler `nums[i] !== i + 1`?',
            options: [
              'With duplicates, nums[i] !== i + 1 can stay true forever: we keep swapping two equal values and loop infinitely',
              'They are identical conditions',
              'The simpler one is slower but also correct',
              'Because indices in JavaScript start at 1',
            ],
            answer: 0,
            explanation: 'Take `[2, 2]` at i = 0: `nums[0] = 2 ≠ 1`, so we "swap" nums[0] with nums[1] — both are 2, nothing changes, and we loop forever. Checking whether the HOME already holds this value detects the duplicate and moves on.',
            misconceptions: {
              1: 'They differ exactly when the home already holds a copy of the value (a duplicate). That is the case that matters.',
              2: 'It is not merely slower — it never terminates on inputs with duplicates.',
              3: 'JavaScript arrays are 0-indexed; that is why the home of value v is v − 1.',
            },
          },
        ],
      },
      {
        id: 'implementation-cyclic',
        title: 'JavaScript implementation — cyclic sort and index marking',
        blocks: [
          {
            type: 'code',
            title: 'Cyclic sort: find all missing numbers in 1..n',
            code: `function findDisappearedNumbers(nums) {
  let i = 0;
  while (i < nums.length) {
    const h = nums[i] - 1;
    if (nums[h] !== nums[i]) [nums[i], nums[h]] = [nums[h], nums[i]];
    else i++;
  }
  const missing = [];
  for (let j = 0; j < nums.length; j++) if (nums[j] !== j + 1) missing.push(j + 1);
  return missing;
}`,
          },
          {
            type: 'text',
            md: `**Index marking** answers the same kind of question without moving anything. Every value is positive, so the sign of \`nums[v − 1]\` is a free bit: **negative means "v has been seen"**.

When we arrive at a cell whose value may already have been negated by someone else, we read its original value with \`Math.abs\`.`,
          },
          {
            type: 'code',
            title: 'Index marking: find all duplicates in 1..n',
            code: `function findDuplicates(nums) {
  const dup = [];
  for (let i = 0; i < nums.length; i++) {
    const v = Math.abs(nums[i]);        // original value
    if (nums[v - 1] < 0) dup.push(v);  // already marked → second time we see v
    else nums[v - 1] = -nums[v - 1];   // mark v as seen
  }
  return dup;
}`,
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-7',
            question: 'In the marking loop, why do we read `Math.abs(nums[i])` instead of `nums[i]`?',
            options: [
              'Because the input may contain negative numbers',
              'For speed',
              'Because an earlier iteration may have negated nums[i] as a "seen" mark; the value itself is still |nums[i]|',
              'Because Math.abs rounds decimals',
            ],
            answer: 2,
            explanation: 'The sign now carries information about a DIFFERENT value (value i + 1). The magnitude still carries the original value stored in this cell. Math.abs separates the two.',
            misconceptions: {
              0: 'The input values are all in 1..n, so they start positive. Negatives appear only because WE created them as marks.',
              1: 'It is required for correctness: using a negative number as an index (v − 1 < 0) would read undefined.',
              3: 'Math.abs does not round; the values are integers anyway.',
            },
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'First Missing Positive — clean up first',
            md: 'When the array may contain 0, negatives or values > n, neither trick works directly. Cyclic sort handles it by simply **skipping** values outside 1..n (they have no home). The marking version first replaces all out-of-range values by n + 1 so every cell is positive, and then marks.',
          },
        ],
      },

      // ---------------- Voting ----------------
      {
        id: 'intuition-voting',
        title: 'Core intuition — Boyer–Moore voting',
        blocks: [
          {
            type: 'text',
            md: `Imagine every element is a voter. **Pair up voters who disagree and send both home.** A strict majority (more than half) cannot be completely paired off, because there are not enough "other" voters to cancel all of them. Whoever is left standing must be the majority.

The algorithm performs this pairing on the fly with one candidate and one counter:

- \`count === 0\` → nobody is "standing"; the current element becomes the candidate.
- Same as candidate → \`count++\` (another supporter).
- Different → \`count--\` (cancel one supporter against this voter).`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Why the majority always survives',
            md: `Each decrement cancels **two different values** (one candidate vote and one non-candidate vote). If the majority value m appears k > n/2 times, cancelling all of m would need at least k non-m votes — but there are only n − k < k of them. So at least one m vote survives, and the survivor at the end is m.

**Warning:** if no majority exists, the final candidate is just "someone" — you must verify with a counting pass.`,
          },
          {
            type: 'text',
            md: `**Generalisation to > ⌊n/3⌋.** At most **two** values can appear more than n/3 times (three of them would need more than n elements). Keep **two** candidates. A value that matches neither and finds no empty slot **decrements both counters** — that cancels a group of three different values. Anything over n/3 survives this "three-way" cancellation, but survivors must be verified with a second pass.`,
          },
          {
            type: 'code',
            title: 'Majority element II (> n/3)',
            code: `function majorityElement(nums) {
  let c1 = null, n1 = 0, c2 = null, n2 = 0;
  for (const x of nums) {
    if (x === c1) n1++;
    else if (x === c2) n2++;
    else if (n1 === 0) { c1 = x; n1 = 1; }
    else if (n2 === 0) { c2 = x; n2 = 1; }
    else { n1--; n2--; }                 // x cancels one vote of each candidate
  }
  const res = [];
  for (const c of [c1, c2]) {
    if (c !== null && nums.filter((x) => x === c).length > nums.length / 3) res.push(c);
  }
  return res;
}`,
            caption: 'Check "equals a candidate" BEFORE "a slot is empty", otherwise the same value can occupy both slots.',
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-8',
            question: 'Run the > n/2 voting algorithm on `[1, 2, 3]` (no majority). What does it return, and what should you conclude?',
            options: [
              'It returns null because no majority exists',
              'It returns 3, which is NOT a majority — voting only guarantees the right answer when a majority exists, so verify with a count',
              'It throws an error',
              'It returns 1, the first element, which is always the majority',
            ],
            answer: 1,
            explanation: '1 is adopted (count 1), 2 cancels it (count 0), 3 is adopted (count 1). The algorithm returns 3. Voting eliminates non-majorities only when a majority exists; otherwise the survivor is arbitrary. A second pass counting the candidate fixes this.',
            misconceptions: {
              0: 'The algorithm never "knows" that there is no majority; it always ends with some candidate.',
              2: 'Nothing in the algorithm can fail; it just returns a meaningless candidate.',
              3: 'The first element is replaced as soon as its count drops to 0.',
            },
          },
        ],
      },

      // ---------------- Next permutation ----------------
      {
        id: 'optimized-next-permutation',
        title: 'Optimized approach — next permutation',
        blocks: [
          {
            type: 'text',
            md: `Think of the array as a number, e.g. \`[1, 3, 5, 4, 2]\` ≈ 13542. The next permutation is the **smallest arrangement that is bigger**. To make a number just slightly bigger, change it as **far to the right** as possible.

1. **Find the pivot.** Scan from the right while the sequence is non-increasing. The suffix \`5, 4, 2\` is descending — it is already the *largest* arrangement of those digits, so nothing inside it can grow. The first index to its left, \`i\` (value 3), is the **pivot**: the rightmost position that *can* be increased.
2. **Swap the pivot with the smallest larger value to its right.** In \`5, 4, 2\` the smallest value > 3 is 4 → \`[1, 4, 5, 3, 2]\`. Because the suffix is descending, scanning from the right finds it immediately.
3. **Reverse the suffix.** After the swap the suffix \`5, 3, 2\` is still descending (the largest order). We want the smallest order, i.e. ascending — reversing a descending run makes it ascending in O(n): \`[1, 4, 2, 3, 5]\`.

If no pivot exists (the whole array is descending, e.g. \`[3, 2, 1]\`), it is the last permutation: reverse everything to get the first one, \`[1, 2, 3]\`.`,
          },
          {
            type: 'dryrun',
            title: 'nextPermutation([1, 3, 5, 4, 2])',
            columns: ['step', 'array', 'note'],
            rows: [
              ['scan', '[1, 3, 5, 4, 2]', '2 ≤ 4 ≤ 5 is descending from the right; 3 < 5 → pivot i = 1'],
              ['find j', '[1, 3, 5, 4, 2]', 'from the right, first value > 3 is 4 at j = 3'],
              ['swap', '[1, 4, 5, 3, 2]', 'suffix [5, 3, 2] is still descending'],
              ['reverse', '[1, 4, 2, 3, 5]', 'suffix now ascending → smallest possible'],
            ],
          },
          {
            type: 'checkpoint',
            id: 'array-techniques-cp-9',
            question: 'After swapping the pivot, why can we **reverse** the suffix instead of sorting it?',
            options: [
              'Reversing and sorting always give the same result',
              'Because the suffix was descending before the swap, and swapping in a value that is just bigger/smaller keeps it descending — so reversing it yields ascending order in O(n)',
              'Because the suffix has at most 2 elements',
              'We cannot; the suffix must be sorted with sort()',
            ],
            answer: 1,
            explanation: 'The pivot value goes to position j, where it is larger than everything right of j (those were ≤ pivot) and smaller than everything left of j within the suffix (those were > pivot). So the suffix stays non-increasing, and reversing a non-increasing run sorts it ascending.',
            misconceptions: {
              0: 'Only true for already-descending sequences. For arbitrary arrays reversing is not sorting.',
              2: 'The suffix can be as long as n − 1.',
              3: 'Sorting works but costs O(n log n) and ignores the structure we just proved.',
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the pivot is the **rightmost** increasable position rather than any position?',
            deeper: 'Changing a position further left changes a "more significant digit" and makes the number jump much more. The next permutation must be the *smallest* increase, so we change the least significant position that can be increased. Positions right of the pivot are in a descending run and cannot be increased by rearranging only themselves.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Kadane (max / min / product)',
            code: `let cur = nums[0], best = nums[0];
for (let i = 1; i < nums.length; i++) {
  cur = Math.max(nums[i], cur + nums[i]);   // Math.min for minimum subarray
  best = Math.max(best, cur);
}
// product: const a = hi * x, b = lo * x;
//          hi = Math.max(x, a, b); lo = Math.min(x, a, b);`,
          },
          {
            type: 'code',
            title: 'Cyclic sort (values 1..n)',
            code: `let i = 0;
while (i < n) {
  const h = nums[i] - 1;
  if (nums[i] >= 1 && nums[i] <= n && nums[h] !== nums[i]) [nums[i], nums[h]] = [nums[h], nums[i]];
  else i++;
}
for (let j = 0; j < n; j++) if (nums[j] !== j + 1) { /* j + 1 missing, nums[j] extra */ }`,
          },
          {
            type: 'code',
            title: 'Voting and next permutation',
            code: `// majority (> n/2)
let cand = null, cnt = 0;
for (const x of nums) { if (cnt === 0) cand = x; cnt += x === cand ? 1 : -1; }

// next permutation
let i = n - 2;
while (i >= 0 && a[i] >= a[i + 1]) i--;
if (i >= 0) { let j = n - 1; while (a[j] <= a[i]) j--; [a[i], a[j]] = [a[j], a[i]]; }
reverse(a, i + 1, n - 1);`,
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Kadane with \`best = 0\`** — all-negative inputs must return the largest element, not 0.
2. **Circular Kadane without the all-negative guard** — \`total − min\` becomes 0 (an empty subarray).
3. **Product Kadane updating \`curMax\` before computing \`curMin\`** from the old value.
4. **Cyclic sort checking \`nums[i] !== i + 1\`** — infinite loop on duplicates; check the home instead.
5. **Advancing i after a swap** in cyclic sort — the newly arrived value is never placed.
6. **Index marking without \`Math.abs\`** — negative index, \`undefined\`, wrong answer.
7. **Voting without verification** when a majority is not guaranteed.
8. **Next permutation with \`>\` instead of \`>=\`** in the pivot scan — duplicates like \`[1, 5, 1]\` break.`,
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n) for every tool',
            space: 'O(1) extra',
            md: `- **Kadane:** one pass, two or three variables.
- **Cyclic sort:** ≤ n increments + ≤ n swaps (each swap finalises one index) → O(n).
- **Index marking:** one pass to mark, one to collect.
- **Voting:** one pass (+ one verification pass).
- **Next permutation:** each of scan, search and reverse touches at most n elements.

The **max-sum rectangle no larger than k** problem is the exception in this topic: it fixes pairs of rows (O(R²)) and runs a prefix-sum search per pair, which needs a sorted structure — O(R² · C log C) with a balanced tree, or O(R² · C²) with a simple scan when the dimensions are small.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Kadane:** say the recurrence out loud — "best ending here is either this element alone or this element plus the best ending at the previous index." Then say why it is correct (optimal substructure).
- **Mention the empty-subarray rule** — ask whether an empty subarray (sum 0) is allowed. Usually it is not.
- **Cyclic sort:** state the O(n) argument: "each swap places one element permanently, so at most n swaps."
- **Say whether you are allowed to modify the input.** If not, cyclic sort and marking are off the table (or restore the array afterwards).
- **Voting:** always mention the verification pass unless the problem guarantees a majority.
- **Next permutation:** explain it as "find the rightmost digit that can grow, grow it minimally, make the rest as small as possible."`,
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
              { api: 'Math.max(a, b, c)', use: 'Kadane decisions; takes any number of arguments', complexity: 'O(1) for a fixed count' },
              { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Readable in-place swap', complexity: 'O(1)' },
              { api: 'Math.abs', use: 'Recover the original value after sign marking', complexity: 'O(1)' },
              { api: '-Infinity / Infinity', use: 'Neutral starting values for max / min', complexity: 'O(1)' },
              { api: 'arr.filter(...).length', use: 'Verification count in voting (O(n) — fine once)', complexity: 'O(n)' },
              { api: 'x ^ y', use: 'XOR cancels equal values: missing number = XOR of indices and values', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Largest sum/product contiguous subarray (negatives allowed)', 'Values in 1..n + missing/duplicate + O(1) space', 'More than n/2 or n/3 occurrences', 'Next lexicographic arrangement'],
    clues: ['maximum subarray', 'maximum product', 'circular array', 'range [1, n]', 'appears twice', 'O(1) extra space', 'majority', 'next permutation'],
    template: `cur = max(x, cur + x); best = max(best, cur)          // Kadane
while (i < n) nums[nums[i]-1] !== nums[i] ? swap : i++ // cyclic sort
nums[|v|-1] = -|nums[|v|-1]|                           // mark seen
count === 0 ? cand = x : 0; count += x === cand ? 1 : -1 // voting
pivot ← scan right; swap with next larger; reverse suffix // next permutation`,
    complexity: 'O(n) time, O(1) extra space (all tools)',
    mistakes: ['best = 0 in Kadane', 'circular all-negative case', 'product: use old max/min', 'cyclic sort: check the home, not i + 1', 'verify voting candidates', 'next permutation: >= in the pivot scan'],
    jsTools: ['Math.max', 'Math.min', 'Math.abs', 'destructuring swap', '-Infinity'],
  },

  keyConcepts: [
    'Kadane: the best subarray ending at i is nums[i] alone or nums[i] + best ending at i − 1 ("extend or restart").',
    'Circular max = max(Kadane max, total − Kadane min), unless every number is negative.',
    'Product max needs both max and min ending here, because a negative flips them.',
    'Cyclic sort: value v goes to index v − 1; at most n swaps because each one finalises a slot.',
    'Index marking stores "seen" in the sign bit; read values with Math.abs.',
    'Boyer–Moore voting: pairs of different values cancel; a strict majority survives. Verify when not guaranteed; k − 1 candidates for > n/k.',
    'Next permutation: rightmost pivot, swap with the smallest larger value on its right, reverse the suffix.',
  ],

  interviewTips: [
    'Ask whether the subarray may be empty and whether you may modify the input.',
    'State Kadane\'s recurrence and its optimal-substructure proof.',
    'Justify cyclic sort\'s O(n) with the "each swap fixes one slot" argument.',
    'Always mention the verification pass for voting.',
  ],
};
