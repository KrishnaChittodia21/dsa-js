struct UnionFind {
    vector<int> parent, rnk;
    int count;

    UnionFind(int n) : parent(n), rnk(n, 0), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rnk[ra] < rnk[rb]) swap(ra, rb);
        parent[rb] = ra;
        if (rnk[ra] == rnk[rb]) rnk[ra]++;
        count--;
        return true;
    }
};

class Solution {
public:
    int minCostToSupplyWater(int n, vector<int>& wells, vector<vector<int>>& pipes) {
        vector<array<int, 3>> edges;
        for (auto& p : pipes) edges.push_back({p[0], p[1], p[2]});
        for (int i = 1; i <= n; i++) edges.push_back({0, i, wells[i - 1]});   // well = pipe from source 0
        sort(edges.begin(), edges.end(), [](auto& x, auto& y) { return x[2] < y[2]; });

        UnionFind uf(n + 1);   // node 0 is the virtual water source
        int total = 0, used = 0;
        for (auto& [a, b, c] : edges) {
            if (!uf.unite(a, b)) continue;
            total += c;
            if (++used == n) break;            // n + 1 nodes → n edges
        }
        return total;
    }
};
