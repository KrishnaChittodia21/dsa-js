// Step lessons for Advanced Graphs, part 2 (M2): SCCs (Kosaraju), Euler paths (Hierholzer), functional graphs,
// BFS over routes. Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every finish order, component id, stack, route, peel order and BFS level below comes from running the lesson's
// own code (iterative Kosaraju, minStarts, eulerPathFromPairs, findItinerary, functionalShape, minGroups) in JS;
// check() throws if a run drifts.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const que = (values, label = 'queue') => ({ kind: 'queue', values, label });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const states = (ids, s) => Object.fromEntries(ids.map((id) => [id, s]));
const seq = (xs) => xs.join(', ');
const list = (xs) => `[${xs.join(', ')}]`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`advanced-graphs/steps-2.js: ${msg}`);
};

// pos: [x, y] per vertex index. o.st: index → state, o.es: 'u-v' → edge state, o.lab: index → label,
// o.undirected, o.label, o.el: 'u-v' → edge label. Edges use vertex indexes.
const gp = (n, edges, pos, o = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  ...(o.undirected ? {} : { directed: true }),
  ...(o.label ? { label: o.label } : {}),
  nodes: Array.from({ length: n }, (_, i) => ({ id: i, label: String(o.lab?.[i] ?? i), x: pos[i][0], y: pos[i][1], ...(o.st?.[i] ? { state: o.st[i] } : {}) })),
  edges: edges.map(([u, v], k) => {
    const s = o.es?.[`${u}-${v}`] ?? o.ek?.[k];
    const l = o.el?.[`${u}-${v}`] ?? o.lk?.[k];
    return { from: u, to: v, ...(s ? { state: s } : {}), ...(l ? { label: l } : {}) };
  }),
});
const ek = (pairs, s) => Object.fromEntries(pairs.map(([u, v]) => [`${u}-${v}`, s]));
const COMP_ST = ['done', 'visited', 'active']; // one colour per SCC in result pictures
const compSt = (comp) => Object.fromEntries(comp.map((c, i) => [i, c === -1 ? '' : COMP_ST[c % 3]]));

// ---------- the lesson's iterative Kosaraju (template-scc), one event per loop turn ----------
function kosaraju(n, edges) {
  const g = Array.from({ length: n }, () => []);
  const rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    g[u].push(v);
    rg[v].push(u);
  }
  const seen = new Array(n).fill(false);
  const order = [];
  const p1 = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    seen[s] = true;
    const stack = [[s, 0]];
    p1.push({ kind: 'start', u: s, stack: stack.map((f) => f.slice()), order: order.slice() });
    while (stack.length) {
      const top = stack[stack.length - 1];
      const u = top[0];
      if (top[1] < g[u].length) {
        const v = g[u][top[1]++];
        if (!seen[v]) {
          seen[v] = true;
          stack.push([v, 0]);
          p1.push({ kind: 'push', u, v, stack: stack.map((f) => f.slice()), order: order.slice() });
        } else p1.push({ kind: 'seen', u, v, stack: stack.map((f) => f.slice()), order: order.slice() });
      } else {
        order.push(u);
        stack.pop();
        p1.push({ kind: 'finish', u, stack: stack.map((f) => f.slice()), order: order.slice() });
      }
    }
  }
  const comp = new Array(n).fill(-1);
  let count = 0;
  const p2 = [];
  for (let i = n - 1; i >= 0; i--) {
    const s = order[i];
    if (comp[s] !== -1) {
      p2.push({ kind: 'skip', i, s, comp: comp.slice(), count });
      continue;
    }
    comp[s] = count;
    const stack = [s];
    const reached = [s];
    while (stack.length) {
      const u = stack.pop();
      for (const v of rg[u])
        if (comp[v] === -1) {
          comp[v] = count;
          stack.push(v);
          reached.push(v);
        }
    }
    p2.push({ kind: 'start', i, s, reached, comp: comp.slice(), count });
    count++;
  }
  return { g, rg, order, p1, p2, comp, count };
}
// the lesson's minStarts on top of it
function minStarts(n, edges) {
  const { count, comp } = kosaraju(n, edges);
  const hasIncoming = new Array(count).fill(false);
  const ev = [];
  for (const [u, v] of edges) {
    const cross = comp[u] !== comp[v];
    if (cross) hasIncoming[comp[v]] = true;
    ev.push({ u, v, cross, has: hasIncoming.slice() });
  }
  return { comp, count, ev, hasIncoming, result: hasIncoming.filter((x) => !x).length };
}
const sccsOf = (K) => Array.from({ length: K.count }, (_, c) => K.comp.map((x, i) => (x === c ? i : -1)).filter((i) => i >= 0));
const setText = (xs) => `{${xs.join(', ')}}`;
const transpose = (edges) => edges.map(([u, v]) => [v, u]);

// ---------- Hierholzer: the lesson's stack loop, one snapshot per loop turn ----------
// adj: Map label → array (consumed with pop()). Returns path (reversed) and every step.
function hierholzer(adj, start) {
  const stack = [start];
  const path = [];
  const ev = [];
  while (stack.length) {
    const u = stack[stack.length - 1];
    const out = adj.get(u);
    if (out && out.length) {
      const v = out.pop();
      stack.push(v);
      ev.push({ kind: 'push', u, v, stack: stack.slice(), path: path.slice() });
    } else {
      path.push(stack.pop());
      ev.push({ kind: 'pop', u, stack: stack.slice(), path: path.slice() });
    }
  }
  return { ev, collected: path.slice(), path: path.reverse() };
}
const edgesOfWalk = (ev) => ev.filter((e) => e.kind === 'push').map((e) => [e.u, e.v]);

// the lesson's eulerPathFromPairs, with its balance map and chosen start
function eulerPathFromPairs(pairs) {
  const adj = new Map();
  const balance = new Map();
  for (const [u, v] of pairs) {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u).push(v);
    balance.set(u, (balance.get(u) ?? 0) + 1);
    balance.set(v, (balance.get(v) ?? 0) - 1);
  }
  let start = pairs[0][0];
  for (const [node, b] of balance) if (b === 1) {
    start = node;
    break;
  }
  return { balance: [...balance], start, ...hierholzer(adj, start) };
}
// the lesson's findItinerary
function findItinerary(tickets) {
  const adj = new Map();
  for (const [from, to] of tickets) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  }
  for (const l of adj.values()) l.sort().reverse();
  const lists = new Map([...adj].map(([k, l]) => [k, l.slice()]));
  return { lists, ...hierholzer(adj, 'JFK') };
}

// ---------- the lesson's functionalShape (Kahn peel), one snapshot per pop ----------
function functionalShape(f) {
  const n = f.length;
  const indeg = new Array(n).fill(0);
  const depth = new Array(n).fill(0);
  for (const v of f) indeg[v]++;
  const indeg0 = indeg.slice();
  const queue = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
  const seeds = queue.slice();
  const pops = [];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    const v = f[u];
    depth[v] = Math.max(depth[v], depth[u] + 1);
    const pushed = --indeg[v] === 0;
    if (pushed) queue.push(v);
    pops.push({ h, u, v, pushed, indeg: indeg.slice(), depth: depth.slice(), queue: queue.slice() });
  }
  return { indeg0, seeds, pops, onCycle: indeg.map((d) => d > 0), depth, queue };
}
// "Maximum Employees": max(longest cycle, sum over 2-cycles of 2 + depth[a] + depth[b]), as the lesson states
function maxInvites(f) {
  const { onCycle, depth } = functionalShape(f);
  const seen = new Array(f.length).fill(false);
  let longest = 0;
  let pairs = 0;
  for (let i = 0; i < f.length; i++) {
    if (!onCycle[i] || seen[i]) continue;
    let len = 0;
    for (let x = i; !seen[x]; x = f[x]) {
      seen[x] = true;
      len++;
    }
    if (len === 2) pairs += 2 + depth[i] + depth[f[i]];
    else longest = Math.max(longest, len);
  }
  return { longest, pairs, answer: Math.max(longest, pairs), depth };
}

// ---------- the lesson's minGroups (BFS over routes), one snapshot per level ----------
function minGroups(groups, source, target) {
  if (source === target) return { result: 0, levels: [] };
  const byItem = new Map();
  groups.forEach((g, id) =>
    g.forEach((x) => {
      if (!byItem.has(x)) byItem.set(x, []);
      byItem.get(x).push(id);
    }),
  );
  const usedGroup = new Array(groups.length).fill(false);
  const seenItem = new Set([source]);
  let frontier = [source];
  let steps = 0;
  const levels = [];
  while (frontier.length) {
    steps++;
    const next = [];
    const boarded = [];
    for (const item of frontier)
      for (const gid of byItem.get(item) ?? []) {
        if (usedGroup[gid]) continue;
        usedGroup[gid] = true;
        boarded.push(gid);
        for (const x of groups[gid]) {
          if (x === target) {
            levels.push({ steps, frontier, boarded, next, used: usedGroup.slice(), hit: true });
            return { result: steps, levels };
          }
          if (!seenItem.has(x)) {
            seenItem.add(x);
            next.push(x);
          }
        }
      }
    levels.push({ steps, frontier, boarded, next, used: usedGroup.slice(), hit: false });
    frontier = next;
  }
  return { result: -1, levels };
}

// ====================== intuition-scc ======================
const DR_E = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3]]; // the lesson's graph (intuition + dry run)
const DR_P = [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1]];
const DR = kosaraju(5, DR_E);
check(DR.count === 2 && setText(sccsOf(DR)[0]) === '{0, 1, 2}' && setText(sccsOf(DR)[1]) === '{3, 4}', 'lesson SCCs');
const CONDENSE_P = [[0, 0], [2, 0]];
const condensed = (st, label = 'condensation') => gp(2, [[0, 1]], CONDENSE_P, { lab: ['A', 'B'], st, label });

