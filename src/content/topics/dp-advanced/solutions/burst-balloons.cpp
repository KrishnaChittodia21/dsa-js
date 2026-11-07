class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> a(nums);
        a.insert(a.begin(), 1);                     // walls that are never burst
        a.push_back(1);
        int m = a.size();
        vector<vector<int>> dp(m, vector<int>(m, 0));
        for (int len = 2; len < m; len++) {         // len = j − i
            for (int i = 0; i + len < m; i++) {
                int j = i + len;
                int best = 0;
                for (int k = i + 1; k < j; k++) {   // k is the LAST balloon burst in (i, j)
                    int coins = dp[i][k] + dp[k][j] + a[i] * a[k] * a[j];
                    if (coins > best) best = coins;
                }
                dp[i][j] = best;
            }
        }
        return dp[0][m - 1];
    }
};
