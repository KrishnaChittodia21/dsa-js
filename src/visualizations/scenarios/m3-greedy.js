// Greedy pattern scenes: sort-then-pick (maximum units on a truck), intervals by earliest end
// (minimum arrows), heap with regret (minimum refuelling stops), two passes (candy).
// Each generate(input) returns frames: { note, panels, predict? }.
import { layoutHeap } from '../layout.js';

const arr = (values, opts = {}) => ({ kind: 'array', values, ...opts });
const vars = (v) => ({ kind: 'vars', vars: v });
const ask = (question, options, answer, explain) => ({ question, options, answer, explain });
// Distinct options with the correct one placed at index pos % n; undefined if fewer than 2 distinct options.
const pick = (question, correct, wrong, pos = 0, explain) => {
  const c = String(correct);
  const w = [...new Set(wrong.map(String))].filter((o) => o !== c).slice(0, 3);
  if (!w.length) return undefined;
  const at = pos % (w.length + 1);
  return ask(question, [...w.slice(0, at), c, ...w.slice(at)], at, explain);
};
const int = (x, lo, hi) => Math.min(hi, Math.max(lo, Math.trunc(Number(x) || 0)));
const pairs = (xs, max, lo, hi) =>
  (Array.isArray(xs) ? xs : [])
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .slice(0, max)
    .map((p) => [int(p[0], lo, hi), int(p[1], lo, hi)]);

// ───────────────────────── 1. Sort, then pick: maximum units on a truck ─────────────────────────
export const greedyMaxUnits = {
  title: 'Sort, then pick: maximum units on a truck',
  description: 'Sort box types by units per box (largest first), then fill the truck one sweep at a time, taking min(boxes, capacity) of each. Up to 6 box types [boxes, unitsPerBox] with values 0–99; truck size 0–50.',
  defaultInput: { boxTypes: [[5, 10], [2, 5], [4, 7], [3, 9], [1, 8]], truckSize: 10 },
  fields: [
    { key: 'boxTypes', type: 'json', label: 'box types [boxes, units per box]' },
    { key: 'truckSize', type: 'number', label: 'truck size (boxes)' },
  ],
  testInputs: [
    { boxTypes: [], truckSize: 5 },
    { boxTypes: [[3, 4]], truckSize: 2 },
    { boxTypes: [[2, 5], [2, 5], [2, 5]], truckSize: 4 },
    { boxTypes: [[1, 3], [2, 2]], truckSize: 0 },
    { boxTypes: [[1, 3], [2, 2], [3, 1]], truckSize: 100 },
    { boxTypes: 'oops', truckSize: 'x' },
  ],
  generate({ boxTypes, truckSize }) {
    const types = pairs(boxTypes, 6, 0, 99).map(([count, value], id) => ({ id, count, value }));
    const cap0 = int(truckSize, 0, 50);
    const frames = [];
    const table = (list, taken, states = {}, label) => ({
      kind: 'table',
      label,
      rowLabels: list.map((t) => `type ${t.id}`),
      colLabels: ['boxes', 'units/box', 'taken'],
      cells: list.map((t) => [t.count, t.value, taken[t.id] ?? '–']),
      states: list.map((t) => [0, 1, 2].map(() => states[t.id] || '')),
    });
    frames.push({
      note: `Each box takes one slot on the truck and the truck holds ${cap0} boxes. Every slot is the same size, so the question is only which boxes fill the slots.`,
      panels: [table(types, {}, {}, 'box types (input order)'), vars({ truckSize: cap0, total: 0 })],
    });
    const sorted = types.toSorted((a, b) => b.value - a.value); // stable copy; input untouched
    let q = 0;
    const sortPredict =
      sorted.length > 1
        ? pick('We sort before picking. Which key makes "take the best first" safe?', 'Units per box, largest first', ['Number of boxes, largest first', 'Total units (boxes × units), largest first', 'Keep the input order'], 1)
        : undefined;
    frames.push({
      note: 'Sort by units per box, descending. Any slot holding a lower-value box could hold a higher-value one instead, so the best box always goes first (exchange argument).',
      panels: [table(sorted, {}, {}, 'sorted by units/box ↓'), vars({ capacity: cap0, total: 0 })],
      predict: sortPredict,
    });
    if (sortPredict) q++;
    let capacity = cap0;
    let total = 0;
    const taken = {};
    const states = {};
    for (const t of sorted) {
      if (capacity === 0) {
        const cut = sorted.filter((s) => !(s.id in taken));
        cut.forEach((s) => (states[s.id] = 'muted'));
        frames.push({
          note: `capacity = 0 → the truck is full. break: the remaining ${cut.length} type(s) have no more units per box than what we took, and there is no room anyway.`,
          panels: [table(sorted, taken, states, 'sorted by units/box ↓'), vars({ capacity, total })],
        });
        break;
      }
      const take = Math.min(t.count, capacity);
      const predict =
        q < 4
          ? pick(`capacity = ${capacity}, type ${t.id} has ${t.count} box(es) of ${t.value} units. How many boxes do we take?`, take, [t.count, capacity, 0, take + 1], q + 1)
          : undefined;
      if (predict) q++;
      capacity -= take;
      total += take * t.value;
      taken[t.id] = take;
      states[t.id] = take ? 'active' : 'muted';
      frames.push({
        note:
          take === t.count
            ? `All ${t.count} box(es) fit: take = min(${t.count}, ${capacity + take}) = ${take}. +${take} × ${t.value} = ${take * t.value} units; capacity is now ${capacity}.`
            : `Only ${take} slot(s) left: take = min(${t.count}, ${capacity + take}) = ${take}. +${take} × ${t.value} = ${take * t.value} units; the truck is now full.`,
        panels: [table(sorted, taken, states, 'sorted by units/box ↓'), vars({ capacity, total })],
        predict,
      });
      states[t.id] = take ? 'done' : 'muted';
    }
    frames.push({
      note: `Maximum units = ${total}${capacity > 0 && cap0 > 0 ? ` (${capacity} slot(s) stay empty — we ran out of boxes)` : ''}. Sorting is O(n log n) and the sweep is O(n), so O(n log n) overall.`,
      panels: [table(sorted, taken, Object.fromEntries(sorted.map((t) => [t.id, taken[t.id] ? 'done' : 'muted'])), 'result'), vars({ capacity, total })],
    });
    return frames;
  },
};

