class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE); // MAX_VALUE = cannot be made (yet)
        dp[0] = 0;                          // zero coins make 0
        for (int x = 1; x <= amount; x++) {
            for (int c : coins) {
                // c as the LAST coin
                if (c <= x && dp[x - c] != Integer.MAX_VALUE && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
            }
        }
        return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
    }
}
