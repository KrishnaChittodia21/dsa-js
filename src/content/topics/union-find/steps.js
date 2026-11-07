// Step lessons for Union-Find (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every parent pointer, rank, size, compression rewrite, weight and count below comes from running the lesson's own
// code on the example input: the toolkit UnionFind (union by rank, ra stays root on a tie, path-halving find),
// the template DSU (union by size), the naive versions and the weighted DSU.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (ids, s) => Object.fromEntries(ids.map((i) => [i, s]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const check = (cond, msg) => {
  if (!cond) throw new Error(`union-find steps: ${msg}`);
};
const noSay = (frames) => frames.map(({ say, ...f }) => f);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- the lesson's code ----------
// toolkit UnionFind (implementation section)
const UF = (n) => ({ parent: Array.from({ length: n }, (_, i) => i), rank: new Array(n).fill(0), size: new Array(n).fill(1), count: n });
// path halving; log gets [x, oldParent, newParent] for every rewrite
function find(u, x, log = []) {
  while (u.parent[x] !== x) {
    const old = u.parent[x];
    u.parent[x] = u.parent[u.parent[x]];
    log.push([x, old, u.parent[x]]);
    x = u.parent[x];
  }
  return x;
}
function unionRank(u, a, b) {
  let ra = find(u, a);
  let rb = find(u, b);
  if (ra === rb) return { ok: false, ra, rb };
  const swapped = u.rank[ra] < u.rank[rb];
  if (swapped) [ra, rb] = [rb, ra];
  u.parent[rb] = ra;
  const tie = u.rank[ra] === u.rank[rb];
  if (tie) u.rank[ra]++;
  u.size[ra] += u.size[rb];
  u.count--;
  return { ok: true, ra, rb, tie, swapped };
}
// template DSU (union by size)
function unionSize(u, a, b) {
  let ra = find(u, a);
  let rb = find(u, b);
  if (ra === rb) return { ok: false, ra, rb };
  const swapped = u.size[ra] < u.size[rb];
  if (swapped) [ra, rb] = [rb, ra];
  u.parent[rb] = ra;
  u.size[ra] += u.size[rb];
  u.count--;
  return { ok: true, ra, rb, swapped };
}
// read-only walk to the root (for pictures; never rewrites)
const pathOf = (parent, x) => {
  const p = [x];
  while (parent[x] !== x) p.push((x = parent[x]));
  return p;
};
const rootOf = (parent, x) => pathOf(parent, x).at(-1);

// ---------- pictures: the parent forest (edges child → parent, roots on top) ----------
// st: id → node state, es: child id → edge state, lab: id → label, el: child id → edge label
function forest(parent, ids, o = {}) {
  const kids = new Map(ids.map((i) => [i, []]));
  const roots = [];
  for (const i of ids) {
    if (parent[i] === i) roots.push(i);
    else {
      check(kids.has(parent[i]), `parent of ${i} (${parent[i]}) is not drawn`);
      kids.get(parent[i]).push(i);
    }
  }
  const pos = {};
  let x = 0;
  const place = (v, d) => {
    const ch = kids.get(v);
    if (!ch.length) pos[v] = [x++, d];
    else {
      ch.forEach((c) => place(c, d + 1));
      pos[v] = [(pos[ch[0]][0] + pos[ch.at(-1)][0]) / 2, d];
    }
  };
  roots.forEach((r) => place(r, 0));
  const st = o.st || {};
  const es = o.es || {};
  return {
    kind: 'nodes',
    freeLayout: true,
    directed: true,
    ...(o.label ? { label: o.label } : {}),
    nodes: ids.map((i) => ({ id: `n${i}`, label: o.lab ? o.lab(i) : String(i), x: pos[i][0], y: pos[i][1], ...(st[i] ? { state: st[i] } : {}) })),
    edges: ids
      .filter((i) => parent[i] !== i)
      .map((i) => ({ from: `n${i}`, to: `n${parent[i]}`, ...(es[i] ? { state: es[i] } : {}), ...(o.el ? { label: o.el(i) } : {}) })),
  };
}
const ids = (n) => Array.from({ length: n }, (_, i) => i);
const parr = (p, o = {}) => arr([...p], { label: 'parent', ...o });
const rarr = (r, o = {}) => arr([...r], { label: 'rank', ...o });
const sarr = (s, o = {}) => arr([...s], { label: 'size', ...o });
const groupsOf = (parent, list) => {
  const g = new Map();
  for (const i of list) {
    const r = rootOf(parent, i);
    if (!g.has(r)) g.set(r, []);
    g.get(r).push(i);
  }
  return [...g.values()];
};
const fmtGroups = (gs, lab = String) => gs.map((g) => `{${g.map(lab).join(',')}}`).join(' ');

// =====================================================================================
// what: the lesson's own example, union(0,1), union(3,4), union(1,4), then find(0) vs find(3)
// =====================================================================================
const whatSteps = (() => {
  const u = UF(5);
  const P = (st = {}, es = {}) => [forest(u.parent, ids(5), { st, es }), parr(u.parent, { highlights: { ...st } })];
  const frames = [{ say: 0, note: 'Start: every item is its own group. parent[x] = x for all.', panels: P() }];
  for (const [a, b] of [
    [0, 1],
    [3, 4],
    [1, 4],
  ]) {
    const r = unionRank(u, a, b);
    frames.push({
      say: 1,
      note: `union(${a}, ${b}): roots ${r.ra} and ${r.rb} differ, so root ${r.rb} now points at ${r.ra}. Groups: ${fmtGroups(groupsOf(u.parent, ids(5)))}.`,
      panels: P({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }),
    });
  }
  check(same(u.parent, [0, 0, 2, 0, 3]), 'what: parent after unions');
  const p3 = pathOf(u.parent, 3);
  frames.push({
    say: 2,
    note: `find(0) = 0 and find(3) walks ${p3.join(' → ')}. Same root: 0 and 3 are in one group.`,
    panels: P({ ...hl(p3, 'visited'), 0: 'done' }, hl(p3.slice(0, -1), 'active')),
  });
  check(groupsOf(u.parent, ids(5)).length === 2, 'what: two groups');
  const p4 = pathOf(u.parent, 4);
  check(same(p4, [4, 3, 0]), 'what: path of 4');
  return [
    {
      kind: 'watch',
      title: 'Groups as parent pointers',
      lines: ['**find(x)** follows parent pointers up to the group\'s leader.', '**union(a, b)** merges two groups: one leader points at the other.', 'Same group exactly when `find(a) === find(b)`.'],
      frames,
    },
    {
      kind: 'turn',
      title: 'Walk the pointers yourself',
      lines: ['A root is a cell where `parent[x] === x`.', 'Start at 4 and follow `parent` until you reach one.'],
      panels: [parr(u.parent, { highlights: { 4: 'active' } })],
      task: { type: 'cell', question: 'Which index is the root (leader) of 4?', answer: 0, hints: { 3: 'parent[4] is 3, but parent[3] is 0, not 3: keep walking.', 4: '4 is not a root: parent[4] is 3.' } },
      solved: 'find(4) walks 4 → 3 → 0. Only the root names the group.',
      then: [{ note: '4 → 3 → 0: the root is 0, where parent[0] === 0.', panels: [forest(u.parent, ids(5), { st: { 4: 'visited', 3: 'visited', 0: 'done' }, es: { 4: 'active', 3: 'active' } }), parr(u.parent, { highlights: { 4: 'visited', 3: 'visited', 0: 'done' } })] }],
    },
  ];
})();

