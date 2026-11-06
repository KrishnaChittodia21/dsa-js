// Shorts for Backtracking (M9). Format: src/content/shortSchema.js. Facts come only from topics/backtracking/topic.js.
// Every tree, path, used[] flag, Set, board and result below is produced by running the pattern's template on its
// "e.g." input (inputs differ from the step lessons').
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'path') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const sub = (p) => (p.length ? p.join('') : '∅'); // short node label: [5, 8] → "58"
const show = (p) => `[${p.join(', ')}]`;
const neg = (v) => String(v).replace('-', '−');
const setText = (s) => `{${[...s].map(neg).join(', ')}}`;
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/backtracking.js: ${msg}`);
};

// ---------- recorder: the decision tree built while the template runs ----------
// enter = walk into a child (choose), leave = come back (undo), prune = a child we refuse to walk into.
function tree(run) {
  const nodes = [];
  const ev = [];
  const open = [];
  const add = (label, edge, bad) => {
    const id = nodes.length;
    nodes.push({ id, label: String(label), edge, bad, parent: open.length ? open.at(-1) : null, depth: open.length });
    return id;
  };
  run({
    enter(label, info = {}, edge = '') {
      const id = add(label, edge, false);
      open.push(id);
      ev.push({ kind: 'in', id, open: open.slice(), ...info });
    },
    leave(info = {}) {
      const id = open.pop();
      ev.push({ kind: 'out', id, open: open.slice(), ...info });
    },
    prune(label, info = {}, edge = '') {
      const id = add(label, edge, true);
      ev.push({ kind: 'bad', id, open: open.slice(), ...info });
    },
  });
  let leaf = 0;
  const place = (id) => {
    const kids = nodes.filter((n) => n.parent === id);
    nodes[id].x = kids.length ? kids.map((k) => place(k.id)).reduce((a, b) => a + b, 0) / kids.length : leaf++;
    return nodes[id].x;
  };
  place(0);
  return { nodes, ev };
}
// the tree after event t: unseen nodes hidden, the open path visited (current node active), finished done, pruned bad
function treeAt(T, t, label) {
  const seen = new Set();
  const done = new Set();
  for (let k = 0; k <= t; k++) (T.ev[k].kind === 'out' ? done : seen).add(T.ev[k].id);
  const e = T.ev[t];
  const cur = e.kind === 'in' ? e.id : e.open.at(-1);
  const open = new Set(e.open);
  return {
    kind: 'nodes',
    label,
    directed: true,
    nodes: T.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.depth,
      state: !seen.has(n.id) ? 'hidden' : n.bad ? 'bad' : n.id === cur ? 'active' : open.has(n.id) ? 'visited' : done.has(n.id) ? 'done' : '',
    })),
    edges: T.nodes
      .filter((n) => n.parent !== null)
      .map((n) => ({ from: n.parent, to: n.id, ...(n.edge ? { label: n.edge } : {}), ...(n.bad ? { state: 'muted' } : open.has(n.id) ? { state: 'active' } : done.has(n.id) ? { state: 'done' } : {}) })),
  };
}
// one frame per event (events with `skip` are folded into a later note)
const frames = (T, label) => T.ev.map((e, t) => (e.skip ? null : { say: e.say, note: e.note, panels: [treeAt(T, t, label), ...e.panels] })).filter(Boolean);

// ---------- subsets: loop from start on e.g. [5, 8, 9] ----------
const SU = [5, 8, 9];
const SU_RES = [];
const SUB = tree((T) => {
  const path = [];
  let popped = [];
  const bt = (start) => {
    SU_RES.push(path.slice());
    const undo = popped.length ? `Undo: pop ${popped.join(', pop ')}. ` : '';
    popped = [];
    const rec = arr(SU_RES.map(sub), { label: 'result (copies)', highlights: { [SU_RES.length - 1]: 'active' } });
    T.enter(
      sub(path),
      {
        say: !path.length ? 0 : undo ? 2 : 1,
        note: !path.length ? 'Root: record a copy of []. The loop starts at 0.' : `${undo}Choose ${path.at(-1)}: push, explore. Record a copy of ${show(path)}.`,
        panels: [stk(path.slice()), rec],
      },
      path.length ? `+${path.at(-1)}` : '',
    );
    for (let i = start; i < SU.length; i++) {
      path.push(SU[i]);
      bt(i + 1);
      path.pop();
      popped.push(SU[i]);
    }
    T.leave({ skip: true });
  };
  bt(0);
  check(path.length === 0, 'subsets: path must end empty');
});
const SU_AT8 = SUB.ev.findIndex((e) => e.kind === 'in' && SUB.nodes[e.id].label === '8'); // for the question
check(SU_RES.length === 2 ** SU.length, 'subsets: 2^n results');
const SU_KIDS = SU.slice(SU.indexOf(8) + 1);
check(SU_KIDS.length === 1 && SU_KIDS[0] === 9, 'subsets: [8] has the single child [8, 9]');

// ---------- permutations: used[] on e.g. [4, 6, 8] ----------
const PE = [4, 6, 8];
const usedPanel = (used) => arr(used.map((u) => (u ? 'T' : 'F')), { label: 'used[]', highlights: hl(used.length, (k) => (used[k] ? 'active' : '')) });
const PE_SHOW = ['', '4', '46', '468', '48', '486', '6', '64', '648']; // the nodes the story stops at
function permute(nums, resetUsed = true) {
  const res = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  const T = tree((t) => {
    let popped = [];
    const bt = (i) => {
      const leaf = path.length === nums.length;
      if (leaf) res.push(path.slice());
      const undo = popped.length ? `Undo ${popped.join(', then ')}: pop and set used = F. ` : '';
      popped = [];
      const label = path.join('');
      t.enter(
        sub(path),
        {
          skip: !PE_SHOW.includes(label),
          say: !path.length ? 0 : leaf ? 3 : undo ? 2 : 1,
          note: !path.length ? 'Root: nothing placed. Position 0 may take any element.' : `${undo}Choose ${nums[i]}: used[${i}] = T, push.${leaf ? ` Full length: record ${show(path)}.` : ''}`,
          panels: [usedPanel(used), stk(path.slice())],
        },
        path.length ? `+${nums[i]}` : '',
      );
      if (!leaf)
        for (let j = 0; j < nums.length; j++) {
          if (used[j]) continue;
          used[j] = true;
          path.push(nums[j]);
          bt(j);
          path.pop();
          if (resetUsed) used[j] = false;
          popped.push(nums[j]);
        }
      t.leave({ skip: true });
    };
    bt(-1);
  });
  return { T, res };
}
const PERM = permute(PE);
check(PERM.res.length === 6, 'permutations: 3! results');
const PERM_BUG = permute(PE, false).res;
// a start index instead of used[]: only increasing orders reach full length
const startOnly = (() => {
  let full = 0;
  const bt = (start, len) => {
    if (len === PE.length) full++;
    for (let i = start; i < PE.length; i++) bt(i + 1, len + 1);
  };
  bt(0, 0);
  return full;
})();
check(startOnly === 1 && PERM_BUG.length === 1, 'permutations: start index / bug give one result');

// ---------- combinations: combinationSum on e.g. candidates [5, 3, 2], target 5 ----------
const CS_IN = [5, 3, 2];
const CS_T = 5;
// the lesson's brute force, keeping every sequence that hits the target (before de-duplicating)
const BRUTE = [];
{
  const gen = (seq, s) => {
    if (s > CS_T) return;
    if (s === CS_T) return BRUTE.push(seq);
    for (const c of CS_IN) gen([...seq, c], s + c);
  };
  gen([], 0);
}
const BRUTE_KEYS = [...new Set(BRUTE.map((q) => [...q].sort((a, b) => a - b).join(',')))];
function combinationSum(candidates0, target) {
  const candidates = [...candidates0].sort((a, b) => a - b);
  const res = [];
  const path = [];
  const kids = {}; // node label → children tried, for the question
  const T = tree((t) => {
    const panels = (rem, start) => [stk(path.slice()), vars({ remaining: rem, start })];
    const bt = (start, rem) => {
      if (rem === 0) res.push(path.slice());
      t.enter(sub(path), { say: rem === 0 ? 0 : 2, note: !path.length ? `Sorted: [${candidates.join(', ')}]. Root: remaining ${rem}.` : `Push ${path.at(-1)}, recurse with i = ${start}: remaining ${rem}.${rem === 0 ? ` 0: record ${show(path)}.` : ''}`, panels: panels(rem, start) }, path.length ? `+${path.at(-1)}` : '');
      kids[sub(path)] = [];
      if (rem > 0)
        for (let i = start; i < candidates.length; i++) {
          if (candidates[i] > rem) {
            kids[sub(path)].push(`${candidates[i]} break`);
            t.prune(sub([...path, candidates[i]]), { say: 1, note: `${candidates[i]} > ${rem}: break. Sorted, so ${i + 1 < candidates.length ? 'every later one is too big too' : 'nothing after it'}.`, panels: panels(rem, start) }, `+${candidates[i]}`);
            break;
          }
          kids[sub(path)].push(candidates[i]);
          path.push(candidates[i]);
          bt(i, rem - candidates[i]);
          path.pop();
        }
      t.leave({ skip: true });
    };
    bt(0, target);
  });
  return { T, res, kids, candidates };
}
const CS = combinationSum(CS_IN, CS_T);
check(CS.res.map(show).join('|') === '[2, 3]|[5]', 'combinationSum: [2,3] and [5]');
check(BRUTE.length === 3 && BRUTE_KEYS.length === 2, 'brute force: 3 sequences, 2 combinations');
const CT_IN = [2, 4, 5, 7];
const CT_T = 9;
const CT = combinationSum(CT_IN, CT_T);
check(CT.kids['4'].join('|') === '4|5|7 break', 'turn: node [4] tries 4, 5, then breaks at 7');

// ---------- strings: partition (template, isValid = palindrome) on e.g. "aba" ----------
const isPal = (p) => p === [...p].reverse().join('');
function partition(s) {
  const res = [];
  const path = [];
  const T = tree((t) => {
    const sArr = (start, end, bad) => arr([...s], { label: 's', ...(start < s.length ? { pointers: [ptr(start, 'start')] } : {}), highlights: hl(s.length, (k) => (k < start ? 'done' : end !== undefined && k < end ? (bad ? 'bad' : 'active') : '')) });
    const bt = (start, note) => {
      const leaf = start === s.length;
      if (leaf) res.push(path.slice());
      t.enter(path.length ? path.at(-1) : '∅', { say: leaf ? 2 : 0, note: leaf ? `${note} start = ${s.length}: all cut. Record ${show(path.map((p) => `"${p}"`))}.` : note, panels: [sArr(start), stk(path.map((p) => `"${p}"`))] });
      if (!leaf)
        for (let end = start + 1; end <= s.length; end++) {
          const piece = s.slice(start, end);
          if (!isPal(piece)) {
            t.prune(piece, { say: 1, note: `"${piece}" is not a palindrome: continue. Nothing below it is built.`, panels: [sArr(start, end, true), stk(path.map((p) => `"${p}"`))] });
            continue;
          }
          path.push(piece);
          bt(end, `Cut "${piece}" (a palindrome): push, explore from ${end}.`);
          path.pop();
        }
      t.leave({ skip: true });
    };
    bt(0, `Root: cut "${s}" from start = 0.`);
  });
  return { T, res };
}
const PS = 'aba';
const PAR = partition(PS);
check(PAR.res.map((r) => r.join('|')).join(' ') === 'a|b|a aba', 'partition aba');
// generate everything, then filter: every set of cuts in the n − 1 gaps
const CUTS = Array.from({ length: 2 ** (PS.length - 1) }, (_, m) => {
  const pieces = [];
  let from = 0;
  for (let g = 1; g < PS.length; g++)
    if (m & (1 << (g - 1))) {
      pieces.push(PS.slice(from, g));
      from = g;
    }
  pieces.push(PS.slice(from));
  return pieces;
});
const PT = 'abba';
const PT_FIRST = Array.from({ length: PT.length }, (_, k) => PT.slice(0, k + 1)).filter(isPal);
check(PT_FIRST.join('|') === 'a|abba', 'turn: first cuts of abba');
const PT_ALL = partition(PT).res;

// ---------- constraints: N-Queens (template) on e.g. n = 3 ----------
const QN = 3;
const Q_FRAMES = [];
const Q_EV = []; // tree events: placements only
let Q_PLACED = 0;
let Q_SOLUTIONS = 0;
{
  const cols = new Set();
  const diag = new Set();
  const anti = new Set();
  const queenCol = [];
  const hit = (row, c) => (cols.has(c) ? 'col' : diag.has(row - c) ? 'diag' : anti.has(row + c) ? 'anti' : '');
  const board = (row, marks = {}) =>
    grid(
      Array.from({ length: QN }, (_, r) => Array.from({ length: QN }, (_, c) => (queenCol[r] === c ? 'Q' : '·'))),
      Array.from({ length: QN }, (_, r) => Array.from({ length: QN }, (_, c) => (r === row && marks[c] ? marks[c] : queenCol[r] === c ? 'done' : ''))),
      `${QN}×${QN} board`,
    );
  const sets = () => vars({ cols: setText(cols), 'diag (r−c)': setText(diag), 'anti (r+c)': setText(anti) });
  let undone = [];
  const flushUndo = () => {
    if (!undone.length) return;
    Q_FRAMES.push({ say: 2, note: `Undo ${undone.map(([r, c]) => `(${r},${c})`).join(', then ')}: delete from all three Sets, pop queenCol.`, panels: [board(-1), sets()], t: Q_EV.length - 1 });
    undone = [];
  };
  const place = (row) => {
    if (row === QN) {
      Q_SOLUTIONS++;
      return;
    }
    const tried = []; // attacked columns of this row so far
    let placed = false;
    for (let c = 0; c < QN; c++) {
      const why = hit(row, c);
      if (why) {
        tried.push(`c${c} ${why}`);
        continue;
      }
      placed = true;
      flushUndo();
      cols.add(c);
      diag.add(row - c);
      anti.add(row + c);
      queenCol.push(c);
      Q_PLACED++;
      Q_EV.push({ kind: 'in', row, c });
      const marks = Object.fromEntries(tried.map((x) => [+x[1], 'bad']));
      marks[c] = 'active';
      Q_FRAMES.push({ say: tried.length ? 1 : 0, note: `Row ${row}: ${tried.length ? `${tried.join(', ')} attacked; ` : ''}column ${c} is safe. Place: cols + ${c}, diag + ${neg(row - c)}, anti + ${row + c}.`, panels: [board(row, marks), sets()], t: Q_EV.length - 1 });
      place(row + 1);
      cols.delete(c);
      diag.delete(row - c);
      anti.delete(row + c);
      queenCol.pop();
      Q_EV.push({ kind: 'out', row, c });
      undone.push([row, c]);
    }
    if (!placed) {
      flushUndo();
      Q_FRAMES.push({ say: 1, note: `Row ${row}: ${tried.join(', ')}. No safe column: dead end, go back up.`, panels: [board(row, Object.fromEntries(tried.map((x) => [+x[1], 'bad']))), sets()], t: Q_EV.length - 1 });
    }
  };
  place(0);
  flushUndo();
}
check(Q_SOLUTIONS === 0 && Q_PLACED === 5, 'queens n=3: no solution, 5 placements');
// the placement tree: one node per queen placed, labelled by its column
const QT = tree((t) => {
  t.enter('·', { skip: true });
  for (const e of Q_EV) e.kind === 'in' ? t.enter(`c${e.c}`) : t.leave();
  t.leave();
});
const qFrames = Q_FRAMES.map((f) => ({ say: f.say, note: f.note, panels: [f.panels[0], treeAt(QT, f.t + 1, 'queens placed (column per row)'), f.panels[1]] }));
// the turn: e.g. 5×5 with queens at (0,1) and (1,3); which column of row 2 is safe?
const TQ = [
  [0, 1],
  [1, 3],
];
const TQ_SETS = { cols: new Set(TQ.map(([, c]) => c)), diag: new Set(TQ.map(([r, c]) => r - c)), anti: new Set(TQ.map(([r, c]) => r + c)) };
const tqWhy = (c) => (TQ_SETS.cols.has(c) ? 'cols' : TQ_SETS.diag.has(2 - c) ? 'diag' : TQ_SETS.anti.has(2 + c) ? 'anti' : '');
const TQ_SAFE = [0, 1, 2, 3, 4].filter((c) => !tqWhy(c));
check(TQ_SAFE.join() === '0' && tqWhy(2) === 'anti' && tqWhy(4) === 'diag', 'turn: only column 0 is safe');

// ---------- grid paths: exist (template) on e.g. board [S E A / E B X], word "SEA" ----------
const DIRS = [
  [1, 0, '↓'],
  [-1, 0, '↑'],
  [0, 1, '→'],
  [0, -1, '←'],
];
function exist(board0, word, restore = true) {
  const board = board0.map((r) => r.slice());
  const R = board.length;
  const C = board[0].length;
  const path = [];
  let found = false;
  const T = tree((t) => {
    const pic = (cur, bad) => grid(board, board.map((row, r) => row.map((v, c) => (bad && bad[0] === r && bad[1] === c ? 'bad' : cur && cur[0] === r && cur[1] === c ? 'active' : v === '#' ? 'visited' : ''))), `word "${word}"`);
    const panels = (k, cur, bad) => [pic(cur, bad), stk(path.slice(), 'path (r,c)'), vars({ k, need: k < word.length ? word[k] : '—' })];
    const dfs = (r, c, k, edge) => {
      if (k === word.length) return true;
      if (r < 0 || c < 0 || r >= R || c >= C) return false;
      if (board[r][c] !== word[k]) {
        t.prune(board[r][c], { say: 0, note: board[r][c] === '#' ? `(${r},${c}) is #: already on this path. false.` : `(${r},${c}) is ${board[r][c]}, need ${word[k]}. false.`, panels: panels(k, null, [r, c]) }, edge);
        return false;
      }
      const saved = board[r][c];
      board[r][c] = '#';
      path.push(`${r},${c}`);
      const last = k + 1 === word.length;
      t.enter(saved, { say: 1, note: `(${r},${c}) = ${saved} matches word[${k}]: mark it #.${last ? ` Next call has k = ${k + 1} = word.length: true.` : ''}`, panels: panels(k + 1, [r, c]) }, edge);
      let f = false;
      for (const [dr, dc, a] of DIRS) if ((f = dfs(r + dr, c + dc, k + 1, a))) break;
      if (restore) board[r][c] = saved;
      path.pop();
      t.leave({ skip: f && path.length > 0, say: 2, note: f ? `Every call restores its cell on the way up. exist returns true; board unchanged.` : `No neighbour works: restore (${r},${c}) to ${saved}. Return false.`, panels: panels(k, null) });
      return f;
    };
    t.enter('start', { skip: true });
    outer: for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++)
        if (board[r][c] === word[0] && dfs(r, c, 0, `(${r},${c})`)) {
          found = true;
          break outer;
        }
    t.leave({ skip: true });
  });
  return { T, found, board };
}
const WB = [
  ['S', 'E', 'A'],
  ['E', 'B', 'X'],
];
const WW = 'SEA';
const WS = exist(WB, WW);
check(WS.found && WS.board.flat().join('') === WB.flat().join(''), 'word search: found, board restored');
// the turn: no restore on e.g. [C A / B A], "ABCA"
const TB = [
  ['C', 'A'],
  ['B', 'A'],
];
const TW = 'ABCA';
check(exist(TB, TW).found && !exist(TB, TW, false).found, 'turn: restore matters');

