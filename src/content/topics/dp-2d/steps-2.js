// Step lessons for DP 2D, part 2 (knapsack sections, mistakes, interview tips). Format: src/content/stepSchema.js.
// Facts come only from topic.js. Every dp cell below comes from running the lesson's own loops (2D table, 1D
// backwards for 0/1, 1D forwards for unbounded, coins-outer vs amount-outer) on the example; check() throws on drift.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const code = (text) => vars({ code: text });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-2d/steps-2.js: ${msg}`);
};
const TF = (xs) => xs.map((b) => (b ? 'T' : 'F'));
const list = (xs) => `[${xs.join(', ')}]`;

// ---------- the lesson's loops ----------
// 2D 0/1 knapsack (template-knapsack): one record per cell (i ≥ 1), with the table after it
function knap2D(w, v, C) {
  const n = w.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(C + 1).fill(0));
  const recs = [];
  for (let i = 1; i <= n; i++)
    for (let c = 0; c <= C; c++) {
      const skip = dp[i - 1][c];
      dp[i][c] = skip;
      const fits = c >= w[i - 1];
      const take = fits ? dp[i - 1][c - w[i - 1]] + v[i - 1] : null;
      if (fits) dp[i][c] = Math.max(dp[i][c], take);
      recs.push({ i, c, skip, take, val: dp[i][c], snap: dp.map((r) => r.slice()) });
    }
  return { dp, recs };
}
// One array, one in-place pass per item. forward = unbounded, backwards = 0/1. upd(old, read, item) → new value.
function roll(init, items, wOf, upd, forward) {
  const dp = init.slice();
  const C = dp.length - 1;
  const recs = [];
  const rows = [];
  items.forEach((it, i) => {
    const x = wOf(it);
    const cs = [];
    if (forward) for (let c = x; c <= C; c++) cs.push(c);
    else for (let c = C; c >= x; c--) cs.push(c);
    for (const c of cs) {
      const old = dp[c];
      const read = dp[c - x];
      dp[c] = upd(old, read, it);
      recs.push({ i, x, c, old, read, val: dp[c], dp: dp.slice() });
    }
    rows.push(dp.slice());
  });
  return { recs, rows, final: dp };
}
const maxUpd = (old, read, [, v]) => Math.max(old, read + v);
const orUpd = (old, read) => old || read;
const addUpd = (old, read) => old + read;
// amount outer, items inner (permutations / combination sum IV)
function permRun(nums, target) {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  const recs = [];
  for (let a = 1; a <= target; a++)
    for (const x of nums)
      if (x <= a) {
        dp[a] += dp[a - x];
        recs.push({ a, x, val: dp[a], dp: dp.slice() });
      }
  return { recs, final: dp };
}

// a 1D frame: slot c active, slot c − w read
const slot = (dp, c, x, label, o = {}) =>
  arr(dp, { label, highlights: hl(dp.length, (k) => (k === c ? 'active' : k === c - x ? 'window' : o.done?.(k) ? 'done' : '')), pointers: c - x === c ? [ptr(c, 'c')] : [ptr(c - x, o.rl ?? 'c−w', 'b'), ptr(c, o.cl ?? 'c')] });

// ---------- intuition-knapsack: items (1,6) (2,10) (3,12), C = 3 ----------
const IW = [1, 2, 3];
const IV = [6, 10, 12];
const IK = knap2D(IW, IV, 3);
check(same(IK.dp, [[0, 0, 0, 0], [0, 6, 6, 6], [0, 6, 10, 16], [0, 6, 10, 16]]), 'intuition 2D table');
const IROWS = ['none', 'w1 v6', 'w2 v10', 'w3 v12'];
const ICOLS = ['c=0', 'c=1', 'c=2', 'c=3'];
// cells filled up to record r (row i's c = 0 counts as filled with the row)
const ikTable = (r) => {
  const { i, c, snap } = r;
  const w = IW[i - 1];
  const cells = snap.map((row, R) => row.map((val, Cc) => (R < i || (R === i && Cc <= c) ? val : '·')));
  const st = snap.map((row, R) => row.map((_, Cc) => (R === i && Cc === c ? 'active' : R === i - 1 && Cc === c ? 'window' : R === i - 1 && c >= w && Cc === c - w ? 'visited' : '')));
  return table(IROWS, ICOLS, cells, st, 'dp[i][c]');
};
const ikNote = (r) => {
  const w = IW[r.i - 1];
  const v = IV[r.i - 1];
  if (r.take === null) return `dp[${r.i}][${r.c}]: w = ${w} > c = ${r.c}, only skip → ${r.val}.`;
  return `dp[${r.i}][${r.c}]: skip = ${r.skip}, take = dp[${r.i - 1}][${r.c - w}] + ${v} = ${r.take} → ${r.val}.`;
};
const ikCells = IK.recs.filter((r) => r.c >= 1);
const IK_TURN = ikCells.findIndex((r) => r.i === 2 && r.c === 3);
check(ikCells[IK_TURN].val === 16, 'dp[2][3]');
// 1D backwards for item (2,10) on row 1
const IK1 = roll([0, 6, 6, 6], [[2, 10]], (it) => it[0], maxUpd, false);
check(same(IK1.final, IK.dp[2]), '1D row 2 = 2D row 2');
// one item (2,10), C = 4: forwards reuses, backwards does not
const ONE_F = roll([0, 0, 0, 0, 0], [[2, 10]], (it) => it[0], maxUpd, true);
const ONE_B = roll([0, 0, 0, 0, 0], [[2, 10]], (it) => it[0], maxUpd, false);
check(ONE_F.final[4] === 20 && ONE_B.final[4] === 10, 'forward vs backward, one item');

// ---------- optimized-knapsack ----------
const PN = [1, 2, 3, 4];
const P_HALF = PN.reduce((a, b) => a + b, 0) / 2; // 5
const PR = roll([true, false, false, false, false, false], PN, (x) => x, orUpd, false);
check(P_HALF === 5 && PR.final[5] === true && same(PR.rows[2], [true, true, true, true, true, true]), 'partition [1,2,3,4]');
const TSN = [1, 2, 1];
const TS_P = (4 + 2) / 2;
const TSR = roll([1, 0, 0, 0], TSN, (x) => x, addUpd, false);
check(TS_P === 3 && TSR.final[3] === 2, 'target sum [1,2,1], 2');
// brute force over signs, to confirm the count
const signWays = (nums, t) => Array.from({ length: 1 << nums.length }, (_, m) => nums.reduce((s, x, k) => s + (m >> k & 1 ? x : -x), 0)).filter((s) => s === t).length;
check(signWays(TSN, 2) === 2, 'target sum brute');
const ZR = roll([1, 0], [0, 1], (x) => x, addUpd, false);
check(ZR.final[1] === 2 && signWays([0, 1], 1) === 2, 'zeros double');

