export default {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  difficulty: 'Easy',
  order: 1,
  pattern: 'stack-matching',
  tags: ['string', 'stack'],
  source: { platform: 'LeetCode', number: 20, url: 'https://leetcode.com/problems/valid-parentheses/' },

  statement: `A string \`s\` contains only the characters \`( ) [ ] { }\`. Decide whether it is **valid**:

1. every opening bracket is closed by a bracket of the same type,
2. brackets are closed in the correct order (properly nested, never crossing),
3. every closing bracket has a matching opening bracket before it.`,
  examples: [
    { input: 's = "()"', output: 'true' },
    { input: 's = "()[]{}"', output: 'true' },
    { input: 's = "(]"', output: 'false' },
    { input: 's = "([)]"', output: 'false', explanation: 'The brackets cross.' },
  ],
  constraints: ['1 <= s.length <= 10^4', 's consists only of ()[]{}'],

  think: `- When a closing bracket arrives, which opening bracket must it close?
- Why are three separate counters (one per type) not enough?
- What must be true when you reach the end of the string?`,
  patternChallenge: {
    options: ['Two pointers from both ends', 'Hash map of counts', 'Stack (matching)', 'Sliding window'],
    answer: 2,
    explanation: 'A closer must match the MOST RECENT unmatched opener — LIFO. Counts ignore order ("([)]" has balanced counts), and two pointers from both ends fail on "()[]".',
  },
  hints: [
    'Push every opening bracket. For a closing bracket, the top of the stack must be its partner.',
    'Return false on a mismatch or when popping an empty stack; at the end the stack must be empty.',
  ],
  approach: `**Brute force:** repeatedly delete adjacent pairs "()", "[]", "{}" until nothing changes; valid if the string becomes empty → O(n²).

**Stack (O(n)):** push openers; for a closer, pop and compare with its partner (a map \`')' → '('\`). Mismatch or empty stack → false. At the end, valid iff the stack is empty. Quick exit: odd length is always invalid.`,

  functionName: 'isValid',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A single matching pair is valid.', args: ['()'], expected: true },
    { scenario: 'Example 2', hint: 'Several adjacent pairs of different types — each closer must match the opener right before it.', args: ['()[]{}'], expected: true },
    { scenario: 'Example 3', hint: 'The closer has the wrong type for the most recent opener.', args: ['(]'], expected: false },
    { scenario: 'Crossing brackets', hint: 'Per-type counters are balanced here, but the brackets cross — only a stack catches the wrong closing order.', args: ['([)]'], expected: false },
    { scenario: 'Properly nested', hint: 'Nested pairs close innermost first; the top of the stack must match each closer.', args: ['{[]}'], expected: true },
    { scenario: 'Single opener', hint: 'Odd length can never be valid; an unclosed opener must make the answer false.', args: ['('], expected: false },
    { scenario: 'Closer with empty stack', hint: 'A closer arrives before any opener — popping an empty stack must not be treated as a match (or crash).', args: [')'], expected: false },
    { scenario: 'Openers left unclosed', hint: 'Every character is an opener, so nothing ever mismatches — you must check the stack is empty at the end.', args: ['(('], expected: false },
    { scenario: 'Mixed nesting and sequence', hint: 'Combines nesting and concatenation of all three bracket types.', args: ['([]{})[{}]'], expected: true },
    { scenario: 'Valid prefix then stray closer', hint: 'The string starts fine but a later closer finds an empty stack.', args: ['()[]}'], expected: false },
    { scenario: 'Even length, all closers', hint: 'Even length is necessary but not sufficient — closers with no openers are invalid.', args: ['))(('], expected: false },
    { scenario: 'Same count, wrong type', hint: 'Counts of openers and closers match, yet the types do not pair up.', args: ['({]}'], expected: false },
    { scenario: 'Deep nesting (n = 10^4)', hint: '5000 openers followed by 5000 matching closers — the stack must grow deep and unwind completely.', argsGen: '() => [\'{[(\'.repeat(1666) + \'((\' + \'))\' + \')]}\'.repeat(1666)]', expected: true },
    { scenario: 'Long valid, one bad at end', hint: 'A 10^4-character valid sequence whose last closer has the wrong type.', argsGen: '() => [\'()[]{}\'.repeat(1666) + \'(]\']', expected: false },
  ],
  solution: {
    code: `function isValid(s) {
  if (s.length % 2 === 1) return false;
  const partner = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch in partner) {
      // pop() on an empty stack returns undefined, which never equals an opener
      if (stack.pop() !== partner[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
  },
  dryRun: {
    columns: ['ch', 'action', 'stack'],
    rows: [
      ['{', 'push', '["{"]'],
      ['[', 'push', '["{","["]'],
      [']', 'pop "[" ✓', '["{"]'],
      ['}', 'pop "{" ✓', '[]'],
      ['end', 'empty → true', '[]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each character is pushed/popped at most once; the stack can hold n/2 openers.' },
  alternative: {
    title: 'Push the expected closer',
    md: 'When you see an opener, push the closer you expect. For a closer, simply check `stack.pop() === ch`. Same complexity, slightly shorter.',
    code: `function isValid(s) {
  const st = [];
  const close = { '(': ')', '[': ']', '{': '}' };
  for (const ch of s) {
    if (ch in close) st.push(close[ch]);
    else if (st.pop() !== ch) return false;
  }
  return st.length === 0;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Returning true without checking the stack is empty ("((" would pass).',
    'Using counters per bracket type — accepts crossing brackets.',
    'Crashing or mis-comparing when a closer arrives with an empty stack.',
  ],
};
