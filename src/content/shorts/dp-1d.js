// Shorts for DP 1D (M9). Format: src/content/shortSchema.js. Facts come only from topics/dp-1d/topic.js.
// Every dp cell, call count, set and answer below comes from running the pattern's template (or the lesson's plain
// recursion) on the "e.g." input next to it; the results are checked against a brute force at load.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const inf = (v) => (v === Infinity ? '∞' : v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (ok, msg) => {
  if (!ok) throw new Error(`dp-1d shorts: ${msg}`);
};
// dp shown up to cell k, the rest blank
const upto = (dp, k, blank = '·') => dp.map((v, i) => (i <= k ? inf(v) : blank));
// cell i is being computed, the cells it reads are windows, earlier ones done
const fillHl = (n, i, reads = []) => hl(n, (k) => (k === i ? 'active' : reads.includes(k) ? 'window' : k < i ? 'done' : ''));

// ---------- linear sequence: house robber, e.g. nums = [4, 1, 2, 7, 5, 3] ----------
const NUMS = [4, 1, 2, 7, 5, 3];
// the template (prev2, prev1), recording each cur as dp[1..n]
function linearDP(nums) {
  let prev2 = 0;
  let prev1 = 0;
  const dp = [0];
  for (const x of nums) {
    const cur = Math.max(prev1, prev2 + x);
    prev2 = prev1;
    prev1 = cur;
    dp.push(cur);
  }
  return { answer: prev1, dp };
}
// the lesson's brute force rob(i), counting how often each rob(i) is asked (i ≥ 0)
function robAsks(nums) {
  const asks = new Array(nums.length).fill(0);
  let calls = 0;
  const rob = (i) => {
    calls++;
    if (i < 0) return 0;
    asks[i]++;
    return Math.max(rob(i - 1), nums[i] + rob(i - 2));
  };
  return { value: rob(nums.length - 1), asks, calls };
}
// every subset with no two adjacent: the specification
const bestNoAdjacent = (nums) => {
  let best = 0;
  for (let m = 0; m < 1 << nums.length; m++) if (!(m & (m >> 1))) best = Math.max(best, nums.reduce((s, v, i) => s + (m >> i & 1 ? v : 0), 0));
  return best;
};
const LS = linearDP(NUMS);
const LS_REC = robAsks(NUMS);
check(LS.answer === 14 && LS_REC.value === 14 && bestNoAdjacent(NUMS) === 14 && same(LS.dp, [0, 4, 4, 6, 11, 11, 14]), 'house robber');
check(LS_REC.calls === 41 && same(LS_REC.asks, [8, 5, 3, 2, 1, 1]), 'rob(i) repeats');
const lsFrames = LS.dp.slice(1).map((v, k) => {
  const i = k + 1;
  const skip = LS.dp[i - 1];
  const take = (i >= 2 ? LS.dp[i - 2] : 0) + NUMS[i - 1];
  return {
    say: 1,
    note:
      i === 1
        ? `i = 1: one house, rob it: dp[1] = nums[0] = ${v}.`
        : `i = ${i}: skip → dp[${i - 1}] = ${skip}; rob ${NUMS[i - 1]} + dp[${i - 2}] = ${take} → dp[${i}] = ${v}.`,
    panels: [
      arr(NUMS, { label: 'nums', highlights: { [i - 1]: v === take && v !== skip ? 'done' : 'active' } }),
      arr(upto(LS.dp, i), {
        label: 'dp (first i houses)',
        highlights: fillHl(LS.dp.length, i, i >= 2 ? [i - 1, i - 2] : [0]),
        pointers: i >= 2 ? [ptr(i - 1, 'skip'), ptr(i - 2, 'rob', 'b')] : [],
      }),
    ],
  };
});
// the question: houses in a circle, e.g. [5, 1, 1, 5]
const CIRC = [5, 1, 1, 5];
const CIRC_LINE = linearDP(CIRC).answer;
const CIRC_A = linearDP(CIRC.slice(0, -1)).answer;
const CIRC_B = linearDP(CIRC.slice(1)).answer;
check(CIRC_LINE === 10 && CIRC_A === 6 && CIRC_B === 6, 'circle');