// ───────────────────────── 2. Intervals by earliest end: minimum arrows ─────────────────────────
export const greedyMinArrows = {
  title: 'Earliest end: minimum arrows to burst balloons',
  description: 'Sort balloons by end. Shoot an arrow at the end of the first balloon not yet burst; every balloon starting at or before that point bursts too (touching counts). Up to 6 balloons, values −99–99; a reversed pair [5, 2] is read as [2, 5].',
  defaultInput: { points: [[10, 16], [2, 8], [1, 6], [7, 12], [3, 4], [12, 15]] },
  fields: [{ key: 'points', type: 'json', label: 'balloons [start, end]' }],
  testInputs: [
    { points: [] },
    { points: [[1, 2]] },
    { points: [[1, 2], [1, 2], [1, 2]] },
    { points: [[1, 2], [3, 4], [5, 6], [7, 8]] },
    { points: [[1, 2], [2, 3], [3, 4], [4, 5], [9, 1], [0, 0], [6, 6], [8, 8]] },
    { points: 'oops' },
  ],
  generate({ points }) {
    const list = pairs(points, 6, -99, 99).map(([a, b]) => [Math.min(a, b), Math.max(a, b)]);
    const n = list.length;
    const min = n ? Math.min(...list.map((p) => p[0])) : 0;
    const max = n ? Math.max(Math.max(...list.map((p) => p[1])), min + 1) : 1;
    const frames = [];
    const panel = (items, label, states = []) => ({ kind: 'intervals', label, min, max, items: items.map(([start, end], k) => ({ start, end, state: states[k] || '' })) });
    frames.push({
      note: 'Each balloon spans [start, end]. An arrow shot at x bursts every balloon with start ≤ x ≤ end. Goal: the fewest arrows that burst them all.',
      panels: [panel(list, 'balloons'), vars({ n })],
    });
    const sorted = list.toSorted((a, b) => a[1] - b[1]); // earliest end first; stable on ties
    const states = sorted.map(() => '');
    frames.push({
      note: 'Sort by END. The balloon that ends first must be hit somewhere in it; shooting at its very end hits it and reaches as far right as possible.',
      panels: [panel(sorted, 'sorted by end', states), vars({ arrows: 0, arrowAt: '−∞' })],
    });
    let arrows = 0;
    let arrowAt = -Infinity;
    const shots = [];
    let q = 0;
    const NEW = 'Shoot a new arrow at its end';
    const OLD = 'Already burst by the last arrow';
    sorted.forEach(([s, e], k) => {
      const fresh = s > arrowAt; // touching counts as hit, so strictly greater needs a new arrow
      const shown = arrowAt === -Infinity ? '−∞' : arrowAt;
      let predict;
      if (k >= 1 && q < 4) {
        predict = pick(`Next balloon [${s}, ${e}]; the last arrow is at x = ${shown}. What happens?`, fresh ? NEW : OLD, [fresh ? OLD : NEW, 'Move the last arrow to x = ' + e], q);
        if (predict) q++;
      }
      if (fresh) {
        arrows++;
        arrowAt = e;
        shots.push(e);
      }
      states.forEach((st, j) => {
        if (st === 'active') states[j] = 'done';
      });
      states[k] = fresh ? 'active' : 'done';
      frames.push({
        note: fresh
          ? `${s} > ${shown} → the last arrow cannot reach it. Shoot arrow #${arrows} at x = ${e}, its end.`
          : `${s} ≤ ${shown} ≤ ${e} → the arrow at ${shown} already passes through it${s === arrowAt ? ' (touching the edge still bursts it)' : ''}. No new arrow.`,
        panels: [panel(sorted, `sorted by end · arrows at ${shots.join(', ') || '—'}`, states), vars({ arrows, arrowAt: arrowAt === -Infinity ? '−∞' : arrowAt })],
        predict,
      });
    });
    frames.push({
      note: `Minimum arrows = ${arrows}${shots.length ? ` (at x = ${shots.join(', ')})` : ''}. Same sweep as non-overlapping intervals but with > instead of >=. O(n log n) for the sort, O(n) for the pass.`,
      panels: [panel(sorted, 'all burst', sorted.map(() => 'done')), vars({ arrows })],
    });
    return frames;
  },
};

