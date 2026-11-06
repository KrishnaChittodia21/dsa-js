// N-Queens: queens go on a chessboard one row at a time. Each square in the row is tried left to right; a square
// sharing a column or a diagonal with an earlier queen is attacked and skipped, a row with no safe square left
// sends the search back to move the queen above. Reads the queens from a column-per-row list or a 'Q' / '.' board.
import { callArgs, functionAt, row as plainRow } from './util.js';

const RESULT = ['result', 'res', 'ans', 'answer', 'out', 'output', 'results', 'boards', 'solutions', 'sols'];
const PLACEMENT = /queen|pos|place/i;
const MAYBE_PLACEMENT = /board|state|sol|col|perm/i;
const COLS = ['c', 'col', 'j', 'column', 'colIdx', 'x'];
const ROWS = ['row', 'r', 'i', 'rowIdx', 'y'];

/** the queens on the board as [[row, col], …], from a 'Q' / '.' board or a column-per-row list; null when unsure */
function queensOf(vars, params, n) {
  if (!Number.isInteger(n) || n < 1) return null;
  const names = Object.keys(vars).filter((k) => !params.includes(k) && !RESULT.includes(k));
  for (const k of names) {
    const v = vars[k];
    if (!Array.isArray(v) || v.length !== n) continue;
    const rows = v.map((r) => (typeof r === 'string' ? [...r] : Array.isArray(r) ? r : null));
    const isQ = (x) => x === 'Q' || x === '.' || (/board|grid/i.test(k) && (x === true || x === false));
    if (rows.every((r) => r && r.length === n && r.every(isQ))) {
      const out = [];
      rows.forEach((r, i) => r.forEach((x, j) => (x === 'Q' || x === true) && out.push([i, j])));
      return out;
    }
  }
  const lists = [...names.filter((k) => PLACEMENT.test(k)), ...names.filter((k) => !PLACEMENT.test(k) && MAYBE_PLACEMENT.test(k))];
  for (const k of lists) {
    const v = plainRow(vars[k]);
    if (!v || v.length > n || !v.every((x) => Number.isInteger(x) && x >= -1 && x < n)) continue;
    // a full-length row of 0 / 1 under a column-like name is a flag row (column taken?), not the queens
    if (!PLACEMENT.test(k) && v.length === n && n > 2 && v.every((x) => x === 0 || x === 1)) continue;
    const out = [];
    v.forEach((c, r) => c >= 0 && out.push([r, c]));
    return out;
  }
  return null;
}

/** which placed queens attack (r, c), and how */
function attackers(queens, r, c) {
  return queens
    .filter(([qr]) => qr !== r)
    .map(([qr, qc]) => [qr, qc, qc === c ? 'its column' : qr - qc === r - c ? 'a diagonal' : qr + qc === r + c ? 'an anti-diagonal' : null])
    .filter((a) => a[2]);
}
const by = (att) => (att.length ? `the queen on (${att[0][0]}, ${att[0][1]}) shares ${att[0][2]}` : 'nothing attacks it, yet it was skipped');

const firstIntOf = (vars, names) => names.find((k) => Number.isInteger(vars?.[k]));
/** the row the current call is filling: the recursive call's integer argument */
function rowOf(ctx) {
  const call = callArgs(ctx);
  if (!call) return null;
  const k = Object.keys(call.args).find((p) => Number.isInteger(call.args[p]) && p !== ctx.params[0]) || firstIntOf(ctx.vars, ROWS);
  return k ? { fn: call.name, name: k, value: ctx.vars[k] } : null;
}
/** the function calls itself somewhere in its body */
function recursive(ctx, name) {
  const re = new RegExp(`\\b${name}\\s*\\(`);
  return ctx.lines.some((l, i) => functionAt(ctx.lines, i + 1) === name && re.test(l) && !new RegExp(`function\\s+${name}\\b|${name}\\s*=`).test(l));
}
const sets = (vars, params) => Object.entries(vars).filter(([k, v]) => !params.includes(k) && v && Array.isArray(v.$set));
const resultOf = (vars) => RESULT.map((k) => vars?.[k]).find((v) => Array.isArray(v));

/** a square the loop has just arrived at, nothing decided yet: { r, c, cName } */
function trying(ctx, rw) {
  const cName = firstIntOf(ctx.vars, COLS.filter((k) => k !== rw.name));
  if (!cName || !recursive(ctx, rw.fn)) return null;
  if (ctx.prev[rw.name] !== rw.value || ctx.prev[cName] === ctx.vars[cName]) return null;
  return { r: rw.value, c: ctx.vars[cName], cName };
}

