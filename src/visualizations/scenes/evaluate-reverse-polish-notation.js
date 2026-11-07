// Scene: Evaluate Reverse Polish Notation. Numbers are cards put on a pile; an operator takes the top two cards
// (the top one is the RIGHT operand), combines them and puts the result back. Works with any stack / token name.
import { firstInt, options, row } from './util.js';

const OPS = ['+', '-', '*', '/'];
const LEFT = ['a', 'x', 'left', 'first', 'op1', 'n1', 'num1', 'l'];
const RIGHT = ['b', 'y', 'right', 'second', 'op2', 'n2', 'num2', 'r'];
const isNumRow = (v) => !!row(v) && v.every((x) => Number.isFinite(x));
function pileOf(vars, params) {
  const cands = Object.entries(vars).filter(([k, v]) => !params.includes(k) && isNumRow(v));
  return cands.find(([k]) => /st|stack|pile|nums|vals/i.test(k)) || (cands.length === 1 ? cands[0] : null);
}
// the token being processed: a string var holding one of the tokens, else tokens[i]
function tokenOf(vars, tokens) {
  const s = Object.entries(vars).find(([, v]) => typeof v === 'string' && tokens.includes(v));
  if (s) return s[1];
  const [, i] = firstInt(vars, ['i', 'j', 'k', 'idx']);
  return Number.isInteger(i) && i >= 0 && i < tokens.length ? tokens[i] : undefined;
}
const apply = (t, a, b) => (t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b) || 0);
const same = (a, b, n) => a.slice(0, n).every((x, k) => x === b[k]);

export default {
  id: 'evaluate-reverse-polish-notation',
  metaphor: 'A pile of number cards',
  caption: 'Numbers go on the pile as cards. An operator takes the top two cards (the top one is the right-hand number), combines them, and puts one result card back.',
  narrate(ctx) {
    const tokens = row(ctx.vars[ctx.params[0]]);
    const pile = pileOf(ctx.vars, ctx.params);
    if (!tokens || !pile) return null;
    const [name, now] = pile;
    const was = row(ctx.prev[name]);
    if (!was || !isNumRow(was)) return null;
    const t = tokenOf(ctx.vars, tokens);
    const op = OPS.includes(t);
    if (now.length === was.length + 1 && same(now, was, was.length)) {
      const top = now[now.length - 1];
      const [, a] = firstInt(ctx.vars, LEFT);
      const [, b] = firstInt(ctx.vars, RIGHT);
      if (op && Number.isFinite(a) && Number.isFinite(b) && apply(t, a, b) === top) return `${a} ${t} ${b} = ${top}${t === '/' && a % b ? ' (rounded toward zero)' : ''}: the result card goes back on the pile`;
      if (!op) return `number ${top} goes on the pile · pile: ${now.join(', ')}`;
      return null;
    }
    // pop, push in one statement: the top two cards became one
    if (op && now.length === was.length - 1 && was.length >= 2 && same(now, was, now.length - 1)) {
      const a = was[was.length - 2];
      const b = was[was.length - 1];
      if (apply(t, a, b) === now[now.length - 1]) return `"${t}" takes ${a} and ${b} off the pile: ${a} ${t} ${b} = ${now[now.length - 1]} goes back`;
    }
    // left card popped and result pushed in one statement, right card held in a variable
    if (op && now.length === was.length && now.length > 0 && same(now, was, now.length - 1) && now.at(-1) !== was.at(-1)) {
      const a = was.at(-1);
      const b = Object.entries(ctx.vars).find(([k, v]) => k !== name && Number.isFinite(v) && apply(t, a, v) === now.at(-1))?.[1];
      if (b !== undefined) return `"${t}" takes the left card ${a}: ${a} ${t} ${b} = ${now.at(-1)} goes back on the pile`;
    }
    if (op && now.length === was.length - 1 && same(now, was, now.length)) {
      const card = was[was.length - 1];
      const k = Object.keys(ctx.vars).find((x) => ctx.vars[x] === card && ctx.prev[x] !== card && x !== name);
      if (!k) return null;
      const side = RIGHT.includes(k) ? ': the right-hand number (it was pushed last)' : LEFT.includes(k) ? ': the left-hand number' : '';
      return `"${t}" takes the top card ${card} off the pile${side}`;
    }
    return null;
  },
  // right before the result card goes back: what is on it?
  predict(ctx) {
    if (!ctx.next) return null;
    const tokens = row(ctx.vars[ctx.params[0]]);
    const pile = pileOf(ctx.vars, ctx.params);
    if (!tokens || !pile) return null;
    const [name, now] = pile;
    const after = row(ctx.next.vars[name]);
    const t = tokenOf(ctx.next.vars, tokens);
    if (!after || !isNumRow(after) || !OPS.includes(t)) return null;
    let a;
    let b;
    let r;
    if (after.length === now.length - 1 && now.length >= 2 && same(after, now, after.length - 1)) {
      // one statement pops both and pushes the result
      [a, b] = now.slice(-2);
      r = after[after.length - 1];
    } else if (after.length === now.length + 1 && same(after, now, now.length)) {
      // operands already popped into variables
      [, a] = firstInt(ctx.vars, LEFT);
      [, b] = firstInt(ctx.vars, RIGHT);
      r = after[after.length - 1];
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    } else return null;
    if (apply(t, a, b) !== r) return null;
    const wrong = [apply(t, b, a), t === '/' ? Math.floor(a / b) : apply(t === '+' ? '*' : '+', a, b), t === '-' ? a + b : a - b];
    return options(
      `"${t}" with ${a} (left) and ${b} (right, it was on top). What card goes back on the pile?`,
      r,
      wrong.filter((x) => Number.isFinite(x) && x !== r),
      `The top card is the right-hand number, so it is ${a} ${t} ${b} = ${r}${t === '/' ? ', and division rounds toward zero' : ''}.`,
    );
  },
  bugs: [
    {
      label: 'Math.floor instead of Math.trunc',
      find: 'Math.trunc(a / b)',
      replace: 'Math.floor(a / b)',
      explain: 'Division must round toward zero. Math.floor rounds down, so -7 / 2 gives -4 instead of -3.',
    },
    {
      label: 'Left and right operands swapped',
      find: 'else if (t === \'-\') st.push(a - b);',
      replace: 'else if (t === \'-\') st.push(b - a);',
      explain: 'The first card popped is the right-hand number. Using it on the left gives 5 − 3 = 2 for ["3","5","-"] instead of -2.',
    },
  ],
};