// =====================================================================================
// why: cables arrive one at a time; count after each; the cycle edge is caught by equal roots
// =====================================================================================
const whySteps = (() => {
  const u = UF(5);
  const P = (st = {}, es = {}, extra = {}) => [forest(u.parent, ids(5), { st, es }), vars({ count: u.count, ...extra })];
  const frames = [{ say: 0, note: '5 computers, no cables yet: 5 separate networks.', panels: P() }];
  for (const [a, b] of [
    [3, 4],
    [0, 1],
    [1, 4],
  ]) {
    const r = unionRank(u, a, b);
    check(r.ok, 'why: union should succeed');
    frames.push({ say: 0, note: `Cable ${a}–${b}: roots ${r.ra} and ${r.rb} differ. One pointer change; count drops to ${u.count}.`, panels: P({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }, { cable: `${a}-${b}` }) });
  }
  check(u.count === 2, 'why: count after 3 cables');
  const before = JSON.parse(JSON.stringify(u));
  const r = unionRank(u, 0, 3);
  check(!r.ok && r.ra === 0 && same(before.parent, u.parent), 'why: 0-3 closes a cycle');
  return [
    {
      kind: 'watch',
      title: 'Edges arriving over time',
      lines: ['Each new edge costs about O(1): two finds and one pointer.', 'No re-traversal of the whole graph after each edge.'],
      frames: [...frames, { say: 1, note: 'After each cable the answer (count) is ready. Nothing was re-walked.', panels: P({}, {}, { cables: 3 }) }],
    },
    {
      kind: 'turn',
      title: 'Cable 0–3 arrives',
      lines: ['Check the roots **before** adding the edge.'],
      panels: [forest(before.parent, ids(5), { st: { 0: 'active', 3: 'active' } }), vars({ cable: '0-3', 'find(0)': 0, 'find(3)': 0 })],
      task: {
        type: 'choose',
        question: 'find(0) and find(3) are both 0 before adding 0–3. What does that tell you?',
        options: [
          { text: 'The edge closes a cycle: 0 and 3 were already connected', why: '' },
          { text: 'The count drops to 1', why: 'The count drops only on a successful union. 0 and 3 are already in one group, and 2 is still alone.' },
          { text: 'We must re-run DFS to be sure', why: 'Equal roots already prove 0 and 3 are connected. That one check is the whole point.' },
        ],
        answer: 0,
      },
      solved: 'Equal roots before adding a–b means the edge closes a cycle. union returns false.',
      then: [{ note: 'union(0, 3) returns false. Nothing changes; count stays 2.', panels: [forest(u.parent, ids(5), { st: { 0: 'bad', 3: 'bad' } }), vars({ cable: '0-3', union: 'false', count: u.count })] }],
    },
  ];
})();

// =====================================================================================
// when: "is this graph a tree?" = n − 1 edges and no failed union
// =====================================================================================
const whenSteps = (() => {
  const runEdges = (n, edges) => {
    const u = UF(n);
    const res = [];
    const frames = [];
    for (const [a, b] of edges) {
      const r = unionRank(u, a, b);
      res.push(r.ok);
      const cells = edges.map((e, i) => [i < res.length ? String(res[i]) : '?']);
      const states = edges.map((e, i) => [i === res.length - 1 ? (r.ok ? 'active' : 'bad') : i < res.length ? 'done' : '']);
      frames.push({ u: JSON.parse(JSON.stringify(u)), r, a, b, tbl: table(edges.map(([x, y]) => `${x}-${y}`), ['union'], cells, states) });
    }
    return { u, res, frames };
  };
  const A = runEdges(4, [
    [0, 1],
    [1, 2],
    [2, 3],
  ]);
  check(A.res.every(Boolean) && A.u.count === 1, 'when: A is a tree');
  const Bedges = [
    [0, 4],
    [1, 2],
    [2, 4],
    [1, 0],
  ];
  const B = runEdges(5, Bedges);
  check(same(B.res, [true, true, true, false]) && B.u.count === 2, 'when: B has a failed union');
  return [
    {
      kind: 'watch',
      title: 'Is this graph a tree?',
      lines: ['A graph is a tree when it has **n − 1 edges** and **no union fails**.', 'Here n = 4, so we need 3 edges, all succeeding.'],
      frames: [
        ...A.frames.map((f) => ({ say: 0, note: `union(${f.a}, ${f.b}) succeeds: roots ${f.r.ra} and ${f.r.rb} were different.`, panels: [forest(f.u.parent, ids(4), { st: { [f.r.ra]: 'active' }, es: { [f.r.rb]: 'active' } }), f.tbl] })),
        { say: 1, note: '3 edges = n − 1, and no union failed: it is a tree.', panels: [forest(A.u.parent, ids(4), { st: hl(ids(4), 'done') }), A.frames.at(-1).tbl] },
      ],
    },
    {
      kind: 'turn',
      title: 'Same edge count, different story',
      lines: ['n = 5 and 4 edges: that is n − 1.', 'But look at the last union.'],
      panels: [forest(B.u.parent, ids(5), { st: { 1: 'bad', 0: 'bad' } }), B.frames.at(-1).tbl],
      task: {
        type: 'choose',
        question: 'Is this graph a tree?',
        options: [
          { text: 'Yes: 4 edges = n − 1', why: 'The edge count alone is not enough. union(1, 0) failed, so one edge closes a cycle.' },
          { text: 'No: union(1, 0) failed, so there is a cycle', why: '' },
          { text: 'Cannot tell without DFS', why: 'The union results already answer it: a failed union means a cycle.' },
        ],
        answer: 1,
      },
      solved: 'n − 1 edges with a failed union: a cycle somewhere, and node 3 is left alone (count 2).',
    },
  ];
})();

// =====================================================================================
// recognize: symmetric + transitive facts chain into groups
// =====================================================================================
const recognizeSteps = (() => {
  const L = 'abcd';
  const lab = (i) => L[i];
  const u = UF(4);
  const frames = [{ say: 0, note: 'Four items, no facts yet: four groups.', panels: [forest(u.parent, ids(4), { lab }), vars({ groups: 4 })] }];
  for (const [a, b] of [
    [0, 1],
    [2, 3],
    [1, 2],
  ]) {
    const r = unionRank(u, a, b);
    frames.push({ say: 0, note: `Fact ${lab(a)} ~ ${lab(b)}: union. Groups: ${fmtGroups(groupsOf(u.parent, ids(4)), lab)}.`, panels: [forest(u.parent, ids(4), { lab, st: { [r.ra]: 'active', [r.rb]: 'visited' }, es: { [r.rb]: 'active' } }), vars({ fact: `${lab(a)}~${lab(b)}`, groups: u.count })] });
  }
  const pd = pathOf(u.parent, 3);
  check(rootOf(u.parent, 0) === rootOf(u.parent, 3) && u.count === 1, 'recognize: a and d joined');
  frames.push({ say: 1, note: `Nobody said a ~ d, yet d walks ${pd.map(lab).join(' → ')}: same root as a. Transitivity did it.`, panels: [forest(u.parent, ids(4), { lab, st: { ...hl(pd, 'visited'), 0: 'done' }, es: hl(pd.slice(0, -1), 'active') }), vars({ 'a ~ d': 'yes' })] });
  return [
    {
      kind: 'watch',
      title: 'Chains of facts become groups',
      lines: ['Symmetric: a ~ b means b ~ a. Transitive: a ~ b and b ~ c give a ~ c.', 'Such a relation splits items into groups: DSU territory.'],
      frames,
    },
    {
      kind: 'turn',
      title: 'Which relation fits?',
      lines: ['Ask: is it **symmetric** and **transitive**?'],
      panels: [forest(u.parent, ids(4), { lab })],
      task: {
        type: 'choose',
        question: 'Which relation splits items into groups that DSU can track?',
        options: [
          { text: 'a is taller than b', why: 'Not symmetric: if a is taller than b, b is not taller than a.' },
          { text: 'a and b share an email', why: '' },
          { text: 'a is the parent of b', why: 'Not symmetric and not transitive: a parent of a parent is a grandparent.' },
        ],
        answer: 1,
      },
      solved: '"Share an email" is symmetric, and once you follow chains of it, transitive. That gives groups.',
    },
  ];
})();