// ---------- template-knapsack ----------
const TW = [2, 1];
const TV = [3, 2];
const TK = knap2D(TW, TV, 3);
check(same(TK.dp[2], [0, 2, 3, 5]), 'template 2D');
const tkTable = (r) => {
  const { i, c, snap } = r;
  const w = TW[i - 1];
  const cells = snap.map((row, R) => row.map((val, Cc) => (R < i || (R === i && Cc <= c) ? val : '·')));
  const st = snap.map((row, R) => row.map((_, Cc) => (R === i && Cc === c ? 'active' : R === i - 1 && Cc === c ? 'window' : R === i - 1 && c >= w && Cc === c - w ? 'visited' : '')));
  return table(['i=0', 'i=1', 'i=2'], ICOLS, cells, st, 'dp[i][c]');
};
const tkNote = (r) => {
  const w = TW[r.i - 1];
  const v = TV[r.i - 1];
  if (r.take === null) return `i = ${r.i}, c = ${r.c}: copy ${r.skip}; c < w[${r.i - 1}] = ${w}, no take.`;
  return `i = ${r.i}, c = ${r.c}: copy ${r.skip}; take dp[${r.i - 1}][${r.c - w}] + v[${r.i - 1}] = ${r.take} → ${r.val}.`;
};
const CRN = [2, 3];
const CR = roll([true, false, false, false, false, false], CRN, (x) => x, orUpd, false);
check(same(TF(CR.final), ['T', 'F', 'T', 'T', 'F', 'T']), 'canReach [2,3], 5');
const crFrame = (r, say) => ({ say, note: `x = ${r.x}, s = ${r.c}: dp[${r.c - r.x}] is ${r.read ? 'true' : 'false'}${r.read && !r.old ? ` → dp[${r.c}] = true` : r.old ? `; dp[${r.c}] already true` : ''}.`, panels: [slot(TF(r.dp), r.c, r.x, `dp, x = ${r.x}`, { cl: 's', rl: 's−x' })] });

// ---------- implementation-knapsack: canPartition([1, 5, 5, 1]) with the early exit ----------
const CP = [1, 5, 5, 1];
const CP_HALF = 6;
const cpRows = [];
let cpStop = -1;
{
  const dp = new Uint8Array(CP_HALF + 1);
  dp[0] = 1;
  for (let k = 0; k < CP.length; k++) {
    const x = CP[k];
    for (let s = CP_HALF; s >= x; s--) dp[s] |= dp[s - x];
    cpRows.push([...dp]);
    if (dp[CP_HALF]) {
      cpStop = k;
      break;
    }
  }
}
check(cpStop === 1 && same(cpRows[1], [1, 1, 0, 0, 0, 1, 1]), 'canPartition early exit');

// ---------- dry-run-knapsack: the lesson's own table ----------
const DW = [1, 3, 4];
const DV = [15, 20, 30];
const DK = roll([0, 0, 0, 0, 0], DW.map((w, k) => [w, DV[k]]), (it) => it[0], maxUpd, false);
check(same(DK.rows, [[0, 15, 15, 15, 15], [0, 15, 15, 20, 35], [0, 15, 15, 20, 35]]), 'dry run rows');
const DKF = roll([0, 0, 0, 0, 0], [[1, 15]], (it) => it[0], maxUpd, true);
check(same(DKF.final, [0, 15, 30, 45, 60]), 'dry run forward row');
const dkFrame = (r, say, tail = '') => ({ say, note: `Item (${DW[r.i]}, ${DV[r.i]}), c = ${r.c}: max(${r.old}, dp[${r.c - r.x}] + ${DV[r.i]} = ${r.read + DV[r.i]}) → ${r.val}.${tail}`, panels: [slot(r.dp, r.c, r.x, `dp after (${DW[r.i]}, ${DV[r.i]}) at c = ${r.c}`)] });
const DK_TURN = DK.recs.findIndex((r) => r.i === 1 && r.c === 4);

// ---------- intuition-unbounded: coins [1, 2] ----------
const UC = [1, 2];
// 2D counting: dp[i][c] = dp[i−1][c] + dp[i][c − coin], amounts 0..3
const U2 = [[1, 0, 0, 0]];
const u2recs = [];
UC.forEach((coin, k) => {
  const i = k + 1;
  U2.push(new Array(4).fill(0));
  for (let c = 0; c <= 3; c++) {
    const up = U2[i - 1][c];
    const row = c >= coin ? U2[i][c - coin] : null;
    U2[i][c] = up + (row ?? 0);
    u2recs.push({ i, c, up, same: row, val: U2[i][c], snap: U2.map((r) => r.slice()) });
  }
});
check(same(U2, [[1, 0, 0, 0], [1, 1, 1, 1], [1, 1, 2, 2]]), 'unbounded 2D');
const U2ROWS = ['none', 'coin 1', 'coin 2'];
const u2Table = (r, hideActive = false) => {
  const { i, c, snap } = r;
  const coin = UC[i - 1];
  const cells = [0, 1, 2].map((R) => [0, 1, 2, 3].map((Cc) => (R < i || (R === i && Cc < c) || (R === i && Cc === c && !hideActive) ? snap[R]?.[Cc] ?? 0 : '·')));
  const st = cells.map((row, R) => row.map((_, Cc) => (R === i && Cc === c ? 'active' : R === i - 1 && Cc === c ? 'window' : R === i && c >= coin && Cc === c - coin ? 'visited' : '')));
  return table(U2ROWS, ICOLS, cells, st, 'ways dp[i][c]');
};
const u2Note = (r) => (r.same === null ? `dp[${r.i}][${r.c}]: coin ${UC[r.i - 1]} does not fit → ${r.up} from above.` : `dp[${r.i}][${r.c}] = above ${r.up} + same row dp[${r.i}][${r.c - UC[r.i - 1]}] ${r.same} = ${r.val}.`);
const U2_TURN = u2recs.findIndex((r) => r.i === 2 && r.c === 3);
const UF = roll([1, 0, 0, 0, 0, 0], UC, (x) => x, addUpd, true);
check(same(UF.rows, [[1, 1, 1, 1, 1, 1], [1, 1, 2, 2, 3, 3]]), 'coins outer [1,2], 5');
const UP = permRun(UC, 5);
check(UP.final[5] === 8, 'amount outer [1,2], 5');

// ---------- optimized-unbounded ----------
const SUM_ROWS = ['0/1', 'combos', 'perms', 'min/max'];
const sumTable = (row) => table(SUM_ROWS, ['outer', 'inner'], [['itm', '←'], ['itm', '→'], ['amt', 'itm'], ['any', '→']], [0, 1, 2, 3].map((R) => (R === row ? ['active', 'active'] : ['', ''])), 'loop orders');
const C2F = roll([1, 0, 0, 0, 0], [2], (x) => x, addUpd, true);
const C2B = roll([1, 0, 0, 0, 0], [2], (x) => x, addUpd, false);
check(C2F.final[4] === 1 && C2B.final[4] === 0, 'coin 2 forward vs backward');

// ---------- template-unbounded: [1, 3], 4 ----------
const TU = [1, 3];
const TUC = roll([1, 0, 0, 0, 0], TU, (x) => x, addUpd, true);
const TUP = permRun(TU, 4);
check(TUC.final[4] === 2 && TUP.final[4] === 3, 'combos 2 vs perms 3');
const TUP_TURN = TUP.recs.findIndex((r) => r.a === 4 && r.x === 3);
const permFrame = (r, say) => ({ say, note: `a = ${r.a}, x = ${r.x}: dp[${r.a}] += dp[${r.a - r.x}] → ${r.val}.`, panels: [slot(r.dp, r.a, r.x, 'permutations dp', { cl: 'a', rl: 'a−x' })] });

