// Falling Squares. Each square drops onto the tallest thing under its base (edges that only touch do not count),
// so its top = (max height under [left, left + side)) + side; the answer after each drop is the tallest stack so far.
// The reference keeps the heights in a segment tree over compressed x-cells (query = max under the square, raise =
// lift that stretch). Works with segment trees, or the O(n²) "check every earlier square" loop.
import { functionAt, options, row } from './util.js';

const RES = /^(res|ans|result|answer|out|output|tallest|maxes)$/i;
const H = /^(h|height|top|newH|nh|cur|curH|newHeight|landed|tops?)$/;
const XS = /^(xs|coords|pts|points|keys|edges|sortedX|xsorted|cs)$/i;
const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

/** the correct top of every square, from the input alone */
function tops(pos) {
  const out = [];
  pos.forEach(([l, s], t) => {
    let base = 0;
    for (let j = 0; j < t; j++) if (pos[j][0] < l + s && l < pos[j][0] + pos[j][1]) base = Math.max(base, out[j]);
    out.push(base + s);
  });
  return out;
}
function inputOf(ctx) {
  const pos = ctx.input?.[0];
  return Array.isArray(pos) && pos.length && pos.every((p) => Array.isArray(p) && p.length === 2 && p.every(isNum)) ? { pos, top: tops(pos) } : null;
}
/** the name of the learner's main function: the one whose header holds the first parameter */
function mainName(ctx) {
  const p = ctx.params[0];
  const i = (ctx.lines || []).findIndex((l) => new RegExp(`\\(\\s*${p}\\s*[,)]`).test(l));
  return i < 0 ? '' : functionAt(ctx.lines, i + 2);
}
/** how many squares have landed before this step: the length of the answer list */
function landed(vars, params) {
  const k = Object.keys(vars || {}).find((n) => RES.test(n) && !params.includes(n) && row(vars[n]));
  return k === undefined ? null : vars[k].length;
}
/** [name, value] of the top just computed on this line (main function only) */
function topSet(vars, src) {
  return Object.entries(vars || {}).find(([k, v]) => H.test(k) && isNum(v) && new RegExp(`\\b${k}\\s*=(?!=)`).test(src || '')) || null;
}
const sq = ([l, s]) => `[${l}, ${l + s})`;
/** x-range of compressed cells lo..hi, when the learner keeps the sorted edge list */
function xRange(vars, lo, hi, params) {
  const k = Object.keys(vars).find((n) => XS.test(n) && !params.includes(n) && row(vars[n]));
  const xs = k && vars[k];
  return xs && lo >= 0 && hi + 1 < xs.length ? `x [${xs[lo]}, ${xs[hi + 1]})` : `cells ${lo}..${hi}`;
}

export default {
  id: 'falling-squares',
  metaphor: 'Boxes dropped onto a growing skyline',
  caption: 'Each square falls straight down onto the tallest thing under its base: its top is that height plus its side. Squares that only touch at an edge do not hold each other up. The answer after each drop is the tallest stack so far.',
  narrate(ctx) {
    const inp = inputOf(ctx);
    if (!inp) return null;
    const main = mainName(ctx);
    const fn = functionAt(ctx.lines, ctx.line);
    if (main && fn === main) {
      const t = landed(ctx.vars, ctx.params);
      const h = topSet(ctx.vars, ctx.src);
      if (h && t !== null && t < inp.pos.length && h[1] === inp.top[t]) {
        const [l, s] = inp.pos[t];
        const base = h[1] - s;
        return `square ${t + 1} ${sq([l, s])} falls ${base ? `onto height ${base}` : 'to the ground'}: its top is ${base} + ${s} = ${h[1]}`;
      }
      const k = Object.keys(ctx.vars).find((n) => RES.test(n) && !ctx.params.includes(n) && row(ctx.vars[n]));
      const a = k && row(ctx.vars[k]);
      const b = k && row(ctx.prev[k]);
      if (a && b && a.length === b.length + 1) {
        const v = a[a.length - 1];
        return `after ${a.length} square${a.length > 1 ? 's' : ''} the tallest stack is ${v}${b.length && v > b[b.length - 1] ? ' (a new record)' : ''}`;
      }
      return null;
    }
    // inside the segment tree: a node fully under the square answers for its whole stretch
    // the last return before the main function reads the result: keep the number for the prediction
    if (ctx.ret && isNum(ctx.value) && main && ctx.next && functionAt(ctx.lines, ctx.next.line) === main) return 'the search under the square is done: what is the tallest thing below it?';
    const { lo, hi, l, r } = ctx.vars;
    if (![lo, hi, l, r].every(Number.isInteger) || !(l <= lo && hi <= r)) return null;
    if (ctx.ret && isNum(ctx.value)) return `${xRange(ctx.vars, lo, hi, ctx.params)} lies under the square: its node reports ${ctx.value} (lifts stored above it count too)`;
    const h = ctx.vars.h;
    if (!ctx.ret && isNum(h) && /\b(tag|lazy|cover|set|assign)\w*\[/.test(ctx.src || '') && /=/.test(ctx.src || '')) return `${xRange(ctx.vars, lo, hi, ctx.params)} lies under the square: the whole stretch now stands at ${h}`;
    return null;
  },
  // right before a square's top is computed: where does it land?
  predict(ctx) {
    const inp = inputOf(ctx);
    if (!inp || !ctx.next) return null;
    const main = mainName(ctx);
    if (!main || functionAt(ctx.lines, ctx.next.line) !== main) return null;
    const t = landed(ctx.next.vars, ctx.params);
    const h = topSet(ctx.next.vars, (ctx.lines || [])[ctx.next.line - 1]);
    if (!h || t === null || t < 1 || t >= inp.pos.length || h[1] !== inp.top[t]) return null;
    const [l, s] = inp.pos[t];
    const before = inp.pos.slice(0, t).map((p, j) => `${sq(p)} top ${inp.top[j]}`);
    if (before.length > 5) return null;
    const best = Math.max(...inp.top.slice(0, t));
    return options(
      `Landed so far: ${before.join(', ')}. Square ${sq([l, s])} (side ${s}) is falling: where does its top end up?`,
      h[1],
      [s, best + s, best, h[1] + s].filter((x) => x !== h[1]),
      h[1] === s
        ? `Nothing earlier overlaps ${sq([l, s])} (touching an edge does not count), so it lands on the ground: top = ${s}.`
        : `The tallest earlier square overlapping ${sq([l, s])} reaches ${h[1] - s}, so it rests there: ${h[1] - s} + ${s} = ${h[1]}.`,
    );
  },
  bugs: [
    {
      label: 'Cells idx(l)..idx(l + s): one cell too many',
      find: 'R = idx.get(left + side) - 1;',
      replace: 'R = idx.get(left + side);',
      explain: 'The cell that starts at left + side is outside the square, so a square resting next to another (just touching its edge) is stacked on top of it: [[1, 2], [3, 2]] gives [2, 4] instead of [2, 2].',
    },
    {
      label: 'Each square\'s own height returned',
      find: 'res.push(best);',
      replace: 'res.push(h);',
      explain: 'The answer is the tallest stack so far, not the height of the square that just fell: [[100, 100], [200, 100]] still works, but a short square after a tall one reports the short one.',
    },
  ],
};
