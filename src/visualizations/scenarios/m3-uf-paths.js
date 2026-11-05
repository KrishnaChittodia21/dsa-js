// Pattern animations for union-find and shortest-path variants: key mapping (accounts merge), weighted DSU
// (evaluate division), online DSU (number of islands II), minimax Dijkstra (path with minimum effort) and
// state-augmented BFS (shortest path with k obstacle eliminations).
import { layoutCircle } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const queue = (values, label) => ({ kind: 'queue', values, label });
const grid = (cells, states, label) => ({ kind: 'grid', cells, states, label });
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
const toInt = (v, lo, hi, d) => {
  const x = Number(v);
  return Number.isFinite(x) ? clamp(Math.round(x), lo, hi) : d;
};
const num = (x) => String(Number(x.toPrecision(4)));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// DSU forest: every non-root points at its parent. Ids not created yet are hidden so the layout never jumps.
function forestPanel(total, parent, { created = total, states = {}, labels, edgeLabels, label } = {}) {
  const pos = layoutCircle(total);
  const edges = [];
  for (let i = 0; i < created; i++) if (parent[i] !== i) edges.push({ from: i, to: parent[i], label: edgeLabels ? edgeLabels[i] : undefined, state: '' });
  return {
    kind: 'nodes',
    nodes: pos.map((p) => ({ id: p.id, label: labels ? String(labels[p.id]) : String(p.id), x: p.x, y: p.y, state: p.id >= created ? 'hidden' : states[p.id] || '' })),
    edges,
    directed: true,
    freeLayout: true,
    label,
  };
}
const rootOf = (parent, x) => {
  while (parent[x] !== x) x = parent[x];
  return x;
};

// Number grid from user JSON: rows/cols clamped, missing or non-numeric cells become 0.
function readGrid(raw, maxR, maxC, lo, hi) {
  const rows = (Array.isArray(raw) ? raw : []).filter(Array.isArray);
  const R = Math.min(rows.length, maxR);
  const C = R ? Math.min(Math.max(...rows.slice(0, R).map((r) => r.length)), maxC) : 0;
  if (!C) return { g: [], R: 0, C: 0, clamped: rows.length > 0 };
  const g = rows.slice(0, R).map((r) => Array.from({ length: C }, (_, c) => toInt(r[c], lo, hi, 0)));
  const clamped = rows.length > maxR || rows.some((r) => r.length > maxC || r.some((v) => toInt(v, lo, hi, NaN) !== Number(v)));
  return { g, R, C, clamped };
}

