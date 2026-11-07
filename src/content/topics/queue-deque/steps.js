// Step lessons for Queue & Deque (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every queue, ring buffer and deque below is produced by actually running the algorithm on the example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label) => ({ kind: 'queue', values, label });
const stk = (values, label) => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}) });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const list = (xs) => `[${xs.join(', ')}]`;

// ---------- monotonic deque runner: one record per index ----------
// popIf(backValue, newValue) decides a back pop; window max uses <=, window min uses >=.
function windowRun(nums, k, popIf = (b, x) => b <= x) {
  const dq = [];
  const res = [];
  return nums.map((x, i) => {
    const before = [...dq];
    const popped = [];
    while (dq.length && popIf(nums[dq[dq.length - 1]], x)) popped.push(dq.pop());
    dq.push(i);
    const pushed = [...dq];
    let expired = null;
    if (dq[0] <= i - k) expired = dq.shift();
    const out = i >= k - 1 ? nums[dq[0]] : null;
    if (out !== null) res.push(out);
    return { i, x, before, popped, pushed, expired, dq: [...dq], out, res: [...res] };
  });
}

// ---------- the lesson's example: nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3 ----------
const N = [1, 3, -1, -3, 5, 3, 6, 7];
const K = 3;
const RUN = windowRun(N, K); // res [3, 3, 5, 5, 6, 7]
const vi = (idx) => idx.map((j) => `${N[j]}@${j}`); // deque cells as value@index
const winOf = (i) => [Math.max(0, i - K + 1), i];
const nArr = (i, extra = {}, label = 'nums, k = 3') => {
  const [lo, hi] = winOf(i);
  return arr(N, { label, pointers: [ptr(i, 'i')], range: [lo, hi], highlights: hl(N.length, (j) => extra[j] ?? (j >= lo && j <= hi ? 'window' : '')) });
};
const dqMark = (idx, st = 'active') => Object.fromEntries(idx.map((j) => [j, st]));
// fine-grained frames for one index: pop back, push, expire, answer
function optFramesFor(r) {
  const f = [];
  if (r.popped.length)
    f.push({ say: 0, note: `i = ${r.i}: ${r.x} arrives. Pop ${r.popped.map((j) => N[j]).join(', ')} from the back (each ≤ ${r.x}).`, panels: [nArr(r.i, { ...dqMark(r.before), ...dqMark(r.popped, 'muted') }), que(vi(r.before.filter((j) => !r.popped.includes(j))), 'deque: value@index'), vars({ res: list(RUN[r.i - 1]?.res ?? []) })] });
  f.push({ say: 1, note: `Push ${r.x}@${r.i} to the back.${r.popped.length ? '' : ` Nothing ahead of it is ≤ ${r.x}.`}`, panels: [nArr(r.i, { ...dqMark(r.pushed), [r.i]: 'active' }), que(vi(r.pushed), 'deque: value@index'), vars({ res: list(RUN[r.i - 1]?.res ?? []) })] });
  if (r.expired !== null)
    f.push({ say: 2, note: `Front index ${r.expired} ≤ ${r.i} − ${K}: it left the window. Pop the front.`, panels: [nArr(r.i, { ...dqMark(r.dq), [r.expired]: 'bad' }), que(vi(r.dq), 'deque: value@index'), vars({ res: list(RUN[r.i - 1]?.res ?? []) })] });
  f.push(
    r.out === null
      ? { say: 3, note: `i = ${r.i} < k − 1: the first window is not complete yet. No answer.`, panels: [nArr(r.i, dqMark(r.dq)), que(vi(r.dq), 'deque: value@index'), vars({ res: '[]' })] }
      : { say: 4, note: `Window [${winOf(r.i).join(', ')}]: the front ${r.out} is the max.`, panels: [nArr(r.i, { ...dqMark(r.dq), [r.dq[0]]: 'done' }), que(vi(r.dq), 'deque: value@index'), vars({ res: list(r.res) })] },
  );
  return f;
}

// ---------- expiry demo from the dry-run note: [9, 1, 1, 1], k = 2 ----------
const E = [9, 1, 1, 1];
const ERUN = windowRun(E, 2);

// ---------- array + head index as a deque, on [9, 1, 1, 1], k = 2 ----------
const headRun = [];
{
  const dq = [];
  let head = 0;
  const res = [];
  for (let i = 0; i < E.length; i++) {
    let pops = 0;
    while (dq.length > head && E[dq[dq.length - 1]] <= E[i]) {
      dq.pop();
      pops++;
    }
    dq.push(i);
    let moved = false;
    if (dq[head] <= i - 2) {
      head++;
      moved = true;
    }
    if (i >= 1) res.push(E[dq[head]]);
    headRun.push({ i, pops, moved, head, store: [...dq], res: [...res] });
  }
}
const storeArr = (h) => arr(h.store, { label: 'dq storage (indices)', pointers: [ptr(h.head, 'head')], highlights: hl(h.store.length, (j) => (j < h.head ? 'muted' : 'active')) });

// ---------- brute force: every window rescanned ----------
const bruteFrames = [];
{
  let looks = 0;
  const res = [];
  for (let s = 0; s + K <= N.length; s++) {
    let m = -Infinity;
    for (let j = s; j < s + K; j++) {
      looks++;
      m = Math.max(m, N[j]);
    }
    res.push(m);
    bruteFrames.push({
      say: s === 0 ? 1 : 2,
      note: `Window [${s}, ${s + K - 1}]: scan ${N.slice(s, s + K).join(', ')} from scratch → max ${m}.`,
      panels: [arr(N, { label: 'nums, k = 3', range: [s, s + K - 1], highlights: hl(N.length, (j) => (j >= s && j < s + K ? 'visited' : '')) }), vars({ res: list(res), 'elements read': looks })],
    });
  }
}

