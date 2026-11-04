// Step lessons for Backtracking (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every tree, path, used[] flag, pruned branch and result below comes from running the lesson's code on the input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'path') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const sub = (p) => (p.length ? p.join('') : '∅'); // short node label: [1,2] → "12"
const show = (p) => `[${p.join(', ')}]`;
const setText = (s) => `{${[...s].join(',')}}`;
// a table that reveals its rows one by one: k = row being revealed now
const reveal = (rows, cols, k) =>
  table(rows.map((r) => r[0]), cols, rows.map((r, i) => (i <= k ? r.slice(1) : r.slice(1).map(() => '?'))), rows.map((r, i) => r.slice(1).map(() => (i === k ? 'active' : i < k ? 'done' : ''))));

// ---------- recorder: a decision tree built while the algorithm runs ----------
// enter = walk into a child (choose), leave = come back (undo), prune = a child we refuse to walk into.
function tree(run, scale = 1) {
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
    leave(info = { quiet: true }) {
      const id = open.pop();
      ev.push({ kind: 'out', id, open: open.slice(), ...info });
    },
    prune(label, info = {}, edge = '') {
      const id = add(label, edge, true);
      ev.push({ kind: 'bad', id, open: open.slice(), ...info });
    },
  });
  // leaves left to right in visiting order, a parent over the middle of its children
  let leaf = 0;
  const place = (id) => {
    const kids = nodes.filter((n) => n.parent === id);
    nodes[id].x = kids.length ? kids.map((k) => place(k.id)).reduce((a, b) => a + b, 0) / kids.length : leaf++;
    return nodes[id].x;
  };
  place(0);
  return { nodes, ev, scale };
}
// the tree after event t: unseen nodes hidden, the open path visited, finished nodes done, pruned ones bad
function treeAt(T, t, label) {
  const seen = new Set();
  const done = new Set();
  for (let k = 0; k <= t; k++) (T.ev[k].kind === 'out' ? done : seen).add(T.ev[k].id);
  const e = T.ev[t];
  const cur = e.kind === 'in' ? e.id : e.open.at(-1);
  const open = new Set(e.open);
  return {
    kind: 'nodes',
    ...(label ? { label } : {}),
    nodes: T.nodes.map((n) => {
      const st = !seen.has(n.id) ? 'hidden' : n.bad ? 'bad' : n.id === cur ? 'active' : open.has(n.id) ? 'visited' : done.has(n.id) ? 'done' : '';
      return { id: n.id, label: n.label, x: n.x * T.scale, y: n.depth, ...(st ? { state: st } : {}) };
    }),
    edges: T.nodes
      .filter((n) => n.parent !== null)
      .map((n) => ({ from: n.parent, to: n.id, ...(n.edge ? { label: n.edge } : {}), ...(n.bad ? { state: 'muted' } : open.has(n.id) ? { state: 'active' } : done.has(n.id) && seen.has(n.id) ? { state: 'done' } : {}) })),
  };
}
// the whole tree, nothing walked yet (for questions about its shape)
const treePlain = (T, label) => ({ kind: 'nodes', ...(label ? { label } : {}), nodes: T.nodes.map((n) => ({ id: n.id, label: n.label, x: n.x * T.scale, y: n.depth, ...(n.bad ? { state: 'bad' } : {}) })), edges: T.nodes.filter((n) => n.parent !== null).map((n) => ({ from: n.parent, to: n.id, ...(n.edge ? { label: n.edge } : {}) })) });
const treeFrames = (T, label) => T.ev.map((e, t) => (e.quiet ? null : { say: e.say, note: e.note, panels: [treeAt(T, t, label), ...(e.panels || [])] })).filter(Boolean);
const leaves = (T) => T.nodes.filter((n) => !n.bad && !T.nodes.some((c) => c.parent === n.id));

// ---------- what: include / exclude on [1, 2, 3] (one level = one element) ----------
const IE_RES = [];
const IE = tree((T) => {
  const nums = [1, 2, 3];
  const path = [];
  const dfs = (i, edge, note, say) => {
    const leaf = i === nums.length;
    if (leaf) IE_RES.push(show(path));
    const rec = IE_RES.map((s) => s.replace(/[[\] ]/g, '').replace(/,/g, '') || '∅');
    T.enter(sub(path), { say: leaf ? 1 : say, note: leaf ? `${note} Leaf: record ${show(path)}.` : note, panels: [stk(path.slice()), arr(rec, { label: 'recorded' })] }, edge);
    if (!leaf) {
      const x = nums[i];
      path.push(x);
      dfs(i + 1, `+${x}`, `Take ${x}: push it, go down.`, 0);
      path.pop();
      dfs(i + 1, '', `Undo: pop ${x}. Now skip ${x}.`, 2);
    }
    T.leave();
  };
  dfs(0, '', 'Root: nothing chosen yet. This level decides 1.', 0);
});

// ---------- intuition: loop from start on [1, 2, 3] (every node records) ----------
const B_RES = [];
const B = tree((T) => {
  const nums = [1, 2, 3];
  const path = [];
  const panels = () => [stk(path.slice()), arr(B_RES.slice(), { label: 'result (copies)' })];
  const dfs = (start, x) => {
    B_RES.push(sub(path));
    T.enter(sub(path), { say: x === undefined ? 3 : 0, note: x === undefined ? 'Start: record a copy of [].' : `Choose ${x}: push. Explore: record a copy of ${show(path)}.`, panels: panels() }, x === undefined ? '' : `+${x}`);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1, nums[i]);
      path.pop();
      T.leave({ say: 2, note: `Undo: pop ${nums[i]}. path is back to ${show(path)}.`, panels: panels() });
    }
  };
  dfs(0);
  T.leave();
});

// the reference bug from the lesson: result.push(path) on nums = [1, 2]
function refBug() {
  const nums = [1, 2];
  const result = [];
  const path = [];
  const out = [];
  const snap = (note) => out.push({ note, rows: result.length, live: show(path), path: path.slice() });
  const bt = (start) => {
    result.push(path);
    snap(`Record #${result.length}: push the live \`path\` itself.`);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      bt(i + 1);
      path.pop();
      snap(`Pop ${nums[i]}: every entry changes with it.`);
    }
  };
  bt(0);
  return { out, final: result.map(show) };
}
const REF = refBug();
const refPanels = (s) => [stk(s.path), table(Array.from({ length: s.rows }, (_, i) => `result[${i}]`), ['shows'], Array.from({ length: s.rows }, () => [s.live]), Array.from({ length: s.rows }, () => ['bad']))];
const REF_Q = REF.out.findIndex((s) => s.rows === 3); // just after the third record

