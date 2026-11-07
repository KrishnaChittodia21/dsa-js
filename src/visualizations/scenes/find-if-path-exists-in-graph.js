// Gold scene: Find if Path Exists in Graph (BFS or DFS). News spreads from the source to its friends; does it
// reach the destination? Works with a queue (BFS) or a stack (DFS), visited as a Set or a flag array.
import { firstInt, row, visitedSet } from './util.js';

const AT = ['u', 'node', 'cur', 'curr', 'current'];
const frontierOf = (vars) => Object.entries(vars).find(([k, v]) => /queue|^q$|stack|^st$|frontier/i.test(k) && row(v));
const adjOf = (vars) => Object.entries(vars).find(([k, v]) => /adj|graph|^g$/i.test(k) && Array.isArray(v) && v.every((r) => row(r)))?.[1];

export default {
  id: 'find-if-path-exists-in-graph',
  metaphor: 'News spreading from friend to friend',
  caption: 'Dim circles have heard the news (visited); the bright one is passing it on to its neighbours. The run ends when the destination hears it, or when nobody is left to tell.',
  narrate(ctx) {
    const [nName, , sName, dName] = ctx.params;
    const dest = ctx.vars[dName];
    const now = visitedSet(ctx.vars);
    const before = visitedSet(ctx.prev);
    const fresh = [...now].filter((x) => !before.has(x));
    const n = ctx.vars[nName];
    if (fresh.length) {
      return `${fresh.join(', ')} ${fresh.length > 1 ? 'hear' : 'hears'} the news${fresh.includes(dest) ? ' — that is the destination!' : ''} (${now.size}${Number.isInteger(n) ? ` of ${n}` : ''} reached)`;
    }
    const [atName, at] = firstInt(ctx.vars, AT);
    const f = frontierOf(ctx.vars);
    if (atName && f && at !== ctx.prev[atName]) {
      // only once a queue / stack exists: the same names are often used while building adj from the edge list
      const kind = /stack|^st$/i.test(f[0]) ? 'stack (DFS: newest first)' : 'queue (BFS: oldest first)';
      return `${atName} = ${at}: take it from the ${kind} and tell its neighbours${at === dest ? ` — ${at} is the destination` : ''}${at === ctx.vars[sName] ? ' (the source)' : ''}`;
    }
    return null;
  },
  // before a node is marked visited: who hears the news next?
  predict(ctx) {
    if (!ctx.next) return null;
    const now = visitedSet(ctx.vars);
    const fresh = [...visitedSet(ctx.next.vars)].filter((x) => !now.has(x));
    const [, at] = firstInt(ctx.vars, AT);
    const adj = adjOf(ctx.vars);
    if (fresh.length !== 1 || at === undefined || !adj?.[at]) return null;
    const wrong = [...adj[at].filter((x) => x !== fresh[0]), ...[...now].filter((x) => x !== fresh[0])].slice(0, 3);
    if (!wrong.length) return null;
    const opts = [...new Set([fresh[0], ...wrong])].sort((a, b) => a - b);
    return {
      question: `Node ${at} is passing the news on (its neighbours: ${adj[at].join(', ') || 'none'}). Who hears it next?`,
      options: opts.map(String),
      answer: opts.indexOf(fresh[0]),
      explain: `${fresh[0]} is the next neighbour of ${at} that has not heard the news yet; neighbours already visited are skipped.`,
    };
  },
  bugs: [
    {
      label: 'if instead of while: one round only',
      find: 'while (stack.length)',
      replace: 'if (stack.length)',
      explain: 'The source tells its neighbours once and the search stops: nobody passes the news further, so anything two hops away is never reached.',
    },
    {
      label: 'Store each edge one way only',
      find: 'adj[v].push(u);',
      replace: '',
      explain: 'The graph is undirected, but only u → v is stored, so the news cannot travel back along an edge and some reachable nodes are never told.',
    },
  ],
};
