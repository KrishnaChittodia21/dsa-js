class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int largestIsland(int[][] grid) {
        int n = grid.length;
        List<Integer> size = new ArrayList<>(List.of(0, 0));   // size.get(id); ids start at 2
        int best = 0;

        // 1. label every island with an id and remember its size
        int id = 2;
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 1) continue;
                int count = 0;
                ArrayDeque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{r, c});
                grid[r][c] = id;
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();
                    count++;
                    for (int[] d : DIRS) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                            grid[nr][nc] = id;
                            stack.push(new int[]{nr, nc});
                        }
                    }
                }
                size.add(count);
                id++;
                best = Math.max(best, count);   // baseline: no flip needed
            }
        }

        // 2. try flipping each 0: join the DISTINCT neighbouring islands
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 0) continue;
                Set<Integer> ids = new HashSet<>();
                for (int[] d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] > 1) ids.add(grid[nr][nc]);
                }
                int total = 1;
                for (int k : ids) total += size.get(k);
                best = Math.max(best, total);
            }
        }
        return best;
    }
}
