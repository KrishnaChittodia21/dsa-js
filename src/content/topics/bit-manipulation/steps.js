// Step lessons for Bit Manipulation, part 1 (M2). Format: src/content/stepSchema.js. Facts come only from topic.js.
// Every bit row, XOR, lowbit, count and loop length below comes from running the lesson's own code on the example input.
// Part 2 (masks, Gray code, bitwise trie, dry run, mistakes, tips) lives in steps-2.js.
import secondPart from './steps-2.js';
const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const table = (rowLabels, colLabels, cells, states, label) => ({ kind: 'table', rowLabels, colLabels, cells, ...(states ? { states } : {}), ...(label ? { label } : {}) });
const hl = (n, f) => Object.fromEntries(Array.from({ length: n }, (_, k) => [k, f(k)]));
const ptr = (index, label, color = 'a') => ({ index, label, color });
const bare = (fs) => fs.map(({ say, ...f }) => f);
const check = (ok, msg) => {
  if (!ok) throw new Error(`bit-manipulation steps drifted: ${msg}`);
};

// ---------- bits ----------
// a number as a row of w bits, most significant on the left; position i in the panel is bit (w − 1 − i)
const bitsOf = (x, w = 4) => Array.from({ length: w }, (_, i) => (x >>> (w - 1 - i)) & 1);
const at = (b, w = 4) => w - 1 - b;
const bin = (x, w = 4) => bitsOf(x, w).join('');
const bin8 = (x) => `${bin(x >>> 4, 4)} ${bin(x, 4)}`;
const row = (x, label, opts = {}, w = 4) => arr(bitsOf(x, w), { label, showIndices: false, ...opts });
const row8 = (x, label, opts = {}) => row(x, label, opts, 8);
// highlight the set bits of x (or of `mask`) with a state
const setHl = (x, st, w = 4) => hl(w, (i) => ((x >>> (w - 1 - i)) & 1 ? st : ''));
const lowestBit = (x) => 31 - Math.clz32(x & -x);
const popcount = (x) => {
  let c = 0;
  while (x !== 0) { x &= x - 1; c++; }
  return c;
};

// ---------- what ----------
const WHAT_N = 13;
const whatBits = [3, 2, 0];
check(whatBits.reduce((s, b) => s + (1 << b), 0) === WHAT_N, '13 = 8 + 4 + 1');
const whatFrames = [
  { say: 0, note: `${WHAT_N} in 8 bits. Position 0 is on the right; position 7 (worth 128) on the left.`, panels: [row8(WHAT_N, `${WHAT_N}`), vars({ sum: 0 })] },
  ...whatBits.map((b, k) => {
    const sum = whatBits.slice(0, k + 1).reduce((s, c) => s + (1 << c), 0);
    return {
      say: 1,
      note: `Bit ${b} is 1: add its worth ${1 << b}. Sum = ${sum}.`,
      panels: [row8(WHAT_N, `${WHAT_N}`, { highlights: hl(8, (i) => (i === at(b, 8) ? 'active' : whatBits.slice(0, k).some((c) => at(c, 8) === i) ? 'done' : '')) }), vars({ sum })],
    };
  }),
];
const A = 12, B = 10;
check((A & B) === 8 && (A | B) === 14 && (A ^ B) === 6, 'lesson table 12, 10');
const andFrames = [0, 1, 2, 3].map((i) => {
  const r = bitsOf(A & B).map((v, j) => (j <= i ? v : '?'));
  const st = hl(4, (j) => (j === i ? 'active' : j < i ? 'done' : ''));
  const a = bitsOf(A)[i], b = bitsOf(B)[i];
  return {
    say: 0,
    note: `Bit ${3 - i}: ${a} & ${b} = ${a & b}.${i === 3 ? ` 12 & 10 = ${A & B}.` : ''}`,
    panels: [row(A, 'a = 12', { highlights: { [i]: 'active' } }), row(B, 'b = 10', { highlights: { [i]: 'active' } }), arr(r, { label: 'a & b', showIndices: false, highlights: st })],
  };
});
const S1 = 9, S2 = 5;
check((S1 & S2) === 1, '9 & 5');
check(12 << 1 === 24 && 12 >> 2 === 3, 'lesson shifts');
check(5 << 2 === 20, '5 << 2');

// ---------- why ----------
const WHY = [7, 2, 7];
const whyFrames = (() => {
  const map = new Map();
  let x = 0;
  return WHY.map((v, k) => {
    map.set(v, (map.get(v) ?? 0) + 1);
    x ^= v;
    return {
      say: k === WHY.length - 1 ? 1 : 0,
      note: `v = ${v}: the map ${map.get(v) === 1 ? `adds key ${v}` : `bumps ${v} to ${map.get(v)}`} (${map.size} ${map.size === 1 ? 'entry' : 'entries'}); x ^= ${v} → ${x}.${k === WHY.length - 1 ? ' The 7s cancelled: x is the single value, in one number.' : ''}`,
      panels: [arr(WHY, { label: 'nums', pointers: [ptr(k, 'v')], highlights: hl(WHY.length, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) }), vars({ 'map keys': map.size, x }), row(x, `x = ${x}`, { highlights: setHl(x, 'done') })],
    };
  });
})();
check(whyFrames.length === 3 && (7 ^ 2 ^ 7) === 2, 'why xor');
const letterMask = (w) => [...w].reduce((m, ch) => m | (1 << (ch.charCodeAt(0) - 97)), 0);
const MA = letterMask('ab'), MB = letterMask('cd');
check(MA === 3 && MB === 12 && (MA & MB) === 0, 'letter masks');

// ---------- when ----------
const SIGNALS = ['bits', 'small', 'parity', 'O(1)'];
const sigP = (st = {}) => arr(SIGNALS, { label: 'signal', showIndices: false, highlights: st });

// ---------- recognize ----------
const TOOLS = ['XOR', 'x&(x−1)', 'per-bit', 'mask', 'Gray', 'trie'];
const toolP = (st = {}) => arr(TOOLS, { label: 'bit tool', showIndices: false, highlights: st });
const REC = [
  ['"appears twice except one"', 0],
  ['"appears three times except one"', 2],
  ['"no common letters" + lowercase only', 3],
  ['"differ by exactly one bit"', 4],
];

// ---------- intuition: the six moves on 1011 0100 ----------
const X = 0b10110100;
const isSet = (x, k) => ((x >> k) & 1) === 1;
const setBit = (x, k) => x | (1 << k);
const clear = (x, k) => x & ~(1 << k);
const toggle = (x, k) => x ^ (1 << k);
check(isSet(X, 2) && setBit(X, 0) === 0b10110101 && clear(X, 4) === 0b10100100 && toggle(X, 3) === 0b10111100, 'six moves');
const movesFrames = [
  { say: 0, note: `\`x >> 2\` = ${bin8(X >> 2)}: bit 2 is now on the right. \`& 1\` reads it: 1, so isSet(x, 2) is true.`, panels: [row8(X, `x = ${X}`, { highlights: { [at(2, 8)]: 'active' } }), row8(X >> 2, 'x >> 2', { highlights: { 7: 'active' } }), vars({ 'isSet(x, 2)': isSet(X, 2) })] },
  { say: 1, note: `\`1 << 0\` = 0000 0001. OR turns bit 0 on: ${bin8(setBit(X, 0))} = ${setBit(X, 0)}.`, panels: [row8(X, `x = ${X}`), row8(1, '1 << 0', { highlights: { 7: 'active' } }), row8(setBit(X, 0), `x | (1 << 0) = ${setBit(X, 0)}`, { highlights: { 7: 'done' } })] },
  { say: 2, note: `\`~(1 << 4)\` is all 1s except bit 4. AND turns bit 4 off: ${bin8(clear(X, 4))} = ${clear(X, 4)}.`, panels: [row8(X, `x = ${X}`), row8(~(1 << 4), '~(1 << 4)', { highlights: { [at(4, 8)]: 'active' } }), row8(clear(X, 4), `x & ~(1 << 4) = ${clear(X, 4)}`, { highlights: { [at(4, 8)]: 'done' } })] },
  { say: 3, note: `XOR with \`1 << 3\` flips bit 3 (0 → 1) and leaves the rest: ${toggle(X, 3)}.`, panels: [row8(X, `x = ${X}`), row8(1 << 3, '1 << 3', { highlights: { [at(3, 8)]: 'active' } }), row8(toggle(X, 3), `x ^ (1 << 3) = ${toggle(X, 3)}`, { highlights: { [at(3, 8)]: 'done' } })] },
];
const changed = (a, b, st) => hl(8, (i) => (bitsOf(a, 8)[i] !== bitsOf(b, 8)[i] ? st : ''));
check((X & (X - 1)) === 0b10110000 && X - 1 === 0b10110011, 'lesson dropLow picture');
const dropLowFrames = (x, says = [0, 1, 2]) => [
  { say: says[0], note: `x = ${bin8(x)}. Its lowest 1 is bit ${lowestBit(x)}.`, panels: [row8(x, `x = ${x}`, { highlights: { [at(lowestBit(x), 8)]: 'active' } })] },
  { say: says[1], note: `x − 1 = ${bin8(x - 1)}: bit ${lowestBit(x)} became 0, the zeros below it became 1s. Bits above did not move.`, panels: [row8(x, `x = ${x}`, { highlights: { [at(lowestBit(x), 8)]: 'active' } }), row8(x - 1, `x − 1 = ${x - 1}`, { highlights: changed(x, x - 1, 'active') })] },
  { say: says[2], note: `x & (x − 1) = ${bin8(x & (x - 1))} = ${x & (x - 1)}: exactly bit ${lowestBit(x)} is gone.`, panels: [row8(x, `x = ${x}`), row8(x - 1, `x − 1 = ${x - 1}`, { highlights: changed(x, x - 1, 'muted') }), row8(x & (x - 1), `x & (x − 1) = ${x & (x - 1)}`, { highlights: { [at(lowestBit(x), 8)]: 'bad' } })] },
];
check(((~X) & 255) === 0b01001011 && ((-X) & 255) === 0b01001100 && (X & -X) === 4, 'lowBit 180');
const XQ = 0b01101000; // 104
check(lowestBit(XQ) === 3 && (XQ & (XQ - 1)) === 96, 'drop 104');
check(1 << 32 === 1, '1 << 32');

