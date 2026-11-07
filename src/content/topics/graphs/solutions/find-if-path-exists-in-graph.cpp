class Solution {
public:
    bool validPath(int n, vector<vector<int>>& edges, int source, int destination) {
        vector<vector<int>> adj(n);
        for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }

        vector<bool> visited(n, false);
        vector<int> stack{source};
        visited[source] = true;
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            if (u == destination) return true;
            for (int v : adj[u]) {
                if (!visited[v]) { visited[v] = true; stack.push_back(v); }
            }
        }
        return false;
    }
};
