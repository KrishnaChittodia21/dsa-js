export default {
  id: 'find-the-town-judge',
  title: 'Find the Town Judge',
  difficulty: 'Easy',
  order: 1,
  pattern: 'topo-degree-counting',
  tags: ['graph', 'in-degree', 'out-degree'],
  source: { platform: 'LeetCode', number: 997, url: 'https://leetcode.com/problems/find-the-town-judge/' },

  statement: `A town has \`n\` people labelled \`1..n\`. There is a rumour that one of them is the secret **town judge**. If the judge exists:

1. The judge trusts nobody.
2. Everybody else trusts the judge.
3. Exactly one person satisfies both rules.

You get \`trust[i] = [a, b]\` meaning person \`a\` trusts person \`b\` (no duplicates, nobody trusts themselves). Return the judge's label, or \`-1\` if there is no judge.`,
  examples: [
    { input: 'n = 2, trust = [[1,2]]', output: '2' },
    { input: 'n = 3, trust = [[1,3],[2,3]]', output: '3' },
    { input: 'n = 3, trust = [[1,3],[2,3],[3,1]]', output: '-1', explanation: '3 trusts 1, so 3 is not the judge.' },
  ],
  constraints: ['1 <= n <= 1000', '0 <= trust.length <= 10^4', 'All trust pairs are unique, a != b'],

  think: `- Draw each trust pair as a directed edge a → b. What are the in-degree and out-degree of the judge?
- Can you combine both counts into one number?`,
  patternChallenge: {
    options: ['In/out-degree counting', "Kahn's topological sort", 'DFS from every person', 'Union-Find'],
    answer: 0,
    explanation: 'The judge is defined purely by degrees: out-degree 0 (trusts nobody) and in-degree n − 1 (trusted by all others). No traversal is needed. Union-Find ignores direction, which is the whole point here.',
  },
  hints: [
    'Keep `score[p] = (times p is trusted) − (times p trusts someone)`.',
    'The judge is the only person who can reach score n − 1 (in-degree n − 1, out-degree 0).',
  ],
  approach: `**Brute force:** for each candidate, scan all pairs to check both rules: O(n · m).

**Degree counting:** one pass over \`trust\`: \`score[a]--\`, \`score[b]++\`. A person with \`score === n − 1\` has in-degree n − 1 (maximum possible) and therefore out-degree 0 — the judge. At most one person can have that score. O(n + m).`,

  functionName: 'findJudge',
  paramNames: ['n', 'trust'],
  starterCode: `/**
 * @param {number} n
 * @param {number[][]} trust
 * @return {number}
 */
function findJudge(n, trust) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Person 1 trusts 2 and 2 trusts nobody: 2 is the judge.', args: [2, [[1, 2]]], expected: 2 },
    { scenario: 'Example 2', hint: 'Both others trust 3, and 3 trusts nobody.', args: [3, [[1, 3], [2, 3]]], expected: 3 },
    { scenario: 'Example 3', hint: '3 is trusted by everyone but also trusts 1 — the judge must trust nobody.', args: [3, [[1, 3], [2, 3], [3, 1]]], expected: -1 },
    { scenario: 'Single person, no trust', hint: 'With n = 1 and no pairs, that person trivially satisfies both rules: return 1.', args: [1, []], expected: 1 },
    { scenario: 'Two people, no trust', hint: 'Nobody is trusted by the other person: no judge.', args: [2, []], expected: -1 },
    { scenario: 'Judge among extra trust', hint: 'Other people also trust each other; only 3 has in-degree n − 1 and out-degree 0.', args: [4, [[1, 3], [1, 4], [2, 3], [2, 4], [4, 3]]], expected: 3 },
    { scenario: 'Trust chain', hint: '3 trusts nobody but only 2 trusts 3 — checking only out-degree picks a wrong judge.', args: [3, [[1, 2], [2, 3]]], expected: -1 },
    { scenario: 'Dense trust, no judge', hint: 'Everyone trusts someone, so no one can be the judge.', args: [4, [[1, 2], [3, 2], [1, 3], [4, 1], [3, 1], [2, 1], [4, 3]]], expected: -1 },
    { scenario: 'Judge is person n', hint: 'Labels are 1..n: an array of size n has no slot for person n.', args: [4, [[1, 4], [2, 4], [3, 4]]], expected: 4 },
    { scenario: 'Trusted by all but one', hint: 'Person 1 is trusted by 2 and 3 but not by 4: in-degree must be exactly n − 1.', args: [4, [[2, 1], [3, 1], [4, 2]]], expected: -1 },
    { scenario: 'Max n, judge exists', hint: '1000 people: everyone trusts person 500, plus many other pairs that do not involve trust from 500.', argsGen: '() => { const n = 1000; const t = []; for (let a = 1; a <= n; a++) if (a !== 500) t.push([a, 500]); for (let a = 1; t.length < 10000; a++) for (let k = 1; k <= 10 && t.length < 10000; k++) { const b = ((a + k * 37) % n) + 1; if (a !== 500 && b !== 500 && b !== a) t.push([a, b]); } return [n, t]; }', expected: 500 },
    { scenario: 'Max n, judge trusts one', hint: 'Same town, but the would-be judge trusts one person — no judge.', argsGen: '() => { const n = 1000; const t = []; for (let a = 1; a <= n; a++) if (a !== 500) t.push([a, 500]); t.push([500, 1]); return [n, t]; }', expected: -1 },
  ],

  solution: {
    code: `function findJudge(n, trust) {
  const score = new Array(n + 1).fill(0);   // in-degree minus out-degree
  for (const [a, b] of trust) {
    score[a]--;                             // a trusts someone → cannot be the judge
    score[b]++;
  }
  for (let p = 1; p <= n; p++) if (score[p] === n - 1) return p;
  return -1;
}`,
    explanation: 'score = n − 1 forces in-degree = n − 1 and out-degree = 0, because in-degree can be at most n − 1.',
  },
  dryRun: { columns: ['pair', 'score after'], rows: [['[1,3]', '1:-1, 3:+1'], ['[2,3]', '2:-1, 3:+2'], ['[3,1]', '3:+1, 1:0 → nobody has 2 → -1']] },
  complexity: { time: 'O(n + m)', space: 'O(n)', explanation: 'One pass over the pairs and one over the people.' },
  alternative: { title: 'Separate in/out arrays', md: 'Keep `indeg` and `outdeg` separately and look for `indeg[p] === n - 1 && outdeg[p] === 0`. Same complexity, arguably clearer.', complexity: 'O(n + m) time, O(n) space' },
  mistakes: [
    'Forgetting n = 1 with no trust pairs — the single person is the judge.',
    'Only checking in-degree (the judge must also trust nobody).',
    'Using an array of size n with 1-based labels.',
  ],
};
