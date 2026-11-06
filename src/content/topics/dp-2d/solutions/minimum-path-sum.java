class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[] dp = new int[n];                     // dp[c] = min cost to reach (r, c)
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int r = 0; r < m; r++) {
            dp[0] += grid[r][0];                   // first column: only from above
            for (int c = 1; c < n; c++) {
                dp[c] = grid[r][c] + Math.min(dp[c], dp[c - 1]);
            }
        }
        return dp[n - 1];
    }
}
