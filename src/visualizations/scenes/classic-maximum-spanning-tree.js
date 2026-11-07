// Maximum spanning tree, Kruskal in reverse: roads sorted most scenic (heaviest) first; a road is built only when it joins two different groups of towns
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
  id: 'classic-maximum-spanning-tree',
  metaphor: 'Keeping the most scenic roads',
  caption: 'Roads are tried most scenic (heaviest) first. Each tree in the forest is a group of towns already linked, its root the group chief: a road between two groups is built, a road inside one group would close a loop.',
  narrate(ctx) {
    const [nName, eName] = ctx.params;
    const n = ctx.vars[nName];
    if (!inMain(ctx, ctx.line)) return null;
    if (ctx.ret && typeof ctx.value === 'number') {
      if (ctx.value === -1) return 'the roads ran out before every town was linked: the graph is disconnected, so -1';
      if (n === 1) return 'a single town needs no roads: the answer is 0';
      return `all ${n} towns are linked with ${Number.isInteger(n) ? n - 1 : 'n − 1'} roads: the most scenic tree scores ${ctx.value}`;
    }
    if (!(eName in ctx.vars)) return null;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const e = edgeOf(ctx.vars);
    const [tName, total] = totalOf(ctx.vars);
    if (p && !(pp && pp.length === p.length) && p.length === n && groups(p) === n) return `${p.length} towns, each its own group: a road may only join two different groups`;
    const [uName, used] = firstInt(ctx.vars, ['used', 'cnt', 'count', 'edgesUsed', 'taken', 'added', 'k']);
    if (uName && used === ctx.prev[uName] + 1 && Number.isInteger(n)) return `roads kept: ${used} of the ${n - 1} a tree on ${n} towns needs`;
    if (tName && Number.isInteger(ctx.prev[tName]) && total !== ctx.prev[tName] && e && total - ctx.prev[tName] === e[2]) return `keep it: the tree now scores ${total}`;
    if (!p || !e) return null;
    const merged = pp && pp.length === p.length && groups(p) < groups(pp);
    if (merged) return `${fmt(e)}: ${e[0]} and ${e[1]} were in different groups, so it joins the tree (${groups(p)} group${groups(p) === 1 ? '' : 's'} left)`;
    if (same(e, edgeOf(ctx.prev))) return null;
    const [ra, rb] = [rootOf(p, e[0]), rootOf(p, e[1])];
    if (ra === undefined || rb === undefined) return null;
    if (ra === rb) return `${fmt(e)}: ${e[0]} and ${e[1]} are already in one group (chief ${ra}): it would close a loop, skip`;
    return `next most scenic: ${fmt(e)}; ${e[0]} is in group ${ra}, ${e[1]} in group ${rb}`;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const eName = ctx.params[1];
    const p = parentOf(ctx.vars);
    const np = parentOf(ctx.next.vars);
    if (!p || !np || np.length !== p.length) return null;
    // the end of the road list: the partial total or -1?
    if (ctx.next.ret && typeof ctx.next.value === 'number' && groups(p) > 1 && inMain(ctx, ctx.next.line)) {
      const [, total] = totalOf(ctx.vars);
      const right = ctx.next.value;
      const wrong = [-1, total, 0].filter((x) => x !== undefined && x !== right);
      return options(`Every road has been tried and ${groups(p)} groups of towns are still apart${total !== undefined ? ` (roads kept score ${total})` : ''}. What does the run return?`, right, wrong, right === -1 ? 'The towns never became one group, so no spanning tree exists: -1, not the score of the roads kept so far.' : 'That is what your code returns.');
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
      question: `Next road: ${fmt(e)}. Does it join the tree, or is it skipped?`,
      options: ['Joins the tree', 'Skipped: it would close a loop'],
      answer: joins ? 0 : 1,
      explain: joins ? `${e[0]} and ${e[1]} are in different groups, so the road links them without a loop; it is the most scenic one left, so it is kept.` : `${e[0]} and ${e[1]} already share a chief: a more scenic path between them is already kept, so this road would only close a loop.`,
    };
  },
  bugs: [
    {
      label: 'Sort cheapest first',
      find: 'b[2] - a[2]',
      replace: 'a[2] - b[2]',
      explain: 'The roads are tried lightest first, so the run builds the minimum spanning tree: a valid tree, but not the most scenic one.',
    },
    {
      label: 'No special case for one town',
      find: 'if (n === 1) return 0;',
      replace: '',
      explain: 'A single town needs no roads, but the loop never reaches n − 1 roads built and falls through to -1.',
    },
  ],
};
