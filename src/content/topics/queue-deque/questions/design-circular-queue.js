// k = 1000, 3000 calls: a filling phase, a draining phase and a mixed phase; expected values come from a plain JS array.
const bigQueueOps = () => {
  let s = 21; const rnd = (m) => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) >>> 8) % m;
  const k = 1000, q = [];
  const ops = ['MyCircularQueue'], args = [[k]], expected = [null];
  for (let i = 0; i < 2999; i++) {
    const pEnq = i < 1200 ? 9 : i < 2100 ? 2 : 6, r = rnd(10), v = rnd(1001);
    let op;
    if (r < pEnq) op = 'enQueue'; else op = ['deQueue', 'deQueue', 'Front', 'Rear', 'isEmpty', 'isFull'][rnd(6)];
    ops.push(op);
    if (op === 'enQueue') { args.push([v]); if (q.length < k) { q.push(v); expected.push(true); } else expected.push(false); }
    else {
      args.push([]);
      if (op === 'deQueue') { if (q.length) { q.shift(); expected.push(true); } else expected.push(false); }
      else if (op === 'Front') expected.push(q.length ? q[0] : -1);
      else if (op === 'Rear') expected.push(q.length ? q[q.length - 1] : -1);
      else if (op === 'isEmpty') expected.push(q.length === 0);
      else expected.push(q.length === k);
    }
  }
  return { ops, args, expected };
};