/* ------------------------------------------------------------------ key mapping: accounts merge */
export const ufAccountsMerge = {
  title: 'Union Find key mapping: accounts merge',
  description:
    'Emails are strings, so getId() gives each new email the next integer id (id.size) the first time it is seen; then every email of an account is unioned with that account\'s first email, and the groups are read back by root. Clamped to 5 accounts, 4 emails per account and 8 distinct emails; accounts without emails are skipped.',
  defaultInput: { accounts: [['John', 'js@m', 'jn@m'], ['John', 'js@m', 'j0@m'], ['Mary', 'm@m'], ['John', 'jb@m']] },
  fields: [{ key: 'accounts', type: 'json', label: 'accounts [name, email, …]' }],
  testInputs: [
    { accounts: [] },
    { accounts: [['Ann', 'a@x']] },
    { accounts: [['Ann', 'a@x', 'a@x'], ['Bob', 'b@x'], ['Ann', 'a@x']] },
    { accounts: [['Ann', 'a', 'b'], ['Ann', 'c', 'd'], ['Ann', 'd', 'a']] },
    { accounts: [['Nobody'], 'junk', ['Ann', 'q']] },
    { accounts: [['A', '1', '2', '3', '4', '5'], ['B', '6', '7', '8', '9'], ['C', '1', '10'], ['D', 'x'], ['E', 'y'], ['F', 'z']] },
  ],
  generate({ accounts }) {
    const src = Array.isArray(accounts) ? accounts : [];
    let dropped = Math.max(0, src.length - 5);
    const accs = [];
    const known = new Set();
    for (const a of src.slice(0, 5)) {
      if (!Array.isArray(a) || a.length < 2) {
        dropped++;
        continue;
      }
      const emails = [];
      for (const e of a.slice(1)) {
        const s = String(e);
        if (emails.length >= 4 || (!known.has(s) && known.size >= 8)) {
          dropped++;
          continue;
        }
        known.add(s);
        emails.push(s);
      }
      if (emails.length) accs.push({ name: String(a[0]).slice(0, 6), emails });
      else dropped++;
    }
    const total = known.size;
    const id = new Map();
    const keys = [];
    const owner = [];
    const parent = [];
    const size = [];
    let groups = 0;
    const getId = (key) => {
      if (!id.has(key)) {
        id.set(key, id.size);
        keys.push(key);
        parent.push(parent.length);
        size.push(1);
        groups++;
      }
      return id.get(key);
    };
    const find = (x) => {
      const r = rootOf(parent, x);
      while (parent[x] !== r) [parent[x], x] = [r, parent[x]];
      return r;
    };
    const show = (k) => (k.length > 10 ? `${k.slice(0, 9)}…` : k);
    const frames = [];
    const keyTable = (hl = {}) => ({
      kind: 'table',
      label: 'Map: email → id',
      rowLabels: keys.map((_, i) => `id ${i}`),
      colLabels: ['email', 'owner', 'root'],
      cells: keys.map((k, i) => [show(k), owner[i], rootOf(parent, i)]),
      states: keys.map((_, i) => new Array(3).fill(hl[i] || '')),
    });
    const snap = (note, states = {}, acc = '—') =>
      frames.push({ note, panels: [forestPanel(total, parent, { created: keys.length, states, label: 'DSU over email ids (child → parent)' }), keyTable(states), vars({ account: acc, ids: id.size, groups })] });
    const clampNote = dropped ? ` (${dropped} account(s)/email(s) skipped by the size limits or because they had no emails.)` : '';
    if (!accs.length) {
      snap(`No accounts with emails to read.${clampNote}`);
      snap('Nothing to merge → return [].');
      return frames;
    }
    snap(`${accs.length} account(s). The DSU only works on ids 0..n−1, so each email gets an id the first time we see it: id.set(email, id.size).${clampNote}`);
    let askNew = 0;
    let askUnion = 0;
    let step = 0;
    accs.forEach(({ name, emails }, ai) => {
      const acc = `#${ai} ${name}`;
      let first = -1;
      emails.forEach((e, j) => {
        step++;
        const isNew = !id.has(e);
        let q;
        if (step >= 2 && askNew < 3 && (isNew ? step % 2 === 0 : true)) {
          q = pick(`Account ${acc} lists "${show(e)}". What does getId("${show(e)}") do?`, isNew ? `New key → id ${id.size}` : `Seen before → reuse id ${id.get(e)}`, isNew ? ['Seen before → reuse an old id', `New key → id ${id.size + 1}`] : [`New key → id ${id.size}`, 'New key → id 0'], askNew + (isNew ? 0 : 1));
          if (q) askNew++;
        }
        const k = getId(e);
        if (isNew) owner[k] = name;
        snap(isNew ? `"${show(e)}" is not in the Map yet → it gets id ${k} (= id.size before the insert). Account ${acc} owns it.` : `"${show(e)}" is already in the Map with id ${k} — the shared key is what links account ${acc} to the earlier account.`, { [k]: 'active' }, acc);
        attach(frames, q);
        if (j === 0) {
          first = k;
          return;
        }
        const ra = find(first);
        const rb = find(k);
        let uq;
        if (askUnion < 2 && step >= 3) {
          const opts = ['Different roots → link them', 'Same root → nothing to do'];
          uq = pick(`union(${first}, ${k}): ${first} is the account's first email. Roots: link or already together?`, opts[ra === rb ? 1 : 0], [opts[ra === rb ? 0 : 1]], askUnion + 1);
          if (uq) askUnion++;
        }
        if (ra === rb) {
          snap(`union(${first}, ${k}): both already have root ${ra} → same person, nothing to do.`, { [first]: 'visited', [k]: 'visited' }, acc);
        } else {
          let big = ra;
          let small = rb;
          if (size[big] < size[small]) [big, small] = [small, big];
          parent[small] = big;
          size[big] += size[small];
          groups--;
          snap(`union(${first}, ${k}): roots ${ra} and ${rb} differ → attach root ${small} under ${big} (smaller group under bigger). groups = ${groups}.`, { [first]: 'visited', [k]: 'visited', [big]: 'done' }, acc);
        }
        attach(frames, uq);
      });
    });
    const byRoot = new Map();
    for (let i = 0; i < keys.length; i++) {
      const r = find(i);
      if (!byRoot.has(r)) byRoot.set(r, []);
      byRoot.get(r).push(i);
    }
    const merged = [...byRoot.values()].map((ids) => ({ name: owner[ids[0]], emails: ids.map((i) => keys[i]).sort() }));
    const cnt = merged.length;
    const fq = pick(`All emails are processed and groups = ${groups}. How many merged accounts are returned?`, cnt, [cnt + 1, cnt > 1 ? cnt - 1 : cnt + 2, accs.length], 2);
    const states = {};
    for (let i = 0; i < keys.length; i++) states[i] = 'done';
    frames.push({
      note: `Group the emails by find(id) and sort each group: ${cnt} merged account(s), named after the account that first owned the group. O(E·α(E) + E log E) for E emails.`,
      panels: [
        forestPanel(total, parent, { created: keys.length, states, label: 'DSU over email ids (child → parent)' }),
        { kind: 'table', label: 'merged accounts', rowLabels: merged.map((m) => m.name), colLabels: ['emails'], cells: merged.map((m) => [m.emails.map(show).join(' ')]) },
        vars({ account: '—', ids: id.size, groups }),
      ],
    });
    attach(frames, fq);
    return frames;
  },
};

