export default {
  id: 'linked-list-cycle',
  title: 'Linked List Cycle',
  difficulty: 'Easy',
  order: 3,
  pattern: 'linked-list-fast-slow',
  tags: ['linked list', 'two pointers', 'hash set'],
  source: { platform: 'LeetCode', number: 141, url: 'https://leetcode.com/problems/linked-list-cycle/' },

  statement: `Given the \`head\` of a linked list, return \`true\` if the list contains a **cycle** — that is, if following \`next\` pointers from some node eventually leads back to that same node — and \`false\` otherwise.

In the tests, a list is described as \`[values, pos]\`: \`pos\` is the index of the node the tail links back to, or \`-1\` for no cycle. \`pos\` is **not** passed to your function — you only receive \`head\`.

Follow-up: can you do it with O(1) extra memory?`,
  examples: [
    { input: 'values = [3,2,0,-4], pos = 1', output: 'true', explanation: 'The tail (-4) links back to the node with value 2.' },
    { input: 'values = [1,2], pos = 0', output: 'true' },
    { input: 'values = [1], pos = -1', output: 'false' },
  ],
  constraints: ['0 <= number of nodes <= 10^4', '-10^5 <= Node.val <= 10^5', 'pos is -1 or a valid index'],

  think: `- If you just walk the list, how would you ever know you are in a loop?
- What could you remember to detect a revisit? What does that cost?
- Two runners on a circular track at different speeds — what must happen?`,
  patternChallenge: {
    options: ['Fast & Slow Pointers (Floyd)', 'Dummy head', 'Sliding Window', 'Binary Search'],
    answer: 0,
    explanation: 'Cycle detection with O(1) space is the textbook use of Floyd\'s tortoise and hare: in a cycle the faster pointer must catch the slower one.',
  },
  hints: [
    'A Set of visited nodes works in O(n) space. For O(1) space, move `slow` 1 step and `fast` 2 steps.',
    'If `fast` reaches `null`, there is no cycle. If `slow === fast` at some point, there is one.',
  ],
  approach: `**Brute force:** store every visited node in a \`Set\` (nodes are hashed by reference). If you see a node twice → cycle. O(n) time, O(n) space.

**Optimized (Floyd):** \`slow\` moves one step, \`fast\` two. Without a cycle, \`fast\` hits \`null\`. With a cycle, once both are inside it the gap between them shrinks by exactly 1 per step, so it reaches 0 — they meet — within one lap. O(n) time, O(1) space.`,

  functionName: 'hasCycle',
  paramNames: ['values', 'pos'],
  harness: `(target, args, h) => {
    const [values, pos] = args;
    const head = h.arrayToList(values);
    if (pos >= 0) {
      let tail = head, entry = null, i = 0;
      for (let n = head; n; n = n.next, i++) { if (i === pos) entry = n; tail = n; }
      tail.next = entry;
    }
    return target(head);
  }`,
  starterCode: `/**
 * @param {ListNode} head
 * @return {boolean}
 */
function hasCycle(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The tail links back to index 1.',
      args: [[3, 2, 0, -4], 1], expected: true },
    { scenario: 'Example 2', hint: 'Two nodes pointing at each other.',
      args: [[1, 2], 0], expected: true },
    { scenario: 'Example 3', hint: 'A single node with no cycle.',
      args: [[1], -1], expected: false },
    { scenario: 'Empty list', hint: 'head is null — return immediately without touching head.next.',
      args: [[], -1], expected: false },
    { scenario: 'Single node self-loop', hint: 'One node whose next is itself. Don\'t check `slow === fast` before the first move — they start equal.',
      args: [[1], 0], expected: true },
    { scenario: 'Even length, no cycle', hint: 'fast becomes null on even lengths — guard `fast && fast.next`, not just `fast.next`.',
      args: [[1, 2, 3, 4, 5, 6], -1], expected: false },
    { scenario: 'Odd length, no cycle', hint: 'fast stops on the last node; fast.next is null.',
      args: [[1, 2, 3, 4, 5], -1], expected: false },
    { scenario: 'Tail points to itself', hint: 'The cycle is just the last node.',
      args: [[1, 2, 3, 4, 5, 6], 5], expected: true },
    { scenario: 'Cycle back to head', hint: 'The whole list is the cycle.',
      args: [[1, 2, 3, 4, 5, 6, 7], 0], expected: true },
    { scenario: 'Long tail, short cycle', hint: 'Many nodes before a 3-node loop — keep moving until the pointers meet.',
      args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 7], expected: true },
    { scenario: 'Duplicate values, no cycle', hint: 'Comparing `slow.val === fast.val` would report a cycle here — compare the nodes themselves.',
      args: [[1, 1, 1, 1], -1], expected: false },
    { scenario: 'Duplicate values with cycle', hint: 'Equal values everywhere: compare node identity, not values.',
      args: [[5, 5, 5, 5, 5], 2], expected: true },
    { scenario: 'Large, cycle deep in list', hint: '10^4 nodes with the cycle starting near the end.',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => i), 9000]', expected: true },
    { scenario: 'Large, no cycle', hint: '10^4 nodes, no cycle — make sure your loop terminates on null.',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => i % 7), -1]', expected: false },
  ],

  solution: {
    code: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // compare nodes, not values
  }
  return false;                     // fast fell off the end
}`,
  },
  dryRun: {
    columns: ['step', 'slow', 'fast', 'met?'],
    rows: [
      ['0', '3', '3', 'start'],
      ['1', '2', '0', 'no'],
      ['2', '0', '2', 'no'],
      ['3', '-4', '-4', 'yes → true'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Slow enters the cycle after at most n steps; then the gap closes by 1 per step, at most one cycle length.' },
  alternative: {
    title: 'Visited Set',
    md: 'Walk the list adding each node to a Set; a repeat means a cycle.',
    code: `function hasCycle(head) {
  const seen = new Set();
  for (let n = head; n; n = n.next) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Comparing `slow.val === fast.val` — different nodes may share a value (test [1,1,1,1]).',
    'Loop guard `while (fast.next)` crashes when `fast` is null.',
    'Checking `slow === fast` before the first move (they start equal).',
  ],
};
