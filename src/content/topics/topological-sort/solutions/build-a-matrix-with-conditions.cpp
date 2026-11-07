class Solution {
public:
    vector<vector<int>> buildMatrix(int k, vector<vector<int>>& rowConditions, vector<vector<int>>& colConditions) {
        vector<int> rowOrder = topo(k, rowConditions);
        vector<int> colOrder = topo(k, colConditions);
        if (rowOrder.empty() || colOrder.empty()) return {};

        vector<int> colPos(k + 1);
        for (int i = 0; i < k; i++) colPos[colOrder[i]] = i;
        vector<vector<int>> matrix(k, vector<int>(k, 0));
        for (int r = 0; r < k; r++) matrix[r][colPos[rowOrder[r]]] = rowOrder[r];
        return matrix;
    }

private:
    // Kahn over numbers 1..k; returns the order, or empty on a cycle
    vector<int> topo(int k, vector<vector<int>>& conditions) {
        vector<vector<int>> adj(k + 1);
        vector<int> indeg(k + 1, 0);
        for (auto& c : conditions) { adj[c[0]].push_back(c[1]); indeg[c[1]]++; }
        vector<int> order;
        for (int x = 1; x <= k; x++) if (indeg[x] == 0) order.push_back(x);
        for (size_t head = 0; head < order.size(); head++) {
            for (int y : adj[order[head]]) if (--indeg[y] == 0) order.push_back(y);
        }
        return (int)order.size() == k ? order : vector<int>();
    }
};
