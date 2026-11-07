// Number of Connected Components (union-find or DFS). Every node starts as its own circle of friends; an edge
// between two circles merges them, an edge inside one circle changes nothing. Reads a parent row (parent / par /
// fa…, or a toolkit UnionFind's parent), the edge on screen (a / b, u / v, or an [a, b] pair) and a counter.
// DFS versions: notes on "a new circle starts" when the counter grows; no predictions.
import { firstInt, leaderOf, row, visitedSet, parentOf } from './util.js';

const COUNT = ['components', 'count', 'cnt', 'comps', 'groups', 'res', 'ans', 'result', 'num', 'total', 'c'];

/** the union-find parent row, plain or inside a class instance */
const circles = (p) => p.filter((x, i) => x === i).length;
const pair = (e) => row(e) && e.length === 2 && e.every(Number.isInteger);
/** the edge on screen: [a, b] */
function edgeOf(vars) {
  for (const k of ['edge', 'e', 'ed', 'pair']) if (pair(vars[k])) return vars[k];
  for (const [x, y] of [['a', 'b'], ['u', 'v'], ['from', 'to'], ['src', 'dst']]) if (Number.isInteger(vars[x]) && Number.isInteger(vars[y])) return [vars[x], vars[y]];
  return null;
}
const same = (a, b) => !!a && !!b && a.join() === b.join();
const s = (k) => (k === 1 ? '' : 's');

export default {
  id: 'number-of-connected-components-in-an-undirected-graph',
  metaphor: 'Circles of friends merging',
  caption: 'Each tree in the forest is one circle of friends, its root the circle leader. An edge between two circles merges them; an edge inside one circle changes nothing. The answer is the number of circles left.',
  narrate(ctx) {
    const [nName, eName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `no edges left: ${ctx.value} circle${s(ctx.value)} of friends remain${ctx.value === 1 ? "s" : ""}, so the answer is ${ctx.value}`;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    if (p && !pp && p.length === n && circles(p) === n) return `${n} people, each a circle of one: every edge may merge two circles`;
    const e = edgeOf(ctx.vars);
    if (p && pp && p.length === pp.length) {
      if (circles(p) < circles(pp)) {
        const moved = p.findIndex((x, i) => x !== pp[i]);
        return `${e ? `edge ${e[0]}–${e[1]}: ` : ''}the circle led by ${moved} joins the circle led by ${p[moved]} (${circles(p)} circle${s(circles(p))} left)`;
      }
      if (p.some((x, i) => x !== pp[i])) return 'shortcut: a friend now points closer to its circle leader (same circles, shorter paths)';
    }
    const [cName, c] = firstInt(ctx.vars, COUNT.filter((k) => !ctx.params.includes(k)));
    if (cName && Number.isInteger(ctx.prev[cName]) && c !== ctx.prev[cName]) {
      if (c === ctx.prev[cName] - 1) return `two circles became one: ${cName} = ${c}`;
      if (c === ctx.prev[cName] + 1 && !p) return `an unvisited node starts a new circle: ${c} found so far${visitedSet(ctx.vars).size ? `, ${visitedSet(ctx.vars).size} people reached` : ''}`;
    }
    if (p && e && eName in ctx.vars && !same(e, edgeOf(ctx.prev))) {
      const [la, lb] = [leaderOf(p, e[0]), leaderOf(p, e[1])];
      if (la === lb) return `edge ${e[0]}–${e[1]}: both already follow leader ${la}, a redundant edge: nothing merges`;
      return `edge ${e[0]}–${e[1]}: ${e[0]} follows leader ${la}, ${e[1]} follows leader ${lb}`;
    }
    return null;
  },
  // right before an edge shows up: does it merge two circles? (first two merges, then only the redundant edges)
  predict(ctx) {
    if (!ctx.next) return null;
    const eName = ctx.params[1];
    const p = parentOf(ctx.vars);
    const np = parentOf(ctx.next.vars);
    const e = edgeOf(ctx.next.vars);
    if (!p || !np || np.length !== p.length || !e || !(eName in ctx.next.vars) || same(e, edgeOf(ctx.vars))) return null;
    if (np.some((x) => x < 0 || x >= np.length)) return null;
    const merged = circles(np) < circles(p) || leaderOf(np, e[0]) !== leaderOf(np, e[1]);
    if (merged && circles(p) < p.length - 1) return null;
    return {
      question: `Next edge: ${e[0]}–${e[1]}. Does it merge two circles of friends?`,
      options: ['Yes: two circles become one', 'No: they are already in one circle'],
      answer: merged ? 0 : 1,
      explain: merged ? `${e[0]} and ${e[1]} follow different leaders, so the edge joins their circles and the count drops by one.` : `${e[0]} and ${e[1]} already follow the same leader: the edge closes a loop and the count stays.`,
    };
  },
  bugs: [
    {
      label: 'Count every edge as a merge',
      find: '    if (ra === rb) continue;           // already connected\n',
      replace: '',
      explain: 'An edge inside one circle is counted as a merge too, so a triangle loses one circle too many (n − edges.length).',
    },
    {
      label: 'Start the count at 0',
      find: 'let components = n;',
      replace: 'let components = 0;',
      explain: 'Every node is a circle of its own before any edge: starting from 0 forgets them, so the count comes out n too low.',
    },
  ],
};
