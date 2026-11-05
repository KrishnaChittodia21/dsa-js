// Scene: Reorder List. Shuffle a deck by hand: cut it in the middle, turn the back half over, then riffle the
// two halves together one card from each (first, last, second, second-to-last…). Reads moves and re-linking
// from node ids, so any pointer names work.

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
    if (o && o.next !== undefined && n.next !== undefined && o.next !== n.next) out.push({ id, to: n.next });
  }
  return out;
}
// position (1-based) of an input node: ids are handed out in list order when head is first recorded
function posOf(ctx, g, id) {
  const inp = ctx.input?.[0];
  return Array.isArray(inp) && Number.isInteger(id) && id >= 1 && id <= inp.length && g.get(id)?.val === inp[id - 1] ? id : null;
}
function lab(ctx, p) {
  const inp = ctx.input[0];
  return new Set(inp).size === inp.length ? `${inp[p - 1]}` : `#${p} (${inp[p - 1]})`;
}
const half = (ctx) => Math.ceil(ctx.input[0].length / 2); // nodes 1..half are the front half

export default {
  id: 'reorder-list',
  metaphor: 'Cut, flip and riffle a deck',
  caption: 'Find the middle and cut the list in two. Turn the back half around so its last node comes first, then weave: one node from the front, one from the back, until the back half is used up.',
  narrate(ctx) {
    const inp = ctx.input?.[0];
    if (!Array.isArray(inp)) return null;
    const len = inp.length;
    const g = graph(ctx.vars);
    const r = relinks(ctx.prev, ctx.vars);
    if (r.length === 1) {
      const p = posOf(ctx, g, r[0].id);
      if (p === null) return null;
      if (r[0].to === null) {
        if (p <= half(ctx)) {
          const front = L(ctx.vars[ctx.params[0]]);
          return `cut after ${lab(ctx, p)}: it now points to nothing${front ? `, the front half is ${front.values.join(' → ')}` : ''}`;
        }
        return `${lab(ctx, p)} now points to nothing: it will be the end of the turned-around back half`;
      }
      const q = posOf(ctx, g, r[0].to);
      if (q === null) return null;
      const now = L(ctx.vars[ctx.params[0]]);
      const list = now && now.values.length > 1 ? ` · list: ${now.values.join(' → ')}` : '';
      if (p > half(ctx) && q > half(ctx) && q < p) return `${lab(ctx, p)} now points back to ${lab(ctx, q)}`;
      if (p <= half(ctx) && q > half(ctx)) return `${lab(ctx, p)} now points to ${lab(ctx, q)}: a back card slots in after a front card${list}`;
      if (p > half(ctx) && q <= half(ctx)) return `${lab(ctx, p)} now points to ${lab(ctx, q)}: the weave goes on with the front half${list}`;
      return `${lab(ctx, p)} now points to ${lab(ctx, q)}${list}`;
    }
    const gp = graph(ctx.prev);
    const headIds = L(ctx.vars[ctx.params[0]])?.ids || [];
    const weaving = headIds.some((id) => posOf(ctx, g, id) > half(ctx));
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(k) || !(k in ctx.prev)) continue;
      const was = headId(ctx.prev[k]);
      const now = headId(v);
      if (was == null || now === was || gp.get(was)?.next === undefined) continue;
      const a = posOf(ctx, gp, was);
      const b = now === null ? null : posOf(ctx, g, now);
      if (a === null || (now !== null && b === null)) continue;
      if (headIds.length === len && headIds.every((id, i) => id === i + 1)) {
        // the middle search: pointers walking forward along untouched links
        if (now === null && gp.get(was).next !== undefined) return `${k} runs off the end`;
        if (b === a + 1) return `${k} steps 1 node, onto ${lab(ctx, b)}`;
        if (b === a + 2) return `${k} jumps 2 nodes, onto ${lab(ctx, b)}${b === len ? ', the last node' : ''}`;
        continue;
      }
      if (now === null) continue;
      if (weaving) return `${k} moves on to ${lab(ctx, b)}, the next ${b > half(ctx) ? 'back' : 'front'} card`;
      if (b <= half(ctx)) continue;
      const nx = g.get(now).next;
      if (nx === null ? b !== len : posOf(ctx, g, nx) < b) return `${k} moves onto ${lab(ctx, b)}: the turned-around part now starts there`;
      return `${k} moves on to ${lab(ctx, b)}, the next node to turn around`;
    }
    return null;
  },
  // just before a front node is re-linked to a back node: which one?
  predict(ctx) {
    if (!ctx.next || !Array.isArray(ctx.input?.[0])) return null;
    const r = relinks(ctx.vars, ctx.next.vars);
    if (r.length !== 1 || r[0].to === null) return null;
    const g = graph(ctx.vars);
    const gn = graph(ctx.next.vars);
    const p = posOf(ctx, g, r[0].id);
    const q = posOf(ctx, gn, r[0].to);
    const len = ctx.input[0].length;
    if (p === null || q === null || p > half(ctx) || q <= half(ctx)) return null;
    const wrong = [p + 1, half(ctx) + 1, len, q - 1].filter((x) => x >= 1 && x <= len && x !== q && x !== p);
    const opts = [...new Set([lab(ctx, q), ...wrong.map((x) => lab(ctx, x))])].slice(0, 4).sort();
    if (opts.length < 2) return null;
    return {
      question: `Weaving: which node goes right after ${lab(ctx, p)}?`,
      options: opts,
      answer: opts.indexOf(lab(ctx, q)),
      explain: `After a front card comes the top of the turned-around back half: ${lab(ctx, q)}, the ${q === len ? 'last node' : `node ${len - q + 1} from the end`} of the original list.`,
    };
  },
  bugs: [
    {
      label: 'Forget to cut the list in two',
      find: 'slow.next = null;              // cut',
      replace: '',
      explain: 'The front half still runs into the back half, so after the weave the list loops back on itself (a cycle) instead of ending.',
    },
  ],
};
