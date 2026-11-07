// Scene: LRU Cache. A pile of papers on a desk: whatever you read or write goes on top, and when the pile is taller
// than the capacity the paper at the bottom (least recently used) goes in the bin. Reads the key map of `this`
// (Map of key → node / value) and, for the pile order, either a linked list of nodes (head…tail) or the Map's own
// insertion order. The queried key and the call come from ctx.ops; get answers come from ctx.result.
import { options } from './util.js';

const isList = (v) => !!(v && v.$list && Array.isArray(v.$list.ids));
const opOf = (ctx, i = ctx.op) => ctx.ops?.[i];

/** the key → entry map among the fields of `this` (the biggest Map) */
function mapOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  let best = null;
  for (const v of Object.values(o)) if (v && v.$map && (!best || v.$size > best.$size)) best = v;
  return best;
}
const valueOf = (e) => (typeof e === 'number' ? e : isList(e) ? e.$list.values[0] : e?.$obj ? (e.$obj.val ?? e.$obj.value) : undefined);
const keysOf = (m) => (m ? m.$map.map(([k]) => k) : []);

/** keys in the order of the linked list of nodes (only nodes the map knows), or null without one */
function lineKeys(vars) {
  const m = mapOf(vars);
  if (!m || !m.$map.length || !m.$map.every(([, e]) => isList(e))) return null;
  const byId = new Map(m.$map.map(([k, e]) => [e.$list.ids[0], k]));
  let line = null;
  for (const v of Object.values(vars.this.$obj)) if (isList(v) && (!line || v.$list.ids.length > line.$list.ids.length)) line = v;
  return line ? line.$list.ids.filter((id) => byId.has(id)).map((id) => byId.get(id)) : null;
}

/** keys from most to least recent, or null; `touched` is the key this call used (it must be on top) */
function pileOf(vars, touched) {
  const m = mapOf(vars);
  if (!m) return null;
  let keys;
  if (m.$map.length && m.$map.every(([, e]) => isList(e))) {
    keys = lineKeys(vars);
    if (!keys || keys.length !== m.$map.length) return null; // list not linked up yet
  } else {
    keys = keysOf(m).reverse(); // a plain Map: insertion order is oldest first
  }
  if (touched !== undefined && keys.length > 1 && keys[keys.length - 1] === touched && keys[0] !== touched) keys.reverse();
  return touched === undefined || keys[0] === touched ? keys : null;
}

export default {
  id: 'lru-cache',
  metaphor: 'A pile of papers: used goes on top',
  caption: 'Every get or put lays that key on top of the pile. When the pile grows past the capacity, the paper at the bottom (the one untouched for longest) goes in the bin.',
  narrate(ctx) {
    const op = opOf(ctx);
    if (!op || ctx.op === 0) return null;
    const m = mapOf(ctx.vars);
    const pm = mapOf(ctx.prev);
    if (!m) return null;
    const cap = ctx.ops[0]?.args?.[0];
    const [key, value] = op.args;
    const now = keysOf(m);
    const before = keysOf(pm);
    const gone = before.filter((k) => !now.includes(k));
    const added = now.filter((k) => !before.includes(k));
    if (pm && gone.length === 1 && !added.length) {
      if (gone[0] === key) return `key ${key} is taken off the pile, to be laid back on top`;
      return `the pile is taller than ${cap}: key ${gone[0]} at the bottom (least recently used) goes in the bin`;
    }
    if (pm && added.length === 1 && !gone.length) {
      return op.name === 'get' ? `key ${added[0]} goes back on top of the pile` : `put(${key}, ${value}): key ${key} joins the pile (${now.length} paper${now.length > 1 ? 's' : ''}, room for ${cap})`;
    }
    if (pm && op.name === 'put') {
      const e = m.$map.find(([k]) => k === key)?.[1];
      const pe = pm.$map.find(([k]) => k === key)?.[1];
      if (e !== undefined && pe !== undefined && valueOf(e) !== valueOf(pe)) return `key ${key} is already on the pile: its value becomes ${valueOf(e)}, and it moves to the top`;
    }
    // a linked pile: a node lifted out, or laid on top
    if (pm && now.length === before.length && m.$map.every(([, e]) => isList(e))) {
      const top = pileOf(ctx.vars, key);
      const wasTop = pileOf(ctx.prev, key);
      if (top && !wasTop && ctx.next?.op === ctx.op) return `key ${key} is laid on top of the pile: ${top.join(', ')} (top to bottom)`;
      const line = lineKeys(ctx.vars);
      const pline = lineKeys(ctx.prev);
      if (line && pline && line.length === pline.length - 1) {
        const out = pline.find((k) => !line.includes(k));
        return out === key ? `key ${key} is lifted out of the pile, to be laid back on top` : `key ${out} is pulled out from the bottom of the pile`;
      }
    }
    // the call's last step: what it did, and the pile from top to bottom
    if (ctx.next && ctx.next.op === ctx.op) return null;
    const res = ctx.result?.[ctx.op];
    const pile = pileOf(ctx.vars, op.name === 'put' || res !== -1 ? key : undefined);
    // not before a get: the prediction asked there is what that get returns
    const shown = pile && opOf(ctx, ctx.op + 1)?.name !== 'get' ? ` Pile, top to bottom: ${pile.join(', ') || 'empty'}` : '';
    if (op.name === 'get') return res === -1 ? `get(${key}): no paper ${key} on the pile, so -1.${shown}` : `get(${key}) finds ${res}; reading it puts it on top.${shown}`;
    if (op.name === 'put' && shown) return `put(${key}, ${value}) done.${shown}`;
    return null;
  },
  // on the last step of a call, when the next call is a get: what will it return?
  predict(ctx) {
    if (!ctx.next || ctx.next.op === ctx.op || !Array.isArray(ctx.result)) return null;
    const next = opOf(ctx, ctx.next.op);
    if (next?.name !== 'get') return null;
    const res = ctx.result[ctx.next.op];
    if (typeof res !== 'number') return null;
    const key = next.args[0];
    const puts = ctx.ops.slice(1, ctx.next.op).filter((o) => o.name === 'put');
    const last = [...puts].reverse().find((o) => o.args[0] === key);
    const binned = puts.some((o) => !keysOf(mapOf(ctx.vars)).includes(o.args[0]));
    // worth asking: a key that was put but may have been binned, once something has been binned
    if (!last || !binned) return null;
    const pile = pileOf(ctx.vars);
    return options(
      `Next call: get(${key}). What does it return?`,
      res,
      [-1, last.args[1], ...puts.map((o) => o.args[1])],
      res === -1
        ? `Key ${key} was put earlier, but newer uses buried it at the bottom and it was binned, so the answer is -1.`
        : `Key ${key} is still on the pile${pile ? ` (top to bottom: ${pile.join(', ')})` : ''}: it was used recently enough to survive.`,
    );
  },
  bugs: [
    {
      label: 'get does not refresh recency',
      find: '    this._remove(node);          // a read is a use\n    this._addFront(node);\n',
      replace: '',
      explain: 'Reading a key must lay it on top. Without that, a key you just read stays near the bottom and is binned next (get(1) then put(3) drops key 1 instead of key 2).',
    },
    {
      label: 'Evicted key left in the Map',
      find: '      this.map.delete(lru.key);  // this is why nodes store their key\n',
      replace: '',
      explain: 'The paper leaves the pile but the Map still points to it, so get on a binned key returns its old value instead of -1, and the size never drops.',
    },
  ],
};
