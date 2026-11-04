// Step lessons for Graphs, part 2 (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every flood fill, BFS wave, frontier, colour, mask, label and queue below comes from running the algorithm in JS
// with the lesson's own neighbour order (DIRS = down, up, right, left; the implementation's up, down, left, right).
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const graph = (nodes, edges, label) => ({ kind: 'nodes', freeLayout: true, nodes, edges, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const mapG = (g, f) => g.map((row, r) => row.map((v, c) => f(v, r, c)));
const cn = (r, c) => `${r},${c}`;
const setText = (s) => `{${[...s].join(',')}}`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`graphs/steps-2.js: ${msg}`);
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // the lesson's order: down, up, right, left
const inside = (g, r, c) => r >= 0 && r < g.length && c >= 0 && c < g[0].length;

// ---------- grids: flood fill (recursive sink, DIRS order) and component counting ----------
function islands(g, land = 1, dirs = DIRS) {
  const seen = mapG(g, () => false);
  const comps = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++) {
      if (g[r][c] !== land || seen[r][c]) continue;
      const cells = [];
      const sink = (y, x) => {
        if (!inside(g, y, x) || g[y][x] !== land || seen[y][x]) return;
        seen[y][x] = true;
        cells.push([y, x]);
        for (const [dr, dc] of dirs) sink(y + dr, x + dc);
      };
      sink(r, c);
      comps.push(cells);
    }
  return comps;
}
const DIRS8 = [...DIRS, [1, 1], [1, -1], [-1, 1], [-1, -1]];

// ---------- grids: BFS from one or many sources (the template's gridBfs) ----------
function gridBfs(g, sources, isWall) {
  const dist = mapG(g, () => -1);
  const queue = [];
  for (const [r, c] of sources) {
    dist[r][c] = 0;
    queue.push([r, c]);
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(g, nr, nc)) continue;
      if (isWall(g[nr][nc]) || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
  }
  const max = Math.max(...dist.flat());
  const waves = Array.from({ length: max + 1 }, (_, d) => queue.filter(([r, c]) => dist[r][c] === d));
  return { dist, queue, waves, max };
}
// the dist grid after wave k: later cells hidden, walls muted
const waveGrid = (g, B, k, isWall, label) =>
  grid(
    mapG(g, (v, r, c) => (isWall(v) ? '#' : B.dist[r][c] === -1 || B.dist[r][c] > k ? '·' : B.dist[r][c])),
    mapG(g, (v, r, c) => (isWall(v) ? 'muted' : B.dist[r][c] === k ? 'active' : B.dist[r][c] !== -1 && B.dist[r][c] < k ? 'done' : '')),
    label,
  );

// ====================== optimized-grid ======================
// 1) neighbours of the corner cell (0, 3) in a 3×4 grid
const NB_G = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
const NB_AT = [0, 3];
const nbFrames = (() => {
  const out = [];
  const ok = [];
  for (const [dr, dc] of DIRS) {
    const nr = NB_AT[0] + dr;
    const nc = NB_AT[1] + dc;
    const off = !inside(NB_G, nr, nc);
    if (!off) ok.push(cn(nr, nc));
    out.push({
      say: 1,
      note: off ? `Direction (${dr}, ${dc}) → cell (${nr}, ${nc}): off the grid, \`continue\`.` : `Direction (${dr}, ${dc}) → cell (${nr}, ${nc}): inside, a neighbour.`,
      panels: [
        grid(
          mapG(NB_G, (_, r, c) => (r === NB_AT[0] && c === NB_AT[1] ? 'u' : '·')),
          mapG(NB_G, (_, r, c) => (r === NB_AT[0] && c === NB_AT[1] ? 'active' : r === nr && c === nc ? 'window' : ok.includes(cn(r, c)) ? 'done' : '')),
          '3 × 4 grid',
        ),
        vars({ dr, dc, nr, nc }),
      ],
    });
  }
  return { out, ok };
})();
check(nbFrames.ok.join(' ') === '1,3 0,2', 'corner neighbours');

// 2) counting islands
const ISL_G = [[1, 1, 0, 1], [0, 1, 0, 1], [1, 0, 0, 0], [1, 0, 1, 1]];
const ISL = islands(ISL_G);
check(ISL.length === 4, 'four islands');
const islFrames = (() => {
  const out = [{ say: 0, note: 'Scan row by row. 1 = land, 0 = water.', panels: [grid(ISL_G, null, 'grid'), vars({ islands: 0 })] }];
  ISL.forEach((cells, k) => {
    const own = new Set(cells.map(([r, c]) => cn(r, c)));
    const before = new Set(ISL.slice(0, k).flat().map(([r, c]) => cn(r, c)));
    const [sr, sc] = cells[0];
    out.push({
      say: 1,
      note: `The scan reaches unvisited land at (${sr}, ${sc}): count island ${k + 1}.`,
      panels: [grid(ISL_G, mapG(ISL_G, (_, r, c) => (r === sr && c === sc ? 'active' : before.has(cn(r, c)) ? 'visited' : '')), 'grid'), vars({ islands: k + 1 })],
    });
    out.push({
      say: 2,
      note: `Flood it: ${cells.map(([r, c]) => `(${r}, ${c})`).join(' → ')}. Those cells are never counted again.`,
      panels: [grid(ISL_G, mapG(ISL_G, (_, r, c) => (own.has(cn(r, c)) ? 'done' : before.has(cn(r, c)) ? 'visited' : '')), 'grid'), vars({ islands: k + 1 })],
    });
  });
  return out;
})();

// 3) your turn: diagonal touching
const DG_G = [[1, 0, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 1], [0, 0, 1, 0, 1]];
const DG4 = islands(DG_G);
const DG8 = islands(DG_G, 1, DIRS8);
check(DG4.length === 7 && DG8.length === 1, 'diagonal islands');
const compStates = (g, comps) => {
  const id = {};
  comps.forEach((cells, k) => cells.forEach(([r, c]) => (id[cn(r, c)] = k)));
  return mapG(g, (_, r, c) => (id[cn(r, c)] === undefined ? '' : ['done', 'window', 'active', 'visited'][id[cn(r, c)] % 4]));
};

// 4) border-first: capture O regions not connected to the border
function borderRun(g) {
  const reach = mapG(g, () => false);
  const seeds = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++) if ((r === 0 || c === 0 || r === g.length - 1 || c === g[0].length - 1) && g[r][c] === 'O') seeds.push([r, c]);
  const flood = (r, c) => {
    if (!inside(g, r, c) || g[r][c] !== 'O' || reach[r][c]) return;
    reach[r][c] = true;
    for (const [dr, dc] of DIRS) flood(r + dr, c + dc);
  };
  seeds.forEach(([r, c]) => flood(r, c));
  const captured = [];
  mapG(g, (v, r, c) => v === 'O' && !reach[r][c] && captured.push([r, c]));
  return { seeds, reach, captured };
}
const BD_G = [
  ['X', 'X', 'X', 'X', 'X'],
  ['X', 'O', 'O', 'X', 'X'],
  ['X', 'X', 'O', 'X', 'O'],
  ['X', 'O', 'X', 'X', 'O'],
  ['X', 'O', 'X', 'X', 'X'],
];
const BD = borderRun(BD_G);
check(BD.captured.length === 3 && BD.seeds.length === 3, 'border run');
const BD2_G = [
  ['X', 'X', 'X', 'X', 'X'],
  ['X', 'O', 'X', 'O', 'X'],
  ['X', 'O', 'X', 'O', 'O'],
  ['X', 'X', 'X', 'X', 'X'],
  ['X', 'O', 'O', 'X', 'X'],
];
const BD2 = borderRun(BD2_G);
check(BD2.captured.length === 2, 'border turn');
const isSeed = (B, r, c) => B.seeds.some(([y, x]) => y === r && x === c);
const isCap = (B, r, c) => B.captured.some(([y, x]) => y === r && x === c);

// ====================== optimized-multi-source ======================
const NZ_G = [[0, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 1, 1]];
const noWall = () => false;
const NZ_SRC = [];
mapG(NZ_G, (v, r, c) => v === 0 && NZ_SRC.push([r, c]));
const NZ = gridBfs(NZ_G, NZ_SRC, noWall);
check(NZ.max === 3 && NZ.waves.every((w) => w.length <= 7), 'nearest zero waves');

const RO_G = [[2, 1, 0, 1], [1, 1, 0, 1], [0, 1, 1, 1], [1, 1, 1, 2]];
const isRoWall = (v) => v === 0;
const RO_SRC = [];
mapG(RO_G, (v, r, c) => v === 2 && RO_SRC.push([r, c]));
const RO = gridBfs(RO_G, RO_SRC, isRoWall);
check(RO.dist.flat().filter((d, i) => d === -1 && RO_G.flat()[i] !== 0).length === 0, 'every orange reached');
check(RO.max === 3, 'rot minutes');

