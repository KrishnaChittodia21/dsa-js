export default {
  id: 'remove-nth-node-from-end-of-list',
  title: 'Remove Nth Node From End of List',
  difficulty: 'Medium',
  order: 1,
  pattern: 'linked-list-dummy-node',
  tags: ['linked list', 'two pointers'],
  source: { platform: 'LeetCode', number: 19, url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/' },

  statement: `Given the \`head\` of a linked list and an integer \`n\`, delete the \`n\`-th node **counting from the end** (n = 1 is the last node) and return the head of the resulting list.

Follow-up: can you do it in a single pass?`,
  examples: [
    { input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]', explanation: 'The 2nd from the end is 4.' },
    { input: 'head = [1], n = 1', output: '[]' },
    { input: 'head = [1,2], n = 1', output: '[1]' },
  ],
  constraints: ['1 <= number of nodes (sz) <= 30', '0 <= Node.val <= 100', '1 <= n <= sz'],

  think: `- To delete a node, which node do you actually need to hold?
- What if the node to delete is the head? How can you avoid a special case?
- If two pointers are n nodes apart and the front one reaches the end, where is the back one?`,
  patternChallenge: {
    options: ['Dummy head + two pointers with a gap of n', 'Reverse the list, delete, reverse back', 'Binary search on position', 'Hash map from index to node'],
    answer: 0,
    explanation: 'A dummy node gives the head a predecessor (it may be the one deleted); a fixed gap of n between two pointers turns "n-th from the end" into a single pass.',
  },
  hints: [
    'Start both pointers at a dummy node before head. Move `fast` n steps ahead.',
    'Move both until `fast.next` is null. Now `slow.next` is the node to delete: `slow.next = slow.next.next`. Return `dummy.next`.',
  ],
  approach: `**Two-pass:** count the length L, then walk to node L − n (the predecessor) and unlink the next node. Needs a special case when L = n (deleting the head) — unless you use a dummy.

**One pass (dummy + gap):** \`dummy.next = head\`. Put \`fast\` and \`slow\` on the dummy, advance \`fast\` n steps. Advance both until \`fast\` is the last node; the gap stays n, so \`slow\` is exactly one node before the target. Unlink it and return \`dummy.next\`.`,

  functionName: 'removeNthFromEnd',
  paramNames: ['head', 'n'],
  io: { params: ['list', 'any'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} head
 * @param {number} n
 * @return {ListNode}
 */
function removeNthFromEnd(head, n) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Remove the 2nd node from the end of a 5-node list.',
      args: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5] },
    { scenario: 'Example 2', hint: 'Removing the only node leaves an empty list — return null, not head.',
      args: [[1], 1], expected: [] },
    { scenario: 'Example 3', hint: 'Remove the tail of a 2-node list.',
      args: [[1, 2], 1], expected: [1] },
    { scenario: 'Remove head of two nodes', hint: 'n equals the length, so the head goes. Returning `head` instead of `dummy.next` keeps the removed node.',
      args: [[1, 2], 2], expected: [2] },
    { scenario: 'Remove head of long list', hint: 'n = length: without a dummy node there is no "previous" node for the head.',
      args: [[1, 2, 3, 4, 5], 5], expected: [2, 3, 4, 5] },
    { scenario: 'Remove the tail', hint: 'n = 1: the second-to-last node must point to null.',
      args: [[1, 2, 3, 4, 5], 1], expected: [1, 2, 3, 4] },
    { scenario: 'Remove the exact middle', hint: 'Off-by-one gaps (starting at head, or looping `while (fast)`) remove a neighbour instead.',
      args: [[10, 20, 30], 2], expected: [10, 30] },
    { scenario: 'Duplicate values', hint: 'Remove by position, not by value.',
      args: [[7, 7, 7], 2], expected: [7, 7] },
    { scenario: 'Second node of three', hint: 'Removing index 1 from the start.',
      args: [[1, 2, 3], 2], expected: [1, 3] },
    { scenario: 'Maximum length, remove middle', hint: '30 nodes, remove the 15th from the end.',
      args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], 15], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    { scenario: 'Maximum length, remove head', hint: '30 nodes, n = 30 removes the head.',
      args: [[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87], 30], expected: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87] },
    { scenario: 'Maximum length, remove tail', hint: '30 nodes, n = 1 removes the tail.',
      args: [[100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71], 1], expected: [100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72] },
  ],

  solution: {
    code: `function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i < n; i++) fast = fast.next; // gap of n
  while (fast.next) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next; // slow is the predecessor of the target
  return dummy.next;
}`,
  },
  dryRun: {
    columns: ['step', 'slow', 'fast'],
    rows: [
      ['gap', 'dummy', '2'],
      ['1', '1', '3'],
      ['2', '2', '4'],
      ['3', '3', '5 (last) → stop'],
      ['unlink', '3.next = 5', 'result 1,2,3,5'],
    ],
  },
  complexity: { time: 'O(L)', space: 'O(1)', explanation: 'fast walks the list once; slow walks L − n nodes.' },
  alternative: {
    title: 'Two passes (length first)',
    md: 'Count L, then from the dummy walk L − n steps and unlink.',
    code: `function removeNthFromEnd(head, n) {
  let L = 0;
  for (let p = head; p; p = p.next) L++;
  const dummy = new ListNode(0, head);
  let p = dummy;
  for (let i = 0; i < L - n; i++) p = p.next;
  p.next = p.next.next;
  return dummy.next;
}`,
    complexity: 'O(L) time, O(1) space',
  },
  mistakes: [
    'Starting the pointers at `head` instead of the dummy → slow stops ON the target instead of before it.',
    'Returning `head` when the head itself was removed.',
    'Looping `while (fast)` instead of `while (fast.next)` — off by one.',
  ],
};
