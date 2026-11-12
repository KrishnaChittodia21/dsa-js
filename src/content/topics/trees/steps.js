// Step lessons for Trees (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every visit order, stack / queue content, returned value and LCA below comes from running the algorithm in JS.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const reveal = (rows, col, k, hidden = '?') => table(rows.map((r) => r[0]), [col], rows.map((r, i) => [i <= k ? r[1] : hidden]), rows.map((_, i) => [i === k ? 'active' : i < k ? 'done' : '']));
const check = (ok, msg) => {
  if (!ok) throw new Error(`trees/steps.js: ${msg}`);
};

// ---------- trees ----------
// build a tree from a LeetCode level-order array; ids follow creation (level) order, x = inorder position.
// nulls: also add a '∅' node for every empty child slot (to draw null children / null markers).
function build(level, { nulls = false } = {}) {
  const ns = [];
  const mk = (val, depth, parent) => {
    const n = { id: ns.length, val, left: null, right: null, depth, parent };
    ns.push(n);
    return n;
  };
  if (!level.length || level[0] === null) return ns;
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
// o.st: id → node state, o.el / o.es: child id → label / state of the edge into that child, o.lab: id → label
const draw = (ns, o = {}) => ({
  kind: 'nodes',
  ...(o.label ? { label: o.label } : {}),
  nodes: ns.map((n) => {
    const state = o.st?.[n.id] ?? (n.nul ? 'muted' : undefined);
    return { id: n.id, label: String(o.lab?.[n.id] ?? n.val), x: n.x * (o.sx || 1), y: n.depth, ...(state ? { state } : {}) };
  }),
  edges: ns.filter((n) => n.parent !== null).map((n) => ({ from: n.parent, to: n.id, ...(o.el?.[n.id] !== undefined ? { label: String(o.el[n.id]) } : {}), ...(o.es?.[n.id] ? { state: o.es[n.id] } : {}) })),
});
const idOf = (ns, v) => ns.find((n) => n.val === v && !n.nul).id;
const val = (ns) => (id) => ns[id].val;
const kidsOf = (ns, id) => [ns[id].left, ns[id].right].filter((c) => c !== null);
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');

// recursive orders (ids)
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
const levelOrderIds = (ns) => {
  const out = [0];
  for (let h = 0; h < out.length; h++) out.push(...kidsOf(ns, out[h]));
  return out;
};

// ---------- the trees the lesson uses ----------
const T1L = [3, 9, 20, null, null, 15, 7];
const T1 = build(T1L);
const v1 = val(T1);
const T5 = build([1, 2, 3, 4, 5]); // dry-run tree
const v5 = val(T5);
const T6 = build([1, 2, 3, 4, 5, null, 6]);
const v6 = val(T6);
check(seq(order(T1, 'pre').map(v1)) === '3, 9, 20, 15, 7', 'preorder');
check(seq(order(T1, 'in').map(v1)) === '9, 3, 15, 20, 7', 'inorder');
check(seq(order(T1, 'post').map(v1)) === '9, 15, 7, 20, 3', 'postorder');
check(seq(levelOrderIds(T1).map(v1)) === '3, 9, 20, 15, 7', 'level order');

// ---------- what: arrayToTree reads the level-order array ----------
function arrayToTreeFrames(level) {
  const ns = build(level);
  const frames = [];
  const made = [0];
  const q = [0];
  let h = 0;
  let i = 1;
  const snap = (say, note, at, active, parent) =>
    frames.push({
      say,
      note,
      panels: [
        arr(level.map((v) => (v === null ? 'null' : v)), { label: 'level-order array', pointers: [ptr(at, 'i')], highlights: hl(level.length, (k) => (k === at ? 'active' : k < at ? 'done' : '')) }),
        draw(ns, { st: { ...states(ns.map((n) => n.id), 'hidden'), ...states(made, ''), ...(parent !== null ? { [parent]: 'visited' } : {}), ...(active !== null ? { [active]: 'active' } : {}) } }),
      ],
    });
  snap(0, `Index 0: ${level[0]} is the root.`, 0, 0, null);
  let next = 1;
  while (h < q.length && i < level.length) {
    const p = q[h++];
    for (const side of ['left', 'right']) {
      if (i >= level.length) break;
      const v = level[i];
      if (v === null) snap(1, `Index ${i}: null, so ${ns[p].val} has no ${side} child.`, i, null, p);
      else {
        const id = next++;
        check(ns[id].val === v && ns[p][side] === id, 'arrayToTree ids');
        made.push(id);
        q.push(id);
        snap(2, `Index ${i}: ${v} is the ${side} child of ${ns[p].val}.`, i, id, p);
      }
      i++;
    }
  }
  return frames;
}

// ---------- brute-force diameter, instrumented ----------
function bruteDiameter(ns) {
  const visits = Array(ns.length).fill(0);
  const frames = [];
  const height = (id, seen) => {
    if (id === null) return 0;
    visits[id]++;
    seen.push(id);
    return 1 + Math.max(height(ns[id].left, seen), height(ns[id].right, seen));
  };
  const dia = (id) => {
    if (id === null) return 0;
    const seen = [];
    const through = height(ns[id].left, seen) + height(ns[id].right, seen);
    frames.push({ id, seen, visits: visits.slice(), through });
    return Math.max(through, dia(ns[id].left), dia(ns[id].right));
  };
  const answer = dia(0);
  return { frames, visits, answer, total: visits.reduce((a, b) => a + b, 0) };
}
const chain = (n) => build(Array.from({ length: n }, (_, k) => k + 1).flatMap((v, k) => (k === 0 ? [v] : [v, null])));
const CH4 = chain(4);
const BR4 = bruteDiameter(CH4);
const BR5 = bruteDiameter(chain(5));
check(BR4.total === 6 && BR5.total === 10, 'brute counts');

// ---------- optimized-dfs: iterative traversals ----------
function iterPre(ns) {
  const v = val(ns);
  const frames = [];
  const out = [];
  const st = [0];
  const snap = (note, cur) => frames.push({ note, panels: [draw(ns, { st: { ...states(st, 'visited'), ...states(out, 'done'), ...(cur !== null ? { [cur]: 'active' } : {}) } }), stk(st.map(v)), arr(out.map(v), { label: 'out' })] });
  snap(`Start: the stack holds the root ${v(0)}.`, null);
  let maxSize = 1;
  while (st.length) {
    const id = st.pop();
    out.push(id);
    const pushed = [];
    if (ns[id].right !== null) pushed.push(ns[id].right);
    if (ns[id].left !== null) pushed.push(ns[id].left);
    st.push(...pushed);
    maxSize = Math.max(maxSize, st.length);
    snap(`Pop ${v(id)} and write it.${pushed.length ? ` Push ${pushed.map(v).join(', then ')}.` : ' No children to push.'}`, id);
  }
  return { frames, out, maxSize };
}
function iterIn(ns) {
  const v = val(ns);
  const frames = [];
  const out = [];
  const st = [];
  let cur = 0;
  const snap = (say, note, act) => frames.push({ say, note, panels: [draw(ns, { st: { ...states(st, 'visited'), ...states(out, 'done'), ...(act !== null ? { [act]: 'active' } : {}) } }), stk(st.map(v)), arr(out.map(v), { label: 'out' })] });
  while (cur !== null || st.length) {
    while (cur !== null) {
      st.push(cur);
      const l = ns[cur].left;
      snap(0, `Push ${v(cur)}, go left: ${l === null ? 'null' : v(l)}.`, cur);
      cur = l;
    }
    cur = st.pop();
    out.push(cur);
    const r = ns[cur].right;
    snap(r === null ? 1 : 2, `cur is null: pop ${v(cur)}, write it. Go right: ${r === null ? 'null' : v(r)}.`, cur);
    cur = r;
  }
  return { frames, out };
}
function iterPost(ns) {
  const v = val(ns);
  const frames = [];
  const out = [];
  const st = [0];
  while (st.length) {
    const id = st.pop();
    out.push(id);
    const pushed = [];
    if (ns[id].left !== null) pushed.push(ns[id].left);
    if (ns[id].right !== null) pushed.push(ns[id].right);
    st.push(...pushed);
    frames.push({ say: 0, note: `Pop ${v(id)}, write it.${pushed.length ? ` Push ${pushed.map(v).join(', then ')}.` : ''}`, panels: [draw(ns, { st: { ...states(st, 'visited'), ...states(out, 'done'), [id]: 'active' } }), stk(st.map(v)), arr(out.map(v), { label: 'out' })] });
  }
  const rev = out.slice().reverse();
  frames.push({ say: 1, note: `out.reverse(): ${seq(rev.map(v))}. That is postorder.`, panels: [draw(ns, { st: states(out, 'done') }), arr(rev.map(v), { label: 'returned', highlights: hl(rev.length, () => 'done') })] });
  return { frames, out, rev };
}
const PRE1 = iterPre(T1);
const IN1 = iterIn(T1);
const POST1 = iterPost(T1);
check(seq(PRE1.out.map(v1)) === '3, 9, 20, 15, 7' && seq(IN1.out.map(v1)) === '9, 3, 15, 20, 7' && seq(POST1.rev.map(v1)) === '9, 15, 7, 20, 3', 'iterative orders');

// ---------- optimized-bfs ----------
function levelArrays(ns) {
  const v = val(ns);
  const frames = [];
  const result = [];
  const done = [];
  let level = [0];
  while (level.length) {
    result.push(level.map(v).join(' '));
    frames.push({ say: 0, note: `result.push([${level.map(v).join(', ')}]).`, panels: [draw(ns, { st: { ...states(done, 'done'), ...states(level, 'active') } }), arr(level.map(v), { label: 'level' }), arr(result.slice(), { label: 'result (one cell per level)', highlights: { [result.length - 1]: 'active' } })] });
    const next = [];
    for (const n of level) next.push(...kidsOf(ns, n));
    done.push(...level);
    frames.push({ say: 1, note: next.length ? `Children of this level, left to right: next = [${next.map(v).join(', ')}].` : 'No children: next = [] and the loop stops.', panels: [draw(ns, { st: { ...states(done, 'done'), ...states(next, 'window') } }), arr(next.map(v), { label: 'next → becomes level' }), arr(result.slice(), { label: 'result (one cell per level)' })] });
    level = next;
  }
  return { frames, result };
}
function headQueue(ns) {
  const v = val(ns);
  const frames = [];
  const q = [0];
  let head = 0;
  const sizes = [];
  const snap = (say, note, size, taken) =>
    frames.push({
      say,
      note,
      panels: [
        draw(ns, { st: { ...states(q.slice(0, head), 'done'), ...states(q.slice(head), 'window'), ...(taken !== null ? { [taken]: 'active' } : {}) } }),
        arr(q.map(v), { label: 'queue array', ...(head < q.length ? { pointers: [ptr(head, 'head')] } : {}), highlights: hl(q.length, (k) => (k < head ? 'muted' : '')) }),
        vars({ size, head }),
      ],
    });
  while (head < q.length) {
    const size = q.length - head;
    sizes.push(size);
    snap(1, `New level: snapshot size = ${q.length} − ${head} = ${size}.`, size, null);
    for (let i = 0; i < size; i++) {
      const id = q[head++];
      const kids = kidsOf(ns, id);
      q.push(...kids);
      snap(0, `Take ${v(id)} (queue[head++]).${kids.length ? ` Add ${kids.map(v).join(', ')} at the back.` : ''}`, size, id);
    }
  }
  return { frames, sizes };
}
const LA6 = levelArrays(T6);
const HQ6 = headQueue(T6);
check(seq(LA6.result) === '1, 2 3, 4 5 6' && seq(HQ6.sizes) === '1, 2, 3', 'bfs');

// ---------- top-down vs bottom-up maxDepth ----------
function topDown(ns) {
  const v = val(ns);
  const frames = [];
  let best = 0;
  const called = [];
  const el = {};
  const dfs = (id, depth) => {
    if (id === null) return;
    called.push(id);
    if (ns[id].parent !== null) el[id] = `d=${depth}`;
    best = Math.max(best, depth);
    frames.push({ say: 1, note: `dfs(${v(id)}, ${depth}): best = max(best, ${depth}) = ${best}.`, panels: [draw(ns, { st: { ...states(called, 'visited'), [id]: 'active' }, el: { ...el }, sx: 1.3 }), vars({ depth, best })] });
    dfs(ns[id].left, depth + 1);
    dfs(ns[id].right, depth + 1);
  };
  dfs(0, 1);
  return { frames, best };
}
function bottomUp(ns) {
  const v = val(ns);
  const frames = [];
  const el = {};
  const done = [];
  const go = (id) => {
    if (id === null) return 0;
    const L = go(ns[id].left);
    const R = go(ns[id].right);
    const r = 1 + Math.max(L, R);
    done.push(id);
    if (ns[id].parent !== null) el[id] = r;
    frames.push({ say: 2, note: `${v(id)}: L = ${L}, R = ${R} → returns 1 + max(${L}, ${R}) = ${r}.`, panels: [draw(ns, { st: { ...states(done, 'done'), [id]: 'active' }, el: { ...el }, es: states(done, 'done') }), vars({ L, R, returns: r })] });
    return r;
  };
  return { frames, value: go(0) };
}
const TD1 = topDown(T1);
const BU1 = bottomUp(T1);
check(TD1.best === 3 && BU1.value === 3, 'maxDepth');

// goodNodes, straight from the lesson's code, with a frame per call and per return
function goodRun(ns) {
  const v = val(ns);
  const calls = [];
  const rets = [];
  const all = [];
  const el = {};
  const st = {};
  const back = {};
  const dfs = (id, maxAbove) => {
    if (id === null) return 0;
    const good = ns[id].val >= maxAbove ? 1 : 0;
    st[id] = good ? 'done' : 'bad';
    if (ns[id].parent !== null) el[id] = `max ${maxAbove}`;
    calls.push(all[all.push({ say: 1, note: `${v(id)} vs max above ${maxAbove === -Infinity ? '−∞' : maxAbove}: ${good ? 'good' : 'not good'}.`, panels: [draw(ns, { st: { ...st, [id]: good ? 'active' : 'bad' }, el: { ...el }, sx: 1.4 }), vars({ node: v(id), maxAbove: maxAbove === -Infinity ? '−∞' : maxAbove, good })] }) - 1]);
    const m = Math.max(maxAbove, ns[id].val);
    const L = dfs(ns[id].left, m);
    const R = dfs(ns[id].right, m);
    const r = good + L + R;
    if (ns[id].parent !== null) back[id] = r;
    rets.push(all[all.push({ say: 2, note: `dfs(${v(id)}) returns ${good} + ${L} + ${R} = ${r}.`, panels: [draw(ns, { st: { ...st, [id]: 'active' }, el: { ...back }, es: states(Object.keys(back).map(Number), 'done'), sx: 1.2 }), vars({ good, L, R, returns: r })] }) - 1]);
    return r;
  };
  return { calls, rets, all, count: dfs(0, -Infinity) };
}
const GN = build([3, 1, 4, 3, null, 1, 5]);
const GN_RUN = goodRun(GN);
const GI = build([2, 1, 4, null, null, 3, 5]);
const GI_RUN = goodRun(GI);
check(GN_RUN.count === 4 && GI_RUN.count === 3, 'goodNodes');

// isBalanced, straight from the lesson's code
function balancedRun(ns) {
  const v = val(ns);
  const frames = [];
  const el = {};
  const done = [];
  const height = (id) => {
    if (id === null) return 0;
    const L = height(ns[id].left);
    let r;
    let R = '—';
    if (L === -1) r = -1;
    else {
      R = height(ns[id].right);
      r = R === -1 || Math.abs(L - R) > 1 ? -1 : 1 + Math.max(L, R);
    }
    done.push(id);
    if (ns[id].parent !== null) el[id] = r;
    frames.push({ say: r === -1 ? 1 : 0, note: r === -1 ? `${v(id)}: L = ${L}, R = ${R}, they differ by ${Math.abs(L - R)} > 1 → return −1.` : `${v(id)}: L = ${L}, R = ${R} → return ${r}.`, panels: [draw(ns, { st: { ...states(done, 'done'), [id]: r === -1 ? 'bad' : 'active' }, el: { ...el } }), vars({ L, R, returns: r })] });
    return r;
  };
  const h = height(0);
  return { frames, h, balanced: h !== -1 };
}
const BAL = build([1, 2, null, 3]);
const BAL_RUN = balancedRun(BAL);
check(BAL_RUN.h === -1, 'isBalanced');

// diameter bottom-up (the dry run): rows in postorder
function diameterRows(ns) {
  const v = val(ns);
  const rows = [];
  let best = 0;
  const go = (id) => {
    if (id === null) return 0;
    const L = go(ns[id].left);
    const R = go(ns[id].right);
    best = Math.max(best, L + R);
    rows.push({ id, node: String(v(id)), L, R, cand: L + R, best, ret: 1 + Math.max(L, R) });
    return 1 + Math.max(L, R);
  };
  go(0);
  return { rows, best };
}
const DR = diameterRows(T5);
// the lesson's own dry-run table
const LESSON_DRY = [
  ['4', '0', '0', '0', '0', '1'],
  ['5', '0', '0', '0', '0', '1'],
  ['2', '1', '1', '2', '2', '2'],
  ['3', '0', '0', '0', '2', '1'],
  ['1', '2', '1', '3', '3', '3'],
];
check(JSON.stringify(DR.rows.map((r) => [r.node, r.L, r.R, r.cand, r.best, r.ret].map(String))) === JSON.stringify(LESSON_DRY), 'dry-run table');
const dryPanels = (k, { hideLast = false } = {}) => {
  const rows = DR.rows;
  const shown = (i) => i <= k && !(hideLast && i === k);
  const el = {};
  for (let i = 0; i <= k; i++) if (shown(i) && T5[rows[i].id].parent !== null) el[rows[i].id] = rows[i].ret;
  return [
    draw(T5, { st: { ...states(rows.filter((_, i) => i < k).map((r) => r.id), 'done'), ...(k >= 0 && k < rows.length ? { [rows[k].id]: 'active' } : {}) }, el }),
    table(
      rows.map((r) => r.node),
      ['L', 'R', 'L+R', 'returns'],
      rows.map((r, i) => (shown(i) ? [r.L, r.R, r.cand, r.ret] : i === k ? ['?', '?', '?', '?'] : ['', '', '', ''])),
      rows.map((_, i) => Array(4).fill(i === k ? 'active' : i < k ? 'done' : '')),
    ),
    vars({ best: k < 0 ? 0 : shown(k) ? rows[k].best : rows[k - 1]?.best ?? 0 }),
  ];
};

// ---------- paths: Path Sum II with a shared path array ----------
function pathRun(ns, target) {
  const v = val(ns);
  const frames = [];
  const path = [];
  const found = [];
  const snap = (say, note, cur, rem) =>
    frames.push({ say, note, panels: [draw(ns, { st: { ...states(path, 'visited'), ...(cur !== null ? { [cur]: 'active' } : {}) } }), stk(path.map(v), 'path'), found.length ? arr(found.slice(), { label: 'found (copies)', highlights: hl(found.length, () => 'done') }) : vars({ remaining: rem })] });
  const dfs = (id, rem) => {
    if (id === null) return;
    path.push(id);
    const r = rem - ns[id].val;
    const leaf = ns[id].left === null && ns[id].right === null;
    if (leaf && r === 0) {
      found.push(path.map(v).join('→'));
      snap(1, `Push ${v(id)}. Leaf, sum = ${target}: record a copy [${path.map(v).join(', ')}].`, id, r);
    } else snap(0, `Push ${v(id)}. ${leaf ? `Leaf, but the sum is ${target - r}, not ${target}.` : `Remaining: ${r}.`}`, id, r);
    dfs(ns[id].left, r);
    dfs(ns[id].right, r);
    path.pop();
    snap(2, `Leave ${v(id)}: pop it.`, null, rem);
  };
  dfs(0, target);
  return { frames, found };
}
const PS = build([3, 2, 4, 5, 6, null, 4]);
const PS_RUN = pathRun(PS, 11);
check(seq(PS_RUN.found) === '3→2→6, 3→4→4', 'path sum');
// what res.push(path) without a copy would hold at the end
function pathNoCopy(ns, target) {
  const path = [];
  const res = [];
  const dfs = (node, rem) => {
    if (node === null) return;
    path.push(ns[node].val);
    const r = rem - ns[node].val;
    if (ns[node].left === null && ns[node].right === null && r === 0) res.push(path);
    dfs(ns[node].left, r);
    dfs(ns[node].right, r);
    path.pop();
  };
  dfs(0, target);
  return res;
}
check(JSON.stringify(pathNoCopy(PS, 11)) === '[[],[]]', 'live array');

// ---------- LCA, straight from the lesson's code ----------
function lcaRun(ns, p, q) {
  const v = val(ns);
  const frames = [];
  const back = {};
  const st = {};
  const show = (x) => (x === null ? '∅' : v(x));
  const go = (id) => {
    if (id === null) return null;
    if (id === p || id === q) {
      back[id] = id;
      st[id] = 'done';
      frames.push({ say: 1, note: `Reached ${v(id)} = ${id === p ? 'p' : 'q'}: return it without looking below.`, panels: [draw(ns, { st: { ...st, [id]: 'active' }, el: Object.fromEntries(Object.entries(back).map(([k, x]) => [k, show(x)])), es: states(Object.keys(back).filter((k) => back[k] !== null).map(Number), 'done') }), vars({ at: v(id), returns: v(id) })] });
      return id;
    }
    const left = go(ns[id].left);
    const right = go(ns[id].right);
    const r = left !== null && right !== null ? id : left ?? right;
    back[id] = r;
    st[id] = r === null ? 'muted' : 'done';
    const note = left !== null && right !== null ? `At ${v(id)}: found on both sides → ${v(id)} is the LCA.` : r === null ? `At ${v(id)}: nothing found below → return ∅.` : `At ${v(id)}: only one side found ${v(r)} → pass ${v(r)} up.`;
    frames.push({ say: left !== null && right !== null ? 2 : 3, note, panels: [draw(ns, { st: { ...st, [id]: 'active' }, el: Object.fromEntries(Object.entries(back).map(([k, x]) => [k, show(x)])), es: states(Object.keys(back).filter((k) => back[k] !== null).map(Number), 'done') }), vars({ at: v(id), left: show(left), right: show(right), returns: show(r) })] });
    return r;
  };
  return { frames, ans: go(0) };
}
const LT = build([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]);
const vL = val(LT);
const LCA_A = lcaRun(LT, idOf(LT, 6), idOf(LT, 4));
const LCA_B = lcaRun(LT, idOf(LT, 7), idOf(LT, 8));
check(vL(LCA_A.ans) === 5 && vL(LCA_B.ans) === 3, 'lca');

// ---------- construction from preorder + inorder ----------
function buildRun(pre, ino, shape) {
  const idx = new Map(ino.map((x, i) => [x, i]));
  let p = 0;
  const frames = [];
  const made = [];
  const b = (lo, hi, parent, side) => {
    if (lo > hi) return;
    const x = pre[p++];
    const m = idx.get(x);
    const id = idOf(shape, x);
    check(parent === null ? id === 0 : shape[parent][side] === id, 'construction shape');
    made.push(id);
    const lsize = m - lo;
    frames.push({
      say: parent === null ? 0 : 2,
      note: `preorder[${p - 1}] = ${x} is the root of inorder[${lo}..${hi}]. Map: ${x} → ${m}. Left gets ${lsize} value${lsize === 1 ? '' : 's'}, right ${hi - m}.`,
      panels: [
        arr(pre, { label: 'preorder', pointers: [ptr(p - 1, 'next')], highlights: hl(pre.length, (k) => (k === p - 1 ? 'active' : k < p - 1 ? 'done' : '')) }),
        arr(ino, { label: 'inorder', range: [lo, hi], pointers: [ptr(m, 'root', 'b')], highlights: hl(ino.length, (k) => (k === m ? 'active' : k >= lo && k <= hi ? 'window' : 'muted')) }),
        draw(shape, { st: { ...states(shape.map((n) => n.id), 'hidden'), ...states(made, 'done'), [id]: 'active' } }),
      ],
    });
    b(lo, m - 1, id, 'left');
    b(m + 1, hi, id, 'right');
  };
  b(0, ino.length - 1, null, null);
  return { frames, count: made.length };
}
const CONS = buildRun([3, 9, 20, 15, 7], [9, 3, 15, 20, 7], T1);
check(CONS.count === 5, 'construction');
const PRE6 = order(T6, 'pre').map(v6);
const IN6 = order(T6, 'in').map(v6);
check(seq(PRE6) === '1, 2, 4, 5, 3, 6' && seq(IN6) === '4, 2, 5, 1, 3, 6', 'T6 orders');

// ---------- serialization with null markers ----------
const tokensOf = (ns) => order(ns, 'pre').map((id) => (ns[id].nul ? '#' : String(ns[id].val)));
function serializeFrames(ns) {
  const ids = order(ns, 'pre');
  return ids.map((id, k) => ({
    say: 1,
    note: ns[id].nul ? `Empty ${ns[ns[id].parent].left === id ? 'left' : 'right'} child of ${ns[ns[id].parent].val}: write #.` : `Visit ${ns[id].val}: write ${ns[id].val}.`,
    panels: [draw(ns, { st: { ...states(ids.slice(0, k), 'done'), [id]: 'active' } }), arr(tokensOf(ns).slice(0, k + 1), { label: 'tokens', highlights: { [k]: 'active' } })],
  }));
}
function deserializeFrames(tokens) {
  // read with the same preorder, one token per call; build the shape as we go
  const shape = [];
  let i = 0;
  const order2 = [];
  const go = (parent, depth) => {
    const t = tokens[i++];
    const n = { id: shape.length, val: t === '#' ? '∅' : Number(t), nul: t === '#', left: null, right: null, depth, parent };
    shape.push(n);
    order2.push(n.id);
    if (!n.nul) {
      n.left = go(n.id, depth + 1);
      n.right = go(n.id, depth + 1);
    }
    return n.id;
  };
  go(null, 0);
  let k = 0;
  const ino = (id) => {
    if (id === null) return;
    ino(shape[id].left);
    shape[id].x = k++;
    ino(shape[id].right);
  };
  ino(0);
  const frames = order2.map((id, j) => {
    const n = shape[id];
    const where = n.parent === null ? 'the root' : `the ${shape[n.parent].left === id ? 'left' : 'right'} child of ${shape[n.parent].val}`;
    return {
      say: 1,
      note: n.nul ? `Token #: ${where} is empty. This call returns null.` : `Token ${n.val}: a node, ${where}. Recurse left, then right.`,
      panels: [arr(tokens, { label: 'tokens', pointers: [ptr(j, 'read')], highlights: hl(tokens.length, (x) => (x === j ? 'active' : x < j ? 'done' : '')) }), draw(shape, { st: { ...states(shape.map((s) => s.id), 'hidden'), ...states(order2.slice(0, j + 1), ''), ...states(order2.slice(0, j + 1).filter((s) => shape[s].nul), 'muted'), [id]: 'active' } })],
    };
  });
  return { frames, shape };
}
const SA = build([1, 2], { nulls: true });
const SB = build([1, null, 2], { nulls: true });
check(tokensOf(SA).join(',') === '1,2,#,#,#' && tokensOf(SB).join(',') === '1,#,2,#,#', 'lesson null-marker strings');
const DES_TOKENS = '1,2,#,3,#,#,#'.split(',');
const DES = deserializeFrames(DES_TOKENS);
check(tokensOf(build([1, 2, null, null, 3], { nulls: true })).join(',') === DES_TOKENS.join(','), 'deserialize round trip');

// vertical order coordinates
function coords(ns) {
  const out = [];
  const go = (id, row, col) => {
    if (id === null) return;
    out.push({ id, row, col });
    go(ns[id].left, row + 1, col - 1);
    go(ns[id].right, row + 1, col + 1);
  };
  go(0, 0, 0);
  return out;
}
const CO1 = coords(T1);
const col0 = CO1.filter((c) => c.col === 0).map((c) => v1(c.id));
check(seq(col0) === '3, 15', 'vertical col 0');

// ---------- template: preorder and postorder spots on T1 ----------
function templateFrames(ns) {
  const v = val(ns);
  const frames = [];
  let answer = 0;
  const el = {};
  const done = [];
  const seen = [];
  const dfs = (id, down) => {
    if (id === null) return 0;
    seen.push(id);
    frames.push({ say: 1, note: `PREORDER spot at ${v(id)}: down = ${down} arrives from the parent.`, panels: [draw(ns, { st: { ...states(seen, 'visited'), ...states(done, 'done'), [id]: 'active' }, el: { ...el } }), vars({ spot: 'pre', node: v(id), down, answer })] });
    const L = dfs(ns[id].left, down);
    const R = dfs(ns[id].right, down);
    answer = Math.max(answer, L + R);
    const r = 1 + Math.max(L, R);
    done.push(id);
    if (ns[id].parent !== null) el[id] = r;
    frames.push({ say: 2, note: `POSTORDER spot at ${v(id)}: L = ${L}, R = ${R}. answer = max(answer, ${L + R}) = ${answer}. Return ${r}.`, panels: [draw(ns, { st: { ...states(seen, 'visited'), ...states(done, 'done'), [id]: 'active' }, el: { ...el }, es: states(done, 'done') }), vars({ spot: 'post', node: v(id), L, R, answer })] });
    return r;
  };
  dfs(0, 0);
  return { frames, answer };
}
const TPL = templateFrames(T1);
check(TPL.answer === 3, 'template');
const T5N = build([1, 2, 3, 4, 5], { nulls: true });
const NULLS5 = T5N.filter((n) => n.nul).length;
check(NULLS5 === 6, 'null children');

// ---------- mistakes: the leaf check in path sum ----------
const PL = build([1, 2], { nulls: true }); // root 1, only a left child 2; target 1
function leafCheckFrames() {
  const v = (id) => PL[id].val;
  const frames = [];
  const st = {};
  let wrong = false;
  const dfs = (id, rem) => {
    const n = PL[id];
    if (n.nul) {
      const hit = rem === 0;
      if (hit) wrong = true;
      st[id] = hit ? 'bad' : 'muted';
      frames.push({ say: 0, note: `Wrong check at the empty ${PL[n.parent].left === id ? 'left' : 'right'} child of ${PL[n.parent].val}: remaining = ${rem}${hit ? ' → reports success!' : ' → no.'}`, panels: [draw(PL, { st: { ...st, [id]: hit ? 'bad' : 'active' } }), vars({ target: 1, remaining: rem })] });
      return hit;
    }
    const r = rem - n.val;
    st[id] = 'visited';
    frames.push({ say: 0, note: `Enter ${v(id)}: remaining = ${rem} − ${n.val} = ${r}.`, panels: [draw(PL, { st: { ...st, [id]: 'active' } }), vars({ target: 1, remaining: r })] });
    return dfs(n.left, r) || dfs(n.right, r);
  };
  dfs(0, 1);
  check(wrong, 'leaf bug reproduces');
  frames.push({ say: 1, note: 'Right check: at 1, remaining is 0 but 1 has a left child, so it is not a leaf. 2 is a leaf with remaining −2. Answer: false.', panels: [draw(PL, { st: { 0: 'visited', 1: 'active' } }), vars({ target: 1, found: 'false' })] });
  return frames;
}

// ---------- the steps ----------
const steps = {
  what: [
    {
      kind: 'watch',
      title: 'arrayToTree reads the tree row by row',
      lines: ['The level-order array starts with the **root**.', '`null` means a missing child.', 'Every node gets **at most two children**: a left one, then a right one.'],
      frames: arrayToTreeFrames(T1L),
    },
    {
      kind: 'turn',
      title: 'Your turn: maximum depth, counted in nodes',
      lines: ['**Height** counts edges down to a leaf.', 'In most problems, "maximum depth" counts **nodes** on the longest root-to-leaf path.'],
      panels: [draw(T1)],
      task: { type: 'number', question: 'What is the maximum depth of this tree, counted in nodes?', options: [2, 3, 4, 5], answer: 3, hint: 'Count the nodes on 3 → 20 → 15, not the edges.' },
      solved: '3 nodes, but only 2 edges. Always check which one a problem counts.',
      then: [{ say: 1, note: 'Longest root-to-leaf path: 3 → 20 → 15. Three nodes.', panels: [draw(T1, { st: states([0, 2, idOf(T1, 15)], 'active'), es: states([2, idOf(T1, 15)], 'active') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: find the leaves',
      lines: ['A **leaf** is a node with no children.'],
      panels: [draw(T1)],
      task: {
        type: 'choose',
        question: 'Which nodes are leaves?',
        options: [
          { text: '9, 15 and 7', why: '' },
          { text: 'Only 15 and 7', why: '9 has no children either. A leaf does not have to be on the bottom row.' },
          { text: '3', why: '3 is the root: it has two children.' },
          { text: '20, 15 and 7', why: '20 has children 15 and 7, so it is not a leaf.' },
        ],
        answer: 0,
      },
      solved: 'A leaf has no children: 9, 15 and 7.',
      then: [{ say: 0, note: 'The leaves: 9, 15, 7.', panels: [draw(T1, { st: states([1, 3, 4], 'done') })] }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'A node plus two smaller trees',
      lines: ['`(1 + 2) * 3` is a tree with `*` at the root.', 'Each child is the root of its own **smaller tree**.', 'Ask: "If I had the answer for the left and the right subtree, how do I get this node\'s answer?"'],
      frames: (() => {
        const E = build(['*', '+', 3, 1, 2]);
        const plus = [1, 3, 4];
        return [
          { say: 0, note: '`*` is the root. Its children are `+` and 3.', panels: [draw(E, { st: { 0: 'active' } })] },
          { say: 1, note: 'The left child `+` is the root of a smaller tree: 1 + 2.', panels: [draw(E, { st: { 0: 'muted', 2: 'muted', ...states(plus, 'visited'), 1: 'active' } })] },
          { say: 1, note: 'The right child is a smaller tree too: just 3.', panels: [draw(E, { st: { 0: 'muted', ...states(plus, 'muted'), 2: 'active' } })] },
          { say: 2, note: 'With both answers (3 and 3), the root only combines them: 3 * 3 = 9.', panels: [draw(E, { st: { 0: 'active', ...states([1, 2, 3, 4], 'done') }, el: { 1: 3, 2: 3 }, es: { 1: 'done', 2: 'done' } }), vars({ left: 3, right: 3, answer: 9 })] },
        ];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: combine two answers',
      lines: ['The left subtree has **1** node, the right subtree has **3**.', 'You want the number of nodes in the whole tree.'],
      panels: [draw(T1, { el: { 1: 'L = 1', 2: 'R = 3' }, sx: 1.3, st: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'How does the root get its answer?',
        options: [
          { text: '`1 + L + R`', why: '' },
          { text: '`L + R`', why: 'That forgets the root node itself.' },
          { text: '`1 + Math.max(L, R)`', why: 'That follows only one side; a count needs both subtrees.' },
        ],
        answer: 0,
      },
      solved: '1 + 1 + 3 = 5 nodes: the node itself plus both subtrees.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Which traversal, which direction?',
      lines: ['The input is a tree; the real choice is **which traversal** and **which direction** information flows.'],
      frames: [
        ['Visit every node', 'DFS, any order'],
        ['Depends on subtrees', 'postorder, return up'],
        ['Depends on ancestors', 'preorder, pass down'],
        ['Per level', 'BFS, queue'],
        ['Root-to-leaf paths', 'DFS + path array'],
        ['Rebuild / encode', 'index maps / nulls'],
      ].map((_, k, all) => ({ say: 0, note: `${all[k][0]} → ${all[k][1]}.`, panels: [reveal(all, 'use', k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: invert a tree',
      lines: ['Invert: swap the left and right child of **every** node.'],
      panels: [draw(T1)],
      task: {
        type: 'choose',
        question: 'Which traversal fits?',
        options: [
          { text: 'DFS in any order', why: '' },
          { text: 'Only inorder works', why: 'Every node just needs one visit; the order does not matter here.' },
          { text: 'Index maps from two traversals', why: 'That is for rebuilding a tree, not transforming one.' },
        ],
        answer: 0,
      },
      solved: 'Visit / transform every node → DFS, any order.',
    },
    {
      kind: 'turn',
      title: 'Your turn: diameter',
      lines: ['Diameter needs the **heights below** every node.'],
      panels: [draw(T1, { el: { 1: '↑', 2: '↑', 3: '↑', 4: '↑' } })],
      task: {
        type: 'choose',
        question: 'Which design fits?',
        options: [
          { text: 'Postorder DFS, returning values up', why: '' },
          { text: 'Preorder DFS, passing values down', why: 'Parameters carry what is above a node; heights live below it.' },
          { text: 'BFS with a queue', why: 'This is not a per-level question.' },
        ],
        answer: 0,
      },
      solved: 'The answer depends on subtrees → postorder, bottom-up returns.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Four questions, four pictures',
      lines: ['Needs something from its **ancestors**? Pass it down as a parameter.', 'Needs something from its **children**? Return it (postorder).', 'About **levels** or distance from the root? BFS.', 'Needs the actual nodes on a **path**? Path array + push / pop.'],
      frames: [
        { say: 0, note: 'Top-down: values travel from the root to the leaves.', panels: [draw(T1, { el: states([1, 2, 3, 4], '↓'), es: states([1, 2, 3, 4], 'active') })] },
        { say: 1, note: 'Bottom-up: each child hands a value to its parent.', panels: [draw(T1, { el: states([1, 2, 3, 4], '↑'), es: states([1, 2, 3, 4], 'done') })] },
        { say: 2, note: 'Levels: 3 | 9, 20 | 15, 7.', panels: [draw(T1, { st: { 0: 'active', 1: 'visited', 2: 'visited', 3: 'done', 4: 'done' } }), arr(['3', '9 20', '15 7'], { label: 'levels' })] },
        { say: 3, note: 'A path: push 3, 20, 15. Pop when you leave a node.', panels: [draw(T1, { st: states([0, 2, 3], 'active'), es: states([2, 3], 'active') }), stk([3, 20, 15], 'path')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: Path Sum',
      lines: ['"Is there a root-to-leaf path whose values add up to `target`?"', 'Each node needs the sum **left over** from the nodes above it.'],
      panels: [draw(T1, { st: states([0, 2], 'visited'), el: { 2: 'rem?' } }), vars({ target: 38 })],
      task: {
        type: 'choose',
        question: 'How does the remaining sum travel?',
        options: [
          { text: 'Down, as a parameter (top-down)', why: '' },
          { text: 'Up, as a return value (bottom-up)', why: 'It depends on the nodes above, so it has to come from the parent.' },
          { text: 'Through a BFS queue', why: 'The question is about root-to-leaf paths, not levels.' },
        ],
        answer: 0,
      },
      solved: 'Info from ancestors → pass it down: `dfs(node, remaining)`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: list the paths',
      lines: ['"Return **every** root-to-leaf path whose sum is `target`."', 'Now you need the actual nodes, not just yes / no.'],
      panels: [draw(T1, { st: states([0, 2, 4], 'active'), es: states([2, 4], 'active') }), stk([3, 20, 7], 'path')],
      task: {
        type: 'choose',
        question: 'What do you add to the DFS?',
        options: [
          { text: 'A path array: push on entering, pop on leaving', why: '' },
          { text: 'A queue, level by level', why: 'Levels mix nodes from different paths.' },
          { text: 'Nothing: return the sum up', why: 'A single number cannot tell you which nodes were on the path.' },
        ],
        answer: 0,
      },
      solved: 'Actual nodes on a path → path array + push / pop (backtracking).',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'One walk, three moments to write',
      lines: ['Every DFS takes the same walk: left as far as possible, back, then right.', '**Preorder** writes a node when you first arrive.', '**Inorder** writes it after its left subtree.', '**Postorder** writes it when leaving for the last time.'],
      frames: (() => {
        const frames = [];
        const out = { pre: [], in: [], post: [] };
        const path = [];
        const left = [];
        const snap = (say, note, id) =>
          frames.push({
            say,
            note,
            panels: [
              draw(T1, { st: { ...states(left, 'done'), ...states(path, 'visited'), [id]: 'active' } }),
              table(['pre', 'in', 'post'], ['written so far'], [[seq(out.pre)], [seq(out.in)], [seq(out.post)]], [[say === 1 ? 'active' : ''], [say === 2 ? 'active' : ''], [say === 3 ? 'active' : '']]),
            ],
          });
        const go = (id) => {
          if (id === null) return;
          path.push(id);
          out.pre.push(v1(id));
          snap(1, `Arrive at ${v1(id)}: preorder writes ${v1(id)}.`, id);
          go(T1[id].left);
          out.in.push(v1(id));
          snap(2, `Back from ${v1(id)}'s left${T1[id].left === null ? ' (empty)' : ''}: inorder writes ${v1(id)}.`, id);
          go(T1[id].right);
          out.post.push(v1(id));
          path.pop();
          left.push(id);
          snap(3, `Leave ${v1(id)}: postorder writes ${v1(id)}.`, id);
        };
        go(0);
        return frames;
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: inorder on a new tree',
      lines: ['Inorder: left subtree, node, right subtree.'],
      panels: [draw(T6)],
      task: { type: 'order', question: 'Tap the nodes in inorder.', items: IN6.map(String), hint: 'Start as far left as you can go: 4.' },
      solved: `Inorder: ${seq(IN6)}. The root 1 sits after its whole left subtree.`,
      then: IN6.map((x, k) => ({ say: 0, note: `Write ${x}.`, panels: [draw(T6, { st: { ...states(IN6.slice(0, k).map((y) => idOf(T6, y)), 'done'), [idOf(T6, x)]: 'active' } }), arr(IN6.slice(0, k + 1), { label: 'inorder', highlights: { [k]: 'active' } })] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: preorder vs level order',
      lines: ['On `[3,9,20,null,null,15,7]`, preorder and level order are both 3, 9, 20, 15, 7.', 'Level order goes row by row.'],
      panels: [draw(T6)],
      task: {
        type: 'choose',
        question: 'On this tree, do preorder and level order still match?',
        options: [
          { text: `No: preorder ${seq(order(T6, 'pre').map(v6))}, level ${seq(levelOrderIds(T6).map(v6))}`, why: '' },
          { text: 'Yes, they always match', why: 'Preorder dives into 2\'s subtree (4, 5) before it reaches 3; level order finishes row 2 first.' },
          { text: `No: preorder ${seq(IN6)}`, why: 'That is inorder: the root 1 is in the middle.' },
        ],
        answer: 0,
      },
      solved: 'They matched on the first tree only by luck of its shape.',
      then: [
        { say: 1, note: 'Level order: row by row.', panels: [draw(T6, { st: { 0: 'done', 1: 'visited', 2: 'visited', 3: 'active', 4: 'active', 5: 'active' } }), arr(levelOrderIds(T6).map(v6), { label: 'level order' })] },
        { say: 0, note: 'Preorder: 2\'s whole subtree before 3.', panels: [draw(T6, { st: states([0, 1, 3, 4], 'done') }), arr(order(T6, 'pre').map(v6), { label: 'preorder', highlights: { 2: 'active', 3: 'active' } })] },
      ],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'The longest path bends at a node',
      lines: ['Diameter: the number of **edges** on the longest path between any two nodes.', 'The path bends at some node: down its left side and down its right side.', '`height(x)` counts **nodes** downward, so edges through a node = `height(left) + height(right)`.'],
      frames: [
        { say: 0, note: 'Tree [1,2,3,4,5]. Where does the longest path bend?', panels: [draw(T5)] },
        { say: 2, note: 'height(2) = 2: the path 2 → 4 has two nodes.', panels: [draw(T5, { st: { 0: 'active', 1: 'visited', 3: 'visited' }, el: { 1: 'h=2' }, sx: 1.3 })] },
        { say: 2, note: 'height(3) = 1.', panels: [draw(T5, { st: { 0: 'active', 2: 'visited' }, el: { 1: 'h=2', 2: 'h=1' }, sx: 1.3 })] },
        { say: 1, note: 'Bend at 1: 2 + 1 = 3 edges, the path 4 → 2 → 1 → 3.', panels: [draw(T5, { st: states([3, 1, 0, 2], 'active'), es: states([3, 1, 2], 'active'), sx: 1.3 }), vars({ edges: 3 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Brute force on a chain: height again and again',
      lines: ['`diameterOfBinaryTree` calls `height` on both children of **every** node.', 'Each `height` call walks the **whole subtree** again.'],
      frames: [
        ...BR4.frames.map((f) => ({
          say: f.seen.length ? 1 : 0,
          note: f.seen.length ? `diameter(${CH4[f.id].val}): height walks ${seq(f.seen.map((id) => CH4[id].val))} again.` : `diameter(${CH4[f.id].val}): its children are empty, nothing to walk.`,
          panels: [draw(CH4, { st: { ...states(f.seen, 'visited'), [f.id]: 'active' } }), arr(f.visits, { label: 'times height visited node', indexBase: 1, highlights: states(f.seen, 'active') })],
        })),
        { say: 1, note: `Total: ${BR4.visits.slice(1).reverse().join(' + ')} = ${BR4.total} height visits for 4 nodes.`, panels: [draw(CH4, { st: states(CH4.map((n) => n.id), 'done') }), arr(BR4.visits, { label: 'times height visited node', indexBase: 1, highlights: hl(4, (k) => (BR4.visits[k] === 3 ? 'bad' : '')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one node longer',
      lines: ['The same brute force on a chain of **5** nodes.'],
      panels: [draw(chain(5)), arr([0, '?', '?', '?', '?'], { label: 'times height visited node', indexBase: 1 })],
      task: { type: 'number', question: 'How many node visits do all the height calls make in total?', options: [5, 10, 15, 25], answer: BR5.total, hint: 'The root\'s height calls walk 4 nodes, the next node\'s walk 3, …' },
      solved: `${BR5.visits.slice(1).reverse().join(' + ')} = ${BR5.total}. The sum grows like n², so O(n²).`,
      then: [{ say: 0, note: 'The deepest node is walked by every ancestor.', panels: [draw(chain(5), { st: { 4: 'bad' } }), arr(BR5.visits, { label: 'times height visited node', indexBase: 1, highlights: { 4: 'bad' } })] }],
    },
  ],

  'optimized-dfs': [
    {
      kind: 'watch',
      title: 'Iterative preorder with an explicit stack',
      lines: ['Pop a node and write it.', 'Push **right first**, then left, so left is popped first.'],
      frames: PRE1.frames.map((f, k) => (k === 0 ? f : { say: 1, ...f })),
    },
    {
      kind: 'turn',
      title: 'Your turn: how tall does the stack get?',
      lines: ['The stack holds only the nodes still waiting.'],
      panels: [draw(T1), stk([3])],
      task: { type: 'number', question: 'In iterative preorder of this tree, what is the most nodes on the stack at once?', options: [1, 2, 3, 5], answer: PRE1.maxSize, hint: 'Each pop pushes at most two children.' },
      solved: 'At most 2: [20, 9] after popping 3, and [7, 15] after popping 20.',
    },
    {
      kind: 'watch',
      title: 'Iterative inorder: go left, pop, go right',
      lines: ['Go as far left as possible, pushing every node.', 'When `cur` is null, pop a node and write it.', 'Then continue with its right subtree.'],
      frames: IN1.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: iterative postorder',
      lines: ['`postorder` pops like preorder but pushes **left first, then right**.', 'That writes node, right, left; `out.reverse()` makes it left, right, node.'],
      panels: [draw(T1), stk([3])],
      task: { type: 'order', question: 'Tap the values in the order they go into `out`, before the reverse.', items: POST1.out.map((id) => String(v1(id))), hint: 'Right is pushed last, so it is popped first: 3, then 20.' },
      solved: `out = ${seq(POST1.out.map(v1))}. Reversed: ${seq(POST1.rev.map(v1))}.`,
      then: POST1.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: a very deep tree',
      lines: ['Recursive DFS keeps one **call stack** frame per pending call.', 'JavaScript engines allow roughly 10,000 frames.'],
      panels: [stk(['dfs(1)', 'dfs(2)', '…', 'dfs(9999)', 'dfs(10000)'], 'call stack'), vars({ chain: '100,000 nodes' })],
      task: {
        type: 'choose',
        question: 'Recursive DFS on this chain. What happens?',
        options: [
          { text: 'It can throw `RangeError: Maximum call stack size exceeded`', why: '' },
          { text: 'It finishes, just a little slower', why: 'The limit is the number of frames, not speed.' },
          { text: 'An explicit stack would hit the same limit', why: 'An explicit stack is an array, which does not have that frame limit.' },
        ],
        answer: 0,
      },
      solved: 'Deep chains need the explicit stack version.',
    },
  ],

  'optimized-bfs': [
    {
      kind: 'watch',
      title: 'Level order with level arrays',
      lines: ['Save the values of the current level.', 'Collect every child, left to right, into `next`; it becomes the new level.'],
      frames: LA6.frames,
    },
    {
      kind: 'watch',
      title: 'One queue and a head pointer',
      lines: ['Take the front with `queue[head++]`, add children at the back.', 'Read the size **before** a level: that many nodes belong to it.'],
      frames: HQ6.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the third level',
      lines: ['size = `queue.length − head`, read before the level starts.'],
      panels: [draw(T6, { st: { 0: 'done', 1: 'done', 2: 'done', 3: 'window', 4: 'window', 5: 'window' } }), arr(levelOrderIds(T6).map(v6), { label: 'queue array', pointers: [ptr(3, 'head')], highlights: { 0: 'muted', 1: 'muted', 2: 'muted' } })],
      task: { type: 'number', question: 'What size does the third level read?', options: [2, 3, 4, 6], answer: HQ6.sizes[2], hint: 'queue.length is 6 and head is 3.' },
      solved: '6 − 3 = 3: nodes 4, 5 and 6.',
    },
    {
      kind: 'turn',
      title: 'Your turn: why not shift()?',
      lines: ['`array.shift()` removes the front element.'],
      panels: [arr([4, 5, 6], { label: 'queue', highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'What does `queue.shift()` cost?',
        options: [
          { text: 'O(n): it re-indexes the whole array', why: '' },
          { text: 'O(1): it only touches the front', why: 'Every remaining element moves down one index.' },
          { text: 'Nothing extra if the queue is short', why: 'It is still O(n) per call; it adds up over a whole BFS.' },
        ],
        answer: 0,
      },
      solved: 'Use a head pointer, the toolkit\'s `Queue`, or a fresh `next` array per level.',
    },
  ],

  'optimized-top-down-bottom-up': [
    {
      kind: 'watch',
      title: 'Top-down: depth flows down',
      lines: ['`dfs(root, 1)`: the root is at depth 1.', 'Each node updates `best`, then tells its children "you are at depth + 1".'],
      frames: [{ say: 0, note: 'Start: dfs(3, 1).', panels: [draw(T1, { sx: 1.3 }), vars({ depth: 1, best: 0 })] }, ...TD1.frames, { say: 1, note: `Done: best = ${TD1.best}.`, panels: [draw(T1, { st: states(T1.map((n) => n.id), 'done'), el: { 1: 'd=2', 2: 'd=2', 3: 'd=3', 4: 'd=3' }, sx: 1.3 }), vars({ best: TD1.best })] }],
    },
    {
      kind: 'watch',
      title: 'Bottom-up: heights flow up',
      lines: ['`maxDepth(null)` is 0.', 'Ask both children first.', 'Combine on the way up: `1 + max(L, R)`.'],
      frames: [{ say: 0, note: 'The leaves\' children are null: they return 0.', panels: [draw(T1), vars({ 'maxDepth(null)': 0 })] }, ...BU1.frames.map((f) => ({ ...f, say: 2 }))],
    },
    {
      kind: 'turn',
      title: 'Your turn: count good nodes',
      lines: ['A node is **good** if no ancestor is larger.', 'The max above flows down: `dfs(node, maxSoFar)`.'],
      panels: [draw(GN, { sx: 1.2 })],
      task: { type: 'number', question: 'How many good nodes does this tree have?', options: [3, 4, 5, 6], answer: GN_RUN.count, hint: 'The root is always good. Compare each node with the max on its path from the root.' },
      solved: `${GN_RUN.count} good nodes: 3, 4, the lower 3, and 5.`,
      then: GN_RUN.calls,
    },
    {
      kind: 'turn',
      title: 'Your turn: record or return?',
      lines: ['Diameter **records** `L + R` as a candidate.', 'It **returns** `1 + max(L, R)` to the parent.'],
      panels: (() => {
        const D = build([8, 4, 9, 2, null, null, null, 1]);
        return [draw(D, { st: { 1: 'active' }, el: { 3: 'L=2' }, sx: 1.3 }), vars({ L: 2, R: 0 })];
      })(),
      task: { type: 'number', question: 'Node 4 has L = 2 and R = 0. What does it return to 8?', options: [2, 3, 4, 5], answer: 3, hint: 'The parent gets the one-sided value.' },
      solved: 'It records 2 + 0 = 2, but returns 1 + max(2, 0) = 3: a path from 8 can continue into one side only.',
    },
  ],

  'optimized-paths-lca': [
    {
      kind: 'watch',
      title: 'Path Sum II: push, record a copy, pop',
      lines: ['Push the node when entering.', 'At a leaf that meets the target, record a **copy** of `path`.', 'Pop when leaving the node: Choose → Explore → Undo.'],
      frames: [{ say: 0, note: 'Target 11. The path is empty.', panels: [draw(PS), stk([], 'path'), vars({ target: 11 })] }, ...PS_RUN.frames],
    },
    {
      kind: 'turn',
      title: 'Your turn: forget the copy',
      lines: ['Someone writes `res.push(path)` instead of pushing a copy.', 'Every node is still popped when the DFS leaves it.'],
      panels: [draw(PS), stk([], 'path (at the end)')],
      task: {
        type: 'choose',
        question: 'What does `res` hold after the run?',
        options: [
          { text: 'Two empty arrays: both entries are the same live `path`', why: '' },
          { text: '[3, 2, 6] and [3, 4, 4]', why: 'That needs copies. Without one, later pops change what was stored.' },
          { text: 'Nothing: the push is skipped', why: 'The push runs at both matching leaves; it stores a reference, not the values.' },
        ],
        answer: 0,
      },
      solved: 'Running it gives `[[], []]`: record a copy at the leaf.',
    },
    {
      kind: 'watch',
      title: 'LCA: what did I find in this subtree?',
      lines: ['p = 6, q = 4.', 'Reaching p or q: return it at once.', 'Found on **both** sides: this node is the LCA.', 'Found on one side only: pass that up.'],
      frames: [{ say: 0, note: 'Find the LCA of 6 and 4.', panels: [draw(LT, { st: { [idOf(LT, 6)]: 'visited', [idOf(LT, 4)]: 'visited' } }), vars({ p: 6, q: 4 })] }, ...LCA_A.frames],
    },
    {
      kind: 'turn',
      title: 'Your turn: far apart',
      lines: ['Same tree, now p = 7 and q = 8.'],
      panels: [draw(LT, { st: { [idOf(LT, 7)]: 'visited', [idOf(LT, 8)]: 'visited' } }), vars({ p: 7, q: 8 })],
      task: { type: 'number', question: 'Which node does the call on the root return?', options: [3, 5, 1, 2], answer: vL(LCA_B.ans), hint: 'Where does each one come back from at the root?' },
      solved: '7 comes back from the left, 8 from the right: both sides found, so the root 3 is the LCA.',
      then: LCA_B.frames.slice(-3),
    },
  ],

  'optimized-construction-serialization': [
    {
      kind: 'watch',
      title: 'Build from preorder + inorder',
      lines: ['`preorder[0]` is the root.', 'Find it in inorder: left of it is the left subtree, right of it the right subtree.', 'Recurse: the next preorder values belong to the left subtree, then the right one.', 'A **Map** finds the index; index ranges replace slicing.'],
      frames: CONS.frames.flatMap((f, k) => (k === 0 ? [{ ...f, say: 0 }, { ...f, say: 1, note: 'inorder splits into [9] | 3 | [15, 20, 7].' }] : [{ ...f, say: k === 1 ? 2 : 3 }])),
    },
    {
      kind: 'turn',
      title: 'Your turn: split the inorder',
      lines: [`preorder = [${seq(PRE6)}]`, 'The root is `preorder[0]` = 1.'],
      panels: [arr(PRE6, { label: 'preorder', pointers: [ptr(0, 'next')], highlights: { 0: 'active' } }), arr(IN6, { label: 'inorder' })],
      task: { type: 'cell', question: 'Tap the root in inorder.', panel: 1, answer: IN6.indexOf(1), hints: { 0: 'That is the leftmost value, not the root 1.' } },
      solved: 'Index 3: the 3 values to its left (4, 2, 5) are the left subtree, the 2 to its right (3, 6) the right subtree.',
      then: [{ say: 0, note: 'Left subtree: 3 nodes. Right subtree: 2 nodes.', panels: [arr(IN6, { label: 'inorder', pointers: [ptr(3, 'root', 'b')], highlights: { 0: 'window', 1: 'window', 2: 'window', 3: 'active', 4: 'visited', 5: 'visited' } }), draw(T6, { st: { 0: 'active', 1: 'window', 3: 'window', 4: 'window', 2: 'visited', 5: 'visited' } })] }],
    },
    {
      kind: 'watch',
      title: 'Null markers fix the shape',
      lines: ['Values alone are ambiguous: `[1,2]` in preorder fits 2 as left or as right child.', 'Write a marker for **every null child**.'],
      frames: [
        ...serializeFrames(SA),
        { say: 1, note: 'The other shape writes "1,#,2,#,#": the strings differ.', panels: [draw(SB), arr(tokensOf(SB), { label: 'tokens', highlights: { 1: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: read it back',
      lines: ['Deserialize with the **same** preorder.', 'Each call consumes one token; `#` returns null.'],
      panels: [arr(DES_TOKENS, { label: 'tokens' })],
      task: {
        type: 'choose',
        question: 'Which tree does "1,2,#,3,#,#,#" describe?',
        options: [
          { text: '2 is the left child of 1; 3 is the right child of 2', why: '' },
          { text: '1 has children 2 and 3', why: 'Then the string would be 1,2,#,#,3,#,#: 2\'s two empty children come before 3.' },
          { text: 'A left chain 1 → 2 → 3', why: 'The # right after 2 says 2 has no left child.' },
        ],
        answer: 0,
      },
      solved: 'One token per call, in preorder, rebuilds exactly one shape.',
      then: DES.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: vertical columns',
      lines: ['Root: (row 0, col 0).', 'Left child: (row + 1, col − 1). Right child: (row + 1, col + 1).'],
      panels: [
        draw(T1),
        table(CO1.map((c) => String(v1(c.id))), ['row', 'col'], CO1.map((c, k) => (k < 3 ? [c.row, c.col] : ['?', '?'])), CO1.map((_, k) => [k < 3 ? 'done' : '', k < 3 ? 'done' : ''])),
      ],
      task: { type: 'number', question: 'How many nodes land in column 0?', options: [1, 2, 3, 4], answer: col0.length, hint: '15 is the left child of 20, which is in column 1.' },
      solved: `Column 0 holds ${seq(col0)}. Sort by col, then row, then value, and group.`,
      then: [{ say: 1, note: '15 → (2, 0), 7 → (2, 2).', panels: [draw(T1, { st: states(CO1.filter((c) => c.col === 0).map((c) => c.id), 'active') }), table(CO1.map((c) => String(v1(c.id))), ['row', 'col'], CO1.map((c) => [c.row, c.col]), CO1.map((c) => (c.col === 0 ? ['active', 'active'] : ['done', 'done'])))] }],
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'The skeleton, run on a tree',
      lines: ['`dfs(node, down)`: `down` is information from the parent.', 'PREORDER spot: use `down` before the children run.', 'POSTORDER spot: combine `L` and `R`, update `answer`, return what the parent needs.', 'The empty tree returns 0.'],
      frames: [{ say: 3, note: 'Here `down` starts at 0 and is passed on as is; null returns 0.', panels: [draw(T1), vars({ answer: 0 })] }, ...TPL.frames],
    },
    {
      kind: 'turn',
      title: 'Your turn: the empty tree',
      lines: ['Blank 1: what is the empty tree\'s value?'],
      panels: [vars({ problem: 'isSymmetric', node: 'null' })],
      task: {
        type: 'choose',
        question: 'For a "symmetric" check, what should `null` return?',
        options: [
          { text: '`true`', why: '' },
          { text: '`0`', why: '0 is the empty value for height or sum, not for a yes / no check.' },
          { text: '`null`', why: 'null is the LCA\'s "nothing found here".' },
        ],
        answer: 0,
      },
      solved: 'Yes / no checks like balanced or symmetric start from `true`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: calls on null',
      lines: ['Every leaf has two `null` children.', 'Each one is still a recursive call.'],
      panels: [draw(T5)],
      task: { type: 'number', question: 'This tree has 5 nodes. How many calls land on null?', options: [4, 5, 6, 10], answer: NULLS5, hint: 'Count the empty child slots: 4 and 5 have two each, 3 has two.' },
      solved: 'n + 1 = 6 null calls: more than half of all 11 calls.',
      then: [{ say: 0, note: 'Six ∅ children: each one is a cheap base-case call.', panels: [draw(T5N)] }],
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'goodNodes: the count flows up',
      lines: ['`maxAbove` flows **down**: `dfs(node.left, m)`.', '`good` is 1 when `node.val >= maxAbove`.', 'Return `good + left count + right count`.'],
      frames: GI_RUN.all,
    },
    {
      kind: 'turn',
      title: 'Your turn: isBalanced on a chain',
      lines: ['`height` returns −1 for "unbalanced below".', 'At each node: −1 if `Math.abs(L - R) > 1`, else `1 + max(L, R)`.'],
      panels: [draw(BAL)],
      task: { type: 'number', question: 'What does `height(1)` return?', options: [-1, 0, 2, 3], answer: BAL_RUN.h, hint: 'At 1: L = height(2) and R = 0.' },
      solved: 'L = 2, R = 0: they differ by 2, so −1, and `isBalanced` is false.',
      then: BAL_RUN.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: `left ?? right`',
      lines: ['`left ?? right` returns `right` only when `left` is null or undefined.'],
      panels: [draw(build([5, 0]), { st: { 1: 'active' } }), vars({ left: 'node 0', right: 'null' })],
      task: {
        type: 'choose',
        question: '`left` is a TreeNode whose val is 0; `right` is null. What is `left ?? right`?',
        options: [
          { text: 'The node with val 0', why: '' },
          { text: 'null', why: '`left` is a node object, not null or undefined, so `??` keeps it.' },
          { text: '0', why: '`??` returns one of the two operands; it does not read `.val`.' },
        ],
        answer: 0,
      },
      solved: '`??` only skips null / undefined. A node is kept whatever its value.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'diameterOfBinaryTree([1,2,3,4,5])',
      lines: ['Each node is processed once, **after** its children (postorder).', 'Record the candidate `L + R` in `best`.', 'Return `1 + max(L, R)` to the parent.'],
      frames: [0, 1, 2, 3].map((k) => ({ say: k < 2 ? 0 : 1, note: `${DR.rows[k].node}: L = ${DR.rows[k].L}, R = ${DR.rows[k].R}, candidate ${DR.rows[k].cand}, best ${DR.rows[k].best}, returns ${DR.rows[k].ret}.`, panels: dryPanels(k) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the root',
      lines: ['Last in postorder: the root 1.', 'Its L and R are what its children returned.'],
      panels: dryPanels(4, { hideLast: true }),
      task: { type: 'number', question: 'What is node 1\'s candidate `L + R`?', options: [2, 3, 4, 5], answer: DR.rows[4].cand, hint: 'Read the returns of 2 and 3 on the edges.' },
      solved: `L = ${DR.rows[4].L}, R = ${DR.rows[4].R}: candidate ${DR.rows[4].cand}, best ${DR.rows[4].best}, returns ${DR.rows[4].ret}.`,
      then: [{ say: 1, note: `1: candidate ${DR.rows[4].cand}, best ${DR.rows[4].best}, returns ${DR.rows[4].ret}.`, panels: dryPanels(4) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the longest path',
      lines: ['best = 3 edges. The path bends at 1.'],
      panels: [draw(T5), vars({ best: DR.best })],
      task: { type: 'order', question: 'Tap the nodes along the longest path, starting at 4.', items: ['4', '2', '1', '3'], hint: 'Down the left side from 1 is 2 levels deep; the right side is 1.' },
      solved: `best = ${DR.best}: the path 4 → 2 → 1 → 3 has 3 edges.`,
      then: [{ say: 0, note: 'Longest path 4 → 2 → 1 → 3: 3 edges.', panels: [draw(T5, { st: states([3, 1, 0, 2], 'active'), es: states([3, 1, 2], 'active') }), vars({ best: DR.best })] }],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'The leaf check in Path Sum',
      lines: ['Wrong: report success when the recursion reaches null with remaining 0.', 'Right: check `!node.left && !node.right` on a real node.'],
      frames: [{ say: 0, note: 'Root 1, only a left child 2. Target 1.', panels: [draw(PL), vars({ target: 1 })] }, ...leafCheckFrames()],
    },
    {
      kind: 'turn',
      title: 'Your turn: the wrong base case',
      lines: ['Correct: `height(null) = 0`, `height(node) = 1 + max(L, R)`.', 'Someone writes `height(null) = 1`.'],
      panels: [draw(build([7], { nulls: true }), { st: { 0: 'active' } })],
      task: { type: 'number', question: 'What does the buggy height return for a single node?', options: [0, 1, 2, 3], answer: 1 + Math.max(1, 1), hint: 'Both children are null and each returns 1.' },
      solved: '1 + max(1, 1) = 2 instead of 1: every height comes out 1 too big.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the slow construction',
      lines: ['Build from preorder + inorder, but find each root with `inorder.indexOf(x)`.'],
      panels: [arr(PRE6, { label: 'preorder' }), arr(IN6, { label: 'inorder', highlights: { 0: 'visited', 1: 'visited', 2: 'visited', 3: 'active' } })],
      task: {
        type: 'choose',
        question: 'What is the fix?',
        options: [
          { text: 'A Map from value to inorder index, and index ranges instead of `slice`', why: '' },
          { text: 'Sort the inorder array first', why: 'Inorder order is the information: sorting destroys it.' },
          { text: 'Use `includes` instead of `indexOf`', why: 'It still scans the array and does not give the index.' },
        ],
        answer: 0,
      },
      solved: '`indexOf` / `slice` make construction O(n²); a Map and ranges keep it O(n).',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: pick the example to draw',
      lines: ['Draw a 5–7 node example.', 'Include a node with **one child** and an **unbalanced side**.'],
      panels: [draw(build([1, 2, 3, 4, 5, 6, 7]), { label: 'A' }), draw(build([1, 2, 3, null, 4, null, null, 5]), { label: 'B' }), draw(build([1]), { label: 'C' })],
      task: {
        type: 'choose',
        question: 'Which tree do you draw first?',
        options: [
          { text: 'B', why: '' },
          { text: 'A', why: 'Every node has 0 or 2 children, so one-child bugs (like a wrong leaf check) stay hidden.' },
          { text: 'C', why: 'A single node is an edge case to mention, but it tests almost nothing.' },
        ],
        answer: 0,
      },
      solved: 'B: 2 has one child, and its side is deeper than 3\'s.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the deep tree',
      lines: ['The interviewer says the tree may be a very long chain.'],
      panels: [draw(chain(4)), stk(['dfs(1)', 'dfs(2)', 'dfs(3)', 'dfs(4)'], 'call stack')],
      task: {
        type: 'choose',
        question: 'What do you offer?',
        options: [
          { text: 'The iterative version with an explicit stack', why: '' },
          { text: 'Nothing: recursion is always fine', why: 'One frame per level: a deep chain can overflow the call stack.' },
          { text: 'A BFS, because it is faster', why: 'The concern is stack usage, not speed.' },
        ],
        answer: 0,
      },
      solved: 'State complexity in n and h, mention the skewed worst case, and offer the iterative version.',
    },
  ],
};

// a turn's `then` frames link to the turn's own (shorter) lines; drop links that point past them
for (const list of Object.values(steps))
  for (const st of list)
    if (st.kind === 'turn' && st.then) st.then = st.then.map(({ say, ...f }) => (say !== undefined && say < st.lines.length ? { say, ...f } : f));

export default steps;
