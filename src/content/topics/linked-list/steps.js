// Step lessons for Linked List (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every pointer position and link below is produced by running the algorithm on its example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label) => ({ kind: 'stack', values, ...(label ? { label } : {}) });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// a table that reveals its answers row by row: k = row being revealed now
const reveal = (rows, col, k, hidden = '?') => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : hidden]), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));

// ---------- list panels ----------
// list(values, { next, pointers, highlights, doubly }): next[i] is the position node i points to (null = ∅).
// The renderer draws an arrow only between neighbours; a lone node is drawn without ∅ marks.
const chainNext = (n) => (n === 1 ? [undefined] : Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : null)));
const list = (values, opts = {}) => ({ kind: 'list', values, next: opts.next || chainNext(values.length), pointers: opts.pointers || [], highlights: opts.highlights || {}, ...(opts.doubly ? { doubly: true } : {}) });
// nodes panel: ns = [[id, label, x, y, state?]], es = [[from, to, state?]]
const graph = (ns, es) => ({ kind: 'nodes', directed: true, nodes: ns.map(([id, label, x, y, state]) => ({ id, label: String(label), x, y, ...(state ? { state } : {}) })), edges: es.map(([from, to, state]) => ({ from, to, ...(state ? { state } : {}) })) });

// ---------- in-place reversal, one event per line ----------
function revRun(n) {
  const nx = Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : null));
  const ev = [];
  let prev = null,
    cur = 0,
    next = null;
  const snap = (line) => ev.push({ line, prev, cur, next, nx: nx.slice() });
  snap('start');
  while (cur !== null) {
    next = nx[cur];
    snap('save');
    nx[cur] = prev;
    snap('flip');
    prev = cur;
    snap('prev');
    cur = next;
    snap('cur');
  }
  return ev;
}
const revPanel = (vals, e) =>
  list(vals, {
    next: e.nx,
    pointers: [...(e.prev !== null ? [ptr(e.prev, 'prev')] : []), ...(e.cur !== null ? [ptr(e.cur, 'cur', 'b')] : []), ...(e.next !== null && e.next !== e.cur ? [ptr(e.next, 'next', 'c')] : [])],
    highlights: hl(vals.length, (k) => (k === e.cur ? 'active' : e.prev !== null && k <= e.prev ? 'done' : '')),
  });
const nm = (vals, i) => (i === null ? 'null' : String(vals[i]));
const revVars = (vals, e) => vars({ prev: nm(vals, e.prev), cur: nm(vals, e.cur), next: e.line === 'start' ? '—' : nm(vals, e.next) });
const REV_NOTE = {
  start: (v, e) => `prev = null, cur = ${nm(v, e.cur)}.`,
  save: (v, e) => `next = cur.next: save ${nm(v, e.next)} before touching the arrow.`,
  flip: (v, e) => `cur.next = prev: ${nm(v, e.cur)} now points to ${nm(v, e.nx[e.cur])}.`,
  prev: (v, e) => `prev = cur: prev moves to ${nm(v, e.prev)}.`,
  cur: (v, e) => (e.cur === null ? 'cur = next: cur is null, it fell off the end.' : `cur = next: cur moves to ${nm(v, e.cur)}.`),
};
const REV4 = [1, 2, 3, 4];
const R4 = revRun(4);
const revFrame = (e, say) => ({ say, note: REV_NOTE[e.line](REV4, e), panels: [revPanel(REV4, e), revVars(REV4, e)] });

// ---------- removeNthFromEnd on D → 1..5 ----------
function nthRun(len, n) {
  // positions: 0 = dummy, 1..len = nodes
  const ev = [];
  let fast = 0,
    slow = 0;
  ev.push({ ph: 'start', fast, slow });
  for (let i = 0; i < n; i++) {
    fast++;
    ev.push({ ph: 'gap', fast, slow, i: i + 1 });
  }
  while (fast < len) {
    fast++;
    slow++;
    ev.push({ ph: 'walk', fast, slow });
  }
  ev.push({ ph: 'cut', fast, slow, target: slow + 1 });
  return ev;
}
const NTH_VALS = ['D', 1, 2, 3, 4, 5];
const nthPanel = (e) => {
  const next = chainNext(6);
  const hlx = { 0: 'muted' };
  if (e.ph === 'cut') {
    next[e.slow] = e.target + 1 <= 5 ? e.target + 1 : null;
    hlx[e.target] = 'bad';
  }
  return list(NTH_VALS, { next, pointers: [ptr(e.slow, 'slow'), ptr(e.fast, 'fast', 'b')], highlights: hlx });
};
const NTH = nthRun(5, 2);
const NTH_HEAD = nthRun(5, 5);

// ---------- Floyd on 1 → 2 → 3 → 4 → 5 → 6 → (back to 3) ----------
const CYC_NX = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 3 };
const CYC_POS = { 1: [0, 0], 2: [1.3, 0], 3: [2.6, 0], 4: [3.9, 0], 5: [3.9, 1.2], 6: [2.6, 1.2] };
const cycGraph = (st) =>
  graph(
    Object.keys(CYC_POS).map((k) => [+k, k, ...CYC_POS[k], st[k] || '']),
    Object.entries(CYC_NX).map(([a, b]) => [+a, b]),
  );
// gap = steps from fast forward to slow along the cycle (only once both are on it)
const ON_CYCLE = [3, 4, 5, 6];
const gapOf = (s, f) => {
  if (!ON_CYCLE.includes(s) || !ON_CYCLE.includes(f)) return '—';
  let g = 0;
  for (let c = f; c !== s; c = CYC_NX[c]) g++;
  return g;
};
const FLOYD = [];
{
  let s = 1,
    f = 1;
  FLOYD.push({ s, f });
  do {
    s = CYC_NX[s];
    f = CYC_NX[CYC_NX[f]];
    FLOYD.push({ s, f });
  } while (s !== f);
}
const floydState = ({ s, f }) => (s === f ? { [s]: 'done' } : { [s]: 'active', [f]: 'visited' });
const PHASE2 = [];
{
  let p = 1,
    s = FLOYD[FLOYD.length - 1].s;
  PHASE2.push({ p, s });
  while (p !== s) {
    p = CYC_NX[p];
    s = CYC_NX[s];
    PHASE2.push({ p, s });
  }
}

// ---------- happy number 19 (Floyd with f = sum of squared digits) ----------
const sq = (n) => [...String(n)].reduce((t, d) => t + d * d, 0);
const HAPPY = [19];
while (HAPPY[HAPPY.length - 1] !== 1) HAPPY.push(sq(HAPPY[HAPPY.length - 1]));
const HAPPY_RUN = [];
{
  let s = 19,
    f = 19;
  HAPPY_RUN.push({ s, f });
  do {
    s = sq(s);
    f = sq(sq(f));
    HAPPY_RUN.push({ s, f });
  } while (s !== f);
}
const happyGraph = ({ s, f }) =>
  graph(
    HAPPY.map((v, i) => [v, v, i * 1.4, 0, s === f && v === s ? 'done' : v === s ? 'active' : v === f ? 'visited' : '']),
    HAPPY.map((v, i) => [v, i < HAPPY.length - 1 ? HAPPY[i + 1] : v]),
  );

// ---------- find the duplicate: i → nums[i] ----------
const DUP = [1, 3, 4, 2, 2];
const DUP_WALK = [];
{
  const seen = new Set();
  for (let i = 0; !seen.has(i); i = DUP[i]) {
    seen.add(i);
    DUP_WALK.push(i);
  }
  DUP_WALK.push(DUP_WALK.length ? DUP[DUP_WALK[DUP_WALK.length - 1]] : 0);
}

// ---------- merge two sorted lists by splicing ----------
function mergeRun(A, B) {
  const ev = [];
  let i = 0,
    j = 0;
  const out = [];
  ev.push({ i, j, out: out.slice(), what: 'start' });
  while (i < A.length && j < B.length) {
    if (A[i] <= B[j]) out.push(A[i++]);
    else out.push(B[j++]);
    ev.push({ i, j, out: out.slice(), what: 'take', v: out[out.length - 1] });
  }
  ev.push({ i, j, out: out.slice(), what: 'one-empty' });
  const rest = i < A.length ? A.slice(i) : B.slice(j);
  out.push(...rest);
  ev.push({ i: A.length, j: B.length, out: out.slice(), what: 'attach', rest });
  return ev;
}
const MA = [1, 5, 8];
const MB = [2, 4];
const MERGE = mergeRun(MA, MB);
const mergePanels = (e) => {
  const res = ['D', ...e.out];
  const ps = [list(res, { pointers: [ptr(0, 'dummy'), ptr(res.length - 1, 't', 'b')], highlights: { 0: 'muted', ...(e.what === 'take' ? { [res.length - 1]: 'active' } : {}), ...(e.what === 'attach' ? hl(res.length, (k) => (k === 0 ? 'muted' : k > res.length - 1 - e.rest.length ? 'active' : 'done')) : {}) } })];
  const left = (L, k, name) => (k < L.length ? list(L.slice(k), { pointers: [ptr(0, name, 'c')] }) : null);
  const a = left(MA, e.i, 'a');
  const b = left(MB, e.j, 'b');
  if (a) ps.push(a);
  if (b) ps.push(b);
  const v = {};
  if (!a) v.a = 'null';
  if (!b) v.b = 'null';
  if (Object.keys(v).length) ps.push(vars(v));
  return ps;
};
const MERGE_TURN = MERGE.findIndex((e) => e.what === 'one-empty');

