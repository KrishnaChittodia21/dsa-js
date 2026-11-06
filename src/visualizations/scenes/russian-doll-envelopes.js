// Russian Doll Envelopes: sort by width (equal widths tallest first), then the deepest nest is the longest strictly
// rising run of heights. tails[k] is the lowest height that can top a nest of k + 1 envelopes; each height either
// starts a deeper nest or lowers one top. Works with a tails row under common names; an O(n²) dp falls back.
import { changedIdx, row, writtenCell } from './util.js';

const TAILS = ['tails', 'tail', 'piles', 'pile', 'tops', 'top', 'lis', 'sub', 'seq', 'stack', 'dp', 'd', 'res', 'arr', 'heights', 'ends', 'minEnd', 'best'];
const isPairs = (v) => Array.isArray(v) && v.length > 0 && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger));
const show = (p) => `[${p[0]},${p[1]}]`;
const rising = (a) => a.every((x, t) => t === 0 || a[t - 1] < x);

/** [name, row] of the tails row: a listed non-parameter row of numbers, strictly rising, every value a real height */
function tailsOf(vars, params, heights) {
  const k = TAILS.find((x) => !params.includes(x) && row(vars[x]) && vars[x].every((h) => heights.has(h)) && rising(vars[x]));
  return k ? [k, vars[k]] : [];
}
/** how a tails row changed between two snapshots: { kind: 'grow' | 'lower' | 'same', at, h, was } */
function tailsChange(before, after) {
  if (!row(before) || !row(after)) return null;
  if (after.length === before.length + 1 && before.every((x, t) => after[t] === x)) return { kind: 'grow', at: before.length, h: after[before.length] };
  if (after.length !== before.length) return null;
  const d = changedIdx(after, before);
  if (d.length === 1) return { kind: 'lower', at: d[0], h: after[d[0]], was: before[d[0]] };
  return null;
}
function setup(ctx) {
  const env = ctx.input?.[0];
  if (!isPairs(env)) return null;
  return { env, heights: new Set(env.map((p) => p[1])) };
}