export default {
  id: 'n-queens',
  metaphor: 'Queens on a chessboard, one per row',
  caption: 'Queens go in one row at a time. A square is safe when no earlier queen shares its column or either diagonal; a row with no safe square left sends the search back to move the queen above.',
  narrate(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (!Number.isInteger(n)) return null;
    const res = resultOf(ctx.vars);
    const resBefore = resultOf(ctx.prev);
    if (res && resBefore && res.length === resBefore.length + 1) return `all ${n} queens are safe: write down board #${res.length}`;
    const q = queensOf(ctx.vars, ctx.params, n);
    const qBefore = queensOf(ctx.prev, ctx.params, n);
    const key = (a) => a.join(',');
    if (q && qBefore && q.length === qBefore.length + 1) {
      const [r, c] = q.find((a) => !qBefore.some((b) => key(b) === key(a))) || q[q.length - 1];
      return `queen on (${r}, ${c}): column ${c} and both its diagonals are now attacked`;
    }
    if (q && qBefore && q.length === qBefore.length - 1) {
      const [r, c] = qBefore.find((a) => !q.some((b) => key(b) === key(a))) || qBefore[qBefore.length - 1];
      return `lift the queen off (${r}, ${c}): try the next column in row ${r}`;
    }
    const rw = rowOf(ctx);
    if (!rw || !Number.isInteger(rw.value)) return null;
    const prevRow = ctx.prev[rw.name];
    if (Number.isInteger(prevRow) && rw.value === prevRow - 1 && recursive(ctx, rw.fn)) {
      if (prevRow >= n) return `back in row ${rw.value} after a full board: move its queen on to look for more`;
      const cName = firstIntOf(ctx.prev, COLS.filter((k) => k !== rw.name));
      const att = q && cName ? attackers(q, prevRow, ctx.prev[cName]) : [];
      const last = att.length ? `(${prevRow}, ${ctx.prev[cName]}) is attacked too, so ` : '';
      return `${last}row ${prevRow} has no safe square left: back up to row ${rw.value} and move its queen`;
    }
    if (Number.isInteger(prevRow) && rw.value === prevRow + 1 && recursive(ctx, rw.fn) && q) {
      return rw.value >= n ? `every row has a queen` : `row ${rw.value}: ${q.length} queen${q.length === 1 ? '' : 's'} placed, look for a safe column`;
    }
    const t = trying(ctx, rw);
    if (t && q) {
      const pc = ctx.prev[t.cName];
      const att = Number.isInteger(pc) && pc < t.c ? attackers(q, t.r, pc) : [];
      // no attacker: the square was just left by a lifted queen, not skipped
      const skipped = att.length ? `(${t.r}, ${pc}) is attacked: ${by(att)}. ` : '';
      return `${skipped}try (${t.r}, ${t.c})`;
    }
    // the reference marks the queen in three Sets, one statement at a time
    const grown = sets(ctx.vars, ctx.params).find(([k, v]) => ctx.prev[k]?.$set && v.$set.length === ctx.prev[k].$set.length + 1);
    if (grown) return `marking the queen in row ${rw.value}: ${grown[0]} now blocks ${grown[1].$set.find((x) => !ctx.prev[grown[0]].$set.includes(x))}`;
    const shrunk = sets(ctx.vars, ctx.params).find(([k, v]) => ctx.prev[k]?.$set && v.$set.length === ctx.prev[k].$set.length - 1);
    if (shrunk) return `lifting the queen in row ${rw.value}: ${shrunk[0]} frees ${ctx.prev[shrunk[0]].$set.find((x) => !shrunk[1].$set.includes(x))}`;
    return null;
  },
  // the loop just arrived at a square (not attacked through its column): safe, or attacked along a diagonal?
  predict(ctx) {
    const n = ctx.vars[ctx.params[0]];
    if (!ctx.next || !Number.isInteger(n)) return null;
    const q = queensOf(ctx.vars, ctx.params, n);
    const rw = rowOf(ctx);
    if (!q || !rw || !Number.isInteger(rw.value) || rw.value < 1) return null;
    const t = trying(ctx, rw);
    if (!t) return null;
    const att = attackers(q, t.r, t.c);
    if (att.some((a) => a[2] === 'its column')) return null; // too easy: the column is visibly taken
    const nv = ctx.next.vars;
    const nq = queensOf(nv, ctx.params, n);
    // the square is acted on: the queen or an attack mark (Set, flag row) changes while the loop stays on it
    const marked = Object.keys(nv).some((k) => k !== rw.name && k !== t.cName && k in ctx.vars && JSON.stringify(nv[k]) !== JSON.stringify(ctx.vars[k]));
    const nextFn = functionAt(ctx.lines, ctx.next.line);
    let answer = -1;
    if (nextFn === rw.fn && nv[rw.name] === t.r && nv[t.cName] === t.c && ((nq && nq.length > q.length) || marked)) answer = 0;
    else if (nextFn === rw.fn && nv[rw.name] === t.r && Number.isInteger(nv[t.cName]) && nv[t.cName] > t.c) answer = 1;
    else if (nextFn === rw.fn && Number.isInteger(nv[rw.name]) && nv[rw.name] === t.r - 1) answer = 1;
    if (answer < 0) return null;
    const right = answer === 0 ? att.length === 0 : att.length > 0;
    return {
      question: `Row ${t.r}, square (${t.r}, ${t.c}): is it safe for a queen?`,
      options: [`Safe: the queen goes on (${t.r}, ${t.c})`, 'Attacked: skip it'],
      answer,
      explain: answer === 0
        ? right
          ? `No earlier queen shares column ${t.c}, the diagonal row − col = ${t.r - t.c} or the anti-diagonal row + col = ${t.r + t.c}.`
          : `This run places it, although ${by(att)}: check the attack test.`
        : right
          ? `Its column is free, but ${by(att)} (row − col or row + col matches).`
          : `This run skips it, although no earlier queen attacks it: check the attack test.`,
    };
  },
  bugs: [
    {
      label: 'Forget to free the anti-diagonal on undo',
      find: 'anti.delete(row + c); ',
      replace: '',
      explain: 'After a queen is lifted, its anti-diagonal stays blocked, so later boards that need that diagonal are never found (n = 4 finds no board).',
    },
    {
      label: 'Write the board down one row too early',
      find: 'if (row === n) {',
      replace: 'if (row === n - 1) {',
      explain: 'A board is recorded as soon as n − 1 queens are placed, so boards with an empty last row are written down (n = 1 gives an empty board).',
    },
  ],
};
