export default {
  id: '3sum',
  title: '3Sum',
  difficulty: 'Medium',
  order: 5,
  pattern: 'sort-two-pointers-ksum',
  tags: ['array', 'two pointers', 'sorting'],
  source: { platform: 'LeetCode', number: 15, url: 'https://leetcode.com/problems/3sum/' },

  statement: `Given an integer array \`nums\`, return **all unique triplets** \`[nums[i], nums[j], nums[k]]\` with \`i\`, \`j\`, \`k\` all different and \`nums[i] + nums[j] + nums[k] === 0\`.

"Unique" means no two triplets in the output contain the same three values. The order of the triplets, and of the values inside a triplet, does not matter.`,
  examples: [
    { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
    { input: 'nums = [0,1,1]', output: '[]' },
    { input: 'nums = [0,0,0]', output: '[[0,0,0]]' },
  ],
  constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],

  think: `- If you fix the first number \`a\`, what problem is left for the other two?
- That leftover problem is fast on sorted data. What does sorting also do to duplicate values?
- Exactly where must you skip duplicates so that no triplet is lost and none is repeated?`,
  patternChallenge: {
    options: ['Hash Set of all pair sums', 'Sort + Two Pointers', 'Backtracking over triples', 'Sliding Window'],
    answer: 1,
    explanation: 'Fix one value, then find pairs summing to its negation in a sorted suffix → two pointers, O(n²) overall. Sorting also puts duplicates next to each other so they can be skipped in O(1). Hash-based versions work but de-duplication becomes messy.',
  },
  hints: [
    'Sort. For each `i`, run a two-pointer pair search on `nums[i+1..]` for target `-nums[i]`.',
    'Skip `i` when `nums[i] === nums[i-1]`. After recording a triplet, move `l` past all copies of `nums[l]` (and `r` past copies of `nums[r]`). You can stop early once `nums[i] > 0`.',
  ],
  approach: `**Brute force:** three loops, O(n³), plus a Set of sorted triplets to remove duplicates.

**Sort + two pointers (O(n²)):**
1. Sort numerically.
2. For each \`i\` (the smallest value of the triplet):
   - if \`nums[i] > 0\`, stop — three values ≥ a positive number cannot sum to 0;
   - if \`nums[i] === nums[i - 1]\`, skip (same first value ⇒ same triplets).
3. \`l = i + 1\`, \`r = n − 1\`; standard pair search. On a hit, record, then advance \`l\` and \`r\` past equal neighbours.

Every unique triplet is produced exactly once: it is found at the *first* index holding its smallest value, and within that pair search at the *first* \`l\` holding its middle value.`,

  functionName: 'threeSum',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
  
}
`,
  compare: 'nested-unordered',
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: two triplets, and the duplicate -1 must not create a repeated [-1, 0, 1].', args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
    { scenario: 'Example 2', hint: 'No triplet sums to 0 — return an empty array.', args: [[0, 1, 1]], expected: [] },
    { scenario: 'Example 3', hint: 'The smallest input: one triplet made of three zeros.', args: [[0, 0, 0]], expected: [[0, 0, 0]] },
    { scenario: 'Four zeros', hint: 'Four zeros still give only one unique triplet. Skip repeated values of i and of l/r.', args: [[0, 0, 0, 0]], expected: [[0, 0, 0]] },
    { scenario: 'Pair uses equal values', hint: '[-2, 1, 1] uses the same value twice at different indices. Skipping i when nums[i] === nums[i + 1] loses triplets like this.', args: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
    { scenario: 'Duplicate first value needed', hint: '[-1, -1, 2] needs both -1s. Skip i only when nums[i] === nums[i - 1], never by looking ahead.', args: [[-1, -1, 2, 2]], expected: [[-1, -1, 2]] },
    { scenario: 'Many duplicates everywhere', hint: 'Lots of repeated values: skip duplicates of i, l and r, or the same triplet appears several times.', args: [[-4, -2, -2, -2, 0, 1, 2, 2, 2, 3, 3, 4, 4, 6, 6]], expected: [[-4, -2, 6], [-4, 0, 4], [-4, 1, 3], [-4, 2, 2], [-2, -2, 4], [-2, 0, 2]] },
    { scenario: 'Duplicates of l after a hit', hint: 'After finding [-2, 0, 2], skip the repeated 0s and 2s — otherwise [-2, 0, 2] is added twice.', args: [[-2, 0, 0, 2, 2]], expected: [[-2, 0, 2]] },
    { scenario: 'No answer, mixed signs', hint: 'Negatives and positives but no zero-sum triple: return [].', args: [[1, 2, -2, -1]], expected: [] },
    { scenario: 'All positive', hint: 'If the smallest value is positive, no triplet can sum to 0 — you can stop early.', args: [[3, 5, 1, 8]], expected: [] },
    { scenario: 'Default sort trap', hint: 'Sorting without a comparator puts -10 before -5 and 10 before 5 as strings; the two pointers then miss triplets.', args: [[-5, 10, -10, 5, 0, -1, 1, 2]], expected: [[-10, 0, 10], [-5, 0, 5], [-1, 0, 1]] },
    { scenario: 'Extreme values', hint: 'The largest allowed magnitudes: 10^5 + (-10^5) + 0 = 0.', args: [[100000, -100000, 0, 99999, -99998]], expected: [[-100000, 0, 100000]] },
    { scenario: 'Large, no answer (n = 3000)', hint: 'Every value is odd, so no three sum to 0. Three nested loops are O(n³) ≈ 4.5·10^9 steps; sort + two pointers is O(n²).', argsGen: '() => { let s = 7; return [Array.from({ length: 3000 }, () => { s = (s * 48271) % 2147483647; return (s % 100000) * 2 - 99999; })]; }', expected: [], timeLimitMs: 1000 },
    { scenario: 'Large, all zeros (n = 3000)', hint: '3000 zeros give exactly one triplet. Without duplicate skipping you would add [0, 0, 0] millions of times.', argsGen: '() => [new Array(3000).fill(0)]', expected: [[0, 0, 0]], timeLimitMs: 1000 },
  ],

  solution: {
    code: `function threeSum(nums) {
  nums = [...nums].sort((a, b) => a - b);
  const n = nums.length, result = [];
  for (let i = 0; i < n - 2; i++) {
    if (nums[i] > 0) break;                          // smallest value positive → done
    if (i > 0 && nums[i] === nums[i - 1]) continue;  // same first value → same triplets
    let l = i + 1, r = n - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        result.push([nums[i], nums[l], nums[r]]);
        l++;
        r--;
        while (l < r && nums[l] === nums[l - 1]) l++; // skip duplicate middles
        while (l < r && nums[r] === nums[r + 1]) r--; // skip duplicate lasts
      }
    }
  }
  return result;
}`,
  },
  dryRun: {
    columns: ['i (nums[i])', 'l, r', 'sum', 'action'],
    rows: [
      ['0 (-4)', '1, 5', '-4 + -1 + 2 = -3', 'l++ … no hit for -4'],
      ['1 (-1)', '2, 5', '-1 + -1 + 2 = 0', 'record [-1,-1,2]; l=3, r=4'],
      ['1 (-1)', '3, 4', '-1 + 0 + 1 = 0', 'record [-1,0,1]; l=4, r=3 stop'],
      ['2 (-1)', '—', '—', 'same as nums[1] → skip'],
      ['3 (0)', '4, 5', '0 + 1 + 2 = 3', 'r-- → stop'],
    ],
    note: 'Sorted input: [-4, -1, -1, 0, 1, 2].',
  },
  complexity: { time: 'O(n²)', space: 'O(n)', explanation: 'O(n log n) sort + n pair searches of O(n). The copy costs O(n); the output is not counted.' },
  alternative: {
    title: 'Fix i, hash set for the pair',
    md: 'For each i, scan j > i with a Set of seen values, looking for `-nums[i] - nums[j]`. Also O(n²), but de-duplicating output requires sorting triplets and a Set of keys — clumsier than the sorted version.',
    complexity: 'O(n²) time, O(n) space',
  },
  mistakes: [
    'Skipping duplicates with `nums[i] === nums[i + 1]` — loses [-1, -1, 2].',
    'Forgetting to move `l`/`r` after a hit → infinite loop.',
    'Default `sort()` — negative numbers sort as strings ("-1" vs "-4").',
    'Only skipping duplicates of `i` and not of `l` → repeated triplets like [-2, 0, 2] twice.',
  ],
};
