class Solution {
    public int minCost(int n, int[] cuts) {
        int m = cuts.length + 2;
        int[] pos = new int[m];
        pos[m - 1] = n;
        int[] sorted = cuts.clone();
        Arrays.sort(sorted);
        System.arraycopy(sorted, 0, pos, 1, sorted.length);
        int[][] dp = new int[m][m];
        for (int len = 2; len < m; len++) {            // number of gaps between the walls
            for (int i = 0; i + len < m; i++) {
                int j = i + len;
                int best = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {      // k = FIRST cut made inside (i, j)
                    best = Math.min(best, dp[i][k] + dp[k][j]);
                }
                dp[i][j] = best + (pos[j] - pos[i]);   // that first cut costs the piece length
            }
        }
        return dp[0][m - 1];
    }
}
