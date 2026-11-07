class Solution {
public:
    bool canPartitionKSubsets(vector<int>& nums, int k) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % k != 0) return false;
        int target = total / k;
        if (*max_element(nums.begin(), nums.end()) > target) return false;
        int n = nums.size();
        int full = (1 << n) - 1;
        vector<int> dp(1 << n, -1);                // fill level of the current bucket
        dp[0] = 0;
        for (int mask = 0; mask <= full; mask++) {
            if (dp[mask] == -1) continue;
            for (int i = 0; i < n; i++) {
                if (mask & (1 << i)) continue;          // item already used
                int next = mask | (1 << i);
                if (dp[next] != -1) continue;           // already reached another way
                if (dp[mask] + nums[i] <= target) {
                    dp[next] = (dp[mask] + nums[i]) % target;   // a full bucket resets to 0
                }
            }
        }
        return dp[full] == 0;
    }
};
