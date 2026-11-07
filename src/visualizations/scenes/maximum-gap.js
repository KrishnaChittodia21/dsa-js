// Maximum Gap (bucket sort + pigeonhole). Houses along a road are grouped into blocks of equal width; the widest
// empty stretch of road is never inside a block, so only each block's first and last house matter.
// Works with bMin/bMax-like arrays (any name holding "min" / "max") and a bucket index b / bucket / idx.
import { firstInt, options, row } from './util.js';

const B = ['b', 'bucket', 'bi', 'idx', 'id', 'k', 'pos', 'slot'];
const X = ['x', 'num', 'v', 'val', 'value', 'a'];
const LO = ['lo', 'min', 'mn', 'minV', 'minVal', 'low', 'smallest'];
const HI = ['hi', 'max', 'mx', 'maxV', 'maxVal', 'high', 'largest'];
const W = ['width', 'w', 'size', 'bucketSize', 'gap', 'step', 'len'];
const BEST = ['best', 'ans', 'res', 'result', 'maxGap', 'answer'];
const PREV = ['prevMax', 'prev', 'last', 'lastMax', 'previous', 'prevHi'];

const findRow = (vars, re) => Object.entries(vars).find(([k, v]) => re.test(k) && row(v) && v.length > 0);
const show = (v) => (v === Infinity || v === -Infinity ? 'empty' : v);

function buckets(vars) {
  const mn = findRow(vars, /min|lo|low/i);
  const mx = findRow(vars, /max|hi|high/i);
  return mn && mx && mn[0] !== mx[0] && mn[1].length === mx[1].length ? [mn, mx] : null;
}

