// Articulation Points (Tarjan low-link). DFS stamps each town with its discovery time; low[u] is the earliest time
// u's subtree can climb back to through one back road. A child whose low is not above disc[u] cannot get around u,
// so u is a cut vertex (the DFS root instead needs two or more children). Reads disc / tin and low arrays by name.
import { row, options } from './util.js';

const DISC = /^(disc|tin|tIn|tin_?|entry|enter|order|num|ids?|pre|times?|dfn|ord|discovery|d)$/i;
const LOW = /^(low|lo|lowlink|lowLink|low_?link|up)$/i;
const CUT = /cut|ap|art|crit|points?|res|ans|out|result/i;
const AT = ['u', 'node', 'cur', 'curr', 'at', 'x', 'v0'];
const NEI = ['v', 'nei', 'next', 'to', 'w', 'nb', 'child', 'y'];

const intRow = (v) => row(v) && v.length > 0 && v.every(Number.isInteger);
const named = (vars, params, re) => Object.keys(vars || {}).find((k) => !params.includes(k) && re.test(k) && intRow(vars[k]));
const pick = (vars, names) => names.find((k) => Number.isInteger(vars?.[k]));
/** the cut vertices so far: a Set, a list, or a flag row under a cut-like name */
function cutOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !CUT.test(k)) continue;
    if (v && v.$set) return new Set(v.$set);
    if (row(v) && v.every((x) => typeof x === 'boolean')) return new Set(v.flatMap((x, i) => (x ? [i] : [])));
    if (row(v) && v.every(Number.isInteger) && !/low|disc/i.test(k)) return new Set(v);
  }
  return null;
}
const isRoot = (vars) => Object.entries(vars).some(([k, v]) => /^(parent|par|p|pe|parentEdge|from|prev|pid|edgeId|via)$/i.test(k) && v === -1);

/** the parts of a Tarjan step, or null when the arrays are not there */
function tarjan(vars, params) {
  const dn = named(vars, params, DISC);
  const ln = named(vars, params, LOW);
  if (!dn || !ln || vars[dn].length !== vars[ln].length) return null;
  const un = pick(vars, AT);
  const vn = pick(vars, NEI);
  return { dn, ln, disc: vars[dn], low: vars[ln], un, vn, u: vars[un], v: vars[vn] };
}

