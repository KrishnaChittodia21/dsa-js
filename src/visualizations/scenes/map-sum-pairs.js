// Map Sum Pairs (design class). Each trie node keeps a running total of the values of all keys below it, so
// sum(prefix) is one walk and one read. insert adds only the change (delta) along the key's path, which makes a
// re-insert replace the old value instead of adding to it. Also works for a Map-only solution (sum by scanning).
import { entriesOf, options } from './util.js';

const NODE = ['node', 'cur', 'curr', 'current', 'n', 't', 'p'];
const CH = ['ch', 'c', 'char', 'letter'];
const DELTA = ['delta', 'diff', 'd', 'change', 'add', 'inc'];

const pick = (vars, names, ok) => names.find((k) => k in (vars || {}) && ok(vars[k]));
const trieOf = (v) => (v && v.$trie && v.$trie.nodes?.length ? v.$trie : null);
const rootOf = (vars) => trieOf(vars?.this?.$obj?.root) || trieOf(vars?.this?.$obj?.trie) || trieOf(vars?.root);
const nodeKey = (vars) => pick(vars, NODE, (v) => v === null || v === undefined || !!trieOf(v));
const chOf = (vars) => vars?.[pick(vars, CH, (v) => typeof v === 'string' && v.length === 1)];
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
const opOf = (ctx, at = ctx.op) => ctx.ops?.[at];
/** key → value as stored after the inserts before operation `at` */
function storedBefore(ctx, at) {
  const m = new Map();
  for (let i = 0; i < at && i < (ctx.ops || []).length; i++) {
    const o = ctx.ops[i];
    if (/insert|put|add/i.test(o.name) && typeof o.args?.[0] === 'string') m.set(o.args[0], o.args[1]);
  }
  return m;
}
const q = (s) => `"${s}"`;
const signed = (d) => (d >= 0 ? `+${d}` : `${d}`);

