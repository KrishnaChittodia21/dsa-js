// Shorts for Queue & Deque (M9). Format: src/content/shortSchema.js. Facts come only from topics/queue-deque/topic.js.
// Every queue, ring slot, deque and dp value below is produced by running the pattern's template on its "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label) => ({ kind: 'queue', values, label });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const list = (xs) => `[${xs.join(', ')}]`;
const mn = (x) => String(x).replace('-', '−'); // print negatives with a real minus sign

// ---------- queue simulation: take turns, back of the line ----------
// e.g. A needs 2 turns, B 1, C 3. Each turn: dequeue, use one turn, enqueue again if turns are left.
const turnFrames = [];
{
  const q = [['A', 2], ['B', 1], ['C', 3]];
  const order = [];
  while (q.length) {
    const [name, left] = q.shift(); // shortcut: shift() is fine on 3 items; the Short itself explains why not in a loop
    const again = left - 1 > 0;
    if (again) q.push([name, left - 1]);
    else order.push(name);
    turnFrames.push({
      say: again ? 1 : 0,
      note: again
        ? `Dequeue ${name} (${left} turns): one turn used, ${left - 1} left → enqueue ${name} at the back.`
        : `Dequeue ${name} (${left} turn): its last turn, so it leaves for good. Finished: ${order.join(', ')}.`,
      panels: [que(q.map(([n, l]) => `${n}:${l}`), 'line: name:turns left'), vars({ served: name, finished: list(order) })],
    });
  }
}

// ---------- circular buffer: k = 3 ----------
const ringFrames = [];
{
  const k = 3;
  const buf = new Array(k).fill('·');
  let head = 0,
    count = 0;
  const snap = (say, note, touched, st = 'active') => {
    const live = new Set(Array.from({ length: count }, (_, t) => (head + t) % k));
    const logical = Array.from({ length: count }, (_, t) => buf[(head + t) % k]);
    ringFrames.push({
      say,
      note,
      panels: [
        arr(buf.slice(), { label: 'buf (k = 3)', pointers: [ptr(head, 'head')], highlights: hl(k, (j) => (j === touched ? st : live.has(j) ? 'window' : 'muted')) }),
        que(logical, 'the queue it holds'),
        vars({ head, count, 'tail slot': `(${head} + ${count}) % 3 = ${(head + count) % k}` }),
      ],
    });
  };
  const push = (x) => {
    if (count === k) return snap(2, `push(${x}): count === 3, full → return false. Here head === tail slot, and only count says full.`, head, 'bad');
    const at = (head + count) % k;
    buf[at] = x;
    count++;
    snap(0, at < head ? `push(${x}) writes slot (${head} + ${count - 1}) % 3 = ${at}: the back wraps to the freed slot 0.` : `push(${x}) writes slot (${head} + ${count - 1}) % 3 = ${at}, count = ${count}.`, at);
  };
  const pop = () => {
    const was = head;
    head = (head + 1) % k;
    count--;
    snap(1, `pop(): head = (${was} + 1) % 3 = ${head}, count = ${count}. Slot ${was} is free; nothing moves.`, was, 'muted');
  };
  push(10);
  push(20);
  pop();
  push(30);
  push(40);
  push(50);
}

