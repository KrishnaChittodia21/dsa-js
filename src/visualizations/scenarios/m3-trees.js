// Pattern animations for tree recursion: top-down state (good nodes), path backtracking (path sum II),
// lowest common ancestor, serialize/deserialize with null markers, BST validation with (low, high) bounds,
// and bottom-up subtree info (maximum-sum BST in a binary tree).

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
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
const INF = Infinity;
const fmt = (v) => (v === INF ? '+∞' : v === -INF ? '−∞' : v == null ? 'null' : v < 0 ? `−${-v}` : String(v));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toVal = (v) => {
  if (v == null || v === '' || typeof v === 'boolean') return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), -99, 999) : null;
};

// Level-order array → nodes [{id, val, left, right, depth, x, y}] (left/right are ids). Keeps at most
// maxNodes nodes and maxDepth + 1 levels so the drawing fits a phone. ids are in level order.
function buildTree(raw, maxNodes = 11, maxDepth = 3) {
  const a = (Array.isArray(raw) ? raw : []).map(toVal);
  if (!a.length || a[0] == null) return { nodes: [], root: null, trimmed: a.some((v) => v != null) };
  const nodes = [{ id: 0, val: a[0], left: null, right: null, depth: 0 }];
  const q = [0];
  let h = 0;
  let i = 1;
  while (h < q.length && i < a.length) {
    const n = nodes[q[h++]];
    for (const side of ['left', 'right']) {
      if (i < a.length && a[i] != null && n.depth < maxDepth && nodes.length < maxNodes) {
        const c = { id: nodes.length, val: a[i], left: null, right: null, depth: n.depth + 1 };
        nodes.push(c);
        n[side] = c.id;
        q.push(c.id);
      }
      i++;
    }
  }
  placeNodes(nodes, 0);
  return { nodes, root: 0, trimmed: a.filter((v) => v != null).length > nodes.length };
}
// x = in-order position, y = depth.
function placeNodes(nodes, root) {
  let x = 0;
  const walk = (id, d) => {
    if (id == null) return;
    walk(nodes[id].left, d + 1);
    nodes[id].x = x++;
    nodes[id].y = d;
    walk(nodes[id].right, d + 1);
  };
  walk(root, 0);
}
const treePanel = (nodes, states = {}, labels = {}, label, edgeStates = {}, hideMissing = false) => ({
  kind: 'nodes',
  nodes: nodes.map((n) => ({ id: n.id, label: labels[n.id] ?? fmt(n.val), x: n.x, y: n.y, state: states[n.id] || (hideMissing ? 'hidden' : '') })),
  edges: nodes.flatMap((n) => [n.left, n.right].filter((c) => c != null).map((c) => ({ from: n.id, to: c, state: edgeStates[c] || '' }))),
  directed: true,
  label,
});
const levelOrderOf = (nodes, root) => {
  if (root == null) return '[]';
  const out = [];
  const q = [root];
  for (let h = 0; h < q.length; h++) {
    const id = q[h];
    if (id == null) {
      out.push('null');
      continue;
    }
    out.push(fmt(nodes[id].val));
    q.push(nodes[id].left, nodes[id].right);
  }
  while (out[out.length - 1] === 'null') out.pop();
  return `[${out.join(', ')}]`;
};
const trimNote = (T, max) => (T.trimmed ? ` (Input trimmed to ${max} nodes / 4 levels.)` : '');
const emptyFrames = (what, answer, v = {}, result = null) => [
  { note: `The tree is empty (root = null). ${what}`, panels: [vars(v)] },
  { note: `Nothing to visit, so the answer is ${answer}.`, panels: [vars({ ...v, answer })], result },
];