// the super-source picture: a line a – x – y – z – b with sources a and b
const SS_IDS = ['a', 'x', 'y', 'z', 'b'];
const SS_DIST = (() => {
  const d = SS_IDS.map((v) => (v === 'a' || v === 'b' ? 0 : -1));
  const q = [0, 4];
  for (let h = 0; h < q.length; h++) for (const v of [q[h] - 1, q[h] + 1]) if (v >= 0 && v < 5 && d[v] === -1) (d[v] = d[q[h]] + 1), q.push(v);
  return d;
})();
check(SS_DIST.join() === '0,1,2,1,0', 'super source dists');
const ssGraph = (st) =>
  graph(
    [{ id: 'S', label: 'S*', x: 2, y: 0, ...(st.S ? { state: st.S } : {}) }, ...SS_IDS.map((v, i) => ({ id: v, label: v, x: i, y: 1.4, ...(st[v] ? { state: st[v] } : {}) }))],
    [
      { from: 'S', to: 'a', label: '0', ...(st.edges ? { state: st.edges } : { state: 'muted' }) },
      { from: 'S', to: 'b', label: '0', ...(st.edges ? { state: st.edges } : { state: 'muted' }) },
      ...SS_IDS.slice(1).map((v, i) => ({ from: SS_IDS[i], to: v })),
    ],
  );
const ssDist = (k) => arr(SS_DIST.map((d) => (d <= k ? d : '·')), { label: 'dist', showIndices: false, highlights: hl(5, (i) => (SS_DIST[i] === k ? 'active' : SS_DIST[i] < k ? 'done' : '')) });

// ====================== optimized-bidirectional ======================
const DICT = new Set(['hot', 'dot', 'dog', 'lot', 'log', 'cog']);
function* neighbors(word, dict) {
  const chars = word.split('');
  for (let i = 0; i < chars.length; i++) {
    const orig = chars[i];
    for (let code = 97; code <= 122; code++) {
      const ch = String.fromCharCode(code);
      if (ch === orig) continue;
      chars[i] = ch;
      const cand = chars.join('');
      if (dict.has(cand)) yield cand;
    }
    chars[i] = orig;
  }
}
const WL_POS = { hit: [0, 1], hot: [1, 1], dot: [2, 0], lot: [2, 2], dog: [3, 0], log: [3, 2], cog: [4, 1] };
const WL_EDGES = [['hit', 'hot'], ['hot', 'dot'], ['hot', 'lot'], ['dot', 'lot'], ['dot', 'dog'], ['lot', 'log'], ['dog', 'log'], ['dog', 'cog'], ['log', 'cog']];
for (const [a, b] of WL_EDGES) check([...neighbors(a, new Set([...DICT, 'hit']))].includes(b), `edge ${a}-${b}`);
// rules from the lesson: two frontier Sets + one shared visited Set, expand the smaller, stop when a neighbour is in the other frontier
function biRun(start, target) {
  let front = new Set([start]);
  let back = new Set([target]);
  const side = { [start]: 'A', [target]: 'B' };
  const seen = new Set([start, target]);
  const snaps = [{ layer: 0, front: [...front], back: [...back], side: { ...side }, expanding: null, met: null }];
  for (let steps = 1; front.size && back.size; steps++) {
    const swapped = front.size > back.size;
    if (swapped) [front, back] = [back, front];
    const expanding = [...front];
    const next = new Set();
    for (const u of front)
      for (const v of neighbors(u, DICT)) {
        if (back.has(v)) {
          snaps.push({ layer: steps, swapped, expanding, front: [...front], back: [...back], side: { ...side }, met: [u, v] });
          return { steps, snaps };
        }
        if (!seen.has(v)) {
          seen.add(v);
          next.add(v);
          side[v] = side[u];
        }
      }
    front = next;
    snaps.push({ layer: steps, swapped, expanding, front: [...front], back: [...back], side: { ...side }, met: null });
  }
  return { steps: -1, snaps };
}
const BI = biRun('hit', 'cog');
check(BI.steps === 4 && BI.snaps.length === 5 && BI.snaps[3].swapped && BI.snaps[4].met.join() === 'dog,dot', 'word ladder run');
// start side orange (done), target side blue (visited), the frontier being expanded purple (active)
const wlGraph = (s) => {
  const exp = new Set(s.expanding || []);
  const met = new Set(s.met || []);
  return graph(
    Object.entries(WL_POS).map(([w, [x, y]]) => {
      const st = met.has(w) ? 'active' : exp.has(w) ? 'active' : s.side[w] === 'A' ? 'done' : s.side[w] === 'B' ? 'visited' : '';
      return { id: w, label: w, x, y, ...(st ? { state: st } : {}) };
    }),
    WL_EDGES.map(([a, b]) => ({ from: a, to: b, ...(met.has(a) && met.has(b) ? { state: 'done' } : {}) })),
    'orange: from hit · blue: from cog',
  );
};
const sideSet = (s, k) => setText([...s.front, ...s.back].filter((w) => s.side[w] === k));
const wlVars = (s) => vars({ layer: s.layer, fromHit: sideSet(s, 'A'), fromCog: sideSet(s, 'B') });
const DOG_NB = [...neighbors('dog', DICT)];
check(DOG_NB.join() === 'cog,log,dot', 'dog neighbours');

// ====================== optimized-bipartite ======================
const adjOf = (n, edges) => {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v), adj[v].push(u);
  return adj;
};
// BFS colouring, every component; one event per pop
function colourRun(n, edges) {
  const adj = adjOf(n, edges);
  const color = new Array(n).fill(-1);
  const ev = [];
  let starts = 0;
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    starts++;
    color[s] = 0;
    const queue = [s];
    ev.push({ kind: 'start', s, color: color.slice(), queue: queue.slice() });
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head];
      const coloured = [];
      const fine = [];
      for (const v of adj[u]) {
        if (color[v] === -1) {
          color[v] = 1 - color[u];
          queue.push(v);
          coloured.push(v);
        } else if (color[v] === color[u]) {
          ev.push({ kind: 'conflict', u, v, color: color.slice(), queue: queue.slice(head + 1), coloured, fine });
          return { ok: false, ev, starts, color };
        } else fine.push(v);
      }
      ev.push({ kind: 'pop', u, color: color.slice(), queue: queue.slice(head + 1), coloured, fine });
    }
  }
  return { ok: true, ev, starts, color };
}
const BP_POS = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]];
const BP_EDGES = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]];
const BP = colourRun(6, BP_EDGES);
check(BP.ok && BP.color.join() === '0,1,0,1,0,1', 'bipartite run');
const ODD_POS = [[1, 0], [2, 0.8], [1.6, 2], [0.4, 2], [0, 0.8]];
const ODD_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]];
const ODD = colourRun(5, ODD_EDGES);
const ODD_LAST = ODD.ev.at(-1);
check(!ODD.ok && ODD_LAST.u === 2 && ODD_LAST.v === 3, 'odd cycle conflict');
const CC_POS = [[0, 0], [1, 0], [2, 0], [0, 1.3], [1, 1.3], [2, 1.3], [3, 1.3]];
const CC2_EDGES = [[0, 1], [1, 2], [3, 4], [5, 6]];
const CC2 = colourRun(7, CC2_EDGES);
check(CC2.ok && CC2.starts === 3 && CC2.ev.filter((e) => e.kind === 'start').map((e) => e.s).join() === '0,3,5', 'components run');
// colour 0 = orange (done), colour 1 = blue (visited); the popped vertex purple; a conflict red
const colGraph = (pos, edges, color, o = {}) =>
  graph(
    pos.map(([x, y], i) => {
      const st = o.bad?.includes(i) ? 'bad' : i === o.u ? 'active' : color[i] === 0 ? 'done' : color[i] === 1 ? 'visited' : '';
      return { id: i, label: String(i), x, y, ...(st ? { state: st } : {}) };
    }),
    edges.map(([a, b]) => ({ from: a, to: b, ...(o.edge && o.edge.includes(a) && o.edge.includes(b) ? { state: 'active' } : {}) })),
    o.label || 'orange = 0 · blue = 1',
  );
const colArr = (color, u) => arr(color, { label: 'color', ...(u !== undefined ? { pointers: [ptr(u, 'u')] } : {}), highlights: hl(color.length, (i) => (color[i] === 0 ? 'done' : color[i] === 1 ? 'visited' : '')) });
const bpFrames = (R, pos, edges) =>
  R.ev.map((e) => {
    if (e.kind === 'start') return { say: 0, note: `Vertex ${e.s} is uncoloured: colour it 0 and start a BFS.`, panels: [colGraph(pos, edges, e.color), colArr(e.color), que(e.queue)] };
    if (e.kind === 'conflict')
      return {
        say: 2,
        note: `Pop ${e.u} (colour ${e.color[e.u]}): neighbour ${e.v} already has colour ${e.color[e.v]}, the **same**. Stop: not bipartite.`,
        panels: [colGraph(pos, edges, e.color, { bad: [e.u, e.v], edge: [e.u, e.v] }), colArr(e.color, e.u), que(e.queue)],
      };
    const parts = [];
    if (e.coloured.length) parts.push(`${e.coloured.join(', ')} get${e.coloured.length === 1 ? 's' : ''} colour ${1 - e.color[e.u]}`);
    if (e.fine.length) parts.push(`${e.fine.join(', ')} already opposite: fine`);
    return { say: 1, note: `Pop ${e.u} (colour ${e.color[e.u]}): ${parts.join('; ')}.`, panels: [colGraph(pos, edges, e.color, { u: e.u }), colArr(e.color, e.u), que(e.queue)] };
  });
