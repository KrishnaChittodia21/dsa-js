// Scene: Baseball Game. The record is a pile of score cards: a number adds a card, "D" and "+" write a new card
// from the top one or two, "C" tears the top card off. Works with any stack name and any name for the current op.
import { firstInt, options, row } from './util.js';

const isScoreRow = (v) => !!row(v) && v.every((x) => Number.isFinite(x));
// the record: a number array that is not the input (prefer stack-like names)
function pileOf(vars, params) {
  const cands = Object.entries(vars).filter(([k, v]) => !params.includes(k) && isScoreRow(v));
  return cands.find(([k]) => /st|stack|rec|score|pile/i.test(k)) || (cands.length === 1 ? cands[0] : null);
}
// the operation being processed: a string var holding one of the ops, else ops[i]
function opOf(vars, ops) {
  const s = Object.entries(vars).find(([, v]) => typeof v === 'string' && ops.includes(v));
  if (s) return s[1];
  const [, i] = firstInt(vars, ['i', 'j', 'k', 'idx']);
  return Number.isInteger(i) && i >= 0 && i < ops.length ? ops[i] : undefined;
}
const card = (x) => `${x}`;

export default {
  id: 'baseball-game',
  metaphor: 'A pile of score cards',
  caption: 'The stack is a pile of score cards, newest on top. "D" and "+" read only the top one or two cards, and "C" tears the top card off, so a stack is all the record needs.',
  narrate(ctx) {
    const ops = row(ctx.vars[ctx.params[0]]);
    const pile = pileOf(ctx.vars, ctx.params);
    if (!ops || !pile) return null;
    const [name, now] = pile;
    const was = row(ctx.prev[name]);
    const op = opOf(ctx.vars, ops);
    if (was && isScoreRow(was)) {
      if (now.length === was.length + 1 && now.slice(0, -1).every((x, k) => x === was[k])) {
        const top = now[now.length - 1];
        const a = was[was.length - 1];
        const b = was[was.length - 2];
        if (op === 'D' && top === 2 * a) return `"D": double the top card ${a} → a new card ${top} goes on the pile`;
        if (op === '+' && top === a + b) return `"+": add the top two cards ${b} + ${a} → a new card ${top}; both stay on the pile`;
        return `score ${top} goes on the pile as a new card · pile: ${now.join(', ')}`;
      }
      if (now.length === was.length - 1 && was.slice(0, -1).every((x, k) => x === now[k])) {
        return `"C": tear off the top card ${was[was.length - 1]} · pile: ${now.join(', ') || 'empty'}`;
      }
    }
    // the final sum over the pile
    const sumName = ['sum', 'total', 'res', 'result', 'ans'].find((k) => Number.isFinite(ctx.vars[k]));
    if (sumName && Number.isFinite(ctx.prev[sumName]) && ctx.vars[sumName] !== ctx.prev[sumName]) {
      return `add card ${ctx.vars[sumName] - ctx.prev[sumName]} to the total: ${ctx.vars[sumName]}`;
    }
    return null;
  },
  // before a "D" or "+" card is written: what is on it?
  predict(ctx) {
    if (!ctx.next) return null;
    const ops = row(ctx.vars[ctx.params[0]]);
    const pile = pileOf(ctx.vars, ctx.params);
    if (!ops || !pile) return null;
    const [name, now] = pile;
    const after = row(ctx.next.vars[name]);
    const op = opOf(ctx.next.vars, ops);
    if (!after || !isScoreRow(after) || (op !== 'D' && op !== '+') || now.length < (op === '+' ? 2 : 1)) return null;
    if (after.length !== now.length + 1 || !now.every((x, k) => x === after[k])) return null;
    const top = after[after.length - 1];
    const a = now[now.length - 1];
    const b = now[now.length - 2];
    return options(
      `The pile is ${now.join(', ')} (top: ${a}) and the operation is "${op}". What is written on the new card?`,
      card(top),
      [2 * a, a, b === undefined ? a + 1 : a + b, b === undefined ? 0 : 2 * b, now.reduce((s, x) => s + x, 0)].filter((x) => x !== top).map(card),
      op === 'D' ? `"D" doubles only the top card: 2 × ${a} = ${top}.` : `"+" adds the top two cards: ${b} + ${a} = ${top}, and both stay on the pile.`,
    );
  },
  bugs: [
    {
      label: '"+" pops the two cards it adds',
      find: 'st.push(st[n - 1] + st[n - 2])',
      replace: 'st.push(st.pop() + st.pop())',
      explain: 'The two previous scores must stay on the record. Popping them loses both, so ["5","2","C","D","+"] sums to 15 instead of 30.',
    },
  ],
};
