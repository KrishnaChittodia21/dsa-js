class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public int longestIncreasingPath(int[][] matrix) {
        int R = matrix.length, C = matrix[0].length;
        // in-degree = number of strictly smaller neighbours (edges go small -> large)
        int[] indeg = new int[R * C];
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                for (int[] d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && matrix[nr][nc] < matrix[r][c]) indeg[r * C + c]++;
                }

        List<Integer> layer = new ArrayList<>();
        for (int i = 0; i < R * C; i++) if (indeg[i] == 0) layer.add(i);
        int length = 0;
        while (!layer.isEmpty()) {
            length++; // one more cell on the longest path
            List<Integer> next = new ArrayList<>();
            for (int id : layer) {
                int r = id / C, c = id % C;
                for (int[] d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nr >= R || nc < 0 || nc >= C || matrix[nr][nc] <= matrix[r][c]) continue;
                    int nid = nr * C + nc;
                    if (--indeg[nid] == 0) next.add(nid);
                }
            }
            layer = next;
        }
        return length;
    }
}