/* ------------------------------------------------------------------ top-down: count good nodes */
export const treeGoodNodes = {
  problem: { name: 'Count Good Nodes in Binary Tree', statement: 'A node is good if no node on the path from the root to it has a larger value. Count the good nodes.', example: '[3, 1, 4, 3, null, 1, 5] → 4', exampleOutput: 4, questionId: 'count-good-nodes-in-binary-tree' },
  title: 'Top-down: count good nodes',
  description: 'A node is good if no node on the path from the root to it is bigger. maxSoFar flows DOWN as a parameter. Trees are trimmed to 11 nodes / 4 levels.',
  defaultInput: { tree: [3, 1, 4, 3, null, 1, 5] },
  fields: [{ key: 'tree', type: 'json', label: 'tree (level order)' }],
  testInputs: [{ tree: [] }, { tree: [7] }, { tree: [1, 2, null, 3, null, 4] }, { tree: [2, 2, 2, 2, 2] }, { tree: [5, 4, 6, 3, null, null, 1, 9, 8] }, { tree: [3, 3, null, 4, 2] }],
  generate({ tree }) {
    const T = buildTree(tree);
    if (!T.nodes.length) return emptyFrames('countGood(null) never calls dfs on a real node.', 0, { count: 0 }, 0);
    const { nodes } = T;
    const frames = [];
    const states = {};
    const labels = {};
    const calls = [];
    let count = 0;
    let k = 0;
    const snap = (note, cur, v) => frames.push({ note, panels: [treePanel(nodes, cur == null ? states : { ...states, [cur]: 'active' }, labels, '✓ good · ✗ not good'), vars({ ...v, count }), stack([...calls], 'call stack')] });
    snap(`Count good nodes. Start with dfs(root, −∞): nothing is above the root, so it is always good.${trimNote(T, 11)}`, null, { maxSoFar: '−∞' });
    const dfs = (id, m) => {
      if (id == null) return;
      const n = nodes[id];
      calls.push(`dfs(${fmt(n.val)}, ${fmt(m)})`);
      const good = n.val >= m;
      const next = Math.max(m, n.val);
      let q;
      if (k === 1 || k === 3 || k === 5) q = pick(`dfs(${fmt(n.val)}, maxSoFar = ${fmt(m)}). Is node ${fmt(n.val)} good?`, good ? 'Yes — count it' : 'No — skip it', [good ? 'No — skip it' : 'Yes — count it'], k);
      else if (k === 2 || k === 4) q = pick(`Node ${fmt(n.val)} arrives with maxSoFar = ${fmt(m)}. Which maxSoFar does it pass to its children?`, fmt(next), [fmt(m), fmt(Math.min(m, n.val)), '−∞', fmt(n.val + 1)], k);
      k++;
      if (good) count++;
      states[id] = good ? 'done' : 'bad';
      labels[id] = `${fmt(n.val)} ${good ? '✓' : '✗'}`;
      snap(
        `Arrive at ${fmt(n.val)} with maxSoFar = ${fmt(m)}. ${good ? `${fmt(n.val)} ≥ ${fmt(m)} → good, count = ${count}.` : `${fmt(n.val)} < ${fmt(m)}, a bigger node is above → not good.`} Pass max(${fmt(m)}, ${fmt(n.val)}) = ${fmt(next)} down.`,
        id,
        { node: fmt(n.val), maxSoFar: fmt(m), 'node ≥ max?': good ? 'yes' : 'no', 'pass down': fmt(next) },
      );
      attach(frames, q);
      dfs(n.left, next);
      dfs(n.right, next);
      calls.pop();
    };
    dfs(0, -INF);
    snap(`Done: ${count} good node${count === 1 ? '' : 's'}. The answer needed only what lies ABOVE each node, so it travelled down as a parameter. Each node once → O(n) time, O(h) stack.`, null, { answer: count });
    frames.at(-1).result = count;
    return frames;
  },
};