const IT_E = [[0, 1], [1, 0], [1, 2], [2, 3], [3, 4], [4, 2], [4, 5]];
const IT_P = [[0, 0], [1, 0], [2, 0], [3, 0], [2.5, 1], [3.5, 1.6]];
const IT = kosaraju(6, IT_E);
check(IT.count === 3, 'intuition turn: 3 SCCs');
const IT_SCC = sccsOf(IT);
const IT_CROSS = IT_E.filter(([u, v]) => IT.comp[u] !== IT.comp[v]);
check(IT_CROSS.length === 2 && new Set(IT_CROSS.map(([u, v]) => `${IT.comp[u]}-${IT.comp[v]}`)).size === 2, 'two condensation edges');
const IT_CP = [[0, 0], [1.6, 0], [3.2, 0]];
const IT_CI = IT_SCC.map((c) => c[0]); // condensation node k = SCC containing IT_CI[k]
const itC = (x) => IT_SCC.findIndex((c) => c.includes(x));
const IT_CE = IT_CROSS.map(([u, v]) => [itC(u), itC(v)]);
const IT_MERGE_E = [...IT_E, [5, 0]];
const ITM = kosaraju(6, IT_MERGE_E);
check(ITM.count === 1, 'adding 5 → 0 merges everything');

// ====================== optimized-scc ======================
const OP_E = [[0, 1], [1, 0], [1, 2], [2, 3], [3, 2], [4, 2], [4, 5], [5, 4]];
const OP_P = [[0, 0], [1, 0], [2, 1], [3, 1], [1, 2], [0, 2]];
const OP = kosaraju(6, OP_E);
check(seq(OP.order) === '3, 2, 1, 0, 5, 4', 'optimized pass 1 order');
const OP_STARTS = OP.p2.filter((e) => e.kind === 'start').map((e) => e.s);
check(seq(OP_STARTS) === '4, 0, 2' && OP.count === 3, 'optimized pass 2 starts');
const OP_SCC = sccsOf(OP);
const nodeStack = (e) => e.stack.map((f) => f[0]);
const p1Note = (e) =>
  e.kind === 'start'
    ? `Start a DFS at ${e.u}.`
    : e.kind === 'push'
      ? `${e.u} → ${e.v}: new, go deeper.`
      : e.kind === 'seen'
        ? `${e.u} → ${e.v}: already seen, skip.`
        : `${e.u} has no unvisited neighbour left: it **finishes**. Push it onto \`order\`.`;
const p1Graph = (n, edges, pos, e) => {
  const open = nodeStack(e);
  const done = e.order;
  return gp(n, edges, pos, { st: { ...states(done, 'done'), ...states(open, 'visited'), ...(e.kind === 'finish' ? { [e.u]: 'done' } : { [open[open.length - 1]]: 'active' }) }, es: e.v !== undefined ? { [`${e.u}-${e.v}`]: 'active' } : {} });
};
const orderArr = (order, n, hi) => arr(order, { label: 'order (finish)', highlights: hi !== undefined ? { [hi]: 'active' } : {} });
const opPass1 = OP.p1.map((e) => ({
  say: 0,
  note: p1Note(e),
  panels: [p1Graph(6, OP_E, OP_P, e), stk(nodeStack(e), 'DFS path'), orderArr(e.order, 6, e.kind === 'finish' ? e.order.length - 1 : undefined)],
}));
const OP_RE = transpose(OP_E);
const p2Graph = (n, redges, pos, comp, cur) => gp(n, redges, pos, { st: { ...compSt(comp), ...(cur !== undefined ? { [cur]: 'active' } : {}) }, label: 'transpose' });

// ====================== template-scc ======================
const TS_E = [[0, 1], [0, 2], [1, 0], [2, 3], [3, 2]];
const TS_P = [[0, 0], [0, 1.3], [1.4, 0], [1.4, 1.3]];
const TS = kosaraju(4, TS_E);
check(seq(TS.order) === '1, 3, 2, 0' && TS.count === 2, 'template pass 1');
const frameText = (f) => `[${f[0]}, ${f[1]}]`;
const tsP1 = TS.p1.map((e) => ({
  say: e.kind === 'finish' ? 2 : 1,
  note:
    e.kind === 'start'
      ? `s = ${e.u}: mark seen, push frame [${e.u}, 0].`
      : e.kind === 'push'
        ? `Top frame of ${e.u}: neighbour ${e.v} is new. Bump the index, push [${e.v}, 0].`
        : e.kind === 'seen'
          ? `Top frame of ${e.u}: neighbour ${e.v} is seen. Just bump the index.`
          : `Index of ${e.u} ran past its list: ${e.u} finished. \`order.push(${e.u})\`, pop the frame.`,
  panels: [p1Graph(4, TS_E, TS_P, e), stk(e.stack.map(frameText), '[node, next]'), orderArr(e.order, 4, e.kind === 'finish' ? e.order.length - 1 : undefined)],
}));
const TS_RE = transpose(TS_E);

// ====================== implementation-scc ======================
const IM_E = [[0, 1], [1, 0], [1, 2], [3, 2], [2, 4], [4, 2]];
const IM_P = [[0, 0], [0, 1.3], [1.4, 0.65], [1.4, 2], [2.8, 0.65]];
const IM = minStarts(5, IM_E);
check(IM.result === 2 && IM.count === 3, 'minStarts = 2');
const IM_IN0 = [0, 1, 2, 3, 4].filter((x) => !IM_E.some(([, v]) => v === x));
check(seq(IM_IN0) === '3', 'only node 3 has in-degree 0');
const compArr = (comp, hi) => arr(comp, { label: 'comp', highlights: hi || {} });
const hasArr = (has, hi) => arr(has.map((x) => (x ? 'T' : 'F')), { label: 'hasIncoming', highlights: hi || {} });

// ====================== dry-run-scc ======================
check(seq(DR.order) === '4, 3, 2, 1, 0', 'lesson dry run: order = [4, 3, 2, 1, 0]');
check(seq(DR.rg.map((l) => list(l))) === '[2], [0], [1], [2, 4], [3]', 'lesson dry run: transpose');
const DR_STARTS = DR.p2.filter((e) => e.kind === 'start');
check(DR_STARTS.length === 2 && seq(DR_STARTS[0].reached) === '0, 2, 1' && seq(DR_STARTS[1].reached) === '3, 4', 'lesson dry run: pass 2');
check(minStarts(5, DR_E).result === 1, 'lesson dry run: minStarts = 1');
const DR_RE = transpose(DR_E);
const drPass1 = DR.p1.map((e) => ({
  say: 0,
  note: p1Note(e),
  panels: [p1Graph(5, DR_E, DR_P, e), stk(nodeStack(e), 'DFS path'), orderArr(e.order, 5, e.kind === 'finish' ? e.order.length - 1 : undefined)],
}));
const DR_SKIP_I = DR.p2.find((e) => e.kind === 'start' && e.s === 3).i;

// ====================== intuition-euler ======================
const IE_E = [[0, 1], [1, 2], [2, 0], [0, 3]];
const IE_P = [[0, 1], [1, 0], [2, 1], [0, 2.2]];
const degTable = (n, edges, hi) => {
  const out = new Array(n).fill(0);
  const inn = new Array(n).fill(0);
  for (const [u, v] of edges) {
    out[u]++;
    inn[v]++;
  }
  return {
    out,
    inn,
    panel: table(
      Array.from({ length: n }, (_, i) => String(i)),
      ['out', 'in', 'out−in'],
      out.map((o, i) => [o, inn[i], o - inn[i]]),
      out.map((o, i) => (hi?.[i] ? ['', '', hi[i]] : ['', '', ''])),
      'degrees',
    ),
  };
};
const IE_D = degTable(4, IE_E);
check(seq(IE_D.out.map((o, i) => o - IE_D.inn[i])) === '1, 0, 0, -1', 'intuition-euler balances');
const IE_ADJ = new Map([[0, []], [1, []], [2, []], [3, []]]);
for (const [u, v] of IE_E) IE_ADJ.get(u).push(v);
const IE = hierholzer(IE_ADJ, 0);
check(seq(IE.path) === '0, 1, 2, 0, 3' && IE.ev[0].v === 3, 'intuition-euler: stuck at 3 first, then the detour');
const walkGraph = (n, edges, pos, e, o = {}) => {
  const used = edgesOfWalk(IE.ev.slice(0, IE.ev.indexOf(e) + 1));
  const top = e.stack[e.stack.length - 1];
  return gp(n, edges, pos, {
    ...o,
    es: { ...ek(used, 'done'), ...(e.kind === 'push' ? { [`${e.u}-${e.v}`]: 'active' } : {}) },
    st: { ...states(e.path, 'done'), ...(top !== undefined ? { [top]: 'active' } : {}) },
  });
};
const UE_E = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]];
const UE_P = [[0, 0], [1.4, 0], [1.4, 1.4], [0, 1.4]];
const UE_DEG = [0, 1, 2, 3].map((x) => UE_E.filter((e) => e.includes(x)).length);
check(seq(UE_DEG) === '3, 2, 3, 2', 'undirected degrees');

