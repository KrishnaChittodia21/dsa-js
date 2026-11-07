struct UnionFind {
    vector<int> parent, rnk;
    int count;

    UnionFind(int n) : parent(n), rnk(n, 0), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }

    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (rnk[a] < rnk[b]) swap(a, b);
        parent[b] = a;
        if (rnk[a] == rnk[b]) rnk[a]++;
        count--;
        return true;
    }
};

class Solution {
public:
    int secondBestMst(int n, vector<vector<int>>& edges) {
        int m = edges.size();
        // 1. Kruskal: MST weight + which edges were used
        vector<int> order(m);
        iota(order.begin(), order.end(), 0);
        sort(order.begin(), order.end(), [&](int a, int b) { return edges[a][2] < edges[b][2]; });
        UnionFind uf(n);
        vector<bool> inTree(m, false);
        vector<vector<pair<int, int>>> adj(n);
        int best = 0;
        for (int i : order) {
            int u = edges[i][0], v = edges[i][1], w = edges[i][2];
            if (uf.unite(u, v)) {
                inTree[i] = true;
                best += w;
                adj[u].push_back({v, w});
                adj[v].push_back({u, w});
            }
        }
        if (uf.count != 1) return -1;                // disconnected

        // 2. For every source, largest (M1) and strictly second-largest (M2) edge on tree paths
        const int NONE = INT_MIN;                    // stands for -Infinity
        vector<vector<int>> M1(n, vector<int>(n, NONE)), M2(n, vector<int>(n, NONE));
        for (int s = 0; s < n; s++) {
            vector<array<int, 4>> stack = {{s, -1, NONE, NONE}};
            while (!stack.empty()) {
                auto [u, parent, m1, m2] = stack.back();
                stack.pop_back();
                M1[s][u] = m1;
                M2[s][u] = m2;
                for (auto [v, w] : adj[u]) {
                    if (v == parent) continue;
                    int a = m1, b = m2;              // push w into the (max, strict second max) pair
                    if (w > a) { b = a; a = w; }
                    else if (w < a && w > b) b = w;
                    stack.push_back({v, u, a, b});
                }
            }
        }

        // 3. Try every single swap
        int answer = INT_MAX;
        for (int i = 0; i < m; i++) {
            if (inTree[i]) continue;
            int u = edges[i][0], v = edges[i][1], w = edges[i][2];
            if (u == v) continue;                    // a self-loop never helps
            if (w > M1[u][v]) answer = min(answer, best - M1[u][v] + w);
            else if (M2[u][v] != NONE) answer = min(answer, best - M2[u][v] + w);
        }
        return answer == INT_MAX ? -1 : answer;
    }
};
