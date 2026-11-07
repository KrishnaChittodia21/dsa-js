// Is the MST unique? Kruskal one price group at a time: count the roads of a price that link two different groups
// (usable), then build them; more usable than built means two roads were interchangeable. Reads a union-find parent
// row (plain or a UnionFind object), the sorted edge list with its index, and the counters bumped next to find / union.
import { firstInt, row, parentOf } from './util.js';


/** the union-find parent row, plain or inside a class instance */
const groups = (p) => p.filter((x, i) => x === i).length;
function rootOf(p, x) {
  for (let s = 0; s <= p.length && Number.isInteger(x) && p[x] !== x; s++) x = p[x];
  return Number.isInteger(x) && p[x] === x ? x : undefined;
}
const triple = (e) => row(e) && e.length === 3 && e.every((x) => typeof x === 'number');
/** the edge being looked at: [u, v, w] */
function edgeOf(vars) {
  for (const k of ['edge', 'e', 'ed', 'cur', 'item']) if (triple(vars[k])) return vars[k];
  const [, u] = firstInt(vars, ['u', 'a', 'x', 'from', 'src', 'n1']);
  const [, v] = firstInt(vars, ['v', 'b', 'y', 'to', 'dst', 'n2']);
  const w = ['w', 'wt', 'weight', 'cost', 'c', 'd'].map((k) => vars[k]).find((x) => typeof x === 'number');
  return u !== undefined && v !== undefined && w !== undefined ? [u, v, w] : null;
}
const same = (a, b) => !!a && !!b && a.join() === b.join();
const fmt = (e) => `edge ${e[0]}–${e[1]} (weight ${e[2]})`;
/** line numbers of the main function's own body (not nested helpers like find): its header lists the parameters */
function mainLines(ctx) {
  const head = new RegExp(`\\(\\s*${ctx.params.join('\\s*,\\s*')}\\s*[,)=]`);
  const out = new Set();
  const stack = [];
  let depth = 0;
  let found = false;
  (ctx.lines || []).forEach((l, i) => {
    const code = l.replace(/\/\/.*$/, '');
    if (/\bfunction\b|=>\s*\{/.test(code) && code.includes('{')) {
      const main = !found && head.test(code);
      found ||= main;
      stack.push({ main, depth });
    }
    if (stack.at(-1)?.main) out.add(i + 1);
    for (const ch of code) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (stack.length && depth <= stack.at(-1).depth) stack.pop();
      }
    }
  });
  return out;
}
const inMain = (ctx, line) => mainLines(ctx).has(line);


