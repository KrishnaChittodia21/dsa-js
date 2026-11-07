// Sort Items by Groups Respecting Dependencies (two topological sorts). Items are tasks, groups are teams: every
// ungrouped task gets a team of its own, the tasks are ordered by their rules, the teams by the rules that cross
// teams, and each team then ships its tasks as one block. Works with the reference's names and close variants
// (g / groupId, itemAdj / groupAdj, itemIn / groupIn / indeg, itemOrder / groupOrder, buckets, result / ans).
import { changedIdx, row } from './util.js';

const isInts = (v) => !!row(v) && v.every((x) => Number.isInteger(x));
const isAdj = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => isInts(r));
const list = (a) => (a.length ? a.join(', ') : 'none');
// the team of every item: a working copy of `group` (no -1 left), else the parameter itself
function teamsOf(ctx) {
  const [nName, , gName] = ctx.params;
  const n = ctx.vars[nName];
  const own = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && /^g$|grp|group|team/i.test(k) && isInts(ctx.vars[k]) && ctx.vars[k].length === n && ctx.vars[k].every((x) => x >= 0));
  return row(ctx.vars[own]) || row(ctx.vars[gName]);
}
// the row of an adjacency list that grew by one entry: [name, from, to]
function newEdge(vars, prev, re) {
  for (const k of Object.keys(vars)) {
    if (!re.test(k) || !isAdj(vars[k]) || !isAdj(prev[k]) || vars[k].length !== prev[k].length) continue;
    const i = vars[k].findIndex((r, j) => r.length === prev[k][j].length + 1);
    if (i >= 0) return [k, i, vars[k][i][vars[k][i].length - 1]];
  }
  return null;
}
const GROUP_ADJ = /(group|grp|team).*(adj|graph|edges)|^gadj|^gg$/i;
const ITEM_ADJ = /(item|task).*(adj|graph|edges)|^iadj|^ig$/i;

