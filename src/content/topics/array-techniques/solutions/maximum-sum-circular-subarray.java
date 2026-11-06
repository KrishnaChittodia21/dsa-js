class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int total = 0;
        int curMax = 0, maxSub = Integer.MIN_VALUE;
        int curMin = 0, minSub = Integer.MAX_VALUE;
        for (int x : nums) {
            total += x;
            curMax = Math.max(x, curMax + x);
            maxSub = Math.max(maxSub, curMax);
            curMin = Math.min(x, curMin + x);
            minSub = Math.min(minSub, curMin);
        }
        // All negative → the wrap formula would pick the empty subarray.
        if (maxSub < 0) return maxSub;
        return Math.max(maxSub, total - minSub);
    }
}
