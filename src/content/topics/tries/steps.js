// Step lessons for Tries (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every node created, walk, count, DFS branch, XOR choice and grid result below comes from running the lesson's code on the example words.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const letters = (w) => w.split('');
// frames reused inside a turn's `then` drop `say` (it would point at another step's lines)
const bare = (fs) => fs.map(({ say, ...f }) => f);
// a table that reveals its rows one by one: k = row being revealed now
const reveal = (rows, cols, k, label) =>
  table(rows.map((r) => r[0]), cols, rows.map((r, i) => (i <= k ? r.slice(1) : r.slice(1).map(() => '?'))), rows.map((r, i) => r.slice(1).map(() => (i === k ? 'active' : i < k ? 'done' : ''))), label);

// ---------- the trie from the lesson (Map children, isEnd, count) ----------
// node ids are '^' + the prefix the node spells, so every id is unique and readable
class TrieNode {
  constructor(id, ch) {
    this.id = id;
    this.ch = ch;
    this.children = new Map();
    this.isEnd = false;
    this.count = 0;
  }
}
const newRoot = () => new TrieNode('^', 'root');
/** insert from the template; returns { made: ids created, path: ids walked } */
function insert(root, word) {
  let node = root;
  const made = [];
  const path = [];
  for (const ch of word) {
    if (!node.children.has(ch)) {
      node.children.set(ch, new TrieNode(node.id + ch, ch));
      made.push(node.id + ch);
    }
    node = node.children.get(ch);
    node.count++;
    path.push(node.id);
  }
  node.isEnd = true;
  return { made, path, node };
}
const build = (words) => {
  const root = newRoot();
  words.forEach((w) => insert(root, w));
  return root;
};
/** #walk from the template; failAt = index of the first missing character (or -1) */
function walk(root, s) {
  let node = root;
  const path = [];
  for (let i = 0; i < s.length; i++) {
    node = node.children.get(s[i]);
    if (!node) return { node: null, path, failAt: i };
    path.push(node.id);
  }
  return { node, path, failAt: -1 };
}
const nodesOf = (root, out = []) => {
  out.push(root);
  for (const c of root.children.values()) nodesOf(c, out);
  return out;
};
const countNodes = (root) => nodesOf(root).length - 1; // not counting the root

// snapshot so a frame keeps the trie as it was at that moment
const snap = (n) => n.kids ? n : ({ id: n.id, ch: n.ch, isEnd: n.isEnd, count: n.count, word: n.word, kids: [...n.children.values()].map(snap) });
const kidsOf = (n) => n.kids ?? [...n.children.values()];
// leaves left to right, a parent over the middle of its children, y = depth
function layoutOf(root) {
  let leaf = 0;
  const pos = {};
  const place = (n, d) => {
    const ks = kidsOf(n);
    const x = ks.length ? ks.map((k) => place(k, d + 1)).reduce((a, b) => a + b, 0) / ks.length : leaf++;
    pos[n.id] = { x, y: d };
    return x;
  };
  place(root, 0);
  return pos;
}
/** A nodes panel of a trie. st: { id: state }. path: ids whose incoming edge glows. layout from the final trie keeps nodes still. */
function trieP(root, { st = {}, path = [], layout, label, nodeLabel, edgeLabel } = {}) {
  const t = snap(root);
  const pos = layout || layoutOf(t);
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const go = (n, parent) => {
    seen.add(n.id);
    const s = st[n.id] || '';
    const lab = nodeLabel ? nodeLabel(n) : n.id === '^' ? 'root' : n.ch + (n.isEnd ? '*' : '');
    nodes.push({ id: n.id, label: lab, x: pos[n.id].x, y: pos[n.id].y, ...(s ? { state: s } : {}) });
    if (parent) {
      const es = path.includes(n.id) ? 'active' : s === 'muted' ? 'muted' : '';
      edges.push({ from: parent.id, to: n.id, ...(es ? { state: es } : {}), ...(edgeLabel ? { label: edgeLabel(n) } : {}) });
    }
    n.kids.forEach((k) => go(k, n));
  };
  go(t, null);
  // nodes not created yet (or deleted) stay as hidden placeholders so the picture does not jump
  for (const [id, p] of Object.entries(pos)) if (!seen.has(id)) nodes.push({ id, label: '', x: p.x, y: p.y, state: 'hidden' });
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const stOf = (pairs) => Object.fromEntries(pairs.flatMap(([ids, s]) => ids.map((id) => [id, s])));
const wordP = (w, opts = {}) => arr(letters(w), { showIndices: true, ...opts });

// insert words one at a time; one frame per word: reused path visited, new nodes active
function insertFrames(words, { say, layout, extra } = {}) {
  const root = newRoot();
  return {
    root,
    frames: words.map((w) => {
      const { made, path } = insert(root, w);
      const reused = path.filter((id) => !made.includes(id));
      const end = path.at(-1);
      return {
        say: typeof say === 'function' ? say(w, made) : say,
        note: `Insert "${w}": ${reused.length ? `reuse ${reused.map((id) => id.slice(-1)).join(', ')}` : 'nothing to reuse'}; ${made.length ? `create ${made.map((id) => id.slice(-1)).join(', ')}` : 'create nothing'}. Mark ${end.slice(-1)}*.`,
        panels: [
          trieP(root, { st: { ...stOf([[reused, 'visited'], [made, 'active']]) }, path, layout }),
          wordP(w, { label: `"${w}"`, highlights: hl(w.length, (i) => (made.includes(path[i]) ? 'active' : 'visited')) }),
          ...(extra ? [extra(root)] : []),
        ],
      };
    }),
  };
}

// ---------- what ----------
const WHAT_WORDS = ['car', 'cat', 'cart', 'dog'];
const WHAT_FINAL = build([...WHAT_WORDS, 'cow']);
const WHAT_LAYOUT = layoutOf(WHAT_FINAL);
const WHAT = insertFrames(WHAT_WORDS, { say: (w, made) => (made.length === w.length ? 0 : 1), layout: WHAT_LAYOUT });
const WHAT_N = countNodes(WHAT.root); // 8
const WHAT_CA = walk(WHAT.root, 'ca');
const WHAT_COW = build([...WHAT_WORDS, 'cow']);
const WHAT_COW_N = countNodes(WHAT_COW); // 10
const WHAT_COW_MADE = insert(build(WHAT_WORDS), 'cow').made.length; // 2

// ---------- why ----------
const WHY_WORDS = ['car', 'cat', 'cart', 'dog'];
const WHY = build(WHY_WORDS);
const WHY_P = 'ca';
const WHY_PREFIXES = [...new Set(WHY_WORDS.flatMap((w) => Array.from({ length: w.length }, (_, i) => w.slice(0, i + 1))))];
const WHY_PREFIX_CHARS = WHY_PREFIXES.reduce((s, p) => s + p.length, 0);
const whyScan = WHY_WORDS.map((w, k) => ({
  say: 0,
  note: `Check "${w}".startsWith("${WHY_P}"): ${w.startsWith(WHY_P)}.${k === WHY_WORDS.length - 1 ? ` ${WHY_WORDS.length} words checked: the work grows with n.` : ''}`,
  panels: [arr(WHY_WORDS, { label: 'scan every word', showIndices: false, highlights: hl(WHY_WORDS.length, (i) => (i === k ? 'active' : i < k ? (WHY_WORDS[i].startsWith(WHY_P) ? 'done' : 'bad') : '')) }), vars({ p: WHY_P, checked: k + 1 })],
}));
const whyWalk = (() => {
  const { path } = walk(WHY, WHY_P);
  const frames = path.map((id, i) => ({
    say: 1,
    note: `Follow edge "${WHY_P[i]}". ${i === path.length - 1 ? `Done in ${path.length} steps, however many words are stored.` : ''}`.trim(),
    panels: [trieP(WHY, { st: { ...stOf([[path.slice(0, i), 'visited']]), [id]: 'active' }, path: path.slice(0, i + 1) }), vars({ p: WHY_P, steps: i + 1 })],
  }));
  const node = walk(WHY, WHY_P).node;
  const below = nodesOf(node).filter((n) => n.isEnd).map((n) => n.id.slice(1));
  frames.push({
    say: 3,
    note: `The "${WHY_P}" node is a handle: every word below it (${below.join(', ')}) starts with "${WHY_P}". Keep walking from here to type more.`,
    panels: [trieP(WHY, { st: { ...stOf([[nodesOf(node).map((n) => n.id).filter((id) => id !== node.id), 'done']]), [node.id]: 'active' }, path })],
  });
  return frames;
})();

// ---------- when / recognize ----------
const WHEN_ROWS = [
  ['prefix query', 'walk'],
  ['wildcard .', 'DFS'],
  ['max XOR', 'binary trie'],
  ['grid / stream', 'guides search'],
  ['exact only', 'Set'],
];
const FLAVOURS = ['prefix', 'DFS', 'binary', 'guided'];
const flavourP = (st = {}) => arr(FLAVOURS, { label: 'trie flavour', highlights: st });

// ---------- intuition: to, tea, then insert ten ----------
const INT_WORDS = ['to', 'tea', 'ten', 'in', 'inn'];
const INT_LAYOUT = layoutOf(build(INT_WORDS));
const INT = build(['to', 'tea', 'in', 'inn']);
const intInsert = (() => {
  const frames = [];
  const w = 'ten';
  let node = INT;
  const path = [];
  for (const ch of w) {
    const had = node.children.has(ch);
    if (!had) node.children.set(ch, new TrieNode(node.id + ch, ch));
    node = node.children.get(ch);
    node.count++;
    path.push(node.id);
    frames.push({
      say: 1,
      note: had ? `"${ch}" already exists: walk into it.` : `No "${ch}" child: create it and move in.`,
      panels: [trieP(INT, { st: { ...stOf([[path.slice(0, -1), 'visited']]), [node.id]: 'active' }, path, layout: INT_LAYOUT }), wordP(w, { label: 'insert "ten"', pointers: [ptr(path.length - 1, 'ch')], highlights: hl(w.length, (i) => (i < path.length - 1 ? 'visited' : i === path.length - 1 ? (had ? 'visited' : 'active') : '')) })],
    });
  }
  node.isEnd = true;
  frames.push({ say: 1, note: 'Last character: set isEnd. "ten" shares t, e with "tea", then branches.', panels: [trieP(INT, { st: { ...stOf([[path, 'visited']]), [node.id]: 'done' }, path, layout: INT_LAYOUT }), wordP(w, { label: 'insert "ten"', highlights: hl(3, () => 'done') })] });
  return frames;
})();
const searchFrames = (root, s, { say, layout, label, op = 'search' }) => {
  const r = walk(root, s);
  const frames = [];
  r.path.forEach((id, i) =>
    frames.push({ say, note: `"${s[i]}" exists: move in.`, panels: [trieP(root, { st: { ...stOf([[r.path.slice(0, i), 'visited']]), [id]: 'active' }, path: r.path.slice(0, i + 1), layout }), wordP(s, { label: label || `${op}("${s}")`, pointers: [ptr(i, 'ch')], highlights: hl(s.length, (k) => (k <= i ? 'visited' : '')) })] }),
  );
  if (r.failAt >= 0) {
    const at = r.path.at(-1) || '^';
    frames.push({ say, note: `No "${s[r.failAt]}" child under "${at.slice(1) || 'root'}": ${op} returns false.`, panels: [trieP(root, { st: { ...stOf([[r.path, 'visited']]), [at]: 'bad' }, path: r.path, layout }), wordP(s, { label: label || `${op}("${s}")`, pointers: [ptr(r.failAt, 'ch')], highlights: hl(s.length, (k) => (k < r.failAt ? 'visited' : k === r.failAt ? 'bad' : '')) })] });
  }
  return { frames, ...r };
};
const INT_TAN = searchFrames(INT, 'tan', { say: 2, layout: INT_LAYOUT });
const INT_TE = searchFrames(INT, 'te', { say: 3, layout: INT_LAYOUT, op: 'startsWith' });
INT_TE.frames.at(-1).note += ' The walk completed: startsWith returns true.';
const INT_TONE = walk(INT, 'tone'); // fails at index 2

// ---------- brute force: search suggestions ----------
const BF_PRODUCTS = ['bag', 'bat', 'bath', 'bed', 'bee'];
const BF_WORD = 'bat';
const bfBrute = (() => {
  const sorted = [...BF_PRODUCTS].sort();
  const out = [];
  let checks = 0;
  const frames = [];
  for (let i = 1; i <= BF_WORD.length; i++) {
    const p = BF_WORD.slice(0, i);
    checks += sorted.length;
    const got = sorted.filter((w) => w.startsWith(p)).slice(0, 3);
    out.push(got);
    frames.push({
      say: i === 1 ? 0 : 1,
      note: `Prefix "${p}": check all ${sorted.length} words${i > 1 ? ' again' : ''} → ${got.join(', ')}.`,
      panels: [arr(sorted, { label: `filter startsWith("${p}")`, showIndices: false, highlights: hl(sorted.length, (k) => (sorted[k].startsWith(p) ? (got.includes(sorted[k]) ? 'done' : 'visited') : 'muted')) }), vars({ prefix: p, checks })],
    });
  }
  return { frames, checks, out };
})();
// trie where each node keeps the 3 smallest words passing through it
const BF_TRIE = (() => {
  const root = newRoot();
  for (const w of [...BF_PRODUCTS].sort()) {
    let node = root;
    for (const ch of w) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode(node.id + ch, ch));
      node = node.children.get(ch);
      node.top3 ??= [];
      if (node.top3.length < 3) node.top3.push(w); // words arrive sorted, so the first 3 are the smallest
    }
    node.isEnd = true;
  }
  return root;
})();
const bfTrieRun = (word) => {
  const out = [];
  const steps = [];
  let node = BF_TRIE;
  for (const ch of word) {
    node = node && node.children.get(ch);
    out.push(node ? node.top3 : []);
    steps.push(node ? node.id : null);
  }
  return { out, steps };
};
const BF_RUN = bfTrieRun(BF_WORD);
const bfTrieFrames = BF_RUN.steps.map((id, i) => ({
  say: i === 0 ? 2 : 3,
  note: `Type "${BF_WORD[i]}": move one edge to "${id.slice(1)}", push its top3: ${BF_RUN.out[i].join(', ')}.`,
  panels: [trieP(BF_TRIE, { st: { ...stOf([[BF_RUN.steps.slice(0, i), 'visited']]), [id]: 'active' }, path: BF_RUN.steps.slice(0, i + 1) }), arr(BF_RUN.out[i], { label: 'node.top3', showIndices: false, highlights: hl(BF_RUN.out[i].length, () => 'done') }), vars({ typed: BF_WORD.slice(0, i + 1), steps: i + 1 })],
}));
const BF_BATS = bfTrieRun('bats');

