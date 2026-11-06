// Reconstruct Itinerary (Hierholzer): fly on with the smallest unused ticket; an airport with no tickets left is
// final and is placed in front of everything fixed so far (the route is built back to front, then reversed).
// Works with a stack loop or recursion; tickets in a Map or an object of destination lists (sorted either way).
import { diffItems, row } from './util.js';

/** [[airport, destinations]…] of a Map / object whose values are all lists, else null */
function rowsOf(v) {
  const e = v && (v.$map || (v.$obj && Object.entries(v.$obj)));
  return Array.isArray(e) && e.length && e.every(([, r]) => Array.isArray(r)) ? e : null;
}
const adjOf = (vars, params) => Object.entries(vars).find(([k, v]) => !params.includes(k) && rowsOf(v));
const left = (rows) => rows.reduce((s, [, r]) => s + r.length, 0);

/** the ticket used between two steps: { from, to, rest } (one destination left the list of `from`) */
function ticketUsed(before, after) {
  const a = rowsOf(before);
  const b = rowsOf(after);
  if (!a || !b) return null;
  for (const [from, r] of b) {
    const old = a.find(([k]) => k === from)?.[1];
    if (!old || old.length !== r.length + 1) continue;
    const { removed } = diffItems(old, r);
    if (removed.length === 1) return { from, to: removed[0], rest: r, old };
  }
  return null;
}

/** an airport that was just finished: a list (not a parameter) that grew by one airport while no ticket was used */
function finished(now, before, params) {
  const piles = Object.values(now).flatMap((v) => (rowsOf(v) || []).map(([, r]) => JSON.stringify(r)));
  for (const [k, v] of Object.entries(now)) {
    const was = row(before[k]);
    if (params.includes(k) || !row(v) || !was || v.length !== was.length + 1) continue;
    if (/stack|^st$|trail/i.test(k) || piles.includes(JSON.stringify(v))) continue; // a pile seen again after a call
    const front = v.slice(1).every((x, i) => x === was[i]);
    if (!front && !was.every((x, i) => x === v[i])) continue; // a different list, not one more airport
    return { name: k, airport: front ? v[0] : v[v.length - 1], front, route: v };
  }
  return null;
}

const ALPHA = (a, b) => (String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0);

export default {
  id: 'reconstruct-itinerary',
  metaphor: 'Using up a pile of plane tickets',
  caption: 'Each airport holds its unused tickets. The traveller always flies the smallest one; an airport with no tickets left is final, and the route is written from the last stop backwards.',
  narrate(ctx) {
    const [tName] = ctx.params;
    if (ctx.ret && !ctx.next && Array.isArray(ctx.value)) return `the trip, in order: ${ctx.value.length > 8 ? `${ctx.value.slice(0, 8).join(' → ')} …` : ctx.value.join(' → ')}`;
    const adj = adjOf(ctx.vars, ctx.params);
    if (!adj) return null;
    const [aName, now] = adj;
    const before = ctx.prev[aName];
    const used = ticketUsed(before, now);
    if (used) return `take the ${[...used.old].sort(ALPHA)[0] === used.to ? 'smallest ' : ''}unused ticket out of ${used.from}: fly to ${used.to} (${used.rest.length} left at ${used.from})`;
    // building the piles: one destination joined an airport's list
    const b = rowsOf(before) || [];
    for (const [from, r] of rowsOf(now)) {
      const old = b.find(([k]) => k === from)?.[1] || [];
      if (r.length === old.length + 1 && Array.isArray(ctx.vars[tName])) return `ticket ${from} → ${r[r.length - 1]} goes on ${from}'s pile`;
      if (r.length === old.length && r.length > 1 && r.some((x, i) => x !== old[i]) && !diffItems(old, r).added.length) {
        const desc = r.every((x, i) => i === 0 || ALPHA(r[i - 1], x) >= 0);
        return `${from}'s tickets sorted ${desc ? 'Z→A, so pop() takes the smallest' : 'A→Z, smallest first'}: ${r.join(', ')}`;
      }
    }
    const f = finished(ctx.vars, ctx.prev, ctx.params);
    if (f) return `dead end at ${f.airport}: no tickets left, so it is final — it goes in front of everything fixed so far`;
    const rev = Object.entries(ctx.vars).find(([k, v]) => row(v) && row(ctx.prev[k]) && v.length > 1 && v.every((x, i) => x === ctx.prev[k][v.length - 1 - i]) && v.some((x, i) => x !== ctx.prev[k][i]));
    if (rev) return `flip the route (it was written from the end): ${rev[1].join(' → ')}`;
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const adj = adjOf(ctx.vars, ctx.params);
    const nextAdj = adj && ctx.next.vars[adj[0]];
    if (!adj || !nextAdj) return null;
    // which ticket is used next, when the airport has a real choice
    const used = ticketUsed(adj[1], nextAdj);
    if (used) {
      const choices = [...new Set(used.old)].sort(ALPHA);
      if (choices.length < 2) return null;
      const smallest = used.to === choices[0];
      return {
        question: `At ${used.from}, unused tickets go to ${choices.join(', ')}. Which one is flown next?`,
        options: choices.slice(0, 4).map(String),
        answer: choices.slice(0, 4).indexOf(used.to),
        explain: smallest ? `${used.to} comes first alphabetically. Even if it later turns out to be a dead end, Hierholzer just fixes it at the end of the trip.` : `This code takes ${used.to}, the ticket on top of ${used.from}'s list.`,
      };
    }
    // a dead end while tickets remain elsewhere: the step that tells Hierholzer from backtracking
    const f = finished(ctx.next.vars, ctx.vars, ctx.params);
    if (!f || ticketUsed(adj[1], nextAdj) || !left(rowsOf(nextAdj) || [])) return null;
    const opts = [`${f.airport} is final: it goes in front of everything fixed so far`, `Undo the ticket into ${f.airport} and try another one`, `Stop: the trip cannot use every ticket`];
    return {
      question: `${f.airport} has no unused tickets, but ${left(rowsOf(nextAdj))} ticket(s) are still unused elsewhere. What happens?`,
      options: opts,
      answer: 0,
      explain: `Nothing is undone: a stop with no way out must be the last one still open, so ${f.airport} is fixed and the walk goes on from the airport before it; the unused tickets become a loop spliced in earlier.`,
    };
  },
  bugs: [
    {
      label: 'Forget to reverse the route',
      find: 'return route.reverse();',
      replace: 'return route;',
      explain: 'Airports are added when they are finished, so the route is written from the last stop back to JFK; without the flip the trip comes out backwards.',
    },
    {
      label: 'Sort A→Z, then pop() the largest',
      find: 'list.sort().reverse();',
      replace: 'list.sort();',
      explain: 'pop() takes the last ticket, which is now the alphabetically largest, so the trip is valid but not the smallest one.',
    },
  ],
};
