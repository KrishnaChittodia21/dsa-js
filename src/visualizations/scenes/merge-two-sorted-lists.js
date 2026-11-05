// Scene: Merge Two Sorted Lists. Two sorted piles of cards face up: the smallest card left is always on top of
// one of them, so the answer is built by taking the smaller top card again and again, then putting the rest of
// the other pile under it in one go. Reads the re-linking from node ids, so any pointer names work.

const L = (v) => (v && v.$list && Array.isArray(v.$list.ids) ? v.$list : null);
const headId = (v) => (v === null ? null : L(v)?.ids[0]);
const headVal = (v) => L(v)?.values[0];
// id → { val, next } for every node visible in a snapshot (next undefined = not known)
function graph(vars) {
  const g = new Map();
  for (const v of Object.values(vars || {})) {
    const l = L(v);
    if (!l) continue;
    l.ids.forEach((id, i) => {
      let next;
      if (i + 1 < l.ids.length) next = l.ids[i + 1];
      else if (l.cycleTo !== undefined) next = l.ids[l.cycleTo];
      else if (l.ids.length < 64) next = null;
      if (!g.has(id) || g.get(id).next === undefined) g.set(id, { val: l.values[i], next });
    });
  }
  return g;
}
// nodes whose next pointer changed between two snapshots
function relinks(before, after) {
  const a = graph(before);
  const out = [];
  for (const [id, n] of graph(after)) {
    const o = a.get(id);
    if (o && o.next !== undefined && n.next !== undefined && o.next !== n.next) out.push({ id, to: n.next });
  }
  return out;
}
const rest = (v) => L(v)?.values.join(' → ');

export default {
  id: 'merge-two-sorted-lists',
  metaphor: 'Two sorted card piles, take the smaller top',
  caption: 'Each list is a sorted pile with its smallest card on top. The answer grows from the tail: hook on the smaller of the two top cards, and when one pile is empty, hook on the whole other pile at once.',
  narrate(ctx) {
    const [p1, p2] = ctx.params;
    const r = relinks(ctx.prev, ctx.vars);
    if (r.length === 1 && p1 in ctx.prev && p2 in ctx.prev) {
      const { to } = r[0];
      const f1 = headId(ctx.prev[p1]);
      const f2 = headId(ctx.prev[p2]);
      if (to !== null && (to === f1 || to === f2)) {
        const [mine, other] = to === f1 ? [p1, p2] : [p2, p1];
        const v = headVal(ctx.prev[mine]);
        if (ctx.prev[other] === null) return `${other} is empty: hook the rest of ${mine} (${rest(ctx.prev[mine])}) on in one go`;
        const w = headVal(ctx.prev[other]);
        if (v === w) return `top cards tie at ${v}: take the one from ${mine} and hook it onto the answer`;
        return `${v} (${mine}) is smaller than ${w} (${other}): hook it onto the answer`;
      }
      if (to === null) return `the answer's last node now points to nothing: both piles are used up`;
      return null;
    }
    // a pointer that stepped one node forward (not a jump back out of a recursive call)
    const g = graph(ctx.prev);
    for (const [k, v] of Object.entries(ctx.vars)) {
      const was = k in ctx.prev ? headId(ctx.prev[k]) : undefined;
      if (was == null || headId(v) === was || g.get(was)?.next !== headId(v)) continue;
      if (k === p1 || k === p2) return v === null ? `${k} is used up: its pile is empty` : `${k}'s top card is now ${headVal(v)}`;
      if (v !== null) return `${k} steps onto the newest card of the answer (${headVal(v)})`;
    }
    return null;
  },
  // just before a node is hooked on: which top card wins?
  predict(ctx) {
    if (!ctx.next) return null;
    const [p1, p2] = ctx.params;
    const f1 = headId(ctx.vars[p1]);
    const f2 = headId(ctx.vars[p2]);
    if (f1 == null || f2 == null) return null;
    const r = relinks(ctx.vars, ctx.next.vars);
    if (r.length !== 1 || (r[0].to !== f1 && r[0].to !== f2)) return null;
    const v1 = headVal(ctx.vars[p1]);
    const v2 = headVal(ctx.vars[p2]);
    const took = r[0].to === f1 ? 0 : 1;
    return {
      question: `Top cards: ${v1} on ${p1}, ${v2} on ${p2}. Which one is hooked onto the answer next?`,
      options: [`${v1} from ${p1}`, `${v2} from ${p2}`],
      answer: took,
      explain: v1 === v2
        ? `Both are ${v1}: your code takes the one from ${took ? p2 : p1}. Either keeps the answer sorted; the other ${v1} comes right after.`
        : `${Math.min(v1, v2)} is the smaller top card, and every card below it is even bigger, so it is the smallest left anywhere.`,
    };
  },
  bugs: [
    {
      label: 'Forget to move the tail forward',
      find: 'tail = tail.next;',
      replace: '',
      explain: 'The tail stays on the dummy, so every new card replaces the previous one instead of going after it: most of the answer is lost.',
    },
    {
      label: 'Return the dummy instead of dummy.next',
      find: 'return dummy.next;',
      replace: 'return dummy;',
      explain: 'The dummy is only a starting hook with value 0; returning it puts a stray 0 in front of the merged list.',
    },
  ],
};
