class Solution {
    vector<vector<pair<int, int>>> adj;
    vector<int> disc, low;
    vector<bool> cut;
    int time = 0;

    void dfs(int u, int parentEdge) {
        disc[u] = low[u] = time++;
        int children = 0;
        for (auto [v, id] : adj[u]) {
            if (id == parentEdge) continue;          // skip only the edge we came through
            if (disc[v] == -1) {
                children++;
                dfs(v, id);
                low[u] = min(low[u], low[v]);
                // v's subtree cannot climb above u without passing through u
                if (parentEdge != -1 && low[v] >= disc[u]) cut[u] = true;
            } else {
                low[u] = min(low[u], disc[v]);       // back edge to an ancestor
            }
        }
        if (parentEdge == -1 && children >= 2) cut[u] = true;  // root rule
    }

public:
    vector<int> articulationPoints(int n, vector<vector<int>>& edges) {
        adj.assign(n, {});
        for (int id = 0; id < (int) edges.size(); id++) {
            int u = edges[id][0], v = edges[id][1];
            adj[u].push_back({v, id});
            adj[v].push_back({u, id});
        }

        disc.assign(n, -1);
        low.assign(n, 0);
        cut.assign(n, false);
        time = 0;

        for (int s = 0; s < n; s++) if (disc[s] == -1) dfs(s, -1);
        // scanning 0..n-1 gives the cut vertices already sorted, each once
        vector<int> result;
        for (int i = 0; i < n; i++) if (cut[i]) result.push_back(i);
        return result;
    }
};
