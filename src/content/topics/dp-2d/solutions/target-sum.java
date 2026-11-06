class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int x : nums) total += x;
        if (Math.abs(target) > total || (total + target) % 2 != 0) return 0;
        int P = (total + target) / 2;             // required sum of the "+" group
        int[] dp = new int[P + 1];                // dp[s] = #subsets with sum s
        dp[0] = 1;                                // the empty subset
        for (int x : nums) {
            for (int s = P; s >= x; s--) {        // backwards: each number once
                dp[s] += dp[s - x];
            }
        }
        return dp[P];
    }
}
