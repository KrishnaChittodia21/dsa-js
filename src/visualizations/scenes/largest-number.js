// Largest Number. Every number is a card with its digits on it; to decide which of two cards goes first, glue them
// together both ways and keep the bigger glued number. Works with any comparator that builds a+b / b+a strings
// (found by value, not by name).
import { options, row } from './util.js';

const digits = (v) => typeof v === 'string' && /^\d+$/.test(v);

/** the two cards being compared and the glued strings present now: { x, y, xy, yx } (xy / yx: present or not) */
function glue(vars) {
  const strs = Object.values(vars).filter(digits);
  const has = new Set(strs);
  let best = null;
  for (const x of strs)
    for (const y of strs) {
      if (x === y && strs.filter((s) => s === x).length < 2) continue;
      const xy = has.has(x + y);
      const yx = has.has(y + x);
      if ((xy || yx) && (!best || x.length + y.length < best.x.length + best.y.length)) best = { x, y, xy, yx };
    }
  if (best && !best.xy) best = { x: best.y, y: best.x, xy: true, yx: false }; // name the glued one shown first "x+y"
  return best;
}
const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
/** the cards row: a non-param array of strings (or numbers) as long as the input */
function cardsOf(vars, nName) {
  const n = row(vars[nName]);
  if (!n) return null;
  return Object.entries(vars).find(([k, v]) => k !== nName && row(v) && v.length === n.length) || null;
}

export default {
  id: 'largest-number',
  metaphor: 'Glue two number cards, keep the bigger',
  caption: 'Each number is a card. To order two cards, glue them both ways ("3"+"30" = 330, "30"+"3" = 303) and put first the card that makes the bigger number; the sorted cards, read left to right, are the answer.',
  narrate(ctx) {
    const nName = ctx.params[0];
    const g = glue(ctx.vars);
    if (g) {
      const { x, y } = g;
      const both = g.xy && g.yx;
      const before = glue(ctx.prev);
      if (both && same(before, g) && before.xy && before.yx) {
        if (x + y === y + x) return `"${x}" and "${y}" glue to the same number either way: their order does not matter`;
        const [first, second] = x + y > y + x ? [x, y] : [y, x];
        return `${first + second} > ${second + first}: card "${first}" goes before "${second}"`;
      }
      if (both) return `glue both ways: "${x}"+"${y}" = ${x + y} and "${y}"+"${x}" = ${y + x}`;
      return `glue card "${x}" then "${y}": ${x + y}`;
    }
    const c = cardsOf(ctx.vars, nName);
    if (!c) return null;
    const [cName, now] = c;
    const was = row(ctx.prev[cName]);
    if (!was) return `each number becomes a card: ${now.map((v) => `"${v}"`).join(' ')}`;
    if (was.join() !== now.join()) return `cards in their final order: ${now.join(' | ')} → ${now.join('')}`;
    if (/^\s*return\b/.test(ctx.src) && now.every((v) => String(v) === '0') && now.length > 1) return `every card is "0": the answer is "0", not "${now.join('')}"`;
    return null;
  },
  // a pair where the bigger number must NOT go first, and the finished order of the cards
  predict(ctx) {
    if (!ctx.next) return null;
    const g = glue(ctx.vars);
    if (g && !same(glue(ctx.prev), g)) {
      const { x, y } = g;
      if (x + y === y + x || Number(x) > Number(y) === x + y > y + x) return null;
      const first = x + y > y + x ? x : y;
      const opts = [`"${x}" first`, `"${y}" first`];
      return { question: `Cards "${x}" and "${y}": which one goes first in the biggest number?`, options: opts, answer: first === x ? 0 : 1, explain: `${first === x ? x + y : y + x} beats ${first === x ? y + x : x + y}: "${first}" goes first, even though ${Math.max(+x, +y)} is the bigger number.` };
    }
    const nName = ctx.params[0];
    const c = cardsOf(ctx.vars, nName);
    if (!c) return null;
    const [cName, now] = c;
    const after = row(ctx.next.vars[cName]);
    if (!after || after.length !== now.length || after.join() === now.join() || [...after].map(String).sort().join() !== [...now].map(String).sort().join()) return null;
    const show = (a) => `[${a.join(', ')}]`;
    const numDesc = [...now].sort((a, b) => Number(b) - Number(a));
    const strDesc = [...now].map(String).sort().reverse();
    const numAsc = [...now].sort((a, b) => Number(a) - Number(b));
    return options(`The cards are about to come out of the sort. In what order?`, show(after), [numDesc, strDesc, numAsc].map(show).filter((w) => w !== show(after)), `Each pair is ordered by gluing: ${show(after)} reads ${after.join('')}, the biggest number these cards can make.`);
  },
  bugs: [
    {
      label: 'Sort by number, biggest first',
      find: 'const ab = a + b;',
      replace: 'const ab = a + b; return Number(b) - Number(a);',
      explain: 'The bigger number is not always the better first card: [3, 30] gives "303" instead of "330".',
    },
    {
      label: 'Forget the all-zero case',
      find: "s[0] === '0' ? '0' : s.join('')",
      replace: "s.join('')",
      explain: 'When every card is "0" the glued result is "00", but a number has no leading zeros: the answer is "0".',
    },
  ],
};
