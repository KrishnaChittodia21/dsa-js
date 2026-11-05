// Course Schedule III: a study plan filled in deadline order. Every course is taken; when the plan runs past the
// course's last day, the longest course in the plan is dropped: the count stays, and the most days come back.
// Reads the taken durations from a heap object ({ $obj: { heap: [...] } }) or a plain array.
const isPair = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger);
const ints = (v) => (Array.isArray(v) && v.every(Number.isInteger) ? v : null);

const TAKEN = ['taken', 'heap', 'pq', 'maxHeap', 'chosen', 'picked', 'plan', 'durations', 'h', 'q', 'selected'];
const TIME = ['time', 'total', 'day', 'days', 't', 'cur', 'sum', 'elapsed', 'now', 'used'];
const LAST = ['lastDay', 'last', 'deadline', 'end', 'dl', 'due', 'limit', 'd2'];

function takenOf(vars) {
  for (const k of TAKEN) {
    const v = vars?.[k];
    const arr = ints(v) || (v?.$obj ? Object.values(v.$obj).find(ints) : null);
    if (arr) return [k, arr.map(Math.abs)]; // a min-heap of negatives reads as durations too
  }
  return [null, null];
}
const timeOf = (vars) => TIME.find((k) => Number.isInteger(vars?.[k]));
// the course's last day: a named variable, else a course held as one value (`c[1]`): a pair that is in the course list
function lastOf(vars) {
  const named = LAST.map((k) => vars?.[k]).find(Number.isInteger);
  if (named !== undefined) return named;
  const lists = Object.values(vars || {}).filter((v) => Array.isArray(v) && v.length && v.every(isPair));
  const c = Object.values(vars || {}).find((v) => isPair(v) && lists.some((l) => l.some((x) => x[0] === v[0] && x[1] === v[1])));
  return c ? c[1] : undefined;
}
/** the one value in a that is not in b (multiset), or undefined */
const extra = (a, b) => a.find((v) => a.filter((y) => y === v).length > b.filter((y) => y === v).length);

export default {
  id: 'course-schedule-iii',
  metaphor: 'A study plan that drops the longest course',
  caption: 'Courses are taken in order of their last day. Each one goes into the plan; if the plan now ends after that last day, the longest course in the plan is dropped, which keeps the count and frees the most days.',
  narrate(ctx) {
    const [p] = ctx.params;
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (!Array.isArray(v) || !v.every(isPair) || v.length < 2) continue;
      const was = ctx.prev[k];
      const changed = k === p ? !!was && String(was) !== String(v) : !was || String(was) !== String(v);
      if (changed && v.every((c, i) => i === 0 || v[i - 1][1] <= c[1])) return `courses by last day: ${v.map((c) => `${c[0]}d by day ${c[1]}`).join(', ')}`;
    }
    if (!ctx.next && Number.isInteger(ctx.result)) return `${ctx.result} course${ctx.result === 1 ? '' : 's'} fit before their deadlines`;
    const [tn, taken] = takenOf(ctx.vars);
    const [pn, before] = takenOf(ctx.prev);
    const time = timeOf(ctx.vars);
    if (tn && tn === pn) {
      if (taken.length === before.length + 1) return `add a ${extra(taken, before)}-day course to the plan (${taken.length} course${taken.length === 1 ? '' : 's'})`;
      if (taken.length === before.length - 1) {
        const gone = extra(before, taken);
        const t = time && ctx.prev[time] !== ctx.vars[time] ? `: the plan now ends on day ${ctx.vars[time]}` : '';
        return `too late: drop the longest course in the plan (${gone} days)${t}`;
      }
    }
    const last = lastOf(ctx.vars);
    if (time && time in ctx.prev && ctx.vars[time] > ctx.prev[time] && last !== undefined) return `the plan now ends on day ${ctx.vars[time]}; this course's last day is ${last}`;
    return null;
  },
  // the plan just grew: does it still fit, or does the longest course go?
  predict(ctx) {
    if (!ctx.next) return null;
    const [tn, taken] = takenOf(ctx.vars);
    const time = timeOf(ctx.vars);
    const last = lastOf(ctx.vars);
    if (!tn || !time || last === undefined || !taken.length || !(time in ctx.prev) || ctx.vars[time] <= ctx.prev[time]) return null;
    const [, after] = takenOf(ctx.next.vars);
    if (!after) return null;
    let ans;
    if (after.length === taken.length - 1) ans = 1;
    else if (after.length === taken.length + 1 || ctx.next.ret) ans = 0;
    else return null;
    const t = ctx.vars[time];
    // a lone course that fits is no question
    if (taken.length === 1 && t <= last) return null;
    const longest = Math.max(...taken);
    return {
      question: `The plan ends on day ${t}; this course must be done by day ${last}. What happens?`,
      options: ['It fits: keep every course', `Drop the longest course in the plan (${longest} days)`],
      answer: ans,
      explain: ans === 1 ? (t > last ? `${t} > ${last}: one course must go, and dropping the longest frees the most days for later courses.` : `Their code drops a course although ${t} ≤ ${last}.`) : t <= last ? `${t} ≤ ${last}: finishing on the last day itself is allowed.` : `Their code keeps every course although ${t} > ${last}.`,
    };
  },
  bugs: [
    {
      label: 'Sort by duration instead of last day',
      find: 'a[1] - b[1]',
      replace: 'a[0] - b[0]',
      explain: 'Short courses go first: [1,4] is taken before [3,3], and then [3,3] ends on day 4, past its deadline, so only 1 fits instead of 2.',
    },
    {
      label: 'Finishing on the last day counts as too late',
      find: 'time > lastDay',
      replace: 'time >= lastDay',
      explain: 'A 5-day course due on day 5 ends exactly in time but is dropped, so [[5,5]] gives 0 instead of 1.',
    },
  ],
};
