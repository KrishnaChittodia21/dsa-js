// Optimize Water Distribution in a Village (virtual node + Kruskal). A well at house i is a pipe from "the well"
// (node 0) to house i; Kruskal then buys the cheapest pipes and wells first, skipping any that join houses already
// sharing water. Reads the parent array (parent / par / fa… or a UnionFind object's parent) and the edge being tried
// from the code's own destructuring (`const [a, b, c] of …`) or common names; else the generic notes show.
import { options, row, parentOf } from './util.js';

const ENDS = [['a', 'b'], ['u', 'v'], ['x', 'y'], ['from', 'to'], ['c1', 'c2'], ['city1', 'city2'], ['p', 'q']];
const WEIGHTS = ['cost', 'w', 'c', 'wt', 'weight', 'price'];
const NAME = (x) => (x === 0 ? 'the well' : `house ${x}`);
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
/** "{well, 1} {2, 3}": the groups of houses, node 0 being the well */
function groups(p) {
  const by = new Map();
  for (let i = 0; i < p.length; i++) {
    const r = leader(p, i);
    if (!by.has(r)) by.set(r, []);
    by.get(r).push(i === 0 ? 'well' : i);
  }
  return [...by.values()].map((g) => `{${g.join(', ')}}`).join(' ');
}
const road = ([a, b, w]) => (a === 0 || b === 0 ? `a well at house ${a || b} (cost ${w})` : `pipe ${a}–${b} (cost ${w})`);
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
  id: 'optimize-water-distribution-in-a-village',
  metaphor: 'Wells and pipes, cheapest first',
  caption: 'Node 0 is the well: building a well at a house is a pipe from it. Each tree in the forest is a group of houses sharing water; the group holding the well is wet. Cheapest first, a pipe or well is bought only when it joins two groups.',
  narrate(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (ctx.ret && Number.isInteger(ctx.value) && inMain(ctx.lines, ctx.line)) {
      return `${Number.isInteger(n) ? `all ${n} houses` : 'every house'} now reach the well through wells and pipes: the cheapest plan costs ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    // a well written as a pipe from node 0
    for (const [k, v] of Object.entries(ctx.vars)) {
      const was = ctx.prev[k];
      if (ctx.params.includes(k) || !Array.isArray(v) || !Array.isArray(was) || v.length !== was.length + 1) continue;
      const last = v.at(-1);
      if (row(last) && last.length >= 3 && last[0] === 0) return `house ${last[1]}: a well there costs ${last[2]}, written as a pipe from the well (node 0)`;
    }
    const list = newlySorted(ctx);
    if (list) return `sort all pipes and wells by cost: ${list.slice(0, 4).map((r) => `${r[0]}–${r[1]} (${r[2]})`).join(', ')}${list.length > 4 ? ', …' : ''}`;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const full = !ctx.next || parentOf(ctx.next.vars)?.length === p?.length;
    if (p && full && p.length > 1 && roots(p) === p.length && (!pp || pp.length !== p.length)) return `${p.length} groups: the well (node 0) and ${p.length - 1} dry houses, each on its own`;
    const cur = edgeOf(ctx.lines, ctx.vars);
    if (!p || !pp || p.length !== pp.length || !cur) return null;
    const before = cur.ns.map((k) => ctx.prev[k]);
    const arrived = before.every(Number.isInteger) && before.some((x, i) => x !== cur.e[i]);
    const joined = roots(p) < roots(pp);
    const t = totalOf(ctx.vars, cur.ns);
    const paid = t && ctx.vars[t] !== ctx.prev[t] ? ` (total ${ctx.vars[t]})` : '';
    const [a, b] = cur.e;
    const same = leader(pp, a) !== undefined && leader(pp, a) === leader(pp, b);
    if (joined) {
      const what = a === 0 || b === 0 ? `house ${a || b}'s group had no water yet, so build the well` : `${a} and ${b} were in different groups, so lay the pipe`;
      return `${road(cur.e)}: ${what}${paid}`;
    }
    if (arrived && same) return `${road(cur.e)}: ${a === 0 || b === 0 ? `house ${a || b} already gets water` : `${a} and ${b} already share water`}, skip`;
    if (arrived) return `next cheapest: ${road(cur.e)}`;
    if (paid) return `pay ${cur.e[2]}: total ${ctx.vars[t]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const p = parentOf(ctx.vars);
    const pn = parentOf(ctx.next.vars);
    if (!p || !pn || p.length !== pn.length || !inMain(ctx.lines, ctx.line) || !inMain(ctx.lines, ctx.next.line)) return null;
    const cur = edgeOf(ctx.lines, ctx.vars);
    const nxt = edgeOf(ctx.lines, ctx.next.vars);
    if (!nxt) return null;
    const sameEdge = cur && cur.ns.every((k, i) => k === nxt.ns[i] && cur.e[i] === nxt.e[i]);
    const dec = roots(pn) < roots(p);
    const [a, b] = nxt.e;
    if (leader(p, a) === undefined || leader(p, b) === undefined) return null;
    const same = leader(p, a) === leader(p, b);
    let buys;
    if (dec && !same) buys = true; // the union shows in the next step, with this edge on screen
    else if (!dec && same && !sameEdge) buys = false; // a new edge arrives inside one group
    if (buys === undefined) return null;
    if (buys && roots(p) === p.length) return null; // the very first edge always joins: not worth asking
    const well = a === 0 || b === 0;
    const h = a || b;
    return {
      question: `Groups so far: ${groups(p)}. Next, ${road(nxt.e)}: buy it or skip it?`,
      options: well ? ['Build the well', `Skip: house ${h} already gets water`] : ['Lay the pipe', `Skip: ${a} and ${b} already share water`],
      answer: buys ? 0 : 1,
      explain: buys
        ? `${well ? `House ${h}'s group is not connected to the well yet` : `${a} and ${b} are in different groups`}, and nothing cheaper is left to join them, so buying this one is part of the cheapest plan.`
        : `${well ? `House ${h} is already in the well's group` : `${a} and ${b} are already in one group`} through cheaper wells and pipes; buying this would only pay twice for water they have.`,
    };
  },
  bugs: [
    {
      label: 'Stop at n − 1 edges',
      find: 'if (++used === n) break;',
      replace: 'if (++used === n - 1) break;',
      explain: 'With the well there are n + 1 nodes, so a full plan has n edges. Stopping at n − 1 leaves one house (or one group) dry.',
    },
    {
      label: 'Last house gets no well option',
      find: 'for (let i = 1; i <= n; i++)',
      replace: 'for (let i = 1; i < n; i++)',
      explain: 'Houses are 1…n, so i must reach n. Without the edge for house n, it can only get water by pipe, even when its own well is far cheaper.',
    },
  ],
};
