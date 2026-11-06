// Shorts for Linked List (M9). Format: src/content/shortSchema.js. Facts come only from topics/linked-list/topic.js.
// Every pointer position, link and cache order below is produced by running the pattern's code on its "e.g." input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
// list(values, { next, pointers, highlights, label, doubly }): next[i] = position node i points to (null = ∅)
const chainNext = (n) => Array.from({ length: n }, (_, i) => (i < n - 1 ? i + 1 : null));
const list = (values, opts = {}) => ({ kind: 'list', values, next: opts.next || chainNext(values.length), pointers: opts.pointers || [], highlights: opts.highlights || {}, ...(opts.label ? { label: opts.label } : {}), ...(opts.doubly ? { doubly: true } : {}) });
// nodes panel: ns = [[id, label, x, y, state?]], es = [[from, to, state?]]
const graph = (ns, es) => ({ kind: 'nodes', directed: true, nodes: ns.map(([id, label, x, y, state]) => ({ id, label: String(label), x, y, ...(state ? { state } : {}) })), edges: es.map(([from, to, state]) => ({ from, to, ...(state ? { state } : {}) })) });

// ---------- dummy node: remove every 7 from 7 → 2 → 7 → 5 ----------
const RM = ['D', 7, 2, 7, 5];
const RM_VAL = 7;
const rmFrames = [];
let rmHead;
{
  const nx = chainNext(RM.length);
  const gone = [];
  let prev = 0;
  const panel = (look) =>
    list(RM, {
      next: nx.slice(),
      label: 'dummy + list, val = 7',
      pointers: [ptr(0, 'dummy', 'c'), ...(prev ? [ptr(prev, 'prev')] : [ptr(0, 'prev')])],
      highlights: hl(RM.length, (k) => (k === 0 ? 'muted' : gone.includes(k) ? 'bad' : k === look ? 'active' : k <= prev ? 'visited' : '')),
    });
  rmFrames.push({ say: 0, note: '`dummy = new ListNode(0, head)`: D → 7 → 2 → 7 → 5. prev starts at D, before the head.', panels: [panel(null)] });
  while (nx[prev] !== null) {
    const c = nx[prev];
    if (RM[c] === RM_VAL) {
      nx[prev] = nx[c];
      gone.push(c);
      rmFrames.push({ say: 1, note: `prev.next is ${RM[c]} = val: \`prev.next = prev.next.next\`. ${RM[prev]} now skips it${prev === 0 ? ', even though it was the head' : ''}.`, panels: [panel(null)] });
    } else {
      prev = c;
      rmFrames.push({ say: 2, note: `prev.next is ${RM[c]}, not ${RM_VAL}: keep it, \`prev = prev.next\`.`, panels: [panel(c)] });
    }
  }
  rmHead = RM[nx[0]];
  rmFrames.push({ say: 3, note: `prev.next is null: done. \`dummy.next\` is ${rmHead}, the new head.`, panels: [panel(null), vars({ 'dummy.next': rmHead, head: '7 (removed)' })] });
}

