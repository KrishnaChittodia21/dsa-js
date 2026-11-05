// Scene: First Unique Character in a String. A tally of every letter plus a waiting line of candidates: a letter
// seen for the first time joins the line (by index); a candidate whose letter has repeated is sent away only when
// it reaches the front, so the front is always the first letter still seen once. Reads the counter (26-cell array,
// Map or object) and the queue (array or toolkit Queue / Deque), whatever they are called.
import { entriesOf, row } from './util.js';

function lineOf(v) {
  if (row(v)) return v;
  const o = v?.$obj;
  if (!o) return null;
  if (row(o.items) && Number.isInteger(o.head)) return o.items.slice(o.head);
  if (row(o.buf) && Number.isInteger(o.head) && Number.isInteger(o.count)) return Array.from({ length: o.count }, (_, k) => o.buf[(o.head + k) % o.buf.length]);
  return null;
}
// letter → count, from a 26-cell array (index = letter - 'a'), a Map or a plain-object counter
function tallyOf(v) {
  if (row(v) && v.length === 26 && v.every((x) => Number.isInteger(x))) return new Map(v.map((x, i) => [String.fromCharCode(97 + i), x]));
  const e = entriesOf(v);
  if (!e || !e.every(([k, x]) => typeof k === 'string' && k.length === 1 && Number.isInteger(x))) return null;
  return new Map(e);
}
// the counter's name: a non-parameter variable holding a tally (the queue is never a 26-cell array of counts)
function counterName(ctx, vars) {
  return Object.keys(vars).find((k) => !ctx.params.includes(k) && k !== 'this' && tallyOf(vars[k]));
}
// the candidate line: a queue of indexes into s
function lineName(ctx, vars, cName) {
  const s = ctx.input?.[0];
  const ks = Object.keys(vars).filter((k) => k !== cName && !ctx.params.includes(k) && typeof vars[k] !== 'string' && lineOf(vars[k])?.every((x) => Number.isInteger(x) && x >= 0 && x < s.length));
  if (ks.length === 1) return ks[0];
  return ks.find((k) => /^(q|queue|line|cand\w*|dq|deque|order)$/i.test(k)) ?? null;
}
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// the one letter whose count changed between two tallies: [letter, before, after] or null
function bump(now, before) {
  if (!now || !before) return null;
  const d = [...now].filter(([k, x]) => (before.get(k) ?? 0) !== x);
  return d.length === 1 ? [d[0][0], before.get(d[0][0]) ?? 0, d[0][1]] : null;
}
const show = (q, s) => (q.length ? q.map((i) => `${s[i]}@${i}`).join(', ') : 'empty');

function state(ctx, vars) {
  const s = ctx.input?.[0];
  if (typeof s !== 'string' || !vars) return null;
  const c = counterName(ctx, vars);
  const l = c && lineName(ctx, vars, c);
  if (!c || !l) return null;
  return { s, tally: tallyOf(vars[c]), q: lineOf(vars[l]), c, l };
}

export default {
  id: 'first-unique-character-in-a-string',
  metaphor: 'A tally and a line of first-timers',
  caption: 'The tally counts every letter. A letter seen for the first time joins the line by its index; a candidate whose letter has repeated is sent away once it reaches the front, so the front is the first letter seen only once.',
  narrate(ctx) {
    const now = state(ctx, ctx.vars);
    if (!now) return null;
    const { s, q, tally } = now;
    if (ctx.ret) return q.length ? `the front of the line, '${s[q[0]]}' at index ${q[0]}, is the first letter seen only once` : 'the line is empty: every letter repeats, so the answer is -1';
    const was = state(ctx, ctx.prev);
    if (!was || was.c !== now.c || was.l !== now.l) return null;
    const b = bump(tally, was.tally);
    const joined = q.length === was.q.length + 1 && same(q.slice(0, -1), was.q);
    const left = q.length === was.q.length - 1 && same(q, was.q.slice(1));
    if (joined && (!b || b[2] === 1)) return `'${s[q.at(-1)]}' at index ${q.at(-1)} is seen for the first time: it joins the line · line: ${show(q, s)}`;
    if (left) {
      const i = was.q[0];
      return `the front candidate '${s[i]}' (index ${i}) has repeated (${tally.get(s[i]) ?? '?'} times): it leaves · line: ${show(q, s)}`;
    }
    if (b && same(q, was.q)) {
      const [ch, , n] = b;
      if (n === 1) return `'${ch}' seen for the first time: tally 1`;
      return `'${ch}' seen again: tally ${n}, so '${ch}' is no longer unique`;
    }
    return null;
  },
  // right after a repeat was tallied: does the front of the line leave now?
  predict(ctx) {
    if (!ctx.next || ctx.next.ret) return null;
    const now = state(ctx, ctx.vars);
    const was = state(ctx, ctx.prev);
    const nx = state(ctx, ctx.next.vars);
    if (!now || !was || !nx || was.c !== now.c || nx.c !== now.c || nx.l !== now.l) return null;
    const { s, q, tally } = now;
    const b = bump(tally, was.tally);
    if (!b || b[2] !== 2 || !q.length || !same(q, was.q)) return null;
    const left = nx.q.length === q.length - 1 && same(nx.q, q.slice(1));
    // nothing leaves: the next step already reads the next letter (a new tally, or the loop index moves on)
    const moved = Object.keys(ctx.vars).some((k) => !ctx.params.includes(k) && Number.isInteger(ctx.vars[k]) && ctx.next.vars[k] === ctx.vars[k] + 1 && /^(i|j|k|idx|index|pos|p)$/.test(k));
    const stays = same(nx.q, q) && (!!bump(nx.tally, tally) || moved);
    if (left === stays) return null;
    const f = q[0];
    return {
      question: `'${b[0]}' was just seen again. The line's front is '${s[f]}' (index ${f}). What happens to the line now?`,
      options: [`'${s[f]}' leaves the front`, 'Nothing: the next letter is read'],
      answer: left ? 0 : 1,
      explain: left
        ? `'${s[f]}' has been seen ${tally.get(s[f])} times, so it cannot be the answer and is sent away from the front.`
        : `The front '${s[f]}' is still seen only once, so it stays${s[f] !== b[0] ? `; '${b[0]}' waits further back and leaves only when it reaches the front` : ''}.`,
    };
  },
  bugs: [
    {
      label: 'Check the front only once (if, not while)',
      find: 'while (!q.isEmpty() && count[s.charCodeAt(q.front()) - 97] > 1) q.dequeue();',
      replace: 'if (!q.isEmpty() && count[s.charCodeAt(q.front()) - 97] > 1) q.dequeue();',
      explain: 'After one repeated candidate leaves, the next one at the front may have repeated too; it stays, and its index is returned as if it were unique.',
    },
    {
      label: 'Return the letter instead of its index',
      find: 'return q.isEmpty() ? -1 : q.front();',
      replace: 'return q.isEmpty() ? -1 : s[q.front()];',
      explain: 'The question asks for the position of the first unique letter, not the letter itself.',
    },
  ],
};
