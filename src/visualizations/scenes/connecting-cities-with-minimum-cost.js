// Connecting Cities With Minimum Cost (Kruskal + union-find). Roads are tried cheapest first; a road between two
// different groups of cities is built, a road inside one group would close a loop and is skipped.
// Reads the parent array (parent / par / fa… or a UnionFind object's parent) and the road being tried from the code's
// own destructuring (`const [a, b, cost] of …`) or common names; anything else falls back to the generic notes.
import { options, row, parentOf } from './util.js';

const ENDS = [['a', 'b'], ['u', 'v'], ['x', 'y'], ['from', 'to'], ['c1', 'c2'], ['city1', 'city2'], ['p', 'q']];
const WEIGHTS = ['cost', 'w', 'c', 'wt', 'weight', 'price'];
const TOTALS = ['total', 'res', 'ans', 'answer', 'sum', 'result', 'mst', 'minCost', 'totalCost', 'cost'];

const roots = (p) => p.filter((x, i) => x === i).length;
/** the group leader of x, or undefined when x is not a slot of p */
function leader(p, x) {
  for (let k = 0; k <= p.length; k++) {
    if (!Number.isInteger(x) || x < 0 || x >= p.length) return undefined;
    if (p[x] === x) return x;
    x = p[x];
  }
  return undefined;
}
/** names the road is unpacked into ([a, b, cost]), read from the code, else common names */
function edgeNames(lines, vars) {
  const ok = (ns) => ns.every((k) => Number.isInteger(vars?.[k]));
  for (const line of lines || []) {
    for (const m of line.matchAll(/\[\s*(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*(?:,\s*\w+\s*)*\]\s*(?:of\b|=\s*\w)/g)) {
      // [cost, a, b] order (sorted by the first field): put the weight last
      const ns = WEIGHTS.includes(m[1]) || /^(d|dist)$/.test(m[1]) ? [m[2], m[3], m[1]] : m.slice(1, 4);
      if (ok(ns)) return ns;
    }
  }
  for (const [a, b] of ENDS) for (const w of WEIGHTS) if (ok([a, b, w])) return [a, b, w];
  return null;
}
const edgeOf = (lines, vars) => {
  const ns = edgeNames(lines, vars);
  return ns ? { ns, e: ns.map((k) => vars[k]) } : null;
};
const totalOf = (vars, skip) => TOTALS.find((k) => !skip.includes(k) && Number.isInteger(vars?.[k]));
/** "{1, 3} {2}": the groups of cities 1…n (slot 0 is unused) */
function groups(p) {
  const by = new Map();
  for (let i = 1; i < p.length; i++) {
    const r = leader(p, i);
    if (!by.has(r)) by.set(r, []);
    by.get(r).push(i);
  }
  return [...by.values()].map((g) => `{${g.join(', ')}}`).join(' ');
}
const road = ([a, b, w]) => `road ${a}–${b} (cost ${w})`;
/** true when line ln is in the main function, not in a helper (find / union) defined inside it */
function inMain(lines, ln) {
  const stack = [];
  for (let i = 0; i < ln && i < (lines || []).length; i++) {
    const s = lines[i].replace(/\/\/.*$/, '');
    let fn = /=>|\bfunction\b/.test(s);
    for (const ch of s) {
      if (ch === '{') {
        stack.push(fn);
        fn = false;
      } else if (ch === '}') stack.pop();
    }
  }
  return stack.filter(Boolean).length <= 1;
}
/** a list of [a, b, cost] rows sorted by cost that was not sorted (or not there) one step ago */
function newlySorted(ctx) {
  for (const [k, v] of Object.entries(ctx.vars)) {
    const ok = (l) => Array.isArray(l) && l.length > 1 && l.every((r) => row(r) && r.length >= 3);
    if (!ok(v) || !v.every((r, i) => i === 0 || v[i - 1][2] <= r[2])) continue;
    const was = ctx.prev[k];
    if (was === undefined ? !ctx.params.includes(k) : ok(was) && was.length === v.length && JSON.stringify(was) !== JSON.stringify(v)) return v;
  }
  return null;
}

export default {
  id: 'connecting-cities-with-minimum-cost',
  metaphor: 'Building the cheapest roads first',
  caption: 'Each tree in the forest is a group of cities already linked by built roads. Roads are tried from cheapest up: one that joins two groups is built, one inside a group would only close a loop.',
  narrate(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (ctx.ret && Number.isInteger(ctx.value) && inMain(ctx.lines, ctx.line)) {
      if (ctx.value === -1) return `the roads ran out with cities still apart: they can never all be linked, so -1`;
      return `${Number.isInteger(n) ? `${n - 1} roads link all ${n} cities` : 'every city is linked'}: the cheapest network costs ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const list = newlySorted(ctx);
    if (list) {
      return `sort the roads by cost: ${list.slice(0, 4).map((r) => `${r[0]}–${r[1]} (${r[2]})`).join(', ')}${list.length > 4 ? ', …' : ''}`;
    }
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const full = !ctx.next || parentOf(ctx.next.vars)?.length === p?.length;
    if (p && full && p.length > 1 && roots(p) === p.length && (!pp || pp.length !== p.length)) return `${p.length - 1} cities, each its own group (slot 0 is unused: cities are 1…${p.length - 1})`;
    const cur = edgeOf(ctx.lines, ctx.vars);
    if (!p || !pp || p.length !== pp.length || !cur) return null;
    const before = cur.ns.map((k) => ctx.prev[k]);
    const arrived = before.every(Number.isInteger) && before.some((x, i) => x !== cur.e[i]);
    const joined = roots(p) < roots(pp);
    const t = totalOf(ctx.vars, cur.ns);
    const paid = t && ctx.vars[t] !== ctx.prev[t] ? ` (total ${ctx.vars[t]})` : '';
    const [a, b] = cur.e;
    const same = leader(pp, a) !== undefined && leader(pp, a) === leader(pp, b);
    if (joined) return `${road(cur.e)}: ${a} and ${b} were in different groups, so it is built${paid}`;
    if (arrived && same) return `${road(cur.e)}: ${a} and ${b} are already linked, it would close a loop: skip`;
    if (arrived) return `next cheapest: ${road(cur.e)}`;
    if (paid) return `pay ${cur.e[2]} for road ${a}–${b}: total ${ctx.vars[t]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const p = parentOf(ctx.vars);
    const pn = parentOf(ctx.next.vars);
    // the verdict: everything linked, or -1?
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && p && inMain(ctx.lines, ctx.next.line)) {
      const t = totalOf(ctx.vars, edgeNames(ctx.lines, ctx.vars) || []);
      const right = ctx.next.value;
      const g = groups(p);
      return options(
        `The cities now form these groups: ${g}. What does the run return?`,
        right,
        [-1, t ? ctx.vars[t] : 0, 0].filter((x) => x !== right),
        right === -1 ? `More than one group is left and no road remains to join them, so the cities can never all be linked: -1.` : `One group means every city is linked, so the run returns the total paid for the built roads: ${right}.`,
      );
    }
    if (!p || !pn || p.length !== pn.length || !inMain(ctx.lines, ctx.line) || !inMain(ctx.lines, ctx.next.line)) return null;
    const cur = edgeOf(ctx.lines, ctx.vars);
    const nxt = edgeOf(ctx.lines, ctx.next.vars);
    if (!nxt) return null;
    const sameEdge = cur && cur.ns.every((k, i) => k === nxt.ns[i] && cur.e[i] === nxt.e[i]);
    const dec = roots(pn) < roots(p);
    const [a, b] = nxt.e;
    if (leader(p, a) === undefined || leader(p, b) === undefined) return null;
    const same = leader(p, a) === leader(p, b);
    let joins;
    if (dec && !same) joins = true; // the union shows in the next step, with this road on screen
    else if (!dec && same && !sameEdge) joins = false; // a new road arrives inside one group
    if (joins === undefined) return null;
    if (joins && roots(p) === p.length) return null; // the very first road always joins: not worth asking
    return {
      question: `Groups so far: ${groups(p)}. Road ${a}–${b} (cost ${nxt.e[2]}): built or skipped?`,
      options: ['Built: it joins two groups', 'Skipped: it would close a loop'],
      answer: joins ? 0 : 1,
      explain: joins ? `${a} and ${b} are in different groups, so this road links them; it is the cheapest road left, so building it is safe.` : `${a} and ${b} are already in one group through cheaper roads; another road between them only closes a loop.`,
    };
  },
  bugs: [
    {
      label: 'Forget the impossible case',
      find: 'return -1;',
      replace: 'return total;',
      explain: 'When the roads run out before n − 1 are built, some city is still cut off. Returning the partial total pretends {1,2} and {3,4} are linked.',
    },
    {
      label: 'Sort without a comparator',
      find: 'connections.sort((x, y) => x[2] - y[2]);',
      replace: 'connections.sort();',
      explain: 'sort() compares the roads as text ("1,2,100" < "2,3,1"), not by cost, so an expensive road can be built before a cheap one.',
    },
  ],
};
