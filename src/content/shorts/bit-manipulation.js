// Shorts for Bit Manipulation (M9). Format: src/content/shortSchema.js. Facts come only from topics/bit-manipulation/topic.js.
// Every bit row, XOR, count, mask, Gray value and trie cell below comes from running the pattern's template in JS on its
// "e.g." input (inputs differ from the step lessons'). Rows show the most significant bit on the left.
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const grid = (cells, states, label) => ({ kind: 'grid', cells: cells.map((r) => r.map(String)), states, ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const check = (ok, msg) => {
  if (!ok) throw new Error(`shorts/bit-manipulation.js: ${msg}`);
};

// ---------- bits: position i in a w-bit row is bit (w − 1 − i) ----------
const bitsOf = (x, w) => Array.from({ length: w }, (_, i) => (x >>> (w - 1 - i)) & 1);
const bin = (x, w) => bitsOf(x, w).join('');
const bin8 = (x) => `${bin(x >>> 4, 4)} ${bin(x, 4)}`;
const at = (b, w) => w - 1 - b;
const row = (x, label, w, opts = {}) => arr(bitsOf(x, w), { label, showIndices: false, ...opts });
const setHl = (x, st, w) => hl(w, (i) => (bitsOf(x, w)[i] ? st : ''));
const diffHl = (a, b, st, w) => hl(w, (i) => (bitsOf(a, w)[i] !== bitsOf(b, w)[i] ? st : ''));
const popcount = (x) => {
  let c = 0;
  while (x !== 0) (x &= x - 1), c++;
  return c;
};

// ---------- XOR cancellation: e.g. [6, 3, 5, 3, 6] ----------
function unpaired(nums) {
  let x = 0;
  for (const v of nums) x ^= v; // pairs cancel
  return x;
}
const XN = [6, 3, 5, 3, 6];
const XW = 4;
const X_MAP = new Map();
for (const v of XN) X_MAP.set(v, (X_MAP.get(v) ?? 0) + 1);
const X_ANS = unpaired(XN);
check(X_ANS === 5 && X_MAP.size === 3 && [...X_MAP].find(([, c]) => c === 1)[0] === 5, 'unpaired [6, 3, 5, 3, 6]');
const xFrames = (() => {
  let x = 0;
  const frames = [{ say: 0, note: 'x = 0: every switch is off.', panels: [arr(XN, { label: 'nums' }), row(0, 'x = 0', XW)] }];
  XN.forEach((v, k) => {
    const prev = x;
    x ^= v;
    const last = k === XN.length - 1;
    frames.push({
      say: last ? 2 : 1,
      note: `x ^= ${v} (${bin(v, XW)}) → ${bin(x, XW)} = ${x}.${last ? ` 6 and 3 each flipped twice: off. x = ${x}.` : ''}`,
      panels: [
        arr(XN, { label: 'nums', pointers: [ptr(k, 'v')], highlights: hl(XN.length, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) }),
        row(v, `v = ${v}`, XW, { highlights: setHl(v, 'active', XW) }),
        row(x, `x = ${x}`, XW, { highlights: last ? setHl(x, 'done', XW) : diffHl(prev, x, 'active', XW) }),
      ],
    });
  });
  return frames;
})();
check(xFrames.length === 6, 'xor frames');
const HA = 9;
const HB = 3;
const H_D = HA ^ HB;
check(H_D === 10 && popcount(H_D) === 2, 'hamming 9, 3');
const X3 = [3, 3, 3, 6];
check(unpaired(X3) === 5 && (3 ^ 6) === 5, 'xor of [3, 3, 3, 6]');

// ---------- lowest set bit: e.g. x = 72 = 0100 1000 ----------
const LX = 72;
const shiftLoops = (x) => {
  let n = 0;
  while (x !== 0) (x >>>= 1), n++;
  return n;
};
const L_SHIFT = shiftLoops(LX);
const L_RUN = (() => {
  const out = [];
  let x = LX;
  let count = 0;
  while (x !== 0) {
    const before = x;
    x &= x - 1; // drop the lowest set bit
    count++;
    out.push({ before, minus: before - 1, after: x, count });
  }
  return out;
})();
check(L_SHIFT === 7 && L_RUN.length === 2 && popcount(LX) === 2 && L_RUN[0].after === 64 && L_RUN[1].after === 0, 'popcount 72');
const lowestBit = (x) => 31 - Math.clz32(x & -x);
const lFrames = L_RUN.flatMap((s, k) => {
  const b = lowestBit(s.before);
  const last = k === L_RUN.length - 1;
  return [
    {
      say: 0,
      note: `x = ${bin8(s.before)}, lowest 1 is bit ${b}. x − 1 = ${bin8(s.minus)}: that 1 → 0, the 0s below → 1s.`,
      panels: [row(s.before, `x = ${s.before}`, 8, { highlights: { [at(b, 8)]: 'active' } }), row(s.minus, `x − 1 = ${s.minus}`, 8, { highlights: diffHl(s.before, s.minus, 'active', 8) }), vars({ count: s.count - 1 })],
    },
    {
      say: last ? 2 : 1,
      note: `x & (x − 1) = ${bin8(s.after)} = ${s.after}: only bit ${b} is gone. count = ${s.count}.${last ? ` x is 0: ${s.count} loops, not ${L_SHIFT}.` : ''}`,
      panels: [row(s.before, `x = ${s.before}`, 8), row(s.minus, `x − 1 = ${s.minus}`, 8, { highlights: diffHl(s.before, s.minus, 'muted', 8) }), row(s.after, `x & (x − 1) = ${s.after}`, 8, { highlights: { [at(b, 8)]: 'bad' } }), vars({ count: s.count })],
    },
  ];
});
const isPow2 = (x) => x > 0 && (x & (x - 1)) === 0;
check(isPow2(32) && !isPow2(48) && (48 & 47) === 32 && (32 & 31) === 0, 'power of two 32, 48');
const L_NEG = -LX & 255; // low 8 bits of −72
check(L_NEG === 0b10111000 && (LX & -LX) === 8, '72 & -72 = 8');
check(popcount(-1) === 32, 'the & trick ends for negatives');
const LT = 0b01101110;
check(LT === 110 && popcount(LT) === 5 && shiftLoops(LT) === 7, 'turn: 110');

// ---------- bit by bit: e.g. [6, 3, 6, 6], k = 3 ----------
function fromBitCounts(nums, k, log) {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >> b) & 1; // how many have bit b set
    if (count % k !== 0) result |= 1 << b; // the unique element owns this bit
    if (log) log.push({ b, count, result });
  }
  return result;
}
const PN = [6, 3, 6, 6];
const PW = 3;
const P_LOG = [];
const P_ANS = fromBitCounts(PN, 3, P_LOG);
check(P_ANS === 3 && unpaired(PN) === 5, 'fromBitCounts [6, 3, 6, 6]');
check(P_LOG.slice(0, 3).map((s) => s.count).join() === '1,4,3' && P_LOG.slice(PW).every((s) => s.count === 0), 'column counts');
const pGrid = (b, nums = PN) =>
  grid(
    nums.map((x) => bitsOf(x, PW)),
    nums.map((x) => bitsOf(x, PW).map((v, i) => (i === at(b, PW) ? (v ? 'active' : 'muted') : ''))),
    'nums in bits (2 → 0)',
  );