// ---------- monotonic deque, window max: [5, 2, 4, 1, 3, 6], k = 3 ----------
const W = [5, 2, 4, 1, 3, 6];
const WK = 3;
const wRun = [];
{
  const dq = [];
  const res = [];
  for (let i = 0; i < W.length; i++) {
    const popped = [];
    while (dq.length && W[dq[dq.length - 1]] <= W[i]) popped.push(dq.pop());
    dq.push(i);
    const expired = dq[0] <= i - WK ? dq.shift() : null; // the template's popFront
    const out = i >= WK - 1 ? W[dq[0]] : null;
    if (out !== null) res.push(out);
    wRun.push({ i, popped, expired, dq: [...dq], before: wRun.length ? wRun[wRun.length - 1].dq : [], out, res: [...res] });
  }
}
const wvi = (idx) => idx.map((j) => `${W[j]}@${j}`);
const wArr = (i, marks = {}) => {
  const lo = Math.max(0, i - WK + 1);
  return arr(W, { label: 'nums, k = 3', pointers: [ptr(i, 'i')], range: [lo, i], highlights: hl(W.length, (j) => marks[j] ?? (j >= lo && j <= i ? 'window' : '')) });
};
const wFrame = (r) => {
  const parts = [`i = ${r.i}: ${W[r.i]} arrives.`];
  if (r.popped.length) parts.push(`Pop ${r.popped.map((j) => W[j]).join(', ')} (≤ ${W[r.i]}).`);
  parts.push('Push.');
  if (r.expired !== null) parts.push(`Front index ${r.expired} ≤ ${r.i} − 3: expired.`);
  parts.push(r.out === null ? 'Window not full yet.' : `Max = front = ${r.out}.`);
  return {
    say: r.expired !== null ? 1 : 0,
    note: parts.join(' '),
    panels: [
      wArr(r.i, { ...Object.fromEntries(r.popped.map((j) => [j, 'muted'])), ...(r.expired !== null ? { [r.expired]: 'bad' } : {}), ...(r.out !== null ? { [r.dq[0]]: 'done' } : {}) }),
      que(wvi(r.dq), 'deque: value@index'),
      vars({ res: list(r.res) }),
    ],
  };
};
const WT = wRun[4]; // the turn: 3 arrives

// ---------- monotonic deque over prefix sums: [2, −1, 3, 1], k = 4 ----------
const S = [2, -1, 3, 1];
const SK = 4;
const SP = [0];
for (const x of S) SP.push(SP[SP.length - 1] + x); // 0 2 1 4 5
const sRun = [];
{
  const dq = [];
  let best = Infinity;
  for (let j = 0; j < SP.length; j++) {
    const before = [...dq];
    const used = [];
    while (dq.length && SP[j] - SP[dq[0]] >= SK) {
      const i = dq.shift();
      used.push(i);
      best = Math.min(best, j - i);
    }
    const popped = [];
    while (dq.length && SP[dq[dq.length - 1]] >= SP[j]) popped.push(dq.pop());
    dq.push(j);
    sRun.push({ j, before, used, popped, dq: [...dq], best });
  }
}
const svi = (idx) => idx.map((j) => `${SP[j]}@${j}`);
const pArr = (j, marks = {}) => arr(SP, { label: 'P (prefix sums)', pointers: [ptr(j, 'j')], highlights: hl(SP.length, (x) => marks[x] ?? '') });
const bestStr = (b) => (b === Infinity ? '∞' : b);
const sFrame = (r) => {
  const parts = [`j = ${r.j}: P = ${SP[r.j]}.`];
  for (const i of r.used) parts.push(`${SP[r.j]} − ${SP[i]} ≥ 4 → length ${r.j - i}, pop front index ${i}.`);
  for (const i of r.popped) parts.push(`P[${i}] = ${SP[i]} ≥ ${SP[r.j]}: pop back index ${i}.`);
  parts.push(`Push ${r.j}.`);
  return {
    say: r.used.length ? 1 : 0,
    note: parts.join(' '),
    panels: [
      pArr(r.j, { ...Object.fromEntries(r.dq.map((x) => [x, 'window'])), ...Object.fromEntries(r.popped.map((x) => [x, 'muted'])), ...Object.fromEntries(r.used.map((x) => [x, 'done'])), [r.j]: 'active' }),
      que(svi(r.dq), 'deque: P@index (increasing)'),
      vars({ best: bestStr(r.best) }),
    ],
  };
};
const ST = sRun[4]; // the turn: the last prefix
const ST_PREV = sRun[3];

