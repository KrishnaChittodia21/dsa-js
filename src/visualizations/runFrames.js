// "Animate my run" (M4): turns a recorded run (src/runner/recorder.js) into Visualizer frames
// ({ note, line, panels }, drawn by panels.jsx). Generic for every question, picked by the value's shape and name:
// arrays → cell rows (stacks / queues / heaps by name), 2-D arrays → grids (DP tables by name), adjacency lists →
// graphs, parent arrays → union-find forests, TreeNode / ListNode → trees / lists (other variables pointing into
// them become tags), Maps → key/value tables, Sets → rows, toolkit objects (MinHeap, Stack, Queue, UnionFind,
// Graph) → their structure, `this` (design classes) → one panel per field. Cells that changed since the previous
// step are highlighted. A scene file (src/visualizations/scenes/) can rename, filter and narrate on top.
import { layoutCircle, layoutHeap, layoutLevelOrderTree, layoutNary } from './layout.js';

const INDEX_NAME = /^(i|j|k|l|r|lo|hi|left|right|mid|m|start|end|p|q|slow|fast|idx|index|ptr|cur|pos|write|read|w)$/;
const STACK_NAME = /stack|^st$|^stk$/i;
const QUEUE_NAME = /queue|^q$|^dq$|deque/i;
const HEAP_NAME = /heap|^pq$|priority/i;
const ADJ_NAME = /adj|graph|^g$|nei|neighbou?rs|children|^out$/i;
const PARENT_NAME = /^(parent|parents|par|fa|leader|uf)$/i;
const VISITED_NAME = /visited|seen|^vis$|colou?r/i;
const AT_NODE = /^(node|u|cur|curr|current|at|from|src)$/;
const NEXT_NODE = /^(v|nei|nb|next|to|neighbou?r|child)$/;
const DP_NAME = /dp|memo|table|cost|dist/i;
const MAX_NODES = 16;

