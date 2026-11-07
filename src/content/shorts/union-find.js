// Shorts for Union-Find (M9). Format: src/content/shortSchema.js. Facts come only from topics/union-find/topic.js.
// Every parent pointer, rank, weight, id and count below comes from running the pattern's template on its "e.g."
// input: the toolkit UnionFind (union by rank, ra stays root on a tie, path-halving find), the Map getId, the
// weighted DSU (recursive find, weight[x] = x / parent[x]) and the online-additions loop.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (ids, s) => Object.fromEntries(ids.map((i) => [i, s]));
const range = (n) => Array.from({ length: n }, (_, i) => i);
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/union-find.js: ${msg}`);
};

// ---------- the toolkit UnionFind ----------
const UF = (n) => ({ parent: range(n), rank: new Array(n).fill(0), count: n });
// path halving; log gets [x, oldParent, newParent] for every rewrite that changes a pointer
function find(u, x, log = []) {
  while (u.parent[x] !== x) {
    const old = u.parent[x];
    u.parent[x] = u.parent[u.parent[x]];
    if (u.parent[x] !== old) log.push([x, old, u.parent[x]]);
    x = u.parent[x];
  }
  return x;
}
function union(u, a, b) {
  const log = [];
  let ra = find(u, a, log);
  let rb = find(u, b, log);
  if (ra === rb) return { ok: false, ra, rb, log };
  if (u.rank[ra] < u.rank[rb]) [ra, rb] = [rb, ra];
  u.parent[rb] = ra;
  const tie = u.rank[ra] === u.rank[rb];
  if (tie) u.rank[ra]++;
  u.count--;
  return { ok: true, ra, rb, tie, log };
}
const rootOf = (parent, x) => {
  while (parent[x] !== x) x = parent[x];
  return x;
};

// ---------- the parent forest: edges child → parent, roots on top ----------
// o.st: id → node state, o.es: child id → edge state, o.lab: id → label, o.el: child id → edge label
function forest(parent, ids, o = {}) {
  const kids = new Map(ids.map((i) => [i, []]));
  const roots = [];
  for (const i of ids) {
    if (parent[i] === i) roots.push(i);
    else {
      check(kids.has(parent[i]), `parent of ${i} is not drawn`);
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
    edges: ids.filter((i) => parent[i] !== i).map((i) => ({ from: `n${i}`, to: `n${parent[i]}`, ...(es[i] ? { state: es[i] } : {}), ...(o.el ? { label: o.el(i) } : {}) })),
  };
}

// ---------- connectivity: e.g. n = 7, edges arrive one by one ----------
const CN = 7;
const C_EDGES = [
  [0, 1],
  [2, 3],
  [4, 5],
  [1, 3],
  [3, 0],
  [5, 6],
];
const cu = UF(CN);
const cPic = (st = {}, es = {}, v = {}) => [forest(cu.parent, range(CN), { st, es }), arr([...cu.parent], { label: 'parent', highlights: { ...st } }), arr([...cu.rank], { label: 'rank' }), vars({ count: cu.count, ...v })];
const cStart = { say: 1, note: `e.g. n = ${CN}, ${C_EDGES.length} edges arriving one by one. Start: every node is its own root, count = ${CN}.`, panels: cPic() };
const cFrames = [];
let C_FAIL = null;
let C_OK = 0;
for (const [a, b] of C_EDGES) {
  const r = union(cu, a, b);
  if (!r.ok) {
    C_FAIL = [a, b];
    const [x, old, now] = r.log[0];
    cFrames.push({
      say: 0,
      note: `union(${a}, ${b}): find(${x}) walks ${x} → ${old} → ${now} and halves it: parent[${x}] = ${now}. One step next time.`,
      panels: cPic({ [x]: 'active', [now]: 'done' }, { [x]: 'active' }),
    });
    cFrames.push({ say: 2, note: `find(${b}) = ${r.rb} too. Same root: union returns **false**. Edge ${a}–${b} closes a cycle; count stays ${cu.count}.`, panels: cPic({ [a]: 'bad', [b]: 'bad', [r.ra]: 'done' }, {}, { 'failed edge': `${a}–${b}` }) });
    continue;
  }
  C_OK++;
  const why = r.tie ? `equal rank: parent[${r.rb}] = ${r.ra}, rank[${r.ra}] = ${cu.rank[r.ra]}` : `rank ${cu.rank[r.ra]} beats ${cu.rank[r.rb]}: parent[${r.rb}] = ${r.ra}`;
  const roots = a === r.ra && b === r.rb ? '' : ` (roots of ${a} and ${b})`;
  cFrames.push({ say: 1, note: `union(${a}, ${b}): roots ${r.ra} and ${r.rb}${roots}, ${why}. count = ${cu.count}.`, panels: cPic({ [r.ra]: 'active', [r.rb]: 'visited' }, { [r.rb]: 'active' }) });
}
check(JSON.stringify(cu.parent) === '[0,0,0,0,4,4,4]' && cu.count === 2 && JSON.stringify(C_FAIL) === '[3,0]', 'connectivity run');
check(cu.count === CN - C_OK, 'components = n − successful unions');
// the turn: edge 5–2 arrives
const C_T = { parent: [...cu.parent], rank: [...cu.rank], count: cu.count };
const C_TR = union(C_T, 5, 2);
check(C_TR.ok && C_TR.ra === 0 && C_TR.rb === 4 && C_T.count === 1, 'turn union(5, 2)');

// ---------- key mapping: e.g. stones (0,1) (1,1) (2,0) (2,3); row r → key r, column c → key c + 10001 ----------
const OFFSET = 10001;
const STONES = [
  [0, 1],
  [1, 1],
  [2, 0],
  [2, 3],
];
const stoneGrid = (st = {}) =>
  grid(
    range(3).map((r) => range(4).map((c) => (STONES.some(([sr, sc]) => sr === r && sc === c) ? 'S' : '·'))),
    range(3).map((r) => range(4).map((c) => st[`${r},${c}`] || '')),
    'stones (row, col)',
  );
const id = new Map();
const getId = (key) => {
  if (!id.has(key)) id.set(key, id.size);
  return id.get(key);
};
const keyName = (key) => (key >= OFFSET ? `c${key - OFFSET}` : `r${key}`);
const idTable = (hot = []) => ({ ...table([...id.keys()].map((k) => `${keyName(k)} (key ${k})`), ['id'], [...id.values()].map((v) => [String(v)]), 'id map'), states: [...id.keys()].map((k) => [hot.includes(k) ? 'active' : '']) });
const kIdFrames = STONES.map(([r, c]) => {
  const keys = [r, c + OFFSET];
  const fresh = keys.filter((k) => !id.has(k));
  keys.forEach(getId);
  const said = keys.map((k) => `${keyName(k)} → ${id.get(k)}${fresh.includes(k) ? '' : ' (seen)'}`).join(', ');
  return { say: 1, note: `Stone (${r},${c}): keys ${r} and ${c} + ${OFFSET} = ${c + OFFSET}. ${said}.`, panels: [stoneGrid({ [`${r},${c}`]: 'active' }), idTable(fresh)] };
});
const KN = id.size;
check(KN === 6, 'six distinct keys');
const ku = UF(KN);
const kLab = (i) => keyName([...id.keys()][i]);
const kFrames = STONES.map(([r, c], j) => {
  const a = id.get(r);
  const b = id.get(c + OFFSET);
  const res = union(ku, a, b);
  check(res.ok, `stone ${r},${c} links new keys`);
  return {
    say: 2,
    note: `${j === 0 ? `new UnionFind(${KN}). ` : ''}(${r},${c}): union(${a}, ${b}), i.e. r${r} with c${c}. ${kLab(res.rb)} goes under ${kLab(res.ra)}.`,
    panels: [stoneGrid({ [`${r},${c}`]: 'active' }), forest(ku.parent, range(KN), { lab: kLab, st: { [res.ra]: 'active', [res.rb]: 'visited' }, es: { [res.rb]: 'active' } })],
  };
});
const K_GROUPS = new Set(STONES.map(([r]) => find(ku, id.get(r)))).size;
check(K_GROUPS === 2, 'two stone groups');
// the turn: no offset, column c → key c
const K_BAD = (() => {
  const m = new Map();
  const g = (k) => (m.has(k) || m.set(k, m.size), m.get(k));
  STONES.forEach(([r, c]) => (g(r), g(c)));
  const u = UF(m.size);
  STONES.forEach(([r, c]) => union(u, g(r), g(c)));
  return new Set(STONES.map(([r]) => find(u, g(r)))).size;
})();
check(K_BAD === 1, 'collision merges everything');

// ---------- weighted: e.g. x / y = 2, y / z = 5, w / x = 3 ----------
const wp = {};
const ww = {};
const add = (x) => {
  if (!(x in wp)) (wp[x] = x), (ww[x] = 1);
};
function wfind(x) {
  if (wp[x] !== x) {
    const p = wp[x];
    const root = wfind(p);
    ww[x] *= ww[p];
    wp[x] = root;
  }
  return wp[x];
}
function wunion(a, b, k) {
  const ra = wfind(a);
  const rb = wfind(b);
  if (ra === rb) return null;
  wp[ra] = rb;
  ww[ra] = (k * ww[b]) / ww[a];
  return { ra, rb };
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(3)));
const wPic = (keys, st = {}, es = {}, p = wp, w = ww) => [
  forest(p, keys, { st, es, el: (k) => `×${fmt(w[k])}` }),
  { ...table(keys, ['parent', 'weight'], keys.map((k) => [p[k], fmt(w[k])]), 'x / parent'), states: keys.map((k) => (st[k] ? [st[k], st[k]] : ['', ''])) },
];
const WK = ['x', 'y', 'z', 'w'];
WK.forEach(add);
const wFrames = [];
wunion('x', 'y', 2);
wFrames.push({ say: 1, note: 'union(x, y, 2): roots x and y. parent[x] = y, weight[x] = 2 · 1 / 1 = 2.', panels: wPic(WK, { x: 'active' }, { x: 'active' }) });
wunion('y', 'z', 5);
wFrames.push({ say: 1, note: 'union(y, z, 5): parent[y] = z, weight[y] = 5. Now a chain x → y → z.', panels: wPic(WK, { y: 'active' }, { y: 'active' }) });
const W_BEFORE = { p: { ...wp }, w: { ...ww } };
wFrames.push({ say: 2, note: 'union(w, x, 3) first runs find(x): p = y, and find(y) returns the root z.', panels: wPic(WK, { x: 'visited', y: 'active', z: 'done' }, { x: 'active', y: 'active' }) });
const W_R = wunion('w', 'x', 3);
check(W_R.ra === 'w' && W_R.rb === 'z' && ww.x === 10 && wp.x === 'z' && ww.w === 30, 'weighted union(w, x, 3)');
const wMid = { ...wp, w: 'w' };
const wMidW = { ...ww, w: 1 };
wFrames.push({ say: 2, note: `Then weight[x] = 2 × weight[y] = 2 × 5 = ${ww.x}, and only now parent[x] = z. x / z = ${ww.x}.`, panels: wPic(WK, { x: 'active', z: 'done' }, { x: 'active' }, wMid, wMidW) });
wFrames.push({ say: 1, note: `ra = w, rb = z: parent[w] = z, weight[w] = 3 · weight[x] / weight[w] = 3 · 10 / 1 = ${ww.w}.`, panels: wPic(WK, { w: 'active' }, { w: 'active' }) });
const W_Q = ww.w / ww.y;
check(wfind('w') === wfind('y') && W_Q === 3 * 2, 'w / y = w / x · x / y');
wFrames.push({ say: 3, note: `Query w / y: same root z, so ${ww.w} / ${ww.y} = ${W_Q}. Check: w / x · x / y = 3 · 2 = 6.`, panels: wPic(WK, { w: 'done', y: 'done' }) });
// the turn: y / v = 4 with a new v
const WT = [...WK, 'v'];
add('v');
const W_TP = wPic(WT, { y: 'active', v: 'active' });
const W_T = wunion('y', 'v', 4);
check(W_T.ra === 'z' && W_T.rb === 'v' && ww.z === 0.8, 'turn union(y, v, 4)');

// ---------- online: e.g. a 2 × 4 grid, land added at 0, 2, 5, 1, 1, then 6 ----------
const ROWS = 2;
const COLS = 4;
const TOTAL = ROWS * COLS;
const ADDS = [0, 2, 5, 1, 1];
const nbs = (cell) => {
  const r = Math.floor(cell / COLS);
  const c = cell % COLS;
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]
    .filter(([y, x]) => y >= 0 && y < ROWS && x >= 0 && x < COLS)
    .map(([y, x]) => y * COLS + x);
};
const ou = UF(TOTAL);
const alive = new Array(TOTAL).fill(false);
let groups = 0;
const out = [];
const landGrid = (st = {}) =>
  grid(
    range(ROWS).map((r) => range(COLS).map((c) => r * COLS + c)),
    range(ROWS).map((r) => range(COLS).map((c) => st[r * COLS + c] || (alive[r * COLS + c] ? 'done' : 'muted'))),
    'cell id = r * 4 + c',
  );
const oPic = (st = {}, es = {}) => [landGrid(st), forest(ou.parent, range(TOTAL).filter((i) => alive[i]), { st, es }), vars({ groups, out: `[${out.join(', ')}]` })];
const oFrames = [];
for (const cell of ADDS) {
  if (alive[cell]) {
    out.push(groups);
    oFrames.push({ say: 0, note: `Land at ${cell} again: already alive. Push ${groups} unchanged; no second +1.`, panels: oPic({ [cell]: 'window' }) });
    continue;
  }
  alive[cell] = true;
  groups++;
  const live = nbs(cell).filter((nb) => alive[nb]);
  if (!live.length) {
    out.push(groups);
    oFrames.push({ say: 1, note: `Land at ${cell}: groups++ → ${groups}. No alive neighbour, so push ${groups}.`, panels: oPic({ [cell]: 'active' }) });
    continue;
  }
  oFrames.push({ say: 1, note: `Land at ${cell}: groups++ → ${groups}. Alive neighbours: ${live.join(', ')}.`, panels: oPic({ [cell]: 'active', ...hl(live, 'visited') }) });
  const before = groups;
  for (const nb of live) if (union(ou, cell, nb).ok) groups--;
  out.push(groups);
  oFrames.push({
    say: 2,
    note: `union(${cell}, ${live.join(`), union(${cell}, `)}): all ${before - groups} succeed, groups ${before} → ${groups}. One cell joined ${live.length} islands.`,
    panels: oPic({ [cell]: 'active', ...hl(live, 'done') }, hl(live, 'active')),
  });
}
check(out.join() === '1,2,3,1,1' && groups === 1 && ou.count === TOTAL - 3, 'online run');
const O_COUNT = ou.count;
// the turn: land at 6
const O_TP = oPic({ 6: 'active' });
const O_T = (() => {
  const u = { parent: [...ou.parent], rank: [...ou.rank], count: ou.count };
  let g = groups + 1;
  const res = nbs(6)
    .filter((nb) => alive[nb])
    .map((nb) => {
      const ok = union(u, 6, nb).ok;
      if (ok) g--;
      return [nb, ok];
    });
  return { g, res, count: u.count };
})();
check(O_T.g === 1 && JSON.stringify(O_T.res) === '[[2,true],[5,false]]' && O_T.count === 4, 'turn land at 6');

export default [
  {
    id: 'union-find-connectivity',
    title: 'Absorb each edge in one pointer: count groups, catch the cycle',
    steps: [
      {
        kind: 'watch',
        title: 'Only "which are connected?"',
        lines: ['"How many groups after these edges?" asks for no path.', 'DFS would re-traverse after each new edge: O(E · (V + E)). DSU absorbs each edge in near O(1).'],
        frames: [cStart],
      },
      {
        kind: 'watch',
        title: 'union links root to root',
        lines: ['`find(x)`: walk `parent` up to the root, halving the path on the way.', '`union(a, b)`: roots differ → the lower-rank root goes under the other, `count--`.', '`union` returns **false** when both roots are equal: the edge closes a cycle.'],
        frames: cFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"number of connected components"**, **"redundant connection"**, **"are x and y connected"**, **"groups / provinces / friend circles"**, **"equations a==b"**.'],
        frames: [
          {
            say: 0,
            note: `components = n − successful unions = ${CN} − ${C_OK} = ${cu.count}. Edge ${C_FAIL.join('–')} was the redundant one.`,
            panels: [forest(cu.parent, range(CN), { st: hl(range(CN), 'done') }), vars({ count: cu.count, 'successful unions': C_OK, 'failed union': C_FAIL.join('–') })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: edge 5–2 arrives',
        lines: ['Same forest. find(5) = 4 (rank 1), find(2) = 0 (rank 2).'],
        panels: [forest(cu.parent, range(CN), { st: { 5: 'active', 2: 'active' } }), arr([...cu.parent], { label: 'parent' }), arr([...cu.rank], { label: 'rank' })],
        task: {
          type: 'choose',
          question: 'Which pointer does union(5, 2) change?',
          options: [
            { text: `parent[${C_TR.rb}] = ${C_TR.ra}, count becomes ${C_T.count}` },
            { text: 'parent[5] = 2', why: 'That links nodes, not roots: 5 would leave 4 and 6 behind. union links find(5) with find(2).' },
            { text: 'parent[0] = 4', why: 'Root 0 has rank 2, root 4 rank 1: the lower-rank root goes under the higher one.' },
            { text: 'Nothing: union returns false', why: 'The roots differ (4 and 0), so 5 and 2 are not connected yet. The union succeeds.' },
          ],
          answer: 0,
        },
        solved: `Roots 4 and 0 differ; rank 1 < rank 2, so parent[4] = 0 and count drops to ${C_T.count}. One pointer merged two groups.`,
      },
    ],
  },

  {
    id: 'union-find-key-mapping',
    title: 'Give every key an id: rows and columns become nodes',
    steps: [
      {
        kind: 'watch',
        title: 'Linked through a shared row or column',
        lines: ['"Stones in the **same row or same column** are linked."', 'DSU works on ids 0..n−1, but here the links run through rows and columns.'],
        frames: [
          {
            say: 0,
            note: 'e.g. 4 stones. Comparing every pair of stones is O(n²); instead make rows and columns the nodes.',
            panels: [stoneGrid(), vars({ stones: STONES.map(([r, c]) => `(${r},${c})`).join(' ') })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Keys to ids, then a normal DSU',
        lines: ['Row r → key `r`; column c → key `c + 10001`: the offset keeps the two kinds apart.', '`getId(key)`: a new key gets `id.size`, a known key its old id.', 'Allocate the DSU once all keys have ids; each stone unions its row with its column.'],
        frames: [...kIdFrames, ...kFrames],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"same row or same column"**, **"share a common email"**, **"variables a, b, c…"**, **"accounts belong to the same person"**.'],
        frames: [
          {
            say: 0,
            note: `Stone groups = distinct roots among the stones' rows: ${K_GROUPS}. Stones sharing c1 or r2 joined through it.`,
            panels: [forest(ku.parent, range(KN), { lab: kLab, st: hl(range(KN), 'done') }), vars({ 'stone groups': K_GROUPS })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: drop the offset',
        lines: ['Same stones, but column c gets key `c` instead of `c + 10001`.'],
        panels: [stoneGrid(), vars({ 'row key': 'r', 'column key': 'c' })],
        task: {
          type: 'choose',
          question: 'How many stone groups does the DSU report now?',
          options: [
            { text: String(K_BAD) },
            { text: String(K_GROUPS), why: 'That is the right answer, but only with the offset. Row 0 and column 0 now share key 0, linking (0,1) with (2,0).' },
            { text: '4', why: 'The collision only adds wrong links; stones that share a row or column are still joined.' },
          ],
          answer: 0,
        },
        solved: 'Row 0 and column 0 collide on key 0, so both groups merge into 1. Two kinds of key need an offset.',
      },
    ],
  },

  {
    id: 'union-find-weighted',
    title: 'Store a ratio on each pointer: answer a / b from the root',
    steps: [
      {
        kind: 'watch',
        title: 'Same group is not enough',
        lines: ['"Given a / b = k, **evaluate the queries**."', 'A plain DSU only knows **same group**, not the quantity between two nodes.'],
        frames: [
          {
            say: 1,
            note: 'e.g. x / y = 2, y / z = 5. A plain DSU puts x, y, z in one group, but cannot say what x / z is.',
            panels: [forest({ x: 'y', y: 'z', z: 'z' }, ['x', 'y', 'z']), vars({ 'x / y': 2, 'y / z': 5, 'x / z': '?' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Weights along the parent pointers',
        lines: ['`weight[x] = value(x) / value(parent[x])`; a new node is its own parent, weight 1.', '`union(a, b, k)`: `parent[ra] = rb`, `weight[ra] = k * weight[b] / weight[a]`.', '`find(x)`: find the parent\'s root first, then `weight[x] *= weight[p]`, then `parent[x] = root`.', 'Same root: a / b = weight[a] / weight[b].'],
        frames: wFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"a / b = k"**, **"evaluate the queries"**, **"relative to"**, **"is the set of equations contradictory"**.'],
        frames: [
          {
            say: 0,
            note: 'Same idea, other quantities: ratios multiply, differences add, parity uses xor.',
            panels: [table(['ratios', 'differences', 'parity'], ['weight', 'along the path'], [['x / parent', 'multiply'], ['x − parent', 'add'], ['0 or 1', 'xor']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: y / v = 4',
        lines: ['A new node v. union(y, v, 4): ra = find(y) = z with weight[y] = 5; rb = v with weight[v] = 1.'],
        panels: W_TP,
        task: {
          type: 'choose',
          question: 'What does union(y, v, 4) set?',
          options: [
            { text: 'parent[z] = v, weight[z] = 4 / 5' },
            { text: 'parent[y] = v, weight[y] = 4', why: 'That re-points y, not its root: y would leave x, w and z. union links ra = find(y) = z.' },
            { text: 'parent[z] = v, weight[z] = 20', why: 'The formula backwards (4 · 5 / 1). Derive it: z / v = (y / v) / (y / z) = 4 / 5.' },
            { text: 'parent[z] = v, weight[z] = 4', why: '4 is y / v. The pointer leaves z, and z / v = (y / v) / (y / z) = 4 / 5.' },
          ],
          answer: 0,
        },
        solved: `weight[z] = k · weight[v] / weight[y] = 4 · 1 / 5 = ${fmt(ww.z)}: z / v = (y / v) / (y / z).`,
      },
    ],
  },

  {
    id: 'union-find-advanced',
    title: 'Islands appear one by one: +1 per land, −1 per real union',
    steps: [
      {
        kind: 'watch',
        title: 'Report after every operation',
        lines: ['"After each operation, return the **number of islands**."', 'The DSU is sized for every cell, but most cells are not land yet.'],
        frames: [
          {
            say: 1,
            note: `e.g. a 2 × 4 grid, cell id = r * 4 + c. All water: uf.count is already ${TOTAL}, yet there are 0 islands.`,
            panels: [grid(range(ROWS).map((r) => range(COLS).map((c) => r * COLS + c)), range(ROWS).map(() => range(COLS).map(() => 'muted')), 'cell id = r * 4 + c'), vars({ 'uf.count': TOTAL, islands: 0 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Count it yourself, online',
        lines: ['Already alive? Push the same count: no double counting.', 'New land: `alive[cell] = true; groups++`.', 'Each alive neighbour: `if (uf.union(cell, nb)) groups--`.'],
        frames: oFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"after each operation, return the number of islands"**, **"Alice and Bob can each traverse"**, **"rooted tree with one extra directed edge"**.'],
        frames: [
          {
            say: 0,
            note: `out = [${out.join(', ')}]. uf.count is ${O_COUNT}: it also counts the water cells. Keep your own groups.`,
            panels: [landGrid(), vars({ groups, 'uf.count': O_COUNT, out: `[${out.join(', ')}]` })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: land at 6',
        lines: ['Same grid. 6 has alive neighbours 2 (above) and 5 (left).'],
        panels: O_TP,
        task: {
          type: 'choose',
          question: 'What is pushed after land at 6?',
          options: [
            { text: String(O_T.g) },
            { text: '0', why: 'union(6, 5) returns false: after joining 2, 6 already shares a root with 5. Only successful unions subtract.' },
            { text: '2', why: 'New land adds 1, but union(6, 2) succeeds and subtracts 1: 6 joins the existing island.' },
            { text: String(O_T.count), why: 'That is uf.count: it still counts the water cells 3, 4 and 7 as groups.' },
          ],
          answer: 0,
        },
        solved: '+1 for the new land, −1 for union(6, 2); union(6, 5) fails because they are already one island. Push 1.',
      },
    ],
  },
];
