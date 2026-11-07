class Solution {
public:
    int countSCC(int n, vector<vector<int>>& edges) {
        vector<vector<int>> g(n), rg(n);
        for (auto& e : edges) { g[e[0]].push_back(e[1]); rg[e[1]].push_back(e[0]); }

        // Pass 1: iterative DFS, record nodes in finishing order
        vector<bool> seen(n, false);
        vector<int> order;
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            seen[s] = true;
            vector<pair<int, int>> stack = {{s, 0}};    // {node, index of next neighbour}
            while (!stack.empty()) {
                auto& [u, next] = stack.back();
                if (next < (int) g[u].size()) {
                    int v = g[u][next++];
                    if (!seen[v]) { seen[v] = true; stack.push_back({v, 0}); }
                } else {
                    order.push_back(u);                 // u has finished
                    stack.pop_back();
                }
            }
        }

        // Pass 2: flood fill on the transpose in decreasing finish time
        vector<int> comp(n, -1);
        int count = 0;
        for (int i = n - 1; i >= 0; i--) {
            int s = order[i];
            if (comp[s] != -1) continue;
            comp[s] = count;
            vector<int> stack = {s};
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                for (int v : rg[u]) {
                    if (comp[v] == -1) { comp[v] = count; stack.push_back(v); }
                }
            }
            count++;
        }
        return count;
    }
};
