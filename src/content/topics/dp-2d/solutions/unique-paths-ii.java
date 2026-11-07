class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) {
        int n = obstacleGrid[0].length;
        int[] dp = new int[n];
        dp[0] = 1;                                   // one way to "be" at the start
        for (int[] row : obstacleGrid) {
            for (int c = 0; c < n; c++) {
                if (row[c] == 1) dp[c] = 0;          // blocked cell: 0 ways
                else if (c > 0) dp[c] += dp[c - 1];  // above + left
            }
        }
        return dp[n - 1];
    }
}
