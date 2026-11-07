// Step lessons for Bit Manipulation, part 2 (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every mask, subset, Gray code, trie walk and XOR below comes from running the lesson's own code on the example input.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]).filter(([, s]) => s));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const bare = (fs) => fs.map(({ say, ...f }) => f);
const check = (ok, what) => {
  if (!ok) throw new Error(`bit-manipulation steps-2: ${what}`);
};

// ---------- bits: a number as a row of n bits, most significant on the left ----------
const bitsOf = (x, n) => Array.from({ length: n }, (_, k) => (x >> (n - 1 - k)) & 1);
const at = (b, n) => n - 1 - b; // array position of bit b
const bstr = (x, n) => bitsOf(x, n).join('');
const onBits = (x, n, s = 'active') => Object.fromEntries(Array.from({ length: n }, (_, b) => b).filter((b) => (x >> b) & 1).map((b) => [at(b, n), s]));
const bitP = (x, n, opts = {}) => arr(bitsOf(x, n), { showIndices: false, label: String(x), ...opts });
const popcount = (m) => {
  let c = 0;
  for (; m; m &= m - 1) c++;
  return c;
};

// ---------- the lesson's mask code ----------
function letterMask(word) {
  let m = 0;
  for (let i = 0; i < word.length; i++) m |= 1 << (word.charCodeAt(i) - 97);
  return m;
}
const KEY8 = arr('hgfedcba'.split(''), { label: 'letter of each bit (7 → 0)', showIndices: false });

// intuition-mask: build "cab" letter by letter
const CAB = (() => {
  let m = 0;
  return [...'cab'].map((ch) => {
    const b = ch.charCodeAt(0) - 97;
    m |= 1 << b;
    return { say: 0, note: `"${ch}" → index ${b}: m |= 1 << ${b}. m = ${m}.`, panels: [KEY8, bitP(m, 8, { label: `m = ${m}`, highlights: { [at(b, 8)]: 'active' } })] };
  });
})();
check(letterMask('cab') === 7 && letterMask('abc') === 7, '"cab" and "abc" are both 7');
const BEAD = letterMask('bead');
check(BEAD === 27, 'bead = 27');

// set operations on 4 items
const S0 = 0b0101;
const S_ADD = S0 | (1 << 1);
const S_HAS = (S_ADD >> 2) & 1;
const S_REM = S_ADD & ~(1 << 2);
const SB = 0b1010;
check(S_ADD === 7 && S_HAS === 1 && S_REM === 3 && (S_REM | SB) === 11 && (S_REM & SB) === 2 && popcount(S_REM) === 2, 'set ops');
const RM = 0b1011;
const RM_AFTER = RM & ~(1 << 1);
check(RM_AFTER === 9, 'remove bit 1 from 11 = 9');

// optimized-mask: masks + Map(mask → maxLen)
const OPT_WORDS = ['ab', 'abba', 'bcd', 'efgh'];
const OPT_MASKS = OPT_WORDS.map(letterMask);
const OPT_MAP = new Map();
for (let i = 0; i < OPT_WORDS.length; i++) OPT_MAP.set(OPT_MASKS[i], Math.max(OPT_MAP.get(OPT_MASKS[i]) || 0, OPT_WORDS[i].length));
const OPT_ENTRIES = [...OPT_MAP];
const OPT_PAIRS = (OPT_ENTRIES.length * (OPT_ENTRIES.length - 1)) / 2;
let OPT_BEST = 0;
for (let i = 0; i < OPT_ENTRIES.length; i++) for (let j = i + 1; j < OPT_ENTRIES.length; j++) if ((OPT_ENTRIES[i][0] & OPT_ENTRIES[j][0]) === 0) OPT_BEST = Math.max(OPT_BEST, OPT_ENTRIES[i][1] * OPT_ENTRIES[j][1]);
check(OPT_MASKS.join() === '3,3,14,240' && OPT_ENTRIES.length === 3 && OPT_PAIRS === 3 && OPT_BEST === 16, 'map shrink');
const optRows = OPT_WORDS.map((w, i) => [w, String(OPT_MASKS[i]), String(w.length)]);
const optTable = (k) =>
  table(OPT_WORDS, ['mask', 'len'], optRows.map((r, i) => (i <= k ? r.slice(1) : ['?', '?'])), optRows.map((r, i) => (i === k ? ['active', 'active'] : i < k ? ['done', 'done'] : ['', ''])), 'words');
const mapTable = (k, hot) =>
  table(OPT_ENTRIES.map(([m]) => String(m)), ['maxLen'], OPT_ENTRIES.map(([, l], i) => [i <= k ? String(l) : '?']), OPT_ENTRIES.map((_, i) => [i === hot ? 'active' : i <= k ? 'done' : '']), 'Map mask → maxLen');

// implementation-mask: the lesson's maxProduct, logged
const IMP_WORDS = ['abc', 'de', 'ad', 'fgh'];
function maxProductRun(words) {
  const masks = words.map(letterMask);
  let best = 0;
  const log = [];
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++) {
      const and = masks[i] & masks[j];
      if (and === 0) best = Math.max(best, words[i].length * words[j].length);
      log.push({ i, j, and, best, mi: masks[i], mj: masks[j] });
    }
  return { masks, best, log };
}
const IMP = maxProductRun(IMP_WORDS);
check(IMP.best === 9 && IMP.log.length === 6, 'maxProduct = 9');
const impFrame = (s, say) => ({
  say,
  note:
    s.and === 0
      ? `"${IMP_WORDS[s.i]}" & "${IMP_WORDS[s.j]}" = 0: no common letter. ${IMP_WORDS[s.i].length} × ${IMP_WORDS[s.j].length} = ${IMP_WORDS[s.i].length * IMP_WORDS[s.j].length}. best = ${s.best}.`
      : `"${IMP_WORDS[s.i]}" & "${IMP_WORDS[s.j]}" = ${s.and}: they share a letter. Skip. best = ${s.best}.`,
  panels: [
    bitP(s.mi, 8, { label: `"${IMP_WORDS[s.i]}" = ${s.mi}`, highlights: onBits(s.mi & s.mj, 8, 'bad') }),
    bitP(s.mj, 8, { label: `"${IMP_WORDS[s.j]}" = ${s.mj}`, highlights: onBits(s.mi & s.mj, 8, 'bad') }),
    vars({ i: s.i, j: s.j, and: s.and, best: s.best }),
  ],
});
const IMP_TURN = IMP.log.findIndex((s) => s.i === 1 && s.j === 2);
check(IMP.log[IMP_TURN].and === 8, 'de & ad = 8');

// template-mask: all subsets of n = 3 items (item i = letter i)
const N3 = 3;
const KEY3 = arr(['c', 'b', 'a'], { label: 'item of each bit (2 → 0)', showIndices: false });
const SUBS = Array.from({ length: 1 << N3 }, (_, mask) => {
  const items = [];
  for (let i = 0; i < N3; i++) if (mask & (1 << i)) items.push('abc'[i]);
  return { mask, items };
});
const subRows = SUBS.map((s) => [String(s.mask), bstr(s.mask, N3), s.items.join('') || '∅']);
const subTable = (k) =>
  table(subRows.map((r) => r[0]), ['bits', 'set'], subRows.map((r, i) => (i <= k ? r.slice(1) : ['?', '?'])), subRows.map((r, i) => (i === k ? ['active', 'active'] : i < k ? ['done', 'done'] : ['', ''])), 'mask → subset');
const WITH_C = SUBS.filter((s) => s.items.includes('c')).length;
check(SUBS.length === 8 && WITH_C === 4, '4 of 8 subsets contain item 2');
const FIRST_OF_6 = SUBS[6].items[0];
check(FIRST_OF_6 === 'b', 'mask 6: inner loop finds item 1 first');