// ---------- brute force: every ordering, de-duplicated afterwards ----------
function bruteRun(candidates, target) {
  const seen = new Set();
  const hits = [];
  let calls = 0;
  const firstDive = [];
  function gen(seq, sum) {
    calls++;
    if (hits.length === 0 && firstDive.length < 6) firstDive.push({ seq: seq.slice(), sum });
    if (sum > target) return;
    if (sum === target) {
      const key = [...seq].sort((a, b) => a - b).join(',');
      const kept = !seen.has(key);
      if (kept) seen.add(key);
      hits.push({ seq: seq.slice(), key, kept, seen: [...seen] });
      return;
    }
    for (const c of candidates) gen([...seq, c], sum + c);
  }
  gen([], 0);
  return { hits, calls, firstDive, kept: [...seen] };
}
const BRUTE = bruteRun([2, 3, 6, 7], 7);
// the optimized version (template: sorted + break, recurse with i) on the same input, for the call count
function csCalls(candidates, target) {
  let calls = 0;
  const bt = (start, rem) => {
    calls++;
    if (rem === 0) return;
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) break;
      bt(i, rem - candidates[i]);
    }
  };
  bt(0, target);
  return calls;
}
const CS_CALLS = csCalls([2, 3, 6, 7], 7);

// ---------- optimized-subsets: A vs B order, and duplicates ----------
const A_ORDER = IE_RES;
const B_ORDER = B_RES.map((s) => (s === '∅' ? '[]' : show([...s])));
function bNoSkip(nums) {
  const res = [];
  const path = [];
  const dfs = (start) => {
    res.push(show(path));
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);
      dfs(i + 1);
      path.pop();
    }
  };
  dfs(0);
  return res;
}
const DUP_ALL = bNoSkip([1, 2, 2]);
const DUP_RES = [];
const DUP = tree((T) => {
  const nums = [1, 2, 2];
  const path = [];
  const dfs = (start, edge, note, say) => {
    DUP_RES.push(sub(path));
    T.enter(sub(path), { say, note, panels: [arr(nums, { label: 'sorted nums', ...(start < nums.length ? { range: [start, nums.length - 1], pointers: [ptr(start, 'start')] } : {}) }), arr(DUP_RES.slice(), { label: 'recorded' })] }, edge);
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) {
        T.prune(sub([...path, nums[i]]), { say: 0, note: `i = ${i} > start = ${start} and nums[${i}] = nums[${i - 1}]: the same value was just tried at this level. Skip.`, panels: [arr(nums, { label: 'sorted nums', pointers: [ptr(start, 'start'), ptr(i, 'i', 'b')], highlights: { [i]: 'bad', [i - 1]: 'done' } }), arr(DUP_RES.slice(), { label: 'recorded' })] }, `+${nums[i]}`);
        continue;
      }
      path.push(nums[i]);
      const first = i === start;
      dfs(i + 1, `+${nums[i]}`, `i = ${i}${first ? ' = start: first sibling, always allowed' : ''}. Push ${nums[i]}, record ${show(path)}.`, first && i > 0 && nums[i] === nums[i - 1] ? 2 : 1);
      path.pop();
    }
    T.leave();
  };
  dfs(0, '', 'Root: record []. The loop starts at 0.', 0);
});

// ---------- permutations of [1, 2, 3] with used[] ----------
const usedPanel = (used) => arr(used.map((u) => (u ? 'T' : 'F')), { label: 'used[]', highlights: hl(used.length, (k) => (used[k] ? 'active' : '')) });
const PERM = tree((T) => {
  const nums = [1, 2, 3];
  const path = [];
  const used = [false, false, false];
  let last = [];
  const dfs = (edge, i) => {
    const leaf = path.length === nums.length;
    const popped = last.slice(path.length - 1).reverse();
    let note = 'Root: nothing placed. Position 0 may take any element.';
    let say = 0;
    if (path.length) {
      note = `${popped.length ? `Undo ${popped.join(' then ')}: pop and set used = F. ` : ''}Choose ${nums[i]}: used[${i}] = T.${leaf ? ` Leaf: record ${show(path)}.` : ''}`;
      say = leaf ? 3 : popped.length ? 2 : 1;
    }
    T.enter(sub(path), { say, note, panels: [usedPanel(used), stk(path.slice())] }, edge);
    last = path.slice();
    if (!leaf)
      for (let j = 0; j < nums.length; j++) {
        if (used[j]) continue;
        used[j] = true;
        path.push(nums[j]);
        dfs(`+${nums[j]}`, j);
        path.pop();
        used[j] = false;
      }
    T.leave();
  };
  dfs('');
});
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

// ---------- combinations: choose k of 1..n with the "enough left" bound ----------
const COMB_RES = [];
const COMB = tree((T) => {
  const n = 4;
  const k = 2;
  const path = [];
  const dfs = (start, edge) => {
    const need = k - path.length;
    const max = n - need + 1;
    const leaf = need === 0;
    if (leaf) COMB_RES.push(sub(path));
    const v = vars({ start, need, 'x max': leaf ? '—' : max });
    const note = !path.length ? `Root: need = ${need}, so x goes up to ${n} − ${need} + 1 = ${max}.` : leaf ? `Push ${path.at(-1)}: size ${k}. Record ${show(path)}, then pop.` : `Push ${path.at(-1)}: need = ${need}, so x may go up to ${max}.`;
    T.enter(sub(path), { say: leaf ? 0 : path.length ? 1 : 2, note, panels: [stk(path.slice()), v] }, edge);
    if (!leaf) {
      for (let x = start; x <= max; x++) {
        path.push(x);
        dfs(x + 1, `+${x}`);
        path.pop();
      }
      if (max + 1 <= n && max + 1 >= start) T.prune(sub([...path, max + 1]), { say: 2, note: `x = ${max + 1} would leave nothing to finish the pair: the loop stops at ${max}.`, panels: [stk(path.slice()), vars({ start, need, 'x max': max })] }, `+${max + 1}`);
    }
    T.leave();
  };
  dfs(1, '');
});

// Combination Sum with sorted candidates and break (template from the lesson), target 6
const CS_C = [2, 3, 4];
const CS_T = 6;
const CS_RES = [];
const CS = tree((T) => {
  const path = [];
  const panels = (rem) => [stk(path.slice()), vars({ remaining: rem })];
  const bt = (start, rem, edge) => {
    if (rem === 0) CS_RES.push(show(path));
    T.enter(sub(path), { say: rem === 0 ? 2 : 0, note: !path.length ? `Root: remaining ${rem}.` : `Push ${path.at(-1)}: remaining ${rem}.${rem === 0 ? ` Record ${show(path)}.` : ''}`, panels: panels(rem) }, edge);
    if (rem > 0)
      for (let i = start; i < CS_C.length; i++) {
        if (CS_C[i] > rem) {
          T.prune(sub([...path, CS_C[i]]), { say: 1, note: `${CS_C[i]} > ${rem}: break. Sorted, so no later candidate fits either.`, panels: panels(rem) }, `+${CS_C[i]}`);
          break;
        }
        path.push(CS_C[i]);
        bt(i, rem - CS_C[i], `+${CS_C[i]}`);
        path.pop();
      }
    T.leave();
  };
  bt(0, CS_T, '');
});

