// Isomorphic Strings: a two-way codebook. Each position pairs a letter of s with a letter of t; the codebook must
// translate every s-letter the same way, and no two s-letters may share a t-letter. Reads any Map / plain-object
// maps (sToT, tToS, m1, m2…) and the index i / j / idx; the alternative "first-occurrence pattern" falls back.
import { entriesOf, firstInt, options } from './util.js';

const AT = ['i', 'j', 'idx', 'k', 'p'];
const q = (c) => `'${c}'`;
/** [[name, entries]] of the map-like working variables (not the parameters) */
const mapsOf = (vars, params) => Object.entries(vars).filter(([k]) => !params.includes(k)).map(([k, v]) => [k, entriesOf(v)]).filter(([, e]) => e);
const sizeSum = (ms) => ms.reduce((n, [, e]) => n + e.length, 0);
/** the pair at index i, read from the parameters */
function pairAt(ctx) {
  const [sName, tName] = ctx.params;
  const s = ctx.vars[sName];
  const t = ctx.vars[tName];
  const [iName, i] = firstInt(ctx.vars, AT);
  if (typeof s !== 'string' || typeof t !== 'string' || !iName || !(i >= 0 && i < s.length && i < t.length)) return null;
  return { s, t, iName, i, a: s[i], b: t[i] };
}

export default {
  id: 'isomorphic-strings',
  metaphor: 'A two-way codebook of letters',
  caption: 'Each position pairs a letter of s with the letter of t under it. The codebook must translate a letter the same way every time, and two different letters may never share one translation.',
  narrate(ctx) {
    const p = pairAt(ctx);
    const ms = mapsOf(ctx.vars, ctx.params);
    if (!ctx.next && /\breturn\b/.test(ctx.src || '') && typeof ctx.result === 'boolean') {
      if (ctx.result) return 'every pair agreed with the codebook both ways: the strings have the same shape';
      if (p) {
        const [sName, tName] = ctx.params;
        const before = p.s.slice(0, p.i);
        const ja = before.indexOf(p.a);
        const jb = p.t.slice(0, p.i).indexOf(p.b);
        if (ja >= 0 && p.t[ja] !== p.b) return `${q(p.a)} was already translated to ${q(p.t[ja])}, it cannot become ${q(p.b)} too: false`;
        if (jb >= 0 && p.s[jb] !== p.a) return `${q(p.b)} is already the translation of ${q(p.s[jb])}, so ${q(p.a)} cannot use it: false`;
        return `${sName} and ${tName} disagree at position ${p.i}: false`;
      }
      return null;
    }
    // a new codebook line
    const pms = mapsOf(ctx.prev, ctx.params);
    for (const [k, e] of ms) {
      const was = pms.find(([pk]) => pk === k)?.[1];
      if (!was || e.length !== was.length + 1) continue;
      const [key, val] = e.find(([x]) => !was.some(([y]) => y === x)) || [];
      if (key === undefined || typeof val === 'object') continue;
      return `write in the codebook (${k}): ${q(key)} → ${q(val)}`;
    }
    // a new pair arrives: no verdict, the prediction may ask about it
    if (p && p.i !== ctx.prev[p.iName] && ms.length) return `position ${p.i}: ${q(p.a)} sits over ${q(p.b)}. Does the codebook allow it?`;
    return null;
  },
  // a new pair whose letters were seen before, nothing decided yet: is it a conflict?
  predict(ctx) {
    const p = pairAt(ctx);
    if (!p || !ctx.next || !(p.iName in ctx.prev)) return null;
    // the pair must be fully read: letter variables (a, b / x, y…) hold both, and did not one step earlier
    const chars = (vars) => Object.entries(vars).filter(([k, v]) => !ctx.params.includes(k) && typeof v === 'string' && v.length === 1).map(([, v]) => v);
    const ready = (vars) => { const cs = chars(vars); const ia = cs.indexOf(p.a); return ia >= 0 && cs.some((c, j) => c === p.b && j !== ia); };
    if (chars(ctx.vars).length) {
      if (!ready(ctx.vars) || (ctx.prev[p.iName] === p.i && ready(ctx.prev))) return null;
    } else if (p.i === ctx.prev[p.iName]) return null;
    const ms = mapsOf(ctx.vars, ctx.params);
    if (!ms.length || sizeSum(ms) !== sizeSum(mapsOf(ctx.prev, ctx.params))) return null;
    const ja = p.s.slice(0, p.i).indexOf(p.a);
    const jb = p.t.slice(0, p.i).indexOf(p.b);
    if (ja < 0 && jb < 0) return null;
    const stop = !!ctx.next.ret && ctx.result === false;
    const goes = !ctx.next.ret && (ctx.next.vars[p.iName] === p.i || ctx.next.vars[p.iName] === p.i + 1);
    if (!stop && !goes) return null;
    const yes = 'It fits: the codebook already agrees, keep going';
    const no = 'Conflict: return false';
    const fwd = ja >= 0 && p.t[ja] !== p.b;
    const back = jb >= 0 && p.s[jb] !== p.a;
    const why = fwd ? `${q(p.a)} was translated to ${q(p.t[ja])} before, so it cannot also become ${q(p.b)}.`
      : back ? `${q(p.b)} already belongs to ${q(p.s[jb])}; two letters cannot share one translation.`
        : stop ? 'Your code stops here, although this pair matches the earlier ones.' : `${q(p.a)} → ${q(p.b)} is exactly what the codebook says already, both ways.`;
    return options(`Position ${p.i}: ${q(p.a)} over ${q(p.b)}. ${ja >= 0 ? `${q(p.a)}` : `${q(p.b)}`} was seen before. What happens?`, stop ? no : yes, [stop ? yes : no], why);
  },
  bugs: [
    {
      label: 'One codebook only (s → t)',
      find: '    if (tToS.has(b) && tToS.get(b) !== a) return false; // b already taken by another char\n',
      replace: '',
      explain: 'Without the t → s check, two letters can share a translation: "badc" vs "baba" maps both b and d to b and says true.',
    },
  ],
};