const pFrames = [
  ...P_LOG.slice(0, PW).map((s) => ({
    say: s.count % 3 ? 2 : 1,
    note: `Bit ${s.b}: ${s.count} number${s.count === 1 ? '' : 's'} ha${s.count === 1 ? 's' : 've'} it. ${s.count} % 3 = ${s.count % 3}${s.count % 3 ? `: the unique one owns it, result |= ${1 << s.b}` : ': all triples, skip'}. result = ${s.result}.`,
    panels: [pGrid(s.b), vars({ b: s.b, count: s.count, 'count % 3': s.count % 3 }), row(s.result, `result = ${s.result}`, PW, { highlights: s.count % 3 ? { [at(s.b, PW)]: 'done' } : {} })],
  })),
  {
    say: 0,
    note: `Bits 3 … 31: every count is 0. result = ${P_ANS}: 32 columns × n numbers, O(n).`,
    panels: [grid(PN.map((x) => bitsOf(x, PW)), PN.map((x) => bitsOf(x, PW).map(() => (x === P_ANS ? 'done' : 'muted'))), 'nums in bits (2 → 0)'), row(P_ANS, `result = ${P_ANS}`, PW, { highlights: setHl(P_ANS, 'done', PW) })],
  },
];
const P_NEG = [-4, 1, 1, 1];
const P_NEG_ANS = fromBitCounts(P_NEG, 3);
check(P_NEG_ANS === -4 && P_NEG_ANS >>> 0 === 4294967292, 'negative unique');
const P_NEG_ROW = [...bitsOf(P_NEG_ANS >>> 28, 4), '…', ...bitsOf(P_NEG_ANS, 4)];
check(P_NEG_ROW.join('') === '1111…1100', 'row of -4');
const PT = [4, 7, 7, 7];
const PT_COUNTS = [2, 1, 0].map((b) => PT.reduce((c, x) => c + ((x >> b) & 1), 0));
check(PT_COUNTS.join() === '4,3,3' && fromBitCounts(PT, 3) === 4 && unpaired(PT) === 3, 'turn [4, 7, 7, 7]');

