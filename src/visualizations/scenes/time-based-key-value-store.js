// Time Based Key-Value Store: a drawer per key, holding dated versions in date order (sets come in increasing time).
// get(key, t) binary-searches the drawer for the newest version dated on or before t. Reads parallel arrays
// (times / values) or a list of [time, value] pairs (or { timestamp, value } objects); the query comes from ctx.ops.
import { entriesOf, options, row } from './util.js';

const PAIRS = [
  ['lo', 'hi'],
  ['left', 'right'],
  ['l', 'r'],
  ['low', 'high'],
  ['start', 'end'],
];
const MID = ['mid', 'm', 'middle'];
const TIMES = ['times', 'timestamps', 'stamps', 'ts', 'keys', 'time'];
const VALUES = ['values', 'vals', 'data', 'items'];
const isInt = Number.isInteger;
const pairOf = (vars) => PAIRS.find(([a, b]) => isInt(vars[a]) && isInt(vars[b]));
const midOf = (vars) => MID.find((k) => isInt(vars[k]));
const ints = (v) => row(v) && v.every(isInt);
const q = (s) => (typeof s === 'string' ? `"${s}"` : String(s));

/** one version [time, value] from a pair (either order) or a { timestamp, value } object */
function version(x) {
  if (Array.isArray(x) && x.length === 2) {
    if (isInt(x[0]) && !isInt(x[1])) return x;
    if (isInt(x[1]) && !isInt(x[0])) return [x[1], x[0]];
    if (isInt(x[0])) return x;
  }
  const o = x?.$obj;
  if (o) {
    const t = Object.keys(o).find((k) => isInt(o[k]));
    const v = Object.keys(o).find((k) => k !== t && typeof o[k] === 'string');
    if (t && v) return [o[t], o[v]];
  }
  return null;
}

/** the drawer being worked on: { times, values } (values may be shorter while a set is half done) */
function drawerOf(vars) {
  if (!vars) return null;
  for (const src of [vars, vars.entry?.$obj, vars.bucket?.$obj, vars.e?.$obj]) {
    if (!src) continue;
    const t = TIMES.find((k) => ints(src[k]));
    if (t) return { times: src[t], values: row(src[VALUES.find((k) => row(src[k]))]) || [] };
  }
  for (const [k, v] of Object.entries(vars)) {
    if (k === 'this' || !Array.isArray(v) || !v.length) continue;
    const vs = v.map(version);
    if (vs.every(Boolean)) return { times: vs.map((x) => x[0]), values: vs.map((x) => x[1]) };
  }
  return null;
}

const opOf = (ctx) => ctx.ops?.[ctx.op];