// ---------- first middle: slow = head, fast = head.next ----------
function firstMid(n) {
  const ev = [];
  let s = 0,
    f = 1;
  ev.push({ s, f });
  while (f < n && f + 1 < n) {
    s++;
    f += 2;
    ev.push({ s, f });
  }
  return ev;
}
const SPLIT = [4, 2, 1, 3];
const SPLIT_RUN = firstMid(SPLIT.length);
const MID6 = firstMid(6);

// ---------- reorder 1..5: split, reverse, weave ----------
const RO = [1, 2, 3, 4, 5];
const RO_MID = firstMid(RO.length);
const RO_S = RO_MID[RO_MID.length - 1].s; // index of the first middle
const RO_LEFT = RO.slice(0, RO_S + 1);
const RO_RIGHT = RO.slice(RO_S + 1).reverse();
const WEAVE = [];
{
  const out = [];
  for (let k = 0; k < RO_LEFT.length; k++) {
    out.push(RO_LEFT[k]);
    WEAVE.push({ out: out.slice(), from: 'left', k });
    if (k < RO_RIGHT.length) {
      out.push(RO_RIGHT[k]);
      WEAVE.push({ out: out.slice(), from: 'right', k });
    }
  }
}

// ---------- LRU (Map + doubly linked list with sentinels H and T) ----------
function lruRun(cap, ops) {
  const order = []; // keys from most recent (front) to least recent
  const ev = [];
  for (const [op, key] of ops) {
    let evicted = null;
    const had = order.includes(key);
    if (op === 'get') {
      if (had) {
        order.splice(order.indexOf(key), 1);
        order.unshift(key);
      }
    } else {
      if (had) order.splice(order.indexOf(key), 1);
      order.unshift(key);
      if (order.length > cap) evicted = order.pop();
    }
    ev.push({ op, key, had, evicted, order: order.slice() });
  }
  return ev;
}
const lruList = (order, hot, evicted) => {
  const vals = ['H', ...order, ...(evicted !== null && evicted !== undefined ? [evicted] : []), 'T'];
  return list(vals.map(String), {
    doubly: true,
    highlights: hl(vals.length, (k) => (k === 0 || k === vals.length - 1 ? 'muted' : evicted !== null && evicted !== undefined && k === vals.length - 2 ? 'bad' : vals[k] === hot ? 'active' : '')),
  });
};
const keysText = (ks) => (ks.length ? ks.slice().sort((x, y) => x - y).join(',') : '—');
const lruNote = (e) =>
  e.op === 'get'
    ? `get(${e.key}): the map finds node ${e.key}; remove it and add it at the front.`
    : e.evicted !== null
      ? `put(${e.key}): add ${e.key} at the front. Size > 2 → evict T.prev (${e.evicted}) and delete it from the map.`
      : `put(${e.key}): new node at the front, map.set(${e.key}).`;
const lruFrame = (e, say) => ({
  say,
  note: lruNote(e),
  panels: [lruList(e.order, e.key, e.evicted), vars({ op: `${e.op}(${e.key})`, 'map keys': keysText(e.order) })],
});
const LRU = lruRun(2, [
  ['put', 1],
  ['put', 2],
  ['get', 1],
  ['put', 3],
]);
const LRU_NEXT = lruRun(2, [
  ['put', 1],
  ['put', 2],
  ['get', 1],
  ['put', 3],
  ['put', 4],
]).slice(4);

// ---------- palindrome 1 → 2 → 2 → 1 ----------
function palRun(vals) {
  const n = vals.length;
  const nx = Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : null));
  const ev = [];
  let s = 0,
    f = 0;
  ev.push({ ph: 'mid', s, f, nx: nx.slice() });
  while (f !== null && nx[f] !== null) {
    s = nx[s];
    f = nx[nx[f]];
    ev.push({ ph: 'mid', s, f, nx: nx.slice() });
  }
  let prev = null;
  while (s !== null) {
    const next = nx[s];
    nx[s] = prev;
    prev = s;
    s = next;
    ev.push({ ph: 'rev', prev, s, nx: nx.slice() });
  }
  let a = 0,
    b = prev;
  while (b !== null) {
    const ok = vals[a] === vals[b];
    ev.push({ ph: 'cmp', a, b, ok, nx: nx.slice() });
    if (!ok) return ev;
    a = nx[a];
    b = nx[b];
  }
  ev.push({ ph: 'end', nx: nx.slice() });
  return ev;
}
const PAL = [1, 2, 2, 1];
const PAL_RUN = palRun(PAL);
const palFrame = (e) => {
  const p = [];
  if (e.ph === 'mid') {
    p.push(ptr(e.s, 'slow'));
    if (e.f !== null) p.push(ptr(e.f, 'fast', 'b'));
  }
  if (e.ph === 'rev') {
    p.push(ptr(e.prev, 'prev'));
    if (e.s !== null) p.push(ptr(e.s, 'slow', 'b'));
  }
  if (e.ph === 'cmp') p.push(ptr(e.a, 'a'), ptr(e.b, 'b', 'b'));
  const say = { mid: 0, rev: 1, cmp: 2, end: 2 }[e.ph];
  const note =
    e.ph === 'mid'
      ? e.f === null
        ? `fast is null → stop. slow is on the second ${PAL[e.s]} (position ${e.s + 1}).`
        : `slow = ${PAL[e.s]} (pos ${e.s + 1}), fast = pos ${e.f + 1}.`
      : e.ph === 'rev'
        ? `Flip: pos ${e.prev + 1} now points to ${e.nx[e.prev] === null ? 'null' : `pos ${e.nx[e.prev] + 1}`}.${e.s === null ? ' Second half reversed: prev is its head.' : ''}`
        : e.ph === 'cmp'
          ? `a.val = ${PAL[e.a]}, b.val = ${PAL[e.b]} → ${e.ok ? 'equal, step both' : 'different → false'}.`
          : 'b is null → every pair matched → true.';
  return {
    say,
    note,
    panels: [list(PAL, { next: e.nx, pointers: p, highlights: e.ph === 'cmp' ? { [e.a]: e.ok ? 'done' : 'bad', [e.b]: e.ok ? 'done' : 'bad' } : e.ph === 'end' ? hl(4, () => 'done') : {} })],
  };
};

// ---------- dry run tables (copied from topic.js) ----------
const DRY_REV = [
  ['0', 'null', '1', '—', '—', '(empty)'],
  ['1', '1', '2', '2', '1 → null', '1'],
  ['2', '2', '3', '3', '2 → 1', '2 → 1'],
  ['3', '3', 'null', 'null', '3 → 2', '3 → 2 → 1'],
];
const DRY_FLOYD = [
  ['0', '3', '3', 'start'],
  ['1', '2', '0', 'no'],
  ['2', '0', '2', 'no'],
  ['3', '-4', '-4', 'yes'],
];
// node ids are the values (all distinct): 3 → 2 → 0 → -4 → (back to 2)
const F_NX = { 3: 2, 2: 0, 0: -4, '-4': 2 };
const F_POS = { 3: [0, 0], 2: [1.5, 0], 0: [3, 0], '-4': [2.25, 1.2] };
const fGraph = (st) =>
  graph(
    Object.keys(F_POS).map((k) => [k, k, ...F_POS[k], st[k] || '']),
    Object.entries(F_NX).map(([a, b]) => [a, String(b)]),
  );
const dryRevNext = [
  [1, 2, null],
  [null, 2, null],
  [null, 0, null],
  [null, 0, 1],
];

