// Scene: LFU Cache. Shelves by popularity: shelf N holds the keys used N times, newest use at the end. A use moves
// a key up one shelf; when the cache is full, the key that has sat longest on the lowest shelf leaves. Reads the
// key map of `this` (key → { value, freq } or key → value plus a key → count map) and the shelves (freq → Set /
// array / list of keys). The call comes from ctx.ops; get answers from ctx.result.
import { options } from './util.js';

const isInt = Number.isInteger;
const opOf = (ctx, i = ctx.op) => ctx.ops?.[i];
const COUNT = /freq|count|cnt|uses|hits|f$/i;
const isShelf = (v) => !!(v && (v.$set || v.$list || Array.isArray(v)));
const shelfKeys = (v) => (v?.$set ? v.$set : v?.$list ? v.$list.values : Array.isArray(v) ? v : []);

/** { keys: Map entries, freq(key), shelves: [[f, keys]] | null, min } from the fields of `this` */
function cacheOf(vars) {
  const o = vars?.this?.$obj;
  if (!o) return null;
  const maps = Object.entries(o).filter(([, v]) => v && v.$map);
  const shelves = maps.find(([, v]) => v.$map.length && v.$map.every(([f, s]) => isInt(f) && isShelf(s)));
  const counts = maps.find(([k, v]) => v !== shelves?.[1] && COUNT.test(k) && v.$map.every(([, c]) => isInt(c)));
  const keys = maps.filter(([, v]) => v !== shelves?.[1] && v !== counts?.[1]).sort((a, b) => b[1].$size - a[1].$size)[0];
  if (!keys) return null;
  const entries = keys[1].$map;
  const freq = (k) => {
    const e = entries.find(([x]) => x === k)?.[1];
    const fo = e?.$obj && Object.keys(e.$obj).find((f) => COUNT.test(f) && isInt(e.$obj[f]));
    if (fo) return e.$obj[fo];
    return counts?.[1].$map.find(([x]) => x === k)?.[1];
  };
  const value = (k) => {
    const e = entries.find(([x]) => x === k)?.[1];
    if (e === undefined) return undefined;
    if (!e || typeof e !== 'object') return e;
    if (e.$obj) return e.$obj.value ?? e.$obj.val ?? e.$obj.v;
    return undefined;
  };
  const minName = Object.keys(o).find((k) => /^(min|lowest|least)/i.test(k) && isInt(o[k]));
  return {
    keys: entries.map(([k]) => k),
    freq,
    value,
    shelves: shelves ? shelves[1].$map.filter(([, s]) => shelfKeys(s).length).sort((a, b) => a[0] - b[0]).map(([f, s]) => [f, shelfKeys(s)]) : null,
    min: minName ? o[minName] : undefined,
  };
}
const times = (n) => `${n} use${n === 1 ? '' : 's'}`;

export default {
  id: 'lfu-cache',
  metaphor: 'Shelves sorted by how often used',
  caption: 'Shelf N holds the keys used N times, the most recent use at the end. A use moves a key up one shelf; when the cache is full, the key at the front of the lowest shelf (fewest uses, then oldest use) leaves.',
  narrate(ctx) {
    const op = opOf(ctx);
    if (!op || ctx.op === 0) return null;
    const c = cacheOf(ctx.vars);
    const pc = cacheOf(ctx.prev);
    if (!c || !pc) return null;
    const cap = ctx.ops[0]?.args?.[0];
    const [key, value] = op.args;
    const gone = pc.keys.filter((k) => !c.keys.includes(k));
    const added = c.keys.filter((k) => !pc.keys.includes(k));
    if (gone.length === 1 && !added.length && gone[0] !== key) {
      const f = pc.freq(gone[0]);
      return `the cache is full (${cap}): key ${gone[0]} leaves${isInt(f) ? `, it has the fewest uses (${f})` : ''} and the oldest use among those`;
    }
    if (added.length === 1 && !gone.length && added[0] === key && op.name === 'put') return `put(${key}, ${value}): key ${key} is new, it starts on shelf 1 (${c.keys.length} of ${cap} places taken)`;
    const f = c.freq(key);
    const pf = pc.freq(key);
    if (isInt(f) && isInt(pf) && f > pf) return `key ${key} is used again: ${times(f)} now, so it moves up to shelf ${f}`;
    if (op.name === 'put' && c.value(key) !== undefined && pc.value(key) !== undefined && c.value(key) !== pc.value(key)) return `key ${key} is already here: its value becomes ${c.value(key)} (a put is a use too)`;
    if (isInt(c.min) && isInt(pc.min) && c.min !== pc.min) return c.min === 1 && op.name === 'put' ? `a new key always has the fewest uses: the lowest shelf is 1${pc.min > 1 ? ' again' : ''}` : `shelf ${pc.min} is empty now: the lowest shelf in use is ${c.min}`;
    // the call's last step: what it did, and the shelves (not before a get: its result is asked there)
    if (ctx.next && ctx.next.op === ctx.op) return null;
    const res = ctx.result?.[ctx.op];
    const shown = c.shelves && opOf(ctx, ctx.op + 1)?.name !== 'get' ? ` Shelves: ${c.shelves.map(([n, ks]) => `${n}: ${ks.join(', ')}`).join(' · ')}` : '';
    if (op.name === 'get') return res === -1 ? `get(${key}): key ${key} is not in the cache, so -1.${shown}` : `get(${key}) finds ${res}.${shown}`;
    if (op.name === 'put' && shown) return `put(${key}, ${value}) done.${shown}`;
    return null;
  },
  // on the last step of a call, when the next call is a get on a key that was put earlier: what will it return?
  predict(ctx) {
    if (!ctx.next || ctx.next.op === ctx.op || !Array.isArray(ctx.result)) return null;
    const next = opOf(ctx, ctx.next.op);
    if (next?.name !== 'get') return null;
    const res = ctx.result[ctx.next.op];
    if (typeof res !== 'number') return null;
    const key = next.args[0];
    const puts = ctx.ops.slice(1, ctx.next.op).filter((o) => o.name === 'put');
    const last = [...puts].reverse().find((o) => o.args[0] === key);
    const c = cacheOf(ctx.vars);
    // worth asking once something has left: did this key survive?
    if (!last || !c || !puts.some((o) => !c.keys.includes(o.args[0]))) return null;
    const f = c.freq(key);
    return options(
      `Next call: get(${key}). What does it return?`,
      res,
      [-1, last.args[1], ...puts.map((o) => o.args[1])],
      res === -1
        ? `Key ${key} was put earlier, but when the cache was full it had the fewest uses (oldest among ties), so it was the one to leave: -1.`
        : `Key ${key} is still in the cache${isInt(f) ? ` with ${times(f)}` : ''}: other keys were less used (or used longer ago), so they left instead.`,
    );
  },
  bugs: [
    {
      label: 'Forget to reset minFreq on a new key',
      find: '    this.minFreq = 1;\n',
      replace: '',
      explain: 'A brand-new key has 1 use, the fewest of all, but minFreq keeps pointing at a higher shelf: the next eviction takes a well-used key (or finds no shelf at all).',
    },
    {
      label: 'Evict on an update too',
      find: '      entry.value = value;\n      this._touch(key, entry);\n      return;\n    }\n    if (this.keyMap.size >= this.cap) {',
      replace: '    }\n    if (this.keyMap.size >= this.cap) {',
      explain: 'Updating a key that is already stored needs no room, but this version evicts anyway (and then adds the key a second time), so a key that should stay is lost.',
    },
  ],
};
