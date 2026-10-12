export default {
  id: 'satisfiability-of-equality-equations',
  title: 'Satisfiability of Equality Equations',
  difficulty: 'Medium',
  order: 5,
  pattern: 'union-find-connectivity',
  tags: ['union find', 'string', 'graph'],
  source: { platform: 'LeetCode', number: 990, url: 'https://leetcode.com/problems/satisfiability-of-equality-equations/' },

  statement: `You get a list of 4-character equations over single-letter variables \`a\`–\`z\`. Each equation is either \`"x==y"\` or \`"x!=y"\`.

Return \`true\` if it is possible to assign an integer to every variable so that **all** equations hold at the same time, otherwise \`false\`.`,
  examples: [
    { input: 'equations = ["a==b","b!=a"]', output: 'false' },
    { input: 'equations = ["b==a","a==b"]', output: 'true' },
    { input: 'equations = ["a==b","b==c","a==c"]', output: 'true' },
  ],
  constraints: ['1 <= equations.length <= 500', 'equations[i].length == 4', 'equations[i][1..2] is "==" or "!="'],

  think: `- Equality is transitive: if a == b and b == c, then a == c. Which structure models "forced to be equal" groups?
- Can you decide a "!=" equation before you have seen all the "==" ones?`,
  patternChallenge: {
    options: ['Union Find (Dynamic Connectivity)', 'Backtracking over assignments', 'Two Pointers', 'Prefix Sum'],
    answer: 0,
    explanation: '"==" is an equivalence relation, so it splits variables into groups — DSU. Backtracking would try assignments exponentially and is unnecessary.',
  },
  hints: [
    'Process in two passes: first all the "==" equations, then all the "!=" ones.',
    'Each "!=" is violated exactly when its two variables ended up with the same root.',
  ],
  approach: `**Why two passes?** A "!=" might look fine early and be contradicted by a later chain of "==" (e.g. \`a!=c, a==b, b==c\`). So:

1. Pass 1: for every \`x==y\`, union(x, y) (letters → 0..25 via \`charCodeAt - 97\`).
2. Pass 2: for every \`x!=y\`, if find(x) === find(y) return false.
3. Return true — give each group its own distinct integer and every equation holds.`,

  functionName: 'equationsPossible',
  paramNames: ['equations'],
  starterCode: `/**
 * @param {string[]} equations
 * @return {boolean}
 */
function equationsPossible(equations) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'a == b and b != a directly contradict each other.', args: [['a==b', 'b!=a']], expected: false },
    { scenario: 'Example 2', hint: 'The same equality written twice in both directions is fine.', args: [['b==a', 'a==b']], expected: true },
    { scenario: 'Example 3', hint: 'All equalities, no inequalities — always satisfiable.', args: [['a==b', 'b==c', 'a==c']], expected: true },
    { scenario: 'Contradiction via transitivity', hint: 'c == a and a == b force b == c, contradicting b != c — but only once the LAST equation is read. Do all "==" unions before checking any "!=".', args: [['a==b', 'b!=c', 'c==a']], expected: false },
    { scenario: 'Self-equality and unrelated vars', hint: '"c==c" is harmless and x, z were never merged, so x != z holds.', args: [['c==c', 'b==d', 'x!=z']], expected: true },
    { scenario: 'Self-inequality', hint: '"a!=a" can never hold — a variable is always in its own set.', args: [['a!=a']], expected: false },
    { scenario: 'Inequality listed first', hint: 'If you check "!=" in the same pass, "a!=c" is checked before a and c are merged and wrongly passes.', args: [['a!=c', 'a==b', 'b==c']], expected: false },
    { scenario: 'Only inequalities', hint: 'Inequalities alone are always satisfiable when no variable is compared with itself (use enough distinct values).', args: [['a!=b', 'b!=c', 'c!=a']], expected: true },
    { scenario: 'Single equality', hint: 'The smallest input: one equation that trivially holds.', args: [['z==z']], expected: true },
    { scenario: 'Self-inequality after equalities', hint: '"b!=b" is false no matter what else is in the list.', args: [['a==b', 'c==d', 'b!=b']], expected: false },
    { scenario: 'Two independent groups', hint: '{a,b,c} and {x,y,z} are separate groups; inequalities across groups are fine.', args: [['a==b', 'b==c', 'x==y', 'y==z', 'a!=x', 'c!=z']], expected: true },
    { scenario: 'Max size, satisfiable (500 eqs)', hint: '500 equations merge every letter into one group and add only equalities — must be true.', argsGen: '() => { const L = \'abcdefghijklmnopqrstuvwxyz\'; const e = []; for (let k = 0; k < 19; k++) for (let i = 0; i < 25; i++) e.push(L[i] + \'==\' + L[i + 1]); for (let i = 0; i < 24; i++) e.push(L[i] + \'==\' + L[25 - i]); e.push(\'a==z\'); return [e]; }', expected: true },
    { scenario: 'Max size, long-chain conflict', hint: 'All 26 letters are chained into one group, so the final "z!=a" — far apart along the chain — is a contradiction.', argsGen: '() => { const L = \'abcdefghijklmnopqrstuvwxyz\'; const e = []; for (let k = 0; k < 19; k++) for (let i = 0; i < 25; i++) e.push(L[i] + \'==\' + L[i + 1]); for (let i = 0; i < 24; i++) e.push(L[i] + \'==\' + L[i + 1]); e.push(\'z!=a\'); return [e]; }', expected: false },
  ],

  solution: {
    code: `function equationsPossible(equations) {
  const uf = new UnionFind(26);
  const id = (ch) => ch.charCodeAt(0) - 97;
  for (const e of equations) {
    if (e[1] === '=') uf.union(id(e[0]), id(e[3]));      // pass 1: build groups
  }
  for (const e of equations) {
    if (e[1] === '!' && uf.connected(id(e[0]), id(e[3]))) return false; // pass 2: verify
  }
  return true;
}`,
  },
  dryRun: {
    columns: ['pass', 'equation', 'action'],
    rows: [
      ['1', 'a!=c', 'skip'],
      ['1', 'a==b', 'union(a,b)'],
      ['1', 'b==c', 'union(b,c) → {a,b,c}'],
      ['2', 'a!=c', 'find(a) === find(c) → false'],
    ],
  },
  complexity: { time: 'O(m · α(26))', space: 'O(1)', explanation: 'm equations, the DSU has a fixed 26 slots.' },
  alternative: {
    title: 'Graph colouring with DFS',
    md: 'Build a graph of "==" edges, DFS to label each component, then check every "!=" pair has different labels. Same idea, more code.',
    complexity: 'O(m) time, O(1) space (26 nodes)',
  },
  mistakes: ['Checking "!=" in the same pass as "==" (misses later contradictions).', 'Forgetting that "a!=a" is always false.'],
};
