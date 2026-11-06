// Pascal's Triangle: a wall of bricks, each row one brick wider. The edge bricks are 1; every inner brick sits on
// the two bricks above it and carries their sum. Works when a row is built aside and then added, and when the row is
// added first and filled in place inside the triangle.
import { changedIdx, row } from './util.js';

// set-up lines and hand-overs (const prev = rows[i - 1], cur = next) are not brick writes
const SETUP = /^\s*(const\s+|let\s+|var\s+)?[\w$]+\s*=\s*[\w$]+(\[[^\]]*\])?\s*;/;
const isTri = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r));

/** the triangle: the first non-parameter value that is a list of number rows */
function triangleOf(vars, params) {
  const k = Object.keys(vars).find((n) => !params.includes(n) && isTri(vars[n]));
  return k ? [k, vars[k]] : [];
}

/** one brick laid between two snapshots: { R (row number), j, v, above } or { joined: R } */
function laid(vars, prev, params, src) {
  const [tName, tri] = triangleOf(vars, params);
  if (!tri || SETUP.test(src || '')) return null;
  const was = prev[tName];
  if (isTri(was)) {
    if (tri.length === was.length + 1 && tri.slice(0, -1).every((r, i) => r.join() === was[i].join())) {
      // a whole finished row joined (or an empty / pre-filled one, to be filled in place)
      return { joined: tri.length - 1, row: tri[tri.length - 1] };
    }
    if (tri.length === was.length) {
      const R = tri.length - 1;
      const [a, b] = [tri[R], was[R]];
      const grew = a.length === b.length + 1 && b.every((x, i) => x === a[i]);
      const d = changedIdx(a, b);
      if (grew || d.length === 1) {
        const j = grew ? a.length - 1 : d[0];
        return { R, j, v: a[j], above: tri[R - 1] };
      }
    }
  }
  // a row built aside: it grew by one brick (push) or one brick changed; the row above is the triangle's last
  const R = Array.isArray(was) ? tri.length : -1;
  if (R < 1) return null;
  for (const k of Object.keys(vars)) {
    if (k === tName || params.includes(k)) continue;
    const a = row(vars[k]);
    const b = row(prev[k]);
    if (!a || !b) continue;
    const grew = a.length === b.length + 1 && b.every((x, i) => x === a[i]);
    const d = a.length === b.length ? changedIdx(a, b) : [];
    if (!grew && d.length !== 1) continue;
    const j = grew ? a.length - 1 : d[0];
    return { R, j, v: a[j], above: tri[R - 1] };
  }
  return null;
}

/** what the brick should be from the row above: 'edge', 'sum' or null when it does not add up */
function kind(b) {
  if (!b || !Number.isInteger(b.v) || !row(b.above)) return null;
  if (b.j === 0 || b.j === b.R) return b.v === 1 ? 'edge' : null;
  return b.v === b.above[b.j - 1] + b.above[b.j] ? 'sum' : null;
}

export default {
  id: 'pascals-triangle',
  metaphor: 'A wall of bricks, each on two below',
  caption: 'Each row is one brick wider than the row above. Edge bricks are 1; every inner brick sits on the two bricks above it and carries their sum.',
  narrate(ctx) {
    if (ctx.ret && Array.isArray(ctx.value)) return `${ctx.value.length} row${ctx.value.length === 1 ? '' : 's'} laid: the triangle is done`;
    const [tName, tri] = triangleOf(ctx.vars, ctx.params);
    if (tri && !(tName in ctx.prev) && tri.length === 1 && tri[0].join() === '1') return 'row 0 is a single brick: 1';
    const b = laid(ctx.vars, ctx.prev, ctx.params, ctx.src);
    if (!b) return null;
    if (b.joined !== undefined) return b.row.length === b.joined + 1 && b.row.every(Number.isInteger) && b.row.some((x) => x !== 1 || b.joined < 2) ? `row ${b.joined} is laid: ${b.row.join(' ')}` : null;
    const k = kind(b);
    if (k === 'edge') return `row ${b.R}, ${b.j === 0 ? 'left' : 'right'} edge: always 1`;
    if (k === 'sum') return `row ${b.R}, brick ${b.j} sits on ${b.above[b.j - 1]} and ${b.above[b.j]}: ${b.above[b.j - 1]} + ${b.above[b.j]} = ${b.v}`;
    return null;
  },
  // an inner brick worth at least 3: what does it carry?
  predict(ctx) {
    if (!ctx.next) return null;
    const b = laid(ctx.next.vars, ctx.vars, ctx.params, ctx.lines[ctx.next.line - 1]);
    // the left half only: the right half mirrors it
    if (!b || b.joined !== undefined || kind(b) !== 'sum' || b.v < 3 || b.j > b.R / 2) return null;
    const [l, r] = [b.above[b.j - 1], b.above[b.j]];
    const wrong = [l * r, b.v + 1, b.v - 1, Math.max(l, r) + 1].filter((w) => w !== b.v);
    const opts = [...new Set([b.v, ...wrong].map(String))].slice(0, 4).sort((x, y) => x - y);
    return {
      question: `Row ${b.R}, brick ${b.j} sits on ${l} and ${r}. What number does it carry?`,
      options: opts,
      answer: opts.indexOf(String(b.v)),
      explain: `An inner brick is the sum of the two it sits on: ${l} + ${r} = ${b.v}.`,
    };
  },
  bugs: [
    {
      label: 'Start with [1, 1] as row 0',
      find: 'const rows = [[1]];',
      replace: 'const rows = [[1, 1]];',
      explain: 'Row 0 is a single brick. Starting with two puts a right-edge 1 on row 0, so the first row is wrong from the start.',
    },
    {
      label: 'Return only the last row',
      find: 'return rows;',
      replace: 'return rows[rows.length - 1];',
      explain: 'The question wants every row of the wall, not just the bottom one.',
    },
  ],
};