const isPrim = (v) => v === null || v === undefined || ['number', 'string', 'boolean'].includes(typeof v);
const isRow = (v) => Array.isArray(v) && v.every(isPrim);
const isGrid = (v, max = 12) => Array.isArray(v) && v.length > 0 && v.length <= max && v.every((r) => isRow(r) && r.length <= max);
const isObj = (v, tag) => v !== null && typeof v === 'object' && !Array.isArray(v) && tag in v;
const isInt = (v) => Number.isInteger(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clip = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

/** short text for a snapshot (recorder tags: $text $array $map $set $tree $list $obj) */
export function text(v) {
  if (v === undefined) return 'undefined';
  if (isPrim(v)) return typeof v === 'string' ? JSON.stringify(v) : String(v);
  if (Array.isArray(v)) return `[${v.map(text).join(',')}]`;
  if ('$text' in v) return v.$text;
  if ('$array' in v) return `[${v.$array.slice(0, 8).map(text).join(',')},… ${v.$length} items]`;
  if ('$map' in v) return `{${v.$map.map(([k, x]) => `${text(k)}: ${text(x)}`).join(', ')}${v.$size > v.$map.length ? ', …' : ''}}`;
  if ('$set' in v) return `{${v.$set.map(text).join(', ')}${v.$size > v.$set.length ? ', …' : ''}}`;
  if ('$tree' in v) return `tree [${v.$tree.map(text).join(',')}]`;
  if ('$graph' in v) return `node ${text(v.$graph.nodes[0]?.val)}`;
  if ('$trie' in v) return `trie of ${v.$trie.nodes.length}${v.$trie.more ? '+' : ''} nodes`;
  if ('$list' in v) return `${v.$list.values.map(text).join(' → ')}${v.$list.cycleTo !== undefined ? ' ↺' : ' → ∅'}`;
  const tk = '$obj' in v && unwrap(v); // a toolkit Deque / Queue / Stack / heap reads as its items, not its ring buffer
  if (tk && tk[0] !== 'adj') return `${tk[0]} [${tk[1].map(text).join(',')}]`;
  if ('$obj' in v) return `{${Object.entries(v.$obj).map(([k, x]) => `${k}: ${text(x)}`).join(', ')}}`;
  return JSON.stringify(v);
}
const label = (v) => clip(typeof v === 'string' ? v : text(v), 6);

function changedCells(cur, prev) {
  const out = {};
  if (!Array.isArray(prev)) return out;
  cur.forEach((v, i) => {
    if (!same(v, prev[i])) out[i] = 'active';
  });
  return out;
}

// ---------- shape tests ----------
/** adjacency list as an array: adj[u] = [v, …] with every v a vertex index */
/** one adjacency entry: v, or [v, weight] (weighted graphs) */
const entry = (x) => (isInt(x) ? [x, undefined] : Array.isArray(x) && x.length === 2 && isInt(x[0]) && typeof x[1] === 'number' ? x : null);

/** adjacency list as an array: adj[u] = [v, …] with every v a vertex index; adj.w['u,v'] = weight when weighted */
function asAdj(v) {
  let rows;
  if (isObj(v, '$map')) {
    if (v.$size > v.$map.length || !v.$map.every(([k, x]) => isInt(k) && k >= 0 && Array.isArray(x) && x.every(entry))) return null;
    const n = Math.max(-1, ...v.$map.flatMap(([k, x]) => [k, ...x.map((e) => entry(e)[0])])) + 1;
    if (n < 1 || n > MAX_NODES) return null;
    rows = Array.from({ length: n }, () => []);
    for (const [k, x] of v.$map) rows[k] = x;
  } else if (Array.isArray(v) && v.length > 1 && v.length <= MAX_NODES && v.every((r) => Array.isArray(r) && r.length === v.length && r.every((x) => typeof x === 'number'))) {
    // an n×n adjacency matrix (Prim's graph[i][j]): every non-zero, finite cell is an edge with that weight
    const weighted = v.some((r) => r.some((x) => x !== 0 && x !== 1));
    rows = v.map((r, u) => r.flatMap((x, j) => (j !== u && x !== 0 && Number.isFinite(x) ? [weighted ? [j, x] : j] : [])));
  } else {
    if (!Array.isArray(v) || !v.length || v.length > MAX_NODES) return null;
    if (!v.every((r) => Array.isArray(r) && r.every((x) => entry(x) && entry(x)[0] >= 0 && entry(x)[0] < v.length))) return null;
    rows = v;
  }
  const adj = rows.map((r) => r.map((x) => entry(x)[0]));
  adj.w = {};
  rows.forEach((r, u) => r.forEach((x) => entry(x)[1] !== undefined && (adj.w[`${u},${entry(x)[0]}`] = entry(x)[1])));
  return adj;
}
const isParentRow = (v) => isRow(v) && v.length > 0 && v.length <= MAX_NODES && v.every((x) => isInt(x) && x >= 0 && x < v.length) && v.some((x, i) => x === i);

// ---------- panel builders ----------
function heapPanel(name, row, prev) {
  const { nodes, edges } = layoutHeap(row);
  const hl = changedCells(row, Array.isArray(prev) ? prev : undefined);
  return {
    kind: 'nodes',
    label: `${name} (heap: top = index 0)`,
    nodes: nodes.map((n) => ({ id: n.id, label: label(n.val), x: n.x, y: n.y, state: hl[n.id] || (n.id === 0 ? 'done' : '') })),
    edges: edges.map(([from, to]) => ({ from, to })),
  };
}

function forestPanel(name, parent) {
  const kids = parent.map(() => []);
  const roots = [];
  parent.forEach((p, i) => (p === i ? roots.push(i) : kids[p].push(i)));
  // a parent array with a cycle (a bug) leaves some nodes under no root: the caller draws it as a row instead
  const seen = new Set();
  const build = (i) => {
    seen.add(i);
    return { id: i, label: String(i), children: kids[i].map(build) };
  };
  const top = { id: -1, label: '', children: roots.map(build) };
  if (seen.size !== parent.length) return null;
  // nodes still on their own go in one wrapping row, so 16 singletons do not make a 16-wide forest
  const lone = roots.filter((r) => !kids[r].length);
  const out = [];
  if (lone.length < roots.length) {
    // each group laid out on its own, groups placed left to right and wrapped onto a new band past ~7 nodes wide
    const wide = [];
    const nodes = [];
    const edges = [];
    let x0 = 0;
    let y0 = 0;
    let band = 0;
    for (const g of top.children.filter((c) => c.children.length)) {
      const lay = layoutNary(g);
      const w = Math.max(...lay.nodes.map((n) => n.x)) + 1;
      const h = Math.max(...lay.nodes.map((n) => n.y)) + 1;
      if (w > 7) {
        wide.push(g); // too wide to draw on a phone: listed as leader → members instead
        continue;
      }
      if (x0 > 0 && x0 + w > 7) (x0 = 0), (y0 += band + 0.6), (band = 0);
      for (const n of lay.nodes) nodes.push({ id: n.id, label: String(n.id), x: x0 + n.x, y: y0 + n.y, state: parent[n.id] === n.id ? 'done' : '' });
      for (const [f, t] of lay.edges) edges.push({ from: t, to: f });
      x0 += w + 0.5;
      band = Math.max(band, h);
    }
    if (nodes.length) out.push({ kind: 'nodes', label: `${name} (each root is one group)`, nodes, edges, directed: true });
    if (wide.length) {
      const members = (g) => [g.id, ...g.children.flatMap(members)];
      const rows = wide.flatMap((g) => {
        const m = members(g).slice(1);
        return Array.from({ length: Math.ceil(m.length / 6) }, (_, k) => [k ? '' : String(g.id), m.slice(k * 6, k * 6 + 6).join(', ')]);
      });
      out.push({ kind: 'table', label: `${name}: groups (leader → members)`, rowLabels: rows.map((r) => r[0]), colLabels: ['members'], cells: rows.map((r) => [r[1]]), states: rows.map(() => ['']) });
    }
  }
  if (lone.length) out.push(...wrapRow({ kind: 'array', label: lone.length === roots.length ? `${name}: every node is its own group` : 'on their own', values: lone, highlights: {}, showIndices: false }));
  return out;
}

/** nodes on a circle about one node apart (layoutCircle's wider circle is for the lessons' small graphs) */
function runCircle(n) {
  if (n <= 6) return layoutCircle(n);
  const R = Math.max(1.6, (n * 1.15) / (2 * Math.PI));
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { id: i, val: i, x: R + R * Math.cos(a), y: R + R * Math.sin(a) };
  });
}

