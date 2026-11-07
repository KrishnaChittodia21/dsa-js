// Find Eventual Safe States: a node is safe when every road out of it ends at a dead end (a node with no
// arrows). DFS colouring: grey = on the current walk (or proven unsafe), black = safe; a grey node seen again
// means the walk went round a loop. Also narrates Kahn on the reversed graph (out-degree counts reaching 0).
import { changedIdx, entriesOf, row, itemsOf } from './util.js';

const COLOR = /colou?r|state|status|mark|visit|seen|memo/i;
const GREY = /visiting|path|grey|gray|active|instack|inprogress|onstack|unsafe/i;
const BLACK = /done|finished|checked|black|^safe|good|ok/i;
const DEG = /out|deg|count|left|remain|pending/i;
const RESULT = /^res|result|^ans|answer|^safe|list|^out$/i;
const MEMO = /memo|known|cache|safe|^dp$|done|status/i;
const AT = ['u', 'node', 'cur', 'curr', 'v', 'x', 'i'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const nodeOf = (vars) => AT.find((k) => Number.isInteger(vars[k]));

/** node → 'grey' | 'black' from a 0/1/2 colour array or visiting / safe Sets; null when there is no colouring */
function colours(vars, params) {
  const out = new Map();
  out.names = [];
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k)) continue;
    if (COLOR.test(k) && row(v) && v.length > 0 && v.every((x) => x === 0 || x === 1 || x === 2) && v.some((x) => x > 0)) {
      out.names.push(k);
      v.forEach((x, i) => x && out.set(i, x === 1 ? 'grey' : 'black'));
    } else if (v && v.$set && GREY.test(k)) {
      out.names.push(k);
      v.$set.forEach((x) => out.get(x) !== 'black' && out.set(x, 'grey'));
    } else if (v && v.$set && BLACK.test(k)) {
      out.names.push(k);
      v.$set.forEach((x) => out.set(x, 'black'));
    } else if (v && v.$map && MEMO.test(k) && entriesOf(v).every(([, b]) => typeof b === 'boolean')) {
      // a memo of answers: true = safe (black), false = proven unsafe (stays grey)
      out.names.push(k);
      entriesOf(v).forEach(([x, b]) => out.set(Number(x), b ? 'black' : 'grey'));
    }
  }
  return out.names.length ? out : null;
}

/** true when the line reads one of the colour variables (the entry check of a DFS call) */
const readsColour = (col, src) => col.names.some((k) => new RegExp(`\\b${k}\\b`).test(src || ''));

/** true when this line calls one of the code's own helper functions (a recursive DFS step) */
function callsHelper(lines, src) {
  const names = [...lines.join('\n').matchAll(/function\s+(\w+)|(\w+)\s*=\s*(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/g)].map((m) => m[1] || m[2]).slice(1);
  return names.some((n) => new RegExp(`\\b${n}\\s*\\(`).test(src || '') && !new RegExp(`function\\s+${n}\\b|\\b${n}\\s*=`).test(src || ''));
}

/** Kahn on the reversed graph: an int array counting each node's unresolved roads out */
const degOf = (vars, params, col) => Object.keys(vars).find((k) => !params.includes(k) && !col?.names.includes(k) && !RESULT.test(k) && DEG.test(k) && row(vars[k]) && vars[k].length > 0 && vars[k].every(Number.isInteger));
const resultOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && RESULT.test(k) && row(vars[k]) && vars[k].every(Number.isInteger));