/* ------------------------------------------------------------------ weighted DSU: evaluate division */
export const ufEvaluateDivision = {
  title: 'Weighted Union Find: evaluate division',
  description:
    'weight[x] = value(x) / value(parent[x]). find() walks to the root, multiplies the weights and re-points x straight at the root; union(a, b, k) links root(a) under root(b) with weight k·w[b]/w[a]. A query x / y in one group is w[x] / w[y], otherwise −1. Clamped to 6 equations, 8 variables and 5 queries; equations whose value is not a positive number are dropped, and an equation between two variables already in one group is skipped.',
  defaultInput: {
    equations: [['a', 'b'], ['b', 'c'], ['d', 'c'], ['a', 'c'], ['x', 'y']],
    values: [2, 3, 0.5, 6, 4],
    queries: [['a', 'c'], ['d', 'a'], ['a', 'x'], ['b', 'e'], ['b', 'b']],
  },
  fields: [
    { key: 'equations', type: 'json', label: 'equations [a, b]' },
    { key: 'values', type: 'numbers', label: 'values (a / b)' },
    { key: 'queries', type: 'json', label: 'queries [x, y]' },
  ],
  testInputs: [
    { equations: [], values: [], queries: [] },
    { equations: [], values: [], queries: [['a', 'a']] },
    { equations: [['a', 'b']], values: [2], queries: [['b', 'a'], ['a', 'z']] },
    { equations: [['a', 'b'], ['a', 'b'], ['b', 'a']], values: [2, 2, 0.5], queries: [['a', 'b']] },
    { equations: [['a', 'b'], ['c', 'd'], ['b', 'c']], values: [1.5, 2, 0], queries: [['a', 'd'], ['c', 'd']] },
    { equations: [['p', 'q'], ['q', 'r'], ['r', 's'], ['s', 't'], ['t', 'u'], ['u', 'v'], ['v', 'w']], values: [2, 2, 2, 2, 2, 2, 2], queries: [['p', 'v'], ['v', 'p']] },
  ],
  generate({ equations, values, queries }) {
    const E = Array.isArray(equations) ? equations : [];
    const V = Array.isArray(values) ? values : [];
    const eqs = [];
    const names = new Set();
    let dropped = 0;
    E.forEach((e, i) => {
      const k = Number(V[i]);
      if (eqs.length >= 6 || !Array.isArray(e) || e.length < 2 || !Number.isFinite(k) || k <= 0) return void dropped++;
      const a = String(e[0]);
      const b = String(e[1]);
      if (names.size + new Set([a, b].filter((x) => !names.has(x))).size > 8) return void dropped++;
      names.add(a);
      names.add(b);
      eqs.push([a, b, k]);
    });
    const allQ = (Array.isArray(queries) ? queries : []).filter((q) => Array.isArray(q) && q.length >= 2);
    const qs = allQ.slice(0, 5).map((q) => [String(q[0]), String(q[1])]);
    const order = [...names];
    const total = order.length;
    const labels = order.map((s) => s.slice(0, 4)); // shortcut: display only; long names may look alike
    const id = new Map();
    const parent = [];
    const weight = [];
    const getId = (s) => {
      if (!id.has(s)) {
        id.set(s, id.size);
        parent.push(parent.length);
        weight.push(1);
      }
      return id.get(s);
    };
    // the pattern's template: recurse to the root, then multiply and re-point
    function find(x) {
      if (parent[x] !== x) {
        const p = parent[x];
        const root = find(p);
        weight[x] *= weight[p];
        parent[x] = root;
      }
      return parent[x];
    }
    const findNote = (x) => {
      const before = [...parent];
      const r = find(x);
      const moved = before.map((p, i) => (p !== parent[i] ? i : -1)).filter((i) => i >= 0);
      return { r, moved };
    };
    const answers = [];
    const frames = [];
    const snap = (note, states = {}, now = '—') =>
      frames.push({
        note,
        panels: [
          forestPanel(total, parent, { created: id.size, states, labels, edgeLabels: weight.map((w) => `×${num(w)}`), label: 'child → parent, label = value(child) / value(parent)' }),
          { kind: 'table', label: 'parent / weight', rowLabels: labels.slice(0, id.size), colLabels: ['parent', 'weight'], cells: parent.map((p, i) => [labels[p], num(weight[i])]), states: parent.map((_, i) => new Array(2).fill(states[i] || '')) },
          arr(answers.map((a) => (a === -1 ? '−1' : num(a))), { label: 'answers' }),
          vars({ step: now }),
        ],
      });
    const clampNote = dropped || allQ.length > 5 ? ` (${dropped} equation(s) dropped, ${Math.max(0, allQ.length - 5)} query(ies) dropped by the limits.)` : '';
    snap(`Each variable gets an id when first seen and starts as its own root with weight 1 (value(x) / value(x) = 1).${clampNote}`);
    let askU = 0;
    let askQ = 0;
    const movedText = (moved) => (moved.length ? ` Path compression: ${moved.map((i) => `${labels[i]} now points at ${labels[parent[i]]} with weight ${num(weight[i])}`).join('; ')}.` : '');
    eqs.forEach(([a, b, k], ei) => {
      const ia = getId(a);
      const ib = getId(b);
      const fa = findNote(ia);
      const fb = findNote(ib);
      const now = `${labels[ia]} / ${labels[ib]} = ${num(k)}`;
      const ra = fa.r;
      const rb = fb.r;
      if (ra === rb) {
        const implied = weight[ia] / weight[ib];
        const same = Math.abs(implied - k) <= 1e-9 * Math.max(1, Math.abs(k));
        snap(`${now}: find gives the same root ${labels[ra]} for both.${movedText([...fa.moved, ...fb.moved])} The group already implies ${labels[ia]} / ${labels[ib]} = w[${labels[ia]}] / w[${labels[ib]}] = ${num(implied)}${same ? ' — consistent, nothing to link.' : ` — this equation contradicts it, so union returns early and it is ignored.`}`, { [ia]: 'visited', [ib]: 'visited', [ra]: 'done' }, now);
        return;
      }
      snap(`${now}: find(${labels[ia]}) = ${labels[ra]} with w = ${num(weight[ia])}; find(${labels[ib]}) = ${labels[rb]} with w = ${num(weight[ib])}. Different roots → we must link them.${movedText([...fa.moved, ...fb.moved])}`, { [ia]: 'active', [ib]: 'active' }, now);
      const wNew = (k * weight[ib]) / weight[ia];
      let q;
      if (askU < 2 && ei >= 1) {
        q = pick(`Link root ${labels[ra]} under ${labels[rb]}. With k = ${num(k)}, w[${labels[ia]}] = ${num(weight[ia])}, w[${labels[ib]}] = ${num(weight[ib])}, what is weight[${labels[ra]}]?`, num(wNew), [num((k * weight[ia]) / weight[ib]), num(k), num(1 / wNew)], askU + 1, 'value(a) = w[a]·value(ra) and value(b) = w[b]·value(rb), so value(ra) / value(rb) = k·w[b] / w[a].');
        if (q) askU++;
      }
      const wa = weight[ia];
      const wb = weight[ib];
      parent[ra] = rb;
      weight[ra] = wNew;
      snap(`parent[${labels[ra]}] = ${labels[rb]} and weight[${labels[ra]}] = k·w[${labels[ib]}] / w[${labels[ia]}] = ${num(k)}·${num(wb)} / ${num(wa)} = ${num(wNew)}. Now every value in the group is a multiple of value(${labels[rb]}).`, { [ra]: 'active', [rb]: 'done' }, now);
      attach(frames, q);
    });
    if (!eqs.length) snap('No usable equations, so no variable is known.');
    qs.forEach(([x, y], qi) => {
      const now = `${x.slice(0, 4)} / ${y.slice(0, 4)} = ?`;
      let res;
      let note;
      let st = {};
      if (!id.has(x) || !id.has(y)) {
        res = -1;
        note = `${now}: ${!id.has(x) ? x.slice(0, 4) : y.slice(0, 4)} never appeared in an equation → −1 (even for x / x).`;
      } else {
        const ix = id.get(x);
        const iy = id.get(y);
        const fx = findNote(ix);
        const fy = findNote(iy);
        st = { [ix]: 'active', [iy]: 'active' };
        if (fx.r !== fy.r) {
          res = -1;
          note = `${now}: roots ${labels[fx.r]} and ${labels[fy.r]} differ — no chain of equations links them → −1.${movedText([...fx.moved, ...fy.moved])}`;
        } else {
          res = weight[ix] / weight[iy];
          note = `${now}: same root ${labels[fx.r]}, so the root cancels: w[${labels[ix]}] / w[${labels[iy]}] = ${num(weight[ix])} / ${num(weight[iy])} = ${num(res)}.${movedText([...fx.moved, ...fy.moved])}`;
          st[fx.r] = 'done';
        }
      }
      let q;
      if (askQ < 3 && (qi === 0 || qi === 2 || qi === 3)) {
        const known = id.has(x) && id.has(y);
        const wrong = known ? [num(weight[id.get(y)] / weight[id.get(x)]), num(weight[id.get(x)] * weight[id.get(y)]), '−1'] : ['1', '0'];
        q = pick(`Query ${now} What is the answer?`, res === -1 ? '−1' : num(res), res === -1 ? (known ? ['1', num(weight[id.get(x)])] : wrong) : wrong, askQ + qi);
        if (q) askQ++;
      }
      answers.push(res);
      snap(note, st, now);
      attach(frames, q);
    });
    snap(`answers = [${answers.map((a) => (a === -1 ? '−1' : num(a))).join(', ')}]. Path compression alone makes each find O(log n) amortized (adding union by size would bring it to near O(1)), and every answer is one division.`, {}, 'done');
    return frames;
  },
};