const BP_FRAMES = bpFrames(BP, BP_POS, BP_EDGES);
const BP_Q = BP.ev.findIndex((e) => e.kind === 'pop' && e.u === 3); // pop 3 meets 4, already coloured opposite
check(BP.ev[BP_Q].fine.includes(4) && BP.color[4] !== BP.color[3], 'turn: 3 meets 4');

// ====================== optimized-state-space ======================
// star: 0 in the middle, leaves 1, 2, 3 (n = 4)
const ST_ADJ = [[1, 2, 3], [0], [0], [0]];
const ST_N = 4;
const ST_FULL = (1 << ST_N) - 1;
const bits = (m) => m.toString(2).padStart(ST_N, '0');
const ST_POS = [[1, 1], [0, 0], [2, 0], [1, 2]];
const starGraph = (node, mask, label) =>
  graph(
    ST_POS.map(([x, y], i) => {
      const st = i === node ? 'active' : mask & (1 << i) ? 'done' : '';
      return { id: i, label: String(i), x, y, ...(st ? { state: st } : {}) };
    }),
    [[0, 1], [0, 2], [0, 3]].map(([a, b]) => ({ from: a, to: b })),
    label,
  );
const bitArr = (mask, add) => arr(bits(mask).split(''), { label: 'bits for nodes 3 2 1 0', showIndices: false, highlights: hl(ST_N, (k) => (add !== undefined && ST_N - 1 - k === add ? 'active' : bits(mask)[k] === '1' ? 'done' : '')) });
const WALK = [1, 0, 2, 0, 3];
const walkFrames = (() => {
  const out = [];
  let mask = 0;
  const seenStates = new Set();
  WALK.forEach((v, k) => {
    const before = mask;
    mask |= 1 << v;
    const key = `${v}:${mask}`;
    const again = WALK.slice(0, k).includes(v);
    const note =
      k === 0
        ? `Start on node ${v}: mask = \`1 << ${v}\` = ${bits(mask)} = ${mask}.`
        : again
          ? `Back on node ${v}: a **new** state.` // reworded below
          : `Move to ${v}: \`${before} | (1 << ${v})\` = ${bits(mask)} = ${mask}.`;
    check(!seenStates.has(key), 'walk repeats a state');
    seenStates.add(key);
    out.push({ say: k === 0 ? 1 : again ? 0 : 1, note, panels: [starGraph(v, mask, `walk ${WALK.slice(0, k + 1).join('→')}`), bitArr(mask, v), vars({ node: v, mask })] });
  });
  return { out, mask };
})();
check(walkFrames.mask === ST_FULL, 'walk covers all');
// fix the "back on node 0" note: compare with the first time on node 0 (mask after step 2)
walkFrames.out[3].note = `Back on node 0, but mask is ${bits(7)}, not ${bits(3)} as last time. A **new** state (0, 7).`;
walkFrames.out.push({ say: 2, note: `mask === \`(1 << 4) - 1\` = ${ST_FULL}: all four visited in 4 moves.`, panels: [starGraph(3, ST_FULL, 'walk 1→0→2→0→3'), bitArr(ST_FULL), vars({ node: 3, mask: ST_FULL })] });

// BFS over states from (1, 0010), seen[node][mask]; stops when a popped state has the full mask
function stateBfs(start, seenByNodeOnly = false) {
  const seen = Array.from({ length: ST_N }, () => new Uint8Array(1 << ST_N));
  const seenNode = new Uint8Array(ST_N);
  const queue = [[start, 1 << start, 0]];
  seen[start][1 << start] = 1;
  seenNode[start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const [u, mask, d] = queue[head];
    if (mask === ST_FULL) return { d, queue, head };
    for (const v of ST_ADJ[u]) {
      const m2 = mask | (1 << v);
      if (seenByNodeOnly ? !seenNode[v] : !seen[v][m2]) {
        seen[v][m2] = 1;
        seenNode[v] = 1;
        queue.push([v, m2, d + 1]);
      }
    }
  }
  return { d: -1, queue, head: queue.length };
}
const SB = stateBfs(1);
const SB_BAD = stateBfs(1, true);
check(SB.d === 4 && SB_BAD.d === -1, 'state BFS');
const stLabel = ([u, m]) => `${u}·${bits(m)}`;
const SB_LEVELS = Array.from({ length: SB.d + 1 }, (_, d) => SB.queue.slice(0, SB.head + 1).filter((s) => s[2] === d));
check(SB_LEVELS.every((l) => l.length <= 7), 'levels fit');

// ====================== optimized-labeling ======================
const LB_G = [[1, 1, 0, 1], [1, 0, 0, 1], [0, 1, 0, 0], [1, 1, 0, 1]];
function label(g) {
  const lab = g.map((row) => row.slice());
  const size = [0, 0];
  let id = 2;
  const order = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g[0].length; c++)
      if (lab[r][c] === 1) {
        let n = 0;
        const fill = (y, x) => {
          if (!inside(lab, y, x) || lab[y][x] !== 1) return;
          lab[y][x] = id;
          n++;
          for (const [dr, dc] of DIRS) fill(y + dr, x + dc);
        };
        fill(r, c);
        size[id] = n;
        order.push({ id, r, c, lab: lab.map((row) => row.slice()) });
        id++;
      }
  return { lab, size, order };
}
const LB = label(LB_G);
const flipAt = (L, r, c) => {
  const ids = new Set();
  const all = [];
  for (const [dr, dc] of DIRS) {
    const y = r + dr;
    const x = c + dc;
    if (inside(L.lab, y, x) && L.lab[y][x] > 1) ids.add(L.lab[y][x]), all.push(L.lab[y][x]);
  }
  return { ids: [...ids], all, total: 1 + [...ids].reduce((s, i) => s + L.size[i], 0), naive: 1 + all.reduce((s, i) => s + L.size[i], 0) };
};
check(LB.size.slice(2).join() === '3,2,3,1', 'island sizes');
const LB_A = flipAt(LB, 0, 2);
const LB_B = flipAt(LB, 2, 3);
const LB_Q = flipAt(LB, 1, 1);
check(LB_A.total === 6 && LB_B.total === 4 && LB_Q.total === 7 && LB_Q.naive === 10, 'flip sizes');
const sizeTable = (upto, hot) => {
  const ids = LB.order.filter((o) => o.id <= upto).map((o) => o.id);
  return table(ids.map((i) => `id ${i}`), ['size'], ids.map((i) => [LB.size[i]]), ids.map((i) => [(hot ? hot.includes(i) : i === upto) ? 'active' : '']), 'size[id]');
};
const lbGrid = (lab, o = {}) =>
  grid(
    lab.map((row, r) => row.map((v, c) => (o.at && o.at[0] === r && o.at[1] === c ? '?' : v))),
    mapG(lab, (v, r, c) => (o.at && o.at[0] === r && o.at[1] === c ? 'active' : o.near?.some(([y, x]) => y === r && x === c) ? 'window' : v === o.id ? 'done' : v > 1 ? 'visited' : '')),
    'grid (ids)',
  );
const near = (r, c) => DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([y, x]) => inside(LB_G, y, x) && LB.lab[y][x] > 1);

// ====================== template ======================
const TP_G = [[1, 1, 1], [0, 0, 1], [1, 1, 1]];
const TP_SRC = [[0, 0], [2, 0]];
const TP = gridBfs(TP_G, TP_SRC, (v) => v === 0);
check(TP.dist.map((r) => r.join(' ')).join('/') === '0 1 2/-1 -1 3/0 1 2', 'template dist');

// ====================== implementation ======================
function numIslandsRun(gridIn) {
  const g = gridIn.map((row) => row.slice());
  const R = g.length;
  const C = g[0].length;
  let islands = 0;
  const stack = [];
  const ev = [];
  const marked = new Set();
  const snap = (e) => ev.push({ ...e, g: g.map((row) => row.slice()), stack: stack.slice(), islands, marked: new Set(marked) });
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (g[r][c] !== '1') continue;
      islands++;
      g[r][c] = '0';
      marked.add(r * C + c);
      stack.push(r * C + c);
      snap({ kind: 'start', r, c });
      while (stack.length) {
        const id = stack.pop();
        const cr = Math.floor(id / C);
        const cc = id % C;
        const pushed = [];
        const tryPush = (ok, y, x, nid) => {
          if (ok && g[y][x] === '1') {
            g[y][x] = '0';
            marked.add(nid);
            stack.push(nid);
            pushed.push(nid);
          }
        };
        tryPush(cr > 0, cr - 1, cc, id - C);
        tryPush(cr < R - 1, cr + 1, cc, id + C);
        tryPush(cc > 0, cr, cc - 1, id - 1);
        tryPush(cc < C - 1, cr, cc + 1, id + 1);
        snap({ kind: 'pop', id, cr, cc, pushed });
      }
    }
  return { islands, ev, C };
}
const IM_G = [['1', '1', '0', '0'], ['0', '1', '0', '1'], ['1', '0', '0', '1']];
const IM = numIslandsRun(IM_G);
check(IM.islands === 3, 'implementation islands');
const imGrid = (e, C) =>
  grid(
    e.g,
    mapG(e.g, (_, r, c) => (e.kind === 'pop' && r === e.cr && c === e.cc ? 'active' : e.kind === 'start' && r === e.r && c === e.c ? 'active' : e.marked.has(r * C + c) ? 'done' : IM_G[r]?.[c] === '1' ? 'window' : '')),
    'grid (strings)',
  );
