// Clone Graph: build a twin of every node, then wire the twins exactly like the originals. A map (original → twin)
// is the guest list: a node already on it is reused, which is what stops a cycle from being copied forever.
// The graphs are drawn from the recorded $graph nodes. Works with the recursive DFS and with a BFS queue; the map may be keyed by node or by val.

const VISIT = ['orig', 'node', 'n', 'cur', 'curr', 'u', 'original', 'old', 'src', 'nb', 'nei', 'neighbor', 'neighbour', 'v', 'next'];
// a Node is recorded as { $graph: { nodes: [{ id, val, nb }] } } (nodes[0] is the node itself, nb its neighbours' indexes in push order)
const head = (x) => (x && x.$graph && x.$graph.nodes[0]) || null;
const valOf = (x) => (Number.isInteger(head(x)?.val) ? head(x).val : Number.isInteger(x) ? x : undefined);
const isNode = (x) => Number.isInteger(head(x)?.val);
const nbVals = (x) => (isNode(x) ? head(x).nb.map((i) => x.$graph.nodes[i]?.val) : null);

/** [name, entries] of the original → copy map */
function mapOf(vars) {
  const hit = Object.entries(vars || {}).find(([, v]) => v && v.$map);
  if (hit) return [hit[0], hit[1].$map, hit[1].$size];
  // an array indexed by val (copies[val] = new Node(val))
  const arr = Object.entries(vars || {}).find(([k, v]) => /cop|clone|map|seen|visited|old/i.test(k) && Array.isArray(v) && v.some(isNode));
  return arr ? [arr[0], arr[1].map((x, i) => (isNode(x) ? [i, x] : null)).filter(Boolean), arr[1].filter(isNode).length] : [];
}
const copied = (vars) => new Set((mapOf(vars)[1] || []).map(([k]) => valOf(k)));
const visiting = (vars, prev) => VISIT.find((k) => isNode(vars?.[k]) && valOf(vars[k]) !== valOf(prev?.[k]));