/* ------------------------------------------------------------------ online DSU: number of islands II */
export const ufIslandsOnline = {
  title: 'Online Union Find: number of islands II',
  description:
    'Land appears one cell at a time. Each new cell is +1 island; each successful union with a land neighbour is −1; the count is recorded after every addition. Cell id = r · cols + c. The grid is clamped to 4 × 4 and the list to 8 positions (positions outside the grid are dropped).',
  defaultInput: { m: 3, n: 3, positions: [[0, 0], [0, 1], [1, 2], [2, 1], [1, 1], [0, 1]] },
  fields: [
    { key: 'm', type: 'number', label: 'rows m' },
    { key: 'n', type: 'number', label: 'cols n' },
    { key: 'positions', type: 'json', label: 'positions [r, c]' },
  ],
  testInputs: [
    { m: 2, n: 2, positions: [] },
    { m: 1, n: 1, positions: [[0, 0]] },
    { m: 2, n: 2, positions: [[0, 0], [0, 0], [1, 1], [9, 9]] },
    { m: 1, n: 4, positions: [[0, 0], [0, 2], [0, 1], [0, 3]] },
    { m: 4, n: 4, positions: [[0, 1], [1, 0], [1, 2], [2, 1], [1, 1], [3, 3], [2, 2], [0, 0]] },
    { m: 9, n: 0, positions: [[0, 0]] },
  ],
  generate({ m, n, positions }) {
    const R = toInt(m, 1, 4, 1);
    const C = toInt(n, 1, 4, 1);
    const all = Array.isArray(positions) ? positions : [];
    const adds = [];
    for (const p of all) {
      if (adds.length >= 8 || !Array.isArray(p)) continue;
      const r = Number(p[0]);
      const c = Number(p[1]);
      if (Number.isInteger(r) && Number.isInteger(c) && r >= 0 && c >= 0 && r < R && c < C) adds.push([r, c]);
    }
    const dropped = all.length - adds.length;
    const total = R * C;
    const parent = Array.from({ length: total }, (_, i) => i);
    const size = new Array(total).fill(1);
    const find = (x) => {
      const r = rootOf(parent, x);
      while (parent[x] !== r) [parent[x], x] = [r, parent[x]];
      return r;
    };
    const union = (a, b) => {
      let ra = find(a);
      let rb = find(b);
      if (ra === rb) return false;
      if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
      parent[rb] = ra;
      size[ra] += size[rb];
      return true;
    };
    const alive = new Array(total).fill(false);
    const out = [];
    let groups = 0;
    const frames = [];
    const snap = (note, hl = {}, cell = '—') => {
      const roots = [];
      const cells = [];
      const states = [];
      for (let r = 0; r < R; r++) {
        cells.push([]);
        states.push([]);
        for (let c = 0; c < C; c++) {
          const i = r * C + c;
          if (!alive[i]) {
            cells[r].push('·');
            states[r].push(hl[i] || 'water');
            continue;
          }
          const root = rootOf(parent, i);
          if (!roots.includes(root)) roots.push(root);
          cells[r].push(root);
          states[r].push(hl[i] || `island-${roots.indexOf(root) % 4}`);
        }
      }
      frames.push({ note, panels: [grid(cells, states, 'land shows its root id (r·cols + c); · = water'), arr([...out], { label: 'answer after each addition' }), vars({ cell, groups })] });
    };
    snap(`${R} × ${C} water, groups = 0. Only cells that are alive (land) take part, so we keep our own counter instead of the DSU's total count.${dropped > 0 ? ` (${dropped} position(s) dropped: outside the grid, malformed or over the limit of 8.)` : ''}`);
    let asks = 0;
    adds.forEach(([r, c], ai) => {
      const i = r * C + c;
      const cell = `(${r}, ${c}) id ${i}`;
      if (alive[i]) {
        let q;
        if (asks < 4) {
          q = pick(`(${r}, ${c}) is added again. What is recorded?`, `${groups} (unchanged)`, [`${groups + 1}`, `${Math.max(groups - 1, 0)}`], asks);
          if (q) asks++;
        }
        out.push(groups);
        snap(`(${r}, ${c}) is already land → nothing changes; record ${groups} again (counting it twice is the classic bug).`, { [i]: 'active' }, cell);
        attach(frames, q);
        return;
      }
      const nbs = DIRS.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C && alive[a * C + b]);
      const rootsNear = new Set(nbs.map(([a, b]) => rootOf(parent, a * C + b)));
      const expect = groups + 1 - rootsNear.size;
      let q;
      if (ai >= 1 && asks < 4 && (nbs.length > 0 || ai === 2)) {
        q = pick(nbs.length ? `(${r}, ${c}) was new land, so groups is ${groups + 1} now. After union() with its land neighbours, what is recorded?` : `Add land at (${r}, ${c}); groups is ${groups} now. What is recorded after this addition?`, expect, [groups + 1, groups, expect - 1 >= 0 ? expect - 1 : groups + 2, groups - nbs.length], asks + 1, 'New land is +1; each union that really merges two different groups is −1.');
        if (q) asks++;
      }
      alive[i] = true;
      groups++;
      if (!nbs.length) {
        out.push(groups);
        snap(`Add (${r}, ${c}): new land → groups++ = ${groups}. No land neighbour, so it is its own island. Record ${groups}.`, { [i]: 'active' }, cell);
        attach(frames, q);
        return;
      }
      snap(`Add (${r}, ${c}): new land → groups++ = ${groups}. It has ${nbs.length} land neighbour(s) to union with.`, { [i]: 'active' }, cell);
      const parts = [];
      for (const [a, b] of nbs) {
        const j = a * C + b;
        if (union(i, j)) {
          groups--;
          parts.push(`(${a}, ${b}) merged → −1`);
        } else parts.push(`(${a}, ${b}) already in the same island → no change`);
      }
      out.push(groups);
      snap(`union with each land neighbour: ${parts.join('; ')}. groups = ${groups}; record it.`, { [i]: 'active' }, cell);
      attach(frames, q);
    });
    snap(adds.length ? `answer = [${out.join(', ')}]. Each addition does ≤ 4 unions, each near O(1) amortized → O(k·α(m·n)) for k additions, plus O(m·n) to set up.` : 'No valid positions → answer = [].');
    return frames;
  },
};

