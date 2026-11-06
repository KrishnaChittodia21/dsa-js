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
    bool equationsPossible(vector<string>& equations) {
        UnionFind uf(26);
        for (auto& e : equations) {
            if (e[1] == '=') uf.unite(e[0] - 'a', e[3] - 'a');                     // pass 1: build groups
        }
        for (auto& e : equations) {
            if (e[1] == '!' && uf.connected(e[0] - 'a', e[3] - 'a')) return false; // pass 2: verify
        }
        return true;
    }
};
