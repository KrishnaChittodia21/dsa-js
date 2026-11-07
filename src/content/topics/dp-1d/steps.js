// Step lessons for DP 1D (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every dp value, memo hit, call count and answer below comes from running the lesson's own code on the example.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stk = (values, label = 'call stack') => ({ kind: 'stack', values, label });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const inf = (v) => (v === Infinity ? '∞' : v);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-1d/steps.js: ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// a table that reveals its rows one by one: k = row being revealed now
const reveal = (rows, cols, k) =>
  table(rows.map((r) => r[0]), cols, rows.map((r, i) => r.slice(1).map((c) => (i <= k ? c : '?'))), rows.map((r, i) => r.slice(1).map(() => (i === k ? 'active' : i < k ? 'done' : ''))));
// dp filled up to `upto` (inclusive), the rest blank
const upto = (dp, k, blank = '·') => dp.map((v, i) => (i <= k ? inf(v) : blank));
// cell i is being computed, the cells it reads are windows, earlier ones done
const fillHl = (n, i, reads = []) => hl(n, (k) => (k === i ? 'active' : reads.includes(k) ? 'window' : k < i ? 'done' : ''));

// ---------- recorder: run a recursion, keep every call / return (from recursion/steps.js) ----------
function record(run) {
  const nodes = [];
  const ev = [];
  const open = [];
  const call = (label, fn, tag) => {
    const id = nodes.length;
    nodes.push({ id, label, tag, parent: open.length ? open.at(-1) : null, depth: open.length });
    open.push(id);
    ev.push({ kind: 'call', id, open: open.slice() });
    const v = fn();
    open.pop();
    nodes[id].v = v;
    ev.push({ kind: 'ret', id, v, open: open.slice() });
    return v;
  };
  const value = run(call);
  let leaf = 0;
  const place = (id) => {
    const kids = nodes.filter((n) => n.parent === id);
    nodes[id].x = kids.length ? kids.map((k) => place(k.id)).reduce((a, b) => a + b, 0) / kids.length : leaf++;
    return nodes[id].x;
  };
  place(0);
  return { nodes, ev, value };
}
// the tree after event t: unseen calls hidden, the open path visited, finished calls done (value on the edge).
// bad: ids drawn red once seen (repeated work); hits: memo hits drawn as visited
function treeAt(rec, t, { bad = [], label } = {}) {
  const seen = new Set();
  const done = new Map();
  for (let k = 0; k <= t; k++) {
    const e = rec.ev[k];
    if (e.kind === 'call') seen.add(e.id);
    else done.set(e.id, e.v);
  }
  const cur = rec.ev[t];
  const open = new Set(cur.open);
  return {
    kind: 'nodes',
    ...(label ? { label } : {}),
    nodes: rec.nodes.map((n) => {
      const state = !seen.has(n.id) ? 'hidden' : n.id === cur.id ? 'active' : bad.includes(n.id) ? 'bad' : n.tag === 'hit' ? 'visited' : done.has(n.id) ? 'done' : open.has(n.id) ? 'visited' : undefined;
      return { id: n.id, label: n.label, x: n.x, y: n.depth, ...(state ? { state } : {}) };
    }),
    edges: rec.nodes
      .filter((n) => n.parent !== null)
      .map((n) => ({ from: n.parent, to: n.id, ...(done.has(n.id) ? { label: String(done.get(n.id)), state: 'done' } : open.has(n.id) ? { state: 'active' } : {}) })),
  };
}
const last = (rec) => rec.ev.length - 1;
const numOf = (label) => +label.slice(1);

// ---------- the lesson's code ----------
// ways(n) = ways(n − 1) + ways(n − 2), ways(0) = ways(1) = 1
const waysTable = (n) => {
  const dp = [1, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp;
};
// plain climb(n)
const climbRec = (n) => record((call) => { const climb = (k) => call(`w${k}`, () => (k <= 1 ? 1 : climb(k - 1) + climb(k - 2))); return climb(n); });
// memoized climb(n): base case first, then the memo check (the lesson's order)
const climbMemoRec = (n) =>
  record((call) => {
    const memo = new Map();
    const climb = (k) => {
      if (k > 1 && memo.has(k)) return call(`w${k}`, () => memo.get(k), 'hit');
      return call(`w${k}`, () => {
        if (k <= 1) return 1;
        const ans = climb(k - 1) + climb(k - 2);
        memo.set(k, ans);
        return ans;
      });
    };
    return climb(n);
  });
// brute-force rob(nums, i)
const robRec = (nums) => record((call) => { const rob = (i) => call(`r${i}`, () => (i < 0 ? 0 : Math.max(rob(i - 1), nums[i] + rob(i - 2)))); return rob(nums.length - 1); });
const robCalls = (n) => (n < 0 ? 1 : 1 + robCalls(n - 1) + robCalls(n - 2)); // calls made by rob(i = n)
// memoized best(i); memo snapshot taken at every event
function robMemoRec(nums) {
  const memo = new Array(nums.length).fill(-1);
  const snaps = [];
  const rec = record((call) => {
    const best = (i) => {
      if (i >= 0 && memo[i] !== -1) return call(`b${i}`, () => memo[i], 'hit');
      return call(`b${i}`, () => {
        if (i < 0) return 0;
        memo[i] = Math.max(best(i - 1), nums[i] + best(i - 2));
        return memo[i];
      });
    };
    return best(nums.length - 1);
  });
  // replay memo writes: a non-hit return with i >= 0 stores memo[i]
  const m = new Array(nums.length).fill(-1);
  rec.ev.forEach((e) => {
    const n = rec.nodes[e.id];
    if (e.kind === 'ret' && n.tag !== 'hit' && numOf(n.label) >= 0) m[numOf(n.label)] = e.v;
    snaps.push(m.slice());
  });
  check(same(m, memo), 'memo replay');
  return { rec, snaps };
}
// tabulated house robber over the first i houses
const robTab = (nums) => {
  const n = nums.length;
  const dp = new Array(n + 1).fill(0);
  dp[1] = nums[0] ?? 0;
  for (let i = 2; i <= n; i++) dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i - 1]);
  return dp;
};
// O(1)-space robber, one row per house; swapped = the shift done in the wrong order
const robRoll = (nums, swapped = false) => {
  let prev2 = 0;
  let prev1 = 0;
  const rows = [];
  for (const money of nums) {
    const cur = Math.max(prev1, prev2 + money);
    rows.push({ money, take: prev2 + money, takeFrom: prev2, skip: prev1, cur });
    if (swapped) { prev1 = cur; prev2 = prev1; } else { prev2 = prev1; prev1 = cur; }
    Object.assign(rows.at(-1), { prev2, prev1 });
  }
  return { rows, ans: prev1 };
};
const robLinear = (nums) => robRoll(nums).ans;
// coin change (fewest coins); trace = per amount, the candidates dp[x − c] + 1
function coinChange(coins, amount, init = Infinity) {
  const dp = new Array(amount + 1).fill(init);
  dp[0] = 0;
  const trace = [null];
  for (let x = 1; x <= amount; x++) {
    const tries = [];
    for (const c of coins) {
      if (c <= x) {
        tries.push({ c, from: x - c, val: dp[x - c] + 1 });
        if (dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
      }
    }
    trace.push(tries);
  }
  return { dp, trace, ans: dp[amount] === Infinity ? -1 : dp[amount] };
}
// combination sum IV (amount outside) and the swapped order (numbers outside)
const comboOrdered = (nums, target) => {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  for (let x = 1; x <= target; x++) for (const n of nums) if (n <= x) dp[x] += dp[x - n];
  return dp;
};
const comboUnordered = (nums, target) => {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  for (const n of nums) for (let x = n; x <= target; x++) dp[x] += dp[x - n];
  return dp;
};
// decode ways as a full table: dp[i] for the first i characters
function decode(s) {
  const dp = [1, s[0] === '0' ? 0 : 1];
  const parts = [null, null];
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    const one = s[i - 1] !== '0';
    if (one) cur += dp[i - 1];
    const two = Number(s.slice(i - 2, i));
    const twoOk = two >= 10 && two <= 26;
    if (twoOk) cur += dp[i - 2];
    dp.push(cur);
    parts.push({ one, two: s.slice(i - 2, i), twoOk });
  }
  return { dp, parts };
}
// the lesson's O(1) numDecodings, to cross-check the table
const numDecodings = (s) => {
  let prev2 = 1;
  let prev1 = s[0] === '0' ? 0 : 1;
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    if (s[i - 1] !== '0') cur += prev1;
    const two = Number(s.slice(i - 2, i));
    if (two >= 10 && two <= 26) cur += prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
};
// word break; by[i] = the j that set dp[i] (first one the loop meets)
function wordBreak(s, words) {
  const dict = new Set(words);
  const dp = new Array(s.length + 1).fill(false);
  const by = new Array(s.length + 1).fill(null);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; by[i] = j; break; }
    }
  }
  return { dp, by };
}

