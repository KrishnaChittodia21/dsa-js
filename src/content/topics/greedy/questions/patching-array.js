export default {
  id: 'patching-array',
  title: 'Patching Array',
  difficulty: 'Hard',
  order: 4,
  pattern: 'greedy-reach-frontier',
  tags: ['array', 'greedy', 'math'],
  source: { platform: 'LeetCode', number: 330, url: 'https://leetcode.com/problems/patching-array/' },

  statement: `You are given a **sorted** array of positive integers \`nums\` and an integer \`n\`. You may add ("patch") extra positive integers to the array.

Return the **minimum number of patches** so that **every** integer in \`[1, n]\` can be written as the sum of some elements of the array (each element used at most once).`,
  examples: [
    { input: 'nums = [1,3], n = 6', output: '1', explanation: 'Add 2: sums of {1,2,3} cover 1..6.' },
    { input: 'nums = [1,5,10], n = 20', output: '2', explanation: 'Add 2 and 4.' },
    { input: 'nums = [1,2,2], n = 5', output: '0' },
  ],
  constraints: ['1 <= nums.length <= 1000', '1 <= nums[i] <= 10^4', 'nums is sorted ascending', '1 <= n <= 2^31 - 1'],

  think: `- Suppose every value in [1, miss) can already be built. You now get the number x. If x <= miss, what new range can you build?
- If the next number is bigger than miss, can ANY later number help build miss itself?
- Which patch value extends your coverage the most?`,
  patternChallenge: {
    options: ['Subset-sum Dynamic Programming', 'Backtracking', 'Binary Search', 'Greedy — Reach / Frontier Invariant'],
    answer: 3,
    explanation: 'The invariant "[1, miss) is buildable" is a frontier like the farthest reach in Jump Game. Each step either absorbs the next number or patches with miss, doubling coverage. Subset-sum DP over n up to 2³¹ is impossible.',
  },
  hints: [
    'Keep miss = the smallest value you cannot build yet (start at 1). Everything below miss is buildable.',
    'If nums[i] <= miss, then miss += nums[i]. Otherwise patch with miss itself (miss += miss, patches++). Stop when miss > n.',
  ],
  approach: `**Invariant:** every sum in \`[1, miss)\` can be built.
- Next number x ≤ miss: every s in [1, miss) plus x covers [x, miss + x); together with [1, miss) (and x ≤ miss, so no gap) coverage becomes \`[1, miss + x)\`.
- Next number x > miss (or none left): nothing available can build \`miss\` — later numbers are even bigger. We must patch with some p ≤ miss; the new coverage is [1, miss + p), maximised by **p = miss**. So patch miss, coverage doubles.

Each patch at least doubles \`miss\`, so there are at most ~31 patches for n < 2³¹. JavaScript numbers are exact up to 2⁵³, so \`miss\` never loses precision here.`,

  functionName: 'minPatches',
  paramNames: ['nums', 'n'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number} n
 * @return {number}
 */
function minPatches(nums, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Sums of [1,3] miss 2; patching 2 covers everything up to 6.', args: [[1, 3], 6], expected: 1 },
    { scenario: 'Example 2', hint: 'Patch 2 and 4 to cover [1, 20].', args: [[1, 5, 10], 20], expected: 2 },
    { scenario: 'Example 3', hint: '[1,2,2] already builds every value up to 5.', args: [[1, 2, 2], 5], expected: 0 },
    { scenario: 'n = 1 already covered', hint: 'The smallest target: [1] builds 1 with no patches.', args: [[1], 1], expected: 0 },
    { scenario: 'First element too big', hint: 'Nothing builds 1, so patch 1 — miss must start at 1, not 0.', args: [[2], 1], expected: 1 },
    { scenario: 'Must cover n itself', hint: 'With [1], coverage is [1, 2) and 2 is still missing. Looping while miss < n stops one step early — use miss <= n.', args: [[1], 2], expected: 1 },
    { scenario: 'Duplicates help', hint: 'Four 1s build 1..4 — duplicates each extend coverage.', args: [[1, 1, 1, 1], 4], expected: 0 },
    { scenario: 'Patch with miss itself', hint: 'Patching with anything smaller than miss grows coverage less; 1, 2, 4, 8 must be patched before the 10 helps.', args: [[10], 9], expected: 4 },
    { scenario: 'Big numbers beyond n', hint: 'Elements larger than n never help; only patches 2 and 4 (with 1 and 7) are needed.', args: [[1, 7, 21, 31, 34, 37, 40, 43, 49, 87, 90, 92, 93, 98, 99], 12], expected: 2 },
    { scenario: 'Gap in the middle', hint: '[1, 2] covers up to 3 but 8 leaves 4..7 uncovered — patch 4.', args: [[1, 2, 8], 15], expected: 1 },
    { scenario: 'Maximum n (2^31 − 1)', hint: 'Coverage roughly doubles per patch, so even n = 2^31 − 1 needs only ~28 patches.', args: [[1, 2, 31, 33], 2147483647], expected: 28 },
    { scenario: 'Only patches, maximum n', hint: 'With just [1], patches 2, 4, …, 2^30 are needed — 30 of them. Simulating every value up to n is hopeless.', args: [[1], 2147483647], expected: 30 },
    { scenario: 'Large input (1000 elements)', hint: 'Building the set of reachable sums is far too slow; the miss-pointer greedy is O(len + log n).', argsGen: '() => [Array.from({ length: 1000 }, (_, i) => 1 + i * 10), 2147483647]', expected: 12, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function minPatches(nums, n) {
  let miss = 1;      // invariant: every value in [1, miss) is buildable
  let patches = 0;
  let i = 0;
  while (miss <= n) {
    if (i < nums.length && nums[i] <= miss) {
      miss += nums[i];   // extend coverage to [1, miss + nums[i])
      i++;
    } else {
      miss += miss;      // patch with miss itself: coverage doubles
      patches++;
    }
  }
  return patches;
}`,
  },
  dryRun: {
    columns: ['miss', 'nums[i]', 'action', 'patches'],
    rows: [
      ['1', '1', 'absorb → miss 2', '0'],
      ['2', '5', '5 > 2 → patch 2 → miss 4', '1'],
      ['4', '5', '5 > 4 → patch 4 → miss 8', '2'],
      ['8', '5', 'absorb → miss 13', '2'],
      ['13', '10', 'absorb → miss 23 > 20', '2'],
    ],
    note: 'nums = [1,5,10], n = 20 → 2 patches.',
  },
  complexity: { time: 'O(m + log n)', space: 'O(1)', explanation: 'Each iteration either consumes a number (m total) or doubles miss (at most log₂ n times).' },
  alternative: {
    title: 'Brute force with a set of reachable sums (small n only)',
    md: 'Maintain a boolean array of buildable sums up to n; whenever the smallest unbuildable value is found, patch it. Shows why the greedy "patch the smallest gap" is right, but is O(n · (m + patches)) and only viable for tiny n.',
    code: `function minPatches(nums, n) {
  let can = new Array(n + 1).fill(false);
  can[0] = true;
  const add = (x) => { for (let s = n; s >= x; s--) if (can[s - x]) can[s] = true; };
  let patches = 0, i = 0;
  for (let v = 1; v <= n; v++) {
    while (!can[v] && i < nums.length && nums[i] <= v) add(nums[i++]);
    if (!can[v]) { add(v); patches++; }
  }
  return patches;
}`,
    complexity: 'O(n · (m + patches)) time, O(n) space',
  },
  mistakes: [
    'Starting miss at 0 instead of 1.',
    'Using `miss < n` as the loop condition — you need to cover n itself (`miss <= n`).',
    'Patching with nums[i] − 1 or some other value; patching with miss is what maximises coverage.',
  ],
};
