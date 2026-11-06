class Solution {
public:
    int mincostTickets(vector<int>& days, vector<int>& costs) {
        int last = days.back();
        unordered_set<int> travel(days.begin(), days.end());
        vector<int> dp(last + 1, 0);                 // dp[0] = 0: nothing to cover
        for (int d = 1; d <= last; d++) {
            if (!travel.count(d)) { dp[d] = dp[d - 1]; continue; }  // no travel → no new cost
            dp[d] = min({
                dp[d - 1] + costs[0],                // 1-day pass covering d
                dp[max(0, d - 7)] + costs[1],        // 7-day pass covering d-6..d
                dp[max(0, d - 30)] + costs[2],       // 30-day pass covering d-29..d
            });
        }
        return dp[last];
    }
};
