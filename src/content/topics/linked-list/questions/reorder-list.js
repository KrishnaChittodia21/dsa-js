export default {
  id: 'reorder-list',
  title: 'Reorder List',
  difficulty: 'Medium',
  order: 3,
  pattern: 'linked-list-merge-split',
  tags: ['linked list', 'two pointers', 'reversal'],
  source: { platform: 'LeetCode', number: 143, url: 'https://leetcode.com/problems/reorder-list/' },

  statement: `A list \`L0 → L1 → … → Ln-1 → Ln\` must be rearranged **in place** into

\`L0 → Ln → L1 → Ln-1 → L2 → Ln-2 → …\`

Only the links may change — not the values. The function returns nothing; the tests inspect the list starting at the original \`head\`.`,
  examples: [
    { input: 'head = [1,2,3,4]', output: '[1,4,2,3]' },
    { input: 'head = [1,2,3,4,5]', output: '[1,5,2,4,3]' },
  ],
  constraints: ['1 <= number of nodes <= 5 * 10^4', '1 <= Node.val <= 1000'],

  think: `- The result alternates between the front and the back. Which part of the list do you need to read backwards?
- Which three building blocks combine here?
- After splitting, how do you make sure the first half ends with \`null\`?`,
  patternChallenge: {
    options: ['Split (fast & slow) + reverse second half + weave', 'Sort the list', 'Stack of all nodes only', 'Sliding Window'],
    answer: 0,
    explanation: 'Taking from the back requires walking backwards, which a singly list cannot do — so reverse the second half. Split with fast & slow, reverse, then merge alternately. A stack also works but costs O(n) space.',
  },
  hints: [
    'Find the first middle (`fast = head.next`), cut after it, reverse the second half.',
    'Weave: take one node from the first half, then one from the reversed second half, until the second half is exhausted.',
  ],
  approach: `**Brute force:** put all nodes in an array, then relink with two indices \`i\` (front) and \`j\` (back). O(n) space.

**Optimized (three steps, O(1) space):**
1. **Split:** fast & slow to the first middle; \`second = slow.next; slow.next = null\`.
2. **Reverse** \`second\`.
3. **Weave:** \`a = head, b = reversed\`; while \`b\`: save \`a.next\` and \`b.next\`, set \`a.next = b\`, \`b.next = savedA\`, advance both. The first half is equal or one longer, so stopping when \`b\` ends is correct.`,

  functionName: 'reorderList',
  paramNames: ['head'],
  io: { params: ['list'], mutates: 0 },
  starterCode: `/**
 * @param {ListNode} head
 * @return {void} Do not return anything, modify head in-place instead.
 */
function reorderList(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Even length: L0 → L3 → L1 → L2.',
      args: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
    { scenario: 'Example 2', hint: 'Odd length: the middle node ends up last.',
      args: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
    { scenario: 'Single node', hint: 'Nothing to reorder — don\'t crash on head.next being null.',
      args: [[1]], expected: [1] },
    { scenario: 'Two nodes', hint: 'Already in order; the list must not gain a cycle.',
      args: [[1, 2]], expected: [1, 2] },
    { scenario: 'Three nodes', hint: 'The smallest case where nodes actually move. Forgetting `slow.next = null` leaves a cycle.',
      args: [[1, 2, 3]], expected: [1, 3, 2] },
    { scenario: 'Six nodes', hint: 'Even length: split at the FIRST middle so the halves are balanced.',
      args: [[1, 2, 3, 4, 5, 6]], expected: [1, 6, 2, 5, 3, 4] },
    { scenario: 'Seven nodes', hint: 'Odd length beyond the examples.',
      args: [[10, 20, 30, 40, 50, 60, 70]], expected: [10, 70, 20, 60, 30, 50, 40] },
    { scenario: 'Duplicate values', hint: 'Move nodes, not values — duplicates must keep their positions in the pattern.',
      args: [[7, 7, 8, 8]], expected: [7, 8, 7, 8] },
    { scenario: 'Descending values', hint: 'The pattern depends on positions, not on value order.',
      args: [[9, 8, 7, 6, 5, 4, 3, 2, 1]], expected: [9, 1, 8, 2, 7, 3, 6, 4, 5] },
    { scenario: 'Max values', hint: 'Values at the upper bound.',
      args: [[1000, 1, 1000, 1]], expected: [1000, 1, 1, 1000] },
    { scenario: 'Large input (n = 3·10^4)', hint: 'Walking to the tail for every pair is O(n²) — too slow. Middle + reverse + weave is O(n).',
      argsGen: '() => [Array.from({ length: 30000 }, (_, i) => (i % 9) + 1)]', expectedGen: "() => { const [a] = (() => [Array.from({ length: 30000 }, (_, i) => (i % 9) + 1)])(); const out = []; for (let i = 0, j = a.length - 1; i <= j; i++, j--) { out.push(a[i]); if (i < j) out.push(a[j]); } return out; }", timeLimitMs: 200 },
    { scenario: 'Medium odd length (999)', hint: 'An odd length well beyond the examples — the middle node ends last.',
      argsGen: '() => [Array.from({ length: 999 }, (_, i) => 1000 - i)]', expectedGen: "() => { const [a] = (() => [Array.from({ length: 999 }, (_, i) => 1000 - i)])(); const out = []; for (let i = 0, j = a.length - 1; i <= j; i++, j--) { out.push(a[i]); if (i < j) out.push(a[j]); } return out; }" },
  ],

  solution: {
    code: `function reorderList(head) {
  if (!head || !head.next) return;
  // 1. first middle
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;              // cut
  // 2. reverse second half
  let prev = null;
  while (second) {
    const next = second.next;
    second.next = prev;
    prev = second;
    second = next;
  }
  // 3. weave
  let a = head, b = prev;
  while (b) {
    const an = a.next, bn = b.next;
    a.next = b;
    b.next = an;
    a = an;
    b = bn;
  }
}`,
  },
  dryRun: {
    columns: ['step', 'first half', 'second half', 'result'],
    rows: [
      ['split', '1→2→3', '4→5', ''],
      ['reverse', '1→2→3', '5→4', ''],
      ['weave 1', '2→3', '4', '1→5'],
      ['weave 2', '3', '—', '1→5→2→4→3'],
    ],
  },
  complexity: { time: 'O(n)', space: 'O(1)', explanation: 'Three linear passes; all work is pointer rewiring.' },
  alternative: {
    title: 'Array of nodes',
    md: 'Store nodes in an array, then link nodes[i] → nodes[j] → nodes[i+1] … with two indices; terminate with null.',
    code: `function reorderList(head) {
  const nodes = [];
  for (let p = head; p; p = p.next) nodes.push(p);
  let i = 0, j = nodes.length - 1;
  while (i < j) {
    nodes[i].next = nodes[j];
    i++;
    if (i === j) break;
    nodes[j].next = nodes[i];
    j--;
  }
  nodes[i].next = null;
}`,
    complexity: 'O(n) time, O(n) space',
  },
  mistakes: [
    'Forgetting `slow.next = null` → the result contains a cycle.',
    'Using the second middle for the split — the halves come out unbalanced for even lengths.',
    'Returning a new head: the caller keeps using the original `head`.',
  ],
};
