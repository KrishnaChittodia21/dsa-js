// Scene: Remove Nth Node From End of List. Two walkers hold a rope n nodes long: the front walker goes n nodes
// ahead first, then both walk together, so when the front one reaches the last node the back one stands just
// before the node to remove. Reads moves and re-linking from node ids, so any pointer names work.

const L = (v) => (v && v.$list && Array.isArray(v.$list.ids) ? v.$list : null);
const headId = (v) => (v === null ? null : L(v)?.ids[0]);
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
function relinks(before, after) {
  const a = graph(before);
  const out = [];
  for (const [id, n] of graph(after)) {
    const o = a.get(id);
    if (o && o.next !== undefined && n.next !== undefined && o.next !== n.next) out.push({ id, from: o.next, to: n.next });
  }
  return out;
}
// position (1-based) of an input node, 0 for a node that is not in the input (the dummy); ids follow list order
function posOf(ctx, g, id) {
  const inp = ctx.input?.[0];
  if (!Array.isArray(inp) || !Number.isInteger(id) || !g.has(id)) return null;
  if (id >= 1 && id <= inp.length && g.get(id).val === inp[id - 1]) return id;
  return id > inp.length ? 0 : null;
}
function lab(ctx, g, id) {
  const inp = ctx.input[0];
  const p = posOf(ctx, g, id);
  if (p === null) return null;
  if (p === 0) return 'the dummy before the head';
  return new Set(inp).size === inp.length ? `node ${inp[p - 1]}` : `node #${p} (${inp[p - 1]})`;
}

export default {
  id: 'remove-nth-node-from-end-of-list',
  metaphor: 'Two walkers holding an n-node rope',
  caption: 'The front walker first goes n nodes ahead; then both walk together and the rope stays n long. When the front walker stands on the last node, the back walker is just before the node to cut out.',
  narrate(ctx) {
    const inp = ctx.input?.[0];
    const n = ctx.vars[ctx.params[1]];
    if (!Array.isArray(inp)) return null;
    const len = inp.length;
    const r = relinks(ctx.prev, ctx.vars);
    if (r.length === 1) {
      const g = graph(ctx.prev);
      const gNow = graph(ctx.vars);
      const { id, from, to } = r[0];
      const skips = from !== null && g.get(from)?.next === to;
      const a = lab(ctx, g, id);
      const cut = from === null ? null : lab(ctx, g, from);
      if (!a || !cut || !skips) return null;
      const target = to === null ? 'nothing' : lab(ctx, gNow, to);
      return `${a} now points to ${target}, skipping ${cut}: that node is cut out (${len - 1} left)`;
    }
    const g = graph(ctx.vars);
    const gp = graph(ctx.prev);
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(k) || !(k in ctx.prev)) continue;
      const was = headId(ctx.prev[k]);
      const now = headId(v);
      if (was == null || now === was || gp.get(was)?.next !== now) continue;
      if (now === null) return `${k} walks off the end of the list`;
      const p = posOf(ctx, g, now);
      if (p === null) return null;
      const at = `${lab(ctx, g, now)}${p === len ? ', the last node' : ` (${p} of ${len})`}`;
      // the other walker: the furthest other pointer (the dummy never moves, so it is never further)
      let other = null;
      for (const [o, ov] of Object.entries(ctx.vars)) {
        const q = o === k || ctx.params.includes(o) || ov === null ? null : posOf(ctx, g, headId(ov));
        if (q !== null && (!other || q >= other[1])) other = [o, q];
      }
      if (!other) return `${k} walks to ${at}`;
      const gap = Math.abs(p - other[1]);
      return p > other[1]
        ? `${k} walks ahead to ${at}${Number.isInteger(n) && gap <= n ? `: ${gap} of ${n} nodes in front of ${other[0]}` : ''}`
        : `${k} follows to ${at}: still ${gap} behind ${other[0]}`;
    }
    return null;
  },
  // just before the cut: which node goes?
  predict(ctx) {
    if (!ctx.next || !Array.isArray(ctx.input?.[0])) return null;
    const r = relinks(ctx.vars, ctx.next.vars);
    if (r.length !== 1) return null;
    const g = graph(ctx.vars);
    const { from, to } = r[0];
    if (from === null || g.get(from)?.next !== to) return null;
    const p = posOf(ctx, g, from);
    const len = ctx.input[0].length;
    const n = ctx.input[1];
    if (!p) return null;
    const name = (q) => lab(ctx, g, q);
    const wrong = [p - 1, p + 1, n].filter((q) => q >= 1 && q <= len && q !== p).map(name);
    const opts = [...new Set([name(p), ...wrong])].slice(0, 4).sort();
    if (opts.length < 2) return null;
    return {
      question: `The walk is over (n = ${n}, ${len} nodes). Which node gets cut out?`,
      options: opts,
      answer: opts.indexOf(name(p)),
      explain: p === len - n + 1
        ? `${n} from the end of ${len} nodes is node ${len - n + 1} from the start, and the back walker stands just before it.`
        : `Your walkers stop with ${name(p)} after the back one, but ${n} from the end is node ${len - n + 1} from the start.`,
    };
  },
  bugs: [
    {
      label: 'while (fast) instead of while (fast.next)',
      find: 'while (fast.next)',
      replace: 'while (fast)',
      explain: 'The walkers take one step too many, so the back walker ends ON the target and cuts out the node after it (5 instead of 4).',
    },
    {
      label: 'Return head instead of dummy.next',
      find: 'return dummy.next;',
      replace: 'return head;',
      explain: 'When n equals the length the head itself is cut out, but head still points at that removed node, so it comes back.',
    },
  ],
};
