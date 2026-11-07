class Solution {
public:
    bool isBipartite(vector<vector<int>>& graph) {
        int n = graph.size();
        vector<int> color(n, -1);
        for (int s = 0; s < n; s++) {
            if (color[s] != -1) continue;          // already handled with its component
            color[s] = 0;
            queue<int> q;
            q.push(s);
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                for (int v : graph[u]) {
                    if (color[v] == -1) {
                        color[v] = 1 - color[u];   // forced opposite colour
                        q.push(v);
                    } else if (color[v] == color[u]) {
                        return false;              // same colour on both ends → odd cycle
                    }
                }
            }
        }
        return true;
    }
};
