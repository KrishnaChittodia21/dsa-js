class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int total = 0;
        int curMax = 0, maxSub = INT_MIN;
        int curMin = 0, minSub = INT_MAX;
        for (int x : nums) {
            total += x;
            curMax = max(x, curMax + x);
            maxSub = max(maxSub, curMax);
            curMin = min(x, curMin + x);
            minSub = min(minSub, curMin);
        }
        // All negative → the wrap formula would pick the empty subarray.
        if (maxSub < 0) return maxSub;
        return max(maxSub, total - minSub);
    }
};
