class Solution {
    public int minimumObstacles(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[] dist = new int[m * n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[0] = 0;
        Deque<Integer> dq = new ArrayDeque<>();
        dq.offerLast(0);                           // cells encoded as r * n + c
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!dq.isEmpty()) {
            int u = dq.pollFirst();
            int r = u / n, c = u % n;
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                int w = grid[nr][nc];              // 0 = free, 1 = remove obstacle
                int v = nr * n + nc;
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    if (w == 0) dq.offerFirst(v); else dq.offerLast(v);
                }
            }
        }
        return dist[m * n - 1];
    }
}
