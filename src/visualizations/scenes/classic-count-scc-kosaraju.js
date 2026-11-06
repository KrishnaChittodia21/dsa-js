// Count SCCs (Kosaraju). Pass 1 walks the one-way streets forward and writes each node down when it finishes. Pass 2
// takes nodes from the latest finisher down and floods the REVERSED streets: each flood that starts on an unplaced
// node is one strongly connected neighbourhood. Reads the finish list (order / finish / post…), the component
// labels (comp / scc / id…) and the counter by name and shape.
import { row, visitedSet, options } from './util.js';

const ORDER = /order|finish|post|fin|topo|seq|done|out/i;
const STACKISH = /^(stack|st|stk|s1)$/i;
const COMP = /comp|scc|^ids?$|group|label|colou?r|leader|who|belong|^c$/i;
const COUNT = /^(count|cnt|res|ans|num|scc|sccs|total|groups?|k|c)$/i;

const intRow = (v) => row(v) && v.every(Number.isInteger);
const compOf = (vars, params, n) => Object.keys(vars || {}).find((k) => !params.includes(k) && COMP.test(k) && !ORDER.test(k) && intRow(vars[k]) && vars[k].length === n);
/** the finish list: an int row under an order-like name (a plain `stack` counts too while no component labels exist) */
function orderOf(vars, params, n) {
  const ks = Object.keys(vars || {}).filter((k) => !params.includes(k) && intRow(vars[k]) && vars[k].length <= n);
  return ks.find((k) => ORDER.test(k)) || (compOf(vars, params, n) ? undefined : ks.find((k) => STACKISH.test(k)));
}
const counterOf = (vars, params) => Object.keys(vars || {}).find((k) => !params.includes(k) && COUNT.test(k) && Number.isInteger(vars[k]));
/** the labels in use besides the unassigned marker (the value a newly labelled cell had before) */
const labelsIn = (r, blank) => new Set(r.filter((x) => x !== blank));

export default {
  id: 'classic-count-scc-kosaraju',
  metaphor: 'One-way streets: finish order, then reverse',
  caption: 'Pass 1 walks the streets forward and writes each node down when everything after it is explored (finish order). Pass 2 flips every street and floods from the latest finisher: each flood is one neighbourhood (SCC).',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const n = ctx.input?.[0];
    if (!Number.isInteger(n)) return null;
    if (ctx.ret && !ctx.next && Number.isInteger(ctx.value)) return `${ctx.value} neighbourhood${ctx.value === 1 ? '' : 's'} where every node can reach every other: ${ctx.value} SCC${ctx.value === 1 ? '' : 's'}`;
    // pass 2: labels
    const cName = compOf(vars, params, n);
    if (cName && intRow(prev[cName]) && prev[cName].length === n) {
      const now = vars[cName];
      const was = prev[cName];
      const ch = now.map((x, i) => (x === was[i] ? -1 : i)).filter((i) => i >= 0);
      if (ch.length === 1) {
        const x = ch[0];
        const blank = was[x];
        const labels = labelsIn(now, blank);
        const fresh = !was.includes(now[x]);
        if (fresh) return `on the reversed streets: node ${x}, the latest finisher not yet placed, starts SCC #${labels.size}`;
        return `a reversed street reaches node ${x}: it joins SCC #${[...labels].indexOf(now[x]) + 1}`;
      }
    }
    const kName = counterOf(vars, params);
    if (cName && kName && Number.isInteger(prev[kName]) && vars[kName] === prev[kName] + 1) {
      return `SCC count is now ${vars[kName]}: each flood from an unplaced node is one more neighbourhood`;
    }
    // pass 1: finish order
    const oName = orderOf(vars, params, n);
    const o = oName && vars[oName];
    const po = oName && intRow(prev[oName]) ? prev[oName] : null;
    if (o && po && o.length === po.length + 1 && !cName) {
      const u = o[o.length - 1];
      return `node ${u} finishes: every street out of it is explored. Finish order so far: ${o.join(', ')}`;
    }
    if (!cName) {
      const seen = visitedSet(vars);
      const pseen = visitedSet(prev);
      const fresh = [...seen].filter((x) => !pseen.has(x));
      if (fresh.length === 1 && pseen.size + 1 === seen.size) return `pass 1 follows the streets forward to node ${fresh[0]} (${seen.size} of ${n} reached)`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const n = ctx.input?.[0];
    const edges = ctx.input?.[1];
    if (!Number.isInteger(n) || !Array.isArray(edges)) return null;
    const nv = ctx.next.vars;
    // the very first finisher
    const oName = orderOf(nv, params, n);
    if (oName && !compOf(nv, params, n) && intRow(vars[oName]) && vars[oName].length === 0 && nv[oName].length === 1) {
      const first = nv[oName][0];
      const seen = [...visitedSet(vars)];
      return options(
        `Pass 1 has walked forward to ${seen.length ? `nodes ${seen.sort((a, b) => a - b).join(', ')}` : 'some nodes'}. Which node finishes first?`,
        first,
        seen.filter((x) => x !== first).slice(0, 3),
        `Node ${first} is the first one with no unexplored street left: it is written down first (finish order starts ${first}).`,
      );
    }
    // pass 2: who joins the current SCC?
    const cName = compOf(vars, params, n);
    if (cName && intRow(nv[cName]) && nv[cName].length === n) {
      const now = vars[cName];
      const nx = nv[cName];
      const ch = nx.map((x, i) => (x === now[i] ? -1 : i)).filter((i) => i >= 0);
      // asked for the first node to join each SCC after its starter
      if (ch.length === 1 && now.filter((l) => l === nx[ch[0]]).length === 1) {
        const x = ch[0];
        const blank = now[x];
        const members = now.flatMap((l, i) => (l === nx[x] ? [i] : []));
        const back = [...new Set(edges.filter((e) => members.includes(e[1])).map((e) => e[0]))].filter((y) => y !== x);
        const unplaced = now.flatMap((l, i) => (l === blank && i !== x ? [i] : []));
        const wrong = [...back.filter((y) => !members.includes(y)), ...unplaced].filter((y, i, a) => a.indexOf(y) === i).slice(0, 3);
        const k = [...labelsIn(now, blank)].indexOf(nx[x]) + 1;
        return options(
          `Pass 2 floods the reversed streets from SCC #${k} (nodes ${members.join(', ')}). Which node joins it next?`,
          x,
          wrong,
          `Node ${x} has a street into the neighbourhood and is not placed yet, so the reversed flood reaches it: it joins SCC #${k}.`,
        );
      }
    }
    // the count
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && cName) {
      const v = ctx.next.value;
      return options('Pass 2 is over. How many SCCs are there?', v, [v - 1, v + 1, n].filter((x) => x > 0 && x !== v), `Each flood on the reversed streets that started from an unplaced node was one SCC: ${v} floods.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Flood the original streets in pass 2',
      find: 'for (const v of rg[u])',
      replace: 'for (const v of g[u])',
      explain: 'Forward from the latest finisher, the flood also runs downstream into other neighbourhoods: 0→1→2→0 plus 3⇄4 is counted as one SCC.',
    },
    {
      label: 'Pass 2 in increasing finish order',
      find: 'for (let i = n - 1; i >= 0; i--)',
      replace: 'for (let i = 0; i < n; i++)',
      explain: 'Starting from the earliest finisher (a sink side), the reversed flood climbs back up into upstream neighbourhoods and merges them.',
    },
  ],
};