// ---------- N-Queens on 4×4, up to the first full board ----------
function queens(n) {
  const cols = new Set();
  const diag = new Set();
  const anti = new Set();
  const queenCol = [];
  const frames = [];
  const board = (row, rowStates = {}) =>
    grid(
      Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (queenCol[r] === c ? 'Q' : '·'))),
      Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (queenCol[r] === c ? (r === row ? 'active' : 'done') : r === row ? rowStates[c] || '' : ''))),
      `${n}×${n} board`,
    );
  const sets = () => vars({ cols: setText(cols), diag: setText(diag), anti: setText(anti) });
  const why = (row, c) => (cols.has(c) ? 'column' : diag.has(row - c) ? `diag ${row - c}` : `anti ${row + c}`);
  const place = (row) => {
    if (row === n) {
      frames.push({ say: 0, note: `row = ${n}: every row has a queen. Record this board.`, panels: [board(-1), sets()] });
      return true;
    }
    const st = {};
    const hits = [];
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(row - c) || anti.has(row + c)) {
        st[c] = 'bad';
        hits.push(`col ${c} (${why(row, c)})`);
        continue;
      }
      cols.add(c);
      diag.add(row - c);
      anti.add(row + c);
      queenCol.push(c);
      frames.push({ say: 1, note: `Row ${row}: ${hits.length ? `${hits.join(', ')} attacked; ` : ''}column ${c} is safe. Place: cols + ${c}, diag + ${row - c}, anti + ${row + c}.`, panels: [board(row, st), sets()] });
      if (place(row + 1)) return true;
      cols.delete(c);
      diag.delete(row - c);
      anti.delete(row + c);
      queenCol.pop();
      st[c] = 'muted';
      hits.length = 0;
      frames.push({ say: 2, note: `Back in row ${row}: remove the queen from column ${c} (all three Sets).`, panels: [board(row, st), sets()] });
    }
    frames.push({ say: 2, note: `Row ${row}: no safe column left. Dead end: go back up.`, panels: [board(row, st), sets()] });
    return false;
  };
  place(0);
  return frames;
}
const NQ = queens(4);

// ---------- Word Search: mark, explore 4 neighbours, restore ----------
function wordSearch(board0, word) {
  const board = board0.map((r) => r.slice());
  const R = board.length;
  const C = board[0].length;
  const frames = [];
  const path = [];
  const pic = (bad) =>
    grid(
      board,
      board.map((row, r) => row.map((v, c) => (bad && bad[0] === r && bad[1] === c ? 'bad' : path.length && path.at(-1) === `${r},${c}` ? 'active' : v === '#' ? 'visited' : ''))),
      `word "${word}"`,
    );
  const snap = (say, note, k, bad) => frames.push({ say, note, panels: [pic(bad), stk(path.slice(), 'path (r,c)'), vars({ k, need: k < word.length ? word[k] : '—' })] });
  function dfs(r, c, k) {
    if (k === word.length) {
      snap(0, `k = ${k} = word.length: the whole word is spelled. true.`, k);
      return true;
    }
    if (r < 0 || c < 0 || r >= R || c >= C) return false;
    if (board[r][c] !== word[k]) {
      snap(board[r][c] === '#' ? 1 : 0, board[r][c] === '#' ? `(${r},${c}) is #: already on this path. false.` : `(${r},${c}) is ${board[r][c]}, need ${word[k]}. false.`, k, [r, c]);
      return false;
    }
    const saved = board[r][c];
    board[r][c] = '#';
    path.push(`${r},${c}`);
    snap(1, `(${r},${c}) = ${saved} matches word[${k}]. Mark it #.`, k);
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    board[r][c] = saved;
    path.pop();
    snap(2, `Restore (${r},${c}) to ${saved}. Return ${found}.`, k);
    return found;
  }
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (dfs(r, c, 0)) return { frames, found: true };
    }
  return { frames, found: false };
}
const WS_BOARD = [
  ['A', 'A'],
  ['B', 'X'],
];
const WS = wordSearch(WS_BOARD, 'AAB');

// Expression Add Operators: value' = value − last + last * x, last' = last * x
const mulStep = (value, last, x) => ({ value: value - last + last * x, last: last * x });
const EXP = mulStep(5, 4, 3); // "1+2*2" has value 5, last 4; append "*3"

// ---------- palindrome partitioning (the lesson's implementation) ----------
function partitionTree(s) {
  const res = [];
  const T = tree((t) => {
    const path = [];
    const isPal = (l, r) => {
      while (l < r) if (s[l++] !== s[r--]) return false;
      return true;
    };
    const dfs = (start, edge, note) => {
      const leaf = start === s.length;
      if (leaf) res.push(show(path));
      t.enter(path.length ? path.at(-1) : '∅', { say: leaf ? 2 : 0, note: leaf ? `${note} start = ${s.length}: the whole string is cut. Record ${show(path)}.` : note, panels: [arr([...s], { label: 's', ...(leaf ? {} : { pointers: [ptr(start, 'start')] }), highlights: hl(s.length, (k) => (k < start ? 'done' : '')) }), stk(path.slice())] }, edge);
      if (!leaf)
        for (let end = start; end < s.length; end++) {
          const piece = s.slice(start, end + 1);
          if (!isPal(start, end)) {
            t.prune(piece, { say: 1, note: `"${piece}" is not a palindrome: continue.`, panels: [arr([...s], { label: 's', range: [start, end], highlights: hl(s.length, (k) => (k < start ? 'done' : k <= end ? 'bad' : '')) }), stk(path.slice())] });
            continue;
          }
          path.push(piece);
          dfs(end + 1, '', `Cut "${piece}" (a palindrome): push it.`);
          path.pop();
        }
      t.leave();
    };
    dfs(0, '', `Root: cut "${s}" starting at 0.`);
  });
  return { T, res };
}
const PAL = partitionTree('aab');
const PAL3 = partitionTree('aaa');

// ---------- dry run: the lesson's table, row by row ----------
const DRY = [
  ['dfs(0, 7)', '[]', '7', 'try 2'],
  ['dfs(0, 5)', '[2]', '5', 'try 2'],
  ['dfs(0, 3)', '[2,2]', '3', 'try 2'],
  ['dfs(0, 1)', '[2,2,2]', '1', '2 > 1 → break; return, pop 2'],
  ['dfs(0, 3)', '[2,2]', '3', 'try 3'],
  ['dfs(1, 0)', '[2,2,3]', '0', 'record [2,2,3]; return, pop 3'],
  ['dfs(0, 3)', '[2,2]', '3', '6 > 3 → break; return, pop 2'],
  ['dfs(0, 5)', '[2]', '5', 'try 3 → dfs(1,2): 3 > 2 break; pop. 6 > 5 break; pop 2'],
  ['dfs(0, 7)', '[]', '7', 'try 3 → [3]: 3 → [3,3] rem 1 break… nothing; try 6 → rem 1 break'],
  ['dfs(3, 0)', '[7]', '0', 'record [7]'],
];
// the table shows a short action so it fits a phone; the full action (word for word from the lesson) is the frame note
const DRY_SHORT = ['try 2', 'try 2', 'try 2', '2>1 break', 'try 3', 'record', '6>3 break', '3>2, 6>5 break', 'try 3, try 6', 'record'];
const dryTable = (k) =>
  table(
    DRY.slice(0, k + 1).map((r) => r[0]),
    ['path', 'rem', 'action'],
    DRY.slice(0, k + 1).map((r, i) => [r[1], r[2], DRY_SHORT[i]]),
    DRY.slice(0, k + 1).map((_, i) => [0, 1, 2].map(() => (i === k ? 'active' : 'done'))),
  );