// ---------- ring buffer, cap 4: the lesson's own sequence ----------
const ringFrames = [];
const RING = {};
{
  const cap = 4;
  const buf = Array(cap).fill('·');
  let head = 0,
    count = 0;
  const live = () => new Set(Array.from({ length: count }, (_, t) => (head + t) % cap));
  const snap = (say, note, touched) => {
    const L = live();
    const p = [ptr(head, 'head')];
    if (count < cap) p.push(ptr((head + count) % cap, 'back slot', 'b'));
    ringFrames.push({
      say,
      note,
      panels: [arr([...buf], { label: 'buf, cap = 4', pointers: p, highlights: hl(cap, (j) => (j === touched ? 'active' : L.has(j) ? 'window' : buf[j] === '·' ? '' : 'muted')) }), vars({ head, count, 'back slot': count < cap ? `${(head + count) % cap}` : 'full' })],
    });
  };
  snap(0, 'Empty: head = 0, count = 0. The back slot is (0 + 0) % 4 = 0.');
  for (const x of ['a', 'b', 'c', 'd']) {
    const at = (head + count) % cap;
    buf[at] = x;
    count++;
    snap(1, `Enqueue ${x}: write at slot ${at}, count = ${count}.`, at);
  }
  for (let t = 0; t < 2; t++) {
    const gone = buf[head];
    head = (head + 1) % cap;
    count--;
    snap(2, `Dequeue ${gone}: head = ${head}, count = ${count}. Nothing shifts.`);
  }
  for (const x of ['e', 'f']) {
    const at = (head + count) % cap;
    buf[at] = x;
    count++;
    snap(3, `Enqueue ${x}: back slot (${head} + ${count - 1}) % 4 = ${at}.${at < head ? ' It wrapped around.' : ''}`, at);
  }
  // one more dequeue for the turn
  head = (head + 1) % cap;
  count--;
  RING.head = head;
  RING.count = count;
  RING.buf = [...buf];
  RING.next = (head + count) % cap; // 2
}

// ---------- full vs empty, cap 3, tail = (head + count) % cap ----------
const fullFrames = [];
{
  const cap = 3;
  const buf = Array(cap).fill('·');
  let head = 0,
    count = 0;
  const snap = (note) => {
    const tail = (head + count) % cap;
    const L = new Set(Array.from({ length: count }, (_, t) => (head + t) % cap));
    fullFrames.push({ say: head === tail ? 1 : 0, note, panels: [arr([...buf], { label: 'buf, cap = 3', pointers: [ptr(head, 'head'), ptr(tail, 'tail', 'b')], highlights: hl(cap, (j) => (L.has(j) ? 'window' : buf[j] === '·' ? '' : 'muted')) }), vars({ head, tail, count })] });
  };
  snap('Empty: head = tail = 0.');
  for (const x of ['x', 'y', 'z']) {
    buf[(head + count) % cap] = x;
    count++;
    snap(count === cap ? `Enqueue ${x}. tail wrapped to 0 = head, but count = 3: FULL.` : `Enqueue ${x}. count = ${count}.`);
  }
  for (let t = 0; t < 3; t++) {
    const g = buf[head];
    head = (head + 1) % cap;
    count--;
    snap(count === 0 ? `Dequeue ${g}. head = tail = 0 again, count = 0: EMPTY.` : `Dequeue ${g}. count = ${count}.`);
  }
}

// ---------- template: window minimum on a small made-up input ----------
const M = [4, 2, 5, 1, 3];
const MRUN = windowRun(M, 2, (b, x) => b >= x); // mins [2, 2, 1, 1]
const minFrames = MRUN.map((r) => ({
  say: r.popped.length ? 0 : r.expired !== null ? 2 : r.out !== null ? 3 : 1,
  note: `i = ${r.i} (${r.x}): ${r.popped.length ? `pop ${r.popped.map((j) => M[j]).join(', ')} (≥ ${r.x}); ` : ''}push ${r.x}${r.expired !== null ? `; index ${r.expired} expired` : ''}.${r.out !== null ? ` Min = ${r.out}.` : ''}`,
  panels: [
    arr(M, { label: 'nums, k = 2', pointers: [ptr(r.i, 'i')], range: [Math.max(0, r.i - 1), r.i], highlights: { ...dqMark(r.dq), ...(r.expired !== null ? { [r.expired]: 'bad' } : {}), ...dqMark(r.popped, 'muted') } }),
    que(r.dq.map((j) => M[j]), 'min deque (values)'),
    vars({ res: list(r.res) }),
  ],
}));

// ---------- template: two deques, max − min ≤ limit, made-up [8, 2, 4, 7], limit 4 ----------
const L2 = [8, 2, 4, 7];
const LIMIT = 4;
const twoRun = [];
{
  const maxD = [],
    minD = [];
  let left = 0,
    best = 0;
  for (let right = 0; right < L2.length; right++) {
    while (maxD.length && L2[maxD[maxD.length - 1]] < L2[right]) maxD.pop();
    maxD.push(right);
    while (minD.length && L2[minD[minD.length - 1]] > L2[right]) minD.pop();
    minD.push(right);
    const spread = L2[maxD[0]] - L2[minD[0]];
    const leftBefore = left;
    while (L2[maxD[0]] - L2[minD[0]] > LIMIT) {
      left++;
      if (maxD[0] < left) maxD.shift();
      if (minD[0] < left) minD.shift();
    }
    best = Math.max(best, right - left + 1);
    twoRun.push({ right, left, leftBefore, spread, maxD: [...maxD], minD: [...minD], best });
  }
}
const twoFrame = (t, note, say) => ({
  say,
  note,
  panels: [
    arr(L2, { label: 'nums, limit = 4', pointers: [ptr(t.left, 'left'), ptr(t.right, 'right', 'b')], range: [t.left, t.right], highlights: hl(L2.length, (j) => (j < t.left ? 'muted' : j <= t.right ? 'window' : '')) }),
    que(t.maxD.map((j) => L2[j]), 'maxD (values)'),
    que(t.minD.map((j) => L2[j]), 'minD (values)'),
  ],
});
const twoFrames = twoRun.map((t) =>
  twoFrame(t, t.left > t.leftBefore ? `right = ${t.right}: spread ${t.spread} > 4, so left moves to ${t.left}. best = ${t.best}.` : `right = ${t.right}: max − min = ${t.spread} ≤ 4. best = ${t.best}.`, t.left > t.leftBefore ? 1 : 0),
);

