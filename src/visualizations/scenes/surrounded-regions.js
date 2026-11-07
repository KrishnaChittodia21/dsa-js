// Surrounded Regions (reverse thinking: flood inward from the border). Rescuers walk in from the edge of the board;
// every O they reach is safe (marked with a spare letter or a visited grid); the final sweep captures the rest.
// Works with any mark letter ('S', '#', 'T'…), a 2-D visited grid, BFS (queue + head or shift) or DFS.
import { options } from './util.js';

const grid = (b) => (Array.isArray(b) && b.length > 0 && b.every((r) => Array.isArray(r)) ? b : null);
/** [[i, j, before, after], …] for every cell that differs between two boards */
function diffs(a, b) {
  const out = [];
  if (!grid(a) || !grid(b) || a.length !== b.length) return out;
  b.forEach((r, i) => r.forEach((x, j) => a[i]?.[j] !== x && out.push([i, j, a[i]?.[j], x])));
  return out;
}
const at = (i, j) => `(${i},${j})`;
/** a 2-D visited / safe grid that is not the board */
const visitGrid = (vars, board) => Object.entries(vars).find(([k, v]) => k !== board && /vis|seen|safe|keep|reach|mark/i.test(k) && grid(v));

export default {
  id: 'surrounded-regions',
  metaphor: 'Rescuers walking in from the edge',
  caption: 'Rescuers enter at every O on the border and walk through connected O cells, marking them safe. Any O nobody reached is enclosed: the final sweep turns it into X and restores the safe ones.',
  maxPredicts: 2,
  narrate(ctx) {
    const name = ctx.params[0];
    const now = grid(ctx.vars[name]);
    if (!now) return null;
    const R = now.length;
    const C = now[0].length;
    const edge = (i, j) => i === 0 || j === 0 || i === R - 1 || j === C - 1;
    const ch = diffs(ctx.prev[name], now);
    if (ch.length === 1) {
      const [i, j, was, is] = ch[0];
      if (was === 'O' && is === 'X') return `${at(i, j)} was never reached from the edge: it is enclosed, so it is captured → X`;
      if (was === 'O' && typeof is === 'string' && is !== 'O') {
        return edge(i, j)
          ? `${at(i, j)} is an O on the edge: it can never be enclosed, mark it safe ('${is}')`
          : `${at(i, j)} is an O next to a safe cell: the rescuers walk in, safe too ('${is}')`;
      }
      if (is === 'O' && was !== 'X') return `${at(i, j)} was marked safe ('${was}'): restore it to O`;
    }
    const vg = visitGrid(ctx.vars, name);
    if (vg) {
      const fresh = diffs(ctx.prev[vg[0]], vg[1]).filter(([, , , x]) => x);
      if (fresh.length === 1) {
        const [i, j] = fresh[0];
        return `${at(i, j)} is reached ${edge(i, j) ? 'straight from the edge' : 'through connected O cells'}: safe`;
      }
    }
    // a cell taken from the queue / stack: `const [r, c] = queue[head]` or `= queue.shift()`
    const m = ctx.src.match(/\[\s*(\w+)\s*,\s*(\w+)\s*\]\s*=\s*(\w+)/);
    if (m && /queue|^q$|stack|^st$|todo|frontier/i.test(m[3]) && Number.isInteger(ctx.vars[m[1]]) && Number.isInteger(ctx.vars[m[2]])) {
      return `rescuers stand on safe cell ${at(ctx.vars[m[1]], ctx.vars[m[2]])}: check its 4 neighbours for more O`;
    }
    if (!ctx.next && grid(ctx.input?.[0])) {
      let captured = 0;
      let kept = 0;
      ctx.input[0].forEach((r, i) => r.forEach((x, j) => {
        if (x !== 'O') return;
        if (now[i]?.[j] === 'X') captured++;
        else if (now[i]?.[j] === 'O') kept++;
      }));
      return `board done: ${captured} enclosed O ${captured === 1 ? 'cell was' : 'cells were'} captured, ${kept} connected to the edge ${kept === 1 ? 'stays' : 'stay'} O`;
    }
    return null;
  },
  // the final sweep: what does this cell become? (asked for the first capture and the first restore)
  predict(ctx) {
    if (!ctx.next) return null;
    const name = ctx.params[0];
    const now = grid(ctx.vars[name]);
    const input = grid(ctx.input?.[0]);
    const ch = diffs(now, ctx.next.vars[name]);
    if (!now || !input || ch.length !== 1) return null;
    const [i, j, was, is] = ch[0];
    if (is !== 'X' && is !== 'O') return null; // marking, not the sweep
    const before = (fn) => now.some((r, a) => r.some((x, b) => (a < i || (a === i && b < j)) && fn(x, a, b)));
    if (was === 'O') {
      if (before((x, a, b) => x === 'X' && input[a]?.[b] === 'O')) return null; // not the first capture
      return options(`The final sweep reaches ${at(i, j)}, which still reads 'O'. What does it become?`, is, ['X', 'O'], is === 'X'
        ? `No rescuer reached ${at(i, j)} (it was never marked), so no path of O cells joins it to the edge: it is captured.`
        : `${at(i, j)} stays O in your run.`);
    }
    if (typeof was !== 'string' || was === 'X') return null;
    if (before((x) => x === 'O')) return null; // not the first restore
    return options(`The final sweep reaches ${at(i, j)}, marked '${was}'. What does it become?`, is, ['X', 'O', was], is === 'O'
      ? `'${was}' means the rescuers reached it from the edge, so it was never enclosed: it goes back to O.`
      : `Your run turns it into ${is}.`);
  },
  bugs: [
    {
      label: 'Forget the bottom row',
      find: 'markSafe(0, c); markSafe(R - 1, c);',
      replace: 'markSafe(0, c);',
      explain: 'Rescuers never enter through the bottom edge, so an O on the last row is not marked safe and gets captured although it touches the border.',
    },
    {
      label: 'Only the border cells are safe',
      find: 'if (nr >= 0 && nr < R && nc >= 0 && nc < C) markSafe(nr, nc);',
      replace: '',
      explain: 'The rescuers mark the border O cells but never walk inward, so an inner O that connects to the edge through other O cells is captured by mistake.',
    },
  ],
};