// ---------- data ----------
const WAYS = waysTable(5);
check(same(WAYS, [1, 1, 2, 3, 5, 8]), 'ways(0..5)');
const CLIMB4 = climbRec(4);
check(CLIMB4.value === 5 && CLIMB4.nodes.length === 9, 'climb(4): 9 calls, answer 5');
const countOf = (rec, label) => rec.nodes.filter((n) => n.label === label).length;
check(countOf(CLIMB4, 'w2') === 2 && countOf(CLIMB4, 'w3') === 1, 'climb(4): w2 twice');
const CLIMB5 = climbRec(5);
check(countOf(CLIMB5, 'w3') === 2 && countOf(CLIMB5, 'w2') === 3, 'lesson: ways(3) twice, ways(2) three times for n = 5');
const MEMO4 = climbMemoRec(4);
check(MEMO4.value === 5 && MEMO4.nodes.length === 7 && MEMO4.nodes.filter((n) => n.tag === 'hit').length === 1, 'memo climb(4)');

const ROB3 = [2, 7, 9];
const ROBREC = robRec(ROB3);
check(ROBREC.value === 11 && ROBREC.nodes.length === 9 && robCalls(2) === 9 && robCalls(3) === 15, 'rob([2,7,9]) tree');
const ROBMEMO = robMemoRec(ROB3);
check(ROBMEMO.rec.value === 11 && ROBMEMO.rec.nodes.length === 7, 'memo rob([2,7,9])');

const TAB = [2, 1, 1, 2];
const TABDP = robTab(TAB);
check(same(TABDP, [0, 2, 2, 3, 4]), 'tab [2,1,1,2]');
const TAB2 = [5, 1, 2, 6];
const TAB2DP = robTab(TAB2);
check(same(TAB2DP, [0, 5, 5, 7, 11]), 'tab [5,1,2,6]');

const ROLL = [3, 1, 4, 1];
const ROLLRUN = robRoll(ROLL);
const ROLLBUG = robRoll(ROLL, true);
check(ROLLRUN.ans === 7 && ROLLBUG.ans === 9 && robTab(ROLL)[4] === 7, 'roll [3,1,4,1]');
const CIRC = [2, 3, 2];
const CIRC_A = robLinear(CIRC.slice(0, -1));
const CIRC_B = robLinear(CIRC.slice(1));
check(CIRC_A === 3 && CIRC_B === 3 && robLinear(CIRC) === 4, 'circular [2,3,2]');
const EARN = [2, 2, 3, 3, 3, 4];
const BUCKET = new Array(Math.max(...EARN) + 1).fill(0);
for (const v of EARN) BUCKET[v] += v;
check(same(BUCKET, [0, 0, 4, 9, 4]) && robLinear(BUCKET) === 9, 'delete and earn');

const COINS = [1, 3, 4];
const CC = coinChange(COINS, 6);
check(same(CC.dp, [0, 1, 2, 1, 1, 2, 2]) && CC.ans === 2, 'coin change [1,3,4], 6');
const CC_GREEDY = [];
for (let left = 6; left > 0; ) { const c = Math.max(...COINS.filter((k) => k <= left)); CC_GREEDY.push(c); left -= c; }
check(same(CC_GREEDY, [4, 1, 1]), 'greedy 4+1+1');
const CS = comboOrdered([1, 2], 4);
check(same(CS, [1, 1, 2, 3, 5]) && comboOrdered([1, 2], 3)[3] === 3, 'combination sum IV');
const CU = comboUnordered([1, 2], 4);
check(CU[4] === 3, 'coins-outside count for 4');

const DEC = '1226';
const DECR = decode(DEC);
check(same(DECR.dp, [1, 1, 2, 3, 5]) && numDecodings(DEC) === 5, 'decode 1226');
const DEC0 = '2301';
const DEC0R = decode(DEC0);
check(same(DEC0R.dp, [1, 1, 2, 0, 0]) && numDecodings(DEC0) === 0 && numDecodings('106') === 1, 'decode 2301');
const WB = 'catsand';
const WBD = ['cat', 'cats', 'and', 'sand'];
const WBR = wordBreak(WB, WBD);
check(WBR.dp[7] === true && WBR.by[7] === 3 && WBR.by[3] === 0 && WBR.by[4] === 0, 'word break catsand');

const IMP = coinChange([2], 3);
check(same(IMP.dp, [0, Infinity, 1, Infinity]) && IMP.ans === -1, 'coin change [2], 3');
const ZERO_FILL = coinChange(COINS, 6, 0);
check(ZERO_FILL.ans === 0, 'min-DP filled with 0 returns 0');

const DRY = [2, 7, 9, 3, 1];
const DRYRUN = robRoll(DRY);
// the lesson's dry-run table: [house, money, prev2 + money, prev1 (skip), cur, after]
const DRY_TABLE = [
  ['0', '2', '0 + 2 = 2', '0', '2', '0, 2'],
  ['1', '7', '0 + 7 = 7', '2', '7', '2, 7'],
  ['2', '9', '2 + 9 = 11', '7', '11', '7, 11'],
  ['3', '3', '7 + 3 = 10', '11', '11', '11, 11'],
  ['4', '1', '11 + 1 = 12', '11', '12', '11, 12'],
];
DRYRUN.rows.forEach((r, i) => {
  const row = [String(i), String(r.money), `${r.takeFrom} + ${r.money} = ${r.take}`, String(r.skip), String(r.cur), `${r.prev2}, ${r.prev1}`];
  check(same(row, DRY_TABLE[i]), `dry-run row ${i}`);
});
check(DRYRUN.ans === 12 && 2 + 9 + 1 === 12, 'dry-run answer 12');
check(2 ** 53 + 1 === 2 ** 53, 'precision');

// ---------- frame builders ----------
// stairs dp: one frame per cell, arrows to the two cells it reads
const waysFrames = (dp, say0, sayStep) =>
  dp.map((v, i) => ({
    say: i < 2 ? say0 : sayStep,
    note: i < 2 ? `ways(${i}) = 1: base case.` : `ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = ${v}.`,
    panels: [arr(upto(dp, i), { label: 'ways', highlights: fillHl(dp.length, i, i >= 2 ? [i - 1, i - 2] : []), pointers: i >= 2 ? [ptr(i - 1, '1-step'), ptr(i - 2, '2-step', 'b')] : [] })],
  }));

// plain climb(4): the tree grows call by call; a repeated call turns red
const firstSeen = (rec) => {
  const seen = new Set();
  return rec.nodes.filter((n) => (seen.has(n.label) ? true : (seen.add(n.label), false))).map((n) => n.id);
};
const CLIMB4_REPEATS = firstSeen(CLIMB4).filter((id) => numOf(CLIMB4.nodes[id].label) >= 2);
const climbTreeFrames = CLIMB4.ev
  .map((e, t) => ({ e, t }))
  .filter(({ e }) => e.kind === 'call')
  .map(({ e, t }) => {
    const n = CLIMB4.nodes[e.id];
    const k = numOf(n.label);
    const rep = CLIMB4_REPEATS.includes(e.id);
    return {
      say: rep ? 1 : 0,
      note: rep ? `ways(${k}) again: the whole subtree is recomputed.` : k <= 1 ? `ways(${k}) = 1: base case.` : `ways(${k}) calls ways(${k - 1}) and ways(${k - 2}).`,
      panels: [treeAt(CLIMB4, t, { bad: CLIMB4_REPEATS.filter((id) => id <= e.id), label: 'plain recursion, n = 4' })],
    };
  });

const memoClimbFrames = MEMO4.ev.map((e, t) => {
  const n = MEMO4.nodes[e.id];
  const k = numOf(n.label);
  const hit = n.tag === 'hit';
  const memo = {};
  for (let s = 0; s <= t; s++) {
    const ev = MEMO4.ev[s];
    const nd = MEMO4.nodes[ev.id];
    if (ev.kind === 'ret' && nd.tag !== 'hit' && numOf(nd.label) >= 2) memo[numOf(nd.label)] = ev.v;
  }
  const note = hit
    ? e.kind === 'call' ? `climb(${k}) is in the memo: no new calls.` : `climb(${k}) returns ${e.v} from the memo.`
    : e.kind === 'call' ? (k <= 1 ? `climb(${k}): base case.` : `climb(${k}) is not in the memo yet.`) : k <= 1 ? `climb(${k}) returns 1.` : `climb(${k}) = ${e.v}: memo.set(${k}, ${e.v}).`;
  return {
    say: hit ? 2 : e.kind === 'ret' && k >= 2 ? 1 : 0,
    note,
    panels: [treeAt(MEMO4, t, { label: 'memoized, n = 4' }), arr([2, 3, 4].map((j) => memo[j] ?? '·'), { label: 'memo', indexBase: 2, highlights: k >= 2 && e.kind === 'ret' ? { [k - 2]: hit ? 'visited' : 'active' } : {} })],
  };
});

