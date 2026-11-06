// Course Schedule IV: answer "is u a (possibly indirect) prerequisite of v?" for many queries. Each course keeps a
// list of everything that comes before it; in Kahn order a course hands its whole list on to the courses it
// unlocks. Works with a reach / isPre table in either orientation (reach[v][u] or isPre[u][v]), Floyd–Warshall
// style closure, and an indeg array; DFS-per-query solutions fall back to the generic notes.
import { changedIdx, row } from './util.js';

const DEG = /indeg|in_?degree|^deg|^in$|need|req|pending|wait/i;
const AT = ['u', 'node', 'cur', 'curr', 'course', 'c'];
const nodeOf = (vars) => AT.find((k) => Number.isInteger(vars[k]));
const bit = (x) => x === 1 || x === true;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const degOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && DEG.test(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every(Number.isInteger));

/** the n×n 0/1 (or boolean) table that is not a parameter */
function tableOf(vars, params, n) {
  return Object.keys(vars).find((k) => {
    const t = vars[k];
    return !params.includes(k) && Array.isArray(t) && t.length > 0 && (!Number.isInteger(n) || t.length === n) && t.every((r) => row(r) && r.length === t.length && r.every((x) => x === 0 || x === 1 || typeof x === 'boolean'));
  });
}

/** 'before' when t[a][b] means "a comes before b", 'after' when t[b][a] does; decided by the input edges */
function orientation(t, edges) {
  if (!Array.isArray(edges)) return null;
  let fw = 0;
  let bw = 0;
  for (const e of edges) {
    if (!Array.isArray(e)) continue;
    const [a, b] = e;
    if (bit(t[a]?.[b])) fw++;
    if (bit(t[b]?.[a])) bw++;
  }
  return fw > bw ? 'before' : bw > fw ? 'after' : null;
}

/** the cells that turned on between two tables */
function newCells(t, p) {
  if (!Array.isArray(p) || p.length !== t.length) return [];
  const out = [];
  t.forEach((r, i) => changedIdx(r.map(Number), (p[i] || []).map(Number)).forEach((j) => bit(r[j]) && out.push([i, j])));
  return out;
}

