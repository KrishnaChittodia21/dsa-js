class Solution {
    public int shortestPath(int[][] grid, int k) {
        int m = grid.length, n = grid[0].length;
        if (k >= m + n - 3) return m + n - 2;      // can bulldoze a straight route

        // best[r][c] = most eliminations left we have had at (r, c); -1 = never
        int[][] best = new int[m][n];
        for (int[] row : best) Arrays.fill(row, -1);
        best[0][0] = k;
        List<int[]> frontier = new ArrayList<>();
        frontier.add(new int[]{0, 0, k});
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        for (int steps = 0; !frontier.isEmpty(); steps++) {
            List<int[]> next = new ArrayList<>();
            for (int[] s : frontier) {
                int r = s[0], c = s[1], left = s[2];
                if (r == m - 1 && c == n - 1) return steps;
                for (int[] d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nc < 0 || nr >= m || nc >= n) continue;
                    int nl = left - grid[nr][nc];
                    if (nl < 0 || nl <= best[nr][nc]) continue;   // impossible or dominated
                    best[nr][nc] = nl;
                    next.add(new int[]{nr, nc, nl});
                }
            }
            frontier = next;
        }
        return -1;
    }
}
