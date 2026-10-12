export default {
  id: 'middle-of-the-linked-list',
  title: 'Middle of the Linked List',
  difficulty: 'Easy',
  order: 4,
  pattern: 'linked-list-fast-slow',
  tags: ['linked list', 'two pointers'],
  source: { platform: 'LeetCode', number: 876, url: 'https://leetcode.com/problems/middle-of-the-linked-list/' },

  statement: `Given the \`head\` of a non-empty singly linked list, return the **middle node**. If the list has an even number of nodes there are two middles — return the **second** one.

(The tests read your answer as a list starting at the node you return.)`,
  examples: [
    { input: 'head = [1,2,3,4,5]', output: '[3,4,5]', explanation: 'Node 3 is the middle.' },
    { input: 'head = [1,2,3,4,5,6]', output: '[4,5,6]', explanation: 'Middles are 3 and 4; return the second.' },
  ],
  constraints: ['1 <= number of nodes <= 100', '1 <= Node.val <= 100'],

  think: `- The easy way uses two passes (count, then walk). Can one pass do it?
- If one pointer moves twice as fast, where is the slow one when the fast one finishes?
- Which loop condition gives the second middle vs the first?`,
  patternChallenge: {
    options: ['In-place Reversal', 'Hash Map', 'Dummy head', 'Fast & Slow Pointers'],
    answer: 3,
    explanation: '"Middle of a list" in one pass is the simplest fast & slow application: fast covers 2x the distance, so slow is halfway when fast ends.',
  },
  hints: [
    'Start `slow` and `fast` at head. Move slow 1 and fast 2 per step.',
    'Loop while `fast && fast.next`. For even lengths this stops with slow on the second middle.',
  ],
  approach: `**Brute force:** count the nodes (n), then walk \`Math.floor(n / 2)\` steps. Two passes, O(1) space — perfectly fine, but interviewers ask for one pass.

**Optimized:** fast & slow pointers. When \`fast\` can no longer take two steps, \`slow\` has taken ⌊n/2⌋ steps — exactly the (second) middle.`,

  functionName: 'middleNode',
  paramNames: ['head'],
  io: { params: ['list'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function middleNode(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Odd length: exactly one middle.',
      args: [[1, 2, 3, 4, 5]], expected: [3, 4, 5] },
    { scenario: 'Example 2', hint: 'Even length: return the SECOND middle. `while (fast.next && fast.next.next)` returns the first one.',
      args: [[1, 2, 3, 4, 5, 6]], expected: [4, 5, 6] },
    { scenario: 'Single node', hint: 'The only node is the middle.',
      args: [[1]], expected: [1] },
    { scenario: 'Two nodes', hint: 'Second middle of two nodes is the tail. Guard `fast && fast.next` or you hit a TypeError.',
      args: [[1, 2]], expected: [2] },
    { scenario: 'Three nodes', hint: 'Smallest odd case with a real middle.',
      args: [[1, 2, 3]], expected: [2, 3] },
    { scenario: 'Four nodes', hint: 'Middles are 2 and 3 — return 3.',
      args: [[1, 2, 3, 4]], expected: [3, 4] },
    { scenario: 'Duplicate values', hint: 'Return the node, not a value — the rest of the list follows from it.',
      args: [[9, 9, 9, 9]], expected: [9, 9] },
    { scenario: 'Seven nodes', hint: 'Odd length beyond the examples.',
      args: [[7, 6, 5, 4, 3, 2, 1]], expected: [4, 3, 2, 1] },
    { scenario: 'Maximum length (100)', hint: 'Even length 100: the second middle is node 51.',
      argsGen: '() => [Array.from({ length: 100 }, (_, i) => i + 1)]', expected: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100] },
    { scenario: 'Odd length 99', hint: 'Odd length 99: the middle is node 50.',
      argsGen: '() => [Array.from({ length: 99 }, (_, i) => 100 - i)]', expected: [51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] },
  ],

  solution: {
    code: `function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
  },
  dryRun: {
    columns: ['step', 'slow', 'fast'],
    rows: [
      ['0', '1', '1'],
      ['1', '2', '3'],
      ['2', '3', '5'],
      ['stop', '3 (return)', '5.next is null'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Fast visits about n nodes; slow about n/2.' },
  alternative: {
    title: 'Count then walk',
    md: 'First pass counts n, second pass walks n >> 1 steps.',
    code: `function middleNode(head) {
  let n = 0;
  for (let p = head; p; p = p.next) n++;
  let p = head;
  for (let i = 0; i < n >> 1; i++) p = p.next;
  return p;
}`,
    complexity: 'O(n) time, O(1) space, two passes',
  },
  mistakes: [
    'Using `while (fast.next && fast.next.next)` — that returns the FIRST middle for even lengths.',
    'Forgetting the `fast &&` guard → TypeError on even-length lists.',
  ],
};