// ---------- prefix sums + deque: made-up nums = [1, -3, 4, 2], k = 5 ----------
const PN = [1, -3, 4, 2];
const PK = 5;
const P = [0];
for (const x of PN) P.push(P[P.length - 1] + x); // [0, 1, -2, 2, 4]
const prefRun = [];
{
  const dq = [];
  let best = Infinity;
  for (let j = 0; j < P.length; j++) {
    const used = [];
    while (dq.length && P[j] - P[dq[0]] >= PK) {
      used.push(dq[0]);
      best = Math.min(best, j - dq.shift());
    }
    const popped = [];
    while (dq.length && P[dq[dq.length - 1]] >= P[j]) popped.push(dq.pop());
    dq.push(j);
    prefRun.push({ j, used, popped, dq: [...dq], best });
  }
}
const pArr = (j, extra = {}) => arr(P, { label: 'P (prefix sums)', pointers: [ptr(j, 'j')], highlights: extra });
const pdq = (idx) => que(idx.map((i) => `${P[i]}@${i}`), 'deque: P@index');
const prefFrame = (r) => ({
  say: r.used.length ? 2 : 1,
  note: `j = ${r.j}, P = ${P[r.j]}: ${r.used.length ? `P[j] − P[${r.used[0]}] = ${P[r.j] - P[r.used[0]]} ≥ 5, record ${r.j} − ${r.used[0]} = ${r.j - r.used[0]}, pop front; ` : ''}${r.popped.length ? `pop index ${r.popped.join(', ')} from the back (P ≥ ${P[r.j]}); ` : ''}push ${r.j}.`,
  panels: [pArr(r.j, { ...dqMark(r.dq, 'window'), ...dqMark(r.popped, 'muted'), ...dqMark(r.used, 'done') }), pdq(r.dq), vars({ best: r.best === Infinity ? '∞' : r.best })],
});

// ---------- deque DP: the lesson's Jump Game VI table, nums = [1, -1, -2, 4, -7, 3], k = 2 ----------
const J = [1, -1, -2, 4, -7, 3];
const JK = 2;
const dpRun = [];
{
  const best = Array(J.length).fill('?');
  const dq = [];
  for (let i = 0; i < J.length; i++) {
    let expired = null;
    if (dq.length && dq[0] < i - JK) expired = dq.shift();
    const from = dq.length ? dq[0] : null;
    best[i] = J[i] + (from === null ? 0 : best[from]);
    while (dq.length && best[dq[dq.length - 1]] <= best[i]) dq.pop();
    dq.push(i);
    dpRun.push({ i, expired, from, best: [...best], dq: [...dq] });
  }
}
const dpFrame = (d, say, note) => ({
  say,
  note,
  panels: [
    arr(J, { label: 'nums, k = 2', pointers: [ptr(d.i, 'i')], highlights: { [d.i]: 'active' } }),
    arr(d.best, { label: 'best', highlights: { ...(d.from !== null ? { [d.from]: 'done' } : {}), ...(d.expired !== null ? { [d.expired]: 'bad' } : {}), [d.i]: 'active' } }),
    que(d.dq.map((j) => d.best[j]), 'deque (best values)'),
  ],
});
const dpNote = (d) => `i = ${d.i}: ${d.expired !== null ? `index ${d.expired} expires; ` : ''}${d.from === null ? `best[0] = nums[0] = ${d.best[0]}` : `best = ${J[d.i]} + ${d.best[d.from]} = ${d.best[d.i]}`}.`;

// ---------- interview tips: count every deque operation on the main example ----------
const opsFrames = [];
{
  let pushes = 0,
    pops = 0;
  for (const r of RUN) {
    pushes++;
    pops += r.popped.length + (r.expired !== null ? 1 : 0);
    opsFrames.push({ say: 1, note: `i = ${r.i}: +1 push${r.popped.length ? `, ${r.popped.length} back pop${r.popped.length > 1 ? 's' : ''}` : ''}.`, panels: [nArr(r.i, dqMark(r.dq)), que(vi(r.dq), 'deque: value@index'), vars({ pushes, pops })] });
  }
}

// ---------- dry run: the lesson's table, row by row ----------
const DRY = [
  ['0', '1', '—', '—', '[1]', ''],
  ['1', '3', '1', '—', '[3]', ''],
  ['2', '-1', '—', '—', '[3, -1]', '3'],
  ['3', '-3', '—', '—', '[3, -1, -3]', '3'],
  ['4', '5', '-3, -1, 3', '—', '[5]', '5'],
  ['5', '3', '—', '—', '[5, 3]', '5'],
  ['6', '6', '3, 5', '—', '[6]', '6'],
  ['7', '7', '6', '—', '[7]', '7'],
];
// guard: the run must reproduce the lesson's table exactly
RUN.forEach((r, i) => {
  const row = [String(r.i), String(r.x), r.popped.length ? r.popped.map((j) => N[j]).join(', ') : '—', r.expired === null ? '—' : String(N[r.expired]), list(r.dq.map((j) => N[j])), r.out === null ? '' : String(r.out)];
  if (row.join('|') !== DRY[i].join('|')) throw new Error(`queue-deque dry run row ${i} differs: ${row.join('|')}`);
});
const dryFrame = (r) => ({
  say: r.out === null ? 0 : 1,
  note: `i = ${r.i}, nums[i] = ${r.x}. Pop back: ${DRY[r.i][2]}. Deque ${DRY[r.i][4]}.${r.out === null ? '' : ` Output ${r.out}.`}`,
  panels: [nArr(r.i, { ...dqMark(r.dq), ...dqMark(r.popped, 'muted') }), que(r.dq.map((j) => N[j]), 'deque (values)'), vars({ 'pop back': DRY[r.i][2], output: list(r.res) })],
});

