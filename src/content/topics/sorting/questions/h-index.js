export default {
  id: 'h-index',
  title: 'H-Index',
  difficulty: 'Medium',
  order: 4,
  pattern: 'sorting-preprocess',
  tags: ['array', 'sorting', 'counting sort'],
  source: { platform: 'LeetCode', number: 274, url: 'https://leetcode.com/problems/h-index/' },

  statement: `\`citations[i]\` is the number of citations of a researcher's i-th paper. The researcher's **h-index** is the largest number \`h\` such that they have **at least \`h\` papers with at least \`h\` citations each**.

Return the h-index.`,
  examples: [
    { input: 'citations = [3,0,6,1,5]', output: '3', explanation: 'Three papers (3, 6, 5) have at least 3 citations; there are not four papers with ≥ 4.' },
    { input: 'citations = [1,3,1]', output: '1' },
  ],
  constraints: ['1 <= n <= 5000', '0 <= citations[i] <= 1000'],

  think: `- If the papers were sorted from most cited to least, what does position i tell you?
- Can h ever be larger than n?
- Could you avoid a comparison sort by counting?`,
  patternChallenge: {
    options: ['Sliding Window', 'Sort (descending) then scan for the threshold', 'Hash Set', 'Monotonic Stack'],
    answer: 1,
    explanation: 'After sorting descending, the (i+1) most cited papers all have ≥ c[i] citations, so the condition "i + 1 papers with ≥ i + 1 citations" becomes a simple check on c[i]. The input order is irrelevant, so sorting is allowed.',
  },
  hints: [
    'Sort descending. Walk i = 0, 1, …: while `c[i] >= i + 1`, h can be at least i + 1.',
    'Linear version: any citation count above n behaves like n. Count papers per citation value (capped at n), then walk from n down accumulating counts until the total reaches the value.',
  ],
  approach: `**Brute force:** for every h from n down to 0, count papers with ≥ h citations — O(n²).

**Sort as preprocessing:** sort descending. The first i + 1 papers all have ≥ \`c[i]\` citations. So if \`c[i] >= i + 1\`, we have i + 1 papers with ≥ i + 1 citations. The answer is the largest such i + 1 (the condition is true for a prefix, then false). O(n log n).

**Counting (O(n)):** \`bucket[min(c, n)]++\`. Walk h from n down: \`total += bucket[h]\` (papers with ≥ h citations); the first h with \`total >= h\` is the answer.`,

  functionName: 'hIndex',
  paramNames: ['citations'],
  starterCode: `/**
 * @param {number[]} citations
 * @return {number}
 */
function hIndex(citations) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: three papers have at least 3 citations.', args: [[3,0,6,1,5]], expected: 3 },
    { scenario: 'Example 2', hint: 'From the statement: at least one paper has ≥ 1 citation, but there are not two papers with ≥ 2.', args: [[1,3,1]], expected: 1 },
    { scenario: 'Single uncited paper', hint: 'One paper with 0 citations gives h = 0.', args: [[0]], expected: 0 },
    { scenario: 'Single highly cited paper', hint: 'Forgetting that h cannot exceed n: [100] has h-index 1, not 100.', args: [[100]], expected: 1 },
    { scenario: 'All zeros', hint: 'No paper has at least 1 citation, so h = 0.', args: [[0,0,0]], expected: 0 },
    { scenario: 'All citations above n', hint: 'h is capped by the number of papers: 4 papers → at most 4.', args: [[10,10,10,10]], expected: 4 },
    { scenario: 'Return the count, not citations', hint: 'Returning c[i] instead of the count i + 1: three papers with 5 citations give h = 3, not 5.', args: [[5,5,5]], expected: 3 },
    { scenario: 'Ascending input', hint: 'Input order is arbitrary — four papers have at least 4 citations.', args: [[1,2,3,4,5,6,7]], expected: 4 },
    { scenario: 'Multi-digit citations', hint: '`sort()` with no comparator uses string order (100 before 11 before 2) — always pass a numeric comparator.', args: [[2,100,11,3]], expected: 3 },
    { scenario: 'Tie at the boundary', hint: 'Two papers with 4 citations: h = 2 (not 4, since only 2 papers qualify).', args: [[4,4,0,0]], expected: 2 },
    { scenario: 'h equals n exactly', hint: 'Every paper has exactly n citations, so h = n.', args: [[3,3,3]], expected: 3 },
    { scenario: 'Maximum values (n = 5000)', hint: '5000 papers with 1000 citations each: h is capped by the citation count, 1000.', argsGen: '() => [new Array(5000).fill(1000)]', expected: 1000 },
    { scenario: 'Large mixed input (n = 5000)', hint: 'A full-size input with many repeated values — make sure counts with ties are handled.', argsGen: '() => { let s = 12345; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 5000 }, () => r() % 1001)]; }', expected: 836 },
  ],

  solution: {
    code: `function hIndex(citations) {
  const c = [...citations].sort((a, b) => b - a);  // most cited first, don't mutate input
  let h = 0;
  while (h < c.length && c[h] >= h + 1) h++;       // top h+1 papers all have >= h+1
  return h;
}`,
  },
  dryRun: {
    columns: ['i', 'c[i] (sorted desc)', 'c[i] >= i+1?', 'h'],
    rows: [
      ['0', '6', 'yes', '1'],
      ['1', '5', 'yes', '2'],
      ['2', '3', 'yes', '3'],
      ['3', '1', 'no → stop', '3'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(n)', explanation: 'Dominated by sorting a copy; the scan is O(n).' },
  alternative: {
    title: 'Counting sort with capping — O(n)',
    md: 'h ≤ n always, so citation counts above n can be capped at n.',
    code: `function hIndex(citations) {
  const n = citations.length;
  const bucket = new Array(n + 1).fill(0);
  for (const c of citations) bucket[Math.min(c, n)]++;
  let total = 0;
  for (let h = n; h >= 0; h--) {
    total += bucket[h];              // papers with >= h citations
    if (total >= h) return h;
  }
  return 0;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    '`citations.sort()` with no comparator — string order puts 100 before 11 before 2.',
    'Returning `c[i]` instead of the count i + 1 (the h-index counts papers).',
    'Forgetting that h cannot exceed n: [100] has h-index 1, not 100.',
  ],
};
