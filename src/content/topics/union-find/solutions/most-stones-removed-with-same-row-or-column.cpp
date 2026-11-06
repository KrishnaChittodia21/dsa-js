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
    int removeStones(vector<vector<int>>& stones) {
        const int OFFSET = 10001;                    // columns live in ids 10001..20001
        UnionFind uf(2 * OFFSET);
        for (auto& st : stones) uf.unite(st[0], st[1] + OFFSET);

        unordered_set<int> groups;
        for (auto& st : stones) groups.insert(uf.find(st[0])); // only ids that hold stones
        return (int)stones.size() - (int)groups.size();
    }
};
