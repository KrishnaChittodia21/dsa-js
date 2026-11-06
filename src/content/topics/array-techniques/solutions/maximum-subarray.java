class Solution {
    public int maxSubArray(int[] nums) {
        int cur = nums[0];  // best sum of a subarray ending at the current index
        int best = nums[0]; // best sum anywhere so far
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]); // restart or extend
            best = Math.max(best, cur);
        }
        return best;
    }
}
