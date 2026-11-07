class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % 2 != 0) return false;
        int target = total / 2;
        vector<bool> dp(target + 1, false);       // dp[s] = true if some subset sums to s
        dp[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {   // backwards: x used at most once
                if (dp[s - x]) dp[s] = true;
            }
            if (dp[target]) return true;
        }
        return false;
    }
};