// ---------- deque DP (best of the last k): nums = [3, −5, −2, −4, 6], k = 2 ----------
const D = [3, -5, -2, -4, 6];
const DK = 2;
const dRun = [];
{
  const best = new Array(D.length).fill('·');
  const dq = [];
  for (let i = 0; i < D.length; i++) {
    const expired = dq.length && dq[0] < i - DK ? dq.shift() : null;
    const from = dq.length ? dq[0] : null;
    best[i] = D[i] + (from === null ? 0 : best[from]);
    const popped = [];
    while (dq.length && best[dq[dq.length - 1]] <= best[i]) popped.push(dq.pop());
    const beforePush = [...dq];
    dq.push(i);
    dRun.push({ i, expired, from, popped, beforePush, dq: [...dq], best: best.slice() });
  }
}
const dvi = (idx, best) => idx.map((j) => `${mn(best[j])}@${j}`);
const dPanels = (r) => [
  arr(D, { label: 'nums, k = 2', pointers: [ptr(r.i, 'i')], highlights: hl(D.length, (j) => (j === r.i ? 'active' : j < r.i ? 'done' : '')) }),
  arr(r.best, { label: 'best', highlights: hl(D.length, (j) => (j === r.i ? 'active' : j === r.from ? 'window' : j === r.expired ? 'bad' : j < r.i ? 'done' : '')) }),
  que(dvi(r.dq, r.best), 'deque: best@index (decreasing)'),
];
const dFrame = (r) => {
  const parts = [`i = ${r.i}:`];
  if (r.expired !== null) parts.push(`index ${r.expired} < ${r.i} − 2, pop front.`);
  parts.push(r.from === null ? `deque empty → best = ${mn(D[r.i])} + 0 = ${mn(r.best[r.i])}.` : `best = ${mn(D[r.i])} + best[${r.from}] (${mn(r.best[r.from])}) = ${mn(r.best[r.i])}.`);
  if (r.popped.length) parts.push(`Pop back index ${r.popped.join(', ')}.`);
  parts.push('Push.');
  return { say: 1, note: parts.join(' '), panels: dPanels(r) };
};
const DT = dRun[3]; // the turn: index 0 is out of reach
const DT_PREV = dRun[2];

