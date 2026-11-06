// Minimum starting nodes via SCC condensation (Kosaraju). Pass 1: a DFS lists nodes in the order they finish.
// Pass 2: walking that list from the end, a search on the reversed arrows paints one strongly connected component
// at a time. Shrinking each component to one district gives a DAG; districts that no arrow from another district
// enters are sources, and each needs its own starting node. Works with comp / scc / id arrays and any marker array
// (hasIncoming, indeg…) indexed by component.
import { changedIdx, row, options } from './util.js';

const isInts = (v) => row(v) && v.length > 0 && v.every(Number.isInteger);
const COMP = /comp|scc|^id$|group|leader|^c?ids?$|color|colour|belong|who/i;
const MARK = /incom|in_?deg|^in$|has|enter|reached|^src|source|indeg|target|fed/i;
const ORDER = /order|finish|post|stack|^st$|topo|^out$/i;
const EDGE = [['u', 'v'], ['a', 'b'], ['from', 'to'], ['x', 'y'], ['src', 'dst'], ['s', 't']];

const compOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && COMP.test(k) && isInts(vars[k]));
const markOf = (vars, params, comp) => Object.keys(vars).find((k) => !params.includes(k) && k !== comp && MARK.test(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every((x) => typeof x === 'boolean' || Number.isInteger(x)));
const edgeOf = (vars) => EDGE.map(([a, b]) => [vars[a], vars[b]]).find(([a, b]) => Number.isInteger(a) && Number.isInteger(b));

export default {
  id: 'classic-scc-condensation-sources',
  metaphor: 'One-way districts and their entry roads',
  caption: 'Nodes that can all reach each other form one district (a strongly connected component). Shrink each district to a dot: districts that no road from another district enters must each get a starting node.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) {
      return `${ctx.value} district${ctx.value === 1 ? ' has' : 's have'} no road coming in from another district: ${ctx.value} starting node${ctx.value === 1 ? '' : 's'}`;
    }
    const cName = compOf(vars, params);
    const comp = cName && vars[cName];
    // condensation: a district gets an entry road
    const mName = comp && markOf(vars, params, cName);
    if (mName && row(prev[mName]) && prev[mName].length === vars[mName].length) {
      const ch = changedIdx(vars[mName], prev[mName]);
      const e = edgeOf(vars);
      if (ch.length === 1 && e) {
        const [u, v] = e;
        return `road ${u} → ${v} leads from district ${comp[u]} into district ${comp[v]}: district ${ch[0]} is not a source`;
      }
    }
    // pass 2: a node is painted into a district
    if (comp && isInts(prev[cName]) && prev[cName].length === comp.length) {
      const ch = changedIdx(comp, prev[cName]);
      if (ch.length === 1) {
        const x = ch[0], d = comp[x];
        const size = comp.filter((y) => y === d).length;
        const kosaraju = Object.keys(vars).some((k) => !params.includes(k) && /order|finish|post/i.test(k) && isInts(vars[k]));
        if (size === 1) return `${x} opens district ${d}${kosaraju ? ': of the unpainted nodes it finished last' : ''}`;
        return `${x} and district ${d}'s first node reach each other: paint ${x} as district ${d} (${size} nodes so far)`;
      }
    }
    // pass 1: a node finishes
    for (const [k, v] of Object.entries(vars)) {
      if (params.includes(k) || k === cName || !ORDER.test(k) || !isInts(v) || !Array.isArray(prev[k])) continue;
      if (v.length === prev[k].length + 1 && prev[k].every((x, i) => x === v[i]) && !/stack|^st$/i.test(k)) {
        return `${v[v.length - 1]} is finished: everything it leads to is explored (finish order: ${v.join(', ')})`;
      }
    }
    // the source count goes up
    const sName = Object.keys(vars).find((k) => !params.includes(k) && /source|^ans|^res|count|^cnt$|starts?$/i.test(k) && Number.isInteger(vars[k]));
    if (sName && mName && Number.isInteger(prev[sName]) && vars[sName] === prev[sName] + 1) {
      const kk = ['k', 'i', 'c', 'd'].find((x) => Number.isInteger(vars[x]));
      return `${kk ? `district ${vars[kk]}` : 'a district'} has no entry road: it needs its own starting node (${vars[sName]} so far)`;
    }
    return null;
  },
  // condensation: does the next road enter a district from outside?
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const nx = ctx.next.vars;
    const cName = compOf(vars, params);
    const mName = cName && markOf(vars, params, cName);
    const e = edgeOf(nx);
    if (!mName || !e || !row(nx[mName]) || nx[mName].length !== vars[mName].length) return null;
    const comp = vars[cName];
    const [u, v] = e;
    if (!Number.isInteger(comp[u]) || !Number.isInteger(comp[v])) return null;
    const same = comp[u] === comp[v];
    if (same && u !== v) return null; // inside a loop: only ask the cases that teach something
    const prevE = edgeOf(vars);
    if (prevE && prevE[0] === u && prevE[1] === v) return null;
    const ch = changedIdx(nx[mName], vars[mName]);
    if (ch.length > 1) return null;
    const marks = ch.length === 1;
    if (marks && ch[0] !== comp[v]) return null;
    const yes = 'Yes: it enters from another district';
    const noIn = 'No: it stays inside one district';
    const already = 'No change: the district is already marked';
    const right = marks ? yes : same ? noIn : already;
    return options(
      `The next road is ${u} → ${v} (district ${comp[u]} → district ${comp[v]}). Does it mark district ${comp[v]} as entered from outside?`,
      right,
      [yes, noIn, already].filter((x) => x !== right),
      same
        ? `${u === v ? 'A self-loop' : 'This road'} starts and ends in district ${comp[v]}, so nobody outside reaches it this way${marks ? ', yet this code marks it' : ''}.`
        : marks
          ? `District ${comp[u]} is a different district, so a start placed there already reaches district ${comp[v]}: it is not a source.`
          : `The road does come from another district, but district ${comp[v]} was already marked by an earlier road, so nothing changes.`,
    );
  },
  bugs: [
    {
      label: 'Count a road inside a district as an entry',
      find: 'if (comp[u] !== comp[v]) hasIncoming[comp[v]] = true;',
      replace: 'hasIncoming[comp[v]] = true;',
      explain: 'Every road inside a loop now marks its own district, so a cycle that nothing enters looks reachable: the pure cycle 0 → 1 → 2 → 0 needs 1 start but gets 0.',
    },
    {
      label: 'Paint districts on the original arrows',
      find: 'for (const v of rg[u])',
      replace: 'for (const v of g[u])',
      explain: 'Pass 2 must follow arrows backwards; following them forwards paints everything a node reaches into its district, so separate districts merge and sources are lost.',
    },
  ],
};