export default {
  id: 'classic-articulation-points',
  metaphor: 'Towns whose closure splits the map',
  caption: 'The DFS stamps each town with the time it was first reached (disc). low = the earliest stamp its subtree can climb back to by a back road. A child that cannot climb above its parent makes the parent a cut vertex.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) {
      return ctx.value.length ? `cut vertices: ${ctx.value.join(', ')}: closing any one of them splits the map` : 'no cut vertex: every town has a detour around it';
    }
    const t = tarjan(vars, params);
    if (!t) return null;
    const pt = tarjan(prev, params);
    const cut = cutOf(vars, params);
    const pcut = cutOf(prev, params);
    // a town joins the cut list
    if (cut && pcut && cut.size === pcut.size + 1) {
      const c = [...cut].find((x) => !pcut.has(x));
      if (Number.isInteger(t.v) && t.u === c && t.low[t.v] >= t.disc[c] && !isRoot(vars)) {
        return `low[${t.v}] = ${t.low[t.v]} ≥ disc[${c}] = ${t.disc[c]}: town ${t.v}'s side cannot reach above ${c} without it, so ${c} is a cut vertex`;
      }
      return isRoot(vars) && t.u === c ? `${c} is the DFS root with 2+ separate subtrees: closing it splits them, so ${c} is a cut vertex` : `town ${c} is a cut vertex`;
    }
    if (!pt || pt.disc.length !== t.disc.length) return null;
    // a town is discovered
    const found = t.disc.findIndex((x, i) => x !== pt.disc[i] && x >= 0);
    if (found >= 0) return `reach town ${found} at time ${t.disc[found]}: disc[${found}] = ${t.disc[found]}, and low starts there too`;
    if (!Number.isInteger(t.u) || !Number.isInteger(t.v) || t.v >= t.disc.length) return null;
    const re = (a, b) => new RegExp(`\\b${a}\\s*\\[\\s*${b}\\s*\\]`).test(ctx.src);
    // after a child returns: low[u] = min(low[u], low[v])
    if (t.vn && re(t.ln, t.vn) && t.disc[t.v] > t.disc[t.u]) {
      const lv = t.low[t.v];
      const du = t.disc[t.u];
      const changed = t.low[t.u] !== pt.low[t.u] ? `; low[${t.u}] drops to ${t.low[t.u]}` : '';
      if (lv < du) return `child ${t.v} came back with low ${lv} < disc[${t.u}] = ${du}: it can climb back above ${t.u}, so no cut here${changed}`;
      return `child ${t.v} came back with low ${lv} ≥ disc[${t.u}] = ${du}: its side cannot get around ${t.u}${isRoot(vars) ? ` (but ${t.u} is the root: only its child count matters)` : ''}${changed}`;
    }
    // a back road to an ancestor: low[u] = min(low[u], disc[v])
    if (t.vn && re(t.dn, t.vn) && re(t.ln, t.un)) {
      if (t.low[t.u] !== pt.low[t.u]) return `back road ${t.u} → ${t.v} (visited at time ${t.disc[t.v]}): low[${t.u}] drops to ${t.low[t.u]}`;
      return `road ${t.u} → ${t.v} leads to a town seen at time ${t.disc[t.v]}, no earlier than low[${t.u}] = ${t.low[t.u]}: low stays`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    if (ctx.next.ret && Array.isArray(ctx.next.value) && ctx.next.value.every(Number.isInteger) && Number.isInteger(ctx.input?.[0])) {
      const val = ctx.next.value;
      const txt = (a) => (a.length ? [...a].sort((x, y) => x - y).join(', ') : 'none');
      const other = [...Array(ctx.input[0]).keys()].find((x) => !val.includes(x));
      const wrong = ['none', other !== undefined ? txt([...val, other]) : null, val.length > 1 ? txt(val.slice(1)) : null].filter(Boolean);
      return options('The DFS is over. Which towns are cut vertices?', txt(val), wrong, val.length ? `Exactly these towns have a child side with no back road above them (or are a root with 2+ children): ${txt(val)}.` : 'Every child side found a back road above its parent, and no root had two children: no cut vertex.');
    }
    const t = tarjan(vars, params);
    const nt = tarjan(ctx.next.vars, params);
    if (!t || !nt || nt.disc.length !== t.disc.length || !Number.isInteger(nt.u) || !Number.isInteger(nt.v) || nt.u !== t.u) return null;
    const { u, v } = nt;
    if (v >= t.disc.length || u >= t.disc.length) return null;
    const nextSrc = ctx.lines[ctx.next.line - 1] || '';
    const re = (a, b) => new RegExp(`\\b${a}\\s*\\[\\s*${b}\\s*\\]`).test(nextSrc);
    const setsLow = new RegExp(`\\b${nt.ln}\\s*\\[\\s*${nt.un}\\s*\\]\\s*=(?!=)`).test(nextSrc); // the next line writes low[u]
    if (!setsLow) return null;
    // back road: what does low[u] become?
    if (nt.vn && re(nt.dn, nt.vn) && re(nt.ln, nt.un) && t.disc[v] >= 0 && t.disc[v] < t.disc[u]) {
      const after = nt.low[u];
      return options(
        `Town ${u} (disc ${t.disc[u]}, low ${t.low[u]}) has a road to town ${v}, already visited at time ${t.disc[v]}. What is low[${u}] now?`,
        after,
        [t.low[u], t.disc[u], t.disc[v], t.low[v]].filter((x) => x !== after),
        `A back road lets ${u} climb to ${v}'s stamp: low[${u}] = min(${t.low[u]}, disc[${v}] = ${t.disc[v]}) = ${after}.`,
      );
    }
    // a child is about to report back: what does low[u] become?
    if (nt.vn && re(nt.ln, nt.vn) && t.disc[v] > t.disc[u] && t.v === v && !re(nt.dn, nt.vn) && !isRoot(vars)) {
      const after = nt.low[u];
      return options(
        `Child ${v} is done: low[${v}] = ${t.low[v]}. Town ${u} has low ${t.low[u]}. What is low[${u}] now?`,
        after,
        [t.low[u], t.low[v], t.disc[u], t.disc[v]].filter((x) => x !== after),
        `Whatever ${v}'s subtree can climb to, ${u} can too: low[${u}] = min(${t.low[u]}, ${t.low[v]}) = ${after}.`,
      );
    }
    return null;
  },
  bugs: [
    {
      label: 'Apply the low test to the root',
      find: 'if (parentEdge !== -1 && low[v] >= disc[u]) cut.add(u);',
      replace: 'if (low[v] >= disc[u]) cut.add(u);',
      explain: 'For the root, low[v] ≥ disc[root] always holds, so every DFS root is reported: in the triangle-with-tail graph 0 shows up as a cut vertex.',
    },
    {
      label: 'Use > (the bridge test) instead of >=',
      find: 'low[v] >= disc[u]',
      replace: 'low[v] > disc[u]',
      explain: 'A child whose subtree climbs back exactly to u still needs u: with a cycle 2-3-4 hanging off 2, town 2 is missed.',
    },
  ],
};