// ---------- implementation-unbounded: weights [2, 3], values [3, 5], C = 7 ----------
const MW = [2, 3];
const MV = [3, 5];
const UM = roll(new Array(8).fill(0), MW.map((w, k) => [w, MV[k]]), (it) => it[0], maxUpd, true);
check(same(UM.final, [0, 0, 3, 5, 6, 8, 10, 11]), 'unboundedMax');
const umFrame = (r, say) => ({ say, note: `Item (${MW[r.i]}, ${MV[r.i]}), c = ${r.c}: max(${r.old}, dp[${r.c - r.x}] + ${MV[r.i]} = ${r.read + MV[r.i]}) → ${r.val}.`, panels: [slot(r.dp, r.c, r.x, `dp, item (${MW[r.i]}, ${MV[r.i]})`)] });
const UM_TURN = UM.recs.findIndex((r) => r.i === 1 && r.c === 6);

// ---------- dry-run-unbounded: the lesson's own table ----------
const DC = [1, 2, 5];
const DU = roll([1, 0, 0, 0, 0, 0], DC, (x) => x, addUpd, true);
check(same(DU.rows, [[1, 1, 1, 1, 1, 1], [1, 1, 2, 2, 3, 3], [1, 1, 2, 2, 3, 4]]), 'coin change II dry run');
const duFrame = (r, say) => ({ say, note: `Coin ${r.x}, a = ${r.c}: dp[${r.c}] = ${r.old} + dp[${r.c - r.x}] (${r.read}) = ${r.val}.`, panels: [slot(r.dp, r.c, r.x, `dp, coin ${r.x}`, { cl: 'a', rl: 'a−c' })] });
const DU_TURN = DU.recs.findIndex((r) => r.x === 2 && r.c === 5);

// ---------- mistakes ----------
const shared = new Array(3).fill(new Array(3).fill(0));
shared[0][0] = 1;
const fresh = Array.from({ length: 3 }, () => new Array(3).fill(0));
fresh[0][0] = 1;
check(shared[2][0] === 1 && fresh[2][0] === 0, 'shared rows');
const NO_BASE = roll([0, 0, 0, 0], [1, 2], (x) => x, addUpd, true);
check(NO_BASE.final[3] === 0, 'dp[0] = 0 gives 0');
// 2D knapsack with rows filled in the wrong order (i from n down to 1)
const WO = (() => {
  const w = [1, 2];
  const v = [6, 10];
  const dp = Array.from({ length: 3 }, () => new Array(4).fill(0));
  const snaps = [];
  for (let i = 2; i >= 1; i--) {
    for (let c = 0; c <= 3; c++) {
      dp[i][c] = dp[i - 1][c];
      if (c >= w[i - 1]) dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);
    }
    snaps.push(dp.map((r) => r.slice()));
  }
  return snaps;
})();
check(WO[1][2][3] === 10 && IK.dp[2][3] === 16, 'wrong fill order');

// ---------- interview-tips: the 3×3 corner ----------
const CK = knap2D([1, 2], [6, 10], 2);
check(same(CK.dp, [[0, 0, 0], [0, 6, 6], [0, 6, 10]]), '3x3 corner');
const ckTable = (r) =>
  table(
    ['none', 'w1 v6', 'w2 v10'],
    ['c=0', 'c=1', 'c=2'],
    r.snap.map((row, R) => row.map((val, Cc) => (R < r.i || (R === r.i && Cc <= r.c) ? val : '·'))),
    r.snap.map((row, R) => row.map((_, Cc) => (R === r.i && Cc === r.c ? 'active' : ''))),
    'dp[i][c]',
  );