export default {
  id: 'find-eventual-safe-states',
  metaphor: 'Every road out must reach a dead end',
  caption: 'Arrows are one-way roads. A node is safe when every walk from it stops at a dead end. Grey = on the walk we are following (or proven unsafe), black = safe; reaching a grey node again means a loop.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const atName = nodeOf(vars);
    const at = vars[atName];
    if (ctx.ret && !ctx.next && row(ctx.value)) return ctx.value.length ? `the safe nodes, in order: ${ctx.value.join(', ')}` : 'no node is safe: every one can walk into a loop';
    const rName = resultOf(vars, params);
    const r = rName && row(vars[rName]);
    const rb = rName && row(prev[rName]);
    if (r && rb && r.length === rb.length + 1) return `node ${r[r.length - 1]} is safe: every road out of it ends at a dead end (${r.length} safe so far)`;

    const col = colours(vars, params);
    if (col) {
      const before = colours(prev, params) || new Map();
      const grey = [...col].filter(([c, s]) => s === 'grey' && before.get(c) !== 'grey').map(([c]) => c);
      const black = [...col].filter(([c, s]) => s === 'black' && before.get(c) !== 'black').map(([c]) => c);
      if (black.length === 1) return `every road from node ${black[0]} reached a dead end: it turns black (safe)`;
      if (grey.length === 1) return `node ${grey[0]} turns grey: we follow its roads (it is on the current walk)`;
      if (ctx.ret && typeof ctx.value === 'boolean' && atName) {
        if (callsHelper(ctx.lines, ctx.src)) return `a road from node ${at} leads into a loop, so node ${at} is unsafe too (stays grey)`;
        if (!readsColour(col, ctx.src)) return `node ${at} checked: ${ctx.value ? 'all roads end at dead ends' : 'it can loop forever'}`;
        if (col.get(at) === 'grey') return `node ${at} is grey: we walked back into it, a loop (or it was proven unsafe before)`;
        if (col.get(at) === 'black') return `node ${at} is already black: known safe, no need to walk it again`;
      }
    }
    const dName = degOf(vars, params, col);
    if (dName && row(prev[dName])) {
      const ch = changedIdx(vars[dName], prev[dName]);
      if (ch.length === 1 && vars[dName][ch[0]] < prev[dName][ch[0]]) {
        const x = ch[0];
        const d = vars[dName][x];
        return d === 0 ? `node ${x}'s last open road leads to a safe node: all its roads are safe, so it is safe` : `one road from node ${x} leads to a safe node: ${plural(d, 'road')} still unknown`;
      }
    }
    if (dName && row(prev[dName])) {
      const ch = changedIdx(vars[dName], prev[dName]);
      if (ch.length === 1 && vars[dName][ch[0]] > prev[dName][ch[0]]) return `node ${ch[0]} has another road out: ${plural(vars[dName][ch[0]], 'road')} to prove safe`;
    }
    const qName = Object.keys(vars).find((k) => /queue|^q$|stack|ready/i.test(k) && itemsOf(vars[k]));
    const q = qName && itemsOf(vars[qName]);
    const qb = qName && itemsOf(prev[qName]);
    if (dName && q && qb && q.length === qb.length + 1) return `node ${q[q.length - 1]} has no unproven roads left: it joins the queue of safe nodes`;
    if (dName && q && qb && q.length === qb.length - 1 && atName && at !== prev[atName]) return `take safe node ${at}: every node with a road into it gets one road closer to safe`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const nx = ctx.next.vars;
    const col = colours(vars, params);
    // DFS: the walk reaches a node that is already grey or black; what does the call answer?
    if (col && ctx.next.ret && typeof ctx.next.value === 'boolean' && !callsHelper(ctx.lines, ctx.lines[ctx.next.line - 1]) && readsColour(col, ctx.lines[ctx.next.line - 1])) {
      const atName = nodeOf(nx);
      const nCol = colours(nx, params);
      const at = nx[atName];
      const c = atName && col.get(at);
      if (!c || !nCol || nCol.get(at) !== c) return null;
      return {
        question: `The walk reaches node ${at}, which is already ${c}. What does this check return?`,
        options: ['true', 'false'],
        answer: ctx.next.value ? 0 : 1,
        explain: `${c === 'grey' ? `Grey means node ${at} is on the current walk (or was proven unsafe): reaching it again means a loop, so it is not safe` : `Black means node ${at} was already proven safe`}; this code returns ${ctx.next.value}.`,
      };
    }
    // Kahn on the reversed graph: before a count goes down, does that node become safe?
    const dName = degOf(vars, params, col);
    const d = dName && row(vars[dName]);
    const nd = dName && row(nx[dName]);
    if (!d || !nd) return null;
    const ch = changedIdx(nd, d);
    if (ch.length !== 1 || nd[ch[0]] >= d[ch[0]]) return null;
    const x = ch[0];
    return {
      question: `One of node ${x}'s roads leads to a node just proven safe. Is node ${x} safe now?`,
      options: ['Yes: all its roads are safe', 'No: some roads are still unknown'],
      answer: nd[x] === 0 ? 0 : 1,
      explain: nd[x] === 0 ? `That was its last unknown road (${d[x]} → 0).` : `Its count drops ${d[x]} → ${nd[x]}: other roads are still unproven.`,
    };
  },
  bugs: [
    {
      label: 'Treat a grey node as safe',
      find: 'return color[u] === 2;',
      replace: 'return color[u] !== 0;',
      explain: 'Reaching a grey node means the walk went round a loop, but this answers "safe", so nodes on a cycle (0, 1, 3 in example 1) are reported safe.',
    },
  ],
};
