// Scene: Palindrome Linked List. Fold the list in half like a strip of paper: find the middle (slow / fast),
// turn the back half around so it points backwards, then walk in from both ends and compare pair by pair.
// Reads moves and re-linking from node ids, so any pointer names work.

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
const lab = (ctx, p) => `#${p} (${ctx.input[0][p - 1]})`;

// the pair being compared: a pointer on the turned-around back half that just moved (or appeared), and the
// furthest pointer on the front half that still points forward
function pairOf(ctx, needMove = true) {
  const g = graph(ctx.vars);
  const gp = graph(ctx.prev);
  const at = (v) => (v === null ? null : posOf(ctx, g, headId(v)));
  let back = null;
  for (const [k, v] of Object.entries(ctx.vars)) {
    const p = at(v);
    if (ctx.params.includes(k) || p === null) continue;
    const nx = g.get(p).next;
    const moved = !(k in ctx.prev) || (headId(ctx.prev[k]) != null && gp.get(headId(ctx.prev[k]))?.next === p);
    const len = ctx.input[0].length;
    // a null next on the old tail is only the not-yet-turned end (or a one-node back half, checked below)
    if ((nx === null || posOf(ctx, g, nx) < p) && (!needMove || moved)) back = [k, p, nx === null && p === len];
  }
  if (!back) return null;
  const changed = (k) => !(k in ctx.prev) || headId(ctx.prev[k]) !== headId(ctx.vars[k]);
  const cut = (L(ctx.vars[ctx.params[0]])?.ids.length ?? Infinity) < ctx.input[0].length;
  let front = null;
  for (const [k, v] of Object.entries(ctx.vars)) {
    const p = at(v);
    if (k === back[0] || ctx.params.includes(k) || p === null || p > back[1] || g.get(p).next !== p + 1) continue;
    if (!front || p > front[1]) front = [k, p];
  }
  if (!front) return null;
  // compare phase only: the list is already cut in two, or both pointers were just set together
  const both = changed(front[0]) && changed(back[0]);
  if ((back[2] || (needMove && !cut)) && !both) return null;
  return { front, back };
}

export default {
  id: 'palindrome-linked-list',
  metaphor: 'Fold the strip in half and compare',
  caption: 'First slow and fast find the middle. Then the back half is turned around, node by node, so it points back toward the middle. Last, two pointers walk in from both ends; every pair must match.',
  narrate(ctx) {
    const inp = ctx.input?.[0];
    if (!Array.isArray(inp)) return null;
    const len = inp.length;
    if (ctx.ret && !ctx.next && typeof ctx.result === 'boolean') {
      return ctx.result ? 'no pair differed: the list reads the same both ways' : 'a pair does not match: not a palindrome';
    }
    const r = relinks(ctx.prev, ctx.vars);
    if (r.length === 1) {
      const g = graph(ctx.vars);
      const p = posOf(ctx, g, r[0].id);
      if (p === null) return null;
      if (r[0].to === null) return `node ${lab(ctx, p)} now points to nothing: it is the far end of the turned-around back half`;
      const q = posOf(ctx, g, r[0].to);
      if (q === null) return null;
      return `node ${lab(ctx, p)} now points ${q < p ? 'back ' : ''}to ${lab(ctx, q)}`;
    }
    const pair = pairOf(ctx, true);
    if (pair) return `next pair: ${pair.front[0]} on ${lab(ctx, pair.front[1])} and ${pair.back[0]} on ${lab(ctx, pair.back[1])}`;
    const g = graph(ctx.vars);
    const gp = graph(ctx.prev);
    for (const [k, v] of Object.entries(ctx.vars)) {
      if (ctx.params.includes(k) || !(k in ctx.prev)) continue;
      const was = headId(ctx.prev[k]);
      const now = headId(v);
      if (was == null || now === was) continue;
      if (now === null && gp.get(was)?.next !== undefined) return `${k} runs off the end`;
      const a = posOf(ctx, gp, was);
      const b = posOf(ctx, g, now);
      if (a === null || b === null) continue;
      const follows = gp.get(was)?.next === now;
      const nx = g.get(now).next;
      if (!follows && (nx === null ? b !== len : posOf(ctx, g, nx) < b)) return `${k} moves onto ${lab(ctx, b)}: the turned-around part now starts there`;
      if (!follows && b === a + 1) return `${k} moves on to ${lab(ctx, b)}, the next node to turn around`;
      if (follows && b === a + 1) return `${k} steps 1 node, onto ${lab(ctx, b)}`;
      if (follows && b < a) return `${k} steps back toward the middle, onto ${lab(ctx, b)}`;
      if (b === a + 2) return `${k} jumps 2 nodes, onto ${lab(ctx, b)}${b === len ? ', the last node' : ''}`;
    }
    return null;
  },
  // a pair is lined up: does it match?
  predict(ctx) {
    if (!ctx.next || !Array.isArray(ctx.input?.[0])) return null;
    const pair = pairOf(ctx, true);
    if (!pair) return null;
    const g = graph(ctx.vars);
    const x = g.get(pair.front[1]).val;
    const y = g.get(pair.back[1]).val;
    let same = null;
    if (ctx.next.ret) same = ctx.result === false ? false : null;
    else if ([pair.front[0], pair.back[0]].some((k) => headId(ctx.next.vars[k]) !== headId(ctx.vars[k]))) same = true;
    if (same === null || same !== (x === y)) return null;
    return {
      question: `${pair.front[0]} is on ${lab(ctx, pair.front[1])}, ${pair.back[0]} on ${lab(ctx, pair.back[1])}. Does this pair match?`,
      options: ['Yes: both move one node inward', 'No: return false'],
      answer: same ? 0 : 1,
      explain: same ? `Both hold ${x}, so the walk goes on to the next pair.` : `${x} ≠ ${y}: the list cannot read the same both ways, so the answer is false right away.`,
    };
  },
  bugs: [
    {
      label: 'Compare the nodes, not their values',
      find: 'a.val !== b.val',
      replace: 'a !== b',
      explain: 'Two different nodes are never the same object, even when both hold 1, so every list longer than one node is called not a palindrome.',
    },
  ],
};
