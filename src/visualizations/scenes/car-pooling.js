// Car Pooling (difference array over km). Signs along the road: +p where a group gets in, −p where it gets out.
// Driving east and adding up the signs gives the riders on board at each km; more than capacity means false.
// Marks are matched to a trip by value, so the learner's names for diff / from / to do not matter.
import { firstInt, options, row } from './util.js';

const LOAD = ['load', 'cur', 'curr', 'current', 'passengers', 'riders', 'people', 'count', 'cnt', 'onboard', 'running', 'sum', 'total', 'occupied', 'used'];
const KM = ['km', 'i', 'pos', 'x', 'j', 'stop', 'loc', 'k'];

// long arrays are snapshotted as { $array: first 64, $length }
const cells = (v) => row(v) || (v && Array.isArray(v.$array) ? row(v.$array) : null);

/** [name, km, old, new] of the one cell that changed in a non-parameter number array */
function oneWrite(ctx, now, before) {
  for (const [k, v] of Object.entries(now)) {
    if (ctx.params.includes(k)) continue;
    const a = cells(v);
    const b = cells(before[k]);
    if (!a || !b || a.length !== b.length) continue;
    const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (d.length === 1 && Number.isInteger(a[d[0]]) && Number.isInteger(b[d[0]] ?? 0)) return [k, d[0], b[d[0]] ?? 0, a[d[0]]];
  }
  return null;
}

/** the trip [p, from, to] a sign of `delta` at `km` belongs to, if only one fits */
function tripFor(trips, km, delta) {
  if (!Array.isArray(trips)) return null;
  const fits = trips.filter((e) => row(e) && e.length === 3 && e[0] === Math.abs(delta) && (delta > 0 ? e[1] === km : e[2] === km || e[2] + 1 === km));
  return new Set(fits.map((e) => e.join())).size === 1 ? fits[0] : null;
}

/** the sign array: a non-parameter row of integers */
const signsOf = (ctx, vars) => {
  for (const [k, v] of Object.entries(vars)) {
    const a = cells(v);
    if (!ctx.params.includes(k) && a && a.length > 1 && a.every(Number.isInteger)) return [k, a];
  }
  return null;
};
const sgn = (x) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : '0');

export default {
  id: 'car-pooling',
  metaphor: 'Boarding signs along a one-way road',
  caption: 'Each trip puts a +sign where its group gets in and a −sign where it gets out. Driving east and adding up the signs gives the riders in the car at every km; one km over capacity and the answer is false.',
  narrate(ctx) {
    const [tName, cName] = ctx.params;
    const trips = ctx.vars[tName];
    const cap = ctx.vars[cName];
    const w = oneWrite(ctx, ctx.vars, ctx.prev);
    if (w) {
      const [, km, old, now] = w;
      const tr = tripFor(trips, km, now - old);
      if (!tr) return `sign at km ${km} is now ${sgn(now)}`;
      return now > old ? `${tr[0]} riders get in at km ${km} (trip ${tr[1]} → ${tr[2]}): sign ${sgn(now - old)}` : `those ${tr[0]} riders get out AT km ${km}: sign ${sgn(now - old)}, their seats are free from km ${km} on`;
    }
    const [lName, load] = firstInt(ctx.vars, LOAD);
    const [kName, km] = firstInt(ctx.vars, KM);
    const s = signsOf(ctx, ctx.vars);
    if (lName && lName in ctx.prev && load !== ctx.prev[lName] && (!kName || !s)) {
      // sorted events instead of a road of signs
      const d = load - ctx.prev[lName];
      return `${d > 0 ? `${d} riders get in` : `${-d} riders get out`}: ${load} in the car${Number.isInteger(cap) && load > cap ? `, more than the ${cap} seats!` : ''}`;
    }
    if (!lName || !kName || !s || !(km >= 0 && km < s[1].length)) return null;
    const over = Number.isInteger(cap) && load > cap;
    if (km !== ctx.prev[kName] || load !== ctx.prev[lName]) {
      const sign = s[1][km];
      return `km ${km}: ${sign ? `sign ${sgn(sign)}` : 'no sign'} → ${load} riders in the car${over ? `, more than the ${cap} seats!` : ''}`;
    }
    if (over) return `${load} riders but only ${cap} seats: the car is overloaded, the answer is false`;
    return null;
  },
  // the first trip's drop-off sign (where do they get out?), then each km where the count changes
  predict(ctx) {
    if (!ctx.next) return null;
    const [tName, cName] = ctx.params;
    const trips = ctx.vars[tName];
    const cap = ctx.vars[cName];
    const w = oneWrite(ctx, ctx.next.vars, ctx.vars);
    if (w) {
      const [name, km, old, now] = w;
      const tr = tripFor(trips, km, now - old);
      const marked = (cells(ctx.vars[name]) || []).filter((x) => x).length;
      if (!tr || now >= old || marked !== 1) return null;
      return options(`Trip [${tr.join(', ')}]: ${tr[0]} riders from km ${tr[1]} to km ${tr[2]}. At which km does their −${tr[0]} sign go?`, km, [tr[2] - 1, tr[2], tr[2] + 1, tr[1]].filter((x) => x !== km), km === tr[2] ? `They are out AT km ${tr[2]}, so the seat is free there: a group boarding at km ${tr[2]} fits.` : `This code keeps them in the car through km ${tr[2]}.`);
    }
    const [lName, load] = firstInt(ctx.vars, LOAD);
    const [kName] = firstInt(ctx.next.vars, KM);
    const s = signsOf(ctx, ctx.vars);
    if (!lName || !kName || !s) return null;
    const km = ctx.next.vars[kName];
    const nl = ctx.next.vars[lName];
    const sign = s[1][km];
    if (!Number.isInteger(nl) || nl === load || !Number.isInteger(sign) || nl !== load + sign) return null;
    const over = Number.isInteger(cap) && nl > cap;
    return options(`The car carries ${load}; the sign at km ${km} says ${sgn(sign)}. How many riders are in the car at km ${km}?`, nl, [load, load + Math.abs(sign), load - Math.abs(sign), nl + 1].filter((x) => x !== nl && x >= 0), `${load} ${sign < 0 ? '−' : '+'} ${Math.abs(sign)} = ${nl}${over ? `, more than the ${cap} seats: the answer is false` : Number.isInteger(cap) ? `, within the ${cap} seats` : ''}.`);
  },
  bugs: [
    {
      label: 'Riders get out one km late',
      find: 'diff[to] -= p;',
      replace: 'diff[to + 1] -= p;',
      explain: 'The group stays in the car at km `to`, where its seats should already be free, so a group boarding there (example 3) looks like an overload.',
    },
    {
      label: 'Full car counted as overloaded',
      find: 'load > capacity',
      replace: 'load >= capacity',
      explain: 'A car with exactly capacity riders is fine, but >= calls it overloaded (example 2: 5 riders, 5 seats).',
    },
  ],
};
