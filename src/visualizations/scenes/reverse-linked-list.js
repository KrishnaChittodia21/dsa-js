// Scene: Reverse Linked List. A chain of arrows turned around one at a time: every step points one more node back
// at the node before it. Re-links are read off the node ids of every list snapshot, so any names (and recursion) work.

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

export default {
  id: 'reverse-linked-list',
  metaphor: 'Turning a chain of arrows around',
  caption: 'Each node holds one arrow to the next node. The walk turns the arrows around one at a time, so the turned part grows at the front while the untouched rest waits behind; the old tail ends up as the new head.',
  narrate(ctx) {
    const { out, next, val } = relinks(ctx.prev, ctx.vars);
    const n = inputLen(ctx);
    if (out.length === 1) {
      const { id, to } = out[0];
      if (to === null) return `node ${val.get(id)} now points to nothing: it is the end of the turned part`;
      const dir = id <= n && to <= n && to < id ? 'back to' : 'to';
      const c = chain(next, val, id);
      if (c === `${val.get(id)} → ${val.get(to)} → (loops back to ${val.get(id)})`) return `node ${val.get(id)} now points ${dir} ${val.get(to)}; ${val.get(to)} still points to ${val.get(id)} until its own arrow is cleared`;
      return `node ${val.get(id)} now points ${dir} ${val.get(to)} · turned part: ${c}`;
    }
    if (out.length > 1) return out.length > 3 ? `${out.length} arrows changed since the last step shown` : out.map(({ id, to }) => `${val.get(id)} → ${to === null ? 'nothing' : val.get(to)}`).join(', ');
    // the step before a turn: the rest of the list is saved in a variable, or it would be lost
    if (ctx.next) {
      const soon = relinks(ctx.vars, ctx.next.vars).out;
      const m = /^(?:const|let|var)?\s*(\w+)\s*=\s*(\w+)\.next\s*;/.exec(ctx.src);
      if (soon.length === 1 && m && isList(ctx.vars[m[2]]) && ctx.vars[m[2]].$list.ids[0] === soon[0].id) {
        const saved = ctx.vars[m[1]];
        const rest = isList(saved) ? saved.$list.values.slice(0, 6).join(' → ') : 'nothing';
        return `hold on to the rest (${rest}) before node ${val.get(soon[0].id)}'s arrow is turned`;
      }
    }
    const r = /^return\s+(\w+)\s*;/.exec(ctx.src);
    if (ctx.ret && r && isList(ctx.vars[r[1]])) return `${ctx.next ? 'this call hands back the reversed part' : `every arrow is turned: ${r[1]} holds the new head`} · ${ctx.vars[r[1]].$list.values.slice(0, 7).join(' → ')}`;
    const mv = moved(ctx);
    const p = ctx.params[0];
    // recursion: the parameter only changes when a call starts or ends
    if (mv && mv.startsWith(`${p} `) && recursive(ctx) && isList(ctx.vars[p]) && isList(ctx.prev[p])) {
      const v = ctx.vars[p].$list.values[0];
      return ctx.vars[p].$list.ids[0] > ctx.prev[p].$list.ids[0] ? `one call deeper: the call for node ${v} starts` : `back in the call for node ${v}`;
    }
    return mv && `${mv}${/prev|rev|new|done|before/i.test(mv) ? ': the front of the turned part' : ''}`;
  },
  // just before an arrow turns: where will it point?
  predict(ctx) {
    if (!ctx.next) return null;
    const { out, val } = relinks(ctx.vars, ctx.next.vars);
    const n = inputLen(ctx);
    if (out.length !== 1 || out[0].id > n) return null;
    const { id, from, to } = out[0];
    const lab = (x) => (x === null ? 'nothing (end of the list)' : `node ${val.get(x)}`);
    const opts = [lab(to), lab(from), to === null ? lab(id + 1 <= n ? id + 1 : from) : lab(null)];
    const right = lab(to);
    const wrong = [...new Set(opts.filter((o) => o !== right))];
    if (!wrong.length) return null;
    const all = [right, ...wrong].slice(0, 4).sort();
    return {
      question: `Node ${val.get(id)} points to ${lab(from)} right now. Where will its arrow point after the next step?`,
      options: all,
      answer: all.indexOf(right),
      explain: to === null
        ? `Node ${val.get(id)} becomes the end of the turned part, so its arrow must point to nothing, or the list would loop.`
        : `Turning the arrow means pointing node ${val.get(id)} back at the node before it, ${val.get(to)}; the rest of the list was saved first.`,
    };
  },
  bugs: [
    {
      label: 'Return head (now the tail)',
      find: 'return prev;',
      replace: 'return head;',
      explain: 'After the loop the first node is the last one and points to nothing, so returning head gives just [1] instead of the whole reversed list.',
    },
    {
      label: 'Step through the turned arrow',
      find: 'cur = next;',
      replace: 'cur = cur.next;',
      explain: 'cur.next was just turned back, so cur.next is the node behind: the walk falls off after one node and the rest of the list is lost.',
    },
  ],
};
