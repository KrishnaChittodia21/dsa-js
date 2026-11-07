class Solution {
public:
    int change(int amount, vector<int>& coins) {
        // Intermediate dp[a] may overflow; unsigned wraps mod 2^32 (signed overflow is UB) and the answer fits in an int.
        vector<unsigned> dp(amount + 1, 0);
        dp[0] = 1;                                // one way to make 0: take nothing
        for (int coin : coins) {                  // coins OUTER -> combinations
            for (int a = coin; a <= amount; a++) { // forwards -> coin can be reused
                dp[a] += dp[a - coin];
            }
        }
        return (int)dp[amount];
    }
};
