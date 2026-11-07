// Step lessons for Binary Search Tree (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every path, bound, in-order output, stack and returned value below comes from running the lesson's code on the example tree.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const fmt = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '-∞' : String(x));
// a table that reveals its answers row by row: k = row being revealed now
const reveal = (rows, col, k) => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : '?']), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));

// ---------- trees ----------
let uid = 0;
const mk = (val, left = null, right = null) => ({ id: `n${uid++}`, val, left, right });
// insertIntoBST from the lesson
const insert = (root, v) => {
  if (!root) return mk(v);
  if (v < root.val) root.left = insert(root.left, v);
  else root.right = insert(root.right, v);
  return root;
};
const fromInserts = (vals) => vals.reduce((r, v) => insert(r, v), null);
// LeetCode level-order array → tree
function fromLevel(a) {
  const ns = a.map((v) => (v === null ? null : mk(v)));
  let k = 1;
  for (const n of ns) {
    if (!n) continue;
    n.left = ns[k++] ?? null;
    n.right = ns[k++] ?? null;
  }
  return ns[0];
}
const toLevel = (root) => {
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    out.push(n ? n.val : null);
    if (n) q.push(n.left, n.right);
  }
  while (out.at(-1) === null) out.pop();
  return out.map(String).join(',');
};
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
const find = (root, v) => {
  let n = root;
  while (n && n.val !== v) n = v < n.val ? n.left : n.right;
  return n;
};
// x = in-order position (so the picture reads left to right in sorted order), y = depth
const layoutOf = (root) => Object.fromEntries(inorder(root).map((n, i) => [n.id, i]));

/** A nodes panel. st: { [val]: state } or (node) => state. path: vals whose connecting edges glow. */
function treeP(root, st = {}, { label, path = [], layout } = {}) {
  const pos = layout || layoutOf(root);
  const nodes = [];
  const edges = [];
  const stateOf = (n) => (typeof st === 'function' ? st(n) : st[n.val]) || '';
  const walk = (n, d, parent) => {
    if (!n) return;
    const s = stateOf(n);
    nodes.push({ id: n.id, label: String(n.val), x: pos[n.id], y: d, ...(s ? { state: s } : {}) });
    if (parent) {
      const es = path.includes(parent.val) && path.includes(n.val) ? 'active' : s === 'muted' ? 'muted' : '';
      edges.push({ from: parent.id, to: n.id, ...(es ? { state: es } : {}) });
    }
    walk(n.left, d + 1, n);
    walk(n.right, d + 1, n);
  };
  walk(root, 0, null);
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const statesOf = (pairs) => Object.fromEntries(pairs.flatMap(([vals, s]) => vals.map((v) => [v, s])));

// Guided descent with the discarded side greyed out. Returns one frame per node looked at.
function descentFrames(root, t, { say = 0, label, layout, extra } = {}) {
  const frames = [];
  const muted = new Set();
  const path = [];
  let n = root;
  while (n) {
    path.push(n.val);
    const st = statesOf([[[...muted], 'muted'], [path, 'visited']]);
    st[n.val] = n.val === t ? 'done' : 'active';
    if (n.val === t) {
      frames.push({ say, note: `${t} === ${n.val}: found after ${path.length} node${path.length > 1 ? 's' : ''}.`, panels: [treeP(root, st, { label, path, layout }), ...(extra ? [extra(n, path)] : [])] });
      return frames;
    }
    const left = t < n.val;
    const skip = valsOf(left ? n.right : n.left);
    skip.forEach((v) => muted.add(v));
    skip.forEach((v) => (st[v] = 'muted'));
    frames.push({
      say,
      note: `${t} ${left ? '<' : '>'} ${n.val}: go ${left ? 'left' : 'right'}.${skip.length ? ` Skip ${skip.join(', ')}.` : ''}`,
      panels: [treeP(root, st, { label, path, layout }), ...(extra ? [extra(n, path)] : [])],
    });
    n = left ? n.left : n.right;
  }
  frames.at(-1).note += ' That side is null: not found.';
  return frames;
}

// iterative in-order with a stack (template): events with the stack after each push / pop
function inorderEvents(root) {
  const ev = [];
  const stack = [];
  let node = root;
  while (node || stack.length) {
    const pushed = [];
    while (node) {
      stack.push(node);
      pushed.push(node.val);
      node = node.left;
    }
    if (pushed.length) ev.push({ kind: 'push', pushed, stack: stack.map((x) => x.val) });
    node = stack.pop();
    ev.push({ kind: 'pop', v: node.val, stack: stack.map((x) => x.val) });
    node = node.right;
  }
  return ev;
}

// ---------- the example trees ----------
// the lesson's tree from "What is it?"
const T = fromLevel([8, 3, 10, 1, 6, null, 14, null, null, 4, 7, 13]);
const T_IN = valsOf(T); // 1 3 4 6 7 8 10 13 14
const leftOf = (root, v) => valsOf(find(root, v).left);
const rightOf = (root, v) => valsOf(find(root, v).right);
// a perfect 7-node BST for smaller pictures
const T7 = () => fromInserts([5, 3, 8, 2, 4, 7, 9]);
const T7_IN = [2, 3, 4, 5, 7, 8, 9];

// ---------- what ----------
const atNode = (v, note, say) => ({
  say,
  note,
  panels: [treeP(T, (n) => (n.val === v ? 'active' : leftOf(T, v).includes(n.val) ? 'visited' : rightOf(T, v).includes(n.val) ? 'done' : 'muted'), { label: 'blue: smaller · orange: larger' })],
});
const whatFrames = [
  atNode(8, 'Left of 8: 1 3 4 6 7, all smaller. Right: 10 13 14, all larger.', 0),
  atNode(3, 'At 3: 1 is smaller; 4 6 7 are larger, and still all < 8.', 1),
  atNode(6, 'At 6: 4 is smaller, 7 is larger.', 2),
  atNode(10, 'At 10: no left side; 13 and 14 are larger.', 2),
];

// ---------- why: sorted inserts make a chain ----------
const chainFrames = [];
{
  let root = null;
  for (const v of [1, 2, 3, 4]) {
    root = insert(root, v);
    chainFrames.push({ say: v === 1 ? 0 : 1, note: v === 1 ? 'Insert 1: the tree was empty, 1 is the root.' : `Insert ${v}: larger than ${valsOf(root).slice(0, -1).join(', ')}, so it goes right every time.`, panels: [treeP(root, { [v]: 'active' })] });
  }
}
const CHAIN = fromInserts([1, 2, 3, 4]);

// ---------- intuition ----------
function intervalFrames(root, t) {
  const frames = [];
  let n = root;
  let low = -Infinity;
  let high = Infinity;
  const path = [];
  while (n) {
    path.push(n.val);
    const st = Object.fromEntries(path.map((v) => [v, 'visited']));
    st[n.val] = 'active';
    frames.push({ node: n.val, low, high, panel: treeP(root, st, { path }) });
    if (n.val === t) break;
    if (t < n.val) {
      high = n.val;
      n = n.left;
    } else {
      low = n.val;
      n = n.right;
    }
  }
  return frames;
}
const IV7 = intervalFrames(T, 7);
const IV13 = intervalFrames(T, 13);

// in-order of T7 with the output growing
function inorderOutFrames(root, say) {
  const order = valsOf(root);
  return order.map((v, k) => ({
    say,
    note: k === 0 ? `${v} has no left subtree: it comes out first.` : k === order.length - 1 ? `${v} is last. Output: ${order.join(' ')} — sorted.` : `Next: ${v}.`,
    panels: [treeP(root, (n) => (n.val === v ? 'active' : order.indexOf(n.val) < k ? 'done' : '')), arr(order.map((x, i) => (i <= k ? x : '')), { label: 'in-order output', highlights: hl(order.length, (i) => (i === k ? 'active' : i < k ? 'done' : '')) })],
  }));
}
const IN_A = T7();
const IN_B = fromInserts([6, 2, 9, 1, 4, 8, 3]);
const IN_B_ORDER = valsOf(IN_B); // 1 2 3 4 6 8 9

// ---------- brute force ----------
function bruteVisits(root, t) {
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
const BRUTE14 = bruteVisits(T, 14);
const DESC14 = descentFrames(T, 14, { say: 0 });

// ---------- optimized-descent ----------
// insert 6 into T7, keeping the final layout
const INS = T7();
const INS_FINAL = insert(clone(INS), 6);
const INS_LAYOUT = layoutOf(INS_FINAL);
const insertFrames = (() => {
  const frames = [];
  let n = INS;
  const path = [];
  while (true) {
    path.push(n.val);
    const left = 6 < n.val;
    const next = left ? n.left : n.right;
    const st = Object.fromEntries(path.map((v) => [v, 'visited']));
    st[n.val] = 'active';
    frames.push({ say: 1, note: `6 ${left ? '<' : '>'} ${n.val}: go ${left ? 'left' : 'right'}.${next ? '' : ` ${n.val}.${left ? 'left' : 'right'} is null.`}`, panels: [treeP(INS, st, { path, layout: INS_LAYOUT }), vars({ val: 6, node: n.val })] });
    if (!next) break;
    n = next;
  }
  insert(INS, 6);
  frames.push({ say: 2, note: '6 is attached there as a leaf. No other node moved.', panels: [treeP(INS, { 6: 'done', ...Object.fromEntries(path.map((v) => [v, 'visited'])) }, { path: [...path, 6], layout: INS_LAYOUT }), vars({ val: 6, attached: 'left of 7' })] });
  return frames;
})();
// insert 10 into T7 + 6
const INS10 = (() => {
  const root = T7();
  insert(root, 6);
  return root;
})();
const INS10_FINAL = insert(clone(INS10), 10);
const INS10_LAYOUT = layoutOf(INS10_FINAL);
const ins10Path = [];
for (let n = INS10; n; n = 10 < n.val ? n.left : n.right) ins10Path.push(n.val);

// deleteNode from the lesson, logging the cases it hits
function deleteNode(root, key, log = () => {}) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNode(root.left, key, log);
  else if (key > root.val) root.right = deleteNode(root.right, key, log);
  else {
    if (!root.left) {
      log(root.right ? 'one' : 'leaf', root);
      return root.right;
    }
    if (!root.right) {
      log('one', root);
      return root.left;
    }
    let succ = root.right;
    const walk = [succ.val];
    while (succ.left) {
      succ = succ.left;
      walk.push(succ.val);
    }
    log('two', root, walk);
    root.val = succ.val;
    root.right = deleteNode(root.right, succ.val, log);
  }
  return root;
}
// the predecessor variant (max of the left subtree), for comparison only
function deleteNodePred(root, key) {
  if (!root) return null;
  if (key < root.val) root.left = deleteNodePred(root.left, key);
  else if (key > root.val) root.right = deleteNodePred(root.right, key);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let pred = root.left;
    while (pred.right) pred = pred.right;
    root.val = pred.val;
    root.left = deleteNodePred(root.left, pred.val);
  }
  return root;
}

