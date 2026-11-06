class Solution {
public:
    vector<int> eventualSafeNodes(vector<vector<int>>& graph) {
        int n = graph.size();
        // 0 = unvisited, 1 = visiting OR proven unsafe, 2 = safe
        vector<int> color(n, 0);
        vector<int> result;
        for (int i = 0; i < n; i++) if (isSafe(graph, color, i)) result.push_back(i);
        return result; // already ascending
    }

private:
    bool isSafe(vector<vector<int>>& graph, vector<int>& color, int u) {
        if (color[u] != 0) return color[u] == 2; // gray here = cycle (or known unsafe)
        color[u] = 1;
        for (int v : graph[u]) {
            if (!isSafe(graph, color, v)) return false; // u stays 1 -> unsafe forever
        }
        color[u] = 2;
        return true;
    }
};
