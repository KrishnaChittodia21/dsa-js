class Solution {
public:
    int longestPalindromeSubseq(string s) {
        int n = s.size();
        vector<int> next(n, 0);                   // dp[i + 1][*]
        for (int i = n - 1; i >= 0; i--) {
            vector<int> cur(n, 0);                // dp[i][*]
            cur[i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (s[i] == s[j]) cur[j] = next[j - 1] + 2;     // dp[i+1][j-1] + 2
                else cur[j] = max(next[j], cur[j - 1]);         // drop s[i] or s[j]
            }
            next = move(cur);
        }
        return next[n - 1];
    }
};
