// Pattern animations for DP: linear look-back (house robber), position + extra state in a Map (frog jump),
// unbounded knapsack counting combinations (coin change II), palindromic interval table (longest
// palindromic subsequence) and tree DP returning [rob, skip] per node (house robber III).

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const attach = (frames, p) => {
  if (p && frames.length > 1) frames[frames.length - 1].predict = p;
};
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cleanInts = (xs, max, lo, hi) =>
  (Array.isArray(xs) ? xs : [])
    .map(Number)
    .filter(Number.isFinite)
    .slice(0, max)
    .map((v) => clamp(Math.round(v), lo, hi));

/* ------------------------------------------------------------------ 1D linear: house robber */
export const dpLinearRobber = {
  problem: { name: 'House Robber', statement: 'Rob houses along a street for the most money without robbing two neighbours.', example: '[2, 7, 9, 3, 1, 5] → 16 (2 + 9 + 5)', exampleOutput: 16, questionId: 'house-robber' },
  title: '1D DP: house robber (look back two cells)',
  description:
    'dp[i] = best loot from the first i houses = max(dp[i−1] skip house i, dp[i−2] + money take it). Only the last two cells are ever read, so two variables are enough. (≤ 7 houses, money 0–99.)',
  defaultInput: { nums: [2, 7, 9, 3, 1, 5] },
  fields: [{ key: 'nums', type: 'numbers', label: 'money per house (≤ 7)' }],
  testInputs: [{ nums: [] }, { nums: [4] }, { nums: [5, 5, 5, 5] }, { nums: [0, 0, 0] }, { nums: [2, 1, 1, 2] }, { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
  generate(input) {
    const nums = cleanInts(input.nums, 7, 0, 99);
    const n = nums.length;
    const dp = [0];
    const frames = [];
    const show = (i, hl = {}, ptrs = []) => [
      arr(nums, { label: 'nums (money in each house)', showIndices: true, highlights: i != null && i >= 1 ? { [i - 1]: 'active' } : {} }),
      arr([...dp, ...new Array(n + 1 - dp.length).fill('')], { label: 'dp[i] = best from the first i houses', showIndices: true, highlights: hl, pointers: ptrs }),
    ];
    frames.push({
      note: `dp[0] = 0: with no houses there is nothing to rob. We fill dp left to right; each cell looks back at most two cells.${n === 0 ? ' There are no houses at all.' : ''}`,
      panels: [...show(null, { 0: 'done' }), vars({ prev2: 0, prev1: 0 })],
    });
    let asks = 0;
    for (let i = 1; i <= n; i++) {
      const x = nums[i - 1];
      const prev1 = dp[i - 1];
      const prev2 = i >= 2 ? dp[i - 2] : 0;
      const take = prev2 + x;
      const cur = Math.max(prev1, take);
      dp.push(cur);
      const hl = { [i]: 'active', [i - 1]: 'visited' };
      if (i >= 2) hl[i - 2] = 'visited';
      const ptrs = [{ index: i - 1, label: 'prev1', color: 'a' }];
      if (i >= 2) ptrs.push({ index: i - 2, label: 'prev2', color: 'b' });
      const why =
        take > prev1
          ? `Taking wins: house ${i - 1} plus the best that ends two houses back beats keeping dp[${i - 1}].`
          : take === prev1
            ? 'Both choices tie, so either is fine.'
            : `Skipping wins: dp[${i - 1}] is already more than ${prev2} + ${x}.`;
      frames.push({
        note: `House ${i - 1} ($${x}): skip → dp[${i - 1}] = ${prev1}; take → ${i >= 2 ? `dp[${i - 2}]` : "nothing before"} + ${x} = ${take} (the neighbour must be skipped). dp[${i}] = ${cur}. ${why}`,
        panels: [...show(i, hl, ptrs), vars({ x, prev2, prev1, skip: prev1, take, cur })],
      });
      if (i >= 2 && asks < 4) {
        if (asks % 2 === 0 && take !== prev1) {
          const opts = ['Take house ' + (i - 1), 'Skip house ' + (i - 1)];
          attach(frames, pick(`House ${i - 1} has $${x}. dp[${i - 1}] = ${prev1}, dp[${i - 2}] = ${prev2}. Take it or skip it?`, opts[take > prev1 ? 0 : 1], [opts[take > prev1 ? 1 : 0]], asks + i, 'Compare dp[i−1] (skip) with dp[i−2] + money (take).'));
          asks++;
        } else if (asks % 2 === 1) {
          attach(frames, pick(`dp[${i}] = max(dp[${i - 1}], dp[${i - 2}] + ${x}) = max(${prev1}, ${prev2} + ${x}). What is dp[${i}]?`, cur, [prev1 + x, Math.min(prev1, take), prev2, cur + x], asks + 1));
          asks++;
        }
      }
    }
    if (n > 0)
      frames.push({
        note: `Each step only read dp[i−1] and dp[i−2], so the template keeps just prev2 and prev1 and slides them right: memory drops from O(n) to O(1).`,
        panels: [...show(null, Object.fromEntries(dp.map((_, k) => [k, k >= n - 1 ? 'visited' : 'muted']))), vars({ prev2: n >= 2 ? dp[n - 1] : 0, prev1: dp[n] })],
      });
    frames.push({
      note: `Answer dp[${n}] = ${dp[n]} — the most money without robbing two neighbours. O(n) time, O(1) extra space with the two variables.`,
      panels: [...show(null, { [n]: 'done' }), vars({ answer: dp[n] })],
      result: dp[n],
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ 1D + extra state: frog jump */
export const dpFrogJumpMap = {
  problem: { name: 'Frog Jump', statement: 'After a jump of k units the frog may jump k − 1, k or k + 1. Starting with a 1-unit jump, can it reach the last stone?', example: 'stones [0, 1, 3, 5, 6, 8, 12, 17] → true', exampleOutput: true, questionId: 'frog-jump' },
  title: '1D DP + state map: frog jump',
  description:
    'reach[stone] = the set of jump sizes k the frog can arrive with. From a stone reached with k, try k − 1, k, k + 1 (only > 0) and record the size on the stone it lands on. (≤ 8 stones, 0–99; sorted and de-duplicated.)',
  defaultInput: { stones: [0, 1, 3, 5, 6, 8, 12, 17] },
  fields: [{ key: 'stones', type: 'numbers', label: 'stone positions (≤ 8)' }],
  testInputs: [{ stones: [] }, { stones: [0] }, { stones: [0, 1, 2, 3, 4, 5] }, { stones: [0, 1, 3, 6, 10, 15, 21, 28] }, { stones: [0, 1, 2, 3, 4, 8, 9, 11] }, { stones: [0, 2] }, { stones: [3, 3, 3] }],
  generate(input) {
    const stones = [...new Set(cleanInts(input.stones, 8, 0, 99))].sort((a, b) => a - b);
    const frames = [];
    if (!stones.length)
      return [
        { note: 'There are no stones, so there is nowhere to stand.', panels: [vars({ stones: 0 })] },
        { note: 'With no stones there is no last stone to reach: answer false.', panels: [vars({ answer: false })] },
      ];
    const reach = new Map(stones.map((s) => [s, new Set()]));
    reach.get(stones[0]).add(0);
    const setStr = (s) => (reach.get(s).size ? [...reach.get(s)].join(',') : '—');
    const panels = (hl, label = 'reach[s] = arriving jump sizes', extra = {}) => [
      arr(stones, { label: 'stones (positions)', highlights: hl }),
      arr(stones.map(setStr), { label, highlights: hl }),
      vars(extra),
    ];
    frames.push({
      note: `Start on stone ${stones[0]} with "last jump 0", so the first jump can only be 0 + 1 = 1. Every stone gets a Set of jump sizes; only states that really occur are stored.`,
      panels: panels({ 0: 'active' }, undefined, { stone: stones[0], k: 0 }),
    });
    let asks = 0;
    let sk = 0;
    for (let si = 0; si < stones.length; si++) {
      const s = stones[si];
      if (!reach.get(s).size) {
        frames.push({ note: `Stone ${s} has an empty set: no jump lands here, so nothing can start from it.`, panels: panels({ [si]: 'muted' }, undefined, { stone: s }) });
        continue;
      }
      for (const k of reach.get(s)) {
        const tries = [];
        const landed = [];
        const hl = { [si]: 'active' };
        for (const step of [k - 1, k, k + 1]) {
          if (step <= 0) {
            tries.push(`${step} (not > 0)`);
            continue;
          }
          const t = s + step;
          if (reach.has(t)) {
            reach.get(t).add(step);
            landed.push(t);
            hl[stones.indexOf(t)] = 'visited';
            tries.push(`${step} → stone ${t} ✓`);
          } else tries.push(`${step} → ${t} (water)`);
        }
        frames.push({
          note: `On stone ${s}, arrived with k = ${k}: try ${tries.join(', ')}.${landed.length ? ` Add the step size to each landing stone's set.` : ' No landing — this state dies here.'}`,
          panels: panels(hl, undefined, { stone: s, k, steps: `${k - 1}, ${k}, ${k + 1}` }),
        });
        sk++;
        if (si > 0 && asks < 4 && sk % 2 === 0) {
          const cands = [k - 1, k, k + 1].filter((st) => st > 0).map((st) => s + st);
          const right = landed.length ? landed.join(', ') : 'none';
          const wrong = [cands.join(', '), 'none', String(s + k), cands.filter((t) => !landed.includes(t)).join(', ') || String(s + k + 2)];
          attach(frames, pick(`Frog on stone ${s}, last jump k = ${k}. Which stones can the next jump (${k - 1}, ${k} or ${k + 1}) land on?`, right, wrong, asks + 1, 'Only positive steps count, and only positions that hold a stone.'));
          asks++;
        }
      }
    }
    const last = stones[stones.length - 1];
    const ok = reach.get(last).size > 0;
    const finalHl = Object.fromEntries(stones.map((s, i) => [i, reach.get(s).size ? 'visited' : 'muted']));
    finalHl[stones.length - 1] = ok ? 'done' : 'bad';
    frames.push({
      note: `${ok ? `The last stone ${last} has a non-empty set {${setStr(last)}}, so the frog can cross: true.` : `The last stone ${last} has an empty set — no jump sequence reaches it: false.`} Work = the reachable (stone, k) states × 3 tries, at most O(n²).`,
      panels: panels(finalHl, undefined, { answer: ok }),
      result: ok,
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ unbounded knapsack: coin change II */
export const dpUnboundedCoinWays = {
  problem: { name: 'Coin Change II', statement: 'Count the combinations of coins (each reusable) that make up the amount.', example: 'coins = [1, 2, 5], amount = 5 → 4', exampleOutput: 4, questionId: 'coin-change-ii' },
  title: 'Unbounded knapsack: coin change II (count combinations)',
  description:
    'dp[a] = number of coin combinations that make a. Coins in the OUTER loop, amounts FORWARDS in the inner loop: dp[a] += dp[a − coin] reads a cell this coin has already updated, so the coin can be reused. Row r = dp after coin r. (≤ 5 distinct coins 1–9, amount 0–6.)',
  defaultInput: { coins: [1, 2, 5], amount: 5 },
  fields: [
    { key: 'coins', type: 'numbers', label: 'coins (≤ 5)' },
    { key: 'amount', type: 'number', label: 'amount (0–6)' },
  ],
  testInputs: [{ coins: [], amount: 3 }, { coins: [2], amount: 3 }, { coins: [1], amount: 0 }, { coins: [3, 3, 3], amount: 6 }, { coins: [7], amount: 6 }, { coins: [1, 2, 3, 4, 5, 6, 7], amount: 6 }],
  generate(input) {
    const coins = [...new Set(cleanInts(input.coins, 5, 1, 9))];
    const amount = clamp(Math.round(Number(input.amount) || 0), 0, 6);
    const dp = new Array(amount + 1).fill(0);
    dp[0] = 1;
    const rows = [[...dp]];
    const rowLabels = ['start', ...coins.map((c) => `coin ${c}`)];
    const colLabels = Array.from({ length: amount + 1 }, (_, a) => String(a));
    const frames = [];
    const cells = () => rowLabels.map((_, r) => (r < rows.length ? [...rows[r]] : new Array(amount + 1).fill('')));
    const states = (fn) => rowLabels.map((_, r) => colLabels.map((_, a) => (r < rows.length ? fn(r, a) : '')));
    const base = (r) => (r < rows.length - 1 ? 'muted' : '');
    frames.push({
      note: `dp[0] = 1: there is exactly one way to make 0 — choose nothing. Every other amount starts at 0 ways.${coins.length ? '' : ' There are no coins.'}`,
      panels: [table(cells(), states((r, a) => (a === 0 ? 'done' : '')), rowLabels, colLabels, 'ways to make each amount'), vars({ amount })],
    });
    let asks = 0;
    let cellNo = 0;
    for (const coin of coins) {
      rows.push([...dp]);
      const r = rows.length - 1;
      frames.push({
        note: `Coin ${coin}: start from the counts so far (copied from the row above). Amounts below ${coin} cannot use it, so they stay as they are.${coin > amount ? ` ${coin} > ${amount}, so this coin changes nothing.` : ''}`,
        panels: [table(cells(), states((rr, a) => (rr === r ? (a < coin ? 'muted' : 'visited') : base(rr))), rowLabels, colLabels, 'ways to make each amount'), vars({ coin })],
      });
      for (let a = coin; a <= amount; a++) {
        const old = dp[a];
        const add = dp[a - coin];
        dp[a] += add;
        rows[r][a] = dp[a];
        cellNo++;
        const reuse = a - coin >= coin;
        frames.push({
          note: `dp[${a}] += dp[${a} − ${coin}]: ${old} way${old === 1 ? "" : "s"} without coin ${coin} (row above) + ${add} way${add === 1 ? "" : "s"} that end with a ${coin} (dp[${a - coin}] in THIS row) = ${dp[a]}.${reuse ? ` dp[${a - coin}] already counts coin ${coin}, so ${coin} is used again — that is the reuse.` : ''}`,
          panels: [
            table(
              cells(),
              states((rr, x) => (rr === r && x === a ? 'active' : rr === r && x === a - coin ? 'done' : rr === r - 1 && x === a ? 'visited' : rr === r && x > a ? '' : base(rr))),
              rowLabels,
              colLabels,
              'ways to make each amount',
            ),
            vars({ coin, a, 'dp[a] before': old, 'dp[a − coin]': add, 'dp[a]': dp[a] }),
          ],
        });
        if (asks < 4 && r >= 2) {
          if (asks === 1 && reuse) {
            const opts = [`This row: dp[${a - coin}] already includes coin ${coin}`, `Row above: dp[${a - coin}] without coin ${coin}`, `Always dp[0]`];
            attach(frames, ask(`Inner loop goes forwards. When we add dp[${a} − ${coin}], which value of dp[${a - coin}] do we read?`, [opts[1], opts[0], opts[2]], 1, 'Forward order means dp[a − coin] was already updated for this coin, so the coin may be taken again.'));
            asks++;
          } else if (asks !== 1 && cellNo % 2 === 0) {
            attach(frames, pick(`Coin ${coin}, amount ${a}: dp[${a}] was ${old}, dp[${a - coin}] = ${add}. What is dp[${a}] now?`, dp[a], [old, add, dp[a] + 1, old * 2 || 2], asks + 2));
            asks++;
          }
        }
      }
    }
    frames.push({
      note: `Answer dp[${amount}] = ${dp[amount]} combination${dp[amount] === 1 ? '' : 's'}. Coins outer fixes an order on the coins, so each multiset is counted once (amount outer would count permutations). O(coins × amount) time, O(amount) space.`,
      panels: [table(cells(), states((r, a) => (r === rows.length - 1 && a === amount ? 'done' : base(r))), rowLabels, colLabels, 'ways to make each amount'), vars({ answer: dp[amount] })],
      result: dp[amount],
    });
    return frames;
  },
};

/* ------------------------------------------------------------------ palindromic DP: longest palindromic subsequence */
export const dpPalindromeSubseq = {
  problem: { name: 'Longest Palindromic Subsequence', statement: 'Return the length of the longest subsequence that reads the same forwards and backwards.', example: 's = "agbdba" → 5 ("abdba")', exampleOutput: 5, questionId: 'longest-palindromic-subsequence' },
  title: 'Palindromic DP: longest palindromic subsequence',
  description:
    'dp[i][j] = longest palindromic subsequence of s[i..j]. Equal ends wrap the inside: dp[i+1][j−1] + 2; otherwise drop one end: max(dp[i+1][j], dp[i][j−1]). i goes DOWN so row i+1 is ready. (≤ 7 characters.)',
  defaultInput: { s: 'agbdba' },
  fields: [{ key: 's', type: 'string', label: 's (≤ 7 chars)' }],
  testInputs: [{ s: '' }, { s: 'x' }, { s: 'aaaa' }, { s: 'abcde' }, { s: 'bbbab' }, { s: 'racecarxyz' }],
  generate(input) {
    const s = [...String(input.s ?? '')].slice(0, 7);
    const n = s.length;
    const frames = [];
    if (!n)
      return [
        { note: 'The string is empty — there is no table to fill.', panels: [vars({ n: 0 })] },
        { note: 'The template returns 0 for n = 0: the empty string has no characters.', panels: [vars({ answer: 0 })] },
      ];
    const dp = Array.from({ length: n }, () => new Array(n).fill(0));
    const shown = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? '·' : '')));
    const labels = s.map((c, i) => `${i} ${c}`);
    const st = (fn) => shown.map((row, i) => row.map((v, j) => (j < i ? 'muted' : fn(i, j) || (v === '' ? '' : 'visited'))));
    const snap = (note, fn, v) => frames.push({ note, panels: [table(shown.map((r) => [...r]), st(fn), labels, labels, 'dp[i][j] (row i, column j)'), vars(v)] });
    snap(`The table holds one cell per substring s[i..j] (j ≥ i). Cells below the diagonal (j < i) are empty substrings and count 0.`, () => '', { n });
    let asks = 0;
    let cellNo = 0;
    const kinds = ['Ends match: inside + 2', 'Ends differ: max(drop left, drop right)'];
    for (let i = n - 1; i >= 0; i--) {
      dp[i][i] = 1;
      shown[i][i] = 1;
      snap(`Row i = ${i}: dp[${i}][${i}] = 1 — a single '${s[i]}' is a palindrome. Row ${i + 1} below is already complete, so this row can read it.`, (a, b) => (a === i && b === i ? 'active' : ''), { i });
      for (let j = i + 1; j < n; j++) {
        const match = s[i] === s[j];
        let note;
        let fn;
        if (match) {
          dp[i][j] = dp[i + 1][j - 1] + 2;
          const inside = j - 1 >= i + 1 ? `dp[${i + 1}][${j - 1}] = ${dp[i + 1][j - 1]}` : 'the empty middle = 0';
          note = `s[${i}] = s[${j}] = '${s[i]}': both ends join the palindrome inside, ${inside} → ${dp[i][j]}.`;
          fn = (a, b) => (a === i && b === j ? 'active' : a === i + 1 && b === j - 1 && b >= a ? 'done' : '');
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
          note = `'${s[i]}' ≠ '${s[j]}': they cannot both be used. Drop the left end → dp[${i + 1}][${j}] = ${dp[i + 1][j]}, drop the right end → dp[${i}][${j - 1}] = ${dp[i][j - 1]} → ${dp[i][j]}.`;
          fn = (a, b) => (a === i && b === j ? 'active' : (a === i + 1 && b === j) || (a === i && b === j - 1) ? 'done' : '');
        }
        shown[i][j] = dp[i][j];
        snap(note, fn, { i, j, 's[i]': s[i], 's[j]': s[j], 'dp[i][j]': dp[i][j] });
        cellNo++;
        if (asks < 5 && cellNo % 3 === 0) {
          if (asks % 2 === 0) attach(frames, pick(`Cell dp[${i}][${j}]: s[${i}] = '${s[i]}', s[${j}] = '${s[j]}'. Which rule fills it?`, kinds[match ? 0 : 1], [kinds[match ? 1 : 0]], asks / 2 + cellNo));
          else
            attach(
              frames,
              pick(
                `What is dp[${i}][${j}] for s[${i}..${j}] = "${s.slice(i, j + 1).join('')}"?`,
                dp[i][j],
                [dp[i][j] + 1, Math.max(1, dp[i][j] - 1), dp[i][j] + 2, j - i + 1],
                asks,
              ),
            );
          asks++;
        }
      }
    }
    snap(`Answer dp[0][${n - 1}] = ${dp[0][n - 1]}: the longest palindromic subsequence of "${s.join('')}". n² / 2 cells, O(1) each → O(n²) time and space.`, (a, b) => (a === 0 && b === n - 1 ? 'done' : ''), { answer: dp[0][n - 1] });
    frames.at(-1).result = dp[0][n - 1];
    return frames;
  },
};

/* ------------------------------------------------------------------ tree DP: house robber III */
const toVal = (v) => {
  if (v == null || v === '' || typeof v === 'boolean') return null;
  const n = Number(v);
  return Number.isFinite(n) ? clamp(Math.round(n), 0, 99) : null;
};
// Level-order array → nodes [{id, val, left, right, x, y}], at most maxNodes nodes / maxDepth + 1 levels.
function buildTree(raw, maxNodes = 9, maxDepth = 3) {
  const a = (Array.isArray(raw) ? raw : []).map(toVal);
  if (!a.length || a[0] == null) return { nodes: [], trimmed: false };
  const nodes = [{ id: 0, val: a[0], left: null, right: null, depth: 0 }];
  const q = [0];
  let h = 0;
  let i = 1;
  while (h < q.length && i < a.length) {
    const p = nodes[q[h++]];
    for (const side of ['left', 'right']) {
      if (i < a.length && a[i] != null && p.depth < maxDepth && nodes.length < maxNodes) {
        const c = { id: nodes.length, val: a[i], left: null, right: null, depth: p.depth + 1 };
        nodes.push(c);
        p[side] = c.id;
        q.push(c.id);
      }
      i++;
    }
  }
  let x = 0;
  const walk = (id) => {
    if (id == null) return;
    walk(nodes[id].left);
    nodes[id].x = x++;
    nodes[id].y = nodes[id].depth;
    walk(nodes[id].right);
  };
  walk(0);
  return { nodes, trimmed: a.filter((v) => v != null).length > nodes.length };
}

export const dpTreeRobber = {
  problem: { name: 'House Robber III', statement: 'Houses form a binary tree; robbing a node and its direct child is not allowed. Maximise the loot.', example: '[3, 4, 5, 1, 3, null, 1] → 9 (4 + 5)', exampleOutput: 9, questionId: 'house-robber-iii' },
  title: 'Tree DP: house robber III ([rob, skip] per node)',
  description:
    'Post-order: each node returns [rob, skip]. rob = val + left.skip + right.skip (children must be skipped); skip = max(left) + max(right) (children free). A finished node is labelled rob|skip. (≤ 9 nodes, 4 levels, values 0–99.)',
  defaultInput: { tree: [3, 4, 5, 1, 3, null, 1] },
  fields: [{ key: 'tree', type: 'json', label: 'tree (level order)' }],
  testInputs: [{ tree: [] }, { tree: [7] }, { tree: [2, 2, 2, 2, 2, 2, 2] }, { tree: [3, 2, 3, null, 3, null, 1] }, { tree: [1, 9, null, 1, null, 9] }, { tree: [5, 1, 1, 9, 9, 9, 9, 1, 1, 1, 1, 1] }, { tree: [null, 1] }],
  generate(input) {
    const T = buildTree(input.tree);
    const { nodes } = T;
    if (!nodes.length)
      return [
        { note: 'The tree is empty (root = null). dfs(null) returns [0, 0].', panels: [vars({ root: 'null' })] },
        { note: 'max(0, 0) = 0: an empty street has no money.', panels: [vars({ answer: 0 })] },
      ];
    const frames = [];
    const res = {};
    const states = {};
    const labels = {};
    const path = [];
    const panel = (label) => ({
      kind: 'nodes',
      nodes: nodes.map((n) => ({ id: n.id, label: labels[n.id] ?? String(n.val), x: n.x, y: n.y, state: states[n.id] || '' })),
      edges: nodes.flatMap((n) => [n.left, n.right].filter((c) => c != null).map((c) => ({ from: n.id, to: c, state: res[c] ? 'done' : '' }))),
      directed: true,
      label,
    });
    const snap = (note, v = {}) => frames.push({ note, panels: [panel('rob|skip once a node is finished'), stack(path.map((id) => `dfs(${nodes[id].val})`), 'call stack'), vars(v)] });
    snap(`Greedy "rob the biggest" can fail, so each node reports two answers for its subtree: [rob it, skip it]. Children are finished first (post-order).${T.trimmed ? ' (Input trimmed to 9 nodes / 4 levels.)' : ''}`);
    let asks = 0;
    let done = 0;
    const get = (id) => (id == null ? [0, 0] : res[id]);
    const dfs = (id) => {
      const nd = nodes[id];
      path.push(id);
      states[id] = 'active';
      const leaf = nd.left == null && nd.right == null;
      if (!leaf) snap(`dfs(${nd.val}): before deciding, ask both children for their [rob, skip] pairs.`, { node: nd.val });
      if (nd.left != null) {
        states[id] = 'visited';
        dfs(nd.left);
      }
      if (nd.right != null) {
        states[id] = 'visited';
        dfs(nd.right);
      }
      const [lr, ls] = get(nd.left);
      const [rr, rs] = get(nd.right);
      const robIt = nd.val + ls + rs;
      const skipIt = Math.max(lr, ls) + Math.max(rr, rs);
      res[id] = [robIt, skipIt];
      labels[id] = `${robIt}|${skipIt}`;
      states[id] = 'active';
      if (nd.left != null) states[nd.left] = 'done';
      if (nd.right != null) states[nd.right] = 'done';
      snap(
        leaf
          ? `Leaf ${nd.val}: both children are null → [0, 0]. rob = ${nd.val}, skip = 0 → ${robIt}|${skipIt}.`
          : `Node ${nd.val}: rob = ${nd.val} + left.skip ${ls} + right.skip ${rs} = ${robIt}; skip = max(${lr}, ${ls}) + max(${rr}, ${rs}) = ${skipIt} → ${robIt}|${skipIt}.`,
        { val: nd.val, lr, ls, rr, rs, rob: robIt, skip: skipIt },
      );
      done++;
      if (!leaf && asks < 3) {
        if (asks === 1) attach(frames, pick(`Node ${nd.val}: left = [${lr}, ${ls}], right = [${rr}, ${rs}]. What is skip = max(left) + max(right)?`, skipIt, [ls + rs, lr + rr, skipIt + nd.val, robIt], 2));
        else attach(frames, pick(`Node ${nd.val}: left = [${lr}, ${ls}], right = [${rr}, ${rs}]. What is rob = val + left.skip + right.skip?`, robIt, [nd.val + lr + rr, nd.val + Math.max(lr, ls) + Math.max(rr, rs), robIt - nd.val], asks + 2));
        asks++;
      } else if (leaf && asks < 3 && done === 1) {
        attach(frames, pick(`Leaf ${nd.val} has two null children (each returns [0, 0]). What pair does it return?`, `${robIt}|${skipIt}`, [`0|${nd.val}`, `${nd.val}|${nd.val}`, '0|0'], 0));
        asks++;
      }
      path.pop();
      if (id === 0) states[id] = 'done';
    };
    dfs(0);
    const [r0, s0] = res[0];
    const ans = Math.max(r0, s0);
    states[0] = 'done';
    frames.push({
      note: `The root returns [${r0}, ${s0}]; the answer is max = ${ans} (${r0 >= s0 ? 'rob the root' : 'skip the root'}). Each node is visited once and combines its children in O(1): O(n) time, O(height) stack.`,
      panels: [panel('rob|skip once a node is finished'), vars({ rob: r0, skip: s0, answer: ans })],
      result: ans,
    });
    if (asks < 3) attach(frames, pick(`The root returns [${r0}, ${s0}]. What is the answer?`, ans, [r0 + s0, Math.min(r0, s0), ans + 1], 1));
    return frames;
  },
};
