class Solution {
    public int minimumEffortPath(int[][] heights) {
        int R = heights.length, C = heights[0].length;
        int[][] effort = new int[R][C];
        for (int[] row : effort) Arrays.fill(row, Integer.MAX_VALUE);
        effort[0][0] = 0;
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0])); // [effort, r, c]
        heap.add(new int[]{0, 0, 0});
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int e = top[0], r = top[1], c = top[2];
            if (r == R - 1 && c == C - 1) return e;  // popped = final
            if (e > effort[r][c]) continue;          // stale
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
                int ne = Math.max(e, Math.abs(heights[nr][nc] - heights[r][c]));
                if (ne < effort[nr][nc]) {
                    effort[nr][nc] = ne;
                    heap.add(new int[]{ne, nr, nc});
                }
            }
        }
        return 0;
    }
}
