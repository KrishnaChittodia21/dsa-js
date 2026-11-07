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
    int regionsBySlashes(vector<string>& grid) {
        int n = grid.size();
        UnionFind uf(4 * n * n);

        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                int base = 4 * (r * n + c);          // +0 top, +1 right, +2 bottom, +3 left
                char ch = grid[r][c];
                if (ch == ' ') {
                    uf.unite(base, base + 1);
                    uf.unite(base + 1, base + 2);
                    uf.unite(base + 2, base + 3);
                } else if (ch == '/') {
                    uf.unite(base, base + 3);        // top + left
                    uf.unite(base + 1, base + 2);    // right + bottom
                } else {
                    uf.unite(base, base + 1);        // top + right
                    uf.unite(base + 2, base + 3);    // bottom + left
                }
                if (r + 1 < n) uf.unite(base + 2, 4 * ((r + 1) * n + c));    // bottom ↔ next top
                if (c + 1 < n) uf.unite(base + 1, 4 * (r * n + c + 1) + 3);  // right ↔ next left
            }
        }
        return uf.count;
    }
};
