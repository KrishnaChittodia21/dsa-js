// Scene: Sort List (merge sort on a linked list). Cuts and merges are read off the node ids of every list snapshot,
// so the learner's names (and a recursive or loop merge) work.

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

// the two fronts of a merge: the list that just lost (or is about to lose) its first node `to`, and the other list
function fronts(vars, to, src, n) {
  const lists = Object.entries(vars).filter(([, v]) => isList(v) && v.$list.ids.every((x) => x <= n));
  const chosen = lists.find(([, v]) => v.$list.ids[0] === to);
  if (!chosen) return null;
  const others = lists.filter(([, v]) => v.$list.ids[0] !== to && !v.$list.ids.includes(src) && !chosen[1].$list.ids.includes(v.$list.ids[0]));
  return { chosen: chosen[1].$list, other: others.length === 1 ? others[0][1].$list : null, alone: others.length === 0, chosenFirst: others.length === 1 && lists.indexOf(chosen) < lists.indexOf(others[0]) };
}
const show = (l) => l.values.slice(0, 6).join(' → ') + (l.values.length > 6 ? ' → …' : '');

export default {
  id: 'sort-list',
  metaphor: 'Split the deck, sort halves, zip together',
  caption: 'Merge sort on a chain: cut it at the middle until every piece is a single node, then zip sorted pieces back together by always taking the smaller front node. Only arrows change; no values move.',
  narrate(ctx) {
    const p = ctx.params[0];
    const n = inputLen(ctx);
    const h = ctx.vars[p];
    const { out, next, val } = relinks(ctx.prev, ctx.vars);
    const who = (id) => (id > n ? 'the dummy' : `node ${val.get(id)}`);
    if (out.length === 1) {
      const { id, from, to } = out[0];
      if (to === null && from !== null && from !== undefined) {
        const first = isList(h) ? show(h.$list) : val.get(id);
        return `cut after ${val.get(id)}: two halves, ${first} and ${chain(next, val, from, 6)}`;
      }
      if (to !== null) {
        const f = fronts(ctx.prev, to, id, n);
        const v = val.get(to);
        if (f && f.alone) return `only ${f.chosen.values.join(' → ')} is left: ${who(id)} links to it and the merge is done`;
        if (f && f.other && v <= f.other.values[0]) return `${v} (vs ${f.other.values[0]}) is the smaller front: ${id > n ? 'it starts the merged chain' : `it joins after ${val.get(id)}`}`;
        return `${who(id)} now points to ${v}`;
      }
    }
    if (ctx.ret && (h === null || (isList(h) && h.$list.ids.length === 1)) && new RegExp(`return\\s+${p}\\s*;`).test(ctx.src)) {
      return h === null ? 'an empty list is already sorted' : `${h.$list.values[0]} is alone: a one-node list is already sorted`;
    }
    if (isList(h) && ctx.index === 0) return `sort ${show(h.$list)}: cut it in half, sort each half, zip them together`;
    if (ctx.ret && isList(h) && !(p in ctx.prev) && /\(/.test(ctx.src)) return 'back in this call: both halves came back sorted and zipped, and it hands the result up';
    // a call just started: only the parameter is in scope
    if (isList(h) && Object.keys(ctx.vars).every((k) => ctx.params.includes(k))) {
      return `a new call sorts the piece ${show(h.$list)}`;
    }
    if (!(p in ctx.vars) && p in ctx.prev) {
      const halves = Object.values(ctx.vars).filter((v) => isList(v) && v.$list.ids.every((x) => x <= n));
      if (halves.length === 2) return `zip the sorted pieces ${show(halves[0].$list)} and ${show(halves[1].$list)} together`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const p = ctx.params[0];
    const n = inputLen(ctx);
    const { out, val } = relinks(ctx.vars, ctx.next.vars);
    if (out.length !== 1) return null;
    const { id, from, to } = out[0];
    const h = ctx.vars[p];
    // the cut: where does the piece split?
    if (to === null && isList(h) && h.$list.ids.length >= 3 && h.$list.ids.length <= 8) {
      const { ids, values } = h.$list;
      const at = ids.indexOf(id);
      if (at < 0 || at >= ids.length - 1 || ids[at + 1] !== from) return null;
      const split = (k) => `${values.slice(0, k + 1).join(' → ')} | ${values.slice(k + 1).join(' → ')}`;
      const cuts = values.slice(0, -1).map((_, k) => split(k));
      const all = [...new Set(cuts)];
      if (all.length < 2) return null;
      return { question: `Where is ${values.join(' → ')} cut in two?`, options: all, answer: all.indexOf(split(at)), explain: `The slow pointer stops at the first middle (${values[at]}), so the piece splits into ${at + 1} and ${values.length - at - 1} nodes; cutting there makes both halves smaller every time.` };
    }
    // a merge step: which front goes next?
    if (to === null || !n) return null;
    const f = fronts(ctx.vars, to, id, n);
    if (!f || !f.other || (f.chosen.ids.length < 2 && f.other.ids.length < 2)) return null;
    const a = val.get(to);
    const b = f.other.values[0];
    if (a === b || !(a < b)) return null;
    return {
      question: `The two sorted pieces start with ${a} (${show(f.chosen)}) and ${b} (${show(f.other)}). Which node joins the merged chain next?`,
      options: f.chosenFirst ? [String(a), String(b)] : [String(b), String(a)],
      answer: f.chosenFirst ? 0 : 1,
      explain: `Both pieces are sorted, so the smallest node left is one of the two fronts: ${a} is smaller than ${b}, so ${a} goes first.`,
    };
  },
  bugs: [
    {
      label: 'Split at the second middle',
      find: 'let slow = head, fast = head.next;',
      replace: 'let slow = head, fast = head;',
      explain: 'With fast starting on head, a two-node list is "split" into both nodes and nothing, so the same list is sorted again and again until the call stack overflows.',
    },
    {
      label: 'Drop the leftover nodes after the merge loop',
      find: 'tail.next = a ?? b;',
      replace: 'tail.next = null;',
      explain: 'When one piece runs out, the other still holds its largest nodes; cutting them off loses them at every level, so [4,2,1,3] comes back as just [1].',
    },
  ],
};