// ---------- optimized: counts on nodes (node shows count, edge shows letter) ----------
const OPT_WORDS = ['to', 'tea', 'ten', 'in'];
const OPT_LAYOUT = layoutOf(build([...OPT_WORDS, 'tin']));
const cntLabel = (n) => (n.id === '^' ? 'root' : String(n.count));
const letterEdge = (n) => n.ch;
const optP = (root, opts = {}) => trieP(root, { layout: OPT_LAYOUT, nodeLabel: cntLabel, edgeLabel: letterEdge, ...opts, st: { ...stOf([[nodesOf(root).filter((n) => n.isEnd).map((n) => n.id), 'done']]), ...(opts.st || {}) } });
const OPT = newRoot();
const optInsert = OPT_WORDS.map((w) => {
  const { made, path } = insert(OPT, w);
  return {
    say: 0,
    note: `Insert "${w}": count++ on ${path.map((id) => id.slice(1)).join(', ')}${made.length ? ` (new: ${made.map((id) => id.slice(1)).join(', ')})` : ''}. isEnd on "${w}".`,
    panels: [optP(OPT, { st: stOf([[path, 'active']]), path, label: 'node = count · edge = letter · orange = isEnd' })],
  };
});
optInsert[optInsert.length - 1].say = 1;
const OPT_TE = walk(OPT, 'te');
const OPT_IN = walk(OPT, 'in');
const OPT_DEPTH1 = [...OPT.children.values()].map((n) => n.count);
const OPT_TIN = insert(build(OPT_WORDS), 'tin');

// ---------- template: Array(26) children ----------
class Node26 {
  constructor(id) {
    this.id = id;
    this.next = new Array(26).fill(null);
    this.isEnd = false;
  }
}
const idx = (ch) => ch.charCodeAt(0) - 97;
// view a Node26 trie as Map-children nodes so trieP can draw it
const view26 = (n, ch = 'root') => {
  const v = new TrieNode(n.id, ch);
  v.isEnd = n.isEnd;
  n.next.forEach((c, i) => c && v.children.set(String.fromCharCode(97 + i), view26(c, String.fromCharCode(97 + i))));
  return v;
};
const SLOT_LETTERS = 'abcdefgh'.split('');
const slotsP = (node, hi = {}, label) => arr(SLOT_LETTERS.map((l, i) => (node.next[i] ? l : '·')), { label: label || `next[0..7] of ${node.id === '^' ? 'root' : `"${node.id.slice(1)}"`} (a–h)`, highlights: hi });
const T26_LAYOUT = layoutOf(view26((() => {
  const r = new Node26('^');
  for (const w of ['bad', 'ace', 'bag', 'ba']) {
    let node = r;
    for (const ch of w) node = node.next[idx(ch)] ??= new Node26(node.id + ch);
    node.isEnd = true;
  }
  return r;
})()));
const T26 = new Node26('^');
function insert26Frames(root, word, say) {
  const frames = [];
  let node = root;
  const path = [];
  for (const ch of word) {
    const i = idx(ch);
    const had = node.next[i] !== null;
    const parent = node;
    node = node.next[i] ??= new Node26(node.id + ch); // the lesson's one-liner
    path.push(node.id);
    frames.push({
      say: had ? say[1] : say[0],
      note: `idx("${ch}") = ${i}. Slot ${i} ${had ? 'already holds a node: ??= keeps it' : 'is null: ??= creates a node'}, then move in.`,
      panels: [trieP(view26(root), { st: { ...stOf([[path.slice(0, -1), 'visited']]), [node.id]: had ? 'visited' : 'active' }, path, layout: T26_LAYOUT }), slotsP(parent, { [i]: had ? 'visited' : 'active' }), vars({ ch, i })],
    });
  }
  node.isEnd = true;
  return frames;
}
const T26_BAD = insert26Frames(T26, 'bad', [2, 2]);
const T26_ACE = insert26Frames(T26, 'ace', [2, 2]);
T26_ACE[0].say = 1;
const T26_BA = T26.next[idx('b')].next[idx('a')];

