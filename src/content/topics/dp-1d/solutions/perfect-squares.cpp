class Solution {
public:
    int numSquares(int n) {
        vector<int> dp(n + 1, INT_MAX);
        dp[0] = 0;
        for (int x = 1; x <= n; x++) {
            for (int j = 1; j * j <= x; j++) {
                int cand = dp[x - j * j] + 1; // last square used is j*j
                if (cand < dp[x]) dp[x] = cand;
            }
        }
        return dp[n];
    }
};
