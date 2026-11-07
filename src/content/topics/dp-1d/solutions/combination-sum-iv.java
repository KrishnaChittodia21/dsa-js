class Solution {
    public int combinationSum4(int[] nums, int target) {
        // Unreachable intermediate counts can pass 2^63; long wraps mod 2^64,
        // so dp[target] is still exact when the answer fits in an int.
        long[] dp = new long[target + 1];
        dp[0] = 1;                                 // one way to make 0: the empty sequence
        for (int x = 1; x <= target; x++) {        // amount OUTSIDE → order matters
            for (int n : nums) {                   // n = last element of the sequence
                if (n <= x) dp[x] += dp[x - n];
            }
        }
        return (int) dp[target];
    }
}
