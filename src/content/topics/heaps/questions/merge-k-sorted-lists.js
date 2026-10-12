export default {
  id: 'merge-k-sorted-lists',
  title: 'Merge k Sorted Lists',
  difficulty: 'Hard',
  order: 2,
  pattern: 'heap-k-way-merge',
  tags: ['heap', 'linked list', 'k-way merge', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 23, url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },

  statement: `You are given an array of \`k\` linked lists, each sorted in ascending order. Merge them into **one sorted linked list** and return its head.`,
  examples: [
    { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
    { input: 'lists = []', output: '[]' },
    { input: 'lists = [[]]', output: '[]' },
  ],
  constraints: ['0 <= k <= 10^4', '0 <= each list length <= 500', '-10^4 <= Node.val <= 10^4', 'Total nodes N <= 10^4'],

  think: `- The next node of the result is the smallest among the k current heads. How do you find that quickly — every time?
- After taking a node from list i, what is list i's new head?
- How do empty lists affect the setup?`,
  patternChallenge: {
    options: ['Heap — K-way Merge', 'Two Pointers (merge two lists), applied k − 1 times in a row', 'Sort all values then rebuild', 'Fast & Slow Pointers'],
    answer: 0,
    explanation: 'k sorted sources, repeatedly take the smallest head: a min-heap of heads gives O(N log k). Merging one list at a time into a growing result is O(k·N); sorting all values is O(N log N) and ignores the existing order.',
  },
  hints: [
    'Push every non-null head into a min-heap keyed by node.val.',
    'Pop the smallest node, append it to a dummy-headed result, and push its `next` if it exists.',
  ],
  approach: `**Brute force:** collect all values, sort, build a new list → O(N log N).

**Sequential merging:** merge list 1 with list 2, the result with list 3, … → the growing result is re-walked each time: O(k·N).

**Min-heap of heads (O(N log k)):** heap holds at most one node per list. Pop the smallest, link it after \`tail\`, push its \`next\`. Every node enters and leaves the heap once.

**Divide and conquer (also O(N log k)):** merge pairs of lists (1+2, 3+4, …), then pairs of results, like merge sort — log k rounds of O(N) each.`,

  functionName: 'mergeKLists',
  paramNames: ['lists'],
  starterCode: `/**
 * Definition for singly-linked list (available as the global ListNode):
 * function ListNode(val, next) { this.val = val; this.next = next; }
 *
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
function mergeKLists(lists) {
  
}
`,
  io: { params: ['list[]'], returns: 'list' },
  tests: [
    { scenario: 'Example 1', hint: 'Three lists interleave; always take the smallest current head.', args: [[[1,4,5],[1,3,4],[2,6]]], expected: [1,1,2,3,4,4,5,6] },
    { scenario: 'Example 2', hint: 'No lists at all: return null (an empty list).', args: [[]], expected: [] },
    { scenario: 'Example 3', hint: 'One empty list: do not push a null head into the heap.', args: [[[]]], expected: [] },
    { scenario: 'Single one-node list', hint: 'k = 1 with one node — return it unchanged.', args: [[[1]]], expected: [1] },
    { scenario: 'Single longer list', hint: 'Only one list: the result is that list.', args: [[[1,2,3,4,5]]], expected: [1,2,3,4,5] },
    { scenario: 'Empty lists mixed in', hint: 'Null heads must be skipped — reading .val of null crashes.', args: [[[],[1],[]]], expected: [1] },
    { scenario: 'Negative values', hint: 'Values go down to -10^4; do not assume non-negative.', args: [[[-2,-1,5],[0],[-3,10]]], expected: [-3,-2,-1,0,5,10] },
    { scenario: 'All duplicates', hint: 'Equal values from different lists must all be kept.', args: [[[1,1,1],[1,1]]], expected: [1,1,1,1,1] },
    { scenario: 'Lists already in order', hint: 'Each list lies entirely after the previous one; the heap still works.', args: [[[1,2,3],[4],[5,6,7]]], expected: [1,2,3,4,5,6,7] },
    { scenario: 'Lists in reverse order', hint: 'The smallest values are in the last list.', args: [[[5,6,7],[1,2,3],[4]]], expected: [1,2,3,4,5,6,7] },
    { scenario: 'Very unequal lengths', hint: 'When a short list runs out, keep draining the others.', args: [[[10],[1,2,3,4,5,6,7,8,9,11,12],[]]], expected: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { scenario: 'Extreme values', hint: 'Values at the bounds ±10^4.', args: [[[-10000,10000],[-10000],[10000]]], expected: [-10000,-10000,10000,10000] },
    { scenario: 'Many one-node lists (k = 10^4)', hint: 'The maximum k: 10^4 lists of one node each. Pushing null heads or merging one list at a time (O(k·N)) is wasteful; a min-heap of k heads is O(N log k).', argsGen: '() => [Array.from({ length: 10000 }, (_, i) => [i])]', expected: Array.from({ length: 10000 }, (_, i) => i) },
    { scenario: '100 interleaved lists', hint: 'Every pop comes from a different list — the heap must refill from the list it just popped.', argsGen: '() => [Array.from({ length: 100 }, (_, i) => Array.from({ length: 100 }, (_, j) => i + 100 * j))]', expected: Array.from({ length: 10000 }, (_, i) => i) },
  ],

  solution: {
    code: `function mergeKLists(lists) {
  const heap = new MinHeap((node) => node.val);
  for (const head of lists) if (head) heap.push(head);   // skip empty lists

  const dummy = new ListNode(0);
  let tail = dummy;
  while (!heap.isEmpty()) {
    const node = heap.pop();          // smallest current head
    tail.next = node;
    tail = node;
    if (node.next) heap.push(node.next); // that list's new head
  }
  tail.next = null;
  return dummy.next;
}`,
    explanation: 'Nodes are re-linked, not copied: O(1) extra memory besides the heap.',
  },
  dryRun: {
    columns: ['heap heads', 'pop', 'push', 'result'],
    rows: [
      ['{1a, 1b, 2}', '1a', '4a', '1'],
      ['{1b, 2, 4a}', '1b', '3', '1 1'],
      ['{2, 3, 4a}', '2', '6', '1 1 2'],
      ['{3, 4a, 6}', '3', '4b', '1 1 2 3'],
      ['…', '…', '…', '1 1 2 3 4 4 5 6'],
    ],
  },
  complexity: { time: 'O(N log k)', space: 'O(k)', explanation: 'Each of the N nodes is pushed and popped once in a heap of at most k nodes.' },
  alternative: {
    title: 'Divide and conquer pairwise merging',
    code: `function mergeKLists(lists) {
  const merge2 = (a, b) => {
    const d = new ListNode(0); let t = d;
    while (a && b) { if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; } t = t.next; }
    t.next = a || b;
    return d.next;
  };
  if (!lists.length) return null;
  let cur = lists;
  while (cur.length > 1) {
    const next = [];
    for (let i = 0; i < cur.length; i += 2) next.push(i + 1 < cur.length ? merge2(cur[i], cur[i + 1]) : cur[i]);
    cur = next;
  }
  return cur[0];
}`,
    md: 'log k rounds, each touching all N nodes once. No heap needed.',
    complexity: 'O(N log k) time, O(1) extra space',
  },
  mistakes: [
    'Pushing null heads into the heap (crashes when reading .val).',
    'Merging lists one by one into the result (O(k·N)).',
    'Forgetting the dummy head, leading to special cases for the first node.',
  ],
};
