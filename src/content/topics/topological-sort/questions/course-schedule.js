export default {
  id: 'course-schedule',
  title: 'Course Schedule',
  difficulty: 'Medium',
  order: 1,
  pattern: 'topo-kahn-indegree',
  tags: ['graph', 'topological sort', 'cycle detection'],
  source: { platform: 'LeetCode', number: 207, url: 'https://leetcode.com/problems/course-schedule/' },

  statement: `There are \`numCourses\` courses labelled \`0..numCourses-1\`. \`prerequisites[i] = [a, b]\` means you must take course \`b\` before course \`a\`.

Return \`true\` if it is possible to finish all courses, otherwise \`false\`.`,
  examples: [
    { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take 0, then 1.' },
    { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: '0 needs 1 and 1 needs 0 — a cycle.' },
  ],
  constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000', 'All pairs are distinct'],

  think: `- When is it impossible to finish? Describe it in graph terms.
- Which courses can you take right now, on day one?
- After taking a course, which other courses might become available?`,
  patternChallenge: {
    options: ['Undirected DFS with parent tracking', 'Bipartite colouring', "Kahn's algorithm (in-degree BFS)", 'Binary Search'],
    answer: 2,
    explanation: 'Finishing everything ⟺ the prerequisite graph has no directed cycle ⟺ Kahn processes all vertices. Undirected cycle detection would misreport diamonds (two prerequisites sharing a prerequisite) as cycles.',
  },
  hints: [
    'Edge b → a for each [a, b]. Count in-degrees. Courses with in-degree 0 can be taken immediately.',
    'Run Kahn and count how many courses you manage to take. Compare with numCourses.',
  ],
  approach: `**Model:** vertices = courses, edge \`b → a\` for each \`[a, b]\`. All courses can be finished ⟺ the graph is a DAG.

**Kahn:** queue all in-degree-0 courses. Pop one, count it, decrement the in-degree of each course that depends on it, and queue those that reach 0. At the end, \`taken === numCourses\` ⟺ no cycle. O(V + E).

**Alternative:** 3-colour DFS; a gray neighbour means a cycle.`,

  functionName: 'canFinish',
  paramNames: ['numCourses', 'prerequisites'],
  starterCode: `/**
 * @param {number} numCourses
 * @param {number[][]} prerequisites
 * @return {boolean}
 */
function canFinish(numCourses, prerequisites) {
  
}
`,
  tests: [
    { scenario: 'Example 1', hint: 'Take 0, then 1.', args: [2, [[1, 0]]], expected: true },
    { scenario: 'Example 2', hint: '0 needs 1 and 1 needs 0 — a cycle, so false.', args: [2, [[1, 0], [0, 1]]], expected: false },
    { scenario: 'Single course', hint: 'One course with no prerequisites can always be finished.', args: [1, []], expected: true },
    { scenario: 'No prerequisites', hint: 'Courses with no edges at all have in-degree 0 and must be counted as taken.', args: [3, []], expected: true },
    { scenario: 'Diamond (not a cycle)', hint: 'Course 3 is reached from 0 by two paths. A single visited flag in DFS mistakes this for a cycle — use three colours or Kahn.', args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: true },
    { scenario: 'Three-course cycle', hint: 'No course has in-degree 0; nothing can even start.', args: [3, [[0, 1], [1, 2], [2, 0]]], expected: false },
    { scenario: 'Cycle reachable from start', hint: 'Course 0 and 4 are fine, but 1 → 2 → 3 → 1 is stuck.', args: [5, [[1, 0], [2, 1], [3, 2], [1, 3], [4, 0]]], expected: false },
    { scenario: 'Max chain (n = 2000)', hint: 'A 1999-edge chain: fine for Kahn; recursive DFS goes 2000 deep.', argsGen: '() => [2000, Array.from({ length: 1999 }, (_, i) => [i + 1, i])]', expected: true },
    { scenario: 'Disconnected cycle', hint: 'Courses 0–1 are fine, but the separate component 2 ⇄ 3 is a cycle; you must check every component.', args: [4, [[1, 0], [3, 2], [2, 3]]], expected: false },
    { scenario: 'Shared prerequisite chain', hint: 'Several courses depend on the same chain — revisiting a finished (black) course is not a cycle.', args: [5, [[1, 0], [2, 1], [3, 1], [4, 2], [4, 3], [3, 0]]], expected: true },
    { scenario: 'Max size random DAG', hint: '2000 courses, ~5000 prerequisites, all pointing from higher to lower labels: no cycle.', argsGen: '() => { const n = 2000; let s = 4; const r = () => (s = (s * 48271) % 2147483647); const seen = new Set(); const p = []; while (p.length < 4999) { let a = r() % n, b = r() % n; if (a === b) continue; if (a < b) [a, b] = [b, a]; if (seen.has(a * n + b)) continue; seen.add(a * n + b); p.push([a, b]); }  return [n, p]; }', expected: true },
    { scenario: 'Max size with one back edge', hint: 'Random DAG edges plus a 2000-long chain and one edge [0,1999] that closes a cycle through every course.', argsGen: '() => { const n = 2000; let s = 6; const r = () => (s = (s * 48271) % 2147483647); const seen = new Set(); const p = []; for (let i = 0; i + 1 < n; i++) { seen.add((i + 1) * n + i); p.push([i + 1, i]); } while (p.length < 4999) { let a = r() % n, b = r() % n; if (a === b) continue; if (a < b) [a, b] = [b, a]; if (seen.has(a * n + b)) continue; seen.add(a * n + b); p.push([a, b]); } p.push([0, n - 1]); for (let i = p.length - 1; i > 0; i--) { const j = r() % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } return [n, p]; }', expected: false },
  ],

  solution: {
    code: `function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  const indeg = new Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);               // pre must come before course
    indeg[course]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  for (let head = 0; head < queue.length; head++) {
    taken++;
    for (const next of adj[queue[head]]) {
      if (--indeg[next] === 0) queue.push(next);
    }
  }
  return taken === numCourses;           // fewer → some courses are stuck on a cycle
}`,
  },
  dryRun: { columns: ['pop', 'decrements', 'queue', 'taken'], rows: [['(start)', 'indeg = [0,1,1,2]', '[0]', '0'], ['0', '1→0, 2→0', '[1, 2]', '1'], ['1', '3: 2→1', '[2]', '2'], ['2', '3: 1→0', '[3]', '3'], ['3', '—', '[]', '4 = n → true']] },
  complexity: { time: 'O(V + E)', space: 'O(V + E)', explanation: 'Each course is queued once; each prerequisite pair is decremented once.' },
  alternative: {
    title: '3-colour DFS',
    md: 'Colour white/gray/black; meeting a gray course means a cycle.',
    code: `function canFinish(numCourses, prerequisites) {
  const adj = Array.from({ length: numCourses }, () => []);
  for (const [c, p] of prerequisites) adj[p].push(c);
  const color = new Uint8Array(numCourses);
  const dfs = (u) => {
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1) return false;
      if (color[v] === 0 && !dfs(v)) return false;
    }
    color[u] = 2;
    return true;
  };
  for (let i = 0; i < numCourses; i++) if (color[i] === 0 && !dfs(i)) return false;
  return true;
}`,
    complexity: 'O(V + E) time, O(V + E) space (recursion up to V deep)',
  },
  mistakes: [
    'Using a single visited flag in DFS — a diamond like test 5 would be reported as a cycle.',
    'Forgetting courses with no prerequisites and no dependants (they have in-degree 0 and must be counted).',
    'Recursive DFS on a 2000-long chain is fine here, but Kahn avoids the concern entirely.',
  ],
};
