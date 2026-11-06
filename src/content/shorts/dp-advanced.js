// Shorts for Advanced DP (M9). Format: src/content/shortSchema.js. Facts come only from topics/dp-advanced/topic.js.
// Every tails array, table cell, state value, returned pair, mask cost and memo entry below comes from running the
// pattern's template on the "e.g." input next to it, and each result is checked against a brute force at load.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells: cells.map((r) => r.map(String)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const show = (xs) => `[${xs.join(', ')}]`;
const num = (v) => (v === -Infinity ? '−∞' : v === Infinity ? '∞' : v < 0 ? `−${-v}` : String(v));
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/dp-advanced.js: ${msg}`);
};
const subsets = (n) => Array.from({ length: 1 << n }, (_, m) => Array.from({ length: n }, (_, i) => i).filter((i) => m & (1 << i)));
const perms = (xs) => (xs.length ? xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])) : [[]]);

// ---------- LIS: e.g. nums = [6, 2, 9, 4, 5, 1, 7] ----------
const LN = [6, 2, 9, 4, 5, 1, 7];
const lowerBound = (t, x) => {
  let lo = 0,
    hi = t.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
const upperBound = (t, x) => {
  let lo = 0,
    hi = t.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
function lisRun(nums) {
  const tails = [];
  return nums.map((x) => {
    const k = lowerBound(tails, x);
    const old = tails[k];
    tails[k] = x;
    return { x, k, old, tails: [...tails] };
  });
}
const lisBrute = (nums) => Math.max(...subsets(nums.length).filter((s) => s.every((i, j) => j === 0 || nums[s[j - 1]] < nums[i])).map((s) => s.length));
const LR = lisRun(LN);
const LT = LR.at(-1).tails; // [1, 4, 5, 7]
const LDP = LN.map(() => 1);
LN.forEach((x, i) => LN.slice(0, i).forEach((y, j) => y < x && (LDP[i] = Math.max(LDP[i], LDP[j] + 1))));
check(LT.length === lisBrute(LN) && Math.max(...LDP) === LT.length && LT.length === 4, 'LIS length');
const LI = LN.length - 1; // the 7
const LJBEST = LN.findIndex((y, j) => j < LI && y < LN[LI] && LDP[j] === LDP[LI] - 1);
const LX = 5; // the turn: an equal value arrives
const LLB = lowerBound(LT, LX);
const LUB = upperBound(LT, LX);
check(LLB === 2 && LUB === 3 && lisBrute([...LN, LX]) === LT.length, 'LIS turn');
const lisFrame = (r, i) => ({
  say: r.old === undefined ? 1 : 2,
  note:
    r.old === undefined
      ? `x = ${r.x}: no tail >= ${r.x} → push. tails = ${show(r.tails)}: a length-${r.k + 1} run can end in ${r.x}.`
      : `x = ${r.x}: first tail >= ${r.x} is ${r.old} at k = ${r.k} → replace. Length ${r.k + 1} now ends in ${r.x}, not ${r.old}.`,
  panels: [
    arr(LN, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(LN.length, (k) => (k === i ? 'active' : k < i ? 'visited' : '')) }),
    arr(r.tails, { label: 'tails', highlights: { [r.k]: r.old === undefined ? 'done' : 'active' } }),
    vars({ x: r.x, k: r.k, 'tails.length': r.tails.length }),
  ],
});

// ---------- palindromic subsequence: e.g. s = "abcab" ----------
const PS = 'abcab';
const PN = PS.length;
const PDP = Array.from({ length: PN }, () => new Array(PN).fill(0));
const PROWS = [];
for (let i = PN - 1; i >= 0; i--) {
  PDP[i][i] = 1;
  const cells = [];
  for (let j = i + 1; j < PN; j++) {
    const match = PS[i] === PS[j];
    PDP[i][j] = match ? PDP[i + 1][j - 1] + 2 : Math.max(PDP[i + 1][j], PDP[i][j - 1]);
    cells.push({ j, match, v: PDP[i][j], inner: match ? PDP[i + 1][j - 1] : null, down: match ? null : PDP[i + 1][j], left: match ? null : PDP[i][j - 1] });
  }
  PROWS.push({ i, cells, snap: PDP.map((r) => [...r]) });
}
const PANS = PDP[0][PN - 1];
const isPal = (t) => t === [...t].reverse().join('');
check(PANS === Math.max(...subsets(PN).map((s) => s.map((i) => PS[i]).join('')).filter(isPal).map((t) => t.length)) && PANS === 3, 'LPS');
// rows filled so far (i >= from) show their values; the rest is blank
const pTable = (snap, from, st = {}) =>
  table(
    [...PS].map((c, i) => `i=${i} ${c}`),
    [...PS].map((c, j) => `j=${j} ${c}`),
    snap.map((row, i) => row.map((v, j) => (j < i || i < from ? '' : v))),
    Array.from({ length: PN }, (_, i) => Array.from({ length: PN }, (_, j) => st[`${i},${j}`] || (j >= i && i >= from ? 'done' : ''))),
    'dp[i][j] = longest palindromic subsequence of s[i..j]',
  );
const pCell = (i, c) => (c.match ? `j=${c.j} ${PS[i]}=${PS[c.j]} → ${c.inner} + 2 = ${c.v}` : `j=${c.j} ${PS[i]}≠${PS[c.j]} → max(${c.down}, ${c.left}) = ${c.v}`);
const pFrame = (r) => ({
  say: r.cells.some((c) => c.match) ? 0 : 1,
  note: r.cells.length ? `Row ${r.i}: ${r.cells.map((c) => pCell(r.i, c)).join('; ')}.` : `Row ${r.i}: dp[${r.i}][${r.i}] = 1, one letter is a palindrome.`,
  panels: [pTable(r.snap, r.i, Object.fromEntries([[`${r.i},${r.i}`, 'active'], ...r.cells.map((c) => [`${r.i},${c.j}`, 'active'])]))],
});
const PROW1 = PROWS.find((r) => r.i === 1);
const P14 = PROW1.cells.find((c) => c.j === 4);
check(P14.match && P14.v === 3, 'dp[1][4]');

// ---------- state machine with cooldown: e.g. prices = [2, 4, 1, 5] ----------
const SP = [2, 4, 1, 5];
function stockRun(prices) {
  let hold = -Infinity,
    sold = 0,
    rest = 0;
  const out = [{ hold, sold, rest }];
  for (const p of prices) {
    const prevHold = hold,
      prevSold = sold,
      prevRest = rest;
    hold = Math.max(prevHold, prevRest - p);
    sold = prevHold + p;
    rest = Math.max(prevRest, prevSold);
    out.push({ p, prevHold, prevSold, prevRest, hold, sold, rest });
  }
  return { out, best: Math.max(sold, rest) };
}
// brute force: every action sequence (buy / sell / wait) that respects the cooldown
function stockBrute(prices, d = 0, holding = false, cool = false, cash = 0) {
  if (d === prices.length) return cash;
  let best = stockBrute(prices, d + 1, holding, false, cash);
  if (holding) best = Math.max(best, stockBrute(prices, d + 1, false, true, cash + prices[d]));
  else if (!cool) best = Math.max(best, stockBrute(prices, d + 1, true, false, cash - prices[d]));
  return best;
}
const SR = stockRun(SP);
const GREEDY = SP.slice(1).reduce((s, p, i) => s + Math.max(0, p - SP[i]), 0);
check(SR.best === stockBrute(SP) && SR.best === 4 && GREEDY === 6, 'stock');
const SX = 0; // the turn: an e.g. day 4 at price 0
const SR2 = stockRun([...SP, SX]);
const SD4 = SR2.out.at(-1);
check(SD4.hold === 2 && SD4.prevSold - SX === 4, 'stock turn');
const sTable = (out, upto, cur, extra) => {
  const cols = out.map((_, d) => (d === 0 ? 'start' : `d${d - 1} p${SP[d - 1] ?? SX}`));
  const cell = (d, k) => (d <= upto ? num(out[d][k]) : '');
  const keys = ['hold', 'sold', 'rest'];
  return table(
    keys,
    cols,
    keys.map((k) => out.map((_, d) => (extra && d === out.length - 1 ? (k === 'hold' ? '?' : '') : cell(d, k)))),
    keys.map(() => out.map((_, d) => (d === cur ? 'active' : d <= upto ? 'done' : ''))),
    'state at the end of each day',
  );
};
const sFrame = (d) => {
  const o = SR.out[d];
  return {
    say: 3,
    note: `Day ${d - 1}, price ${o.p}: hold = max(${num(o.prevHold)}, ${num(o.prevRest)} − ${o.p}) = ${num(o.hold)}; sold = ${num(o.sold)}; rest = max(${num(o.prevRest)}, ${num(o.prevSold)}) = ${num(o.rest)}.`,
    panels: [arr(SP, { label: 'prices', pointers: [ptr(d - 1, `d${d - 1}`)] }), sTable(SR.out, d, d)],
  };
};
const SNODES = {
  kind: 'nodes',
  directed: true,
  freeLayout: true,
  label: 'the three states',
  nodes: [
    { id: 0, label: 'rest', x: 0, y: 0 },
    { id: 1, label: 'hold', x: 3, y: 0 },
    { id: 2, label: 'sold', x: 1.5, y: 1.6 },
  ],
  edges: [
    { from: 0, to: 1, label: 'buy −p' },
    { from: 1, to: 1, label: 'keep' },
    { from: 1, to: 2, label: 'sell +p' },
    { from: 2, to: 0, label: 'cool' },
    { from: 0, to: 0, label: 'idle' },
  ],
};

// ---------- tree DP: e.g. tree [5, 4, 4, 1, null, null, 1] ----------
// id → { val, left, right, x (inorder), y (depth) }
const tree = (spec) => spec.map(([val, left, right, x, y], id) => ({ id, val, left, right, x, y }));
const TR = tree([
  [5, 1, 2, 2, 0],
  [4, 3, null, 1, 1],
  [4, null, 4, 3, 1],
  [1, null, null, 0, 2],
  [1, null, null, 4, 2],
]);
function robRun(ns) {
  const recs = [];
  const dfs = (id) => {
    if (id === null) return [0, 0];
    const [lr, ls] = dfs(ns[id].left);
    const [rr, rs] = dfs(ns[id].right);
    const pair = [ns[id].val + ls + rs, Math.max(lr, ls) + Math.max(rr, rs)];
    recs.push({ id, l: [lr, ls], r: [rr, rs], pair });
    return pair;
  };
  const root = dfs(0);
  return { recs, root, best: Math.max(...root) };
}
const robBrute = (ns) =>
  Math.max(
    ...subsets(ns.length)
      .filter((s) => s.every((i) => ![ns[i].left, ns[i].right].some((c) => s.includes(c))))
      .map((s) => s.reduce((a, i) => a + ns[i].val, 0)),
  );
const RR = robRun(TR);
check(RR.best === robBrute(TR) && RR.best === 8 && RR.root[0] === 7, 'robber');
const tDraw = (ns, o = {}) => ({
  kind: 'nodes',
  ...(o.label ? { label: o.label } : {}),
  nodes: ns.map((n) => ({ id: n.id, label: String(n.val), x: n.x, y: n.y, ...(o.st?.[n.id] ? { state: o.st[n.id] } : {}), ...(o.tag?.[n.id] ? { tag: o.tag[n.id] } : {}) })),
  edges: ns.flatMap((n) => [n.left, n.right].filter((c) => c !== null).map((c) => ({ from: n.id, to: c }))),
});
const pairTag = (p) => `[${p[0]}, ${p[1]}]`;
const rFrame = (k) => {
  const r = RR.recs[k];
  const n = TR[r.id];
  const leaf = n.left === null && n.right === null;
  return {
    say: leaf ? 0 : k === RR.recs.length - 1 ? 2 : 1,
    note: leaf
      ? `Leaf ${n.val}: both children null → rob = ${n.val} + 0 + 0, skip = 0 → ${pairTag(r.pair)}.`
      : `Node ${n.val}: rob = ${n.val} + ${r.l[1]} + ${r.r[1]} = ${r.pair[0]}; skip = ${Math.max(...r.l)} + ${Math.max(...r.r)} = ${r.pair[1]}.`,
    panels: [
      tDraw(TR, {
        label: 'tags: [rob, skip]',
        st: Object.fromEntries(RR.recs.slice(0, k + 1).map((x, j) => [x.id, j === k ? 'active' : 'done'])),
        tag: Object.fromEntries(RR.recs.slice(0, k + 1).map((x) => [x.id, pairTag(x.pair)])),
      }),
    ],
  };
};
// the turn: e.g. tree [3, 6, 1, 2, null, 5]
const TT = tree([
  [3, 1, 2, 2, 0],
  [6, 3, null, 1, 1],
  [1, 4, null, 4, 1],
  [2, null, null, 0, 2],
  [5, null, null, 3, 2],
]);
const TRR = robRun(TT);
const TL = TRR.recs.find((r) => r.id === 1).pair;
const TRP = TRR.recs.find((r) => r.id === 2).pair;
check(TRR.root[1] === 11 && TRR.root[0] === 10 && TRR.best === robBrute(TT) && TL.join() === '6,2' && TRP.join() === '1,5', 'robber turn');

// ---------- interval DP: e.g. burst balloons nums = [2, 4, 3] ----------
const BN = [2, 4, 3];
const BA = [1, ...BN, 1];
const BM = BA.length;
const BDP = Array.from({ length: BM }, () => new Array(BM).fill(0));
const BRECS = [];
for (let len = 2; len < BM; len++) {
  for (let i = 0; i + len < BM; i++) {
    const j = i + len;
    const tries = [];
    for (let k = i + 1; k < j; k++) {
      const v = BDP[i][k] + BDP[k][j] + BA[i] * BA[k] * BA[j];
      tries.push({ k, l: BDP[i][k], r: BDP[k][j], c: BA[i] * BA[k] * BA[j], v });
      BDP[i][j] = Math.max(BDP[i][j], v);
    }
    BRECS.push({ len, i, j, tries, v: BDP[i][j], snap: BDP.map((r) => [...r]) });
  }
}
// brute force: every burst order
const burstBrute = (nums) =>
  Math.max(
    ...perms(nums.map((_, i) => i)).map((order) => {
      const alive = nums.map((_, i) => i);
      let coins = 0;
      for (const b of order) {
        const p = alive.indexOf(b);
        coins += (p > 0 ? nums[alive[p - 1]] : 1) * nums[b] * (p < alive.length - 1 ? nums[alive[p + 1]] : 1);
        alive.splice(p, 1);
      }
      return coins;
    }),
  );
const BANS = BDP[0][BM - 1];
check(BANS === burstBrute(BN) && BANS === 33, 'burst');
const BLAST = BRECS.at(-1); // (0, 4)
const BK2 = BLAST.tries.find((t) => t.k === 2);
check(BK2.c === 4 && BK2.l + BK2.r === 20, 'burst turn');
const bTable = (snap, filled, cur = []) =>
  table(
    BA.map((v, i) => `i=${i} (${v})`),
    BA.map((v, j) => `j=${j}`),
    snap.map((row, i) => row.map((v, j) => (j <= i ? '' : j === i + 1 || filled.has(`${i},${j}`) ? v : '·'))),
    snap.map((row, i) => row.map((_, j) => (cur.includes(`${i},${j}`) ? 'active' : filled.has(`${i},${j}`) ? 'done' : j === i + 1 ? 'muted' : ''))),
    'dp[i][j]: best coins strictly between walls i and j',
  );
const bKey = (r) => `${r.i},${r.j}`;
const bFilled = (n) => new Set(BRECS.slice(0, n).map(bKey));
const bTry = (r) => r.tries.map((t) => `k=${t.k} → ${t.l} + ${t.r} + ${BA[r.i]}·${BA[t.k]}·${BA[r.j]} = ${t.v}`).join('; ');
const BLEN2 = BRECS.filter((r) => r.len === 2);
const BLEN3 = BRECS.filter((r) => r.len === 3);
const bAll = (r) => arr(BA, { label: 'a = [1, ...nums, 1]', pointers: [ptr(r.i, 'i'), ptr(r.j, 'j', 'c')], highlights: hl(BM, (k) => (k > r.i && k < r.j ? 'window' : k === r.i || k === r.j ? 'active' : 'muted')) });

// ---------- bitmask DP: e.g. 3 nodes, cost 0–1 = 4, 0–2 = 1, 1–2 = 2 ----------
const BC = [
  [0, 4, 1],
  [4, 0, 2],
  [1, 2, 0],
];
const TN = 3;
const FULL = (1 << TN) - 1;
const TDP = Array.from({ length: 1 << TN }, () => new Array(TN).fill(Infinity));
for (let i = 0; i < TN; i++) TDP[1 << i][i] = 0; // start(i) = 0: start anywhere
const TSNAP = [{ mask: 0, recs: [], snap: TDP.map((r) => [...r]) }];
for (let mask = 1; mask <= FULL; mask++) {
  const recs = [];
  for (let last = 0; last < TN; last++) {
    if (!(mask & (1 << last)) || TDP[mask][last] === Infinity) continue;
    for (let nxt = 0; nxt < TN; nxt++) {
      if (mask & (1 << nxt)) continue;
      const nm = mask | (1 << nxt);
      const cand = TDP[mask][last] + BC[last][nxt];
      const old = TDP[nm][nxt];
      TDP[nm][nxt] = Math.min(old, cand);
      recs.push({ mask, last, nxt, nm, from: TDP[mask][last], c: BC[last][nxt], cand, old, won: cand < old });
    }
  }
  if (recs.length) TSNAP.push({ mask, recs, snap: TDP.map((r) => [...r]) });
}
const TANS = Math.min(...TDP[FULL]);
const tspBrute = Math.min(...perms([0, 1, 2]).map((p) => p.slice(1).reduce((s, v, i) => s + BC[p[i]][v], 0)));
check(TANS === tspBrute && TANS === 3, 'tsp');
const bin = (m) => m.toString(2).padStart(TN, '0');
const mTable = (snap, cur = []) =>
  table(
    Array.from({ length: FULL }, (_, m) => bin(m + 1)),
    ['last 0', 'last 1', 'last 2'],
    snap.slice(1).map((row, m) => row.map((v, l) => ((m + 1) & (1 << l) ? num(v) : '–'))),
    snap.slice(1).map((row, m) => row.map((v, l) => (cur.includes(`${m + 1},${l}`) ? 'active' : !((m + 1) & (1 << l)) ? 'muted' : v !== Infinity ? 'done' : ''))),
    'dp[mask][last] (mask bits: node 2, 1, 0)',
  );
const tRec = (r) => `(${bin(r.mask)}, ${r.last}) → (${bin(r.nm)}, ${r.nxt}): ${r.from} + ${r.c} = ${r.cand}${r.old !== Infinity && !r.won ? `, keep ${r.old}` : ''}`;
const tFrame = (s, say) => ({
  ...(say !== undefined ? { say } : {}),
  note: `mask ${bin(s.mask)}: ${s.recs.map(tRec).join('; ')}.`,
  panels: [mTable(s.snap, s.recs.map((r) => `${r.nm},${r.nxt}`))],
});
const TPOS = [
  [0, 0],
  [2, 0],
  [1, 1.4],
];
const tGraph = (st = {}, es = {}) => ({
  kind: 'nodes',
  freeLayout: true,
  label: 'e.g. costs',
  nodes: TPOS.map(([x, y], i) => ({ id: i, label: String(i), x, y, ...(st[i] ? { state: st[i] } : {}) })),
  edges: [
    [0, 1],
    [0, 2],
    [1, 2],
  ].map(([u, v]) => ({ from: u, to: v, label: String(BC[u][v]), ...(es[`${u}-${v}`] ? { state: es[`${u}-${v}`] } : {}) })),
});
const TS5 = TSNAP.find((s) => s.mask === 5);
const TS6 = TSNAP.find((s) => s.mask === 6);
const TPRE5 = TSNAP[TSNAP.indexOf(TS5) - 1];
const T5 = TS5.recs.filter((r) => r.nm === FULL && r.nxt === 1);
check(T5.length === 2 && T5[0].cand === 5 && T5[1].cand === 3 && TS5.snap[FULL][1] === 3, 'tsp turn');
const T3 = TSNAP.find((s) => s.mask === 3).recs; // two orders into (111, 2)
check(T3[0].cand === 5 && T3[1].cand === 6, 'tsp merge');

// ---------- digit DP: count digit 1 in [0, N], e.g. N = 32 ----------
const DN = 32;
const DD = String(DN).split('').map(Number);
const DMEMO = new Map();
const DLOG = [];
function dgo(pos, tight, ones, depth = 0) {
  if (pos === DD.length) return ones;
  const key = pos + ',' + ones;
  if (!tight && DMEMO.has(key)) {
    if (depth === 1) DLOG.push({ pos, tight, ones, hit: true, total: DMEMO.get(key) });
    return DMEMO.get(key);
  }
  const limit = tight ? DD[pos] : 9;
  let total = 0;
  for (let d = 0; d <= limit; d++) total += dgo(pos + 1, tight && d === limit, ones + (d === 1 ? 1 : 0), depth + 1);
  if (!tight) DMEMO.set(key, total);
  if (depth === 1) DLOG.push({ pos, tight, ones, limit, hit: false, total });
  return total;
}
const DANS = dgo(0, true, 0);
let dBrute = 0;
for (let x = 0; x <= DN; x++) dBrute += String(x).split('').filter((c) => c === '1').length;
check(DANS === dBrute && DANS === 14 && DLOG.length === DD[0] + 1, 'digit');
// DLOG[d] = the call for first digit d
check(DLOG[2].hit && DLOG[2].total === 1 && !DLOG[3].hit && DLOG[3].total === 1 && DLOG[1].total === 11, 'digit calls');
const memoAfter = (n) => {
  const m = new Map(DLOG.slice(0, n).filter((c) => !c.hit && !c.tight).map((c) => [c.ones, c.total]));
  return table(['pos 1, free'], ['ones 0', 'ones 1'], [[m.get(0) ?? '', m.get(1) ?? '']], [[m.has(0) ? 'done' : '', m.has(1) ? 'done' : '']], 'memo (non-tight states only)');
};
const dDigits = (pos, st = 'active') => arr(DD, { label: `digits of N = ${DN}`, pointers: [ptr(pos, 'pos')], highlights: { [pos]: st } });

export default [
  {
    id: 'dp-adv-lis',
    title: 'Longest increasing subsequence with one sorted array',
    steps: [
      {
        kind: 'watch',
        title: 'Every subsequence is 2^n; "ends at i" is n²',
        lines: ['Longest **strictly increasing** subsequence: elements may be skipped.', 'Trying every subsequence: **2^n** of them.', '`dp[i]` = best length **ending at i**: check every j < i, **O(n²)**.'],
        frames: [
          {
            say: 1,
            note: `e.g. nums = ${show(LN)}: 2^${LN.length} = ${2 ** LN.length} subsequences to try. One longest: 2, 4, 5, 7.`,
            panels: [arr(LN, { label: 'nums', highlights: hl(LN.length, (k) => ([1, 3, 4, 6].includes(k) ? 'done' : '')) })],
          },
          {
            say: 2,
            note: `dp[${LI}]: every earlier value < ${LN[LI]} is a candidate j. The best is ${LN[LJBEST]} with dp = ${LDP[LJBEST]} → dp[${LI}] = ${LDP[LI]}.`,
            panels: [
              arr(LN, { label: 'nums', pointers: [ptr(LI, 'i'), ptr(LJBEST, 'best j', 'b')], highlights: hl(LN.length, (k) => (k === LI ? 'active' : LN[k] < LN[LI] ? 'window' : 'muted')) }),
              arr(LDP, { label: 'dp: length ending at i', highlights: { [LI]: 'active', [LJBEST]: 'done' } }),
            ],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'tails: the smallest tail for each length',
        lines: ['`tails[k]` = smallest tail of an increasing subsequence of length k + 1.', 'For each x: lower bound = first k with `tails[k] >= x`.', 'None → push (longer). Else replace: a smaller tail is never worse.'],
        frames: LR.map(lisFrame),
      },
      {
        kind: 'watch',
        title: 'Only the length is the answer',
        lines: ['tails stays **sorted**, so each step is a binary search: **O(n log n)**.', 'tails is **not** a subsequence: only its length counts.', 'Clues: **"longest increasing subsequence"**, **"nest inside"**, **"minimum removals to make sorted"**.'],
        frames: [
          {
            say: 1,
            note: `Answer: tails.length = ${LT.length}. But tails = ${show(LT)} is not in nums' order: 1 comes after 5.`,
            panels: [arr(LN, { label: 'nums', highlights: { 4: 'active', 5: 'bad' } }), arr(LT, { label: 'tails', highlights: { 0: 'bad' } })],
          },
          {
            say: 2,
            note: `Minimum removals to make it sorted = n − LIS = ${LN.length} − ${LT.length} = ${LN.length - LT.length}.`,
            panels: [vars({ 'all subsequences': 'O(2^n)', 'dp ending at i': 'O(n²)', 'tails + binary search': 'O(n log n)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: an equal value arrives',
        lines: [`tails = ${show(LT)}. The next number is **${LX}**.`, 'We want **strictly** increasing subsequences.'],
        panels: [arr(LT, { label: 'tails', highlights: { [LLB]: 'active' } }), vars({ x: LX })],
        task: {
          type: 'choose',
          question: `Where does x = ${LX} go?`,
          options: [
            { text: `Lower bound k = ${LLB}: tails[${LLB}] = ${LX} again, length stays ${LT.length}` },
            { text: `Upper bound k = ${LUB}: tails becomes [1, 4, 5, 5]`, why: 'That is the non-decreasing version: it lets 5, 5 count as increasing. Strict LIS uses the lower bound.' },
            { text: `Push: tails becomes [1, 4, 5, 7, 5], length ${LT.length + 1}`, why: `Only push when no tail is >= x. A length-${LT.length + 1} run would need to end after 7, and 5 < 7.` },
            { text: 'Replace tails[0] = 1 with 5', why: 'Replace the first tail >= x, never a smaller one: that would make the best length-1 tail worse.' },
          ],
          answer: 0,
        },
        solved: 'Strict LIS: **lower bound** (first tail >= x). Non-decreasing: upper bound. tails stays sorted; its length is the answer.',
      },
    ],
  },

  {
    id: 'dp-adv-palindrome',
    title: 'Longest palindrome inside a string, from the middle out',
    steps: [
      {
        kind: 'watch',
        title: 'A palindrome is its inside plus two equal ends',
        lines: ['Longest palindromic **subsequence**: characters may be skipped.', '`s[i] === s[j]` → both ends join: inner answer `dp[i+1][j-1]` + 2.', 'Otherwise drop one end: `max(dp[i+1][j], dp[i][j-1])`.'],
        frames: [
          {
            say: 0,
            note: `e.g. s = "${PS}": 2^${PN} = ${2 ** PN} subsequences to try. A palindrome is built from its inside: reuse that answer.`,
            panels: [arr([...PS], { label: 's' })],
          },
          {
            say: 1,
            note: `s[0] = a = s[3]: the answer for "abca" is the answer for its inside "bc" (1) + 2 = 3.`,
            panels: [arr([...PS], { label: 's', pointers: [ptr(0, 'i'), ptr(3, 'j', 'c')], highlights: { 0: 'done', 3: 'done', 1: 'window', 2: 'window' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Fill the table from the bottom row up',
        lines: ['`i` goes **down** from n − 1, so row i + 1 is ready.', '`dp[i][i] = 1`; then j goes **up** from i + 1.', `Answer: \`dp[0][n − 1]\` = ${PANS}.`],
        frames: PROWS.map(pFrame),
      },
      {
        kind: 'watch',
        title: 'Substring or subsequence?',
        lines: ['Each cell is O(1), so the table is **O(n²)**.', 'Clues: **"palindrome"**, **"longest palindromic"**, **"minimum insertions to make palindrome"**.'],
        frames: [
          {
            say: 1,
            note: 'Contiguous substring: expand from each of the 2n − 1 centers (letters and gaps) instead, O(1) space.',
            panels: [vars({ subsequence: 'dp[i][j] table, O(n²)', substring: 'expand 2n − 1 centers, O(1) space', 'every substring checked': 'O(n³)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the fill order',
        lines: [`dp[1][4] needs dp[2][3] (the inside), dp[2][4] and dp[1][3].`, 'All three must be filled before it.'],
        panels: [pTable(PROWS.find((r) => r.i === 2).snap, 2, { '1,4': 'active', '2,3': 'window', '2,4': 'window', '1,3': 'window' })],
        task: {
          type: 'choose',
          question: 'Which loop order has all three ready when dp[1][4] is computed?',
          options: [
            { text: 'i from n − 1 down to 0; j from i + 1 up' },
            { text: 'i from 0 up; j from i + 1 up', why: 'Row 2 would be filled after row 1, so dp[2][3] is still 0 when dp[1][4] reads it.' },
            { text: 'i from n − 1 down; j from n − 1 down to i + 1', why: 'dp[1][3] is in the same row with a smaller j: going down in j, it is not filled yet.' },
            { text: 'Any order: the table starts filled with 0', why: 'A 0 is read as a real answer: dp[1][4] would come out 0 + 2 = 2 instead of 3.' },
          ],
          answer: 0,
        },
        solved: `Inside-out means **i down, j up**: every dp[i][j] reads only finished cells. Here dp[0][4] = ${PANS}.`,
      },
    ],
  },

  {
    id: 'dp-adv-state-machine',
    title: 'Stock trading with a cooldown as three states',
    steps: [
      {
        kind: 'watch',
        title: 'The cooldown breaks the greedy plan',
        lines: ['Buy and sell any number of times, but after a sale you must **rest one day**.', 'Without the rule: sum every rise. With it, that plan is illegal.', 'At the end of each day you are in exactly one **state**.'],
        frames: [
          {
            say: 1,
            note: `e.g. prices ${show(SP)}: rises 2→4 and 1→5 sum to ${GREEDY}, but that sells on day 1 and buys on day 2.`,
            panels: [arr(SP, { label: 'prices', highlights: { 0: 'done', 1: 'bad', 2: 'bad', 3: 'done' } })],
          },
          {
            say: 2,
            note: 'hold: own a share. sold: sold today. rest: no share, not sold today. Buying is only allowed from rest.',
            panels: [SNODES],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'One arrow per term, from yesterday only',
        lines: ['`hold = max(hold, rest − p)`: keep, or buy **only from rest**.', '`sold = hold + p`: sell today.', "`rest = max(rest, sold)`: idle, or yesterday's sale cools down.", "Every state reads **yesterday's** values."],
        frames: [
          {
            say: 0,
            note: 'Start: hold = −∞ (you cannot hold before buying), sold = 0, rest = 0.',
            panels: [arr(SP, { label: 'prices' }), sTable(SR.out, 0, 0)],
          },
          ...SP.map((_, d) => sFrame(d + 1)),
        ],
      },
      {
        kind: 'watch',
        title: 'Read the answer, spot the clue',
        lines: ['Answer: `max(sold, rest)`: never end holding.', 'Clues: **"cooldown"**, **"transaction fee"**, **"at most k transactions"**.'],
        frames: [
          {
            say: 0,
            note: `max(${SR.out.at(-1).sold}, ${SR.out.at(-1).rest}) = ${SR.best}: buy at 1, sell at 5. One pass, O(n · states) time, 3 variables.`,
            panels: [sTable(SR.out, SP.length, SP.length), vars({ answer: SR.best, 'greedy (illegal)': GREEDY })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: one more day',
        lines: [`Add an e.g. day 4 at price ${SX}.`, `Yesterday: hold = ${num(SD4.prevHold)}, sold = ${SD4.prevSold}, rest = ${SD4.prevRest}.`],
        panels: [sTable(SR2.out, SP.length, SP.length + 1, true)],
        task: {
          type: 'choose',
          question: 'Which value does hold get on day 4?',
          options: [
            { text: `max(${num(SD4.prevHold)}, ${SD4.prevRest} − ${SX}) = ${SD4.hold}` },
            { text: `max(${num(SD4.prevHold)}, ${SD4.prevSold} − ${SX}) = ${SD4.prevSold - SX}`, why: 'That buys from sold: a purchase the day right after a sale, which the cooldown forbids.' },
            { text: `${num(SD4.prevHold)}: keep holding`, why: `Keeping is one arrow, but max also tries buying from rest: ${SD4.prevRest} − ${SX} = ${SD4.hold} is better.` },
          ],
          answer: 0,
        },
        solved: 'Each state is a **max over its incoming arrows**, read from yesterday. hold has no arrow from sold: that is the cooldown.',
      },
    ],
  },

  {
    id: 'dp-adv-tree',
    title: 'Pick tree nodes with no two linked, bottom up',
    steps: [
      {
        kind: 'watch',
        title: 'Robbing the big root is a trap',
        lines: ['Choose nodes for the largest sum; no two **directly linked**.', 'Top-down greedy: take the root because it is largest.'],
        frames: [
          {
            say: 1,
            note: `e.g. this tree. Greedy takes 5; its children are then blocked, so add the leaves 1 + 1 → ${RR.root[0]}.`,
            panels: [tDraw(TR, { st: { 0: 'done', 3: 'done', 4: 'done', 1: 'bad', 2: 'bad' } })],
          },
          {
            say: 0,
            note: `Skipping the root frees both 4s: 4 + 4 = ${RR.best}. Every subset is exponential; we need a better state.`,
            panels: [tDraw(TR, { st: { 1: 'done', 2: 'done', 0: 'muted', 3: 'muted', 4: 'muted' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Each node returns [rob, skip]',
        lines: ['Post-order: children first; a null child returns [0, 0].', '`rob = val + left.skip + right.skip`: children must be skipped.', '`skip = max(left) + max(right)`: children are free.'],
        frames: RR.recs.map((_, k) => rFrame(k)),
      },
      {
        kind: 'watch',
        title: 'The parent never looks deeper',
        lines: ['A subtree touches the rest only through its root, so two numbers are enough.', 'Clues: binary tree + **"maximum amount without adjacent"**, **"minimum cameras to monitor"**.'],
        frames: [
          {
            say: 0,
            note: `Answer: max(${RR.root[0]}, ${RR.root[1]}) = ${RR.best}. One visit per node: O(n) time, O(height) stack.`,
            panels: [tDraw(TR, { st: { 1: 'done', 2: 'done' }, tag: { 0: pairTag(RR.root) } }), vars({ answer: RR.best })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: combine two children',
        lines: ['e.g. another tree. The children of 3 already returned their pairs.', `Left: ${pairTag(TL)}, right: ${pairTag(TRP)}.`],
        panels: [tDraw(TT, { label: 'tags: [rob, skip]', st: { 0: 'active', 1: 'done', 2: 'done', 3: 'done', 4: 'done' }, tag: { 1: pairTag(TL), 2: pairTag(TRP), 3: '[2, 0]', 4: '[5, 0]' } })],
        task: {
          type: 'choose',
          question: 'What is skip for node 3?',
          options: [
            { text: `max(${TL.join(', ')}) + max(${TRP.join(', ')}) = ${TRR.root[1]}` },
            { text: `${TL[1]} + ${TRP[1]} = ${TL[1] + TRP[1]}`, why: 'Forcing both children skipped is the rule for rob. When node 3 is skipped, each child takes its better state.' },
            { text: `${TL[0]} + ${TRP[0]} = ${TL[0] + TRP[0]}`, why: `Forcing both children robbed misses that skipping node 1 is worth ${TRP[1]} > ${TRP[0]}.` },
            { text: `3 + ${TL[1]} + ${TRP[1]} = ${TRR.root[0]}`, why: 'That is rob for node 3 (its value plus the children skipped), not skip.' },
          ],
          answer: 0,
        },
        solved: `Node 3 returns [${TRR.root.join(', ')}]: answer ${TRR.best}. rob forces children skipped; skip lets each child pick its max.`,
      },
    ],
  },

  {
    id: 'dp-adv-interval',
    title: 'Burst balloons by choosing the last one',
    steps: [
      {
        kind: 'watch',
        title: 'Bursting first tangles the two sides',
        lines: ['Burst every balloon; each pays **left · k · right**, its current neighbours.', 'Trying every order: **n!**.', 'Fix the **LAST** balloon k in (i, j): it walls off both sides.'],
        frames: [
          {
            say: 1,
            note: `e.g. nums = ${show(BN)}, padded with 1 at both ends. ${BN.length}! = 6 orders for 3 balloons, n! in general.`,
            panels: [arr(BA, { label: 'a = [1, ...nums, 1]', highlights: { 0: 'muted', [BM - 1]: 'muted' } })],
          },
          {
            say: 2,
            note: 'Burst 4 first: 2 and 3 become neighbours, the sides interact. If k goes last, k stands between them all along.',
            panels: [arr(BA, { label: 'a', highlights: { 0: 'muted', 1: 'window', 2: 'bad', 3: 'window', [BM - 1]: 'muted' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Short ranges first, every k tried',
        lines: ['`dp[i][j]` = best coins for the balloons strictly between walls i and j.', 'Length 2, then 3, …: the shorter ranges inside are always ready.', '`dp[i][j] = max over k of dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]`.'],
        frames: [
          {
            say: 1,
            note: `Length 2, one balloon each: ${BLEN2.map((r) => `dp[${r.i}][${r.j}] = ${BA[r.i]}·${BA[r.i + 1]}·${BA[r.j]} = ${r.v}`).join(', ')}.`,
            panels: [bTable(BLEN2.at(-1).snap, bFilled(BLEN2.length), BLEN2.map(bKey))],
          },
          ...BLEN3.map((r) => ({
            say: 2,
            note: `(${r.i}, ${r.j}): ${bTry(r)}. Best ${r.v}.`,
            panels: [bAll(r), bTable(r.snap, bFilled(BRECS.indexOf(r) + 1), [bKey(r)])],
          })),
        ],
      },
      {
        kind: 'watch',
        title: 'The clue: cost depends on neighbours',
        lines: ['n² ranges × n split points: **O(n³)**.', 'Clues: **"burst"**, **"merge stones"**, **"cut the stick"**, **"cost equals length of the piece"**.'],
        frames: [
          {
            say: 1,
            note: 'Cut a stick: same loops, but split on the FIRST cut, cost pos[j] − pos[i]. Add walls 0 and n.',
            panels: [vars({ 'burst balloons': 'k = last burst, walls = 1s', 'cut a stick': 'k = first cut, walls = 0 and n', time: 'O(n³)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the whole range',
        lines: [`Last range: (0, ${BM - 1}), all three balloons.`, 'Try k = 2 (the 4) as the LAST balloon burst.'],
        panels: [bAll(BLAST), bTable(BRECS.at(-2).snap, bFilled(BRECS.length - 1), [bKey(BLAST)])],
        task: {
          type: 'choose',
          question: 'When the 4 finally bursts, what does it pay?',
          options: [
            { text: `a[0]·4·a[4] = 1·4·1 = ${BK2.c}` },
            { text: '2·4·3 = 24', why: 'Those were its neighbours at the start. It bursts last, so 2 and 3 are already gone: only the walls remain.' },
            { text: `dp[0][2] + dp[2][4] = ${BK2.l + BK2.r}`, why: 'That is what the two sides earn before it. The 4 itself pays a[i]·a[k]·a[j] on top.' },
          ],
          answer: 0,
        },
        then: [
          {
            note: `(0, 4): ${bTry(BLAST)}. Answer ${BANS}.`,
            panels: [bTable(BLAST.snap, bFilled(BRECS.length), [bKey(BLAST)])],
          },
        ],
        solved: `k burst last pays **a[i]·a[k]·a[j]**: the walls are its only neighbours. Best total here: ${BANS}.`,
      },
    ],
  },

  {
    id: 'dp-adv-bitmask',
    title: 'Visit every node: a set and a last node beat n! orders',
    steps: [
      {
        kind: 'watch',
        title: 'Many orders, few situations',
        lines: ['Visit every node once, paying cost(a, b) per step; start anywhere.', 'All orders: **n!**. What is left depends only on **which** nodes are used and the **last** one.', 'State `dp[mask][last]`: bit i of mask = node i used. **2^n · n** states.'],
        frames: [
          {
            say: 0,
            note: `e.g. 3 nodes with costs 0–1: ${BC[0][1]}, 0–2: ${BC[0][2]}, 1–2: ${BC[1][2]}. ${TN}! = 6 orders to try.`,
            panels: [tGraph()],
          },
          {
            say: 1,
            note: `0→1→2 costs ${T3[1].cand}, 1→0→2 costs ${T3[0].cand}. Both end at 2 having used {0, 1, 2}: keep only ${Math.min(T3[0].cand, T3[1].cand)}.`,
            panels: [tGraph({ 2: 'active' }, { '0-1': 'window', '0-2': 'window' }), vars({ mask: '111', last: 2, kept: Math.min(T3[0].cand, T3[1].cand) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Masks in increasing order',
        lines: ['Start: `dp[1 << i][i] = 0` for every i.', 'From each (mask, last), add an unused nxt: `nm = mask | (1 << nxt)`.', '`dp[nm][nxt] = min(dp[nm][nxt], dp[mask][last] + cost(last, nxt))`.'],
        frames: [
          { say: 0, note: 'One node used: cost 0. Everything else starts at ∞; "–" means last is not in mask.', panels: [mTable(TSNAP[0].snap, ['1,0', '2,1', '4,2'])] },
          ...TSNAP.slice(1, TSNAP.indexOf(TS5)).map((s) => tFrame(s)),
        ],
      },
      {
        kind: 'watch',
        title: 'Read the constraint',
        lines: ['2^n · n states × n next nodes: **O(2^n · n²)**. Fine for n ≤ 16–20.', 'Clues: **n ≤ 16 / 20**, **"visit every node"**, **"shortest superstring"**, **"assign each worker a job"**.', 'Parenthesise: `(mask & (1 << i)) === 0`.'],
        frames: [
          {
            say: 0,
            note: 'n = 20: about 2·10^7 states. 20! orders would never finish.',
            panels: [vars({ orders: 'n!', states: '2^n · n', time: 'O(2^n · n²)' })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: two ways into one state',
        lines: [`Next is mask 101. Two moves reach (111, last 1):`, `from last 0: ${T5[0].from} + ${T5[0].c} = ${T5[0].cand}; from last 2: ${T5[1].from} + ${T5[1].c} = ${T5[1].cand}.`],
        panels: [mTable(TPRE5.snap, [`${FULL},1`])],
        task: {
          type: 'choose',
          question: 'What does dp[111][1] keep?',
          options: [
            { text: `${T5[1].cand}: the cheaper one; the future depends only on (mask, last)` },
            { text: 'Both, because the two orders differ', why: 'The order is forgotten on purpose: what is left depends only on which nodes are used and where you are. That is what turns n! into 2^n · n.' },
            { text: `${T5[0].cand}: the first value written`, why: 'The update is a min, so a later, cheaper path replaces it.' },
            { text: `${T5[0].cand + T5[1].cand}: the two added`, why: 'dp holds the best cost of one path, not a total over paths.' },
          ],
          answer: 0,
        },
        then: [
          tFrame(TS5),
          { ...tFrame(TS6), note: `mask 110: ${TS6.recs.map(tRec).join('; ')}. Answer: min of row 111 = ${TANS}.` },
        ],
        solved: `Many orders collapse into one (mask, last) state and **only the cheapest survives**. Best tour here: ${TANS}.`,
      },
    ],
  },

  {
    id: 'dp-adv-digit',
    title: 'Count digits up to N without visiting every number',
    steps: [
      {
        kind: 'watch',
        title: 'A billion numbers is too many',
        lines: ['Count how many times digit 1 appears in all numbers from 0 to N.', 'A loop reads every number: hopeless for **N up to 10^9**.', 'Clues: **"count numbers from 1 to n"**, **"how many times digit d appears"**.'],
        frames: [
          {
            say: 1,
            note: `e.g. N = ${DN}: a loop reads ${DN + 1} numbers. Fine here; for N = 10^9 it is a billion.`,
            panels: [vars({ N: DN, 'numbers read': DN + 1 })],
          },
          {
            say: 2,
            note: `Instead, write numbers digit by digit from the left: ${DD.length} positions, a few choices each.`,
            panels: [dDigits(0, '')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Tight: still equal to N so far',
        lines: ['`go(pos, tight, ones)`; `limit = tight ? digits[pos] : 9`.', 'd < limit → **free**: later digits are 0–9. d === limit → stay tight.', 'Free states repeat: **memoize** them on (pos, ones).'],
        frames: [
          {
            say: 0,
            note: `pos 0 is tight: limit = ${DD[0]}, so the first digit is 0, 1, 2 or ${DD[0]}.`,
            panels: [dDigits(0), vars({ pos: 0, tight: 'true', ones: 0, limit: DD[0] }), memoAfter(0)],
          },
          {
            say: 1,
            note: `d = 0 < ${DD[0]} → go(1, free, 0): digits 0–9, one of them is a 1 → ${DLOG[0].total}. Store it.`,
            panels: [dDigits(1), vars({ pos: 1, tight: 'false', ones: 0, limit: 9 }), memoAfter(1)],
          },
          {
            say: 2,
            note: `d = 1 → go(1, free, 1): 10 completions with one 1 already, plus the 1 in 11 → ${DLOG[1].total}. Store it.`,
            panels: [dDigits(1), vars({ pos: 1, tight: 'false', ones: 1, limit: 9 }), memoAfter(2)],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the first digit is 2',
        lines: [`N = ${DN}. At pos 0 we now pick d = 2; the limit was ${DD[0]}.`, 'No 1 has been chosen.'],
        panels: [dDigits(0), vars({ d: 2, limit: DD[0], ones: 0 }), memoAfter(2)],
        task: {
          type: 'choose',
          question: 'Which call comes next, and what does it cost?',
          options: [
            { text: `go(1, free, 0): already in memo, returns ${DLOG[2].total} at once` },
            { text: `go(1, tight, 0) with limit ${DD[1]}`, why: `tight stays true only when d equals the limit ${DD[0]}. 2 < ${DD[0]}, so 2x is below ${DN} whatever comes next.` },
            { text: 'go(1, free, 0), looping over digits 0–9 again', why: 'That exact free state was solved for d = 0 and stored. Free states are the ones worth memoizing.' },
            { text: 'go(1, free, 1)', why: 'ones counts the 1s chosen so far. 2 is not a 1.' },
          ],
          answer: 0,
        },
        then: [
          {
            note: `d = ${DD[0]} = limit → go(1, tight, 0): limit ${DD[1]}, digits 0, 1, 2 → ${DLOG[3].total} (the 1 in 31). Tight states are not stored.`,
            panels: [dDigits(1), vars({ pos: 1, tight: 'true', ones: 0, limit: DD[1] }), memoAfter(4)],
          },
          {
            note: `Total = ${DLOG.map((c) => c.total).join(' + ')} = ${DANS}, the same as checking all ${DN + 1} numbers.`,
            panels: [vars({ answer: DANS, states: 'digits × tight × ones' })],
          },
        ],
        solved: `Picking below the limit frees the rest, and free states are **memo hits**. Count of 1s in 0..${DN}: ${DANS}.`,
      },
    ],
  },
];
