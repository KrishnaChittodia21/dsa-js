class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, INT_MAX); // INT_MAX = cannot be made (yet)
        dp[0] = 0;                           // zero coins make 0
        for (int x = 1; x <= amount; x++) {
            for (int c : coins) {
                // c as the LAST coin
                if (c <= x && dp[x - c] != INT_MAX && dp[x - c] + 1 < dp[x]) dp[x] = dp[x - c] + 1;
            }
        }
        return dp[amount] == INT_MAX ? -1 : dp[amount];
    }
};