/* ------------------------------------------------------------------ minimax Dijkstra: path with minimum effort */
export const spMinEffort = {
  title: 'Minimax Dijkstra: path with minimum effort',
  description:
    'A path\'s effort is its largest height step. Dijkstra still works with max instead of +: pop the smallest (effort, cell), and for each neighbour try max(d, |height difference|). The first time the bottom-right cell is popped, its effort is the answer. The grid is clamped to 4 × 4 and heights to 0..99.',
  defaultInput: { heights: [[1, 2, 2], [3, 8, 2], [5, 3, 5]] },
  fields: [{ key: 'heights', type: 'json', label: 'heights grid' }],
  testInputs: [
    { heights: [] },
    { heights: [[7]] },
    { heights: [[4, 4, 4, 4]] },
    { heights: [[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]] },
    { heights: [[1, 10, 6, 7], [10, 3, 8, 2], [2, 9, 4, 1], [5, 3, 2, 9]] },
    { heights: [[1, 'x'], [200]] },
  ],
  generate({ heights }) {
    const { g, R, C, clamped } = readGrid(heights, 4, 4, 0, 99);
    const frames = [];
    if (!R) {
      frames.push({ note: 'Empty grid: there is no cell to walk on.', panels: [grid([[' ']], [['muted']], 'heights')] });
      frames.push({ note: 'Nothing to search → effort 0.', panels: [grid([[' ']], [['muted']], 'heights')] });
      return frames;
    }
    const n = R * C;
    const dst = n - 1;
    const best = new Array(n).fill(Infinity);
    const popped = new Array(n).fill(false);
    best[0] = 0;
    let heap = [[0, 0]];
    const rc = (u) => `(${Math.floor(u / C)}, ${u % C})`;
    const sortHeap = () => heap.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const snap = (note, active = -1, extra = {}) => {
      const st = (u) => extra[u] || (u === active ? 'active' : popped[u] ? 'done' : best[u] < Infinity ? 'visited' : '');
      const states = g.map((row, r) => row.map((_, c) => st(r * C + c)));
      frames.push({
        note,
        panels: [
          grid(g.map((row) => [...row]), states, 'heights'),
          grid(g.map((row, r) => row.map((_, c) => (best[r * C + c] === Infinity ? '∞' : best[r * C + c]))), states.map((row) => [...row]), 'best effort to reach each cell'),
          queue(sortHeap().map(([d, u]) => `${d}:${rc(u)}`), 'min-heap (effort:cell)'),
          vars({ target: rc(dst) }),
        ],
      });
    };
    snap(`best[(0, 0)] = 0, every other cell ∞. Push (0, (0, 0)). A path costs its WORST step, so we combine with max, not +.${clamped ? ' (Input clamped to 4 × 4, heights 0..99.)' : ''}`, 0);
    let pops = 0;
    let askPop = 0;
    let askRelax = 0;
    while (heap.length) {
      sortHeap();
      let q;
      const choices = [...new Set(heap.map(([, u]) => u))];
      if (pops >= 1 && askPop < 3 && choices.length >= 2 && (pops % 2 === 1 || askRelax + askPop < 3)) {
        q = pick(`Heap: [${heap.map(([d, u]) => `${d}:${rc(u)}`).join(', ')}]. Which cell is popped next?`, rc(heap[0][1]), choices.slice(1).reverse().map(rc), askPop + 1);
        if (q) askPop++;
      }
      const [d, u] = heap.shift();
      pops++;
      if (u === dst) {
        popped[u] = true;
        snap(`Pop ${d}:${rc(u)} — the target. Every path still in the heap already has effort ≥ ${d}, and extending a path never lowers its max, so the answer is ${d}. O(R·C·log(R·C)).`, -1, { [u]: 'done' });
        attach(frames, q);
        return frames;
      }
      if (d > best[u]) {
        snap(`Pop ${d}:${rc(u)} — stale: best[${rc(u)}] is already ${best[u]}. Skip it.`, u);
        attach(frames, q);
        continue;
      }
      popped[u] = true;
      const r = Math.floor(u / C);
      const c = u % C;
      const parts = [];
      let rq;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const v = nr * C + nc;
        const w = Math.abs(g[nr][nc] - g[r][c]);
        const nd = Math.max(d, w);
        if (!rq && !q && askRelax < 2 && pops >= 2 && new Set([nd, d + w, w]).size === 3 && !popped[v]) {
          rq = pick(`From ${rc(u)} (effort so far ${d}) step to ${rc(v)}: |${g[nr][nc]} − ${g[r][c]}| = ${w}. What effort does this path reach ${rc(v)} with?`, nd, [d + w, w, Math.min(d, w)], askRelax + 2, 'The effort of a path is its largest step: max(d, w), not d + w.');
          if (rq) askRelax++;
        }
        if (nd < best[v]) {
          parts.push(`${rc(v)}: max(${d}, ${w}) = ${nd} < ${best[v] === Infinity ? '∞' : best[v]} → update, push`);
          best[v] = nd;
          heap.push([nd, v]);
        } else if (!popped[v]) parts.push(`${rc(v)}: max(${d}, ${w}) = ${nd} is not better than ${best[v]}`);
      }
      snap(`Pop ${d}:${rc(u)} (smallest effort in the heap). ${parts.length ? parts.join('; ') + '.' : 'No neighbour improves.'}`, u);
      attach(frames, q || rq);
    }
    snap('Heap empty without reaching the target → −1 (cannot happen on a full grid).');
    return frames;
  },
};