// ---------- brute-force ----------
function popcountArithTrace(n) {
  const out = [];
  let count = 0;
  while (n > 0) {
    const low = n % 2;
    count += low;
    out.push({ n, low, count, next: Math.floor(n / 2) });
    n = Math.floor(n / 2);
  }
  return { out, count };
}
const BF = popcountArithTrace(22);
check(BF.count === 3 && BF.out.length === 5, 'popcountArith 22');
const BF64 = popcountArithTrace(64);
check(BF64.out.length === 7 && BF64.count === 1 && popcount(64) === 1, 'popcountArith 64');

// ---------- intuition-xor: switches ----------
const SW = [9, 4, 12, 9, 4];
const swFrames = (() => {
  let x = 0;
  const frames = [{ say: 0, note: 'All switches start off: x = 0.', panels: [arr(SW, { label: 'nums' }), row(0, 'switches x = 0')] }];
  SW.forEach((v, k) => {
    x ^= v;
    frames.push({
      say: 0,
      note: `${v} = ${bin(v)} passes: it flips switch${popcount(v) > 1 ? 'es' : ''} ${bitsOf(v).map((b, i) => (b ? 3 - i : null)).filter((b) => b !== null).join(', ')}. x = ${bin(x)} = ${x}.`,
      panels: [arr(SW, { label: 'nums', pointers: [ptr(k, 'v')], highlights: hl(SW.length, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) }), row(v, `v = ${v}`, { highlights: setHl(v, 'active') }), row(x, `switches x = ${x}`, { highlights: setHl(v, 'active') })],
    });
  });
  frames.push({ say: 2, note: `9 and 4 flipped their switches twice: off again. Only 12's switches stay on: x = ${x}.`, panels: [arr(SW, { label: 'nums', highlights: { 0: 'muted', 1: 'muted', 2: 'done', 3: 'muted', 4: 'muted' } }), row(x, `switches x = ${x}`, { highlights: setHl(x, 'done') })] });
  check(x === 12, 'switches end at 12');
  frames[3].say = 1;
  return frames;
})();
check((5 ^ 4 ^ 5) === 4, '5 ^ 4 ^ 5');

// ---------- optimized-xor: single number III ----------
const SN = [1, 2, 1, 3, 2, 5];
const SN_X = SN.reduce((a, v) => a ^ v, 0);
const SN_D = SN_X & -SN_X;
const SN_A = SN.filter((v) => v & SN_D).reduce((a, v) => a ^ v, 0);
check(SN_X === 6 && SN_D === 2 && SN_A === 3 && (SN_X ^ SN_A) === 5, 'single number III');
const snXorFrames = (() => {
  let x = 0;
  return SN.map((v, k) => {
    x ^= v;
    return {
      say: 1,
      note: `x ^= ${v} → ${bin(x)} = ${x}.${k === SN.length - 1 ? ` Pairs 1, 2 cancelled: x = 3 ^ 5 = ${x}.` : ''}`,
      panels: [arr(SN, { label: 'nums', pointers: [ptr(k, 'v')], highlights: hl(SN.length, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) }), row(x, `x = ${x}`, { highlights: k === SN.length - 1 ? setHl(x, 'done') : {} })],
    };
  });
})();
const groupFrames = (nums, d, sayIdx) => {
  let g1 = 0, g0 = 0;
  return nums.map((v, k) => {
    const inD = (v & d) !== 0;
    if (inD) g1 ^= v; else g0 ^= v;
    return {
      ...(sayIdx !== undefined ? { say: sayIdx } : {}),
      note: `${v} = ${bin(v)}: bit ${lowestBit(d)} is ${inD ? 1 : 0} → ${inD ? 'with-d' : 'without-d'} group. Groups: ${g1} | ${g0}.`,
      panels: [arr(nums, { label: `nums, d = ${d}`, pointers: [ptr(k, 'v')], highlights: hl(nums.length, (i) => (i > k ? '' : (nums[i] & d) ? 'active' : 'muted')) }), row(v, `v = ${v}`, { highlights: { [at(lowestBit(d))]: inD ? 'active' : 'muted' } }), vars({ 'with d': g1, 'without': g0 })],
    };
  });
};
const SN_SPLIT4 = [SN.filter((v) => v & 4).reduce((a, v) => a ^ v, 0), SN.filter((v) => !(v & 4)).reduce((a, v) => a ^ v, 0)];
check(SN_SPLIT4[0] === 5 && SN_SPLIT4[1] === 3, 'split by bit 2');
const MIN = -2147483648;
check((MIN & -MIN) === MIN && -MIN === 2147483648, 'JS note x & -x for -2^31');

// ---------- template-xor ----------
function twoUnpaired(nums) {
  let x = 0;
  for (const v of nums) x ^= v;
  const d = x & -x;
  let a = 0;
  for (const v of nums) if (v & d) a ^= v;
  return [a, x ^ a];
}
const TX = [4, 7, 4, 2];
const TX_R = twoUnpaired(TX);
check(TX_R[0] === 7 && TX_R[1] === 2, 'twoUnpaired [4,7,4,2]');
const TX2 = [3, 8, 3, 9];
const TX2_R = twoUnpaired(TX2);
check(TX2_R[0] === 9 && TX2_R[1] === 8, 'twoUnpaired [3,8,3,9]');
const txFrames = (() => {
  const frames = [];
  let x = 0;
  TX.forEach((v, k) => {
    x ^= v;
    frames.push({ say: 0, note: `x ^= ${v} → ${x} (${bin(x)}).`, panels: [arr(TX, { label: 'nums', pointers: [ptr(k, 'v')], highlights: hl(TX.length, (i) => (i === k ? 'active' : i < k ? 'visited' : '')) }), row(x, `x = ${x}`)] });
  });
  const d = x & -x;
  frames.push({ say: 1, note: `x = ${bin(x)}. Its lowest set bit: d = ${d}.`, panels: [row(x, `x = ${x}`, { highlights: setHl(x, 'visited') }), row(d, `d = x & -x = ${d}`, { highlights: setHl(d, 'active') })] });
  groupFrames(TX, d, 2).forEach((f) => frames.push(f));
  frames.push({ say: 3, note: `a = ${TX_R[0]}; x ^ a = ${x} ^ ${TX_R[0]} = ${TX_R[1]}. Return [${TX_R.join(', ')}].`, panels: [row(TX_R[0], `a = ${TX_R[0]}`, { highlights: setHl(TX_R[0], 'done') }), row(x, `x = ${x}`), row(TX_R[1], `x ^ a = ${TX_R[1]}`, { highlights: setHl(TX_R[1], 'done') })] });
  return frames;
})();

