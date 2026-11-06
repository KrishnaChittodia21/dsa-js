class Solution {
    public double findMaxAverage(int[] nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];   // first window

        int maxSum = windowSum;
        for (int right = k; right < nums.length; right++) {
            windowSum += nums[right] - nums[right - k];     // slide by one
            maxSum = Math.max(maxSum, windowSum);
        }
        return (double) maxSum / k;
    }
}
