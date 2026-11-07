class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int numIslands(char[][] grid) {
        int R = grid.length, C = grid[0].length;
        int islands = 0;
        for (int r = 0; r < R; r++) {
            for (int c = 0; c < C; c++) {
                if (grid[r][c] != '1') continue;
                islands++;
                grid[r][c] = '0';                   // sink on push
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{r, c});
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();
                    for (int[] d : DIRS) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr < 0 || nr >= R || nc < 0 || nc >= C || grid[nr][nc] != '1') continue;
                        grid[nr][nc] = '0';
                        stack.push(new int[]{nr, nc});
                    }
                }
            }
        }
        return islands;
    }
}
