// Scene: Smallest Range Covering Elements from K Lists. One pin stands in every list; the band stretches from the
// lowest pin (the heap's top) to the highest (the running max). Only moving the lowest pin forward can shrink the
// band, and once a list has no next number the search stops. Reads the heap of [value, list, index] entries
// (itemsOf), a max-like number and a best [a, b] pair.
import { itemsOf, options } from './util.js';

const MAX = ['curMax', 'currMax', 'maxVal', 'mx', 'max', 'hi', 'high', 'right', 'maxNum', 'curmax', 'currentMax'];
const BEST = ['best', 'ans', 'res', 'result', 'range', 'answer', 'bestRange'];

const entry = (e) => Array.isArray(e) && e.length >= 2 && e.every((x) => typeof x === 'number');
function heapOf(ctx, vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (ctx.params.includes(k) || Array.isArray(v)) continue;
    const it = itemsOf(v);
    if (Array.isArray(it) && it.every(entry)) return [k, it];
  }
  return null;
}
const maxOf = (vars) => MAX.find((k) => typeof vars?.[k] === 'number');
const bestOf = (vars) => BEST.find((k) => Array.isArray(vars?.[k]) && vars[k].length === 2 && vars[k].every((x) => typeof x === 'number'));
const key = (e) => e.join(',');
function minus(a, b) {
  const left = b.map(key);
  return a.filter((x) => {
    const i = left.indexOf(key(x));
    if (i < 0) return true;
    left.splice(i, 1);
    return false;
  });
}
const pins = (items) => [...items].sort((a, b) => a[0] - b[0]).map((e) => `${e[0]} (list ${e[1]})`).join(', ');

