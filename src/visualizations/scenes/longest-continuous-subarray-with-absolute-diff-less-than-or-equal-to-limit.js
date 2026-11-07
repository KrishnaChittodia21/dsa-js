// Longest Continuous Subarray With Absolute Diff ≤ Limit (sliding window + two monotonic deques). A row of people
// for a photo: the gap between the tallest and the shortest in the frame must stay within limit. One line of
// contenders tracks the tallest, the other the shortest; when the gap is too big the frame's start moves forward.
// Works with toolkit Deques or plain arrays named max…/min… (indexes or values), left/l/start/i + right/r/end/j.
import { options, row } from './util.js';

const isInt = Number.isInteger;
const PAIRS = [
  ['left', 'right'],
  ['l', 'r'],
  ['start', 'end'],
  ['i', 'j'],
  ['lo', 'hi'],
];
const BEST = ['best', 'ans', 'res', 'result', 'maxLen', 'longest', 'max', 'maxLength', 'len'];

/** the items of a deque snapshot, front first: a plain array, a toolkit Queue (items/head) or Deque (ring) */
function listOf(v) {
  if (row(v)) return v;
  const o = v && v.$obj;
  if (!o) return null;
  if (row(o.items)) return isInt(o.head) ? o.items.slice(o.head) : o.items;
  if (row(o.buf) && isInt(o.head) && isInt(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/** how a deque changed: push (at the back), back / front (one popped), or null */
function change(before, after, src) {
  if (!before || !after) return null;
  if (after.length === before.length + 1 && same(after.slice(0, -1), before)) return { kind: 'push', x: after[after.length - 1] };
  if (after.length !== before.length - 1) return null;
  const back = same(after, before.slice(0, -1));
  const front = same(after, before.slice(1));
  if (back && front) return /popFront|shift|dequeue|pollFirst/.test(src || '') ? { kind: 'front', x: before[0] } : /popBack|\.pop\(/.test(src || '') ? { kind: 'back', x: before[0] } : null;
  return back ? { kind: 'back', x: before[before.length - 1] } : front ? { kind: 'front', x: before[0] } : null;
}

function stateOf(ctx, vars) {
  if (!vars) return null;
  const [aName, limName] = ctx.params;
  const a = row(vars[aName]);
  const limit = vars[limName];
  const pair = PAIRS.find(([x, y]) => isInt(vars[x]) && isInt(vars[y]));
  if (!a || typeof limit !== 'number' || !pair) return null;
  const code = ctx.lines.join('\n');
  const deque = (re) => {
    const e = Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && re.test(k) && listOf(v));
    if (!e) return null;
    const idx = new RegExp(`\\b${aName}\\s*\\[\\s*${e[0]}\\s*[.[]`).test(code);
    const list = listOf(e[1]);
    return { name: e[0], list, idx, vals: list.map((x) => (idx ? a[x] : x)), desc: (x) => (idx ? `${a[x]} (index ${x})` : `${x}`) };
  };
  const hi = deque(/max|big|tall|high|large|dec|desc/i);
  const lo = deque(/min|small|short|low|inc|asc/i);
  const bName = BEST.find((n) => !ctx.params.includes(n) && isInt(vars[n]) && !pair.includes(n));
  return { a, limit, lName: pair[0], rName: pair[1], l: vars[pair[0]], r: vars[pair[1]], hi, lo, bName, best: vars[bName] };
}
const top = (d) => (d && d.vals.length ? d.vals[0] : undefined);

export default {
  id: 'longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit',
  metaphor: 'A photo where heights stay close',
  caption: 'The bracket is the frame. One line keeps the tallest contenders (front = tallest in the frame), the other the shortest; when tallest − shortest goes over limit, the frame\'s start moves forward.',
  range: PAIRS,
  pointers: PAIRS.flat(),
  compare: 'best',
  narrate(ctx) {
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    if (!s || !p || p.lName !== s.lName) return null;
    const { a, limit, l, r } = s;
    const newcomer = isInt(r) && r < a.length ? a[r] : undefined;
    if (l > p.l && isInt(top(p.hi)) && isInt(top(p.lo))) {
      const gap = top(p.hi) - top(p.lo);
      return gap > limit ? `tallest ${top(p.hi)} − shortest ${top(p.lo)} = ${gap} > ${limit}: the frame's start moves to ${l}` : `the frame's start moves to ${l}`;
    }
    for (const [d, pd, word, rel] of [[s.hi, p.hi, 'tallest', 'shorter'], [s.lo, p.lo, 'shortest', 'taller']]) {
      if (!d || !pd || d.name !== pd.name) continue;
      const c = change(pd.list, d.list, ctx.src);
      if (c?.kind === 'back') return newcomer !== undefined ? `${d.desc(c.x)} is ${rel} than the newcomer ${newcomer}: it can never be the ${word} again` : `${d.desc(c.x)} leaves the ${word} line`;
      if (c?.kind === 'front') return `${d.desc(c.x)} left the frame: ${d.vals.length ? `the ${word} is now ${d.vals[0]}` : `the ${word} line is empty`}`;
      if (c?.kind === 'push') return `${d.desc(c.x)} joins the ${word} line (${d.vals.join(word === 'tallest' ? ' ≥ ' : ' ≤ ')})`;
    }
    const len = r - l + 1;
    const gapNow = isInt(top(s.hi)) && isInt(top(s.lo)) ? ` (tallest ${top(s.hi)} − shortest ${top(s.lo)} = ${top(s.hi) - top(s.lo)} ≤ ${limit})` : '';
    if (s.bName && s.bName === p.bName && s.best > p.best && s.best === len) return `frame ${l}..${r} fits${gapNow}: ${len} long, a new best`;
    if (s.bName && s.best === p.best && new RegExp(`\\b${s.bName}\\s*=[^=]`).test(ctx.src || '')) return `frame ${l}..${r} is ${len} long: the best stays ${s.best}`;
    if (r !== p.r && newcomer !== undefined) return `${newcomer} steps into the frame at index ${r}`;
    return null;
  },
  // the newcomer is in both lines: is the gap too big, so the start moves?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = stateOf(ctx, ctx.vars);
    const p = stateOf(ctx, ctx.prev);
    const n = stateOf(ctx, ctx.next.vars);
    if (!s || !p || !n || !s.hi || !s.lo || !n.hi || !n.lo || n.lName !== s.lName || n.r !== s.r || !isInt(s.r) || s.r <= s.l) return null;
    const v = s.a[s.r];
    const backs = [s.hi, s.lo].every((d) => d.list.length && (d.idx ? d.list[d.list.length - 1] === s.r : d.list[d.list.length - 1] === v));
    const justPushed = [[s.hi, p.hi], [s.lo, p.lo]].some(([d, pd]) => pd && d.name === pd.name && change(pd.list, d.list, ctx.src)?.kind === 'push');
    if (!backs || !justPushed) return null;
    const hiV = top(s.hi);
    const loV = top(s.lo);
    if (!isInt(hiV) || !isInt(loV)) return null;
    const moved = n.l !== s.l || change(s.hi.list, n.hi.list)?.kind === 'front' || change(s.lo.list, n.lo.list)?.kind === 'front';
    const kept = !moved && (n.best !== s.best || (s.bName && new RegExp(`\\b${s.bName}\\s*=[^=]`).test(ctx.lines[ctx.next.line - 1] || '')));
    if (!moved && !kept) return null;
    const yes = 'Yes: the start moves forward';
    const no = 'No: the frame keeps its start';
    return options(
      `Frame ${s.l}..${s.r}: tallest ${hiV}, shortest ${loV}, limit ${s.limit}. Does the start move?`,
      moved ? yes : no,
      [moved ? no : yes],
      `${hiV} − ${loV} = ${hiV - loV} ${hiV - loV > s.limit ? `> ${s.limit}: too far apart, so cells leave from the left` : `≤ ${s.limit}: every pair in the frame is close enough`}.`,
    );
  },
  bugs: [
    {
      label: 'Gap of exactly limit counted as too big',
      find: 'nums[maxD.front()] - nums[minD.front()] > limit',
      replace: 'nums[maxD.front()] - nums[minD.front()] >= limit',
      explain: 'A difference equal to limit is allowed; >= shrinks the frame one cell too early, so frames like [2,4,7,2] (gap 5, limit 5) are missed.',
    },
  ],
};