// ---------- implementation: DFS depth over a trie ----------
const IMP = build(['car', 'cart', 'dog']);
const impFrames = (() => {
  const frames = [];
  const stack = [];
  const words = [];
  let maxDepth = 0;
  const dfs = (node) => {
    for (const child of node.children.values()) {
      stack.push(child.id);
      maxDepth = Math.max(maxDepth, stack.length);
      if (child.isEnd) words.push(child.id.slice(1));
      frames.push({
        say: stack.length === 4 ? 1 : 0,
        note: `Enter "${child.id.slice(1)}": depth ${stack.length}.${child.isEnd ? ` A word ends here: "${child.id.slice(1)}".` : ''}`,
        panels: [trieP(IMP, { st: { ...stOf([[stack.slice(0, -1), 'visited']]), [child.id]: 'active' }, path: stack.slice() }), stk(stack.map((id) => id.slice(1)), 'call stack'), vars({ depth: stack.length, max: maxDepth })],
      });
      dfs(child);
      stack.pop();
    }
  };
  dfs(IMP);
  frames.push({ say: 1, note: `Done. Deepest stack = ${maxDepth} = length of the longest word ("cart").`, panels: [trieP(IMP, { st: stOf([[nodesOf(IMP).slice(1).map((n) => n.id), 'done']]) }), stk([], 'call stack'), vars({ depth: 0, max: maxDepth })] });
  return { frames, maxDepth };
})();
const IMP_Q = build(['to', 'tea', 'ten', 'in', 'inn']);
const IMP_Q_DEPTH = Math.max(...nodesOf(IMP_Q).map((n) => n.id.length - 1));

// ---------- dry-run (the lesson's own table) ----------
const DRY = newRoot();
const DRY_LAYOUT = layoutOf(build(['car', 'cat', 'cart']));
const DRY_ROWS = [
  ['insert car', 'c, a, r', 'c, a, r (3)', 'r.isEnd = true'],
  ['insert cat', 'c, a, t', 't (1)', 't.isEnd = true'],
  ['insert cart', 'c, a, r, t', 't under r (1)', 'rt.isEnd = true'],
  ['search ca', 'c, a', '—', 'a.isEnd = false → false'],
  ['startsWith ca', 'c, a', '—', 'true'],
  ['countPrefix car', 'c, a, r', '—', 'r.count = 2 (car, cart)'],
];
const dryFrames = (() => {
  const short = [];
  const frames = [];
  const push = (k, path, st, note, v, say) => {
    frames.push({ say, note, panels: [trieP(DRY, { st, path, layout: DRY_LAYOUT }), reveal(short, ['path', 'new', 'result'], k), vars(v)] });
  };
  for (const w of ['car', 'cat', 'cart']) {
    const { made, path } = insert(DRY, w);
    short.push([`insert ${w}`, path.map((id) => id.slice(-1)).join(' '), String(made.length), 'isEnd']);
  }
  // re-run on a fresh trie so each frame shows the trie as it was
  const live = newRoot();
  DRY.children = live.children;
  ['car', 'cat', 'cart'].forEach((w, k) => {
    const { made, path } = insert(DRY, w);
    push(k, path, stOf([[path.filter((id) => !made.includes(id)), 'visited'], [made, 'active']]), `insert ${w}: walk ${DRY_ROWS[k][1]}; new nodes ${DRY_ROWS[k][2]}; ${DRY_ROWS[k][3]}.`, { new: made.length, nodes: countNodes(DRY) }, 0);
  });
  const s = walk(DRY, 'ca');
  short.push(['search ca', 'c a', '—', String(s.node !== null && s.node.isEnd)]);
  push(3, s.path, { ...stOf([[s.path.slice(0, -1), 'visited']]), [s.node.id]: 'bad' }, `search ca: the walk reaches "ca", but a.isEnd = ${s.node.isEnd} → false.`, { isEnd: s.node.isEnd }, 1);
  short.push(['startsWith ca', 'c a', '—', String(s.node !== null)]);
  push(4, s.path, { ...stOf([[s.path.slice(0, -1), 'visited']]), [s.node.id]: 'done' }, 'startsWith ca: same walk, it completed → true.', { node: 'ca' }, 1);
  const c = walk(DRY, 'car');
  short.push(['countPrefix car', 'c a r', '—', String(c.node.count)]);
  push(5, c.path, { ...stOf([[c.path.slice(0, -1), 'visited']]), [c.node.id]: 'done' }, `countPrefix car: r.count = ${c.node.count} (car, cart).`, { count: c.node.count }, 2);
  const chars = ['car', 'cat', 'cart'].join('').length;
  frames.push({ say: 0, note: `${countNodes(DRY)} nodes store 3 words with ${chars} characters in total: prefixes are shared.`, panels: [trieP(DRY, { layout: DRY_LAYOUT }), reveal(short, ['path', 'new', 'result'], short.length), vars({ nodes: countNodes(DRY), chars })] });
  return frames;
})();
const DRY_CARE_NEW = insert(build(['car', 'cat', 'cart']), 'care').made.length;

// ---------- optimized-wildcard ----------
const WC = build(['bat', 'bad', 'cab', 'cod']);
/** the lesson's wildcard DFS, logging each step; bad = nodes on branches that already failed */
function wildRun(root, word) {
  const ev = [];
  const bad = new Set();
  const visited = new Set();
  const dfs = (node, i, path) => {
    if (i === word.length) {
      ev.push({ k: 'end', id: node.id, path, ok: node.isEnd, bad: [...bad] });
      return node.isEnd;
    }
    const ch = word[i];
    if (ch === '.') {
      for (const child of node.children.values()) {
        visited.add(child.id);
        const p = [...path, child.id];
        ev.push({ k: 'try', id: child.id, i, path: p, bad: [...bad], of: [...node.children.keys()] });
        if (dfs(child, i + 1, p)) return true;
        nodesOf(child).forEach((n) => visited.has(n.id) && bad.add(n.id));
      }
      return false;
    }
    const next = node.children.get(ch);
    if (next === undefined) {
      ev.push({ k: 'miss', id: node.id, i, ch, path, bad: [...bad] });
      return false;
    }
    visited.add(next.id);
    const p = [...path, next.id];
    ev.push({ k: 'step', id: next.id, i, ch, path: p, bad: [...bad] });
    return dfs(next, i + 1, p);
  };
  const res = dfs(root, 0, []);
  return { ev, res, visited: [...visited] };
}
const wildFrames = (root, word) => {
  const { ev, res } = wildRun(root, word);
  return ev.map((e) => {
    const st = { ...stOf([[e.bad, 'bad'], [e.path.slice(0, -1), 'visited']]) };
    let note;
    let say;
    if (e.k === 'step') {
      st[e.id] = 'active';
      note = `"${e.ch}" is a normal character: follow the one "${e.ch}" child.`;
      say = 0;
    } else if (e.k === 'try') {
      st[e.id] = 'active';
      note = `"." at position ${e.i}: try child "${e.id.slice(-1)}" (children: ${e.of.join(', ')}).`;
      say = 1;
    } else if (e.k === 'miss') {
      st[e.id] = 'bad';
      note = `No "${e.ch}" under "${e.id.slice(1)}": this branch dies. Back up.`;
      say = 2;
    } else {
      st[e.id] = e.ok ? 'done' : 'bad';
      note = e.ok ? `End of the query and isEnd is true: "${e.id.slice(1)}" matches. Return true.` : `End of the query, but isEnd is false.`;
      say = 1;
    }
    return { say, note, panels: [trieP(root, { st, path: e.path }), wordP(word, { label: `search("${word}")`, pointers: [ptr(Math.min(e.k === 'end' ? word.length - 1 : e.i, word.length - 1), 'i')], highlights: hl(word.length, (k) => (k < (e.k === 'end' ? word.length : e.i) ? 'done' : k === e.i ? (e.k === 'miss' ? 'bad' : 'active') : '')) })], res };
  });
};
const WC_CD = wildFrames(WC, 'c.d');
const WC_X = wildRun(WC, '..x'); // visited 5 nodes, false