export default {
  id: 'course-schedule-iv',
  metaphor: 'Each course inherits its ancestors list',
  caption: 'An arrow a → b means a comes before b. Each row of the table lists every course that must come before that course; a course passes its whole list on to the courses it unlocks, so indirect prerequisites arrive too.',
  narrate(ctx) {
    const { vars, prev, params, input } = ctx;
    const n = vars[params[0]];
    if (ctx.ret && !ctx.next && row(ctx.value)) {
      const q = input?.[2];
      const yes = ctx.value.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
      return `answers for ${`${ctx.value.length} ${ctx.value.length === 1 ? 'query' : 'queries'}`}: ${yes.length} yes${Array.isArray(q) && yes.length ? ` (${yes.map((i) => `${q[i]?.[0]} before ${q[i]?.[1]}`).join(', ')})` : ''}`;
    }
    const aName = Object.keys(vars).find((k) => !params.includes(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every((x) => typeof x === 'boolean') && row(prev[k]) && vars[k].length === prev[k].length + 1);
    if (aName && Array.isArray(input?.[2])) {
      const i = vars[aName].length - 1;
      const [u, v] = input[2][i] || [];
      return `query ${i}: is ${u} on course ${v}'s list? ${vars[aName][i] ? 'yes' : 'no'}`;
    }
    const tName = tableOf(vars, params, n);
    if (tName && tName in prev) {
      const t = vars[tName];
      const cells = newCells(t, prev[tName]);
      const dir = orientation(t, input?.[1]);
      if (cells.length === 1 && dir) {
        const [i, j] = cells[0];
        const [pre, post] = dir === 'before' ? [i, j] : [j, i];
        const direct = (input?.[1] || []).some((e) => e?.[0] === pre && e?.[1] === post);
        const at = nodeOf(vars);
        const mid = ['k', 'mid', 'via', 'm', 'w'].find((x) => Number.isInteger(vars[x]) && vars[x] !== pre && vars[x] !== post);
        const via = !direct && mid ? ` through ${vars[mid]}` : !direct && at && vars[at] !== pre ? ` (inherited from ${vars[at]})` : '';
        return `${pre} is ${direct ? 'a direct' : 'an indirect'} prerequisite of ${post}${via}: course ${post} now knows ${plural(t.map((r, x) => (dir === 'before' ? bit(r[post]) : bit(t[post][x]))).filter(Boolean).length, 'course')} before it`;
      }
    }
    const dName = degOf(vars, params);
    if (dName && row(prev[dName])) {
      const d = vars[dName];
      const ch = changedIdx(d, prev[dName]);
      if (ch.length === 1) {
        const c = ch[0];
        if (d[c] > prev[dName][c]) return `course ${c} waits on another course: ${d[c]} before it`;
        return `a course before ${c} has handed over its list: ${d[c] === 0 ? `course ${c}'s list is complete, it is next` : `${d[c]} still to come`}`;
      }
    }
    const at = nodeOf(vars);
    if (at && vars[at] !== prev[at] && tName) {
      return `course ${vars[at]}'s list is final: hand it on to every course it unlocks`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params, input } = ctx;
    const edges = input?.[1] || [];
    const isEdge = (p) => edges.some((e) => e?.[0] === p?.[0] && e?.[1] === p?.[1]);
    const bools = (v) => row(v) && v.length > 0 && v.every((x) => typeof x === 'boolean');
    // answers pushed one at a time: ask about an indirect query just before its answer appears
    const nx = ctx.next.vars;
    const aName = Object.keys(nx).find((k) => !params.includes(k) && bools(nx[k]) && row(vars[k]) && nx[k].length === vars[k].length + 1);
    if (aName && Array.isArray(input?.[2])) {
      const i = nx[aName].length - 1;
      const [u, v] = input[2][i] || [];
      if (u === undefined || isEdge([u, v])) return null;
      return {
        question: `Query ${i}: must course ${u} come before course ${v}? (no rule names them together)`,
        options: ['Yes', 'No'],
        answer: nx[aName][i] ? 0 : 1,
        explain: nx[aName][i] ? `${u} reaches ${v} through other courses, so it is an indirect prerequisite.` : `${u} never reaches ${v} along the arrows, so it is not a prerequisite.`,
      };
    }
    // before the answers come back all at once: is a non-direct query true?
    if (ctx.next.ret && row(ctx.next.value) && Array.isArray(input?.[2]) && !Object.values(vars).some(bools)) {
      const q = input[2];
      const ans = ctx.next.value;
      if (ans.length !== q.length || !ans.length) return null;
      let i = q.findIndex((p, k) => ans[k] && !edges.some((e) => e?.[0] === p?.[0] && e?.[1] === p?.[1]));
      if (i < 0) i = q.findIndex((p) => !edges.some((e) => e?.[0] === p?.[0] && e?.[1] === p?.[1]));
      if (i < 0) i = 0;
      const [u, v] = q[i] || [];
      return {
        question: `Query ${i}: must course ${u} come before course ${v}?`,
        options: ['Yes', 'No'],
        answer: ans[i] ? 0 : 1,
        explain: ans[i] ? `${u} is on course ${v}'s inherited list${edges.some((e) => e?.[0] === u && e?.[1] === v) ? ' (a direct rule)' : ', reached through other courses even though no rule names them together'}.` : `${u} never reaches ${v} along the arrows, so it is not a prerequisite.`,
      };
    }
    // Kahn: before a count goes down, is that course's list complete?
    const dName = degOf(vars, params);
    const d = dName && row(vars[dName]);
    const nd = dName && row(ctx.next.vars[dName]);
    if (!d || !nd) return null;
    const ch = changedIdx(nd, d);
    // only courses with several courses before them: with one, the answer is always yes
    if (ch.length !== 1 || nd[ch[0]] >= d[ch[0]] || (input?.[1] || []).filter((e) => e?.[1] === ch[0]).length < 2) return null;
    const c = ch[0];
    return {
      question: `Course ${c} just inherited a list. Is its list now complete (ready to pass on)?`,
      options: ['Yes: nothing else comes before it', 'No: another course still has to hand its list over'],
      answer: nd[c] === 0 ? 0 : 1,
      explain: nd[c] === 0 ? `That was the last course pointing at ${c} (count ${d[c]} → 0).` : `Its count drops ${d[c]} → ${nd[c]}: another course before ${c} has not been processed yet.`,
    };
  },
  bugs: [
    {
      label: 'Only record direct prerequisites',
      find: 'for (let k = 0; k < n; k++) if (reach[u][k]) reach[v][k] = 1;',
      replace: '',
      explain: 'Course v learns about u but not about everything before u, so a chain 0 → 1 → 2 → 3 answers "is 0 before 3?" with false.',
    },
    {
      label: 'Ask the query the wrong way round',
      find: 'reach[v][u] === 1',
      replace: 'reach[u][v] === 1',
      explain: 'The table row belongs to the later course, so this checks whether v comes before u: every answer is flipped.',
    },
  ],
};
