// Build a Matrix With Conditions: two independent line-ups. The row rules line the numbers up top to bottom, the
// column rules left to right (each a Kahn topological sort); number x then sits at (its place in the row order,
// its place in the column order). A loop in either rule set means no matrix. Works with indeg / inDegree / need…
// and an order / queue list; the current rule set is recognised by comparing the helper's input with the rules.
import { changedIdx, itemsOf, row } from './util.js';

const DEG = /indeg|in_?degree|^deg|^in$|need|req|pending|wait|count/i;
const ORDER = /order|queue|^q$|^res|result|topo|list|line|seq|sorted|ans/i;
const POS = /pos|where|index|idx|place|^at|col|row/i;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const pairs = (v) => Array.isArray(v) && v.every((e) => Array.isArray(e) && e.length === 2);

/** 'row' or 'column': which rule set the topological sort is working on now (null when unsure) */
function phaseOf(vars, params, input) {
  const [, rows, cols] = input || [];
  const r = JSON.stringify(rows);
  const c = JSON.stringify(cols);
  if (r === c) return null;
  for (const k of Object.keys(vars)) {
    if (params.includes(k) || !pairs(vars[k])) continue;
    const s = JSON.stringify(vars[k]);
    if (s === r) return 'row';
    if (s === c) return 'column';
  }
  return null;
}
const degOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && DEG.test(k) && row(vars[k]) && vars[k].length > 1 && vars[k].every(Number.isInteger));
const QUEUE = /queue|^q$/i;
const intList = (v) => itemsOf(v) && itemsOf(v).every(Number.isInteger);
/** the order being built (an order / result list beats a queue; the reference uses one list as both) */
function orderOf(vars, params) {
  const names = Object.keys(vars).filter((k) => !params.includes(k) && ORDER.test(k) && !/row|col/i.test(k) && intList(vars[k]));
  return names.find((k) => !QUEUE.test(k)) || names[0];
}
const matrixOf = (vars, params, k) => Object.keys(vars).find((x) => !params.includes(x) && Array.isArray(vars[x]) && vars[x].length === k && vars[x].every((r) => row(r) && r.length === k));
const words = (phase) => (phase === 'row' ? ['above', 'row'] : phase === 'column' ? ['left of', 'column'] : ['before', 'place']);