// ---------- bitmask as a set: e.g. fade, bed, hag (letters a–h fit 8 bits) ----------
const bitOf = (ch) => 1 << (ch.charCodeAt(0) - 97);
const MW = ['fade', 'bed', 'hag'];
const M_STEPS = (() => {
  let mask = 0;
  return [...MW[0]].map((ch) => {
    mask |= bitOf(ch); // add
    return { ch, mask };
  });
})();
const maskOf = (w) => [...w].reduce((m, ch) => m | bitOf(ch), 0);
const MM = MW.map(maskOf);
check(MM.join() === '57,26,193' && M_STEPS.at(-1).mask === MM[0], 'letter masks');
const KEY8 = arr('hgfedcba'.split(''), { label: 'letter of each bit (7 → 0)', showIndices: false });
const letters = (m) => [...'abcdefgh'].filter((ch) => m & bitOf(ch));
const M_PAIRS = [
  [0, 1],
  [0, 2],
  [1, 2],
].map(([i, j]) => ({ i, j, and: MM[i] & MM[j] }));
check(M_PAIRS.map((p) => p.and).join() === '24,1,0', 'pair ANDs');
const M_BEST = Math.max(...M_PAIRS.filter((p) => (p.and) === 0).map((p) => MW[p.i].length * MW[p.j].length));
check(M_BEST === 9, 'max product');
const M_REM = MM[0] & ~bitOf('d'); // remove
check(M_REM === 49 && (MM[0] & bitOf('a')) !== 0, 'remove d, test a');
// the turn: the precedence trap
const M_BAD = MM[1] & MM[2] === 0; // eslint-disable-line no-mixed-operators
check(M_BAD === 0 && (MM[1] & MM[2]) === 0 && (MM[1] | MM[2]) !== 0 && (MM[1] ^ MM[2]) !== 0, 'precedence');

// ---------- Gray code: e.g. 4 bits ----------
const toGray = (i) => i ^ (i >> 1);
function fromGray(g, log) {
  let i = 0;
  for (; g !== 0; g >>= 1) (i ^= g), log && log.push({ g, i });
  return i;
}
const GW = 4;
const G_ALL = Array.from({ length: 1 << GW }, (_, i) => toGray(i));
G_ALL.forEach((g, i) => check(popcount(g ^ G_ALL[(i + 1) % G_ALL.length]) === 1, `g(${i}) → next differs in one bit`));
check(popcount(7 ^ 8) === 4 && toGray(7) === 4 && toGray(8) === 12 && (4 ^ 12) === 8, 'g(7), g(8)');
const G_N = 13;
const G_LOG = [];
const G_INV = fromGray(G_N, G_LOG);
check(G_INV === 9 && toGray(9) === G_N && G_LOG.map((s) => s.i).join() === '13,11,8,9', 'fromGray(13)');
// the puzzle's moves: flip bit 0; or flip bit i when bit i−1 is 1 and all lower bits are 0
const legalMoves = (x, w) => [x ^ 1, ...Array.from({ length: w - 1 }, (_, k) => k + 1).filter((i) => (x & ((1 << i) - 1)) === 1 << (i - 1)).map((i) => x ^ (1 << i))];
const minOps = (n, w) => {
  const dist = new Map([[n, 0]]);
  const q = [n];
  while (q.length) {
    const x = q.shift();
    for (const y of legalMoves(x, w)) if (!dist.has(y)) dist.set(y, dist.get(x) + 1), q.push(y);
  }
  return dist.get(0);
};
check(minOps(G_N, GW) === G_INV, 'BFS agrees with fromGray(13)');
const GT = 2;
check(minOps(GT, 3) === 3 && fromGray(GT) === 3 && !legalMoves(GT, 3).includes(0), 'turn: n = 2 needs 3 moves');
const gpair = (i, say, note) => ({
  say,
  note,
  panels: [row(i, `i = ${i}`, GW), row(i >> 1, `i >> 1 = ${i >> 1}`, GW), row(toGray(i), `g(${i}) = ${toGray(i)}`, GW, { highlights: setHl(toGray(i), 'done', GW) })],
});

// ---------- binary trie: e.g. nums [1, 4, 6], 3 bits instead of 30 ----------
const TB = 3;
const TN = [1, 4, 6];
function makeTrie() {
  const child = [[0, 0]]; // node 0 = root; 0 means "no child"
  function insert(x) {
    const log = [];
    let node = 0;
    for (let b = TB - 1; b >= 0; b--) {
      const bit = (x >> b) & 1;
      const made = !child[node][bit];
      if (made) child.push([0, 0]), (child[node][bit] = child.length - 1);
      log.push({ b, node, bit, made });
      node = child[node][bit];
    }
    return log;
  }
  function maxXor(x) {
    const log = [];
    let node = 0;
    let res = 0;
    for (let b = TB - 1; b >= 0; b--) {
      const want = ((x >> b) & 1) ^ 1; // opposite bit makes this bit of the XOR 1
      const win = !!child[node][want];
      const from = node;
      if (win) (res |= 1 << b), (node = child[node][want]);
      else node = child[node][want ^ 1];
      log.push({ b, node: from, want, win, res });
    }
    return { res, log };
  }
  return { child, insert, maxXor };
}
const snapChild = (child) => child.map((c) => c.slice());
const T = makeTrie();
const T_INS = TN.map((x) => ({ x, log: T.insert(x), child: snapChild(T.child) }));
check(T.child.length === 9 && T_INS.map((s) => s.log.filter((l) => l.made).length).join() === '3,3,2', 'trie of 1, 4, 6');
const TX = 2;
const T_Q = T.maxXor(TX);
const T_PARTNER = TX ^ T_Q.res;
check(T_Q.res === 6 && T_PARTNER === 4 && T_Q.log.map((s) => s.win).join() === 'true,true,false', 'maxXor(2)');
check(Math.max(...TN.map((y) => TX ^ y)) === T_Q.res, 'brute force agrees');
const tTable = (child, states, label = 'child[node] = [0-child, 1-child]') =>
  table(
    child.map((_, i) => `node ${i}`),
    ['0', '1'],
    child.map((c) => c.map((v) => (v ? String(v) : '—'))),
    states,
    label,
  );
