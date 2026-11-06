// Find Critical and Pseudo-Critical Edges in MST (Kruskal, rebuilt with one edge banned or forced). The cheapest
// tree's weight is the benchmark: an edge whose ban makes every tree heavier is critical; one that can be forced in
// at no extra cost is pseudo-critical. Reads the parent array (parent / par… or a UnionFind object's parent), the
// edge from the code's own destructuring, ban / force arguments and critical / pseudo lists by common names.
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
/** "{0, 1} {2}": the groups of nodes */
function groups(p) {
  const by = new Map();
  for (let i = 0; i < p.length; i++) {
    const r = leader(p, i);
    if (!by.has(r)) by.set(r, []);
    by.get(r).push(i);
  }
  return [...by.values()].map((g) => `{${g.join(', ')}}`).join(' ');
}
const edgeText = ([a, b, w]) => `edge ${a}–${b} (weight ${w})`;
/** how many helper functions deep line ln sits (1 = the main function) */
function fnDepth(lines, ln) {
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
  return stack.filter(Boolean).length;
}
const intOf = (vars, re) => Object.keys(vars || {}).find((k) => re.test(k) && Number.isInteger(vars[k]));
const BAN = /^(skip|ban|banned|exclude|excluded|without|block|blocked|ignore|removed?|del|drop)$/i;
const FORCE = /^(force|forced|include|included|must|keep|pick|pre|take)$/i;
const listOf = (vars, re, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && re.test(k) && row(vars[k]));
const CRIT = /^crit/i;
const PSEUDO = /pseudo|psuedo|semi|^non/i;
const BEST = ['best', 'base', 'mstWeight', 'minWeight', 'target', 'opt', 'optimal', 'mst', 'baseline', 'minCost', 'origin', 'original'];
const fmt = (x) => (x === null || x === Infinity ? '∞' : x);
/** what the current rebuild does with one edge: "ban 2" / "force 2" / "" */
function mode(vars) {
  const s = intOf(vars, BAN);
  const f = intOf(vars, FORCE);
  if (s && vars[s] >= 0) return { kind: 'ban', i: vars[s] };
  if (f && vars[f] >= 0) return { kind: 'force', i: vars[f] };
  if (s || f) return { kind: 'plain' };
  return null;
}

