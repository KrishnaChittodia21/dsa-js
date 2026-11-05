// Scene: Reverse Nodes in k-Group. Each full block of k nodes turns around and is hooked back in. Re-links are read
// off the node ids of every list snapshot, so the learner's names (iterative or recursive) work.

const isList = (v) => !!(v && v.$list && Array.isArray(v.$list.ids));
// every arrow the snapshot shows: node id → next id (null = end of list), and id → value
function linksOf(vars) {
  const next = new Map();
  const val = new Map();
  for (const v of Object.values(vars || {})) {
    if (!isList(v)) continue;
    const { ids, values, cycleTo } = v.$list;
    ids.forEach((id, i) => {
      val.set(id, values[i]);
      if (i + 1 < ids.length) next.set(id, ids[i + 1]);
      else if (Number.isInteger(cycleTo)) next.set(id, ids[cycleTo]);
      else if (ids.length < 64) next.set(id, null); // a 64-node snapshot may be cut: its end is unknown
    });
  }
  return { next, val };
}
// arrows that changed between two snapshots: [{ id, from, to }]
function relinks(before, after) {
  const a = linksOf(before);
  const b = linksOf(after);
  const out = [];
  for (const [id, to] of b.next) if (a.next.has(id) && a.next.get(id) !== to) out.push({ id, from: a.next.get(id), to });
  return { out, next: b.next, val: new Map([...a.val, ...b.val]) };
}
function chain(next, val, id, max = 7) {
  const out = [];
  const seen = new Set();
  for (let n = id; n !== null && n !== undefined && out.length < max; n = next.get(n)) {
    if (seen.has(n)) return `${out.join(' → ')} → (loops back to ${val.get(n)})`;
    seen.add(n);
    out.push(val.get(n));
    if (!next.has(n)) return `${out.join(' → ')} → …`;
  }
  return out.join(' → ') + (out.length === max ? ' → …' : '');
}
// a pointer that stepped to another node (no arrow changed): "cur moves to node 3"
function moved(ctx) {
  const ks = Object.keys(ctx.vars).filter((k) => k in ctx.prev && (isList(ctx.vars[k]) || ctx.vars[k] === null) && (isList(ctx.prev[k]) || ctx.prev[k] === null));
  const head = (v) => (isList(v) ? v.$list.ids[0] : null);
  const m = ks.filter((k) => head(ctx.vars[k]) !== head(ctx.prev[k]));
  if (m.length !== 1) return null;
  const v = ctx.vars[m[0]];
  return isList(v) ? `${m[0]} moves to node ${v.$list.values[0]}` : `${m[0]} runs off the end (null)`;
}
const recursive = (ctx) => {
  const f = /function\s+(\w+)/.exec(ctx.lines[0] || '') || /(\w+)\s*=\s*(?:function|\()/.exec(ctx.lines[0] || '');
  return !!f && ctx.lines.join('\n').split(`${f[1]}(`).length > 2;
};
// input nodes get ids 1..n in list order; on a long list (cut snapshots) ids past 64 are not positions, so no dummy is named
const inputLen = (ctx) => {
  const a = ctx.input?.[0];
  const len = Array.isArray(a) ? a.length : a && Number.isInteger(a.$length) ? a.$length : 0;
  return len <= 63 ? len : Infinity;
};

// one changed arrow, in words: "node 3 now points back to 2 · 1 → 3 → 2 → 4 → 5"
function relinkNote(ctx) {
  const { out, next, val } = relinks(ctx.prev, ctx.vars);
  const n = inputLen(ctx);
  const who = (id) => (id > n ? 'the dummy' : `node ${val.get(id)}`);
  if (out.length > 1) return out.length > 3 ? `${out.length} arrows changed since the last step shown` : out.map(({ id, to }) => `${who(id)} → ${to === null ? 'nothing' : val.get(to)}`).join(', ');
  if (out.length !== 1) return null;
  const { id, from, to } = out[0];
  if (to === null) return `${who(id)} now points to nothing: the end of the turned part, for now`;
  const c = chain(next, val, id);
  if (id > n) return `the dummy now points to ${val.get(to)}: the list starts there · ${chain(next, val, to)}`;
  if (to < id && to <= n) return `${who(id)} now points back to ${val.get(to)} · ${c}`;
  return `${who(id)} now points to ${val.get(to)}${from === null || from === undefined ? '' : ` instead of ${val.get(from)}`} · ${c}`;
}
// just before one arrow of an input node changes: where will it point? (keep(rel) picks which ones to ask)
function arrowCard(ctx, keep) {
  if (!ctx.next) return null;
  const { out, val } = relinks(ctx.vars, ctx.next.vars);
  const n = inputLen(ctx);
  if (out.length !== 1 || out[0].id > n || !keep(out[0], n)) return null;
  const { id, from, to } = out[0];
  const lab = (x) => (x === null ? 'nothing (end of the list)' : x > n ? 'the dummy' : `node ${val.get(x)}`);
  const right = lab(to);
  const wrong = [...new Set([lab(from), to === null ? lab(id - 1 >= 1 ? id - 1 : from) : lab(null)])].filter((o) => o !== right);
  if (!wrong.length) return null;
  const all = [right, ...wrong].sort();
  return { id, from, to, v: (x) => val.get(x), card: { question: `Node ${val.get(id)} points to ${lab(from)} right now. Where will its arrow point after the next step?`, options: all, answer: all.indexOf(right) } };
}

export default {
  id: 'reverse-nodes-in-k-group',
  metaphor: 'Flipping train cars in blocks of k',
  caption: 'The chain is cut into blocks of k nodes. Each full block turns around in place and is hooked back between its neighbours; a short last block is left as it is.',
  narrate(ctx) {
    const [hName, kName] = ctx.params;
    const arr = ctx.input?.[0];
    const k = ctx.vars[kName];
    if (ctx.index === 0 && Array.isArray(arr) && Number.isInteger(k) && k >= 1 && arr.length <= 24) {
      const blocks = [];
      for (let i = 0; i < arr.length; i += k) blocks.push(arr.slice(i, i + k).join(' '));
      const short = arr.length % k;
      return `blocks of ${k}: ${blocks.join(' | ')}${short ? ` (the last ${short} node${short > 1 ? 's are' : ' is'} short of a block and stay${short > 1 ? '' : 's'})` : ''}`;
    }
    const told = relinkNote(ctx);
    if (told) return told;
    if (ctx.ret && !ctx.next && Array.isArray(ctx.result) && Array.isArray(arr) && Number.isInteger(k) && k >= 1) {
      const short = arr.length % k;
      return `${short ? `fewer than ${k} nodes left, so the last block stays · ` : 'every block is turned · '}${ctx.result.slice(0, 10).join(' → ')}`;
    }
    // recursion: the head parameter only changes when a call starts or ends
    const h = ctx.vars[hName];
    const was = ctx.prev[hName];
    if (recursive(ctx) && isList(h) && isList(was) && h.$list.ids[0] !== was.$list.ids[0]) {
      return h.$list.ids[0] > was.$list.ids[0] ? `one call deeper: the call for the block starting at ${h.$list.values[0]}` : `back in the call for the block starting at ${h.$list.values[0]}`;
    }
    const mv = moved(ctx);
    return mv && mv.split(' ')[0] !== hName ? mv : null;
  },
  // just before an arrow inside a block changes
  predict(ctx) {
    const c = arrowCard(ctx, ({ to }) => to !== null);
    if (!c) return null;
    const back = c.to < c.id;
    return {
      ...c.card,
      explain: back
        ? `Inside the block every arrow turns back: node ${c.v(c.id)} now points at ${c.v(c.to)}, the node before it.`
        : `Node ${c.v(c.id)} ends up last in its turned block, so it must lead on to ${c.v(c.to)}, which comes right after the block in the finished list.`,
    };
  },
  bugs: [
    {
      label: 'Next anchor = kth instead of the old first node',
      find: 'groupPrev = first;',
      replace: 'groupPrev = kth;',
      explain: 'After turning, kth is the front of the block and the old first node is its tail; anchoring at kth makes the next block start one node too early, so the blocks come out wrong.',
    },
    {
      label: 'Forget to hook the turned block in',
      find: 'groupPrev.next = kth;',
      replace: ';',
      explain: 'The node before the block still points at the old first node (now the block\'s tail), so the new front of the block is skipped and nodes disappear from the answer.',
    },
  ],
};
