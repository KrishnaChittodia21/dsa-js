// Bus Routes (BFS over buses). Each round boards every bus that passes a stop reached so far; all stops of those
// buses are then one more bus away. A bus is ridden at most once. Reads the stop -> buses map, the ridden-bus
// flags / Set, the reached-stops Set and the bus counter by name and shape; other shapes get generic notes.
import { row, entriesOf, options } from './util.js';

const ROUTE_USED = /route|bus|ridden|taken|board/i;
const STOP_SEEN = /stop|seen|visited|vis/i;
const COUNT = /^(buses|bus|count|cnt|res|ans|steps?|level|lvl|depth|rides?|hops?|dist|d)$/i;
const ROUTE_AT = ['r', 'route', 'bus', 'ri', 'rt', 'b', 'idx', 'j'];
const list = (a) => a.join(', ');

/** route indexes marked ridden: [name, Set] from a flag row or a Set under a route-like name */
function ridden(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !ROUTE_USED.test(k)) continue;
    if (row(v) && v.length > 0 && v.every((x) => typeof x === 'boolean' || x === 0 || x === 1)) return [k, new Set(v.flatMap((x, i) => (x ? [i] : [])))];
    if (v && v.$set) return [k, new Set(v.$set)];
  }
  return null;
}
/** stops reached so far: a Set under a stop / seen-like name that is not the ridden-bus one */
function reached(vars, params, skip) {
  for (const [k, v] of Object.entries(vars || {})) if (!params.includes(k) && k !== skip && STOP_SEEN.test(k) && v && v.$set) return new Set(v.$set);
  return null;
}
const counterOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && COUNT.test(k) && Number.isInteger(vars[k]));
/** the bus counter only when the code counts rounds with it (name++ / name += 1), not a per-stop distance */
function roundOf(ctx) {
  const k = counterOf(ctx.vars, ctx.params);
  const code = ctx.lines.join('\n');
  return k && new RegExp(`\\b${k}\\s*(\\+\\+|\\+=\\s*1\\b)|\\+\\+\\s*${k}\\b`).test(code) ? k : undefined;
}
const routeAt = (vars, routes) => ROUTE_AT.find((k) => Number.isInteger(vars[k]) && vars[k] >= 0 && vars[k] < routes.length);
/** the stop -> buses map (Map or object of number -> [route indexes]) */
function stopMap(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const e = entriesOf(v) || (v && v.$obj && Object.entries(v.$obj));
    if (e && e.length && e.every(([, m]) => row(m) && m.every(Number.isInteger))) return e;
  }
  return null;
}

