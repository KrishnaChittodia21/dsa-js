class Solution {
    public int shortestBridge(int[][] grid) {
        int n = grid.length;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        List<int[]> frontier = new ArrayList<>();

        // 1. mark the first island with 2 and collect its cells (iterative DFS)
        outer:
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 1) continue;
                Deque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{r, c});
                grid[r][c] = 2;
                while (!stack.isEmpty()) {
                    int[] cur = stack.pop();
                    frontier.add(cur);
                    for (int[] d : dirs) {
                        int nr = cur[0] + d[0], nc = cur[1] + d[1];
                        if (nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 1) {
                            grid[nr][nc] = 2;
                            stack.push(new int[]{nr, nc});
                        }
                    }
                }
                break outer;
            }
        }

        // 2. multi-source BFS through water
        for (int flips = 0; !frontier.isEmpty(); flips++) {
            List<int[]> next = new ArrayList<>();
            for (int[] cell : frontier) {
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0], nc = cell[1] + d[1];
                    if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                    if (grid[nr][nc] == 1) return flips;   // reached the other island
                    if (grid[nr][nc] == 0) {
                        grid[nr][nc] = 2;
                        next.add(new int[]{nr, nc});
                    }
                }
            }
            frontier = next;
        }
        return -1;
    }
}