export default {
  id: 'smallest-range-covering-elements-from-k-lists',
  metaphor: 'One pin per list, shrink the band',
  caption: 'Each heap entry is [value, list, position]: a pin standing in one list. The band runs from the lowest pin (heap top) to the highest; moving the lowest pin forward is the only way it can get narrower.',
  narrate(ctx) {
    if (ctx.ret && Array.isArray(ctx.value)) return `a list has run out, so no band can cover every list any more: the narrowest was [${ctx.value.join(', ')}]`;
    const bName = bestOf(ctx.vars);
    if (bName && bestOf(ctx.prev) === bName && key(ctx.vars[bName]) !== key(ctx.prev[bName])) {
      const [a, b] = ctx.vars[bName];
      const [pa, pb] = ctx.prev[bName];
      return `band [${a}, ${b}] (width ${b - a}) beats the best so far [${pa}, ${pb}] (width ${pb - pa}): new best`;
    }
    if (bName && !bestOf(ctx.prev)) {
      const fh = heapOf(ctx, ctx.vars);
      const [a, b] = ctx.vars[bName];
      const real = fh && fh[1].length && a === Math.min(...fh[1].map((e) => e[0]));
      return real ? `first band: [${a}, ${b}], one pin in every list` : `the best starts as a stand-in [${a}, ${b}] that any real band beats`;
    }
    const h = heapOf(ctx, ctx.vars);
    const ph = heapOf(ctx, ctx.prev);
    const mName = maxOf(ctx.vars);
    if (h && ph && h[0] === ph[0]) {
      const gone = minus(ph[1], h[1]);
      const added = minus(h[1], ph[1]);
      const mx = mName ? ctx.vars[mName] : undefined;
      if (gone.length === 1 && !added.length && Number.isFinite(mx))
        return `the lowest pin, ${gone[0][0]} (list ${gone[0][1]}), is lifted: the band was [${gone[0][0]}, ${mx}], width ${mx - gone[0][0]}`;
      if (gone.length === 1 && !added.length) return `the lowest pin, ${gone[0][0]} (list ${gone[0][1]}), is lifted`;
      if (added.length === 1 && !gone.length) {
        const [v, li] = added[0];
        return !bestOf(ctx.vars) ? `list ${li} puts its first pin at ${v}` : `list ${li}'s pin moves forward to ${v}`;
      }
    }
    if (mName && maxOf(ctx.prev) === mName && ctx.vars[mName] !== ctx.prev[mName] && Number.isFinite(ctx.vars[mName]) && h && h[1].length) {
      const lo = Math.min(...h[1].map((e) => e[0]));
      return bName ? `${ctx.vars[mName]} is the highest pin now: the band is [${lo}, ${ctx.vars[mName]}]` : `${ctx.vars[mName]} is the highest first pin so far`;
    }
    if (mName && h && h[1].length && ctx.vars[mName] === ctx.prev[mName] && Number.isFinite(ctx.vars[mName]) && new RegExp(`\\b${mName}\\s*=`).test(ctx.src || '')) {
      const lo = Math.min(...h[1].map((e) => e[0]));
      return bName ? `the new pin is not higher than ${ctx.vars[mName]}, so the band is [${lo}, ${ctx.vars[mName]}]` : `the new pin is not higher: the highest first pin stays ${ctx.vars[mName]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const h = heapOf(ctx, ctx.vars);
    const nh = heapOf(ctx, ctx.next.vars);
    const bName = bestOf(ctx.vars);
    // the first band is set: which pin is lifted first?
    if (h && nh && h[0] === nh[0] && bName && !bestOf(ctx.prev) && h[1].length > 1) {
      const gone = minus(h[1], nh[1]);
      if (gone.length !== 1 || minus(nh[1], h[1]).length) return null;
      const wrong = h[1].map((e) => e[0]).filter((v) => v !== gone[0][0]);
      return options(`Pins: ${pins(h[1])}. Which pin moves forward first?`, gone[0][0], wrong, `${gone[0][0]} is the lowest pin: raising the highest would only widen the band, so the lowest must move.`);
    }
    // a pin was just lifted: is [its value, max] narrower than the best?
    const ph = heapOf(ctx, ctx.prev);
    const mName = maxOf(ctx.vars);
    if (!h || !ph || h[0] !== ph[0] || !bName || bestOf(ctx.next.vars) !== bName || !mName) return null;
    const gone = minus(ph[1], h[1]);
    if (gone.length !== 1 || minus(h[1], ph[1]).length) return null;
    const lo = gone[0][0];
    const mx = ctx.vars[mName];
    if (!Number.isFinite(mx)) return null;
    const [a, b] = ctx.vars[bName];
    const nb = ctx.next.vars[bName];
    const changed = key(nb) !== key(ctx.vars[bName]);
    // "no" only when the next step clearly moved on (heap, a new variable, or the return)
    const movedOn = ctx.next.ret || nh?.[1].length !== h[1].length || Object.keys(ctx.next.vars).some((k) => !(k in ctx.vars));
    if ((!changed && !movedOn) || key([lo, mx]) === key([a, b]) || mx - lo > b - a) return null;
    if (changed && key(nb) !== key([lo, mx])) return null;
    return {
      question: `The band is [${lo}, ${mx}] (width ${mx - lo}); the best so far is [${a}, ${b}] (width ${b - a}). Does it become the new best?`,
      options: ['Yes', 'No'],
      answer: changed ? 0 : 1,
      explain: changed ? `Width ${mx - lo} is narrower than ${b - a}, so [${lo}, ${mx}] is kept.` : mx - lo === b - a ? `Same width, and the older band starts lower, so the best stays [${a}, ${b}].` : `Width ${mx - lo} is not narrower than ${b - a}.`,
    };
  },
  bugs: [
    {
      label: '<= : ties replace the best',
      find: 'if (curMax - minVal < best[1] - best[0])',
      replace: 'if (curMax - minVal <= best[1] - best[0])',
      explain: 'A later band of the same width replaces the best, but it starts higher: for [[1, 4], [2, 5]] the answer becomes [4, 5] instead of [1, 2].',
    },
    {
      label: 'Never raise the max',
      find: 'curMax = Math.max(curMax, next);',
      replace: '',
      explain: 'The highest pin is never updated after the start, so the band looks narrower than it really is and the reported range misses some lists.',
    },
  ],
};
