class Solution {
public:
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int, int>>> adj(n + 1);
        for (auto& t : times) adj[t[0]].push_back({t[1], t[2]});

        vector<int> dist(n + 1, INT_MAX);
        dist[k] = 0;
        // min-heap of {distance, node}
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> heap;
        heap.push({0, k});
        int finalized = 0;
        int latest = 0;

        while (!heap.empty()) {
            auto [d, u] = heap.top();
            heap.pop();
            if (d > dist[u]) continue;             // stale entry
            finalized++;
            latest = d;                            // pops are non-decreasing
            for (auto [v, w] : adj[u]) {
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    heap.push({dist[v], v});
                }
            }
        }
        return finalized == n ? latest : -1;
    }
};
