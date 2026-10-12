export default {
  id: 'linked-list-cycle-ii',
  title: 'Linked List Cycle II',
  difficulty: 'Medium',
  order: 2,
  pattern: 'linked-list-fast-slow',
  tags: ['linked list', 'two pointers', 'hash set'],
  source: { platform: 'LeetCode', number: 142, url: 'https://leetcode.com/problems/linked-list-cycle-ii/' },

  statement: `Given the \`head\` of a linked list, return the **node where the cycle begins**. If there is no cycle, return \`null\`. Do not modify the list.

Tests describe the list as \`[values, pos]\` (\`pos\` = index the tail links back to, \`-1\` for none). Your function receives only \`head\` and must return a **node**; the test harness converts the node you return into its index (\`-1\` for \`null\`).

Follow-up: can you use O(1) extra memory?`,
  examples: [
    { input: 'values = [3,2,0,-4], pos = 1', output: '1', explanation: 'The cycle starts at the node with value 2 (index 1).' },
    { input: 'values = [1,2], pos = 0', output: '0' },
    { input: 'values = [1], pos = -1', output: '-1', explanation: 'No cycle → null.' },
  ],
  constraints: ['0 <= number of nodes <= 10^4', '-10^5 <= Node.val <= 10^5', 'pos is -1 or a valid index'],

  think: `- Detecting a cycle is Floyd. What extra information does the meeting point give you?
- Let a = head→entry, b = entry→meeting point, c = cycle length. Write the distances slow and fast have travelled.
- From that equation, what happens if one pointer restarts at the head?`,
  patternChallenge: {
    options: ['Dummy head', 'Fast & Slow Pointers (Floyd, two phases)', 'Merge sort', 'In-place reversal'],
    answer: 1,
    explanation: 'Phase 1 of Floyd finds a meeting point inside the cycle; phase 2 (restart one pointer at head, both move 1 step) finds the entry because a ≡ c − b (mod c).',
  },
  hints: [
    'First run fast & slow until they meet (or fast hits null → return null).',
    'Put a new pointer at `head`; move it and `slow` one step at a time. They meet at the cycle entry.',
  ],
  approach: `**Brute force:** walk the list storing nodes in a \`Set\`; the first node seen twice is the entry. O(n) space.

**Optimized (Floyd, two phases):**
1. slow +1, fast +2 until they meet. Slow travelled \`a + b\`, fast \`a + b + k·c\`, and fast travelled twice as far: \`2(a + b) = a + b + k·c\` ⟹ \`a = k·c − b\`.
2. \`k·c − b\` steps from the meeting point lands on the entry (go the remaining \`c − b\` to the entry, plus whole laps). So a pointer from \`head\` and one from the meeting point, both moving 1 step, meet after exactly \`a\` steps — at the entry.`,

  functionName: 'detectCycle',
  paramNames: ['values', 'pos'],
  harness: `(target, args, h) => {
    const [values, pos] = args;
    const head = h.arrayToList(values);
    const nodes = [];
    for (let n = head; n; n = n.next) nodes.push(n);
    if (pos >= 0) nodes[nodes.length - 1].next = nodes[pos];
    const res = target(head);
    if (res === null || res === undefined) return -1;
    const idx = nodes.indexOf(res);
    return idx;
  }`,
  starterCode: `/**
 * @param {ListNode} head
 * @return {ListNode|null}
 */
function detectCycle(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The tail links back to index 1.',
      args: [[3, 2, 0, -4], 1], expected: 1 },
    { scenario: 'Example 2', hint: 'Two nodes pointing at each other.',
      args: [[1, 2], 0], expected: 0 },
    { scenario: 'Example 3', hint: 'A single node with no cycle.',
      args: [[1], -1], expected: -1 },
    { scenario: 'Empty list', hint: 'head is null — return immediately without touching head.next.',
      args: [[], -1], expected: -1 },
    { scenario: 'Single node self-loop', hint: 'One node whose next is itself.',
      args: [[1], 0], expected: 0 },
    { scenario: 'Even length, no cycle', hint: 'fast becomes null on even lengths — guard `fast && fast.next`, not just `fast.next`.',
      args: [[1, 2, 3, 4, 5, 6], -1], expected: -1 },
    { scenario: 'Odd length, no cycle', hint: 'fast stops on the last node; fast.next is null.',
      args: [[1, 2, 3, 4, 5], -1], expected: -1 },
    { scenario: 'Tail points to itself', hint: 'The cycle is just the last node.',
      args: [[1, 2, 3, 4, 5, 6], 5], expected: 5 },
    { scenario: 'Cycle back to head', hint: 'The entry is the head; in phase 2 move both pointers one step at a time from head and the meeting point.',
      args: [[1, 2, 3, 4, 5, 6, 7], 0], expected: 0 },
    { scenario: 'Long tail, short cycle', hint: 'Many nodes before a 3-node loop — returning the meeting point instead of the entry fails here.',
      args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 7], expected: 7 },
    { scenario: 'Duplicate values, no cycle', hint: 'All values are equal — compare nodes (`slow === fast`), never `slow.val === fast.val`.',
      args: [[1, 1, 1, 1], -1], expected: -1 },
    { scenario: 'Duplicate values with cycle', hint: 'All values are 5 — return the entry node itself (index 2), not a value or index.',
      args: [[5, 5, 5, 5, 5], 2], expected: 2 },
    { scenario: 'Large, cycle deep in list', hint: '10^4 nodes with the cycle starting near the end.',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => i), 9000]', expected: 9000 },
    { scenario: 'Large, no cycle', hint: '10^4 nodes, no cycle — make sure your loop terminates on null.',
      argsGen: '() => [Array.from({ length: 10000 }, (_, i) => i % 7), -1]', expected: -1 },
  ],

  solution: {
    code: `function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      // phase 2: equal speed from head and from the meeting point
      let p = head;
      while (p !== slow) {
        p = p.next;
        slow = slow.next;
      }
      return p;
    }
  }
  return null;
}`,
  },
  dryRun: {
    columns: ['phase', 'slow', 'fast / p', 'note'],
    rows: [
      ['1', '2', '0', ''],
      ['1', '0', '2', ''],
      ['1', '-4', '-4', 'meet (b = 2 past entry)'],
      ['2', '2', 'p = 3 → 2', 'a = 1 step: both on node 2 → entry index 1'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Phase 1 takes at most a + c steps; phase 2 exactly a steps.' },
  alternative: {
    title: 'Visited Set',
    md: 'The first node that is already in the Set is the entry.',
    code: `function detectCycle(head) {
  const seen = new Set();
  for (let n = head; n; n = n.next) {
    if (seen.has(n)) return n;
    seen.add(n);
  }
  return null;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Returning the meeting point — it is generally NOT the entry.',
    'Moving fast two steps in phase 2.',
    'Returning the index or value instead of the node.',
  ],
};