// ---------- Gray code, the lesson's code ----------
const toGray = (i) => i ^ (i >> 1);
const grayCode = (n) => Array.from({ length: 1 << n }, (_, i) => i ^ (i >> 1));
function inverseGray(g) {
  let i = 0;
  for (; g !== 0; g >>= 1) i ^= g;
  return i;
}
const G3 = grayCode(3);
check(G3.join() === '0,1,3,2,6,7,5,4', 'grayCode(3)');
G3.forEach((g, i) => check(inverseGray(g) === i, `inverse of g(${i})`));
const lowChange = (a, b) => Math.log2(a ^ b);

// reflect-and-prefix table: column n holds Gray(n) as strings
const refl = [['0', '1']];
for (let n = 2; n <= 3; n++) refl.push([...refl.at(-1).map((s) => '0' + s), ...refl.at(-1).slice().reverse().map((s) => '1' + s)]);
refl[2].forEach((s, i) => check(parseInt(s, 2) === G3[i], `reflect row ${i}`));
// show: per column, how many rows are filled and which rows glow
const reflTable = (show) =>
  table(
    G3.map((_, i) => String(i)),
    ['n=1', 'n=2', 'n=3'],
    G3.map((_, i) => show.map((s, c) => (i < s.upto ? refl[c][i] : ''))),
    G3.map((_, i) => show.map((s) => (i >= s.from && i < s.to ? s.st : i < s.upto ? 'done' : ''))),
    'position → code',
  );
const fill = (upto, from = upto, st = 'done', to = upto) => ({ upto, from, st, to });
const none = fill(0);

// formula frames for one i
const formulaFrames = (i, say) => {
  const s = i >> 1;
  const g = i ^ s;
  const diff = hl(3, (k) => (bitsOf(g, 3)[k] ? 'done' : ''));
  return [
    { say: say[0], note: `i = ${i} = ${bstr(i, 3)}. Shift right by 1: ${bstr(s, 3)}.`, panels: [bitP(i, 3, { label: `i = ${i}` }), bitP(s, 3, { label: `i >> 1 = ${s}` })] },
    { say: say[1], note: `XOR: ${bstr(i, 3)} ^ ${bstr(s, 3)} = ${bstr(g, 3)} = ${g}. Each 1 marks a bit of i that differs from the bit to its left.`, panels: [bitP(i, 3, { label: `i = ${i}` }), bitP(s, 3, { label: `i >> 1 = ${s}` }), bitP(g, 3, { label: `g(${i}) = ${g}`, highlights: diff })] },
  ];
};
check(toGray(6) === 5 && toGray(3) === 2, 'g(6) = 5, g(3) = 2');
const stepFrame = (i, say) => {
  const a = G3[i];
  const b = G3[(i + 1) % 8];
  const bit = lowChange(a, b);
  check(Number.isInteger(bit), `g(${i}) → next differs in one bit`);
  return {
    say,
    note: `${bstr(a, 3)} → ${bstr(b, 3)}: only bit ${bit} changes.${i === 7 ? ' Last back to first: still one bit.' : ''}`,
    panels: [bitP(a, 3, { label: `g(${i}) = ${a}` }), bitP(b, 3, { label: `g(${(i + 1) % 8}) = ${b}`, highlights: { [at(bit, 3)]: 'active' } })],
  };
};
const SEAM_BIT = lowChange(G3[3], G3[4]);
check(SEAM_BIT === 2, 'seam flips bit 2');

// optimized-gray: the moves, and the loop
const legal = (cur, b) => b === 0 || (((cur >> (b - 1)) & 1) === 1 && (cur & ((1 << (b - 1)) - 1)) === 0);
function pathToZero(n) {
  const k = inverseGray(n);
  const moves = [];
  for (let p = k; p > 0; p--) {
    const from = G3[p];
    const to = G3[p - 1];
    const b = lowChange(from, to);
    check(legal(from, b), `move ${from} → ${to} is legal`);
    moves.push({ from, to, b });
  }
  return moves;
}
const moveFrame = (m, k, total) => ({
  note:
    m.b === 0
      ? `Move ${k + 1}: flip bit 0 (always allowed). ${bstr(m.from, 3)} → ${bstr(m.to, 3)}.`
      : `Move ${k + 1}: flip bit ${m.b}: bit ${m.b - 1} is 1${m.b > 1 ? ' and the bits below it are 0' : ''}. ${bstr(m.from, 3)} → ${bstr(m.to, 3)}.${k === total - 1 ? '' : ''}`,
  panels: [bitP(m.to, 3, { label: `n = ${m.to}`, highlights: { [at(m.b, 3)]: 'active' } }), vars({ moves: k + 1 })],
});
const P6 = pathToZero(6);
check(P6.length === 4 && inverseGray(6) === 4, '6 → 0 in 4 moves');
const P4 = pathToZero(4);
check(P4.length === 7 && P4[0].b === 0 && P4[0].to === 5, '4 → 0 starts by flipping bit 0, 7 moves');
const loopRun = (n) => {
  const out = [];
  let ans = 0;
  for (; n !== 0; n >>= 1) {
    ans ^= n;
    out.push({ n, ans });
  }
  return out;
};
const L6 = loopRun(6);
check(L6.at(-1).ans === 4, 'loop on 6 gives 4');
check(inverseGray(3) === 2, 'n = 3 needs 2 moves');

// template-gray: inverseGray(5), logged
const INV5 = (() => {
  const out = [];
  let i = 0;
  for (let g = 5; g !== 0; g >>= 1) {
    i ^= g;
    out.push({ g, i });
  }
  return out;
})();
check(INV5.at(-1).i === 6 && G3[6] === 5, 'inverseGray(5) = 6');
check(inverseGray(3) === 2 && G3[2] === 3, 'inverseGray(3) = 2');

// implementation-gray: the lesson's grayReflect, logged
function grayReflectRun(n) {
  const res = [0];
  const log = [];
  for (let k = 0; k < n; k++) {
    const top = 1 << k;
    for (let i = res.length - 1; i >= 0; i--) {
      res.push(res[i] | top);
      log.push({ k, top, i, res: res.slice() });
    }
  }
  return { res, log };
}
const GR = grayReflectRun(3);
check(GR.res.join() === G3.join(), 'grayReflect(3) equals the formula');
const grFrame = (s) => ({
  note: `k = ${s.k}, top = ${s.top}: read res[${s.i}] = ${s.res[s.i]}, push ${s.res[s.i]} | ${s.top} = ${s.res.at(-1)}.`,
  panels: [
    arr(s.res, { label: 'res', pointers: [ptr(s.i, 'i'), ptr(s.res.length - 1, 'new', 'b')], highlights: { [s.i]: 'visited', [s.res.length - 1]: 'active' } }),
    vars({ k: s.k, top: s.top }),
  ],
});
const GR_K2 = GR.log.findIndex((s) => s.k === 2);
check(GR.log[GR_K2].i === 3, 'round k = 2 reads index 3 first');
const ROUND3 = grayReflectRun(4).log.filter((s) => s.k === 3).length;
check(ROUND3 === 8, 'round k = 3 pushes 8');

