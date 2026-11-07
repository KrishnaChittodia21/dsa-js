// The Skyline Problem: a pen tracing the city's outline left to right. The outline can change only at a building
// edge; at each edge the pen sits on the tallest building still standing, and a key point is drawn when that height changes.
// Reads the standing heights from a heap object ({ $obj: { heap: [...] } }) or a plain array of heights.
const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger);
const pairs = (v) => (Array.isArray(v) && v.every(isPair) ? v : null);
const ints = (v) => (Array.isArray(v) && v.every(Number.isInteger) ? v : null);
const show = (p) => `[${p[0]}, ${p[1]}]`;

const OUT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'skyline', 'keyPoints', 'sky'];
const EVENTS = ['events', 'edges', 'points', 'ev', 'evts', 'pts', 'lines'];
const ACTIVE = ['heap', 'pq', 'maxHeap', 'heights', 'active', 'live', 'standing', 'h', 'q'];
const CUR = ['cur', 'curr', 'current', 'curH', 'maxH', 'maxHeight', 'tallest', 'height', 'best', 'now'];
const X = ['x', 'pos', 'px'];

const outOf = (vars) => OUT.map((k) => (k in (vars || {}) ? pairs(vars[k]) : null)).find(Boolean) || null;
const xOf = (vars) => X.map((k) => vars?.[k]).find(Number.isInteger);
const curOf = (vars) => CUR.find((k) => Number.isInteger(vars?.[k]));

/** the standing heights: a heap object's array field, or a plain array of numbers */
function activeOf(vars) {
  for (const k of ACTIVE) {
    const v = vars?.[k];
    const arr = ints(v) || (v?.$obj ? Object.values(v.$obj).find(ints) : null);
    if (arr) return [k, arr];
  }
  return [null, null];
}
const desc = (a) => [...a].sort((p, q) => q - p).join(', ');

/** the events list just sorted (or null) */
function sortedEvents(ctx) {
  for (const k of EVENTS) {
    const now = pairs(ctx.vars[k]);
    const was = pairs(ctx.prev[k]);
    if (!now || !was || now.length < 2 || now.length !== was.length || String(now) === String(was)) continue;
    if (now.every((p, i) => i === 0 || now[i - 1][0] <= p[0])) return now;
  }
  return null;
}

export default {
  id: 'the-skyline-problem',
  metaphor: 'A pen tracing the city outline',
  caption: 'Every building edge is an event, swept from left to right. The heap holds the heights still standing; at each edge the pen sits on the tallest one, and a key point is drawn only when that height changes.',
  narrate(ctx) {
    if (sortedEvents(ctx)) return 'edges sorted by x; at the same x starts (−h) come first, taller starts first, shorter ends first';
    for (const k of EVENTS) {
      const now = pairs(ctx.vars[k]);
      const was = pairs(ctx.prev[k]);
      if (!now || !was || now.length !== was.length + 1) continue;
      const [ex, ev] = now[now.length - 1];
      return ev < 0 ? `a building of height ${-ev} starts at x = ${ex}: start edge [${ex}, ${ev}] (negative = start)` : `its end edge [${ex}, ${ev}]: at x = ${ex} height ${ev} goes away`;
    }
    const out = outOf(ctx.vars);
    const before = outOf(ctx.prev);
    if (out && before && out.length === before.length + 1) {
      const p = out[out.length - 1];
      const was = before.length ? before[before.length - 1][1] : 0;
      return p[1] > was ? `key point ${show(p)}: the outline jumps up from ${was} to ${p[1]} at x = ${p[0]}` : `key point ${show(p)}: the outline drops from ${was} to ${p[1]} at x = ${p[0]}`;
    }
    const [an, act] = activeOf(ctx.vars);
    const [pn, was] = activeOf(ctx.prev);
    const x = xOf(ctx.vars);
    if (an && an === pn && x !== undefined) {
      if (act.length === was.length + 1) {
        const h = act.find((v) => act.filter((y) => y === v).length > was.filter((y) => y === v).length);
        return `x = ${x}: a building of height ${h} starts; standing heights: ${desc(act)}`;
      }
      if (act.length === was.length - 1) {
        const gone = was.find((v) => was.filter((y) => y === v).length > act.filter((y) => y === v).length);
        if (gone === Math.max(...was) && !act.includes(gone)) return `x = ${x}: height ${gone} is on top but its building has ended, so it is popped; standing: ${desc(act) || 'none'}`;
        return `x = ${x}: a building of height ${gone} ends and leaves; standing: ${desc(act) || 'none'}`;
      }
    }
    // lazy deletion: a removal counter for a height goes up
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (!v?.$map || !ctx.prev[k]?.$map || x === undefined) continue;
      const old = new Map(ctx.prev[k].$map);
      const up = v.$map.find(([h, c]) => Number.isInteger(c) && c > (old.get(h) ?? 0));
      if (up) return `x = ${x}: the building of height ${up[0]} ends; it is marked for removal and leaves the heap once it reaches the top`;
    }
    const cn = curOf(ctx.vars);
    if (cn && x !== undefined && (ctx.vars[cn] !== ctx.prev[cn] || x !== xOf(ctx.prev))) return `x = ${x}: the tallest building still standing is ${ctx.vars[cn]}`;
    return null;
  },
  // the pen has just read the tallest height at an edge: is a key point drawn here?
  predict(ctx) {
    if (!ctx.next) return null;
    const cn = curOf(ctx.vars);
    const x = xOf(ctx.vars);
    const out = outOf(ctx.vars);
    if (!cn || x === undefined || !out) return null;
    const cur = ctx.vars[cn];
    // one question per edge x, and none once a point has been drawn at this x
    if (out.length && out[out.length - 1][0] === x) return null;
    const after = outOf(ctx.next.vars);
    const nx = xOf(ctx.next.vars);
    let ans;
    if (after && after.length === out.length + 1) ans = 0;
    else if (after && after.length === out.length && (ctx.next.ret || (nx !== undefined && nx !== x))) ans = 1;
    else return null;
    const was = out.length ? out[out.length - 1][1] : 0;
    const p = ans === 0 ? after[after.length - 1] : [x, cur];
    return {
      question: `At x = ${x} the tallest standing building is ${cur}; the outline is at height ${was}. Is a key point drawn?`,
      options: [`Yes: ${show(p)}`, `No: the outline stays at ${was}`],
      answer: ans,
      explain: ans === 0 ? (p[1] !== was ? `The height changes from ${was} to ${p[1]}, so the outline turns a corner at x = ${x}.` : `Their code draws ${show(p)} even though the height stays ${was}.`) : cur === was ? `The tallest height is still ${was}, so the outline runs straight on: no corner here.` : `Their code draws no point here, although the height changed to ${cur}.`,
    };
  },
  bugs: [
    {
      label: 'Ends before starts at the same x',
      find: 'a[0] - b[0] || a[1] - b[1]',
      replace: 'a[0] - b[0] || b[1] - a[1]',
      explain: 'Where one roof ends and an equal one starts (x = 2 in [[0,2,3],[2,5,3]]), the end goes first, the outline dips to 0 and back: bogus points [2,0], [2,3].',
    },
    {
      label: 'Draw a point at every edge',
      find: 'if (cur !== prev)',
      replace: 'if (true)',
      explain: 'A building hidden behind a taller one still adds a point with the same height, so the skyline has consecutive points at equal height.',
    },
  ],
};
