class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int n = matrix[0].size();
        vector<int> dp(n + 1, 0);                 // dp[c+1] = side ending at (r, c); dp[0] is a 0 sentinel
        int best = 0;
        for (const auto& row : matrix) {
            int prevDiag = 0;                     // old dp[c] = top-left for the next column
            for (int c = 0; c < n; c++) {
                int top = dp[c + 1];              // still row r-1
                if (row[c] == '1') {
                    dp[c + 1] = 1 + min({top, dp[c] /* left */, prevDiag});
                    best = max(best, dp[c + 1]);
                } else {
                    dp[c + 1] = 0;
                }
                prevDiag = top;
            }
        }
        return best * best;
    }
};
