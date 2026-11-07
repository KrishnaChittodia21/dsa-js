// Queries on a Permutation With Key: a line of people numbered 1..m. Each query asks how many stand in front of
// person q, then q steps to the very front. The line is read from a plain array the learner reorders, or from a
// slot table pos[value] (the Fenwick version: slots 1..n are kept free in front for the n moves).
import { options, row } from './util.js';

const RES = ['res', 'ans', 'result', 'out', 'answer', 'output', 'answers', 'ret'];
const Q = ['q', 'x', 'val', 'v', 'key', 'num', 'query', 'target', 'cur', 'value'];
const POS = /^(pos|position|positions|slot|slots|where|idx|index|loc|place|at)$/i;
const isInt = Number.isInteger;

function resOf(ctx) {
  const k = RES.find((n) => !ctx.params.includes(n) && row(ctx.vars[n]) && ctx.vars[n].every(isInt));
  return k ? [k, ctx.vars[k]] : [null, null];
}
/** the current line front to back: a permutation of 1..m, or one derived from a slot table pos[value] */
function lineOf(vars, m, params) {
  if (!isInt(m) || m < 1) return null;
  const entries = Object.entries(vars || {}).filter(([k]) => !params.includes(k) && k !== 'this');
  for (const [, v] of entries) {
    if (row(v) && v.length === m && v.every(isInt) && new Set(v).size === m && v.every((x) => x >= 1 && x <= m)) return v;
  }
  for (const [k, v] of entries) {
    if (!POS.test(k) || !row(v) || v.length !== m + 1) continue;
    const vals = Array.from({ length: m }, (_, i) => i + 1);
    if (!vals.every((x) => isInt(v[x])) || new Set(vals.map((x) => v[x])).size !== m) continue;
    return vals.sort((a, b) => v[a] - v[b]);
  }
  return null;
}
function posTable(vars, params) {
  const e = Object.entries(vars || {}).find(([k, v]) => !params.includes(k) && POS.test(k) && row(v));
  return e || null;
}
const qOf = (vars, m) => Q.find((k) => isInt(vars[k]) && vars[k] >= 1 && vars[k] <= m);
const show = (l) => `[${l.join(', ')}]`;

export default {
  id: 'queries-on-a-permutation-with-key',
  metaphor: 'A line where the called person steps forward',
  caption: 'The line starts as 1, 2, …, m. Each query counts the people standing in front of q, then q moves to the very front; everyone it passed shifts back one place.',
  narrate(ctx) {
    const [qsName, mName] = ctx.params;
    const queries = row(ctx.vars[qsName]) || row(ctx.input?.[0]);
    const m = isInt(ctx.vars[mName]) ? ctx.vars[mName] : ctx.input?.[1];
    if (!queries || !isInt(m)) return null;
    const line = lineOf(ctx.vars, m, ctx.params);
    const [rName, res] = resOf(ctx);
    const before = rName && row(ctx.prev[rName]);
    // an answer was just written down
    if (res && before && res.length === before.length + 1) {
      const k = res.length - 1;
      const q = queries[k];
      const a = res[k];
      const pt = posTable(ctx.vars, ctx.params);
      const slot = pt && isInt(pt[1][q]) ? pt[1][q] : null;
      if (line && line.indexOf(q) === a) return `${q} stands at place ${a} in ${show(line)}: ${a} ${a === 1 ? 'person is' : 'people are'} in front of it`;
      if (slot !== null) return `${q} sits in slot ${slot}; ${a + 1} filled slot${a ? 's' : ''} up to it, minus itself: ${a} in front`;
      return `query ${q}: answer ${a}`;
    }
    // a new query arrives
    const qName = qOf(ctx.vars, m);
    if (qName && res && ctx.vars[qName] === queries[res.length] && ctx.vars[qName] !== ctx.prev[qName]) {
      return line ? `query ${res.length + 1}: find ${ctx.vars[qName]} in the line ${show(line)}` : `query ${res.length + 1}: find ${ctx.vars[qName]}`;
    }
    // the line changed: someone left or stepped to the front
    const lineBefore = lineOf(ctx.prev, m, ctx.params);
    if (line && lineBefore && line.join() !== lineBefore.join() && line[0] !== lineBefore[0]) return `${line[0]} steps to the front: ${show(line)}`;
    const back = line && Object.entries(ctx.vars).find(([k, v]) => v === line && row(ctx.prev[k])?.length === m - 1);
    if (back) return `${line[0]} steps to the front: ${show(line)}`;
    const plain = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === m - 1 && row(ctx.prev[k])?.length === m);
    if (plain) {
      const gone = ctx.prev[plain[0]].find((x) => !plain[1].includes(x));
      if (gone !== undefined) return `${gone} leaves its place: ${show(plain[1])}`;
    }
    // Fenwick slot bookkeeping, read from the call line: add(pos[q], -1) / add(pos[q], 1)
    const call = /\w+\(\s*([A-Za-z_$][\w$]*)\[([A-Za-z_$][\w$]*)\]\s*,\s*(-?)\s*1\s*\)/.exec(ctx.src || '');
    if (call && row(ctx.vars[call[1]]) && isInt(ctx.vars[call[2]])) {
      const v = ctx.vars[call[2]];
      const slot = ctx.vars[call[1]][v];
      if (!isInt(slot)) return null;
      if (call[3]) return `${v} leaves slot ${slot}: that slot counts as empty now`;
      if (!res) return `${v} sits in slot ${slot} (slots 1..${slot - v} stay free for the moves to the front)`;
      return `${v} takes slot ${slot}, in front of every filled slot`;
    }
    return null;
  },
  // when a query arrives: how many stand in front of it?
  predict(ctx) {
    const [qsName, mName] = ctx.params;
    const queries = row(ctx.vars[qsName]) || row(ctx.input?.[0]);
    const m = isInt(ctx.vars[mName]) ? ctx.vars[mName] : ctx.input?.[1];
    const result = row(ctx.result);
    if (!queries || !isInt(m) || !result || result.length !== queries.length) return null;
    const [, res] = resOf(ctx);
    const qName = qOf(ctx.vars, m);
    if (!res || !qName || ctx.vars[qName] === ctx.prev[qName] || res.length >= queries.length || ctx.vars[qName] !== queries[res.length]) return null;
    const k = res.length;
    const q = queries[k];
    const a = result[k];
    if (!isInt(a)) return null;
    const line = lineOf(ctx.vars, m, ctx.params);
    return options(
      line ? `The line is ${show(line)}. How many people stand in front of ${q}?` : `Query ${k + 1} asks for ${q}. How many people stand in front of it?`,
      a,
      [q - 1, a + 1, a > 0 ? a - 1 : 2, 0].filter((x) => x !== a && x >= 0),
      line && line.indexOf(q) === a
        ? `${q} is at place ${a}: ${a ? show(line.slice(0, a)) + ' stand' + (a === 1 ? 's' : '') + ' before it' : 'it is already at the front'}.${q - 1 !== a ? ` Not ${q - 1}: earlier moves changed the order.` : ''}`
        : `This code answers ${a} for this query.`,
    );
  },
  bugs: [
    {
      label: 'Counts q itself (no − 1)',
      find: 'res.push(prefix(pos[q]) - 1);',
      replace: 'res.push(prefix(pos[q]));',
      explain: 'prefix(pos[q]) counts every filled slot up to and including q\'s own slot, so every answer is one too big.',
    },
    {
      label: 'Old slot never freed',
      find: 'add(pos[q], -1);',
      replace: '',
      explain: 'q moves to a new front slot but still fills its old one, so everyone behind its old place counts it twice.',
    },
  ],
};