/* ------------------------------------------------------------------ state BFS: obstacle elimination */
export const spObstacleElimination = {
  title: 'State BFS: shortest path with k obstacle eliminations',
  description:
    'The node is (row, col, eliminations left). BFS goes level by level; stepping on an obstacle (1) costs one elimination. seen[r][c] keeps the MOST eliminations left we ever had at a cell, so a new state is pushed only if it arrives with more. The grid is clamped to 4 × 4 (non-1 cells count as 0) and k to 0..16; the start cell is never charged.',
  defaultInput: { grid: [[0, 1, 0, 0], [0, 1, 0, 1], [0, 0, 0, 1], [1, 1, 1, 0]], k: 1 },
  fields: [
    { key: 'grid', type: 'json', label: 'grid (1 = obstacle)' },
    { key: 'k', type: 'number', label: 'k' },
  ],
  testInputs: [
    { grid: [], k: 1 },
    { grid: [[0]], k: 0 },
    { grid: [[0, 1, 1], [1, 1, 1], [1, 0, 0]], k: 1 },
    { grid: [[0, 1, 1], [1, 1, 1], [1, 0, 0]], k: 9 },
    { grid: [[0, 0], [0, 0]], k: 0 },
    { grid: [[0, 1, 0, 0, 0], [0, 1, 0, 1, 0], [0, 0, 0, 1, 0]], k: -3 },
  ],
  generate({ grid: raw, k: rawK }) {
    const { g: g0, R, C, clamped } = readGrid(raw, 4, 4, 0, 1);
    const g = g0.map((row) => row.map((v) => (v === 1 ? 1 : 0)));
    const k = toInt(rawK, 0, 16, 0);
    const frames = [];
    if (!R) {
      frames.push({ note: 'Empty grid: there is no start cell.', panels: [grid([[' ']], [['muted']], 'grid')] });
      frames.push({ note: 'No path → −1.', panels: [grid([[' ']], [['muted']], 'grid')] });
      return frames;
    }
    const seen = g.map((row) => row.map(() => -1));
    let frontier = [[0, 0, k]];
    let next = [];
    seen[0][0] = k;
    const key = ([r, c, l]) => `(${r},${c},${l})`;
    const snap = (note, steps, cur, extra = {}) => {
      const states = g.map((row, r) =>
        row.map((v, c) => {
          const tag = `${r},${c}`;
          if (extra[tag]) return extra[tag];
          if (cur && cur[0] === r && cur[1] === c) return 'active';
          if (seen[r][c] < 0) return v ? 'wall' : '';
          return v ? 'bad' : 'visited';
        }),
      );
      const cells = g.map((row, r) => row.map((v, c) => (seen[r][c] >= 0 ? seen[r][c] : v ? '■' : '·')));
      frames.push({
        note,
        panels: [grid(cells, states, 'seen[r][c] = most eliminations left (■ obstacle, · open)'), queue(frontier.map(key), `frontier (steps = ${steps})`), queue(next.map(key), 'next level'), vars({ steps, k })],
      });
    };
    snap(`Start state (0, 0, ${k}): ${k} elimination(s) in hand. Reaching a cell with more eliminations left is a DIFFERENT, better state, so seen[][] stores a count instead of true/false.${clamped || Number(rawK) !== k ? ' (Input clamped.)' : ''}`, 0, [0, 0]);
    let askPush = 0;
    let expanded = 0;
    for (let steps = 0; frontier.length; steps++) {
      next = [];
      const level = frontier;
      for (let fi = 0; fi < level.length; fi++) {
        const [r, c, left] = level[fi];
        frontier = level.slice(fi);
        if (r === R - 1 && c === C - 1) {
          const fq = steps > 0 ? pick('The target state is at the front of the frontier. What does BFS return?', steps, [steps + 1, steps - 1 >= 0 ? steps - 1 : steps + 2, R + C - 2 === steps ? steps + 2 : R + C - 2], 2) : undefined;
          snap(`(${r}, ${c}) is the target, reached at level ${steps} → return ${steps}. BFS levels are step counts, so the first time we pop it is the shortest. O(R·C·(k + 1)) states.`, steps, null, { [`${r},${c}`]: 'done' });
          attach(frames, fq);
          return frames;
        }
        expanded++;
        const parts = [];
        let q;
        for (const [dr, dc] of DIRS) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
          const nl = left - g[nr][nc];
          const verdict = nl < 0 ? 'blocked' : nl <= seen[nr][nc] ? 'dominated' : 'pushed';
          if (!q && askPush < 3 && expanded >= 2 && (verdict !== 'blocked' || askPush === 0) && (g[nr][nc] === 1 || verdict === 'dominated')) {
            const opts = { pushed: `Pushed as (${nr},${nc},${nl})`, dominated: `Pruned: seen[${nr}][${nc}] = ${seen[nr][nc]} ≥ ${nl}`, blocked: 'Blocked: no elimination left' };
            const wrong = Object.keys(opts).filter((x) => x !== verdict).map((x) => (x === 'dominated' && (nl < 0 || seen[nr][nc] < 0) ? `Pruned: (${nr},${nc}) was reached before` : opts[x]));
            q = pick(`From (${r},${c}) with ${left} left, step to (${nr},${nc}) (${g[nr][nc] ? 'obstacle' : 'open'}; seen = ${seen[nr][nc]}). What happens?`, opts[verdict], wrong, askPush + 1, 'nl = left − grid[nr][nc]; push only if nl ≥ 0 and nl beats the best count seen at that cell.');
            if (q) askPush++;
          }
          if (verdict === 'blocked') parts.push(`(${nr},${nc}) needs an elimination, none left`);
          else if (verdict === 'dominated') parts.push(`(${nr},${nc}) with ${nl} left is no better than seen ${seen[nr][nc]} → prune`);
          else {
            parts.push(`(${nr},${nc}) with ${nl} left${seen[nr][nc] >= 0 ? ` beats seen ${seen[nr][nc]} → push again` : ' → push'}`);
            seen[nr][nc] = nl;
            next.push([nr, nc, nl]);
          }
        }
        frontier = level.slice(fi + 1);
        snap(`Level ${steps}: expand (${r},${c},${left}). ${parts.length ? parts.join('; ') + '.' : 'No neighbours.'}`, steps, [r, c]);
        attach(frames, q);
      }
      frontier = next;
      if (next.length) snap(`Level ${steps} done → ${next.length} state(s) form level ${steps + 1}.`, steps + 1, null);
      next = [];
    }
    snap('The frontier is empty and the target was never reached → −1.', -1, null);
    return frames;
  },
};