// ---------- reversal: reverse 5 → 6 → 7 ----------
const RV = [5, 6, 7];
const RV_EV = [];
{
  const nx = chainNext(RV.length);
  let prev = null,
    cur = 0,
    next = null;
  const snap = (line) => RV_EV.push({ line, prev, cur, next, nx: nx.slice() });
  snap('start');
  while (cur !== null) {
    next = nx[cur];
    snap('save');
    nx[cur] = prev;
    snap('flip');
    prev = cur;
    cur = next;
    snap('advance');
  }
}
const nmv = (i) => (i === null ? 'null' : String(RV[i]));
const rvPanels = (e) => [
  list(RV, {
    next: e.nx,
    pointers: [...(e.prev !== null ? [ptr(e.prev, 'prev')] : []), ...(e.cur !== null ? [ptr(e.cur, 'cur', 'b')] : []), ...(e.line === 'save' && e.next !== null ? [ptr(e.next, 'next', 'c')] : [])],
    highlights: hl(RV.length, (k) => (k === e.cur ? 'active' : e.prev !== null && k <= e.prev ? 'done' : '')),
  }),
  vars({ prev: nmv(e.prev), cur: nmv(e.cur), next: e.line === 'start' ? '—' : nmv(e.next) }),
];
const RV_NOTE = {
  start: () => '`prev = null, cur = head`: cur is on 5. Nothing is reversed yet.',
  save: (e) => `\`next = cur.next\`: save ${nmv(e.next)} before touching ${nmv(e.cur)}'s arrow.`,
  flip: (e) => `\`cur.next = prev\`: ${nmv(e.cur)} now points to ${nmv(e.nx[e.cur])}. ${e.next !== null ? `Only \`next\` still reaches ${nmv(e.next)}.` : ''}`.trim(),
  advance: (e) => (e.cur === null ? `prev = ${nmv(e.prev)}, cur = null: fell off the end. \`return prev\`: ${nmv(e.prev)} is the new head.` : `\`prev = cur; cur = next\`: prev on ${nmv(e.prev)}, cur on ${nmv(e.cur)}.`),
};
const rvFrame = (e) => ({ say: { start: 0, save: 0, flip: 1, advance: 2 }[e.line], note: RV_NOTE[e.line](e), panels: rvPanels(e) });
// detail for the first node, then one frame per node
const rvFrames = [RV_EV[0], RV_EV[1], RV_EV[2], RV_EV[3], ...RV_EV.filter((e, k) => k > 3 && e.line === 'advance')].map(rvFrame);
const RV_TURN = RV_EV[3]; // prev on 5, cur on 6

// ---------- fast & slow: middle of 10 → … → 50, cycle on 7 → 8 → 9 → 10 → 11 → (9) ----------
const MID = [10, 20, 30, 40, 50];
const MID_EV = [];
{
  const nx = chainNext(MID.length);
  let s = 0,
    f = 0;
  MID_EV.push({ s, f });
  while (f !== null && nx[f] !== null) {
    s = nx[s];
    f = nx[nx[f]];
    MID_EV.push({ s, f });
  }
}
const midPanel = ({ s, f }, done) =>
  list(MID, { pointers: [ptr(s, 'slow'), ...(f !== null ? [ptr(f, 'fast', 'b')] : [])], highlights: hl(MID.length, (k) => (k === s ? (done ? 'done' : 'active') : k === f ? 'visited' : '')) });
const midFrames = MID_EV.map((e, k) => ({
  say: k === 0 ? 0 : 1,
  note:
    k === 0
      ? 'slow and fast both start at the head, 10.'
      : `slow +1 → ${MID[e.s]}, fast +2 → ${MID[e.f]}.${k === MID_EV.length - 1 ? ` fast.next is null: stop. slow is the middle, ${MID[e.s]}.` : ''}`,
  panels: [midPanel(e, k === MID_EV.length - 1), vars({ steps: k })],
}));
const MID_RES = MID[MID_EV[MID_EV.length - 1].s];

const CY_NX = { 7: 8, 8: 9, 9: 10, 10: 11, 11: 9 };
const CY_POS = { 7: [0, 0], 8: [1.3, 0], 9: [2.6, 0], 10: [3.9, 0], 11: [3.25, 1.2] };
const cyGraph = (st) =>
  graph(
    Object.keys(CY_POS).map((k) => [+k, k, ...CY_POS[k], st[k] || '']),
    Object.entries(CY_NX).map(([a, b]) => [+a, b, +a === 11 ? 'active' : '']),
  );
