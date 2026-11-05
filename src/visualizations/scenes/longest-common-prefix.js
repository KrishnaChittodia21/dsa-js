// Longest Common Prefix. All strings are laid into one trie; the common prefix is the single-file trail from the
// root, which ends at the first fork (the words disagree) or the first flagged node (a word runs out). Also narrates
// the return of a vertical scan and a shrinking-prefix loop (prefix / res / ans …).
const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'p'];
const PREFIX = ['prefix', 'res', 'ans', 'result', 'lcp', 'common', 'out', 'pre'];
const CH = ['ch', 'c', 'char', 'letter', 'k', 'key'];

const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const trieOf = (v) => (v && v.$trie && v.$trie.nodes?.length ? v.$trie : null);
const kids = (t, at = 0) => t.edges.filter(([a]) => a === at).map(([, b]) => t.nodes[b].ch);
/** the biggest trie on screen (the whole trie the code built) */
function rootOf(vars) {
  let best = null;
  for (const v of Object.values(vars || {})) {
    const t = trieOf(v) || trieOf(v?.$obj?.root);
    if (t && (!best || t.nodes.length > best.nodes.length)) best = t;
  }
  return best;
}
/** letters on the path from the root to the node with this id, or null */
function pathTo(root, id) {
  if (!root || id == null) return null;
  let k = root.nodes.findIndex((n) => n.id === id);
  if (k < 0) return null;
  let s = '';
  while (k > 0) {
    const e = root.edges.find(([, b]) => b === k);
    if (!e) return null;
    s = root.nodes[k].ch + s;
    k = e[0];
  }
  return s;
}
const nodeOf = (vars) => {
  const k = pick(vars, NODE, (v) => !!trieOf(v));
  return k ? trieOf(vars[k]) : null;
};
const strOf = (ctx, vars) => pick(vars, PREFIX.filter((k) => !ctx.params.includes(k)), (v) => typeof v === 'string');
const chOf = (vars) => vars?.[pick(vars, CH, (v) => typeof v === 'string' && v.length === 1)];
/** the word being inserted: a variable holding one of the input strings */
function wordOf(ctx, vars) {
  const strs = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : [];
  const k = Object.keys(vars || {}).find((x) => !ctx.params.includes(x) && !PREFIX.includes(x) && !CH.includes(x) && typeof vars[x] === 'string' && vars[x].length > 0 && strs.includes(vars[x]));
  return k ? vars[k] : undefined;
}
const q = (s) => `"${s}"`;

export default {
  id: 'longest-common-prefix',
  metaphor: 'One shared trail until it forks',
  caption: 'Every string is laid into one trie. The common prefix is the single-file trail from the root: it ends where the trail forks or where a flagged node says a word has run out.',
  narrate(ctx) {
    const strs = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : null;
    if (ctx.ret && typeof ctx.value === 'string' && strs) {
      const v = ctx.value;
      const short = strs.find((s) => s.length === v.length);
      const next = [...new Set(strs.map((s) => s[v.length]).filter(Boolean))];
      const why = short !== undefined ? `${q(short)} runs out there` : next.length > 1 ? `the next letters differ: ${next.join(', ')}` : '';
      return `the shared trail stops${why ? ` (${why})` : ''}: the longest common prefix is ${q(v)}`;
    }
    const root = rootOf(ctx.vars);
    const prevRoot = rootOf(ctx.prev);
    const ch = chOf(ctx.vars);
    const word = wordOf(ctx, ctx.vars);
    const node = nodeOf(ctx.vars);
    const prevNode = nodeOf(ctx.prev);
    if (root && prevRoot && root.nodes.length > prevRoot.nodes.length && ch) return `no '${ch}' branch yet: grow one${word ? ` (laying in ${q(word)})` : ''}`;
    if (node && prevNode && node.nodes[0].id === prevNode.nodes[0].id && node.nodes[0].end && !prevNode.nodes[0].end) return `${word ? q(word) : 'the word'} ends here: flag the node (a common prefix can never pass a word's end)`;
    if (word && ch && ch !== chOf(ctx.prev) && /\.set\(|\]\s*=|\bnew\b|\?\?=/.test(ctx.src)) return `the '${ch}' branch is already there: ${q(word)} shares it with an earlier string`;
    const pk = strOf(ctx, ctx.vars);
    if (!pk || !(pk in ctx.prev)) return null;
    const p = ctx.vars[pk];
    const pp = ctx.prev[pk];
    if (typeof pp === 'string' && p.length === pp.length + 1 && p.startsWith(pp)) return `every string goes through '${p.at(-1)}': the common prefix grows to ${q(p)}`;
    if (typeof pp === 'string' && p.length < pp.length && pp.startsWith(p)) return `not every string starts with ${q(pp)}: shorten it to ${q(p)}`;
    if (!word && node && prevNode && node.nodes[0].id !== prevNode.nodes[0].id) return `step down the trail to the node for ${q(pathTo(root, node.nodes[0].id) ?? p)}`;
    return null;
  },
  // right after the walk reaches a node: does the trail go on, or does it stop here?
  predict(ctx) {
    if (!ctx.next) return null;
    const pk = strOf(ctx, ctx.vars);
    const node = nodeOf(ctx.vars);
    if (!pk || !node || wordOf(ctx, ctx.vars) !== undefined) return null;
    const prevNode = nodeOf(ctx.prev);
    if (prevNode && prevNode.nodes[0].id === node.nodes[0].id) return null;
    const nx = ctx.next.vars;
    const branches = kids(node);
    const p = ctx.vars[pk];
    const grew = typeof nx[pk] === 'string' && nx[pk].length === p.length + 1;
    const nch = chOf(nx);
    const goes = grew || (nch !== undefined && nch !== chOf(ctx.vars) && branches.includes(nch));
    if (!ctx.next.ret && !goes) return null;
    if (ctx.next.ret && (typeof ctx.next.value !== 'string' || ctx.next.value !== p)) return null;
    const end = node.nodes[0].end;
    return {
      question: `The walk stands at ${p ? `the node for ${q(p)}` : 'the root'}: ${branches.length} branch${branches.length === 1 ? '' : 'es'}${branches.length ? ` (${branches.join(', ')})` : ''}${end ? ', and a word ends here' : ''}. Does the common prefix grow?`,
      options: ['Yes: every string continues with the same letter', 'No: the trail stops here'],
      answer: ctx.next.ret ? 1 : 0,
      explain: ctx.next.ret
        ? end
          ? 'A word ends at this node, so that string has no next letter: the prefix cannot go further.'
          : branches.length === 0
            ? 'No branch leaves this node: the strings end here.'
            : `${branches.length} branches mean the strings disagree on the next letter.`
        : `Exactly one branch ('${branches[0]}') and no word ends here, so every string has that same next letter.`,
    };
  },
  bugs: [
    {
      label: 'Ignore word ends on the trail',
      find: ' && !node.isEnd)',
      replace: ')',
      explain: 'For ["ab", "a"] the trail a → b has one branch at each step, but "a" ends at the first node: the walk runs on and returns "ab", longer than "a" itself.',
    },
    {
      label: 'Walk on through forks',
      find: 'node.children.size === 1',
      replace: 'node.children.size >= 1',
      explain: 'At a fork the walk takes the first branch anyway, so ["flower", "flow", "flight"] gets "flow" instead of "fl": a fork means the strings disagree.',
    },
  ],
};