const DRY_RECORDED = (k) => DRY.slice(0, k + 1).filter((r) => r[3].startsWith('record')).map((r) => r[3].slice(7).split(';')[0]);
// every break in the real run of combinationSum([2, 3, 6, 7], 7)
function countBreaks(candidates, target) {
  let breaks = 0;
  const bt = (start, rem) => {
    if (rem === 0) return;
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) {
        breaks++;
        break;
      }
      bt(i, rem - candidates[i]);
    }
  };
  bt(0, target);
  return breaks;
}
const DRY_BREAKS = countBreaks([2, 3, 6, 7], 7);

// ---------- mistakes: undo path but not used[] (permutations of [1, 2]) ----------
function halfUndo(nums) {
  const res = [];
  const path = [];
  const used = nums.map(() => false);
  const frames = [];
  const snap = (say, note) => frames.push({ say, note, panels: [usedPanel(used), stk(path.slice()), arr(res.map(sub), { label: 'result' })] });
  const dfs = () => {
    if (path.length === nums.length) {
      res.push(path.slice());
      snap(0, `Record ${show(path)}.`);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) {
        if (!path.length) snap(1, `Top level, i = ${i}: used[${i}] is still T. Skipped!`);
        continue;
      }
      used[i] = true;
      path.push(nums[i]);
      snap(0, `Choose ${nums[i]}: used[${i}] = T.`);
      dfs();
      path.pop(); // bug: used[i] is never reset
      snap(1, `Pop ${nums[i]} — but used[${i}] stays T.`);
    }
  };
  dfs();
  snap(2, `Done: only ${res.length} permutation instead of ${factorial(nums.length)}.`);
  return { frames, res };
}
const HALF = halfUndo([1, 2]);
// break on an unsorted list
function csUnsorted(candidates, target) {
  const res = [];
  const path = [];
  const bt = (start, rem) => {
    if (rem === 0) return res.push(path.slice());
    for (let i = start; i < candidates.length; i++) {
      if (candidates[i] > rem) break;
      path.push(candidates[i]);
      bt(i, rem - candidates[i]);
      path.pop();
    }
  };
  bt(0, target);
  return res;
}
const UNSORTED = csUnsorted([6, 2, 3], 5);

// ---------- interview tips: first two levels of the subsets tree ----------
const TWO = tree((T) => {
  const nums = [1, 2, 3];
  const path = [];
  const dfs = (start, edge, note) => {
    T.enter(sub(path), { say: path.length === 0 ? 0 : 1, note, panels: [stk(path.slice())] }, edge);
    if (path.length < 2)
      for (let i = start; i < nums.length; i++) {
        path.push(nums[i]);
        dfs(i + 1, `+${nums[i]}`, `Level ${path.length} decides the next element: ${nums[i]}.`);
        path.pop();
      }
    T.leave();
  };
  dfs(0, '', 'Root: nothing chosen.');
});
const subsetsOf = (nums) => bNoSkip(nums);

// sanity checks: the frames must agree with the lesson's own statements
const check = (ok, msg) => {
  if (!ok) throw new Error(`backtracking steps: ${msg}`);
};
check(IE_RES.length === 8 && B_RES.length === 8, 'subsets of [1,2,3] = 8');
check(JSON.stringify(REF.final) === JSON.stringify(['[]', '[]', '[]', '[]']), 'reference bug ends as [[],[],[],[]]');
check(BRUTE.kept.join('|') === '2,2,3|7', 'brute force keeps [2,2,3] and [7]');
check(leaves(PERM).length === 6, '3! leaves');
check(COMB_RES.length === 6, 'C(4,2) = 6');
check(WS.found, 'AAB is found');
check(EXP.value === 13 && mulStep(3, 2, 3).value === 7 && mulStep(3, 2, 3).last === 6, 'lesson example 1+2*3');
check(PAL.res.join('|') === '[a, a, b]|[aa, b]', 'aab partitions');
check(subsetsOf([]).length === 1, 'subsets([]) = [[]]');
// dry-run table vs a real run: recorded paths and order
check(csUnsorted([2, 3, 6, 7], 7).map((p) => `[${p}]`).join('|') === DRY.filter((r) => r[3].startsWith('record')).map((r) => r[3].slice(7).split(';')[0]).join('|'), 'dry run records');