// ---------- binary trie (the lesson's insert / maxXor, ids = '^' + bit prefix) ----------
const kidIds = (ids, id) => [id + '0', id + '1'].filter((k) => ids.has(k));
function layoutOf(ids) {
  let leaf = 0;
  const pos = {};
  const place = (id, d) => {
    const ks = kidIds(ids, id);
    const x = ks.length ? ks.map((k) => place(k, d + 1)).reduce((a, b) => a + b, 0) / ks.length : leaf++;
    pos[id] = { x, y: d };
    return x;
  };
  place('^', 0);
  return pos;
}
function trieP(ids, pos, { st = {}, path = [], label } = {}) {
  const nodes = [];
  const edges = [];
  for (const [id, p] of Object.entries(pos)) {
    if (!ids.has(id)) {
      nodes.push({ id, label: '', x: p.x, y: p.y, state: 'hidden' });
      continue;
    }
    nodes.push({ id, label: id === '^' ? 'root' : id.slice(-1), x: p.x, y: p.y, ...(st[id] ? { state: st[id] } : {}) });
    if (id !== '^') edges.push({ from: id.slice(0, -1), to: id, ...(path.includes(id) ? { state: 'active' } : {}) });
  }
  return { kind: 'nodes', ...(label ? { label } : {}), nodes, edges };
}
function insertBits(ids, x, n) {
  let id = '^';
  const made = [];
  const path = [];
  for (let b = n - 1; b >= 0; b--) {
    const nx = id + ((x >> b) & 1);
    if (!ids.has(nx)) {
      ids.add(nx);
      made.push(nx);
    }
    id = nx;
    path.push(id);
  }
  return { made, path };
}
const buildIds = (nums, n) => {
  const ids = new Set(['^']);
  nums.forEach((x) => insertBits(ids, x, n));
  return ids;
};
function maxXorRun(ids, x, n) {
  let id = '^';
  let res = 0;
  const steps = [];
  const path = [];
  for (let b = n - 1; b >= 0; b--) {
    const want = ((x >> b) & 1) ^ 1;
    const win = ids.has(id + want);
    if (win) {
      res |= 1 << b;
      id += want;
    } else id += want ^ 1;
    path.push(id);
    steps.push({ b, t: want ^ 1, want, win, res, id, path: path.slice() });
  }
  return { steps, res, partner: parseInt(id.slice(1), 2) };
}
const brute = (nums, x) => Math.max(...nums.map((y) => x ^ y));
const stOf = (pairs) => Object.fromEntries(pairs.flatMap(([list, s]) => list.map((id) => [id, s])));
const insertFrame = (ids, pos, x, n, say) => {
  const { made, path } = insertBits(ids, x, n);
  const reused = path.filter((id) => !made.includes(id));
  return {
    say,
    note: `Insert ${x} = ${bstr(x, n)}, top bit first.${reused.length ? ` Reuse ${reused.length} node${reused.length > 1 ? 's' : ''}, create ${made.length}.` : ` Create ${made.length} nodes.`}`,
    panels: [trieP(ids, pos, { st: stOf([[reused, 'visited'], [made, 'active']]), path }), bitP(x, n, { label: `${x} in bits` })],
  };
};
const queryFrames = (ids, pos, x, n, say) => {
  const q = maxXorRun(ids, x, n);
  return {
    ...q,
    frames: q.steps.map((s, k) => ({
      say: say[s.win ? 0 : 1],
      note: s.win
        ? `Bit ${s.b}: x has ${s.t}, want ${s.want}. It exists: go there, res |= ${1 << s.b}. res = ${s.res}.`
        : `Bit ${s.b}: x has ${s.t}, want ${s.want}. Missing: follow ${s.t}. res = ${s.res}.${k === n - 1 ? '' : ''}` ,
      panels: [
        trieP(ids, pos, { st: { ...stOf([[s.path.slice(0, -1), 'visited']]), [s.id]: s.win ? 'done' : 'bad' }, path: s.path }),
        bitP(x, n, { label: `x = ${x}`, pointers: [ptr(k, `b${s.b}`)], highlights: hl(n, (i) => (i < k ? 'visited' : i === k ? 'active' : '')) }),
        vars({ want: s.want, res: s.res }),
      ],
    })),
  };
};

// intuition-trie: 3 bits, numbers 2, 3, 5
const IT_NUMS = [2, 3, 5];
const IT_FULL = buildIds(IT_NUMS, 3);
const IT_POS = layoutOf(IT_FULL);
check(IT_FULL.size === 8, 'trie of 2, 3, 5 has 8 nodes with the root');
const IT_IDS = new Set(['^']);
const IT_BUILD = IT_NUMS.map((x) => insertFrame(IT_IDS, IT_POS, x, 3, 1));
const IT_Q6 = queryFrames(IT_FULL, IT_POS, 6, 3, [2, 3]);
check(IT_Q6.res === 5 && IT_Q6.partner === 3 && brute(IT_NUMS, 6) === 5, 'x = 6 → 5 with 3');
const IT_Q1 = maxXorRun(IT_FULL, 1, 3);
check(IT_Q1.res === 4 && IT_Q1.partner === 5 && brute(IT_NUMS, 1) === 4, 'x = 1 → 4 with 5');

// optimized-trie: offline queries
const OT_NUMS = [3, 1, 4, 2];
const OT_Q = [
  [5, 6],
  [3, 0],
  [1, 3],
];
const OT_SORTED = OT_NUMS.slice().sort((a, b) => a - b);
const OT_ORDER = OT_Q.map((q, idx) => ({ x: q[0], m: q[1], idx })).sort((a, b) => a.m - b.m);
const OT_POS = layoutOf(buildIds(OT_SORTED, 3));
const qs = (q) => `[${q.x}, ${q.m}]`;
const OT = (() => {
  const ids = new Set(['^']);
  const ans = OT_Q.map(() => '?');
  let p = 0;
  const frames = [];
  const numsP = (hot) => arr(OT_SORTED, { label: 'nums sorted', pointers: p < OT_SORTED.length ? [ptr(p, 'p')] : [], highlights: hl(OT_SORTED.length, (i) => (i === hot ? 'active' : i < p ? 'done' : '')) });
  const ansP = (hot) => arr(ans.slice(), { label: 'ans (original order)', highlights: hot === undefined ? {} : { [hot]: 'active' } });
  const per = [];
  for (const q of OT_ORDER) {
    const start = frames.length;
    while (p < OT_SORTED.length && OT_SORTED[p] <= q.m) {
      const x = OT_SORTED[p];
      const { made, path } = insertBits(ids, x, 3);
      p++;
      frames.push({ note: `Query ${qs(q)}: ${x} ≤ ${q.m}, insert it.`, panels: [numsP(p - 1), trieP(ids, OT_POS, { st: stOf([[made, 'active']]), path }), ansP()] });
    }
    let res;
    if (ids.size === 1) {
      res = -1;
      ans[q.idx] = res;
      frames.push({ note: `Query ${qs(q)}: no number is ≤ ${q.m}. The trie is empty, so ans[${q.idx}] = −1.`, panels: [numsP(), trieP(ids, OT_POS), ansP(q.idx)] });
    } else {
      const r = maxXorRun(ids, q.x, 3);
      res = r.res;
      ans[q.idx] = res;
      frames.push({ note: `Query ${qs(q)}: walk for x = ${q.x}. Best partner ${r.partner}: ${q.x} ^ ${r.partner} = ${res}. Write ans[${q.idx}].`, panels: [numsP(), trieP(ids, OT_POS, { st: stOf([[r.steps.map((s) => s.id), 'done']]), path: r.steps.map((s) => s.id) }), ansP(q.idx)] });
      check(res === brute(OT_SORTED.filter((y) => y <= q.m), q.x), `query ${qs(q)}`);
    }
    per.push({ q, res, frames: frames.slice(start) });
  }
  return { ans, per };
})();
check(OT.ans.join() === '7,-1,3', 'answers [7, -1, 3]');
check(OT_ORDER.map(qs).join() === '[3, 0],[1, 3],[5, 6]', 'sorted by m');
const OT_LAST = OT.per[2];
const qTable = table(['q0', 'q1', 'q2'], ['x', 'm'], OT_Q.map((q) => q.map(String)), undefined, 'queries');