export default {
  id: 'bus-routes',
  metaphor: 'Hopping buses, one ride per round',
  caption: 'Each round boards every bus that stops where you already are; all its stops become reachable with one more bus. A bus ridden once is never boarded again. The round that reaches the target is the answer.',
  narrate(ctx) {
    const [rName, sName, tName] = ctx.params;
    const routes = ctx.input?.[0] || ctx.vars[rName];
    const target = ctx.input?.[2] ?? ctx.vars[tName];
    const source = ctx.input?.[1] ?? ctx.vars[sName];
    if (!Array.isArray(routes)) return null;
    const cName = roundOf(ctx);
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value === 0 && source === target) return `you already stand at the target stop ${target}: 0 buses`;
      if (ctx.value === -1) return `no more buses to board and stop ${target} was never reached: -1`;
      return `stop ${target} is on this bus: reached with ${ctx.value} bus${ctx.value === 1 ? '' : 'es'}`;
    }
    // a bus is boarded
    const rd = ridden(ctx.vars, ctx.params);
    const rdp = ridden(ctx.prev, ctx.params);
    if (rd && rdp && rd[1].size === rdp[1].size + 1) {
      const r = [...rd[1]].find((x) => !rdp[1].has(x));
      const stops = routes[r];
      const k = cName ? ctx.vars[cName] : undefined;
      if (Array.isArray(stops)) return `board bus ${r} (stops ${list(stops)}): each of them is ${Number.isInteger(k) && k > 0 ? `${k} bus${k === 1 ? '' : 'es'} from the start` : 'one more bus away'}`;
    }
    // a stop reached
    const st = reached(ctx.vars, ctx.params, rd?.[0]);
    const stp = reached(ctx.prev, ctx.params, rd?.[0]);
    if (st && stp && st.size === stp.size + 1) {
      const s = [...st].find((x) => !stp.has(x));
      return `stop ${s} reached for the first time: it waits for the next round to board its buses`;
    }
    if (st && !stp && st.size) return `start at stop ${list([...st])}: no bus boarded yet`;
    // a new round
    if (cName && Number.isInteger(ctx.prev[cName]) && ctx.vars[cName] === ctx.prev[cName] + 1) {
      const fr = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && /front|queue|^q$|cur|level|stops/i.test(k) && row(v) && v.length);
      return `round ${ctx.vars[cName]}: board the buses passing ${fr ? `stops ${list(fr[1])}` : 'the stops reached last round'}; anything they reach needs ${ctx.vars[cName]} bus${ctx.vars[cName] === 1 ? '' : 'es'}`;
    }
    // the stop -> buses map grows
    const m = stopMap(ctx.vars, ctx.params);
    const mp = stopMap(ctx.prev, ctx.params);
    if (m && mp) {
      const grew = m.find(([k, v]) => v.length === (mp.find(([q]) => q === k)?.[1].length ?? -1) + 1);
      if (grew && grew[1].length) return `stop ${grew[0]} is served by bus${grew[1].length > 1 ? 'es' : ''} ${list(grew[1])}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [rName] = ctx.params;
    const routes = ctx.input?.[0] || ctx.vars[rName];
    if (!Array.isArray(routes)) return null;
    // the run ends next: with how many buses?
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && (ctx.next.value > 0 || ctx.next.value === -1)) {
      const v = ctx.next.value;
      return options(
        'How many buses does this trip take in the end? (-1 = the target cannot be reached)',
        v,
        v > 0 ? [v - 1, v + 1, -1].filter((x) => x !== 0) : [1, 2],
        v > 0 ? `The target is on a bus boarded in round ${v}: rounds count buses, not stops, so the answer is ${v}.` : 'Every bus reachable from the start was ridden and none stops at the target, so the answer is -1.',
      );
    }
    // a bus just came up at a stop: board it or skip it?
    const rd = ridden(ctx.vars, ctx.params);
    const nrd = ridden(ctx.next.vars, ctx.params);
    const rKey = routeAt(ctx.vars, routes);
    if (!rd || !nrd || !rKey) return null;
    const r = ctx.vars[rKey];
    const boards = !rd[1].has(r) && nrd[1].has(r);
    const skips = rd[1].has(r) && nrd[1].size === rd[1].size && ctx.prev[rKey] !== r && ctx.next.vars[rKey] !== r; // came up and was passed over
    const c = roundOf(ctx);
    // a fresh bus in round 1 is the easy case: ask from round 2 on, or when a bus comes up again
    if (!skips && !(boards && c && ctx.vars[c] >= 2)) return null;
    return {
      question: `Bus ${r} (stops ${list(routes[r] || [])}) passes this stop. Board it?`,
      options: ['Yes: ride it and reach its stops', 'No: it was ridden already'],
      answer: boards ? 0 : 1,
      explain: boards ? `Bus ${r} has not been ridden yet, so it is boarded now and marked: it is never scanned again.` : `Bus ${r} was boarded in an earlier round; its stops are all reached already, with fewer or equal buses.`,
    };
  },
  bugs: [
    {
      label: 'Forget the "already there" case',
      find: 'if (source === target) return 0;',
      replace: '',
      explain: 'When source equals target but no bus stops there, the search finds nothing and returns -1 instead of 0 (no bus needed).',
    },
    {
      label: 'Start the bus count at 1',
      find: 'let buses = 0;',
      replace: 'let buses = 1;',
      explain: 'Every round adds a bus, so starting at 1 counts the first bus twice: [[1,2,7],[3,6,7]] from 1 to 6 gives 3 instead of 2.',
    },
  ],
};