// =====================================================================================
// intuition: the lesson's parent = [0,0,2,2,3] example, then the visual's edge list
// the section's link rule as in its example: parent[find(b)] = find(a); plain find (follow parent)
// =====================================================================================
const intuitionSteps = (() => {
  const p = [0, 0, 2, 2, 3];
  const P = (st = {}, es = {}, ptrs) => [forest(p, ids(5), { st, es }), parr(p, { highlights: { ...st }, ...(ptrs ? { pointers: ptrs } : {}) })];
  const f1 = pathOf(p, 1);
  const f4 = pathOf(p, 4);
  check(same(f1, [1, 0]) && same(f4, [4, 3, 2]), 'intuition: walks');
  const frames1 = [
    { say: 0, note: 'parent = [0, 0, 2, 2, 3]. Groups {0,1} and {2,3,4}.', panels: P() },
    { say: 1, note: `find(1): 1 → 0, and parent[0] = 0. Root 0.`, panels: P({ 1: 'visited', 0: 'done' }, { 1: 'active' }, [ptr(0, 'ra')]) },
    { say: 1, note: `find(4): 4 → 3 → 2, and parent[2] = 2. Root 2.`, panels: P({ 4: 'visited', 3: 'visited', 2: 'done' }, { 4: 'active', 3: 'active' }, [ptr(2, 'rb', 'b')]) },
  ];
  p[2] = 0;
  check(same(p, [0, 0, 0, 2, 3]), 'intuition: after union(1,4)');
  frames1.push({ say: 2, note: 'Roots differ: set parent[2] = 0. One write moved all of {2,3,4} into 0\'s group.', panels: P({ 2: 'active', 0: 'done' }, { 2: 'active' }) });

  // the visual: n = 6, edges [[0,1],[2,3],[1,3],[4,5],[0,2]]
  const q = ids(6);
  const Q = (st = {}, es = {}) => [forest(q, ids(6), { st, es }), parr(q, { highlights: { ...st } })];
  const frames2 = [{ say: 0, note: 'Six nodes, each its own root.', panels: Q() }];
  for (const [a, b] of [
    [0, 1],
    [2, 3],
    [1, 3],
    [4, 5],
  ]) {
    const ra = rootOf(q, a);
    const rb = rootOf(q, b);
    check(ra !== rb, 'intuition: visual unions succeed');
    q[rb] = ra;
    frames2.push({ say: 1, note: `Edge ${a}–${b}: find(${a}) = ${ra}, find(${b}) = ${rb}. Link root ${rb} under root ${ra}.`, panels: Q({ [ra]: 'active', [rb]: 'visited' }, { [rb]: 'active' }) });
  }
  check(same(q, [0, 0, 0, 2, 4, 4]), 'intuition: visual parent');
  const w2 = pathOf(q, 2);
  check(rootOf(q, 0) === 0 && rootOf(q, 2) === 0, 'intuition: 0-2 redundant');
  return [
    {
      kind: 'watch',
      title: 'One pointer merges two groups',
      lines: ['Each group is an upside-down tree; the root points to itself.', '**find(x)**: follow `parent` until a node points to itself.', '**union**: find both roots; if they differ, one root points at the other.'],
      frames: frames1,
    },
    {
      kind: 'watch',
      title: 'Edges, one by one',
      lines: ['Start with every node alone.', 'For each edge, link the two **roots**, never the nodes themselves.'],
      frames: frames2,
    },
    {
      kind: 'turn',
      title: 'The last edge: 0–2',
      lines: ['Find both roots first.', 'Equal roots mean the edge adds nothing new.'],
      panels: [parr(q, { highlights: { 2: 'active' } })],
      task: { type: 'cell', question: 'Edge 0–2 arrives. Which index is find(2)?', answer: 0, hints: { 2: 'parent[2] is 0, not 2: 2 is not a root.' } },
      solved: 'find(2) = 0 = find(0). Same root: edge 0–2 is redundant; it would close a cycle.',
      then: [{ note: `find(2): ${w2.join(' → ')}. Equal to find(0): edge 0–2 is redundant.`, panels: [forest(q, ids(6), { st: { 0: 'bad', 2: 'bad' }, es: { 2: 'active' } }), parr(q, { highlights: { 0: 'bad', 2: 'bad' } })] }],
    },
  ];
})();

// =====================================================================================
// brute-force: Naive A (label array relabels a group) and Naive B (quick-union chain)
// =====================================================================================
const bruteSteps = (() => {
  // Naive A: union(a, b) relabels every member of b's group
  const g = [0, 0, 0, 3, 3];
  const framesA = [{ say: 0, note: 'group = [0, 0, 0, 3, 3]. find(x) is just group[x]: O(1).', panels: [arr([...g], { label: 'group' }), vars({ op: 'union(0,3)' })] }];
  const from = g[3];
  const to = g[0];
  let changed = 0;
  for (let i = 0; i < g.length; i++) {
    const hit = g[i] === from;
    if (hit) {
      g[i] = to;
      changed++;
    }
    framesA.push({ say: 1, note: hit ? `group[${i}] was ${from}: relabel it to ${to}.` : `group[${i}] is not ${from}: skip, but we still had to look.`, panels: [arr([...g], { label: 'group', highlights: { [i]: hit ? 'active' : 'visited' }, pointers: [ptr(i, 'i')] }), vars({ scanned: i + 1, changed })] });
  }
  check(same(g, [0, 0, 0, 0, 0]) && changed === 2, 'brute: naive A');
  framesA.push({ say: 1, note: 'One union scanned all n cells: O(n). n unions: O(n²).', panels: [arr([...g], { label: 'group', highlights: hl(ids(5), 'done') }), vars({ scanned: 5, changed })] });

  const gT = [0, 0, 2, 2, 2, 5];
  const gT2 = gT.map((v) => (v === gT[4] ? gT[0] : v));
  const nChanged = gT.filter((v, i) => v !== gT2[i]).length;
  check(nChanged === 3, 'brute: turn relabel count');

  // Naive B: quick-union, parent[ra] = rb
  const p = ids(5);
  const nfind = (x) => {
    while (p[x] !== x) x = p[x];
    return x;
  };
  const framesB = [{ say: 2, note: 'Quick-union: five nodes, each its own root.', panels: [forest(p, ids(5)), parr(p)] }];
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ]) {
    const ra = nfind(a);
    const rb = nfind(b);
    p[ra] = rb;
    framesB.push({ say: 3, note: `union(${a}, ${b}): parent[${ra}] = ${rb}. The old root goes under the new node.`, panels: [forest(p, ids(5), { st: { [ra]: 'visited', [rb]: 'active' }, es: { [ra]: 'active' } }), parr(p, { highlights: { [ra]: 'active' } })] });
  }
  check(same(p, [1, 2, 3, 4, 4]), 'brute: chain');
  const chain = pathOf(p, 0);
  return [
    {
      kind: 'watch',
      title: 'Naive A: the label array',
      lines: ['Keep `group[x]`: find is O(1).', '`union` must relabel every member of one group (here b\'s group).'],
      frames: framesA,
    },
    {
      kind: 'turn',
      title: 'Count the relabels',
      lines: ['This union relabels b\'s group to a\'s label.'],
      panels: [arr(gT, { label: 'group', highlights: { 0: 'active', 4: 'active' } }), vars({ op: 'union(0,4)' })],
      task: { type: 'number', question: 'union(0, 4): how many cells change their label?', options: [1, 2, 3, 6], answer: nChanged, hint: 'group[4] is 2. Every cell labelled 2 gets relabelled to 0.' },
      solved: 'Cells 2, 3 and 4 change, and all 6 cells were scanned to find them.',
      then: [{ note: 'Every 2 became 0. The scan touched all n cells.', panels: [arr(gT2, { label: 'group', highlights: { 2: 'active', 3: 'active', 4: 'active' } })] }],
    },
    {
      kind: 'watch',
      title: 'Naive B: quick-union builds a chain',
      lines: ['Union just links roots: `parent[ra] = rb`.', 'Nothing stops the tree from becoming a **chain**.', 'Unions in order union(0,1), union(1,2), …', 'Each one puts the old root under the new node.'],
      frames: framesB,
    },
    {
      kind: 'turn',
      title: 'Walk the chain',
      lines: ['find follows `parent` until `parent[x] === x`.'],
      panels: [parr(p, { highlights: { 0: 'active' } })],
      task: { type: 'cell', question: 'Which index does find(0) return?', answer: 4, hints: { 0: 'parent[0] is 1: 0 is not a root.', 1: 'parent[1] is 2: keep walking.', 2: 'parent[2] is 3: keep walking.', 3: 'parent[3] is 4: one more step.' } },
      solved: `find(0) walks ${chain.join(' → ')}: one hop per node. A chain of length n makes find O(n).`,
      then: chain.map((x, k) => ({ note: k === chain.length - 1 ? `parent[4] = 4: root found after ${k} hops.` : `At ${x}: parent[${x}] = ${p[x]}, keep going.`, panels: [forest(p, ids(5), { st: { ...hl(chain.slice(0, k), 'visited'), [x]: k === chain.length - 1 ? 'done' : 'active' }, es: hl(chain.slice(0, k), 'active') }), parr(p, { pointers: [ptr(x, 'x')], highlights: { [x]: 'active' } })] })),
    },
  ];
})();