const robTreeFrames = ROBREC.ev.map((e, t) => {
  const n = ROBREC.nodes[e.id];
  const i = numOf(n.label);
  const kids = ROBREC.nodes.filter((c) => c.parent === e.id);
  let note;
  if (e.kind === 'call') note = i < 0 ? `rob(${i}): no houses, base case.` : `rob(${i}): skip → rob(${i - 1}), or rob → ${ROB3[i]} + rob(${i - 2}).`;
  else if (i < 0) note = `rob(${i}) returns 0.`;
  else note = `rob(${i}) = max(${kids[0].v}, ${ROB3[i]} + ${kids[1].v}) = ${e.v}.`;
  return { say: i < 0 ? 0 : e.kind === 'call' ? 1 : 2, note, panels: [treeAt(ROBREC, t, { label: 'rob(i) calls, nums = [2, 7, 9]' }), arr(ROB3, { label: 'nums', highlights: i >= 0 ? { [i]: 'active' } : {} })] };
});
const ROB_REPEATS = firstSeen(ROBREC);

const robMemoFrames = ROBMEMO.rec.ev.map((e, t) => {
  const n = ROBMEMO.rec.nodes[e.id];
  const i = numOf(n.label);
  const hit = n.tag === 'hit';
  const note = hit
    ? e.kind === 'call' ? `best(${i}): memo[${i}] is not -1, so return it.` : `best(${i}) returns ${e.v} from the memo.`
    : e.kind === 'call' ? (i < 0 ? `best(${i}): i < 0, return 0.` : `best(${i}): memo[${i}] is -1, compute it.`) : i < 0 ? `best(${i}) returns 0.` : `memo[${i}] = ${e.v}.`;
  return {
    say: hit ? 1 : e.kind === 'ret' && i >= 0 ? 2 : 0,
    note,
    panels: [treeAt(ROBMEMO.rec, t, { label: 'best(i) calls, nums = [2, 7, 9]' }), arr(ROBMEMO.snaps[t], { label: 'memo', highlights: i >= 0 && e.kind === 'ret' ? { [i]: hit ? 'visited' : 'active' } : {} })],
  };
});

// tabulated robber: dp over the first i houses
const tabFrames = (nums, dp) => [
  { say: 0, note: 'dp[0] = 0: no houses, no money.', panels: [arr(nums, { label: 'nums' }), arr(upto(dp, 0), { label: 'dp', highlights: { 0: 'active' } })] },
  { say: 0, note: `dp[1] = nums[0] = ${nums[0]}.`, panels: [arr(nums, { label: 'nums', highlights: { 0: 'active' } }), arr(upto(dp, 1), { label: 'dp', highlights: { 1: 'active', 0: 'done' } })] },
  ...dp.slice(2).map((v, k) => {
    const i = k + 2;
    const take = dp[i - 2] + nums[i - 1];
    return {
      say: 1,
      note: `dp[${i}] = max(dp[${i - 1}], dp[${i - 2}] + nums[${i - 1}]) = max(${dp[i - 1]}, ${dp[i - 2]} + ${nums[i - 1]}) = ${v}: ${take > dp[i - 1] ? `rob house ${i - 1}` : `skip house ${i - 1}`}.`,
      panels: [arr(nums, { label: 'nums', highlights: { [i - 1]: 'active' } }), arr(upto(dp, i), { label: 'dp', highlights: fillHl(dp.length, i, [i - 1, i - 2]), pointers: [ptr(i - 1, 'skip', 'b'), ptr(i - 2, 'rob')] })],
    };
  }),
];

// rolling window: the dp row with forgotten cells muted, the two kept cells as a window
// house k computes dp[k + 1] from dp[k] (prev1) and dp[k − 1] (prev2); older cells are forgotten (muted)
const rollPanels = (nums, run, k, phase) => {
  const dp = [0, ...run.rows.map((r) => r.cur)];
  const keep = phase === 'cur' ? [k - 1, k] : [k, k + 1];
  return [
    arr(nums, { label: 'nums', highlights: hl(nums.length, (i) => (i === k ? 'active' : i < k ? 'done' : '')) }),
    arr(dp.map((v, i) => (i <= k + 1 ? v : '·')), { label: 'dp (only 2 kept)', highlights: hl(dp.length, (i) => (i > k + 1 ? '' : phase === 'cur' && i === k + 1 ? 'active' : keep.includes(i) ? 'window' : 'muted')) }),
  ];
};
const rollFrames = ROLLRUN.rows.flatMap((r, k) => [
  {
    say: 0,
    note: `money = ${r.money}: cur = max(${r.skip}, ${r.takeFrom} + ${r.money}) = ${r.cur}.`,
    panels: [...rollPanels(ROLL, ROLLRUN, k, 'cur'), vars({ prev2: r.takeFrom, prev1: r.skip, cur: r.cur })],
  },
  {
    say: 1,
    note: `Shift: prev2 = ${r.prev2}, prev1 = ${r.prev1}.${k >= 1 ? ` dp[${k - 1}] is forgotten.` : ''}`,
    panels: [...rollPanels(ROLL, ROLLRUN, k, 'shift'), vars({ prev2: r.prev2, prev1: r.prev1 })],
  },
]);

// coin change: one frame per amount, arrows to every dp[x − c]
const coinFrames = [
  { say: 0, note: 'dp[0] = 0; every other cell starts at ∞ (unreachable).', panels: [arr(CC.dp.map((v, i) => (i === 0 ? 0 : '∞')), { label: 'dp, coins [1, 3, 4]', highlights: { 0: 'active' } })] },
  ...CC.trace.slice(1).map((tries, k) => {
    const x = k + 1;
    const best = tries.reduce((a, b) => (b.val < a.val ? b : a));
    return {
      say: 1,
      note: `dp[${x}] = ${tries.map((t) => `dp[${t.from}]+1`).join(', ')} → min = ${CC.dp[x]} (last coin ${best.c}).`,
      panels: [
        arr(CC.dp.map((v, i) => (i <= x ? v : '∞')), { label: 'dp, coins [1, 3, 4]', highlights: fillHl(CC.dp.length, x, tries.map((t) => t.from)), pointers: tries.map((t) => ptr(t.from, `c${t.c}`, t === best ? 'a' : 'b')) }),
        vars(Object.fromEntries(tries.map((t) => [`c=${t.c}`, t.val]))),
      ],
    };
  }),
];

const comboFrames = [
  { say: 0, note: 'dp[0] = 1: one way to make 0 — the empty sequence.', panels: [arr(upto(CS, 0), { label: 'dp, nums [1, 2]', highlights: { 0: 'active' } })] },
  ...CS.slice(1).map((v, k) => {
    const x = k + 1;
    const from = [1, 2].filter((n) => n <= x);
    return {
      say: 1,
      note: `dp[${x}] = ${from.map((n) => `dp[${x - n}]`).join(' + ')} = ${from.map((n) => CS[x - n]).join(' + ')} = ${v}.`,
      panels: [arr(upto(CS, x), { label: 'dp, nums [1, 2]', highlights: fillHl(CS.length, x, from.map((n) => x - n)), pointers: from.map((n) => ptr(x - n, `last ${n}`, n === 1 ? 'a' : 'b')) })],
    };
  }),
];

