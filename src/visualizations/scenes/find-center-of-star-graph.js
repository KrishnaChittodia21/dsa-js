// Find Center of Star Graph: every spoke of a wheel touches the hub, so the hub is the one vertex the first two
// spokes share. Works with the two-edge comparison and with a degree count (array or Map / object).
import { entriesOf, options, row } from './util.js';

const edgesOf = (ctx) => (Array.isArray(ctx.input?.[0]) && ctx.input[0].length >= 2 && ctx.input[0].every((e) => row(e) && e.length === 2) ? ctx.input[0] : null);

/** [vertex, count] whose degree count just went up (degree array or Map / object counter) */
function bumped(ctx) {
  for (const [k, v] of Object.entries(ctx.vars)) {
    if (ctx.params.includes(k) || !(k in ctx.prev)) continue;
    const p = ctx.prev[k];
    if (row(v) && row(p) && v.length === p.length) {
      const i = v.findIndex((x, j) => typeof x === 'number' && x === p[j] + 1);
      if (i >= 0) return [i, v[i]];
    }
    const now = entriesOf(v);
    const was = entriesOf(p);
    if (now && was) {
      const old = new Map(was.map(([a, b]) => [String(a), b]));
      const hit = now.find(([a, b]) => typeof b === 'number' && b === (old.get(String(a)) ?? 0) + 1);
      if (hit) return [hit[0], hit[1]];
    }
  }
  return null;
}

export default {
  id: 'find-center-of-star-graph',
  metaphor: 'Spokes of a wheel meet at the hub',
  caption: 'Every edge is a spoke from the hub to one rim vertex. Two spokes share exactly one vertex, so the first two edges are enough to name the hub.',
  narrate(ctx) {
    const edges = edgesOf(ctx);
    if (!edges) return null;
    const [[a, b], [c, d]] = edges;
    if (ctx.ret && typeof ctx.value === 'number') {
      const v = ctx.value;
      const inBoth = [a, b].includes(v) && [c, d].includes(v);
      return inBoth ? `${v} sits on both spokes (${a}–${b} and ${c}–${d}): ${v} is the hub` : `the answer is ${v}`;
    }
    const hit = bumped(ctx);
    if (hit) return `vertex ${hit[0]} now touches ${hit[1]} spoke${hit[1] > 1 ? 's' : ''}${hit[1] === edges.length ? ': every spoke, so it is the hub' : ''}`;
    // the two-edge solution unpacks edges[0] and edges[1]
    const vals = Object.entries(ctx.vars).filter(([k]) => !(k in ctx.prev) && !ctx.params.includes(k)).map(([, v]) => v);
    if (vals.length === 2 && vals[0] === a && vals[1] === b) return `spoke 1 joins ${a} and ${b}: the hub is one of these two`;
    if (vals.length === 2 && vals[0] === c && vals[1] === d) return `spoke 2 joins ${c} and ${d}: the hub must be on this spoke too`;
    return null;
  },
  // right before the final answer is returned: which vertex is the hub?
  predict(ctx) {
    const edges = edgesOf(ctx);
    const nx = ctx.next;
    if (!edges || !nx?.ret || typeof nx.value !== 'number' || nx.value !== ctx.result) return null;
    const [[a, b], [c, d]] = edges;
    const v = ctx.result;
    return options(
      `Spoke 1 is ${a}–${b} and spoke 2 is ${c}–${d}. Which vertex is the hub?`,
      v,
      [a, b, c, d].filter((x) => x !== v),
      [a, b].includes(v) && [c, d].includes(v)
        ? `${v} is the only vertex on both spokes; a rim vertex sits on just one spoke.`
        : `Your run returns ${v}, but the hub must be on both spokes ${a}–${b} and ${c}–${d}.`,
    );
  },
  maxPredicts: 1,
  bugs: [
    {
      label: 'Hub is always edges[0][0]',
      find: 'a === c || a === d ? a : b',
      replace: 'a',
      explain: 'The hub can be either end of the first spoke: in [[1,2],[2,3],[4,2]] the first end is 1, a rim vertex.',
    },
    {
      label: 'Compare with one end of spoke 2 only',
      find: 'a === c || a === d',
      replace: 'a === c',
      explain: 'The hub can be the second end of spoke 2 too: in [[5,2],[1,5],…] 5 matches d, not c, so 2 is returned by mistake.',
    },
  ],
};
