class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        // Most "A-favoured" people (A much cheaper than B) first.
        vector<vector<int>> sorted = costs;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& x, const vector<int>& y) {
            return x[0] - x[1] < y[0] - y[1];
        });
        int n = sorted.size() / 2;
        int total = 0;
        for (int i = 0; i < (int)sorted.size(); i++) {
            total += i < n ? sorted[i][0] : sorted[i][1];
        }
        return total;
    }
};
