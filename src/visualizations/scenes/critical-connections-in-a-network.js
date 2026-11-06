// Critical Connections in a Network (bridges, Tarjan low-link). The DFS stamps each server with the time it was
// reached (disc); low[u] is the earliest stamp u's side of the tree can climb back to without the cable it came in
// on. When a child c finishes and low[c] > disc[p], the cable p–c is the only way back: it is critical. Works with
// the iterative frame stack or recursion; disc / low found from the Math.min lines, the answer list by shape.
import { changedIdx, row } from './util.js';

const MIN = /(\w+)\[(\w+)\]\s*=\s*Math\.min\(\s*\1\[\2\]\s*,\s*(\w+)\[(\w+)\]\s*\)/;
const isInts = (v) => row(v) && v.length > 0 && v.every(Number.isInteger);
const isPairs = (v) => Array.isArray(v) && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger));

/** { low, disc } array names: from `low[u] = Math.min(low[u], disc[v])` in the code, else by name */
function names(ctx) {
  let low, disc;
  for (const l of ctx.lines) {
    const m = l.match(MIN);
    if (!m) continue;
    low = m[1];
    if (m[3] !== m[1]) disc = m[3];
  }
  const keys = Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && isInts(ctx.vars[k]));
  low = low || keys.find((k) => /^low/i.test(k));
  disc = disc || keys.find((k) => k !== low && /disc|tin|^ids?$|order|dfn|entry|^num|stamp/i.test(k));
  return isInts(ctx.vars[low]) && isInts(ctx.vars[disc]) ? { low, disc } : null;
}
const resultOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && /bridge|^res|^ans|crit|^out|cable|edges?$/i.test(k) && isPairs(vars[k]));

/** at a `low[p] = Math.min(low[p], low[c])` step: { p, c } */
function childBack(ctx, nm) {
  const m = (ctx.src || '').match(MIN);
  if (!m || m[1] !== nm.low || m[3] !== nm.low) return null;
  const p = ctx.vars[m[2]], c = ctx.vars[m[4]];
  return Number.isInteger(p) && Number.isInteger(c) ? { p, c } : null;
}

export default {
  id: 'critical-connections-in-a-network',
  metaphor: 'Cables with no way around them',
  caption: 'The search stamps each server with the time it was reached (disc). low is the earliest stamp its side can climb back to without its own cable: if a child cannot climb above its parent, that cable is critical. Numbers on the cables are their ids.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const rName = resultOf(vars, params);
    if (ctx.ret && !ctx.next && isPairs(ctx.value)) {
      const list = ctx.value.map(([a, b]) => `${a}–${b}`).join(', ');
      return ctx.value.length ? `${ctx.value.length} critical cable${ctx.value.length === 1 ? '' : 's'}: ${list}; every other cable lies on a loop` : 'no critical cables: every cable lies on a loop, so cutting any one leaves a way around';
    }
    const nm = names(ctx);
    if (!nm) return null;
    const low = vars[nm.low], disc = vars[nm.disc];
    // a cable joined the answer
    if (rName && isPairs(prev[rName]) && vars[rName].length === prev[rName].length + 1) {
      const [a, b] = vars[rName][vars[rName].length - 1];
      const [p, c] = disc[a] <= disc[b] ? [a, b] : [b, a];
      return `low[${c}] = ${low[c]} > disc[${p}] = ${disc[p]}: the cable ${p}–${c} is the only way back, so it is critical`;
    }
    const back = childBack(ctx, nm);
    if (back) {
      const { p, c } = back;
      return `server ${c} is finished: its side climbs back to time ${low[c]}, so low[${p}] = ${low[p]}`;
    }
    const m = (ctx.src || '').match(MIN);
    if (m && m[1] === nm.low && m[3] === nm.disc && Number.isInteger(vars[m[2]]) && Number.isInteger(vars[m[4]])) {
      const u = vars[m[2]], v = vars[m[4]];
      const dropped = isInts(prev[nm.low]) && prev[nm.low][u] > low[u];
      if (disc[v] > disc[u]) return `${u} sees ${v} again, a server it reached itself later: no way up there, low[${u}] stays ${low[u]}`;
      return `${u} sees ${v} (reached earlier, at time ${disc[v]}) by another cable: ${dropped ? `low[${u}] drops to ${low[u]}` : `low[${u}] stays ${low[u]}`}`;
    }
    if (isInts(prev[nm.disc])) {
      const ch = changedIdx(disc, prev[nm.disc]);
      if (ch.length === 1) return `server ${ch[0]} is reached at time ${disc[ch[0]]}: disc = low = ${disc[ch[0]]} until a way back is found`;
    }
    return null;
  },
  // when a child finishes: is the cable to it critical?
  predict(ctx) {
    if (!ctx.next) return null;
    const nm = names(ctx);
    const rName = nm && resultOf(ctx.vars, ctx.params);
    const back = rName && childBack(ctx, nm);
    const after = back && ctx.next.vars[rName];
    if (!back || !isPairs(after)) return null;
    const { p, c } = back;
    const before = ctx.vars[rName];
    let yes;
    if (after.length === before.length + 1) {
      const last = after[after.length - 1];
      if (!last.includes(p) || !last.includes(c)) return null;
      yes = true;
    } else if (after.length === before.length) yes = false;
    else return null;
    const lc = ctx.vars[nm.low][c], dp = ctx.vars[nm.disc][p];
    const normal = yes === lc > dp;
    return {
      question: `Server ${c} is done: its side climbs back at best to time low[${c}] = ${lc}; server ${p} was reached at disc[${p}] = ${dp}. Is the cable ${p}–${c} critical?`,
      options: [`Yes: ${c}'s side has no other way back`, `No: there is a way around it`],
      answer: yes ? 0 : 1,
      explain: !normal
        ? `This code ${yes ? 'marks' : 'does not mark'} it (low[${c}] = ${lc}, disc[${p}] = ${dp}).`
        : yes
          ? `low[${c}] = ${lc} > disc[${p}] = ${dp}: nothing below ${p} reaches ${p} or higher except through this cable.`
          : `low[${c}] = ${lc} ≤ disc[${p}] = ${dp}: some cable from ${c}'s side reaches ${p} or above, so cutting ${p}–${c} leaves a way around.`,
    };
  },
  bugs: [
    {
      label: 'low >= disc: the cut-vertex test, not the bridge test',
      find: 'if (low[u] > disc[p])',
      replace: 'if (low[u] >= disc[p])',
      explain: 'low[c] = disc[p] means c\'s side climbs back to p itself by another cable, which is a way around. With >= every cable of a loop that returns exactly to p is reported critical.',
    },
    {
      label: 'Forget to skip the cable you came in on',
      find: 'if (id === frame[1]) continue;',
      replace: '',
      explain: 'The child sees its parent through the cable it arrived on and counts it as a way back, so low[c] ≤ disc[p] always and no cable is ever critical.',
    },
  ],
};
