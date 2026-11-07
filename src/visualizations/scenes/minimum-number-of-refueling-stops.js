// Minimum Number of Refueling Stops: drive as far as the tank allows and remember every station passed. Only when the
// car cannot go further do we decide, looking back, that we had stopped at the biggest station passed.
import { options, row } from './util.js';

const FUEL = ['fuel', 'reach', 'curFuel', 'tank', 'maxReach', 'far', 'farthest', 'pos', 'dist', 'range', 'cur', 'gas', 'miles'];
const STOPS = ['stops', 'count', 'ans', 'res', 'refuels', 'cnt', 'result', 'numStops'];
const HEAP = /heap|pq|passed|tank|trunk|fuels|cans|queue|^q$|cands|pool|seen/i;

/** the fuels of stations passed but not used yet, as a plain list, or null */
function fuelsOf(vars, params) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !v) continue;
    if (v.$obj) {
      const arr = ['heap', 'data', 'items', 'values', 'arr', 'h'].map((f) => row(v.$obj[f])).find(Boolean);
      if (arr) return arr;
    } else if (HEAP.test(k) && row(v) && v.every((x) => typeof x === 'number')) return v;
  }
  return null;
}

function stateOf(vars, params) {
  if (!vars) return null;
  const fn = FUEL.find((k) => !params.includes(k) && typeof vars[k] === 'number') ?? (typeof vars[params[1]] === 'number' ? params[1] : undefined);
  const sn = STOPS.find((k) => k !== fn && Number.isInteger(vars[k]));
  return { fuels: fuelsOf(vars, params), fn, reach: vars[fn], sn, stops: vars[sn] };
}

/** the one value added to (sign 1) or removed from (sign -1) a multiset, else undefined */
function diff1(after, before) {
  if (!after || !before || Math.abs(after.length - before.length) !== 1) return undefined;
  const [big, small] = after.length > before.length ? [after, before] : [before, after];
  const left = [...big];
  for (const x of small) {
    const j = left.indexOf(x);
    if (j < 0) return undefined;
    left.splice(j, 1);
  }
  return left[0];
}

export default {
  id: 'minimum-number-of-refueling-stops',
  metaphor: 'A road trip with no regrets',
  caption: 'The car drives as far as its fuel reaches, noting every station it passes. When it cannot go on, it pretends it had stopped at the biggest station passed: that choice is never worse.',
  narrate(ctx) {
    const { params } = ctx;
    const [tName, , sName] = params;
    const target = ctx.vars[tName];
    const now = stateOf(ctx.vars, params);
    const was = stateOf(ctx.prev, params);
    if (!now || !was || !now.fuels || !was.fuels) return null;
    if (now.fuels.length === was.fuels.length + 1) {
      const f = diff1(now.fuels, was.fuels);
      const all = Array.isArray(ctx.vars[sName]) ? ctx.vars[sName] : [];
      // the station under the loop index (before or after i++), else the first one with that much fuel
      const at = ['i', 'j', 'idx', 'k'].flatMap((k) => [ctx.vars[k], ctx.vars[k] - 1, ctx.prev[k]]).filter(Number.isInteger).map((x) => all[x]);
      const st = [...at, ...all].find((s) => row(s) && s[1] === f && (typeof now.reach !== 'number' || s[0] <= now.reach));
      return `drove past ${st ? `the station at ${st[0]}` : 'a station'} (${f} litres): note it as a possible stop${typeof now.reach === 'number' ? ` · reach ${now.reach}` : ''}`;
    }
    const grew = now.fn && now.fn === was.fn && typeof was.reach === 'number' && now.reach > was.reach;
    if (now.fuels.length === was.fuels.length - 1) {
      const f = diff1(now.fuels, was.fuels);
      if (grew) return `stuck at ${was.reach} (target ${target}): count a stop at the biggest station passed, +${f} → reach ${now.reach}${now.reach >= target ? ': the target is in reach' : ''}`;
      return `stuck at ${now.reach ?? '?'}: take the biggest station passed, ${f} litres`;
    }
    if (grew) return `+${now.reach - was.reach} litres → reach ${now.reach}${now.reach >= target ? ': the target is in reach' : ''}`;
    if (now.sn && now.sn === was.sn && Number.isInteger(was.stops) && now.stops === was.stops + 1) return `stop #${now.stops}`;
    return null;
  },
  // just before a station's fuel is used: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const { params } = ctx;
    const now = stateOf(ctx.vars, params);
    const nx = stateOf(ctx.next.vars, params);
    if (!now || !nx || !now.fuels || !nx.fuels || nx.fuels.length !== now.fuels.length - 1) return null;
    const f = diff1(nx.fuels, now.fuels);
    if (f === undefined) return null;
    const ahead = (Array.isArray(ctx.vars[params[2]]) ? ctx.vars[params[2]] : []).filter((s) => row(s) && typeof now.reach === 'number' && s[0] > now.reach).map((s) => s[1]);
    const wrong = [...now.fuels, ...ahead].filter((x) => x !== f).slice(0, 3);
    const where = typeof now.reach === 'number' ? `The fuel reaches ${now.reach}, short of ${ctx.vars[params[0]]}. ` : '';
    return options(
      `${where}Stations passed hold ${now.fuels.join(', ')} litres. Which fuel goes in the tank?`,
      f,
      wrong,
      f === Math.max(...now.fuels) ? `${f} is the biggest station already passed: one stop that adds the most reach. Stations ahead (beyond the reach) cannot be used yet.` : `The code takes ${f} here.`,
    );
  },
  bugs: [
    {
      label: 'Use < : a station reached with 0 fuel is skipped',
      find: 'stations[i][0] <= fuel',
      replace: 'stations[i][0] < fuel',
      explain: 'Arriving at a station with an empty tank still counts, but with < the station at exactly the reach is never noted, so target 100, fuel 50, station [50, 50] returns -1 instead of 1.',
    },
    {
      label: 'Min-heap: refuel from the smallest station',
      find: 'new MaxHeap()',
      replace: 'new MinHeap()',
      explain: 'Taking the smallest passed fuel first wastes stops: with stations of 5, 70 and 10 litres it stops three times, while the 70 alone was enough.',
    },
  ],
};
