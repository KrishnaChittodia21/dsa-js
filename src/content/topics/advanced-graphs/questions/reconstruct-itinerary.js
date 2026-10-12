export default {
  id: 'reconstruct-itinerary',
  title: 'Reconstruct Itinerary',
  difficulty: 'Hard',
  order: 2,
  pattern: 'adv-graph-euler-hierholzer',
  tags: ['graph', 'eulerian path', 'hierholzer', 'dfs'],
  source: { platform: 'LeetCode', number: 332, url: 'https://leetcode.com/problems/reconstruct-itinerary/' },

  statement: `You are given a list of airline tickets, each \`[from, to]\` (three-letter airport codes). All tickets belong to one traveller who starts at \`"JFK"\`.

Rebuild the trip: return the sequence of airports visited that **uses every ticket exactly once**. If several valid itineraries exist, return the one that is **smallest in lexical order** when read as a list of strings (compare airport by airport).

At least one valid itinerary is guaranteed.`,
  examples: [
    { input: 'tickets = [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]', output: '["JFK","MUC","LHR","SFO","SJC"]' },
    { input: 'tickets = [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]', output: '["JFK","ATL","JFK","SFO","ATL","SFO"]', explanation: '["JFK","SFO","ATL","JFK","ATL","SFO"] is also valid but lexically larger.' },
    { input: 'tickets = [["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]]', output: '["JFK","NRT","JFK","KUL"]', explanation: 'Greedy "smallest first" would fly to KUL and get stuck.' },
  ],
  constraints: ['1 <= tickets.length <= 300', 'from.length == to.length == 3, uppercase letters', 'from !== to', 'A valid itinerary exists'],

  think: `- Are tickets nodes or edges? What is it called to use every edge exactly once?
- Greedy "always take the smallest destination" can get stuck (example 3). What should happen to the airport where you get stuck?
- How do you get the smallest remaining destination in O(1)?`,
  patternChallenge: {
    options: ['Eulerian path — Hierholzer with sorted adjacency', 'Topological sort', 'Dijkstra', 'Backtracking over all ticket orders (only viable approach)'],
    answer: 0,
    explanation: '"Use all tickets exactly once" = Eulerian path. Hierholzer builds it in O(E log E) including the sort. Itineraries can revisit airports (cycles), so topological sort is out; nothing is weighted, so Dijkstra is irrelevant. Backtracking works for 300 tickets in practice but is exponential in the worst case.',
  },
  hints: [
    'Build `from → [destinations]` and sort each list in DESCENDING order so `pop()` gives the smallest destination.',
    'Stack-based Hierholzer: while the top airport has tickets left, push the next destination; otherwise pop it into the route. Reverse the route at the end.',
  ],
  approach: `**Backtracking:** try destinations in sorted order, undo when stuck — correct (first complete path is lexically smallest) but exponential in the worst case.

**Hierholzer:**
1. Adjacency \`Map<airport, string[]>\`, each list sorted descending.
2. \`stack = ["JFK"]\`, \`route = []\`.
3. Loop: look at the top airport. If it still has tickets, pop its smallest destination and push it. Otherwise it is a dead end — it must come *last* among the remaining airports — so pop it into \`route\`.
4. \`route.reverse()\` is the itinerary.

**Why lexical order survives:** at every airport we try the smallest ticket first. If that branch dead-ends early, it is written at the *end* of the route and the remaining (larger) options are spliced *before* it — which is exactly what the smallest valid itinerary looks like.`,

  functionName: 'findItinerary',
  paramNames: ['tickets'],
  starterCode: `/**
 * @param {string[][]} tickets
 * @return {string[]}
 */
function findItinerary(tickets) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'A single chain of flights: follow it from JFK.', args: [[['MUC', 'LHR'], ['JFK', 'MUC'], ['SFO', 'SJC'], ['LHR', 'SFO']]], expected: ['JFK', 'MUC', 'LHR', 'SFO', 'SJC'] },
    { scenario: 'Example 2', hint: 'Two valid itineraries; pick the lexically smaller one (ATL before SFO at the first choice).', args: [[['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']]], expected: ['JFK', 'ATL', 'JFK', 'SFO', 'ATL', 'SFO'] },
    { scenario: 'Example 3', hint: 'Greedy smallest-first flies to KUL and gets stuck. Append airports when you LEAVE them (post-order), then reverse.', args: [[['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']]], expected: ['JFK', 'NRT', 'JFK', 'KUL'] },
    { scenario: 'Single ticket', hint: 'One ticket: the itinerary has two airports.', args: [[['JFK', 'AAA']]], expected: ['JFK', 'AAA'] },
    { scenario: 'Duplicate tickets', hint: 'The same ticket JFK → AAA appears twice and both must be used.', args: [[['JFK', 'AAA'], ['AAA', 'JFK'], ['JFK', 'AAA']]], expected: ['JFK', 'AAA', 'JFK', 'AAA'] },
    { scenario: 'Two round trips', hint: 'Go to AAA and back first (smaller), then BBB and back.', args: [[['JFK', 'BBB'], ['BBB', 'JFK'], ['JFK', 'AAA'], ['AAA', 'JFK']]], expected: ['JFK', 'AAA', 'JFK', 'BBB', 'JFK'] },
    { scenario: 'Revisited airports', hint: 'ANU and TIA are visited several times; every ticket is used exactly once.', args: [[['EZE', 'AXA'], ['TIA', 'ANU'], ['ANU', 'JFK'], ['JFK', 'ANU'], ['ANU', 'EZE'], ['TIA', 'ANU'], ['AXA', 'TIA'], ['TIA', 'JFK'], ['ANU', 'TIA'], ['JFK', 'TIA']]], expected: ['JFK', 'ANU', 'EZE', 'AXA', 'TIA', 'ANU', 'JFK', 'TIA', 'ANU', 'TIA', 'JFK'] },
    { scenario: 'Dead end must come last', hint: 'ZZZ is a dead end; the duplicated ATL round trips must be used before it.', args: [[['JFK', 'ATL'], ['ATL', 'JFK'], ['JFK', 'ATL'], ['ATL', 'JFK'], ['JFK', 'ZZZ']]], expected: ['JFK', 'ATL', 'JFK', 'ATL', 'JFK', 'ZZZ'] },
    { scenario: 'Smallest first option is a dead end', hint: 'From JFK, AAA is alphabetically first but a dead end — it must be the final flight, after the BBB loop.', args: [[['JFK', 'AAA'], ['JFK', 'BBB'], ['BBB', 'CCC'], ['BBB', 'JFK'], ['CCC', 'BBB']]], expected: ['JFK', 'BBB', 'CCC', 'BBB', 'JFK', 'AAA'] },
    { scenario: 'Trip ends away from JFK', hint: 'The traveller never returns; the last airport has an unused out-degree of zero. Do not forget to reverse the post-order.', args: [[['JFK', 'AAA'], ['AAA', 'BBB'], ['BBB', 'AAA'], ['AAA', 'CCC']]], expected: ['JFK', 'AAA', 'BBB', 'AAA', 'CCC'] },
    { scenario: 'Max tickets, few airports', hint: '300 tickets among 5 airports with many duplicates: removing tickets by value with splice is slow and error-prone.', argsGen: '() => { let s = 5; const r = () => (s = (s * 48271) % 2147483647); const A = Array.from({ length: 5 }, (_, i) => String.fromCharCode(65 + (i % 26), 65 + Math.floor(i / 26) % 26, 75)); A[0] = "JFK"; const t = []; let u = "JFK"; for (let k = 0; k < 300; k++) { let v; do { v = A[r() % A.length]; } while (v === u); t.push([u, v]); u = v; } for (let i = t.length - 1; i > 0; i--) { const j = r() % (i + 1); [t[i], t[j]] = [t[j], t[i]]; } return [t]; }', expected: ['JFK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'CAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'DAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'BAK', 'EAK', 'CAK', 'DAK', 'BAK', 'EAK', 'CAK', 'DAK', 'BAK', 'EAK', 'CAK', 'DAK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'BAK', 'JFK', 'CAK', 'DAK', 'BAK', 'JFK', 'CAK', 'DAK', 'BAK', 'JFK', 'CAK', 'DAK', 'BAK', 'JFK', 'CAK', 'DAK', 'BAK', 'JFK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'DAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'CAK', 'EAK', 'DAK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'CAK', 'JFK', 'DAK', 'CAK', 'JFK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'EAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'DAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK', 'JFK', 'EAK'] },
    { scenario: 'Max tickets, many airports', hint: '300 tickets over 60 airports in a random walk from JFK.', argsGen: '() => { let s = 9; const r = () => (s = (s * 48271) % 2147483647); const A = Array.from({ length: 60 }, (_, i) => String.fromCharCode(65 + (i % 26), 65 + Math.floor(i / 26) % 26, 75)); A[0] = "JFK"; const t = []; let u = "JFK"; for (let k = 0; k < 300; k++) { let v; do { v = A[r() % A.length]; } while (v === u); t.push([u, v]); u = v; } for (let i = t.length - 1; i > 0; i--) { const j = r() % (i + 1); [t[i], t[j]] = [t[j], t[i]]; } return [t]; }', expected: ['JFK', 'NBK', 'CBK', 'ECK', 'HAK', 'BAK', 'ACK', 'CBK', 'FAK', 'DCK', 'DAK', 'ACK', 'PBK', 'CBK', 'GBK', 'DAK', 'CAK', 'BCK', 'JFK', 'RAK', 'DBK', 'OAK', 'EAK', 'CAK', 'CBK', 'IAK', 'DAK', 'CAK', 'FBK', 'ACK', 'RAK', 'HAK', 'MBK', 'DAK', 'GBK', 'JBK', 'BAK', 'BBK', 'WAK', 'ACK', 'RAK', 'JFK', 'SBK', 'CAK', 'GAK', 'CBK', 'IAK', 'DCK', 'EBK', 'CCK', 'BAK', 'BCK', 'RBK', 'BAK', 'FAK', 'ECK', 'IAK', 'LBK', 'CBK', 'LBK', 'EBK', 'DCK', 'IBK', 'FCK', 'CBK', 'SBK', 'JAK', 'JBK', 'SBK', 'JAK', 'SBK', 'JBK', 'UBK', 'BCK', 'UBK', 'KBK', 'ACK', 'SAK', 'OBK', 'BCK', 'VAK', 'HBK', 'EBK', 'LBK', 'ECK', 'JBK', 'WAK', 'LAK', 'FAK', 'GCK', 'IBK', 'GBK', 'KAK', 'CCK', 'IBK', 'JBK', 'YBK', 'DAK', 'GBK', 'NAK', 'EAK', 'CBK', 'SBK', 'RAK', 'KAK', 'QAK', 'CCK', 'MAK', 'GBK', 'WAK', 'XAK', 'BBK', 'XBK', 'BAK', 'PAK', 'ACK', 'XAK', 'EAK', 'CCK', 'UBK', 'LAK', 'HBK', 'KBK', 'BCK', 'XBK', 'FBK', 'CAK', 'UAK', 'PBK', 'LBK', 'FBK', 'DCK', 'LAK', 'PBK', 'MAK', 'LAK', 'QBK', 'DCK', 'TAK', 'GAK', 'EBK', 'QBK', 'FBK', 'EBK', 'QBK', 'GBK', 'WAK', 'XAK', 'GBK', 'WBK', 'CAK', 'UBK', 'OBK', 'DAK', 'OAK', 'FBK', 'OAK', 'HBK', 'MBK', 'EAK', 'EBK', 'SBK', 'UAK', 'TBK', 'CBK', 'TBK', 'FBK', 'XBK', 'HAK', 'PAK', 'GAK', 'LAK', 'RAK', 'LAK', 'TAK', 'IBK', 'LBK', 'KBK', 'MBK', 'ECK', 'PAK', 'IBK', 'QAK', 'GAK', 'RBK', 'FCK', 'ECK', 'PBK', 'OBK', 'DCK', 'TBK', 'IBK', 'QAK', 'HAK', 'RBK', 'LBK', 'MBK', 'GCK', 'QAK', 'HCK', 'PBK', 'QBK', 'GBK', 'XAK', 'LAK', 'ZBK', 'BAK', 'YBK', 'EBK', 'TAK', 'LBK', 'NAK', 'UAK', 'ZBK', 'HAK', 'RBK', 'MAK', 'MBK', 'LBK', 'QAK', 'TBK', 'NBK', 'CBK', 'VBK', 'DCK', 'VAK', 'LBK', 'QBK', 'LBK', 'YBK', 'ECK', 'TBK', 'QBK', 'PBK', 'YAK', 'EAK', 'OBK', 'DCK', 'VAK', 'MBK', 'QAK', 'XAK', 'ZAK', 'CBK', 'ZBK', 'HBK', 'NBK', 'FAK', 'YBK', 'KAK', 'TBK', 'RBK', 'NBK', 'GAK', 'TAK', 'SBK', 'WBK', 'DAK', 'SBK', 'YBK', 'KBK', 'OBK', 'NBK', 'VBK', 'EAK', 'YAK', 'ECK', 'VBK', 'SAK', 'XBK', 'IBK', 'RAK', 'LBK', 'ZAK', 'EAK', 'YBK', 'OAK', 'QBK', 'WAK', 'XBK', 'KBK', 'YBK', 'TBK', 'TAK', 'XBK', 'MBK', 'UBK', 'ZBK', 'IBK', 'YAK', 'HBK', 'RAK', 'TBK', 'WBK', 'YAK', 'ZAK', 'FCK', 'NBK', 'OBK', 'SBK', 'UAK'] },
  ],

  solution: {
    code: `function findItinerary(tickets) {
  const adj = new Map();
  for (const [from, to] of tickets) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push(to);
  }
  // Descending order → pop() returns the lexically smallest destination in O(1)
  for (const list of adj.values()) list.sort().reverse();

  const stack = ['JFK'];
  const route = [];
  while (stack.length) {
    const top = stack[stack.length - 1];
    const out = adj.get(top);
    if (out && out.length) {
      stack.push(out.pop());      // use one ticket
    } else {
      route.push(stack.pop());    // dead end: this airport is fixed at the end
    }
  }
  return route.reverse();
}`,
    explanation: 'Each ticket is pushed once and each airport occurrence popped once. Default `sort()` is lexicographic, which is exactly the order we want for strings.',
  },
  dryRun: {
    columns: ['stack', 'action', 'route'],
    rows: [
      ['[JFK]', 'JFK has KUL, NRT → push KUL (smallest)', '[]'],
      ['[JFK, KUL]', 'KUL has nothing → pop', '[KUL]'],
      ['[JFK]', 'push NRT', '[KUL]'],
      ['[JFK, NRT]', 'push JFK', '[KUL]'],
      ['[JFK, NRT, JFK]', 'no tickets → pop', '[KUL, JFK]'],
      ['[JFK, NRT]', 'pop', '[KUL, JFK, NRT]'],
      ['[JFK]', 'pop', '[KUL, JFK, NRT, JFK]'],
      ['—', 'reverse', '[JFK, NRT, JFK, KUL]'],
    ],
  },
  complexity: { time: 'O(E log E)', space: 'O(E)', explanation: 'Sorting the adjacency lists dominates; the Hierholzer loop itself is O(E). Stack, route and adjacency hold O(E) strings.' },
  alternative: {
    title: 'Backtracking DFS',
    md: 'Sort destinations; DFS trying each unused ticket in order; stop at the first path of length E + 1. Easier to invent on the spot, but can backtrack exponentially on adversarial inputs.',
    complexity: 'Exponential worst case, O(E) space',
  },
  mistakes: [
    'Appending airports when you ENTER them (pre-order) — example 3 then returns JFK, KUL, … and gets stuck.',
    'Using `shift()` to take the smallest destination — O(d) per call.',
    'Forgetting `reverse()` at the end.',
    'Removing tickets by value from an array with splice — O(d) and error-prone with duplicate tickets.',
  ],
};