// ---------- implementation-xor ----------
function hammingTrace(x, y) {
  let d = x ^ y, count = 0;
  const steps = [{ d, count }];
  while (d !== 0) { d &= d - 1; count++; steps.push({ d, count }); }
  return steps;
}
const HAM = hammingTrace(11, 6);
check(HAM.at(-1).count === 3 && HAM[0].d === 13, 'hamming 11 6');
const HAM2 = hammingTrace(12, 5);
check(HAM2.at(-1).count === 2, 'hamming 12 5');
const hamFrames = (x, y, steps, says) => [
  { ...(says ? { say: says[0] } : {}), note: `${x} ^ ${y} = ${bin(steps[0].d)}: a 1 wherever ${x} and ${y} differ.`, panels: [row(x, `x = ${x}`, { highlights: setHl(steps[0].d, 'active') }), row(y, `y = ${y}`, { highlights: setHl(steps[0].d, 'active') }), row(steps[0].d, `d = x ^ y = ${steps[0].d}`, { highlights: setHl(steps[0].d, 'active') })] },
  ...steps.slice(1).map((s, k) => ({
    ...(says ? { say: says[1] } : {}),
    note: `d &= d − 1 drops bit ${lowestBit(steps[k].d)}: d = ${bin(s.d)}, count = ${s.count}.${s.d === 0 ? ` d is 0: distance ${s.count}.` : ''}`,
    panels: [row(steps[k].d, 'd before', { highlights: { [at(lowestBit(steps[k].d))]: 'bad' } }), row(s.d, `d = ${s.d}`, { highlights: setHl(s.d, 'active') }), vars({ count: s.count })],
  })),
];
function missingTrace(nums) {
  let x = nums.length;
  const steps = [];
  for (let i = 0; i < nums.length; i++) {
    x ^= i ^ nums[i];
    steps.push({ i, x });
  }
  return { steps, x };
}
const MISS = [3, 0, 1];
const MT = missingTrace(MISS);
check(MT.x === 2, 'missing [3,0,1]');
check(missingTrace([0, 1]).x === 2, 'missing [0,1]');

// ---------- intuition-lowbit ----------
const K8 = 0b10000101; // 133: 8-bit cousin of the lesson's 0b1000_0000_0000_0101
const kernFrames = (x0, say) => {
  const frames = [];
  let x = x0, count = 0;
  while (x !== 0) {
    const nx = x & (x - 1);
    count++;
    frames.push({
      ...(say !== undefined ? { say } : {}),
      note: `x & (x − 1) drops bit ${lowestBit(x)}: ${bin8(x)} → ${bin8(nx)}. count = ${count}.${nx === 0 ? ` x is 0 after ${count} loops.` : ''}`,
      panels: [row8(x, `x = ${x}`, { highlights: { [at(lowestBit(x), 8)]: 'bad' } }), row8(x - 1, `x − 1 = ${x - 1}`, { highlights: changed(x, x - 1, 'muted') }), row8(nx, `x & (x − 1) = ${nx}`, { highlights: setHl(nx, 'active', 8) })],
    });
    x = nx;
  }
  return { frames, count };
};
const K133 = kernFrames(K8, 0);
check(K133.count === 3, 'kernighan 133');
const POW = [12, 16, 24, 6];
check(POW.map((x) => x > 0 && (x & (x - 1)) === 0).join() === 'false,true,false,false', 'power of two');
const shiftDP = (n) => {
  const bits = [0];
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
};
const DP7 = shiftDP(7);
check(DP7.join() === '0,1,1,2,1,2,2,3', 'bits >> 1 dp');
check(shiftDP(13)[13] === 3 && shiftDP(13)[6] === 2, 'bits[13]');

// ---------- optimized-lowbit ----------
function shiftLoop(x) {
  const steps = [];
  let count = 0;
  while (x) {
    count += x & 1;
    steps.push({ x, low: x & 1, count });
    x >>>= 1;
  }
  return { steps, count };
}
const OL = 0b10000010; // 130
const OL_SHIFT = shiftLoop(OL);
check(OL_SHIFT.steps.length === 8 && OL_SHIFT.count === 2, 'shift loop 130');
const OL_KERN = kernFrames(OL, 1);
check(OL_KERN.count === 2, 'kernighan 130');
check(shiftLoop(96).steps.length === 7 && popcount(96) === 2, 'shift loop 96');

// ---------- template-lowbit ----------
const iterSetBits = (mask) => {
  const out = [];
  for (let m = mask; m !== 0; m &= m - 1) {
    const bit = m & -m;
    out.push({ m, bit, index: 31 - Math.clz32(bit) });
  }
  return out;
};
const TM = 0b01010010; // 82
const TM_IT = iterSetBits(TM);
check(TM_IT.map((s) => s.index).join() === '1,4,6', 'iterate 82');
const TM2 = 0b10010100; // 148
check(iterSetBits(TM2).map((s) => s.index).join() === '2,4,7', 'iterate 148');
check(Math.clz32(8) === 28 && 31 - Math.clz32(8) === 3, 'clz32(8)');

// ---------- implementation-lowbit ----------
function countBits(n) {
  const bits = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i & (i - 1)] + 1;
  return bits;
}
const CB = countBits(7);
check(CB.join() === DP7.join(), 'countBits(7)');
check((6 & 5) === 4, '6 & 5');
check(popcount(-1) === 32, 'kernighan -1');
const negShift = (x) => {
  let n = 0;
  while (x > 0) { x >>>= 1; n++; }
  return n;
};
check(negShift(-8) === 0, 'while (x > 0) never runs for -8');

// ---------- intuition-per-bit ----------
function bitCounts(nums, w = 4) {
  return Array.from({ length: w }, (_, b) => nums.reduce((c, x) => c + ((x >> b) & 1), 0));
}
const SN2 = [5, 5, 6, 5];
const SN2_C = bitCounts(SN2);
check(SN2_C.join() === '3,1,4,0', 'counts [5,5,6,5]');
const fromBitCounts = (nums, k) => {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >> b) & 1;
    if (count % k !== 0) result |= 1 << b;
  }
  return result;
};
check(fromBitCounts(SN2, 3) === 6, 'single number II [5,5,6,5]');
const sn2Frames = (() => {
  let result = 0;
  const rows = ['bit 3', 'bit 2', 'bit 1', 'bit 0'];
  return [0, 1, 2, 3].map((b) => {
    const c = SN2_C[b];
    if (c % 3) result |= 1 << b;
    const cells = rows.map((_, r) => (3 - r <= b ? [String(SN2_C[3 - r]), String(SN2_C[3 - r] % 3)] : ['?', '?']));
    const states = rows.map((_, r) => (3 - r === b ? ['active', 'active'] : 3 - r < b ? ['done', 'done'] : ['', '']));
    return {
      say: b === 0 ? 1 : 2,
      note: `Bit ${b}: ${c} number${c === 1 ? ' has' : 's have'} it. ${c} % 3 = ${c % 3}${c % 3 ? ` → set bit ${b} of the result` : ' → the unique number lacks it'}. result = ${result}.`,
      panels: [arr(SN2, { label: 'nums', highlights: hl(SN2.length, (i) => ((SN2[i] >> b) & 1 ? 'active' : 'muted')) }), table(rows, ['count', '% 3'], cells, states), row(result, `result = ${result}`, { highlights: { [at(b)]: 'active' } })],
    };
  });
})();
const SN2B = [7, 7, 7, 2];
const SN2B_C = bitCounts(SN2B);
check(SN2B_C.join() === '3,4,3,0' && fromBitCounts(SN2B, 3) === 2, 'counts [7,7,7,2]');
const SN2B_ROW = [...SN2B_C].reverse(); // bit 3 → 0
function reverseTrace(n0, w) {
  let res = 0, n = n0;
  const steps = [];
  for (let i = 0; i < w; i++) {
    const low = n & 1;
    res = (res << 1) | low;
    n >>>= 1;
    steps.push({ low, res, n });
  }
  return steps;
}
const REV = reverseTrace(13, 8);
check(REV.at(-1).res === 0b10110000, 'reverse 13 in 8 bits');
check((9 & 10 & 11) === 8, 'AND of [9, 11]');

// ---------- optimized-per-bit: two masks ----------
const twoMaskTrace = (nums) => {
  let ones = 0, twos = 0;
  return nums.map((x) => {
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
    return { x, ones, twos };
  });
};
const TMK = twoMaskTrace(SN2);
check(TMK.map((s) => `${s.ones}/${s.twos}`).join() === '5/0,0/5,2/1,6/0', 'two masks [5,5,6,5]');
const maskFrame = (s, prev, k, say) => ({
  ...(say !== undefined ? { say } : {}),
  note: `x = ${s.x} (${bin(s.x)}): ones = ${bin(s.ones)}, twos = ${bin(s.twos)}.${k === SN2.length - 1 ? ` Done: ones = ${s.ones}, the unique number.` : ''}`,
  panels: [row(s.x, `x = ${s.x}`, { highlights: setHl(s.x, 'active') }), row(s.ones, `ones = ${s.ones}`, { highlights: hl(4, (i) => (bitsOf(s.ones)[i] !== bitsOf(prev.ones)[i] ? 'active' : bitsOf(s.ones)[i] ? 'done' : '')) }), row(s.twos, `twos = ${s.twos}`, { highlights: hl(4, (i) => (bitsOf(s.twos)[i] !== bitsOf(prev.twos)[i] ? 'active' : bitsOf(s.twos)[i] ? 'window' : '')) })],
});
const maskFrames = TMK.map((s, k) => maskFrame(s, k ? TMK[k - 1] : { ones: 0, twos: 0 }, k, k === SN2.length - 1 ? 3 : k === 0 ? 1 : 2));