const cellSt = (n, pairs) => Array.from({ length: n }, (_, r) => [0, 1].map((c) => pairs.find((p) => p[0] === r && p[1] === c)?.[2] || ''));
const tInsFrames = T_INS.map((s, k) => {
  const made = s.log.filter((l) => l.made);
  return {
    say: k === 0 ? 0 : 1,
    note: `insert(${s.x} = ${bin(s.x, TB)}): ${made.length === TB ? `nothing to reuse, create ${TB} nodes` : `reuse ${TB - made.length}, create ${made.length}`}. Rows ${made.map((l) => s.child[l.node][l.bit]).join(', ')} are new.`,
    panels: [row(s.x, `x = ${s.x}, bits 2 → 0`, TB), tTable(s.child, cellSt(s.child.length, s.log.map((l) => [l.node, l.bit, l.made ? 'active' : 'visited'])))],
  };
});
const T_FULL = snapChild(T.child);
const tQFrames = T_Q.log.map((s, k) => {
  const xb = s.want ^ 1;
  const path = T_Q.log.slice(0, k + 1).map((l) => [l.node, l.win ? l.want : l.want ^ 1, l === s ? (s.win ? 'done' : 'bad') : 'visited']);
  return {
    say: s.win ? 1 : 2,
    note: s.win
      ? `Bit ${s.b}: x has ${xb}, want ${s.want}. node ${s.node} has it: go there, res |= ${1 << s.b} → ${s.res}.`
      : `Bit ${s.b}: x has ${xb}, want ${s.want}. node ${s.node} has no ${s.want}-child: take ${xb}. res stays ${s.res}. Partner ${T_PARTNER}.`,
    panels: [row(TX, `x = ${TX}`, TB, { pointers: [ptr(at(s.b, TB), 'b')], highlights: { [at(s.b, TB)]: 'active' } }), tTable(T_FULL, cellSt(T_FULL.length, path)), vars({ want: s.want, res: s.res })],
  };
});
// the turn: query [x = 2, m = 3], offline — insert only the elements ≤ m
const TQ_M = 3;
const T2 = makeTrie();
TN.filter((y) => y <= TQ_M).forEach((y) => T2.insert(y));
const T2_RES = T2.maxXor(TX).res;
check(T2_RES === 3 && (TX ^ 1) === 3, 'bounded query [2, 3]');

