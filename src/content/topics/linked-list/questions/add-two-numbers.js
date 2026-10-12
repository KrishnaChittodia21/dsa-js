export default {
  id: 'add-two-numbers',
  title: 'Add Two Numbers',
  difficulty: 'Medium',
  order: 4,
  pattern: 'linked-list-dummy-node',
  tags: ['linked list', 'math'],
  source: { platform: 'LeetCode', number: 2, url: 'https://leetcode.com/problems/add-two-numbers/' },

  statement: `Two non-negative integers are stored as linked lists of digits in **reverse order** (the head is the ones digit). Each node holds a single digit. Add the two numbers and return the sum as a list in the same reversed format.

Neither number has leading zeros, except the number 0 itself.`,
  examples: [
    { input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7,0,8]', explanation: '342 + 465 = 807.' },
    { input: 'l1 = [0], l2 = [0]', output: '[0]' },
    { input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]', output: '[8,9,9,9,0,0,0,1]' },
  ],
  constraints: ['1 <= nodes in each list <= 100', '0 <= Node.val <= 9', 'No leading zeros'],

  think: `- Why is "reverse order" actually convenient for addition?
- What do you do when one list is shorter?
- What if there is still a carry after both lists end?`,
  patternChallenge: {
    options: ['Convert both to numbers, add, convert back', 'Dummy head builder + carry, walking both lists together', 'Fast & slow pointers', 'Reverse both lists first'],
    answer: 1,
    explanation: 'Digits arrive least-significant first — exactly the order of grade-school addition. Build the result with a dummy/tail and carry the overflow. Converting to numbers overflows: 100 digits exceed Number.MAX_SAFE_INTEGER.',
  },
  hints: [
    'Loop while `l1 || l2 || carry`. Treat a missing digit as 0.',
    '`sum = d1 + d2 + carry`; append `sum % 10`; `carry = Math.floor(sum / 10)`.',
  ],
  approach: `**Naive:** turn each list into a number, add, and split the sum back into digits. It breaks for 100-digit inputs: JS numbers are exact only up to 2^53. (BigInt would work, but misses the point.)

**Optimized:** simulate column addition. The heads are the ones digits, so walk both lists together, adding digit + digit + carry. Append \`sum % 10\` to a dummy-headed result and keep \`carry\`. Continue while either list or the carry remains.`,

  functionName: 'addTwoNumbers',
  paramNames: ['l1', 'l2'],
  io: { params: ['list', 'list'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} l1
 * @param {ListNode} l2
 * @return {ListNode}
 */
function addTwoNumbers(l1, l2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The basic case from the statement: 342 + 465 = 807.',
      args: [[2, 4, 3], [5, 6, 4]], expected: [7, 0, 8] },
    { scenario: 'Example 2', hint: 'Both numbers are 0 — the result is a single 0 node, not an empty list.',
      args: [[0], [0]], expected: [0] },
    { scenario: 'Example 3', hint: 'Lists of different lengths with a carry on every digit and a final carry.',
      args: [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], expected: [8, 9, 9, 9, 0, 0, 0, 1] },
    { scenario: 'Final carry adds a node', hint: '5 + 5 = 10: if you forget the leftover carry after both lists end, you return [0] instead of [0,1].',
      args: [[5], [5]], expected: [0, 1] },
    { scenario: 'Single digits, no carry', hint: 'The simplest sum: one node each and nothing to carry.',
      args: [[2], [3]], expected: [5] },
    { scenario: 'Carry into the next digit', hint: '18 + 23 = 41 — the carry from the first digit must be added to the second digit.',
      args: [[8, 1], [3, 2]], expected: [1, 4] },
    { scenario: 'Second list shorter', hint: 'If you stop when the shorter list ends, the remaining digits of l1 are dropped.',
      args: [[1, 8], [0]], expected: [1, 8] },
    { scenario: 'First list shorter', hint: 'If you stop when the shorter list ends, the remaining digits of l2 are dropped.',
      args: [[0], [7, 3]], expected: [7, 3] },
    { scenario: 'Carry ripples through longer list', hint: '9 + 991 = 1000: the carry must keep propagating through the longer list after the shorter one ends.',
      args: [[9], [1, 9, 9]], expected: [0, 0, 0, 1] },
    { scenario: 'Exceeds Number precision', hint: 'These numbers have 20 digits — converting the lists to a JS Number loses precision beyond 2^53. Add digit by digit.',
      args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2], [9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8]], expected: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { scenario: 'Maximum length (100 digits)', hint: 'A 100-digit number plus 465 — Number conversion fails, and the long tail of l1 must be copied after l2 ends.',
      argsGen: '() => [Array.from({ length: 100 }, (_, i) => (i === 99 ? 1 : 0)), [5, 6, 4]]', expected: [5, 6, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] },
    { scenario: 'Two 100-digit nines', hint: 'All 9s on both sides: every position carries and the result has 101 digits.',
      argsGen: '() => [Array(100).fill(9), Array(100).fill(9)]', expected: [8,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,1] },
  ],

  solution: {
    code: `function addTwoNumbers(l1, l2) {
  const dummy = new ListNode();
  let tail = dummy;
  let carry = 0;
  while (l1 || l2 || carry) {
    const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
    if (l1) l1 = l1.next;
    if (l2) l2 = l2.next;
  }
  return dummy.next;
}`,
  },
  dryRun: {
    columns: ['d1', 'd2', 'carry in', 'sum', 'digit', 'carry out'],
    rows: [
      ['2', '5', '0', '7', '7', '0'],
      ['4', '6', '0', '10', '0', '1'],
      ['3', '4', '1', '8', '8', '0'],
    ],
  },
  complexity: { time: 'O(max(m, n))', space: 'O(max(m, n)) for the output', explanation: 'One node per digit of the sum; O(1) extra besides the output.' },
  alternative: {
    title: 'BigInt',
    md: 'Build decimal strings (reversed), add with BigInt, split back. Works in JS but interviewers expect the digit simulation.',
    complexity: 'O(m + n) time and space',
  },
  mistakes: [
    'Forgetting the final carry (5 + 5 = [0,1]).',
    'Stopping when the shorter list ends.',
    'Converting to Number — loses precision beyond 2^53.',
  ],
};
