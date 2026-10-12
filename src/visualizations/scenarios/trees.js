import { layoutLevelOrderTree, layoutHeap, layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; null if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return null;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const nodeLink = (layout, states = {}, opts = {}) => ({
  kind: 'nodes',
  nodes: layout.nodes.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, state: states[n.id] || '' })),
  edges: layout.edges.map(([a, b]) => ({ from: a, to: b, state: opts.edgeStates?.[`${a}-${b}`] || '' })),
  directed: opts.directed ?? true,
  ...opts,
});

export const treeTraversal = {
  title: 'Tree traversal',
  description: 'Pre-order: node, left, right. In-order: left, node, right. Post-order: left, right, node. Level: BFS by depth.',
  defaultInput: { tree: [1, 2, 3, 4, 5, null, 6], order: 'preorder' },
  fields: [
    { key: 'tree', type: 'json', label: 'tree (level order)' },
    { key: 'order', type: 'select', label: 'order', options: ['preorder', 'inorder', 'postorder', 'level'] },
  ],
  generate({ tree, order }) {
    const layout = layoutLevelOrderTree(tree);
    const frames = [];
    const visited = [];
    const states = {};
    const byId = Object.fromEntries(layout.nodes.map((n) => [n.id, n]));
    const snap = (note, extra = {}) =>
      frames.push({ note, panels: [nodeLink(layout, { ...states, ...extra }), arr([...visited], { label: 'visit order' })] });
    if (!layout.root) return [{ note: 'Empty tree.', panels: [] }];
    if (order === 'level') {
      let level = [layout.root];
      let depth = 0;
      const fmt = (ns) => `[${ns.map((n) => n.val).join(', ')}]`;
      while (level.length) {
        for (const n of level) states[n.id] = 'visited';
        snap(`Queue holds level ${depth}: [${level.map((n) => n.val).join(', ')}]. Visit them left to right.`, Object.fromEntries(level.map((n) => [n.id, 'active'])));
        if (depth === 1 || depth === 2) {
          const kids = level.flatMap((n) => [n.left, n.right].filter(Boolean));
          attach(frames, pick(`Level ${depth - 1} is done. Which nodes does the queue hold for level ${depth} (front → back)?`, fmt(level), [fmt([...level].reverse()), fmt(level.slice(0, 1)), kids.length ? fmt(kids) : fmt(level.slice(1))], depth));
        }
        for (const n of level) {
          visited.push(n.val);
          states[n.id] = 'done';
        }
        const next = [];
        for (const n of level) {
          if (n.left) next.push(n.left);
          if (n.right) next.push(n.right);
        }
        snap(`Level ${depth} done. Enqueue their children.`);
        level = next;
        depth++;
      }
      snap('BFS finished: nodes grouped by depth.');
      return frames;
    }
    const expected = [];
    const pre = (n) => {
      if (!n) return;
      if (order === 'preorder') expected.push(n);
      pre(n.left);
      if (order === 'inorder') expected.push(n);
      pre(n.right);
      if (order === 'postorder') expected.push(n);
    };
    pre(layout.root);
    const askVisit = () => {
      const k = visited.length; // already includes the node just visited
      if (k !== 2 && k !== 4 && k !== 6) return;
      const correct = expected[k - 1];
      const others = [...expected.slice(k), ...expected.slice(0, k - 1)].filter((x) => x !== correct).map((x) => x.val);
      attach(frames, pick(`${order}: visited so far [${visited.slice(0, k - 1).join(', ')}]. Which node is visited next?`, correct.val, others, k / 2));
    };
    const walk = (n, depth) => {
      if (!n) return;
      states[n.id] = 'visited';
      if (order === 'preorder') {
        visited.push(n.val);
        states[n.id] = 'done';
        snap(`Visit ${n.val} FIRST (pre-order), then go left.`, { [n.id]: 'active' });
        askVisit();
      } else snap(`Arrive at ${n.val}. ${order === 'inorder' ? 'Go left before visiting it.' : 'Visit both children before it.'}`, { [n.id]: 'active' });
      walk(n.left, depth + 1);
      if (order === 'inorder') {
        visited.push(n.val);
        states[n.id] = 'done';
        snap(`Left subtree of ${n.val} done → visit ${n.val}, then go right.`, { [n.id]: 'active' });
        askVisit();
      }
      walk(n.right, depth + 1);
      if (order === 'postorder') {
        visited.push(n.val);
        states[n.id] = 'done';
        snap(`Both subtrees of ${n.val} done → visit ${n.val} LAST (post-order).`, { [n.id]: 'active' });
        askVisit();
      }
    };
    walk(byId[0], 0);
    snap(`${order} complete: [${visited.join(', ')}]. Each node visited once → O(n).`);
    return frames;
  },
};