export default {
  what: [
    {
      kind: 'watch',
      title: 'Walk the subsets tree of [1, 2, 3]',
      lines: ['Each level asks one yes/no question: **take** this element? (`+x` = take, no label = skip)', 'Go **depth-first**: all the way down, record the leaf, then come back up one level.', 'Coming back means **undo**: pop the element, then try skipping it.'],
      frames: treeFrames(IE, 'take / skip'),
    },
    {
      kind: 'turn',
      title: 'Your turn: who is recorded first?',
      lines: ['Take is always tried before skip.', 'The walk is depth-first.'],
      panels: [treePlain(IE, 'take / skip')],
      task: { type: 'order', question: 'Tap the first four leaves in the order they are recorded.', items: A_ORDER.slice(0, 4), hint: 'Go all the way down the take side first; then back up one level only.' },
      solved: 'Deepest-first: [1,2,3], then back up one level to skip 3 → [1,2], then up two levels → [1,3], [1].',
    },
    {
      kind: 'turn',
      title: 'Your turn: count the round trips',
      lines: ['**Choose → Explore → Undo** happens once for every **edge** of the tree.', 'Each edge leads from a node to one of its children.'],
      panels: [treePlain(IE, 'take / skip')],
      task: { type: 'number', question: 'How many Choose → Explore → Undo round trips does the full walk make?', options: [7, 8, 14, 15], answer: IE.nodes.length - 1, hint: 'Count the edges: every node except the root has exactly one edge above it.' },
      solved: `${IE.nodes.length} nodes, so ${IE.nodes.length - 1} edges: ${IE.nodes.length - 1} round trips.`,
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'One bad start, a whole subtree skipped',
      lines: ['Nested loops need a fixed depth; **one recursive call = one level**, so the depth follows the input.', '**Memory:** one shared path, changed in place.', '**Pruning:** check the rules while building. A bad start skips every board that begins that way.'],
      frames: [
        { say: 0, note: 'Row 0: put a queen in column 0. One call, one level.', panels: [grid([['Q', '·', '·', '·'], ['·', '·', '·', '·'], ['·', '·', '·', '·'], ['·', '·', '·', '·']], [['active', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']], '4×4 board'), stk([0], 'queen columns')] },
        { say: 2, note: 'Row 1, column 0: same column. Rejected before going deeper.', panels: [grid([['Q', '·', '·', '·'], ['Q', '·', '·', '·'], ['·', '·', '·', '·'], ['·', '·', '·', '·']], [['done', '', '', ''], ['bad', '', '', ''], ['muted', 'muted', 'muted', 'muted'], ['muted', 'muted', 'muted', 'muted']], '4×4 board'), stk([0], 'queen columns')] },
        { say: 2, note: 'Row 1, column 1: on the diagonal of the first queen. Rows 2 and 3 are never built for it.', panels: [grid([['Q', '·', '·', '·'], ['·', 'Q', '·', '·'], ['·', '·', '·', '·'], ['·', '·', '·', '·']], [['done', '', '', ''], ['bad', 'bad', '', ''], ['muted', 'muted', 'muted', 'muted'], ['muted', 'muted', 'muted', 'muted']], '4×4 board'), stk([0], 'queen columns')] },
        { say: 1, note: 'Column 2 is safe: push it onto the same shared path and go one level deeper.', panels: [grid([['Q', '·', '·', '·'], ['·', '·', 'Q', '·'], ['·', '·', '·', '·'], ['·', '·', '·', '·']], [['done', '', '', ''], ['bad', 'bad', 'active', ''], ['', '', '', ''], ['', '', '', '']], '4×4 board'), stk([0, 2], 'queen columns')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how much did one check save?',
      lines: ['One queen per row, any column.', 'Queens at (0, 0) and (1, 1) attack each other.'],
      panels: [grid([['Q', '·', '·', '·'], ['·', 'Q', '·', '·'], ['?', '?', '?', '?'], ['?', '?', '?', '?']], [['done', '', '', ''], ['', 'bad', '', ''], ['muted', 'muted', 'muted', 'muted'], ['muted', 'muted', 'muted', 'muted']], '4×4 board')],
      task: { type: 'number', question: 'How many full boards start with these two queens?', options: [4, 8, 16, 64], answer: 16, hint: 'Rows 2 and 3 each still have 4 column choices.' },
      solved: '4 × 4 = 16 boards, all skipped by one check at row 1. Pruning cuts a node **and its entire subtree**.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Five families, one shape',
      lines: ['Use it to **list all** answers, or to find one in a huge search space.', 'An answer must be a **sequence of choices**.', 'Inputs are **small**: about n ≤ 10 for permutations, n ≤ 20 for subsets, a 9×9 board.'],
      frames: (() => {
        const rows = [
          ['Subsets', 'take/skip one', 'start', '2ⁿ'],
          ['Combos', 'next of the group', 'start (or i)', 'C(n, k)'],
          ['Perms', 'element for this slot', '0, skip used', 'n!'],
          ['Puzzles', 'value for one slot', 'every candidate', 'usually few'],
          ['Grid paths', 'next neighbour', '4 directions', 'depends'],
        ];
        return [
          ...rows.map((_, k) => ({ say: 1, note: `${rows[k][0]}: one level decides ${rows[k][1]}; the loop starts at ${rows[k][2]}.`, panels: [reveal(rows, ['one level', 'loop starts', 'output'], k)] })),
          { say: 2, note: 'Outputs like 2ⁿ and n! explode, so inputs stay small.', panels: [reveal(rows, ['one level', 'loop starts', 'output'], rows.length), vars({ perms: 'n ≤ 10', subsets: 'n ≤ 20' })] },
          { say: 0, note: 'All five list every answer by choosing one step at a time.', panels: [reveal(rows, ['one level', 'loop starts', 'output'], rows.length)] },
        ];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: whose output is biggest?',
      lines: ['Take n = 4.', 'Subsets: 2ⁿ. Permutations: n!. Combinations: C(n, k).'],
      panels: [vars({ n: 4, k: 2 })],
      task: { type: 'order', question: 'Tap from the largest output to the smallest.', items: ['Permutations', 'Subsets', 'Combinations, k = 2'], hint: '4! = 24, 2⁴ = 16, C(4, 2) = 6.' },
      solved: `${factorial(4)} > ${2 ** 4} > 6. That growth is why backtracking inputs stay small.`,
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Pick the family with three questions',
      lines: ['Clues: "return all", "all possible…", "generate all valid…", tiny n, "no two conflict".', '**Does order matter?** Yes → `used[]`. No → `start` index.', '**Can an element be reused?** Recurse with `i` (reuse) or `i + 1` (no reuse).', '**Duplicates in the input** but not in the output? Sort + skip.'],
      frames: (() => {
        const rows = [
          ['order?', 'used[], loop 0', 'start index'],
          ['reuse?', 'recurse i', 'recurse i + 1'],
          ['duplicates?', 'sort + skip', '—'],
        ];
        return rows.map((_, k) => ({ say: k + 1, note: `Question ${k + 1}: ${rows[k][0].replace('?', '')}.`, panels: [reveal(rows, ['yes', 'no'], k)] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: every ordering',
      lines: ['"Return all possible orderings of `[4, 5, 6]`."'],
      panels: [arr([4, 5, 6], { label: 'nums' })],
      task: {
        type: 'choose',
        question: 'Which tool does this need?',
        options: [
          { text: '`used[]` and a loop from 0', why: '' },
          { text: 'A `start` index', why: 'start only moves forward: [5, 4, 6] could never be built.' },
          { text: 'Sort + skip duplicates', why: 'The values are distinct; there is nothing to skip.' },
        ],
        answer: 0,
      },
      solved: '"Orderings" → order matters → `used[]`, loop from 0.',
    },
    {
      kind: 'turn',
      title: 'Your turn: repeated values, used once',
      lines: ['Input `[1, 1, 2]`. Each number may only be used once.', 'Return all **unique** combinations that reach the target.'],
      panels: [arr([1, 1, 2], { label: 'candidates', highlights: { 0: 'window', 1: 'window' } })],
      task: {
        type: 'choose',
        question: 'Which set-up fits?',
        options: [
          { text: 'Sort + skip, recurse with `i + 1`', why: '' },
          { text: 'Sort + skip, recurse with `i`', why: '`i` lets the same element be picked again; each number may be used once.' },
          { text: 'Recurse with `i + 1`, no sorting', why: 'The two 1s would each start the same combination: duplicates in the output.' },
          { text: '`used[]` and a loop from 0', why: 'Order does not matter in a combination.' },
        ],
        answer: 0,
      },
      solved: 'No order → start index. Once each → `i + 1`. Repeated values → sort + skip.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Choose, explore, undo on one shared path',
      lines: ['**CHOOSE**: apply the choice to the shared state (`path.push`).', '**EXPLORE**: recurse to the next level.', '**UNDO**: remove it again (`path.pop`), so the caller sees `path` as before.', 'Record a **copy** `[...path]` at every node.'],
      frames: treeFrames(B, 'loop from start'),
    },
    {
      kind: 'turn',
      title: 'Your turn: the live array',
      lines: ['The bug: `result.push(path)` instead of a copy.', '`nums = [1, 2]`. Three records have been made; `path` is now `[1, 2]`.', 'Every later push or pop changes **all** entries at once.'],
      panels: [stk(REF.out[REF_Q].path), table(['result[0]', 'result[1]', 'result[2]'], ['shows'], [['?'], ['?'], ['?']])],
      task: {
        type: 'choose',
        question: 'What do the three entries of `result` show right now?',
        options: [
          { text: '[1, 2], [1, 2], [1, 2]', why: '' },
          { text: '[], [1], [1, 2]', why: 'That needs three copies. These are three references to one array.' },
          { text: '[], [], []', why: 'That is how it ends. Right now the one shared array holds [1, 2].' },
        ],
        answer: 0,
      },
      solved: 'All entries are the same array, so they all show whatever `path` holds now.',
      then: REF.out.slice(REF_Q).map((s, i, all) => ({ say: i === all.length - 1 ? 0 : 2, note: i === all.length - 1 ? `End: result = ${s.rows} references to one empty array.` : s.note, panels: refPanels(s) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the invariant',
      lines: ['Every push is paired with a pop.', '`bt(2)` is called while `path = [1]`.'],
      panels: [stk([1]), vars({ call: 'bt(2)' })],
      task: {
        type: 'choose',
        question: 'What is `path` when `bt(2)` returns?',
        options: [
          { text: '[1]', why: '' },
          { text: '[1, 2]', why: 'Everything bt(2) pushes, it pops before returning.' },
          { text: '[]', why: 'The 1 was pushed by the caller; the caller pops it after bt(2) returns.' },
        ],
        answer: 0,
      },
      solved: 'When a call returns, the shared state is exactly as it was when the call started.',
    },
  ],

  'brute-force': [
    {
      kind: 'turn',
      title: 'Your turn: how many hits?',
      lines: ['`candidates = [2, 3, 6, 7]`, `target = 7`.', 'The brute force tries sequences in **any order**, stopping when the sum passes 7.'],
      panels: [arr([2, 3, 6, 7], { label: 'candidates' }), vars({ target: 7 })],
      task: { type: 'number', question: 'How many sequences reach sum exactly 7?', options: [2, 3, 4, 6], answer: BRUTE.hits.length, hint: 'Count every order of 2, 2, 3 separately, plus 7 alone.' },
      solved: `${BRUTE.hits.length} sequences hit 7, but only ${BRUTE.kept.length} combinations survive the Set.`,
      then: BRUTE.hits.map((h) => ({ say: 0, note: `${show(h.seq)} sums to 7 → key "${h.key}". ${h.kept ? 'New key: keep it.' : 'Key already seen: thrown away.'}`, panels: [arr(h.seq, { label: 'seq', highlights: hl(h.seq.length, () => (h.kept ? 'done' : 'bad')) }), arr(h.seen, { label: 'seen keys' })] })),
    },
    {
      kind: 'watch',
      title: 'A new array at every node',
      lines: ['Each call builds a **new array** `[...seq, c]`.', 'The `sum > target` check stops a branch early.', 'Even this tiny input costs many calls.'],
      frames: [
        ...BRUTE.firstDive.map((d) => ({ say: d.sum > 7 ? 1 : 0, note: d.sum > 7 ? `New array ${show(d.seq)}: sum ${d.sum} > 7, return.` : d.seq.length ? `New array ${show(d.seq)}, sum ${d.sum}.` : 'gen([], 0) starts.', panels: [arr(d.seq.length ? d.seq : ['·'], { label: 'seq (a fresh copy)', highlights: hl(d.seq.length || 1, (k) => (d.sum > 7 ? 'bad' : k === d.seq.length - 1 ? 'active' : '')) }), vars({ sum: d.sum })] })),
        { say: 2, note: `In total gen runs ${BRUTE.calls} times, each with its own array. The start-index version on the same input makes ${CS_CALLS} calls.`, panels: [vars({ 'brute calls': BRUTE.calls, 'start-index calls': CS_CALLS })] },
      ],
    },
  ],

  'optimized-subsets': [
    {
      kind: 'watch',
      title: 'A and B: same subsets, different order',
      lines: ['**A** (include / exclude): answers live at the leaves, `i === n`.', '**B** (loop from start): every node is an answer.', 'Both give all 2ⁿ = 8 subsets of [1, 2, 3].'],
      frames: [
        ...A_ORDER.map((_, k) => ({
          say: k === 0 ? 0 : 1,
          note: `Answer #${k + 1}: A records ${A_ORDER[k]}, B records ${B_ORDER[k]}.`,
          panels: [table(A_ORDER.map((_, i) => `#${i + 1}`), ['A', 'B'], A_ORDER.map((a, i) => (i <= k ? [a, B_ORDER[i]] : ['?', '?'])), A_ORDER.map((_, i) => (i === k ? ['active', 'active'] : i < k ? ['done', 'done'] : ['', ''])))],
        })),
        { say: 2, note: 'Same 8 subsets. B\'s shape carries over to combinations and duplicates.', panels: [table(A_ORDER.map((_, i) => `#${i + 1}`), ['A', 'B'], A_ORDER.map((a, i) => [a, B_ORDER[i]]), A_ORDER.map(() => ['done', 'done']))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many calls does A make?',
      lines: ['A calls `dfs(i + 1)` twice from every non-leaf: include, then exclude.', 'Leaves are at depth 3 for [1, 2, 3].'],
      panels: [treePlain(IE, 'version A')],
      task: { type: 'number', question: 'How many times is `dfs` called in total?', options: [8, 14, 15, 16], answer: IE.nodes.length, hint: '1 + 2 + 4 + 8.' },
      solved: `${IE.nodes.length} calls for A; B makes one call per subset, ${B.nodes.length}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: duplicates without the skip',
      lines: ['Sorted `nums = [1, 2, 2]`.', 'Run version B **without** the skip line.'],
      panels: [arr([1, 2, 2], { label: 'nums' })],
      task: { type: 'number', question: 'How many subsets does it record?', options: [6, 7, 8, 9], answer: DUP_ALL.length, hint: 'Without the skip, B treats the two 2s as different elements: 2³.' },
      solved: `${DUP_ALL.length} records, but [1, 2] and [2] each appear twice. Only ${new Set(DUP_ALL).size} are distinct.`,
      then: [{ say: 0, note: 'Records in order. The repeats are marked.', panels: [arr(DUP_ALL.map((s) => s.replace(/[[\] ,]/g, '') || '∅'), { label: 'recorded', highlights: hl(DUP_ALL.length, (k) => (DUP_ALL.indexOf(DUP_ALL[k]) < k ? 'bad' : '')) })] }],
    },
    {
      kind: 'watch',
      title: 'Sort, then skip equal siblings',
      lines: ['At the same level, skip a value equal to the previous one: `i > start && nums[i] === nums[i − 1]`.', '`i === start` is the first sibling: always allowed.', 'So [1, 2, 2] still appears: its two 2s sit at **different depths**.'],
      frames: treeFrames(DUP, 'subsets of [1, 2, 2]'),
    },
  ],

  'optimized-permutations': [
    {
      kind: 'watch',
      title: 'Permutations of [1, 2, 3] with used[]',
      lines: ['Each level fills one **position**; try every element that is not used.', '`used[i]` is true while nums[i] is on the path: an O(1) check.', 'Undo **both**: `path.pop()` and `used[i] = false`.', 'n choices, then n − 1, … → n! leaves.'],
      frames: treeFrames(PERM, 'permutations'),
    },
    {
      kind: 'turn',
      title: 'Your turn: after choosing 3 first',
      lines: ['Position 0 holds 3. The loop scans **every** index from 0.', 'Grey cells are already on the path.'],
      panels: [arr([1, 2, 3], { label: 'nums', highlights: { 2: 'muted' } }), usedPanel([false, false, true]), stk([3])],
      task: { type: 'cell', question: 'Tap the index the loop chooses next.', answer: 0, hints: { 2: 'used[2] is T: 3 is already on the path.', 1: 'The loop starts at 0, and nums[0] is not used.' } },
      solved: 'Index 0: 1 has a smaller index, but in a permutation it may still come after 3.',
    },
    {
      kind: 'turn',
      title: 'Your turn: leaves for n = 4',
      lines: ['Level 0 has n choices, level 1 has n − 1, …'],
      panels: [arr([1, 2, 3, 4], { label: 'nums' })],
      task: { type: 'number', question: 'How many leaves does the permutations tree of [1, 2, 3, 4] have?', options: [12, 16, 24, 64], answer: factorial(4), hint: '4 · 3 · 2 · 1.' },
      solved: `4! = ${factorial(4)} leaves, one per permutation.`,
    },
  ],

  'optimized-combinations': [
    {
      kind: 'watch',
      title: 'Choose 2 of 1..4: leave room for the rest',
      lines: ['The path still needs `need = k − path.length` numbers.', 'So x goes from `start` up to `n − need + 1`.', 'Beyond that there are not enough numbers left: the loop never goes there.'],
      frames: treeFrames(COMB, 'combine(4, 2)'),
    },
    {
      kind: 'turn',
      title: 'Your turn: the bound at the root',
      lines: ['`combine(5, 3)`: choose 3 of 1..5.', 'At the root the path is empty.'],
      panels: [arr([1, 2, 3, 4, 5], { label: 'x candidates' }), stk([])],
      task: { type: 'number', question: 'What is the largest x the root loop tries?', options: [2, 3, 4, 5], answer: 5 - 3 + 1, hint: 'need = 3, and x may go up to n − need + 1.' },
      solved: 'x ≤ 5 − 3 + 1 = 3. Starting at 4 would leave only 5: one number, not two.',
    },
    {
      kind: 'watch',
      title: 'Sorted candidates: one break cuts the rest',
      lines: ['Combination Sum on sorted `[2, 3, 4]`, target 6; recurse with `i` (reuse).', 'When `candidates[i] > remaining`, **break**: every later one is bigger.', 'remaining = 0 → record.'],
      frames: treeFrames(CS, 'remaining → 0'),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does the loop stop?',
      lines: ['Sorted candidates, `remaining = 4`, the loop starts at index 1.'],
      panels: [arr([2, 3, 5, 8], { label: 'candidates', pointers: [ptr(1, 'start')], highlights: { 0: 'muted' } }), vars({ remaining: 4 })],
      task: { type: 'cell', question: 'Tap the index where `break` fires.', answer: 2, hints: { 1: '3 ≤ 4: it fits, so the loop tries it.', 3: 'The loop never reaches 8: it stops at the first candidate that is too big.', 0: 'The loop starts at index 1.' } },
      solved: '5 > 4 at index 2: break. 8 is never even looked at.',
    },
  ],

  'optimized-constraints': [
    {
      kind: 'turn',
      title: 'Your turn: the safe square in row 2',
      lines: ['Queens at (0, 1) and (1, 3).', 'Check column, row − col and row + col for each square of row 2.'],
      panels: [grid([['·', 'Q', '·', '·'], ['·', '·', '·', 'Q'], ['?', '?', '?', '?'], ['·', '·', '·', '·']], [['', 'done', '', ''], ['', '', '', 'done'], ['active', 'active', 'active', 'active'], ['', '', '', '']], '4×4 board'), arr([0, 1, 2, 3], { label: 'row 2, column' }), vars({ cols: '{1,3}', diag: '{-1,-2}', anti: '{1,4}' })],
      task: { type: 'cell', panel: 1, question: 'Tap the only safe column in row 2.', answer: 0, hints: { 1: 'Column 1 is in cols.', 2: '2 + 2 = 4 is in anti.', 3: 'Column 3 is in cols.' } },
      solved: '(2, 0): column 0, diag 2, anti 2 are all free. Watch the full run place this exact queen next.',
    },
    {
      kind: 'watch',
      title: '4-Queens: place, check, back out',
      lines: ['One level = one **row**; the choice = a **column**.', 'A square is safe when `cols`, `diag` (row − col) and `anti` (row + col) are all free of it.', 'No safe column in a row → remove the queen above and try its next column.'],
      frames: NQ,
    },
    {
      kind: 'turn',
      title: 'Your turn: which Sudoku box?',
      lines: ['Sudoku keeps a Set per row, column and 3×3 box.', 'Box index: `Math.floor(r / 3) * 3 + Math.floor(c / 3)`.'],
      panels: [vars({ r: 4, c: 7 })],
      task: { type: 'number', question: 'Which box index does cell (4, 7) use?', options: [2, 4, 5, 7], answer: Math.floor(4 / 3) * 3 + Math.floor(7 / 3), hint: 'Math.floor(4 / 3) = 1 and Math.floor(7 / 3) = 2.' },
      solved: '1 · 3 + 2 = 5: the middle-right box.',
    },
  ],

  'optimized-grid': [
    {
      kind: 'watch',
      title: 'Word Search: mark, explore, restore',
      lines: ['One level = one character; the choices = 4 neighbours (down, up, right, left).', 'Mark the cell `#` before exploring, so this path cannot reuse it.', 'Restore the letter on the way back: another path may need it.'],
      frames: WS.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: if nothing were restored',
      lines: ['Same board, word "AAB". Suppose the restore line were missing.', 'Start (0, 0) has failed and left its marks behind.'],
      panels: [grid([['#', '#'], ['B', 'X']], [['visited', 'visited'], ['', '']], 'word "AAB"')],
      task: {
        type: 'choose',
        question: 'What does `exist` return now?',
        options: [
          { text: '`false`: both A cells still read #', why: '' },
          { text: '`true`, via (0,1) → (0,0) → (1,0)', why: 'That is the real answer, but that path needs both A cells, and both still read #.' },
          { text: 'It throws: # is not a letter', why: '# simply fails the `board[r][c] !== word[k]` check.' },
        ],
        answer: 0,
      },
      solved: 'A failed path must not block later ones. With the restore, start (0, 1) reuses (0, 0) and finds "AAB".',
    },
    {
      kind: 'turn',
      title: 'Your turn: carry value and last',
      lines: ['Expression Add Operators carries `value` and `last` (the last operand).', 'Appending `* x`: `value − last + last * x`, and `last = last * x`.'],
      panels: [vars({ expr: '1+2*2', value: 5, last: 4 })],
      task: { type: 'number', question: 'Append "*3". What is the new value?', options: [9, 13, 15, 36], answer: EXP.value, hint: 'Undo the last operand 4, then add 4 · 3.' },
      solved: `5 − 4 + 12 = ${EXP.value} (= 1 + 2·2·3), and last = ${EXP.last}.`,
      then: [{ say: 1, note: `value ${EXP.value}, last ${EXP.last}.`, panels: [vars({ expr: '1+2*2*3', value: EXP.value, last: EXP.last })] }],
    },
  ],

  template: [
    {
      kind: 'watch',
      title: 'Fill the blanks per family',
      lines: ['The skeleton never changes: check complete, loop the choices, CHOOSE, EXPLORE, UNDO.', 'Only the blanks change: state, next, complete.', 'At complete, record a **snapshot**, never the live array.'],
      frames: (() => {
        const rows = [
          ['Subsets', 'start', 'i + 1', 'every node'],
          ['Combo (reuse)', 'start, rem', 'i, rem − c[i]', 'rem === 0'],
          ['Permutations', 'used[]', '—', 'path.length === n'],
          ['Partition', 'start', 'end', 'start === n'],
          ['N-Queens', 'row', 'row + 1', 'row === n'],
          ['Grid path', 'r, c, k', 'k + 1', 'k === word.length'],
        ];
        return [...rows.map((r, k) => ({ say: 1, note: `${r[0]}: state ${r[1]}, next ${r[2]}, complete at ${r[3]}.`, panels: [reveal(rows, ['state', 'next', 'complete'], k)] })), { say: 2, note: 'Every row plugs into the same skeleton.', panels: [reveal(rows, ['state', 'next', 'complete'], rows.length)] }];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: when is a partition complete?',
      lines: ['Partition string: state `start`, choices `end = start+1..n`, next `end`.'],
      panels: [table(['Partition'], ['state', 'next', 'complete'], [['start', 'end', '?']], [['', '', 'active']])],
      task: {
        type: 'choose',
        question: 'Fill in "complete".',
        options: [
          { text: '`start === n`', why: '' },
          { text: 'every node', why: 'That is subsets. A partition is done only when the whole string is cut.' },
          { text: '`end === n`', why: '`end` is the loop variable picking the next cut, not the state of a call.' },
        ],
        answer: 0,
      },
      solved: 'The next call starts at `end`; when the start reaches n, every character is in a piece.',
    },
  ],

  implementation: [
    {
      kind: 'turn',
      title: 'Your turn: the default sort',
      lines: ['Subsets II sorts before skipping duplicates.', '`nums.sort()` without a comparator compares as strings.'],
      panels: [arr([10, 9, 2], { label: 'nums' })],
      task: {
        type: 'choose',
        question: 'What does `[10, 9, 2].sort()` give?',
        options: [
          { text: '[10, 2, 9]', why: '' },
          { text: '[2, 9, 10]', why: 'That needs `(a, b) => a - b`. Without it the values compare as strings.' },
          { text: '[10, 9, 2]', why: 'It does reorder: as strings "10" < "2" < "9".' },
        ],
        answer: 0,
      },
      solved: 'Always pass `(a, b) => a - b` before duplicate-skipping or break-pruning.',
    },
    {
      kind: 'watch',
      title: 'Palindrome partitioning of "aab"',
      lines: ['One level = one cut: try every `end` from `start`.', 'A piece that is not a palindrome is skipped with `continue`.', '`start === s.length`: the whole string is cut, so record.'],
      frames: treeFrames(PAL.T, 'pieces of "aab"'),
    },
    {
      kind: 'turn',
      title: 'Your turn: partitions of "aaa"',
      lines: ['Every piece of "aaa" is a palindrome.'],
      panels: [arr(['a', 'a', 'a'], { label: 's' })],
      task: { type: 'number', question: 'How many partitions does `partition("aaa")` return?', options: [2, 3, 4, 6], answer: PAL3.res.length, hint: 'There are 2 gaps between the letters; each may be cut or not.' },
      solved: `${PAL3.res.length}: ${PAL3.res.join(', ')}.`,
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'combinationSum([2, 3, 6, 7], 7)',
      lines: ['Sorted candidates: every `break` cuts the rest of that loop.', 'The recursion passes `i`, not 0, so [3,2,2] is never generated.', 'remaining 0 → record a copy.'],
      frames: DRY.map((r, k) => ({
        say: r[3].startsWith('record') ? 2 : r[3].includes('break') ? 0 : 1,
        note: `${r[0]}: ${r[3]}.`,
        panels: [dryTable(k), stk(JSON.parse(r[1])), arr(DRY_RECORDED(k).length ? DRY_RECORDED(k) : ['—'], { label: 'recorded' })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: count the breaks',
      lines: ['Each `break` stops one loop at the first candidate that is too big.', 'The last row\'s loop simply runs out of candidates after 7.'],
      panels: [dryTable(DRY.length - 1)],
      task: { type: 'number', question: 'How many times does `break` fire in the whole run?', options: [5, 6, 7, 8], answer: DRY_BREAKS, hint: 'dfs(0,1), dfs(0,3), dfs(1,2), dfs(0,5), then inside the "try 3" and "try 6" branches.' },
      solved: `${DRY_BREAKS} breaks: dfs(0,1), dfs(0,3), dfs(1,2), dfs(0,5), dfs(1,1) and dfs(1,4) under [3], and dfs(2,1) under [6].`,
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Undo only half the state',
      lines: ['Permutations of [1, 2] with `path.pop()` but **no** `used[i] = false`.', 'A stale flag hides an element from every later branch.', 'Every change in CHOOSE must be reverted in UNDO.'],
      frames: HALF.frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: break on an unsorted list',
      lines: ['Combination Sum with `break`, but the candidates were **not** sorted.', 'Target 5.'],
      panels: [arr([6, 2, 3], { label: 'candidates (unsorted)' }), vars({ remaining: 5 })],
      task: {
        type: 'choose',
        question: 'What does the search return?',
        options: [
          { text: '[]', why: '' },
          { text: '[[2, 3]]', why: '6 > 5 at index 0 breaks the root loop: 2 and 3 are never tried.' },
          { text: '[[3, 2]]', why: 'Nothing is ever pushed: the very first candidate breaks the loop.' },
        ],
        answer: 0,
      },
      solved: `Returns ${JSON.stringify(UNSORTED)}: break pruned a branch that could still succeed. Sort with (a, b) => a - b first.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: leading zeros',
      lines: ['Split the digits "105" into operands.', '"05" is not a valid operand.'],
      panels: [arr(['1', '0', '5'], { label: 'digits' })],
      task: {
        type: 'choose',
        question: 'Which split must be rejected?',
        options: [
          { text: '1 | 05', why: '' },
          { text: '10 | 5', why: 'Both 10 and 5 are normal numbers.' },
          { text: '105', why: 'One operand with no leading zero: fine.' },
        ],
        answer: 0,
      },
      solved: '"05" has a leading zero. Prune that piece instead of building on it.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'Draw two levels, then talk',
      lines: ['Draw the first two levels of the tree and say what one level decides.', 'Here one level adds the next, later element: subsets with a `start` index.', 'Read the complexity off the tree: 2ⁿ subsets, O(n) to copy each → O(n·2ⁿ).'],
      frames: [
        ...treeFrames(TWO, 'subsets of [1, 2, 3], two levels'),
        { say: 2, note: 'n = 3 → 2³ = 8 subsets, each copied in O(n).', panels: [treeAt(TWO, TWO.ev.length - 1, 'subsets of [1, 2, 3], two levels'), vars({ subsets: 2 ** 3, copy: 'O(n)', total: 'O(n·2ⁿ)' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the empty input',
      lines: ['Always mention edge cases: empty input, unreachable target, n = 1, all duplicates.'],
      panels: [arr([], { label: 'nums' })],
      task: { type: 'number', question: 'How many subsets does `subsets([])` return?', options: [0, 1, 2], answer: subsetsOf([]).length, hint: 'The root is recorded before the loop even runs.' },
      solved: 'One: `[[]]`, the empty subset.',
    },
  ],
};
