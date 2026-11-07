// Satisfiability of Equality Equations (union-find). Every "==" puts two letters in one club (clubs merge, and
// equality is transitive); afterwards every "!=" must name two letters from different clubs. Reads the parent row
// from a plain array (parent / par / root…) or a union-find object's parent field, and the equation being read
// from any non-parameter string shaped "x==y" / "x!=y".
import { row, groupsOf, leaderOf, parentOf } from './util.js';

const UNION_CALL = /\b(union|unite|merge|join)\w*\s*\(/i;
const PARENT_WRITE = /\b(par|parent|parents|p|root|roots|fa|leader)\s*\[[^\]]*\]\s*=(?!=)/;
/** a line that joins two clubs: a union call (not its definition) or a parent write outside find */
const isUnionLine = (t) => (UNION_CALL.test(t) && !/function\s|^\s*\w+\s*\([^)]*\)\s*\{/.test(t)) || (PARENT_WRITE.test(t) && !/find/i.test(t));
/** 1-based number of the last line that joins clubs: lines after it belong to the "!=" check pass */
const lastUnion = (lines) => lines.reduce((m, t, i) => (isUnionLine(t) ? i + 1 : m), 0);
const EQ = /^[a-z](==|!=)[a-z]$/;
const L = (i) => String.fromCharCode(97 + i);
const idx = (ch) => ch.charCodeAt(0) - 97;

const eqOf = (vars, params) => Object.entries(vars || {}).find(([k, v]) => !params.includes(k) && typeof v === 'string' && EQ.test(v))?.[1];

/** the letters used in the equations (the only clubs worth naming) */
function lettersOf(ctx) {
  const eqs = ctx.input?.[0];
  const out = new Set();
  if (Array.isArray(eqs)) for (const e of eqs) if (typeof e === 'string' && EQ.test(e)) out.add(idx(e[0])).add(idx(e[3]));
  return out;
}
/** clubs among the used letters: [[members…], …] */
function clubs(p, used) {
  return groupsOf(p).map((g) => g.filter((x) => used.has(x)).sort((a, b) => a - b)).filter((g) => g.length);
}
const clubText = (p, used, x) => `{${clubs(p, used).find((g) => g.includes(x))?.map(L).join(', ') ?? L(x)}}`;
const same = (p, a, b) => a < p.length && b < p.length && leaderOf(p, a) === leaderOf(p, b);

export default {
  id: 'satisfiability-of-equality-equations',
  metaphor: 'Letters joining clubs of equals',
  caption: 'Each tree in the forest is a club of letters forced to be equal. Every "==" merges two clubs; then each "!=" must name letters from two different clubs, or the equations cannot all hold.',
  narrate(ctx) {
    const used = lettersOf(ctx);
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    const eq = eqOf(ctx.vars, ctx.params);
    const [x, y] = eq ? [idx(eq[0]), idx(eq[3])] : [];
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (ctx.value) return 'every "!=" names two letters from different clubs: all equations can hold, true';
      if (eq && eq[1] === '!' && p && same(p, x, y)) {
        return x === y ? `${eq}: a letter can never differ from itself, so false` : `${eq}, but ${L(x)} and ${L(y)} share the club ${clubText(p, used, x)}: impossible, false`;
      }
      return 'a "!=" pair landed inside one club: impossible, false';
    }
    if (!p) return null;
    if (!pp) return `${used.size} letter${used.size === 1 ? '' : 's'} in use, each its own club for now: every "==" will merge two clubs`;
    if (pp.length === p.length) {
      const before = clubs(pp, used).length;
      const after = clubs(p, used).length;
      if (after < before && eq && eq[1] === '=') return `${eq}: their clubs merge into ${clubText(p, used, x)} (${after} club${after === 1 ? '' : 's'} left)`;
      if (after < before) return `two clubs merge (${after} club${after === 1 ? '' : 's'} left)`;
    }
    if (!eq) return null;
    if (eq[1] === '=' && isUnionLine(ctx.src) && same(p, x, y)) return `${eq}: ${L(x)} and ${L(y)} already share a club, nothing changes`;
    // only when the equation just arrived (after a helper call the previous step has no equation: stay quiet)
    const pe = eqOf(ctx.prev, ctx.params);
    if (!pe || pe === eq) return null;
    const pass2 = ctx.line > lastUnion(ctx.lines);
    if (eq[1] === '=') return pass2 ? `${eq}: its clubs are already built; this pass only checks "!="` : null;
    if (!pass2) return `${eq}: skipped for now; "!=" is checked only once every club is built`;
    if (!same(p, x, y)) return `${eq}: ${L(x)} is in ${clubText(p, used, x)}, ${L(y)} in ${clubText(p, used, y)}: different clubs, fine`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const p = parentOf(ctx.vars);
    const np = parentOf(ctx.next.vars);
    const eq = eqOf(ctx.next.vars, ctx.params);
    if (!p || !np || !eq || p.length !== np.length) return null;
    const used = lettersOf(ctx);
    const [x, y] = [idx(eq[0]), idx(eq[3])];
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    // "==": merge, or already one club? (asked when one of the two letters already has company: the transitive case)
    if (eq[1] === '=' && isUnionLine(nextSrc) && x !== y) {
      const big = (z) => (clubs(p, used).find((g) => g.includes(z)) || []).length > 1;
      if (!big(x) && !big(y)) return null;
      const merged = clubs(np, used).length < clubs(p, used).length;
      return {
        question: `Equation ${eq} comes up. What happens to the clubs?`,
        options: ['Two clubs merge into one', `${L(x)} and ${L(y)} are already in one club`],
        answer: merged ? 0 : 1,
        explain: merged ? `${L(x)} and ${L(y)} had different club leaders, so their clubs join: ${clubText(np, used, x)}.` : `Earlier "==" equations already chained ${L(x)} and ${L(y)} together (equality is transitive), so nothing changes.`,
      };
    }
    // "!=": does this one break everything?
    if (eq[1] === '!' && ctx.next.line > lastUnion(ctx.lines) && (ctx.next.ret ? ctx.next.value === false : /return\s+false/.test(nextSrc))) {
      const bad = !!ctx.next.ret;
      return {
        question: `All "==" clubs are built. Now ${eq} is checked: is it a contradiction?`,
        options: ['Yes: return false', 'No: different clubs, keep going'],
        answer: bad ? 0 : 1,
        explain: bad ? `${L(x)} and ${L(y)} ended up in the same club ${clubText(np, used, x)}, so they must be equal: "!=" cannot hold.` : `${L(x)} and ${L(y)} have different club leaders, so they can get different values.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Check "!=" in the same pass as "=="',
      find: "    if (e[1] === '=') uf.union(id(e[0]), id(e[3]));      // pass 1: build groups\n  }\n  for (const e of equations) {\n",
      replace: "    if (e[1] === '=') uf.union(id(e[0]), id(e[3]));\n",
      explain: 'A "!=" checked early can look fine and be broken by a later "==" chain: ["a!=c","a==b","b==c"] is called possible.',
    },
    {
      label: 'Compare the letters, not their clubs',
      find: 'uf.connected(id(e[0]), id(e[3]))',
      replace: 'e[0] === e[3]',
      explain: 'Only "a!=a" is caught: a == b then b != a passes, because equality chains through the clubs, not the letters themselves.',
    },
  ],
};
