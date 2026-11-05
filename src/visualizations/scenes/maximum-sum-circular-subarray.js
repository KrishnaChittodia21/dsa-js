// Maximum Sum Circular Subarray. The numbers sit around a round table. Two streaks run side by side: the best
// stretch (Kadane) and the worst stretch. A stretch that wraps past the end is the whole table minus one worst
// stretch in the middle, so the answer is max(best, total − worst), unless every number is negative.
// Works with names like curMax / maxSub / curMin / minSub / total; other shapes fall back to the generic note.

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const num = (v) => typeof v === 'number';
const plus = (a, b) => (b < 0 ? `${a} − ${-b}` : `${a} + ${b}`);
const pick = (vars, re) => Object.keys(vars).find((k) => re.test(k) && num(vars[k]));
const ELEM = ['x', 'num', 'n', 'val', 'v', 'value', 'a'];
const IDX = ['i', 'j', 'k', 'idx', 'index'];

function names(vars) {
  return {
    total: pick(vars, /^(total|totalSum|sum|whole|all)$/i),
    curMax: pick(vars, /^(cur|curr|current)_?(max|best|hi|high)|^max_?ending|^maxHere$|^localMax$/i),
    maxSub: pick(vars, /^(max|best)_?(sub|sum|so_?far|kadane|straight)?$|^globalMax$|^maxSubarray$/i),
    curMin: pick(vars, /^(cur|curr|current)_?(min|worst|lo|low)|^min_?ending|^minHere$|^localMin$/i),
    minSub: pick(vars, /^(min|worst)_?(sub|sum|so_?far)?$|^globalMin$|^minSubarray$/i),
  };
}
/** the number being added this round: a for-of element, else nums[i] */
function elemOf(vars, arr) {
  const e = ELEM.find((k) => fin(vars[k]) && !(k === 'n' && Array.isArray(arr) && vars[k] === arr.length));
  if (e) return vars[e];
  const i = IDX.find((k) => Number.isInteger(vars[k]));
  return i && Array.isArray(arr) && fin(arr[vars[i]]) ? arr[vars[i]] : undefined;
}
const fmt = (v) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : String(v));

/** extend / restart note for a running streak (kind: 'best' or 'worst') */
function streakNote(c, was, v, kind) {
  if (!fin(was) || !fin(v)) return null;
  if (was === 0 && c === v) return `${kind} stretch ending here starts at ${v}`;
  if (c === was + v && c !== v) return `${kind} stretch ending here grows: ${plus(was, v)} = ${c}`;
  if (c === v) return `${kind} stretch ending here starts fresh at ${v}: carrying ${was} would ${kind === 'best' ? 'only lower' : 'only raise'} it`;
  return null;
}

export default {
  id: 'maximum-sum-circular-subarray',
  metaphor: 'A round table: cut out the worst stretch',
  caption: 'Two streaks run side by side: the best stretch and the worst stretch. A stretch that wraps past the end is the whole table minus the worst stretch in the middle: total − worst.',
  compare: 'maxSub',
  narrate(ctx) {
    const N = names(ctx.vars);
    const arr = ctx.vars[ctx.params[0]];
    const v = elemOf(ctx.vars, arr);
    const changed = (k) => k && ctx.vars[k] !== ctx.prev[k] && k in ctx.prev;
    if (changed(N.total) && fin(v)) return `take ${v} from the table: the whole table so far adds up to ${N.total} = ${ctx.vars[N.total]}`;
    if (changed(N.curMax)) return streakNote(ctx.vars[N.curMax], ctx.prev[N.curMax], v, 'best');
    if (changed(N.curMin)) return streakNote(ctx.vars[N.curMin], ctx.prev[N.curMin], v, 'worst');
    if (changed(N.maxSub)) return `new best stretch: ${N.maxSub} = ${ctx.vars[N.maxSub]} (was ${fmt(ctx.prev[N.maxSub])})`;
    if (changed(N.minSub)) return `new worst stretch: ${N.minSub} = ${ctx.vars[N.minSub]} (the part a wrapped stretch would leave out)`;
    const line = ctx.lines[ctx.line - 1] || '';
    const [t, mx, mn] = [ctx.vars[N.total], ctx.vars[N.maxSub], ctx.vars[N.minSub]];
    if (/\breturn\b/.test(line) && fin(t) && fin(mx) && fin(mn)) {
      if (mx < 0) return `every number is negative (best stretch ${mx}): wrapping would keep an empty stretch, so the answer is ${mx}`;
      if (!line.includes(N.minSub)) return `not every number is negative (best stretch ${mx} ≥ 0), so a wrapped stretch is allowed`;
      const wrap = t - mn;
      return `straight: ${mx} · wrapped: total ${t} − worst (${mn}) = ${wrap} → ${wrap > mx ? 'wrapping wins' : wrap === mx ? 'a tie' : 'the straight stretch wins'}`;
    }
    return null;
  },
  // before a running streak changes: grow it or start fresh?
  predict(ctx) {
    if (!ctx.next) return null;
    const N = names(ctx.vars);
    const v = elemOf(ctx.next.vars, ctx.next.vars[ctx.params[0]]);
    if (!fin(v)) return null;
    for (const [k, kind] of [[N.curMax, 'best'], [N.curMin, 'worst']]) {
      if (!k || !fin(ctx.vars[k]) || !num(ctx.next.vars[k])) continue;
      const c = ctx.vars[k];
      const after = ctx.next.vars[k];
      if (after === c || c + v === v) continue; // unchanged, or c = 0: both choices give the same sum
      const grow = `Grow: ${plus(c, v)} = ${c + v}`;
      const fresh = `Start fresh at ${v}`;
      if (after !== c + v && after !== v) return null;
      const isGrow = after === c + v;
      return {
        question: `The ${kind} stretch ending here is ${k} = ${c}; the next number is ${v}. What does it become?`,
        options: [grow, fresh],
        answer: isGrow ? 0 : 1,
        explain: kind === 'best'
          ? (isGrow ? `${c} ≥ 0, so carrying it helps: ${c + v} ≥ ${v}.` : `${c} < 0 would only pull ${v} down, so ${v} alone is bigger.`)
          : (isGrow ? `${c} ≤ 0, so carrying it makes the stretch even worse: ${c + v} ≤ ${v}.` : `${c} > 0 would raise the sum, so ${v} alone is the worse (smaller) stretch.`),
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'No all-negative guard',
      find: 'if (maxSub < 0) return maxSub;',
      replace: '',
      explain: 'When every number is negative the worst stretch is the whole table, so total − worst = 0: the "wrapped" stretch is empty, and [-3, -2, -3] returns 0 instead of -2.',
    },
    {
      label: 'Best stretch starts at 0',
      find: 'maxSub = -Infinity',
      replace: 'maxSub = 0',
      explain: 'A single negative number never beats 0, so [-7] reports a best stretch of 0 and the guard for all-negative tables never fires.',
    },
  ],
};