// delete a leaf (2) then a one-child node (7) from T7 + 6
const DEL = (() => {
  const root = T7();
  insert(root, 6);
  return root;
})();
const DEL_LAYOUT = layoutOf(DEL);
const delFrames = (() => {
  const frames = [];
  const pathTo = (v) => {
    const p = [];
    for (let n = DEL; n; n = v < n.val ? n.left : n.right) {
      p.push(n.val);
      if (n.val === v) break;
    }
    return p;
  };
  const p2 = pathTo(2);
  frames.push({ say: 0, note: `Find 2: ${p2.join(' → ')}. It has no children: a leaf.`, panels: [treeP(DEL, { ...statesOf([[p2, 'visited']]), 2: 'bad' }, { path: p2, layout: DEL_LAYOUT })] });
  let hit;
  deleteNode(DEL, 2, (c) => (hit = c));
  if (hit !== 'leaf') throw new Error('bst steps: 2 should be a leaf');
  frames.push({ say: 0, note: '`return null` to 3: 3.left = null. 2 is gone.', panels: [treeP(DEL, { 3: 'active' }, { layout: DEL_LAYOUT })] });
  const p7 = pathTo(7);
  frames.push({ say: 1, note: `Find 7: ${p7.join(' → ')}. It has one child, 6.`, panels: [treeP(DEL, { ...statesOf([[p7, 'visited']]), 7: 'bad', 6: 'active' }, { path: p7, layout: DEL_LAYOUT })] });
  deleteNode(DEL, 7, (c) => (hit = c));
  if (hit !== 'one') throw new Error('bst steps: 7 should have one child');
  frames.push({ say: 2, note: '`return 7.left` to 8: 6 is spliced up. 6 was already in (5, 8): still ordered.', panels: [treeP(DEL, { 6: 'done', 8: 'active' }, { layout: DEL_LAYOUT }), vars({ '6 lives in': '(5, 8)' })] });
  return frames;
})();

// delete 5 (two children) from T7 + 6
const DEL5 = (() => {
  const root = T7();
  insert(root, 6);
  return root;
})();
const DEL5_LAYOUT = layoutOf(DEL5);
let DEL5_WALK;
const del5Start = treeP(DEL5, { 5: 'active' }, { layout: DEL5_LAYOUT });
const del5Frames = (() => {
  const frames = [];
  // successor walk
  let succ = DEL5.right;
  const walk = [succ.val];
  while (succ.left) {
    succ = succ.left;
    walk.push(succ.val);
  }
  DEL5_WALK = walk;
  walk.forEach((v, i) => frames.push({ say: 2, note: i === 0 ? `Start at the right child, ${v}.` : i === walk.length - 1 ? `${v}.left is null: the successor is ${v}.` : `${walk[i - 1]}.left = ${v}: keep going left.`, panels: [treeP(DEL5, { 5: 'active', ...statesOf([[walk.slice(0, i), 'visited']]), [v]: i === walk.length - 1 ? 'done' : 'visited' }, { path: [5, ...walk.slice(0, i + 1)], layout: DEL5_LAYOUT })] }));
  const sv = succ.val;
  const rootNode = DEL5;
  rootNode.val = sv; // copy successor up (deleteNode does exactly this)
  frames.push({ say: 2, note: `Copy ${sv} into the root. Now ${sv} appears twice.`, panels: [treeP(DEL5, (n) => (n === rootNode ? 'active' : n.val === sv ? 'bad' : ''), { layout: DEL5_LAYOUT })] });
  rootNode.right = deleteNode(rootNode.right, sv);
  frames.push({ say: 2, note: `Delete ${sv} from the right subtree: it is a leaf. Done.`, panels: [treeP(DEL5, { [sv]: 'done' }, { layout: DEL5_LAYOUT }), arr(valsOf(DEL5), { label: 'in-order', showIndices: false })] });
  return frames;
})();

// LCA by descending
function lcaFrames(root, p, q) {
  const frames = [];
  const muted = new Set();
  const path = [];
  for (let n = root; n; ) {
    path.push(n.val);
    const st = statesOf([[[...muted], 'muted'], [path, 'visited']]);
    if (p < n.val && q < n.val) {
      valsOf(n.right).forEach((v) => muted.add(v));
      frames.push({ say: 0, note: `${p} and ${q} are both < ${n.val}: go left.`, panels: [treeP(root, { ...st, ...statesOf([[valsOf(n.right), 'muted']]), [n.val]: 'active' }, { path }), vars({ p, q, node: n.val })] });
      n = n.left;
    } else if (p > n.val && q > n.val) {
      valsOf(n.left).forEach((v) => muted.add(v));
      frames.push({ say: 0, note: `${p} and ${q} are both > ${n.val}: go right.`, panels: [treeP(root, { ...st, ...statesOf([[valsOf(n.left), 'muted']]), [n.val]: 'active' }, { path }), vars({ p, q, node: n.val })] });
      n = n.right;
    } else {
      frames.push({ say: 1, note: `${p} and ${q} split at ${n.val}${n.val === p || n.val === q ? ` (${n.val} is one of them)` : ''}: LCA = ${n.val}.`, panels: [treeP(root, { ...st, [n.val]: 'done', [p]: p === n.val ? 'done' : 'active', [q]: q === n.val ? 'done' : 'active' }, { path }), vars({ p, q, LCA: n.val })] });
      return { frames, lca: n.val };
    }
  }
  return { frames, lca: null };
}
const LCA47 = lcaFrames(T, 4, 7);
const LCA1013 = lcaFrames(T, 10, 13);

// ---------- template: recursive insert of 1 into T7 ("return the new subtree root") ----------
const TPL = T7();
const TPL_LAYOUT = layoutOf(insert(clone(TPL), 1));
const tplFrames = (() => {
  const frames = [];
  const open = [];
  const ins = (node, key) => {
    open.push(node ? `ins(${node.val})` : 'ins(null)');
    if (!node) {
      const made = mk(key);
      frames.push({ say: 0, note: `ins(null) returns a new node ${key}.`, panels: [treeP(TPL, {}, { layout: TPL_LAYOUT }), stk(open.slice(), 'call stack'), vars({ returns: `node ${key}` })] });
      open.pop();
      return made;
    }
    frames.push({ say: 0, note: `ins(${node.val}): ${key} < ${node.val}, call ins(${node.left ? node.left.val : 'null'}).`, panels: [treeP(TPL, { [node.val]: 'active' }, { layout: TPL_LAYOUT }), stk(open.slice(), 'call stack')] });
    if (key < node.val) node.left = ins(node.left, key);
    else node.right = ins(node.right, key);
    open.pop();
    frames.push({ say: 1, note: `${node.val}.left = what came back (${node.left.val}). ins(${node.val}) returns ${node.val}.`, panels: [treeP(TPL, { [node.val]: 'active', [node.left.val]: 'done' }, { layout: TPL_LAYOUT }), stk(open.length ? open.slice() : [], 'call stack'), vars({ returns: `node ${node.val}` })] });
    return node;
  };
  ins(TPL, 1);
  frames.at(-1).say = 2;
  frames.at(-1).note = 'ins(5) returns 5, the same root. Nobody tracked a parent.';
  return frames;
})();
// in-order stack loop on T7
const TPL_IN = T7();
const TPL_EV = inorderEvents(TPL_IN);
const stackFrames = (root, ev, say) => {
  const out = [];
  return ev.map((e) => {
    if (e.kind === 'pop') out.push(e.v);
    const order = valsOf(root);
    const values = order.map((v) => (out.includes(v) ? v : ''));
    return {
      say: e.kind === 'push' ? say[0] : say[1],
      note: e.kind === 'push' ? `Push the left spine: ${e.pushed.join(', ')}.` : `Pop ${e.v}: the smallest unvisited. Visit it, then go to its right child.`,
      panels: [treeP(root, (n) => (e.kind === 'pop' && n.val === e.v ? 'active' : out.includes(n.val) ? 'done' : e.stack.includes(n.val) ? 'visited' : '')), stk(e.stack), arr(values, { label: 'visited', highlights: hl(values.length, (i) => (e.kind === 'pop' && order[i] === e.v ? 'active' : values[i] !== '' ? 'done' : '')) })],
    };
  });
};

