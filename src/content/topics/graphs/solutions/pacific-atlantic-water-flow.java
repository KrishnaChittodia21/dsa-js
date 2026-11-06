class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int[][] pacificAtlantic(int[][] heights) {
        int R = heights.length, C = heights[0].length;
        List<int[]> pacStarts = new ArrayList<>(), atlStarts = new ArrayList<>();
        for (int r = 0; r < R; r++) { pacStarts.add(new int[]{r, 0}); atlStarts.add(new int[]{r, C - 1}); }
        for (int c = 0; c < C; c++) { pacStarts.add(new int[]{0, c}); atlStarts.add(new int[]{R - 1, c}); }
        boolean[][] pac = climb(heights, pacStarts), atl = climb(heights, atlStarts);

        List<int[]> result = new ArrayList<>();
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                if (pac[r][c] && atl[r][c]) result.add(new int[]{r, c});
        return result.toArray(new int[0][]);
    }

    // BFS that CLIMBS from the given border cells; returns a visited grid
    private boolean[][] climb(int[][] heights, List<int[]> starts) {
        int R = heights.length, C = heights[0].length;
        boolean[][] seen = new boolean[R][C];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int[] s : starts) {
            if (!seen[s[0]][s[1]]) { seen[s[0]][s[1]] = true; queue.add(s); }
        }
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];
            for (int[] d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
                if (seen[nr][nc] || heights[nr][nc] < heights[r][c]) continue;
                seen[nr][nc] = true;
                queue.add(new int[]{nr, nc});
            }
        }
        return seen;
    }
}
