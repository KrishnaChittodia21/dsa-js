// Implement Trie (design class). A trie is a tree of signposts, one letter per branch; a word is a path from the
// root whose last node carries an "a word ends here" flag. The method being run is found from the source above the
// current line, the word / letter / node from common names (word, s, prefix · ch, c, char · node, cur, curr).
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return']);
const STR = ['word', 's', 'prefix', 'w', 'str', 'key'];
const CH = ['ch', 'c', 'char', 'letter', 'x'];
const NODE = ['node', 'cur', 'curr', 'current', 'n', 'p', 't'];

/** name of the method whose body holds line `at` (1-based), or '' */
function methodAt(lines, at) {
  for (let i = at - 1; i >= 0; i--) {
    const l = lines[i] || '';
    const m = l.match(/^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/) || l.match(/([A-Za-z_$][\w$]*)\s*=\s*(?:function\b|\([^)]*\)\s*=>)/);
    if (m && !KEYWORDS.has(m[1])) return m[1];
  }
  return '';
}
const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const strOf = (vars) => vars?.[pick(vars, STR, (v) => typeof v === 'string')];
const chOf = (vars) => vars?.[pick(vars, CH, (v) => typeof v === 'string' && v.length === 1)];
/** the "word ends here" flag of the current node: true / false, null when the node is missing, undefined when unknown */
function endOf(vars) {
  const k = pick(vars, NODE, (v) => v === null || v === undefined || (v && (v.$obj || v.$trie)));
  if (!k) return undefined;
  const v = vars[k];
  if (v && v.$trie) return v.$trie.nodes[0].end; // a trie node: { $trie: { nodes: [this node, …] } }
  if (!v || !v.$obj) return null;
  const f = Object.keys(v.$obj).find((x) => /end|word|leaf|term|last|complete/i.test(x) && typeof v.$obj[x] === 'boolean');
  return f ? v.$obj[f] : undefined;
}
const isSearch = (m) => /search|find|contains|has|lookup/i.test(m);

export default {
  id: 'implement-trie-prefix-tree',
  metaphor: 'Signposts branching letter by letter',
  caption: 'Each node is a signpost with one branch per next letter. Inserting a word walks its letters, growing missing branches, and flags the last node; a search walks the same path.',
  narrate(ctx) {
    const m = methodAt(ctx.lines, ctx.line);
    const word = strOf(ctx.vars);
    const ch = chOf(ctx.vars);
    const q = word === undefined ? '' : `"${word}"`;
    if (m === 'constructor') return /root|head/.test(ctx.src) ? 'an empty root signpost: the trie starts with no branches' : null;
    if (/insert|add|put/i.test(m)) {
      if (ch && /\bnew\b|\.set\(|\]\s*=/.test(ctx.src)) return `no '${ch}' branch here yet: grow one (inserting ${q})`;
      if (ch && /=/.test(ctx.src)) return `step down the '${ch}' branch`;
      if (endOf(ctx.vars) === true && /=\s*true/.test(ctx.src)) return `last letter of ${q} reached: flag this node "a word ends here"`;
      return null;
    }
    if (m && ch && /=/.test(ctx.src)) {
      const e = endOf(ctx.vars);
      if (e === null) return `no '${ch}' branch from here: no stored word starts with ${q}`;
      if (e !== undefined) return `follow the '${ch}' branch${e ? ' (a word ends at this node)' : ''}`;
    }
    if (isSearch(m) && /return/.test(ctx.src) && word !== undefined) {
      const e = endOf(ctx.vars);
      if (e === null) return `the path for ${q} breaks off: not a word`;
      if (e === true) return `the path for ${q} ends on a flagged node: it is a stored word`;
      if (e === false) return `the path for ${q} exists but its last node is not flagged: only a prefix, not a word`;
    }
    if (/starts|prefix/i.test(m) && /return/.test(ctx.src) && word !== undefined) return `prefix ${q}: only the path has to exist, no end flag needed`;
    return null;
  },
  // right before search answers: is the word stored, or only a prefix?
  predict(ctx) {
    if (!ctx.next) return null;
    const m = methodAt(ctx.lines, ctx.next.line);
    if (!isSearch(m) || !/return/.test(ctx.lines[ctx.next.line - 1] || '')) return null;
    const word = strOf(ctx.next.vars);
    const e = endOf(ctx.next.vars);
    if (word === undefined || e === undefined) return null;
    const answer = e === true ? 0 : e === false ? 1 : 2;
    const opts = ['Yes: a stored word', 'No: only a prefix of a stored word', 'No: the path does not exist'];
    return {
      question: `search("${word}") has walked its letters. Does it return true?`,
      options: opts,
      answer,
      explain: ['The walk ends on a node flagged "a word ends here", so the word was inserted.', `Every letter of "${word}" has a branch, but the last node is not flagged: "${word}" is only the start of a longer word.`, `Some letter of "${word}" has no branch, so no inserted word starts this way.`][answer],
    };
  },
  bugs: [
    {
      label: 'search forgets the end flag',
      find: 'return node !== null && node.isEnd;',
      replace: 'return node !== null;',
      explain: 'Any existing path counts as a word, so search("app") is true after inserting only "apple": prefixes are mistaken for words.',
    },
  ],
};