/* ------------------------------------------------------------------ path backtracking: path sum II */
export const treePathSumII = {
  problem: { name: 'Path Sum II', statement: 'Return every root-to-leaf path whose values add up to the target.', example: 'target = 22 on the default tree → [[5, 4, 11, 2], [5, 8, 4, 5]]', exampleOutput: [[5, 4, 11, 2], [5, 8, 4, 5]], questionId: 'path-sum-ii' },
  title: 'Path sum II: push, record, pop',
  description: 'One shared path array: push the node on entry, record a copy at a leaf whose remaining sum is 0, pop on return. Trees are trimmed to 11 nodes / 4 levels.',
  defaultInput: { tree: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, 5, 1], target: 22 },
  fields: [
    { key: 'tree', type: 'json', label: 'tree (level order)' },
    { key: 'target', type: 'number', label: 'target' },
  ],
  testInputs: [{ tree: [], target: 0 }, { tree: [1], target: 1 }, { tree: [1], target: 2 }, { tree: [1, 2, null, 3, null, 4], target: 10 }, { tree: [1, 1, 1, 1, 1, 1, 1], target: 3 }, { tree: [-2, null, -3], target: -5 }],
  generate({ tree, target }) {
    const T = buildTree(tree);
    target = clamp(Math.round(Number(target) || 0), -9999, 9999);
    if (!T.nodes.length) return emptyFrames('dfs(null) returns at once.', '[] (no paths)', { target }, []);
    const { nodes } = T;
    const frames = [];
    const states = {};
    const path = [];
    const pathIds = [];
    const result = [];
    let asks = 0;
    let leaves = 0;
    let pops = 0;
    const snap = (note, rem) => {
      const st = { ...states };
      for (const id of pathIds) st[id] = st[id] === 'done' ? 'done' : 'active';
      const v = { target, remaining: rem };
      result.forEach((p, i) => (v[`path ${i + 1}`] = p.map(fmt).join('→')));
      if (!result.length) v.found = 'none yet';
      frames.push({ note, panels: [treePanel(nodes, st, {}, 'current path = highlighted'), arr(path.map(fmt), { label: 'path (shared array)', highlights: path.length ? { [path.length - 1]: 'active' } : {} }), vars(v)] });
    };
    snap(`Find every root-to-leaf path that sums to ${target}. Start with an empty path and remaining = ${target}.${trimNote(T, 11)}`, target);
    const dfs = (id, rem) => {
      if (id == null) return;
      const n = nodes[id];
      path.push(n.val);
      pathIds.push(id);
      rem -= n.val;
      const leaf = n.left == null && n.right == null;
      if (leaf) {
        const hit = rem === 0;
        if (hit) {
          result.push([...path]);
          states[id] = 'done';
        }
        leaves++;
        const q = asks < 5 && leaves <= 3 ? pick(`Push leaf ${fmt(n.val)}: remaining becomes ${fmt(rem)}. Is the path recorded?`, hit ? 'Yes — push a copy of path' : 'No — remaining is not 0', [hit ? 'No — remaining is not 0' : 'Yes — push a copy of path'], leaves) : undefined;
        snap(`Push ${fmt(n.val)} → path [${path.map(fmt).join(', ')}], remaining ${fmt(rem)}. It is a leaf and ${hit ? 'remaining = 0 → record a COPY of path.' : `remaining ≠ 0 → do not record.`}`, rem);
        if (q) asks++;
        attach(frames, q);
      } else {
        snap(`Push ${fmt(n.val)} (choose) → path [${path.map(fmt).join(', ')}], remaining = ${fmt(rem)}. Not a leaf, so explore its children.`, rem);
      }
      dfs(n.left, rem);
      dfs(n.right, rem);
      path.pop();
      pathIds.pop();
      if (states[id] !== 'done') states[id] = 'visited';
      const after = `[${path.map(fmt).join(', ')}]`;
      let q;
      if (!leaf && asks < 5 && pops < 2) {
        pops++;
        q = pick(`Both subtrees of ${fmt(n.val)} are finished. What is path after the undo step?`, after, [`[${[...path, n.val].map(fmt).join(', ')}]`, `[${path.slice(0, -1).map(fmt).join(', ')}]`, '[]'], pops + 1);
        if (q) asks++;
      }
      snap(`${leaf ? `Leaf ${fmt(n.val)} has no children.` : `Both children of ${fmt(n.val)} are done.`} Pop ${fmt(n.val)} (undo) → path back to ${after}, exactly what the parent had.`, rem + n.val);
      attach(frames, q);
    };
    dfs(0, target);
    const done = {};
    for (const id of Object.keys(states)) done[id] = states[id] === 'done' ? 'done' : 'visited';
    frames.push({
      note: `Found ${result.length} path${result.length === 1 ? '' : 's'}: ${result.length ? result.map((p) => `[${p.map(fmt).join(', ')}]`).join(', ') : 'none'}. One shared array with push/pop uses O(h) memory; copying a path at each valid leaf costs O(h).`,
      panels: [treePanel(nodes, done, {}, 'green leaf = end of a found path'), arr([], { label: 'path (shared array)' }), vars({ target, answer: result.length ? result.map((p) => p.map(fmt).join('→')).join(' | ') : '[]' })],
      result,
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ lowest common ancestor */
export const treeLcaRecursive = {
  problem: { name: 'Lowest Common Ancestor of a Binary Tree', statement: 'Find the deepest node that has both p and q in its subtree (a node counts as its own descendant).', example: 'tree [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p = 6, q = 4 → 5', exampleOutput: 5, questionId: 'lowest-common-ancestor-of-a-binary-tree' },
  title: 'Lowest common ancestor (recursive)',
  description: 'Each call returns p or q if it found one, the LCA if it found both, else null. The first node where both sides are non-null is the LCA. p and q are values; with duplicates the first match in level order is used. Trees are trimmed to 11 nodes / 4 levels.',
  defaultInput: { tree: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 6, q: 4 },
  fields: [
    { key: 'tree', type: 'json', label: 'tree (level order)' },
    { key: 'p', type: 'number', label: 'p' },
    { key: 'q', type: 'number', label: 'q' },
  ],
  testInputs: [{ tree: [], p: 1, q: 2 }, { tree: [1], p: 1, q: 1 }, { tree: [1, 2, null, 3, null, 4], p: 4, q: 2 }, { tree: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 4 }, { tree: [2, 2, 2], p: 2, q: 2 }, { tree: [1, 2, 3], p: 2, q: 9 }],
  generate({ tree, p, q }) {
    const T = buildTree(tree);
    const pv = toVal(p);
    const qv = toVal(q);
    if (!T.nodes.length) return emptyFrames('lowestCommonAncestor(null, p, q) returns null.', 'null', { p: fmt(pv), q: fmt(qv) });
    const { nodes } = T;
    const P = nodes.find((n) => n.val === pv)?.id ?? null; // nodes are in level order
    const Q = nodes.find((n) => n.val === qv)?.id ?? null;
    const frames = [];
    const states = {};
    const labels = {};
    const edges = {};
    if (P != null) labels[P] = `${fmt(nodes[P].val)} p`;
    if (Q != null) labels[Q] = P === Q ? `${fmt(nodes[Q].val)} pq` : `${fmt(nodes[Q].val)} q`;
    const name = (id) => (id == null ? 'null' : id === P && id === Q ? `${fmt(nodes[id].val)} (p=q)` : id === P ? `${fmt(nodes[id].val)} (p)` : id === Q ? `${fmt(nodes[id].val)} (q)` : fmt(nodes[id].val));
    const snap = (note, cur, v) => frames.push({ note, panels: [treePanel(nodes, cur == null ? states : { ...states, [cur]: 'active' }, labels, 'green = returned non-null', edges), vars({ p: fmt(pv), q: fmt(qv), ...v })] });
    snap(`Find the LCA of p = ${fmt(pv)} and q = ${fmt(qv)}. Each call reports back: p or q if it found one, the LCA if it found both, null if nothing.${P == null || Q == null ? ' Warning: one value is not in the tree — the template assumes both exist.' : ''}${trimNote(T, 11)}`, null, {});
    let asks = 0;
    let lca = null;
    const rec = (id) => {
      if (id == null) return null;
      const n = nodes[id];
      if (id === P || id === Q) {
        states[id] = 'done';
        snap(`Node ${name(id)} is ${id === P ? 'p' : 'q'} itself → return it at once. No need to look below: if the other one is down there, this node is the answer anyway.`, id, { node: fmt(n.val), returns: name(id) });
        return id;
      }
      const leaf = n.left == null && n.right == null;
      if (!leaf) snap(`At ${fmt(n.val)}: not p or q. Ask the left subtree, then the right subtree.`, id, { node: fmt(n.val) });
      const L = rec(n.left);
      const R = rec(n.right);
      let ret;
      let why;
      if (L != null && R != null) {
        ret = id;
        lca = lca ?? id;
        why = `left and right are BOTH non-null → p and q are on different sides, so ${fmt(n.val)} is the LCA. Return ${fmt(n.val)}.`;
        labels[id] = `${fmt(n.val)} ★`;
      } else if (L != null || R != null) {
        ret = L ?? R;
        why = `only the ${L != null ? 'left' : 'right'} side found something → pass ${name(ret)} up unchanged.`;
      } else {
        ret = null;
        why = leaf ? `${fmt(n.val)} is a leaf and not p or q: both children return null → return null.` : 'both sides returned null → return null.';
      }
      states[id] = ret == null ? 'muted' : 'done';
      if (ret != null) edges[id] = 'done';
      const opts = [name(id), name(L), name(R), 'null'];
      let qn;
      if (asks < 4 && (!leaf || asks === 0)) {
        qn = pick(`At ${fmt(n.val)}: left returned ${name(L)}, right returned ${name(R)}. What does ${fmt(n.val)} return?`, name(ret), opts, asks + 1);
        if (qn) asks++;
      }
      snap(leaf ? why : `Back at ${fmt(n.val)}: ${why}`, id, { node: fmt(n.val), left: name(L), right: name(R), returns: name(ret) });
      attach(frames, qn);
      return ret;
    };
    const ans = rec(0);
    const found = (P != null) + (Q != null && Q !== P);
    const final = {};
    for (const nd of nodes) final[nd.id] = nd.id === ans ? 'done' : nd.id === P || nd.id === Q ? 'visited' : 'muted';
    frames.push({
      note: ans == null ? 'The root returned null: neither p nor q is in the tree. Each node visited at most once → O(n) time, O(h) stack.' : P == null || Q == null ? `The root returned ${name(ans)}, but only one of p, q exists — the "nodes may be missing" variation counts found nodes (${found}) before trusting this. O(n) time.` : `LCA(${fmt(pv)}, ${fmt(qv)}) = ${fmt(nodes[ans].val)}. ${lca == null ? 'One target sits inside the other\'s subtree, so the higher one was passed all the way up.' : 'It is the lowest node where both sides reported something.'} Each node visited at most once → O(n) time, O(h) stack.`,
      panels: [treePanel(nodes, final, labels, 'answer = green'), vars({ p: fmt(pv), q: fmt(qv), answer: ans == null ? 'null' : fmt(nodes[ans].val) })],
      result: ans == null ? null : nodes[ans].val,
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ serialize / deserialize (preorder + '#') */
const tokenRows = (tokens, highlights = {}, ptr = null, label = 'tokens') => {
  if (tokens.length <= 10) return [arr([...tokens], { label, highlights, pointers: ptr != null && ptr < tokens.length ? [{ index: ptr, label: 'i', color: 'a' }] : [] })];
  const rows = [];
  for (let s = 0; s < tokens.length; s += 8) {
    const hl = {};
    for (let j = s; j < Math.min(s + 8, tokens.length); j++) if (highlights[j]) hl[j - s] = highlights[j];
    rows.push(arr(tokens.slice(s, s + 8), { label: s === 0 ? label : `${label} (cont.)`, highlights: hl, indexBase: s, pointers: ptr != null && ptr >= s && ptr < s + 8 ? [{ index: ptr - s, label: 'i', color: 'a' }] : [] }));
  }
  return rows;
};

export const treeSerializePreorder = {
  problem: { name: 'Serialize and Deserialize Binary Tree', statement: 'Turn a binary tree into a string and rebuild exactly the same tree from that string.', example: '[1, 2, 3, null, null, 4, 5] → "1,2,#,#,3,4,#,#,5,#,#"', exampleOutput: '1,2,#,#,3,4,#,#,5,#,#', questionId: 'serialize-and-deserialize-binary-tree' },
  title: 'Serialize & deserialize (preorder + #)',
  description: 'Preorder that writes # for every missing child, then the same preorder reads the tokens back and rebuilds the exact shape. Trees are trimmed to 7 nodes / 4 levels so the token list fits.',
  defaultInput: { tree: [1, 2, 3, null, null, 4, 5] },
  fields: [{ key: 'tree', type: 'json', label: 'tree (level order)' }],
  testInputs: [{ tree: [] }, { tree: [9] }, { tree: [1, null, 2, null, 3, null, 4] }, { tree: [2, 2, 2, 2] }, { tree: [-10, 20, -30, null, 40, 50, null, 6] }],
  generate({ tree }) {
    const T = buildTree(tree, 7, 3);
    const { nodes } = T;
    const frames = [];
    const out = [];
    const states = {};
    let asks = 0;
    const s1 = (note, cur) => frames.push({ note, panels: [treePanel(nodes, cur == null ? states : { ...states, [cur]: 'active' }, {}, 'original tree'), ...tokenRows(out, out.length ? { [out.length - 1]: 'active' } : {}, null, 'out')] });
    if (!nodes.length) {
      return [
        { note: 'The tree is empty. serialize(null): dfs(null) writes a single "#".', panels: [vars({ root: 'null' })] },
        { note: 'Serialized string = "#". deserialize("#") reads "#" → returns null: the empty tree round-trips.', panels: [arr(['#'], { label: 'tokens', highlights: { 0: 'done' } }), vars({ answer: '"#" → null' })], result: '#' },
      ];
    }
    s1(`Serialize with preorder: write the node's value, then serialize left, then right. A missing child writes "#" so the shape is kept.${trimNote(T, 7)}`, null);
    const ser = (id, where) => {
      if (id == null) {
        out.push('#');
        let q;
        if (asks === 0) {
          q = pick(`dfs reaches ${where}, which is empty. What gets written?`, '"#" — a null marker', ['Nothing — skip it', 'The parent value again', '"0"'], 1);
          asks++;
        }
        s1(`${where[0].toUpperCase()}${where.slice(1)} is null → write "#". Without it we could not tell where the subtree ends.`, null);
        attach(frames, q);
        return;
      }
      const n = nodes[id];
      out.push(String(fmt(n.val)));
      states[id] = 'done';
      let q;
      if (asks === 1 && id !== 0 && out.length > 4) {
        q = pick(`After writing [${out.slice(0, -1).join(', ')}], which token comes next?`, fmt(n.val), ['#', ...nodes.filter((m) => m.id !== id && !states[m.id]).map((m) => fmt(m.val))], 2);
        asks++;
      }
      s1(`Visit ${fmt(n.val)}: write "${fmt(n.val)}" first (preorder), then serialize its left child.`, id);
      attach(frames, q);
      ser(n.left, `the left child of ${fmt(n.val)}`);
      ser(n.right, `the right child of ${fmt(n.val)}`);
    };
    ser(0, 'the root');
    const tokens = [...out];
    frames.push({ note: `Serialized: "${tokens.join(',')}" — ${nodes.length} values + ${nodes.length + 1} "#" = ${tokens.length} tokens. Now deserialize: read tokens left to right with the same preorder.`, panels: [treePanel(nodes, {}, {}, 'original tree'), ...tokenRows(tokens, {}, 0)] });

    // Deserialize: parse first (layout needs the final shape), then reveal node by node.
    const built = [];
    const events = [];
    let i = 0;
    const parse = (parent, side) => {
      const t = tokens[i++];
      if (t === '#') {
        events.push({ i: i - 1, nul: true, parent, side });
        return null;
      }
      const id = built.length;
      built.push({ id, val: Number(t.replace('−', '-')), left: null, right: null });
      events.push({ i: i - 1, id, parent, side });
      built[id].left = parse(id, 'left');
      built[id].right = parse(id, 'right');
      return id;
    };
    parse(null, null);
    placeNodes(built, 0);
    const shown = {};
    const where = (e) => (e.parent == null ? 'the root' : `the ${e.side} child of ${fmt(built[e.parent].val)}`);
    let prevNull = false;
    events.forEach((e) => {
      const hl = {};
      for (let j = 0; j < e.i; j++) hl[j] = 'muted';
      hl[e.i] = 'active';
      let q;
      if (e.nul && asks === 2) {
        q = pick(`build() reads token ${e.i}: "#". What does this call return?`, 'null — no node here', [`A node with value 0`, 'It skips the token and reads the next one'], 0);
        asks++;
      } else if (!e.nul && prevNull && e.parent != null && asks === 3) {
        const opts = built.filter((b) => shown[b.id] != null).flatMap((b) => [`the left child of ${fmt(b.val)}`, `the right child of ${fmt(b.val)}`]);
        q = pick(`Token ${e.i} is "${tokens[e.i]}". Where does the new node go?`, where(e), opts, 3);
        asks++;
      }
      if (!e.nul) shown[e.id] = 'done';
      const st = { ...shown };
      if (!e.nul) st[e.id] = 'active';
      frames.push({
        note: e.nul ? `Token ${e.i} is "#" → ${where(e)} is null; build() returns and its parent moves on.` : `Token ${e.i} is "${tokens[e.i]}" → create ${fmt(built[e.id].val)} as ${where(e)}, then build its left child from the next token.`,
        panels: [treePanel(built, st, {}, 'rebuilt tree', {}, true), ...tokenRows(tokens, hl, e.i)],
      });
      attach(frames, q);
      prevNull = !!e.nul;
    });
    const same = levelOrderOf(built, 0) === levelOrderOf(nodes, 0);
    frames.push({
      note: `All ${tokens.length} tokens used. Rebuilt tree in level order: ${levelOrderOf(built, 0)} — ${same ? 'identical to the original' : 'MISMATCH'}. Both directions touch each token once → O(n).`,
      panels: [treePanel(built, Object.fromEntries(built.map((b) => [b.id, 'done'])), {}, 'rebuilt tree'), ...tokenRows(tokens, Object.fromEntries(tokens.map((_, j) => [j, 'done']))), vars({ answer: `"${tokens.join(',')}" → ${levelOrderOf(built, 0)}` })],
      result: tokens.join(','),
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ BST: validate with (low, high) bounds */
export const bstValidateBounds = {
  problem: { name: 'Validate Binary Search Tree', statement: 'Decide whether every node is greater than everything in its left subtree and smaller than everything in its right subtree.', example: '[5, 3, 8, 1, 6, null, 9] → false (6 sits left of 5)', exampleOutput: false, questionId: 'validate-binary-search-tree' },
  title: 'Validate a BST with (low, high) bounds',
  description: 'Every node must lie strictly inside the open range inherited from its ancestors: going left tightens high, going right tightens low. Trees are trimmed to 11 nodes / 4 levels.',
  defaultInput: { tree: [5, 3, 8, 1, 6, null, 9] },
  fields: [{ key: 'tree', type: 'json', label: 'tree (level order)' }],
  testInputs: [{ tree: [] }, { tree: [4] }, { tree: [8, 4, 12, 2, 6, 10, 14] }, { tree: [2, 2, 2] }, { tree: [1, null, 2, null, 3, null, 4] }, { tree: [10, 5, 15, null, null, 6, 20] }],
  generate({ tree }) {
    const T = buildTree(tree);
    if (!T.nodes.length) return emptyFrames('valid(null) returns true: an empty tree is a valid BST.', 'true', {}, true);
    const { nodes } = T;
    const frames = [];
    const states = {};
    const labels = {};
    const calls = [];
    let asks = 0;
    let k = 0;
    const snap = (note, cur, v) => frames.push({ note, panels: [treePanel(nodes, cur == null ? states : { ...states, [cur]: 'active' }, labels, '✓ inside its range · ✗ outside'), vars(v), stack([...calls], 'call stack')] });
    snap(`Is this a valid BST? Call valid(root, −∞, +∞): the root may hold any value.${trimNote(T, 11)}`, null, { low: '−∞', high: '+∞' });
    const range = (lo, hi) => `(${fmt(lo)}, ${fmt(hi)})`;
    const valid = (id, lo, hi, parentNote) => {
      if (id == null) return true;
      const n = nodes[id];
      calls.push(`valid(${fmt(n.val)}, ${fmt(lo)}, ${fmt(hi)})`);
      const ok = !(n.val <= lo || n.val >= hi);
      let q;
      if (k >= 1 && asks < 4) {
        if (k % 2 === 1) q = pick(`${parentNote}. Which range must ${fmt(n.val)} lie in?`, range(lo, hi), [range(-INF, INF), lo === -INF ? range(hi, INF) : range(-INF, lo), hi === INF ? range(-INF, lo) : range(lo, INF)], asks + 1);
        else q = pick(`Node ${fmt(n.val)} must lie in ${range(lo, hi)}. Does it pass?`, ok ? 'Yes — inside the range' : 'No — outside → return false', [ok ? 'No — outside → return false' : 'Yes — inside the range'], asks + 1);
        if (q) asks++;
      }
      k++;
      states[id] = ok ? 'visited' : 'bad';
      labels[id] = `${fmt(n.val)} ${ok ? '✓' : '✗'}`;
      snap(ok ? `${fmt(n.val)} lies inside ${range(lo, hi)} ✓. Left child gets ${range(lo, n.val)}, right child gets ${range(n.val, hi)}.` : `${fmt(n.val)} is NOT inside ${range(lo, hi)} → return false. ${n.val <= lo ? `It must be > ${fmt(lo)} because an ancestor ${fmt(lo)} has it in its RIGHT subtree.` : `It must be < ${fmt(hi)} because an ancestor ${fmt(hi)} has it in its LEFT subtree.`}`, id, { node: fmt(n.val), low: fmt(lo), high: fmt(hi), inside: ok ? 'yes' : 'no' });
      attach(frames, q);
      if (!ok) {
        calls.pop();
        return false;
      }
      const L = valid(n.left, lo, n.val, `Going LEFT from ${fmt(n.val)} (range ${range(lo, hi)})`);
      if (!L) {
        let q2;
        if (asks < 5 && n.right != null) {
          q2 = pick(`valid(${fmt(n.val)}) got false from its left subtree. Does it still check the right subtree?`, 'No — && stops, return false', ['Yes — check every node', 'Yes, but only the right child'], asks);
          if (q2) asks++;
        }
        calls.pop();
        snap(`Left subtree of ${fmt(n.val)} is invalid → && short-circuits: return false without touching the right subtree.`, id, { node: fmt(n.val), left: 'false', returns: 'false' });
        attach(frames, q2);
        return false;
      }
      const R = valid(n.right, n.val, hi, `Going RIGHT from ${fmt(n.val)} (range ${range(lo, hi)})`);
      calls.pop();
      if (n.left == null && n.right == null) {
        snap(`${fmt(n.val)} is a leaf: both null children return true → valid(${fmt(n.val)}) returns true.`, id, { node: fmt(n.val), returns: 'true' });
      } else {
        snap(`Back at ${fmt(n.val)}: left is valid, right is ${R ? 'valid' : 'invalid'} → return ${R}.`, id, { node: fmt(n.val), left: 'true', right: String(R), returns: String(R) });
      }
      return R;
    };
    const ans = valid(0, -INF, INF, '');
    for (const n of nodes) if (!states[n.id]) states[n.id] = 'muted';
    snap(ans ? 'valid(root) = true: every node sat inside the range set by ALL its ancestors. O(n) time, O(h) stack.' : `valid(root) = false. Grey nodes were never checked — the first violation ends the search. Note: a parent/child-only check can miss this (each node is checked against ALL ancestors here). O(n) time, O(h) stack.`, null, { answer: String(ans) });
    frames.at(-1).result = ans;
    return frames;
  },
};

/* ------------------------------------------------------------------ BST: bottom-up info (max-sum BST) */
export const bstMaxSumBottomUp = {
  problem: { name: 'Maximum Sum BST in Binary Tree', statement: 'Find the largest sum of keys of any subtree that is itself a valid BST.', example: 'the default tree → 20', exampleOutput: 20, questionId: 'maximum-sum-bst-in-binary-tree' },
  title: 'Max-sum BST: bottom-up (isBST, min, max, sum)',
  description: 'Post-order: each subtree returns [isBST, min, max, sum]; a node is a BST root iff both children are and left.max < val < right.min. Trees are trimmed to 11 nodes / 4 levels.',
  defaultInput: { tree: [1, 4, 3, 2, 4, 2, 5, null, null, null, null, null, null, 4, 6] },
  fields: [{ key: 'tree', type: 'json', label: 'tree (level order)' }],
  testInputs: [{ tree: [] }, { tree: [-4] }, { tree: [4, 3, null, 1, 2] }, { tree: [-4, -2, -5] }, { tree: [2, 1, 3] }, { tree: [5, 5, 5, 5] }, { tree: [1, null, 2, null, 3, null, 4] }],
  generate({ tree }) {
    const T = buildTree(tree);
    if (!T.nodes.length) return emptyFrames('dfs(null) returns [true, +∞, −∞, 0]; the best sum stays 0 (the empty BST counts).', 0, { best: 0 }, 0);
    const { nodes } = T;
    const frames = [];
    const states = {};
    const labels = {};
    let best = 0;
    let bestId = null;
    let k = 0;
    let asks = 0;
    const tup = (t) => `[${t[0] ? 'T' : 'F'}, ${fmt(t[1])}, ${fmt(t[2])}, ${fmt(t[3])}]`;
    const snap = (note, cur, v) => frames.push({ note, panels: [treePanel(nodes, cur == null ? states : { ...states, [cur]: 'active' }, labels, '✓ BST subtree · ✗ not a BST'), vars({ ...v, best })] });
    snap(`Find the maximum sum of any subtree that is a BST. Post-order: each child returns [isBST, min, max, sum]; an empty child returns [T, +∞, −∞, 0] so any parent passes.${trimNote(T, 11)}`, null, {});
    const dfs = (id) => {
      if (id == null) return [true, INF, -INF, 0];
      const n = nodes[id];
      const l = dfs(n.left);
      const r = dfs(n.right);
      const ok = l[0] && r[0] && l[2] < n.val && n.val < r[1];
      const ret = ok ? [true, Math.min(l[1], n.val), Math.max(r[2], n.val), l[3] + n.val + r[3]] : [false, -INF, INF, 0];
      let q;
      const isLeaf = n.left == null && n.right == null;
      if (k >= 1 && asks < 4 && (!isLeaf || k === 1)) {
        if (!ok || asks % 2 === 0) q = pick(`Node ${fmt(n.val)}: left returned ${tup(l)}, right returned ${tup(r)}. Is the subtree at ${fmt(n.val)} a BST?`, ok ? 'Yes' : 'No', [ok ? 'No' : 'Yes'], asks + k);
        else if (ok) q = pick(`Node ${fmt(n.val)} passes the check (left sum ${fmt(l[3])}, right sum ${fmt(r[3])}). Which tuple does it return?`, tup(ret), [tup([true, n.val, n.val, n.val]), tup([true, l[1], r[2], l[3] + r[3]]), tup([false, -INF, INF, 0])], asks + 3);
        if (q) asks++;
      }
      k++;
      let why;
      if (ok) {
        const improved = ret[3] > best;
        if (improved) {
          best = ret[3];
          bestId = id;
        }
        why = `both children are BSTs and ${fmt(l[2])} < ${fmt(n.val)} < ${fmt(r[1])} → BST with sum ${fmt(ret[3])}${improved ? `, new best = ${best}` : ` (best stays ${best})`}.`;
      } else if (!l[0] || !r[0]) {
        why = `the ${!l[0] ? 'left' : 'right'} child is not a BST → ${fmt(n.val)} cannot be one either. Return poison [F, −∞, +∞, 0].`;
      } else {
        why = `${l[2] < n.val ? `${fmt(n.val)} is not < right.min ${fmt(r[1])}` : `left.max ${fmt(l[2])} is not < ${fmt(n.val)}`} → not a BST. Return poison [F, −∞, +∞, 0] so no ancestor can be a BST.`;
      }
      states[id] = ok ? 'done' : 'bad';
      labels[id] = `${fmt(n.val)} ${ok ? '✓' : '✗'}`;
      snap(`${n.left == null && n.right == null ? `Leaf ${fmt(n.val)}: both children are empty, so ` : `At ${fmt(n.val)}: `}${why}`, id, { node: fmt(n.val), left: tup(l), right: tup(r), returns: tup(ret) });
      attach(frames, q);
      return ret;
    };
    dfs(0);
    const fin = {};
    const mark = (id) => {
      if (id == null) return;
      fin[id] = 'done';
      mark(nodes[id].left);
      mark(nodes[id].right);
    };
    mark(bestId);
    for (const n of nodes) if (!fin[n.id]) fin[n.id] = 'muted';
    frames.push({
      note: bestId == null ? `No BST subtree has a positive sum, so the answer is 0 (the empty BST counts). One post-order pass, O(1) per node → O(n).` : `Answer = ${best}: the BST rooted at ${fmt(nodes[bestId].val)} (green). One post-order pass with O(1) work per node → O(n) instead of O(n²).`,
      panels: [treePanel(nodes, fin, labels, 'best BST subtree = green'), vars({ answer: best })],
      result: best,
    });
    return frames;
  },
};