// concatenated: can s be split into dictionary words? walk the trie from i; every isEnd is a split point; memo by i
const CC = build(['cat', 'cats', 'dog']);
function concatRun(s) {
  const frames = [];
  const memo = {};
  const memoText = () => (Object.keys(memo).length ? Object.entries(memo).map(([k, v]) => `${k}:${v ? 'T' : 'F'}`).join(' ') : '—');
  const can = (i, starts) => {
    if (i === s.length) return true;
    if (i in memo) return memo[i];
    let node = CC;
    const path = [];
    for (let j = i; j < s.length; j++) {
      node = node.children.get(s[j]);
      if (!node) {
        frames.push({ say: 3, note: `From ${i}: ${j === i ? `no word starts with "${s[j]}"` : `no "${s[j]}" child after "${s.slice(i, j)}"`}. No split from ${i}.`, panels: [trieP(CC, { st: { ...stOf([[path, 'visited']]), [path.at(-1) || '^']: 'bad' }, path }), wordP(s, { pointers: [ptr(i, 'i', 'b'), ptr(j, 'j')], highlights: hl(s.length, (k) => (k < i ? 'done' : k < j ? 'visited' : k === j ? 'bad' : '')) }), vars({ memo: memoText() })] });
        break;
      }
      path.push(node.id);
      if (node.isEnd) {
        frames.push({ say: 3, note: `From ${i}: "${s.slice(i, j + 1)}" is a word (isEnd at j = ${j}). Split, continue from ${j + 1}.`, panels: [trieP(CC, { st: { ...stOf([[path.slice(0, -1), 'visited']]), [node.id]: 'done' }, path }), wordP(s, { pointers: [ptr(i, 'i', 'b'), ptr(j, 'j')], highlights: hl(s.length, (k) => (k < i ? 'done' : k <= j ? 'active' : '')) }), vars({ memo: memoText() })] });
        if (can(j + 1, starts)) {
          memo[i] = true;
          return true;
        }
      }
    }
    memo[i] = false;
    return false;
  };
  const res = can(0);
  return { frames, res, memo };
}
const CC_RUN = concatRun('catsdog');
const CC_DOGCAT = walk(CC, 'dog'); // first isEnd of "dogcat" is at index 2

// ---------- optimized-xor: 3-bit binary trie ----------
const BITS = 3; // the lesson uses 31 bits (30 → 0); 3 bits keep the picture small
const bitsOf = (x) => Array.from({ length: BITS }, (_, k) => (x >> (BITS - 1 - k)) & 1);
const XOR_NUMS = [5, 1, 6];
function xorInsert(root, x) {
  let n = root;
  const made = [];
  const path = [];
  for (let b = BITS - 1; b >= 0; b--) {
    const bit = String((x >> b) & 1);
    if (!n.children.has(bit)) {
      n.children.set(bit, new TrieNode(n.id + bit, bit));
      made.push(n.id + bit);
    }
    n = n.children.get(bit);
    path.push(n.id);
  }
  n.isEnd = true;
  n.value = x;
  return { made, path };
}
const XOR_LAYOUT = (() => {
  const r = newRoot();
  XOR_NUMS.forEach((x) => xorInsert(r, x));
  return layoutOf(r);
})();
const bitLabel = (n) => (n.id === '^' ? 'root' : n.ch);
const xorP = (root, opts) => trieP(root, { layout: XOR_LAYOUT, nodeLabel: bitLabel, ...opts });
const XOR = newRoot();
const xorBuild = XOR_NUMS.map((x) => {
  const { made, path } = xorInsert(XOR, x);
  return {
    say: 0,
    note: `Insert ${x} = ${bitsOf(x).join('')}: bits 2 → 0.${made.length < BITS ? ` Shares ${BITS - made.length} node${BITS - made.length > 1 ? 's' : ''} with earlier numbers.` : ''}`,
    panels: [xorP(XOR, { st: stOf([[path.filter((id) => !made.includes(id)), 'visited'], [made, 'active']]), path }), arr(bitsOf(x), { label: `${x} in bits`, showIndices: false })],
  };
});
/** the lesson's query loop for one x on the finished trie */
function xorQuery(root, x) {
  const steps = [];
  let n = root;
  let cur = 0;
  const path = [];
  for (let b = BITS - 1; b >= 0; b--) {
    const t = (x >> b) & 1;
    const want = t ^ 1;
    const win = n.children.has(String(want));
    if (win) {
      cur |= 1 << b;
      n = n.children.get(String(want));
    } else n = n.children.get(String(want ^ 1));
    path.push(n.id);
    steps.push({ b, t, want, win, cur, id: n.id, path: path.slice() });
  }
  return { steps, cur, partner: n.value };
}
const xorQueryFrames = (x, say) => {
  const q = xorQuery(XOR, x);
  const xb = bitsOf(x);
  return {
    ...q,
    frames: q.steps.map((s, k) => ({
      say: say[s.win ? 0 : 1],
      note: s.win ? `Bit ${s.b}: x has ${s.t}, want ${s.want}. It exists: go there, add 2^${s.b} = ${1 << s.b}. cur = ${s.cur}.` : `Bit ${s.b}: x has ${s.t}, want ${s.want}. Missing: take ${s.t} (XOR bit 0). cur = ${s.cur}.${k === q.steps.length - 1 ? ` Partner ${q.partner}: ${x} ^ ${q.partner} = ${q.cur}.` : ''}`,
      panels: [xorP(XOR, { st: { ...stOf([[s.path.slice(0, -1), 'visited']]), [s.id]: s.win ? 'done' : 'bad' }, path: s.path }), arr(xb, { label: `x = ${x}, bits 2 → 0`, showIndices: false, pointers: [ptr(k, 'b')], highlights: hl(BITS, (i) => (i < k ? 'visited' : i === k ? 'active' : '')) }), vars({ want: s.want, cur: s.cur })],
    })),
  };
};
const XOR5 = xorQueryFrames(5, [1, 2]);
XOR5.frames.at(-1).say = 3;
const XOR4 = xorQuery(XOR, 4);
const XOR4_FIRST_MISS = XOR4.steps.findIndex((s) => !s.win);
const XOR2 = xorQuery(XOR, 2);

// ---------- optimized-guided-search: Word Search II ----------
const WS_BOARD = [
  ['o', 'a', 't'],
  ['e', 'x', 'h'],
];
const WS_WORDS = ['oat', 'oath', 'eat'];
const wsTrie = (words) => {
  const root = newRoot();
  for (const w of words) insert(root, w).node.word = w;
  return root;
};
const wsLabel = (n) => (n.id === '^' ? 'root' : n.ch + (n.word ? '*' : ''));
/** the lesson's findWords, logging every call. clear=false drops the "node.word = null" line. */
function findWordsRun(board, words, clear = true) {
  const root = wsTrie(words);
  const layout = layoutOf(root);
  const B = board.map((r) => [...r]);
  const found = [];
  const ev = [];
  const path = [];
  const dfs = (r, c, parent) => {
    const ch = B[r][c];
    const node = parent.children.get(ch);
    if (!node) {
      ev.push({ k: 'prune', r, c, ch, parentId: parent.id, path: path.slice(), trie: snap(root), found: found.slice() });
      return;
    }
    path.push([r, c, node.id]);
    let rec = null;
    if (node.word) {
      rec = node.word;
      found.push(node.word);
      if (clear) node.word = null;
    }
    ev.push({ k: 'enter', r, c, id: node.id, rec, path: path.slice(), trie: snap(root), found: found.slice() });
    B[r][c] = '#';
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < B.length && nc < B[0].length && B[nr][nc] !== '#') dfs(nr, nc, node);
    }
    B[r][c] = ch;
    path.pop();
    if (node.children.size === 0 && !node.word) {
      parent.children.delete(ch);
      ev.push({ k: 'delete', id: node.id, path: path.slice(), trie: snap(root), found: found.slice() });
    }
  };
  for (let r = 0; r < B.length; r++) for (let c = 0; c < B[0].length; c++) dfs(r, c, root);
  return { found, ev, root, layout };
}
const WS = findWordsRun(WS_BOARD, WS_WORDS);
const wsFrames = (() => {
  const frames = [];
  const gridAt = (pathCells, cur, curState) =>
    grid(WS_BOARD, WS_BOARD.map((row, r) => row.map((_, c) => (cur && cur[0] === r && cur[1] === c ? curState : pathCells.some(([pr, pc]) => pr === r && pc === c) ? 'visited' : ''))), 'board');
  const rootPrunes = [];
  const flushRoot = (trie, found) => {
    if (!rootPrunes.length) return;
    frames.push({ say: 1, note: `Start cells ${rootPrunes.map((p) => `"${p}"`).join(', ')}: the root has no such child. Pruned at once.`, panels: [gridAt([], null), trieP(trie, { layout: WS.layout, nodeLabel: wsLabel }), arr(found.length ? found : ['—'], { label: 'found', showIndices: false })] });
    rootPrunes.length = 0;
  };
  for (const e of WS.ev) {
    if (e.k === 'prune' && e.parentId === '^') {
      rootPrunes.push(e.ch);
      continue;
    }
    flushRoot(e.trie, e.found);
    const ids = e.path.map((p) => p[2]);
    const foundP = arr(e.found.length ? e.found : ['—'], { label: 'found', showIndices: false, highlights: e.rec ? { [e.found.length - 1]: 'active' } : {} });
    if (e.k === 'enter') {
      frames.push({
        say: e.rec ? 2 : 1,
        note: e.rec ? `"${e.id.slice(1)}" has a word: record "${e.rec}" and clear it.` : `"${WS_BOARD[e.r][e.c]}" at (${e.r}, ${e.c}): the trie has this child. Path "${e.id.slice(1)}".`,
        panels: [gridAt(e.path, [e.r, e.c], e.rec ? 'done' : 'active'), trieP(e.trie, { layout: WS.layout, nodeLabel: wsLabel, st: { ...stOf([[ids.slice(0, -1), 'visited']]), [e.id]: e.rec ? 'done' : 'active' }, path: ids }), foundP],
      });
    } else if (e.k === 'prune') {
      frames.push({
        say: 1,
        note: `Neighbour "${e.ch}" at (${e.r}, ${e.c}): no "${e.ch}" child under "${e.parentId.slice(1)}". Prune.`,
        panels: [gridAt(e.path, [e.r, e.c], 'bad'), trieP(e.trie, { layout: WS.layout, nodeLabel: wsLabel, st: { ...stOf([[ids, 'visited']]), [e.parentId]: 'active' }, path: ids }), foundP],
      });
    } else {
      frames.push({
        say: 3,
        note: `"${e.id.slice(1)}" has no word and no children left: delete it.`,
        panels: [gridAt(e.path, null), trieP(e.trie, { layout: WS.layout, nodeLabel: wsLabel, st: stOf([[ids, 'visited']]), path: ids }), foundP],
      });
    }
  }
  if (rootPrunes.length) flushRoot(WS.ev.at(-1).trie, WS.found);
  return frames;
})();
const WS_LEFT = countNodes(WS.root);
// duplicates: board "aa", word "aa", with and without clearing node.word
const DUP_BOARD = [['a', 'a']];
const DUP_BAD = findWordsRun(DUP_BOARD, ['aa'], false).found.length;
const DUP_OK = findWordsRun(DUP_BOARD, ['aa'], true).found.length;