export default [
  {
    id: 'queue-simulation',
    title: 'Take turns in arrival order, O(1) per turn',
    steps: [
      {
        kind: 'watch',
        title: 'The shift() trap',
        lines: ['A queue serves the **oldest** item first: join at the back, leave from the front.', '`arr.shift()` removes index 0 and **re-indexes every remaining element**: O(n) per call.'],
        frames: [
          { say: 0, note: 'e.g. a line [a, b, c, d]. The front is a.', panels: [arr(['a', 'b', 'c', 'd'], { label: 'arr', highlights: { 0: 'active' } })] },
          { say: 1, note: 'shift() takes a, then b, c, d all move one slot left. In a loop over n items: O(n²).', panels: [arr(['b', 'c', 'd'], { label: 'arr after shift()', highlights: hl(3, () => 'visited') })] },
          { say: 1, note: 'Fix: keep a head index and read arr[head++]. Nothing moves; each dequeue is O(1).', panels: [arr(['a', 'b', 'c', 'd'], { label: 'arr + head', pointers: [ptr(1, 'head')], highlights: { 0: 'muted', 1: 'active' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Serve, act, back of the line',
        lines: ['Dequeue the front and process it.', 'Still needs another turn? **Enqueue** it at the back.'],
        frames: [{ say: 0, note: 'e.g. A needs 2 turns, B needs 1, C needs 3. They line up in arrival order.', panels: [que(['A:2', 'B:1', 'C:3'], 'line: name:turns left')] }, ...turnFrames],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"in order of arrival"**, **"take turns"**, **"goes to the back of the line"**, **"rounds"**, **"in the last t milliseconds"**.'],
        frames: [{ say: 0, note: 'Each step is O(1), so m steps of simulation cost O(m).', panels: [vars({ dequeue: 'O(1)', enqueue: 'O(1)', 'm steps': 'O(m)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: one more round',
        lines: ['e.g. the line is **D:2, E:1** (front first).', 'D is served next and still needs a turn after this one.'],
        panels: [que(['D:2', 'E:1'], 'line: name:turns left')],
        task: {
          type: 'choose',
          question: 'What is the line after D takes its turn?',
          options: [
            { text: 'D:1, E:1', why: 'D stayed at the front: that would let D take every turn in a row. A re-queued item goes to the back.' },
            { text: 'E:1, D:1' },
            { text: 'E:1', why: 'D still needs a turn, so it must be enqueued again, not dropped.' },
            { text: 'E:1, D:2', why: 'D used one turn while at the front, so it goes back with 1 left.' },
          ],
          answer: 1,
        },
        solved: 'Dequeue from the **front**, enqueue again at the **back**: everyone gets a turn in arrival order.',
      },
    ],
  },

  {
    id: 'circular-buffer',
    title: 'A fixed-size queue that wraps around',
    steps: [
      {
        kind: 'watch',
        title: 'Freed slots go to waste',
        lines: ['A plain array as a queue either shifts (O(n)) or **leaks memory at the front**.', 'A ring buffer reuses the freed front slots: `head` + `count`, indices wrap with `% k`.'],
        frames: [
          { say: 0, note: 'e.g. with a head index, slot 0 is dead after a dequeue, and new items only ever go further right.', panels: [arr(['10', '20', '30', '40'], { label: 'array + head', pointers: [ptr(1, 'head')], highlights: { 0: 'muted' } })] },
          { say: 1, note: 'Instead: e.g. k = 3 slots, head = 0, count = 0. The back slot is (head + count) % k.', panels: [arr(['·', '·', '·'], { label: 'buf (k = 3)', pointers: [ptr(0, 'head')], highlights: hl(3, () => 'muted') }), que([], 'the queue it holds'), vars({ head: 0, count: 0 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'push, pop, wrap, full',
        lines: ['`push`: write `buf[(head + count) % k]`, then `count++`.', '`pop`: `head = (head + 1) % k`, `count--`.', 'Full is `count === k`; the count tells full from empty when head equals the tail slot.'],
        frames: ringFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"design your implementation of the circular queue"**, **"fixed size k"**, **"isFull"**, **"ring buffer"**, **"insertFront / insertLast"**.'],
        frames: [{ say: 0, note: 'O(1) per operation, O(capacity) memory, nothing ever shifts.', panels: [vars({ 'each op': 'O(1)', memory: 'O(k)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: insert at the front',
        lines: ['e.g. k = 3, buf = [10, 20, ·], head = 0, count = 2.', 'insertFront(5) moves head back one slot, then writes `buf[head]`.'],
        panels: [arr(['10', '20', '·'], { label: 'buf (k = 3)', pointers: [ptr(0, 'head')], highlights: { 0: 'window', 1: 'window', 2: 'muted' } }), vars({ head: 0, count: 2 })],
        task: {
          type: 'choose',
          question: 'Which slot does 5 go into?',
          options: [
            { text: '(0 − 1) % 3 = −1', why: 'In JavaScript % keeps the sign of the left operand: −1 is not a slot.' },
            { text: '(0 − 1 + 3) % 3 = 2' },
            { text: 'Slot 0, the current head', why: 'That overwrites 10, the current front.' },
            { text: '(head + count) % 3 = 2, the tail slot', why: 'Right slot by luck, wrong rule: that is where the back goes. With count = 1 it would give slot 1, not 2.' },
          ],
          answer: 1,
        },
        solved: 'Moving an index backwards: **(i − 1 + k) % k**. Add k first, because JS % keeps the sign.',
      },
    ],
  },

  {
    id: 'monotonic-deque-window',
    title: 'Max of every window in O(n)',
    steps: [
      {
        kind: 'watch',
        title: 'A running max cannot slide',
        lines: ['Maximum of every window of size k. Re-scanning each window is **O(k) per window**.', 'A running sum slides in O(1); a running max cannot: when the max leaves, what is next?'],
        frames: [
          { say: 0, note: 'e.g. nums = [5, 2, 4, 1, 3, 6], k = 3. Window [0..2]: scan 5, 2, 4 → 5.', panels: [arr(W, { label: 'nums, k = 3', range: [0, 2], highlights: hl(6, (j) => (j <= 2 ? 'visited' : '')) })] },
          { say: 1, note: 'Window [1..3]: 5 left. Scan 2, 4, 1 again → 4. Two of three reads repeat.', panels: [arr(W, { label: 'nums, k = 3', range: [1, 3], highlights: hl(6, (j) => (j === 0 ? 'muted' : j <= 3 ? 'visited' : '')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Keep only candidates, decreasing',
        lines: ['Pop the back while `nums[back] <= nums[i]`: older and smaller is **never** a max again. Then push `i`.', 'Pop the front if `front <= i − k`: it left the window. The front is the max.'],
        frames: wRun.slice(0, 4).map(wFrame),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"sliding window maximum"**, **"maximum of each window of size k"**, **"max − min ≤ limit"**, **"within k steps"**.'],
        frames: [{ say: 0, note: 'Window + max/min together → deque. Each index is pushed once and popped at most once: O(n).', panels: [vars({ brute: 'O(n·k)', deque: 'O(n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: 3 arrives',
        lines: [`i = 4, window [2..4]. The deque holds ${list(wvi(WT.before))}.`, 'Run the back rule, push, then check the front.'],
        panels: [wArr(4, { 3: '', 4: 'active' }), que(wvi(WT.before), 'deque: value@index'), vars({ res: list(wRun[3].res) })],
        task: {
          type: 'choose',
          question: 'What is the deque after i = 4?',
          options: [
            { text: '[4@2, 1@3, 3@4]', why: '1 is older and smaller than 3: every later window holding 1 also holds 3. Pop it.' },
            { text: `[${wvi(WT.dq).join(', ')}], max ${WT.out}` },
            { text: '[1@3, 3@4]', why: 'Index 2 is still inside the window [2..4]: expiry is by index, front <= i − k.' },
            { text: '[3@4]', why: '4 > 3, so the back rule stops at 4. It stays as the max of this window.' },
          ],
          answer: 1,
        },
        solved: 'Smaller-and-older leaves from the **back**; out-of-window leaves from the **front**; the front is always the max.',
        then: [wFrame(WT), wFrame(wRun[5])],
      },
    ],
  },

  {
    id: 'monotonic-deque-prefix-sum',
    title: 'Shortest subarray with sum ≥ k, negatives allowed',
    steps: [
      {
        kind: 'watch',
        title: 'Negatives break the window',
        lines: ['Shortest subarray with sum ≥ k. With negatives, **shrinking can raise the sum**, so a window cannot decide when to shrink.', 'Use prefix sums: `sum(i..j−1) = P[j] − P[i]`, with `P[0] = 0`.'],
        frames: [
          { say: 0, note: 'e.g. nums = [2, −1, 3, 1], k = 4. Window [1..3] sums to 3: too small, so grow?', panels: [arr(S, { label: 'nums, k = 4', range: [1, 3], highlights: hl(4, (j) => (j >= 1 ? 'window' : '')) }), vars({ sum: 3 })] },
          { say: 0, note: 'Yet dropping −1 makes it bigger: [2..3] sums to 4. Shrinking raised the sum.', panels: [arr(S, { label: 'nums, k = 4', range: [2, 3], highlights: { 1: 'bad', 2: 'window', 3: 'window' } }), vars({ sum: 4 })] },
          { say: 1, note: `P = [${SP.join(', ')}]. For each end j, find the latest start i with P[i] ≤ P[j] − 4.`, panels: [arr(S, { label: 'nums' }), arr(SP, { label: 'P (prefix sums)', highlights: { 0: 'active' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'An increasing deque of starts',
        lines: ['**Back rule:** pop while `P[back] >= P[j]`. j is a later start with a smaller prefix.', '**Front rule:** while `P[j] − P[front] >= k`, record `j − front` and pop the front.'],
        frames: sRun.slice(0, 4).map(sFrame),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"shortest subarray"**, **"sum at least k"**, **"can be negative"**. All non-negative → plain sliding window.'],
        frames: [{ say: 0, note: 'Each index enters and leaves the deque once: O(n) time, O(n) for prefix sums.', panels: [vars({ time: 'O(n)', space: 'O(n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the last end',
        lines: [`j = 4, P[4] = ${SP[4]}. The deque holds ${list(svi(ST.before))}; best = ${ST_PREV.best}.`, 'Apply the front rule first.'],
        panels: [pArr(4, { ...Object.fromEntries(ST.before.map((x) => [x, 'window'])), 4: 'active' }), que(svi(ST.before), 'deque: P@index (increasing)'), vars({ best: ST_PREV.best })],
        task: {
          type: 'choose',
          question: 'What does the front rule do at j = 4?',
          options: [
            { text: `${SP[4]} − ${SP[2]} = 4 ≥ 4 → best = 4 − 2 = ${ST.best}, pop index 2` },
            { text: 'Record 2 but keep index 2 for later ends', why: 'A later end with the same start is only longer. Once used, the front has done its job.' },
            { text: `${SP[4]} − ${SP[0]} = 5 → best stays ${ST_PREV.best} via index 0`, why: 'Index 0 was already used and popped at j = 3; it can only give longer answers now.' },
            { text: 'Nothing: 5 − 4 = 1 < 4', why: 'The front rule checks the front (index 2, P = 1), not the back.' },
          ],
          answer: 0,
        },
        solved: `Front rule: a start that already works is recorded and popped. Shortest length = **${ST.best}** (3 + 1).`,
        then: [sFrame(ST)],
      },
    ],
  },

  {
    id: 'monotonic-deque-dp',
    title: '"Best of the last k" DP in O(n)',
    steps: [
      {
        kind: 'watch',
        title: 'An inner loop over k states',
        lines: ['Jump at most k steps; collect `nums` at each landing. `best[i] = nums[i] + max(best[i−k..i−1])`.', 'Looping over the last k states is **O(n·k)**. The inner max is a **sliding window maximum over best[]**.'],
        frames: [
          { say: 0, note: 'e.g. nums = [3, −5, −2, −4, 6], k = 2. Start at index 0, which is forced.', panels: [arr(D, { label: 'nums, k = 2', highlights: { 0: 'active' } })] },
          { say: 1, note: 'Every best[i] looks back over a window of the last k best values. Keep a decreasing deque of them.', panels: [arr(D, { label: 'nums, k = 2' }), arr(['·', '·', '·', '·', '·'], { label: 'best' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Expire, read the front, then push',
        lines: ['Pop the front if `front < i − k`: out of reach. **Before** computing best[i].', '`best[i] = nums[i] + best[front]`; pop back while `best[back] <= best[i]`; push i.'],
        frames: dRun.slice(0, 3).map(dFrame),
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"at most k steps forward"**, **"j − i <= k"**, **"maximum score to reach the last index"**, n and k both up to 10^5.'],
        frames: [{ say: 0, note: 'O(n) time instead of O(n·k); O(n) for the best array.', panels: [vars({ loop: 'O(n·k)', deque: 'O(n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: best[3]',
        lines: [`i = 3, nums[3] = −4. The deque holds ${list(dvi(DT_PREV.dq, DT_PREV.best))} (best@index).`, 'Index 3 can be reached only from indices 1 and 2.'],
        panels: [arr(D, { label: 'nums, k = 2', pointers: [ptr(3, 'i')], highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'active' } }), arr(DT_PREV.best, { label: 'best', highlights: { 3: 'active' } }), que(dvi(DT_PREV.dq, DT_PREV.best), 'deque: best@index (decreasing)')],
        task: {
          type: 'choose',
          question: 'What is best[3]?',
          options: [
            { text: '−4 + 3 = −1, from the front best[0]', why: '0 < 3 − 2: index 0 is out of reach. Expire the front before reading it.' },
            { text: `−4 + ${DT.best[DT.from]} = ${mn(DT.best[3])}, from best[2] after popping index 0` },
            { text: '−4 + 0 = −4, start fresh', why: 'Here the start at index 0 is forced. max(0, …) belongs to the subsequence variant.' },
            { text: '−4 + (−5) = −9, from best[1]', why: 'best[1] is −2, not nums[1]; and best[2] = 1 is larger anyway.' },
          ],
          answer: 1,
        },
        solved: `Expire **before** reading the front. The run ends at best[4] = **${dRun[4].best[4]}**: path 0 → 2 → 4.`,
        then: [dFrame(DT), dFrame(dRun[4])],
      },
    ],
  },
];
