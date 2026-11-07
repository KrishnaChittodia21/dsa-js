class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int m = dungeon.size(), n = dungeon[0].size();
        vector<int> need(n + 1, INT_MAX);             // need[c] for the row below; need[n] = sentinel
        need[n - 1] = 1;                              // "below the goal": leave with at least 1
        for (int r = m - 1; r >= 0; r--) {
            for (int c = n - 1; c >= 0; c--) {
                int next = min(need[c] /* below */, need[c + 1] /* right */);
                need[c] = max(1, next - dungeon[r][c]);
            }
            need[n] = INT_MAX;                        // keep the sentinel
        }
        return need[0];
    }
};