// ---------- template-per-bit ----------
function perBit(nums, k) {
  let result = 0;
  for (let b = 0; b < 32; b++) {
    let count = 0;
    for (const x of nums) count += (x >>> b) & 1;
    if (count % k) result |= 1 << b;
  }
  return result;
}
const PB = [4, 1, 4];
check(perBit(PB, 2) === 1, 'perBit [4,1,4] 2');
const PB2 = [2, 2, 2, 2, 7];
check(perBit(PB2, 4) === 7, 'perBit [2,2,2,2,7] 4');
check(perBit([MIN, 3, 3, 3], 3) === MIN && (perBit([MIN, 3, 3, 3], 3) >>> 0) === 2147483648, 'perBit bit 31');
const pbFrames = (() => {
  let result = 0;
  return [0, 1, 2, 3].map((b) => {
    const count = PB.reduce((c, x) => c + ((x >>> b) & 1), 0);
    if (count % 2) result |= 1 << b;
    return {
      say: count % 2 ? 1 : 0,
      note: `b = ${b}: count = ${count}. ${count % 2 ? `${count} % 2 ≠ 0 → result |= 1 << ${b}.` : `${count} % 2 = 0 → skip.`} result = ${result}.${b === 3 ? ' Bits 4 to 31 all count 0 here.' : ''}`,
      panels: [arr(PB, { label: 'nums, k = 2', highlights: hl(PB.length, (i) => ((PB[i] >>> b) & 1 ? 'active' : 'muted')) }), vars({ b, count, result }), row(result, `result = ${result}`, { highlights: { [at(b)]: 'active' } })],
    };
  });
})();

// ---------- implementation-per-bit ----------
function getSumTrace(a, b) {
  const steps = [];
  while (b !== 0) {
    const carry = (a & b) << 1;
    const pa = a, pb = b;
    a = a ^ b;
    b = carry;
    steps.push({ pa, pb, a, b });
  }
  return { steps, a };
}
const GS = getSumTrace(5, 3);
check(GS.a === 8 && GS.steps.length === 4, 'getSum 5 3');
const GS17 = getSumTrace(6, 3);
check(GS17.a === 9 && GS17.steps.length === 3, 'getSum 6 3');
const GSN = getSumTrace(-1, 1);
check(GSN.a === 0 && GSN.steps.length === 32, 'getSum -1 1');

