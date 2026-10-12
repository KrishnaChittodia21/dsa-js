export default {
  id: 'basic-calculator',
  title: 'Basic Calculator',
  difficulty: 'Hard',
  order: 3,
  pattern: 'stack-expression-eval',
  tags: ['string', 'stack', 'math', 'parsing'],
  source: { platform: 'LeetCode', number: 224, url: 'https://leetcode.com/problems/basic-calculator/' },

  statement: `Evaluate a valid expression string \`s\` that may contain non-negative integers, \`+\`, \`-\`, parentheses \`(\` \`)\` and spaces. \`-\` may also be used as a **unary** minus (e.g. \`"-(2 + 3)"\` or \`"-1 + 2"\`), but \`+\` is never unary.

Do not use \`eval\` or any built-in expression evaluator. Every intermediate value fits in a 32-bit integer.`,
  examples: [
    { input: 's = "1 + 1"', output: '2' },
    { input: 's = " 2-1 + 2 "', output: '3' },
    { input: 's = "(1+(4+5+2)-3)+(6+8)"', output: '23' },
    { input: 's = "- (3 + (4 + 5))"', output: '-12' },
  ],
  constraints: ['1 <= s.length <= 3 · 10^5', 's contains digits, "+", "-", "(", ")" and " "', 's is a valid expression'],

  think: `- Without parentheses, you only need a running \`result\` and the \`sign\` of the next number. What do you need to **remember** when a "(" starts a new sub-expression?
- When the ")" arrives, how do you merge the inner value back into the outer one?
- How does unary minus fit this model? (Think of "-(…)" as "0 − (…)".)`,
  patternChallenge: {
    options: ['Recursion only (no stack possible)', 'Two pointers', 'Sign stack: save (result, sign) at each "("', 'Monotonic stack'],
    answer: 2,
    explanation: 'Parentheses nest, so the innermost group finishes first — LIFO. Save the outer running result and the sign in front of the "(", evaluate the inside from scratch, then combine at ")". Recursion is equivalent but can overflow the call stack on deep nesting.',
  },
  hints: [
    'Keep result, sign (+1/−1) and the number being read. On "+"/"-": add sign·number to result, reset number, set sign.',
    'On "(": push result and sign, then reset result = 0, sign = 1. On ")": finish the pending number, then result = poppedSign · result + poppedResult.',
  ],
  approach: `**Idea:** with only + and −, the expression is a sum of signed numbers. Parentheses only change the sign in front of a whole group.

**Sign stack (O(n)):**
- digit → \`num = num * 10 + d\` (multi-digit numbers);
- \`+\` / \`-\` → \`result += sign * num; num = 0; sign = ±1\`;
- \`(\` → push \`result\`, push \`sign\`; reset \`result = 0, sign = 1\`;
- \`)\` → \`result += sign * num; num = 0\`; then \`result = stack.pop() * result + stack.pop()\` (sign first, then the saved result);
- space → skip.
At the end return \`result + sign * num\`.

Unary minus needs no special case: at the start (or right after "("), result is 0, so "-x" is evaluated as 0 − x.`,

  functionName: 'calculate',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {number}
 */
function calculate(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A single binary addition with spaces.', args: ['1 + 1'], expected: 2 },
    { scenario: 'Example 2', hint: 'Leading/trailing spaces and a subtraction followed by an addition.', args: [' 2-1 + 2 '], expected: 3 },
    { scenario: 'Example 3', hint: 'Nested groups added and subtracted; each ")" folds the inner value into the saved outer one.', args: ['(1+(4+5+2)-3)+(6+8)'], expected: 23 },
    { scenario: 'Unary minus before a group', hint: 'With result starting at 0, a leading "-" just works — special-casing unary minus usually breaks it.', args: ['- (3 + (4 + 5))'], expected: -12 },
    { scenario: 'Single number', hint: 'No operator at all — you must still add the pending number after the loop.', args: ['42'], expected: 42 },
    { scenario: 'Single digit', hint: 'Smallest input: one character.', args: ['7'], expected: 7 },
    { scenario: 'Leading unary minus', hint: 'The expression starts with "-" applied to a number.', args: ['-1 + 2'], expected: 1 },
    { scenario: 'Unary minus inside parentheses', hint: 'Inside a fresh group result is 0, so "-2" is 0 − 2.', args: ['1-(     -2)'], expected: 3 },
    { scenario: 'Multi-digit at the end', hint: 'The last number must be added after the loop — forgetting it drops 123.', args: ['10 + 123'], expected: 133 },
    { scenario: '32-bit maximum', hint: 'A single large number at the 32-bit limit; accumulate digits without losing precision.', args: ['2147483647'], expected: 2147483647 },
    { scenario: 'Nested subtractions', hint: 'Signs flip at every level — popping sign and result in the wrong order at ")" gives a wrong answer.', args: ['10 - (2 - (3 - 4))'], expected: 7 },
    { scenario: 'Group with zeros', hint: 'Zeros and empty-looking groups still need correct sign handling.', args: ['0 - (0) + (0 - 0)'], expected: 0 },
    { scenario: 'Deep nesting (depth 10^5)', hint: 'A recursive parser overflows the call stack here — keep the saved contexts on an explicit stack.', argsGen: '() => [\'(\'.repeat(100000) + \'1\' + \')\'.repeat(100000)]', expected: 1, timeLimitMs: 1000 },
    { scenario: 'Long flat expression (n ≈ 3·10^5)', hint: 'Re-scanning or rebuilding the string per operator is quadratic; one left-to-right pass is O(n).', argsGen: '() => { const p = []; for (let i = 0; i < 37500; i++) p.push(i % 3 === 0 ? \'- (12 - 3)\' : \'+ 7\'); return [\'1 \' + p.join(\' \')]; }', expected: 62501, timeLimitMs: 1000 },
    { scenario: 'Many nested groups (n ≈ 3·10^5)', hint: 'Thousands of nested groups with signs — repeatedly reducing the innermost group is O(n²).', argsGen: '() => { let s = \'\'; for (let i = 0; i < 25000; i++) s += (i % 2 ? \'-\' : \'+\') + \'(\' + (i % 10) + \' \'; s += \'+ 1\'; for (let i = 0; i < 25000; i++) s += \')\'; return [\'0\' + s]; }', expected: 1, timeLimitMs: 1000 },
  ],
  solution: {
    code: `function calculate(s) {
  const stack = [];
  let result = 0;   // value of the current (innermost) group so far
  let sign = 1;     // sign in front of the number being read
  let num = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch >= '0' && ch <= '9') {
      num = num * 10 + (ch.charCodeAt(0) - 48);
    } else if (ch === '+' || ch === '-') {
      result += sign * num;
      num = 0;
      sign = ch === '+' ? 1 : -1;
    } else if (ch === '(') {
      stack.push(result, sign);   // save the outer context
      result = 0;
      sign = 1;
    } else if (ch === ')') {
      result += sign * num;       // finish the inner group
      num = 0;
      const outerSign = stack.pop();
      const outerResult = stack.pop();
      result = outerResult + outerSign * result;
    }
    // spaces are ignored
  }
  return result + sign * num;
}`,
  },
  dryRun: {
    columns: ['ch', 'result', 'sign', 'num', 'stack'],
    rows: [
      ['-', '0', '-1', '0', '[]'],
      ['(', '0', '1', '0', '[0, -1]'],
      ['3', '0', '1', '3', '[0, -1]'],
      ['+', '3', '1', '0', '[0, -1]'],
      ['(', '0', '1', '0', '[0, -1, 3, 1]'],
      ['4 + 5', '4', '1', '5', '[0, -1, 3, 1]'],
      [')', '3 + 1·9 = 12', '1', '0', '[0, -1]'],
      [')', '0 + (−1)·12 = −12', '1', '0', '[]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(depth of nesting)', explanation: 'One pass; two stack entries per open parenthesis.' },
  alternative: {
    title: 'Sign-only stack',
    md: 'Keep a stack of the effective sign of each open group (starting with [1]). At "(" push currentSign × top; at ")" pop. Each number is added with sign × top. Avoids saving results.',
    code: `function calculate(s) {
  const signs = [1];
  let sign = 1, res = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch >= '0' && ch <= '9') {
      let num = 0;
      while (i < s.length && s[i] >= '0' && s[i] <= '9') num = num * 10 + (s.charCodeAt(i++) - 48);
      i--;
      res += sign * num;
    } else if (ch === '+') sign = signs[signs.length - 1];
    else if (ch === '-') sign = -signs[signs.length - 1];
    else if (ch === '(') signs.push(sign);
    else if (ch === ')') signs.pop();
  }
  return res;
}`,
    complexity: 'O(n) time, O(depth) space',
  },
  mistakes: [
    'Forgetting to add the last pending number after the loop.',
    'Popping sign and result in the wrong order at ")" (the sign was pushed last).',
    'Special-casing unary minus unnecessarily (and incorrectly) instead of relying on result = 0.',
    'Using recursion without considering very deep nesting.',
  ],
};
