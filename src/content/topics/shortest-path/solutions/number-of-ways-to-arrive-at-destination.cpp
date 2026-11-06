class Solution {
public:
    int countPaths(int n, vector<vector<int>>& roads) {
        const int MOD = 1'000'000'007;
        vector<vector<pair<int, int>>> adj(n);
        for (auto& r : roads) {
            adj[r[0]].push_back({r[1], r[2]});
            adj[r[1]].push_back({r[0], r[2]});
        }

        vector<long long> dist(n, LLONG_MAX);   // path sums can pass 2^31
        vector<int> ways(n, 0);
        dist[0] = 0;
        ways[0] = 1;
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> heap;
        heap.push({0, 0});

        while (!heap.empty()) {
            auto [d, u] = heap.top();
            heap.pop();
            if (d > dist[u]) continue;               // stale — must not count twice
            for (auto [v, t] : adj[u]) {
                long long nd = d + t;
                if (nd < dist[v]) {                  // strictly better: reset count
                    dist[v] = nd;
                    ways[v] = ways[u];
                    heap.push({nd, v});
                } else if (nd == dist[v]) {          // tie: another shortest way
                    ways[v] = (ways[v] + ways[u]) % MOD;
                }
            }
        }
        return ways[n - 1];
    }
};
