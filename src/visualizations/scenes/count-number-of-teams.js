// Count Number of Teams. Every soldier takes a turn as the middle of a team: teams through them = (smaller on the
// left × larger on the right) + (larger on the left × smaller on the right). A Fenwick tree / BIT over the ratings
// seen so far answers "how many on my left are smaller?". Works with the toolkit FenwickTree, a hand-written BIT,
// the O(n²) "count both sides" loop, or an O(n³) triple loop.
import { cellAt, options, row } from './util.js';

const BIT = /^(bit|bits|ft|fen|fenwick|fw|tree|bitree)$/i;
const COUNT = ['teams', 'count', 'cnt', 'res', 'result', 'ans', 'answer', 'total', 'num'];
const MIDDLE = ['j', 'mid', 'm', 'i', 'k', 'idx'];

function bitOf(vars, params) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (params.includes(k) || !BIT.test(k)) continue;
    const o = v?.$obj;
    const t = o ? ['tree', 'bit', 't', 'arr', 'data'].map((f) => o[f]).find((x) => Array.isArray(x) || x?.$array) : v;
    if (Array.isArray(t) || t?.$array) return t;
  }
  return null;
}
const lenOf = (t) => (Array.isArray(t) ? t.length : t?.$length ?? 0);
function grown(a, b) {
  if (!a || !b || lenOf(a) !== lenOf(b) || lenOf(b) > 4096) return [];
  const out = [];
  for (let i = 1; i < lenOf(b); i++) if (cellAt(a, i) !== cellAt(b, i)) out.push(i);
  return out;
}
const low = (j) => j & -j;
const block = (j) => (low(j) === 1 ? `${j}` : `${j - low(j) + 1}–${j}`);

/** the four side counts around position j */
function sides(a, j) {
  const x = a[j];
  const L = a.slice(0, j);
  const R = a.slice(j + 1);
  return { ls: L.filter((y) => y < x).length, ll: L.filter((y) => y > x).length, rs: R.filter((y) => y < x).length, rl: R.filter((y) => y > x).length };
}
const teamsAt = (a, j) => {
  const c = sides(a, j);
  return c.ls * c.rl + c.ll * c.rs;
};
const counter = (vars, params) => COUNT.find((k) => !params.includes(k) && Number.isInteger(vars?.[k]));
/** the middle index whose team count explains a jump of d: [name, j] */
function middleFor(vars, a, d) {
  const k = MIDDLE.find((n) => Number.isInteger(vars[n]) && vars[n] >= 0 && vars[n] < a.length && teamsAt(a, vars[n]) === d);
  return k ? [k, vars[k]] : null;
}

export default {
  id: 'count-number-of-teams',
  metaphor: 'Each soldier stands in the middle once',
  caption: 'A team is three soldiers rising or falling in rating, left to right. Put each soldier in the middle: pick a smaller one on the left and a larger one on the right (or the other way round). The BIT row counts the ratings already passed on the left.',
  narrate(ctx) {
    const a = row(ctx.input?.[0]);
    if (!a) return null;
    const c = counter(ctx.vars, ctx.params);
    const d = c && Number.isInteger(ctx.prev[c]) ? ctx.vars[c] - ctx.prev[c] : NaN;
    // the counter line: at the start of the statement (records += 0 too), or inside an if only when it grew
    if (c && (new RegExp(`^\\s*${c}\\s*(\\+=|\\+\\+)`).test(ctx.src || '') ? d >= 0 : d > 0 && new RegExp(`\\b${c}\\s*(\\+=|\\+\\+)`).test(ctx.src || ''))) {
      // a triple loop adds 1 per team: name the three soldiers
      const [i, j, k] = ['i', 'j', 'k'].map((n) => ctx.vars[n]);
      if (d === 1 && [i, j, k].every(Number.isInteger) && i < j && j < k && k < a.length && (a[i] < a[j]) === (a[j] < a[k])) {
        return `soldiers ${a[i]}, ${a[j]}, ${a[k]} ${a[i] < a[j] ? 'rise' : 'fall'} left to right: one more team (${ctx.vars[c]})`;
      }
      const m = middleFor(ctx.vars, a, d);
      if (!m) return null;
      const s = sides(a, m[1]);
      return `${a[m[1]]} in the middle: ${s.ls} smaller left × ${s.rl} larger right + ${s.ll} larger left × ${s.rs} smaller right = +${d} (${ctx.vars[c]})`;
    }
    const t = bitOf(ctx.vars, ctx.params);
    const g = grown(bitOf(ctx.prev, ctx.params), t);
    if (t && g.length) {
      const j = [ctx.vars.j, ctx.vars.i].find((x) => Number.isInteger(x) && x < a.length);
      const who = j !== undefined ? `rating ${a[j]} is now passed` : 'one more rating is passed';
      return g.length === 1 ? `${who}: node ${g[0]} (slots ${block(g[0])}) grows to ${cellAt(t, g[0])}` : `${who}: BIT nodes ${g.join(', ')} grow (blocks ${g.map(block).join(', ')})`;
    }
    // the BIT answers "smaller on my left": a fresh variable that holds exactly that count
    if (t) {
      const ent = Object.entries(ctx.vars).find(([k, v]) => /small|less|lo/i.test(k) && /left|^l|^ls$/i.test(k) && Number.isInteger(v) && !(k in ctx.prev));
      const j = [ctx.vars.j, ctx.vars.i].find((x) => Number.isInteger(x) && x < a.length);
      if (ent && j !== undefined && sides(a, j).ls === ent[1]) return `how many passed ratings (left of ${a[j]}) are smaller? prefix below its rank = ${ent[1]}`;
    }
    return null;
  },
  // right before the team count grows by one soldier's share: how many teams have them in the middle?
  predict(ctx) {
    const a = row(ctx.input?.[0]);
    if (!a || !ctx.next) return null;
    const c = counter(ctx.vars, ctx.params);
    const nx = ctx.next.vars;
    const src = (ctx.lines || [])[ctx.next.line - 1] || '';
    if (!c || !Number.isInteger(nx[c]) || !new RegExp(`\\b${c}\\s*\\+=`).test(src)) return null;
    const d = nx[c] - ctx.vars[c];
    const m = middleFor(nx, a, d);
    if (!m || m[1] === 0 || m[1] === a.length - 1) return null;
    const s = sides(a, m[1]);
    const x = a[m[1]];
    return options(
      `${x} stands in the middle: left [${a.slice(0, m[1]).join(', ')}], right [${a.slice(m[1] + 1).join(', ')}]. How many teams have ${x} in the middle?`,
      d,
      [s.ls * s.rl, s.ll * s.rs, s.ls + s.rl + s.ll + s.rs, d + 1].filter((v) => v !== d),
      `Rising teams: ${s.ls} smaller on the left × ${s.rl} larger on the right = ${s.ls * s.rl}; falling: ${s.ll} larger left × ${s.rs} smaller right = ${s.ll * s.rs}. Together ${d}.`,
    );
  },
  bugs: [
    {
      label: 'Only rising teams counted',
      find: 'teams += leftSmaller * rightLarger + leftLarger * rightSmaller;',
      replace: 'teams += leftSmaller * rightLarger;',
      explain: 'Falling teams (larger, middle, smaller) are never added: [5, 4, 3, 2, 1] gives 0 instead of 10.',
    },
    {
      label: 'Right side counted with n − j',
      find: '(n - 1 - j) - rightSmaller',
      replace: '(n - j) - rightSmaller',
      explain: 'n − j soldiers includes the middle one itself, so every soldier gets one phantom larger partner on the right.',
    },
  ],
};
