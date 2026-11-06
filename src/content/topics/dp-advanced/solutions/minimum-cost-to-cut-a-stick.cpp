class Solution {
public:
    int minCost(int n, vector<int>& cuts) {
        vector<int> pos(cuts);
        sort(pos.begin(), pos.end());
        pos.insert(pos.begin(), 0);
        pos.push_back(n);
        int m = pos.size();
        vector<vector<int>> dp(m, vector<int>(m, 0));
        for (int len = 2; len < m; len++) {            // number of gaps between the walls
            for (int i = 0; i + len < m; i++) {
                int j = i + len;
                int best = INT_MAX;
                for (int k = i + 1; k < j; k++) {      // k = FIRST cut made inside (i, j)
                    best = min(best, dp[i][k] + dp[k][j]);
                }
                dp[i][j] = best + (pos[j] - pos[i]);   // that first cut costs the piece length
            }
        }
        return dp[0][m - 1];
    }
};
