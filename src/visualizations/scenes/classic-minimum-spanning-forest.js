// Minimum spanning forest, Kruskal: roads sorted cheapest first; a road is built only when it joins two different groups of towns
// (union-find), otherwise it would close a loop. Reads a union-find parent row (parent / par / fa… or a toolkit
// UnionFind object), the current edge (u / v / w, or an [u, v, w] edge, or sorted[k]) and a total-like counter.
import { firstInt, options, row, parentOf } from './util.js';

const TOTAL = ['total', 'sum', 'res', 'ans', 'result', 'mst', 'cost', 'totalWeight', 'weight', 'tot', 'acc'];

/** the union-find parent row, plain or inside a class instance */
const groups = (p) => p.filter((x, i) => x === i).length;
function rootOf(p, x) {
  for (let s = 0; s <= p.length && Number.isInteger(x) && p[x] !== x; s++) x = p[x];
  return Number.isInteger(x) && p[x] === x ? x : undefined;
}
const triple = (e) => row(e) && e.length === 3 && e.every((x) => typeof x === 'number');
/** the edge being looked at: [u, v, w] */
function edgeOf(vars) {
  for (const k of ['edge', 'e', 'ed', 'cur', 'item']) if (triple(vars[k])) return vars[k];
  const [, u] = firstInt(vars, ['u', 'a', 'x', 'from', 'src', 'n1']);
  const [, v] = firstInt(vars, ['v', 'b', 'y', 'to', 'dst', 'n2']);
  const w = ['w', 'wt', 'weight', 'cost', 'c', 'd'].map((k) => vars[k]).find((x) => typeof x === 'number');
  return u !== undefined && v !== undefined && w !== undefined ? [u, v, w] : null;
}
const totalOf = (vars) => firstInt(vars, TOTAL);
const same = (a, b) => !!a && !!b && a.join() === b.join();
const fmt = (e) => `edge ${e[0]}–${e[1]} (weight ${e[2]})`;
/** line numbers of the main function's own body (not nested helpers like find): its header lists the parameters */
function mainLines(ctx) {
  const head = new RegExp(`\\(\\s*${ctx.params.join('\\s*,\\s*')}\\s*[,)=]`);
  const out = new Set();
  const stack = [];
  let depth = 0;
  let found = false;
  (ctx.lines || []).forEach((l, i) => {
    const code = l.replace(/\/\/.*$/, '');
    if (/\bfunction\b|=>\s*\{/.test(code) && code.includes('{')) {
      const main = !found && head.test(code);
      found ||= main;
      stack.push({ main, depth });
    }
    if (stack.at(-1)?.main) out.add(i + 1);
    for (const ch of code) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (stack.length && depth <= stack.at(-1).depth) stack.pop();
      }
    }
  });
  return out;
}
const inMain = (ctx, line) => mainLines(ctx).has(line);

export default {
  id: 'classic-minimum-spanning-forest',
  metaphor: 'Cheapest roads inside each island',
  caption: 'Roads are tried cheapest first. Each tree in the forest is a group of towns already linked, its root the group chief: a road between two groups is built, a road inside one group would close a loop. Islands no road reaches stay their own group.',
  narrate(ctx) {
    const [nName, eName] = ctx.params;
    const n = ctx.vars[nName];
    if (!inMain(ctx, ctx.line)) return null;
    if (ctx.ret && row(ctx.value) && ctx.value.length === 2) {
      const [t, c] = ctx.value;
      return `every road tried: ${c} island${c === 1 ? '' : 's'}, each with its own cheapest tree; together they cost ${t}`;
    }
    if (!(eName in ctx.vars)) return null;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const e = edgeOf(ctx.vars);
    const [tName, total] = totalOf(ctx.vars);
    if (p && !(pp && pp.length === p.length) && p.length === n && groups(p) === n) return `${p.length} towns, each its own group: a road may only join two different groups`;
    if (!p || !e) return null;
    const merged = pp && pp.length === p.length && groups(p) < groups(pp);
    if (merged) return `${fmt(e)}: ${e[0]} and ${e[1]} were in different groups, so it is built (${tName && total !== ctx.prev[tName] ? `total ${total}, ` : ''}${groups(p)} group${groups(p) === 1 ? '' : 's'} left)`;
    if (tName && Number.isInteger(ctx.prev[tName]) && total !== ctx.prev[tName] && e && total - ctx.prev[tName] === e[2]) return `the road is paid for: total ${total}`;
    if (same(e, edgeOf(ctx.prev))) return null;
    const [ra, rb] = [rootOf(p, e[0]), rootOf(p, e[1])];
    if (ra === undefined || rb === undefined) return null;
    if (ra === rb) return `${fmt(e)}: ${e[0]} and ${e[1]} are already in one group (chief ${ra}): it would close a loop, skip`;
    return `next cheapest: ${fmt(e)}; ${e[0]} is in group ${ra}, ${e[1]} in group ${rb}`;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const eName = ctx.params[1];
    const p = parentOf(ctx.vars);
    const np = parentOf(ctx.next.vars);
    if (!p || !np || np.length !== p.length) return null;
    // the end of the road list: how many islands?
    if (ctx.next.ret && row(ctx.next.value) && ctx.next.value.length === 2 && inMain(ctx, ctx.next.line)) {
      const [, c] = ctx.next.value;
      const g = groups(p);
      return options(`Every road has been tried. How many islands (separate groups) does the run report?`, c, [1, g, g + 1, Number.isInteger(ctx.vars[ctx.params[0]]) ? ctx.vars[ctx.params[0]] : 0].filter((x) => x !== c), c === g ? `Count the chiefs (roots) in the forest: ${g}. Towns no road reaches are islands too.` : `That is what your code reports; the forest has ${g} chiefs.`);
    }
    // the next road: joins or skipped?
    // both steps in the main function: after a helper (find) step the edge on screen is unknown, so do not ask
    if (!(eName in ctx.next.vars) || !inMain(ctx, ctx.next.line) || !inMain(ctx, ctx.line)) return null;
    const e = edgeOf(ctx.next.vars);
    if (!e || same(e, edgeOf(ctx.vars))) return null;
    const joins = groups(np) < groups(p);
    const ra = rootOf(np, e[0]);
    const skip = !joins && ra !== undefined && ra === rootOf(np, e[1]);
    if (!joins && !skip) return null;
    if (joins && groups(p) !== p.length) return null; // ask about the first road, then only about the skips
    return {
      question: `Next road: ${fmt(e)}. Is it built, or skipped?`,
      options: ['Built: it links two groups', 'Skipped: it would close a loop'],
      answer: joins ? 0 : 1,
      explain: joins ? `${e[0]} and ${e[1]} are in different groups, so the road links them without a loop; it is the cheapest one left, so it goes into the forest.` : `${e[0]} and ${e[1]} already share a chief: a cheaper path between them exists, so this road would only close a loop.`,
    };
  },
  bugs: [
    {
      label: 'Add every road',
      find: 'if (uf.union(u, v)) total += w;',
      replace: 'uf.union(u, v); total += w;',
      explain: 'Roads inside one group are paid for too: every edge that closes a loop (and every self-loop) is added to the total.',
    },
    {
      label: 'Sort without a comparator',
      find: '[...edges].sort((a, b) => a[2] - b[2])',
      replace: '[...edges].sort()',
      explain: 'sort() with no comparator compares the edges as text, so roads are not tried cheapest first and an island can end up with a dearer tree.',
    },
  ],
};
