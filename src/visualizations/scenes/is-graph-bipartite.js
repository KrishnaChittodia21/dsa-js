// Is Graph Bipartite? Two teams: every edge must join players of different teams. Colouring one node forces its
// neighbours onto the other team; a neighbour already on the SAME team is an odd loop, and the split is impossible.
// Works with a colour array (-1 / 0 / 1, or 0 / 1 / -1, or null for "no team yet") or a colour Map; BFS or DFS.
import { firstInt, row } from './util.js';

const COLOR = /colou?r|side|team|part/i;
const AT = ['u', 'node', 'cur', 'curr', 'current'];
const NB = ['v', 'nei', 'nb', 'next', 'neighbor', 'neighbour', 'w', 'to'];

/** Map node → 'A' | 'B' (A = the team of the first node coloured), or null when no colour store is found */
function teams(vars, lines, params) {
  const e = Object.entries(vars || {}).find(([k, v]) => COLOR.test(k) && !params.includes(k) && (row(v) || (v && v.$map)));
  if (!e) return null;
  const v = e[1];
  let pairs;
  if (v.$map) pairs = v.$map.filter(([, x]) => x !== null && x !== undefined);
  else {
    const unc = v.some((x) => x === null) ? null : /fill\(\s*-1\s*\)/.test(lines.join('\n')) ? -1 : 0;
    pairs = v.map((x, i) => [i, x]).filter(([, x]) => x !== unc && x !== null);
  }
  const out = new Map();
  if (!pairs.length) return out;
  const a = pairs[0][1];
  for (const [k, x] of pairs) out.set(k, x === a ? 'A' : 'B');
  return out;
}
const other = (t) => (t === 'A' ? 'B' : 'A');
const adjOf = (vars, name) => (Array.isArray(vars[name]) && vars[name].every((r) => row(r)) ? vars[name] : null);

export default {
  id: 'is-graph-bipartite',
  metaphor: 'Two teams, rivals on every edge',
  caption: 'Each coloured node has joined team A or team B. A node forces all its neighbours onto the other team; two neighbours on the same team mean an odd loop, so no split exists.',
  narrate(ctx) {
    const g = adjOf(ctx.vars, ctx.params[0]);
    const t = teams(ctx.vars, ctx.lines, ctx.params);
    if (!g || !t) return null;
    const [uName, u] = firstInt(ctx.vars, AT);
    const [vName, v] = firstInt(ctx.vars, NB);
    if (ctx.ret && ctx.value === false) {
      if (uName && vName && t.has(u) && t.get(u) === t.get(v) && g[u]?.includes(v)) return `${u} and ${v} are neighbours but both on team ${t.get(u)}: an odd loop, so no split works → false`;
      return ctx.next ? 'a clash was found deeper: false is passed back up' : 'two neighbours ended on the same team: not bipartite → false';
    }
    if (ctx.ret && ctx.value === true && !ctx.next) {
      const of = (x) => [...t].filter(([, s]) => s === x).map(([k]) => k).join(', ');
      return `every edge joins the two teams: A = {${of('A')}}, B = {${of('B')}} → bipartite`;
    }
    if (ctx.ret && ctx.value === true && uName && t.has(u)) return `every neighbour of ${u} fits the rule: no clash below ${u}, true goes back up`;
    const tp = teams(ctx.prev, ctx.lines, ctx.params);
    if (tp) {
      const fresh = [...t.keys()].filter((k) => !tp.has(k));
      if (fresh.length === 1) {
        const x = fresh[0];
        const by = (g[x] || []).find((y) => tp.has(y) && tp.get(y) !== t.get(x));
        if (by !== undefined) return `${x} is a neighbour of ${by} (team ${tp.get(by)}): it is forced onto team ${t.get(x)}`;
        return `${x} has no team yet and no coloured neighbour: a new group starts, ${x} joins team ${t.get(x)}`;
      }
    }
    if (uName && u !== ctx.prev[uName] && t.has(u) && g[u]) {
      // a fresh pick (const u = queue…) vs. coming back from a deeper DFS call
      if (new RegExp(`\\b${uName}\\s*=`).test(ctx.src)) return `${u} (team ${t.get(u)}) checks its neighbours ${g[u].join(', ') || '(none)'}: they all belong on team ${other(t.get(u))}`;
      return `back at ${u} (team ${t.get(u)}): go on with its other neighbours`;
    }
    if (uName && vName && v !== ctx.prev[vName] && t.has(u) && t.has(v) && t.get(u) !== t.get(v)) return `${v} is already on team ${t.get(v)}, the rival of ${u}: this edge is fine`;
    return null;
  },
  // a node meets a neighbour: forced colour, fine, or a clash?
  predict(ctx) {
    if (!ctx.next) return null;
    const g = adjOf(ctx.vars, ctx.params[0]);
    const t = teams(ctx.vars, ctx.lines, ctx.params);
    const tn = teams(ctx.next.vars, ctx.lines, ctx.params);
    const [uName, u] = firstInt(ctx.vars, AT);
    const [vName, v] = firstInt(ctx.next.vars, NB);
    if (!g || !t || !tn || !uName || !vName || ctx.next.vars[uName] !== u || !t.has(u) || !g[u]?.includes(v)) return null;
    if (vName in ctx.vars && ctx.vars[vName] === v) return null; // same neighbour still on screen
    const fresh = [...tn.keys()].filter((k) => !t.has(k));
    let ans;
    if (fresh.length === 1 && fresh[0] === v && !t.has(v)) {
      if (t.size > 1) return null; // forced colouring is asked once, on the first edge
      ans = 0;
    } else if (!fresh.length && t.has(v) && t.get(v) === t.get(u) && ctx.next.ret && ctx.next.value === false) ans = 1;
    else if (!fresh.length && t.has(v) && t.get(v) !== t.get(u) && !ctx.next.ret) ans = 2;
    else return null;
    const side = t.has(v) ? `team ${t.get(v)}` : 'no team yet';
    return {
      question: `${u} is on team ${t.get(u)} and looks at its neighbour ${v} (${side}). What happens?`,
      options: [`Colour ${v}: it must take team ${other(t.get(u))}`, `Clash: same team on both ends → not bipartite`, `Nothing: ${v} is already a rival, the edge is fine`],
      answer: ans,
      explain: ['An uncoloured neighbour has only one legal choice: the other team.', `${u} and ${v} share an edge and a team: the loop through them has odd length, so no split can work.`, `${v} is already on the other team, exactly where it must be.`][ans],
    };
  },
  bugs: [
    {
      label: 'Start only from node 0',
      find: 'for (let s = 0; s < n; s++) {',
      replace: 'for (let s = 0; s < 1; s++) {',
      explain: 'The graph may be in pieces. Colouring only the group around node 0 never looks at the others, so a triangle elsewhere is missed.',
    },
    {
      label: 'Test "no team yet" with !color[v]',
      find: 'if (color[v] === -1) {',
      replace: 'if (!color[v]) {',
      explain: 'Team 0 is a real team, and -1 ("no team") is truthy: uncoloured neighbours are never coloured and team-0 nodes look free, so clashes go unseen.',
    },
  ],
};
