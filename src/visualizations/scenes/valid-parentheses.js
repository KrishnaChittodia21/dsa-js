// Valid Parentheses. Every opener waits on a pile; a closer may only close the opener on top. Works with a stack
// of openers (or of the closers they expect) under any name, and any name for the current character.
import { options, row } from './util.js';

const OPEN = { '(': ')', '[': ']', '{': '}' };
const CLOSE = { ')': '(', ']': '[', '}': '{' };
const isBr = (x) => typeof x === 'string' && x.length === 1 && (x in OPEN || x in CLOSE);
// the pile: a row of bracket characters, preferring stack-like names; never the input string
function pileOf(vars, sName) {
  const all = Object.entries(vars).filter(([k, v]) => k !== sName && row(v) && v.every(isBr));
  return all.find(([k]) => /stack|^st$|^stk$|pile|open/i.test(k)) || all[0] || null;
}
const charOf = (vars, sName) => Object.entries(vars).find(([k, v]) => k !== sName && isBr(v)) || null;
// a pile of expected closers is shown as the openers they stand for
const opener = (x) => (x in CLOSE ? CLOSE[x] : x);
const show = (a) => (a.length ? a.map(opener).join(' ') : 'empty');
// does popped pile item p pair up with closer c? (pile of openers, or of expected closers)
const pairs = (p, c) => p === CLOSE[c] || p === c;

export default {
  id: 'valid-parentheses',
  metaphor: 'Openers waiting on a pile',
  caption: 'Each opener goes on top of the pile and waits. A closer may only close the opener on top; a wrong one, or an empty pile, breaks the string. At the end the pile must be empty.',
  narrate(ctx) {
    const sName = ctx.params[0];
    const s = ctx.vars[sName];
    if (typeof s !== 'string') return null;
    if (ctx.ret && ctx.result === false && s.length % 2 === 1 && !pileOf(ctx.prev, sName)) return `the length ${s.length} is odd: the brackets can never all pair up`;
    const pile = pileOf(ctx.vars, sName);
    const was = pile && row(ctx.prev[pile[0]]);
    const ch = charOf(ctx.vars, sName)?.[1];
    if (pile && was) {
      const now = pile[1];
      if (now.length === was.length + 1) return `"${ch && ch in OPEN ? ch : opener(now.at(-1))}" opens and waits on top of the pile · pile: ${show(now)}`;
      if (now.length === was.length - 1 && ch in CLOSE) {
        const top = opener(was.at(-1));
        if (pairs(was.at(-1), ch) && !ctx.ret) return `"${ch}" closes the "${top}" on top: a match · pile: ${show(now)}`;
        if (!pairs(was.at(-1), ch)) return `"${ch}" arrives but the top of the pile is "${top}": wrong partner, the string is broken`;
      }
      if (now.length === was.length && ctx.ret && ch in CLOSE && !now.length) return `"${ch}" arrives with nothing open: it has no partner, the string is broken`;
    }
    if (ctx.ret && pile && !(ch in CLOSE)) {
      const n = pile[1].length;
      return n ? `all read, but ${n} opener${n > 1 ? 's' : ''} never closed (${n > 1 ? 'they are' : 'it is'} ${show(pile[1])}): not valid` : 'all read and the pile is empty: every opener was closed in order, valid';
    }
    return null;
  },
  predict(ctx) {
    const sName = ctx.params[0];
    const nx = ctx.next;
    if (!nx || typeof ctx.vars[sName] !== 'string') return null;
    // a closer is about to be handled: match, or broken?
    const pile = pileOf(ctx.vars, sName);
    const ch = charOf(nx.vars, sName);
    if (pile && pile[1].length && ch && ch[1] in CLOSE) {
      const after = row(nx.vars[pile[0]]);
      const top = opener(pile[1].at(-1));
      const fail = nx.ret && nx.value === false;
      const match = !nx.ret && after && after.length === pile[1].length - 1;
      if (!fail && !match) return null;
      return options(
        `Character "${ch[1]}" is checked; the top of the pile is "${top}". What happens?`,
        fail ? 'Wrong partner: the string is invalid' : `It closes the "${top}" on top`,
        [fail ? `It closes the "${top}" on top` : 'Wrong partner: the string is invalid'],
        fail ? `"${ch[1]}" needs "${CLOSE[ch[1]]}" on top, but the most recent opener is "${top}": closing out of order is not allowed.` : `"${ch[1]}" pairs with the most recent opener, so both leave.`,
      );
    }
    // the last check: is the pile empty?
    if (nx.ret && typeof nx.value === 'boolean' && pile && !(charOf(nx.vars, sName)?.[1] in CLOSE) && !/return\s+false/.test(ctx.lines[nx.line - 1] || '')) {
      const n = pile[1].length;
      return options(`Every character has been read; the pile holds ${n ? show(pile[1]) : 'nothing'}. What is returned?`, nx.value, [!nx.value], nx.value ? 'Nothing is left waiting, so every opener found its closer in order: valid.' : n ? `${n} opener${n > 1 ? 's were' : ' was'} never closed, so the string is not valid.` : 'This run returns false here.');
    }
    return null;
  },
  bugs: [
    {
      label: 'Return true without checking the pile is empty',
      find: 'return stack.length === 0;',
      replace: 'return true;',
      explain: 'Openers that never get closed stay on the pile, but the code says "valid" anyway: "((" returns true.',
    },
  ],
};