const ON_CY = [9, 10, 11];
const cyGap = (s, f) => {
  if (!ON_CY.includes(s) || !ON_CY.includes(f)) return null;
  let g = 0;
  for (let c = f; c !== s; c = CY_NX[c]) g++;
  return g;
};
const CY_EV = [];
{
  let s = 7,
    f = 7;
  CY_EV.push({ s, f });
  do {
    s = CY_NX[s];
    f = CY_NX[CY_NX[f]];
    CY_EV.push({ s, f });
  } while (s !== f);
}
const CY_MEET = CY_EV[CY_EV.length - 1].s;
let CY_ENTRY;
{
  let p = 7,
    s = CY_MEET;
  while (p !== s) {
    p = CY_NX[p];
    s = CY_NX[s];
  }
  CY_ENTRY = p;
}
const cyFrames = CY_EV.map(({ s, f }, k) => {
  const g = cyGap(s, f);
  return {
    say: k === 0 ? 0 : s === f ? 2 : 1,
    note:
      k === 0
        ? 'e.g. 7 → 8 → 9 → 10 → 11, and 11 points back to 9. Both start at 7.'
        : s === f
          ? `slow → ${s}, fast → ${f}: \`slow === fast\`, the same node. There is a cycle.`
          : g === null
            ? `slow → ${s}, fast → ${f}. Slow is not on the loop yet.`
            : `slow → ${s}, fast → ${f}. Both on the loop: the gap from fast to slow is ${g}, and it shrinks by 1 per step.`,
    panels: [cyGraph(s === f ? { [s]: 'done' } : { [s]: 'active', [f]: 'visited' }), vars({ slow: s, fast: f })],
  };
});

// ---------- merge & split: merge 3 → 6 → 7 with 1 → 4 → 9; split 7 → 3 → 9 → 1 ----------
const MA = [3, 6, 7];
const MB = [1, 4, 9];
const MG_EV = [];
{
  let i = 0,
    j = 0;
  const out = [];
  MG_EV.push({ i, j, out: [], what: 'start' });
  while (i < MA.length && j < MB.length) {
    const fromA = MA[i] <= MB[j];
    out.push(fromA ? MA[i++] : MB[j++]);
    MG_EV.push({ i, j, out: out.slice(), what: 'take', fromA });
  }
  const rest = i < MA.length ? MA.slice(i) : MB.slice(j);
  const restName = i < MA.length ? 'a' : 'b';
  out.push(...rest);
  MG_EV.push({ i: MA.length, j: MB.length, out: out.slice(), what: 'attach', rest, restName });
}
const mgPanels = (e) => {
  const res = ['D', ...e.out];
  const ps = [
    list(res, {
      label: 'answer',
      pointers: [ptr(0, 'dummy', 'c'), ptr(res.length - 1, 'tail', 'b')],
      highlights: hl(res.length, (k) => (k === 0 ? 'muted' : e.what === 'attach' && k > res.length - 1 - e.rest.length ? 'active' : e.what === 'take' && k === res.length - 1 ? 'active' : 'done')),
    }),
  ];
  const v = {};
  if (e.i < MA.length) ps.push(list(MA.slice(e.i), { label: 'a', pointers: [ptr(0, 'a')] }));
  else v.a = 'null';
  if (e.j < MB.length) ps.push(list(MB.slice(e.j), { label: 'b', pointers: [ptr(0, 'b')] }));
  else v.b = 'null';
  if (Object.keys(v).length) ps.push(vars(v));
  return ps;
};
const mgFrames = MG_EV.map((e, k) => {
  const prevE = MG_EV[k - 1];
  const note =
    e.what === 'start'
      ? '`tail = dummy`. Compare the two heads.'
      : e.what === 'take'
        ? `${MA[prevE.i] ?? '–'} vs ${MB[prevE.j] ?? '–'}: attach ${e.out[e.out.length - 1]} from ${e.fromA ? 'a' : 'b'}, advance ${e.fromA ? 'a' : 'b'} and tail.`
        : `${e.restName === 'a' ? 'b' : 'a'} is empty. \`tail.next = a ?? b\`: ${e.rest.join(' → ')} is attached in one move.`;
  return { say: e.what === 'attach' ? 2 : e.what === 'take' ? 1 : 0, note, panels: mgPanels(e) };
});

// first middle (fast = head.next) vs second middle (fast = head) on a list of n nodes: index of slow
const middleAt = (n, fastStart) => {
  let s = 0,
    f = fastStart;
  while (f < n && f + 1 < n) {
    s += 1;
    f += 2;
  }
  return s;
};
const SP = [7, 3, 9, 1];
const SP_MID = middleAt(SP.length, 1);
const SP_LEFT = SP.slice(0, SP_MID + 1);
const SP_RIGHT = SP.slice(SP_MID + 1);
const TWO = [6, 1];
const TWO_SECOND = middleAt(TWO.length, 0); // 1: slow ends on the second node
const TWO_FIRST = middleAt(TWO.length, 1); // 0