const steps = {
  what: [
    {
      kind: 'watch',
      title: 'A line: join at the back, leave at the front',
      lines: ['A **queue** is a line: items join at the **back** and leave from the **front**.', 'The first item in is the first one out: **FIFO**.', 'A **deque** adds and removes at **both** ends.'],
      frames: [
        { say: 0, note: 'An empty queue.', panels: [que([], 'queue')] },
        { say: 0, note: 'Enqueue 1: it joins at the back.', panels: [que([1], 'queue')] },
        { say: 0, note: 'Enqueue 2, then 3. front → [1, 2, 3] ← back.', panels: [que([1, 2, 3], 'queue')] },
        { say: 1, note: 'Dequeue → 1, the oldest item.', panels: [que([2, 3], 'queue'), vars({ dequeued: 1 })] },
        { say: 1, note: 'Enqueue 4: it waits behind 2 and 3.', panels: [que([2, 3, 4], 'queue'), vars({ dequeued: 1 })] },
        { say: 2, note: 'A deque: `pushFront 1` puts 1 ahead of everyone.', panels: [que([1, 2, 3, 4], 'deque')] },
        { say: 2, note: '`popBack` → 4. `popFront` → 1. Never from the middle.', panels: [que([2, 3], 'deque'), vars({ popBack: 4, popFront: 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: both ends',
      lines: ['A deque lets you take from either end.', 'Start empty: `pushBack 1`, `pushBack 2`, `pushFront 3`.'],
      panels: [que([3, 1, 2], 'deque')],
      task: { type: 'order', question: 'Now `popBack`, `popFront`, `popBack`. Tap the values in the order they come out.', items: ['2', '3', '1'], hint: 'popBack takes the right end, popFront the left end.' },
      solved: '2 (back), 3 (front), 1 (the last one left).',
      then: [
        { say: 2, note: 'popBack → 2.', panels: [que([3, 1], 'deque')] },
        { say: 2, note: 'popFront → 3.', panels: [que([1], 'deque')] },
        { say: 2, note: 'popBack → 1. Empty.', panels: [que([], 'deque')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a deque in disguise',
      lines: ['A deque can act as a stack, a queue, or something smarter.'],
      panels: [que([5, 8, 2], 'deque'), stk([5, 8, 2], 'stack')],
      task: {
        type: 'choose',
        question: 'You only ever call `pushBack` and `popBack`. What does the deque behave like?',
        options: [
          { text: 'A stack: last in, first out', why: '' },
          { text: 'A queue: first in, first out', why: 'A queue removes from the other end: `pushBack` + `popFront`.' },
          { text: 'A monotonic deque', why: 'That needs values kept sorted by popping before each push.' },
        ],
        answer: 0,
      },
      solved: 'One end only means **LIFO**: a stack. Use `pushBack` + `popFront` for a queue.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'shift() moves everyone',
      lines: ['`arr.shift()` removes index 0, then **re-indexes every remaining element**.', 'A **head index** just remembers where the front is: read `arr[head++]`.'],
      frames: [
        { say: 0, note: 'Queue as a plain array.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q' }), vars({ moves: 0 })] },
        { say: 0, note: 'shift() → a. b, c, d, e each get a new index: 4 moves.', panels: [arr(['b', 'c', 'd', 'e'], { label: 'q after shift()', highlights: hl(4, () => 'bad') }), vars({ moves: 4 })] },
        { say: 0, note: 'shift() → b. Another 3 moves.', panels: [arr(['c', 'd', 'e'], { label: 'q after shift()', highlights: hl(3, () => 'bad') }), vars({ moves: 7 })] },
        { say: 1, note: 'Same queue, head index instead. head = 0.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q', pointers: [ptr(0, 'head')] }), vars({ moves: 0 })] },
        { say: 1, note: 'q[head++] → a. Only the counter changes.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q', pointers: [ptr(1, 'head')], highlights: { 0: 'muted' } }), vars({ moves: 0 })] },
        { say: 1, note: 'q[head++] → b. Still nothing moved.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q', pointers: [ptr(2, 'head')], highlights: { 0: 'muted', 1: 'muted' } }), vars({ moves: 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: empty it with shift()',
      lines: ['Each `shift()` re-indexes every element still behind the front.'],
      panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q' }), vars({ moves: 0 })],
      task: { type: 'number', question: 'You call `shift()` until the queue is empty. How many element moves in total?', options: [5, 10, 15, 25], answer: 10, hint: '4 + 3 + 2 + 1 + 0.' },
      solved: '4 + 3 + 2 + 1 = 10. It grows like n²; at 10^5 items that is billions of moves.',
    },
    {
      kind: 'turn',
      title: 'Your turn: where is the front?',
      lines: ['With a head index nothing moves; `head` marks the front.'],
      panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q, after 3 dequeues' })],
      task: { type: 'cell', question: 'Three `q[head++]` dequeues have run. Tap the cell that is the front now.', answer: 3, hints: { 0: 'Already dequeued.', 1: 'Already dequeued.', 2: 'Already dequeued: the third one.', 4: 'That is the back.' } },
      solved: 'head = 3, so the front is d. The old cells stay put; only the index moved.',
      then: [{ say: 1, note: 'head = 3: a, b, c are dead cells; d is the front.', panels: [arr(['a', 'b', 'c', 'd', 'e'], { label: 'q', pointers: [ptr(3, 'head')], highlights: { 0: 'muted', 1: 'muted', 2: 'muted', 3: 'active' } })] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Match the situation to the tool',
      lines: ['Arrival order, rounds, time windows, level by level: a **queue**.', 'Bounded buffer with isFull / isEmpty: a **circular buffer**.', 'Max/min of a window, sum ≥ k with negatives, best of the last k: a **monotonic deque**.'],
      frames: (() => {
        const rows = ['arrival order', 'time window', 'bounded buffer', 'window max/min', 'max − min ≤ limit', 'sum ≥ k, negatives', 'best of last k', 'level by level'];
        const tools = [['queue'], ['queue'], ['circular buffer'], ['monotonic deque'], ['two deques'], ['deque + prefix'], ['deque DP'], ['queue (BFS)']];
        const groups = [[0, 1, 7], [2], [3, 4, 5, 6]];
        const notes = ['Serve in order, expire from the front, BFS: plain FIFO.', 'Fixed size, indices wrap: a ring buffer.', 'Window extremes: keep the deque sorted.'];
        return groups.map((g, s) => ({ say: s, note: notes[s], panels: [table(rows, ['tool'], tools, rows.map((_, r) => [g.includes(r) ? 'active' : '']))] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: requests in a time window',
      lines: ['Keep only events inside a time window: pop expired ones from the **front**.', 'Made-up example: timestamps in ms, window = 3000.'],
      panels: [que([100, 1500, 3100], 'timestamps'), vars({ now: 4000, 'drop if <': 1000 })],
      task: { type: 'number', question: 'A request arrives at 4000. After pushing it and popping expired ones, how many are left?', options: [1, 2, 3, 4], answer: 3, hint: 'Only 100 is older than 4000 − 3000.' },
      solved: '100 expires from the front; 1500, 3100, 4000 remain: 3.',
      then: [
        { say: 0, note: 'Push 4000 at the back.', panels: [que([100, 1500, 3100, 4000], 'timestamps'), vars({ now: 4000 })] },
        { say: 0, note: '100 < 1000: pop the front. 1500 is recent, stop.', panels: [que([1500, 3100, 4000], 'timestamps'), vars({ now: 4000, count: 3 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the tool',
      lines: ['Problem: the longest subarray whose max − min stays ≤ limit.'],
      panels: [arr(L2, { label: 'nums, limit = 4' })],
      task: {
        type: 'choose',
        question: 'Which tool fits?',
        options: [
          { text: 'Two monotonic deques + a variable window', why: '' },
          { text: 'A plain FIFO queue', why: 'A queue keeps arrival order; it cannot tell you the window max or min.' },
          { text: 'A circular buffer', why: 'That is bounded storage, not window extremes.' },
          { text: 'A deque over prefix sums', why: 'That one is for shortest subarray with sum ≥ k.' },
        ],
        answer: 0,
      },
      solved: 'One deque for the max, one for the min, and a left edge that shrinks the window.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Two ingredients at once',
      lines: ['A **window** alone → sliding window.', '**Max/min** alone over the whole prefix → a running variable.', 'Both together → **deque**.'],
      frames: [
        { say: 0, note: '"Sum of each window of size 3": a window, no max/min.', panels: [vars({ window: 'yes', 'max/min': 'no', tool: 'sliding window' })] },
        { say: 1, note: '"Largest value seen so far": max/min, but nothing ever leaves.', panels: [vars({ window: 'no', 'max/min': 'yes', tool: 'running variable' })] },
        { say: 2, note: '"Maximum of each window": both ingredients.', panels: [vars({ window: 'yes', 'max/min': 'yes', tool: 'monotonic deque' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: "at most k steps"',
      lines: ['"Within k steps" is a window too.', 'Problem: jump at most k steps forward each move; maximise the score collected.'],
      panels: [vars({ window: '?', 'max/min': '?' })],
      task: {
        type: 'choose',
        question: 'Which ingredients does it have?',
        options: [
          { text: 'Both: the last k positions, and the best score among them', why: '' },
          { text: 'Only a window', why: 'You also need the best (max) score among those positions.' },
          { text: 'Only a max, over everything so far', why: 'You can only come from the last k positions, so older ones drop out.' },
        ],
        answer: 0,
      },
      solved: 'Window + max: think deque.',
    },
    {
      kind: 'turn',
      title: 'Your turn: no window',
      lines: ['Problem: for every i, the maximum of `nums[0..i]`.'],
      panels: [arr([2, 7, 1, 8], { label: 'nums' }), vars({ window: '?', 'max/min': 'yes' })],
      task: {
        type: 'choose',
        question: 'Which tool is enough?',
        options: [
          { text: 'A running variable', why: '' },
          { text: 'A monotonic deque', why: 'Nothing ever leaves the range, so there is nothing to expire.' },
          { text: 'A sliding window', why: 'The range always starts at 0; it only grows.' },
        ],
        answer: 0,
      },
      solved: 'Max alone over the whole prefix: one running variable.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'The back slot wraps around',
      lines: ['The back slot is `(head + count) % cap`.', 'Enqueue writes there and does `count++`.', 'Dequeue does `head = (head + 1) % cap` and `count--`.', 'The back **wraps around** to index 0. Nothing shifts.'],
      frames: ringFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the next write',
      lines: ['From `e f c d` (head = 2, count = 4) you dequeue once more.'],
      panels: [arr(RING.buf, { label: 'buf, cap = 4', pointers: [ptr(RING.head, 'head')], highlights: hl(4, (j) => (j === 2 ? 'muted' : 'window')) }), vars({ head: RING.head, count: RING.count })],
      task: { type: 'cell', question: 'Which slot does the next enqueue write?', answer: RING.next, hints: { 3: 'That is the head: the front item d.', 0: 'Still holds e.', 1: 'Still holds f.' } },
      solved: `(${RING.head} + ${RING.count}) % 4 = ${RING.next}: the slot c just freed.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: stepping backwards',
      lines: ['In JavaScript `%` keeps the sign of the left operand.', 'pushFront moves head **backwards** by one.'],
      panels: [arr(['·', '·', '·', '·'], { label: 'buf, cap = 4', pointers: [ptr(0, 'head')] }), vars({ head: 0, cap: 4 })],
      task: {
        type: 'choose',
        question: 'Which expression gives the new head?',
        options: [
          { text: '`(0 - 1 + 4) % 4` → 3', why: '' },
          { text: '`(0 - 1) % 4`', why: 'That is −1 in JavaScript, not 3: not a valid index.' },
          { text: '`(0 + 1) % 4` → 1', why: 'That moves forwards, like a dequeue.' },
        ],
        answer: 0,
      },
      solved: 'Add `cap` before `%` when moving back: `(i - 1 + cap) % cap`.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Rescan every window',
      lines: ['Goal: the max of every window of size 3: `[3, 3, 5, 5, 6, 7]`.', 'Brute force scans all k elements of each window.', 'Each slide starts from scratch.'],
      frames: bruteFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: count the reads',
      lines: ['n = 8, k = 3: every window reads k elements.'],
      panels: [arr(N, { label: 'nums, k = 3' })],
      task: { type: 'number', question: 'How many element reads does brute force do in total?', options: [6, 8, 18, 24], answer: 18, hint: '6 windows × 3 elements.' },
      solved: '6 × 3 = 18. That is the n·k shape: at n = 10^5, k = 5·10^4 it is ~2.5·10^9.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the max leaves',
      lines: ['A running sum updates in O(1). A running **max** cannot.', 'Made-up example: `[4, 2, 1, 0]`, k = 3. The window `[4, 2, 1]` has max 4.'],
      panels: [arr([4, 2, 1, 0], { label: 'nums, k = 3', range: [1, 3], highlights: { 0: 'bad', 1: 'window', 2: 'window', 3: 'active' } }), vars({ 'old max': 4 })],
      task: {
        type: 'choose',
        question: 'The window slides: 4 leaves, 0 enters. Can you get the new max from the old max alone?',
        options: [
          { text: 'No: you need the best of 2, 1 and 0, which the old max does not tell you', why: '' },
          { text: 'Yes: old max − 4 + 0', why: 'That is running-sum logic. A max cannot be undone by subtracting.' },
          { text: 'Yes: the newcomer 0 is the new max', why: '0 is smaller than 2 and 1. The new max is 2.' },
        ],
        answer: 0,
      },
      solved: 'The new max is 2, but only a rescan (or a smarter structure) can find it.',
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Four rules per index',
      lines: ['1. **Pop the back** while `nums[back] <= nums[i]`.', '2. **Push** `i` to the back.', '3. **Pop the front** if `front <= i − k`.', '4. Before `i >= k − 1` the first window is incomplete: no answer.', 'After that the **front** is the max: the deque is decreasing.'],
      frames: RUN.slice(0, 4).flatMap(optFramesFor),
    },
    {
      kind: 'turn',
      title: 'Your turn: 5 arrives',
      lines: ['Rule 1: pop the back while `nums[back] <= nums[i]`.'],
      panels: [nArr(4, dqMark(RUN[3].dq)), que(vi(RUN[3].dq), 'deque: value@index')],
      task: { type: 'number', question: 'i = 4, nums[i] = 5. How many indices are popped from the back?', options: [0, 1, 2, 3], answer: RUN[4].popped.length, hint: 'Compare 5 with the back again after each pop.' },
      solved: '-3, -1 and 3 are all ≤ 5: all three go. The deque is just `5@4`.',
      then: optFramesFor(RUN[4]),
    },
    {
      kind: 'turn',
      title: 'Your turn: read the max',
      lines: ['The front holds the largest value still in the window.'],
      panels: [nArr(5, dqMark(RUN[5].dq)), que(vi(RUN[5].dq), 'deque: value@index')],
      task: { type: 'cell', question: 'i = 5, window [3, 5]. Tap the cell the deque front points at.', answer: RUN[5].dq[0], hints: { 5: 'That is the back: 3 is smaller than 5.', 3: 'Index 3 (-3) was popped when 5 arrived.' } },
      solved: 'Front 5@4: the window max is 5.',
      then: RUN.slice(5).flatMap(optFramesFor),
    },
    {
      kind: 'watch',
      title: 'When the front expires',
      lines: ['Above, bigger values always evicted from the back first.', 'With `[9, 1, 1, 1]` and k = 2, the 9 must **expire** from the front.'],
      frames: ERUN.map((r) => ({
        say: r.expired !== null ? 1 : 0,
        note: `i = ${r.i}: ${r.popped.length ? `pop ${r.popped.map((j) => `1@${j}`).join(', ')} (1 ≤ 1); ` : ''}push 1@${r.i}.${r.expired !== null ? ` Front 0 ≤ ${r.i} − 2: 9 expires.` : ''}${r.out !== null ? ` Max = ${r.out}.` : ''}`.replace('push 1@0', 'push 9@0'),
        panels: [
          arr(E, { label: 'nums, k = 2', pointers: [ptr(r.i, 'i')], range: [Math.max(0, r.i - 1), r.i], highlights: { ...dqMark(r.dq), ...dqMark(r.popped, 'muted'), ...(r.expired !== null ? { [r.expired]: 'bad' } : {}) } }),
          que(r.dq.map((j) => `${E[j]}@${j}`), 'deque: value@index'),
          vars({ res: list(r.res) }),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: why indices?',
      lines: ['Same run, but suppose the deque stored **values** only.'],
      panels: [arr(E, { label: 'nums, k = 2', pointers: [ptr(2, 'i')], range: [1, 2] }), que([9, 1], 'deque (values only)')],
      task: {
        type: 'choose',
        question: 'At i = 2 the deque reads `[9, 1]`. Why can you not decide whether 9 left the window?',
        options: [
          { text: 'A value does not say where it came from, so `front <= i − k` cannot be checked', why: '' },
          { text: '9 is the max, so it never leaves', why: 'Every element leaves once its index is ≤ i − k, max or not.' },
          { text: 'Values make the scan O(n²)', why: 'The cost is the same; the problem is telling when the front expired.' },
        ],
        answer: 0,
      },
      solved: 'Store **indices** and read values as `nums[index]`.',
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Flip it: window minimum',
      lines: ['1. Dominated: for a minimum, pop the back while `nums[back] >= nums[i]`.', '2. Push `i` as a candidate.', '3. Expired: pop the front if `front <= i − k`.', '4. Answer: the front is now the window **minimum**.'],
      frames: minFrames,
    },
    {
      kind: 'watch',
      title: 'Two deques, variable window',
      lines: ['`maxD` pops smaller values, `minD` pops bigger ones; both push `right`.', 'While max − min > limit, move `left` and pop fronts that fell behind it.'],
      frames: twoFrames.slice(0, 3),
    },
    {
      kind: 'turn',
      title: 'Your turn: shrink to fit',
      lines: ['7 arrives: maxD front is 7, minD front is 2.', 'max − min = 5 > 4, so `left` must move.'],
      panels: [twoFrame({ ...twoRun[3], left: 1, maxD: twoRun[3].maxD, minD: [1, 2, 3] }, 'x', 0).panels[0], que([7], 'maxD (values)'), que([2, 4, 7], 'minD (values)')],
      task: { type: 'number', question: 'Where does `left` stop?', options: [1, 2, 3], answer: twoRun[3].left, hint: 'Once left passes index 1, the 2 leaves minD and the min becomes 4.' },
      solved: 'left = 2: the window [4, 7] has spread 3 ≤ 4. best stays 2.',
      then: [twoFrames[3]],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'An array + head index as a deque',
      lines: ['`popBack` = `arr.pop()`, `popFront` = `head++`.', '`front` = `arr[head]`, `back` = the last cell.', 'Items only enter at the back, so no pushFront is needed.'],
      frames: headRun.map((h) => ({
        say: h.moved ? 0 : h.pops ? 0 : 2,
        note: `i = ${h.i}: ${h.pops ? `pop() ${h.pops}× from the back, ` : ''}push ${h.i}.${h.moved ? ` Front expired: head++ → ${h.head}.` : ''}${h.i >= 1 ? ` Max = ${h.res[h.res.length - 1]}.` : ''}`,
        panels: [arr(E, { label: 'nums [9, 1, 1, 1], k = 2', pointers: [ptr(h.i, 'i')] }), storeArr(h), vars({ head: h.head, res: list(h.res) })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: popFront',
      lines: ['`arr.pop()` is O(1); `arr.shift()` and `arr.unshift()` are O(n).'],
      panels: [storeArr(headRun[1])],
      task: {
        type: 'choose',
        question: 'In the head-index version, what does `popFront` become?',
        options: [
          { text: '`head++`', why: '' },
          { text: '`dq.shift()`', why: 'Correct result, but O(n): it moves every element.' },
          { text: '`dq.pop()`', why: 'That removes the back, not the front.' },
        ],
        answer: 0,
      },
      solved: '`head++`: the dead cell stays in storage, nothing moves.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the empty-deque trap',
      lines: ['`front()` and `back()` return `undefined` on an empty deque.', '`nums[undefined]` is `undefined`.'],
      panels: [que([], 'deque'), vars({ 'nums[i]': 5 })],
      task: {
        type: 'choose',
        question: 'Without the `isEmpty()` check, what is `nums[dq.back()] <= nums[i]` here?',
        options: [
          { text: '`false`, silently', why: '' },
          { text: 'It throws an error', why: 'No error: `undefined` just makes the comparison false.' },
          { text: '`true`', why: 'Comparing `undefined` with a number is false.' },
        ],
        answer: 0,
      },
      solved: 'A silent `false`. Check `isEmpty()` before `front()` / `back()`.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'maxSlidingWindow, rows 0–3',
      lines: ['Each row: pop back, push, maybe expire the front.', 'From i = 2 the front is the output.'],
      frames: RUN.slice(0, 4).map(dryFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: the big eviction',
      lines: ['i = 4, nums[i] = 5. The deque (values) is `[3, -1, -3]`.'],
      panels: [nArr(4, dqMark(RUN[3].dq)), que([3, -1, -3], 'deque (values)')],
      task: { type: 'order', question: 'Tap the values in the order they are popped from the back.', items: ['-3', '-1', '3'], hint: 'Pops always start from the back end.' },
      solved: '-3, then -1, then 3: exactly the row "pop back: -3, -1, 3".',
      then: RUN.slice(4).map(dryFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: expiries',
      lines: ['Output `[3, 3, 5, 5, 6, 7]`.'],
      panels: [table(DRY.map((r) => `i=${r[0]}`), ['pop back', 'deque', 'out'], DRY.map((r) => [r[2], r[4], r[5] || '·']))],
      task: { type: 'number', question: 'How many times did the front expire in this run?', options: [0, 1, 2, 3], answer: 0, hint: 'Look for a pop that was not from the back.' },
      solved: 'Zero: bigger values kept evicting from the back first.',
    },
  ],

  'optimized-prefix-deque': [
    {
      kind: 'watch',
      title: 'Negatives break the window',
      lines: ['With negatives, **shrinking can increase the sum**.', 'Prefix sums: `P[0] = 0`, and `sum(i..j−1) = P[j] − P[i]`.'],
      frames: [
        { say: 0, note: 'Made-up nums [1, -3, 4, 2]. Window [-3, 4, 2]: sum 3.', panels: [arr(PN, { label: 'nums', range: [1, 3], highlights: { 1: 'window', 2: 'window', 3: 'window' } }), vars({ sum: 3 })] },
        { say: 0, note: 'Shrink: drop -3. The sum goes UP to 6.', panels: [arr(PN, { label: 'nums', range: [2, 3], highlights: { 1: 'muted', 2: 'window', 3: 'window' } }), vars({ sum: 6 })] },
        ...P.map((p, j) => ({ say: 1, note: j === 0 ? 'P[0] = 0.' : `P[${j}] = P[${j - 1}] + ${PN[j - 1]} = ${p}.`, panels: [arr(PN, { label: 'nums', highlights: hl(PN.length, (t) => (t < j ? 'visited' : '')) }), arr(P.slice(0, j + 1), { label: 'P', highlights: { [j]: 'active' } })] })),
        { say: 1, note: 'sum(2..3) = P[4] − P[2] = 4 − (−2) = 6.', panels: [arr(PN, { label: 'nums', range: [2, 3], highlights: { 2: 'window', 3: 'window' } }), arr(P, { label: 'P', highlights: { 2: 'done', 4: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a sum from two prefixes',
      lines: ['`sum(i..j−1) = P[j] − P[i]`.'],
      panels: [arr(PN, { label: 'nums' }), arr(P, { label: 'P' })],
      task: { type: 'number', question: 'What is nums[1] + nums[2] + nums[3], using P?', options: [-3, 3, 4, 6], answer: P[4] - P[1], hint: 'P[4] − P[1].' },
      solved: `P[4] − P[1] = 4 − 1 = ${P[4] - P[1]}. One subtraction, any range.`,
    },
    {
      kind: 'watch',
      title: 'An increasing deque of starts, k = 5',
      lines: ['For each end j we want the latest start i with `P[i] ≤ P[j] − k`.', '**Back rule:** pop starts with `P ≥ P[j]`; the deque stays increasing.', '**Front rule:** if `P[j] − P[front] ≥ k`, record `j − front` and pop it.'],
      frames: prefRun.slice(0, 4).map(prefFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: j = 4',
      lines: ['P[4] = 4. The deque holds `-2@2, 2@3`.', 'The front rule runs before the back rule.'],
      panels: [pArr(4, dqMark(prefRun[3].dq, 'window')), pdq(prefRun[3].dq), vars({ best: '∞', k: 5 })],
      task: {
        type: 'choose',
        question: 'What happens first at j = 4?',
        options: [
          { text: '4 − (−2) = 6 ≥ 5: record length 4 − 2 = 2, pop index 2', why: '' },
          { text: 'Pop index 3 from the back', why: 'Back pops need P[back] ≥ P[j]; 2 < 4, so it stays.' },
          { text: 'Nothing: 4 − 2 = 2 < 5', why: 'That checks index 3, but the front is index 2.' },
        ],
        answer: 0,
      },
      solved: 'Length 2: the subarray [4, 2] with sum 6. Then 4 − 2 = 2 < 5 stops the front rule.',
      then: [prefFrame(prefRun[4]), { say: 2, note: `Done: best = ${prefRun[4].best}.`, panels: [arr(PN, { label: 'nums', range: [2, 3], highlights: { 2: 'done', 3: 'done' } }), vars({ best: prefRun[4].best })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: why pop the front?',
      lines: ['Index 2 was used as a start for end j = 4.'],
      panels: [pArr(4, { 2: 'done', 3: 'window', 4: 'window' }), pdq([3, 4])],
      task: {
        type: 'choose',
        question: 'Why is it safe to throw index 2 away after recording?',
        options: [
          { text: 'Any later end with the same start gives a longer subarray', why: '' },
          { text: 'Its prefix is negative', why: 'The sign does not matter; the length does.' },
          { text: 'It is the oldest index', why: 'Age alone is not the reason; it already gave its shortest answer.' },
        ],
        answer: 0,
      },
      solved: 'The front has done its job: later ends only make it longer.',
    },
  ],

  'optimized-deque-dp': [
    {
      kind: 'watch',
      title: 'best[i] from the last k',
      lines: ['`best[i]` = the best score with which you can stand on index i.', '`best[0] = nums[0]`; `best[i] = nums[i] + max(best[i−k..i−1])`.', 'That max is a **sliding window maximum over best[]**.'],
      frames: dpRun.slice(0, 3).map((d) => dpFrame(d, d.i === 0 ? 1 : 2, dpNote(d))),
    },
    {
      kind: 'turn',
      title: 'Your turn: best[3]',
      lines: ['k = 2: index 3 can be reached from index 1 or 2.', 'Index 0 is out of reach and expires.'],
      panels: [dpFrame({ ...dpRun[2], i: 3, from: null }, 0, 'x').panels[0], arr(dpRun[2].best, { label: 'best', highlights: { 0: 'bad', 1: 'window', 2: 'window' } }), que([1, 0, -1], 'deque (best values)')],
      task: { type: 'number', question: 'What is best[3]? (nums[3] = 4)', options: [3, 4, 5, 0], answer: dpRun[3].best[3], hint: 'After index 0 expires, the front holds best 0.' },
      solved: '4 + 0 = 4. It beats every value behind it, so the deque becomes [4].',
      then: [dpFrame(dpRun[3], 2, dpNote(dpRun[3])), dpFrame(dpRun[4], 2, dpNote(dpRun[4]))],
    },
    {
      kind: 'turn',
      title: 'Your turn: jump from where?',
      lines: ['i = 5: the window holds indices 3 and 4.'],
      panels: [arr(dpRun[4].best.slice(0, 5).concat('?'), { label: 'best', highlights: { 3: 'window', 4: 'window', 5: 'active' } }), que([4, -3], 'deque (best values)')],
      task: { type: 'cell', question: 'Which index does the best path jump to 5 from?', answer: dpRun[5].from, hints: { 4: 'best[4] = −3 is worse than best[3] = 4.', 2: 'Out of reach: 5 − 2 = 3.', 1: 'Out of reach.', 0: 'Out of reach.' } },
      solved: `From index 3: best[5] = 3 + 4 = ${dpRun[5].best[5]}.`,
      then: [dpFrame(dpRun[5], 2, dpNote(dpRun[5])), { say: 0, note: 'Path 0 → 1 → 3 → 5: 1 − 1 + 4 + 3 = 7.', panels: [arr(J, { label: 'nums', highlights: { 0: 'done', 1: 'done', 3: 'done', 5: 'done' } }), arr(dpRun[5].best, { label: 'best', highlights: { 5: 'done' } })] }],
    },
  ],

  mistakes: [
    {
      kind: 'turn',
      title: 'Your turn: the expiry bound',
      lines: ['The index that leaves a size-k window at step i is `i − k`.'],
      panels: [nArr(5)],
      task: { type: 'cell', question: 'k = 3, i = 5. Tap the index that just left the window.', answer: 2, hints: { 3: 'Still inside: the window is [3, 5].', 1: 'That left one step earlier.', 5: 'That just entered.' } },
      solved: '5 − 3 = 2. So the test is `front <= i - k`.',
    },
    {
      kind: 'watch',
      title: 'head === tail: full or empty?',
      lines: ['Store a tail: `tail = (head + count) % cap`.', 'When `head === tail` the buffer is full **or** empty; only `count` tells.'],
      frames: fullFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: first answer',
      lines: ['Reading the answer before the first window is full is a bug.'],
      panels: [nArr(0)],
      task: { type: 'number', question: 'k = 3. At which i do you push the first answer?', options: [0, 1, 2, 3], answer: K - 1, hint: 'The condition is i >= k − 1.' },
      solved: 'i = 2: the first window [0, 2] is complete.',
    },
    {
      kind: 'turn',
      title: 'Your turn: name the mistake',
      lines: ['Shortest subarray with sum ≥ k, nums has negatives.', 'Someone uses a plain sliding window.'],
      panels: [arr(PN, { label: 'nums', range: [1, 3], highlights: { 1: 'bad', 2: 'window', 3: 'window' } })],
      task: {
        type: 'choose',
        question: 'What should they use instead?',
        options: [
          { text: 'Prefix sums + an increasing deque', why: '' },
          { text: 'A wider window', why: 'Width is not the problem: shrinking can raise the sum.' },
          { text: 'A DP with an O(k) inner loop', why: 'That is a different mistake, and too slow when k is large.' },
        ],
        answer: 0,
      },
      solved: 'Negatives → prefix sums + deque.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say the invariant, count the work',
      lines: ['Invariant: indices inside the window, values decreasing; the **front is the max**.', 'O(n): **each index enters and leaves the deque once**.'],
      frames: [{ say: 0, note: 'The deque mid-run: 5@4, 3@5, decreasing, front = max.', panels: [nArr(5, dqMark(RUN[5].dq)), que(vi(RUN[5].dq), 'deque: value@index')] }, ...opsFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: the O(n) bound',
      lines: ['Each index is pushed once and popped at most once.'],
      panels: [arr(N, { label: 'nums, n = 8' }), vars({ pushes: 8 })],
      task: { type: 'number', question: 'n = 8. At most how many deque operations (pushes + pops) can happen?', options: [8, 16, 24, 64], answer: 16, hint: 'One push and at most one pop per index.' },
      solved: '2n = 16. This run used 8 pushes + 7 pops = 15.',
    },
    {
      kind: 'turn',
      title: 'Your turn: DP order of attack',
      lines: ['The interviewer gives you a "best of the last k" DP.'],
      panels: [arr(J, { label: 'nums, k = 2' })],
      task: {
        type: 'choose',
        question: 'What do you write first?',
        options: [
          { text: 'The O(n·k) recurrence, then show the inner max is a sliding window maximum', why: '' },
          { text: 'The deque code straight away', why: 'Start from the slow recurrence; the deque is the optimisation you point out.' },
          { text: 'A circular buffer of size k', why: 'Storage is not the problem; the inner max is.' },
        ],
        answer: 0,
      },
      solved: 'Slow recurrence first, then: "the inner max is a sliding window maximum".',
    },
  ],
};

// a turn's `then` frames link to the turn's own (shorter) lines; drop links that point past them
for (const list of Object.values(steps))
  for (const st of list)
    if (st.kind === 'turn' && st.then) st.then = st.then.map(({ say, ...f }) => (say !== undefined && say < st.lines.length ? { say, ...f } : f));

export default steps;
