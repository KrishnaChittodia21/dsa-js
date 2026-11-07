// Smallest String With Swaps (union-find). Swap pairs link seats; swaps chain, so every linked group of seats can
// be rearranged in any order: sort each group's letters and hand them back smallest first. Reads the parent row
// (plain or a union-find object's field), the groups Map / object, and the output letter row by shape.
import { row, changedIdx, groupsOf, sorted, options, parentOf } from './util.js';

const ONE = (x) => typeof x === 'string' && x.length === 1;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** non-parameter rows of single letters: [name, row] */
const letterRows = (vars, params) => Object.entries(vars || {}).filter(([k, v]) => !params.includes(k) && row(v) && v.length > 0 && v.every(ONE));
/** the output row: a letter row as long as s that changed between two snapshots */
function outOf(a, b, params, n) {
  for (const [k, v] of letterRows(b, params)) if (v.length === n && row(a?.[k]) && a[k].length === n && changedIdx(v, a[k]).length) return k;
  return null;
}
/** seat groups (Map or object of root -> [indices]) under any non-parameter name */
function groupMap(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k)) continue;
    const e = v && v.$map;
    if (e && e.length && e.every(([, m]) => row(m) && m.every(Number.isInteger))) return e;
    if (v && v.$obj && Object.values(v.$obj).length && Object.values(v.$obj).every((m) => row(m) && m.every(Number.isInteger))) return Object.entries(v.$obj);
  }
  return null;
}
const seatGroups = (p) => groupsOf(p).filter((g) => g.length > 1);

export default {
  id: 'smallest-string-with-swaps',
  metaphor: 'Seats linked by swap ropes',
  caption: 'Each swap pair ties two seats with a rope; seats tied together, even through others, form a group whose letters can be shuffled freely. Each group sorts its letters and hands them back left to right.',
  narrate(ctx) {
    const [sName] = ctx.params;
    const s = typeof ctx.input?.[0] === 'string' ? ctx.input[0] : ctx.vars[sName];
    const n = typeof s === 'string' ? s.length : undefined;
    if (ctx.ret && typeof ctx.value === 'string') return `every group sat its letters smallest first: "${ctx.value}"`;
    const p = parentOf(ctx.vars);
    const pp = parentOf(ctx.prev);
    if (p && pp && p.length === pp.length) {
      const before = groupsOf(pp).length;
      const after = groupsOf(p).length;
      if (after < before) {
        const g = seatGroups(p).map((x) => `{${[...x].sort((a, b) => a - b).join(', ')}}`).join(' ');
        return `a rope joins two groups of seats: ${plural(after, 'group')} left, linked ones: ${g}`;
      }
    }
    if (p && !pp && n) return `${plural(n, 'seat')}, each on its own: swap pairs will tie them into groups`;
    // groups being filled: seat i joins its root's list
    const gm = groupMap(ctx.vars, ctx.params);
    const gp = groupMap(ctx.prev, ctx.params);
    if (gm) {
      const grew = gm.find(([r, m]) => m.length === (gp?.find(([q]) => q === r)?.[1].length ?? 0) + 1);
      if (grew && grew[1].length) return `seat ${grew[1][grew[1].length - 1]} belongs to the group led by seat ${grew[0]}: {${grew[1].join(', ')}}`;
    }
    // a group's letters sorted
    if (typeof s === 'string') {
      const fresh = letterRows(ctx.vars, ctx.params).find(([k, v]) => sorted(v) && outOf(ctx.prev, ctx.vars, ctx.params, n) !== k && (!ctx.prev[k] || JSON.stringify(ctx.prev[k]) !== JSON.stringify(v)));
      const seats = Object.entries(ctx.vars).find(([k, v]) => !ctx.params.includes(k) && row(v) && v.length === fresh?.[1].length && v.every(Number.isInteger))?.[1];
      if (fresh && seats && fresh[1].length < n + 1 && seats.every((i) => i < n)) {
        const orig = seats.map((i) => s[i]);
        return `group of seats ${seats.join(', ')} holds ${orig.join(' ')}; sorted: ${fresh[1].join(' ')}, handed back left to right`;
      }
    }
    // a seat gets its letter
    const oName = n && outOf(ctx.prev, ctx.vars, ctx.params, n);
    if (oName) {
      const ch = changedIdx(ctx.vars[oName], ctx.prev[oName]);
      if (ch.length === 1) return `seat ${ch[0]} gets "${ctx.vars[oName][ch[0]]}" (it held "${s[ch[0]]}"): the smallest letter its group has left`;
    }
    return null;
  },
  // which letter lands in a group's first seat?
  predict(ctx) {
    if (!ctx.next) return null;
    const s = ctx.input?.[0];
    if (typeof s !== 'string') return null;
    const oName = outOf(ctx.vars, ctx.next.vars, ctx.params, s.length);
    if (!oName) return null;
    const ch = changedIdx(ctx.next.vars[oName], ctx.vars[oName]);
    if (ch.length !== 1) return null;
    const seat = ch[0];
    const got = ctx.next.vars[oName][seat];
    const pool = letterRows(ctx.vars, ctx.params).filter(([k, v]) => k !== oName && v.length < s.length + 1 && v.includes(got)).map(([, v]) => v)[0];
    if (!pool || pool.length < 2 || got !== pool[0]) return null; // once per group: its first seat
    return options(
      `Seat ${seat} held "${s[seat]}". Its group's letters, sorted: ${pool.join(' ')}. Which letter goes to seat ${seat}?`,
      got,
      [s[seat], ...pool.filter((c) => c !== got)].slice(0, 3),
      `The group's seats are filled left to right with its sorted letters, so seat ${seat} gets "${got}".`,
    );
  },
  bugs: [
    {
      label: 'Group by the direct parent, not the root',
      find: 'const r = uf.find(i);',
      replace: 'const r = uf.parent[i];',
      explain: 'A seat whose parent is not the root lands in its own group: with pairs (0,3), (1,2), (0,2), seat 2 is split from 0, 1, 3 and "dcab" is not fully sorted.',
    },
    {
      label: 'Forget to sort the group\'s letters',
      find: 'idx.map((i) => s[i]).sort()',
      replace: 'idx.map((i) => s[i])',
      explain: 'Each group just hands its letters back in the order they were: "dcab" stays "dcab" instead of becoming "bacd".',
    },
  ],
};
