// Step lessons for DP 2D, part 1 (grid DP + two sequences). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every dp cell, rolling row, memo entry and answer below comes from running the lesson's own code (paths recursion,
// best() memo, gridMinCost, backward(), uniquePathsWithObstacles, minDistance, longestCommonSubsequence) or its stated
// recurrences on the example inputs. check() throws if a run drifts from the lesson's numbers.
// Part 2 (0/1 and unbounded knapsack, mistakes, tips) lives in steps-2.js.
import secondPart from './steps-2.js';
const fv = (v) => (v === Infinity ? '∞' : v === true ? 'T' : v === false ? 'F' : String(v));
const arr = (values, opts = {}) => ({ kind: 'array', values: values.map(fv), ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells: cells.map((r) => r.map(fv)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((r) => r.map(fv)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const mk = (cells, s) => Object.fromEntries(cells.map(([r, c]) => [`${r},${c}`, s]));
const sm = (m, n, marks = {}) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => marks[`${r},${c}`] || ''));
const mat = (m, n, v) => Array.from({ length: m }, () => new Array(n).fill(v));
const copy = (t) => t.map((r) => r.slice());
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-2d/steps.js: ${msg}`);
};
const lbl = (s) => ['""', ...s.split('')];

// Table frames from fill events {r, c, v, reads, note}: the cell is written, shown active, its reads visited.
function fillFrames(rl, cl, start, events, o = {}) {
  const cur = copy(start);
  return events.map((e) => {
    cur[e.r][e.c] = e.v;
    const st = sm(rl.length, cl.length, { ...mk(e.reads || [], 'visited'), [`${e.r},${e.c}`]: 'active' });
    return { say: typeof o.say === 'function' ? o.say(e) : o.say ?? 0, note: e.note, panels: [...(o.pre ? o.pre(e) : []), table(rl, cl, copy(cur), st, o.label)] };
  });
}
const after = (start, events) => {
  const cur = copy(start);
  for (const e of events) cur[e.r][e.c] = e.v;
  return cur;
};

// ---------- unique paths (2D): edges 1, cell = above + left; blocked cells 0 ----------
function pathsRun(m, n, blocked = []) {
  const isB = (r, c) => blocked.some(([a, b]) => a === r && b === c);
  const dp = mat(m, n, 0);
  const ev = [];
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      if (isB(r, c)) dp[r][c] = 0;
      else if (r === 0 && c === 0) dp[r][c] = 1;
      else dp[r][c] = (r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0);
      const reads = [r > 0 && [r - 1, c], c > 0 && [r, c - 1]].filter(Boolean);
      ev.push({ r, c, v: dp[r][c], reads: isB(r, c) ? [] : reads, note: isB(r, c) ? `(${r},${c}) is blocked → 0 ways.` : r === 0 && c === 0 ? 'Start: 1 way.' : `(${r},${c}) = ${r > 0 ? dp[r - 1][c] : 0} above + ${c > 0 ? dp[r][c - 1] : 0} left = ${dp[r][c]}.` });
    }
  return { dp, ev };
}

// ---------- what ----------
const SHEET = pathsRun(3, 3);
check(SHEET.dp[2][2] === 6, 'sheet 3x3');
const sheetStart = SHEET.dp.map((row, r) => row.map((v, c) => (r === 0 || c === 0 ? v : '·')));
const RC = ['0', '1', '2'];
const FAM = { rl: ['grid paths', 'two strings', 'knapsack'], cl: ['1st', '2nd'], cells: [['r', 'c'], ['i', 'j'], ['i', 'cap']] };

// ---------- why: the lesson's recursion paths(r, c, m, n) vs its fill(1) table ----------
function callCounts(m, n) {
  const cnt = mat(m, n, 0);
  let total = 0;
  function paths(r, c) {
    total++;
    cnt[r][c]++;
    if (r === m - 1 || c === n - 1) return 1;
    return paths(r + 1, c) + paths(r, c + 1);
  }
  return { ans: paths(0, 0), cnt, total };
}
function tableFill1(m, n) {
  const dp = Array.from({ length: m }, () => new Array(n).fill(1));
  const rows = [copy(dp)];
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    rows.push(copy(dp));
  }
  return { ans: dp[m - 1][n - 1], rows };
}
const REC = callCounts(4, 4);
const TAB4 = tableFill1(4, 4);
check(REC.ans === 20 && TAB4.ans === 20, 'why 4x4');
const TAB3 = tableFill1(3, 3);
check(TAB3.ans === 6, 'why 3x3');
const R4 = ['0', '1', '2', '3'];
const blankInterior = (m, n) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => (r === 0 || c === 0 ? 1 : '?')));

// ---------- recognize: LCS("ab", "b") ----------
function lcsRun(a, b) {
  const m = a.length, n = b.length;
  const dp = mat(m + 1, n + 1, 0);
  const ev = [];
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const match = a[i - 1] === b[j - 1];
      dp[i][j] = match ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      ev.push({
        r: i, c: j, v: dp[i][j], match,
        reads: match ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]],
        note: match ? `${a[i - 1]} == ${b[j - 1]} → diagonal ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.` : `${a[i - 1]} ≠ ${b[j - 1]} → max(up ${dp[i - 1][j]}, left ${dp[i][j - 1]}) = ${dp[i][j]}.`,
      });
    }
  return { dp, ev };
}
const RECO = lcsRun('ab', 'b');
check(RECO.dp[2][1] === 1, 'recognize lcs');
const emptyT = (m, n) => mat(m, n, '·');
const baseZero = (m, n) => Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 || j === 0 ? 0 : '·')));

// ---------- intuition: fill-order numbers ----------
function orderEvents(m, n, backward) {
  const ev = [];
  let k = 0;
  const rs = [...Array(m).keys()], cs = [...Array(n).keys()];
  if (backward) rs.reverse(), cs.reverse();
  for (const r of rs)
    for (const c of cs) {
      k++;
      const reads = backward ? [r + 1 < m && [r + 1, c], c + 1 < n && [r, c + 1]] : [r > 0 && [r - 1, c], c > 0 && [r, c - 1]];
      const rd = reads.filter(Boolean);
      ev.push({ r, c, v: k, reads: rd, note: rd.length ? `Cell #${k} (${r},${c}) reads ${rd.map(([a, b]) => `(${a},${b})`).join(' and ')}: both already filled.` : `Cell #${k} (${r},${c}) reads nothing: a base cell.` });
    }
  return ev;
}

// ---------- brute-force: the lesson's best(r, c) ----------
const MPS = [[1, 3, 1], [1, 5, 1], [4, 2, 1]];
function bestRun(g, useMemo) {
  const m = g.length, n = g[0].length;
  const memo = mat(m, n, -1);
  const calls = mat(m, n, 0);
  const sets = [];
  let total = 0;
  function best(r, c) {
    total++;
    if (r >= m || c >= n) return Infinity;
    calls[r][c]++;
    if (r === m - 1 && c === n - 1) return g[r][c];
    if (useMemo && memo[r][c] !== -1) return memo[r][c];
    const d = best(r + 1, c), ri = best(r, c + 1);
    memo[r][c] = g[r][c] + Math.min(d, ri);
    sets.push({ r, c, v: memo[r][c], d, ri });
    return memo[r][c];
  }
  return { ans: best(0, 0), sets, calls, total };
}
const BM = bestRun(MPS, true);
const BN = bestRun(MPS, false);
check(BM.ans === 7 && BN.ans === 7, 'min path sum 7');
check(same(BM.sets.slice(0, 4).map((s) => [s.r, s.c, s.v]), [[2, 1, 3], [2, 0, 7], [1, 2, 2], [1, 1, 7]]), 'memo order');
const bestEv = BM.sets.map((s) => ({
  r: s.r, c: s.c, v: s.v,
  reads: [s.r + 1 < 3 && [s.r + 1, s.c], s.c + 1 < 3 && [s.r, s.c + 1]].filter(Boolean),
  note: `best(${s.r},${s.c}) = ${MPS[s.r][s.c]} + min(down ${fv(s.d)}, right ${fv(s.ri)}) = ${s.v}.`,
}));
const memoStart = mat(3, 3, '·');
const bestPre = (e) => [grid(MPS, sm(3, 3, { ...mk(e.reads, 'visited'), [`${e.r},${e.c}`]: 'active' }), 'grid')];

// ---------- intuition-grid ----------
const P3 = [1, 3, 3, 1];
const P4 = [1];
for (let j = 1; j < 4; j++) P4.push(P3[j - 1] + P3[j]);
P4.push(1);
check(same(P4, [1, 4, 6, 4, 1]), 'pascal row 4');
const UP = pathsRun(3, 4);
check(same(UP.dp, [[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, 10]]), 'unique paths 3x4');
const R3 = ['0', '1', '2'];
const C4 = ['0', '1', '2', '3'];
const upEdges = UP.dp.map((row, r) => row.map((v, c) => (r === 0 || c === 0 ? v : '·')));
const OBS = [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]];
const OB = pathsRun(3, 4, [[1, 1]]);
check(OB.dp[2][3] === 4 && OB.dp[1][1] === 0, 'obstacle paths');
const obsGrid = (st) => grid(OBS.map((row) => row.map((x) => (x ? '#' : '.'))), st, 'grid (# blocked)');
// triangle bottom-up (made-up triangle)
const TRI = [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]];
function triRun(t) {
  const dp = t.map((row) => row.map(() => '·'));
  t.at(-1).forEach((v, c) => (dp[t.length - 1][c] = v));
  const start = copy(dp);
  const ev = [];
  for (let r = t.length - 2; r >= 0; r--)
    for (let c = 0; c <= r; c++) {
      const a = dp[r + 1][c], b = dp[r + 1][c + 1];
      dp[r][c] = t[r][c] + Math.min(a, b);
      ev.push({ r, c, v: dp[r][c], reads: [[r + 1, c], [r + 1, c + 1]], note: `${t[r][c]} + min(${a}, ${b}) = ${dp[r][c]}.` });
    }
  return { ans: dp[0][0], start, ev };
}
const TR = triRun(TRI);
check(TR.ans === 11, 'triangle 11');
const pad = (rows) => rows.map((row) => [...row, ...new Array(4 - row.length).fill('')]);
// maximal square
const SQ = [[1, 1, 0], [1, 1, 1], [1, 1, 1]];
function squareRun(g) {
  const m = g.length, n = g[0].length;
  const dp = mat(m, n, 0);
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      const at = (a, b) => (a >= 0 && b >= 0 ? dp[a][b] : 0);
      dp[r][c] = g[r][c] === 1 ? 1 + Math.min(at(r - 1, c), at(r, c - 1), at(r - 1, c - 1)) : 0;
    }
  return dp;
}
const SQD = squareRun(SQ);
check(same(SQD, [[1, 1, 0], [1, 2, 1], [1, 2, 2]]), 'max square');

