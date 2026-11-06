class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] dp = new boolean[target + 1];   // dp[s] = true if some subset sums to s
        dp[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {   // backwards: x used at most once
                if (dp[s - x]) dp[s] = true;
            }
            if (dp[target]) return true;
        }
        return false;
    }
}
