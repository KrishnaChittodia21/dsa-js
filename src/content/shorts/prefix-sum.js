// Shorts for Prefix Sum (M9). Format: src/content/shortSchema.js. Facts come only from topics/prefix-sum/topic.js.
// Every prefix value, table cell, count and diff mark below is produced by running the pattern's template.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((row) => row.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const gst = (m, n, f) => Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => f(r, c)));
const win = (n, lo, hi, extra = {}) => hl(n, (k) => extra[k] ?? (k >= lo && k <= hi ? 'window' : ''));
const prefixOf = (a) => a.reduce((p, x) => (p.push(p.at(-1) + x), p), [0]);
const mapT = (m, label, col) => table([...m.keys()].map(String), [col], [...m.values()].map((v) => [String(v)]), label);

// ---------- 1D: range sums on [6, −2, 3, 5] ----------
const N = [6, -2, 3, 5];
const P = prefixOf(N); // 0 6 4 7 12
const buildFrames = [
  { say: 0, note: 'prefix[0] = 0: the empty sum. The array gets n + 1 entries.', panels: [arr(N, { label: 'nums' }), arr(P.map((v, k) => (k ? '·' : v)), { label: 'prefix', highlights: { 0: 'active' } })] },
  ...N.map((x, i) => ({
    say: 1,
    note: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${P[i]} + ${x} = ${P[i + 1]}.`,
    panels: [arr(N, { label: 'nums', highlights: hl(4, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(P.map((v, k) => (k <= i + 1 ? v : '·')), { label: 'prefix', highlights: { [i]: 'window', [i + 1]: 'active' } })],
  })),
];
const range1d = (l, r, say, note) => ({
  say,
  note,
  panels: [arr(N, { label: 'nums', range: [l, r], highlights: win(4, l, r) }), arr(P, { label: 'prefix', highlights: { [r + 1]: 'active', [l]: 'bad' }, pointers: [ptr(l, '−'), ptr(r + 1, '+', 'b')] })],
});

// ---------- 2D: a 3 × 3 matrix ----------
const M = [
  [2, 0, 1],
  [1, 3, 2],
  [4, 1, 0],
];
const P2 = Array.from({ length: 4 }, () => new Array(4).fill(0));
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) P2[r + 1][c + 1] = M[r][c] + P2[r][c + 1] + P2[r + 1][c] - P2[r][c];
// P with only the cells built so far (row-major up to P[R][C])
const upTo = (R, C) => P2.map((row, r) => row.map((v, c) => (r === 0 || c === 0 || r < R || (r === R && c <= C) ? v : '·')));
const cellsSt = (m, n, marks) => gst(m, n, (r, c) => marks[`${r},${c}`] ?? '');
const inRect = (r1, c1, r2, c2, st) => Object.fromEntries(gst(3, 3, (r, c) => (r >= r1 && r <= r2 && c >= c1 && c <= c2 ? [`${r},${c}`, st] : null)).flat().filter(Boolean));
// query rows 1..2, cols 1..2
const Q = { r1: 1, c1: 1, r2: 2, c2: 2 };
const qSum = P2[3][3] - P2[1][3] - P2[3][1] + P2[1][1];
const qGrid = (marks, label) => grid(P2, cellsSt(4, 4, marks), label);

// ---------- prefix + hash map: [2, −1, 1, 2, −2], k = 2 ----------
const H = [2, -1, 1, 2, -2];
const HK = 2;
const hashRun = [];
{
  const seen = new Map([[0, 1]]);
  let prefix = 0,
    count = 0;
  for (const [j, x] of H.entries()) {
    prefix += x;
    const found = seen.get(prefix - HK) ?? 0;
    count += found;
    const before = new Map(seen);
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
    hashRun.push({ j, x, prefix, look: prefix - HK, found, count, before, after: new Map(seen) });
  }
}
const hashFrame = (s) => ({
  say: 1,
  note: `j = ${s.j}: prefix = ${s.prefix}, look for ${s.prefix} − 2 = ${s.look} → ${s.found}. count = ${s.count}. Then record ${s.prefix}.`,
  panels: [arr(H, { label: 'nums, k = 2', pointers: [ptr(s.j, 'j')], highlights: hl(H.length, (i) => (i === s.j ? 'active' : i < s.j ? 'done' : '')) }), vars({ prefix: s.prefix, 'look for': s.look, count: s.count }), mapT(s.after, 'seen', 'times')],
});
const HT = hashRun[4]; // the turn: the last element

// ---------- prefix mod k: [1, 2, 4, −9], k = 3 ----------
const D = [1, 2, 4, -9];
const DK = 3;
const modRun = [];
{
  const count = new Array(DK).fill(0);
  count[0] = 1;
  let prefix = 0,
    total = 0;
  for (const [j, x] of D.entries()) {
    const raw = prefix + x;
    prefix = ((raw % DK) + DK) % DK;
    const found = count[prefix];
    total += found;
    const before = count.slice();
    count[prefix]++;
    modRun.push({ j, raw, sum: D.slice(0, j + 1).reduce((a, b) => a + b, 0), rem: prefix, found, total, before, after: count.slice() });
  }
}
const modFrame = (s) => ({
  say: 1,
  note: `j = ${s.j}: running sum ${s.sum}, remainder ${s.rem}. ${s.found} earlier prefix${s.found === 1 ? ' shares' : 'es share'} it → total = ${s.total}.`,
  panels: [
    arr(D, { label: 'nums, k = 3', pointers: [ptr(s.j, 'j')], highlights: hl(4, (i) => (i === s.j ? 'active' : i < s.j ? 'done' : '')) }),
    arr(s.after, { label: 'count[remainder]', highlights: { [s.rem]: s.found ? 'done' : 'active' } }),
    vars({ remainder: s.rem, total: s.total }),
  ],
});
const MT = modRun[3]; // the turn: −9 makes the running sum negative

// ---------- difference array: n = 5, three range adds ----------
const UPD = [
  [0, 1, 2],
  [1, 3, 4],
  [2, 4, 1],
];
const markFrames = [];
const diff = new Array(6).fill(0);
for (const [l, r, v] of UPD) {
  diff[l] += v;
  diff[r + 1] -= v;
  markFrames.push({ say: 0, note: `Add ${v} to [${l}, ${r}]: diff[${l}] += ${v}, diff[${r + 1}] −= ${v}. Two writes, whatever the length.`, panels: [arr(diff.slice(), { label: 'diff (n + 1 slots)', highlights: { [l]: 'active', [r + 1]: 'bad' } })] });
}
const runFrames = [];
{
  let running = 0;
  const out = [];
  for (let i = 0; i < 5; i++) {
    running += diff[i];
    out.push(running);
    runFrames.push({ say: 1, note: `running += diff[${i}] (${diff[i]}) → result[${i}] = ${running}.`, panels: [arr(diff, { label: 'diff', pointers: [ptr(i, 'i')], highlights: hl(6, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr([...out, ...new Array(5 - out.length).fill('·')], { label: 'result', highlights: { [i]: 'active' } })] });
  }
}

export default [
  {
    id: 'prefix-sum-1d',
    title: 'Any range sum in one subtraction',
    steps: [
      {
        kind: 'watch',
        title: 'The same additions, query after query',
        lines: ['Many questions: **"sum of nums[l..r]?"** on an array that never changes.', 'Summing each range directly is O(length): **O(n·q)** for q queries.'],
        frames: [
          { say: 0, note: 'e.g. nums = [6, −2, 3, 5] and a stream of (l, r) questions.', panels: [arr(N, { label: 'nums' })] },
          { say: 1, note: 'sum(1..3) loops over −2, 3, 5. sum(0..2) loops over 6, −2, 3 again: the overlap is re-added.', panels: [arr(N, { label: 'sum(1..3)', range: [1, 3], highlights: win(4, 1, 3, { 1: 'visited', 2: 'visited' }) }), arr(N, { label: 'sum(0..2)', range: [0, 2], highlights: win(4, 0, 2, { 1: 'visited', 2: 'visited' }) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Pay once: running totals',
        lines: ['`prefix[0] = 0`, the empty sum.', '`prefix[i + 1] = prefix[i] + nums[i]`: one O(n) pass.'],
        frames: buildFrames,
      },
      {
        kind: 'watch',
        title: 'Reuse forever',
        lines: ['`sum(l..r) = prefix[r + 1] − prefix[l]`: the shared part before l cancels.', 'The leading 0 makes ranges that start at index 0 no special case.'],
        frames: [
          range1d(1, 3, 0, `sum(1..3) = prefix[4] − prefix[1] = ${P[4]} − ${P[1]} = ${P[4] - P[1]}. One subtraction.`),
          range1d(0, 2, 1, `sum(0..2) = prefix[3] − prefix[0] = ${P[3]} − 0 = ${P[3]}. The 0 slot does the work.`),
          { say: 0, note: 'Clues: "sum of elements between indices left and right", "many queries", "running sum", "cumulative".', panels: [vars({ build: 'O(n)', 'each query': 'O(1)' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: pick the two slots',
        lines: ['Same `prefix = [0, 6, 4, 7, 12]`.', 'Wanted: **sum(2..3)**, i.e. 3 + 5.'],
        panels: [arr(N, { label: 'nums', range: [2, 3], highlights: win(4, 2, 3) }), arr(P, { label: 'prefix' })],
        task: {
          type: 'choose',
          question: 'Which subtraction gives sum(2..3)?',
          options: [
            { text: 'prefix[3] − prefix[2] = 3', why: 'prefix[3] covers only indices 0..2, so index 3 (the 5) is missing.' },
            { text: 'prefix[4] − prefix[3] = 5', why: 'Subtracting prefix[3] also removes index 2 (the 3).' },
            { text: 'prefix[4] − prefix[2] = 8' },
            { text: 'prefix[3] − prefix[1] = 1', why: 'Both ends are off by one: that is sum(1..2).' },
          ],
          answer: 2,
        },
        solved: '**prefix[r + 1] − prefix[l]**: the +1 belongs to the right end, because prefix[r + 1] is the first total that includes r.',
      },
    ],
  },

  {
    id: 'prefix-sum-2d',
    title: 'Any rectangle sum from four corners',
    steps: [
      {
        kind: 'watch',
        title: 'Block by block is slow',
        lines: ['Many **"sum of the submatrix (row1, col1, row2, col2)"** queries on a fixed matrix.', 'Summing a k×k block cell by cell costs **O(k²)** per query.'],
        frames: [
          { say: 0, note: 'e.g. this 3 × 3 matrix, and a stream of rectangle queries.', panels: [grid(M, gst(3, 3, () => ''), 'matrix')] },
          { say: 1, note: 'Rows 1..2, cols 1..2: visit 3, 2, 1, 0. The next query visits its cells all over again.', panels: [grid(M, cellsSt(3, 3, inRect(1, 1, 2, 2, 'visited')), 'matrix')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Build P: one padded row and column',
        lines: ['`P[r][c]` = sum of the rectangle from (0, 0) to (r − 1, c − 1). Row 0 and column 0 are zeros.', '`P[r+1][c+1] = M[r][c] + above + left − above-left`: the above-left block is in both, so take it out once.'],
        frames: [
          { say: 0, note: 'Start: the zero row and zero column. Nothing else built yet.', panels: [grid(M, gst(3, 3, () => ''), 'matrix'), grid(upTo(1, 0), gst(4, 4, (r, c) => (r === 0 || c === 0 ? 'muted' : '')), 'P')] },
          { say: 1, note: `P[2][2] = 3 + P[1][2] (${P2[1][2]}) + P[2][1] (${P2[2][1]}) − P[1][1] (${P2[1][1]}) = ${P2[2][2]}.`, panels: [grid(M, cellsSt(3, 3, { '1,1': 'active' }), 'matrix'), grid(upTo(2, 2), cellsSt(4, 4, { '2,2': 'active', '1,2': 'window', '2,1': 'window', '1,1': 'bad' }), 'P')] },
          { say: 1, note: `Every cell the same way, O(m·n) once. P[3][3] = ${P2[3][3]}: the whole matrix.`, panels: [grid(M, gst(3, 3, () => 'done'), 'matrix'), qGrid({ '3,3': 'active' }, 'P')] },
        ],
      },
      {
        kind: 'watch',
        title: 'Four lookups per query',
        lines: ['`sumRegion = P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]`.', 'Clues: **"sum of the submatrix"**, **"row1, col1, row2, col2"**, **"matrix" + "many queries"**.'],
        frames: [
          { say: 0, note: `Rows 1..2, cols 1..2. Start from P[3][3] = ${P2[3][3]}: everything up to the bottom-right corner.`, panels: [grid(M, cellsSt(3, 3, inRect(1, 1, 2, 2, 'window')), 'matrix'), qGrid({ '3,3': 'active' }, 'P')] },
          { say: 0, note: `Subtract the strip above (P[1][3] = ${P2[1][3]}) and the strip to the left (P[3][1] = ${P2[3][1]}).`, panels: [grid(M, cellsSt(3, 3, { ...inRect(0, 0, 0, 2, 'bad'), ...inRect(1, 0, 2, 0, 'bad'), ...inRect(1, 1, 2, 2, 'window') }), 'matrix'), qGrid({ '3,3': 'active', '1,3': 'bad', '3,1': 'bad' }, 'P')] },
          { say: 0, note: `Cell (0, 0) was in both strips, so add P[1][1] = ${P2[1][1]} back: ${P2[3][3]} − ${P2[1][3]} − ${P2[3][1]} + ${P2[1][1]} = ${qSum}.`, panels: [grid(M, cellsSt(3, 3, { '0,0': 'done', ...inRect(1, 1, 2, 2, 'window') }), 'matrix'), qGrid({ '3,3': 'active', '1,3': 'bad', '3,1': 'bad', '1,1': 'done' }, 'P'), vars({ sum: qSum })] },
          { say: 1, note: 'Build O(m·n) once, then every rectangle is O(1).', panels: [vars({ build: 'O(m·n)', 'each query': '4 lookups' })] },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: finish P[3][2]',
        lines: ['Building the cell for M[2][1] = 1.', `So far: 1 + P[2][2] (${P2[2][2]}) + P[3][1] (${P2[3][1]}).`],
        panels: [grid(M, cellsSt(3, 3, { '2,1': 'active' }), 'matrix'), grid(upTo(3, 1), cellsSt(4, 4, { '2,2': 'window', '3,1': 'window', '2,1': 'muted' }), 'P')],
        task: {
          type: 'choose',
          question: 'What finishes P[3][2]?',
          options: [
            { text: 'Nothing: 1 + 6 + 7 = 14', why: 'The block above-left (P[2][1]) is inside both P[2][2] and P[3][1], so it was counted twice.' },
            { text: `− P[2][1] (${P2[2][1]}) → ${P2[3][2]}` },
            { text: `− P[2][2] (${P2[2][2]}) → 8`, why: 'P[2][2] is the needed block above; only the overlap of the two blocks is extra.' },
            { text: `+ P[2][1] (${P2[2][1]}) → 17`, why: 'The overlap is already in twice; adding it makes three times.' },
          ],
          answer: 1,
        },
        solved: 'Inclusion–exclusion: two overlapping blocks count their overlap twice, so subtract it once.',
      },
    ],
  },

  {
    id: 'prefix-sum-hashmap',
    title: 'Count subarrays that sum to k, negatives and all',
    steps: [
      {
        kind: 'watch',
        title: 'Pairs are slow, windows break',
        lines: ['Count the subarrays whose sum is **exactly k**. Numbers may be negative.', 'Trying every (i, j) is **O(n²)**; a sliding window needs a monotonic sum.'],
        frames: [
          { say: 0, note: 'e.g. nums = [2, −1, 1, 2, −2], k = 2.', panels: [arr(H, { label: 'nums, k = 2' })] },
          { say: 1, note: 'Adding −1 makes the sum smaller. A window cannot tell whether to grow or shrink.', panels: [arr(H, { label: 'window?', range: [0, 1], highlights: win(5, 0, 1, { 1: 'bad' }) }), vars({ 'sum [0..0]': 2, 'sum [0..1]': 1 })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Two Sum over prefix sums',
        lines: ['A subarray ending at j sums to k when **prefix[j] − prefix[i] = k**, so look up `prefix − k`.', 'Scan once: look up first, then record the current prefix in `seen` (value → how many times).'],
        frames: [
          { say: 0, note: 'seen starts as {0: 1}: the empty prefix, so subarrays starting at index 0 count.', panels: [arr(H, { label: 'nums, k = 2' }), mapT(new Map([[0, 1]]), 'seen', 'times')] },
          ...hashRun.slice(0, 4).map(hashFrame),
        ],
      },
      {
        kind: 'watch',
        title: 'When to reach for it',
        lines: ['Clues: **"number of subarrays whose sum equals k"**, **"negative numbers allowed"**, **"equal number of 0s and 1s"**, **"longest subarray with sum k"**.'],
        frames: [{ say: 0, note: 'Store counts to count; store the earliest index to find the longest.', panels: [vars({ count: 'seen: prefix → times', longest: 'first: prefix → earliest index' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: the last element',
        lines: [`Last element −2: prefix = ${HT.prefix}, so look for ${HT.prefix} − 2 = ${HT.look}.`, 'This is the map before recording the new prefix.'],
        panels: [arr(H, { label: 'nums, k = 2', pointers: [ptr(4, 'j')], highlights: hl(5, (i) => (i === 4 ? 'active' : 'done')) }), vars({ prefix: HT.prefix, 'look for': HT.look, count: HT.count - HT.found }), mapT(HT.before, 'seen', 'times')],
        task: {
          type: 'choose',
          question: 'How much does count go up?',
          options: [
            { text: `By ${HT.before.get(HT.prefix)}: seen has ${HT.prefix} twice`, why: `That looks up prefix itself, which finds subarrays with sum 0, not 2.` },
            { text: `By ${HT.found}: seen[0] is the empty prefix, so the whole array [0..4] sums to 2` },
            { text: 'By 0: no earlier element gives 2', why: 'The {0: 1} entry stands for "start at index 0"; 2 − 1 + 1 + 2 − 2 = 2.' },
            { text: `Look up ${HT.prefix + HK} = prefix + k instead`, why: '4 is prefix + k: the wrong direction. The start prefix must be prefix − k.' },
          ],
          answer: 1,
        },
        solved: `Look up **prefix − k** and add how many times it was seen; the {0: 1} entry counts subarrays that start at 0. Total ${HT.count}.`,
      },
    ],
  },

  {
    id: 'prefix-sum-modulo',
    title: 'Sums divisible by k: match the remainders',
    steps: [
      {
        kind: 'watch',
        title: 'Divisible, not equal',
        lines: ['Count subarrays whose sum is **divisible by k**.', '`prefix[j] − prefix[i] ≡ 0 (mod k)` exactly when **prefix[j] ≡ prefix[i] (mod k)**.'],
        frames: [
          { say: 0, note: 'e.g. nums = [1, 2, 4, −9], k = 3.', panels: [arr(D, { label: 'nums, k = 3' })] },
          { say: 1, note: 'Running sums 1 and 7 both leave remainder 1, so 7 − 1 = 6 is divisible: nums[1..2] = 2 + 4.', panels: [arr(D, { label: 'nums, k = 3', range: [1, 2], highlights: win(4, 1, 2) }), vars({ 'prefix 1': '1 → rem 1', 'prefix 3': '7 → rem 1' })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Count remainders, not sums',
        lines: ['`count[0] = 1`: the empty prefix has remainder 0.', 'Each step: take the remainder, add `count[rem]` to the total, then `count[rem]++`. An array of size k is enough.'],
        frames: [{ say: 0, note: 'count = [1, 0, 0] before the scan.', panels: [arr(D, { label: 'nums, k = 3' }), arr([1, 0, 0], { label: 'count[remainder]', highlights: { 0: 'active' } })] }, ...modRun.slice(0, 3).map(modFrame)],
      },
      {
        kind: 'watch',
        title: 'Hear it',
        lines: ['Clues: **"divisible by k"**, **"multiple of k"**, **"sum % k === 0"**, **"remainder"**.', 'An exact sum instead of a remainder → plain prefix + hash map.'],
        frames: [{ say: 0, note: 'The question is about a remainder, so equal remainders are the matches.', panels: [vars({ key: 'prefix mod k', matches: 'equal keys' })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: a negative running sum',
        lines: [`−9 arrives: the running sum is ${MT.sum}.`, `In JavaScript, \`${MT.sum} % 3\` is \`${MT.sum % 3}\`.`],
        panels: [arr(D, { label: 'nums, k = 3', pointers: [ptr(3, 'j')], highlights: { 0: 'done', 1: 'done', 2: 'done', 3: 'active' } }), arr(MT.before, { label: 'count[remainder]' }), vars({ 'running sum': MT.sum, total: MT.total - MT.found })],
        task: {
          type: 'choose',
          question: 'Which slot of count is read?',
          options: [
            { text: `count[${MT.sum % 3}], the raw %`, why: `There is no slot ${MT.sum % 3}: the ${MT.found} matching prefixes would be missed. Equal residues must get equal keys.` },
            { text: `count[${MT.rem}], from ((${MT.sum} % 3) + 3) % 3 → total + ${MT.found}` },
            { text: 'count[2], since |−2| = 2', why: '−2 = −3 + 1, so its remainder is 1; dropping the sign changes the residue.' },
            { text: 'count[0], negatives never divide', why: 'Negative sums can be multiples of k too: −9 is one.' },
          ],
          answer: 1,
        },
        solved: `Normalise with **((x % k) + k) % k** so −2 and 1 share a key; the total becomes ${MT.total}.`,
      },
    ],
  },

  {
    id: 'difference-array',
    title: 'Many range adds, one pass at the end',
    steps: [
      {
        kind: 'watch',
        title: 'Writing every cell, every time',
        lines: ['Apply many **"add v to every index from l to r"** updates, then read the array once.', 'Updating each cell directly costs **O(u · length)**.'],
        frames: [
          { say: 0, note: 'e.g. n = 5 and updates [0, 1, +2], [1, 3, +4], [2, 4, +1].', panels: [arr([0, 0, 0, 0, 0], { label: 'a' }), table(['1', '2', '3'], ['l', 'r', 'v'], UPD.map((u) => u.map(String)), 'updates')] },
          { say: 1, note: 'Directly, [1, 3, +4] alone writes 3 cells. Long ranges and many updates multiply.', panels: [arr([2, 6, 4, 4, 0], { label: 'a after two updates', range: [1, 3], highlights: win(5, 1, 3, { 1: 'visited', 2: 'visited', 3: 'visited' }) })] },
        ],
      },
      {
        kind: 'watch',
        title: 'Mark only where it starts and stops',
        lines: ['`diff[l] += v` starts the add; `diff[r + 1] −= v` stops it. One extra slot for r + 1 = n.'],
        frames: markFrames,
      },
      {
        kind: 'watch',
        title: 'One prefix sum turns marks into values',
        lines: ['After all updates, `running += diff[i]` gives `result[i]`.', 'Clues: **"bookings"**, **"passengers get on at from and off at to"**, **"after all updates"**, **"capacity at any moment"**.'],
        frames: [...runFrames, { say: 1, note: 'O(1) per update plus one O(n) pass, instead of touching every cell of every range.', panels: [arr(prefixOf(diff).slice(1, 6), { label: 'result', highlights: hl(5, () => 'done') })] }],
      },
      {
        kind: 'turn',
        title: 'Your turn: getting off at the stop',
        lines: ['Passengers ride from stop **1** and get off **at** stop **3**: the range is [1, 3), half-open.', 'They are not on board at stop 3.'],
        panels: [arr([0, 0, 0, 0, 0, 0], { label: 'diff', highlights: { 1: 'active' } }), vars({ from: 1, to: 3, v: '+4' })],
        task: {
          type: 'choose',
          question: 'diff[1] += 4. Where does the −4 go?',
          options: [
            { text: 'diff[4], at to + 1', why: 'That is the closed range [1, 3]: it would keep them on board at stop 3.' },
            { text: 'diff[3], at to' },
            { text: 'diff[2], at to − 1', why: 'That drops them at stop 2, one stop early.' },
            { text: 'Nowhere: the prefix sum handles it', why: 'Without the stop mark the +4 runs to the end of the array.' },
          ],
          answer: 1,
        },
        solved: 'The minus mark goes on the first index that is **no longer** in the range: r + 1 for [l, r], `to` for [from, to).',
      },
    ],
  },
];
