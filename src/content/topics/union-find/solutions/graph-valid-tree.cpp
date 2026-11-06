struct UnionFind {
    vector<int> parent, sz;
    int count;

    UnionFind(int n) : parent(n), sz(n, 1), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (sz[ra] < sz[rb]) swap(ra, rb);
        parent[rb] = ra;
        sz[ra] += sz[rb];
        count--;
        return true;
    }

    bool connected(int a, int b) {
        return find(a) == find(b);
    }
};

class Solution {
public:
    bool validTree(int n, vector<vector<int>>& edges) {
        if ((int)edges.size() != n - 1) return false; // wrong edge count can never be a tree
        UnionFind uf(n);
        for (auto& e : edges) {
            if (!uf.unite(e[0], e[1])) return false;  // cycle
        }
        return true;                                  // n-1 edges, no cycle → connected
    }
};
