// Pattern animations for advanced DP, grid DP, Euler paths and two-player games:
// interval DP (burst balloons), bitmask DP (TSP), state-machine DP (stock with cooldown),
// grid DP (min path sum / unique paths), Hierholzer (reconstruct itinerary), minimax (predict the winner).
import { layoutCircle, layoutNary } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const stack = (values, label) => ({ kind: 'stack', values, label });
const table = (cells, states, rowLabels, colLabels, label) => ({ kind: 'table', cells, states, rowLabels, colLabels, label });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const INF = Infinity;
const fmt = (v) => (v === INF ? '∞' : v === -INF ? '−∞' : v < 0 ? `−${-v}` : String(v));
const signed = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0');
const cleanInts = (xs, max, lo, hi) =>
  (Array.isArray(xs) ? xs : [])
    .slice(0, max)
    .map((v) => Math.max(lo, Math.min(hi, Math.round(Number(v)) || 0)));
const grid2 = (r, c, v) => Array.from({ length: r }, () => new Array(c).fill(v));

/* ------------------------------------------------------------------ interval DP: burst balloons */
export const intervalBurstBalloons = {
  title: 'Interval DP: burst balloons',
  description:
    'dp[i][j] = most coins from bursting every balloon strictly between walls i and j. Try each k as the LAST balloon burst inside: dp[i][k] + a[i]·a[k]·a[j] + dp[k][j]. Filled by interval length. (≤ 6 balloons, values 0–99.)',
  defaultInput: { nums: [3, 1, 5, 8] },
  fields: [{ key: 'nums', type: 'numbers', label: 'balloons (≤ 6)' }],
  testInputs: [{ nums: [] }, { nums: [7] }, { nums: [0, 0] }, { nums: [1, 5] }, { nums: [9, 9, 9, 9, 9, 9, 9, 9] }, { nums: [-3, 2.5, 4] }],
  generate(input) {
    const nums = cleanInts(input.nums, 6, 0, 99);
    const a = [1, ...nums, 1];
    const m = a.length;
    const dp = grid2(m, m, 0);
    const shown = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (j <= i ? '·' : j === i + 1 ? 0 : '')));
    const labels = a.map((v, i) => `${i} (${v})`);
    const base = () => shown.map((row, i) => row.map((v, j) => (j <= i ? 'muted' : j === i + 1 ? 'muted' : v === '' ? '' : 'visited')));
    const balloonHl = { 0: 'muted', [m - 1]: 'muted' };
    const frames = [];
    const snap = (note, { st = base(), i, j, k, v = {}, predict } = {}) => {
      const pointers = [];
      if (i !== undefined) pointers.push({ index: i, label: 'i', color: 'a' });
      if (k !== undefined) pointers.push({ index: k, label: 'k', color: 'b' });
      if (j !== undefined) pointers.push({ index: j, label: 'j', color: 'c' });
      const hl = { ...balloonHl };
      if (k !== undefined) hl[k] = 'active';
      if (i !== undefined) {
        hl[i] = 'visited';
        hl[j] = 'visited';
      }
      const f = {
        note,
        panels: [
          arr([...a], { label: 'a = [1, …balloons, 1]  (outer 1s are walls)', highlights: hl, pointers, range: i !== undefined ? [i, j] : undefined }),
          table(shown.map((r) => [...r]), st, labels, labels, 'dp[i][j] (row i, column j)'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      nums.length
        ? `Pad the balloons with a 1 on each side: a = [${a.join(', ')}]. dp[i][j] = best coins for the balloons strictly between i and j. Neighbouring walls (j = i + 1) enclose nothing → 0.`
        : 'No balloons: a = [1, 1] encloses nothing, so the answer is 0.',
      { v: { balloons: nums.length } },
    );
    // Predict cadence over the ranges with 2+ split points: even ones ask for a candidate's score,
    // odd ones ask which k wins.
    let big = -1;
    for (let len = 2; len < m; len++) {
      for (let i = 0; i + len < m; i++) {
        const j = i + len;
        if (len >= 3) big++;
        let best = -1;
        let bestK = -1;
        const cands = [];
        for (let k = i + 1; k < j; k++) {
          const gain = a[i] * a[k] * a[j];
          const cand = dp[i][k] + gain + dp[k][j];
          cands.push([k, cand]);
          const prev = best;
          if (cand > best) {
            best = cand;
            bestK = k;
          }
          shown[i][j] = best;
          const st = base();
          st[i][k] = 'done';
          st[k][j] = 'done';
          st[i][j] = 'active';
          let predict;
          if (len >= 3 && k === i + 1 && big % 2 === 0) {
            predict = pick(
              `Range (${i}, ${j}), burst a[${k}] = ${a[k]} LAST. dp[${i}][${k}] = ${dp[i][k]}, dp[${k}][${j}] = ${dp[k][j]}. What does this choice score?`,
              cand,
              [cand + a[k], dp[i][k] + dp[k][j] + a[k], a[k] * a[j] + dp[i][k] + dp[k][j], cand - 1],
              big + 1,
              'Its neighbours at the moment it bursts are the walls a[i] and a[j], so the gain is a[i]·a[k]·a[j] plus both independent sides.',
            );
          }
          const why = len === 2 ? ' It is the only balloon in this range.' : prev < 0 ? '' : cand > prev ? ` Beats ${prev} → new best.` : ` Not better than ${prev}.`;
          snap(
            `(i, j) = (${i}, ${j}): burst a[${k}] = ${a[k]} LAST. By then its neighbours are the walls ${a[i]} and ${a[j]}, so it pays ${a[i]}·${a[k]}·${a[j]} = ${gain}; the two sides were solved independently: dp[${i}][${k}] + ${gain} + dp[${k}][${j}] = ${dp[i][k]} + ${gain} + ${dp[k][j]} = ${cand}.${why}`,
            { st, i, j, k, v: { len, 'k (last burst)': k, candidate: cand, best }, predict },
          );
        }
        dp[i][j] = best;
        shown[i][j] = best;
        if (len >= 3) {
          const st = base();
          st[i][bestK] = 'done';
          st[bestK][j] = 'done';
          st[i][j] = 'active';
          let predict;
          const vals = cands.map((c) => c[1]);
          const tie = vals.filter((x) => x === best).length > 1;
          if (!tie && big % 2 === 1) {
            const opts = cands.slice(0, 4).map(([k]) => `k = ${k} (burst ${a[k]} last)`);
            const at = cands.slice(0, 4).findIndex(([k]) => k === bestK);
            if (at >= 0 && opts.length >= 2) predict = ask(`All splits of (${i}, ${j}) are tried. Which k wins?`, opts, at, 'The winner is the k with the largest dp[i][k] + a[i]·a[k]·a[j] + dp[k][j].');
          }
          snap(`dp[${i}][${j}] = max over k of [${cands.map(([k, c]) => `k=${k}: ${c}`).join(', ')}] = ${best}. The winner is k = ${bestK}: burst ${a[bestK]} last in this range.`, {
            st,
            i,
            j,
            k: bestK,
            v: { len, 'winning k': bestK, [`dp[${i}][${j}]`]: best },
            predict,
          });
        }
      }
    }
    const ans = m >= 2 ? dp[0][m - 1] : 0;
    const st = base();
    if (m >= 2) st[0][m - 1] = 'done';
    snap(
      `Answer dp[0][${m - 1}] = ${ans}: the most coins for all ${nums.length} balloon(s). Thinking about the LAST balloon (not the first) keeps the two sides independent. O(n³) time — n² ranges × n split points — and O(n²) space.`,
      { st, v: { answer: ans } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ bitmask DP: TSP */
const bin = (mask, n) => mask.toString(2).padStart(n, '0');

export const bitmaskTsp = {
  title: 'Bitmask DP: travelling salesman',
  description:
    'dp[mask][last] = cheapest route from city 0 that visits exactly the cities in mask and stands at last. Each move sets one more bit. (≤ 5 cities; dist[i][j] = road cost, null = no road.)',
  defaultInput: {
    dist: [
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ],
  },
  fields: [{ key: 'dist', type: 'json', label: 'dist matrix (≤ 5×5)' }],
  testInputs: [
    { dist: [] },
    { dist: [[0]] },
    { dist: [[0, 4], [4, 0]] },
    { dist: [[0, 1, null], [1, 0, 2], [null, 2, 0]] },
    { dist: [[0, 3, 4, 2, 7], [3, 0, 4, 6, 3], [4, 4, 0, 5, 8], [2, 6, 5, 0, 6], [7, 3, 8, 6, 0]] },
    { dist: [[0, 1, 9], [5, 0, 1], [1, 9, 0]] },
    { dist: 'oops' },
  ],
  generate(input) {
    const raw = Array.isArray(input.dist) ? input.dist : [];
    const n = Math.min(5, raw.length);
    const d = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0;
        const v = Array.isArray(raw[i]) ? raw[i][j] : null;
        const x = v === null || v === undefined || v === '' ? NaN : Number(v);
        return Number.isFinite(x) ? Math.max(0, Math.min(999, Math.round(x))) : INF;
      }),
    );
    const frames = [];
    if (n === 0) {
      frames.push({ note: 'No cities given — enter an n×n distance matrix (n ≤ 5).', panels: [vars({ cities: 0 })] });
      frames.push({ note: 'With no cities there is no tour to build.', panels: [vars({ answer: '—' })] });
      return frames;
    }
    const FULL = (1 << n) - 1;
    const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF));
    const par = Array.from({ length: 1 << n }, () => new Array(n).fill(-1));
    dp[1][0] = 0;
    const masks = [];
    for (let mask = 1; mask <= FULL; mask++) if (mask & 1) masks.push(mask);
    const rowLabels = masks.map((mk) => bin(mk, n));
    const colLabels = Array.from({ length: n }, (_, c) => `at ${c}`);
    // 4 cities on a circle form a square whose diagonals' labels meet at the centre; use a trapezoid instead.
    const pos = n === 4 ? [[0, 0], [3.2, 0], [2.6, 2.2], [0.6, 2.2]].map(([x, y], id) => ({ id, x, y })) : layoutCircle(n);
    const edgeList = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        if (d[i][j] === INF && d[j][i] === INF) continue;
        edgeList.push([i, j, d[i][j] === d[j][i] ? fmt(d[i][j]) : `${fmt(d[i][j])}/${fmt(d[j][i])}`]);
      }
    // (mask, at 0) only exists for the start mask: city 0 is left first and only re-entered when closing the tour.
    const live = (mk, c) => (mk & (1 << c)) !== 0 && (c !== 0 || mk === 1);
    const cells = () => masks.map((mk) => Array.from({ length: n }, (_, c) => (live(mk, c) ? fmt(dp[mk][c]) : '·')));
    const baseStates = () => masks.map((mk) => Array.from({ length: n }, (_, c) => (!live(mk, c) ? 'muted' : dp[mk][c] === INF ? '' : 'visited')));
    const graph = (states, edgeHl = {}) => ({
      kind: 'nodes',
      nodes: pos.map((p) => ({ id: p.id, label: String(p.id), x: p.x, y: p.y, state: states[p.id] || '' })),
      edges: edgeList.map(([u, v, w]) => ({ from: u, to: v, label: w, state: edgeHl[`${u}-${v}`] || edgeHl[`${v}-${u}`] || '' })),
      directed: false,
      freeLayout: true,
      label: 'cities (edge = road cost)',
    });
    const bits = (mask, hl = {}) =>
      arr(
        Array.from({ length: n }, (_, k) => (mask >> (n - 1 - k)) & 1),
        { label: `mask = ${bin(mask, n)}  (bits: city ${n - 1} … city 0)`, showIndices: false, highlights: Object.fromEntries(Object.entries(hl).map(([c, s]) => [n - 1 - Number(c), s])) },
      );
    const snap = (note, { mask = 1, gHl = {}, eHl = {}, bHl = {}, st = baseStates(), v = {}, predict } = {}) => {
      const f = { note, panels: [graph(gHl, eHl), bits(mask, bHl), table(cells(), st, rowLabels, colLabels, 'dp[mask][last]  (rows = visited set)'), vars(v)] };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    const row = (mk) => masks.indexOf(mk);
    {
      const st = baseStates();
      st[row(1)][0] = 'active';
      snap(
        `Start in city 0, so dp[${bin(1, n)}][0] = 0. A state only remembers WHICH cities are visited (the bits of mask) and where we stand — not the order — so n! orders collapse into 2ⁿ·n states.`,
        { mask: 1, gHl: { 0: 'active' }, bHl: { 0: 'active' }, st, v: { states: `${1 << n}×${n}` } },
      );
    }
    let maskAsks = 0;
    let betterAsks = 0;
    let sizeAsked = -1;
    for (const mask of masks) {
      for (let last = 0; last < n; last++) {
        if (!(mask & (1 << last)) || dp[mask][last] === INF) continue;
        for (let nxt = 0; nxt < n; nxt++) {
          if (mask & (1 << nxt) || d[last][nxt] === INF) continue;
          const nm = mask | (1 << nxt);
          const cand = dp[mask][last] + d[last][nxt];
          const old = dp[nm][nxt];
          const better = cand < old;
          let predict;
          const size = mask.toString(2).replace(/0/g, '').length;
          if (size !== sizeAsked && maskAsks < 2 && n >= 3) {
            sizeAsked = size;
            const wrongs = [bin(mask ^ (1 << nxt) ^ (1 << last), n), bin(mask & ~(1 << last), n), bin((mask << 1) & FULL, n), bin(1 << nxt, n)];
            predict = pick(`Standing in city ${last} with mask ${bin(mask, n)}, we move to city ${nxt}. What is the new mask?`, bin(nm, n), wrongs, maskAsks + 1, `mask | (1 << ${nxt}) switches on bit ${nxt} and keeps the others.`);
            if (predict) maskAsks++;
          } else if (old !== INF && betterAsks < 2) {
            predict = ask(
              `dp[${bin(nm, n)}][${nxt}] is already ${old}. Arriving from city ${last} costs ${dp[mask][last]} + ${d[last][nxt]} = ${cand}. Does it change?`,
              ['Yes — replace it', 'No — keep the old value'],
              better ? 0 : 1,
              'We keep the minimum: only a strictly cheaper route replaces the stored cost.',
            );
            betterAsks++;
          }
          if (better) {
            dp[nm][nxt] = cand;
            par[nm][nxt] = last;
          }
          const st = baseStates();
          st[row(mask)][last] = 'done';
          st[row(nm)][nxt] = 'active';
          const gHl = {};
          for (let c = 0; c < n; c++) if (mask & (1 << c)) gHl[c] = 'visited';
          gHl[last] = 'active';
          gHl[nxt] = 'done';
          snap(
            `From (mask ${bin(mask, n)}, at ${last}) with cost ${dp[mask][last]}: city ${nxt} is unvisited (bit ${nxt} is 0) → go there for ${d[last][nxt]}. New state mask ${bin(nm, n)}, at ${nxt}: ${dp[mask][last]} + ${d[last][nxt]} = ${cand}. ${
              old === INF ? 'First route to this state.' : better ? `Cheaper than ${old} → replace.` : `Not cheaper than ${old} → keep ${old}.`
            }`,
            { mask: nm, gHl, eHl: { [`${last}-${nxt}`]: 'active' }, bHl: { [nxt]: 'done', [last]: 'active' }, st, v: { from: `${bin(mask, n)}@${last}`, to: `${bin(nm, n)}@${nxt}`, cost: cand }, predict },
          );
        }
      }
    }
    // Close the tour back to city 0.
    let best = INF;
    let bestLast = -1;
    if (n === 1) {
      best = 0;
      bestLast = 0;
    } else {
      for (let last = 1; last < n; last++) {
        if (dp[FULL][last] === INF || d[last][0] === INF) continue;
        const tot = dp[FULL][last] + d[last][0];
        const st = baseStates();
        st[row(FULL)][last] = 'active';
        const was = best;
        if (tot < best) {
          best = tot;
          bestLast = last;
        }
        snap(
          `All bits set (mask ${bin(FULL, n)}), standing in ${last}: return home ${last} → 0 for ${d[last][0]}. Tour = ${dp[FULL][last]} + ${d[last][0]} = ${tot}${was === INF ? '.' : tot < was ? ` — beats ${was}.` : ` — not better than ${was}.`}`,
          { mask: FULL, gHl: { [last]: 'active', 0: 'done' }, eHl: { [`${last}-0`]: 'active' }, bHl: { [last]: 'active' }, st, v: { tour: tot, best: fmt(best) } },
        );
      }
    }
    if (best === INF) {
      snap('No complete tour exists: some city cannot be reached or there is no road back to city 0. O(2ⁿ·n²) time, O(2ⁿ·n) space.', { mask: FULL, v: { answer: 'none' } });
      return frames;
    }
    const route = [0];
    let mk = FULL;
    let cur = bestLast;
    while (cur > 0 || mk !== 1) {
      route.push(cur);
      const p = par[mk][cur];
      mk ^= 1 << cur;
      cur = p;
      if (cur < 0) break;
    }
    const tour = n === 1 ? [0] : [0, ...route.slice(1).reverse(), 0];
    const eHl = {};
    for (let t = 0; t + 1 < tour.length; t++) eHl[`${tour[t]}-${tour[t + 1]}`] = 'done';
    const gHl = Object.fromEntries(tour.map((c) => [c, 'done']));
    const st = baseStates();
    if (n > 1) st[row(FULL)][bestLast] = 'done';
    snap(
      `Shortest tour = ${best}: ${tour.join(' → ')} (rebuilt by following parent pointers back). 2ⁿ·n states × n moves each → O(2ⁿ·n²) time, O(2ⁿ·n) space — far less than trying all (n−1)! orders once n grows.`,
      { mask: FULL, gHl, eHl, st, v: { answer: best, tour: tour.join('→') } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ state-machine DP: stock with cooldown */
const SM_POS = { hold: [0, 0], sold: [3, 0], rest: [1.5, 1.7] };
const SM_EDGES = [
  ['hold', 'hold', 'keep'],
  ['rest', 'hold', 'buy −p'],
  ['hold', 'sold', 'sell +p'],
  ['sold', 'rest', 'cooldown'],
  ['rest', 'rest', 'wait'],
];
function smDiagram(nodeStates = {}, edgeStates = {}) {
  return {
    kind: 'nodes',
    nodes: Object.entries(SM_POS).map(([id, [x, y]]) => ({ id, label: id, x, y, state: nodeStates[id] || '' })),
    edges: SM_EDGES.map(([from, to, label]) => ({ from, to, label, state: edgeStates[`${from}>${to}`] || '' })),
    directed: true,
    freeLayout: true,
    label: 'state diagram (end of each day)',
  };
}

export const stateMachineStock = {
  title: 'State-machine DP: stock with cooldown',
  description:
    'Three states at the end of each day — hold (own a share), sold (sold today), rest (free, no cooldown). Each arrow is one transition; every day takes the best arrow into each state. (≤ 8 days.)',
  defaultInput: { prices: [1, 2, 3, 0, 2] },
  fields: [{ key: 'prices', type: 'numbers', label: 'prices (≤ 8 days)' }],
  testInputs: [{ prices: [] }, { prices: [5] }, { prices: [5, 4, 3, 2] }, { prices: [1, 2, 4] }, { prices: [2, 1, 4, 0, 3, 1, 5, 2, 9, 9] }, { prices: [3, 3, 3] }],
  generate(input) {
    const prices = cleanInts(input.prices, 8, 0, 999);
    const n = prices.length;
    const rows = ['hold', 'sold', 'rest'];
    const colLabels = ['start', ...prices.map((p, i) => `d${i} $${p}`)];
    const cols = [[-INF, 0, 0]];
    const frames = [];
    const cells = (partial) => rows.map((_, r) => [...cols.map((c) => fmt(c[r])), ...(partial ? [partial[r] === undefined ? '' : fmt(partial[r])] : []), ...new Array(n + 1 - cols.length - (partial ? 1 : 0)).fill('')]);
    // cols[c] is table column c (0 = start, d+1 = day d); the column being filled is cols.length.
    const states = (partial, active, deps, answerRow) =>
      rows.map((rName, r) =>
        Array.from({ length: n + 1 }, (_, c) => {
          if (c === cols.length && rName === active) return 'active';
          if (c === cols.length - 1 && deps.includes(rName)) return 'done';
          if (c === cols.length - 1 && rName === answerRow) return 'done';
          if (c < cols.length) return 'visited';
          if (c === cols.length && partial && partial[r] !== undefined) return 'visited';
          return '';
        }),
      );
    const snap = (note, { day = -1, partial, active, deps = [], answerRow, nHl = {}, eHl = {}, v = {}, predict } = {}) => {
      const f = {
        note,
        panels: [
          smDiagram(nHl, eHl),
          arr([...prices], { label: 'prices', highlights: day >= 0 ? { [day]: 'active' } : {}, pointers: day >= 0 ? [{ index: day, label: 'today', color: 'a' }] : [] }),
          table(cells(partial), states(partial, active, deps, answerRow), rows, colLabels, 'best profit in each state, end of day'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      'Before day 0: hold = −∞ (you cannot own a share you never bought), sold = 0, rest = 0. Arrows: keep holding, buy (only from rest), sell (hold → sold), cooldown (sold → rest), wait (rest → rest).',
      { v: { hold: '−∞', sold: 0, rest: 0 } },
    );
    let holdAsks = 0;
    let restAsks = 0;
    let soldAsks = 0;
    for (let i = 0; i < n; i++) {
      const p = prices[i];
      const [ph, ps, pr] = cols[cols.length - 1];
      const buy = pr - p;
      const h = Math.max(ph, buy);
      const s = ph + p;
      const r = Math.max(pr, ps);
      const opts = ['Keep holding', 'Buy today (from rest)'];
      let predict;
      if (i >= 1 && ph !== buy && holdAsks < 2) {
        predict = ask(`Day ${i}, price ${p}: hold yesterday = ${fmt(ph)}, rest yesterday = ${fmt(pr)}. Which arrow gives today's hold?`, opts, buy > ph ? 1 : 0, `hold = max(${fmt(ph)}, ${fmt(pr)} − ${p}).`);
        holdAsks++;
      }
      snap(
        `Day ${i}, price ${p} — hold = max(keep holding ${fmt(ph)}, buy from rest ${fmt(pr)} − ${p} = ${fmt(buy)}) = ${fmt(h)} → ${buy > ph ? 'buy today' : 'keep what we hold'}.${i === 0 ? ' Buying only comes from rest, never straight from sold — that is the cooldown.' : ''}`,
        { day: i, partial: [h], active: 'hold', deps: ['hold', 'rest'], nHl: { hold: 'active', rest: 'visited' }, eHl: { 'hold>hold': ph >= buy ? 'done' : 'muted', 'rest>hold': buy > ph ? 'done' : 'muted' }, v: { day: i, price: p, hold: fmt(h) }, predict },
      );
      predict = undefined;
      if (i >= 1 && ph !== -INF && soldAsks < 1) {
        predict = pick(`Day ${i}: hold yesterday = ${ph}, price ${p}. What is sold today?`, s, [ph, p, s + 1, ph - p], i, 'sold = hold yesterday + today\'s price: the only arrow into sold is "sell".');
        if (predict) soldAsks++;
      }
      snap(
        ph === -INF
          ? `sold = hold yesterday + ${p} = −∞: there was no share to sell yet.`
          : `sold = hold yesterday + price = ${fmt(ph)} + ${p} = ${fmt(s)}. The only arrow into sold is "sell".`,
        { day: i, partial: [h, s], active: 'sold', deps: ['hold'], nHl: { sold: 'active', hold: 'visited' }, eHl: { 'hold>sold': 'done' }, v: { day: i, price: p, hold: fmt(h), sold: fmt(s) }, predict },
      );
      predict = undefined;
      const ropts = ['Wait (rest yesterday)', 'Cooldown (sold yesterday)'];
      if (i >= 1 && pr !== ps && restAsks < 2) {
        predict = ask(`rest yesterday = ${fmt(pr)}, sold yesterday = ${fmt(ps)}. Which arrow gives today's rest?`, ropts, ps > pr ? 1 : 0, 'rest = max(rest yesterday, sold yesterday): a sale yesterday finishes its cooldown today.');
        restAsks++;
      }
      snap(
        `rest = max(wait: rest yesterday ${fmt(pr)}, cooldown: sold yesterday ${fmt(ps)}) = ${fmt(r)} → ${ps > pr ? "yesterday's sale sits out its cooldown today" : 'just wait'}. Only from rest may we buy tomorrow.`,
        { day: i, partial: [h, s, r], active: 'rest', deps: ['rest', 'sold'], nHl: { rest: 'active', sold: 'visited' }, eHl: { 'rest>rest': pr >= ps ? 'done' : 'muted', 'sold>rest': ps > pr ? 'done' : 'muted' }, v: { day: i, price: p, hold: fmt(h), sold: fmt(s), rest: fmt(r) }, predict },
      );
      cols.push([h, s, r]);
    }
    const [, ls, lr] = cols[cols.length - 1];
    const ans = Math.max(ls, lr);
    snap(
      `Answer = max(sold, rest) on the last day = ${ans}. Ending in hold is never best — an unsold share is wasted money. O(n) time and O(1) extra space: only yesterday's three numbers are needed.`,
      { day: n - 1, answerRow: ls > lr ? 'sold' : 'rest', nHl: { sold: ls > lr ? 'done' : '', rest: ls > lr ? '' : 'done' }, v: { answer: ans } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ grid DP */
export const gridDp = {
  title: 'Grid DP: min path sum / unique paths',
  description:
    'Moves go only right or down, so dp[r][c] depends just on the cell above and the cell to the left — fill row by row. min-sum: dp = cell + min(top, left). count-paths: dp = top + left, obstacles (1) → 0. (≤ 5×6.)',
  defaultInput: {
    grid: [
      [1, 3, 1, 2],
      [1, 5, 1, 3],
      [4, 2, 1, 1],
    ],
    mode: 'min-sum',
  },
  fields: [
    { key: 'grid', type: 'json', label: 'grid (≤ 5×6)' },
    { key: 'mode', type: 'select', label: 'mode', options: ['min-sum', 'count-paths'] },
  ],
  testInputs: [
    { grid: [], mode: 'min-sum' },
    { grid: [[7]], mode: 'min-sum' },
    { grid: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], mode: 'count-paths' },
    { grid: [[1, 0], [0, 0]], mode: 'count-paths' },
    { grid: [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]], mode: 'count-paths' },
    { grid: [[1, 2, 3], [4, 5]], mode: 'min-sum' },
    { grid: [[0, 1], [1, 0]], mode: 'count-paths' },
  ],
  generate(input) {
    const count = input.mode === 'count-paths';
    const raw = Array.isArray(input.grid) ? input.grid.filter(Array.isArray).slice(0, 5) : [];
    const C = raw.length ? Math.min(6, Math.max(...raw.map((r) => r.length))) : 0;
    const R = C ? raw.length : 0;
    const g = Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => {
        const x = Math.round(Number(raw[r][c])) || 0;
        return count ? (x ? 1 : 0) : Math.max(-99, Math.min(99, x));
      }),
    );
    const frames = [];
    if (!R) {
      frames.push({ note: 'Empty grid — there is no start cell.', panels: [vars({ rows: 0, cols: 0 })] });
      frames.push({ note: `Nothing to fill: answer ${count ? 0 : '—'}.`, panels: [vars({ answer: count ? 0 : '—' })] });
      return frames;
    }
    const dp = grid2(R, C, null);
    const rowLabels = g.map((_, r) => `r${r}`);
    const colLabels = g[0].map((_, c) => `c${c}`);
    const show = () => dp.map((row) => row.map((v) => (v === null ? '' : fmt(v))));
    const gridStates = (hl = {}) => g.map((row, r) => row.map((v, c) => hl[`${r},${c}`] || (count && v ? 'wall' : '')));
    const dpStates = (hl = {}) => dp.map((row, r) => row.map((v, c) => hl[`${r},${c}`] || (v === null ? '' : 'visited')));
    const snap = (note, { gHl = {}, dHl = {}, v = {}, predict } = {}) => {
      const f = {
        note,
        panels: [
          { kind: 'grid', cells: g.map((row) => row.map((x) => (count ? (x ? '█' : '·') : x))), states: gridStates(gHl), label: count ? 'grid (█ = obstacle)' : 'grid (cell costs)' },
          table(show(), dpStates(dHl), rowLabels, colLabels, count ? 'dp[r][c] = number of paths to (r, c)' : 'dp[r][c] = cheapest path sum to (r, c)'),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      count
        ? `Count paths from the top-left to the bottom-right moving only right or down. Every path into (r, c) arrives from the top or the left, so dp[r][c] = dp[r−1][c] + dp[r][c−1]; an obstacle cell holds 0.`
        : `Find the cheapest top-left → bottom-right path moving only right or down. Any path into (r, c) comes from the top or the left, so dp[r][c] = grid[r][c] + min(dp[r−1][c], dp[r][c−1]).`,
      { v: { rows: R, cols: C, mode: count ? 'count-paths' : 'min-sum' } },
    );
    let asks = 0;
    let interior = 0;
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const top = r > 0 ? dp[r - 1][c] : null;
        const left = c > 0 ? dp[r][c - 1] : null;
        const key = `${r},${c}`;
        const gHl = { [key]: 'active' };
        const dHl = { [key]: 'active' };
        if (top !== null) {
          gHl[`${r - 1},${c}`] = 'visited';
          dHl[`${r - 1},${c}`] = 'visited';
        }
        if (left !== null) {
          gHl[`${r},${c - 1}`] = 'visited';
          dHl[`${r},${c - 1}`] = 'visited';
        }
        let note;
        let predict;
        if (count) {
          if (g[r][c]) {
            dp[r][c] = 0;
            gHl[key] = 'bad';
            note = `(${r}, ${c}) is an obstacle → dp = 0: no path may stand here, so it adds nothing to the cells after it.`;
          } else if (!r && !c) {
            dp[r][c] = 1;
            note = 'Start cell: exactly 1 way to be here (do nothing).';
          } else {
            const t = top ?? 0;
            const l = left ?? 0;
            dp[r][c] = t + l;
            if (top !== null) dHl[`${r - 1},${c}`] = 'done';
            if (left !== null) dHl[`${r},${c - 1}`] = 'done';
            if (top !== null && left !== null) {
              interior++;
              if (interior % 2 === 1 && asks < 4) {
                predict = pick(`Cell (${r}, ${c}): paths from the top = ${t}, from the left = ${l}. What is dp[${r}][${c}]?`, t + l, [Math.max(t, l), t * l, t + l + 1, Math.min(t, l)], asks + 1, 'The two groups of paths never overlap (the last move differs), so they add.');
                if (predict) asks++;
              }
            }
            note =
              top !== null && left !== null
                ? `(${r}, ${c}): paths arriving from the top (${t}) and from the left (${l}) are different paths → add them: ${t} + ${l} = ${dp[r][c]}.`
                : `(${r}, ${c}) is on the ${r === 0 ? 'top row: only reachable from the left' : 'left column: only reachable from above'} → ${dp[r][c]}.${dp[r][c] === 0 ? ' An obstacle earlier on this edge blocks everything after it.' : ''}`;
          }
        } else {
          const v = g[r][c];
          if (!r && !c) {
            dp[r][c] = v;
            note = `Start cell: the path must pay its cost → dp[0][0] = ${v}.`;
          } else if (top === null || left === null) {
            const from = top ?? left;
            dp[r][c] = from + v;
            dHl[top === null ? `${r},${c - 1}` : `${r - 1},${c}`] = 'done';
            note = `(${r}, ${c}) is on the ${r === 0 ? 'top row: only reachable from the left' : 'left column: only reachable from above'} → ${from} + ${v} = ${dp[r][c]}.`;
          } else {
            const fromTop = top <= left;
            dp[r][c] = Math.min(top, left) + v;
            dHl[fromTop ? `${r - 1},${c}` : `${r},${c - 1}`] = 'done';
            interior++;
            if (asks < 4) {
              if (interior % 2 === 1) predict = pick(`Cell (${r}, ${c}) costs ${v}; dp above = ${top}, dp left = ${left}. What is dp[${r}][${c}]?`, dp[r][c], [Math.max(top, left) + v, top + left + v, Math.min(top, left), dp[r][c] + 1], asks + 1, 'Take the cheaper of the two ways in, then pay this cell.');
              else if (top !== left) predict = ask(`Cell (${r}, ${c}): dp above = ${top}, dp left = ${left}. Which neighbour does the best path come from?`, ['From the top', 'From the left'], fromTop ? 0 : 1, 'The cheaper one — the cell cost is paid either way.');
              if (predict) asks++;
            }
            note = `(${r}, ${c}): best way in = min(top ${top}, left ${left}) = ${Math.min(top, left)} (from the ${top === left ? 'top — a tie' : fromTop ? 'top' : 'left'}), plus this cell's ${v} → ${dp[r][c]}.`;
          }
        }
        snap(note, { gHl, dHl, v: { cell: `(${r}, ${c})`, top: top === null ? '—' : top, left: left === null ? '—' : left, 'dp[r][c]': dp[r][c] }, predict });
      }
    const ans = dp[R - 1][C - 1];
    const gHl = {};
    const dHl = { [`${R - 1},${C - 1}`]: 'done' };
    if (!count) {
      // Walk back along the cheaper neighbour to show one optimal path.
      let r = R - 1;
      let c = C - 1;
      gHl[`${r},${c}`] = 'done';
      while (r > 0 || c > 0) {
        if (r === 0) c--;
        else if (c === 0) r--;
        else if (dp[r - 1][c] <= dp[r][c - 1]) r--;
        else c--;
        gHl[`${r},${c}`] = 'done';
        dHl[`${r},${c}`] = 'done';
      }
    } else gHl[`${R - 1},${C - 1}`] = 'done';
    snap(
      count
        ? `Answer dp[${R - 1}][${C - 1}] = ${ans} path(s). Each cell is computed once from two neighbours → O(r·c) time; keeping one row is enough for O(c) space.`
        : `Answer dp[${R - 1}][${C - 1}] = ${ans}. The highlighted path is rebuilt by walking back to the cheaper neighbour each time. O(r·c) time; one row of dp is enough for O(c) space.`,
      { gHl, dHl, v: { answer: ans } },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ Hierholzer: reconstruct itinerary */
export const hierholzerItinerary = {
  title: "Hierholzer's algorithm: reconstruct itinerary",
  description:
    'Use every ticket exactly once. Keep walking along the smallest unused ticket; when an airport has none left it is finished — pop it onto the path. The path comes out reversed. (≤ 8 airports, ≤ 12 tickets.)',
  defaultInput: {
    tickets: [
      ['JFK', 'ATL'],
      ['ATL', 'DEN'],
      ['JFK', 'SFO'],
      ['SFO', 'ORD'],
      ['ORD', 'JFK'],
    ],
    start: 'JFK',
  },
  fields: [
    { key: 'tickets', type: 'json', label: 'tickets [from, to]' },
    { key: 'start', type: 'string', label: 'start' },
  ],
  testInputs: [
    { tickets: [], start: 'JFK' },
    { tickets: [['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']], start: 'JFK' },
    { tickets: [['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']], start: 'JFK' },
    { tickets: [['MUC', 'LHR'], ['JFK', 'MUC'], ['SFO', 'SJC'], ['LHR', 'SFO']], start: 'XXX' },
    { tickets: [['A', 'B'], ['C', 'D']], start: 'A' },
    { tickets: [['A', 'A'], ['A', 'B'], ['B', 'A']], start: 'A' },
    { tickets: 'bad', start: 1 },
  ],
  generate(input) {
    const raw = Array.isArray(input.tickets) ? input.tickets : [];
    const tickets = [];
    const seen = [];
    for (const t of raw) {
      if (!Array.isArray(t) || t.length < 2) continue;
      const a = String(t[0]).trim().slice(0, 4);
      const b = String(t[1]).trim().slice(0, 4);
      if (!a || !b) continue;
      const add = [a, b].filter((x) => !seen.includes(x));
      if (seen.length + add.length > 8) continue;
      seen.push(...add);
      tickets.push([a, b]);
      if (tickets.length >= 12) break;
    }
    const nodes = [...seen].sort();
    const idx = Object.fromEntries(nodes.map((x, i) => [x, i]));
    const frames = [];
    if (!tickets.length) {
      frames.push({ note: 'No tickets — enter pairs like [["JFK", "SFO"], …].', panels: [vars({ tickets: 0 })] });
      frames.push({ note: 'With no tickets the itinerary is just the start airport.', panels: [arr([String(input.start || '—')], { label: 'itinerary' })] });
      return frames;
    }
    const outDeg = {};
    const inDeg = {};
    for (const [a, b] of tickets) {
      outDeg[a] = (outDeg[a] || 0) + 1;
      inDeg[b] = (inDeg[b] || 0) + 1;
    }
    let start = typeof input.start === 'string' ? input.start.trim() : '';
    let startWhy = '';
    if (!(start in idx) || !outDeg[start]) {
      const cand = nodes.find((x) => (outDeg[x] || 0) - (inDeg[x] || 0) === 1) || nodes.find((x) => outDeg[x]);
      startWhy = ` ("${start || '—'}" has no tickets, so start at ${cand}${(outDeg[cand] || 0) - (inDeg[cand] || 0) === 1 ? ', the airport with one more ticket out than in' : ''}.)`;
      start = cand;
    }
    // adj lists sorted DESCENDING so pop() returns the lexically smallest destination; keep ticket ids.
    const adj = Object.fromEntries(nodes.map((x) => [x, []]));
    tickets.forEach(([a, b], i) => adj[a].push([b, i]));
    for (const x of nodes) adj[x].sort((p, q) => (p[0] < q[0] ? 1 : p[0] > q[0] ? -1 : q[1] - p[1]));
    const pos = layoutCircle(nodes.length);
    const edgeState = {};
    const stk = [start];
    const path = [];
    const remaining = () => Object.fromEntries(nodes.map((x) => [x, adj[x].length ? [...adj[x]].reverse().map((e) => e[0]).join(' ') : '—']));
    const snap = (note, { justUsed, predict, final } = {}) => {
      const done = new Set(path);
      const inStack = new Set(stk);
      const top = stk[stk.length - 1];
      const f = {
        note,
        panels: [
          {
            kind: 'nodes',
            nodes: nodes.map((x, i) => ({ id: i, label: x, x: pos[i].x, y: pos[i].y, state: final ? 'done' : x === top ? 'active' : inStack.has(x) ? 'visited' : done.has(x) ? 'done' : '' })),
            edges: tickets.map(([a, b], i) => ({ from: idx[a], to: idx[b], state: i === justUsed ? 'active' : edgeState[i] || '' })),
            directed: true,
            freeLayout: true,
            label: 'tickets (solid = used)',
          },
          stack([...stk], 'stack (current walk)'),
          arr(final ? [...path].reverse() : [...path], { label: final ? 'itinerary = path reversed' : 'path (built in reverse)', highlights: final ? {} : path.length ? { [path.length - 1]: 'done' } : {} }),
          vars(remaining()),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(`Start at ${start} with the stack [${start}].${startWhy} Each airport's unused tickets are kept sorted so we always try the alphabetically smallest destination first (the side panel lists them).`);
    let pushAsks = 0;
    let popAsked = 0;
    let wasPush = true;
    while (stk.length) {
      const u = stk[stk.length - 1];
      if (adj[u].length) {
        const [v, ti] = adj[u].pop();
        let predict;
        const left = [v, ...[...adj[u]].map((e) => e[0])];
        if (pushAsks < 2 && new Set(left).size > 1) {
          predict = pick(`${u} is on top and has unused tickets to ${[...new Set(left)].sort().join(', ')}. Which ticket is used next?`, `${u} → ${v}`, [...new Set(left)].filter((x) => x !== v).map((x) => `${u} → ${x}`), pushAsks + 1, 'Always the smallest destination first — that makes the final itinerary lexically smallest.');
          if (predict) pushAsks++;
        }
        edgeState[ti] = 'done';
        stk.push(v);
        snap(`${u} still has an unused ticket → take the smallest, ${u} → ${v}, cross it off and push ${v}. We keep walking greedily; whether this was "right" does not matter yet.`, { justUsed: ti, predict });
        wasPush = true;
      } else {
        let predict;
        if (popAsked < 2 && (popAsked === 0 || wasPush)) {
          predict = ask(
            `${u} is on top and has no unused tickets left. What happens?`,
            ['Pop it and append it to the path', 'Undo the last ticket and try another', 'Stop — the itinerary is impossible'],
            0,
            'A stuck airport must be the END of whatever is left of the trip, so it goes onto the path (which is built back to front).',
          );
          popAsked++;
        }
        path.push(stk.pop());
        const next = stk[stk.length - 1];
        snap(
          `${u} has no unused tickets → it is finished: nothing can come after it, so it is the end of the remaining trip. Pop it and append to the path.${next ? ` Back to ${next}${adj[next].length ? ', which still has tickets — that detour will be spliced in before ' + u + '.' : '.'}` : ''}`,
          { predict },
        );
        wasPush = false;
      }
    }
    const ok = path.length === tickets.length + 1;
    snap(
      ok
        ? `Stack empty. Reverse the path → itinerary ${[...path].reverse().join(' → ')}. Every ticket is used exactly once; each is pushed and popped once, so O(E log E) including the sort.`
        : `Stack empty, but only ${path.length - 1} of ${tickets.length} tickets were used: these tickets do not form a single trip from ${start} (degree check fails), so no valid itinerary exists.`,
      { final: true },
    );
    return frames;
  },
};

/* ------------------------------------------------------------------ minimax: predict the winner */
export const minimaxPredictWinner = {
  title: 'Minimax: predict the winner',
  description:
    'Players take a number from either end. A node\'s value is (Player 1 − Player 2) under best play: Player 1 levels take the MAX of their children, Player 2 levels the MIN. Values flow up from the leaves. (≤ 4 numbers.)',
  defaultInput: { nums: [1, 5, 233, 7] },
  fields: [{ key: 'nums', type: 'numbers', label: 'nums (≤ 4)' }],
  testInputs: [{ nums: [] }, { nums: [4] }, { nums: [1, 5, 2] }, { nums: [3, 3] }, { nums: [2, 7, 4, 1, 9, 9] }, { nums: [-5, 10, 0] }],
  generate(input) {
    const nums = cleanInts(input.nums, 4, -99, 999);
    const n = nums.length;
    const frames = [];
    if (!n) {
      frames.push({ note: 'No numbers — nothing to take.', panels: [vars({ nums: '[]' })] });
      frames.push({ note: 'Score difference 0 → a tie, which counts as a win for Player 1.', panels: [vars({ answer: 0 })] });
      return frames;
    }
    let id = 0;
    const meta = {};
    const build = (i, j, depth) => {
      const node = { id: id++, label: '', children: [] };
      meta[node.id] = { i, j, depth, max: depth % 2 === 0, node };
      if (i < j) node.children.push(build(i + 1, j, depth + 1), build(i, j - 1, depth + 1));
      return node;
    };
    const root = build(0, n - 1, 0);
    const layout = layoutNary(root);
    const labels = Object.fromEntries(layout.nodes.map((nd) => [nd.id, meta[nd.id].i === meta[nd.id].j ? '?' : meta[nd.id].max ? 'MAX' : 'MIN']));
    const states = {};
    const edgeStates = {};
    // edge labels: the number taken on that move, signed from Player 1's point of view
    const edgeLabels = {};
    for (const nd of layout.nodes) {
      const m = meta[nd.id];
      if (m.node.children.length) {
        const sgn = m.max ? 1 : -1;
        edgeLabels[`${nd.id}-${m.node.children[0].id}`] = signed(sgn * nums[m.i]);
        edgeLabels[`${nd.id}-${m.node.children[1].id}`] = signed(sgn * nums[m.j]);
      }
    }
    const path = [];
    const snap = (note, { cur, v = {}, predict } = {}) => {
      const m = cur !== undefined ? meta[cur] : null;
      const hl = {};
      if (m) for (let k = m.i; k <= m.j; k++) hl[k] = 'active';
      const f = {
        note,
        panels: [
          {
            kind: 'nodes',
            nodes: layout.nodes.map((nd) => ({ id: nd.id, label: labels[nd.id], x: nd.x, y: nd.y, state: nd.id === cur ? 'active' : path.includes(nd.id) ? 'visited' : states[nd.id] || '' })),
            edges: layout.edges.map(([a, b]) => ({ from: a, to: b, label: edgeLabels[`${a}-${b}`], state: edgeStates[`${a}-${b}`] || '' })),
            directed: true,
            label: 'game tree (even depth = P1 MAX, odd depth = P2 MIN)',
          },
          arr([...nums], { label: 'nums (remaining range highlighted)', highlights: hl, range: m ? [m.i, m.j] : undefined }),
          vars(v),
        ],
      };
      if (predict) f.predict = predict;
      frames.push(f);
    };
    snap(
      `Each node is a game position nums[i..j]. Score = Player 1's total − Player 2's total. Player 1 (MAX) wants it high, Player 2 (MIN) wants it low. Edge labels show the number taken, signed for Player 1 (+ = P1 takes it, − = P2 takes it).`,
      { v: { players: 'P1 = MAX, P2 = MIN' } },
    );
    let asks = 0;
    const solved = new Set();
    const who = (m) => (m.max ? 'P1 (MAX)' : 'P2 (MIN)');
    const go = (node) => {
      const m = meta[node.id];
      const sgn = m.max ? 1 : -1;
      if (m.i === m.j) {
        const val = sgn * nums[m.i];
        labels[node.id] = signed(val);
        states[node.id] = 'done';
        snap(`Only nums[${m.i}] = ${nums[m.i]} is left, so ${who(m)} must take it → value ${signed(val)} (${m.max ? 'adds to' : 'subtracts from'} Player 1's lead).`, { cur: node.id, v: { turn: who(m), range: `[${m.i}..${m.j}]`, value: signed(val) } });
        return val;
      }
      path.push(node.id);
      snap(
        `${who(m)} to move on [${nums.slice(m.i, m.j + 1).join(', ')}]: try taking the left end (${nums[m.i]}) and the right end (${nums[m.j]}). Each choice hands the rest to the other player, so solve both subtrees first.`,
        { cur: node.id, v: { turn: who(m), range: `[${m.i}..${m.j}]` } },
      );
      const [lc, rc] = node.children;
      const lv = sgn * nums[m.i] + go(lc);
      const rv = sgn * nums[m.j] + go(rc);
      path.pop();
      const pickLeft = m.max ? lv >= rv : lv <= rv;
      const val = pickLeft ? lv : rv;
      const key = `${m.i},${m.j},${m.max}`;
      const repeat = solved.has(key);
      solved.add(key);
      let predict;
      if (asks < 5 && lv !== rv && !repeat) {
        predict = pick(
          `${who(m)} on [${nums.slice(m.i, m.j + 1).join(', ')}]: taking left leads to ${signed(lv)}, taking right leads to ${signed(rv)}. What value goes up?`,
          signed(val),
          [signed(m.max ? Math.min(lv, rv) : Math.max(lv, rv)), signed(lv + rv), signed(-val)],
          asks + 1,
          m.max ? 'Player 1 picks the larger score difference.' : 'Player 2 picks the smaller (most negative for Player 1).',
        );
        if (predict) asks++;
      }
      labels[node.id] = signed(val);
      states[node.id] = 'done';
      edgeStates[`${node.id}-${(pickLeft ? lc : rc).id}`] = 'done';
      edgeStates[`${node.id}-${(pickLeft ? rc : lc).id}`] = 'muted';
      snap(
        `${who(m)}: take left ${signed(sgn * nums[m.i])} → ${signed(lv)}; take right ${signed(sgn * nums[m.j])} → ${signed(rv)}. ${m.max ? 'MAX' : 'MIN'} = ${signed(val)}, so ${m.max ? 'Player 1' : 'Player 2'} takes the ${pickLeft ? 'left' : 'right'} end (${pickLeft ? nums[m.i] : nums[m.j]}).${repeat ? ' This exact position was solved before — memoising diff(i, j) would skip the whole subtree.' : ''}`,
        { cur: node.id, v: { turn: who(m), left: signed(lv), right: signed(rv), value: signed(val) }, predict },
      );
      return val;
    };
    const ans = go(root);
    snap(
      `Root value ${signed(ans)} → ${ans >= 0 ? 'Player 1 wins' : 'Player 2 wins'}${ans === 0 ? ' (a tie counts as a Player 1 win)' : ''}. Plain recursion visits 2ⁿ positions; memoising diff(i, j) leaves only n² ranges — that is interval DP. With MAX/MIN levels you can also prune: alpha-beta skips a branch once it cannot change the parent's choice.`,
      { v: { answer: signed(ans), winner: ans >= 0 ? 'Player 1' : 'Player 2' } },
    );
    return frames;
  },
};