export default {
  id: 'build-a-matrix-with-conditions',
  metaphor: 'Two line-ups: top to bottom, left to right',
  caption: 'The row rules and the column rules never interact: line the numbers up top to bottom (one row each), then left to right (one column each). A number whose waiting count hits 0 takes the next place; a loop leaves numbers unplaced.',
  narrate(ctx) {
    const { vars, prev, params, input } = ctx;
    const k = vars[params[0]] ?? input?.[0];
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) {
      return ctx.value.length ? `the matrix is built: each number sits at (its row place, its column place), so every rule holds` : 'one rule set loops, so no matrix can satisfy it: return []';
    }
    const phase = phaseOf(vars, params, input);
    const [above, place] = words(phase);
    if (ctx.ret && phase) {
      const v = itemsOf(ctx.value);
      if (v && Number.isInteger(k) && v.length === k) return `all ${k} numbers are lined up by the ${phase} rules: ${v.join(', ')}`;
      const oName = orderOf(vars, params);
      const o = oName && itemsOf(vars[oName]);
      return `${o ? `only ${o.length} of ${k} numbers got a ${place}` : 'not every number got a place'}: the ${phase} rules loop, so there is no matrix`;
    }
    const mName = Number.isInteger(k) && matrixOf(vars, params, k);
    if (mName && row(prev[mName]?.[0])) {
      const cells = [];
      vars[mName].forEach((r, i) => changedIdx(r, prev[mName][i] || []).forEach((j) => cells.push([i, j])));
      if (cells.length === 1) {
        const [i, j] = cells[0];
        return `number ${vars[mName][i][j]} goes to row ${i}, column ${j}`;
      }
    }
    const oName = orderOf(vars, params);
    const o = oName && itemsOf(vars[oName]);
    const ob = oName && itemsOf(prev[oName]);
    const qName = Object.keys(vars).find((x) => !params.includes(x) && QUEUE.test(x) && intList(vars[x]));
    const q = qName && itemsOf(vars[qName]);
    const qb = qName && itemsOf(prev[qName]);
    // a separate queue: pushes mean "free", the order list's pushes mean "placed"
    if (qName && qName !== oName && o && ob && o.length === ob.length + 1) return `number ${o[o.length - 1]} takes ${place} ${o.length - 1}`;
    if (q && qb && q.length === qb.length + 1) return `number ${q[q.length - 1]} has no unplaced number that must be ${above} it: it waits in line for the next ${place}`;
    if (o && ob && o.length === ob.length + 1) return `number ${o[o.length - 1]} has no unplaced number that must be ${above} it: it takes ${place} ${o.length - 1}`;
    const dName = degOf(vars, params);
    if (dName && row(prev[dName]) && prev[dName].length === vars[dName].length) {
      const d = vars[dName];
      const ch = changedIdx(d, prev[dName]);
      if (ch.length === 1) {
        const x = ch[0];
        if (d[x] > prev[dName][x]) return `${phase ? `${phase} rule: ` : ''}another number must be ${above} ${x}: it waits on ${d[x]}`;
        return `a number ${above} ${x} has its ${place}: ${d[x] === 0 ? `nothing else must be ${above} ${x}, it is free` : `${x} still waits on ${d[x]}`}`;
      }
    }
    // a position lookup filled in: number → its index in an order
    for (const [n, v] of Object.entries(vars)) {
      if (params.includes(n) || !POS.test(n) || !Array.isArray(v) || !Array.isArray(prev[n]) || v.length !== prev[n].length) continue;
      const ch = v.map((x, i) => (x !== prev[n][i] && Number.isInteger(x) ? i : -1)).filter((i) => i >= 0);
      if (ch.length === 1) return `number ${ch[0]} sits in ${/row/i.test(n) ? 'row' : 'column'} ${v[ch[0]]}`;
    }
    return null;
  },
  // before a waiting count goes down: is that number free to take the next place?
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params, input } = ctx;
    const dName = degOf(vars, params);
    const d = dName && row(vars[dName]);
    const nd = dName && row(ctx.next.vars[dName]);
    if (!d || !nd || d.length !== nd.length) return null;
    const ch = changedIdx(nd, d);
    if (ch.length !== 1 || nd[ch[0]] >= d[ch[0]]) return null;
    const x = ch[0];
    const phase = phaseOf(vars, params, input);
    const rules = phase === 'row' ? input?.[1] : phase === 'column' ? input?.[2] : null;
    // a number with a single rule on it is always free at its first drop: not worth a question
    if (pairs(rules) && rules.filter((e) => e[1] === x).length < 2) return null;
    const [above, place] = words(phase);
    const free = nd[x] === 0;
    return {
      question: `A number that must be ${above} ${x} has just been given its ${place}. Is ${x} free to take the next ${place}?`,
      options: [`Yes: nothing else must be ${above} it`, 'No: it still waits on another number'],
      answer: free ? 0 : 1,
      explain: free ? `That was the last number it waited on (count ${d[x]} → 0).` : `Its count drops ${d[x]} → ${nd[x]}: another number must still be ${above} ${x}.`,
    };
  },
  bugs: [
    {
      label: 'Use the rows order for the columns too',
      find: 'const colOrder = topo(colConditions);',
      replace: 'const colOrder = topo(rowConditions);',
      explain: 'The two rule sets are independent: lining the columns up by the row rules ignores every column rule, so "3 left of 2" can end up broken.',
    },
    {
      label: 'Keep a partial order on a loop',
      find: 'return order.length === k ? order : null;',
      replace: 'return order;',
      explain: 'Numbers caught in a loop never reach 0 and get no place, but the half-filled order is used anyway: a matrix with missing numbers is returned instead of [].',
    },
  ],
};
