// Max Consecutive Ones III (variable sliding window, at most k zeros). A road with potholes (0s) and k patches: the
// stretch grows to the right, patching every pothole; with more potholes than patches the start moves forward until
// one pothole is left behind. Works with left/l/start/i + right/r/end/j and a zero counter (zeros/count/z…).
import { options, row } from './util.js';

const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const ZEROS = ['zeros', 'zeroes', 'zeroCount', 'zeroCnt', 'numZeros', 'cntZero', 'zc', 'z', 'count', 'cnt', 'flips', 'used'];
const BEST = ['best', 'max', 'maxLen', 'ans', 'res', 'result', 'longest', 'maxOnes'];
const pairOf = (vars) => PAIRS.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
const intName = (vars, names) => names.find((n) => Number.isInteger(vars[n]));
const pl = (n, w) => `${n} ${w}${n === 1 ? '' : w.endsWith('ch') ? 'es' : 's'}`;

function state(ctx, vars) {
  const a = row(vars[ctx.params[0]]);
  const k = vars[ctx.params[1]];
  const pair = pairOf(vars);
  const zName = intName(vars, ZEROS);
  if (!a || !Number.isInteger(k) || !pair || !zName) return null;
  return { a, k, lName: pair[0], rName: pair[1], l: vars[pair[0]], r: vars[pair[1]], zName, z: vars[zName] };
}

export default {
  id: 'max-consecutive-ones-iii',
  metaphor: 'Patching potholes on a road',
  caption: 'Each 0 is a pothole and you own k patches. The bracket is the stretch you can drive smoothly: it grows to the right, and when it holds more potholes than patches its start moves forward.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const s = state(ctx, ctx.vars);
    if (!s) return null;
    const { a, k, lName, rName, l, r, zName, z } = s;
    const pz = ctx.prev[zName];
    const len = Math.max(0, r - l + 1);
    const inR = r >= 0 && r < a.length;
    if (inR && a[r] === 0 && z === (pz ?? 0) + 1) return z > k ? `cell ${r} is a pothole too: that makes ${pl(z, 'pothole')} for only ${pl(k, 'patch')}` : `cell ${r} is a pothole: patch it (${z} of ${k} patches used)`;
    if (inR && r !== ctx.prev[rName]) return a[r] !== 0 ? `cell ${r} is smooth: the stretch reaches it (${z} of ${k} patches used)` : `the end moves to cell ${r}: a pothole`;
    if (Number.isInteger(pz) && z === pz - 1 && l >= 0 && l < a.length) return `the pothole at cell ${a[l] === 0 && l === ctx.prev[lName] ? l : l - 1} is left behind: its patch is free again (${z} of ${k} used)`;
    if (Number.isInteger(ctx.prev[lName]) && l === ctx.prev[lName] + 1) {
      if (l > r) return `the start passes the end: the stretch is empty`;
      return z > k ? `the start moves past smooth cell ${l - 1}: still ${pl(z, 'pothole')} for ${pl(k, 'patch')}` : `the stretch now starts at cell ${l}: cells ${l}..${r}, ${pl(z, 'pothole')} patched`;
    }
    const bName = intName(ctx.vars, BEST);
    if (bName && Number.isInteger(ctx.prev[bName]) && ctx.vars[bName] > ctx.prev[bName] && ctx.vars[bName] === len) return `new longest smooth stretch: cells ${l}..${r}, ${len} long`;
    if (bName && ctx.vars[bName] === ctx.prev[bName] && z <= k && new RegExp(`\\b${bName}\\s*=[^=]`).test(ctx.lines[ctx.line - 1] || '')) return `the stretch ${len ? `${l}..${r} is ${len} long` : "is empty"}: the best stays ${ctx.vars[bName]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const s = state(ctx, ctx.vars);
    const n = state(ctx, ctx.next.vars);
    if (!s || !n || n.lName !== s.lName || n.zName !== s.zName) return null;
    const { a, k, l, r, z } = s;
    // too many potholes, just got there: what moves next?
    if (z > k && !(ctx.prev[s.zName] > k)) {
      const moved = n.l !== l || n.z < z ? 'start' : n.r !== r ? 'end' : null;
      if (!moved) return null;
      const yes = 'The start moves forward (drop cells from the left)';
      const no = 'The end keeps moving right';
      return options(`The stretch ${l}..${r} holds ${pl(z, 'pothole')} but you own ${pl(k, 'patch')}. What happens next?`, moved === 'start' ? yes : no, [moved === 'start' ? no : yes], moved === 'start' ? 'A stretch with more potholes than patches is not drivable, so cells leave from the left until one pothole is gone.' : 'This code lets the broken stretch keep growing, so it can count potholes it cannot patch.');
    }
    // a patched pothole just joined and the stretch is about to be measured: does it beat the best?
    const bName = intName(ctx.vars, BEST);
    if (!bName || z > k || a[r] !== 0 || (ctx.prev[s.rName] === r && ctx.prev[s.zName] !== z - 1)) return null;
    if (n.r !== r || n.l !== l || n.z !== z || !Number.isInteger(ctx.next.vars[bName])) return null;
    const b = ctx.vars[bName];
    const grows = ctx.next.vars[bName] > b;
    const len = r - l + 1;
    const yes = `Yes: the best becomes ${len}`;
    const no = `No: the best stays ${b}`;
    return options(`Cell ${r} (a pothole) was patched, so the stretch is cells ${l}..${r}. The best so far is ${b}. Is this a new best?`, grows ? yes : no, [grows ? no : yes], `The stretch is ${len} long${grows ? `, longer than ${b}` : `, not longer than ${b}`}.`);
  },
  bugs: [
    {
      label: 'Shrink one pothole too early: zeros >= k',
      find: 'while (zeros > k)',
      replace: 'while (zeros >= k)',
      explain: 'Using all k patches is allowed, but this shrinks as soon as the last patch is used, so every stretch has at most k − 1 patched potholes.',
    },
    {
      label: 'Free a patch for every cell dropped',
      find: 'if (nums[left] === 0) zeros--;',
      replace: 'zeros--;',
      explain: 'Dropping a smooth cell also gives back a patch, so the counter says fewer potholes than the stretch really holds and the answer is too long.',
    },
  ],
};
