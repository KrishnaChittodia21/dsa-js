// Shorts for Trees (M9). Format: src/content/shortSchema.js. Facts come only from topics/trees/topic.js.
// Every visit order, stack / queue content, passed-down value, returned value and rebuilt tree below comes from
// running the pattern's template on its "e.g." tree.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const seq = (xs) => xs.join(', ');
const show = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/trees.js: ${msg}`);
};

// ---------- trees: build from a LeetCode level-order array; ids in level order, x = inorder position ----------
// nulls: also add a '∅' node for every empty child slot (to draw null children / null markers)
function build(level, { nulls = false } = {}) {
  const ns = [];
  const mk = (val, depth, parent) => {
    const n = { id: ns.length, val, left: null, right: null, depth, parent };
    ns.push(n);
    return n;
  };
  const q = [mk(level[0], 0, null)];
  let i = 1;
  let h = 0;
  while (h < q.length && i < level.length) {
    const p = q[h++];
    for (const side of ['left', 'right']) {
      if (i >= level.length) break;
      const v = level[i++];
      if (v !== null) {
        const c = mk(v, p.depth + 1, p.id);
        p[side] = c.id;
        q.push(c);
      }
    }
  }
  if (nulls)
    for (const n of ns.slice())
      for (const side of ['left', 'right'])
        if (n[side] === null) {
          const c = mk('∅', n.depth + 1, n.id);
          c.nul = true;
          n[side] = c.id;
        }
  let k = 0;
  const ino = (id) => {
    if (id === null) return;
    ino(ns[id].left);
    ns[id].x = k++;
    ino(ns[id].right);
  };
  ino(0);
  return ns;
}
// o.st: id → node state, o.el: child id → label on the edge into that child, o.es: child id → edge state
const draw = (ns, o = {}) => ({
  kind: 'nodes',
  ...(o.label ? { label: o.label } : {}),
  nodes: ns.map((n) => {
    const state = o.st?.[n.id] ?? (n.nul ? 'muted' : undefined);
    return { id: n.id, label: String(n.val), x: n.x, y: n.depth, ...(state ? { state } : {}) };
  }),
  edges: ns.filter((n) => n.parent !== null).map((n) => ({ from: n.parent, to: n.id, ...(o.el?.[n.id] !== undefined ? { label: String(o.el[n.id]) } : {}), ...(o.es?.[n.id] ? { state: o.es[n.id] } : {}) })),
});
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const allIds = (ns) => ns.map((n) => n.id);
const idOf = (ns, v) => ns.find((n) => n.val === v && !n.nul).id;
const kids = (ns, id) => [ns[id].left, ns[id].right].filter((c) => c !== null);
const order = (ns, kind) => {
  const out = [];
  const go = (id) => {
    if (id === null) return;
    if (kind === 'pre') out.push(id);
    go(ns[id].left);
    if (kind === 'in') out.push(id);
    go(ns[id].right);
    if (kind === 'post') out.push(id);
  };
  go(0);
  return out;
};
const vals = (ns, ids) => ids.map((id) => ns[id].val);
const ancestors = (ns, id) => {
  const out = [];
  for (let a = ns[id].parent; a !== null; a = ns[a].parent) out.push(a);
  return out;
};

// ---------- DFS traversal: e.g. [5,3,8,1,4,null,9] ----------
const DT = build([5, 3, 8, 1, 4, null, 9]);
const DTN = build([5, 3, 8, 1, 4, null, 9], { nulls: true });
const D_PRE = order(DT, 'pre');
const D_IN = order(DT, 'in');
const D_POST = order(DT, 'post');
check(seq(vals(DT, D_PRE)) === '5, 3, 1, 4, 8, 9' && seq(vals(DT, D_POST)) === '1, 4, 3, 9, 8, 5', 'dfs orders');
const D_NULLS = DTN.filter((n) => n.nul).length;
check(D_NULLS === DT.length + 1, 'n + 1 null children');
const orderFrame = (ids, name, say, where) => {
  const at = ids.indexOf(0);
  return {
    say,
    note: `${name}: ${seq(vals(DT, ids))}. The root 5 comes ${where}.`,
    panels: [draw(DT, { st: { 0: 'active' } }), arr(vals(DT, ids), { label: name.toLowerCase(), highlights: { [at]: 'active' } })],
  };
};
// iterative preorder, one frame per pop
const D_ITER = [];
{
  const stack = [0];
  const out = [];
  while (stack.length) {
    const id = stack.pop();
    out.push(id);
    const pushed = [];
    if (DT[id].right !== null) stack.push(DT[id].right), pushed.push(DT[id].right);
    if (DT[id].left !== null) stack.push(DT[id].left), pushed.push(DT[id].left);
    D_ITER.push({ id, out: out.slice(), stack: stack.slice(), pushed });
  }
}
check(seq(vals(DT, D_ITER.at(-1).out)) === seq(vals(DT, D_PRE)), 'iterative preorder');
const dIterFrames = D_ITER.map((e, k) => ({
  say: e.pushed.length ? 1 : 0,
  note: `Pop ${DT[e.id].val}, write it.${e.pushed.length === 2 ? ` Push right ${DT[e.pushed[0]].val}, then left ${DT[e.pushed[1]].val}.` : e.pushed.length === 1 ? ` Push its child ${DT[e.pushed[0]].val}.` : ' A leaf: nothing to push.'}${k === D_ITER.length - 1 ? ' Stack empty: done.' : ''}`,
  panels: [
    draw(DT, { st: { ...states(e.out, 'done'), ...states(e.stack, 'visited'), [e.id]: 'active' } }),
    stk(vals(DT, e.stack)),
    arr(vals(DT, e.out), { label: 'out', highlights: { [e.out.length - 1]: 'active' } }),
  ],
}));
// the turn: push left before right
const D_SWAP = [];
{
  const stack = [0];
  while (stack.length) {
    const id = stack.pop();
    D_SWAP.push(DT[id].val);
    if (DT[id].left !== null) stack.push(DT[id].left);
    if (DT[id].right !== null) stack.push(DT[id].right);
  }
}
check(seq(D_SWAP.slice().reverse()) === seq(vals(DT, D_POST)), 'swapped preorder reversed is postorder');
const D_LEVEL = (() => {
  const out = [0];
  for (let h = 0; h < out.length; h++) out.push(...kids(DT, out[h]));
  return vals(DT, out);
})();

// ---------- level order: e.g. [5,1,8,7,null,2,4] ----------
const LT = build([5, 1, 8, 7, null, 2, 4]);
const L_DFS = vals(LT, order(LT, 'pre'));
const L_RUN = []; // one entry per level: queue (ids) after the level, head at its start, size
{
  const queue = [0];
  let head = 0;
  while (head < queue.length) {
    const start = head;
    const size = queue.length - head;
    const level = [];
    for (let i = 0; i < size; i++) {
      const id = queue[head++];
      level.push(id);
      queue.push(...kids(LT, id));
    }
    L_RUN.push({ start, size, level, queue: queue.slice() });
  }
}
const L_LEVELS = L_RUN.map((r) => vals(LT, r.level));
check(JSON.stringify(L_LEVELS) === '[[5],[1,8],[7,2,4]]', 'levels');
const L_ALL = L_RUN.at(-1).queue;
const lFrames = L_RUN.map((r, k) => {
  const pushed = r.queue.slice(r.start + r.size);
  return {
    say: k === 0 ? 0 : 1,
    note: `head = ${r.start}, size = ${r.size}. Dequeue ${seq(vals(LT, r.level))}${pushed.length ? `, push ${seq(vals(LT, pushed))}` : ': no children'}. Level ${show(vals(LT, r.level))}.`,
    panels: [
      draw(LT, { st: { ...states(L_RUN.slice(0, k).flatMap((x) => x.level), 'done'), ...states(r.level, 'active'), ...states(pushed, 'visited') } }),
      arr(vals(LT, r.queue), { label: 'queue', pointers: [ptr(r.start, 'head')], highlights: hl(r.queue.length, (x) => (x < r.start ? 'done' : x < r.start + r.size ? 'window' : 'active')) }),
      vars({ size: r.size, levels: JSON.stringify(L_LEVELS.slice(0, k + 1)) }),
    ],
  };
});
// the trap: the level bound read live, `i < queue.length - head`
const L_LIVE = (() => {
  const queue = [0];
  let head = 0;
  const level = [];
  for (let i = 0; i < queue.length - head; i++) {
    const id = queue[head++];
    level.push(id);
    queue.push(...kids(LT, id));
  }
  return vals(LT, level);
})();
check(L_LIVE.length > 1, 'live bound absorbs the next level');
// the turn: right side view of e.g. [1,2,3,null,5,null,null,6]
const RT = build([1, 2, 3, null, 5, null, null, 6]);
const R_LEVELS = (() => {
  const out = [];
  let level = [0];
  while (level.length) {
    out.push(vals(RT, level));
    level = level.flatMap((id) => kids(RT, id));
  }
  return out;
})();
const R_VIEW = R_LEVELS.map((l) => l.at(-1));
const R_LEFT = R_LEVELS.map((l) => l[0]);
const R_RIGHTS = (() => {
  const out = [];
  for (let id = 0; id !== null; id = RT[id].right) out.push(RT[id].val);
  return out;
})();
check(seq(R_VIEW) === '1, 3, 5, 6' && seq(R_RIGHTS) === '1, 3', 'right side view');

// ---------- top-down: count good nodes on e.g. [4,6,2,5,7,null,3] ----------
const GT = build([4, 6, 2, 5, 7, null, 3]);
const G_RUN = [];
const G_IN = {}; // id → maxSoFar it received
{
  let count = 0;
  const dfs = (id, maxSoFar) => {
    if (id === null) return;
    G_IN[id] = maxSoFar;
    const good = GT[id].val >= maxSoFar;
    if (good) count++;
    const next = Math.max(maxSoFar, GT[id].val);
    G_RUN.push({ id, maxSoFar, good, next, count });
    dfs(GT[id].left, next);
    dfs(GT[id].right, next);
  };
  dfs(0, -Infinity);
}
const G_COUNT = G_RUN.at(-1).count;
check(G_COUNT === 3, 'good nodes');
const inf = (v) => (v === -Infinity ? '−∞' : String(v));
const gFrames = G_RUN.map((e, k) => {
  const seen = G_RUN.slice(0, k + 1);
  return {
    say: 0,
    note:
      k === 0
        ? `dfs(4, −∞): 4 ≥ −∞, good. count = 1. Pass max(−∞, 4) = 4 down to both children.`
        : `${GT[e.id].val} gets maxSoFar ${inf(e.maxSoFar)}: ${e.good ? `${GT[e.id].val} ≥ ${inf(e.maxSoFar)}, good. count = ${e.count}` : `${GT[e.id].val} < ${inf(e.maxSoFar)}, not good`}.${kids(GT, e.id).length ? ` Pass ${e.next} down.` : ''}`,
    panels: [
      draw(GT, {
        st: { ...Object.fromEntries(seen.slice(0, -1).map((x) => [x.id, x.good ? 'done' : 'bad'])), [e.id]: 'active' },
        el: Object.fromEntries(seen.filter((x) => x.id !== 0).map((x) => [x.id, inf(x.maxSoFar)])),
      }),
      vars({ node: GT[e.id].val, maxSoFar: inf(e.maxSoFar), good: e.good ? 'yes' : 'no', count: e.count }),
    ],
  };
});
const G_ASK = idOf(GT, 5);
// the turn: a path 2 → 9 → 3 → 8
const GP = build([2, 9, null, 3, null, 8]);
const GP_8 = idOf(GP, 8);
const GP_MAX = Math.max(...vals(GP, ancestors(GP, GP_8)));
check(GP_MAX === 9, 'turn maxSoFar');

// ---------- bottom-up: diameter on e.g. [1,2,null,4,5,6,null,null,7] ----------
const BT = build([1, 2, null, 4, 5, 6, null, null, 7]);
const B_RUN = [];
let B_BEST = 0;
{
  const height = (id) => {
    if (id === null) return 0;
    const L = height(BT[id].left);
    const R = height(BT[id].right);
    B_BEST = Math.max(B_BEST, L + R);
    const ret = 1 + Math.max(L, R);
    B_RUN.push({ id, L, R, best: B_BEST, ret });
    return ret;
  };
  height(0);
}
check(B_BEST === 4 && B_RUN.at(-1).L + B_RUN.at(-1).R === 3, 'diameter bends below the root');
// the lesson's brute force: count the nodes height() walks
let B_BRUTE = 0;
{
  const height = (id) => (id === null ? 0 : (B_BRUTE++, 1 + Math.max(height(BT[id].left), height(BT[id].right))));
  const diam = (id) => (id === null ? 0 : Math.max(height(BT[id].left) + height(BT[id].right), diam(BT[id].left), diam(BT[id].right)));
  check(diam(0) === B_BEST, 'brute force agrees');
}
const bFrames = B_RUN.map((e, k) => {
  const done = B_RUN.slice(0, k + 1);
  const isRoot = e.id === 0;
  return {
    say: 1,
    note: `${BT[e.id].val}: L = ${e.L}, R = ${e.R}. Candidate L + R = ${e.L + e.R}, best = ${e.best}. Return 1 + max = ${e.ret}.${isRoot ? ' The path bends at 2, not the root.' : ''}`,
    panels: [
      draw(BT, { st: { ...states(done.slice(0, -1).map((x) => x.id), 'done'), [e.id]: 'active' }, el: Object.fromEntries(done.filter((x) => x.id !== 0).map((x) => [x.id, x.ret])) }),
      vars({ L: e.L, R: e.R, 'L + R': e.L + e.R, best: e.best, returns: e.ret }),
    ],
  };
});
// the turn: a node whose children return 3 and 2
const BL = 3;
const BR = 2;

// ---------- path backtracking: path sum II on e.g. [5,2,4,3,null,1,2], target 10 ----------
const PT = build([5, 2, 4, 3, null, 1, 2]);
const P_TARGET = 10;
const P_EV = []; // a snapshot at every leaf and after the left subtree of the root
const P_RES = [];
const P_LIVE = []; // the bug: push the live path
{
  const path = [];
  const ids = [];
  const dfs = (id, remaining) => {
    if (id === null) return;
    path.push(PT[id].val);
    ids.push(id);
    remaining -= PT[id].val;
    const leaf = PT[id].left === null && PT[id].right === null;
    if (leaf && remaining === 0) P_RES.push([...path]), P_LIVE.push(path);
    if (leaf) P_EV.push({ kind: 'leaf', id, path: path.slice(), ids: ids.slice(), remaining, res: P_RES.map((r) => r.slice()) });
    dfs(PT[id].left, remaining);
    dfs(PT[id].right, remaining);
    path.pop();
    ids.pop();
    if (id === PT[0].left) P_EV.push({ kind: 'back', id: 0, path: path.slice(), ids: ids.slice(), remaining: P_TARGET - PT[0].val, res: P_RES.map((r) => r.slice()) });
  };
  dfs(0, P_TARGET);
  P_EV.push({ kind: 'end', id: null, path: path.slice(), ids: [], remaining: P_TARGET, res: P_RES.map((r) => r.slice()) });
}
check(JSON.stringify(P_RES) === '[[5,2,3],[5,4,1]]' && JSON.stringify(P_LIVE) === '[[],[]]', 'path sum');
const pNote = (e) => {
  if (e.kind === 'back') return 'Back up: 3 and then 2 are popped on exit. path = [5], ready for the right side.';
  if (e.kind === 'end') return `Every push was undone: path = []. result = ${JSON.stringify(e.res)}.`;
  const v = PT[e.id].val;
  return e.remaining === 0 ? `Down to leaf ${v}: path ${show(e.path)}, remaining 0. Record a **copy**.` : `Pop 1, push ${v}: path ${show(e.path)}, remaining ${e.remaining} at a leaf. Not recorded.`;
};
const pFrames = P_EV.map((e) => ({
  say: e.kind === 'leaf' ? (e.remaining === 0 ? 1 : 0) : 2,
  note: pNote(e),
  panels: [
    draw(PT, { st: { ...states(e.ids, 'visited'), ...(e.id !== null && e.kind === 'leaf' ? { [e.id]: e.remaining === 0 ? 'done' : 'bad' } : {}) } }),
    stk(e.path, 'path'),
    vars({ remaining: e.remaining, result: JSON.stringify(e.res) }),
  ],
}));

// ---------- LCA on e.g. [1,2,3,4,5,6,7,null,null,8,9], p = 8, q = 4 ----------
const AT = build([1, 2, 3, 4, 5, 6, 7, null, null, 8, 9]);
const lcaRun = (ns, p, q) => {
  const ret = []; // { id, v } in the order calls on real nodes return
  const go = (id) => {
    if (id === null) return null;
    if (id === p || id === q) return ret.push({ id, v: id }), id;
    const left = go(ns[id].left);
    const right = go(ns[id].right);
    const v = left !== null && right !== null ? id : left ?? right;
    ret.push({ id, v });
    return v;
  };
  return { ans: go(0), ret };
};
const A_P = idOf(AT, 8);
const A_Q = idOf(AT, 4);
const A_RUN = lcaRun(AT, A_P, A_Q);
check(AT[A_RUN.ans].val === 2, 'lca');
const nv = (v) => (v === null ? '∅' : AT[v].val);
const aFrame = (upto, say, note) => {
  const done = A_RUN.ret.slice(0, upto + 1);
  const cur = done.at(-1);
  return {
    say,
    note,
    panels: [
      draw(AT, { st: { ...states(done.map((r) => r.id), 'done'), [A_P]: 'visited', [A_Q]: 'visited', [cur.id]: 'active' }, el: Object.fromEntries(done.filter((r) => r.id !== 0).map((r) => [r.id, nv(r.v)])) }),
      vars({ p: 8, q: 4, [`returns at ${AT[cur.id].val}`]: nv(cur.v) }),
    ],
  };
};
const aAt = (v) => A_RUN.ret.findIndex((r) => AT[r.id].val === v);
const depthOf = (v) => AT[idOf(AT, v)].depth;
const A_DIST = depthOf(8) + depthOf(4) - 2 * depthOf(2);
const A_TURN = lcaRun(AT, idOf(AT, 5), idOf(AT, 9));
check(AT[A_TURN.ans].val === 5, 'turn lca');

// ---------- construction: preorder + inorder of e.g. [1,2,3,4,null,5,6] ----------
const CT = build([1, 2, 3, 4, null, 5, 6]);
const C_PRE = vals(CT, order(CT, 'pre'));
const C_IN = vals(CT, order(CT, 'in'));
check(seq(C_PRE) === '1, 2, 4, 3, 5, 6' && seq(C_IN) === '4, 2, 1, 5, 3, 6', 'construction orders');
const buildTree = (pre, ino, onNode = () => {}) => {
  const idx = new Map(ino.map((v, i) => [v, i]));
  let p = 0;
  const b = (lo, hi) => {
    if (lo > hi) return null;
    const v = pre[p++];
    const mid = idx.get(v);
    onNode({ v, p: p - 1, lo, hi, mid });
    const node = { v };
    node.left = b(lo, mid - 1);
    node.right = b(mid + 1, hi);
    return node;
  };
  return b(0, ino.length - 1);
};
const C_EV = [];
buildTree(C_PRE, C_IN, (e) => C_EV.push(e));
const cFrames = C_EV.map((e, k) => {
  const made = C_EV.slice(0, k + 1).map((x) => idOf(CT, x.v));
  const L = e.mid - e.lo;
  const R = e.hi - e.mid;
  return {
    say: k === 0 ? 0 : 1,
    note: `preorder[${e.p}] = ${e.v}, root of inorder[${e.lo}..${e.hi}]. Map: ${e.v} → ${e.mid}. Left gets ${L}, right ${R}.`,
    panels: [
      arr(C_PRE, { label: 'preorder', pointers: [ptr(e.p, 'p')], highlights: hl(C_PRE.length, (x) => (x === e.p ? 'active' : x < e.p ? 'done' : '')) }),
      arr(C_IN, { label: 'inorder', pointers: [ptr(e.mid, 'mid', 'b')], highlights: hl(C_IN.length, (x) => (x === e.mid ? 'active' : x >= e.lo && x <= e.hi ? 'window' : 'muted')) }),
      draw(CT, { st: { ...states(allIds(CT), 'hidden'), ...states(made, 'done'), [made.at(-1)]: 'active' } }),
    ],
  };
});
const CA = build([1, 2, 3]);
const CB = build([1, 2, null, 3]);
check(seq(vals(CA, order(CA, 'pre'))) === seq(vals(CB, order(CB, 'pre'))), 'same preorder, two shapes');
// the turn
const CT_PRE = [7, 3, 1, 5, 9, 8];
const CT_IN = [1, 3, 5, 7, 8, 9];
const CT_ROOT = buildTree(CT_PRE, CT_IN);
check(CT_ROOT.right.v === 9 && CT_ROOT.left.v === 3, 'turn construction');

// ---------- serialization: e.g. [4,null,2,6] ----------
const ST = build([4, null, 2, 6], { nulls: true });
const S_IDS = order(ST, 'pre');
const S_TOK = S_IDS.map((id) => (ST[id].nul ? '#' : String(ST[id].val)));
check(S_TOK.join(',') === '4,#,2,6,#,#,#', 'serialize');
// groups of tokens shown in one frame: [from, to]
const sFrame = ([a, b], say, note) => ({
  say,
  note,
  panels: [draw(ST, { st: { ...states(S_IDS.slice(0, a).filter((id) => !ST[id].nul), 'done'), ...states(S_IDS.slice(a, b + 1), 'active') } }), arr(S_TOK.slice(0, b + 1), { label: 'out', highlights: hl(b + 1, (x) => (x >= a ? 'active' : 'done')) })],
});
// deserialize: the same preorder reads one token per call; the shape appears in token order
const dFrame = ([a, b], say, note) => ({
  say,
  note,
  panels: [
    arr(S_TOK, { label: 'tokens', pointers: [ptr(b, 'i')], highlights: hl(S_TOK.length, (x) => (x > b ? '' : x >= a ? 'active' : 'done')) }),
    draw(ST, { st: { ...states(allIds(ST), 'hidden'), ...states(S_IDS.slice(0, b + 1), ''), ...states(S_IDS.slice(0, b + 1).filter((id) => ST[id].nul), 'muted'), ...states(S_IDS.slice(a, b + 1).filter((id) => !ST[id].nul), 'active') } }),
  ],
});
const deser = (tokens) => {
  let i = 0;
  const b = () => {
    const t = tokens[i++];
    if (t === '#') return null;
    return { v: Number(t), left: b(), right: b() };
  };
  return b();
};
const S_BACK = deser(S_TOK);
check(S_BACK.v === 4 && S_BACK.left === null && S_BACK.right.v === 2 && S_BACK.right.left.v === 6, 'round trip');
const SV = build([4, 2, 6]);
check(seq(vals(SV, order(SV, 'pre'))) === '4, 2, 6', 'values-only preorder');
// coordinates: root (0, 0), left (row + 1, col − 1), right (row + 1, col + 1)
const S_COORD = [];
{
  const go = (id, row, col) => {
    if (id === null || ST[id].nul) return;
    S_COORD.push([col, row, ST[id].val]);
    go(ST[id].left, row + 1, col - 1);
    go(ST[id].right, row + 1, col + 1);
  };
  go(0, 0, 0);
  S_COORD.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}
const S_TURN = '3,1,#,#,2,5,#,#,#'.split(',');
const S_TT = deser(S_TURN);
check(S_TT.left.v === 1 && S_TT.right.v === 2 && S_TT.right.left.v === 5 && S_TT.right.right === null, 'turn deserialize');

export default [
  {
    id: 'tree-dfs-traversal',
    title: 'One walk, three moments: when you write the node down',
    steps: [
      {
        kind: 'watch',
        title: 'A node plus two smaller trees',
        lines: ['A tree is **a node plus two smaller trees**, so `dfs(node)` calls itself on `node.left` and `node.right`.', '`if (node === null) return;`: the base case, the empty tree.'],
        frames: [
          {
            say: 0,
            note: 'e.g. root 5, a left tree (3, 1, 4) and a right tree (8, 9). Each child is the root of its own subtree.',
            panels: [draw(DT, { st: { 0: 'active', ...states([1, 3, 4], 'visited'), ...states([2, 5], 'done') } })],
          },
          {
            say: 1,
            note: `${DT.length} nodes, ${D_NULLS} null children: more than half of all calls hit the base case. Each node is visited once: O(n).`,
            panels: [draw(DTN), vars({ nodes: DT.length, 'null children': D_NULLS })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Same walk, three moments',
        lines: ['Preorder: process the node **before** `dfs(node.left)`.', 'Inorder: **between** the two calls.', 'Postorder: **after** `dfs(node.right)`.'],
        frames: [orderFrame(D_PRE, 'Preorder', 0, 'first'), orderFrame(D_IN, 'Inorder', 1, 'after its whole left subtree'), orderFrame(D_POST, 'Postorder', 2, 'last')],
      },
      {
        kind: 'watch',
        title: 'Without recursion: an explicit stack',
        lines: ['`node = stack.pop()`, write it.', 'Push **right first, then left**: LIFO pops left first.'],
        frames: dIterFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"traverse"**, **"visit every node"**, **"invert / mirror"**, **"same / identical tree"**, **"symmetric"**, **"preorder / inorder / postorder"**.'],
        frames: [
          {
            say: 0,
            note: 'Recursion uses O(h) call stack. JS fits about 10,000 frames: a 100,000-node chain needs the explicit stack.',
            panels: [table(['recursive', 'explicit stack'], ['memory', 'deep chain in JS'], [['O(h) call stack', 'RangeError'], ['O(h) array', 'fine']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: swap the two pushes',
        lines: ['Same tree, same loop, but you push **left first, then right**.'],
        panels: [draw(DT), stk([5])],
        task: {
          type: 'choose',
          question: 'What does the loop write?',
          options: [
            { text: seq(D_SWAP) },
            { text: seq(vals(DT, D_PRE)), why: 'That is real preorder. The stack pops the last push first, so pushing left first makes right come out first.' },
            { text: seq(D_LEVEL), why: 'That is level order. Row by row needs a FIFO queue; a stack always goes deep first.' },
            { text: seq(vals(DT, D_POST)), why: 'That is postorder. You get it by reversing this output: "node, right, left" reversed is "left, right, node".' },
          ],
          answer: 0,
        },
        solved: `Node → right → left: ${seq(D_SWAP)}. A mirrored order, not preorder. Reversed, it is the postorder.`,
      },
    ],
  },

  {
    id: 'tree-level-order',
    title: 'Snapshot the queue size: one level per round',
    steps: [
      {
        kind: 'watch',
        title: 'DFS mixes the levels',
        lines: ['"Return the values **level by level**."', 'DFS dives deep before it goes wide: it does not know "all nodes at depth d".'],
        frames: [
          {
            say: 1,
            note: `e.g. DFS writes ${seq(L_DFS)}: 7 (depth 2) comes before 8 (depth 1).`,
            panels: [draw(LT, { st: { [idOf(LT, 7)]: 'bad', [idOf(LT, 8)]: 'active' } }), arr(L_DFS, { label: 'DFS order', highlights: { [L_DFS.indexOf(7)]: 'bad', [L_DFS.indexOf(8)]: 'active' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'A queue, read in rounds',
        lines: ['`const size = queue.length - head`: snapshot **before** the level loop.', '`queue[head++]` takes the front in O(1); its children go to the back.', 'After `size` nodes, the level is complete.'],
        frames: [
          ...lFrames.map((f) => ({ ...f, say: f.say === 0 ? 0 : 1 })),
          {
            say: 2,
            note: `head = ${L_ALL.length} = queue.length: done. Nodes came out in order of depth.`,
            panels: [draw(LT, { st: states(allIds(LT), 'done') }), arr(vals(LT, L_ALL), { label: 'queue', highlights: hl(L_ALL.length, () => 'done') }), vars({ levels: JSON.stringify(L_LEVELS) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Two traps, then the clue',
        lines: ['Reading `queue.length` inside the level loop: the bound grows as children are pushed.', '`queue.shift()` is O(n) each time: O(n²) total. Use a head index.', 'Clues: **"level by level"**, **"each depth"**, **"right side view"**, **"zigzag"**, **"minimum depth"**, **"closest leaf"**.'],
        frames: [
          {
            say: 0,
            note: `Loop with \`i < queue.length - head\` here: level 0 becomes ${show(L_LIVE)}. It absorbed a node of the next level.`,
            panels: [draw(LT, { st: { ...states(L_LIVE.map((v) => idOf(LT, v)), 'active'), [idOf(LT, 1)]: 'bad' } }), vars({ 'level 0 (live bound)': show(L_LIVE), 'level 0 (snapshot)': show(L_LEVELS[0]) })],
          },
          {
            say: 2,
            note: 'Per-level answers fall out of the rounds: e.g. the last node of each round is the right side view.',
            panels: [table(L_LEVELS.map((_, d) => `depth ${d}`), ['level', 'last node'], L_LEVELS.map((l) => [show(l), String(l.at(-1))]), 'levels')],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: right side view',
        lines: ['e.g. 1 has children 2 and 3; 2 has a right child 5; 5 has a left child 6.', 'Right side view: the values you see looking at the tree from the right, top to bottom.'],
        panels: [draw(RT)],
        task: {
          type: 'choose',
          question: 'What does the BFS right side view return?',
          options: [
            { text: show(R_VIEW) },
            { text: show(R_RIGHTS), why: 'That only follows right children. Deeper levels can exist on the left side; BFS records the last node of every level.' },
            { text: show(R_LEFT), why: 'That is the first node of each level: the left side view.' },
            { text: show([1, 3, 6]), why: 'Level 2 holds only 5, so 5 is its last node. Every level contributes one value.' },
          ],
          answer: 0,
        },
        solved: `Levels ${JSON.stringify(R_LEVELS)}; the last of each is ${show(R_VIEW)}. One round per level, record its last node.`,
      },
    ],
  },

  {
    id: 'tree-top-down',
    title: 'Pass the path down: each node knows what is above it',
    steps: [
      {
        kind: 'watch',
        title: 'The answer lives above the node',
        lines: ['"A node is **good** if no node on the path above it is greater."', 'Nodes point only down: a node cannot walk back up to its ancestors.'],
        frames: [
          {
            say: 0,
            note: `e.g. is 5 good? It needs the max of its ancestors: max(4, 6) = 6. So no.`,
            panels: [draw(GT, { st: { ...states(ancestors(GT, G_ASK), 'visited'), [G_ASK]: 'active' } }), vars({ node: 5, 'path above': '4, 6', 'max above': 6 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'dfs(node, maxSoFar)',
        lines: ['`if (node.val >= maxSoFar) count++`: use what came from above.', '`next = Math.max(maxSoFar, node.val)` flows **down** to both children.'],
        frames: gFrames.map((f, k) => ({ ...f, say: k === 0 ? 1 : f.say })),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"from the root to"**, **"path from root"**, **"no node on the path above is greater"**, **"depth of each node"**, **"root-to-leaf"**.', 'Ask: does this node need what is **above** it (top-down) or **below** it (bottom-up)?'],
        frames: [
          {
            say: 1,
            note: `Count = ${G_COUNT} in one preorder pass, O(n). The parameter carries the whole path in one number.`,
            panels: [table(['info flows', 'natural order', 'typical state'], ['top-down'], [['root → leaves (parameters)'], ['preorder: use it, then recurse'], ['depth so far, max on path, remaining sum']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: deep in a path',
        lines: ['e.g. a path 2 → 9 → 3 → 8, `dfs(root, -Infinity)`.'],
        panels: [draw(GP, { st: { ...states(ancestors(GP, GP_8), 'visited'), [GP_8]: 'active' } })],
        task: {
          type: 'choose',
          question: 'Which maxSoFar does node 8 receive, and is 8 good?',
          options: [
            { text: `${GP_MAX}, so 8 is not good` },
            { text: '3, so 8 is good', why: '3 is only the parent. The parameter carries the max of the whole path above: max(2, 9, 3).' },
            { text: '−∞, so 8 is good', why: '−∞ is passed only to the root. Each node passes max(maxSoFar, its value) further down.' },
            { text: '8, so 8 is good', why: 'A node receives the max of its ancestors; it compares its own value only after.' },
          ],
          answer: 0,
        },
        solved: `max(2, 9, 3) = ${GP_MAX} flows down to 8; 8 < 9, not good. The parent hands down a summary of the whole path.`,
      },
    ],
  },

  {
    id: 'tree-bottom-up',
    title: 'Return the height, record the bend: diameter in one pass',
    steps: [
      {
        kind: 'watch',
        title: 'Heights recomputed at every ancestor',
        lines: ['Diameter: edges on the longest path between **any** two nodes.', 'Brute force calls `height()` separately at every node: O(n²) on a chain.'],
        frames: [
          {
            say: 1,
            note: `e.g. here the brute force walks ${B_BRUTE} nodes inside height() for ${BT.length} nodes. One postorder pass visits each once.`,
            panels: [draw(BT), vars({ n: BT.length, 'brute force height() visits': B_BRUTE, 'one pass': BT.length })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Children first, then combine',
        lines: ['`L = height(left)`, `R = height(right)`: ask the children.', '`best = Math.max(best, L + R)`: the path that bends **here**.', '`return 1 + Math.max(L, R)`: one side, what the parent can use.'],
        frames: bFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"height"**, **"diameter"**, **"balanced"**, **"maximum path sum"**, **"longest path between any two nodes"**, **"subtree"**.'],
        frames: [
          {
            say: 0,
            note: `Diameter = ${B_BEST}: 6 → 4 → 2 → 5 → 7. Record two-sided, return one-sided: a path cannot fork.`,
            panels: [draw(BT, { st: { ...states([idOf(BT, 6), idOf(BT, 4), idOf(BT, 2), idOf(BT, 5), idOf(BT, 7)], 'done') }, el: Object.fromEntries(B_RUN.filter((x) => x.id !== 0).map((x) => [x.id, x.ret])) }), vars({ best: B_BEST })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: record vs return',
        lines: [`e.g. a node whose left call returns ${BL} and right call returns ${BR}.`],
        panels: [vars({ L: BL, R: BR })],
        task: {
          type: 'choose',
          question: 'What does it record as a candidate, and what does it return?',
          options: [
            { text: `records ${BL + BR}, returns ${1 + Math.max(BL, BR)}` },
            { text: `records ${BL + BR}, returns ${BL + BR}`, why: 'A path coming from the parent can continue into only one child. Returning both sides makes a path that forks.' },
            { text: `records ${1 + Math.max(BL, BR)}, returns ${1 + Math.max(BL, BR)}`, why: 'The path that bends here goes down both sides: L + R edges.' },
            { text: `records ${BL + BR + 1}, returns ${1 + Math.max(BL, BR)}`, why: 'height counts nodes, so L + R is already the number of edges through this node.' },
          ],
          answer: 0,
        },
        solved: `Record L + R = ${BL + BR} (two-sided); return 1 + max(L, R) = ${1 + Math.max(BL, BR)} (one-sided, for the parent).`,
      },
    ],
  },

  {
    id: 'tree-path-backtracking',
    title: 'One shared path: push on entry, pop on exit',
    steps: [
      {
        kind: 'watch',
        title: 'The nodes, not just a number',
        lines: [`"Return **all root-to-leaf paths** where the sum equals target."`, 'Copying the path at every node is wasteful; one array + push/pop is O(h) memory.'],
        frames: [
          {
            say: 0,
            note: `e.g. target ${P_TARGET}. Three leaves: 3, 1 and 2. Which root-to-leaf paths add up to ${P_TARGET}?`,
            panels: [draw(PT, { st: states(allIds(PT).filter((id) => kids(PT, id).length === 0), 'active') }), vars({ target: P_TARGET })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Choose, explore, undo',
        lines: ['`path.push(node.val)`: choose. `remaining -= node.val`.', 'At a real leaf with `remaining === 0`: `result.push([...path])`, a copy.', '`dfs(left)`, `dfs(right)`, then `path.pop()`: undo, the parent\'s path is back.'],
        frames: pFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"return all root-to-leaf paths"**, **"paths where the sum equals"**, **"list the nodes on the path"**.', 'Only yes/no or a count? Top-down without a path array.'],
        frames: [
          {
            say: 0,
            note: 'A leaf has both children null. Record only there; never return before the pop.',
            panels: [table(['record at a real leaf', 'return early at a leaf', 'push the live path'], ['result'], [['correct'], ['pop skipped: path broken'], ['every entry ends up []']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: forget the copy',
        lines: ['Same tree, target 10, but the leaf check does `result.push(path)`: the live array, not a copy.'],
        panels: [stk([], 'path at the end'), vars({ 'correct result': JSON.stringify(P_RES) })],
        task: {
          type: 'choose',
          question: 'What does result hold when dfs returns?',
          options: [
            { text: JSON.stringify(P_LIVE) },
            { text: JSON.stringify(P_RES), why: 'That needs a copy at each leaf. Both entries are the same array object, which keeps changing.' },
            { text: '[[5,4,2],[5,4,2]]', why: 'The path is popped all the way back after the last leaf. At the end the shared array is empty.' },
            { text: '[[5,2,3]]', why: 'Two leaves match, so two entries are pushed. They just point to the same array.' },
          ],
          answer: 0,
        },
        solved: `Both entries are the one shared path, emptied by the pops: ${JSON.stringify(P_LIVE)}. Push \`[...path]\`.`,
      },
    ],
  },

  {
    id: 'tree-lca',
    title: 'Each subtree reports what it found: the LCA rises to the top',
    steps: [
      {
        kind: 'watch',
        title: 'No way up',
        lines: ['LCA: the **deepest** node with both p and q as descendants.', 'Without parent pointers we cannot walk upward from p or q.'],
        frames: [
          {
            say: 1,
            note: 'e.g. p = 8, q = 4. Arrows point only down: from 8 there is no way back to its ancestors.',
            panels: [draw(AT, { st: { [A_P]: 'active', [A_Q]: 'active' } }), vars({ p: 8, q: 4 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Report back up',
        lines: ['`if (!root || root === p || root === q) return root`.', 'Recurse left and right. `if (left && right) return root`.', '`return left ?? right`: pass up whichever side found something.'],
        frames: [
          aFrame(aAt(4), 0, '4 is q: return 4 at once, without looking below it.'),
          aFrame(aAt(8), 0, '2 → 5 → 8: 8 is p, return 8.'),
          aFrame(aAt(5), 2, '9 finds nothing: null. At 5: left = 8, right = null, so pass 8 up.'),
          aFrame(aAt(2), 1, 'At 2: left = 4, right = 8. Both sides non-null: 2 is the LCA. Return 2.'),
          aFrame(aAt(3), 2, '3, 6, 7 contain neither: every call returns null.'),
          aFrame(aAt(1), 2, `At 1: left = 2, right = null. Pass 2 up. Answer: ${AT[A_RUN.ans].val}.`),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"lowest common ancestor"**, **"deepest node that has both as descendants"**, **"distance between two nodes"**.', 'Distance = depth(p) + depth(q) − 2·depth(lca).'],
        frames: [
          {
            say: 1,
            note: `Distance 8 ↔ 4 = ${depthOf(8)} + ${depthOf(4)} − 2·${depthOf(2)} = ${A_DIST}. Compare nodes by reference: values may repeat.`,
            panels: [draw(AT, { st: { [A_P]: 'visited', [A_Q]: 'visited', [A_RUN.ans]: 'done' } }), vars({ 'depth(8)': depthOf(8), 'depth(4)': depthOf(4), 'depth(lca 2)': depthOf(2), distance: A_DIST })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: one inside the other',
        lines: ['Same tree, now p = 5 and q = 9 (9 is a child of 5).'],
        panels: [draw(AT, { st: { [idOf(AT, 5)]: 'active', [idOf(AT, 9)]: 'active' } })],
        task: {
          type: 'choose',
          question: 'What does the call on the root return?',
          options: [
            { text: String(AT[A_TURN.ans].val) },
            { text: '2', why: 'At 2 the left side (4) returns null, the right side returns 5. One side only: 2 passes 5 up.' },
            { text: '1', why: 'The root is returned only when p and q are found on different sides of it.' },
            { text: '9', why: 'The call on 5 returns 5 at once and never visits 9. That is fine: 9 lies below 5.' },
          ],
          answer: 0,
        },
        solved: 'The call on 5 returns 5 without looking deeper; every ancestor sees one non-null side and passes it up.',
      },
    ],
  },

  {
    id: 'tree-construction',
    title: 'Preorder names the root, inorder splits the rest',
    steps: [
      {
        kind: 'watch',
        title: 'One traversal is ambiguous',
        lines: ['Many trees share a preorder.', 'Preorder + inorder with **unique values** pins down the tree.'],
        frames: [
          {
            say: 0,
            note: 'e.g. 1 with children 2 and 3, and the chain 1 → 2 → 3: both have preorder 1, 2, 3.',
            panels: [draw(CA, { label: 'preorder 1, 2, 3' }), draw(CB, { label: 'preorder 1, 2, 3' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'build(lo, hi) on an inorder range',
        lines: ['`val = preorder[p++]`: the next root. `mid = idx.get(val)` from a Map.', '`node.left = build(lo, mid - 1)` first, then `node.right = build(mid + 1, hi)`.'],
        frames: cFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"construct binary tree from preorder and inorder"**, **"from inorder and postorder"**, **"values are unique"**.'],
        frames: [
          {
            say: 0,
            note: '`indexOf` or slicing at every call makes it O(n²). A value → index Map and index ranges keep it O(n).',
            panels: [table(['indexOf on inorder', 'slice per call', 'Map + ranges'], ['cost'], [['O(n²)'], ['O(n²) time and memory'], ['O(n)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the right child',
        lines: [`e.g. preorder = ${show(CT_PRE)}, inorder = ${show(CT_IN)}.`, 'Root 7 sits at inorder index 3.'],
        panels: [arr(CT_PRE, { label: 'preorder', pointers: [ptr(0, 'p')], highlights: { 0: 'active' } }), arr(CT_IN, { label: 'inorder', pointers: [ptr(3, 'mid', 'b')], highlights: { 3: 'active' } })],
        task: {
          type: 'choose',
          question: "Which value becomes 7's right child?",
          options: [
            { text: String(CT_ROOT.right.v) },
            { text: '3', why: 'The next preorder value is the left child: left is built first.' },
            { text: '8', why: "8 is 7's neighbour in inorder: the leftmost node of the right subtree, not its root." },
            { text: '5', why: '5 is the last of the 3 left-subtree values in preorder. The right root comes after them.' },
          ],
          answer: 0,
        },
        solved: 'Inorder index 3 means 3 nodes go left: preorder 3, 1, 5. The next preorder value, 9, is the right root.',
      },
    ],
  },

  {
    id: 'tree-serialization',
    title: 'Write down the missing children: a string that keeps the shape',
    steps: [
      {
        kind: 'watch',
        title: 'Values alone lose the shape',
        lines: ['A traversal of values alone is ambiguous.', 'Write a marker for **every null child** and one preorder is enough.'],
        frames: [
          {
            say: 0,
            note: 'e.g. 2 right of 4 with 6 left of 2, and 4 with children 2 and 6: both have preorder 4, 2, 6.',
            panels: [draw(ST, { label: 'this tree' }), draw(SV, { label: 'another tree' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Serialize: preorder with #',
        lines: ['`if (!node) { out.push(\'#\'); return; }`: record the missing child.', '`out.push(node.val)`, then left, then right.'],
        frames: [
          sFrame([0, 1], 0, 'Write 4. Its left child is missing: write #.'),
          sFrame([2, 2], 1, 'Right child 2: write 2.'),
          sFrame([3, 5], 1, '6 is 2\'s left child: write 6, then # # for its two empty children.'),
          sFrame([6, 6], 0, `2 has no right child: #. out = "${S_TOK.join(',')}".`),
        ],
      },
      {
        kind: 'watch',
        title: 'Deserialize: the same traversal',
        lines: ['`t = tokens[i++]`: one token per call.', '`#` returns null; a number makes a node, then `build()` left, then right.', 'Coordinates: root (0, 0); a left child (row + 1, col − 1), a right child (row + 1, col + 1).'],
        frames: [
          dFrame([0, 1], 1, 'Token 4: the root. Its left call reads #: null.'),
          dFrame([2, 3], 1, 'Its right call reads 2: a node. 2\'s left call reads 6.'),
          dFrame([4, 6], 0, "6 reads # #: a leaf. 2's right reads the last #. Same shape as before."),
          {
            say: 2,
            note: `Same idea, other positions: (row, col) per node, left col − 1, right col + 1. Sort by (col, row, val).`,
            panels: [table(S_COORD.map((c) => String(c[2])), ['col', 'row'], S_COORD.map((c) => [String(c[0]), String(c[1])]), 'vertical order')],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: read a string back',
        lines: [`e.g. "${S_TURN.join(',')}".`],
        panels: [arr(S_TURN, { label: 'tokens', pointers: [ptr(0, 'i')] })],
        task: {
          type: 'choose',
          question: 'Which tree does deserialize build?',
          options: [
            { text: '3 has children 1 and 2; 5 is the left child of 2' },
            { text: '3 has children 1 and 2; 5 is the right child of 2', why: '5 is read by 2\'s left call. The # # after 5 are 5\'s children; the last # is 2\'s right.' },
            { text: '3 has children 1 and 2; 5 is a child of 1', why: 'The # # right after 1 are 1\'s two children: 1 is a leaf.' },
            { text: 'A chain 3 → 1 → 2 → 5', why: 'Each # closes a child slot. The # # after 1 end 1\'s subtree, so 2 is the next call of 3.' },
          ],
          answer: 0,
        },
        solved: '3, 1 (#, #: a leaf), 2, 5 (#, #), # for 2\'s right. One token per call, the same preorder that wrote it.',
      },
    ],
  },
];