// stream: words stored reversed; after each letter walk back through the history
const ST_WORDS = ['cd', 'f'];
const ST = build(ST_WORDS.map((w) => [...w].reverse().join('')));
const ST_STREAM = ['a', 'c', 'd', 'f'];
function streamFrames(stream, say) {
  const frames = [];
  const hist = [];
  const results = [];
  for (const ch of stream) {
    hist.push(ch);
    let node = ST;
    const path = [];
    let ans = false;
    for (let j = hist.length - 1; j >= 0; j--) {
      node = node.children.get(hist[j]);
      const base = (st, note, sy, cell = 'active') =>
        frames.push({ say: sy, note, panels: [trieP(ST, { st, path: path.slice(), label: 'reversed words: dc, f' }), arr(hist.slice(), { label: 'stream so far', pointers: [ptr(j, 'j')], highlights: hl(hist.length, (k) => (k > j ? 'visited' : k === j ? cell : '')) })] });
      if (!node) {
        base({ ...stOf([[path, 'visited']]), [path.at(-1) || '^']: 'bad' }, `"${ch}" arrives. Walk back: no "${hist[j]}" child. No word ends here → false.`, say[1], 'bad');
        break;
      }
      path.push(node.id);
      if (node.isEnd) {
        ans = true;
        base({ ...stOf([[path.slice(0, -1), 'visited']]), [node.id]: 'done' }, `End marker on "${node.id.slice(1)}": the stream ends with "${[...node.id.slice(1)].reverse().join('')}" → true.`, say[1], 'done');
        break;
      }
      base({ ...stOf([[path.slice(0, -1), 'visited']]), [node.id]: 'active' }, `"${ch}" arrives. Walk back: "${hist[j]}" exists, keep going to older letters.`, say[0]);
    }
    results.push(ans);
  }
  return { frames, results };
}
const STREAM = streamFrames(ST_STREAM, [1, 2]);

// ---------- mistakes ----------
// search that creates nodes (the bug): walks like insert, then returns isEnd
const MIS = build(['car', 'cat']);
const MIS_LAYOUT = layoutOf(build(['car', 'cat', 'cab']));
const misFrames = (() => {
  const frames = [];
  let node = MIS;
  const path = [];
  const made = [];
  for (const ch of 'cab') {
    if (!node.children.has(ch)) {
      node.children.set(ch, new TrieNode(node.id + ch, ch)); // the bug
      made.push(node.id + ch);
    }
    node = node.children.get(ch);
    path.push(node.id);
    frames.push({ say: 0, note: made.includes(node.id) ? `No "${ch}" child: the buggy search CREATES one.` : `"${ch}" exists: move in.`, panels: [trieP(MIS, { st: { ...stOf([[path.slice(0, -1), 'visited'], [made, 'bad']]), [node.id]: made.includes(node.id) ? 'bad' : 'active' }, path, layout: MIS_LAYOUT }), wordP('cab', { label: 'buggy search("cab")', pointers: [ptr(path.length - 1, 'ch')] })] });
  }
  frames.push({ say: 0, note: `It returns isEnd = ${node.isEnd}, but the trie now has an extra "cab" path. startsWith("cab") now says ${walk(MIS, 'cab').node !== null}.`, panels: [trieP(MIS, { st: stOf([[made, 'bad']]), layout: MIS_LAYOUT }), vars({ search: node.isEnd, startsWith: walk(MIS, 'cab').node !== null })] });
  return frames;
})();
// wildcard that gives up after the first child (the bug) vs the lesson's DFS
const GU = build(['hat', 'hit', 'hid']);
const guBuggy = (node, w, i) => {
  if (i === w.length) return node.isEnd;
  if (w[i] === '.') {
    const first = node.children.values().next().value;
    return first ? guBuggy(first, w, i + 1) : false; // only the first child
  }
  const nx = node.children.get(w[i]);
  return nx ? guBuggy(nx, w, i + 1) : false;
};
const GU_BUGGY = guBuggy(GU, 'h.d', 0);
const GU_OK = wildRun(GU, 'h.d').res;

// ---------- interview-tips: radix compression ----------
// merge a chain of single-child, non-word nodes into one node
function compress(n) {
  const out = new TrieNode(n.id, n.ch);
  out.isEnd = n.isEnd;
  for (const c of n.children.values()) {
    let cur = c;
    let label = c.ch;
    while (cur.children.size === 1 && !cur.isEnd) {
      cur = [...cur.children.values()][0];
      label += cur.ch;
    }
    const sub = compress(cur);
    sub.ch = label;
    sub.id = c.id + '~' + label;
    out.children.set(label, sub);
  }
  return out;
}
const fixIds = (n, id = '^') => {
  n.id = id;
  [...n.children.values()].forEach((c, k) => fixIds(c, `${id}${k}`));
  return n;
};
const RX = build(['dog', 'door']);
const RX_C = fixIds(compress(RX));
const RX_CHARS = 'dog'.length + 'door'.length;
const RX_Q = fixIds(compress(build(['ant', 'and', 'bee'])));
const RX_Q_N = countNodes(RX_Q);
const RX_Q_RAW = countNodes(build(['ant', 'and', 'bee']));

