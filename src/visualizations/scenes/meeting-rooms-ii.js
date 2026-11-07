// Meeting Rooms II: walk the start times in order. When a meeting starts, either some meeting has already ended
// (its room is free: reuse it) or every room is busy (open a new one). Works with sorted start / end arrays.
import { row, sorted } from './util.js';

const START_I = ['i', 's', 'si', 'p', 'startIdx', 'startPtr'];
const END_I = ['j', 'e', 'ei', 'q', 'k', 'endIdx', 'endPtr', 'end', 'freed'];
const ROOMS = ['rooms', 'room', 'count', 'cnt', 'used', 'res', 'ans', 'result', 'maxRooms', 'busy'];
const nums = (v) => (row(v) && v.every(Number.isInteger) ? v : null);
const arrBy = (vars, re) => Object.entries(vars).find(([k, v]) => re.test(k) && nums(v))?.[1];
const intOf = (vars, names, not) => names.find((n) => n !== not && Number.isInteger(vars[n]));

/** { starts, ends, i, j, rooms } read from the snapshot, or null */
function stateOf(vars) {
  const starts = arrBy(vars, /start|begin|^s$/i);
  const ends = arrBy(vars, /end|finish|stop|^e$/i);
  if (!starts || !ends) return null;
  const iN = intOf(vars, START_I);
  const jN = intOf(vars, END_I, iN);
  const rN = intOf(vars, ROOMS);
  return { starts, ends, i: vars[iN], j: vars[jN], jN, rooms: vars[rN], rN };
}

export default {
  id: 'meeting-rooms-ii',
  metaphor: 'Booking rooms as meetings arrive',
  caption: 'Start times are the arrivals, end times are the departures, both in order. A meeting that arrives after the earliest unfinished one has ended takes over its room; otherwise a new room opens.',
  narrate(ctx) {
    const now = stateOf(ctx.vars);
    const was = stateOf(ctx.prev);
    const ready = (st) => !!st && sorted(st.starts) && sorted(st.ends);
    if (!now) return null;
    if (!was && !ready(now)) return null;
    if (ready(now) && !ready(was)) return `start times ${now.starts.join(', ')} and end times ${now.ends.join(', ')}, each sorted on its own`;
    const at = Number.isInteger(now.i) && now.starts[now.i] !== undefined ? `the meeting starting at ${now.starts[now.i]}` : 'the next meeting';
    if (now.rN && Number.isInteger(was.rooms) && now.rooms === was.rooms + 1) {
      const earliest = Number.isInteger(now.j) ? now.ends[now.j] : undefined;
      return `${at}: ${earliest !== undefined && now.i > 0 ? `the earliest end is ${earliest}, still busy, so ` : ''}a new room opens (${now.rooms} in use)`;
    }
    if (now.jN && Number.isInteger(was.j) && now.j === was.j + 1) {
      return `${at}: the meeting ending at ${now.ends[was.j]} is over, so it takes over that room (rooms in use: ${now.rooms ?? '?'})`;
    }
    return null;
  },
  // before each arrival: reuse a room or open a new one?
  predict(ctx) {
    const nx = ctx.next && stateOf(ctx.next.vars);
    const now = stateOf(ctx.vars);
    if (!now || !nx || !now.rN || !now.jN || !Number.isInteger(nx.i) || !now.rooms) return null;
    const opened = nx.rooms === now.rooms + 1 && nx.j === now.j;
    const reused = nx.j === now.j + 1 && nx.rooms === now.rooms;
    if (!opened && !reused) return null;
    const s = nx.starts[nx.i];
    const e = now.ends[now.j];
    if (s === undefined || e === undefined) return null;
    return {
      question: `A meeting starts at ${s}. The earliest unfinished meeting ends at ${e}. Rooms in use: ${now.rooms}. What happens?`,
      options: ['Reuse the room that just freed up', 'Open a new room'],
      answer: reused ? 0 : 1,
      explain: reused ? `${s} ≥ ${e}: that meeting is over (ending at ${e} and starting at ${e} do not clash), so its room is free.` : `${s} < ${e}: even the meeting that ends first is still running, so every room is busy.`,
    };
  },
  bugs: [
    {
      label: 'Use > : a room is not free at the moment it empties',
      find: 'starts[i] >= ends[j]',
      replace: 'starts[i] > ends[j]',
      explain: '[1,5] and [5,10] can share a room, but with > the meeting starting at 5 does not see the room freed at 5 and opens a second one.',
    },
    {
      label: 'Sort end times without a comparator',
      find: 'intervals.map((m) => m[1]).sort((a, b) => a - b)',
      replace: 'intervals.map((m) => m[1]).sort()',
      explain: 'The default sort compares text, so 10 comes before 9; the "earliest end" is wrong and rooms are opened that were not needed.',
    },
  ],
};