export default {
  what: [
    {
      kind: 'watch',
      title: '13 as a row of switches',
      lines: ['Each position is worth a power of two: 1, 2, 4, 8, … 128 at position 7.', 'Add the worths of the 1-bits to read the number.'],
      frames: whatFrames,
    },
    {
      kind: 'watch',
      title: 'AND, OR, XOR column by column',
      lines: ['`a & b`: 1 only if **both** bits are 1.', '`a | b`: 1 if **either** is 1.', '`a ^ b`: 1 if they are **different**.'],
      frames: [
        ...andFrames,
        { say: 1, note: `OR keeps every column with a 1: 12 | 10 = ${A | B}.`, panels: [row(A, 'a = 12'), row(B, 'b = 10'), row(A | B, `a | b = ${A | B}`, { highlights: setHl(A | B, 'done') })] },
        { say: 2, note: `XOR keeps the columns that disagree: 12 ^ 10 = ${A ^ B}.`, panels: [row(A, 'a = 12'), row(B, 'b = 10'), row(A ^ B, `a ^ b = ${A ^ B}`, { highlights: setHl(A ^ B, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 9 & 5',
      lines: ['9 = 1001, 5 = 0101.', 'AND keeps a column only if both are 1.'],
      panels: [row(S1, 'a = 9'), row(S2, 'b = 5'), arr(['?', '?', '?', '?'], { label: 'a & b', showIndices: false })],
      task: { type: 'cell', panel: 2, question: 'Which column of `9 & 5` is 1? (leftmost = bit 3)', answer: at(0), hints: { 0: 'Bit 3: 9 has 1, 5 has 0.', 1: 'Bit 2: 9 has 0, 5 has 1.', 2: 'Bit 1: both are 0.' } },
      solved: `Only bit 0 is 1 in both: 9 & 5 = ${S1 & S2}.`,
    },
    {
      kind: 'watch',
      title: 'Shifts slide the whole row',
      lines: ['`a << k`: move left, fill with 0 (×2^k).', '`a >> k`: move right, copy the sign bit.'],
      frames: [
        { say: 0, note: '12 = 0000 1100.', panels: [row8(12, '12', { highlights: setHl(12, 'active', 8) })] },
        { say: 0, note: '12 << 1: every bit moves one place left, a 0 comes in on the right. 24 = 12 × 2.', panels: [row8(12, '12'), row8(24, '12 << 1 = 24', { highlights: setHl(24, 'active', 8) })] },
        { say: 1, note: '12 >> 2: every bit moves two places right; the low two bits fall off. 12 is positive, so 0s come in. 12 >> 2 = 3.', panels: [row8(12, '12'), row8(3, '12 >> 2 = 3', { highlights: setHl(3, 'active', 8) })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: 5 << 2',
      lines: ['5 = 0000 0101.', 'Left shift by k multiplies by 2^k.'],
      panels: [row8(5, '5', { highlights: setHl(5, 'active', 8) })],
      task: { type: 'number', question: 'What is `5 << 2`?', options: [20, 10, 7, 1], answer: 20, hint: 'Slide the row two places left: 0001 0100.' },
      solved: '5 << 2 = 0001 0100 = 16 + 4 = 20 = 5 × 4.',
    },
  ],

  why: [
    {
      kind: 'watch',
      title: 'A map of counts vs one number',
      lines: ['Hash map: one entry per distinct value, O(n) extra space.', 'XOR: one number `x`; pairs cancel. O(1) extra space.'],
      frames: whyFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: letters as bits',
      lines: ['26 letters fit in one integer: one bit per letter.', 'Here only a to d, so 4 bits: d c b a (a on the right).'],
      panels: [row(MA, '"ab" → mask 3'), row(MB, '"cd" → mask 12'), row(MA & MB, 'ab & cd = 0', { highlights: hl(4, () => 'muted') })],
      task: {
        type: 'choose',
        question: '`maskA & maskB` is 0. What does that tell you?',
        options: [
          { text: 'The two words share no letter', why: '' },
          { text: 'The two words are anagrams', why: 'Anagrams would have the same mask, so the AND would equal it, not 0.' },
          { text: 'Both words are empty', why: 'Each mask has bits set; only the overlap is empty.' },
        ],
        answer: 0,
      },
      solved: 'A common letter would be a common bit. AND = 0 means **no shared letter**, in one `&`.',
    },
  ],

  when: [
    {
      kind: 'watch',
      title: 'Four signals',
      lines: ['The problem **mentions** bits, XOR, powers of two, or "without + / −".', 'The universe is **small** (letters, n ≤ 20 items).', 'A **pairing / parity** argument hides inside.', 'An **O(1) extra space** rule blocks the hash map.', 'Careful above 2^31 − 1: bitwise operators truncate to 32 bits.'],
      frames: [
        { say: 0, note: 'Words like binary, XOR or "power of two" in the statement.', panels: [sigP({ 0: 'active' })] },
        { say: 1, note: 'Few items, many subset comparisons: one integer per subset.', panels: [sigP({ 0: 'done', 1: 'active' })] },
        { say: 2, note: '"Every element twice except one", "odd number of times".', panels: [sigP({ 0: 'done', 1: 'done', 2: 'active' })] },
        { say: 3, note: 'The obvious map is not allowed: bits do it in one number.', panels: [sigP({ 0: 'done', 1: 'done', 2: 'done', 3: 'active' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which signal?',
      lines: ['"Words use lowercase letters only. Compare many pairs of words."'],
      panels: [sigP()],
      task: { type: 'cell', question: 'Which signal fires?', answer: 1, hints: { 0: 'The statement never mentions bits or XOR.', 2: 'Nothing is paired or counted odd/even.', 3: 'No space rule is given.' } },
      solved: '26 letters is a **small universe**: each word becomes one integer.',
    },
    {
      kind: 'turn',
      title: 'Your turn: big values',
      lines: ['Inputs can reach 5,000,000,000.', 'That is above 2^31 − 1.'],
      panels: [vars({ max: '5e9', limit: '2^31 − 1' })],
      task: {
        type: 'choose',
        question: 'What must you watch for if you use `&` on these values?',
        options: [
          { text: 'It silently truncates them to 32 bits', why: '' },
          { text: 'It throws an error', why: 'The lesson warns of **silent** truncation: no error appears.' },
          { text: 'Nothing: JS numbers are 64-bit', why: 'Bitwise operators work on 32 bits, so the extra bits are lost.' },
        ],
        answer: 0,
      },
      solved: 'Above 2^31 − 1, bitwise operators **silently truncate** to 32 bits.',
    },
  ],

  recognize: [
    {
      kind: 'watch',
      title: 'Clue → tool',
      lines: ['Pairs that cancel → **XOR**.', 'Copies that do not pair up → count each **bit**.', 'Small letter sets → a **mask**.', 'One bit between neighbours → **Gray** code.'],
      frames: REC.map(([clue, t], k) => ({
        say: k,
        note: `${clue} → ${TOOLS[t]}.`,
        panels: [toolP({ ...Object.fromEntries(REC.slice(0, k).map(([, i]) => [i, 'done'])), [t]: 'active' })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: "number of 1 bits"',
      lines: ['The clue: "number of 1 bits" / "power of two".'],
      panels: [toolP()],
      task: { type: 'cell', question: 'Which tool?', answer: 1, hints: { 0: 'Nothing pairs up and cancels here.', 2: 'You count 1s in one number, not one column across many.', 3: 'There is no set of items.', 4: 'Nothing about neighbours differing by one bit.', 5: 'No XOR to maximise.' } },
      solved: '`x & (x − 1)` removes one 1-bit per step: it counts set bits and tests powers of two.',
    },
    {
      kind: 'turn',
      title: 'Your turn: "maximum XOR"',
      lines: ['The clue: "maximum XOR".'],
      panels: [toolP()],
      task: { type: 'cell', question: 'Which tool?', answer: 5, hints: { 0: 'Cancelling pairs finds an unpaired value, not a maximum.', 1: 'Removing low bits does not compare pairs.', 2: 'Counting columns does not pick a partner.', 3: 'This is about numbers, not small sets.', 4: 'Gray code orders numbers; it does not maximise XOR.' } },
      solved: '"Maximum XOR" → a **binary trie**.',
    },
  ],

  intuition: [
    {
      kind: 'watch',
      title: 'Test, set, clear, flip',
      lines: ['`(x >> k) & 1` reads bit k.', '`x | (1 << k)` turns bit k on.', '`x & ~(1 << k)` turns bit k off.', '`x ^ (1 << k)` flips bit k.'],
      frames: movesFrames,
    },
    {
      kind: 'watch',
      title: 'Why x & (x − 1) drops the lowest 1',
      lines: ['Subtracting 1 borrows from the lowest 1-bit: it becomes 0.', 'The zeros below it become 1s; everything above is unchanged.', 'AND with x wipes exactly that bit.'],
      frames: dropLowFrames(X),
    },
    {
      kind: 'watch',
      title: 'Why x & −x keeps it',
      lines: ['`−x = ~x + 1`.', 'The +1 carries through the low 1s of `~x` and stops at the lowest set bit.', '`x` and `−x` agree only on that bit.'],
      frames: [
        { say: 0, note: `x = ${bin8(X)}. JS uses 32 bits; the low 8 are shown.`, panels: [row8(X, `x = ${X}`, { highlights: { [at(2, 8)]: 'active' } })] },
        { say: 0, note: `~x flips every bit: ${bin8(~X & 255)}.`, panels: [row8(X, `x = ${X}`), row8(~X, '~x', { highlights: hl(8, () => 'muted') })] },
        { say: 1, note: `+1: the low 1s of ~x turn to 0 and the carry stops at bit 2. −x ends in ${bin8(-X & 255)}.`, panels: [row8(X, `x = ${X}`), row8(~X, '~x'), row8(-X, '−x = ~x + 1', { highlights: changed(~X, -X, 'active') })] },
        { say: 2, note: `Above bit 2, −x is the flip of x; below it both are 0. x & −x = ${X & -X}.`, panels: [row8(X, `x = ${X}`), row8(-X, '−x'), row8(X & -X, `x & −x = ${X & -X}`, { highlights: { [at(2, 8)]: 'done' } })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: which bit goes?',
      lines: [`x = ${bin8(XQ)} = ${XQ}.`, 'Leftmost cell = bit 7.'],
      panels: [row8(XQ, `x = ${XQ}`)],
      task: { type: 'cell', question: 'Which bit does `x & (x − 1)` remove?', answer: at(3, 8), hints: { [at(6, 8)]: 'That is the highest set bit; the borrow starts at the lowest.', [at(5, 8)]: 'There is a set bit lower than this one.', [at(0, 8)]: 'Bit 0 is already 0: 104 is even.' } },
      solved: `The lowest 1 is bit 3: 104 & 103 = ${XQ & (XQ - 1)}.`,
      then: bare(dropLowFrames(XQ)),
    },
    {
      kind: 'turn',
      title: 'Your turn: a shift of 32',
      lines: ['Bitwise operators work on 32-bit integers.', 'Shift counts are taken mod 32.'],
      panels: [row8(1, '1 (low 8 of 32 bits)', { highlights: { 7: 'active' } }), vars({ k: 32 })],
      task: { type: 'number', question: 'What is `1 << 32` in JavaScript?', options: [1, 0, 4294967296, 2], answer: 1, hint: '32 mod 32 = 0.' },
      solved: 'The count 32 becomes 0, so `1 << 32` is **1**.',
    },
  ],

  'brute-force': [
    {
      kind: 'watch',
      title: 'Arithmetic popcount on 22',
      lines: ['`n % 2` is the lowest bit.', '`Math.floor(n / 2)` shifts right with no 32-bit limit.', 'One loop per bit position: O(log n).'],
      frames: [
        ...BF.out.map((s, k) => ({
          say: k === 0 ? 0 : 1,
          note: `n = ${s.n}: n % 2 = ${s.low}, count = ${s.count}. n = Math.floor(${s.n} / 2) = ${s.next}.`,
          panels: [row8(s.n, `n = ${s.n}`, { highlights: { 7: s.low ? 'active' : 'muted' } }), vars({ 'n % 2': s.low, count: s.count })],
        })),
        { say: 2, note: `n is 0 after ${BF.out.length} loops (22 has 5 bit positions). count = ${BF.count}.`, panels: [row8(0, 'n = 0'), vars({ loops: BF.out.length, count: BF.count })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: loops for 64',
      lines: ['64 = 0100 0000: a single 1-bit.', 'The loop runs while n > 0.'],
      panels: [row8(64, 'n = 64', { highlights: setHl(64, 'active', 8) })],
      task: { type: 'number', question: 'How many times does the `popcountArith` loop run for 64?', options: [1, 6, 7, 64], answer: BF64.out.length, hint: 'One loop per position up to the highest 1-bit.' },
      solved: `${BF64.out.length} loops for one set bit. Kernighan's \`n &= n − 1\` would loop once.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: beyond 32 bits',
      lines: ['n = 2^40 + 3: bits 40, 1 and 0 are set.', '`n & 1` and `n >>>= 1` work in 32 bits.'],
      panels: [arr([1, 0, '…', 0, 1, 1], { label: 'bit 40 … bit 0', showIndices: false, highlights: { 0: 'active', 4: 'active', 5: 'active' } })],
      task: {
        type: 'choose',
        question: 'Which loop counts all 3 set bits?',
        options: [
          { text: '`popcountArith` with `% 2` and `Math.floor(n / 2)`', why: '' },
          { text: '`count += n & 1; n >>>= 1`', why: 'These operators work in 32 bits: bit 40 is lost.' },
          { text: "Kernighan's `n &= n − 1`", why: '`&` is also a 32-bit operator: bit 40 is lost.' },
        ],
        answer: 0,
      },
      solved: 'Plain arithmetic is correct up to 2^53: the safe fallback above 32 bits.',
    },
  ],

  'intuition-xor': [
    {
      kind: 'watch',
      title: 'One light switch per bit',
      lines: ['Each value flips the switch of every bit it has set.', 'Switch k ends on exactly when an **odd** number of values had bit k.', 'Pairs flip twice and end off. The single value is left.'],
      frames: swFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: which switch stays on?',
      lines: ['nums = 5, 4, 5. All switches start off.'],
      panels: [row(0, 'switches x'), arr([bin(5), bin(4), bin(5)], { label: 'nums 5, 4, 5 in bits' })],
      task: { type: 'cell', panel: 0, question: 'Which switch is on after all three pass?', answer: at(2), hints: { [at(0)]: 'Bit 0 is set in both 5s: flipped twice, so off.', [at(3)]: 'No value has bit 3.', [at(1)]: 'No value has bit 1.' } },
      solved: 'Bit 2 was flipped 3 times (odd): on. x = 0100 = 4, the single value.',
    },
  ],

  'optimized-xor': [
    {
      kind: 'watch',
      title: 'XOR everything: x = a ^ b',
      lines: ['Two values a and b appear once; the rest twice.', 'XOR everything: pairs cancel, leaving x = a ^ b (not 0, since a ≠ b).'],
      frames: snXorFrames.map((f, k) => ({ ...f, say: k === 0 ? 0 : 1 })),
    },
    {
      kind: 'watch',
      title: 'Pick a differing bit',
      lines: ['Any set bit of x is a position where a and b differ.', 'Take the lowest: `d = x & −x`.'],
      frames: [
        { say: 0, note: `x = ${bin(SN_X)}: a and b differ at bits 2 and 1 (3 = 0011, 5 = 0101).`, panels: [row(SN_X, `x = ${SN_X}`, { highlights: setHl(SN_X, 'active') }), row(3, 'a = 3'), row(5, 'b = 5')] },
        { say: 1, note: `−x ends in ${bin(-SN_X)}. x & −x = ${bin(SN_D)}: d = ${SN_D}.`, panels: [row(SN_X, `x = ${SN_X}`), row(-SN_X, '−x (low 4 bits)'), row(SN_D, `d = ${SN_D}`, { highlights: setHl(SN_D, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: XOR one group',
      lines: ['Split all numbers by `v & d`: does v have bit 1?', 'XOR each group.'],
      panels: [arr(SN, { label: `nums, d = ${SN_D}` }), row(SN_D, `d = ${SN_D}`, { highlights: setHl(SN_D, 'active') })],
      task: { type: 'number', question: 'What does the group **with** bit d XOR to?', options: [3, 5, 6, 2], answer: SN_A, hint: 'List the values that have bit 1 set; pairs inside cancel.' },
      solved: `With bit 1: 2, 3, 2 → ${SN_A}. Without: 1, 1, 5 → ${SN_X ^ SN_A}.`,
      then: bare(groupFrames(SN, SN_D)),
    },
    {
      kind: 'turn',
      title: 'Your turn: another bit?',
      lines: [`x = ${bin(SN_X)} has bits 2 and 1 set.`, 'The lesson takes the lowest.'],
      panels: [row(SN_X, `x = ${SN_X}`, { highlights: setHl(SN_X, 'active') })],
      task: {
        type: 'choose',
        question: 'Could you split by bit 2 instead?',
        options: [
          { text: 'Yes: every set bit of x is a place where a and b differ', why: '' },
          { text: 'No: only the lowest set bit works', why: 'The lowest is just easy to get with `x & −x`; any set bit separates a and b.' },
          { text: 'No: bit 2 is not set in x', why: 'x = 0110: bit 2 is set.' },
        ],
        answer: 0,
      },
      solved: `Split by 4: with bit 2 → ${SN_SPLIT4[0]}; without → ${SN_SPLIT4[1]}. Same answer.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: only bit 31',
      lines: ['x = −2147483648: only bit 31 is set.', '−x is 2147483648 as a float.'],
      panels: [arr([1, 0, 0, 0], { label: 'x: bits 31–28 (the rest 0)', showIndices: false, highlights: { 0: 'active' } }), vars({ x: '−2^31', '−x': '2^31' })],
      task: { type: 'number', question: 'What does `x & -x` give?', options: [MIN, 2147483648, 0, 1], answer: MIN, hint: '`&` converts 2^31 back to a 32-bit pattern.' },
      solved: '`&` turns 2147483648 back into the same pattern (bit 31), so x & −x = x = −2147483648. Still correct.',
    },
  ],

  'template-xor': [
    {
      kind: 'watch',
      title: 'twoUnpaired([4, 7, 4, 2])',
      lines: ['`x ^= v` over all: x = a ^ b.', '`d = x & -x`: a bit where a and b differ.', '`if (v & d) a ^= v`: XOR one group.', 'Return `[a, x ^ a]`: the other one for free.'],
      frames: txFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: order the template',
      lines: ['Put the four moves of `twoUnpaired` in order.'],
      panels: [arr(TX, { label: 'nums' })],
      task: { type: 'order', question: 'Tap the steps in order.', items: ['x = XOR of all', 'd = x & -x', 'a = XOR of values with bit d', 'b = x ^ a'], hint: 'You need a ^ b before you can pick a bit where they differ.' },
      solved: 'XOR all, isolate a bit, XOR one group, recover the other with x ^ a.',
    },
    {
      kind: 'turn',
      title: 'Your turn: run it',
      lines: ['nums = 3, 8, 3, 9.', `x = 8 ^ 9 = ${8 ^ 9}, so d = ${(8 ^ 9) & -(8 ^ 9)}.`],
      panels: [arr(TX2, { label: 'nums' }), row(8 ^ 9, `x = ${8 ^ 9}`, { highlights: { 3: 'active' } })],
      task: { type: 'number', question: 'What is `a`, the first value returned?', options: [9, 8, 1, 3], answer: TX2_R[0], hint: 'd = 1: XOR the odd values.' },
      solved: `Odd values: 3, 3, 9 → a = ${TX2_R[0]}. Then x ^ a = ${TX2_R[1]}.`,
      then: bare(groupFrames(TX2, 1)),
    },
  ],

  'implementation-xor': [
    {
      kind: 'watch',
      title: 'hammingDistance(11, 6)',
      lines: ['`x ^ y`: 1s mark the positions where x and y differ.', 'Count them with `d &= d − 1`.'],
      frames: hamFrames(11, 6, HAM, [0, 1]),
    },
    {
      kind: 'turn',
      title: 'Your turn: hammingDistance(12, 5)',
      lines: ['12 = 1100, 5 = 0101.'],
      panels: [row(12, 'x = 12'), row(5, 'y = 5')],
      task: { type: 'number', question: 'What does `hammingDistance(12, 5)` return?', options: [1, 2, 3, 4], answer: HAM2.at(-1).count, hint: 'XOR them, then count the 1s.' },
      solved: `12 ^ 5 = ${bin(12 ^ 5)}: two 1s, so the loop runs twice.`,
      then: bare(hamFrames(12, 5, HAM2)),
    },
    {
      kind: 'watch',
      title: 'missingNumber([3, 0, 1])',
      lines: ['Start x at n = nums.length.', 'XOR in every index i and every value nums[i].', 'Every number in 0..n then appears twice, except the missing one.'],
      frames: [
        { say: 0, note: `n = ${MISS.length}: x = ${MISS.length}.`, panels: [arr(MISS, { label: 'nums' }), vars({ x: MISS.length }), row(MISS.length, `x = ${MISS.length}`)] },
        ...MT.steps.map((s, k) => ({
          say: 1,
          note: `i = ${s.i}: x ^= ${s.i} ^ ${MISS[s.i]} → x = ${s.x}.`,
          panels: [arr(MISS, { label: 'nums', pointers: [ptr(s.i, 'i')], highlights: hl(MISS.length, (j) => (j === s.i ? 'active' : j < s.i ? 'visited' : '')) }), vars({ i: s.i, x: s.x }), row(s.x, `x = ${s.x}`)] })),
        { say: 2, note: `0, 1, 3 each came in twice (index and value) and cancelled. 2 came in once: x = ${MT.x}.`, panels: [arr(MISS, { label: 'nums', highlights: hl(3, () => 'muted') }), vars({ missing: MT.x }), row(MT.x, `x = ${MT.x}`, { highlights: setHl(MT.x, 'done') })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: why start at n?',
      lines: ['nums has n values from 0..n, one missing.', 'Indices only go 0 to n − 1.'],
      panels: [arr(MISS, { label: 'nums, n = 3' }), vars({ 'x start': 3 })],
      task: {
        type: 'choose',
        question: 'Why does x start at `nums.length`?',
        options: [
          { text: 'No index reaches n, so n must be XOR-ed in once', why: '' },
          { text: 'Because x must not start at 0', why: 'Starting at 0 is fine for XOR; the issue is the value n with no matching index.' },
          { text: 'Because n is always the missing number', why: 'Only when n itself is missing, e.g. [0, 1] → 2.' },
        ],
        answer: 0,
      },
      solved: 'Indices give 0..n − 1; starting at n adds the last number so every present value pairs up.',
    },
  ],

  'intuition-lowbit': [
    {
      kind: 'watch',
      title: 'One loop per set bit',
      lines: ['Each `x &= x − 1` removes one set bit.', 'A number with k set bits hits 0 after exactly k loops.'],
      frames: [
        { say: 1, note: `x = ${bin8(K8)}: 3 set bits among 8 positions (JS uses 32; 8 shown).`, panels: [row8(K8, `x = ${K8}`, { highlights: setHl(K8, 'active', 8) })] },
        ...K133.frames,
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: power of two',
      lines: ['A power of two has exactly one set bit.', 'Removing it leaves 0.'],
      panels: [arr(POW, { label: 'x' })],
      task: { type: 'cell', question: 'For which x is `x & (x − 1)` equal to 0?', answer: 1, hints: { 0: '12 = 1100 has two set bits: one is left.', 2: '24 = 11000: two set bits.', 3: '6 = 110: two set bits.' } },
      solved: '16 = 10000: one set bit. 16 & 15 = 0, so 16 is a power of two.',
      then: [{ note: '16 & 15: the only 1 is removed.', panels: [row8(16, 'x = 16', { highlights: setHl(16, 'bad', 8) }), row8(15, 'x − 1 = 15'), row8(0, 'x & (x − 1) = 0')] }],
    },
    {
      kind: 'watch',
      title: 'Counting bits 0..7 with i >> 1',
      lines: ['`i >> 1` drops the last bit: a smaller number, already solved.', '`bits[i] = bits[i >> 1] + (i & 1)`: add the last bit back.'],
      frames: DP7.slice(1).map((v, k) => {
        const i = k + 1;
        return {
          say: i === 1 ? 0 : 1,
          note: `i = ${i} (${bin(i, 3)}): bits[${i >> 1}] + ${i & 1} = ${v}.`,
          panels: [arr(DP7.map((b, j) => (j <= i ? b : '?')), { label: 'bits', pointers: i >> 1 === i ? [ptr(i, 'i')] : [ptr(i, 'i'), ptr(i >> 1, 'i>>1', 'b')], highlights: hl(8, (j) => (j === i ? 'active' : j === i >> 1 ? 'visited' : '')) })],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: bits[13]',
      lines: ['13 = 1101.', 'bits[6] = 2 is already known.'],
      panels: [row(13, 'i = 13', { highlights: { 3: 'active' } }), row(6, 'i >> 1 = 6')],
      task: { type: 'number', question: 'What is `bits[13]`?', options: [1, 2, 3, 4], answer: 3, hint: '13 >> 1 = 6, and 13 & 1 = 1.' },
      solved: 'bits[6] + (13 & 1) = 2 + 1 = 3.',
    },
  ],

  'optimized-lowbit': [
    {
      kind: 'watch',
      title: 'Shift-by-one loop on 130',
      lines: ['`count += x & 1; x >>>= 1;`', 'It runs once per bit **position** up to the highest set bit.'],
      frames: OL_SHIFT.steps.map((s, k) => ({
        say: k === OL_SHIFT.steps.length - 1 ? 1 : 0,
        note: `Loop ${k + 1}: x & 1 = ${s.low}, count = ${s.count}.${k === OL_SHIFT.steps.length - 1 ? ` x becomes 0: ${OL_SHIFT.steps.length} loops for 2 set bits.` : ''}`,
        panels: [row8(s.x, `x = ${s.x}`, { highlights: { 7: s.low ? 'active' : 'muted' } }), vars({ loops: k + 1, count: s.count })],
      })),
    },
    {
      kind: 'watch',
      title: "Kernighan's loop on 130",
      lines: ['`x &= x − 1; count++;`', 'It runs once per **set** bit and never needs the width.'],
      frames: [...OL_KERN.frames, { say: 1, note: `${OL_KERN.count} loops instead of ${OL_SHIFT.steps.length}.`, panels: [vars({ shift: OL_SHIFT.steps.length, kernighan: OL_KERN.count })] }],
    },
    {
      kind: 'turn',
      title: 'Your turn: loops for 96',
      lines: ['96 = 0110 0000.'],
      panels: [row8(96, 'x = 96', { highlights: setHl(96, 'active', 8) })],
      task: { type: 'number', question: 'How many times does the **shift-by-one** loop run for 96?', options: [2, 5, 7, 8], answer: 7, hint: 'It stops once the highest set bit has been shifted out.' },
      solved: 'The highest set bit is bit 6: 7 loops. Kernighan needs only 2.',
    },
  ],

  'template-lowbit': [
    {
      kind: 'watch',
      title: 'Visit the set bits of 0101 0010',
      lines: ['`m & -m`: the current lowest bit, a power of two.', '`31 - Math.clz32(bit)`: its position.', '`m &= m - 1`: drop it and go on.'],
      frames: [
        ...TM_IT.flatMap((s) => [
          { say: 0, note: `m = ${bin8(s.m)}: bit = m & -m = ${s.bit}.`, panels: [row8(s.m, `m = ${s.m}`, { highlights: { [at(s.index, 8)]: 'active' } }), row8(s.bit, `bit = ${s.bit}`, { highlights: { [at(s.index, 8)]: 'done' } })] },
          { say: 1, note: `Math.clz32(${s.bit}) = ${Math.clz32(s.bit)}: index = 31 − ${Math.clz32(s.bit)} = ${s.index}.`, panels: [row8(s.bit, `bit = ${s.bit}`, { highlights: { [at(s.index, 8)]: 'done' } }), vars({ bit: s.bit, index: s.index })] },
        ]),
        { say: 2, note: 'Each `m &= m - 1` dropped one bit; m is 0. Indices 1, 4, 6, low to high.', panels: [row8(0, 'm = 0'), arr(TM_IT.map((s) => s.index), { label: 'indices visited' })] },
      ],
    },
    {
      kind: 'turn',
      title: 'Your turn: visiting order',
      lines: [`mask = ${bin8(TM2)} = ${TM2}.`],
      panels: [row8(TM2, `mask = ${TM2}`, { highlights: setHl(TM2, 'active', 8) })],
      task: { type: 'order', question: 'In which order does the loop visit the indices?', items: ['2', '4', '7'], hint: 'The loop always takes the lowest set bit first.' },
      solved: '`m & -m` always picks the lowest bit, so indices come out low to high: 2, 4, 7.',
    },
    {
      kind: 'turn',
      title: 'Your turn: clz32',
      lines: ['bit = 8 = 1000.', '`Math.clz32` counts leading zero bits in 32 bits.'],
      panels: [row8(8, 'bit = 8', { highlights: { [at(3, 8)]: 'active' } })],
      task: { type: 'number', question: 'What is `Math.clz32(8)`?', options: [28, 3, 29, 4], answer: 28, hint: 'Bits 31 down to 4 are all 0.' },
      solved: '28 leading zeros; index = 31 − 28 = 3.',
    },
  ],

  'implementation-lowbit': [
    {
      kind: 'watch',
      title: 'countBits(7)',
      lines: ['`bits[i] = bits[i & (i − 1)] + 1`.', '`i & (i − 1)` is smaller, so its answer is ready.'],
      frames: CB.slice(1).map((v, k) => {
        const i = k + 1, j = i & (i - 1);
        return {
          say: i === 1 ? 0 : 1,
          note: `i = ${i} (${bin(i, 3)}): i & (i − 1) = ${j}. bits[${j}] + 1 = ${v}.`,
          panels: [arr(CB.map((b, t) => (t <= i ? b : '?')), { label: 'bits', pointers: [ptr(i, 'i'), ptr(j, 'from', 'b')], highlights: hl(8, (t) => (t === i ? 'active' : t === j ? 'visited' : '')) })],
        };
      }),
    },
    {
      kind: 'turn',
      title: 'Your turn: where does bits[6] read?',
      lines: ['i = 6 = 110.', 'Drop its lowest set bit.'],
      panels: [arr(CB.map((b, t) => (t < 6 ? b : '?')), { label: 'bits', pointers: [ptr(6, 'i')] })],
      task: { type: 'cell', question: 'Which entry does `bits[6]` read?', answer: 4, hints: { 3: '3 = 6 >> 1 is the other formula. This one drops the lowest set bit.', 5: '6 & 5 = 4, not 5.', 2: 'That drops the higher bit; `i & (i − 1)` drops the lowest.' } },
      solved: '6 & 5 = 100 = 4: bits[6] = bits[4] + 1 = 2.',
    },
    {
      kind: 'turn',
      title: 'Your turn: Kernighan on −1',
      lines: ['−1 has all 32 bits set.', '`x &= x − 1` also stops for negative values.'],
      panels: [row8(-1, '−1: all 32 bits 1 (8 shown)', { highlights: hl(8, () => 'active') })],
      task: { type: 'number', question: 'How many times does `while (x !== 0) { x &= x - 1; }` run for x = −1?', options: [0, 1, 31, 32], answer: popcount(-1), hint: 'Each step removes one set bit.' },
      solved: 'One step per set bit: 32 steps, then x is 0.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the `x > 0` trap',
      lines: ['x = −8. Bit 31 is set, so x is negative.', 'Loop: `while (x > 0) { … x >>>= 1; }`'],
      panels: [row8(-8, '−8 (low 8 of 32 bits)', { highlights: setHl(-8, 'active', 8) }), vars({ x: -8 })],
      task: { type: 'number', question: 'How many times does that loop run?', options: [0, 3, 29, 32], answer: negShift(-8), hint: 'Check the condition before the first step.' },
      solved: '−8 > 0 is false: the loop **never runs**. Use `!== 0`.',
    },
  ],

  'intuition-per-bit': [
    {
      kind: 'watch',
      title: 'Single Number II: count each column',
      lines: ['Each bit position is its own small problem.', 'Triples add 0 or 3 to a column; the unique number adds 1.', '`count % 3` is the unique number\'s bit.'],
      frames: sn2Frames,
    },
    {
      kind: 'turn',
      title: 'Your turn: which column is off?',
      lines: ['nums = 7, 7, 7, 2.', 'Counts per bit, bit 3 on the left.'],
      panels: [arr(SN2B_ROW, { label: 'count per bit (3 → 0)', showIndices: false }), arr(SN2B, { label: 'nums' })],
      task: { type: 'cell', question: 'Which column has `count % 3 ≠ 0`?', answer: at(1), hints: { [at(3)]: '0 % 3 = 0.', [at(2)]: '3 % 3 = 0: only the triple has it.', [at(0)]: '3 % 3 = 0: only the triple has it.' } },
      solved: 'Bit 1: 4 % 3 = 1. The unique number is 0010 = 2.',
    },
    {
      kind: 'watch',
      title: 'Reverse bits: push from the right',
      lines: ['Take the lowest bit of n: `n & 1`.', 'Push it into res: `res = (res << 1) | (n & 1)`.', 'Then `n >>>= 1`. JS does this 32 times; 8 shown here.'],
      frames: REV.map((s, k) => ({
        say: k === 0 ? 0 : k === REV.length - 1 ? 2 : 1,
        note: `Round ${k + 1}: n & 1 = ${s.low} → res = ${bin8(s.res)}.${k === REV.length - 1 ? ` 0000 1101 reversed is ${bin8(s.res)}.` : ''}`,
        panels: [row8(k ? REV[k - 1].n : 13, 'n', { highlights: { 7: 'active' } }), row8(s.res, 'res', { highlights: { 7: 'active' } })],
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: AND of [9, 11]',
      lines: ['Any bit that changes inside the range becomes 0.', 'The bits that never change: the common prefix of l and r.'],
      panels: [row(9, '9'), row(10, '10'), row(11, '11')],
      task: { type: 'number', question: 'What is 9 & 10 & 11?', options: [8, 9, 11, 0], answer: 9 & 10 & 11, hint: 'Which columns are the same in all three?' },
      solved: '9 = 1001, 11 = 1011 share the prefix 10. Then zeros: 1000 = 8.',
    },
  ],

  'optimized-per-bit': [
    {
      kind: 'watch',
      title: 'Two masks on [5, 5, 6, 5]',
      lines: ['All 32 mod-3 counters run at once: `ones` = seen 1 (mod 3), `twos` = seen 2.', '`ones = (ones ^ x) & ~twos`', '`twos = (twos ^ x) & ~ones`', 'At the end `ones` holds the unique number.'],
      frames: [{ say: 0, note: 'Both masks start at 0.', panels: [row(0, 'ones = 0'), row(0, 'twos = 0')] }, ...maskFrames.slice(0, 2)],
    },
    {
      kind: 'turn',
      title: 'Your turn: x = 6 arrives',
      lines: ['Now ones = 0000, twos = 0101.', 'x = 6 = 0110.'],
      panels: [row(6, 'x = 6'), row(0, 'ones = 0'), row(5, 'twos = 5')],
      task: { type: 'cell', panel: 1, question: 'After `ones = (ones ^ x) & ~twos`, which bit of ones is set?', answer: at(1), hints: { [at(2)]: 'Bit 2 is in twos, so `& ~twos` blocks it: its third sighting resets it.', [at(0)]: 'x = 0110 has no bit 0.', [at(3)]: 'Nothing has bit 3.' } },
      solved: `ones = 0110 & 1010 = 0010. Then twos = ${bin(TMK[2].twos)}.`,
      then: bare(maskFrames.slice(2)),
    },
    {
      kind: 'turn',
      title: 'Your turn: one bit\'s cycle',
      lines: ['Follow one bit of (ones, twos) from (0, 0).', 'It is seen 1, 2, then 3 times.'],
      panels: [table(['ones', 'twos'], ['start'], [['0'], ['0']])],
      task: { type: 'order', question: 'Order the states after the 1st, 2nd and 3rd sighting.', items: ['(1, 0)', '(0, 1)', '(0, 0)'], hint: 'After three sightings the bit is back where it started.' },
      solved: '(0, 0) → (1, 0) → (0, 1) → (0, 0): a 3-state counter per bit.',
    },
  ],

  'template-per-bit': [
    {
      kind: 'watch',
      title: 'perBit([4, 1, 4], 2)',
      lines: ['For each bit b, count the numbers with `(x >>> b) & 1`.', '`count % k` ≠ 0 → the unique value owns bit b: `result |= 1 << b`.'],
      frames: pbFrames,
    },
    {
      kind: 'turn',
      title: 'Your turn: k = 4',
      lines: ['nums = 2, 2, 2, 2, 7. k = 4.'],
      panels: [arr(PB2, { label: 'nums, k = 4' }), row(7, '7'), row(2, '2')],
      task: { type: 'number', question: 'What does `perBit(nums, 4)` return?', options: [7, 5, 2, 0], answer: perBit(PB2, 4), hint: 'Per bit: count the values that have it; keep it if count % 4 ≠ 0.' },
      solved: 'Bit 0: 1. Bit 1: 5 → 5 % 4 = 1. Bit 2: 1. All kept: 7.',
    },
    {
      kind: 'turn',
      title: 'Your turn: the sign bit',
      lines: ['The unique value has only bit 31 set.', 'perBit sets it with `result |= 1 << 31`.'],
      panels: [arr([1, 0, 0, 0], { label: 'unique: bits 31–28 (rest 0)', showIndices: false, highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'What does perBit return?',
        options: [
          { text: '−2147483648; `result >>> 0` gives 2147483648', why: '' },
          { text: '2147483648', why: '`|` produces a signed 32-bit value: bit 31 makes it negative.' },
          { text: '0', why: 'count % k is not 0 for bit 31, so the bit is set.' },
        ],
        answer: 0,
      },
      solved: 'The result is signed 32-bit: −2147483648. Use `result >>> 0` for the unsigned value.',
    },
  ],

  'implementation-per-bit': [
    {
      kind: 'watch',
      title: 'getSum(5, 3)',
      lines: ['`(a & b) << 1`: the carries, moved left.', '`a ^ b`: the sum without carries.', 'Repeat with b = carry until it is 0.'],
      frames: GS.steps.map((s, k) => ({
        say: k === GS.steps.length - 1 ? 2 : k === 0 ? 0 : 1,
        note: `Round ${k + 1}: a ^ b = ${s.a}, carry = ${s.b}.${s.b === 0 ? ` Carry is 0: 5 + 3 = ${s.a}.` : ''}`,
        panels: [row(s.pa, `a = ${s.pa}`), row(s.pb, `b = ${s.pb}`), row(s.a, `a ^ b = ${s.a}`, { highlights: setHl(s.a, 'active') }), row(s.b, `carry = ${s.b}`, { highlights: setHl(s.b, 'window') })].slice(2).concat([vars({ a: s.pa, b: s.pb })]),
      })),
    },
    {
      kind: 'turn',
      title: 'Your turn: getSum(6, 3)',
      lines: ['a = 0110, b = 0011.'],
      panels: [row(6, 'a = 6'), row(3, 'b = 3')],
      task: { type: 'number', question: 'How many rounds does the while loop run?', options: [1, 2, 3, 4], answer: GS17.steps.length, hint: 'The carry moves one place left each round.' },
      solved: `(5, 4) → (1, 8) → (9, 0): ${GS17.steps.length} rounds, sum 9.`,
      then: GS17.steps.map((s, k) => ({ note: `Round ${k + 1}: a = ${s.a}, carry = ${s.b}.`, panels: [row(s.a, `a = ${s.a}`), row(s.b, `b = ${s.b}`)] })),
    },
    {
      kind: 'turn',
      title: 'Your turn: getSum(−1, 1)',
      lines: ['−1 has all 32 bits set.', 'In 32 bits the carry is shifted out of bit 31 and disappears.'],
      panels: [row8(-1, '−1 (8 of 32 bits)', { highlights: hl(8, () => 'active') }), row8(1, 'b = 1')],
      task: { type: 'number', question: 'How many rounds until the carry is 0?', options: [1, 8, 31, 32], answer: GSN.steps.length, hint: 'The carry moves left one bit per round until it falls off bit 31.' },
      solved: `${GSN.steps.length} rounds; the result is ${GSN.a}.`,
    },
    {
      kind: 'turn',
      title: 'Your turn: `>>>=` in reverseBits',
      lines: ['`reverseBits` shifts n with `n >>>= 1`.', 'The input may be ≥ 2^31 (bit 31 set).'],
      panels: [arr([1, 0, 1, 1], { label: 'n: bits 31–28', showIndices: false, highlights: { 0: 'active' } })],
      task: {
        type: 'choose',
        question: 'Why `n >>>= 1` and not `n >>= 1`?',
        options: [
          { text: 'It fills with 0, so inputs ≥ 2^31 work too', why: '' },
          { text: '`>>` is slower', why: 'Speed is not the reason: `>>` copies the sign bit into the top.' },
          { text: '`>>>` reverses the bits', why: '`>>>` only shifts; the reversal comes from pushing bits into res.' },
        ],
        answer: 0,
      },
      solved: '`>>>` is the logical shift: 0s come in at the top, whatever bit 31 was.',
    },
  ],
  ...secondPart,
};
