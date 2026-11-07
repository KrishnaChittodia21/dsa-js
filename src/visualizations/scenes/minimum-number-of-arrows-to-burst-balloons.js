// Minimum Number of Arrows to Burst Balloons: balloons on a wall, handled in order of where they end. A balloon that
// starts right of the last arrow needs a new one, shot at its right end; any balloon starting by then is already burst.
import { row } from './util.js';

const num = (v) => typeof v === 'number';
const isPair = (v) => !!row(v) && v.length === 2 && v.every(num);
const listOf = (v) => (Array.isArray(v) && v.length && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const CUR = ['cur', 'curr', 'current', 'p', 'pt', 'point', 'balloon', 'interval', 'iv', 'item', 'seg', 'range'];
const INTS = [['s', 'e'], ['start', 'end'], ['xStart', 'xEnd'], ['x1', 'x2'], ['l', 'r'], ['lo', 'hi'], ['left', 'right'], ['from', 'to']];
const IDX = ['i', 'j', 'k', 'idx'];
const BOUND = ['arrowX', 'arrow', 'arrowPos', 'shot', 'pos', 'x', 'lastEnd', 'prevEnd', 'end', 'last', 'curEnd', 'currEnd', 'prev', 'limit', 'reach', 'minEnd', 'right'];
const COUNT = ['arrows', 'count', 'cnt', 'ans', 'res', 'result', 'shots', 'total', 'numArrows'];

/** the balloon list being walked: a sorted copy, else the (maybe sorted in place) parameter */
function listIn(vars, params) {
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && listOf(v));
  return own ? own[1] : listOf(vars[params[0]]);
}

/** { iv, bound, count } read from one snapshot, or null when the shape is unclear */
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
  const bn = BOUND.find((k) => !used.includes(k) && (num(vars[k]) || isPair(vars[k])));
  const cn = COUNT.find((k) => !used.includes(k) && k !== bn && Number.isInteger(vars[k]));
  const bound = bn === undefined ? undefined : num(vars[bn]) ? vars[bn] : vars[bn][1];
  return { iv, bound, count: cn === undefined ? undefined : vars[cn], cn };
}

const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
/** a balloon is up for a decision: the next step brings a new one, or this step just brought one and decided nothing */
const arriving = (now, was, nx) => !same(now.iv, nx.iv) || (!!was && !same(now.iv, was.iv) && now.count === was.count && now.bound === was.bound);
const at = (x) => (Number.isFinite(x) ? `x = ${x}` : 'nowhere yet');

export default {
  id: 'minimum-number-of-arrows-to-burst-balloons',
  metaphor: 'Arrows shot up through balloons',
  caption: 'Balloons are taken in order of where they end. One that starts right of the last arrow needs a new arrow, shot at its right end; every balloon starting at or before that spot is burst by it too.',
  narrate(ctx) {
    const { params } = ctx;
    const list = listIn(ctx.vars, params);
    const before = listIn(ctx.prev, params);
    if (list && list.length > 1 && (!before || list.some((p, i) => !same(p, before[i])))) {
      const byEnd = list.every((p, i) => i === 0 || list[i - 1][1] <= p[1]);
      const byStart = list.every((p, i) => i === 0 || list[i - 1][0] <= p[0]);
      if (byEnd || byStart) return `balloons lined up by their ${byEnd ? 'right' : 'left'} end: ${list.map(show).join(' ')}`;
    }
    const now = stateOf(ctx.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !was || !now.iv || now.bound === undefined) return null;
    const fresh = !same(now.iv, was.iv);
    const [s, e] = now.iv;
    if (now.cn && was.count !== undefined && now.count === was.count + 1) {
      if (!Number.isFinite(now.bound)) return `the first balloon ${show(now.iv)} needs the first arrow`;
      return `balloon ${show(now.iv)} starts at ${s}, right of the arrow at ${now.bound}: it needs arrow #${now.count}`;
    }
    if (num(was.bound) && now.bound !== was.bound && Number.isFinite(now.bound)) {
      if (now.bound < was.bound) return `the arrow slides left to x = ${now.bound} so it still bursts ${show(now.iv)} as well`;
      if (now.bound === e) return `the arrow goes at x = ${e}, the right end of ${show(now.iv)}: any balloon starting by ${e} bursts too`;
      return null;
    }
    if (fresh && now.count === was.count && now.bound === was.bound && Number.isFinite(now.bound) && s <= now.bound) {
      return `balloon ${show(now.iv)} starts at ${s}, not past the arrow at ${now.bound}: it is already burst, no new arrow`;
    }
    return null;
  },
  // as the next balloon comes up: does it need a new arrow?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = stateOf(ctx.next.vars, ctx.params);
    if (!now || !nx || !nx.iv || !now.cn || nx.cn !== now.cn || !Number.isFinite(now.bound) || !arriving(now, stateOf(ctx.prev, ctx.params), nx)) return null;
    let need;
    if (nx.count === now.count + 1) need = true;
    else if (nx.count === now.count && num(nx.bound) && nx.bound <= now.bound) need = false;
    else return null;
    const [s] = nx.iv;
    return {
      question: `Next balloon: ${show(nx.iv)}. The last arrow flies at ${at(now.bound)}. Does it need a new arrow?`,
      options: ['Yes: shoot a new arrow', 'No: it shares the last arrow'],
      answer: need ? 0 : 1,
      explain: need ? `It starts at ${s}, right of ${now.bound}, so the last arrow misses it.` : `It starts at ${s}, not past ${now.bound}: one arrow can burst it together with the earlier ones (touching counts, the ranges are closed).`,
    };
  },
  bugs: [
    {
      label: 's >= arrowX: a balloon touching the arrow gets its own',
      find: 's > arrowX',
      replace: 's >= arrowX',
      explain: 'An arrow exactly at a balloon\'s start still bursts it (closed ranges), but this shoots a new arrow there, so [1,2],[2,3] uses 2 arrows instead of 1.',
    },
    {
      label: 'Sort by start: a long balloon decides the arrow',
      find: 'a[1] - b[1]',
      replace: 'a[0] - b[0]',
      explain: 'Taking balloons by start and shooting at the first one\'s right end lets a wide balloon like [1,10] place the arrow too far right, so balloons inside it are missed.',
    },
  ],
};