// ====================== optimized-euler ======================
// de Bruijn n = 2, k = 2 (the lesson's example): nodes "0", "1"; edge s → (s + d).slice(1) for d in 0..k-1
function deBruijn(n, k) {
  const nodes = [];
  const build = (s) => (s.length === n - 1 ? nodes.push(s) : [...Array(k).keys()].forEach((d) => build(s + d)));
  build('');
  const adj = new Map(nodes.map((s) => [s, [...Array(k).keys()].map((d) => (s + d).slice(1)).sort().reverse()]));
  const H = hierholzer(adj, nodes[0]);
  const str = H.path[0] + H.path.slice(1).map((s) => s.slice(-1)).join('');
  return { nodes, H, str };
}
const DB2 = deBruijn(2, 2);
check(seq(DB2.H.path) === '0, 0, 1, 1, 0' && DB2.str === '00110', 'de Bruijn n=2: lesson circuit and "00110"');
const DB3 = deBruijn(3, 2);
check(DB3.str.length === 2 ** 3 + 3 - 1 && ['000', '001', '010', '011', '100', '101', '110', '111'].every((c) => DB3.str.includes(c)), 'de Bruijn n=3: length 10, all codes');
const DB_IDX = { 0: 0, 1: 1 };
const DB_E = [[0, 0], [0, 1], [1, 0], [1, 1]];
const DB_LAB = { '0-0': '00', '0-1': '01', '1-0': '10', '1-1': '11' };
const dbGraph = (used, cur, top) => gp(2, DB_E, [[0, 0], [2, 0]], { el: DB_LAB, es: { ...ek(used, 'done'), ...(cur ? { [`${cur[0]}-${cur[1]}`]: 'active' } : {}) }, st: top !== undefined ? { [top]: 'active' } : {} });
const DB3_N = ['00', '01', '10', '11'];
const DB3_E = [];
for (const s of DB3_N) for (const d of ['0', '1']) DB3_E.push([DB3_N.indexOf(s), DB3_N.indexOf((s + d).slice(1))]);
const OE_E = [[1, 2], [2, 0], [0, 1], [1, 3]];
const OE_D = degTable(4, OE_E);
const OE_BAL = OE_D.out.map((o, i) => o - OE_D.inn[i]);
check(seq(OE_BAL) === '0, 1, 0, -1', 'optimized-euler balances');
check(seq(eulerPathFromPairs(OE_E).path) === '1, 2, 0, 1, 3', 'optimized-euler path');

// ====================== template-euler ======================
const TE_PAIRS = [[3, 2], [2, 1], [1, 3], [1, 4]];
const TE = eulerPathFromPairs(TE_PAIRS);
check(TE.start === 1 && seq(TE.path) === '1, 3, 2, 1, 4' && TE.path.length === TE_PAIRS.length + 1, 'template-euler run');
const TE_L = [3, 2, 1, 4]; // vertex index → label
const TE_P = [[1.4, 0], [1.4, 1.4], [0, 0.7], [-1.4, 0.7]];
const teIdx = (x) => TE_L.indexOf(x);
const TE_EI = TE_PAIRS.map(([u, v]) => [teIdx(u), teIdx(v)]);
const teGraph = (e) => {
  const used = edgesOfWalk(TE.ev.slice(0, TE.ev.indexOf(e) + 1)).map(([u, v]) => [teIdx(u), teIdx(v)]);
  const top = e.stack[e.stack.length - 1];
  return gp(4, TE_EI, TE_P, { lab: TE_L, es: { ...ek(used, 'done'), ...(e.kind === 'push' ? { [`${teIdx(e.u)}-${teIdx(e.v)}`]: 'active' } : {}) }, st: { ...states(e.path.map(teIdx), 'done'), ...(top !== undefined ? { [teIdx(top)]: 'active' } : {}) } });
};
const TT_PAIRS = [[2, 4], [4, 2], [1, 2], [2, 3]];
const TT = eulerPathFromPairs(TT_PAIRS);
check(TT.start === 1 && seq(TT.path) === '1, 2, 4, 2, 3', 'template-euler turn run');
const TT_ORDER = TT.path.slice(1).map((v, i) => `${TT.path[i]}→${v}`);
const TT_L = [2, 4, 1, 3];
const TT_P = [[1.4, 0.7], [2.8, 0.7], [0, 0], [0, 1.4]];
const TT_EI = TT_PAIRS.map(([u, v]) => [TT_L.indexOf(u), TT_L.indexOf(v)]);

// ====================== implementation-euler ======================
const IX_T = [['JFK', 'BOS'], ['JFK', 'LAX'], ['LAX', 'JFK'], ['BOS', 'MIA'], ['MIA', 'BOS']];
const IX = findItinerary(IX_T);
check(seq(IX.path) === 'JFK, LAX, JFK, BOS, MIA, BOS' && IX.ev[0].v === 'BOS', 'itinerary: BOS tried first, dead-ends');
const IX_L = ['JFK', 'BOS', 'MIA', 'LAX'];
const IX_P = [[0, 0.7], [1.5, 0], [3, 0.7], [1.5, 1.6]];
const ixI = (x) => IX_L.indexOf(x);
const IX_EI = IX_T.map(([u, v]) => [ixI(u), ixI(v)]);
const ixGraph = (e) => {
  const used = edgesOfWalk(IX.ev.slice(0, IX.ev.indexOf(e) + 1)).map(([u, v]) => [ixI(u), ixI(v)]);
  const top = e.stack[e.stack.length - 1];
  return gp(4, IX_EI, IX_P, { lab: IX_L, es: { ...ek(used, 'done'), ...(e.kind === 'push' ? { [`${ixI(e.u)}-${ixI(e.v)}`]: 'active' } : {}) }, st: { ...states(e.path.map(ixI), 'done'), ...(top !== undefined ? { [ixI(top)]: 'active' } : {}) } });
};
const SR_LIST = ['SFO', 'ATL', 'DEN'];
const SR_REV = SR_LIST.slice().sort().reverse();
check(seq(SR_REV) === 'SFO, DEN, ATL', 'sort().reverse()');
const IY_T = [['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']];
const IY = findItinerary(IY_T);
check(seq(IY.path) === 'JFK, ATL, JFK, SFO, ATL, SFO', 'itinerary turn');
const IY_ORDER = IY.path.slice(1).map((v, i) => `${IY.path[i]}→${v}`);
const IY_L = ['JFK', 'ATL', 'SFO'];
const IY_EI = IY_T.map(([u, v]) => [IY_L.indexOf(u), IY_L.indexOf(v)]);
const IY_P = [[0, 0], [1.5, 1.2], [3, 0]];

// ====================== dry-run-euler ======================
const DE_T = [['JFK', 'A'], ['JFK', 'B'], ['B', 'JFK']];
const DE = findItinerary(DE_T);
const DE_ROWS = [
  // the lesson's table: stack (before the action), route (after it)
  ['JFK', ''],
  ['JFK,A', 'A'],
  ['JFK', 'A'],
  ['JFK,B', 'A'],
  ['JFK,B,JFK', 'A,JFK'],
  ['JFK,B', 'A,JFK,B'],
  ['JFK', 'A,JFK,B,JFK'],
];
// stack before each loop turn = previous snapshot; route after the lesson's "action" column
const DE_BEFORE = [['JFK'], ...DE.ev.slice(0, -1).map((e) => e.stack)];
check(DE.ev.length === 7 && DE_BEFORE.every((s, i) => s.join(',') === DE_ROWS[i][0]), 'dry-run-euler stack column');
check(DE.ev.every((e, i) => e.path.join(',') === DE_ROWS[i][1]), 'dry-run-euler route column');
check(seq(DE.path) === 'JFK, B, JFK, A', 'dry-run-euler result');
const DE_L = ['JFK', 'A', 'B'];
const DE_P = [[1, 0], [0, 1.3], [2, 1.3]];
const DE_EI = DE_T.map(([u, v]) => [DE_L.indexOf(u), DE_L.indexOf(v)]);
const deGraph = (e, k) => {
  const used = edgesOfWalk(DE.ev.slice(0, k + 1)).map(([u, v]) => [DE_L.indexOf(u), DE_L.indexOf(v)]);
  return gp(3, DE_EI, DE_P, { lab: DE_L, es: { ...ek(used, 'done'), ...(e.kind === 'push' ? { [`${DE_L.indexOf(e.u)}-${DE_L.indexOf(e.v)}`]: 'active' } : {}) } });
};
const DE_NOTE = [
  'Top JFK has unused tickets (A, B). Push A, the smallest.',
  'Top A has no unused ticket. Pop A into the route.',
  'Back at JFK: B is left. Push B.',
  'Top B has a ticket to JFK. Push JFK.',
  'Top JFK: no tickets left. Pop JFK.',
  'Top B: nothing left. Pop B.',
  'Top JFK: nothing left. Pop JFK. Stack empty.',
];

