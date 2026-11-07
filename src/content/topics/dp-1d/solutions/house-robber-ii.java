class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        if (n == 1) return nums[0];
        // Skip the last house, or skip the first house.
        return Math.max(line(nums, 0, n - 2), line(nums, 1, n - 1));
    }

    // Linear house robber on nums[lo..hi]
    private int line(int[] nums, int lo, int hi) {
        int prev2 = 0, prev1 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