// ---------- optimized-inorder ----------
// kth smallest with early stop (k = 3) on T7
const kthFrames = (root, k, say) => {
  const frames = [];
  const stack = [];
  let node = root;
  let count = 0;
  const popped = [];
  while (node || stack.length) {
    const pushed = [];
    while (node) {
      stack.push(node);
      pushed.push(node.val);
      node = node.left;
    }
    if (pushed.length) frames.push({ say: say[0], note: `Push the left spine: ${pushed.join(', ')}.`, panels: [treeP(root, (n) => (popped.includes(n.val) ? 'done' : stack.includes(n) ? 'visited' : '')), stk(stack.map((x) => x.val)), vars({ k, count })] });
    node = stack.pop();
    count++;
    popped.push(node.val);
    const stop = count === k;
    frames.push({ say: stop ? say[1] : say[0], note: stop ? `Pop ${node.val}: count = ${k} = k. Stop: answer ${node.val}.` : `Pop ${node.val}: count = ${count}.`, panels: [treeP(root, (n) => (n.val === node.val ? (stop ? 'done' : 'active') : popped.includes(n.val) ? 'done' : stack.includes(n) ? 'visited' : '')), stk(stack.map((x) => x.val)), vars(stop ? { k, count, answer: node.val } : { k, count })] });
    if (stop) return { frames, answer: node.val, pops: count };
    node = node.right;
  }
  return { frames };
};
const KTH3 = kthFrames(T7(), 3, [0, 1]);
const KTH2 = kthFrames(T7(), 2, [0, 0]);

// min difference on a 7-node BST
const MD = fromInserts([10, 4, 15, 1, 7, 13, 20]);
const MD_IN = valsOf(MD);
const mdFrames = (() => {
  let best = Infinity;
  return MD_IN.slice(1).map((cur, j) => {
    const i = j + 1;
    const d = cur - MD_IN[i - 1];
    const better = d < best;
    best = Math.min(best, d);
    return {
      say: 1,
      note: `${cur} − ${MD_IN[i - 1]} = ${d}.${better ? ` New best: ${best}.` : ''}`,
      panels: [arr(MD_IN, { label: 'in-order', pointers: [ptr(i - 1, 'prev', 'b'), ptr(i, 'cur')], highlights: hl(MD_IN.length, (k) => (k === i || k === i - 1 ? 'active' : k < i ? 'done' : '')) }), vars({ prev: MD_IN[i - 1], cur, diff: d, best })],
    };
  });
})();
const MD_BEST = Math.min(...MD_IN.slice(1).map((v, i) => v - MD_IN[i]));

// recover: T7 with 4 and 5 swapped (neighbours in sorted order → one drop)
const REC = T7();
{
  const [a, b] = [find(REC, 4), find(REC, 5)];
  [a.val, b.val] = [b.val, a.val];
}
const REC_IN = valsOf(REC); // 2 3 5 4 7 8 9
const recFrames = (() => {
  const frames = [];
  let first = null;
  let second = null;
  for (let i = 1; i < REC_IN.length; i++) {
    const drop = REC_IN[i - 1] > REC_IN[i];
    if (drop) {
      if (first === null) first = REC_IN[i - 1];
      second = REC_IN[i];
    }
    frames.push({
      say: drop ? 1 : 0,
      note: drop ? `Drop: ${REC_IN[i - 1]} > ${REC_IN[i]}. first = prev = ${first}, second = cur = ${second}.` : `${REC_IN[i - 1]} < ${REC_IN[i]}: fine.`,
      panels: [arr(REC_IN, { label: 'in-order', pointers: [ptr(i - 1, 'prev', 'b'), ptr(i, 'cur')], highlights: hl(REC_IN.length, (k) => (k === i || k === i - 1 ? (drop ? 'bad' : 'active') : '')) }), vars({ first: fmt(first ?? '—'), second: fmt(second ?? '—') })],
    });
  }
  const fixed = REC_IN.map((v) => (v === first ? second : v === second ? first : v));
  frames.push({ say: 2, note: `Only one drop: the two swapped values were neighbours. Swap ${first} and ${second} back.`, panels: [arr(fixed, { label: 'in-order after the swap', highlights: hl(fixed.length, (k) => (fixed[k] === first || fixed[k] === second ? 'done' : '')) }), vars({ first, second })] });
  return frames;
})();

// BST iterator on T7
const IT = T7();
const itFrames = (() => {
  const frames = [];
  const stack = [];
  const pushLeft = (n) => {
    const p = [];
    while (n) {
      stack.push(n);
      p.push(n.val);
      n = n.left;
    }
    return p;
  };
  const out = [];
  let pushes = 0;
  const pic = (cur) => treeP(IT, (n) => (n.val === cur ? 'active' : out.includes(n.val) ? 'done' : stack.includes(n) ? 'visited' : ''));
  let p = pushLeft(IT);
  pushes += p.length;
  frames.push({ say: 1, note: `Constructor: push the left spine ${p.join(', ')}.`, panels: [pic(null), stk(stack.map((x) => x.val)), vars({ pushes, hasNext: stack.length > 0 })] });
  while (stack.length) {
    const node = stack.pop();
    p = pushLeft(node.right);
    pushes += p.length;
    out.push(node.val);
    frames.push({ say: 2, note: `next() pops ${node.val}${p.length ? `, pushes ${p.join(', ')}` : ''}, returns ${node.val}.`, panels: [pic(node.val), stk(stack.map((x) => x.val)), vars({ pushes, hasNext: stack.length > 0 })] });
  }
  frames.at(-1).note += ' Stack empty: hasNext() is false.';
  return { frames, pushes };
})();

// ---------- optimized-bounds ----------
const BAD = fromLevel([10, 5, 15, 2, 12]);
const badPairs = [];
(function pairs(n) {
  if (n.left) badPairs.push([n.left.val, '<', n.val]), pairs(n.left);
  if (n.right) badPairs.push([n.right.val, '>', n.val]), pairs(n.right);
})(BAD);
const validFrames = (() => {
  const frames = [];
  const seen = [];
  const valid = (node, low = -Infinity, high = Infinity) => {
    if (!node) return true;
    const ok = !(node.val <= low || node.val >= high);
    seen.push(node.val);
    frames.push({ say: 1, note: ok ? `${node.val} is in (${fmt(low)}, ${fmt(high)}): ok.` : `${node.val} is not in (${fmt(low)}, ${fmt(high)}): return false.`, panels: [treeP(BAD, (n) => (n.val === node.val ? (ok ? 'active' : 'bad') : seen.includes(n.val) ? 'done' : '')), vars({ node: node.val, low: fmt(low), high: fmt(high) })] });
    if (!ok) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  };
  const res = valid(BAD);
  if (res !== false) throw new Error('bst steps: BAD tree should be invalid');
  const skipped = valsOf(BAD).filter((v) => !seen.includes(v));
  frames.push({ say: 1, note: `false. ${skipped.join(', ')} ${skipped.length > 1 ? 'are' : 'is'} never checked: \`&&\` stops early.`, panels: [treeP(BAD, (n) => (n.val === 12 ? 'bad' : seen.includes(n.val) ? 'done' : 'muted')), vars({ valid: false })] });
  return frames;
})();

// range sum with pruning (rule from the lesson)
function rangeSum(root, L, R) {
  const frames = [];
  const seen = [];
  const muted = new Set();
  let sum = 0;
  const go = (n) => {
    if (!n) return;
    seen.push(n.val);
    const pic = (cur, s) => treeP(root, (x) => (x.val === cur ? s : muted.has(x.val) ? 'muted' : seen.includes(x.val) ? 'visited' : ''));
    if (n.val < L) {
      valsOf(n.left).forEach((v) => muted.add(v));
      muted.add(n.val);
      frames.push({ say: 1, note: `${n.val} < ${L}: ${n.val}${n.left ? ' and its left side are' : ' is'} too small. Only go right.`, panels: [pic(n.val, 'bad'), vars({ L, R, sum })] });
      return go(n.right);
    }
    if (n.val > R) {
      valsOf(n.right).forEach((v) => muted.add(v));
      muted.add(n.val);
      frames.push({ say: 1, note: `${n.val} > ${R}: ${n.val}${n.right ? ' and its right side are' : ' is'} too big. Only go left.`, panels: [pic(n.val, 'bad'), vars({ L, R, sum })] });
      return go(n.left);
    }
    sum += n.val;
    frames.push({ say: 0, note: `${n.val} is in [${L}, ${R}]: add it (sum = ${sum}), try both sides.`, panels: [pic(n.val, 'done'), vars({ L, R, sum })] });
    go(n.left);
    go(n.right);
  };
  go(root);
  return { frames, sum, visited: seen.length, skipped: valsOf(root).filter((v) => !seen.includes(v)) };
}
const RS = rangeSum(T, 9, 20);
const RS2 = rangeSum(T, 1, 5);

