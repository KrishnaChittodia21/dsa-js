class Solution {
    public int maxCoins(int[] nums) {
        int m = nums.length + 2;
        int[] a = new int[m];                       // walls that are never burst
        a[0] = a[m - 1] = 1;
        System.arraycopy(nums, 0, a, 1, nums.length);
        int[][] dp = new int[m][m];
        for (int len = 2; len < m; len++) {         // len = j − i
            for (int i = 0; i + len < m; i++) {
                int j = i + len;
                int best = 0;
                for (int k = i + 1; k < j; k++) {   // k is the LAST balloon burst in (i, j)
                    int coins = dp[i][k] + dp[k][j] + a[i] * a[k] * a[j];
                    if (coins > best) best = coins;
                }
                dp[i][j] = best;
            }
        }
        return dp[0][m - 1];
    }
}
