// Minimum Number of Days to Disconnect Island. The answer is never more than 2 (the top-left land cell has at most
// two land neighbours). It is 0 when the map is not exactly one island, and 1 when one cell is a cut cell
// (articulation point): found with a low-link DFS (low[v] >= disc[u] for a child v; the start cell needs 2+
// branches), or by sinking each cell in turn and recounting. Cells are ids r * cols + c in 1-D disc / low arrays.
import { changedIdx, row, options } from './util.js';

const MIN = /(\w+)\[(\w+)\]\s*=\s*Math\.min\(\s*\1\[\2\]\s*,\s*(\w+)\[(\w+)\]\s*\)/;
const isInts = (v) => row(v) && v.length > 0 && v.every(Number.isInteger);
const isGrid = (v) => Array.isArray(v) && v.length > 0 && v.every((r) => row(r) && r.length === v[0].length);
const CUT = /cut|art|crit|split|found|bridge/i;
const PARENT = ['parent', 'par', 'p', 'from', 'prev', 'pa'];

/** { low, disc } 1-D array names from the Math.min lines, else by name */
function names(ctx) {
  let low, disc;
  for (const l of ctx.lines) {
    const m = l.match(MIN);
    if (!m) continue;
    low = m[1];
    if (m[3] !== m[1]) disc = m[3];
  }
  const keys = Object.keys(ctx.vars).filter((k) => !ctx.params.includes(k) && isInts(ctx.vars[k]));
  low = low || keys.find((k) => /^low/i.test(k));
  disc = disc || keys.find((k) => k !== low && /disc|tin|^ids?$|order|dfn|entry|^num|stamp/i.test(k));
  return isInts(ctx.vars[low]) && isInts(ctx.vars[disc]) ? { low, disc } : null;
}
/** true when line `no` (1-based) sits inside a function nested in the main one (a helper's return is not the answer) */
function inHelper(lines, no) {
  for (let i = 1; i < lines.length; i++) {
    if (!/function\b|=>\s*\{/.test(lines[i])) continue;
    let depth = 0, opened = false;
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '{') { depth++; opened = true; }
        else if (ch === '}') depth--;
      }
      if (opened && depth <= 0) {
        if (no - 1 > i && no - 1 <= j) return true;
        break;
      }
    }
  }
  return false;
}
const flagOf = (vars, params) => Object.keys(vars).find((k) => !params.includes(k) && CUT.test(k) && typeof vars[k] === 'boolean');