// trim T to [5, 13]
const TRIM = clone(T);
const TRIM_LAYOUT = layoutOf(T);
const trimFrames = (() => {
  const frames = [];
  const gone = new Set();
  const kept = new Set();
  const pic = (cur, s) => treeP(T, (x) => (x.val === cur ? s : gone.has(x.val) ? 'muted' : kept.has(x.val) ? 'done' : ''), { layout: TRIM_LAYOUT });
  const trim = (node, low, high) => {
    if (!node) return null;
    if (node.val < low) {
      gone.add(node.val);
      valsOf(node.left).forEach((v) => gone.add(v));
      frames.push({ say: 0, note: `${node.val} < ${low}: drop ${node.val}${node.left ? ` and ${valsOf(node.left).join(', ')}` : ''}; return trim(${node.right ? node.right.val : 'null'}).`, panels: [pic(node.val, 'bad'), vars({ low, high })] });
      return trim(node.right, low, high);
    }
    if (node.val > high) {
      gone.add(node.val);
      valsOf(node.right).forEach((v) => gone.add(v));
      frames.push({ say: 1, note: `${node.val} > ${high}: drop ${node.val}${node.right ? ` and ${valsOf(node.right).join(', ')}` : ''}; return trim(${node.left ? node.left.val : 'null'}).`, panels: [pic(node.val, 'bad'), vars({ low, high })] });
      return trim(node.left, low, high);
    }
    kept.add(node.val);
    frames.push({ say: 2, note: `${node.val} is in [${low}, ${high}]: keep it, trim both children.`, panels: [pic(node.val, 'active'), vars({ low, high })] });
    node.left = trim(node.left, low, high);
    node.right = trim(node.right, low, high);
    return node;
  };
  const res = trim(TRIM, 5, 13);
  frames.push({ say: 2, note: `Result: ${valsOf(res).join(' ')}, still a BST.`, panels: [treeP(res, () => 'done', { layout: TRIM_LAYOUT }), vars({ low: 5, high: 13 })] });
  return frames;
})();

// ---------- optimized-build ----------
function buildRun(nums) {
  const calls = [];
  let nulls = 0;
  const b = (lo, hi, depth) => {
    if (lo > hi) {
      nulls++;
      return null;
    }
    const mid = (lo + hi) >> 1;
    const node = mk(nums[mid]);
    calls.push({ lo, hi, mid, node, depth });
    node.left = b(lo, mid - 1, depth + 1);
    node.right = b(mid + 1, hi, depth + 1);
    return node;
  };
  const root = b(0, nums.length - 1, 0);
  return { root, calls, nulls, levels: Math.max(...calls.map((c) => c.depth)) + 1 };
}
const buildFrames = (nums, run, say) => {
  const made = new Set();
  return run.calls.map((c, k) => {
    made.add(c.node.id);
    return {
      say: k === 0 ? say[0] : say[1],
      note: `build(${c.lo}, ${c.hi}): mid = (${c.lo} + ${c.hi}) >> 1 = ${c.mid} → node ${nums[c.mid]}.`,
      panels: [
        arr(nums, { label: 'nums', range: [c.lo, c.hi], pointers: [ptr(c.mid, 'mid')], highlights: hl(nums.length, (i) => (i === c.mid ? 'active' : i >= c.lo && i <= c.hi ? 'window' : run.calls.slice(0, k).some((d) => d.mid === i) ? 'done' : '')) }),
        treeP(run.root, (n) => (n.id === c.node.id ? 'active' : made.has(n.id) ? 'done' : 'hidden')),
      ],
    };
  });
};
const B7 = [2, 3, 5, 7, 8, 11, 13];
const B7RUN = buildRun(B7);
const B6 = [1, 2, 3, 4, 5, 6];
const B6RUN = buildRun(B6);

// ---------- optimized-bottom-up ----------
const P = fromLevel([1, 4, 3, 2, 5, null, 6]);
const buRun = (() => {
  const rows = [];
  let best = 0;
  const dfs = (node) => {
    if (!node) return [true, Infinity, -Infinity, 0];
    const [lb, lmin, lmax, lsum] = dfs(node.left);
    const [rb, rmin, rmax, rsum] = dfs(node.right);
    let r;
    if (lb && rb && lmax < node.val && node.val < rmin) {
      const sum = lsum + node.val + rsum;
      best = Math.max(best, sum);
      r = [true, Math.min(lmin, node.val), Math.max(rmax, node.val), sum];
    } else r = [false, -Infinity, Infinity, 0];
    rows.push({ v: node.val, r, why: { lb, rb, lmax, rmin } });
    return r;
  };
  dfs(P);
  return { rows, best };
})();
const buFrames = buRun.rows.map((row, k) => {
  const { lb, rb, lmax, rmin } = row.why;
  const ok = row.r[0];
  const note = ok
    ? `${fmt(lmax)} < ${row.v} < ${fmt(rmin)}: BST, sum ${row.r[3]}.`
    : !lb || !rb
      ? `A child is not a BST: ${row.v} fails too (poison).`
      : `Needs ${fmt(lmax)} < ${row.v} < ${fmt(rmin)}: false. Return poison.`;
  const done = buRun.rows.slice(0, k + 1);
  return {
    say: k === 0 ? 0 : ok ? 2 : 3,
    note,
    panels: [
      treeP(P, (n) => {
        const r = done.find((d) => d.v === n.val);
        return n.val === row.v ? (ok ? 'active' : 'bad') : r ? (r.r[0] ? 'done' : 'bad') : '';
      }),
      table(
        done.map((d) => String(d.v)),
        ['ok', 'min', 'max', 'sum'],
        done.map((d) => [d.r[0] ? 'yes' : 'no', fmt(d.r[1]), fmt(d.r[2]), String(d.r[3])]),
        done.map((d, i) => [0, 1, 2, 3].map(() => (i === k ? (d.r[0] ? 'active' : 'bad') : ''))),
      ),
    ],
  };
});
const CHAIN4 = fromInserts([1, 2, 3, 4]);

// ---------- mistakes / interview tips ----------
const MIS = T7();
const MIS_LAYOUT = layoutOf(MIS);
const SKEW = fromInserts([1, 2, 3, 4]);
const delVariants = (() => {
  const a = T7();
  const s = deleteNode(clone(a), 5);
  const p = deleteNodePred(clone(a), 5);
  return { orig: a, succ: s, pred: p, lay: layoutOf(a) };
})();

// ---------- the lesson's dry run ----------
const D = fromLevel([5, 3, 6, 2, 4, null, 7]);
const D_LAYOUT = layoutOf(D);
const DRY_ROWS = [
  ['1', '5', '3 < 5', '5'],
  ['2', '3', 'found', '—'],
  ['2', '3→4', 'copy', '—'],
  ['3', '4', 'found', 'null'],
  ['2', '4', '—', 'node 4'],
  ['1', '5', '—', 'root 5'],
];
const dryTable = (k) =>
  table(
    DRY_ROWS.map((r) => `call ${r[0]}`),
    ['node', 'cmp', 'returns'],
    DRY_ROWS.map((r, i) => (i <= k ? r.slice(1) : ['', '', ''])),
    DRY_ROWS.map((_, i) => [0, 1, 2].map(() => (i === k ? 'active' : i < k ? 'done' : ''))),
  );
const dryFrames = (() => {
  const root = clone(D);
  const node3 = root.left;
  const leaf4 = node3.right;
  const f = [];
  f.push({ say: 0, note: 'Call 1 at 5: 3 < 5 → root.left = deleteNode(3, 3).', panels: [treeP(root, { 5: 'active' }, { layout: D_LAYOUT }), dryTable(0)] });
  f.push({ say: 1, note: 'Call 2 at 3: found. Two children (2 and 4) → successor = leftmost of right subtree = 4.', panels: [treeP(root, { 3: 'active', 2: 'visited', 4: 'done' }, { layout: D_LAYOUT }), dryTable(1)] });
  node3.val = 4;
  f.push({ say: 2, note: 'node.val = 4; node.right = deleteNode(4, 4).', panels: [treeP(root, (n) => (n === node3 ? 'active' : n === leaf4 ? 'bad' : ''), { layout: D_LAYOUT }), dryTable(2)] });
  f.push({ say: 2, note: 'Call 3 at the lower 4: found, no left child → return node.right (null).', panels: [treeP(root, (n) => (n === leaf4 ? 'active' : n === node3 ? 'visited' : ''), { layout: D_LAYOUT }), dryTable(3)] });
  node3.right = null;
  f.push({ say: 3, note: 'Back in call 2: node.right = null. Returns node 4 (children: 2).', panels: [treeP(root, (n) => (n === node3 ? 'active' : ''), { layout: D_LAYOUT }), dryTable(4)] });
  f.push({ say: 3, note: 'Back in call 1: root.left = node 4. Returns root 5. Result: [5,4,6,2,null,null,7].', panels: [treeP(root, () => 'done', { layout: D_LAYOUT }), dryTable(5)] });
  // the frames must agree with the lesson's deleteNode
  if (toLevel(root) !== toLevel(deleteNode(clone(D), 3)) || toLevel(root) !== '5,4,6,2,null,null,7') throw new Error('bst steps: dry run drifted from deleteNode');
  return f;
})();
const D_PRED = deleteNodePred(clone(D), 3);
if (toLevel(D_PRED) !== '5,2,6,null,4,null,7') throw new Error('bst steps: predecessor result drifted');

