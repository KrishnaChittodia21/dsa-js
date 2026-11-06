// Shorts for DP 2D (M9). Format: src/content/shortSchema.js. Facts come only from topics/dp-2d/topic.js.
// Every dp cell, rolling-array slot and count below comes from running the pattern's template (or the lesson's 2D
// version of it) on the "e.g." input next to it; check() compares each result with a brute force at load.
const arr = (values, opts = {}) => ({ kind: 'array', values: values.map(String), ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) =>
  ({ kind: 'table', rowLabels, colLabels, cells: cells.map((r) => r.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((r) => r.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
// states for an m × n panel from { 'r,c': state }
const sm = (m, n, marks = {}) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => marks[`${r},${c}`] || ''));
const mk = (cells, s) => Object.fromEntries(cells.map(([r, c]) => [`${r},${c}`, s]));
// the table as it looks once cell (R, C) is written in row-major order; `fixed(r, c)` cells (base cases) always show
const upTo = (dp, R, C, fixed = () => false) => dp.map((row, r) => row.map((v, c) => (fixed(r, c) || r < R || (r === R && c <= C) ? v : '·')));
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-2d shorts: ${msg}`);
};

// ---------- grid DP: e.g. minimum path sum, right/down moves ----------
const G = [
  [1, 4, 2],
  [2, 3, 2],
  [5, 1, 2],
];
// the template with base = grid[0][0], NEUTRAL = Infinity, combine = cell + min(top, left)
const GDP = Array.from({ length: 3 }, () => new Array(3).fill(0));
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) {
    if (r === 0 && c === 0) {
      GDP[r][c] = G[0][0];
      continue;
    }
    const fromTop = r > 0 ? GDP[r - 1][c] : Infinity;
    const fromLeft = c > 0 ? GDP[r][c - 1] : Infinity;
    GDP[r][c] = G[r][c] + Math.min(fromTop, fromLeft);
  }
// brute force: every right/down path, with its cells
const PATHS = [];
(function walk(r, c, cells) {
  const here = [...cells, [r, c]];
  if (r === 2 && c === 2) return PATHS.push({ cells: here, sum: here.reduce((s, [a, b]) => s + G[a][b], 0) });
  if (r < 2) walk(r + 1, c, here);
  if (c < 2) walk(r, c + 1, here);
})(0, 0, []);
const G_BEST = Math.min(...PATHS.map((p) => p.sum));
check(PATHS.length === 6 && G_BEST === GDP[2][2] && GDP[2][2] === 9 && GDP[1][2] === 8 && GDP[2][1] === 7, 'grid min path');
const pathOf = (moves) => PATHS.find((p) => p.cells.map(([r, c]) => `${r}${c}`).join() === moves);
const PA = pathOf('00,01,11,12,22');
const PB = pathOf('00,10,11,12,22');
const gFixed = (r, c) => r === 0 && c === 0;
const gFrame = (r, c, say, note) => {
  const reads = [r > 0 && [r - 1, c], c > 0 && [r, c - 1]].filter(Boolean);
  return {
    say,
    note,
    panels: [
      grid(G, sm(3, 3, { [`${r},${c}`]: 'active' }), 'grid'),
      table(['0', '1', '2'], ['0', '1', '2'], upTo(GDP, r, c, gFixed), sm(3, 3, { ...mk(reads, 'visited'), [`${r},${c}`]: 'active' }), 'dp = cheapest cost to reach'),
    ],
  };
};

// ---------- two sequences: e.g. LCS of a = "cab", b = "abcb" ----------
const A = 'cab';
const B = 'abcb';
const LM = A.length,
  LN = B.length;
const L = Array.from({ length: LM + 1 }, () => new Array(LN + 1).fill(0)); // the twoSeq template (LCS)
for (let i = 1; i <= LM; i++)
  for (let j = 1; j <= LN; j++) L[i][j] = A[i - 1] === B[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
// brute force: every subsequence of a, kept if it is a subsequence of b
const isSub = (s, t) => {
  let k = 0;
  for (const ch of t) if (ch === s[k]) k++;
  return k === s.length;
};
const SUBS = [];
for (let mask = 1; mask < 1 << LM; mask++) SUBS.push([...A].filter((_, k) => mask & (1 << k)).join(''));
const SUBS_IN_B = SUBS.filter((s) => isSub(s, B));
const L_BRUTE = Math.max(...SUBS_IN_B.map((s) => s.length));
check(L[LM][LN] === L_BRUTE && L_BRUTE === 2 && L[2][3] === 1 && L[2][4] === 1 && L[3][3] === 2, 'LCS cab/abcb');
const LROWS = ['""', ...A];
const LCOLS = ['""', ...B];
const lBase = (i, j) => i === 0 || j === 0;
const lFrame = (i, j, say, note) => {
  const match = A[i - 1] === B[j - 1];
  const reads = match ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]];
  return { say, note, panels: [table(LROWS, LCOLS, upTo(L, i, j, lBase), sm(LM + 1, LN + 1, { ...mk(reads, 'visited'), [`${i},${j}`]: 'active' }), 'dp[i][j] = LCS of the prefixes')] };
};
const lNote = (i, j) => {
  const ca = A[i - 1],
    cb = B[j - 1];
  return ca === cb
    ? `(${i}, ${j}): ${ca} = ${cb} → diagonal + 1 = ${L[i - 1][j - 1]} + 1 = ${L[i][j]}.`
    : `(${i}, ${j}): ${ca} ≠ ${cb} → max(up ${L[i - 1][j]}, left ${L[i][j - 1]}) = ${L[i][j]}.`;
};

// ---------- 0/1 knapsack: e.g. items (w, v) = (2, 4), (1, 2), (3, 5), capacity 4 ----------
const KW = [2, 1, 3];
const KV = [4, 2, 5];
const KC = 4;
const K2 = Array.from({ length: KW.length + 1 }, () => new Array(KC + 1).fill(0)); // the lesson's knapsack2D
for (let i = 1; i <= KW.length; i++)
  for (let c = 0; c <= KC; c++) {
    K2[i][c] = K2[i - 1][c];
    if (c >= KW[i - 1]) K2[i][c] = Math.max(K2[i][c], K2[i - 1][c - KW[i - 1]] + KV[i - 1]);
  }
// the 1D template for one item, backwards (or forwards for contrast), recording every write
function pass(dp0, w, v, backwards) {
  const dp = dp0.slice();
  const recs = [];
  const cs = backwards ? Array.from({ length: KC - w + 1 }, (_, k) => KC - k) : Array.from({ length: KC - w + 1 }, (_, k) => w + k);
  for (const c of cs) {
    const read = dp[c - w];
    dp[c] = Math.max(dp[c], read + v);
    recs.push({ c, read, dp: dp.slice() });
  }
  return { dp, recs };
}
const K_ZERO = new Array(KC + 1).fill(0);
const K_FWD = pass(K_ZERO, KW[0], KV[0], false);
const K_BWD = pass(K_ZERO, KW[0], KV[0], true);
const K_T_BWD = pass(K_BWD.dp, KW[1], KV[1], true); // the turn: item (1, 2)
const K_T_FWD = pass(K_BWD.dp, KW[1], KV[1], false);
const K_1D = KW.reduce((dp, w, i) => pass(dp, w, KV[i], true).dp, K_ZERO);
// brute force: every subset
const SUBSETS = Array.from({ length: 1 << KW.length }, (_, mask) => {
  const pick = KW.map((_, k) => (mask >> k) & 1);
  return { pick, w: pick.reduce((s, p, k) => s + p * KW[k], 0), v: pick.reduce((s, p, k) => s + p * KV[k], 0) };
});
const K_BRUTE = Math.max(...SUBSETS.filter((s) => s.w <= KC).map((s) => s.v));
const K_ALL_FWD = KW.reduce((dp, w, i) => pass(dp, w, KV[i], false).dp, K_ZERO);
check(K2[3][KC] === K_BRUTE && K_1D[KC] === K_BRUTE && K_BRUTE === 7 && K_ALL_FWD[KC] === 8, 'knapsack totals');
check(K_FWD.dp[4] === 8 && K_BWD.dp[4] === 4 && K_T_BWD.recs[0].read === 4 && K_T_BWD.dp[4] === 6 && K_T_FWD.dp[4] === 8 && K2[2][4] === 6, 'knapsack passes');
const KROWS = ['none', ...KW.map((w, k) => `(${w}, ${KV[k]})`)];
const KCOLS = Array.from({ length: KC + 1 }, (_, c) => `c=${c}`);
const kRow = (i, c) => {
  const w = KW[i - 1];
  const reads = [[i - 1, c], ...(c >= w ? [[i - 1, c - w]] : [])];
  const show = K2.map((row, r) => row.map((v) => (r <= i ? v : '·')));
  return table(KROWS, KCOLS, show, sm(KW.length + 1, KC + 1, { ...mk(reads, 'visited'), [`${i},${c}`]: 'active' }), 'dp[i][c] = best value');
};
const subsetLabel = (s) => (s.pick.some(Boolean) ? s.pick.map((p, k) => (p ? `(${KW[k]}, ${KV[k]})` : '')).filter(Boolean).join(' + ') : 'none');
const passFrame = (run, k, label, note, bad) => {
  const r = run.recs[k];
  return { say: bad ? 1 : 2, note, panels: [arr(r.dp, { label, pointers: [ptr(r.c, 'c')], highlights: { [r.c]: bad ? 'bad' : 'active', [r.c - KW[0]]: 'visited' } })] };
};

// ---------- unbounded knapsack: e.g. coins [2, 3], amount 5 ----------
const COINS = [2, 3];
const AMT = 5;
// countCombinations, recording every write
const U = new Array(AMT + 1).fill(0);
U[0] = 1;
const URECS = [];
for (const coin of COINS)
  for (let a = coin; a <= AMT; a++) {
    U[a] += U[a - coin];
    URECS.push({ coin, a, read: U[a - coin], dp: U.slice() });
  }
// 2D form: dp[i][a] = dp[i−1][a] + dp[i][a − coin]
const U2 = [[1, ...new Array(AMT).fill(0)]];
for (const coin of COINS) {
  const prev = U2.at(-1);
  const row = [];
  for (let a = 0; a <= AMT; a++) row.push(prev[a] + (a >= coin ? row[a - coin] : 0));
  U2.push(row);
}
// the same pass with the 0/1 backwards loop, coin 2 only
const U_BACK = [1, 0, 0, 0, 0, 0];
for (let a = AMT; a >= COINS[0]; a--) U_BACK[a] += U_BACK[a - COINS[0]];
// the lesson's permutations(): amount outer, coins inner
const UP = new Array(AMT + 1).fill(0);
UP[0] = 1;
for (let a = 1; a <= AMT; a++) for (const x of COINS) if (x <= a) UP[a] += UP[a - x];
// brute force: multisets (counts of each coin) and ordered sequences
let combos = 0;
for (let k2 = 0; 2 * k2 <= AMT; k2++) for (let k3 = 0; 2 * k2 + 3 * k3 <= AMT; k3++) if (2 * k2 + 3 * k3 === AMT) combos++;
const seqs = (left) => (left === 0 ? 1 : COINS.reduce((s, x) => s + (x <= left ? seqs(left - x) : 0), 0));
check(U[AMT] === combos && combos === 1 && UP[AMT] === seqs(AMT) && UP[AMT] === 2, 'coin counts');
check(U2[2].join() === U.join() && U2[1][4] === 1 && U_BACK[4] === 0 && U[4] === 1, 'coin tables');
const UROWS = ['none', 'coin 2', 'coin 3'];
const UCOLS = Array.from({ length: AMT + 1 }, (_, a) => `a=${a}`);
const uTable = (i, a) => {
  const coin = COINS[i - 1];
  const reads = [[i - 1, a], ...(a >= coin ? [[i, a - coin]] : [])];
  return table(UROWS, UCOLS, U2.map((row, r) => row.map((v) => (r <= i ? v : '·'))), sm(3, AMT + 1, { ...mk(reads, 'visited'), [`${i},${a}`]: 'active' }), 'dp[i][a] = ways');
};
const uRec = (coin, a) => URECS.find((r) => r.coin === coin && r.a === a);
const uFrame = (coin, a, note) => {
  const r = uRec(coin, a);
  return { say: 0, note, panels: [arr(r.dp, { label: `dp, coin ${coin} forwards`, pointers: [ptr(a, 'a')], highlights: { [a]: 'active', [a - coin]: 'visited' } })] };
};

export default [
  {
    id: 'dp-2d-grid',
    title: 'Cheapest path, one cell at a time',
    steps: [
      {
        kind: 'watch',
        title: 'Every path, added up again',
        lines: ['Cheapest path from top-left to bottom-right, moving **only right or down**.', 'Trying every path is exponential: a 3×7 grid already has 28 paths, a 16×16 grid over 155 million.'],
        frames: [
          { say: 0, note: 'e.g. this 3 × 3 grid of costs. Even here there are 6 different paths.', panels: [grid(G, null, 'grid')] },
          { say: 1, note: `Path right, down, right, down costs ${PA.sum}. It ends with the cells (1,1) → (1,2) → (2,2).`, panels: [grid(G, sm(3, 3, mk(PA.cells, 'visited')), 'grid')] },
          { say: 1, note: `Path down, right, right, down costs ${PB.sum}, and re-adds that same tail. Best of all 6: ${G_BEST}.`, panels: [grid(G, sm(3, 3, { ...mk(PB.cells, 'visited'), '1,1': 'bad', '1,2': 'bad', '2,2': 'bad' }), 'grid')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Each cell from top and left',
        lines: [
          '`dp[r][c]` = cheapest cost to reach (r, c). Base: `dp[0][0] = grid[0][0]`.',
          '`dp[r][c] = grid[r][c] + min(top, left)`: a path can only enter a cell from those two.',
          'Fill row by row, left to right, so top and left are always ready.',
        ],
        frames: [
          gFrame(0, 0, 0, `Start: dp[0][0] = ${G[0][0]}.`),
          gFrame(0, 2, 2, `First row: only from the left. ${GDP[0].join(', ')}.`),
          gFrame(1, 0, 2, `First column: only from above. dp[1][0] = ${G[1][0]} + ${GDP[0][0]} = ${GDP[1][0]}.`),
          gFrame(1, 1, 1, `dp[1][1] = ${G[1][1]} + min(top ${GDP[0][1]}, left ${GDP[1][0]}) = ${GDP[1][1]}.`),
          gFrame(2, 1, 1, `dp[2][1] = ${G[2][1]} + min(top ${GDP[1][1]}, left ${GDP[2][0]}) = ${GDP[2][1]}. Every cell computed once.`),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: [
          'Clues: **"can only move right or down"**, **"minimum path sum"**, **"number of unique paths"**, **"obstacles"**, **"largest square of 1s"**.',
          'Moves in all four directions → cells depend on each other in a cycle: BFS / Dijkstra, not DP.',
        ],
        frames: [
          { say: 0, note: `9 cells, O(rows·cols), instead of trying all ${PATHS.length} paths.`, panels: [vars({ paths: PATHS.length, cells: 9, time: 'O(rows·cols)' })] },
          { say: 1, note: 'With up and left moves too, dp[r][c] would read dp[r+1][c], which reads dp[r][c] back.', panels: [vars({ 'right/down': 'no cycle → DP', 'four directions': 'cycle → BFS / Dijkstra' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the bottom-right cell',
        lines: [`Everything but the corner is filled. The corner costs ${G[2][2]}.`, `Above it: ${GDP[1][2]}. Left of it: ${GDP[2][1]}.`],
        panels: [grid(G, sm(3, 3, { '2,2': 'active' }), 'grid'), table(['0', '1', '2'], ['0', '1', '2'], upTo(GDP, 2, 1), sm(3, 3, { '1,2': 'visited', '2,1': 'visited', '2,2': 'active' }), 'dp')],
        task: {
          type: 'choose',
          question: 'What is dp[2][2]?',
          options: [
            { text: `${G[2][2]} + min(${GDP[1][2]}, ${GDP[2][1]}) = ${GDP[2][2]}` },
            { text: `${G[2][2]} + ${GDP[1][2]} + ${GDP[2][1]} = ${G[2][2] + GDP[1][2] + GDP[2][1]}`, why: 'Adding top and left counts paths. A cost needs only the cheaper of the two ways in.' },
            { text: `${G[2][2]} + min(${GDP[1][2]}, ${GDP[2][1]}, ${GDP[1][1]}) = ${G[2][2] + GDP[1][1]}`, why: 'Top-left is for the maximal-square variant. A path cannot move diagonally into the corner.' },
            { text: `${G[2][2]} + max(${GDP[1][2]}, ${GDP[2][1]}) = ${G[2][2] + GDP[1][2]}`, why: 'max gives the most expensive way in; the question asks for the cheapest.' },
          ],
          answer: 0,
        },
        solved: `**cell + min(top, left)**: the corner holds ${GDP[2][2]}, the cheapest of all ${PATHS.length} paths, from 9 cells computed once.`,
      },
    ],
  },

  {
    id: 'dp-2d-two-sequences',
    title: 'Two strings, one table of prefixes',
    steps: [
      {
        kind: 'watch',
        title: 'Every subsequence, one by one',
        lines: ['**Longest common subsequence**: characters in order, gaps allowed.', 'Trying every subsequence of a is exponential: 2^m of them, each checked against b.'],
        frames: [
          { say: 0, note: `e.g. a = "${A}", b = "${B}".`, panels: [arr([...A], { label: 'a' }), arr([...B], { label: 'b' })] },
          {
            say: 1,
            note: `All ${SUBS.length} non-empty subsequences of "${A}"; ${SUBS_IN_B.length} also appear in "${B}". Longest: ${L_BRUTE}.`,
            panels: [arr(SUBS, { label: 'subsequences of a', highlights: hl(SUBS.length, (k) => (isSub(SUBS[k], B) ? (SUBS[k].length === L_BRUTE ? 'active' : 'done') : 'bad')) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Decide the last characters',
        lines: [
          '`dp[i][j]` = answer for `a[0..i)` and `b[0..j)`. Row 0 and column 0 are the empty prefix: 0.',
          '`a[i−1] === b[j−1]` → **diagonal + 1**: match them together.',
          'Different → **max(up, left)**: one of them is not in the LCS, drop it.',
        ],
        frames: [
          { say: 0, note: 'One extra row and column for the empty prefix. Nothing in common with "": 0.', panels: [table(LROWS, LCOLS, upTo(L, 1, 0, lBase), sm(LM + 1, LN + 1, mk([...Array(LN + 1).keys()].map((j) => [0, j]).concat([1, 2, 3].map((i) => [i, 0])), 'muted')), 'dp[i][j] = LCS of the prefixes')] },
          lFrame(1, 3, 1, lNote(1, 3)),
          lFrame(2, 1, 1, lNote(2, 1)),
          lFrame(2, 4, 2, lNote(2, 4)),
          lFrame(3, 2, 1, lNote(3, 2)),
          lFrame(3, 3, 2, lNote(3, 3)),
        ],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"two strings"**, **"subsequence"** (not substring), **"insert, delete, replace"**, **"number of distinct subsequences"**, **"wildcard"**.'],
        frames: [{ say: 0, note: `Only (m+1)(n+1) = ${(LM + 1) * (LN + 1)} prefix pairs here: O(m·n) instead of exponential.`, panels: [vars({ 'prefix pairs': (LM + 1) * (LN + 1), time: 'O(m·n)' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the last cell',
        lines: [`Cell (${LM}, ${LN}): a[${LM - 1}] = ${A[LM - 1]}, b[${LN - 1}] = ${B[LN - 1]}. They match.`, `Diagonal ${L[LM - 1][LN - 1]}, up ${L[LM - 1][LN]}, left ${L[LM][LN - 1]}.`],
        panels: [table(LROWS, LCOLS, upTo(L, LM, LN - 1, lBase), sm(LM + 1, LN + 1, { [`${LM - 1},${LN - 1}`]: 'visited', [`${LM - 1},${LN}`]: 'visited', [`${LM},${LN - 1}`]: 'visited', [`${LM},${LN}`]: 'active' }), 'dp')],
        task: {
          type: 'choose',
          question: `What is dp[${LM}][${LN}]?`,
          options: [
            { text: `diagonal + 1 = ${L[LM - 1][LN - 1]} + 1 = ${L[LM][LN]}` },
            { text: `max(up, left) + 1 = ${Math.max(L[LM - 1][LN], L[LM][LN - 1]) + 1}`, why: `Left already matched a's "${A[LM - 1]}" to the earlier "${B[1]}" in b; +1 would use that "${A[LM - 1]}" twice.` },
            { text: `1: the match starts a new run`, why: 'Restarting is longest common substring. A subsequence allows gaps, so the diagonal LCS carries over.' },
          ],
          answer: 0,
        },
        solved: `A match pairs the two last characters, so both prefixes shrink: **diagonal + 1**. LCS("${A}", "${B}") = ${L[LM][LN]}.`,
      },
    ],
  },

  {
    id: 'dp-2d-knapsack-01',
    title: 'Each item once: skip, take, loop backwards',
    steps: [
      {
        kind: 'watch',
        title: 'Every subset',
        lines: ['Items with a weight and a value, capacity C, **each item at most once**. Maximise the value.', 'Trying every subset is 2^n.'],
        frames: [
          { say: 0, note: `e.g. items (w, v) = (2, 4), (1, 2), (3, 5) and capacity ${KC}.`, panels: [table(KW.map((_, k) => `item ${k + 1}`), ['w', 'v'], KW.map((w, k) => [w, KV[k]]))] },
          {
            say: 1,
            note: `All ${SUBSETS.length} subsets. Over capacity are out; the best that fits is worth ${K_BRUTE}.`,
            panels: [
              table(
                SUBSETS.map(subsetLabel),
                ['weight', 'value'],
                SUBSETS.map((s) => [s.w, s.v]),
                SUBSETS.map((s) => [0, 1].map(() => (s.w > KC ? 'bad' : s.v === K_BRUTE ? 'active' : ''))),
              ),
            ],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Row by row: skip or take',
        lines: [
          '`dp[i][c]` = best value with the first i items and capacity c. Only the capacity left matters, not which items.',
          '`dp[i][c] = max(dp[i−1][c], dp[i−1][c − w] + v)`: skip, or take once. Both read the row **above**.',
        ],
        frames: [
          { say: 1, note: `Item (2, 4), c = 4: max(skip ${K2[0][4]}, take ${K2[0][2]} + 4) = ${K2[1][4]}.`, panels: [kRow(1, 4)] },
          { say: 1, note: `Item (1, 2), c = 4: max(skip ${K2[1][4]}, take ${K2[1][3]} + 2) = ${K2[2][4]}.`, panels: [kRow(2, 4)] },
          { say: 1, note: `Item (3, 5), c = 4: max(skip ${K2[2][4]}, take ${K2[2][1]} + 5) = ${K2[3][4]}. Same as the best subset.`, panels: [kRow(3, 4)] },
        ],
      },
      {
        kind: 'watch',
        title: 'One array: why backwards',
        lines: [
          'Row i reads only row i − 1, at c and c − w (to the **left**). Squeeze it into one array `dp`.',
          'Forwards: slot c − w already holds the **new** value, which may include this item. Taken twice.',
          'Backwards: slot c − w is still the **old** value. Each item at most once.',
        ],
        frames: [
          passFrame(K_FWD, 0, 'item (2, 4), forwards', `Forwards, c = 2: dp[2] = dp[0] + 4 = ${K_FWD.recs[0].dp[2]}.`, true),
          passFrame(K_FWD, 2, 'item (2, 4), forwards', `c = 4 reads dp[2] = ${K_FWD.recs[2].read}, written a moment ago: dp[4] = ${K_FWD.dp[4]}. The item is taken twice.`, true),
          passFrame(K_BWD, 0, 'item (2, 4), backwards', `Backwards, c = 4 first: dp[2] is still ${K_BWD.recs[0].read}, so dp[4] = ${K_BWD.dp[4]}.`, false),
          passFrame(K_BWD, 2, 'item (2, 4), backwards', `c = 2 last: dp = [${K_BWD.dp.join(', ')}]. Matches row 1 of the table.`, false),
          { say: 0, note: 'Clues: "each item at most once", "subset whose sum is", "partition into two subsets", "assign + or −".', panels: [vars({ 'outer loop': 'items', 'inner loop': 'c from C down to w' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: item (1, 2), backwards',
        lines: [`After item (2, 4): dp = [${K_BWD.dp.join(', ')}].`, 'Next item (1, 2), backwards: c = 4 is the first slot written.'],
        panels: [arr(K_BWD.dp, { label: 'dp before item (1, 2)', pointers: [ptr(4, 'c')], highlights: { 4: 'active', 3: 'visited' } })],
        task: {
          type: 'choose',
          question: 'dp[4] = max(dp[4], dp[3] + 2). What does it become?',
          options: [
            { text: `${K_T_BWD.dp[4]}: dp[3] is still the old ${K_T_BWD.recs[0].read}` },
            { text: `${K_T_FWD.dp[4]}: dp[3] is already ${K_T_FWD.recs[2].dp[3]}`, why: 'That is the forward order: dp[3] would already include item (1, 2), so it is taken twice.' },
            { text: `${K_BWD.dp[4]}: keep it, the item does not fit`, why: 'Weight 1 fits in capacity 4; taking it with item (2, 4) is better.' },
            { text: `${K_BWD.dp[4] + K_T_BWD.recs[0].read + KV[1]}: dp[4] + dp[3] + 2`, why: 'max picks skip or take; it never adds them. Skip keeps dp[4], take is dp[3] + 2.' },
          ],
          answer: 0,
        },
        solved: `**Backwards** keeps c − w on the previous item's row, so each item counts once. After all items dp[4] = ${K_1D[KC]}.`,
      },
    ],
  },

  {
    id: 'dp-2d-knapsack-unbounded',
    title: 'Reusable coins: loop forwards, coins outer',
    steps: [
      {
        kind: 'watch',
        title: 'The backwards loop forbids reuse',
        lines: ['Coins can be used **any number of times**. Count the combinations that make the amount.', 'The 0/1 backwards loop lets each coin in at most once.'],
        frames: [
          { say: 0, note: `e.g. coins [2, 3], amount ${AMT}. dp[0] = 1: one way to make 0, choose nothing.`, panels: [arr([1, 0, 0, 0, 0, 0], { label: 'dp[a] = ways', highlights: { 0: 'active' } })] },
          { say: 1, note: `Coin 2 backwards: dp[4] reads dp[2] before it is set, so 2 + 2 never forms. dp[4] = ${U_BACK[4]}.`, panels: [arr(U_BACK, { label: 'coin 2, backwards', highlights: { 4: 'bad', 2: 'visited' } })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Take keeps you on the same row',
        lines: ['`dp[i][a] = dp[i−1][a]` (skip the coin) `+ dp[i][a − coin]` (take it, **same row** i, not i − 1).'],
        frames: [
          { say: 0, note: `Coin 2, a = 4: ${U2[0][4]} above + ${U2[1][2]} in the same row (a = 2, already uses a 2) = ${U2[1][4]}.`, panels: [uTable(1, 4)] },
          { say: 0, note: `Coin 3, a = 5: ${U2[1][5]} above + ${U2[2][2]} at a = 2 = ${U2[2][5]}: the way 2 + 3.`, panels: [uTable(2, 5)] },
        ],
      },
      {
        kind: 'watch',
        title: 'In one array: forwards',
        lines: ['`for (let a = coin; a <= amount; a++) dp[a] += dp[a − coin]`: slot a − coin already includes this coin.'],
        frames: [
          uFrame(2, 2, `Coin 2, a = 2: dp[2] += dp[0] → ${uRec(2, 2).dp[2]}.`),
          uFrame(2, 4, `a = 4 reads the new dp[2] = ${uRec(2, 4).read}: 2 + 2 forms. dp[4] = ${uRec(2, 4).dp[4]}.`),
          uFrame(3, 3, `Coin 3, a = 3: dp[3] += dp[0] → ${uRec(3, 3).dp[3]}.`),
          uFrame(3, 5, `a = 5: dp[5] += dp[2] (${uRec(3, 5).read}) → ${U[AMT]}. Same as the last table row.`),
          { say: 0, note: 'Clues: "infinite number of each coin", "number of combinations that make up", "cut the rod into pieces".', panels: [vars({ '0/1': 'capacity backwards', unbounded: 'capacity forwards' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: swap the loops',
        lines: [`Coins outer gave dp[${AMT}] = ${U[AMT]}: the multiset {2, 3}.`, 'Now amount outer, coins inner: each dp[a] asks "which coin is last?".'],
        panels: [arr(U, { label: 'coins outer (combinations)', highlights: { [AMT]: 'done' } }), arr(UP.map((v, a) => (a < AMT ? v : '?')), { label: 'amount outer', highlights: { [AMT]: 'active' } })],
        task: {
          type: 'choose',
          question: `What does the amount-outer loop give for dp[${AMT}]?`,
          options: [
            { text: `${UP[AMT]}: 2 + 3 and 3 + 2 are counted separately` },
            { text: `${U[AMT]}: the loops only change the order of work`, why: 'For counting, loop order changes what is counted. Amount outer counts ordered sequences: permutations.' },
            { text: '0: 5 is odd, so 2s cannot make it', why: 'The 3 makes it reachable: 5 = 2 + 3.' },
            { text: '3: every coin at every amount', why: `Only two ordered sequences of 2s and 3s sum to ${AMT}: 2 + 3 and 3 + 2.` },
          ],
          answer: 0,
        },
        solved: '**Coins outer** builds each multiset once (combinations); **amount outer** counts every order (permutations). Forwards allows reuse.',
      },
    ],
  },
];
