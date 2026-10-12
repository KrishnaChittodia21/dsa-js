export default {
  id: 'linked-list',
  summary: 'A chain of nodes where each node points to the next one. Problems are about rewiring those pointers safely: dummy heads, in-place reversal, fast & slow pointers, merging/splitting, and caches built from a hash map plus a doubly linked list.',

  jsTools: [
    { api: 'ListNode (toolkit)', use: '`new ListNode(val, next)` — the same node shape LeetCode uses', complexity: 'O(1) to create' },
    { api: 'arrayToList / listToArray (toolkit)', use: 'Build a list from an array and read it back while debugging', complexity: 'O(n)' },
    { api: 'Map', use: 'Key → node lookup for LRU/LFU caches; keeps insertion order', complexity: 'get / set / delete: O(1) average' },
    { api: 'map.keys().next().value', use: 'Oldest key of a Map (insertion order) — the one-line LRU eviction trick', complexity: 'O(1)' },
    { api: 'Set', use: 'Visited nodes for the O(n)-space cycle check (stores object references)', complexity: 'O(1) average' },
    { api: 'Destructuring swap', use: '`[prev, cur.next, cur] = [cur, prev, cur.next]` — compact reversal step (evaluate RHS first!)', complexity: 'O(1)' },
  ],

  patterns: [
    {
      id: 'linked-list-dummy-node',
      name: 'Linked List — Dummy (Sentinel) Head',
      summary: 'Put a fake node before the real head so that "insert/delete at the head" is no longer a special case. Return dummy.next at the end.',
      whyItExists: 'Most pointer operations need "the node before" the one you change. The real head has no node before it, which forces an `if (head is affected)` branch. A dummy node gives every real node a predecessor, so one code path handles all positions.',
      whenToUse: [
        'You build a new list node by node (merge, partition, add two numbers)',
        'The head itself may be deleted or replaced (remove nth from end, remove elements)',
        'You reverse or rearrange a segment that might start at the head',
      ],
      clues: ['"return the head of the modified list"', '"remove the nth node"', '"merge two sorted lists"', '"the head may change"', '"sum as a linked list"'],
      whenNotToUse: [
        'Read-only traversals (length, middle, cycle detection) — nothing is rewired',
        'Problems that return a value, not a list',
      ],
      template: `function build(head) {
  const dummy = new ListNode(0, head); // dummy.next is the real head
  let tail = dummy;                    // last node of the answer so far
  // ... tail.next = someNode; tail = tail.next;
  return dummy.next;                   // the (possibly new) head
}`,
      variations: [
        { name: 'Builder dummy', description: 'Append nodes to `tail` while scanning inputs (merge two lists, add two numbers).' },
        { name: 'Predecessor dummy', description: 'Walk `prev` from the dummy to the node before the one to delete / the segment to reverse.' },
        { name: 'Two dummies', description: 'Partition list: one dummy for "< x", one for "≥ x", then join.' },
      ],
      mistakes: [
        'Returning `dummy` instead of `dummy.next`',
        'Returning the old `head` variable after the head was removed or moved',
        'Forgetting to terminate the built list (`tail.next = null`) when reusing nodes, leaving a cycle',
      ],
      evolution: {
        easy: 'Merge two sorted lists, remove all nodes with value x.',
        medium: 'Remove nth from end (dummy + gap pointers), add two numbers, partition list.',
        hard: 'Dummy as the fixed anchor for repeated segment reversals (reverse nodes in k-group).',
      },
    },
    {
      id: 'linked-list-in-place-reversal',
      name: 'Linked List — In-place Reversal',
      summary: 'Walk the list with prev/cur/next pointers and flip each `next` arrow backwards. Full reversal, reversal of a segment [left, right], or reversal of every block of k nodes.',
      whyItExists: 'A singly linked list can only be walked forwards. Reversing it (or part of it) lets you read it backwards, compare halves, or reorder blocks with O(1) extra space instead of copying into an array.',
      whenToUse: [
        'Reverse the whole list or a sub-range',
        'Compare the list with its reverse (palindrome) in O(1) space',
        'Reorder by interleaving the first half with the reversed second half',
        'Operate on fixed-size groups of nodes (k-group)',
      ],
      clues: ['"reverse"', '"from position left to right"', '"in groups of k"', '"palindrome" with O(1) space', '"reorder L0 → Ln → L1 → Ln-1"'],
      whenNotToUse: [
        'When extra O(n) space is fine and clarity matters more — an array copy is simpler',
        'When the input list must not be modified (or restore it afterwards)',
      ],
      template: `function reverse(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next; // 1. save the rest of the list
    cur.next = prev;       // 2. flip the arrow
    prev = cur;            // 3. advance prev
    cur = next;            // 4. advance cur
  }
  return prev;             // new head
}`,
      variations: [
        { name: 'Full reversal', description: 'Iterative prev/cur/next, or recursive `head.next.next = head`.' },
        { name: 'Partial reversal [left, right]', description: 'Walk `prev` to node left−1 (from a dummy), then repeatedly move the node after `cur` to the front of the segment ("head insertion").' },
        { name: 'k-group reversal', description: 'Check that k nodes remain, reverse them, reconnect the previous group tail to the new group head, move on.' },
      ],
      mistakes: [
        'Overwriting `cur.next` before saving it — the rest of the list is lost',
        'Returning `head` (now the tail) instead of `prev`',
        'In partial reversal, forgetting to reconnect both ends of the segment',
        'In k-group, reversing the last group even if it has fewer than k nodes',
      ],
      evolution: {
        easy: 'Reverse the entire list; palindrome check via reversing the second half.',
        medium: 'Reverse between positions left and right in one pass; reorder list.',
        hard: 'Reverse nodes in k-group with O(1) extra space.',
      },
    },
    {
      id: 'linked-list-fast-slow',
      name: 'Linked List — Fast & Slow Pointers',
      summary: 'Move one pointer one step and another two steps. Where they end up (or whether they meet) tells you the middle, whether there is a cycle, and where the cycle starts.',
      whyItExists: 'A linked list has no length or index. Two pointers moving at different speeds reveal positional facts (middle, k-th from end, cycles) in one pass with O(1) space, where the naive approach would need a length pass or a hash set.',
      whenToUse: [
        'Find the middle node (split for merge sort, palindrome, reorder)',
        'Detect a cycle (Floyd\'s tortoise and hare)',
        'Find the node where a cycle begins',
        'Any sequence x → f(x) that must eventually repeat (happy number, find the duplicate) — an implicit linked list',
      ],
      clues: ['"middle of the list"', '"has a cycle"', '"where the cycle begins"', '"O(1) extra space"', '"repeat the process until it loops endlessly"', '"n + 1 numbers in range [1, n]"'],
      whenNotToUse: [
        'You need random access by index — convert to an array',
        'Values do not form a function x → f(x) (for implicit lists)',
      ],
      template: `function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;       // 1 step
    fast = fast.next.next;  // 2 steps
  }
  return slow; // 2nd middle for even length
}

function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
      variations: [
        { name: 'Middle (second of two)', description: '`while (fast && fast.next)` starting both at head.' },
        { name: 'Middle (first of two)', description: '`while (fast.next && fast.next.next)` — useful to split a list for merge sort.' },
        { name: 'Cycle entry', description: 'After meeting, reset one pointer to head; move both one step at a time — they meet at the entry.' },
        { name: 'Gap pointers', description: 'Move `fast` n steps first, then both together: slow ends n nodes from the end.' },
        { name: 'Implicit list', description: 'Pointers are values: `slow = f(slow)`, `fast = f(f(fast))`.' },
      ],
      mistakes: [
        'Loop condition `while (fast.next)` crashes when fast is null — check `fast && fast.next`',
        'Comparing `slow.val === fast.val` instead of node identity `slow === fast`',
        'Checking `slow === fast` before moving (they start equal)',
      ],
      evolution: {
        easy: 'Middle of the list, detect a cycle, happy number.',
        medium: 'Cycle entry point, remove nth from end, palindrome list, find the duplicate number.',
        hard: 'Combine with reversal and merging (reorder list, sort list).',
      },
    },
    {
      id: 'linked-list-merge-split',
      name: 'Linked List — Merge & Split',
      summary: 'Split a list into parts (at the middle, by parity, by value) and merge sorted lists by repeatedly attaching the smaller head to a tail pointer.',
      whyItExists: 'Linked lists cannot be indexed, so array algorithms like quicksort are awkward. But merging two sorted lists is O(1) extra space by relinking nodes, which makes merge sort the natural O(n log n) sort for lists.',
      whenToUse: [
        'Merge two (or k) sorted lists',
        'Sort a list in O(n log n)',
        'Rearrange: split, transform one part (reverse), then weave back (reorder list)',
      ],
      clues: ['"merge sorted lists"', '"sort the list in O(n log n)"', '"reorder"', '"odd/even positions"', '"partition around x"'],
      whenNotToUse: [
        'Merging k lists — a heap is better than merging one by one (see Heaps topic)',
      ],
      template: `function merge(a, b) {
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; a = a.next; }
    else { tail.next = b; b = b.next; }
    tail = tail.next;
  }
  tail.next = a ?? b; // attach the leftover
  return dummy.next;
}`,
      variations: [
        { name: 'Merge two sorted lists', description: 'Dummy + tail; `<=` keeps it stable.' },
        { name: 'Merge sort on a list', description: 'Split at the first middle, cut `mid.next = null`, sort both halves, merge.' },
        { name: 'Split + reverse + weave', description: 'Reorder list: middle, reverse second half, alternate nodes.' },
      ],
      mistakes: [
        'Not cutting the list at the middle (`mid.next = null`) → infinite recursion in merge sort',
        'Using the second middle for splitting a 2-node list → one half is empty forever',
        'Forgetting to attach the leftover part after the loop',
      ],
      evolution: {
        easy: 'Merge two sorted lists.',
        medium: 'Sort list (merge sort), reorder list, add two numbers (merge-like walk with carry).',
        hard: 'Merge k sorted lists (heap / divide and conquer), bottom-up merge sort in O(1) space.',
      },
    },
    {
      id: 'linked-list-cache-design',
      name: 'Linked List — Hash Map + Doubly Linked List (LRU / LFU)',
      summary: 'A Map gives O(1) lookup of a node; a doubly linked list gives O(1) move-to-front and remove-from-back. Together they implement caches with O(1) get and put.',
      whyItExists: 'A cache must find an item fast (hash map) AND know which item to evict (an ordering). Arrays re-order in O(n). A doubly linked list re-orders in O(1) if you already hold the node — and the Map hands you the node.',
      whenToUse: [
        'Design an LRU cache: evict the least recently used key',
        'Design an LFU cache: evict the least frequently used key, ties by recency',
        'Any "ordered set with O(1) move/remove by key" (e.g. all-O(1) data structure)',
      ],
      clues: ['"design a cache"', '"least recently used"', '"least frequently used"', '"get and put must run in O(1)"', '"evict when capacity is exceeded"'],
      whenNotToUse: [
        'You only need insertion order and no re-ordering → a plain Map or Queue',
        'Eviction by arbitrary priority → a heap',
      ],
      template: `class Node { constructor(k, v) { this.key = k; this.val = v; this.prev = this.next = null; } }
class LRU {
  constructor(cap) {
    this.cap = cap; this.map = new Map();
    this.head = new Node(); this.tail = new Node(); // sentinels
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  _remove(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  _addFront(n) { n.next = this.head.next; n.prev = this.head; this.head.next.prev = n; this.head.next = n; }
}`,
      variations: [
        { name: 'LRU with DLL', description: 'Most recent at the front; evict `tail.prev`.' },
        { name: 'LRU with Map order', description: 'JS Map iterates in insertion order: delete + re-set a key moves it to the end; `map.keys().next().value` is the oldest.' },
        { name: 'LFU', description: 'Map key → node, Map freq → DLL of nodes (or an ordered Map), and a `minFreq` counter.' },
      ],
      mistakes: [
        'Storing only the value in the DLL node — on eviction you need the key to delete it from the Map',
        'Forgetting to move a key to the front on `get` (a read counts as a use)',
        'Updating an existing key\'s value without refreshing its recency / frequency',
        'LFU: forgetting to reset `minFreq = 1` when a new key is inserted',
      ],
      evolution: {
        easy: 'Design a linked list / a hash map with chaining.',
        medium: 'LRU cache.',
        hard: 'LFU cache, all-O(1) data structure.',
      },
    },
  ],

  lesson: {
    sections: [
      {
        id: 'what',
        title: 'What is it?',
        blocks: [
          {
            type: 'text',
            md: `A **linked list** is a chain of little boxes. Each box holds a value and an arrow to the next box. The last box points to nothing (\`null\`).

\`\`\`text
head
 │
 ▼
[1 | •]──▶[2 | •]──▶[3 | •]──▶ null
\`\`\`

Unlike an array, the boxes are **not** stored next to each other in memory. The only way to reach box 3 is to start at the head and follow the arrows: 1 → 2 → 3.

In JavaScript (and on LeetCode) a box is a \`ListNode\`:

\`\`\`js
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}
\`\`\`

\`ListNode\`, \`arrayToList([1,2,3])\` and \`listToArray(head)\` are available as globals in the practice editor.`,
          },
          {
            type: 'callout',
            variant: 'definition',
            title: 'Formal terms',
            md: `- **Node** — one box: a value plus a pointer (\`next\`).
- **Pointer / reference** — a variable that *refers to* a node object. In JS every object variable is a reference: \`a = b\` makes both names point at the same node; it does not copy it.
- **Head** — the first node. The list *is* its head: if you lose the head, you lose the list.
- **Tail** — the last node (\`tail.next === null\`).
- **Singly / doubly linked** — nodes have only \`next\`, or both \`next\` and \`prev\`.
- **Cycle** — some node's \`next\` points back to an earlier node, so walking never reaches \`null\`.`,
          },
          {
            type: 'callout',
            variant: 'analogy',
            title: 'Real-world analogy',
            md: 'A treasure hunt: each clue tells you where the next clue is hidden. You cannot jump to clue 7 — you must follow clues 1 to 6. But inserting a new clue is easy: change one clue to point to the new one, and make the new one point to where the old one used to.',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-1',
            question: 'You run `let a = head; a = a.next;`. What happened to the list?',
            options: [
              'The first node was deleted from the list',
              'Nothing — only the local variable `a` moved; `head` and every `next` arrow are unchanged',
              'The whole list was copied into `a`',
              'head now points to the second node too',
            ],
            answer: 1,
            explanation: 'Assigning to a variable only changes **what that variable refers to**. The list structure changes only when you assign to a **property**: `something.next = ...`. This distinction — moving a pointer vs. rewiring a node — is the heart of every linked-list problem.',
            misconceptions: {
              0: 'Deleting requires changing an arrow (`prev.next = cur.next`). Moving a local variable never deletes anything.',
              2: 'Objects are never copied by assignment in JS; `a` is just another name for an existing node.',
              3: '`head` is a separate variable; reassigning `a` does not touch it.',
            },
            deeper: 'Rule of thumb: `x = y` moves a finger; `x.next = y` redraws an arrow. Before writing a line, ask "am I moving a finger or redrawing an arrow?"',
          },
        ],
      },
      {
        id: 'why',
        title: 'Why do we need it?',
        blocks: [
          {
            type: 'text',
            md: `Arrays and linked lists make opposite trade-offs:

| Operation | Array | Linked list |
|---|---|---|
| Read the i-th element | **O(1)** | O(i) — walk from head |
| Insert/delete at the front | O(n) — shift everything | **O(1)** |
| Insert/delete after a node you hold | O(n) | **O(1)** — change two arrows |
| Extra memory per element | none | one pointer (two for doubly) |

Linked lists shine when you **already hold a node** and want to insert, remove or move it without shifting anything. That is exactly what an LRU cache needs, what queues need, and why operating systems and memory allocators use them.

In interviews, linked lists test whether you can **rewire pointers without losing parts of the structure** — a skill you will reuse in trees and graphs.`,
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-2',
            question: 'You need a structure where you frequently remove an element you already have a reference to, from the middle, in O(1). Which fits best?',
            options: [
              'A JavaScript array with `splice`',
              'A sorted array with binary search',
              'A singly linked list where you only hold the node itself',
              'A doubly linked list (each node knows its prev and next)',
            ],
            answer: 3,
            explanation: 'Removing a node means making its predecessor skip it: `node.prev.next = node.next; node.next.prev = node.prev`. A doubly linked node knows its predecessor, so this is O(1).',
            misconceptions: {
              0: '`splice` shifts every element after the index — O(n).',
              1: 'Binary search finds the position in O(log n) but removal still shifts elements — O(n).',
              2: 'In a singly linked list you need the node *before* it. Holding only the node means walking from the head to find the predecessor — O(n).',
            },
          },
        ],
      },
      {
        id: 'when',
        title: 'When should I use it?',
        blocks: [
          {
            type: 'text',
            md: `In interviews the list is usually **given** to you — the question is which technique to apply. Five techniques cover almost everything:

| Technique | Use it when… |
|---|---|
| **Dummy head** | the head may change, or you are building a new list |
| **In-place reversal** | "reverse", "palindrome in O(1) space", "reorder", "groups of k" |
| **Fast & slow pointers** | middle, cycle, cycle start, n-th from end, repeating sequences |
| **Merge & split** | merge sorted lists, sort a list, weave two halves |
| **Map + doubly linked list** | O(1) cache designs (LRU, LFU) |

When you are free to design: use a linked list when you need O(1) insert/remove at known positions and do **not** need random access.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'The O(n)-space escape hatch',
            md: 'Almost any list problem can be solved by copying values into an array (`listToArray`), solving it there, and rebuilding. It is a valid brute force to *mention*, but interviewers usually want the O(1)-space pointer solution.',
          },
        ],
      },
      {
        id: 'recognize',
        title: 'How do I recognize it?',
        blocks: [
          {
            type: 'recognition',
            clues: ['input is `head` of a ListNode', '"reverse" / "reorder" / "rotate"', '"cycle"', '"middle"', '"n-th from the end"', '"O(1) extra space"', '"design a cache with O(1) get/put"', '"sequence repeats" / "n+1 numbers in [1, n]"'],
            conclusion: 'Think pointer manipulation: dummy head, reversal, fast & slow, merge/split, or Map + DLL',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-3',
            question: '"Given an array of n + 1 integers, each in [1, n], find the duplicate without modifying the array and using O(1) extra space." Which linked-list technique applies?',
            options: [
              'Dummy head',
              'In-place reversal',
              'Fast & slow pointers on the implicit list i → nums[i]',
              'Map + doubly linked list',
            ],
            answer: 2,
            explanation: 'Treat each index as a node and `nums[i]` as its `next` pointer. Two indices point to the same value (the duplicate), so that value has two incoming arrows — it is the **entry of a cycle**. Floyd\'s cycle-entry algorithm finds it with O(1) space.',
            misconceptions: {
              0: 'There is no list to build or head to protect — the array is read-only.',
              1: 'Reversal would modify the structure, and there is no real list to reverse.',
              3: 'A Map would use O(n) space, which the problem forbids.',
            },
            deeper: 'Any function `f` from a finite set to itself, iterated from a start value, must eventually repeat — that is a "rho" (ρ) shaped path: a tail then a cycle. Whenever you see "keep applying a rule", think of the values as nodes and `f` as `next`.',
          },
        ],
      },
      {
        id: 'intuition',
        title: 'Core intuition',
        blocks: [
          {
            type: 'text',
            md: `Every linked-list algorithm is a sequence of two kinds of moves:

1. **Move a finger** (\`cur = cur.next\`) — cheap, harmless.
2. **Redraw an arrow** (\`cur.next = something\`) — changes the list. The moment you overwrite \`cur.next\`, the old "rest of the list" is unreachable **unless another variable still points to it**.

So the golden rule is: **before you redraw an arrow, save whatever it pointed to.**

The second big idea is that you often care about the node **before** the one you want to change. To delete node X you need \`prevOfX.next = X.next\`. This is why we walk with a \`prev\` pointer, and why a **dummy node** (a fake predecessor of the head) removes so many special cases.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why deleting the head is a "special case" without a dummy node?',
            deeper: `To delete a node you rewrite its predecessor's \`next\`. Every node has a predecessor **except the head**. So without a dummy you need:

\`\`\`js
if (head.val === target) head = head.next;  // special case
else prev.next = cur.next;                  // normal case
\`\`\`

With \`const dummy = new ListNode(0, head)\`, the head's predecessor is \`dummy\`, so only the normal case exists — and you return \`dummy.next\`, which is correct even if the original head was deleted.`,
          },
        ],
      },
      {
        id: 'brute-force',
        title: 'Brute-force approach',
        blocks: [
          {
            type: 'text',
            md: 'The universal brute force: **copy the values into an array, solve it with indices, rebuild the list**. For example, reversing:',
          },
          {
            type: 'code',
            title: 'Reverse via an array — O(n) time, O(n) space',
            code: `function reverseList(head) {
  const vals = listToArray(head);  // [1,2,3]
  vals.reverse();                  // [3,2,1]
  return arrayToList(vals);        // new nodes!
}`,
            caption: 'Correct, but it allocates n new nodes and O(n) memory. Interviewers will ask: "can you do it in O(1) extra space?"',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-4',
            question: 'Why might an interviewer reject the array-copy solution for "reverse a linked list" even though it is O(n) time?',
            options: [
              'Because `Array.prototype.reverse` is O(n²)',
              'Because it uses O(n) extra memory and creates new nodes instead of rewiring the existing ones',
              'Because arrays cannot store numbers from a linked list',
              'Because listToArray does not work on long lists',
            ],
            answer: 1,
            explanation: 'The point of the question is pointer manipulation. The optimal solution rewires the `next` arrows of the existing nodes in place with three variables — O(1) extra space. Some callers also hold references to the original nodes and expect them to be reused.',
            misconceptions: {
              0: '`reverse()` is O(n) — it swaps pairs from both ends.',
              2: 'Arrays can store anything; that is not the issue.',
              3: 'It works on any finite list; the issue is memory and the skill being tested.',
            },
          },
        ],
      },
      {
        id: 'optimized-dummy',
        title: 'Optimized approach — dummy head',
        blocks: [
          {
            type: 'text',
            md: `A **dummy node** (also called a *sentinel*) is a throw-away node placed before the real head. It has two jobs:

1. **Builder:** when you create a new list, keep a \`tail\` pointer starting at the dummy and do \`tail.next = node; tail = node\`. No "is the list empty yet?" check.
2. **Predecessor:** when you delete or rewire starting at the head, the dummy is the head's "previous" node.

At the end you return \`dummy.next\` — the real (possibly new) head.`,
          },
          {
            type: 'code',
            title: 'Remove the n-th node from the end — dummy + gap pointers, one pass',
            code: `function removeNthFromEnd(head, n) {
  const dummy = new ListNode(0, head);
  let fast = dummy, slow = dummy;
  for (let i = 0; i < n; i++) fast = fast.next; // open a gap of n nodes
  while (fast.next) {                           // move until fast is the LAST node
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;   // slow is the node BEFORE the target
  return dummy.next;            // correct even when the head was removed
}`,
            caption: 'Starting both pointers at the dummy (not the head) is what makes slow stop one node early — exactly where a deletion needs it.',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-5',
            question: 'In `removeNthFromEnd([1], 1)` the only node is removed. With the dummy version, what is returned and why is it right?',
            options: [
              '`head` — the original first node',
              '`dummy` — the sentinel node with value 0',
              '`dummy.next`, which is now `null` — the correct empty list',
              'It throws, because slow.next.next is undefined',
            ],
            answer: 2,
            explanation: 'The gap loop moves fast to node 1, the while loop does not run (fast.next is null), so slow is still the dummy. `slow.next = slow.next.next` sets `dummy.next = null`. Returning `dummy.next` gives the empty list. Returning `head` would return the deleted node.',
            misconceptions: {
              0: '`head` still refers to the removed node. That is exactly the bug the dummy protects against.',
              1: 'The dummy is fake — it must never appear in the answer.',
              3: '`slow.next` is node 1 and `node1.next` is `null`, so `slow.next.next` is `null`, not an error.',
            },
          },
        ],
      },
      {
        id: 'intuition-reversal',
        title: 'Core intuition — in-place reversal',
        blocks: [
          {
            type: 'text',
            md: `To reverse a list we flip every arrow. At each step we hold three fingers:

- \`prev\` — the already-reversed part (starts as \`null\`)
- \`cur\` — the node we are about to flip
- \`next\` — the rest of the list, **saved before we flip** so we do not lose it

\`\`\`text
null ← 1 ← 2    3 → 4 → null
       prev↑   cur↑ next↑
\`\`\`

Four lines per step: save next, flip, advance prev, advance cur. When \`cur\` falls off the end, \`prev\` is the new head.`,
          },
          {
            type: 'visual',
            scenario: 'linked-list-reverse',
            input: { values: [1, 2, 3, 4, 5] },
            caption: 'Watch prev, cur and next: each step flips exactly one arrow.',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-6',
            question: 'What goes wrong if you write the loop body as `cur.next = prev; prev = cur; cur = cur.next;`?',
            options: [
              'Nothing — it is the same algorithm in a different order',
              'After `cur.next = prev`, `cur.next` is the previous node, so `cur = cur.next` walks BACKWARDS and the rest of the list is lost',
              'It reverses the list twice, giving back the original',
              'It only fails for lists of even length',
            ],
            answer: 1,
            explanation: 'The flip overwrote the only reference to the rest of the list. That is why the first line must be `const next = cur.next`. After flipping, `cur.next` means "the node behind me", so the loop steps back to `prev` (and stops at `null` after one iteration — the list is truncated).',
            misconceptions: {
              0: 'Order matters with pointer writes: reading `cur.next` after writing it reads the new value.',
              2: 'The loop does not even reach the third node — it steps back to the reversed part.',
              3: 'It fails for any list with at least two nodes, regardless of parity.',
            },
            deeper: 'A safe habit: in any pointer update, first save everything you will still need, then do all the writes. Destructuring can do it in one line: `[cur.next, prev, cur] = [prev, cur, cur.next]` — the right-hand side is fully evaluated before any assignment.',
          },
        ],
      },
      {
        id: 'optimized-reversal',
        title: 'Optimized approach — full, partial and k-group reversal',
        blocks: [
          {
            type: 'code',
            title: 'Full reversal — iterative, O(1) space',
            code: `function reverseList(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}`,
          },
          {
            type: 'code',
            title: 'Full reversal — recursive, O(n) stack',
            code: `function reverseList(head) {
  if (!head || !head.next) return head;
  const newHead = reverseList(head.next); // reverse the rest
  head.next.next = head;                  // the node after me now points to me
  head.next = null;                       // I become the tail
  return newHead;
}`,
            caption: 'Elegant, but uses O(n) call stack — a 10^5-node list can overflow the JS stack. Prefer the iterative version.',
          },
          {
            type: 'text',
            md: `**Partial reversal (positions left..right, 1-indexed).** Walk \`prev\` from a dummy to node \`left − 1\`. Let \`cur = prev.next\` (it will end up as the segment's tail). Then, \`right − left\` times, take the node **after** \`cur\` and move it to the front of the segment:

\`\`\`js
const move = cur.next;
cur.next = move.next;     // unlink it
move.next = prev.next;    // put it at the front of the segment
prev.next = move;
\`\`\`

This is called **head insertion**. Both ends stay connected at every step, so there is nothing to "reconnect" at the end.

**k-group reversal.** Repeat: from \`groupPrev\`, check that k nodes exist (else stop — the leftover stays as is), reverse those k nodes, link \`groupPrev.next\` to the new group head, and set \`groupPrev\` to the old group head (now the group tail).`,
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-7',
            question: 'Reverse positions 2..4 of `1→2→3→4→5` with head insertion. After the first move (moving 3 in front of 2), what is the list?',
            options: [
              '1→3→2→4→5',
              '3→2→1→4→5',
              '1→2→4→3→5',
              '1→4→3→2→5',
            ],
            answer: 0,
            explanation: '`prev` is node 1, `cur` is node 2. The node after cur (3) is unlinked and inserted right after prev: 1→3→2→4→5. The second move takes 4 (still right after cur = 2) and inserts it after prev: 1→4→3→2→5, which is the final answer.',
            misconceptions: {
              1: 'Node 1 is outside the segment; `prev` never moves during head insertion.',
              2: 'We move the node after `cur` to the **front** of the segment (after prev), not swap neighbours.',
              3: 'That is the result after the **second** move, not the first.',
            },
          },
        ],
      },
      {
        id: 'intuition-fast-slow',
        title: 'Core intuition — fast & slow pointers',
        blocks: [
          {
            type: 'text',
            md: `Put two runners on the list. **Slow** moves 1 node per step, **fast** moves 2.

- **Middle:** when fast reaches the end, slow has covered half the distance — it is at the middle.
- **Cycle:** on a straight road fast simply finishes first. On a circular track the faster runner **laps** the slower one, so they must meet.

Why must they meet (and not jump over each other)? Once both are inside the cycle, look at the gap from fast to slow, measured along the cycle. Each step slow adds 1 and fast adds 2, so the gap **shrinks by exactly 1**. A gap that shrinks by 1 each step hits 0 — it cannot skip it. It takes at most one lap, so detection is O(n).`,
          },
          {
            type: 'visual',
            scenario: 'fast-slow-pointers',
            input: { values: [1, 2, 3, 4, 5, 6] },
            caption: 'Fast moves two nodes for every one slow moves; when fast runs out, slow is at the middle.',
          },
          {
            type: 'callout',
            variant: 'insight',
            title: 'Finding where the cycle starts (proof sketch)',
            md: `Let **a** = distance from head to the cycle entry, **c** = cycle length, and suppose they meet **b** steps past the entry.

- Slow walked \`a + b\`. Fast walked \`a + b + k·c\` for some whole number of extra laps \`k ≥ 1\`.
- Fast walks twice as far: \`2(a + b) = a + b + k·c\` → \`a + b = k·c\` → **\`a = k·c − b\`**.

\`k·c − b\` steps from the meeting point is exactly "go around to the entry (and maybe some full laps)". So: reset one pointer to **head**, keep the other at the **meeting point**, move **both one step at a time** — after \`a\` steps both stand on the entry.`,
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-8',
            question: 'After slow and fast meet inside the cycle, why do we move BOTH pointers one step at a time (not fast by two) to find the entry?',
            options: [
              'Because fast might overflow',
              'Because the proof shows head→entry distance a equals meeting-point→entry distance (mod c); equal distances need equal speeds',
              'Because moving by two would detect a second cycle',
              'It does not matter which speed we use',
            ],
            answer: 1,
            explanation: 'From `a = k·c − b`: walking `a` steps from the head and `a` steps from the meeting point land on the same node — the entry. That only works if both pointers walk the **same number** of steps, i.e. the same speed.',
            misconceptions: {
              0: 'Nothing overflows; this is about distances.',
              2: 'A singly linked list can have at most one cycle (each node has one next).',
              3: 'With different speeds they would cover different distances and generally meet somewhere else inside the cycle.',
            },
          },
          {
            type: 'text',
            md: `**Implicit linked lists.** The pointers do not have to be \`ListNode\`s. Any rule \`x → f(x)\` over a finite set forms a path that eventually loops:

- **Happy number:** \`f(n)\` = sum of squares of digits. Either the sequence reaches 1 (and stays: 1 → 1) or it cycles forever. Run Floyd with \`slow = f(slow)\`, \`fast = f(f(fast))\` and check whether they meet at 1.
- **Find the duplicate number:** indices are nodes, \`next(i) = nums[i]\`. Starting from index 0 (no value points to 0, since values are in [1, n]) we walk a tail into a cycle. The duplicate value has two incoming arrows, so it is the **cycle entry** — found with the two-phase Floyd above.`,
          },
          {
            type: 'reflect',
            prompt: 'Do you understand why the duplicate is exactly the cycle *entry*, not just some node on the cycle?',
            deeper: 'The entry is the only node on the path with **two** predecessors: one from the tail and one from the end of the cycle. In the implicit list, a node with two incoming arrows is a value `v` with two indices `i ≠ j` where `nums[i] = nums[j] = v` — that is the definition of the duplicate. Every other node on the path has exactly one predecessor on the path.',
          },
        ],
      },
      {
        id: 'optimized-merge-split',
        title: 'Optimized approach — merge, split, sort and reorder',
        blocks: [
          {
            type: 'text',
            md: `**Merging two sorted lists** is the dummy/tail builder: compare the two heads, attach the smaller one, advance that list. When one list runs out, attach the other in one move — it is already sorted.

**Sort a list in O(n log n):** merge sort fits lists perfectly.
1. Find the **first** middle with fast & slow (\`fast = head.next\` initially), so a 2-node list splits into 1 + 1.
2. Cut: \`const right = mid.next; mid.next = null;\`
3. Recursively sort both halves, then merge.

Merging relinks existing nodes, so the merge step needs no extra array (unlike array merge sort).

**Reorder list** (\`L0 → Ln → L1 → Ln-1 → …\`) combines three techniques:
1. **Split** at the middle (fast & slow).
2. **Reverse** the second half.
3. **Weave**: alternately take one node from each half.`,
          },
          {
            type: 'visual',
            scenario: 'merge-sort',
            input: { nums: [4, 2, 1, 3] },
            caption: 'Same divide & conquer as array merge sort — on a list, "split" is fast & slow and "merge" relinks nodes.',
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-9',
            question: 'Your list merge sort finds the middle with `slow = head, fast = head; while (fast && fast.next)` and splits after slow. On a 2-node list it recurses forever. Why?',
            options: [
              'Because merge is wrong for 2 nodes',
              'Because that loop returns the SECOND middle; for 2 nodes slow is the second node, so the left half is the whole list again',
              'Because recursion is not allowed on linked lists',
              'Because you must sort the right half first',
            ],
            answer: 1,
            explanation: 'For `[a, b]` that loop ends with slow = b. Splitting after b gives left = [a, b], right = [] — the same problem again, forever. Start fast one ahead (`fast = head.next`) to get the **first** middle, so [a, b] splits into [a] + [b].',
            misconceptions: {
              0: 'Merge handles any sizes; the bug is in the split.',
              2: 'Recursion is fine (depth is only log n for merge sort).',
              3: 'Order of recursive calls does not change the split.',
            },
          },
        ],
      },
      {
        id: 'optimized-cache',
        title: 'Optimized approach — LRU and LFU caches',
        blocks: [
          {
            type: 'text',
            md: `**LRU (Least Recently Used) cache:** \`get(key)\` and \`put(key, value)\` in O(1); when full, evict the key used longest ago.

- A **Map** from key → node answers "where is this key?" in O(1).
- A **doubly linked list** keeps keys ordered by recency. With a node in hand, "move to front" and "remove" are O(1) because each node knows its \`prev\`.
- Two sentinel nodes (\`head\`, \`tail\`) mean the list is never empty — no null checks.
- Nodes store their **key**, so when we evict \`tail.prev\` we can also \`map.delete(node.key)\`.`,
          },
          {
            type: 'callout',
            variant: 'tip',
            title: 'The JavaScript Map shortcut',
            md: `A JS \`Map\` remembers **insertion order**, and iteration starts from the oldest key. So:

- "mark as recently used" = \`map.delete(k); map.set(k, v)\` (moves it to the end)
- "least recently used" = \`map.keys().next().value\` (the first key)

That is a complete LRU in ~10 lines. It is great in practice — but in an interview, say you know the trick **and** be ready to build the Map + DLL version, since that is what is being tested.`,
          },
          {
            type: 'text',
            md: `**LFU (Least Frequently Used) cache:** evict the key with the smallest use count; ties broken by least recent.

- \`keyMap\`: key → { value, freq }
- \`freqMap\`: freq → an **ordered set of keys** with that frequency (a DLL, or in JS a \`Set\`/\`Map\`, which preserves insertion order — oldest first)
- \`minFreq\`: the smallest frequency currently present

On every use, move the key from bucket \`f\` to bucket \`f + 1\`; if bucket \`f\` became empty and \`f === minFreq\`, do \`minFreq++\`. On insert of a new key, evict the first key of \`freqMap.get(minFreq)\` if full, then set \`minFreq = 1\`.`,
          },
          {
            type: 'checkpoint',
            id: 'linked-list-cp-10',
            question: 'Why does the LRU doubly-linked-list node store the **key** and not only the value?',
            options: [
              'So that the list can be sorted by key',
              'Because JavaScript objects require a key property',
              'To make get() faster',
              'Because on eviction we remove the tail node and must also delete its entry from the Map — which needs its key',
            ],
            answer: 3,
            explanation: 'Eviction starts from the list side (`tail.prev`). To keep the Map consistent we must `map.delete(node.key)`. Without the key in the node, we would have to search the Map — O(n).',
            misconceptions: {
              0: 'The list is ordered by recency, never by key.',
              1: 'Objects can have any properties; nothing requires `key`.',
              2: '`get` looks up the Map by key directly; storing the key in the node does not affect it.',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Pattern / template',
        blocks: [
          {
            type: 'code',
            title: 'The five building blocks',
            code: `// 1. Dummy head + tail builder
const dummy = new ListNode(0, head);
let tail = dummy;

// 2. Reverse a list, return new head
function reverse(head) {
  let prev = null, cur = head;
  while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }
  return prev;
}

// 3. Middle (first middle for even length — good for splitting)
function firstMiddle(head) {
  let slow = head, fast = head.next;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}

// 4. Floyd: cycle entry or null
function cycleEntry(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p.next; slow = slow.next; }
      return p;
    }
  }
  return null;
}

// 5. Merge two sorted lists
function merge(a, b) {
  const d = new ListNode(); let t = d;
  while (a && b) {
    if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
    t = t.next;
  }
  t.next = a ?? b;
  return d.next;
}`,
          },
        ],
      },
      {
        id: 'implementation',
        title: 'JavaScript implementation',
        blocks: [
          {
            type: 'code',
            title: 'Palindrome linked list — fast & slow + reversal, O(1) space',
            code: `function isPalindrome(head) {
  // 1. find the middle
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  // 2. reverse the second half
  let prev = null;
  while (slow) { const next = slow.next; slow.next = prev; prev = slow; slow = next; }
  // 3. compare the halves
  let a = head, b = prev;
  while (b) {
    if (a.val !== b.val) return false;
    a = a.next; b = b.next;
  }
  return true;
}`,
            caption: 'Combining patterns is the norm: most medium list problems use two or three building blocks.',
          },
          {
            type: 'code',
            title: 'LRU cache — Map + doubly linked list with sentinels',
            code: `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();
    this.head = { prev: null, next: null };   // most recent side
    this.tail = { prev: this.head, next: null };
    this.head.next = this.tail;
  }
  _remove(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  _addFront(n) {
    n.prev = this.head; n.next = this.head.next;
    this.head.next.prev = n; this.head.next = n;
  }
  get(key) {
    const n = this.map.get(key);
    if (!n) return -1;
    this._remove(n); this._addFront(n);
    return n.val;
  }
  put(key, val) {
    if (this.map.has(key)) this._remove(this.map.get(key));
    const n = { key, val, prev: null, next: null };
    this._addFront(n);
    this.map.set(key, n);
    if (this.map.size > this.cap) {
      const lru = this.tail.prev;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }
}`,
          },
          {
            type: 'callout',
            variant: 'warning',
            title: 'JavaScript pitfalls',
            md: `- Compare nodes with \`===\` (identity), not by \`.val\` — two different nodes can hold the same value.
- Recursion over a 10^5-node list can hit "Maximum call stack size exceeded"; prefer loops.
- A \`Set\` of nodes works for cycle detection because objects are hashed by reference — but it is O(n) space.
- Printing a list with a cycle via \`console.log\` or JSON loops forever / throws; \`listToArray\` from the toolkit stops after 10^5 nodes.`,
          },
        ],
      },
      {
        id: 'dry-run',
        title: 'Dry run',
        blocks: [
          {
            type: 'dryrun',
            title: 'reverseList(1 → 2 → 3)',
            columns: ['step', 'prev', 'cur', 'next (saved)', 'arrow flipped', 'reversed part'],
            rows: [
              ['0', 'null', '1', '—', '—', '(empty)'],
              ['1', '1', '2', '2', '1 → null', '1'],
              ['2', '2', '3', '3', '2 → 1', '2 → 1'],
              ['3', '3', 'null', 'null', '3 → 2', '3 → 2 → 1'],
            ],
            note: 'cur is null → loop ends; return prev (node 3). Three nodes, three flips, three variables of extra space.',
          },
          {
            type: 'dryrun',
            title: 'Floyd on 3 → 2 → 0 → -4 → (back to 2)',
            columns: ['step', 'slow', 'fast', 'met?'],
            rows: [
              ['0', '3', '3', 'start'],
              ['1', '2', '0', 'no'],
              ['2', '0', '2', 'no'],
              ['3', '-4', '-4', 'yes → reset p = head'],
              ['4', 'p=2, slow=2', '', 'p === slow → entry is node 2'],
            ],
            note: 'a = 1 (head to entry), c = 3, meeting point b = 2 past entry: a + b = 3 = 1·c ✓',
          },
        ],
      },
      {
        id: 'mistakes',
        title: 'Common mistakes',
        blocks: [
          {
            type: 'text',
            md: `1. **Losing the rest of the list** — writing \`cur.next = …\` before saving the old \`cur.next\`.
2. **Null dereference** — \`fast.next.next\` when \`fast\` or \`fast.next\` is null. Always guard with \`fast && fast.next\`.
3. **Returning the wrong head** — returning \`head\` after reversal (it is now the tail) or after deleting it; return \`prev\` / \`dummy.next\`.
4. **Forgetting to cut** — after splitting, set \`mid.next = null\`; otherwise halves still overlap and recursion never ends.
5. **Accidental cycles** — reusing nodes without setting the new tail's \`next = null\` (e.g. reorder list, odd-even list).
6. **Comparing values instead of nodes** in cycle detection or intersection problems.
7. **Off-by-one in position problems** — LeetCode positions are usually **1-indexed**; start \`prev\` at a dummy and step \`left − 1\` times.`,
          },
          {
            type: 'reflect',
            prompt: 'Could you explain, without code, how to check your pointer code for bugs before running it?',
            deeper: 'Draw 3–4 boxes and arrows on paper and execute each line: for every `x.next = y` erase one arrow and draw a new one; for every `x = y` move a finger. Then test the three edge cases that break most list code: **empty list** (`head = null`), **one node**, and **two nodes**. If all three survive, the general case almost always works.',
          },
        ],
      },
      {
        id: 'complexity',
        title: 'Complexity',
        blocks: [
          {
            type: 'complexity',
            time: 'O(n) for single-pass techniques; O(n log n) for sort list; O(1) per LRU/LFU operation',
            space: 'O(1) extra for pointer techniques; O(log n) stack for top-down list merge sort; O(capacity) for caches',
            md: `- Reversal, middle, cycle detection, merge: each node is visited a constant number of times → **O(n)** time, **O(1)** extra space.
- Floyd: slow enters the cycle within \`a\` steps; the gap then closes by 1 per step, at most \`c\` steps → O(a + c) = **O(n)**.
- Sort list: log n levels of splitting, O(n) merge work per level → **O(n log n)**.
- LRU/LFU: Map lookups are O(1) **average** (hashing); DLL splices are O(1) worst case.
- Recursive versions add O(n) call-stack space (reversal) — mention it.`,
          },
        ],
      },
      {
        id: 'interview-tips',
        title: 'Interview tips',
        blocks: [
          {
            type: 'text',
            md: `- **Draw it.** Sketch nodes and arrows and narrate each pointer change — interviewers love seeing this.
- **Ask:** "Can I modify the list?" and "Is it singly or doubly linked?"
- **State edge cases up front:** empty list, one node, two nodes, the head changes, cycles.
- **Reach for a dummy node** whenever the head might change — say why ("it removes the head special case").
- **Name the proof:** for cycle entry, be ready to derive \`a = k·c − b\` in two lines.
- **For caches,** explain both structures' roles (Map = find, DLL = order) before coding, and mention the JS Map insertion-order shortcut.`,
          },
        ],
      },
      {
        id: 'js-tools',
        title: 'JavaScript tools',
        blocks: [
          {
            type: 'jsTools',
            items: [
              { api: 'new ListNode(val, next)', use: 'Create nodes (toolkit global, LeetCode shape)', complexity: 'O(1)' },
              { api: 'arrayToList(arr) / listToArray(head)', use: 'Build and inspect lists while testing', complexity: 'O(n)' },
              { api: 'a === b', use: 'Node identity — the right comparison for cycles/intersections', complexity: 'O(1)' },
              { api: 'new Map()', use: 'key → node for caches; iteration order = insertion order', complexity: 'O(1) average' },
              { api: 'map.keys().next().value', use: 'Oldest key (LRU eviction with the Map trick)', complexity: 'O(1)' },
              { api: 'new Set()', use: 'Visited nodes (O(n)-space cycle check) or ordered frequency buckets', complexity: 'O(1) average' },
              { api: 'a ?? b', use: 'Attach whichever list is non-null after merging', complexity: 'O(1)' },
            ],
          },
        ],
      },
    ],
  },

  cheatsheet: {
    whenToUse: ['Input is a linked list head', 'Head may change → dummy node', 'Reverse / reorder / palindrome in O(1) space', 'Middle / cycle / nth from end → fast & slow', 'O(1) cache → Map + doubly linked list'],
    clues: ['reverse', 'k-group', 'middle', 'cycle', 'nth from end', 'merge sorted', 'sort list', 'reorder', 'LRU', 'LFU', 'repeat until loop'],
    template: `let prev = null, cur = head;
while (cur) { const nx = cur.next; cur.next = prev; prev = cur; cur = nx; }

let slow = head, fast = head;
while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) break; }

const dummy = new ListNode(0, head); let tail = dummy; /* ... */ return dummy.next;`,
    complexity: 'O(n) time, O(1) space for pointer techniques; O(n log n) sort list; O(1) per cache op',
    mistakes: ['overwriting next before saving it', 'fast.next.next without null guard', 'returning head instead of prev/dummy.next', 'not cutting mid.next = null', 'comparing .val instead of node identity'],
    jsTools: ['ListNode', 'arrayToList', 'listToArray', 'Map', 'Set', '??'],
  },

  keyConcepts: [
    '`x = y` moves a pointer; `x.next = y` rewires the list — save what you will lose before rewiring.',
    'A dummy node gives the head a predecessor and removes head special cases; return dummy.next.',
    'Reversal needs three pointers: prev, cur and the saved next.',
    'Fast & slow: middle when fast ends; in a cycle the gap shrinks by 1 per step so they must meet.',
    'Cycle entry: a = k·c − b, so walking from head and from the meeting point at equal speed meets at the entry.',
    'Iterating any function over a finite set forms an implicit linked list (happy number, find the duplicate).',
    'Merge sort is the natural O(n log n) sort for lists: split with fast & slow, merge by relinking.',
    'Caches: Map finds the node, a doubly linked list keeps the order — both O(1).',
  ],

  interviewTips: [
    'Draw boxes and arrows and narrate every pointer change.',
    'Test empty, one-node and two-node lists before declaring victory.',
    'Use a dummy node whenever the head may change.',
    'Be ready to prove Floyd\'s cycle-entry trick and to build an LRU from scratch.',
  ],
};
