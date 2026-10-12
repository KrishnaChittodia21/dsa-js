// k = 1000, 2000 calls: inserts at both ends until full, then mostly deletes and reads; expected values come from a plain JS array.
const bigDequeOps = () => {
  let s = 22; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const k = 1000, d = [];
  const ops = ['MyCircularDeque'], args = [[k]], expected = [null];
  for (let i = 0; i < 1999; i++) {
    const pIns = i < 1300 ? 9 : 3, r = rnd(10), v = rnd(1001);
    const op = r < pIns ? (rnd(2) ? 'insertFront' : 'insertLast') : ['deleteFront', 'deleteLast', 'getFront', 'getRear', 'isEmpty', 'isFull'][rnd(6)];
    ops.push(op);
    if (op === 'insertFront' || op === 'insertLast') {
      args.push([v]);
      if (d.length < k) { if (op === 'insertFront') d.unshift(v); else d.push(v); expected.push(true); } else expected.push(false);
    } else {
      args.push([]);
      if (op === 'deleteFront' || op === 'deleteLast') { if (d.length) { if (op === 'deleteFront') d.shift(); else d.pop(); expected.push(true); } else expected.push(false); }
      else if (op === 'getFront') expected.push(d.length ? d[0] : -1);
      else if (op === 'getRear') expected.push(d.length ? d[d.length - 1] : -1);
      else if (op === 'isEmpty') expected.push(d.length === 0);
      else expected.push(d.length === k);
    }
  }
  return { ops, args, expected };
};

