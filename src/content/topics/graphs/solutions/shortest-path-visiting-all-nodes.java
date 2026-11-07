class Solution {
    public int shortestPathLength(int[][] graph) {
        int n = graph.length;
        int full = (1 << n) - 1;
        // seen[node][mask] — have we already reached this exact state?
        boolean[][] seen = new boolean[n][1 << n];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            queue.add(new int[]{i, 1 << i});
            seen[i][1 << i] = true;
        }
        for (int steps = 0; !queue.isEmpty(); steps++) {
            for (int k = queue.size(); k > 0; k--) {
                int[] s = queue.poll();
                int u = s[0], mask = s[1];
                if (mask == full) return steps;
                for (int v : graph[u]) {
                    int m2 = mask | (1 << v);
                    if (!seen[v][m2]) { seen[v][m2] = true; queue.add(new int[]{v, m2}); }
                }
            }
        }
        return -1; // unreachable for a connected graph
    }
}