const decodeFrames = [
  { say: 2, note: 'dp[0] = 1: the empty prefix has one decoding.', panels: [arr([...DEC], { label: 's', indexBase: 0 }), arr(upto(DECR.dp, 0), { label: 'dp', highlights: { 0: 'active' } })] },
  { say: 0, note: `dp[1] = 1: "${DEC[0]}" is not "0".`, panels: [arr([...DEC], { label: 's', highlights: { 0: 'active' } }), arr(upto(DECR.dp, 1), { label: 'dp', highlights: fillHl(5, 1, [0]) })] },
  ...DECR.parts.slice(2).map((p, k) => {
    const i = k + 2;
    const reads = [...(p.one ? [i - 1] : []), ...(p.twoOk ? [i - 2] : [])];
    return {
      say: p.twoOk ? 1 : 0,
      note: `"${DEC[i - 1]}" ${p.one ? `adds dp[${i - 1}] = ${DECR.dp[i - 1]}` : 'is 0: adds nothing'}; "${p.two}" ${p.twoOk ? `adds dp[${i - 2}] = ${DECR.dp[i - 2]}` : 'is not 10–26'} → dp[${i}] = ${DECR.dp[i]}.`,
      panels: [
        arr([...DEC], { label: 's', range: [i - 2, i - 1], highlights: { [i - 1]: 'active' } }),
        arr(upto(DECR.dp, i), { label: 'dp', highlights: fillHl(5, i, reads), pointers: [...(p.one ? [ptr(i - 1, '1 dig')] : []), ...(p.twoOk ? [ptr(i - 2, '2 dig', 'b')] : [])] }),
      ],
    };
  }),
];

const tf = (b) => (b ? 'T' : 'F');
const wbFrames = [
  { say: 0, note: 'dp[0] = T: the empty prefix is segmentable.', panels: [arr([...WB], { label: 's' }), arr(WBR.dp.map((v, i) => (i === 0 ? 'T' : '·')), { label: 'dp', highlights: { 0: 'active' } })] },
  ...WBR.dp.slice(1).map((v, k) => {
    const i = k + 1;
    const j = WBR.by[i];
    return {
      say: 1,
      note: v ? `dp[${j}] = T and "${WB.slice(j, i)}" is a word → dp[${i}] = T.` : `No j with dp[j] = T and s[j..${i}) in the dictionary → dp[${i}] = F.`,
      panels: [
        arr([...WB], { label: 's', ...(v ? { range: [j, i - 1] } : {}), highlights: hl(WB.length, (q) => (q < i ? (v && q >= j ? 'active' : 'done') : '')) }),
        arr(WBR.dp.map((d, q) => (q <= i ? tf(d) : '·')), { label: 'dp', highlights: hl(WBR.dp.length, (q) => (q === i ? (v ? 'active' : 'bad') : q === j && v ? 'window' : q < i ? 'done' : '')), ...(v ? { pointers: [ptr(j, `j=${j}`)] } : {}) }),
      ],
    };
  }),
];

const dryFrames = (from, to) =>
  DRYRUN.rows.slice(from, to).map((r, q) => {
    const k = from + q;
    return {
      say: r.take > r.skip ? 1 : 2,
      note: `House ${k}: rob = ${r.takeFrom} + ${r.money} = ${r.take}, skip = ${r.skip} → cur = ${r.cur}. Now prev2, prev1 = ${r.prev2}, ${r.prev1}.`,
      panels: [
        arr(DRY, { label: 'money', highlights: hl(DRY.length, (i) => (i === k ? 'active' : i < k ? 'done' : '')), pointers: [ptr(k, `h${k}`)] }),
        vars({ 'rob': r.take, 'skip': r.skip, cur: r.cur }),
        vars({ prev2: r.prev2, prev1: r.prev1 }),
      ],
    };
  });

const greedyFrames = (() => {
  const frames = [];
  let left = 6;
  const used = [];
  for (const c of CC_GREEDY) {
    left -= c;
    used.push(c);
    frames.push({ say: 0, note: `Greedy takes the biggest coin that fits: ${c}. ${left} left.`, panels: [arr(used.slice(), { label: 'greedy coins' }), vars({ left })] });
  }
  frames.push({ say: 1, note: `Greedy: ${CC_GREEDY.length} coins. DP tries every last coin: dp[6] = ${CC.dp[6]} (3 + 3).`, panels: [arr(CC_GREEDY, { label: 'greedy coins', highlights: hl(3, () => 'bad') }), arr([3, 3], { label: 'DP coins', highlights: { 0: 'done', 1: 'done' } })] });
  return frames;
})();