const IM_FIRST = IM.ev.slice(0, IM.ev.findIndex((e, i) => i > 0 && e.kind === 'start'));
const IM_SQ = numIslandsRun([['1', '1'], ['1', '1']]);
const IM_SQ_ORDER = IM_SQ.ev.filter((e) => e.kind === 'pop').map((e) => `(${e.cr}, ${e.cc})`);
check(IM_SQ_ORDER.join(' ') === '(0, 0) (0, 1) (1, 1) (1, 0)', 'square pop order');

// ====================== dry-run ======================
const DR_EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]];
const DR_ADJ = adjOf(5, DR_EDGES);
const DR_POS = [[0, 1], [1, 0], [1, 2], [2, 1], [3, 1]];
// the lesson's own table, copied exactly
const DR_TABLE = [
  ['—', '—', '—', '0 (dist 0)', '[0]'],
  ['0', '0', '1, 2', '1 → 1, 2 → 1', '[1, 2]'],
  ['1', '1', '0, 3', '3 → 2', '[2, 3]'],
  ['2', '1', '0, 3', 'none (3 already discovered)', '[3]'],
  ['3', '2', '1, 2, 4', '4 → 3', '[4]'],
  ['4', '3', '3', 'none', '[]'],
];
const DR = (() => {
  const dist = new Array(5).fill(-1);
  dist[0] = 0;
  const q = [0];
  const rows = [{ u: null, dist: dist.slice(), queue: [0], found: [0] }];
  for (let h = 0; h < q.length; h++) {
    const u = q[h];
    const found = [];
    for (const v of DR_ADJ[u])
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1;
        q.push(v);
        found.push(v);
      }
    rows.push({ u, dist: dist.slice(), queue: q.slice(h + 1), found });
  }
  return rows;
})();
DR.slice(1).forEach((row, i) => {
  const t = DR_TABLE[i + 1];
  check(String(row.u) === t[0] && String(row.dist[row.u]) === t[1] && DR_ADJ[row.u].join(', ') === t[2] && `[${row.queue.join(', ')}]` === t[4], `dry-run row ${i + 1}`);
  check(t[3].startsWith('none') ? row.found.length === 0 : row.found.map((v) => `${v} → ${row.dist[v]}`).join(', ') === t[3], `dry-run found ${i + 1}`);
});
const drPanels = (k) => {
  const row = DR[k];
  const popped = new Set(DR.slice(1, k + 1).map((r) => r.u));
  const inQ = new Set(row.queue);
  return [
    graph(
      DR_POS.map(([x, y], i) => {
        const st = i === row.u ? 'active' : popped.has(i) ? 'done' : inQ.has(i) ? 'visited' : '';
        return { id: i, label: String(i), x, y, ...(st ? { state: st } : {}) };
      }),
      DR_EDGES.map(([a, b]) => ({ from: a, to: b, ...(row.u !== null && (a === row.u || b === row.u) ? { state: 'active' } : {}) })),
    ),
    arr(row.dist, { label: 'dist', highlights: hl(5, (i) => (row.found.includes(i) ? 'active' : row.dist[i] !== -1 ? 'done' : '')) }),
    que(row.queue, 'queue after'),
  ];
};
const drNote = (k) => {
  const t = DR_TABLE[k];
  if (k === 0) return 'Seed: dist[0] = 0, queue [0].';
  return `Pop ${t[0]} (dist ${t[1]}). Neighbours ${t[2]}. New: ${t[3]}. Queue ${t[4]}.`;
};

// ====================== mistakes ======================
const FILL = (() => {
  const shared = new Array(3).fill([]);
  const s0 = shared.map((a) => `[${a.join(', ')}]`);
  shared[0].push(1);
  const s1 = shared.map((a) => `[${a.join(', ')}]`);
  shared[1].push(0);
  const s2 = shared.map((a) => `[${a.join(', ')}]`);
  const good = Array.from({ length: 3 }, () => []);
  good[0].push(1);
  good[1].push(0);
  return { s0, s1, s2, good: good.map((a) => `[${a.join(', ')}]`), same: shared[0] === shared[2] };
})();
check(FILL.same && FILL.s2.every((s) => s === '[1, 0]') && FILL.good.join() === '[1],[0],[]', 'fill([]) run');
const fillTable = (cells, st) => table(['adj[0]', 'adj[1]', 'adj[2]'], ['holds'], cells.map((c) => [c]), cells.map(() => [st]));

// mark on pop (skip a vertex popped twice) vs mark on push, on the dry-run graph
const MARK = (() => {
  const visited = new Array(5).fill(false);
  const dist = new Array(5).fill(-1);
  const q = [[0, 0]];
  let pushes = 1;
  const ev = [];
  for (let h = 0; h < q.length; h++) {
    const [u, d] = q[h];
    if (visited[u]) {
      ev.push({ u, skip: true, queue: q.slice(h + 1).map((e) => e[0]), dist: dist.slice() });
      continue;
    }
    visited[u] = true;
    dist[u] = d;
    const added = [];
    for (const v of DR_ADJ[u]) if (!visited[v]) q.push([v, d + 1]), pushes++, added.push(v);
    ev.push({ u, skip: false, added, queue: q.slice(h + 1).map((e) => e[0]), dist: dist.slice() });
  }
  return { ev, pushes, dist };
})();
const PUSH_MARK = DR.length - 1; // the dry-run (mark on push) pushes every vertex once
check(MARK.pushes === 6 && PUSH_MARK === 5 && MARK.dist.join() === DR.at(-1).dist.join(), 'mark on pop vs push');
const markGraph = (u, visited) =>
  graph(
    DR_POS.map(([x, y], i) => {
      const st = i === u ? 'active' : visited.includes(i) ? 'done' : '';
      return { id: i, label: String(i), x, y, ...(st ? { state: st } : {}) };
    }),
    DR_EDGES.map(([a, b]) => ({ from: a, to: b })),
    'mark on pop',
  );

const ONLY0_EDGES = [[0, 1], [1, 2], [3, 4]];
const ONLY0_N = 6;
const ONLY0_SEEN = (() => {
  const adj = adjOf(ONLY0_N, ONLY0_EDGES);
  const seen = new Set([0]);
  const q = [0];
  for (let h = 0; h < q.length; h++) for (const v of adj[q[h]]) if (!seen.has(v)) seen.add(v), q.push(v);
  return seen;
})();
const ONLY0_MISSED = ONLY0_N - ONLY0_SEEN.size;
check(ONLY0_MISSED === 3, 'only from 0');
const ONLY0_POS = [[0, 0], [1, 0], [2, 0], [0, 1.3], [1, 1.3], [2.4, 1.3]];
const only0Graph = (states) =>
  graph(
    ONLY0_POS.map(([x, y], i) => ({ id: i, label: String(i), x, y, ...(states[i] ? { state: states[i] } : {}) })),
    ONLY0_EDGES.map(([a, b]) => ({ from: a, to: b })),
  );
const KEY = (() => {
  const seen = new Set();
  seen.add([0, 1]);
  return seen.has([0, 1]);
})();
check(KEY === false, 'array key');

// ====================== interview-tips ======================
const IT_G = [[1, 1, 0], [0, 1, 1]];
const IT_LAND = [];
mapG(IT_G, (v, r, c) => v === 1 && IT_LAND.push([r, c]));
const IT_EDGES = [];
IT_LAND.forEach(([r, c]) =>
  [[1, 0], [0, 1]].forEach(([dr, dc]) => {
    if (inside(IT_G, r + dr, c + dc) && IT_G[r + dr][c + dc] === 1) IT_EDGES.push({ from: cn(r, c), to: cn(r + dr, c + dc), state: 'done' });
  }),
);
check(IT_LAND.length === 4 && IT_EDGES.length === 3, 'interview model');
const itGraph = graph(IT_LAND.map(([r, c]) => ({ id: cn(r, c), label: cn(r, c), x: c, y: r, state: 'done' })), IT_EDGES, 'cells = vertices');
const MAZE = [['S', '.', '#'], ['#', '.', '.'], ['.', '.', 'T']];
const MAZE_ST = mapG(MAZE, (v) => (v === '#' ? 'muted' : v === 'S' ? 'active' : v === 'T' ? 'done' : ''));
const SHUT = [['S', '.', '.'], ['.', '#', '#'], ['.', '#', 'T']];
const SHUT_B = gridBfs(SHUT, [[0, 0]], (v) => v === '#');
check(SHUT_B.dist[2][2] === -1, 'target walled off');