export default [
  {
    id: 'backtracking-subsets',
    title: 'Every subset from one path: push, record, pop',
    steps: [
      {
        kind: 'watch',
        title: 'n yes/no questions, 2ⁿ answers',
        lines: ['List **all subsets**: for each element, take it or skip it.', 'n nested loops would need a fixed n. One recursive call per level adapts to any n.'],
        frames: [
          {
            say: 0,
            note: `e.g. nums = ${show(SU)}: three take/skip questions, so 2³ = ${2 ** SU.length} subsets to list.`,
            panels: [arr(SU, { label: 'nums' }), vars({ n: SU.length, subsets: `2³ = ${2 ** SU.length}` })],
          },
          {
            say: 1,
            note: 'No shortcut when you must list them all. Backtracking lists each once, reusing one path array: O(n) extra.',
            panels: [stk([], 'path (one shared array)'), vars({ output: `${2 ** SU.length} subsets`, 'extra memory': 'O(n)' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Every node is an answer',
        lines: ['`result.push([...path])`: every node records a **copy**.', '`path.push(nums[i])`, then `backtrack(i + 1)`: only **later** elements.', '`path.pop()`: undo, so the next sibling starts from the same path.'],
        frames: frames(SUB, `subsets of ${show(SU)}`),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"all subsets"**, **"power set"**, **"every possible selection"**, **n ≤ 20**.'],
        frames: [
          {
            say: 0,
            note: '2ⁿ nodes, an O(n) copy each: O(n · 2ⁿ). For n = 20 about 20 million, fine. Only a count or best? DP.',
            panels: [vars({ nodes: '2ⁿ', 'per node': 'O(n) copy', total: 'O(n · 2ⁿ)', 'n > ~25': 'too many to list' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the children of [8]',
        lines: [`Same run on ${show(SU)}. The walk has just recorded [8].`, '`backtrack(start)` was called with start = 2.'],
        panels: [treeAt(SUB, SU_AT8, `subsets of ${show(SU)}`), arr(SU, { label: 'nums', pointers: [ptr(2, 'start')] }), stk([8])],
        task: {
          type: 'choose',
          question: 'Which children does node [8] get?',
          options: [
            { text: '+5 and +9: [8, 5] and [8, 9]', why: '[8, 5] is the same subset as [5, 8], already recorded. The loop starts at start, after 8.' },
            { text: '+8 and +9: [8, 8] and [8, 9]', why: 'That loop would start at i, not i + 1: 8 is picked again. Recurse with i + 1.' },
            { text: `Only +${SU_KIDS[0]}: [8, 9]` },
            { text: 'None: [8] is a leaf', why: '9 comes after 8 and is still undecided, so [8] has one more child.' },
          ],
          answer: 2,
        },
        solved: 'The start index only moves forward, so each subset has exactly one path in the tree: [8, 9], never [9, 8].',
      },
    ],
  },

  {
    id: 'backtracking-permutations',
    title: 'Every order: used[] instead of a start index',
    steps: [
      {
        kind: 'watch',
        title: 'Order matters',
        lines: ['List **all orderings** of the input.', 'A start index only moves forward, so an earlier element can never come later.'],
        frames: [
          {
            say: 1,
            note: `e.g. ${show(PE)}. With a start index only ${startOnly} order reaches full length: [4, 6, 8]. We need 3! = 6.`,
            panels: [table(['start index', 'used[]'], ['6 first, then 4?', 'full orders'], [['no', String(startOnly)], ['yes', String(PERM.res.length)]], `orderings of ${show(PE)}`)],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Fill positions, skip the used',
        lines: ['Loop `i` from **0**; `if (used[i]) continue`.', 'Choose: `used[i] = true; path.push(nums[i])`, then explore.', 'Undo **both**: `path.pop(); used[i] = false`.', '`path.length === n`: a leaf, record a copy.'],
        frames: frames(PERM.T, `orderings of ${show(PE)}`),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"all permutations"**, **"all possible orderings / arrangements"**, **"every order"**, **n ≤ 8–10**.'],
        frames: [
          {
            say: 0,
            note: 'n choices, then n − 1, …: n! leaves, an O(n) copy each: O(n · n!). n = 10 → 36 million.',
            panels: [vars({ 'level 0': 'n choices', 'level 1': 'n − 1', leaves: 'n!', total: 'O(n · n!)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: half an undo',
        lines: [`Same ${show(PE)}, but the undo line is only \`path.pop()\`.`, '`used[i] = false` is missing.'],
        panels: [usedPanel([true, true, true]), stk(PE.slice()), vars({ undo: 'path.pop() only' })],
        task: {
          type: 'choose',
          question: 'How many permutations does it record?',
          options: [
            { text: '6', why: 'used[] stays T after each element is popped, so no other branch can pick it again.' },
            { text: String(PERM_BUG.length) },
            { text: '3', why: 'After [4, 6, 8] every flag is T forever. Every later loop skips every element.' },
            { text: 'It never stops', why: 'The loop skips used elements and ends; the output is silently wrong.' },
          ],
          answer: 1,
        },
        solved: `Only ${show(PERM_BUG[0])}. Every change made in choose (path and used[]) must be undone.`,
      },
    ],
  },

  {
    id: 'backtracking-combinations',
    title: 'Sum to a target once per group: start at i, break when too big',
    steps: [
      {
        kind: 'watch',
        title: 'Same group, many orders',
        lines: ['"Return all **unique combinations** that sum to target; a number may be reused."', 'Generating sequences in any order builds each group several times.'],
        frames: [
          {
            say: 1,
            note: `e.g. candidates ${show(CS_IN)}, target ${CS_T}. Any order: ${BRUTE.map(show).join(', ')}. ${BRUTE.length} sequences, ${BRUTE_KEYS.length} groups.`,
            panels: [table(BRUTE.map(show), ['sorted key'], BRUTE.map((q) => [show([...q].sort((a, b) => a - b))]), 'brute force'), vars({ sequences: BRUTE.length, 'unique groups': BRUTE_KEYS.length })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'One path per group',
        lines: ['`remaining === 0`: record a copy.', '`candidates[i] > remaining` → `break`: sorted, so later ones are too big.', '`backtrack(i, remaining − c)`: `i` again (reuse), never an earlier index.'],
        frames: frames(CS.T, `target ${CS_T}, sorted ${show(CS.candidates)}`),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"combinations of k numbers"**, **"sum to target"**, **"may be chosen an unlimited number of times"**, **"each number may only be used once"**.'],
        frames: [
          {
            say: 0,
            note: 'Reuse allowed → recurse with i. Each once → i + 1. break needs sorted input: unsorted, it is wrong.',
            panels: [table(['reuse allowed', 'each once', 'duplicates in input'], ['recurse with'], [['i'], ['i + 1'], ['sort, skip i > start && c[i] === c[i − 1]']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the children of [4]',
        lines: [`e.g. candidates ${show(CT_IN)} (sorted), target ${CT_T}, reuse allowed.`, 'The walk is at path [4]: remaining 5, start = 1.'],
        panels: [arr(CT.candidates, { label: 'candidates', pointers: [ptr(1, 'start')] }), stk([4]), vars({ remaining: CT_T - 4, start: 1 })],
        task: {
          type: 'choose',
          question: 'Which children does [4] try?',
          options: [
            { text: '+2, +4 and +5', why: 'Going back to 2 would build [4, 2], the same group as [2, 4]. The loop starts at start = 1.' },
            { text: 'Only +5', why: 'Reuse is allowed: the call was made with i, so 4 may be chosen again.' },
            { text: '+4, +5 and +7', why: '7 > 5 remaining. Sorted, so break ends the loop there.' },
            { text: '+4 and +5, then break at 7' },
          ],
          answer: 3,
        },
        solved: `[4, 4] (remaining 1) and [4, 5] (remaining 0: record). 7 > 5 → break. Results: ${CT.res.map(show).join(', ')}.`,
      },
    ],
  },

  {
    id: 'backtracking-string-construction',
    title: 'Cut a string into valid pieces, pruning bad cuts',
    steps: [
      {
        kind: 'watch',
        title: 'Generate every cut, then filter?',
        lines: ['"Partition s so that **every piece is a palindrome**."', 'Building every way to cut, then checking, builds the bad ones in full.'],
        frames: [
          {
            say: 1,
            note: `e.g. s = "${PS}": ${PS.length - 1} gaps, cut or not → ${CUTS.length} cuttings. Only ${CUTS.filter((p) => p.every(isPal)).length} have all-palindrome pieces.`,
            panels: [table(CUTS.map((p) => p.join(' | ')), ['every piece valid?'], CUTS.map((p) => [p.every(isPal) ? 'yes' : `no: "${p.find((x) => !isPal(x))}"`]), 'generate, then filter')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'One level = one piece',
        lines: ['`piece = s.slice(start, end)` for each `end` after start.', '`if (!isValid(piece)) continue`: the bad cut dies before going deeper.', '`start === s.length`: everything is cut, record a copy.'],
        frames: frames(PAR.T, `pieces of "${PS}"`),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"all possible letter combinations"**, **"generate all valid / well-formed"**, **"partition s such that every substring is…"**, **"insert +, -, * between digits"**, **"restore IP addresses"**.'],
        frames: [
          {
            say: 0,
            note: 'Depth = position in the string. Rules are checked while building, so invalid branches die early.',
            panels: [table(['palindrome partitioning', 'parentheses', 'add operators'], ['checked while building'], [['piece is a palindrome'], ['open and close counts'], ['running value, last operand']])],
          },
          {
            say: 0,
            note: 'Watch for: "05" leading zeros if forbidden; a shared string built with += must be restored.',
            panels: [vars({ '"05"': 'not a valid number', 'cur += ch': 'restore it, or pass cur + ch down' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the first cut of "abba"',
        lines: [`e.g. s = "${PT}", isValid = palindrome.`, 'The root tries `end` = 1, 2, 3, 4.'],
        panels: [arr([...PT], { label: 's', pointers: [ptr(0, 'start')] }), stk([])],
        task: {
          type: 'choose',
          question: 'Which first pieces survive `isValid`?',
          options: [
            { text: `"${PT_FIRST.join('" and "')}"` },
            { text: '"a" only', why: '"abba" reads the same both ways: one piece covering everything is a valid cut.' },
            { text: '"a", "ab", "abb" and "abba"', why: 'Those are all the first cuts; "ab" and "abb" are not palindromes, so continue skips them.' },
            { text: '"a" and "bb"', why: 'The first piece always starts at index 0. "bb" can only be cut later, from start = 1.' },
          ],
          answer: 0,
        },
        solved: `"a" and "abba". The full run returns ${PT_ALL.length}: ${PT_ALL.map((r) => r.join('|')).join(', ')}.`,
      },
    ],
  },

  {
    id: 'backtracking-constraint',
    title: 'Check the rules as you place: N-Queens with three Sets',
    steps: [
      {
        kind: 'watch',
        title: 'Too many boards to check',
        lines: ['Place n queens so **no two attack each other**.', 'Building every board first, then checking, is n^n boards.'],
        frames: [
          {
            say: 1,
            note: `e.g. n = ${QN}: one queen per row, ${QN} columns each → ${QN}³ = ${QN ** QN} boards to build and check.`,
            panels: [vars({ n: QN, 'every board': `${QN}^${QN} = ${QN ** QN}`, '8 queens': '≈ 4.4 billion ways' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Place, check in O(1), undo',
        lines: ['One level = one **row**; the choice = its **column**.', '`cols.has(c) || diag.has(row − c) || anti.has(row + c)` → skip it.', 'Undo: delete from **every** Set and pop `queenCol`.'],
        frames: qFrames,
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"no two queens attack each other"**, **"fill the empty cells"**, **"each row, column and box must contain…"**, **"return all distinct solutions"**.'],
        frames: [
          {
            say: 0,
            note: `${Q_PLACED} queens placed in total prove n = ${QN} has no answer, without building the ${QN ** QN} boards.`,
            panels: [vars({ 'queens placed': Q_PLACED, 'boards built': 0, solutions: Q_SOLUTIONS, 'Sudoku (find one)': 'return true, skip the undo' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a safe square',
        lines: ['e.g. n = 5, queens at (0,1) and (1,3).', `cols ${setText(TQ_SETS.cols)}, diag ${setText(TQ_SETS.diag)}, anti ${setText(TQ_SETS.anti)}.`],
        panels: [
          grid(
            Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => (TQ.some(([qr, qc]) => qr === r && qc === c) ? 'Q' : r === 2 ? '?' : '·'))),
            Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => (TQ.some(([qr, qc]) => qr === r && qc === c) ? 'done' : r === 2 ? 'active' : ''))),
            '5×5 board, row 2',
          ),
          vars({ cols: setText(TQ_SETS.cols), 'diag (r−c)': setText(TQ_SETS.diag), 'anti (r+c)': setText(TQ_SETS.anti) }),
        ],
        task: {
          type: 'choose',
          question: 'Which column of row 2 is safe?',
          options: [
            { text: 'Column 2', why: '2 + 2 = 4 is in anti: (1,3) has 1 + 3 = 4, the same "/" diagonal.' },
            { text: 'Column 4', why: '2 − 4 = −2 is in diag: (1,3) has 1 − 3 = −2, the same "\\" diagonal.' },
            { text: `Column ${TQ_SAFE[0]}` },
            { text: 'Column 1', why: 'cols already holds 1: the queen at (0,1).' },
          ],
          answer: 2,
        },
        solved: 'Column 0: 0 not in cols, 2 − 0 = 2 not in diag, 2 + 0 = 2 not in anti. Three O(1) lookups per square.',
      },
    ],
  },

  {
    id: 'backtracking-grid-path',
    title: 'Find a word in a grid: mark the cell, then restore it',
    steps: [
      {
        kind: 'watch',
        title: 'A path that cannot reuse a cell',
        lines: ['Does the word exist using **adjacent cells (horizontally or vertically)**?', '**The same cell may not be used more than once** in one path.'],
        frames: [
          {
            say: 0,
            note: `e.g. find "${WW}". Start at S; each next letter must be one of the 4 neighbours, not already used.`,
            panels: [grid(WB, WB.map((row) => row.map((v) => (v === 'S' ? 'active' : ''))), `word "${WW}"`)],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Mark, explore 4 neighbours, restore',
        lines: ['Out of the grid, or `board[r][c] !== word[k]` → false.', '`board[r][c] = "#"`: mark it, then try ↓ ↑ → ← with k + 1.', '`board[r][c] = saved`: restore it, so other paths may use it.'],
        frames: frames(WS.T, 'matching cells (edge = direction)'),
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"adjacent cells (horizontally or vertically)"**, **"the same cell may not be used more than once"**, **"word exists in the grid"**.'],
        frames: [
          {
            say: 0,
            note: 'Flood fill marks cells forever. Here "visited" means on the current path, so the mark must be undone.',
            panels: [table(['Number of Islands', 'Word Search'], ['visited means', 'undo the mark?'], [['ever visited', 'no'], ['on this path', 'yes']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: forget the restore',
        lines: [`e.g. board [${TB.map((r) => r.join(' ')).join(' / ')}], word "${TW}".`, 'The restore line `board[r][c] = saved` is missing. The first start, (0,1), fails.'],
        panels: [grid([['C', '#'], ['B', 'A']], [['', 'bad'], ['', '']], 'after the start (0,1) fails'), vars({ word: TW, 'path needed': '(1,1) (1,0) (0,0) (0,1)' })],
        task: {
          type: 'choose',
          question: 'What does exist return now?',
          options: [
            { text: 'true', why: 'With the restore, yes. Without it, (0,1) stays "#", and the only path needs it as the last A.' },
            { text: 'false' },
            { text: 'It never stops', why: 'Depth is at most word.length; the marks only make it fail sooner.' },
            { text: 'true, starting from (0,1)', why: 'From (0,1) the next letter B is not a neighbour: that start fails either way.' },
          ],
          answer: 1,
        },
        solved: 'false. A failed path left (0,1) marked, so the later start was wrongly blocked. Always restore the cell.',
      },
    ],
  },
];