// ---------- cache: LRU, capacity 2 ----------
function lruRun(cap, ops) {
  const order = []; // keys, most recent first
  const val = {};
  const ev = [];
  for (const [op, key, v] of ops) {
    let evicted = null,
      got;
    if (op === 'get') {
      if (order.includes(key)) {
        order.splice(order.indexOf(key), 1);
        order.unshift(key);
        got = val[key];
      } else got = -1;
    } else {
      if (order.includes(key)) order.splice(order.indexOf(key), 1);
      order.unshift(key);
      val[key] = v;
      if (order.length > cap) {
        evicted = order.pop();
        delete val[evicted];
      }
    }
    ev.push({ op, key, v, got, evicted, order: order.slice(), val: { ...val } });
  }
  return ev;
}
const LRU_OPS = [
  ['put', 7, 70],
  ['put', 8, 80],
  ['get', 7],
  ['put', 9, 90],
];
const LRU = lruRun(2, LRU_OPS);
const LRU_TURN = lruRun(2, [...LRU_OPS, ['get', 7], ['put', 10, 100]]);
const LRU_AFTER = LRU_TURN[LRU_TURN.length - 1];
const lruList = (e, hot, label = 'H = most recent side, T.prev = least recent') => {
  const vals = ['H', ...e.order.map((k) => `${k}:${e.val[k]}`), ...(e.evicted !== null ? [`${e.evicted}`] : []), 'T'];
  return list(vals, {
    doubly: true,
    label,
    highlights: hl(vals.length, (k) => (k === 0 || k === vals.length - 1 ? 'muted' : e.evicted !== null && k === vals.length - 2 ? 'bad' : k - 1 === e.order.indexOf(hot) ? 'active' : '')),
  });
};
const mapVars = (e) => vars({ map: e.order.length ? e.order.slice().sort((x, y) => x - y).map((k) => `${k} → node`).join(', ') : '—' });
const lruNote = (e) =>
  e.op === 'get'
    ? `get(${e.key}): the map hands over node ${e.key} → _remove it, _addFront it, return ${e.got}. A read is a use.`
    : e.evicted !== null
      ? `put(${e.key}, ${e.v}): add at the front. Size 3 > 2: evict T.prev (${e.evicted}) and \`map.delete(node.key)\`.`
      : `put(${e.key}, ${e.v}): new node at the front, \`map.set(${e.key}, node)\`.`;
const lruFrames = LRU.map((e) => ({ say: e.op === 'get' ? 1 : e.evicted !== null ? 2 : 0, note: lruNote(e), panels: [lruList(e, e.key), mapVars(e)] }));
const LRU_LAST = LRU[LRU.length - 1];

