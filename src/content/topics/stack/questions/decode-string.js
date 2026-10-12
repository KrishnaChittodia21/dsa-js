export default {
  id: 'decode-string',
  title: 'Decode String',
  difficulty: 'Medium',
  order: 7,
  pattern: 'stack-expression-eval',
  tags: ['string', 'stack', 'recursion'],
  source: { platform: 'LeetCode', number: 394, url: 'https://leetcode.com/problems/decode-string/' },

  statement: `A string is encoded with the rule \`k[text]\`, meaning \`text\` repeated exactly \`k\` times (k is a positive integer, possibly multi-digit). Encodings can be **nested**, e.g. \`3[a2[c]]\`.

The input is always well-formed, digits only appear as repeat counts, and the decoded string has length at most 10^5. Return the decoded string.`,
  examples: [
    { input: 's = "3[a]2[bc]"', output: '"aaabcbc"' },
    { input: 's = "3[a2[c]]"', output: '"accaccacc"' },
    { input: 's = "2[abc]3[cd]ef"', output: '"abcabccdcdcdef"' },
  ],
  constraints: ['1 <= s.length <= 30', 's consists of lowercase letters, digits and []', 'Repeat counts are in [1, 300]'],

  think: `- When you meet \`[\`, you start a **new inner string** — but you must remember the outer string and the repeat count. Where?
- When you meet \`]\`, what do you combine?
- How do you read a count like "12"?`,
  patternChallenge: {
    options: ['Two pointers', 'Stack of (outer string, count) contexts', 'Sliding window', 'Hash map'],
    answer: 1,
    explanation: 'Brackets are nested, and the innermost one must be finished first — LIFO. At "[" push the current context, at "]" pop it and combine. (Recursion is the same idea using the call stack.)',
  },
  hints: [
    'Keep `cur` (the string being built) and `num` (the count being read). On "[" push [cur, num] and reset both.',
    'On "]" pop [prev, k] and set cur = prev + cur.repeat(k). Letters are appended to cur; digits update num = num * 10 + digit.',
  ],
  approach: `**Brute force:** repeatedly find an innermost \`k[...]\` with no brackets inside, replace it by its expansion, and repeat — correct but re-scans the string many times.

**Context stack (O(output)):** read left to right.
- digit → \`num = num * 10 + d\`;
- \`[\` → push \`[cur, num]\`, then \`cur = ''\`, \`num = 0\`;
- \`]\` → \`[prev, k] = pop()\`, \`cur = prev + cur.repeat(k)\`;
- letter → \`cur += ch\`.
The answer is \`cur\`.`,

  functionName: 'decodeString',
  paramNames: ['s'],
  starterCode: `/**
 * @param {string} s
 * @return {string}
 */
function decodeString(s) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Two encodings side by side: "aaa" then "bcbc".', args: ['3[a]2[bc]'], expected: 'aaabcbc' },
    { scenario: 'Example 2', hint: 'Nested: decode the inner 2[c] first, then repeat "acc" three times.', args: ['3[a2[c]]'], expected: 'accaccacc' },
    { scenario: 'Example 3', hint: 'Plain letters after the last encoding must be kept.', args: ['2[abc]3[cd]ef'], expected: 'abcabccdcdcdef' },
    { scenario: 'No encoding at all', hint: 'Only letters — return them unchanged.', args: ['abc'], expected: 'abc' },
    { scenario: 'Single letter', hint: 'Smallest input.', args: ['a'], expected: 'a' },
    { scenario: 'Multi-digit count', hint: 'Reading only the last digit turns 10[a] into 0 or 1 copies — accumulate num = num·10 + digit.', args: ['10[a]'], expected: 'aaaaaaaaaa' },
    { scenario: 'Maximum count 300', hint: 'A three-digit count; the count must be fully parsed before "[".', args: ['300[ab]'], expected: 'ab'.repeat(300) },
    { scenario: 'Deep nesting', hint: 'Each level wraps the previous one — the saved prefix must be restored in order at every "]".', args: ['2[a2[b2[c]]]'], expected: 'abccbccabccbcc' },
    { scenario: 'Count of one', hint: '1[y] is just "y"; letters before and after stay in place.', args: ['x1[y]z'], expected: 'xyz' },
    { scenario: 'Prefix before nested group', hint: 'Concatenate as prefix + inner.repeat(k); reversing the order scrambles the result.', args: ['ab2[cd3[e]]'], expected: 'abcdeeecdeee' },
    { scenario: 'Counts reset between groups', hint: 'If num is not reset after "[", the second count becomes 21 instead of 1.', args: ['2[a]1[b]'], expected: 'aab' },
    { scenario: 'Sibling groups inside a group', hint: 'Two groups nested at the same level inside an outer repeat.', args: ['2[2[a]3[b]c]'], expected: 'aabbbcaabbbc' },
    { scenario: 'Complex mix', hint: 'Mixed nesting, multiple siblings and trailing letters.', args: ['3[z]2[2[y]pq4[2[jk]e1[f]]]ef'], expected: 'zzzyypqjkjkefjkjkefjkjkefjkjkefyypqjkjkefjkjkefjkjkefjkjkefef' },
    { scenario: 'Large output (~10^5 chars)', hint: 'Nested counts multiply: the decoded string is 90000 characters long.', args: ['300[300[a]]'], expected: 'a'.repeat(90000) },
  ],
  solution: {
    code: `function decodeString(s) {
  const stack = [];          // saved contexts: [stringBefore, repeatCount]
  let cur = '';
  let num = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      num = num * 10 + (ch.charCodeAt(0) - 48);   // multi-digit counts
    } else if (ch === '[') {
      stack.push([cur, num]);
      cur = '';
      num = 0;
    } else if (ch === ']') {
      const [prev, k] = stack.pop();
      cur = prev + cur.repeat(k);
    } else {
      cur += ch;
    }
  }
  return cur;
}`,
  },
  dryRun: {
    columns: ['ch', 'cur', 'num', 'stack'],
    rows: [
      ['3', '""', '3', '[]'],
      ['[', '""', '0', '[["",3]]'],
      ['a', '"a"', '0', '[["",3]]'],
      ['2', '"a"', '2', '[["",3]]'],
      ['[', '""', '0', '[["",3],["a",2]]'],
      ['c', '"c"', '0', '…'],
      [']', '"a"+"cc" = "acc"', '0', '[["",3]]'],
      [']', '""+"acc"×3 = "accaccacc"', '0', '[]'],
    ],
  },
  complexity: { time: 'O(output length)', space: 'O(output length)', explanation: 'Each character of the result is produced by repeat/concat; the stack depth is the nesting depth.' },
  alternative: {
    title: 'Recursive descent',
    md: 'A function parse(i) reads letters and counts until it hits "]", recursing on "[" and returning [string, nextIndex]. Same complexity; uses the call stack instead of an explicit one.',
    complexity: 'O(output) time, O(depth) call stack',
  },
  mistakes: [
    'Reading only single-digit counts ("10[a]").',
    'Forgetting to reset num after pushing it.',
    'Concatenating in the wrong order: it is prev + cur.repeat(k), not cur.repeat(k) + prev.',
  ],
};