// ---------- steps ----------
export default {
  what: [
    {
      kind: 'watch',
      title: 'Climbing stairs, remembered',
      lines: ['Base cases: `ways(0) = 1`, `ways(1) = 1`.', 'The last move was a 1-step (from n − 1) or a 2-step (from n − 2): `ways(n) = ways(n − 1) + ways(n − 2)`.', 'Each answer is **written down once** and read again later.'],
      frames: [...waysFrames(WAYS, 0, 1), { say: 2, note: `ways(5) = ${WAYS[5]}, built only from answers already written down.`, panels: [arr(WAYS, { label: 'ways', highlights: hl(6, () => 'done') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: one more step',
      lines: ['ways(0..5) are written down.', 'Now the staircase has 6 steps.'],
      panels: [arr([...WAYS, '?'], { label: 'ways', highlights: { 4: 'window', 5: 'window', 6: 'active' } })],
      task: { type: 'number', question: 'ways(6) = ?', options: [11, 13, 14, 16], answer: WAYS[5] + WAYS[4], hint: 'Last move: a 1-step from step 5 or a 2-step from step 4.' },
      solved: `ways(6) = ${WAYS[5]} + ${WAYS[4]} = ${WAYS[5] + WAYS[4]}. No recounting: like answering 8 after remembering 7.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: name the part',
      lines: ['`ways(n) = ways(n − 1) + ways(n − 2)`', '`ways(0) = 1, ways(1) = 1`'],
      panels: [arr(WAYS.slice(0, 2), { label: 'ways', highlights: { 0: 'active', 1: 'active' } })],
      task: {
        type: 'choose',
        question: 'What are `ways(0) = 1` and `ways(1) = 1` called?',
        options: [
          { text: 'Base cases', why: '' },
          { text: 'The transition', why: 'The transition is the formula that builds a state from smaller ones: ways(n − 1) + ways(n − 2).' },
          { text: 'Overlapping subproblems', why: 'That names the same state being needed many times, not the smallest known answers.' },
        ],
        answer: 0,
      },
      solved: 'Base cases are the smallest states whose answers you just know.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'Plain recursion repeats itself',
      lines: ['`climb(n)` with no memory calls `climb(n − 1)` and `climb(n − 2)` every time.', 'The same question gets answered again, with its whole subtree.'],
      frames: [
        ...climbTreeFrames,
        { say: 1, note: `${CLIMB4.nodes.length} calls for only 5 different questions: ways(0) … ways(4).`, panels: [treeAt(CLIMB4, last(CLIMB4), { bad: CLIMB4_REPEATS, label: 'plain recursion, n = 4' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the repeats',
      lines: ['Same recursion, now for n = 5.', 'Count how often each question is asked.'],
      panels: [treeAt(CLIMB4, last(CLIMB4), { bad: CLIMB4.nodes.filter((n) => n.label === 'w2').map((n) => n.id), label: 'climb(4): one half of climb(5)' }), vars({ 'climb(5)': 'w4 + w3' })],
      task: { type: 'number', question: 'How many times is `ways(2)` computed inside `climb(5)`?', options: [1, 2, 3, 5], answer: countOf(CLIMB5, 'w2'), hint: 'climb(5) → climb(4) and climb(3). The n = 4 tree computes ways(2) twice; climb(3) adds one more.' },
      solved: 'ways(2) three times, ways(3) twice — and it gets worse fast: about 1.6ⁿ calls.',
    },
    {
      kind: 'watch',
      title: 'Memoized: each question once',
      lines: ['Base cases `n <= 1` return 1 directly.', 'After computing, `memo.set(n, ans)`.', 'A repeat finds `memo.has(n)` and returns at once: its branch is cut.'],
      frames: [
        ...memoClimbFrames,
        { say: 2, note: `${MEMO4.nodes.length} calls instead of ${CLIMB4.nodes.length}. The work is now O(n).`, panels: [treeAt(MEMO4, last(MEMO4), { label: 'memoized, n = 4' }), arr(WAYS.slice(2, 5), { label: 'memo', indexBase: 2, highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many questions?',
      lines: ['Memoization pays off because there are few **different** questions.'],
      panels: [arr(['?', '?', '?', '?', '?', '?', '?', '?'], { label: 'ways(0) … ways(7)' })],
      task: { type: 'number', question: 'For n = 7, how many different questions ways(k) exist?', options: [7, 8, 14, 21], answer: 8, hint: 'ways(0), ways(1), …, ways(7): that is n + 1.' },
      solved: 'n + 1 = 8 questions, O(1) work each: O(n) instead of about 1.6ⁿ calls.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Both conditions, on climbing stairs',
      lines: ['**Overlapping subproblems**: brute force asks the same question repeatedly.', '**Optimal substructure**: the answer is built from smaller states — for counting, a sum over disjoint cases.', '**1D**: a single number identifies a state.'],
      frames: [
        { say: 0, note: 'Overlap: ways(2) is asked again and again by different branches.', panels: [treeAt(CLIMB4, last(CLIMB4), { bad: CLIMB4_REPEATS }), arr(WAYS.slice(0, 5), { label: 'ways', highlights: { 2: 'bad' } })] },
        { say: 1, note: 'Substructure: ways(4) = ways(3) + ways(2). Last move 1-step or 2-step: disjoint cases.', panels: [arr(WAYS.slice(0, 5), { label: 'ways', highlights: { 4: 'active', 3: 'window', 2: 'window' }, pointers: [ptr(3, '1-step'), ptr(2, '2-step', 'b')] })] },
        { say: 2, note: 'One number (the step i) names a state: 1D DP.', panels: [arr(WAYS.slice(0, 5), { label: 'ways', highlights: hl(5, () => 'done') }), vars({ state: 'i' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 1D or not?',
      lines: ['A state needs an **index** and a remaining **capacity** to be described.'],
      panels: [vars({ state: '(i, cap)' })],
      task: {
        type: 'choose',
        question: 'Which kind of DP is this?',
        options: [
          { text: '2D DP: two numbers identify a state', why: '' },
          { text: '1D DP: it still walks one array', why: '1D means one number identifies a state. Here a state needs two.' },
          { text: 'Not DP: two parameters rule it out', why: 'Two parameters is fine; that is exactly 2D DP, the next topic.' },
        ],
        answer: 0,
      },
      solved: 'One number per state → 1D. Two (index + capacity) → 2D DP.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Find the LAST decision',
      lines: ['Ask: what was the **last decision**?', 'Each case leaves a **smaller** problem of the same kind: that is the transition.'],
      frames: (() => {
        const rows = [
          ['Stairs', '1 or 2'],
          ['Robber', 'rob/skip'],
          ['Coins', 'which coin'],
          ['Decode', '1 or 2 dig'],
          ['Words', 's[j..i)'],
        ];
        return [
          ...rows.map((_, k) => ({ say: 0, note: `${rows[k][0]}: last decision = ${rows[k][1]}.`, panels: [reveal(rows, ['last decision'], k)] })),
          { say: 1, note: 'Every option leaves a smaller problem of the same kind.', panels: [reveal(rows, ['last decision'], rows.length)] },
        ];
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: spot the DP',
      lines: ['Clues: "number of ways", "minimum cost to reach", "cannot pick adjacent", "decode", "segment into words".', 'Also: greedy has a counter-example.'],
      panels: [vars({ clue: '?' })],
      task: {
        type: 'choose',
        question: 'Which statement points to DP?',
        options: [
          { text: '"Return the minimum cost to reach the top, taking 1 or 2 steps"', why: '' },
          { text: '"Return the array sorted in ascending order"', why: 'No choices per step to combine — just sort.' },
          { text: '"Return the sum of all elements"', why: 'A single pass; no repeated subproblems.' },
        ],
        answer: 0,
      },
      solved: '"Minimum cost to reach" with a choice per step: define dp[i], write the transition from the last step.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Four questions, in order',
      lines: ['**State**: what dp[i] means, in words.', '**Transition**: how dp[i] is built from smaller states.', '**Base cases**: the states you know directly.', '**Answer location**: which cell holds the answer.'],
      frames: (() => {
        const rows = [
          ['State', 'ways to i'],
          ['Transition', 'i−1 + i−2'],
          ['Base', 'dp[0] = 1'],
          ['Answer', 'dp[n]'],
        ];
        return rows.map((_, k) => ({ say: k, note: `${rows[k][0]} for climbing stairs: ${rows[k][1]}.`, panels: [reveal(rows, ['stairs'], k)] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: the design order',
      lines: ['If you cannot say the state in one sentence, you are not ready to code.'],
      panels: [vars({ dp: '?' })],
      task: { type: 'order', question: 'Tap the four questions in the order you answer them.', items: ['State', 'Transition', 'Base cases', 'Answer location'], hint: 'You cannot write a transition before you know what dp[i] means.' },
      solved: 'State → transition → base cases → answer location.',
    },
    {
      kind: 'watch',
      title: '"First i houses": dp[i] looks at nums[i − 1]',
      lines: ['dp[i] = max money from the **first i** houses.', '`dp[0]` is the empty prefix: a natural base case, no negative index.', 'So dp[i] looks at `nums[i − 1]`.'],
      frames: [
        { say: 1, note: 'dp[0]: zero houses, money 0.', panels: [arr(TAB2, { label: 'nums' }), arr(upto(TAB2DP, 0), { label: 'dp', highlights: { 0: 'active' } })] },
        ...[1, 2, 3, 4].map((i) => ({
          say: 2,
          note: `dp[${i}] covers the first ${i} house${i > 1 ? 's' : ''}; its newest house is nums[${i - 1}] = ${TAB2[i - 1]}.`,
          panels: [arr(TAB2, { label: 'nums', highlights: hl(4, (k) => (k === i - 1 ? 'active' : k < i - 1 ? 'window' : '')), pointers: [ptr(i - 1, `i−1`)] }), arr(upto(TAB2DP, i), { label: 'dp', highlights: { [i]: 'active' }, pointers: [ptr(i, `i=${i}`, 'b')] })],
        })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which house?',
      lines: ['dp[i] is the answer for the **first i** houses.'],
      panels: [arr([4, 2, 8, 1, 5], { label: 'nums' })],
      task: { type: 'cell', question: 'dp[3] adds the newest house. Tap it in nums.', answer: 2, hints: { 3: 'That is nums[3]: the 4th house, which dp[4] adds.', 1: 'nums[1] is the 2nd house: dp[2] adds it.' } },
      solved: 'dp[3] = first 3 houses = nums[0..2], so it looks at nums[2].',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'rob(i): skip it or rob it',
      lines: ['Base: `i < 0` → no houses, return 0.', 'Skip house i → `rob(i − 1)`.', 'Rob house i → `nums[i] + rob(i − 2)`; take the max.'],
      frames: [
        ...robTreeFrames,
        { say: 2, note: `Answer ${ROBREC.value}. Red calls repeat a question already asked.`, panels: [treeAt(ROBREC, last(ROBREC), { bad: ROB_REPEATS, label: 'rob(i) calls, nums = [2, 7, 9]' }), arr(ROB3, { label: 'nums', highlights: { 0: 'done', 2: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: one more house',
      lines: [`With 3 houses the tree has ${robCalls(2)} calls; with 2 houses, ${robCalls(1)}.`, 'Every call spawns two more.'],
      panels: [arr([2, 7, 9, 3], { label: 'nums' }), vars({ 'calls(3h)': robCalls(2), 'calls(2h)': robCalls(1) })],
      task: { type: 'number', question: 'How many calls does rob make for 4 houses?', options: [12, 14, 15, 18], answer: robCalls(3), hint: 'rob(3) is 1 call + the tree of rob(2) + the tree of rob(1).' },
      solved: `1 + ${robCalls(2)} + ${robCalls(1)} = ${robCalls(3)}. The tree keeps growing exponentially, yet the questions stay few.`,
    },
  ],

  'optimized-memo': [
    {
      kind: 'watch',
      title: 'best(i) with a memo',
      lines: ['`memo` starts all -1: "not computed" (money is never negative).', 'Before computing: if `memo[i] !== -1`, return it.', 'After computing: store `memo[i]`.'],
      frames: [
        { say: 0, note: 'memo = [-1, -1, -1].', panels: [treeAt(ROBMEMO.rec, 0, { label: 'best(i) calls, nums = [2, 7, 9]' }), arr([-1, -1, -1], { label: 'memo' })] },
        ...robMemoFrames,
        { say: 1, note: `${ROBMEMO.rec.nodes.length} calls instead of ${ROBREC.nodes.length}: the second best(0) was a lookup.`, panels: [treeAt(ROBMEMO.rec, last(ROBMEMO.rec), { label: 'best(i) calls, nums = [2, 7, 9]' }), arr(ROBMEMO.snaps.at(-1), { label: 'memo', highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why -1?',
      lines: ['`new Array(nums.length).fill(-1)` marks "not computed".'],
      panels: [arr([-1, -1, -1, -1], { label: 'memo', highlights: hl(4, () => 'muted') })],
      task: {
        type: 'choose',
        question: 'Why is -1 a safe marker here?',
        options: [
          { text: 'Money is never negative, so -1 can never be a real answer', why: '' },
          { text: 'Arrays must be filled with a negative number', why: 'fill accepts any value; -1 is chosen for what it means here.' },
          { text: 'best(-1) is stored in memo[-1]', why: 'i < 0 returns 0 before the memo is touched; nothing is stored at -1.' },
        ],
        answer: 0,
      },
      solved: 'A marker must be impossible as a real answer. -1 works because money is never negative.',
    },
    {
      kind: 'turn',
      title: 'Your turn: 50,000 houses',
      lines: ['The first call still recurses **n levels deep**.', 'V8 typically allows around 10,000 frames.'],
      panels: [stk(['best(49999)', 'best(49998)', '…', 'best(1)', 'best(0)'])],
      task: {
        type: 'choose',
        question: 'What happens with `nums.length = 50_000`?',
        options: [
          { text: 'RangeError: Maximum call stack size exceeded — use tabulation (a loop)', why: '' },
          { text: 'It is fine: the memo makes it O(n)', why: 'O(n) time, but still n frames deep on the first call.' },
          { text: 'Switching the memo to a Map fixes it', why: 'The cache type does not change how deep the recursion goes.' },
        ],
        answer: 0,
      },
      solved: 'Deep memoized recursion overflows the stack in JS; tabulation (or warming the cache bottom-up) avoids it.',
    },
  ],

  'optimized-tabulation': [
    {
      kind: 'watch',
      title: 'Fill dp from the smallest state up',
      lines: ['`dp[0] = 0`, `dp[1] = nums[0]`.', '`dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1])`, for i = 2 upward.', 'Answer: `dp[n]`.'],
      frames: [...tabFrames(TAB, TABDP), { say: 2, note: `dp[4] = ${TABDP[4]}: rob houses 0 and 3 (2 + 2).`, panels: [arr(TAB, { label: 'nums', highlights: { 0: 'done', 3: 'done' } }), arr(TABDP, { label: 'dp', highlights: { 4: 'active' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: fill the last cell',
      lines: ['nums = [5, 1, 2, 6].', '`dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1])`.'],
      panels: [arr(TAB2, { label: 'nums', highlights: { 3: 'active' } }), arr(upto(TAB2DP, 3, '?'), { label: 'dp', highlights: { 4: 'active', 3: 'window', 2: 'window' } })],
      task: { type: 'number', question: 'dp[4] = ?', options: [7, 8, 11, 13], answer: TAB2DP[4], hint: `max(dp[3], dp[2] + nums[3]) = max(${TAB2DP[3]}, ${TAB2DP[2]} + 6).` },
      solved: `max(${TAB2DP[3]}, ${TAB2DP[2]} + 6) = ${TAB2DP[4]}: rob houses 0 and 3.`,
      then: tabFrames(TAB2, TAB2DP).slice(-1),
    },
    {
      kind: 'turn',
      title: 'Your turn: the rob arrow',
      lines: ['dp[i] reads two earlier cells: one for skip, one for rob.'],
      panels: [arr(upto(TAB2DP, 3, '?'), { label: 'dp', highlights: { 4: 'active' } })],
      task: { type: 'cell', question: 'Robbing the last house (nums[3]): which cell does dp[4] add it to?', answer: 2, hints: { 3: 'dp[3] is the skip option: house 3 is not robbed.', 4: 'dp[4] is the cell being computed.', 1: 'dp[1] is three back; the rule only reaches two back.' } },
      solved: 'Rob → dp[i − 2] + nums[i − 1]; skip → dp[i − 1].',
    },
    {
      kind: 'turn',
      title: 'Your turn: memo or table?',
      lines: ['Memoization: only needed states, but O(depth) stack.', 'Tabulation: all states in a fixed order, no stack.'],
      panels: [table(['order', 'stack', 'space opt'], ['memo', 'table'], [['by need', 'loop'], ['O(depth)', 'none'], ['hard', 'easy']])],
      task: {
        type: 'choose',
        question: 'States are dense, the order is obvious, n is large. Which?',
        options: [
          { text: 'Tabulation', why: '' },
          { text: 'Memoization', why: 'It recurses O(depth) deep — risky in JS for large n — and its strength is sparse states or awkward orders.' },
        ],
        answer: 0,
      },
      solved: 'Dense states + obvious order → tabulation: no stack, and space optimisation becomes easy.',
    },
  ],

  'optimized-space': [
    {
      kind: 'watch',
      title: 'Keep only two cells',
      lines: ['`cur = max(prev1, prev2 + money)` from the old values.', 'Then shift: `prev2 = prev1`, then `prev1 = cur`.'],
      frames: [...rollFrames, { say: 1, note: `Return prev1 = ${ROLLRUN.ans}. Same as the full table, with O(1) space.`, panels: [arr(ROLL, { label: 'nums', highlights: hl(4, () => 'done') }), vars({ prev2: ROLLRUN.rows.at(-1).prev2, prev1: ROLLRUN.ans })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: shift in the wrong order',
      lines: ['Someone writes `prev1 = cur;` and then `prev2 = prev1;`.', 'Same input: [3, 1, 4, 1].'],
      panels: [arr(ROLL, { label: 'nums' }), vars({ prev2: 0, prev1: 0 })],
      task: { type: 'number', question: 'What does the buggy version return?', options: [7, 8, 9, 10], answer: ROLLBUG.ans, hint: 'After each house both variables hold cur, so the next house is added on top of it.' },
      solved: `It returns ${ROLLBUG.ans}, not ${ROLLRUN.ans}: it robs neighbours.`,
      then: ROLLBUG.rows.map((r, k) => ({
        say: 1,
        note: `money ${r.money}: cur = max(${r.skip}, ${r.takeFrom} + ${r.money}) = ${r.cur}; both become ${r.cur}.`,
        panels: [arr(ROLL, { label: 'nums', highlights: hl(4, (i) => (i === k ? 'active' : i < k ? 'done' : '')) }), vars({ prev2: r.prev2, prev1: r.prev1 })],
      })),
    },
    {
      kind: 'watch',
      title: 'Circular: run it twice',
      lines: ['House Robber II: the first and last houses are neighbours.', 'Run the linear DP on `nums[0..n−2]` and on `nums[1..n−1]`; take the max.'],
      frames: [
        { say: 0, note: `Linear robber on [2, 3, 2] says ${robLinear(CIRC)} — but houses 0 and 2 touch in a circle.`, panels: [arr(CIRC, { label: 'circle', highlights: { 0: 'bad', 2: 'bad' } })] },
        { say: 1, note: `Drop the last house: robber on [2, 3] = ${CIRC_A}.`, panels: [arr(CIRC, { label: 'circle', range: [0, 1], highlights: { 2: 'muted' } }), vars({ A: CIRC_A })] },
        { say: 1, note: `Drop the first house: robber on [3, 2] = ${CIRC_B}.`, panels: [arr(CIRC, { label: 'circle', range: [1, 2], highlights: { 0: 'muted' } }), vars({ A: CIRC_A, B: CIRC_B })] },
        { say: 1, note: `max(${CIRC_A}, ${CIRC_B}) = ${Math.max(CIRC_A, CIRC_B)}: rob only house 1.`, panels: [arr(CIRC, { label: 'circle', highlights: { 1: 'done' } }), vars({ ans: Math.max(CIRC_A, CIRC_B) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: delete and earn',
      lines: ['nums = [2, 2, 3, 3, 3, 4].', 'Picking value v earns v × count(v) but forbids v − 1 and v + 1.', 'Bucket the points by value, then run house robber over values.'],
      panels: [arr(EARN, { label: 'nums' }), arr(BUCKET, { label: 'points by value' })],
      task: { type: 'number', question: 'Max points?', options: [8, 9, 13, 17], answer: robLinear(BUCKET), hint: 'Values 2 and 4 are not adjacent (4 + 4); value 3 alone gives 9.' },
      solved: `House robber over [0, 0, 4, 9, 4] = ${robLinear(BUCKET)}: take all the 3s.`,
    },
  ],

  'optimized-unbounded': [
    {
      kind: 'watch',
      title: 'Coin change: try every last coin',
      lines: ['`dp[0] = 0`; everything else starts at Infinity.', '`dp[x] = min over coins c ≤ x of dp[x − c] + 1`.'],
      frames: coinFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: dp[5]',
      lines: ['Coins [1, 3, 4].', 'Try each coin as the last one.'],
      panels: [arr(upto(CC.dp, 4, '?').slice(0, 6), { label: 'dp', highlights: { 5: 'active', 4: 'window', 2: 'window', 1: 'window' } })],
      task: { type: 'number', question: 'dp[5] = ?', options: [1, 2, 3, 5], answer: CC.dp[5], hint: '1 + min(dp[4], dp[2], dp[1]).' },
      solved: `1 + min(${CC.dp[4]}, ${CC.dp[2]}, ${CC.dp[1]}) = ${CC.dp[5]}: coins 4 + 1.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the winning last coin',
      lines: ['Coins [1, 3, 4]. dp[4] compares dp[3] + 1, dp[1] + 1 and dp[0] + 1.'],
      panels: [arr(upto(CC.dp, 3, '?').slice(0, 5), { label: 'dp', highlights: { 4: 'active' } })],
      task: { type: 'cell', question: 'Which cell gives dp[4] its minimum?', answer: 0, hints: { 3: 'dp[3] + 1 = 2 (coin 1). There is a smaller one.', 1: 'dp[1] + 1 = 2 (coin 3). There is a smaller one.', 4: 'dp[4] is the cell being computed.' } },
      solved: 'dp[0] + 1 = 1: the coin 4 alone.',
    },
    {
      kind: 'watch',
      title: 'Ordered sequences: amount outside',
      lines: ['Combination Sum IV counts **ordered** sequences: (1,2) ≠ (2,1).', 'Amount loop outside, every possible last number inside: `dp[x] += dp[x − n]`.'],
      frames: comboFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: swap the loops',
      lines: ['nums [1, 2], target 4. Ordered sequences: 5.', 'Now loop the **numbers outside**, amounts inside.'],
      panels: [arr(CS, { label: 'amount outside', highlights: { 4: 'active' } })],
      task: { type: 'number', question: 'What does dp[4] become with the numbers outside?', options: [2, 3, 4, 5], answer: CU[4], hint: 'Each multiset is counted once: {1,1,1,1}, {1,1,2}, {2,2}.' },
      solved: `${CU[4]}: each multiset once — that is Coin Change II (DP 2D topic).`,
    },
    {
      kind: 'turn',
      title: 'Your turn: perfect squares',
      lines: ['Perfect squares is coin change where the coins are 1, 4, 9, 16, … ≤ n.'],
      panels: [vars({ n: 12 })],
      task: {
        type: 'choose',
        question: 'For n = 12, which coins?',
        options: [
          { text: '1, 4, 9', why: '' },
          { text: '1, 4, 9, 16', why: '16 > 12: a coin must be ≤ n.' },
          { text: '1, 2, 3, …, 12', why: 'Only perfect squares count as coins.' },
        ],
        answer: 0,
      },
      solved: 'Squares ≤ 12: 1, 4, 9. Then it is the same min-coins DP.',
    },
  ],

  'optimized-strings': [
    {
      kind: 'watch',
      title: 'Decode "1226"',
      lines: ['One digit `s[i−1]` (not "0") → add `dp[i−1]`.', 'Two digits `s[i−2..i−1]` (10–26) → add `dp[i−2]`.', '`dp[0] = 1`: the empty string has one decoding.'],
      frames: [...decodeFrames, { say: 1, note: `dp[4] = ${DECR.dp[4]} decodings of "1226".`, panels: [arr([...DEC], { label: 's' }), arr(DECR.dp, { label: 'dp', highlights: { 4: 'done' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: where does it die?',
      lines: ['s = "2301".', '"0" alone is invalid; "30" is not 10–26.'],
      panels: [arr([...DEC0], { label: 's' }), arr(DEC0R.dp, { label: 'dp' })],
      task: { type: 'cell', question: 'Tap the first dp cell that becomes 0.', panel: 1, answer: 3, hints: { 4: 'It is 0 too, but only because an earlier cell already is.', 2: 'dp[2]: "3" and "23" are both valid → 2.' } },
      solved: 'dp[3]: "0" cannot stand alone and "30" is too big, so 0 — and every later cell inherits it.',
      then: [{ say: 1, note: 'dp[4]: "1" adds dp[3] = 0; "01" is not 10–26. Answer 0.', panels: [arr([...DEC0], { label: 's', range: [2, 3] }), arr(DEC0R.dp, { label: 'dp', highlights: { 3: 'bad', 4: 'bad' } })] }],
    },
    {
      kind: 'watch',
      title: 'Word break "catsand"',
      lines: ['`dp[0] = true`.', '`dp[i] = true` if some j has `dp[j]` true and `s.slice(j, i)` in the dictionary Set.'],
      frames: [{ say: 1, note: 'Dictionary: cat, cats, and, sand.', panels: [arr([...WB], { label: 's' }), table(['words'], ['1', '2', '3', '4'], [WBD])] }, ...wbFrames],
    },
    {
      kind: 'turn',
      title: 'Your turn: the split for dp[7]',
      lines: ['Dictionary: cat, cats, and, sand.', 'The loop tries j = 0, 1, 2, … and stops at the first success.'],
      panels: [arr(WBR.dp.map((d, q) => (q < 7 ? tf(d) : '?')), { label: 'dp', highlights: { 7: 'active' } })],
      task: { type: 'cell', question: 'Which j sets dp[7] to true?', answer: WBR.by[7], hints: { 4: 'dp[4] = T and "and" works too, but the loop reaches j = 3 first and breaks.', 0: '"catsand" is not a word.', 7: 'j must be < i.' } },
      solved: 'j = 3: dp[3] = T ("cat") and "sand" is a word.',
    },
    {
      kind: 'turn',
      title: 'Your turn: word break II',
      lines: ['All sentences: a memoized DFS `sentences(start)` returns the list for the suffix from start.'],
      panels: [arr([...WB], { label: 's', range: [3, 6], pointers: [ptr(3, 'start')] })],
      task: {
        type: 'choose',
        question: 'Why memoize by start?',
        options: [
          { text: 'Different splits reach the same start, and its suffix is explored once', why: '' },
          { text: 'It makes the output size polynomial', why: 'The memo avoids re-exploring; the output itself can still be exponential.' },
          { text: 'Without it, dp[0] would be false', why: 'This DFS has no dp[0]; the memo is about repeated suffixes.' },
        ],
        answer: 0,
      },
      solved: 'Memoizing by start avoids re-exploring shared suffixes.',
    },
  ],

  template: [
    {
      kind: 'turn',
      title: 'Your turn: the recipe',
      lines: ['The 1D DP recipe starts from the brute force and ends with saving space.'],
      panels: [vars({ dp: 'dp[i] = ?' })],
      task: { type: 'order', question: 'Tap the steps in order.', items: ['Brute force (last decision)', 'Name the state', 'Transition', 'Base cases', 'Loop order', 'Answer location', 'Optimise space'], hint: 'Recursion first, space saving last.' },
      solved: 'Recursion → state → transition → base → order → answer → space.',
    },
    {
      kind: 'watch',
      title: 'One template, two problems',
      lines: ['`dp = new Array(n + 1).fill(INITIAL)`, then `dp[0] = BASE`.', 'For every possible last decision: `dp[i] = combine(dp[i], dp[prev])`.'],
      frames: (() => {
        const rows = [
          ['INITIAL', '0', '∞'],
          ['BASE', '1', '0'],
          ['choices', '1, 2', 'coins'],
          ['combine', '+', 'min'],
        ];
        return rows.map((_, k) => ({ say: k < 2 ? 0 : 1, note: `${rows[k][0]}: stairs ${rows[k][1]}, coin change ${rows[k][2]}.`, panels: [reveal(rows, ['stairs', 'coins'], k)] }));
      })(),
    },
    {
      kind: 'turn',
      title: 'Your turn: INITIAL for a min-DP',
      lines: ['`fill(INITIAL)`: 0 for counts/max, something else for min.'],
      panels: [arr(['0', '?', '?', '?', '?'], { label: 'dp (min cost)', highlights: { 0: 'done' } })],
      task: {
        type: 'choose',
        question: 'What should INITIAL be for "minimum cost"?',
        options: [
          { text: 'Infinity', why: '' },
          { text: '0', why: 'min(0, anything ≥ 0) stays 0: every cell would claim cost 0.' },
          { text: '-1', why: '-1 would win every min and is not a real cost.' },
        ],
        answer: 0,
      },
      solved: 'Infinity = unreachable until a real choice improves it.',
    },
  ],

  implementation: [
    {
      kind: 'watch',
      title: 'Unreachable stays Infinity',
      lines: ['`coinChange([2], 3)`: dp starts at Infinity, `dp[0] = 0`.', '`Infinity + 1` is still Infinity, so it never wins `< dp[x]`.', 'Return -1 when `dp[amount] === Infinity`.'],
      frames: [
        { say: 0, note: 'dp = [0, ∞, ∞, ∞].', panels: [arr([0, '∞', '∞', '∞'], { label: 'dp, coins [2]', highlights: { 0: 'active' } })] },
        { say: 0, note: 'x = 1: coin 2 > 1, skip. dp[1] stays ∞.', panels: [arr(upto(IMP.dp, 1).map((v) => (v === '·' ? '∞' : v)), { label: 'dp, coins [2]', highlights: { 1: 'bad' } })] },
        { say: 0, note: 'x = 2: dp[0] + 1 = 1 < ∞ → dp[2] = 1.', panels: [arr(upto(IMP.dp, 2).map((v) => (v === '·' ? '∞' : v)), { label: 'dp, coins [2]', highlights: { 2: 'active', 0: 'window' }, pointers: [ptr(0, 'c2')] })] },
        { say: 1, note: 'x = 3: dp[1] + 1 = ∞ + 1 = ∞, not < ∞. dp[3] stays ∞.', panels: [arr(IMP.dp.map(inf), { label: 'dp, coins [2]', highlights: { 3: 'bad', 1: 'window' }, pointers: [ptr(1, 'c2')] })] },
        { say: 2, note: `dp[3] === Infinity → return ${IMP.ans}.`, panels: [arr(IMP.dp.map(inf), { label: 'dp, coins [2]', highlights: { 3: 'bad' } }), vars({ return: IMP.ans })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the fill([]) trap',
      lines: ['`const rows = new Array(3).fill([]);`', '`rows[0].push(1);`'],
      panels: [arr(['[]', '[]', '[]'], { label: 'rows' })],
      task: {
        type: 'choose',
        question: 'What is `rows[2]` now?',
        options: [
          { text: '[1]', why: '' },
          { text: '[]', why: 'fill([]) puts the same array in every slot; pushing to one changes all.' },
          { text: 'undefined', why: 'Every slot holds an array — the same one.' },
        ],
        answer: 0,
      },
      solved: 'All rows share one array. Use `Array.from({ length: n }, () => [])`.',
      then: [{ say: 1, note: 'One shared array, seen through three slots.', panels: [arr(['[1]', '[1]', '[1]'], { label: 'rows', highlights: hl(3, () => 'bad') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: modulo products',
      lines: ['"Answer modulo 1e9+7". Integers are exact only up to 2⁵³ − 1.'],
      panels: [vars({ a: '≈1e9', b: '≈1e9', 'a*b': '≈1e18' })],
      task: {
        type: 'choose',
        question: 'Is `(a * b) % MOD` safe with plain Numbers?',
        options: [
          { text: 'No: 1e9 × 1e9 exceeds 2⁵³ — use BigInt or split the multiplication', why: '' },
          { text: 'Yes: % brings it back below MOD', why: 'The product already lost precision before % runs.' },
          { text: 'Yes, as long as % is applied after every addition', why: 'That protects sums; the product itself still exceeds 2⁵³.' },
        ],
        answer: 0,
      },
      solved: 'Apply % after every addition, and use BigInt (or split) for products near 1e9 × 1e9.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'rob([2, 7, 9, 3, 1]) with two variables',
      lines: ['Start: `prev2 = 0`, `prev1 = 0`.', 'rob = `prev2 + money`.', 'skip = `prev1`; cur = the bigger; then shift.'],
      frames: [{ say: 0, note: 'Before house 0: prev2 = 0, prev1 = 0.', panels: [arr(DRY, { label: 'money' }), vars({ prev2: 0, prev1: 0 })] }, ...dryFrames(0, 4)],
    },
    {
      kind: 'turn',
      title: 'Your turn: the last house',
      lines: ['After house 3: prev2 = 11, prev1 = 11.', 'House 4 holds 1.'],
      panels: [arr(DRY, { label: 'money', highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'active' } }), vars({ prev2: 11, prev1: 11 })],
      task: { type: 'number', question: 'cur at house 4 = ?', options: [11, 12, 13, 21], answer: DRYRUN.rows[4].cur, hint: 'max(prev1, prev2 + money) = max(11, 11 + 1).' },
      solved: `max(11, 11 + 1) = ${DRYRUN.rows[4].cur}. The answer is prev1 = ${DRYRUN.ans}.`,
      then: dryFrames(4, 5),
    },
    {
      kind: 'turn',
      title: 'Your turn: which houses?',
      lines: [`The answer is ${DRYRUN.ans}.`, 'No two robbed houses may be neighbours.'],
      panels: [arr(DRY, { label: 'money' }), vars({ answer: DRYRUN.ans })],
      task: {
        type: 'choose',
        question: `Which houses make ${DRYRUN.ans}?`,
        options: [
          { text: '0, 2 and 4', why: '' },
          { text: '1 and 3', why: '7 + 3 = 10, not 12.' },
          { text: '0, 2 and 3', why: '2 + 9 + 3 = 14, but houses 2 and 3 are neighbours.' },
          { text: '1 and 4', why: '7 + 1 = 8.' },
        ],
        answer: 0,
      },
      solved: '2 + 9 + 1 = 12: houses 0, 2 and 4.',
      then: [{ say: 0, note: 'Rob 0, 2, 4: 2 + 9 + 1 = 12.', panels: [arr(DRY, { label: 'money', highlights: { 0: 'done', 2: 'done', 4: 'done', 1: 'muted', 3: 'muted' } })] }],
    },
  ],

  mistakes: [
    {
      kind: 'turn',
      title: 'Your turn: a vague state',
      lines: ['If you cannot say "dp[i] means …" in one sentence, the transition will be wrong.'],
      panels: [arr(['?', '?', '?', '?'], { label: 'dp' })],
      task: {
        type: 'choose',
        question: 'Which is a usable state for house robber?',
        options: [
          { text: 'dp[i] = max money from the first i houses', why: '' },
          { text: 'dp[i] = the houses we robbed', why: 'A set of houses is not a number to combine, and "which i" is unclear.' },
          { text: 'dp[i] = the robber at house i', why: 'This names no quantity: what is max-ed or summed?' },
        ],
        answer: 0,
      },
      solved: 'One sentence, one number per i: then the transition writes itself.',
    },
    {
      kind: 'turn',
      title: 'Your turn: min-DP filled with 0',
      lines: ['Coin change, coins [1, 3, 4], amount 6.', 'Someone writes `fill(0)` instead of `fill(Infinity)`.'],
      panels: [arr(ZERO_FILL.dp, { label: 'dp after fill(0)', highlights: hl(7, () => 'bad') })],
      task: { type: 'number', question: 'What does it return?', options: [-1, 0, 2, 3], answer: ZERO_FILL.ans, hint: '`dp[x − c] + 1 < 0` is never true.' },
      solved: 'It returns 0: no cell ever improves. Base cases: 0 for costs (dp[0]), Infinity for unreachable.',
    },
    {
      kind: 'watch',
      title: 'Greedy where DP is needed',
      lines: ['Greedy trusts the biggest coin.', 'Test a counter-example: coins [1, 3, 4], amount 6.'],
      frames: greedyFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: modulo only at the end',
      lines: ['Integers are exact only up to 2⁵³ − 1.', 'Intermediate sums beyond that lose precision.'],
      panels: [vars({ big: '2 ** 53' })],
      task: {
        type: 'choose',
        question: 'What is `2 ** 53 + 1 === 2 ** 53` in JS?',
        options: [
          { text: 'true', why: '' },
          { text: 'false', why: '2⁵³ + 1 cannot be stored exactly; it rounds back to 2⁵³.' },
        ],
        answer: 0,
      },
      solved: 'Precision is gone above 2⁵³ — apply `%` after **every** addition.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: tell the story',
      lines: ['Say the state out loud first: "dp[i] is the max money from the first i houses."', 'Then walk the interviewer through the versions.'],
      panels: [vars({ dp: 'first i' })],
      task: { type: 'order', question: 'Tap the story in order.', items: ['Brute-force recursion', 'Point at the repeated subproblem', 'Add memoization', 'Tabulation', 'O(1) space'], hint: 'Start slow and correct; each step fixes the previous one.' },
      solved: 'Brute force → repeat → memo → table → O(1) space. Mention JS stack depth when you recurse on large n.',
    },
    {
      kind: 'turn',
      title: 'Your turn: clarify first',
      lines: ['"Count the ways to make 3 from [1, 2]."', 'Two counting problems hide behind this sentence.'],
      panels: [arr([1, 2], { label: 'nums' }), vars({ target: 3 })],
      task: {
        type: 'choose',
        question: 'What should you ask before coding?',
        options: [
          { text: 'Does order matter — is (1,2) different from (2,1)?', why: '' },
          { text: 'Is the array sorted?', why: 'Sorting does not decide the answer; the loop order does.' },
          { text: 'Can the answer be negative?', why: 'A count is never negative.' },
        ],
        answer: 0,
      },
      solved: 'Ordered → combination sum IV (amount outside); unordered → coin change II.',
    },
  ],
};
