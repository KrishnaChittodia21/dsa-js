// Second-Best MST (Kruskal, then one swap). Kruskal builds the cheapest tree; then every edge left out is tried as a
// swap: it closes a loop with the tree path between its ends, and dropping the heaviest edge on that path that is
// strictly lighter than it gives a strictly heavier tree. Reads the parent array, the edge from the code's own
// destructuring, the path tables (M1 / M2: any two n×n tables) and the running answer by common names.
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
const BEST = ['best', 'base', 'mstWeight', 'minWeight', 'mst', 'total', 'weight', 'sum', 'cost'];
const ANS = /^(ans|answer|res|result|second|secondBest|second_best|sb|best2|cand|candidate|out)$/i;
const num = (x) => typeof x === 'number' && Number.isFinite(x);
/** the n×n path tables: { m1, m2 } names (m2 = the one named second / 2), or null */
function tablesOf(vars, params) {
  const t = Object.keys(vars || {}).filter((k) => !params.includes(k) && Array.isArray(vars[k]) && vars[k].length > 0 && vars[k].every((r) => row(r) && r.length === vars[k].length));
  if (!t.length) return null;
  const m2 = t.find((k) => /2|second|sec|low/i.test(k));
  const m1 = t.find((k) => k !== m2);
  return m1 ? { m1, m2 } : null;
}
const bestOf = (vars, skip) => BEST.find((k) => !skip.includes(k) && num(vars?.[k]));
const ansOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && ANS.test(k) && (typeof vars[k] === 'number' || vars[k] === null));