export default [
  {
    id: 'bit-xor-cancel',
    title: 'Find the value without a partner in O(1) space',
    steps: [
      {
        kind: 'watch',
        title: 'A map just to find one value',
        lines: ['Finding the element without a partner normally needs a hash map: **O(n)** extra space.'],
        frames: [
          {
            say: 0,
            note: `e.g. [${XN.join(', ')}]: the count map ends with ${X_MAP.size} keys, only to find the one with count 1.`,
            panels: [arr(XN, { label: 'nums' }), table([...X_MAP.keys()].map(String), ['count'], [...X_MAP.values()].map((c) => [String(c)]), [...X_MAP.values()].map((c) => [c === 1 ? 'done' : 'muted']), 'count map')],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'x ^= v: pairs switch off',
        lines: ['`let x = 0;` x ^ 0 = x, so 0 is the safe start.', '`x ^= v` flips every bit that v has set.', 'x ^ x = 0 in any order: each pair flips its bits twice.'],
        frames: xFrames,
      },
      {
        kind: 'watch',
        title: 'Same trick, other clues',
        lines: ['x ^ y marks the bits where x and y differ.', 'Clues: **"appears twice except for one"**, **"constant extra space"**, **"missing number"**, **"number of positions at which the bits differ"**.'],
        frames: [
          {
            say: 0,
            note: `Hamming distance, e.g. ${HA} ^ ${HB} = ${bin(H_D, XW)}: popcount = ${popcount(H_D)} differing positions.`,
            panels: [row(HA, `x = ${HA}`, XW, { highlights: diffHl(HA, HB, 'active', XW) }), row(HB, `y = ${HB}`, XW, { highlights: diffHl(HA, HB, 'active', XW) }), row(H_D, `x ^ y = ${H_D}`, XW, { highlights: setHl(H_D, 'done', XW) })],
          },
          {
            say: 1,
            note: 'Missing number: XOR the indices 0..n with all values; everything present comes in twice.',
            panels: [table(['appears twice except one', 'missing number', 'bits differ'], ['XOR together'], [['all values'], ['indices 0..n and all values'], ['x and y, then popcount']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: three copies',
        lines: [`Now every value appears **three** times except one. e.g. [${X3.join(', ')}].`, 'Run the same XOR loop.'],
        panels: [arr(X3, { label: 'nums' }), row(3, '3', XW), row(6, '6', XW)],
        task: {
          type: 'choose',
          question: 'What does `unpaired(nums)` return?',
          options: [
            { text: '6, the single value', why: 'Three 3s are one pair plus a leftover. The leftover 3 is still XOR-ed with 6.' },
            { text: `${unpaired(X3)} = 3 ^ 6` },
            { text: '0', why: 'Only pairs cancel to 0. An odd number of 3s leaves one 3 behind.' },
            { text: '3', why: 'The 6 is XOR-ed in as well: 3 ^ 6 = 5.' },
          ],
          answer: 1,
        },
        solved: 'XOR only cancels pairs: x ^ x ^ x = x. Elements three times → count each bit mod 3 instead.',
      },
    ],
  },

  {
    id: 'bit-lowest-set-bit',
    title: 'Count the 1-bits in one loop per 1',
    steps: [
      {
        kind: 'watch',
        title: 'One loop per position',
        lines: ['A shift-by-one loop runs once per bit **position** up to the highest 1.'],
        frames: [
          {
            say: 0,
            note: `e.g. x = ${LX} = ${bin8(LX)}. Shifting checks ${L_SHIFT} positions to find just ${popcount(LX)} ones.`,
            panels: [row(LX, `x = ${LX}`, 8, { highlights: setHl(LX, 'active', 8) }), vars({ 'shift loops': L_SHIFT, 'set bits': popcount(LX) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'x &= x − 1 drops the lowest 1',
        lines: ['Subtracting 1 turns the lowest 1 into 0 and every 0 below it into 1.', '`x &= x - 1` wipes exactly that bit; `count++`.', '`while (x !== 0)`: one loop per **set** bit (popcount).'],
        frames: lFrames,
      },
      {
        kind: 'watch',
        title: 'Same trick, other questions',
        lines: ['Power of two: `x > 0 && (x & (x - 1)) === 0`.', '`x & -x` keeps only the lowest 1.', 'Clues: **"number of 1 bits"**, **"power of two"**, **"Hamming weight"**, **"counting bits for every i"**.'],
        frames: [
          {
            say: 0,
            note: `A power of two has one 1: e.g. 32 & 31 = 0 → true. 48 & 47 = ${48 & 47} → false.`,
            panels: [row(32, '32', 8, { highlights: setHl(32, 'active', 8) }), row(31, '31', 8), row(48, '48', 8, { highlights: setHl(48, 'active', 8) }), vars({ 'isPow2(32)': isPow2(32), 'isPow2(48)': isPow2(48) })],
          },
          {
            say: 1,
            note: `−x = ~x + 1 agrees with x only at the lowest 1: ${LX} & −${LX} = ${LX & -LX}.`,
            panels: [row(LX, `x = ${LX}`, 8, { highlights: { [at(lowestBit(LX), 8)]: 'active' } }), row(L_NEG, '−x (low 8 bits)', 8, { highlights: { [at(lowestBit(LX), 8)]: 'active' } }), row(LX & -LX, `x & −x = ${LX & -LX}`, 8, { highlights: { [at(lowestBit(LX), 8)]: 'done' } })],
          },
          {
            say: 2,
            note: 'Loop on `x !== 0`, not `x > 0`: a negative x never enters. e.g. popcount(−1) = 32.',
            panels: [table(['number of 1 bits', 'power of two', 'counting bits 0..n', 'split a group'], ['tool'], [['x &= x − 1 loop'], ['(x & (x − 1)) === 0'], ['bits[i & (i − 1)] + 1'], ['x & −x']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: count the loops',
        lines: [`e.g. x = ${LT} = ${bin8(LT)}.`, '`while (x !== 0) { x &= x - 1; count++; }`'],
        panels: [row(LT, `x = ${LT}`, 8)],
        task: {
          type: 'choose',
          question: 'How many times does the loop run?',
          options: [
            { text: `${shiftLoops(LT)}: one per position up to the highest 1`, why: 'That is the shift-by-one loop. Each x &= x − 1 removes a whole set bit.' },
            { text: '8: the width of the row', why: 'The loop stops as soon as x is 0; leading zeros are never visited.' },
            { text: `${popcount(LT)}` },
            { text: `${LT}`, why: 'x does not drop by 1 per loop; it loses a whole 1-bit.' },
          ],
          answer: 2,
        },
        solved: `${bin8(LT)} has ${popcount(LT)} ones, so the loop runs ${popcount(LT)} times: once per set bit.`,
      },
    ],
  },

  {
    id: 'bit-per-position',
    title: 'Unique among triples: count every bit column',
    steps: [
      {
        kind: 'watch',
        title: 'XOR breaks on triples',
        lines: ['Every value appears three times except one. XOR cancels pairs, not triples.'],
        frames: [
          {
            say: 0,
            note: `e.g. [${PN.join(', ')}], unique 3. XOR all = ${bin(unpaired(PN), PW)} = ${unpaired(PN)}: three 6s leave a 6 behind.`,
            panels: [grid(PN.map((x) => bitsOf(x, PW)), PN.map(() => ['', '', '']), 'nums in bits (2 → 0)'), row(unpaired(PN), `XOR all = ${unpaired(PN)}`, PW, { highlights: setHl(unpaired(PN), 'bad', PW) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: '32 small column problems',
        lines: ['`count += (x >> b) & 1`: how many numbers have bit b.', 'Triples add 0 or 3 to a column; the unique number adds 1.', '`if (count % k !== 0) result |= 1 << b`.'],
        frames: pFrames,
      },
      {
        kind: 'watch',
        title: 'Negatives and the clue',
        lines: ['`|` builds a signed 32-bit value: bit 31 is the sign, so a negative answer comes back right.', 'Clues: **"appears three times"**, **"reverse bits"**, **"without using + or −"**, **"bitwise AND of all numbers in the range"**.'],
        frames: [
          {
            say: 0,
            note: `e.g. [${P_NEG.join(', ')}]: bits 31 … 2 count 1, bit 0 counts 3. result = ${P_NEG_ANS}, sign included.`,
            panels: [arr(P_NEG_ROW, { label: 'result: bits 31–28 … 3–0', showIndices: false, highlights: { 0: 'active' } }), vars({ result: P_NEG_ANS, 'result >>> 0': P_NEG_ANS >>> 0 })],
          },
          {
            say: 1,
            note: 'Each clue splits into columns. Need an unsigned answer (reverse bits)? Return `>>> 0`.',
            panels: [table(['appears three times', 'reverse bits', 'without + or −', 'AND of a range'], ['per column'], [['count % 3'], ['push the lowest bit into result'], ['sum = a ^ b, carry = (a & b) << 1'], ['keep the common prefix']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: read the columns',
        lines: [`e.g. nums = [${PT.join(', ')}], k = 3.`, `Column counts, bit 2 → 0: ${PT_COUNTS.join(', ')}.`],
        panels: [grid(PT.map((x) => bitsOf(x, PW)), PT.map(() => ['', '', '']), 'nums in bits (2 → 0)'), arr(PT_COUNTS, { label: 'count per bit (2 → 0)', showIndices: false })],
        task: {
          type: 'choose',
          question: 'What does `fromBitCounts(nums, 3)` return?',
          options: [
            { text: `${fromBitCounts(PT, 3)}: only bit 2 has count % 3 ≠ 0` },
            { text: `${unpaired(PT)}: the bits with an odd count`, why: 'Odd counts are XOR thinking. Bits 1 and 0 come from the three 7s: 3 % 3 = 0.' },
            { text: '7: every bit that appears', why: 'A bit seen 3 times belongs to the triples, not to the unique number.' },
            { text: '0: no column has count 1', why: 'The test is count % 3 ≠ 0, not count === 1. 4 % 3 = 1, so bit 2 is set.' },
          ],
          answer: 0,
        },
        solved: `4 % 3 = 1 keeps bit 2; 3 % 3 = 0 drops bits 1 and 0. result = ${fromBitCounts(PT, 3)}.`,
      },
    ],
  },

  {
    id: 'bit-mask-set',
    title: 'Do two words share a letter? One AND',
    steps: [
      {
        kind: 'watch',
        title: 'Sets cost O(26) per pair',
        lines: ['Comparing two sets of letters with Sets costs **O(26)** and allocations, every time.'],
        frames: [
          {
            say: 0,
            note: `e.g. words ${MW.join(', ')}: ${M_PAIRS.length} pairs, each one a letter-by-letter Set comparison.`,
            panels: [arr(MW, { label: 'words' }), vars({ pairs: M_PAIRS.length, 'per pair': 'O(26)' })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'One bit per letter',
        lines: ['`bitOf(ch) = 1 << (ch.charCodeAt(0) - 97)`: a → bit 0, b → bit 1, …', '`mask |= bitOf(ch)` adds the letter.'],
        frames: [
          ...M_STEPS.map((s, k) => ({
            say: k === 0 ? 0 : 1,
            note: `"${s.ch}" → bit ${s.ch.charCodeAt(0) - 97}. mask |= ${bitOf(s.ch)} → ${bin8(s.mask)} = ${s.mask}.`,
            panels: [KEY8, row(s.mask, `mask of "${MW[0].slice(0, k + 1)}" = ${s.mask}`, 8, { highlights: { [at(s.ch.charCodeAt(0) - 97, 8)]: 'active' } })],
          })),
          {
            say: 1,
            note: `Every word becomes one number, built once: ${MW.map((w, i) => `${w} = ${MM[i]}`).join(', ')}.`,
            panels: [KEY8, ...MW.map((w, i) => row(MM[i], `${w} = ${MM[i]}`, 8, { highlights: setHl(MM[i], 'visited', 8) }))],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'Pair test: (a & b) === 0',
        lines: ['`(a & b) === 0` → no common letter. O(1) per pair.', 'Clues: **"no common letters"**, **"lowercase letters only"**, **"n ≤ 20"** (2^n subsets), **"visited set"**.'],
        frames: [
          ...M_PAIRS.map((p) => ({
            say: 0,
            note:
              p.and === 0
                ? `${MW[p.i]} & ${MW[p.j]} = 0: no common letter. Product ${MW[p.i].length} · ${MW[p.j].length} = ${MW[p.i].length * MW[p.j].length}.`
                : `${MW[p.i]} & ${MW[p.j]} = ${bin8(p.and)} ≠ 0: they share ${letters(p.and).join(', ')}.`,
            panels: [KEY8, row(MM[p.i], MW[p.i], 8), row(MM[p.j], MW[p.j], 8), row(p.and, `AND = ${p.and}`, 8, { highlights: setHl(p.and, 'bad', 8) })],
          })),
          {
            say: 1,
            note: `Remove: fade & ~bitOf('d') = ${M_REM}. Test: (mask & bitOf('a')) !== 0. All O(1), up to 31 items.`,
            panels: [table(['add', 'remove', 'test', 'disjoint?'], ['bit operation'], [['mask | bit'], ['mask & ~bit'], ['(mask & bit) !== 0'], ['(a & b) === 0']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: write the test',
        lines: [`Masks: bed = ${MM[1]}, hag = ${MM[2]}.`, 'You want: "these two words share no letter".'],
        panels: [KEY8, row(MM[1], `bed = ${MM[1]}`, 8), row(MM[2], `hag = ${MM[2]}`, 8)],
        task: {
          type: 'choose',
          question: 'Which condition is true exactly when they share no letter?',
          options: [
            { text: '`bed & hag === 0`', why: `=== binds tighter than &: it is bed & (hag === 0) = bed & false = ${M_BAD}. No pair ever looks disjoint.` },
            { text: '`(bed | hag) === 0`', why: 'The union is 0 only when both words are empty.' },
            { text: '`(bed & hag) === 0`' },
            { text: '`(bed ^ hag) === 0`', why: 'XOR is 0 when the two sets are equal, not when they are disjoint.' },
          ],
          answer: 2,
        },
        solved: 'Intersection is &, and empty means 0. Parenthesise: `(a & b) === 0`.',
      },
    ],
  },

  {
    id: 'bit-gray-code',
    title: 'Count so that only one bit flips each step',
    steps: [
      {
        kind: 'watch',
        title: 'Counting flips many bits',
        lines: ['Needed: all n-bit numbers in an order where neighbours differ in exactly one bit.'],
        frames: [
          {
            say: 0,
            note: `e.g. 4 bits, counting 7 → 8: ${bin(7, GW)} → ${bin(8, GW)} flips ${popcount(7 ^ 8)} bits at once.`,
            panels: [row(7, '7', GW, { highlights: diffHl(7, 8, 'bad', GW) }), row(8, '8', GW, { highlights: diffHl(7, 8, 'bad', GW) })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'g(i) = i ^ (i >> 1)',
        lines: ['`i >> 1` slides i one place right.', 'Bit k of g is 1 when bits k and k+1 of i differ.', 'Consecutive g values differ in exactly one bit.'],
        frames: [
          gpair(7, 1, `i = 7: ${bin(7, GW)} ^ ${bin(7 >> 1, GW)} = ${bin(toGray(7), GW)}. g(7) = ${toGray(7)}.`),
          gpair(8, 1, `i = 8: ${bin(8, GW)} ^ ${bin(8 >> 1, GW)} = ${bin(toGray(8), GW)}. g(8) = ${toGray(8)}.`),
          {
            say: 2,
            note: `g(7) = ${bin(toGray(7), GW)}, g(8) = ${bin(toGray(8), GW)}: only bit 3 changes, where counting flipped 4.`,
            panels: [row(toGray(7), `g(7) = ${toGray(7)}`, GW, { highlights: diffHl(toGray(7), toGray(8), 'done', GW) }), row(toGray(8), `g(8) = ${toGray(8)}`, GW, { highlights: diffHl(toGray(7), toGray(8), 'done', GW) })],
          },
          {
            say: 2,
            note: `All 16 values, starting at 0: every neighbour differs in one bit (last and first too).`,
            panels: [arr(G_ALL, { label: 'g(i) for i = 0 … 15', highlights: { 7: 'active', 8: 'active' } })],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'The inverse counts the steps',
        lines: ['`for (; g !== 0; g >>= 1) i ^= g;` gives the position of g in the sequence.', 'Minimum one-bit operations: the rules generate the Gray sequence, so the answer is fromGray(n).', 'Clues: **"successive values differ by exactly one bit"**, **"change the rightmost bit"** + **"change bit i if bit i−1 is 1 and the rest are 0"**.'],
        frames: [
          ...G_LOG.map((s, k) => ({
            say: 0,
            note: `g = ${bin(s.g, GW)}: i ^= ${s.g} → i = ${bin(s.i, GW)} = ${s.i}.${k === G_LOG.length - 1 ? ` g >>= 1 hits 0: fromGray(${G_N}) = ${s.i}.` : ''}`,
            panels: [row(s.g, `g = ${s.g}`, GW), row(s.i, `i = ${s.i}`, GW, { highlights: k === G_LOG.length - 1 ? setHl(s.i, 'done', GW) : {} })],
          })),
          {
            say: 1,
            note: `Check: g(${G_INV}) = ${G_N}. e.g. n = ${G_N} under the puzzle's rules: ${G_INV} moves to reach 0.`,
            panels: [vars({ n: G_N, 'fromGray(n)': G_INV, [`g(${G_INV})`]: toGray(G_INV) }), table(['flip bit 0', 'flip bit i'], ['allowed when'], [['always'], ['bit i−1 is 1 and all lower bits are 0']])],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: make n = 2 zero',
        lines: [`e.g. n = ${GT} = ${bin(GT, 3)}. Moves: flip bit 0; or flip bit i if bit i−1 is 1 and all lower bits are 0.`],
        panels: [row(GT, `n = ${GT}`, 3)],
        task: {
          type: 'choose',
          question: 'What is the minimum number of moves?',
          options: [
            { text: '1: flip bit 1', why: 'Bit 1 may only flip when bit 0 is 1. Here bit 0 is 0.' },
            { text: '2: n itself', why: 'The answer is the position of n in the Gray sequence, not n.' },
            { text: `${fromGray(GT)}: fromGray(${GT})` },
            { text: '4', why: `${bin(2, 3)} → ${bin(3, 3)} → ${bin(1, 3)} → ${bin(0, 3)} already reaches 0 in fewer.` },
          ],
          answer: 2,
        },
        solved: `${bin(2, 3)} → ${bin(3, 3)} → ${bin(1, 3)} → ${bin(0, 3)}: fromGray(${GT}) = ${fromGray(GT)}, and g(${fromGray(GT)}) = ${toGray(fromGray(GT))}.`,
      },
    ],
  },

  {
    id: 'bit-trie-max-xor',
    title: 'Best XOR partner in O(bits), not O(n)',
    steps: [
      {
        kind: 'watch',
        title: 'Brute force: XOR with everyone',
        lines: ['Maximum XOR of x with one element of a set is **O(n)** per query by brute force.'],
        frames: [
          {
            say: 0,
            note: `e.g. nums [${TN.join(', ')}], x = ${TX}: try all ${TN.length}. Best ${TX} ^ ${T_PARTNER} = ${T_Q.res}. Every query repeats it.`,
            panels: [table(TN.map((y) => `${TX} ^ ${y}`), ['xor'], TN.map((y) => [String(TX ^ y)]), TN.map((y) => [y === T_PARTNER ? 'done' : '']))],
          },
        ],
      },
      {
        kind: 'watch',
        title: 'insert: most significant bit first',
        lines: ['`child = [[0, 0]]`: node 0 is the root; 0 means "no child".', 'From the top bit down: `bit = (x >> b) & 1`; push a node if `child[node][bit]` is missing.'],
        frames: tInsFrames,
      },
      {
        kind: 'watch',
        title: 'maxXor: want the opposite bit',
        lines: ['A higher bit outweighs all lower bits: 2^k > 2^k − 1. So decide from the top, greedily.', '`want = ((x >> b) & 1) ^ 1`. Child exists: go there, `res |= 1 << b`.', 'Missing: take the same bit. This bit of the XOR is 0.'],
        frames: [
          {
            say: 0,
            note: `Query x = ${TX} = ${bin(TX, TB)} (e.g. 3 bits, not 30). Start at node 0, res = 0.`,
            panels: [row(TX, `x = ${TX}`, TB), tTable(T_FULL, cellSt(T_FULL.length, [])), vars({ res: 0 })],
          },
          ...tQFrames,
        ],
      },
      {
        kind: 'watch',
        title: 'The clue',
        lines: ['Clues: **"maximum XOR"**, **"x XOR nums[j]"**, **"queries [x, m]"**, **"nums[j] <= m"**.', 'Queries with a bound: sort elements and queries by m; insert elements ≤ m before answering.'],
        frames: [
          {
            say: 0,
            note: 'Values < 2^30 → 30 bits, b from 29: `1 << 29` is still positive. O(30) per insert and query.',
            panels: [vars({ bits: '29 → 0', '1 << 29': 1 << 29, '1 << 31': 1 << 31 })],
          },
        ],
      },
      {
        kind: 'turn',
        title: 'Your turn: a query with a bound',
        lines: [`Query [x = ${TX}, m = ${TQ_M}]: max ${TX} ^ nums[j] over nums[j] ≤ ${TQ_M}.`, `Sorted nums: ${TN.join(', ')}. Offline: insert every number ≤ m, then ask.`],
        panels: [arr(TN, { label: 'sorted nums', highlights: hl(TN.length, (i) => (TN[i] <= TQ_M ? 'active' : 'muted')) }), vars({ x: TX, m: TQ_M })],
        task: {
          type: 'choose',
          question: 'What is in the trie when this query is answered, and the answer?',
          options: [
            { text: `All of ${TN.join(', ')} → ${T_Q.res}`, why: `4 and 6 are > m = ${TQ_M}; inserting them would answer with a forbidden element.` },
            { text: `Only 1 → ${TX} ^ 1 = ${T2_RES}` },
            { text: 'Nothing → −1', why: `1 ≤ ${TQ_M}, so it is inserted first. −1 is only for an empty trie.` },
            { text: `1 and 4 → ${TX ^ 4}`, why: `4 > ${TQ_M}. Insert only the elements ≤ m.` },
          ],
          answer: 1,
        },
        solved: `Insert elements ≤ m, then walk: only 1 is allowed, so the answer is ${TX} ^ 1 = ${T2_RES}.`,
      },
    ],
  },
];
