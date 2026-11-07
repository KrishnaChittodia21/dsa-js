// Pattern animations for graphs: building an adjacency list from an edge list, bidirectional BFS
// (word ladder from both ends) and BFS over (node, mask) states (shortest path visiting all nodes).
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
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toInt = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);

// ====================== graph-adjacency-representation ======================
export const graphAdjacencyBuild = {
  problem: { name: 'Edge list to adjacency list', statement: 'Convert a list of edges into, for every vertex, the list of its neighbours (and its degree).', example: 'n = 5, edges [0,1] [0,2] [1,2] [1,3] [3,4] → adj = [[1,2], [0,2,3], [0,1], [1,4], [3]]', exampleOutput: [[1, 2], [0, 2, 3], [0, 1], [1, 4], [3]] },
  title: 'Edge list → adjacency list',
  description:
    'One pass over the edges: push v into adj[u] (and u into adj[v] when undirected) and count degrees. n is clamped to 0–8, at most 10 edges; edges with a vertex outside 0..n−1 or a self-loop are dropped.',
  defaultInput: { n: 5, edges: [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4]], type: 'undirected' },
  fields: [
    { key: 'n', type: 'number', label: 'n' },
    { key: 'edges', type: 'json', label: 'edges [[u, v], …]' },
    { key: 'type', type: 'select', label: 'graph', options: ['undirected', 'directed'] },
  ],
  testInputs: [
    { n: 0, edges: [], type: 'undirected' },
    { n: 1, edges: [], type: 'undirected' },
    { n: 4, edges: [[1, 3], [2, 3], [4, 3], [0, 3]], type: 'directed' },
    { n: 3, edges: [[0, 1], [0, 1], [5, 1], [2, 2]], type: 'undirected' },
    { n: 99, edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 4], [1, 5], [2, 6], [3, 7]], type: 'undirected' },
  ],
  generate({ n, edges, type }) {
    n = clamp(toInt(n), 0, 8);
    const directed = type === 'directed';
    const list = (Array.isArray(edges) ? edges : [])
      .filter((e) => Array.isArray(e) && e.length >= 2)
      .map(([u, v]) => [toInt(u, -1), toInt(v, -1)])
      .filter(([u, v]) => u >= 0 && v >= 0 && u < n && v < n && u !== v)
      .slice(0, 10);
    const adj = Array.from({ length: n }, () => []);
    const degree = new Array(n).fill(0);
    const pos = layoutCircle(n);
    const frames = [];
    const degName = directed ? 'out-degree' : 'degree';
    const snap = (note, cur = -1, row = -1) => {
      const edgeHl = {};
      list.forEach((_, i) => (edgeHl[i] = i < cur ? 'done' : i === cur ? 'active' : ''));
      const rowStates = adj.map((_, i) => (i === row ? ['active', 'active'] : ['', '']));
      const panels = [
        arr(list.map(([u, v]) => `${u}${directed ? '→' : '-'}${v}`), { label: 'edges', highlights: edgeHl, ...(cur >= 0 && cur < list.length ? { pointers: [{ index: cur, label: 'e', color: 'a' }] } : {}) }),
        { kind: 'table', label: `adj + ${degName}`, rowLabels: adj.map((_, i) => String(i)), colLabels: ['adj', directed ? 'out' : 'deg'], cells: adj.map((l, i) => [l.length ? l.join(',') : '—', degree[i]]), states: rowStates },
        {
          kind: 'nodes',
          nodes: pos.map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: p.id === row ? 'active' : adj[p.id].length ? 'visited' : '' })),
          edges: list.map(([a, b], i) => ({ from: a, to: b, state: i === cur ? 'done' : i > cur ? 'muted' : '' })),
          directed,
          freeLayout: true,
          label: 'graph (grey = not read yet)',
        },
      ];
      frames.push({ note, panels });
    };
    if (n === 0) {
      snap('n = 0: no vertices, so adj is an empty array and there is nothing to read.');
      snap('Done: adj = [], degree = []. O(n + m) = O(0).');
      frames.at(-1).result = adj;
      return frames;
    }
    snap(`Make ${n} separate empty lists with Array.from (fill([]) would share ONE array) and degree = all 0. ${list.length} edge(s) to read.`);
    let asks = 0;
    list.forEach(([u, v], i) => {
      let q;
      if (i === 1 || (i === 3 && !directed)) q = pick(`Edge [${u}, ${v}] is read next. What does the first line of the loop do?`, `adj[${u}].push(${v})`, [`adj[${v}].push(${u})`, `adj[${u}].push(${u})`, `adj[${v}].push(${v})`], asks++);
      adj[u].push(v);
      degree[u]++;
      snap(`Edge [${u}, ${v}]: push ${v} into adj[${u}] and degree[${u}]++ → ${degree[u]}.${directed ? ' Directed: only u gets the neighbour.' : ''}`, i, u);
      attach(frames, q);
      if (!directed) {
        q = i === 2 ? pick(`Edge [${u}, ${v}] is undirected. adj[${u}] got ${v}. What happens to adj[${v}]?`, `push ${u}`, ['nothing', `push ${v}`], asks++) : undefined;
        adj[v].push(u);
        degree[v]++;
        snap(`Undirected, so the reverse edge too: push ${u} into adj[${v}], degree[${v}] → ${degree[v]}. Forgetting this line is the classic bug.`, i, v);
        attach(frames, q);
      }
    });
    const max = Math.max(...degree);
    const top = degree.map((d, i) => (d === max ? i : -1)).filter((i) => i >= 0);
    const q = list.length && n > 1 ? pick(`All edges read. Which vertex has the largest ${degName}?`, top.join(' and '), [...degree.map((_, i) => i).filter((i) => !top.includes(i)).reverse()], asks++) : undefined;
    const sum = degree.reduce((a, b) => a + b, 0);
    snap(
      `Done. ${list.length ? `Largest ${degName}: ${top.join(' and ')} (${max}). ` : 'No edges: every list is empty. '}${directed ? `Out-degrees add up to m = ${sum}.` : `Degrees add up to 2m = ${sum} (each edge counted at both ends).`} Building took O(n + m); now a neighbour lookup is O(deg) instead of O(m).`,
      list.length,
    );
    attach(frames, q);
    frames.at(-1).result = adj;
    return frames;
  },
};

