export default {
  id: 'find-the-duplicate-number',
  title: 'Find the Duplicate Number',
  difficulty: 'Medium',
  order: 6,
  pattern: 'linked-list-fast-slow',
  tags: ['array', 'two pointers', 'implicit linked list', 'binary search'],
  source: { platform: 'LeetCode', number: 287, url: 'https://leetcode.com/problems/find-the-duplicate-number/' },

  statement: `You are given an array \`nums\` of \`n + 1\` integers, each between \`1\` and \`n\` inclusive. Exactly one value appears more than once (possibly many times). Return that value.

You must **not modify** the array and must use only **O(1) extra space**.`,
  examples: [
    { input: 'nums = [1,3,4,2,2]', output: '2' },
    { input: 'nums = [3,1,3,4,2]', output: '3' },
    { input: 'nums = [3,3,3,3,3]', output: '3' },
  ],
  constraints: ['1 <= n <= 10^5', 'nums.length == n + 1', '1 <= nums[i] <= n', 'Exactly one value repeats'],

  think: `- Sorting or a Set would be easy — which rule forbids each?
- If you read \`nums[i]\` as "the next index to visit", what shape does the walk from index 0 make?
- Which node in that shape has two arrows pointing into it?`,
  patternChallenge: {
    options: ['Hash Set of seen values', 'Sort and scan neighbours', 'Sliding Window', 'Fast & Slow Pointers on the implicit list i → nums[i]'],
    answer: 3,
    explanation: 'A Set uses O(n) space and sorting modifies the array. Treating `nums[i]` as a next pointer creates a linked list with a cycle whose entry is the duplicate value — Floyd finds it with O(1) space.',
  },
  hints: [
    'Start at index 0 (no value equals 0, so index 0 is never inside the cycle — it is the start of the tail). Walk `x = nums[x]`.',
    'Phase 1: slow = nums[slow], fast = nums[nums[fast]] until equal. Phase 2: restart one at 0, move both one step; they meet at the duplicate.',
  ],
  approach: `**Brute force:** a \`Set\` of seen values (O(n) space) or sort a copy (O(n) space / modifies input) — both break the rules.

**Implicit linked list:** nodes are indices \`0..n\`, and \`next(i) = nums[i]\`. Every node has exactly one outgoing arrow, and values lie in [1, n], so walking from 0 must eventually repeat — a tail followed by a cycle. The duplicate value \`d\` has two indices pointing to it, so it is the node with two incoming arrows: the **cycle entry**. Floyd's two-phase algorithm finds it:

1. \`slow = nums[slow]\`, \`fast = nums[nums[fast]]\` until they meet.
2. \`slow = 0\`; move both one step at a time until equal — that value is the duplicate.`,

  functionName: 'findDuplicate',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findDuplicate(nums) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement.',
      args: [[1, 3, 4, 2, 2]], expected: 2 },
    { scenario: 'Example 2', hint: 'The duplicate is not adjacent to its copy.',
      args: [[3, 1, 3, 4, 2]], expected: 3 },
    { scenario: 'Example 3', hint: 'One value fills the whole array — the duplicate can appear more than twice.',
      args: [[3, 3, 3, 3, 3]], expected: 3 },
    { scenario: 'Smallest input (n = 1)', hint: 'Two elements, both 1 — the cycle is a self-loop at index 1.',
      args: [[1, 1]], expected: 1 },
    { scenario: 'Phase 2 starts at index 0', hint: 'Starting phase 2 from nums[0] instead of index 0 lands on the wrong node here — the distances in the proof are measured from index 0.',
      args: [[3, 2, 3, 1]], expected: 3 },
    { scenario: 'Return value, not index', hint: 'The 9s sit at indices 2, 4 and 7 — return the repeated value, not a position.',
      args: [[2, 5, 9, 6, 9, 3, 8, 9, 7, 1]], expected: 9 },
    { scenario: 'Duplicate is 1', hint: 'The smallest possible value repeats.',
      args: [[1, 3, 4, 2, 1]], expected: 1 },
    { scenario: 'Duplicate is n', hint: 'The largest possible value repeats — check your bounds if you binary-search on values.',
      args: [[4, 1, 2, 3, 4]], expected: 4 },
    { scenario: 'Duplicate repeated 3 times', hint: 'Some values are missing because one value appears three times.',
      args: [[1, 4, 4, 2, 4]], expected: 4 },
    { scenario: 'Sorted with duplicate at end', hint: '1..n in order plus a repeat of n/2 at the end.',
      argsGen: '() => [[...Array.from({ length: 1000 }, (_, i) => i + 1), 500]]', expected: 500 },
    { scenario: 'Large shuffled (n = 10^5)', hint: 'Both copies are near the end of a shuffled array — an O(n²) pair check is too slow; Floyd or a counting trick is O(n).',
      argsGen: '() => { let s = 7; const r = () => (s = (s * 48271) % 2147483647); const n = 100000; const a = Array.from({ length: n }, (_, i) => i + 1); for (let i = n - 1; i > 0; i--) { const j = r() % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } a.push(a[n - 1]); return [a]; }', expected: 37898, timeLimitMs: 1000 },
    { scenario: 'Large, value repeated half the time', hint: 'Half the array is the same value — the functional graph still has exactly one cycle entry.',
      argsGen: '() => { const n = 100000; const a = Array.from({ length: n + 1 }, (_, i) => (i % 2 === 0 ? 77777 : i)); return [a]; }', expected: 77777, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function findDuplicate(nums) {
  // phase 1: meet inside the cycle
  let slow = nums[0], fast = nums[nums[0]];
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[nums[fast]];
  }
  // phase 2: find the entry
  slow = 0;
  while (slow !== fast) {
    slow = nums[slow];
    fast = nums[fast];
  }
  return slow;
}`,
    explanation: 'Phase 1 starts both pointers one/two steps from index 0 so the `while (slow !== fast)` loop condition works immediately. Phase 2 restarts from index 0, the head of the implicit list.',
  },
  dryRun: {
    columns: ['phase', 'slow', 'fast'],
    rows: [
      ['1 start', 'nums[0]=1', 'nums[1]=3'],
      ['1', 'nums[1]=3', 'nums[nums[3]]=nums[2]=4'],
      ['1', 'nums[3]=2', 'nums[nums[4]]=nums[2]=4'],
      ['1', 'nums[2]=4', 'nums[nums[4]]=4 → meet at 4'],
      ['2', '0 → 1 → 3 → 2', '4 → 2 → 4 → 2 → meet at 2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Floyd on a path of at most n + 1 nodes; only two index variables.' },
  alternative: {
    title: 'Binary search on the value (pigeonhole)',
    md: 'For a candidate m, count how many values are ≤ m. If the count exceeds m, the duplicate is ≤ m. Binary search m over [1, n]. You will see this "binary search on the answer" idea in the Binary Search topic.',
    code: `function findDuplicate(nums) {
  let lo = 1, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    let cnt = 0;
    for (const x of nums) if (x <= mid) cnt++;
    if (cnt > mid) hi = mid; else lo = mid + 1;
  }
  return lo;
}`,
    complexity: 'O(n log n) time, O(1) space',
  },
  mistakes: [
    'Starting phase 2 from `nums[0]` instead of index 0 — the distances in the proof are measured from the head (index 0).',
    'Sorting the array (modifies input) or using a Set (O(n) space).',
    'Returning an index instead of the value.',
  ],
};