function graphPanel(name, adj, vars) {
  const n = adj.length;
  const directed = adj.some((row, u) => row.some((v) => !adj[v].includes(u)));
  const visited = new Set();
  for (const [k, v] of Object.entries(vars)) {
    if (!VISITED_NAME.test(k)) continue;
    if (isObj(v, '$set')) v.$set.forEach((x) => visited.add(x));
    else if (isRow(v)) v.forEach((x, i) => x && x !== -1 && visited.add(i));
  }
  const node = (re) => Object.entries(vars).find(([k, v]) => re.test(k) && isInt(v) && v >= 0 && v < n)?.[1];
  const at = node(AT_NODE);
  const nxt = node(NEXT_NODE);
  const edges = [];
  adj.forEach((row, u) =>
    row.forEach((v) => {
      if (!directed && u > v) return;
      const hot = (u === at && v === nxt) || (!directed && v === at && u === nxt);
      const w = adj.w?.[`${u},${v}`];
      edges.push({ from: u, to: v, state: hot ? 'active' : '', ...(w !== undefined ? { label: String(w) } : {}) });
    }),
  );
  return {
    kind: 'nodes',
    label: `${name} (graph)`,
    nodes: runCircle(n).map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: p.id === at ? 'active' : p.id === nxt ? 'done' : visited.has(p.id) ? 'visited' : '' })),
    edges,
    directed,
    freeLayout: true,
  };
}

function treePanel(name, snap, tags) {
  const { nodes, edges } = layoutLevelOrderTree(snap.$tree);
  const ids = (snap.$ids || []).filter((x) => x !== null); // node k of the layout = the k-th non-null slot
  return {
    kind: 'nodes',
    label: name,
    nodes: nodes.map((n, k) => {
      const tag = tags.get(ids[k]);
      return { id: n.id, label: label(n.val), x: n.x, y: n.y, state: tag ? 'active' : '', ...(tag ? { tag: tag.join(',') } : {}) };
    }),
    edges: edges.map(([from, to]) => ({ from, to })),
  };
}

/** a trie: letters on the nodes, word ends highlighted, variables pointing into it as tags */
function triePanel(name, snap, tags) {
  const { nodes, edges, more } = snap.$trie;
  const kids = nodes.map(() => []);
  for (const [f, t] of edges) kids[f].push(t);
  const tag = (n) => (n.num === undefined ? '' : ` ${n.num}`); // a node's counter (prefix count, sum) beside its letter
  const build = (i) => ({ id: i, label: (i === 0 ? '·' : nodes[i].ch) + tag(nodes[i]), children: kids[i].map(build) });
  const laid = layoutNary(build(0));
  return {
    kind: 'nodes',
    label: `${name} (trie${more ? ', first 48 nodes' : ''}: lit = a word ends here)`,
    nodes: laid.nodes.map((n) => {
      const tag = tags.get(nodes[n.id].id);
      return { id: n.id, label: String(n.val), x: n.x, y: n.y, state: tag ? 'active' : nodes[n.id].end ? 'done' : '', ...(tag ? { tag: tag.join(',') } : {}) };
    }),
    edges: laid.edges.map(([from, to]) => ({ from, to })),
  };
}

/** nodes linked by neighbour lists (Clone Graph), on a circle; variables pointing into it as tags */
function nodeGraphPanel(name, snap, tags) {
  const { nodes, more } = snap.$graph;
  const seen = new Set();
  const edges = [];
  nodes.forEach((n, i) =>
    n.nb.forEach((j) => {
      const k = i < j ? `${i},${j}` : `${j},${i}`;
      if (j >= 0 && !seen.has(k)) seen.add(k), edges.push({ from: i, to: j });
    }),
  );
  return {
    kind: 'nodes',
    label: `${name} (graph${more ? ', first 16 nodes' : ''})`,
    // seats by node id, not by search order from the current node, so nodes stay put from step to step
    nodes: (() => {
      // by value when the values are distinct numbers (Clone Graph's 1…n go round the ring in order), else by node id
      const byVal = nodes.every((n) => typeof n.val === 'number') && new Set(nodes.map((n) => n.val)).size === nodes.length;
      const key = (i) => (byVal ? nodes[i].val : nodes[i].id ?? i);
      const seat = new Map([...nodes.keys()].sort((a, b) => key(a) - key(b)).map((i, k) => [i, k]));
      const circle = runCircle(nodes.length);
      return nodes.map((n, i) => {
        const tag = i === 0 ? [name, ...(tags.get(n.id) || [])] : tags.get(n.id); // nodes[0] is the drawn variable's own node
        const p = circle[seat.get(i)];
        return { id: i, label: label(n.val), x: p.x, y: p.y, state: tag ? 'active' : '', ...(tag ? { tag: tag.join(',') } : {}) };
      });
    })(),
    edges,
    freeLayout: true,
  };
}

