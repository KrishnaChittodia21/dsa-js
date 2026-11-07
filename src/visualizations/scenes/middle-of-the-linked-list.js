// Scene: Middle of the Linked List. A tortoise and a hare race along the list; the hare takes two nodes per
// step, so when it runs out of track the tortoise has covered half of it. Works with any pointer names: a
// pointer that moves 1 node is the tortoise, one that moves 2 is the hare.

const L = (v) => (v && v.$list && Array.isArray(v.$list.ids) ? v.$list : null);
const headId = (v) => (v === null ? null : L(v)?.ids[0]);
const valOf = (vars, id) => {
  for (const v of Object.values(vars)) {
    const l = L(v);
    const i = l ? l.ids.indexOf(id) : -1;
    if (i >= 0) return l.values[i];
  }
  return undefined;
};
// position (1-based) of a node of the input list: ids are handed out in list order when head is first recorded
function posOf(ctx, id, vars = ctx.vars) {
  const inp = ctx.input?.[0];
  return Array.isArray(inp) && Number.isInteger(id) && id >= 1 && id <= inp.length && valOf(vars, id) === inp[id - 1] ? id : null;
}
const who = (role, k) => (k === role ? `the ${role}` : `the ${role} (${k})`);
function lab(ctx, id, vars = ctx.vars) {
  const inp = ctx.input?.[0];
  const p = posOf(ctx, id, vars);
  if (p === null) return null;
  return new Set(inp).size === inp.length ? `${inp[p - 1]}` : `#${p} (${inp[p - 1]})`;
}
// [name, fromPos, toPos | null] for every non-parameter pointer that moved along the list
function moves(ctx, before, after) {
  const out = [];
  for (const [k, v] of Object.entries(after)) {
    if (ctx.params.includes(k) || !(k in before)) continue;
    const a = headId(before[k]);
    const b = headId(v);
    if (a === undefined || b === undefined || a === null || a === b) continue;
    const pa = posOf(ctx, a, before);
    const pb = b === null ? null : posOf(ctx, b, after);
    if (pa === null || (b !== null && (pb === null || pb <= pa))) continue;
    out.push([k, pa, pb]);
  }
  return out;
}

export default {
  id: 'middle-of-the-linked-list',
  metaphor: 'Tortoise and hare on one track',
  caption: 'The tortoise (slow) moves one node per round, the hare (fast) two. When the hare cannot jump again, the tortoise has covered half the track: it stands on the middle.',
  narrate(ctx) {
    const len = ctx.input?.[0]?.length;
    const m = moves(ctx, ctx.prev, ctx.vars);
    if (m.length === 1) {
      const [k, a, b] = m[0];
      if (b === null) return `${who('hare', k)} jumps off the end of the track: no node left to land on`;
      const at = lab(ctx, b);
      if (b - a === 1) return `${who('tortoise', k)} steps 1 node, onto ${at} (node ${b} of ${len})`;
      if (b - a === 2) return `${who('hare', k)} jumps 2 nodes, onto ${at}${b === len ? ': the last node' : ` (node ${b} of ${len})`}`;
      return `${k} moves on to ${at} (node ${b} of ${len})`;
    }
    const r = L(ctx.result)?.values || (Array.isArray(ctx.result) ? ctx.result : null);
    if (ctx.ret && !ctx.next && r?.length && Number.isInteger(len)) {
      const p = len - r.length + 1;
      return `the race is over: the answer starts at node ${p} of ${len} (${r[0]})${len % 2 === 0 ? ', the second of the two middles' : ', the middle'}`;
    }
    return null;
  },
  // right after the hare jumps: can it jump again?
  predict(ctx) {
    const len = ctx.input?.[0]?.length;
    if (!ctx.next || !Number.isInteger(len)) return null;
    const m = moves(ctx, ctx.prev, ctx.vars);
    if (m.length !== 1) return null;
    const [k, a, b] = m[0];
    const hareMoved = b === null || b - a === 2;
    if (!hareMoved && b - a !== 1) return null;
    // the partner: the only other pointer into the list
    const others = Object.entries(ctx.vars).filter(([n, v]) => n !== k && !ctx.params.includes(n) && n in ctx.prev && (v === null || posOf(ctx, headId(v)) !== null));
    if (others.length !== 1) return null;
    const [pk, pv] = others[0];
    const pp = pv === null ? null : posOf(ctx, headId(pv));
    const [hk, h, t] = hareMoved ? [k, b, pp] : [pk, pp, b];
    if (t === null) return null;
    // ask only once both have moved this round (the hare may start on head or on head.next)
    if (h !== null && ![1, 2].includes(h - 2 * (t - 1))) return null;
    if (h === null && hareMoved && t !== Math.floor((a + 1) / 2) + 1) return null;
    if (h !== null && h < len - 1) return null; // far from the end the answer is obvious
    let goes;
    if (ctx.next.ret) goes = false;
    else if (moves(ctx, ctx.vars, ctx.next.vars).length) goes = true;
    else return null;
    const where = h === null ? 'has jumped off the end' : h === len ? `is on ${lab(ctx, h)}, the last node` : `is on ${lab(ctx, h)} (node ${h} of ${len})`;
    const why = h === null
      ? 'there is no node under the hare at all, so the loop stops.'
      : h === len
        ? 'the hare has no node after it, so it cannot jump again: the loop stops.'
        : 'there is still a node after the hare, so the loop runs another round.';
    return {
      question: `${who('hare', hk).replace('the', 'The')} ${where}. Does the race go on?`,
      options: ['Yes: both move again', 'No: stop, the tortoise is on the middle'],
      answer: goes ? 0 : 1,
      explain: `${goes ? 'Yes' : 'No'}: ${why}`,
    };
  },
  bugs: [
    {
      label: 'Stop one jump early: first middle',
      find: 'fast && fast.next',
      replace: 'fast.next && fast.next.next',
      explain: 'The hare stops while one node is still ahead, so on an even list (1…6) the tortoise stays on 3, the first middle, instead of 4.',
    },
  ],
};
