class Solution {
public:
    int leastBricks(vector<vector<int>>& wall) {
        unordered_map<long long, int> edges;          // x position -> rows with an edge there
        int maxEdges = 0;
        for (auto& row : wall) {
            long long pos = 0;
            for (size_t i = 0; i + 1 < row.size(); i++) {   // skip the last brick (outer edge)
                pos += row[i];
                maxEdges = max(maxEdges, ++edges[pos]);
            }
        }
        return wall.size() - maxEdges;
    }
};
