// Assign Cookies: two lines, children by greed and cookies by size. The smallest cookie goes to the least greedy
// child still waiting; a cookie too small for that child is too small for everyone, so it is skipped.
import { row, sorted } from './util.js';

const CHILD = ['child', 'i', 'gi', 'kid', 'c', 'children', 'content', 'count', 'res', 'ans'];
const COOKIE = ['cookie', 'j', 'si', 'ck', 'k', 'cookies', 'cIdx'];

const nameOf = (vars, list, params) => list.find((n) => !params.includes(n) && Number.isInteger(vars?.[n]));
/** the line compares a cookie with a child: the step it records has decided the cookie it points at */
const isCompare = (ctx, lineNo) => {
  const [g, s] = ctx.params;
  const t = ctx.lines?.[lineNo - 1] || '';
  return t.includes(`${g}[`) && t.includes(`${s}[`) && /[<>]/.test(t);
};

export default {
  id: 'assign-cookies',
  metaphor: 'Smallest cookie for the least greedy child',
  caption: 'Children are lined up by greed and cookies by size. Each cookie is offered to the least greedy child still waiting: if it is big enough the child is content, otherwise it is too small for everyone and is skipped.',
  narrate(ctx) {
    const [gName, sName] = ctx.params;
    const g = row(ctx.vars[gName]);
    const s = row(ctx.vars[sName]);
    if (!g || !s) return null;
    for (const [nm, a, what] of [[gName, g, 'children by greed'], [sName, s, 'cookies by size']]) {
      const was = row(ctx.prev[nm]);
      if (was && String(was) !== String(a) && sorted(a)) return `line up the ${what}: [${a.join(', ')}]`;
    }
    if (!ctx.next && typeof ctx.result === 'number') return `${ctx.result} ${ctx.result === 1 ? 'child is' : 'children are'} content`;
    const ch = nameOf(ctx.vars, CHILD, ctx.params);
    const ck = nameOf(ctx.vars, COOKIE, ctx.params);
    if (!ch || !ck || ch === ck || !(ch in ctx.prev)) return null;
    const kid = ctx.vars[ch];
    const was = ctx.prev[ch];
    if (kid === was + 1 && s[ctx.vars[ck]] !== undefined && g[was] !== undefined) {
      return `cookie ${s[ctx.vars[ck]]} ≥ greed ${g[was]}: that child is content (${kid} so far); the next child waits`;
    }
    // a skipped cookie, told only on the compare line: after a separate `j++` the cookie may just have been eaten
    const c = ctx.vars[ck];
    if (!isCompare(ctx, ctx.line) || kid !== was || ctx.vars[ck] === ctx.prev[ck] || s[c] === undefined || g[kid] === undefined || s[c] >= g[kid]) return null;
    return `cookie ${s[c]} < greed ${g[kid]}: too small for the least greedy child, so for everyone: skip it`;
  },
  // before a cookie is decided: does the least greedy child take it?
  predict(ctx) {
    if (!ctx.next) return null;
    const [gName, sName] = ctx.params;
    const g = row(ctx.vars[gName]);
    const s = row(ctx.vars[sName]);
    const ch = nameOf(ctx.vars, CHILD, ctx.params);
    const ck = nameOf(ctx.next.vars, COOKIE, ctx.params);
    if (!g || !s || !ch || !ck || ch === ck) return null;
    const nextCmp = isCompare(ctx, ctx.next.line);
    // a child pointer that moved on this compare line is followed by a separate cookie++: half done
    if (!nextCmp && isCompare(ctx, ctx.line)) return null;
    const c = nextCmp ? ctx.next.vars[ck] : ctx.vars[ck];
    const kid = ctx.vars[ch];
    const after = ctx.next.vars[ch];
    if (!Number.isInteger(c) || s[c] === undefined || g[kid] === undefined) return null;
    let ans;
    if (after === kid + 1) ans = 0;
    else if (after === kid && ctx.next.vars[ck] !== ctx.vars[ck]) ans = 1;
    else return null;
    return {
      question: `The cookie of size ${s[c]} is offered to the least greedy child waiting (greed ${g[kid]}). What happens?`,
      options: ['The child takes it and is content', 'Skip the cookie: it is too small'],
      answer: ans,
      explain: ans === 0 ? (s[c] >= g[kid] ? `${s[c]} ≥ ${g[kid]}: it fits, and it is the smallest cookie left, so no bigger cookie is wasted.` : `Their code hands it over although ${s[c]} < ${g[kid]}.`) : s[c] < g[kid] ? `${s[c]} < ${g[kid]}: every other child is at least as greedy, so nobody can use this cookie.` : `Their code skips it although ${s[c]} ≥ ${g[kid]}.`,
    };
  },
  bugs: [
    {
      label: 'Sort the children without a comparator',
      find: 'g.sort((a, b) => a - b);',
      replace: 'g.sort();',
      explain: 'The default sort compares text: [10, 2] stays [10, 2], so the least greedy child is not first and fitting cookies get skipped.',
    },
    {
      label: 'Move to the next child even when the cookie is too small',
      find: 'if (s[cookie] >= g[child]) child++;',
      replace: 'child++;',
      explain: 'Every cookie "satisfies" a child, too small or not: two size-1 cookies for greeds [1, 2, 3] count 2 content children instead of 1.',
    },
  ],
};