export const heapOperations = {
  title: 'Min-heap: push and pop',
  description: 'Push: add at the end, sift up. Pop: move last to root, sift down.',
  defaultInput: { nums: [5, 3, 8, 1, 9, 2] },
  fields: [{ key: 'nums', type: 'numbers', label: 'values to insert' }],
  generate({ nums }) {
    const h = [];
    const frames = [];
    const snap = (note, states = {}) => frames.push({ note, panels: [nodeLink(layoutHeap(h), states, { directed: false }), arr([...h], { label: 'array storage', highlights: states })] });
    let upAsks = 0;
    let downAsked = false;
    const upOpts = ['Swap up with the parent', 'Stop — heap property holds'];
    for (const x of nums) {
      h.push(x);
      let i = h.length - 1;
      snap(`Push ${x}: place it at the end (index ${i}) to keep the tree complete.`, { [i]: 'active' });
      while (i > 0) {
        const p = (i - 1) >> 1;
        const stop = h[p] <= h[i];
        const q = upAsks < 3 ? pick(`Sift up: ${h[i]} at index ${i}, its parent is ${h[p]} (index ${p}). Swap up or stop?`, upOpts[stop ? 1 : 0], [upOpts[stop ? 0 : 1]], upAsks + 1) : null;
        upAsks++;
        if (stop) {
          snap(`Parent ${h[p]} ≤ ${h[i]} → heap property holds. Stop.`, { [i]: 'done', [p]: 'visited' });
          attach(frames, q);
          break;
        }
        [h[p], h[i]] = [h[i], h[p]];
        snap(`Parent was bigger → swap up (index ${i} ↔ ${p}).`, { [p]: 'active', [i]: 'visited' });
        attach(frames, q);
        i = p;
      }
    }
    const out = [];
    for (let t = 0; t < Math.min(3, nums.length); t++) {
      const top = h[0];
      const last = h.pop();
      out.push(top);
      if (h.length) {
        h[0] = last;
        snap(`Pop min = ${top}. Move the last element (${last}) to the root.`, { 0: 'active' });
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < h.length && h[l] < h[m]) m = l;
          if (r < h.length && h[r] < h[m]) m = r;
          if (m === i) {
            snap(`${h[i]} is ≤ both children → done. Height is log n, so this is O(log n).`, { [i]: 'done' });
            break;
          }
          let q = null;
          if (!downAsked && r < h.length) {
            downAsked = true;
            q = pick(`Sift down: ${h[i]} is at index ${i}; its children are ${h[l]} (left) and ${h[r]} (right). Which child do we swap with?`, m === l ? `Left child (${h[l]})` : `Right child (${h[r]})`, [m === l ? `Right child (${h[r]})` : `Left child (${h[l]})`, 'Neither — stop here'], 2);
          }
          [h[i], h[m]] = [h[m], h[i]];
          snap(`Swap down with the smaller child (${h[i]}).`, { [m]: 'active', [i]: 'visited' });
          attach(frames, q);
          i = m;
        }
      } else snap(`Pop min = ${top}. Heap is empty.`);
    }
    frames.push({ note: `Popped in order: ${out.join(', ')} — always the smallest first.`, panels: [nodeLink(layoutHeap(h), {}, { directed: false }), arr(out, { label: 'popped' })] });
    return frames;
  },
};

