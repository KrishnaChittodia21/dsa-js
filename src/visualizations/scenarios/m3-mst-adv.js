// Pattern animations for MST and advanced graphs: dense O(n²) Prim, MST with a virtual node,
// critical / pseudo-critical edge classification, Tarjan bridges, Kosaraju SCC and BFS over routes.
import { layoutCircle } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const fmt = (d) => (d === Infinity ? '∞' : String(d));
const yesNo = (q, yes, pos, explain) => (pos % 2 ? ask(q, ['No', 'Yes'], yes ? 1 : 0, explain) : ask(q, ['Yes', 'No'], yes ? 0 : 1, explain));

// Keep edges [u, v(, w)] with both ends in 0..n−1 (or lo..n), no self-loops, at most maxE. Never mutates input.
function cleanEdges(raw, n, { weighted = false, maxE = 10, lo = 0 } = {}) {
  return (Array.isArray(raw) ? raw : [])
    .filter((e) => Array.isArray(e) && e.length >= 2)
    .map((e) => [toInt(e[0], -1), toInt(e[1], -1), weighted ? clamp(toInt(e[2], 1), -99, 999) : 1])
    .filter(([u, v]) => u >= lo && v >= lo && u < n + lo && v < n + lo && u !== v)
    .slice(0, maxE)
    .map((e) => (weighted ? e : e.slice(0, 2)));
}

// nodes panel: pos = [{x, y}] indexed by id; edges = [{from, to, label?, state?}]
function graph(pos, edges, { state = () => '', label: nodeLabel = (i) => String(i), directed = false, title } = {}) {
  const p = {
    kind: 'nodes',
    nodes: pos.map((q, i) => ({ id: i, label: nodeLabel(i), x: q.x, y: q.y, state: state(i) || '' })),
    edges: edges.map((e) => ({ from: e.from, to: e.to, state: e.state || '', ...(e.label !== undefined ? { label: String(e.label) } : {}) })),
    directed,
    freeLayout: true,
  };
  if (title) p.label = title;
  return p;
}

// Array of ≤ 8 cells: show a window around `cur` when the list is longer (indexBase keeps real indexes).
function windowArr(values, cur, opts = {}) {
  const hl = opts.highlights || {};
  const start = values.length <= 8 ? 0 : clamp(cur - 3, 0, values.length - 8);
  const local = {};
  for (const [k, v] of Object.entries(hl)) if (k - start >= 0 && k - start < 8) local[k - start] = v;
  const p = arr(values.slice(start, start + 8), { ...opts, highlights: local, indexBase: start });
  if (cur >= start && cur < start + 8) p.pointers = [{ index: cur - start, label: 'current', color: 'a' }];
  return p;
}