// =====================================================================================
// optimized: union by rank, full compression (recursive), path halving
// =====================================================================================
const optimizedSteps = (() => {
  const u = UF(5);
  const P = (st = {}, es = {}) => [forest(u.parent, ids(5), { st, es }), rarr(u.rank, { highlights: { ...st } })];
  const framesR = [{ say: 0, note: 'Five roots, every rank 0.', panels: P() }];
  for (const [a, b] of [
    [0, 1],
    [2, 0],
    [3, 4],
  ]) {
    const r = unionRank(u, a, b);
    const why = r.tie ? `Equal ranks: ${r.rb} goes under ${r.ra}, and rank[${r.ra}] grows to ${u.rank[r.ra]}.` : `rank[${r.ra}] = ${u.rank[r.ra]} > rank[${r.rb}] = ${u.rank[r.rb]}: shorter ${r.rb} goes under taller ${r.ra}. No rank change.`;
    framesR.push({ say: r.tie ? 1 : 0, note: `union(${a}, ${b}). ${why}`, panels: P({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }) });
  }
  check(same(u.parent, [0, 0, 0, 3, 3]) && same(u.rank, [1, 0, 0, 1, 0]), 'optimized: rank state');
  const before = JSON.parse(JSON.stringify(u));
  const r = unionRank(u, 4, 1);
  check(r.ra === 3 && r.rb === 0 && r.tie && u.rank[3] === 2, 'optimized: union(4,1)');

  // full compression on 4 → 3 → 2 → 1 → 0 (recursive)
  const c = [0, 0, 1, 2, 3];
  const C = (st = {}, es = {}) => [forest(c, ids(5), { st, es }), parr(c, { highlights: { ...st } })];
  const framesC = [{ say: 2, note: 'Before find(4): the chain 4 → 3 → 2 → 1 → 0.', panels: C() }];
  framesC.push({ say: 2, note: 'find(4) recurses: find(3), find(2), find(1), find(0). 0 is the root.', panels: C({ 4: 'visited', 3: 'visited', 2: 'visited', 1: 'visited', 0: 'done' }, { 4: 'active', 3: 'active', 2: 'active', 1: 'active' }) });
  const fullFind = (x) => {
    if (c[x] !== x) {
      const root = fullFind(c[x]);
      const old = c[x];
      c[x] = root;
      if (old !== root) framesC.push({ say: 2, note: `Returning: parent[${x}] = ${root} (was ${old}).`, panels: C({ [x]: 'active', [root]: 'done' }, { [x]: 'active' }) });
    }
    return c[x];
  };
  fullFind(4);
  check(same(c, [0, 0, 0, 0, 0]), 'optimized: full compression');
  framesC.push({ say: 2, note: 'Every node on the path now points straight at 0.', panels: C(hl([1, 2, 3, 4], 'done')) });

  // halving on the same chain
  const h = { parent: [0, 0, 1, 2, 3] };
  const hBefore = [...h.parent];
  const log = [];
  find(h, 4, log);
  check(same(log, [[4, 3, 2], [2, 1, 0]]) && same(h.parent, [0, 0, 0, 2, 2]), 'optimized: halving');
  const hAfter1 = [...hBefore];
  hAfter1[4] = 2;
  const hops3 = pathOf(h.parent, 3).length - 1;
  check(hops3 === 2 && pathOf(hBefore, 3).length - 1 === 3, 'optimized: hops of 3');

  return [
    {
      kind: 'watch',
      title: 'Union by rank',
      lines: ['Link the root of the **shorter** tree under the taller one.', 'Height grows only when two **equal**-rank trees meet.'],
      frames: framesR,
    },
    {
      kind: 'turn',
      title: 'Two rank-1 trees meet',
      lines: ['union(4, 1): find(4) = 3, find(1) = 0.', 'On a tie, `ra` (the root of the first argument) stays root.'],
      panels: [forest(before.parent, ids(5), { st: { 3: 'active', 0: 'active' } }), rarr(before.rank, { highlights: { 0: 'active', 3: 'active' } })],
      task: { type: 'cell', panel: 1, question: 'After union(4, 1), which index is the new root?', answer: 3, hints: { 0: 'rank[0] = rank[3]: no swap, so ra = 3 stays root and 0 goes under it.', 4: '4 is not a root; find(4) is 3.', 1: '1 is not a root; find(1) is 0.' } },
      solved: 'Equal ranks: 0 goes under 3 and rank[3] grows to 2. This is the only way height grows.',
      then: [{ note: 'parent[0] = 3, rank[3] = 2.', panels: [forest(u.parent, ids(5), { st: { 3: 'active', 0: 'visited' }, es: { 0: 'active' } }), rarr(u.rank, { highlights: { 3: 'active' } })] }],
    },
    {
      kind: 'watch',
      title: 'Full path compression',
      lines: ['Path compression re-points visited nodes closer to the root.', 'The recursive version sets `parent[x] = find(parent[x])`,', 'so on the way back every node points straight at the root.'],
      frames: framesC,
    },
    {
      kind: 'turn',
      title: 'Path halving, one step',
      lines: ['The toolkit uses **path halving**: a loop, no recursion.', '`parent[x] = parent[parent[x]]`, then `x = parent[x]`.'],
      panels: [forest(hBefore, ids(5), { st: { 4: 'active' } }), parr(hBefore, { pointers: [ptr(4, 'x')], highlights: { 4: 'active' } })],
      task: { type: 'cell', panel: 1, question: 'First step at x = 4. Which index does 4 point at after it?', answer: 2, hints: { 3: 'That is the old parent. Halving skips a level: parent[parent[4]].', 0: 'Halving skips one level per step, not all the way to the root.' } },
      solved: 'parent[4] = parent[3] = 2. Then x jumps to 2.',
      then: [
        { note: 'parent[4] = parent[3] = 2. x = 2.', panels: [forest(hAfter1, ids(5), { st: { 4: 'visited', 2: 'active' }, es: { 4: 'active' } }), parr(hAfter1, { pointers: [ptr(2, 'x')], highlights: { 4: 'visited', 2: 'active' } })] },
        { note: 'parent[2] = parent[1] = 0. x = 0, a root: stop.', panels: [forest(h.parent, ids(5), { st: { 2: 'visited', 0: 'done' }, es: { 2: 'active' } }), parr(h.parent, { pointers: [ptr(0, 'x')], highlights: { 2: 'visited', 0: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'What did halving buy?',
      lines: ['Before, 3 needed three hops: 3 → 2 → 1 → 0.'],
      panels: [forest(h.parent, ids(5), { st: { 3: 'active' } }), parr(h.parent, { highlights: { 3: 'active' } })],
      task: { type: 'number', question: 'After that one find(4), how many hops from 3 to the root now?', options: [1, 2, 3, 4], answer: hops3, hint: 'Follow parent from 3: parent[3], then its parent, until a root.' },
      solved: '3 → 2 → 0: two hops. One find shortened the paths of other nodes too.',
    },
  ];
})();

// =====================================================================================
// template: the DSU class (union by size, count), and the "Using it" recipe
// =====================================================================================
const templateSteps = (() => {
  const u = UF(6);
  const P = (st = {}, es = {}) => [forest(u.parent, ids(6), { st, es }), sarr(u.size, { highlights: { ...st } }), vars({ count: u.count })];
  const frames = [{ say: 0, note: 'new DSU(6): parent[i] = i, size all 1, count = 6.', panels: P() }];
  for (const [a, b] of [
    [0, 1],
    [2, 3],
    [4, 2],
  ]) {
    const r = unionSize(u, a, b);
    frames.push({
      say: 1,
      note: r.swapped ? `union(${a}, ${b}): size[${r.rb}] < size[${r.ra}], so swap: ${r.rb} goes under ${r.ra}. count = ${u.count}.` : `union(${a}, ${b}): sizes equal, no swap: ${r.rb} goes under ${r.ra}. count = ${u.count}.`,
      panels: P({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }),
    });
  }
  check(same(u.parent, [0, 0, 2, 2, 2, 5]) && same(u.size, [2, 1, 3, 1, 1, 1]) && u.count === 3, 'template: state');
  const before = JSON.parse(JSON.stringify(u));
  const r = unionSize(u, 1, 3);
  check(r.ok && r.swapped && r.ra === 2 && r.rb === 0 && u.size[2] === 5 && u.count === 2, 'template: union(1,3)');
  const r2 = unionSize(u, 0, 4);
  check(!r2.ok, 'template: union(0,4) fails');
  return [
    {
      kind: 'watch',
      title: 'The DSU class at work',
      lines: ['`size[root]` is the group size; `count` is the number of groups.', '`union` puts the smaller group under the larger, then `count--`.'],
      frames,
    },
    {
      kind: 'turn',
      title: 'union(1, 3)',
      lines: ['find(1) = 0 (size 2), find(3) = 2 (size 3).', '`if (size[ra] < size[rb]) [ra, rb] = [rb, ra]`'],
      panels: [forest(before.parent, ids(6), { st: { 0: 'active', 2: 'active' } }), sarr(before.size, { highlights: { 0: 'active', 2: 'active' } }), vars({ ra: 0, rb: 2 })],
      task: {
        type: 'choose',
        question: 'Which pointer does union(1, 3) change?',
        options: [
          { text: 'parent[0] = 2', why: '' },
          { text: 'parent[2] = 0', why: 'size[0] = 2 < size[2] = 3, so the swap fires: ra becomes 2 and the smaller root 0 goes under it.' },
          { text: 'parent[1] = 3', why: 'That links nodes, not roots. union always links root to root.' },
        ],
        answer: 0,
      },
      solved: 'The swap makes ra = 2. Then parent[0] = 2, size[2] = 5, count = 2.',
      then: noSay([
        { note: 'parent[0] = 2, size[2] = 2 + 3 = 5, count = 2.', panels: [forest(u.parent, ids(6), { st: { 2: 'active', 0: 'visited' }, es: { 0: 'active' } }), sarr(u.size, { highlights: { 2: 'active' } }), vars({ count: u.count })] },
        { note: 'union(0, 4): both roots are 2. Returns false (already together, a cycle). count stays 2.', panels: [forest(u.parent, ids(6), { st: { 0: 'bad', 4: 'bad', 2: 'done' } }), sarr(u.size), vars({ count: u.count, union: 'false' })] },
      ]),
    },
    {
      kind: 'turn',
      title: 'Using it',
      lines: ['The four steps for any DSU problem.'],
      panels: [vars({ count: u.count, groups: groupsOf(u.parent, ids(6)).length })],
      task: {
        type: 'order',
        question: 'Put the recipe in order.',
        items: ['Give each node an integer id', 'Decide which facts are unions', 'Process unions, watch for false', 'Answer: count, find, or buckets'],
        hint: 'You need ids before you can union, and unions before you can answer.',
      },
      solved: 'Ids, then union facts, then process them (false = redundant), then answer.',
    },
  ];
})();

// =====================================================================================
// implementation: countComponents with the toolkit (rank + componentSize), sizeOf, rank after compression
// =====================================================================================
const implementationSteps = (() => {
  const u = UF(6);
  const edges = [
    [0, 1],
    [2, 3],
    [0, 2],
    [4, 5],
  ];
  const P = (st = {}, es = {}) => [forest(u.parent, ids(6), { st, es, label: `count = ${u.count}` }), rarr(u.rank, { highlights: { ...st } }), arr([...u.size], { label: 'componentSize', highlights: { ...st } })];
  const frames = [{ say: 0, note: 'countComponents(6, edges): new UnionFind(6), count = 6.', panels: P() }];
  for (const [a, b] of edges) {
    const r = unionRank(u, a, b);
    frames.push({ say: 1, note: `union(${a}, ${b}): ${r.rb} under ${r.ra}${r.tie ? `, rank[${r.ra}] → ${u.rank[r.ra]}` : ''}. componentSize[${r.ra}] = ${u.size[r.ra]}, count = ${u.count}.`, panels: P({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }) });
  }
  check(u.count === 2 && same(u.parent, [0, 0, 0, 2, 4, 4]) && same(u.rank, [2, 0, 1, 0, 1, 0]) && same(u.size, [4, 1, 2, 1, 2, 1]), 'implementation: state');
  frames.push({ say: 2, note: 'All edges done: return uf.count = 2.', panels: P(hl([0, 4], 'done')) });
  const before = JSON.parse(JSON.stringify(u));
  const log = [];
  const root = find(u, 3, log);
  check(root === 0 && same(log, [[3, 2, 0]]) && u.size[0] === 4, 'implementation: sizeOf(3)');
  const after = JSON.parse(JSON.stringify(u));
  check(Math.max(...ids(6).map((i) => pathOf(u.parent, i).length - 1)) === 1 && u.rank[0] === 2, 'implementation: height 1, rank 2');
  return [
    {
      kind: 'watch',
      title: 'countComponents, line by line',
      lines: ['`const uf = new UnionFind(n)`', '`for (const [a, b] of edges) uf.union(a, b)`', '`return uf.count`'],
      frames,
    },
    {
      kind: 'turn',
      title: 'sizeOf(3)',
      lines: ['`sizeOf(x)` returns `componentSize[find(x)]`.', 'Only the root\'s entry is the group size.'],
      panels: [forest(before.parent, ids(6), { st: { 3: 'active' } }), arr([...before.size], { label: 'componentSize', highlights: { 3: 'active' } })],
      task: { type: 'number', question: 'What does uf.sizeOf(3) return?', options: [1, 2, 4, 6], answer: before.size[root], hint: 'Find 3\'s root first, then read componentSize at the root.' },
      solved: 'find(3) = 0 and componentSize[0] = 4. componentSize[3] = 1 is stale: 3 is not a root.',
      then: [{ note: 'find(3) halves on the way: parent[3] = parent[2] = 0. Root 0, size 4.', panels: [forest(after.parent, ids(6), { st: { 3: 'visited', 0: 'done' }, es: { 3: 'active' } }), arr([...after.size], { label: 'componentSize', highlights: { 0: 'done' } })] }],
    },
    {
      kind: 'turn',
      title: 'Rank after compression',
      lines: ['That find(3) made 0\'s tree only one level tall.', 'Rank is an **upper bound** on height.'],
      panels: [forest(after.parent, ids(6), { st: { 0: 'active' } }), rarr(after.rank.map((v, i) => (i === 0 ? '?' : v)), { highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'What is rank[0] now?',
        options: [
          { text: '2, unchanged', why: '' },
          { text: '1, the new height', why: 'Rank is never decreased. It only bounds the height, and that is fine.' },
          { text: '0', why: '0 is still the root of a 4-node group; find never touches rank.' },
        ],
        answer: 0,
      },
      solved: 'Compression made the real height 1, but rank[0] stays 2. Rank is an upper bound, never decreased.',
    },
  ];
})();

// =====================================================================================
// dry-run: the lesson's table, exactly. edges [[1,2],[1,3],[2,3]], DSU of size 4, nodes 1..3
// =====================================================================================
const dryRunSteps = (() => {
  const u = UF(4);
  const N = [1, 2, 3];
  const rows = [];
  const snap = [];
  for (const [a, b] of [
    [1, 2],
    [1, 3],
    [2, 3],
  ]) {
    const fa = find(u, a);
    const fb = find(u, b);
    const r = unionRank(u, a, b);
    rows.push({ edge: `[${a},${b}]`, fa, fb, act: r.ok ? `link ${r.rb} under ${r.ra}` : 'same → false', par: `[${u.parent.slice(1).join(', ')}]`, r });
    snap.push({ parent: [...u.parent], rank: [...u.rank] });
  }
  // the lesson's table
  check(same(rows.map((x) => [x.edge, String(x.fa), String(x.fb), x.par]), [
    ['[1,2]', '1', '2', '[1, 1, 3]'],
    ['[1,3]', '1', '3', '[1, 1, 1]'],
    ['[2,3]', '1', '1', '[1, 1, 1]'],
  ]), 'dry-run: table mismatch');
  check(snap[0].rank[1] === 1 && rows[2].r.ok === false, 'dry-run: rank / redundant');
  const tbl = (k, bad) =>
    table(
      rows.map((x) => x.edge),
      ['find(a)', 'find(b)', 'action', 'parent[1..3]'],
      rows.map((x, i) => (i <= k ? [x.fa, x.fb, x.act, x.par] : ['?', '?', '?', '?'])),
      rows.map((x, i) => [0, 1, 2, 3].map(() => (i === k ? (bad ? 'bad' : 'active') : i < k ? 'done' : ''))),
    );
  const pic = (parent, st = {}, es = {}) => [forest(parent, N, { st, es }), parr(parent.slice(1), { indexBase: 1, label: 'parent[1..3]', highlights: Object.fromEntries(Object.entries(st).map(([k, v]) => [k - 1, v])) })];
  const init = [0, 1, 2, 3];
  return [
    {
      kind: 'watch',
      title: 'Redundant edge, first two edges',
      lines: ['DSU of size 4 for nodes 1..3 (slot 0 unused).', 'Edge [1,2]: roots differ, link 2 under 1; rank[1] becomes 1.', 'Edge [1,3]: roots differ, link 3 under 1.'],
      frames: [
        { say: 0, note: 'Nodes 1, 2, 3 are their own roots.', panels: [...pic(init), tbl(-1)] },
        { say: 1, note: 'find(1) = 1, find(2) = 2: different. parent[2] = 1, rank[1] = 1.', panels: [...pic(snap[0].parent, { 1: 'active', 2: 'visited' }, { 2: 'active' }), tbl(0)] },
        { say: 2, note: 'find(1) = 1, find(3) = 3: different. rank[1] = 1 > rank[3] = 0, so parent[3] = 1.', panels: [...pic(snap[1].parent, { 1: 'active', 3: 'visited' }, { 3: 'active' }), tbl(1)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Edge [2,3]',
      lines: ['Find both roots before linking.'],
      panels: [parr(snap[1].parent.slice(1), { indexBase: 1, label: 'parent[1..3]', highlights: { 2: 'active' } }), tbl(1)],
      task: { type: 'cell', question: 'Which index is find(3)?', answer: 0, hints: { 2: 'parent[3] is 1, not 3: 3 is not a root.', 1: 'That is node 2. parent[3] points at 1.' } },
      solved: 'find(3) = 1 and find(2) = 1: same root. union returns false.',
      then: [
        { note: 'find(2) = 1, find(3) = 1. SAME root: union returns false.', panels: [...pic(snap[2].parent, { 2: 'bad', 3: 'bad', 1: 'done' }), tbl(2, true)] },
        { note: 'The first edge whose ends already share a root closes the cycle: answer [2,3].', panels: [...pic(snap[2].parent, { 1: 'done', 2: 'done', 3: 'done' }), tbl(2, true)] },
      ],
    },
  ];
})();

// =====================================================================================
// intuition-key-mapping: getId with a Map, Accounts Merge by first owner, stones row/column offset
// =====================================================================================
const keyMappingSteps = (() => {
  // getId
  const id = new Map();
  const getId = (key) => {
    if (!id.has(key)) id.set(key, id.size);
    return id.get(key);
  };
  const mapTbl = (hot) => table([...id.keys()], ['id'], [...id.values()].map((v) => [v]), [...id.keys()].map((k) => [k === hot ? 'active' : '']), 'id map');
  const framesId = [];
  for (const k of ['ann', 'bob', 'ann', 'cy']) {
    const had = id.has(k);
    const v = getId(k);
    framesId.push({ say: had ? 1 : 0, note: had ? `getId('${k}'): already in the map, reuse ${v}.` : `getId('${k}'): new key, gets the next free id ${v}.`, panels: [mapTbl(k), vars({ key: k, id: v })] });
  }
  check(same([...id.values()], [0, 1, 2]), 'key-mapping: ids');

  // Accounts Merge
  const accounts = [['a@x', 'b@x'], ['c@x'], ['d@x', 'b@x'], ['e@x', 'd@x']];
  const lab = (i) => `A${i}`;
  const u = UF(4);
  const owner = new Map();
  const oTbl = (hot, bad) => table([...owner.keys()], ['owner'], [...owner.values()].map((v) => [lab(v)]), [...owner.keys()].map((k) => [k === hot ? (bad ? 'window' : 'active') : '']), 'first owner');
  const framesAcc = [];
  let turnPanels = null;
  let turnThen = null;
  accounts.forEach((emails, i) => {
    for (const e of emails) {
      if (!owner.has(e)) {
        owner.set(e, i);
        if (i < 3) framesAcc.push({ say: 1, note: `${lab(i)} has ${e}: first time seen, ${lab(i)} owns it.`, panels: [oTbl(e), forest(u.parent, ids(4), { lab, st: { [i]: 'active' } })] });
      } else {
        const o = owner.get(e);
        if (i === 3) turnPanels = [oTbl(e, true), forest(u.parent, ids(4), { lab, st: { 3: 'active' } })];
        const r = unionRank(u, i, o);
        const fr = { say: 2, note: `${lab(i)} has ${e}, owned by ${lab(o)}: union(${i}, ${o}). ${lab(r.rb)} goes under ${lab(r.ra)}.`, panels: [oTbl(e, true), forest(u.parent, ids(4), { lab, st: { [r.ra]: 'active', [r.rb]: 'visited' }, es: { [r.rb]: 'active' } })] };
        if (i === 3) turnThen = fr;
        else framesAcc.push(fr);
      }
    }
  });
  check(owner.get('d@x') === 2 && same(u.parent, [2, 1, 2, 2]) && u.count === 2, 'key-mapping: accounts');
  const finalAcc = { note: `Groups: ${fmtGroups(groupsOf(u.parent, ids(4)), lab)}. Each account was visited once; no pair compared.`, panels: [oTbl(), forest(u.parent, ids(4), { lab, st: hl(ids(4), 'done') })] };

  // Stones: row r → id r, column c → id c + OFFSET
  const OFFSET = 10001;
  const stones = [
    [0, 0],
    [0, 2],
    [1, 2],
    [3, 3],
  ];
  const s = UF(2 * OFFSET);
  const used = [];
  for (const [r, c] of stones) for (const x of [r, c + OFFSET]) if (!used.includes(x)) used.push(x);
  used.sort((a, b) => a - b);
  const sl = (x) => (x >= OFFSET ? `c${x - OFFSET}` : `r${x}`);
  const SP = (st = {}, es = {}, extra = {}) => [forest(s.parent, used, { lab: sl, st, es }), vars(extra)];
  const framesSt = [{ say: 3, note: 'Rows and columns are the nodes. Stones: (0,0) (0,2) (1,2) (3,3).', panels: SP({}, {}, { OFFSET }) }];
  for (const [r, c] of stones) {
    const res = unionRank(s, r, c + OFFSET);
    framesSt.push({ say: 4, note: `Stone (${r},${c}): union(${r}, ${c} + ${OFFSET} = ${c + OFFSET}), i.e. r${r} with c${c}.`, panels: SP({ [res.ra]: 'active', [res.rb]: 'visited' }, { [res.rb]: 'active' }, { stone: `(${r},${c})` }) });
  }
  const rowRoots = new Set(stones.map(([r]) => find(s, r)));
  check(rowRoots.size === 2, 'key-mapping: stone groups');
  return [
    {
      kind: 'watch',
      title: 'Inventing integer ids',
      lines: ['A new key gets the next free id: `id.size`.', 'A key seen before gets its old id back.'],
      frames: framesId,
    },
    {
      kind: 'watch',
      title: 'Accounts Merge: link through an email',
      lines: ['Accounts are the nodes (ids 0..3).', 'Remember the **first account** that owned each email.', 'A later account with that email unions with the owner.'],
      frames: framesAcc,
    },
    {
      kind: 'turn',
      title: 'A3 has d@x',
      lines: ['The map says who owned d@x first.'],
      panels: turnPanels,
      task: {
        type: 'choose',
        question: 'A3 contains d@x. Which union runs?',
        options: [
          { text: 'union(3, 2): A2 first owned d@x', why: '' },
          { text: 'union(3, 0)', why: 'The map stores d@x → A2, not A0. A0 is only A2\'s root, and union finds roots itself.' },
          { text: 'Compare A3 with every account', why: 'That is the O(n²) pair check the map avoids.' },
        ],
        answer: 0,
      },
      solved: 'd@x → A2, so union(3, 2). A3 joins A2\'s group, which already holds A0.',
      then: noSay([turnThen, finalAcc]),
    },
    {
      kind: 'watch',
      title: 'Stones: rows and columns as nodes',
      lines: ['Most Stones Removed links stones in the same row or column.', 'Row r → id `r`; column c → id `c + 10001`.', 'The offset keeps row ids and column ids apart.', 'Make rows and columns the nodes.', 'Each stone unions its row with its column.'],
      frames: framesSt,
    },
    {
      kind: 'turn',
      title: 'Count the stone groups',
      lines: ['Groups with a stone = distinct roots among the stones\' rows.', 'Rows of the stones: 0, 0, 1, 3.'],
      panels: SP({}, {}, { rows: '0,0,1,3' }),
      task: { type: 'number', question: 'How many distinct roots do the stones\' rows have?', options: [1, 2, 3, 4], answer: rowRoots.size, hint: 'r0 and r1 both reach the same root through c2. r3 is linked only to c3.' },
      solved: 'r0 and r1 share a root through c2; r3 has its own: 2 groups.',
    },
  ];
})();

// =====================================================================================
// intuition-weighted: the lesson's weighted DSU (Map parent / weight), weight[x] = x / parent[x]
// =====================================================================================
const weightedSteps = (() => {
  const parent = new Map();
  const weight = new Map();
  const add = (x) => {
    if (!parent.has(x)) {
      parent.set(x, x);
      weight.set(x, 1);
    }
  };
  const flog = [];
  function wfind(x) {
    const p = parent.get(x);
    if (p !== x) {
      const root = wfind(p);
      const old = weight.get(x);
      weight.set(x, weight.get(x) * weight.get(p));
      parent.set(x, root);
      flog.push({ x, p, root, old, now: weight.get(x) });
    }
    return parent.get(x);
  }
  function wunion(a, b, k) {
    const ra = wfind(a);
    const rb = wfind(b);
    if (ra === rb) return null;
    parent.set(ra, rb);
    weight.set(ra, (k * weight.get(b)) / weight.get(a));
    return { ra, rb };
  }
  const keys = ['a', 'b', 'c', 'd'];
  const W = (list, st = {}, es = {}) => {
    const po = Object.fromEntries(list.map((k) => [k, parent.get(k)]));
    return [forest(po, list, { st, es, el: (k) => `×${weight.get(k)}` }), table(list, ['parent', 'weight'], list.map((k) => [parent.get(k), weight.get(k)]), list.map((k) => (st[k] ? [st[k], st[k]] : ['', ''])), 'x / parent')];
  };
  ['a', 'b', 'c'].forEach(add);
  const abc = ['a', 'b', 'c'];
  const frames = [{ say: 0, note: 'add a, b, c: each its own parent, weight 1.', panels: W(abc) }];
  wunion('a', 'b', 3);
  frames.push({ say: 1, note: 'union(a, b, 3): a / b = 3. Roots a, b: parent[a] = b, weight[a] = 3·1/1 = 3.', panels: W(abc, { a: 'active' }, { a: 'active' }) });
  wunion('b', 'c', 4);
  frames.push({ say: 1, note: 'union(b, c, 4): roots b, c. parent[b] = c, weight[b] = 4. Now a → b → c.', panels: W(abc, { b: 'active' }, { b: 'active' }) });
  check(parent.get('a') === 'b' && weight.get('a') === 3 && weight.get('b') === 4, 'weighted: before find');
  const preFind = { parent: new Map(parent), weight: new Map(weight) };
  frames.push({ say: 2, note: 'find(a): p = b. First call find(b): b\'s parent c is the root.', panels: W(abc, { a: 'visited', b: 'active', c: 'done' }, { a: 'active', b: 'active' }) });
  wfind('a');
  check(flog.at(-1).x === 'a' && flog.at(-1).now === 12 && weight.get('b') === 4 && parent.get('a') === 'c', 'weighted: find(a)');
  frames.push({ say: 3, note: 'Then weight[a] = 3 × weight[b] = 3 × 4 = 12, and parent[a] = c. a / c = 12.', panels: W(abc, { a: 'active', c: 'done' }, { a: 'active' }) });
  frames.push({ say: 4, note: 'Read straight off: a / b = weight[a] / weight[b] = 12 / 4 = 3, as given.', panels: W(abc, { a: 'done', b: 'done' }) });

  add('d');
  const turnPanels = W(keys, { d: 'active', a: 'active' });
  const r = wunion('d', 'a', 2);
  check(r.ra === 'd' && r.rb === 'c' && weight.get('d') === 24, 'weighted: union(d,a,2)');
  check(weight.get('d') / weight.get('b') === 2 * 3, 'weighted: d / b');
  return [
    {
      kind: 'watch',
      title: 'Weights along the parent pointers',
      lines: ['`weight[x] = value(x) / value(parent[x])`.', 'union(a, b, k) means a / b = k.', 'find must first find the root of the parent,', 'then `weight[x] *= weight[parent]`, then `parent[x] = root`.', 'Two nodes with the same root: a / c = (a / root) / (c / root).'],
      frames,
    },
    {
      kind: 'turn',
      title: 'union(d, a, 2)',
      lines: ['d / a = 2. find(d) = d (weight 1); find(a) = c (weight[a] = 12).', 'ra / rb = k · weight[b] / weight[a], here with a = d and b = a.'],
      panels: turnPanels,
      task: { type: 'number', question: 'After union(d, a, 2), what is weight[d]?', options: [2, 6, 14, 24], answer: weight.get('d'), hint: 'k · weight[a] / weight[d] = 2 · 12 / 1.' },
      solved: 'weight[d] = 2 · 12 / 1 = 24: d / c = 24.',
      then: [
        { note: 'parent[d] = c, weight[d] = 24.', panels: W(keys, { d: 'active', c: 'done' }, { d: 'active' }) },
        { note: 'Check: d / b = 24 / 4 = 6, and d / a · a / b = 2 · 3 = 6.', panels: W(keys, { d: 'done', b: 'done' }) },
      ],
    },
    {
      kind: 'turn',
      title: 'Order inside find',
      lines: ['Back to the moment before find(a): a → b → c.', 'weight[a] is relative to its current parent b.'],
      panels: (() => {
        const list = abc;
        const po = Object.fromEntries(list.map((k) => [k, preFind.parent.get(k)]));
        return [forest(po, list, { st: { a: 'active' }, el: (k) => `×${preFind.weight.get(k)}` })];
      })(),
      task: {
        type: 'order',
        question: 'Order the work inside find(a).',
        items: ['root = find(parent b)', 'weight[a] *= weight[b]', 'parent[a] = root'],
        hint: 'You need b\'s weight relative to the root before using it, and the old parent until you have used it.',
      },
      solved: 'Find the parent\'s root first, multiply with the parent\'s weight, and only then re-point a.',
    },
  ];
})();

// =====================================================================================
// mistakes: parents vs roots, 1-indexed input + counting unused slots, deletions
// =====================================================================================
const mistakesSteps = (() => {
  const p = [0, 0, 1, 0];
  check(p[2] !== p[3] && rootOf(p, 2) === rootOf(p, 3), 'mistakes: parents differ, roots equal');

  // nodes 1..4, edges [[1,2],[3,4]]
  const u = UF(5);
  const frames = [
    { say: 0, note: 'Nodes are 1..4. new UnionFind(4) has slots 0..3: node 4 has no slot.', panels: [parr([0, 1, 2, 3]), vars({ need: 'index 4', last: 3 })] },
    { say: 0, note: 'Allocate n + 1 = 5 slots. Slot 0 is never a real node. count starts at 5.', panels: [parr(u.parent, { highlights: { 0: 'muted' } }), vars({ count: u.count })] },
  ];
  for (const [a, b] of [
    [1, 2],
    [3, 4],
  ]) {
    const r = unionRank(u, a, b);
    frames.push({ say: 1, note: `union(${a}, ${b}): parent[${r.rb}] = ${r.ra}. count = ${u.count}.`, panels: [parr(u.parent, { highlights: { 0: 'muted', [r.rb]: 'active' } }), vars({ count: u.count })] });
  }
  const real = groupsOf(u.parent, [1, 2, 3, 4]).length;
  check(u.count === 3 && real === 2, 'mistakes: count vs real groups');
  frames.push({ say: 1, note: `uf.count = ${u.count}, but slot 0 is counted as a group. Real groups: ${real}.`, panels: [parr(u.parent, { highlights: { 0: 'bad' } }), vars({ 'uf.count': u.count, real })] });
  return [
    {
      kind: 'turn',
      title: 'Parents or roots?',
      lines: ['Mistake 1: comparing `parent[a] === parent[b]`.'],
      panels: [forest(p, ids(4), { st: { 2: 'active', 3: 'active' } }), parr(p, { highlights: { 2: 'active', 3: 'active' } })],
      task: {
        type: 'choose',
        question: 'parent[2] = 1 and parent[3] = 0. Are 2 and 3 in the same group?',
        options: [
          { text: 'Yes: both reach root 0', why: '' },
          { text: 'No: their parents differ', why: 'Parents can differ inside one group. Only the roots decide: find(2) = find(3) = 0.' },
        ],
        answer: 0,
      },
      solved: 'find(2) walks 2 → 1 → 0, find(3) walks 3 → 0. Same root, same group.',
    },
    {
      kind: 'watch',
      title: '1-indexed input and unused slots',
      lines: ['Mistake 5: nodes 1..n need `n + 1` slots.', 'Mistake 8: `uf.count` counts every slot, used or not; count only the ids you used.'],
      frames,
    },
    {
      kind: 'turn',
      title: 'Edges get removed',
      lines: ['Mistake 7: DSU can merge groups but never split them.'],
      panels: [forest(u.parent, [1, 2, 3, 4], { es: { 2: 'bad' } }), vars({ remove: '1-2' })],
      task: {
        type: 'choose',
        question: 'The problem later deletes edge 1–2. What does the lesson suggest?',
        options: [
          { text: 'Process the operations in reverse: removals become additions', why: '' },
          { text: 'Set parent[2] = 2 to split it off', why: 'DSU cannot un-merge: other nodes may hang below 2 or reach the root through it.' },
          { text: 'Keep DSU as is; deletions are free', why: 'DSU has no delete operation at all.' },
        ],
        answer: 0,
      },
      solved: 'Run the timeline backwards: each removal becomes an addition, which DSU handles.',
    },
  ];
})();

// =====================================================================================
// interview-tips: components = n − successful unions; grid cell → id with r * cols + c
// =====================================================================================
const tipsSteps = (() => {
  const n = 6;
  const u = UF(n);
  let ok = 0;
  const P = (st = {}, es = {}, extra = {}) => [forest(u.parent, ids(n), { st, es }), vars({ n, unions: ok, 'n-unions': n - ok, count: u.count, ...extra })];
  const frames = [{ say: 0, note: 'n = 6, no unions yet: 6 components.', panels: P() }];
  for (const [a, b] of [
    [5, 4],
    [3, 2],
    [4, 3],
    [2, 5],
    [1, 0],
  ]) {
    const r = unionRank(u, a, b);
    if (r.ok) ok++;
    frames.push({ say: 0, note: r.ok ? `union(${a}, ${b}) succeeds: ${ok} successful, count = ${u.count} = ${n} − ${ok}.` : `union(${a}, ${b}) fails (same root ${r.ra}): count stays ${u.count}.`, panels: P(r.ok ? { [r.ra]: 'active', [r.rb]: 'visited' } : { [a]: 'bad', [b]: 'bad' }, r.ok ? { [r.rb]: 'active' } : {}) });
  }
  check(ok === 4 && u.count === n - ok && u.count === 2, 'tips: identity');
  const R = 2;
  const COLS = 4;
  const gridCells = Array.from({ length: R }, (_, r) => Array.from({ length: COLS }, (_, c) => `${r},${c}`));
  const gridSt = gridCells.map((row, r) => row.map((_, c) => (r === 1 && c === 2 ? 'active' : '')));
  const ans = 1 * COLS + 2;
  return [
    {
      kind: 'watch',
      title: 'components = n − successful unions',
      lines: ['Every successful union removes exactly one component.', 'A failed union changes nothing.'],
      frames,
    },
    {
      kind: 'turn',
      title: 'Grid cell to id',
      lines: ['State how you map inputs to ids.', 'For a grid: `r * cols + c`. Here cols = 4.'],
      panels: [{ kind: 'grid', cells: gridCells, states: gridSt, label: 'grid (r,c)' }, arr(ids(R * COLS), { label: 'ids' })],
      task: { type: 'cell', panel: 1, question: 'Which id does cell (1, 2) get?', answer: ans, hints: { 3: 'That is 1 + 2. Multiply the row by cols first: 1 · 4 + 2.', 2: 'That ignores the row: add r · cols.' } },
      solved: '1 · 4 + 2 = 6. Each cell gets a unique integer id, no string keys needed.',
    },
  ];
})();

export default {
  what: whatSteps,
  why: whySteps,
  when: whenSteps,
  recognize: recognizeSteps,
  intuition: intuitionSteps,
  'brute-force': bruteSteps,
  optimized: optimizedSteps,
  template: templateSteps,
  implementation: implementationSteps,
  'dry-run': dryRunSteps,
  'intuition-key-mapping': keyMappingSteps,
  'intuition-weighted': weightedSteps,
  mistakes: mistakesSteps,
  'interview-tips': tipsSteps,
};