// ---------- unbounded choice: fewest coins, e.g. coins [1, 4, 5], amount 8 ----------
const COINS = [1, 4, 5];
const AMT = 8;
// the template, recording the candidates dp[x − o] + 1 for every amount
function minItems(options, target, init = Infinity) {
  const dp = new Array(target + 1).fill(init);
  dp[0] = 0;
  const tries = [[]];
  for (let x = 1; x <= target; x++) {
    const t = [];
    for (const o of options) {
      if (o <= x) {
        t.push({ o, from: x - o, v: dp[x - o] + 1 });
        dp[x] = Math.min(dp[x], dp[x - o] + 1);
      }
    }
    tries.push(t);
  }
  return { answer: dp[target] === Infinity ? -1 : dp[target], dp, tries };
}
const greedyCoins = (coins, amount) => {
  const used = [];
  for (const c of coins.toSorted((a, b) => b - a)) while (c <= amount) used.push(c), (amount -= c);
  return used;
};
// brute force: fewest coins by trying every multiset (counts of 4 and 5, rest 1s)
const bruteCoins = (amount) => {
  let best = Infinity;
  for (let a = 0; a * 4 <= amount; a++) for (let b = 0; a * 4 + b * 5 <= amount; b++) best = Math.min(best, a + b + (amount - a * 4 - b * 5));
  return best;
};
const UC = minItems(COINS, AMT);
const UC_GREEDY = greedyCoins(COINS, AMT);
const UC_ZERO = minItems(COINS, AMT, 0);
check(same(UC.dp, [0, 1, 2, 3, 1, 1, 2, 3, 2]) && UC.answer === bruteCoins(AMT) && same(UC_GREEDY, [5, 1, 1, 1]), 'coin change');
check(UC.dp.every((v, x) => v === bruteCoins(x)) && UC_ZERO.answer === 0, 'coins dp vs brute force, zero fill');
const ucPanel = (k, reads = [], tries = []) =>
  arr(upto(UC.dp, k), {
    label: 'dp[x] = fewest coins for x',
    highlights: fillHl(UC.dp.length, k, reads),
    pointers: tries.map((t) => ptr(t.from, `−${t.o}`, t.v === UC.dp[k] ? 'a' : 'b')),
  });
const ucFrames = [
  { say: 0, note: 'dp[0] = 0: zero coins make 0. Every other cell starts at ∞ (unreachable).', panels: [arr(UC.dp.map((v, i) => (i === 0 ? 0 : '∞')), { label: 'dp[x] = fewest coins for x', highlights: { 0: 'active' } })] },
  {
    say: 1,
    note: `x = 1, 2, 3: only coin 1 fits, so dp[x] = dp[x − 1] + 1 → ${UC.dp.slice(1, 4).join(', ')}.`,
    panels: [ucPanel(3, [2], UC.tries[3])],
  },
  ...[4, 5, 6, 7, 8].map((x) => ({
    say: 1,
    note: `x = ${x}: ${UC.tries[x].map((t) => `dp[${t.from}]+1 = ${t.v}`).join(', ')} → min ${UC.dp[x]}.`,
    panels: [ucPanel(x, UC.tries[x].map((t) => t.from), UC.tries[x])],
  })),
];