// ====================== intuition-functional ======================
const FN_F = [1, 2, 0, 0, 0, 4, 3]; // the lesson's diagram: 0 → 1 → 2 → 0, 5 → 4 → 0, 6 → 3 → 0
const FN_E = FN_F.map((v, i) => [i, v]);
const FN_P = [[2, 1], [3, 1], [2.5, 2], [1, 1.6], [1, 0.4], [0, 0.4], [0, 1.6]];
const FN = functionalShape(FN_F);
check(seq(FN.seeds) === '5, 6' && seq(FN.queue) === '5, 6, 4, 3' && FN.depth[0] === 2, 'functional peel matches the lesson');
check(seq(FN.onCycle.map((c, i) => (c ? i : -1)).filter((i) => i >= 0)) === '0, 1, 2', 'cycle is 0 → 1 → 2');
const FN_WALK = [6];
while (!FN_WALK.slice(0, -1).includes(FN_WALK[FN_WALK.length - 1])) FN_WALK.push(FN_F[FN_WALK[FN_WALK.length - 1]]);
check(seq(FN_WALK) === '6, 3, 0, 1, 2, 0', 'walk from 6');
const FC_F = [1, 2, 3, 4, 5, 3];
const FC_WALK = [0];
while (!FC_WALK.slice(0, -1).includes(FC_WALK[FC_WALK.length - 1])) FC_WALK.push(FC_F[FC_WALK[FC_WALK.length - 1]]);
const FC_ENTRY = FC_WALK[FC_WALK.length - 1];
check(FC_ENTRY === 3, 'cycle entry from 0 is 3');
const FC_P = [[0, 0], [1, 0], [2, 0], [3, 0], [3.5, 1], [2.5, 1]];
const MX_F = [1, 0, 0, 2, 1, 6, 7, 5];
const MX = maxInvites(MX_F);
check(MX.longest === 3 && MX.pairs === 5 && MX.answer === 5, 'max invites = 5');
const MX_P = [[1, 0], [2, 0], [0, 0], [0, 1], [3, 0], [1, 1.5], [2, 1.5], [1.5, 2.4]];

// ====================== optimized-meta-bfs ======================
const K5_P = [[1, 0], [2, 0.7], [1.6, 1.8], [0.4, 1.8], [0, 0.7]];
const K5_E = [];
for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) K5_E.push([i, j]);
check(K5_E.length === (5 * 4) / 2, 'K5 has 10 pairs');
const BR = [[1, 2, 7], [3, 6, 7], [4, 6, 8]];
const BRR = minGroups(BR, 1, 8);
check(BRR.result === 3 && BRR.levels.length === 3, 'bus routes 1 → 8: 3 buses');
const shared = (a, b) => BR[a].filter((x) => BR[b].includes(x));
const BR_E = [[0, 1], [1, 2]];
check(shared(0, 2).length === 0 && seq(shared(0, 1)) === '7' && seq(shared(1, 2)) === '6', 'route links');
const brGraph = (used, cur) =>
  gp(3, BR_E, [[0, 0], [1.6, 0], [3.2, 0]], { undirected: true, lab: ['R0', 'R1', 'R2'], el: { '0-1': 'stop 7', '1-2': 'stop 6' }, st: { ...states(used, 'done'), ...states(cur, 'active') }, label: 'routes' });
const usedArr = (used, cur = []) => arr(used.map((u) => (u ? 'T' : 'F')), { label: 'usedGroup', highlights: { ...states(used.map((u, i) => (u ? i : -1)).filter((i) => i >= 0), 'done'), ...states(cur, 'active') } });
const BT = [[0, 1, 2], [2, 3], [3, 4], [1, 4, 5]];
const BTR = minGroups(BT, 0, 5);
check(BTR.result === 2, 'turn routes: 2 buses');

// ====================== mistakes ======================
// pass 2 in INCREASING finish order on the lesson's dry-run graph
function pass2Increasing(n, edges, order) {
  const rg = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) rg[v].push(u);
  const comp = new Array(n).fill(-1);
  let count = 0;
  for (const s of order) {
    if (comp[s] !== -1) continue;
    comp[s] = count;
    const st = [s];
    while (st.length) {
      const u = st.pop();
      for (const v of rg[u]) if (comp[v] === -1) {
        comp[v] = count;
        st.push(v);
      }
    }
    count++;
  }
  return { comp, count };
}
const WR = pass2Increasing(5, DR_E, DR.order);
check(WR.count === 1, 'increasing order merges the two SCCs');
// Hierholzer appending on ENTRY (the lesson's mistake 7) on the dry-run tickets
const ENTRY = [];
{
  const adj = new Map([['JFK', ['B', 'A']], ['B', ['JFK']]]);
  const st = ['JFK'];
  ENTRY.push('JFK');
  while (st.length) {
    const out = adj.get(st[st.length - 1]);
    if (out && out.length) {
      const v = out.pop();
      ENTRY.push(v);
      st.push(v);
    } else st.pop();
  }
}
check(seq(ENTRY) === 'JFK, A, B, JFK', 'entry order');
const NUM = [9, 10, 2];
const NUM_REV = NUM.slice().sort().reverse();
check(NUM_REV[NUM_REV.length - 1] === 10, 'default sort puts 10 first');
const SHARED = new Array(3).fill([]);
SHARED[0].push(1);
check(SHARED[2].length === 1, 'fill([]) shares one array');

// ====================== interview-tips ======================
const IV_E = [[0, 1], [1, 2], [3, 1]];
const IV_D = degTable(4, IV_E);
const IV_BAL = IV_D.out.map((o, i) => o - IV_D.inn[i]);
check(IV_BAL.filter((b) => b === 1).length === 2, 'two +1 nodes');