// ---------- optimized-grid: one rolling row for unique paths; dungeon need[] ----------
function rollPaths(m, n) {
  const dp = new Array(n).fill(1);
  const fr = [];
  for (let r = 1; r < m; r++)
    for (let c = 1; c < n; c++) {
      const above = dp[c], left = dp[c - 1];
      dp[c] += dp[c - 1];
      fr.push({ r, c, above, left, dp: dp.slice() });
    }
  return { ans: dp[n - 1], fr };
}
const RP = rollPaths(3, 4);
check(RP.ans === 10, 'rolling unique paths');
// the lesson's backward() (sentinels), reused for both dungeon examples
function backwardRun(g) {
  const m = g.length, n = g[0].length;
  const need = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(Infinity));
  need[m][n - 1] = need[m - 1][n] = 1;
  const start = copy(need);
  const ev = [];
  for (let r = m - 1; r >= 0; r--)
    for (let c = n - 1; c >= 0; c--) {
      const lo = Math.min(need[r + 1][c], need[r][c + 1]);
      need[r][c] = Math.max(1, lo - g[r][c]);
      ev.push({ r, c, v: need[r][c], lo, reads: [[r + 1, c], [r, c + 1]], note: `max(1, min(${fv(need[r + 1][c])}, ${fv(need[r][c + 1])}) − (${g[r][c]})) = max(1, ${lo - g[r][c]}) = ${need[r][c]}.` });
    }
  return { ans: need[0][0], start, ev, need };
}
const DG = [[-3, 5], [-10, -4]];
const DR = backwardRun(DG);
check(same(DR.ev.map((e) => e.v), [5, 15, 1, 4]) && DR.ans === 4, 'dungeon 2x2');
check(DR.ev[2].lo - DG[0][1] === 0, 'clamp case');
const dgGrid = (e) => [grid(DG, sm(2, 2, e ? { ...mk(e.reads.filter(([a, b]) => a < 2 && b < 2), 'visited'), [`${e.r},${e.c}`]: 'active' } : {}), 'dungeon')];
const dNeed = (upto) => {
  const t = mat(2, 2, '·');
  DR.ev.slice(0, upto).forEach((e) => (t[e.r][e.c] = e.v));
  return t;
};

// ---------- template-grid: gridMinCost (rolled) and backward() with sentinels ----------
const TG = [[1, 2, 3], [4, 5, 6]];
function gridMinCostRun(g) {
  const m = g.length, n = g[0].length;
  const dp = new Array(n).fill(Infinity);
  dp[0] = 0;
  const fr = [{ dp: dp.slice(), note: 'dp = [0, ∞, ∞]: nothing reached yet except the slot before (0,0).', r: -1, c: 0 }];
  for (let r = 0; r < m; r++) {
    const old0 = dp[0];
    dp[0] += g[r][0];
    fr.push({ dp: dp.slice(), r, c: 0, note: `Row ${r}, first column: dp[0] = ${old0} + ${g[r][0]} = ${dp[0]}.` });
    for (let c = 1; c < n; c++) {
      const above = dp[c], left = dp[c - 1];
      dp[c] = g[r][c] + Math.min(dp[c], dp[c - 1]);
      fr.push({ dp: dp.slice(), r, c, note: `dp[${c}] = ${g[r][c]} + min(above ${fv(above)}, left ${left}) = ${dp[c]}.` });
    }
  }
  return { ans: dp[n - 1], fr };
}
const GM = gridMinCostRun(TG);
check(GM.ans === 12 && same(GM.fr[3].dp, [1, 3, 6]), 'gridMinCost');
const gmPanels = (s) => [grid(TG, sm(2, 3, s.r >= 0 ? { [`${s.r},${s.c}`]: 'active' } : {}), 'grid'), arr(s.dp, { label: 'dp', highlights: s.r >= 0 ? { [s.c]: 'active' } : {} })];
const BG = [[0, -2], [-3, 1]];
const BW = backwardRun(BG);
check(same(BW.ev.map((e) => e.v), [1, 4, 3, 3]), 'backward sentinels');
const R3s = ['0', '1', '2'];

// ---------- implementation-grid: the lesson's uniquePathsWithObstacles ----------
const IG = [[0, 0, 0], [1, 0, 0], [0, 0, 0]];
function obstaclesRun(g) {
  const n = g[0].length;
  const dp = new Array(n).fill(0);
  dp[0] = 1;
  const fr = [];
  g.forEach((row, r) => {
    for (let c = 0; c < n; c++) {
      let note;
      if (row[c] === 1) {
        dp[c] = 0;
        note = `(${r},${c}) blocked → dp[${c}] = 0.`;
      } else if (c > 0) {
        const a = dp[c];
        dp[c] += dp[c - 1];
        note = `dp[${c}] = ${a} above + ${dp[c - 1]} left = ${dp[c]}.`;
      } else note = r === 0 ? 'Start (0,0): dp[0] = 1.' : `(${r},0): no left, dp[0] keeps ${dp[0]} from above.`;
      fr.push({ r, c, dp: dp.slice(), note, say: row[c] === 1 ? 1 : r === 0 && c === 0 ? 0 : 2 });
    }
  });
  return { ans: dp[n - 1], fr };
}
const OR = obstaclesRun(IG);
check(OR.ans === 3 && OR.fr[6].dp[0] === 0, 'obstacles rolling');
const igPanels = (s) => [grid(IG.map((row) => row.map((x) => (x ? '#' : '.'))), sm(3, 3, { [`${s.r},${s.c}`]: IG[s.r][s.c] ? 'bad' : 'active' }), 'grid (# blocked)'), arr(s.dp, { label: 'dp', highlights: { [s.c]: IG[s.r][s.c] ? 'bad' : 'active' } })];

// ---------- dry-run-grid: rolling row on the lesson's grid ----------
function dryGrid(g) {
  const n = g[0].length;
  const dp = [];
  const fr = [];
  g.forEach((row, r) => {
    for (let c = 0; c < n; c++) {
      const above = r > 0 ? dp[c] : Infinity, left = c > 0 ? dp[c - 1] : Infinity;
      const v = r === 0 && c === 0 ? row[0] : row[c] + Math.min(above, left);
      dp[c] = v;
      const note = r === 0 && c === 0 ? `dp[0] = ${v}: the start.` : r === 0 ? `dp[${c}] = ${left} + ${row[c]} = ${v} (running sum).` : c === 0 ? `dp[0] = ${above} + ${row[0]} = ${v} (only from above).` : `dp[${c}] = ${row[c]} + min(${above}, ${left}) = ${v}.`;
      fr.push({ r, c, v, above, left, dp: dp.slice(), note });
    }
  });
  return fr;
}
const DRG = dryGrid(MPS);
check(same(DRG[2].dp, [1, 4, 5]) && same(DRG[5].dp, [2, 7, 6]) && same(DRG[8].dp, [6, 8, 7]), 'dry-run grid rows');
const drgPanels = (s) => [
  grid(MPS, sm(3, 3, { [`${s.r},${s.c}`]: 'active', ...(s.r > 0 ? { [`${s.r - 1},${s.c}`]: 'visited' } : {}), ...(s.c > 0 ? { [`${s.r},${s.c - 1}`]: 'visited' } : {}) }), 'grid'),
  arr([...s.dp, ...new Array(3 - s.dp.length).fill('·')], { label: `dp after (${s.r},${s.c})`, highlights: { [s.c]: 'active' }, pointers: s.r > 0 ? [ptr(s.c, 'above'), ...(s.c > 0 ? [ptr(s.c - 1, 'left', 'b')] : [])] : [] }),
];
const PATH = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]];
check(PATH.reduce((s, [r, c]) => s + MPS[r][c], 0) === 7, 'path 1-3-1-1-1');

// ---------- intuition-two-sequences ----------
const IL = lcsRun('abc', 'ac');
check(IL.dp[3][2] === 2 && IL.ev[5].match && IL.ev[5].r === 3 && IL.ev[5].c === 2, 'lcs abc/ac');
function editRun(a, b) {
  const m = a.length, n = b.length;
  const dp = mat(m + 1, n + 1, 0);
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  const start = copy(dp).map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? v : '·')));
  const ev = [];
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const match = a[i - 1] === b[j - 1];
      if (match) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      ev.push({
        r: i, c: j, v: dp[i][j],
        reads: match ? [[i - 1, j - 1]] : [[i - 1, j - 1], [i - 1, j], [i, j - 1]],
        note: match ? `${a[i - 1]} == ${b[j - 1]}: copy the diagonal, ${dp[i][j]}.` : `${a[i - 1]} ≠ ${b[j - 1]}: 1 + min(replace ${dp[i - 1][j - 1]}, delete ${dp[i - 1][j]}, insert ${dp[i][j - 1]}) = ${dp[i][j]}.`,
      });
    }
  return { dp, start, ev };
}
const HR = editRun('horse', 'ros');
check(HR.dp[4][2] === 3 && HR.dp[4][3] === 2 && HR.dp[5][2] === 4 && HR.dp[5][3] === 3, 'horse/ros window');
const hrWin = (st, last = '?') => table(['hors', 'horse'], ['ro', 'ros'], [[HR.dp[4][2], HR.dp[4][3]], [HR.dp[5][2], last]], st, 'edit distance, i = 4..5, j = 2..3');

