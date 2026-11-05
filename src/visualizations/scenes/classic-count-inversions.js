// Count Inversions (merge sort counting). Two sorted piles merge into one; whenever the front card of the right pile
// goes down before cards still waiting in the left pile, it jumps over all of them, and each jump is one inversion.
// Works with one work array + lo/mid/hi (left pile a[i..mid), right pile a[j..hi)) or with separate left / right arrays.
import { firstInt, row } from './util.js';

const COUNT = ['count', 'inv', 'inversions', 'cnt', 'res', 'result', 'ans', 'total', 'c'];
const WORK = ['a', 'arr', 'copy', 'work', 'w', 'tmp', 'temp', 'sorted'];
const LEFT = ['left', 'L', 'leftArr', 'l'];
const RIGHT = ['right', 'R', 'rightArr', 'r'];
const cards = (k) => `${k} card${k === 1 ? '' : 's'}`;

/** the two piles being merged: { front(i), waiting(i), card(j), rightLeft(j) } or null */
function piles(vars, params) {
  const L = LEFT.map((k) => row(vars[k])).find(Boolean);
  const R = RIGHT.map((k) => row(vars[k])).find(Boolean);
  if (L && R) return { leftAt: (i) => L[i], waiting: (i) => L.slice(i), rightAt: (j) => R[j], rightDone: (j) => j >= R.length, leftDone: (i) => i >= L.length };
  const mid = vars.mid ?? vars.m;
  const hi = vars.hi ?? vars.high ?? vars.r ?? vars.right ?? vars.end;
  const a = [...WORK, params[0]].map((k) => row(vars[k])).find(Boolean);
  if (!a || !Number.isInteger(mid) || !Number.isInteger(hi)) return null;
  return { leftAt: (i) => a[i], waiting: (i) => a.slice(i, mid), rightAt: (j) => a[j], rightDone: (j) => j >= hi, leftDone: (i) => i >= mid };
}

const int = (...xs) => xs.find(Number.isInteger);
const callOf = (vars) => [int(vars.lo, vars.low, vars.l, vars.left, vars.start), int(vars.hi, vars.high, vars.r, vars.right, vars.end)].join(',');

/** current merge state: counter name/value, i, j, piles; null when not inside a merge */
function merge(vars, params) {
  const [cName, count] = firstInt(vars, COUNT);
  const p = piles(vars, params);
  if (!cName || !p || !Number.isInteger(vars.i) || !Number.isInteger(vars.j)) return null;
  return { cName, count, i: vars.i, j: vars.j, p };
}

export default {
  id: 'classic-count-inversions',
  metaphor: 'Right-pile cards jumping the queue',
  caption: 'Each merge joins two sorted piles. When the right pile\'s front card goes down first, it jumps over every card still waiting in the left pile: each card jumped is one inversion.',
  range: [['lo', 'hi']],
  pointers: ['i', 'j', 'mid'],
  compare: 'count',
  narrate(ctx) {
    const v = ctx.vars;
    const pv = ctx.prev;
    const m = merge(v, ctx.params);
    const sameCall = callOf(v) === callOf(pv);
    if (m && sameCall && Number.isInteger(pv[m.cName]) && m.count > pv[m.cName]) {
      const d = m.count - pv[m.cName];
      const w = m.p.waiting(m.i);
      return `right card ${m.p.rightAt(m.j)} goes before ${cards(w.length)} still waiting on the left [${w.join(', ')}]: +${d} (${m.count} here)`;
    }
    if (m && sameCall && Number.isInteger(pv.i) && Number.isInteger(pv.j) && pv[m.cName] === m.count) {
      if (m.i === pv.i + 1 && m.j === pv.j) {
        const x = m.p.leftAt(pv.i);
        return m.p.rightDone(m.j) ? `left card ${x} goes down (the right pile is empty)` : `left card ${x} ≤ right card ${m.p.rightAt(m.j)}: it goes down first, nobody jumps`;
      }
      if (m.j === pv.j + 1 && m.i === pv.i) {
        const x = m.p.rightAt(pv.j);
        return m.p.leftDone(m.i) ? `right card ${x} goes down (the left pile is empty, nothing to jump)` : `right card ${x} goes down`;
      }
    }
    const [cName, count] = firstInt(v, COUNT);
    if (cName && !Number.isInteger(v.i) && callOf(v) !== ',' && !sameCall) return `both halves are sorted, with ${count} inversion${count === 1 ? '' : 's'} inside them; now count the pairs that cross`;
    const mid = v.mid ?? v.m;
    const lo = v.lo ?? v.low ?? v.start;
    const hi = v.hi ?? v.high ?? v.end;
    const a = [...WORK, ctx.params[0]].map((k) => row(v[k])).find(Boolean);
    if (a && [mid, lo, hi].every(Number.isInteger) && mid !== (pv.mid ?? pv.m) && lo < mid && mid < hi) {
      return `split [${a.slice(lo, hi).join(', ')}] into [${a.slice(lo, mid).join(', ')}] | [${a.slice(mid, hi).join(', ')}]`;
    }
    return null;
  },
  // before a card goes down in a merge with 2+ left cards waiting: how many inversions does it add?
  predict(ctx) {
    if (!ctx.next) return null;
    const m = merge(ctx.vars, ctx.params);
    const n = ctx.next.vars;
    if (!m || callOf(n) !== callOf(ctx.vars) || !Number.isInteger(n[m.cName])) return null;
    const w = m.p.waiting(m.i);
    if (w.length < 2 || m.p.rightDone(m.j)) return null;
    let d = null;
    // a right card that just went down (j moved) and is counted next would show the wrong front card: skip that order
    const jMoved = callOf(ctx.prev) === callOf(ctx.vars) && ctx.prev.j === m.j - 1;
    if (n[m.cName] > m.count && !jMoved && n.i === m.i && (n.j === m.j || n.j === m.j + 1)) d = n[m.cName] - m.count;
    else if (n[m.cName] === m.count && n.i === m.i + 1 && n.j === m.j) d = 0;
    if (d === null) return null;
    const opts = [...new Set([0, 1, w.length, d])].sort((x, y) => x - y);
    const r = m.p.rightAt(m.j);
    return {
      question: `Left pile waiting: [${w.join(', ')}]; right pile front: ${r}. How many inversions does the next card add?`,
      options: opts.map(String),
      answer: opts.indexOf(d),
      explain: d === 0 ? `${w[0]} ≤ ${r}, so the left card goes down first: no card is jumped.` : `${r} < ${w[0]}, and the left pile is sorted, so ${r} is smaller than all ${w.length} waiting left cards: it jumps them all.`,
    };
  },
  bugs: [
    {
      label: 'Strict < in the merge: ties count',
      find: 'a[i] <= a[j]',
      replace: 'a[i] < a[j]',
      explain: 'On a tie the right card goes first and "jumps" an equal left card, so equal values are counted as inversions ([5, 5, 5] gives 3, not 0).',
    },
    {
      label: 'Add 1 instead of mid − i',
      find: 'count += mid - i;',
      replace: 'count += 1;',
      explain: 'A right card that goes down first jumps every card still waiting on the left, not just one: [2, 4, 1, 3, 5] gives 2 instead of 3.',
    },
  ],
};