export default {
  id: 'sort-items-by-groups-respecting-dependencies',
  metaphor: 'Teams shipping their tasks in blocks',
  caption: 'Each item is a task and each group a team; a lone task forms a team of its own. Tasks are ordered by their rules, teams by the rules that cross teams, and each team ships its tasks together.',
  narrate(ctx) {
    const [nName, mName, gName] = ctx.params;
    const n = ctx.vars[nName];
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) {
      return ctx.value.length ? `every rule holds and every team's tasks sit together: ${list(ctx.value)}` : 'some rules form a cycle (tasks or teams waiting on each other): no valid order, return []';
    }
    // ungrouped items get their own team
    for (const k of Object.keys(ctx.vars)) {
      const now = row(ctx.vars[k]);
      const before = row(ctx.prev[k]);
      if (!now || !before || now.length !== n || before.length !== n || !/^g$|grp|group|team/i.test(k)) continue;
      const ch = changedIdx(now, before);
      if (ch.length === 1 && before[ch[0]] === -1) return `item ${ch[0]} has no group: it gets a team of its own, team ${now[ch[0]]}`;
    }
    const teams = teamsOf(ctx);
    const ge = newEdge(ctx.vars, ctx.prev, GROUP_ADJ);
    if (ge) return `that rule crosses teams: team ${ge[1]} must ship before team ${ge[2]}`;
    const ie = newEdge(ctx.vars, ctx.prev, ITEM_ADJ);
    if (ie) {
      const [, b, i] = ie;
      return `rule: item ${b} before item ${i}${teams ? ` (team ${teams[b]} → team ${teams[i]})` : ''}`;
    }
    // the two sorted orders and the final blocks
    for (const k of Object.keys(ctx.vars)) {
      if (k in ctx.prev && JSON.stringify(ctx.prev[k]) === JSON.stringify(ctx.vars[k])) continue;
      if (/item.*order|order.*item/i.test(k)) return ctx.vars[k] === null ? 'the item rules form a cycle: no order exists' : isInts(ctx.vars[k]) ? `items in rule order: ${list(ctx.vars[k])}` : null;
      if (/(group|team|grp).*order|order.*(group|team)/i.test(k)) return ctx.vars[k] === null ? 'the team rules form a cycle: no order exists' : isInts(ctx.vars[k]) ? `teams in rule order: ${list(ctx.vars[k])}` : null;
    }
    const bName = Object.keys(ctx.vars).find((k) => /bucket|block|byGroup|members/i.test(k) && isAdj(ctx.vars[k]));
    const be = bName && newEdge(ctx.vars, ctx.prev, new RegExp(`^${bName}$`));
    if (be) return `item ${be[2]} joins team ${be[1]}'s block (blocks keep the rule order)`;
    const rName = Object.keys(ctx.vars).find((k) => /^res|^ans|^answer/i.test(k) && isInts(ctx.vars[k]));
    if (rName && isInts(ctx.prev[rName]) && ctx.vars[rName].length === ctx.prev[rName].length + 1) {
      const it = ctx.vars[rName][ctx.vars[rName].length - 1];
      return `${teams ? `team ${teams[it]}'s turn: ` : ''}item ${it} ships (${ctx.vars[rName].length} of ${n})`;
    }
    // inside a Kahn helper: a vertex with nothing left to wait for joins the order
    const oName = Object.keys(ctx.vars).find((k) => /^order$|^topo$|^sorted$|^out$/i.test(k) && isInts(ctx.vars[k]));
    if (oName && isInts(ctx.prev[oName]) && ctx.vars[oName].length === ctx.prev[oName].length + 1) {
      const sz = ['size', 'count', 'len', 'total'].map((k) => ctx.vars[k]).find(Number.isInteger);
      return `${ctx.vars[oName][ctx.vars[oName].length - 1]} waits on nothing now: it joins the order (${ctx.vars[oName].length}${sz ? ` of ${sz}` : ''})`;
    }
    // a waiting count drops without the vertex being free yet
    const dName = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && /^indeg|^in$|deg/i.test(k) && isInts(ctx.vars[k]) && isInts(ctx.prev[k]) && ctx.vars[k].length === ctx.prev[k].length);
    const dch = dName ? changedIdx(ctx.vars[dName], ctx.prev[dName]) : [];
    if (dch.length === 1 && ctx.vars[dName][dch[0]] < ctx.prev[dName][dch[0]]) return ctx.vars[dName][dch[0]] === 0 ? `the last thing ${dch[0]} waited on is placed: it is free now` : `one thing ${dch[0]} waits on is placed: it still waits on ${ctx.vars[dName][dch[0]]}`;
    void mName;
    void gName;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [, , , bName] = ctx.params;
    const before = ctx.vars[bName];
    const teams = teamsOf(ctx);
    // a rule just became an item edge: does it add a team edge too? (asked on each item's first rule only)
    const ie = newEdge(ctx.vars, ctx.prev, ITEM_ADJ);
    const ieIn = Object.keys(ctx.vars).find((k) => /item.*in|item.*deg|^iin$/i.test(k) && isInts(ctx.vars[k]) && isInts(ctx.prev[k]) && changedIdx(ctx.vars[k], ctx.prev[k]).length === 1);
    if ((ie || ieIn) && teams && Array.isArray(before)) {
      const nextGroupEdge = newEdge(ctx.next.vars, ctx.vars, GROUP_ADJ);
      const i = ie ? ie[2] : changedIdx(ctx.vars[ieIn], ctx.prev[ieIn])[0];
      const b = ['b', 'p', 'pre', 'prev', 'before', 'dep', 'j', 'from'].map((k) => ctx.vars[k]).find(Number.isInteger);
      // only the first rule of the first and the last item that have rules: leaves room for the other question
      const withRules = before.map((r, k) => (row(r) && r.length ? k : -1)).filter((k) => k >= 0);
      if (!Number.isInteger(i) || !Number.isInteger(b) || !row(before[i]) || before[i][0] !== b || (i !== withRules[0] && i !== withRules[withRules.length - 1])) return null;
      if (ie && !ieIn && newEdge(ctx.next.vars, ctx.vars, ITEM_ADJ) === null && !nextGroupEdge) return null; // the in-count is the next step: half done
      const crosses = !!nextGroupEdge;
      if (crosses !== (teams[b] !== teams[i])) return null;
      return {
        question: `Rule: item ${b} (team ${teams[b]}) before item ${i} (team ${teams[i]}). Does it also add a rule between teams?`,
        options: ['Yes: one team must ship before the other', 'No: it stays inside one team'],
        answer: crosses ? 0 : 1,
        explain: crosses ? `The items are in different teams, so team ${teams[b]} must ship its block before team ${teams[i]}.` : `Both items are in team ${teams[b]}: the item order handles it. A team → same-team edge would look like a cycle.`,
      };
    }
    // a waiting count drops: is that vertex free now?
    for (const k of Object.keys(ctx.vars)) {
      if (!/in|deg/i.test(k) || ctx.params.includes(k)) continue;
      const d = ctx.vars[k];
      const nd = ctx.next.vars[k];
      if (!isInts(d) || !isInts(nd) || d.length !== nd.length) continue;
      const ch = changedIdx(nd, d);
      if (ch.length !== 1 || nd[ch[0]] !== d[ch[0]] - 1) continue;
      const c = ch[0];
      return {
        question: `Something that ${c} waits on was just placed (${k}[${c}] = ${d[c]}). Is ${c} free to join the order now?`,
        options: ['Yes: nothing left to wait for', 'No: it still waits on another'],
        answer: nd[c] === 0 ? 0 : 1,
        explain: nd[c] === 0 ? `${k}[${c}] drops to 0, so ${c} joins the order.` : `${k}[${c}] drops ${d[c]} → ${nd[c]}: still waiting.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Team edges for rules inside one team',
      find: 'if (g[b] !== g[i]) { groupAdj[g[b]].push(g[i]); groupIn[g[i]]++; }',
      replace: '{ groupAdj[g[b]].push(g[i]); groupIn[g[i]]++; }',
      explain: 'A rule between two tasks of the same team adds a team → itself edge. That team then waits on itself forever, so a valid input looks like a cycle and returns [].',
    },
    {
      label: 'One item-level sort only',
      find: 'for (const grp of groupOrder) for (const item of buckets[grp]) result.push(item);',
      replace: 'for (const item of itemOrder) result.push(item);',
      explain: 'Sorting only the items keeps every rule but lets teams interleave: a team\'s tasks no longer sit next to each other.',
    },
  ],
};