// ====================== mst-prim-dense ======================
export const mstDensePrim = {
  problem: { name: 'Min Cost to Connect All Points', statement: 'Connect all points so every pair is joined by some path; a link costs the Manhattan distance. Return the smallest total cost.', example: '[[0,0], [2,2], [3,10], [5,2], [7,0]] → 20', exampleOutput: 20, questionId: 'min-cost-to-connect-all-points' },
  title: 'Dense Prim: connect all points',
  description:
    'Min cost to connect points (Manhattan distance). O(n²) Prim with a minCost array and no heap: a linear scan picks the closest outside point, then every outside point is relaxed against it. Grey lines show each outside point’s current cheapest link. At most 7 points, coordinates clamped to −20..20.',
  defaultInput: { points: [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]] },
  fields: [{ key: 'points', type: 'json', label: 'points [[x, y], …] (max 7)' }],
  testInputs: [
    { points: [] },
    { points: [[3, 4]] },
    { points: [[0, 0], [0, 0], [1, 1]] },
    { points: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { points: [[-5, 3], [99, 99], [0, -20]] },
    { points: [[0, 0], [1, 5], [2, 2], [8, 1], [4, 4], [6, 7], [3, 9], [9, 9], [5, 5]] },
  ],
  generate({ points }) {
    const pts = (Array.isArray(points) ? points : [])
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .slice(0, 7)
      .map(([x, y]) => [clamp(toInt(x), -20, 20), clamp(toInt(y), -20, 20)]);
    const n = pts.length;
    const cost = (i, j) => Math.abs(pts[i][0] - pts[j][0]) + Math.abs(pts[i][1] - pts[j][1]);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs, 0);
    const maxY = Math.max(...ys, 0);
    const span = Math.max(1, Math.max(...xs, 0) - minX, maxY - Math.min(...ys, 0));
    const pos = [];
    pts.forEach(([x, y]) => {
      const q = { x: ((x - minX) * 4) / span, y: ((maxY - y) * 4) / span };
      while (pos.some((o) => Math.hypot(o.x - q.x, o.y - q.y) < 0.4)) q.x += 0.45; // nudge overlapping points apart
      pos.push(q);
    });
    const minCost = new Array(n).fill(Infinity);
    const inTree = new Array(n).fill(false);
    const parent = new Array(n).fill(-1); // the "with parent[]" variation, used only for drawing
    if (n) minCost[0] = 0;
    let total = 0;
    const frames = [];
    const snap = (note, { u = -1, changed = [], round = 0, predict } = {}) => {
      const edges = [];
      for (let v = 0; v < n; v++) {
        if (parent[v] < 0) continue;
        edges.push(inTree[v] ? { from: parent[v], to: v, label: cost(parent[v], v), state: 'done' } : { from: parent[v], to: v, label: minCost[v], state: 'muted' });
      }
      const hl = {};
      for (let v = 0; v < n; v++) hl[v] = v === u ? 'active' : inTree[v] ? 'done' : changed.includes(v) ? 'visited' : '';
      const f = {
        note,
        panels: [
          graph(pos, edges, { state: (i) => hl[i], title: 'points (orange = in tree, grey = best link so far)' }),
          arr(minCost.map(fmt), { label: 'minCost (cheapest edge from the tree)', highlights: hl, ...(u >= 0 ? { pointers: [{ index: u, label: 'u', color: 'a' }] } : {}) }),
          vars({ round, u: u >= 0 ? u : '—', total }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (!n) {
      snap('No points: nothing to connect. minCost is empty.');
      snap('Done: total = 0. O(n²) time, O(n) memory.');
      frames.at(-1).result = 0;
      return frames;
    }
    snap(`${n} point(s); any two can be joined at cost |x1 − x2| + |y1 − y2|. No edge list: minCost[0] = 0 and every other minCost = ∞.`);
    let asks = 0;
    for (let round = 0; round < n; round++) {
      let u = -1;
      for (let v = 0; v < n; v++) if (!inTree[v] && (u === -1 || minCost[v] < minCost[u])) u = v;
      const outside = minCost.map((_, v) => v).filter((v) => !inTree[v] && v !== u);
      const q = round >= 1 && round % 2 === 1 ? pick(`Round ${round}: which point does the linear scan pick next?`, u, outside, asks++, 'Smallest minCost among outside points; on a tie the lower index wins (strict <).') : undefined;
      inTree[u] = true;
      total += minCost[u];
      snap(
        round === 0
          ? `Round 0: the scan finds minCost[0] = 0 (the start). Add point 0 to the tree; total = 0.`
          : `Round ${round}: scan all outside points — the smallest is minCost[${u}] = ${minCost[u]} (link ${parent[u]}–${u}). Add ${u}; total = ${total}.`,
        { u, round, predict: q },
      );
      if (round === n - 1) break;
      const changed = [];
      const before = minCost.slice();
      for (let v = 0; v < n; v++) {
        if (inTree[v]) continue;
        if (cost(u, v) < minCost[v]) {
          minCost[v] = cost(u, v);
          parent[v] = u;
          changed.push(v);
        }
      }
      const probe = outside[0];
      const q2 =
        round % 2 === 0 && probe !== undefined
          ? pick(`Relax with u = ${u}: cost(${u}, ${probe}) = ${cost(u, probe)}. What is minCost[${probe}] now?`, minCost[probe], [fmt(before[probe]), cost(u, probe) + 1, Math.max(0, cost(u, probe) - 1)].filter((x) => x !== fmt(minCost[probe])), asks++, 'minCost[v] = min(minCost[v], cost(u, v)).')
          : undefined;
      snap(
        changed.length
          ? `Relax: can ${u} attach an outside point more cheaply? Yes for ${changed.map((v) => `${v} (→ ${minCost[v]})`).join(', ')}. One O(n) pass, no heap.`
          : `Relax: ${u} is not closer to any outside point than the tree already is, so minCost does not change.`,
        { u, changed, round, predict: q2 },
      );
    }
    snap(`All ${n} points are in the tree. Minimum cost = ${total}. n rounds × O(n) scan + O(n) relax = O(n²) time, O(n) memory — no edge list was ever built.`, { round: n });
    frames.at(-1).result = total;
    return frames;
  },
};

// ====================== mst-virtual-node ======================
export const mstVirtualNode = {
  problem: { name: 'Optimize Water Distribution in a Village', statement: 'Each house can build its own well or be joined by pipes to a house with water. Return the cheapest way to supply every house.', example: 'n = 4, wells [2, 6, 5, 1] with the default pipes → 8', exampleOutput: 8, questionId: 'optimize-water-distribution-in-a-village' },
  title: 'MST with a virtual node: wells and pipes',
  description:
    'Optimize water distribution: add node 0 joined to every house i by an edge of weight wells[i − 1], then run Kruskal on the n + 1 nodes and stop at n edges. Houses are 1..n; n is clamped to 0–7 and to wells.length, at most 9 pipes (weights 0–99); bad pipes are dropped.',
  defaultInput: { n: 4, wells: [2, 6, 5, 1], pipes: [[1, 2, 3], [2, 3, 2], [3, 4, 4], [1, 3, 6]] },
  fields: [
    { key: 'n', type: 'number', label: 'n houses (max 7)' },
    { key: 'wells', type: 'numbers', label: 'wells (cost per house)' },
    { key: 'pipes', type: 'json', label: 'pipes [[u, v, w], …]' },
  ],
  testInputs: [
    { n: 0, wells: [], pipes: [] },
    { n: 1, wells: [5], pipes: [] },
    { n: 3, wells: [1, 2, 2], pipes: [[1, 2, 1], [2, 3, 1]] },
    { n: 4, wells: [3, 3, 3, 3], pipes: [[1, 2, 3], [3, 4, 3]] },
    { n: 3, wells: [9, 9, 9], pipes: [[1, 2, 1], [1, 2, 1], [2, 3, 1], [3, 1, 1]] },
    { n: 9, wells: [4, 1, 7, 3, 8, 2, 6, 5, 9], pipes: [[1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 6, 1], [6, 7, 3], [7, 1, 2], [2, 6, 1], [8, 9, 1]] },
  ],
  generate({ n, wells, pipes }) {
    const cost = (Array.isArray(wells) ? wells : []).map((w) => clamp(toInt(w), 0, 99));
    n = clamp(Math.min(toInt(n), cost.length), 0, 7);
    const pipeList = cleanEdges(pipes, n, { weighted: true, maxE: 9, lo: 1 }).map(([u, v, w]) => [u, v, clamp(w, 0, 99)]);
    const all = pipeList.map(([u, v, w]) => [u, v, w]);
    for (let i = 1; i <= n; i++) all.push([0, i, cost[i - 1]]);
    const order = all.map((_, i) => i).sort((a, b) => all[a][2] - all[b][2] || a - b);
    const labels = order.map((i) => `${all[i][0]}-${all[i][1]}:${all[i][2]}`);
    const circle = layoutCircle(n);
    const R = Math.max(1.6, n * 0.42);
    const pos = [{ x: R, y: R }, ...circle.map((p) => ({ x: p.x, y: p.y }))];
    const parent = Array.from({ length: n + 1 }, (_, i) => i);
    const find = (x) => {
      while (parent[x] !== x) x = parent[x] = parent[parent[x]];
      return x;
    };
    const edgeState = {};
    const listHl = {};
    let total = 0;
    let used = 0;
    let showVirtual = false;
    let sorted = false;
    const frames = [];
    const snap = (note, { cur = -1, active = [], predict } = {}) => {
      const shown = all.map((e, i) => i).filter((i) => showVirtual || i < pipeList.length);
      const f = {
        note,
        panels: [
          graph(pos, shown.map((i) => ({ from: all[i][0], to: all[i][1], label: all[i][2], state: edgeState[i] })), {
            state: (i) => (active.includes(i) ? 'active' : i === 0 ? (showVirtual ? 'visited' : 'hidden') : ''),
            title: 'houses 1..n, node 0 = virtual water source',
          }),
          ...(sorted ? [windowArr(labels, cur, { label: 'edges sorted by weight (u-v:w)', highlights: { ...listHl, ...(cur >= 0 ? { [cur]: 'active' } : {}) } })] : []),
          arr([...parent], { label: 'union-find parent (nodes 0..n)' }),
          vars({ 'edges used': used, 'need': n, total }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (!n) {
      snap('n = 0: no houses, nothing to supply.');
      snap('Done: total cost = 0.');
      frames.at(-1).result = 0;
      return frames;
    }
    snap(`${n} house(s). Each can build its own well (wells = [${cost.slice(0, n).join(', ')}]) or get water through a pipe. A well is not an edge, so plain MST does not apply yet.`);
    showVirtual = true;
    snap(
      `Add virtual node 0 with an edge 0–i of weight wells[i − 1]: "house i builds a well" = "house i is joined to the source". Now every plan is a spanning tree of n + 1 = ${n + 1} nodes.`,
      { active: [0], predict: ask(`The enlarged graph has ${n + 1} nodes. After how many accepted edges does Kruskal stop?`, [String(n - 1), String(n), String(n + 1)], 1, 'A spanning tree of n + 1 nodes has n edges.') },
    );
    sorted = true;
    snap(`Sort all ${all.length} edges (${pipeList.length} pipe(s) + ${n} well edge(s)) by weight. From here it is plain Kruskal — wells and pipes are treated the same.`);
    let asks = 1;
    let rejectAsked = false;
    for (let k = 0; k < order.length && used < n; k++) {
      const i = order[k];
      const [u, v, w] = all[i];
      const ru = find(u);
      const rv = find(v);
      const ok = ru !== rv;
      let predict;
      if (k % 2 === 1 || (!ok && !rejectAsked)) {
        if (!ok) rejectAsked = true;
        predict = yesNo(`Edge ${u}-${v} (w=${w}) is next. Accept it?`, ok, asks++, 'Accept when find(u) ≠ find(v); otherwise it would close a cycle.');
      }
      const what = u === 0 ? `well at house ${v}` : `pipe ${u}–${v}`;
      if (ok) {
        parent[rv] = ru;
        total += w;
        used++;
        edgeState[i] = 'done';
        listHl[k] = 'done';
        snap(`${what} (w=${w}): ${u} and ${v} are in different components → accept. Total = ${total}, ${used}/${n} edges.`, { cur: k, active: [u, v], predict });
      } else {
        edgeState[i] = 'muted';
        listHl[k] = 'bad';
        snap(`${what} (w=${w}): ${u} and ${v} already share a root (${ru}) → reject, it would close a cycle${u === 0 ? ' (this house already gets water)' : ''}.`, { cur: k, active: [u, v], predict });
      }
    }
    for (let k = 0; k < order.length; k++) if (!listHl[k]) listHl[k] = 'muted';
    const wellsAt = order.filter((i) => edgeState[i] === 'done' && all[i][0] === 0).map((i) => all[i][1]);
    const q = pick('Kruskal is done. How many houses build a well?', wellsAt.length, [wellsAt.length + 1, Math.max(1, wellsAt.length - 1), n], asks++, 'Count accepted edges that touch node 0.');
    snap(
      `Done: ${n} edges used. Wells at house(s) ${wellsAt.join(', ')}; the other houses get pipes. Minimum total cost = ${total}. Kruskal on m + n edges: O((m + n) log(m + n)).`,
      { predict: q },
    );
    frames.at(-1).result = total;
    return frames;
  },
};

// ====================== mst-edge-classification ======================
export const mstCriticalEdges = {
  problem: { name: 'Critical and Pseudo-Critical MST Edges', statement: 'Classify each edge: in every minimum spanning tree (critical), in some but not all (pseudo-critical), or in none.', example: 'the default graph → [[0, 3, 4], [1, 2]] (critical #0, #3, #4; pseudo-critical #1, #2)', exampleOutput: [[0, 3, 4], [1, 2]], questionId: 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree' },
  title: 'Critical and pseudo-critical MST edges',
  description:
    'Run Kruskal once for the best weight, then for each edge: ban it (weight goes up or graph splits → critical), otherwise force it first (weight stays the same → pseudo-critical). n is clamped to 0–5 and at most 6 edges; self-loops and bad edges are dropped; #i is the edge’s index in the kept list.',
  defaultInput: { n: 5, edges: [[0, 1, 1], [1, 2, 2], [0, 2, 2], [2, 3, 3], [3, 4, 1], [2, 4, 4]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (max 5)' },
    { key: 'edges', type: 'json', label: 'edges [[u, v, w], …] (max 6)' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 4, edges: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 1]] },
    { n: 4, edges: [[0, 1, 1], [2, 3, 2]] },
    { n: 3, edges: [[0, 1, 2], [0, 1, 2], [1, 2, 3]] },
    { n: 9, edges: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [0, 3, 2], [0, 4, 3], [3, 4, 3], [1, 1, 0], [2, 4, 9]] },
  ],
  generate({ n, edges }) {
    n = clamp(toInt(n), 0, 5);
    const es = sortedEdges(edges, n); // sorted by weight (ties keep input order); es[k] = [u, v, w, originalIndex]
    const m = es.length;
    const pos = layoutCircle(n);
    // Template mstWith over the sorted list; also returns which sorted indexes were used.
    const mstWith = (skip = -1, force = -1) => {
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      const union = (a, b) => {
        const ra = find(a);
        const rb = find(b);
        if (ra === rb) return false;
        parent[ra] = rb;
        return true;
      };
      let total = 0;
      let used = 0;
      const taken = [];
      if (force !== -1) {
        const [u, v, w] = es[force];
        union(u, v);
        total += w;
        used++;
        taken.push(force);
      }
      for (let i = 0; i < m; i++) {
        if (i === skip || i === force) continue;
        const [u, v, w] = es[i];
        if (union(u, v)) {
          total += w;
          used++;
          taken.push(i);
        }
      }
      return { total: used === n - 1 ? total : Infinity, taken };
    };
    const rows = es.map(([u, v, w]) => [`${u}-${v}:${w}`, '', '', '']);
    const cls = new Array(m).fill('');
    const frames = [];
    const snap = (note, { taken = [], skip = -1, force = -1, cur = -1, predict, best = '—' } = {}) => {
      const f = {
        note,
        panels: [
          graph(
            pos,
            es.map(([u, v, w], i) => ({ from: u, to: v, label: i === skip ? `✕${w}` : i === force ? `+${w}` : w, state: i === skip ? 'muted' : taken.includes(i) ? 'done' : '' })),
            { state: (i) => (cur >= 0 && (es[cur][0] === i || es[cur][1] === i) ? 'active' : ''), title: 'orange = tree of this Kruskal run (✕ banned, + forced)' },
          ),
          {
            kind: 'table',
            label: 'edges sorted by weight',
            rowLabels: es.map((e) => `#${e[3]}`),
            colLabels: ['u-v:w', 'skip', 'force', 'class'],
            cells: rows.map((r) => [...r]),
            states: rows.map((_, i) => {
              const s = i === cur ? 'active' : cls[i] === 'crit' ? 'done' : cls[i] === 'pseudo' ? 'visited' : cls[i] === 'none' ? 'muted' : '';
              return [s, s, s, s];
            }),
          },
          vars({ best, edge: cur >= 0 ? `${es[cur][0]}-${es[cur][1]}` : '—' }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(`${n} node(s), ${m} edge(s), sorted by weight (the template expects that). Goal: label every edge critical (in every MST), pseudo-critical (in some) or neither.`);
    const base = mstWith();
    const best = base.total;
    if (n <= 1) {
      snap(`n = ${n}: a spanning tree needs ${Math.max(0, n - 1)} edges, so best = 0 and no edge is used by any MST.`, { best: 0 });
      frames.at(-1).result = [[], []];
      return frames;
    }
    if (best === Infinity) {
      snap(`Kruskal could not reach n − 1 = ${n - 1} edges: the graph is disconnected, so no spanning tree exists and the question has no answer (the problem guarantees a connected graph).`, { taken: base.taken, best: '∞' });
      frames.at(-1).result = null;
      return frames;
    }
    snap(`Plain Kruskal: best = ${best}. This is ONE MST — with ties, being in it does not decide anything, so each edge gets its own test.`, { taken: base.taken, best });
    let asks = 0;
    let decisions = 0;
    for (let i = 0; i < m; i++) {
      const [u, v] = es[i];
      const sk = mstWith(i);
      const crit = sk.total > best;
      rows[i][1] = fmt(sk.total);
      if (crit) {
        rows[i][3] = 'crit';
        cls[i] = 'crit';
      }
      const q1 = decisions++ % 2 === 0 ? yesNo(`Ban edge ${u}-${v}. Does the MST weight go above ${best} (or the graph split)?`, crit, asks++, 'If the best tree without it costs more, every MST needs it.') : undefined;
      snap(
        crit
          ? `Ban ${u}-${v}: the best tree now ${sk.total === Infinity ? 'cannot connect everything (∞)' : `costs ${sk.total} > ${best}`}. Every MST needs this edge → critical.`
          : `Ban ${u}-${v}: another tree still costs ${best}. So it is NOT critical — but is it in SOME MST?`,
        { taken: sk.taken, skip: i, cur: i, predict: q1, best },
      );
      if (crit) continue;
      const fo = mstWith(-1, i);
      const pseudo = fo.total === best;
      rows[i][2] = fmt(fo.total);
      rows[i][3] = pseudo ? 'pseudo' : 'none';
      cls[i] = pseudo ? 'pseudo' : 'none';
      const q2 = decisions++ % 2 === 0 ? yesNo(`Force ${u}-${v} into the tree first. Does the total stay at ${best}?`, pseudo, asks++, 'Equal to best means some MST contains this edge.') : undefined;
      snap(
        pseudo
          ? `Force ${u}-${v} first, then Kruskal as usual: total = ${fo.total} = best. Some MST uses it → pseudo-critical.`
          : `Force ${u}-${v} first: total = ${fo.total} > ${best}. No MST uses it → neither.`,
        { taken: fo.taken, force: i, cur: i, predict: q2, best },
      );
    }
    const names = (c) => es.filter((_, i) => cls[i] === c).map((e) => `#${e[3]}`).join(', ') || 'none';
    snap(`Done. Critical: ${names('crit')}. Pseudo-critical: ${names('pseudo')}. Neither: ${names('none')}. Up to 2m extra Kruskal runs: O(m · m α(n)) after the sort.`, { taken: base.taken, best });
    frames.at(-1).result = ['crit', 'pseudo'].map((c) => es.filter((_, i) => cls[i] === c).map((e) => e[3]).sort((a, b) => a - b));
    return frames;
  },
};
function sortedEdges(edges, n) {
  return cleanEdges(edges, n, { weighted: true, maxE: 6 })
    .map((e, i) => [...e, i])
    .sort((a, b) => a[2] - b[2] || a[3] - b[3]);
}

// ====================== adv-graph-lowlink-bridges ======================
export const tarjanBridges = {
  problem: { name: 'Critical Connections in a Network', statement: 'Find every edge whose removal disconnects the graph (a bridge).', example: 'triangles 0-1-2 and 3-4-5, plus 1–3 and 5–6 → bridges [[1, 3], [5, 6]]', exampleOutput: [[1, 3], [5, 6]], questionId: 'critical-connections-in-a-network' },
  title: 'Bridges with disc / low (Tarjan)',
  description:
    'Critical connections: one DFS sets disc[u] = low[u] = time++; a back edge lowers low[u] to disc[v], a returning child lowers it to low[v], and tree edge u–v is a bridge when low[v] > disc[u]. n is clamped to 0–8, at most 10 undirected edges; self-loops and bad edges are dropped (parallel edges are kept).',
  defaultInput: { n: 7, edges: [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4], [4, 5], [5, 3], [5, 6]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (max 8)' },
    { key: 'edges', type: 'json', label: 'edges [[u, v], …]' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]] },
    { n: 5, edges: [[0, 1], [0, 1], [1, 2], [3, 4]] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 0], [1, 3]] },
    { n: 12, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [2, 6], [3, 3], [9, 1]] },
  ],
  generate({ n, edges }) {
    n = clamp(toInt(n), 0, 8);
    const list = cleanEdges(edges, n, { maxE: 10 });
    const adj = Array.from({ length: n }, () => []);
    list.forEach(([u, v], id) => {
      adj[u].push([v, id]);
      adj[v].push([u, id]);
    });
    const pos = layoutCircle(n);
    const disc = new Array(n).fill(-1);
    const low = new Array(n).fill(0);
    const bridges = [];
    const kind = {}; // edge id → 'tree' | 'back'
    const stack = [];
    const finished = new Set();
    let time = 0;
    const frames = [];
    const snap = (note, { cur = -1, hot = [], predict, end = false } = {}) => {
      const f = {
        note,
        panels: [
          graph(
            pos,
            list.map(([a, b], id) => {
              const isBridge = bridges.some((x) => x.id === id);
              if (end) return { from: a, to: b, state: isBridge ? 'done' : 'muted', ...(isBridge ? { label: 'bridge' } : {}) };
              return { from: a, to: b, state: kind[id] === 'tree' ? 'done' : '', ...(isBridge ? { label: 'bridge' } : kind[id] === 'back' ? { label: 'back' } : {}) };
            }),
            { state: (i) => (i === cur || hot.includes(i) ? 'active' : stack.includes(i) ? 'visited' : finished.has(i) ? 'done' : ''), title: end ? 'orange = bridge' : 'orange edges = DFS tree' },
          ),
          {
            kind: 'table',
            label: 'discovery time / low-link',
            rowLabels: pos.map((_, i) => String(i)),
            colLabels: ['disc', 'low'],
            cells: pos.map((_, i) => (disc[i] < 0 ? ['—', '—'] : [disc[i], low[i]])),
            states: pos.map((_, i) => (i === cur || hot.includes(i) ? ['active', 'active'] : disc[i] < 0 ? ['', ''] : ['visited', 'visited'])),
          },
          { kind: 'stack', values: [...stack], label: 'DFS call stack' },
          vars({ time, bridges: bridges.length ? bridges.map((b) => `${b.u}-${b.v}`).join(' ') : '—' }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(n ? `${n} node(s), ${list.length} edge(s). disc[u] = when u was discovered; low[u] = the earliest disc its subtree can reach with at most one back edge. Unvisited = −1.` : 'Empty graph: no edges, so no bridges.');
    let asks = 0;
    let returns = 0;
    let parentNoted = false;
    const dfs = (u, parentEdge) => {
      disc[u] = low[u] = time++;
      stack.push(u);
      snap(`Enter ${u}: disc[${u}] = low[${u}] = ${disc[u]}.`, { cur: u });
      for (const [v, id] of adj[u]) {
        if (id === parentEdge) {
          if (!parentNoted) {
            parentNoted = true;
            snap(`At ${u}, edge ${u}–${v} is the tree edge we came in on — skip it by EDGE id (skipping by node id would break with parallel edges).`, { cur: u, hot: [v] });
          }
          continue;
        }
        if (disc[v] === -1) {
          kind[id] = 'tree';
          dfs(v, id);
          const before = low[u];
          low[u] = Math.min(low[u], low[v]);
          const isBridge = low[v] > disc[u];
          if (isBridge) bridges.push({ u, v, id });
          const q = returns++ % 2 === 0 ? yesNo(`Back at ${u} from ${v}: low[${v}] = ${low[v]}, disc[${u}] = ${disc[u]}. Is ${u}–${v} a bridge?`, isBridge, (returns - 1) / 2, 'Bridge iff low[v] > disc[u] (strict).') : undefined;
          snap(
            `Back at ${u} from ${v}: low[${u}] = min(${before}, low[${v}] = ${low[v]}) = ${low[u]}. ${isBridge ? `low[${v}] = ${low[v]} > disc[${u}] = ${disc[u]}: ${v}'s subtree cannot climb to ${u} → ${u}–${v} is a bridge.` : `low[${v}] = ${low[v]} ≤ disc[${u}] = ${disc[u]}: ${v}'s subtree reaches ${u} or higher another way → not a bridge.`}`,
            { cur: u, hot: [v], predict: q },
          );
        } else if (disc[v] < disc[u]) {
          kind[id] = 'back';
          const before = low[u];
          low[u] = Math.min(low[u], disc[v]);
          const q = asks < 1 || returns % 3 === 1 ? pick(`${u} sees already-visited ${v} (disc ${disc[v]}). What is low[${u}] now?`, low[u], [low[v], before, disc[u] + 1].filter((x) => x !== low[u]), asks++, 'A back edge uses disc[v], not low[v].') : undefined;
          snap(`Back edge ${u}–${v}: ${v} is an ancestor already on the stack. low[${u}] = min(${before}, disc[${v}] = ${disc[v]}) = ${low[u]}.`, { cur: u, hot: [v], predict: q });
        } else {
          low[u] = Math.min(low[u], disc[v]); // descendant already finished: never lowers low[u]
        }
      }
      stack.pop();
      finished.add(u);
    };
    for (let s = 0; s < n; s++) {
      if (disc[s] !== -1) continue;
      if (s > 0) snap(`Node ${s} is still unvisited — a new component. Start another DFS there.`, { cur: s });
      dfs(s, -1);
    }
    if (n) snap(`Done. Bridges: ${bridges.length ? bridges.map((b) => `${b.u}–${b.v}`).join(', ') : 'none (every edge lies on a cycle)'}. One DFS: O(V + E).`, { end: true });
    else snap('Done: no bridges. O(V + E) = O(0).', { end: true });
    frames.at(-1).result = bridges.map((b) => [Math.min(b.u, b.v), Math.max(b.u, b.v)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return frames;
  },
};

// ====================== adv-graph-scc-kosaraju ======================
const LETTERS = 'ABCDEFGH';
export const kosarajuScc = {
  problem: { name: 'Strongly connected components (Kosaraju)', statement: 'Split a directed graph into groups in which every node can reach every other.', example: 'the default 7-node graph → [[0, 1, 2], [3, 4, 5], [6]]', exampleOutput: [[0, 1, 2], [3, 4, 5], [6]], questionId: 'classic-count-scc-kosaraju' },
  title: 'Kosaraju: strongly connected components',
  description:
    'Pass 1: DFS the graph and push each node when it FINISHES. Pass 2: DFS the reversed graph in decreasing finish time; each pass-2 tree is one SCC (letter after the node id). n is clamped to 0–8, at most 12 directed edges; self-loops and bad edges are dropped.',
  defaultInput: { n: 7, edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [6, 5]] },
  fields: [
    { key: 'n', type: 'number', label: 'n (max 8)' },
    { key: 'edges', type: 'json', label: 'directed edges [[u, v], …]' },
  ],
  testInputs: [
    { n: 0, edges: [] },
    { n: 1, edges: [] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 3]] },
    { n: 5, edges: [[0, 1], [1, 0], [2, 3], [3, 2], [0, 1]] },
    { n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]] },
    { n: 10, edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 3], [2, 3], [5, 6], [6, 7], [7, 5], [7, 3], [8, 9], [1, 1]] },
  ],
  generate({ n, edges }) {
    n = clamp(toInt(n), 0, 8);
    const list = cleanEdges(edges, n, { maxE: 12 });
    const g = Array.from({ length: n }, () => []);
    const rg = Array.from({ length: n }, () => []);
    for (const [u, v] of list) {
      g[u].push(v);
      rg[v].push(u);
    }
    const pos = layoutCircle(n);
    const seen = new Array(n).fill(false);
    const order = [];
    const comp = new Array(n).fill(-1);
    const stack = [];
    let reversed = false;
    let count = 0;
    const frames = [];
    const snap = (note, { cur = -1, ptr = -1, predict } = {}) => {
      const f = {
        note,
        panels: [
          graph(
            pos,
            list.map(([u, v]) => ({ from: reversed ? v : u, to: reversed ? u : v, state: reversed && comp[u] >= 0 && comp[u] === comp[v] ? 'done' : '' })),
            {
              directed: true,
              label: (i) => (comp[i] >= 0 ? `${i}${LETTERS[comp[i]]}` : String(i)),
              state: (i) => (i === cur ? 'active' : reversed ? (comp[i] >= 0 ? 'done' : '') : stack.includes(i) ? 'visited' : order.includes(i) ? 'done' : ''),
              title: reversed ? 'pass 2: REVERSED graph (letter = SCC)' : 'pass 1: original graph',
            },
          ),
          arr([...order], { label: 'finish order (pass 1)', highlights: Object.fromEntries(order.map((u, i) => [i, reversed ? (comp[u] >= 0 ? 'done' : '') : u === cur ? 'active' : ''])), ...(ptr >= 0 ? { pointers: [{ index: ptr, label: 'i', color: 'a' }] } : {}) }),
          { kind: 'stack', values: [...stack], label: 'DFS call stack' },
          vars({ pass: reversed ? 2 : 1, SCCs: count }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    if (!n) {
      snap('Empty graph: no nodes, no SCCs.');
      snap('Done: count = 0.');
      frames.at(-1).result = [];
      return frames;
    }
    snap(`${n} node(s), ${list.length} directed edge(s). An SCC is a group where every node can reach every other. Pass 1 records the order in which DFS calls FINISH.`);
    let asks = 0;
    let firstFinish = true;
    const dfs1 = (u) => {
      seen[u] = true;
      stack.push(u);
      snap(`Pass 1: enter ${u}. Its out-edges go to [${g[u].join(', ') || 'nothing'}].`, { cur: u });
      for (const v of g[u]) if (!seen[v]) dfs1(v);
      stack.pop();
      order.push(u);
      const q = firstFinish ? pick('Which node finishes FIRST (all its out-neighbours already seen)?', u, [...stack].reverse().concat(g[u]).slice(0, 3), asks++, 'The deepest call returns first.') : undefined;
      firstFinish = false;
      snap(`${u} finishes: every out-neighbour is seen. Push ${u} onto order (position ${order.length - 1}).`, { cur: u, predict: q });
    };
    for (let u = 0; u < n; u++) {
      if (seen[u]) continue;
      if (u > 0) snap(`Pass 1: ${u} was never reached — start a new DFS from it.`, { cur: u });
      dfs1(u);
    }
    reversed = true;
    const lastU = order[n - 1];
    snap(
      `Pass 1 done. Now reverse every edge. Walk order from the END (decreasing finish time): order[${n - 1}] = ${lastU} goes first.`,
      { ptr: n - 1, predict: pick('Pass 2 runs on the reversed graph. Which node starts it?', lastU, [order[0], 0, order[Math.floor(n / 2)]], asks++, 'The node that finished LAST in pass 1.') },
    );
    const dfs2 = (u, c) => {
      comp[u] = c;
      stack.push(u);
      snap(`Pass 2: ${u} joins SCC ${LETTERS[c]}. Reversed edges lead to [${rg[u].join(', ') || 'nothing'}]; only unassigned ones are followed.`, { cur: u });
      for (const v of rg[u]) if (comp[v] === -1) dfs2(v, c);
      stack.pop();
    };
    for (let i = n - 1; i >= 0; i--) {
      const u = order[i];
      if (comp[u] !== -1) continue;
      const c = count++;
      dfs2(u, c);
      const members = comp.map((x, k) => (x === c ? k : -1)).filter((k) => k >= 0);
      const q = c === 1 ? pick(`Which nodes form SCC ${LETTERS[c]}?`, members.join(', '), [members.slice(0, 1).join(', '), comp.map((x, k) => (x === -1 || x === c ? k : -1)).filter((k) => k >= 0).join(', '), [...members, ...comp.map((x, k) => (x === 0 ? k : -1)).filter((k) => k >= 0)].join(', ')], asks++, 'Pass 2 on the reversed graph cannot leak into a different SCC that is still unassigned.') : undefined;
      snap(`SCC ${LETTERS[c]} = {${members.join(', ')}}: the reversed DFS from ${u} can't leave it, because every other SCC it could reach is already assigned.`, { ptr: i, predict: q });
    }
    snap(`Done: ${count} SCC(s). Collapsing each SCC to one node gives a DAG (the condensation). Two DFS passes: O(V + E).`);
    frames.at(-1).result = Array.from({ length: count }, (_, c) => comp.map((x, k) => (x === c ? k : -1)).filter((k) => k >= 0)).sort((a, b) => a[0] - b[0]);
    return frames;
  },
};

// ====================== adv-graph-meta-bfs ======================
export const busRoutesMetaBfs = {
  problem: { name: 'Bus Routes', statement: 'Each bus loops through its stops. Return the fewest buses needed to travel from source to target, or -1.', example: 'routes [[1,2,7], [3,6,7], [2,5], [5,9,6]], 1 → 9 → 3 buses', exampleOutput: 3, questionId: 'bus-routes' },
  title: 'Bus routes: BFS over routes',
  description:
    'Least number of buses: index stop → routes, then BFS level by level; boarding a route marks it used and puts all its new stops in the next frontier. The graph shows routes as nodes (linked when they share a stop). At most 5 routes of 4 stops each (stop ids 0–99).',
  defaultInput: { routes: [[1, 2, 7], [3, 6, 7], [2, 5], [5, 9, 6]], source: 1, target: 9 },
  fields: [
    { key: 'routes', type: 'json', label: 'routes [[stops], …]' },
    { key: 'source', type: 'number', label: 'source stop' },
    { key: 'target', type: 'number', label: 'target stop' },
  ],
  testInputs: [
    { routes: [], source: 1, target: 2 },
    { routes: [[1, 2]], source: 3, target: 3 },
    { routes: [[1, 2, 7], [3, 6, 7]], source: 1, target: 6 },
    { routes: [[1, 2], [3, 4]], source: 1, target: 4 },
    { routes: [[1, 2, 3], [3, 4, 5], [5, 1], [2, 4]], source: 1, target: 9 },
    { routes: [[7, 12], [4, 5, 15], [6], [15, 19], [9, 12, 13], [1, 2]], source: 15, target: 12 },
  ],
  generate({ routes, source, target }) {
    const groups = (Array.isArray(routes) ? routes : [])
      .filter(Array.isArray)
      .map((r) => [...new Set(r.map((x) => clamp(toInt(x), 0, 99)))].slice(0, 4))
      .filter((r) => r.length)
      .slice(0, 5);
    source = clamp(toInt(source), 0, 99);
    target = clamp(toInt(target), 0, 99);
    const byItem = new Map();
    groups.forEach((g, id) => g.forEach((x) => {
      if (!byItem.has(x)) byItem.set(x, []);
      byItem.get(x).push(id);
    }));
    const pos = layoutCircle(groups.length);
    const metaEdges = [];
    for (let a = 0; a < groups.length; a++)
      for (let b = a + 1; b < groups.length; b++) {
        const shared = groups[a].filter((x) => groups[b].includes(x));
        if (shared.length) metaEdges.push({ from: a, to: b, label: shared[0] });
      }
    const usedGroup = new Array(groups.length).fill(false);
    const seenItem = new Set([source]);
    let frontier = [source];
    let next = [];
    let steps = 0;
    const frames = [];
    const show = (xs) => (xs.length > 8 ? [...xs.slice(0, 7).map(String), `+${xs.length - 7}`] : xs.map(String));
    const snap = (note, { cur = -1, item, predict, hit = -1 } = {}) => {
      const f = {
        note,
        panels: [
          graph(pos, metaEdges.map((e) => ({ ...e, state: usedGroup[e.from] && usedGroup[e.to] ? 'done' : '' })), {
            label: (i) => `R${i}`,
            state: (i) => (i === cur ? 'active' : usedGroup[i] ? 'done' : item !== undefined && (byItem.get(item) || []).includes(i) ? 'visited' : ''),
            title: 'routes (edge label = a shared stop)',
          }),
          arr(show(frontier), { label: `frontier stops (level ${steps})`, highlights: item !== undefined && frontier.indexOf(item) < 8 ? { [frontier.indexOf(item)]: 'active' } : {} }),
          {
            kind: 'table',
            label: 'routes',
            rowLabels: groups.map((_, i) => `R${i}`),
            colLabels: ['stops', 'used'],
            cells: groups.map((g, i) => [g.join(','), usedGroup[i] ? '✓' : '']),
            states: groups.map((g, i) => (i === cur ? (i === hit ? ['done', 'done'] : ['active', 'active']) : usedGroup[i] ? ['visited', 'visited'] : ['', ''])),
          },
          vars({ buses: steps, next: next.length ? next.join(',') : '—', source, target }),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(`${groups.length} route(s). Riding inside a route is free; each new route costs 1 bus. Index stop → routes first, so each stop finds its routes in O(1).`);
    if (source === target) {
      snap(`source === target (${source}): no bus needed. Answer 0.`);
      frames.at(-1).result = 0;
      return frames;
    }
    let asks = 0;
    let boards = 0;
    while (frontier.length) {
      steps++;
      next = [];
      snap(`Level ${steps}: every stop in the frontier can board any unused route through it. Any stop reached now costs ${steps} bus(es).`);
      for (const item of frontier) {
        for (const gid of byItem.get(item) ?? []) {
          if (usedGroup[gid]) {
            snap(`Stop ${item} is on R${gid}, but R${gid} is already used — skip it. Not marking routes would rescan them again and again.`, { item });
            continue;
          }
          usedGroup[gid] = true;
          const fresh = [];
          let found = false;
          for (const x of groups[gid]) {
            if (x === target) {
              found = true;
              break;
            }
            if (!seenItem.has(x)) {
              seenItem.add(x);
              next.push(x);
              fresh.push(x);
            }
          }
          if (found) {
            const q = pick(`Board R${gid} from stop ${item}: it contains target ${target}. What is the answer?`, steps, [steps + 1, steps - 1, -1].filter((x) => x >= -1), asks++, 'The answer is the BFS level = number of buses.');
            snap(`Board R${gid} from stop ${item}: it stops at ${target}! Answer = ${steps} bus(es). Each route is scanned at most once: O(total stops).`, { cur: gid, item, hit: gid, predict: q });
            frames.at(-1).result = steps;
            return frames;
          }
          const q = boards++ % 2 === 0 ? pick(`Board R${gid} (stops ${groups[gid].join(',')}). Which stops are added to the next frontier?`, fresh.join(',') || 'none', [groups[gid].join(','), groups[gid].filter((x) => x !== item).join(',') || 'none', 'none'], asks++, 'Only stops never seen before join the next frontier.') : undefined;
          snap(`Board R${gid} from stop ${item} and mark it used. New stops ${fresh.length ? fresh.join(', ') : '— none'} join the next frontier.`, { cur: gid, item, predict: q });
        }
      }
      frontier = next;
      next = [];
    }
    snap(`The frontier is empty and ${target} was never reached: answer −1. Each route was scanned at most once: O(total stops).`);
    frames.at(-1).result = -1;
    return frames;
  },
};
