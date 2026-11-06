class Solution {
    public boolean canPartitionKSubsets(int[] nums, int k) {
        int total = 0, max = 0;
        for (int x : nums) { total += x; max = Math.max(max, x); }
        if (total % k != 0) return false;
        int target = total / k;
        if (max > target) return false;
        int n = nums.length;
        int full = (1 << n) - 1;
        int[] dp = new int[1 << n];                // fill level of the current bucket
        Arrays.fill(dp, -1);
        dp[0] = 0;
        for (int mask = 0; mask <= full; mask++) {
            if (dp[mask] == -1) continue;
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) continue;   // item already used
                int next = mask | (1 << i);
                if (dp[next] != -1) continue;           // already reached another way
                if (dp[mask] + nums[i] <= target) {
                    dp[next] = (dp[mask] + nums[i]) % target;   // a full bucket resets to 0
                }
            }
        }
        return dp[full] == 0;
    }
}