function mapPanel(name, v, prev) {
  const before = new Map(isObj(prev, '$map') ? prev.$map.map(([k, x]) => [JSON.stringify(k), JSON.stringify(x)]) : []);
  return {
    kind: 'table',
    label: v.$size > v.$map.length ? `${name} (first ${v.$map.length} of ${v.$size})` : `${name} (map)`,
    rowLabels: v.$map.map(([k]) => clip(text(k), 12)),
    colLabels: ['value'],
    cells: v.$map.map(([, x]) => [clip(text(x), 24)]),
    states: v.$map.map(([k, x]) => [before.get(JSON.stringify(k)) === JSON.stringify(x) ? '' : 'active']),
  };
}

function dpPanel(name, v, prev) {
  return {
    kind: 'table',
    label: `${name} (table)`,
    rowLabels: v.map((_, r) => String(r)),
    colLabels: v[0].map((_, c) => String(c)),
    cells: v.map((row) => row.map((x) => (x === null || x === undefined ? '·' : x === Infinity ? '∞' : label(x)))),
    states: v.map((row, r) => row.map((x, c) => (Array.isArray(prev) && Array.isArray(prev[r]) && !same(x, prev[r][c]) ? 'active' : ''))),
  };
}

/** toolkit objects as a structure: MinHeap / PriorityQueue, Stack, Queue, Deque, UnionFind, Graph */
function unwrap(v) {
  const o = v.$obj;
  if (isRow(o.heap)) return ['heap', o.heap];
  if (isRow(o.items) && isInt(o.head)) return ['queue', o.items.slice(o.head)];
  if (isRow(o.items)) return ['stack', o.items];
  if (isRow(o.buf) && isInt(o.head) && isInt(o.count)) return ['queue', Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length])];
  if (isParentRow(o.parent)) return ['parent', o.parent];
  if (o.adj && asAdj(o.adj)) return ['adj', asAdj(o.adj)];
  return null;
}

/** `this.x` for every field of `this` (design classes), so each field gets its own panel */
function flatten(vars) {
  if (!isObj(vars.this, '$obj')) return vars;
  const out = {};
  for (const [k, v] of Object.entries(vars)) {
    if (k === 'this') for (const [f, x] of Object.entries(v.$obj)) out[`this.${f}`] = x;
    else out[k] = v;
  }
  return out;
}