export const trieInsert = {
  title: 'Trie: inserting words',
  description: 'Each edge is a character; shared prefixes share nodes. ● marks the end of a word.',
  defaultInput: { words: ['car', 'cat', 'cart', 'dog', 'do'] },
  fields: [{ key: 'words', type: 'strings', label: 'words' }],
  generate({ words }) {
    let nextId = 1;
    const root = { id: 0, label: '∅', children: [], map: new Map(), end: false };
    const frames = [];
    const build = (states) => {
      const toTree = (n) => ({ id: n.id, label: n.label + (n.end ? ' ●' : ''), children: [...n.map.values()].map(toTree) });
      const layout = layoutNary(toTree(root));
      return nodeLink(layout, states);
    };
    let reuseAsks = 0;
    let createAsks = 0;
    words.forEach((w, wi) => {
      let node = root;
      const path = { 0: 'visited' };
      for (const ch of w) {
        const exists = node.map.has(ch);
        let q = null;
        if (wi > 0 && (exists ? reuseAsks < 2 : createAsks < 2)) {
          if (exists) reuseAsks++;
          else createAsks++;
          q = pick(`Inserting "${w}": at node '${node.label}', does a child '${ch}' already exist?`, exists ? `Yes — reuse the existing '${ch}'` : `No — create a new node '${ch}'`, [exists ? `No — create a new node '${ch}'` : `Yes — reuse the existing '${ch}'`], reuseAsks + createAsks);
        }
        let created = false;
        if (!node.map.has(ch)) {
          node.map.set(ch, { id: nextId++, label: ch, map: new Map(), end: false });
          created = true;
        }
        node = node.map.get(ch);
        path[node.id] = 'visited';
        frames.push({ note: `"${w}": ${created ? `create node '${ch}'` : `'${ch}' already exists — reuse the shared prefix`}.`, panels: [build({ ...path, [node.id]: created ? 'active' : 'done' })] });
        attach(frames, q);
      }
      node.end = true;
      frames.push({ note: `Mark the end of "${w}" (●). Insert cost = O(word length).`, panels: [build({ ...path, [node.id]: 'done' })] });
    });
    return frames;
  },
};

export const backtrackingSubsets = {
  title: 'Backtracking: subsets (include / exclude)',
  description: 'At each element choose: include it or not. Leaves are the subsets.',
  defaultInput: { nums: [1, 2, 3] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 4)' }],
  generate({ nums }) {
    nums = nums.slice(0, 4);
    let id = 0;
    const root = { id: id++, label: '[]', children: [] };
    const frames = [];
    const results = [];
    const all = [];
    // Build the full decision tree first (layout needs it), reveal progressively.
    const build = (node, i, path) => {
      all.push({ node, i, path });
      if (i === nums.length) return;
      const inc = { id: id++, label: `[${[...path, nums[i]].join(',')}]`, children: [] };
      const exc = { id: id++, label: `[${path.join(',')}]`, children: [] };
      node.children.push(inc, exc);
      inc.meta = { choice: `include ${nums[i]}` };
      exc.meta = { choice: `exclude ${nums[i]}` };
      build(inc, i + 1, [...path, nums[i]]);
      build(exc, i + 1, path);
    };
    build(root, 0, []);
    const layout = layoutNary(root);
    const seen = new Set();
    const pathStack = [];
    let backAsks = 0;
    const draw = (active, note) => {
      const states = {};
      for (const n of layout.nodes) states[n.id] = seen.has(n.id) ? 'visited' : 'hidden';
      for (const p of pathStack) states[p] = 'active';
      states[active] = 'active';
      for (const r of results) states[r.id] = 'done';
      frames.push({ note, panels: [nodeLink(layout, states), arr(results.map((r) => r.label), { label: 'subsets found' })] });
    };
    const dfs = (node, i, path) => {
      seen.add(node.id);
      pathStack.push(node.id);
      if (i === nums.length) {
        results.push({ id: node.id, label: `[${path.join(',')}]` });
        draw(node.id, `No elements left → record subset [${path.join(', ')}]. Then UNDO the last choice and go back up.`);
      } else {
        draw(node.id, `Path = [${path.join(', ')}]. Decide about ${nums[i]}: include it first (choose → explore).`);
        dfs(node.children[0], i + 1, [...path, nums[i]]);
        draw(node.id, `Back at [${path.join(', ')}] — ${nums[i]} was removed (undo). Now explore excluding ${nums[i]}.`);
        if (backAsks < 3) attach(frames, pick(`All subsets that include ${nums[i]} (on top of [${path.join(', ')}]) are done. Back at [${path.join(', ')}] — what now?`, `Undo ${nums[i]} and explore excluding it`, ['Stop — this branch is finished', `Include ${nums[i]} again`], backAsks++));
        dfs(node.children[1], i + 1, path);
      }
      pathStack.pop();
    };
    dfs(root, 0, []);
    frames.push({ note: `All ${results.length} = 2^${nums.length} subsets generated. Each level doubles the branches → O(2ⁿ · n).`, panels: [nodeLink(layout, Object.fromEntries(layout.nodes.map((n) => [n.id, results.some((r) => r.id === n.id) ? 'done' : 'visited']))), arr(results.map((r) => r.label), { label: 'subsets' })] });
    return frames;
  },
};
