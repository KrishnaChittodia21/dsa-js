class Solution {
public:
    int combinationSum4(vector<int>& nums, int target) {
        // Intermediate counts can pass 2^64; unsigned arithmetic wraps mod 2^64,
        // so dp[target] is still exact when the answer fits in an int.
        vector<unsigned long long> dp(target + 1, 0);
        dp[0] = 1;                                 // one way to make 0: the empty sequence
        for (int x = 1; x <= target; x++) {        // amount OUTSIDE → order matters
            for (int n : nums) {                   // n = last element of the sequence
                if (n <= x) dp[x] += dp[x - n];
            }
        }
        return (int) dp[target];
    }
};