export default {
  id: 'classic-second-best-mst',
  metaphor: 'Swap one road in the cheapest network',
  caption: 'First the forest grows into the cheapest tree (Kruskal). Then each unused edge is swapped in: it closes a loop with the tree path between its ends, and the heaviest strictly lighter edge on that path is dropped.',
  maxPredicts: 3,
  narrate(ctx) {
    const depth = fnDepth(ctx.lines, ctx.line);
    const p = parentOf(ctx.vars);
    if (ctx.ret && depth <= 1 && Number.isInteger(ctx.value)) {
      if (ctx.value !== -1) return `the cheapest strictly heavier spanning tree weighs ${ctx.value}`;
      if (p && roots(p) > 1) return `the forest never became one tree: there is no spanning tree at all, so -1`;
      return `no swap gives a strictly heavier tree (every unused edge ties or there is none), so -1`;
    }
    if (!Object.keys(ctx.prev).length) return null;
    const tabs = tablesOf(ctx.vars, ctx.params);
    const cur = edgeOf(ctx.lines, ctx.vars);
    // phase 3: a swap lowers the answer
    const a = ansOf(ctx.vars, ctx.params);
    if (tabs && a && num(ctx.vars[a]) && ctx.vars[a] !== ctx.prev[a] && cur) {
      const b = bestOf(ctx.vars, [...cur.ns, a]);
      const [u, v, w] = cur.e;
      if (b) return `swap in edge ${u}–${v} (weight ${w}), drop the path edge of weight ${ctx.vars[b] - ctx.vars[a] + w}: ${ctx.vars[b]} − ${ctx.vars[b] - ctx.vars[a] + w} + ${w} = ${ctx.vars[a]}`;
      return `swap in edge ${u}–${v} (weight ${w}): a tree of weight ${ctx.vars[a]}`;
    }
    if (tabs && a && cur && cur.ns.every((k) => Number.isInteger(ctx.prev[k])) && cur.ns.some((k, i) => ctx.prev[k] !== cur.e[i])) return `try the unused ${edgeText(cur.e)} as a swap`;
    // phase 2: path tables
    if (tabs) {
      for (const [k, word] of [[tabs.m1, 'heaviest'], [tabs.m2, 'strictly second-heaviest']]) {
        const now = k && ctx.vars[k];
        const was = k && ctx.prev[k];
        if (!now || !Array.isArray(was) || was.length !== now.length) continue;
        for (let s = 0; s < now.length; s++) {
          for (let t = 0; t < now.length; t++) {
            if (now[s][t] !== was[s]?.[t] && num(now[s][t])) return `tree path ${s} → ${t}: its ${word} edge weighs ${now[s][t]}`;
          }
        }
      }
      return null;
    }
    // phase 1: Kruskal
    const b0 = bestOf(ctx.vars, cur?.ns || []);
    const pp = parentOf(ctx.prev);
    const full = !ctx.next || parentOf(ctx.next.vars)?.length === p?.length;
    if (p && full && p.length > 1 && roots(p) === p.length && (!pp || pp.length !== p.length)) return `${p.length} separate nodes: Kruskal joins them cheapest edge first`;
    if (!p || !pp || p.length !== pp.length || !cur) return null;
    const before = cur.ns.map((k) => ctx.prev[k]);
    const arrived = before.every(Number.isInteger) && before.some((x, i) => x !== cur.e[i]);
    const joined = roots(p) < roots(pp);
    const [x, y] = cur.e;
    const same = leader(pp, x) !== undefined && leader(pp, x) === leader(pp, y);
    if (joined) return `${edgeText(cur.e)}: ${x} and ${y} were in different groups, so it joins the tree`;
    if (arrived && same) return `${edgeText(cur.e)}: ${x} and ${y} are already joined, it stays out (a swap candidate later)`;
    if (arrived) return `next cheapest: ${edgeText(cur.e)}`;
    if (b0 && ctx.vars[b0] !== ctx.prev[b0] && num(ctx.prev[b0])) return `the tree now weighs ${ctx.vars[b0]}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const params = ctx.params;
    const tabs = tablesOf(ctx.vars, params);
    // the swap: what tree weight does it give?
    if (tabs) {
      const a = ansOf(ctx.next.vars, params);
      const cur = edgeOf(ctx.lines, ctx.vars);
      if (!a || !cur || !num(ctx.next.vars[a]) || ctx.next.vars[a] === ctx.vars[a]) return null;
      const nx = edgeOf(ctx.lines, ctx.next.vars);
      if (!nx || nx.e.join() !== cur.e.join()) return null;
      const [u, v, w] = cur.e;
      const b = bestOf(ctx.vars, [...cur.ns, a]);
      const m1 = ctx.vars[tabs.m1]?.[u]?.[v];
      const m2 = tabs.m2 ? ctx.vars[tabs.m2]?.[u]?.[v] : undefined;
      if (!b || !num(m1)) return null;
      const B = ctx.vars[b];
      const right = ctx.next.vars[a];
      const wrong = [B - m1 + w, num(m2) ? B - m2 + w : B + w, B + w, B - w].filter((x) => x !== right);
      const why = w > m1 ? `${w} is heavier than the heaviest path edge ${m1}, so drop ${m1}: ${B} − ${m1} + ${w} = ${B - m1 + w}.` : num(m2) ? `${w} ties the heaviest path edge ${m1}: swapping those gives ${B} again, not strictly more. Drop the strictly lighter ${m2}: ${B} − ${m2} + ${w} = ${B - m2 + w}.` : `That is what your run records.`;
      return options(`Swap edge ${u}–${v} (weight ${w}) into the tree (weight ${B}). Its tree path has heaviest edge ${m1}${num(m2) ? `, strictly second-heaviest ${m2}` : ''}. New candidate weight?`, right, wrong, right === (w > m1 ? B - m1 + w : B - m2 + w) ? why : `Your run records ${right}. ${why}`);
    }
    // Kruskal: only the first edge that stays out
    const p = parentOf(ctx.vars);
    const pn = parentOf(ctx.next.vars);
    if (!p || !pn || p.length !== pn.length || tablesOf(ctx.next.vars, params) || fnDepth(ctx.lines, ctx.line) !== fnDepth(ctx.lines, ctx.next.line)) return null;
    const cur = edgeOf(ctx.lines, ctx.vars);
    const nxt = edgeOf(ctx.lines, ctx.next.vars);
    if (!nxt) return null;
    const sameEdge = cur && cur.ns.every((k, i) => k === nxt.ns[i] && cur.e[i] === nxt.e[i]);
    const [x, y, w] = nxt.e;
    if (leader(p, x) === undefined || leader(p, y) === undefined || x === y) return null;
    if (roots(pn) < roots(p) || leader(p, x) !== leader(p, y) || sameEdge) return null;
    const edges = ctx.vars[params[1]];
    const sorted = Array.isArray(edges) ? [...edges].filter(row).sort((e1, e2) => e1[2] - e2[2]) : null;
    if (!sorted || sorted[p.length - roots(p)]?.slice(0, 3).join() !== nxt.e.join()) return null;
    return {
      question: `Groups so far: ${groups(p)}. Next, ${edgeText(nxt.e)}: joins the tree or stays out?`,
      options: ['Joins: it links two groups', 'Stays out: it would close a loop'],
      answer: 1,
      explain: `${x} and ${y} are already joined by cheaper edges, so ${x}–${y} (${w}) would close a loop. It stays out of the cheapest tree, but it is exactly the kind of edge the swap step tries later.`,
    };
  },
  bugs: [
    {
      label: 'Allow an equal-weight swap',
      find: 'if (w > M1[u][v])',
      replace: 'if (w >= M1[u][v])',
      explain: 'Swapping an edge for one of the same weight gives another cheapest tree, not a strictly heavier one: the equal triangle returns 2 instead of -1.',
    },
    {
      label: 'Use only the heaviest path edge',
      find: 'else if (M2[u][v] !== -Infinity) answer = Math.min(answer, best - M2[u][v] + w);',
      replace: '',
      explain: 'When the unused edge ties the heaviest path edge, the swap must drop the strictly lighter second one instead. Skipping that case, 0–2 (2) in a 1, 2 tree is never used and the run says -1 instead of 4.',
    },
  ],
};
