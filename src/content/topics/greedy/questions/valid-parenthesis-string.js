export default {
  id: 'valid-parenthesis-string',
  title: 'Valid Parenthesis String',
  difficulty: 'Medium',
  order: 8,
  pattern: 'greedy-local-constraints',
  tags: ['string', 'greedy', 'stack', 'dynamic programming'],
  source: { platform: 'LeetCode', number: 678, url: 'https://leetcode.com/problems/valid-parenthesis-string/' },

  statement: `A string \`s\` contains only \`'('\`, \`')'\` and \`'*'\`. Each \`'*'\` may be treated as \`'('\`, as \`')'\`, or as an empty string.

Return \`true\` if some choice for the stars makes \`s\` a valid bracket sequence (every \`(\` is closed by a later \`)\`, and no \`)\` appears without a matching earlier \`(\`).`,
  examples: [
    { input: 's = "()"', output: 'true' },
    { input: 's = "(*)"', output: 'true' },
    { input: 's = "(*))"', output: 'true', explanation: 'Treat * as "(".' },
  ],
  constraints: ['1 <= s.length <= 100', "s[i] is '(', ')' or '*'"],

  think: `- Without stars, a single counter of open brackets decides validity. What does a star do to that counter?
- Instead of one counter value, could you track the whole range of possible values?
- When is the range hopeless? When can you just discard part of it?`,
  patternChallenge: {
    options: ['Backtracking over every star', 'Greedy — Local Rules & Two Passes (range of open counts)', 'Sliding Window', 'Monotonic Stack'],
    answer: 1,
    explanation: 'Each star turns one counter value into three. The set of possible counts is always a contiguous range [lo, hi], so two integers replace 3ⁿ branches. Backtracking is correct but exponential.',
  },
  hints: [
    'Track lo = fewest possible open brackets, hi = most possible. "(" → both +1, ")" → both −1, "*" → lo −1, hi +1.',
    'If hi < 0 return false. Keep lo = max(lo, 0). At the end, valid iff lo === 0.',
  ],
  approach: `**Brute force:** try all 3^(#stars) interpretations → exponential. DP over (index, open count) → O(n²).

**Greedy range:** every reachable open-count after reading a prefix forms a contiguous range [lo, hi]:
- '(' shifts it up, ')' shifts it down, '*' widens it by 1 on both sides.
- hi < 0: even the most generous interpretation has closed too many → false.
- lo < 0: those interpretations are invalid; drop them by clamping lo to 0 (a different earlier star choice gives 0 instead).
- End: need 0 in [lo, hi] → lo === 0.`,

  functionName: 'checkValidString',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function checkValidString(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A plain matched pair.', args: ['()'], expected: true },
    { scenario: 'Example 2', hint: 'Treat the star as empty.', args: ['(*)'], expected: true },
    { scenario: 'Example 3', hint: 'Treat the star as "(" to match the extra ")".', args: ['(*))'], expected: true },
    { scenario: 'Single star', hint: 'A lone star can be the empty string — valid.', args: ['*'], expected: true },
    { scenario: 'Single open bracket', hint: 'One "(" can never be closed.', args: ['('], expected: false },
    { scenario: 'Close before open', hint: ')( fails immediately: hi drops below 0 at the first character.', args: [')('], expected: false },
    { scenario: 'Unclosed opens', hint: 'Two "(" with nothing to close them: lo ends at 2.', args: ['(('], expected: false },
    { scenario: 'Clamp lo at zero', hint: 'In "(**)" the second star pushes lo below 0; returning false there is wrong — clamp lo to 0 and keep going.', args: ['(**)'], expected: true },
    { scenario: 'Check lo, not hi, at end', hint: 'For "(*" the range ends as [0, 2]: hi is not 0, but treating the star as ")" works. Test lo === 0.', args: ['(*'], expected: true },
    { scenario: 'Star before open is useless', hint: 'A star can only close a "(" that comes BEFORE it; counting stars vs. unmatched "(" ignores order.', args: ['*('], expected: false },
    { scenario: 'Stars all before opens', hint: 'Same idea, longer: no star sits after the "("s.', args: ['**(('], expected: false },
    { scenario: 'Star closes a ")" later', hint: 'Stars before a ")" act as "(".', args: ['*)*)'], expected: true },
    { scenario: 'Long mixed string', hint: 'Many brackets and stars: track only the [lo, hi] range of possible open counts.', args: ['(((((*(()((((*((**(((()()*)()()()*((((**)())*)*)))))))(())(()))())((*()()(((()((()*(())*(()**)()(())'], expected: false },
    { scenario: 'Maximum length, many stars', hint: 'Trying all 3^stars interpretations is hopeless at length 100; the greedy range check is O(n).', argsGen: '() => [ "(".repeat(30) + "*".repeat(40) + ")".repeat(10) + "*".repeat(20) ]', expected: true, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function checkValidString(s) {
  let lo = 0; // fewest open brackets possible
  let hi = 0; // most open brackets possible
  for (const ch of s) {
    if (ch === '(') { lo++; hi++; }
    else if (ch === ')') { lo--; hi--; }
    else { lo--; hi++; }            // '*' could be ')', '' or '('
    if (hi < 0) return false;        // too many ')' in every interpretation
    lo = Math.max(lo, 0);            // discard interpretations that went negative
  }
  return lo === 0;
}`,
  },
  dryRun: {
    columns: ['ch', 'lo', 'hi', 'note'],
    rows: [
      ['(', '1', '1', ''],
      ['*', '0', '2', ''],
      [')', '0 (clamped from −1)', '1', ''],
      [')', '0 (clamped)', '0', ''],
    ],
    note: 's = "(*))" → lo = 0 → true.',
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'One pass with two counters.' },
  alternative: {
    title: 'Two stacks of indices',
    md: 'Push indices of "(" and "*" on two stacks. On ")", pop an "(" if possible, else a "*", else fail. At the end, match remaining "(" with "*" that come **after** them.',
    code: `function checkValidString(s) {
  const open = [], star = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') open.push(i);
    else if (s[i] === '*') star.push(i);
    else if (open.length) open.pop();
    else if (star.length) star.pop();
    else return false;
  }
  while (open.length && star.length) {
    if (open.pop() > star.pop()) return false; // star before "(" cannot close it
  }
  return open.length === 0;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Returning false when lo < 0 (lo is just the optimistic-closing bound; clamp it).',
    'Checking hi === 0 at the end instead of lo === 0.',
    'In the stack version, ignoring the order of leftover "(" and "*".',
  ],
};