export default {
  id: 'clone-graph',
  metaphor: 'Building a twin of every node',
  caption: 'The map is a guest list: original node → its twin. A twin is made the first time a node is met, and every later visit reuses it, so cycles end and the copy has exactly one twin per node.',
  narrate(ctx) {
    const n = Array.isArray(ctx.input?.[0]) ? ctx.input[0].length : 0;
    if (ctx.ret && ctx.value === null) return 'no starting node: the clone of an empty graph is empty';
    // a twin was put on the guest list
    const [, now, size] = mapOf(ctx.vars);
    const [, , before] = mapOf(ctx.prev);
    if (now && size > (before ?? 0) && size > 0) {
      const v = valOf(now[now.length - 1][0]);
      return `node ${v} is on the guest list now, with its twin (${size} of ${n} copied)`;
    }
    // a twin's edge list grew (after a recursive call, prev is the deeper call's step, so read the push line)
    const twin = Object.keys(ctx.vars).find((k) => /copy|clone|twin|^c$|^new|^cp$/i.test(k) && isNode(ctx.vars[k]));
    const tn = twin && nbVals(ctx.vars[twin]);
    if (!ctx.ret && tn?.length && /neighbou?rs\.push\(/.test(ctx.src || '')) {
      const u = valOf(ctx.vars[twin]);
      const w = tn[tn.length - 1];
      return `twin ${u} gets an edge to twin ${w ?? '?'} (like the original edge ${u}–${w ?? '?'})`;
    }
    // BFS: an edge pushed straight onto a twin inside the map
    if (now && /neighbou?rs\.push\(/.test(ctx.src || '')) {
      const old = new Map((mapOf(ctx.prev)[1] || []).map(([k, x]) => [valOf(k), (nbVals(x) || []).length]));
      const grew = now.find(([k, x]) => old.has(valOf(k)) && (nbVals(x) || []).length === old.get(valOf(k)) + 1);
      if (grew) {
        const u = valOf(grew[0]);
        // deep entries are cut off: fall back to the neighbour being handled
        const nk = ['nei', 'nb', 'neighbor', 'neighbour', 'next', 'v', 'n'].find((k) => isNode(ctx.vars[k]));
        const w = nbVals(grew[1]).slice(-1)[0] ?? (nk && valOf(ctx.vars[nk]));
        if (w === undefined) return `twin ${u} gets one more edge`;
        return `twin ${u} gets an edge to twin ${w} (like the original edge ${u}–${w})`;
      }
    }
    if (ctx.ret && isNode(ctx.value)) {
      const v = valOf(ctx.value);
      if (!ctx.next) return `the whole twin graph is built (${n} new node${n === 1 ? '' : 's'}): hand back twin ${v}`;
      if (/\.get\(|\]\s*;/.test(ctx.src || '') && !/return\s+\w+\s*;/.test(ctx.src || '')) return `node ${v} already has a twin: reuse it, no new copy (this is how a cycle ends)`;
      const nb = nbVals(ctx.value);
      return `twin ${v} is finished${nb ? `, ${nb.length ? `linked to twins ${nb.join(', ')}` : 'with no edges'}` : ''}`;
    }
    const fresh = Object.keys(ctx.vars).find((k) => isNode(ctx.vars[k]) && !nbVals(ctx.vars[k]).length && /new\s+\w+\(/.test(ctx.src || '') && valOf(ctx.vars[k]) !== valOf(ctx.prev[k]));
    if (fresh) return `make twin ${valOf(ctx.vars[fresh])}: same value, no edges yet`;
    const at = visiting(ctx.vars, ctx.prev);
    const q = Object.keys(ctx.vars).find((k) => /queue|^q$|stack|^st$/i.test(k) && Array.isArray(ctx.vars[k]) && Array.isArray(ctx.prev[k]) && ctx.vars[k].length < ctx.prev[k].length);
    if (at && q) return `take original node ${valOf(ctx.vars[at])} off the ${/stack|st/i.test(q) ? 'stack' : 'queue'}: wire its twin to its neighbours' twins`;
    if (at && /\.has\(|\.get\(|\[\s*\w+(\.val)?\s*\]/.test(ctx.src || '')) return `visit original node ${valOf(ctx.vars[at])}`;
    return null;
  },
  // the next step visits a node: is it already on the guest list?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx) return null;
    // the next step is the guest-list check itself (not a return to a caller)
    if (!/\.has\(|\.get\(|\[\s*\w+(\.val)?\s*\]/.test(ctx.lines[nx.line - 1] || '')) return null;
    const at = visiting(nx.vars, ctx.vars);
    const [, entries] = mapOf(ctx.vars);
    if (!at || !entries || !entries.length) return null;
    const v = valOf(nx.vars[at]);
    // only when the map is not changed by the next step itself
    if ((mapOf(nx.vars)[2] ?? 0) !== entries.length) return null;
    const has = copied(ctx.vars).has(v);
    return {
      question: `Node ${v} comes up (guest list: ${[...copied(ctx.vars)].join(', ')}). What happens?`,
      options: ['Reuse its twin from the map', 'Make a new twin'],
      answer: has ? 0 : 1,
      explain: has ? `${v} is already on the guest list, so its twin is reused; making another would split one node in two (and a cycle would never end).` : `${v} is not on the guest list yet: this is the first time it is met, so a twin is made and registered.`,
    };
  },
  bugs: [
    {
      label: 'Register the twin after the neighbours',
      find: 'copies.set(orig, copy);              // store BEFORE visiting neighbours (breaks cycles)\n    for (const nb of orig.neighbors) copy.neighbors.push(clone(nb));',
      replace: 'for (const nb of orig.neighbors) copy.neighbors.push(clone(nb));\n    copies.set(orig, copy);',
      explain: 'Going round a cycle, node 1 is met again before it is on the guest list, so a new twin is made again and again: the recursion never ends.',
    },
    {
      label: 'Link to the original neighbour',
      find: 'copy.neighbors.push(clone(nb))',
      replace: 'copy.neighbors.push(nb)',
      explain: 'The twin points back into the original graph instead of to other twins: a shallow copy that shares nodes with the input.',
    },
  ],
};