// template-trie: the lesson's flat arrays zero / one, BITS = 3
const TT_BITS = 3;
const TT = (() => {
  const zero = [0];
  const one = [0];
  const log = [];
  const snapP = (hot) => [
    arr(zero.slice(), { label: 'zero[node]', highlights: hot && hot.arr === 'zero' ? { [hot.i]: hot.st } : {} }),
    arr(one.slice(), { label: 'one[node]', highlights: hot && hot.arr === 'one' ? { [hot.i]: hot.st } : {} }),
  ];
  function insert(x) {
    const out = [];
    let node = 0;
    for (let b = TT_BITS - 1; b >= 0; b--) {
      const bit = (x >> b) & 1;
      const kids = bit ? one : zero;
      const name = bit ? 'one' : 'zero';
      let made = false;
      if (!kids[node]) {
        zero.push(0);
        one.push(0);
        kids[node] = zero.length - 1;
        made = true;
      }
      out.push({ b, bit, node, name, made, to: kids[node], panels: [...snapP({ arr: name, i: node, st: made ? 'active' : 'visited' }), vars({ x, b, node: kids[node] })] });
      node = kids[node];
    }
    return out;
  }
  function bestXor(x) {
    const out = [];
    let node = 0;
    let res = 0;
    for (let b = TT_BITS - 1; b >= 0; b--) {
      const bit = (x >> b) & 1;
      const opposite = bit ? zero : one;
      const oname = bit ? 'zero' : 'one';
      const from = node;
      const win = !!opposite[node];
      if (win) {
        res |= 1 << b;
        node = opposite[node];
      } else node = (bit ? one : zero)[node];
      out.push({ b, bit, from, oname, win, res, node, panels: [...snapP({ arr: oname, i: from, st: win ? 'done' : 'bad' }), vars({ b, node, res })] });
    }
    return { out, res };
  }
  const i5 = insert(5);
  const i6 = insert(6);
  const q3 = bestXor(3);
  return { i5, i6, q3, zero, one };
})();
check(TT.zero.join() === '0,2,0,0,5,0' && TT.one.join() === '1,4,3,0,0,0', 'flat arrays after 5, 6');
const TT_FIRST_NEW = TT.i6.find((s) => s.made);
check(TT_FIRST_NEW.name === 'one' && TT_FIRST_NEW.node === 1, 'inserting 6 first writes one[1]');
check(TT.q3.res === 6 && brute([5, 6], 3) === 6, 'bestXor(3) = 6');
const ttInsNote = (x, s) => `Bit ${s.b} of ${x} is ${s.bit} → look in ${s.name}[${s.node}]. ${s.made ? `Empty: push a node, ${s.name}[${s.node}] = ${s.to}.` : `Already ${s.to}: follow it.`}`;

// ---------- dry run: Single Number III, the lesson's table ----------
const DR = [1, 2, 1, 3, 2, 5];
const DR_X = (() => {
  let x = 0;
  return DR.map((v) => (x ^= v));
})();
const DR_ALL = DR_X.at(-1);
const DR_LOW = DR_ALL & -DR_ALL;
const DR_SET = DR.filter((v) => v & DR_LOW);
const DR_CLR = DR.filter((v) => !(v & DR_LOW));
const xr = (a) => a.reduce((p, v) => p ^ v, 0);
check(DR_ALL === 6 && (3 ^ 5) === 6 && DR_LOW === 2 && DR_SET.join() === '2,3,2' && DR_CLR.join() === '1,1,5' && xr(DR_SET) === 3 && xr(DR_CLR) === 5, 'dry run table');
check(((-6) & 7) === 2, 'low 3 bits of -6 are 010');
const drGroup = (inSet) => hl(DR.length, (i) => (!!(DR[i] & DR_LOW) === inSet ? 'active' : 'muted'));

// ---------- mistakes ----------
const NEG = (() => {
  const out = [];
  let x = -4;
  for (let k = 0; k < 4; k++) {
    out.push(x);
    x >>= 1;
  }
  return out;
})();
check(NEG.join() === '-4,-2,-1,-1', '>> on -4 sticks at -1');
check(-4 >>> 1 === 2147483646, '-4 >>> 1');
check(1 << 32 === 1 && 1 << 33 === 2, 'shift counts mod 32');

// ---------- interview tips ----------
check((10 ^ 10) === 0 && (10 & 9) === 8, 'tiny identities on 10');
check(8 - 1 === 0b0111, '2^3 - 1 = 7');

