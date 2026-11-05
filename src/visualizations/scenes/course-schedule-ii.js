// Course Schedule II (Kahn's topological sort). Each course counts the prerequisites it still waits on; a course
// whose count reaches 0 is free to take and joins the plan. Works with indeg / inDegree / degree and
// order / res / result / ans / topo / queue; DFS solutions fall back to the generic notes.
import { changedIdx, row } from './util.js';

const DEG = /indeg|in_?degree|^deg|^in$|need|count|req/i;
const PLAN = /order|^res|result|^ans|topo|plan|queue|^q$|taken/i;
const degOf = (vars) => Object.keys(vars).find((k) => DEG.test(k) && row(vars[k]) && vars[k].every(Number.isInteger));
const planOf = (vars) => Object.keys(vars).find((k) => PLAN.test(k) && row(vars[k]));

export default {
  id: 'course-schedule-ii',
  metaphor: 'Courses unlocking as prerequisites clear',
  caption: 'An arrow a → b means a must be taken before b. Each course counts the prerequisites it still waits on; when the count hits 0 the course is free and joins the plan.',
  narrate(ctx) {
    const [nName] = ctx.params;
    const n = ctx.vars[nName];
    const dName = degOf(ctx.vars);
    const pName = planOf(ctx.vars);
    const plan = pName && row(ctx.vars[pName]);
    const before = pName && row(ctx.prev[pName]);
    if (dName && plan && before && plan.length === before.length + 1) {
      const c = plan[plan.length - 1];
      return `course ${c} has no prerequisites left: it goes into the plan (${plan.length}${Number.isInteger(n) ? ` of ${n}` : ''} planned)`;
    }
    if (dName && row(ctx.prev[dName])) {
      const d = ctx.vars[dName];
      const p = ctx.prev[dName];
      const ch = changedIdx(d, p);
      if (ch.length === 1) {
        const c = ch[0];
        if (d[c] > p[c]) return `course ${c} has another prerequisite: it now waits on ${d[c]} course${d[c] === 1 ? '' : 's'}`;
        if (d[c] < p[c]) return `a prerequisite of course ${c} is done: ${d[c] === 0 ? 'nothing left, it is free to take' : `still waits on ${d[c]}`}`;
      }
    }
    if (/return/.test(ctx.src) && plan && Number.isInteger(n) && !ctx.next) {
      return plan.length === n ? `all ${n} course${n === 1 ? "" : "s"} fit in the plan: return it` : `only ${plan.length} of ${n} courses ever became free: a cycle blocks the rest, so return []`;
    }
    return null;
  },
  // before a count goes down: does that course become free?
  predict(ctx) {
    if (!ctx.next) return null;
    const dName = degOf(ctx.vars);
    const d = dName && row(ctx.vars[dName]);
    const nd = dName && row(ctx.next.vars[dName]);
    if (!d || !nd) return null;
    const ch = changedIdx(nd, d);
    if (ch.length !== 1 || nd[ch[0]] >= d[ch[0]]) return null;
    const c = ch[0];
    const free = nd[c] === 0;
    return {
      question: `A course that course ${c} depends on was just finished. Is course ${c} free to take now?`,
      options: ['Yes: it joins the plan', 'No: it still waits on another course'],
      answer: free ? 0 : 1,
      explain: free ? `That was its last unfinished prerequisite (count → 0), so course ${c} is free.` : `Its count drops ${d[c]} → ${nd[c]}: another prerequisite is still unfinished.`,
    };
  },
  bugs: [
    {
      label: 'Return a partial plan on a cycle',
      find: 'order.length === numCourses ? order : []',
      replace: 'order',
      explain: 'Courses in a cycle never become free, so the plan stops short. Returning it anyway hands back an order that skips courses instead of [].',
    },
    {
      label: 'Check the count before lowering it',
      find: '--indeg[next] === 0',
      replace: 'indeg[next]-- === 0',
      explain: 'The old count is compared, so a course waiting on its last prerequisite is not seen as free and never joins the plan.',
    },
  ],
};
