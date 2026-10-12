export default {
  id: 'merge-two-sorted-lists',
  title: 'Merge Two Sorted Lists',
  difficulty: 'Easy',
  order: 2,
  pattern: 'linked-list-merge-split',
  tags: ['linked list', 'recursion'],
  source: { platform: 'LeetCode', number: 21, url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },

  statement: `You get the heads of two linked lists, \`list1\` and \`list2\`, each already sorted in non-decreasing order.

Combine them into **one sorted list** by splicing together the existing nodes (do not create copies of the values), and return its head.`,
  examples: [
    { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
    { input: 'list1 = [], list2 = []', output: '[]' },
    { input: 'list1 = [], list2 = [0]', output: '[0]' },
  ],
  constraints: ['0 <= nodes in each list <= 50', '-100 <= Node.val <= 100', 'Both lists are sorted in non-decreasing order'],

  think: `- At any moment, which two nodes are candidates for the next position of the result?
- How do you avoid a special case for "the result is still empty"?
- When one list runs out, what do you do with the other?`,
  patternChallenge: {
    options: ['Two heaps', 'Merge with a dummy head and tail pointer', 'In-place reversal', 'Binary search'],
    answer: 1,
    explanation: 'Two sorted sequences → the merge step of merge sort. A dummy node lets you append the first node the same way as all the others.',
  },
  hints: [
    'Create `dummy` and `tail = dummy`. Compare `list1.val` and `list2.val`, attach the smaller to `tail.next`.',
    'When one list is exhausted, attach the whole remainder of the other with one assignment: `tail.next = list1 ?? list2`.',
  ],
  approach: `**Brute force:** collect all values into an array, sort, and build a new list — O((n+m) log(n+m)) and it creates new nodes.

**Optimized:** both lists are already sorted, so the smallest remaining value is always at one of the two heads. Keep a \`tail\` pointer starting at a dummy node; repeatedly move the smaller head onto \`tail.next\` and advance. Attach the leftover list at the end. O(n + m) time, O(1) extra space.`,

  functionName: 'mergeTwoLists',
  paramNames: ['list1', 'list2'],
  io: { params: ['list', 'list'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Interleave two lists with equal values on both sides.',
      args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
    { scenario: 'Example 2', hint: 'Both lists empty — return null (an empty list), not the dummy node.',
      args: [[], []], expected: [] },
    { scenario: 'Example 3', hint: 'One list is empty — the answer is the other list.',
      args: [[], [0]], expected: [0] },
    { scenario: 'Second list empty', hint: 'list2 is null; attach all of list1.',
      args: [[5], []], expected: [5] },
    { scenario: 'Single node each', hint: 'The smaller head must come first. Returning `dummy` instead of `dummy.next` adds a stray 0.',
      args: [[2], [1]], expected: [1, 2] },
    { scenario: 'list1 entirely before list2', hint: 'Once list1 runs out, attach the rest of list2 in one step.',
      args: [[1, 2, 3], [4, 5, 6]], expected: [1, 2, 3, 4, 5, 6] },
    { scenario: 'list2 entirely before list1', hint: 'Once list2 runs out, attach the rest of list1.',
      args: [[4, 5, 6], [1, 2, 3]], expected: [1, 2, 3, 4, 5, 6] },
    { scenario: 'Negative values', hint: 'Ordering must work with negatives too.',
      args: [[-3, -1, 7], [-2, -2, 8, 9]], expected: [-3, -2, -2, -1, 7, 8, 9] },
    { scenario: 'All values equal', hint: 'Ties: take from either list but don\'t drop or duplicate nodes.',
      args: [[2, 2, 2], [2, 2]], expected: [2, 2, 2, 2, 2] },
    { scenario: 'Long leftover tail', hint: 'If you forget to advance `tail`, you overwrite nodes and lose most of the list.',
      args: [[1], [2, 3, 4, 5, 6, 7, 8, 9, 10]], expected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { scenario: 'Min and max values', hint: 'Values span the full range −100..100.',
      args: [[-100, 0, 100], [-100, 100]], expected: [-100, -100, 0, 100, 100] },
    { scenario: 'Maximum length (50 + 50)', hint: 'Two full-size interleaved lists.',
      argsGen: '() => [Array.from({ length: 50 }, (_, i) => -100 + 4 * i), Array.from({ length: 50 }, (_, i) => -98 + 4 * i)]', expected: [-100, -98, -96, -94, -92, -90, -88, -86, -84, -82, -80, -78, -76, -74, -72, -70, -68, -66, -64, -62, -60, -58, -56, -54, -52, -50, -48, -46, -44, -42, -40, -38, -36, -34, -32, -30, -28, -26, -24, -22, -20, -18, -16, -14, -12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98] },
  ],

  solution: {
    code: `function mergeTwoLists(list1, list2) {
  const dummy = new ListNode();
  let tail = dummy;
  while (list1 && list2) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }
    tail = tail.next;
  }
  tail.next = list1 ?? list2; // at most one is non-null; it is already sorted
  return dummy.next;
}`,
  },
  dryRun: {
    columns: ['list1 head', 'list2 head', 'attach', 'result so far'],
    rows: [
      ['1', '1', 'list1\'s 1 (<=)', '1'],
      ['2', '1', 'list2\'s 1', '1,1'],
      ['2', '3', '2', '1,1,2'],
      ['4', '3', '3', '1,1,2,3'],
      ['4', '4', 'list1\'s 4', '1,1,2,3,4'],
      ['null', '4', 'leftover list2', '1,1,2,3,4,4'],
    ],
  },
  complexity: { time: 'O(n + m)', space: 'O(1)', explanation: 'Each node is attached exactly once; only the dummy and a few pointers are allocated.' },
  alternative: {
    title: 'Recursive merge',
    md: 'The smaller head becomes the head of the answer, and its `next` is the merge of the rest.',
    code: `function mergeTwoLists(a, b) {
  if (!a || !b) return a ?? b;
  if (a.val <= b.val) { a.next = mergeTwoLists(a.next, b); return a; }
  b.next = mergeTwoLists(a, b.next);
  return b;
}`,
    complexity: 'O(n + m) time, O(n + m) stack',
  },
  mistakes: [
    'Forgetting to advance `tail` after attaching a node.',
    'Looping until both lists are empty, attaching one node at a time — works but is needless; attach the leftover in one step.',
    'Returning `dummy` instead of `dummy.next`.',
  ],
};
