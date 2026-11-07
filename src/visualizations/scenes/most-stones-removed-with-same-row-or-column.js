// Most Stones Removed (union-find or DFS). Stones that share a row or a column are tied together; inside one tied
// group every stone but the last can be removed, so the answer is stones − groups. Reads the stone on screen
// (r / c), a union-find parent row (by stone index; a row/column DSU of 20 000 ids is cut off, so only its stones
// are narrated), the Set of group leaders or a group counter.
import { firstInt, options, row, parentOf } from './util.js';

const COUNT = ['groups', 'components', 'comps', 'count', 'cnt', 'islands', 'num', 'k'];

const trees = (p) => p.filter((x, i) => x === i).length;
/** [name, size] of a Set of group leaders (not a parameter) */
const leadersOf = (ctx, vars) => Object.entries(vars).filter(([k, v]) => !ctx.params.includes(k) && v && v.$set && /group|root|leader|comp|uniq|set|seen/i.test(k)).map(([k, v]) => [k, v.$size])[0];
const s = (k) => (k === 1 ? '' : 's');

export default {
  id: 'most-stones-removed-with-same-row-or-column',
  metaphor: 'Stones tied by rows and columns',
  caption: 'Stones on one row or one column are tied into a group. A group can be cleared down to its last stone, so each group keeps exactly one: the answer is stones minus groups.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const stones = ctx.vars[sName];
    const N = Array.isArray(stones) ? stones.length : undefined;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value) && N !== undefined) {
      const g = N - ctx.value;
      return `${N} stone${s(N)} in ${g} group${s(g)}: each group keeps one stone, so ${ctx.value} can be removed`;
    }
    if (!Array.isArray(stones)) return null;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    if (p && pp && p.length === pp.length && p.length === N && trees(p) < trees(pp)) {
      const moved = p.findIndex((x, i) => x !== pp[i]);
      const at = (i) => (stones[i] ? `(${stones[i][0]}, ${stones[i][1]})` : i);
      return `the groups of stones ${at(moved)} and ${at(p[moved])} share a row or a column: tied into one (${trees(p)} group${s(trees(p))} left)`;
    }
    const lead = leadersOf(ctx, ctx.vars);
    const plead = lead && leadersOf(ctx, ctx.prev);
    if (lead && plead && plead[0] === lead[0] && lead[1] === plead[1] + 1) return `a stone with a leader not seen yet: a new group (${lead[1]} so far)`;
    const [cName, k] = firstInt(ctx.vars, COUNT.filter((x) => !ctx.params.includes(x)));
    if (cName && Number.isInteger(ctx.prev[cName]) && k === ctx.prev[cName] + 1 && !p) return `a stone not reached yet starts a new group (${k} so far)`;
    const { r, c } = ctx.vars;
    if (Number.isInteger(r) && Number.isInteger(c) && (r !== ctx.prev.r || c !== ctx.prev.c) && /union/.test(ctx.src)) return `stone at row ${r}, column ${c}: ties row ${r} and column ${c} into one group`;
    return null;
  },
  // right before the final return: how many stones can go?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    // counting leaders: does the next stone (another row) bring a new leader?
    const lead = leadersOf(ctx, ctx.vars);
    const nlead = lead && leadersOf(ctx, nx.vars);
    const [r, nr] = [ctx.vars.r, nx.vars.r];
    if (lead && nlead && nlead[0] === lead[0] && lead[1] === 1 && Number.isInteger(r) && Number.isInteger(nr) && nr !== r && nlead[1] - lead[1] <= 1) {
      const fresh = nlead[1] > lead[1];
      return {
        question: `The next stone is in row ${nr}. Does its group leader add a new group to the set?`,
        options: ['Yes: a new group', 'No: its group is already counted'],
        answer: fresh ? 0 : 1,
        explain: fresh ? `No stone counted so far shares a row or column chain with row ${nr}: its leader is new.` : `Row ${nr} is tied (through shared rows and columns) to a group already counted: same leader.`,
      };
    }
    if (!nx.ret || !Number.isInteger(nx.value) || !/^\s*return\b[^;]*-/.test(ctx.lines[nx.line - 1] || '')) return null;
    const stones = ctx.vars[ctx.params[0]];
    if (!Array.isArray(stones) || !stones.length) return null;
    const N = stones.length;
    const right = nx.value;
    const g = N - right;
    return options(`${N} stone${s(N)}, tied by shared rows and columns into groups. How many stones can be removed?`, right, [N, g, N - 1, 0].filter((x) => x !== right && x >= 0), `There are ${g} group${s(g)}; every group can be cleared down to one stone, so ${N} − ${g} = ${N - g}.`);
  },
  bugs: [
    {
      label: 'No column offset',
      find: 'uf.union(r, c + OFFSET)',
      replace: 'uf.union(r, c)',
      explain: 'Row 3 and column 3 become the same id, so stones at [3, 7] and [5, 3] look tied although they share no line.',
    },
    {
      label: 'Count every id as a group',
      find: 'return stones.length - groups.size;',
      replace: 'return stones.length - uf.count;',
      explain: 'The DSU holds 20 002 row and column ids, most of them with no stone: counting them all as groups makes the answer hugely negative.',
    },
  ],
};
