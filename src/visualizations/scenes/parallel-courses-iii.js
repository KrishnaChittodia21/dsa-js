// Parallel Courses III (Kahn's order + longest path). Courses run in parallel; a course can only start when its
// slowest prerequisite has finished. finish[v] = max over prerequisites u of finish[u] + time[v]; the answer is
// the latest finish. Works with finish / dist / dp / end / done / earliest / ready and indeg / inDegree / need.
import { changedIdx, options, row } from './util.js';

const isNums = (v) => !!row(v) && v.length > 0 && v.every((x) => typeof x === 'number');
const FIN = /finish|^dist|^dp$|^end|done|earliest|ready|complete|^f$|best/i;
const DEG = /indeg|in_?degree|^deg|need|wait|req|^in$/i;
const finOf = (ctx, vars) => Object.keys(vars).find((k) => !ctx.params.includes(k) && FIN.test(k) && isNums(vars[k]));
const degOf = (ctx, vars) => Object.keys(vars).find((k) => !ctx.params.includes(k) && DEG.test(k) && isNums(vars[k]));
const AT = ['u', 'cur', 'curr', 'node'];
const atOf = (vars) => AT.find((k) => Number.isInteger(vars[k]));

export default {
  id: 'parallel-courses-iii',
  metaphor: 'A term calendar waiting on the slowest prerequisite',
  caption: 'Courses run side by side. Each course\'s finish month is the latest finish among its prerequisites plus its own length; the whole plan ends at the latest finish of all.',
  narrate(ctx) {
    const [nName, , tName] = ctx.params;
    const n = ctx.vars[nName];
    const time = row(ctx.vars[tName]);
    if (ctx.ret && typeof ctx.value === 'number') return `the last course finishes in month ${ctx.value}: that is the shortest the whole plan can take`;
    const fName = finOf(ctx, ctx.vars);
    const fin = fName && ctx.vars[fName];
    // label: arrays of length n are 0-based (course i + 1)
    const dName = degOf(ctx, ctx.vars);
    const len = (fin || (dName && ctx.vars[dName]) || []).length;
    const lab = (i) => (len === n ? i + 1 : i);
    const uName = atOf(ctx.vars);
    const bName = ['best', 'ans', 'res', 'result', 'total', 'maxTime', 'answer'].find((k) => typeof ctx.vars[k] === 'number' && typeof ctx.prev[k] === 'number' && ctx.vars[k] > ctx.prev[k]);
    if (bName && fin) return `latest finish so far: month ${ctx.vars[bName]}`;
    if (fName && isNums(ctx.prev[fName]) && ctx.prev[fName].length === fin.length) {
      const ch = changedIdx(fin, ctx.prev[fName]);
      if (ch.length === 1) {
        const v = ch[0];
        const u = uName && ctx.vars[uName];
        const tv = time && time[lab(v) - 1]; // time is always 0-based (course k at time[k - 1])
        if (Number.isInteger(u) && fin[v] === fin[u] + tv) return `course ${lab(v)} cannot start before course ${lab(u)} ends (month ${fin[u]}): +${tv} months → finishes month ${fin[v]}`;
        if (!Number.isInteger(u) && fin[v] === tv) return `course ${lab(v)} has no prerequisites: it finishes after its own ${tv} month${tv === 1 ? '' : 's'}`;
        return `course ${lab(v)}: ${fName} ${ctx.prev[fName][v]} → ${fin[v]}`;
      }
      if (ch.length === 0 && new RegExp(`^\\s*${fName}\\[.*max`).test(ctx.src) && Number.isInteger(ctx.vars[uName])) return `course ${lab(ctx.vars[uName])} ends early enough: its follower already has a later prerequisite, nothing changes`;
    }
    if (dName && isNums(ctx.prev[dName]) && ctx.prev[dName].length === ctx.vars[dName].length) {
      const d = ctx.vars[dName];
      const ch = changedIdx(d, ctx.prev[dName]);
      if (ch.length === 1) {
        const c = ch[0];
        if (d[c] > ctx.prev[dName][c]) return `course ${lab(c)} has another prerequisite: it waits on ${d[c]}`;
        return d[c] === 0 ? `course ${lab(c)}'s last prerequisite is done: it can start, its finish month is now final` : `one prerequisite of course ${lab(c)} is done: ${d[c]} still to go`;
      }
    }
    if (uName && fin && ctx.vars[uName] !== ctx.prev[uName] && Number.isInteger(fin[ctx.vars[uName]])) {
      const u = ctx.vars[uName];
      return `course ${lab(u)} takes its turn: all its prerequisites are done, it finishes in month ${fin[u]}`;
    }
    return null;
  },
  // before a finish month is updated: when does that course finish now?
  predict(ctx) {
    if (!ctx.next) return null;
    const [nName, , tName] = ctx.params;
    const time = row(ctx.vars[tName]);
    const fName = finOf(ctx, ctx.vars);
    const fin = fName && ctx.vars[fName];
    const nfin = fName && ctx.next.vars[fName];
    const uName = atOf(ctx.vars);
    const u = uName && ctx.vars[uName];
    if (!time || !isNums(fin) || !isNums(nfin) || fin.length !== nfin.length || !Number.isInteger(u) || ctx.next.vars[uName] !== u) return null;
    const ch = changedIdx(nfin, fin);
    // a max() that keeps the old month still records a step: then the follower is the v-like name on that step
    const vKey = ['v', 'nei', 'nb', 'w', 'to', 'nxt'].find((k) => Number.isInteger(ctx.next.vars[k]));
    const v = ch.length === 1 ? ch[0] : ch.length === 0 && new RegExp(`^\\s*${fName}\\[.*Math\\.max`).test(ctx.lines[ctx.next.line - 1] || '') && vKey ? ctx.next.vars[vKey] : undefined;
    const lab = (i) => (fin.length === ctx.vars[nName] ? i + 1 : i);
    const tv = Number.isInteger(v) ? time[lab(v) - 1] : undefined;
    if (!Number.isInteger(v) || !Number.isFinite(fin[v]) || !Number.isFinite(tv)) return null;
    // only the classic finish-month table: the new value is max(finish[v], finish[u] + its own time)
    if (nfin[v] !== Math.max(fin[v], fin[u] + tv)) return null;
    const card = options(
      `Course ${lab(u)} (a prerequisite) ends in month ${fin[u]}. Course ${lab(v)} takes ${tv} months and so far finishes in month ${fin[v]}. When does it finish now?`,
      nfin[v],
      [fin[u] + tv, fin[v], fin[u], fin[v] + tv].filter((x) => x !== nfin[v]),
      nfin[v] === fin[v] && fin[u] + tv < fin[v] ? `Another prerequisite already pushes it to month ${fin[v]}; ${fin[u]} + ${tv} = ${fin[u] + tv} is earlier, so nothing changes.` : `It must wait for its slowest prerequisite: max(${fin[v]}, ${fin[u]} + ${tv}) = ${nfin[v]}.`,
    );
    if (card) {
      card.options.sort((a, b) => Number(a) - Number(b));
      card.answer = card.options.indexOf(String(nfin[v]));
    }
    return card;
  },
  bugs: [
    {
      label: 'min instead of max over prerequisites',
      find: 'Math.max(finish[v], finish[u] + time[v])',
      replace: 'Math.min(finish[v], finish[u] + time[v])',
      explain: 'A course must wait for its slowest prerequisite. Taking the minimum lets it start as soon as the fastest one ends, so the plan looks shorter than it can be.',
    },
    {
      label: 'Start every course at month 0',
      find: 'const finish = time.slice();',
      replace: 'const finish = new Array(n).fill(0);',
      explain: 'A course with no prerequisites still takes its own months. Starting its finish at 0 drops that time, so free courses look instant.',
    },
  ],
};
