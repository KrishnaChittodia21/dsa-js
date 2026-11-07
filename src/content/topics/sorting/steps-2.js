// Step lessons for Sorting, second half (counting, comparators, preprocessing, dry run, mistakes, tips).
// Format: src/content/stepSchema.js. Facts come only from topic.js; every frame is computed by running the code below.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const dots = (n) => Array(n).fill('·');
// a turn has its own short `lines`, so frames reused in its `then` drop their `say`
const unsay = (frames) => frames.map(({ say, ...f }) => f);

// ---------- intuition-counting: plain counting sort on the lesson's [3, 1, 3, 0, 2] ----------
const CN = [3, 1, 3, 0, 2];
const CK = 3;
const countFrames = [];
{
  const count = new Array(CK + 1).fill(0);
  countFrames.push({ say: 0, note: 'k = 3, so 4 boxes, all 0.', panels: [arr(CN, { label: 'nums' }), arr(count.slice(), { label: 'count (index = value)' })] });
  CN.forEach((x, i) => {
    count[x]++;
    countFrames.push({
      say: 1,
      note: `x = ${x}: count[${x}] becomes ${count[x]}.`,
      panels: [arr(CN, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(CN.length, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(count.slice(), { label: 'count (index = value)', highlights: { [x]: 'active' } })],
    });
  });
  const out = [];
  for (let v = 0; v <= CK; v++) {
    for (let c = 0; c < count[v]; c++) out.push(v);
    countFrames.push({
      say: 2,
      note: `Box ${v} holds ${count[v]}: write ${v} ${count[v] === 1 ? 'once' : `${count[v]} times`}.`,
      panels: [arr(count.slice(), { label: 'count (index = value)', pointers: [ptr(v, 'v')], highlights: hl(CK + 1, (k) => (k === v ? 'active' : k < v ? 'done' : '')) }), arr([...out, ...dots(CN.length - out.length)], { label: 'out', highlights: hl(out.length, () => 'done') })],
    });
  }
  countFrames.push({ say: 3, note: 'Sorted: [0, 1, 2, 3, 3]. One pass over nums, one over the boxes.', panels: [arr(out, { label: 'out', highlights: hl(out.length, () => 'done') }), vars({ n: 5, 'k + 1': 4, compares: 0 })] });
}
const CT_COUNT = [0, 2, 1, 0, 3];
const CT_OUT = CT_COUNT.flatMap((c, v) => Array(c).fill(v)); // [1, 1, 2, 4, 4, 4]

// ---------- bucket sort: 5 values in 0–99, 5 buckets of width 20 ----------
const BK = [42, 15, 88, 7, 63];
const BLAB = ['0–19', '20–39', '40–59', '60–79', '80–99'];
const bucketFrames = [];
{
  const b = BLAB.map(() => []);
  const show = (on, st = 'active') => table(BLAB, ['bucket'], b.map((x) => [x.length ? x.join(', ') : '—']), BLAB.map((_, r) => [r === on ? st : '']), 'buckets');
  bucketFrames.push({ say: 0, note: '5 values, so 5 buckets of width 20.', panels: [arr(BK, { label: 'nums' }), show(-1)] });
  BK.forEach((x, i) => {
    const r = Math.floor(x / 20);
    b[r].push(x);
    bucketFrames.push({ say: 1, note: `${x} goes to bucket ${BLAB[r]}.`, panels: [arr(BK, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(5, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), show(r)] });
  });
  bucketFrames.push({ say: 2, note: 'Bucket 0–19 holds 15, 7: sort it. The others hold one value or none.', panels: [show(0, 'bad')] });
  b.forEach((x) => x.sort((p, q) => p - q));
  bucketFrames.push({ say: 2, note: 'Bucket 0–19 is now 7, 15.', panels: [show(0, 'done')] });
  const out = b.flat();
  bucketFrames.push({ say: 3, note: 'Concatenate the buckets in order: sorted.', panels: [show(-1), arr(out, { label: 'out', highlights: hl(5, () => 'done') })] });
}

// ---------- radix sort (LSD) on [53, 19, 41, 17, 50] ----------
const RX = [53, 19, 41, 17, 50];
const digit = (x, p) => Math.floor(x / p) % 10;
const radixFrames = [{ say: 0, note: 'Start. Pass 1 looks only at the ones digit.', panels: [arr(RX, { label: 'nums' })] }];
{
  let cur = RX.slice();
  [1, 10].forEach((p, pass) => {
    const groups = new Map();
    for (const x of cur) {
      const d = digit(x, p);
      groups.set(d, [...(groups.get(d) ?? []), x]);
    }
    const keys = [...groups.keys()].sort((a, b) => a - b);
    const name = p === 1 ? 'ones' : 'tens';
    radixFrames.push({
      say: pass,
      note: `Pass ${pass + 1}: drop each value in the box of its ${name} digit, scanning left to right.`,
      panels: [arr(cur, { label: 'before this pass' }), table(keys.map((d) => `${name} ${d}`), ['box'], keys.map((d) => [groups.get(d).join(', ')]), keys.map((d) => [groups.get(d).length > 1 ? 'active' : '']))],
    });
    cur = keys.flatMap((d) => groups.get(d));
    radixFrames.push({
      say: pass === 0 ? 0 : 2,
      note: pass === 0 ? 'Read the boxes in order: sorted by the ones digit.' : '17 and 19 tie on tens digit 1. Pass 1 put 17 first, and the stable pass keeps it there.',
      panels: [arr(cur.slice(), { label: `after the ${name} pass`, highlights: hl(5, () => (pass === 1 ? 'done' : '')) })],
    });
  });
  radixFrames.push({ say: 3, note: '2 digits → 2 passes, each O(n + 10).', panels: [arr(cur, { label: 'sorted', highlights: hl(5, () => 'done') }), vars({ d: 2, base: 10, n: 5 })] });
}

// ---------- optimized-counting: stable placement of records by key ----------
const REC = [['Al', 2], ['Bo', 0], ['Cy', 2], ['Di', 1], ['Ed', 0]];
const recName = ([n, k]) => `${n}:${k}`;
const REC_TURN = 2; // Cy
const recRun = [];
{
  const count = [0, 0, 0];
  for (const [, k] of REC) count[k]++;
  const start = [0];
  for (let v = 1; v < 3; v++) start[v] = start[v - 1] + count[v - 1];
  const next = start.slice();
  const out = dots(5);
  REC.forEach((r, i) => {
    const at = next[r[1]]++;
    out[at] = recName(r);
    recRun.push({ i, at, key: r[1], out: out.slice(), next: next.slice(), before: at });
  });
  recRun.count = count;
  recRun.start = start;
}
const recTable = (nextCol, on, label = 'by key') =>
  table(['key 0', 'key 1', 'key 2'], nextCol ? ['count', 'next'] : ['count'], [0, 1, 2].map((k) => (nextCol ? [recRun.count[k], nextCol[k]] : [recRun.count[k]])), [0, 1, 2].map((k) => (k === on ? (nextCol ? ['', 'active'] : ['active']) : nextCol ? ['', ''] : [''])), label);
const recPlaceFrame = (s) => ({
  say: 2,
  note: `${recName(REC[s.i])}: next[${s.key}] = ${s.at}, so it goes to out[${s.at}]; next[${s.key}] becomes ${s.next[s.key]}.`,
  panels: [
    arr(REC.map(recName), { label: 'records', pointers: [ptr(s.i, 'r')], highlights: hl(5, (k) => (k === s.i ? 'active' : k < s.i ? 'done' : '')) }),
    recTable(s.next, s.key),
    arr(s.out, { label: 'out', highlights: { [s.at]: 'active' } }),
  ],
});
const recCountFrames = (() => {
  const c = [0, 0, 0];
  return REC.map((r, i) => {
    c[r[1]]++;
    return {
      say: 0,
      note: `${recName(r)}: count[${r[1]}]++.`,
      panels: [arr(REC.map(recName), { label: 'records', pointers: [ptr(i, 'r')], highlights: hl(5, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), table(['key 0', 'key 1', 'key 2'], ['count'], c.map((v) => [v]), [0, 1, 2].map((k) => [k === r[1] ? 'active' : '']))],
    };
  });
})();
const beforeTurn = recRun[REC_TURN - 1];

// ---------- template-counting: countingSortBy(words, w => w.length, 3) ----------
const TW = ['ox', 'a', 'cat', 'be', 'i'];
const TMAX = 3;
const tcTally = [];
const tcPlace = [];
let TC_PREFIX;
{
  const count = new Array(TMAX + 2).fill(0);
  tcTally.push({ say: 0, note: 'maxKey = 3, so count has 3 + 2 = 5 cells.', panels: [arr(TW, { label: 'items (key = length)' }), arr(count.slice(), { label: 'count' })] });
  TW.forEach((w, i) => {
    count[w.length + 1]++;
    tcTally.push({
      say: 0,
      note: `"${w}" has key ${w.length}: count[${w.length + 1}]++.`,
      panels: [arr(TW, { label: 'items (key = length)', pointers: [ptr(i, 'it')], highlights: hl(5, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), arr(count.slice(), { label: 'count', highlights: { [w.length + 1]: 'active' } })],
    });
  });
  for (let v = 1; v < count.length; v++) count[v] += count[v - 1];
  TC_PREFIX = count.slice();
  const out = dots(TW.length);
  tcPlace.push({ say: 1, note: `Prefix sum done: count = [${count.join(', ')}].`, panels: [arr(count.slice(), { label: 'count[v] = # keys < v' }), arr(out.slice(), { label: 'out' })] });
  TW.forEach((w, i) => {
    const k = w.length;
    const at = count[k]++;
    out[at] = w;
    tcPlace.push({
      say: 2,
      note: `"${w}" (key ${k}) goes to out[${at}]; count[${k}] becomes ${count[k]}.`,
      panels: [
        arr(TW, { label: 'items', pointers: [ptr(i, 'it')], highlights: hl(5, (j) => (j === i ? 'active' : j < i ? 'done' : '')) }),
        arr(count.slice(), { label: 'count', highlights: { [k]: 'active' } }),
        arr(out.slice(), { label: 'out', highlights: { [at]: 'active' } }),
      ],
    });
  });
  tcPlace.push({ say: 2, note: `out = [${out.join(', ')}]. "a" stays before "i" and "ox" before "be": input order.`, panels: [arr(out, { label: 'out', highlights: hl(5, () => 'done') })] });
}

// ---------- implementation-counting: maximumGap([1, 9, 3, 14, 6]) ----------
const MG = [1, 9, 3, 14, 6];
const mg = (() => {
  const n = MG.length;
  const lo = Math.min(...MG), hi = Math.max(...MG);
  const width = Math.max(1, Math.floor((hi - lo) / (n - 1)));
  const count = Math.floor((hi - lo) / width) + 1;
  const bMin = new Array(count).fill(Infinity);
  const bMax = new Array(count).fill(-Infinity);
  const drops = [];
  for (const x of MG) {
    const b = Math.floor((x - lo) / width);
    bMin[b] = Math.min(bMin[b], x);
    bMax[b] = Math.max(bMax[b], x);
    drops.push({ x, b, bMin: bMin.slice(), bMax: bMax.slice() });
  }
  let best = 0, prevMax = lo;
  const scan = [];
  for (let b = 0; b < count; b++) {
    if (bMin[b] === Infinity) { scan.push({ b, empty: true, best, prevMax }); continue; }
    const gap = bMin[b] - prevMax;
    best = Math.max(best, gap);
    scan.push({ b, gap, best, prevMaxBefore: prevMax, prevMax: bMax[b] });
    prevMax = bMax[b];
  }
  return { n, lo, hi, width, count, bMin, bMax, drops, scan, best };
})();
const inf = (v) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : v);
const mgTable = (bMin, bMax, on, st = 'active') =>
  table(Array.from({ length: mg.count }, (_, b) => `b${b}`), ['min', 'max'], bMin.map((v, b) => [inf(v), inf(bMax[b])]), bMin.map((_, b) => (b === on ? [st, st] : ['', ''])), 'buckets');
const MG_TURN_B = mg.scan.length - 1; // last bucket

// ---------- intuition-comparator ----------
const DEF = [10, 9, 1];

// ---------- optimized-comparator: people by score desc, then name asc ----------
const PEOPLE = [['Cy', 90], ['Al', 85], ['Bo', 90], ['Di', 85]];
const byScoreName = (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]);
const PEOPLE_SORTED = PEOPLE.slice().sort(byScoreName);
const peopleT = (list, on = [], st = 'active', label = 'people') => table(list.map((p) => p[0]), ['score'], list.map((p) => [p[1]]), list.map((p) => [on.includes(p[0]) ? st : '']), label);
const ORDER = ['c', 'b', 'a'];
const RANK = new Map(ORDER.map((v, i) => [v, i]));
const RITEMS = ['a', 'c', 'b', 'c'];
const RSORTED = RITEMS.slice().sort((a, b) => RANK.get(a) - RANK.get(b));

// ---------- template-comparator ----------
const WORDS = ['pear', 'fig', 'kiwi', 'apple'];
const WSORTED = WORDS.slice().sort((a, b) => a.length - b.length || a.localeCompare(b));
const NAMES = ['Ann', 'Bo', 'Cy'];
const HEIGHTS = [160, 180, 170];
const IDX_SORTED = NAMES.map((_, i) => i).sort((i, j) => HEIGHTS[j] - HEIGHTS[i]);

// ---------- implementation-comparator: largestNumber ----------
const lnCmp = (a, b) => {
  const ab = a + b, ba = b + a;
  return ab > ba ? -1 : ab < ba ? 1 : 0;
};
const LN = [3, 30, 34, 5];
const LNS = LN.map(String).sort(lnCmp);
const pairFrame = (a, b, say) => {
  const r = lnCmp(a, b);
  const first = r < 0 ? a : b;
  return { say, note: `"${a}" + "${b}" = "${a + b}", "${b}" + "${a}" = "${b + a}". Bigger: "${r < 0 ? a + b : b + a}", so ${first} goes first.`, panels: [arr([a, b], { label: 'pair (a, b)', highlights: { [r < 0 ? 0 : 1]: 'done' } }), vars({ 'a + b': a + b, 'b + a': b + a, returns: r })] };
};
const LN2 = [12, 121, 2];
const LN2S = LN2.map(String).sort(lnCmp);

// ---------- intuition-preprocess ----------
const DP = [8, 1, 4, 2];
const DPS = DP.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
const HI = [3, 0, 6, 1, 5];
const HIS = HI.slice().sort((a, b) => b - a);
const hRun = HIS.map((c, i) => ({ i, c, ok: c >= i + 1 }));
const H_ANS = Math.max(0, ...hRun.filter((r) => r.ok).map((r) => r.i + 1));
const HT = [10, 8, 5, 4, 3];
const HT_ANS = Math.max(0, ...HT.map((c, i) => (c >= i + 1 ? i + 1 : 0)));

// ---------- optimized-preprocess: Car Fleet, target 12 ----------
const CF = { target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] };
const fleetRun = (target, position, speed) => {
  const cars = position.map((p, i) => [p, (target - p) / speed[i]]);
  cars.sort((a, b) => b[0] - a[0]);
  let fleets = 0, lead = 0;
  const steps = cars.map(([p, time], i) => {
    const before = lead;
    const fresh = time > lead;
    if (fresh) { fleets++; lead = time; }
    return { i, p, time, before, fresh, fleets, lead };
  });
  return { cars, steps, fleets };
};
const cf = fleetRun(CF.target, CF.position, CF.speed);
const cfPanels = (s, upto, run = cf) => [
  arr(run.cars.map((c) => c[0]), { label: 'position (sorted desc)', pointers: s ? [ptr(s.i, 'car')] : [], highlights: hl(run.cars.length, (k) => (s && k === s.i ? (s.fresh ? 'active' : 'visited') : k < upto ? 'done' : '')) }),
  arr(run.cars.map((c) => c[1]), { label: 'time alone' }),
  vars(s ? { lead: s.lead, fleets: s.fleets } : { lead: 0, fleets: 0 }),
];
const cfFrame = (s) => ({
  say: 2,
  note: s.fresh ? `Car at ${s.p}: time ${s.time} > lead ${s.before} → it cannot catch up: new fleet (#${s.fleets}), lead = ${s.time}.` : `Car at ${s.p}: time ${s.time} ≤ lead ${s.before} → it catches up and joins that fleet.`,
  panels: cfPanels(s, s.i),
});
const CF_TURN = 3;

// ---------- template-preprocess: canPairDoubles([2, -4, 1, -2, 4, 2]) ----------
const PD = [2, -4, 1, -2, 4, 2];
const pdRun = (() => {
  const count = new Map();
  for (const x of PD) count.set(x, (count.get(x) ?? 0) + 1);
  const start = new Map(count);
  const keys = [...count.keys()].sort((a, b) => Math.abs(a) - Math.abs(b));
  const steps = [];
  let result = true;
  for (const x of keys) {
    const c = count.get(x);
    if (c === 0) { steps.push({ x, c, skip: true, after: new Map(count) }); continue; }
    const need = count.get(2 * x) ?? 0;
    if (need < c) { result = false; steps.push({ x, c, need, fail: true, after: new Map(count) }); break; }
    count.set(2 * x, need - c);
    steps.push({ x, c, need, after: new Map(count) });
  }
  return { start, keys, steps, result };
})();
const countT = (m, on, st = 'active') => table([...m.keys()].map(String), ['count'], [...m.values()].map((v) => [v]), [...m.keys()].map((k) => (on !== undefined && (k === on || k === 2 * on) ? [st] : [''])), 'count');
const pdKeys = (at, doneUpTo) => arr(pdRun.keys, { label: 'keys by |x|', pointers: at >= 0 ? [ptr(at, 'x')] : [], highlights: hl(pdRun.keys.length, (k) => (k === at ? 'active' : k < doneUpTo ? 'done' : '')) });
const PD_TURN = pdRun.steps.findIndex((s) => s.skip);

// ---------- implementation-preprocess: target 10 ----------
const CF2 = { target: 10, position: [0, 4, 2], speed: [1, 2, 4] };
const cf2 = fleetRun(CF2.target, CF2.position, CF2.speed);

// ---------- dry run: final merge of countInversions([2, 4, 1, 3, 5]) ----------
const DL = [2, 4];
const DRR = [1, 3, 5];
const drRows = [];
{
  let i = 0, j = 0, total = 0;
  const merged = [];
  while (i < DL.length || j < DRR.length) {
    const row = { i, j };
    if (i < DL.length && j < DRR.length) {
      row.cmp = `${DL[i]} vs ${DRR[j]}`;
      if (DL[i] <= DRR[j]) { row.take = DL[i]; row.side = 'left'; row.added = 0; i++; }
      else { row.take = DRR[j]; row.side = 'right'; row.added = DL.length - i; row.pairs = DL.slice(i).map((x) => `(${x},${DRR[j]})`); j++; }
    } else if (j < DRR.length) { row.cmp = 'left empty'; row.take = DRR[j]; row.side = 'right'; row.added = 0; j++; }
    else { row.cmp = 'right empty'; row.take = DL[i]; row.side = 'left'; row.added = 0; i++; }
    total += row.added;
    merged.push(row.take);
    row.total = total;
    row.merged = merged.slice();
    drRows.push(row);
  }
}
const drFrame = (r, say) => ({
  say,
  note: r.cmp === 'left empty' ? `i = 2: left is empty. Take ${r.take}; nothing added. total = ${r.total}.` : r.side === 'right' ? `${r.cmp}: take ${r.take} (right). mid − i = ${r.added} left items are bigger: ${r.pairs.join(', ')}. total = ${r.total}.` : `${r.cmp}: take ${r.take} (left). Adds 0. total = ${r.total}.`,
  panels: [
    arr(DL, { label: 'left (sorted)', pointers: r.i < DL.length ? [ptr(r.i, 'i')] : [], highlights: hl(DL.length, (k) => (k < r.i ? 'muted' : r.side === 'right' && r.added ? 'bad' : k === r.i ? 'active' : '')) }),
    arr(DRR, { label: 'right (sorted)', pointers: [ptr(r.j, 'j', 'b')], highlights: hl(DRR.length, (k) => (k < r.j ? 'muted' : k === r.j ? 'active' : '')) }),
    arr([...r.merged, ...dots(5 - r.merged.length)], { label: 'merged', highlights: hl(r.merged.length, (k) => (k === r.merged.length - 1 ? 'done' : 'visited')) }),
  ],
});
const DR_TURN = drRows.findIndex((r) => r.cmp === '4 vs 3');

// ---------- mistakes ----------
const NEG = [-3, 1, 0, -1];
const NMIN = Math.min(...NEG);
const NCOUNT = new Array(Math.max(...NEG) - NMIN + 1).fill(0);
for (const x of NEG) NCOUNT[x - NMIN]++;
const SCORES = [70, 95, 80];

export default {
  'intuition-counting': [
    {
      kind: 'watch',
      title: 'Boxes instead of comparisons',
      lines: [
        'Every value is an integer between 0 and k: make **k + 1 boxes**.',
        'Drop each value in the box with its number: `count[x]++`.',
        'Walk the boxes from 0 to k and write each value out `count[v]` times.',
        'Counting sort: **O(n + k)** time, O(k) space.',
      ],
      frames: countFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: where does the first 4 go?',
      lines: ['These boxes are already counted (values 0 to 4).', 'Walking them from 0 fills `out` from the left.'],
      panels: [arr(CT_COUNT, { label: 'count (index = value)' }), arr(dots(CT_OUT.length), { label: 'out' })],
      task: { type: 'cell', panel: 1, question: 'Tap the cell of `out` where the first 4 is written.', answer: 3, hints: { 5: 'That is where the last 4 goes. Count what comes before the first one.', 4: 'Before the 4s come two 1s and one 2: three cells.', 2: 'Box 1 holds 2 and box 2 holds 1: three values come first.' } },
      solved: 'Two 1s and one 2 come first, so the first 4 lands at index **3**.',
      then: [{ say: 1, note: `Boxes 1, 2, 4 written out: [${CT_OUT.join(', ')}].`, panels: [arr(CT_COUNT, { label: 'count (index = value)', highlights: { 1: 'done', 2: 'done', 4: 'done' } }), arr(CT_OUT, { label: 'out', highlights: { 3: 'active', 4: 'done', 5: 'done' } })] }],
    },
    {
      kind: 'watch',
      title: 'Bucket sort: big range, few values',
      lines: [
        'Values spread over a big range (here 0–99)? Split the range into **n equal-width buckets**.',
        'Drop each value into its bucket.',
        'Sort each (tiny) bucket, then concatenate the buckets.',
        '**O(n)** on average for evenly spread data.',
      ],
      frames: bucketFrames,
    },
    {
      kind: 'watch',
      title: 'Radix sort: one digit per pass',
      lines: [
        'Radix sort: a stable counting sort by the **last digit** (10 boxes)…',
        '…then by the next digit, and so on.',
        'Each pass is **stable**, so the order from earlier digits survives as a tie-break.',
        'd digits → **O(d · (n + base))**.',
      ],
      frames: radixFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: pigeonholes',
      lines: ['**Pigeonhole principle**: more items than boxes → some box holds two.', 'Now turn it around: fewer items than boxes.'],
      panels: [arr(dots(7), { label: '7 buckets' }), vars({ values: 6, buckets: 7 })],
      task: {
        type: 'choose',
        question: '6 values go into 7 buckets. What is guaranteed?',
        options: [
          { text: 'At least one bucket is empty', why: '' },
          { text: 'Some bucket holds two values', why: 'That is guaranteed only with more items than boxes. Here 6 values could sit in 6 different buckets.' },
          { text: 'Every bucket holds at most one value', why: 'Nothing stops two values from sharing a bucket; then even more buckets stay empty.' },
        ],
        answer: 0,
      },
      solved: 'n values, n + 1 buckets → at least one bucket is **empty**. Maximum Gap builds on this kind of argument.',
      then: [{ say: 1, note: 'One possible drop: bucket 2 stays empty. Any drop leaves at least one empty.', panels: [arr([1, 1, 0, 1, 1, 1, 1], { label: 'values per bucket', highlights: { 2: 'bad' } })] }],
    },
  ],

  'optimized-counting': [
    {
      kind: 'watch',
      title: 'Records: count, prefix, place',
      lines: [
        'Step 1: `count[key]++` for every record.',
        'Step 2: prefix sum. `start[v]` = number of records with key < v = where the first record with key v goes.',
        'Step 3: scan records left to right; place each at `start[key]++`.',
      ],
      frames: [
        ...recCountFrames,
        { say: 1, note: `start = [${recRun.start.join(', ')}]: key 0 starts at 0, key 1 after the two 0s, key 2 after one more.`, panels: [recTable(recRun.start, -1, 'count → start'), arr(dots(5), { label: 'out' })] },
        ...recRun.slice(0, REC_TURN).map(recPlaceFrame),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: place Cy',
      lines: ['Al:2 and Bo:0 are placed. `next` holds the next free slot per key.', 'Cy:2 is next in the scan.'],
      panels: [
        arr(REC.map(recName), { label: 'records', pointers: [ptr(REC_TURN, 'r')], highlights: hl(5, (k) => (k === REC_TURN ? 'active' : k < REC_TURN ? 'done' : '')) }),
        recTable(beforeTurn.next, 2),
        arr(beforeTurn.out, { label: 'out' }),
      ],
      task: { type: 'cell', panel: 2, question: 'Tap the cell of `out` where Cy:2 goes.', answer: recRun[REC_TURN].at, hints: { 3: 'Al:2 already sits there, and next[2] moved on.', 2: 'That slot belongs to key 1. Cy has key 2.' } },
      solved: `next[2] is ${recRun[REC_TURN].at}: Cy goes right after Al, the earlier key-2 record.`,
      then: unsay(recRun.slice(REC_TURN).map(recPlaceFrame)),
    },
    {
      kind: 'turn',
      title: 'Your turn: equal keys',
      lines: ['Same three steps on new records.', 'Left-to-right placement keeps equal keys in **input order**.'],
      panels: [arr(['Zo:1', 'Ya:0', 'Xi:1', 'Wu:0'], { label: 'records' })],
      task: { type: 'order', question: 'Tap the records in the order this counting sort outputs them.', items: ['Ya:0', 'Wu:0', 'Zo:1', 'Xi:1'], hint: 'Key 0 first, then key 1. Inside one key, keep the input order.' },
      solved: 'Ya before Wu and Zo before Xi, exactly as in the input: the sort is **stable**.',
      then: [{ say: 1, note: 'Output: key 0 records in input order, then key 1 records in input order.', panels: [arr(['Ya:0', 'Wu:0', 'Zo:1', 'Xi:1'], { label: 'out', highlights: hl(4, () => 'done') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: the capping trick',
      lines: ['H-Index: h can never exceed n, the number of papers.', 'So a paper with huge citations counts the same as one with n: **clamp values to n**.'],
      panels: [arr([3, 0, 600, 1, 5], { label: 'citations' }), vars({ n: 5 })],
      task: { type: 'number', question: 'After clamping to n, how many cells does the count array need?', options: [5, 6, 601, 1000], answer: 6, hint: 'Clamped values run from 0 to n.' },
      solved: 'Values are now 0..5, so **n + 1 = 6** cells, however big the citations were.',
      then: [
        { say: 1, note: '600 is clamped to 5.', panels: [arr([3, 0, 5, 1, 5], { label: 'clamped', highlights: { 2: 'active' } }), vars({ n: 5 })] },
        { say: 1, note: 'Counted into 6 cells.', panels: [arr([1, 1, 0, 1, 0, 2], { label: 'count (index = value)', highlights: { 5: 'active' } })] },
      ],
    },
  ],

  'template-counting': [
    {
      kind: 'watch',
      title: 'Tally one cell to the right',
      lines: [
        '`count` has maxKey + 2 cells; each key is tallied **one cell to the right**: `count[key + 1]++`.',
        'Prefix sum: now `count[v]` = number of keys **< v**.',
        'Place items left to right at `count[key]++`: stable.',
      ],
      frames: tcTally,
    },
    {
      kind: 'turn',
      title: 'Your turn: read the prefix',
      lines: ['The prefix pass ran: `count[v] += count[v − 1]`.', `count = [${TC_PREFIX.join(', ')}].`],
      panels: [arr(TW, { label: 'items (key = length)' }), arr(TC_PREFIX, { label: 'count after prefix', highlights: { 3: 'active' } })],
      task: {
        type: 'choose',
        question: 'What does count[3] = 4 say?',
        options: [
          { text: '4 items have a key less than 3', why: '' },
          { text: '4 items have key 3', why: 'Only "cat" has length 3. The shift by one makes count[v] cover keys below v.' },
          { text: '4 items have a key of at most 3', why: 'All 5 items have key ≤ 3. count[v] counts keys strictly below v.' },
        ],
        answer: 0,
      },
      solved: 'count[3] = 4 = number of keys < 3, which is exactly where the first key-3 item ("cat") goes.',
      then: unsay(tcPlace),
    },
  ],

  'implementation-counting': [
    {
      kind: 'turn',
      title: 'Your turn: bucket width',
      lines: ['`width = max(1, floor((hi − lo) / (n − 1)))`.', 'n values over n − 1 gaps: the largest gap is at least that wide.'],
      panels: [arr(MG, { label: 'nums' }), vars({ n: mg.n, lo: mg.lo, hi: mg.hi })],
      task: { type: 'number', question: 'What is width?', options: [2, 3, 4, 13], answer: mg.width, hint: `(${mg.hi} − ${mg.lo}) / (${mg.n} − 1) = 13 / 4, rounded down.` },
      solved: `width = floor(13 / 4) = ${mg.width}, and count = floor(13 / ${mg.width}) + 1 = ${mg.count} buckets.`,
      then: [{ say: 0, note: `${mg.count} buckets, each remembering only its min and max.`, panels: [mgTable(new Array(mg.count).fill(Infinity), new Array(mg.count).fill(-Infinity), -1), vars({ width: mg.width, count: mg.count })] }],
    },
    {
      kind: 'watch',
      title: 'Drop into buckets',
      lines: ['Each x goes to bucket `floor((x − lo) / width)`.', 'Only the bucket min and max are kept: no sorting inside.'],
      frames: mg.drops.map((d, i) => ({
        say: i === 0 ? 0 : 1,
        note: `x = ${d.x}: floor((${d.x} − ${mg.lo}) / ${mg.width}) = ${d.b}. Bucket ${d.b} min/max updated.`,
        panels: [arr(MG, { label: 'nums', pointers: [ptr(i, 'x')], highlights: hl(MG.length, (k) => (k === i ? 'active' : k < i ? 'done' : '')) }), mgTable(d.bMin, d.bMax, d.b)],
      })),
    },
    {
      kind: 'watch',
      title: 'Scan between buckets',
      lines: ['The max gap is **between** buckets: next non-empty min − previous non-empty max.', 'Empty buckets are skipped.'],
      frames: mg.scan.slice(0, MG_TURN_B).map((s) => ({
        say: s.empty ? 1 : 0,
        note: s.empty ? `b${s.b} is empty: skip. prevMax stays ${s.prevMax}.` : `b${s.b}: ${mg.bMin[s.b]} − ${s.prevMaxBefore} = ${s.gap}. best = ${s.best}, prevMax = ${s.prevMax}.`,
        panels: [mgTable(mg.bMin, mg.bMax, s.b, s.empty ? 'muted' : 'active'), vars({ prevMax: s.prevMax, best: s.best })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: the last bucket',
      lines: ['b3 was empty. Next comes b4.', `prevMax = ${mg.scan[MG_TURN_B - 1].prevMax}, best = ${mg.scan[MG_TURN_B - 1].best}.`],
      panels: [mgTable(mg.bMin, mg.bMax, MG_TURN_B), vars({ prevMax: mg.scan[MG_TURN_B - 1].prevMax, best: mg.scan[MG_TURN_B - 1].best })],
      task: { type: 'number', question: 'What does maximumGap return?', options: [3, 5, 8, 13], answer: mg.best, hint: `bMin[4] − prevMax = ${mg.bMin[4]} − ${mg.scan[MG_TURN_B - 1].prevMax}; keep the larger of that and best.` },
      solved: `14 − 9 = ${mg.best}. Sorted, the values are 1, 3, 6, 9, 14: the gap 9 → 14 spans the empty bucket.`,
      then: [{ say: 0, note: `best = ${mg.best}, found in O(n) without sorting.`, panels: [arr([...MG].sort((a, b) => a - b), { label: 'for checking: sorted', highlights: { 3: 'active', 4: 'active' } }), vars({ best: mg.best })] }],
    },
  ],

  'intuition-comparator': [
    {
      kind: 'watch',
      title: 'The #1 JavaScript sorting trap',
      lines: [
        '`sort()` with **no comparator** converts every element to a string.',
        'Strings are compared by UTF-16 code units: "10" < "9" because "1" < "9".',
        'With `(a, b) => a - b` the numbers are compared as numbers.',
      ],
      frames: [
        { say: 0, note: '[10, 9, 1].sort(): each number becomes a string.', panels: [arr(DEF, { label: 'numbers' }), arr(DEF.map((x) => `"${x}"`), { label: 'as strings' })] },
        { say: 1, note: 'First characters: "1", "9", "1". "10" and "1" both start with "1", so they go before "9".', panels: [arr(['"1"', '"10"', '"9"'], { label: 'string order', highlights: { 1: 'bad' } })] },
        { say: 1, note: 'Result: [1, 10, 9]. 10 sits before 9.', panels: [arr([1, 10, 9], { label: '[10, 9, 1].sort()', highlights: { 1: 'bad', 2: 'bad' } })] },
        { say: 2, note: 'With (a, b) => a - b: [1, 9, 10].', panels: [arr([1, 10, 9], { label: 'no comparator', highlights: { 1: 'bad', 2: 'bad' } }), arr([...DEF].sort((a, b) => a - b), { label: 'sort((a, b) => a - b)', highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'watch',
      title: 'The comparator contract',
      lines: ['`compare(a, b)` returns a **number**.', '**negative** → a goes before b.', '**positive** → b goes before a.', '**0** → keep their current relative order.'],
      frames: [
        { say: 0, note: 'Comparator (a, b) => a - b.', panels: [vars({ compare: '(a, b) => a - b' })] },
        { say: 1, note: 'compare(1, 9) = −8: negative, so 1 goes before 9.', panels: [arr([1, 9], { label: 'a, b', highlights: { 0: 'done' } }), vars({ 'a - b': -8 })] },
        { say: 2, note: 'compare(9, 1) = 8: positive, so b = 1 goes before a = 9.', panels: [arr([9, 1], { label: 'a, b', highlights: { 1: 'done' } }), vars({ 'a - b': 8 })] },
        { say: 3, note: 'compare(4, 4) = 0: they stay in their current order.', panels: [arr([4, 4], { label: 'a, b', highlights: { 0: 'muted', 1: 'muted' } }), vars({ 'a - b': 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: flip it',
      lines: ['`(a, b) => a - b` is ascending.', 'Swap a and b in the subtraction.'],
      panels: [arr([4, 12, 7], { label: 'nums' }), vars({ compare: '(a, b) => b - a' })],
      task: { type: 'order', question: 'Tap the numbers in the order nums.sort((a, b) => b - a) leaves them.', items: ['12', '7', '4'], hint: 'b − a is negative when a is bigger, so bigger values go first.' },
      solved: '`(a, b) => b - a` is **descending**: [12, 7, 4].',
      then: [{ say: 0, note: 'Descending.', panels: [arr([12, 7, 4], { label: 'nums', highlights: hl(3, () => 'done') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: a tie',
      lines: ['Sort by the number: `(a, b) => a.n - b.n`.', 'Ann and Cy both have 3, so compare returns 0 for them.'],
      panels: [arr(['Ann 3', 'Bo 1', 'Cy 3'], { label: 'people (in this order)', highlights: { 0: 'active', 2: 'active' } })],
      task: {
        type: 'choose',
        question: 'Who comes first in the result: Ann or Cy?',
        options: [
          { text: 'Ann', why: '' },
          { text: 'Cy', why: '0 means keep the current relative order, and Ann is before Cy now.' },
          { text: 'It depends on the engine', why: 'Stability is guaranteed by the spec since ES2019: ties keep their order.' },
        ],
        answer: 0,
      },
      solved: 'The sort is **stable**: on 0, Ann stays before Cy.',
      then: [{ say: 1, note: 'Bo (1) moves first; Ann stays before Cy.', panels: [arr(['Bo 1', 'Ann 3', 'Cy 3'], { label: 'sorted', highlights: hl(3, () => 'done') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: copy or not?',
      lines: ['`const s = arr.sort((a, b) => a - b);`', 'Then we look at `arr`.'],
      panels: [arr([3, 1, 2], { label: 'arr before the line' })],
      task: {
        type: 'choose',
        question: 'After the line runs, what is arr?',
        options: [
          { text: '[1, 2, 3]: sort changed arr itself and returned it', why: '' },
          { text: '[3, 1, 2]: s is a sorted copy', why: '`sort` mutates in place and returns the same array. For a copy use `toSorted` (ES2023) or `[...arr].sort(cmp)`.' },
        ],
        answer: 0,
      },
      solved: '`sort` **mutates** and returns the same array: s and arr are one array.',
      then: [{ say: 0, note: 'arr is sorted, and s points to the same array.', panels: [arr([1, 2, 3], { label: 'arr (also s)', highlights: hl(3, () => 'done') }), vars({ 's === arr': 'true' })] }],
    },
  ],

  'optimized-comparator': [
    {
      kind: 'watch',
      title: 'The boolean comparator',
      lines: ['`(a, b) => a > b` returns true or false: they become 1 or 0.', 'It **never returns a negative number**: the engine is never told "a before b".', 'So the order is wrong on many inputs. Return a number: `a - b`.'],
      frames: [
        { say: 0, note: 'compare(5, 2): 5 > 2 is true → 1. Positive, fine.', panels: [arr([5, 2], { label: 'a, b' }), vars({ 'a > b': 'true → 1' })] },
        { say: 1, note: 'compare(2, 5): 2 > 5 is false → 0. It should be negative ("2 before 5").', panels: [arr([2, 5], { label: 'a, b', highlights: { 0: 'bad', 1: 'bad' } }), vars({ 'a > b': 'false → 0' })] },
        { say: 2, note: 'compare(2, 5) with a - b = −3: negative, 2 goes first.', panels: [arr([2, 5], { label: 'a, b', highlights: { 0: 'done' } }), vars({ 'a - b': -3 })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Multi-key: score down, then name up',
      lines: ['`b.score - a.score || a.name.localeCompare(b.name)`', '`x || y` returns y only when x is 0, a tie: then the next key decides.'],
      frames: [
        { say: 0, note: 'Four people, unsorted.', panels: [peopleT(PEOPLE)] },
        { say: 1, note: 'Cy vs Bo: 90 − 90 = 0, a tie. localeCompare("Cy", "Bo") is positive → Bo first.', panels: [peopleT(PEOPLE, ['Cy', 'Bo']), vars({ 'b.score − a.score': 0, 'then name': 'Bo < Cy' })] },
        { say: 1, note: 'Al vs Bo: 90 − 85 = 5, positive → Bo first. The name is never looked at.', panels: [peopleT(PEOPLE, ['Al', 'Bo']), vars({ 'b.score − a.score': 5 })] },
        { say: 0, note: 'Sorted: score descending, names ascending inside each score.', panels: [peopleT(PEOPLE_SORTED, PEOPLE_SORTED.map((p) => p[0]), 'done', 'sorted')] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: what does it return?',
      lines: ['Comparator: `(a, b) => a.age - b.age || a.id - b.id`.', 'a = { age 30, id 7 }, b = { age 30, id 4 }.'],
      panels: [table(['a', 'b'], ['age', 'id'], [[30, 7], [30, 4]]), vars({ compare: 'a.age - b.age || a.id - b.id' })],
      task: { type: 'number', question: 'What number does the comparator return?', options: [0, 3, -3, 1], answer: 3, hint: 'Ages tie (0), so `||` moves on to 7 − 4.' },
      solved: '0 || 3 = **3**: positive, so b (id 4) goes first.',
      then: [{ say: 1, note: 'The age tie is broken by id: b before a.', panels: [table(['b', 'a'], ['age', 'id'], [[30, 4], [30, 7]], [['done', 'done'], ['', '']], 'sorted')] }],
    },
    {
      kind: 'watch',
      title: 'A rank map for a custom order',
      lines: ['"Sort by the order given in `order`": `rank = new Map(order.map((v, i) => [v, i]))`.', 'Compare `rank.get(a) - rank.get(b)`: O(1) per comparison.'],
      frames: [
        { say: 0, note: `order = [${ORDER.join(', ')}]: each value gets its position.`, panels: [arr(ORDER, { label: 'order' }), table(ORDER, ['rank'], ORDER.map((v) => [RANK.get(v)]), undefined, 'rank')] },
        { say: 1, note: `a vs c: ${RANK.get('a')} − ${RANK.get('c')} = ${RANK.get('a') - RANK.get('c')}, positive → c first.`, panels: [arr(RITEMS, { label: 'items', highlights: { 0: 'active', 1: 'active' } }), vars({ 'rank(a) − rank(c)': RANK.get('a') - RANK.get('c') })] },
        { say: 1, note: `Sorted by rank: [${RSORTED.join(', ')}].`, panels: [arr(RSORTED, { label: 'items', highlights: hl(RSORTED.length, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: Largest Number pair',
      lines: ['Put `a` before `b` when `a + b > b + a` (as strings).', 'Arrange 5 and 56 to make the biggest number.'],
      panels: [arr(['5', '56'], { label: 'nums as strings' })],
      task: {
        type: 'choose',
        question: 'Which goes first?',
        options: [
          { text: '56', why: '' },
          { text: '5', why: '"5" + "56" = "556", but "56" + "5" = "565" is bigger.' },
          { text: 'Either: same digits', why: 'The concatenations differ: "565" vs "556".' },
        ],
        answer: 0,
      },
      solved: '"565" > "556", so **56** goes first.',
      then: [pairFrame('56', '5', 0)],
    },
  ],

  'template-comparator': [
    {
      kind: 'turn',
      title: 'Your turn: length, then alpha',
      lines: ['`(a, b) => a.length - b.length || a.localeCompare(b)`', 'Shorter first; equal lengths alphabetically.'],
      panels: [arr(WORDS, { label: 'words' })],
      task: { type: 'order', question: 'Tap the words in sorted order.', items: WSORTED, hint: 'fig has 3 letters; kiwi and pear tie at 4, so alphabetical breaks the tie.' },
      solved: `[${WSORTED.join(', ')}]: length first, then alphabetical for kiwi / pear.`,
      then: [{ say: 0, note: 'Sorted by length, ties by alphabet.', panels: [arr(WSORTED, { label: 'words', highlights: hl(4, () => 'done') })] }],
    },
    {
      kind: 'watch',
      title: 'Sort indices by a key array',
      lines: ['`idx = names.map((_, i) => i)`: positions 0..n − 1.', '`idx.sort((i, j) => heights[j] - heights[i])`: tallest first.', '`idx.map((i) => names[i])`: names in that order.'],
      frames: [
        { say: 0, note: 'Two arrays that belong together, plus the positions.', panels: [arr(NAMES, { label: 'names' }), arr(HEIGHTS, { label: 'heights' }), arr([0, 1, 2], { label: 'idx' })] },
        { say: 1, note: `Sort the positions by height, descending: idx = [${IDX_SORTED.join(', ')}].`, panels: [arr(HEIGHTS, { label: 'heights', highlights: { [IDX_SORTED[0]]: 'active' } }), arr(IDX_SORTED, { label: 'idx', highlights: hl(3, () => 'done') })] },
        { say: 2, note: `Map back: [${IDX_SORTED.map((i) => NAMES[i]).join(', ')}]. names and heights were not touched.`, panels: [arr(IDX_SORTED, { label: 'idx' }), arr(IDX_SORTED.map((i) => NAMES[i]), { label: 'byHeight', highlights: hl(3, () => 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: pick the recipe',
      lines: ['You want [3, 11, 7] as [11, 7, 3].'],
      panels: [arr([3, 11, 7], { label: 'nums' }), arr([11, 7, 3], { label: 'wanted' })],
      task: {
        type: 'choose',
        question: 'Which call gives [11, 7, 3]?',
        options: [
          { text: 'nums.sort((a, b) => b - a)', why: '' },
          { text: 'nums.sort((a, b) => a - b)', why: 'That is ascending: [3, 7, 11].' },
          { text: 'nums.sort()', why: 'No comparator compares strings: "11" < "3" < "7" → [11, 3, 7].' },
        ],
        answer: 0,
      },
      solved: '`(a, b) => b - a`: numbers **descending**.',
      then: [{ say: 0, note: 'Descending.', panels: [arr([11, 7, 3], { label: 'nums', highlights: hl(3, () => 'done') })] }],
    },
  ],

  'implementation-comparator': [
    {
      kind: 'watch',
      title: 'largestNumber([3, 30, 34, 5])',
      lines: ['Turn numbers into strings.', 'Comparator: return −1 when `ab > ba` (bigger concatenation first).', 'ab and ba have the same length, so plain string comparison works.', 'Join the sorted strings.'],
      frames: [
        { say: 0, note: 's = ["3", "30", "34", "5"].', panels: [arr(LN.map(String), { label: 's' })] },
        pairFrame('3', '30', 1),
        pairFrame('34', '3', 1),
        { ...pairFrame('5', '34', 2) },
        { say: 1, note: `Sorted: [${LNS.join(', ')}].`, panels: [arr(LNS, { label: 's sorted', highlights: hl(4, () => 'done') })] },
        { say: 3, note: `Joined: "${LNS.join('')}".`, panels: [arr(LNS, { label: 's sorted' }), vars({ result: `"${LNS.join('')}"` })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 12, 121, 2',
      lines: ['Same comparator: a before b when `a + b > b + a`.'],
      panels: [arr(LN2.map(String), { label: 's' })],
      task: { type: 'order', question: 'Tap the strings in the order the sort leaves them.', items: LN2S, hint: '"12" + "121" = "12121" vs "121" + "12" = "12112". And 2 beats both.' },
      solved: `[${LN2S.join(', ')}] → "${LN2S.join('')}".`,
      then: [pairFrame('12', '121', 0), { say: 0, note: `Result "${LN2S.join('')}".`, panels: [arr(LN2S, { label: 's sorted', highlights: hl(3, () => 'done') })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: all zeros',
      lines: ['After sorting, the code checks `s[0] === "0"`.'],
      panels: [arr(['0', '0'], { label: 's sorted' })],
      task: {
        type: 'choose',
        question: 'What does largestNumber([0, 0]) return?',
        options: [
          { text: '"0"', why: '' },
          { text: '"00"', why: 'The guard catches it: s[0] is "0", so it returns "0", not "00".' },
          { text: '""', why: 'Nothing is removed. The guard returns "0".' },
        ],
        answer: 0,
      },
      solved: 'The biggest string starts with "0" only if all are zeros → return **"0"**.',
    },
  ],

  'intuition-preprocess': [
    {
      kind: 'watch',
      title: 'Doubled Pairs: the smallest is forced',
      lines: ['Can the array be split into pairs `(x, 2x)`?', 'Sort by **absolute value**.', 'The smallest remaining x cannot be the double of anything left: it **must** pair with 2x.'],
      frames: [
        { say: 0, note: `[${DP.join(', ')}].`, panels: [arr(DP, { label: 'arr' })] },
        { say: 1, note: `Sorted by |x|: [${DPS.join(', ')}].`, panels: [arr(DPS, { label: 'by |x|' })] },
        { say: 2, note: '1 is smallest: its half would be even smaller, so 1 pairs with 2.', panels: [arr(DPS, { label: 'by |x|', highlights: { 0: 'active', 1: 'active' } }), vars({ pairs: '(1, 2)' })] },
        { say: 2, note: 'Smallest left is 4: it pairs with 8. Every value used → true.', panels: [arr(DPS, { label: 'by |x|', highlights: { 0: 'done', 1: 'done', 2: 'active', 3: 'active' } }), vars({ pairs: '(1, 2) (4, 8)', result: 'true' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: no partner',
      lines: ['Same greedy, new array.', 'Sorted by |x|: [1, 3, 4, 6].'],
      panels: [arr([1, 3, 4, 6], { label: 'by |x|', pointers: [ptr(0, 'x')], highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'The greedy looks at 1 first. What happens?',
        options: [
          { text: 'No 2 to pair with: the answer is false', why: '' },
          { text: 'Skip 1 and try 3', why: 'The choice is forced: 1 cannot be anyone\'s double, so it must be the half. No skipping.' },
          { text: 'Pair 1 with 3, the next value', why: 'Pairs must be (x, 2x). 3 is not 2 · 1.' },
        ],
        answer: 0,
      },
      solved: '1 must pair with 2, and there is no 2 → **false**, decided right away.',
    },
    {
      kind: 'watch',
      title: 'H-Index after sorting',
      lines: ['Sort citations **descending**.', 'Paper at position i (0-based) has at least `i + 1` papers with ≥ its citations.', 'h is the largest `i + 1` with `c[i] ≥ i + 1`.'],
      frames: [
        { say: 0, note: `[${HI.join(', ')}] sorted descending: [${HIS.join(', ')}].`, panels: [arr(HIS, { label: 'citations desc' })] },
        ...hRun.map((r) => ({
          say: r.i === 0 ? 1 : 2,
          note: `i = ${r.i}: c[i] = ${r.c} ${r.ok ? '≥' : '<'} ${r.i + 1}${r.ok ? `: h can be ${r.i + 1}.` : '.'}`,
          panels: [arr(HIS, { label: 'citations desc', pointers: [ptr(r.i, 'i')], highlights: hl(5, (k) => (k === r.i ? (r.ok ? 'active' : 'bad') : k < r.i && hRun[k].ok ? 'done' : '')) }), vars({ 'i + 1': r.i + 1, h: Math.max(0, ...hRun.slice(0, r.i + 1).filter((q) => q.ok).map((q) => q.i + 1)) })],
        })),
        { say: 2, note: `h = ${H_ANS}.`, panels: [arr(HIS, { label: 'citations desc', highlights: hl(5, (k) => (hRun[k].ok ? 'done' : 'muted')) }), vars({ h: H_ANS })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: find h',
      lines: ['Already sorted descending.', 'h = largest `i + 1` with `c[i] ≥ i + 1`.'],
      panels: [arr(HT, { label: 'citations desc' })],
      task: { type: 'number', question: 'What is h?', options: [3, 4, 5, 10], answer: HT_ANS, hint: 'Check each position: is c[i] at least i + 1?' },
      solved: `c[3] = 4 ≥ 4 but c[4] = 3 < 5, so h = **${HT_ANS}**.`,
      then: [{ say: 1, note: `The first ${HT_ANS} positions pass.`, panels: [arr(HT, { label: 'citations desc', highlights: hl(5, (k) => (HT[k] >= k + 1 ? 'done' : 'bad')) }), vars({ h: HT_ANS })] }],
    },
  ],

  'optimized-preprocess': [
    {
      kind: 'watch',
      title: 'Car Fleet: sort, then time',
      lines: [
        "Pair each car's position with its speed; sort by position **descending** (closest to the target first).",
        "Each car's arrival time alone: `(target − position) / speed`.",
        'Scan: keep the fleet in front\'s time `lead`. Time ≤ lead → it joins. Otherwise a new fleet starts and becomes `lead`.',
        'The number of new fleets is the answer.',
      ],
      frames: [
        { say: 0, note: `target ${CF.target}. Cars as given.`, panels: [table(CF.position.map((p) => `pos ${p}`), ['speed'], CF.speed.map((s) => [s]), undefined, 'cars')] },
        { say: 0, note: 'Sorted by position, closest to the target first.', panels: [arr(cf.cars.map((c) => c[0]), { label: 'position (sorted desc)' })] },
        { say: 1, note: 'Time alone for each: (12 − position) / speed.', panels: [arr(cf.cars.map((c) => c[0]), { label: 'position (sorted desc)' }), arr(cf.cars.map((c) => c[1]), { label: 'time alone', highlights: hl(5, () => 'active') })] },
        ...cf.steps.slice(0, CF_TURN).map(cfFrame),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the car at 3',
      lines: ['Car at 3 arrives in 3 on its own.', `The fleet in front arrives at ${cf.steps[CF_TURN].before}.`],
      panels: cfPanels({ ...cf.steps[CF_TURN - 1], i: CF_TURN, fresh: false }, CF_TURN),
      task: {
        type: 'choose',
        question: 'What happens to this car?',
        options: [
          { text: 'It catches up and joins that fleet', why: '' },
          { text: 'It starts a new fleet', why: `Its time 3 is ≤ lead ${cf.steps[CF_TURN].before}: it reaches the fleet in front before the target.` },
          { text: 'It passes the fleet and leads', why: 'It catches up and then moves at the fleet\'s pace; it does not pass.' },
        ],
        answer: 0,
      },
      solved: '3 ≤ 7 → it **joins**. fleets stays 2.',
      then: unsay(cf.steps.slice(CF_TURN).map(cfFrame)).concat([{ note: `${cf.fleets} new fleets started → answer ${cf.fleets}.`, panels: [vars({ fleets: cf.fleets })] }]),
    },
  ],

  'template-preprocess': [
    {
      kind: 'watch',
      title: 'canPairDoubles: count, then sort keys',
      lines: ['Count every value in a Map.', 'Sort the distinct keys by **absolute value**.', 'For each x with count c, take c of `2x`: not enough → false.'],
      frames: [
        { say: 0, note: `arr = [${PD.join(', ')}].`, panels: [arr(PD, { label: 'arr' })] },
        { say: 0, note: 'Counts per value.', panels: [arr(PD, { label: 'arr' }), countT(pdRun.start)] },
        { say: 1, note: `Keys by |x|: [${pdRun.keys.join(', ')}].`, panels: [pdKeys(-1, 0), countT(pdRun.start)] },
        ...pdRun.steps.slice(0, PD_TURN).map((s) => {
          const k = pdRun.keys.indexOf(s.x);
          return { say: 2, note: `x = ${s.x}, c = ${s.c}: ${2 * s.x} has ${s.need}, enough. count(${2 * s.x}) becomes ${s.need - s.c}.`, panels: [pdKeys(k, k), countT(s.after, s.x)] };
        }),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: an empty count',
      lines: [`Next key: x = ${pdRun.steps[PD_TURN].x}.`, `Its count is 0: it was used up as the double of ${pdRun.steps[PD_TURN].x / 2}.`],
      panels: [pdKeys(PD_TURN, PD_TURN), countT(pdRun.steps[PD_TURN - 1].after, pdRun.steps[PD_TURN].x)],
      task: {
        type: 'choose',
        question: `What does the loop do with x = ${pdRun.steps[PD_TURN].x}?`,
        options: [
          { text: 'Skip it: c === 0, nothing left to pair', why: '' },
          { text: 'Return false: there is no −8', why: 'Count 0 means every −4 already has a partner. `if (c === 0) continue;` runs first.' },
          { text: 'Pair it with 4', why: 'Pairs are (x, 2x). And with count 0 there is no −4 left to pair.' },
        ],
        answer: 0,
      },
      solved: '`c === 0` → **continue**: all used up as someone\'s double.',
      then: unsay(pdRun.steps.slice(PD_TURN).map((s) => {
        const k = pdRun.keys.indexOf(s.x);
        return { say: 2, note: s.skip ? `x = ${s.x}: count 0, skip.` : `x = ${s.x}: paired.`, panels: [pdKeys(k, k), countT(s.after)] };
      })).concat([{ note: `Every key handled → ${pdRun.result}.`, panels: [pdKeys(-1, pdRun.keys.length), vars({ result: String(pdRun.result) })] }]),
    },
    {
      kind: 'turn',
      title: 'Your turn: zeros',
      lines: ['`if (x === 0) { if (c % 2) return false; continue; }`', 'Zeros pair with zeros.'],
      panels: [arr([0, 0, 0], { label: 'arr' }), table(['0'], ['count'], [[3]], [['active']], 'count')],
      task: {
        type: 'choose',
        question: 'What does canPairDoubles([0, 0, 0]) return?',
        options: [
          { text: 'false', why: '' },
          { text: 'true: 0 is its own double', why: 'Zeros pair with zeros, two at a time. Three zeros leave one over: 3 % 2 = 1.' },
        ],
        answer: 0,
      },
      solved: 'c = 3 is odd → one zero has no partner → **false**.',
    },
  ],

  'implementation-preprocess': [
    {
      kind: 'watch',
      title: 'Build [position, time], sort',
      lines: ['`cars = position.map((p, i) => [p, (target - p) / speed[i]])`', '`cars.sort((a, b) => b[0] - a[0])`: closest to the target first.', '`fleets = 0, lead = 0`.'],
      frames: [
        { say: 0, note: `target ${CF2.target}: each car becomes [position, time].`, panels: [table(CF2.position.map((p) => `pos ${p}`), ['speed', 'time'], CF2.position.map((p, i) => [CF2.speed[i], (CF2.target - p) / CF2.speed[i]]), undefined, 'cars')] },
        { say: 1, note: 'Sorted by position, descending.', panels: [table(cf2.cars.map((c) => `pos ${c[0]}`), ['time'], cf2.cars.map((c) => [c[1]]), undefined, 'cars sorted')] },
        { say: 2, note: 'Nothing ahead yet: lead = 0.', panels: [table(cf2.cars.map((c) => `pos ${c[0]}`), ['time'], cf2.cars.map((c) => [c[1]]), undefined, 'cars sorted'), vars({ fleets: 0, lead: 0 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: count the fleets',
      lines: ['`if (time > lead) { fleets++; lead = time; }`'],
      panels: [table(cf2.cars.map((c) => `pos ${c[0]}`), ['time'], cf2.cars.map((c) => [c[1]]), undefined, 'cars sorted'), vars({ fleets: 0, lead: 0 })],
      task: { type: 'number', question: 'What does carFleet return?', options: [1, 2, 3], answer: cf2.fleets, hint: 'Walk down the times: only a time bigger than lead starts a new fleet.' },
      solved: `Times ${cf2.cars.map((c) => c[1]).join(', ')}: new fleets at 3 and 10 → **${cf2.fleets}**.`,
      then: cf2.steps.map((s) => ({
        say: 0,
        note: s.fresh ? `time ${s.time} > lead ${s.before}: fleets = ${s.fleets}, lead = ${s.lead}.` : `time ${s.time} ≤ lead ${s.before}: joins.`,
        panels: [table(cf2.cars.map((c) => `pos ${c[0]}`), ['time'], cf2.cars.map((c) => [c[1]]), cf2.cars.map((_, k) => [k === s.i ? (s.fresh ? 'active' : 'visited') : '']), 'cars sorted'), vars({ fleets: s.fleets, lead: s.lead })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: a dead heat',
      lines: ['A car\'s time is **exactly** equal to lead.'],
      panels: [vars({ time: 4, lead: 4, condition: 'time > lead' })],
      task: {
        type: 'choose',
        question: 'What does the loop do with this car?',
        options: [
          { text: 'Nothing: it joins the fleet ahead', why: '' },
          { text: 'fleets++: a new fleet', why: '`4 > 4` is false. Time ≤ lead means it catches up and joins.' },
        ],
        answer: 0,
      },
      solved: 'The test is strict `>`: an equal time **joins** the fleet ahead.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'Merging [2, 4] with [1, 3, 5]',
      lines: [
        'The inner calls sorted both halves; neither had inversions: 0 + 0.',
        'Taking from the right adds `mid − i`: every remaining left item is bigger.',
        'Taking from the left adds 0.',
      ],
      frames: [
        { say: 0, note: 'Left [2, 4] and right [1, 3, 5] are sorted. total = 0.', panels: [arr(DL, { label: 'left (sorted)' }), arr(DRR, { label: 'right (sorted)' }), vars({ total: 0 })] },
        drFrame(drRows[0], 1),
        drFrame(drRows[1], 2),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 4 vs 3',
      lines: ['i = 1 (left holds 4), j = 1 (right holds 3).', '`mid` = 2, the length of the left half.'],
      panels: drFrame(drRows[DR_TURN - 1], 2).panels.map((p, k) => (k === 0 ? { ...p, pointers: [ptr(1, 'i')], highlights: { 0: 'muted', 1: 'active' } } : k === 1 ? { ...p, pointers: [ptr(1, 'j', 'b')], highlights: { 0: 'muted', 1: 'active' } } : p)),
      task: { type: 'number', question: '3 is taken from the right. How many inversions does that add?', options: [0, 1, 2, 3], answer: drRows[DR_TURN].added, hint: 'mid − i = 2 − 1.' },
      solved: `Only 4 is left on the left side and 4 > 3: adds **1**, the pair (4,3). total = ${drRows[DR_TURN].total}.`,
      then: [drFrame(drRows[DR_TURN], 1)],
    },
    {
      kind: 'watch',
      title: 'Finish the merge',
      lines: ['Taking from the left adds 0.', 'Once the left is empty, the rest of the right adds 0.', 'Inversions: (2,1), (4,1), (4,3) → **3**, all across the split.'],
      frames: [
        drFrame(drRows[DR_TURN + 1], 0),
        drFrame(drRows[DR_TURN + 2], 1),
        { say: 2, note: `total = ${drRows.at(-1).total}. Every inversion crosses the split between [2, 4] and [1, 3, 5].`, panels: [arr(drRows.at(-1).merged, { label: 'merged', highlights: hl(5, () => 'done') }), vars({ total: drRows.at(-1).total })] },
      ],
    },
  ],

  mistakes: [
    {
      kind: 'turn',
      title: 'Your turn: negatives in counting sort',
      lines: ['`count[-3]++` makes a string property "-3", not an element.', 'Fix: offset by `-min`, so the smallest value maps to index 0.'],
      panels: [arr(NEG, { label: 'nums' }), arr(new Array(NCOUNT.length).fill(0), { label: 'count (index = x − min)' }), vars({ min: NMIN, offset: -NMIN })],
      task: { type: 'cell', panel: 1, question: 'Tap the count cell where −1 is counted.', answer: -1 - NMIN, hints: { 0: 'That is −3\'s cell: −3 + 3 = 0.', 1: '−1 + 3 is not 1.', 3: 'That is 0\'s cell: 0 + 3 = 3.' } },
      solved: '−1 + 3 = **2**. Every value lands on a real index from 0 up.',
      then: [{ say: 1, note: 'All four counted with the offset.', panels: [arr(NEG, { label: 'nums', highlights: hl(4, () => 'done') }), arr(NCOUNT, { label: 'count (index = x − min)', highlights: { 2: 'active' } })] }],
    },
    {
      kind: 'watch',
      title: 'sort changed the caller\'s array',
      lines: ['`sort` mutates: the caller\'s array changes.', 'Use `toSorted` or `[...arr].sort()` when the original is still needed.'],
      frames: [
        { say: 0, note: 'scores, in the order they came in.', panels: [arr(SCORES, { label: 'scores' })] },
        { say: 0, note: 'A helper runs scores.sort((a, b) => b - a)[0] to get the top score…', panels: [arr(SCORES, { label: 'scores', highlights: { 1: 'active' } }), vars({ top: 95 })] },
        { say: 0, note: '…and the caller\'s scores are now reordered.', panels: [arr([...SCORES].sort((a, b) => b - a), { label: 'scores', highlights: hl(3, () => 'bad') })] },
        { say: 1, note: 'With toSorted: a sorted copy, and scores stays as it came.', panels: [arr(SCORES, { label: 'scores', highlights: hl(3, () => 'done') }), arr(SCORES.toSorted((a, b) => b - a), { label: 'copy' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: subtracting strings',
      lines: ['`(a, b) => a - b` is the number recipe.', 'Here it is used on words.'],
      panels: [arr(['pear', 'fig'], { label: 'a, b' }), vars({ compare: 'a - b' })],
      task: {
        type: 'choose',
        question: 'What does compare("pear", "fig") return?',
        options: [
          { text: 'NaN', why: '' },
          { text: 'A positive number: "pear" > "fig"', why: 'Not with `-`: on non-numeric strings it gives NaN.' },
          { text: 'A negative number', why: 'Subtracting non-numeric strings never gives a real number: NaN.' },
        ],
        answer: 0,
      },
      solved: '**NaN**, which gives an inconsistent order. Use `localeCompare` or `<` / `>`.',
    },
    {
      kind: 'turn',
      title: 'Your turn: < instead of <=',
      lines: ['Merge should take from the left when `left[i] <= right[j]`.', 'This merge uses `<`.'],
      panels: [arr([3], { label: 'left', pointers: [ptr(0, 'i')] }), arr([3], { label: 'right', pointers: [ptr(0, 'j', 'b')] }), vars({ test: '3 < 3 → false' })],
      task: {
        type: 'choose',
        question: 'In inversion counting, what does this tie do?',
        options: [
          { text: 'Takes the right 3 first and counts 1 inversion', why: '' },
          { text: 'Takes the left 3 first and counts 0', why: 'That is what `<=` does. With `<`, 3 < 3 is false, so the right one is taken.' },
          { text: 'Counts nothing either way', why: 'Taking from the right adds mid − i = 1: the equal pair gets counted.' },
        ],
        answer: 0,
      },
      solved: 'With `<`, equal pairs are counted as inversions and stability is lost.',
    },
  ],

  'interview-tips': [
    {
      kind: 'turn',
      title: 'Your turn: "implement a sort"',
      lines: ['Know the trade-offs by heart.', 'Under pressure, pick the one that is easy to get right.'],
      panels: [table(['merge', 'quick', 'counting'], ['note'], [['n log n always, stable'], ['in place, bad worst case'], ['small ranges only']])],
      task: {
        type: 'choose',
        question: 'Asked to implement a sort, which do you write?',
        options: [
          { text: 'Merge sort', why: '' },
          { text: 'Quick sort with the first element as pivot', why: 'A fixed pivot is O(n²) on sorted input. Merge sort has no bad case.' },
          { text: 'Counting sort', why: 'Linear only for small integer ranges; not a general sort.' },
        ],
        answer: 0,
      },
      solved: '**Merge sort**: short, no bad case, easy to get right.',
    },
    {
      kind: 'watch',
      title: 'Run the edge cases',
      lines: ['Before you finish, run your code on the edge cases:', 'empty, single element, all equal, already sorted, reverse sorted…', '…negatives, and zeros (Largest Number: "00" → "0").'],
      frames: [
        { say: 1, note: 'Empty array.', panels: [arr([], { label: '[]' })] },
        { say: 1, note: 'Single element.', panels: [arr([7], { label: '[7]' })] },
        { say: 1, note: 'All equal.', panels: [arr([2, 2, 2], { label: 'all equal' })] },
        { say: 1, note: 'Already sorted, and reverse sorted.', panels: [arr([1, 2, 3], { label: 'sorted' }), arr([3, 2, 1], { label: 'reverse' })] },
        { say: 2, note: 'Negatives.', panels: [arr([-5, 3, -1], { label: 'negatives', highlights: { 0: 'active', 2: 'active' } })] },
        { say: 2, note: 'Zeros: Largest Number of [0, 0] must be "0".', panels: [arr(['0', '0'], { label: 'Largest Number' }), vars({ result: '"0"' })] },
      ],
    },
  ],
};
