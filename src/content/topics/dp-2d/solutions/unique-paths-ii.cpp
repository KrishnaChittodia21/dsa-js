class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int n = obstacleGrid[0].size();
        // Cells cut off by obstacles can exceed the answer; unsigned wraps mod 2^32 harmlessly.
        vector<unsigned int> dp(n, 0);
        dp[0] = 1;                                   // one way to "be" at the start
        for (auto& row : obstacleGrid) {
            for (int c = 0; c < n; c++) {
                if (row[c] == 1) dp[c] = 0;          // blocked cell: 0 ways
                else if (c > 0) dp[c] += dp[c - 1];  // above + left
            }
        }
        return (int) dp[n - 1];
    }
};
