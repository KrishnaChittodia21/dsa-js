// Remove Covered Intervals: rugs laid on a floor from left to right (the longer one first on a tie). A rug whose end
// does not reach past the farthest end so far lies completely under an earlier rug and is removed.
import { row } from './util.js';

const num = (v) => typeof v === 'number';
const isPair = (v) => !!row(v) && v.length === 2 && v.every(num);
const listOf = (v) => (Array.isArray(v) && v.length && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const CUR = ['cur', 'curr', 'current', 'p', 'interval', 'iv', 'item', 'seg', 'range', 'rug'];
const INTS = [['s', 'e'], ['start', 'end'], ['l', 'r'], ['lo', 'hi'], ['left', 'right'], ['from', 'to'], ['c', 'd']];
const ENDS = ['end', 'e', 'r', 'right', 'hi', 'to'];
const IDX = ['i', 'j', 'k', 'idx'];
const BOUND = ['maxEnd', 'maxRight', 'maxR', 'reach', 'farthest', 'furthest', 'prevEnd', 'lastEnd', 'curEnd', 'currEnd', 'end', 'right', 'r', 'max', 'best', 'prev'];
const KEPT = ['remaining', 'count', 'cnt', 'kept', 'res', 'result', 'ans', 'left', 'total', 'uncovered'];
const REMOVED = ['covered', 'removed', 'remove', 'del', 'deleted', 'drop'];

/** the rug list being walked: a sorted copy, else the (maybe sorted in place) parameter */
function listIn(vars, params) {
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && listOf(v));
  return own ? own[1] : listOf(vars[params[0]]);
}

/** { iv: [start | undefined, end], bound, count, cn, kept } from one snapshot */
function stateOf(vars, params) {
  if (!vars) return null;
  let iv = null;
  let used = [];
  const c = CUR.find((k) => isPair(vars[k]));
  const ints = INTS.find(([a, b]) => num(vars[a]) && num(vars[b]));
  const list = listIn(vars, params);
  const ix = IDX.find((k) => Number.isInteger(vars[k]) && list?.[vars[k]]);
  if (c) [iv, used] = [vars[c], [c]];
  else if (ints) [iv, used] = [[vars[ints[0]], vars[ints[1]]], ints];
  else if (ix) [iv, used] = [list[vars[ix]], [ix]];
  let bn = BOUND.find((k) => !used.includes(k) && (num(vars[k]) || isPair(vars[k])));
  // `for (const [, end] of sorted)`: only the end is named; it is the rug when another name holds the reach
  const en = !iv && ENDS.find((k) => num(vars[k]) && BOUND.some((b) => b !== k && num(vars[b])));
  if (en) {
    const hits = (list || []).filter((q) => q[1] === vars[en]);
    [iv, used] = [hits.length === 1 ? hits[0] : [undefined, vars[en]], [en]];
    bn = BOUND.find((k) => k !== en && num(vars[k]));
  }
  const free = (k) => !used.includes(k) && k !== bn && Number.isInteger(vars[k]);
  const kn = KEPT.find(free);
  const rn = REMOVED.find(free);
  const cn = kn ?? rn;
  const bound = bn === undefined ? undefined : num(vars[bn]) ? vars[bn] : vars[bn][1];
  return { iv, bound, cn, count: cn === undefined ? undefined : vars[cn], kept: cn === kn };
}

const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
const rug = (p) => (p[0] === undefined ? 'a rug' : show(p));
/** a rug is up for a decision: the next step brings a new one, or this step just brought one and decided nothing */
const arriving = (now, was, nx) => !same(now.iv, nx.iv) || (!!was && !same(now.iv, was.iv) && now.count === was.count && now.bound === was.bound);

/** 'stays' | 'covered' | null: what the next step does with a new rug */
function verdict(now, nx) {
  if (!now.cn || nx.cn !== now.cn || nx.kept !== now.kept) return null;
  if (nx.count === now.count + 1) return now.kept ? 'stays' : 'covered';
  if (nx.count !== now.count || !num(nx.bound)) return null;
  if (nx.bound > now.bound && nx.bound === nx.iv[1]) return 'stays';
  return now.kept && nx.bound === now.bound ? 'covered' : null;
}

export default {
  id: 'remove-covered-intervals',
  metaphor: 'Rugs hiding under longer rugs',
  caption: 'Rugs are laid left to right, the longer one first when two start together. The marker is the farthest any rug reaches so far: a rug that does not stick out past it lies completely under an earlier rug.',
  narrate(ctx) {
    const { params } = ctx;
    const list = listIn(ctx.vars, params);
    const before = listIn(ctx.prev, params);
    if (list && list.length > 1 && (!before || list.some((p, i) => !same(p, before[i])))) {
      const ok = list.every((p, i) => i === 0 || list[i - 1][0] < p[0] || (list[i - 1][0] === p[0] && list[i - 1][1] >= p[1]));
      if (ok) return `rugs laid out left to right, longer first on a tie: ${list.map(show).join(' ')}`;
    }
    const now = stateOf(ctx.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !was || !now.iv || now.bound === undefined) return null;
    const e = now.iv[1];
    const reach = Number.isFinite(now.bound) ? `the farthest reach so far is ${now.bound}` : 'nothing is laid yet';
    if (now.cn && now.cn === was.cn && now.count === was.count + 1) {
      if (now.kept) return `${rug(now.iv)} ends at ${e}, ${reach}: it sticks out, so it stays (${now.count} left)`;
      return `${rug(now.iv)} ends at ${e}, within the reach ${now.bound}: an earlier rug covers it (${now.count} removed)`;
    }
    if (num(was.bound) && now.bound !== was.bound && now.bound === e && Number.isFinite(now.bound)) return `the reach moves out to ${e}`;
    if (!same(now.iv, was.iv) && now.cn && now.count === was.count && now.kept && now.bound === was.bound && e <= now.bound) {
      return `${rug(now.iv)} ends at ${e}, within the reach ${now.bound}: it lies under an earlier rug and is removed`;
    }
    return null;
  },
  // as the next rug comes up: does it stay or is it covered?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = stateOf(ctx.next.vars, ctx.params);
    if (!now || !nx || !nx.iv || !Number.isFinite(now.bound) || !arriving(now, stateOf(ctx.prev, ctx.params), nx)) return null;
    const v = verdict(now, nx);
    if (!v) return null;
    const e = nx.iv[1];
    return {
      question: `Next: ${nx.iv[0] === undefined ? `a rug ending at ${nx.iv[1]}` : show(nx.iv)}. The farthest reach so far is ${now.bound}. Does it stay or is it covered?`,
      options: ['It stays', 'Covered: remove it'],
      answer: v === 'stays' ? 0 : 1,
      explain: v === 'stays' ? `It ends at ${e}, past ${now.bound}, so no earlier rug reaches over its end.` : `It ends at ${e} ≤ ${now.bound}, and the rug that reached ${now.bound} started no later, so it covers this one.`,
    };
  },
  bugs: [
    {
      label: 'No tie-break: the shorter rug comes first',
      find: 'a[0] - b[0] || b[1] - a[1]',
      replace: 'a[0] - b[0]',
      explain: 'With equal starts, [1,2] may be laid before [1,4], so it sticks out past the reach at that moment and is never seen as covered.',
    },
    {
      label: 'end >= maxEnd: equal ends count as sticking out',
      find: 'end > maxEnd',
      replace: 'end >= maxEnd',
      explain: 'A rug that ends exactly at the reach and starts later lies under the earlier one, but >= keeps it.',
    },
  ],
};