// ====================== bidirectional-bfs ======================
const cleanWord = (w) => String(w ?? '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
const oneApart = (a, b) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;
const fmtSet = (s) => `{${[...s].join(', ')}}`;

export const bidirectionalBfs = {
  problem: { name: 'Word Ladder', statement: 'Change one letter at a time, using only dictionary words, to get from begin to end. Return the length of the shortest chain.', example: 'hit → cog with [hot, dot, dog, lot, log, cog] → 5 (hit, hot, dot, dog, cog)', exampleOutput: 5, questionId: 'word-ladder' },
  title: 'Bidirectional BFS: word ladder',
  description:
    'Words are vertices, one-letter changes are edges. Two frontiers grow from begin and end; the smaller one is expanded each layer, and the search stops when a neighbour is in the other frontier. Words are cut to 4 lowercase letters and at most 8 words are drawn (begin, end and the first 6 others of the same length).',
  defaultInput: { begin: 'hit', end: 'cog', words: ['hot', 'dot', 'dog', 'lot', 'log', 'cog'] },
  fields: [
    { key: 'begin', type: 'string', label: 'begin' },
    { key: 'end', type: 'string', label: 'end' },
    { key: 'words', type: 'strings', label: 'words' },
  ],
  testInputs: [
    { begin: '', end: '', words: [] },
    { begin: 'hot', end: 'hot', words: ['hot'] },
    { begin: 'hit', end: 'cog', words: ['hot', 'dot', 'lot'] },
    { begin: 'ab', end: 'xyz', words: ['ab', 'xyz'] },
    { begin: 'cold', end: 'warm', words: ['cord', 'card', 'ward', 'warm', 'wore', 'core', 'word', 'worm', 'corm'] },
    { begin: 'a', end: 'c', words: ['b', 'c'] },
  ],
  generate({ begin, end, words }) {
    const s = cleanWord(begin);
    const t = cleanWord(end);
    const others = [...new Set((Array.isArray(words) ? words : []).map(cleanWord))].filter((w) => w && w !== s && w !== t && w.length === s.length);
    const nodes = [...new Set([s, ...others.slice(0, 6), t])];
    const dict = new Set(nodes);
    // generator order: change position 0 first, then position 1, …; letters a→z at each position
    const neighbors = (u) =>
      nodes
        .filter((w) => oneApart(u, w))
        .sort((a, b) => {
          const ia = [...a].findIndex((c, i) => c !== u[i]);
          const ib = [...b].findIndex((c, i) => c !== u[i]);
          return ia - ib || (a[ia] < b[ib] ? -1 : 1);
        });
    // layout: x = BFS distance from begin, y = position within that column
    const dist = { [s]: 0 };
    const order = [s];
    for (let h = 0; h < order.length; h++) for (const v of neighbors(order[h])) if (!(v in dist)) { dist[v] = dist[order[h]] + 1; order.push(v); }
    const far = Math.max(0, ...Object.values(dist)) + 1;
    const col = {};
    const xy = nodes.map((w) => {
      const x = w in dist ? dist[w] : far;
      col[x] = (col[x] || 0) + 1;
      return [x * 1.25, col[x] - 1];
    });
    for (const [i] of nodes.entries()) {
      const k = col[xy[i][0] / 1.25];
      xy[i][1] -= (k - 1) / 2;
    }
    const idx = Object.fromEntries(nodes.map((w, i) => [w, i]));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (oneApart(nodes[i], nodes[j])) edges.push([i, j]);

    const side = { [s]: 'A', [t]: 'B' };
    const tree = new Set();
    let A = new Set([s]);
    let B = new Set([t]);
    const frames = [];
    const snap = (note, { expanding = new Set(), met = [], steps = 0 } = {}) => {
      const graph = {
        kind: 'nodes',
        nodes: nodes.map((w, i) => ({
          id: i,
          label: w || '""',
          x: xy[i][0],
          y: xy[i][1],
          state: met.includes(w) ? 'bad' : expanding.has(w) ? 'active' : side[w] === 'A' ? 'done' : side[w] === 'B' ? 'visited' : '',
        })),
        edges: edges.map(([a, b]) => ({ from: a, to: b, state: tree.has(`${a}-${b}`) || (met.includes(nodes[a]) && met.includes(nodes[b])) ? 'done' : '' })),
        directed: false,
        freeLayout: true,
        label: 'orange = begin side, blue = end side',
      };
      frames.push({
        note,
        panels: [graph, arr([...A], { label: `begin-side frontier (${A.size})` }), arr([...B], { label: `end-side frontier (${B.size})` }), vars({ steps, seen: Object.keys(side).length })],
      });
    };
    snap(`Find the fewest one-letter changes from "${s}" to "${t}". Frontier A = {${s}}, frontier B = {${t}}, one shared seen set.`);
    if (s === t) {
      snap(`begin === end, so the answer is 0 changes before any search. O(1).`);
      frames.at(-1).result = 1; // ladder length in words, as LeetCode counts it
      return frames;
    }
    let asks = 0;
    let answer = -1;
    let meet = null;
    let frontIsA = true; // `front` starts as the begin side
    outer: for (let steps = 1; A.size && B.size; steps++) {
      // template: if (front.size > back.size) swap, so ties keep the current front
      if ((frontIsA ? A.size : B.size) > (frontIsA ? B.size : A.size)) frontIsA = !frontIsA;
      const front = frontIsA ? A : B;
      const back = frontIsA ? B : A;
      const q = steps >= 2 && asks < 3 ? pick(`Layer ${steps}: begin side has ${A.size} word(s), end side has ${B.size}. Which frontier is expanded?`, frontIsA ? fmtSet(A) : fmtSet(B), [frontIsA ? fmtSet(B) : fmtSet(A), 'both, one after the other'], asks++) : undefined;
      snap(
        `Layer ${steps}: ${A.size} vs ${B.size}. ${A.size === B.size ? 'A tie, so no swap: the current front grows.' : 'Expand the smaller one (fewer neighbours to generate).'} Expanding ${frontIsA ? 'the begin' : 'the end'} side ${fmtSet(front)}.`,
        { expanding: new Set(front), steps: steps - 1 },
      );
      attach(frames, q);
      const next = new Set();
      for (const u of front) {
        const found = [];
        for (const v of neighbors(u)) {
          if (back.has(v)) {
            meet = [u, v];
            answer = steps;
            const mq = asks < 4 ? pick(`Expanding "${u}": its neighbour "${v}" is in the OTHER frontier. What happens?`, `stop: answer ${steps}`, [`add "${v}" to next`, `skip "${v}" (already seen)`], asks++) : undefined;
            snap(`"${u}" → "${v}" and "${v}" is in the other frontier: the two searches touch. Answer = steps = ${steps} change(s).`, { met: meet, steps });
            attach(frames, mq);
            break outer;
          }
          if (!(v in side)) {
            side[v] = side[u];
            next.add(v);
            found.push(v);
            const [a, b] = [idx[u], idx[v]].sort((x, y) => x - y);
            tree.add(`${a}-${b}`);
          }
        }
        snap(`Expand "${u}": ${found.length ? `new word(s) ${found.join(', ')} → seen, next frontier.` : 'every one-letter neighbour is already seen, nothing new.'}`, { expanding: new Set([u]), steps: steps - 1 });
      }
      if (frontIsA) A = next;
      else B = next;
      if (!next.size) {
        snap(`The ${frontIsA ? 'begin' : 'end'} side has no new words: its frontier is empty, so the two searches can never meet.`, { steps });
        break;
      }
    }
    const pathLen = answer > 0 ? `${answer} change(s), i.e. a ladder of ${answer + 1} words (LeetCode's word ladder counts words, so it returns ${answer + 1})` : '0: no ladder exists';
    const fq = answer > 0 ? pick('The searches met. How many words are in the whole ladder?', answer + 1, [answer, answer + 2, answer - 1 > 0 ? answer - 1 : answer + 3], 2) : undefined;
    snap(`Result: ${pathLen}. ${answer > 0 ? 'Each side searched only about half the depth, which is where the speed-up comes from.' : 'One frontier ran empty first, so the search stopped early.'}`, { met: meet || [], steps: answer });
    attach(frames, fq);
    frames.at(-1).result = answer > 0 ? answer + 1 : 0; // LeetCode: words in the ladder, 0 if none
    return frames;
  },
};

// ====================== graph-state-space-bfs ======================
export const stateSpaceBfs = {
  problem: { name: 'Shortest Path Visiting All Nodes', statement: 'Return the length of the shortest walk that visits every node (start anywhere, revisits allowed).', example: 'graph [[1,2,3], [0], [0], [0]] → 4', exampleOutput: 4, questionId: 'shortest-path-visiting-all-nodes' },
  title: 'BFS over (node, mask) states',
  description:
    'Shortest path that visits every node: a BFS vertex is a state (node, mask), and bit i of mask means node i was visited. Every node starts in the queue. The graph is cut to 4 nodes (4 · 16 = 64 states at most); bad neighbour ids are dropped and edges are made two-way.',
  defaultInput: { graph: [[1, 2, 3], [0], [0], [0]] },
  fields: [{ key: 'graph', type: 'json', label: 'graph (adjacency list)' }],
  testInputs: [{ graph: [] }, { graph: [[]] }, { graph: [[1], [0], []] }, { graph: [[1], [0, 2], [1, 3], [2]] }, { graph: [[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2], [0]] }, { graph: 'x' }],
  generate({ graph }) {
    const raw = Array.isArray(graph) ? graph.slice(0, 4) : [];
    const n = raw.length;
    const adj = Array.from({ length: n }, () => new Set());
    raw.forEach((l, u) => (Array.isArray(l) ? l : []).forEach((x) => {
      const v = toInt(x, -1);
      if (v >= 0 && v < n && v !== u) { adj[u].add(v); adj[v].add(u); }
    }));
    const nb = adj.map((s) => [...s].sort((a, b) => a - b));
    const full = (1 << n) - 1;
    const bits = (m) => m.toString(2).padStart(n, '0');
    const lab = ([u, m]) => `${u}·${bits(m)}`;
    const pos = layoutCircle(n);
    const edgeList = [];
    nb.forEach((l, u) => l.forEach((v) => u < v && edgeList.push([u, v])));
    const seen = Array.from({ length: n }, () => new Uint8Array(1 << n));
    const queue = [];
    let head = 0;
    let seenCount = 0;
    const frames = [];
    const snap = (note, cur, added = []) => {
      const [u, mask, d] = cur || [-1, 0, 0];
      const panels = [
        {
          kind: 'nodes',
          nodes: pos.map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: p.id === u ? 'active' : mask & (1 << p.id) ? 'done' : '' })),
          edges: edgeList.map(([a, b]) => ({ from: a, to: b, state: '' })),
          directed: false,
          freeLayout: true,
          label: cur ? `state (${u}, ${bits(mask)}): green = in mask` : 'graph',
        },
      ];
      if (n) panels.push(arr(bits(mask).split(''), { label: `mask bits for nodes ${[...Array(n).keys()].reverse().join(' ')}`, showIndices: false, highlights: Object.fromEntries(bits(mask).split('').map((b, k) => [k, b === '1' ? 'done' : ''])) }));
      panels.push({ kind: 'queue', label: 'queue (node·mask)', values: queue.slice(head).map(lab) }, vars({ level: cur ? d : 0, 'seen states': `${seenCount} / ${n * (1 << n)}`, ...(added.length ? { pushed: added.map(lab).join(' ') } : {}) }));
      frames.push({ note, panels });
    };
    if (n === 0) {
      snap('No nodes: the queue never gets a state.');
      snap('The template returns -1 here (the loop never runs). LeetCode guarantees n ≥ 1.');
      frames.at(-1).result = -1;
      return frames;
    }
    for (let i = 0; i < n; i++) {
      queue.push([i, 1 << i, 0]);
      seen[i][1 << i] = 1;
      seenCount++;
    }
    snap(`Every node can be the start, so all ${n} states (i, 1 << i) go into the queue at level 0 and are marked seen. full = ${bits(full)}.`);
    let asks = 0;
    let answer = -1;
    let pops = 0;
    for (; head < queue.length; ) {
      const cur = queue[head];
      const [u, mask, d] = cur;
      pops++;
      if (mask === full) {
        head++;
        const q = pick(`State (${u}, ${bits(mask)}) is popped at level ${d}. What does BFS do?`, `return ${d}`, ['expand its neighbours', `return ${d + 1}`], asks++);
        snap(`Pop (${u}, ${bits(mask)}): mask === full, every node is visited. BFS pops states in level order, so ${d} moves is the shortest walk.`, cur);
        attach(frames, q);
        answer = d;
        break;
      }
      head++;
      const added = [];
      const skipped = [];
      for (const v of nb[u]) {
        const m2 = mask | (1 << v);
        if (!seen[v][m2]) {
          seen[v][m2] = 1;
          seenCount++;
          queue.push([v, m2, d + 1]);
          added.push([v, m2]);
        } else skipped.push(`${v}·${bits(m2)}`);
      }
      let q;
      // ask about the revisit case: a node already in the mask, reached again with a different mask
      if (asks < 3 && pops >= 2 && added.length && (pops % 3 === 0 || added.some(([v]) => mask & (1 << v)))) {
        const [v, m2] = added[0];
        q = pick(`Pop (${u}, ${bits(mask)}). Moving to neighbour ${v}, which state is pushed?`, `${v}·${bits(m2)}`, [`${v}·${bits(1 << v)}`, `${u}·${bits(m2)}`, `${v}·${bits(mask)}`], asks++);
      }
      const revisit = added.filter(([v]) => mask & (1 << v));
      snap(
        `Pop (${u}, ${bits(mask)}) at level ${d}. ${added.length ? `Push ${added.map(lab).join(', ')} (mask | (1 << v)).` : 'Nothing new.'}${skipped.length ? ` Already seen: ${skipped.join(', ')}.` : ''}${revisit.length ? ` Node ${revisit[0][0]} is visited again, but with a new mask, so it is a NEW state.` : ''}`,
        cur,
        added,
      );
      attach(frames, q);
    }
    if (answer < 0) snap(`Queue empty and no state reached mask ${bits(full)}: the graph is not connected, so no walk visits every node. Return -1.`);
    else snap(`Answer: ${answer} move(s). At most n · 2^n = ${n * (1 << n)} states, each expanded once: O(2^n · n²) time. ${seenCount} states were seen here.`, queue[head - 1]);
    frames.at(-1).result = answer;
    return frames;
  },
};
