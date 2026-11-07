class Solution {
    public int orangesRotting(int[][] grid) {
        int R = grid.length, C = grid[0].length;
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (grid[r][c] == 2) queue.add(new int[]{r, c, 0});   // every source at time 0
                else if (grid[r][c] == 1) fresh++;
            }
        }
        int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int r = cur[0], c = cur[1], t = cur[2];
            for (int[] d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] != 1) continue;
                grid[nr][nc] = 2;                 // rot now = visited
                fresh--;
                minutes = t + 1;
                queue.add(new int[]{nr, nc, t + 1});
            }
        }
        return fresh == 0 ? minutes : -1;
    }
}