export default {
  id: 'design-circular-deque',
  title: 'Design Circular Deque',
  difficulty: 'Medium',
  order: 2,
  pattern: 'circular-buffer',
  kind: 'design',
  tags: ['deque', 'design', 'circular buffer'],
  source: { platform: 'LeetCode', number: 641, url: 'https://leetcode.com/problems/design-circular-deque/' },

  statement: `Implement a fixed-capacity **double-ended** queue in a circular array.

\`MyCircularDeque(k)\` supports:
- \`insertFront(value)\`, \`insertLast(value)\` — return \`true\` on success, \`false\` if full;
- \`deleteFront()\`, \`deleteLast()\` — return \`true\` on success, \`false\` if empty;
- \`getFront()\`, \`getRear()\` — return the value or \`-1\` if empty;
- \`isEmpty()\`, \`isFull()\`.`,
  examples: [
    { input: '["MyCircularDeque","insertLast","insertLast","insertFront","insertFront","getRear","isFull","deleteLast","insertFront","getFront"]\n[[3],[1],[2],[3],[4],[],[],[],[4],[]]', output: '[null,true,true,true,false,2,true,true,true,4]' },
  ],
  constraints: ['1 <= k <= 1000', '0 <= value <= 1000', 'At most 2000 calls'],

  think: `- You already know the circular queue. Which operations are new, and which way does \`head\` move for them?
- What is \`(0 − 1) % k\` in JavaScript, and how do you get a valid index instead?`,
  patternChallenge: {
    options: ['Two stacks', 'Doubly linked list only', 'Circular buffer with head moving both ways', 'Monotonic deque'],
    answer: 2,
    explanation: 'A ring buffer supports the front too: insertFront moves head one step back (wrapping), deleteFront moves it forward. A doubly linked list also works but allocates nodes; monotonic deque is an algorithmic pattern, not a container design.',
  },
  hints: [
    'Same fields as the circular queue: buf, head, count, cap.',
    'insertFront: head = (head − 1 + cap) % cap, then buf[head] = value. deleteLast: count--. Rear index = (head + count − 1) % cap.',
  ],
  approach: `**Ring buffer (O(1) everything):**
- \`insertLast\`: write at \`(head + count) % cap\`, \`count++\`.
- \`insertFront\`: \`head = (head − 1 + cap) % cap\`, write \`buf[head]\`, \`count++\`.
- \`deleteFront\`: \`head = (head + 1) % cap\`, \`count--\`.
- \`deleteLast\`: \`count--\` (the rear slot is simply forgotten).
- \`getFront\` = \`buf[head]\`, \`getRear\` = \`buf[(head + count − 1) % cap]\`.

This is exactly how the toolkit \`Deque\` works (it additionally doubles its array when full).`,

  className: 'MyCircularDeque',
  starterCode: `class MyCircularDeque {
  /** @param {number} k */
  constructor(k) {
    
  }

  insertFront(value) {
    
  }

  insertLast(value) {
    
  }

  deleteFront() {
    
  }

  deleteLast() {
    
  }

  getFront() {
    
  }

  getRear() {
    
  }

  isEmpty() {
    
  }

  isFull() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The fourth insert fails because the deque is full; after deleteLast there is room at the front again.', ops: ['MyCircularDeque', 'insertLast', 'insertLast', 'insertFront', 'insertFront', 'getRear', 'isFull', 'deleteLast', 'insertFront', 'getFront'], args: [[3], [1], [2], [3], [4], [], [], [], [4], []], expected: [null, true, true, true, false, 2, true, true, true, 4] },
    { scenario: 'Operations on empty deque', hint: 'getFront/getRear return −1 and deletes return false when nothing is stored.', ops: ['MyCircularDeque', 'getFront', 'getRear', 'deleteFront', 'deleteLast', 'isEmpty'], args: [[2], [], [], [], [], []], expected: [null, -1, -1, false, false, true] },
    { scenario: 'insertFront at index 0', hint: 'Moving head back from 0 needs (head − 1 + cap) % cap — in JavaScript (0 − 1) % cap is −1.', ops: ['MyCircularDeque', 'insertFront', 'getRear', 'insertFront', 'getRear', 'getFront'], args: [[2], [1], [], [2], [], []], expected: [null, true, 1, true, 1, 2] },
    { scenario: 'Capacity 1', hint: 'With k = 1 the front and the rear are the same slot.', ops: ['MyCircularDeque', 'insertFront', 'deleteLast', 'isEmpty', 'insertLast', 'getFront', 'getRear', 'isFull', 'insertFront'], args: [[1], [5], [], [], [6], [], [], [], [7]], expected: [null, true, true, true, true, 6, 6, true, false] },
    { scenario: 'Wrap around the end', hint: 'After two deleteFronts, new elements wrap to the start of the buffer.', ops: ['MyCircularDeque', 'insertLast', 'insertLast', 'insertLast', 'deleteFront', 'deleteFront', 'insertLast', 'insertFront', 'getFront', 'getRear', 'isFull'], args: [[3], [1], [2], [3], [], [], [4], [0], [], [], []], expected: [null, true, true, true, true, true, true, true, 0, 4, true] },
    { scenario: 'Delete last after front inserts', hint: 'deleteLast must not move head; the rear is computed from head + count − 1.', ops: ['MyCircularDeque', 'insertFront', 'insertFront', 'insertFront', 'deleteLast', 'deleteLast', 'getRear', 'getFront'], args: [[3], [1], [2], [3], [], [], [], []], expected: [null, true, true, true, true, true, 3, 3] },
    { scenario: 'deleteFront moves head', hint: 'Forgetting to advance head on deleteFront keeps returning the removed value.', ops: ['MyCircularDeque', 'insertLast', 'insertLast', 'deleteFront', 'getFront', 'deleteFront', 'getFront', 'isEmpty'], args: [[3], [7], [8], [], [], [], [], []], expected: [null, true, true, true, 8, true, -1, true] },
    { scenario: 'Full then empty then reuse', hint: 'Fill, drain from both ends, and fill again — counts must return to 0 exactly.', ops: ['MyCircularDeque', 'insertLast', 'insertFront', 'isFull', 'insertLast', 'deleteFront', 'deleteLast', 'isEmpty', 'deleteLast', 'insertLast', 'getFront', 'getRear'], args: [[2], [1], [2], [], [3], [], [], [], [], [9], [], []], expected: [null, true, true, true, false, true, true, true, false, true, 9, 9] },
    { scenario: 'Value zero', hint: '0 is a valid value — do not confuse it with "empty".', ops: ['MyCircularDeque', 'insertLast', 'getFront', 'getRear', 'isEmpty'], args: [[2], [0], [], [], []], expected: [null, true, 0, 0, false] },
    { scenario: 'Alternating ends', hint: 'Inserting at both ends alternately — front and rear must stay correct.', ops: ['MyCircularDeque', 'insertFront', 'insertLast', 'insertFront', 'insertLast', 'getFront', 'getRear', 'deleteFront', 'deleteLast', 'getFront', 'getRear'], args: [[4], [1], [2], [3], [4], [], [], [], [], [], []], expected: [null, true, true, true, true, 3, 4, true, true, 1, 2] },
    { scenario: 'Long random mix (k = 5)', hint: 'A hundred random operations on a small ring — many wrap-arounds at both ends.', ops: ['MyCircularDeque', 'isEmpty', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront', 'insertFront'], args: [[5], [], [960], [235], [61], [570], [73], [852], [544], [836], [171], [794], [347], [772], [49], [777], [905], [542], [961], [813], [374], [897], [3], [230], [772], [2], [489], [199], [715], [49], [216], [578], [303], [160], [380], [857], [658], [64], [54], [315], [174], [196], [896], [772], [756], [851], [819], [462], [237], [459], [27], [839], [702], [220], [296], [577], [80], [167], [252], [600], [669], [79], [851], [121], [708], [750], [582], [745], [208], [222], [559], [272], [795], [845], [933], [370], [871], [714], [401], [63], [736], [227], [794], [276], [668], [141], [550], [246], [299], [56], [633], [985], [897], [364], [24], [991], [547], [276], [945], [183], [496]], expected: [null, true, true, true, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false] },
    { scenario: 'Large capacity (k = 1000)', hint: 'Maximum capacity: the deque never fills, and inserts at both ends must still index the ring correctly.', ops: ['MyCircularDeque', 'insertFront', 'insertFront', 'deleteFront', 'insertFront', 'insertFront', 'insertFront', 'deleteFront', 'insertLast', 'insertFront', 'getFront', 'insertFront', 'insertFront', 'getFront', 'insertFront', 'deleteFront', 'deleteFront', 'getFront', 'insertFront', 'getFront', 'insertFront', 'insertFront', 'getFront', 'insertFront', 'getFront', 'deleteFront', 'deleteFront', 'insertLast', 'getFront', 'deleteFront', 'insertFront', 'insertFront', 'deleteFront', 'deleteFront', 'deleteFront', 'insertLast', 'insertFront', 'insertFront', 'getFront', 'deleteFront', 'insertLast', 'insertLast', 'deleteFront', 'deleteFront', 'deleteFront', 'insertFront', 'insertFront', 'insertFront', 'deleteFront', 'getFront', 'getFront', 'insertFront', 'insertFront', 'insertFront', 'insertLast', 'getFront', 'deleteFront', 'deleteFront', 'deleteFront', 'getFront', 'getFront', 'insertFront', 'deleteFront', 'insertFront', 'insertFront', 'insertFront', 'getFront', 'getFront', 'insertLast', 'deleteFront', 'insertFront', 'insertFront', 'deleteFront', 'deleteFront', 'getFront', 'insertFront', 'insertFront', 'getFront', 'insertFront', 'getFront', 'insertFront'], args: [[1000], [350], [893], [], [128], [55], [282], [], [835], [125], [], [767], [419], [], [666], [], [], [], [8], [], [887], [981], [], [1], [], [], [], [523], [], [], [100], [5], [], [], [], [683], [326], [598], [], [], [365], [623], [], [], [], [70], [854], [692], [], [], [], [32], [379], [110], [970], [], [], [], [], [], [], [967], [], [708], [495], [877], [], [], [172], [], [784], [608], [], [], [], [218], [480], [], [33], [], [802]], expected: [null, true, true, true, true, true, true, true, true, true, 125, true, true, 419, true, true, true, 767, true, 8, true, true, 981, true, 1, true, true, true, 887, true, true, true, true, true, true, true, true, true, 598, true, true, true, true, true, true, true, true, true, true, 854, 854, true, true, true, true, 110, true, true, true, 854, 854, true, true, true, true, true, 877, 877, true, true, true, true, true, true, 495, true, true, 480, true, 33, true] },
    { scenario: 'Max calls (k = 1000)', hint: 'The largest allowed run: 2000 calls on capacity 1000 mixing both ends, rejected inserts when full and deletes past empty.', opsGen: String(bigDequeOps) },
  ],
  solution: {
    code: `class MyCircularDeque {
  constructor(k) {
    this.buf = new Array(k);
    this.cap = k;
    this.head = 0;
    this.count = 0;
  }
  insertFront(value) {
    if (this.isFull()) return false;
    this.head = (this.head - 1 + this.cap) % this.cap; // + cap avoids a negative index
    this.buf[this.head] = value;
    this.count++;
    return true;
  }
  insertLast(value) {
    if (this.isFull()) return false;
    this.buf[(this.head + this.count) % this.cap] = value;
    this.count++;
    return true;
  }
  deleteFront() {
    if (this.isEmpty()) return false;
    this.head = (this.head + 1) % this.cap;
    this.count--;
    return true;
  }
  deleteLast() {
    if (this.isEmpty()) return false;
    this.count--;
    return true;
  }
  getFront() {
    return this.isEmpty() ? -1 : this.buf[this.head];
  }
  getRear() {
    return this.isEmpty() ? -1 : this.buf[(this.head + this.count - 1) % this.cap];
  }
  isEmpty() {
    return this.count === 0;
  }
  isFull() {
    return this.count === this.cap;
  }
}`,
  },
  dryRun: {
    columns: ['op', 'buf', 'head', 'count', 'returns'],
    rows: [
      ['insertLast 1', '[1,_,_]', '0', '1', 'true'],
      ['insertLast 2', '[1,2,_]', '0', '2', 'true'],
      ['insertFront 3', '[1,2,3]', '2', '3', 'true (head wrapped 0 → 2)'],
      ['insertFront 4', '', '', '', 'false (full)'],
      ['getRear', '', '', '', 'buf[(2+3−1)%3 = 1] = 2'],
      ['deleteLast', '[1,2,3]', '2', '2', 'true'],
      ['insertFront 4', '[1,4,3]', '1', '3', 'true'],
      ['getFront', '', '', '', 'buf[1] = 4'],
    ],
  },
  complexity: { time: 'O(1) per operation', space: 'O(k)', explanation: 'Constant index arithmetic, fixed array.' },
  alternative: {
    title: 'Doubly linked list with size counter',
    md: 'Sentinel head and tail nodes; insert/delete next to them. O(1) per operation but one allocation per insert.',
    complexity: 'O(1) per operation, O(k) space',
  },
  mistakes: [
    '(head − 1) % cap is negative when head = 0 in JavaScript — add cap first.',
    'Forgetting to update head on deleteFront, or moving head on deleteLast.',
  ],
};
