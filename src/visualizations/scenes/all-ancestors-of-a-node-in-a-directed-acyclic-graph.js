// All Ancestors of a Node in a DAG (Kahn's order). A node leaves the queue only when all its parents have, so its
// ancestor list is complete then; it hands itself plus that list down to each child. Reads the ancestor lists
// (an array of Sets, or of arrays under an ancestor-like name), the in-degree row and u / v-like names.
import { changedIdx, firstInt, row } from './util.js';

const AT = ['u', 'node', 'cur', 'curr', 'parent', 'p', 'x'];
const KID = ['v', 'child', 'nei', 'next', 'nxt', 'w', 'c', 'kid', 'to', 'y'];
const DEG = /indeg|in_?degree|^deg|need|count|parents?Left|waiting|^in$/i;
const listOf = (s) => (s?.$set ? s.$set : row(s) ? s : null);
function ancOf(vars, params, n) {
  const ok = (k) => {
    const v = vars[k];
    return !params.includes(k) && Array.isArray(v) && (!Number.isInteger(n) || v.length === n) && v.length > 0 && v.every((s) => listOf(s));
  };
  return Object.keys(vars).find((k) => ok(k) && vars[k].some((s) => s?.$set)) ?? Object.keys(vars).find((k) => ok(k) && /anc|par|res|ans|out/i.test(k) && !/adj|graph|^g$|child|kids|out_?edges/i.test(k));
}
const degOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && DEG.test(k) && row(vars[k]) && vars[k].every(Number.isInteger));
const adjOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && /adj|graph|^g$|child|kids|out/i.test(k) && Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.every(Number.isInteger)))?.[1] || null;
const fmt = (xs) => (xs.length ? `{${[...xs].sort((a, b) => a - b).join(', ')}}` : '{}');
/** the one ancestor list that changed: [index, added items, now] */
function grown(vars, prev, k) {
  const a = k && vars[k];
  const b = k && prev[k];
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return null;
  const out = [];
  a.forEach((s, i) => {
    const now = listOf(s) || [];
    const was = listOf(b[i]) || [];
    const add = now.filter((x) => !was.includes(x));
    if (add.length) out.push([i, add, now]);
  });
  return out.length === 1 ? out[0] : null;
}

export default {
  id: 'all-ancestors-of-a-node-in-a-directed-acyclic-graph',
  metaphor: 'Family trees handed down the generations',
  caption: 'An arrow u → v makes u a parent of v. Nodes are taken in topological order, so a node’s family tree is complete when it is taken; it then hands itself and its whole tree down to each child.',
  narrate(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (ctx.ret && Array.isArray(ctx.value)) return `every node has its full family tree, sorted by number: ${ctx.value.map((a, i) => `${i}: ${fmt(a)}`).filter((t) => !t.endsWith('{}')).join(' · ') || 'nobody has ancestors'}`;
    const a = ancOf(ctx.vars, ctx.params, n);
    const [, u] = firstInt(ctx.vars, AT);
    const g = a && grown(ctx.vars, ctx.prev, a);
    if (g) {
      const [v, add, now] = g;
      if (add.length === 1 && add[0] === u) return `${v} inherits its parent ${u}: ancestors of ${v} so far ${fmt(now)}`;
      if (Number.isInteger(u) && add.length === 1) return `${v} also inherits ${add[0]}, an ancestor of its parent ${u}: ${fmt(now)}`;
      return `${v} inherits ${fmt(add)}: ancestors so far ${fmt(now)}`;
    }
    const d = degOf(ctx.vars, ctx.params);
    if (d && row(ctx.prev[d])) {
      const ch = changedIdx(ctx.vars[d], ctx.prev[d]);
      if (ch.length === 1 && ctx.vars[d][ch[0]] < ctx.prev[d][ch[0]] && a) {
        const v = ch[0];
        const left = ctx.vars[d][v];
        return left === 0 ? `all parents of ${v} have passed on their trees: ${v}'s list is complete, it joins the queue` : `${v} still waits on ${left} more parent${left === 1 ? '' : 's'}`;
      }
    }
    const [uName] = firstInt(ctx.vars, AT);
    if (a && uName && u !== ctx.prev[uName]) {
      const kids = adjOf(ctx.vars, ctx.params)?.[u];
      const mine = listOf(ctx.vars[a][u]) || [];
      return `take ${u}: its family tree ${fmt(mine)} is complete${kids ? (kids.length ? `; pass it on to ${kids.join(', ')}` : '; it has no children') : ''}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const n = ctx.vars[ctx.params[0]];
    const a = ancOf(ctx.vars, ctx.params, n);
    if (!a) return null;
    const [, u] = firstInt(ctx.vars, AT);
    const [vName, v] = firstInt(ctx.vars, KID);
    if (!Number.isInteger(u) || !vName) return null;
    // v just got its parent u: does it inherit u's own ancestors too?
    const g = grown(ctx.vars, ctx.prev, a);
    const mine = listOf(ctx.vars[a][u]) || [];
    if (g && g[0] === v && g[1].length === 1 && g[1][0] === u && mine.length) {
      const ng = grown(ctx.next.vars, ctx.vars, a);
      const same = ctx.next.vars[vName] === v && firstInt(ctx.next.vars, AT)[1] === u;
      let answer;
      if (ng && ng[0] === v && ng[1].every((x) => mine.includes(x))) answer = 0;
      else if (!ng && !same) answer = 1;
      else return null;
      return {
        question: `${v} just inherited its parent ${u}. ${u}'s own ancestors are ${fmt(mine)}. What happens next?`,
        options: [`${v} inherits ${fmt(mine)} as well`, `Nothing more: ${v} moves on`],
        answer,
        explain: answer === 0 ? `An ancestor of a parent is an ancestor too, so ${u}'s whole tree flows down to ${v}.` : `This run skips ${u}'s ancestors, so ${v} gets only its direct parent and misses ${fmt(mine)}.`,
      };
    }
    // a parent count drops: is v's tree complete now?
    const d = degOf(ctx.vars, ctx.params);
    const now = d && row(ctx.vars[d]);
    const nxt = d && row(ctx.next.vars[d]);
    if (!now || !nxt) return null;
    const ch = changedIdx(nxt, now);
    // only once the parents handing down have trees of their own (the roots' rounds are all alike)
    if (ch.length !== 1 || nxt[ch[0]] >= now[ch[0]] || !mine.length) return null;
    const c = ch[0];
    return {
      question: `Parent ${u} has passed its tree to ${c}. Is ${c}'s family tree complete now?`,
      options: ['Yes: every parent has passed it on', 'No: another parent is still waiting'],
      answer: nxt[c] === 0 ? 0 : 1,
      explain: nxt[c] === 0 ? `That was ${c}'s last unprocessed parent (count → 0), so its list is final and it joins the queue.` : `Its parent count drops ${now[c]} → ${nxt[c]}: some parent of ${c} has not been taken yet, so more ancestors may still arrive.`,
    };
  },
  bugs: [
    {
      label: 'Forget the parent itself',
      find: 'anc[v].add(u);',
      replace: '',
      explain: 'Only the parent\'s ancestors are copied, never the parent: direct parents go missing, and nodes whose parents are roots end up with no ancestors at all.',
    },
    {
      label: 'Default sort',
      find: '[...s].sort((a, b) => a - b)',
      replace: '[...s].sort()',
      explain: 'sort() with no compare function compares as text, so 10 comes before 2 and lists with two-digit nodes come out in the wrong order.',
    },
  ],
};
