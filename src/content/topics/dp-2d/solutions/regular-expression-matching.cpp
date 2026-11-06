class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.size(), n = p.size();
        auto ok = [](char a, char b) { return b == '.' || a == b; };
        // dp[i][j]: s[0..i) matches p[0..j)
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        for (int j = 2; j <= n; j++) {
            if (p[j - 1] == '*') dp[0][j] = dp[0][j - 2];   // "" matches a*b*c*...
        }
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j - 1] == '*') {
                    dp[i][j] = dp[i][j - 2]                                // zero copies of p[j-2]
                        || (ok(s[i - 1], p[j - 2]) && dp[i - 1][j]);      // one more copy, keep "x*"
                } else {
                    dp[i][j] = ok(s[i - 1], p[j - 1]) && dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }
};