const steps = {
  'intuition-scc': [
    {
      kind: 'watch',
      title: 'Reach each other both ways',
      lines: ['In a **directed** graph, 0 → 1 does not mean 1 → 0.', 'Nodes that reach each other **both ways** form an SCC.', 'Collapse each SCC to one node: the **condensation**, a DAG.'],
      frames: [
        { say: 0, note: 'The lesson\'s graph: 0 → 1 → 2 → 3 → 4, plus 2 → 0 and 4 → 3.', panels: [gp(5, DR_E, DR_P)] },
        { say: 0, note: '2 → 3 is a one-way street. From 3 there is no way back to 2.', panels: [gp(5, DR_E, DR_P, { st: { 2: 'active', 3: 'active' }, es: { '2-3': 'active' } })] },
        { say: 1, note: '0 → 1 → 2 → 0 is a cycle: SCC A = {0, 1, 2}.', panels: [gp(5, DR_E, DR_P, { st: states([0, 1, 2], 'done'), es: ek([[0, 1], [1, 2], [2, 0]], 'done') })] },
        { say: 1, note: '3 → 4 → 3 is a cycle: SCC B = {3, 4}.', panels: [gp(5, DR_E, DR_P, { st: { ...states([0, 1, 2], 'done'), ...states([3, 4], 'visited') }, es: ek([[0, 1], [1, 2], [2, 0]], 'done') })] },
        { say: 2, note: 'Collapse: A → B. Only one edge, no way back. A DAG.', panels: [gp(5, DR_E, DR_P, { st: { ...states([0, 1, 2], 'done'), ...states([3, 4], 'visited') }, es: { '2-3': 'active' } }), condensed({ 0: 'done', 1: 'visited' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: shrink it to a DAG',
      lines: ['Collapse every SCC into one node.', 'Edges inside an SCC disappear; edges between SCCs stay.'],
      panels: [gp(6, IT_E, IT_P, { st: compSt(IT.comp) })],
      task: { type: 'number', question: 'How many edges does the condensation have?', options: [1, 2, 3, 7], answer: IT_CE.length, hint: 'Colours show the SCCs. Count only the arrows that join two different colours.' },
      solved: `SCCs ${IT_SCC.map(setText).join(', ')}. Only ${IT_CROSS.map(([u, v]) => `${u} → ${v}`).join(' and ')} cross between them.`,
      then: [
        { say: 1, note: `Cross edges ${IT_CROSS.map(([u, v]) => `${u} → ${v}`).join(', ')}.`, panels: [gp(6, IT_E, IT_P, { st: compSt(IT.comp), es: ek(IT_CROSS, 'active') })] },
        { say: 1, note: 'Three nodes, two edges, no cycle: a DAG.', panels: [gp(3, IT_CE, IT_CP, { lab: IT_SCC.map((c) => c.join(',')), st: Object.fromEntries(IT_CI.map((x, k) => [k, COMP_ST[IT.comp[x] % 3]])), label: 'condensation' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an edge back',
      lines: ['The condensation is always a DAG.', 'What if we add an edge that points **back** up the chain?'],
      panels: [gp(6, IT_MERGE_E, IT_P, { st: compSt(IT.comp), es: { '5-0': 'active' } })],
      task: {
        type: 'choose',
        question: 'We add 5 → 0. What happens to the three SCCs?',
        options: [
          { text: 'They merge into one SCC', why: '' },
          { text: 'Still three SCCs, now with a cycle between them', why: 'A cycle between components means everyone can reach everyone and back: that is one SCC, not three.' },
          { text: 'Only {0, 1} and 5 merge', why: '5 → 0 → 1 → 2 → 3 → 4 → 5: the new cycle runs through all three groups.' },
        ],
        answer: 0,
      },
      solved: 'The condensation can never have a cycle: a cycle of components is really one component.',
      then: [{ say: 0, note: `Now ${ITM.count} SCC: all six nodes reach each other.`, panels: [gp(6, IT_MERGE_E, IT_P, { st: states([0, 1, 2, 3, 4, 5], 'done') })] }],
    },
  ],

  'optimized-scc': [
    {
      kind: 'watch',
      title: 'Pass 1: record finishing order',
      lines: ['DFS the original graph. Push a node onto `order` when it **finishes**.'],
      frames: [
        { say: 0, note: 'Three SCCs: {0, 1}, {2, 3}, {4, 5}. Pass 1 does not know that yet.', panels: [gp(6, OP_E, OP_P), stk([], 'DFS path'), orderArr([], 6)] },
        ...opPass1,
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where the last finisher lives',
      lines: ['Node 4 finished **last**.', 'Collapse the SCCs and look at the edges between them.'],
      panels: [gp(6, OP_E, OP_P, { st: compSt(OP.comp), es: { '4-2': 'active', '1-2': 'active' } }), orderArr(OP.order, 6, 5)],
      task: {
        type: 'choose',
        question: 'What is special about the SCC of node 4, {4, 5}?',
        options: [
          { text: 'It is a source: no edge comes in from another SCC', why: '' },
          { text: 'It is a sink: no edge leaves it', why: 'It has the edge 4 → 2 leaving it. {2, 3} is the sink.' },
          { text: 'It is the SCC the DFS started in', why: 'The DFS started at 0, in {0, 1}. The last finisher can sit anywhere the DFS reached late.' },
        ],
        answer: 0,
      },
      solved: 'The node that finishes last always lives in a **source** SCC of the condensation.',
    },
    {
      kind: 'watch',
      title: 'Transpose: sources become sinks',
      lines: ['Reverse every edge u → v into v → u.', 'Each SCC stays the same: a reversed cycle is still a cycle.', 'But {4, 5} now has no edge **out**: a sink.'],
      frames: [
        { say: 0, note: 'Original graph with its SCCs coloured.', panels: [gp(6, OP_E, OP_P, { st: compSt(OP.comp) })] },
        { say: 1, note: '0 ⇄ 1, 2 ⇄ 3, 4 ⇄ 5 survive the reversal.', panels: [gp(6, OP_RE, OP_P, { st: compSt(OP.comp), label: 'transpose' })] },
        { say: 2, note: '4 → 2 became 2 → 4. Nothing leaves {4, 5} now.', panels: [gp(6, OP_RE, OP_P, { st: compSt(OP.comp), es: { '2-4': 'active', '2-1': 'active' }, label: 'transpose' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: who starts a DFS?',
      lines: ['Pass 2 walks `order` from **last to first**.', 'An unassigned node starts a DFS **on the transpose**.', 'An assigned node is skipped.'],
      panels: [gp(6, OP_RE, OP_P, { label: 'transpose' }), orderArr(OP.order, 6)],
      task: { type: 'order', question: 'Tap the nodes that start a new DFS, in order.', items: OP_STARTS.map(String), hint: 'Start with the last cell of order. Which nodes does its DFS claim?' },
      solved: `Starts: ${seq(OP_STARTS)}. Each DFS claims exactly one SCC.`,
      then: OP.p2.map((e) => ({
        say: e.kind === 'start' ? 1 : 2,
        note: e.kind === 'start' ? `order[${e.i}] = ${e.s}: new DFS on the transpose claims ${setText(e.reached)} as comp ${e.count}.` : `order[${e.i}] = ${e.s}: already in comp ${e.comp[e.s]}, skip.`,
        panels: [p2Graph(6, OP_RE, OP_P, e.comp, e.s), arr(OP.order, { label: 'order (finish)', pointers: [ptr(e.i, 'i')] }), compArr(e.comp, { [e.s]: 'active' })],
      })),
    },
  ],

  'template-scc': [
    {
      kind: 'watch',
      title: 'Pass 1 with frames',
      lines: ['Each stack frame is `[node, next neighbour index]`.', 'Index in range: read the neighbour, bump the index, push it if new.', 'Index past the end: the node **finished**. Push to `order`, pop.'],
      frames: [{ say: 0, note: 'Edges 0 → 1, 0 → 2, 1 → 0, 2 → 3, 3 → 2.', panels: [gp(4, TS_E, TS_P), stk([], '[node, next]'), orderArr([], 4)] }, ...tsP1],
    },
    {
      kind: 'turn',
      title: 'Your turn: where pass 2 begins',
      lines: ['Pass 2 loops `i` from n − 1 down to 0.', 'It reads `s = order[i]`.'],
      panels: [gp(4, TS_RE, TS_P, { label: 'transpose' }), orderArr(TS.order, 4)],
      task: { type: 'cell', panel: 1, question: 'Which cell of `order` gives the first start of pass 2?', answer: 3, hints: { 0: 'That node finished first. Pass 2 goes in decreasing finish time.' } },
      solved: `order[3] = ${TS.order[3]}: the last node to finish starts pass 2.`,
      then: TS.p2.map((e) => ({
        say: 1,
        note: e.kind === 'start' ? `s = ${e.s}: plain stack on the transpose reaches ${setText(e.reached)}. comp ${e.count}.` : `s = ${e.s}: comp is already ${e.comp[e.s]}, continue.`,
        panels: [p2Graph(4, TS_RE, TS_P, e.comp, e.s), arr(TS.order, { label: 'order (finish)', pointers: [ptr(e.i, 'i')] }), compArr(e.comp, { [e.s]: 'active' })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: two kinds of stack',
      lines: ['Pass 1 pushes `[node, index]` frames.', 'Pass 2 pushes plain nodes.'],
      panels: [stk(['[0, 2]', '[2, 1]', '[3, 1]'], 'pass 1'), stk([1], 'pass 2')],
      task: {
        type: 'choose',
        question: 'Why can pass 2 get away with a plain stack?',
        options: [
          { text: 'It only needs "everything reachable", not finish order', why: '' },
          { text: 'The transpose has no cycles', why: 'Reversing edges keeps every cycle. Each SCC is still full of cycles.' },
          { text: 'Pass 2 visits fewer nodes than pass 1', why: 'Both passes touch every node once. The difference is what they must remember.' },
        ],
        answer: 0,
      },
      solved: 'Pass 1 needs the **true** finishing order, so it keeps frames. Pass 2 only collects a component.',
    },
  ],

  'implementation-scc': [
    {
      kind: 'watch',
      title: 'Mark components with an incoming edge',
      lines: ['Get `comp` from `scc(n, edges)`.', 'Edge u → v with `comp[u] !== comp[v]`: mark `hasIncoming[comp[v]]`.', 'Return how many components stay unmarked.'],
      frames: [
        { say: 0, note: `comp = ${list(IM.comp)}: SCCs ${sccsOf(IM).map(setText).join(', ')}.`, panels: [gp(5, IM_E, IM_P, { st: compSt(IM.comp) }), compArr(IM.comp), hasArr(new Array(IM.count).fill(false))] },
        ...IM.ev.map((e) => ({
          say: 1,
          note: e.cross ? `${e.u} → ${e.v} crosses comp ${IM.comp[e.u]} → ${IM.comp[e.v]}: mark ${IM.comp[e.v]}.` : `${e.u} → ${e.v} stays inside comp ${IM.comp[e.u]}: ignore.`,
          panels: [gp(5, IM_E, IM_P, { st: compSt(IM.comp), es: { [`${e.u}-${e.v}`]: e.cross ? 'active' : 'muted' } }), compArr(IM.comp, { [e.u]: 'window', [e.v]: 'window' }), hasArr(e.has, e.cross ? { [IM.comp[e.v]]: 'active' } : {})],
        })),
        { say: 2, note: `Components ${IM.hasIncoming.map((x, c) => (x ? -1 : c)).filter((c) => c >= 0).join(' and ')} have no incoming edge: return ${IM.result}.`, panels: [gp(5, IM_E, IM_P, { st: compSt(IM.comp) }), hasArr(IM.hasIncoming, hl(IM.count, (c) => (IM.hasIncoming[c] ? '' : 'done'))), vars({ result: IM.result })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the node-counting shortcut',
      lines: ['Someone skips the SCCs and counts **nodes** with in-degree 0.'],
      panels: [gp(5, IM_E, IM_P)],
      task: { type: 'number', question: 'How many nodes have in-degree 0 here?', options: [0, 1, 2, 3], answer: IM_IN0.length, hint: 'Check each node for an arrow coming in. 0 and 1 point at each other.' },
      solved: `Only node 3. But minStarts is ${IM.result}: {0, 1} also needs a start, since nothing outside it reaches it.`,
      then: [{ say: 0, note: 'Node 3 and component {0, 1} are both sources. Count components, not nodes.', panels: [gp(5, IM_E, IM_P, { st: { 0: 'done', 1: 'done', 3: 'done' } }), vars({ nodes: 1, comps: IM.result })] }],
    },
  ],

  'dry-run-scc': [
    {
      kind: 'watch',
      title: 'Pass 1 on 0→1, 1→2, 2→0, 2→3, 3→4, 4→3',
      lines: ['DFS 0 → 1 → 2 → 3 → 4, then 4, 3, 2, 1, 0 finish.'],
      frames: [{ say: 0, note: 'Start pass 1 at 0.', panels: [gp(5, DR_E, DR_P), stk([], 'DFS path'), orderArr([], 5)] }, ...drPass1.slice(1), { say: 0, note: `order = ${list(DR.order)}.`, panels: [gp(5, DR_E, DR_P, { st: states([0, 1, 2, 3, 4], 'done') }), orderArr(DR.order, 5)] }],
    },
    {
      kind: 'watch',
      title: 'Transpose',
      lines: ['Every edge flips: 1→0, 2→1, 0→2, 3→2, 4→3, 3→4.'],
      frames: [
        { say: 0, note: 'The original edges.', panels: [gp(5, DR_E, DR_P)] },
        { say: 0, note: '3 → 2 now points **into** {0, 1, 2}. Nothing leaves that group.', panels: [gp(5, DR_RE, DR_P, { es: { '3-2': 'active' }, label: 'transpose' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the second start',
      lines: ['Pass 2 starts at 0 and claims A = {0, 2, 1}.', 'It keeps walking `order` from right to left.'],
      panels: [arr(DR.order, { label: 'order (finish)', highlights: { 4: 'done' } }), compArr([0, 0, 0, -1, -1])],
      task: { type: 'cell', question: 'Which cell of `order` starts the next DFS?', answer: DR_SKIP_I, hints: { 3: '1 is already in A.', 2: '2 is already in A.', 0: 'Too far: 3 comes before 4 when you walk right to left.' } },
      solved: 'order[1] = 3. 1 and 2 were already assigned.',
      then: DR.p2.map((e) => ({
        say: 1,
        note: e.kind === 'start' ? `Start ${e.s}: transpose DFS reaches ${seq(e.reached)}. comp ${e.count === 0 ? 'A' : 'B'} = ${setText(e.reached)}.` : `${e.s}: already assigned.`,
        panels: [p2Graph(5, DR_RE, DR_P, e.comp, e.s), arr(DR.order, { label: 'order (finish)', pointers: [ptr(e.i, 'i')] }), compArr(e.comp, { [e.s]: 'active' })],
      })),
    },
    {
      kind: 'watch',
      title: 'Result',
      lines: ['2 SCCs. Condensation A → B.', 'Sources = {A}, so minStarts = 1.'],
      frames: [
        { say: 0, note: 'count = 2: A = {0, 1, 2}, B = {3, 4}.', panels: [gp(5, DR_E, DR_P, { st: compSt(DR.comp) }), compArr(DR.comp)] },
        { say: 1, note: 'Only A has no incoming edge: start at any node of A.', panels: [condensed({ 0: 'done', 1: 'visited' }), vars({ count: 2, minStarts: 1 })] },
      ],
    },
  ],

  'intuition-euler': [
    {
      kind: 'watch',
      title: 'Degrees decide',
      lines: ['Passing **through** a node uses one edge in and one edge out.', 'Path: one node with out − in = 1 (start), one with in − out = 1 (end).', 'All others must be balanced.'],
      frames: [
        { say: 0, note: 'Edges 0 → 1, 1 → 2, 2 → 0, 0 → 3.', panels: [gp(4, IE_E, IE_P), degTable(4, IE_E).panel] },
        { say: 0, note: '1 and 2: one in, one out. Balanced.', panels: [gp(4, IE_E, IE_P, { st: { 1: 'visited', 2: 'visited' } }), degTable(4, IE_E, { 1: 'visited', 2: 'visited' }).panel] },
        { say: 1, note: '0 has out − in = 1: the start. 3 has in − out = 1: the end.', panels: [gp(4, IE_E, IE_P, { st: { 0: 'active', 3: 'done' } }), degTable(4, IE_E, { 0: 'active', 3: 'done' }).panel] },
        { say: 2, note: 'Exactly one start, one end, the rest balanced: an Euler path exists.', panels: [gp(4, IE_E, IE_P, { st: { 0: 'active', 3: 'done', 1: 'visited', 2: 'visited' } }), vars({ path: 'yes', from: 0, to: 3 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Hierholzer: stuck early, splice a detour',
      lines: ['Walk forward along any unused edge.', 'Stuck? That node is **final**: put it on `path`, back up.', 'From there, leftover edges form a detour that gets spliced in.', 'Reverse `path` at the end.'],
      frames: [
        { say: 0, note: 'adj[0] = [1, 3]. `pop()` takes 3 first.', panels: [gp(4, IE_E, IE_P, { st: { 0: 'active' } }), stk([0]), arr([], { label: 'path' })] },
        ...IE.ev.map((e) => ({
          say: e.kind === 'pop' ? 1 : IE.ev.slice(0, IE.ev.indexOf(e)).some((x) => x.kind === 'pop') ? 2 : 0,
          note: e.kind === 'push' ? `Unused edge ${e.u} → ${e.v}: push ${e.v}.` : `${e.u} has no unused edge: pop it onto path.`,
          panels: [walkGraph(4, IE_E, IE_P, e), stk(e.stack), arr(e.path, { label: 'path', highlights: e.kind === 'pop' ? { [e.path.length - 1]: 'active' } : {} })],
        })),
        { say: 3, note: `path = ${list(IE.collected)}. Reversed: ${seq(IE.path)}. The detour 0 → 1 → 2 → 0 sits before 3.`, panels: [gp(4, IE_E, IE_P, { es: ek(IE_E, 'done') }), arr(IE.path, { label: 'Euler path', highlights: hl(5, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an undirected graph',
      lines: ['Undirected: 0 odd-degree nodes → circuit.', 'Exactly 2 odd-degree nodes → path between them.'],
      panels: [gp(4, UE_E, UE_P, { undirected: true }), table(['0', '1', '2', '3'], ['degree'], UE_DEG.map((d) => [d]), null, 'degrees')],
      task: {
        type: 'choose',
        question: 'What can you draw, using every edge once?',
        options: [
          { text: 'A path from 0 to 2', why: '' },
          { text: 'A circuit', why: 'A circuit needs every degree even. 0 and 2 have degree 3.' },
          { text: 'Nothing: odd degrees rule it out', why: 'Exactly 2 odd-degree nodes is allowed: the path runs between them.' },
          { text: 'A path from 1 to 3', why: '1 and 3 are even. The path must start and end at the odd ones.' },
        ],
        answer: 0,
      },
      solved: 'Two odd nodes, 0 and 2: an Euler path between them, e.g. 0, 1, 2, 3, 0, 2.',
    },
  ],

  'optimized-euler': [
    {
      kind: 'watch',
      title: 'De Bruijn, n = 2, k = 2',
      lines: ['Node = the last n − 1 typed digits.', 'Edge = typing a digit. The edge **is** a password.', 'Every node is balanced: an Euler **circuit**.', 'String = start node + one digit per edge.'],
      frames: [
        { say: 0, note: 'Nodes "0" and "1".', panels: [gp(2, [], [[0, 0], [2, 0]]), vars({ n: 2, k: 2 })] },
        { say: 1, note: 'From s, typing d goes to (s + d).slice(1). Four edges: 00, 01, 10, 11.', panels: [dbGraph([]), vars({ n: 2, k: 2, edges: 4 })] },
        { say: 2, note: 'Each node: 2 in, 2 out. Balanced. Start at "0".', panels: [dbGraph([], null, 0), table(['0', '1'], ['out', 'in'], [[2, 2], [2, 2]])] },
        ...DB2.H.ev.map((e, k) => ({
          say: 2,
          note: e.kind === 'push' ? `Edge ${e.u}${e.v.slice(-1)}: push "${e.v}".` : `"${e.u}" has no unused edge: pop to path.`,
          panels: [dbGraph(edgesOfWalk(DB2.H.ev.slice(0, k + 1)).map(([u, v]) => [DB_IDX[u], DB_IDX[v]]), e.kind === 'push' ? [DB_IDX[e.u], DB_IDX[e.v]] : null, e.stack.length ? DB_IDX[e.stack[e.stack.length - 1]] : undefined), stk(e.stack), arr(e.path, { label: 'path' })],
        })),
        { say: 3, note: `Circuit ${seq(DB2.H.path)}. "0" + "0110" = "${DB2.str}": 00, 01, 11, 10, length 5.`, panels: [arr(DB2.str.split(''), { label: 'string' }), vars({ length: 5, 'k^n+n−1': 5 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: three-digit codes',
      lines: ['Now n = 3, k = 2: nodes are 2-digit strings.', 'Each of the k^n codes is one edge.'],
      panels: [gp(4, DB3_E, [[0, 0.8], [1.5, 0], [1.5, 1.6], [3, 0.8]], { lab: DB3_N }), vars({ n: 3, k: 2 })],
      task: { type: 'number', question: 'How long is the shortest string holding every 3-digit code?', options: [8, 9, 10, 16], answer: 2 ** 3 + 3 - 1, hint: 'Start node (n − 1 chars) plus one digit per edge.' },
      solved: `2^3 + 3 − 1 = 10. Hierholzer from "00" gives "${DB3.str}".`,
      then: [{ say: 1, note: `"${DB3.str}" holds 000 … 111, each exactly once.`, panels: [arr(DB3.str.slice(0, 5).split(''), { label: 'string 0–4' }), arr(DB3.str.slice(5).split(''), { label: 'string 5–9', indexBase: 5 }), vars({ edges: 8, length: 10 })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the start',
      lines: ['Compute out − in for every node.', 'Start at the node with out − in = 1.', 'Otherwise any node with an edge.'],
      panels: [gp(4, OE_E, [[1.4, 0], [0, 0.8], [1.4, 1.6], [2.8, 0.8]]), arr(OE_BAL, { label: 'out − in' })],
      task: { type: 'cell', panel: 1, question: 'Where must the Euler path start?', answer: OE_BAL.indexOf(1), hints: { 3: 'out − in = −1 marks the END.', 0: '0 is balanced. Starting there leaves edges unused.' } },
      solved: 'Node 1: out − in = 1. The path is 1, 2, 0, 1, 3.',
    },
  ],

  'template-euler': [
    {
      kind: 'watch',
      title: 'Balance picks the start',
      lines: ['For every pair [u, v]: `adj[u].push(v)`, balance[u]++, balance[v]−−.', 'Start = the node with balance 1, else `pairs[0][0]`.'],
      frames: [
        { say: 0, note: `pairs = [3,2], [2,1], [1,3], [1,4].`, panels: [gp(4, TE_EI, TE_P, { lab: TE_L }), table(TE.balance.map(([k]) => String(k)), ['balance'], TE.balance.map(([, b]) => [b]))] },
        { say: 1, note: `pairs[0][0] = 3 is balanced. Node 1 has balance 1: start = ${TE.start}.`, panels: [gp(4, TE_EI, TE_P, { lab: TE_L, st: { [teIdx(1)]: 'active', [teIdx(4)]: 'done' } }), table(TE.balance.map(([k]) => String(k)), ['balance'], TE.balance.map(([, b]) => [b]), TE.balance.map(([k]) => [k === 1 ? 'active' : k === 3 ? 'bad' : ''])), vars({ start: TE.start })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The same stack loop',
      lines: ['Top has an unused edge: push its neighbour.', 'Otherwise pop the top onto `path`.', 'Reverse: E + 1 nodes.'],
      frames: [
        { say: 0, note: 'adj[1] = [3, 4]: `pop()` tries 4 first.', panels: [teGraph({ kind: 'start', stack: [1], path: [] }), stk([1]), arr([], { label: 'path' })] },
        ...TE.ev.map((e) => ({
          say: e.kind === 'push' ? 0 : 1,
          note: e.kind === 'push' ? `Push ${e.v} (edge ${e.u} → ${e.v}).` : `${e.u} is stuck: pop onto path.`,
          panels: [teGraph(e), stk(e.stack), arr(e.path, { label: 'path' })],
        })),
        { say: 2, note: `Reversed: ${seq(TE.path)}. 4 pairs, 5 nodes.`, panels: [gp(4, TE_EI, TE_P, { lab: TE_L, es: ek(TE_EI, 'done') }), arr(TE.path, { label: 'result', highlights: hl(5, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: arrange the pairs',
      lines: ['pairs = [2,4], [4,2], [1,2], [2,3].', 'Consecutive nodes of the path are the pairs, in order.'],
      panels: [gp(4, TT_EI, TT_P, { lab: TT_L }), table(TT.balance.map(([k]) => String(k)), ['balance'], TT.balance.map(([, b]) => [b]))],
      task: { type: 'order', question: 'In what order does the returned path use the pairs?', items: TT_ORDER, hint: 'Start at the balance-1 node. At 2, `pop()` takes 3 first, but 3 is a dead end.' },
      solved: `Path ${seq(TT.path)}. 3 got stuck first, so the detour 2 → 4 → 2 was spliced before it.`,
      then: TT.ev.map((e, k) => ({
        say: 1,
        note: e.kind === 'push' ? `Push ${e.v}.` : `${e.u} stuck: pop to path.`,
        panels: [gp(4, TT_EI, TT_P, { lab: TT_L, es: ek(edgesOfWalk(TT.ev.slice(0, k + 1)).map(([u, v]) => [TT_L.indexOf(u), TT_L.indexOf(v)]), 'done') }), stk(e.stack), arr(e.path, { label: 'path' })],
      })),
    },
  ],

  'implementation-euler': [
    {
      kind: 'turn',
      title: 'Your turn: smallest at the end',
      lines: ['Each list is sorted, then reversed.', 'So `pop()` gives the smallest destination.'],
      panels: [arr(SR_LIST, { label: 'adj JFK (raw)' }), arr(SR_REV, { label: 'after sort().reverse()' })],
      task: { type: 'cell', panel: 1, question: 'Which cell does `pop()` take first?', answer: 2, hints: { 0: 'pop() takes from the END of the array.', 1: 'pop() takes from the END of the array.' } },
      solved: 'ATL, the lexically smallest, sits at the end. `pop()` is O(1).',
    },
    {
      kind: 'watch',
      title: 'Itinerary from JFK',
      lines: ['Push the smallest unused destination of the top.', 'No ticket left: pop the top onto `route`.', 'Reverse `route` at the end.'],
      frames: [
        { say: 0, note: 'Lists after sorting: JFK [LAX, BOS], BOS [MIA], MIA [BOS], LAX [JFK].', panels: [gp(4, IX_EI, IX_P, { lab: IX_L, st: { 0: 'active' } }), stk(['JFK']), arr([], { label: 'route' })] },
        ...IX.ev.map((e) => ({
          say: e.kind === 'push' ? 0 : 1,
          note: e.kind === 'push' ? `${e.u} → ${e.v}: push ${e.v}.` : `${e.u} has no ticket left: pop to route.`,
          panels: [ixGraph(e), stk(e.stack), arr(e.path, { label: 'route' })],
        })),
        { say: 2, note: `${seq(IX.path)}. BOS was tried first but dead-ends, so it went to the END.`, panels: [gp(4, IX_EI, IX_P, { lab: IX_L, es: ek(IX_EI, 'done') }), arr(IX.path, { label: 'itinerary', highlights: hl(6, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the ticket order',
      lines: ['Tickets: JFK→SFO, JFK→ATL, SFO→ATL, ATL→JFK, ATL→SFO.'],
      panels: [gp(3, IY_EI, IY_P, { lab: IY_L })],
      task: { type: 'order', question: 'Tap the tickets in the order the itinerary uses them.', items: IY_ORDER, hint: 'From JFK the smallest is ATL. From ATL, JFK comes before SFO.' },
      solved: `${seq(IY.path)}. No dead end here: the greedy walk uses all 5.`,
    },
  ],

  'dry-run-euler': [
    {
      kind: 'watch',
      title: 'tickets = [JFK→A, JFK→B, B→JFK]',
      lines: ['Top has an unused ticket: push the smallest.', 'Top has none: pop it into the route.', 'Reverse the route at the end.'],
      frames: [
        ...DE.ev.map((e, k) => ({
          say: e.kind === 'push' ? 0 : 1,
          note: DE_NOTE[k],
          panels: [deGraph(e, k), stk(e.stack), arr(e.path, { label: 'route (reversed)', highlights: e.kind === 'pop' ? { [e.path.length - 1]: 'active' } : {} })],
        })),
        { say: 2, note: `Reverse → ${seq(DE.path)}.`, panels: [gp(3, DE_EI, DE_P, { lab: DE_L, es: ek(DE_EI, 'done') }), arr(DE.path, { label: 'itinerary', highlights: hl(4, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the loop turns',
      lines: ['Every turn of the loop either pushes or pops.', 'Each ticket is pushed once; every stack item is popped once.'],
      panels: [gp(3, DE_EI, DE_P, { lab: DE_L }), vars({ tickets: 3, start: 'JFK' })],
      task: { type: 'number', question: 'How many times does the while loop run?', options: [4, 6, 7, 8], answer: DE.ev.length, hint: '3 pushes (one per ticket), and 4 items get popped (JFK plus 3 pushed).' },
      solved: '3 pushes + 4 pops = 7 rows in the table. Linear in E.',
    },
  ],

  'intuition-functional': [
    {
      kind: 'watch',
      title: 'Follow the arrows, fall into a cycle',
      lines: ['Every node has **exactly one** outgoing edge.', 'Finitely many nodes: a walk must repeat.', 'So each piece is a cycle with trees feeding in.'],
      frames: [
        { say: 0, note: 'f = [1, 2, 0, 0, 0, 4, 3]: node i points to f[i].', panels: [gp(7, FN_E, FN_P), arr(FN_F, { label: 'f' })] },
        ...FN_WALK.map((x, k) => ({
          say: k === FN_WALK.length - 1 ? 1 : 0,
          note: k === 0 ? 'Start at 6.' : k === FN_WALK.length - 1 ? `Back at ${x}: a repeat. We are in a cycle.` : `Follow f: ${FN_WALK[k - 1]} → ${x}.`,
          panels: [gp(7, FN_E, FN_P, { st: { ...states(FN_WALK.slice(0, k), 'visited'), [x]: k === FN_WALK.length - 1 ? 'bad' : 'active' }, es: ek(FN_WALK.slice(1, k + 1).map((v, j) => [FN_WALK[j], v]), 'active') }), arr(FN_F, { label: 'f', highlights: { [x]: 'active' } })],
        })),
        { say: 2, note: 'Cycle 0 → 1 → 2 → 0. Trees {4, 5} and {3, 6} feed into 0.', panels: [gp(7, FN_E, FN_P, { st: { ...states([0, 1, 2], 'done'), ...states([3, 4, 5, 6], 'visited') }, es: ek([[0, 1], [1, 2], [2, 0]], 'done') })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Peel the trees (Kahn)',
      lines: ['A tree leaf has in-degree 0: queue it.', 'Pop u, decrease indeg of f[u]; at 0, queue it too.', '`depth[v]` = longest tree chain ending at v.', 'Never peeled = on a cycle.'],
      frames: [
        { say: 0, note: `indeg = ${list(FN.indeg0)}. Leaves: ${seq(FN.seeds)}.`, panels: [gp(7, FN_E, FN_P, { st: states(FN.seeds, 'active') }), arr(FN.indeg0, { label: 'indeg', highlights: states(FN.seeds, 'active') }), que(FN.seeds)] },
        ...FN.pops.map((p) => ({
          say: p.pushed ? 1 : 2,
          note: `Pop ${p.u}: indeg[${p.v}] → ${p.indeg[p.v]}, depth[${p.v}] = ${p.depth[p.v]}.${p.pushed ? ` Queue ${p.v}.` : ''}`,
          panels: [
            gp(7, FN_E, FN_P, { st: { ...states(FN.queue.slice(0, p.h), 'muted'), [p.u]: 'muted', [p.v]: 'active' }, es: { [`${p.u}-${p.v}`]: 'active' } }),
            arr(p.indeg, { label: 'indeg', highlights: { [p.v]: 'active' } }),
            arr(p.depth, { label: 'depth', highlights: { [p.v]: 'active' } }),
          ],
        })),
        { say: 3, note: '0, 1, 2 keep indeg > 0: the cycle. A chain of 2 feeds into 0.', panels: [gp(7, FN_E, FN_P, { st: { ...states([3, 4, 5, 6], 'muted'), ...states([0, 1, 2], 'done') } }), arr(FN.pops[FN.pops.length - 1].indeg, { label: 'indeg', highlights: states([0, 1, 2], 'done') }), arr(FN.depth, { label: 'depth', highlights: { 0: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where the walk enters the cycle',
      lines: ['f = [1, 2, 3, 4, 5, 3].', 'Start at 0 and follow the arrows.'],
      panels: [arr(FC_F, { label: 'f' }), gp(6, FC_F.map((v, i) => [i, v]), FC_P)],
      task: { type: 'cell', question: 'Which node is the first one on the cycle?', answer: FC_ENTRY, hints: { 0: '0 has in-degree 0: a tree leaf, never revisited.', 4: '4 is on the cycle, but the walk reaches 3 before it.', 5: '5 is on the cycle, but the walk reaches 3 first.' } },
      solved: `Walk ${seq(FC_WALK)}: 3 repeats. Cycle 3 → 4 → 5 → 3, tail 0 → 1 → 2.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the round table',
      lines: ['Answer = max(longest cycle, sum over 2-cycles of 2 + depth[a] + depth[b]).'],
      panels: [gp(8, MX_F.map((v, i) => [i, v]), MX_P), arr(MX_F, { label: 'favorite' })],
      task: { type: 'number', question: 'How many employees can be invited?', options: [3, 4, 5, 8], answer: MX.answer, hint: 'Pair 0 ⇄ 1 has chains 3 → 2 → 0 and 4 → 1. Compare with the cycle 5 → 6 → 7.' },
      solved: `Pair: 2 + depth[0] (${MX.depth[0]}) + depth[1] (${MX.depth[1]}) = ${MX.pairs}. Cycle: ${MX.longest}. max = ${MX.answer}.`,
      then: [{ say: 0, note: 'The pair with its two chains beats the 3-cycle.', panels: [gp(8, MX_F.map((v, i) => [i, v]), MX_P, { st: { ...states([0, 1, 2, 3, 4], 'done'), ...states([5, 6, 7], 'muted') } }), vars({ pairs: MX.pairs, cycle: MX.longest, answer: MX.answer })] }],
    },
  ],

  'optimized-meta-bfs': [
    {
      kind: 'watch',
      title: 'Why not connect the stops?',
      lines: ['Naive: connect every pair of stops on the same route.', 'Better: one route = one node. One BFS level = one more bus.'],
      frames: [
        { say: 0, note: 'One route with 5 stops: 5 · 4 / 2 = 10 edges.', panels: [gp(5, K5_E, K5_P, { undirected: true }), vars({ stops: 5, edges: 10 })] },
        { say: 0, note: 'With 10^5 stops on a route: 5·10^9 edges. Impossible.', panels: [gp(5, K5_E, K5_P, { undirected: true, ek: K5_E.map(() => 'muted') }), vars({ stops: '10^5', edges: '5·10^9' })] },
        { say: 1, note: 'Riding inside a route is free, so treat the whole route as one node.', panels: [gp(1, [], [[0, 0]], { lab: ['R0'], st: { 0: 'done' } }), vars({ nodes: 1 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'BFS over routes',
      lines: ['From the current stops, look up their routes.', 'Each **unused** route: mark it used, add its stops to the next level.', 'The level where the target shows up = buses taken.'],
      frames: [
        { say: 0, note: 'routes R0 [1, 2, 7], R1 [3, 6, 7], R2 [4, 6, 8]. From 1 to 8.', panels: [brGraph([], []), que([1], 'frontier'), usedArr([false, false, false])] },
        ...BRR.levels.map((L) => ({
          say: L.hit ? 2 : 1,
          note: `Level ${L.steps}: from ${seq(L.frontier)} board ${L.boarded.map((g) => `R${g}`).join(', ')}.${L.hit ? ' It holds 8: return ' + L.steps + '.' : ` Next stops: ${seq(L.next)}.`}`,
          panels: [brGraph(L.used.map((u, i) => (u && !L.boarded.includes(i) ? i : -1)).filter((i) => i >= 0), L.boarded), que(L.hit ? [8] : L.next, L.hit ? 'target' : 'next frontier'), usedArr(L.used, L.boarded)],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the buses',
      lines: ['routes R0 [0, 1, 2], R1 [2, 3], R2 [3, 4], R3 [1, 4, 5].', 'From stop 0 to stop 5.'],
      panels: [gp(4, [[0, 1], [1, 2], [2, 3], [0, 3]], [[0, 0], [1.6, 0], [1.6, 1.4], [0, 1.4]], { undirected: true, lab: ['R0', 'R1', 'R2', 'R3'], el: { '0-1': '2', '1-2': '3', '2-3': '4', '0-3': '1' }, label: 'routes (edge = shared stop)' }), vars({ source: 0, target: 5 })],
      task: { type: 'number', question: 'What does the BFS return?', options: [1, 2, 3, 4], answer: BTR.result, hint: 'Level 1 boards R0. Which routes touch its stops?' },
      solved: `R0, then R3 at stop 1: ${BTR.result} buses.`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Pass 2 in the wrong order',
      lines: ['Kosaraju pass 2 must go in **decreasing** finish time.', 'Increasing order starts in the wrong component and merges SCCs.'],
      frames: [
        { say: 0, note: `order = ${list(DR.order)}. Correct: start at 0 (the last cell).`, panels: [gp(5, DR_RE, DR_P, { st: compSt(DR.comp), label: 'transpose' }), arr(DR.order, { label: 'order', pointers: [ptr(4, 'right')] })] },
        { say: 1, note: 'Wrong: start at 4 (the first cell). In the transpose 4 → 3 → 2 → 1 → 0.', panels: [gp(5, DR_RE, DR_P, { st: states([0, 1, 2, 3, 4], 'bad'), es: ek([[4, 3], [3, 2], [2, 1], [1, 0]], 'active'), label: 'transpose' }), arr(DR.order, { label: 'order', pointers: [ptr(0, 'wrong', 'b')] }), vars({ count: WR.count })] },
        { say: 1, note: 'One DFS swallows both SCCs: count = 1 instead of 2.', panels: [compArr(WR.comp, hl(5, () => 'bad')), vars({ count: WR.count, right: 2 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: appending on entry',
      lines: ['Hierholzer must append a node when it gets **stuck**.', 'Appending when you **enter** a node gives the walk order.'],
      panels: [gp(3, DE_EI, DE_P, { lab: DE_L }), arr(ENTRY, { label: 'entry order', highlights: hl(4, () => 'bad') })],
      task: {
        type: 'choose',
        question: `Entry order is ${seq(ENTRY)}. Which hop has no ticket?`,
        options: [
          { text: 'A → B', why: '' },
          { text: 'JFK → A', why: 'JFK → A is a real ticket.' },
          { text: 'B → JFK', why: 'B → JFK is a real ticket.' },
        ],
        answer: 0,
      },
      solved: `A was a dead end. Stuck-time order reversed gives ${seq(DE.path)}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: sort() on numbers',
      lines: ['`sort()` with no compare function is lexicographic.', 'Number nodes need `(a, b) => a - b`.'],
      panels: [arr(NUM, { label: 'adj (numbers)' }), arr(NUM_REV, { label: 'sort().reverse()' })],
      task: {
        type: 'choose',
        question: 'What does `pop()` return first?',
        options: [
          { text: '10', why: '' },
          { text: '2', why: 'Only with a numeric compare. As strings, "10" < "2" < "9".' },
          { text: '9', why: '9 is first after the reverse, not last.' },
        ],
        answer: 0,
      },
      solved: 'As strings "10" sorts first, so it ends up last and `pop()` returns 10, not the smallest node 2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: one shared list',
      lines: ['`adj = new Array(3).fill([])`, then `adj[0].push(1)`.'],
      panels: [arr(SHARED.map((l) => list(l)), { label: 'adj' })],
      task: {
        type: 'choose',
        question: 'What is in adj[2]?',
        options: [
          { text: '[1]', why: '' },
          { text: '[]', why: 'fill([]) puts the SAME array in every slot, so the push shows up everywhere.' },
          { text: 'undefined', why: 'fill sets every slot, to one shared array.' },
        ],
        answer: 0,
      },
      solved: 'Every node shares ONE adjacency array. Use `Array.from({ length: n }, () => [])`.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Say the SCC idea in one line',
      lines: ['"Two passes: finish order, then DFS the transpose in reverse finish order."', 'The reason: the last finisher sits in a source SCC.'],
      frames: [
        { say: 0, note: 'Pass 1 gives order; pass 2 reads it right to left on the transpose.', panels: [gp(5, DR_RE, DR_P, { st: compSt(DR.comp), label: 'transpose' }), arr(DR.order, { label: 'order', pointers: [ptr(4, 'first')] })] },
        { say: 1, note: '0 finished last. Its SCC A is the source of A → B.', panels: [condensed({ 0: 'active', 1: 'visited' }), arr(DR.order, { label: 'order', highlights: { 4: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: check the degrees first',
      lines: ['For Euler problems, check the degree conditions first.', 'Then say how you pick the start.'],
      panels: [gp(4, IV_E, [[0, 0], [1.4, 0.7], [2.8, 0.7], [0, 1.4]]), IV_D.panel],
      task: {
        type: 'choose',
        question: 'Asked for a path using every edge once here. What do you say first?',
        options: [
          { text: 'No Euler path: two nodes have out − in = 1', why: '' },
          { text: 'Start at 0 and run Hierholzer', why: 'The degree check fails: 0 and 3 both have out − in = 1. Only one start is allowed.' },
          { text: 'Start at 2, the only end', why: '2 and 1 both have in − out = 1 as well. The conditions fail, so there is no path.' },
        ],
        answer: 0,
      },
      solved: 'Two would-be starts (0 and 3): no Euler path. The degree check answers before any walk.',
    },
  ],
};

export default steps;