export default {
  id: 'design-circular-queue',
  title: 'Design Circular Queue',
  difficulty: 'Medium',
  order: 1,
  pattern: 'circular-buffer',
  kind: 'design',
  tags: ['queue', 'design', 'array', 'circular buffer'],
  source: { platform: 'LeetCode', number: 622, url: 'https://leetcode.com/problems/design-circular-queue/' },

  statement: `Implement a fixed-capacity FIFO queue stored in a circular array (a "ring buffer"), without using a built-in queue.

\`MyCircularQueue(k)\` creates a queue of capacity k, with:
- \`enQueue(value)\` — insert at the rear; return \`true\` on success, \`false\` if full;
- \`deQueue()\` — remove the front; return \`true\` on success, \`false\` if empty;
- \`Front()\` / \`Rear()\` — return the front / rear value, or \`-1\` if empty;
- \`isEmpty()\` / \`isFull()\`.`,
  examples: [
    { input: '["MyCircularQueue","enQueue","enQueue","enQueue","enQueue","Rear","isFull","deQueue","enQueue","Rear"]\n[[3],[1],[2],[3],[4],[],[],[],[4],[]]', output: '[null,true,true,true,false,3,true,true,true,4]' },
  ],
  constraints: ['1 <= k <= 1000', '0 <= value <= 1000', 'At most 3000 calls'],

  think: `- Which two numbers are enough to describe where the queue lives inside the array?
- Where is the rear, given the front index and the number of elements?
- How do you tell "full" from "empty" if you only store a head and a tail index?`,
  patternChallenge: {
    options: ['Linked list with a tail pointer', 'Circular buffer: array + head + count', 'Two stacks', 'Array with shift()'],
    answer: 1,
    explanation: 'Fixed capacity and O(1) operations → ring buffer. A linked list also works but allocates a node per element; shift() is O(n); two stacks give only amortized bounds and need no fixed capacity.',
  },
  hints: [
    'Store buf (size k), head (index of the front) and count.',
    'Rear index = (head + count − 1) % k; the next free slot = (head + count) % k; deQueue moves head = (head + 1) % k.',
  ],
  approach: `**Ring buffer (O(1) everything):** keep \`buf = new Array(k)\`, \`head = 0\`, \`count = 0\`.
- \`enQueue\`: if full return false; write at \`(head + count) % k\`; \`count++\`.
- \`deQueue\`: if empty return false; \`head = (head + 1) % k\`; \`count--\`.
- \`Front\` = \`buf[head]\`, \`Rear\` = \`buf[(head + count − 1) % k]\` (or −1 if empty).
- \`isEmpty\` = \`count === 0\`, \`isFull\` = \`count === k\`.

Keeping a count avoids the classic ambiguity: with only head and tail, \`head === tail\` could mean empty or full.`,

  className: 'MyCircularQueue',
  starterCode: `class MyCircularQueue {
  /** @param {number} k */
  constructor(k) {
    
  }

  /** @param {number} value @return {boolean} */
  enQueue(value) {
    
  }

  /** @return {boolean} */
  deQueue() {
    
  }

  /** @return {number} */
  Front() {
    
  }

  /** @return {number} */
  Rear() {
    
  }

  /** @return {boolean} */
  isEmpty() {
    
  }

  /** @return {boolean} */
  isFull() {
    
  }
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'The fourth enQueue fails (full); after one deQueue the new value wraps into the freed slot.', ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'enQueue', 'enQueue', 'Rear', 'isFull', 'deQueue', 'enQueue', 'Rear'], args: [[3], [1], [2], [3], [4], [], [], [], [4], []], expected: [null, true, true, true, false, 3, true, true, true, 4] },
    { scenario: 'Operations on empty queue', hint: 'Front and Rear must return −1 (not undefined) and deQueue false when empty.', ops: ['MyCircularQueue', 'Front', 'Rear', 'deQueue', 'isEmpty', 'isFull'], args: [[2], [], [], [], [], []], expected: [null, -1, -1, false, true, false] },
    { scenario: 'Rear is the last element', hint: '(head + count) % k is the next free slot — Rear lives at (head + count − 1) % k.', ops: ['MyCircularQueue', 'enQueue', 'Rear', 'enQueue', 'Rear', 'Front'], args: [[3], [5], [], [6], [], []], expected: [null, true, 5, true, 6, 5] },
    { scenario: 'Capacity 1', hint: 'With k = 1 a single element both fills the queue and is front and rear.', ops: ['MyCircularQueue', 'enQueue', 'isFull', 'enQueue', 'Front', 'Rear', 'deQueue', 'isEmpty', 'enQueue', 'Rear'], args: [[1], [7], [], [8], [], [], [], [], [9], []], expected: [null, true, true, false, 7, 7, true, true, true, 9] },
    { scenario: 'Wrap around twice', hint: 'Indices must wrap modulo k over and over without drifting.', ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'deQueue', 'enQueue', 'deQueue', 'enQueue', 'deQueue', 'enQueue', 'Front', 'Rear'], args: [[2], [1], [2], [], [3], [], [4], [], [5], [], []], expected: [null, true, true, true, true, true, true, true, true, 4, 5] },
    { scenario: 'Full then drain', hint: 'After filling and draining the queue it must be empty, with Front/Rear back to −1.', ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'enQueue', 'isFull', 'deQueue', 'deQueue', 'deQueue', 'deQueue', 'isEmpty', 'Front', 'Rear'], args: [[3], [1], [2], [3], [], [], [], [], [], [], [], []], expected: [null, true, true, true, true, true, true, true, false, true, -1, -1] },
    { scenario: 'Value zero', hint: '0 is a valid stored value, not "missing".', ops: ['MyCircularQueue', 'enQueue', 'Front', 'Rear', 'isEmpty'], args: [[2], [0], [], [], []], expected: [null, true, 0, 0, false] },
    { scenario: 'Max value', hint: 'Values up to 1000 are stored as-is.', ops: ['MyCircularQueue', 'enQueue', 'enQueue', 'Rear', 'deQueue', 'Front'], args: [[2], [1000], [999], [], [], []], expected: [null, true, true, 999, true, 999] },
    { scenario: 'Reuse after empty', hint: 'Emptying the queue mid-way and filling it again must not leave stale state.', ops: ['MyCircularQueue', 'enQueue', 'deQueue', 'enQueue', 'enQueue', 'enQueue', 'enQueue', 'Front', 'Rear', 'isFull'], args: [[3], [1], [], [2], [3], [4], [5], [], [], []], expected: [null, true, true, true, true, true, false, 2, 4, true] },
    { scenario: 'isFull vs isEmpty', hint: 'With a head/tail design, full and empty both have head === tail — a count (or a spare slot) tells them apart.', ops: ['MyCircularQueue', 'isEmpty', 'isFull', 'enQueue', 'enQueue', 'isEmpty', 'isFull', 'deQueue', 'isFull'], args: [[2], [], [], [1], [2], [], [], [], []], expected: [null, true, false, true, true, false, true, true, false] },
    { scenario: 'Long random mix (k = 4)', hint: 'A hundred random operations on a small ring — many wrap-arounds.', ops: ['MyCircularQueue', 'Rear', 'Rear', 'deQueue', 'enQueue', 'Rear', 'Front', 'enQueue', 'isFull', 'isEmpty', 'enQueue', 'isEmpty', 'deQueue', 'isEmpty', 'deQueue', 'enQueue', 'enQueue', 'enQueue', 'enQueue', 'deQueue', 'enQueue', 'Rear', 'isEmpty', 'enQueue', 'Rear', 'Front', 'deQueue', 'isFull', 'enQueue', 'deQueue', 'enQueue', 'isFull', 'isEmpty', 'isFull', 'deQueue', 'isEmpty', 'Rear', 'deQueue', 'enQueue', 'isEmpty', 'enQueue', 'enQueue', 'deQueue', 'deQueue', 'isEmpty', 'deQueue', 'Front', 'enQueue', 'Front', 'enQueue', 'isEmpty', 'isEmpty', 'enQueue', 'isFull', 'Rear', 'enQueue', 'Front', 'enQueue', 'isFull', 'isFull', 'isFull', 'Front', 'Front', 'Front', 'enQueue', 'isEmpty', 'Front', 'enQueue', 'Rear', 'enQueue', 'Front', 'enQueue', 'isFull', 'enQueue', 'isFull', 'isFull', 'Rear', 'enQueue', 'Rear', 'enQueue', 'enQueue', 'deQueue', 'enQueue', 'enQueue', 'enQueue', 'deQueue', 'Front', 'isEmpty', 'deQueue', 'isFull', 'deQueue', 'Rear', 'enQueue', 'enQueue', 'isEmpty', 'Front', 'isEmpty', 'Rear', 'isEmpty', 'enQueue', 'deQueue'], args: [[4], [], [], [], [941], [], [], [519], [], [], [119], [], [], [], [], [137], [689], [549], [662], [], [772], [], [], [414], [], [], [], [], [138], [], [540], [], [], [], [], [], [], [], [916], [], [398], [31], [], [], [], [], [], [601], [], [636], [], [], [922], [], [], [604], [], [257], [], [], [], [], [], [], [612], [], [], [947], [], [644], [], [121], [], [723], [], [], [], [398], [], [317], [951], [], [161], [642], [455], [], [], [], [], [], [], [], [758], [603], [], [], [], [], [], [313], []], expected: [null, -1, -1, false, true, 941, 941, true, false, false, true, false, true, false, true, true, true, true, false, true, true, 772, false, false, 772, 137, true, false, true, true, true, true, false, true, true, false, 540, true, true, false, true, false, true, true, false, true, 398, true, 398, true, false, false, true, true, 922, false, 398, false, true, true, true, 398, 398, 398, false, false, 398, false, 922, false, 398, false, true, false, true, true, 922, false, 922, false, false, true, true, false, false, true, 636, false, true, false, true, 161, true, true, false, 161, false, 603, false, true, true] },
    { scenario: 'Large capacity (k = 1000)', hint: 'Maximum capacity: the queue never fills; head and rear indices still move correctly.', ops: ['MyCircularQueue', 'deQueue', 'deQueue', 'Front', 'Front', 'isFull', 'enQueue', 'enQueue', 'Rear', 'deQueue', 'enQueue', 'Rear', 'Rear', 'Front', 'deQueue', 'isFull', 'enQueue', 'enQueue', 'Rear', 'Front', 'deQueue', 'deQueue', 'deQueue', 'Rear', 'enQueue', 'deQueue', 'isEmpty', 'enQueue', 'enQueue', 'isFull', 'enQueue', 'enQueue', 'Rear', 'Rear', 'Rear', 'Rear', 'isFull', 'deQueue', 'Front', 'Front', 'Rear', 'enQueue', 'enQueue', 'deQueue', 'enQueue', 'Front', 'enQueue', 'Rear', 'Front', 'isFull', 'Front', 'Front', 'isEmpty', 'deQueue', 'isFull', 'Front', 'enQueue', 'deQueue', 'enQueue', 'Rear', 'Front', 'Front', 'isEmpty', 'isEmpty', 'isFull', 'Rear', 'deQueue', 'Rear', 'enQueue', 'enQueue', 'enQueue', 'Rear', 'Rear', 'Rear', 'Front', 'Rear', 'deQueue', 'enQueue', 'enQueue', 'deQueue', 'Front'], args: [[1000], [], [], [], [], [], [414], [937], [], [], [10], [], [], [], [], [], [632], [289], [], [], [], [], [], [], [726], [], [], [707], [809], [], [776], [234], [], [], [], [], [], [], [], [], [], [96], [41], [], [147], [], [991], [], [], [], [], [], [], [], [], [], [263], [], [69], [], [], [], [], [], [], [], [], [], [836], [733], [772], [], [], [], [], [], [], [274], [446], [], []], expected: [null, false, false, -1, -1, false, true, true, 937, true, true, 10, 10, 937, true, false, true, true, 289, 10, true, true, true, -1, true, true, true, true, true, false, true, true, 234, 234, 234, 234, false, true, 809, 809, 234, true, true, true, true, 776, true, 991, 776, false, 776, 776, false, true, false, 234, true, true, true, 69, 96, 96, false, false, false, 69, true, 69, true, true, true, 772, 772, 772, 41, 772, true, true, true, true, 991] },
    { scenario: 'Max calls (k = 1000)', hint: 'The largest allowed run: 3000 calls on capacity 1000 that fill the queue, hit isFull, drain it past empty and wrap the indices around several times.', opsGen: String(bigQueueOps) },
  ],
  solution: {
    code: `class MyCircularQueue {
  constructor(k) {
    this.buf = new Array(k);
    this.cap = k;
    this.head = 0;      // index of the front element
    this.count = 0;     // number of stored elements
  }
  enQueue(value) {
    if (this.isFull()) return false;
    this.buf[(this.head + this.count) % this.cap] = value;  // next free slot
    this.count++;
    return true;
  }
  deQueue() {
    if (this.isEmpty()) return false;
    this.head = (this.head + 1) % this.cap;
    this.count--;
    return true;
  }
  Front() {
    return this.isEmpty() ? -1 : this.buf[this.head];
  }
  Rear() {
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
      ['enQueue 1,2,3', '[1,2,3]', '0', '3', 'true ×3'],
      ['enQueue 4', '[1,2,3]', '0', '3', 'false (full)'],
      ['Rear', '', '', '', 'buf[2] = 3'],
      ['deQueue', '[1,2,3]', '1', '2', 'true'],
      ['enQueue 4', '[4,2,3]', '1', '3', 'true (wrapped to index 0)'],
      ['Rear', '', '', '', 'buf[(1+3−1)%3 = 0] = 4'],
    ],
  },
  complexity: { time: 'O(1) per operation', space: 'O(k)', explanation: 'Only index arithmetic; the array never grows or shifts.' },
  alternative: {
    title: 'head + tail with one wasted slot',
    md: 'Allocate k + 1 slots and keep head and tail. Empty when head === tail, full when (tail + 1) % (k + 1) === head. Avoids a count at the price of one slot.',
    complexity: 'O(1) per operation, O(k) space',
  },
  mistakes: [
    'Returning undefined instead of -1 from Front/Rear on an empty queue.',
    'Rear at (head + count) % k — that is the next free slot, not the last element.',
    'Clearing values on deQueue is unnecessary; moving head is enough.',
  ],
};