// ---------- optimized-two-sequences ----------
function isSubRun(s, t) {
  let i = 0;
  const fr = [];
  for (let j = 0; j < t.length; j++) {
    const hit = i < s.length && s[i] === t[j];
    fr.push({ i, j, hit });
    if (hit) i++;
  }
  return { ok: i === s.length, fr, i };
}
const IS = isSubRun('ace', 'abcde');
check(IS.ok, 'is subsequence');
function distinctRun(s, t) {
  const m = s.length, n = t.length;
  const dp = mat(m + 1, n + 1, 0);
  for (let i = 0; i <= m; i++) dp[i][0] = 1;
  const start = copy(dp);
  const ev = [];
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const match = s[i - 1] === t[j - 1];
      dp[i][j] = dp[i - 1][j] + (match ? dp[i - 1][j - 1] : 0);
      ev.push({ r: i, c: j, v: dp[i][j], reads: match ? [[i - 1, j], [i - 1, j - 1]] : [[i - 1, j]], note: match ? `${s[i - 1]} == ${t[j - 1]}: skip ${dp[i - 1][j]} + use ${dp[i - 1][j - 1]} = ${dp[i][j]}.` : `${s[i - 1]} ≠ ${t[j - 1]}: only skip → ${dp[i][j]}.` });
    }
  return { dp, start, ev };
}
const DS = distinctRun('aab', 'ab');
check(DS.dp[3][2] === 2 && DS.ev[5].r === 3 && DS.ev[5].c === 2, 'distinct subsequences');
function regexRun(s, p) {
  const m = s.length, n = p.length;
  const dp = mat(m + 1, n + 1, false);
  dp[0][0] = true;
  const ev = [];
  const eq = (x, y) => y === '.' || x === y;
  for (let i = 0; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      let reads, note;
      if (p[j - 1] === '*') {
        const zero = dp[i][j - 2];
        const more = i > 0 && eq(s[i - 1], p[j - 2]) && dp[i - 1][j];
        dp[i][j] = zero || more;
        reads = [[i, j - 2], ...(i > 0 && eq(s[i - 1], p[j - 2]) ? [[i - 1, j]] : [])];
        note = `"${p[j - 2]}*": zero copies ${fv(zero)}` + (i > 0 ? (eq(s[i - 1], p[j - 2]) ? `, one more copy ${fv(dp[i - 1][j])}` : `; ${s[i - 1]} ≠ ${p[j - 2]}, no more copies`) : '') + ` → ${fv(dp[i][j])}.`;
      } else {
        const ok = i > 0 && eq(s[i - 1], p[j - 1]);
        dp[i][j] = ok && dp[i - 1][j - 1];
        reads = ok ? [[i - 1, j - 1]] : [];
        note = i === 0 ? `Empty s vs "${p[j - 1]}": a normal char needs a character → F.` : ok ? `${s[i - 1]} matches ${p[j - 1]}: take dp[${i - 1}][${j - 1}] = ${fv(dp[i - 1][j - 1])}.` : `${s[i - 1]} ≠ ${p[j - 1]} → F.`;
      }
      ev.push({ r: i, c: j, v: dp[i][j], reads, note });
    }
  return { dp, ev };
}
const RX = regexRun('aab', 'a*b');
check(RX.dp[3][3] === true && RX.dp[0][2] === true && RX.dp[0][1] === false, 'regex aab/a*b');
const rxStart = mat(4, 4, '·');
rxStart[0][0] = true;

// ---------- template-two-sequences: minDistance("abc", "yab") ----------
const ED = editRun('abc', 'yab');
check(ED.dp[3][3] === 2 && same(ED.dp[2], [2, 2, 2, 1]) && same(ED.dp[3], [3, 3, 3, 2]), 'minDistance abc/yab');
const edRows = lbl('abc');
const edCols = lbl('yab');
const edLast = ED.ev.at(-1);
// prev/cur for row 3
const rowFrames = [1, 2, 3].map((j) => {
  const cur = [3, ...ED.dp[3].slice(1, j + 1), ...new Array(3 - j).fill('·')];
  const e = ED.ev.find((x) => x.r === 3 && x.c === j);
  return {
    say: 1,
    note: `j = ${j}: ${e.note}`,
    panels: [arr(ED.dp[2], { label: 'prev (row 2: "ab")', highlights: { [j - 1]: 'visited', [j]: 'visited' } }), arr(cur, { label: 'cur (row 3: "abc")', highlights: { [j]: 'active', [j - 1]: 'visited' } })],
  };
});

// ---------- implementation-two-sequences: the lesson's longestCommonSubsequence (two rolling rows) ----------
function lcsRoll(a, b) {
  let prev = new Array(b.length + 1).fill(0);
  const fr = [];
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      const match = a[i - 1] === b[j - 1];
      cur[j] = match ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      fr.push({ i, j, match, prev: prev.slice(), cur: cur.map((v, k) => (k <= j ? v : '·')), note: match ? `${a[i - 1]} == ${b[j - 1]}: prev[${j - 1}] + 1 = ${cur[j]}.` : `${a[i - 1]} ≠ ${b[j - 1]}: max(prev[${j}] ${prev[j]}, cur[${j - 1}] ${cur[j - 1]}) = ${cur[j]}.` });
    }
    prev = cur;
  }
  return { ans: prev[b.length], fr };
}
const LR = lcsRoll('cab', 'abc');
check(LR.ans === 2 && LR.fr.length === 9, 'lcs rolling cab/abc');
const lrPanels = (s) => [
  arr(s.prev, { label: 'prev', highlights: s.match ? { [s.j - 1]: 'visited' } : { [s.j]: 'visited' } }),
  arr(s.cur, { label: 'cur', highlights: { [s.j]: 'active', ...(!s.match ? { [s.j - 1]: 'visited' } : {}) } }),
  vars({ i: s.i, 'a[i−1]': 'cab'[s.i - 1], 'b[j−1]': 'abc'[s.j - 1] }),
];

// ---------- dry-run-two-sequences: LCS("abcde", "ace") ----------
const DL = lcsRun('abcde', 'ace');
check(same(DL.dp, [[0, 0, 0, 0], [0, 1, 1, 1], [0, 1, 1, 1], [0, 1, 2, 2], [0, 1, 2, 2], [0, 1, 2, 3]]), 'lesson LCS table');
// rows 1..5 in the table (fits a phone); row 0 (all zeros) as an array
const DLR = ['1 a', '2 b', '3 c', '4 d', '5 e'];
const DLC = lbl('ace');
const dlTable = (upto, marks, label) => table(DLR, DLC, DL.dp.slice(1).map((row, k) => (k + 1 <= upto ? row : row.map(() => '·'))), sm(5, 4, marks), label);
const shift = (cells) => cells.filter(([i]) => i > 0).map(([i, j]) => [i - 1, j]);
const DROWS = [
  { note: 'Row 0: the empty prefix, base row [0, 0, 0, 0].', marks: {}, base: { 0: 'active', 1: 'active', 2: 'active', 3: 'active' } },
  { note: 'Row 1 [0, 1, 1, 1]: a == a → diagonal 0 + 1.', marks: mk([[0, 1]], 'active'), base: { 0: 'visited' } },
  { note: 'Row 2 [0, 1, 1, 1]: b matches nothing → copy max(up, left).', marks: { ...mk([[1, 1], [1, 2], [1, 3]], 'active'), ...mk([[0, 1], [0, 2], [0, 3]], 'visited') } },
  { note: 'Row 3 [0, 1, 2, 2]: c == c → dp[2][1] + 1 = 2.', marks: { ...mk([[2, 2]], 'active'), ...mk(shift([[2, 1]]), 'visited') } },
  { note: 'Row 4 [0, 1, 2, 2]: no match.', marks: { ...mk([[3, 1], [3, 2], [3, 3]], 'active'), ...mk([[2, 1], [2, 2], [2, 3]], 'visited') } },
  { note: 'Row 5 [0, 1, 2, 3]: e == e → dp[4][2] + 1 = 3.', marks: { ...mk([[4, 3]], 'active'), ...mk(shift([[4, 2]]), 'visited') } },
];
const dlFrame = (k, say) => ({ say, note: DROWS[k].note, panels: [arr([0, 0, 0, 0], { label: 'row 0 (empty prefix)', highlights: DROWS[k].base || {} }), dlTable(k, DROWS[k].marks)] });
// walk back from dp[5][3]
function walkBack(a, b, dp) {
  let i = a.length, j = b.length;
  const steps = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      steps.push({ i, j, ch: a[i - 1], move: 'diag', note: `${a[i - 1]} == ${b[j - 1]}: take '${a[i - 1]}', step diagonally.` });
      i--, j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      steps.push({ i, j, move: 'up', note: `${a[i - 1]} ≠ ${b[j - 1]}: up holds ${dp[i - 1][j]} = this cell, step up.` });
      i--;
    } else {
      steps.push({ i, j, move: 'left', note: `${a[i - 1]} ≠ ${b[j - 1]}: left holds ${dp[i][j - 1]} = this cell, step left.` });
      j--;
    }
  }
  return { steps, end: [i, j] };
}
const WB = walkBack('abcde', 'ace', DL.dp);
const WCH = WB.steps.filter((s) => s.ch).map((s) => s.ch);
check(same(WCH, ['e', 'c', 'a']), 'walk back e c a');
const wbFrames = WB.steps.map((s, k) => {
  const seen = WB.steps.slice(0, k);
  const marks = { ...mk(seen.map((x) => [x.i - 1, x.j]), 'done'), [`${s.i - 1},${s.j}`]: s.ch ? 'active' : 'visited' };
  return { say: s.ch ? 1 : 2, note: s.note, panels: [dlTable(5, marks, 'walking back'), vars({ picked: WB.steps.slice(0, k + 1).filter((x) => x.ch).map((x) => x.ch).join('') || '—' })] };
});

