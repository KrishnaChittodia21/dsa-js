// Replace Words: the roots are planted in a trie, each ending on a flagged node. Every word of the sentence walks the
// trie letter by letter; the first flagged node it reaches is its shortest root, and falling off the trie (or running
// out of letters) means no root fits, so the word stays. The word / node / root names are guessed from common names.
const WORD = ['word', 'w', 'token', 's', 'str', 'cur'];
const NODE = ['node', 'cur', 'curr', 't', 'p', 'n', 'trie'];
const ROOT_STR = ['r', 'root', 'word', 'w', 'd', 's', 'prefix', 'rt'];

const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const isTrie = (v) => !!(v && v.$trie && Array.isArray(v.$trie.nodes) && v.$trie.nodes.length);
const ends = (v) => (isTrie(v) ? v.$trie.nodes.filter((x) => x.end).length : 0);

/** the word being walked: a string var that is one of the sentence's words */
function wordOf(ctx, vars) {
  const sent = ctx.input?.[1];
  if (typeof sent !== 'string') return null;
  const ws = sent.split(' ');
  const k = pick(vars, WORD.filter((n) => !ctx.params.includes(n)), (v) => typeof v === 'string' && ws.includes(v));
  return k ? [k, vars[k]] : null;
}

export default {
  id: 'replace-words',
  metaphor: 'Walking word stems through a root tree',
  caption: 'Each root is a path in the trie whose last letter is flagged. A word walks down letter by letter: the first flagged node is its shortest root; falling off the path means the word stays as it is.',
  narrate(ctx) {
    const dict = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : [];
    // a root has been planted: one more flagged node in the trie
    const tName = Object.keys(ctx.vars).find((k) => isTrie(ctx.vars[k]) && isTrie(ctx.prev[k]) && ends(ctx.vars[k]) > ends(ctx.prev[k]));
    if (tName && /\btrue\b|\.(?:end|isEnd|word|isWord|root)\s*=/.test(ctx.src || '')) {
      const rName = pick(ctx.vars, ROOT_STR, (v) => typeof v === 'string' && dict.includes(v));
      return rName ? `root "${ctx.vars[rName]}" planted: its last letter '${ctx.vars[rName].slice(-1)}' is flagged "a root ends here"` : 'a root is planted: its last node is flagged';
    }
    const cur = wordOf(ctx, ctx.vars);
    if (ctx.ret && typeof ctx.value === 'string' && cur && cur[1].startsWith(ctx.value)) {
      const [, w] = cur;
      if (ctx.value === w) return `no root is a prefix of "${w}": it stays "${w}"`;
      return `"${w}" → "${ctx.value}": the first flagged node on the way is the shortest root`;
    }
    if (!cur) return null;
    const [wName, w] = cur;
    // a loop version: the replaced word is pushed onto an output list
    const outName = Object.keys(ctx.vars).find((k) => !ctx.params.includes(k) && Array.isArray(ctx.vars[k]) && Array.isArray(ctx.prev[k]) && ctx.vars[k].length === ctx.prev[k].length + 1);
    const pushed = outName && ctx.vars[outName][ctx.vars[outName].length - 1];
    if (typeof pushed === 'string' && w.startsWith(pushed)) {
      return pushed === w ? `no root is a prefix of "${w}": it stays "${w}"` : `"${w}" → "${pushed}": the first flagged node on the way is the shortest root`;
    }
    const nName = pick(ctx.vars, NODE, isTrie);
    if (w !== ctx.prev[wName] && nName) return `next word "${w}": walk its letters down the root tree`;
    const iName = pick(ctx.vars, ['i', 'j', 'k', 'idx', 'pos'], Number.isInteger);
    if (nName && iName && nName in ctx.prev && JSON.stringify(ctx.vars[nName]) !== JSON.stringify(ctx.prev[nName]) && w === ctx.prev[wName]) {
      const i = ctx.vars[iName];
      const path = w.slice(0, i + 1);
      if (ctx.next?.ret) return `"${path}" walked: look at this node's flag`; // the prediction comes next: no verdict
      return ctx.vars[nName].$trie.nodes[0].end ? `"${path}": this node is flagged, a root ends here` : `"${path}": on a root's path, but no root ends here yet`;
    }
    if (nName === undefined && NODE.some((k) => isTrie(ctx.prev[k])) && w === ctx.prev[wName] && !ctx.ret) return ctx.next?.ret ? `looking up the next letter of "${w}"…` : `no branch for the next letter of "${w}": no root starts this way`;
    return null;
  },
  // right before a word's walk returns: what does it become?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx || !nx.ret || typeof nx.value !== 'string') return null;
    const cur = wordOf(ctx, nx.vars);
    if (!cur || !cur[1].startsWith(nx.value)) return null;
    const w = cur[1];
    const dict = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : [];
    const longer = dict.filter((r) => w.startsWith(r) && r !== nx.value).sort((a, b) => b.length - a.length);
    const opts = [...new Set([nx.value, w, ...longer, w.slice(0, Math.max(1, nx.value.length - 1)), w.slice(0, nx.value.length + 1)])].filter(Boolean).slice(0, 4);
    if (opts.length < 2) return null;
    opts.sort();
    return {
      question: `The walk for "${w}" is about to finish. What does "${w}" become?`,
      options: opts,
      answer: opts.indexOf(nx.value),
      explain: nx.value === w ? `No flagged node lies on the path of "${w}" (the walk fell off or ran out of letters), so it stays.` : `"${nx.value}" is the first flagged node the walk reached; any longer root is never looked at.`,
    };
  },
  bugs: [
    {
      label: 'Falling off counts as a root',
      find: 'if (!node) return word;',
      replace: 'if (!node) return word.slice(0, i);',
      explain: 'When a letter has no branch the word has no root, but the letters walked so far are returned instead: "the" becomes "" and "by" becomes "b".',
    },
    {
      label: 'Root cut one letter short',
      find: 'return word.slice(0, i + 1);',
      replace: 'return word.slice(0, i);',
      explain: 'The flagged node is reached after letter i, so the root is letters 0…i; slicing to i drops its last letter ("cat" becomes "ca").',
    },
  ],
};
