// Hand of Straights: lay the hand out as runs of consecutive cards. The pile counts how many of each card are left;
// the smallest card left can only be the lowest card of a straight, so every straight starts there and takes one of
// each next card. A missing card means false. Reads the pile from any Map / object counter (count, freq, cnt…).
import { entriesOf, firstInt, options } from './util.js';

const START = ['v', 'start', 's', 'first', 'card', 'x', 'key', 'num', 'min', 'smallest', 'low', 'lo', 'base', 'val', 'value'];

/** [name, [[card, n]…]] of the first non-parameter counter */
function pileOf(ctx, vars) {
  for (const [k, v] of Object.entries(vars)) {
    const e = !ctx.params.includes(k) && entriesOf(v);
    if (e && e.every(([, n]) => Number.isInteger(n))) return [k, e.map(([c, n]) => [Number(c), n])];
  }
  return null;
}
const get = (pile, c) => pile.find(([k]) => k === c)?.[1] ?? 0;
const left = (pile) => pile.filter(([, n]) => n > 0).map(([c]) => c).sort((a, b) => a - b);
const run = (s, g) => Array.from({ length: Math.min(g, 6) }, (_, i) => s + i).join('-') + (g > 6 ? '…' : '');

/** [card, change] of each card whose count changed between two piles */
function diff(now, before) {
  const keys = new Set([...now, ...before].map(([c]) => c));
  return [...keys].map((c) => [c, get(now, c) - get(before, c)]).filter(([, d]) => d);
}

export default {
  id: 'hand-of-straights',
  metaphor: 'Laying cards out in straights',
  caption: 'The pile shows how many of each card are left. The smallest card left must be the lowest card of a straight, so a straight starts there and takes one of each next card; a card that is not there means false.',
  narrate(ctx) {
    const [hName, gName] = ctx.params;
    const g = ctx.vars[gName];
    const hand = ctx.vars[hName];
    const p = pileOf(ctx, ctx.vars);
    const [sName, s] = firstInt(ctx.vars, START.filter((n) => !ctx.params.includes(n)));
    if (!ctx.next && typeof ctx.result === 'boolean' && /return/.test(ctx.src || '')) {
      if (ctx.result) return 'every card sits in a straight: true';
      if (!p && Array.isArray(hand) && Number.isInteger(g) && hand.length % g) return `${hand.length} cards cannot split into straights of ${g}: false`;
      if (p && sName && Number.isInteger(g)) {
        const [, j] = firstInt(ctx.vars, ['j', 'k', 'i', 'offset', 'step']);
        const miss = Number.isInteger(j) && j >= 0 && j < g ? s + j : undefined;
        if (miss !== undefined) return `the straight ${run(s, g)} needs a ${miss}, but the pile has too few: false`;
      }
      return 'a straight cannot be finished: false';
    }
    const before = pileOf(ctx, ctx.prev);
    if (p && before && p[0] === before[0]) {
      const d = diff(p[1], before[1]);
      if (d.length === 1 && d[0][1] > 0) return `count the cards: ${d[0][0]} ×${get(p[1], d[0][0])}`;
      if (d.length === 1 && d[0][1] < 0) {
        const [c, k] = d[0];
        const from = sName && c >= s && Number.isInteger(g) && c < s + g ? ` for ${-k > 1 ? `the ${-k} straights` : 'the straight'} ${run(s, g)}` : '';
        return `take ${-k > 1 ? `${-k} cards of ${c}` : `card ${c}`}${from} (${get(p[1], c)} left)`;
      }
    }
    if (p && sName && s !== ctx.prev[sName] && Number.isInteger(g) && p[1].some(([c]) => c === s)) {
      const n = get(p[1], s);
      if (n <= 0) return `card ${s}: none left, earlier straights used them all`;
      if (left(p[1])[0] === s) return `smallest card left: ${s} (×${n}): ${n > 1 ? `each ${s} must start` : 'it must start'} a straight ${run(s, g)}`;
    }
    return null;
  },
  // which card starts the next straight? many-at-once takes? and in the end: true or false?
  predict(ctx) {
    if (!ctx.next) return null;
    const nx = ctx.next.vars;
    const p = pileOf(ctx, ctx.vars);
    const q = pileOf(ctx, nx);
    if (ctx.next.ret && typeof ctx.result === 'boolean' && /return/.test(ctx.lines[ctx.next.line - 1] || '') && p) {
      const rest = left(p[1]);
      return {
        question: `The pile holds ${rest.length ? rest.join(', ') : 'nothing'}. The run is about to return: what?`,
        options: ['true', 'false'],
        answer: ctx.result ? 0 : 1,
        explain: ctx.result ? 'Every card was used by some straight.' : 'Some straight needs a card the pile does not have.',
      };
    }
    if (!p || !q || p[0] !== q[0]) return null;
    const d = diff(q[1], p[1]);
    const [sName, s] = firstInt(ctx.vars, START.filter((n) => !ctx.params.includes(n)));
    if (!d.length && sName && Number.isInteger(nx[sName]) && nx[sName] !== s && get(q[1], nx[sName]) > 0) {
      const ns = nx[sName];
      const rest = left(p[1]);
      if (rest[0] !== ns) return null;
      return options('The last straight is done. Which card starts the next one?', ns, [...rest.slice(1, 3), s + 1].filter((x) => x !== ns), `${ns} is the smallest card left: no lower card can join it, so it must be the bottom of a straight.`);
    }
    if (d.length === 1 && d[0][1] < -1 && d[0][0] === s) {
      const [c, k] = d[0];
      const had = get(p[1], c);
      return options(`${-k} straights start together and each needs a ${c}; the pile has ${had}. How many ${c}s are left after?`, had + k, [had - 1, had, 0].filter((x) => x !== had + k && x >= 0), `Each of the ${-k} straights takes one ${c}: ${had} − ${-k} = ${had + k}.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'Sort without a comparator',
      find: '.sort((a, b) => a - b)',
      replace: '.sort()',
      explain: 'The default sort compares text, so 10 comes before 9: the "smallest card left" is wrong and straights start in the wrong place.',
    },
    {
      label: 'Take one card per value, not c',
      find: 'count.set(v + j, have - c);',
      replace: 'count.set(v + j, have - 1);',
      explain: 'When two straights must start at the same card, only one card of each value is taken, so the other straight never gets its cards.',
    },
  ],
};
