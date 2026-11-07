// Data Stream as Disjoint Intervals: islands on a number line. Each new number lands alone, stretches the island
// next to it, glues two islands into one, or falls on an island it is already part of. Reads the list of [start,
// end] islands from the fields of `this` (any name); a Set-of-seen-numbers version gets the "seen" notes only.
import { options, row } from './util.js';

const isInt = Number.isInteger;
const isPair = (v) => row(v) && v.length === 2 && v.every(isInt);
const show = (p) => `[${p[0]}, ${p[1]}]`;
const showAll = (l) => (l.length ? l.map(show).join(' ') : 'none');

/** the islands: the first field of `this` that is a list of [start, end] pairs */
function islandsOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const f = Object.values(o).find((v) => Array.isArray(v) && v.every(isPair));
  return f || null;
}
const seenOf = (vars) => Object.values(vars?.this?.$obj || {}).find((v) => v && v.$set)?.$set;
/** sorted, disjoint and with a gap between neighbours: no merge is half done */
const clean = (l) => l.every((p, i) => p[0] <= p[1] && (i === 0 || l[i - 1][1] + 1 < p[0]));
const opOf = (ctx) => ctx.ops?.[ctx.op];

/** what happened to v between two island lists: alone | right (joins the island on its left) | left | glue | null */
function change(before, after, v) {
  if (after.length === before.length + 1 && after.some((p) => p[0] === v && p[1] === v)) return 'alone';
  if (after.length === before.length - 1) return 'glue';
  if (after.length !== before.length) return null;
  const d = after.map((p, i) => (p[0] !== before[i][0] || p[1] !== before[i][1] ? i : -1)).filter((i) => i >= 0);
  if (d.length !== 1) return null;
  const [a, b] = [before[d[0]], after[d[0]]];
  // stretching one island up to its other neighbour is the first half of a glue
  if (b[1] === v && a[1] === v - 1 && b[0] === a[0]) return after[d[0] + 1]?.[0] === v + 1 ? 'glue' : 'right';
  if (b[0] === v && a[0] === v + 1 && b[1] === a[1]) return after[d[0] - 1]?.[1] === v - 1 ? 'glue' : 'left';
  if (b[1] > v && a[1] === v - 1) return 'glue';
  if (b[0] < v && a[0] === v + 1) return 'glue';
  return null;
}

export default {
  id: 'data-stream-as-disjoint-intervals',
  metaphor: 'Islands rising on a number line',
  caption: 'Every number that arrives is a patch of land on a number line. Next to an island it stretches that island; between two islands one apart it glues them into one; otherwise it starts a new island.',
  narrate(ctx) {
    const op = opOf(ctx);
    if (!op) return null;
    const last = !ctx.next || ctx.next.op !== ctx.op;
    if (op.name === 'getIntervals') {
      const l = islandsOf(ctx.vars);
      return last && l ? `read the islands left to right: ${showAll(l)}` : null;
    }
    if (op.name !== 'addNum') return null;
    const v = op.args[0];
    const now = islandsOf(ctx.vars);
    const before = islandsOf(ctx.prev);
    // the step before the islands change: name the neighbours, no verdict (the prediction asks it)
    const after = ctx.next?.op === ctx.op ? islandsOf(ctx.next.vars) : null;
    if (now && after && clean(now) && change(now, after, v)) {
      const leftN = [...now].reverse().find((p) => p[0] <= v);
      const rightN = now.find((p) => p[0] > v);
      return `${v} arrives: the nearest islands are ${leftN ? show(leftN) : 'none'} on the left and ${rightN ? show(rightN) : 'none'} on the right`;
    }
    if (now && before && ctx.prev.this) {
      const c = change(before, now, v);
      const home = now.find((p) => p[0] <= v && v <= p[1]);
      if (c === 'alone') return `${v} has no island next to it: a new island [${v}, ${v}] (islands: ${showAll(now)})`;
      if (c === 'right') return `${v} touches the end of ${show([home[0], v - 1])}: that island grows right to ${show(home)}`;
      if (c === 'left') return `${v} touches the start of ${show([v + 1, home[1]])}: that island grows left to ${show(home)}`;
      if (c === 'glue' && now.length === before.length) return `${v} fills the one-number gap between two islands: they are being glued together`;
      if (c === 'glue') return `the glue is done: one island ${home ? show(home) : ''} (islands: ${showAll(now)})`;
    }
    const seen = seenOf(ctx.vars);
    const seenBefore = seenOf(ctx.prev);
    if (seen && seenBefore && seen.length === seenBefore.length + 1) return `${v} is new: keep it with the others (${seen.length} different numbers so far)`;
    if (last && now) {
      const home = now.find((p) => p[0] <= v && v <= p[1]);
      if (home && /^\s*if\s*\(.*\)\s*return\b/.test(ctx.src || '')) return `${v} already lies on island ${show(home)}: nothing changes`;
    }
    return null;
  },
  // just before the islands change: what does the new number do?
  predict(ctx) {
    const op = opOf(ctx);
    if (!ctx.next || op?.name !== 'addNum' || ctx.next.op !== ctx.op) return null;
    const v = op.args[0];
    const now = islandsOf(ctx.vars);
    const after = islandsOf(ctx.next.vars);
    if (!now || !after || !clean(now)) return null;
    const c = change(now, after, v);
    if (!c) return null;
    const leftN = [...now].reverse().find((p) => p[0] <= v);
    const rightN = now.find((p) => p[0] > v);
    // a lone number far from every island is no puzzle: ask only when an island is within reach
    if (c === 'alone' && !((leftN && v - leftN[1] <= 2) || (rightN && rightN[0] - v <= 2))) return null;
    const around = `${leftN ? show(leftN) : 'nothing'} on its left, ${rightN ? show(rightN) : 'nothing'} on its right`;
    const say = { alone: `A new island [${v}, ${v}]`, right: 'It stretches the island on its left', left: 'It stretches the island on its right', glue: 'It glues two islands into one' };
    const why = {
      alone: `Neither neighbour reaches ${v - 1} or ${v + 1}, so ${v} stands alone.`,
      right: `${leftN && show(leftN)} ends at ${v - 1}, right next to ${v}${rightN ? `, and ${show(rightN)} starts too far away` : ''}.`,
      left: `${rightN && show(rightN)} starts at ${v + 1}, right next to ${v}${leftN ? `, and ${show(leftN)} ends too far away` : ''}.`,
      glue: `The left island ends at ${v - 1} and the right one starts at ${v + 1}: ${v} was the only gap.`,
    };
    return options(`${v} arrives, with ${around}. What happens?`, say[c], Object.values(say).filter((s) => s !== say[c]), why[c]);
  },
  bugs: [
    {
      label: 'Forget the glue-both case',
      find: 'if (joinLeft && joinRight)',
      replace: 'if (false)',
      explain: 'When the number fills a one-number gap, only the left island grows, so [1, 2] and [3, 3] stay apart instead of becoming [1, 3].',
    },
    {
      label: 'Forget duplicates',
      find: 'if (left && left[1] >= value) return;',
      replace: '',
      explain: 'A number that already lies on an island is added again as a new island, so 5, 5 gives [5, 5] twice.',
    },
  ],
};
