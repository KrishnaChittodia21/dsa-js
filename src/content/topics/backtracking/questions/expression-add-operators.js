export default {
  id: 'expression-add-operators',
  title: 'Expression Add Operators',
  difficulty: 'Hard',
  order: 3,
  pattern: 'backtracking-string-construction',
  tags: ['backtracking', 'string', 'math'],
  source: { platform: 'LeetCode', number: 282, url: 'https://leetcode.com/problems/expression-add-operators/' },

  statement: `You are given a string \`num\` of digits and an integer \`target\`. Insert the binary operators \`'+'\`, \`'-'\` and \`'*'\` between the digits (or nothing, which glues digits into a longer number) so that the resulting expression **evaluates to \`target\`** with normal precedence (\`*\` before \`+\`/\`-\`).

Return **all** such expressions, in any order.

- Operands may not have **leading zeros**: \`"05"\` is not allowed, but a single \`"0"\` is.
- You may not put an operator before the first digit (no unary minus).`,
  examples: [
    { input: 'num = "123", target = 6', output: '["1*2*3","1+2+3"]' },
    { input: 'num = "232", target = 8', output: '["2*3+2","2+3*2"]' },
    { input: 'num = "3456237490", target = 9191', output: '[]' },
    { input: 'num = "105", target = 5', output: '["1*0+5","10-5"]', explanation: '"1*05" is invalid because of the leading zero.' },
  ],
  constraints: ['1 <= num.length <= 10', 'num consists only of digits', '-2^31 <= target <= 2^31 - 1'],

  think: `- At each step, what are the choices? (How long is the next operand, and which operator precedes it?)
- If you only keep the running value, how would you handle "1+2" followed by "*3"? What extra piece of information would let you fix the value?
- Where do leading zeros sneak in?`,
  patternChallenge: {
    options: ['Stack-based expression evaluation', 'Backtracking — Building expressions while carrying value and last operand', 'Dynamic Programming on prefixes', 'Divide and conquer on operators'],
    answer: 1,
    explanation: 'We must list every expression → backtracking over (next operand, operator). The twist is evaluating as we go: carrying `value` and `last` lets us apply `*` precedence in O(1) instead of re-parsing each finished expression with a stack. DP cannot list expressions, and splitting by operators ("Different Ways to Add Parentheses") is a different problem — here there are no parentheses.',
  },
  hints: [
    '`dfs(pos, expr, value, last)`: choose the next operand `num.slice(pos, end + 1)` for every end. Stop extending when the operand would start with "0" and have more than one digit.',
    'For `+x`: value + x, last = x. For `-x`: value − x, last = −x. For `*x`: value − last + last·x, last = last·x. At `pos === num.length`, record expr if value === target.',
  ],
  approach: `**Brute force:** 4^(n−1) ways to fill the gaps (nothing, +, −, *). Build every string, reject leading zeros, and evaluate each with a precedence parser → O(n · 4ⁿ) with a heavy constant.

**Backtracking with running evaluation:**
- The first operand is placed without an operator.
- For each later operand \`x\` (all lengths from \`pos\`), try the three operators.
- Keep \`value\` (value of the expression so far) and \`last\` (the last *term* that was added, with its sign). Multiplication must bind to that last term only:

\`\`\`text
"1+2" value 3, last 2   --"*3"-->   value = 3 − 2 + 2·3 = 7, last = 6
"1+2*3" value 7, last 6 --"*4"-->   value = 7 − 6 + 6·4 = 25, last = 24   (= 1 + 24 ✓)
\`\`\`

- Leading zeros: if \`num[pos] === '0'\`, the only allowed operand starting there is "0" itself.

Since each call keeps its own \`expr\` string and numbers, there is no explicit undo.`,

  functionName: 'addOperators',
  paramNames: ['num', 'target'],
  starterCode: `/**
 * @param {string} num
 * @param {number} target
 * @return {string[]}
 */
function addOperators(num, target) {
  
}
`,
  compare: 'unordered',
  tests: [
    { scenario: 'Example 1', hint: 'Both all-plus and all-times reach 6.', args: ["123",6], expected: ["1+2+3","1*2*3"] },
    { scenario: 'Example 2', hint: '"2*3+2" needs * to bind tighter than +.', args: ["232",8], expected: ["2*3+2","2+3*2"] },
    { scenario: 'Example 3', hint: 'No expression reaches the target — return [].', args: ["3456237490",9191], expected: [] },
    { scenario: 'Leading zero operand', hint: '"1*05" is invalid: a multi-digit operand cannot start with 0, but a lone "0" is fine.', args: ["105",5], expected: ["1*0+5","10-5"] },
    { scenario: 'All zeros', hint: '"00" as one operand is invalid; "0+0", "0-0", "0*0" are all valid.', args: ["00",0], expected: ["0+0","0-0","0*0"] },
    { scenario: 'Single digit', hint: 'With one digit there is no operator — the number itself is the only expression.', args: ["1",1], expected: ["1"] },
    { scenario: 'Single digit, no match', hint: 'One digit that differs from the target gives [].', args: ["5",3], expected: [] },
    { scenario: 'Whole string as one number', hint: 'Using no operators at all is allowed: "123" equals 123.', args: ["123",123], expected: ["123"] },
    { scenario: 'Multiplication precedence', hint: 'If you apply * to the running value instead of undoing the last operand, "1+2*3" evaluates to 9 instead of 7.', args: ["123",7], expected: ["1+2*3"] },
    { scenario: 'Negative target', hint: 'Subtraction must carry a negative last operand (last = −x) so a following * stays correct.', args: ["1234",-22], expected: ["12-34"] },
    { scenario: 'Subtraction then multiply', hint: '"9-2*3" = 3: after "−2", multiplying by 3 must change the value by −2·3 + 2.', args: ["923",3], expected: ["9-2*3"] },
    { scenario: 'Zero inside operands', hint: 'Zeros may stand alone ("2+0+2+0") but cannot lead a multi-digit operand like "02".', args: ["2020",4], expected: ["2+0+2+0","2-0+2+0","2+0+2-0","2-0+2-0"] },
    { scenario: 'Huge operand, no match', hint: '"2147483648" overflows a 32-bit int — use plain JS numbers and do not crash.', args: ["2147483648",-2147483648], expected: [] },
    { scenario: 'Max length (10 digits)', hint: '4^9 operator placements. Evaluate incrementally; re-parsing every full string is slow.', args: ["1234567891",2000], expected: ["1-2+34*56+7+89+1","12*34*5-6*7-8+9+1","12*34*5+6-7*8+9+1","123*4*5-6*78+9-1","1+2345-6*7*8-9-1","12+345*6+7-89*1","1-2+345*6-78+9*1","1*2345-6*7*8-9*1"] },
    { scenario: 'Max length, no operators', hint: 'The whole 10-digit string is itself an answer — allow the first operand to span every digit.', args: ["1234567890",1234567890], expected: ["1234567890"] },
  ],

  solution: {
    code: `function addOperators(num, target) {
  const result = [];

  // pos: next digit to use; expr: expression so far;
  // value: its value; last: the last signed term (needed to undo it for '*')
  function backtrack(pos, expr, value, last) {
    if (pos === num.length) {
      if (value === target) result.push(expr);
      return;
    }
    for (let end = pos; end < num.length; end++) {
      if (end > pos && num[pos] === '0') break;       // no leading zeros ("05")
      const piece = num.slice(pos, end + 1);
      const x = Number(piece);
      if (pos === 0) {
        backtrack(end + 1, piece, x, x);               // first operand: no operator
      } else {
        backtrack(end + 1, expr + '+' + piece, value + x, x);
        backtrack(end + 1, expr + '-' + piece, value - x, -x);
        backtrack(end + 1, expr + '*' + piece, value - last + last * x, last * x);
      }
    }
  }

  backtrack(0, '', 0, 0);
  return result;
}`,
    explanation: 'All operands together use at most 10 digits, so every intermediate value is below 10¹⁰ in magnitude — far inside the exact integer range of JS numbers (2⁵³ ≈ 9·10¹⁵). No BigInt needed.',
  },
  dryRun: {
    columns: ['expr', 'value', 'last', 'next step'],
    rows: [
      ['"1"', '1', '1', '+2 → "1+2" (3, 2);  *2 → "1*2" (2, 2)'],
      ['"1+2"', '3', '2', '+3 → 6 ✓ record "1+2+3"'],
      ['"1+2"', '3', '2', '*3 → 3 − 2 + 6 = 7 ✗'],
      ['"1*2"', '2', '2', '*3 → 2 − 2 + 6 = 6 ✓ record "1*2*3"'],
      ['"12"', '12', '12', '+3 = 15, −3 = 9, *3 = 36 ✗'],
    ],
  },
  complexity: { time: 'O(n · 4ⁿ)', space: 'O(n) recursion depth', explanation: 'Each of the n − 1 gaps has 4 options (none, +, −, *) → at most 4^(n−1) leaves; building/copying expression strings costs O(n).' },
  alternative: {
    title: 'Character array instead of string concatenation',
    md: 'Keep a single char array and a length pointer; write the operator and digits into it and "undo" by resetting the length. Avoids creating many intermediate strings — the classic mutable-path backtracking form.',
    complexity: 'Same asymptotic complexity, fewer allocations',
  },
  mistakes: [
    'Handling `*` as `value * x` — ignores precedence ("1+2*3" would give 9).',
    'Forgetting the sign in `last` for subtraction (`last = −x`).',
    'Allowing multi-digit operands with a leading zero.',
    'Putting an operator before the first operand.',
  ],
};