export default {
  id: 'time-based-key-value-store',
  metaphor: 'A drawer of dated versions per key',
  caption: 'Each key opens a drawer of versions in date order. get(key, t) halves the drawer again and again to find the newest version dated on or before t; anything later is from the future.',
  narrate(ctx) {
    const op = opOf(ctx);
    const d = drawerOf(ctx.vars);
    if (op?.name === 'get' && !d && /^\s*(if\s*\(.*\)\s*)?return\b/.test(ctx.src || '') && (!ctx.next || ctx.next.op !== ctx.op)) {
      const o = ctx.vars.this?.$obj || {};
      const map = Object.values(o).map(entriesOf).find(Boolean);
      if (map && !map.some(([k]) => k === op.args[0])) return `there is no drawer ${q(op.args[0])} at all: the answer is ""`;
    }
    if (!op) return null;
    if (op.name === 'set') {
      // told once, on the set's last step; the version count only when the drawer is a local variable
      if (ctx.next && ctx.next.op === ctx.op) return null;
      const [key, value, t] = op.args;
      const n = d ? Math.min(d.times.length, d.values.length) : 0;
      return `file ${q(value)} in drawer ${q(key)}, dated ${t}${n ? ` (the drawer holds ${n} version${n > 1 ? 's' : ''}, oldest first)` : ', after the older versions'}`;
    }
    if (!d) return null;
    if (op.name !== 'get') return null;
    const [key, t] = op.args;
    const { times, values } = d;
    const pair = pairOf(ctx.vars);
    if (!pair) return null;
    const [loName, hiName] = pair;
    const lo = ctx.vars[loName];
    const hi = ctx.vars[hiName];
    const mName = midOf(ctx.vars);
    const m = mName && ctx.vars[mName];
    // no verdict here: the prediction right after asks which way to go
    if (mName && m !== ctx.prev[mName] && isInt(times[m])) return `open version ${m} of drawer ${q(key)}: dated ${times[m]}, and we want the newest dated ≤ ${t}`;
    const pm = midOf(ctx.prev);
    const tried = pm !== undefined ? ctx.prev[pm] : undefined;
    if (isInt(tried) && isInt(times[tried]) && loName in ctx.prev && hiName in ctx.prev) {
      if (lo > ctx.prev[loName]) return `${times[tried]} ≤ ${t}: version ${tried} is old enough, but a newer one may be too: look right`;
      if (hi < ctx.prev[hiName]) return `${times[tried]} > ${t}: version ${tried} is from the future, look left`;
    }
    if (/^\s*return\b/.test(ctx.src || '') && (!ctx.next || ctx.next.op !== ctx.op)) {
      // the true answer, told only when the learner's bracket ended on it
      const k = times.filter((x) => x <= t).length;
      if (lo !== k && hi !== k - 1 && lo !== k - 1) return null;
      return k ? `the newest version dated ≤ ${t} is ${q(values[k - 1])} (dated ${times[k - 1]})` : `every version in drawer ${q(key)} is dated after ${t}: the answer is ""`;
    }
    return null;
  },
  // right after opening the middle version: which half is kept?
  predict(ctx) {
    const op = opOf(ctx);
    if (!ctx.next || op?.name !== 'get' || ctx.next.op !== ctx.op) return null;
    const d = drawerOf(ctx.vars);
    const pair = pairOf(ctx.vars);
    const mName = midOf(ctx.vars);
    if (!d || !pair || !mName || ctx.vars[mName] === ctx.prev[mName]) return null;
    const m = ctx.vars[mName];
    const t = op.args[1];
    const at = d.times[m];
    if (!isInt(at)) return null;
    const [loName, hiName] = pair;
    const nx = ctx.next.vars;
    const up = nx[loName] > ctx.vars[loName] && nx[hiName] === ctx.vars[hiName];
    const down = nx[hiName] < ctx.vars[hiName] && nx[loName] === ctx.vars[loName];
    if (up === down) return null;
    const right = up ? `Old enough: look right for a newer one (${loName} moves up)` : `From the future: look left (${hiName} moves down)`;
    const wrong = [up ? `From the future: look left (${hiName} moves down)` : `Old enough: look right for a newer one (${loName} moves up)`, `Stop: version ${m} is the answer`];
    return options(`Version ${m} is dated ${at}; get asks for time ${t}. What happens next?`, right, wrong, up ? `${at} ≤ ${t}, so version ${m} could be the answer, but a newer version that is still ≤ ${t} would beat it.` : `${at} > ${t}: that version did not exist yet at time ${t}, and every later one is newer still.`);
  },
  bugs: [
    {
      label: 'Lower bound: an exact date is skipped',
      find: 'times[mid] > timestamp',
      replace: 'times[mid] >= timestamp',
      explain: 'With >= the search stops at the first version dated ≥ t, so a version set at exactly t is treated as the future and the older one is returned.',
    },
    {
      label: 'No check for "nothing old enough"',
      find: "return lo === 0 ? '' : values[lo - 1];",
      replace: 'return values[lo - 1];',
      explain: 'When every version is dated after t, lo is 0 and values[-1] is undefined, but the answer must be "".',
    },
  ],
};
