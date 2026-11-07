class Solution {
public:
    double findMaxAverage(vector<int>& nums, int k) {
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];   // first window

        int maxSum = windowSum;
        for (int right = k; right < (int) nums.size(); right++) {
            windowSum += nums[right] - nums[right - k];     // slide by one
            maxSum = max(maxSum, windowSum);
        }
        return (double) maxSum / k;
    }
};
