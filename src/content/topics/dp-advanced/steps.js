import secondPart from './steps-2.js';
// Step lessons for DP Advanced, part 1 (overview, LIS, palindromic DP, state-machine DP). Format: src/content/stepSchema.js.
// Facts come only from topic.js. Every dp / len / cnt value, tails array, isPal / lps cell, hold / sold / rest / cash /
// buy / sell value and answer below comes from running the lesson's own code (go, findNumberOfLIS, bound + lis,
// longestPalindrome, longestPalindromeSubseq, maxProfit) or its stated recurrences on the example inputs.
// check() throws if a run drifts from the lesson's numbers (the dry-run tables are checked cell by cell).
const fv = (v) => (v === Infinity ? '∞' : v === -Infinity ? '-∞' : v === true ? 'T' : v === false ? 'F' : String(v));
const arr = (values, opts = {}) => ({ kind: 'array', values: values.map(fv), ...opts });
const vars = (v) => ({ kind: 'vars', vars: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fv(x)])) });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells: cells.map((r) => r.map(fv)), ...(states ? { states } : {}), ...(label ? { label } : {}) });
const ptr = (index, label, color = 'a') => ({ index, label, color });
const mk = (cells, s) => Object.fromEntries(cells.map(([r, c]) => [`${r},${c}`, s]));
const sm = (m, n, marks = {}) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => marks[`${r},${c}`] || ''));
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-advanced/steps.js: ${msg}`);
};
const list = (xs) => `[${xs.map(fv).join(', ')}]`;

// ---------- LIS O(n²): dp[i] = 1 + max(dp[j] for j < i with nums[j] < nums[i]) ----------
function lisDp(nums) {
  const dp = [];
  const ev = nums.map((x, i) => {
    const smaller = [];
    for (let j = 0; j < i; j++) if (nums[j] < x) smaller.push(j);
    const best = smaller.length ? Math.max(...smaller.map((j) => dp[j])) : 0;
    dp[i] = best + 1;
    return { i, smaller, bestJ: smaller.find((j) => dp[j] === best), v: dp[i] };
  });
  return { dp, ev };
}
const N1 = [3, 1, 4, 1, 5, 9, 2, 6];
const L1 = lisDp(N1);
check(same(L1.dp, [1, 1, 2, 1, 3, 4, 2, 4]), 'lis dp');
const lisFrame = (e, say) => ({
  say,
  note: e.smaller.length
    ? `${N1[e.i]}: smaller earlier values ${e.smaller.map((j) => N1[j]).join(', ')}; best dp ${L1.dp[e.bestJ]} → dp[${e.i}] = ${e.v}.`
    : `${N1[e.i]}: no smaller earlier value → dp[${e.i}] = 1.`,
  panels: [
    arr(N1, { label: 'nums', highlights: hl(e.i + 1, (j) => (j === e.i ? 'active' : j === e.bestJ ? 'done' : e.smaller.includes(j) ? 'visited' : 'muted')), pointers: [ptr(e.i, 'i')] }),
    arr(L1.dp.map((v, j) => (j <= e.i ? v : '·')), { label: 'dp', highlights: { [e.i]: 'active' } }),
  ],
});
const L1last = L1.ev[7];

// ---------- brute force: the lesson's go(i, prev), with a call counter per (i, prev) ----------
function goRun(nums) {
  const calls = new Map();
  let total = 0;
  function go(i, prev) {
    total++;
    const key = `${i},${prev}`;
    calls.set(key, (calls.get(key) || 0) + 1);
    if (i === nums.length) return 0;
    let best = go(i + 1, prev);
    if (nums[i] > prev) best = Math.max(best, 1 + go(i + 1, nums[i]));
    return best;
  }
  return { ans: go(0, -Infinity), calls, total };
}
const B3 = goRun([1, 2, 3]);
const B4 = goRun([1, 2, 3, 4]);
check(B3.ans === 3 && B3.total === 15 && B3.calls.size === 10, 'brute [1,2,3]');
check(B4.ans === 4 && B4.total === 31 && B4.calls.size === 15, 'brute [1,2,3,4]');
const PREV = [-Infinity, 1, 2, 3];
const callTable = (marks) =>
  table(['i=0', 'i=1', 'i=2', 'i=3'], PREV.map(fv), [0, 1, 2, 3].map((i) => PREV.map((p) => B3.calls.get(`${i},${p}`) ?? '·')), marks, 'calls of go(i, prev)');
const repeats = Object.fromEntries([0, 1, 2, 3].flatMap((i) => PREV.map((p, c) => [`${i},${c}`, (B3.calls.get(`${i},${p}`) || 0) > 1 ? 'bad' : ''])));

// ---------- patience sorting: tails + lower bound, the lesson's lengthOfLIS ----------
function bound(a, x, strict) {
  let lo = 0, hi = a.length;
  const probes = [];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    probes.push({ lo, hi, mid });
    if (strict ? a[mid] < x : a[mid] <= x) lo = mid + 1; else hi = mid;
  }
  return { k: lo, probes };
}
function patience(nums, strict = true) {
  const tails = [];
  return nums.map((x) => {
    const before = tails.slice();
    const { k, probes } = bound(tails, x, strict);
    const action = k === tails.length ? 'push' : `replace ${tails[k]}`;
    tails[k] = x;
    return { x, k, action, before, probes, after: tails.slice() };
  });
}
const PA = [4, 8, 6, 2, 9, 5];
const PR = patience(PA);
check(same(PR.at(-1).after, [2, 5, 9]) && PR.at(-1).k === 1, 'patience PA');
const patFrame = (e, idx, say) => ({
  say,
  note: e.action === 'push' ? `${e.x}: no tail ≥ ${e.x} → push. tails = ${list(e.after)}.` : `${e.x}: first tail ≥ ${e.x} is ${e.before[e.k]} at k = ${e.k} → replace. tails = ${list(e.after)}.`,
  panels: [arr(PA, { label: 'nums', highlights: hl(PA.length, (j) => (j === idx ? 'active' : j < idx ? 'muted' : '')) }), arr(e.after, { label: 'tails', highlights: { [e.k]: 'active' }, pointers: [ptr(e.k, 'k')] })],
});
const NOTSUB = patience([3, 4, 1]);
check(same(NOTSUB.at(-1).after, [1, 4]), 'tails [1,4]');
// Russian dolls: width ascending, equal widths by height descending, then LIS on heights
const ENV = [[3, 5], [2, 3], [5, 6], [3, 4]];
const ENVS = ENV.slice().sort((a, b) => a[0] - b[0] || b[1] - a[1]);
const envName = (e) => `${e[0]}×${e[1]}`;
const HEIGHTS = ENVS.map((e) => e[1]);
const ENVR = patience(HEIGHTS);
check(same(HEIGHTS, [3, 5, 4, 6]) && ENVR.at(-1).after.length === 3, 'envelopes');
const ASC = ENV.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((e) => e[1]);
check(patience(ASC).at(-1).after.length === 4, 'ascending heights overcount');

// ---------- template-lis: bound() strict vs non-strict ----------
const TS = [2, 2, 3];
const STRICT = patience(TS, true);
const LOOSE = patience(TS, false);
check(STRICT.at(-1).after.length === 2 && LOOSE.at(-1).after.length === 3, 'strict vs loose');
const BT = [1, 3, 3, 5];
const UB = bound(BT, 3, false);
const LB = bound(BT, 3, true);
check(UB.k === 3 && LB.k === 1, 'bound on [1,3,3,5]');
const boundFrames = (a, x, strict, say) => {
  const { k, probes } = bound(a, x, strict);
  const op = strict ? '<' : '≤';
  return [
    ...probes.map((p) => ({
      say,
      note: `mid = ${p.mid}: ${a[p.mid]} ${op} ${x}? ${(strict ? a[p.mid] < x : a[p.mid] <= x) ? 'yes → lo = mid + 1' : 'no → hi = mid'}.`,
      panels: [arr(a, { label: `bound(tails, ${x}, ${strict})`, highlights: { [p.mid]: 'active', ...hl(a.length, (j) => (j < p.lo || j >= p.hi ? 'muted' : '')) }, pointers: [ptr(p.mid, 'mid'), ...(p.lo < a.length ? [ptr(p.lo, 'lo', 'b')] : [])] })],
    })),
    { say, note: `lo = hi = ${k} → ${k === a.length ? 'push' : `write over ${a[k]}`}.`, panels: [arr([...a, ...(k === a.length ? ['·'] : [])], { label: `bound(tails, ${x}, ${strict}) = ${k}`, highlights: { [k]: 'done' }, pointers: [ptr(k, 'lo')] })] },
  ];
};

// ---------- implementation-lis: the lesson's findNumberOfLIS ----------
function numLIS(nums) {
  const n = nums.length;
  const len = new Array(n).fill(1), cnt = new Array(n).fill(1);
  const ev = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      let what = 'skip';
      if (nums[j] >= nums[i]) {
        ev.push({ i, j, what, len: len.slice(), cnt: cnt.slice() });
        continue;
      }
      if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; cnt[i] = cnt[j]; what = 'longer'; }
      else if (len[j] + 1 === len[i]) { cnt[i] += cnt[j]; what = 'equal'; }
      else what = 'shorter';
      ev.push({ i, j, what, len: len.slice(), cnt: cnt.slice() });
    }
  }
  const best = Math.max(...len);
  let total = 0;
  for (let i = 0; i < n; i++) if (len[i] === best) total += cnt[i];
  return { len, cnt, best, total, ev };
}
const NL = [1, 3, 5, 4, 7];
const NR = numLIS(NL);
check(same(NR.len, [1, 2, 3, 3, 4]) && same(NR.cnt, [1, 1, 1, 1, 2]) && NR.total === 2, 'number of LIS');
const NR2 = numLIS([2, 2, 2, 2, 2]);
const NC = [2, 1, 3];
const NCR = numLIS(NC);
check(same(NCR.len, [1, 1, 2]) && same(NCR.cnt, [1, 1, 2]) && NCR.total === 2, 'count demo [2,1,3]');
check(NR2.total === 5, 'all equal');
const atRow = (i) => NR.ev.filter((e) => e.i === i).at(-1);
const nlPanels = (i, j, len, cnt, upto, nums = NL) => [
  arr(nums, { label: 'nums', highlights: hl(nums.length, (k) => (k === i ? 'active' : k === j ? 'visited' : k > upto ? 'muted' : '')), pointers: [ptr(i, 'i'), ...(j !== undefined ? [ptr(j, 'j', 'b')] : [])] }),
  arr(len.map((v, k) => (k <= upto ? v : '·')), { label: 'len', highlights: { [i]: 'active' } }),
  arr(cnt.map((v, k) => (k <= upto ? v : '·')), { label: 'cnt', highlights: { [i]: 'active' } }),
];
const nlNote = (e) =>
  e.what === 'skip'
    ? `j = ${e.j}: ${NL[e.j]} ≥ ${NL[e.i]} → continue.`
    : e.what === 'longer'
      ? `j = ${e.j}: len ${e.len[e.j]} + 1 is longer → len = ${e.len[e.i]}, cnt = cnt[${e.j}] = ${e.cnt[e.i]}.`
      : e.what === 'equal'
        ? `j = ${e.j}: len ${e.len[e.j]} + 1 ties → cnt += ${e.cnt[e.j]} → ${e.cnt[e.i]}.`
        : `j = ${e.j}: len ${e.len[e.j]} + 1 is shorter → nothing.`;

// ---------- dry-run-lis: must equal the lesson's table ----------
const DRN = [10, 9, 2, 5, 3, 7, 101, 18];
const DR = patience(DRN);
const LESSON_ROWS = [
  ['10', '0', 'push', '[10]'],
  ['9', '0', 'replace 10', '[9]'],
  ['2', '0', 'replace 9', '[2]'],
  ['5', '1', 'push', '[2, 5]'],
  ['3', '1', 'replace 5', '[2, 3]'],
  ['7', '2', 'push', '[2, 3, 7]'],
  ['101', '3', 'push', '[2, 3, 7, 101]'],
  ['18', '3', 'replace 101', '[2, 3, 7, 18]'],
];
check(same(DR.map((e) => [String(e.x), String(e.k), e.action, list(e.after)]), LESSON_ROWS), 'dry-run table');
const drFrame = (idx, say) => {
  const e = DR[idx];
  return {
    say,
    note: e.action === 'push' ? `x = ${e.x}: lower bound k = ${e.k} = length → push. ${list(e.after)}.` : `x = ${e.x}: lower bound k = ${e.k} → ${e.action}. ${list(e.after)}.`,
    panels: [
      arr(DRN, { label: 'nums', highlights: hl(8, (j) => (j === idx ? 'active' : j < idx ? 'muted' : '')) }),
      arr(e.after, { label: 'tails', highlights: { [e.k]: 'active' }, pointers: [ptr(e.k, 'k')] }),
      vars({ x: e.x, k: e.k, action: e.action }),
    ],
  };
};

// ---------- palindromes ----------
const RACE = 'racecar'.split('');
// isPal[i][j] = s[i] === s[j] && (j − i < 2 || isPal[i+1][j−1]), filled by increasing length
function isPalRun(s) {
  const n = s.length;
  const t = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? '' : '·')));
  const byLen = [];
  for (let L = 1; L <= n; L++) {
    const cells = [];
    for (let i = 0; i + L - 1 < n; i++) {
      const j = i + L - 1;
      t[i][j] = s[i] === s[j] && (j - i < 2 || t[i + 1][j - 1] === true);
      cells.push({ i, j, v: t[i][j], reads: j - i >= 2 ? [[i + 1, j - 1]] : [] });
    }
    byLen.push({ L, cells, t: t.map((r) => r.slice()) });
  }
  return byLen;
}
const AB = 'abba';
const IP = isPalRun(AB);
const ipCount = IP.at(-1).t.flat().filter((v) => v === true).length;
check(IP.at(-1).t[0][3] === true && ipCount === 6, 'isPal abba');
const rcLab = (s) => s.split('').map((ch, i) => `${i} ${ch}`);
const ipNotes = [
  'Length 1: every single character is a palindrome → T.',
  'Length 2: ends equal? Only "bb" (1, 2).',
  'Length 3: "abb" and "bba": the ends differ → F.',
  'Length 4: a == a and the inside (1, 2) is T → "abba" is T.',
];

// the lesson's lps table: i from n − 1 down, j up from i + 1
function lpsRun(s) {
  const n = s.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  const show = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? '' : '·')));
  const ev = [];
  for (let i = n - 1; i >= 0; i--) {
    dp[i][i] = 1;
    show[i][i] = 1;
    ev.push({ i, j: i, reads: [], show: show.map((r) => r.slice()), note: `dp[${i}][${i}] = 1: one character.` });
    for (let j = i + 1; j < n; j++) {
      const eq = s[i] === s[j];
      dp[i][j] = eq ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
      show[i][j] = dp[i][j];
      ev.push({
        i, j, eq,
        reads: eq ? [[i + 1, j - 1]] : [[i + 1, j], [i, j - 1]],
        show: show.map((r) => r.slice()),
        note: eq ? `${s[i]} == ${s[j]}: both ends join → dp[${i + 1}][${j - 1}] + 2 = ${dp[i][j]}.` : `${s[i]} ≠ ${s[j]}: drop an end → max(${dp[i + 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}.`,
      });
    }
  }
  return { ans: n ? dp[0][n - 1] : 0, dp, ev };
}
const LP = lpsRun('abca');
check(LP.ans === 3, 'lps abca');
check(lpsRun('abab').ans === 3, 'lps abab');
const lpFrame = (s, e, say) => ({ say, note: e.note, panels: [table(rcLab(s), s.split(''), e.show, sm(s.length, s.length, { ...mk(e.reads, 'visited'), [`${e.i},${e.j}`]: 'active' }), 'dp[i][j]')] });

// the lesson's longestPalindrome (expand around center)
const CS = 'cabbad';
function expandRun(s) {
  let start = 0, bestLen = 0;
  const centers = [];
  const expand = (l, r) => {
    const moves = [];
    while (l >= 0 && r < s.length && s[l] === s[r]) { moves.push([l, r]); l--; r++; }
    return { len: r - l - 1, moves };
  };
  for (let c = 0; c < s.length; c++) {
    const odd = expand(c, c), even = expand(c, c + 1);
    const len = Math.max(odd.len, even.len);
    const better = len > bestLen;
    if (better) { bestLen = len; start = c - Math.floor((len - 1) / 2); }
    centers.push({ c, odd, even, len, better, start, bestLen });
  }
  return { ans: s.slice(start, start + bestLen), centers };
}
const EX = expandRun(CS);
check(EX.ans === 'abba' && EX.centers[2].even.len === 4 && EX.centers[2].start === 1, 'expand cabbad');
const cFrame = (k, say) => {
  const e = EX.centers[k];
  const win = e.odd.len >= e.even.len ? e.odd : e.even;
  const [l, r] = win.moves.at(-1);
  return {
    say,
    note: `c = ${k}: odd ${e.odd.len}, even ${e.even.len}.${e.better ? ` New best: length ${e.bestLen}, start ${e.start}.` : ' Not better.'}`,
    panels: [arr(CS.split(''), { label: 's', highlights: hl(CS.length, (j) => (j >= l && j <= r ? (e.better ? 'done' : 'window') : '')), pointers: [ptr(k, 'c')] }), vars({ start: e.start, bestLen: e.bestLen })],
  };
};
const evenMoves = EX.centers[2].even.moves;

// fill order of the lps table for n = 4
const FO = [];
for (let i = 3; i >= 0; i--) for (let j = i; j < 4; j++) FO.push([i, j]);
const foCells = (upto) => Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => {
  const k = FO.findIndex(([a, b]) => a === i && b === j);
  return j < i ? '' : k < upto ? k + 1 : '·';
}));

// the lesson's longestPalindromeSubseq (rolling rows)
const RS = 'bbab';
function rollRun(s) {
  const n = s.length;
  let next = new Array(n).fill(0);
  const fr = [];
  for (let i = n - 1; i >= 0; i--) {
    const cur = new Array(n).fill(0);
    cur[i] = 1;
    fr.push({ i, j: i, next: next.slice(), cur: cur.map((v, k) => (k < i ? '' : k === i ? v : '·')), note: `Row i = ${i}: cur[${i}] = 1.` });
    for (let j = i + 1; j < n; j++) {
      const eq = s[i] === s[j];
      cur[j] = eq ? next[j - 1] + 2 : Math.max(next[j], cur[j - 1]);
      fr.push({
        i, j, eq, next: next.slice(), cur: cur.map((v, k) => (k < i ? '' : k <= j ? v : '·')),
        note: eq ? `${s[i]} == ${s[j]}: next[${j - 1}] + 2 = ${cur[j]}.` : `${s[i]} ≠ ${s[j]}: max(next[${j}] ${next[j]}, cur[${j - 1}] ${cur[j - 1]}) = ${cur[j]}.`,
      });
    }
    next = cur;
  }
  return { ans: n ? next[n - 1] : 0, fr };
}
const RR = rollRun(RS);
check(RR.ans === 3, 'rolling lps bbab');
const rrPanels = (f) => [
  arr(RS.split(''), { label: 's', highlights: f.j > f.i ? { [f.i]: 'active', [f.j]: 'active' } : { [f.i]: 'active' } }),
  arr(f.next, { label: `next (row ${f.i + 1})`, highlights: f.j > f.i ? (f.eq ? { [f.j - 1]: 'visited' } : { [f.j]: 'visited' }) : {} }),
  arr(f.cur, { label: `cur (row ${f.i})`, highlights: { [f.j]: 'active', ...(f.j > f.i && !f.eq ? { [f.j - 1]: 'visited' } : {}) } }),
];
const rrTurn = RR.fr.findIndex((f) => f.i === 0 && f.j === 3);
check(RR.fr[rrTurn].eq && RR.fr[rrTurn].cur[3] === 3, 'rolling turn frame');

// ---------- state machine (cooldown) ----------
// the lesson's three recurrences, from yesterday's values only
function coolRun(prices) {
  let hold = -Infinity, sold = 0, rest = 0;
  const days = [];
  for (const p of prices) {
    const y = { hold, sold, rest };
    [hold, sold, rest] = [Math.max(hold, rest - p), hold + p, Math.max(rest, sold)];
    days.push({ p, y, hold, sold, rest, buy: y.rest - p > y.hold, cool: y.sold > y.rest });
  }
  return { ans: Math.max(sold, rest), days };
}
// node 0 REST, 1 HOLD, 2 SOLD
const SMN = [['REST', 0, 0], ['HOLD', 3, 0], ['SOLD', 3, 2]];
const SME = [[0, 0, 'idle'], [0, 1, 'buy'], [1, 1, 'keep'], [1, 2, 'sell'], [2, 0, 'cool']];
const smPanel = (st = {}, es = {}, label) => ({
  kind: 'nodes',
  freeLayout: true,
  directed: true,
  ...(label ? { label } : {}),
  nodes: SMN.map(([l, x, y], id) => ({ id, label: l, x, y, ...(st[id] ? { state: st[id] } : {}) })),
  edges: SME.map(([from, to, l]) => ({ from, to, label: l, ...(es[`${from}-${to}`] ? { state: es[`${from}-${to}`] } : {}) })),
});
const SP = [2, 1, 4];
const SC = coolRun(SP);
check(same(SC.days.map((d) => [d.hold, d.sold, d.rest]), [[-2, -Infinity, 0], [-1, -1, 0], [-1, 3, 0]]) && SC.ans === 3, 'cooldown [2,1,4]');
const SC4 = coolRun([2, 1, 4, 2]);
check(SC4.days[3].rest === 3, 'cooldown day 3 rest');
const dayWins = (d) => ({ '1-1': d.buy ? '' : 'active', '0-1': d.buy ? 'active' : '', '1-2': 'active', '0-0': d.cool ? '' : 'active', '2-0': d.cool ? 'active' : '' });
const smDay = (d, k, prices) => ({
  say: 3,
  note: `Day ${k}, price ${d.p}: hold = max(${fv(d.y.hold)}, ${fv(d.y.rest)} − ${d.p}) = ${fv(d.hold)}; sold = ${fv(d.y.hold)} + ${d.p} = ${fv(d.sold)}; rest = max(${fv(d.y.rest)}, ${fv(d.y.sold)}) = ${fv(d.rest)}.`,
  panels: [arr(prices, { label: 'prices', highlights: { [k]: 'active' }, pointers: [ptr(k, 'day')] }), smPanel({}, dayWins(d)), vars({ hold: d.hold, sold: d.sold, rest: d.rest })],
});
// in-place bug: sold, then rest from the NEW sold, then hold from the NEW rest
function buggyRun(prices) {
  let hold = -Infinity, sold = 0, rest = 0;
  const days = [];
  for (const p of prices) {
    sold = hold + p;
    rest = Math.max(rest, sold);
    hold = Math.max(hold, rest - p);
    days.push({ p, hold, sold, rest });
  }
  return { ans: Math.max(sold, rest), days };
}
const BUGP = [1, 2, 1, 2];
const GOOD = coolRun(BUGP);
const BAD = buggyRun(BUGP);
check(GOOD.ans === 1 && BAD.ans === 2 && BAD.days[2].hold === 0 && GOOD.days[2].hold === -1, 'in-place bug');

// fee: cash / hold, the lesson's two lines in its order (start: cash 0, hold -∞ like the cooldown code)
function feeRun(prices, fee) {
  let cash = 0, hold = -Infinity;
  return prices.map((p) => {
    const y = { cash, hold };
    cash = Math.max(cash, hold + p - fee);
    hold = Math.max(hold, cash - p);
    return { p, y, cash, hold };
  });
}
const FP = [1, 3, 2, 8, 4, 9];
const FR = feeRun(FP, 2);
check(FR.at(-1).cash === 8 && same(FR.map((d) => d.cash), [0, 0, 0, 5, 5, 8]), 'fee run');
const feeFrame = (k, say) => {
  const d = FR[k];
  return {
    say,
    note: `Price ${d.p}: cash = max(${fv(d.y.cash)}, ${fv(d.y.hold)} + ${d.p} − 2) = ${fv(d.cash)}; hold = max(${fv(d.y.hold)}, ${fv(d.cash)} − ${d.p}) = ${fv(d.hold)}.`,
    panels: [
      arr(FP, { label: 'prices (fee 2)', highlights: { [k]: 'active' }, pointers: [ptr(k, 'day')] }),
      arr(FR.map((x, j) => (j <= k ? x.cash : '·')), { label: 'cash', highlights: { [k]: 'active' } }),
      arr(FR.map((x, j) => (j <= k ? x.hold : '·')), { label: 'hold', highlights: { [k]: 'active' } }),
    ],
  };
};

// the lesson's maxProfit(k, prices)
function kRun(k, prices) {
  const n = prices.length;
  if (k >= n >> 1) {
    let profit = 0;
    for (let i = 1; i < n; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
    return { greedy: true, ans: profit };
  }
  const buy = new Array(k + 1).fill(-Infinity);
  const sell = new Array(k + 1).fill(0);
  const ev = [];
  for (const p of prices) {
    for (let j = 1; j <= k; j++) {
      buy[j] = Math.max(buy[j], sell[j - 1] - p);
      ev.push({ p, j, what: 'buy', buy: buy.slice(), sell: sell.slice() });
      sell[j] = Math.max(sell[j], buy[j] + p);
      ev.push({ p, j, what: 'sell', buy: buy.slice(), sell: sell.slice() });
    }
  }
  return { greedy: false, ans: sell[k], ev };
}
const GP = [1, 5, 3, 6];
const G = kRun(2, GP);
check(G.greedy && G.ans === 7, 'greedy fallback');
const KP = [3, 3, 5, 0, 0, 3];
const KR = kRun(2, KP);
check(!KR.greedy && KR.ans === 5, 'k = 2 dp');
const kAfterPrice = KR.ev.filter((e) => e.what === 'sell' && e.j === 2);
const kPanels = (e, idx, hi) => [
  arr(KP, { label: 'prices', highlights: { [idx]: 'active' }, pointers: [ptr(idx, 'p')] }),
  arr(e.buy, { label: 'buy[j]', highlights: hi.buy || {} }),
  arr(e.sell, { label: 'sell[j]', highlights: hi.sell || {} }),
];
// one price, j by j (the 3rd price, 5)
const KD = KR.ev.slice(8, 12);
check(KD.every((e) => e.p === 5), 'detail price 5');

// implementation-state-machine: the lesson's dry run, cell by cell
const IMP = [1, 2, 3, 0, 2];
const IR = coolRun(IMP);
const IMP_ROWS = [['-1', '-∞', '0'], ['-1', '1', '0'], ['-1', '2', '1'], ['1', '-1', '2'], ['1', '3', '2']];
check(same(IR.days.map((d) => [d.hold, d.sold, d.rest].map(fv)), IMP_ROWS) && IR.ans === 3, 'cooldown dry run');
const impTable = (upto, hide) =>
  table(['0', '1', '2', '3', '4'], ['p', 'hold', 'sold', 'rest'], IR.days.map((d, k) => (k <= upto ? [d.p, d.hold, d.sold, d.rest].map((v, c) => (hide && k === upto && c === hide ? '?' : v)) : [d.p, '·', '·', '·'])), sm(5, 4, Object.fromEntries([1, 2, 3].map((c) => [`${upto},${c}`, 'active']))), 'day');
const impFrame = (k, say) => {
  const d = IR.days[k];
  return { say, note: `Day ${k}, price ${d.p}: hold ${fv(d.hold)}, sold ${fv(d.sold)}, rest ${fv(d.rest)}.`, panels: [impTable(k), vars({ 'yesterday hold': d.y.hold, sold: d.y.sold, rest: d.y.rest })] };
};

const STEPS = {
  what: [
    {
      kind: 'watch',
      title: 'Same recipe, clever states',
      lines: ['Define a state, write the transition, pick an order, handle base cases.', 'Advanced DP is a catalogue of **clever states**.', 'Name the family, then use its standard state.'],
      frames: [
        { say: 0, note: 'The recipe from DP 1D and 2D does not change.', panels: [vars({ '1': 'state', '2': 'transition', '3': 'order', '4': 'base cases' })] },
        ...[
          ['LIS', 'ends at i'],
          ['Palindromic', 's[i..j]'],
          ['State machine', '(day, mode)'],
          ['Tree', '(node, flags)'],
          ['Interval', '(i, j) + last'],
          ['Bitmask', 'set as int'],
          ['Digit', '(pos, tight, …)'],
        ].map(([f, s]) => ({ say: 1, note: `${f}: the state is ${s}.`, panels: [vars({ family: f, state: s })] })),
        { say: 2, note: 'Once the family has a name, the rest is the standard recipe.', panels: [vars({ step1: 'name family', step2: 'its state' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the relay note',
      lines: ['A state is the **shortest note** that still lets the next runner decide perfectly.'],
      panels: [smPanel({ 0: 'active', 1: 'active', 2: 'active' }, {}, 'stock modes')],
      task: {
        type: 'choose',
        question: 'For the stock problems, what goes on the note?',
        options: [
          { text: 'Am I holding a share?', why: '' },
          { text: 'Every price seen so far', why: 'Too much: the future does not need the whole history, only the mode.' },
          { text: 'Which cities are visited', why: 'That is the bitmask note.' },
          { text: 'Was my child robbed?', why: 'That is the tree note.' },
        ],
        answer: 0,
      },
      solved: 'Stocks: "am I holding?". Trees: "was my child robbed?". Bitmasks: "which cities, and where am I?".',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Exponential brute force, small DP',
      lines: ['Every family has an exponential brute force.', 'The DP keeps only the **minimum information about the past** the future needs.'],
      frames: [
        ['LIS', '2^n', 'O(n log n)'],
        ['k transactions', 'all patterns', 'O(n·k)'],
        ['tree robbery', 'all subsets', 'O(n)'],
        ['burst balloons', 'n!', 'O(n³)'],
        ['superstring', 'n!', 'O(2^n·n²)'],
        ['digits ≤ 10^9', '10^9 nums', 'O(digits)'],
      ].map(([f, b, d]) => ({ say: 0, note: `${f}: brute force tries ${b}; the DP is ${d}.`, panels: [vars({ problem: f, brute: b, DP: d })] })).concat([
        { say: 1, note: 'Each DP keeps only what the future depends on, so it is tiny next to the brute force.', panels: [vars({ keep: 'min info', drop: 'the rest' })] },
      ]),
    },
    {
      kind: 'turn',
      title: 'Your turn: count subsequences',
      lines: ['A subsequence keeps or skips each element, in order.'],
      panels: [arr([5, 1, 7], { label: 'nums' })],
      task: { type: 'number', question: 'How many subsequences (including the empty one) does a 3-element array have?', options: [3, 6, 8, 9], answer: 8, hint: 'Each element is kept or skipped: 2 choices, 3 times.' },
      solved: '2 · 2 · 2 = 8 = 2^3. That is the LIS brute force: 2^n.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Clue → family',
      lines: ['The words in the problem point to a family.', 'The constraints often confirm it.'],
      frames: [
        ...[
          ['"increasing", "nest"', 'LIS'],
          ['"palindrome"', 'center / dp[i][j]'],
          ['"cooldown", "fee"', 'state machine'],
          ['tree + choose nodes', 'tree DP'],
          ['"burst", "cut"', 'interval DP'],
          ['n ≤ 20 + subsets', 'bitmask DP'],
          ['"count numbers ≤ N"', 'digit DP'],
        ].map(([c, f]) => ({ say: 0, note: `${c} → ${f}.`, panels: [vars({ clue: c, try: f })] })),
        ...[
          ['n ≤ 16', 'bitmask'],
          ['n ≤ 500', 'O(n³) interval'],
          ['n ≤ 10^5', 'O(n log n) LIS'],
          ['N ≤ 10^9, count', 'digit DP'],
        ].map(([c, f]) => ({ say: 1, note: `Constraint ${c} → ${f}.`, panels: [vars({ limit: c, family: f })] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: read the constraint',
      lines: ['"Merge adjacent piles; the cost depends on the merged length. n ≤ 500."'],
      panels: [vars({ clue: 'merge, length', n: '≤ 500' })],
      task: {
        type: 'choose',
        question: 'Which family fits?',
        options: [
          { text: 'Interval DP', why: '' },
          { text: 'Bitmask DP', why: '2^500 masks is far too many; bitmask needs n ≤ ~20.' },
          { text: 'Digit DP', why: 'Nothing here counts numbers under a bound.' },
          { text: 'LIS', why: 'There is no increasing subsequence to find.' },
        ],
        answer: 0,
      },
      solved: '"merge" + cost depends on length, and n ≤ 500 allows O(n³): **interval DP**.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Name the family first',
      lines: ['Spot the clue.', 'Name the family.', 'Then write its standard state.'],
      frames: [
        { say: 0, note: 'Clue: "tree" + "no two adjacent".', panels: [vars({ clue: 'tree, no 2 adjacent' })] },
        { say: 1, note: 'Family: tree DP.', panels: [vars({ clue: 'tree, no 2 adjacent', family: 'tree' })] },
        { say: 2, note: 'State: (node, a few flags), returned post-order.', panels: [vars({ clue: 'tree, no 2 adjacent', family: 'tree', state: '(node, flags)' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: buy, sell, wait',
      lines: ['"After you sell, you cannot buy on the next day."'],
      panels: [vars({ clue: 'cooldown' })],
      task: {
        type: 'choose',
        question: 'Which family, and which state?',
        options: [
          { text: 'State machine: (day, mode)', why: '' },
          { text: 'Interval: the range (i, j)', why: 'Days are processed in order; nothing is cut into ranges.' },
          { text: 'Digit: (position, tight)', why: 'Nothing counts numbers under a bound.' },
          { text: 'Palindromic: s[i..j]', why: 'No string reads the same backwards here.' },
        ],
        answer: 0,
      },
      solved: 'Cooldown → **state machine**: (day, hold / sold / rest).',
    },
  ],

  'intuition-lis': [
    {
      kind: 'watch',
      title: 'dp[i] looks back at smaller values',
      lines: ['`dp[i]` = longest strictly increasing subsequence **ending exactly at i**.', 'Extend the best earlier `j` with `nums[j] < nums[i]`, or stand alone (1).'],
      frames: [
        { say: 0, note: 'nums = [3, 1, 4, 1, 5, 9, 2, 6]. One dp cell per index.', panels: [arr(N1, { label: 'nums' }), arr(N1.map(() => '·'), { label: 'dp' })] },
        ...L1.ev.slice(0, 7).map((e) => lisFrame(e, 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: dp[7]',
      lines: ['Green = smaller earlier values. Grey = not smaller.'],
      panels: [
        arr(N1, { label: 'nums', highlights: hl(8, (j) => (j === 7 ? 'active' : L1last.smaller.includes(j) ? 'visited' : 'muted')), pointers: [ptr(7, 'i')] }),
        arr(L1.dp.map((v, j) => (j < 7 ? v : '?')), { label: 'dp', highlights: { 7: 'active' } }),
      ],
      task: { type: 'number', question: 'What is `dp[7]` (for the 6)?', options: [2, 3, 4, 5], answer: L1.dp[7], hint: `Smaller earlier values: ${L1last.smaller.map((j) => N1[j]).join(', ')}. Take the biggest dp among them, plus 1.` },
      solved: `5 has dp 3 → dp[7] = 4, e.g. [3, 4, 5, 6].`,
      then: [
        lisFrame(L1last, 1),
        { say: 1, note: `answer = max(dp) = ${Math.max(...L1.dp)}. Strict: the second 1 could not extend the first.`, panels: [arr(L1.dp, { label: 'dp', highlights: hl(8, (j) => (L1.dp[j] === 4 ? 'done' : '')) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why "ends at i"?',
      lines: ['To extend a subsequence you need to know one thing about it.'],
      panels: [arr([3, 4, 5], { label: 'a subsequence', highlights: { 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Why pin the subsequence to **end at i**?',
        options: [
          { text: 'Extending only needs the last value, and "ends at i" fixes it', why: '' },
          { text: 'So the answer is always dp[n − 1]', why: 'The best one may end anywhere: the answer is max(dp).' },
          { text: 'So the subsequence is contiguous', why: 'A subsequence can still skip elements before i.' },
          { text: 'It makes dp[i] a sum', why: 'dp[i] is a length: 1 + a max, not a sum.' },
        ],
        answer: 0,
      },
      solved: 'The last value is all a new element needs to compare against.',
    },
    {
      kind: 'watch',
      title: 'Counting LIS: cnt[i]',
      lines: ['`cnt[i]` = how many LIS of length `dp[i]` end at i.', 'A **longer** length from j: `cnt[i] = cnt[j]`.', 'The **same** length: `cnt[i] += cnt[j]`.'],
      frames: [
        { say: 0, note: 'nums = [2, 1, 3]. len and cnt start at 1. The 3 looks back.', panels: nlPanels(2, undefined, [1, 1, '·'], [1, 1, '·'], 2, NC) },
        ...NCR.ev.filter((e) => e.i === 2).map((e) => ({
          say: e.what === 'longer' ? 1 : 2,
          note: e.what === 'longer' ? `j = ${e.j}: [${NC[e.j]}, 3] is longer → len = ${e.len[2]}, cnt = cnt[${e.j}] = ${e.cnt[2]}.` : `j = ${e.j}: [${NC[e.j]}, 3] has the same length → cnt += ${e.cnt[e.j]} → ${e.cnt[2]}.`,
          panels: nlPanels(2, e.j, e.len, e.cnt, 2, NC),
        })),
        { say: 0, note: `Two LIS of length 2 end at the 3: [2, 3] and [1, 3].`, panels: nlPanels(2, undefined, NCR.len, NCR.cnt, 2, NC) },
      ],
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'go(i, prev): skip or take',
      lines: ['At each index: **skip** it, or **take** it if it is bigger than `prev`.', 'The same `(i, prev)` pair is asked again and again.', 'Only the pairs matter: memoizing them gives the O(n²) DP.'],
      frames: [
        { say: 0, note: 'nums = [1, 2, 3]. go(0, −∞) starts: no value chosen yet.', panels: [arr([1, 2, 3], { label: 'nums', pointers: [ptr(0, 'i')] }), vars({ i: 0, prev: -Infinity })] },
        { say: 0, note: 'Take 1: go(1, 1). Skip 1: go(1, −∞). Both branches go on.', panels: [arr([1, 2, 3], { label: 'nums', highlights: { 0: 'active' }, pointers: [ptr(1, 'i')] }), vars({ take: 'go(1, 1)', skip: 'go(1, −∞)' })] },
        { say: 1, note: `All ${B3.total} calls, counted per (i, prev). Red = asked more than once.`, panels: [callTable(repeats)] },
        { say: 2, note: `${B3.total} calls, but only ${B3.calls.size} distinct pairs. Answer ${B3.ans}.`, panels: [callTable(repeats), vars({ calls: B3.total, pairs: B3.calls.size })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one more element',
      lines: ['nums = [1, 2, 3, 4]: every value can follow every smaller one.'],
      panels: [arr([1, 2, 3, 4], { label: 'nums' }), vars({ calls: B4.total })],
      task: { type: 'number', question: 'How many distinct (i, prev) pairs does go() visit?', options: [10, 15, 16, 31], answer: B4.calls.size, hint: 'At i, prev is −∞ or one of the i values before it. i runs 0..4.' },
      solved: `1 + 2 + 3 + 4 + 5 = ${B4.calls.size} pairs, against ${B4.total} calls. The gap grows exponentially.`,
    },
  ],

  'optimized-lis': [
    {
      kind: 'watch',
      title: 'tails: the smallest tail per length',
      lines: ['`tails[k]` = smallest last value of an increasing subsequence of length k + 1.', 'Find the first `tails[k] >= x` (lower bound).', 'None → push. Otherwise → replace: a smaller tail is never worse.'],
      frames: [
        { say: 0, note: 'nums = [4, 8, 6, 2, 9, 5]. tails starts empty.', panels: [arr(PA, { label: 'nums' }), arr(['·'], { label: 'tails' })] },
        ...PR.slice(0, 5).map((e, idx) => patFrame(e, idx, e.action === 'push' ? 2 : 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does 5 go?',
      lines: ['Lower bound: the **first** tail that is ≥ x.'],
      panels: [arr(PR[4].after, { label: 'tails' }), vars({ x: 5 })],
      task: { type: 'cell', question: 'Which tails slot does 5 replace?', answer: PR[5].k, hints: { 0: '2 < 5, so 5 can extend it; it is not ≥ 5.', 2: '9 is ≥ 5, but 6 comes first.' } },
      solved: `6 is the first tail ≥ 5 → tails = ${list(PR[5].after)}. Length ${PR[5].after.length} is the answer.`,
      then: [patFrame(PR[5], 5, 2)],
    },
    {
      kind: 'watch',
      title: 'tails is not a subsequence',
      lines: ['Each slot only records the best tail **for its length**.', 'The **length** of tails is the answer; the contents are bookkeeping.'],
      frames: [
        ...NOTSUB.map((e, idx) => ({ say: 0, note: `${e.x} → ${e.action}: tails = ${list(e.after)}.`, panels: [arr([3, 4, 1], { label: 'nums', showIndices: true, highlights: { [idx]: 'active' } }), arr(e.after, { label: 'tails', highlights: { [e.k]: 'active' } })] })),
        { say: 1, note: 'tails = [1, 4], but 1 sits at index 2, after the 4. "1, 4" is not a subsequence. Length 2 is still right: [3, 4].', panels: [arr([3, 4, 1], { label: 'nums', showIndices: true, highlights: { 0: 'done', 1: 'done', 2: 'bad' } }), arr([1, 4], { label: 'tails', highlights: { 0: 'bad' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: sort the envelopes',
      lines: ['An envelope nests only if **both** width and height are strictly smaller.', 'Sort by width ascending; equal widths by height **descending**.'],
      panels: [vars({ envelopes: ENV.map(envName).join(', ') })],
      task: { type: 'order', question: 'Tap the envelopes in sorted order.', items: ENVS.map(envName), hint: 'Width first. The two width-3 envelopes: taller one first.' },
      solved: `Sorted: ${ENVS.map(envName).join(', ')}. Now run LIS on the heights.`,
      then: [
        ...ENVR.map((e, idx) => ({ say: 1, note: `Height ${e.x} → ${e.action}: tails = ${list(e.after)}.`, panels: [arr(ENVS.map(envName), { label: 'sorted', highlights: { [idx]: 'active' } }), arr(e.after, { label: 'tails (heights)', highlights: { [e.k]: 'active' } })] })),
        { say: 1, note: `Answer ${ENVR.at(-1).after.length}. Heights ascending within width 3 would give [3, 4, 5, 6] → 4: 3×4 and 3×5 would "nest" with equal widths.`, panels: [arr(ASC, { label: 'if heights ascending', highlights: { 1: 'bad', 2: 'bad' } })] },
      ],
    },
  ],

  'template-lis': [
    {
      kind: 'watch',
      title: 'One bound(), two meanings',
      lines: ['`strict = true`: first index with `arr[i] >= x` (lower bound).', '`strict = false`: first index with `arr[i] > x` (upper bound).', '`tails[bound(...)] = x` is push **or** replace in one line.'],
      frames: [
        { say: 0, note: 'nums = [2, 2, 3], strict. The second 2 finds the first tail ≥ 2: index 0.', panels: [arr(STRICT[1].before, { label: 'tails', highlights: { 0: 'active' }, pointers: [ptr(0, 'lo')] }), vars({ x: 2, strict: 'true' })] },
        { say: 2, note: `It overwrites tails[0] with 2. Then 3 pushes. Strict LIS = ${STRICT.at(-1).after.length}.`, panels: [arr(STRICT.at(-1).after, { label: 'tails (strict)', highlights: { 1: 'done' } })] },
        { say: 1, note: 'Non-strict: the second 2 looks for the first tail > 2. None → index 1 = length.', panels: [arr([...LOOSE[1].before, '·'], { label: 'tails', highlights: { 1: 'active' }, pointers: [ptr(1, 'lo')] }), vars({ x: 2, strict: 'false' })] },
        { say: 2, note: `tails[1] = 2 is a push. Then 3 pushes. Non-decreasing LIS = ${LOOSE.at(-1).after.length}.`, panels: [arr(LOOSE.at(-1).after, { label: 'tails (non-strict)', highlights: { 1: 'done', 2: 'done' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Inside bound(): lo, mid, hi',
      lines: ['`mid = (lo + hi) >> 1`.', 'Too small → `lo = mid + 1`; else `hi = mid`. Stop when lo = hi.'],
      frames: [{ say: 0, note: `tails = ${list(BT)}, x = 3, strict = true. lo = 0, hi = 4.`, panels: [arr(BT, { label: 'tails', pointers: [ptr(0, 'lo', 'b')] })] }, ...boundFrames(BT, 3, true, 1)],
    },
    {
      kind: 'turn',
      title: 'Your turn: upper bound',
      lines: ['Same tails, same x = 3, but `strict = false`.'],
      panels: [arr(BT, { label: 'tails' }), vars({ x: 3, strict: 'false' })],
      task: { type: 'cell', question: 'Which index does `bound(tails, 3, false)` return?', answer: UB.k, hints: { 1: 'That is the lower bound (first ≥ 3). Here we want the first > 3.', 2: '3 is not > 3; keep going right.', 0: '1 is not > 3.' } },
      solved: 'First value > 3 is 5, at index 3: an equal 3 can follow the 3s.',
      then: boundFrames(BT, 3, false, 1),
    },
  ],

  'implementation-lis': [
    {
      kind: 'watch',
      title: 'len and cnt, row by row',
      lines: ['`len[i]`, `cnt[i]` start at 1.', 'For each j < i with a smaller value: longer → copy cnt; equal → add cnt.'],
      frames: [
        { say: 0, note: 'nums = [1, 3, 5, 4, 7]. len and cnt all start at 1.', panels: nlPanels(0, undefined, [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], 0) },
        ...[1, 2, 3].map((i) => {
          const e = atRow(i);
          return { say: 1, note: `i = ${i} (${NL[i]}): len ${e.len[i]}, cnt ${e.cnt[i]}.`, panels: nlPanels(i, undefined, e.len, e.cnt, i) };
        }),
        { say: 1, note: 'i = 3 (4): the 5 before it is bigger → skipped (`continue`). Best is 3 via [1, 3, 4].', panels: nlPanels(3, 2, atRow(3).len, atRow(3).cnt, 3) },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: cnt for the 7',
      lines: ['Both the 5 and the 4 have len 3 and cnt 1.'],
      panels: nlPanels(4, undefined, NR.len.map((v, k) => (k === 4 ? '?' : v)), NR.cnt.map((v, k) => (k === 4 ? '?' : v)), 4),
      task: { type: 'number', question: 'After the inner loop, what is `cnt[4]`?', options: [1, 2, 3, 4], answer: NR.cnt[4], hint: 'The 5 sets len 4 (copy its cnt). The 4 ties len 4 (add its cnt).' },
      solved: `cnt[4] = 1 + 1 = ${NR.cnt[4]}: [1, 3, 5, 7] and [1, 3, 4, 7].`,
      then: [
        ...NR.ev.filter((e) => e.i === 4).map((e) => ({ say: 1, note: nlNote(e), panels: nlPanels(4, e.j, e.len, e.cnt, 4) })),
        { say: 1, note: `best = ${NR.best}; only index 4 has it → total = ${NR.total}.`, panels: [arr(NR.len, { label: 'len', highlights: { 4: 'done' } }), arr(NR.cnt, { label: 'cnt', highlights: { 4: 'done' } }), vars({ best: NR.best, total: NR.total })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: all equal',
      lines: ['`if (nums[j] >= nums[i]) continue;` — strictly increasing only.'],
      panels: [arr([2, 2, 2, 2, 2], { label: 'nums' })],
      task: { type: 'number', question: 'What does `findNumberOfLIS([2, 2, 2, 2, 2])` return?', options: [1, 2, 5, 10], answer: NR2.total, hint: 'Every j is skipped. len stays 1 everywhere; add up the cnt of every index with len 1.' },
      solved: `Every element alone is an LIS of length 1 → total = ${NR2.total}.`,
    },
  ],

  'dry-run-lis': [
    {
      kind: 'watch',
      title: 'Patience sorting on the lesson input',
      lines: ['For each x: lower bound k in tails.', 'k = length → push; otherwise replace tails[k].'],
      frames: DR.slice(0, 7).map((e, idx) => drFrame(idx, e.action === 'push' ? 1 : 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last number',
      lines: ['x = 18. Find the first tail ≥ 18.'],
      panels: [arr(DR[6].after, { label: 'tails' }), vars({ x: 18 })],
      task: { type: 'cell', question: 'Which slot does 18 take?', answer: DR[7].k, hints: { 2: '7 < 18, so 18 can extend it.', 0: '2 < 18.', 1: '3 < 18.' } },
      solved: '101 is the first tail ≥ 18 → replace it: [2, 3, 7, 18]. Answer = tails.length = 4.',
      then: [drFrame(7, 0), { say: 1, note: 'Answer = tails.length = 4.', panels: [arr(DR[7].after, { label: 'tails', highlights: hl(4, () => 'done') }), vars({ answer: 4 })] }],
    },
  ],

  'intuition-palindrome': [
    {
      kind: 'watch',
      title: 'Built from the middle outwards',
      lines: ['"racecar" = "r" + "aceca" + "r".', '"aceca" = "a" + "cec" + "a", and so on.'],
      frames: [[0, 6], [1, 5], [2, 4], [3, 3]].map(([l, r], k) => ({
        say: k === 0 ? 0 : 1,
        note: l === r ? 'The middle "e": a single character is a palindrome.' : `s[${l}] = s[${r}] = ${RACE[l]}: the ends match; the inside must be a palindrome too.`,
        panels: [arr(RACE, { label: 's', highlights: hl(7, (j) => (j === l || j === r ? 'active' : j > l && j < r ? 'window' : 'muted')), pointers: [ptr(l, 'l'), ...(l !== r ? [ptr(r, 'r', 'b')] : [])] })],
      })),
    },
    {
      kind: 'watch',
      title: 'isPal[i][j] by increasing length',
      lines: ['`isPal[i][j] = s[i] === s[j] && (j − i < 2 || isPal[i + 1][j − 1])`.', 'Fill by increasing length, so the inside is ready.'],
      frames: IP.map((b, k) => ({
        say: k < 2 ? 1 : 0,
        note: ipNotes[k],
        panels: [table(rcLab(AB), AB.split(''), b.t, sm(4, 4, { ...mk(b.cells.flatMap((c) => c.reads), 'visited'), ...mk(b.cells.map((c) => [c.i, c.j]), 'active') }), `length ${b.L}`)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: count the T cells',
      lines: ['Each T cell is one palindromic substring s[i..j].'],
      panels: [table(rcLab(AB), AB.split(''), IP.at(-1).t, sm(4, 4, mk(IP.at(-1).t.flatMap((r, i) => r.map((v, j) => [i, j, v])).filter((x) => x[2] === true).map(([i, j]) => [i, j]), 'done')), 'isPal')],
      task: { type: 'number', question: 'How many palindromic substrings does "abba" have?', options: [4, 5, 6, 7], answer: ipCount, hint: '4 single letters, plus every longer T.' },
      solved: `4 singles + "bb" + "abba" = ${ipCount}.`,
    },
    {
      kind: 'watch',
      title: 'Subsequence: dp[i][j] over s[i..j]',
      lines: ['Ends equal → `dp[i+1][j-1] + 2` (both ends join).', 'Otherwise → `max(dp[i+1][j], dp[i][j-1])` (drop one end).', 'i goes from n − 1 down, j upward.'],
      frames: LP.ev.map((e) => lpFrame('abca', e, e.i === e.j ? 2 : e.eq ? 0 : 1)).concat([{ say: 0, note: `dp[0][3] = ${LP.ans}: e.g. "aca" or "aba".`, panels: [table(rcLab('abca'), 'abca'.split(''), LP.ev.at(-1).show, sm(4, 4, { '0,3': 'done' }), 'dp[i][j]')] }]),
    },
    {
      kind: 'turn',
      title: 'Your turn: "abab"',
      lines: ['Characters may be skipped.'],
      panels: [arr('abab'.split(''), { label: 's', showIndices: true })],
      task: { type: 'number', question: 'Longest palindromic subsequence of "abab"?', options: [1, 2, 3, 4], answer: lpsRun('abab').ans, hint: 'Try keeping a, b, a or b, a, b.' },
      solved: '"aba" (or "bab") → 3. The table gives dp[0][3] = 3.',
    },
  ],

  'optimized-palindrome': [
    {
      kind: 'watch',
      title: 'Expand around each center',
      lines: ['For each c: `expand(c, c)` (odd) and `expand(c, c + 1)` (even).', 'Grow while the ends match; length = `r − l − 1`.', 'A longer one: `start = c − floor((len − 1) / 2)`.'],
      frames: [
        { say: 0, note: 's = "cabbad". Try every center.', panels: [arr(CS.split(''), { label: 's', showIndices: true }), vars({ start: 0, bestLen: 0 })] },
        cFrame(0, 2),
        cFrame(1, 0),
        ...evenMoves.map(([l, r]) => ({ say: 1, note: `c = 2, even: s[${l}] = s[${r}] = ${CS[l]} → grow.`, panels: [arr(CS.split(''), { label: 's', highlights: hl(6, (j) => (j >= l && j <= r ? 'active' : '')), pointers: [ptr(l, 'l'), ptr(r, 'r', 'b')] })] })),
        { say: 1, note: 'Next: s[0] = c ≠ s[5] = d → stop. l = 0, r = 5 → length 5 − 0 − 1 = 4.', panels: [arr(CS.split(''), { label: 's', highlights: { 0: 'bad', 5: 'bad', 1: 'window', 2: 'window', 3: 'window', 4: 'window' }, pointers: [ptr(0, 'l'), ptr(5, 'r', 'b')] }), vars({ len: 4 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it start?',
      lines: ['c = 2, len = 4 beats bestLen 1.'],
      panels: [arr(CS.split(''), { label: 's', showIndices: true, pointers: [ptr(2, 'c')] }), vars({ c: 2, len: 4 })],
      task: { type: 'number', question: 'start = c − floor((len − 1) / 2) = ?', options: [0, 1, 2, 3], answer: EX.centers[2].start, hint: '(4 − 1) / 2 = 1.5, floored to 1.' },
      solved: '2 − 1 = 1: "abba" starts at index 1.',
      then: [3, 4, 5].map((k) => cFrame(k, 0)).concat([{ say: 2, note: `slice(1, 5) = "${EX.ans}".`, panels: [arr(CS.split(''), { label: 's', highlights: { 1: 'done', 2: 'done', 3: 'done', 4: 'done' } }), vars({ start: 1, bestLen: 4 })] }]),
    },
    {
      kind: 'watch',
      title: 'Subsequence: i must go down',
      lines: ['`dp[i][j]` reads `dp[i + 1][…]`, the row **below**.', 'So i goes from n − 1 down to 0; j goes up from i + 1.'],
      frames: [
        { say: 0, note: 'dp[1][3] reads dp[2][2], dp[2][3] and dp[1][2]: below or to the left.', panels: [table(['0', '1', '2', '3'], ['0', '1', '2', '3'], foCells(0), sm(4, 4, { '1,3': 'active', '2,2': 'visited', '2,3': 'visited', '1,2': 'visited' }), 'reads')] },
        ...[1, 3, 6, 10].map((u) => ({ say: 1, note: `Row ${4 - [1, 3, 6, 10].indexOf(u) - 1} done. Numbers = fill order.`, panels: [table(['0', '1', '2', '3'], ['0', '1', '2', '3'], foCells(u), sm(4, 4, mk(FO.slice(0, u), 'done')), 'fill order')] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the fill order',
      lines: ['Rows from the bottom; inside a row, left to right.'],
      panels: [table(['0', '1', '2', '3'], ['0', '1', '2', '3'], foCells(1), sm(4, 4, { '3,3': 'done' }), 'fill order')],
      task: { type: 'order', question: 'Tap these cells in the order the loops fill them.', items: ['dp[2][2]', 'dp[2][3]', 'dp[1][1]', 'dp[1][2]'], hint: 'Row 2 before row 1; inside a row, the diagonal first.' },
      solved: 'Row 2 (i = 2) is finished before row 1 starts, so dp[1][…] can read it.',
    },
  ],

  'implementation-palindrome': [
    {
      kind: 'watch',
      title: 'Two rows instead of a table',
      lines: ['`next` = row i + 1; `cur` = row i.', '`next[j − 1]` = dp[i+1][j−1], `next[j]` = dp[i+1][j], `cur[j − 1]` = dp[i][j−1].', 'After the row: `next = cur`.'],
      frames: RR.fr.slice(0, rrTurn).map((f) => ({ say: f.j === f.i ? 0 : 1, note: f.note, panels: rrPanels(f) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: which cell is read?',
      lines: ['i = 0, j = 3: s[0] = b and s[3] = b match.'],
      panels: [arr(RR.fr[rrTurn].next, { label: 'next (row 1)' }), arr(RR.fr[rrTurn - 1].cur, { label: 'cur (row 0)', highlights: { 3: 'active' } })],
      task: { type: 'cell', question: 'Ends match: which `next` cell gives dp[i+1][j−1]?', answer: 2, hints: { 3: 'next[3] = dp[1][3]: that is the "drop an end" option.', 1: 'next[1] is dp[1][1]; j − 1 is 2.', 0: 'next[0] belongs to row 1, column 0: below the diagonal.' } },
      solved: `next[2] = ${RR.fr[rrTurn].next[2]} → cur[3] = ${RR.fr[rrTurn].next[2]} + 2 = ${RR.ans}.`,
      then: [
        { say: 1, note: RR.fr[rrTurn].note, panels: rrPanels(RR.fr[rrTurn]) },
        { say: 2, note: `next = cur; return next[n − 1] = ${RR.ans} ("bbb").`, panels: [arr(RR.fr.at(-1).cur, { label: 'next (row 0)', highlights: { 3: 'done' } }), vars({ answer: RR.ans })] },
      ],
    },
  ],

  'intuition-state-machine': [
    {
      kind: 'watch',
      title: 'Three situations at day end',
      lines: ['**HOLD**: keep holding, or buy from REST.', '**SOLD**: sold today; only from HOLD.', '**REST**: idle, or the cooldown after SOLD ends.', 'Each arrow is one term in a `max`.'],
      frames: [
        { say: 3, note: 'Five arrows, three states.', panels: [smPanel()] },
        { say: 0, note: 'hold = max(hold, rest − p): keep, or buy from REST.', panels: [smPanel({ 1: 'active' }, { '1-1': 'active', '0-1': 'active' }), vars({ hold: 'max(keep, buy)' })] },
        { say: 1, note: 'sold = hold + p: the only way in is selling.', panels: [smPanel({ 2: 'active' }, { '1-2': 'active' }), vars({ sold: 'hold + p' })] },
        { say: 2, note: 'rest = max(rest, sold): idle, or the cooldown finishes.', panels: [smPanel({ 0: 'active' }, { '0-0': 'active', '2-0': 'active' }), vars({ rest: 'max(rest, sold)' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the missing arrow',
      lines: ['Cooldown: after selling you must rest a day.'],
      panels: [smPanel()],
      task: {
        type: 'choose',
        question: 'Which arrow is left out **on purpose**?',
        options: [
          { text: 'SOLD → HOLD', why: '' },
          { text: 'REST → HOLD', why: 'That is the buy arrow: allowed.' },
          { text: 'HOLD → SOLD', why: 'That is the sell arrow: the only way into SOLD.' },
          { text: 'SOLD → REST', why: 'That is the cooldown finishing: needed.' },
        ],
        answer: 0,
      },
      solved: 'No buy straight after a sale: buying only comes from REST.',
    },
    {
      kind: 'watch',
      title: 'Day by day',
      lines: ['Start: hold = −∞, sold = 0, rest = 0.', 'Each day reads only **yesterday\'s** three values.', 'Green arrows won the `max`.', 'Answer = max(sold, rest).'],
      frames: [
        { say: 0, note: 'Before day 0: you cannot hold without buying.', panels: [arr(SP, { label: 'prices' }), smPanel(), vars({ hold: -Infinity, sold: 0, rest: 0 })] },
        ...SC.days.map((d, k) => ({ ...smDay(d, k, SP), say: k === 0 ? 1 : 2 })),
        { say: 3, note: `max(sold ${SC.days[2].sold}, rest ${SC.days[2].rest}) = ${SC.ans}: buy at 1, sell at 4.`, panels: [arr(SP, { label: 'prices', highlights: { 1: 'done', 2: 'done' } }), vars({ answer: SC.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one more day',
      lines: ['Add day 3 with price 2. Yesterday: hold −1, sold 3, rest 0.'],
      panels: [arr([2, 1, 4, 2], { label: 'prices', highlights: { 3: 'active' } }), smPanel({ 0: 'active' }, { '0-0': 'active', '2-0': 'active' }), vars({ hold: -1, sold: 3, rest: 0 })],
      task: { type: 'number', question: 'rest on day 3 = max(rest, sold) = ?', options: [0, 1, 2, 3], answer: SC4.days[3].rest, hint: 'Use yesterday\'s sold, not today\'s.' },
      solved: 'max(0, 3) = 3: the cooldown after the sale finishes.',
    },
    {
      kind: 'watch',
      title: 'Why yesterday\'s values',
      lines: ['Updating one variable after another lets a day use **today\'s** value.', 'Here: sold, then rest from the new sold, then hold from the new rest.'],
      frames: [
        { say: 0, note: `prices = [1, 2, 1, 2]. Correct answer: ${GOOD.ans} (buy 1, sell 2, then cooldown).`, panels: [arr(BUGP, { label: 'prices' }), vars({ correct: GOOD.ans })] },
        { say: 1, note: `In-place, day 1: sold = ${BAD.days[1].sold}, rest = ${BAD.days[1].rest} at once: the cooldown "finished" the same day.`, panels: [arr(BUGP, { label: 'prices', highlights: { 1: 'bad' } }), vars({ sold: BAD.days[1].sold, rest: BAD.days[1].rest })] },
        { say: 1, note: `Day 2: hold = ${BAD.days[2].hold}: it buys right after selling.`, panels: [arr(BUGP, { label: 'prices', highlights: { 1: 'bad', 2: 'bad' } }), vars({ hold: BAD.days[2].hold })] },
        { say: 0, note: `In-place answer ${BAD.ans}, true answer ${GOOD.ans}. Snapshot yesterday first.`, panels: [vars({ 'in-place': BAD.ans, correct: GOOD.ans })] },
      ],
    },
  ],

  'optimized-state-machine': [
    {
      kind: 'watch',
      title: 'Fee: two states, cash and hold',
      lines: ['`cash = max(cash, hold + price − fee)`', '`hold = max(hold, cash − price)`', 'We start with cash 0 and hold −∞ (no share yet).'],
      frames: [0, 1, 2, 3, 4].map((k) => feeFrame(k, k === 0 ? 2 : 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last day',
      lines: ['Price 9. Yesterday: cash 5, hold 1. Fee 2.'],
      panels: [arr(FP, { label: 'prices (fee 2)', highlights: { 5: 'active' } }), vars({ cash: 5, hold: 1 })],
      task: { type: 'number', question: 'cash after price 9?', options: [5, 6, 8, 10], answer: FR[5].cash, hint: 'max(cash, hold + 9 − 2).' },
      solved: `max(5, 1 + 9 − 2) = ${FR[5].cash}: buy 1 sell 8, buy 4 sell 9, minus 2 fees.`,
      then: [feeFrame(5, 0)],
    },
    {
      kind: 'watch',
      title: 'k transactions: buy[j], sell[j]',
      lines: ['`buy[j] = max(buy[j], sell[j−1] − p)`', '`sell[j] = max(sell[j], buy[j] + p)`', 'If `k >= n / 2`, the limit never binds.'],
      frames: [
        { say: 0, note: 'buy[j] grows out of sell[j − 1]: the j-th buy needs j − 1 finished sales.', panels: [arr(['-∞', '·', '·'], { label: 'buy[j]', highlights: { 1: 'active' } }), arr([0, '·', '·'], { label: 'sell[j]', highlights: { 0: 'visited' } })] },
        { say: 1, note: 'sell[j] grows out of buy[j]: sell the j-th share.', panels: [arr(['-∞', '·', '·'], { label: 'buy[j]', highlights: { 1: 'visited' } }), arr([0, '·', '·'], { label: 'sell[j]', highlights: { 1: 'active' } })] },
        { say: 2, note: 'A transaction needs 2 days, so n days allow at most n / 2 of them.', panels: [vars({ n: 6, 'max trades': 3 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the greedy fallback',
      lines: ['k = 2, prices = [1, 5, 3, 6], so n / 2 = 2.', 'k ≥ n / 2 → sum every positive day-to-day rise.'],
      panels: [arr(GP, { label: 'prices' }), vars({ k: 2, n: 4 })],
      task: { type: 'number', question: 'What profit does the fallback return?', options: [3, 5, 7, 9], answer: G.ans, hint: 'Rises: 1→5, 3→6. The drop 5→3 counts 0.' },
      solved: `4 + 0 + 3 = ${G.ans}.`,
    },
  ],

  'template-state-machine': [
    {
      kind: 'watch',
      title: 'First, the guard',
      lines: ['`if (k >= n >> 1)`: unlimited in practice → greedy sum.', 'Otherwise: `buy` filled with −∞, `sell` with 0, size k + 1.'],
      frames: [
        { say: 0, note: 'k = 2, n = 4: 2 ≥ 2 → greedy branch.', panels: [vars({ k: 2, 'n >> 1': 2, branch: 'greedy' })] },
        { say: 1, note: `k = 2, n = 6: 2 < 3 → DP. prices = ${list(KP)}.`, panels: [arr(KP, { label: 'prices' }), arr([-Infinity, -Infinity, -Infinity], { label: 'buy[j]' }), arr([0, 0, 0], { label: 'sell[j]' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Inside one price: j = 1, then j = 2',
      lines: ['`buy[j]` reads `sell[j − 1]`.', '`sell[j]` reads `buy[j]`.'],
      frames: [
        { say: 0, note: `Before price 5: buy = ${list(KR.ev[7].buy)}, sell = ${list(KR.ev[7].sell)}.`, panels: kPanels(KR.ev[7], 2, {}) },
        ...KD.map((e) => ({
          say: e.what === 'buy' ? 0 : 1,
          note: e.what === 'buy' ? `buy[${e.j}] = max(old, sell[${e.j - 1}] − 5) = ${fv(e.buy[e.j])}.` : `sell[${e.j}] = max(old, buy[${e.j}] + 5) = ${fv(e.sell[e.j])}.`,
          panels: kPanels(e, 2, e.what === 'buy' ? { buy: { [e.j]: 'active' }, sell: { [e.j - 1]: 'visited' } } : { sell: { [e.j]: 'active' }, buy: { [e.j]: 'visited' } }),
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: update order',
      lines: ['The inner loop runs j = 1..k, two lines each.'],
      panels: [arr([-Infinity, -Infinity, -Infinity], { label: 'buy[j]' }), arr([0, 0, 0], { label: 'sell[j]' })],
      task: { type: 'order', question: 'k = 2: tap the four updates for one price in order.', items: ['buy[1]', 'sell[1]', 'buy[2]', 'sell[2]'], hint: 'j = 1 first; inside each j, the buy line comes first.' },
      solved: 'buy[1], sell[1], buy[2], sell[2] for every price.',
    },
    {
      kind: 'watch',
      title: 'Price by price',
      lines: ['After each price, the two arrays.', 'The answer is `sell[k]`.'],
      frames: kAfterPrice.slice(0, 5).map((e, idx) => ({ say: 0, note: `Price ${e.p}: buy = ${list(e.buy)}, sell = ${list(e.sell)}.`, panels: kPanels(e, idx, { sell: { 2: 'active' } }) })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last price',
      lines: [`Price 3. buy = ${list(kAfterPrice[4].buy)}, sell = ${list(kAfterPrice[4].sell)}.`],
      panels: kPanels(kAfterPrice[4], 5, { buy: { 2: 'visited' }, sell: { 2: 'active' } }),
      task: { type: 'number', question: 'What does `maxProfit(2, prices)` return?', options: [3, 5, 6, 8], answer: KR.ans, hint: 'sell[2] = max(old sell[2], buy[2] + 3). buy[2] is updated first this round.' },
      solved: `sell[2] = ${KR.ans}: buy 3 sell 5, buy 0 sell 3.`,
      then: [{ say: 1, note: `sell[k] = ${KR.ans}.`, panels: kPanels(kAfterPrice[5], 5, { sell: { 2: 'done' } }) }],
    },
  ],

  'implementation-state-machine': [
    {
      kind: 'watch',
      title: 'Dry run: prices = [1, 2, 3, 0, 2]',
      lines: ['`[hold, sold, rest] = [max(hold, rest − p), hold + p, max(rest, sold)]`', 'The whole right side uses yesterday\'s values.'],
      frames: [
        { say: 0, note: 'Start: hold −∞, sold 0, rest 0.', panels: [table(['0', '1', '2', '3', '4'], ['p', 'hold', 'sold', 'rest'], IMP.map((p) => [p, '·', '·', '·']), undefined, 'day'), vars({ hold: -Infinity, sold: 0, rest: 0 })] },
        ...[0, 1, 2].map((k) => impFrame(k, 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: day 3 hold',
      lines: ['Price 0. Yesterday: hold −1, rest 1.'],
      panels: [impTable(3, 1), vars({ 'yesterday hold': -1, rest: 1 })],
      task: { type: 'number', question: 'hold on day 3 = max(hold, rest − p) = ?', options: [-1, 0, 1, 2], answer: IR.days[3].hold, hint: 'rest − 0 = 1. Compare with −1.' },
      solved: 'max(−1, 1 − 0) = 1: buy at price 0 after the cooldown.',
      then: [impFrame(3, 1), impFrame(4, 1), { say: 0, note: `Answer max(sold ${IR.days[4].sold}, rest ${IR.days[4].rest}) = ${IR.ans}: buy 1, sell 2, cooldown, buy 0, sell 2.`, panels: [impTable(4), vars({ answer: IR.ans })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: why destructuring?',
      lines: ['Array destructuring evaluates the whole right side first.'],
      panels: [vars({ hold: 'max(hold, rest−p)', sold: 'hold + p', rest: 'max(rest, sold)' })],
      task: {
        type: 'choose',
        question: 'What does the one-line `[hold, sold, rest] = [...]` give you?',
        options: [
          { text: 'All three new values are computed from yesterday\'s values', why: '' },
          { text: 'It is faster than three lines', why: 'Speed is not the point; correctness is.' },
          { text: 'It lets sold use today\'s hold', why: 'The opposite: it stops today\'s values leaking into each other.' },
          { text: 'It initialises hold to −∞', why: 'That happens in the `let` line before the loop.' },
        ],
        answer: 0,
      },
      solved: 'One snapshot of yesterday, so every arrow consumes exactly one day.',
    },
  ],
};

// `then` frames explain the turn's own lines; a builder's say aimed at the watch's lines points to the turn's first line.
for (const steps of Object.values(STEPS))
  for (const st of steps) for (const f of st.then || []) if (f.say >= st.lines.length) f.say = 0;

export default { ...STEPS, ...secondPart };
