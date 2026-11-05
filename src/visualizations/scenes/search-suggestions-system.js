// Search Suggestions System: an autocomplete dropdown. Products go into a trie in sorted order, and every node keeps
// the first three products that pass through it, i.e. the three smallest with that prefix. Typing the search word is a
// walk down the trie, one letter per keystroke; each node's three products are that keystroke's dropdown. The output
// list is found by shape (a list of string lists that grows by one row per letter).
const PROD = ['p', 'product', 'prod', 'w', 'word', 's', 'item', 'name'];
const NODE = ['node', 'cur', 'curr', 't', 'n', 'p'];

const isRows = (v) => Array.isArray(v) && v.every((r) => Array.isArray(r) && r.every((x) => typeof x === 'string'));
const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const list = (r) => (r.length ? r.map((x) => `"${x}"`).join(', ') : 'nothing');

/** [name, new row] when a list of suggestion rows grew by one */
function newRow(params, vars, prev) {
  for (const [k, v] of Object.entries(vars)) {
    if (params.includes(k) || !isRows(v) || !v.length || !isRows(prev[k]) || v.length !== prev[k].length + 1) continue;
    return [k, v[v.length - 1], v.length];
  }
  return null;
}

export default {
  id: 'search-suggestions-system',
  metaphor: 'An autocomplete dropdown, keystroke by keystroke',
  caption: 'Products are inserted in sorted order; every trie node keeps the first three that pass through it. Each typed letter steps one node down, and that node\'s three products are the dropdown.',
  narrate(ctx) {
    const [prName, swName] = ctx.params;
    const products = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : [];
    const sw = ctx.input?.[1];
    if (typeof sw !== 'string') return null;
    const got = newRow(ctx.params, ctx.vars, ctx.prev);
    if (got) {
      const [, r, n] = got;
      const typed = sw.slice(0, n);
      return r.length ? `typed "${typed}": the dropdown shows ${list(r)}` : `typed "${typed}": no product starts with it, empty dropdown`;
    }
    // a product is inserted
    const pName = pick(ctx.vars, PROD.filter((k) => k !== prName && k !== swName), (v) => typeof v === 'string' && products.includes(v));
    const nName = pick(ctx.vars, NODE.filter((k) => k !== pName), (v) => v && v.$trie);
    if (pName && ctx.vars[pName] !== ctx.prev[pName] && nName) {
      return `insert "${ctx.vars[pName]}" (sorted order): each node on its path keeps it if it has fewer than 3 yet`;
    }
    // the walk falls off the trie while typing
    const was = NODE.find((k) => ctx.prev[k] && ctx.prev[k].$trie);
    const lookup = /\.get\(|children|\[\s*[\w$.]+\s*\]/.test(ctx.src || '');
    if (was && lookup && !(ctx.vars[was] && ctx.vars[was].$trie) && !pName && ctx.vars[swName] === sw) {
      if (ctx.next && newRow(ctx.params, ctx.next.vars, ctx.vars)) return null; // a prediction about this row comes next
      return 'no branch for this letter: no product has this prefix, and every longer prefix is empty too';
    }
    return null;
  },
  // right before a dropdown row is written: which products does it show?
  predict(ctx) {
    const sw = ctx.input?.[1];
    const products = Array.isArray(ctx.input?.[0]) ? ctx.input[0] : null;
    if (!ctx.next || typeof sw !== 'string' || !products) return null;
    const got = newRow(ctx.params, ctx.next.vars, ctx.vars);
    if (!got) return null;
    const [, r, n] = got;
    if (n % 2 === 0) return null; // every other keystroke: consecutive dropdowns are often the same
    const typed = sw.slice(0, n);
    const matches = products.filter((x) => x.startsWith(typed));
    const show = (a) => `[${a.join(', ')}]`;
    const right = show(r);
    const wrong = [show(matches.slice(0, 3)), show([...matches].sort()), show([...matches].sort().slice(-3)), show(products.filter((x) => x.startsWith(sw.slice(0, n - 1))).sort().slice(0, 3))];
    const opts = [...new Set([right, ...wrong])].slice(0, 4);
    if (opts.length < 2) return null;
    opts.sort();
    return {
      question: `"${typed}" has been typed. What does the dropdown show?`,
      options: opts,
      answer: opts.indexOf(right),
      explain: r.length ? `The node for "${typed}" kept the first ${r.length} products inserted through it; products went in sorted, so these are the ${r.length === 1 ? 'only match' : `${r.length} smallest`}.` : `No product starts with "${typed}", so the dropdown is empty.`,
    };
  },
  bugs: [
    {
      label: 'Insert without sorting',
      find: 'for (const p of [...products].sort())',
      replace: 'for (const p of products)',
      explain: 'Each node keeps the first three products that reach it; without sorting those are the first three in input order, not the three smallest.',
    },
    {
      label: 'Keep four suggestions',
      find: 'node.top.length < 3',
      replace: 'node.top.length <= 3',
      explain: 'The check lets a fourth product in, so a busy prefix shows four suggestions instead of three.',
    },
  ],
};
