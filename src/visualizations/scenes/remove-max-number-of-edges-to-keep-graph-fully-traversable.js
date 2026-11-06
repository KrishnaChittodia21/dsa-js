// Remove Max Number of Edges to Keep Graph Fully Traversable (two union-finds). Alice and Bob each keep their own
// map of linked nodes. Shared roads (type 3) go first, since one of them can serve both; then Alice's (type 1)
// and Bob's (type 2). A road that links nothing new for its user is spare. Reads two union-find parent rows
// (toolkit UnionFind objects or plain rows; Alice's by a name like alice / a / 1, Bob's like bob / b / 2) and the
// road (t / u / v or an [t, u, v] edge).
import { firstInt, groupsOf, leaderOf, row } from './util.js';

const ints = (v) => row(v) && v.length > 1 && v.every(Number.isInteger);
const ufLike = (v) => ints(v) && v.some((x, i) => i > 0 && x === i);
const KEPT = ['kept', 'used', 'cnt', 'added', 'keep', 'needed', 'need', 'edgesUsed', 'taken', 'useful'];

/** [name, parent row] of every union-find in vars, in declaration order */
function ufsOf(vars, skip) {
  const out = [];
  for (const [k, v] of Object.entries(vars || {})) {
    if (skip.includes(k)) continue;
    const o = v && v.$obj;
    const f = o && ['parent', 'parents', 'par', 'root', 'p', 'fa'].find((x) => ints(o[x]));
    if (f) out.push([k, o[f]]);
    else if (/par|root|uf|dsu|alice|bob|^p[ab12]$|^fa/i.test(k) && ufLike(v)) out.push([k, v]);
  }
  return out;
}
/** { alice: [name, row], bob: [name, row] } or null */
function pairOf(vars, skip) {
  const all = ufsOf(vars, skip);
  const a = all.find(([k]) => /alice|1|^(a|pa|ufa|dsua|ua)$/i.test(k));
  const b = all.find(([k]) => /bob|2|^(b|pb|ufb|dsub|ub)$/i.test(k));
  if (a && b && a !== b) return { alice: a, bob: b };
  if (all.length === 2 && !a && !b) return { alice: all[0], bob: all[1] };
  return null;
}
/** groups of nodes 1..n (an unused slot 0 is left out) */
const groups = (p) => groupsOf(p).filter((g) => !(g.length === 1 && g[0] === 0)).length;
/** the road: [type, u, v] */
function roadOf(vars) {
  for (const k of ['edge', 'e', 'ed', 'road', 'cur']) if (row(vars[k]) && vars[k].length === 3 && vars[k].every(Number.isInteger)) return vars[k];
  const [tn, t] = firstInt(vars, ['t', 'type', 'typ', 'kind', 'k', 'tp']);
  const [, u] = firstInt(vars, ['u', 'x', 'from', 'a', 'p']);
  const [, v] = firstInt(vars, ['v', 'y', 'to', 'b', 'q']);
  return tn && [1, 2, 3].includes(t) && u !== undefined && v !== undefined ? [t, u, v] : null;
}
const same = (a, b) => !!a && !!b && a.join() === b.join();
const KIND = { 1: "Alice's road", 2: "Bob's road", 3: 'shared road' };
const unionCall = (text) => /\bunion\s*\(|\bunite\s*\(|\bjoin\s*\(|\bmerge\s*\(/i.test(text || '') && !/=>|\bfunction\b/.test(text || '');

/** index (in the input) of the first personal road the standard greedy finds spare: picks a moment to ask about */
function firstSpare(input) {
  const [n, edges] = input || [];
  if (!Number.isInteger(n) || n > 200 || !Array.isArray(edges)) return -1;
  const mk = () => Array.from({ length: n + 1 }, (_, i) => i);
  const find = (p, x) => (p[x] === x ? x : (p[x] = find(p, p[x])));
  const unite = (p, a, b) => {
    const [ra, rb] = [find(p, a), find(p, b)];
    if (ra === rb) return false;
    p[ra] = rb;
    return true;
  };
  const A = mk();
  const B = mk();
  edges.forEach((e) => e[0] === 3 && (unite(A, e[1], e[2]), unite(B, e[1], e[2])));
  return edges.findIndex((e) => (e[0] === 1 ? !unite(A, e[1], e[2]) : e[0] === 2 ? !unite(B, e[1], e[2]) : false));
}

export default {
  id: 'remove-max-number-of-edges-to-keep-graph-fully-traversable',
  metaphor: 'Alice and Bob sharing a road map',
  caption: "Two forests: Alice's groups and Bob's groups of linked nodes. Shared roads come first, since one road can serve both. A road that links nothing new for the one who may use it is spare and can be removed.",
  narrate(ctx) {
    const [nName, eName] = ctx.params;
    const n = ctx.vars[nName];
    const m = Array.isArray(ctx.vars[eName]) ? ctx.vars[eName].length : undefined;
    const two = pairOf(ctx.vars, ctx.params);
    if (ctx.ret && Number.isInteger(ctx.value)) {
      if (ctx.value === -1) {
        const left = two ? [['Alice', two.alice[1]], ['Bob', two.bob[1]]].filter(([, p]) => groups(p) > 1).map(([w, p]) => `${w} still has ${groups(p)} separate groups`) : [];
        return `${left.length ? left.join(' and ') : 'someone cannot reach every node'}: the graph cannot be fully traversed, so -1`;
      }
      return Number.isInteger(m) ? `every node is reachable for both with ${m - ctx.value} of the ${m} roads: the other ${ctx.value} can be removed` : `the run returns ${ctx.value}`;
    }
    if (!two) return null;
    const prevTwo = pairOf(ctx.prev, ctx.params);
    const [A, B] = [two.alice[1], two.bob[1]];
    if (!prevTwo) return groups(A) === groups(B) && groups(A) === (Number.isInteger(n) ? n : groups(A)) ? `Alice and Bob each start with ${groups(A)} separate nodes: each needs ${groups(A) - 1} useful roads` : null;
    const r = roadOf(ctx.vars);
    if (!r) return null;
    const [t, u, v] = r;
    const [kName, kept] = firstInt(ctx.vars, KEPT);
    const keptMore = kName && Number.isInteger(ctx.prev[kName]) && kept === ctx.prev[kName] + 1;
    const dA = prevTwo.alice[1].length === A.length && groups(A) < groups(prevTwo.alice[1]);
    const dB = prevTwo.bob[1].length === B.length && groups(B) < groups(prevTwo.bob[1]);
    const keepTxt = keptMore ? `: keep it (${kept} kept)` : '';
    if (dA && dB) return `${KIND[t] || 'road'} ${u}–${v} links new nodes for both Alice and Bob${keepTxt}`;
    if (dA || dB) {
      const who = dA ? 'Alice' : 'Bob';
      const k = groups(dA ? A : B);
      return `${KIND[t] || 'road'} ${u}–${v} links two of ${who}'s groups (${k} left for ${who})${keepTxt}`;
    }
    if (keptMore) return `keep ${KIND[t] || 'road'} ${u}–${v}: it linked something new (${kept} kept)`;
    const [sName, spare] = firstInt(ctx.vars, ['removed', 'removable', 'spare', 'extra', 'redundant', 'unused']);
    if (sName && Number.isInteger(ctx.prev[sName]) && spare === ctx.prev[sName] + 1) return `${KIND[t] || 'road'} ${u}–${v} linked nothing new: spare (${spare} can be removed so far)`;
    if (!unionCall(ctx.src)) return null;
    if (t === 1 && leaderOf(A, u) === leaderOf(A, v)) return `Alice can already get from ${u} to ${v}: this road of hers is spare, it can be removed`;
    if (t === 2 && leaderOf(B, u) === leaderOf(B, v)) return `Bob can already get from ${u} to ${v}: this road of his is spare, it can be removed`;
    // a shared road is judged on the line that tries Bob's map (the second try); the typed pass skips shared roads
    if (t === 3 && ctx.src.includes(two.bob[0]) && !/[!=]==?\s*[12]\b/.test(ctx.src) && leaderOf(A, u) === leaderOf(A, v) && leaderOf(B, u) === leaderOf(B, v)) {
      return `Alice and Bob are both already linked from ${u} to ${v}: shared road ${u}–${v} is spare`;
    }
    return null;
  },
  predict(ctx) {
    if (!ctx.next) return null;
    const [, eName] = ctx.params;
    const edges = ctx.vars[eName];
    const two = pairOf(ctx.vars, ctx.params);
    const nTwo = pairOf(ctx.next.vars, ctx.params);
    if (!two || !nTwo) return null;
    const [kName, kept] = firstInt(ctx.vars, KEPT);
    // the verdict
    if (ctx.next.ret && Number.isInteger(ctx.next.value) && Array.isArray(edges)) {
      const right = ctx.next.value;
      const wrong = [-1, kName ? edges.length - kept : undefined, kept, 0].filter((x) => Number.isInteger(x) && x !== right);
      const opts = [...new Set([right, ...wrong])].slice(0, 4).sort((a, b) => a - b);
      if (opts.length < 2) return null;
      const [ga, gb] = [groups(two.alice[1]), groups(two.bob[1])];
      return {
        question: `Every road has been tried: Alice's map has ${ga} group${ga === 1 ? '' : 's'}, Bob's ${gb}. What does the run return?`,
        options: opts.map(String),
        answer: opts.indexOf(right),
        explain: right === -1 ? 'Someone still has more than one group: some node is out of reach, so no set of roads works: -1.' : `Both maps are one group, so every road not kept is spare: the run returns ${right}.`,
      };
    }
    // a personal road: keep or spare? (the first personal road, and the first spare one)
    const r = roadOf(ctx.next.vars);
    if (!r || r[0] === 3 || same(r, roadOf(ctx.vars)) || !unionCall(ctx.lines?.[ctx.next.line - 1])) return null;
    const idx = Array.isArray(edges) ? edges.findIndex((e) => same(e, r)) : -1;
    const firstPersonal = Array.isArray(edges) ? edges.findIndex((e) => e[0] !== 3) : -1;
    if (idx < 0 || (idx !== firstPersonal && idx !== firstSpare(ctx.input))) return null;
    const [t, u, v] = r;
    const mine = t === 1 ? 'alice' : 'bob';
    const before = two[mine][1];
    const after = nTwo[mine][1];
    const [, nKept] = firstInt(ctx.next.vars, KEPT);
    const keep = groups(after) < groups(before) || (kName && nKept === kept + 1);
    const spare = !keep && groups(after) === groups(before) && leaderOf(after, u) === leaderOf(after, v);
    if (!keep && !spare) return null;
    const who = t === 1 ? 'Alice' : 'Bob';
    return {
      question: `Next: ${KIND[t]} ${u}–${v}. Keep it, or is it spare?`,
      options: [`Keep: it links two of ${who}'s groups`, `Spare: ${who} can already get from ${u} to ${v}`],
      answer: keep ? 0 : 1,
      explain: keep ? `${u} and ${v} were in different groups of ${who}'s map, so ${who} needs this road.` : `${u} and ${v} are already in one group of ${who}'s map (through shared roads or ${t === 1 ? 'her' : 'his'} own), so this road adds nothing.`,
    };
  },
  bugs: [
    {
      label: "Short-circuit Bob's union",
      find: 'const b = bob.union(u, v);',
      replace: 'const b = a || bob.union(u, v);',
      explain: "When the shared road is new for Alice, Bob's map is never updated: Bob looks cut off and the run returns -1 (or counts too few spare roads).",
    },
    {
      label: 'Expect one group with n + 1 slots',
      find: 'alice.count !== 2 || bob.count !== 2',
      replace: 'alice.count !== 1 || bob.count !== 1',
      explain: 'Slot 0 is never used, so it stays a group of its own: a fully linked map has 2 groups, and checking for 1 makes every run return -1.',
    },
  ],
};