export default {
  what: [
    {
      kind: 'watch',
      title: 'Insert car, cat, cart, dog',
      lines: ['Each edge adds one character; each node is the prefix spelled from the root.', 'A word that shares a prefix reuses those nodes; only the new suffix creates nodes.', '`*` marks a node where a whole word ends.'],
      frames: [
        ...WHAT.frames,
        {
          say: 0,
          note: `To check "any word starts with ca?": walk c, then a. ${WHAT_CA.path.length} steps.`,
          panels: [trieP(WHAT.root, { st: { [WHAT_CA.path[0]]: 'visited', [WHAT_CA.path[1]]: 'active' }, path: WHAT_CA.path, layout: WHAT_LAYOUT }), vars({ prefix: 'ca', steps: WHAT_CA.path.length, nodes: WHAT_N })],
        },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which prefix?',
      lines: ['Every node stands for the prefix on the path from the root to it.'],
      panels: [trieP(WHAT.root, { st: { '^cart': 'active' }, layout: WHAT_LAYOUT })],
      task: {
        type: 'choose',
        question: 'Which prefix does the highlighted node represent?',
        options: [
          { text: '"cart"', why: '' },
          { text: '"t"', why: 'A node is not just its own letter: it is the whole path c → a → r → t.' },
          { text: '"cat"', why: 'That is the other t, directly under a. This one hangs under r.' },
        ],
        answer: 0,
      },
      solved: 'Read the path from the root: c, a, r, t. The node is the prefix "cart" (and a word ends there).',
    },
    {
      kind: 'turn',
      title: 'Your turn: add "cow"',
      lines: ['The trie holds car, cat, cart, dog.', 'Now insert "cow".'],
      panels: [trieP(WHAT.root, { layout: WHAT_LAYOUT }), wordP('cow', { label: 'insert "cow"' })],
      task: { type: 'number', question: 'How many nodes (not counting the root) does the trie have after inserting "cow"?', options: [9, WHAT_COW_N, 11, 13], answer: WHAT_COW_N, hint: 'Count the 8 nodes there now, then the ones "cow" cannot reuse.' },
      solved: `"c" is shared, so only o and w are new: ${WHAT_N} + ${WHAT_COW_MADE} = ${WHAT_COW_N}.`,
      then: [{ say: 1, note: `c reused; o, w created. ${WHAT_COW_N} nodes.`, panels: [trieP(WHAT_COW, { st: { '^c': 'visited', '^co': 'active', '^cow': 'active' }, path: ['^c', '^co', '^cow'], layout: WHAT_LAYOUT })] }],
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Scan every word vs walk the trie',
      lines: ['Scanning all n words costs O(n · L) per query.', 'A trie walks one node per character of p: O(L).', 'A `Set` of all prefixes is also O(L), but stores every prefix string.', 'A node is a handle on a prefix: attach data, or keep walking from it.'],
      frames: [...whyScan, ...whyWalk],
    },
    {
      kind: 'turn',
      title: 'Your turn: a Set of all prefixes',
      lines: ['Instead of a trie, store every prefix of every word in a `Set`.', 'Words: car, cat, cart, dog.'],
      panels: [arr(WHY_WORDS, { label: 'words', showIndices: false })],
      task: { type: 'number', question: 'How many distinct prefix strings go into the Set?', options: [6, WHY_PREFIXES.length, 13, 19], answer: WHY_PREFIXES.length, hint: 'c, ca, car… shared prefixes count once.' },
      solved: `${WHY_PREFIXES.length} strings holding ${WHY_PREFIX_CHARS} characters. The trie has the same ${countNodes(WHY)} prefixes as nodes, but each node adds one character.`,
      then: [{ note: `${WHY_PREFIXES.length} prefix strings, ${WHY_PREFIX_CHARS} characters stored.`, panels: [arr(WHY_PREFIXES, { label: 'Set of all prefixes', showIndices: false }), vars({ strings: WHY_PREFIXES.length, chars: WHY_PREFIX_CHARS })] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Pick the trie flavour',
      lines: ['Prefix queries, counts, autocomplete → a **prefix tree** walk.', 'Wildcard `.` or splitting into words → **DFS** over branches.', 'Maximum XOR → a **binary trie**, bits high to low.', 'Many words in a grid or stream → the trie **guides another search**.', 'Only exact membership → a `Set`.'],
      frames: WHEN_ROWS.map((r, k) => ({ say: k, note: `${r[0]} → ${r[1]}.`, panels: [reveal(WHEN_ROWS, ['use'], k)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a dot in the query',
      lines: ['Queries like "b.d": `.` stands for any single letter.'],
      panels: [reveal(WHEN_ROWS, ['use'], WHEN_ROWS.length)],
      task: {
        type: 'choose',
        question: 'Which flavour fits?',
        options: [
          { text: 'DFS over the trie branches', why: '' },
          { text: 'One plain prefix walk', why: 'A plain walk follows one child per character; "." can match several children.' },
          { text: 'A Set of words', why: 'A Set answers exact matches only; it cannot try every letter for the dot.' },
        ],
        answer: 0,
      },
      solved: 'At "." the search must branch into every child: DFS.',
    },
    {
      kind: 'turn',
      title: 'Your turn: only a few queries',
      lines: ['You get 20 words and just 3 prefix queries.'],
      panels: [vars({ words: 20, queries: 3 })],
      task: {
        type: 'choose',
        question: 'What should you say first in an interview?',
        options: [
          { text: 'A simple scan may be fine here; a trie pays off with many queries', why: '' },
          { text: 'Always build a trie for prefixes', why: 'With few queries a scan may be simpler. The lesson says to mention that before building a trie.' },
          { text: 'Use a binary trie', why: 'Binary tries are for XOR over numbers, not word prefixes.' },
        ],
        answer: 0,
      },
      solved: 'Name the simple option first, then build the trie when the query count justifies it.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'The four-question checklist',
      lines: ['Many strings + prefix questions → prefix tree.', 'A query character matches many options → DFS on the trie.', 'XOR maximisation over numbers → binary trie.', 'Many words searched at once (grid, stream) → the trie prunes the search.'],
      frames: [
        { say: 0, note: 'Clue: "autocomplete" or "starts with".', panels: [flavourP({ 0: 'active' })] },
        { say: 1, note: 'Clue: "." can match any letter.', panels: [flavourP({ 0: 'done', 1: 'active' })] },
        { say: 2, note: 'Clue: "maximum XOR".', panels: [flavourP({ 0: 'done', 1: 'done', 2: 'active' })] },
        { say: 3, note: 'Clue: "find all words in the grid".', panels: [flavourP({ 0: 'done', 1: 'done', 2: 'done', 3: 'active' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a stream',
      lines: ['"After each character of a stream, say whether a suffix of the stream is a dictionary word."'],
      panels: [flavourP()],
      task: { type: 'cell', question: 'Which flavour?', answer: 3, hints: { 0: 'You are not answering prefix queries on a fixed list: the text keeps growing.', 1: 'No wildcard and no splitting here.', 2: 'There are no numbers or XOR.' } },
      solved: '"stream of characters" → a trie of the words guides the search over the stream.',
    },
    {
      kind: 'turn',
      title: 'Your turn: made of other words',
      lines: ['"Return every word in the list that is a concatenation of other words in the list."'],
      panels: [flavourP()],
      task: { type: 'cell', question: 'Which flavour?', answer: 1, hints: { 0: 'One walk is not enough: a word may end at several places.', 2: 'There is no XOR.', 3: 'There is no grid or stream; you split one string.' } },
      solved: 'Splitting into dictionary words means trying every word-end as a cut: DFS over the trie.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Insert, search, startsWith',
      lines: ['Words share nodes for as long as they share characters, then branch.', '**Insert**: walk while the path exists, create the rest, mark the last node.', '**Search**: walk; a missing child means absent; at the end check `isEnd`.', '**startsWith**: the same walk, no `isEnd` check.', 'Each node is a state: "what I have read so far".'],
      frames: [
        { say: 0, note: 'The trie holds to, tea, in, inn. "to" and "tea" share t, then branch.', panels: [trieP(build(['to', 'tea', 'in', 'inn']), { layout: INT_LAYOUT })] },
        ...intInsert,
        ...INT_TAN.frames,
        ...INT_TE.frames,
        { say: 4, note: 'The walk stopped at node "te": that node is the state "read t, e". A later search could continue from it.', panels: [trieP(INT, { st: { '^te': 'active' }, path: ['^t', '^te'], layout: INT_LAYOUT })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it fail?',
      lines: ['Same trie: to, tea, ten, in, inn.', 'search("tone") walks one letter at a time.'],
      panels: [wordP('tone', { label: 'search("tone")' }), trieP(INT, { layout: INT_LAYOUT })],
      task: { type: 'cell', question: 'At which letter does the walk find no child?', answer: INT_TONE.failAt, hints: { 0: 'The root has a "t" child.', 1: '"t" has an "o" child (the word "to").', 3: 'The walk never gets this far.' } },
      solved: `"t" and "o" exist; node "to" has no children at all, so "n" (index ${INT_TONE.failAt}) fails. search returns false.`,
      then: bare(searchFrames(INT, 'tone', { layout: INT_LAYOUT }).frames.slice(-1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: Map or Array(26)?',
      lines: ['`Map` children: any characters, memory per actual child.', '`Array(26)`: fixed a–z, index `ch.charCodeAt(0) - 97`.'],
      panels: [table(['alphabet', 'memory', 'order'], ['Map', 'Array(26)'], [['any', 'a–z'], ['per child', '26 slots'], ['insertion', 'alphabetical']])],
      task: {
        type: 'choose',
        question: 'Words may contain digits, "-" and "é". Which children?',
        options: [
          { text: 'Map', why: '' },
          { text: 'Array(26)', why: 'Array(26) only has slots for a–z; "-" or "é" has no slot.' },
          { text: 'Either works the same', why: 'Only the Map handles any alphabet.' },
        ],
        answer: 0,
      },
      solved: 'Use arrays when the problem guarantees lowercase letters; use a Map otherwise.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Brute force: filter per prefix',
      lines: ['For every typed prefix, filter the whole sorted list.', 'Each prefix re-checks every word from its first character.'],
      frames: bfBrute.frames,
    },
    {
      kind: 'watch',
      title: 'Trie: one step per typed character',
      lines: ['Build once: words in sorted order.', 'Each node keeps up to 3 smallest words passing through it.', 'Each typed character moves ONE edge deeper.', 'Push that node\'s `top3`.'],
      frames: [
        { say: 1, note: 'Every node stores the first 3 words (in sorted order) that pass through it.', panels: [trieP(BF_TRIE), arr(BF_TRIE.children.get('b').top3, { label: '"b".top3', showIndices: false })] },
        ...bfTrieFrames,
        { say: 2, note: `Brute force: ${bfBrute.checks} startsWith checks. Trie: ${BF_WORD.length} steps, keeping its place each time.`, panels: [vars({ brute: bfBrute.checks, trie: BF_WORD.length })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: type one more letter',
      lines: ['searchWord becomes "bats".', '`node = node && node.children.get(ch)`', '`out.push(node ? node.top3 : [])`'],
      panels: [trieP(BF_TRIE, { st: { '^bat': 'active' }, path: ['^b', '^ba', '^bat'] }), vars({ node: 'bat', next: 's' })],
      task: {
        type: 'choose',
        question: 'What does the loop push for "s"?',
        options: [
          { text: '[]', why: '' },
          { text: '["bath"]', why: '"bath" has h after bat, not s. "bat" has no "s" child.' },
          { text: '["bat", "bath"]', why: 'That is the top3 of "bat", pushed for the previous letter.' },
          { text: 'It throws', why: '`node && …` turns a missing child into undefined, and undefined pushes [].' },
        ],
        answer: 0,
      },
      solved: `No "s" child: node becomes undefined, so out gets []. Any later letter also gets [] (out = ${JSON.stringify(BF_BATS.out.at(-1))}).`,
    },
  ],

  optimized: [
    {
      kind: 'watch',
      title: 'Counts on every node passed',
      lines: ['**insert**: create missing children, move in, `count++` on each node.', 'At the last character set `isEnd = true`.', '**search**: walk; missing child → false; else return `isEnd`.', '**startsWith**: the same walk; true if it completes.', '**countPrefix**: walk, return `node.count`.'],
      frames: [
        ...optInsert,
        { say: 4, note: `countPrefix("te"): walk t, e; return count = ${OPT_TE.node.count} (tea, ten).`, panels: [optP(OPT, { st: { '^t': 'visited', '^te': 'active' }, path: OPT_TE.path })] },
        { say: 2, note: `search("in"): walk i, n; n.isEnd = ${OPT_IN.node.isEnd} → ${OPT_IN.node.isEnd}.`, panels: [optP(OPT, { st: { '^i': 'visited', '^in': 'active' }, path: OPT_IN.path })] },
        { say: 3, note: 'startsWith("tz"): t exists, no "z" child → false.', panels: [optP(OPT, { st: { '^t': 'bad' }, path: ['^t'] })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: insert "tin"',
      lines: ['Same trie: to, tea, ten, in (counts on nodes).'],
      panels: [optP(build(OPT_WORDS), { label: 'node = count · edge = letter' }), wordP('tin', { label: 'insert "tin"' })],
      task: { type: 'order', question: 'Put the steps of insert("tin") in order.', items: ['t: count 3 → 4', 'create "ti", count 1', 'create "tin", count 1', '"tin".isEnd = true'], hint: 'Walk the existing "t" first, then create what is missing, then mark the end.' },
      solved: `t is reused, i and n are new (${OPT_TIN.made.length} nodes), and only the last node is marked.`,
      then: [{ say: 0, note: 'count++ on t, ti, tin; isEnd on tin.', panels: [optP((() => { const r = build(OPT_WORDS); insert(r, 'tin'); return r; })(), { st: stOf([[OPT_TIN.path, 'active']]), path: OPT_TIN.path })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: add up the first level',
      lines: ['Back to to, tea, ten, in.', 'Every word passes through exactly one node right under the root.'],
      panels: [optP(OPT)],
      task: { type: 'number', question: 'What is count("t") + count("i")?', options: [2, OPT_DEPTH1.reduce((a, b) => a + b, 0), 5, 7], answer: OPT_DEPTH1.reduce((a, b) => a + b, 0), hint: 'Each insert adds 1 to the first node it passes.' },
      solved: `${OPT_DEPTH1.join(' + ')} = ${OPT_DEPTH1.reduce((a, b) => a + b, 0)}: the number of words inserted.`,
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Array(26): one slot per letter',
      lines: ['`Node26` keeps 26 slots in `next`, one per letter.', '`idx(ch) = ch.charCodeAt(0) - 97`: a → 0 … z → 25.', '`node = node.next[i] ??= new Node26()` creates only if the slot is empty.'],
      frames: [
        { say: 0, note: 'An empty root: all slots null (a–h shown).', panels: [trieP(view26(new Node26('^')), { layout: T26_LAYOUT }), slotsP(new Node26('^'), {}, 'next[0..7] of root (a–h)')] },
        ...T26_BAD,
        ...T26_ACE,
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: insert "bag"',
      lines: ['The trie holds bad and ace.', 'The walk for "bag" reaches node "ba".'],
      panels: [slotsP(T26_BA), trieP(view26(T26), { st: { '^b': 'visited', '^ba': 'active' }, path: ['^b', '^ba'], layout: T26_LAYOUT })],
      task: { type: 'cell', question: 'Which slot of "ba" does ??= fill for "g"?', answer: idx('g'), hints: { 3: 'Slot 3 is "d", already holding "bad".', 0: 'Slot 0 is "a". Count from a = 0.' } },
      solved: `idx("g") = ${idx('g')}: the slot was null, so ??= creates a node there.`,
      then: bare(insert26Frames(T26, 'bag', [2, 2]).slice(-1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: insert "ba"',
      lines: ['Now insert "ba". Slot 1 of the root already holds node "b".'],
      panels: [slotsP(T26), trieP(view26(T26), { st: { '^b': 'active' }, path: ['^b'], layout: T26_LAYOUT })],
      task: {
        type: 'choose',
        question: 'What does `node.next[1] ??= new Node26()` do here?',
        options: [
          { text: 'Keeps the existing node and moves into it', why: '' },
          { text: 'Replaces it with a new empty node', why: '??= assigns only when the slot is null or undefined; replacing it would cut off bad and bag.' },
          { text: 'Throws, because the slot is taken', why: '??= never throws; it just returns the value already there.' },
        ],
        answer: 0,
      },
      solved: '"ba" creates no nodes: both slots are filled. Only isEnd is set on "ba".',
      then: (() => {
        const f = insert26Frames(T26, 'ba', [2, 2]);
        f.at(-1).note += ' Then isEnd = true on "ba".';
        return bare(f);
      })(),
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'How deep can a trie DFS go?',
      lines: ['A DFS over a trie goes one level per character.', 'So recursion is at most L deep, L = the longest word: safe.'],
      frames: impFrames.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: the deepest stack',
      lines: ['DFS over the trie of to, tea, ten, in, inn.', 'The stack holds one entry per letter node entered.'],
      panels: [trieP(IMP_Q)],
      task: { type: 'number', question: 'At its deepest, how many letter nodes are on the stack?', options: [2, IMP_Q_DEPTH, 5, 8], answer: IMP_Q_DEPTH, hint: 'The depth of the deepest node = the longest word.' },
      solved: `The longest words (tea, ten, inn) have ${IMP_Q_DEPTH} letters, so the stack never holds more than ${IMP_Q_DEPTH}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: sparse branching',
      lines: ['Every character can become a node object.', 'Most nodes here have only 1 or 2 children.'],
      panels: [trieP(IMP)],
      task: {
        type: 'choose',
        question: 'Which children use less memory?',
        options: [
          { text: 'Map', why: '' },
          { text: 'Array(26)', why: 'Every Array(26) node pays for 26 slots even with one child.' },
          { text: 'Exactly the same', why: 'A Map grows with the actual children; an array always has 26 slots.' },
        ],
        answer: 0,
      },
      solved: 'Array(26) nodes cost more memory than Map nodes when branching is sparse.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'insert car, cat, cart; then three queries',
      lines: ['Inserts walk the shared path and create only missing nodes.', '`search` needs the end flag; `startsWith` only needs the path.', '`countPrefix` returns the count stored on the last node.'],
      frames: dryFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: insert "care"',
      lines: ['Continue from the dry run: the trie holds car, cat, cart.'],
      panels: [trieP(DRY, { layout: DRY_LAYOUT }), wordP('care', { label: 'insert "care"' })],
      task: { type: 'number', question: 'How many new nodes does insert("care") create?', options: [0, DRY_CARE_NEW, 2, 4], answer: DRY_CARE_NEW, hint: 'c, a, r already exist. What hangs under r so far?' },
      solved: `c, a, r are reused; r has only a "t" child, so one new node "e": ${DRY_CARE_NEW}.`,
    },
  ],

  'optimized-wildcard': [
    {
      kind: 'watch',
      title: 'Wildcard search "c.d"',
      lines: ['A normal character follows one child.', 'A `.` tries **every** child, recursively.', 'A branch dies as soon as its prefix fails.'],
      frames: [{ say: 0, note: 'The trie holds bat, bad, cab, cod.', panels: [trieP(WC), wordP('c.d', { label: 'search("c.d")' })] }, ...WC_CD],
    },
    {
      kind: 'turn',
      title: 'Your turn: a query that fails',
      lines: ['Same trie: bat, bad, cab, cod.', 'Query "..x": two dots, then x.'],
      panels: [trieP(WC), wordP('..x', { label: 'search("..x")' })],
      task: { type: 'number', question: 'How many trie nodes (not the root) does the DFS enter before returning false?', options: [3, WC_X.visited.length, 7, 9], answer: WC_X.visited.length, hint: 'Each dot enters every child at that level; "x" then fails under each depth-2 node.' },
      solved: `It enters ${WC_X.visited.map((id) => id.slice(1)).join(', ')}: ${WC_X.visited.length} nodes. No depth-3 node is entered: no "x" exists.`,
      then: bare(wildFrames(WC, '..x').slice(-1)),
    },
    {
      kind: 'watch',
      title: 'Concatenated: split "catsdog"',
      lines: ['From position i, walk the trie along s[i..].', 'Every `isEnd` at position j is a split point: continue from j + 1.', 'Memoise "can the suffix from i be split?" to avoid re-exploring.', 'Words: cat, cats, dog.'],
      frames: [
        { say: 3, note: 'The trie holds cat, cats, dog. Can "catsdog" be split into them?', panels: [trieP(CC), wordP('catsdog')] },
        ...CC_RUN.frames.map((f) => ({ ...f, say: f.note.includes('No split') ? 2 : f.note.includes('is a word') ? 1 : 0 })),
        { say: 1, note: `"dog" reaches the end of the string: ${CC_RUN.res}. catsdog = cats + dog.`, panels: [trieP(CC), wordP('catsdog', { highlights: hl(7, () => 'done') }), vars({ answer: CC_RUN.res })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: first split point',
      lines: ['Same trie: cat, cats, dog. String "dogcat".', 'Walk from i = 0 until the first `isEnd` node.'],
      panels: [wordP('dogcat'), trieP(CC)],
      task: { type: 'cell', question: 'At which letter is the first isEnd node reached?', answer: CC_DOGCAT.path.length - 1, hints: { 0: '"d" alone is not a word.', 1: '"do" is not a word.', 5: 'You split earlier: the walk passes an isEnd before this.' } },
      solved: '"dog" ends at index 2: split there and continue from index 3 ("cat").',
    },
  ],

  'optimized-xor': [
    {
      kind: 'watch',
      title: 'Build a binary trie',
      lines: ['Store each number as a path of bits, highest bit first.', 'Small example: 3 bits (2 → 0) instead of 31 (30 → 0).'],
      frames: xorBuild.map((f, k) => ({ ...f, say: k === 0 ? 1 : 0 })),
    },
    {
      kind: 'watch',
      title: 'Query x = 5: want the opposite bit',
      lines: ['Walk from the root, bit 2 down to bit 0.', 'x has bit t; you want 1 − t (that makes the XOR bit 1).', 'If that child exists, go there and add 2^b; else take the same bit.', 'One step per bit, whatever the number of values.'],
      frames: XOR5.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: query x = 4',
      lines: ['Trie holds 5 (101), 1 (001), 6 (110).', 'x = 4 = 100.'],
      panels: [arr(bitsOf(4), { label: 'x = 4, bits 2 → 0', showIndices: false }), xorP(XOR, {})],
      task: { type: 'cell', question: 'At which bit does the opposite child first go missing?', answer: XOR4_FIRST_MISS, hints: { 0: 'x has 1 at bit 2; the root has a 0 child. That bit is won.', 2: 'It goes missing earlier.' } },
      solved: `Bit 2 is won (go to 0). Node "0" only has a 0 child, so bit 1 is lost. Bit 0 is won. Partner ${XOR4.partner}: 4 ^ ${XOR4.partner} = ${XOR4.cur}.`,
      then: bare(xorQueryFrames(4, [2, 2]).frames),
    },
    {
      kind: 'turn',
      title: 'Your turn: query x = 2',
      lines: ['Same trie: 5, 1, 6. x = 2 = 010.'],
      panels: [arr(bitsOf(2), { label: 'x = 2, bits 2 → 0', showIndices: false }), xorP(XOR, {})],
      task: { type: 'number', question: 'What is the best XOR the walk finds for x = 2?', options: [3, 4, 6, XOR2.cur], answer: XOR2.cur, hint: 'Check each bit: is the opposite child there?' },
      solved: `All three opposite bits exist: 4 + 2 + 1 = ${XOR2.cur}. Partner ${XOR2.partner} (101): 010 ^ 101 = 111.`,
    },
  ],

  'optimized-guided-search': [
    {
      kind: 'watch',
      title: 'Word Search II with one trie',
      lines: ['Build one trie of all words; store the full word at its end node.', 'DFS from every cell carrying the current trie node; no child for the letter → prune.', 'Reach a node with a word: record it and clear it.', 'After exploring, delete leaves with no word and no children.'],
      frames: [{ say: 0, note: `Words ${WS_WORDS.join(', ')}. \`*\` = a word is stored on that node.`, panels: [grid(WS_BOARD, WS_BOARD.map((r) => r.map(() => '')), 'board'), trieP(wsTrie(WS_WORDS), { nodeLabel: wsLabel })] }, ...wsFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: what is left of the trie?',
      lines: ['The search is over: found oat, oath.', '"eat" was not found: its path stopped after "e".'],
      panels: [grid(WS_BOARD, WS_BOARD.map((r) => r.map(() => '')), 'board'), trieP(wsTrie(WS_WORDS), { nodeLabel: wsLabel, label: 'trie before the search' })],
      task: { type: 'number', question: 'How many trie nodes (not the root) remain after the search?', options: [0, WS_LEFT, 5, 7], answer: WS_LEFT, hint: 'A node is deleted only when it has no word and no children left.' },
      solved: `The o-branch emptied out and was deleted leaf by leaf. e, a, t remain (t still stores "eat"): ${WS_LEFT} nodes.`,
    },
    {
      kind: 'watch',
      title: 'Stream with reversed words',
      lines: ['Store words **reversed**: cd → dc, f → f.', 'After each letter, walk back from the newest letter.', 'Stop on a missing child; report true on an end marker.', 'Only the last maxWordLength letters can matter.'],
      frames: STREAM.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: one more letter',
      lines: ['Words cd, f stored reversed: dc, f.', 'The stream so far is a, c, d, f. Now "c" arrives.'],
      panels: [arr([...ST_STREAM, 'c'], { label: 'stream so far' }), trieP(ST, { label: 'reversed words: dc, f' })],
      task: {
        type: 'choose',
        question: 'What does the query return after "c"?',
        options: [
          { text: 'false: the root has no "c" child', why: '' },
          { text: 'true: "c", "d" appear in the stream', why: 'The stream must END with a word. The walk starts at the newest letter "c", and no reversed word starts with c.' },
          { text: 'true: "f" is a word', why: '"f" ended the stream one letter ago. Now the stream ends with "c".' },
        ],
        answer: 0,
      },
      solved: 'The walk starts at the newest letter. No reversed word starts with "c", so it stops at once: false.',
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'A search that creates nodes',
      lines: ['Only insert may create children; search must not modify the trie.'],
      frames: [{ say: 0, note: 'The trie holds car, cat.', panels: [trieP(build(['car', 'cat']), { layout: MIS_LAYOUT })] }, ...misFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: giving up after one child',
      lines: ['Trie: hat, hit, hid. Query "h.d".', 'A buggy wildcard search follows only the FIRST child at `.`.'],
      panels: [trieP(GU), wordP('h.d', { label: 'search("h.d")' })],
      task: {
        type: 'choose',
        question: 'What does the buggy search return?',
        options: [
          { text: `${GU_BUGGY}: it tries "a", finds no "d" under "ha", and stops`, why: '' },
          { text: `${!GU_BUGGY}: "hid" matches`, why: `That is the correct answer (${GU_OK}), but the bug never reaches the "i" child.` },
          { text: 'It throws on "."', why: '"." is handled; the bug is that it tries only one child.' },
        ],
        answer: 0,
      },
      solved: `"." must try all children: the full DFS goes on to "i" → "d" and returns ${GU_OK}.`,
      then: wildFrames(GU, 'h.d').map((f) => ({ ...f, say: 0 })),
    },
    {
      kind: 'turn',
      title: 'Your turn: forget to clear node.word',
      lines: ['Board: a a (one row). Words: ["aa"].', 'Suppose the line `node.word = null` is missing.'],
      panels: [grid(DUP_BOARD, [['', '']], 'board'), trieP(wsTrie(['aa']), { nodeLabel: wsLabel })],
      task: { type: 'number', question: 'How many times is "aa" pushed to found?', options: [1, DUP_BAD, 3, 4], answer: DUP_BAD, hint: 'The DFS starts from both cells; each start can spell "aa".' },
      solved: `Start (0,0) → (0,1) and start (0,1) → (0,0) both reach the word: ${DUP_BAD} pushes. Clearing it gives ${DUP_OK}.`,
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Talk about memory: compression',
      lines: ['Node count ≈ total characters (shared prefixes reduce it).', 'A radix tree merges single-child chains into one node.'],
      frames: [
        { say: 0, note: `"dog" + "door" = ${RX_CHARS} characters; the trie has ${countNodes(RX)} nodes (d, o are shared).`, panels: [trieP(RX), vars({ chars: RX_CHARS, nodes: countNodes(RX) })] },
        { say: 1, note: `d has one child: merge d, o into "do". The single-child chain o → r merges into "or". ${countNodes(RX_C)} nodes.`, panels: [trieP(RX_C, { nodeLabel: (n) => (n.id === '^' ? 'root' : n.ch), st: stOf([[nodesOf(RX_C).slice(1).map((n) => n.id), 'done']]) }), vars({ nodes: countNodes(RX_C) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: compress ant, and, bee',
      lines: [`The plain trie of ant, and, bee has ${RX_Q_RAW} nodes.`, 'Merge every single-child chain.'],
      panels: [trieP(build(['ant', 'and', 'bee']))],
      task: { type: 'number', question: 'How many nodes (not the root) are left?', options: [3, RX_Q_N, 5, 7], answer: RX_Q_N, hint: 'a → n is a chain; n branches into t and d. b → e → e is one chain.' },
      solved: `"an", "t", "d", "bee": ${RX_Q_N} nodes.`,
      then: [{ say: 1, note: `${RX_Q_N} nodes after merging.`, panels: [trieP(RX_Q, { nodeLabel: (n) => (n.id === '^' ? 'root' : n.ch) })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: before you code',
      lines: ['You have justified the trie. Next, before writing code…'],
      panels: [vars({ children: '?', isEnd: '?', extras: '?' })],
      task: {
        type: 'choose',
        question: 'What should you state up front?',
        options: [
          { text: 'The node shape: Map or Array(26), isEnd, extra fields', why: '' },
          { text: 'Nothing: start typing the class', why: 'The lesson says to state the node shape first, so the interviewer can follow.' },
          { text: 'The radix-tree compression code', why: 'Compression is a memory talking point, not the first thing to code.' },
        ],
        answer: 0,
      },
      solved: 'Map vs Array(26), isEnd, and any extras (count, word, sum, top-3 list).',
    },
  ],
};
