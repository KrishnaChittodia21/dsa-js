class Solution {
public:
    int minStartNodes(int n, vector<vector<int>>& edges) {
        vector<vector<int>> g(n), rg(n);
        for (auto& e : edges) { g[e[0]].push_back(e[1]); rg[e[1]].push_back(e[0]); }

        // Kosaraju pass 1: finishing order (iterative)
        vector<bool> seen(n, false);
        vector<int> order;
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            seen[s] = true;
            vector<pair<int, int>> stack = {{s, 0}};
            while (!stack.empty()) {
                auto& [u, next] = stack.back();
                if (next < (int) g[u].size()) {
                    int v = g[u][next++];
                    if (!seen[v]) { seen[v] = true; stack.push_back({v, 0}); }
                } else { order.push_back(u); stack.pop_back(); }
            }
        }

        // Kosaraju pass 2: component ids on the transpose
        vector<int> comp(n, -1);
        int c = 0;
        for (int i = n - 1; i >= 0; i--) {
            int s = order[i];
            if (comp[s] != -1) continue;
            comp[s] = c;
            vector<int> stack = {s};
            while (!stack.empty()) {
                int u = stack.back();
                stack.pop_back();
                for (int v : rg[u]) if (comp[v] == -1) { comp[v] = c; stack.push_back(v); }
            }
            c++;
        }

        // Condensation: which components have an incoming edge from another component?
        vector<bool> hasIncoming(c, false);
        for (auto& e : edges) {
            if (comp[e[0]] != comp[e[1]]) hasIncoming[comp[e[1]]] = true;
        }
        int sources = 0;
        for (int k = 0; k < c; k++) if (!hasIncoming[k]) sources++;
        return sources;
    }
};
