class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int R = mat.length, C = mat[0].length;
        int[][] dist = new int[R][C];
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < R; r++) {
            Arrays.fill(dist[r], -1);
            for (int c = 0; c < C; c++)
                if (mat[r][c] == 0) { dist[r][c] = 0; queue.add(new int[]{r, c}); }
        }

        int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            int r = cur[0], c = cur[1];
            for (int[] d : DIRS) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= R || nc < 0 || nc >= C || dist[nr][nc] != -1) continue;
                dist[nr][nc] = dist[r][c] + 1;
                queue.add(new int[]{nr, nc});
            }
        }
        return dist;
    }
}
