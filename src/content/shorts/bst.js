// Shorts for Binary Search Tree (M9). Format: src/content/shortSchema.js. Facts come only from topics/bst/topic.js.
// Every path, stack, bound, in-order output and subtree summary below is produced by running the pattern's template
// on the small "e.g." tree next to it.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '-∞' : String(x));

// ---------- trees ----------
let uid = 0;
const mk = (val, left = null, right = null) => ({ id: `t${uid++}`, val, left, right });
// insertIntoBST from the lesson
const insert = (root, v) => {
  if (!root) return mk(v);
  if (v < root.val) root.left = insert(root.left, v);
  else root.right = insert(root.right, v);
  return root;
};
const fromInserts = (vals) => vals.reduce((r, v) => insert(r, v), null);
const clone = (n) => n && { ...n, left: clone(n.left), right: clone(n.right) };
const inorder = (n, out = []) => {
  if (n) {
    inorder(n.left, out);
    out.push(n);
    inorder(n.right, out);
  }
  return out;
};
const valsOf = (n) => inorder(n).map((x) => x.val);
const subtree = (n) => (n ? [n.val, ...subtree(n.left), ...subtree(n.right)] : []);
const find = (root, v) => {
  let n = root;
  while (n && n.val !== v) n = v < n.val ? n.left : n.right;
  return n;
};

