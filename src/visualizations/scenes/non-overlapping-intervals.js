// Non-overlapping Intervals: book as many meetings as possible in one room, taking them by earliest end. A meeting
// that starts at or after the last kept one ends is kept; one that starts earlier clashes and is cancelled.
import { row } from './util.js';

const num = (v) => typeof v === 'number';
const isPair = (v) => !!row(v) && v.length === 2 && v.every(num);
const listOf = (v) => (Array.isArray(v) && v.length && v.every(isPair) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const CUR = ['cur', 'curr', 'current', 'p', 'interval', 'iv', 'item', 'seg', 'range', 'meeting', 'm'];
const INTS = [['s', 'e'], ['start', 'end'], ['l', 'r'], ['lo', 'hi'], ['left', 'right'], ['from', 'to']];
const IDX = ['i', 'j', 'k', 'idx'];
const BOUND = ['lastEnd', 'prevEnd', 'end', 'last', 'curEnd', 'currEnd', 'prev', 'limit', 'boundary', 'minEnd', 'right', 'free'];
const KEPT = ['kept', 'keep', 'count', 'cnt', 'taken', 'chosen', 'nonOverlap', 'ok'];
const REMOVED = ['removed', 'remove', 'removals', 'erased', 'erase', 'ans', 'res', 'result', 'overlaps', 'deleted', 'del', 'drop', 'cuts'];

/** the meeting list being walked: a sorted copy, else the (maybe sorted in place) parameter */
function listIn(vars, params) {
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && listOf(v));
  return own ? own[1] : listOf(vars[params[0]]);
}

/** { iv, bound, count, cn, kept: is the counter a kept-count } from one snapshot */
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
  const free = (k) => !used.includes(k) && k !== bn && Number.isInteger(vars[k]);
  const kn = KEPT.find(free);
  const rn = REMOVED.find(free);
  const cn = kn ?? rn;
  const bound = bn === undefined ? undefined : num(vars[bn]) ? vars[bn] : vars[bn][1];
  return { iv, bound, cn, count: cn === undefined ? undefined : vars[cn], kept: cn === kn };
}

const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

/** a meeting is up for a decision: the next step brings a new one, or this step just brought one and decided nothing */
const arriving = (now, was, nx) => !same(now.iv, nx.iv) || (!!was && !same(now.iv, was.iv) && now.count === was.count && now.bound === was.bound);

/** 'kept' | 'dropped' | null: what the next step does with a new meeting */
function verdict(now, nx) {
  if (!now.cn || nx.cn !== now.cn || nx.kept !== now.kept) return null;
  if (nx.count === now.count + 1) return now.kept ? 'kept' : 'dropped';
  if (nx.count !== now.count || !num(nx.bound)) return null;
  if (nx.bound > now.bound && nx.bound === nx.iv[1]) return 'kept';
  return now.kept && nx.bound === now.bound ? 'dropped' : null;
}

export default {
  id: 'non-overlapping-intervals',
  metaphor: 'Booking the most meetings in one room',
  caption: 'Meetings are taken in order of when they end. One that starts when the room is free again is kept and the room is busy until it ends; one that starts earlier clashes and is cancelled.',
  narrate(ctx) {
    const { params } = ctx;
    const list = listIn(ctx.vars, params);
    const before = listIn(ctx.prev, params);
    if (list && list.length > 1 && (!before || list.some((p, i) => !same(p, before[i])))) {
      const byEnd = list.every((p, i) => i === 0 || list[i - 1][1] <= p[1]);
      const byStart = list.every((p, i) => i === 0 || list[i - 1][0] <= p[0]);
      if (byEnd || byStart) return `meetings lined up by ${byEnd ? 'end' : 'start'} time: ${list.map(show).join(' ')}`;
    }
    const now = stateOf(ctx.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !was || !now.iv || now.bound === undefined) return null;
    const [s, e] = now.iv;
    const free = Number.isFinite(now.bound) ? `the room is free from ${now.bound}` : 'the room is empty';
    if (now.cn && now.cn === was.cn && now.count === was.count + 1) {
      if (now.kept) return `${show(now.iv)} starts at ${s}, ${free}: keep it (${now.count} kept)`;
      return `${show(now.iv)} starts at ${s}, before the room is free at ${now.bound}: it clashes, cancel one (${now.count} cancelled)`;
    }
    if (num(was.bound) && now.bound !== was.bound && Number.isFinite(now.bound)) {
      if (now.bound < was.bound) return `of the two clashing meetings, keep the one ending first: the room is now free from ${now.bound}`;
      if (now.bound === e) return `the room is busy until ${e}, when ${show(now.iv)} ends`;
      return null;
    }
    if (!same(now.iv, was.iv) && now.cn && now.count === was.count && now.kept && now.bound === was.bound && s < now.bound) {
      return `${show(now.iv)} starts at ${s}, before the room is free at ${now.bound}: it clashes and is cancelled`;
    }
    return null;
  },
  // as the next meeting comes up: keep it or cancel it?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = stateOf(ctx.next.vars, ctx.params);
    if (!now || !nx || !nx.iv || !Number.isFinite(now.bound) || !arriving(now, stateOf(ctx.prev, ctx.params), nx)) return null;
    const v = verdict(now, nx);
    if (!v) return null;
    const [s] = nx.iv;
    return {
      question: `Next meeting: ${show(nx.iv)}. The room is free from ${now.bound}. Keep it or cancel it?`,
      options: ['Keep it', 'Cancel it: it clashes'],
      answer: v === 'kept' ? 0 : 1,
      explain: v === 'kept' ? `It starts at ${s} ≥ ${now.bound}: a meeting may start the moment the last one ends.` : `It starts at ${s}, before ${now.bound}, so it overlaps a meeting that ends earlier; keeping the earlier-ending one leaves more room.`,
    };
  },
  bugs: [
    {
      label: 's > lastEnd: touching meetings clash',
      find: 's >= lastEnd',
      replace: 's > lastEnd',
      explain: 'A meeting that starts exactly when the last one ends does not overlap it, but this cancels it, so [1,2],[2,3] reports 1 removal instead of 0.',
    },
    {
      label: 'Return the number kept, not removed',
      find: 'return intervals.length - kept;',
      replace: 'return kept;',
      explain: 'kept counts the meetings that stay in the room; the question asks how many must be cancelled.',
    },
  ],
};