const STEPS = {
  'intuition-knapsack': [
    {
      kind: 'watch',
      title: 'Skip or take, cell by cell',
      lines: ['Rows add one item; columns are capacity `c`.', '**Skip**: copy the cell above, `dp[i−1][c]`.', '**Take** (if it fits): `dp[i−1][c − w] + v`, up and left by w.', 'The cell keeps the larger one.'],
      frames: [
        { say: 0, note: 'Items (w, v): (1, 6), (2, 10), (3, 12); C = 3. Row 0 = no items: all 0.', panels: [table(IROWS, ICOLS, IK.dp.map((row, R) => row.map((v) => (R === 0 ? v : '·'))), [[ 'done', 'done', 'done', 'done' ]], 'dp[i][c]')] },
        ...ikCells.slice(0, IK_TURN).map((r) => ({ say: r.take === null ? 1 : r.take > r.skip ? 2 : 3, note: ikNote(r), panels: [ikTable(r)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: dp[2][3]',
      lines: ['Item (2, 10), capacity 3.'],
      panels: [table(IROWS, ICOLS, ikTable(ikCells[IK_TURN]).cells.map((row, R) => row.map((v, Cc) => (R === 2 && Cc === 3 ? '?' : v))), ikTable(ikCells[IK_TURN]).states, 'dp[i][c]')],
      task: { type: 'number', question: 'What is dp[2][3]?', options: [6, 10, 16, 22], answer: ikCells[IK_TURN].val, hint: 'Skip = 6 (above). Take = dp[1][1] + 10.' },
      solved: `max(6, 6 + 10) = ${ikCells[IK_TURN].val}: items (1, 6) and (2, 10) together.`,
      then: ikCells.slice(IK_TURN).map((r) => ({ say: 0, note: ikNote(r), panels: [ikTable(r)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: one array',
      lines: ['Row i only reads row i−1, at `c` and `c − w`.', 'So one array `dp` can be overwritten in place.'],
      panels: [arr(IK.dp[1], { label: 'dp = row 1; next item (2, 10)', pointers: [ptr(3, 'c')], highlights: { 3: 'active' } })],
      task: { type: 'cell', question: 'At c = 3, which slot does **take** read?', answer: 1, hints: { 3: 'That is dp[c], the skip value.', 2: 'c − w = 3 − 2 = 1.', 0: 'c − w = 3 − 2 = 1.' } },
      solved: 'dp[3 − 2] = dp[1]: always to the **left** of c.',
      then: IK1.recs.map((r) => ({ say: 1, note: `c = ${r.c}: max(${r.old}, dp[${r.c - 2}] + 10 = ${r.read + 10}) → ${r.val}. Same as row 2.`, panels: [slot(r.dp, r.c, 2, 'dp, item (2, 10)')] })),
    },
    {
      kind: 'watch',
      title: 'Left to right takes it twice',
      lines: ['One item (2, 10), C = 4, looping **left → right**.', 'Slot `c − w` may already hold the **new** value, with the item inside.'],
      frames: [
        { say: 0, note: 'All slots 0: no items yet.', panels: [arr([0, 0, 0, 0, 0], { label: 'dp, left → right' })] },
        ...ONE_F.recs.map((r) => ({ say: r.read > 0 ? 1 : 0, note: `c = ${r.c}: dp[${r.c - 2}] + 10 = ${r.read + 10} → ${r.val}.${r.read > 0 ? ' dp[2] was set this pass: item used twice.' : ''}`, panels: [slot(r.dp, r.c, 2, 'dp, left → right'), ...(r.read > 0 ? [vars({ 'dp[4]': r.val, 'real best': 10 })] : [])] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: right to left',
      lines: ['Same item (2, 10), C = 4, now **right → left**.'],
      panels: [slot([0, 0, 0, 0, 0], 4, 2, 'dp, right → left, c = 4')],
      task: {
        type: 'choose',
        question: 'c = 4 reads dp[2]. What does dp[2] hold right now?',
        options: [
          { text: '0, the old row: the item is not in it yet', why: '' },
          { text: '10, it already includes the item', why: 'Right → left reaches c = 2 only after c = 4 and c = 3.' },
          { text: '20', why: 'Nothing has been taken yet in this pass.' },
        ],
        answer: 0,
      },
      solved: 'Untouched slots still hold row i−1, exactly what the formula needs.',
      then: ONE_B.recs.map((r) => ({ say: 0, note: `c = ${r.c}: max(${r.old}, dp[${r.c - 2}] + 10) → ${r.val}.${r.c === 2 ? ' dp[4] stayed 10: the item once.' : ''}`, panels: [slot(r.dp, r.c, 2, 'dp, right → left')] })),
    },
  ],

  'optimized-knapsack': [
    {
      kind: 'watch',
      title: 'Partition = subset sum to half',
      lines: ['Two groups of equal sum ⇔ a subset with sum `total / 2`.', 'Boolean 0/1 knapsack: `dp[s] = dp[s] || dp[s − x]`, backwards.'],
      frames: [
        { say: 0, note: `nums = ${list(PN)}: total = 10, half = ${P_HALF}.`, panels: [arr(PN, { label: 'nums' }), vars({ total: 10, half: P_HALF })] },
        { say: 1, note: 'dp[0] = T: the empty subset reaches 0.', panels: [arr(PN, { label: 'nums' }), arr(TF([1, 0, 0, 0, 0, 0]), { label: 'dp[s]: sum s reachable?', highlights: { 0: 'done' } })] },
        ...PR.rows.map((row, k) => {
          const prev = k ? PR.rows[k - 1] : [true, false, false, false, false, false];
          return {
            say: 1,
            note: `After x = ${PN[k]}: ${row[5] && !prev[5] ? 'dp[5] = T → a subset sums to 5 ({2, 3}).' : `reachable sums ${row.map((b, s) => (b ? s : null)).filter((s) => s !== null).join(', ')}.`}`,
            panels: [arr(PN, { label: 'nums', highlights: hl(4, (j) => (j === k ? 'active' : j < k ? 'done' : '')) }), arr(TF(row), { label: 'dp[s]', highlights: hl(6, (s) => (row[s] && !prev[s] ? 'active' : '')) })],
          };
        }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an odd total',
      lines: ['If `total` is odd, the answer is `false` immediately.'],
      panels: [arr([2, 3, 4], { label: 'nums' }), vars({ total: 9 })],
      task: {
        type: 'choose',
        question: 'Can [2, 3, 4] be split into two equal-sum groups?',
        options: [
          { text: 'No, and we know it before any dp: 9 is odd', why: '' },
          { text: 'Run the dp with half = 4', why: 'Rounding down finds {4} and says true, but 4 ≠ 2 + 3.' },
          { text: 'Yes: {4} and {2, 3}', why: '4 and 5 are not equal.' },
        ],
        answer: 0,
      },
      solved: 'Equal halves need an even total; 9 / 2 is not a whole sum.',
    },
    {
      kind: 'watch',
      title: 'Target sum becomes subset count',
      lines: ['Plus group P, minus group N: `P − N = target`, `P + N = total`.', 'So `P = (total + target) / 2`: count subsets with sum P.', 'Counting: `dp[0] = 1`, `dp[s] += dp[s − x]`, still backwards.'],
      frames: [
        { say: 0, note: `nums = ${list(TSN)}, target = 2, total = 4.`, panels: [arr(TSN, { label: 'nums' }), vars({ total: 4, target: 2 })] },
        { say: 1, note: `2P = 4 + 2 → P = ${TS_P}.`, panels: [arr(TSN, { label: 'nums' }), vars({ total: 4, target: 2, P: TS_P })] },
        { say: 2, note: 'dp[0] = 1: one way to pick nothing.', panels: [arr(TSN, { label: 'nums' }), arr([1, 0, 0, 0], { label: 'ways dp[s]', highlights: { 0: 'done' } })] },
        ...TSR.recs.map((r) => ({ say: 2, note: `x = ${r.x}, s = ${r.c}: dp[${r.c}] += dp[${r.c - r.x}] → ${r.val}.`, panels: [arr(TSN, { label: 'nums', highlights: { [r.i]: 'active' } }), slot(r.dp, r.c, r.x, 'ways dp[s]', { cl: 's', rl: 's−x' })] })),
        { say: 1, note: `dp[3] = ${TSR.final[3]}: +1 +2 −1 and −1 +2 +1.`, panels: [arr(TSN, { label: 'nums' }), arr(TSR.final, { label: 'ways dp[s]', highlights: { 3: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: a zero',
      lines: ['Zeros need no special case.'],
      panels: [arr([0, 1], { label: 'nums, target = 1' }), vars({ total: 1, P: 1 }), arr([1, 0], { label: 'ways dp[s]' })],
      task: { type: 'number', question: 'How many sign choices reach target 1?', options: [1, 2, 3, 4], answer: ZR.final[1], hint: 'x = 0: each slot adds itself.' },
      solved: `${ZR.final[1]}: +0 +1 and −0 +1. A 0 doubles the count.`,
      then: ZR.recs.map((r) => ({ say: 0, note: `x = ${r.x}, s = ${r.c}: dp[${r.c}] += dp[${r.c - r.x}] → ${r.val}.${r.x === 0 && r.c === 0 ? ' Doubled.' : ''}`, panels: [slot(r.dp, r.c, r.x, `ways dp[s], x = ${r.x}`, { cl: 's', rl: 's−x' })] })),
    },
  ],

  'template-knapsack': [
    {
      kind: 'watch',
      title: 'The 2D template, line by line',
      lines: ['Row 0 is all 0: no items.', '`dp[i][c] = dp[i - 1][c]`: skip item i−1.', 'If `c >= w[i - 1]`: also try `dp[i - 1][c - w[i - 1]] + v[i - 1]`.'],
      frames: [
        { say: 0, note: `w = ${list(TW)}, v = ${list(TV)}, C = 3.`, panels: [table(['i=0', 'i=1', 'i=2'], ICOLS, TK.dp.map((row, R) => row.map((v) => (R === 0 ? v : '·'))), [['done', 'done', 'done', 'done']], 'dp[i][c]')] },
        ...TK.recs.filter((r) => r.i === 1).map((r) => ({ say: r.take === null ? 1 : 2, note: tkNote(r), panels: [tkTable(r)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which item is row 2?',
      lines: ['dp rows count items; arrays are 0-based.'],
      panels: [tkTable(TK.recs.find((r) => r.i === 1 && r.c === 3)), code('if (c >= w[i - 1]) …')],
      task: {
        type: 'choose',
        question: 'Row i = 2 decides which item?',
        options: [
          { text: 'w[1] = 1, v[1] = 2', why: '' },
          { text: 'w[2]', why: 'w has only indexes 0 and 1; row i uses w[i − 1].' },
          { text: 'w[0] = 2, v[0] = 3', why: 'That was row 1.' },
        ],
        answer: 0,
      },
      solved: 'Row i = "first i items", so its new item is index i − 1.',
      then: TK.recs.filter((r) => r.i === 2).map((r) => ({ say: 0, note: tkNote(r), panels: [tkTable(r)] })),
    },
    {
      kind: 'watch',
      title: 'canReach: one array',
      lines: ['`dp[0] = true`: the empty subset.', 'For each x, `s` runs from target **down** to x.', '`if (dp[s - x]) dp[s] = true`.'],
      frames: [
        { say: 0, note: `nums = ${list(CRN)}, target = 5.`, panels: [arr(TF([1, 0, 0, 0, 0, 0]), { label: 'dp', highlights: { 0: 'done' } })] },
        ...CR.recs.filter((r) => r.x === 2).map((r) => crFrame(r, r.read ? 2 : 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the order for x = 3',
      lines: ['The inner loop is backwards.'],
      panels: [arr(TF(CR.rows[0]), { label: 'dp after x = 2' }), code('for (let s = target; s >= x; s--)')],
      task: { type: 'order', question: 'Tap the s values in the order x = 3 visits them.', items: ['s = 5', 's = 4', 's = 3'], hint: 'Start at target; stop at s = x.' },
      solved: '5, 4, 3: every read `dp[s − 3]` still holds the old value.',
      then: [...CR.recs.filter((r) => r.x === 3).map((r) => crFrame(r, 0)), { say: 0, note: 'dp[5] = true: 2 + 3 = 5.', panels: [arr(TF(CR.final), { label: 'dp', highlights: { 5: 'done' } })] }],
    },
  ],

  'implementation-knapsack': [
    {
      kind: 'watch',
      title: 'canPartition with an early exit',
      lines: ['Odd total → `false`.', '`Uint8Array(half + 1)` holds 0/1 flags; `dp[0] = 1`.', '`dp[s] |= dp[s - x]`, backwards.', 'After each item: if `dp[half]`, return `true`.'],
      frames: [
        { say: 0, note: `nums = ${list(CP)}: total 12 is even, half = ${CP_HALF}.`, panels: [arr(CP, { label: 'nums' }), vars({ total: 12, half: CP_HALF })] },
        { say: 1, note: 'Zero-initialised; dp[0] = 1.', panels: [arr(CP, { label: 'nums' }), arr([1, 0, 0, 0, 0, 0, 0], { label: 'dp (Uint8Array)', highlights: { 0: 'done' } })] },
        { say: 2, note: `After x = 1: ${list(cpRows[0])}. dp[6] = 0, keep going.`, panels: [arr(CP, { label: 'nums', highlights: { 0: 'active' } }), arr(cpRows[0], { label: 'dp', highlights: { 1: 'active', 6: 'bad' } })] },
        { say: 2, note: `After x = 5: ${list(cpRows[1])}. dp[6] = dp[1] = 1.`, panels: [arr(CP, { label: 'nums', highlights: { 0: 'done', 1: 'active' } }), arr(cpRows[1], { label: 'dp', highlights: { 5: 'active', 6: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: dp[half] is 1',
      lines: ['The check runs after every item.'],
      panels: [arr(CP, { label: 'nums', highlights: { 0: 'done', 1: 'done', 2: 'muted', 3: 'muted' } }), arr(cpRows[1], { label: 'dp', highlights: { 6: 'done' } })],
      task: {
        type: 'choose',
        question: 'dp[6] just became 1 after the 2nd item. What happens?',
        options: [
          { text: 'Return true now: the last two items are never read', why: '' },
          { text: 'Keep looping; only the end is final', why: '`|=` only turns flags on; later items cannot make dp[6] 0 again.' },
          { text: 'Reset dp for the next item', why: 'dp is one rolling array shared by all items.' },
        ],
        answer: 0,
      },
      solved: '{1, 5} sums to 6, so the other half is {5, 1}. The early exit is free.',
    },
    {
      kind: 'watch',
      title: 'Pseudo-polynomial',
      lines: ['O(n · C): C is a **number**, not an input length.', 'Doubling the digits of C squares C.', 'That is why knapsack works only when C is small.'],
      frames: [
        { say: 0, note: 'The inner loop runs about C times per item.', panels: [vars({ n: 4, C: 6, steps: '≈ 4 · 6' })] },
        { say: 1, note: 'C with 2 digits: about 10².', panels: [vars({ digits: 2, C: '≈ 10²' })] },
        { say: 1, note: 'Twice the digits: about 10⁴ = (10²)².', panels: [vars({ digits: 4, C: '≈ 10⁴' })] },
        { say: 2, note: 'Subset sum is NP-complete in general; a small C is what makes the dp fast.', panels: [vars({ digits: 8, C: '≈ 10⁸' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: half = 10⁹',
      lines: ['The array has `half + 1` slots.'],
      panels: [code('new Uint8Array(half + 1)'), vars({ n: 4, half: '10⁹' })],
      task: {
        type: 'choose',
        question: 'Four numbers, but half = 10⁹. Is canPartition a good fit?',
        options: [
          { text: 'No: about 10⁹ slots and 10⁹ steps per item', why: '' },
          { text: 'Yes: O(n · C) is polynomial', why: 'C counts as a number: 10 digits of input, 10⁹ work. That is pseudo-polynomial.' },
          { text: 'Yes: Uint8Array keeps it small', why: 'One byte per slot is still about 1 GB.' },
        ],
        answer: 0,
      },
      solved: 'The cost follows the value of C, not how many digits it has.',
    },
  ],

  'dry-run-knapsack': [
    {
      kind: 'watch',
      title: 'Item (1, 15), backwards',
      lines: ['weights [1, 3, 4], values [15, 20, 30], C = 4.', 'Item (1, 15): c from 4 down to 1.', 'Item (3, 20): c = 4, then c = 3.'],
      frames: [
        { say: 0, note: 'Start: [0, 0, 0, 0, 0].', panels: [arr([0, 0, 0, 0, 0], { label: 'dp[0..4]' })] },
        ...DK.recs.slice(0, DK_TURN).map((r) => dkFrame(r, 1, r.c === 1 ? ' Every c ≥ 1 took it once.' : '')),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: item (3, 20) at c = 4',
      lines: ['Take reads dp[4 − 3].'],
      panels: [slot(DK.rows[0], 4, 3, 'dp after (1, 15)')],
      task: { type: 'number', question: 'What is dp[4] after this update?', options: [15, 20, 35, 50], answer: DK.recs[DK_TURN].val, hint: 'max(dp[4], dp[1] + 20).' },
      solved: `max(15, 15 + 20) = ${DK.recs[DK_TURN].val}: weights 1 and 3 together.`,
      then: DK.recs.slice(DK_TURN, DK_TURN + 2).map((r) => dkFrame(r, 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: item (4, 30)',
      lines: ['Only c = 4 fits weight 4.'],
      panels: [slot(DK.rows[1], 4, 4, 'dp after (3, 20)', { rl: 'c−w' })],
      task: {
        type: 'choose',
        question: 'c = 4: max(35, dp[0] + 30). What does dp[4] become?',
        options: [
          { text: 'It stays 35', why: '' },
          { text: '30: the new item replaces', why: '30 < 35, and max keeps the larger.' },
          { text: '65', why: 'Weight 4 cannot go on top of weights 1 + 3 in capacity 4; take reads dp[0] = 0.' },
        ],
        answer: 0,
      },
      solved: `Answer ${DK.final[4]} = weights 1 + 3. Final dp: ${list(DK.final)}.`,
      then: [{ say: 0, note: `Final ${list(DK.final)}: dp[4] = ${DK.final[4]}.`, panels: [arr(DK.final, { label: 'dp after (4, 30)', highlights: { 4: 'done' } })] }],
    },
    {
      kind: 'watch',
      title: 'The forward loop, for contrast',
      lines: ['Item (1, 15), but c from 1 **up** to 4.', 'Each step reads a slot set in this same pass.'],
      frames: DKF.recs.map((r) => ({ say: r.c === 1 ? 0 : 1, note: `c = ${r.c}: dp[${r.c - 1}] + 15 = ${r.val}.${r.c === 4 ? ' Item 1 taken four times.' : ''}`, panels: [slot(r.dp, r.c, 1, 'dp, forwards', { done: (k) => k > 0 && k < r.c - 1 })] })),
    },
  ],

  'intuition-unbounded': [
    {
      kind: 'watch',
      title: 'Take keeps you on the same row',
      lines: ['Counting: `dp[i][c] = dp[i−1][c] + dp[i][c − coin]`.', 'The second term is row **i**: after taking the coin you may take it again.'],
      frames: [
        { say: 0, note: 'coins [1, 2]. Row "none": only amount 0, 1 way.', panels: [table(U2ROWS, ICOLS, [[1, 0, 0, 0], ['·', '·', '·', '·'], ['·', '·', '·', '·']], [['done', '', '', '']], 'ways dp[i][c]')] },
        ...u2recs.slice(0, U2_TURN).map((r) => ({ say: r.same === null ? 0 : 1, note: u2Note(r), panels: [u2Table(r)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the second term',
      lines: ['dp[2][3] = dp[1][3] + ???'],
      panels: [u2Table(u2recs[U2_TURN], true)],
      task: {
        type: 'choose',
        question: 'For coin 2 at amount 3, which cell is the second term?',
        options: [
          { text: 'dp[2][1]: same row, 3 − 2', why: '' },
          { text: 'dp[1][1]: the row above', why: 'The row above has not used coin 2: that allows coin 2 at most once.' },
          { text: 'dp[2][2]', why: 'c − coin = 3 − 2 = 1, not 2.' },
        ],
        answer: 0,
      },
      solved: `1 + 1 = ${u2recs[U2_TURN].val}: {1, 1, 1} and {1, 2}.`,
      then: [{ say: 0, note: u2Note(u2recs[U2_TURN]), panels: [u2Table(u2recs[U2_TURN])] }],
    },
    {
      kind: 'watch',
      title: '1D: forwards, coins outer',
      lines: ['In 1D the **forward** loop reads `a − coin` after it already used this coin.', 'Coins outer: some 1s, then some 2s. A fixed order.'],
      frames: [
        { say: 0, note: 'amount 5. dp[0] = 1.', panels: [arr([1, 0, 0, 0, 0, 0], { label: 'dp', highlights: { 0: 'done' } })] },
        { say: 1, note: `Coin 1 done: ${list(UF.rows[0])}. Only 1s so far.`, panels: [arr(UF.rows[0], { label: 'dp after coin 1' })] },
        ...UF.recs.filter((r) => r.x === 2).map((r) => ({ say: r.c >= 4 ? 0 : 1, note: `a = ${r.c}: dp[${r.c}] += dp[${r.c - 2}] (${r.read}) → ${r.val}.${r.c === 4 ? ' dp[2] already counts {2}: so {2, 2}.' : ''}`, panels: [slot(r.dp, r.c, 2, 'dp, coin 2', { cl: 'a', rl: 'a−2' })] })),
        { say: 1, note: `dp[5] = ${UF.final[5]}: {1,1,1,1,1}, {1,1,1,2}, {1,2,2}.`, panels: [arr(UF.final, { label: 'coins outer', highlights: { 5: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: swap the loops',
      lines: ['Amount outer asks "what is the **last** coin?" at every amount.'],
      panels: [vars({ multiset: '{1, 2, 2}', sum: 5 }), arr(UF.final, { label: 'coins outer counts it once', highlights: { 5: 'done' } })],
      task: { type: 'number', question: 'With amount outer, how many times is {1, 2, 2} counted?', options: [1, 2, 3, 6], answer: 3, hint: 'Where can the single 1 go?' },
      solved: '1+2+2, 2+1+2, 2+2+1: amount outer counts **permutations**.',
      then: [{ say: 0, note: `Amount outer gives dp[5] = ${UP.final[5]}, coins outer ${UF.final[5]}.`, panels: [arr(['1+2+2', '2+1+2', '2+2+1'], { label: 'amount outer counts', highlights: hl(3, () => 'visited') }), vars({ 'coins outer': UF.final[5], 'amount outer': UP.final[5] })] }],
    },
  ],

  'optimized-unbounded': [
    {
      kind: 'watch',
      title: 'Four loop shapes',
      lines: ['0/1: items outer, capacity **backwards**.', 'Unbounded combinations: items outer, **forwards**.', 'Unbounded permutations: amount outer, items inner.', 'Min / max: either order, forwards.'],
      frames: [0, 1, 2, 3].map((row) => ({ say: row, note: ['Backwards: each item at most once.', 'Forwards: reuse allowed; items outer: each multiset once.', 'Amount outer: orders are counted apart.', 'A multiset has the same cost in any order.'][row], panels: [sumTable(row)] })),
    },
    {
      kind: 'watch',
      title: 'Inner direction: once or unlimited',
      lines: ['The inner direction decides if slot `a − coin` already includes this coin.', 'Forwards → yes, reuse. Backwards → no, at most once.'],
      frames: [
        ...C2F.recs.map((r) => ({ say: 1, note: `Forwards, a = ${r.c}: dp[${r.c}] += dp[${r.c - 2}] → ${r.val}.${r.c === 4 ? ' {2, 2}: coin 2 twice.' : ''}`, panels: [slot(r.dp, r.c, 2, 'coin 2, forwards', { cl: 'a', rl: 'a−2' })] })),
        ...C2B.recs.map((r) => ({ say: 1, note: `Backwards, a = ${r.c}: dp[${r.c}] += dp[${r.c - 2}] → ${r.val}.${r.c === 4 ? ' dp[2] is still 0: no reuse.' : ''}`, panels: [slot(r.dp, r.c, 2, 'coin 2, backwards', { cl: 'a', rl: 'a−2' })] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why min does not care',
      lines: ['For min / max the loop order does not matter.'],
      panels: [sumTable(3)],
      task: {
        type: 'choose',
        question: 'Why can min coin change use either loop order?',
        options: [
          { text: 'A multiset costs the same in any order; only counting double counts', why: '' },
          { text: 'Min loops backwards, so reuse is off', why: 'Min still loops forwards: coins are reusable.' },
          { text: 'Coins never repeat in a min answer', why: '{2, 2} can be a min answer; the point is that its order does not change its cost.' },
        ],
        answer: 0,
      },
      solved: 'Counting adds every decomposition; min just keeps the best one.',
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the loops',
      lines: ['Outer loop decides combinations vs permutations.'],
      panels: [vars({ reuse: 'yes', '1+2 vs 2+1': 'differ' })],
      task: {
        type: 'choose',
        question: 'Count ways where 1+2 and 2+1 are different. Which loops?',
        options: [
          { text: 'Amount outer, items inner', why: '' },
          { text: 'Items outer, amount forwards', why: 'That builds each multiset once: 1+2 and 2+1 count as one.' },
          { text: 'Items outer, amount backwards', why: 'That is 0/1: each item at most once.' },
        ],
        answer: 0,
      },
      solved: 'Amount outer chooses the **last** item each time, so orders are told apart.',
    },
  ],

  'template-unbounded': [
    {
      kind: 'watch',
      title: 'combinations([1, 3], 4)',
      lines: ['`combinations`: coins outer, `a` from c up to amount.', '`dp[a] += dp[a - c]`.'],
      frames: [
        { say: 0, note: 'dp[0] = 1.', panels: [arr([1, 0, 0, 0, 0], { label: 'combinations dp', highlights: { 0: 'done' } })] },
        { say: 0, note: `Coin 1 done: ${list(TUC.rows[0])}.`, panels: [arr(TUC.rows[0], { label: 'after coin 1' })] },
        ...TUC.recs.filter((r) => r.x === 3).map((r) => ({ say: 1, note: `Coin 3, a = ${r.c}: dp[${r.c}] += dp[${r.c - 3}] → ${r.val}.`, panels: [slot(r.dp, r.c, 3, 'combinations dp', { cl: 'a', rl: 'a−c' })] })),
        { say: 1, note: `dp[4] = ${TUC.final[4]}: {1,1,1,1} and {1,3}.`, panels: [arr(TUC.final, { label: 'combinations dp', highlights: { 4: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'permutations([1, 3], 4)',
      lines: ['`permutations`: `a` outer, every x inner.', '`if (x <= a) dp[a] += dp[a - x]`.'],
      frames: [{ say: 0, note: 'dp[0] = 1.', panels: [arr([1, 0, 0, 0, 0], { label: 'permutations dp', highlights: { 0: 'done' } })] }, ...TUP.recs.slice(0, TUP_TURN).map((r) => permFrame(r, 1))],
    },
    {
      kind: 'turn',
      title: 'Your turn: a = 4, x = 3',
      lines: ['dp[4] already got dp[3] from x = 1.'],
      panels: [arr(TUP.recs[TUP_TURN - 1].dp, { label: 'permutations dp', pointers: [ptr(4, 'a')], highlights: { 4: 'active' } }), vars({ a: 4, x: 3 })],
      task: { type: 'cell', question: 'Which slot does x = 3 add into dp[4]?', answer: 1, hints: { 3: 'That is a − 1, already added for x = 1.', 4: 'That is dp[a] itself.', 0: 'a − x = 4 − 3 = 1.' } },
      solved: `dp[4] = 2 + dp[1] = ${TUP.final[4]}: 1+1+1+1, 1+3, 3+1.`,
      then: [permFrame(TUP.recs[TUP_TURN], 0), { say: 0, note: `Permutations ${TUP.final[4]} vs combinations ${TUC.final[4]}: 1+3 and 3+1 both count.`, panels: [arr(TUP.final, { label: 'permutations', highlights: { 4: 'done' } }), arr(TUC.final, { label: 'combinations', highlights: { 4: 'done' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the `x <= a` guard',
      lines: ['Only `permutations` has the `if (x <= a)` check.'],
      panels: [code('for (let a = c; a <= amount; a++)'), code('for (const x of nums) if (x <= a)')],
      task: {
        type: 'choose',
        question: 'Why does `combinations` not need the guard?',
        options: [
          { text: 'Its `a` starts at c, so `a - c` is never negative', why: '' },
          { text: 'It does need it; the template forgot it', why: 'a runs from c upward, so a − c ≥ 0 always.' },
          { text: 'The guard is what prevents double counting', why: 'Loop order decides combinations vs permutations; the guard only protects the index.' },
        ],
        answer: 0,
      },
      solved: '`permutations` tries every x at every a, even x > a; the guard skips those.',
    },
  ],

  'implementation-unbounded': [
    {
      kind: 'watch',
      title: 'unboundedMax, forwards',
      lines: ['Same `max` as 0/1, but `c` runs **forwards**.', 'Slot `c − w` may already include item i: a second copy.'],
      frames: [
        { say: 0, note: 'Items (2, 3) and (3, 5), C = 7.', panels: [arr(new Array(8).fill(0), { label: 'dp' })] },
        ...UM.recs.slice(0, UM_TURN).map((r) => umFrame(r, r.c - r.x >= r.x ? 1 : 0)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: c = 6',
      lines: ['Item (3, 5); dp[3] was set this pass.'],
      panels: [slot(UM.recs[UM_TURN - 1].dp, 6, 3, 'dp, item (3, 5)')],
      task: { type: 'number', question: 'What is dp[6] after this update?', options: [8, 9, 10, 11], answer: UM.recs[UM_TURN].val, hint: 'max(dp[6] = 9, dp[3] + 5).' },
      solved: `dp[3] = 5 already holds one weight-3 piece: 5 + 5 = ${UM.recs[UM_TURN].val}, two copies.`,
      then: UM.recs.slice(UM_TURN).map((r) => umFrame(r, 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: read the answer',
      lines: ['dp[7] = 11.'],
      panels: [arr(UM.final, { label: 'dp, items (2, 3) and (3, 5)', highlights: { 7: 'done' } })],
      task: {
        type: 'choose',
        question: 'Which pieces give value 11 in capacity 7?',
        options: [
          { text: '2 + 2 + 3', why: '' },
          { text: '3 + 3', why: 'Value 10; it fits but 11 is more.' },
          { text: '2 + 2 + 2', why: 'Value 9.' },
        ],
        answer: 0,
      },
      solved: '3 + 3 + 5 = 11: the weight-2 item used twice, which the forward loop allows.',
    },
  ],

  'dry-run-unbounded': [
    {
      kind: 'watch',
      title: 'Coins 1, then 2',
      lines: ['Start: only 0 is reachable (empty choice).', 'Coin 1: one way each, all 1s.', 'Coin 2: `dp[a] += dp[a − 2]`, a from 2 up.'],
      frames: [
        { say: 0, note: 'coins [1, 2, 5], amount 5. [1, 0, 0, 0, 0, 0].', panels: [arr([1, 0, 0, 0, 0, 0], { label: 'dp[0..5]', highlights: { 0: 'done' } })] },
        { say: 1, note: `After coin 1: ${list(DU.rows[0])}.`, panels: [arr(DU.rows[0], { label: 'dp after coin 1' })] },
        ...DU.recs.filter((r) => r.x === 2 && r.c < 5).map((r) => ({ ...duFrame(r, 2), note: duFrame(r, 2).note + (r.c === 4 ? ' {1111, 112, 22}.' : '') })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: coin 2, a = 5',
      lines: ['dp[5] still holds the 1s-only way.'],
      panels: [slot(DU.recs[DU_TURN - 1].dp, 5, 2, 'dp, coin 2', { cl: 'a', rl: 'a−2' })],
      task: { type: 'number', question: 'What is dp[5] after coin 2?', options: [2, 3, 4, 5], answer: DU.recs[DU_TURN].val, hint: '1 + dp[3].' },
      solved: `1 + 2 = ${DU.recs[DU_TURN].val}. Row: ${list(DU.rows[1])}.`,
      then: [duFrame(DU.recs[DU_TURN], 0)],
    },
    {
      kind: 'turn',
      title: 'Your turn: coin 5',
      lines: ['Coin 5 only touches a = 5.'],
      panels: [arr(DU.rows[1], { label: 'dp after coin 2', pointers: [ptr(5, 'a')], highlights: { 5: 'active' } })],
      task: { type: 'cell', question: 'Which slot does a = 5 add for coin 5?', answer: 0, hints: { 5: 'That is dp[5] itself.', 3: 'a − 5 = 0.' } },
      solved: `dp[5] = 3 + dp[0] = ${DU.final[5]}.`,
      then: [{ say: 0, note: `Answer ${DU.final[5]}: 5, 2+2+1, 2+1+1+1, 1+1+1+1+1.`, panels: [arr(DU.final, { label: 'dp after coin 5', highlights: { 5: 'done', 0: 'window' } })] }],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: 'Shared rows',
      lines: ['`new Array(m).fill(new Array(n))`: every row is the **same** object.', '`Array.from({ length: m }, () => …)` makes a new row each time.'],
      frames: [
        { say: 0, note: 'fill(…) with one row; then dp[0][0] = 1.', panels: [code('dp[0][0] = 1'), table(['0', '1', '2'], ['0', '1', '2'], shared.map((r) => r.slice()), shared.map(() => ['bad', '', '']), 'fill(row)')] },
        { say: 1, note: 'Array.from: only row 0 changes.', panels: [code('dp[0][0] = 1'), table(['0', '1', '2'], ['0', '1', '2'], fresh, [['active', '', '']], 'Array.from')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no base case',
      lines: ['**Missing base**: `dp[0] = 1` for counting.'],
      panels: [arr([0, 0, 0, 0], { label: 'dp, coins [1, 2], amount 3' }), code('dp[0] = 1;  // forgotten')],
      task: { type: 'number', question: 'What does the coin loop return now?', options: [0, 1, 2, 3], answer: NO_BASE.final[3], hint: 'Every update adds dp[a − coin]. Where would a 1 come from?' },
      solved: 'Only sums of zeros: 0. The "choose nothing" way is the seed of every count.',
      then: [{ say: 0, note: `After both coins: ${list(NO_BASE.final)}.`, panels: [arr(NO_BASE.final, { label: 'dp, no base', highlights: hl(4, () => 'bad') })] }],
    },
    {
      kind: 'watch',
      title: 'Wrong fill order',
      lines: ['Reading a cell not computed yet: it silently holds 0.'],
      frames: [
        { say: 0, note: 'Rows filled i = 2 first: row 1 is still all 0, so dp[2][3] = 10.', panels: [table(['none', 'w1 v6', 'w2 v10'], ICOLS, WO[0], [['', '', '', ''], ['bad', 'bad', 'bad', 'bad'], ['', '', '', 'active']], 'i from 2 down')] },
        { say: 0, note: `Row 1 arrives too late. Rows 1 then 2 give dp[2][3] = ${IK.dp[2][3]}.`, panels: [table(['none', 'w1 v6', 'w2 v10'], ICOLS, WO[1], [['', '', '', ''], ['', '', '', ''], ['', '', '', 'bad']], 'i from 2 down'), vars({ got: WO[1][2][3], right: IK.dp[2][3] })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: target sum edge case',
      lines: ['**Target sum**: odd `total + target`, or `|target| > total` → 0 ways.'],
      panels: [arr([1, 1], { label: 'nums, target = −4' }), vars({ total: 2, 'total + target': -2 })],
      task: {
        type: 'choose',
        question: 'Without the guard, what goes wrong?',
        options: [
          { text: 'P = −1: a negative array index', why: '' },
          { text: 'Nothing: −2 is even', why: 'Even is not enough; |−4| > 2 still means 0 ways.' },
          { text: 'P = 3, and it counts 0 ways', why: '(2 + (−4)) / 2 = −1, not 3.' },
        ],
        answer: 0,
      },
      solved: 'Check `|target| > total` first and return 0.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'State first, then the 3×3 corner',
      lines: ['Say the state: "dp[i][c] = best value with the first i items and capacity c."', 'Draw the 3×3 corner and fill it by hand.'],
      frames: [
        { say: 0, note: 'Items (1, 6), (2, 10). Row "none" is 0.', panels: [ckTable({ i: 1, c: -1, snap: CK.dp })] },
        ...CK.recs.map((r) => ({ say: 1, note: `dp[${r.i}][${r.c}] = ${r.val}${r.take === null ? ' (skip only)' : ` = max(${r.skip}, ${r.take})`}.`, panels: [ckTable(r)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: recognise it',
      lines: ['Knapsack recognition: how often may each element be used?', 'If unlimited, also ask whether order matters.'],
      panels: [vars({ use: 'once', goal: 'target sum' })],
      task: {
        type: 'choose',
        question: 'Each number at most once, reach a target. Which loop shape?',
        options: [
          { text: '0/1: items outer, capacity backwards', why: '' },
          { text: 'Items outer, capacity forwards', why: 'Forwards lets a number be reused.' },
          { text: 'Amount outer, items inner', why: 'That counts orders of reusable items.' },
        ],
        answer: 0,
      },
      solved: 'Once + target sum is 0/1 knapsack.',
    },
    {
      kind: 'turn',
      title: 'Your turn: explain the direction',
      lines: ['Mention the space optimisation and **why** its loop goes the way it does.'],
      panels: [slot([0, 6, 6, 6], 3, 2, 'dp, item (2, 10)')],
      task: {
        type: 'choose',
        question: 'Interviewer: "Why backwards?" Best answer?',
        options: [
          { text: 'dp[c − w] must still be the old row, so each item is used once', why: '' },
          { text: 'It is faster', why: 'Both directions do O(n · C) work.' },
          { text: 'It avoids a negative index', why: 'Both directions stop at c = w.' },
        ],
        answer: 0,
      },
      solved: '"Backwards so each item is used once" is the signal they want.',
    },
  ],
};

export default STEPS;