export default {
  id: 'maximum-gap',
  metaphor: 'Houses along a road, grouped into blocks',
  caption: 'Each number is a house on a road. Blocks are narrower than the widest gap must be, so that gap always spans from one block’s last house to the next non-empty block’s first house.',
  narrate(ctx) {
    const v = ctx.vars;
    const p = ctx.prev;
    const bk = buckets(v);
    const [bName, b] = firstInt(v, B);
    const [xName, x] = firstInt(v, X);
    const [wName, w] = firstInt(v, W);
    const [, lo] = firstInt(v, LO);
    const [, hi] = firstInt(v, HI);
    // scan phase: best gap / empty buckets
    const [bestName, best] = firstInt(v, BEST);
    const [, pm] = firstInt(v, PREV);
    if (bk && bName && b < bk[0][1].length) {
      const [[, mins], [, maxs]] = bk;
      const pbk = buckets(p);
      if (pbk && pbk[0][1].some((m, i) => m !== mins[i])) return Number.isFinite(maxs[b]) ? `house ${x ?? mins[b]} is the new first house of block ${b} (${mins[b]}..${maxs[b]})` : `house ${x ?? mins[b]} joins block ${b}`;
      if (pbk && pbk[1][1].some((m, i) => m !== maxs[i])) return `block ${b} now runs ${show(mins[b])}..${show(maxs[b])}: only its first and last house are kept`;
      if (bestName && bestName in p && best !== p[bestName]) return `block ${b} starts at house ${mins[b]}, the last house before it is ${p[PREV.find((k) => k in p)] ?? '?'}: a gap of ${best}, the widest so far`;
      if (b !== p[bName] && bestName && mins[b] === Infinity) return `block ${b} is empty: skip it, the empty road just stretches on${pm !== undefined ? ` past house ${pm}` : ''}`;
      if (b !== p[bName] && bestName && pm !== undefined && Number.isFinite(mins[b])) return `look at block ${b}: its first house is ${mins[b]}, the previous block ended at house ${pm}`;
      if ((b !== p[bName] || x !== p[xName]) && x !== undefined && !bestName && Number.isInteger(w) && Number.isInteger(lo)) return `house ${x} → block floor((${x} − ${lo}) / ${w}) = ${b}`;
    }
    if (wName && w !== p[wName] && Number.isInteger(lo) && Number.isInteger(hi) && Number.isInteger(v[ctx.params[0]]?.length)) {
      const n = v[ctx.params[0]].length;
      return `the road runs ${lo}..${hi}: ${n - 1} gaps share ${hi - lo}, so the widest is ≥ ${hi - lo}/${n - 1}; blocks are ${w} wide`;
    }
    if (bk && !buckets(p)) return `${bk[0][1].length} blocks of road, all empty for now`;
    const loName = LO.find((k) => Number.isFinite(v[k]));
    const hiName = HI.find((k) => Number.isFinite(v[k]));
    if (!bk && x !== undefined && loName && v[loName] !== p[loName] && v[loName] === x) return `house ${x} is the first one on the road so far`;
    if (!bk && x !== undefined && hiName && v[hiName] !== p[hiName] && v[hiName] === x) return `house ${x} is the last one on the road so far`;
    return null;
  },
  // which block does the next house fall into? / what is the widest gap after this block?
  predict(ctx) {
    if (!ctx.next) return null;
    const v = ctx.vars;
    const nx = ctx.next.vars;
    const bk = buckets(v);
    if (!bk) return null;
    const count = bk[0][1].length;
    const [bName, b] = firstInt(v, B);
    const nb = bName ? nx[bName] : undefined;
    const [xName, x] = firstInt(v, X);
    const [, w] = firstInt(v, W);
    const [, lo] = firstInt(v, LO);
    const [bestName, best] = firstInt(v, BEST);
    // fill phase: the next house and its block appear together in the next step
    if (!bestName && bk[0][1].filter(Number.isFinite).length === 1 && !Number.isFinite(bk[0][1][nx[bName]]) && xName && Number.isInteger(nb) && Number.isInteger(nx[xName]) && nx[xName] !== x && Number.isInteger(w) && Number.isInteger(lo) && nb < count && b !== undefined) {
      const wrong = [nb - 1, nb + 1, Math.floor(nx[xName] / w)].filter((k) => k >= 0 && k < count && k !== nb);
      return options(`The next house is ${nx[xName]}; the road starts at ${lo} and blocks are ${w} wide. Which block does it fall into?`, nb, wrong, `floor((${nx[xName]} − ${lo}) / ${w}) = ${nb}: each block covers ${w} consecutive house numbers starting from ${lo}.`);
    }
    // scan phase: a fresh non-empty block, the best gap is updated next
    const [, pm] = firstInt(v, PREV);
    if (bestName && bName && b !== ctx.prev[bName] && nb === b && b < count && Number.isFinite(bk[0][1][b]) && pm !== undefined && Number.isInteger(nx[bestName])) {
      const gap = bk[0][1][b] - pm;
      if (gap <= 0) return null;
      const right = nx[bestName];
      return options(`Block ${b} starts at house ${bk[0][1][b]}; the previous non-empty block ended at ${pm}. Widest gap so far: ${best}. What is it now?`, right, [best, gap, bk[1][1][b] - pm, bk[1][1][b] - bk[0][1][b]].filter((t) => t !== right), `The gap between blocks is ${bk[0][1][b]} − ${pm} = ${gap}; the widest so far is max(${best}, ${gap}) = ${right}.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Forget to skip empty blocks',
      find: 'if (bMin[b] === Infinity) continue;',
      replace: '',
      explain: 'An empty block’s first house is Infinity, so the gap becomes Infinity − 3 = Infinity and the answer is Infinity instead of 3.',
    },
    {
      label: 'Block width can be 0',
      find: 'Math.max(1, Math.floor((hi - lo) / (n - 1)))',
      replace: 'Math.floor((hi - lo) / (n - 1))',
      explain: 'For [1,1,1,5,5,5] the width is floor(4 / 5) = 0: dividing by 0 makes the block count Infinity and the run crashes.',
    },
  ],
};