/** [[index, value]…] of the non-zero cells of a long counting array (≥ 27 cells, numbers / booleans), else null */
function sparseOf(v) {
  if (isObj(v, '$array')) return v.$sparse || null;
  if (!isRow(v) || v.length < 27 || !v.every((x) => x === null || typeof x === 'number' || typeof x === 'boolean')) return null;
  const f = fillOf(v);
  const cells = v.map((x, i) => [i, x]).filter(([, x]) => !Object.is(x, f));
  return cells.length * 3 <= v.length ? cells : null; // mostly one value: the table is easier to read than the row
}
/** the value most cells of a long row hold (0, -1, null, Infinity…): the cells shown are the ones that differ */
function fillOf(v) {
  if (isObj(v, '$array')) return v.$fill ?? 0;
  const counts = new Map();
  for (const x of v) counts.set(x, (counts.get(x) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
}

const ROW = 13; // cells per line: a longer array wraps onto more lines so it stays readable on a phone

/** an array panel longer than ROW cells as several panels of ROW cells (real indexes kept via indexBase) */
const ROW_PX = 420; // and at most about this wide (long words: fewer cells per line; ~70 % zoom on a phone)
const cellPx = (v) => Math.max(44, String(v).length * 9.5 + 18) + 8; // measured in the browser at 390 px

function wrapRow(panel, per = ROW) {
  const n = panel.values.length;
  const starts = [0];
  for (let i = 1, w = cellPx(panel.values[0]); i < n; i++) {
    const c = cellPx(panel.values[i]);
    if (i - starts[starts.length - 1] >= per || w + c > ROW_PX) {
      starts.push(i);
      w = c;
    } else w += c;
  }
  if (starts.length === 1) return [panel];
  const out = [];
  for (const [k, from] of starts.entries()) {
    const to = (starts[k + 1] ?? n) - 1;
    const part = { ...panel, label: from === 0 ? panel.label : undefined, values: panel.values.slice(from, to + 1), indexBase: from, highlights: {} };
    for (const [i, st] of Object.entries(panel.highlights || {})) if (+i >= from && +i <= to) part.highlights[+i - from] = st;
    part.pointers = (panel.pointers || []).filter((x) => x.index >= from && x.index <= to).map((x) => ({ ...x, index: x.index - from }));
    if (panel.range) {
      const [a, b] = [Math.max(panel.range[0], from), Math.min(panel.range[1], to)];
      part.range = a <= b ? [a - from, b - from] : undefined;
    }
    out.push(part);
  }
  return out;
}

/**
 * the panels for one step; `prev` is the previous step's vars (for highlights)
 * @param opts.pointers names drawn as pointers on the main array (default: index-like names)
 * @param opts.range [loName, hiName], or a list of such pairs (the first pair present is used): a bracket over the main array
 * @param opts.labels { name: shown label }
 */
export function panelsFor(rawVars, rawPrev = {}, opts = {}) {
  const vars = flatten(rawVars);
  const prev = flatten(rawPrev);
  const labels = opts.labels || {};
  const nameOf = (n) => labels[n] || n;
  const panels = [];
  const scalars = {};
  const names = Object.keys(vars);
  const main = names.find((n) => isRow(vars[n]) && vars[n].length && !STACK_NAME.test(n) && !QUEUE_NAME.test(n) && !HEAP_NAME.test(n));

  // node structures: the biggest tree / list is drawn; other variables pointing into it become tags on its nodes
  const trees = names.filter((n) => isObj(vars[n], '$tree') && vars[n].$tree.length).sort((a, b) => vars[b].$tree.length - vars[a].$tree.length);
  const lists = names.filter((n) => isObj(vars[n], '$list') && vars[n].$list.values.length).sort((a, b) => vars[b].$list.values.length - vars[a].$list.values.length);
  const drawn = new Map(); // drawn structure name → Map(node id → [pointer names])
  const pointerOf = new Set();
  const place = (group, idsOf) => {
    for (const n of group) {
      const head = idsOf(vars[n])[0];
      const host = head != null && [...drawn.keys()].find((d) => group.includes(d) && idsOf(vars[d]).includes(head));
      if (host) {
        const tags = drawn.get(host);
        tags.set(head, [...(tags.get(head) || []), n]);
        pointerOf.add(n);
      } else drawn.set(n, new Map());
    }
  };
  const tries = names.filter((n) => isObj(vars[n], '$trie')).sort((a, b) => vars[b].$trie.nodes.length - vars[a].$trie.nodes.length);
  place(trees, (v) => v.$ids || []);
  place(tries, (v) => v.$trie.nodes.map((x) => x.id));
  const graphs = names.filter((n) => isObj(vars[n], '$graph')).sort((a, b) => vars[b].$graph.nodes.length - vars[a].$graph.nodes.length);
  place(graphs, (v) => v.$graph.nodes.map((x) => x.id));
  place(lists, (v) => v.$list.ids || []);

  for (const name of names) {
    if (pointerOf.has(name)) continue;
    const v = vars[name];
    const p = prev[name];
    const shown = nameOf(name);
    const obj = isObj(v, '$obj') ? unwrap(v) : null;
    const kind = obj?.[0];
    const val = obj ? obj[1] : v;
    const pv = obj && isObj(p, '$obj') ? unwrap(p)?.[1] : p;
    const forest = (kind === 'parent' || (!kind && PARENT_NAME.test(name))) && isParentRow(val) ? forestPanel(shown, val) : null;
    if ((kind === 'heap' || (!kind && HEAP_NAME.test(name))) && isRow(val) && val.length <= 31) panels.push(heapPanel(shown, val, pv));
    else if ((kind === 'adj' || (!kind && ADJ_NAME.test(name))) && asAdj(val)) panels.push(graphPanel(shown, asAdj(val), vars));
    else if (forest) panels.push(...forest);
    else if (kind === 'stack' || kind === 'queue') panels.push({ kind, label: shown, values: val.map((x) => (x === undefined ? '·' : x)) });
    else if (Array.isArray(v) && v.length && v.length <= 16 && v.every((x) => isObj(x, '$tree') || isObj(x, '$list'))) {
      // a queue / stack of tree or list nodes (BFS over a tree): each node shown by its value
      const k = STACK_NAME.test(name) ? 'stack' : QUEUE_NAME.test(name) ? 'queue' : 'array';
      const values = v.map((x) => label(x.$tree ? x.$tree[0] : x.$list.values[0]));
      panels.push(k === 'array' ? { kind: k, label: `${shown} (nodes)`, values, highlights: {} } : { kind: k, label: `${shown} (nodes)`, values });
    }
    else if (sparseOf(v) && sparseOf(v).length <= 12) {
      // a long, mostly empty counting array: only its non-zero cells, as index → value
      const cells = sparseOf(v);
      const before = new Map(sparseOf(p) || []);
      panels.push({ kind: 'table', label: `${shown} (cells other than ${label(fillOf(v))}, of ${v.$length ?? v.length})`, rowLabels: cells.map(([i]) => String(i)), colLabels: ['value'], cells: cells.map(([, x]) => [label(x)]), states: cells.map(([i, x]) => [before.get(i) === x ? '' : 'active']) });
    }
    else if (isRow(v)) {
      const k = STACK_NAME.test(name) ? 'stack' : QUEUE_NAME.test(name) ? 'queue' : 'array';
      const panel = { kind: k, label: shown, values: v.map((x) => (x === undefined ? '·' : x === Infinity ? '∞' : x)) };
      if (k === 'array') {
        panel.highlights = changedCells(v, p);
        if (name === main) {
          const ptr = opts.pointers ? (n) => opts.pointers.includes(n) : (n) => INDEX_NAME.test(n);
          panel.pointers = names
            .filter((n) => ptr(n) && isInt(vars[n]) && vars[n] >= 0 && vars[n] < v.length)
            .slice(0, 3)
            .map((n, c) => ({ label: nameOf(n), index: vars[n], color: 'abc'[c] }));
          const pairs = Array.isArray(opts.range?.[0]) ? opts.range : opts.range ? [opts.range] : [];
          const [lo, hi] = (pairs.find(([a, b]) => isInt(vars[a]) && isInt(vars[b])) || []).map((n) => vars[n]);
          if (isInt(lo) && isInt(hi) && lo <= hi && lo < v.length && hi >= 0) panel.range = [Math.max(0, lo), Math.min(v.length - 1, hi)];
        }
      }
      panels.push(...(k === 'array' ? wrapRow(panel) : [panel]));
    } else if (isGrid(v, 16) && DP_NAME.test(name) && v.every((r) => r.length === v[0].length && r.every((x) => typeof x !== 'string'))) panels.push(dpPanel(shown, v, p));
    else if (isGrid(v)) {
      const states = v.map((row, r) => row.map((x, c) => (Array.isArray(p) && Array.isArray(p[r]) && !same(x, p[r][c]) ? 'active' : '')));
      panels.push({ kind: 'grid', label: shown, cells: v.map((row) => row.map((x) => (x === null || x === undefined ? '·' : x))), states });
    } else if (isObj(v, '$array') && v.$array.every(isPrim)) {
      panels.push(...wrapRow({ kind: 'array', label: `${shown} (first ${v.$array.length} of ${v.$length})`, values: v.$array.map((x) => (x === Infinity ? '∞' : x === undefined ? '·' : x)), highlights: {} }));
    } else if (isObj(v, '$trie') && drawn.has(name)) {
      panels.push(triePanel(shown, v, drawn.get(name)));
    } else if (isObj(v, '$graph') && drawn.has(name)) {
      panels.push(nodeGraphPanel(shown, v, drawn.get(name)));
    } else if (isObj(v, '$tree') && drawn.has(name)) {
      panels.push(treePanel(shown, v, drawn.get(name)));
    } else if (isObj(v, '$list') && drawn.has(name)) {
      const { values, ids = [], cycleTo } = v.$list;
      const next = values.map((_, i) => (i + 1 < values.length ? i + 1 : cycleTo ?? null));
      const pointers = [...drawn.get(name)].flatMap(([id, ns]) => ns.map((n) => ({ label: nameOf(n), index: ids.indexOf(id) })));
      panels.push({ kind: 'list', label: shown, values: values.map(label), next, pointers: pointers.map((x, c) => ({ ...x, color: 'abc'[c % 3] })) });
    } else if (isObj(v, '$map') && v.$map.length && v.$map.length <= 12) panels.push(mapPanel(shown, v, p));
    else if (!obj && isObj(v, '$obj') && Object.keys(v.$obj).length && Object.keys(v.$obj).length <= 12 && Object.values(v.$obj).every(isPrim)) {
      // a plain object used as a counter / lookup ({ a: 2, b: 1 }): drawn like a Map
      const asMap = (o) => (isObj(o, '$obj') ? { $map: Object.entries(o.$obj), $size: Object.keys(o.$obj).length } : undefined);
      panels.push({ ...mapPanel(shown, asMap(v), asMap(p)), label: `${shown} (object)` });
    }
    else if (isObj(v, '$set') && v.$set.length && v.$set.length <= 16 && v.$set.every(isPrim)) {
      panels.push(...wrapRow({ kind: 'array', label: `${shown} (set)`, values: v.$set.map(label), highlights: {}, showIndices: false }));
    } else scalars[shown] = clip(text(v), 40);
  }
  if (Object.keys(scalars).length) panels.push({ kind: 'vars', vars: scalars });
  return panels;
}

/** what changed since the previous step, for the note: "nums[1] = 5, i = 2" (at most 4 items) */
export function changes(vars, prev) {
  const out = [];
  for (const [name, v] of Object.entries(vars)) {
    const p = prev[name];
    if (same(v, p)) continue;
    if (!(name in prev)) out.push(`${name} = ${clip(text(v), 30)}`); // first seen: show its value
    else if (isRow(v) && isRow(p) && v.length === p.length) v.forEach((x, i) => !same(x, p[i]) && out.push(`${name}[${i}] = ${text(x)}`));
    else if (isPrim(v)) out.push(`${name} = ${text(v)}`);
    else out.push(`${name} changed`);
  }
  return out.length > 4 ? [...out.slice(0, 4), '…'] : out;
}

const opText = (o, n = 22) => clip(`${o.name}(${(Array.isArray(o.args) ? o.args : []).map(text).join(', ')})`, n);

/** design classes: a window of the operation list around the current one */
function opsPanel(ops, cur) {
  const from = Math.max(0, Math.min(cur - 1, ops.length - 3)); // previous, now, next: readable at phone width
  const shown = ops.slice(from, from + 3);
  const highlights = {};
  shown.forEach((_, k) => (highlights[k] = from + k < cur ? 'done' : from + k === cur ? 'active' : ''));
  return { kind: 'array', label: `operations (${cur + 1} of ${ops.length})`, values: shown.map((o) => opText(o, 14)), highlights, indexBase: from, pointers: [{ label: 'now', index: cur - from, color: 'a' }] };
}

/**
 * "Predict next step" for runs without a scene: up to `max` steps, spread over the run, where exactly one cell of
 * an array is written. The question is asked before that step is shown: which index changes?
 * @returns Map(frame index → predict)
 */
export function autoPredicts(steps, code, max = 3) {
  const lines = code.split('\n');
  const cands = [];
  for (let i = 1; i < steps.length; i++) {
    const cur = steps[i].vars;
    const prev = steps[i - 1].vars;
    const main = Object.keys(cur).find((n) => isRow(cur[n]) && cur[n].length >= 3 && isRow(prev[n]) && prev[n].length === cur[n].length && !STACK_NAME.test(n) && !QUEUE_NAME.test(n));
    if (!main) continue;
    const diff = cur[main].map((x, k) => (same(x, prev[main][k]) ? -1 : k)).filter((k) => k >= 0);
    if (diff.length === 1) cands.push({ i, main, at: diff[0], len: cur[main].length, line: steps[i].line });
  }
  const out = new Map();
  const gap = Math.max(1, Math.floor(cands.length / max));
  for (let c = 0; c < cands.length && out.size < max; c += gap) {
    const { i, main, at, len, line } = cands[c];
    const options = [...[at - 1, at + 1, at + 2, at - 2].filter((k) => k >= 0 && k < len).slice(0, 3), at].sort((a, b) => a - b);
    out.set(i, {
      question: `Line ${line} runs next: \`${clip((lines[line - 1] || '').trim(), 40)}\`. Which cell of ${main} does it change?`,
      options: options.map((k) => `${main}[${k}]`),
      answer: options.indexOf(at),
      explain: `It writes ${main}[${at}] = ${text(steps[i].vars[main][at])}.`,
    });
  }
  return out;
}

/** interaction kit "inspect": the values `name` took, in order (repeats in a row collapsed); step = frame number */
export function historyOf(steps, name) {
  const out = [];
  steps.forEach((s, i) => {
    const vars = flatten(s.vars);
    if (!(name in vars)) return;
    const t = clip(text(vars[name]), 40);
    if (out[out.length - 1]?.value !== t) out.push({ step: i + 1, line: s.line, value: t });
  });
  return out;
}

/** interaction kit "complexity meter": the input size n of a test (longest array / string / grid, else the largest number) */
export function inputSize(args) {
  let n = 0;
  let num = 0;
  const walk = (v, depth) => {
    if (typeof v === 'string') n = Math.max(n, v.length);
    else if (typeof v === 'number') num = Math.max(num, Math.abs(v));
    else if (Array.isArray(v)) {
      n = Math.max(n, v.length);
      if (v.length && v.every(Array.isArray)) n = Math.max(n, v.reduce((s, r) => s + r.length, 0)); // grid / edge list
      if (depth < 1) v.forEach((x) => walk(x, depth + 1));
    }
  };
  (Array.isArray(args) ? args : [args]).forEach((a) => walk(a, 0));
  return n || num || 1;
}

/** "O(n log n)" → n => n·log2(n). Every variable (m, k, V, E…) is taken as n, so this is a rough curve only. */
export function bigO(time) {
  const m = /O\((.*)\)/.exec(time || '');
  if (!m) return null;
  const expr = m[1]
    .replace(/[·×]/g, '*')
    .replace(/√\s*([a-z])/gi, '($1**0.5)')
    .replace(/\blog\s*\(?\s*([a-z])\s*\)?/gi, 'L($1)')
    .replace(/\b[a-zA-Z]\b(?!\()/g, 'n')
    .replace(/\^/g, '**')
    .replace(/(\d|\)|n)\s*(?=[nL(])/g, '$1*');
  if (!/^[\dnL()+\-*/. ]*$/.test(expr)) return null;
  try {
    // only digits, n, L, brackets and operators can reach here (checked just above)
    const f = new Function('n', 'L', `return ${expr || '1'};`);
    const L = (x) => Math.max(1, Math.log2(Math.max(2, x)));
    return Number.isFinite(f(16, L)) ? (n) => Math.max(1, f(n, L)) : null;
  } catch {
    return null;
  }
}

/**
 * @param run the recorder's result ({ steps, ops, passed, outputText, error, compileError, truncated, stride })
 * @param code the source that was run (the note quotes the line)
 * @param scene optional scene file (src/visualizations/scenes/): { watch, labels, pointers, range, narrate, predict }
 * @param questionParams the question's parameter names, or [] for a harness question (scenes find "the array" and
 *   "the target" by position)
 * @returns Visualizer frames; the last one states the verdict
 */
export function buildRunFrames(run, code, scene = {}, questionParams = []) {
  const lines = code.split('\n');
  // a learner may rename a parameter (grid for matrix): the recorder read their own names off the function
  const own = run.params || [];
  // no question names (a harness question: its paramNames describe the test data, not the function): theirs
  const params = own.length === questionParams.length || !questionParams.length ? own : questionParams;
  const ops = run.ops || [];
  const watch = scene.watch && new Set(scene.watch);
  const keep = (vars) => (watch ? Object.fromEntries(Object.entries(vars).filter(([k]) => watch.has(k))) : vars);
  const opts = { labels: scene.labels, pointers: scene.pointers, range: scene.range };
  const steps = run.steps.map((s) => ({ ...s, vars: keep(s.vars) }));
  // a sampled run (stride > 1) keeps every stride-th step: the next step shown is not the next one run, so no predictions
  const isSampled = (run.stride || 1) > 1;
  const predicts = scene.predict || isSampled ? new Map() : autoPredicts(steps, code);
  const frames = [];
  let prev = {};
  steps.forEach((s, i) => {
    const src = (lines[s.line - 1] || '').trim();
    const what = changes(flatten(s.vars), flatten(prev));
    const ctx = { vars: s.vars, prev, line: s.line, src, lines, changes: what, index: i, next: steps[i + 1], params, op: s.op, ops, result: run.output, ret: !!s.ret, value: s.value, input: run.input, stride: run.stride || 1 };
    const told = scene.narrate?.(ctx);
    const at = s.op !== undefined && ops[s.op] ? `op ${s.op + 1} · ${opText(ops[s.op])} · ` : '';
    const panels = panelsFor(s.vars, prev, opts);
    if (ops.length && s.op !== undefined) panels.unshift(opsPanel(ops, s.op));
    const frame = { line: s.line, note: `${at}Line ${s.line}: ${told || `\`${clip(src, 48)}\`${what.length ? ` → ${what.join(', ')}` : ''}`}`, panels };
    if (predicts.has(i)) frame.predict = predicts.get(i);
    if (scene.predict && !isSampled && ctx.next && predicts.size < (scene.maxPredicts ?? 3)) {
      const asked = scene.predict(ctx);
      if (asked) predicts.set(i + 1, asked);
    }
    frames.push(frame);
    prev = s.vars;
  });
  const last = steps.length ? panelsFor(prev, prev, opts) : [];
  if (ops.length && Array.isArray(run.output)) last.unshift(...wrapRow({ kind: 'array', label: 'returned by each operation', values: run.output.slice(0, 26).map(label), highlights: {} }, 6));
  const sampled = run.truncated ? ` (a long run: every ${run.stride}th step is shown)` : '';
  if (run.compileError) frames.push({ note: `Could not run: ${run.compileError}`, panels: last });
  else if (run.error) frames.push({ note: `Stopped with an error: ${run.error}${sampled}`, panels: last });
  else frames.push({ note: `Returned ${clip(run.outputText || '', 80)}: ${run.passed ? 'correct ✓' : 'not the expected answer ✗'}${sampled}`, panels: last });
  return frames;
}

/**
 * For questions that ask for a specific algorithm: the first step where `name` takes a value the reference run
 * did not have at that point. Compares the sequences of distinct values (repeats in a row collapsed).
 * @returns index into userSteps of the first wrong step, or -1 when the user's run follows the reference
 */
export function firstDivergence(userSteps, refSteps, name) {
  const key = (s) => JSON.stringify(s.vars[name]);
  const ref = [];
  for (const s of refSteps) if (name in s.vars && key(s) !== ref[ref.length - 1]) ref.push(key(s));
  let at = -1;
  let last;
  for (let i = 0; i < userSteps.length; i++) {
    const s = userSteps[i];
    if (!(name in s.vars) || key(s) === last) continue;
    last = key(s);
    at++;
    if (ref[at] !== last) return i;
  }
  return at + 1 < ref.length ? userSteps.length - 1 : -1; // stopped early: the last step is where it went wrong
}

/** every variable name in a run (fields of `this` as this.x), for the inspect picker */
export function varNames(steps) {
  const names = new Set();
  for (const s of steps) for (const k of Object.keys(flatten(s.vars))) names.add(k);
  return [...names];
}
