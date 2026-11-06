class Solution {
    public int change(int amount, int[] coins) {
        // Intermediate dp[a] may overflow, but int arithmetic wraps mod 2^32 and the answer fits in an int.
        int[] dp = new int[amount + 1];
        dp[0] = 1;                                // one way to make 0: take nothing
        for (int coin : coins) {                  // coins OUTER -> combinations
            for (int a = coin; a <= amount; a++) { // forwards -> coin can be reused
                dp[a] += dp[a - coin];
            }
        }
        return dp[amount];
    }
}
