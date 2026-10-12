export default {
  id: 'evaluate-reverse-polish-notation',
  title: 'Evaluate Reverse Polish Notation',
  difficulty: 'Medium',
  order: 3,
  pattern: 'stack-expression-eval',
  tags: ['array', 'stack', 'math'],
  source: { platform: 'LeetCode', number: 150, url: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/' },

  statement: `\`tokens\` is an arithmetic expression written in **Reverse Polish Notation** (postfix): each operator comes **after** its two operands. For example \`["2","1","+","3","*"]\` means \`(2 + 1) * 3\`.

Operators are \`+\`, \`-\`, \`*\`, \`/\`. Integer division rounds **toward zero**. The expression is always valid, there is no division by zero, and every intermediate result fits in a 32-bit integer. Return the value.`,
  examples: [
    { input: 'tokens = ["2","1","+","3","*"]', output: '9' },
    { input: 'tokens = ["4","13","5","/","+"]', output: '6', explanation: '13 / 5 = 2 (rounded toward zero), 4 + 2 = 6.' },
    { input: 'tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]', output: '22' },
  ],
  constraints: ['1 <= tokens.length <= 10^4', 'tokens[i] is an operator or an integer in [-200, 200]'],

  think: `- When an operator arrives, where are its two operands?
- Which operand is popped first — the left or the right one? Why does that matter only for - and /?
- How do you tell the token "-" apart from a negative number like "-11"?`,
  patternChallenge: {
    options: ['Recursion on the middle operator', 'Queue', 'Two pointers', 'Stack of operands'],
    answer: 3,
    explanation: 'In postfix, each operator applies to the two most recent unused values — LIFO. A queue would take the oldest values, which is wrong.',
  },
  hints: [
    'Numbers are pushed. An operator pops b (right operand) first, then a (left), and pushes a op b.',
    'Use Math.trunc(a / b) for division. A token is an operator only if it is exactly one of the four symbols.',
  ],
  approach: `**Stack (O(n)):** scan the tokens. For a number, push \`Number(token)\`. For an operator, \`b = pop()\`, \`a = pop()\`, push the result of \`a op b\`. At the end the single remaining value is the answer. Division uses \`Math.trunc\` so that \`-7 / 2 = -3\`.`,

  functionName: 'evalRPN',
  paramNames: ['tokens'],
  starterCode: `/**
 * @param {string[]} tokens
 * @return {number}
 */
function evalRPN(tokens) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: '(2 + 1) * 3 — each operator applies to the two most recent values.', args: [['2', '1', '+', '3', '*']], expected: 9 },
    { scenario: 'Example 2', hint: '13 / 5 rounds toward zero to 2, then 4 + 2.', args: [['4', '13', '5', '/', '+']], expected: 6 },
    { scenario: 'Example 3', hint: 'A long expression with a negative operand and a division that rounds toward zero.', args: [['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']], expected: 22 },
    { scenario: 'Single number', hint: 'Smallest input: no operators, the value is the token itself.', args: [['42']], expected: 42 },
    { scenario: 'Single negative number', hint: '"-5" is a number, not the minus operator — do not check only the first character.', args: [['-5']], expected: -5 },
    { scenario: 'Negative division truncates', hint: '-7 / 2 must give -3 (toward zero). Math.floor gives -4.', args: [['-7', '2', '/']], expected: -3 },
    { scenario: 'Operand order for minus', hint: 'The first pop is the right operand: 3 5 - is 3 − 5, not 5 − 3.', args: [['3', '5', '-']], expected: -2 },
    { scenario: 'Operand order for divide', hint: 'Swapping the pops computes 2 / 12 = 0 instead of 12 / 2 = 6.', args: [['12', '2', '/']], expected: 6 },
    { scenario: 'Negative operand times', hint: 'A negative literal used as an operand of * and -.', args: [['7', '-2', '*', '3', '-']], expected: -17 },
    { scenario: 'Small quotient is zero', hint: '1 / 3 truncates to 0.', args: [['1', '3', '/']], expected: 0 },
    { scenario: 'Negative quotient toward zero', hint: '-1 / 3 truncates to 0 (JS gives -0, which still equals 0).', args: [['-1', '3', '/', '5', '+']], expected: 5 },
    { scenario: 'Bounds ±200', hint: 'Extreme operand values multiplied and divided.', args: [['200', '-200', '*', '-200', '/']], expected: 200 },
    { scenario: 'Deep stack (n ≈ 10^4)', hint: '5000 numbers are pushed before any operator — the stack must hold them all and unwind right to left.', argsGen: '() => { const t = []; for (let i = 0; i < 5000; i++) t.push(String((i % 401) - 200)); for (let i = 1; i < 5000; i++) t.push(i % 2 ? \'-\' : \'+\'); return [t]; }', expected: 0 },
    { scenario: 'Long mixed expression (n ≈ 10^4)', hint: 'All four operators over a 10^4-token expression, including negative divisions.', argsGen: '() => { let s = 99, v = 7; const r = () => (s = (s * 1103515245 + 12345) % 2147483648); const t = [\'7\']; while (t.length < 9999) { const x = (r() % 401) - 200; const o = r() % 4; let op; if (o === 3 && x !== 0) { op = \'/\'; v = Math.trunc(v / x); } else if (o === 2 && Math.abs(v * x) < 1e8) { op = \'*\'; v = v * x; } else if (o === 1) { op = \'-\'; v = v - x; } else { op = \'+\'; v = v + x; } t.push(String(x), op); } return [t]; }', expected: 1833 },
  ],
  solution: {
    code: `function evalRPN(tokens) {
  const st = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = st.pop();            // right operand (pushed last)
      const a = st.pop();            // left operand
      if (t === '+') st.push(a + b);
      else if (t === '-') st.push(a - b);
      else if (t === '*') st.push(a * b);
      else st.push(Math.trunc(a / b)); // round toward zero
    } else {
      st.push(Number(t));
    }
  }
  return st.pop();
}`,
  },
  dryRun: {
    columns: ['token', 'stack'],
    rows: [
      ['4', '[4]'],
      ['13', '[4,13]'],
      ['5', '[4,13,5]'],
      ['/', '[4,2]  (13/5 → 2)'],
      ['+', '[6]'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One push/pop per token; the stack holds at most about n/2 numbers.' },
  alternative: {
    title: 'Operator lookup table',
    md: 'Replace the if-chain with `const ops = { "+": (a, b) => a + b, …, "/": (a, b) => Math.trunc(a / b) }` and check `t in ops`. Cleaner when there are many operators.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Popping a before b (computes b − a and b / a).',
    'Math.floor instead of Math.trunc — wrong for negative quotients.',
    'Treating "-11" as the minus operator by checking only the first character.',
    'Math.trunc(-1 / 3) is -0, which compares equal to 0 with === (only Object.is tells them apart).',
  ],
};
