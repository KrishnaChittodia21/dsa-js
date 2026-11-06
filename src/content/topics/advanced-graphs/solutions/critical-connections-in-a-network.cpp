class Solution {
public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {
        vector<vector<pair<int, int>>> adj(n);
        for (int id = 0; id < (int) connections.size(); id++) {
            int a = connections[id][0], b = connections[id][1];
            adj[a].push_back({b, id});
            adj[b].push_back({a, id});
        }

        vector<int> disc(n, -1), low(n, 0);
        vector<vector<int>> bridges;
        int time = 0;

        for (int s = 0; s < n; s++) {
            if (disc[s] != -1) continue;
            disc[s] = low[s] = time++;
            vector<array<int, 3>> stack = {{s, -1, 0}};     // {node, parentEdgeId, next neighbour index}
            while (!stack.empty()) {
                auto& frame = stack.back();
                int u = frame[0];
                if (frame[2] < (int) adj[u].size()) {
                    auto [v, id] = adj[u][frame[2]++];
                    if (id == frame[1]) continue;            // the cable we arrived through
                    if (disc[v] == -1) {                     // tree edge: "recurse"
                        disc[v] = low[v] = time++;
                        stack.push_back({v, id, 0});
                    } else {                                 // back edge to an ancestor
                        low[u] = min(low[u], disc[v]);
                    }
                } else {                                     // u is finished: "return" to parent
                    stack.pop_back();
                    if (!stack.empty()) {
                        int p = stack.back()[0];
                        low[p] = min(low[p], low[u]);
                        if (low[u] > disc[p]) bridges.push_back({p, u});
                    }
                }
            }
        }
        return bridges;
    }
};
