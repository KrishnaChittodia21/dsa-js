// Shorts for Tries (M9). Format: src/content/shortSchema.js. Facts come only from topics/tries/topic.js.
// Every node created, walk, DFS branch, XOR bit choice, grid prune and deleted leaf below comes from running the
// pattern's template on its "e.g." input (inputs differ from the step lessons').
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const q = (s) => `"${s}"`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/tries.js: ${msg}`);
};

// ---------- the trie: Map children, isEnd (word for grid search); node id = '^' + the prefix it spells ----------
class TrieNode {
  constructor(id, ch) {
    this.id = id;
    this.ch = ch;
    this.children = new Map();
    this.isEnd = false;
    this.word = null;
  }
}
const newRoot = () => new TrieNode('^', 'root');
/** the template's insert; returns the ids it created and walked */
function insert(root, word) {
  let node = root;
  const made = [];
  const path = [];
  for (const ch of word) {
    if (!node.children.has(ch)) node.children.set(ch, new TrieNode(node.id + ch, ch)), made.push(node.id + ch);
    node = node.children.get(ch);
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
/** the template's walk; failAt = index of the first missing character (−1 when the walk completes) */
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
const countNodes = (n) => [...n.children.values()].reduce((a, c) => a + 1 + countNodes(c), 0); // root not counted
// snapshot so a frame keeps the trie as it was at that moment
const snap = (n) => ({ id: n.id, ch: n.ch, isEnd: n.isEnd, word: n.word, kids: [...n.children.values()].map(snap) });
// leaves left to right, a parent over the middle of its children, y = depth
function layoutOf(t) {
  let leaf = 0;
  const pos = {};
  const place = (n, d) => {
    const x = n.kids.length ? n.kids.map((k) => place(k, d + 1)).reduce((a, b) => a + b, 0) / n.kids.length : leaf++;
    pos[n.id] = { x, y: d };
    return x;
  };
  place(t, 0);
  return pos;
}
const endLabel = (n) => (n.id === '^' ? 'root' : n.ch + (n.isEnd ? '*' : ''));
const wordLabel = (n) => (n.id === '^' ? 'root' : n.ch + (n.word ? '*' : ''));
/** a nodes panel of a snapshot; nodes in `layout` but not in the trie (not made yet / deleted) stay hidden */
function trieP(t, { st = {}, path = [], layout, label, nodeLabel = endLabel } = {}) {
  const pos = layout || layoutOf(t);
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const go = (n, parent) => {
    seen.add(n.id);
    const s = st[n.id] || '';
    nodes.push({ id: n.id, label: nodeLabel(n), x: pos[n.id].x, y: pos[n.id].y, ...(s ? { state: s } : {}) });
    if (parent) {
      const es = path.includes(n.id) ? 'active' : s === 'muted' ? 'muted' : '';
      edges.push({ from: parent.id, to: n.id, ...(es ? { state: es } : {}) });
    }
    n.kids.forEach((k) => go(k, n));
  };
  go(t, null);
  for (const [id, p] of Object.entries(pos)) if (!seen.has(id)) nodes.push({ id, label: '', x: p.x, y: p.y, state: 'hidden' });
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
const stOf = (pairs) => Object.fromEntries(pairs.flatMap(([ids, s]) => ids.map((id) => [id, s])));
const chars = (w) => w.split('');

// ---------- prefix tree: e.g. bus, bun, bunk, by ----------
const PW = ['bus', 'bun', 'bunk', 'by'];
const P_ROOT = build(PW);
const P_LAYOUT = layoutOf(snap(P_ROOT));
const P_NODES = countNodes(P_ROOT);
const P_CHARS = PW.join('').length;
check(P_NODES === 6 && P_CHARS === 12, 'prefix trie size');
const P_SCAN = 'bo';
check(PW.every((w) => !w.startsWith(P_SCAN)), 'no word starts with "bo"');
const pInsert = (() => {
  const root = newRoot();
  return PW.map((w) => {
    const { made, path } = insert(root, w);
    const reused = path.filter((id) => !made.includes(id));
    return {
      say: made.length === w.length ? 0 : 1,
      note: `Insert ${q(w)}: ${reused.length ? `reuse ${reused.map((id) => id.slice(-1)).join(', ')}` : 'nothing to reuse'}; create ${made.map((id) => id.slice(-1)).join(', ')}. Mark ${w.at(-1)}*.`,
      panels: [
        trieP(snap(root), { st: stOf([[reused, 'visited'], [made, 'active']]), path, layout: P_LAYOUT }),
        arr(chars(w), { label: q(w), highlights: hl(w.length, (i) => (made.includes(path[i]) ? 'active' : 'visited')) }),
      ],
    };
  });
})();
const P_BO = walk(P_ROOT, P_SCAN);
const P_BU = walk(P_ROOT, 'bu');
const P_BUN = walk(P_ROOT, 'bun');
check(P_BO.failAt === 1 && P_BU.node && !P_BU.node.isEnd && P_BUN.node.isEnd, 'prefix walks');
const pWalk = (w, r, k, say, note) => {
  const miss = r.failAt === k;
  const cur = miss ? r.path[k - 1] ?? '^' : r.path[k];
  return {
    say,
    note,
    panels: [
      trieP(snap(P_ROOT), { st: { ...stOf([[r.path.slice(0, k), 'visited']]), [cur]: miss ? 'bad' : k === w.length - 1 && r.node.isEnd ? 'done' : 'active' }, path: r.path.slice(0, k + 1), layout: P_LAYOUT }),
      arr(chars(w), { label: `walk(${q(w)})`, pointers: [ptr(k, 'ch')], highlights: hl(w.length, (i) => (i < k ? 'done' : i === k ? (miss ? 'bad' : 'active') : '')) }),
    ],
  };
};
// the turn: search("bit") on the same trie
const P_BIT = walk(P_ROOT, 'bit');
check(P_BIT.failAt === 1 && countNodes(P_ROOT) === P_NODES, 'search bit fails at i and creates nothing');

// ---------- wildcard DFS: e.g. pan, pen, top; query ".op" ----------
const WW = ['pan', 'pen', 'top'];
const W_ROOT = build(WW);
const W_LAYOUT = layoutOf(snap(W_ROOT));
const W_Q = '.op';
/** the template's match, logging every call */
function matchRun(root, word, firstOnly = false) {
  const ev = [];
  const path = [];
  const match = (node, i) => {
    if (node.id !== '^') path.push(node.id);
    let res;
    if (i === word.length) {
      res = node.isEnd;
      ev.push({ k: 'end', id: node.id, i, res, path: path.slice() });
    } else if (word[i] === '.') {
      ev.push({ k: 'dot', id: node.id, i, kids: [...node.children.keys()], path: path.slice() });
      res = false;
      for (const child of node.children.values()) {
        if (firstOnly) {
          res = match(child, i + 1); // the bug: returns the first child's answer
          break;
        }
        if (match(child, i + 1)) {
          res = true;
          break;
        }
      }
    } else {
      const next = node.children.get(word[i]);
      ev.push({ k: next ? 'hit' : 'miss', id: node.id, i, ch: word[i], path: path.slice() });
      res = next ? match(next, i + 1) : false;
    }
    if (node.id !== '^') path.pop();
    return res;
  };
  return { res: match(root, 0), ev };
}
const W_RUN = matchRun(W_ROOT, W_Q);
check(W_RUN.res === true && W_RUN.ev.map((e) => e.k).join() === 'dot,miss,hit,hit,end', 'wildcard run');
const W_PLAIN = walk(W_ROOT, W_Q);
check(W_PLAIN.failAt === 0, 'a plain walk fails on "."');
const pre = (id) => id.slice(1);
const wNote = (e) => {
  if (e.k === 'dot') return `i = ${e.i}, ".": any letter. Try **every** child of the root: ${e.kids.join(', ')}. First ${e.kids[0]}.`;
  if (e.k === 'miss') return `i = ${e.i}, ${q(e.ch)}: ${q(pre(e.id))} has no ${q(e.ch)} child → false. Back up, try the next child.`;
  if (e.k === 'hit') return `i = ${e.i}, ${q(e.ch)}: ${q(pre(e.id))} has it. Go to ${q(pre(e.id) + e.ch)}.`;
  return `i = ${e.i} = length: ${q(pre(e.id))} isEnd → ${e.res}. "top" matches ${q(W_Q)}.`;
};
const wFrames = W_RUN.ev.map((e) => {
  const prior = W_RUN.ev.filter((x) => x.k === 'miss').map((x) => x.id);
  const failed = W_RUN.ev.indexOf(e) > W_RUN.ev.findIndex((x) => x.k === 'miss') ? prior : [];
  return {
    say: e.k === 'dot' ? 1 : e.k === 'end' ? 0 : 2,
    note: wNote(e),
    panels: [
      trieP(snap(W_ROOT), { st: { ...stOf([[failed, 'bad'], [e.path.slice(0, -1), 'visited']]), [e.id]: e.k === 'miss' ? 'bad' : e.k === 'end' ? 'done' : 'active' }, path: e.path, layout: W_LAYOUT }),
      arr(chars(W_Q), { label: `match(${q(W_Q)})`, pointers: [ptr(Math.min(e.i, W_Q.length - 1), 'i')], highlights: hl(W_Q.length, (x) => (x < e.i ? 'done' : x === e.i ? (e.k === 'miss' ? 'bad' : 'active') : '')) }),
    ],
  };
});
// all dots, no word that long: every branch is tried
const W_DOTS = '....';
const W_DOTS_RUN = matchRun(W_ROOT, W_DOTS);
const W_DOTS_VISITED = W_DOTS_RUN.ev.filter((e) => e.id !== '^').length;
check(W_DOTS_RUN.res === false && W_DOTS_VISITED === countNodes(W_ROOT), 'all dots visit the whole trie');
// the turn: return the first child's answer
const W_BUG = matchRun(W_ROOT, W_Q, true);
check(W_BUG.res === false && W_BUG.ev.every((e) => !e.id.startsWith('^t')), 'buggy loop never tries t');

// ---------- binary trie: e.g. [2, 7, 3, 6], 3 bits (b = 2 → 0) instead of 31 ----------
const BITS = 3;
const XN = [2, 7, 3, 6];
const bitsOf = (x) => Array.from({ length: BITS }, (_, k) => (x >> (BITS - 1 - k)) & 1);
const xInsert = (root, x) => insert(root, bitsOf(x).join(''));
const bitLabel = (n) => (n.id === '^' ? 'root' : n.ch);
/** the template's query loop for one x */
function xQuery(root, x) {
  const steps = [];
  let n = root;
  let cur = 0;
  for (let b = BITS - 1; b >= 0; b--) {
    const want = ((x >> b) & 1) ^ 1;
    const win = n.children.has(String(want));
    if (win) (cur |= 1 << b), (n = n.children.get(String(want)));
    else n = n.children.get(String(want ^ 1));
    steps.push({ b, t: want ^ 1, want, win, cur, id: n.id });
  }
  return { steps, cur, partner: parseInt(pre(n.id), 2) };
}
// the template: insert nums[0]; for each x: query, then insert x
const X_ROOT = newRoot();
const X_LOG = [];
let X_BEST = 0;
xInsert(X_ROOT, XN[0]);
for (const x of XN) {
  const before = snap(X_ROOT);
  const r = xQuery(X_ROOT, x);
  X_BEST = Math.max(X_BEST, r.cur);
  X_LOG.push({ x, ...r, best: X_BEST, before });
  xInsert(X_ROOT, x);
}
const X_PAIRS = [];
for (let i = 0; i < XN.length; i++) for (let j = i + 1; j < XN.length; j++) X_PAIRS.push([XN[i], XN[j], XN[i] ^ XN[j]]);
const X_PAIR_MAX = Math.max(...X_PAIRS.map((p) => p[2]));
check(X_BEST === X_PAIR_MAX && X_BEST === 5, 'max xor agrees with all pairs');
const X_LAST = X_LOG.at(-1);
check(X_LAST.x === 6 && X_LAST.steps.map((s) => s.win).join() === 'true,false,true' && X_LAST.partner === 3 && X_LAST.cur === 5, 'last query');
const X_LAYOUT = layoutOf(snap(X_ROOT));
const xP = (t, opts) => trieP(t, { layout: X_LAYOUT, nodeLabel: bitLabel, ...opts });
const xFrames = X_LAST.steps.map((s, k) => {
  const path = X_LAST.steps.slice(0, k + 1).map((z) => z.id);
  return {
    say: s.win ? 0 : 1,
    note: s.win
      ? `Bit ${s.b}: x has ${s.t}, want ${s.want}. It exists: go there, cur |= ${1 << s.b} → cur = ${s.cur}.${k === BITS - 1 ? ` Partner ${X_LAST.partner}: ${X_LAST.x} ^ ${X_LAST.partner} = ${X_LAST.cur}.` : ''}`
      : `Bit ${s.b}: x has ${s.t}, want ${s.want}. Missing: take ${s.t} (this XOR bit is 0). cur stays ${s.cur}.`,
    panels: [
      xP(X_LAST.before, { st: { ...stOf([[path.slice(0, -1), 'visited']]), [s.id]: s.win ? 'done' : 'bad' }, path }),
      arr(bitsOf(X_LAST.x), { label: `x = ${X_LAST.x}, bits 2 → 0`, pointers: [ptr(k, 'b')], highlights: hl(BITS, (i) => (i < k ? 'visited' : i === k ? 'active' : '')) }),
      vars({ want: s.want, cur: s.cur }),
    ],
  };
});
// the turn: query x = 5 on the finished trie
const X_T = 5;
const X_TQ = xQuery(X_ROOT, X_T);
const X_SAME = (() => {
  let n = X_ROOT;
  for (let b = BITS - 1; b >= 0; b--) {
    const t = String((X_T >> b) & 1);
    n = n.children.get(n.children.has(t) ? t : String(t ^ 1));
  }
  return parseInt(pre(n.id), 2);
})();
check(X_TQ.partner === 2 && X_TQ.cur === 7 && X_SAME === 7, 'turn query');

// ---------- trie-guided grid search: e.g. words sea, set, tan ----------
const GB = [
  ['s', 'e', 'a'],
  ['x', 't', 'n'],
];
const GW = ['sea', 'set', 'tan'];
/** the template's findWords, logging every call */
function findWordsRun(board, words) {
  const root = newRoot();
  for (const w of words) insert(root, w).node.word = w;
  const layout = layoutOf(snap(root));
  const B = board.map((r) => [...r]);
  const found = [];
  const ev = [];
  const cells = [];
  const log = (e) => ev.push({ ...e, cells: cells.slice(), trie: snap(root), found: found.slice() });
  const dfs = (r, c, parent) => {
    const ch = B[r][c];
    const node = parent.children.get(ch);
    if (!node) return log({ k: 'prune', r, c, ch, at: parent.id });
    cells.push([r, c, node.id]);
    let rec = null;
    if (node.word) {
      rec = node.word;
      found.push(node.word);
      node.word = null;
    }
    log({ k: 'enter', r, c, id: node.id, rec });
    B[r][c] = '#';
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nc >= 0 && nr < B.length && nc < B[0].length && B[nr][nc] !== '#') dfs(nr, nc, node);
    }
    B[r][c] = ch;
    cells.pop();
    if (node.children.size === 0 && !node.word) {
      parent.children.delete(ch);
      log({ k: 'delete', id: node.id });
    }
  };
  for (let r = 0; r < B.length; r++) for (let c = 0; c < B[0].length; c++) dfs(r, c, root);
  return { found, ev, root, layout };
}
const G = findWordsRun(GB, GW);
const gSig = G.ev.map((e) => (e.k === 'prune' ? `-${e.ch}` : e.k === 'delete' ? `x${pre(e.id)}` : `+${pre(e.id)}`)).join(' ');
check(gSig === '+s -x +se +set -n -x xset +sea -n xsea xse xs -e -a -x +t -e -n -x -n', `grid run: ${gSig}`);
check(G.found.join() === 'set,sea' && countNodes(G.root) === 3, 'grid result');
const G_TOTAL_NODES = countNodes(build(GW));
const gGrid = (cells, cur, curState) => grid(GB, GB.map((row, r) => row.map((_, c) => (cur && cur[0] === r && cur[1] === c ? curState : cells.some(([pr, pc]) => pr === r && pc === c) ? 'visited' : ''))), 'board');
const gFound = (e) => arr(e.found.length ? e.found : ['—'], { label: 'found', showIndices: false, highlights: e.rec ? { [e.found.length - 1]: 'active' } : {} });
const gFrame = (i, say, note) => {
  const e = G.ev[i];
  const ids = e.cells.map((x) => x[2]);
  const cur = e.k === 'delete' ? null : [e.r, e.c];
  const curState = e.k === 'prune' ? 'bad' : e.rec ? 'done' : 'active';
  const st = e.k === 'prune' ? { ...stOf([[ids, 'visited']]), [e.at]: 'active' } : e.k === 'enter' ? { ...stOf([[ids.slice(0, -1), 'visited']]), [e.id]: e.rec ? 'done' : 'active' } : stOf([[ids, 'visited']]);
  return { say, note, panels: [gGrid(e.cells, cur, curState), trieP(e.trie, { layout: G.layout, nodeLabel: wordLabel, st, path: ids }), gFound(e)] };
};
const gAt = (sig) => {
  const i = G.ev.findIndex((e, k) => (e.k === 'prune' ? `-${e.ch}` : e.k === 'delete' ? `x${pre(e.id)}` : `+${pre(e.id)}`) === sig && k >= gAt.from);
  check(i >= 0, `grid event ${sig}`);
  gAt.from = i + 1;
  return i;
};
gAt.from = 0;
const gFrames = [
  gFrame(gAt('+s'), 0, '(0, 0) "s": the root has an "s" child. Carry that node into the DFS.'),
  gFrame(gAt('-x'), 1, 'Neighbour "x" at (1, 0): "s" has no "x" child. No word starts "sx": prune.'),
  gFrame(gAt('+se'), 0, '"e" at (0, 1): child exists. Path "se", still a prefix of two words.'),
  gFrame(gAt('+set'), 2, '"t" at (1, 1) below: node "set" holds a word. Record "set", clear node.word.'),
  gFrame(gAt('xset'), 3, 'Its neighbours n, x are pruned. "set" has no word and no children left: delete it.'),
  gFrame(gAt('+sea'), 2, 'Back at "se", right: "a" at (0, 2). Record "sea", clear it.'),
  gFrame(gAt('xs'), 3, 'Unwinding deletes "sea", then "se", then "s": the whole branch is dead and gone.'),
];
const G_ROOT_PRUNES = G.ev.slice(gAt.from, G.ev.findIndex((e) => e.k === 'enter' && e.id === '^t')).map((e) => e.ch);
check(G_ROOT_PRUNES.join() === 'e,a,x', 'root prunes before t');
{
  const e = G.ev[gAt.from + G_ROOT_PRUNES.length - 1];
  gFrames.push({ say: 1, note: `Start cells ${G_ROOT_PRUNES.map(q).join(', ')}: the root has no such child. Each is pruned at once.`, panels: [gGrid([], null), trieP(e.trie, { layout: G.layout, nodeLabel: wordLabel }), gFound(e)] });
}
const G_T = G.ev.filter((e) => e.k === 'prune' && e.at === '^t').map((e) => e.ch);
check(G_T.join() === 'e,n,x', 'turn: t prunes all neighbours');

export default [
  {
    id: 'trie-prefix-tree',
    title: 'Ask "starts with?" in L steps, however many words',
    steps: [
      {
        kind: 'watch',
        title: 'Scanning repeats the work',
        lines: ['"Does any word start with p?" Checking a prefix against n words one by one costs **O(n·L)**.'],
        frames: [
          {
            say: 0,
            note: `e.g. ${PW.length} words, p = "${P_SCAN}": all ${PW.length} startsWith checks fail. Every query rescans the list.`,
            panels: [arr(PW, { label: 'scan every word', showIndices: false, highlights: hl(PW.length, () => 'bad') }), vars({ p: P_SCAN, checked: PW.length, found: 'none' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Insert: walk what exists, create the rest',
        lines: ['Each node is a prefix; each edge adds one character.', 'Missing child → `node.children.set(ch, new TrieNode())`. At the end, `node.isEnd = true`.'],
        frames: [
          ...pInsert,
          {
            say: 0,
            note: `${P_CHARS} characters, ${P_NODES} nodes: "bu" and "bun" are stored once and shared.`,
            panels: [trieP(snap(P_ROOT), { layout: P_LAYOUT }), vars({ words: PW.length, characters: P_CHARS, nodes: P_NODES })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'walk: one edge per character',
        lines: ['`node = node.children.get(ch); if (!node) return null;`', 'Path exists = a prefix. A word also needs `isEnd`.'],
        frames: [
          pWalk(P_SCAN, P_BO, 0, 0, '"b": the root has it. Step down one edge.'),
          pWalk(P_SCAN, P_BO, 1, 0, '"o": "b" has no "o" child → null. 2 steps, not 4 word checks.'),
          pWalk('bu', P_BU, 1, 1, '"bu": the walk completes, so startsWith is true. But "u" has no `*`: "bu" is not a word.'),
          pWalk('bun', P_BUN, 2, 1, '"bun": ends on n*, isEnd is true: search("bun") is true.'),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"prefix"**, **"starts with"**, **"autocomplete"**, **"dictionary of words"**, **"root / successor"**, **"implement a trie"**.'],
        frames: [
          {
            say: 0,
            note: 'Only exact-match lookups? A Set is simpler and just as fast. The trie wins on prefixes.',
            panels: [table(['scan all words', 'Set of words', 'trie'], ['per prefix query'], [['O(n · L)'], ['exact match only'], ['O(L)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a word that is not there',
        lines: ['Same trie. Call `search("bit")`.', 'The walk reaches "b"; next character "i".'],
        panels: [trieP(snap(P_ROOT), { st: { '^b': 'active' }, path: ['^b'], layout: P_LAYOUT }), arr(chars('bit'), { label: 'search("bit")', pointers: [ptr(1, 'ch')] })],
        task: {
          type: 'choose',
          question: 'What does search do at "i"?',
          options: [
            { text: 'Create "i" and "t", then return false', why: 'Search must not modify the trie. Only insert creates children.' },
            { text: 'Return false at once; the trie stays as it is' },
            { text: 'Back up and try "u" and "y" instead', why: 'A plain walk follows exactly one path. Trying several children is the DFS for a "." wildcard.' },
            { text: 'Check all 4 words with startsWith', why: 'That is the O(n·L) scan the trie replaces. A missing child already proves no word starts with "bi".' },
          ],
          answer: 1,
        },
        solved: `"b" has no "i" child, so the walk returns null and search is false. Still ${P_NODES} nodes: search never creates.`,
      },
    ],
  },

  {
    id: 'trie-wildcard-dfs',
    title: 'A "." can be any letter: try every branch',
    steps: [
      {
        kind: 'watch',
        title: 'One walk follows one path',
        lines: ['A plain walk follows exactly one path. "." means any letter, so it needs **every** matching child.'],
        frames: [
          {
            say: 0,
            note: `e.g. words ${WW.map(q).join(', ')}, query ${q(W_Q)}. A plain walk looks for a "." child: none, null. But "top" matches.`,
            panels: [
              trieP(snap(W_ROOT), { st: { '^': 'bad' }, layout: W_LAYOUT }),
              arr(chars(W_Q), { label: `walk(${q(W_Q)})`, pointers: [ptr(0, 'ch')], highlights: { 0: 'bad' } }),
            ],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'match(node, word, i)',
        lines: ['`if (i === word.length) return node.isEnd;`', '`ch === "."`: for every child, return true if `match(child, word, i + 1)` does.', 'A letter: follow that one child, or return false.'],
        frames: wFrames,
      },
      {
        kind: 'watch',
        title: 'Worst case and the clue',
        lines: ['Branches die as soon as their prefix fails. All dots try everything.', 'Clues: **"." can match any letter**, **"concatenation of words"**, **"composed of other words in the list"**, **"all words with prefix"**.'],
        frames: [
          {
            say: 0,
            note: `e.g. ${q(W_DOTS)}: no 4-letter word, so every branch is tried: all ${W_DOTS_VISITED} nodes, then false.`,
            panels: [trieP(snap(W_ROOT), { st: stOf([[W_DOTS_RUN.ev.map((e) => e.id).filter((id) => id !== '^'), 'visited']]), layout: W_LAYOUT }), vars({ query: W_DOTS, visited: W_DOTS_VISITED, result: 'false' })],
          },
          {
            say: 1,
            note: 'Word break: from i, walk s[i..]; every isEnd hit is a split point. Memoise positions, or it turns exponential.',
            panels: [table(['"." wildcard', 'split into words', '"*" any length'], ['tool'], [['DFS over children'], ['DFS + memo (DP)'], ['DP over pattern and text']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: return inside the loop',
        lines: ['A teammate writes the "." branch as:', '`for (const child of node.children.values()) return match(child, word, i + 1);`'],
        panels: [trieP(snap(W_ROOT), { layout: W_LAYOUT }), arr(chars(W_Q), { label: `search(${q(W_Q)})`, pointers: [ptr(0, 'i')] })],
        task: {
          type: 'choose',
          question: `What does search(${q(W_Q)}) return now?`,
          options: [
            { text: 'true', why: 'true is the right answer, but this loop returns the "p" branch\'s false before it ever reaches "t".' },
            { text: 'false: only the "p" branch is tried' },
            { text: 'false, after trying "p" and "t"', why: 'If it reached "t", it would find "top" and return true.' },
            { text: 'It throws', why: 'Nothing is missing; it simply returns too early.' },
          ],
          answer: 1,
        },
        solved: 'Under ".", a false from one child only means "try the next one". Return false after the loop, not inside it.',
      },
    ],
  },

  {
    id: 'trie-binary-xor',
    title: 'Maximum XOR: win the highest bit first',
    steps: [
      {
        kind: 'watch',
        title: 'All pairs, and why the top bit decides',
        lines: ['Checking all pairs is **O(n²)**.', 'A higher bit is worth more than all lower bits combined: 2^b > 2^(b−1) + … + 1.'],
        frames: [
          {
            say: 0,
            note: `e.g. [${XN.join(', ')}]: ${X_PAIRS.length} pairs to try for ${XN.length} numbers. Best a ^ b = ${X_PAIR_MAX}.`,
            panels: [table(X_PAIRS.map(([a, b]) => `${a} ^ ${b}`), ['xor'], X_PAIRS.map((p) => [String(p[2])]))],
          },
          {
            say: 1,
            note: 'Bit 2 is worth 4; bits 1 and 0 together are worth 3. Winning bit 2 beats anything below it.',
            panels: [table(['bit 2', 'bits 1 + 0'], ['worth'], [['4'], ['2 + 1 = 3']]), vars({ greedy: 'from the top bit down' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Want the opposite bit',
        lines: ['`want = ((x >> b) & 1) ^ 1`: if that child exists, go there and `cur |= 1 << b`.', 'Otherwise take the same bit: this XOR bit is 0.'],
        frames: [
          {
            say: 0,
            note: `Numbers are bit paths, high bit first (e.g. 3 bits, not 31). Inserted so far: ${XN.slice(0, -1).join(', ')}. Now query x = ${X_LAST.x}.`,
            panels: [xP(X_LAST.before, {}), arr(bitsOf(X_LAST.x), { label: `x = ${X_LAST.x}, bits 2 → 0` }), vars({ cur: 0 })],
          },
          ...xFrames,
          {
            say: 0,
            note: `The template: query each x, then insert it. best = ${X_BEST}, the same as all pairs, with O(32) per query.`,
            panels: [table(X_LOG.map((l) => `x = ${l.x}`), ['partner', 'cur', 'best'], X_LOG.map((l) => [String(l.partner), String(l.cur), String(l.best)]))],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"maximum XOR"**, **"xor of two numbers"**, **"bitwise"**, **"0 <= nums[i] < 2^31"**.'],
        frames: [
          {
            say: 0,
            note: 'For 31-bit inputs, loop b from 30: `1 << 31` is negative in JS. And walk high → low only.',
            panels: [vars({ 'bits used': '30 → 0', '1 << 31': '-2147483648' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: `Your turn: query x = ${X_T}`,
        lines: [`The trie now holds ${XN.join(', ')}. Query x = ${X_T} = ${bitsOf(X_T).join('')}.`],
        panels: [xP(snap(X_ROOT), {}), arr(bitsOf(X_T), { label: `x = ${X_T}, bits 2 → 0` })],
        task: {
          type: 'choose',
          question: 'Which partner does the walk end at?',
          options: [
            { text: `${X_SAME}: ${X_T} ^ ${X_SAME} = ${X_T ^ X_SAME}`, why: 'That follows the SAME bit each time. The walk wants the opposite bit, which makes each XOR bit 1.' },
            { text: `6: ${X_T} ^ 6 = ${X_T ^ 6}`, why: 'Bit 2: x has 1, so the walk wants 0. 6 = 110 starts with 1.' },
            { text: `3: ${X_T} ^ 3 = ${X_T ^ 3}`, why: 'Bits 2 and 1 lead to 01. At bit 0 x has 1 and wants 0: 010 exists, so 3 = 011 is not taken.' },
            { text: `${X_TQ.partner}: ${X_T} ^ ${X_TQ.partner} = ${X_TQ.cur}` },
          ],
          answer: 3,
        },
        solved: `Opposite bit wins at 2, 1 and 0: ${bitsOf(X_T).join('')} ^ ${bitsOf(X_TQ.partner).join('')} = ${bitsOf(X_TQ.cur).join('')} = ${X_TQ.cur}.`,
      },
    ],
  },

  {
    id: 'trie-backtracking-search',
    title: 'One grid search for every word: let the trie prune',
    steps: [
      {
        kind: 'watch',
        title: 'One search per word repeats paths',
        lines: ['Searching for each dictionary word separately repeats work for shared prefixes: w words × grid search.'],
        frames: [
          {
            say: 0,
            note: `e.g. words ${GW.map(q).join(', ')}: 3 separate grid searches. "sea" and "set" both re-walk s → e.`,
            panels: [grid(GB, [['active', 'active', ''], ['', '', '']], 'board'), vars({ words: GW.length, searches: GW.length, 'shared prefix': 'se' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Carry the trie node through the DFS',
        lines: ['`node = parent.children.get(ch); if (!node) return;`: prune.', 'Start from every cell. Step into a neighbour only if the trie has its letter.', '`if (node.word)`: record it, then `node.word = null`.', 'After exploring: no children and no word → delete the leaf.'],
        frames: gFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"find all words from the dictionary in the board"**, **"stream of characters"**, **"suffix of the stream is a word"**, **"concatenation is a palindrome"**.'],
        frames: [
          {
            say: 0,
            note: 'Stream: store words reversed, then "the stream ends with a word" becomes a prefix walk from the newest letter.',
            panels: [table(['words in a grid', 'stream of characters', 'palindrome pairs'], ['trie of'], [['words'], ['reversed words'], ['reversed words']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: start at "t"',
        lines: [`Found so far: ${G.found.map(q).join(', ')}. The trie left is root → t → a → n.`, 'Next start cell: (1, 1) "t". Its neighbours are "e", "n" and "x".'],
        panels: [gGrid([], [1, 1], 'active'), trieP(G.ev[gAt.from + G_ROOT_PRUNES.length - 1].trie, { layout: G.layout, nodeLabel: wordLabel, st: { '^t': 'active' }, path: ['^t'] })],
        task: {
          type: 'choose',
          question: 'Which neighbours does the DFS step into from "t"?',
          options: [
            { text: 'None: all three are pruned' },
            { text: '"e": it builds "te"', why: '"t" has no "e" child: no word starts with "te".' },
            { text: '"a" at (0, 2)', why: '(0, 2) is diagonal. The DFS only moves up, down, left and right.' },
            { text: 'All three: "e", "n" and "x"', why: 'That is plain grid DFS. The trie stops each step, because no word continues that way.' },
          ],
          answer: 0,
        },
        solved: `"t" only has the child "a", and no neighbour is "a". "tan" is not in the board; found = ${G.found.map(q).join(', ')}.`,
      },
    ],
  },
];