export default {
  id: 'map-sum-pairs',
  metaphor: 'Running totals posted at every fork',
  caption: 'Every trie node posts the total value of all keys that pass through it. insert adds only the change along the key’s path; sum walks the prefix and reads the posted total.',
  narrate(ctx) {
    const op = opOf(ctx);
    if (!op) return null;
    if (/constructor|MapSum/.test(op.name)) return /root|trie/.test(ctx.src) && rootOf(ctx.vars) ? 'an empty root: no keys yet, so every total is 0' : null;
    const [key, val] = op.args || [];
    const root = rootOf(ctx.vars);
    if (/insert|put|add/i.test(op.name)) {
      const dk = pick(ctx.vars, DELTA, (v) => typeof v === 'number');
      if (dk && (!(dk in ctx.prev) || new RegExp(`\\b${dk}\\s*=(?!=)`).test(ctx.src))) {
        const before = storedBefore(ctx, ctx.op);
        return before.has(key)
          ? `${q(key)} was ${before.get(key)}, now ${val}: every total on its path changes by ${signed(ctx.vars[dk])}`
          : `${q(key)} is new: every total on its path gains ${ctx.vars[dk]}`;
      }
      const m = Object.values(ctx.vars.this?.$obj || {}).map(entriesOf).find(Boolean);
      const pm = Object.values(ctx.prev.this?.$obj || {}).map(entriesOf).find(Boolean);
      if (m && pm && m.some(([k, v]) => k === key && v === val) && !pm.some(([k, v]) => k === key && v === val)) return `remember ${q(key)} → ${val}, so a later re-insert knows the old value`;
      const proot = rootOf(ctx.prev);
      const ch = chOf(ctx.vars);
      if (root && proot && root.nodes.length > proot.nodes.length && ch) return `no '${ch}' branch yet: grow one with a total of 0`;
      const nk = nodeKey(ctx.vars);
      if (nk && /\+=|\+\+/.test(ctx.src) && trieOf(ctx.vars[nk])) {
        const path = pathTo(root, trieOf(ctx.vars[nk]).nodes[0].id);
        const d = dk ? ctx.vars[dk] : undefined;
        if (path != null) return `${q(key)} passes ${path ? `the node for ${q(path)}` : 'the root'}: its total ${d === undefined ? 'is updated' : `changes by ${signed(d)}`}`;
      }
      return null;
    }
    if (/sum/i.test(op.name)) {
      const prefix = key;
      if (ctx.ret && typeof ctx.value === 'number') {
        const parts = [...storedBefore(ctx, ctx.op)].filter(([k]) => k.startsWith(prefix));
        const total = parts.reduce((s, [, v]) => s + v, 0);
        const sum = total === ctx.value && parts.length > 1 ? ` = ${parts.map(([k, v]) => `${k} (${v})`).join(' + ')}` : '';
        const nk = nodeKey(ctx.vars);
        if (nk && (!trieOf(ctx.vars[nk]) || (root && pathTo(root, trieOf(ctx.vars[nk]).nodes[0].id) !== prefix))) return `no path for ${q(prefix)}: no key starts with it, the total is ${ctx.value}`;
        return `${nk ? `the node for ${q(prefix)} posts the total` : `keys starting with ${q(prefix)} add up to`} ${ctx.value}${sum}`;
      }
      const nk = nodeKey(ctx.vars);
      const ch = chOf(ctx.vars);
      if (nk && ch && !ctx.vars[nk] && ctx.vars[nk] !== ctx.prev[nk]) return `no '${ch}' branch from here: the walk falls off the trie`;
      if (nk && ch && trieOf(ctx.vars[nk]) && trieOf(ctx.prev[nk]) && trieOf(ctx.vars[nk]).nodes[0].id !== trieOf(ctx.prev[nk]).nodes[0].id) {
        const path = pathTo(root, trieOf(ctx.vars[nk]).nodes[0].id);
        return `follow the '${ch}' branch${path ? ` to the node for ${q(path)}` : ''}`;
      }
    }
    return null;
  },
  // right before sum answers: what total does it return?
  predict(ctx) {
    const op = opOf(ctx);
    if (!op || !/sum/i.test(op.name) || ctx.ret || !ctx.next?.ret || ctx.next.op !== ctx.op || typeof ctx.next.value !== 'number') return null;
    const prefix = op.args?.[0];
    if (typeof prefix !== 'string') return null;
    const right = ctx.next.value;
    const stored = [...storedBefore(ctx, ctx.op)];
    const parts = stored.filter(([k]) => k.startsWith(prefix));
    // the classic slip: adding every inserted value, re-inserts included
    const doubled = ctx.ops.slice(0, ctx.op).filter((o) => /insert|put|add/i.test(o.name) && String(o.args?.[0]).startsWith(prefix)).reduce((s, o) => s + o.args[1], 0);
    const exact = stored.find(([k]) => k === prefix)?.[1] ?? 0;
    const all = stored.reduce((s, [, v]) => s + v, 0);
    return options(
      `sum(${q(prefix)}): which total does it return?`,
      right,
      [doubled, exact, all, right + 1].filter((x) => x !== right),
      parts.length
        ? `Keys starting with ${q(prefix)}: ${parts.map(([k, v]) => `${k} = ${v}`).join(', ')}. Only each key's latest value counts.`
        : `No stored key starts with ${q(prefix)}, so the total is 0.`,
    );
  },
  bugs: [
    {
      label: 'Add val instead of the change',
      find: 'const delta = val - (this.values.get(key) ?? 0);',
      replace: 'const delta = val;',
      explain: 'Re-inserting "apple" with 2 adds 2 on top of the old 3, so sum("ap") says 5 instead of 2: the old value is counted twice.',
    },
    {
      label: 'Missing prefix crashes',
      find: 'if (!node) return 0;',
      replace: '',
      explain: 'When the prefix has no path, node is undefined and reading node.sum throws instead of returning 0.',
    },
  ],
};
