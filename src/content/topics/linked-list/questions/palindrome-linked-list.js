export default {
  id: 'palindrome-linked-list',
  title: 'Palindrome Linked List',
  difficulty: 'Easy',
  order: 5,
  pattern: 'linked-list-fast-slow',
  tags: ['linked list', 'two pointers', 'reversal'],
  source: { platform: 'LeetCode', number: 234, url: 'https://leetcode.com/problems/palindrome-linked-list/' },

  statement: `Given the \`head\` of a singly linked list, return \`true\` if its values read the same forwards and backwards (a **palindrome**), otherwise \`false\`.

Follow-up: can you do it in O(n) time and O(1) extra space?`,
  examples: [
    { input: 'head = [1,2,2,1]', output: 'true' },
    { input: 'head = [1,2]', output: 'false' },
  ],
  constraints: ['1 <= number of nodes <= 10^5', '0 <= Node.val <= 9'],

  think: `- With an array you would compare \`a[i]\` and \`a[n-1-i]\`. What stops you doing that on a list?
- If the second half were reversed, could you walk both halves forwards together?
- How do you find where the second half starts?`,
  patternChallenge: {
    options: ['Sliding Window', 'Fast & Slow Pointers + reverse the second half', 'Hash Set of values', 'Sorting'],
    answer: 1,
    explanation: 'A palindrome compares the first half with the reversed second half. Fast & slow finds the middle; in-place reversal of the second half lets both halves be walked forwards in O(1) space.',
  },
  hints: [
    'Find the middle with fast & slow. Reverse the list starting at the middle.',
    'Walk from `head` and from the reversed half\'s head together, comparing values, until the reversed half ends.',
  ],
  approach: `**Brute force:** copy values into an array and use two pointers from both ends — O(n) time, O(n) space.

**Optimized:**
1. Fast & slow: when fast ends, \`slow\` is the (second) middle.
2. Reverse the list from \`slow\` onwards.
3. Compare the first half with the reversed second half node by node. For odd lengths the middle node ends up in the reversed half, which is fine — it is compared with itself last or skipped.

(Optionally reverse the second half back to restore the input.)`,

  functionName: 'isPalindrome',
  paramNames: ['head'],
  io: { params: ['list'] },
  starterCode: `/**
 * @param {ListNode} head
 * @return {boolean}
 */
function isPalindrome(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Even-length palindrome.',
      args: [[1, 2, 2, 1]], expected: true },
    { scenario: 'Example 2', hint: 'Two different values.',
      args: [[1, 2]], expected: false },
    { scenario: 'Single node', hint: 'One node is always a palindrome.',
      args: [[1]], expected: true },
    { scenario: 'Two equal nodes', hint: 'Smallest even palindrome.',
      args: [[7, 7]], expected: true },
    { scenario: 'Odd-length palindrome', hint: 'The middle node belongs to both halves — make sure your compare loop stops on the shorter (reversed) side.',
      args: [[1, 2, 1]], expected: true },
    { scenario: 'Odd length, not a palindrome', hint: '1 ≠ 3 — only the ends differ.',
      args: [[1, 2, 3]], expected: false },
    { scenario: 'Mismatch at the ends', hint: 'Everything matches except the first and last nodes.',
      args: [[2, 1, 1, 1]], expected: false },
    { scenario: 'Mismatch next to middle', hint: 'The ends match; the difference is right at the centre.',
      args: [[1, 2, 3, 4, 2, 1]], expected: false },
    { scenario: 'Trailing zeros', hint: '[1,0,0] reversed is [0,0,1].',
      args: [[1, 0, 0]], expected: false },
    { scenario: 'All same value', hint: 'All equal values form a palindrome.',
      args: [[9, 9, 9, 9, 9]], expected: true },
    { scenario: 'Almost palindrome', hint: 'Only one node is out of place.',
      args: [[1, 2, 3, 2, 2]], expected: false },
    { scenario: 'Large palindrome (n = 10^5)', hint: 'Walking from the head to the mirror position for every node is O(n²). Find the middle, reverse the second half, compare — O(n).',
      argsGen: '() => { const n = 100000; return [Array.from({ length: n }, (_, i) => Math.min(i, n - 1 - i) % 10)]; }', expected: true, timeLimitMs: 1000 },
    { scenario: 'Large, mismatch at centre', hint: '10^5 − 1 nodes that only differ next to the middle.',
      argsGen: '() => { const n = 99999; const a = Array.from({ length: n }, (_, i) => Math.min(i, n - 1 - i) % 10); a[49998] = (a[49998] + 1) % 10; return [a]; }', expected: false, timeLimitMs: 1000 },
  ],

  solution: {
    code: `function isPalindrome(head) {
  // 1. middle
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  // 2. reverse the second half
  let prev = null;
  while (slow) {
    const next = slow.next;
    slow.next = prev;
    prev = slow;
    slow = next;
  }
  // 3. compare
  let a = head, b = prev;
  while (b) {
    if (a.val !== b.val) return false;
    a = a.next;
    b = b.next;
  }
  return true;
}`,
    explanation: 'The reversed half is never longer than the first half, so looping `while (b)` is enough.',
  },
  dryRun: {
    columns: ['phase', 'state'],
    rows: [
      ['middle', '[1,2,2,1] → slow at the second 2'],
      ['reverse', 'second half 2→1 becomes 1→2; first half 1→2→(2)'],
      ['compare', '1=1, 2=2, b ends → true'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Three linear passes over at most n nodes; only pointers are stored.' },
  alternative: {
    title: 'Array + two pointers',
    md: 'Copy values to an array and compare from both ends. Simplest and does not mutate the input.',
    code: `function isPalindrome(head) {
  const a = listToArray(head);
  for (let i = 0, j = a.length - 1; i < j; i++, j--) if (a[i] !== a[j]) return false;
  return true;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Looping `while (a)` in the compare step — the first half still links into the reversed middle, so be careful which side you stop on.',
    'Modifying the input without mentioning it (or restoring it) in an interview.',
    'Building a reversed copy with new nodes — that is O(n) space again.',
  ],
};
