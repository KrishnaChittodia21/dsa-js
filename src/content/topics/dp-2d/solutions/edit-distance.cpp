class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<int> dp(n + 1);
        for (int j = 0; j <= n; j++) dp[j] = j;       // row 0: j inserts
        for (int i = 1; i <= m; i++) {
            int diag = dp[0];                         // old dp[i-1][0]
            dp[0] = i;                                // i deletes
            for (int j = 1; j <= n; j++) {
                int up = dp[j];                       // dp[i-1][j] (not yet overwritten)
                if (word1[i - 1] == word2[j - 1]) dp[j] = diag;
                else dp[j] = 1 + min({diag /* replace */, up /* delete */, dp[j - 1] /* insert */});
                diag = up;                            // becomes up-left for column j+1
            }
        }
        return dp[n];
    }
};
