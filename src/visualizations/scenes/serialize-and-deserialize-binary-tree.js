// Scene: Serialize and Deserialize Binary Tree. Packing a tree into a parcel string and unpacking it at the other
// end: every node is written as its value and every empty spot as a '#' marker, so the receiver can put each token
// back in the same place. The harness gives no parameter names (ctx.params is []): the phases are told apart by node
// ids (the original tree's nodes are 1…n, nodes rebuilt by deserialize get bigger ids).
import { cellAt, row } from './util.js';

const isTree = (v) => v && Array.isArray(v.$tree) && Array.isArray(v.$ids) && v.$tree.length > 0;
const MARK = (x) => x === null || (typeof x === 'string' && /^(#|null|n|x|none|nil|\$|~|-|\*)$/i.test(x.trim()));
const origCount = (ctx) => (Array.isArray(ctx.input?.[0]) ? ctx.input[0].filter((x) => x !== null).length : null);
const show = (x) => (x === null ? 'null' : `'${x}'`);
const short = (s) => (s.length > 60 ? `${s.slice(0, 57)}…` : s);
const local = (vars) => Object.entries(vars || {}).filter(([k]) => !k.endsWith('(whole)') && k !== 'this');
/** tree variables holding rebuilt nodes (ids above the original's) */
const rebuilt = (vars, n) => local(vars).filter(([, v]) => isTree(v) && v.$ids[0] > n);
/** the token list being written (serialize) or read (deserialize): a row of strings / numbers / nulls */
const tokenRows = (vars) => local(vars).filter(([, v]) => row(v) && v.every((x) => x === null || typeof x === 'string' || typeof x === 'number'));
/** { id, value, parent, side } of a node attached to the rebuilt tree between a and b */
function attached(a, b, n) {
  for (const [k, t] of rebuilt(b, n)) {
    const was = a?.[k];
    if (!isTree(was) || was.$ids[0] !== t.$ids[0]) continue;
    const old = new Set(was.$ids);
    const i = t.$ids.findIndex((id) => id !== null && !old.has(id));
    if (i < 0) continue;
    const id = t.$ids[i];
    let parent = null;
    let side = null;
    for (const [, p] of local(b)) {
      if (!isTree(p)) continue;
      if (p.$ids[1] === id) [parent, side] = [p.$tree[0], 'left'];
      else if (p.$ids[2] === id) [parent, side] = [p.$tree[0], 'right'];
      if (side) break;
    }
    return { id, value: t.$tree[i], parent, side };
  }
  return null;
}
/** the node variable that just changed to a new node (or to null), as [name, value] */
function freshNode(ctx, vars, prev, src) {
  return (
    local(vars).find(
      ([k, v]) => (v === null || isTree(v)) && new RegExp(`\\b${k}\\s*=[^=]`).test(src || '') && (v === null ? prev[k] !== null : !isTree(prev[k]) || prev[k].$ids[0] !== v.$ids[0]),
    ) || null
  );
}

export default {
  id: 'serialize-and-deserialize-binary-tree',
  metaphor: 'Pack a tree into a parcel string',
  caption: "Packing writes each node's value and a '#' for every empty spot, in a fixed order. Unpacking reads the tokens in that same order and hangs each one back where it came from.",
  maxPredicts: 3,
  narrate(ctx) {
    const n = origCount(ctx);
    if (n === null) return null;
    const unpacking = rebuilt(ctx.vars, n).length > 0 || local(ctx.vars).some(([, v]) => typeof v === 'string' && v.length > 0);
    if (ctx.ret && typeof ctx.value === 'string') return ctx.value ? `packed: "${short(ctx.value)}"` : 'the tree is empty: the parcel is an empty string';
    if (ctx.ret && isTree(ctx.value) && ctx.value.$ids[0] > n) {
      const c = ctx.value.$tree.filter((x) => x !== null).length;
      return ctx.value.$ids[0] === n + 1 ? `unpacked: ${c} node${c === 1 ? '' : 's'} back in their places` : `the piece under ${ctx.value.$tree[0]} is rebuilt (${c} node${c === 1 ? '' : 's'})`;
    }
    if (ctx.ret && ctx.value === null && local(ctx.vars).some(([, v]) => v === '')) return 'an empty parcel unpacks to an empty tree';
    const parcel = local(ctx.vars).find(([k, v]) => typeof v === 'string' && v.length && !(k in ctx.prev));
    if (parcel && !rebuilt(ctx.vars, n).length && !tokenRows(ctx.vars).some(([, v]) => v.length > 1)) return `a fresh Codec receives the parcel "${short(parcel[1])}": only the string travels`;
    // unpacking: a node hung back on the tree
    const add = attached(ctx.prev, ctx.vars, n);
    if (add) return add.side ? `token '${add.value}' becomes ${add.parent}'s ${add.side} child` : `token '${add.value}' is hung back on the tree`;
    const fresh = rebuilt(ctx.vars, n).find(([k, v]) => !isTree(ctx.prev[k]) && v.$tree.length === 1 && new RegExp(`\\b${k}\\s*=[^=]`).test(ctx.src || '') && /\bnew\s+\w+/.test(ctx.src || ''));
    if (fresh) return fresh[1].$ids[0] === n + 1 ? `the first token '${fresh[1].$tree[0]}' becomes the root` : `token '${fresh[1].$tree[0]}' becomes a new node`;
    for (const [k, v] of tokenRows(ctx.vars)) {
      const was = ctx.prev[k];
      // the parcel is cut into tokens
      if (unpacking && v.length > 1 && (!row(was) || !was.length)) return `cut the parcel into ${v.length} tokens`;
      if (!row(was) || unpacking) continue;
      if (v.length === was.length + 1) {
        const t = v[v.length - 1];
        return MARK(t) ? `an empty spot: write the marker ${show(t)} so the shape survives` : `write node ${t}: token ${show(t)} (${v.length} written)`;
      }
      if (v.length === was.length - 1 && MARK(was[was.length - 1])) return `drop a trailing ${show(was[was.length - 1])}: nothing after it needs a place`;
    }
    // a packing string grew directly
    for (const [k, v] of local(ctx.vars)) {
      const was = ctx.prev[k];
      if (!unpacking && typeof v === 'string' && typeof was === 'string' && v.length > was.length) return `the parcel grows: "${short(v)}"`;
    }
    // a node taken from the line (no verdict here: a prediction may follow)
    const nd = freshNode(ctx, ctx.vars, ctx.prev, ctx.src);
    if (nd && isTree(nd[1]) && nd[1].$ids[0] > n) return `node ${nd[1].$tree[0]} is next in line to get its children from the tokens`;
    if (nd && !unpacking) return nd[1] === null ? 'the walker takes the next spot from the line: it is empty' : `the walker takes the next spot from the line: node ${nd[1].$tree[0]}`;
    // unpacking: a '#' token was read and skipped
    const toks = tokenRows(ctx.vars).find(([, v]) => v.length > 1);
    const ix = (/(\w+)\s*(?:\+\+|\+=\s*1\b)/.exec(ctx.src || '') || [])[1];
    if (unpacking && toks && ix && Number.isInteger(ctx.vars[ix]) && ctx.vars[ix] === ctx.prev[ix] + 1 && MARK(cellAt(toks[1], ctx.prev[ix]))) return `token ${show(cellAt(toks[1], ctx.prev[ix]))}: an empty spot, no child hangs here`;
    return null;
  },
  predict(ctx) {
    const n = origCount(ctx);
    const nx = ctx.next;
    if (n === null || !nx || ctx.ret) return null;
    const node = freshNode(ctx, ctx.vars, ctx.prev, ctx.src);
    if (!node) return null;
    // packing: the walker reaches an empty spot
    if (node[1] === null && !rebuilt(ctx.vars, n).length) {
      const grown = tokenRows(nx.vars).find(([k, v]) => row(ctx.vars[k]) && v.length === ctx.vars[k].length + 1);
      if (!grown || !MARK(grown[1][grown[1].length - 1]) || ctx.vars[grown[0]].some(MARK)) return null; // ask at the first marker only
      const t = grown[1][grown[1].length - 1];
      return {
        question: 'The walker reaches an empty spot (no node). What is written into the parcel?',
        options: [`The marker ${show(t)}`, 'Nothing: empty spots are skipped', "The parent's value again"],
        answer: 0,
        explain: `Without a marker, the receiver could not tell where a child is missing: [1, 2] and [1, null, 2] would pack the same. So ${show(t)} is written.`,
      };
    }
    // unpacking: a rebuilt node takes the next token as a child
    if (isTree(node[1]) && node[1].$ids[0] > n) {
      const add = attached(ctx.vars, nx.vars, n);
      let answer = null;
      if (add && add.parent === node[1].$tree[0]) answer = 0;
      else if (!add) {
        const toks = tokenRows(ctx.vars).find(([, v]) => v.length > 1);
        const ix = (/(\w+)\s*(?:\+\+|\+=\s*1\b)/.exec(ctx.lines[nx.line - 1] || '') || [])[1];
        if (toks && ix && Number.isInteger(ctx.vars[ix]) && nx.vars[ix] === ctx.vars[ix] + 1 && MARK(cellAt(toks[1], ctx.vars[ix]))) answer = 1;
      }
      if (answer === null) return null;
      return {
        question: `Node ${node[1].$tree[0]} reads the next token for its next child spot. What happens?`,
        options: ['A new child node is hung under it', "The token is a marker: that spot stays empty"],
        answer,
        explain: answer === 0 ? `The token is a value, so a new node with that value becomes ${node[1].$tree[0]}'s child.` : `The token is a marker: when packing, this spot was empty, so nothing is hung here.`,
      };
    }
    return null;
  },
  bugs: [
    {
      label: 'Skip empty spots',
      find: "if (node === null) { out.push('#'); continue; }",
      replace: 'if (node === null) continue;',
      explain: 'Without markers the receiver hands the tokens to the wrong parents: in [1,2,3,null,null,4,5] the 4 and 5 end up under 2.',
    },
    {
      label: 'No separator',
      find: "return out.join(',');",
      replace: "return out.join('');",
      explain: 'The tokens run together ("123##45"), so the parcel cannot be cut back into values: 1,23 and 12,3 look the same.',
    },
  ],
};
