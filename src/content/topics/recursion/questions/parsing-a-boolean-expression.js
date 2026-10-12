export default {
  id: 'parsing-a-boolean-expression',
  title: 'Parsing A Boolean Expression',
  difficulty: 'Hard',
  order: 1,
  pattern: 'recursion-descent-parsing',
  tags: ['recursion', 'string', 'parsing', 'stack'],
  source: { platform: 'LeetCode', number: 1106, url: 'https://leetcode.com/problems/parsing-a-boolean-expression/' },

  statement: `A boolean expression is one of:
- \`'t'\` — true
- \`'f'\` — false
- \`'!(e)'\` — logical NOT of the inner expression \`e\`
- \`'&(e1,e2,...,en)'\` — logical AND of one or more inner expressions
- \`'|(e1,e2,...,en)'\` — logical OR of one or more inner expressions

Expressions can be nested to any depth. Given a valid expression string, return its value as a boolean.`,
  examples: [
    { input: 'expression = "&(|(f))"', output: 'false', explanation: '|(f) is f, and &(f) is f.' },
    { input: 'expression = "|(f,f,f,t)"', output: 'true' },
    { input: 'expression = "!(&(f,t))"', output: 'true', explanation: '&(f,t) is f, and !(f) is t.' },
  ],
  constraints: ['1 <= expression.length <= 2 * 10^4', "expression[i] is one of '(', ')', '&', '|', '!', 't', 'f', ','", 'The expression is valid'],

  think: `- The definition is recursive: an expression contains expressions. What does one "level" of parsing look like?
- How do you know where an inner expression ends without searching for the matching parenthesis?
- Copying substrings for every nested call could cost O(n²). How can every call share one position in the string?`,
  patternChallenge: {
    options: ['Recursive descent parsing with a shared cursor', 'Sliding Window', 'Divide & conquer on every operator', 'Binary search'],
    answer: 0,
    explanation: 'The grammar is recursive (expr → op ( expr, expr, … )), so one function per grammar rule that calls itself for each nested expr is the natural fit. A shared index lets each call consume exactly its own characters. (An explicit stack solution is equivalent — that is what the call stack is doing for you.)',
  },
  hints: [
    'Keep an index `i` in a closure. `parse()` reads `s[i]`: if it is `t` or `f`, advance and return. Otherwise it is an operator: skip it and the `(`.',
    'Loop: `values.push(parse())`, then skip a `,` if present, until you see `)`. Skip the `)` and apply the operator to `values`.',
  ],
  approach: `**Brute force:** repeatedly find an innermost \`op(...)\` with no nested parentheses, evaluate it, and replace it in the string by \`t\`/\`f\`. Each pass rebuilds the string → O(n²).

**Recursive descent (optimized):** one function \`parse()\` that parses exactly one expression starting at the shared cursor \`i\` and leaves \`i\` just after it.
1. \`c = s[i++]\`. If \`c\` is \`t\`/\`f\`, return it.
2. Otherwise \`c\` is \`!\`, \`&\` or \`|\`. Skip \`(\`.
3. Repeatedly \`parse()\` a child (the recursive call consumes the whole child, however deep), skipping \`,\` separators, until \`)\`.
4. Skip \`)\` and combine: NOT of the single child, AND/OR of all children.

Every character is consumed exactly once → O(n). The recursion depth equals the nesting depth; for the worst case (≈ 5,000 nested \`!(\`) this is fine in JS, but a stack-based loop is the fallback if nesting could reach 10^5.

**Important:** do not short-circuit the parsing (e.g. \`values.every(parse)\`): you must still consume the remaining children so the cursor stays in sync.`,

  functionName: 'parseBoolExpr',
  paramNames: ['expression'],
  starterCode: `/**
 * @param {string} expression
 * @return {boolean}
 */
function parseBoolExpr(expression) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The OR of a single f is f, and AND of that is f.', args: ["&(|(f))"], expected: false },
    { scenario: 'Example 2', hint: 'One t is enough for OR.', args: ["|(f,f,f,t)"], expected: true },
    { scenario: 'Example 3', hint: 'AND(f, t) is f; NOT flips it to t.', args: ["!(&(f,t))"], expected: true },
    { scenario: 'Single t', hint: 'The smallest input: a bare literal with no operator.', args: ["t"], expected: true },
    { scenario: 'Single f', hint: 'A bare f must return false, not undefined.', args: ["f"], expected: false },
    { scenario: 'Simple NOT', hint: 'NOT has exactly one child.', args: ["!(f)"], expected: true },
    { scenario: 'AND of all true', hint: 'AND is true only when every child is true.', args: ["&(t,t,t)"], expected: true },
    { scenario: 'Short-circuit trap', hint: 'If & returns as soon as it sees f, the cursor is left inside "(f,t)" and the outer | misreads the rest. Always consume every child.', args: ["|(&(f,t),t)"], expected: true },
    { scenario: 'Closing paren skipped', hint: 'After a nested child, the parent must skip its ")" — otherwise its loop ends early and the last child is lost.', args: ["&(|(f,t),!(f),t)"], expected: true },
    { scenario: 'Deeply mixed nesting', hint: 'Several operators nested three levels deep.', args: ["|(&(t,f,t),!(t),&(!(f),|(f,t)))"], expected: true },
    { scenario: 'Chain of NOTs', hint: 'Five NOTs flip t to f. Each level must hand the cursor back correctly.', args: ["!(!(!(!(!(t)))))"], expected: false },
    { scenario: 'Wide AND (length 2·10^4)', hint: 'Ten thousand children: one false at the very end makes the AND false. Scan with one shared cursor, O(n).', argsGen: "() => ['&(' + 't,'.repeat(9998) + 'f)']", expected: false },
    { scenario: 'Deep nesting (999 NOTs)', hint: 'Nesting depth 999 — fine for recursion. An odd number of NOTs turns t into f.', argsGen: "() => ['!('.repeat(999) + 't' + ')'.repeat(999)]", expected: false },
    { scenario: 'Large random expression', hint: 'A long random mix of !, & and | nested up to 9 levels. Every child must be consumed fully before the parent reads the next comma.', argsGen: "() => { let s = 7; const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; const g = (d) => { if (d === 0 || r() < 0.25) return r() < 0.5 ? 't' : 'f'; const op = '!&|'[Math.floor(r() * 3)]; if (op === '!') return '!(' + g(d - 1) + ')'; const k = 1 + Math.floor(r() * 4); const parts = []; for (let i = 0; i < k; i++) parts.push(g(d - 1)); return op + '(' + parts.join(',') + ')'; }; let out = []; let len = 2; while (len < 19000) { const e = g(9); out.push(e); len += e.length + 1; } return ['|(' + out.join(',') + ')']; }", expected: true },
  ],

  solution: {
    code: `function parseBoolExpr(expression) {
  const s = expression;
  let i = 0;                          // shared cursor: every call advances it

  function parse() {
    const c = s[i++];
    if (c === 't') return true;
    if (c === 'f') return false;

    i++;                              // skip '('
    const values = [];
    while (s[i] !== ')') {
      values.push(parse());           // recursive call consumes one whole child
      if (s[i] === ',') i++;          // skip separator
    }
    i++;                              // skip ')'

    if (c === '!') return !values[0];
    if (c === '&') return values.every(Boolean);
    return values.some(Boolean);      // '|'
  }

  return parse();
}`,
    explanation: 'All children are parsed first (so the cursor moves past them) and only then combined. `every`/`some` short-circuit over the already-computed array, which is safe.',
  },
  dryRun: {
    columns: ['call', 'i at start', 'char', 'children parsed', 'returns'],
    rows: [
      ['parse #1', '0', '!', 'parse #2', '!false = true'],
      ['parse #2', '2', '&', 'parse #3, parse #4', 'false && true = false'],
      ['parse #3', '4', 'f', '—', 'false'],
      ['parse #4', '6', 't', '—', 'true'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each character is read once. Stack depth = nesting depth; the values arrays together hold at most O(n) booleans.' },
  alternative: {
    title: 'Explicit stack',
    md: 'Push every character except commas. On `)`, pop values until the `(`, pop the operator, evaluate, push the result. This is exactly what the call stack does in the recursive version, but with no depth limit.',
    code: `function parseBoolExpr(expression) {
  const st = [];
  for (const c of expression) {
    if (c === ',') continue;
    if (c !== ')') { st.push(c); continue; }
    let hasT = false, hasF = false;
    while (st[st.length - 1] !== '(') {
      if (st.pop() === 't') hasT = true; else hasF = true;
    }
    st.pop();                        // '('
    const op = st.pop();
    const v = op === '!' ? hasF : op === '&' ? !hasF : hasT;
    st.push(v ? 't' : 'f');
  }
  return st[0] === 't';
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Short-circuiting while parsing (`&` sees an f and returns early) — the cursor is left inside the expression and the parent misreads the rest.',
    'Passing `s.slice(...)` to each recursive call and searching for the matching parenthesis — O(n²).',
    'Forgetting to skip the closing `)`, so the parent loop stops early.',
  ],
};