export default {
  id: 'minimum-number-of-days-to-disconnect-island',
  metaphor: 'Find the one tile holding the island',
  caption: 'Lit tiles are land. The answer is 0 if the map is not exactly one island, 1 if some single tile holds two parts together (a cut tile), and otherwise 2: cutting off a corner tile always works.',
  narrate(ctx) {
    const { vars, prev, params } = ctx;
    const g = vars[params[0]];
    if (!isGrid(g)) return null;
    const cols = g[0].length;
    const at = (id) => `(${Math.floor(id / cols)}, ${id % cols})`;
    if (ctx.ret && Number.isInteger(ctx.value) && ctx.value >= 0 && ctx.value <= 2 && !inHelper(ctx.lines, ctx.line)) {
      const isl = Object.keys(vars).find((k) => !params.includes(k) && /island|count|comp/i.test(k) && Number.isInteger(vars[k]));
      if (ctx.value === 0) return `${isl ? `${vars[isl]} island${vars[isl] === 1 ? '' : 's'}` : 'not exactly one island'}: the map is already disconnected, 0 days`;
      if (ctx.value === 1) return 'one day: sink the cut tile (or the only land tile) and the island falls apart';
      return 'no single tile holds the island together: 2 days, by cutting off a corner tile';
    }
    // brute force: a tile is sunk for a test, or put back
    if (isGrid(prev[params[0]])) {
      for (let r = 0; r < g.length; r++) {
        for (let c = 0; c < cols; c++) {
          const was = prev[params[0]][r]?.[c];
          if (was === 1 && g[r][c] === 0) return `try sinking (${r}, ${c}) for one day: does the island split?`;
          if (was === 0 && g[r][c] === 1) return `put (${r}, ${c}) back and try the next tile`;
        }
      }
    }
    const fName = flagOf(vars, params);
    const nm = names(ctx);
    if (fName && vars[fName] === true && prev[fName] === false) {
      if (/children|kids|branch|child/.test(ctx.src || '') && nm) return 'the start tile has 2+ separate branches: sinking it splits the island, so 1 day is enough';
      const m = (ctx.src || '').match(/(\w+)\[(\w+)\]\s*>=\s*(\w+)\[(\w+)\]/);
      if (m && nm && Number.isInteger(vars[m[2]]) && Number.isInteger(vars[m[4]])) {
        const v = vars[m[2]], u = vars[m[4]];
        return `low = ${vars[nm.low][v]} ≥ disc = ${vars[nm.disc][u]}: the land past ${at(v)} only connects through ${at(u)}, a cut tile`;
      }
      return 'a cut tile is found: sinking it splits the island, so 1 day is enough';
    }
    const isl = Object.keys(vars).find((k) => !params.includes(k) && /island|comp/i.test(k) && Number.isInteger(vars[k]));
    if (isl && Number.isInteger(prev[isl]) && vars[isl] === prev[isl] + 1) {
      const rc = ['r', 'i', 'row'].find((k) => Number.isInteger(vars[k]));
      const cc = ['c', 'j', 'col'].find((k) => Number.isInteger(vars[k]));
      return `${rc && cc ? `land at (${vars[rc]}, ${vars[cc]})` : 'land'} not reached yet: island #${vars[isl]}`;
    }
    if (!nm) return null;
    const low = vars[nm.low], disc = vars[nm.disc];
    const m = (ctx.src || '').match(MIN);
    if (m && m[1] === nm.low && Number.isInteger(vars[m[2]]) && Number.isInteger(vars[m[4]])) {
      const u = vars[m[2]], v = vars[m[4]];
      if (m[3] === nm.low) return `back at ${at(u)} from ${at(v)}: ${at(v)}'s side climbs back to time ${low[v]}, so low of ${at(u)} = ${low[u]}`;
      if (m[3] === nm.disc) return disc[v] < disc[u] ? `${at(u)} touches ${at(v)}, visited earlier at time ${disc[v]}: low of ${at(u)} = ${low[u]}` : null;
    }
    if (isInts(prev[nm.disc])) {
      const ch = changedIdx(disc, prev[nm.disc]);
      if (ch.length === 1) return `visit ${at(ch[0])} at time ${disc[ch[0]]}`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const { vars, params } = ctx;
    const g = vars[params[0]];
    const fName = flagOf(vars, params);
    if (!isGrid(g) || !fName) return null;
    const cols = g[0].length;
    const at = (id) => `(${Math.floor(id / cols)}, ${id % cols})`;
    const nf = ctx.next.vars[fName];
    // the end: how many days?
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && ctx.next.value >= 1 && ctx.next.value <= 2 && !ctx.ret && !inHelper(ctx.lines, ctx.next.line)) {
      return options(
        `The search is over and ${vars[fName] ? 'a cut tile was found' : 'no cut tile was found'}. How many days does it take?`,
        ctx.next.value,
        [0, 1, 2].filter((x) => x !== ctx.next.value),
        vars[fName] ? 'Sinking the cut tile splits the island in one day.' : 'No single tile splits it, but the top-left land tile has at most two land neighbours: sinking both cuts it off in 2 days.',
      );
    }
    // after a child: is the current tile a cut tile because of it?
    const nm = names(ctx);
    const m = (ctx.src || '').match(MIN);
    if (!nm || !m || m[1] !== nm.low || m[3] !== nm.low || vars[fName] !== false || typeof nf !== 'boolean') return null;
    const u = vars[m[2]], v = vars[m[4]];
    const pName = PARENT.find((k) => Number.isInteger(vars[k]));
    if (!Number.isInteger(u) || !Number.isInteger(v) || !pName || vars[pName] < 0) return null; // the start tile uses the branch rule
    const lv = vars[nm.low][v], du = vars[nm.disc][u];
    return {
      question: `Back at ${at(u)} from ${at(v)}: low of ${at(v)} = ${lv}, ${at(u)} was visited at time ${du}. Is ${at(u)} a cut tile?`,
      options: [`Yes: ${at(v)}'s side only connects through ${at(u)}`, `No: ${at(v)}'s side has another way around`],
      answer: nf ? 0 : 1,
      explain: nf === (lv >= du)
        ? nf
          ? `low ${lv} ≥ disc ${du}: nothing past ${at(v)} climbs above ${at(u)}, so sinking ${at(u)} cuts it off.`
          : `low ${lv} < disc ${du}: the land past ${at(v)} reaches a tile visited before ${at(u)}, so it stays connected without ${at(u)}.`
        : `This code ${nf ? 'marks' : 'does not mark'} it (low ${lv}, disc ${du}).`,
    };
  },
  bugs: [
    {
      label: 'Apply the child test to the start tile too',
      find: 'if (parent !== -1 && low[v] >= disc[u]) hasCut = true;',
      replace: 'if (low[v] >= disc[u]) hasCut = true;',
      explain: 'Nothing is visited before the start tile, so low ≥ disc holds for any child of it: every island with 2+ tiles looks cuttable and a 2×2 block answers 1 instead of 2.',
    },
    {
      label: 'Treat zero islands as connected',
      find: 'if (islands !== 1) return 0;',
      replace: 'if (islands > 1) return 0;',
      explain: 'A map with no land is already "disconnected" (it is not exactly one island), so the answer is 0; skipping that case runs the cut search on nothing and answers 2.',
    },
  ],
};
