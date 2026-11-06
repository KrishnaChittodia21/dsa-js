// Evaluate Division (weighted union-find, or a graph search). Every variable hangs under a group leader with a
// ratio: weight[x] = x / parent[x], so x / leader is the product of ratios up the chain, and c / d = (c / leader) /
// (d / leader) when both share a leader. Reads a parent Map (string → string) with a weight Map, the query on
// screen (two string variables that form a query) and a results array; graph searches get query notes only.
import { options, row } from './util.js';

const PARENT = /^(parent|parents|par|p|root|roots|fa|leader|boss|uf|dsu|ds)$/i;
const WEIGHT = /^(weight|weights|w|wt|ratio|ratios|val|vals|value|mult|factor|factors|toRoot|rate)$/i;

function mapOf(vars, re, ok) {
  for (const [k, v] of Object.entries(vars || {})) {
    const o = v && v.$obj;
    const cands = re.test(k) ? [v] : [];
    if (o) for (const [f, x] of Object.entries(o)) if (re.test(f)) cands.push(x);
    for (const c of cands) if (c && c.$map && c.$map.every(ok)) return new Map(c.$map);
  }
  return null;
}
const parentOf = (vars) => mapOf(vars, PARENT, ([a, b]) => typeof a === 'string' && typeof b === 'string');
const weightOf = (vars) => mapOf(vars, WEIGHT, ([a, b]) => typeof a === 'string' && typeof b === 'number');
const num = (x) => (Number.isInteger(x) ? String(x) : String(+x.toFixed(4)));
/** keys whose parent or weight differ between two steps */
const changed = (a, b) => (a && b ? [...b.keys()].filter((k) => a.get(k) !== b.get(k)) : []);
/** the query on screen: [c, d] when two string variables (or a pair) match a query of the input */
function queryOf(ctx, vars) {
  const qs = ctx.input?.[2];
  if (!Array.isArray(qs)) return null;
  const isQ = (c, d) => qs.some((q) => Array.isArray(q) && q[0] === c && q[1] === d);
  for (const k of ['q', 'query', 'qu', 'pair']) if (row(vars[k]) && vars[k].length === 2 && isQ(vars[k][0], vars[k][1])) return vars[k];
  for (const [x, y] of [['c', 'd'], ['a', 'b'], ['x', 'y'], ['u', 'v'], ['src', 'dst'], ['from', 'to'], ['start', 'end'], ['num', 'den'], ['top', 'bottom'], ['s', 't']]) {
    if (typeof vars[x] === 'string' && typeof vars[y] === 'string' && isQ(vars[x], vars[y])) return [vars[x], vars[y]];
  }
  return null;
}
const resOf = (ctx, vars) => Object.entries(vars).find(([k, v]) => !ctx.params.includes(k) && /^(res|result|ans|answer|answers|out|output)$/i.test(k) && row(v));

export default {
  id: 'evaluate-division',
  metaphor: 'Exchange rates between currencies',
  caption: 'Think of variables as currencies and equations as exchange rates. Each group hangs under one leader currency; a value converts to the leader by multiplying the rates up its chain. Two currencies in different groups cannot be exchanged: -1.',
  narrate(ctx) {
    const [, , qName] = ctx.params;
    if (ctx.ret && !ctx.next && row(ctx.value)) return `all ${ctx.value.length} queries answered: [${ctx.value.map(num).join(', ')}]`;
    const q = queryOf(ctx, ctx.vars);
    if (q && ctx.ret && typeof ctx.value === 'number') {
      if (ctx.value === -1) return `${q[0]} / ${q[1]}: no chain of rates links them (unknown, or in different groups): -1`;
      return `${q[0]} / ${q[1]} = ${num(ctx.value)}: both convert to the same leader, divide the two rates`;
    }
    const r = resOf(ctx, ctx.vars);
    const pr = r && resOf(ctx, ctx.prev);
    if (r && pr && pr[0] === r[0] && r[1].length === pr[1].length + 1) {
      const v = r[1].at(-1);
      const qq = ctx.input?.[2]?.[r[1].length - 1];
      const what = Array.isArray(qq) ? `${qq[0]} / ${qq[1]}` : `query ${r[1].length}`;
      return v === -1 ? `${what}: no path of rates between them: -1` : `${what} = ${num(v)}: the product of the rates along the path`;
    }
    const par = parentOf(ctx.vars);
    const ppar = parentOf(ctx.prev);
    const w = weightOf(ctx.vars);
    const pw = weightOf(ctx.prev);
    if (!par || !ppar) return null;
    const added = [...par.keys()].find((k) => !ppar.has(k));
    if (added !== undefined) return `${added} is a new currency: for now it is its own group's leader`;
    if (!w || !pw) return null;
    const moved = changed(ppar, par);
    const rerated = changed(pw, w).filter((k) => pw.has(k));
    const x = moved[0] ?? rerated[0];
    if (x === undefined) return null;
    // the other half (parent or weight of x) changes on the next step: wait for it
    const npar = parentOf(ctx.next?.vars);
    const nw = weightOf(ctx.next?.vars);
    if (changed(par, npar).includes(x) || changed(w, nw).includes(x)) return null;
    const p = par.get(x);
    if (!w.has(x) || p === undefined) return null;
    const shortcut = moved.includes(x) && ppar.get(x) !== x;
    return `${shortcut ? 'shortcut: ' : ''}${x} now hangs under ${p} with rate ${num(w.get(x))}: ${x} = ${num(w.get(x))} × ${p}`;
  },
  // right before a query's answer is returned or stored: what is c / d?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    let q = null;
    let right;
    const r = resOf(ctx, ctx.vars);
    const nr = resOf(ctx, nx.vars);
    if (nx.ret && typeof nx.value === 'number' && parentOf(nx.vars)) {
      q = queryOf(ctx, nx.vars);
      right = nx.value;
    } else if (r && nr && r[0] === nr[0] && nr[1].length === r[1].length + 1 && typeof nr[1].at(-1) === 'number') {
      q = queryOf(ctx, ctx.vars);
      const qq = ctx.input?.[2]?.[r[1].length];
      if (!q || !qq || qq[0] !== q[0] || qq[1] !== q[1]) return null;
      right = nr[1].at(-1);
    }
    if (!q || right === undefined || !Number.isFinite(right)) return null;
    const wrong = [-1, 1, right !== 0 ? 1 / right : 0, right * 2].filter((x) => Number.isFinite(x) && num(x) !== num(right)).map(num);
    return options(`Query ${q[0]} / ${q[1]}: what does it evaluate to?`, num(right), wrong, right === -1 ? `${q[0]} and ${q[1]} are not linked by any chain of equations (or one of them never appeared), so the answer is -1.` : `Follow the rates: convert ${q[0]} and ${q[1]} to their common leader and divide, which multiplies the ratios along the chain from ${q[0]} to ${q[1]}: ${num(right)}.`);
  },
  bugs: [
    {
      label: 'Unknown x / x is 1',
      find: "if (!parent.has(c) || !parent.has(d)) return -1;",
      replace: "if (c === d) return 1;\n    if (!parent.has(c) || !parent.has(d)) return -1;",
      explain: 'A variable that never appeared has no value at all: x / x must be -1, not 1.',
    },
    {
      label: 'Invert the union formula',
      find: 'weight.set(ra, (k * weight.get(b)) / weight.get(a));',
      replace: 'weight.set(ra, (k * weight.get(a)) / weight.get(b));',
      explain: 'ra / rb = (a / b) × (b / rb) / (a / ra) = k × weight[b] / weight[a]; swapping a and b gives wrong rates once both sides already had leaders.',
    },
  ],
};