export default {
  what: [
    {
      kind: 'watch',
      title: 'Follow the arrows',
      lines: ['Each node holds a value and an arrow to the next node.', 'To reach a node you start at the **head** and follow arrows.', 'The last node points to `null`.'],
      frames: [
        { say: 0, note: 'Three nodes. Each `next` arrow points at the following node.', panels: [list([1, 2, 3], { pointers: [ptr(0, 'head')] })] },
        ...[0, 1, 2].map((k) => ({
          say: 1,
          note: k === 0 ? 'Start at the head: node 1.' : `Follow one arrow: node ${k + 1}.`,
          panels: [list([1, 2, 3], { pointers: [ptr(0, 'head'), ...(k > 0 ? [ptr(k, 'cur', 'b')] : [])], highlights: hl(3, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) })],
        })),
        { say: 2, note: 'Node 3 is the **tail**: its `next` is null. The walk ends.', panels: [list([1, 2, 3], { pointers: [ptr(0, 'head'), ptr(2, 'tail', 'b')], highlights: { 2: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no jumping',
      lines: ['Nodes are not stored next to each other.', 'There is no index: only arrows.'],
      panels: [list([4, 8, 15, 16, 23], { pointers: [ptr(0, 'head')], highlights: { 3: 'active' } })],
      task: { type: 'number', question: 'How many `next` arrows do you follow from the head to reach 16?', options: [1, 2, 3, 4], answer: 3, hint: 'Count the arrows between 4 and 16, not the nodes.' },
      solved: 'Three hops: 4 → 8 → 15 → 16. An array would jump straight there.',
      then: [8, 15, 16].map((v, k) => ({
        say: 1,
        note: `Hop ${k + 1}: node ${v}.`,
        panels: [list([4, 8, 15, 16, 23], { pointers: [ptr(0, 'head'), ptr(k + 1, 'cur', 'b')], highlights: hl(5, (i) => (i === k + 1 ? (v === 16 ? 'done' : 'active') : i <= k ? 'visited' : '')) })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: an arrow pointing back',
      lines: ['Here node 4 points back to node 2.', 'Some node pointing back to an earlier node is a **cycle**.'],
      panels: [graph([[1, 1, 0, 0], [2, 2, 1.5, 0], [3, 3, 3, 0], [4, 4, 2.25, 1.2, 'active']], [[1, 2], [2, 3], [3, 4], [4, 2, 'active']])],
      task: {
        type: 'choose',
        question: 'You walk this list from node 1, following `next`. What happens?',
        options: [
          { text: 'The walk never reaches `null`', why: '' },
          { text: 'It stops at node 4, the tail', why: 'Node 4 has a `next`: node 2. A tail is a node whose `next` is null.' },
          { text: 'It visits every node once, then stops', why: 'After node 4 it goes back to node 2, then 3, then 4 again, forever.' },
        ],
        answer: 0,
      },
      solved: 'In a cycle, walking never reaches `null`: 1, 2, 3, 4, 2, 3, 4, …',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Insert at the front: array vs list',
      lines: ['An array must shift every element to make room at the front: O(n).', 'A list only needs one new arrow: O(1).'],
      frames: [
        { say: 0, note: 'Insert 0 at the front of [1, 2, 3].', panels: [arr([1, 2, 3, '·'], { label: 'array' })] },
        ...[
          [1, 2, '·', 3],
          [1, '·', 2, 3],
          ['·', 1, 2, 3],
        ].map((a, k) => ({ say: 0, note: `Shift ${3 - k} one cell right.`, panels: [arr(a, { label: 'array', highlights: { [3 - k]: 'active' } })] })),
        { say: 0, note: 'Write 0. Three shifts for three elements: O(n).', panels: [arr([0, 1, 2, 3], { label: 'array', highlights: { 0: 'done' } })] },
        {
          say: 1,
          note: 'The list: a new node 0, not linked yet.',
          panels: [graph([[0, 0, 0, 1, 'active'], [1, 1, 1, 0], [2, 2, 2.3, 0], [3, 3, 3.6, 0]], [[1, 2], [2, 3]]), vars({ head: 1 })],
        },
        {
          say: 1,
          note: '`node.next = head`: one arrow.',
          panels: [graph([[0, 0, 0, 1, 'active'], [1, 1, 1, 0], [2, 2, 2.3, 0], [3, 3, 3.6, 0]], [[0, 1, 'active'], [1, 2], [2, 3]]), vars({ head: 1 })],
        },
        {
          say: 1,
          note: '`head = node`. Nothing else moved: O(1).',
          panels: [graph([[0, 0, 0, 1, 'done'], [1, 1, 1, 0], [2, 2, 2.3, 0], [3, 3, 3.6, 0]], [[0, 1], [1, 2], [2, 3]]), vars({ head: 0 })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the array’s win',
      lines: ['The two make opposite trade-offs.', 'Each one is faster at something.'],
      panels: [arr([7, 9, 4, 6], { label: 'array', pointers: [ptr(3, 'i')] }), list([7, 9, 4, 6], { pointers: [ptr(0, 'head')] })],
      task: {
        type: 'choose',
        question: 'Which operation is faster on the array than on the list?',
        options: [
          { text: 'Read the i-th element', why: '' },
          { text: 'Insert at the front', why: 'The array shifts everything: O(n). The list does it in O(1).' },
          { text: 'Delete after a node you already hold', why: 'The list changes arrows in O(1); the array shifts: O(n).' },
        ],
        answer: 0,
      },
      solved: 'Reading index i is O(1) on an array; the list walks i arrows from the head: O(i).',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Five techniques',
      lines: ['Five techniques cover almost everything.', 'Each one has its own trigger.'],
      frames: [
        ['Dummy head', 'head may change'],
        ['Reversal', 'reverse, reorder'],
        ['Fast & slow', 'middle, cycle'],
        ['Merge & split', 'merge, sort'],
        ['Map + DLL', 'O(1) cache'],
      ].map((_, k, all) => ({ say: k === 0 ? 0 : 1, note: `${all[k][0]} → ${all[k][1]}.`, panels: [reveal(all, 'use it when', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the technique',
      lines: ['Match the problem’s words to a technique.'],
      panels: [list([1, 2, 3, 4, 5, 6], { highlights: { 0: 'window', 1: 'window', 2: 'window' } })],
      task: {
        type: 'choose',
        question: '"Reverse the nodes in groups of k." Which technique?',
        options: [
          { text: 'In-place reversal', why: '' },
          { text: 'Fast & slow pointers', why: 'Fast & slow is for middle, cycle, n-th from end.' },
          { text: 'Map + doubly linked list', why: 'That is for O(1) cache designs.' },
        ],
        answer: 0,
      },
      solved: '"Groups of k" is listed under in-place reversal.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clue → technique',
      lines: ['The input is the `head` of a ListNode: think pointer manipulation.', 'The wording points at the technique.'],
      frames: [
        ['"reverse"', 'reversal'],
        ['"reorder"', 'reversal'],
        ['"cycle"', 'fast & slow'],
        ['"middle"', 'fast & slow'],
      ].map((_, k, all) => ({ say: k === 0 ? 0 : 1, note: `${all[k][0]} → ${all[k][1]}.`, panels: [reveal(all, 'technique', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the cache clue',
      lines: ['One clue is not about a given list at all.'],
      panels: [table(['"design a cache with O(1) get/put"'], ['technique'], [['?']], [['active']])],
      task: {
        type: 'choose',
        question: 'Which technique does this clue point to?',
        options: [
          { text: 'Map + doubly linked list', why: '' },
          { text: 'Dummy head', why: 'A dummy helps when the head may change; it does not give O(1) lookup by key.' },
          { text: 'Merge & split', why: 'That is for merging or sorting lists.' },
        ],
        answer: 0,
      },
      solved: 'An O(1) cache design → Map + doubly linked list.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Move a finger vs redraw an arrow',
      lines: ['`cur = cur.next` moves a finger: the list is unchanged.', '`cur.next = …` redraws an arrow: the old rest is lost unless saved.', 'Golden rule: save what the arrow pointed to first.'],
      frames: [
        { say: 0, note: 'cur is on 1.', panels: [list([1, 2, 3, 4], { pointers: [ptr(0, 'cur')] })] },
        { say: 0, note: '`cur = cur.next`: the finger moved to 2. Every arrow is the same.', panels: [list([1, 2, 3, 4], { pointers: [ptr(1, 'cur')] })] },
        {
          say: 1,
          note: '`cur.next = null` with nothing saved: 3 and 4 are unreachable.',
          panels: [list([1, 2, 3, 4], { next: [1, null, 3, null], pointers: [ptr(1, 'cur')], highlights: { 2: 'bad', 3: 'bad' } })],
        },
        { say: 2, note: 'Try again. First `rest = cur.next` saves 3.', panels: [list([1, 2, 3, 4], { pointers: [ptr(1, 'cur'), ptr(2, 'rest', 'b')] })] },
        {
          say: 2,
          note: 'Now `cur.next = null`. 3 → 4 is still reachable through `rest`.',
          panels: [list([1, 2, 3, 4], { next: [1, null, 3, null], pointers: [ptr(1, 'cur'), ptr(2, 'rest', 'b')], highlights: { 2: 'done', 3: 'done' } })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: insert X after 2',
      lines: ['cur is on node 2. Put X between 2 and 3.', 'Follow the golden rule.'],
      panels: [graph([[1, 1, 0, 0], [2, 2, 1.5, 0, 'active'], [3, 3, 3, 0], ['X', 'X', 2.25, 1.2]], [[1, 2], [2, 3]])],
      task: { type: 'order', question: 'Tap the two writes in a safe order.', items: ['X.next = cur.next', 'cur.next = X'], hint: '`cur.next` is the only way to reach 3. Use it before you overwrite it.' },
      solved: 'X first takes over the old arrow (to 3), then 2 points to X.',
      then: [
        { say: 1, note: '`X.next = cur.next`: X points to 3. 2 still points to 3 too.', panels: [graph([[1, 1, 0, 0], [2, 2, 1.5, 0, 'active'], [3, 3, 3, 0], ['X', 'X', 2.25, 1.2, 'done']], [[1, 2], [2, 3], ['X', 3, 'active']])] },
        { say: 1, note: '`cur.next = X`: 1 → 2 → X → 3. Nothing was lost.', panels: [graph([[1, 1, 0, 0], [2, 2, 1.5, 0, 'active'], [3, 3, 3, 0], ['X', 'X', 2.25, 1.2, 'done']], [[1, 2], [2, 'X', 'active'], ['X', 3]])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who does the deleting?',
      lines: ['To delete a node you change the arrow that points **at** it.'],
      panels: [list([1, 2, 3, 4], { highlights: { 2: 'bad' } })],
      task: {
        type: 'choose',
        question: 'To delete 3, whose `next` do you rewrite?',
        options: [
          { text: 'Node 2’s: `prev.next = cur.next`', why: '' },
          { text: 'Node 3’s', why: 'Node 2 still points at 3, so 3 stays in the list.' },
          { text: 'Node 4’s', why: 'Node 4’s arrow goes away from 3, not into it.' },
        ],
        answer: 0,
      },
      solved: 'You need the node **before** it. That is why we walk with a `prev` pointer.',
      then: [{ say: 0, note: '`prev.next = cur.next`: 2 now skips to 4.', panels: [list([1, 2, 4])] }],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Copy, solve, rebuild',
      lines: ['Copy the values into an array.', 'Solve it with indices: here, reverse.', 'Rebuild a list: **new** nodes, O(n) extra memory.'],
      frames: [
        { say: 0, note: 'The list 1 → 2 → 3.', panels: [list([1, 2, 3], { pointers: [ptr(0, 'head')] })] },
        { say: 0, note: '`listToArray(head)` → [1, 2, 3].', panels: [list([1, 2, 3], { pointers: [ptr(0, 'head')] }), arr([1, 2, 3], { label: 'vals' })] },
        { say: 1, note: '`vals.reverse()` → [3, 2, 1].', panels: [list([1, 2, 3], { pointers: [ptr(0, 'head')] }), arr([3, 2, 1], { label: 'vals', highlights: hl(3, () => 'active') })] },
        {
          say: 2,
          note: '`arrayToList(vals)` builds three new nodes. The old nodes are not reused.',
          panels: [list([1, 2, 3], { highlights: hl(3, () => 'muted') }), arr([3, 2, 1], { label: 'vals' }), list([3, 2, 1], { pointers: [ptr(0, 'new head')], highlights: hl(3, () => 'done') })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the memory bill',
      lines: ['The copy is O(n) time but also O(n) space.'],
      panels: [list([5, 6, 7, 8, 9], { pointers: [ptr(0, 'head')] })],
      task: { type: 'number', question: 'How many new nodes does `arrayToList` create for this 5-node list?', options: [0, 1, 5, 10], answer: 5, hint: 'It builds the whole reversed list from the array.' },
      solved: 'Five: one per value. The in-place version creates none.',
    },
  ],

  'optimized-dummy': [
    {
      kind: 'watch',
      title: 'Job 1: the builder',
      lines: ['`tail` starts at the dummy.', 'Each step: `tail.next = node; tail = node`. No "is it empty?" check.', 'Return `dummy.next`.'],
      frames: [
        { say: 0, note: 'Only the dummy D. tail = D.', panels: [list(['D'], { pointers: [ptr(0, 'tail')], highlights: { 0: 'muted' } })] },
        ...[2, 5, 7].map((v, k) => {
          const vals = ['D', ...[2, 5, 7].slice(0, k + 1)];
          return { say: 1, note: `\`tail.next = ${v}; tail = ${v}\`. Same two lines${k === 0 ? ', even for the first node' : ''}.`, panels: [list(vals, { pointers: [ptr(vals.length - 1, 'tail')], highlights: { 0: 'muted', [vals.length - 1]: 'active' } })] };
        }),
        { say: 2, note: 'Return `dummy.next`: 2 → 5 → 7.', panels: [list(['D', 2, 5, 7], { pointers: [ptr(1, 'dummy.next')], highlights: { 0: 'muted', 1: 'done', 2: 'done', 3: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Job 2: remove the 2nd from the end',
      lines: ['`fast` and `slow` start at the dummy.', '`fast` moves n steps ahead to open a gap.', 'Both move until `fast` is the last node.', '`slow` is now the node **before** the target: unlink it.'],
      frames: NTH.map((e) => ({
        say: { start: 0, gap: 1, walk: 2, cut: 3 }[e.ph],
        note:
          e.ph === 'start'
            ? 'removeNthFromEnd(1→2→3→4→5, n = 2). Both start at D.'
            : e.ph === 'gap'
              ? `Gap step ${e.i}: fast → ${NTH_VALS[e.fast]}.`
              : e.ph === 'walk'
                ? `fast.next exists → both step: slow ${NTH_VALS[e.slow]}, fast ${NTH_VALS[e.fast]}.`
                : `fast.next is null. \`slow.next = slow.next.next\`: ${NTH_VALS[e.slow]} skips ${NTH_VALS[e.target]}.`,
        panels: [nthPanel(e)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: remove the head',
      lines: ['Same list, but n = 5: the target is the head itself.'],
      panels: [nthPanel(NTH_HEAD[0])],
      task: {
        type: 'choose',
        question: 'After the gap loop and the while loop, where is `slow`?',
        options: [
          { text: 'On D, the dummy', why: '' },
          { text: 'On node 1', why: 'Node 1 is the target. slow stops one node **before** it.' },
          { text: 'On node 5', why: 'That is where fast stops after the gap of 5.' },
        ],
        answer: 0,
      },
      solved: 'slow is on D, the head’s predecessor. The same line removes the head: no special case.',
      then: NTH_HEAD.slice(1).map((e) => ({
        say: 0,
        note: e.ph === 'gap' ? `Gap step ${e.i}: fast → ${NTH_VALS[e.fast]}.` : `fast.next is null, so the while loop never ran. \`D.next = D.next.next\`: the head 1 is gone. Return \`dummy.next\` = 2.`,
        panels: [nthPanel(e)],
      })),
    },
  ],

  'intuition-reversal': [
    {
      kind: 'watch',
      title: 'One flip, four lines',
      lines: ['`prev` starts as null; `cur` is the head.', '`prev` holds the reversed part.', '`next` saves the rest **before** the flip.', 'Each step: save next, flip, advance prev, advance cur.'],
      frames: R4.slice(0, 5).map((e) => revFrame(e, { start: 0, save: 2, flip: 3, prev: 1, cur: 3 }[e.line])),
    },
    {
      kind: 'turn',
      title: 'Your turn: the four lines',
      lines: ['Node 1 is flipped. cur is on 2.', 'Run the next step.'],
      panels: [revPanel(REV4, R4[4]), revVars(REV4, R4[4])],
      task: { type: 'order', question: 'Tap the four lines of one step in order.', items: ['next = cur.next', 'cur.next = prev', 'prev = cur', 'cur = next'], hint: 'Save what you would lose, flip, then move both fingers forward.' },
      solved: 'Save, flip, advance prev, advance cur.',
      then: R4.slice(5, 9).map((e) => revFrame(e, 1)),
    },
    {
      kind: 'watch',
      title: 'Until cur falls off',
      lines: ['Repeat the same four lines.', 'When `cur` is null, `prev` is the new head.'],
      frames: [
        ...R4.slice(9).filter((e) => e.line === 'flip' || e.line === 'cur').map((e) => revFrame(e, 0)),
        { say: 1, note: 'cur is null → return prev: 4 → 3 → 2 → 1.', panels: [list(REV4, { next: R4[R4.length - 1].nx, pointers: [ptr(3, 'new head')], highlights: hl(4, () => 'done') })] },
      ],
    },
  ],

  'optimized-reversal': [
    {
      kind: 'watch',
      title: 'Recursive reversal',
      lines: ['Reverse the rest first.', '`head.next.next = head`: the node after me points to me.', '`head.next = null`: I become the tail.', 'Every call waits on the stack: O(n) space.'],
      frames: (() => {
        const pos = { 1: [0, 0], 2: [1.5, 0], 3: [3, 0] };
        const g = (es, st = {}) => graph([1, 2, 3].map((k) => [k, k, ...pos[k], st[k] || '']), es);
        return [
          { say: 3, note: 'reverseList(1) calls reverseList(2).', panels: [g([[1, 2], [2, 3]], { 1: 'active' }), stk(['rev(1)'], 'calls')] },
          { say: 3, note: 'reverseList(2) calls reverseList(3).', panels: [g([[1, 2], [2, 3]], { 2: 'active' }), stk(['rev(1)', 'rev(2)'], 'calls')] },
          { say: 0, note: '3 has no next: base case. It returns 3: newHead.', panels: [g([[1, 2], [2, 3]], { 3: 'done' }), stk(['rev(1)', 'rev(2)', 'rev(3)'], 'calls')] },
          { say: 1, note: 'Back in rev(2): `head.next.next = head` → 3 points to 2.', panels: [g([[1, 2], [2, 3], [3, 2, 'active']], { 2: 'active', 3: 'done' }), stk(['rev(1)', 'rev(2)'], 'calls')] },
          { say: 2, note: '`head.next = null`: 2 drops its arrow to 3.', panels: [g([[1, 2], [3, 2]], { 2: 'done', 3: 'done' }), stk(['rev(1)', 'rev(2)'], 'calls')] },
          { say: 1, note: 'Back in rev(1): 2 now points to 1.', panels: [g([[1, 2], [3, 2], [2, 1, 'active']], { 1: 'active', 2: 'done', 3: 'done' }), stk(['rev(1)'], 'calls')] },
          { say: 2, note: '`head.next = null`. Return newHead 3: 3 → 2 → 1.', panels: [g([[3, 2], [2, 1]], { 1: 'done', 2: 'done', 3: 'done' }), stk([], 'calls')] },
        ];
      })(),
    },
    {
      kind: 'watch',
      title: 'Partial reversal: positions 3..5',
      lines: ['Walk `prev` from a dummy to node left − 1.', '`cur = prev.next`: it ends as the segment’s tail.', '`right − left` times: move the node after `cur` to the front of the segment.', 'Both ends stay connected at every step.'],
      frames: (() => {
        const v = ['D', 1, 2, 3, 4, 5];
        const seg = (order, p, c) => list(order, { pointers: [ptr(order.indexOf(p), 'prev'), ...(c !== null ? [ptr(order.indexOf(c), 'cur', 'b')] : [])], highlights: { 0: 'muted', ...Object.fromEntries([3, 4, 5].map((x) => [order.indexOf(x), 'window'])) } });
        const frames = [
          { say: 0, note: 'left = 3, right = 5. prev starts at D.', panels: [list(v, { pointers: [ptr(0, 'prev')], highlights: { 0: 'muted' } })] },
          { say: 0, note: 'prev steps left − 1 = 2 times: to 1, then to 2.', panels: [seg(v, 2, null)] },
          { say: 1, note: 'cur = prev.next = 3.', panels: [seg(v, 2, 3)] },
        ];
        const order = v.slice();
        for (let m = 0; m < 5 - 3; m++) {
          const c = order.indexOf(3);
          const move = order[c + 1];
          order.splice(c + 1, 1);
          order.splice(order.indexOf(2) + 1, 0, move);
          frames.push({ say: 2, note: `Move ${m + 1}: take ${move} (after cur), put it right after prev.`, panels: [seg(order.slice(), 2, 3), vars({ move })] });
        }
        frames.push({ say: 3, note: '1 → 2 → 5 → 4 → 3. Nothing to reconnect at the end.', panels: [list(order.slice(1), { highlights: { 2: 'done', 3: 'done', 4: 'done' } })] });
        return frames;
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: how many moves?',
      lines: ['Each head-insertion move puts one more node at the front of the segment.'],
      panels: [list([1, 2, 3, 4, 5, 6], { highlights: { 1: 'window', 2: 'window', 3: 'window', 4: 'window', 5: 'window' } })],
      task: { type: 'number', question: 'Reverse positions 2..6. How many moves does head insertion make?', options: [3, 4, 5, 6], answer: 4, hint: 'The loop runs `right − left` times.' },
      solved: '6 − 2 = 4 moves. The first node of the segment (2) never moves; it just ends up last.',
    },
    {
      kind: 'watch',
      title: 'k-group reversal, k = 2',
      lines: ['From `groupPrev`, check that k nodes exist.', 'Reverse those k nodes and link `groupPrev.next` to the new group head.', 'Move `groupPrev` to the old group head (now the group tail).', 'Fewer than k nodes left: stop, the leftover stays as is.'],
      frames: [
        { say: 0, note: 'groupPrev = D. 1 and 2 exist: a full group.', panels: [list(['D', 1, 2, 3, 4, 5], { pointers: [ptr(0, 'groupPrev')], highlights: { 0: 'muted', 1: 'window', 2: 'window' } })] },
        { say: 1, note: 'Reverse 1, 2 → 2, 1. D.next = 2.', panels: [list(['D', 2, 1, 3, 4, 5], { pointers: [ptr(0, 'groupPrev')], highlights: { 0: 'muted', 1: 'done', 2: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does groupPrev go?',
      lines: ['The first group is done: D → 2 → 1 → 3 → 4 → 5.', '`groupPrev` must sit just before the next group.', 'Repeat until fewer than k nodes are left.'],
      panels: [list(['D', 2, 1, 3, 4, 5], { pointers: [ptr(0, 'groupPrev')], highlights: { 0: 'muted', 1: 'done', 2: 'done' } })],
      task: {
        type: 'choose',
        question: 'Which node becomes the new `groupPrev`?',
        options: [
          { text: 'Node 1, the old group head', why: '' },
          { text: 'Node 2, the new group head', why: '2 is the front of the group. The next group starts after 1, not after 2.' },
          { text: 'Node 3', why: '3 is the first node of the next group; groupPrev must be the node before it.' },
        ],
        answer: 0,
      },
      solved: 'Node 1: it was the group head and is now the group tail.',
      then: [
        { say: 1, note: 'groupPrev = 1. 3 and 4 exist: a full group.', panels: [list(['D', 2, 1, 3, 4, 5], { pointers: [ptr(2, 'groupPrev')], highlights: { 0: 'muted', 3: 'window', 4: 'window' } })] },
        { say: 2, note: 'Reverse 3, 4 → 4, 3. 1.next = 4.', panels: [list(['D', 2, 1, 4, 3, 5], { pointers: [ptr(2, 'groupPrev')], highlights: { 0: 'muted', 3: 'done', 4: 'done' } })] },
        { say: 2, note: 'groupPrev = 3. Only 5 is left: fewer than 2 → stop. Result 2 → 1 → 4 → 3 → 5.', panels: [list(['D', 2, 1, 4, 3, 5], { pointers: [ptr(4, 'groupPrev')], highlights: { 0: 'muted', 5: 'muted' } })] },
      ],
    },
  ],

  'intuition-fast-slow': [
    {
      kind: 'watch',
      title: 'Middle: half the distance',
      lines: ['Slow moves 1 node per step, fast moves 2.', 'When fast reaches the end, slow is at the middle.'],
      frames: (() => {
        const out = [];
        let s = 0,
          f = 0;
        const fr = (note, say, done) => ({ say, note, panels: [list([1, 2, 3, 4, 5], { pointers: [ptr(s, 'slow'), ...(f !== null && f !== s ? [ptr(f, 'fast', 'b')] : [])], highlights: { [s]: done ? 'done' : 'active' } }), vars({ slow: s + 1, fast: f === null ? 'null' : f + 1 })] });
        out.push(fr('Both start at the head.', 0));
        while (f !== null && f + 1 < 5) {
          s += 1;
          f = f + 2 < 5 ? f + 2 : null;
          out.push(fr(`slow +1, fast +2.`, 0));
        }
        out.push(fr(`fast is on the last node: it cannot move 2. slow is on ${s + 1}, the middle.`, 1, true));
        return out;
      })(),
    },
    {
      kind: 'watch',
      title: 'Cycle: the gap shrinks by 1',
      lines: ['On a circular track the faster runner laps the slower one.', 'Once both are in the cycle, measure the gap from fast to slow.', 'Each step the gap shrinks by exactly 1, so it hits 0.'],
      frames: FLOYD.map((st, k) => {
        const gap = gapOf(st.s, st.f);
        return {
          say: k === 0 ? 0 : gap === '—' ? 0 : st.s === st.f ? 2 : 1,
          note: k === 0 ? 'slow and fast both start at 1. Node 6 points back to 3.' : st.s === st.f ? `Both on ${st.s}: gap 0. They met.` : gap === '—' ? `slow ${st.s}, fast ${st.f}. Slow is not in the cycle yet.` : `slow ${st.s}, fast ${st.f}. Gap from fast to slow: ${gap}.`,
          panels: [cycGraph(floydState(st)), vars({ slow: st.s, fast: st.f, gap })],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: steps to the entry',
      lines: ['a = head → entry, c = cycle length, b = meeting point past the entry.', '`a = k·c − b`: reset one pointer to head, keep the other at the meeting point.', 'Move both one step at a time.'],
      panels: [cycGraph({ 1: 'visited', 5: 'active' }), vars({ p: 1, slow: 5 })],
      task: { type: 'number', question: 'They met at 5. How many single steps until p and slow stand on the same node?', options: [1, 2, 3, 4], answer: 2, hint: 'They meet at the entry, after a steps. Count head → entry.' },
      solved: 'a = 2 (1 → 2 → 3). Check: c = 4, b = 2 (3 → 4 → 5), and a = 1·4 − 2 = 2.',
      then: PHASE2.slice(1).map((st) => ({
        say: 2,
        note: st.p === st.s ? `p = ${st.p}, slow = ${st.s}: same node. The entry is ${st.p}.` : `p = ${st.p}, slow = ${st.s}.`,
        panels: [cycGraph(st.p === st.s ? { [st.p]: 'done' } : { [st.p]: 'visited', [st.s]: 'active' }), vars({ p: st.p, slow: st.s })],
      })),
    },
    {
      kind: 'watch',
      title: 'Implicit list: happy number 19',
      lines: ['The nodes do not have to be ListNodes: `next(n)` = sum of squares of digits.', '1 leads to 1, so a happy number gets stuck at 1.', 'Run Floyd: `slow = f(slow)`, `fast = f(f(fast))`; check if they meet at 1.'],
      frames: [
        { say: 0, note: '19 → 82 → 68 → 100 → 1. (1² + 9² = 82, 8² + 2² = 68, …)', panels: [happyGraph({ s: null, f: null })] },
        ...HAPPY_RUN.map((st, k) => ({
          say: k === HAPPY_RUN.length - 1 ? 1 : 2,
          note: k === 0 ? 'slow = fast = 19.' : st.s === st.f ? `They meet at ${st.s}. It is 1 → happy.` : `slow = ${st.s}, fast = ${st.f}.`,
          panels: [happyGraph(st), vars({ slow: st.s, fast: st.f })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the duplicate as an entry',
      lines: ['Indices are nodes; `next(i) = nums[i]`.', 'Start at index 0. The path runs into a cycle.', 'The first node you see twice is the entry: the duplicate.'],
      panels: [arr(DUP, { label: 'nums' })],
      task: { type: 'cell', question: 'Follow i → nums[i] from index 0. Tap the first index you reach a second time.', answer: DUP_WALK[DUP_WALK.length - 1], hints: { 0: 'Index 0 is only the start: no value is 0, so nothing points back to it.' } },
      solved: 'Index 2. Two cells (3 and 4) hold the value 2: two arrows into node 2, so it is the entry and the duplicate.',
      then: DUP_WALK.map((i, k) => ({
        say: k === DUP_WALK.length - 1 ? 2 : 0,
        note: k === 0 ? 'Start at index 0.' : k === DUP_WALK.length - 1 ? `nums[${DUP_WALK[k - 1]}] = ${i}: back to index ${i}. The cycle entry.` : `nums[${DUP_WALK[k - 1]}] = ${i} → go to index ${i}.`,
        panels: [arr(DUP, { label: 'nums', pointers: [ptr(i, 'i')], highlights: hl(5, (j) => (k === DUP_WALK.length - 1 && j === i ? 'done' : j === i ? 'active' : DUP_WALK.slice(0, k).includes(j) ? 'visited' : '')) })],
      })),
    },
  ],

  'optimized-merge-split': [
    {
      kind: 'watch',
      title: 'Merge by splicing',
      lines: ['Compare the two heads, attach the smaller one to `t`.', 'Advance that list.', 'When one runs out, attach the other in one move.'],
      frames: MERGE.slice(0, MERGE_TURN + 1).map((e) => ({
        say: e.what === 'take' ? 1 : e.what === 'one-empty' ? 2 : 0,
        note: e.what === 'start' ? 'a = 1 → 5 → 8, b = 2 → 4. t starts at the dummy.' : e.what === 'take' ? `${e.v} is smaller: \`t.next = ${e.v}\`, advance its list, t moves on.` : 'b is empty. a still holds 5 → 8.',
        panels: mergePanels(e),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one list ran out',
      lines: ['b is null. a is 5 → 8, already sorted.'],
      panels: mergePanels(MERGE[MERGE_TURN]),
      task: {
        type: 'choose',
        question: 'What does the merge do now?',
        options: [
          { text: '`t.next = a`: attach the rest in one move', why: '' },
          { text: 'Keep attaching 5, then 8, one by one', why: 'It works, but a is already sorted. One arrow attaches all of it.' },
          { text: 'Copy 5 and 8 into new nodes', why: 'Merging relinks existing nodes. No new nodes are needed.' },
        ],
        answer: 0,
      },
      solved: 'One arrow: `t.next = a`. The result is 1 → 2 → 4 → 5 → 8.',
      then: [{ say: 0, note: '`t.next = a`: 5 → 8 joins in one move. Return `dummy.next`.', panels: mergePanels(MERGE[MERGE.length - 1]) }],
    },
    {
      kind: 'watch',
      title: 'Sort a list: split at the first middle',
      lines: ['Find the **first** middle: `slow = head`, `fast = head.next`.', 'Cut: `right = mid.next; mid.next = null`.', 'Sort both halves, then merge them.'],
      frames: [
        ...SPLIT_RUN.map((st, k) => ({
          say: 0,
          note: k === 0 ? 'slow on 4, fast one ahead on 2.' : k === SPLIT_RUN.length - 1 ? `slow on ${SPLIT[st.s]}, fast on ${SPLIT[st.f]}. fast.next is null → stop. mid = ${SPLIT[st.s]}.` : `slow on ${SPLIT[st.s]}, fast on ${SPLIT[st.f]}.`,
          panels: [list(SPLIT, { pointers: [ptr(st.s, 'slow'), ptr(st.f, 'fast', 'b')], highlights: { [st.s]: 'active' } })],
        })),
        { say: 1, note: '`mid.next = null`: 4 → 2 | 1 → 3. Two separate halves.', panels: [list([4, 2], { pointers: [ptr(0, 'left')] }), list([1, 3], { pointers: [ptr(0, 'right', 'b')] })] },
        { say: 2, note: 'Sort each half: 2 → 4 and 1 → 3.', panels: [list([2, 4], { highlights: { 0: 'done', 1: 'done' } }), list([1, 3], { highlights: { 0: 'done', 1: 'done' } })] },
        { say: 2, note: 'Merge them by relinking: 1 → 2 → 3 → 4.', panels: [list([1, 2, 3, 4], { highlights: hl(4, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where is the first middle?',
      lines: ['`slow = head`, `fast = head.next`.', 'Loop while `fast && fast.next`: slow +1, fast +2.'],
      panels: [list([1, 2, 3, 4, 5, 6], { pointers: [ptr(0, 'slow'), ptr(1, 'fast', 'b')] })],
      task: { type: 'number', question: 'On 1 → … → 6, which value is slow on when the loop stops?', options: [2, 3, 4, 5], answer: MID6[MID6.length - 1].s + 1, hint: 'Step it: fast goes 2 → 4 → 6, then 6 has no next.' },
      solved: '3: the halves are 1 → 2 → 3 and 4 → 5 → 6.',
      then: MID6.slice(1).map((st, k) => ({
        say: 1,
        note: k === MID6.length - 2 ? `fast on ${st.f + 1} has no next → stop. slow is on ${st.s + 1}.` : `slow ${st.s + 1}, fast ${st.f + 1}.`,
        panels: [list([1, 2, 3, 4, 5, 6], { pointers: [ptr(st.s, 'slow'), ptr(st.f, 'fast', 'b')], highlights: { [st.s]: k === MID6.length - 2 ? 'done' : 'active' } })],
      })),
    },
    {
      kind: 'watch',
      title: 'Reorder list: split, reverse, weave',
      lines: ['**Split** at the middle.', '**Reverse** the second half.', '**Weave**: take one node from each half in turn.'],
      frames: [
        { say: 0, note: '1 → 2 → 3 → 4 → 5. Find the middle with fast & slow.', panels: [list(RO, { pointers: [ptr(RO_S, 'mid')], highlights: { [RO_S]: 'active' } })] },
        { say: 0, note: `Cut after ${RO[RO_S]}: ${RO_LEFT.join(' → ')} | ${RO.slice(RO_S + 1).join(' → ')}.`, panels: [list(RO_LEFT), list(RO.slice(RO_S + 1))] },
        { say: 1, note: `Reverse the second half: ${RO_RIGHT.join(' → ')}.`, panels: [list(RO_LEFT), list(RO_RIGHT, { highlights: hl(RO_RIGHT.length, () => 'active') })] },
        ...WEAVE.map((w, k) => ({
          say: 2,
          note: `Take ${w.out[w.out.length - 1]} from the ${w.from} half.${k === WEAVE.length - 1 ? ' Result: L0 → Ln → L1 → Ln-1 → …' : ''}`,
          panels: [list(w.out, { highlights: { [w.out.length - 1]: k === WEAVE.length - 1 ? 'done' : 'active' } })],
        })),
      ],
    },
  ],

  'optimized-cache': [
    {
      kind: 'watch',
      title: 'LRU, capacity 2',
      lines: ['The Map finds a key’s node in O(1).', 'The doubly linked list keeps keys by recency: most recent next to H.', 'Sentinels H and T mean the list is never empty.', 'Full → evict `T.prev`, the least recently used.'],
      frames: [
        { say: 2, note: 'Empty cache: just H ⇄ T.', panels: [lruList([], null, null), vars({ op: '—', 'map keys': '—' })] },
        ...LRU.map((e) => lruFrame(e, e.op === 'get' ? 0 : e.evicted !== null ? 3 : 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who is evicted?',
      lines: ['Cache (capacity 2) after the last step: H ⇄ 3 ⇄ 1 ⇄ T.', 'Now `put(4)`.'],
      panels: [lruList(LRU[LRU.length - 1].order, null, null), vars({ op: 'put(4)', 'map keys': keysText(LRU[LRU.length - 1].order) })],
      task: {
        type: 'choose',
        question: 'Which key is evicted?',
        options: [
          { text: 'Key 1', why: '' },
          { text: 'Key 3', why: '3 was used more recently than 1: it sits closer to H.' },
          { text: 'Key 4', why: '4 is the newest: it goes in at the front.' },
        ],
        answer: 0,
      },
      solved: 'Key 1: it is `T.prev`, the least recently used.',
      then: LRU_NEXT.map((e) => lruFrame(e, 1)),
    },
    {
      kind: 'watch',
      title: 'The JS Map shortcut',
      lines: ['A JS Map keeps **insertion order**, oldest first.', 'Mark as used: `map.delete(k); map.set(k, v)`.', 'Least recent: `map.keys().next().value`.'],
      frames: [
        { say: 0, note: 'put(1), put(2): keys in insertion order.', panels: [arr([1, 2], { label: 'map keys (oldest first)' })] },
        { say: 1, note: 'get(1): delete 1, set 1 again. It moves to the end.', panels: [arr([2, 1], { label: 'map keys (oldest first)', highlights: { 1: 'active' } })] },
        { say: 0, note: 'put(3): added at the end. Size 3 > capacity 2.', panels: [arr([2, 1, 3], { label: 'map keys (oldest first)', highlights: { 2: 'active' } })] },
        { say: 2, note: '`map.keys().next().value` is 2, the oldest → delete it.', panels: [arr([2, 1, 3], { label: 'map keys (oldest first)', highlights: { 0: 'bad' } })] },
        { say: 2, note: 'Same result as the Map + DLL version: keys 1 and 3 remain.', panels: [arr([1, 3], { label: 'map keys (oldest first)' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'LFU, capacity 2',
      lines: ['`freqMap`: freq → keys with that freq, oldest first.', 'On every use, move the key from bucket f to f + 1.', 'New key: if full, evict the first key of `freqMap.get(minFreq)`, then minFreq = 1.'],
      frames: [
        [0, 'put(1): freq 1.', [['1'], ['—']], 1],
        [0, 'put(2): freq 1, after 1.', [['1, 2'], ['—']], 1],
        [1, 'get(1): 1 moves from bucket 1 to bucket 2. Bucket 1 still has 2 → minFreq stays 1.', [['2'], ['1']], 1],
        [2, 'put(3): full. Evict the first key of bucket minFreq = 1: key 2.', [['2'], ['1']], 1, true],
        [2, 'Insert 3 with freq 1, minFreq = 1.', [['3'], ['1']], 1],
      ].map(([say, note, cells, minFreq, evict]) => ({
        say,
        note,
        panels: [table(['f = 1', 'f = 2'], ['keys'], cells, [[evict ? 'bad' : ''], ['']], 'freqMap'), vars({ minFreq })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: minFreq after a use',
      lines: ['Now `get(3)`: 3 moves from bucket 1 to bucket 2.', 'If bucket f became empty and f === minFreq, do minFreq++.'],
      panels: [table(['f = 1', 'f = 2'], ['keys'], [['3'], ['1']], [['active'], ['']], 'freqMap'), vars({ minFreq: 1 })],
      task: { type: 'number', question: 'What is minFreq after `get(3)`?', options: [1, 2, 3], answer: 2, hint: 'Is anything left in bucket 1 after 3 leaves?' },
      solved: 'Bucket 1 is empty and 1 was minFreq → minFreq = 2.',
      then: [{ say: 1, note: '3 joins bucket 2 after 1. Bucket 1 is empty → minFreq = 2.', panels: [table(['f = 1', 'f = 2'], ['keys'], [['—'], ['1, 3']], [['muted'], ['done']], 'freqMap'), vars({ minFreq: 2 })] }],
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Five building blocks',
      lines: ['Dummy + tail builder.', 'Reverse: return prev.', 'First middle: `fast` starts at `head.next`.', 'Floyd: the cycle entry, or null.', 'Merge: `t.next = a ?? b` at the end.'],
      frames: [
        { say: 0, note: '`dummy = new ListNode(0, head)`, `tail = dummy`.', panels: [list(['D', 1, 2], { pointers: [ptr(0, 'tail')], highlights: { 0: 'muted' } })] },
        { say: 1, note: 'reverse(1 → 2 → 3) returns 3.', panels: [list([1, 2, 3], { next: [null, 0, 1], pointers: [ptr(2, 'prev')], highlights: hl(3, () => 'done') })] },
        { say: 2, note: 'firstMiddle(1 → 2 → 3 → 4) returns 2.', panels: [list([1, 2, 3, 4], { pointers: [ptr(1, 'slow')], highlights: { 1: 'done' } })] },
        { say: 3, note: 'cycleEntry on 1 → … → 6 → 3 returns 3.', panels: [cycGraph({ 3: 'done' })] },
        { say: 4, note: 'merge(1 → 3, 2) → 1 → 2 → 3.', panels: [list(['D', 1, 2, 3], { highlights: { 0: 'muted', 1: 'done', 2: 'done', 3: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: when does cycleEntry return null?',
      lines: ['`while (fast && fast.next)` guards every step.'],
      panels: [list([1, 2, 3, 4], { pointers: [ptr(2, 'slow')] }), vars({ fast: 'null' })],
      task: {
        type: 'choose',
        question: 'fast became null. What does cycleEntry return?',
        options: [
          { text: '`null`: fast reached the end, so there is no cycle', why: '' },
          { text: 'slow: the node it stopped on', why: 'slow only matters after slow === fast. Here they never met.' },
          { text: 'head: the walk restarts', why: 'The reset to head happens only after a meeting.' },
        ],
        answer: 0,
      },
      solved: 'The loop exits and the function returns null. A list with an end has no cycle.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Palindrome: middle, reverse, compare',
      lines: ['Find the middle with slow and fast.', 'Reverse the second half from slow.', 'Compare the halves node by node.'],
      frames: PAL_RUN.map(palFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: odd length',
      lines: ['Same function on 1 → 2 → 3 → 2 → 1.', 'slow stops on 3; the half from 3 is reversed: 1 → 2 → 3.', '`a` walks from the head, `b` from the reversed half.'],
      panels: [list([1, 2, 3, 2, 1], { next: [1, 2, null, 2, 3], pointers: [ptr(0, 'a'), ptr(4, 'b', 'b')] })],
      task: { type: 'number', question: 'How many value comparisons does the compare loop make?', options: [2, 3, 5], answer: 3, hint: 'The loop runs while `b` is not null. b walks the reversed half.' },
      solved: 'Three: (1, 1), (2, 2), (3, 3). b runs out after the middle node.',
      then: [
        [0, 4, 'a = 1, b = 1: equal.'],
        [1, 3, 'a = 2, b = 2: equal.'],
        [2, 2, 'a and b are both on 3: equal. b.next is null → true.'],
      ].map(([a, b, note]) => ({ say: 2, note, panels: [list([1, 2, 3, 2, 1], { next: [1, 2, null, 2, 3], pointers: [ptr(a, 'a'), ptr(b, 'b', 'b')], highlights: { [a]: 'done', [b]: 'done' } })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: put an existing key',
      lines: ['`put` first removes the old node if the key exists.', 'Then it adds a new node at the front and checks the size.'],
      panels: [lruList([2, 1], null, null), vars({ op: 'put(1, 9)', 'map keys': '1,2' })],
      task: {
        type: 'choose',
        question: 'Capacity 2, keys 2 and 1 cached. What does `put(1, 9)` evict?',
        options: [
          { text: 'Nothing', why: '' },
          { text: 'Key 2', why: 'The old node for 1 was removed first, so the size is still 2: not over capacity.' },
          { text: 'Key 1', why: 'Key 1 was just put at the front: it is the most recent.' },
        ],
        answer: 0,
      },
      solved: 'Nothing. The old 1 is removed, the new 1 goes to the front, size stays 2.',
      then: [
        { say: 0, note: '`_remove(old node 1)`.', panels: [lruList([2], null, null), vars({ op: 'put(1, 9)', 'map keys': '1,2' })] },
        { say: 1, note: '`_addFront(new node 1)`, `map.set(1, node)`. Size 2: no eviction.', panels: [lruList([1, 2], 1, null), vars({ op: 'put(1, 9)', 'map keys': '1,2' })] },
      ],
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'reverseList(1 → 2 → 3)',
      lines: ['Each row is one loop step: save next, flip one arrow, advance.', 'cur is null → the loop ends; return prev (node 3).'],
      frames: DRY_REV.map((r, k) => ({
        say: k === 3 ? 1 : 0,
        note: k === 0 ? 'Step 0: prev = null, cur = 1. Nothing reversed yet.' : `Step ${r[0]}: saved next = ${r[3]}, flipped ${r[4]}. Reversed part: ${r[5]}.`,
        panels: [
          list([1, 2, 3], {
            next: dryRevNext[k],
            pointers: [...(r[1] !== 'null' ? [ptr(+r[1] - 1, 'prev')] : []), ...(r[2] !== 'null' ? [ptr(+r[2] - 1, 'cur', 'b')] : [])],
            highlights: hl(3, (i) => (i < k ? 'done' : '')),
          }),
          vars({ step: r[0], prev: r[1], cur: r[2], next: r[3] }),
        ],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: Floyd on 3 → 2 → 0 → -4',
      lines: ['-4 points back to 2.', 'slow +1, fast +2 per step, both from 3.'],
      panels: [fGraph({ 3: 'done' }), vars({ slow: 3, fast: 3 })],
      task: { type: 'number', question: 'At which step do slow and fast first meet?', options: [2, 3, 4, 5], answer: 3, hint: 'Step it: fast goes 3 → 0 → 2 → …' },
      solved: 'Step 3, on -4.',
      then: DRY_FLOYD.slice(1).map((r) => ({
        say: 1,
        note: `Step ${r[0]}: slow = ${r[1]}, fast = ${r[2]}. Met? ${r[3]}.`,
        panels: [fGraph(r[1] === r[2] ? { [r[1]]: 'done' } : { [r[1]]: 'active', [r[2]]: 'visited' }), vars({ step: r[0], slow: r[1], fast: r[2] })],
      })),
    },
    {
      kind: 'watch',
      title: 'Phase 2: find the entry',
      lines: ['Reset p = head; slow stays at the meeting point.', 'Step both by one until p === slow.', 'a = 1, c = 3, b = 2: a + b = 3 = 1·c.'],
      frames: [
        { say: 0, note: 'p = 3 (head), slow = -4.', panels: [fGraph({ 3: 'visited', '-4': 'active' }), vars({ p: 3, slow: -4 })] },
        { say: 1, note: 'Step 4: p = 2, slow = 2. p === slow → the entry is node 2.', panels: [fGraph({ 2: 'done' }), vars({ p: 2, slow: 2 })] },
        { say: 2, note: 'Head → entry is 1 step (a), the cycle has 3 nodes (c), they met 2 past the entry (b).', panels: [fGraph({ 2: 'done', '-4': 'active' }), vars({ a: 1, b: 2, c: 3 })] },
      ],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Null dereference',
      lines: ['`fast.next.next` crashes when `fast` or `fast.next` is null.', 'Always guard with `fast && fast.next`.'],
      frames: [
        { say: 1, note: 'slow and fast on 1.', panels: [list([1, 2, 3, 4], { pointers: [ptr(0, 'slow'), ptr(0, 'fast', 'b')] })] },
        { say: 1, note: 'Guard true → slow 2, fast 3.', panels: [list([1, 2, 3, 4], { pointers: [ptr(1, 'slow'), ptr(2, 'fast', 'b')] })] },
        { say: 1, note: 'fast.next is 4 → guard true → slow 3, fast = 4.next = null.', panels: [list([1, 2, 3, 4], { pointers: [ptr(2, 'slow')] }), vars({ fast: 'null' })] },
        { say: 0, note: 'Without the guard, the next `fast.next` reads a property of null: crash.', panels: [list([1, 2, 3, 4], { pointers: [ptr(2, 'slow')] }), vars({ fast: 'null', 'fast.next': 'crash' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the old head',
      lines: ['1 → 2 → 3 was reversed in place.', 'The variable `head` still refers to node 1.'],
      panels: [list([1, 2, 3], { next: [null, 0, 1], pointers: [ptr(0, 'head'), ptr(2, 'prev', 'b')] })],
      task: {
        type: 'choose',
        question: 'The function returns `head`. What list does the caller get?',
        options: [
          { text: 'Just 1', why: '' },
          { text: '3 → 2 → 1', why: 'That list starts at prev (3), not at head.' },
          { text: '1 → 2 → 3', why: 'The arrows were flipped: 1.next is now null.' },
        ],
        answer: 0,
      },
      solved: 'Node 1 is now the tail. Return `prev`.',
    },
    {
      kind: 'watch',
      title: 'Forgetting to cut',
      lines: ['After splitting, set `mid.next = null`.', 'Otherwise the left half still runs into the right half.'],
      frames: [
        { say: 1, note: 'mid = 2, right = mid.next = 1. No cut.', panels: [list([4, 2, 1, 3], { pointers: [ptr(0, 'left'), ptr(1, 'mid', 'b'), ptr(2, 'right', 'c')] })] },
        { say: 1, note: 'Walk from left: 4 → 2 → 1 → 3. The "left half" is the whole list.', panels: [list([4, 2, 1, 3], { pointers: [ptr(0, 'left'), ptr(2, 'right', 'c')], highlights: hl(4, () => 'bad') })] },
        { say: 0, note: '`mid.next = null`: left is 4 → 2, right is 1 → 3.', panels: [list([4, 2, 1, 3], { next: [1, null, 3, null], pointers: [ptr(0, 'left'), ptr(2, 'right', 'c')], highlights: { 0: 'done', 1: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: values vs nodes',
      lines: ['A cycle check stores **values** in a Set.', 'Two different nodes can hold the same value.'],
      panels: [list([1, 2, 1, 3], { highlights: { 0: 'active', 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'On 1 → 2 → 1 → 3 → null, what does it report?',
        options: [
          { text: 'A cycle, wrongly', why: '' },
          { text: 'No cycle', why: 'The second 1 is already in the Set of values, so it says "seen before".' },
          { text: 'It loops forever', why: 'The walk reaches null after 3; it ends.' },
        ],
        answer: 0,
      },
      solved: 'It sees 1 twice and says "cycle". Compare nodes with `===`, not `.val`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: 1-indexed positions',
      lines: ['Positions are 1-indexed.', 'Start `prev` at a dummy and step `left − 1` times.'],
      panels: [list(['D', 1, 2, 3, 4], { pointers: [ptr(0, 'prev')], highlights: { 0: 'muted', 3: 'window' } })],
      task: { type: 'number', question: 'left = 3. How many steps does prev take from D?', options: [1, 2, 3], answer: 2, hint: 'prev must stop on the node just before position 3.' },
      solved: 'Two steps: D → 1 → 2. prev is right before position 3.',
      then: [{ say: 1, note: 'prev on 2, just before position 3.', panels: [list(['D', 1, 2, 3, 4], { pointers: [ptr(2, 'prev')], highlights: { 0: 'muted', 3: 'window' } })] }],
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'State the edge cases',
      lines: ['Say them up front: empty list, one node, two nodes.', 'Also: the head changes, cycles.'],
      frames: [
        { say: 0, note: 'Empty list: head is null.', panels: [vars({ head: 'null' })] },
        { say: 0, note: 'One node.', panels: [list([7], { pointers: [ptr(0, 'head')] })] },
        { say: 0, note: 'Two nodes.', panels: [list([7, 8], { pointers: [ptr(0, 'head')] })] },
        { say: 1, note: 'The head itself may change: reach for a dummy.', panels: [list(['D', 7, 8], { pointers: [ptr(0, 'dummy')], highlights: { 0: 'muted', 1: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: name the roles',
      lines: ['For caches, explain both structures before coding.'],
      panels: [lruList([3, 1], null, null), vars({ 'map keys': '1,3' })],
      task: {
        type: 'choose',
        question: 'Which role does each structure play?',
        options: [
          { text: 'Map = find, DLL = order', why: '' },
          { text: 'Map = order, DLL = find', why: 'Finding a node in a list means walking it: O(n). The Map finds it in O(1).' },
          { text: 'Both store the order', why: 'The Map is for lookup by key; recency order lives in the DLL.' },
        ],
        answer: 0,
      },
      solved: 'Map = find, DLL = order. Then mention the JS Map insertion-order shortcut.',
    },
  ],
};