export default {
  id: 'russian-doll-envelopes',
  metaphor: 'Nesting envelopes, smallest inside',
  caption: 'Envelopes are sorted by width, and equal widths tallest first so two of them can never both be picked. Then the tails row keeps, for every nest depth, the lowest height that can top it: a taller height opens a deeper nest, a lower one replaces a top.',
  narrate(ctx) {
    const s = setup(ctx);
    if (!s) return null;
    if (ctx.ret && Number.isInteger(ctx.value)) return `the deepest nest holds ${ctx.value} envelope${ctx.value === 1 ? '' : 's'}`;
    // the sort: an array of pairs that just became width-sorted
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (!isPairs(v) || v.length !== s.env.length || JSON.stringify(v) === JSON.stringify(ctx.prev[k])) continue;
      const byW = v.every((p, t) => t === 0 || v[t - 1][0] <= p[0]);
      if (!byW) continue;
      const tieDown = v.every((p, t) => t === 0 || v[t - 1][0] !== p[0] || v[t - 1][1] >= p[1]);
      const list = v.length <= 8 ? `: ${v.map(show).join(' ')}` : '';
      return tieDown ? `sorted by width, equal widths tallest first${list}` : `sorted by width, but equal widths go shortest first: they could wrongly nest${list}`;
    }
    const [tName, tails] = tailsOf(ctx.vars, ctx.params, s.heights);
    if (!tName) return null;
    const c = tailsChange(ctx.prev[tName], tails);
    if (!c) {
      const w = writtenCell(ctx.src, ctx.vars);
      if (w && w.name === tName && w.at.length === 1 && JSON.stringify(ctx.prev[tName]) === JSON.stringify(tails) && Number.isInteger(tails[w.at[0]])) return `height ${tails[w.at[0]]} equals the top at depth ${w.at[0] + 1}: nothing changes (equal heights never nest)`;
      return Array.isArray(ctx.prev[tName]) || tails.length ? null : 'no nest yet: the tops row starts empty';
    }
    if (c.kind === 'grow') return c.at === 0 ? `height ${c.h} starts the first nest: depth 1` : `height ${c.h} is taller than every top: a nest of depth ${c.at + 1} now exists, topped by ${c.h}`;
    return `height ${c.h} is lower than ${c.was}: depth ${c.at + 1} can now be topped by ${c.h}, leaving more room above`;
  },
  // right before the tops row changes: where does this height go?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = setup(ctx);
    if (!s) return null;
    const [tName, tails] = tailsOf(ctx.vars, ctx.params, s.heights);
    if (!tName || tails.length < 2) return null;
    const nx = ctx.next.vars[tName];
    let c = tailsChange(tails, nx);
    if (!c) {
      // a write that leaves the row as it was: the height equals a top
      const w = writtenCell(ctx.lines[ctx.next.line - 1], ctx.next.vars);
      if (!w || w.name !== tName || w.at.length !== 1 || JSON.stringify(nx) !== JSON.stringify(tails) || !Number.isInteger(tails[w.at[0]])) return null;
      c = { kind: 'same', at: w.at[0], h: tails[w.at[0]] };
    }
    const same = 'Nothing changes: it equals a top';
    const opts = ['It opens a deeper nest (added at the end)', ...tails.map((x) => `It replaces top ${x}`)];
    if (c.kind === 'same') {
      const wrong = [opts[0], ...tails.filter((x) => x > c.h).slice(0, 1).map((x) => `It replaces top ${x}`), ...tails.filter((x) => x < c.h).slice(-1).map((x) => `It replaces top ${x}`)];
      const pos = c.h % (wrong.length + 1); // a stable, varying place for the right option
      const all = [...wrong.slice(0, pos), same, ...wrong.slice(pos)];
      return {
        question: `Height ${c.h} arrives; the tops are [${tails.join(', ')}]. Where does it go?`,
        options: all,
        answer: pos,
        explain: `${c.h} lands on the top that is not lower than it, which is ${c.h} itself: equal heights cannot nest, so nothing changes.`,
      };
    }
    const answer = c.kind === 'grow' ? 0 : 1 + c.at;
    if (opts.length > 4) {
      // keep the right one plus up to three neighbours
      const keep = [...new Set([0, answer, Math.max(1, answer - 1), Math.min(opts.length - 1, answer + 1), opts.length - 1])].sort((a, b) => a - b).slice(0, 4);
      if (!keep.includes(answer)) keep[keep.length - 1] = answer;
      keep.sort((a, b) => a - b);
      return {
        question: `Height ${c.h} arrives; the tops are [${tails.join(', ')}]. Where does it go?`,
        options: keep.map((t) => opts[t]),
        answer: keep.indexOf(answer),
        explain: c.kind === 'grow' ? `${c.h} is taller than every top, so it extends the deepest nest.` : `${c.h} replaces the first top that is not lower than it (${c.was}): same depth, lower top.`,
      };
    }
    return {
      question: `Height ${c.h} arrives; the tops are [${tails.join(', ')}]. Where does it go?`,
      options: opts,
      answer,
      explain: c.kind === 'grow' ? `${c.h} is taller than every top, so it extends the deepest nest.` : `${c.h} replaces the first top that is not lower than it (${c.was}): same depth, lower top.`,
    };
  },
  bugs: [
    {
      label: 'Equal widths shortest first',
      find: 'b[1] - a[1]',
      replace: 'a[1] - b[1]',
      explain: 'Envelopes of the same width then appear with rising heights, so [1,1] [1,2] [1,3] look like a nest of 3 although none fits in another.',
    },
    {
      label: 'Let equal heights nest (≤ in the search)',
      find: 'tails[mid] < h',
      replace: 'tails[mid] <= h',
      explain: 'An equal height then goes after its twin instead of replacing it, so envelopes of the same height count as nested.',
    },
  ],
};