// ───────────────────────── 3. Heap with regret: minimum refuelling stops ─────────────────────────
export const greedyRefuelHeap = {
  title: 'Heap with regret: minimum refuelling stops',
  description: 'Drive as far as the fuel allows, pushing every station passed into a max-heap. When short of the target, "retroactively" stop at the biggest one passed. Up to 6 stations [position, fuel] (sorted by position), values 0–999; target 1–999.',
  defaultInput: { target: 100, startFuel: 10, stations: [[10, 60], [20, 30], [30, 30], [60, 40]] },
  fields: [
    { key: 'target', type: 'number', label: 'target' },
    { key: 'startFuel', type: 'number', label: 'start fuel' },
    { key: 'stations', type: 'json', label: 'stations [position, fuel]' },
  ],
  testInputs: [
    { target: 50, startFuel: 10, stations: [] },
    { target: 1, startFuel: 1, stations: [] },
    { target: 100, startFuel: 1, stations: [[10, 100]] },
    { target: 40, startFuel: 10, stations: [[10, 10], [20, 10], [30, 10]] },
    { target: 100, startFuel: 50, stations: [[25, 25], [50, 50]] },
    { target: 'x', startFuel: null, stations: 'oops' },
  ],
  generate({ target, startFuel, stations }) {
    const goal = int(target, 1, 999);
    const fuel0 = int(startFuel, 0, 999);
    const st = pairs(stations, 6, 0, 999).toSorted((a, b) => a[0] - b[0]);
    const frames = [];
    const status = st.map(() => 'ahead');
    const heap = []; // max-heap of { fuel, id }; ties: smaller id first, so runs are deterministic
    const better = (a, b) => a.fuel > b.fuel || (a.fuel === b.fuel && a.id < b.id);
    const push = (x) => {
      heap.push(x);
      for (let i = heap.length - 1; i > 0; ) {
        const p = (i - 1) >> 1;
        if (!better(heap[i], heap[p])) break;
        [heap[i], heap[p]] = [heap[p], heap[i]];
        i = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ; ) {
          let m = i;
          for (const c of [2 * i + 1, 2 * i + 2]) if (c < heap.length && better(heap[c], heap[m])) m = c;
          if (m === i) break;
          [heap[i], heap[m]] = [heap[m], heap[i]];
          i = m;
        }
      }
      return top;
    };
    const heapPanel = (hl = {}) => {
      const { nodes, edges } = layoutHeap(heap.map((h) => h.fuel));
      return {
        kind: 'nodes',
        label: 'max-heap: fuel of stations passed',
        nodes: nodes.map((nd) => ({ id: nd.id, label: String(nd.val), x: nd.x, y: nd.y, state: hl[nd.id] || '' })),
        edges: edges.map(([a, b]) => ({ from: a, to: b, state: '' })),
        directed: false,
      };
    };
    const STATE = { ahead: '', passed: 'visited', used: 'done', now: 'active' };
    const table = (now = -1) => ({
      kind: 'table',
      label: 'stations',
      rowLabels: st.map((_, i) => `S${i}`),
      colLabels: ['position', 'fuel', 'status'],
      cells: st.map(([p, f], i) => [p, f, status[i]]),
      states: st.map((_, i) => [0, 1, 2].map(() => STATE[i === now ? 'now' : status[i]])),
    });
    const panels = (now, hl) => [table(now), heapPanel(hl)];
    let fuel = fuel0; // the template's fuel = how far we can reach in total
    let stops = 0;
    let i = 0;
    let q = 0;
    frames.push({
      note: `Start with ${fuel0} fuel (1 fuel = 1 mile), target at ${goal}. "fuel" below means the farthest point we can reach. We do not decide at a station; we remember it.`,
      panels: [...panels(), vars({ fuel, stops, target: goal })],
    });
    let result;
    while (fuel < goal) {
      while (i < st.length && st[i][0] <= fuel) {
        const id = i++;
        status[id] = 'passed';
        push({ fuel: st[id][1], id });
        const at = heap.findIndex((h) => h.id === id);
        const predict =
          q === 0
            ? pick(`S${id} at position ${st[id][0]} is within reach ${fuel}. What do we do with it?`, 'Push its fuel into the heap and decide later', ['Stop there now and refuel', 'Skip it for good'], 0)
            : undefined;
        if (predict) q++;
        frames.push({
          note: `S${id} at position ${st[id][0]} ≤ reach ${fuel} → we drive past it. Push its ${st[id][1]} fuel into the heap; we may "take it back" later.`,
          panels: [...panels(id, { [at]: 'active' }), vars({ fuel, stops, target: goal })],
          predict,
        });
      }
      if (!heap.length) {
        result = -1;
        const predict =
          q < 4
            ? pick(`Reach ${fuel} < target ${goal}, and the heap is empty. What now?`, 'Return −1: stuck with nothing to regret', [`Drive to the next station anyway`, 'Return the stops so far'], q + 1)
            : undefined;
        if (predict) q++;
        frames.push({
          note: `Reach ${fuel} < ${goal} and no station passed is left to use${i < st.length ? ` (the next one is at ${st[i][0]}, out of reach)` : ''}. Stuck → return −1.`,
          panels: [...panels(), vars({ fuel, stops, target: goal })],
          predict,
        });
        break;
      }
      const only = heap.length === 1;
      const top = pop();
      let predict;
      if (q < 4 && only)
        predict = pick(`Reach ${fuel} < target ${goal}; the heap holds one station (S${top.id}, ${top.fuel} fuel). What now?`, `Pop it: count a stop at S${top.id}, reach ${fuel + top.fuel}`, ['Return −1', 'Drive on without stopping'], q + 1);
      else if (q < 4)
        predict = pick(`Reach ${fuel} < target ${goal}. Which passed station do we "retroactively" stop at?`, `The one with the most fuel (${top.fuel})`, ['The nearest one behind us', 'The first one we passed', 'The one with the least fuel'], q + 1);
      if (predict) q++;
      fuel += top.fuel;
      stops++;
      status[top.id] = 'used';
      frames.push({
        note: `Reach ${fuel - top.fuel} < ${goal} → we need one more stop. Pop the biggest: pretend we stopped at S${top.id} (+${top.fuel}). Reach is now ${fuel}, stops = ${stops}. No other single stop goes further.`,
        panels: [...panels(top.id), vars({ fuel, stops, target: goal })],
        predict,
      });
    }
    if (result === undefined) result = stops;
    frames.push({
      note:
        result === -1
          ? `Answer: −1, the target cannot be reached. Each station is pushed and popped at most once → O(n log n).`
          : `Reach ${fuel} ≥ ${goal} → done. Minimum stops = ${stops}. Each station is pushed and popped at most once → O(n log n).`,
      panels: [...panels(), vars({ fuel, stops, answer: result })],
    });
    return frames;
  },
};

