// Maximum Units on a Truck: every box takes one slot, so the richest boxes go on first. Box types are lined up by
// units per box; each type fills as many slots as are left.
import { options, row } from './util.js';

const isPair = (v) => !!row(v) && v.length === 2 && v.every(Number.isInteger);
const listOf = (v) => (Array.isArray(v) && v.length && v.every(isPair) ? v : null);
const NAMES = [['count', 'perBox'], ['count', 'units'], ['cnt', 'units'], ['boxes', 'units'], ['n', 'u'], ['c', 'u'], ['num', 'units'], ['count', 'unit'], ['b', 'u']];
const CUR = ['box', 'type', 'bt', 't', 'b', 'item', 'pair', 'cur', 'p'];
const SPACE = ['space', 'left', 'remaining', 'rem', 'cap', 'capacity', 'room', 'slots', 'size', 'free'];
const TOTAL = ['total', 'ans', 'res', 'result', 'sum', 'maxUnits', 'loaded', 'max', 'units'];
const TAKE = ['take', 'k', 'boxes', 'amount', 'fit', 'load', 'used', 'canTake', 'took', 'm'];

/** the box types in the order they are loaded: a sorted copy, else the (maybe sorted in place) parameter */
function listIn(vars, params) {
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && listOf(v));
  return own ? own[1] : listOf(vars[params[0]]);
}

/** { type: [count, perBox], used: names, space, total } from one snapshot */
function stateOf(vars, params) {
  if (!vars) return null;
  let type = null;
  let used = [];
  const nm = NAMES.find(([a, b]) => Number.isInteger(vars[a]) && Number.isInteger(vars[b]));
  const c = CUR.find((k) => isPair(vars[k]));
  const list = listIn(vars, params);
  if (nm) [type, used] = [[vars[nm[0]], vars[nm[1]]], nm];
  else if (c) [type, used] = [vars[c], [c]];
  else if (list && Number.isInteger(vars.i) && isPair(list[vars.i])) [type, used] = [list[vars.i], ['i']];
  const sn = SPACE.find((k) => !used.includes(k) && Number.isInteger(vars[k])) ?? (Number.isInteger(vars[params[1]]) ? params[1] : undefined);
  const tn = TOTAL.find((k) => !used.includes(k) && k !== sn && Number.isInteger(vars[k]));
  return { type, used, list, sn, space: vars[sn], tn, total: vars[tn] };
}

export default {
  id: 'maximum-units-on-a-truck',
  metaphor: 'Loading the richest boxes first',
  caption: 'Every box takes one slot on the truck, whatever it holds, so the boxes with the most units go on first. Each type fills as many slots as are still free.',
  narrate(ctx) {
    const { params } = ctx;
    const list = listIn(ctx.vars, params);
    const before = listIn(ctx.prev, params);
    if (list && list.length > 1 && list.every((p, i) => i === 0 || list[i - 1][1] >= p[1]) && (!before || list.some((p, i) => p[1] !== before[i][1]))) {
      return `box types lined up by units per box, richest first: ${list.map(([c, u]) => `${c}×${u}`).join(', ')}`;
    }
    const now = stateOf(ctx.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !was) return null;
    if (now.tn && now.tn === was.tn && Number.isInteger(was.total) && now.total > was.total) {
      const d = now.total - was.total;
      const per = now.type?.[1];
      const n = per && d % per === 0 ? d / per : null;
      return `${n !== null ? `${n} box${n === 1 ? ' goes' : 'es go'} on (${per} unit${per === 1 ? '' : 's'} each)` : `+${d} units go on`}: ${now.total} units loaded`;
    }
    if (now.sn && now.sn === was.sn && Number.isInteger(was.space) && now.space < was.space) {
      return now.space <= 0 ? 'the truck is full' : `${now.space} slot${now.space === 1 ? '' : 's'} left on the truck`;
    }
    const t = now.type;
    if (t && now.space === 0 && (!was.type || t[1] !== was.type[1])) return `the truck is full: the ${t[1]}-unit boxes stay behind`;
    if (t && (!was.type || t[0] !== was.type[0] || t[1] !== was.type[1]) && Number.isInteger(now.space)) {
      return `next type: ${t[0]} box${t[0] === 1 ? '' : 'es'} of ${t[1]} unit${t[1] === 1 ? '' : 's'} each; ${now.space} slot${now.space === 1 ? '' : 's'} free`;
    }
    return null;
  },
  // just before boxes go on: how many of this type fit?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = stateOf(ctx.vars, ctx.params);
    const nx = stateOf(ctx.next.vars, ctx.params);
    if (!now || !nx || !now.type || !Number.isInteger(now.space) || now.space <= 0) return null;
    const [count, per] = now.type;
    if (!nx.type || nx.type[0] !== count || nx.type[1] !== per) return null;
    // the amount was just worked out on this step: it is already on screen
    if (TAKE.some((k) => !now.used.includes(k) && Number.isInteger(ctx.vars[k]) && ctx.vars[k] !== ctx.prev[k])) return null;
    let n = null;
    const tk = TAKE.find((k) => !now.used.includes(k) && k !== now.sn && k !== now.tn && !(k in ctx.vars) && Number.isInteger(ctx.next.vars[k]));
    if (tk) n = ctx.next.vars[tk];
    else if (now.tn && nx.tn === now.tn && nx.total > now.total && (nx.total - now.total) % per === 0) n = (nx.total - now.total) / per;
    if (n === null || n !== Math.min(count, now.space)) return null;
    return options(
      `${count} box${count === 1 ? '' : 'es'} of ${per} unit${per === 1 ? '' : 's'}, ${now.space} free slot${now.space === 1 ? '' : 's'}. How many of these boxes go on?`,
      n,
      [count, now.space, Math.max(count, now.space), 0].filter((x) => x !== n),
      n === count ? `All ${count} fit: there are ${now.space} free slots.` : `Only ${now.space} slots are left, so only ${n} of the ${count} boxes fit.`,
    );
  },
  bugs: [
    {
      label: 'Sort by box count instead of units per box',
      find: 'b[1] - a[1]',
      replace: 'b[0] - a[0]',
      explain: 'The type with the most boxes goes on first, not the richest: [[5,1],[2,8]] with 5 slots loads five 1-unit boxes (5) instead of 2×8 + 3×1 = 19.',
    },
    {
      label: 'Take every box without checking space',
      find: 'Math.min(count, truckSize)',
      replace: 'count',
      explain: 'All boxes of a type are loaded even when the truck has fewer free slots, so 10 boxes go on a 3-slot truck.',
    },
  ],
};
