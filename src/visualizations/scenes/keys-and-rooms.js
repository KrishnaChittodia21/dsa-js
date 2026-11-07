// Keys and Rooms. Every room you enter hands you the keys lying inside; a key opens one room, once. The rooms
// form a one-way graph (a key in room 2 to room 0 does not open room 2 from room 0). Works with a stack (DFS),
// a queue (BFS) or recursion, and an opened flag array or Set.
import { firstInt, itemsOf, row } from './util.js';

const OPEN = /visited|seen|^vis$|open|unlock|been|done/i;
const ROOM = ['room', 'cur', 'curr', 'current', 'u', 'node', 'at', 'idx'];
const KEY = ['key', 'k', 'nxt', 'v', 'nei', 'door', 'next'];

function openOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!OPEN.test(k)) continue;
    if (v && v.$set) return new Set(v.$set);
    if (row(v)) return new Set(v.map((x, i) => (x && x !== -1 ? i : -1)).filter((i) => i >= 0));
  }
  return null;
}
function frontierOf(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    if (!/stack|queue|^q$|^st$|todo|frontier|keys/i.test(k)) continue;
    const items = itemsOf(v);
    if (row(items)) return { name: k, items, kind: /stack|^st$/i.test(k) ? 'stack' : 'queue' };
  }
  return null;
}
const list = (a) => a.join(', ');

export default {
  id: 'keys-and-rooms',
  metaphor: 'Locked rooms with keys inside',
  caption: 'Room 0 is open. Walking into a room hands you its keys; each new key unlocks one more room to explore. Keys only open doors one way.',
  narrate(ctx) {
    const rooms = ctx.vars[ctx.params[0]];
    if (!Array.isArray(rooms) || !rooms.every((r) => row(r))) return null;
    const n = rooms.length;
    const open = openOf(ctx.vars);
    if (ctx.ret && typeof ctx.value === 'boolean' && !ctx.next) {
      const shut = open ? [...Array(n).keys()].filter((i) => !open.has(i)) : [];
      if (ctx.value) return `all ${n} rooms were opened → true`;
      return shut.length ? `room${shut.length > 1 ? 's' : ''} ${list(shut)} stay${shut.length > 1 ? '' : 's'} locked: no room you can reach holds ${shut.length > 1 ? 'their keys' : 'its key'} → false` : 'some room stays locked → false';
    }
    const [roomName, room] = firstInt(ctx.vars, ROOM);
    const [keyName, key] = firstInt(ctx.vars, KEY);
    const before = openOf(ctx.prev);
    if (open && before) {
      const fresh = [...open].filter((x) => !before.has(x));
      if (fresh.length === 1) {
        const x = fresh[0];
        if (open.size === 1) return `room ${x} starts open: begin there`;
        const from = roomName && rooms[room]?.includes(x) && room !== x ? `room ${room} holds the key to room ${x}: ` : '';
        return `${from}room ${x} is unlocked (${open.size} of ${n} open)`;
      }
    }
    if (roomName && room !== ctx.prev[roomName] && rooms[room]) {
      const f = frontierOf(ctx.vars);
      const how = f ? ` (taken from the ${f.kind}: ${f.kind === 'stack' ? 'newest key first' : 'oldest key first'})` : '';
      return `walk into room ${room}${how}: it holds ${rooms[room].length ? `key${rooms[room].length > 1 ? 's' : ''} ${list(rooms[room])}` : 'no keys'}`;
    }
    if (open && keyName && key !== ctx.prev[keyName] && open.has(key) && !(before && !before.has(key))) return `key ${key}: room ${key} is already open, skip it`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const rooms = ctx.vars[ctx.params[0]];
    if (!Array.isArray(rooms)) return null;
    // the verdict: nothing left to explore
    if (ctx.next.ret && typeof ctx.next.value === 'boolean') {
      const yes = ctx.next.value;
      const open = openOf(ctx.vars);
      const shut = open ? [...Array(rooms.length).keys()].filter((i) => !open.has(i)) : [];
      if (!open || (!yes && !shut.length)) return null;
      return {
        question: `No keys are left to try. Can you visit all ${rooms.length} rooms?`,
        options: ['Yes: every room was opened', 'No: some room stays locked'],
        answer: yes ? 0 : 1,
        explain: yes ? 'Every room was unlocked by a key found in a room you could already reach.' : `Room${shut.length > 1 ? 's' : ''} ${list(shut)} never got a key from any reachable room.`,
      };
    }
    // which room is entered next? (only when the stack / queue gives a real choice)
    const [roomName, room] = firstInt(ctx.next.vars, ROOM);
    const f = frontierOf(ctx.vars);
    if (!roomName || !f || roomName in ctx.vars && ctx.vars[roomName] === room) return null;
    const waiting = [...new Set(f.items)];
    if (waiting.length < 2 || !waiting.includes(room)) return null;
    const opts = waiting.slice(-4).includes(room) ? waiting.slice(-4) : [room, ...waiting.filter((x) => x !== room).slice(0, 3)];
    opts.sort((a, b) => a - b);
    return {
      question: `Rooms waiting in the ${f.kind}: ${list(f.items)}. Which room do you walk into next?`,
      options: opts.map((x) => `Room ${x}`),
      answer: opts.indexOf(room),
      explain: f.kind === 'stack' ? `A stack hands back the key found last: room ${room} (depth first).` : `A queue hands back the key found first: room ${room} (breadth first).`,
    };
  },
  bugs: [
    {
      label: 'Room 0 not marked open',
      find: 'visited[0] = 1;',
      replace: '',
      explain: 'Room 0 is where you start. If it is not marked, a key back to room 0 counts it a second time, and the count can reach n while a room is still locked.',
    },
    {
      label: 'if instead of while: one room only',
      find: 'while (stack.length)',
      replace: 'if (stack.length)',
      explain: 'Only room 0 is entered. Keys found there unlock rooms, but nobody walks into them, so their keys are never picked up.',
    },
  ],
};
