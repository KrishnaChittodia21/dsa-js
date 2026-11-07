class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<int> dp(n, 1);                    // first row: one way each
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                dp[c] += dp[c - 1];              // above (old dp[c]) + left (new dp[c-1])
            }
        }
        return dp[n - 1];
    }
};
