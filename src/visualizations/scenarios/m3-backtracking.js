import { layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });

// Decision-tree recorder: nodes are created while the search runs; frames keep only node states,
// and the layout is computed once at the end so nodes never move between frames.
function treeRecorder(rootLabel) {
  const root = { id: 0, label: rootLabel, children: [] };
  const byId = [root];
  const edgeLabel = {};
  return {
    root,
    size: () => byId.length,
    add(parent, label, via) {
      const n = { id: byId.length, label, children: [] };
      byId.push(n);
      parent.children.push(n);
      edgeLabel[`${parent.id}-${n.id}`] = via;
      return n;
    },
    // snaps: [{ states: {id: state} }] → nodes panels; nodes without a state are hidden.
    panel(states) {
      const layout = (this._layout ||= layoutNary(root));
      return {
        kind: 'nodes',
        nodes: layout.nodes.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, state: states[n.id] ?? 'hidden' })),
        edges: layout.edges.map(([a, b]) => ({ from: a, to: b, label: edgeLabel[`${a}-${b}`], state: states[b] === 'bad' ? 'muted' : '' })),
        directed: true,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Combination Sum: start index + sorted break-pruning.
// ---------------------------------------------------------------------------
const MAX_TREE = 15;

export const backtrackingCombinationSum = {
  title: 'Backtracking: combination sum (start index + pruning)',
  description:
    'Combination Sum with reuse: the loop starts at `start`, so each combination is built in one order only; sorting lets us `break` once a candidate is bigger than what remains. Input is clamped to ≤ 4 distinct candidates in 2..20 and a target in 1..8; the tree shows at most 15 calls.',
  defaultInput: { candidates: [2, 3, 6, 7], target: 7 },
  fields: [
    { key: 'candidates', type: 'numbers', label: 'candidates (≤ 4, each 2..20)' },
    { key: 'target', type: 'number', label: 'target (1..8)' },
  ],
  testInputs: [
    { candidates: [], target: 5 },
    { candidates: [4, 6], target: 7 },
    { candidates: [7], target: 7 },
    { candidates: [2, 2, 3, 5, 9, 11], target: 8 },
    { candidates: [3, 1, 2], target: 100 },
  ],
  generate({ candidates, target }) {
    const cands = [...new Set((candidates || []).map(Math.round).filter((v) => v >= 2 && v <= 20))].slice(0, 4).sort((a, b) => a - b);
    const T = Math.min(8, Math.max(1, Math.round(Number(target) || 1)));
    const tree = treeRecorder(String(T));
    const snaps = [];
    const result = [];
    const path = [];
    const callStack = [];
    const states = { 0: 'active' };
    let truncated = false;
    let asks = { brk: false, start: false, rec: false };

    const snap = (note, extra = {}) => {
      if (truncated) return null;
      const s = { note, states: { ...states }, path: [...path], result: result.map((r) => r.join('+')), stack: [...callStack], ...extra };
      snaps.push(s);
      return s;
    };

    const backtrack = (start, remaining, node) => {
      callStack.push(`bt(${start}, ${remaining})`);
      if (remaining === 0) {
        result.push([...path]);
        if (node) states[node.id] = 'done';
        const s = snap(`remaining = 0 → record [${path.join(', ')}] and return.`, { i: null, start });
        if (s && !asks.rec && path.length) {
          asks.rec = true;
          s.predict = ask(`Path [${path.slice(0, -1).join(', ')}] had remaining ${path[path.length - 1]}. We push ${path[path.length - 1]}. What happens next?`, ['Keep looping — maybe a bigger sum fits', `remaining hits 0 → record [${path.join(', ')}]`, 'Break — the candidate is too big'], 1, 'remaining − candidate = 0 is exactly the base case: a copy of path goes into result.');
        }
        callStack.pop();
        return;
      }
      for (let i = start; i < cands.length; i++) {
        const c = cands[i];
        if (c > remaining) {
          const s = snap(`candidates[${i}] = ${c} > remaining ${remaining} → break. The list is sorted, so every later candidate is too big as well.`, { i, start, bad: true });
          if (s && !asks.brk) {
            asks.brk = true;
            s.predict = ask(`Path [${path.join(', ')}], remaining ${remaining}. The next candidate is ${c}. What does the loop do?`, [`Push ${c} and recurse`, `Skip ${c} and try the next candidate`, 'break — sorted, so every later candidate is too big'], 2, 'Sorting is what makes break safe: nothing after this candidate can fit either.');
          }
          break;
        }
        path.push(c);
        let child = null;
        if (node && tree.size() < MAX_TREE) child = tree.add(node, String(remaining - c), `+${c}`);
        else truncated = true;
        if (node) states[node.id] = 'visited';
        if (child) states[child.id] = 'active';
        if (remaining - c !== 0) {
          const s = snap(`Choose ${c}: path = [${path.join(', ')}], remaining = ${remaining - c}. Recurse with start = i = ${i}: ${c} may be picked again, but smaller candidates never come back, so no combination repeats in another order.`, { i, start: i });
          if (s && !asks.start && i > 0) {
            asks.start = true;
            s.predict = ask(`We choose ${c} = candidates[${i}]. Where does the child's loop start?`, ['At index 0 — try every candidate again', `At index ${i} — ${c} may be reused, smaller ones may not`, `At index ${i + 1} — ${c} can be used once`], 1, `Starting at i keeps the indices non-decreasing along the path, so [${cands[0]}, ${c}] and [${c}, ${cands[0]}] cannot both appear.`);
          }
        }
        backtrack(i, remaining - c, child);
        path.pop();
        if (child && states[child.id] !== 'done') states[child.id] = 'visited';
        if (node) states[node.id] = 'active';
        snap(`Back at remaining ${remaining}: pop ${c} (undo) → path = [${path.join(', ')}]. ${i + 1 < cands.length ? `Try the next candidate, ${cands[i + 1]}.` : 'No candidates left in this loop → return.'}`, { i, start });
      }
      if (!cands.length) snap('No candidates at all → the loop never runs and nothing is recorded.', { i: null, start });
      callStack.pop();
    };

    snap(`Sort candidates → [${cands.join(', ')}]. Start backtrack(start = 0, remaining = ${T}). Each tree node shows what is still needed; edges show the number chosen.`, { i: null, start: 0 });
    backtrack(0, T, tree.root);
    const wasCut = truncated;
    truncated = false;
    for (const id of Object.keys(states)) if (states[id] === 'active') states[id] = 'visited';
    snap(
      `${result.length ? `Done: ${result.length} combination(s) — ${result.map((r) => `[${r.join(', ')}]`).join(', ')}.` : `No combination of [${cands.join(', ')}] sums to ${T}.`}${wasCut ? ' (The tree shows only the first 15 calls; the rest ran the same way.)' : ''} Worst case is exponential in target / smallest candidate; break-pruning cuts whole subtrees.`,
      { i: null, start: null },
    );

    return snaps.map((s) => {
      const highlights = {};
      cands.forEach((_, k) => {
        if (s.start != null && k < s.start) highlights[k] = 'muted';
      });
      if (s.i != null) highlights[s.i] = s.bad ? 'bad' : 'active';
      const pointers = [];
      if (s.start != null && s.start < cands.length) pointers.push({ index: s.start, label: 'start', color: 'a' });
      if (s.i != null) pointers.push({ index: s.i, label: 'i', color: 'b' });
      const f = {
        note: s.note,
        panels: [
          tree.panel(s.states),
          arr(cands, { label: 'candidates (sorted)', highlights, pointers }),
          arr(s.result, { label: 'result' }),
          vars({ path: `[${s.path.join(', ')}]`, remaining: T - s.path.reduce((a, b) => a + b, 0) }),
          stack(s.stack, 'call stack'),
        ],
      };
      if (s.predict) f.predict = s.predict;
      return f;
    });
  },
};

// ---------------------------------------------------------------------------
// Generate Parentheses: build char by char; open/close counters prune invalid prefixes.
// ---------------------------------------------------------------------------
export const backtrackingParentheses = {
  title: 'Backtracking: generate parentheses (open / close counts)',
  description:
    'Build the string one character at a time: add "(" only while open < n, add ")" only while close < open, so only valid prefixes are ever built. Red nodes are the branches the counters refuse. n is clamped to 0..2 so the whole tree fits (n = 3 already has 22 valid prefixes).',
  defaultInput: { n: 2 },
  fields: [{ key: 'n', type: 'number', label: 'n pairs (0..2)' }],
  testInputs: [{ n: 0 }, { n: 1 }, { n: -3 }, { n: 9 }],
  generate({ n }) {
    const N = Math.min(2, Math.max(0, Math.round(Number(n) || 0)));
    const tree = treeRecorder('""');
    const snaps = [];
    const result = [];
    const path = [];
    const callStack = [];
    const states = { 0: 'active' };
    let open = 0;
    let close = 0;
    const asked = { open: false, close: false, rec: false };
    const snap = (note) => {
      const s = { note, states: { ...states }, path: [...path], result: [...result], stack: [...callStack], open, close };
      snaps.push(s);
      return s;
    };

    const gen = (node) => {
      callStack.push(`"${path.join('')}"`);
      if (path.length === 2 * N) {
        result.push(path.join(''));
        states[node.id] = 'done';
        const s = snap(`Length ${path.length} = 2n → "${path.join('')}" is complete and valid. Record it, then go back up.`);
        if (!asked.rec && path.length) {
          asked.rec = true;
          s.predict = ask(`The string is now "${path.join('')}" (length ${path.length}, n = ${N}). What happens?`, [`Record "${path.join('')}" and return`, 'Try adding "(" once more', 'Stop the whole search — one answer is enough'], 0, 'Length 2n is the base case: every valid prefix of full length is an answer.');
        }
        callStack.pop();
        return;
      }
      for (const ch of ['(', ')']) {
        const ok = ch === '(' ? open < N : close < open;
        const label = path.join('') + ch;
        if (!ok) {
          const bad = tree.add(node, label, ch);
          states[bad.id] = 'bad';
          const why = ch === '(' ? `open = ${open} = n, no "(" left to place` : `close = ${close} = open, a ")" would have nothing to match`;
          const s = snap(`Try "${ch}" after "${path.join('')}": ${why} → prune. "${label}" can never become valid, so its whole subtree is skipped.`);
          const key = ch === '(' ? 'open' : 'close';
          if (!asked[key]) {
            asked[key] = true;
            s.predict = ask(`At "${path.join('')}" (open ${open}, close ${close}, n ${N}) we try "${ch}". Is it allowed?`, ['Yes — any character is fine until the end', `No — ${ch === '(' ? 'open < n fails' : 'close < open fails'}`, 'Yes, but the result is filtered out later'], 1, 'Checking the counters while building means invalid prefixes are never extended.');
          }
          continue;
        }
        const child = tree.add(node, label, ch);
        path.push(ch);
        if (ch === '(') open++;
        else close++;
        states[node.id] = 'visited';
        states[child.id] = 'active';
        snap(`Add "${ch}" (${ch === '(' ? 'open < n' : 'close < open'}) → "${path.join('')}", open = ${open}, close = ${close}.`);
        gen(child);
        path.pop();
        if (ch === '(') open--;
        else close--;
        if (states[child.id] !== 'done') states[child.id] = 'visited';
        states[node.id] = 'active';
        snap(`Back at "${path.join('')}": pop "${ch}" (undo) so the shared path is clean for the next choice.${ch === '(' ? ' Now try ")".' : ''}`);
      }
      callStack.pop();
    };

    snap(`n = ${N}. Start with an empty string, open = 0, close = 0. At each position we may add "(" or ")" — if the counters allow it.`);
    gen(tree.root);
    for (const id of Object.keys(states)) if (states[id] === 'active') states[id] = 'visited';
    snap(`All ${result.length} valid string(s): ${result.map((r) => `"${r}"`).join(', ')}. Only valid prefixes were built; the count is the Catalan number, roughly O(4ⁿ / √n) results, each of length 2n.`);

    // The second "Is it allowed?" question uses a different answer slot.
    const second = snaps.filter((s) => s.predict && s.predict.question.startsWith('At "'))[1];
    if (second) second.predict = ask(second.predict.question, ['Yes — any character is fine until the end', 'Yes, but the result is filtered out later', second.predict.options[1]], 2, second.predict.explain);

    return snaps.map((s) => {
      const f = {
        note: s.note,
        panels: [
          tree.panel(s.states),
          arr(s.path, { label: 'path (string being built)' }),
          arr(s.result.map((r) => (r === '' ? '""' : r)), { label: 'result' }),
          vars({ n: N, open: s.open, close: s.close }),
          stack(s.stack, 'call stack'),
        ],
      };
      if (s.predict) f.predict = s.predict;
      return f;
    });
  },
};

// ---------------------------------------------------------------------------
// Word Search: mark the cell, try 4 neighbours, restore on the way back.
// ---------------------------------------------------------------------------
const DIRS = [
  ['down', 1, 0],
  ['up', -1, 0],
  ['right', 0, 1],
  ['left', 0, -1],
];
const MAX_FRAMES = 60;

export const backtrackingWordSearch = {
  title: 'Backtracking: word search (mark, explore, restore)',
  description:
    'For each start cell, dfs(r, c, k) checks the letter, marks the cell "#" so this path cannot reuse it, tries down, up, right, left, then restores the letter so other paths may use it. Green = cells on the current path. Board is clamped to 4×4, word to 8 letters.',
  defaultInput: { board: [['A', 'B', 'E'], ['B', 'C', 'E'], ['D', 'E', 'E']], word: 'ABCBD' },
  fields: [
    { key: 'board', type: 'json', label: 'board (≤ 4×4 letters)' },
    { key: 'word', type: 'string', label: 'word (≤ 8)' },
  ],
  testInputs: [
    { board: [], word: 'A' },
    { board: [['A', 'B'], ['C', 'D']], word: 'ABDCA' },
    { board: [['A']], word: 'A' },
    { board: [['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], word: 'ABCCED' },
    { board: [['A', 'A', 'A', 'A'], ['A', 'A', 'A', 'A'], ['A', 'A', 'A', 'A'], ['A', 'A', 'A', 'A']], word: 'AAAAAAAB' },
    { board: [['A', 'B']], word: '' },
  ],
  generate({ board, word }) {
    const rows = Array.isArray(board) ? board.slice(0, 4).filter(Array.isArray) : [];
    const C = Math.min(4, rows.length ? Math.max(...rows.map((r) => r.length)) : 0);
    const grid = C ? rows.map((r) => Array.from({ length: C }, (_, c) => String(r[c] ?? '.').slice(0, 1) || '.')) : [];
    const R = grid.length;
    const w = String(word ?? '').slice(0, 8);
    const frames = [];
    const onPath = [];
    const callStack = [];
    const used = new Set(); // cells marked at least once (to spot the first re-use after a restore)
    let pending = []; // failed neighbour checks, reported in the next frame's note
    let skipped = 0;
    let found = false;
    const asked = { restore: false, reuse: false, dir: false };

    const push = (note, opts = {}) => {
      if (frames.length >= MAX_FRAMES) {
        skipped++;
        return null;
      }
      const states = grid.map((row) => row.map(() => ''));
      for (const [r, c] of onPath) states[r][c] = 'active';
      if (opts.done) for (const [r, c] of opts.done) states[r][c] = 'done';
      if (opts.bad) states[opts.bad[0]][opts.bad[1]] = 'bad';
      const cells = grid.map((row) => [...row]);
      const k = opts.k ?? onPath.length;
      const hl = {};
      for (let i = 0; i < Math.min(k, w.length); i++) hl[i] = opts.done ? 'done' : 'visited';
      if (k < w.length && !opts.done) hl[k] = 'active';
      const f = {
        note: (pending.length ? `${pending.join('; ')}. ` : '') + note,
        panels: [
          { kind: 'grid', cells, states, label: 'board' },
          arr(w.split(''), { label: 'word', highlights: hl, pointers: k < w.length ? [{ index: k, label: 'k', color: 'a' }] : [] }),
          vars({ k, found: String(found) }),
          stack([...callStack], 'call stack'),
        ],
      };
      pending = [];
      frames.push(f);
      return f;
    };

    const dfs = (r, c, k, dirName, from) => {
      if (k === w.length) return true;
      if (r < 0 || c < 0 || r >= R || c >= C) {
        if (from) pending.push(`${dirName} of (${from}) is off the board`);
        return false;
      }
      if (grid[r][c] !== w[k]) {
        if (from) pending.push(`${dirName} (${r},${c}) is ${grid[r][c] === '#' ? '"#" (already on this path)' : `"${grid[r][c]}" ≠ "${w[k]}"`}`);
        return false;
      }
      const reuse = used.has(`${r},${c}`) && from;
      used.add(`${r},${c}`);
      const saved = grid[r][c];
      grid[r][c] = '#';
      onPath.push([r, c]);
      callStack.push(`(${r},${c}) k=${k}`);
      const f = push(`(${r},${c}) = "${saved}" matches word[${k}] → mark it "#" (choose). Next: look for "${w[k + 1] ?? '—'}" down, up, right, left.`.replace(' Next: look for "—" down, up, right, left.', ' That was the last letter.'), { k: k + 1 });
      if (f && reuse && !asked.reuse) {
        asked.reuse = true;
        f.predict = ask(`A new path reaches (${r},${c}), which an earlier, failed path also used. Can this path use it?`, ['No — it is still marked "#" from the failed path', 'No — every cell can be tried only once', `Yes — the failed path restored it to "${saved}" when it backtracked`], 2, 'Restoring on the way back is exactly what lets a cell join a different path later.');
      } else if (f && from && k === w.length - 1 && !asked.dir) {
        asked.dir = true;
        f.predict = ask(`From (${from}) we need the last letter "${w[k]}". Trying down, up, right, left in order — which neighbour matches?`, DIRS.map((d) => d[0]), DIRS.findIndex((d) => d[0] === dirName), 'The first neighbour in order that holds the letter (and is not "#") is taken.');
      }
      let ok = false;
      for (const [name, dr, dc] of DIRS) {
        if (dfs(r + dr, c + dc, k + 1, name, `${r},${c}`)) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        grid[r][c] = saved;
        onPath.pop();
        const g = push(`All 4 neighbours of (${r},${c}) failed → restore "${saved}" (undo) and return false to the caller.`, { k, bad: [r, c] });
        if (g && !asked.restore) {
          asked.restore = true;
          g.predict = ask(`Every neighbour of (${r},${c}) failed. What happens to that cell now?`, ['It stays "#" so no path ever tries it again', `It is restored to "${saved}" and dfs returns false`, 'The whole search restarts from (0,0)'], 1, 'Marking is only for the current path; undoing it keeps the board correct for other paths.');
        }
        callStack.pop();
      } else {
        if (k === w.length - 1) {
          found = true;
          push(`k = ${w.length} = word length → the whole word "${w}" is matched. Return true all the way up (each cell is restored as its call returns).`, { k: w.length, done: onPath.map((p) => [...p]) });
        }
        grid[r][c] = saved;
        callStack.pop();
      }
      return ok;
    };

    push(`Find "${w}" in the ${R}×${C} board. Try every cell as a start; a path may not reuse a cell.`, { k: 0 });
    let starts = [];
    outer: for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        if (w.length === 0) {
          found = true;
          break outer;
        }
        if (grid[r][c] !== w[0]) {
          starts.push(`(${r},${c})`);
          continue;
        }
        if (starts.length) pending.push(`start cells ${starts.join(', ')} are not "${w[0]}"`);
        starts = [];
        if (dfs(r, c, 0, 'start', null)) {
          break outer;
        }
      }
    if (starts.length && !found) pending.push(`start cells ${starts.join(', ')} are not "${w[0]}"`);
    if (frames.length >= MAX_FRAMES) frames.pop(); // keep room for the answer
    const summary = skipped ? ` (${skipped} more steps ran but are not shown.)` : '';
    if (found) {
      const last = frames[frames.length - 1];
      const done = last.panels[0].states;
      frames.push({
        note: `Answer: true — "${w}" ${w.length ? 'exists in the board' : 'is empty, so it trivially matches'}. Every mark was restored, so the board is unchanged.${summary} Time O(R·C·3^L) for word length L: after the first step each cell has at most 3 unvisited neighbours.`,
        panels: [{ kind: 'grid', cells: grid.map((row) => [...row]), states: done.map((row) => row.map((s) => (s === 'done' ? 'done' : ''))), label: 'board' }, ...last.panels.slice(1)],
      });
    } else {
      frames.push({
        note: `${pending.length ? `${pending.join('; ')}. ` : ''}Answer: false — no start cell leads to "${w}" without reusing a cell.${summary} Time O(R·C·3^L) for word length L.`,
        panels: [{ kind: 'grid', cells: grid.map((row) => [...row]), states: grid.map((row) => row.map(() => 'muted')), label: 'board' }, arr(w.split(''), { label: 'word' }), vars({ found: 'false' }), stack([], 'call stack')],
      });
    }
    return frames;
  },
};
