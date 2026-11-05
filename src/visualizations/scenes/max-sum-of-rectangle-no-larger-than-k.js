// Max Sum of Rectangle No Larger Than K. Fix a top and a bottom row and squash that band of rows into one strip of
// column sums; every rectangle in the band is a stretch of the strip. Kadane gives the strip's best stretch; when it
// is over k, running sums and a sorted list of earlier ones find the best stretch that still fits under k.
import { firstInt, options, row } from './util.js';

const TOP = ['top', 'r1', 't', 'up', 'startRow', 'i'];
const BOTTOM = ['bottom', 'r2', 'b', 'down', 'endRow', 'j'];
const KAD = ['kad', 'kadane', 'maxSub', 'unbounded', 'mx', 'maxSum'];
const PREFIX = ['prefix', 'pre', 'running', 'sum', 'cum', 'run', 'acc'];
const BEST = ['best', 'res', 'result', 'ans', 'answer', 'max'];
const SORTED = /sorted|set|seen|prefixes|list|arr|bst/i;

const fmt = (x) => (x === -Infinity ? 'none yet' : x);
const bestOf = (vars, k) => BEST.find((n) => n !== k && typeof vars[n] === 'number');
// the strip: an all-number row as long as a matrix row, not the matrix itself, under a column-sum-like name
function stripOf(vars, cols) {
  const e = Object.entries(vars).filter(([n, v]) => row(v) && v.length === cols && !SORTED.test(n));
  return e.find(([n]) => /col|sum|strip|tmp|line|arr|row/i.test(n)) || null;
}
const bandOf = (vars) => {
  const [, t] = firstInt(vars, TOP);
  const [, b] = firstInt(vars, BOTTOM);
  return t !== undefined && b !== undefined && b >= t ? `rows ${t}…${b}` : 'this band';
};
const topOf = (vars) => {
  const [, t] = firstInt(vars, TOP);
  return t === undefined ? '' : ` ${t}`;
};
// every stretch sum of a strip
const stretches = (s) => s.flatMap((_, l) => s.slice(l).map((__, r) => s.slice(l, l + r + 1).reduce((x, y) => x + y, 0)));

export default {
  id: 'max-sum-of-rectangle-no-larger-than-k',
  metaphor: 'Squash a band of rows into a strip',
  caption: 'For each pair of top and bottom rows, the band is squashed into one strip of column sums; a rectangle is then just a stretch of the strip. Running sums plus a sorted list of earlier ones find the best stretch that still fits under k.',
  compare: 'best',
  narrate(ctx) {
    const [mName, kName] = ctx.params;
    const m = ctx.vars[mName];
    const k = ctx.vars[kName];
    if (!Array.isArray(m) || !row(m[0]) || typeof k !== 'number') return null;
    const cols = m[0].length;
    const v = ctx.vars;
    const p = ctx.prev;
    const b = bestOf(v, kName);
    if (b && typeof p[b] === 'number' && v[b] > p[b]) {
      const [prName, pr] = firstInt(v, PREFIX);
      const hasSorted = Object.entries(v).some(([n, x]) => SORTED.test(n) && row(x));
      const via = hasSorted && prName ? ` (running sum ${pr} − earlier ${pr - v[b]})` : '';
      return `${bandOf(v)}: a rectangle summing to ${v[b]} fits under k = ${k}${via} → new best${v[b] === k ? ', and nothing can beat exactly k' : ''}`;
    }
    const s = stripOf(v, cols);
    if (s) {
      const was = row(p[s[0]]);
      if (!was || was.length !== cols) return s[1].every((x) => x === 0) && s[0] in v ? `new top row${topOf(v)}: start an empty strip and add the rows below it one by one` : null;
      if (s[1].every((x) => x === 0) && s[1].some((x, i) => x !== was[i])) return `new top row${topOf(v)}: start an empty strip and add the rows below it one by one`;
      const d = s[1].map((x, c) => (x === was[c] ? -1 : c)).filter((c) => c >= 0);
      const [, c] = firstInt(v, ['c', 'col', 'j', 'x']);
      if (d.length && (d.length > 1 || d[0] === cols - 1 || c === cols - 1)) return `${bandOf(v)} squashed into one strip of column sums: [${s[1].join(', ')}]`;
      if (d.length) return null;
    }
    const [kadName, kad] = firstInt(v, KAD);
    const sorted = Object.entries(v).find(([n, x]) => SORTED.test(n) && row(x));
    if (sorted) {
      const before = row(p[sorted[0]]);
      if (!before) return `${kadName && kad > k ? `the strip's best stretch (${kad}) is over k = ${k}: ` : ''}search running sums instead, starting from 0`;
      if (sorted[1].length === before.length + 1) return `remember running sum ${sorted[1].find((x, i) => x !== before[i]) ?? sorted[1][sorted[1].length - 1]}: sorted so far [${sorted[1].join(', ')}]`;
    }
    const [prName, pr] = firstInt(v, PREFIX);
    if (prName && prName in p && pr !== p[prName] && sorted) return `running sum ${pr}: a stretch ending here fits if an earlier running sum is ≥ ${pr} − ${k} = ${pr - k}`;
    return null;
  },
  // right before the best changes: what does it become?
  predict(ctx) {
    const [mName, kName] = ctx.params;
    const m = ctx.vars[mName];
    const k = ctx.vars[kName];
    if (!ctx.next || !Array.isArray(m) || !row(m[0]) || typeof k !== 'number') return null;
    const b = bestOf(ctx.vars, kName);
    const right = b && ctx.next.vars[b];
    if (!b || typeof right !== 'number' || !(right > ctx.vars[b]) || right > k) return null;
    const s = stripOf(ctx.vars, m[0].length);
    if (!s) return null;
    const all = [...new Set(stretches(s[1]))];
    if (!all.includes(right)) return null; // only when the new best is a stretch of the strip on screen
    const over = all.filter((x) => x > k).sort((x, y) => x - y);
    const under = all.filter((x) => x <= k && x !== right).sort((x, y) => y - x);
    if (under.some((x) => x > right)) return null; // the search is not done with this strip: ask only for its final best
    const wrong = [...over.slice(0, 2), ...under.slice(0, 2)];
    const r = options(`Strip for ${bandOf(ctx.vars)}: [${s[1].join(', ')}], k = ${k}, best so far: ${fmt(ctx.vars[b])}. What does the best become?`, right, wrong, `${right} is the biggest stretch sum of this strip that is still ≤ ${k}${over.length ? `; ${over[over.length - 1]} is bigger but over k` : ''}.`);
    return r;
  },
  bugs: [
    {
      label: 'Trust Kadane alone',
      find: 'if (kad <= k)',
      replace: 'if (true)',
      explain: 'Kadane finds the biggest stretch, not the biggest one under k: [[2, 2, -1]] with k = 0 returns 4 instead of -1.',
    },
    {
      label: 'Forget the running sum 0',
      find: 'const sorted = [0];',
      replace: 'const sorted = [];',
      explain: 'Without the empty start, a stretch that begins at column 0 has nothing to subtract, so rectangles touching the left edge are never counted.',
    },
  ],
};
