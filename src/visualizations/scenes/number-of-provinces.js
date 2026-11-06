// Number of Provinces (union-find or DFS). Every city starts as its own province; each "1" in the matrix is a road,
// and a road between two different provinces merges them. Reads a union-find parent row (parent / par / fa… or a
// toolkit UnionFind object) and the pair being looked at (i / j…); DFS versions are told through visited + a counter.
import { firstInt, groupsOf, leaderOf, row, visitedSet, parentOf } from './util.js';

const COUNT = ['count', 'provinces', 'ans', 'res', 'result', 'components', 'comps', 'cnt', 'groups', 'circles'];

/** the union-find parent row, plain or inside a class instance */
const nGroups = (p) => groupsOf(p).length;
/** the two cities being compared */
function pairOf(vars) {
  for (const [a, b] of [['i', 'j'], ['a', 'b'], ['u', 'v'], ['x', 'y'], ['r', 'c'], ['row', 'col']]) {
    if (Number.isInteger(vars[a]) && Number.isInteger(vars[b])) return [vars[a], vars[b]];
  }
  return null;
}
const linked = (m, i, j) => Array.isArray(m) && Array.isArray(m[i]) && m[i][j] === 1;
const plural = (k) => `${k} province${k === 1 ? '' : 's'}`;

export default {
  id: 'number-of-provinces',
  metaphor: 'Cities merging into provinces',
  caption: 'Each tree in the forest is a province, its root the capital. Every road (a 1 in the matrix) between two different provinces merges them; a road inside one province changes nothing.',
  narrate(ctx) {
    const mName = ctx.params[0];
    const m = ctx.vars[mName];
    if (ctx.ret && Number.isInteger(ctx.value)) return `every road has been looked at: the cities form ${plural(ctx.value)}`;
    const p = parentOf(ctx.vars, ctx.params);
    const pp = parentOf(ctx.prev, ctx.params);
    if (p) {
      if (!pp || pp.length !== p.length) return nGroups(p) === p.length ? `${p.length} cities, each its own province: a road between two provinces merges them` : null;
      const pair = pairOf(ctx.vars);
      const before = nGroups(pp);
      const now = nGroups(p);
      if (now < before && pair) {
        const [i, j] = pair;
        const size = (x) => groupsOf(pp).find((g) => g.includes(x))?.length || 0;
        const what = size(j) === 1 ? `city ${j} joins city ${i}'s province` : size(i) === 1 ? `city ${i} joins city ${j}'s province` : `the provinces of city ${i} and city ${j} merge`;
        return `a road links cities ${i} and ${j}: ${what} (${plural(now)} left)`;
      }
      if (now < before) return `two provinces merge (${plural(now)} left)`;
      const pPrev = pairOf(ctx.prev);
      if (pair && now === before && (!pPrev || pPrev.join() !== pair.join()) && pair[0] !== pair[1] && linked(m, pair[0], pair[1]) && leaderOf(p, pair[0]) === leaderOf(p, pair[1]) && /union|unite|join|merge/i.test(ctx.src)) {
        return `cities ${pair[0]} and ${pair[1]} are linked, but already in one province: nothing changes`;
      }
      if (pair && now === before && pPrev && pPrev.join() !== pair.join() && pair[0] !== pair[1] && Array.isArray(m?.[pair[0]]) && m[pair[0]][pair[1]] === 0) return `no road between city ${pair[0]} and city ${pair[1]}`;
      return null;
    }
    // DFS / BFS: visited cities and a province counter
    const now = visitedSet(ctx.vars);
    const fresh = [...now].filter((x) => !visitedSet(ctx.prev).has(x));
    const [cName, cnt] = firstInt(ctx.vars, COUNT.filter((k) => !ctx.params.includes(k)));
    if (cName && Number.isInteger(ctx.prev[cName]) && cnt === ctx.prev[cName] + 1) return `no more unvisited cities can be reached: province #${cnt} is complete`;
    if (fresh.length) return `city ${fresh.join(', ')} ${fresh.length > 1 ? 'are' : 'is'} visited: ${fresh.length > 1 ? 'they join' : 'it joins'} the province being explored (${now.size} ${now.size === 1 ? 'city' : 'cities'} seen)`;
    return null;
  },
  // before a road is handled: does it merge two provinces?
  predict(ctx) {
    if (!ctx.next) return null;
    const m = ctx.vars[ctx.params[0]];
    const p = parentOf(ctx.vars, ctx.params);
    const np = parentOf(ctx.next.vars, ctx.params);
    const pair = pairOf(ctx.next.vars);
    if (!p || !np || p.length !== np.length || !pair || pair[0] === pair[1] || !linked(m, pair[0], pair[1])) return null;
    const cur = pairOf(ctx.vars);
    if (cur && cur.join() === pair.join()) return null; // the pair is already on screen: half done
    const merges = nGroups(np) < nGroups(p);
    const [i, j] = pair;
    // verify the "no" case: both cities already share a capital
    if (!merges && leaderOf(np, i) !== leaderOf(np, j)) return null;
    if (merges && nGroups(p) !== p.length) {
      // after the first merge, ask only when the answer is not obvious: both cities already have company
      const alone = (x) => groupsOf(p).find((g) => g.includes(x))?.length === 1;
      if (alone(i) || alone(j)) return null;
    }
    return {
      question: `Cities ${i} and ${j} have a road between them (row ${i}, column ${j} is 1). Does the number of provinces drop?`,
      options: ['Yes: two provinces merge', 'No: they are already one province'],
      answer: merges ? 0 : 1,
      explain: merges ? `${i} and ${j} had different capitals, so the road merges their provinces: one fewer.` : `${i} and ${j} were already joined through other roads (same capital), so this road adds nothing.`,
    };
  },
  bugs: [
    {
      label: 'Stop one city early',
      find: 'j < n; j++',
      replace: 'j < n - 1; j++',
      explain: 'The inner loop never looks at the last column, so roads to the last city are missed and it can stay a province of its own.',
    },
    {
      label: 'Count every road as a merge',
      find: 'uf.union(i, j);',
      replace: 'uf.count--;',
      explain: 'Each 1 lowers the count, even when the two cities are already in one province (a triangle of roads counts 3 merges): the count goes too low.',
    },
  ],
};
