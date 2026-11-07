class Solution {
    public int minimumTotal(int[][] triangle) {
        int n = triangle.length;
        int[] dp = triangle[n - 1].clone();   // best from the bottom row = the row itself
        for (int i = n - 2; i >= 0; i--) {
            for (int j = 0; j <= i; j++) {
                dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
}
