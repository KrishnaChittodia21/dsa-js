// Redundant Connection (union-find). Cables are laid one by one between houses; a cable between two different
// groups joins them, the first cable whose ends are already in one group closes the loop and is the answer.
// Reads a union-find parent row (parent / par / fa… or a toolkit UnionFind object) and the cable (a / b, u / v…).
import { groupsOf, leaderOf, row, parentOf } from './util.js';


/** the union-find parent row, plain or inside a class instance */
/** groups of houses 1..n (the unused slot 0 is left out) */
const groups = (p) => groupsOf(p).filter((g) => !(g.length === 1 && g[0] === 0));
const pairRow = (e) => row(e) && e.length === 2 && e.every(Number.isInteger);
/** the cable being looked at */
function cableOf(vars) {
  for (const k of ['edge', 'e', 'ed', 'conn', 'cable', 'pair']) if (pairRow(vars[k])) return vars[k];
  for (const [a, b] of [['u', 'v'], ['from', 'to'], ['x', 'y'], ['p', 'q'], ['s', 't'], ['a', 'b']]) {
    if (Number.isInteger(vars[a]) && Number.isInteger(vars[b])) return [vars[a], vars[b]];
  }
  return null;
}
const plural = (k) => `${k} group${k === 1 ? '' : 's'}`;

export default {
  id: 'redundant-connection',
  metaphor: 'Laying cables until one closes a loop',
  caption: 'Each tree in the forest is a group of houses already wired together, its root the hub. A cable between two groups joins them; a cable inside one group closes a loop: that one is spare.',
  narrate(ctx) {
    const p = parentOf(ctx.vars, ctx.params);
    const pp = parentOf(ctx.prev, ctx.params);
    const e = cableOf(ctx.vars);
    if (ctx.ret && pairRow(ctx.value)) {
      const [a, b] = ctx.value;
      if (p && leaderOf(p, a) === leaderOf(p, b)) return `${a} and ${b} are already in one group: this edge closes a loop, so it is the answer`;
      return `the run returns cable ${a}–${b}`;
    }
    if (!p) return null;
    const m = ctx.vars[ctx.params[0]];
    if (!pp || pp.length !== p.length) return Array.isArray(m) && p.length >= m.length && groupsOf(p).length === p.length ? `${groups(p).length} houses, none wired yet: each is its own group` : null;
    const before = groups(pp).length;
    const now = groups(p).length;
    if (now < before && e) {
      const [a, b] = e;
      const size = (x) => groups(pp).find((g) => g.includes(x))?.length || 0;
      const what = size(b) === 1 && size(a) === 1 ? `${a} and ${b} form a group` : size(b) === 1 ? `house ${b} joins ${a}'s group` : size(a) === 1 ? `house ${a} joins ${b}'s group` : `the groups of ${a} and ${b} merge`;
      return `cable ${a}–${b} links two different groups: ${what} (${plural(now)} left)`;
    }
    const pe = cableOf(ctx.prev);
    if (e && now === before && (!pe || pe.join() !== e.join()) && leaderOf(p, e[0]) === leaderOf(p, e[1]) && /union|unite|join|merge|find/i.test(ctx.src)) {
      return `${e[0]} and ${e[1]} are already in one group: this edge closes a loop`;
    }
    return null;
  },
  // before a cable is handled, when both ends already have company: join or loop?
  predict(ctx) {
    if (!ctx.next) return null;
    const p = parentOf(ctx.vars, ctx.params);
    const np = parentOf(ctx.next.vars, ctx.params);
    const e = cableOf(ctx.next.vars);
    if (!p || !np || np.length !== p.length || !e) return null;
    const cur = cableOf(ctx.vars);
    const was = cableOf(ctx.prev);
    if ((cur && cur.join() === e.join()) || (was && was.join() === e.join())) return null; // already on screen (or in a helper call)
    const [a, b] = e;
    const alone = (x) => groups(p).find((g) => g.includes(x))?.length === 1;
    if (alone(a) || alone(b)) return null; // a lonely house always joins: not a real question
    const joins = groups(np).length < groups(p).length;
    // only when the next step is the decision itself (a merge, or returning this cable): helper steps hide the cable
    const loop = !joins && ctx.next.ret && pairRow(ctx.next.value) && ctx.next.value.join() === e.join() && leaderOf(np, a) === leaderOf(np, b);
    if (!joins && !loop) return null;
    return {
      question: `Next cable: ${a}–${b}. Both houses are already wired to others. Does it join two groups, or close a loop?`,
      options: ['Joins two groups', 'Closes a loop: it is spare'],
      answer: joins ? 0 : 1,
      explain: joins ? `${a} and ${b} have different hubs, so the cable links their groups.` : `${a} and ${b} already share a hub: they are connected another way, so this cable closes the loop.`,
    };
  },
  bugs: [
    {
      label: 'Return when a union succeeds',
      find: 'if (!uf.union(a, b))',
      replace: 'if (uf.union(a, b))',
      explain: 'The check is flipped: the very first cable (which always joins two lonely houses) is returned instead of the cable that closes the loop.',
    },
  ],
};