export default [
  {
    id: 'linked-list-dummy-node',
    title: 'Delete the head without a special case',
    steps: [
      {
        kind: 'watch',
        title: 'The head has no node before it',
        lines: ['To delete a node you rewrite its **predecessor**: `prev.next = cur.next`.', 'Every node has a predecessor **except the head**.'],
        frames: [
          { say: 0, note: 'e.g. remove every 7 from 7 → 2 → 7 → 5. The second 7 is easy: 2 is before it.', panels: [list([7, 2, 7, 5], { pointers: [ptr(0, 'head')], highlights: { 0: 'bad', 2: 'bad' } })] },
          { say: 1, note: 'The first 7 is the head. Nothing points to it, so it needs `if (head.val === val) head = head.next`.', panels: [list([7, 2, 7, 5], { pointers: [ptr(0, 'head')], highlights: { 0: 'bad' } }), vars({ 'special case': 'head.val === val' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'A fake node before the head',
        lines: ['`dummy = new ListNode(0, head)`: now every real node has a node before it.', 'If `prev.next.val === val`: `prev.next = prev.next.next`.', 'Else `prev = prev.next`.', 'Return `dummy.next`, the real (possibly new) head.'],
        frames: rmFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"return the head of the modified list"**, **"remove the nth node"**, **"merge two sorted lists"**, **"the head may change"**, **"sum as a linked list"**.'],
        frames: [{ say: 0, note: 'Building a new list uses the same dummy: `tail.next = node; tail = tail.next`, no "is it empty yet?" check.', panels: [list(['D', 'node'], { pointers: [ptr(0, 'dummy', 'c'), ptr(1, 'tail', 'b')], highlights: { 0: 'muted', 1: 'active' } })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: what to return',
        lines: [`The loop is done: D → ${rmHead} → 5. The variable \`head\` still refers to the first 7.`],
        panels: [list(['D', rmHead, 5], { pointers: [ptr(0, 'dummy', 'c')], highlights: { 0: 'muted' } }), vars({ head: '7 (removed)' })],
        task: {
          type: 'choose',
          question: 'What does the function return?',
          options: [
            { text: '`head`', why: '`head` still refers to the removed 7. Returning it is exactly the bug the dummy protects against.' },
            { text: '`dummy`', why: 'The dummy is fake (value 0); it must never appear in the answer.' },
            { text: '`dummy.next`' },
            { text: '`prev`', why: 'prev ended on the last kept node, 5: that is the tail, not the head.' },
          ],
          answer: 2,
        },
        solved: 'Return **`dummy.next`**: it is the real head, even when the original head was removed.',
      },
    ],
  },

  {
    id: 'linked-list-in-place-reversal',
    title: 'Reverse a list in place with three pointers',
    steps: [
      {
        kind: 'watch',
        title: 'Copying works, but costs memory',
        lines: ['A singly linked list can only be walked **forwards**.', 'Brute force: `listToArray`, reverse the array, `arrayToList`: O(n) extra space and n new nodes.'],
        frames: [
          { say: 0, note: 'e.g. reverse 5 → 6 → 7. From 7 there is no way back to 6.', panels: [list(RV, { pointers: [ptr(0, 'head')] })] },
          { say: 1, note: 'The array copy gives 7 → 6 → 5, but built from new nodes. Can we just flip the arrows?', panels: [arr([7, 6, 5], { label: 'vals.reverse()' }), list([7, 6, 5], { label: 'arrayToList: new nodes', highlights: hl(3, () => 'muted') })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Save, flip, advance',
        lines: ['`const next = cur.next`: save the rest of the list.', '`cur.next = prev`: flip the arrow.', '`prev = cur; cur = next`: advance both.'],
        frames: rvFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"reverse"**, **"from position left to right"**, **"in groups of k"**, **"palindrome" with O(1) space**, **"reorder L0 → Ln → L1 → Ln-1"**.'],
        frames: [{ say: 0, note: 'Each node is flipped once: O(n) time, three variables of extra space: O(1).', panels: [vars({ time: 'O(n)', 'extra space': 'O(1)', 'return': 'prev (head is now the tail)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the next node',
        lines: [`5 is reversed. prev is on ${nmv(RV_TURN.prev)}, cur is on ${nmv(RV_TURN.cur)}, and ${nmv(RV_TURN.cur)} → 7 is the only way to reach 7.`],
        panels: rvPanels(RV_TURN),
        task: {
          type: 'choose',
          question: 'Which line must run first in this step?',
          options: [
            { text: '`const next = cur.next`' },
            { text: '`cur.next = prev`', why: 'That overwrites the only reference to 7: the rest of the list is lost.' },
            { text: '`cur = cur.next`', why: 'cur moves on before 6 is flipped, so 6 would still point forwards.' },
            { text: '`prev = cur`', why: 'Then the flip would make 6 point to itself, and 7 is still not saved.' },
          ],
          answer: 0,
        },
        solved: '**Before you redraw an arrow, save what it pointed to**: save next, flip, then advance prev and cur.',
      },
    ],
  },

  {
    id: 'linked-list-fast-slow',
    title: 'Find the middle and catch a cycle in one pass',
    steps: [
      {
        kind: 'watch',
        title: 'No length, no index',
        lines: ['A list has no length and no index.', 'Naive: one pass to count, a second pass to walk to the middle.'],
        frames: [
          { say: 0, note: 'e.g. 10 → 20 → 30 → 40 → 50. Which node is the middle?', panels: [list(MID, { pointers: [ptr(0, 'head')] })] },
          { say: 1, note: `Count ${MID.length} nodes, then walk again ${MID_EV[MID_EV.length - 1].s} steps. Two runners do it in one pass.`, panels: [list(MID, { highlights: hl(MID.length, () => 'visited') }), vars({ length: MID.length })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Slow 1 step, fast 2 steps',
        lines: ['`slow = head, fast = head`.', '`while (fast && fast.next)`: slow 1 step, fast 2 steps.'],
        frames: midFrames,
      },
      {
        kind: 'watch',
        title: 'On a loop, fast laps slow',
        lines: ['Same speeds. On a straight list fast reaches the end.', 'On a cycle fast laps slow: the gap shrinks by exactly 1 per step.', 'Compare **nodes** (`slow === fast`), after moving.'],
        frames: cyFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"middle of the list"**, **"has a cycle"**, **"where the cycle begins"**, **"O(1) extra space"**, **"repeat the process until it loops endlessly"**, **"n + 1 numbers in range [1, n]"**.'],
        frames: [{ say: 0, note: 'A Set of visited nodes also finds a cycle, but costs O(n) space. Floyd uses two pointers: O(1).', panels: [vars({ 'Set of nodes': 'O(n) space', 'fast & slow': 'O(1) space' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: where does the loop start?',
        lines: [`slow and fast met on ${CY_MEET}. Now find the node where the cycle begins.`],
        panels: [cyGraph({ [CY_MEET]: 'done' }), vars({ slow: CY_MEET, fast: CY_MEET })],
        task: {
          type: 'choose',
          question: 'What comes next?',
          options: [
            { text: 'Reset one pointer to the head; move both one step at a time until they meet' },
            { text: `${CY_MEET} is the entry: they always meet there`, why: `They meet somewhere on the loop, not necessarily at the entry. Here the entry is ${CY_ENTRY}.` },
            { text: 'Reset one to the head; keep fast moving two steps', why: 'The proof gives equal distances (a = k·c − b), so both must walk at the same speed.' },
            { text: 'Put every node in a Set and find the first repeat', why: 'That works, but it costs O(n) space; the pointers already know enough.' },
          ],
          answer: 0,
        },
        solved: `From head 7 and from ${CY_MEET}, one step each: they meet on ${CY_ENTRY}, the cycle entry.`,
      },
    ],
  },

  {
    id: 'linked-list-merge-split',
    title: 'Merge sorted lists by relinking, then sort with merge sort',
    steps: [
      {
        kind: 'watch',
        title: 'Two sorted lists into one',
        lines: ['Lists cannot be indexed, so array tricks are awkward.', 'But merging two sorted lists only **relinks** nodes: O(1) extra space.'],
        frames: [{ say: 1, note: `e.g. a = ${MA.join(' → ')}, b = ${MB.join(' → ')}, both sorted. Goal: one sorted list from the same nodes.`, panels: [list(MA, { label: 'a', pointers: [ptr(0, 'a')] }), list(MB, { label: 'b', pointers: [ptr(0, 'b')] })] }],
      },
      {
        kind: 'watch',
        title: 'Attach the smaller head to tail',
        lines: ['A dummy and `tail = dummy`.', '`while (a && b)`: attach the smaller head (`<=` takes a first), advance it and tail.', 'When one runs out: `tail.next = a ?? b`.'],
        frames: mgFrames,
      },
      {
        kind: 'watch',
        title: 'Sort a list: split, sort, merge',
        lines: ['Find the **first** middle: `slow = head, fast = head.next`.', 'Cut: `right = mid.next; mid.next = null`. Sort both halves, merge.', 'Clues: **"merge sorted lists"**, **"sort the list in O(n log n)"**, **"reorder"**, **"odd/even positions"**, **"partition around x"**.'],
        frames: [
          { say: 0, note: `e.g. sort ${SP.join(' → ')}: the loop stops with slow on ${SP[SP_MID]}, the first middle.`, panels: [list(SP, { pointers: [ptr(SP_MID, 'mid')], highlights: { [SP_MID]: 'active' } })] },
          { say: 1, note: `\`mid.next = null\`: ${SP_LEFT.join(' → ')} and ${SP_RIGHT.join(' → ')}. log n levels, O(n) merging per level: O(n log n).`, panels: [list(SP_LEFT, { label: 'left' }), list(SP_RIGHT, { label: 'right' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a 2-node list',
        lines: [`Merge sort reaches ${TWO.join(' → ')}. It splits right after slow.`],
        panels: [list(TWO, { pointers: [ptr(0, 'head')] })],
        task: {
          type: 'choose',
          question: `Which start gives the split ${TWO[0]} | ${TWO[1]}?`,
          options: [
            { text: '`slow = head, fast = head.next` (first middle)' },
            { text: '`slow = head, fast = head` (second middle)', why: `The loop runs once: slow ends on ${TWO[TWO_SECOND]}. Left is the whole list again, so the recursion never ends.` },
            { text: 'Either: both loops stop with slow on 6', why: 'With fast = head, fast.next exists, so slow moves one step to 1.' },
            { text: 'Neither: a 2-node list cannot be split', why: `The first middle stops on ${TWO[TWO_FIRST]} and splits it into 1 + 1.` },
          ],
          answer: 0,
        },
        solved: 'Split at the **first** middle (`fast = head.next`) and cut `mid.next = null`, so every half gets smaller.',
      },
    ],
  },

  {
    id: 'linked-list-cache-design',
    title: 'LRU cache: the Map finds it, the list orders it',
    steps: [
      {
        kind: 'watch',
        title: 'Find fast and know what to evict',
        lines: ['A cache must find an item fast **and** know which one to evict.', 'Keeping keys in an array by recency: re-ordering is O(n).'],
        frames: [
          { say: 1, note: 'e.g. keys by recency [8, 7, 6, 5]. Using 5 moves it to the front: every other key shifts.', panels: [arr([8, 7, 6, 5], { label: 'most recent first', highlights: { 3: 'active', 0: 'window', 1: 'window', 2: 'window' } })] },
          { say: 0, note: 'A doubly linked list re-orders in O(1) if you hold the node, and the Map hands you the node.', panels: [vars({ 'Map key → node': 'find: O(1) average', 'doubly linked list': 'move / remove: O(1)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Capacity 2: put, put, get, put',
        lines: ['`put`: new node at the front (after H), `map.set(key, node)`.', '`get`: the map finds the node; move it to the front.', 'Over capacity: evict `tail.prev`, and delete its **key** from the map.'],
        frames: lruFrames,
      },
      {
        kind: 'watch',
        title: 'Hear it in the problem',
        lines: ['Clues: **"design a cache"**, **"least recently used"**, **"least frequently used"**, **"get and put must run in O(1)"**, **"evict when capacity is exceeded"**.'],
        frames: [{ say: 0, note: 'JS shortcut: a Map keeps insertion order. delete + set marks a key used; `map.keys().next().value` is the oldest.', panels: [vars({ 'mark used': 'map.delete(k); map.set(k, v)', 'least recent': 'map.keys().next().value' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: get, then put',
        lines: [`The cache is H ⇄ ${LRU_LAST.order.join(' ⇄ ')} ⇄ T, capacity 2.`, 'Now `get(7)`, then `put(10, 100)`.'],
        panels: [lruList({ ...LRU_LAST, evicted: null }, null), mapVars(LRU_LAST)],
        task: {
          type: 'choose',
          question: 'Which key does put(10, 100) evict?',
          options: [
            { text: '7: it is at T.prev right now', why: 'get(7) is a use: it moves 7 to the front first. Skipping that move is a classic bug.' },
            { text: `${LRU_AFTER.evicted}` },
            { text: '10: the newest key', why: 'New keys go to the front; eviction takes T.prev, the least recent.' },
            { text: 'None: the cache grows', why: 'Size 3 > capacity 2, so one key must go.' },
          ],
          answer: 1,
        },
        solved: `get(7) makes 7 the most recent, so ${LRU_AFTER.evicted} is T.prev: remove the node and \`map.delete(node.key)\`.`,
      },
    ],
  },
];
