// Scene: IPO. A wallet that unlocks projects: capital is a threshold, never spent. Projects sorted by the capital
// they need unlock as the wallet grows; their profits wait in a max-heap, and each round takes the top one.
// Reads w (the wallet, a parameter) and a heap of profits (toolkit MaxHeap / PriorityQueue or a heap-named array).
const HEAPISH = /heap|^pq$|avail|^h$|prio|^q$|queue|ready|open|cand/i;

/** [name, profits] of the waiting room: a toolkit heap of numbers, or a heap-named plain array of numbers */
function heapOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const arr = Array.isArray(v?.$obj?.heap) ? v.$obj.heap : Array.isArray(v) && HEAPISH.test(k) ? v : null;
    if (arr && arr.every((x) => typeof x === 'number')) return [k, arr];
  }
  return [null, null];
}
function minus(a, b) {
  const left = [...b];
  return a.filter((x) => {
    const i = left.indexOf(x);
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}

export default {
  id: 'ipo',
  metaphor: 'A wallet that unlocks projects',
  caption: 'Projects need a minimum capital to start but do not cost it. Every project the wallet can reach drops its profit into the max-heap; each round the most profitable one on top is done and its profit joins the wallet.',
  narrate(ctx) {
    const [kName, wName] = ctx.params;
    const w = ctx.vars[wName];
    const [hName, heap] = heapOf(ctx.vars, ctx.params);
    const [pName, was] = heapOf(ctx.prev, ctx.params);
    if (ctx.ret && Number.isFinite(w)) return `the wallet ends at ${w}`;
    if (Number.isFinite(w) && wName in ctx.prev && w !== ctx.prev[wName]) {
      return `project done: +${w - ctx.prev[wName]} profit, the wallet grows from ${ctx.prev[wName]} to ${w}`;
    }
    if (!hName || hName !== pName) return null;
    const added = minus(heap, was);
    const gone = minus(was, heap);
    if (added.length === 1 && !gone.length) return `a project needing ≤ ${w} is now within reach: profit ${added[0]} waits in the heap (${heap.length} waiting)`;
    if (gone.length === 1 && !added.length) return `the most profitable reachable project is picked: profit ${gone[0]}`;
    return null;
  },
  predict(ctx) {
    const [, wName] = ctx.params;
    const w = ctx.vars[wName];
    const nw = ctx.next.vars[wName];
    const [hName, heap] = heapOf(ctx.vars, ctx.params);
    if (!hName || !Number.isFinite(w)) return null;
    const [nName, after] = heapOf(ctx.next.vars, ctx.params);
    // the wallet is about to grow: by which project?
    if (Number.isFinite(nw) && nw > w && nName === hName) {
      const gone = minus(heap, after);
      if (gone.length !== 1 || gone[0] !== nw - w) return null;
      const opts = [...new Set([gone[0], ...heap])].slice(0, 4).sort((a, b) => a - b);
      if (opts.length < 2) return null;
      return {
        question: `Wallet ${w}. Reachable profits waiting: [${heap.join(', ')}]. Which project is done this round?`,
        options: opts.map((p) => `profit ${p}`),
        answer: opts.indexOf(gone[0]),
        explain: `Greedy: the biggest profit, ${gone[0]}, grows the wallet most, and a bigger wallet can only unlock more projects.`,
      };
    }
    // the wallet just grew: what comes next?
    if (wName in ctx.prev && Number.isFinite(ctx.prev[wName]) && w > ctx.prev[wName]) {
      const grew = nName === hName && after.length === heap.length + 1 && nw === w;
      const took = Number.isFinite(nw) && nw > w;
      const what = ctx.next.ret ? 2 : grew ? 0 : took ? 1 : -1;
      if (what < 0) return null;
      const [kName] = ctx.params;
      return {
        question: `The wallet now holds ${w} and ${heap.length} reachable ${heap.length === 1 ? 'profit waits' : 'profits wait'}. What happens next?`,
        options: [`A new project comes within reach of ${w}`, 'Do the best project already waiting', 'Stop: return the wallet'],
        answer: what,
        explain: [
          `The cheapest locked project needs no more than ${w}, so the bigger wallet unlocks it before the next pick.`,
          `No locked project needs ${w} or less yet, so the round picks from the profits already waiting.`,
          `The run is over: all ${kName} rounds are used, or nothing is left to do.`,
        ][what],
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Spend the capital',
      find: 'avail.push(projects[i++][1])',
      replace: 'avail.push(projects[i][1] - projects[i++][0])',
      explain: 'Capital is only a threshold, but this version pays it out of each profit, so the wallet grows by less than it should.',
    },
    {
      label: 'Capital must be strictly below w',
      find: 'projects[i][0] <= w',
      replace: 'projects[i][0] < w',
      explain: 'A project that needs exactly the money in the wallet is affordable, but < leaves it locked.',
    },
  ],
};
