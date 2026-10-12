export default {
  id: 'generate-parentheses',
  title: 'Generate Parentheses',
  difficulty: 'Medium',
  order: 8,
  pattern: 'backtracking-string-construction',
  tags: ['backtracking', 'string'],
  source: { platform: 'LeetCode', number: 22, url: 'https://leetcode.com/problems/generate-parentheses/' },

  statement: `Given \`n\` pairs of parentheses, return **every well-formed string** made of exactly \`n\` \`'('\` and \`n\` \`')'\`, in any order.

A string is well-formed when every \`'('\` is closed by a later \`')'\` and no \`')'\` appears without a matching earlier \`'('\`.`,
  examples: [
    { input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]' },
    { input: 'n = 1', output: '["()"]' },
  ],
  constraints: ['1 <= n <= 8'],

  think: `- Brute force would try all 2^(2n) strings. Which prefixes are already hopeless?
- When is it allowed to add '('? When is it allowed to add ')'?
- Do you ever need to validate a complete string if you only ever build valid prefixes?`,
  patternChallenge: {
    options: ['Stack', 'Backtracking — Building strings with counters', 'Backtracking — Permutations', 'Two Pointers'],
    answer: 1,
    explanation: 'We must generate all strings, one character at a time, and a simple rule on the counts (open ≤ n, close ≤ open) keeps every prefix valid. A stack *checks* one given string; it does not generate them. Permutations of "((()))" would create many duplicates.',
  },
  hints: [
    'Track `open` and `close` = how many of each you have placed so far.',
    'You may add `(` if `open < n`, and `)` if `close < open`. Record when the length is `2n`.',
  ],
  approach: `**Brute force:** generate all 2^(2n) strings of '(' and ')' and keep the balanced ones (checked with a counter) — O(2^(2n) · n).

**Backtracking with counters:** only extend prefixes that can still become valid:
- \`'('\` is allowed while \`open < n\`;
- \`')'\` is allowed while \`close < open\` (there is an unmatched '(' to close).
Every leaf reached has length 2n and is valid, so no final check is needed. The number of answers is the n-th Catalan number C(n) ≈ 4ⁿ / (n^1.5 √π).`,

  functionName: 'generateParenthesis',
  paramNames: ['n'],
  starterCode: `/**
 * @param {number} n
 * @return {string[]}
 */
function generateParenthesis(n) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'All 5 balanced strings with 3 pairs, each exactly once.', args: [3], expected: ["()()()","()(())","(())()","(()())","((()))"] },
    { scenario: 'Example 2', hint: 'Smallest input: one pair, one string.', args: [1], expected: ["()"] },
    { scenario: 'Two pairs', hint: 'Only "(())" and "()()". Allowing ")" when close < n (instead of close < open) produces "())(".', args: [2], expected: ["()()","(())"] },
    { scenario: 'Four pairs (14 strings)', hint: 'Every string must be balanced and unique — check your close condition.', args: [4], expected: ["()()()()","()()(())","()(())()","()(()())","()((()))","(())()()","(())(())","(()())()","(()()())","(()(()))","((()))()","((())())","((()()))","(((())))"] },
    { scenario: 'Five pairs (full list)', hint: '42 strings. If you build with a shared string, remove the character after each recursive call.', args: [5], expected: ["()()()()()","()()()(())","()()(())()","()()(()())","()()((()))","()(())()()","()(())(())","()(()())()","()(()()())","()(()(()))","()((()))()","()((())())","()((()()))","()(((())))","(())()()()","(())()(())","(())(())()","(())(()())","(())((()))","(()())()()","(()())(())","(()()())()","(()()()())","(()()(()))","(()(()))()","(()(())())","(()(()()))","(()((())))","((()))()()","((()))(())","((())())()","((())()())","((())(()))","((()()))()","((()())())","((()()()))","((()(())))","(((())))()","(((()))())","(((())()))","(((()())))","((((()))))"] },
    { scenario: 'Five pairs (count)', hint: 'Catalan(5) = 42 distinct valid strings.', args: [5], expected: 42 },
    { scenario: 'Six pairs', hint: 'Catalan(6) = 132. Duplicates or invalid strings fail the check.', args: [6], expected: 132 },
    { scenario: 'Seven pairs', hint: 'Catalan(7) = 429 strings.', args: [7], expected: 429 },
    { scenario: 'Max n (8 pairs)', hint: 'Catalan(8) = 1430. Generating all 2^16 strings and filtering is wasteful — only add ")" when it keeps the prefix valid.', args: [8], expected: 1430 },
    { scenario: 'Six pairs (full list)', hint: 'All 132 strings for n = 6, each balanced and listed once.', args: [6], expected: ["()()()()()()","()()()()(())","()()()(())()","()()()(()())","()()()((()))","()()(())()()","()()(())(())","()()(()())()","()()(()()())","()()(()(()))","()()((()))()","()()((())())","()()((()()))","()()(((())))","()(())()()()","()(())()(())","()(())(())()","()(())(()())","()(())((()))","()(()())()()","()(()())(())","()(()()())()","()(()()()())","()(()()(()))","()(()(()))()","()(()(())())","()(()(()()))","()(()((())))","()((()))()()","()((()))(())","()((())())()","()((())()())","()((())(()))","()((()()))()","()((()())())","()((()()()))","()((()(())))","()(((())))()","()(((()))())","()(((())()))","()(((()())))","()((((()))))","(())()()()()","(())()()(())","(())()(())()","(())()(()())","(())()((()))","(())(())()()","(())(())(())","(())(()())()","(())(()()())","(())(()(()))","(())((()))()","(())((())())","(())((()()))","(())(((())))","(()())()()()","(()())()(())","(()())(())()","(()())(()())","(()())((()))","(()()())()()","(()()())(())","(()()()())()","(()()()()())","(()()()(()))","(()()(()))()","(()()(())())","(()()(()()))","(()()((())))","(()(()))()()","(()(()))(())","(()(())())()","(()(())()())","(()(())(()))","(()(()()))()","(()(()())())","(()(()()()))","(()(()(())))","(()((())))()","(()((()))())","(()((())()))","(()((()())))","(()(((()))))","((()))()()()","((()))()(())","((()))(())()","((()))(()())","((()))((()))","((())())()()","((())())(())","((())()())()","((())()()())","((())()(()))","((())(()))()","((())(())())","((())(()()))","((())((())))","((()()))()()","((()()))(())","((()())())()","((()())()())","((()())(()))","((()()()))()","((()()())())","((()()()()))","((()()(())))","((()(())))()","((()(()))())","((()(())()))","((()(()())))","((()((()))))","(((())))()()","(((())))(())","(((()))())()","(((()))()())","(((()))(()))","(((())()))()","(((())())())","(((())()()))","(((())(())))","(((()())))()","(((()()))())","(((()())()))","(((()()())))","(((()(()))))","((((()))))()","((((())))())","((((()))()))","((((())())))","((((()()))))","(((((())))))"] },
  ],
  // Large n: too many strings to list, so tests with a numeric \`expected\` check the COUNT (Catalan number)
  // and that every string is distinct, of length 2n and balanced.
  checker: `(output, args, expected) => {
    if (!Array.isArray(output)) return false;
    const n = args[0];
    const valid = (s) => {
      if (typeof s !== 'string' || s.length !== 2 * n) return false;
      let b = 0;
      for (const ch of s) { b += ch === '(' ? 1 : ch === ')' ? -1 : NaN; if (!(b >= 0)) return false; }
      return b === 0;
    };
    if (!output.every(valid) || new Set(output).size !== output.length) return false;
    return output.length === (Array.isArray(expected) ? expected.length : expected);
  }`,

  solution: {
    code: `function generateParenthesis(n) {
  const result = [];
  const path = [];

  function backtrack(open, close) {
    if (path.length === 2 * n) {
      result.push(path.join(''));
      return;
    }
    if (open < n) {                 // can still open a new pair
      path.push('(');
      backtrack(open + 1, close);
      path.pop();
    }
    if (close < open) {             // there is an unmatched '(' to close
      path.push(')');
      backtrack(open, close + 1);
      path.pop();
    }
  }

  backtrack(0, 0);
  return result;
}`,
  },
  dryRun: {
    columns: ['path', 'open', 'close', 'allowed next'],
    rows: [
      ['""', '0', '0', '( only'],
      ['"("', '1', '0', '( or )'],
      ['"(("', '2', '0', '( or )'],
      ['"((("', '3', '0', ') only → "((()))"'],
      ['"(()"', '2', '1', '( or ) → "(()())", "(())()"'],
      ['"()"', '1', '1', '( only → "()(())", "()()()"'],
    ],
  },
  complexity: { time: 'O(4ⁿ / √n)', space: 'O(n) extra (plus output)', explanation: 'The number of valid strings is the Catalan number C(n) ~ 4ⁿ / n^1.5; each costs O(n) to build, giving O(4ⁿ/√n). Every explored prefix leads to at least one answer, so there is no wasted branch.' },
  alternative: {
    title: 'Closure number (divide by the first pair)',
    md: 'Every valid string is `"(" + A + ")" + B` where A has c pairs and B has n − 1 − c pairs. Recursively combine all A and B for c = 0..n−1 (can be memoised).',
    complexity: 'Same output-bound complexity',
  },
  mistakes: [
    'Allowing `)` when `close < n` instead of `close < open` — produces invalid strings like "())(".',
    'Generating all strings and filtering — exponentially more work.',
    'Using string `+=` on a shared variable without removing the character afterwards.',
  ],
};