// ============================================================
const steps = {
  'optimized-grid': [
    {
      kind: 'watch',
      title: 'Neighbours without an adjacency list',
      lines: ['Each cell `(r, c)` is a vertex. We **compute** its neighbours.', '`DIRS` = down, up, right, left. A move off the grid is skipped.', 'V = R·C and at most 4 edges per cell → **O(R·C)**.'],
      frames: [
        { say: 0, note: 'Cell (0, 3), a corner. No adjacency list: its neighbours come from `r + dr`, `c + dc`.', panels: [grid(mapG(NB_G, (_, r, c) => (r === 0 && c === 3 ? 'u' : '·')), mapG(NB_G, (_, r, c) => (r === 0 && c === 3 ? 'active' : '')), '3 × 4 grid'), vars({ r: 0, c: 3 })] },
        ...nbFrames.out,
        { say: 2, note: `A corner keeps 2 of its 4 directions: ${nbFrames.ok.map((s) => `(${s})`).join(' and ')}. Here V = 3·4 = 12 cells.`, panels: [grid(mapG(NB_G, (_, r, c) => (r === 0 && c === 3 ? 'u' : '·')), mapG(NB_G, (_, r, c) => (r === 0 && c === 3 ? 'active' : nbFrames.ok.includes(cn(r, c)) ? 'done' : '')), '3 × 4 grid'), vars({ R: 3, C: 4, V: 12 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Counting islands: one launch per island',
      lines: ['Scan every cell.', 'Unvisited land → count **one** island.', 'Flood the whole island so it is never counted again.'],
      frames: [
        ...islFrames,
        { say: 1, note: `Scan finished: ${ISL.length} launches = ${ISL.length} islands. (1, 1) and (2, 0) only touch diagonally, so they are different islands.`, panels: [grid(ISL_G, compStates(ISL_G, ISL), 'grid'), vars({ islands: ISL.length })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the islands',
      lines: ['Neighbours are up, down, left and right only.'],
      panels: [grid(DG_G, null, '4 × 5 grid')],
      task: { type: 'number', question: 'How many islands does the scan count?', options: [DG8.length, 4, DG4.length, 10], answer: DG4.length, hint: 'Cells that touch only at a corner are not connected.' },
      solved: `${DG4.length} islands. With diagonals it would be ${DG8.length}, but the 4 directions do not connect corners.`,
      then: [{ say: 0, note: `Each colour is one flood: ${DG4.length} launches.`, panels: [grid(DG_G, compStates(DG_G, DG4), '4 × 5 grid')] }],
    },
    {
      kind: 'watch',
      title: 'Reverse thinking: start from the border',
      lines: ['Task: capture `O` regions that are **not** connected to the border.', 'Flip it: flood **from the border inward** and mark what you reach.', 'The answer is everything else. One traversal, not one per cell.'],
      frames: [
        { say: 0, note: 'Starting a search from every `O` cell would repeat work.', panels: [grid(BD_G, null, 'board')] },
        { say: 1, note: `Seed: the ${BD.seeds.length} \`O\` cells on the border.`, panels: [grid(BD_G, mapG(BD_G, (v, r, c) => (isSeed(BD, r, c) ? 'active' : '')), 'board')] },
        { say: 1, note: 'Flood inward from them: every `O` they reach is safe.', panels: [grid(BD_G, mapG(BD_G, (v, r, c) => (BD.reach[r][c] ? 'window' : '')), 'board')] },
        { say: 2, note: `Every other \`O\` is captured: ${BD.captured.length} cells.`, panels: [grid(BD_G, mapG(BD_G, (v, r, c) => (BD.reach[r][c] ? 'window' : isCap(BD, r, c) ? 'done' : '')), 'board')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what gets captured?',
      lines: ['Flood from the border first; whatever `O` is left is captured.'],
      panels: [grid(BD2_G, null, 'board')],
      task: { type: 'number', question: 'How many `O` cells are captured?', options: [2, 3, 5, 7], answer: BD2.captured.length, hint: 'Follow each `O` region: does any of its cells sit on the border?' },
      solved: `${BD2.captured.length}. The right-hand region touches the border at (2, 4), and the bottom pair is on the border.`,
      then: [{ say: 0, note: 'Blue: reached from the border. Orange: captured.', panels: [grid(BD2_G, mapG(BD2_G, (v, r, c) => (BD2.reach[r][c] ? 'window' : isCap(BD2, r, c) ? 'done' : '')), 'board')] }],
    },
  ],

  'optimized-multi-source': [
    {
      kind: 'watch',
      title: 'Every 0 starts at once',
      lines: ['Brute force: one BFS **per cell** → O((R·C)²).', '**Flip it:** put **every** 0 in the queue at distance 0.', 'Each cell is first reached by the ripple of its **nearest** 0.'],
      frames: [
        { say: 0, note: 'For every cell: how far is the nearest 0?', panels: [grid(NZ_G, mapG(NZ_G, (v) => (v === 0 ? 'active' : '')), 'grid')] },
        ...NZ.waves.map((w, k) => ({
          say: k === 0 ? 1 : 2,
          note: k === 0 ? `Both 0s enter the queue with dist 0.` : `Wave ${k}: ${w.length} cells get dist ${k}.`,
          panels: [waveGrid(NZ_G, NZ, k, noWall, 'dist'), que(w.map(([r, c]) => cn(r, c)), `queue (dist ${k})`)],
        })),
        { say: 2, note: `Done in one pass. The farthest cell is ${NZ.max} steps from its nearest 0.`, panels: [waveGrid(NZ_G, NZ, NZ.max + 1, noWall, 'dist'), que([], 'queue')] },
      ],
    },
    {
      kind: 'watch',
      title: 'Why it works: a virtual super-source',
      lines: ['Add a **virtual** vertex `S*` with a 0-length edge to every source.', 'A BFS from `S*` gives the distance to the **nearest** source.', 'Seeding all sources = BFS from `S*` after its **first step**.'],
      frames: [
        { say: 0, note: 'Sources a and b. S* is imaginary: it links to both with length 0.', panels: [ssGraph({ a: 'done', b: 'done' }), que(['S*'])] },
        { say: 2, note: 'Pop S*: a and b join at dist 0. That queue is exactly our seeded start.', panels: [ssGraph({ S: 'muted', a: 'active', b: 'active', edges: 'done' }), ssDist(0), que(['a', 'b'])] },
        { say: 1, note: 'Next wave: x and z, dist 1.', panels: [ssGraph({ S: 'muted', a: 'done', b: 'done', x: 'active', z: 'active', edges: 'done' }), ssDist(1), que(['x', 'z'])] },
        { say: 1, note: 'y gets dist 2: its nearest source is 2 edges away (a or b).', panels: [ssGraph({ S: 'muted', a: 'done', b: 'done', x: 'done', z: 'done', y: 'active', edges: 'done' }), ssDist(2), que(['y'])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the starting queue',
      lines: ['Cells marked 2 are the sources. 0 is a wall.'],
      panels: [grid(RO_G, mapG(RO_G, (v) => (v === 2 ? 'active' : v === 0 ? 'muted' : '')), 'grid')],
      task: {
        type: 'choose',
        question: 'What is in the queue before the first pop?',
        options: [
          { text: 'Both 2s, each with distance 0', why: '' },
          { text: 'Only the first 2 the scan finds', why: 'The other source would start late, and cells near it would get too-large distances.' },
          { text: 'Every non-wall cell', why: 'The other cells have no distance yet; the ripples discover them.' },
          { text: 'Nothing; each 2 runs its own BFS later', why: 'That is the slow version. One shared queue seeded with all sources does it in one pass.' },
        ],
        answer: 0,
      },
      solved: 'All sources go in together at distance 0, then a normal BFS runs.',
    },
    {
      kind: 'turn',
      title: 'Your turn: how long until everything is reached?',
      lines: ['Each wave of the queue is one minute.', 'Walls (0) block the spread.'],
      panels: [grid(RO_G, mapG(RO_G, (v) => (v === 2 ? 'active' : v === 0 ? 'muted' : '')), 'grid')],
      task: { type: 'number', question: 'After how many minutes is the last cell reached?', options: [2, 3, 4, 5], answer: RO.max, hint: 'Each cell takes the distance to its NEAREST 2, walking around walls.' },
      solved: `${RO.max} minutes: the largest distance in the grid.`,
      then: RO.waves.map((w, k) => ({ say: 0, note: k === 0 ? 'Minute 0: both sources.' : `Minute ${k}: ${w.map(([r, c]) => `(${r}, ${c})`).join(', ')}.`, panels: [waveGrid(RO_G, RO, k, isRoWall, 'minute reached')] })),
    },
  ],

  'optimized-bidirectional': [
    {
      kind: 'turn',
      title: 'Your turn: meet in the middle',
      lines: ['One BFS to depth `d` touches about `b^d` states.', 'Two searches that meet go only `d/2` deep each: about `2·b^(d/2)`.'],
      panels: [table(['one BFS', 'two BFS'], ['depth', 'states'], [['8', '10^8'], ['4 + 4', '20,000']], null, 'b = 10, d = 8'), vars({ b: 3, d: 4 })],
      task: { type: 'number', question: 'Now b = 3 and d = 4. About how many states do the two searches touch together?', options: [12, 18, 27, 81], answer: 2 * 3 ** 2, hint: 'Each side goes d/2 = 2 deep: 3^2 states. Two sides.' },
      solved: `2·3^2 = 18, against 3^4 = 81 for a single BFS.`,
    },
    {
      kind: 'watch',
      title: 'Word ladder from both ends',
      lines: ['Words are vertices; one-letter changes are edges.', 'Two frontiers (Sets) and **one** shared visited set.', 'Always expand the **smaller** frontier.'],
      frames: [
        { say: 0, note: `hit → cog. Dictionary: ${[...DICT].join(', ')}.`, panels: [wlGraph(BI.snaps[0]), wlVars(BI.snaps[0])] },
        { say: 2, note: 'Layer 1: a tie, 1 vs 1. We expand the hit side: {hit} → {hot}.', panels: [wlGraph({ ...BI.snaps[1], expanding: ['hit'] }), wlVars(BI.snaps[1])] },
        { say: 2, note: 'Layer 2: a tie again. Expand {hot} → {dot, lot}.', panels: [wlGraph({ ...BI.snaps[2], expanding: ['hot'] }), wlVars(BI.snaps[2])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which side grows next?',
      lines: ['Always expand the **smaller** frontier.', 'A neighbour in the **other** frontier means the searches met.'],
      panels: [wlGraph(BI.snaps[2]), wlVars(BI.snaps[2])],
      task: {
        type: 'choose',
        question: 'Layer 3: which frontier is expanded?',
        options: [
          { text: '{cog}', why: '' },
          { text: '{dot, lot}', why: 'It has 2 words and {cog} has 1. The smaller side goes, to keep the work balanced.' },
          { text: 'Both, one after the other', why: 'Each layer expands one frontier.' },
        ],
        answer: 0,
      },
      solved: 'The cog side is smaller, so it grows. Then layer 4 meets the hit side.',
      then: [
        { say: 0, note: 'Layer 3: {cog} is smaller (1 < 2). Expand it → {dog, log}.', panels: [wlGraph({ ...BI.snaps[3], expanding: ['cog'] }), wlVars(BI.snaps[3])] },
        { say: 1, note: `Layer 4: 2 vs 2, expand {dog, log}. dog's neighbour dot is in the other frontier: met. Answer ${BI.steps}.`, panels: [wlGraph(BI.snaps[4]), vars({ layer: BI.steps, met: 'dog–dot' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: neighbours on the fly',
      lines: ['For each position, try every letter `a`..`z` (skip the original).', 'Keep a candidate only if the dictionary has it.'],
      panels: [arr([...DICT], { label: 'dict', showIndices: false }), vars({ word: 'dog' })],
      task: { type: 'order', question: 'In what order does `neighbors("dog", dict)` yield words?', items: DOG_NB, hint: 'Position 0 first, letters a → z. Then position 1, then position 2.' },
      solved: 'cog and log change position 0 (c before l); dot changes position 2.',
    },
  ],

  'optimized-bipartite': [
    {
      kind: 'watch',
      title: 'Colour by BFS',
      lines: ['Pick an uncoloured vertex, colour it 0, BFS.', 'Each neighbour gets the **opposite** colour `1 − color[u]`.', 'A neighbour with the **same** colour as `u`: not bipartite.'],
      frames: [...BP_FRAMES, { say: 1, note: 'Queue empty, no conflict: bipartite. Colour 0 = {0, 2, 4}, colour 1 = {1, 3, 5}.', panels: [colGraph(BP_POS, BP_EDGES, BP.color), colArr(BP.color), que([])] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: an already-coloured neighbour',
      lines: ['Uncoloured neighbour: give it `1 − color[u]`.', 'Coloured neighbour: compare.'],
      panels: (() => {
        const e = BP.ev[BP_Q - 1];
        return [colGraph(BP_POS, BP_EDGES, e.color, { u: 3, edge: [3, 4] }), colArr(e.color, 3), que(e.queue.slice(1))];
      })(),
      task: {
        type: 'choose',
        question: 'u = 3 has colour 1. Neighbour 4 already has colour 0. What happens?',
        options: [
          { text: 'Nothing: the colours differ, move on', why: '' },
          { text: 'Return false', why: 'False is only for the SAME colour on both ends of an edge.' },
          { text: 'Recolour 4 and push it again', why: 'Colours are forced once set; 4 is already coloured and queued.' },
        ],
        answer: 0,
      },
      solved: 'Opposite colours on an edge is exactly what we want.',
    },
    {
      kind: 'watch',
      title: 'An odd cycle forces a conflict',
      lines: ['Colours follow **layer parity**: even layers 0, odd layers 1.', 'A conflict joins two vertices of the same parity.', 'That closes a cycle of **odd** length.'],
      frames: [
        ...bpFrames(ODD, ODD_POS, ODD_EDGES),
        { say: 2, note: '0 → 1 → 2, 0 → 4 → 3, plus edge 2–3: a cycle of 5 edges. Odd, so no 2-colouring exists.', panels: [colGraph(ODD_POS, ODD_EDGES, ODD_LAST.color, { bad: [2, 3], edge: [2, 3] }), colArr(ODD_LAST.color)] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many launches?',
      lines: ['Repeat for **every** component: start a BFS at each uncoloured vertex.'],
      panels: [colGraph(CC_POS, CC2_EDGES, new Array(7).fill(-1), { label: '7 vertices' })],
      task: { type: 'number', question: 'The outer loop goes s = 0..6. How many times does it start a new BFS?', options: [1, 2, 3, 7], answer: CC2.starts, hint: 'One start per connected piece; later vertices of the same piece are already coloured.' },
      solved: `${CC2.starts} starts: at 0, 3 and 5. Every other vertex is already coloured when the loop reaches it.`,
      then: [{ say: 0, note: 'Each piece gets its own colour-0 start.', panels: [colGraph(CC_POS, CC2_EDGES, CC2.color, { label: '7 vertices' }), colArr(CC2.color)] }],
    },
  ],

  'optimized-state-space': [
    {
      kind: 'watch',
      title: 'Same node, different situation',
      lines: ['A BFS vertex is a **state** `(node, visitedSet)`.', 'The set is a bitmask: `mask | (1 << v)` adds node v.', '`mask === (1 << n) - 1` means all nodes visited.'],
      frames: walkFrames.out,
    },
    {
      kind: 'watch',
      title: 'BFS over (node, mask)',
      lines: ['Start state: node 1, mask `0010`.', 'Every move costs 1, so BFS layers = walk length.', 'Mark `seen[node][mask]`, not `seen[node]`.'],
      frames: SB_LEVELS.map((lv, d) => ({
        say: d === 0 ? 0 : d === 2 ? 2 : 1,
        note:
          d === 0
            ? 'Layer 0: one state. Labels read node·mask.'
            : d === 2
              ? `Layer 2: ${lv.map(stLabel).join(', ')}. Node 1 again, with a bigger mask: a new state.`
              : d === SB.d
                ? `Layer ${d}: ${stLabel(SB.queue[SB.head])} has mask 1111. Answer ${d}.`
                : `Layer ${d}: ${lv.map(stLabel).join(', ')}.`,
        panels: [starGraph(d === SB.d ? SB.queue[SB.head][0] : lv[0][0], d === SB.d ? SB.queue[SB.head][1] : lv[0][1], 'star, n = 4'), que(lv.map(stLabel), `layer ${d}`)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: mark only the node?',
      lines: ['The visited check moves to the **state**.'],
      panels: [starGraph(1, 2, 'start on 1'), vars({ seen: 'seen[node]' })],
      task: {
        type: 'choose',
        question: 'Same star, start on 1, but we mark only `seen[node]`. What happens?',
        options: [
          { text: 'Node 0 can never be re-entered, so the full mask is never reached', why: '' },
          { text: 'The same answer, 4, a bit faster', why: 'The only walk that covers 1, 2 and 3 passes through 0 more than once.' },
          { text: 'BFS loops forever', why: 'Any visited check stops repeats; the problem is that it stops too many.' },
        ],
        answer: 0,
      },
      solved: `The queue runs dry without ever popping mask 1111. Coming back to 0 with a bigger mask is progress, not a repeat.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: how many states?',
      lines: ['There are `n · 2^n` states.', 'For n = 12 that is about 49,000.'],
      panels: [starGraph(-1, 0, 'star, n = 4'), bitArr(0)],
      task: { type: 'number', question: 'How many (node, mask) states does this n = 4 star have?', options: [16, 32, 64, 256], answer: ST_N * 2 ** ST_N, hint: '4 nodes, and 2^4 masks for each.' },
      solved: `4 · 16 = ${ST_N * 2 ** ST_N} states. Tiny for BFS.`,
    },
  ],

  'optimized-labeling': [
    {
      kind: 'watch',
      title: 'Label every island once',
      lines: ['Flood each island once. Write its **id** (2, 3, 4…) into its cells.', 'Store `size[id]`.'],
      frames: [
        { say: 0, note: 'Land is 1. Ids are 2, 3, 4…, so a labelled cell never looks like land again.', panels: [grid(LB_G, null, 'grid')] },
        ...LB.order.map((o) => ({ say: o.id === 2 ? 0 : 1, note: `Scan hits (${o.r}, ${o.c}): fill with id ${o.id}. size[${o.id}] = ${LB.size[o.id]}.`, panels: [lbGrid(o.lab, { id: o.id }), sizeTable(o.id)] })),
      ],
    },
    {
      kind: 'watch',
      title: 'Each 0 asks its neighbours',
      lines: ['For a 0 cell, collect the **distinct** ids around it (a Set).', 'New island = `1 + sum of their sizes`.'],
      frames: [
        { say: 0, note: `(0, 2): neighbours carry ids ${setText(LB_A.ids)}.`, panels: [lbGrid(LB.lab, { at: [0, 2], near: near(0, 2) }), sizeTable(5, LB_A.ids), vars({ ids: setText(LB_A.ids) })] },
        { say: 1, note: `1 + ${LB_A.ids.map((i) => LB.size[i]).join(' + ')} = ${LB_A.total}. O(1) per 0 cell.`, panels: [lbGrid(LB.lab, { at: [0, 2], near: near(0, 2) }), sizeTable(5, LB_A.ids), vars({ size: LB_A.total })] },
        { say: 0, note: `(2, 3): ids ${setText(LB_B.ids)}.`, panels: [lbGrid(LB.lab, { at: [2, 3], near: near(2, 3) }), sizeTable(5, LB_B.ids), vars({ ids: setText(LB_B.ids) })] },
        { say: 1, note: `1 + ${LB_B.ids.map((i) => LB.size[i]).join(' + ')} = ${LB_B.total}.`, panels: [lbGrid(LB.lab, { at: [2, 3], near: near(2, 3) }), sizeTable(5, LB_B.ids), vars({ size: LB_B.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: flip (1, 1)',
      lines: ['Distinct ids only: the same island can touch the cell from two sides.'],
      panels: [lbGrid(LB.lab, { at: [1, 1], near: near(1, 1) }), sizeTable(5)],
      task: { type: 'number', question: 'Flip (1, 1). How big is the island you create?', options: [LB_Q.total, LB_Q.naive, 4, 8], answer: LB_Q.total, hint: 'Look at the ids above, below, left and right. Count each id once.' },
      solved: `Ids around it: ${LB_Q.all.join(', ')} → Set ${setText(LB_Q.ids)}. 1 + 3 + 3 = ${LB_Q.total}. Adding id 2 twice would give ${LB_Q.naive}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: no 0 at all',
      lines: ['Also consider a grid with **no** 0: the whole grid is one island.'],
      panels: [grid([[1, 1, 1], [1, 1, 1], [1, 1, 1]], null, '3 × 3, all land')],
      task: { type: 'number', question: 'What is the largest island here?', options: [0, 1, 9, 10], answer: 9, hint: 'There is no 0 to flip.' },
      solved: 'No 0 to flip, so the answer is the whole grid: 3·3 = 9.',
    },
  ],

  template: [
    {
      kind: 'turn',
      title: 'Your turn: the skeleton',
      lines: ['Every traversal here is one four-part skeleton.', 'Only the container and "what is a vertex" change.'],
      panels: [grid(TP_G, mapG(TP_G, (v, r, c) => (v === 0 ? 'muted' : TP_SRC.some(([y, x]) => y === r && x === c) ? 'active' : '')), 'grid')],
      task: { type: 'order', question: 'Put the four parts in order.', items: ['Build neighbours', 'Seed the start(s) and mark them', 'Loop: take one out, mark + add new ones', 'Answer from what you recorded'], hint: 'You cannot seed a search before you know the neighbours, and the answer comes last.' },
      solved: 'Build → Seed → Loop → Answer.',
    },
    {
      kind: 'watch',
      title: 'gridBfs, part by part',
      lines: ['**Build:** neighbours come from `DIRS`.', '**Seed:** every source gets dist 0 and joins the queue.', '**Loop:** skip walls (0) and seen cells (dist ≠ -1).', '**Answer:** return `dist`.'],
      frames: [
        { say: 0, note: 'A grid is computed, not built: DIRS gives the neighbours. dist starts at -1 everywhere.', panels: [grid(mapG(TP_G, () => -1), mapG(TP_G, (v) => (v === 0 ? 'muted' : '')), 'dist'), vars({ sources: 2 })] },
        ...TP.waves.map((w, k) => ({
          say: k === 0 ? 1 : 2,
          note: k === 0 ? 'Seed: (0, 0) and (2, 0) get dist 0.' : `Loop: ${w.map(([r, c]) => `(${r}, ${c})`).join(' and ')} get${w.length === 1 ? 's' : ''} dist ${k}.`,
          panels: [grid(mapG(TP_G, (v, r, c) => (TP.dist[r][c] !== -1 && TP.dist[r][c] <= k ? TP.dist[r][c] : -1)), mapG(TP_G, (v, r, c) => (v === 0 ? 'muted' : TP.dist[r][c] === k ? 'active' : TP.dist[r][c] !== -1 && TP.dist[r][c] < k ? 'done' : '')), 'dist'), que(w.map(([r, c]) => cn(r, c)))],
        })),
        { say: 3, note: 'Answer: dist. The walls were never assigned, so they keep -1.', panels: [grid(TP.dist, mapG(TP_G, (v) => (v === 0 ? 'muted' : 'done')), 'dist'), que([])] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one source or many',
      lines: ['`gridBfs(grid, sources)` takes a list of sources.'],
      panels: [grid(TP.dist, mapG(TP_G, (v) => (v === 0 ? 'muted' : 'done')), 'dist')],
      task: {
        type: 'choose',
        question: 'To go from one source to many, what changes in the code?',
        options: [
          { text: 'Nothing: pass more cells in `sources`', why: '' },
          { text: 'Add a second queue per source', why: 'One queue seeded with all sources is the whole trick.' },
          { text: 'Call gridBfs once per source and take the minimum', why: 'That works but repeats the BFS per source; seeding does it in one pass.' },
        ],
        answer: 0,
      },
      solved: 'The seed loop already handles a list of sources.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Iterative DFS with an encoded stack',
      lines: ['Unvisited `\'1\'` → islands++, mark it `\'0\'`, push `r * C + c`.', 'Pop an id: `cr = Math.floor(id / C)`, `cc = id % C`.', 'Up, down, left, right: mark each `\'1\'` on push.'],
      frames: [
        { say: 0, note: 'Number of Islands uses strings: \'1\' land, \'0\' water. C = 4.', panels: [grid(IM_G, mapG(IM_G, (v) => (v === '1' ? 'window' : '')), 'grid (strings)'), stk([]), vars({ islands: 0 })] },
        ...IM_FIRST.map((e) =>
          e.kind === 'start'
            ? { say: 0, note: `(${e.r}, ${e.c}) is '1': islands = ${e.islands}. Mark it '0', push id ${e.r * IM.C + e.c}.`, panels: [imGrid(e, IM.C), stk(e.stack), vars({ islands: e.islands })] }
            : {
                say: e.pushed.length ? 2 : 1,
                note: `Pop ${e.id} → (${e.cr}, ${e.cc}). ${e.pushed.length ? `Mark and push ${e.pushed.join(', ')}.` : 'No \'1\' neighbours left.'}`,
                panels: [imGrid(e, IM.C), stk(e.stack), vars({ islands: e.islands, id: e.id })],
              },
        ),
        { say: 0, note: `The scan goes on: (1, 3) and (2, 0) start the other two. Answer ${IM.islands}.`, panels: [imGrid(IM.ev.at(-1), IM.C), stk([]), vars({ islands: IM.islands })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: encode a cell',
      lines: ['Cells are encoded as `r * C + c`: no array allocated per stack entry.'],
      panels: [grid(IM_G, mapG(IM_G, (_, r, c) => (r === 2 && c === 3 ? 'active' : '')), 'C = 4'), vars({ r: 2, c: 3, C: 4 })],
      task: { type: 'number', question: 'What id goes on the stack for (2, 3)?', options: [9, 11, 14, 23], answer: 2 * 4 + 3, hint: '`r * C + c`.' },
      solved: '2·4 + 3 = 11. Back: Math.floor(11 / 4) = 2, 11 % 4 = 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: pop order',
      lines: ['Stack: last in, first out.', 'Pushes go up, down, left, right, and mark on push.'],
      panels: [grid([['1', '1'], ['1', '1']], null, '2 × 2, C = 2')],
      task: { type: 'order', question: 'Tap the cells in the order they are popped.', items: IM_SQ_ORDER, hint: 'From (0, 0): down is pushed before right, so right is popped first.' },
      solved: '(1, 0) was marked when pushed, so (1, 1) does not push it again.',
      then: IM_SQ.ev.map((e) => ({
        say: 1,
        note: e.kind === 'start' ? 'Start (0, 0): push id 0.' : `Pop (${e.cr}, ${e.cc}). ${e.pushed.length ? `Push ${e.pushed.join(', ')}.` : 'Nothing new.'}`,
        panels: [grid(e.g, mapG(e.g, (_, r, c) => ((e.kind === 'pop' ? r === e.cr && c === e.cc : r === 0 && c === 0) ? 'active' : e.marked.has(r * 2 + c) ? 'done' : '')), '2 × 2'), stk(e.stack)],
      })),
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'BFS from 0, row by row',
      lines: ['Seed: dist[0] = 0, queue [0].', 'Pop u. A neighbour with dist -1 gets `dist[u] + 1` and joins the queue.'],
      frames: [0, 1, 2].map((k) => ({ say: k === 0 ? 0 : 1, note: drNote(k), panels: drPanels(k) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: pop 2',
      lines: ['Only a vertex with dist -1 is new.'],
      panels: drPanels(2),
      task: {
        type: 'choose',
        question: 'Pop 2 (dist 1). Neighbours 0 and 3. What is newly discovered?',
        options: [
          { text: 'None', why: '' },
          { text: '3, with dist 2, pushed again', why: 'dist[3] is already 2 (found from 1), not -1.' },
          { text: '0, with dist 2', why: 'dist[0] = 0: it is the source.' },
        ],
        answer: 0,
      },
      solved: '3 is reachable from both 1 and 2, but it enters the queue once.',
      then: [3, 4, 5].map((k) => ({ note: drNote(k), panels: drPanels(k) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: what the queue holds',
      lines: ['BFS takes vertices out in order of distance.'],
      panels: [table(DR_TABLE.map((t) => (t[0] === '—' ? 'seed' : `pop ${t[0]}`)), ['queue after'], DR_TABLE.map((t) => [t[4]])), arr(DR.at(-1).dist, { label: 'dist' })],
      task: { type: 'number', question: 'At most how many DIFFERENT dist values are in the queue at once?', options: [1, 2, 3, 5], answer: 2, hint: 'Look up dist for each vertex in [2, 3].' },
      solved: 'At most two: d and d + 1. [2, 3] holds dist 1 and dist 2.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: '`fill([])` shares one array',
      lines: ['`new Array(n).fill([])` puts the **same** array in every slot.', 'Fix: `Array.from({ length: n }, () => [])`.'],
      frames: [
        { say: 0, note: '`adj = new Array(3).fill([])`. Three slots, one array.', panels: [fillTable(FILL.s0, ''), vars({ edge: 'none' })] },
        { say: 0, note: 'Edge 0–1: `adj[0].push(1)`. Every slot shows it.', panels: [fillTable(FILL.s1, 'bad'), vars({ edge: '0–1' })] },
        { say: 0, note: 'Reverse edge: `adj[1].push(0)`. Now even vertex 2 "has" neighbours 1 and 0.', panels: [fillTable(FILL.s2, 'bad'), vars({ edge: '0–1' })] },
        { say: 1, note: 'With `Array.from`, each slot gets its own array.', panels: [fillTable(FILL.good, 'done'), vars({ edge: '0–1' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Marking visited too late (BFS)',
      lines: ['BFS: mark when you **push**.', 'Mark on pop: a vertex can sit in the queue twice.', 'The distances agree; the work does not.'],
      frames: [
        ...MARK.ev.map((e, i) => ({
          say: e.skip ? 1 : i === 2 ? 1 : 0,
          note: e.skip ? `Pop ${e.u} again: already marked, skip it.` : `Pop ${e.u}: mark it now. Push unmarked neighbours: ${e.added.length ? e.added.join(', ') : 'none'}.${i === 2 ? ' 3 is already queued but not marked yet: it goes in twice.' : ''}`,
          panels: [
            markGraph(
              e.u,
              MARK.ev
                .slice(0, i + 1)
                .filter((x) => !x.skip)
                .map((x) => x.u),
            ),
            que(e.queue),
          ],
        })),
        { say: 2, note: `Same dist = [${MARK.dist.join(', ')}], but ${MARK.pushes} pushes instead of ${PUSH_MARK}.`, panels: [markGraph(-1, [0, 1, 2, 3, 4]), vars({ 'pop-mark': MARK.pushes, 'push-mark': PUSH_MARK })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: arrays as Set keys',
      lines: ['Set and Map compare arrays **by reference**.'],
      panels: [grid([['·', 'x'], ['·', '·']], [['', 'active'], ['', '']], 'cell (0, 1)'), vars({ C: 2 })],
      task: {
        type: 'choose',
        question: '`seen.add([0, 1])`, then `seen.has([0, 1])`. What comes back?',
        options: [
          { text: 'false', why: '' },
          { text: 'true', why: 'The second `[0, 1]` is a new array. Same contents, different reference.' },
          { text: 'It throws', why: 'Arrays are allowed in a Set; they just never match by value.' },
        ],
        answer: 0,
      },
      solved: 'Encode the cell instead: 0·2 + 1 = 1. Numbers compare by value.',
    },
    {
      kind: 'turn',
      title: 'Your turn: starting only from vertex 0',
      lines: ['Disconnected graphs need an outer loop over **all** vertices.'],
      panels: [only0Graph({ 0: 'active' })],
      task: { type: 'number', question: 'A BFS from vertex 0 only. How many vertices are never visited?', options: [0, 1, 3, 5], answer: ONLY0_MISSED, hint: 'Which vertices have a path to 0?' },
      solved: `${ONLY0_MISSED}: 3, 4 and 5. An outer loop over all vertices starts new searches at 3 and 5.`,
      then: [{ note: 'From 0 only: 0, 1, 2. The rest (red) are missed.', panels: [only0Graph(Object.fromEntries([...Array(ONLY0_N).keys()].map((i) => [i, ONLY0_SEEN.has(i) ? 'done' : 'bad'])))] }],
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say the model out loud',
      lines: ['"Each cell is a node, adjacent land cells are edges."', 'Then translate O(V + E): **O(R·C)** for the grid.'],
      frames: [
        { say: 0, note: 'The input: a 2 × 3 grid.', panels: [grid(IT_G, null, 'grid')] },
        { say: 0, note: `${IT_LAND.length} land cells are the vertices; ${IT_EDGES.length} adjacent pairs are the edges.`, panels: [grid(IT_G, mapG(IT_G, (v) => (v === 1 ? 'done' : '')), 'grid'), itGraph] },
        { say: 1, note: 'Every cell has at most 4 edges, so O(V + E) is O(R·C).', panels: [itGraph, vars({ R: 2, C: 3, V: 'R·C' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: justify the search',
      lines: ['Say **why** BFS or DFS.'],
      panels: [grid(MAZE, MAZE_ST, 'S to T')],
      task: {
        type: 'choose',
        question: 'Fewest moves from S to T, every move costs one. What do you say?',
        options: [
          { text: 'BFS: equal-cost moves, so the first time we reach T is optimal', why: '' },
          { text: 'DFS: it dives deep, so it reaches T sooner', why: 'DFS does not give shortest paths.' },
          { text: 'Either one: both are O(V + E)', why: 'Same cost, but only BFS reaches T first along a shortest path.' },
        ],
        answer: 0,
      },
      solved: '"All moves cost one and we want the minimum, so BFS."',
    },
    {
      kind: 'turn',
      title: 'Your turn: an edge case',
      lines: ['Edge cases: empty input, one vertex, disconnected parts, start equals target, **target unreachable**.'],
      panels: [grid(SHUT, mapG(SHUT, (v) => (v === '#' ? 'muted' : v === 'S' ? 'active' : v === 'T' ? 'done' : '')), 'S to T')],
      task: {
        type: 'choose',
        question: 'Walls cut T off. What does your function return?',
        options: [
          { text: '-1', why: '' },
          { text: '0', why: '0 would claim no moves are needed.' },
          { text: 'The distance of the last cell BFS reached', why: 'That is the distance to some other cell, not to T.' },
        ],
        answer: 0,
      },
      solved: 'Target unreachable → return -1. Mention it before you are asked.',
    },
  ],
};

// a turn's `then` frames link to the turn's own (shorter) lines; drop links that point past them
for (const list of Object.values(steps))
  for (const st of list)
    if (st.kind === 'turn' && st.then) st.then = st.then.map(({ say, ...f }) => (say !== undefined && say < st.lines.length ? { say, ...f } : f));

export default steps;