// ───────────────────────── 4. Local rules & two passes: candy ─────────────────────────
export const greedyCandyTwoPass = {
  title: 'Two passes: candy for neighbours',
  description: 'Everyone starts with 1 candy. Left→right: beat the left neighbour. Right→left: beat the right neighbour with max(), keeping the first rule. Up to 8 ratings, values −99–99.',
  defaultInput: { ratings: [1, 0, 2, 4, 3, 2, 1] },
  fields: [{ key: 'ratings', type: 'numbers', label: 'ratings' }],
  testInputs: [{ ratings: [] }, { ratings: [5] }, { ratings: [2, 2, 2, 2] }, { ratings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, { ratings: [5, 4, 3, 2, 1] }, { ratings: 'oops' }],
  generate({ ratings }) {
    const r = (Array.isArray(ratings) ? ratings : []).slice(0, 8).map((x) => int(x, -99, 99));
    const n = r.length;
    const give = new Array(n).fill(1);
    const frames = [];
    const view = (i, j, pass, giveStates = {}) => [
      arr(r, { label: 'ratings', highlights: i >= 0 ? { [i]: 'active', [j]: 'visited' } : {} }),
      arr([...give], { label: 'candies', highlights: giveStates, pointers: i >= 0 ? [{ index: i, label: 'i', color: 'a' }] : [] }),
      vars({ pass, total: give.reduce((a, b) => a + b, 0) }),
    ];
    frames.push({
      note: 'Rule: everyone gets ≥ 1 candy, and a child rated higher than a neighbour gets more than that neighbour. Start everyone at 1, the smallest legal amount.',
      panels: view(-1, -1, 'start'),
    });
    let q = 0;
    for (let i = 1; i < n; i++) {
      const up = r[i] > r[i - 1];
      const next = up ? give[i - 1] + 1 : give[i];
      const predict =
        i >= 2 && q < 2
          ? pick(`Left pass, i = ${i}: rating ${r[i]} vs left ${r[i - 1]} (left has ${give[i - 1]} candies). What is candies[${i}]?`, next, [give[i - 1] + 1, give[i], give[i - 1] + 2], q + 1)
          : undefined;
      if (predict) q++;
      give[i] = next;
      frames.push({
        note: up
          ? `${r[i]} > ${r[i - 1]} → must beat the left neighbour: candies[${i}] = ${give[i - 1]} + 1 = ${give[i]}.`
          : `${r[i]} ≤ ${r[i - 1]} → no rule from the left; keep ${give[i]}.`,
        panels: view(i, i - 1, 'left → right', { [i]: up ? 'active' : 'muted' }),
        predict,
      });
    }
    if (n > 1) frames.push({ note: 'Left pass done: every child beats a lower-rated LEFT neighbour. Right neighbours are not checked yet, so walk back from the end.', panels: view(-1, -1, 'left → right done') });
    for (let i = n - 2; i >= 0; i--) {
      const up = r[i] > r[i + 1];
      const before = give[i];
      const next = up ? Math.max(before, give[i + 1] + 1) : before;
      const predict =
        q < 4 && up
          ? pick(`Right pass, i = ${i}: rating ${r[i]} > right ${r[i + 1]} (right has ${give[i + 1]}); candies[${i}] is ${before}. New value?`, next, [give[i + 1] + 1, before, give[i + 1] + 2, before + 1], q + 1)
          : undefined;
      if (predict) q++;
      give[i] = next;
      frames.push({
        note: !up
          ? `${r[i]} ≤ ${r[i + 1]} → no rule from the right; keep ${before}.`
          : next === before
            ? `${r[i]} > ${r[i + 1]}, but ${before} already beats ${give[i + 1]} → max(${before}, ${give[i + 1] + 1}) = ${before}. Keep it; lowering it would break the left rule.`
            : `${r[i]} > ${r[i + 1]} → max(${before}, ${give[i + 1]} + 1) = ${next}. max() keeps the left-pass rule true too.`,
        panels: view(i, i + 1, 'right → left', { [i]: up ? 'active' : 'muted' }),
        predict,
      });
    }
    const total = give.reduce((a, b) => a + b, 0);
    frames.push({
      note: `Minimum candies = ${total}. Each child holds the smallest amount that satisfies both sides, so no total can be lower. Two O(n) passes, O(n) extra space.`,
      panels: [arr(r, { label: 'ratings' }), arr([...give], { label: 'candies', highlights: Object.fromEntries(give.map((_, k) => [k, 'done'])) }), vars({ total })],
    });
    return frames;
  },
};