/** the edge list being walked (a sorted copy, or the parameter) and the index k into it */
function listOf(vars, params) {
  const own = Object.entries(vars).find(([k, v]) => !params.includes(k) && Array.isArray(v) && v.length && v.every(triple));
  return own ? own[1] : Array.isArray(vars[params[1]]) && vars[params[1]].every(triple) ? vars[params[1]] : null;
}
/** the edge under the cursor: u / v / w variables, an edge triple, or list[k] */
function cursorOf(vars, params) {
  const e = edgeOf(vars);
  if (e) return e;
  const list = listOf(vars, params);
  const [, k] = firstInt(vars, ['k', 'idx', 't', 'e', 'm', 'q']);
  return list && k !== undefined && triple(list[k]) ? list[k] : null;
}
/** the counter bumped on a line that calls `call` (candidates: find, merged: union) */
function counterOf(ctx, call, not) {
  for (const l of ctx.lines || []) {
    if (!call.test(l)) continue;
    const m = l.match(/(\w+)\s*(\+\+|\+=\s*1\b)/) || l.match(/\+\+\s*(\w+)/);
    if (m && m[1] !== not && Number.isInteger(ctx.vars[m[1]])) return m[1];
  }
  return undefined;
}
const mergedName = (ctx) => counterOf(ctx, /union\s*\(|\b(parent|par|fa|p|root|leader)\s*\[[^\]]+\]\s*=[^=]/) ?? firstInt(ctx.vars, ['merged', 'built', 'joined', 'unions', 'taken', 'added'])[0];
const candName = (ctx) => counterOf(ctx, /find\s*\(|root\s*\(/, mergedName(ctx));
/** the verdict line `if (a > b) return false`: [a, b] */
const checkOf = (line) => (line || '').match(/if\s*\(\s*(\w+)\s*(?:>|!==|!=)\s*(\w+)\s*\)\s*return\s+false/) || (line || '').match(/if\s*\(\s*(\w+)\s*<\s*(\w+)\s*\)\s*return\s+false/)?.slice(0, 1).concat([undefined]);

export default {
  id: 'classic-mst-is-unique',
  metaphor: 'Roads of equal price: is there a choice?',
  caption: 'Roads are handled one price at a time. First count the roads of that price that would link two different groups (usable), then build them: if fewer fit than were usable, some road could swap for another, so the cheapest tree is not unique.',
  narrate(ctx) {
    if (!inMain(ctx, ctx.line)) return null;
    if (ctx.ret && typeof ctx.value === 'boolean') {
      return ctx.value ? 'no price ever offered a real choice: exactly one cheapest tree' : 'at this price more roads were usable than could be built together: two different cheapest trees tie, so not unique';
    }
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const list = listOf(ctx.vars, ctx.params);
    if (p && !(pp && pp.length === p.length) && groups(p) === p.length && p.length === ctx.vars[ctx.params[0]]) return `${p.length} towns, each its own group; roads come cheapest first, one price at a time`;
    const [iName, i] = firstInt(ctx.vars, ['i', 'start', 'lo', 'l', 's']);
    const [jName, j] = firstInt(ctx.vars, ['j', 'end', 'hi', 'r']);
    if (list && jName && iName && j === ctx.prev[jName] + 1 && triple(list[i])) return `${j - i} road${j - i === 1 ? '' : 's'} cost ${list[i][2]} so far: one price group`;
    const c = candName(ctx);
    const m = mergedName(ctx);
    const chk = checkOf(ctx.src);
    if (chk && Number.isInteger(ctx.vars[chk[1]]) && Number.isInteger(ctx.vars[chk[2]])) {
      const [a, b] = [ctx.vars[chk[1]], ctx.vars[chk[2]]];
      return `${a} usable, ${b} built together${triple(list?.[i]) ? ` at price ${list[i][2]}` : ''}: ${a > b ? 'a choice existed' : a ? 'no choice, every usable road was needed' : 'every road of this price closes a loop'}`;
    }
    const e = cursorOf(ctx.vars, ctx.params);
    if (!e || !p) return null;
    const road = `road ${e[0]}–${e[1]} (price ${e[2]})`;
    if (pp && pp.length === p.length && groups(p) < groups(pp)) return `${road} links two groups: built`;
    if (c && Number.isInteger(ctx.prev[c]) && ctx.vars[c] === ctx.prev[c] + 1) return `${road} would link two different groups: usable (${ctx.vars[c]} so far)`;
    if (same(e, cursorOf(ctx.prev, ctx.params))) return null;
    const [ra, rb] = [rootOf(p, e[0]), rootOf(p, e[1])];
    if (ra === undefined || ra !== rb) return null;
    if (m && m in ctx.vars) return `${road}: its towns are already linked, so it is not built`;
    return `${road}: both towns are already in one group (chief ${ra}), linked by cheaper roads: not usable`;
  },
  predict(ctx) {
    if (!ctx.next || !inMain(ctx, ctx.line) || !inMain(ctx, ctx.next.line)) return null;
    const list = listOf(ctx.vars, ctx.params);
    const [, i] = firstInt(ctx.vars, ['i', 'start', 'lo', 'l', 's']);
    // the verdict for this price group
    const chk = checkOf(ctx.lines[ctx.next.line - 1]);
    if (chk && Number.isInteger(ctx.next.vars[chk[1]]) && Number.isInteger(ctx.next.vars[chk[2]])) {
      const no = !!ctx.next.ret && ctx.next.value === false;
      const [a, b] = [ctx.next.vars[chk[1]], ctx.next.vars[chk[2]]];
      return {
        question: `${triple(list?.[i]) ? `Price ${list[i][2]}: ` : ''}${a} road(s) were usable and ${b} could be built together. Is the cheapest tree still unique?`,
        options: ['Yes so far: go on to the next price', 'No: another tree ties, return false'],
        answer: no ? 1 : 0,
        explain: no ? `${a - b} usable road(s) were left over: each could replace a built road of the same price, giving another tree with the same total.` : 'Every usable road was built, so at this price there was nothing to choose.',
      };
    }
    const p = parentOf(ctx.vars);
    const np = parentOf(ctx.next.vars);
    const e = cursorOf(ctx.next.vars, ctx.params);
    if (!p || !np || np.length !== p.length || !e || same(e, cursorOf(ctx.vars, ctx.params))) return null;
    const m = mergedName(ctx);
    const c = candName(ctx);
    const road = `road ${e[0]}–${e[1]} (price ${e[2]})`;
    // build phase: does an equal-price road still fit? (asked when it does not: that is the tie)
    if (m && m in ctx.next.vars) {
      const ra = rootOf(np, e[0]);
      // only after a road of this price was built: then the skip shows two roads competing (before, cheaper roads did it)
      if (!(ctx.vars[m] > 0) || groups(np) < groups(p) || ra === undefined || ra !== rootOf(np, e[1])) return null;
      return {
        question: `Building price ${e[2]}: ${road} is next. Does it still link two groups?`,
        options: ['Yes: it is built', 'No: its towns are already linked'],
        answer: 1,
        explain: `The roads built so far (${ctx.vars[m]} of them at price ${e[2]}) already join ${e[0]} and ${e[1]}. If it was counted usable, it could have taken one of their places.`,
      };
    }
    // count phase: usable or not? (asked when it is not: the cheaper roads already link its ends)
    if (c && Number.isInteger(ctx.next.vars[c]) && Number.isInteger(ctx.vars[c]) && ctx.next.vars[c] === ctx.vars[c]) {
      const ra = rootOf(np, e[0]);
      if (ra === undefined || ra !== rootOf(np, e[1])) return null;
      return {
        question: `${road}: is it usable (does it link two different groups)?`,
        options: ['Usable', 'Not usable: it would close a loop'],
        answer: 1,
        explain: `Cheaper roads already link ${e[0]} and ${e[1]}, so this road never competes for a place: an equal price alone is no choice.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Any tie means not unique',
      find: 'if (candidates > merged) return false;',
      replace: 'if (j - i > 1) return false;',
      explain: 'Two roads of one price are not always a choice: if cheaper roads already link one road\'s towns, or both roads are needed, the tree is still unique.',
    },
  ],
};
