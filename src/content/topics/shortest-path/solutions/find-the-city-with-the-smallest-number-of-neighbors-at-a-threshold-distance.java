class Solution {
    public int findTheCity(int n, int[][] edges, int distanceThreshold) {
        final int INF = Integer.MAX_VALUE / 2;     // INF + INF still fits in an int
        int[][] d = new int[n][n];
        for (int i = 0; i < n; i++) {
            Arrays.fill(d[i], INF);
            d[i][i] = 0;
        }
        for (int[] e : edges) {
            int a = e[0], b = e[1], w = e[2];
            d[a][b] = Math.min(d[a][b], w);
            d[b][a] = Math.min(d[b][a], w);
        }

        for (int k = 0; k < n; k++) {              // allowed stop-over, outermost
            for (int i = 0; i < n; i++) {
                if (d[i][k] == INF) continue;      // small speed-up
                for (int j = 0; j < n; j++) {
                    if (d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
                }
            }
        }

        int bestCity = -1, bestCount = Integer.MAX_VALUE;
        for (int i = 0; i < n; i++) {
            int count = 0;
            for (int j = 0; j < n; j++) if (j != i && d[i][j] <= distanceThreshold) count++;
            if (count <= bestCount) {              // <= -> larger index wins ties
                bestCount = count;
                bestCity = i;
            }
        }
        return bestCity;
    }
}
