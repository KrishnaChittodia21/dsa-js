export default {
  id: 'sort-list',
  title: 'Sort List',
  difficulty: 'Medium',
  order: 5,
  pattern: 'linked-list-merge-split',
  tags: ['linked list', 'merge sort', 'divide and conquer'],
  source: { platform: 'LeetCode', number: 148, url: 'https://leetcode.com/problems/sort-list/' },

  statement: `Given the \`head\` of a linked list, return the list sorted in ascending order.

Follow-up: can you sort it in O(n log n) time by relinking nodes (no array copy)?`,
  examples: [
    { input: 'head = [4,2,1,3]', output: '[1,2,3,4]' },
    { input: 'head = [-1,5,3,4,0]', output: '[-1,0,3,4,5]' },
    { input: 'head = []', output: '[]' },
  ],
  constraints: ['0 <= number of nodes <= 5 * 10^4', '-10^5 <= Node.val <= 10^5'],

  think: `- Which O(n log n) sorts need random access (bad for lists) and which only need sequential access?
- How do you split a list into two halves without knowing its length?
- What stops the recursion from splitting a 2-node list into 2 + 0 forever?`,
  patternChallenge: {
    options: ['Quick sort with random pivot by index', 'Heap sort in place', 'Merge sort: split with fast & slow, merge by relinking', 'Binary insertion sort'],
    answer: 2,
    explanation: 'Merge sort only needs "split in half" (fast & slow) and "merge two sorted lists" (dummy + tail), both natural on lists. Heap sort and index-based pivots need random access; binary insertion still costs O(n) per insertion in a list.',
  },
  hints: [
    'Base case: 0 or 1 node. Find the FIRST middle (`fast = head.next`) and cut after it.',
    'Sort both halves recursively and merge them with the merge-two-sorted-lists routine.',
  ],
  approach: `**Brute force:** copy values to an array, \`sort((a, b) => a - b)\`, write them back. O(n log n) but O(n) space and not a list algorithm.

**Optimized (top-down merge sort):**
1. If the list has 0 or 1 nodes, it is sorted.
2. Find the first middle with \`slow = head, fast = head.next\`; \`right = slow.next; slow.next = null\`.
3. \`merge(sortList(head), sortList(right))\`.

Depth is log n, each level merges n nodes → O(n log n) time, O(log n) recursion stack. (A bottom-up iterative version reaches O(1) extra space.)`,

  functionName: 'sortList',
  paramNames: ['head'],
  io: { params: ['list'], returns: 'list' },
  starterCode: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function sortList(head) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Four unsorted nodes.',
      args: [[4, 2, 1, 3]], expected: [1, 2, 3, 4] },
    { scenario: 'Example 2', hint: 'Includes negatives and zero.',
      args: [[-1, 5, 3, 4, 0]], expected: [-1, 0, 3, 4, 5] },
    { scenario: 'Example 3', hint: 'An empty list stays empty.',
      args: [[]], expected: [] },
    { scenario: 'Single node', hint: 'Base case of the recursion.',
      args: [[1]], expected: [1] },
    { scenario: 'Two nodes', hint: 'Splitting at the SECOND middle never shrinks a 2-node list → infinite recursion.',
      args: [[2, 1]], expected: [1, 2] },
    { scenario: 'Duplicates', hint: 'Equal values must all survive the merge.',
      args: [[3, 3, 1, 1, 2, 2]], expected: [1, 1, 2, 2, 3, 3] },
    { scenario: 'Already sorted', hint: 'Sorted input should come back unchanged.',
      args: [[1, 2, 3, 4, 5]], expected: [1, 2, 3, 4, 5] },
    { scenario: 'Reverse sorted', hint: 'Every merge takes from the right half first.',
      args: [[5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5] },
    { scenario: 'Lexicographic trap', hint: '`.sort()` without a comparator orders as strings: 10 before 2. Compare numerically.',
      args: [[10, 9, -1, 2, 100]], expected: [-1, 2, 9, 10, 100] },
    { scenario: 'All equal', hint: 'Every comparison ties.',
      args: [[7, 7, 7, 7, 7, 7]], expected: [7, 7, 7, 7, 7, 7] },
    { scenario: 'Min and max values', hint: 'Values at both ends of −10^5..10^5.',
      args: [[100000, -100000, 0, -100000, 100000]], expected: [-100000, -100000, 0, 100000, 100000] },
    { scenario: 'Large random (n = 2·10^4)', hint: 'Insertion or selection sort on a list is O(n²) — too slow. Merge sort is O(n log n).',
      argsGen: '() => { let s = 11; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 20000 }, () => (r() % 19) - 9)]; }', expectedGen: "() => { const [a] = (() => { let s = 11; const r = () => (s = (s * 48271) % 2147483647); return [Array.from({ length: 20000 }, () => (r() % 19) - 9)]; })(); return [...a].sort((x, y) => x - y); }", timeLimitMs: 300 },
    { scenario: 'Reverse sorted (n = 1000)', hint: 'Descending input. Forgetting to cut `slow.next = null` before recursing never terminates.',
      argsGen: '() => [Array.from({ length: 1000 }, (_, i) => 100000 - 200 * i)]', expectedGen: "() => Array.from({ length: 1000 }, (_, i) => 100000 - 200 * (999 - i))" },
  ],

  solution: {
    code: `function sortList(head) {
  if (!head || !head.next) return head;

  // split at the FIRST middle so [a, b] becomes [a] + [b]
  let slow = head, fast = head.next;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  const right = slow.next;
  slow.next = null;

  return merge(sortList(head), sortList(right));
}

function merge(a, b) {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}`,
  },
  dryRun: {
    columns: ['call', 'split', 'merged result'],
    rows: [
      ['[4,2,1,3]', '[4,2] | [1,3]', ''],
      ['[4,2]', '[4] | [2]', '[2,4]'],
      ['[1,3]', '[1] | [3]', '[1,3]'],
      ['top', '', 'merge([2,4],[1,3]) = [1,2,3,4]'],
    ],
  },
  complexity: { time: 'O(n log n)', space: 'O(log n)', explanation: 'log n levels of recursion, O(n) merge work per level; the only extra memory is the call stack.' },
  alternative: {
    title: 'Copy into an array',
    md: 'Read values, sort numerically, write them back into the same nodes.',
    code: `function sortList(head) {
  const vals = listToArray(head).sort((a, b) => a - b);
  let p = head;
  for (const v of vals) { p.val = v; p = p.next; }
  return head;
}`,
    complexity: 'O(n log n) time, O(n) space',
  },
  mistakes: [
    'Splitting at the second middle → infinite recursion on 2-node lists.',
    'Not cutting `slow.next = null` before recursing.',
    'Using `.sort()` without a comparator in the array version — JS sorts lexicographically.',
  ],
};
