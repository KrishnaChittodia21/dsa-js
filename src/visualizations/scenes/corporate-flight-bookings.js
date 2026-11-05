// Corporate Flight Bookings (difference array). Instead of writing seats on every flight of a booking, chalk two
// marks on a row of slots: +seats where the block starts, −seats right after it ends. One walk adding up the marks
// gives every flight's total. Reads marks from any changed number array and matches them to a booking by value,
// so it does not depend on the learner's names.
import { firstInt, options, row } from './util.js';

const RUN = ['running', 'run', 'sum', 'cur', 'curr', 'acc', 'total', 'prefix', 'pre', 'current'];

// long arrays are snapshotted as { $array: first 64, $length }
const cells = (v) => row(v) || (v && Array.isArray(v.$array) ? row(v.$array) : null);

/** [name, slot, old, new] of the one cell that changed in a non-parameter number array */
function oneWrite(ctx, now, before) {
  for (const [k, v] of Object.entries(now)) {
    if (ctx.params.includes(k)) continue;
    const a = cells(v);
    const b = cells(before[k]);
    if (!a || !b || a.length !== b.length) continue;
    const d = a.map((x, i) => (x === b[i] ? -1 : i)).filter((i) => i >= 0);
    if (d.length === 1 && Number.isInteger(a[d[0]])) return [k, d[0], b[d[0]] ?? 0, a[d[0]]];
  }
  return null;
}

/** the booking [first, last, seats] a mark of `delta` at `slot` belongs to (0- or 1-based slots), if only one fits */
function bookingFor(bookings, slot, delta) {
  if (!Array.isArray(bookings)) return null;
  const fits = bookings.filter((e) => row(e) && e.length === 3 && e[2] === Math.abs(delta) && (delta > 0 ? slot === e[0] - 1 || slot === e[0] : slot === e[1] || slot === e[1] + 1));
  const keys = new Set(fits.map((e) => e.join()));
  return keys.size === 1 ? fits[0] : null;
}

export default {
  id: 'corporate-flight-bookings',
  metaphor: 'Start and stop marks on a row of flights',
  caption: 'A booking chalks +seats on the slot where its flights start and −seats on the slot right after its last flight. Walking left to right and adding up the marks gives each flight its total.',
  narrate(ctx) {
    const [bName, nName] = ctx.params;
    const bookings = ctx.vars[bName];
    const n = ctx.vars[nName];
    const w = oneWrite(ctx, ctx.vars, ctx.prev);
    if (!w) {
      const [rName, run] = firstInt(ctx.vars, RUN);
      const [iName, i] = firstInt(ctx.vars, ['i', 'j', 'k', 'idx', 'f', 'flight']);
      if (rName && rName in ctx.prev && (run !== ctx.prev[rName] || (iName && i !== ctx.prev[iName]))) return `walking on${iName ? ` to slot ${i}` : ''}: the marks add up to ${run} seats so far`;
      return null;
    }
    const [arr, slot, old, now] = w;
    const a = ctx.vars[arr];
    const [, run] = firstInt(ctx.vars, RUN);
    // answer pass: a slot gets the running total
    if ((old === null || old === 0) && Number.isInteger(run) && now === run) return `flight ${slot + 1} carries ${now} seats (all marks up to here added up)`;
    // in-place prefix pass: this slot's marks plus the total of the slot before
    if (slot > 0 && now === old + a[slot - 1] && !bookingFor(bookings, slot, now - old)) return `slot ${slot}: its own mark ${old} + the ${a[slot - 1]} seats carried from slot ${slot - 1} = ${now} seats`;
    const delta = now - (old ?? 0);
    const bk = bookingFor(bookings, slot, delta);
    if (!bk) return delta > 0 ? `+${delta} chalked on slot ${slot}` : `${delta} chalked on slot ${slot}`;
    const [f, l, s] = bk;
    if (delta > 0) return `booking ${f === l ? `flight ${f}` : `flights ${f}–${l}`}, ${s} seats: chalk +${s} on slot ${slot}, where flight ${f} starts`;
    return `…and −${s} on slot ${slot}, right after flight ${l}${Number.isInteger(n) && l === n ? ' (the spare slot past the last flight)' : ''}: the seats stop there`;
  },
  // before a mark is chalked: on which slot? (the first +mark, then the −marks: the classic off-by-one)
  predict(ctx) {
    if (!ctx.next) return null;
    const [bName, nName] = ctx.params;
    const bookings = ctx.vars[bName];
    const n = ctx.vars[nName];
    const w = oneWrite(ctx, ctx.next.vars, ctx.vars);
    if (!w) return null;
    const [arr, slot, old, now] = w;
    const delta = now - (old ?? 0);
    const bk = bookingFor(bookings, slot, delta);
    if (!bk) return null;
    const [, run] = firstInt(ctx.next.vars, RUN);
    if (run === now) return null; // the answer pass, not a mark
    const [f, l, s] = bk;
    const blank = (cells(ctx.vars[arr]) || []).every((x) => !x);
    if (delta > 0 && blank) {
      return options(`Booking [${f}, ${l}, ${s}]: on which slot of ${arr} does the +${s} mark go?`, slot, [f - 1, f, f + 1, l].filter((x) => x !== slot && x >= 0), `Flight ${f} is the first one booked. ${slot === f - 1 ? `Flights are numbered from 1 but slots from 0, so flight ${f} is slot ${f - 1}.` : `This array keeps flight ${f} in slot ${f}.`}`);
    }
    if (delta < 0 && !blank) {
      return options(`Booking [${f}, ${l}, ${s}] ends at flight ${l}. On which slot does the −${s} mark go?`, slot, [l - 1, l, l + 1, f].filter((x) => x !== slot && x >= 0), `The seats must still count on flight ${l}, so they stop on the slot right after it: slot ${slot}${Number.isInteger(n) && l === n ? ', the spare slot past the last flight' : ''}.`);
    }
    return null;
  },
  bugs: [
    {
      label: 'End mark one flight early',
      find: 'diff[last] -= seats',
      replace: 'diff[last - 1] -= seats',
      explain: 'The −seats lands on the last booked flight itself, so that flight loses the seats: booking [1, 2, 10] only counts on flight 1.',
    },
    {
      label: 'Forget that flights start at 1',
      find: 'diff[first - 1] += seats',
      replace: 'diff[first] += seats',
      explain: 'The +seats lands one slot to the right, so the first booked flight never gets its seats.',
    },
  ],
};
