export default {
  signals: [
    '"intersection of two linked lists" → switch heads when a pointer runs out',
    '"partition list" / "odd even list" → build two lists with two dummies, then join',
    '"rotate list by k" → close it into a ring and cut at n − k % n',
    '"delete this node" when you are not given the head → copy the next node in',
    '"add two numbers" stored as digit lists → carry loop with a dummy head',
    '"copy list with random pointer" → Map from old node to new node',
    '"remove all duplicates from a sorted list" (keep none) → dummy + skip whole runs',
  ],
  tricks: [
    {
      title: 'Intersection: let each pointer walk both lists',
      kind: 'recognition',
      md: 'Pointer `a` walks list A then list B; pointer `b` walks B then A. Both travel exactly lenA + lenB nodes, so they line up and meet at the first shared node — or both reach `null` together if there is none. No lengths, no extra space, and it compares **node identity**, not values.',
      code: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
function getIntersectionNode(headA, headB) {
  let a = headA, b = headB;
  while (a !== b) {
    a = a ? a.next : headB;
    b = b ? b.next : headA;
  }
  return a;
}
const shared = new ListNode(8, new ListNode(4));
const A = new ListNode(4, new ListNode(1, shared));
const B = new ListNode(5, new ListNode(6, new ListNode(1, shared)));
console.log(getIntersectionNode(A, B).val, getIntersectionNode(A, new ListNode(9))); // 8 null`,
    },
    {
      title: 'Partition with two dummy heads — and cut the tail',
      kind: 'template',
      md: 'Append each node to one of two growing lists (`less`, `rest`), each started with its own dummy. Join `lessTail.next = rest.next` and set `restTail.next = null`. Forgetting that last line keeps the old `next` pointer of the final node, which can form a cycle and hang your print loop.',
      code: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
function partition(head, x) {
  const less = new ListNode(0), rest = new ListNode(0);
  let lt = less, rt = rest;
  for (let cur = head; cur; cur = cur.next) {
    if (cur.val < x) lt = lt.next = cur;
    else rt = rt.next = cur;
  }
  rt.next = null; // cut — avoids a cycle
  lt.next = rest.next;
  return less.next;
}
const toArr = (h) => { const a = []; for (; h; h = h.next) a.push(h.val); return a; };
const list = [1, 4, 3, 2, 5, 2].reduceRight((next, v) => new ListNode(v, next), null);
console.log(toArr(partition(list, 3))); // [ 1, 2, 2, 4, 3, 5 ]`,
    },
    {
      title: 'Rotate: make a ring, then cut it',
      kind: 'template',
      md: 'Walk once to find the length n and the tail. Connect `tail.next = head` (now it is a circle), move `n − k % n` steps from the old tail to reach the new tail, then set the new head and cut. Reducing `k % n` first matters: k can be far larger than n.',
      code: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
function rotateRight(head, k) {
  if (!head) return head;
  let n = 1, tail = head;
  while (tail.next) { tail = tail.next; n++; }
  tail.next = head; // ring
  for (let steps = n - (k % n); steps > 0; steps--) tail = tail.next;
  const newHead = tail.next;
  tail.next = null; // cut
  return newHead;
}
const toArr = (h) => { const a = []; for (; h; h = h.next) a.push(h.val); return a; };
const list = [1, 2, 3, 4, 5].reduceRight((next, v) => new ListNode(v, next), null);
console.log(toArr(rotateRight(list, 7))); // [ 4, 5, 1, 2, 3 ]`,
    },
    {
      title: 'Delete a node you only have a pointer to',
      kind: 'edge-cases',
      md: 'Without the previous node you cannot unlink the current one. Instead, copy the **next** node\'s value into it and unlink the next node. It only works when the node is not the tail — say so in an interview, and mention that it changes which node object holds which value (a problem if others hold references).',
      code: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
function deleteNode(node) {
  node.val = node.next.val;
  node.next = node.next.next;
}
const head = [4, 5, 1, 9].reduceRight((next, v) => new ListNode(v, next), null);
deleteNode(head.next); // delete the 5
const out = [];
for (let c = head; c; c = c.next) out.push(c.val);
console.log(out); // [ 4, 1, 9 ]`,
    },
    {
      title: 'Carry loops: keep going while either list or the carry remains',
      kind: 'template',
      md: 'Write the loop condition as `while (a || b || carry)` and treat a missing node as 0. One loop handles different lengths and the final carry (999 + 1) with no clean-up code after it. A dummy head avoids special-casing the first digit.',
      code: `class ListNode { constructor(val, next = null) { this.val = val; this.next = next; } }
function addTwoNumbers(a, b) {
  const dummy = new ListNode(0);
  let tail = dummy, carry = 0;
  while (a || b || carry) {
    const sum = (a?.val ?? 0) + (b?.val ?? 0) + carry;
    carry = Math.floor(sum / 10);
    tail = tail.next = new ListNode(sum % 10);
    a = a?.next; b = b?.next;
  }
  return dummy.next;
}
const mk = (arr) => arr.reduceRight((next, v) => new ListNode(v, next), null);
const out = []; for (let c = addTwoNumbers(mk([9, 9, 9]), mk([1])); c; c = c.next) out.push(c.val);
console.log(out); // [ 0, 0, 0, 1 ]`,
    },
    {
      title: 'Copying a list with extra pointers: Map old → new',
      kind: 'recognition',
      md: 'Any "deep copy" of a pointer structure (random pointers, graphs) follows the same plan: pass 1 creates a new node for every old node and records it in a `Map`; pass 2 wires `next` and `random` by looking up the copies. `Map` keys compare by object identity, which is exactly what you need here. (An O(1)-space version interleaves copies into the original list.)',
      code: `function copyRandomList(head) {
  const copy = new Map([[null, null]]);
  for (let c = head; c; c = c.next) copy.set(c, { val: c.val, next: null, random: null });
  for (let c = head; c; c = c.next) {
    copy.get(c).next = copy.get(c.next);
    copy.get(c).random = copy.get(c.random);
  }
  return copy.get(head);
}
const n2 = { val: 2, next: null, random: null };
const n1 = { val: 1, next: n2, random: n2 };
n2.random = n2;
const c = copyRandomList(n1);
console.log(c.val, c.random.val, c !== n1, c.random !== n2); // 1 2 true true`,
    },
    {
      title: 'Debug-print with a step limit',
      kind: 'javascript',
      md: 'A wiring bug often creates a cycle, and a plain `while (cur)` print loop then freezes the tab or test runner. Give your debug helper a step cap and a marker, so a cycle shows up as output instead of a hang.',
      code: `function show(head, limit = 20) {
  const parts = [];
  for (let c = head, i = 0; c; c = c.next, i++) {
    if (i === limit) { parts.push('…(cycle?)'); break; }
    parts.push(c.val);
  }
  return parts.join(' → ');
}
const a = { val: 1, next: null }, b = { val: 2, next: a };
a.next = b; // accidental cycle
console.log(show(b, 5)); // 2 → 1 → 2 → 1 → 2 → …(cycle?)`,
    },
    {
      title: 'Prefer iteration over recursion for long lists',
      kind: 'javascript',
      md: 'Recursive reverse/merge looks elegant but uses one stack frame per node. Lists with ~10^4+ nodes can throw `RangeError: Maximum call stack size exceeded` in JS. Write the iterative version by default and mention the recursive one only as an alternative, noting its O(n) stack space.',
    },
    {
      title: 'Clarify the rules before touching pointers',
      kind: 'interview',
      md: 'Ask: singly or doubly linked? Can I modify the input list? Must I move nodes, or may I swap values? (Swapping values is often simpler but many interviewers forbid it.) Can the list have a cycle? Each answer can change the approach, and asking shows you know the usual variations.',
    },
  ],
  traps: [
    {
      looksLike: 'Reverse the whole list to check for a palindrome',
      actually: 'Reverse only the second half (and restore it)',
      why: 'reversing the whole list in place destroys the original order you need to compare against; copying it costs O(n) space.',
    },
    {
      looksLike: 'Copy into an array, solve, rebuild the list',
      actually: 'In-place pointer manipulation',
      why: 'it works but uses O(n) space; interviewers usually expect O(1) extra space for list problems.',
    },
    {
      looksLike: 'Merge k sorted lists one after another',
      actually: 'Min-heap of heads, or pairwise divide-and-conquer merging',
      why: 'sequential merging re-walks the growing result k times, O(k·N); the heap or pairing gives O(N log k).',
    },
  ],
  sources: [
    { label: 'Tech Interview Handbook — Linked list cheatsheet', url: 'https://www.techinterviewhandbook.org/algorithms/linked-list/' },
    { label: 'MDN — Map (object keys compare by reference)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map' },
  ],
};
