// Large test: deterministic input (Park–Miller LCG) and its expected answers, computed with an
// independent method (sorted array + per-bit binary search) rather than the reference trie.
const LARGE_GEN = '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647) % 1000000001; const nums = Array.from({ length: 50000 }, r); const queries = Array.from({ length: 50000 }, (_, i) => [r(), i % 50 === 0 ? i : r()]); return [nums, queries]; }';
const largeExpected = () => {
  const [nums, queries] = new Function(`return (${LARGE_GEN});`)()();
  const s = Int32Array.from(nums).sort();
  const lb = (lo, hi, v) => {
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (s[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return queries.map(([x, m]) => {
    let lo = 0, hi = lb(0, s.length, m + 1), prefix = 0;
    if (hi === 0) return -1;
    for (let b = 29; b >= 0; b--) {
      const split = lb(lo, hi, prefix | (1 << b)); // [lo, split) has bit b = 0, [split, hi) has bit b = 1
      if ((((x >> b) & 1) === 0 && split < hi) || split === lo) { lo = split; prefix |= 1 << b; }
      else hi = split;
    }
    return prefix ^ x;
  });
};

export default {
  id: 'maximum-xor-with-an-element-from-array',
  title: 'Maximum XOR With an Element From Array',
  difficulty: 'Hard',
  order: 2,
  pattern: 'bit-trie-max-xor',
  tags: ['array', 'bit manipulation', 'trie', 'sorting'],
  source: { platform: 'LeetCode', number: 1707, url: 'https://leetcode.com/problems/maximum-xor-with-an-element-from-array/' },

  statement: `You are given an array \`nums\` of non-negative integers and a list of queries, where \`queries[i] = [x, m]\`.

For each query, return the maximum of \`x XOR nums[j]\` over all \`j\` with \`nums[j] <= m\`. If no element of \`nums\` is \`<= m\`, the answer to that query is \`-1\`.

Return the answers in the same order as the queries.`,
  examples: [
    { input: 'nums = [0,1,2,3,4], queries = [[3,1],[1,3],[5,6]]', output: '[3,3,7]', explanation: 'Query 1: elements ≤ 1 are 0 and 1; 3^0 = 3, 3^1 = 2 → 3.' },
    { input: 'nums = [5,2,4,6,6,3], queries = [[12,4],[8,1],[6,3]]', output: '[15,-1,5]' },
  ],
  constraints: ['1 <= nums.length, queries.length <= 10^5', '0 <= nums[j], x, m <= 10^9'],

  think: `- Without the "≤ m" rule, how does a binary trie find the best partner for x?
- Why is it right to decide the XOR's bits from the highest one down, greedily?
- The allowed set depends on m. If you process queries in increasing m, how does the allowed set change?`,
  patternChallenge: {
    options: ['Sort + binary search per query', 'Binary trie with offline queries sorted by m', 'Sliding window', 'Segment tree of maxima'],
    answer: 1,
    explanation: 'Max XOR needs the greedy bit walk of a binary trie. Sorting queries by m lets you insert exactly the allowed elements before each query. Binary search can find the allowed prefix, but not the best XOR inside it.',
  },
  hints: [
    'Sort nums. Sort query indices by m. Walk the queries; before each, insert all nums ≤ m into a binary trie (30 bits, MSB first).',
    'For a query, if the trie is empty answer −1; otherwise walk from bit 29 down, taking the child opposite to x\'s bit whenever it exists.',
  ],
  approach: `**Brute force:** for each query scan all nums: O(n · q) = 10^10 — too slow.

**Binary trie (no bound):** insert every number as a 30-bit string, most significant bit first. To maximise \`x ^ y\`, at each level go to the child whose bit is the **opposite** of x's bit if it exists (that makes the XOR bit 1). Greedy is optimal because bit k is worth more than all lower bits together (2^k > 2^k − 1).

**Adding the bound offline:** we're allowed to answer queries in any order as long as we store each answer at its original index. Sort nums ascending and queries by m ascending. Keep a pointer into nums; before answering a query, insert every num ≤ m. Now the trie contains exactly the allowed elements.

**JS details:** values ≤ 10^9 < 2^30, so 30 levels and \`1 << 29\` stay positive. Use flat arrays for children instead of objects (up to 3·10^6 nodes). Don't name a class \`Trie\` — the toolkit already defines one.`,

  functionName: 'maximizeXor',
  paramNames: ['nums', 'queries'],
  starterCode: `/**
 * @param {number[]} nums
 * @param {number[][]} queries
 * @return {number[]}
 */
function maximizeXor(nums, queries) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case: for each query only elements ≤ m may be used.',
      args: [[0, 1, 2, 3, 4], [[3, 1], [1, 3], [5, 6]]], expected: [3, 3, 7] },
    { scenario: 'Example 2', hint: 'Query [8, 1] has no element ≤ 1 → −1.',
      args: [[5, 2, 4, 6, 6, 3], [[12, 4], [8, 1], [6, 3]]], expected: [15, -1, 5] },
    { scenario: 'Single element', hint: 'One number: below it → −1, at or above it → x ^ 7.',
      args: [[7], [[1, 6], [1, 7], [0, 100]]], expected: [-1, 6, 7] },
    { scenario: 'Every query impossible', hint: 'All m are smaller than the smallest element, so every answer is −1.',
      args: [[10, 20, 30], [[5, 9], [1000, 0], [7, 3]]], expected: [-1, -1, -1] },
    { scenario: 'm equals an element', hint: 'The bound is inclusive: an element equal to m is allowed.',
      args: [[4, 8, 16], [[3, 8], [3, 4], [31, 16]]], expected: [11, 7, 27] },
    { scenario: 'Default sort is lexicographic', hint: 'Without a numeric comparator, [10, 9, 100, 2] sorts as 10, 100, 2, 9 and the elements ≤ 9 are never inserted.',
      args: [[10, 9, 100, 2], [[5, 9], [0, 100], [96, 10]]], expected: [12, 100, 106] },
    { scenario: 'Original query order kept', hint: 'Queries come with decreasing m; after processing them sorted, write each answer back to its original index.',
      args: [[1, 2, 4, 8, 16, 32], [[0, 40], [0, 20], [0, 10], [0, 5], [0, 0]]], expected: [32, 16, 8, 4, -1] },
    { scenario: 'Duplicates in nums', hint: 'Repeated values change nothing — but x ^ x = 0 can be the best when nothing else fits.',
      args: [[3, 3, 3], [[3, 2], [3, 3], [4, 3]]], expected: [-1, 0, 7] },
    { scenario: 'x = 0 and m = 0', hint: 'With nums = [0], the only choice is 0, so the answer is x itself.',
      args: [[0], [[0, 0], [1000000000, 0]]], expected: [0, 1000000000] },
    { scenario: 'Highest bit first', hint: 'Large values near 10^9 use bit 29. Inserting/querying bits from the least significant end gives wrong maxima.',
      args: [[536870912, 0, 534710168, 330218644, 142254206], [[558240772, 1000000000], [307628050, 1000000000], [3319300, 1000000000], [2751604, 683297522], [214004, 404207941]]], expected: [1050219420, 844498962, 540190212, 539622516, 330170208] },
    { scenario: 'Values at the 10^9 limit', hint: 'x ^ y can exceed 10^9 (here up to ~2^30); it still fits in a 32-bit int, so plain ^ is safe.',
      args: [[1000000000, 999999999, 1], [[0, 1000000000], [1000000000, 1], [123456789, 999999999], [5, 0]]], expected: [1000000000, 1000000001, 1019282666, -1] },
    { scenario: 'Large input (n = q = 5·10^4)', hint: 'Scanning every element for every query is 2.5·10^9 steps. Sort both, insert elements ≤ m into a binary trie as m grows, and answer each query in O(30).',
      argsGen: LARGE_GEN, expected: largeExpected(), timeLimitMs: 1500 },
  ],

  solution: {
    code: `function maximizeXor(nums, queries) {
  const BITS = 30;                         // values <= 1e9 < 2^30
  const zero = [0], one = [0];             // child indices per node; 0 = missing
  const insert = (v) => {
    let node = 0;
    for (let b = BITS - 1; b >= 0; b--) {
      const kids = (v >> b) & 1 ? one : zero;
      if (kids[node] === 0) {
        zero.push(0); one.push(0);
        kids[node] = zero.length - 1;
      }
      node = kids[node];
    }
  };
  const best = (x) => {
    let node = 0, res = 0;
    for (let b = BITS - 1; b >= 0; b--) {
      const bit = (x >> b) & 1;
      const opposite = bit ? zero : one;   // child that makes this XOR bit 1
      if (opposite[node] !== 0) { res |= 1 << b; node = opposite[node]; }
      else node = (bit ? one : zero)[node];
    }
    return res;
  };

  const sorted = [...nums].sort((a, b) => a - b);
  const order = queries.map((_, i) => i).sort((i, j) => queries[i][1] - queries[j][1]);
  const ans = new Array(queries.length);
  let p = 0;
  for (const qi of order) {
    const [x, m] = queries[qi];
    while (p < sorted.length && sorted[p] <= m) insert(sorted[p++]);
    ans[qi] = p === 0 ? -1 : best(x);      // empty trie → no allowed element
  }
  return ans;
}`,
    explanation: 'Numeric comparators in sort — the default sort is lexicographic. Answers are written back to their original indices.',
  },
  dryRun: {
    columns: ['query (sorted by m)', 'inserted so far', 'answer'],
    rows: [
      ['[8, 1]', '— (smallest num is 2)', '−1'],
      ['[6, 3]', '2, 3', '6^3 = 5 (6^2 = 4)'],
      ['[12, 4]', '2, 3, 4', '12^3 = 15'],
    ],
  },
  complexity: { time: 'O(n log n + q log q + (n + q) · 30)', space: 'O(n · 30)', explanation: 'Sorting dominates asymptotically; each insert/query walks 30 levels.' },
  alternative: {
    title: 'Online: min value per trie node',
    md: 'Insert all numbers once, storing at each node the minimum value in its subtree. During a query, only step into a child whose minimum ≤ m. Answers queries in their original order without sorting.',
    complexity: 'O((n + q) · 30) time, O(n · 30) space',
  },
  mistakes: [
    'Sorting with the default comparator (lexicographic: 10 < 9).',
    'Losing the original query order after sorting.',
    'Inserting bits LSB-first — the greedy needs the highest bit first.',
    'Declaring class Trie in the solution (clashes with the toolkit global).',
  ],
};
