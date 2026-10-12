export default {
  id: 'two-pointers',
  summary: 'Walk two indices through the data — towards each other, or one reading and one writing — so that every step throws away candidates you can prove are useless, turning O(n²) pair checks into O(n).',

  jsTools: [
    { api: 'arr.sort((a, b) => a - b)', use: 'Numeric sort before sorted-pair / 3Sum problems (default sort is lexicographic!)', complexity: 'O(n log n)' },
    { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'Swap in place (partitioning, Dutch flag, reversing)', complexity: 'O(1)' },
    { api: 's.charCodeAt(i)', use: 'Fast character class checks (letter / digit) for palindrome problems', complexity: 'O(1)' },
    { api: 'ch.toLowerCase()', use: 'Case-insensitive comparisons', complexity: 'O(1) per character' },
    { api: 'Math.min / Math.max', use: 'Heights, bottlenecks, best area so far', complexity: 'O(1)' },
    { api: 'arr.length = k', use: 'Truncate an array in place after a read/write compaction', complexity: 'O(removed)' },
  ],

  patterns: [
    {
      id: 'two-pointers-opposite',
      name: 'Two Pointers — Opposite Ends',
      summary: 'Start one pointer at each end of a sorted array (or a string) and move them towards each other, discarding one end per step.',
      whyItExists: 'Checking all pairs is O(n²). When the data is sorted (or symmetric, like a palindrome), comparing the two ends tells you which end can never be part of an answer, so one step removes a whole row or column of the pair table.',
      whenToUse: [
        'Find a pair in a **sorted** array with a given sum / difference / closest sum',
        'Check symmetry: palindrome, reverse in place',
        'Greedy pairing after sorting (lightest + heaviest)',
      ],
      clues: ['"sorted array"', '"pair that sums to target"', '"palindrome"', '"reverse in place"', '"O(1) extra space"', '"two people per boat"'],
      whenNotToUse: [
        'The array is unsorted and you need original indices → hash map (Two Sum)',
        'You need all pairs, not one decision per step → you may still need O(n²) output',
        'The condition does not tell you which end to drop',
      ],
      template: `function pairWithSum(sorted, target) {
  let left = 0, right = sorted.length - 1;
  while (left < right) {
    const sum = sorted[left] + sorted[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;   // need bigger: left value is too small for EVERY remaining right
    else right--;               // need smaller: right value is too big for EVERY remaining left
  }
  return [-1, -1];
}`,
      variations: [
        { name: 'Palindrome check', description: 'Compare `s[left]` and `s[right]`; skip characters that do not count.' },
        { name: 'Greedy pairing', description: 'Sort, then pair the heaviest with the lightest if they fit (Boats to Save People).' },
        { name: 'Closest sum', description: 'Same movement rule, but track the best |sum − target| seen.' },
      ],
      mistakes: [
        'Forgetting to sort first (or sorting with the default lexicographic comparator)',
        'Using `left <= right` when a pair needs two different elements',
        'Moving both pointers when only one is proven useless',
      ],
      evolution: {
        easy: 'Palindrome check, reverse a string, pair sum in a sorted array.',
        medium: 'Greedy pairing (boats), pair-sum used inside 3Sum.',
        hard: 'Opposite pointers combined with a bottleneck argument (container, trapping rain water).',
      },
    },
    {
      id: 'two-pointers-read-write',
      name: 'Two Pointers — Read / Write (same direction)',
      summary: 'A fast `read` pointer scans every element; a slow `write` pointer marks where the next kept element goes. Compacts an array in place.',
      whyItExists: 'Deleting from the middle of an array with `splice` is O(n) per deletion, so removing many elements is O(n²). Copying only the kept elements forward to a write position is one pass, O(n), with O(1) extra space.',
      whenToUse: [
        'Remove / filter elements **in place** (duplicates, a value, zeros)',
        'Keep relative order of the kept elements',
        'The result is "the first k elements of the array"',
      ],
      clues: ['"in place"', '"O(1) extra memory"', '"return the new length k"', '"keep the relative order"', '"move all X to the end"'],
      whenNotToUse: [
        'You may allocate a new array and simplicity matters more → `filter`',
        'Order of kept elements does not matter and removals are few → swap with the last element instead',
      ],
      template: `function compact(nums, keep) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (keep(nums[read], nums, write)) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write; // nums[0 .. write-1] is the answer
}`,
      variations: [
        { name: 'Remove duplicates (sorted)', description: 'Keep `nums[read]` if it differs from the last written value `nums[write - 1]`.' },
        { name: 'Allow at most 2 copies', description: 'Keep if `write < 2 || nums[read] !== nums[write - 2]`.' },
        { name: 'Move zeroes', description: 'Swap instead of copy so the zeros end up at the back.' },
      ],
      mistakes: [
        'Comparing against `nums[read - 1]` instead of the last *written* value',
        'Using `splice` inside a loop (O(n²) and shifts indices under you)',
        'Returning `write - 1` instead of `write`',
      ],
      evolution: {
        easy: 'Remove element, remove duplicates, move zeroes.',
        medium: 'Keep at most k copies; compaction as one step of a bigger algorithm.',
        hard: 'Read/write combined with other invariants (e.g. string compression, in-place encoding).',
      },
    },
    {
      id: 'two-pointers-merge',
      name: 'Two Pointers — Merge Two Sorted Sequences',
      summary: 'One pointer per sorted input; repeatedly take the smaller (or larger) front element. Fill from the back when merging in place.',
      whyItExists: 'Concatenating and re-sorting costs O((m+n) log(m+n)). Because both inputs are already sorted, the next output element is always one of the two fronts, so a single linear pass suffices.',
      whenToUse: [
        'Merge two sorted arrays / lists',
        'An array that is sorted in two "halves" you can read from the ends (squares of a sorted array)',
        'Intersection / union / difference of sorted arrays',
      ],
      clues: ['"two sorted arrays"', '"merge"', '"in place into nums1 which has enough space"', '"sorted in non-decreasing order" + an operation that breaks order at one end'],
      whenNotToUse: ['Inputs are not sorted', 'More than two inputs → a heap (k-way merge, Heaps topic)'],
      template: `function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}`,
      variations: [
        { name: 'Merge in place from the back', description: 'When the first array has spare room at the end, write the *largest* element at the last free slot so nothing unread is overwritten.' },
        { name: 'Squares of a sorted array', description: 'The largest square is at one of the two ends; fill the output from the back.' },
        { name: 'Intersection of sorted arrays', description: 'Advance the pointer with the smaller value; on equality record and advance both.' },
      ],
      mistakes: [
        'Merging from the front into nums1 and overwriting values not yet read',
        'Forgetting to copy the leftovers of the longer input',
        'Using `<` instead of `<=` when stability matters',
      ],
      evolution: {
        easy: 'Merge two sorted arrays, squares of a sorted array.',
        medium: 'Merge as the combine step of merge sort; interval list intersections.',
        hard: 'k-way merge with a heap; median of two sorted arrays (binary search on the merge).',
      },
    },
    {
      id: 'sort-two-pointers-ksum',
      name: 'Sort + Two Pointers (3Sum / 4Sum)',
      summary: 'Sort, fix the first one (or two) numbers with loops, then solve the remaining pair with opposite-end pointers — skipping equal values to avoid duplicate answers.',
      whyItExists: 'Brute-force 3Sum is O(n³). Fixing one element turns the rest into a sorted pair-sum, which two pointers solve in O(n), for O(n²) total. Sorting also puts equal values next to each other, which makes de-duplication a simple "skip while same as previous".',
      whenToUse: [
        'Find all unique triplets / quadruplets with a given sum',
        'Closest triplet sum',
        'Count triplets with sum < target',
      ],
      clues: ['"triplets"', '"a + b + c = 0"', '"unique quadruplets"', '"no duplicate triplets"', '"closest to target"'],
      whenNotToUse: [
        'You need original indices (sorting scrambles them) — sort index pairs instead or use hashing',
        'Only one pair is needed in an unsorted array → hash map is O(n)',
      ],
      template: `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;       // skip duplicate first values
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;     // skip duplicate second values
      }
    }
  }
  return res;
}`,
      variations: [
        { name: '3Sum Closest', description: 'No de-duplication needed; track the sum with the smallest |sum − target|.' },
        { name: '4Sum / kSum', description: 'Add another outer loop (or recurse) — O(n^(k−1)).' },
        { name: 'Count triplets smaller than target', description: 'When `sum < target`, all `r − l` pairs with this `l` work: add them and `l++`.' },
      ],
      mistakes: [
        'De-duplicating with a Set of `JSON.stringify` strings instead of skipping — slower and hides the logic',
        'Skipping duplicates of `i` by checking `nums[i] === nums[i + 1]` (skips valid triplets like [-1,-1,2])',
        'Forgetting to move l and r after recording a triplet — the loop never ends',
      ],
      evolution: {
        easy: 'Two Sum II (sorted pair).',
        medium: '3Sum, 3Sum Closest, 4Sum.',
        hard: 'kSum generalisation; counting variants with combinatorics for equal values.',
      },
    },
    {
      id: 'dutch-national-flag',
      name: 'Dutch National Flag (Three Pointers)',
      summary: 'Partition an array into three groups (< pivot, = pivot, > pivot) in one pass with `low`, `mid` and `high` pointers.',
      whyItExists: 'Sorting 0/1/2 values with a general sort is O(n log n); counting takes two passes. Three pointers keep four regions — done-low, done-mid, unknown, done-high — and shrink the unknown region by one per step: one pass, O(1) space.',
      whenToUse: [
        'Array with exactly three categories to group (colours, negative/zero/positive, < = > pivot)',
        'Three-way partition inside quicksort to handle many duplicates',
      ],
      clues: ['"0s, 1s and 2s"', '"sort colors"', '"one pass"', '"constant space"', '"three-way partition"'],
      whenNotToUse: ['More than three categories → counting sort', 'Relative order inside a group must be preserved (this is not stable)'],
      template: `function dutchFlag(nums) {
  let low = 0, mid = 0, high = nums.length - 1;
  // [0, low) = 0s | [low, mid) = 1s | [mid, high] = unknown | (high, end] = 2s
  while (mid <= high) {
    if (nums[mid] === 0) { [nums[low], nums[mid]] = [nums[mid], nums[low]]; low++; mid++; }
    else if (nums[mid] === 1) mid++;
    else { [nums[mid], nums[high]] = [nums[high], nums[mid]]; high--; } // do NOT mid++
  }
}`,
      variations: [
        { name: 'Three-way quicksort partition', description: 'Compare with a pivot value instead of 0/1/2.' },
        { name: 'Two groups only', description: 'Drop the middle region — that is plain partitioning (even/odd, negatives first).' },
      ],
      mistakes: [
        'Incrementing `mid` after swapping with `high` — the value that came from `high` has not been examined yet',
        'Looping `mid < high` and never classifying the last unknown element',
      ],
      evolution: {
        easy: 'Sort an array of 0s and 1s (two regions).',
        medium: 'Sort Colors (three regions).',
        hard: 'Three-way partition in quicksort / quickselect with many duplicates; wiggle sort.',
      },
    },
    {
      id: 'two-pointers-partition',
      name: 'Partitioning (Lomuto & Hoare)',
      summary: 'Rearrange an array in place so that everything satisfying a predicate comes before everything that does not — the core step of quicksort and quickselect.',
      whyItExists: 'Many problems only need "these on the left, those on the right", not a full sort. Partitioning does that in one O(n) pass with O(1) space, and it is the building block for quicksort (Sorting topic) and quickselect (k-th element).',
      whenToUse: [
        'Group elements by a yes/no property in place (even before odd, negatives before positives)',
        'Place a pivot in its final sorted position',
        'Quickselect: find the k-th smallest without sorting everything',
      ],
      clues: ['"move all X to the front"', '"in place, order does not matter"', '"k-th largest"', '"partition around a pivot"'],
      whenNotToUse: ['Relative order must be kept → read/write compaction (stable) instead', 'Three groups → Dutch National Flag'],
      template: `// Lomuto: one boundary pointer, scan left → right
function partitionLomuto(nums, isLeft) {
  let boundary = 0;                       // [0, boundary) satisfy isLeft
  for (let i = 0; i < nums.length; i++) {
    if (isLeft(nums[i])) {
      [nums[boundary], nums[i]] = [nums[i], nums[boundary]];
      boundary++;
    }
  }
  return boundary;
}

// Hoare: two pointers from both ends, swap misplaced pairs
function partitionHoare(nums, isLeft) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    while (l <= r && isLeft(nums[l])) l++;
    while (l <= r && !isLeft(nums[r])) r--;
    if (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r--; }
  }
  return l;
}`,
      variations: [
        { name: 'Lomuto', description: 'Simple, one pointer + scanner; does more swaps.' },
        { name: 'Hoare', description: 'Opposite pointers; each swap fixes two misplaced elements; ~3× fewer swaps on average.' },
        { name: 'Quickselect', description: 'Partition, then recurse only into the side containing index k → O(n) average.' },
      ],
      mistakes: [
        'Expecting partitioning to be stable',
        'Off-by-one in the returned boundary',
        'Forgetting `l <= r` guards in the inner Hoare loops (runs off the array)',
      ],
      evolution: {
        easy: 'Sort array by parity, move negatives to the front.',
        medium: 'Kth largest element via quickselect; Dutch flag.',
        hard: 'Wiggle sort II (virtual indexing + 3-way partition).',
      },
    },
    {
      id: 'two-pointers-bottleneck',
      name: 'Two Pointers — Move the Bottleneck (container / trapping water)',
      summary: 'Two pointers at the ends; always move the pointer on the *smaller* side, because the smaller side is the one that limits (or is fully determined by) the answer.',
      whyItExists: 'Problems whose value is limited by the **minimum** of two sides (water height, container height, score = min × width) look like they need all pairs. But the smaller side is either already fully known or cannot improve by keeping it, so it can be finalised and discarded — O(n) instead of O(n²).',
      whenToUse: [
        'Area / volume limited by the shorter of two walls',
        'Water trapped above each bar (min of max-left and max-right)',
        'Score = min(range) × length, growing a range outward from a fixed index',
      ],
      clues: ['"height"', '"container"', '"trap water"', '"min(...) × width"', '"subarray must contain index k"'],
      whenNotToUse: ['The value is not governed by a min/max of the two ends', 'No argument tells you which side is safe to discard'],
      template: `function trap(h) {
  let l = 0, r = h.length - 1, leftMax = 0, rightMax = 0, water = 0;
  while (l < r) {
    leftMax = Math.max(leftMax, h[l]);
    rightMax = Math.max(rightMax, h[r]);
    if (leftMax < rightMax) { water += leftMax - h[l]; l++; }   // left side is the bottleneck
    else { water += rightMax - h[r]; r--; }
  }
  return water;
}`,
      variations: [
        { name: 'Container With Most Water', description: 'Area = min(h[l], h[r]) × (r − l); move the shorter wall.' },
        { name: 'Trapping Rain Water', description: 'The side with the smaller running max has its water level fully determined.' },
        { name: 'Expand outward from k', description: 'Start with l = r = k and extend towards the larger neighbour (Maximum Score of a Good Subarray).' },
      ],
      mistakes: [
        'Moving the taller side — it can only lose width without gaining height',
        'Using h[l] < h[r] for trapping without updating the running maxima first',
        'Adding negative water when the current bar is higher than the running max (update max first)',
      ],
      evolution: {
        easy: 'Max area between two lines by brute force → prove the greedy move.',
        medium: 'Container With Most Water.',
        hard: 'Trapping Rain Water, Maximum Score of a Good Subarray.',
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
            md: `**Two pointers** means keeping two index variables — usually called \`left\` and \`right\` (or \`read\` and \`write\`) — and moving them through the array according to a rule, instead of trying every pair with two nested loops.

There are two basic shapes:

\`\`\`text
Opposite ends (towards each other)      Same direction (read / write)
 L →                    ← R              W
[1, 2, 4, 7, 11, 15]                    [0, 1, 0, 3, 12]
                                         R →
\`\`\`

- **Opposite ends:** one pointer starts at each end and they walk towards each other until they meet.
- **Same direction:** both start on the left; a fast pointer *reads* every element, a slow pointer marks where the next *kept* element should be *written*.

Variations of these two shapes give us merging sorted arrays, 3Sum, the Dutch National Flag (three pointers), partitioning and the famous Trapping Rain Water.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Pointer** — here just an integer index into an array or string (not a memory pointer).
- **Invariant** — a statement that is true before and after every step of a loop (e.g. "everything left of \`write\` is already the answer"). Two-pointer proofs are invariant proofs.
- **Search space** — the set of candidates still possible (e.g. all pairs \`(i, j)\` with \`left ≤ i < j ≤ right\`). Every pointer move must shrink it *safely*.
- **In place** — using O(1) extra memory by rearranging the input array itself.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'Two people look for a pair of items in a shop whose prices add up to your gift card: one starts at the cheapest shelf, one at the most expensive. If the total is too high, the person at the expensive end steps down; too low, the person at the cheap end steps up. They never need to go back, because each step rules out an item for good.',
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-1',
            question: 'Which situation is the **same-direction (read/write)** shape rather than opposite ends?',
            options: [
              'Checking whether "racecar" is a palindrome',
              'Finding two numbers in a sorted array that add up to 9',
              'Finding the widest container between two vertical lines',
              'Removing every 0 from an array in place while keeping the order of the other numbers',
            ],
            answer: 3,
            explanation: 'Compaction needs a `read` pointer that visits every element and a `write` pointer that trails behind it, marking where the next kept element goes. Both move left → right.',
            misconceptions: {
              0: 'A palindrome compares the first character with the last, the second with the second-to-last… — that is opposite ends.',
              1: 'Sorted pair sum is the textbook opposite-ends problem: the smallest and the largest value tell you which end to drop.',
              2: 'The container problem starts with the widest pair (both ends) and moves the shorter wall inward — opposite ends.',
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
            md: `Many array questions are about **pairs**: "is there a pair with sum X?", "which two walls hold the most water?". An array of \`n\` elements has about \`n²/2\` pairs, so the obvious nested loop is **O(n²)**. For \`n = 100,000\` that is 5 billion checks.

Two pointers use extra structure — **sortedness**, **symmetry**, or a **min/max bottleneck** — to prove that after one comparison a whole group of pairs can be thrown away. Each step moves one pointer, pointers never go back, so the loop runs at most \`n\` times: **O(n)**, and usually with **O(1)** extra memory (a hash map solution would use O(n)).`,
          },
          {
            type: 'compare',
            left: {
              title: 'Every pair — O(n²)',
              code: `for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    if (a[i] + a[j] === target) return [i, j];`,
            },
            right: {
              title: 'Sorted + two pointers — O(n)',
              code: `let l = 0, r = n - 1;
while (l < r) {
  const s = a[l] + a[r];
  if (s === target) return [l, r];
  s < target ? l++ : r--;
}`,
            },
          },
          {
            type: 'reflect',
            prompt: 'Do you understand **how many pairs** a single `l++` throws away in the sorted pair-sum loop?',
            deeper: `Picture the pairs as a grid with \`i\` on one axis and \`j\` on the other. When \`a[l] + a[r] < target\`, then \`a[l] + a[j] ≤ a[l] + a[r] < target\` for **every** \`j ≤ r\` (the array is sorted). So the whole row \`l\` — up to \`r − l\` pairs — is useless, and \`l++\` deletes it in one step. Likewise \`r--\` deletes a whole column. n steps delete all n² / 2 pairs. That is the entire reason two pointers work: **each move discards a provably useless row or column.**`,
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `| Situation | Shape | Example |
|---|---|---|
| Sorted array, find a pair / triplet with a sum | opposite ends (+ outer loop) | Two Sum II, 3Sum, 4Sum |
| Symmetry | opposite ends | Valid Palindrome |
| Greedy pairing after sorting | opposite ends | Boats to Save People |
| Remove / keep elements in place, keep order | read / write | Remove Duplicates, Move Zeroes |
| Two sorted inputs → one sorted output | one pointer per input | Merge Sorted Array, Squares of a Sorted Array |
| Three groups in one pass | three pointers | Sort Colors |
| Answer limited by min of two sides | move the smaller side | Container With Most Water, Trapping Rain Water |

**Do not** reach for two pointers when the array is unsorted and you need original indices (Two Sum → hash map), or when the answer is a contiguous range defined by a condition — that is a **sliding window** (the next topic), which is really a same-direction two-pointer technique specialised for ranges.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'Fast & slow pointers',
            md: 'There is one more famous two-pointer shape — a pointer moving at twice the speed of another, used for cycle detection and finding the middle. It mostly appears with linked lists, so you will learn it in the **Linked List** topic.',
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-2',
            question: '`nums = [3, 2, 4]` (unsorted), `target = 6`. Return the **original indices** of the two numbers. Why is "sort + two pointers" a poor fit?',
            options: [
              'Two pointers cannot find sums',
              'The array has only three elements',
              'Sorting changes positions, so you would lose the original indices (or need extra bookkeeping), while a hash map solves it in O(n) directly',
              'Two pointers only work on strings',
            ],
            answer: 2,
            explanation: 'Sorting costs O(n log n) and scrambles indices; you would have to sort `[value, index]` pairs. A hash map (Hashing topic) gives O(n) with the indices intact. Two pointers shine when the input is **already sorted** or indices do not matter.',
            misconceptions: {
              0: 'Pair sums are exactly what opposite-end pointers are good at — *on sorted data*.',
              1: 'Size is irrelevant; the issue is losing the original positions.',
              3: 'Two pointers work on any indexable sequence: arrays and strings alike.',
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
            clues: ['sorted array', 'pair / triplet with a target sum', 'palindrome / reverse', 'in place, O(1) extra space', 'return the new length k', 'merge two sorted', '0s, 1s and 2s', 'height / container / trap water'],
            conclusion: 'Think Two Pointers',
          },
          {
            type: 'text',
            md: `Ask yourself three questions:

1. **Is there order I can exploit?** Sorted input, or I am allowed to sort (indices do not matter).
2. **Can one comparison rule out one end?** If \`a[l] + a[r]\` is too small, is \`a[l]\` useless for every remaining partner?
3. **Must I work in place?** Then a read/write or swap-based pointer scheme is likely intended.`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-3',
            question: '"Given an array sorted in non-decreasing order (it may contain negatives), return an array of the squares of each number, also sorted." Where is the **largest** square?',
            options: [
              'Always at the last index',
              'At one of the two ends — the most negative or the most positive number',
              'In the middle, near zero',
              'You cannot know without sorting the squares',
            ],
            answer: 1,
            explanation: 'Squaring makes large negatives large positives. The biggest absolute value is at the far left or the far right, so compare the two ends, write the bigger square at the back of the output and move that pointer inward.',
            misconceptions: {
              0: '`[-7, 1, 2]` → the largest square (49) comes from index 0.',
              2: 'Values near zero give the *smallest* squares, not the largest.',
              3: 'That works (O(n log n)), but the two ends already give the next largest square in O(1) each → O(n).',
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
            md: `Every two-pointer algorithm has the same heartbeat:

1. The pointers describe what is **still possible** (the search space) or what is **already finished**.
2. Each step, look at the elements under the pointers.
3. Use a **proof** — sortedness, symmetry, a bottleneck — to show one pointer's element can never be part of a better answer.
4. Move that pointer. **Never move backwards.**

Because each pointer only moves in one direction and has at most \`n\` places to go, the total work is O(n).`,
          },
          {
            type: 'visual',
            scenario: 'two-pointers-pair-sum',
            input: { nums: [1, 2, 4, 7, 11, 15], target: 15 },
            caption: 'Sorted pair sum: too small → move left up; too big → move right down.',
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-4',
            question: 'Sorted `nums = [1, 2, 4, 7, 11, 15]`, `target = 15`. With `l = 0` (1) and `r = 5` (15) the sum is 16 — too big. Why is it safe to do `r--`?',
            options: [
              'Because 15 is the largest number and big numbers are never used',
              'Because 15 + (any remaining left value) ≥ 1 + 15 = 16 > 15, so 15 cannot be in any valid pair',
              'Because we always alternate moving l and r',
              'It is not safe; we might skip the answer',
            ],
            answer: 1,
            explanation: 'Every remaining partner of 15 is ≥ nums[l] = 1 (sorted), so every pair containing 15 sums to at least 16. The whole column of pairs with 15 is dead — discard it.',
            misconceptions: {
              0: 'Large numbers are used all the time — 15 would be fine with target 16. It is useless *here* because even its smallest partner overshoots.',
              2: 'The rule is driven by the comparison, not by alternation. Sometimes one pointer moves many times in a row.',
              3: 'It is provably safe: we only discard pairs whose sum is guaranteed wrong.',
            },
            deeper: 'Mirror argument for `l++`: if the sum is too small, nums[l] + (any remaining right value) ≤ nums[l] + nums[r] < target, so nums[l] is useless. Both moves throw away only pairs that cannot work.',
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'Concrete problem: **Two Sum II** — sorted `numbers`, find the 1-based indices of two numbers adding up to `target`. The simplest correct idea tries every pair.',
          },
          {
            type: 'code',
            title: 'Brute force — O(n²) time, O(1) space',
            code: `function twoSum(numbers, target) {
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] + numbers[j] === target) return [i + 1, j + 1];
    }
  }
  return [];
}`,
          },
          {
            type: 'text',
            md: 'This never uses the one thing the problem gives us for free: the array is **sorted**. Sortedness means a single comparison of `numbers[l] + numbers[r]` with `target` tells us which end can never be part of the answer — that is the next section.',
          },
        ],
      },
      {
        id: 'optimized-opposite',
        title: 'Optimized approach — opposite ends',
        blocks: [
          {
            type: 'steps',
            title: 'Sorted pair sum',
            steps: [
              '`left = 0`, `right = n − 1`.',
              'While `left < right`: compute `sum = a[left] + a[right]`.',
              'Equal → found. Less → `left++` (need a bigger value). Greater → `right--` (need a smaller value).',
              'If the pointers meet, no pair exists.',
            ],
          },
          {
            type: 'code',
            title: 'Palindrome check — same shape, different rule',
            code: `function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false; // mismatched mirror pair
    l++; r--;                        // both ends are verified → discard both
  }
  return true;
}`,
            caption: 'Here both pointers move together, because once s[l] === s[r] both characters are fully checked.',
          },
          {
            type: 'text',
            md: `**Greedy pairing (Boats to Save People):** sort weights; try to put the heaviest person with the lightest. If they fit, both leave; if not, the heaviest person cannot share with *anyone* (the lightest was their best chance), so they go alone. Same opposite-ends skeleton, but the proof is an **exchange argument**: pairing the heaviest with the lightest is never worse than any other pairing.`,
          },
        ],
      },
      {
        id: 'optimized-read-write',
        title: 'Optimized approach — read / write pointers',
        blocks: [
          {
            type: 'text',
            md: `Goal: remove unwanted elements **in place**, keep the order of the rest, return how many remain.

Invariant: **\`nums[0 .. write − 1]\` is exactly the answer for \`nums[0 .. read − 1]\`.**

- \`read\` visits every element once.
- If the element should be kept, copy it to \`nums[write]\` and \`write++\`.
- At the end, \`write\` is the new length.`,
          },
          {
            type: 'code',
            title: 'Remove duplicates from a sorted array',
            code: `function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let write = 1;                           // nums[0] is always kept
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {  // differs from the last KEPT value
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-5',
            question: 'Why is copying kept elements forward better than calling `nums.splice(i, 1)` for each unwanted element?',
            options: [
              '`splice` does not exist on arrays',
              'Copying uses more memory but is easier to read',
              'They are the same speed',
              'Each `splice` shifts every later element one step left (O(n)), so many deletions cost O(n²); read/write moves each element at most once — O(n)',
            ],
            answer: 3,
            explanation: 'Arrays are contiguous memory. Removing from the middle shifts the tail. With k deletions that is O(k·n). The read/write pass does one copy per kept element.',
            misconceptions: {
              0: '`splice` exists and works — it is just slow when used repeatedly.',
              1: 'Read/write uses O(1) extra memory, not more.',
              2: 'On `[0,0,0,…]` with 10^5 zeros, repeated `splice` does ~5·10^9 element moves.',
            },
            deeper: '`splice` also shifts indices under your loop: after deleting index i, the next element is now at i, so a `for` loop with `i++` skips it. Two classic bugs in one call.',
          },
          {
            type: 'text',
            md: '**Move Zeroes** uses the same pointers but **swaps** `nums[read]` and `nums[write]` instead of copying, so the zeros drift to the back and no second "fill with zeros" pass is needed.',
          },
        ],
      },
      {
        id: 'optimized-merge',
        title: 'Optimized approach — merging sorted arrays',
        blocks: [
          {
            type: 'text',
            md: `Two sorted inputs \`a\` and \`b\`: the smallest remaining element overall is always \`min(a[i], b[j])\`. Take it, advance that pointer, repeat.

**Merging in place** (\`nums1\` has room for \`nums2\` at the end): fill from the **back**. Write the larger of \`nums1[i]\` and \`nums2[j]\` at position \`k = m + n − 1\` and move left. Why the back? The free slots are at the back, and the write position \`k\` is always ≥ \`i\` — it can never overwrite an element of nums1 that we have not read yet.`,
          },
          {
            type: 'code',
            title: 'Merge nums2 into nums1 (in place, from the back)',
            code: `function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j >= 0) {                        // once nums2 is used up, nums1's rest is already in place
    if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
    else nums1[k--] = nums2[j--];
  }
}`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-6',
            question: 'Why do we merge from the **back** of `nums1` rather than the front?',
            options: [
              'Merging from the front would put elements in descending order',
              'It is only a style choice',
              'Writing at the front would overwrite nums1 values that have not been read yet; the back is free space, and k ≥ i always holds',
              'Because nums2 is longer',
            ],
            answer: 2,
            explanation: 'At every step k = i + j + 1 ≥ i, so the write position is never to the left of the next unread nums1 element. From the front there is no free space — you would need a copy of nums1.',
            misconceptions: {
              0: 'Front-to-back with "take the smaller" gives ascending order — the problem is overwriting, not order.',
              1: 'Front-first in place is simply incorrect without an extra array.',
              3: 'Lengths are irrelevant; the free space location is what matters.',
            },
          },
        ],
      },
      {
        id: 'optimized-ksum',
        title: 'Optimized approach — sort + two pointers (3Sum, 4Sum)',
        blocks: [
          {
            type: 'text',
            md: `**3Sum:** find all unique triplets with sum 0.

1. **Sort** (numeric comparator!).
2. For each \`i\`, the remaining problem is "find pairs in \`nums[i+1 ..]\` with sum \`−nums[i]\`" — a sorted pair sum → opposite ends, O(n).
3. Total O(n²), better than O(n³).

**De-duplication** is where most bugs live. Because the array is sorted, equal values are neighbours:
- Skip \`i\` if \`nums[i] === nums[i − 1]\` — the same first value would find the same triplets again.
- After recording a triplet, move \`l\` past all copies of \`nums[l]\` (the matching \`r\` copies are then skipped automatically, since the sum no longer matches).

**4Sum** adds one more outer loop with its own duplicate skip → O(n³). In general kSum is O(n^(k−1)).`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-7',
            question: 'Sorted `nums = [-1, -1, 0, 1, 2]`. Which duplicate check for the outer index `i` is correct?',
            options: [
              '`if (nums[i] === nums[i + 1]) continue;`',
              'No check is needed',
              'Use a Set of stringified triplets and skip nothing',
              '`if (i > 0 && nums[i] === nums[i - 1]) continue;`',
            ],
            answer: 3,
            explanation: 'Comparing with the **previous** value means the first copy of −1 is processed (finding [-1,-1,2] and [-1,0,1]) and only later copies are skipped.',
            misconceptions: {
              0: 'Comparing with the *next* value skips the first −1, so the triplet [-1, -1, 2] (which uses both −1s) is never found.',
              1: 'Without a check, the second −1 finds [-1, 0, 1] again → duplicate output.',
              2: 'A Set of strings works but costs extra time and memory, and hides the key insight: sorted duplicates are adjacent, so skipping is O(1).',
            },
          },
        ],
      },
      {
        id: 'optimized-dutch-flag',
        title: 'Optimized approach — Dutch National Flag (three pointers)',
        blocks: [
          {
            type: 'text',
            md: `Sort an array of 0s, 1s and 2s in **one pass** and O(1) space. Keep four regions:

\`\`\`text
[ 0 0 0 | 1 1 | ? ? ? ? | 2 2 ]
          ^low  ^mid     ^high
\`\`\`

- \`[0, low)\` are 0s, \`[low, mid)\` are 1s, \`[mid, high]\` are unknown, \`(high, end]\` are 2s.
- Look at \`nums[mid]\`:
  - **0** → swap with \`nums[low]\` (which is a 1, or mid itself), \`low++\`, \`mid++\`.
  - **1** → already in the right region, \`mid++\`.
  - **2** → swap with \`nums[high]\`, \`high--\`, but **do not** move \`mid\`: the value that arrived from \`high\` is still unknown.
- Stop when \`mid > high\` (no unknowns left).`,
          },
          {
            type: 'visual',
            scenario: 'dutch-flag',
            input: { nums: [2, 0, 2, 1, 1, 0] },
            caption: 'Watch the unknown region [mid, high] shrink by one element every step.',
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-8',
            question: 'When `nums[mid] === 0` we swap it with `nums[low]` and advance **both** `low` and `mid`. Why is it safe to advance `mid` here but not after swapping with `high`?',
            options: [
              'It is not safe; both cases should keep mid in place',
              'Because nums[low] is always a 1 (or mid itself) — an already-classified value — while the value coming from high has never been examined',
              'Because 0 is smaller than 2',
              'Because low is always equal to mid',
            ],
            answer: 1,
            explanation: 'Everything in [low, mid) is a known 1. Swapping brings that 1 to mid, which belongs in the 1s region — nothing new to inspect. The value from `high` comes from the unknown region, so it must be classified in the next iteration.',
            misconceptions: {
              0: 'Keeping mid still after a 0-swap is harmless but wasted work; after a 2-swap it is *required* for correctness.',
              2: 'The numeric values are irrelevant; what matters is whether the swapped-in value was already classified.',
              3: 'low and mid diverge as soon as the first 1 is seen.',
            },
          },
        ],
      },
      {
        id: 'optimized-partition',
        title: 'Optimized approach — partitioning (Lomuto & Hoare)',
        blocks: [
          {
            type: 'text',
            md: `**Partitioning** rearranges an array so all elements with some property come first. It is the heart of quicksort (Sorting topic) and quickselect.

**Lomuto** — one boundary pointer, one scanner. Invariant: \`[0, boundary)\` all satisfy the predicate. When the scanner finds a match, swap it to \`boundary\` and grow the region.

**Hoare** — opposite ends. \`l\` skips elements already on the correct (left) side, \`r\` skips elements already on the right side; now \`nums[l]\` belongs right and \`nums[r]\` belongs left — one swap fixes **both**. That is why Hoare does roughly three times fewer swaps than Lomuto on random data.

Neither scheme is **stable** (equal-category elements may change relative order). If order matters, use read/write compaction instead.`,
          },
          {
            type: 'code',
            title: 'Hoare-style: evens before odds',
            code: `function sortArrayByParity(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    if (nums[l] % 2 === 0) l++;          // already on the correct side
    else if (nums[r] % 2 === 1) r--;     // already on the correct side
    else {                               // both misplaced → one swap fixes two
      [nums[l], nums[r]] = [nums[r], nums[l]];
      l++; r--;
    }
  }
  return nums;
}`,
          },
          {
            type: 'reflect',
            prompt: 'Do you see how the **Dutch National Flag** is just partitioning with a third region?',
            deeper: 'Lomuto keeps two regions: "yes" and "unknown". Dutch flag keeps three finished regions (< pivot, = pivot, > pivot) plus the unknown one, using `low` as the Lomuto boundary on the left and `high` as a Hoare-style boundary on the right. Quicksort that partitions this way ("3-way quicksort") stays O(n log n) even when the array is full of duplicates, where the 2-way version can degrade to O(n²).',
          },
        ],
      },
      {
        id: 'optimized-bottleneck',
        title: 'Optimized approach — move the smaller side (Container & Trapping Rain Water)',
        blocks: [
          {
            type: 'text',
            md: `**Container With Most Water:** area of lines \`l\` and \`r\` is \`min(h[l], h[r]) × (r − l)\`. Start with the widest pair. Suppose \`h[l] < h[r]\`. Any other container using line \`l\` has a right end \`r' < r\`, so it is **narrower**, and its height is still at most \`h[l]\`. Its area can only be smaller. So line \`l\` is finished → \`l++\`. Moving the *taller* line instead can never help: the width shrinks and the height is still capped by the shorter line.

**Trapping Rain Water:** the water above bar \`i\` is

\`\`\`text
water[i] = min(maxLeft[i], maxRight[i]) − h[i]
\`\`\`

where \`maxLeft[i]\` is the tallest bar in \`h[0..i]\` and \`maxRight[i]\` the tallest in \`h[i..n−1]\`. The brute force computes both for each i (O(n²)); precomputing two arrays gives O(n) time, O(n) space. Two pointers get O(1) space.`,
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Proof: why the smaller side is safe to finalise',
            md: `Keep \`leftMax = max(h[0..l])\` and \`rightMax = max(h[r..n−1]\`.

Suppose \`leftMax < rightMax\`. Look at bar \`l\`:
- Its true \`maxLeft[l]\` is exactly \`leftMax\` (we have seen everything to its left).
- Its true \`maxRight[l]\` is the max over \`h[l..n−1]\`, which **includes** \`h[r..n−1]\`, so \`maxRight[l] ≥ rightMax > leftMax\`.

So \`min(maxLeft[l], maxRight[l]) = leftMax\` — **known exactly**, even though we have not looked at the bars between \`l\` and \`r\`. We can add \`leftMax − h[l]\` and move \`l\` forward. The symmetric argument handles \`rightMax ≤ leftMax\` on the right. Unseen bars in the middle can only make the *taller* side's max bigger, which never changes the min.`,
          },
          {
            type: 'code',
            title: 'Trapping Rain Water — O(n) time, O(1) space',
            code: `function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (l < r) {
    leftMax = Math.max(leftMax, height[l]);
    rightMax = Math.max(rightMax, height[r]);
    if (leftMax < rightMax) {
      water += leftMax - height[l];   // level at l is exactly leftMax
      l++;
    } else {
      water += rightMax - height[r];  // level at r is exactly rightMax
      r--;
    }
  }
  return water;
}`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-9',
            question: 'In Trapping Rain Water, `leftMax = 2` and `rightMax = 5`. We have not looked at the bars between `l` and `r` yet. Why can we already settle the water above bar `l`?',
            options: [
              'Because the water above l is at most 2 − h[l], and the unseen middle bars could raise it later',
              'Because the level at l is min(maxLeft, maxRight); maxLeft is exactly 2 and maxRight is at least 5, so the level is exactly 2 whatever the middle bars are',
              'Because we always process the left side first',
              'We cannot; we need the full maxRight array',
            ],
            answer: 1,
            explanation: 'Unseen bars can only increase maxRight[l], which is already bigger than 2. The min stays 2. The smaller side is the bottleneck, and the bottleneck is fully known.',
            misconceptions: {
              0: 'The middle bars could only raise the right side — which is already not the limiting side. The level is exact, not an upper bound.',
              2: 'The side is chosen by comparing the running maxima, not a fixed order.',
              3: 'That is the O(n)-space solution. The proof shows we only need the smaller of the two running maxima.',
            },
            deeper: 'Draw it: a wall of height 2 on the left and somewhere to the right a wall of height ≥ 5. However the landscape in between looks, water at l spills over the left wall at height 2 first.',
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'Opposite ends',
            code: `let l = 0, r = arr.length - 1;
while (l < r) {
  if (/* found */ false) { /* record */ }
  if (/* left end is proven useless */ true) l++;
  else r--;
}`,
          },
          {
            type: 'code',
            title: 'Read / write',
            code: `let write = 0;
for (let read = 0; read < arr.length; read++) {
  if (/* keep arr[read] */ true) arr[write++] = arr[read];
}
// arr[0 .. write-1] is the result`,
          },
          {
            type: 'code',
            title: 'Merge from the back',
            code: `let i = m - 1, j = n - 1, k = m + n - 1;
while (j >= 0) {
  a[k--] = (i >= 0 && a[i] > b[j]) ? a[i--] : b[j--];
}`,
          },
          {
            type: 'code',
            title: 'Three pointers (Dutch flag)',
            code: `let low = 0, mid = 0, high = a.length - 1;
while (mid <= high) {
  if (a[mid] < pivot) swap(a, low++, mid++);
  else if (a[mid] > pivot) swap(a, mid, high--);
  else mid++;
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: '3Sum — O(n²)',
            code: `function threeSum(nums) {
  nums.sort((a, b) => a - b);            // numeric! default sort compares strings
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break;              // smallest value positive → no more zero sums
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        result.push([nums[i], nums[l], nums[r]]);
        l++; r--;
        while (l < r && nums[l] === nums[l - 1]) l++;
        while (l < r && nums[r] === nums[r + 1]) r--;
      }
    }
  }
  return result;
}`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'JavaScript notes',
            md: `- \`[1, 10, 2].sort()\` gives \`[1, 10, 2]\` — **always** pass \`(a, b) => a - b\` for numbers.
- \`sort\` mutates the array. If the caller's array must not change, sort a copy: \`[...nums].sort((a, b) => a - b)\`.
- Destructuring swap \`[a[i], a[j]] = [a[j], a[i]]\` is clear and fine in interviews; in very hot loops a temp variable is slightly faster.
- Checking "is alphanumeric": \`/[a-z0-9]/i.test(ch)\` is readable; \`charCodeAt\` range checks are faster.
- In-place problems usually "return nothing" — do not return a new array, mutate the input.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'Container With Most Water, height = [1,8,6,2,5,4,8,3,7]',
            columns: ['l', 'r', 'h[l]', 'h[r]', 'area', 'best', 'move'],
            rows: [
              ['0', '8', '1', '7', '1 × 8 = 8', '8', 'h[l] smaller → l++'],
              ['1', '8', '8', '7', '7 × 7 = 49', '49', 'h[r] smaller → r--'],
              ['1', '7', '8', '3', '3 × 6 = 18', '49', 'r--'],
              ['1', '6', '8', '8', '8 × 5 = 40', '49', 'equal → either; r--'],
              ['1', '5', '8', '4', '4 × 4 = 16', '49', 'r--'],
              ['1', '4', '8', '5', '5 × 3 = 15', '49', 'r--'],
              ['1', '3', '8', '2', '2 × 2 = 4', '49', 'r--'],
              ['1', '2', '8', '6', '6 × 1 = 6', '49', 'r-- → stop'],
            ],
            note: '8 steps for 9 lines instead of 36 pairs. When heights are equal, moving either is safe: both lines are capped by that height at every narrower width.',
          },
          {
            type: 'reflect',
            prompt: 'In the table, when `h[l] = h[r] = 8` we moved `r`. Do you understand why moving **either** pointer is correct when the heights are equal?',
            deeper: 'Any future container that keeps line r (with a left end l\' > l) is narrower than the current one and its height is at most h[r] = 8 — so its area is ≤ the current 40. The same holds for keeping line l. Both lines are "finished"; discarding either one loses nothing.',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Default \`sort()\`** — lexicographic, so \`[10, 9, 1]\` sorts to \`[1, 10, 9]\`.
2. **\`l <= r\` vs \`l < r\`** — pairs need two distinct indices (\`<\`); Dutch flag needs \`mid <= high\` to classify the last unknown.
3. **Duplicate skipping in 3Sum** — compare with the *previous* element, and skip only after using the first copy.
4. **Advancing \`mid\` after swapping with \`high\`** in the Dutch flag.
5. **Merging from the front in place** — overwrites unread data.
6. **Moving the taller wall** in the container / trapping problems.
7. **\`splice\` in a loop** — O(n²) and index-shifting bugs; use read/write.
8. **Forgetting to move pointers after a match** → infinite loop.`,
          },
          {
            type: 'checkpoint',
            id: 'two-pointers-cp-10',
            question: 'A Dutch-flag implementation uses `while (mid < high)`. On `[2, 0, 1]` what goes wrong?',
            options: [
              'The last unknown element (when mid === high) is never classified, so a 0 can be left in the middle',
              'Nothing — it produces [0, 1, 2]',
              'It throws an error',
              'It sorts in descending order',
            ],
            answer: 0,
            explanation: 'Trace: mid=0 sees 2 → swap with high=2 → [1,0,2], high=1. Now mid=0 < high=1: sees 1 → mid=1. Loop stops because mid === high, but index 1 holds an unclassified 0 → result [1,0,2]. The unknown region [mid, high] is non-empty while mid <= high.',
            misconceptions: {
              1: 'Run it by hand: the loop exits with [1, 0, 2].',
              2: 'No error — just a wrong answer, which is worse.',
              3: 'The logic is ascending; it simply stops one element too early.',
            },
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n) per pass (O(n log n) if you sort first; O(n²) for 3Sum, O(n³) for 4Sum)',
            space: 'O(1) extra (sorting may use O(log n)–O(n) internally)',
            md: `**Why O(n):** each pointer moves in one direction only and has at most n positions, so the loop runs at most 2n times — the same amortized argument you will use for sliding windows.

**Sorting cost:** if the input is not sorted and you sort it, O(n log n) dominates a single two-pointer pass. For 3Sum it does not matter (O(n²) > O(n log n)).

**Space:** V8's \`Array.prototype.sort\` (TimSort) uses up to O(n) auxiliary memory, so "O(1) space" really means "O(1) besides the sort".`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Start with brute force** ("all pairs, O(n²)") and then say *which pairs one comparison rules out*. That sentence is the whole optimisation.
- **State the invariant**: "Everything left of \`write\` is final", "[low, mid) are all 1s", "no valid pair uses an index outside [l, r]".
- **Ask**: is the input sorted? may I modify it? are there duplicates? do I need indices or values?
- **For 3Sum** mention the duplicate handling *before* coding; it is what interviewers probe.
- **For Trapping Rain Water** give the formula \`min(maxLeft, maxRight) − h\`, then the O(n)-space version, then the two-pointer proof.
- **Edge cases**: empty array, one element, all equal values, all negative, already sorted / reverse sorted.`,
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
              { api: 'arr.sort((a, b) => a - b)', use: 'Numeric ascending sort before pair/triplet search', complexity: 'O(n log n)' },
              { api: '[...arr].sort(...)', use: 'Sort a copy when the input must not change', complexity: 'O(n log n) time, O(n) space' },
              { api: '[a[i], a[j]] = [a[j], a[i]]', use: 'In-place swap', complexity: 'O(1)' },
              { api: 's.charCodeAt(i)', use: 'Character class checks without regex', complexity: 'O(1)' },
              { api: 'ch.toLowerCase()', use: 'Case-insensitive palindrome checks', complexity: 'O(1)' },
              { api: 'new Array(n)', use: 'Pre-size an output array to fill from the back (squares)', complexity: 'O(n)' },
              { api: 'Math.min / Math.max', use: 'Heights, bottlenecks, best so far', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Sorted array + pair/triplet sum', 'Palindrome / symmetric checks', 'In-place removal keeping order', 'Merge two sorted arrays', 'Three-way grouping in one pass', 'Min-of-two-sides problems (container, trapping water)'],
    clues: ['sorted', 'pair / triplet', 'in place', 'O(1) extra space', 'return new length', 'merge', '0s 1s 2s', 'palindrome', 'height / water'],
    template: `let l = 0, r = n - 1;
while (l < r) {
  const s = a[l] + a[r];
  if (s === target) return [l, r];
  s < target ? l++ : r--;
}`,
    complexity: 'O(n) per pass; O(n log n) with sorting; 3Sum O(n²); O(1) extra space',
    mistakes: ['default sort() is lexicographic', 'l <= r vs l < r', 'wrong duplicate skipping in 3Sum', 'mid++ after swapping with high', 'merging in place from the front', 'moving the taller wall'],
    jsTools: ['sort((a,b)=>a-b)', 'destructuring swap', 'charCodeAt', 'Math.min/max'],
  },

  keyConcepts: [
    'Two pointers replace nested loops by proving that each move discards only useless candidates.',
    'Opposite ends need sortedness or symmetry; each step removes a whole row/column of pairs.',
    'Read/write pointers compact arrays in place in O(n) while preserving order.',
    'Merge sorted arrays in place from the back so writes never overwrite unread data.',
    '3Sum/4Sum = sort + outer loops + pair sum; skip adjacent duplicates for unique answers.',
    'Dutch National Flag keeps four regions; after swapping with high, the new mid value is still unknown.',
    'Container / Trapping Rain Water: the smaller side is the bottleneck, so it is safe to finalise and move.',
  ],

  interviewTips: [
    'Say which pairs a single comparison rules out — that is the optimisation argument.',
    'State the loop invariant for read/write and Dutch-flag solutions.',
    'Clarify: sorted? duplicates? indices or values? in place?',
  ],
};
