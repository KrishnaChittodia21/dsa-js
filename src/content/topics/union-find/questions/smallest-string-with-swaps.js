export default {
  id: 'smallest-string-with-swaps',
  title: 'Smallest String With Swaps',
  difficulty: 'Medium',
  order: 6,
  pattern: 'union-find-connectivity',
  tags: ['union find', 'string', 'sorting'],
  source: { platform: 'LeetCode', number: 1202, url: 'https://leetcode.com/problems/smallest-string-with-swaps/' },

  statement: `You are given a string \`s\` and a list \`pairs\` where \`pairs[i] = [a, b]\` means you may swap the characters at indices \`a\` and \`b\`. You can use each pair any number of times, in any order.

Return the lexicographically smallest string you can produce.`,
  examples: [
    { input: 's = "dcab", pairs = [[0,3],[1,2]]', output: '"bacd"' },
    { input: 's = "dcab", pairs = [[0,3],[1,2],[0,2]]', output: '"abcd"' },
    { input: 's = "cba", pairs = [[0,1],[1,2]]', output: '"abc"' },
  ],
  constraints: ['1 <= s.length <= 10^5', '0 <= pairs.length <= 10^5', 's contains lowercase letters only'],

  think: `- If you can swap (0,1) and (1,2) forever, can the character at 0 ever reach index 2?
- Once you know a group of indices whose characters can be freely permuted, what is the best arrangement inside it?`,
  patternChallenge: {
    options: ['Greedy with a Stack', 'Union Find (Dynamic Connectivity)', 'Sliding Window', 'Dynamic Programming'],
    answer: 1,
    explanation: 'Swappability is transitive: indices chained by pairs form a group whose characters can be arranged in any order. DSU finds the groups; then sort each group. A greedy stack cannot see which indices are linked.',
  },
  hints: [
    'Union the two indices of every pair. Each DSU group is a set of positions that can hold its characters in any order.',
    'For each group, sort its indices and sort its characters, then place the smallest character at the smallest index.',
  ],
  approach: `**Key claim:** within a connected group, any permutation is reachable (adjacent-style swaps along a spanning path generate every permutation, like bubble sort).

1. Union every pair.
2. Bucket indices by root: \`groups: Map<root, index[]>\` (indices come out already increasing if you scan i = 0..n−1).
3. For each bucket, collect its characters, sort them, write them back into the bucket's indices in order.

Using a plain character array and \`join('')\` at the end keeps it O(n log n).`,

  functionName: 'smallestStringWithSwaps',
  paramNames: ['s', 'pairs'],
  starterCode: `/**
 * @param {string} s
 * @param {number[][]} pairs
 * @return {string}
 */
function smallestStringWithSwaps(s, pairs) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two separate groups {0,3} and {1,2}: each group is sorted independently.', args: ['dcab', [[0, 3], [1, 2]]], expected: 'bacd' },
    { scenario: 'Example 2', hint: 'The pair [0,2] merges the groups, so every index can be rearranged freely.', args: ['dcab', [[0, 3], [1, 2], [0, 2]]], expected: 'abcd' },
    { scenario: 'Example 3', hint: 'Swaps are transitive: (0,1) and (1,2) let any character reach any of the three positions.', args: ['cba', [[0, 1], [1, 2]]], expected: 'abc' },
    { scenario: 'Single character', hint: 'The smallest input; nothing to swap.', args: ['a', []], expected: 'a' },
    { scenario: 'No pairs', hint: 'With no pairs the string cannot change, even if it is not sorted.', args: ['zyx', []], expected: 'zyx' },
    { scenario: 'Self-pairs and repeats', hint: 'A pair like [3,3] is a no-op and duplicate pairs must not break your DSU.', args: ['udyyek', [[3, 3], [3, 0], [5, 1], [3, 1], [3, 4], [3, 5]]], expected: 'deykuy' },
    { scenario: 'Duplicate pairs, partial merge', hint: 'Only {0,1,4} and {2,3} are groups; a repeated pair adds nothing new.', args: ['qdwyt', [[2, 3], [3, 2], [0, 1], [4, 0], [3, 2]]], expected: 'dqwyt' },
    { scenario: 'Single greedy pass fails', hint: 'Swapping each pair once in order gives "bca"; swaps are repeatable, so the true answer sorts the whole group.', args: ['cab', [[0, 1], [1, 2]]], expected: 'abc' },
    { scenario: 'All same characters', hint: 'Every arrangement is identical; the answer is the input.', args: ['aaaa', [[0, 1], [2, 3], [1, 2]]], expected: 'aaaa' },
    { scenario: 'Already smallest', hint: 'The string is already sorted within its group, so nothing changes.', args: ['abcd', [[0, 3], [1, 2]]], expected: 'abcd' },
    { scenario: 'Interleaved groups', hint: 'Even and odd positions form two groups; each is sorted into its own slots.', args: ['hgfedcba', [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7]]], expected: 'badcfehg' },
    { scenario: 'Long reverse chain (n = 2·10^4)', hint: 'One big component built from a chain of adjacent pairs: repeatedly swapping out-of-order neighbours is O(n²) here; group, sort, and place instead.', argsGen: '() => { const n = 20000; let s = \'\'; for (let i = 0; i < n; i++) s += String.fromCharCode(122 - (i % 26)); const p = []; for (let i = n - 1; i > 0; i--) p.push([i - 1, i]); return [s, p]; }', expectedGen: "() => { const [s] = (() => { const n = 20000; let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(122 - (i % 26)); const p = []; for (let i = n - 1; i > 0; i--) p.push([i - 1, i]); return [s, p]; })(); return s.split('').sort().join(''); }", timeLimitMs: 1000 },
    { scenario: 'Many random pairs (10^5)', hint: '10^5 pairs over 20 000 characters; DSU with path compression keeps each union nearly O(1).', argsGen: '() => { const n = 20000; let x = 99; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); let s = \'\'; for (let i = 0; i < n; i++) s += String.fromCharCode(97 + (r() % 26)); const p = []; for (let i = 0; i < 100000; i++) { const a = r() % n; p.push([a, Math.min(n - 1, a + 1 + (r() % 40)) ]); } return [s, p]; }', expectedGen: "() => { const [s, pairs] = (() => { const n = 20000; let x = 99; const r = () => (x = (x * 1103515245 + 12345) % 2147483648); let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(97 + (r() % 26)); const p = []; for (let i = 0; i < 100000; i++) { const a = r() % n; p.push([a, Math.min(n - 1, a + 1 + (r() % 40)) ]); } return [s, p]; })(); const n = s.length, adj = Array.from({ length: n }, () => []); for (const [a, b] of pairs) { adj[a].push(b); adj[b].push(a); } const out = new Array(n), seen = new Uint8Array(n); for (let i = 0; i < n; i++) { if (seen[i]) continue; const comp = [i]; seen[i] = 1; for (let k = 0; k < comp.length; k++) for (const j of adj[comp[k]]) if (!seen[j]) { seen[j] = 1; comp.push(j); } comp.sort((a, b) => a - b); const chars = comp.map((j) => s[j]).sort(); comp.forEach((j, t) => { out[j] = chars[t]; }); } return out.join(''); }", timeLimitMs: 1000 },
  ],

  solution: {
    code: `function smallestStringWithSwaps(s, pairs) {
  const n = s.length;
  const uf = new UnionFind(n);
  for (const [a, b] of pairs) uf.union(a, b);

  const groups = new Map();                   // root -> indices (increasing)
  for (let i = 0; i < n; i++) {
    const r = uf.find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  }

  const out = s.split('');
  for (const idx of groups.values()) {
    const chars = idx.map((i) => s[i]).sort(); // default sort is fine for single letters
    idx.forEach((pos, k) => { out[pos] = chars[k]; });
  }
  return out.join('');
}`,
  },
  dryRun: {
    columns: ['step', 'detail'],
    rows: [
      ['unions', '[0,3],[1,2],[0,2] → one group {0,1,2,3}'],
      ['group chars', 'd,c,a,b → sorted a,b,c,d'],
      ['write back', 'indices 0,1,2,3 ← a,b,c,d → "abcd"'],
    ],
  },
  complexity: { time: 'O(n log n + p · α(n))', space: 'O(n)', explanation: 'p unions, then each group is sorted; sorting all groups costs at most O(n log n) in total.' },
  alternative: {
    title: 'DFS components',
    md: 'Build an adjacency list from pairs and DFS to collect each component\'s indices; then sort as above. Same complexity, recursion depth risk for long chains in JS.',
    complexity: 'O(n log n + p) time, O(n + p) space',
  },
  mistakes: ['Only swapping each pair once greedily — swaps are transitive and repeatable.', 'Building a new string with += in a loop (O(n²)); use an array and join.'],
};