export default {
  'intuition-mask': [
    {
      kind: 'watch',
      title: 'A word becomes a number',
      lines: ['Letter → index `ch.charCodeAt(0) − 97`; set that bit.', '"abc" and "cab" give the same number: order vanishes.'],
      frames: [
        ...CAB,
        { say: 1, note: `"abc" sets the same three bits: ${letterMask('abc')}. Order (and repeats) leave no trace.`, panels: [KEY8, bitP(7, 8, { label: '"abc" = 7', highlights: onBits(7, 8, 'done') })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Set operations are bit operations',
      lines: ['Add i: `m | (1 << i)`.', 'Contains i: `(m >> i) & 1`.', 'Remove i: `m & ~(1 << i)`.', 'Union `a | b`, intersection `a & b`.', 'Size = popcount: count the 1s.'],
      frames: [
        { say: 0, note: `Four items, bits 3 → 0. m = ${S0} holds items 0 and 2.`, panels: [bitP(S0, 4, { label: `m = ${S0}`, highlights: onBits(S0, 4, 'done') })] },
        { say: 0, note: `Add item 1: ${S0} | 2 = ${S_ADD}.`, panels: [bitP(S_ADD, 4, { label: `m = ${S_ADD}`, highlights: { [at(1, 4)]: 'active' } })] },
        { say: 1, note: `Contains 2? (${S_ADD} >> 2) & 1 = ${S_HAS}: yes.`, panels: [bitP(S_ADD, 4, { label: `m = ${S_ADD}`, highlights: { [at(2, 4)]: 'visited' } }), vars({ 'has 2': S_HAS })] },
        { say: 2, note: `Remove item 2: ${S_ADD} & ~4 = ${S_REM}.`, panels: [bitP(S_REM, 4, { label: `m = ${S_REM}`, highlights: { [at(2, 4)]: 'bad' } })] },
        {
          say: 3,
          note: `With b = ${SB}: a | b = ${S_REM | SB}, a & b = ${S_REM & SB}. Not 0, so not disjoint.`,
          panels: [bitP(S_REM, 4, { label: `a = ${S_REM}` }), bitP(SB, 4, { label: `b = ${SB}` }), bitP(S_REM & SB, 4, { label: `a & b = ${S_REM & SB}`, highlights: onBits(S_REM & SB, 4) })],
        },
        { say: 4, note: `Size of a = ${S_REM}: two 1s, so 2 items.`, panels: [bitP(S_REM, 4, { label: `a = ${S_REM}`, highlights: onBits(S_REM, 4, 'done') }), vars({ size: popcount(S_REM) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: remove item 1',
      lines: [`m = ${RM} = ${bstr(RM, 4)} (bits 3 → 0).`, 'Run `m & ~(1 << 1)`.'],
      panels: [bitP(RM, 4, { label: `m = ${RM}` })],
      task: { type: 'cell', question: 'Which cell turns to 0?', answer: at(1, 4), hints: { [at(3, 4)]: 'This is bit 3. Count from the right, starting at 0.', [at(0, 4)]: 'This is bit 0, the rightmost.', [at(2, 4)]: 'Bit 2 is already 0.' } },
      solved: `~(1 << 1) has every bit set except bit 1, so only bit 1 clears: m = ${RM_AFTER}.`,
      then: [{ note: `${RM} & ~2 = ${RM_AFTER} = ${bstr(RM_AFTER, 4)}.`, panels: [bitP(RM_AFTER, 4, { label: `m = ${RM_AFTER}`, highlights: { [at(1, 4)]: 'bad' } })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: mask of "bead"',
      lines: ['Letters b, e, a, d → indexes 1, 4, 0, 3.'],
      panels: [KEY8, bitP(0, 8, { label: 'm = 0' })],
      task: { type: 'number', question: 'What number is the mask of "bead"?', options: [15, BEAD, 30, 23], answer: BEAD, hint: 'Add 2^i for each letter index: 2 + 16 + 1 + 8.' },
      solved: `Bits 0, 1, 3, 4 are set: 1 + 2 + 8 + 16 = ${BEAD}.`,
      then: [{ note: `"bead" = ${BEAD}.`, panels: [KEY8, bitP(BEAD, 8, { label: `"bead" = ${BEAD}`, highlights: onBits(BEAD, 8, 'done') })] }],
    },
  ],

  'optimized-mask': [
    {
      kind: 'watch',
      title: 'One AND per pair',
      lines: ['Brute force compares two words letter by letter.', 'Build one 26-bit mask per word, once.', 'Then each pair test is `(mask[i] & mask[j]) === 0`.'],
      frames: [
        { say: 0, note: `Words: ${OPT_WORDS.join(', ')}. Letter-by-letter pair checks cost O(n² · L).`, panels: [optTable(-1)] },
        ...OPT_WORDS.map((w, k) => ({ say: 1, note: `Mask of "${w}" = ${OPT_MASKS[k]}.`, panels: [optTable(k)] })),
        {
          say: 2,
          note: `"abba" & "bcd" = ${OPT_MASKS[1] & OPT_MASKS[2]}: not 0, they share b.`,
          panels: [bitP(OPT_MASKS[1], 8, { label: '"abba" = 3', highlights: onBits(OPT_MASKS[1] & OPT_MASKS[2], 8, 'bad') }), bitP(OPT_MASKS[2], 8, { label: '"bcd" = 14', highlights: onBits(OPT_MASKS[1] & OPT_MASKS[2], 8, 'bad') })],
        },
        { say: 2, note: `"ab" & "efgh" = ${OPT_MASKS[0] & OPT_MASKS[3]}: no common letter, one AND told us.`, panels: [bitP(OPT_MASKS[0], 8, { label: '"ab" = 3' }), bitP(OPT_MASKS[3], 8, { label: '"efgh" = 240' })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Same mask? Keep the longest',
      lines: ['"ab" and "abba" have the same mask.', '`Map(mask → maxLen)` keeps only the longest length.'],
      frames: [
        { say: 0, note: `"ab" and "abba" both have mask ${OPT_MASKS[0]}.`, panels: [optTable(3)] },
        ...OPT_ENTRIES.map(([m, l], k) => ({ say: 1, note: `Mask ${m} → ${l}.${m === OPT_MASKS[0] ? ' "abba" (4) beats "ab" (2).' : ''}`, panels: [mapTable(k, k)] })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: how many pair tests now?',
      lines: [`${OPT_WORDS.length} words gave ${OPT_ENTRIES.length} distinct masks.`],
      panels: [mapTable(OPT_ENTRIES.length - 1)],
      task: { type: 'number', question: 'How many pairs does the loop test over the Map?', options: [2, OPT_PAIRS, 4, 6], answer: OPT_PAIRS, hint: 'Pairs of 3 entries: 3 · 2 / 2.' },
      solved: `3 entries → 3 pairs, down from 6 for the 4 words.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the best pair',
      lines: ['Map: 3 → 4, 14 → 3, 240 → 4.'],
      panels: [mapTable(OPT_ENTRIES.length - 1)],
      task: {
        type: 'choose',
        question: 'Which pair gives the answer?',
        options: [
          { text: 'mask 3 with mask 240: 4 × 4 = 16', why: '' },
          { text: 'mask 14 with mask 240: 3 × 4 = 12', why: 'Disjoint, but 12 < 16.' },
          { text: 'mask 3 with mask 14: 4 × 3 = 12', why: '3 & 14 = 2: they share b, so this pair is skipped.' },
          { text: '"ab" with "efgh": 2 × 4 = 8', why: 'The Map kept the longer word for mask 3 ("abba", length 4).' },
        ],
        answer: 0,
      },
      solved: `3 & 240 = 0, and the Map stores 4 for mask 3: best = ${OPT_BEST}.`,
    },
  ],

  'template-mask': [
    {
      kind: 'watch',
      title: 'Every mask is a subset',
      lines: ['`mask` runs from 0 to `(1 << n) − 1`.', 'Inner loop: item i is in when `mask & (1 << i)` is not 0.'],
      frames: SUBS.map((s, k) => ({
        say: k === 0 ? 0 : 1,
        note: `mask = ${s.mask} = ${bstr(s.mask, 3)} → ${s.items.length ? `{${s.items.join(', ')}}` : 'the empty set'}.`,
        panels: [KEY3, bitP(s.mask, 3, { label: `mask = ${s.mask}`, highlights: onBits(s.mask, 3) }), subTable(k)],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: count subsets with c',
      lines: ['n = 3 items: a = bit 0, b = bit 1, c = bit 2.'],
      panels: [subTable(7)],
      task: { type: 'number', question: 'How many of the 8 masks contain c (item 2)?', options: [2, 3, WITH_C, 8], answer: WITH_C, hint: 'Bit 2 is 1 in exactly half of all masks.' },
      solved: `Masks 4, 5, 6, 7 have bit 2 set: ${WITH_C} of 8.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: the inner loop on mask 6',
      lines: ['mask = 6 = 110.', 'i counts up from 0.'],
      panels: [bitP(6, 3, { label: 'mask = 6' }), KEY3],
      task: { type: 'cell', question: 'Which bit does the inner loop report first?', answer: at(1, 3), hints: { [at(2, 3)]: 'Bit 2 is in the set, but i starts at 0, so a lower bit is found first.', [at(0, 3)]: '6 & 1 = 0: bit 0 is not set.' } },
      solved: `i = 0: 6 & 1 = 0. i = 1: 6 & 2 = 2, so item ${FIRST_OF_6} comes first, then c.`,
    },
  ],

  'implementation-mask': [
    {
      kind: 'watch',
      title: 'maxProduct, pair by pair',
      lines: ['`masks = words.map(letterMask)`.', 'Every pair i < j: test `(masks[i] & masks[j]) === 0`.', 'Disjoint → `best = max(best, len_i × len_j)`.'],
      frames: [
        { say: 0, note: `Words ${IMP_WORDS.join(', ')} → masks ${IMP.masks.join(', ')}.`, panels: [table(IMP_WORDS, ['mask', 'len'], IMP_WORDS.map((w, i) => [String(IMP.masks[i]), String(w.length)]))] },
        ...IMP.log.slice(0, IMP_TURN).map((s) => impFrame(s, s.and === 0 ? 2 : 1)),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: "de" and "ad"',
      lines: [`best is ${IMP.log[IMP_TURN - 1].best} so far.`, `"de" = ${IMP.masks[1]}, "ad" = ${IMP.masks[2]}.`],
      panels: [bitP(IMP.masks[1], 8, { label: '"de" = 24' }), bitP(IMP.masks[2], 8, { label: '"ad" = 9' })],
      task: { type: 'number', question: 'What is masks[i] & masks[j] here?', options: [0, IMP.log[IMP_TURN].and, 24, 9], answer: IMP.log[IMP_TURN].and, hint: 'Keep only the bits set in both rows.' },
      solved: `Both have bit 3 (d): 24 & 9 = 8, not 0, so the pair is skipped. Final best = ${IMP.best} ("abc" × "fgh").`,
      then: bare(IMP.log.slice(IMP_TURN).map((s) => impFrame(s))),
    },
  ],

  'intuition-gray': [
    {
      kind: 'watch',
      title: 'Reflect and prefix',
      lines: ['Start with n = 1: 0, 1.', 'Write the list forwards with a 0 in front.', 'Then backwards with a 1 in front.', 'The seam is safe: only the new top bit changes there.'],
      frames: [
        { say: 0, note: 'Gray(1) = 0, 1.', panels: [reflTable([fill(2), none, none])] },
        { say: 1, note: 'n = 2: forwards with prefix 0 → 00, 01.', panels: [reflTable([fill(2), fill(2, 0, 'active'), none])] },
        { say: 2, note: 'Backwards with prefix 1 → 11, 10.', panels: [reflTable([fill(2), fill(4, 2, 'active'), none])] },
        { say: 1, note: 'n = 3: forwards with prefix 0.', panels: [reflTable([fill(2), fill(4), fill(4, 0, 'active')])] },
        { say: 2, note: 'Backwards with prefix 1.', panels: [reflTable([fill(2), fill(4), fill(8, 4, 'active')])] },
        { say: 3, note: `Rows 3 and 4: ${refl[2][3]} → ${refl[2][4]}. The reversed half starts where the forward half ended.`, panels: [reflTable([fill(2), fill(4), fill(8, 3, 'active', 5)])] },
      ],
    },
    {
      kind: 'watch',
      title: 'The same list from g(i) = i ^ (i >> 1)',
      lines: ['Shift i right by one.', 'XOR: bit k of g is 1 when bits k and k+1 of i differ.'],
      frames: [...formulaFrames(6, [0, 1]), ...formulaFrames(3, [0, 1])],
    },
    {
      kind: 'watch',
      title: 'Neighbours differ in one bit',
      lines: ['Walk the list: exactly one bit flips each step.'],
      frames: [0, 1, 2].map((i) => stepFrame(i, 0)),
    },
    {
      kind: 'turn',
      title: 'Your turn: cross the seam',
      lines: [`g(3) = ${bstr(G3[3], 3)}, g(4) = ${bstr(G3[4], 3)}.`],
      panels: [bitP(G3[3], 3, { label: `g(3) = ${G3[3]}` }), bitP(G3[4], 3, { label: `g(4) = ${G3[4]}` })],
      task: { type: 'cell', question: 'Which bit changes from g(3) to g(4)?', answer: at(SEAM_BIT, 3), hints: { [at(1, 3)]: 'Bit 1 is 1 in both.', [at(0, 3)]: 'Bit 0 is 0 in both.' } },
      solved: 'Only the new top bit: the mirrored half starts where the forward half ended.',
      then: bare([3, 4, 5, 6, 7].map((i) => stepFrame(i))),
    },
  ],

  'optimized-gray': [
    {
      kind: 'watch',
      title: 'Moves from 6 to 0',
      lines: ['Flip bit 0, always allowed.', 'Flip bit i if bit i−1 is 1 and the bits below are 0.', 'These moves walk the Gray list backwards to g(0) = 0.'],
      frames: [
        { say: 2, note: `n = 6 = 110 = g(${inverseGray(6)}).`, panels: [bitP(6, 3, { label: 'n = 6' }), vars({ moves: 0 })] },
        ...P6.map((m, k) => ({ ...moveFrame(m, k, P6.length), say: m.b === 0 ? 0 : 1 })),
      ],
    },
    {
      kind: 'watch',
      title: 'Count without walking: inverse Gray',
      lines: ['`ans ^= n`, then `n >>= 1`, until n is 0.', 'ans is n\'s position in the Gray list = fewest moves.'],
      frames: [
        ...L6.map((s, k) => ({ say: 0, note: `ans ^= ${s.n} → ${s.ans}. Shift: n = ${s.n >> 1}.`, panels: [bitP(s.n, 3, { label: `n = ${s.n}` }), bitP(s.ans, 3, { label: `ans = ${s.ans}`, highlights: onBits(s.ans, 3) }), vars({ step: k + 1 })] })),
        { say: 1, note: `ans = ${L6.at(-1).ans}: the same 4 moves as the walk.`, panels: [bitP(L6.at(-1).ans, 3, { label: `ans = ${L6.at(-1).ans}`, highlights: onBits(L6.at(-1).ans, 3, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: first move from 100',
      lines: ['n = 4 = 100. You want to reach 0.'],
      panels: [bitP(4, 3, { label: 'n = 4' })],
      task: {
        type: 'choose',
        question: 'Which move does the shortest path make first?',
        options: [
          { text: 'Flip bit 2 → 000', why: 'Not allowed: bit 1 is 0, so bit 2 cannot flip.' },
          { text: 'Flip bit 0 → 101', why: '' },
          { text: 'Flip bit 1 → 110', why: 'Not allowed: bit 0 is 0, so bit 1 cannot flip.' },
        ],
        answer: 1,
      },
      solved: `The path goes up before it comes down: ${P4.length} moves in all (inverse Gray of 4 = ${inverseGray(4)}).`,
      then: P4.map((m, k) => moveFrame(m, k, P4.length)),
    },
    {
      kind: 'turn',
      title: 'Your turn: n = 3',
      lines: ['n = 3 = 011.'],
      panels: [bitP(3, 3, { label: 'n = 3' })],
      task: { type: 'number', question: 'Fewest moves to reach 0?', options: [1, inverseGray(3), 3, 4], answer: inverseGray(3), hint: 'ans = 3 ^ 1.' },
      solved: '3 ^ 1 = 2: 011 → 001 (flip bit 1) → 000 (flip bit 0).',
    },
  ],

  'template-gray': [
    {
      kind: 'watch',
      title: 'grayCode(3) with Array.from',
      lines: ['`Array.from({ length: 1 << n }, (_, i) => i ^ (i >> 1))`.'],
      frames: [1, 3, 5, 7].map((k) => ({
        say: 0,
        note: `i = ${k - 1}: ${k - 1} ^ ${(k - 1) >> 1} = ${G3[k - 1]}. i = ${k}: ${k} ^ ${k >> 1} = ${G3[k]}.`,
        panels: [arr(G3.slice(0, k + 1), { label: 'grayCode(3)', highlights: { [k - 1]: 'active', [k]: 'active' } })],
      })),
    },
    {
      kind: 'watch',
      title: 'inverseGray(5): prefix XOR',
      lines: ['`i ^= g`, then `g >>= 1`, until g is 0.', 'i is the position of g in the list.'],
      frames: [
        ...INV5.map((s) => ({ say: 0, note: `i ^= ${s.g} → ${s.i}. Shift: g = ${s.g >> 1}.`, panels: [bitP(s.g, 3, { label: `g = ${s.g}` }), bitP(s.i, 3, { label: `i = ${s.i}` })] })),
        { say: 1, note: `inverseGray(5) = ${INV5.at(-1).i}: grayCode(3)[6] is 5.`, panels: [arr(G3, { label: 'grayCode(3)', highlights: { 6: 'done' }, pointers: [ptr(6, 'i')] })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: inverseGray(3)',
      lines: ['g = 3 = 011.'],
      panels: [bitP(3, 3, { label: 'g = 3' }), vars({ i: 0 })],
      task: { type: 'number', question: 'What does inverseGray(3) return?', options: [1, inverseGray(3), 3, 4], answer: inverseGray(3), hint: 'i = 3, then 3 ^ 1.' },
      solved: '3 ^ 1 = 2, and grayCode(3)[2] is 3.',
    },
  ],

  'implementation-gray': [
    {
      kind: 'watch',
      title: 'Mirror and add the new bit',
      lines: ['Start with `res = [0]`.', 'Round k: `top = 1 << k`.', 'Read res backwards; push `res[i] | top`.'],
      frames: [
        { say: 0, note: 'res = [0].', panels: [arr([0], { label: 'res' }), vars({ k: '-', top: '-' })] },
        ...GR.log.slice(0, GR_K2).map((s) => ({ ...grFrame(s), say: 2 })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: round k = 2',
      lines: ['res = [0, 1, 3, 2]. top = 4.'],
      panels: [arr(GR.log[GR_K2 - 1].res, { label: 'res' }), vars({ k: 2, top: 4 })],
      task: { type: 'cell', question: 'Which index does the round read first?', answer: GR.log[GR_K2].i, hints: { 0: 'The loop runs backwards: i starts at res.length − 1.' } },
      solved: 'i = 3: res[3] | 4 = 6. Then 7, 5, 4 — the mirror with the top bit set.',
      then: GR.log.slice(GR_K2).map(grFrame),
    },
    {
      kind: 'turn',
      title: 'Your turn: one round bigger',
      lines: ['Each round reads every entry once.', 'grayReflect(4) adds a round k = 3.'],
      panels: [arr(GR.res, { label: 'res after k = 2' })],
      task: { type: 'number', question: 'How many values does round k = 3 push?', options: [4, 7, ROUND3, 16], answer: ROUND3, hint: 'It pushes one value per entry already in res.' },
      solved: 'res has 8 entries, so 8 pushes: 16 in all.',
    },
  ],

  'intuition-trie': [
    {
      kind: 'watch',
      title: 'A higher bit beats all lower bits',
      lines: ['2^k is larger than all lower bits combined (2^k − 1).'],
      frames: [
        { say: 0, note: 'Bit 2 alone: 100 = 4.', panels: [bitP(4, 3, { label: '4', highlights: { 0: 'done' } }), bitP(3, 3, { label: '3' })] },
        { say: 0, note: 'Every lower bit: 011 = 3. Still less than 4.', panels: [bitP(4, 3, { label: '4' }), bitP(3, 3, { label: '3', highlights: { 1: 'active', 2: 'active' } })] },
      ],
    },
    {
      kind: 'watch',
      title: 'Numbers as bit strings',
      lines: ['3 bits here instead of 30, to fit.', 'Each number is a path, most significant bit first.'],
      frames: IT_BUILD,
    },
    {
      kind: 'watch',
      title: 'Max XOR for x = 6',
      lines: ['From the top bit, want the opposite of x\'s bit.', 'It exists: take it, that XOR bit is 1.', 'Missing: take the same bit, that XOR bit is 0.', 'Winning a high bit is worth more than anything below.'],
      frames: [...IT_Q6.frames, { say: 3, note: `Partner ${IT_Q6.partner}: 6 ^ ${IT_Q6.partner} = ${IT_Q6.res}.`, panels: [IT_Q6.frames.at(-1).panels[0], vars({ partner: IT_Q6.partner, res: IT_Q6.res })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: x = 1',
      lines: ['Trie holds 2 (010), 3 (011), 5 (101).', 'x = 1 = 001.'],
      panels: [trieP(IT_FULL, IT_POS), bitP(1, 3, { label: 'x = 1' })],
      task: { type: 'number', question: 'What XOR does the walk find?', options: [3, IT_Q1.res, 5, 7], answer: IT_Q1.res, hint: 'Bit 2: want 1. Then check what node "1" has below it.' },
      solved: `Bit 2 is won (+4). Under "1" only 0 then 1 exist, so bits 1 and 0 are lost. Partner ${IT_Q1.partner}: 1 ^ 5 = ${IT_Q1.res}.`,
      then: bare(queryFrames(IT_FULL, IT_POS, 1, 3, [0, 0]).frames),
    },
  ],

  'optimized-trie': [
    {
      kind: 'turn',
      title: 'Your turn: answer order',
      lines: [`nums = [${OT_NUMS.join(', ')}].`, 'Each query [x, m] allows only nums ≤ m.', 'Sort queries by m and remember their index.'],
      panels: [qTable],
      task: { type: 'order', question: 'In what order are the queries answered?', items: OT_ORDER.map(qs), hint: 'Increasing m: the trie only ever grows.' },
      solved: 'm = 0, 3, 6. Each answer is written back to its original index.',
    },
    {
      kind: 'watch',
      title: 'Sweep: insert, then answer',
      lines: ['Sort nums ascending.', 'Before a query, insert every number ≤ m.', 'Empty trie → −1.', 'Write the answer to the query\'s original index.'],
      frames: [
        { say: 0, note: `nums sorted: ${OT_SORTED.join(', ')}.`, panels: [arr(OT_SORTED, { label: 'nums sorted', pointers: [ptr(0, 'p')] }), trieP(new Set(['^']), OT_POS), arr(['?', '?', '?'], { label: 'ans (original order)' })] },
        ...OT.per[0].frames.map((f) => ({ ...f, say: 2 })),
        ...OT.per[1].frames.map((f, k, a) => ({ ...f, say: k === a.length - 1 ? 3 : 1 })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: query [5, 6]',
      lines: ['Insert 4 (≤ 6). Now the trie holds 1, 2, 3, 4.', 'x = 5 = 101.'],
      panels: [OT_LAST.frames[0].panels[1], bitP(5, 3, { label: 'x = 5' })],
      task: { type: 'number', question: 'What is ans for [5, 6]?', options: [1, 5, 6, OT_LAST.res], answer: OT_LAST.res, hint: 'Want 0, then 1, then 0: does 010 exist?' },
      solved: `5 ^ 2 = ${OT_LAST.res}: all three bits won. ans = [${OT.ans.join(', ')}].`,
      then: bare(OT_LAST.frames),
    },
  ],

  'template-trie': [
    {
      kind: 'watch',
      title: 'Insert 5 into flat arrays',
      lines: ['`zero[node]`, `one[node]`: child index, 0 = none. Node 0 is the root.', 'Missing child: push a new node to both arrays.', 'Here BITS = 3 instead of 30.'],
      frames: [
        { say: 0, note: 'Only the root: zero = [0], one = [0].', panels: [arr([0], { label: 'zero[node]' }), arr([0], { label: 'one[node]' }), vars({ x: 5, node: 0 })] },
        ...TT.i5.map((s) => ({ say: s.made ? 1 : 0, note: ttInsNote(5, s), panels: s.panels })),
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: insert 6',
      lines: ['6 = 110. Bit 2 is 1: one[0] = 1 already, go to node 1.', 'Bit 1 is also 1.'],
      panels: TT.i6[0].panels.slice(0, 2),
      task: { type: 'cell', panel: 1, question: 'Which cell of one[] gets a new child index?', answer: TT_FIRST_NEW.node, hints: { 0: 'one[0] is already 1; that step only follows it.', 2: 'You are at node 1, not node 2.' } },
      solved: `one[1] was 0: push node ${TT_FIRST_NEW.to} and store it. Then zero[4] = 5 for bit 0.`,
      then: TT.i6.map((s) => ({ note: ttInsNote(6, s), panels: s.panels })),
    },
    {
      kind: 'watch',
      title: 'bestXor(3)',
      lines: ['Look in the opposite array of x\'s bit.', 'Non-zero: go there and `res |= 1 << b`.', 'Zero: follow the same bit.'],
      frames: TT.q3.out.map((s) => ({
        say: s.win ? 1 : 2,
        note: s.win ? `Bit ${s.b} of 3 is ${s.bit}: ${s.oname}[${s.from}] = ${s.node}. Go, res = ${s.res}.` : `Bit ${s.b} of 3 is ${s.bit}: ${s.oname}[${s.from}] = 0. Follow the same bit to node ${s.node}. res = ${s.res}.`,
        panels: s.panels,
      })),
    },
  ],

  'implementation-trie': [
    {
      kind: 'watch',
      title: 'Which shifts stay positive',
      lines: ['Values < 2^30 fit in 30 bits: `1 << 29` is positive.', 'With 31 bits, `1 << 30` is still fine.', 'Bit 31 would turn the result negative.'],
      frames: [
        { say: 0, note: '1 << 29: the top bit of a 30-bit value.', panels: [vars({ '1 << 29': 1 << 29 })] },
        { say: 1, note: '1 << 30: still positive.', panels: [vars({ '1 << 30': 1 << 30 })] },
        { say: 2, note: '1 << 31: the sign bit. Negative.', panels: [vars({ '1 << 31': 1 << 31 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: millions of nodes',
      lines: ['The trie may hold up to n · 30 nodes.'],
      panels: [arr(TT.zero, { label: 'zero[node]' }), arr(TT.one, { label: 'one[node]' })],
      task: {
        type: 'choose',
        question: 'What should store the children?',
        options: [
          { text: 'Arrays of child indices (or an Int32Array)', why: '' },
          { text: 'An object per node', why: 'Objects/Maps are much slower for millions of nodes.' },
          { text: 'A Map per node', why: 'Objects/Maps are much slower for millions of nodes.' },
        ],
        answer: 0,
      },
      solved: 'Index arrays like zero / one are much faster than objects or Maps.',
    },
    {
      kind: 'turn',
      title: 'Your turn: name your class',
      lines: ['The toolkit already exports a `Trie` class for words.'],
      panels: [vars({ global: 'Trie', yours: '?' })],
      task: {
        type: 'choose',
        question: 'What do you call your binary trie?',
        options: [
          { text: '`BitTrie` (or plain arrays)', why: '' },
          { text: '`Trie`', why: 'It would clash with the global Trie from the toolkit.' },
        ],
        answer: 0,
      },
      solved: 'Use `BitTrie` or plain arrays.',
    },
  ],

  'dry-run': [
    {
      kind: 'watch',
      title: 'XOR all',
      lines: ['XOR every value; pairs cancel.', '1^2^1^3^2^5 = 3^5 = 6 (110).'],
      frames: DR.map((v, i) => ({
        say: i === DR.length - 1 ? 1 : 0,
        note: `x ^= ${v} → ${DR_X[i]}.${i === DR.length - 1 ? ' Pairs 1, 2 cancelled: 3 ^ 5 = 6.' : ''}`,
        panels: [arr(DR, { label: 'nums', pointers: [ptr(i, 'v')], highlights: hl(DR.length, (k) => (k < i ? 'visited' : k === i ? 'active' : '')) }), bitP(DR_X[i], 3, { label: `x = ${DR_X[i]}` })],
      })),
    },
    {
      kind: 'watch',
      title: 'Lowest set bit',
      lines: ['`6 & −6 = 2` (010).', '3 = 011 and 5 = 101 differ at bit 1.'],
      frames: [
        { say: 0, note: '6 = 110. The last 3 bits of −6 are 010.', panels: [bitP(6, 3, { label: '6' }), bitP((-6) & 7, 3, { label: '−6 (last 3 bits)' })] },
        { say: 0, note: `6 & −6 = ${DR_LOW} = 010: only the lowest 1 survives.`, panels: [bitP(6, 3, { label: '6' }), bitP(DR_LOW, 3, { label: `6 & −6 = ${DR_LOW}`, highlights: { 1: 'active' } })] },
        { say: 1, note: 'At bit 1, 3 has 1 and 5 has 0: they land in different groups.', panels: [bitP(3, 3, { label: '3', highlights: { 1: 'active' } }), bitP(5, 3, { label: '5', highlights: { 1: 'active' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: group bit 1 set',
      lines: ['Split nums by bit 1 (`v & 2`).'],
      panels: [arr(DR, { label: 'nums', highlights: drGroup(true) }), bitP(DR_LOW, 3, { label: 'bit = 2' })],
      task: { type: 'number', question: 'XOR of the group with bit 1 set?', options: [2, xr(DR_SET), 5, 6], answer: xr(DR_SET), hint: 'The group is 2, 3, 2.' },
      solved: 'Group bit 1 set: 2, 3, 2 → 3 (the pair of 2s cancels).',
      then: [
        { note: 'Group bit 1 set: 2, 3, 2 → XOR = 3. Pair of 2s cancels.', panels: [arr(DR, { label: 'nums', highlights: drGroup(true) }), vars({ a: xr(DR_SET) })] },
        { note: 'Group bit 1 clear: 1, 1, 5 → XOR = 5. Pair of 1s cancels.', panels: [arr(DR, { label: 'nums', highlights: drGroup(false) }), vars({ b: xr(DR_CLR) })] },
        { note: 'Answer [3, 5], any order.', panels: [arr([xr(DR_SET), xr(DR_CLR)], { label: 'answer', highlights: { 0: 'done', 1: 'done' } })] },
      ],
    },
  ],

  mistakes: [
    {
      kind: 'watch',
      title: '`>>` on a negative never reaches 0',
      lines: ['`>>` keeps the sign bit, so `while (x) x >>= 1` never ends for negatives.', '`>>>` shifts in zeros instead.'],
      frames: [
        ...NEG.map((x, k) => ({ say: 0, note: k === 0 ? 'x = −4. Last 4 of its 32 bits: 1100.' : `x >>= 1 → ${x}. A 1 is shifted in at the top.${k === NEG.length - 1 ? ' Stuck at −1 forever.' : ''}`, panels: [bitP(x & 15, 4, { label: `x = ${x} (last 4 bits)`, highlights: k ? { 0: 'bad' } : {} }), vars({ x })] })),
        { say: 1, note: `−4 >>> 1 = ${-4 >>> 1}: a 0 comes in at the top, positive from here on.`, panels: [vars({ 'x >>> 1': -4 >>> 1 })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: shift counts mod 32',
      lines: ['Shift counts are taken mod 32: `1 << 32 === 1`.'],
      panels: [vars({ '1 << 32': 1 << 32 })],
      task: { type: 'number', question: 'What is `1 << 33`?', options: [0, 1, 1 << 33, 4], answer: 1 << 33, hint: '33 mod 32 = 1.' },
      solved: '33 mod 32 = 1, so 1 << 33 is 1 << 1 = 2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: insert 6 into a trie',
      lines: ['6 = 110. The walk goes one bit per level.'],
      panels: [bitP(6, 3, { label: '6' })],
      task: {
        type: 'choose',
        question: 'Which bit order must the trie path use?',
        options: [
          { text: '1, 1, 0 (bit 2 first)', why: '' },
          { text: '0, 1, 1 (bit 0 first)', why: 'LSB-first ruins the greedy: a low bit would be decided before a high one.' },
        ],
        answer: 0,
      },
      solved: 'MSB-first, so the greedy decides the most valuable bit first.',
    },
  ],

  'interview-tips': [
    {
      kind: 'watch',
      title: 'A tiny example on the board',
      lines: ['`x ^ x = 0`.', '`x & (x − 1)` drops the lowest set bit.'],
      frames: [
        { say: 0, note: '1010 ^ 1010 = 0000.', panels: [bitP(10, 4, { label: 'x = 10' }), bitP(10 ^ 10, 4, { label: 'x ^ x = 0' })] },
        { say: 1, note: '1010 & 1001 = 1000 = 8: the lowest 1 is gone.', panels: [bitP(10, 4, { label: 'x = 10', highlights: { 2: 'bad' } }), bitP(9, 4, { label: 'x − 1 = 9' }), bitP(10 & 9, 4, { label: 'x & (x − 1) = 8' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: the talk track',
      lines: ['Show the trade-off, then the 32-bit care.'],
      panels: [table(['hash map', 'bit trick'], ['space'], [['O(n)'], ['O(1)']])],
      task: { type: 'order', question: 'Put the explanation in order.', items: ['Hash-map solution', 'Improve to O(1) space', 'Call out 32-bit signed ops', 'Return with `>>> 0`'], hint: 'Simple first, then improve, then JS details.' },
      solved: 'Hash map first, then the O(1)-space improvement, then JS 32-bit semantics unprompted.',
    },
    {
      kind: 'turn',
      title: 'Your turn: why greedy wins',
      lines: ['Two XOR results first differ at bit 3.', 'One has bit 3 = 1, the other 0.'],
      panels: [bitP(8, 4, { label: 'wins bit 3', highlights: { 0: 'done' } }), bitP(7, 4, { label: 'loses bit 3' })],
      task: { type: 'number', question: 'At most how much can the loser gain from bits 2, 1, 0?', options: [3, 2 ** 3 - 1, 8, 15], answer: 2 ** 3 - 1, hint: '2^k − 1 with k = 3.' },
      solved: '2^3 − 1 = 7 < 8: the higher bit wins whatever happens below.',
    },
  ],
};
