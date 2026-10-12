export default {
  id: 'remove-k-digits',
  title: 'Remove K Digits',
  difficulty: 'Medium',
  order: 8,
  pattern: 'monotonic-stack-next-greater',
  tags: ['string', 'greedy', 'monotonic stack'],
  source: { platform: 'LeetCode', number: 402, url: 'https://leetcode.com/problems/remove-k-digits/' },

  statement: `\`num\` is a non-negative integer written as a string. Remove exactly \`k\` digits so that the remaining number is as **small** as possible, and return it as a string.

The result must not have leading zeros (except the number "0" itself). If every digit is removed, return "0".`,
  examples: [
    { input: 'num = "1432219", k = 3', output: '"1219"', explanation: 'Remove 4, 3 and 2.' },
    { input: 'num = "10200", k = 1', output: '"200"', explanation: 'Remove the 1; leading zeros are dropped.' },
    { input: 'num = "10", k = 2', output: '"0"' },
  ],
  constraints: ['1 <= k <= num.length <= 10^5', 'num has no leading zeros except for "0" itself'],

  think: `- Numbers with the same length are compared from the **leftmost** digit. Which digit is most important to make small?
- If a digit is bigger than the digit right after it, is it ever good to keep it?
- What if the digits are already non-decreasing (e.g. "12345")?`,
  patternChallenge: {
    options: ['Sort the digits', 'Dynamic programming', 'Greedy + increasing monotonic stack', 'Sliding window'],
    answer: 2,
    explanation: 'Greedy: whenever a digit is larger than the next one, removing it makes the number smaller at the most significant position possible. A stack keeps the kept digits non-decreasing and lets us "take back" earlier digits. Sorting destroys the order.',
  },
  hints: [
    'Scan digits; while k > 0 and the top of the stack is larger than the current digit, pop it (k--). Push the current digit.',
    'If k is still > 0 at the end, remove from the end (the stack is non-decreasing). Strip leading zeros; empty → "0".',
  ],
  approach: `**Brute force:** try all C(n, k) ways to remove digits → exponential.

**Greedy + monotonic stack (O(n)):** the first position where two candidates differ decides which is smaller, so we want the leftmost digits as small as possible. If \`stack.top > d\`, removing the top puts the smaller \`d\` into that more significant position — always an improvement. Keep the stack non-decreasing while removals remain. Leftover removals come off the end (the largest digits). Finally strip leading zeros.`,

  functionName: 'removeKdigits',
  paramNames: ['num', 'k'],
  starterCode: `/**
 * @param {string} num
 * @param {number} k
 * @return {string}
 */
function removeKdigits(num, k) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Remove 4, 3 and 2 — each is bigger than the digit after it.', args: ['1432219', 3], expected: '1219' },
    { scenario: 'Example 2', hint: 'Removing the leading 1 exposes zeros that must be stripped.', args: ['10200', 1], expected: '200' },
    { scenario: 'Example 3', hint: 'Every digit removed — return "0", not an empty string.', args: ['10', 2], expected: '0' },
    { scenario: 'Increasing digits', hint: 'No digit is bigger than the next, so the stack never pops — the leftover k must be cut from the end.', args: ['12345', 2], expected: '123' },
    { scenario: 'Decreasing digits', hint: 'Every new digit pops the previous one.', args: ['54321', 2], expected: '321' },
    { scenario: 'Single digit removed', hint: 'Smallest input: removing the only digit leaves "0".', args: ['9', 1], expected: '0' },
    { scenario: 'Single zero removed', hint: 'num = "0" with k = 1 — the answer is still "0".', args: ['0', 1], expected: '0' },
    { scenario: 'Equal digits', hint: 'Equal digits are not popped (> not >=); leftovers come off the end.', args: ['112', 1], expected: '11' },
    { scenario: 'Zeros after removal', hint: 'After removing 1 the result starts with "00" — strip them but keep the rest.', args: ['100200', 1], expected: '200' },
    { scenario: 'Result is exactly zero', hint: 'Only zeros remain — stripping must leave a single "0".', args: ['10001', 4], expected: '0' },
    { scenario: 'Remove all but one', hint: 'Keep the single smallest possible digit.', args: ['1234567890', 9], expected: '0' },
    { scenario: 'Long number beyond Number', hint: 'Converting to Number loses digits on long inputs — work with the string.', args: ['98765432101234567890', 5], expected: '432101234567890' },
    { scenario: 'Increasing, large (n = 10^5)', hint: 'Re-scanning for a drop on every removal is O(n·k) ≈ 5·10^9 here; one stack pass is O(n).', argsGen: '() => [\'1\' + \'9\'.repeat(99999), 50000]', expected: '1' + '9'.repeat(49999), timeLimitMs: 1000 },
    { scenario: 'High then low half (n = 10^5)', hint: '50000 nines followed by 50000 ones — each removal must be O(1) amortised.', argsGen: '() => [\'9\'.repeat(50000) + \'1\'.repeat(50000), 50000]', expected: '1'.repeat(50000), timeLimitMs: 1000 },
    { scenario: 'Huge zero run (n = 10^5)', hint: 'Removing the leading 1 leaves 99999 zeros — the answer is "0".', argsGen: '() => [\'1\' + \'0\'.repeat(99999), 1]', expected: '0' },
  ],
  solution: {
    code: `function removeKdigits(num, k) {
  const st = [];
  for (const d of num) {
    // A bigger digit before a smaller one is never worth keeping.
    while (k > 0 && st.length && st[st.length - 1] > d) {
      st.pop();
      k--;
    }
    st.push(d);
  }
  while (k > 0) { st.pop(); k--; }       // remaining removals: drop the largest (last) digits
  let i = 0;
  while (i < st.length - 1 && st[i] === '0') i++; // strip leading zeros, keep at least one digit
  const res = st.slice(i).join('');
  return res === '' ? '0' : res;
}`,
    explanation: 'Comparing single-character strings like "4" > "3" works because digit characters are ordered the same way as their values.',
  },
  dryRun: {
    columns: ['d', 'pops', 'k', 'stack'],
    rows: [
      ['1', '—', '3', '1'],
      ['4', '—', '3', '14'],
      ['3', '4', '2', '13'],
      ['2', '3', '1', '12'],
      ['2', '—', '1', '122'],
      ['1', '2', '0', '121'],
      ['9', '—', '0', '1219'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(n)', explanation: 'Each digit pushed and popped at most once.' },
  alternative: {
    title: 'Repeated scan',
    md: 'k times: remove the first digit that is larger than its successor (or the last digit). Same greedy, O(n·k).',
    complexity: 'O(n·k) time',
  },
  mistakes: [
    'Forgetting to remove leftover k from the end ("12345", k = 2).',
    'Not stripping leading zeros, or stripping the lone "0".',
    'Converting to Number — n can be 10^5 digits.',
  ],
};
