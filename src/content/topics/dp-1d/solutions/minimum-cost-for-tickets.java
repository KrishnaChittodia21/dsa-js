class Solution {
    public int mincostTickets(int[] days, int[] costs) {
        int last = days[days.length - 1];
        boolean[] travel = new boolean[last + 1];
        for (int d : days) travel[d] = true;
        int[] dp = new int[last + 1];                // dp[0] = 0: nothing to cover
        for (int d = 1; d <= last; d++) {
            if (!travel[d]) { dp[d] = dp[d - 1]; continue; }  // no travel → no new cost
            dp[d] = Math.min(dp[d - 1] + costs[0],              // 1-day pass covering d
                    Math.min(dp[Math.max(0, d - 7)] + costs[1],  // 7-day pass covering d-6..d
                             dp[Math.max(0, d - 30)] + costs[2])); // 30-day pass covering d-29..d
        }
        return dp[last];
    }
}
