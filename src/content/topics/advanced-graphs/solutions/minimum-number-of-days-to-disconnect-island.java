class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    private int[][] grid;
    private int m, n, time;
    private int[] disc, low;
    private boolean hasCut;

    public int minDays(int[][] grid) {
        this.grid = grid;
        m = grid.length;
        n = grid[0].length;

        // 1. Count land cells and islands
        int land = 0, islands = 0, first = -1;
        boolean[] seen = new boolean[m * n];
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (!isLand(r, c)) continue;
                land++;
                if (seen[r * n + c]) continue;
                islands++;
                if (first == -1) first = r * n + c;
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{r, c});
                seen[r * n + c] = true;
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();
                    for (int[] d : DIRS) {
                        int nx = cell[0] + d[0], ny = cell[1] + d[1];
                        if (isLand(nx, ny) && !seen[nx * n + ny]) { seen[nx * n + ny] = true; stack.push(new int[]{nx, ny}); }
                    }
                }
            }
        }
        if (islands != 1) return 0;
        if (land == 1) return 1;

        // 2. Low-link DFS: does the island have an articulation point?
        disc = new int[m * n];
        low = new int[m * n];
        Arrays.fill(disc, -1);
        time = 0;
        hasCut = false;
        dfs(first, -1);
        return hasCut ? 1 : 2;
    }

    private boolean isLand(int r, int c) {
        return r >= 0 && r < m && c >= 0 && c < n && grid[r][c] == 1;
    }

    private void dfs(int u, int parent) {
        disc[u] = low[u] = time++;
        int r = u / n, c = u % n;
        int children = 0;
        for (int[] d : DIRS) {
            int nr = r + d[0], nc = c + d[1];
            if (!isLand(nr, nc)) continue;
            int v = nr * n + nc;
            if (v == parent) continue;               // grids have no parallel edges
            if (disc[v] == -1) {
                children++;
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) hasCut = true;
            } else {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
        if (parent == -1 && children >= 2) hasCut = true;
    }
}