// ---------- string decoding: e.g. s = "2125" ----------
const DS = '2125';
// the template (prev2, prev1), recording dp[0..n] and which pieces were valid
function numDecodings(s) {
  let prev2 = 1;
  let prev1 = s[0] === '0' ? 0 : 1;
  const dp = [1, prev1];
  const parts = [null, null];
  for (let i = 2; i <= s.length; i++) {
    let cur = 0;
    const one = s[i - 1] !== '0';
    if (one) cur += prev1;
    const two = Number(s.slice(i - 2, i));
    const twoOk = two >= 10 && two <= 26;
    if (twoOk) cur += prev2;
    parts.push({ one, two: s.slice(i - 2, i), twoOk });
    prev2 = prev1;
    prev1 = cur;
    dp.push(cur);
  }
  return { answer: prev1, dp, parts };
}
// plain recursion on suffixes, listing every decoding and counting how often each suffix start is asked
function decodeAll(s) {
  const asks = new Array(s.length + 1).fill(0);
  const out = [];
  const go = (i, pieces) => {
    asks[i]++;
    if (i === s.length) return out.push(pieces.join(' '));
    if (s[i] !== '0') go(i + 1, [...pieces, s[i]]);
    const two = Number(s.slice(i, i + 2));
    if (i + 2 <= s.length && two >= 10 && two <= 26) go(i + 2, [...pieces, s.slice(i, i + 2)]);
  };
  go(0, []);
  return { out, asks };
}
const SD = numDecodings(DS);
const SD_ALL = decodeAll(DS);
check(SD.answer === 5 && SD_ALL.out.length === 5 && same(SD.dp, [1, 1, 2, 3, 5]), 'decode ways');
check(same(SD_ALL.asks, [1, 1, 2, 3, 5]), 'suffix repeats');
const sdFrames = [
  {
    say: 0,
    note: `dp[0] = 1 (empty prefix). dp[1] = 1: "${DS[0]}" is not 0.`,
    panels: [arr([...DS], { label: 's', highlights: { 0: 'active' } }), arr(upto(SD.dp, 1), { label: 'dp (first i chars)', highlights: { 0: 'done', 1: 'active' } })],
  },
  ...SD.parts.slice(2).map((p, k) => {
    const i = k + 2;
    const reads = [...(p.one ? [i - 1] : []), ...(p.twoOk ? [i - 2] : [])];
    return {
      say: 1,
      note:
        `i = ${i}: "${DS[i - 1]}" ${p.one ? `ok → +dp[${i - 1}] = ${SD.dp[i - 1]}` : 'is 0 → +0'}; ` +
        `"${p.two}" ${p.twoOk ? `in 10–26 → +dp[${i - 2}] = ${SD.dp[i - 2]}` : 'not 10–26 → +0'}. dp[${i}] = ${SD.dp[i]}.`,
      panels: [
        arr([...DS], { label: 's', highlights: { [i - 2]: p.twoOk ? 'window' : '', [i - 1]: 'active' } }),
        arr(upto(SD.dp, i), { label: 'dp (first i chars)', highlights: fillHl(SD.dp.length, i, reads), pointers: [ptr(i - 1, '1 digit'), ptr(i - 2, '2 digits', 'b')] }),
      ],
    };
  }),
];
// the question: e.g. s = "1203", the cell after a 0
const SQ = '1203';
const SQR = numDecodings(SQ);
check(same(SQR.dp, [1, 1, 2, 1, 1]) && decodeAll(SQ).out.length === 1, 'zero after 2');

// ---------- prefix segmentation: e.g. s = "dogsled" ----------
const WS = 'dogsled';
const WD = ['dog', 'dogs', 'led', 'sled'];
// the template, recording for every i the split points j with dp[j] true that were tried
function wordBreak(s, words, base = true) {
  const dict = new Set(words);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = base;
  const tries = [[]];
  for (let i = 1; i <= s.length; i++) {
    const t = [];
    for (let j = 0; j < i; j++) {
      if (dp[j]) {
        const hit = dict.has(s.slice(j, i));
        t.push({ j, w: s.slice(j, i), hit });
        if (hit) {
          dp[i] = true;
          break;
        }
      }
    }
    tries.push(t);
  }
  return { answer: dp[s.length], dp, tries };
}
// backtracking over split points without memo, counting calls per start index
function backtrack(s, words) {
  const dict = new Set(words);
  const asks = new Array(s.length + 1).fill(0);
  let calls = 0;
  const can = (start) => {
    calls++;
    asks[start]++;
    if (start === s.length) return true;
    for (let end = start + 1; end <= s.length; end++) if (dict.has(s.slice(start, end)) && can(end)) return true;
    return false;
  };
  return { ok: can(0), calls, asks };
}
const PS = wordBreak(WS, WD);
const PS_BT = backtrack(WS, WD);
check(PS.answer && PS_BT.ok && same(PS.dp, [true, false, false, true, true, false, false, true]), 'word break');
// the blow-up input from whyItExists: "aaaa…b"
const AB = 'aaaaaab';
const AD = ['a', 'aa', 'aaa'];
const AB_BT = backtrack(AB, AD);
const AB_DP = wordBreak(AB, AD);
check(!AB_BT.ok && !AB_DP.answer && AB_BT.calls === 52 && same(AB_BT.asks, [1, 1, 2, 4, 7, 13, 24, 0]), 'aaaab backtracking');
const tf = (v) => (v ? 'T' : 'F');
const psPanels = (i, tries) => {
  const hit = tries.find((t) => t.hit);
  return [
    arr([...WS], { label: 's', highlights: hit ? hl(WS.length, (k) => (k >= hit.j && k < i ? 'window' : '')) : {} }),
    arr(PS.dp.map((v, k) => (k <= i ? tf(v) : '·')), {
      label: 'dp (first i chars)',
      highlights: hl(PS.dp.length, (k) => (k === i ? (PS.dp[i] ? 'active' : 'bad') : tries.some((t) => t.j === k) ? 'window' : k < i ? 'done' : '')),
      pointers: hit ? [ptr(hit.j, 'j'), ptr(i, 'i', 'b')] : [ptr(i, 'i', 'b')],
    }),
  ];
};
const tryText = (t) => `"${t.w}" ${t.hit ? '∈ dict' : '✗'}`;
const psFrames = [
  { say: 0, note: 'dp[0] = true: the empty prefix is segmentable. Everything else starts false.', panels: psPanels(0, []) },
  ...[[1, 2], [3], [4], [5, 6], [7]].map((is) => {
    const i = is.at(-1);
    const tries = PS.tries[i];
    return {
      say: 1,
      note:
        is.length > 1
          ? `i = ${is.join(', ')}: no dictionary word s[j..i) starts at a true j (i = ${i}: ${tries.map((t) => `"${t.w}"`).join(', ')}) → false.`
          : `i = ${i}: ` + tries.map((t) => `j = ${t.j} ${tryText(t)}`).join(', ') + ` → dp[${i}] = ${PS.dp[i]}${PS.dp[i] ? ', break' : ''}.`,
      panels: psPanels(i, tries),
    };
  }),
];
const PS_NOBASE = wordBreak(WS, WD, false);
check(PS_NOBASE.dp.every((v) => !v), 'dp[0] = false kills everything');

