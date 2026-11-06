class Solution {
public:
    int shortestPathLength(vector<vector<int>>& graph) {
        int n = graph.size();
        int full = (1 << n) - 1;
        // seen[node][mask] — have we already reached this exact state?
        vector<vector<char>> seen(n, vector<char>(1 << n, 0));
        queue<pair<int, int>> q;
        for (int i = 0; i < n; i++) {
            q.push({i, 1 << i});
            seen[i][1 << i] = 1;
        }
        for (int steps = 0; !q.empty(); steps++) {
            for (int k = q.size(); k > 0; k--) {
                auto [u, mask] = q.front();
                q.pop();
                if (mask == full) return steps;
                for (int v : graph[u]) {
                    int m2 = mask | (1 << v);
                    if (!seen[v][m2]) { seen[v][m2] = 1; q.push({v, m2}); }
                }
            }
        }
        return -1; // unreachable for a connected graph
    }
};
