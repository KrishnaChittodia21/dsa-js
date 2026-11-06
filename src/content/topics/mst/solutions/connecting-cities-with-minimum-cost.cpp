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
    int minimumCost(int n, vector<vector<int>>& connections) {
        if (n == 1) return 0;
        sort(connections.begin(), connections.end(), [](auto& x, auto& y) { return x[2] < y[2]; });
        UnionFind uf(n + 1);   // cities are 1..n
        int total = 0, used = 0;
        for (auto& c : connections) {
            if (uf.unite(c[0], c[1])) {
                total += c[2];
                if (++used == n - 1) return total;
            }
        }
        return -1;
    }
};
