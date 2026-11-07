class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (abs(target) > total || (total + target) % 2 != 0) return 0;
        int P = (total + target) / 2;             // required sum of the "+" group
        vector<int> dp(P + 1, 0);                 // dp[s] = #subsets with sum s
        dp[0] = 1;                                // the empty subset
        for (int x : nums) {
            for (int s = P; s >= x; s--) {        // backwards: each number once
                dp[s] += dp[s - x];
            }
        }
        return dp[P];
    }
};