const STEPS = {
  what: [
    {
      kind: 'watch',
      title: 'One index or two?',
      lines: ['DP 1D: **one number** describes a sub-problem.', 'Some problems need **two** numbers, so the memo becomes a **table**.'],
      frames: [
        { say: 0, note: 'DP 1D: dp[i], e.g. "the best answer for the first i houses". One index.', panels: [arr(['·', '·', '·', '·', '·'], { label: 'dp[i]' })] },
        ...FAM.rl.map((_, k) => ({
          say: 1,
          note: ['Grid paths: which row **and** which column you are on.', 'Two strings: how much of **a** and how much of **b** is left.', 'Knapsack: which item **and** how much capacity is left.'][k],
          panels: [table(FAM.rl, FAM.cl, FAM.cells.map((row, i) => (i <= k ? row : ['·', '·'])), FAM.cells.map((_, i) => (i === k ? ['active', 'active'] : ['', ''])), 'state')],
        })),
      ],
    },
    {
      kind: 'watch',
      title: 'A spreadsheet of formulas',
      lines: ['Each cell refers to the cell **above** and the cell to the **left**.', 'Fill row by row, left to right.', 'The **bottom-right** cell is the answer.'],
      frames: [
        { say: 0, note: 'Say the top row and left column hold 1. Every other cell = above + left.', panels: [table(RC, RC, sheetStart)] },
        ...fillFrames(RC, RC, sheetStart, SHEET.ev.filter((e) => e.r > 0 && e.c > 0), { say: 1 }),
        { say: 2, note: `Bottom-right = ${SHEET.dp[2][2]}: the answer.`, panels: [table(RC, RC, SHEET.dp, sm(3, 3, { '2,2': 'done' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: two strings',
      lines: ['Comparing strings **a** and **b** needs a two-index state.'],
      panels: [table(FAM.rl, FAM.cl, [['r', 'c'], ['?', '?'], ['i', 'cap']], [['', ''], ['active', 'active'], ['', '']], 'state')],
      task: {
        type: 'choose',
        question: 'For two strings, what do the two indices of `dp[i][j]` track?',
        options: [
          { text: 'How much of string a and how much of string b', why: '' },
          { text: 'A row and a column of a grid', why: 'That is grid DP. With two strings, each index measures one string.' },
          { text: 'Which item and how much capacity is left', why: 'That is knapsack.' },
          { text: 'Only the length of the longer string', why: 'One number cannot say how far you are in **both** strings.' },
        ],
        answer: 0,
      },
      solved: 'One index per string: `dp[i][j]`.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Same cells, asked again and again',
      lines: ['`paths(r, c) = paths(r+1, c) + paths(r, c+1)` branches at every call.', 'There are only `m · n` distinct `(r, c)` pairs.', 'The table computes each cell **once**.'],
      frames: [
        { say: 0, note: `The lesson's recursion on a 4 × 4 grid: ${REC.total} calls in total.`, panels: [grid(REC.cnt, REC.cnt.map((row) => row.map((v) => (v > 1 ? 'bad' : ''))), 'calls per (r, c)'), vars({ calls: REC.total })] },
        { say: 0, note: `paths(1,1) alone runs ${REC.cnt[1][1]} times, paths(2,2) ${REC.cnt[2][2]} times. Same answer each time.`, panels: [grid(REC.cnt, sm(4, 4, { '1,1': 'bad', '2,2': 'bad' }), 'calls per (r, c)')] },
        { say: 1, note: `${REC.total} calls, but only 16 distinct cells.`, panels: [vars({ calls: REC.total, cells: 16 })] },
        ...TAB4.rows.map((rows, k) => ({
          say: 2,
          note: k === 0 ? 'Table: every cell starts at 1 (the first row and column stay 1).' : `Row ${k}: each cell = above + left.`,
          panels: [table(R4, R4, rows.map((row, r) => row.map((v, c) => (r === 0 || c === 0 || r <= k ? v : '·'))), sm(4, 4, Object.fromEntries([1, 2, 3].map((c) => [`${k},${c}`, k ? 'active' : '']))))],
        })),
        { say: 2, note: `dp[3][3] = ${TAB4.ans}, same as the recursion, from 16 cells.`, panels: [table(R4, R4, TAB4.rows.at(-1), sm(4, 4, { '3,3': 'done' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a 3 × 3 table',
      lines: ['Same loop: `dp[r][c] = dp[r − 1][c] + dp[r][c − 1]`.'],
      panels: [table(RC, RC, blankInterior(3, 3))],
      task: { type: 'number', question: 'With m = n = 3, what does the table return?', options: [4, 6, 8, 9], answer: TAB3.ans, hint: 'Row 1 becomes 1, 2, 3. Then fill row 2.' },
      solved: `Row 1: 1, 2, 3. Row 2: 1, 3, ${TAB3.ans}.`,
      then: [{ say: 0, note: `dp[2][2] = 3 + 3 = ${TAB3.ans}.`, panels: [table(RC, RC, TAB3.rows.at(-1), sm(3, 3, { '2,2': 'active', '1,2': 'visited', '2,1': 'visited' }))] }],
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Three checks',
      lines: ['**Optimal substructure** and **overlapping sub-problems**, as in DP 1D.', 'A sub-problem needs **two independent quantities**.', '**No cycles**: cells can be ordered so each reads only earlier ones.'],
      frames: [
        { say: 0, note: 'Best answers built from best smaller answers, reached in many ways.', panels: [vars({ substructure: '✓', overlap: '✓' })] },
        { say: 1, note: 'Grid: row and column. Strings: a prefix of each.', panels: [table(['grid', 'strings'], ['1st', '2nd'], [['r', 'c'], ['i', 'j']])] },
        { say: 2, note: 'Right/down moves: number the cells in fill order. Each cell reads only smaller numbers.', panels: [table(['0', '1'], ['0', '1', '2'], [[1, 2, 3], [4, 5, 6]], sm(2, 3, { '1,2': 'active', '0,2': 'visited', '1,1': 'visited' }), 'fill order')] },
      ],
    },
    {
      kind: 'watch',
      title: 'Four families',
      lines: ['Grid DP: paths, path cost, largest square.', 'Two sequences: LCS, edit distance, regex.', 'Knapsack (0/1 or unbounded): subset sum, partition, coin change II.'],
      frames: [0, 1, 2, 3].map((k) => {
        const rl = ['grid', 'two seq', '0/1 knap', 'unbounded'];
        const cells = [['r', 'c'], ['i', 'j'], ['i', 'cap'], ['i', 'cap']];
        return { say: Math.min(k, 2), note: ['Grid: dp[r][c].', 'Two sequences: dp[i][j] over prefixes.', '0/1 knapsack: dp[i][cap].', 'Unbounded knapsack: dp[i][cap], reuse allowed.'][k], panels: [table(rl, ['1st', '2nd'], cells.map((row, i) => (i <= k ? row : ['·', '·'])), cells.map((_, i) => (i === k ? ['active', 'active'] : ['', ''])), 'state')] };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: name the family',
      lines: ['Coins with an **unlimited supply**; count the combinations that make an amount.'],
      panels: [vars({ coins: 'reusable', ask: 'combinations' })],
      task: {
        type: 'choose',
        question: 'Which family is this?',
        options: [
          { text: 'Unbounded knapsack', why: '' },
          { text: '0/1 knapsack', why: 'That is for items used **at most once**. These coins can be reused.' },
          { text: 'Two sequences', why: 'There is one list of coins, not two strings to compare.' },
          { text: 'Grid DP', why: 'No grid and no right/down moves here.' },
        ],
        answer: 0,
      },
      solved: 'Reuse allowed → **unbounded knapsack** (coin change II).',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'The recipe on a tiny LCS',
      lines: ['**State** in one sentence.', '**Transition**: the last decision.', '**Base cases**: the empty prefix.', '**Order**: compute what a cell reads first.', '**Answer**: often `dp[m][n]`.', '**Space**: does it read only the previous row?'],
      frames: [
        { say: 0, note: 'dp[i][j] = LCS length of the first i chars of "ab" and the first j chars of "b".', panels: [table(lbl('ab'), lbl('b'), emptyT(3, 2))] },
        { say: 1, note: 'Last decision: are the last characters matched or not?', panels: [table(lbl('ab'), lbl('b'), emptyT(3, 2), sm(3, 2, { '2,1': 'active' }))] },
        { say: 2, note: 'Empty prefix → LCS 0: row 0 and column 0.', panels: [table(lbl('ab'), lbl('b'), baseZero(3, 2), sm(3, 2, mk([[0, 0], [0, 1], [1, 0], [2, 0]], 'done')))] },
        ...fillFrames(lbl('ab'), lbl('b'), baseZero(3, 2), RECO.ev, { say: 3 }),
        { say: 4, note: `Answer dp[2][1] = ${RECO.dp[2][1]}.`, panels: [table(lbl('ab'), lbl('b'), RECO.dp, sm(3, 2, { '2,1': 'done' }))] },
        { say: 5, note: 'Each row reads only the row above and itself: space can shrink.', panels: [table(lbl('ab'), lbl('b'), RECO.dp, sm(3, 2, { '1,0': 'visited', '1,1': 'visited', '2,1': 'active' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the recipe',
      lines: ['Six steps for any DP, now with two indices.'],
      panels: [table(lbl('ab'), lbl('b'), RECO.dp)],
      task: {
        type: 'order',
        question: 'Tap the recipe steps in order.',
        items: ['Define the state', 'Transition', 'Base cases', 'Order', 'Answer', 'Optimise space'],
        hint: 'Say it in words first; squeeze memory last.',
      },
      solved: 'State → transition → base → order → answer → space.',
    },
    {
      kind: 'turn',
      title: 'Your turn: read the signature',
      lines: ['Write the recursion first; count the parameters that change.'],
      panels: [vars({ helper: 'solve(i, cap)' })],
      task: {
        type: 'choose',
        question: 'Your recursive helper is `solve(i, cap)` and both change between calls. What does that suggest?',
        options: [
          { text: 'A 2D table indexed by (i, cap)', why: '' },
          { text: 'A 1D array indexed by i', why: 'cap changes too, and two calls with the same i can have different caps.' },
          { text: 'No DP: just recurse', why: 'Plain recursion revisits the same (i, cap) pairs exponentially often.' },
        ],
        answer: 0,
      },
      solved: 'Two changing parameters → **think 2D DP**.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Reads up + left',
      lines: ['Reads **up + left** → fill r = 0..m−1, c = 0..n−1.', 'Unique paths, min path sum, LCS, edit distance.'],
      frames: [...fillFrames(['0', '1'], ['0', '1', '2'], emptyT(2, 3), orderEvents(2, 3, false), { say: 0, label: 'fill order' }), { say: 1, note: 'This is the order for unique paths, min path sum, LCS and edit distance.', panels: [table(['0', '1'], ['0', '1', '2'], [[1, 2, 3], [4, 5, 6]], undefined, 'fill order')] }],
    },
    {
      kind: 'watch',
      title: 'Reads down + right',
      lines: ['Reads **down + right** → fill r = m−1..0, c = n−1..0.', 'Triangle bottom-up, dungeon game.'],
      frames: [...fillFrames(['0', '1'], ['0', '1', '2'], emptyT(2, 3), orderEvents(2, 3, true), { say: 0, label: 'fill order' }), { say: 1, note: 'Bottom-to-top, right-to-left: triangle bottom-up and dungeon game.', panels: [table(['0', '1'], ['0', '1', '2'], [[6, 5, 4], [3, 2, 1]], undefined, 'fill order')] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: previous row only',
      lines: ['Knapsack: row `i` reads only row `i − 1`.'],
      panels: [table(['i−1', 'i'], ['0', '1', '2', '3'], [['✓', '✓', '✓', '✓'], ['·', '·', '?', '·']], [['', 'visited', 'visited', ''], ['', '', 'active', '']], 'full 2D table')],
      task: {
        type: 'choose',
        question: 'In a full 2D table, must the loop **inside** row i go left to right?',
        options: [
          { text: 'No: any direction works; it matters only once you roll it into one array', why: '' },
          { text: 'Yes, always left to right', why: 'Row i − 1 is already complete, whatever order you walk row i.' },
          { text: 'Yes, always right to left', why: 'Same reason: every cell it reads lives in the finished row above.' },
        ],
        answer: 0,
      },
      solved: 'Direction inside the row only matters when the table is **squeezed into one array**.',
    },
    {
      kind: 'turn',
      title: 'Your turn: memo or table?',
      lines: ['Memoised recursion discovers the order by itself.'],
      panels: [vars({ memo: 'order found', table: 'order chosen' })],
      task: {
        type: 'choose',
        question: 'Then why pick a table (tabulation)?',
        options: [
          { text: 'No recursion-depth limit, and it is usually faster', why: '' },
          { text: 'Memo gives wrong answers on grids', why: 'Both compute the same formula; memo is correct.' },
          { text: 'Tables need no base cases', why: 'Tables need base cases too: first row, empty prefix, capacity 0.' },
        ],
        answer: 0,
      },
      solved: 'JS engines overflow around **~10,000 frames**; a table has no recursion at all.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'best(r, c) on the 3 × 3 grid',
      lines: ['`best(r, c)` = cheapest cost from (r, c) to the end.', 'Off the grid → `Infinity`; the goal returns its own cost.', 'Each answer is stored in `memo[r][c]`.'],
      frames: [
        { say: 0, note: 'best(0,0) asks best(1,0) and best(0,1), and so on down.', panels: [grid(MPS, sm(3, 3, { '0,0': 'active' }), 'grid'), table(R3, R3, memoStart, undefined, 'memo')] },
        { say: 1, note: `best(2,2) is the goal: returns ${MPS[2][2]}. best(3, …) or best(…, 3) → Infinity.`, panels: [grid(MPS, sm(3, 3, { '2,2': 'active' }), 'grid'), table(R3, R3, memoStart, undefined, 'memo')] },
        ...fillFrames(R3, R3, memoStart, bestEv.slice(0, 3), { say: 2, pre: bestPre, label: 'memo' }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: memo[1][1]',
      lines: ['`best(1,1) = grid[1][1] + min(best(2,1), best(1,2))`.'],
      panels: [grid(MPS, sm(3, 3, { '1,1': 'active', '2,1': 'visited', '1,2': 'visited' }), 'grid'), table(R3, R3, after(memoStart, bestEv.slice(0, 3)), sm(3, 3, { '2,1': 'visited', '1,2': 'visited' }), 'memo')],
      task: { type: 'number', question: 'What is `best(1,1)`?', options: [6, 7, 8, 10], answer: bestEv[3].v, hint: 'grid[1][1] = 5; below is 3, right is 2.' },
      solved: `5 + min(3, 2) = ${bestEv[3].v}.`,
      then: fillFrames(R3, R3, after(memoStart, bestEv.slice(0, 3)), bestEv.slice(3), { say: 0, pre: bestPre, label: 'memo' }),
    },
    {
      kind: 'watch',
      title: 'Delete the memo line',
      lines: ['Without the memo line: **O(2^(m+n))**.', 'With it: **O(m·n)** time, O(m+n) recursion depth.'],
      frames: [
        { say: 0, note: `No memo: best(1,1) runs ${BN.calls[1][1]} times, best(2,2) ${BN.calls[2][2]} times. ${BN.total} calls in all.`, panels: [grid(BN.calls, BN.calls.map((row) => row.map((v) => (v > 1 ? 'bad' : ''))), 'calls per cell, no memo'), vars({ calls: BN.total })] },
        { say: 1, note: `With memo: every cell is computed once. ${BM.total} calls in all (most are memo hits or off-grid).`, panels: [grid(BM.calls, undefined, 'calls per cell, memo'), vars({ calls: BM.total })] },
      ],
    },
  ],

  'intuition-grid': [
    {
      kind: 'watch',
      title: "Warm-up: Pascal's triangle",
      lines: ['Each number = the sum of the two above it.', 'Edges are 1.'],
      frames: [
        { say: 1, note: 'Row 3 is [1, 3, 3, 1]. Row 4 starts with 1.', panels: [arr(P3, { label: 'row 3' }), arr([1, '·', '·', '·', '·'], { label: 'row 4', highlights: { 0: 'active' } })] },
        ...[1, 2, 3].map((j) => ({ say: 0, note: `${P3[j - 1]} + ${P3[j]} = ${P4[j]}.`, panels: [arr(P3, { label: 'row 3', highlights: { [j - 1]: 'visited', [j]: 'visited' } }), arr(P4.map((v, k) => (k <= j ? v : '·')), { label: 'row 4', highlights: { [j]: 'active' } })] })),
        { say: 1, note: 'Ends with 1: row 4 = [1, 4, 6, 4, 1].', panels: [arr(P3, { label: 'row 3' }), arr(P4, { label: 'row 4', highlights: { 4: 'active' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Unique paths, 3 × 4',
      lines: ['Ways to reach a cell = ways from **above** + ways from the **left**.', 'Those are the only two ways to **enter** it.'],
      frames: [
        { say: 1, note: 'First row and column: only one way in → 1.', panels: [table(R3, C4, upEdges)] },
        ...fillFrames(R3, C4, upEdges, UP.ev.filter((e) => e.r > 0 && e.c > 0), { say: 0 }),
        { say: 0, note: `Bottom-right = ${UP.dp[2][3]}: the answer.`, panels: [table(R3, C4, UP.dp, sm(3, 4, { '2,3': 'done' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one obstacle',
      lines: ['A blocked cell has **0** ways.'],
      panels: [obsGrid(sm(3, 4, { '1,1': 'bad' })), table(R3, C4, OB.dp.map((row, r) => (r < 2 ? row : row.map(() => '?'))), sm(3, 4, { '1,1': 'bad' }))],
      task: { type: 'number', question: 'Fill row 2. How many paths reach the bottom-right?', options: [3, 4, 5, 10], answer: OB.dp[2][3], hint: 'Row 2 starts with 1; each cell adds the one above.' },
      solved: `Row 2 = [${OB.dp[2].join(', ')}]: ${OB.dp[2][3]} paths.`,
      then: fillFrames(R3, C4, OB.dp.map((row, r) => (r < 2 ? row : row.map(() => '·'))), OB.ev.filter((e) => e.r === 2), { say: 0 }),
    },
    {
      kind: 'watch',
      title: 'Triangle, bottom-up',
      lines: ['Start from the **last row**.', 'Each cell adds the **smaller** of its two children.', 'The **apex** holds the answer; no edge-of-row cases.'],
      frames: [
        { say: 0, note: 'dp starts as the last row: [4, 1, 8, 3].', panels: [grid(pad(TRI), undefined, 'triangle'), table(C4, C4, pad(TR.start))] },
        ...fillFrames(C4, C4, pad(TR.start), TR.ev, { say: 1, pre: (e) => [grid(pad(TRI), sm(4, 4, { [`${e.r},${e.c}`]: 'active' }), 'triangle')] }),
        { say: 2, note: `Apex = ${TR.ans}.`, panels: [table(C4, C4, pad(after(TR.start, TR.ev)), sm(4, 4, { '0,0': 'done' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: maximal square',
      lines: ['`dp[r][c]` = side of the largest all-1 square with **bottom-right corner** (r, c).', 'For a 1-cell: `1 + min(top, left, top-left)`.'],
      panels: [grid(SQ, sm(3, 3, { '2,2': 'active' }), 'matrix'), table(R3, R3, SQD.map((row, r) => row.map((v, c) => (r === 2 && c === 2 ? '?' : v))), sm(3, 3, { '2,2': 'active', '1,2': 'visited', '2,1': 'visited', '1,1': 'visited' }))],
      task: { type: 'number', question: 'What is `dp[2][2]`?', options: [1, 2, 3, 4], answer: SQD[2][2], hint: 'top = 1, left = 2, top-left = 2.' },
      solved: `1 + min(1, 2, 2) = ${SQD[2][2]}: a 2 × 2 square ends at (2,2).`,
      then: [{ say: 0, note: `dp[2][2] = ${SQD[2][2]}.`, panels: [grid(SQ, sm(3, 3, mk([[1, 1], [1, 2], [2, 1], [2, 2]], 'done')), 'matrix'), table(R3, R3, SQD, sm(3, 3, { '2,2': 'active' }))] }],
    },
  ],

  'optimized-grid': [
    {
      kind: 'watch',
      title: 'One row for unique paths',
      lines: ['Each row only reads the previous row and itself → keep **one array** of length n.', 'Before the write, `dp[c]` still holds the cell **above**.', '`dp[c − 1]` is already this row: the cell to the **left**.'],
      frames: [
        { say: 0, note: 'Row 0: [1, 1, 1, 1]. One array for the whole 3 × 4 grid.', panels: [arr([1, 1, 1, 1], { label: 'dp (row 0)' })] },
        ...RP.fr.map((s) => ({
          say: s.c === 1 ? 1 : 2,
          note: `Row ${s.r}: dp[${s.c}] = ${s.above} above + ${s.left} left = ${s.dp[s.c]}.`,
          panels: [arr(s.dp, { label: `dp (row ${s.r})`, highlights: { [s.c]: 'active', [s.c - 1]: 'visited' }, pointers: [ptr(s.c, 'above'), ptr(s.c - 1, 'left', 'b')] })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: wrong direction',
      lines: ['Row 1, updating **right to left** instead.'],
      panels: [arr([1, 1, 1, 1], { label: 'dp (row 0 values)', highlights: { 3: 'active', 2: 'visited' }, pointers: [ptr(3, 'c'), ptr(2, 'c−1', 'b')] })],
      task: {
        type: 'choose',
        question: 'At c = 3, what does `dp[c − 1]` hold?',
        options: [
          { text: 'The old row-0 value: the above-left cell, not the left', why: '' },
          { text: 'The new left value from row 1', why: 'Right to left, dp[2] has not been updated yet in this row.' },
          { text: 'The cell above', why: 'The cell above is dp[3] itself (its old value).' },
        ],
        answer: 0,
      },
      solved: 'Right to left reads the **old** above-left value: wrong. Go **left to right**.',
    },
    {
      kind: 'watch',
      title: 'Dungeon: fill backwards',
      lines: ['`need[r][c]` = minimum health when you **enter** (r, c).', '`max(1, min(below, right) − dungeon[r][c])`.', 'Fill from the goal back to the start.'],
      frames: [
        { say: 0, note: 'Health must stay ≥ 1 at every step. Ask from the end: how much do I need on entry?', panels: [...dgGrid(), table(['0', '1'], ['0', '1'], dNeed(0), undefined, 'need')] },
        ...DR.ev.slice(0, 2).map((e, k) => ({ say: k ? 1 : 2, note: k === 0 ? `Goal (1,1): leave with at least 1 → max(1, 1 − (${DG[1][1]})) = ${e.v}.` : `(1,0): ${e.note}`, panels: [...dgGrid(e), table(['0', '1'], ['0', '1'], dNeed(k + 1), sm(2, 2, { ...mk(e.reads.filter(([a, b]) => a < 2 && b < 2), 'visited'), [`${e.r},${e.c}`]: 'active' }), 'need')] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the healing potion',
      lines: ['(0,1) holds a **+5** potion; the only way on is down to (1,1), which needs 5.'],
      panels: [...dgGrid(DR.ev[2]), table(['0', '1'], ['0', '1'], dNeed(2).map((row, r) => row.map((v, c) => (r === 0 && c === 1 ? '?' : v))), sm(2, 2, { '0,1': 'active', '1,1': 'visited' }), 'need')],
      task: { type: 'number', question: '`min(...) − 5` = 0 here. What is stored in `need[0][1]`?', options: [-4, 0, 1, 5], answer: DR.ev[2].v, hint: 'You cannot enter a cell with 0 health.' },
      solved: `max(1, 0) = ${DR.ev[2].v}: the clamp. A big potion cannot let you enter with 0 or less.`,
      then: DR.ev.slice(2).map((e, k) => ({ say: 0, note: k === 0 ? `need[0][1] = ${e.v}.` : `Start (0,0): ${e.note} Enter with ${e.v}.`, panels: [...dgGrid(e), table(['0', '1'], ['0', '1'], dNeed(3 + k), sm(2, 2, { ...mk(e.reads.filter(([a, b]) => a < 2 && b < 2), 'visited'), [`${e.r},${e.c}`]: 'active' }), 'need')] })),
    },
  ],

  'template-grid': [
    {
      kind: 'watch',
      title: 'gridMinCost, one row',
      lines: ['`dp` starts as `Infinity`, with `dp[0] = 0`.', 'First column: `dp[0] += grid[r][0]` (only from above).', '`dp[c] = grid[r][c] + min(dp[c] above, dp[c − 1] left)`.'],
      frames: GM.fr.slice(0, -1).map((s, k) => ({ say: k === 0 ? 0 : s.c === 0 ? 1 : 2, note: s.note, panels: gmPanels(s) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last cell',
      lines: ['Row 1: dp = [5, 8, 6] so far; dp[2] still holds row 0.'],
      panels: gmPanels({ ...GM.fr.at(-2), c: 2, r: 1 }),
      task: { type: 'number', question: 'What does `gridMinCost` return?', options: [11, 12, 14, 15], answer: GM.ans, hint: 'grid[1][2] = 6; above = 6, left = 8.' },
      solved: `6 + min(6, 8) = ${GM.ans}.`,
      then: [{ say: 0, note: GM.fr.at(-1).note, panels: gmPanels(GM.fr.at(-1)) }],
    },
    {
      kind: 'watch',
      title: 'backward() with sentinels',
      lines: ['An extra row and column of **Infinity**: no boundary ifs.', 'Two **1**s next to the goal: leave it with at least 1 health.', 'Fill r = m−1..0, c = n−1..0.'],
      frames: [
        { say: 0, note: 'need is (m+1) × (n+1), all Infinity.', panels: [grid(BG, undefined, 'grid'), table(R3s, R3s, mat(3, 3, Infinity), undefined, 'need')] },
        { say: 1, note: 'need[2][1] = need[1][2] = 1, beside the goal.', panels: [grid(BG, undefined, 'grid'), table(R3s, R3s, BW.start, sm(3, 3, { '2,1': 'done', '1,2': 'done' }), 'need')] },
        ...fillFrames(R3s, R3s, BW.start, BW.ev, { say: 2, pre: (e) => [grid(BG, sm(2, 2, { [`${e.r},${e.c}`]: 'active' }), 'grid')], label: 'need' }),
        { say: 2, note: `Answer need[0][0] = ${BW.ans}.`, panels: [grid(BG, undefined, 'grid'), table(R3s, R3s, BW.need, sm(3, 3, { '0,0': 'done' }), 'need')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: forget the sentinels',
      lines: ['Same code, but the two 1s are never written.'],
      panels: [table(R3s, R3s, mat(3, 3, Infinity), sm(3, 3, { '1,1': 'active', '2,1': 'visited', '1,2': 'visited' }), 'need')],
      task: {
        type: 'choose',
        question: 'What does the goal cell `need[1][1]` become?',
        options: [
          { text: 'Infinity, and every cell inherits it', why: '' },
          { text: '1, from the max(1, …) clamp', why: 'max(1, ∞) is ∞; the clamp only lifts small values.' },
          { text: '0', why: 'Nothing sets 0: both neighbours are Infinity.' },
        ],
        answer: 0,
      },
      solved: 'min(∞, ∞) − grid is still ∞. The two 1s are what make the goal behave.',
    },
  ],

  'implementation-grid': [
    {
      kind: 'watch',
      title: 'uniquePathsWithObstacles, rolling',
      lines: ['`dp[0] = 1`: one way to stand on the start.', 'Blocked cell → `dp[c] = 0`.', 'Open cell: `dp[c] += dp[c − 1]` (above + left).'],
      frames: [
        { say: 0, note: 'dp = [1, 0, 0].', panels: [grid(IG.map((row) => row.map((x) => (x ? '#' : '.'))), undefined, 'grid (# blocked)'), arr([1, 0, 0], { label: 'dp', highlights: { 0: 'active' } })] },
        ...OR.fr.slice(0, 6).map((s) => ({ say: s.say, note: s.note, panels: igPanels(s) })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: below the block',
      lines: ['Row 2 starts at c = 0, under the blocked cell.'],
      panels: igPanels({ ...OR.fr[5], r: 2, c: 0 }),
      task: {
        type: 'choose',
        question: '(2,0) is open. What is `dp[0]` after it?',
        options: [
          { text: '0: no left, so it keeps the value from above, and above was blocked', why: '' },
          { text: '1: open cells always get 1', why: 'Open cells add, they do not reset. c = 0 has nothing to add.' },
          { text: '1: dp[0] was set to 1 at the start', why: 'Row 1 overwrote it with 0 at the blocked cell.' },
        ],
        answer: 0,
      },
      solved: 'dp[0] stays **0**: the first column is cut off below the block.',
      then: OR.fr.slice(6).map((s) => ({ say: 0, note: s.c === 2 ? `${s.note} Answer ${OR.ans}.` : s.note, panels: igPanels(s) })),
    },
    {
      kind: 'watch',
      title: 'The shared-row bug',
      lines: ['`new Array(m).fill(new Array(n).fill(0))` puts the **same** row in every slot.', '`Array.from({ length: m }, () => …)` runs the arrow once **per row**.'],
      frames: [
        { say: 0, note: 'Shared rows: dp[0][0] = 5 also changes dp[1][0] and dp[2][0].', panels: [table(R3, R3, [[5, 0, 0], [5, 0, 0], [5, 0, 0]], sm(3, 3, mk([[0, 0], [1, 0], [2, 0]], 'bad')), 'fill(new Array)')] },
        { say: 1, note: 'Separate rows: only dp[0][0] changes.', panels: [table(R3, R3, [[5, 0, 0], [0, 0, 0], [0, 0, 0]], sm(3, 3, { '0,0': 'done' }), 'Array.from')] },
      ],
    },
  ],

  'dry-run-grid': [
    {
      kind: 'watch',
      title: 'Rows 0 and 1',
      lines: ['Row 0: a running sum (only from the left).', 'Later rows: `dp[c] = grid[r][c] + min(above, left)`.', '**above** = old `dp[c]`, **left** = new `dp[c − 1]`.'],
      frames: DRG.slice(0, 7).map((s) => ({ say: s.r === 0 ? 0 : s.c === 0 ? 1 : 2, note: s.r === 1 && s.c === 2 ? `${s.note} Row 1 = [2, 7, 6].` : s.r === 0 && s.c === 2 ? `${s.note} Row 0 = [1, 4, 5].` : s.note, panels: drgPanels({ ...s, dp: s.r === 0 ? s.dp : s.dp }) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: row 2, middle',
      lines: ['Row 2 so far: dp = [6, 7, 6]; grid[2][1] = 2.'],
      panels: drgPanels({ ...DRG[7], dp: DRG[6].dp }),
      task: { type: 'number', question: 'What is the new `dp[1]`?', options: [6, 7, 8, 9], answer: DRG[7].v, hint: 'above = old dp[1] = 7, left = new dp[0] = 6.' },
      solved: `2 + min(7, 6) = ${DRG[7].v}.`,
      then: [{ say: 0, note: DRG[7].note, panels: drgPanels(DRG[7]) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last cell',
      lines: ['`dp[2] = 1 + min(6, 8)`.'],
      panels: drgPanels({ ...DRG[8], dp: DRG[7].dp }),
      task: {
        type: 'choose',
        question: 'Where does the 6 come from?',
        options: [
          { text: 'Above: the old dp[2] from row 1', why: '' },
          { text: 'Left: the new dp[1]', why: 'The new dp[1] is 8.' },
          { text: 'grid[2][2]', why: 'grid[2][2] is 1, the cost added on top.' },
        ],
        answer: 0,
      },
      solved: `1 + 6 = ${DRG[8].v}. Answer dp[2] = ${DRG[8].v}.`,
      then: [
        { say: 0, note: `${DRG[8].note} Row 2 = [6, 8, 7].`, panels: drgPanels(DRG[8]) },
        { say: 0, note: 'Path 1 → 3 → 1 → 1 → 1 = 7.', panels: [grid(MPS, sm(3, 3, mk(PATH, 'done')), 'cheapest path'), vars({ answer: DRG[8].v })] },
      ],
    },
  ],

  'intuition-two-sequences': [
    {
      kind: 'watch',
      title: 'LCS("abc", "ac")',
      lines: ['a down the side, b across the top, each with an **empty** prefix.', 'Last chars equal → `dp[i−1][j−1] + 1`.', 'Different → `max(dp[i−1][j], dp[i][j−1])`.'],
      frames: [
        { say: 0, note: 'Row 0 and column 0: an empty prefix has LCS 0.', panels: [table(lbl('abc'), lbl('ac'), baseZero(4, 3))] },
        ...fillFrames(lbl('abc'), lbl('ac'), baseZero(4, 3), IL.ev.slice(0, 5), { say: (e) => (e.match ? 1 : 2) }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: last cell',
      lines: ['a[2] = c and b[1] = c.'],
      panels: [table(lbl('abc'), lbl('ac'), after(baseZero(4, 3), IL.ev.slice(0, 5)).map((row, i) => row.map((v, j) => (i === 3 && j === 2 ? '?' : v))), sm(4, 3, { '3,2': 'active' }))],
      task: {
        type: 'choose',
        question: 'Which value does `dp[3][2]` build on?',
        options: [
          { text: 'The diagonal dp[2][1], plus 1', why: '' },
          { text: 'max(up, left)', why: 'That is for different last characters. These two are equal and can be matched.' },
          { text: 'dp[3][1] + 1', why: 'Matching c with c consumes a character from **both** strings: step diagonally.' },
        ],
        answer: 0,
      },
      solved: `dp[2][1] + 1 = ${IL.dp[3][2]}: LCS "ac".`,
      then: fillFrames(lbl('abc'), lbl('ac'), after(baseZero(4, 3), IL.ev.slice(0, 5)), IL.ev.slice(5), { say: 0 }),
    },
    {
      kind: 'watch',
      title: 'Edit distance: hors[e] vs ro[s]',
      lines: ['Base: `dp[i][0] = i` deletions, `dp[0][j] = j` insertions.', 'Last chars e ≠ s: pay 1 and reuse a smaller pair of prefixes.', 'Replace e → s: `1 + dp[i−1][j−1]`.', 'Delete e: `1 + dp[i−1][j]`.'],
      frames: [
        { say: 0, note: '"horse" → "": i deletions. "" → "ros": j insertions.', panels: [arr([0, 1, 2, 3, 4, 5], { label: 'dp[i][0], i = 0..5' }), arr([0, 1, 2, 3], { label: 'dp[0][j], j = 0..3' })] },
        { say: 1, note: 'Cell (5, 3): "horse" vs "ros". Its neighbours are already filled.', panels: [hrWin(sm(2, 2, { '1,1': 'active' }))] },
        { say: 2, note: `Replace: 1 + dp[4][2] = 1 + ${HR.dp[4][2]} = ${1 + HR.dp[4][2]}.`, panels: [hrWin(sm(2, 2, { '1,1': 'active', '0,0': 'visited' }))] },
        { say: 3, note: `Delete: 1 + dp[4][3] = 1 + ${HR.dp[4][3]} = ${1 + HR.dp[4][3]}.`, panels: [hrWin(sm(2, 2, { '1,1': 'active', '0,1': 'visited' }))] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: take the min',
      lines: ['Third option: `1 + dp[i][j−1]` (the left cell).', 'The cell takes the **min** of all three.'],
      panels: [hrWin(sm(2, 2, { '1,1': 'active', '0,0': 'visited', '0,1': 'visited', '1,0': 'visited' }))],
      task: { type: 'number', question: 'What is `dp[5][3]`?', options: [2, 3, 4, 5], answer: HR.dp[5][3], hint: `1 + min(${HR.dp[4][2]}, ${HR.dp[4][3]}, ${HR.dp[5][2]}).` },
      solved: `1 + min(${HR.dp[4][2]}, ${HR.dp[4][3]}, ${HR.dp[5][2]}) = ${HR.dp[5][3]}.`,
      then: [{ say: 1, note: `dp[5][3] = ${HR.dp[5][3]}.`, panels: [hrWin(sm(2, 2, { '1,1': 'done' }), HR.dp[5][3])] }],
    },
  ],

  'optimized-two-sequences': [
    {
      kind: 'watch',
      title: 'Is "ace" a subsequence of "abcde"?',
      lines: ['Walk `t`; advance in `s` when the characters match.', 'Two pointers are enough: no table.'],
      frames: [
        ...IS.fr.map((s) => ({
          say: 0,
          note: s.hit ? `t[${s.j}] = ${'abcde'[s.j]} matches s[${s.i}]: advance in s.` : `t[${s.j}] = ${'abcde'[s.j]} ≠ s[${s.i}] = ${'ace'[s.i]}: keep walking t.`,
          panels: [arr('ace'.split(''), { label: 's', highlights: { ...Object.fromEntries([...Array(s.i).keys()].map((k) => [k, 'done'])), [s.i]: s.hit ? 'active' : '' }, pointers: [ptr(s.i, 'i')] }), arr('abcde'.split(''), { label: 't', highlights: { [s.j]: s.hit ? 'active' : 'muted' }, pointers: [ptr(s.j, 'j', 'b')] })],
        })),
        { say: 1, note: `i reached ${IS.i} = s.length → true.`, panels: [arr('ace'.split(''), { label: 's', highlights: { 0: 'done', 1: 'done', 2: 'done' } }), vars({ result: 'true' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Distinct subsequences: "ab" in "aab"',
      lines: ['`dp[i][j]` = ways `t[0..j)` appears in `s[0..i)`.', 'Base: `dp[i][0] = 1` (choose nothing).', "Don't use s[i−1]: `dp[i−1][j]` ways.", 'Use it (only on a match): add `dp[i−1][j−1]`.'],
      frames: [
        { say: 0, note: 'Rows: prefixes of s = "aab". Columns: prefixes of t = "ab".', panels: [table(lbl('aab'), lbl('ab'), emptyT(4, 3))] },
        { say: 1, note: 'Column 0 = 1. Row 0 (empty s) = 0 for non-empty t.', panels: [table(lbl('aab'), lbl('ab'), DS.start.map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? v : '·'))), sm(4, 3, mk([[0, 0], [1, 0], [2, 0], [3, 0]], 'done')))] },
        ...fillFrames(lbl('aab'), lbl('ab'), DS.start.map((row, i) => row.map((v, j) => (i === 0 || j === 0 ? v : '·'))), DS.ev.slice(0, 5), { say: (e) => (e.reads.length > 1 ? 3 : 2) }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last cell',
      lines: ['s[2] = b and t[1] = b: skip **plus** use.'],
      panels: [table(lbl('aab'), lbl('ab'), after(DS.start, DS.ev.slice(0, 5)).map((row, i) => row.map((v, j) => (i === 3 && j === 2 ? '?' : v))), sm(4, 3, { '3,2': 'active', '2,2': 'visited', '2,1': 'visited' }))],
      task: { type: 'number', question: 'How many ways does "ab" appear in "aab"?', options: [1, 2, 3, 4], answer: DS.dp[3][2], hint: 'dp[2][2] + dp[2][1].' },
      solved: `${DS.dp[2][2]} + ${DS.dp[2][1]} = ${DS.dp[3][2]}: either "a" can pair with the "b".`,
      then: fillFrames(lbl('aab'), lbl('ab'), after(DS.start, DS.ev.slice(0, 5)), DS.ev.slice(5), { say: 0 }),
    },
    {
      kind: 'turn',
      title: 'Your turn: regex row 0',
      lines: ['`s = "aab"`, `p = "a*b"`. Row 0 is the **empty** s.'],
      panels: [table(lbl('aab'), lbl('a*b'), after(rxStart, RX.ev.slice(0, 1)), sm(4, 4, { '0,2': 'active', '0,0': 'visited' }))],
      task: {
        type: 'choose',
        question: 'Why is `dp[0][2]` ("" vs "a*") true?',
        options: [
          { text: 'Zero copies: drop the "a*" pair → dp[0][0] = T', why: '' },
          { text: 'One more copy of a', why: 's is empty: there is no character to consume.' },
          { text: '* matches anything on its own', why: '* never stands alone; it modifies the a before it.' },
          { text: 'It copies dp[0][1]', why: 'That would stop halfway through the "a*" unit; zero copies jumps back **two** columns.' },
        ],
        answer: 0,
      },
      solved: '`dp[0][j] = dp[0][j−2]` when `p[j−1]` is `*`.',
      then: fillFrames(lbl('aab'), lbl('a*b'), rxStart, RX.ev.slice(0, 3), { say: 0 }),
    },
    {
      kind: 'watch',
      title: 'Regex: "aab" vs "a*b"',
      lines: ['Normal char or `.`: must match `s[i−1]`, then `dp[i−1][j−1]`.', '`*` zero copies: `dp[i][j−2]`.', '`*` one more copy: `dp[i−1][j]`, if `s[i−1]` matches x.'],
      frames: [
        ...fillFrames(lbl('aab'), lbl('a*b'), after(rxStart, RX.ev.slice(0, 3)), RX.ev.slice(3), { say: (e) => ('a*b'[e.c - 1] === '*' ? (e.reads.length > 1 ? 2 : 1) : 0) }),
        { say: 0, note: 'dp[3][3] = T: "aab" matches "a*b".', panels: [table(lbl('aab'), lbl('a*b'), RX.dp, sm(4, 4, { '3,3': 'done' }))] },
      ],
    },
  ],

  'template-two-sequences': [
    {
      kind: 'watch',
      title: 'minDistance("abc", "yab")',
      lines: ['`dp[i][0] = i` (delete everything), `dp[0][j] = j` (insert everything).', 'Match → copy the diagonal.', 'Else → `1 + min(replace ↖, delete ↑, insert ←)`.'],
      frames: [
        { say: 0, note: 'Base row and column.', panels: [table(edRows, edCols, ED.start, sm(4, 4, mk([[0, 1], [0, 2], [0, 3], [1, 0], [2, 0], [3, 0]], 'done')))] },
        ...fillFrames(edRows, edCols, ED.start, ED.ev.slice(0, -1), { say: (e) => (e.reads.length === 1 ? 1 : 2) }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the answer cell',
      lines: ['c ≠ b: `1 + min(dp[2][2], dp[2][3], dp[3][2])`.'],
      panels: [table(edRows, edCols, after(ED.start, ED.ev.slice(0, -1)).map((row, i) => row.map((v, j) => (i === 3 && j === 3 ? '?' : v))), sm(4, 4, { ...mk(edLast.reads, 'visited'), '3,3': 'active' }))],
      task: { type: 'number', question: 'What does `minDistance("abc", "yab")` return?', options: [1, 2, 3, 4], answer: edLast.v, hint: 'The up cell dp[2][3] is 1.' },
      solved: `1 + min(2, 1, 3) = ${edLast.v}: delete c, insert y.`,
      then: fillFrames(edRows, edCols, after(ED.start, ED.ev.slice(0, -1)), [edLast], { say: 0 }),
    },
    {
      kind: 'watch',
      title: 'Two rows are enough',
      lines: ['Row i reads row i−1 (up, up-left) and itself (left).', 'Keep only `prev` and `cur`.'],
      frames: [{ say: 0, note: 'Row 3 needs only row 2 and its own left cell.', panels: [arr(ED.dp[2], { label: 'prev (row 2: "ab")' }), arr([3, '·', '·', '·'], { label: 'cur (row 3: "abc")', highlights: { 0: 'active' } })] }, ...rowFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: which string across?',
      lines: ['The rolling rows are as long as the column string.'],
      panels: [vars({ a: '10000 chars', b: '50 chars' })],
      task: {
        type: 'choose',
        question: 'Which string should be the columns?',
        options: [
          { text: 'The shorter one (b): O(min(m, n)) space', why: '' },
          { text: 'The longer one (a)', why: 'Rows would hold 10001 slots instead of 51.' },
          { text: 'It does not matter', why: 'Row length = column string length + 1, so it decides the space.' },
        ],
        answer: 0,
      },
      solved: 'Shorter string across → **O(min(m, n))** space.',
    },
  ],

  'implementation-two-sequences': [
    {
      kind: 'watch',
      title: 'LCS("cab", "abc") with two rows',
      lines: ['Match → `prev[j − 1] + 1`.', 'Else → `max(prev[j], cur[j − 1])`.', 'After each row: `prev = cur`.'],
      frames: [
        { say: 2, note: 'prev starts as row 0: all zeros.', panels: [arr([0, 0, 0, 0], { label: 'prev' }), vars({ i: 0 })] },
        ...LR.fr.slice(0, 8).map((s) => ({ say: s.match ? 0 : 1, note: s.j === 3 ? `${s.note} prev = cur.` : s.note, panels: lrPanels(s) })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last slot',
      lines: ['i = 3 (b), j = 3 (c): no match.'],
      panels: lrPanels({ ...LR.fr[8], cur: [0, 1, 2, '?'] }),
      task: { type: 'number', question: 'What is `cur[3]`, the answer?', options: [1, 2, 3], answer: LR.ans, hint: 'max(prev[3], cur[2]).' },
      solved: `max(1, 2) = ${LR.ans}: LCS "ab".`,
      then: [{ say: 0, note: LR.fr[8].note, panels: lrPanels(LR.fr[8]) }],
    },
    {
      kind: 'turn',
      title: 'Your turn: slicing in the loop',
      lines: ['Compare characters with `a[i - 1] === b[j - 1]`.'],
      panels: [vars({ inner: 'a.slice(0, i)' })],
      task: {
        type: 'choose',
        question: 'What is wrong with calling `a.slice(0, i)` inside the loops?',
        options: [
          { text: 'Each call is O(length) and allocates', why: '' },
          { text: 'It gives wrong characters', why: 'The values are right; the cost is the problem.' },
          { text: 'Nothing: slice is O(1)', why: 'slice copies the characters, so it costs O(length).' },
        ],
        answer: 0,
      },
      solved: 'Index the characters directly; no `slice` / `substring` in the loops.',
    },
  ],

  'dry-run-two-sequences': [
    {
      kind: 'watch',
      title: 'Rows 0 to 3',
      lines: ['Rows = prefixes of "abcde", columns = "", a, c, e.', 'Match → diagonal + 1; else max(up, left).'],
      frames: [0, 1, 2, 3].map((k) => dlFrame(k, k === 0 ? 0 : 1)),
    },
    {
      kind: 'turn',
      title: 'Your turn: row 4 (d)',
      lines: ['d matches none of a, c, e.'],
      panels: [table(DLR, DLC, DL.dp.slice(1).map((row, k) => (k < 3 ? row : k === 3 ? [0, 1, 2, '?'] : row.map(() => '·'))), sm(5, 4, { '3,3': 'active', '2,3': 'visited', '3,2': 'visited' }))],
      task: { type: 'number', question: 'What is `dp[4][3]`?', options: [1, 2, 3], answer: DL.dp[4][3], hint: 'max(up dp[3][3], left dp[4][2]).' },
      solved: `max(2, 2) = ${DL.dp[4][3]}. Row 4 = [0, 1, 2, 2].`,
      then: [4, 5].map((k) => dlFrame(k, 0)),
    },
    {
      kind: 'watch',
      title: 'Walk back from dp[5][3]',
      lines: ['Start at `dp[5][3]` = 3.', 'Match → that char is chosen; step **diagonally**.', 'No match → step to the neighbour holding the same value.'],
      frames: [{ say: 0, note: 'dp[5][3] = 3: the LCS has 3 characters.', panels: [dlTable(5, { '4,3': 'active' }, 'walking back'), vars({ picked: '—' })] }, ...wbFrames, { say: 1, note: `Reached row ${WB.end[0]}. Picked e, c, a → reversed: "ace".`, panels: [dlTable(5, mk(WB.steps.map((x) => [x.i - 1, x.j]), 'done'), 'walked'), vars({ LCS: 'ace' })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the order',
      lines: ['The walk starts at the **end** of both strings.'],
      panels: [dlTable(5, mk(WB.steps.filter((x) => x.ch).map((x) => [x.i - 1, x.j]), 'active'))],
      task: { type: 'order', question: 'Tap the characters in the order the walk-back picks them.', items: WCH, hint: 'Diagonal steps from bottom-right to top-left.' },
      solved: 'e, c, a. Reverse them: **"ace"**.',
    },
  ],
};

export default { ...STEPS, ...secondPart };
