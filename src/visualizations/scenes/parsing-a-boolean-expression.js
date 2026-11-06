// Parsing A Boolean Expression: every operator opens a box; the parser reads the box's insides one whole child at a
// time (a recursive call per child), then the box reports: & = all true, | = any true, ! = the flip of its one inside.
// Works with a shared-cursor recursion (any names) and narrates the close of a box in a stack solution.
import { diffItems, itemsOf, options } from './util.js';

const STACK = ['stack', 'st', 'stk', 'ops', 's2'];
const OPS = { '&': 'AND', '|': 'OR', '!': 'NOT' };
const DESC = { '&': 'true only when every inside is true', '|': 'true when any inside is true', '!': 'flips its one inside' };
const isBool = (x) => x === true || x === false || x === 't' || x === 'f';
const asBool = (x) => x === true || x === 't';
const show = (xs) => xs.map((x) => String(asBool(x))).join(', ');
/** [name, char] of the symbol the current call read: a one-character variable holding an operator, t or f */
function symOf(vars, params) {
  const hit = Object.entries(vars).find(([k, v]) => !params.includes(k) && typeof v === 'string' && v.length === 1 && /[&|!tf]/.test(v));
  return hit || [null, null];
}
/** [name, list] of the box's collected child values (booleans) */
function kidsOf(vars, params) {
  const hit = Object.entries(vars).find(([k, v]) => !params.includes(k) && !STACK.includes(k) && Array.isArray(v) && v.every(isBool));
  return hit || [null, null];
}
function verdict(op, kids, v) {
  const xs = `${op}(${show(kids)}) = ${v}`;
  if (op === '!') return `${xs}: NOT flips its inside`;
  if (op === '&') return v ? `${xs}: every inside is true` : `${xs}: one false is enough to sink an AND`;
  return v ? `${xs}: one true is enough for an OR` : `${xs}: no inside is true`;
}

export default {
  id: 'parsing-a-boolean-expression',
  metaphor: 'Boxes inside boxes report upward',
  caption: 'Each operator opens a box around its parentheses. The innermost boxes report first, and every box turns its insides’ answers into one true or false for the box around it.',
  narrate(ctx) {
    if (ctx.ret && !ctx.next && typeof ctx.value === 'boolean') return `the whole expression is ${ctx.value}`;
    const [cName, c] = symOf(ctx.vars, ctx.params);
    const [kName, kids] = kidsOf(ctx.vars, ctx.params);
    // stack form: symbols pile up; a ')' pops a box's insides and its operator and pushes one answer
    const sName = STACK.find((k) => itemsOf(ctx.vars[k]));
    if (sName) {
      const d = diffItems(itemsOf(ctx.prev[sName]) || [], itemsOf(ctx.vars[sName]));
      if (d.removed.length === 1 && d.removed[0] in OPS && d.removed[0] === c && kids && !d.added.length) return `')' closes the ${OPS[c]} box: its insides are [${show(kids)}]`;
      if (d.removed.length || d.added.length !== 1) return null;
      const x = d.added[0];
      if (x in OPS) return `'${x}' goes on the pile: ${DESC[x]}`;
      if (c in OPS && kids && isBool(x) && cName !== sName) return verdict(c, kids, asBool(x));
      return isBool(x) ? `'${x}' goes on the pile` : null;
    }
    if (ctx.ret && typeof ctx.value === 'boolean') {
      if (c in OPS && kids) return verdict(c, kids, ctx.value);
      return null; // a plain t / f handed back: the parent's list shows it next
    }
    if (cName && new RegExp(`\\b${cName}\\s*=[^=]`).test(ctx.src || '')) {
      if (c in OPS) return `open ${c === '!' ? 'a' : 'an'} ${OPS[c]} box (${c}): ${DESC[c]}; read its insides first`;
      if (c === 't' || c === 'f') return `read '${c}': a plain ${c === 't'}`;
    }
    if (kName && c in OPS && kids.length && (/\.push\(|\.unshift\(|\[[^\]]*\]\s*=[^=]/.test(ctx.src || '') || (Array.isArray(ctx.prev[kName]) && kids.length === ctx.prev[kName].length + 1))) return `the ${OPS[c]} box collects ${kids[kids.length - 1]}: insides so far [${show(kids)}]`;
    return null;
  },
  // a box has all its insides: what does it report?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !nx.ret || typeof nx.value !== 'boolean') return null;
    const [cName, c] = symOf(ctx.vars, ctx.params);
    const [kName, kids] = kidsOf(ctx.vars, ctx.params);
    if (STACK.some((k) => itemsOf(ctx.vars[k]))) return null;
    if (!(c in OPS) || !kids || !kids.length || nx.vars[cName] !== c || JSON.stringify(nx.vars[kName]) !== JSON.stringify(kids)) return null;
    const card = options(`The ${OPS[c]} box ${c}(…) holds [${show(kids)}]. What does it report?`, nx.value, [!nx.value], c === '!' ? `NOT flips its one inside: ${kids[0]} → ${nx.value}.` : c === '&' ? `AND is true only when every inside is true: ${nx.value}.` : `OR is true when at least one inside is true: ${nx.value}.`);
    return card;
  },
  bugs: [
    {
      label: 'Forget to step over the closing )',
      find: "    i++;                              // skip ')'\n",
      replace: '\n',
      explain: 'The cursor stays on the ")", so the box around it sees that ")" and thinks its own list has ended too: later insides are never read or are misread.',
    },
    {
      label: '& answers with some instead of every',
      find: "if (c === '&') return values.every(Boolean);",
      replace: "if (c === '&') return values.some(Boolean);",
      explain: 'An AND box must have every inside true. With some(), "&(t,f)" reports true.',
    },
  ],
};