/** A nodes panel; x = in-order position, y = depth. st: { [val]: state } or (node) => state. path: vals whose edges glow. */
function treeP(root, st = {}, { label, path = [] } = {}) {
  const pos = Object.fromEntries(inorder(root).map((n, i) => [n.id, i]));
  const nodes = [];
  const edges = [];
  const stateOf = (n) => (typeof st === 'function' ? st(n) : st[n.val]) || '';
  const walk = (n, d, parent) => {
    if (!n) return;
    const s = stateOf(n);
    nodes.push({ id: n.id, label: String(n.val), x: pos[n.id], y: d, ...(s ? { state: s } : {}) });
    if (parent) {
      const es = path.includes(parent.val) && path.includes(n.val) ? 'active' : s === 'muted' || s === 'hidden' ? 'muted' : '';
      edges.push({ from: parent.id, to: n.id, ...(es ? { state: es } : {}) });
    }
    walk(n.left, d + 1, n);
    walk(n.right, d + 1, n);
  };
  walk(root, 0, null);
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const statesOf = (pairs) => Object.fromEntries(pairs.flatMap(([vals, s]) => vals.map((v) => [v, s])));

// ======================================================================================================
// 1. Guided descent: e.g. inserts 40, 20, 60, 10, 30, 50, 70, 45
// ======================================================================================================
const T1 = fromInserts([40, 20, 60, 10, 30, 50, 70, 45]);
const N1 = valsOf(T1).length; // 8
// the brute force from the lesson: contains() that searches BOTH sides, in the order it looks at nodes
function bothSides(root, t) {
  const seen = [];
  const go = (n) => {
    if (!n) return false;
    seen.push(n.val);
    if (n.val === t) return true;
    return go(n.left) || go(n.right);
  };
  go(root);
  return seen;
}
const BF45 = bothSides(T1, 45); // 40 20 10 30 60 50 45
// the template: one step per node looked at, with the side it throws away
function descent(root, t) {
  const out = [];
  let n = root;
  while (n) {
    if (t === n.val) {
      out.push({ v: n.val, found: true });
      break;
    }
    const goLeft = t < n.val;
    out.push({ v: n.val, goLeft, dropped: subtree(goLeft ? n.right : n.left) });
    n = goLeft ? n.left : n.right;
  }
  return out;
}
const D45 = descent(T1, 45);
const descentPanel = (k) => {
  const steps = D45.slice(0, k + 1);
  const muted = steps.flatMap((s) => s.dropped || []);
  return treeP(
    T1,
    statesOf([
      [muted, 'muted'],
      [steps.slice(0, -1).map((s) => s.v), 'visited'],
      [[steps[k].v], steps[k].found ? 'done' : 'active'],
    ]),
    { label: 'search 45', path: steps.map((s) => s.v) },
  );
};
const descentNote = (s) =>
  s.found
    ? `45 === 45 → return it. ${D45.length} nodes looked at instead of ${BF45.length}.`
    : `45 ${s.goLeft ? '<' : '>'} ${s.v} → go ${s.goLeft ? 'left' : 'right'}. Skipped without a look: ${s.dropped.join(', ') || 'nothing'}.`;
// insert 55: descend, fall off, attach a leaf
const INS = 55;
const T1i = insert(clone(T1), INS);
const INS_PATH = descent(T1, INS).map((s) => s.v); // 40 60 50
const INS_PARENT = INS_PATH.at(-1);
// LCA from the lesson: both smaller → left, both larger → right, otherwise split here
function lca(root, p, q) {
  const path = [];
  let n = root;
  while (n) {
    path.push(n.val);
    if (p < n.val && q < n.val) n = n.left;
    else if (p > n.val && q > n.val) n = n.right;
    else return { at: n.val, path };
  }
  return { at: null, path };
}
const L1 = lca(T1, 45, 70); // 40 → 60: split at 60
const LT = lca(T1, 30, 45); // split at the root 40

// ======================================================================================================
// 2. In-order = sorted: e.g. inserts 20, 8, 30, 4, 13, 25, 40, 11
// ======================================================================================================
const T2 = fromInserts([20, 8, 30, 4, 13, 25, 40, 11]);
const S2 = valsOf(T2); // 4 8 11 13 20 25 30 40
const K = 3;
// the stack template, one record per pop
function stackInorder(root, pops) {
  const out = [];
  const stack = [];
  const visited = [];
  let node = root;
  while ((node || stack.length) && out.length < pops) {
    const pushed = [];
    while (node) {
      stack.push(node);
      pushed.push(node.val);
      node = node.left;
    }
    node = stack.pop();
    visited.push(node.val);
    const right = node.right ? node.right.val : null;
    out.push({ pushed, popped: node.val, stack: stack.map((n) => n.val), visited: visited.slice(), right });
    node = node.right;
  }
  return out;
}
const IN6 = stackInorder(T2, 6);
const KTH = IN6.slice(0, K);
const KANS = KTH.at(-1).popped; // 11
const pushedBy = (k) => new Set(IN6.slice(0, k + 1).flatMap((r) => r.pushed));
const inPanels = (k) => {
  const r = IN6[k];
  const onStack = new Set(r.stack);
  const touched = pushedBy(k);
  return [
    treeP(T2, (n) => (n.val === r.popped ? 'active' : r.visited.includes(n.val) ? 'done' : onStack.has(n.val) ? 'visited' : touched.has(n.val) ? '' : 'muted'), { label: 'in-order with a stack' }),
    stk(r.stack),
    arr(r.visited, { label: 'popped, in order', highlights: { [r.visited.length - 1]: 'active' } }),
  ];
};
const inNote = (r, k) => {
  const push = r.pushed.length ? `Push ${r.pushed.join(', ')} (left spine). ` : '';
  const count = `Pop ${r.popped}: count ${k + 1}`;
  if (k + 1 === K) return `${push}${count} = k → return ${r.popped}.`;
  return `${push}${count}. Then node = ${r.popped}.right = ${r.right ?? 'null'}.`;
};
const DIFFS = S2.slice(1).map((v, i) => v - S2[i]);
const MIN_D = Math.min(...DIFFS);
const MIN_AT = DIFFS.indexOf(MIN_D);
const TURN2 = IN6[4]; // 5th pop = 20, node = 30
const NEXT2 = IN6[5]; // pushes 30, 25 → pops 25

// ======================================================================================================
// 3. Range bounds: e.g. a tree whose parent/child pairs all look fine
// ======================================================================================================
const T3bad = mk(10, mk(5, mk(2), mk(7)), mk(15, mk(6), mk(20)));
// valid() from the template, one record per non-null node it checks
function validRun(root) {
  const out = [];
  const go = (n, low, high) => {
    if (!n) return true;
    const ok = !(n.val <= low || n.val >= high);
    out.push({ v: n.val, low, high, ok });
    if (!ok) return false;
    return go(n.left, low, n.val) && go(n.right, n.val, high);
  };
  return { ok: go(root, -Infinity, Infinity), out };
}
const V3 = validRun(T3bad);
const BADV = V3.out.at(-1); // 6 in (10, 15) fails
const IN3 = valsOf(T3bad); // 2 5 7 10 6 15 20
const DROP = IN3.findIndex((v, i) => i > 0 && v < IN3[i - 1]);
const validPanels = (k) => {
  const r = V3.out[k];
  const checked = V3.out.slice(0, k).map((x) => x.v);
  return [
    treeP(T3bad, statesOf([[checked, 'done'], [[r.v], r.ok ? 'active' : 'bad']]), { label: 'valid(node, low, high)' }),
    vars({ node: r.v, low: fmt(r.low), high: fmt(r.high) }),
  ];
};
const validNote = (r) =>
  r.ok
    ? `${r.v} in (${fmt(r.low)}, ${fmt(r.high)})? yes. Left gets (${fmt(r.low)}, ${r.v}), right gets (${r.v}, ${fmt(r.high)}).`
    : `${r.v} in (${fmt(r.low)}, ${fmt(r.high)})? ${r.v} <= ${fmt(r.low)} → return false. The ${fmt(r.low)} bound came from the grandparent.`;
// range sum with pruning, on the fixed tree
const T3 = mk(10, mk(5, mk(2), mk(7)), mk(15, mk(12), mk(20)));
function rangeSum(root, L, R) {
  const seen = [];
  const go = (n) => {
    if (!n) return 0;
    seen.push(n.val);
    if (n.val < L) return go(n.right);
    if (n.val > R) return go(n.left);
    return n.val + go(n.left) + go(n.right);
  };
  const sum = go(root);
  const all = subtree(root);
  return { sum, seen, skipped: all.filter((v) => !seen.includes(v)), inRange: all.filter((v) => v >= L && v <= R).sort((a, b) => a - b) };
}
const RS = rangeSum(T3, 6, 13);
const rsPanel = treeP(T3, (n) => (RS.skipped.includes(n.val) ? 'muted' : RS.inRange.includes(n.val) ? 'done' : 'visited'), { label: 'range sum [6, 13]' });

// ======================================================================================================
// 4. Build balanced: e.g. nums = [3, 8, 12, 17, 21, 26, 30]
// ======================================================================================================
const NUMS = [3, 8, 12, 17, 21, 26, 30];
const CHAIN = fromInserts(NUMS);
const chainHeight = NUMS.length - 1;
// build() from the template, recording each call's range, mid and depth
function buildRun(nums) {
  const calls = [];
  const go = (lo, hi, d) => {
    if (lo > hi) return null;
    const mid = (lo + hi) >> 1;
    calls.push({ lo, hi, mid, d, v: nums[mid] });
    return mk(nums[mid], go(lo, mid - 1, d + 1), go(mid + 1, hi, d + 1));
  };
  return { root: go(0, nums.length - 1, 0), calls };
}
const B = buildRun(NUMS);
const LEVELS = Math.max(...B.calls.map((c) => c.d)) + 1; // 3
const atDepth = (d) => B.calls.filter((c) => c.d === d);
const depthOf = Object.fromEntries(B.calls.map((c) => [c.v, c.d]));
const buildPanels = (d) => [
  arr(NUMS, { label: 'nums', highlights: hl(NUMS.length, (i) => (depthOf[NUMS[i]] === d ? 'active' : depthOf[NUMS[i]] < d ? 'done' : '')) }),
  treeP(B.root, (n) => (depthOf[n.val] > d ? 'hidden' : depthOf[n.val] === d ? 'active' : 'done'), { label: `levels 0..${d}` }),
];
const callStr = (c) => (c.lo === c.hi ? `build(${c.lo}, ${c.hi}) → ${c.v}` : `build(${c.lo}, ${c.hi}): mid = ${c.mid} → ${c.v}`);
const NUMS2 = [2, 5, 9, 14, 18, 23];
const LM = (0 + NUMS2.length - 1) >> 1; // left-middle 2 → 9
const RM = (0 + NUMS2.length - 1 + 1) >> 1; // right-middle 3 → 14

// ======================================================================================================
// 5. Bottom-up info: e.g. a plain binary tree
// ======================================================================================================
const T5 = mk(30, mk(4, mk(9), mk(6)), mk(20, mk(15), mk(25)));
// dfs() from the template (sum version); records every node's summary in post-order and the running best
function bottomUp(root) {
  const out = [];
  let best = 0;
  const dfs = (n) => {
    if (!n) return [true, Infinity, -Infinity, 0];
    const [lb, lmin, lmax, lsum] = dfs(n.left);
    const [rb, rmin, rmax, rsum] = dfs(n.right);
    let res;
    if (lb && rb && lmax < n.val && n.val < rmin) {
      const sum = lsum + n.val + rsum;
      best = Math.max(best, sum);
      res = [true, Math.min(lmin, n.val), Math.max(rmax, n.val), sum];
    } else res = [false, -Infinity, Infinity, 0];
    out.push({ v: n.val, res, lmax, rmin, lb, rb, best });
    return res;
  };
  dfs(root);
  return { out, best };
}
const BU = bottomUp(T5);
const BU_ORDER = BU.out.map((r) => r.v); // 9 6 4 15 25 20 30
const sumOf = (v) => BU.out.find((r) => r.v === v);
// frames group the two leaves of a parent: [[9, 6], [4], [15, 25], [20], [30]]
const GROUPS = [[9, 6], [4], [15, 25], [20], [30]];
const buPanels = (g) => {
  const shown = GROUPS.slice(0, g + 1).flat();
  const now = GROUPS[g];
  const rows = BU.out.map((r) => r.v);
  const cells = BU.out.map((r) => (shown.includes(r.v) ? [r.res[0] ? 'T' : 'F', fmt(r.res[1]), fmt(r.res[2]), String(r.res[3])] : ['?', '?', '?', '?']));
  const states = BU.out.map((r) => Array(4).fill(now.includes(r.v) ? (r.res[0] ? 'active' : 'bad') : shown.includes(r.v) ? (r.res[0] ? 'done' : 'muted') : ''));
  return [
    treeP(T5, (n) => (now.includes(n.val) ? (sumOf(n.val).res[0] ? 'active' : 'bad') : shown.includes(n.val) ? (sumOf(n.val).res[0] ? 'done' : 'muted') : ''), { label: 'plain binary tree' }),
    table(rows, ['isBST', 'min', 'max', 'sum'], cells, states, 'what each subtree reports'),
    vars({ best: sumOf(now.at(-1)).best }),
  ];
};
const depth5 = (n, d = 0) => (n ? [[n.val, d], ...depth5(n.left, d + 1), ...depth5(n.right, d + 1)] : []);
const REWALK = depth5(T5); // node at depth d is re-walked d + 1 times
const REWALK_TOTAL = REWALK.reduce((s, [, d]) => s + d + 1, 0); // 17

export default [
  {
    id: 'bst-guided-descent',
    title: 'Find, insert or split with one root-to-leaf walk',
    steps: [
      {
        kind: 'watch',
        title: 'Looking at both sides wastes the order',
        lines: ['Does the tree contain 45?', 'Treated as a plain binary tree, the search tries **both** subtrees: O(n).', 'But every value left of 40 is **smaller** than 40.'],
        frames: [
          { say: 1, note: `e.g. search 45 trying both sides: it looks at ${BF45.join(', ')}. ${BF45.length} of ${N1} nodes.`, panels: [treeP(T1, statesOf([[BF45.slice(0, -1), 'visited'], [[45], 'done']]), { label: 'search 45, both sides' })] },
          { say: 2, note: `45 > 40: the left side (${subtree(T1.left).join(', ')}) is all < 40, so none can be 45. Skip it unread.`, panels: [treeP(T1, statesOf([[subtree(T1.left), 'muted'], [[40], 'active']]))] },
        ],
      },
      {
        kind: 'watch',
        title: 'Compare, then go to ONE side',
        lines: ['`while (node)`: compare `target` with `node.val`.', 'Equal → return the node.', '`target < node.val` → `node.left`, else `node.right`: the other side is discarded.'],
        frames: [
          ...D45.map((s, k) => ({ say: s.found ? 1 : 2, note: descentNote(s), panels: [descentPanel(k)] })),
          { say: 2, note: 'One node per level: O(h). That is O(log n) if balanced, O(n) if the tree is a chain.', panels: [descentPanel(D45.length - 1), vars({ cost: 'O(h)', balanced: 'O(log n)', chain: 'O(n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The same walk does other jobs',
        lines: ['Insert: descend until you fall off the tree; the new node becomes a **leaf** there.', 'LCA: both smaller → left, both larger → right, otherwise **this node** is the split.', 'Clues: **"binary search tree"**, **"insert into BST"**, **"closest value"**, **"lowest common ancestor of a BST"**.'],
        frames: [
          { say: 0, note: `Insert ${INS}: ${INS_PATH.join(' → ')}, then ${INS_PARENT}.right is null → attach ${INS} there. No node moves.`, panels: [treeP(T1i, statesOf([[INS_PATH, 'visited'], [[INS], 'done']]), { label: `insert ${INS}`, path: [...INS_PATH, INS] })] },
          { say: 1, note: `LCA(45, 70): both > 40 → right. At 60: 45 < 60 < 70, they split → LCA = ${L1.at}.`, panels: [treeP(T1, statesOf([[[45, 70], 'visited'], [L1.path.slice(0, -1), 'visited'], [[L1.at], 'done']]), { label: 'LCA(45, 70)', path: L1.path })] },
          { say: 2, note: 'Find, insert, delete, LCA, floor / ceiling: the answer lies on one path → descend.', panels: [vars({ pattern: 'guided descent', time: 'O(h)', 'other subtree': 'never visited' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: where do they split?',
        lines: ['Same tree. Find the lowest common ancestor of **30** and **45**.', 'Start at the root, 40.'],
        panels: [treeP(T1, statesOf([[[30, 45], 'visited'], [[40], 'active']]), { label: 'LCA(30, 45)' })],
        task: {
          type: 'choose',
          question: 'Which node is LCA(30, 45)?',
          options: [
            { text: '20: 30 is under it', why: '45 > 40, so 45 is in the right subtree of 40 and cannot be under 20.' },
            { text: '60: 45 is under it', why: '30 < 40, so 30 is on the left of 40; 60 is not its ancestor.' },
            { text: `${LT.at}: 30 < 40 < 45, they split right here` },
            { text: 'Unknown until both subtrees are searched', why: 'That is the plain binary-tree LCA. In a BST the ordering tells you each side with one comparison.' },
          ],
          answer: 2,
        },
        solved: 'LCA in a BST: keep going while both are on the same side; the first node where they split is the answer. O(h).',
      },
    ],
  },

  {
    id: 'bst-inorder-sorted',
    title: 'Read a BST in sorted order and stop at the k-th',
    steps: [
      {
        kind: 'watch',
        title: 'k-th smallest the slow way',
        lines: [`e.g. k = ${K}: the ${K}rd smallest value.`, 'Dump the whole in-order into an array, return `arr[k − 1]`: all n nodes, O(n) space.', 'In-order = left, node, right. On a BST that order is **sorted**.'],
        frames: [
          { say: 1, note: `Dump all ${S2.length}: arr[${K - 1}] = ${S2[K - 1]}. Correct, but ${S2.length - K} values were collected for nothing.`, panels: [treeP(T2, () => 'visited'), arr(S2, { label: 'in-order array', highlights: hl(S2.length, (i) => (i === K - 1 ? 'done' : i > K - 1 ? 'muted' : '')) })] },
          { say: 2, note: `Left of 20: ${valsOf(T2.left).join(', ')}, all smaller. Right: ${valsOf(T2.right).join(', ')}, all larger. Same in every subtree.`, panels: [treeP(T2, statesOf([[subtree(T2.left), 'window'], [[20], 'active']])), arr(S2, { label: 'in-order', highlights: hl(S2.length, (i) => (S2[i] < 20 ? 'window' : S2[i] === 20 ? 'active' : '')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Stack in-order: pop k times, then stop',
        lines: ['Push the left spine: `while (node) { push; node = node.left }`.', 'Pop = the smallest unvisited value. Count it.', 'Then `node = node.right` and repeat. Stop at the k-th pop.'],
        frames: [
          ...KTH.map((r, k) => ({ say: k + 1 === K ? 1 : r.pushed.length ? 0 : 2, note: inNote(r, k), panels: inPanels(k) })),
          { say: 1, note: `Stopped after ${K} pops; ${valsOf(T2.right).join(', ')} were never pushed. O(h + k) instead of O(n).`, panels: [inPanels(K - 1)[0], vars({ k: K, answer: KANS, time: 'O(h + k)', memory: 'O(h)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Neighbours are enough',
        lines: ['Keep `prev`: compare each popped node with the one before it.', 'In sorted order the closest pair is always **adjacent**.', 'Clues: **"kth smallest"**, **"minimum absolute difference"**, **"iterator"**, **"in sorted order"**.'],
        frames: [
          { say: 1, note: `Neighbour gaps: ${DIFFS.join(', ')}. Min = ${MIN_D} (${S2[MIN_AT]} and ${S2[MIN_AT + 1]}), found with one prev variable.`, panels: [arr(S2, { label: 'in-order', highlights: { [MIN_AT]: 'done', [MIN_AT + 1]: 'done' } }), arr(DIFFS, { label: 'cur − prev', highlights: { [MIN_AT]: 'done' } })] },
          { say: 2, note: 'Sorted-order question on a BST → in-order walk. Iterator: keep the stack between next() calls.', panels: [vars({ 'k-th smallest': 'stop early', 'min difference': 'prev only', iterator: 'O(h) stack' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the 6th pop',
        lines: [`Now k = 6. The 5th pop was ${TURN2.popped}; the stack is empty.`, `node = ${TURN2.popped}.right = ${TURN2.right}.`],
        panels: [treeP(T2, (n) => (TURN2.visited.includes(n.val) ? 'done' : n.val === TURN2.right ? 'active' : '')), stk(TURN2.stack), arr(TURN2.visited, { label: 'popped, in order' })],
        task: {
          type: 'choose',
          question: 'Which value is popped 6th?',
          options: [
            { text: `${TURN2.right}: node is ${TURN2.right}, pop it`, why: `The loop first pushes the left spine of ${TURN2.right}: ${NEXT2.pushed.join(', ')}. ${NEXT2.popped} ends up on top.` },
            { text: `${NEXT2.popped}` },
            { text: '40', why: '40 is the largest value in that subtree, so it comes out last, not first.' },
            { text: 'Nothing: the stack is empty, so the walk ends', why: `The loop runs while \`node || stack.length\`; node = ${TURN2.right} is not null.` },
          ],
          answer: 1,
        },
        solved: 'After a pop, move to the right child and push its whole left spine: the next pop is the smallest value there.',
      },
    ],
  },

  {
    id: 'bst-range-bounds',
    title: 'Give every node the interval it must live in',
    steps: [
      {
        kind: 'watch',
        title: 'Parent/child checks miss it',
        lines: ['Is this a valid BST?', 'Check each node only against its children: every pair looks fine.', 'But 6 is in the **right subtree of 10**, so it must be > 10.'],
        frames: [
          { say: 1, note: '2 < 5 < 7, 5 < 10 < 15, 6 < 15 < 20: every parent/child pair passes. The check says "valid".', panels: [treeP(T3bad, () => 'visited', { label: 'e.g. tree' })] },
          { say: 2, note: `In-order reads ${IN3.join(' ')}: ${IN3[DROP - 1]} → ${IN3[DROP]} goes down. Not a BST.`, panels: [treeP(T3bad, statesOf([[[6], 'bad']]), { path: [10, 15, 6] }), arr(IN3, { label: 'in-order', highlights: { [DROP - 1]: 'bad', [DROP]: 'bad' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Carry (low, high) down',
        lines: ['The root gets `(-∞, +∞)`.', 'Left child: `(low, node.val)`. Right child: `(node.val, high)`.', '`node.val <= low || node.val >= high` → return false.'],
        frames: V3.out.map((r, k) => ({ say: k === 0 ? 0 : r.ok ? 1 : 2, note: validNote(r), panels: validPanels(k) })),
      },
      {
        kind: 'watch',
        title: 'The same bounds skip whole subtrees',
        lines: ['Range sum in [L, R]: `node.val < L` → the node and its left side are too small, go right only.', '`node.val > R` → go left only.', 'Clues: **"is a valid BST"**, **"values between low and high"**, **"range sum"**, **"trim"**.'],
        frames: [
          { say: 0, note: `e.g. 6 replaced by 12, [6, 13]: 5 < 6 skips ${RS.skipped[0]}; 15 > 13 skips ${RS.skipped[1]}. Sum = ${RS.inRange.join(' + ')} = ${RS.sum}.`, panels: [rsPanel, vars({ L: 6, R: 13, sum: RS.sum, skipped: RS.skipped.join(', ') })] },
          { say: 2, note: 'Validate: one O(1) check per node, O(n). Start with ±Infinity, never 0 or Number.MIN_VALUE.', panels: [vars({ root: '(-∞, +∞)', 'go left': 'high = node.val', 'go right': 'low = node.val' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: prune at the root',
        lines: ['Same fixed tree. Range sum over **[11, 25]**.', 'The walk is at the root, 10.'],
        panels: [treeP(T3, statesOf([[[10], 'active']])), vars({ L: 11, R: 25, node: 10 })],
        task: {
          type: 'choose',
          question: 'What does the range sum do at node 10?',
          options: [
            { text: 'Recurse into both children', why: '10 < 11, and everything left of 10 is smaller still: that side cannot add anything.' },
            { text: 'Only the right child: 10 and its left side are below 11' },
            { text: 'Only the left child', why: 'The left side holds values < 10, all below L = 11. The values in range are on the right.' },
            { text: 'Return 0: 10 is out of range', why: 'The right subtree holds values > 10, and 12, 15 and 20 are in [11, 25].' },
          ],
          answer: 1,
        },
        solved: 'A node below L rules out its whole left subtree; a node above R rules out its whole right subtree.',
      },
    ],
  },

  {
    id: 'bst-build-balanced',
    title: 'Sorted array in, shallowest BST out',
    steps: [
      {
        kind: 'watch',
        title: 'Sorted inserts make a chain',
        lines: [`e.g. insert ${NUMS.join(', ')} one by one into a plain BST.`, 'Each value is larger than all before it, so it always goes right.', 'A BST is only fast if it is **shallow**.'],
        frames: [
          { say: 1, note: `${NUMS.length} values → ${NUMS.length} levels (height ${chainHeight} = n − 1). Searching 30 looks at every node.`, panels: [treeP(CHAIN, () => 'visited', { label: 'inserted in sorted order' })] },
          { say: 2, note: `Take the middle, ${NUMS[B.calls[0].mid]}, as the root: ${B.calls[0].mid} values go left, ${NUMS.length - 1 - B.calls[0].mid} go right.`, panels: [arr(NUMS, { label: 'nums', pointers: [ptr(B.calls[0].mid, 'mid', 'b')], highlights: hl(NUMS.length, (i) => (i < B.calls[0].mid ? 'window' : i === B.calls[0].mid ? 'active' : '')) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'The middle of each range becomes the root',
        lines: ['`if (lo > hi) return null`.', '`mid = (lo + hi) >> 1`; `nums[mid]` is the node.', 'Left child = `build(lo, mid − 1)`, right child = `build(mid + 1, hi)`.'],
        frames: [
          ...Array.from({ length: LEVELS }, (_, d) => ({
            say: d === LEVELS - 1 ? 0 : 2,
            note: d === LEVELS - 1 ? `${atDepth(d).map((c) => c.v).join(', ')}: ranges of one become leaves; their children get lo > hi → null.` : `${atDepth(d).map(callStr).join('; ')}.`,
            panels: buildPanels(d),
          })),
          { say: 1, note: `${LEVELS} levels = ⌈log₂(${NUMS.length} + 1)⌉, the fewest possible. Each node made once: O(n).`, panels: [treeP(B.root, () => 'done'), vars({ levels: LEVELS, time: 'O(n)', 'recursion depth': 'O(log n)' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Pass indices, and rebalance the same way',
        lines: ['`nums.slice` at each level is correct but costs O(n log n) time and extra memory.', 'Balance a BST: in-order dump (sorted), then rebuild with the middle rule.', 'Clues: **"height-balanced"**, **"sorted array to BST"**, **"balance a BST"**.'],
        frames: [
          { say: 1, note: `The chain's in-order is ${valsOf(CHAIN).join(' ')}: the same sorted array. Rebuild → ${LEVELS} levels.`, panels: [arr(valsOf(CHAIN), { label: 'in-order of the chain' }), treeP(B.root, () => 'done', { label: 'rebuilt' })] },
          { say: 2, note: 'Sorted data, balanced BST wanted → middle as root, recurse on both halves by index.', panels: [vars({ root: 'nums[mid]', left: 'build(lo, mid − 1)', right: 'build(mid + 1, hi)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: two middles',
        lines: [`e.g. nums = [${NUMS2.join(', ')}]: ${NUMS2.length} values, an even count.`, `Indices ${LM} and ${RM} (${NUMS2[LM]} and ${NUMS2[RM]}) are both "the middle".`],
        panels: [arr(NUMS2, { label: 'nums', pointers: [ptr(LM, 'left-mid', 'b'), ptr(RM, 'right-mid', 'c')], highlights: { [LM]: 'window', [RM]: 'window' } })],
        task: {
          type: 'choose',
          question: 'Which root is correct?',
          options: [
            { text: `Only ${NUMS2[LM]}, the left-middle`, why: `(lo + hi + 1) >> 1 picks ${NUMS2[RM]}, and that tree is just as balanced.` },
            { text: `Only ${NUMS2[RM]}, the right-middle`, why: `(lo + hi) >> 1 picks ${NUMS2[LM]}, and that tree is just as balanced.` },
            { text: `Either: both give a height-balanced BST` },
            { text: `${NUMS2[0]}, the smallest, so the order is kept`, why: 'Every other value then goes right of it: the start of a chain, not a balanced tree.' },
          ],
          answer: 2,
        },
        solved: 'There is no single correct output: left-middle and right-middle both halve the range, so tests check "balanced and in-order equals input".',
      },
    ],
  },

  {
    id: 'bst-bottom-up-info',
    title: 'Find the BST hiding inside a plain tree',
    steps: [
      {
        kind: 'watch',
        title: 'Which subtrees are BSTs?',
        lines: ['A **plain** binary tree. e.g. find the max sum of a subtree that is a BST.', 'Validating from every node re-walks each subtree once per ancestor: **O(n²)** on a chain.', 'Flip it: each child **reports** a summary, and the parent decides in O(1).'],
        frames: [
          { say: 0, note: 'The whole tree is not a BST: 9 is the left child of 4. Some subtrees inside may still be.', panels: [treeP(T5, statesOf([[[9], 'bad']]), { label: 'plain binary tree', path: [4, 9] })] },
          { say: 1, note: `A node at depth d is re-walked d + 1 times. Here: ${REWALK_TOTAL} visits for ${REWALK.length} nodes.`, panels: [treeP(T5, () => 'visited'), table(REWALK.map(([v]) => String(v)), ['visits'], REWALK.map(([, d]) => [String(d + 1)]), null, 'validate from every node')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Post-order: children report [isBST, min, max, sum]',
        lines: ['`dfs(node.left)` and `dfs(node.right)` first, then the node itself.', 'BST iff both are BSTs and `lmax < node.val < rmin`.', 'Pass → `[true, min(lmin, val), max(rmax, val), sum]`. Fail → poison `[false, -∞, +∞, 0]`.'],
        frames: GROUPS.map((g, k) => {
          const r = sumOf(g.at(-1));
          let note;
          if (g.length === 2) note = `Leaves ${g.join(' and ')}: empty children never block them → both are BSTs. best = ${r.best}.`;
          else if (!r.lb || !r.rb) note = `${r.v}: a child reported false → poison. Every ancestor of a non-BST fails too. Answer ${BU.best}.`;
          else if (r.res[0]) note = `${r.v}: lmax ${r.lmax} < ${r.v} < rmin ${r.rmin}, both BSTs → sum ${r.res[3]}. best = ${r.best}.`;
          else note = `${r.v}: lmax ${r.lmax} < ${r.v} fails → poison [false, -∞, +∞, 0].`;
          return { say: g.length === 2 ? 0 : r.res[0] ? 2 : 1, note, panels: buPanels(k) };
        }),
      },
      {
        kind: 'watch',
        title: 'One pass, O(n)',
        lines: ['Each node is visited once and combines two O(1) summaries.', 'Variations: return size instead of sum; count the subtrees that pass.', 'Clues: **"largest BST subtree"**, **"maximum sum of any subtree that is also a BST"**.'],
        frames: [
          { say: 0, note: `${REWALK.length} visits instead of ${REWALK_TOTAL}. Best BST: 20 with 15 and 25, sum ${BU.best}.`, panels: [treeP(T5, (n) => (subtree(T5.right).includes(n.val) ? 'done' : 'muted'), { path: subtree(T5.right) }), vars({ answer: BU.best, time: 'O(n)' })] },
          { say: 2, note: 'Find BST-shaped subtrees in a plain tree → children report summaries, parent combines.', panels: [vars({ order: 'post-order', returns: '[isBST, min, max, sum]', fail: 'poison' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the empty child',
        lines: ['dfs(9) first calls dfs(null) for both children.', 'Whatever an empty subtree returns, the leaf must pass `lmax < 9 < rmin`.'],
        panels: [treeP(T5, statesOf([[[9], 'active']])), vars({ 'dfs(null)': '?', check: 'lmax < node.val < rmin' })],
        task: {
          type: 'choose',
          question: 'What must dfs(null) return?',
          options: [
            { text: '[true, +∞, −∞, 0]: min +∞, max −∞, so any parent value passes' },
            { text: '[true, 0, 0, 0]', why: 'A leaf with a negative value, e.g. -5, would fail 0 < -5: a valid BST rejected.' },
            { text: '[false, −∞, +∞, 0]', why: 'That is the poison. An empty tree IS a BST; poison would make every leaf fail.' },
            { text: '[true, −∞, +∞, 0]', why: 'Reversed: lmax = +∞ < node.val is false for every node, so no leaf would pass.' },
          ],
          answer: 0,
        },
        solved: 'Empty subtree = [true, +∞, −∞, 0]: the "impossible" min/max make it neutral, and min(lmin, val) fixes the node\'s own min.',
      },
    ],
  },
];
