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
    vector<int> findRedundantDirectedConnection(vector<vector<int>>& edges) {
        int n = edges.size();
        vector<int> parentOf(n + 1, 0);
        vector<int> cand1, cand2;

        for (auto& e : edges) {
            int u = e[0], v = e[1];
            if (parentOf[v] != 0) {                  // v already has a parent
                cand1 = {parentOf[v], v};            // earlier edge into v
                cand2 = {u, v};                      // later edge into v
            } else {
                parentOf[v] = u;
            }
        }

        UnionFind uf(n + 1);
        for (auto& e : edges) {
            int u = e[0], v = e[1];
            if (!cand2.empty() && u == cand2[0] && v == cand2[1]) continue; // pretend cand2 is removed
            if (!uf.unite(u, v)) {
                return !cand1.empty() ? cand1 : vector<int>{u, v}; // cycle remains
            }
        }
        return cand2;                                // removing cand2 fixed everything
    }
};