// ---------- state map: frog jump, e.g. stones [0, 1, 3, 5, 6, 8, 12] ----------
const STONES = [0, 1, 3, 5, 6, 8, 12];
// the template, recording the sets after each stone is processed and which (stone, step) pairs were added
function frog(stones) {
  const reach = new Map(stones.map((s) => [s, new Set()]));
  reach.get(stones[0]).add(0);
  const snaps = [];
  for (const s of stones) {
    const added = [];
    const ks = [...reach.get(s)];
    for (const k of ks) {
      for (const step of [k - 1, k, k + 1]) {
        if (step > 0 && reach.has(s + step)) {
          reach.get(s + step).add(step);
          added.push({ from: k, to: s + step, step });
        }
      }
    }
    snaps.push({ s, ks, added, sets: stones.map((t) => [...reach.get(t)].sort((a, b) => a - b)) });
  }
  return { ok: reach.get(stones.at(-1)).size > 0, snaps };
}
// brute force: DFS over (stone, last jump) without memo
const frogBrute = (stones) => {
  const has = new Set(stones);
  const go = (pos, k) => pos === stones.at(-1) || [k - 1, k, k + 1].some((st) => st > 0 && has.has(pos + st) && go(pos + st, st));
  return go(stones[0], 0);
};
const FJ = frog(STONES);
const FJ_END = FJ.snaps.at(-1).sets;
check(FJ.ok && frogBrute(STONES) && same(FJ_END, [[0], [1], [2], [2], [1, 3], [2, 3], [4]]), 'frog jump sets');
const setText = (ks) => (ks.length ? `{${ks.join(', ')}}` : '—');
const fjPanels = (sets, cur, targets = []) => [
  arr(STONES, { label: 'stones', pointers: cur >= 0 ? [ptr(cur, 's')] : [], highlights: hl(STONES.length, (k) => (k === cur ? 'active' : targets.includes(k) ? 'window' : '')) }),
  table(
    STONES.map(String),
    ['last jumps k'],
    sets.map((ks) => [setText(ks)]),
    STONES.map((_, k) => [k === cur ? 'active' : targets.includes(k) ? 'window' : '']),
    'reach: Map<stone, Set<k>>',
  ),
];
const fjFrames = FJ.snaps.map((sn, k) => {
  const targets = sn.added.map((a) => STONES.indexOf(a.to));
  const adds = [...new Set(sn.added.map((a) => `${a.to} (k ${a.step})`))].join(', ');
  return {
    say: 1,
    note:
      k === FJ.snaps.length - 1
        ? `Stone ${sn.s} is the last one and its set is ${setText(sn.ks)}: not empty → true.`
        : `Stone ${sn.s}, k ∈ ${setText(sn.ks)}: try k − 1, k, k + 1 → ${adds || 'no stone lands'}.`,
    panels: fjPanels(sn.sets, k, targets),
  };
});
const START_SETS = STONES.map((_, k) => (k === 0 ? [0] : []));

