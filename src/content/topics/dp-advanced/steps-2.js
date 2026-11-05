// Step lessons for DP Advanced, part 2 (tree, interval, bitmask, digit DP, mistakes, interview tips). Format:
// src/content/stepSchema.js. Facts come only from topic.js. Every pair, camera state, dp cell, mask level, TSP cost
// and digit count below comes from running the lesson's own code on the example input; check() throws on drift.
const arr = (values, opts = {}) => ({ kind: "array", values, ...opts });
const vars = (v) => ({ kind: "vars", vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({
  kind: "table",
  rowLabels,
  colLabels,
  cells,
  ...(states ? { states } : {}),
  ...(label ? { label } : {}),
});
const hl = (n, f) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s),
  );
const ptr = (index, label, color = "a") => ({ index, label, color });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-advanced/steps-2.js: ${msg}`);
};

// ---------- trees: level-order array → nodes with ids in level order, x = inorder position ----------
function build(level, labels) {
  const ns = [];
  const mk = (val, depth, parent) => {
    const n = { id: ns.length, val, left: null, right: null, depth, parent };
    n.name = labels ? labels[n.id] : String(val);
    ns.push(n);
    return n;
  };
  const q = [mk(level[0], 0, null)];
  let i = 1;
  for (let h = 0; h < q.length && i < level.length; h++) {
    const p = q[h];
    for (const side of ["left", "right"]) {
      if (i >= level.length) break;
      const v = level[i++];
      if (v !== null) {
        const c = mk(v, p.depth + 1, p.id);
        p[side] = c.id;
        q.push(c);
      }
    }
  }
  let k = 0;
  const ino = (id) => {
    if (id === null) return;
    ino(ns[id].left);
    ns[id].x = k++;
    ino(ns[id].right);
  };
  ino(0);
  return ns;
}
// o.st: id → state, o.el: child id → label on the edge to its parent
const draw = (ns, o = {}) => ({
  kind: "nodes",
  ...(o.label ? { label: o.label } : {}),
  nodes: ns.map((n) => ({
    id: n.id,
    label: n.name,
    x: n.x,
    y: n.depth,
    ...(o.st?.[n.id] ? { state: o.st[n.id] } : {}),
  })),
  edges: ns
    .filter((n) => n.parent !== null)
    .map((n) => ({
      from: n.parent,
      to: n.id,
      ...(o.el?.[n.id] !== undefined ? { label: String(o.el[n.id]) } : {}),
    })),
});
// House Robber III (intuition-tree): post-order, each node returns [rob, skip]
function robRun(ns) {
  const recs = [];
  const dfs = (id) => {
    if (id === null) return [0, 0];
    const [lr, ls] = dfs(ns[id].left);
    const [rr, rs] = dfs(ns[id].right);
    const robIt = ns[id].val + ls + rs;
    const skipIt = Math.max(lr, ls) + Math.max(rr, rs);
    recs.push({ id, l: [lr, ls], r: [rr, rs], pair: [robIt, skipIt] });
    return [robIt, skipIt];
  };
  const top = dfs(0);
  return { recs, best: Math.max(...top), top };
}
// minCameraCover (implementation-tree), recording every dfs return
function camRun(ns) {
  let cameras = 0;
  const recs = [];
  const dfs = (id) => {
    if (id === null) return 1;
    const l = dfs(ns[id].left);
    const r = dfs(ns[id].right);
    let s;
    if (l === 0 || r === 0) {
      cameras++;
      s = 2;
    } else if (l === 2 || r === 2) s = 1;
    else s = 0;
    recs.push({ id, l, r, s, cameras });
    return s;
  };
  const rootState = dfs(0);
  if (rootState === 0) cameras++;
  return { recs, cameras, rootState };
}
const pairStr = (p) => `${p[0]},${p[1]}`;
// tree frame after record k: done nodes get their returned value on the edge to the parent
const treeFrame = (ns, recs, k, show, stOf, extra = {}) => {
  const st = {};
  const el = {};
  recs.slice(0, k + 1).forEach((r, j) => {
    st[r.id] = stOf ? stOf(r, j === k) : j === k ? "active" : "done";
    if (ns[r.id].parent !== null) el[r.id] = show(r);
  });
  return draw(ns, { st, el, ...extra });
};
const camSt = (r, now) =>
  now ? "active" : r.s === 2 ? "done" : r.s === 0 ? "bad" : "visited";
const camWord = ["not covered", "covered", "camera"];

// intuition-tree: robber on [3, 2, 3, null, 3, null, 1]
const RB = build([3, 2, 3, null, 3, null, 1]);
const RBR = robRun(RB);
check(
  same(
    RBR.recs.map((r) => r.pair),
    [
      [3, 0],
      [2, 3],
      [1, 0],
      [3, 1],
      [7, 6],
    ],
  ) && RBR.best === 7,
  "robber pairs",
);
const rbNote = (r) => {
  const n = RB[r.id];
  if (n.left === null && n.right === null)
    return `Leaf ${n.val}: rob = ${n.val}, skip = 0 → [${pairStr(r.pair)}].`;
  return `Node ${n.val}: rob = ${n.val} + ${r.l[1]} + ${r.r[1]} = ${r.pair[0]}; skip = ${Math.max(...r.l)} + ${Math.max(...r.r)} = ${r.pair[1]}.`;
};
const RB_ROOT = RBR.recs.length - 1;
// intuition-tree: cameras on a 6-node tree a..f
const CM = build(
  ["a", "b", "c", "d", "e", null, null, "f"],
  ["a", "b", "c", "d", "e", "f"],
);
const CMR = camRun(CM);
check(
  same(
    CMR.recs.map((r) => CM[r.id].name + r.s).join(" "),
    "f0 d2 e0 b2 c0 a2",
  ) && CMR.cameras === 3,
  "cameras a..f",
);
const CM_B = CMR.recs.findIndex((r) => CM[r.id].name === "b");
const cmNote = (r) => {
  const n = CM[r.id];
  const why =
    r.l === 0 || r.r === 0
      ? "a child is 0 → camera here"
      : r.l === 2 || r.r === 2
        ? "a child has a camera → covered"
        : "no child watches it → 0, parent must fix";
  return `${n.name}: children ${r.l}, ${r.r}${n.left === null && n.right === null ? " (nulls count as 1)" : ""}; ${why} → ${r.s}.`;
};
// implementation-tree: a path of 4 (root ends up 0), and a perfect tree of 7
const P4 = build(["a", "b", null, "c", null, "d"], ["a", "b", "c", "d"]);
const P4R = camRun(P4);
check(
  same(
    P4R.recs.map((r) => r.s),
    [0, 2, 1, 0],
  ) &&
    P4R.rootState === 0 &&
    P4R.cameras === 2,
  "path of 4",
);
const T7 = build([0, 0, 0, 0, 0, 0, 0], ["a", "b", "c", "d", "e", "f", "g"]);
const T7R = camRun(T7);
check(T7R.cameras === 2 && T7R.rootState === 1, "perfect 7");

// ---------- interval DP ----------
// maxCoins (template-interval), one record per (i, j) with every k tried
function burst(nums) {
  const a = [1, ...nums, 1];
  const m = a.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  const recs = [];
  for (let len = 2; len < m; len++)
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      const tries = [];
      for (let k = i + 1; k < j; k++) {
        const v = dp[i][k] + dp[k][j] + a[i] * a[k] * a[j];
        tries.push({ k, v, l: dp[i][k], r: dp[k][j], c: a[i] * a[k] * a[j] });
        dp[i][j] = Math.max(dp[i][j], v);
      }
      const best = tries.find((t) => t.v === dp[i][j]);
      recs.push({
        i,
        j,
        len,
        tries,
        val: dp[i][j],
        k: best.k,
        snap: dp.map((r) => r.slice()),
      });
    }
  return { a, m, dp, recs, ans: dp[0][m - 1] };
}
// minCost (implementation-interval), same record shape (cost is added once, outside the k loop)
function stick(n, cuts) {
  const pos = [0, ...[...cuts].sort((x, y) => x - y), n];
  const m = pos.length;
  const dp = Array.from({ length: m }, () => new Array(m).fill(0));
  const recs = [];
  for (let len = 2; len < m; len++)
    for (let i = 0; i + len < m; i++) {
      const j = i + len;
      let best = Infinity;
      const tries = [];
      for (let k = i + 1; k < j; k++) {
        tries.push({ k, v: dp[i][k] + dp[k][j] });
        best = Math.min(best, dp[i][k] + dp[k][j]);
      }
      dp[i][j] = best + (pos[j] - pos[i]);
      recs.push({
        i,
        j,
        tries,
        best,
        len: pos[j] - pos[i],
        val: dp[i][j],
        k: tries.find((t) => t.v === best).k,
        snap: dp.map((r) => r.slice()),
      });
    }
  return { pos, m, dp, recs, ans: dp[0][m - 1] };
}
// dp table: rows i = 0..m−3, cols j = 2..m−1; '–' where j − i < 2, '·' until filled
const ivTable = (run, upto, opts = {}) => {
  const rows = Array.from({ length: run.m - 2 }, (_, i) => i);
  const cols = Array.from({ length: run.m - 2 }, (_, c) => c + 2);
  const cur = upto >= 0 ? run.recs[upto] : null;
  const snap = cur ? cur.snap : run.dp.map((r) => r.map(() => 0));
  const filled = new Set(
    run.recs.slice(0, upto + 1).map((r) => `${r.i},${r.j}`),
  );
  if (opts.hide) filled.delete(`${cur.i},${cur.j}`);
  const cells = rows.map((i) =>
    cols.map((j) =>
      j - i < 2 ? "–" : filled.has(`${i},${j}`) ? snap[i][j] : "·",
    ),
  );
  const states = rows.map((i) =>
    cols.map((j) => {
      if (cur && i === cur.i && j === cur.j) return "active";
      if (
        cur &&
        opts.deps &&
        ((i === cur.i && j === opts.deps) || (i === opts.deps && j === cur.j))
      )
        return "window";
      return filled.has(`${i},${j}`) ? "done" : "";
    }),
  );
  return table(
    rows.map((i) => `i=${i}`),
    cols.map((j) => `j=${j}`),
    cells,
    states,
    opts.label || "dp[i][j]",
  );
};
const wallArr = (vals, i, j, k, label, extra = {}) =>
  arr(vals, {
    label,
    highlights: hl(vals.length, (x) =>
      x === k
        ? "active"
        : x === i || x === j
          ? "window"
          : x > i && x < j
            ? ""
            : "muted",
    ),
    pointers: [
      ptr(i, "i", "b"),
      ...(k !== undefined ? [ptr(k, "k")] : []),
      ptr(j, "j", "b"),
    ],
    ...extra,
  });
const triesStr = (r) => r.tries.map((t) => `k=${t.k}: ${t.v}`).join(", ");

// intuition-interval: [3, 1, 5]
const B3 = burst([3, 1, 5]);
check(same(B3.a, [1, 3, 1, 5, 1]) && B3.ans === 35, "burst [3,1,5] = 35");
const B3_FULL = B3.recs[B3.recs.length - 1];
check(
  B3_FULL.k === 3 &&
    same(
      B3_FULL.tries.map((t) => t.v),
      [33, 9, 35],
    ),
  "burst (0,4) tries",
);
// stick n = 7, cuts [1, 5]
const S7 = stick(7, [1, 5]);
check(
  same(S7.pos, [0, 1, 5, 7]) &&
    S7.ans === 12 &&
    same(
      S7.recs[2].tries.map((t) => t.v),
      [6, 5],
    ),
  "stick 7 [1,5]",
);
const B3_ORDER = B3.recs.map((r) => `(${r.i},${r.j})`);
check(
  same(B3_ORDER, ["(0,2)", "(1,3)", "(2,4)", "(0,3)", "(1,4)", "(0,4)"]),
  "fill order",
);
const B3_03 = B3.recs.findIndex((r) => r.i === 0 && r.j === 3);
check(
  B3.recs[B3_03].k === 1 && B3.recs[B3_03].val === 30,
  "dp[0][3] = 30 via k = 1",
);
// implementation-interval: n = 10, cuts [7, 2, 4]
const S10 = stick(10, [7, 2, 4]);
check(same(S10.pos, [0, 2, 4, 7, 10]), "stick 10 pos");
const S10_LAST = S10.recs.length - 1;
// dry-run-interval: the lesson's own table
const BD = burst([3, 1, 5, 8]);
const bdv = (i, j) => BD.dp[i][j];
check(
  same(BD.a, [1, 3, 1, 5, 8, 1]) &&
    bdv(0, 2) === 3 &&
    bdv(1, 3) === 15 &&
    bdv(2, 4) === 40 &&
    bdv(3, 5) === 40 &&
    bdv(1, 4) === 135 &&
    bdv(0, 4) === 159 &&
    bdv(0, 5) === 167,
  "dry run values",
);
const BD_14 = BD.recs.findIndex((r) => r.i === 1 && r.j === 4);
const BD_05 = BD.recs.length - 1;
check(BD.recs[BD_14].k === 3 && BD.recs[BD_05].k === 4, "dry run best k");

// ---------- bitmask DP ----------
const bitsOf = (x, n) =>
  Array.from({ length: n }, (_, k) => (x >> (n - 1 - k)) & 1);
const at = (b, n) => n - 1 - b;
const bstr = (x, n) => bitsOf(x, n).join("");
const onBits = (x, n, s = "active") =>
  Object.fromEntries(
    Array.from({ length: n }, (_, b) => b)
      .filter((b) => (x >> b) & 1)
      .map((b) => [at(b, n), s]),
  );
const bitP = (x, n, opts = {}) =>
  arr(bitsOf(x, n), {
    showIndices: false,
    label: `mask = ${bstr(x, n)}`,
    ...opts,
  });
const keyP = (n) =>
  arr(
    Array.from({ length: n }, (_, k) => `i${n - 1 - k}`),
    { showIndices: false, label: "item of each bit" },
  );
// canPartitionKSubsets (template-bitmask), one record per mask processed
function partition(nums, k) {
  const total = nums.reduce((a, b) => a + b, 0);
  const target = total / k;
  const n = nums.length;
  const FULL = (1 << n) - 1;
  const dp = new Int32Array(1 << n).fill(-1);
  dp[0] = 0;
  const recs = [];
  for (let mask = 0; mask <= FULL; mask++) {
    if (dp[mask] === -1) {
      recs.push({ mask, skip: true, ev: [], dp: [...dp] });
      continue;
    }
    const ev = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) continue;
      const next = mask | (1 << i);
      if (dp[next] !== -1) {
        ev.push({ i, next, kind: "seen" });
        continue;
      }
      if (dp[mask] + nums[i] <= target) {
        dp[next] = (dp[mask] + nums[i]) % target;
        ev.push({ i, next, kind: "set", v: dp[next] });
      } else ev.push({ i, next, kind: "over", sum: dp[mask] + nums[i] });
    }
    recs.push({ mask, ev, dp: [...dp] });
  }
  return { target, dp: [...dp], recs, ok: dp[FULL] === 0 };
}
// intuition-bitmask
const M11 = 0b1011;
check((M11 & (1 << 2)) === 0 && (M11 | (1 << 2)) === 0b1111, "mask 1011");
const PI = partition([2, 1, 3], 2);
check(
  PI.target === 3 && PI.ok && PI.dp[0b101] === 2 && (2 + 3) % 3 === 2,
  "partition [2,1,3]",
);
// one bucket-by-bucket path for [2, 1, 3]: item 0, item 1, item 2
const PI_PATH = (() => {
  const nums = [2, 1, 3];
  let mask = 0;
  let lvl = 0;
  return [0, 1, 2].map((i) => {
    const raw = lvl + nums[i];
    mask |= 1 << i;
    lvl = raw % 3;
    check(PI.dp[mask] === lvl, `path level at ${mask}`);
    return { i, x: nums[i], raw, mask, lvl };
  });
})();
const overlap = (a, b) => {
  for (let L = Math.min(a.length, b.length); L > 0; L--)
    if (a.endsWith(b.slice(0, L))) return L;
  return 0;
};
const SS_COST = "cde".length - overlap("abc", "cde");
check(overlap("abc", "cde") === 1 && SS_COST === 2, "superstring cost");
// template-bitmask: [1, 2, 3], k = 2
const PT = partition([1, 2, 3], 2);
check(PT.ok && same(PT.dp, [0, 1, 2, 0, 0, 1, 2, 0]), "partition [1,2,3]");
const PT_M4 = PT.recs.findIndex((r) => r.mask === 4);
check(
  PT.recs[1].ev.some((e) => e.next === 5 && e.kind === "over") &&
    PT.recs[PT_M4].ev.some(
      (e) => e.next === 5 && e.kind === "set" && e.v === 1,
    ),
  "dp[5] rejected from 1, set from 4",
);
const PF = partition([2, 2, 2], 2);
check(!PF.ok && PF.dp[7] === -1, "partition [2,2,2] fails");
const dpP = (dp, mask, label, extra = {}) =>
  arr(dp, {
    label,
    indexBase: 0,
    highlights: hl(dp.length, (x) =>
      x === mask ? "active" : dp[x] === -1 ? "muted" : "",
    ),
    ...extra,
  });
const evStr = (e, nums) =>
  e.kind === "set"
    ? `i${e.i} → dp[${e.next}] = ${e.v}`
    : e.kind === "seen"
      ? `i${e.i}: dp[${e.next}] already set`
      : `i${e.i}: ${e.sum} > ${PT.target}`;
// implementation-bitmask: TSP with parent pointers, n = 3, startCost = 0
const TC = [
  [0, 1, 5],
  [2, 0, 3],
  [4, 1, 0],
];
function tsp(cost, n) {
  const N = 1 << n;
  const dp = Array.from({ length: N }, () => new Array(n).fill(Infinity));
  const parent = Array.from({ length: N }, () => new Array(n).fill(-1));
  for (let i = 0; i < n; i++) dp[1 << i][i] = 0;
  const recs = [];
  for (let mask = 1; mask < N; mask++)
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last)) || dp[mask][last] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue;
        const nm = mask | (1 << j);
        const cand = dp[mask][last] + cost[last][j];
        const won = cand < dp[nm][j];
        if (won) {
          dp[nm][j] = cand;
          parent[nm][j] = last;
        }
        recs.push({
          mask,
          last,
          j,
          nm,
          cand,
          won,
          dp: dp.map((r) => r.slice()),
        });
      }
    }
  return { dp, parent, recs };
}
const TS = tsp(TC, 3);
const TS_FULL = TS.dp[7];
const TS_BEST = TS_FULL.indexOf(Math.min(...TS_FULL));
check(
  same(TS_FULL, [3, 5, 4]) &&
    TS_BEST === 0 &&
    TS_FULL.filter((v) => v === 3).length === 1,
  "tsp full row",
);
const TS_WALK = (() => {
  const out = [];
  let mask = 7;
  let j = TS_BEST;
  while (j !== -1) {
    out.push(j);
    const p = TS.parent[mask][j];
    mask &= ~(1 << j);
    j = p;
  }
  return out;
})();
check(same(TS_WALK, [0, 1, 2]), "tsp walk");
const TS_ORDER = TS_WALK.slice().reverse();
const TROWS = [3, 5, 6, 7];
const tspTable = (dp, act) =>
  table(
    TROWS.map((m) => bstr(m, 3)),
    ["last 0", "last 1", "last 2"],
    TROWS.map((m) =>
      [0, 1, 2].map((l) =>
        !(m & (1 << l)) ? "–" : dp[m][l] === Infinity ? "∞" : dp[m][l],
      ),
    ),
    TROWS.map((m) =>
      [0, 1, 2].map((l) =>
        act && act[0] === m && act[1] === l
          ? "active"
          : act && act[2] === m && act[3] === l
            ? "window"
            : "",
      ),
    ),
    "dp[mask][last]",
  );
const costT = table(
  ["from 0", "from 1", "from 2"],
  ["to 0", "to 1", "to 2"],
  TC.map((r) => r.map((v, k) => v)),
  TC.map((r, a) => r.map((_, b) => (a === b ? "muted" : ""))),
  "cost",
);
const TS_A = TS.recs.find((r) => r.nm === 7 && r.j === 1 && r.won);
const TS_B = TS.recs.find((r) => r.nm === 7 && r.j === 1 && !r.won);
check(
  TS_A && TS_B && TS_A.cand === 5 && TS_B.cand === 6,
  "tsp dp[7][1] candidates",
);

// ---------- digit DP ----------
// countDigitOne with go(pos, tight, ones) (template-digit), logging every call at pos < L
function digitRun(n) {
  const digits = String(n).split("").map(Number);
  const L = digits.length;
  const memo = new Map();
  const log = [];
  function go(pos, tight, ones) {
    if (pos === L) return ones;
    const key = pos + "," + ones;
    if (!tight && memo.has(key)) {
      log.push({ pos, tight, ones, hit: true, total: memo.get(key) });
      return memo.get(key);
    }
    const limit = tight ? digits[pos] : 9;
    let total = 0;
    for (let d = 0; d <= limit; d++)
      total += go(pos + 1, tight && d === limit, ones + (d === 1 ? 1 : 0));
    if (!tight) memo.set(key, total);
    log.push({ pos, tight, ones, limit, total });
    return total;
  }
  return { digits, total: go(0, true, 0), log, memo };
}
const brute1 = (n) => {
  let c = 0;
  for (let x = 0; x <= n; x++)
    c += [...String(x)].filter((ch) => ch === "1").length;
  return c;
};
// implementation-digit: the formula loop
function formula(n) {
  let count = 0;
  const recs = [];
  for (let p = 1; p <= n; p *= 10) {
    const high = Math.floor(n / (p * 10));
    const cur = Math.floor(n / p) % 10;
    const low = n % p;
    const add = high * p + (cur > 1 ? p : cur === 1 ? low + 1 : 0);
    count += add;
    recs.push({ p, high, cur, low, add, count });
  }
  return { recs, count };
}
const F13 = formula(13);
check(
  F13.count === 6 &&
    same(
      F13.recs.map((r) => r.add),
      [2, 4],
    ),
  "n = 13",
);
const F21 = formula(21);
check(F21.count === 13 && brute1(21) === 13, "n = 21");
const D23 = digitRun(23);
check(D23.total === 13 && brute1(23) === 13, "go on 23");
const dcall = (pos, tight, ones) =>
  D23.log.find((c) => c.pos === pos && c.tight === tight && c.ones === ones);
check(
  dcall(1, false, 0).total === 1 &&
    dcall(1, false, 1).total === 11 &&
    dcall(1, true, 0).total === 1 &&
    D23.memo.size === 2,
  "go(1, ·, ·) on 23",
);
const F213 = formula(213);
check(
  F213.count === brute1(213) &&
    same(
      F213.recs.map((r) => r.add),
      [22, 24, 100],
    ),
  "n = 213",
);
const BIG = 3000000000;
check(((BIG / 1) | 0) < 0 && Math.floor(BIG / 1) === BIG, "32-bit overflow");
const digitArr = (n, idx, label, extra = {}) => {
  const ds = String(n).split("").map(Number);
  return arr(ds, {
    label,
    showIndices: false,
    highlights: hl(ds.length, (k) =>
      k === idx ? "active" : k < idx ? "done" : "",
    ),
    ...extra,
  });
};
const placeArr = (n, p) => {
  const ds = String(n).split("").map(Number);
  const c = ds.length - 1 - Math.round(Math.log10(p));
  return arr(ds, {
    label: `n = ${n}, p = ${p}`,
    showIndices: false,
    highlights: hl(ds.length, (k) =>
      k === c ? "active" : k < c ? "window" : "visited",
    ),
    pointers: [ptr(c, "cur")],
  });
};
const fVars = (r) =>
  vars({ p: r.p, high: r.high, cur: r.cur, low: r.low, add: r.add });

// ---------- mistakes ----------
const GR = build([4, 3, 3]);
const GRR = robRun(GR);
check(same(GRR.top, [4, 6]) && GRR.best === 6, "greedy root");
const SORTED_BAD = [10, 9, 2].sort();
check(same(SORTED_BAD, [10, 2, 9]), "lexicographic sort");
const lis = (nums) => {
  const tails = [];
  const snaps = [];
  for (const x of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
    snaps.push(tails.slice());
  }
  return snaps;
};
const LIS = lis([3, 4, 1]);
check(same(LIS[2], [1, 4]), "tails [1,4]");

export default {
  "intuition-tree": [
    {
      kind: "watch",
      title: "Robber: each child hands up [rob, skip]",
      lines: [
        "Post-order: children first, then the node.",
        "`rob = val + left.skip + right.skip`.",
        "`skip = max(left) + max(right)`.",
        "A null child hands up [0, 0].",
      ],
      frames: [
        {
          say: 0,
          note: "Tree [3, 2, 3, null, 3, null, 1]. No two linked houses may both be robbed.",
          panels: [draw(RB)],
        },
        ...RBR.recs.slice(0, RB_ROOT).map((r) => ({
          say:
            RB[r.id].left === null && RB[r.id].right === null
              ? 3
              : r.pair[0] === RB[r.id].val + r.l[1] + r.r[1]
                ? 1
                : 2,
          note: rbNote(r),
          panels: [
            treeFrame(
              RB,
              RBR.recs,
              RBR.recs.indexOf(r),
              (x) => pairStr(x.pair),
              null,
              { label: "edge = [rob, skip] sent up" },
            ),
          ],
        })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: the root robs",
      lines: [
        "Root 3 gets [2, 3] from the left and [3, 1] from the right.",
        "If the root is robbed, both children must be skipped.",
      ],
      panels: [
        treeFrame(
          RB,
          RBR.recs,
          RB_ROOT - 1,
          (x) => pairStr(x.pair),
          (r) => "done",
          { label: "edge = [rob, skip] sent up" },
        ),
      ],
      task: {
        type: "number",
        question: "What is rob for the root?",
        options: [6, RBR.top[0], 9, 8],
        answer: RBR.top[0],
        hint: "val + left.skip + right.skip = 3 + 3 + 1.",
      },
      solved: `rob = 3 + 3 + 1 = ${RBR.top[0]}; skip = max(2,3) + max(3,1) = ${RBR.top[1]}. Answer max = ${RBR.best}.`,
      then: [
        {
          note: `Root returns [${pairStr(RBR.top)}]: rob the root and the two bottom houses, ${RBR.best}.`,
          panels: [
            treeFrame(
              RB,
              RBR.recs,
              RB_ROOT,
              (x) => pairStr(x.pair),
              (r) =>
                r.pair[0] >= r.pair[1] && [0, 3, 4].includes(r.id)
                  ? "active"
                  : "done",
            ),
            vars({ root: `[${pairStr(RBR.top)}]`, best: RBR.best }),
          ],
        },
      ],
    },
    {
      kind: "watch",
      title: "Cameras: three states, bottom up",
      lines: [
        "0 = not covered, 1 = covered, 2 = camera.",
        "A null child counts as 1.",
        "Any child 0 → camera here (2).",
        "Else any child 2 → covered (1).",
        "Else → 0: the parent must fix it.",
      ],
      frames: [
        {
          say: 0,
          note: "Six nodes a–f. The edge to a parent will show the state the child returns.",
          panels: [draw(CM)],
        },
        ...CMR.recs
          .slice(0, CM_B)
          .map((r, k) => ({
            say:
              CM[r.id].left === null && CM[r.id].right === null
                ? 1
                : r.s === 2
                  ? 2
                  : r.s === 1
                    ? 3
                    : 4,
            note: cmNote(r),
            panels: [
              treeFrame(CM, CMR.recs, k, (x) => x.s, camSt, {
                label: "edge = state sent up",
              }),
            ],
          })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: node b",
      lines: ["b hears 2 from d (camera) and 0 from e (not covered)."],
      panels: [
        treeFrame(
          CM,
          CMR.recs,
          CM_B - 1,
          (x) => x.s,
          (r) => (r.s === 2 ? "done" : r.s === 0 ? "bad" : "visited"),
          { label: "edge = state sent up" },
        ),
      ],
      task: {
        type: "choose",
        question: "What does b return?",
        options: [
          { text: "2: put a camera on b", why: "" },
          {
            text: "1: d's camera already covers b",
            why: 'True, but e is still uncovered. The "any child 0" rule is checked first, and only a camera on b can reach e now.',
          },
          {
            text: "0: let a decide",
            why: "a cannot see e. A 0 child must be fixed by its own parent.",
          },
        ],
        answer: 0,
      },
      solved: "A 0 child wins: b gets a camera and returns 2.",
      then: CMR.recs
        .slice(CM_B)
        .map((r, k) => ({
          note:
            cmNote(r) +
            (k === CMR.recs.length - CM_B - 1
              ? ` ${CMR.cameras} cameras.`
              : ""),
          panels: [
            treeFrame(CM, CMR.recs, CM_B + k, (x) => x.s, camSt, {
              label: "edge = state sent up",
            }),
          ],
        })),
    },
  ],

  "implementation-tree": [
    {
      kind: "watch",
      title: "minCameraCover on a path of 4",
      lines: [
        "`dfs` returns COVERED for null.",
        "0 child → `cameras++`, return CAMERA.",
        "CAMERA child → return COVERED.",
        "Else return NOT_COVERED.",
        "Root returned 0 → one more camera.",
      ],
      frames: [
        {
          say: 0,
          note: "A path a → b → c → d. dfs reaches d first.",
          panels: [draw(P4), vars({ cameras: 0 })],
        },
        ...P4R.recs.map((r, k) => ({
          say: r.s === 2 ? 1 : r.s === 1 ? 2 : 3,
          note: `${P4[r.id].name}: l = ${r.l}, r = ${r.r} → returns ${r.s} (${camWord[r.s]}).`,
          panels: [
            treeFrame(P4, P4R.recs, k, (x) => x.s, camSt, {
              label: "edge = returned state",
            }),
            vars({ cameras: r.cameras }),
          ],
        })),
        {
          say: 4,
          note: `dfs(root) === NOT_COVERED, so cameras++ → ${P4R.cameras}. Without this line a is never watched.`,
          panels: [
            treeFrame(
              P4,
              P4R.recs,
              P4R.recs.length - 1,
              (x) => x.s,
              (r) => (r.s === 2 || r.id === 0 ? "done" : "visited"),
              { label: "edge = returned state" },
            ),
            vars({ cameras: P4R.cameras }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: a full tree of 7",
      lines: ["Every leaf returns 0.", "Run the same rules up to the root."],
      panels: [draw(T7)],
      task: {
        type: "number",
        question: "What does minCameraCover return?",
        options: [1, T7R.cameras, 3, 4],
        answer: T7R.cameras,
        hint: "b and c each have a 0 child. What does a then hear?",
      },
      solved: `b and c get cameras (2 each); a hears 2, 2 → covered. ${T7R.cameras} cameras, no root fix.`,
      then: [
        {
          note: `Cameras on b and c; a returns ${T7R.rootState}.`,
          panels: [
            treeFrame(
              T7,
              T7R.recs,
              T7R.recs.length - 1,
              (x) => x.s,
              (r) => (r.s === 2 ? "done" : r.s === 0 ? "bad" : "visited"),
              { label: "edge = returned state" },
            ),
            vars({ cameras: T7R.cameras }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: a very deep tree",
      lines: [
        "Recursion depth = tree height.",
        'A 10^4-node "linked-list" tree may approach the JS stack limit.',
      ],
      panels: [draw(P4, { label: "a skewed tree: height = n" })],
      task: {
        type: "choose",
        question: "Constraints allow very skewed trees. What do you do?",
        options: [
          { text: "Run the post-order with an explicit stack", why: "" },
          {
            text: "Memoize with a Map keyed by node",
            why: "A memo does not shorten the recursion; the depth is still the height.",
          },
          {
            text: "Nothing: tree DP is O(n)",
            why: "O(n) time is fine; the problem is the call-stack depth, not the time.",
          },
        ],
        answer: 0,
      },
      solved: "An explicit post-order stack removes the recursion depth limit.",
    },
  ],

  "intuition-interval": [
    {
      kind: "watch",
      title: "First vs last balloon",
      lines: [
        "Pad with 1 at both ends.",
        "Burst k FIRST: k−1 and k+1 become neighbours.",
        "Burst k LAST in (i, j): its neighbours are i and j.",
      ],
      frames: [
        {
          say: 0,
          note: `nums = [3, 1, 5] → a = [${B3.a.join(", ")}]. Indexes 0 and 4 are walls.`,
          panels: [
            arr(B3.a, { label: "a", highlights: { 0: "window", 4: "window" } }),
          ],
        },
        {
          say: 1,
          note: "Burst the 1 (index 2) first: 3 · 1 · 5.",
          panels: [
            arr(B3.a, {
              label: "a",
              highlights: { 2: "bad", 1: "visited", 3: "visited" },
            }),
          ],
        },
        {
          say: 1,
          note: "Now 3 and 5 touch. The left and right sides interact. ❌",
          panels: [
            arr([1, 3, 5, 1], {
              label: "after bursting the 1",
              highlights: { 1: "bad", 2: "bad" },
            }),
          ],
        },
        {
          say: 2,
          note: "Instead: 5 (k = 3) is burst LAST inside (0, 4). It stands while (0, 3) and (3, 4) are cleared.",
          panels: [wallArr(B3.a, 0, 4, 3, "k last in (0, 4)")],
        },
        {
          say: 2,
          note: `When 5 goes, its neighbours are the walls: 1·5·1 = ${B3_FULL.tries[2].c}. Total dp[0][3] + dp[3][4] + ${B3_FULL.tries[2].c}.`,
          panels: [
            wallArr(B3.a, 0, 4, 3, "k last in (0, 4)"),
            vars({ left: "(0,3)", right: "(3,4)", cost: B3_FULL.tries[2].c }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: the last balloon's neighbours",
      lines: [
        "Range (1, 4) of a = [1, 3, 1, 5, 1].",
        "k = 2 (the 1) is burst last inside it.",
      ],
      panels: [wallArr(B3.a, 1, 4, 2, "k last in (1, 4)")],
      task: {
        type: "choose",
        question: "What does bursting k earn?",
        options: [
          { text: "a[1] · a[2] · a[4] = 3 · 1 · 1", why: "" },
          {
            text: "a[1] · a[2] · a[3] = 3 · 1 · 5",
            why: "Index 3 is inside (1, 4); it was burst before k, so it is gone.",
          },
          {
            text: "a[2] alone = 1",
            why: "A burst always multiplies by both current neighbours.",
          },
        ],
        answer: 0,
      },
      solved:
        "Everything else in (1, 4) is gone, so k sits between the walls: 3 · 1 · 1 = 3.",
    },
    {
      kind: "watch",
      title: "Stick: the FIRST cut",
      lines: [
        "Sort the cuts and add 0 and n as walls.",
        "The first cut in a piece costs `pos[j] − pos[i]`.",
        "It leaves two separate pieces.",
      ],
      frames: [
        {
          say: 0,
          note: `n = 7, cuts [1, 5] → pos = [${S7.pos.join(", ")}].`,
          panels: [
            arr(S7.pos, {
              label: "pos",
              highlights: { 0: "window", 3: "window" },
            }),
          ],
        },
        ...S7.recs
          .slice(0, 2)
          .map((r) => ({
            say: 1,
            note: `Piece (${r.i}, ${r.j}) = ${S7.pos[r.i]}..${S7.pos[r.j]}: one cut inside, costs ${r.len}.`,
            panels: [
              wallArr(S7.pos, r.i, r.j, r.k, `pos, piece (${r.i}, ${r.j})`),
            ],
          })),
        {
          say: 2,
          note: `Whole stick: the first cut costs 7 either way. Cut at 1 → pieces (0,1) + (1,3) = ${S7.recs[2].tries[0].v}.`,
          panels: [wallArr(S7.pos, 0, 3, 1, "first cut at 1")],
        },
        {
          say: 2,
          note: `Cut at 5 → (0,2) + (2,3) = ${S7.recs[2].tries[1].v}.`,
          panels: [wallArr(S7.pos, 0, 3, 2, "first cut at 5")],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: cheapest stick",
      lines: ["`dp[0][3] = 7 + min(6, 5)`."],
      panels: [arr(S7.pos, { label: "pos" }), vars({ "k=1": 6, "k=2": 5 })],
      task: {
        type: "number",
        question: "Minimum total cost?",
        options: [S7.ans, 13, 7, 11],
        answer: S7.ans,
        hint: "Piece length 7 plus the smaller split.",
      },
      solved: `Cut at 5 first (7), then cut 0..5 at 1 (5): ${S7.ans}.`,
    },
  ],

  "optimized-interval": [
    {
      kind: "watch",
      title: "The recipe on [3, 1, 5]",
      lines: [
        "Add sentinels so every range has walls.",
        "dp[i][j] is the open interval; nothing inside → 0.",
        "Split on the LAST burst; cost uses only i, k, j.",
        "Iterate by length; try every k in (i, j).",
        "Answer dp[0][m − 1].",
      ],
      frames: [
        {
          say: 0,
          note: `a = [${B3.a.join(", ")}], m = ${B3.m}.`,
          panels: [
            arr(B3.a, { label: "a", highlights: { 0: "window", 4: "window" } }),
          ],
        },
        {
          say: 1,
          note: "Neighbouring walls (j − i = 1) have nothing inside: dp = 0.",
          panels: [
            wallArr(B3.a, 2, 3, undefined, "(2, 3): empty"),
            ivTable(B3, -1),
          ],
        },
        {
          say: 2,
          note: "cost(i, k, j) = a[i] · a[k] · a[j]. Nothing else from outside.",
          panels: [
            wallArr(B3.a, 1, 3, 2, "k last in (1, 3)"),
            vars({ cost: "3·1·5" }),
          ],
        },
        ...B3.recs
          .slice(0, 3)
          .map((r, k) => ({
            say: 3,
            note: `Length 2: (${r.i}, ${r.j}) has one k → ${r.val}.`,
            panels: [
              wallArr(B3.a, r.i, r.j, r.k, `(${r.i}, ${r.j})`),
              ivTable(B3, k),
            ],
          })),
        {
          say: 4,
          note: "Longer ranges follow; the last one filled is dp[0][4].",
          panels: [ivTable(B3, 2), vars({ answer: "dp[0][4]" })],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: the fill order",
      lines: ["m = 5. Loop: `len` from 2, then `i` upward, `j = i + len`."],
      panels: [ivTable(B3, -1)],
      task: {
        type: "order",
        question: "Tap the intervals in the order they are filled.",
        items: B3_ORDER,
        hint: "All length-2 ranges left to right, then length 3, then length 4.",
      },
      solved: "Each range only reads shorter ones, which are already done.",
    },
  ],

  "template-interval": [
    {
      kind: "watch",
      title: "maxCoins([3, 1, 5]): short ranges",
      lines: [
        "`a = [1, ...nums, 1]`; dp starts at 0.",
        "For each (i, j), try every k as the LAST burst.",
        "`dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]`.",
      ],
      frames: [
        {
          say: 0,
          note: `a = [${B3.a.join(", ")}]. Rows i, columns j.`,
          panels: [arr(B3.a, { label: "a" }), ivTable(B3, -1)],
        },
        ...B3.recs
          .slice(0, B3_03)
          .map((r, k) => ({
            say: 2,
            note: `(${r.i}, ${r.j}): k = ${r.k} → ${r.tries[0].l} + ${r.tries[0].r} + ${r.tries[0].c} = ${r.val}.`,
            panels: [
              wallArr(B3.a, r.i, r.j, r.k, `(${r.i}, ${r.j})`),
              ivTable(B3, k),
            ],
          })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: best k for (0, 3)",
      lines: [
        "k = 1: dp[0][1] + dp[1][3] + 1·3·5.",
        "k = 2: dp[0][2] + dp[2][3] + 1·1·5.",
      ],
      panels: [
        wallArr(B3.a, 0, 3, undefined, "a, range (0, 3)"),
        ivTable(B3, B3_03 - 1),
      ],
      task: {
        type: "cell",
        question: "Which balloon should be burst last in (0, 3)?",
        answer: B3.recs[B3_03].k,
        hints: {
          2: `k = 2: 3 + 0 + 5 = ${B3.recs[B3_03].tries[1].v}. Smaller.`,
          0: "Index 0 is a wall, not a balloon in the range.",
          3: "Index 3 is the right wall.",
          4: "Outside the range.",
        },
      },
      solved: `k = 1 (the 3): 0 + 15 + 15 = 30 beats 8. dp[0][3] = ${B3.recs[B3_03].val}.`,
      then: B3.recs
        .slice(B3_03, B3.recs.length - 1)
        .map((r, k) => ({
          note: `(${r.i}, ${r.j}): ${triesStr(r)} → ${r.val}.`,
          panels: [
            wallArr(B3.a, r.i, r.j, r.k, `(${r.i}, ${r.j}), best k = ${r.k}`),
            ivTable(B3, B3_03 + k),
          ],
        })),
    },
    {
      kind: "turn",
      title: "Your turn: the whole row",
      lines: [
        "dp[0][4] tries k = 1, 2, 3.",
        "Read dp[0][k] and dp[k][4] from the table.",
      ],
      panels: [arr(B3.a, { label: "a" }), ivTable(B3, B3.recs.length - 2)],
      task: {
        type: "number",
        question: "maxCoins([3, 1, 5]) = dp[0][4] = ?",
        options: [33, B3.ans, 30, 39],
        answer: B3.ans,
        hint: "k = 3: dp[0][3] + dp[3][4] + 1·5·1.",
      },
      solved: `${triesStr(B3_FULL)} → ${B3.ans}.`,
      then: [
        {
          note: `dp[0][4] = ${B3.ans}: burst 1, then 3, then 5.`,
          panels: [ivTable(B3, B3.recs.length - 1)],
        },
      ],
    },
  ],

  "implementation-interval": [
    {
      kind: "watch",
      title: "minCost(10, [7, 2, 4])",
      lines: [
        "Sort numerically, add 0 and n.",
        "best = min over k of `dp[i][k] + dp[k][j]`.",
        "Then add the piece length `pos[j] − pos[i]` once.",
      ],
      frames: [
        {
          say: 0,
          note: `pos = [${S10.pos.join(", ")}]. Only the cuts matter, not every unit of length.`,
          panels: [arr(S10.pos, { label: "pos" }), ivTable(S10, -1)],
        },
        ...S10.recs
          .slice(0, S10_LAST)
          .map((r, k) => ({
            say: r.tries.length > 1 ? 2 : 1,
            note: `(${r.i}, ${r.j}): best ${r.best} (${triesStr(r)}) + length ${r.len} = ${r.val}.`,
            panels: [
              wallArr(
                S10.pos,
                r.i,
                r.j,
                r.k,
                `piece ${S10.pos[r.i]}..${S10.pos[r.j]}`,
              ),
              ivTable(S10, k),
            ],
          })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: the whole stick",
      lines: ["dp[0][4]: piece 0..10, first cut k = 1, 2 or 3."],
      panels: [arr(S10.pos, { label: "pos" }), ivTable(S10, S10_LAST - 1)],
      task: {
        type: "number",
        question: "minCost(10, [7, 2, 4]) = ?",
        options: [S10.ans, S10.ans + 3, 10, S10.ans - 2],
        answer: S10.ans,
        hint: `k options: ${triesStr(S10.recs[S10_LAST])}. Add 10.`,
      },
      solved: `best ${S10.recs[S10_LAST].best} + 10 = ${S10.ans}.`,
      then: [
        { note: `dp[0][4] = ${S10.ans}.`, panels: [ivTable(S10, S10_LAST)] },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: why add the length outside?",
      lines: ["`dp[i][j] = best + (pos[j] − pos[i])`."],
      panels: [wallArr(S10.pos, 0, 4, undefined, "piece 0..10")],
      task: {
        type: "choose",
        question: "Why is the length added after the k loop?",
        options: [
          {
            text: "The first cut costs the same piece length whatever k is",
            why: "",
          },
          {
            text: "The length depends on k",
            why: "pos[j] − pos[i] uses only the walls i and j.",
          },
          {
            text: "Adding inside the loop would be wrong",
            why: "It would give the same answer; it is just repeated work.",
          },
        ],
        answer: 0,
      },
      solved: "Cost uses only i and j, so add it once.",
    },
  ],

  "dry-run-interval": [
    {
      kind: "watch",
      title: "Length 2: one balloon each",
      lines: [
        "a = [1, 3, 1, 5, 8, 1].",
        "Each (i, i+2) has one balloon: a[i]·a[k]·a[j].",
      ],
      frames: [
        {
          say: 0,
          note: "nums = [3, 1, 5, 8] padded. Rows i, columns j.",
          panels: [arr(BD.a, { label: "a" }), ivTable(BD, -1)],
        },
        ...BD.recs
          .filter((r) => r.j - r.i === 2)
          .map((r) => ({
            say: 1,
            note: `(${r.i},${r.j}) → {${BD.a[r.k]}}: ${BD.a[r.i]}·${BD.a[r.k]}·${BD.a[r.j]} = ${r.val}.`,
            panels: [
              wallArr(BD.a, r.i, r.j, r.k, `(${r.i}, ${r.j})`),
              ivTable(BD, BD.recs.indexOf(r)),
            ],
          })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: dp[1][4]",
      lines: [
        "Balloons {1, 5} between walls 3 and 8.",
        "k = 2: dp[1][2] + dp[2][4] + 3·1·8.",
        "k = 3: dp[1][3] + dp[3][4] + 3·5·8.",
      ],
      panels: [
        wallArr(BD.a, 1, 4, undefined, "range (1, 4)"),
        ivTable(BD, BD_14 - 1),
      ],
      task: {
        type: "number",
        question: "dp[1][4] = ?",
        options: [64, BD.dp[1][4], 120, 159],
        answer: BD.dp[1][4],
        hint: "k = 3: 15 + 0 + 120.",
      },
      solved: `k = 3 (5 last): 15 + 0 + 120 = 135 beats ${BD.recs[BD_14].tries[0].v}.`,
      then: BD.recs
        .slice(
          BD.recs.findIndex((r) => r.j - r.i === 3),
          BD_05,
        )
        .map((r) => ({
          note: `(${r.i},${r.j}): ${triesStr(r)} → ${r.val}.`,
          panels: [
            wallArr(BD.a, r.i, r.j, r.k, `(${r.i}, ${r.j}), k = ${r.k}`),
            ivTable(BD, BD.recs.indexOf(r)),
          ],
        })),
    },
    {
      kind: "turn",
      title: "Your turn: the last balloon overall",
      lines: ["dp[0][4] = 159 is ready.", "Pick k for (0, 5)."],
      panels: [
        wallArr(BD.a, 0, 5, undefined, "range (0, 5)"),
        ivTable(BD, BD_05 - 1),
      ],
      task: {
        type: "cell",
        question: "Which balloon is burst last in the best plan?",
        answer: BD.recs[BD_05].k,
        hints: Object.fromEntries(
          BD.recs[BD_05].tries
            .filter((t) => t.k !== BD.recs[BD_05].k)
            .map((t) => [t.k, `k = ${t.k} gives ${t.v}. Less than 167.`]),
        ),
      },
      solved:
        "k = 4 (8 last): dp[0][4] + dp[4][5] + 1·8·1 = 159 + 0 + 8 = 167.",
      then: [
        {
          note: "Final answer dp[0][5] = 167.",
          panels: [wallArr(BD.a, 0, 5, 4, "k = 4"), ivTable(BD, BD_05)],
        },
      ],
    },
  ],

  "intuition-bitmask": [
    {
      kind: "watch",
      title: "A subset is one integer",
      lines: [
        "Bit i set ⇔ item i used.",
        "`mask & (1 << i)` tests item i.",
        "`mask | (1 << i)` adds item i.",
      ],
      frames: [
        {
          say: 0,
          note: "mask = 0b1011: items 0, 1 and 3 are used.",
          panels: [
            keyP(4),
            bitP(M11, 4, { highlights: onBits(M11, 4, "done") }),
          ],
        },
        {
          say: 1,
          note: `mask & (1 << 2) = ${M11 & (1 << 2)}: item 2 not used.`,
          panels: [
            keyP(4),
            bitP(M11, 4, { highlights: { [at(2, 4)]: "bad" } }),
          ],
        },
        {
          say: 2,
          note: "mask | (1 << 2) = 0b1111: item 2 added.",
          panels: [
            keyP(4),
            bitP(M11 | 4, 4, { highlights: { [at(2, 4)]: "active" } }),
          ],
        },
      ],
    },
    {
      kind: "watch",
      title: "Partition: one number per mask",
      lines: [
        "target = total / k.",
        "`dp[mask]` = fill of the current bucket.",
        "Add item i if `dp[mask] + nums[i] <= target`.",
        "New fill = `(dp[mask] + nums[i]) % target`.",
      ],
      frames: [
        {
          say: 0,
          note: "nums = [2, 1, 3], k = 2 → target = 3. Start: mask 000, fill 0.",
          panels: [bitP(0, 3), vars({ target: 3, fill: 0 })],
        },
        ...PI_PATH.map((s) => ({
          say: s.raw === 3 ? 3 : 2,
          note: `Add item ${s.i} (${s.x}): ${s.raw - s.x} + ${s.x} = ${s.raw} ≤ 3 → fill ${s.lvl}${s.raw === 3 ? " (bucket full, reset)" : ""}.`,
          panels: [
            bitP(s.mask, 3, { highlights: { [at(s.i, 3)]: "active" } }),
            vars({ target: 3, fill: s.lvl }),
          ],
        })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: dp[0b101]",
      lines: [
        "nums = [2, 1, 3], target = 3.",
        "mask 101 = items 0 and 2 (values 2 and 3).",
        "Completed buckets are exactly full.",
      ],
      panels: [
        keyP(3),
        bitP(0b101, 3, { highlights: onBits(0b101, 3, "done") }),
      ],
      task: {
        type: "number",
        question: "dp[0b101] = ?",
        options: [-1, PI.dp[0b101], 5, 0],
        answer: PI.dp[0b101],
        hint: "The fill level equals sum(mask) % target.",
      },
      solved:
        "Item 2 first fills a bucket (3 → 0), then item 0 gives fill 2 = 5 % 3.",
    },
    {
      kind: "turn",
      title: "Your turn: superstring step",
      lines: [
        "`dp[mask][last]`: shortest string over mask ending with word last.",
        "Append j: `len(j) − overlap(last, j)`.",
      ],
      panels: [vars({ last: "abc", j: "cde" })],
      task: {
        type: "number",
        question: 'Extra length to append "cde" after "abc"?',
        options: [3, SS_COST, 1, 6],
        answer: SS_COST,
        hint: '"abc" ends with "c" and "cde" starts with it.',
      },
      solved: 'Overlap "c" is 1: 3 − 1 = 2, giving "abcde".',
    },
  ],

  "template-bitmask": [
    {
      kind: "watch",
      title: "canPartitionKSubsets([1, 2, 3], 2)",
      lines: [
        "`dp` = Int32Array of −1; `dp[0] = 0`.",
        "Masks in increasing order; skip −1.",
        "Skip used items and reachable `next`.",
        "Fits → `dp[next] = (fill + x) % target`.",
      ],
      frames: [
        {
          say: 0,
          note: "target = 3. Index = mask (8 masks for n = 3).",
          panels: [dpP([0, -1, -1, -1, -1, -1, -1, -1], 0, "dp[mask]")],
        },
        ...PT.recs.slice(0, PT_M4).map((r) => ({
          say: r.ev.some((e) => e.kind === "set") ? 3 : 2,
          note: `mask ${bstr(r.mask, 3)} (fill ${r.dp[r.mask]}): ${r.ev.map((e) => evStr(e)).join("; ")}.`,
          panels: [bitP(r.mask, 3), dpP(r.dp, r.mask, "dp[mask]")],
        })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: mask 100",
      lines: [
        "mask 001 tried item 2: 1 + 3 = 4 > 3, so dp[5] stayed −1.",
        "Now mask 100 (fill 0) tries item 0 (value 1).",
      ],
      panels: [bitP(4, 3), dpP(PT.recs[PT_M4 - 1].dp, 4, "dp[mask]")],
      task: {
        type: "number",
        question: "dp[5] after mask 100?",
        options: [-1, 1, 4, 0],
        answer: 1,
        hint: "0 + 1 ≤ 3, and (0 + 1) % 3.",
      },
      solved:
        "Another order reaches mask 101: 3 fills a bucket, then 1 starts the next. dp[5] = 1.",
      then: PT.recs
        .slice(PT_M4)
        .map((r) => ({
          note: `mask ${bstr(r.mask, 3)} (fill ${r.dp[r.mask]}): ${r.ev.length ? r.ev.map((e) => evStr(e)).join("; ") : "no unused items"}.`,
          panels: [bitP(r.mask, 3), dpP(r.dp, r.mask, "dp[mask]")],
        })),
    },
    {
      kind: "turn",
      title: "Your turn: [2, 2, 2], k = 2",
      lines: ["target = 3.", "Each item is 2."],
      panels: [dpP(PF.dp, 7, "dp[mask] at the end")],
      task: {
        type: "choose",
        question: "What is returned?",
        options: [
          { text: "false: dp[full] is −1", why: "" },
          {
            text: "true: 6 % 2 is 0",
            why: "That only passes the first check. Two 2s give 4 > 3, so no mask of two items is ever reached.",
          },
          {
            text: "true: dp[full] is 0",
            why: "dp[7] was never set; it is still −1.",
          },
        ],
        answer: 0,
      },
      solved:
        "Masks 011, 101, 110 and 111 stay −1, so `dp[FULL] === 0` is false.",
    },
  ],

  "implementation-bitmask": [
    {
      kind: "watch",
      title: "dp[mask][last] fills up",
      lines: [
        "Single items: `dp[1 << i][i] = startCost(i)` (0 here).",
        "Extend (mask, last) by an unused j.",
        "Keep the cheaper `cand`, and remember `parent`.",
      ],
      frames: [
        {
          say: 0,
          note: "n = 3, every start costs 0. Rows: masks with 2+ items.",
          panels: [
            costT,
            tspTable(
              TS.recs[0].dp.map((r, m) =>
                r.map((v) => (m === 1 || m === 2 || m === 4 ? v : Infinity)),
              ),
            ),
          ],
        },
        ...TS.recs
          .filter((r) => r.nm !== 7)
          .map((r) => ({
            say: 1,
            note: `(${bstr(r.mask, 3)}, last ${r.last}) + ${r.j}: 0 + ${TC[r.last][r.j]} → dp[${bstr(r.nm, 3)}][${r.j}] = ${r.cand}.`,
            panels: [costT, tspTable(r.dp, [r.nm, r.j])],
          })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: dp[111][1]",
      lines: ["Two ways end at 1: from (101, last 0) or (101, last 2)."],
      panels: [
        costT,
        tspTable(
          TS.recs
            .find((r) => r.nm === 7)
            .dp.map((row, m) =>
              m === 7 ? [Infinity, Infinity, Infinity] : row,
            ),
        ),
      ],
      task: {
        type: "number",
        question: "dp[111][1] = ?",
        options: [TS_A.cand, TS_B.cand, 4, 2],
        answer: TS_A.cand,
        hint: "dp[101][0] + cost[0][1] vs dp[101][2] + cost[2][1].",
      },
      solved: `From (101, last 0): 4 + 1 = 5. From (101, last 2): 5 + 1 = 6. Keep ${TS_A.cand}, parent = 0.`,
      then: TS.recs
        .filter((r) => r.nm === 7)
        .map((r) => ({
          note: `(${bstr(r.mask, 3)}, last ${r.last}) + ${r.j}: ${r.dp[r.mask][r.last]} + ${TC[r.last][r.j]} = ${r.cand}${r.won ? " → kept" : " → worse, dropped"}.`,
          panels: [costT, tspTable(r.dp, [r.nm, r.j, r.mask, r.last])],
        })),
    },
    {
      kind: "turn",
      title: "Your turn: rebuild the order",
      lines: [
        `Best in row 111: last = ${TS_BEST} (cost ${TS_FULL[TS_BEST]}).`,
        `parent[111][0] = ${TS.parent[7][0]}, parent[110][1] = ${TS.parent[6][1]}.`,
        "Walk parents backwards, then reverse.",
      ],
      panels: [tspTable(TS.dp, [7, TS_BEST])],
      task: {
        type: "order",
        question: "Tap the items in visiting order (first to last).",
        items: TS_ORDER.map((i) => `item ${i}`),
        hint: "The walk gives 0, 1, 2 from the end; reverse it.",
      },
      solved: `Order ${TS_ORDER.join(" → ")}: cost ${TC[2][1]} + ${TC[1][0]} = ${TS_FULL[TS_BEST]}.`,
    },
  ],

  "intuition-digit": [
    {
      kind: "watch",
      title: "Writing x ≤ 235 digit by digit",
      lines: [
        "Tight: the prefix equals n's prefix so far.",
        "Tight → the next digit is capped at n's digit.",
        "Pick below the cap → free: later digits 0–9.",
      ],
      frames: [
        {
          say: 0,
          note: "n = 235. Start tight: the first digit may be 0, 1 or 2.",
          panels: [digitArr(235, 0, "n"), vars({ tight: "yes", range: "0–2" })],
        },
        {
          say: 2,
          note: "Choose 0 or 1: x is already smaller than n. Every later digit is free.",
          panels: [
            arr([1, "?", "?"], {
              label: "x",
              showIndices: false,
              highlights: { 0: "done" },
            }),
            vars({ tight: "no", range: "0–9" }),
          ],
        },
        {
          say: 1,
          note: "Choose 2: still tight. The second digit is capped at 3.",
          panels: [
            arr([2, "?", "?"], {
              label: "x",
              showIndices: false,
              highlights: { 0: "active" },
            }),
            digitArr(235, 1, "n"),
            vars({ tight: "yes", range: "0–3" }),
          ],
        },
        {
          say: 2,
          note: "Second digit 0–2 frees us; 3 keeps us tight.",
          panels: [
            arr([2, 3, "?"], {
              label: "x",
              showIndices: false,
              highlights: { 0: "active", 1: "active" },
            }),
            digitArr(235, 2, "n"),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: the last digit",
      lines: ["n = 235. We chose 2, then 3: still tight."],
      panels: [
        arr([2, 3, "?"], {
          label: "x",
          showIndices: false,
          highlights: { 0: "active", 1: "active" },
        }),
        digitArr(235, 2, "n"),
      ],
      task: {
        type: "choose",
        question: "Which third digits are allowed?",
        options: [
          { text: "0–5", why: "" },
          {
            text: "0–9",
            why: "We are still tight, so the cap is n's digit, 5.",
          },
          {
            text: "0–3",
            why: "3 was the cap for the second digit. The third digit's cap is n's third digit.",
          },
          {
            text: "only 5",
            why: "Anything up to the cap is allowed; picking below 5 just ends tightness.",
          },
        ],
        answer: 0,
      },
      solved: "Tight → limit = digits[2] = 5. So 230 … 235.",
    },
    {
      kind: "watch",
      title: "The formula for n = 13",
      lines: [
        "At place p: high = left digits, cur = digit at p, low = right digits.",
        "`high · p` full cycles.",
        "Plus p if cur > 1, low + 1 if cur = 1, else 0.",
      ],
      frames: F13.recs.map((r) => ({
        say: r.p === 1 ? 2 : 2,
        note:
          r.p === 1
            ? `p = 1: ${r.high}·1 + 1 = ${r.add} (the 1s in 1 and 11).`
            : `p = 10: 0 + (${r.low} + 1) = ${r.add} (10, 11, 12, 13). Total ${F13.count}.`,
        panels: [placeArr(13, r.p), fVars(r)],
      })),
    },
    {
      kind: "turn",
      title: "Your turn: n = 21",
      lines: [
        "p = 1: high = 2, cur = 1, low = 0.",
        "p = 10: high = 0, cur = 2, low = 1.",
      ],
      panels: [placeArr(21, 1), placeArr(21, 10)],
      task: {
        type: "number",
        question: "How many 1s are written from 0 to 21?",
        options: [12, F21.count, 11, 14],
        answer: F21.count,
        hint: "p = 1: 2·1 + (0 + 1). p = 10: 0 + 10 (cur > 1).",
      },
      solved: `p = 1 → ${F21.recs[0].add} (1, 11, 21); p = 10 → ${F21.recs[1].add} (10–19). Total ${F21.count}.`,
    },
  ],

  "template-digit": [
    {
      kind: "watch",
      title: "countDigitOne(23) with go(pos, tight, ones)",
      lines: [
        "`pos === L` → return ones.",
        "`limit = tight ? digits[pos] : 9`.",
        "Child stays tight only if `d === limit`.",
        "Only free (`!tight`) calls are stored.",
      ],
      frames: [
        {
          say: 1,
          note: "go(0, true, 0): tight, so d runs 0..2.",
          panels: [
            digitArr(23, 0, "digits"),
            vars({ pos: 0, tight: "T", limit: 2 }),
          ],
        },
        {
          say: 2,
          note: "d = 0 → go(1, false, 0): 0 < 2, so free.",
          panels: [
            digitArr(23, 1, "digits"),
            vars({ pos: 1, tight: "F", ones: 0, limit: 9 }),
          ],
        },
        {
          say: 0,
          note: `At pos 2 = L each ending returns ones: 0, 1, 0 … 0 → ${dcall(1, false, 0).total}.`,
          panels: [
            vars({ call: "go(1,F,0)", total: dcall(1, false, 0).total }),
          ],
        },
        {
          say: 3,
          note: `Free, so stored: memo "1,0" = ${dcall(1, false, 0).total}.`,
          panels: [
            vars({ call: "go(1,F,0)", total: dcall(1, false, 0).total }),
            vars({ "memo 1,0": dcall(1, false, 0).total }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: go(1, false, 1)",
      lines: [
        "d = 1 at pos 0 → go(1, false, 1).",
        "Free: d runs 0..9, each ending adds `d === 1`.",
      ],
      panels: [
        digitArr(23, 1, "digits"),
        vars({ pos: 1, tight: "F", ones: 1, limit: 9 }),
      ],
      task: {
        type: "number",
        question: "go(1, false, 1) = ?",
        options: [10, dcall(1, false, 1).total, 1, 2],
        answer: dcall(1, false, 1).total,
        hint: "Ten endings each return at least 1; one of them (d = 1) returns 2.",
      },
      solved: `10 · 1 + 1 = ${dcall(1, false, 1).total}: the 1s in 10 … 19. Stored as "1,1".`,
      then: [
        {
          note: "d = 2 = limit → go(1, true, 0): limit 3, d runs 0..3.",
          panels: [
            digitArr(23, 1, "digits"),
            vars({ pos: 1, tight: "T", ones: 0, limit: 3 }),
          ],
        },
        {
          note: `Endings 20, 21, 22, 23 → ${dcall(1, true, 0).total}. Tight, so not stored.`,
          panels: [vars({ call: "go(1,T,0)", total: dcall(1, true, 0).total })],
        },
        {
          note: `go(0, true, 0) = 1 + 11 + 1 = ${D23.total}.`,
          panels: [vars({ "d=0": 1, "d=1": 11, "d=2": 1, total: D23.total })],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: memo size",
      lines: ["Three calls ran at pos 1.", "Only `!tight` results are stored."],
      panels: [vars({ "go(1,F,0)": 1, "go(1,F,1)": 11, "go(1,T,0)": 1 })],
      task: {
        type: "number",
        question: "How many entries does memo hold at the end?",
        options: [1, D23.memo.size, 3, 4],
        answer: D23.memo.size,
        hint: "go(0, true, 0) and go(1, true, 0) are tight.",
      },
      solved: `Keys "1,0" and "1,1": ${D23.memo.size} entries.`,
    },
  ],

  "implementation-digit": [
    {
      kind: "watch",
      title: "countDigitOne(213), place by place",
      lines: [
        "`high = floor(n / (p·10))`, `cur = floor(n / p) % 10`, `low = n % p`.",
        "`count += high · p`.",
        "cur > 1 → +p; cur === 1 → +low + 1.",
      ],
      frames: [
        {
          say: 0,
          note: `p = 1: high ${F213.recs[0].high}, cur ${F213.recs[0].cur}, low ${F213.recs[0].low}.`,
          panels: [placeArr(213, 1), fVars(F213.recs[0])],
        },
        {
          say: 2,
          note: `21 · 1 + 1 (cur 3 > 1) = ${F213.recs[0].add}. count = ${F213.recs[0].count}.`,
          panels: [placeArr(213, 1), vars({ count: F213.recs[0].count })],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: p = 10",
      lines: ["n = 213, p = 10: high = 2, cur = 1, low = 3."],
      panels: [placeArr(213, 10), vars({ count: F213.recs[0].count })],
      task: {
        type: "number",
        question: "How much does p = 10 add?",
        options: [20, F213.recs[1].add, 30, 23],
        answer: F213.recs[1].add,
        hint: "high · p = 20, and cur = 1 adds low + 1.",
      },
      solved: `2 · 10 + (3 + 1) = ${F213.recs[1].add}. count = ${F213.recs[1].count}.`,
      then: [
        {
          note: `p = 100: high 0, cur 2 > 1 → +100. count = ${F213.count}. p = 1000 > n, stop.`,
          panels: [
            placeArr(213, 100),
            fVars(F213.recs[2]),
            vars({ count: F213.count }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: floor, not | 0",
      lines: [
        "n = 3,000,000,000 and p = 1.",
        "`|0` and `>>` work on 32-bit integers.",
      ],
      panels: [vars({ n: "3·10^9", p: 1 })],
      task: {
        type: "choose",
        question: "What does `(n / p) | 0` give?",
        options: [
          { text: "A wrong, negative number", why: "" },
          {
            text: "3000000000",
            why: "3·10^9 does not fit in 32 bits; `| 0` wraps it.",
          },
          {
            text: "The same as Math.floor",
            why: "Only for values that fit in 32 bits.",
          },
        ],
        answer: 0,
      },
      solved: `(3e9) | 0 = ${(BIG / 1) | 0}. Math.floor keeps ${Math.floor(BIG / 1)}.`,
    },
  ],

  mistakes: [
    {
      kind: "watch",
      title: 'Tree DP: "rob the root if it is large"',
      lines: [
        "Greedy: the root 4 is the biggest house, rob it.",
        "DP: compare the root's [rob, skip].",
      ],
      frames: [
        {
          say: 0,
          note: "Rob 4 → both children are off limits: 4.",
          panels: [draw(GR, { st: { 0: "active", 1: "muted", 2: "muted" } })],
        },
        ...GRR.recs.map((r, k) => ({
          say: 1,
          note:
            k < 2
              ? `Leaf ${GR[r.id].val} → [${pairStr(r.pair)}].`
              : `Root: rob = 4 + 0 + 0 = ${r.pair[0]}, skip = 3 + 3 = ${r.pair[1]}.`,
          panels: [
            treeFrame(GR, GRR.recs, k, (x) => pairStr(x.pair)),
            ...(k === 2
              ? [vars({ root: `[${pairStr(r.pair)}]`, best: GRR.best })]
              : []),
          ],
        })),
      ],
    },
    {
      kind: "turn",
      title: "Your turn: is it still tight?",
      lines: ["n = 235. We chose 1, then 3."],
      panels: [
        arr([1, 3, "?"], {
          label: "x",
          showIndices: false,
          highlights: { 0: "done", 1: "done" },
        }),
        digitArr(235, -1, "n"),
      ],
      task: {
        type: "choose",
        question: "What range does the third digit get?",
        options: [
          { text: "0–9: 1 < 2 already freed us", why: "" },
          {
            text: "0–5: the 3 matched n's second digit",
            why: "tight stays true only while every digit equals its limit. After 1, the limit was 9, not 3.",
          },
          {
            text: "0–3",
            why: "No cap of 3 applies: we stopped being tight at the first digit.",
          },
        ],
        answer: 0,
      },
      solved: "tight && d === limit: once false, it stays false.",
    },
    {
      kind: "turn",
      title: "Your turn: sort() on cuts",
      lines: ["cuts = [10, 9, 2].", "`cuts.sort()` with no comparator."],
      panels: [arr([10, 9, 2], { label: "cuts" })],
      task: {
        type: "choose",
        question: "What order comes out?",
        options: [
          { text: `[${SORTED_BAD.join(", ")}]`, why: "" },
          {
            text: "[2, 9, 10]",
            why: "That needs `(a, b) => a − b`. Without it, numbers compare as strings.",
          },
          {
            text: "[10, 9, 2]",
            why: 'sort() does reorder: as strings, "10" < "2" < "9".',
          },
        ],
        answer: 0,
      },
      solved:
        "Lexicographic! Always pass `(x, y) => x − y` for cuts and envelopes.",
      then: [
        {
          note: `sort() → [${SORTED_BAD.join(", ")}]; sort((x, y) => x − y) → [2, 9, 10].`,
          panels: [
            arr(SORTED_BAD, {
              label: "sort()",
              highlights: { 0: "bad", 1: "bad", 2: "bad" },
            }),
            arr([2, 9, 10], {
              label: "numeric",
              highlights: { 0: "done", 1: "done", 2: "done" },
            }),
          ],
        },
      ],
    },
    {
      kind: "turn",
      title: "Your turn: what is tails?",
      lines: [
        "LIS on [3, 4, 1]: `tails[lowerBound(tails, x)] = x`.",
        `tails ends as [${LIS[2].join(", ")}].`,
      ],
      panels: [
        arr([3, 4, 1], { label: "nums" }),
        arr(LIS[2], { label: "tails", highlights: { 0: "active" } }),
      ],
      task: {
        type: "choose",
        question: "What does [1, 4] tell you?",
        options: [
          { text: "The LIS length is 2", why: "" },
          {
            text: "1, 4 is an increasing subsequence",
            why: "In nums the 1 comes after the 4. tails is not a subsequence.",
          },
          {
            text: "The LIS length is 1",
            why: "tails has 2 entries, so length 2 (3, 4) exists.",
          },
        ],
        answer: 0,
      },
      solved: "Only the length is real; the real LIS here is 3, 4.",
    },
  ],

  "interview-tips": [
    {
      kind: "turn",
      title: "Your turn: name the family",
      lines: [
        "Name the family first, then the state.",
        "Problem: n ≤ 16, assign each worker a job.",
      ],
      panels: [vars({ n: "≤ 16", task: "assign" })],
      task: {
        type: "choose",
        question: "Which family do you name?",
        options: [
          { text: "Bitmask DP: 2^n states fit because n ≤ 16", why: "" },
          {
            text: "Interval DP",
            why: "No range is burst, cut or merged here.",
          },
          { text: "Digit DP", why: "Nothing is counted over numbers ≤ N." },
          { text: "Tree DP", why: "There is no tree." },
        ],
        answer: 0,
      },
      solved: 'Say it out loud: "n ≤ 16, so 2^n subsets — bitmask DP".',
    },
    {
      kind: "turn",
      title: "Your turn: the order of talking",
      lines: [
        "Family first.",
        "State in one sentence before code.",
        "Space optimisation once the basic DP works.",
      ],
      panels: [vars({ family: "?", state: "?", code: "?", space: "?" })],
      task: {
        type: "order",
        question: "Tap the steps in interview order.",
        items: [
          "Name the family",
          "Say the state",
          "Write the code",
          "Mention space savings",
        ],
        hint: "State before code; optimise after it works.",
      },
      solved:
        'e.g. "Interval DP. dp[i][j] = best for (i, j). … then rolling rows if asked."',
    },
  ],
};
