export default {
  id: 'baseball-game',
  title: 'Baseball Game',
  difficulty: 'Easy',
  order: 2,
  pattern: 'stack-expression-eval',
  tags: ['array', 'stack', 'simulation'],
  source: { platform: 'LeetCode', number: 682, url: 'https://leetcode.com/problems/baseball-game/' },

  statement: `You keep score for a game with strange rules. You receive a list of operations \`ops\`; process them in order on an initially empty record:

- an integer \`x\` → record a new score \`x\`;
- \`"+"\` → record a new score equal to the sum of the **previous two** scores;
- \`"D"\` → record a new score equal to **double** the previous score;
- \`"C"\` → **invalidate** (remove) the previous score.

Return the sum of all scores left on the record. Every operation is guaranteed to be valid.`,
  examples: [
    { input: 'ops = ["5","2","C","D","+"]', output: '30', explanation: 'Record: [5] → [5,2] → [5] → [5,10] → [5,10,15]. Sum 30.' },
    { input: 'ops = ["5","-2","4","C","D","9","+","+"]', output: '27' },
    { input: 'ops = ["1","C"]', output: '0' },
  ],
  constraints: ['1 <= ops.length <= 1000', 'ops[i] is "C", "D", "+" or an integer in [-3·10^4, 3·10^4]', '"+" always has two previous scores; "C" and "D" at least one'],

  think: `- Every operation only looks at the **most recent** scores. Which structure gives you the most recent item in O(1)?
- What does "C" do to that structure?`,
  patternChallenge: {
    options: ['Queue', 'Hash map', 'Sorting', 'Stack'],
    answer: 3,
    explanation: 'All operations touch the latest one or two records, and "C" removes the latest — last in, first out. A queue would expose the oldest record instead.',
  },
  hints: [
    'Use an array as a stack of valid scores.',
    '"+" reads st[len-1] + st[len-2], "D" reads 2 × st[len-1], "C" pops. Sum the stack at the end.',
  ],
  approach: `**Stack simulation (O(n)):** keep the valid scores in a stack. Numbers push, "C" pops, "D" pushes double the top, "+" pushes the sum of the top two (without removing them). The answer is the sum of the stack.`,

  functionName: 'calPoints',
  paramNames: ['ops'],
  starterCode: `/**
 * @param {string[]} ops
 * @return {number}
 */
function calPoints(ops) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Record goes [5] → [5,2] → [5] → [5,10] → [5,10,15].', args: [['5', '2', 'C', 'D', '+']], expected: 30 },
    { scenario: 'Example 2', hint: 'Mixes a negative score, "C", "D" and two "+" in a row.', args: [['5', '-2', '4', 'C', 'D', '9', '+', '+']], expected: 27 },
    { scenario: 'Example 3', hint: 'The only score is cancelled, so the record is empty and the sum is 0.', args: [['1', 'C']], expected: 0 },
    { scenario: 'Single score', hint: 'Smallest input: one integer, sum is that integer.', args: [['7']], expected: 7 },
    { scenario: 'Double a negative', hint: '"-3" starts with "-" — a digit check on the first character misparses it. Use Number(op).', args: [['-3', 'D']], expected: -9 },
    { scenario: '"+" keeps both previous scores', hint: '"+" must not pop the two scores it adds — they stay on the record.', args: [['1', '2', '+', 'C', '+']], expected: 6 },
    { scenario: 'Cancel everything', hint: 'Every score is removed again; the record ends empty.', args: [['3', 'D', 'D', 'C', 'C', 'C']], expected: 0 },
    { scenario: 'Cancel after "+"', hint: 'A running total alone cannot undo a "+" score — you need the record to know what "C" removes.', args: [['10', '20', '+', 'C', 'C', '5', '+']], expected: 30 },
    { scenario: 'Zeros', hint: 'Scores of 0 are real records; "+" and "D" on them stay 0.', args: [['0', '0', '+', 'D', '5', '+']], expected: 10 },
    { scenario: 'Extreme values', hint: 'Scores at ±3·10^4 bounds; doubling and adding produce larger numbers.', args: [['30000', 'D', '+', '-30000', 'D']], expected: 90000 },
    { scenario: 'All negative scores', hint: 'Every score is negative, so the total is negative — do not clamp at 0.', args: [['-1', '-2', '+', 'D', '-5']], expected: -17 },
    { scenario: 'Max length (1000 ops)', hint: 'A long mix of every operation type.', argsGen: '() => { const o = []; let s = 7; let n = 0; for (let i = 0; i < 1000; i++) { s = (s * 1103515245 + 12345) % 2147483648; const r = s % 5; if (n >= 2 && r === 0) { o.push(\'+\'); n++; } else if (n >= 1 && r === 1) { o.push(\'D\'); n++; } else if (n >= 1 && r === 2) { o.push(\'C\'); n--; } else { o.push(String((s % 61) - 30)); n++; } } return [o]; }', expected: 15710 },
  ],
  solution: {
    code: `function calPoints(ops) {
  const st = [];
  for (const op of ops) {
    const n = st.length;
    if (op === '+') st.push(st[n - 1] + st[n - 2]);
    else if (op === 'D') st.push(2 * st[n - 1]);
    else if (op === 'C') st.pop();
    else st.push(Number(op));
  }
  let sum = 0;
  for (const x of st) sum += x;
  return sum;
}`,
  },
  dryRun: {
    columns: ['op', 'stack'],
    rows: [
      ['5', '[5]'],
      ['-2', '[5,-2]'],
      ['4', '[5,-2,4]'],
      ['C', '[5,-2]'],
      ['D', '[5,-2,-4]'],
      ['9', '[5,-2,-4,9]'],
      ['+', '[5,-2,-4,9,5]'],
      ['+', '[5,-2,-4,9,5,14]  sum 27'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'One O(1) action per operation; the stack may hold every score.' },
  alternative: {
    title: 'Maintain the running sum',
    md: 'Update a running total on each push (+value) and pop (−value) to avoid the final loop. Same complexity.',
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Popping the two previous scores for "+" — they must stay on the record.',
    'Parsing "-2" with a digit check on the first character (it starts with "-"). Use Number(op).',
    'Keeping only a running total — "C" then cannot know what to subtract.',
  ],
};
