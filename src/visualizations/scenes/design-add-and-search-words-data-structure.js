// Design Add and Search Words (design class). addWord grows a trie of signposts; search walks the pattern letter
// by letter, and a '.' is a wildcard that tries every branch (backtracking). The match is real only when the walk
// ends on a node flagged "a word ends here". Names: word / s / pattern · ch / c · node / cur · i / idx / pos.
const STR = ['word', 's', 'w', 'pattern', 'key', 'str'];
const CH = ['ch', 'c', 'char', 'letter'];
const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'p'];
const IDX = ['i', 'idx', 'index', 'pos', 'j', 'k', 'depth'];

const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const trieOf = (v) => (v && v.$trie && v.$trie.nodes?.length ? v.$trie : null);
const kids = (t) => t.edges.filter(([a]) => a === 0).map(([, b]) => t.nodes[b].ch);
const rootOf = (vars) => trieOf(vars?.this?.$obj?.root) || trieOf(vars?.this?.$obj?.trie) || trieOf(vars?.root);
const strOf = (vars) => vars?.[pick(vars, STR, (v) => typeof v === 'string')];
const chOf = (vars) => vars?.[pick(vars, CH, (v) => typeof v === 'string' && v.length === 1)];
const idxOf = (vars) => vars?.[pick(vars, IDX, (v) => Number.isInteger(v))];
const nodeOf = (vars) => trieOf(vars?.[pick(vars, NODE, (v) => !!trieOf(v))]);
const opName = (ctx) => ctx.ops?.[ctx.op]?.name || '';
const q = (s) => `"${s}"`;
/** a trie variable (not the current node) that just changed: the child the walk is about to enter */
function freshChild(ctx) {
  const nk = pick(ctx.vars, NODE, (v) => !!trieOf(v));
  return Object.keys(ctx.vars).find((k) => k !== nk && k !== 'this' && k !== 'root' && trieOf(ctx.vars[k]) && trieOf(ctx.vars[k]).nodes[0].id !== trieOf(ctx.prev[k])?.nodes[0].id);
}

export default {
  id: 'design-add-and-search-words-data-structure',
  metaphor: 'Signposts with a wildcard that tries every road',
  caption: 'Each node is a signpost with one branch per next letter. A letter in the pattern follows its own branch; a dot tries every branch in turn, and a match needs the walk to end on a flagged node.',
  narrate(ctx) {
    const op = opName(ctx);
    const word = strOf(ctx.vars);
    const ch = chOf(ctx.vars);
    if (/constructor|WordDictionary/.test(op)) return /root|trie/.test(ctx.src) && rootOf(ctx.vars) ? 'an empty root signpost: no words yet' : null;
    if (/add|insert/i.test(op)) {
      const root = rootOf(ctx.vars);
      const proot = rootOf(ctx.prev);
      if (root && proot && root.nodes.length > proot.nodes.length && ch) return `no '${ch}' branch yet: grow one (adding ${q(word ?? '')})`;
      const n = nodeOf(ctx.vars);
      const pn = nodeOf(ctx.prev);
      if (n && pn && n.nodes[0].id === pn.nodes[0].id && n.nodes[0].end && !pn.nodes[0].end) return `last letter of ${q(word ?? '')}: flag this node "a word ends here"`;
      return null;
    }
    if (!/search|find|match/i.test(op) || word === undefined) return null;
    const i = idxOf(ctx.vars);
    if (ctx.ret && typeof ctx.value === 'boolean') {
      const n = nodeOf(ctx.vars);
      if (i === undefined || !n) return `search(${q(word)}) answers ${ctx.value}`;
      if (i === word.length) return ctx.value ? `all ${word.length} letter${word.length === 1 ? '' : 's'} matched and a word ends here: a match` : `all ${word.length} letter${word.length === 1 ? '' : 's'} matched, but no word ends on this node: only a prefix`;
      if (ctx.value) return `a branch below matched: pass true back up`;
      if (ch && ch !== '.' && kids(n).includes(ch)) return `nothing below the '${ch}' branch led to a word: report false`;
      if (ch === '.') return `no branch under the '.' at position ${i} led to a word: report false`;
      return ch ? `no '${ch}' branch at position ${i}: a dead end, report false` : null;
    }
    const n = nodeOf(ctx.vars);
    const chKey = pick(ctx.vars, CH, (v) => typeof v === 'string' && v.length === 1);
    if (ch && i !== undefined && n && new RegExp(`\\b${chKey}\\s*=(?!=)`).test(ctx.src) && word[i] === ch) {
      const b = kids(n);
      if (ch === '.') return `'.' at position ${i} is a wildcard: try every branch here (${b.length ? b.join(', ') : 'none'})`;
      return `'${ch}' at position ${i}: only the '${ch}' branch can match (here: ${b.length ? b.join(', ') : 'no branches'})`;
    }
    const pi = idxOf(ctx.prev);
    if (ch === '.' && i !== undefined && pi !== undefined && pi > i) return `back at the '.' at position ${i}: that branch found no word`;
    if (ch && ch !== '.' && /\.get\(|\[\s*\w+\s*\]/.test(ctx.src)) {
      if (freshChild(ctx)) return `the '${ch}' branch exists: step down it`;
    }
    return null;
  },
  // right before the walk checks the node after the last letter: stored word, or only a prefix?
  predict(ctx) {
    const nx = ctx.next;
    if (!nx?.ret || typeof nx.value !== 'boolean' || nx.op !== ctx.op || !/search|find|match/i.test(opName(ctx))) return null;
    const word = strOf(nx.vars);
    const i = idxOf(nx.vars);
    const n = nodeOf(nx.vars);
    if (word === undefined || i !== word.length || !n || ctx.ret) return null;
    const dots = word.includes('.');
    return {
      question: `Every character of ${q(word)} is matched${dots ? ' (dots by some branch)' : ''}. Does this path count as a match?`,
      options: ['Yes: a stored word ends on this node', 'No: this node only starts a longer word'],
      answer: nx.value ? 0 : 1,
      explain: nx.value
        ? 'The node is flagged "a word ends here", so a word of exactly this length was added along this path.'
        : 'The node is not flagged: the path exists only because a longer word passes through it.',
    };
  },
  bugs: [
    {
      label: 'Pattern used up = match',
      find: 'if (i === word.length) return node.isEnd;',
      replace: 'if (i === word.length) return true;',
      explain: 'Once every pattern letter is matched it says yes without checking the flag, so after adding "abc", search("ab") is true: a prefix counts as a word.',
    },
    {
      label: 'Dot tries only the first branch',
      find: 'if (dfs(child, i + 1)) return true;   // any matching branch is enough',
      replace: 'return dfs(child, i + 1);',
      explain: 'At a dot the walk commits to the first branch: with "bat" and "mad" stored, ".ad" tries b → "bad" fails and never tries m.',
    },
  ],
};
