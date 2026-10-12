export default {
  id: 'sort-array-by-parity',
  title: 'Sort Array By Parity',
  difficulty: 'Easy',
  order: 1,
  pattern: 'sorting-quick-sort',
  tags: ['array', 'two pointers', 'partition'],
  source: { platform: 'LeetCode', number: 905, url: 'https://leetcode.com/problems/sort-array-by-parity/' },

  statement: `You are given an integer array \`nums\`. Rearrange it so that **every even number comes before every odd number**, and return the result.

Any arrangement that satisfies this is accepted — the evens among themselves (and the odds among themselves) may be in any order.`,
  examples: [
    { input: 'nums = [3,1,2,4]', output: '[2,4,3,1]', explanation: '[4,2,3,1], [2,4,1,3] and [4,2,1,3] are also accepted.' },
    { input: 'nums = [0]', output: '[0]' },
  ],
  constraints: ['1 <= nums.length <= 5000', '0 <= nums[i] <= 5000'],

  think: `- Do you really need a full sort, or only a split into two groups?
- Quick sort's **partition** step puts "small" items left and "big" items right in one pass. What if "small" meant "even"?
- Can you do it in place with O(1) extra memory?`,
  patternChallenge: {
    options: ['Custom comparator sort by parity', 'Counting sort', 'Partition (quick sort\'s core step) with two pointers', 'Merge sort'],
    answer: 2,
    explanation: 'Only two classes exist (even / odd) and their internal order does not matter — that is exactly a partition around a predicate, O(n) in place. A comparator sort works but costs O(n log n); counting sort and merge sort do more than needed.',
  },
  hints: [
    'Keep a pointer `store` = the position where the next even number should go. Everything before `store` is even.',
    'Scan with `i`; whenever `nums[i]` is even, swap it into `nums[store]` and advance `store`. This is the Lomuto partition with the predicate "is even".',
  ],
  approach: `**Brute force:** build two arrays (evens, odds) and concatenate — O(n) time but O(n) extra space. Or sort with the comparator \`(a, b) => (a % 2) - (b % 2)\` — O(n log n).

**Optimized (partition):** this is quick sort's partition step with the predicate "even" in place of "< pivot".
- Invariant: \`nums[0..store)\` are all even; \`nums[store..i)\` are all odd.
- For each \`i\`, if \`nums[i]\` is even, swap it with \`nums[store]\` and \`store++\`.
One pass, O(1) extra space.`,

  functionName: 'sortArrayByParity',
  paramNames: ['nums'],
  starterCode: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function sortArrayByParity(nums) {
  
}
`,
  checker: `(out, args) => {
    const input = args[0];
    if (!Array.isArray(out) || out.length !== input.length) return false;
    const a = [...out].sort((x, y) => x - y);
    const b = [...input].sort((x, y) => x - y);
    if (a.some((v, i) => v !== b[i])) return false;
    let seenOdd = false;
    for (const x of out) {
      if (x % 2 === 1) seenOdd = true;
      else if (seenOdd) return false;
    }
    return true;
  }`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: any order of evens followed by any order of odds.', args: [[3,1,2,4]], expected: [2,4,3,1] },
    { scenario: 'Example 2', hint: 'A single even element.', args: [[0]], expected: [0] },
    { scenario: 'Single odd element', hint: 'A single odd element stays put.', args: [[1]], expected: [1] },
    { scenario: 'Two elements, odd first', hint: 'The smallest case needing a swap.', args: [[1,2]], expected: [2,1] },
    { scenario: 'All even', hint: 'Nothing needs to move.', args: [[2,4,6]], expected: [2,4,6] },
    { scenario: 'All odd', hint: 'Two-ends version: forgetting lo < hi in the inner moves runs off the array when there are no evens.', args: [[1,3,5]], expected: [1,3,5] },
    { scenario: 'Alternating parity', hint: 'Every other element must move.', args: [[1,2,3,4,5,6,7,8]], expected: [2,4,6,8,1,3,5,7] },
    { scenario: 'Zeros count as even', hint: '0 is even (0 % 2 === 0).', args: [[0,1,0,1,0]], expected: [0,0,0,1,1] },
    { scenario: 'Odds before evens', hint: 'All odds first — the whole array is reversed in parity.', args: [[7,9,11,2,4]], expected: [2,4,7,9,11] },
    { scenario: 'Maximum values', hint: '5000 is even and 4999 is odd — check parity with % 2, not value size.', args: [[5000,4999,1,0,2]], expected: [5000,0,2,4999,1] },
    { scenario: 'Comparator returning a boolean', hint: 'A comparator like (a, b) => a % 2 > b % 2 returns a boolean, which sort() does not handle correctly — partition instead.', args: [[3,2,5,4,7,6,9,8,11,10,13,12]], expected: [2,4,6,8,10,12,3,5,7,9,11,13] },
    { scenario: 'Maximum length (n = 5000)', hint: 'Full-size input — a single O(n) partition pass is enough.', argsGen: '() => [Array.from({ length: 5000 }, (_, i) => (i * 2003) % 5000)]', expected: Array.from({ length: 5000 }, (_, i) => (i < 2500 ? 2 * i : 2 * (i - 2500) + 1)) },
  ],

  solution: {
    code: `function sortArrayByParity(nums) {
  let store = 0;                       // nums[0..store) are even
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] % 2 === 0) {
      const t = nums[i];
      nums[i] = nums[store];
      nums[store] = t;
      store++;
    }
  }
  return nums;
}`,
    explanation: 'Exactly the Lomuto partition loop from quick sort, with "is even" as the test instead of "< pivot".',
  },
  dryRun: {
    columns: ['i', 'nums[i]', 'even?', 'action', 'nums', 'store'],
    rows: [
      ['0', '3', 'no', '—', '[3,1,2,4]', '0'],
      ['1', '1', 'no', '—', '[3,1,2,4]', '0'],
      ['2', '2', 'yes', 'swap i=2 with store=0', '[2,1,3,4]', '1'],
      ['3', '4', 'yes', 'swap i=3 with store=1', '[2,4,3,1]', '2'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass; each element is swapped at most once; no extra arrays.' },
  alternative: {
    title: 'Two pointers from both ends (Hoare style)',
    md: 'Move `lo` right while nums[lo] is even, `hi` left while nums[hi] is odd, then swap and continue. Fewer swaps, same complexity.',
    code: `function sortArrayByParity(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    if (nums[lo] % 2 === 0) lo++;
    else if (nums[hi] % 2 === 1) hi--;
    else { const t = nums[lo]; nums[lo] = nums[hi]; nums[hi] = t; lo++; hi--; }
  }
  return nums;
}`,
    complexity: 'O(n) time, O(1) space',
  },
  mistakes: [
    'Reaching for sort() — O(n log n) when a partition is O(n).',
    'Writing the comparator as `(a, b) => a % 2 > b % 2` (a boolean) — comparators must return numbers.',
    'In the two-ends version, forgetting `lo < hi` checks inside the inner moves and running off the array.',
  ],
};