export default {
  id: 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree',
  metaphor: 'Rebuild the cheapest network, one edge banned',
  caption: 'Each tree in the forest is a group joined so far. First Kruskal finds the cheapest weight; then every edge is banned (does the tree get heavier? critical) or forced in first (still the cheapest? pseudo-critical).',
  narrate(ctx) {
    const edges = ctx.vars[ctx.params[1]];
    const at = (i) => (Array.isArray(edges) && row(edges[i]) ? `edge ${i} (${edges[i][0]}–${edges[i][1]}, weight ${edges[i][2]})` : `edge ${i}`);
    const depth = fnDepth(ctx.lines, ctx.line);
    if (ctx.ret && depth <= 1 && Array.isArray(ctx.value) && ctx.value.length === 2 && ctx.value.every(row)) {
      return `done: ${ctx.value[0].length} critical edge(s) [${ctx.value[0].join(', ')}], ${ctx.value[1].length} pseudo-critical [${ctx.value[1].join(', ')}]`;
    }
    const sumVar = Object.keys(ctx.vars).some((k) => /total|sum|weight|cost|res|ans|mst/i.test(k) && !(edgeNames(ctx.lines, ctx.vars) || []).includes(k) && ctx.vars[k] === ctx.value && new RegExp(`\\b${k}\\b`).test(ctx.src || ''));
    if (ctx.ret && depth > 1 && (ctx.value === Infinity || ctx.value === null || (typeof ctx.value === 'number' && sumVar)) && parentOf(ctx.vars)) {
      const m = mode(ctx.vars);
      if (ctx.value === Infinity || ctx.value === null) return `the groups never became one: ${m?.kind === 'ban' ? `without ${at(m.i)} ` : ''}there is no spanning tree (weight ∞)`;
      return `this tree weighs ${ctx.value}`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const [cName, pName] = [listOf(ctx.vars, CRIT, ctx.params), listOf(ctx.vars, PSEUDO, ctx.params)];
    for (const [k, word] of [[cName, 'critical: without it every tree is heavier (or none exists)'], [pName, 'pseudo-critical: forced in, the tree still has the best weight']]) {
      const now = k && ctx.vars[k];
      const was = k && row(ctx.prev[k]);
      if (now && was && now.length === was.length + 1) return `${at(now.at(-1))} is ${word}`;
    }
    const bName = BEST.find((k) => Number.isFinite(ctx.vars[k]) && ctx.prev[k] === undefined);
    if (bName && depth <= 1) return `the cheapest spanning tree weighs ${ctx.vars[bName]}: every edge is now tested against it`;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const full = !ctx.next || parentOf(ctx.next.vars)?.length === p?.length;
    if (p && full && p.length > 1 && roots(p) === p.length && (!pp || pp.length !== p.length || roots(pp) < pp.length)) {
      const m = mode(ctx.vars);
      if (m?.kind === 'ban') return `rebuild with ${at(m.i)} banned: ${p.length} separate nodes again`;
      if (m?.kind === 'force') return `rebuild with ${at(m.i)} forced in first: ${p.length} separate nodes again`;
      if (m) return `plain Kruskal first: ${p.length} separate nodes, cheapest edges first`;
      return `a fresh forest: ${p.length} separate nodes, build a tree again`;
    }
    const cur = edgeOf(ctx.lines, ctx.vars);
    if (!p || !pp || p.length !== pp.length || !cur) return null;
    const before = cur.ns.map((k) => ctx.prev[k]);
    const arrived = before.every(Number.isInteger) && before.some((x, i) => x !== cur.e[i]);
    const joined = roots(p) < roots(pp);
    const t = totalOf(ctx.vars, cur.ns);
    const paid = t && ctx.vars[t] !== ctx.prev[t] ? ` (total ${ctx.vars[t]})` : '';
    const [a, b] = cur.e;
    const same = leader(pp, a) !== undefined && leader(pp, a) === leader(pp, b);
    const m = mode(ctx.vars);
    const isI = (i) => Array.isArray(edges) && row(edges[i]) && edges[i].slice(0, 3).join() === cur.e.join() && edges.filter((e) => row(e) && e.slice(0, 3).join() === cur.e.join()).length === 1;
    if (joined && m?.kind === 'force' && isI(m.i)) return `${edgeText(cur.e)} is forced in before anything else${paid}`;
    if (joined) return `${edgeText(cur.e)}: ${a} and ${b} were in different groups, so it joins the tree${paid}`;
    if (arrived && m?.kind === 'ban' && isI(m.i)) return `${edgeText(cur.e)} is the banned one: leave it out`;
    if (arrived && same) return `${edgeText(cur.e)}: ${a} and ${b} are already joined, it would close a loop: skip`;
    if (arrived) return `next cheapest: ${edgeText(cur.e)}`;
    if (paid) return `add ${cur.e[2]}: total ${ctx.vars[t]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const params = ctx.params;
    const edges = ctx.vars[params[1]];
    // classification: which list does the edge land in?
    const [cName, pName] = [listOf(ctx.next.vars, CRIT, params), listOf(ctx.next.vars, PSEUDO, params)];
    const grew = (k) => k && row(ctx.vars[k]) && ctx.next.vars[k].length === ctx.vars[k].length + 1;
    if (grew(cName) || grew(pName)) {
      const i = ctx.next.vars[grew(cName) ? cName : pName].at(-1);
      const bName = BEST.find((k) => Number.isFinite(ctx.vars[k]));
      const m = mode(ctx.vars);
      if (!Number.isInteger(i) || !Array.isArray(edges) || !row(edges[i]) || !bName || !ctx.ret || m?.i !== i) return null;
      const v = fmt(ctx.value);
      const what = m.kind === 'ban' ? `With it banned, the best tree weighs ${v}` : `Forced in first, the tree weighs ${v}`;
      const right = grew(cName) ? 0 : 1;
      return {
        question: `Edge ${i} (${edges[i][0]}–${edges[i][1]}, weight ${edges[i][2]}). ${what}; the benchmark (cheapest tree) is ${ctx.vars[bName]}. Where is it filed?`,
        options: ['Critical', 'Pseudo-critical', 'In neither list'],
        answer: right,
        explain: right === 0 ? `Banning it makes the tree heavier (${v} > ${ctx.vars[bName]}) or impossible: every cheapest tree needs it.` : `It is not critical (banning it costs nothing), but forcing it in still reaches ${ctx.vars[bName]}: some cheapest tree uses it.`,
      };
    }
    // the first rebuild only, and only its first loop-closing edge: built or skipped?
    if (listOf(ctx.vars, CRIT, params) || listOf(ctx.vars, PSEUDO, params)) return null;
    const p = parentOf(ctx.vars);
    const pn = parentOf(ctx.next.vars);
    if (!p || !pn || p.length !== pn.length || fnDepth(ctx.lines, ctx.line) !== fnDepth(ctx.lines, ctx.next.line)) return null;
    const cur = edgeOf(ctx.lines, ctx.vars);
    const nxt = edgeOf(ctx.lines, ctx.next.vars);
    if (!nxt) return null;
    const sameEdge = cur && cur.ns.every((k, i) => k === nxt.ns[i] && cur.e[i] === nxt.e[i]);
    const dec = roots(pn) < roots(p);
    const [a, b] = nxt.e;
    if (leader(p, a) === undefined || leader(p, b) === undefined) return null;
    const same = leader(p, a) === leader(p, b);
    if (dec || !same || sameEdge) return null;
    // only the first edge that closes a loop: its place in the sorted list equals the number of edges joined so far
    const sorted = Object.values(ctx.vars).find((l) => Array.isArray(l) && l.length > 1 && l.every((r, i) => row(r) && r.length >= 3 && (i === 0 || l[i - 1][2] <= r[2])));
    const joinedSoFar = p.length - roots(p);
    if (!sorted || sorted[joinedSoFar]?.slice(0, 3).join() !== nxt.e.join()) return null;
    const joins = false;
    return {
      question: `Groups so far: ${groups(p)}. Next, ${edgeText(nxt.e)}: joins the tree or skipped?`,
      options: ['Joins: it links two groups', 'Skipped: it would close a loop'],
      answer: joins ? 0 : 1,
      explain: joins ? `${a} and ${b} are in different groups; it is the cheapest edge left that links them.` : `${a} and ${b} are already joined by cheaper edges; this one would only close a loop.`,
    };
  },
  bugs: [
    {
      label: 'Disconnected rebuild counts its partial weight',
      find: 'return uf.count === 1 ? total : Infinity;',
      replace: 'return total;',
      explain: 'Banning the only edge 0–1 leaves two groups. The partial weight 0 looks cheaper than the best 5, so the edge is not called critical.',
    },
    {
      label: 'Test pseudo-critical first',
      find: 'if (mst(i, -1) > best) critical.push(i);        // cannot live without it\n    else if (mst(-1, i) === best) pseudo.push(i);',
      replace: 'if (mst(-1, i) === best) pseudo.push(i);\n    else if (mst(i, -1) > best) critical.push(i);',
      explain: 'A critical edge also passes the "forced in, still the best weight" test, so checking that first files every critical edge as pseudo-critical.',
    },
  ],
};
