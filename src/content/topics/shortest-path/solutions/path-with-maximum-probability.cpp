class Solution {
public:
    double maxProbability(int n, vector<vector<int>>& edges, vector<double>& succProb, int start, int end) {
        vector<vector<pair<int, double>>> adj(n);
        for (int i = 0; i < (int)edges.size(); i++) {
            int a = edges[i][0], b = edges[i][1];
            adj[a].push_back({b, succProb[i]});
            adj[b].push_back({a, succProb[i]});
        }

        vector<double> best(n, 0);
        best[start] = 1;
        priority_queue<pair<double, int>> heap;    // max-heap of {probability, node}
        heap.push({1, start});

        while (!heap.empty()) {
            auto [p, u] = heap.top();
            heap.pop();
            if (u == end) return p;                // most probable arrival is final
            if (p < best[u]) continue;             // stale
            for (auto [v, q] : adj[u]) {
                double np = p * q;
                if (np > best[v]) {
                    best[v] = np;
                    heap.push({np, v});
                }
            }
        }
        return 0;
    }
};