export default [
  {
    id: 'dp-1d-linear-sequence',
    title: 'Rob the most houses without asking twice',
    steps: [
      {
        kind: 'watch',
        title: 'The same question, again and again',
        lines: [
          'House robber: money in a row, never rob two adjacent houses. Last decision: rob house i or skip it.',
          '`rob(i) = max(rob(i − 1), nums[i] + rob(i − 2))`: two branches per call, so the recursion is exponential.',
        ],
        frames: [
          { say: 0, note: `e.g. nums = [${NUMS.join(', ')}]. Best plan: ${LS.answer}.`, panels: [arr(NUMS, { label: 'nums' })] },
          {
            say: 1,
            note: `Plain recursion makes ${LS_REC.calls} calls, yet asks only about rob(−2) … rob(${NUMS.length - 1}). rob(0) alone: ${LS_REC.asks[0]} times.`,
            panels: [
              arr(LS_REC.asks, { label: 'times rob(i) is asked', highlights: hl(NUMS.length, (k) => (LS_REC.asks[k] > 1 ? 'bad' : '')) }),
              vars({ calls: LS_REC.calls, 'distinct questions': NUMS.length + 2 }),
            ],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Fill dp left to right',
        lines: [
          '`dp[i]` = best money from the **first i houses**. `dp[0] = 0`: no houses, no money.',
          '`dp[i] = max(dp[i − 1], dp[i − 2] + nums[i − 1])`: skip house i − 1, or rob it.',
        ],
        frames: [{ say: 0, note: 'dp[0] = 0. Each cell is computed once, from cells already final.', panels: [arr(NUMS, { label: 'nums' }), arr(upto(LS.dp, 0), { label: 'dp (first i houses)', highlights: { 0: 'active' } })] }, ...lsFrames],
      },
      {
        kind: 'watch',
        title: 'Two cells are enough, and the clue',
        lines: [
          'dp[i] reads only dp[i − 1] and dp[i − 2]: keep two variables, `prev2` and `prev1`.',
          'Clues: **"number of distinct ways to reach"**, **"cannot pick two adjacent"**, **"minimum cost to reach the top"**, **"houses arranged in a circle"**.',
        ],
        frames: [
          {
            say: 0,
            note: `The template slides prev2, prev1 = ${LS.dp[NUMS.length - 1]}, ${LS.dp[NUMS.length]}: O(n) time, O(1) space.`,
            panels: [arr(LS.dp, { label: 'dp', highlights: { [NUMS.length - 1]: 'window', [NUMS.length]: 'active' } }), vars({ prev2: LS.dp[NUMS.length - 1], prev1: LS.dp[NUMS.length] })],
          },
          {
            say: 1,
            note: 'Same shape, different transition: count, take/skip, run twice, or bucket first.',
            panels: [
              table(
                ['climbing stairs', 'house robber', 'houses in a circle', 'delete and earn'],
                ['dp[i] from'],
                [['dp[i − 1] + dp[i − 2]'], ['max(dp[i − 1], dp[i − 2] + value)'], ['linear DP without first / without last'], ['bucket by value, then house robber']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a circle of houses',
        lines: [`e.g. nums = [${CIRC.join(', ')}], and the first and last houses are neighbours.`, `The plain linear DP says ${CIRC_LINE}.`],
        panels: [arr(CIRC, { label: 'nums (circle)', highlights: { 0: 'bad', 3: 'bad' } }), vars({ 'linear DP': CIRC_LINE })],
        task: {
          type: 'choose',
          question: 'What is the right answer?',
          options: [
            { text: `${CIRC_LINE}: rob both 5s`, why: 'Houses 0 and 3 touch in a circle, so robbing both breaks the rule.' },
            { text: `${Math.max(CIRC_A, CIRC_B)} = max(linear DP without the last house, without the first)` },
            { text: '5: pick the single biggest house', why: `Without house 3 you can still rob 5 + 1 = ${CIRC_A}. Any valid plan skips the first or the last house, so run both cases.` },
            { text: '12: add every house', why: 'Neighbours can never both be robbed; that is the whole constraint.' },
          ],
          answer: 1,
        },
        solved: 'Circle: run the linear DP twice (drop the first house, drop the last) and take the max.',
      },
    ],
  },

  {
    id: 'dp-1d-unbounded-choice',
    title: 'Fewest coins: try every last coin',
    steps: [
      {
        kind: 'watch',
        title: 'The biggest coin is not always right',
        lines: ['Fewest coins summing to an amount; every coin can be reused.', 'Greedy picks one "obvious" last move: the biggest coin that fits.'],
        frames: [
          { say: 0, note: `e.g. coins [${COINS.join(', ')}], amount ${AMT}.`, panels: [arr(COINS, { label: 'coins' }), vars({ amount: AMT })] },
          {
            say: 1,
            note: `Greedy: ${UC_GREEDY.join(' + ')} = ${UC_GREEDY.length} coins. But 4 + 4 is ${UC.answer}.`,
            panels: [arr(UC_GREEDY, { label: 'greedy coins', highlights: hl(UC_GREEDY.length, () => 'bad') }), arr([4, 4], { label: 'better', highlights: { 0: 'done', 1: 'done' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Every amount, every last coin',
        lines: ['`dp[x]` = fewest coins for x. `dp[0] = 0`; every other cell starts at `Infinity`.', 'For each x, try every coin o ≤ x as the LAST move: `dp[x − o] + 1`, keep the min.'],
        frames: ucFrames,
      },
      {
        kind: 'watch',
        title: 'Each amount once, and the clue',
        lines: [
          'dp[8] tried coin 4 last because dp[4] was already known: O(amount × options).',
          'Clues: **"fewest number of coins"**, **"least number of perfect squares"**, **"1-day, 7-day, 30-day passes"**, **"infinite supply"**.',
        ],
        frames: [
          {
            say: 1,
            note: 'Same loop, other "coins": squares, ordered sums (amount loop outside), pass lengths.',
            panels: [
              table(
                ['coin change', 'perfect squares', 'combination sum IV', 'min cost tickets'],
                ['options', 'combine'],
                [['coins', 'min dp[x − c] + 1'], ['1, 4, 9, 16, … ≤ n', 'min dp[x − s] + 1'], ['nums', 'Σ dp[x − n]'], ['1, 7, 30 days', 'min dp[d − len] + price']],
              ),
            ],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the starting value',
        lines: [`Same coins [${COINS.join(', ')}], amount ${AMT}.`, 'A teammate writes `new Array(target + 1).fill(0)` instead of `fill(Infinity)`.'],
        panels: [arr(UC_ZERO.dp, { label: 'dp with fill(0)', highlights: hl(UC_ZERO.dp.length, (k) => (k ? 'bad' : '')) })],
        task: {
          type: 'choose',
          question: 'What does minItems return now?',
          options: [
            { text: `${UC_ZERO.answer}: every cell starts at 0, and min(0, anything + 1) stays 0` },
            { text: `${UC.answer}, the same as before`, why: 'Math.min keeps the smaller value, and 0 is smaller than every dp[x − o] + 1.' },
            { text: `${UC_GREEDY.length}, the greedy count`, why: 'Nothing greedy happens; the start value alone breaks every cell.' },
            { text: '-1', why: '-1 is returned only when dp[target] is still Infinity; with fill(0) it never is.' },
          ],
          answer: 0,
        },
        solved: 'A min-DP starts every cell at Infinity (unreachable); only dp[0] = 0 is a real base case.',
      },
    ],
  },

  {
    id: 'dp-1d-string-decoding',
    title: 'Count the decodings of a digit string',
    steps: [
      {
        kind: 'watch',
        title: 'Different splits, same suffix',
        lines: ['A → 1 … Z → 26. Each letter uses one digit or two digits.', 'Counting splits recursively re-counts the same remaining suffix again and again.'],
        frames: [
          {
            say: 0,
            note: `e.g. s = "${DS}" has ${SD.answer} decodings.`,
            panels: [arr([...DS], { label: 's' }), table(SD_ALL.out.map((_, k) => `#${k + 1}`), ['pieces'], SD_ALL.out.map((o) => [o]))],
          },
          {
            say: 1,
            note: `Plain recursion starts at the suffix from index 4 (the empty one) ${SD_ALL.asks[4]} times, from 3: ${SD_ALL.asks[3]} times.`,
            panels: [arr(SD_ALL.asks, { label: 'times each suffix start is asked', highlights: hl(SD_ALL.asks.length, (k) => (SD_ALL.asks[k] > 1 ? 'bad' : '')) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Two looks back per cell',
        lines: [
          '`dp[i]` = ways to decode the first i characters. `dp[0] = 1`: the empty prefix has one decoding.',
          'One digit `s[i − 1]` (not "0") → add `dp[i − 1]`. Two digits in 10–26 → add `dp[i − 2]`.',
        ],
        frames: sdFrames,
      },
      {
        kind: 'watch',
        title: 'The zero traps, and the clue',
        lines: ['"0" alone is no letter, and "06" is not a two-digit code: both must add 0.', 'Clues: **"A → 1 … Z → 26"**, **"number of ways to decode"**, **"* can be any digit 1–9"**, **"modulo 10^9 + 7"**.'],
        frames: [
          {
            say: 0,
            note: 'Only the validity checks differ from climbing stairs. Wildcards multiply each piece by its meanings.',
            panels: [table(['"0"', '"06"', '"20"', '"27"'], ['piece', 'valid?'], [['one digit', 'no'], ['two digits', 'no'], ['two digits', 'yes'], ['two digits', 'no (> 26)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a zero in the middle',
        lines: [`e.g. s = "${SQ}". dp[0..2] = ${SQR.dp.slice(0, 3).join(', ')}.`, 'Now i = 3: the digit is "0", the two-digit piece is "20".'],
        panels: [arr([...SQ], { label: 's', highlights: { 1: 'window', 2: 'active' } }), arr(upto(SQR.dp, 2), { label: 'dp', highlights: { 1: 'window', 2: 'window', 3: 'active' } })],
        task: {
          type: 'choose',
          question: 'What is dp[3]?',
          options: [
            { text: `${SQR.dp[3]}: "0" adds nothing, "20" adds dp[1] = ${SQR.dp[1]}` },
            { text: `${SQR.dp[2] + SQR.dp[1]} = dp[2] + dp[1]`, why: '"0" alone does not map to a letter, so dp[2] is not added.' },
            { text: '0: a zero kills the string', why: '"0" is fine as the second digit of 10 or 20.' },
            { text: `${SQR.dp[2]} = dp[2]`, why: 'That is the one-digit case, which is invalid for "0". The valid case is the two-digit "20".' },
          ],
          answer: 0,
        },
        solved: 'Each piece adds its dp cell only when valid: "0" never alone, two digits only in 10–26.',
      },
    ],
  },

  {
    id: 'dp-1d-prefix-segmentation',
    title: 'Split a string into words: remember where splits end',
    steps: [
      {
        kind: 'watch',
        title: 'Backtracking over split points',
        lines: ['Can s be split into dictionary words (words may be reused)?', 'Backtracking tries every first word, then recurses on the rest: exponential on "aaaa…b".'],
        frames: [
          { say: 0, note: `e.g. s = "${WS}", words [${WD.join(', ')}]: "dog sled" or "dogs led".`, panels: [arr([...WS], { label: 's' }), arr(WD, { label: 'dictionary (Set)' })] },
          {
            say: 1,
            note: `e.g. "${AB}" with [${AD.join(', ')}]: ${AB_BT.calls} calls, start 6 retried ${AB_BT.asks[6]} times. Only ${AB.length + 1} states.`,
            panels: [arr(AB_BT.asks, { label: 'times backtracking restarts at index', highlights: hl(AB_BT.asks.length, (k) => (AB_BT.asks[k] > 1 ? 'bad' : '')) }), vars({ calls: AB_BT.calls, states: AB.length + 1 })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'dp[i]: can the first i characters split?',
        lines: ['`dp[0] = true`: the empty prefix is segmentable.', '`dp[i] = true` if some `dp[j]` is true and `s.slice(j, i)` is in the Set; then break.'],
        frames: psFrames,
      },
      {
        kind: 'watch',
        title: 'Only where a split ends matters',
        lines: [
          'n + 1 states, up to n split points each: O(n² · L) with slicing.',
          'Clues: **"segmented into a space-separated sequence of dictionary words"**, **"return all such possible sentences"**, **"word may be reused"**.',
        ],
        frames: [
          {
            say: 1,
            note: 'All sentences: memoized DFS per start index. Limit j to i − maxWordLength to try fewer splits.',
            panels: [table(['word break', 'word break II', 'fixed 1–2 tokens'], ['how'], [['dp[i] true/false'], ['memoized DFS returning a list per start'], ['string decoding is simpler']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: the base case',
        lines: [`Same s = "${WS}". A teammate forgets \`dp[0] = true\`.`, 'The loop only tries a word when `dp[j]` is true.'],
        panels: [arr(PS_NOBASE.dp.map(tf), { label: 'dp without the base', highlights: hl(PS_NOBASE.dp.length, () => 'bad') })],
        task: {
          type: 'choose',
          question: 'What does wordBreak return?',
          options: [
            { text: 'false: every true cell must chain back to dp[0], so none ever becomes true' },
            { text: 'true, because "dog" is in the dictionary', why: '"dog" is tried only from j = 0, and the check needs dp[0] to be true first.' },
            { text: 'true, but only via "dogs led"', why: 'Both splits start at j = 0, which is now false.' },
            { text: 'It throws an error', why: 'Nothing is read out of range; every cell simply stays false.' },
          ],
          answer: 0,
        },
        solved: 'dp[0] = true is the seed: every segmentable prefix is built from it, one word at a time.',
      },
    ],
  },

  {
    id: 'dp-1d-state-map',
    title: 'Frog jump: remember how you arrived',
    steps: [
      {
        kind: 'watch',
        title: 'Position is not enough',
        lines: ['If the last jump was k units, the next must be k − 1, k or k + 1 (never 0). The first jump is 1.', 'So "can I stand on stone s?" is not enough: the next move needs the last jump too.'],
        frames: [
          { say: 0, note: `e.g. stones [${STONES.join(', ')}]. Can the frog reach ${STONES.at(-1)}?`, panels: [arr(STONES, { label: 'stones' })] },
          {
            say: 1,
            note: `Stone 8 is reached with k = 2 or k = 3. From k = 2 the jumps are 1, 2, 3; only k = 3 allows 4 → 12.`,
            panels: [arr(STONES, { label: 'stones', highlights: { 5: 'active', 6: 'window' } }), vars({ 'k = 2 next': '9, 10, 11', 'k = 3 next': '10, 11, 12' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'A Set of jumps per stone',
        lines: ['`reach = Map<stone, Set<k>>`, start: `reach.get(0)` = {0}.', 'For each stone in order, each k: add `step` to `reach.get(s + step)` if `step > 0` and that stone exists.'],
        frames: [{ say: 0, note: 'Only the start has a state: "last jump 0", so its only valid step is 1.', panels: fjPanels(START_SETS, -1) }, ...fjFrames],
      },
      {
        kind: 'watch',
        title: 'Store only what occurs, and the clue',
        lines: ['Only reachable (stone, k) pairs are stored: memory follows what actually happens.', 'Clues: **"if the last jump was k units, the next must be k − 1, k or k + 1"**, positions sparse or huge.'],
        frames: [
          {
            say: 0,
            note: `${FJ_END.flat().length} states stored for ${STONES.length} stones. A dense, small extra state would fit a 2D array instead.`,
            panels: [table(['frog jump', 'memoized DFS', 'small dense state'], ['state'], [['Map<stone, Set<k>>'], ['key `${index},${k}`'], ['plain 2D array (DP 2D)']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: why a Set per stone?',
        lines: [`After the run, stone 6 holds {${FJ_END[4].join(', ')}} and stone 8 holds {${FJ_END[5].join(', ')}}.`],
        panels: fjPanels(FJ_END, -1),
        task: {
          type: 'choose',
          question: 'Why not just a true/false per stone, like word break?',
          options: [
            { text: 'Each arriving jump k allows different next jumps, so the same stone can lead to different stones' },
            { text: 'A boolean array would be slower to read', why: 'Speed is not the issue: a boolean loses which k arrived, and only k = 3 at stone 8 reaches 12.' },
            { text: 'To stop jumps of size 0', why: 'That is the `step > 0` check, not the Set.' },
            { text: 'Because the stones are not sorted', why: 'They are processed in order; the extra fact needed is the last jump, not the order.' },
          ],
          answer: 0,
        },
        solved: 'When the next move depends on how you arrived, store that fact per position: Map<position, Set<state>>.',
      },
    ],
  },
];
