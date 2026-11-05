// Scene: K Closest Points to Origin. A shortlist with k chairs: every point sits down, and when one chair too many
// is taken, the point farthest from the origin is sent away. Reads any array of [x, y] pairs (a heap's array
// inside an object, a plain array the learner keeps) and diffs it between steps.
const isPt = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const d2 = ([x, y]) => x * x + y * y;
const show = (p) => `(${p[0]}, ${p[1]})`;

/** [name, points] of the first kept list: a non-parameter array of points, or one held in an object's field */
function keptOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const arr = Array.isArray(v) ? v : v?.$obj ? Object.values(v.$obj).find((x) => Array.isArray(x) && x.every(isPt)) : null;
    if (Array.isArray(arr) && arr.every(isPt)) return [k, arr];
  }
  return [null, null];
}
/** points in `a` that are not in `b` (as a multiset) */
function minus(a, b) {
  const left = b.map(String);
  return a.filter((p) => {
    const i = left.indexOf(String(p));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}

export default {
  id: 'k-closest-points-to-origin',
  metaphor: 'A shortlist with only k chairs',
  caption: 'Each point is scored by its squared distance x² + y². The shortlist keeps at most k points; when an extra one sits down, the farthest point on the list is sent away, so the k closest survive.',
  narrate(ctx) {
    const [, k] = ctx.params;
    const [name, now] = keptOf(ctx.vars, ctx.params);
    const [pname, before] = keptOf(ctx.prev, ctx.params);
    if (!name || name !== pname) return null;
    const added = minus(now, before);
    const gone = minus(before, now);
    const cap = Number.isInteger(ctx.vars[k]) ? ctx.vars[k] : null;
    if (added.length === 1 && !gone.length) {
      const over = cap !== null && now.length > cap ? `: ${now.length} on a list of ${cap}, one must go` : '';
      return `${show(added[0])} sits down, distance² ${d2(added[0])}${over}`;
    }
    if (gone.length === 1 && !added.length) return `${show(gone[0])} (distance² ${d2(gone[0])}) is the farthest on the list and is sent away`;
    return null;
  },
  // just before a point leaves the shortlist: which one?
  predict(ctx) {
    if (!ctx.next) return null;
    const [name, now] = keptOf(ctx.vars, ctx.params);
    const [nname, after] = keptOf(ctx.next.vars, ctx.params);
    if (!name || name !== nname) return null;
    const gone = minus(now, after);
    if (gone.length !== 1 || minus(after, now).length) return null;
    const opts = [...new Set([String(gone[0]), ...now.map(String)])].slice(0, 4);
    if (opts.length < 2) return null;
    opts.sort();
    return {
      question: `The shortlist holds ${now.length} points, one too many. Which point is sent away?`,
      options: opts.map((s) => show(s.split(',').map(Number))),
      answer: opts.indexOf(String(gone[0])),
      explain: `${show(gone[0])} has the largest distance² on the list (${d2(gone[0])}), so it cannot be one of the k closest.`,
    };
  },
  bugs: [
    {
      label: 'Min-heap: evicts the closest point',
      find: 'new MaxHeap(dist)',
      replace: 'new MinHeap(dist)',
      explain: 'A min-heap puts the closest point on top, so each pop throws away the best candidate and the farthest ones are kept.',
    },
    {
      label: 'Pop at size k: one point short',
      find: 'heap.size() > k',
      replace: 'heap.size() >= k',
      explain: 'The list is trimmed as soon as it holds k points, so only k − 1 are left at the end.',
    },
  ],
};