export default {
  what: [
    {
      kind: 'watch',
      title: 'One rule, every node',
      lines: ['Smaller values go **left**, bigger values go **right**.', 'The rule covers the **whole subtree**, not just the children.', 'And it holds again at every node, all the way down.'],
      frames: whatFrames,
    },
    {
      kind: 'watch',
      title: 'Search like binary search',
      lines: ['Looking for 7: compare, then go to **one** side only.', 'The greyed side cannot hold 7, so it is never looked at.', '4 nodes looked at instead of 9.'],
      frames: descentFrames(T, 7).map((f, i, all) => ({ ...f, say: i === all.length - 1 ? 2 : i === 0 ? 0 : 1 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: find 13',
      lines: ['Same tree, new target: 13.', 'At each node: smaller → left, larger → right.'],
      panels: [treeP(T), vars({ target: 13 })],
      task: { type: 'order', question: 'Tap the nodes the search for 13 looks at, in order.', items: ['8', '10', '14', '13'], hint: '13 > 8, so the first move is right.' },
      solved: '8 → 10 → 14 → 13. The whole left side of 8 was skipped.',
      then: descentFrames(T, 13, { say: 0 }),
    },
    {
      kind: 'turn',
      title: 'Your turn: sorted for free',
      lines: ['In-order = **left subtree, node, right subtree**.', 'Apply it at every node.'],
      panels: [treeP(T)],
      task: {
        type: 'choose',
        question: 'What does an in-order walk of this tree print?',
        options: [
          { text: `\`${T_IN.join(' ')}\``, why: '' },
          { text: '`8 3 10 1 6 14 4 7 13`', why: 'That reads the tree level by level, top to bottom.' },
          { text: '`8 3 1 6 4 7 10 14 13`', why: 'That prints each node **before** its left subtree. In-order prints the left subtree first.' },
        ],
        answer: 0,
      },
      solved: 'In-order of a BST comes out sorted: 1 3 4 6 7 8 10 13 14.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Sorted inserts build a chain',
      lines: ['Insert `1, 2, 3, 4` in that order.', 'Each new value is larger than all before it, so it goes right of the previous one.'],
      frames: chainFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: how tall?',
      lines: ['**Height** = edges on the longest root-to-leaf path.', 'Almost every BST operation costs O(h).'],
      panels: [treeP(CHAIN)],
      task: { type: 'number', question: 'What is the height of this tree?', options: [2, 3, 4], answer: 3, hint: 'Count edges, not nodes: 4 nodes in a chain.' },
      solved: 'Height n − 1 = 3. Search is O(n) here: no better than a list.',
    },
    {
      kind: 'turn',
      title: 'Your turn: fast at everything',
      lines: ['A set of numbers that changes over time.', 'You also ask ordered questions like "smallest value ≥ 42".'],
      panels: [
        table(
          ['unsorted arr', 'sorted arr', 'hash set', 'balanced BST'],
          ['search', 'insert', 'sorted walk'],
          [
            ['O(n)', 'O(1)', 'O(n log n)'],
            ['O(log n)', 'O(n)', 'O(n)'],
            ['O(1) avg', 'O(1) avg', 'O(n log n)'],
            ['O(log n)', 'O(log n)', 'O(n)'],
          ],
        ),
      ],
      task: {
        type: 'choose',
        question: 'You need fast inserts **and** "smallest value ≥ 42". Which structure?',
        options: [
          { text: 'Balanced BST', why: '' },
          { text: 'Hash set', why: 'A hash set has no order: an ordered question needs a sort first, O(n log n).' },
          { text: 'Sorted array', why: 'The ordered question is fast, but every insert shifts elements: O(n).' },
          { text: 'Unsorted array', why: 'Even a plain search is O(n).' },
        ],
        answer: 0,
      },
      solved: 'A balanced BST is O(log n) for search, insert and delete, and O(n) for a sorted walk — if it stays balanced.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Which superpower?',
      lines: ['Ask: which of the BST superpowers does this problem need?', 'Each kind of need maps to one pattern.'],
      frames: [
        ['one value / LCA', 'guided descent'],
        ['kth, min diff', 'in-order + prev'],
        ['validate, range', 'pass (low, high)'],
        ['sorted data', 'build balanced'],
        ['BSTs in plain tree', 'bottom-up info'],
      ].map((r, k, all) => ({ say: k === 0 ? 0 : 1, note: `${r[0]} → ${r[1]}.`, panels: [reveal(all, 'pattern', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: values in a range',
      lines: ['Problem: sum every value between 10 and 20.', 'Several nodes count, not just one.'],
      panels: [treeP(T, statesOf([[[10, 13, 14], 'visited']]), { label: 'values in [10, 20]' })],
      task: {
        type: 'choose',
        question: 'Which pattern fits?',
        options: [
          { text: 'Pass (low, high) down', why: '' },
          { text: 'Guided descent', why: 'Descent follows one path to one value; a range covers many nodes.' },
          { text: 'Build balanced', why: 'That makes a tree from sorted data; here the tree is given.' },
          { text: 'Bottom-up info', why: 'That finds BST-shaped subtrees inside a plain binary tree.' },
        ],
        answer: 0,
      },
      solved: 'Range questions use the interval each node owns: pass (low, high) down.',
    },
    {
      kind: 'turn',
      title: 'Your turn: no built-in sorted set',
      lines: ['JavaScript has no built-in sorted set or tree map.', 'Your set changes, and you only ever ask for its **minimum**.'],
      panels: [vars({ need: 'min only', 'sorted set': 'none' })],
      task: {
        type: 'choose',
        question: 'What do you reach for?',
        options: [
          { text: 'A heap', why: '' },
          { text: 'A hash set', why: 'A hash set has no order: the minimum is not at hand.' },
          { text: 'Write a full BST', why: 'Possible, but more than you need when only min/max is asked.' },
        ],
        answer: 0,
      },
      solved: 'Only min/max → a heap (next topic). Small n → a sorted array with binary search. Otherwise, write a BST.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Run the checklist',
      lines: ['1. Is the tree a BST?', '2. One value or one path? → guided descent.', '3. Sorted order or sorted neighbours? → in-order walk.', '4. Validity or a range? → pass (low, high) down.'],
      frames: [
        ['is it a BST?', 'yes'],
        ['one path?', 'no'],
        ['sorted order?', 'yes'],
      ].map((r, k, all) => ({ say: k, note: k === 2 ? 'k-th smallest is about sorted order → in-order walk.' : k === 0 ? 'Problem: k-th smallest in a BST. Q1: yes, the tricks apply.' : 'It is not about one value: no single path.', panels: [reveal(all, 'kth smallest', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: just a binary tree',
      lines: ['Statement: given a **binary tree**, count nodes with an even value.', 'The word "search" is missing.'],
      panels: [treeP(fromLevel([4, 9, 2, 6, 1]), {}, { label: 'binary tree' })],
      task: {
        type: 'choose',
        question: 'Which BST trick applies?',
        options: [
          { text: 'None: visit every node', why: '' },
          { text: 'Guided descent', why: 'Without the ordering you cannot know which side to skip (9 sits left of 4).' },
          { text: 'Pass (low, high) down', why: 'Bounds come from the ordering, and this tree has none.' },
        ],
        answer: 0,
      },
      solved: 'If it just says "binary tree", none of the BST tricks apply.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Every node owns an interval',
      lines: ['The root owns `(-∞, +∞)`.', 'Each step down splits the parent interval at the parent value.', 'A value fits exactly one node interval: one path.'],
      frames: IV7.map((f, i) => ({
        say: i === 0 ? 0 : i === IV7.length - 1 ? 2 : 1,
        note: i === 0 ? '8 owns (-∞, +∞).' : `${f.node} is ${f.node < IV7[i - 1].node ? `left of ${IV7[i - 1].node}: high = ${IV7[i - 1].node}` : `right of ${IV7[i - 1].node}: low = ${IV7[i - 1].node}`}. It owns (${fmt(f.low)}, ${fmt(f.high)}).`,
        panels: [f.panel, vars({ node: f.node, low: fmt(f.low), high: fmt(f.high) })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the interval of 13',
      lines: ['Path to 13: right of 8, right of 10, left of 14.', 'Right raises `low`; left lowers `high`.'],
      panels: [IV13.at(-1).panel, vars({ node: 13, low: '?', high: '?' })],
      task: {
        type: 'choose',
        question: 'Which interval does 13 own?',
        options: [
          { text: `(${fmt(IV13.at(-1).low)}, ${fmt(IV13.at(-1).high)})`, why: '' },
          { text: '(10, +∞)', why: 'That is the interval of 14. Going left at 14 lowers high to 14.' },
          { text: '(8, 14)', why: 'Going right at 10 raised low from 8 to 10.' },
          { text: '(-∞, 14)', why: 'Going right at 8 and at 10 both raised low.' },
        ],
        answer: 0,
      },
      solved: 'Each step tightens one side: (-∞, +∞) → (8, +∞) → (10, +∞) → (10, 14).',
      then: IV13.map((f) => ({ say: 1, note: `${f.node} owns (${fmt(f.low)}, ${fmt(f.high)}).`, panels: [f.panel, vars({ node: f.node, low: fmt(f.low), high: fmt(f.high) })] })),
    },
    {
      kind: 'watch',
      title: 'In-order reads intervals left to right',
      lines: ['In-order: left subtree, node, right subtree.', 'That is: lower part of the interval, split point, upper part.', 'On a number line that is left to right: sorted.'],
      frames: inorderOutFrames(IN_A, 1).map((f, i, all) => ({ ...f, say: i === 0 ? 0 : i === all.length - 1 ? 2 : 1 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does 4 land?',
      lines: ['A different BST, same rule.', 'Count how many values are smaller than 4.'],
      panels: [treeP(IN_B, { 4: 'active' }), arr(IN_B_ORDER.map(() => '?'), { label: 'in-order output' })],
      task: { type: 'cell', question: 'Which cell of the in-order output holds 4?', panel: 1, answer: IN_B_ORDER.indexOf(4), hints: { 0: 'Only the smallest value comes first; 1, 2 and 3 are all smaller than 4.' } },
      solved: `Three values (1, 2, 3) are smaller, so 4 is printed 4th: ${IN_B_ORDER.join(' ')}.`,
      then: inorderOutFrames(IN_B, 0),
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Ignore the ordering: O(n)',
      lines: ['Treat the BST as a plain binary tree: check the node, then **both** sides.', 'Correct, but it can visit every node: O(n).'],
      frames: BRUTE14.map((v, k) => ({
        say: k === BRUTE14.length - 1 ? 1 : 0,
        note: v === 14 ? `14 found after ${BRUTE14.length} visits.` : `Visit ${v}: not 14, keep looking.`,
        panels: [treeP(T, (n) => (n.val === v ? (v === 14 ? 'done' : 'active') : BRUTE14.indexOf(n.val) > -1 && BRUTE14.indexOf(n.val) < k ? 'visited' : '')), vars({ target: 14, visits: k + 1 })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: use the ordering',
      lines: ['Now only **one** side can contain the target.', '`node = target < node.val ? node.left : node.right`'],
      panels: [treeP(T), vars({ target: 14 })],
      task: { type: 'number', question: 'How many nodes does the ordered version check to find 14?', options: [3, 4, 8, 9], answer: DESC14.length, hint: '14 > 8: the whole left side is skipped at once.' },
      solved: `${DESC14.length} checks instead of ${BRUTE14.length}: 8 → 10 → 14.`,
      then: DESC14,
    },
    {
      kind: 'turn',
      title: 'Your turn: why skipping is safe',
      lines: ['At 8 the target is 3, and 3 < 8.', 'The ordered version never looks at 10, 13 or 14.'],
      panels: [treeP(T, { 8: 'active', ...statesOf([[rightOf(T, 8), 'muted']]) }), vars({ target: 3 })],
      task: {
        type: 'choose',
        question: 'Why can it skip the right subtree of 8?',
        options: [
          { text: 'Every value there is > 8 > 3, so none can equal 3', why: '' },
          { text: 'The right subtree holds the smaller values', why: 'It is the other way round: right holds the larger values.' },
          { text: 'It is only safe if the tree is balanced', why: 'The argument uses only the ordering. Balance changes the speed, not the safety.' },
        ],
        answer: 0,
      },
      solved: 'Same argument as binary search: if target < arr[mid], everything from mid on is too big.',
    },
    {
      kind: 'turn',
      title: 'Your turn: dump, then index',
      lines: ['Another brute force: dump the in-order into an array.', 'Then kth smallest = `arr[k - 1]`. O(n) time, O(n) space.'],
      panels: [treeP(T7()), arr(T7_IN, { label: 'in-order array' })],
      task: { type: 'cell', question: 'k = 3. Which cell is the answer?', panel: 1, answer: 2, hints: { 3: 'That is arr[3], the 4th smallest. The index is k − 1.' } },
      solved: 'arr[2] = 4. A fine first answer; the optimised version drops the array or stops early.',
    },
  ],

  'optimized-descent': [
    {
      kind: 'watch',
      title: 'Insert 6',
      lines: ['If the tree is empty, the new node is the root.', 'Otherwise walk down: left if `val < node.val`, right otherwise.', 'When the side you want is `null`, attach the new node there.'],
      frames: insertFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: insert 10',
      lines: ['One comparison per level decides left or right.', 'New nodes are always leaves.'],
      panels: [treeP(INS10, {}, { layout: INS10_LAYOUT }), vars({ val: 10 })],
      task: { type: 'order', question: 'Tap the nodes 10 is compared with, in order.', items: ins10Path.map(String), hint: '10 is larger than every value on the way.' },
      solved: `${ins10Path.join(' → ')}, then 9.right is null: 10 becomes its right child.`,
      then: [{ say: 1, note: '10 attached as the right child of 9. Nothing else moved.', panels: [treeP(INS10_FINAL, { 10: 'done', ...statesOf([[ins10Path, 'visited']]) }, { path: [...ins10Path, 10], layout: INS10_LAYOUT })] }],
    },
    {
      kind: 'watch',
      title: 'Delete: leaf and one child',
      lines: ['**Leaf**: remove it — return `null` to the parent.', '**One child**: return that child to the parent.', 'The child already lies inside the deleted node interval: still ordered.'],
      frames: delFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: delete 5 (two children)',
      lines: ['5 has two children.', 'Find the **in-order successor**: the leftmost node of the right subtree.', 'Copy it up, then delete it below.'],
      panels: [del5Start],
      task: { type: 'order', question: 'Tap the nodes the successor search visits, in order.', items: DEL5_WALK.map(String), hint: 'Step right once, then only follow `.left`.' },
      solved: `The successor is ${DEL5_WALK.at(-1)}: the smallest value larger than 5. It has no left child, so its own delete is easy.`,
      then: del5Frames,
    },
    {
      kind: 'watch',
      title: 'LCA by descending',
      lines: ['Both values smaller → go left. Both larger → go right.', 'The first node where they split is the LCA.'],
      frames: LCA47.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: LCA of 10 and 13',
      lines: ['Same walk from the root.', 'A split also counts when one value **is** the node.'],
      panels: [treeP(T, { 10: 'visited', 13: 'visited' }), vars({ p: 10, q: 13 })],
      task: {
        type: 'choose',
        question: 'What is the LCA of 10 and 13?',
        options: [
          { text: String(LCA1013.lca), why: '' },
          { text: '14', why: 'The walk stops at 10, before it ever reaches 14.' },
          { text: '8', why: 'Both 10 and 13 are > 8: keep going right.' },
          { text: '13', why: '10 sits above 13, so 13 cannot be its ancestor.' },
        ],
        answer: 0,
      },
      solved: 'At 8 both are larger → right. At 10 one of them is the node: LCA = 10.',
      then: LCA1013.frames,
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Return the new subtree root',
      lines: ['Each call returns the new root of the subtree it was given.', 'The caller re-attaches it: `node.left = modify(node.left, key)`.', 'No "who is my parent?" bookkeeping.'],
      frames: tplFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the left spine',
      lines: ['In-order with a stack starts with `while (node) { stack.push(node); node = node.left; }`.', 'Then it pops the smallest unvisited node.'],
      panels: [treeP(TPL_IN), stk([])],
      task: { type: 'order', question: 'Tap the nodes in the order they are pushed first.', items: TPL_EV[0].pushed.map(String), hint: 'Start at the root and keep taking `.left`.' },
      solved: 'Push 5, 3, 2. Now 2 is on top: the smallest value.',
      then: stackFrames(TPL_IN, TPL_EV, [0, 1]),
    },
    {
      kind: 'turn',
      title: 'Your turn: bounds passed down',
      lines: ['`walk(node.left, low, node.val)` and `walk(node.right, node.val, high)`.', '4 is reached by going left at 5, then right at 3.'],
      panels: [treeP(T7(), { 5: 'visited', 3: 'visited', 4: 'active' }, { path: [5, 3, 4] }), vars({ node: 4, low: '?', high: '?' })],
      task: {
        type: 'choose',
        question: 'What are (low, high) when walk reaches 4?',
        options: [
          { text: '(3, 5)', why: '' },
          { text: '(-∞, 5)', why: 'Going right at 3 raised low to 3.' },
          { text: '(3, +∞)', why: 'Going left at 5 set high = 5, and going right keeps it.' },
          { text: '(-∞, 3)', why: 'That is the range of 2, the left child of 3.' },
        ],
        answer: 0,
      },
      solved: '(-∞, +∞) → left at 5 → (-∞, 5) → right at 3 → (3, 5). 4 is inside.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'searchBST: found or null',
      lines: ['The loop runs while `node && node.val !== val`.', 'It stops on a match **or** when it falls off the tree.', '`return node` covers both: the node or null.'],
      frames: descentFrames(T7(), 6, { say: 0 }).map((f, i, all) => (i === all.length - 1 ? { ...f, say: 2, note: f.note + ' node is null: return null.' } : f)),
    },
    {
      kind: 'turn',
      title: 'Your turn: delete a leaf',
      lines: ['`if (!root.left) return root.right;`', '`if (!root.right) return root.left;`', 'Then the successor loop for two children.'],
      panels: [treeP(T7(), { 5: 'visited', 8: 'visited', 9: 'bad' }, { path: [5, 8, 9] }), vars({ key: 9 })],
      task: {
        type: 'choose',
        question: 'deleteNode finds 9, a leaf. Which line handles it?',
        options: [
          { text: '`if (!root.left) return root.right;`', why: '' },
          { text: '`if (!root.right) return root.left;`', why: 'Never reached: the line above already returned, because root.left is null.' },
          { text: 'The successor loop', why: 'That only runs when the node has two children.' },
        ],
        answer: 0,
      },
      solved: 'root.right is null too, so it returns null: one line covers case 1 and case 2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: a node holding 0',
      lines: ['`if (!node)` checks the node, not its value.', 'Here a TreeNode has `val = 0`.'],
      panels: [treeP(fromInserts([3, 0, 5]), { 0: 'active' }), vars({ 'node.val': 0 })],
      task: {
        type: 'choose',
        question: 'Does `if (!node)` treat this node as missing?',
        options: [
          { text: 'No: a TreeNode is always truthy', why: '' },
          { text: 'Yes: 0 is falsy', why: 'The check tests the node object, not node.val. An object is truthy.' },
          { text: 'Only if you compare with ===', why: 'Truthiness is fine here; `===` against null works too.' },
        ],
        answer: 0,
      },
      solved: 'A TreeNode is always truthy, even when its value is 0.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'deleteNode([5,3,6,2,4,null,7], 3)',
      lines: ['Call 1 at 5 recurses left.', 'Call 2 finds 3: two children, successor 4.', 'Copy 4 up; call 3 deletes the duplicate 4 below.', 'Each call returns its subtree root; the caller re-attaches it.'],
      frames: dryFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: how deep?',
      lines: ['Delete 3 from this tree.', 'Count every deleteNode call, including the one that removes the successor.'],
      panels: [treeP(D, { 3: 'bad' }, { layout: D_LAYOUT })],
      task: { type: 'number', question: 'How many deleteNode calls are made in total?', options: [2, 3, 4, 5], answer: 3, hint: 'One at 5, one at 3, one to delete the successor 4.' },
      solved: 'Calls 1, 2, 3. One root-to-leaf path: O(h).',
    },
    {
      kind: 'turn',
      title: 'Your turn: with the predecessor',
      lines: ['The predecessor (max of the left subtree) works too.', 'For 3 that is 2.'],
      panels: [treeP(D, { 3: 'active', 2: 'done' }, { layout: D_LAYOUT })],
      task: {
        type: 'choose',
        question: 'Delete 3 using the predecessor. Which tree do you get?',
        options: [
          { text: `[${toLevel(D_PRED)}]`, why: '' },
          { text: '[5,4,6,2,null,null,7]', why: 'That is the successor result from the dry run.' },
          { text: '[5,2,6,4,null,null,7]', why: '4 > 2, so 4 must be the **right** child of 2.' },
        ],
        answer: 0,
      },
      solved: 'Also valid. That is why tests for delete use a checker, not an exact tree.',
      then: [{ say: 0, note: '2 moved up; 4 stays as its right child.', panels: [treeP(D_PRED, () => 'done')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: why the second delete is short',
      lines: ['The successor is the **leftmost** node of the right subtree.', 'Deleting it is the second, nested delete.'],
      panels: [treeP(D, { 3: 'active', 4: 'done' }, { layout: D_LAYOUT })],
      task: {
        type: 'choose',
        question: 'Why can deleting the successor never hit case 3 again?',
        options: [
          { text: 'It has no left child', why: '' },
          { text: 'It is always a leaf', why: 'It may have a right child: then it is case 2, a splice.' },
          { text: 'The right subtree is always small', why: 'Size does not matter; the shape of the successor does.' },
        ],
        answer: 0,
      },
      solved: 'Otherwise we would have kept going left. No left child → case 1 or case 2.',
    },
  ],

  'optimized-inorder': [
    {
      kind: 'watch',
      title: 'Kth smallest, k = 3: stop early',
      lines: ['The k-th node popped is the k-th smallest.', 'Stop after k pops: O(h + k).'],
      frames: KTH3.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: minimum difference',
      lines: ['In sorted order the closest pair is always **adjacent**.', 'Compare each node only with the previous one.'],
      panels: [treeP(MD), arr(MD_IN, { label: 'in-order' })],
      task: { type: 'number', question: 'What is the minimum absolute difference?', options: [1, 2, 3, 5], answer: MD_BEST, hint: 'Subtract each in-order value from the next.' },
      solved: `15 − 13 = ${MD_BEST}, a pair of neighbours in sorted order.`,
      then: mdFrames,
    },
    {
      kind: 'watch',
      title: 'Recover: two neighbours swapped',
      lines: ['Walk the in-order with `prev`; look for drops (`prev > cur`).', 'first = prev at the first drop; second = cur at the last drop.', 'Swap them back.'],
      frames: [{ say: 0, note: '4 and 5 were swapped. The tree looks fine locally.', panels: [treeP(REC, { 4: 'bad', 5: 'bad' }), arr(REC_IN, { label: 'in-order' })] }, ...recFrames],
    },
    {
      kind: 'watch',
      title: 'Iterator: one pop at a time',
      lines: ['Run the in-order loop **one pop at a time**.', 'Constructor: push the left spine of the root.', '`next()`: pop the top, push the left spine of its right child.'],
      frames: itFrames.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: amortized O(1)',
      lines: ['One `next()` may push several nodes.', 'Count over the **whole** iteration.'],
      panels: [treeP(T7()), vars({ 'next() calls': 7 })],
      task: { type: 'number', question: 'Over all 7 next() calls, how many pushes are there in total?', options: [3, 7, 14, 21], answer: itFrames.pushes, hint: 'Every node is pushed once and popped once.' },
      solved: 'n pushes for n calls → O(1) amortized. The stack holds at most one root-to-leaf path → O(h).',
    },
  ],

  'optimized-bounds': [
    {
      kind: 'watch',
      title: 'The parent-only check says yes',
      lines: ['Wrong check: left child < node < right child.', 'Every parent/child pair passes here…', '…but 12 sits in the **left** subtree of 10.'],
      frames: [
        ...badPairs.map(([c, op, p], k) => ({ say: 1, note: `${c} ${op} ${p}: pair ok.`, panels: [treeP(BAD, (n) => (n.val === c || n.val === p ? 'active' : badPairs.slice(0, k).some((q) => q[0] === n.val) ? 'done' : ''))] })),
        { say: 2, note: '12 > 10, yet it is left of 10. Not a valid BST.', panels: [treeP(BAD, { 12: 'bad', 10: 'active', 5: 'visited' }, { path: [10, 5, 12] })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: carry the interval',
      lines: ['Start with `(-∞, +∞)` at the root.', 'Left keeps `low`, sets `high = node.val`. Right sets `low = node.val`, keeps `high`.'],
      panels: [treeP(BAD)],
      task: {
        type: 'choose',
        question: 'With (low, high) bounds, which node fails?',
        options: [
          { text: '12', why: '' },
          { text: '2', why: '2 must be in (-∞, 5): it is.' },
          { text: '15', why: '15 must be in (10, +∞): it is.' },
          { text: '5', why: '5 must be in (-∞, 10): it is.' },
        ],
        answer: 0,
      },
      solved: '12 must lie in (5, 10). One O(1) check per node catches it.',
      then: validFrames,
    },
    {
      kind: 'watch',
      title: 'Range sum in [9, 20]: prune',
      lines: ['In range: add the value, try both sides.', 'Too small: the node and its whole left side are out — only go right. Too big: only go left.'],
      frames: [...RS.frames, { say: 1, note: `Sum = ${RS.sum}. Visited ${RS.visited} of 9 nodes; never touched ${RS.skipped.join(', ')}.`, panels: [RS.frames.at(-1).panels[0], vars({ L: 9, R: 20, sum: RS.sum })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: range [1, 5]',
      lines: ['Same pruning rules.', 'A node above R sends you left only.'],
      panels: [treeP(T), vars({ L: 1, R: 5 })],
      task: { type: 'number', question: 'How many nodes does the range sum visit?', options: [3, 5, 6, 9], answer: RS2.visited, hint: '8 > 5: the whole right side of 8 is skipped.' },
      solved: `Visits ${RS2.visited}; sum = ${RS2.sum}.`,
      then: RS2.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: trim a small node',
      lines: ['Trim to [5, 13]. `trimBST` reaches 3, and 3 < 5.', 'A node above `high` is handled the mirror way.', 'A node inside the range is kept; both children get trimmed.'],
      panels: [treeP(T, { 3: 'bad' }), vars({ low: 5, high: 13 })],
      task: {
        type: 'choose',
        question: 'What does `trimBST(3, 5, 13)` return?',
        options: [
          { text: 'trimBST(3.right, 5, 13)', why: '' },
          { text: 'trimBST(3.left, 5, 13)', why: 'The left side of 3 is even smaller than 3: all of it is < 5.' },
          { text: 'null', why: 'The right side (4, 6, 7) can still hold values ≥ 5.' },
        ],
        answer: 0,
      },
      solved: 'Drop 3 and its left side, return the trimmed right side in its place.',
      then: trimFrames,
    },
  ],

  'optimized-build': [
    {
      kind: 'watch',
      title: 'Build from the middle',
      lines: ['The middle element is the root: half the values go left, half go right.', 'Recurse on each half with index bounds `[lo, hi]` — no slicing.'],
      frames: [...buildFrames(B7, B7RUN, [0, 1]), { say: 1, note: `Done: ${B7.length} values, ${B7RUN.levels} levels — the minimum.`, panels: [arr(B7, { label: 'nums', highlights: hl(B7.length, () => 'done') }), treeP(B7RUN.root, () => 'done')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: an even-length range',
      lines: ['`mid = (lo + hi) >> 1` is the **left-middle**.', '`(lo + hi + 1) >> 1` would be the right-middle.'],
      panels: [arr(B6, { label: 'nums', range: [0, B6.length - 1] })],
      task: { type: 'cell', question: 'With `(lo + hi) >> 1`, which cell becomes the root?', answer: (0 + B6.length - 1) >> 1, hints: { 3: 'That is the right-middle, (0 + 5 + 1) >> 1. Also valid, but not what this code picks.' } },
      solved: `(0 + 5) >> 1 = 2 → ${B6[2]} is the root. Both middles give a valid balanced BST.`,
      then: [...buildFrames(B6, B6RUN, [0, 0]), { say: 0, note: `${B6RUN.levels} levels for ${B6.length} values.`, panels: [arr(B6, { label: 'nums', highlights: hl(B6.length, () => 'done') }), treeP(B6RUN.root, () => 'done')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: empty ranges',
      lines: ['`if (lo > hi) return null;`', 'Every missing child is one call that returns null.'],
      panels: [treeP(B7RUN.root), arr(B7, { label: 'nums' })],
      task: { type: 'number', question: `Building from ${B7.length} values, how many build calls return null?`, options: [0, 7, 8, 14], answer: B7RUN.nulls, hint: 'Each of the 4 leaves asks for two children.' },
      solved: `${B7RUN.nulls} null calls (2 per leaf). Every node is still created once: O(n) time.`,
    },
  ],

  'optimized-bottom-up': [
    {
      kind: 'turn',
      title: 'Your turn: guess the best BST',
      lines: ['This is a plain binary tree.', 'Find the subtree that is a BST with the largest sum.'],
      panels: [treeP(P, {}, { label: 'binary tree' })],
      task: { type: 'number', question: 'What is the largest sum of a BST subtree?', options: [6, 9, 11, 21], answer: buRun.best, hint: 'Check 4 with its children 2 and 5.' },
      solved: `The subtree at 4 (2, 4, 5) is a BST with sum ${buRun.best}. The whole tree is not a BST.`,
    },
    {
      kind: 'watch',
      title: 'Children report, parents decide',
      lines: ['Post-order: both children report before the node.', 'Each call returns `{ isBST, min, max, sum }`.', 'A BST here iff both children are BSTs **and** `left.max < node.val < right.min`.', 'A failing node returns poison, so every ancestor fails too.'],
      frames: buFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: validate from every node',
      lines: ['The slow way runs validate from every node.', 'A node at depth d is then visited d + 1 times.'],
      panels: [treeP(CHAIN4, {}, { label: 'a chain of 4' })],
      task: { type: 'number', question: 'How many node visits in total on this chain?', options: [4, 8, 10, 16], answer: 1 + 2 + 3 + 4, hint: 'Depths 0, 1, 2, 3 → 1 + 2 + 3 + 4.' },
      solved: '10 visits: O(n²) on a chain. Bottom-up visits each node once: 4.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Removing a node with two children',
      lines: ['Mistake: just remove 3, which has two children.', 'Its two subtrees lose their parent.', 'Fix: copy the successor up, then delete it below.'],
      frames: (() => {
        const fixed = deleteNode(clone(MIS), 3);
        return [
          { say: 0, note: 'Delete 3 by just cutting it out…', panels: [treeP(MIS, { 3: 'bad', 2: 'visited', 4: 'visited' }, { layout: MIS_LAYOUT })] },
          { say: 1, note: '…and 2 and 4 hang off nothing. They are lost.', panels: [treeP(MIS, { 3: 'muted', 2: 'bad', 4: 'bad' }, { layout: MIS_LAYOUT })] },
          { say: 2, note: 'Successor of 3 = 4. Copy 4 up, delete the leaf 4: 2 stays attached.', panels: [treeP(fixed, { 4: 'done', 2: 'done' }, { layout: MIS_LAYOUT }), arr(valsOf(fixed), { label: 'in-order', showIndices: false })] },
        ];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: "it is O(log n)"',
      lines: ['Plain BST operations are O(h).', 'This tree is skewed.'],
      panels: [treeP(SKEW), vars({ target: 4 })],
      task: { type: 'number', question: 'How many nodes does a search for 4 look at?', options: [2, 3, 4], answer: 4, hint: 'Every value is larger than the one above it.' },
      solved: 'All 4: h can be n. Say "O(h), O(log n) **if balanced**".',
    },
    {
      kind: 'turn',
      title: 'Your turn: no need for the whole array',
      lines: ['Kth smallest with k = 2.', 'Early stop: count pops instead of building the full in-order.'],
      panels: [treeP(T7()), stk([]), vars({ k: 2 })],
      task: { type: 'number', question: 'How many pops until the answer?', options: [2, 3, 7], answer: KTH2.pops, hint: 'Each pop gives the next smallest value.' },
      solved: `${KTH2.pops} pops give ${KTH2.answer}. The full array would touch all 7 nodes.`,
      then: KTH2.frames,
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Several shapes are valid',
      lines: ['For delete, tell the interviewer which shape you produce.', 'Successor and predecessor give different, valid trees.'],
      frames: [
        { say: 0, note: 'Delete 5, the root.', panels: [treeP(delVariants.orig, { 5: 'bad' }, { layout: delVariants.lay })] },
        { say: 1, note: `Successor: ${delVariants.succ.val} becomes the root.`, panels: [treeP(delVariants.succ, { [delVariants.succ.val]: 'done' }, { layout: delVariants.lay, label: 'successor' })] },
        { say: 1, note: `Predecessor: ${delVariants.pred.val} becomes the root. Also a valid BST.`, panels: [treeP(delVariants.pred, { [delVariants.pred.val]: 'done' }, { layout: delVariants.lay, label: 'predecessor' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the follow-up',
      lines: ['"Kth smallest — but the tree is modified often?"', 'Be ready for it.'],
      panels: [treeP(T7(), {}, { label: 'inserts and deletes keep coming' }), vars({ k: '?' })],
      task: {
        type: 'choose',
        question: 'What do you answer?',
        options: [
          { text: 'Store each node subtree size, then descend in O(h)', why: '' },
          { text: 'Morris traversal', why: 'That answers a different follow-up: in-order in O(1) space.' },
          { text: 'Cache the whole in-order array', why: 'Every insert or delete would make the cache stale.' },
        ],
        answer: 0,
      },
      solved: 'Augment each node with its subtree size, then descend in O(h).',
    },
    {
      kind: 'turn',
      title: 'Your turn: say the complexity',
      lines: ['Two BSTs, two shapes.', 'Your search code is the same for both.'],
      panels: [treeP(T7(), {}, { label: 'balanced' }), treeP(fromInserts([2, 3, 4, 5]), {}, { label: 'skewed' })],
      task: {
        type: 'choose',
        question: 'How do you state the search time?',
        options: [
          { text: '"O(h): O(log n) if balanced, O(n) if skewed"', why: '' },
          { text: '"O(log n)"', why: 'True only if balanced; on the skewed tree it is O(n).' },
          { text: '"O(n)"', why: 'That is only the skewed worst case; it hides the balanced O(log n).' },
        ],
        answer: 0,
      },
      solved: 'Always qualify: O(h), which depends on the shape.',
    },
  ],
};
